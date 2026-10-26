// Banka: kredi kartı, ihtiyaç ve taşıt kredisi, vadeli mevduat, faturalar ve kredi notu.
// 2026 varsayımları (yaklaşık, oyun için yuvarlanmış):
// - Kart akdi faizi aylık ~%3,25, gecikme ~%3,55; asgari ödeme ekstrenin %20'si (limit 50.000 TL üstünde %40).
// - İlk kart limiti aylık gelirin 2 katı; bir yıl düzgün kullanımdan sonra 4 katına çıkabilir.
// - İhtiyaç kredisi aylık ~%3,0, taşıt kredisi ~%2,7 (vergiler dahil); vade 12-36 ay.
// - Vadeli mevduat yıllık brüt ~%37, stopaj %17,5; vade bozulursa faiz yanar.
// - Faturalar aylık gelir; 2 hafta içinde ödenmezse gecikme bedeli, 1 aydan sonra kesinti.
// Tutarlar 2026 TL'dir ve enflasyonla ölçeklenir. 2027 sonrası oranlar kurmaca senaryoya bağlıdır.
(function (HS) {
  "use strict";
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const r = () => HS.rng();
  const M = () => HS.WEEKS_PER_MONTH || 4.33;
  const money = (n) => HS.money(n);
  const c = (label, hint, fx = {}) => ({ label, hint, fx });
  let uid = 0;
  const nid = (p) => p + Date.now().toString(36).slice(-4) + (++uid).toString(36);

  const cpiRate = (s) => (HS.rate ? HS.rate(s, "cpi") : 0.3);
  // Oranlar enflasyon senaryosuna göre değişir; 2026 seviyesine kalibre.
  HS.bankRates = (s) => {
    const k = clamp(cpiRate(s) / 0.3, 0.35, 2.5) * (HS.CFG ? HS.CFG.bankRateScale : 1);
    return {
      card: 0.0325 * k,
      cardLate: 0.0355 * k,
      ihtiyac: 0.03 * k,
      tasit: 0.027 * k,
      deposit: (HS.ECONOMY.depositRate || 0.37) * k,
      stopaj: 0.175,
    };
  };
  const LOANS = {
    ihtiyac: { name: "İhtiyaç kredisi", terms: [12, 24, 36], max: 8 },
    tasit: { name: "Taşıt kredisi", terms: [12, 24, 36], max: 14, need: (s) => (s.car && s.car !== "bisiklet" ? true : "Taşıt kredisi yalnızca araç alırken kullanılabilir; önce bir araç seç.") },
  };
  HS.LOANS = LOANS;
  // Fatura kalemleri (aylık, 2026 TL, 70 m² ev). season: kış/bahar/yaz çarpanı.
  const BILLS = [
    { k: "elektrik", name: "Elektrik", amt: 1050, season: [1.25, 1, 1.1] },
    { k: "dogalgaz", name: "Doğalgaz", amt: 1250, season: [2.1, 0.9, 0.35] },
    { k: "su", name: "Su", amt: 560, season: [0.9, 1, 1.2] },
    { k: "internet", name: "İnternet", amt: 650, season: [1, 1, 1] },
    { k: "telefon", name: "Cep telefonu", amt: 480, season: [1, 1, 1], personal: true },
    { k: "aidat", name: "Apartman aidatı", amt: 1100, season: [1, 1, 1], apt: true },
  ];
  HS.BILL_TYPES = BILLS;

  function init(s) {
    s.card = s.card || null;
    s.loans = s.loans || [];
    s.deposits = s.deposits || [];
    s.bills = s.bills || [];
    s.billAuto = s.billAuto || false;
    s.score = s.score ?? 1150;
    s.cut = s.cut || {};
  }
  HS.HOOKS.newLife.push(init);
  HS.HOOKS.migrate.push(init);

  const income = (s) => (s.job !== "none" ? HS.wage(s) : s.retired ? HS.pension(s) : 0);
  const cardAvail = (s) => (s.card && !s.card.blocked ? Math.max(0, s.card.limit - s.card.bal) : 0);
  HS.cardAvail = cardAvail;
  HS.funds = (s) => s.cash + cardAvail(s);
  // pay() nakit yetmezse buraya düşer: kart limitinden çeker, kalanı döner.
  HS.chargeCard = (s, amt) => {
    const use = Math.min(cardAvail(s), amt);
    if (use > 0) {
      s.card.bal += use;
      s.card.spent = (s.card.spent || 0) + use;
    }
    return amt - use;
  };
  const scoreAdd = (s, v) => (s.score = clamp((s.score ?? 1150) + v, 0, 1900));
  HS.scoreLabel = (sc) => (sc >= 1700 ? "Çok iyi" : sc >= 1450 ? "İyi" : sc >= 1150 ? "Orta" : sc >= 800 ? "Riskli" : "Çok riskli");
  const monthlyPay = (P, rate, n) => (rate > 0 ? (P * rate) / (1 - Math.pow(1 + rate, -n)) : P / n);
  HS.loanMonthly = monthlyPay;
  const loanLoad = (s) => s.loans.reduce((a, l) => a + l.monthly, 0) + (s.mortgage ? s.mortgage.weekly * M() : 0);
  HS.loanLoad = loanLoad;

  // ---- Kredi kartı ----
  HS.cardOffer = (s) => {
    const inc = income(s);
    if (inc > 0) return Math.round((inc * (s.score >= 1450 ? 3 : 2)) / 1000) * 1000;
    if (s.edu === "ogrenci") return Math.round((5000 * s.idx.cpi) / 500) * 500;
    return 0;
  };
  HS.cardChance = (s) => clamp(0.25 + (s.score - 800) / 1200 + (income(s) > 0 ? 0.2 : 0) - (s.debt > 0 ? 0.25 : 0), 0.05, 0.95);
  HS.CAN.cardApply = (s) => (s.card ? "Zaten bir kredi kartın var." : s.age < 18 ? "18 yaş gerekir." : HS.cardOffer(s) <= 0 ? "Düzenli gelir (ya da öğrenci belgesi) gerekir." : s.applyBlock > s.weeks ? "Bankanın ret kararından sonra " + (s.applyBlock - s.weeks) + " hafta beklemelisin." : true);
  HS.FX.cardApply = (s) => {
    const p = HS.cardChance(s);
    const lim = HS.cardOffer(s);
    if (r() < p) {
      s.card = { limit: lim, bal: 0, stmt: 0, paid: 0, minDue: 0, due: 0, late: 0, blocked: false, auto: "min", since: s.weeks, fee: 0 };
      s.scenes.push({ t: "Kredi kartın onaylandı", p: "Limit " + money(lim) + ". Hesap kesim tarihi her ayın sonunda, son ödeme iki hafta sonra. Otomatik ödeme talimatı: asgari tutar.", art: "▭", kind: "win", odds: Math.round(p * 100) });
    } else {
      s.applyBlock = s.weeks + 8;
      scoreAdd(s, -5);
      s.scenes.push({ t: "Başvurun reddedildi", p: "Banka gelirini ve kredi notunu yetersiz buldu. Kredi notun: " + Math.round(s.score) + " (" + HS.scoreLabel(s.score) + ").", art: "✕", kind: "lose", odds: Math.round(p * 100) });
    }
  };
  HS.CAN.cardPay = (s, v) => (!s.card ? "Kartın yok." : s.cash < 1 ? "Nakdin yok." : true);
  HS.FX.cardPay = (s, v) => {
    const k = s.card;
    const want = v === "min" ? Math.max(0, k.minDue - k.paid) : v === "all" ? k.bal : Math.max(0, k.stmt - k.paid);
    const amt = Math.min(want, s.cash, k.bal);
    if (amt <= 0) return;
    s.cash -= amt;
    k.bal -= amt;
    k.paid += amt;
    (s.ledger = s.ledger || { in: [], out: [] }).out.push(["Kredi kartı ödemesi", amt]);
  };
  HS.FX.cardAuto = (s, v) => s.card && (s.card.auto = v);
  HS.CAN.cardClose = (s) => (!s.card ? "Kartın yok." : s.card.bal > 1 ? "Önce kart borcunun tamamını öde." : true);
  HS.FX.cardClose = (s) => {
    s.card = null;
    s.scenes.push({ t: "Kartını kapattın", p: "Banka bir kez daha düşünmeni istedi ama makas çoktan kartın ortasından geçmişti.", art: "✂" });
  };
  HS.CAN.cardLimitUp = (s) => (!s.card ? "Kartın yok." : s.weeks - s.card.since < 52 ? "Limit artışı için kartı en az bir yıl düzgün kullanmalısın." : s.card.late > 0 ? "Geciken ödemen var." : true);
  HS.FX.cardLimitUp = (s) => {
    const inc = income(s);
    const nl = Math.max(s.card.limit, Math.round((inc * 4) / 1000) * 1000);
    if (nl > s.card.limit && r() < clamp((s.score - 900) / 900, 0.1, 0.9)) {
      s.scenes.push({ t: "Limitin arttı", p: money(s.card.limit) + " → " + money(nl), art: "▲", kind: "win" });
      s.card.limit = nl;
    } else s.scenes.push({ t: "Limit artışı reddedildi", p: "Banka şimdilik mevcut limitin yeterli olduğunu düşünüyor.", art: "✕", kind: "lose" });
    s.card.since = s.weeks;
  };

  // ---- Krediler ----
  HS.loanMax = (s, kind) => {
    const inc = income(s);
    const room = Math.max(0, inc * 0.5 - loanLoad(s)); // gelirin yarısı taksit sınırı
    const R = HS.bankRates(s)[kind];
    const byRoom = room > 0 ? room * ((1 - Math.pow(1 + R, -36)) / R) : 0;
    return Math.max(0, Math.floor(Math.min(inc * LOANS[kind].max, byRoom) / 1000) * 1000);
  };
  HS.loanChance = (s, kind, amt) => {
    const mx = HS.loanMax(s, kind);
    if (!mx) return 0;
    return clamp(0.2 + (s.score - 700) / 1100 - (amt / mx) * 0.25 - (s.debt > 0 ? 0.3 : 0) + (s.jobWeeks > 26 ? 0.1 : -0.1), 0.03, 0.95);
  };
  HS.CAN.loanApply = (s, v) => {
    const L = LOANS[v.kind];
    if (s.age < 18) return "18 yaş gerekir.";
    if (income(s) <= 0) return "Düzenli gelir gerekir.";
    if (L.need) {
      const n = L.need(s);
      if (n !== true) return n;
    }
    if (s.applyBlock > s.weeks) return "Son reddin üzerinden " + (s.weeks - s.applyBlock + 8) + " hafta geçti; " + (s.applyBlock - s.weeks) + " hafta daha beklemelisin.";
    if (s.loans.length >= 3) return "Aynı anda en fazla 3 kredi.";
    if (v.amt > HS.loanMax(s, v.kind)) return "Gelirine göre en fazla " + money(HS.loanMax(s, v.kind)) + " çekebilirsin.";
    return true;
  };
  HS.FX.loanApply = (s, v) => {
    const p = HS.loanChance(s, v.kind, v.amt);
    const R = HS.bankRates(s)[v.kind];
    const mon = monthlyPay(v.amt, R, v.months);
    const fee = v.amt * 0.005; // tahsis ücreti (binde 5)
    if (r() < p) {
      s.loans.push({ id: nid("l"), kind: v.kind, name: LOANS[v.kind].name, amt: v.amt, left: v.amt, monthly: mon, months: v.months, rate: R, start: s.weeks });
      HS.earn(s, LOANS[v.kind].name, v.amt);
      HS.book(s, "Kredi tahsis ücreti", fee);
      if (HS.addStress) HS.addStress(s, 4);
      s.scenes.push({ t: "Kredin onaylandı", p: money(v.amt) + " hesabına yattı. " + v.months + " ay boyunca aylık " + money(mon) + " ödeyeceksin (aylık faiz %" + (R * 100).toFixed(2).replace(".", ",") + "). Toplam geri ödeme " + money(mon * v.months) + ".", art: "₺", kind: "win", odds: Math.round(p * 100) });
      HS.note(s, money(v.amt) + " " + LOANS[v.kind].name.toLocaleLowerCase("tr-TR") + " çekti.");
    } else {
      s.applyBlock = s.weeks + 8;
      scoreAdd(s, -8);
      s.scenes.push({ t: "Kredi başvurun reddedildi", p: "Banka, mevcut borç yükün ve kredi notunla bu tutarı riskli buldu. 8 hafta sonra yeniden deneyebilirsin.", art: "✕", kind: "lose", odds: Math.round(p * 100) });
    }
  };
  HS.CAN.loanClose = (s, id) => {
    const l = s.loans.find((x) => x.id === id);
    if (!l) return "Kredi bulunamadı.";
    return HS.fundsOf(s) < l.left * 1.02 ? HS.short(s, l.left * 1.02) : true;
  };
  HS.FX.loanClose = (s, id) => {
    const l = s.loans.find((x) => x.id === id);
    HS.book(s, l.name + " erken kapama", l.left * 1.02); // %2 erken ödeme ücreti
    s.loans = s.loans.filter((x) => x !== l);
    scoreAdd(s, 30);
    s.scenes.push({ t: "Kredi kapandı", p: "Son taksit de ödendi. Omzundan bir yük kalktı.", art: "✓", kind: "win" });
    if (HS.addStress) HS.addStress(s, -6);
  };

  // ---- Vadeli mevduat ----
  HS.DEPOSIT_TERMS = [
    { months: 1, mul: 1 },
    { months: 3, mul: 1.02 },
    { months: 6, mul: 0.96 },
    { months: 12, mul: 0.9 },
  ];
  HS.depositRate = (s, months) => HS.bankRates(s).deposit * HS.DEPOSIT_TERMS.find((t) => t.months === months).mul;
  HS.depositNet = (s, amt, months) => amt * HS.depositRate(s, months) * (months / 12) * (1 - HS.bankRates(s).stopaj);
  HS.CAN.depositOpen = (s, v) => (v.amt < 1000 * s.idx.cpi ? "En az " + money(1000 * s.idx.cpi) + "." : s.cash < v.amt ? "Bu kadar nakdin yok." : true);
  HS.FX.depositOpen = (s, v) => {
    s.cash -= v.amt;
    s.deposits.push({ id: nid("d"), amt: v.amt, months: v.months, rate: HS.depositRate(s, v.months), start: s.weeks, until: s.weeks + Math.round(v.months * M()) });
    HS.note(s, money(v.amt) + " " + v.months + " ay vadeli hesaba yattı.");
  };
  HS.CAN.depositBreak = (s, id) => (s.deposits.some((d) => d.id === id) ? true : "Hesap bulunamadı.");
  HS.FX.depositBreak = (s, id) => {
    const d = s.deposits.find((x) => x.id === id);
    s.deposits = s.deposits.filter((x) => x !== d);
    s.cash += d.amt;
    s.scenes.push({ t: "Vade bozuldu", p: money(d.amt) + " nakde geçti; işlemiş faiz yandı.", art: "✕", kind: "lose" });
  };
  const depValue = (s) => s.deposits.reduce((a, d) => a + d.amt, 0);
  HS.depositTotal = depValue;

  // ---- Faturalar ----
  HS.billPlan = (s) => {
    const ht = HS.Art && HS.Art.homeType ? HS.Art.homeType(s) : "aile";
    const city = HS.CITIES[s.city] || {};
    const season = s.week <= 9 || s.week >= 45 ? 0 : s.week >= 23 && s.week <= 36 ? 2 : 1;
    const cold = ["ic", "dogu", "karadeniz", "abroad"].includes(city.region) ? 1.25 : city.region === "akdeniz" ? 0.7 : 1;
    const share = ht === "paylasim" ? 0.5 : 1;
    const people = 1 + (s.partner && s.partner.married ? 1 : 0) + s.children.filter((k) => s.year - k.born < 18).length;
    const size = { daire: 1, kira: 0.9, paylasim: 1, mustakil: 1.5, villa: 2.4, yurtdisi: 1, aile: 1 }[ht] || 1;
    const out = [];
    for (const b of BILLS) {
      if (s.housing === "aile" && (!b.personal || (HS.CFG && !HS.CFG.familyBills))) continue;
      if (b.apt && !["daire", "kira", "paylasim", "yurtdisi"].includes(ht)) continue;
      let amt = b.amt * b.season[season] * s.idx.cpi;
      if (b.k === "dogalgaz") amt *= cold * size;
      if (b.k === "elektrik") amt *= size * (0.85 + people * 0.15) * (s.items && s.items.includes("klima") ? 1.25 : 1);
      if (b.k === "su") amt *= 0.7 + people * 0.3;
      if (!b.personal) amt *= share;
      if (city.region === "abroad") amt *= HS.COUNTRIES && HS.COUNTRIES[city.country] ? HS.COUNTRIES[city.country].costMul * 0.5 : 2;
      if (b.k === "telefon" && s.items && s.items.includes("telefon")) amt *= 1.3;
      out.push({ k: b.k, name: b.name, amt: Math.round(amt * (HS.CFG ? HS.CFG.billScale : 1)) });
    }
    return out;
  };
  const payBill = (s, b, auto) => {
    const late = b.late ? b.amt * 0.05 : 0;
    const total = b.amt + late + (s.cut[b.k] ? 250 * s.idx.cpi : 0);
    if (auto && HS.fundsOf(s) < total) return false;
    HS.book(s, b.name + " faturası", total);
    if (s.cut[b.k]) {
      delete s.cut[b.k];
      s.scenes.push({ t: b.name + " yeniden bağlandı", p: "Açma-kapama ücretiyle birlikte ödedin.", art: "✓" });
    }
    if (!b.late) scoreAdd(s, 1);
    s.bills = s.bills.filter((x) => x !== b);
    return true;
  };
  HS.CAN.billPay = (s, id) => {
    const list = id === "all" ? s.bills : s.bills.filter((b) => b.id === id);
    if (!list.length) return "Ödenecek fatura yok.";
    const t = list.reduce((a, b) => a + b.amt * (b.late ? 1.05 : 1), 0);
    return HS.fundsOf(s) < t ? HS.short(s, t) : true;
  };
  HS.FX.billPay = (s, id) => {
    const list = id === "all" ? s.bills.slice() : s.bills.filter((b) => b.id === id);
    list.forEach((b) => payBill(s, b));
  };
  HS.FX.billAuto = (s, v) => (s.billAuto = !!v);

  // ---- Zaman ----
  HS.HOOKS.monthly.push((s) => {
    const R = HS.bankRates(s);
    // Faturalar
    for (const b of HS.billPlan(s)) {
      const bill = { id: nid("b"), k: b.k, name: b.name, amt: b.amt, due: s.weeks + 2, late: false };
      s.bills.push(bill);
      if (s.billAuto) payBill(s, bill, true);
    }
    // Kart ekstresi: önceki dönemden kalan borca faiz işler
    const k = s.card;
    if (k) {
      const carried = Math.max(0, k.stmt - k.paid);
      if (carried > 1) {
        const interest = carried * (k.late ? R.cardLate : R.card);
        k.bal += interest;
        (s.ledger = s.ledger || { in: [], out: [] }).out.push(["Kart faizi (karta yansıdı)", interest]);
      }
      // Taksitli alışverişlerin yalnızca bu ayki taksiti ekstreye girer.
      k.inst = (k.inst || []).filter((i) => i.left > 0);
      k.inst.forEach((i) => i.left--);
      const future = k.inst.reduce((a, i) => a + i.amt * i.left, 0);
      k.stmt = Math.max(0, k.bal - future);
      k.paid = 0;
      k.minDue = k.stmt * (k.limit > 50000 * s.idx.cpi ? 0.4 : 0.2);
      k.due = s.weeks + 2;
      k.spent = 0;
      if (k.stmt > 1) {
        // Otomatik ödeme talimatı
        if (k.auto !== "off") {
          const want = k.auto === "full" ? k.stmt : k.minDue;
          const amt = Math.min(want, s.cash);
          s.cash -= amt;
          k.bal -= amt;
          k.paid += amt;
          if (amt > 0) (s.ledger = s.ledger || { in: [], out: [] }).out.push(["Kredi kartı otomatik ödeme", amt]);
        }
      }
    }
    // Kredi taksitleri
    for (const l of s.loans.slice()) {
      const interest = l.left * l.rate;
      const p = Math.min(l.monthly, l.left + interest);
      HS.book(s, l.name + " taksiti", p);
      l.left = Math.max(0, l.left + interest - p);
      if (l.left < 1) {
        s.loans = s.loans.filter((x) => x !== l);
        scoreAdd(s, 40);
        s.scenes.push({ t: l.name + " bitti", p: "Son taksit ödendi. Kredi notun yükseldi.", art: "✓", kind: "win" });
        if (HS.addStress) HS.addStress(s, -5);
      }
    }
    if (s.loans.length && HS.addStress) HS.addStress(s, 1 + loanLoad(s) / Math.max(1, income(s)) * 6);
  });
  HS.HOOKS.weekly.push((s) => {
    // Vadesi dolan mevduat
    for (const d of s.deposits.slice()) {
      if (s.weeks >= d.until) {
        const net = d.amt * d.rate * (d.months / 12) * (1 - HS.bankRates(s).stopaj);
        s.deposits = s.deposits.filter((x) => x !== d);
        s.savings += d.amt + net;
        (s.ledger = s.ledger || { in: [], out: [] }).in.push(["Vadeli mevduat faizi (net)", net]);
        s.scenes.push({ t: "Vadeli hesabın doldu", p: money(d.amt) + " ana para ve " + money(net) + " net faiz vadesiz hesabına geçti.", art: "₺", kind: "win" });
      }
    }
    // Geciken faturalar
    for (const b of s.bills) {
      if (!b.late && s.weeks > b.due) {
        b.late = true;
        scoreAdd(s, -12);
        if (HS.addStress) HS.addStress(s, 2);
      }
      if (b.late && s.weeks > b.due + 4 && !s.cut[b.k] && ["elektrik", "dogalgaz", "internet", "su", "telefon"].includes(b.k)) {
        s.cut[b.k] = s.weeks;
        s.mood = clamp(s.mood - 6, 0, 100);
        if (HS.addStress) HS.addStress(s, 6);
        s.scenes.push({ t: b.name + " kesildi", p: "Ödenmeyen fatura yüzünden " + b.name.toLocaleLowerCase("tr-TR") + " kesildi. Ödeyince açma-kapama ücretiyle geri gelir.", art: "✕", kind: "lose" });
      }
    }
    // Kart son ödeme günü
    const k = s.card;
    if (k && k.stmt > 1 && k.due && s.weeks === k.due) {
      if (k.paid + 1 < k.minDue) {
        k.late++;
        scoreAdd(s, -40);
        if (HS.addStress) HS.addStress(s, 5);
        if (k.late >= 3) {
          k.blocked = true;
          s.scenes.push({ t: "Kartın kullanıma kapatıldı", p: "Üç ekstredir asgari tutar ödenmedi. Banka kartı kapattı; borç yasal takibe gidebilir.", art: "✕", kind: "lose" });
        } else s.scenes.push({ t: "Kart ödemesi gecikti", p: "Asgari tutar ödenmedi; gecikme faizi işleyecek ve kredi notun düştü.", art: "!", kind: "lose" });
      } else if (k.paid + 1 >= k.stmt) {
        k.late = 0;
        scoreAdd(s, 6);
      } else scoreAdd(s, 2);
    }
    // Kapatılmış kart borcu 3 ay sonra yasal takibe (genel borca) geçer
    if (k && k.blocked && s.weeks - k.due > 12 && k.bal > 1) {
      s.debt += k.bal * 1.1;
      s.card = null;
      scoreAdd(s, -120);
      s.scenes.push({ t: "Borç yasal takipte", p: "Kart borcun icra takibine devredildi. Kredi notun ciddi biçimde düştü.", art: "⚖", kind: "lose" });
    }
    // Zamanla not toparlanır
    if (s.weeks % 13 === 0 && !s.bills.some((b) => b.late)) scoreAdd(s, 4);
  });
  HS.HOOKS.worth.push((s) => depValue(s) - (s.card ? s.card.bal : 0) - s.loans.reduce((a, l) => a + l.left, 0) - s.bills.reduce((a, b) => a + b.amt, 0));

  // ---- Olaylar ----
  HS.EVENTS.push(
    {
      id: "depositEmergency",
      weight: (s) => (s.deposits.length && depValue(s) > s.cash ? 2.2 : 0),
      cooldown: 20,
      title: (s) => HS.pick(["Beklenmedik masraf", "Kombi bozuldu", "Diş ağrısı", "Araba serviste"]),
      text: (s) => "Paranın çoğu vadeli hesapta kilitli ve tam şimdi " + money(Math.round(14000 * s.idx.cpi)) + " tutan bir masraf çıktı. Nakdin " + money(s.cash) + ".",
      choices: (s) => {
        const cost = Math.round(14000 * s.idx.cpi);
        const d = s.deposits[0];
        return [
          c("Vadeyi boz", "Faiz yanar, masraf ödenir.", { breakPay: { id: d.id, cost } }),
          s.card ? c("Kredi kartıyla öde", "Kart borcu artar; ay sonu faiz riski.", { cardCharge: cost, stress: 3 }) : null,
          c("Bir süre idare et", "Masrafı ertele; sağlık ya da mutluluk düşer.", { m: -6, h: -3, stress: 5 }),
        ];
      },
    },
    {
      id: "phishing",
      weight: (s) => (s.card || s.savings > 10000 ? 0.5 : 0),
      cooldown: 104,
      title: "Bankadan(?) SMS",
      text: "\"Kartınız güvenlik nedeniyle bloke edilmiştir. Kaldırmak için linke tıklayın.\" Numara tanıdık değil ama logo bankanınkine benziyor.",
      choices: (s) => [
        c("Linke tıkla, bilgileri gir", "Acelen var...", { chance: { p: 0.15, win: { m: 0 }, lose: { cash: -Math.min(s.cash + s.savings * 0.3, 40000 * s.idx.cpi), raw: true, m: -10, stress: 10 }, winT: "Son anda fark ettin", winP: "Sayfanın adresi yanlıştı; sekmeyi kapattın.", loseT: "Dolandırıldın", loseP: "Hesabından para çekildi. Banka itiraz sürecinin aylar sürebileceğini söyledi." } }),
        c("Bankayı kendin ara", "Müşteri hizmetleri bunun dolandırıcılık olduğunu söyler.", { m: 1 }),
        c("Sil ve engelle", "", {}),
      ],
    },
    {
      id: "bankCampaign",
      weight: (s) => (!s.card && income(s) > 0 ? 0.8 : 0),
      cooldown: 52,
      title: "Kart kampanyası",
      text: "Banka şubesinde görevli seni yakaladı: \"Kredi kartı açarsanız ilk harcamanıza 500 lira puan!\"",
      choices: [
        c("Başvur", "Onay belirsiz; kredi notuna bakılır.", { cardApply: 1 }),
        c("Gerek yok", "Nakitle idare et.", {}),
      ],
    },
  );
  HS.CAN.breakPay = (s, v) => (s.deposits.some((d) => d.id === v.id) ? true : "Hesap bulunamadı.");
  HS.FX.breakPay = (s, v) => {
    HS.FX.depositBreak(s, v.id);
    HS.book(s, "Beklenmedik masraf", v.cost);
  };
  // Kartla doğrudan ödeme (olaylarda)
  HS.CAN.cardCharge = (s, v) => (cardAvail(s) < v ? "Kart limitin yetmiyor." : true);
  HS.FX.cardCharge = (s, v) => {
    s.card.bal += v;
    (s.ledger = s.ledger || { in: [], out: [] }).out.push(["Kartla ödeme", v]);
  };
})(globalThis.HS || (globalThis.HS = {}));
