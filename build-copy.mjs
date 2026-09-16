// Vite cannot bundle a classic (non-module) script, so it never emits app.js.
// We keep the classic-script architecture on purpose (no-server file:// kiosk)
// and copy app.js into dist verbatim so the production build is self-contained.
import { copyFileSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const dist = resolve(root, "dist");

if (!existsSync(dist)) {
  console.error("dist/ not found — run `vite build` before this script");
  process.exit(1);
}

mkdirSync(dist, { recursive: true });

for (const f of ["app.js"]) {
  const from = resolve(root, f);
  const to = resolve(dist, f);
  if (!existsSync(from)) {
    console.error("missing source: " + f);
    process.exit(1);
  }
  copyFileSync(from, to);
  console.log("copied " + f + " -> dist/" + f);
}

// classes settle into dist can cache-break the classic script reference
// in dist/index.html? No: Vite leaves the src="app.js" tag untouched for
// classic scripts, which is why we copy it here.
console.log("dist bundle complete");
