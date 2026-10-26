// Fluent çizimlerinin gerçek sınırlarını (getBBox) ölçer → assets/fluent/boxes.json
// Sahnede nesneleri tabanından hizalamak için kullanılır. Playwright gerektirir.
const { chromium } = require("playwright");
const fs = require("fs");
const path = require("path");
const dir = path.join(__dirname, "..", "assets", "fluent");
(async () => {
  const b = await chromium.launch();
  const p = await b.newPage();
  const out = {};
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith(".svg"))) {
    await p.setContent(fs.readFileSync(path.join(dir, f), "utf8"));
    out[f.replace(".svg", "")] = await p.evaluate(() => {
      const r = document.querySelector("svg").getBBox();
      return [r.x, r.y, r.width, r.height].map(
        (v) => Math.round(v * 100) / 100,
      );
    });
  }
  fs.writeFileSync(path.join(dir, "boxes.json"), JSON.stringify(out, null, 1));
  await b.close();
  console.log("assets/fluent/boxes.json:", Object.keys(out).length);
})();
