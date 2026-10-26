// Oyunu tek bir HTML dosyasında toplar (CSS ve JS gömülü).
// Paylaşım ya da Claude Artifact olarak yayınlamak için: node scripts/build-single.js
// Çıktı: dist/hayat-simulatoru.html
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const read = (f) => fs.readFileSync(path.join(ROOT, f), "utf8");

const html = read("index.html");
const body = html.match(/<body>([\s\S]*)<\/body>/)[1];
// Sayfadaki <script src> sırasını koru, service worker kaydını çıkar.
const scripts = [...body.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => m[1]);
const markup = body
  .replace(/<script[\s\S]*?<\/script>/g, "")
  .trim();
const js = scripts
  .map((f) => "// ---- " + f + " ----\n" + read(f).replace(/<\/script/gi, "<\\/script"))
  .join("\n");

const out =
  "<title>Hayat Simülatörü</title>\n" +
  '<meta name="theme-color" content="#f3eee7" />\n' +
  "<style>\n" + read("style.css") + "\n</style>\n" +
  markup + "\n" +
  "<script>\n" + js + "\n</script>\n";

fs.mkdirSync(path.join(ROOT, "dist"), { recursive: true });
fs.writeFileSync(path.join(ROOT, "dist/hayat-simulatoru.html"), out);
console.log("dist/hayat-simulatoru.html", (out.length / 1024).toFixed(0) + " KB, " + scripts.length + " betik");
