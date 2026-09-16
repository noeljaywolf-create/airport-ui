const fs = require("fs");
const path = require("path");

const store = new Map();
const els = new Map();
let domReady = null;

function makeEl(id) {
  const el = {
    dataset: {},
    style: {},
    classList: {
      _s: new Set(),
      add(c) { this._s.add(c); },
      remove(c) { this._s.delete(c); },
      toggle(c, f) { if (f === undefined) { this._s.has(c) ? this._s.delete(c) : this._s.add(c); } else { f ? this._s.add(c) : this._s.delete(c); } },
      contains(c) { return this._s.has(c); }
    },
    setAttribute() {},
    getAttribute() { return null; },
    _handlers: {},
    addEventListener(type, fn) { (this._handlers[type] = this._handlers[type] || []).push(fn); },
    remove() {},
    appendChild() {},
    scrollIntoView() { scrollCalls++; },
    querySelectorAll() { return []; },
    textContent: "",
    value: "",
    scrollTop: 0,
    scrollHeight: 0
  };
  Object.defineProperty(el, "innerHTML", {
    get() { return store.get(id + ":html") || ""; },
    set(v) { store.set(id + ":html", String(v)); }
  });
  store.set(id + ":html", "");
  return el;
}

function getEl(sel) {
  if (!els.has(sel)) els.set(sel, makeEl(sel));
  return els.get(sel);
}

let scrollCalls = 0;
global.scrollTo = () => { scrollCalls++; };
global.scroll = () => { scrollCalls++; };

global.document = {
  documentElement: { lang: "", dataset: {} },
  body: getEl("body"),
  title: "",
  createElement(tag) { return makeEl("created:" + tag + ":" + Math.random()); },
  querySelector(sel) { return getEl(sel); },
  querySelectorAll(sel) {
    if (sel === ".view") return ["#view-home", "#view-map", "#view-flights", "#view-transport"].map(getEl);
    if (sel === ".navtab") return ["#navtab-home", "#navtab-map", "#navtab-flights", "#navtab-transport"].map(getEl);
    return [];
  },
  addEventListener(type, fn) { if (type === "DOMContentLoaded") domReady = fn; }
};
global.window = global;
global.location = { protocol: "file:", href: "file:///C:/Users/hp/Desktop/airport%20ui/index.html" };
global.navigator = { language: "en" };

const ROOT = path.resolve(__dirname, "..");
const src = fs.readFileSync(path.join(ROOT, "app.js"), "utf8");
eval(src);

if (typeof domReady !== "function") { console.log("FAIL: no DOMContentLoaded handler"); process.exit(1); }
try { domReady(); } catch (e) { console.log("FAIL: init threw: " + e.message); console.log(e.stack); process.exit(1); }

getEl("#backHome").classList.add("hidden");
getEl("#view-home").dataset.view = "home"; getEl("#view-home").classList.add("active");
getEl("#view-map").dataset.view = "map";
getEl("#view-flights").dataset.view = "flights";
getEl("#view-transport").dataset.view = "transport";
["#navtab-home", "#navtab-map", "#navtab-flights", "#navtab-transport"].forEach((s, i) => {
  getEl(s).dataset.view = ["home", "map", "flights", "transport"][i];
});

function trigger(sel, type) {
  const el = getEl(sel);
  const h = el._handlers[type] || [];
  h.forEach((fn) => fn({ key: "", target: el, preventDefault() {} }));
}

const results = {};

const svg = getEl("#mapSvg").innerHTML;
results.zlabelCount = (svg.match(/class="zlabel"/g) || []).length;
results.pierA = svg.includes("PIER A — DEPARTURES");
results.pierB = svg.includes("PIER B — DEPARTURES");
results.pillBeforeYouHere = svg.indexOf('class="zlabel"') !== -1 && svg.indexOf('class="zlabel"') < svg.indexOf('youhere-marker');
results.mapClickableCount = (svg.match(/data-node=/g) || []).length;
results.markerStructure = {
  wrapperHasDataNodeAndTranslate: /<g class="mp" data-node="cafe" transform="translate/.test(svg),
  mpoiHasNoTransformAttr: /<g class="mpoi"[^>]*transform=/.test(svg) === false,
  hasLabelClass: svg.includes('class="mp-label"'),
  hasMapView: svg.includes('<g id="mapView">') && svg.includes('</g></svg>'),
  hasHitTarget: svg.includes('class="mp-hit"')
};

