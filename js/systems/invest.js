// Yatırımlar ve yasal bahis.
// Riskli araçlar (fon, hisse, kripto) her ay %30 ihtimalle değer kazanır, %70 ihtimalle kaybeder;
// kazanç ayları kayıp aylarından büyüktür, ortalamada aşağı yukarı başa baş gider ama çok oynaktır.
// Altın ve döviz TL'nin değer kaybını kabaca izler, daha sakindir. Bunlar kurmaca modeldir; yatırım tavsiyesi değildir.
(function (HS) {
  "use strict";
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const r = () => HS.rng();
  const between = (a, b) => a + r() * (b - a);

  HS.INVEST = {
    altin: { name: "Altın", unit: "gram", icon: "coin", risk: "Düşük-orta", desc: "TL'nin değer kaybına karşı korur; aylık dalgalanır." },
    doviz: { name: "Döviz (avro)", unit: "avro", icon: "euro-banknote", risk: "Düşük", desc: "Kur yükseldikçe değer kazanır." },
    fon: { name: "Endeks fonu", unit: "pay", icon: "chart-increasing", risk: "Yüksek", desc: "Her ay %30 kazanç, %70 kayıp ihtimali.", up: [0.08, 0.2], down: [0.03, 0.09] },
    borsa: { name: "Hisse senedi", unit: "lot", icon: "bar-chart", risk: "Çok yüksek", desc: "Her ay %30 kazanç, %70 kayıp ihtimali; sert hareketler.", up: [0.12, 0.35], down: [0.05, 0.15] },
    kripto: { name: "Kripto para", unit: "birim", icon: "rocket", risk: "Aşırı", desc: "Her ay %30 kazanç, %70 kayıp ihtimali; bir ayda yarıya inebilir.", up: [0.25, 0.8], down: [0.1, 0.35] },
  };
  HS.UP_CHANCE = 0.3;

  // Fon değeri geriye uyumluluk için s.fund'da tutulur.
  const val = (s, k) => (k === "fon" ? s.fund || 0 : (s.inv[k] && s.inv[k].v) || 0);
  const setVal = (s, k, v) => (k === "fon" ? (s.fund = Math.max(0, v)) : ((s.inv[k] = s.inv[k] || { v: 0 }), (s.inv[k].v = Math.max(0, v))));
  HS.invVal = val;
  HS.invTotal = (s) => Object.keys(HS.INVEST).reduce((a, k) => a + val(s, k), 0);

  function init(s) {
    s.inv = s.inv || {};
    s.invCost = s.invCost || { fon: s.fund || 0 };
    s.invLast = s.invLast || {};
    s.bets = s.bets || { n: 0, won: 0, net: 0, recent: [] };
  }
  HS.HOOKS.newLife.push(init);
  HS.HOOKS.migrate.push(init);
  // Net değere fon dışındaki yatırımlar eklenir (fon zaten motorda sayılıyor)
  HS.HOOKS.worth.push((s) => HS.invTotal(s) - (s.fund || 0));

  // Al: {k, amt}  Sat: {k, frac}
  HS.CAN.invest = (s, v) => (s.cash < v.amt ? "Bu kadar nakit yok." : v.amt < 1 ? "Tutar çok küçük." : true);
  HS.FX.invest = (s, v) => {
    s.cash -= v.amt;
    setVal(s, v.k, val(s, v.k) + v.amt);
    s.invCost[v.k] = (s.invCost[v.k] || 0) + v.amt;
  };
  HS.CAN.divest = (s, v) => (val(s, v.k) < 1 ? "Bu yatırımın yok." : true);
  HS.FX.divest = (s, v) => {
    const amt = val(s, v.k) * v.frac;
    setVal(s, v.k, val(s, v.k) - amt);
    s.invCost[v.k] = (s.invCost[v.k] || 0) * (1 - v.frac);
    s.cash += amt;
  };
  // Eski etkiler (fon al/sat) bu sistemle aynı kaydı kullanır
  const oldFund = (s, amt) => (s.invCost.fon = (s.invCost.fon || 0) + amt);
  HS.FX.fund = (s, amt) => oldFund(s, amt);

  // Aylık değerleme
  HS.HOOKS.monthly.push((s) => {
    const cpiM = HS.rate(s, "cpi") / 12;
    let before = 0,
      after = 0;
    for (const k of Object.keys(HS.INVEST)) {
      const v = val(s, k);
      if (v < 1) continue;
      const d = HS.INVEST[k];
      let pct;
      if (d.up) pct = r() < (HS.CFG ? HS.CFG.investUp / 100 : HS.UP_CHANCE) ? between(d.up[0], d.up[1]) : -between(d.down[0], d.down[1]);
      else if (k === "altin") pct = cpiM * 1.05 + (r() - 0.5) * 0.09;
      else pct = cpiM * 0.95 + (r() - 0.5) * 0.05;
      s.invLast[k] = pct;
      before += v;
      after += v * (1 + pct);
      setVal(s, k, v * (1 + pct));
    }
    if (before > 20000 * s.idx.cpi) {
      const ch = after / before - 1;
      if (Math.abs(ch) >= 0.12)
        s.scenes.push({
          t: ch > 0 ? "Portföyün uçtu" : "Portföyün eridi",
          p: "Yatırımların bu ay toplamda %" + Math.round(ch * 100) + " " + (ch > 0 ? "kazandırdı" : "kaybettirdi") + ". Güncel değer " + HS.money(after) + ".",
          art: ch > 0 ? "▲" : "▼",
          kind: ch > 0 ? "win" : "lose",
        });
    }
  });

  // ---------------- Yasal bahis (kurmaca bayi) ----------------
  HS.BETS = {
    tek: { name: "Tek maç sonucu", odds: 1.85, p: 0.5, desc: "Bir maçın sonucunu tahmin et." },
    cifte: { name: "Çifte şans", odds: 1.3, p: 0.72, desc: "İki sonuçtan biri tutarsa kazanırsın." },
    kombine: { name: "4 maçlık kombine", odds: 11, p: 0.075, desc: "Dört tahminin de tutmalı." },
    skor: { name: "Skor tahmini", odds: 7.5, p: 0.11, desc: "Maçın tam skorunu bil." },
  };
  const TEAMS = ["Kartallar SK", "Boğaziçi Gençlik", "Ege Yıldızları", "Başkent Spor", "Karadeniz Fırtına", "Toros Ovası", "Marmara Martıları", "Anadolu Kartalları"];
  HS.CAN.bet = (s, v) => {
    if (s.age < 18) return "18 yaşından küçükler bahis oynayamaz.";
    if (s.cash < v.stake) return "Bu kadar nakit yok.";
    const thisWeek = s.bets.recent.filter((w) => w === s.weeks).length;
    const lim = HS.CFG ? HS.CFG.betLimit : 3;
    if (thisWeek >= lim) return "Bu hafta bahis sınırına ulaştın (" + lim + ").";
    return true;
  };
  HS.FX.bet = (s, v) => {
    const b = HS.BETS[v.type];
    s.cash -= v.stake;
    s.bets.n++;
    s.bets.recent.push(s.weeks);
    s.bets.recent = s.bets.recent.filter((w) => s.weeks - w < 12);
    const t1 = TEAMS[(r() * TEAMS.length) | 0];
    let t2 = TEAMS[(r() * TEAMS.length) | 0];
    if (t2 === t1) t2 = TEAMS[(TEAMS.indexOf(t1) + 3) % TEAMS.length];
    const won = r() < b.p;
    if (won) {
      const pay = v.stake * b.odds;
      s.cash += pay;
      s.bets.won++;
      s.bets.net += pay - v.stake;
      s.mood = clamp(s.mood + 4, 0, 100);
    } else {
      s.bets.net -= v.stake;
      s.mood = clamp(s.mood - 2, 0, 100);
    }
    s.scenes.push({
      t: won ? "Kupon tuttu!" : "Kupon yattı",
      p: t1 + " – " + t2 + " · " + b.name + " (oran " + b.odds.toFixed(2) + "). " + (won ? HS.money(v.stake * b.odds) + " kazandın." : HS.money(v.stake) + " kaybettin.") + " Toplam bahis bilançon: " + HS.money(s.bets.net) + ".",
      art: won ? "★" : "✕",
      kind: won ? "win" : "lose",
      odds: Math.round(b.p * 100),
    });
  };

  HS.EVENTS.push(
    {
      id: "betAddiction",
      priority: 45,
      cooldown: 26,
      when: (s) => s.bets && s.bets.recent.length >= 10,
      title: "Kuponlar birikiyor",
      text: (s) => "Son üç ayda " + s.bets.recent.length + " kupon yaptın. Bahis bilançon " + HS.money(s.bets.net) + ". Uyumadan önce oranlara bakmadan duramıyorsun.",
      choices: [
        { label: "Destek hattını ara ve bırak", hint: "Bir süre bahis yok; huzur geri gelir.", fx: { m: 4, flag: "betQuit", theme: "care", betReset: 1 } },
        { label: "Sınır koy", hint: "Ayda bir kupon.", fx: { m: 1, betReset: 1 } },
        { label: "Kayıpları çıkaracağım", hint: "Sık görülen bir tuzak.", fx: { m: -4, risk: 0.25 } },
      ],
    },
    {
      id: "hotTip",
      weight: (s) => (s.cash > 30000 * s.idx.cpi ? 0.8 : 0),
      cooldown: 80,
      title: "Kesin bilgi",
      text: "İş arkadaşın, bir şirketin hissesinin \"kesin uçacağını\" fısıldadı. Kuzeninin eniştesi şirkette çalışıyormuş.",
      choices: [
        {
          label: "Birikimin %20'sini yatır",
          hint: "Kulaktan dolma bilgiler çoğu zaman tutmaz.",
          fx: (s) => ({
            chance: {
              p: 0.3,
              win: { cash: (s.cash * 0.2 * 0.6) / s.idx.cpi },
              lose: { cash: -(s.cash * 0.2 * 0.55) / s.idx.cpi },
              winT: "Hisse gerçekten uçtu",
              winP: "Paranı %60 büyüttün. Şanslı bir haftaydı.",
              loseT: "Hisse çakıldı",
              loseP: "Haber yanlış çıktı; paranın yarısından fazlası gitti.",
            },
          }),
        },
        { label: "Uzak dur", hint: "İçeriden bilgi de, söylenti de risklidir.", fx: { sk: { finans: 1 } } },
      ],
    },
  );
  HS.FX.betReset = (s) => (s.bets.recent = []);
})(globalThis.HS || (globalThis.HS = {}));
