// Mobil uygulama kabuğu (Capacitor) için tam HTML belgesi üretir: www/index.html
// Tek dosya derlemesini (dist/hayat-simulatoru.html) doctype, viewport ve güvenli alan
// ayarlarıyla sarar. Kullanım: node scripts/build-single.js && node scripts/build-app.js
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const single = fs.readFileSync(path.join(ROOT, "dist/hayat-simulatoru.html"), "utf8");
const cut = single.indexOf("<style>");
const headPart = single.slice(0, cut),
  bodyPart = single.slice(cut);
const out =
  "<!doctype html>\n<html lang=\"tr\">\n<head>\n<meta charset=\"utf-8\" />\n" +
  headPart +
  '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover" />\n' +
  '<meta name="format-detection" content="telephone=no" />\n' +
  "</head>\n<body>\n" +
  bodyPart +
  "\n</body>\n</html>\n";
fs.mkdirSync(path.join(ROOT, "www"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "www/index.html"), out);
console.log("www/index.html", (out.length / 1024).toFixed(0) + " KB");
