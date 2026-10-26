// sw.js önbellek listesini index.html'deki betiklerden ve yerel varlıklardan yeniden üretir.
// Kullanım: node scripts/update-sw.js (yeni dosya eklenince çalıştır; sürüm otomatik artar)
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");
const html = fs.readFileSync(path.join(ROOT, "index.html"), "utf8");
const scripts = [...html.matchAll(/<script src="([^"]+)"><\/script>/g)].map((m) => "./" + m[1]);
const fonts = fs.readdirSync(path.join(ROOT, "assets/fonts")).filter((f) => /\.(woff2|css)$/.test(f)).map((f) => "./assets/fonts/" + f);
const files = ["./", "./index.html", "./style.css", ...fonts, ...scripts, "./manifest.webmanifest", "./icon.svg"];
let sw = fs.readFileSync(path.join(ROOT, "sw.js"), "utf8");
const v = +(sw.match(/hayat-simulator-v(\d+)/) || [0, 0])[1] + 1;
sw = sw.replace(/const CACHE = "[^"]+";/, `const CACHE = "hayat-simulator-v${v}";`).replace(/const FILES = \[[\s\S]*?\n\];/, "const FILES = [\n" + files.map((f) => `  "${f}",`).join("\n") + "\n];");
fs.writeFileSync(path.join(ROOT, "sw.js"), sw);
console.log("sw.js:", files.length, "dosya, sürüm v" + v);
