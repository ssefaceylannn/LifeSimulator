// Çok sayıda hayatı rastgele/strateji ile oynatır ve sistemi denetler.
// Kullanım: node tests/simulate.js [hayatSayısı]
const load = require("./load.js");
const HS = load();
const N = +(process.argv[2] || 300);
const assert = (c, m) => {
  if (!c) throw new Error("DOĞRULAMA HATASI: " + m);
};

// Her test hayatına rastgele bir "kişilik" verilir: etki türlerine farklı
// ağırlıklar. Böylece botlar gerçek oyuncular gibi birbirinden farklı oynar.
const FEATURES = {
  aile: (f) =>
    (f.partner || f.marry || f.child ? 3 : 0) +
    (f.bond > 0 || f.kidBond > 0 ? 1 : 0) -
    (f.breakup ? 2 : 0),
  kariyer: (f) =>
    (f.edu === "ogrenci" ? 3 : 0) +
    (f.promote ? 3 : 0) +
    (f.skill || 0) / 2 +
    (f.job && f.job !== "none" && f.job !== "crime" ? 1 : 0),
  risk: (f) => (f.risk > 0 ? 3 : 0) + (f.job === "crime" ? 2 : 0),
  para: (f) =>
    (f.save || f.fund || f.buy || f.payDebt ? 3 : 0) - (f.cost ? 1 : 0),
  gezi: (f) =>
    (f.emigrate || f.passport || f.moveCity ? 3 : 0) - (f.returnHome ? 1 : 0),
  keyif: (f) => (f.m || 0) / 3 + (f.h || 0) / 3,
  sosyal: (f) => (f.people || 0) / 2,
  sanat: (f) => (f.job === "music" || f.theme === "craft" ? 3 : 0),
};
function persona() {
  const p = {};
  for (const k in FEATURES)
    p[k] = Math.random() < 0.5 ? 0 : Math.random() * 3 - 0.5;
  p.noise = Math.random() * 2;
  return p;
}
function pickChoice(ev, P) {
  let best = -1,
    bestV = -Infinity;
  ev.c.forEach((c, i) => {
    if (c.off) return;
    let v = Math.random() * P.noise;
    for (const k in FEATURES) v += P[k] * FEATURES[k](c.fx);
    if (v > bestV) ((bestV = v), (best = i));
  });
  return best;
}
const stratNames = ["kişilik"];

const keys = new Set(),
  texts = new Map(),
  endings = {},
  ages = [],
  dimVals = {},
  eventCount = new Map(),
  worth = {},
  traitSum = {},
  dummyUnused = 0,
  dimCount = {};
let weeks = 0,
  actCount = 0;
