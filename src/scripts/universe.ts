/**
 * Knowledge universe renderer: the visual language of Cerebro, Digit's institutional intelligence.
 *
 *   - each kind of knowledge is its own "solar system" on a large shell
 *     (Fibonacci-sphere centres, y squashed to 0.75), items placed inside it
 *     deterministically with a radial falloff;
 *   - Canvas 2D perspective projection (k = f / (D + z)), slow auto-yaw;
 *   - focus pulls a node toward the camera, rings it, lights its relationships and
 *     lets everything else recede;
 *   - faint cyan relationship lines; colour is the kind of knowledge.
 *
 * Everything rendered here is synthetic and seeded. Dependency-free. Pauses off-screen
 * and in hidden tabs; renders one still frame under prefers-reduced-motion.
 */

export interface KnowledgeClass {
  key: string;
  name: string;
  color: string;
}

export const CLASSES: KnowledgeClass[] = [
  { key: "knowledge", name: "Knowledge", color: "#36c6ff" },
  { key: "evidence", name: "Evidence", color: "#4fd8b0" },
  { key: "experience", name: "Learning", color: "#f3b968" },
  { key: "procedures", name: "Procedures", color: "#d6e2ff" },
  { key: "organization", name: "Organization", color: "#8f86ff" },
  { key: "governance", name: "Decisions", color: "#ff7aa8" },
];

const CLASS_INDEX = new Map(CLASSES.map((c, i) => [c.key, i]));

export interface GraphNode {
  x: number;
  y: number;
  z: number;
  c: number; // class index
  tier: 0 | 1 | 2; // 0 = hub, 1 = item, 2 = depth/detail
  id?: string;
  title?: string;
}

export interface GraphEdge {
  a: number;
  b: number;
  strong?: boolean;
  label?: string;
}

export interface Graph {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface QuietRect {
  l: number;
  t: number;
  r: number;
  b: number;
}

export interface FocusLabel {
  cls: string;
  title: string;
  /** Shown above the title; defaults to the class name. */
  kind?: string;
}

export interface UniverseOptions {
  graph: Graph;
  /** Centre of the universe in CSS px, relative to the canvas. */
  center: (w: number, h: number) => { x: number; y: number };
  /** Screen radius (CSS px) of the outer shell. */
  radius: (w: number, h: number) => number;
  /** Areas (canvas CSS px) that typography sits on; nodes and lines inside them are quieted. */
  quiet?: () => QuietRect[] | null;
  /** Rotation. */
  yaw?: number;
  pitch?: number;
  spin?: number; // radians per second
  sway?: number; // >0: oscillate yaw by this amplitude instead of rotating
  /** Auto-focus cadence in ms (0 disables). */
  focusEvery?: number;
  focusLabels?: FocusLabel[];
  tip?: HTMLElement | null;
  /** Called whenever the focused node changes (constellation mode drives an inspector with it). */
  onFocus?: (index: number | null) => void;
  /** DOM labels for every titled node (constellation mode). */
  labelLayer?: HTMLElement | null;
  pointerTarget?: HTMLElement | null;
  hoverFocus?: boolean;
  intro?: boolean;
  births?: boolean;
  pulses?: boolean;
  pullDepth?: number;
  /** Strength of the soft luminous core behind each kind of knowledge (0 disables). */
  nebula?: number;
  /** Knowledge accumulates as setGrowth(0..1) rises: hubs first, then everything that connects to them. */
  growth?: boolean;
}

// ---- deterministic randomness ----------------------------------------------------------------

export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Class centres on a shell, exactly as Cerebro lays them out. */
export function classCenters(n: number, R = 230): [number, number, number][] {
  const out: [number, number, number][] = [];
  for (let i = 0; i < n; i++) {
    const phi = Math.acos(1 - (2 * (i + 0.5)) / n);
    const theta = Math.PI * (1 + Math.sqrt(5)) * i;
    out.push([R * Math.sin(phi) * Math.cos(theta), R * Math.cos(phi) * 0.75, R * Math.sin(phi) * Math.sin(theta)]);
  }
  return out;
}

/** A synthetic universe: weighted classes, hubs, local relationships and a few cross-kind bridges. */
export function generateUniverse(opts: { seed: number; count: number; weights: Record<string, number> }): Graph {
  const rand = rng(opts.seed);
  const centers = classCenters(CLASSES.length, 252);
  const total = CLASSES.reduce((s, c) => s + (opts.weights[c.key] ?? 0.5), 0);
  const nodes: GraphNode[] = [];
  const byClass: number[][] = [];

  CLASSES.forEach((cls, ci) => {
    const n = Math.max(6, Math.round((opts.count * (opts.weights[cls.key] ?? 0.5)) / total));
    const [cx, cy, cz] = centers[ci];
    const ids: number[] = [];
    for (let i = 0; i < n; i++) {
      const hub = i < 2 + (n > 40 ? 1 : 0);
      const u = rand(), v = rand(), w = rand();
      const r = hub ? 6 + 26 * w : 16 + 84 * Math.pow(w, 0.42);
      const th = 2 * Math.PI * u, ph = Math.acos(2 * v - 1);
      const tier: 0 | 1 | 2 = hub ? 0 : rand() < 0.34 ? 1 : 2;
      ids.push(nodes.length);
      nodes.push({
        x: cx + r * Math.sin(ph) * Math.cos(th),
        y: cy + r * Math.cos(ph) * 0.8,
        z: cz + r * Math.sin(ph) * Math.sin(th),
        c: ci,
        tier,
      });
    }
    byClass.push(ids);
  });

  const edges: GraphEdge[] = [];
  const seen = new Set<string>();
  const add = (a: number, b: number, strong = false) => {
    if (a === b) return;
    const k = a < b ? `${a}-${b}` : `${b}-${a}`;
    if (seen.has(k)) return;
    seen.add(k);
    edges.push({ a, b, strong });
  };
  const d2 = (a: GraphNode, b: GraphNode) => (a.x - b.x) ** 2 + (a.y - b.y) ** 2 + (a.z - b.z) ** 2;

  // Local relationships: each item links to its nearest kin; hubs gather their system.
  for (const ids of byClass) {
    for (const i of ids) {
      const near = ids.filter((j) => j !== i).sort((p, q) => d2(nodes[i], nodes[p]) - d2(nodes[i], nodes[q]));
      const k = nodes[i].tier === 2 ? 1 : 2;
      near.slice(0, k).forEach((j) => add(i, j));
    }
    const hubs = ids.filter((i) => nodes[i].tier === 0);
    hubs.forEach((h, hi) => hubs.slice(hi + 1).forEach((o) => add(h, o, true)));
    for (const i of ids) {
      if (nodes[i].tier !== 1) continue;
      let best = hubs[0];
      for (const h of hubs) if (d2(nodes[i], nodes[h]) < d2(nodes[i], nodes[best])) best = h;
      if (rand() < 0.55) add(i, best);
    }
  }

  // Cross-kind relationships: evidence supports knowledge, experience shapes procedures, and so on.
  const hubOf = (key: string) => byClass[CLASS_INDEX.get(key)!].filter((i) => nodes[i].tier === 0);
  const bridges: [string, string][] = [
    ["evidence", "knowledge"],
    ["knowledge", "procedures"],
    ["experience", "procedures"],
    ["experience", "knowledge"],
    ["organization", "procedures"],
    ["governance", "organization"],
    ["governance", "procedures"],
    ["evidence", "experience"],
  ];
  for (const [from, to] of bridges) {
    const A = hubOf(from), B = hubOf(to);
    add(A[Math.floor(rand() * A.length)], B[Math.floor(rand() * B.length)], true);
  }
  // A handful of item-level cross links so relationships read as a web, not a set of islands.
  for (let i = 0; i < Math.round(opts.count / 22); i++) {
    const a = Math.floor(rand() * nodes.length);
    const others = nodes
      .map((_, j) => j)
      .filter((j) => nodes[j].c !== nodes[a].c && nodes[j].tier < 2)
      .sort((p, q) => d2(nodes[a], nodes[p]) - d2(nodes[a], nodes[q]));
    if (others[0] !== undefined && nodes[a].tier < 2) add(a, others[0]);
  }

  return { nodes, edges };
}

// ---- renderer ------------------------------------------------------------------------------

const TIER_R = [4.8, 2.9, 1.7];
const TIER_A = [1, 0.85, 0.58];
const D = 900;
const WORLD_R = 340;

interface Pulse {
  from: number;
  to: number;
  t: number;
  dur: number;
  hops: number;
}

const easeInOut = (t: number) => (t < 0.5 ? 2 * t * t : 1 - (-2 * t + 2) ** 2 / 2);
const easeOutCubic = (t: number) => 1 - (1 - t) ** 3;
const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);

