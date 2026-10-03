// Tests for the content files and Owner Editing Mode. Run: npm test
// - every content file is valid (keys, reserved "text" objects, formatting values)
// - the save store only edits existing copy in the six content files, validates values and formatting, refuses stale
//   edits, writes atomically, and keeps concurrent saves to one file intact
// - the integration does nothing outside `astro dev`
// The store runs against a scratch copy inside node_modules/.cache, never against src/content.
import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { createStore, FILES } from "../integrations/owner-edit/store.mjs";
import ownerEdit from "../integrations/owner-edit/index.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));
const CONTENT = join(ROOT, "src", "content");
const FORMAT = JSON.parse(readFileSync(join(CONTENT, "format.json"), "utf8"));
let failures = 0;
let passes = 0;
const ok = (cond, label) => {
  if (cond) passes++;
  else {
    failures++;
    console.error(`  FAIL ${label}`);
  }
};
const rejects = async (p, status, label) => {
  try {
    await p;
    ok(false, `${label} (was accepted)`);
  } catch (err) {
    ok(err.status === status, `${label} (status ${err.status}, expected ${status}: ${err.message})`);
  }
};

// 1. Content files ------------------------------------------------------------------------------------------------
console.log("Content files");
const SEGMENT = /^[A-Za-z0-9-]+$/;
let fields = 0;
const walk = (file, v, path) => {
  if (typeof v === "string" || (Array.isArray(v) && v.every((x) => typeof x === "string"))) {
    fields++;
    ok((Array.isArray(v) ? v : [v]).every((s) => s.trim() === s && s.length > 0), `${file}:${path} has empty or untrimmed text`);
    return;
  }
  if (Array.isArray(v)) return v.forEach((x, i) => walk(file, x, `${path}.${i}`));
  ok(v && typeof v === "object", `${file}:${path} is not text, a list, or a group`);
  if ("text" in v) {
    const { text, ...format } = v;
    walk(file, text, path);
    for (const [k, val] of Object.entries(format)) ok(FORMAT[k]?.includes(val), `${file}:${path} formatting ${k}=${val} is not allowed`);
    return;
  }
  for (const [k, x] of Object.entries(v)) {
    ok(SEGMENT.test(k), `${file}: key "${k}" must use letters, digits and hyphens`);
    walk(file, x, path ? `${path}.${k}` : k);
  }
};
for (const f of FILES) {
  const src = readFileSync(join(CONTENT, `${f}.json`), "utf8");
  const data = JSON.parse(src);
  ok(src === `${JSON.stringify(data, null, 2)}\n`, `${f}.json is not in canonical format (2-space JSON, trailing newline)`);
  walk(f, data, "");
}
ok(fields > 300, `expected the site's copy in content files, found ${fields} fields`);
console.log(`  ${fields} copy fields in ${FILES.length} files`);

// 2. Save store ---------------------------------------------------------------------------------------------------
console.log("Save store");
const SCRATCH = join(ROOT, "node_modules", ".cache", "owner-edit-test");
rmSync(SCRATCH, { recursive: true, force: true });
mkdirSync(join(SCRATCH, "src"), { recursive: true });
cpSync(CONTENT, join(SCRATCH, "src", "content"), { recursive: true });
const store = createStore(SCRATCH);
const scratchFile = (f) => join(SCRATCH, "src", "content", `${f}.json`);
const snapshot = () => Object.fromEntries(readdirSync(join(SCRATCH, "src", "content")).map((f) => [f, readFileSync(join(SCRATCH, "src", "content", f), "utf8")]));

const head = await store.read("home:platform.headline");
ok(head.value === "Software that's intelligent enough to run businesses." && head.type === "text", "reads a heading");
ok(head.crumbs.join(" > ") === "Home > Platform > Headline", `breadcrumb is ${head.crumbs.join(" > ")}`);
const body = await store.read("technology:chapters.coordination.body");
ok(body.type === "lines" && body.value.length === 4, "reads a paragraph group");
ok((await store.read("home:improvement.steps.2.title")).crumbs.includes("Measure"), "names list items in the breadcrumb");

for (const key of ["../package:name", "home:../../x", "home:__proto__.x", "home:constructor", "home:platform.toString", "secrets:a", "home:", "home:platform..headline", "HOME:platform.headline", 42]) {
  await rejects(store.read(key), key === "home:constructor" || key === "home:platform.toString" ? 404 : 400, `rejects key ${JSON.stringify(key)}`);
}
await rejects(store.read("home:platform"), 400, "rejects a group of fields");
await rejects(store.read("home:platform.nope"), 404, "rejects a missing field");

