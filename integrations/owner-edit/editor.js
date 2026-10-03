// Owner Editing Mode UI. Loaded by client.js in development when editing is on. OWNER_EDIT_EDITOR
//
// Click outlined text to open the editor. Text changes are saved to src/content/*.json through the dev server and
// appear on the real page after the automatic reload. Formatting steps preview live on the page by setting the same
// data-v-* attributes the site's own CSS uses, so what you see is the site, not a mock-up.
import "./editor.css";

const ENDPOINT = "/__owner-edit/field";
const FLAG = "digit-owner-edit";
const LOG = "digit-owner-edit-log";
const FLASH = "digit-owner-edit-flash";
const ORDER = ["size", "width", "above", "below", "align"];
const LABEL = { size: "Size", width: "Width", above: "Spacing above", below: "Spacing below", align: "Alignment" };
const STEPS = {
  size: ["smaller", "default", "larger"],
  width: ["narrower", "default", "wider"],
  above: ["tighter", "default", "looser"],
  below: ["tighter", "default", "looser"],
  align: ["left", "center"],
};
const SINGLE_LINE = new Set(["eyebrow", "heading", "label", "cta", "caption"]);

const store = {
  get(k, d) {
    try {
      const v = sessionStorage.getItem(k);
      return v === null ? d : JSON.parse(v);
    } catch {
      return d;
    }
  },
  set(k, v) {
    try {
      sessionStorage.setItem(k, JSON.stringify(v));
    } catch {}
  },
  del(k) {
    try {
      sessionStorage.removeItem(k);
    } catch {}
  },
};

/** Small DOM builder. Strings become text nodes, so copy is never parsed as HTML. */
function h(tag, props = {}, ...kids) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(props)) {
    if (v === undefined || v === null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else el.setAttribute(k, v === true ? "" : String(v));
  }
  for (const kid of kids.flat()) if (kid !== null && kid !== undefined && kid !== false) el.append(kid instanceof Node ? kid : String(kid));
  return el;
}

