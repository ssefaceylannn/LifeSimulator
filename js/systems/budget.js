// Haftalık bütçe ve yaşam tarzı: oyuncu yemek, ulaşım ve eğlence-kişisel harcama
// düzeyini kendisi seçer. Tutumlu yaşamak para biriktirir ama mutluluğu biraz düşürür,
// stresi biraz artırır; rahat yaşamak tersini yapar. Giderler haftalık gösterilir.
(function (HS) {
  "use strict";
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  // mul: harcama çarpanı; fx: her hafta uygulanan küçük etkiler
  HS.STYLE = {
    food: {
      name: "Yemek",
      levels: [
        { id: 0, name: "Tutumlu", desc: "Ev yemeği, indirim marketi, dışarıda yemek yok", mul: 0.68, fx: { m: -0.5, kg: -0.03 } },
        { id: 1, name: "Normal", desc: "Ev yemeği ağırlıklı, ara sıra dışarıda", mul: 1, fx: {} },
        { id: 2, name: "Rahat", desc: "Sık sipariş ve restoran", mul: 1.5, fx: { m: 0.6, kg: 0.08, stress: -0.3 } },
      ],
    },
    transport: {
      name: "Ulaşım",
      levels: [
        { id: 0, name: "Yürü / bisiklet", desc: "Kısa mesafeler yaya; vakit kaybı", mul: 0.45, fx: { h: 0.15, kg: -0.04, stress: 0.4 } },
        { id: 1, name: "Toplu taşıma", desc: "Otobüs, metro, dolmuş", mul: 1, fx: {} },
        { id: 2, name: "Taksi ağırlıklı", desc: "Rahat ama pahalı", mul: 2.1, fx: { stress: -0.4 } },
      ],
    },
    other: {
      name: "Eğlence ve kişisel",
      levels: [
        { id: 0, name: "Kısıtlı", desc: "Abonelik, kafe, kıyafet yok denecek kadar az", mul: 0.55, fx: { m: -0.6, stress: 0.5 } },
        { id: 1, name: "Normal", desc: "Ayda birkaç sinema, kafe, küçük alışveriş", mul: 1, fx: {} },
        { id: 2, name: "Bol", desc: "Sık sosyal hayat, yeni kıyafetler, hobiler", mul: 1.7, fx: { m: 0.7, people: 0.1, stress: -0.5 } },
      ],
    },
  };
  function init(s) {
    s.style = s.style || { food: 1, transport: 1, other: 1 };
  }
  HS.HOOKS.newLife.push(init);
  HS.HOOKS.migrate.push(init);
  HS.styleMul = (s) => {
    const st = s.style || { food: 1, transport: 1, other: 1 };
    return {
      food: HS.STYLE.food.levels[st.food].mul,
      transport: HS.STYLE.transport.levels[st.transport].mul,
      other: HS.STYLE.other.levels[st.other].mul,
    };
  };
  HS.FX.style = (s, v) => {
    s.style = { ...(s.style || {}), [v.k]: clamp(v.lv, 0, 2) };
  };
  HS.HOOKS.weekly.push((s) => {
    const st = s.style || {};
    for (const k of ["food", "transport", "other"]) {
      const fx = HS.STYLE[k].levels[st[k] ?? 1].fx;
      if (fx.m) s.mood = clamp(s.mood + fx.m, 0, 100);
      if (fx.h) s.health = clamp(s.health + fx.h, 0, 100);
      if (fx.stress && HS.addStress) HS.addStress(s, fx.stress);
      if (fx.kg && HS.FX.kg) HS.FX.kg(s, fx.kg);
      if (fx.people) s.people += fx.people;
    }
  });
  // Haftalık bütçe dökümü (TL/hafta)
  HS.weeklyBudget = (s) => {
    const W = HS.WEEKS_PER_MONTH;
    const b = HS.budget(s);
    const E = HS.ECONOMY.basket;
    const st = HS.styleMul(s);
    // yaşam giderini kalemlerine böl (basket ile aynı oranlar)
    const raw = E.food * s.idx.food * st.food + E.transport * s.idx.transport * st.transport + E.other * s.idx.cpi * st.other;
    const part = (x) => (raw ? (b.living * x) / raw : 0);
    const lines = [
      ["Yemek ve market", part(E.food * s.idx.food * st.food)],
      ["Ulaşım" + (s.car && s.car !== "bisiklet" ? " ve araç" : ""), part(E.transport * s.idx.transport * st.transport)],
      ["Eğlence ve kişisel", part(E.other * s.idx.cpi * st.other)],
      ["Kira", b.rent],
      ["Çocuk giderleri", b.kids],
      ["Konut kredisi", b.mortgage],
      ["Kredi taksitleri", (s.loans || []).reduce((a, l) => a + l.monthly, 0) / W],
      ["Faturalar (aylık ortalama)", HS.billPlan ? HS.billPlan(s).reduce((a, x) => a + x.amt, 0) / W : 0],
    ].filter((x) => x[1] > 0.5);
    const out = lines.reduce((a, x) => a + x[1], 0);
    return { income: b.income, lines, out, net: b.income - out };
  };
})(globalThis.HS || (globalThis.HS = {}));
