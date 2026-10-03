// Post-build checks for the static site in dist/ (run `npm run build` first).
// Verifies internal links and anchors, referenced assets, required metadata, stale or placeholder copy,
// that nothing loads from a third party (the privacy policy promises no third-party scripts or analytics),
// and that no part of the development-only Owner Editing Mode reaches the production build.
import { readFileSync, existsSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";

const DIST = new URL("../dist/", import.meta.url).pathname;
if (!existsSync(DIST)) {
  console.error("dist/ not found. Run `npm run build` first.");
  process.exit(1);
}

const files = [];
const walk = (d) =>
  readdirSync(d).forEach((f) => {
    const p = join(d, f);
    statSync(p).isDirectory() ? walk(p) : files.push(p);
  });
walk(DIST);
const html = files.filter((f) => f.endsWith(".html"));
const problems = [];
const warn = (m) => problems.push(m);

const idsOf = (src) => new Set([...src.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
const pageFor = (path) => {
  if (path === "/" || path === "") return join(DIST, "index.html");
  const clean = path.replace(/^\//, "").replace(/\/$/, "");
  for (const c of [clean, `${clean}.html`, join(clean, "index.html")]) {
    const p = join(DIST, c);
    if (existsSync(p) && statSync(p).isFile()) return p;
  }
  return null;
};

const STALE = [/Build\. Automate\. Scale/i, /AI Infrastructure \+ Engineering/i, /lorem ipsum/i, /\bTODO\b/, /\bFIXME\b/, /placeholder text/i];
const ALLOWED_ABSOLUTE = /^https:\/\/(digit\.software|schema\.org|openfontlicense\.org)\b/;

for (const file of html) {
  const src = readFileSync(file, "utf8");
  const rel = file.slice(DIST.length);
  const ids = idsOf(src);

  if (!/<title>[^<]{5,}<\/title>/.test(src)) warn(`${rel}: missing <title>`);
  if (!/<meta name="description" content="[^"]{20,}"/.test(src)) warn(`${rel}: missing meta description`);
  if (!/<link rel="canonical" href="https:\/\/digit\.software/.test(src)) warn(`${rel}: missing canonical`);
  const og = src.match(/<meta property="og:image" content="https:\/\/digit\.software([^"]+)"/);
  if (!og) warn(`${rel}: missing og:image`);
  else if (!existsSync(join(DIST, og[1]))) warn(`${rel}: og:image ${og[1]} not in dist`);
  if ((src.match(/<h1[\s>]/g) ?? []).length !== 1) warn(`${rel}: expected exactly one <h1>`);
  for (const re of STALE) if (re.test(src)) warn(`${rel}: stale or placeholder text matches ${re}`);

  for (const m of src.matchAll(/\s(?:href|src)="([^"]+)"/g)) {
    const url = m[1];
    if (url.startsWith("mailto:") || url.startsWith("data:")) continue;
    if (/^https?:\/\//.test(url)) {
      if (!ALLOWED_ABSOLUTE.test(url)) warn(`${rel}: external reference ${url}`);
      continue;
    }
    const [path, hash] = url.split("#");
    if (!path) {
      if (hash && !ids.has(hash)) warn(`${rel}: anchor #${hash} not found on page`);
      continue;
    }
    if (extname(path) && !path.endsWith(".html")) {
      if (!existsSync(join(DIST, path))) warn(`${rel}: missing asset ${path}`);
      continue;
    }
    const target = pageFor(path);
    if (!target) {
      warn(`${rel}: broken link ${url}`);
      continue;
    }
    if (hash && !idsOf(readFileSync(target, "utf8")).has(hash)) warn(`${rel}: ${url} anchor not found`);
  }
}

// Nothing loads from third parties: scripts, stylesheets and fonts are all local.
for (const file of files.filter((f) => /\.(css|js)$/.test(f))) {
  const src = readFileSync(file, "utf8");
  for (const m of src.matchAll(/url\((["']?)(https?:[^)"']+)\1\)|import\s*\(?["'](https?:[^"']+)["']/g)) {
    warn(`${file.slice(DIST.length)}: third-party load ${m[2] ?? m[3]}`);
  }
}

// Owner Editing Mode is development-only (integrations/owner-edit). The built site must carry no part of it:
// no editing attributes, no editor script or styles, no save endpoint, no ?edit handling.
const EDITOR_TRACES = [/\bdata-edit/, /OWNER_EDIT_/, /__owner-edit/, /digit-owner-edit/, /\boe-(?:on|ui|bar|panel|hover|active)\b/, /owner-edit/i];
for (const file of files.filter((f) => /\.(html|js|mjs|css|json|xml|txt|webmanifest)$/.test(f))) {
  const src = readFileSync(file, "utf8");
  for (const re of EDITOR_TRACES) if (re.test(src)) warn(`${file.slice(DIST.length)}: Owner Editing Mode trace ${re} in the production build`);
}

const kb = (p) => (statSync(p).size / 1024).toFixed(1);
console.log(`Checked ${html.length} pages.`);
for (const f of files.filter((f) => /\.(js|css|html)$/.test(f))) console.log(`  ${kb(f).padStart(7)} KB  ${f.slice(DIST.length)}`);
if (problems.length) {
  console.error(`\n${problems.length} problem(s):`);
  problems.forEach((p) => console.error(`  - ${p}`));
  process.exit(1);
}
console.log("\nAll checks passed.");
