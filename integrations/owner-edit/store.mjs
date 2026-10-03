// Owner Editing Mode: reads and writes copy in src/content/*.json. Development only (loaded by the dev server).
// OWNER_EDIT_STORE
//
// Safety rules:
// - Only the six page content files can be read or written, by name. Paths are never taken from a request.
// - A key must point at a copy value that already exists. Structure, keys and value types cannot change.
// - Formatting may only use the steps in src/content/format.json.
// - Writes to one file run one at a time, are atomic (temp file + rename), and are refused if the value changed
//   since the editor loaded it.
import { readFile, writeFile, rename, unlink } from "node:fs/promises";
import { join, resolve, sep } from "node:path";

export const FILES = ["global", "home", "company", "platform", "businesses", "technology"];
const PAGE = { global: "Site-wide", home: "Home", company: "Company", platform: "Platform", businesses: "Businesses", technology: "Technology" };
const KEY = new RegExp(`^(${FILES.join("|")}):([A-Za-z0-9-]+(?:\\.[A-Za-z0-9-]+)*)$`);
const MAX_TEXT = 2000;
const MAX_ITEMS = 40;
const FORMAT_ORDER = ["size", "width", "above", "below", "align"];

export class EditError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

const own = (o, k) => o !== null && typeof o === "object" && Object.prototype.hasOwnProperty.call(o, k);
const isLines = (v) => Array.isArray(v) && v.every((x) => typeof x === "string");
const isLeaf = (v) => typeof v === "string" || isLines(v) || (own(v, "text") && (typeof v.text === "string" || isLines(v.text)));
const split = (leaf) => {
  if (typeof leaf === "string" || Array.isArray(leaf)) return { value: leaf, format: {} };
  const { text, ...format } = leaf;
  return { value: text, format };
};
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const words = (s) =>
  s
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/-/g, " ")
    .replace(/^cta$/i, "button")
    .replace(/^primary$/i, "primary button")
    .replace(/^secondary$/i, "secondary button")
    .replace(/^./, (c) => c.toUpperCase());

export function parseKey(key) {
  const m = typeof key === "string" && key.length < 200 ? KEY.exec(key) : null;
  if (!m) throw new EditError(400, "Not an editable field.");
  return { file: m[1], path: m[2].split(".") };
}

export function createStore(root, { formatFile } = {}) {
  const dir = resolve(root, "src", "content");
  const fileOf = (name) => {
    const p = resolve(dir, `${name}.json`);
    if (!FILES.includes(name) || !p.startsWith(dir + sep)) throw new EditError(400, "Not an editable file.");
    return p;
  };
  const loadFormat = async () => JSON.parse(await readFile(formatFile ?? join(dir, "format.json"), "utf8"));
  const load = async (name) => JSON.parse(await readFile(fileOf(name), "utf8"));

  // Finds the copy value a key points at. Returns its parent container so it can be replaced in place.
  const locate = (data, path) => {
    let parent = null;
    let at = null;
    let node = data;
    const crumbs = [];
    for (const seg of path) {
      if (isLeaf(node)) throw new EditError(404, "That field does not exist.");
      if (Array.isArray(node)) {
        if (!/^\d+$/.test(seg) || Number(seg) >= node.length) throw new EditError(404, "That field does not exist.");
        const item = node[Number(seg)];
        const name = ["title", "term", "label", "who", "name"].map((k) => own(item, k) && split(item[k]).value).find((v) => typeof v === "string");
        crumbs.push(name ? (name.length > 28 ? `${name.slice(0, 26)}…` : name) : `#${Number(seg) + 1}`);
        parent = node;
        at = Number(seg);
        node = item;
      } else {
        if (!own(node, seg)) throw new EditError(404, "That field does not exist.");
        crumbs.push(words(seg));
        parent = node;
        at = seg;
        node = node[seg];
      }
    }
    if (!isLeaf(node)) throw new EditError(400, "That is a group of fields, not a single field.");
    return { parent, at, leaf: node, crumbs };
  };

  const describe = (file, located) => {
    const { value, format } = split(located.leaf);
    return { value, format, type: typeof value === "string" ? "text" : "lines", page: PAGE[file], crumbs: [PAGE[file], ...located.crumbs] };
  };

  async function read(key) {
    const { file, path } = parseKey(key);
    return { key, ...describe(file, locate(await load(file), path)) };
  }

  const cleanText = (s) => {
    if (typeof s !== "string") throw new EditError(400, "Text must be a string.");
    // Text is rendered as text, never as HTML. Control characters and line breaks inside one value are removed.
    const t = s.replace(/\r\n?/g, "\n").replace(/[\u0000-\u0009\u000b-\u001f\u007f]/g, "").replace(/\s*\n\s*/g, " ").trim();
    if (!t) throw new EditError(400, "Text cannot be empty.");
    if (t.length > MAX_TEXT) throw new EditError(400, `Text is limited to ${MAX_TEXT} characters.`);
    return t;
  };

  const cleanValue = (current, value) => {
    if (typeof current === "string") return cleanText(value);
    if (!Array.isArray(value)) throw new EditError(400, "This field is a list of paragraphs or items.");
    const items = value.map((v) => (typeof v === "string" ? v : null));
    if (items.includes(null)) throw new EditError(400, "Each paragraph or item must be text.");
    const out = items.filter((v) => v.trim()).map(cleanText);
    if (!out.length) throw new EditError(400, "Add at least one paragraph or item.");
    if (out.length > MAX_ITEMS) throw new EditError(400, `Limited to ${MAX_ITEMS} paragraphs or items.`);
    return out;
  };

  const cleanFormat = async (format) => {
    if (format === undefined || format === null) return {};
    if (typeof format !== "object" || Array.isArray(format)) throw new EditError(400, "Formatting must be an object.");
    const allowed = await loadFormat();
    const out = {};
    for (const [k, v] of Object.entries(format)) {
      if (!own(allowed, k)) throw new EditError(400, `Unknown formatting option "${k}".`);
      if (v === "default" || v === null || v === "") continue;
      if (!allowed[k].includes(v)) throw new EditError(400, `${k} must be one of: default, ${allowed[k].join(", ")}.`);
      out[k] = v;
    }
    return Object.fromEntries(FORMAT_ORDER.filter((k) => k in out).map((k) => [k, out[k]]));
  };

  const queues = new Map();
  const serial = (file, job) => {
    const run = (queues.get(file) ?? Promise.resolve()).then(job, job);
    queues.set(file, run.catch(() => {}));
    return run;
  };
  let n = 0;

  async function write({ key, value, format, expected }) {
    const { file, path } = parseKey(key);
    return serial(file, async () => {
      const data = await load(file);
      const located = locate(data, path);
      const current = split(located.leaf);
      if (!expected || !same({ value: current.value, format: current.format }, { value: expected.value, format: expected.format ?? {} })) {
        throw new EditError(409, "This text changed since you opened it. Close the editor and open it again to see the current version.", { current });
      }
      const next = { value: cleanValue(current.value, value), format: await cleanFormat(format) };
      located.parent[located.at] = Object.keys(next.format).length ? { text: next.value, ...next.format } : next.value;
      const target = fileOf(file);
      const tmp = join(dir, `.${file}.json.${process.pid}.${++n}.tmp`);
      try {
        await writeFile(tmp, `${JSON.stringify(data, null, 2)}\n`, "utf8");
        await rename(tmp, target);
      } catch (err) {
        await unlink(tmp).catch(() => {});
        throw new EditError(500, `Could not save: ${err.code ?? err.message}`);
      }
      return { key, ...describe(file, locate(data, path)), file: target };
    });
  }

  return { read, write, dir };
}
