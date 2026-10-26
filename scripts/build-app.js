// Mobil uygulama kabuğu (Capacitor) için tam HTML belgesi üretir: www/index.html
// Tek dosya derlemesini (dist/hayat-simulatoru.html) doctype, viewport ve güvenli alan
// ayarlarıyla sarar. Kullanım: node scripts/build-single.js && node scripts/build-app.js
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const single = fs.readFileSync(path.join(ROOT, "dist/hayat-simulatoru.html"), "utf8");
// Uygulamada yazı tipleri cihazdan yüklenir (Google'a istek gitmez)
const fontCss = fs.readFileSync(path.join(ROOT, "assets/fonts/fonts.css"), "utf8").replace(/url\(([\w.-]+\.woff2)\)/g, "url(fonts/$1)");
const noGoogle = single.replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>\n?/, "<style>\n" + fontCss + "</style>\n");
// Mağaza derlemesinde gerçek AdMob reklam birimleri (GitHub gizli değişkenlerinden) yazılır
let app = noGoogle;
for (const k of ["ADMOB_IOS_INTERSTITIAL", "ADMOB_IOS_REWARDED", "ADMOB_ANDROID_INTERSTITIAL", "ADMOB_ANDROID_REWARDED"]) if (process.env[k]) app = app.split("__" + k + "__").join(process.env[k]);
const cut = app.indexOf("<style>", app.indexOf("</style>") + 1);
const headPart = app.slice(0, cut),
  bodyPart = app.slice(cut);
const out =
  "<!doctype html>\n<html lang=\"tr\">\n<head>\n<meta charset=\"utf-8\" />\n" +
  headPart +
  '<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover" />\n' +
  '<meta name="format-detection" content="telephone=no" />\n' +
  "</head>\n<body>\n" +
  bodyPart +
  "\n</body>\n</html>\n";
fs.mkdirSync(path.join(ROOT, "www/fonts"), { recursive: true });
for (const f of fs.readdirSync(path.join(ROOT, "assets/fonts"))) if (f.endsWith(".woff2")) fs.copyFileSync(path.join(ROOT, "assets/fonts", f), path.join(ROOT, "www/fonts", f));
fs.writeFileSync(path.join(ROOT, "www/index.html"), out);
console.log("www/index.html", (out.length / 1024).toFixed(0) + " KB");