const tabUse = new Map();
const t0 = Date.now();
for (let n = 0; n < N; n++) {
  const strat = n % 3 === 0 ? "rastgele" : "kişilik";
  const P = persona();
  const s = HS.newLife({
    first: "Test" + n,
    last: "Kişi",
    city: HS.HOME_CITIES[n % HS.HOME_CITIES.length],
    look: ["woman", "man", "neutral"][n % 3],
  });
  HS.nextEvent(s);
  // Çoğu bot faturalarını otomatik öder; bir kısmı unutur (gecikme ve kesinti sınansın).
  s.billAuto = Math.random() < 0.8;
  if (s.card) s.card.auto = "full";
  // Sekme eylemlerini taklit et: zaman zaman ev/araba al, birikim yap.
  let guard = 0;
  while (s.alive && guard++ < 30000) {
    // Boş zaman: botlar rastgele etkinlik yapar (sürprizler dahil)
    for (let k = 0; k < 3 && s.free > 0; k++) {
      const acts = HS.ACTIVITIES.filter((a) => !a.when || a.when(s));
      const a = acts[(Math.random() * acts.length) | 0];
      const r = HS.doActivity(s, a.id);
      if (r.ok) actCount++;
    }
    const ev = s.current;
    eventCount.set(ev.id, (eventCount.get(ev.id) || 0) + 1);
    const open = ev.c.map((c, i) => (c.off ? -1 : i)).filter((i) => i >= 0);
    let i =
      strat === "rastgele"
        ? open[(Math.random() * open.length) | 0]
        : pickChoice(ev, P);
    if (i === undefined) i = 0;
    const r = HS.choose(s, i, "Özel" + n);
    if (r.ok === false) {
      // kapalı seçenek gelmemeli; gelirse ilk açık seçeneğe düş
      const r2 = HS.choose(s, open[0] ?? 0, "Özel");
      assert(
        r2.ok !== false || ev.c.every((c) => c.off),
        "seçim uygulanamadı: " + ev.id + " " + r.reason,
      );
    }
    s.scenes.length = 0;
    // Sekme sistemlerini rastgele kullan (her eylem kendi kontrolünden geçer).
    if (Math.random() < 0.12) {
      const cpi = s.idx.cpi;
      const tries = [
        { license: 1 },
        { passport: 1 },
        { travelVisa: 1 },
        { visaStart: HS.pick(Object.keys(HS.COUNTRIES)) },
        s.visa && s.visa.stage === "evrak" ? { visaDoc: HS.pick(HS.VISA_DOCS).id } : null,
        s.visa && s.visa.stage === "evrak" ? { visaAppt: 1 } : null,
        s.visa && s.visa.stage === "onay" ? { visaMove: 1 } : null,
        { invest: { k: HS.pick(Object.keys(HS.INVEST)), amt: Math.round(s.cash * 0.1) } },
        { divest: { k: HS.pick(Object.keys(HS.INVEST)), frac: 0.5 } },
        { bet: { type: HS.pick(Object.keys(HS.BETS)), stake: Math.round(200 * cpi) } },
        { course: HS.pick(HS.COURSES).id },
        { tour: HS.pick(Object.keys(HS.TOURS)) },
        { trip: HS.pick(HS.HOME_CITIES) },
        { abroadTrip: HS.pick(Object.keys(HS.TRAVEL)) },
        { buyProp: { city: HS.pick(HS.HOME_CITIES), type: "daire" } },
        s.props && s.props[0] ? { rentOut: s.props[0].id } : null,
        { ins: { k: "health", on: true } },
        s.job === "none" ? { coApply: { co: HS.pick(HS.COMPANIES).id, job: HS.pick(["office", "cafe", "factory"]), relocate: true } } : null,
        s.look === "man" && !s.mil ? { mil: HS.pick(["serving", "bedelli", "tecil"]) } : null,
        { cardApply: 1 },
        s.card ? { cardPay: HS.pick(["stmt", "min", "all"]) } : null,
        { loanApply: { kind: "ihtiyac", amt: Math.floor(HS.loanMax(s, "ihtiyac") * 0.3 / 1000) * 1000, months: 24 } },
        { depositOpen: { amt: Math.floor(s.cash * 0.3), months: HS.pick([1, 3, 6, 12]) } },
        s.bills.length ? { billPay: "all" } : null,
        { gymBuy: HS.pick([1, 3, 6, 12]) },
        { itemBuy: { id: HS.pick(Object.keys(HS.ITEMS)), inst: s.card ? HS.pick([1, 3, 6]) : 1 } },
        s.kin.some((k) => k.alive) ? { visit: HS.pick(s.kin.filter((k) => k.alive)).id } : null,
      ].filter(Boolean);
      const fx = HS.pick(tries);
      if (HS.quickAction(s, fx) === true) tabUse.set(Object.keys(fx)[0], (tabUse.get(Object.keys(fx)[0]) || 0) + 1);
      s.scenes.length = 0;
    }
    // EŞYALAR sekmesini taklit et: parası yeten tutumlu kişi ev alır.
    if (
      (P.para > 0.5 || P.aile > 1) &&
      !s.assets.house &&
      s.cash > HS.homePrice(s) * 1.05
    )
      HS.quickAction(s, { buy: "house" });
    if (P.para > 1 && s.weeks % 26 === 0 && s.cash > 50000 * s.idx.cpi)
      HS.quickAction(s, { save: s.cash * 0.5 });
    for (const k of [
      "cash",
      "debt",
      "savings",
      "fund",
      "health",
      "mood",
      "skill",
    ]) {
      assert(Number.isFinite(s[k]), k + " sayı değil: " + s[k]);
      assert(s[k] >= -1e-6, k + " negatif: " + s[k]);
    }
    if (s.age === 40 && s.week === 1)
      (worth[strat] ||= []).push(HS.netWorth(s) / s.idx.cpi);
  }
  if (s.alive)
    console.log(
      "TAKILDI",
      s.age,
      s.weeks,
      s.health,
      JSON.stringify(s.current).slice(0, 600),
    );
  assert(!s.alive, "hayat bitmedi (sonsuz döngü?)");
  weeks += s.weeks;
  const f = s.final;
  assert(f && f.key && f.paragraphs.length >= 5, "final eksik");
  f.paragraphs.forEach((p) =>
    assert(!/undefined|NaN|null/.test(p), "metinde hata: " + p),
  );
  keys.add(f.key);
  const text = f.paragraphs.join(" ");
  if (!texts.has(f.key)) texts.set(f.key, text);
  endings[s.ending] = (endings[s.ending] || 0) + 1;
  ages.push(s.age);
  for (const [k, v] of Object.entries(s.traits))
    traitSum[k] = (traitSum[k] || 0) + v / N;
  for (const [d, v] of Object.entries(f.profile)) {
    (dimVals[d] ||= new Set()).add(v);
    (dimCount[d] ||= {})[v] = (dimCount[d][v] || 0) + 1;
  }
}

