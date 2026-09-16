import { copyFileSync, mkdirSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

// Vite ignores classic (non-module) scripts referenced by <script src>, so
// app.js & the standalone styles.css never land in dist/ on their own. Copy
// them verbatim after the bundle so the production build is self-contained.
const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const dist = resolve(root, "dist");
mkdirSync(dist, { recursive: true });

const pairs = [
  ["app.js", "app.js"],
  ["styles.css", "styles.css"]
];

// optional extras the kiosk may load at runtime (catch-all, no hard requirement)
for (const extra of ["favicon.svg", "favicon.ico", "manifest.webmanifest", "site.webmanifest", "touch-icon.png"])
  if (existsSync(resolve(root, extra))) pairs.push([extra, extra]);

let missing = 0;
for (const [from, to] of pairs) {
  const s = resolve(root, from);
  if (!existsSync(s)) { console.error("MISSING source " + from); missing++; continue; }
  copyFileSync(s, resolve(dist, to));
  console.log("dist/" + to + " <- " + from);
}
if (missing) { console.error(missing + " classic asset(s) missing"); process.exit(1); }
console.log("classic assets copied");
