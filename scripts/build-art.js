// assets/fluent/*.svg dosyalarını js/art/fluent.js içine gömer.
// Böylece oyun tek dosya hâlinde de, çevrimdışı da çalışır.
// Yeni çizim eklemek için SVG'yi assets/fluent/ içine koy ve: node scripts/build-art.js
const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "..", "assets", "fluent");
const out = {};
const boxes = JSON.parse(fs.readFileSync(path.join(dir, "boxes.json"), "utf8"));
for (const f of fs
  .readdirSync(dir)
  .filter((f) => f.endsWith(".svg"))
  .sort()) {
  const svg = fs.readFileSync(path.join(dir, f), "utf8");
  const vb = (svg.match(/viewBox="([^"]+)"/) || [, "0 0 32 32"])[1];
  const inner = svg
    .replace(/^[\s\S]*?<svg[^>]*>/, "")
    .replace(/<\/svg>\s*$/, "");
  const name = f.replace(/\.svg$/, "");
  out[name] = { vb, inner, box: boxes[name] || [0, 0, 32, 32] };
}
const js =
  "// Otomatik üretildi: node scripts/build-art.js. Elle düzenleme.\n" +
  "// Fluent Emoji (flat), MIT lisansı: assets/fluent/LICENSE\n" +
  "(function (HS) {\n  HS.FLUENT = " +
  JSON.stringify(out) +
  ";\n})(globalThis.HS || (globalThis.HS = {}));\n";
fs.writeFileSync(path.join(__dirname, "..", "js", "art", "fluent.js"), js);
console.log(
  "js/art/fluent.js:",
  Object.keys(out).length,
  "çizim,",
  (js.length / 1024).toFixed(1),
  "KB",
);