function hexToRgb(hex: string): [number, number, number] {
  const v = parseInt(hex.slice(1), 16);
  return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
}

function makeSprite(color: string, size = 64) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  const [r, gg, b] = hexToRgb(color);
  const grad = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  grad.addColorStop(0, `rgba(${r},${gg},${b},0.85)`);
  grad.addColorStop(0.18, `rgba(${r},${gg},${b},0.32)`);
  grad.addColorStop(0.45, `rgba(${r},${gg},${b},0.08)`);
  grad.addColorStop(1, `rgba(${r},${gg},${b},0)`);
  g.fillStyle = grad;
  g.fillRect(0, 0, size, size);
  return c;
}

export class Universe {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private o: Required<Omit<UniverseOptions, "quiet" | "tip" | "onFocus" | "labelLayer" | "pointerTarget">> &
    Pick<UniverseOptions, "quiet" | "tip" | "onFocus" | "labelLayer" | "pointerTarget">;
  private nodes: GraphNode[];
  private edges: GraphEdge[];
  private adj: number[][];
  private n: number;
  // per-node state
  private px: Float32Array;
  private py: Float32Array;
  private pz: Float32Array;
  private pk: Float32Array;
  private focus: Float32Array;
  private flash: Float32Array;
  private born: Float32Array;
  private gate: Float32Array;
  private grown = 1;
  private order: number[];
  private sprites: HTMLCanvasElement[];
  private white: HTMLCanvasElement;
  private rgb: [number, number, number][];
  private labels: (HTMLElement | null)[] = [];
  private labelW: number[] = [];
  private centroids: { x: number; y: number; z: number; c: number; n: number }[] = [];

  private W = 0;
  private H = 0;
  private dpr = 1;
  private raf = 0;
  private last = 0;
  private time = 0;
  private running = false;
  private paused = false;
  private visible = true;
  private reduce: boolean;
  private yaw: number;
  private pitch: number;
  private spinGain = 1;
  private pYaw = 0;
  private pPitch = 0;
  private pYawT = 0;
  private pPitchT = 0;
  private zoom = 1;
  private scroll = 0;
  private alpha = 1;
  private intro = 0;
  private focusId: number | null = null;
  private hoverId: number | null = null;
  private pinnedId: number | null = null;
  private nextFocusAt = 0;
  private focusCursor = 0;
  private labelCursor = new Map<number, number>();
  private pulses: Pulse[] = [];
  private nextAmbientAt = 0;
  private frameCost = 0;
  private lowQuality = false;
  private io?: IntersectionObserver;
  private ro?: ResizeObserver;
  private disposers: (() => void)[] = [];