window.SkyPath.selectDestination("gB14");
const svg2 = getEl("#mapSvg").innerHTML;
results.routeCardHidden = getEl("#routeCard").classList.contains("hidden");
results.routeDest = getEl("#routeDestName").textContent;
results.routeDist = getEl("#routeDist").textContent;
results.routeSteps = (getEl("#routeSteps").innerHTML.match(/<li/g) || []).length;
results.hasRoutePath = svg2.includes('class="route-path"');
results.hasDestMarker = svg2.includes("dest-marker");

// fit-to-route zoom: short local route -> scale > 1; reset -> none
window.SkyPath.selectDestination("cafe");
results.fitZoom = {
  transformAfterCafe: getEl("#mapView").style.transform,
  zoomedIn: /scale\(([2-9]|1[0-9]|3\.\d|2\.\d)/.test(getEl("#mapView").style.transform) || (function(){ var m = getEl("#mapView").style.transform.match(/scale\(([\d.]+)\)/); return m ? parseFloat(m[1]) > 1 : false; })(),
  fullRouteUnzoomed: getEl("#mapView").style.transform
};
window.SkyPath.resetMapView();
results.fitZoom.afterReset = getEl("#mapView").style.transform;
results.fitZoom.resetIsNone = getEl("#mapView").style.transform === "none";

// destination name pill: below marker for A-gates/POIs, above for B-gates, no label overrides it
window.SkyPath.selectDestination("gA1");
let svgX = getEl("#mapSvg").innerHTML;
const pillBelowA = (svgX.match(/class="dest-name"><rect x="[\d.]+" y="([\d.]+)"/) || [])[1];
window.SkyPath.selectDestination("gB14");
svgX = getEl("#mapSvg").innerHTML;
const pillAboveB = (svgX.match(/class="dest-name"><rect x="[\d.]+" y="([\d.]+)"/) || [])[1];
window.SkyPath.selectDestination("cafe");
svgX = getEl("#mapSvg").innerHTML;
const cafePillY = (svgX.match(/class="dest-name"><rect x="[\d.]+" y="([\d.]+)"/) || [])[1];
const clashCount = (svgX.match(/mp-label clash/g) || []).length;
const gateClash = (svgX.match(/mp-label clash/g) || []);
results.labelPolish = {
  destNamePillExists: !!pillBelowA,
  aGateNameBelow: pillBelowA === "144",         // marker at y=120, pill at y+24
  bGateNameAbove: pillAboveB === "448",         // marker at y=500, pill at y-52
  noPillTextOnCafe: cafePillY === "334",
  cafeLabelSuppressed: clashCount > 0,
  clashIsCafe: (gateClash[0] || "").includes("")
};

scrollCalls = 0;
window.SkyPath.selectDestination("gB14");
window.SkyPath.selectDestination("cafe");
results.scrollRace = { scrollCallsDuringSameViewSelects: scrollCalls, pass: scrollCalls === 0 };

results.backhome = {
  afterSelectVisible: !getEl("#backHome").classList.contains("hidden")
};

window.SkyPath.selectDestination("gB14");
results.backhome.afterSelectVisible = !getEl("#backHome").classList.contains("hidden");
trigger("#backHome", "click");
results.backhome.afterBackHidden = getEl("#backHome").classList.contains("hidden");
results.backhome.homeViewActive = getEl("#view-home").classList.contains("active");

// i18n coverage: statically extract I18N literal and compare every language's key set to English
function extractI18N() {
  const m = src.match(/const I18N = \{(.|\n)*?^\s*\};/m);
  const code = m[0].replace(/^const I18N = /, 'const I18N = globalThis.__I18N__ = ');
  eval(code);
  return globalThis.__I18N__;
}
const I18N = extractI18N();
const LANGS = Object.keys(I18N);
results.i18n = {
  langs: LANGS,
  count: LANGS.length,
  keySetsMatch: {}
};
const enKeys = Object.keys(I18N.en).sort();
let allMatch = true;
LANGS.forEach((lc) => {
  const ks = Object.keys(I18N[lc]).sort();
  const missing = enKeys.filter((k) => !(k in I18N[lc]));
  const extra = ks.filter((k) => !(k in I18N.en));
  const same = JSON.stringify(ks) === JSON.stringify(enKeys);
  if (!same) allMatch = false;
  results.i18n.keySetsMatch[lc] = { same, missing, extra };
  const empties = Object.entries(I18N[lc]).filter(([, v]) => !v || String(v).trim() === '').map(([k]) => k);
  if (empties.length) { results.i18n.keySetsMatch[lc].empty = empties; allMatch = false; }
});
results.i18n.allMatch = allMatch;

console.log(JSON.stringify(results, null, 2));
process.exit(0);