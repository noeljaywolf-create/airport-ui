const http = require("http");
function getJson(u) { return new Promise((res, rej) => { http.get(u, (r) => { let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res(JSON.parse(d))); }).on("error", rej); }); }
(async () => {
  const check = (u) => new Promise((res) => http.get(u, (r) => { let d = ""; r.on("data", (c) => (d += c)); r.on("end", () => res({ code: r.statusCode, len: d.length })); }).on("error", (e) => res({ err: e.code })));
  console.log("// dist asset reachability over http://127.0.0.1:9245");
  for (const p of ["/", "/app.js", "/styles.css", "/index.html"]) {
    console.log("  GET " + (p || "/") + " -> " + JSON.stringify(await check("http://127.0.0.1:9245" + p)));
  }
  process.exit(0);
})().catch((e) => { console.error(e.message); process.exit(1); });
