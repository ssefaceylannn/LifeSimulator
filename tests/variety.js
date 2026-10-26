// Çeşitlilik testi: oyuncular aynı soruyla tekrar tekrar karşılaşmamalı.
// Her hayatın ilk 2 oyun yılında sıradan (süreç ya da öncelikli olmayan) hiçbir olay iki kez
// gelmemeli; hikâye zincirleri ilerlemeli ve "boş akşam" yedek olayı azınlıkta kalmalı.
// Kullanım: node tests/variety.js [hayatSayısı]
const HS = require("./load.js")();
const N = +(process.argv[2] || 12);
const assert = (c, m) => {
  if (!c) throw new Error("ÇEŞİTLİLİK HATASI: " + m);
};
const byId = new Map(HS.EVENTS.map((e) => [e.id, e]));
let events = 0,
  fallback = 0,
  storySteps = 0;
const cities = ["İstanbul", "Ankara", "İzmir", "Konya", "Trabzon", "Van"];
for (let L = 0; L < N; L++) {
  const s = HS.newLife({ first: "Deneme", last: "K", city: cities[L % cities.length], look: L % 2 ? "man" : "woman" });
  HS.nextEvent(s);
  const count = new Map();
  let guard = 0;
  while (s.alive && s.age < 20 && guard++ < 5000) {
    const ev = s.current;
    events++;
    count.set(ev.id, (count.get(ev.id) || 0) + 1);
    if (ev.id === "ordinary") fallback++;
    if (/^st_.+_/.test(ev.id)) storySteps++;
    const ok = ev.c.map((c, i) => i).filter((i) => !ev.c[i].off);
    const r = HS.choose(s, ok[(Math.random() * ok.length) | 0] ?? 0, "Deniz");
    if (r.ended) break;
    if (!s.current) HS.nextEvent(s);
  }
  for (const [id, n] of count) {
    const d = byId.get(id);
    if (!d || d.repeat || d.priority || id === "ordinary") continue;
    assert(n === 1, id + " ilk iki yılda " + n + " kez geldi");
  }
}
const share = fallback / events;
console.log("Olay:", events, "| yedek olay oranı %" + (share * 100).toFixed(1), "| hikâye aşaması:", storySteps);
assert(storySteps > N, "hikâye zincirleri ilerlemiyor");
assert(share < 0.35, "yedek (boş akşam) olayı çok sık: %" + (share * 100).toFixed(1));
console.log("ÇEŞİTLİLİK TESTİ GEÇTİ");