  constructor(canvas: HTMLCanvasElement, options: UniverseOptions) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: true })!;
    this.o = {
      yaw: 0.6,
      pitch: -0.24,
      spin: 0.045,
      sway: 0,
      focusEvery: 5200,
      focusLabels: [],
      hoverFocus: false,
      intro: true,
      births: false,
      pulses: true,
      pullDepth: 230,
      nebula: 0,
      growth: false,
      ...options,
    } as typeof this.o;
    this.nodes = options.graph.nodes;
    this.edges = options.graph.edges;
    this.n = this.nodes.length;
    this.adj = Array.from({ length: this.n }, () => []);
    for (const e of this.edges) {
      this.adj[e.a].push(e.b);
      this.adj[e.b].push(e.a);
    }
    this.px = new Float32Array(this.n);
    this.py = new Float32Array(this.n);
    this.pz = new Float32Array(this.n);
    this.pk = new Float32Array(this.n);
    this.focus = new Float32Array(this.n);
    this.flash = new Float32Array(this.n);
    this.born = new Float32Array(this.n).fill(-1);
    this.gate = new Float32Array(this.n);
    if (this.o.growth) {
      const gr = rng(41);
      this.nodes.forEach((nd, i) => {
        this.gate[i] = nd.tier === 0 ? 0 : nd.tier === 1 ? 0.04 + gr() * 0.62 : 0.12 + gr() * 0.86;
      });
      this.grown = 0;
    }
    this.order = Array.from({ length: this.n }, (_, i) => i);
    this.sprites = CLASSES.map((c) => makeSprite(c.color));
    this.white = makeSprite("#eafaff");
    this.rgb = CLASSES.map((c) => hexToRgb(c.color));
    this.yaw = this.o.yaw;
    this.pitch = this.o.pitch;
    this.reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (this.reduce || !this.o.intro) this.intro = 1;

    if (this.o.births && !this.reduce) {
      // A few details arrive over the first minute: the universe visibly accumulates.
      const r = rng(97);
      this.nodes.forEach((nd, i) => {
        if (nd.tier === 2 && r() < 0.16) this.born[i] = 4 + r() * 70;
      });
    }

    const acc = CLASSES.map((_, c) => ({ x: 0, y: 0, z: 0, c, n: 0 }));
    for (const nd of this.nodes) {
      const a = acc[nd.c];
      a.x += nd.x;
      a.y += nd.y;
      a.z += nd.z;
      a.n++;
    }
    this.centroids = acc.filter((a) => a.n > 0).map((a) => ({ ...a, x: a.x / a.n, y: a.y / a.n, z: a.z / a.n }));
    if (this.o.labelLayer) this.buildLabels(this.o.labelLayer);
    this.bind();
    this.resize();
  }

  // ---- public ---------------------------------------------------------------------------------

  setScroll(p: number) {
    this.scroll = clamp01(p);
    if (!this.running) this.frame(performance.now());
  }

  /** Growth (0..1) for growth mode: how much of the universe has accumulated. */
  setGrowth(p: number) {
    this.grown = clamp01(p);
    if (!this.running) this.frame(performance.now());
  }

  /** Stop or resume ambient movement (rotation, pulses, automatic focus). Interaction still works. */
  setPaused(p: boolean) {
    this.paused = p;
    if (p) this.pulses.length = 0;
    this.kick();
  }

  /** Make sure a frame is coming: restarts the loop if it was idle. */
  private kick() {
    if (this.reduce) {
      this.renderStill();
      return;
    }
    this.updateRunning();
  }

  /** Focus a node explicitly (constellation inspector); null resumes the automatic cycle. */
  pin(index: number | null) {
    this.pinnedId = index;
    if (index !== null) this.setFocus(index, true);
    else this.nextFocusAt = this.time + 1.2;
    this.kick();
  }

  destroy() {
    cancelAnimationFrame(this.raf);
    this.io?.disconnect();
    this.ro?.disconnect();
    this.disposers.forEach((d) => d());
  }

  // ---- setup ----------------------------------------------------------------------------------

  private bind() {
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(this.canvas);

    this.io = new IntersectionObserver(
      (entries) => {
        this.visible = entries[0]?.isIntersecting ?? true;
        this.updateRunning();
      },
      { rootMargin: "120px" },
    );
    this.io.observe(this.canvas);

    const onVis = () => this.updateRunning();
    document.addEventListener("visibilitychange", onVis);
    this.disposers.push(() => document.removeEventListener("visibilitychange", onVis));

    const target = this.o.pointerTarget;
    if (target && !this.reduce && window.matchMedia("(pointer: fine)").matches) {
      const onMove = (e: PointerEvent) => {
        const r = this.canvas.getBoundingClientRect();
        const nx = (e.clientX - r.left) / r.width - 0.5;
        const ny = (e.clientY - r.top) / r.height - 0.5;
        this.pYawT = nx * 0.32;
        this.pPitchT = ny * 0.16;
        if (this.o.hoverFocus) this.hoverPick(e.clientX - r.left, e.clientY - r.top, e.target as Element);
        if (this.paused) this.kick();
      };
      const onLeave = () => {
        this.pYawT = 0;
        this.pPitchT = 0;
        if (this.hoverId !== null) this.hoverId = null;
        if (this.paused) this.kick();
      };
      const onClick = (e: MouseEvent) => {
        if (this.hoverId === null || !this.o.onFocus) return;
        if ((e.target as Element).closest("a, button, [data-no-pick]")) return;
        this.select(this.hoverId);
      };
      target.addEventListener("pointermove", onMove, { passive: true });
      target.addEventListener("pointerleave", onLeave);
      target.addEventListener("click", onClick);
      this.disposers.push(() => {
        target.removeEventListener("pointermove", onMove);
        target.removeEventListener("pointerleave", onLeave);
        target.removeEventListener("click", onClick);
      });
    }
  }

  private buildLabels(layer: HTMLElement) {
    layer.textContent = "";
    // Label widths drive collision avoidance; measure again once the real typeface has loaded.
    document.fonts?.ready.then(() => {
      this.labelW = [];
    });
    this.labels = this.nodes.map((nd, i) => {
      if (!nd.title) return null;
      const el = document.createElement("button");
      el.type = "button";
      el.className = "u-label";
      el.tabIndex = -1;
      el.setAttribute("aria-hidden", "true");
      el.style.setProperty("--c", CLASSES[nd.c].color);
      el.innerHTML = `<i></i><span></span>`;
      el.querySelector("span")!.textContent = nd.title;
      el.addEventListener("click", () => this.o.onFocus && this.select(i));
      el.addEventListener("pointerenter", () => {
        this.hoverId = i;
        this.setFocus(i);
        this.kick();
      });
      el.addEventListener("pointerleave", () => {
        if (this.hoverId === i) this.hoverId = null;
        this.kick();
      });
      layer.appendChild(el);
      return el;
    });
  }

  private select(i: number) {
    this.pin(i);
    this.o.onFocus?.(i);
  }

  private resize() {
    const r = this.canvas.getBoundingClientRect();
    // Large canvases render at up to 1.5x: the soft, glowing subject loses nothing visible and the pixel work
    // drops by almost half on retina displays.
    const area = r.width * r.height;
    const dpr = Math.min(window.devicePixelRatio || 1, area > 1_600_000 ? 1.25 : area > 700_000 ? 1.5 : 2);
    this.W = Math.max(1, r.width);
    this.H = Math.max(1, r.height);
    this.dpr = dpr;
    this.canvas.width = Math.round(this.W * dpr);
    this.canvas.height = Math.round(this.H * dpr);
    if (this.reduce) this.renderStill();
    else if (!this.running) this.frame(performance.now());
  }

  private updateRunning() {
    const should = this.visible && document.visibilityState === "visible" && !this.reduce;
    if (should && !this.running) {
      this.running = true;
      this.last = performance.now();
      this.raf = requestAnimationFrame((t) => this.loop(t));
    } else if (!should && this.running) {
      this.running = false;
      cancelAnimationFrame(this.raf);
    }
    if (this.reduce) this.renderStill();
  }

  private renderStill() {
    // One composed frame: a focused node, its relationships lit, the label shown.
    if (this.focusId === null) {
      const first = this.pinnedId ?? this.pickFocus();
      if (first !== null) {
        this.focusId = first;
        this.focus[first] = 1;
        this.applyLabel(first);
      }
    }
    if (this.pinnedId !== null && this.focusId !== this.pinnedId) {
      this.focus.fill(0);
      this.focusId = this.pinnedId;
      this.focus[this.pinnedId] = 1;
      this.applyLabel(this.pinnedId);
    }
    this.draw(0);
  }

  // ---- loop -----------------------------------------------------------------------------------

  private loop(now: number) {
    if (!this.running) return;
    this.frame(now);
    if (this.paused && this.settled()) {
      // Nothing is moving: hold the still frame until the next interaction.
      this.running = false;
      return;
    }
    this.raf = requestAnimationFrame((t) => this.loop(t));
  }

  private settled() {
    const target = this.hoverId ?? this.pinnedId ?? this.focusId;
    for (let i = 0; i < this.n; i++) {
      const goal = i === target ? 1 : 0;
      if (Math.abs(this.focus[i] - goal) > 0.003 || this.flash[i] > 0.003) return false;
    }
    return Math.abs(this.pYaw - this.pYawT) < 0.001 && Math.abs(this.pPitch - this.pPitchT) < 0.001;
  }

  private frame(now: number) {
    const dt = Math.min(0.05, Math.max(0, (now - this.last) / 1000));
    this.last = now;
    const t0 = performance.now();
    this.step(dt);
    this.draw(dt);
    // Adaptive quality: if frames get expensive, drop the most costly decoration.
    const cost = performance.now() - t0;
    this.frameCost = this.frameCost * 0.95 + cost * 0.05;
    if (!this.lowQuality && this.time > 3 && this.frameCost > 9) this.lowQuality = true;
  }

  private step(dt: number) {
    if (this.reduce) return;
    this.time += dt;
    const t = this.time;
    if (this.intro < 1) this.intro = Math.min(1, this.intro + dt / 2.8);

    // Spin slows while something is in focus so a focused node never slides out from under its label.
    const engaged = this.focusId !== null && this.focus[this.focusId] > 0.3;
    const gainT = this.pinnedId !== null || this.hoverId !== null ? 0 : engaged ? 0.3 : 1;
    this.spinGain += (gainT - this.spinGain) * Math.min(1, dt * 2.2);
    if (!this.paused) {
      if (this.o.sway > 0) {
        this.yaw = this.o.yaw + Math.sin(t * this.o.spin) * this.o.sway;
      } else {
        this.yaw += this.o.spin * dt * this.spinGain;
      }
    }

    const ease = Math.min(1, dt * 2.4);
    this.pYaw += (this.pYawT - this.pYaw) * ease;
    this.pPitch += (this.pPitchT - this.pPitch) * ease;

    // Focus cycle.
    if (!this.paused && this.pinnedId === null && this.hoverId === null && this.o.focusEvery > 0 && t >= this.nextFocusAt && this.intro > 0.7) {
      const next = this.pickFocus();
      if (next !== null) this.setFocus(next);
      this.nextFocusAt = t + this.o.focusEvery / 1000;
    }
    const target = this.hoverId ?? this.pinnedId ?? this.focusId;
    for (let i = 0; i < this.n; i++) {
      const goal = i === target ? 1 : 0;
      const f = this.focus[i];
      if (f !== goal) {
        const nf = f + (goal - f) * Math.min(1, dt * (goal ? 3.2 : 2.2));
        this.focus[i] = Math.abs(nf - goal) < 0.002 ? goal : nf;
      }
      if (this.flash[i] > 0) this.flash[i] = Math.max(0, this.flash[i] - dt * 1.6);
    }

    // Births: new knowledge arrives and gets connected.
    if (this.o.births) {
      for (let i = 0; i < this.n; i++) {
        const b = this.born[i];
        if (b > 0 && t >= b && t - dt < b) {
          this.flash[i] = 1;
          const from = this.adj[i][0];
          if (from !== undefined) this.spawn(from, i, 0);
        }
      }
    }

    // Pulses travel along relationships; some propagate onward.
    if (this.o.pulses && !this.paused) {
      for (let p = this.pulses.length - 1; p >= 0; p--) {
        const pu = this.pulses[p];
        pu.t += dt / pu.dur;
        if (pu.t >= 1) {
          this.flash[pu.to] = Math.max(this.flash[pu.to], 0.9);
          this.pulses.splice(p, 1);
          if (pu.hops > 0 && Math.random() < 0.55) {
            const nb = this.adj[pu.to].filter((j) => j !== pu.from);
            if (nb.length) this.spawn(pu.to, nb[Math.floor(Math.random() * nb.length)], pu.hops - 1);
          }
        }
      }
      if (t >= this.nextAmbientAt && this.pulses.length < (this.lowQuality ? 5 : 10)) {
        const e = this.edges[Math.floor(Math.random() * this.edges.length)];
        if (e && (e.strong || Math.random() < 0.45)) {
          const fwd = Math.random() < 0.5;
          this.spawn(fwd ? e.a : e.b, fwd ? e.b : e.a, 2);
        }
        this.nextAmbientAt = t + 0.55 + Math.random() * 0.9;
      }
    }
  }

  private spawn(from: number, to: number, hops: number) {
    if (this.pulses.length > 18 || this.paused) return;
    const dx = this.nodes[from].x - this.nodes[to].x;
    const dy = this.nodes[from].y - this.nodes[to].y;
    const dz = this.nodes[from].z - this.nodes[to].z;
    const len = Math.sqrt(dx * dx + dy * dy + dz * dz);
    this.pulses.push({ from, to, t: 0, dur: 0.6 + len / 210, hops });
  }

  private setFocus(i: number, immediate = false) {
    if (this.focusId === i && !immediate) return;
    this.focusId = i;
    if (this.o.pulses && !this.reduce) {
      this.adj[i].slice(0, 6).forEach((j, k) => {
        setTimeout(() => this.spawn(i, j, 1), 260 + k * 140);
      });
    }
    this.applyLabel(i);
  }

  private applyLabel(i: number) {
    const tip = this.o.tip;
    if (!tip) return;
    const nd = this.nodes[i];
    const cls = CLASSES[nd.c];
    let title = nd.title;
    let kindName = cls.name;
    if (!title) {
      const pool = this.o.focusLabels.filter((l) => l.cls === cls.key);
      if (pool.length) {
        const k = this.labelCursor.get(nd.c) ?? 0;
        const label = pool[k % pool.length];
        title = label.title;
        kindName = label.kind ?? cls.name;
        this.labelCursor.set(nd.c, k + 1);
      }
    }
    const kind = tip.querySelector<HTMLElement>("[data-kind]");
    const ttl = tip.querySelector<HTMLElement>("[data-title]");
    if (kind) kind.textContent = kindName;
    if (ttl) ttl.textContent = title ?? "";
    tip.style.setProperty("--c", cls.color);
  }

  /** Choose the next node to bring forward: a hub or item facing the camera, outside the text, kinds in rotation. */
  private pickFocus(): number | null {
    this.project();
    const quiet = this.o.quiet?.() ?? null;
    const wantClass = this.focusCursor % CLASSES.length;
    let best: number | null = null;
    let bestScore = -Infinity;
    for (let i = 0; i < this.n; i++) {
      const nd = this.nodes[i];
      if (nd.tier === 2 || this.born[i] > this.time) continue;
      if (this.o.growth && this.gate[i] > this.grown - 0.05) continue;
      if (this.o.focusLabels.length && !this.o.focusLabels.some((l) => l.cls === CLASSES[nd.c].key) && !nd.title) continue;
      const x = this.px[i], y = this.py[i];
      if (x < this.W * 0.08 || x > this.W * 0.86 || y < this.H * 0.16 || y > this.H * 0.82) continue;
      if (quiet && quiet.some((q) => x > q.l - 60 && x < q.r + 60 && y > q.t - 60 && y < q.b + 60)) continue;
      if (i === this.focusId) continue;
      let score = -this.pz[i] / 200 + (nd.c === wantClass ? 2 : 0) + (nd.tier === 0 ? 0.6 : 0) + Math.random() * 0.8;
      score += Math.min(this.adj[i].length, 5) * 0.12;
      if (score > bestScore) {
        bestScore = score;
        best = i;
      }
    }
    this.focusCursor++;
    return best;
  }

  private hoverPick(x: number, y: number, target: Element) {
    if (target.closest(".u-label")) return; // labels manage their own hover
    if (target.closest("a, button, h1, p, [data-no-pick]")) {
      if (this.hoverId !== null) this.hoverId = null;
      return;
    }
    let best: number | null = null;
    let bestD = 22;
    for (let i = 0; i < this.n; i++) {
      if (this.nodes[i].tier === 2) continue;
      const d = Math.hypot(this.px[i] - x, this.py[i] - y);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    }
    if (best === null) {
      if (this.hoverId !== null) {
        // hysteresis: hold the hovered node while the pointer is still near it
        const h = this.hoverId;
        if (Math.hypot(this.px[h] - x, this.py[h] - y) > 40) this.hoverId = null;
      }
      return;
    }
    if (best !== this.hoverId) {
      this.hoverId = best;
      this.setFocus(best);
    }
  }

  // ---- projection & drawing ------------------------------------------------------------------

  private project() {
    const { W, H } = this;
    const c = this.o.center(W, H);
    const introE = easeOutCubic(this.intro);
    const zoom = this.zoom * (0.78 + 0.22 * introE) * (1 + 0.28 * this.scroll);
    const f = (this.o.radius(W, H) * D * zoom) / WORLD_R;
    const yaw = this.yaw + this.pYaw + (1 - introE) * 0.9;
    const pitch = this.pitch + this.pPitch;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    const cx0 = c.x, cy0 = c.y - this.scroll * H * 0.1;
    const pull = this.o.pullDepth;
    for (let i = 0; i < this.n; i++) {
      const nd = this.nodes[i];
      const x1 = nd.x * cy - nd.z * sy;
      const z1 = nd.x * sy + nd.z * cy;
      const y2 = nd.y * cp - z1 * sp;
      const z2 = nd.y * sp + z1 * cp;
      const k = f / (D + z2);
      const kf = f / (D + z2 - pull * this.focus[i]);
      this.px[i] = cx0 + x1 * k;
      this.py[i] = cy0 + y2 * k;
      this.pz[i] = z2 - pull * this.focus[i];
      this.pk[i] = kf;
    }
  }

  private draw(_dt: number) {
    const { ctx, W, H, dpr } = this;
    this.project();
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, W, H);

    const introE = easeOutCubic(this.intro);
    this.alpha = introE * (1 - 0.92 * this.scroll);
    if (this.alpha <= 0.01) {
      this.positionTip(null);
      return;
    }
    const kBase = (this.o.radius(W, H) * D) / WORLD_R / D; // k at z = 0, before focus
    if (this.o.nebula) this.drawNebulae(kBase);
    const quiet = this.o.quiet?.() ?? null;
    const quietAt = (x: number, y: number) => {
      if (!quiet || !quiet.length) return 1;
      let d = Infinity;
      for (const q of quiet) {
        const dx = Math.max(q.l - x, 0, x - q.r);
        const dy = Math.max(q.t - y, 0, y - q.b);
        d = Math.min(d, Math.sqrt(dx * dx + dy * dy));
        if (d === 0) break;
      }
      return d >= 56 ? 1 : 0.14 + 0.86 * (d / 56);
    };

    let maxF = 0;
    let fid: number | null = null;
    for (let i = 0; i < this.n; i++) {
      if (this.focus[i] > maxF) {
        maxF = this.focus[i];
        fid = i;
      }
    }
    const near = fid !== null ? this.adj[fid] : [];
    const isNear = (i: number) => near.includes(i);
    const bornA = (i: number) => {
      const b = this.born[i];
      const ba = b < 0 ? 1 : clamp01((this.time - b) / 2.2);
      return this.o.growth ? Math.min(ba, clamp01((this.grown - this.gate[i]) / 0.08)) : ba;
    };

    // Relationships (depth-bucketed into a few paths to keep draw calls low).
    ctx.lineCap = "round";
    const buckets: number[][] = [[], [], [], []];
    const hot: number[] = [];
    for (let e = 0; e < this.edges.length; e++) {
      const { a, b } = this.edges[e];
      const fe = Math.max(this.focus[a], this.focus[b]);
      if (fe > 0.03) {
        hot.push(e);
        continue;
      }
      const depth = clamp01(((this.pk[a] + this.pk[b]) / 2 / kBase - 0.7) / 0.6);
      buckets[Math.min(3, Math.floor(depth * 4))].push(e);
    }
    const dimBase = this.edges.length > 500 ? 0.085 : 0.11;
    for (let bi = 0; bi < 4; bi++) {
      const list = buckets[bi];
      if (!list.length) continue;
      const a0 = (dimBase + bi * 0.04) * (1 - 0.55 * maxF) * this.alpha;
      ctx.strokeStyle = `rgba(120,190,255,${a0.toFixed(3)})`;
      ctx.lineWidth = 0.7 + bi * 0.12;
      ctx.beginPath();
      for (const e of list) {
        const { a, b, strong } = this.edges[e];
        const q = quietAt((this.px[a] + this.px[b]) / 2, (this.py[a] + this.py[b]) / 2) * Math.min(bornA(a), bornA(b));
        if (q < 0.5) continue;
        if (strong && bi < 2) continue; // strong links get drawn brighter below
        ctx.moveTo(this.px[a], this.py[a]);
        ctx.lineTo(this.px[b], this.py[b]);
      }
      ctx.stroke();
    }
    // Strong (cross-kind) relationships, slightly brighter.
    ctx.lineWidth = 0.9;
    ctx.strokeStyle = `rgba(130,205,255,${(0.15 * (1 - 0.5 * maxF) * this.alpha).toFixed(3)})`;
    ctx.beginPath();
    for (const e of this.edges) {
      if (!e.strong || this.focus[e.a] > 0.03 || this.focus[e.b] > 0.03) continue;
      const q = quietAt((this.px[e.a] + this.px[e.b]) / 2, (this.py[e.a] + this.py[e.b]) / 2) * Math.min(bornA(e.a), bornA(e.b));
      if (q < 0.5) continue;
      ctx.moveTo(this.px[e.a], this.py[e.a]);
      ctx.lineTo(this.px[e.b], this.py[e.b]);
    }
    ctx.stroke();
    // Focused relationships, lit.
    for (const e of hot) {
      const { a, b } = this.edges[e];
      if (Math.min(bornA(a), bornA(b)) < 0.5) continue;
      const fe = Math.max(this.focus[a], this.focus[b]);
      const g = ctx.createLinearGradient(this.px[a], this.py[a], this.px[b], this.py[b]);
      const fa = this.focus[a] >= this.focus[b];
      g.addColorStop(0, `rgba(140,225,255,${((fa ? 0.85 : 0.25) * fe * this.alpha).toFixed(3)})`);
      g.addColorStop(1, `rgba(140,225,255,${((fa ? 0.25 : 0.85) * fe * this.alpha).toFixed(3)})`);
      ctx.strokeStyle = g;
      ctx.lineWidth = 0.8 + 1.1 * fe;
      ctx.beginPath();
      ctx.moveTo(this.px[a], this.py[a]);
      ctx.lineTo(this.px[b], this.py[b]);
      ctx.stroke();
    }

    // Nodes, far to near; focused last.
    this.order.sort((p, q) => this.focus[p] - this.focus[q] || this.pz[q] - this.pz[p]);
    for (const i of this.order) {
      const nd = this.nodes[i];
      const ba = bornA(i);
      if (ba <= 0) continue;
      const fo = this.focus[i];
      const fl = this.flash[i];
      const k = this.pk[i];
      const depth = clamp01((k / kBase - 0.62) / 0.75);
      const x = this.px[i], y = this.py[i];
      if (x < -40 || x > W + 40 || y < -40 || y > H + 40) continue;
      const recede = fid !== null && i !== fid ? (isNear(i) ? 0.15 : 0.6) * maxF : 0;
      const q = fo > 0.1 ? 1 : quietAt(x, y);
      const a =
        Math.max((0.34 + 0.66 * depth) * TIER_A[nd.tier] * (1 - recede) * q, fo) * this.alpha * ba;
      if (a < 0.015) continue;
      const r = Math.max(0.9, TIER_R[nd.tier] * (k / kBase)) * (1 + 1.15 * fo + 0.5 * fl);

      // glow
      if (nd.tier < 2 || fo > 0.05 || fl > 0.05) {
        if (!(this.lowQuality && nd.tier === 1 && fo < 0.05 && fl < 0.05)) {
          const gs = r * (nd.tier === 0 ? 9 : 7) * (1 + 0.6 * fo + 0.8 * fl);
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = Math.min(1, a * (nd.tier === 0 ? 0.7 : 0.5) + fl * 0.5);
          ctx.drawImage(this.sprites[nd.c], x - gs / 2, y - gs / 2, gs, gs);
          ctx.globalCompositeOperation = "source-over";
        }
      }
      // core
      const [cr, cg, cb] = this.rgb[nd.c];
      ctx.globalAlpha = Math.min(1, a);
      ctx.fillStyle = fl > 0.4 ? `rgb(${Math.min(255, cr + 70)},${Math.min(255, cg + 70)},${Math.min(255, cb + 70)})` : CLASSES[nd.c].color;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
      if (nd.tier === 0 && fo < 0.05) {
        ctx.globalAlpha = Math.min(1, a) * 0.85;
        ctx.fillStyle = "#f4fbff";
        ctx.beginPath();
        ctx.arc(x, y, r * 0.38, 0, Math.PI * 2);
        ctx.fill();
      }
      // focus ring, as in Cerebro
      if (fo > 0.02) {
        ctx.globalAlpha = fo * this.alpha;
        ctx.strokeStyle = "#eafaff";
        ctx.lineWidth = 1.2;
        ctx.beginPath();
        ctx.arc(x, y, r + 4 + 4 * fo, 0, Math.PI * 2);
        ctx.stroke();
        ctx.globalAlpha = fo * 0.35 * this.alpha;
        ctx.beginPath();
        ctx.arc(x, y, r + 12 + 10 * fo, 0, Math.PI * 2);
        ctx.stroke();
      }
    }
    ctx.globalAlpha = 1;

    // Pulses
    if (this.o.pulses && !this.reduce) {
      ctx.globalCompositeOperation = "lighter";
      for (const pu of this.pulses) {
        if (Math.min(bornA(pu.from), bornA(pu.to)) < 0.5) continue;
        const e = easeInOut(clamp01(pu.t));
        const x = this.px[pu.from] + (this.px[pu.to] - this.px[pu.from]) * e;
        const y = this.py[pu.from] + (this.py[pu.to] - this.py[pu.from]) * e;
        const q = quietAt(x, y);
        if (q < 0.4) continue;
        const k = this.pk[pu.from] + (this.pk[pu.to] - this.pk[pu.from]) * e;
        const s = 16 * (k / kBase);
        const fade = Math.sin(Math.PI * clamp01(pu.t));
        ctx.globalAlpha = 0.9 * fade * this.alpha * q;
        ctx.drawImage(this.white, x - s / 2, y - s / 2, s, s);
        ctx.drawImage(this.sprites[this.nodes[pu.to].c], x - s, y - s, s * 2, s * 2);
      }
      ctx.globalCompositeOperation = "source-over";
      ctx.globalAlpha = 1;
    }

    this.positionTip(fid !== null && maxF > 0.05 ? fid : null);
    this.positionLabels(fid);
  }

  private drawNebulae(kBase: number) {
    const { ctx, W, H } = this;
    const c = this.o.center(W, H);
    const introE = easeOutCubic(this.intro);
    const zoom = this.zoom * (0.78 + 0.22 * introE) * (1 + 0.28 * this.scroll);
    const f = (this.o.radius(W, H) * D * zoom) / WORLD_R;
    const yaw = this.yaw + this.pYaw + (1 - introE) * 0.9;
    const pitch = this.pitch + this.pPitch;
    const cy = Math.cos(yaw), sy = Math.sin(yaw), cp = Math.cos(pitch), sp = Math.sin(pitch);
    ctx.globalCompositeOperation = "lighter";
    for (const g of this.centroids) {
      const x1 = g.x * cy - g.z * sy;
      const z1 = g.x * sy + g.z * cy;
      const y2 = g.y * cp - z1 * sp;
      const z2 = g.y * sp + z1 * cp;
      const k = f / (D + z2);
      const x = c.x + x1 * k, y = c.y - this.scroll * H * 0.1 + y2 * k;
      const depth = clamp01((k / kBase - 0.62) / 0.75);
      const size = 340 * k;
      ctx.globalAlpha = (0.15 + 0.17 * depth) * this.alpha * this.o.nebula * (this.o.growth ? 0.3 + 0.7 * this.grown : 1);
      ctx.drawImage(this.sprites[g.c], x - size / 2, y - size / 2, size, size);
    }
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
  }

  private positionTip(i: number | null) {
    const tip = this.o.tip;
    if (!tip) return;
    if (i === null) {
      tip.style.opacity = "0";
      return;
    }
    const f = this.focus[i];
    const x = this.px[i], y = this.py[i];
    const tw = tip.offsetWidth || 240;
    const r = TIER_R[this.nodes[i].tier] * 3 + 22;
    const right = x + r + tw < this.W - 12;
    const tx = right ? x + r : x - r - tw;
    const ty = y - 20;
    tip.style.transform = `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0)`;
    tip.style.opacity = String(Math.min(1, f * 1.3) * this.alpha);
    tip.dataset.side = right ? "right" : "left";
  }

  private positionLabels(fid: number | null) {
    if (!this.labels.length) return;
    const kBase = (this.o.radius(this.W, this.H) * D) / WORLD_R / D;
    // Shown labels (focus first, then its relationships) are placed so they never overlap each other.
    const placed: QuietRect[] = [];
    const order = this.labels
      .map((el, i) => ({ el, i }))
      .filter((o) => o.el)
      .sort((a, b) => (a.i === fid ? -1 : b.i === fid ? 1 : this.pz[a.i] - this.pz[b.i]));
    for (const { el, i } of order) {
      const lab = el!;
      const depth = clamp01((this.pk[i] / kBase - 0.62) / 0.75);
      const isF = i === fid;
      const near = fid !== null && this.adj[fid].includes(i);
      const op = isF ? 1 : near ? 0.9 : 0.32 + 0.5 * depth;
      const x = this.px[i], y = this.py[i];
      lab.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      lab.style.opacity = (op * this.alpha).toFixed(3);
      lab.style.zIndex = String(isF ? 1000 : near ? 500 : Math.round(depth * 100));
      lab.classList.toggle("is-focus", isF);
      lab.classList.toggle("is-near", near);
      if (!(isF || near)) continue;
      if (!this.labelW[i]) this.labelW[i] = (lab.querySelector("span") as HTMLElement).offsetWidth || 160;
      const w = this.labelW[i], h = 26;
      const cands: [string, number, number][] = [
        ["r", x + 12, y - h / 2],
        ["l", x - 12 - w, y - h / 2],
        ["rd", x + 12, y + 6],
        ["ld", x - 12 - w, y + 6],
        ["ru", x + 12, y - h - 6],
        ["lu", x - 12 - w, y - h - 6],
        ["rdd", x + 12, y + h + 10],
        ["ruu", x + 12, y - 2 * h - 10],
      ];
      let pick: [string, number, number] | null = null;
      for (const c of cands) {
        const r = { l: c[1], t: c[2], r: c[1] + w, b: c[2] + h };
        if (r.l < 4 || r.r > this.W - 4) continue;
        if (!placed.some((p) => r.l < p.r && r.r > p.l && r.t < p.b && r.b > p.t)) {
          pick = c;
          break;
        }
      }
      if (!pick) {
        // Nothing fits cleanly: take the position with the least overlap and the least of the label outside the field.
        const cost = (c: [string, number, number]) => {
          const r = { l: c[1], t: c[2], r: c[1] + w, b: c[2] + h };
          let ov = 0;
          for (const p of placed) ov += Math.max(0, Math.min(r.r, p.r) - Math.max(r.l, p.l)) * Math.max(0, Math.min(r.b, p.b) - Math.max(r.t, p.t));
          return ov + 40 * (Math.max(0, 4 - r.l) + Math.max(0, r.r - (this.W - 4)));
        };
        pick = [...cands].sort((a, b) => cost(a) - cost(b))[0];
      }
      // Keep the label inside the field even when no side fits cleanly.
      const dx = Math.max(4 - pick[1], 0) - Math.max(pick[1] + w - (this.W - 4), 0);
      lab.style.setProperty("--dx", `${dx.toFixed(1)}px`);
      placed.push({ l: pick[1] + dx, t: pick[2], r: pick[1] + w + dx, b: pick[2] + h });
      lab.dataset.side = pick[0];
    }
  }
}