async function api(method, { key, body } = {}) {
  const res = await fetch(key ? `${ENDPOINT}?key=${encodeURIComponent(key)}` : ENDPOINT, {
    method,
    cache: "no-store",
    headers: { "X-Owner-Edit": "1", ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({ error: `Unexpected response from the dev server (${res.status}).` }));
  if (!res.ok) throw Object.assign(new Error(data.error ?? `Request failed (${res.status}).`), { status: res.status });
  return data;
}

const targets = (key) => [...document.querySelectorAll(`[data-edit="${key}"]`)];
const crumbText = (crumbs) => crumbs.join(" › ");
const short = (v) => {
  const s = Array.isArray(v) ? v.join(" / ") : v;
  return s.length > 140 ? `${s.slice(0, 138)}…` : s;
};
const sameFormat = (a, b) => ORDER.every((k) => (a[k] ?? "default") === (b[k] ?? "default"));

/** Review lines for a text change. For paragraphs and lists, only the parts that changed. */
function textChanges(before, after) {
  if (JSON.stringify(before) === JSON.stringify(after)) return [];
  if (!Array.isArray(before)) return [h("p", {}, h("del", {}, short(before)), " → ", h("ins", {}, short(after)))];
  const out = [];
  for (let i = 0; i < Math.max(before.length, after.length); i++) {
    const n = i + 1;
    if (before[i] === after[i]) continue;
    if (before[i] === undefined) out.push(h("p", {}, `Added ${n}: `, h("ins", {}, short(after[i]))));
    else if (after[i] === undefined) out.push(h("p", {}, `Removed ${n}: `, h("del", {}, short(before[i]))));
    else out.push(h("p", {}, `${n}: `, h("del", {}, short(before[i])), " → ", h("ins", {}, short(after[i]))));
  }
  return out;
}

// ---------------------------------------------------------------------------------------------------------------
// Session toolbar

document.documentElement.classList.add("oe-on");
const unsaved = h("span", { class: "oe-unsaved", hidden: true }, "Unsaved edit");
const reviewBtn = h("button", { type: "button", "aria-expanded": "false", onclick: () => toggleReview() });
const bar = h(
  "div",
  { class: "oe-ui oe-bar", role: "region", "aria-label": "Owner Editing Mode" },
  h("span", { class: "oe-dot", "aria-hidden": "true" }),
  h("strong", {}, "Editing mode"),
  unsaved,
  reviewBtn,
  h("button", { type: "button", onclick: () => location.reload() }, "Reload"),
  h("button", { type: "button", onclick: exitEditing }, "Exit"),
  h("span", { class: "oe-hint" }, "Click text to edit. Alt/Option-click a link to follow it."),
);
document.body.append(bar);

const log = () => store.get(LOG, []);
function refreshCount() {
  const n = log().length;
  reviewBtn.textContent = n === 1 ? "1 change" : `${n} changes`;
  reviewBtn.disabled = n === 0;
}
refreshCount();

function exitEditing() {
  if (current?.dirty() && !current.armedExit) {
    current.say("You have an unsaved edit. Save or cancel it first, or press Exit again to discard it.", "warn");
    current.armedExit = true;
    return;
  }
  store.del(FLAG);
  store.del(LOG);
  const u = new URL(location.href);
  u.searchParams.delete("edit");
  location.replace(u);
}

function toast(text, tone = "ok") {
  const t = h("div", { class: `oe-ui oe-toast oe-${tone}`, role: "status" }, text);
  document.body.append(t);
  setTimeout(() => t.remove(), 3600);
}
const flash = store.get(FLASH, null);
if (flash) {
  store.del(FLASH);
  toast(flash);
}

// Review: what this session changed, grouped by page.
let review = null;
function toggleReview(force) {
  const show = force ?? !review;
  review?.remove();
  review = null;
  reviewBtn.setAttribute("aria-expanded", String(show));
  if (!show) return;
  const groups = new Map();
  for (const c of log()) {
    const page = c.crumbs[0];
    if (!groups.has(page)) groups.set(page, []);
    groups.get(page).push(c);
  }
  review = h(
    "div",
    { class: "oe-ui oe-review", role: "dialog", "aria-label": "Changes this session" },
    h("div", { class: "oe-head" }, h("span", { class: "oe-crumbs" }, "Changes this session"), h("button", { type: "button", class: "oe-x", "aria-label": "Close", onclick: () => toggleReview(false) }, "×")),
    [...groups].map(([page, items]) =>
      h(
        "section",
        {},
        h("h3", {}, page),
        items.map((c) =>
          h(
            "div",
            { class: "oe-change" },
            h("p", { class: "oe-where" }, crumbText(c.crumbs.slice(1))),
            textChanges(c.before.value, c.after.value),
            ORDER.filter((k) => (c.before.format[k] ?? "default") !== (c.after.format[k] ?? "default")).map((k) =>
              h("p", { class: "oe-fmt" }, `${LABEL[k].toLowerCase()}: ${c.before.format[k] ?? "default"} → ${c.after.format[k] ?? "default"}`),
            ),
          ),
        ),
      ),
    ),
    h("p", { class: "oe-note" }, "Saved to src/content/*.json. Nothing is committed, pushed, or published."),
  );
  document.body.append(review);
}

// ---------------------------------------------------------------------------------------------------------------
// Pointing at text

let hovered = null;
document.addEventListener("mouseover", (e) => {
  const el = e.target instanceof Element && !e.target.closest(".oe-ui") ? e.target.closest("[data-edit]") : null;
  const key = el?.dataset.edit ?? null;
  if (key === hovered) return;
  if (hovered) targets(hovered).forEach((n) => n.classList.remove("oe-hover"));
  hovered = key;
  if (key) targets(key).forEach((n) => n.classList.add("oe-hover"));
});

document.addEventListener(
  "click",
  (e) => {
    if (!(e.target instanceof Element) || e.target.closest(".oe-ui")) return;
    const el = e.target.closest("[data-edit]");
    if (!el || e.altKey) return;
    e.preventDefault();
    e.stopPropagation();
    open(el);
  },
  true,
);

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (current) current.cancel();
  else if (review) toggleReview(false);
});

// ---------------------------------------------------------------------------------------------------------------
// Editor

let current = null;

/** Applies a format to every element showing this field, the way src/content/schema.ts renders it. */
function applyFormat(key, format) {
  const els = targets(key);
  const lastPart = Math.max(...els.map((el) => Number(el.dataset.editPart ?? 0)));
  for (const el of els) {
    const controls = (el.dataset.editControls ?? "").split(" ");
    const part = el.dataset.editPart;
    for (const c of ORDER) {
      let v = controls.includes(c) ? format[c] : undefined;
      if (c === "above" && part !== undefined && Number(part) !== 0) v = undefined;
      if (c === "below" && part !== undefined && Number(part) !== lastPart) v = undefined;
      if (c === "align" && v === (el.dataset.editAlign ?? "left")) v = undefined;
      if (v && v !== "default") el.setAttribute(`data-v-${c}`, v);
      else el.removeAttribute(`data-v-${c}`);
    }
  }
}