// Farklı anahtarlar farklı anlatı üretmeli.
const uniqTexts = new Set(texts.values());
assert(uniqTexts.size === texts.size, "farklı profiller aynı metni üretti");

ages.sort((a, b) => a - b);
const med = ages[ages.length >> 1];
const avg = (a) =>
  a && a.length ? Math.round(a.reduce((x, y) => x + y, 0) / a.length) : "-";
console.log(
  "Hayat:",
  N,
  "| toplam hafta:",
  weeks,
  "| süre:",
  Date.now() - t0,
  "ms",
);
console.log(
  "Ölüm yaşı: min",
  ages[0],
  "medyan",
  med,
  "max",
  ages[ages.length - 1],
);
console.log("Son nedenleri:", endings);
console.log(
  "Farklı son profili:",
  keys.size,
  "/",
  N,
  "| geçerli uzay:",
  HS.Endings.spaceSize().toLocaleString("tr-TR"),
);
console.log(
  "Boyut çeşitliliği:",
  Object.fromEntries(
    Object.entries(dimVals).map(([k, v]) => [
      k,
      v.size + "/" + HS.Endings.DIMS.find((d) => d.id === k).values.length,
    ]),
  ),
);
console.log(
  "40 yaşında ortalama net servet (2026 TL):",
  Object.fromEntries(
    Object.entries(worth).map(([k, v]) => [k, avg(v).toLocaleString("tr-TR")]),
  ),
);
const ev = [...eventCount].sort((a, b) => b[1] - a[1]);
if (process.env.DETAY) console.log("Boyut dağılımı:", dimCount);
console.log(
  "Ortalama tema puanı:",
  Object.fromEntries(
    Object.entries(traitSum).map(([k, v]) => [k, Math.round(v)]),
  ),
);
console.log(
  "Yapılan etkinlik:",
  actCount,
  "| hafta başına",
  (actCount / weeks).toFixed(2),
  "\nSekme eylemleri: " + [...tabUse].map(([k, v]) => k + ":" + v).join(" "),
);
console.log("Görülen farklı olay:", ev.length, "/", HS.EVENTS.length + 2);
console.log(
  "En sık 8:",
  ev
    .slice(0, 8)
    .map(([k, v]) => k + ":" + v)
    .join(" "),
);
const never = HS.EVENTS.map((e) => e.id).filter((id) => !eventCount.has(id));
console.log("Hiç görülmeyen:", never.join(", ") || "yok");
console.log(
  "\nÖrnek final (" + [...texts.keys()][0] + "):\n" + [...texts.values()][0],
);
console.log("\nTÜM DOĞRULAMALAR GEÇTİ");
