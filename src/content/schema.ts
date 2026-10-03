/**
 * Editable public copy.
 *
 * Each page's words live in a JSON file in this folder (home.json, company.json, ...). The page modules beside them
 * (home.ts, company.ts, ...) turn that JSON into typed, keyed fields for components. Presentation stays in the
 * components; the JSON holds only copy and the Owner's optional formatting choices.
 *
 * A copy value is either
 *   - a string: one block of text (a heading, a paragraph, a label), or
 *   - an array of strings: a group of paragraphs, or the items of a short list.
 * Either form can be written as { "text": <value>, ...format } to carry formatting steps from format.json.
 * "text" is reserved for that form, so no other content object uses it as a key.
 */
import FORMAT from "./format.json";

export { FORMAT };
export type Control = keyof typeof FORMAT;
export type Format = { [K in Control]?: (typeof FORMAT)[K][number] };
export const CONTROLS = Object.keys(FORMAT) as Control[];

export interface Field<T extends string | string[] = string> {
  readonly text: T;
  /** "<file>:<path>", e.g. "home:platform.headline". Identifies the value for Owner Editing Mode. */
  readonly key: string;
  readonly format: Format;
}

/** The JSON shape of a page, with every copy value turned into a Field. */
export type Fielded<T> = T extends string
  ? Field<string>
  : T extends readonly string[]
    ? Field<string[]>
    : T extends { text: infer V }
      ? V extends string
        ? Field<string>
        : Field<string[]>
      : T extends readonly (infer U)[]
        ? Fielded<U>[]
        : { readonly [K in keyof T]: Fielded<T[K]> };

const SEGMENT = /^[A-Za-z0-9-]+$/;

function formatOf(file: string, path: string, raw: Record<string, unknown>): Format {
  const format: Record<string, string> = {};
  for (const [k, v] of Object.entries(raw)) {
    const allowed = (FORMAT as Record<string, readonly string[]>)[k];
    if (!allowed) throw new Error(`content ${file}:${path}: unknown formatting key "${k}"`);
    if (typeof v !== "string" || !allowed.includes(v)) throw new Error(`content ${file}:${path}: ${k} must be one of ${allowed.join(", ")}`);
    format[k] = v;
  }
  return format as Format;
}

/** Walks a page's JSON and returns the same structure with each copy value as a keyed Field. Invalid content fails the build. */
export function fields<T>(file: string, data: T): Fielded<T> {
  const walk = (v: unknown, path: string): unknown => {
    if (typeof v === "string") return { text: v, key: `${file}:${path}`, format: {} };
    if (Array.isArray(v)) {
      if (v.every((x) => typeof x === "string")) return { text: v, key: `${file}:${path}`, format: {} };
      return v.map((x, i) => walk(x, `${path}.${i}`));
    }
    if (v && typeof v === "object") {
      if ("text" in v) {
        const { text, ...rest } = v as { text: unknown };
        if (typeof text !== "string" && !(Array.isArray(text) && text.every((x) => typeof x === "string"))) {
          throw new Error(`content ${file}:${path}: "text" must be a string or a list of strings`);
        }
        return { text, key: `${file}:${path}`, format: formatOf(file, path, rest) };
      }
      return Object.fromEntries(
        Object.entries(v).map(([k, x]) => {
          if (!SEGMENT.test(k)) throw new Error(`content ${file}: key "${k}" may only use letters, digits and hyphens`);
          return [k, walk(x, path ? `${path}.${k}` : k)];
        }),
      );
    }
    throw new Error(`content ${file}:${path}: unsupported value`);
  };
  return walk(data, "") as Fielded<T>;
}

/** What kind of copy an element shows. Owner Editing Mode uses it to pick the right editor. */
export type Kind = "eyebrow" | "heading" | "text" | "paragraphs" | "list" | "label" | "cta" | "caption";

export interface EditOptions {
  /** Link destination, shown read-only in the editor (destinations are set in code). */
  href?: string;
  /** Accessible name set in code for the surrounding link, shown read-only in the editor. */
  aria?: string;
  /** For paragraph groups rendered without their own container: this element's place in the group. */
  part?: { index: number; count: number };
  /** The component's own alignment, so choosing it again stores nothing. */
  align?: "left" | "center";
}

/**
 * Attributes for an element that shows a copy field.
 *
 * `controls` lists the formatting steps this element supports; only those are applied or offered. A chosen step
 * renders as a data-v-* attribute that global.css maps to a token (default renders nothing). In development the
 * element is also tagged for Owner Editing Mode; production builds get no editing attributes at all.
 */
export function edit(f: Field<string> | Field<string[]>, kind: Kind, controls: Control[] = [], o: EditOptions = {}): Record<string, string> {
  const attrs: Record<string, string> = {};
  const first = !o.part || o.part.index === 0;
  const last = !o.part || o.part.index === o.part.count - 1;
  for (const c of controls) {
    const v = f.format[c];
    if (!v || (c === "above" && !first) || (c === "below" && !last) || (c === "align" && v === (o.align ?? "left"))) continue;
    attrs[`data-v-${c}`] = v;
  }
  if (import.meta.env.DEV) {
    attrs["data-edit"] = f.key;
    attrs["data-edit-kind"] = kind;
    if (controls.length) attrs["data-edit-controls"] = controls.join(" ");
    if (o.href) attrs["data-edit-href"] = o.href;
    if (o.aria) attrs["data-edit-aria"] = o.aria;
    if (o.part) attrs["data-edit-part"] = String(o.part.index);
    if (controls.includes("align")) attrs["data-edit-align"] = o.align ?? "left";
  }
  return attrs;
}

/** The parts of a paragraph group rendered as sibling elements, for `edit(..., { part })`. */
export const parts = (f: Field<string[]>) => f.text.map((text, index) => ({ text, part: { index, count: f.text.length } }));