// The nearest visible content before or after an element in reading order (what sits above or below it on screen).
const hasContent = (n) => n.getClientRects().length > 0 && (n.textContent.trim() || n.querySelector("svg, canvas, img"));
function neighbour(el, dir) {
  for (let a = el; a && a !== document.body; a = a.parentElement) {
    let n = dir < 0 ? a.previousElementSibling : a.nextElementSibling;
    while (n && (!hasContent(n) || n.closest(".oe-ui"))) n = dir < 0 ? n.previousElementSibling : n.nextElementSibling;
    if (n) return n;
  }
  return null;
}

/** Which steps actually do something for this element at this screen width, so the editor never offers a control
 *  with no effect. Spacing is only offered on a side where other content sits directly above or below. */
function stepsFor(el, control, last = el) {
  const cs = getComputedStyle(el);
  if (control === "above") {
    const prev = neighbour(el, -1);
    return prev && prev.getBoundingClientRect().bottom <= el.getBoundingClientRect().top + 1 ? STEPS.above : null;
  }
  if (control === "below") {
    const next = neighbour(last, 1);
    return next && next.getBoundingClientRect().top >= last.getBoundingClientRect().bottom - 1 ? STEPS.below : null;
  }
  if (control === "size") return cs.getPropertyValue("--fs").trim() ? STEPS.size : null;
  if (control === "width") {
    const own = cs.getPropertyValue("--measure").trim();
    const box = el.parentElement?.getBoundingClientRect().width ?? 0;
    const binding = own && parseFloat(cs.maxWidth) < box - 1;
    return binding ? STEPS.width : ["narrower", "default"];
  }
  return STEPS[control];
}

/** Where the field's text lines actually render. A formatting step that leaves this unchanged has no visible effect. */
const signature = (key) =>
  targets(key)
    .map((el) => {
      const range = document.createRange();
      range.selectNodeContents(el);
      return [...range.getClientRects()]
        .filter((r) => r.width > 1)
        .map((r) => [r.left, r.top, r.width].map(Math.round).join(","))
        .join(";");
    })
    .join("|");