const expected = { value: head.value, format: {} };
const before = snapshot();
await rejects(store.write({ key: "home:platform.headline", value: "x", format: {}, expected: { value: "stale", format: {} } }), 409, "refuses a stale edit");
await rejects(store.write({ key: "home:platform.headline", value: "x", format: {} }), 409, "refuses an edit without its starting value");
await rejects(store.write({ key: "home:platform.headline", value: ["x"], expected }), 400, "keeps text as text");
await rejects(store.write({ key: "technology:chapters.coordination.body", value: "x", expected: { value: body.value, format: {} } }), 400, "keeps paragraphs as paragraphs");
await rejects(store.write({ key: "home:platform.headline", value: " \n ", expected }), 400, "refuses empty text");
await rejects(store.write({ key: "home:platform.headline", value: "x".repeat(2001), expected }), 400, "limits text length");
await rejects(store.write({ key: "home:platform.headline", value: "x", format: { size: "huge" }, expected }), 400, "limits formatting to format.json steps");
await rejects(store.write({ key: "home:platform.headline", value: "x", format: { style: "color:red" }, expected }), 400, "refuses arbitrary styles");
await rejects(store.write({ key: "home:platform.headline", value: "x", format: "big", expected }), 400, "refuses non-object formatting");
ok(JSON.stringify(snapshot()) === JSON.stringify(before), "refused edits change no file");

const saved = await store.write({ key: "home:platform.headline", value: "  New\nheadline  ", format: { size: "larger", width: "default", align: null }, expected });
ok(saved.value === "New headline" && JSON.stringify(saved.format) === '{"size":"larger"}', "saves trimmed text with only non-default formatting");
const homeAfter = JSON.parse(readFileSync(scratchFile("home"), "utf8"));
ok(JSON.stringify(homeAfter.platform.headline) === '{"text":"New headline","size":"larger"}', "stores formatting beside the text");
const changedFiles = Object.entries(snapshot()).filter(([f, s]) => s !== before[f]).map(([f]) => f);
ok(changedFiles.length === 1 && changedFiles[0] === "home.json", `only home.json changed (${changedFiles.join(", ")})`);
const lines = (s) => s.split("\n");
const diff = lines(readFileSync(scratchFile("home"), "utf8")).filter((l, i, all) => !lines(before["home.json"]).includes(l));
ok(diff.length <= 4, `a save rewrites only the edited field (${diff.length} new lines)`);
await store.write({ key: "home:platform.headline", value: head.value, format: {}, expected: { value: "New headline", format: { size: "larger" } } });
ok(readFileSync(scratchFile("home"), "utf8") === before["home.json"], "saving the original back restores the file byte for byte");

const paras = await store.write({ key: "technology:chapters.coordination.body", value: ["One.", "", "Two."], format: { width: "narrower" }, expected: { value: body.value, format: {} } });
ok(JSON.stringify(paras.value) === '["One.","Two."]', "saves paragraphs and drops empty ones");

// Concurrent saves to one file all land, and the file stays valid JSON.
const steps = (await store.read("home:improvement.steps.0.title")) && JSON.parse(readFileSync(scratchFile("home"), "utf8")).improvement.steps;
const results = await Promise.allSettled(
  steps.flatMap((s, i) => [
    store.write({ key: `home:improvement.steps.${i}.title`, value: `${s.title} (edited)`, expected: { value: s.title, format: {} } }),
    store.write({ key: `home:improvement.steps.${i}.body`, value: `${s.body} (edited)`, expected: { value: s.body, format: {} } }),
  ]),
);
ok(results.every((r) => r.status === "fulfilled"), "12 concurrent saves to one file all succeed");
const finalSteps = JSON.parse(readFileSync(scratchFile("home"), "utf8")).improvement.steps;
ok(finalSteps.every((s) => s.title.endsWith("(edited)") && s.body.endsWith("(edited)")), "no concurrent save is lost");
ok(readdirSync(join(SCRATCH, "src", "content")).every((f) => !f.endsWith(".tmp")), "no temporary files are left behind");
const dupe = await Promise.allSettled([0, 1].map(() => store.write({ key: "home:hero.lede", value: "A", expected: { value: JSON.parse(before["home.json"]).hero.lede, format: {} } })));
ok(dupe.filter((r) => r.status === "fulfilled").length === 1 && dupe.some((r) => r.reason?.status === 409), "two saves from the same starting text: one wins, the other is refused");
rmSync(SCRATCH, { recursive: true, force: true });

// 3. Integration is development-only --------------------------------------------------------------------------------
console.log("Integration");
for (const command of ["build", "preview", "sync", "dev"]) {
  const calls = [];
  const hook = ownerEdit().hooks["astro:config:setup"];
  hook({
    command,
    config: { root: new URL("..", import.meta.url) },
    injectScript: (...a) => calls.push(["injectScript", ...a]),
    updateConfig: (...a) => calls.push(["updateConfig", ...a]),
    logger: { info: () => {} },
  });
  if (command === "dev") ok(calls.length === 2, "astro dev gets the page script and the save endpoint");
  else ok(calls.length === 0, `astro ${command} gets no editor script and no endpoint`);
}
const plugin = (() => {
  let p;
  ownerEdit().hooks["astro:config:setup"]({
    command: "dev",
    config: { root: new URL("..", import.meta.url) },
    injectScript: () => {},
    updateConfig: (c) => (p = c.vite.plugins[0]),
    logger: { info: () => {} },
  });
  return p;
})();
ok(plugin.apply === "serve", "the save endpoint is a serve-only Vite plugin");
ok(existsSync(join(ROOT, "integrations", "owner-edit", "client.js")), "client script exists");

console.log(`\n${passes} passed, ${failures} failed.`);
process.exit(failures ? 1 : 0);