async function open(el) {
  if (current) {
    if (current.dirty()) {
      current.say("Save or cancel this edit before opening another.", "warn");
      return;
    }
    current.close();
  }
  toggleReview(false);
  const key = el.dataset.edit;
  const kind = el.dataset.editKind ?? "text";
  const controls = ORDER.filter((c) => (el.dataset.editControls ?? "").split(" ").includes(c));
  let field;
  try {
    field = await api("GET", { key });
  } catch (err) {
    toast(err.message, "warn");
    return;
  }

  const all = targets(key);
  const first = all[0] ?? el;
  const lastEl = all[all.length - 1] ?? el;
  const natural = el.dataset.editAlign ?? "left";
  const initial = { ...field.format };
  let format = { ...field.format };
  const asText = (v) => (Array.isArray(v) ? v.join(kind === "list" ? "\n" : "\n\n") : v);
  const fromText = (t) =>
    field.type === "text" ? t : (kind === "list" ? t.split(/\n/) : t.split(/\n\s*\n/)).map((s) => s.replace(/\s*\n\s*/g, " ").trim()).filter(Boolean);
  const startText = asText(field.value);
  const sessionStart = log().find((c) => c.key === key)?.before ?? null;

  const status = h("p", { class: "oe-status", role: "status" });
  const say = (text, tone = "info") => {
    status.textContent = text;
    status.dataset.tone = tone;
  };
  const area = h("textarea", {
    id: "oe-text",
    rows: SINGLE_LINE.has(kind) ? 2 : Math.min(14, Math.max(4, Math.ceil(startText.length / 52) + 1)),
    spellcheck: "true",
  });
  area.value = startText;
  const fit = () => {
    area.style.height = "auto";
    area.style.height = `${Math.min(area.scrollHeight + 2, window.innerHeight * 0.42)}px`;
  };
  const dirty = () => area.value !== startText || !sameFormat(format, initial);
  const refreshDirty = () => {
    unsaved.hidden = !dirty();
    saveBtn.disabled = !dirty();
  };
  area.addEventListener("input", () => {
    fit();
    refreshDirty();
  });
  area.addEventListener("keydown", (e) => {
    const submit = (e.key === "Enter" && (e.metaKey || e.ctrlKey)) || (e.key === "Enter" && SINGLE_LINE.has(kind) && !e.shiftKey);
    if (submit) {
      e.preventDefault();
      save();
    }
  });

  const baseline = signature(key);
  const groups = controls
    .map((c) => {
      const steps = stepsFor(first, c, lastEl);
      if (!steps) return null;
      const buttons = steps.map((s) => {
        const label = c === "align" && s === natural ? `${s[0].toUpperCase()}${s.slice(1)} (default)` : `${s[0].toUpperCase()}${s.slice(1)}`;
        return h("button", {
          type: "button",
          "data-step": s,
          onclick: () => {
            if (s === "default" || (c === "align" && s === natural)) delete format[c];
            else format[c] = s;
            show();
            applyFormat(key, format);
            refreshDirty();
            const moved = signature(key) !== baseline || sameFormat(format, initial);
            say(moved ? "" : "No visible change for this text at this screen width.", "info");
          },
        }, label);
      });
      const show = () => buttons.forEach((b) => b.setAttribute("aria-pressed", String((format[c] ?? (c === "align" ? natural : "default")) === b.dataset.step)));
      show();
      return h("div", { class: "oe-group", role: "group", "aria-label": LABEL[c] }, h("span", { class: "oe-glabel" }, LABEL[c]), h("div", { class: "oe-steps" }, buttons));
    })
    .filter(Boolean);

  const saveBtn = h("button", { type: "button", class: "oe-primary", onclick: () => save(), disabled: true }, "Save");
  const revertBtn =
    sessionStart &&
    (JSON.stringify(sessionStart.value) !== JSON.stringify(field.value) || !sameFormat(sessionStart.format, field.format)) &&
    h("button", { type: "button", onclick: () => save(sessionStart), title: "Restore the text and formatting this field had when the session began" }, "Revert to session start");

  const hint = { paragraphs: "Separate paragraphs with a blank line.", list: "One item per line." }[kind];
  const panel = h(
    "div",
    { class: "oe-ui oe-panel", role: "dialog", "aria-label": `Edit ${crumbText(field.crumbs)}` },
    h("div", { class: "oe-head" }, h("span", { class: "oe-crumbs" }, crumbText(field.crumbs)), h("button", { type: "button", class: "oe-x", "aria-label": "Cancel and close", onclick: () => cancel() }, "×")),
    el.dataset.editHref && h("p", { class: "oe-meta" }, "Links to ", h("code", {}, el.dataset.editHref), ". The destination is set in code."),
    el.dataset.editAria && h("p", { class: "oe-meta" }, "Screen readers hear ", h("code", {}, el.dataset.editAria), ", set in code."),
    h("label", { class: "oe-label", for: "oe-text" }, kind === "list" ? "Items" : kind === "paragraphs" ? "Paragraphs" : "Text", hint && h("span", {}, ` · ${hint}`)),
    area,
    groups.length > 0 && h("div", { class: "oe-format" }, groups),
    status,
    h("div", { class: "oe-actions" }, saveBtn, h("button", { type: "button", onclick: () => cancel() }, "Cancel"), revertBtn),
  );
  document.body.append(panel);
  targets(key).forEach((n) => n.classList.add("oe-active"));
  fit();
  area.focus();
  area.setSelectionRange(area.value.length, area.value.length);

  function close() {
    panel.remove();
    targets(key).forEach((n) => n.classList.remove("oe-active"));
    unsaved.hidden = true;
    current = null;
  }
  function cancel() {
    applyFormat(key, initial);
    close();
    el.focus?.({ preventScroll: true });
  }
  async function save(to) {
    const next = to ? { value: to.value, format: to.format } : { value: fromText(area.value), format };
    if (!to && !dirty()) return close();
    saveBtn.disabled = true;
    say("Saving…");
    try {
      const saved = await api("POST", { body: { key, value: next.value, format: next.format, expected: { value: field.value, format: field.format } } });
      const entries = log();
      entries.push({ key, crumbs: field.crumbs, before: { value: field.value, format: field.format }, after: { value: saved.value, format: saved.format }, at: Date.now() });
      store.set(LOG, entries);
      store.set(FLASH, `${to ? "Reverted" : "Saved"}: ${crumbText(field.crumbs)}`);
      refreshCount();
      say("Saved. The page is reloading with the change…", "ok");
      // The dev server reloads the page when the content file changes; reload ourselves if it has not.
      setTimeout(() => location.reload(), 1600);
    } catch (err) {
      saveBtn.disabled = false;
      say(err.message, "warn");
    }
  }

  current = { key, close, cancel, dirty, say, armedExit: false };
}
