// Takvim: oyundaki her şeyin tarihi otomatik not edilir (sınavlar, faturalar, kart ekstresi,
// maaş günü, kira, vadeli hesap, kredi taksitleri, başvuru sonuçları, vize randevusu,
// ehliyet sınavı, kurslar, askerlik, vardiya değişimi, doğum günleri, yıl dönümü, resmî
// ve dinî bayramlar). Oyuncu kendi notunu da ekleyebilir.
// Her sistem HS.HOOKS.calendar'a (s, add) => {...} ile kayıt ekleyebilir.
// add(mutlakHafta, gün(0-6) | null, metin, tür)
(function (HS) {
  "use strict";
  HS.HOOKS.calendar = HS.HOOKS.calendar || [];
  const AY = ["Oca", "Şub", "Mar", "Nis", "May", "Haz", "Tem", "Ağu", "Eyl", "Eki", "Kas", "Ara"];
  const GUN = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
  // Oyun haftası → gerçek tarih (yılın ilk pazartesisinden başlayarak)
  const firstMonday = (y) => {
    const d = new Date(y, 0, 1);
    const dow = (d.getDay() + 6) % 7; // 0 = pazartesi
    d.setDate(d.getDate() + (dow === 0 ? 0 : 7 - dow));
    return d;
  };
  HS.weekToDate = (y, w, day = 0) => {
    const d = firstMonday(y);
    d.setDate(d.getDate() + (w - 1) * 7 + day);
    return d;
  };
  HS.dateToWeek = (date) => {
    const y = date.getFullYear();
    const fm = firstMonday(y);
    const diff = Math.floor((date - fm) / 86400000);
    if (diff < 0) return { y: y - 1, w: 52, day: (date.getDay() + 6) % 7 };
    return { y, w: Math.min(52, Math.floor(diff / 7) + 1), day: (date.getDay() + 6) % 7 };
  };
  // Mutlak hafta (s.weeks ölçeği) ↔ yıl/hafta
  HS.absToYW = (s, abs) => {
    let w = s.week + (abs - s.weeks);
    let y = s.year;
    while (w > 52) {
      w -= 52;
      y++;
    }
    while (w < 1) {
      w += 52;
      y--;
    }
    return { y, w };
  };
  HS.ywToAbs = (s, y, w) => s.weeks + (y - s.year) * 52 + (w - s.week);
  HS.fmtDate = (d) => d.getDate() + " " + AY[d.getMonth()] + " " + GUN[(d.getDay() + 6) % 7];

  // Resmî tatiller (sabit) ve dinî bayramlar (yaklaşık tarihler)
  const FIXED = [
    [0, 1, "Yılbaşı"],
    [3, 23, "23 Nisan Ulusal Egemenlik ve Çocuk Bayramı"],
    [4, 1, "1 Mayıs Emek ve Dayanışma Günü"],
    [4, 19, "19 Mayıs Atatürk'ü Anma, Gençlik ve Spor Bayramı"],
    [6, 15, "15 Temmuz Demokrasi ve Millî Birlik Günü"],
    [7, 30, "30 Ağustos Zafer Bayramı"],
    [9, 29, "29 Ekim Cumhuriyet Bayramı"],
  ];
  const RELIGIOUS = {
    2026: [[2, 20, "Ramazan Bayramı"], [4, 27, "Kurban Bayramı"]],
    2027: [[2, 10, "Ramazan Bayramı"], [4, 17, "Kurban Bayramı"]],
    2028: [[1, 27, "Ramazan Bayramı"], [4, 5, "Kurban Bayramı"]],
    2029: [[1, 15, "Ramazan Bayramı"], [3, 24, "Kurban Bayramı"]],
    2030: [[1, 5, "Ramazan Bayramı"], [3, 13, "Kurban Bayramı"]],
  };

  function init(s) {
    s.calNotes = s.calNotes || [];
  }
  HS.HOOKS.newLife.push(init);
  HS.HOOKS.migrate.push(init);
  HS.FX.calNote = (s, v) => s.calNotes.push({ w: v.w, t: String(v.t).slice(0, 80) });
  HS.FX.calDel = (s, i) => s.calNotes.splice(i, 1);
  const bw = (o, seed) => o.bw || (o.bw = (Math.abs(seed | 0) % 52) + 1);

  // Takvim kayıtlarını üret: önümüzdeki `span` hafta
  HS.calendar = (s, span = 26) => {
    const out = [];
    const end = s.weeks + span;
    const add = (abs, day, t, kind = "not") => {
      if (abs == null || abs < s.weeks || abs > end) return;
      const { y, w } = HS.absToYW(s, abs);
      const d = HS.weekToDate(y, w, day == null ? 0 : day);
      out.push({ abs, day: day == null ? null : day, t, kind, date: d, y, w });
    };
    // Her yıl tekrar eden haftalık kayıtlar için yardımcı
    const yearly = (week, day, t, kind) => {
      for (let y = s.year; y <= s.year + Math.ceil(span / 52) + 1; y++) add(HS.ywToAbs(s, y, week), day, t, kind);
    };
    // Bayramlar
    for (let y = s.year; y <= s.year + 1; y++) {
      for (const [m, d, t] of FIXED.concat(RELIGIOUS[y] || [])) {
        const g = HS.dateToWeek(new Date(y, m, d));
        add(HS.ywToAbs(s, g.y, g.w), g.day, t, "tatil");
      }
    }
    // Doğum günleri ve yıl dönümü
    yearly(1, 0, "Senin doğum günün (" + (s.age + 1) + ". yaş)", "dogum");
    (s.kin || []).forEach((k) => k.alive && ["anne", "baba", "kardesK", "kardesE", "abla", "abi", "anneanne", "dede", "babaanne"].includes(k.rel) && yearly(bw(k, k.seed), (k.seed >> 3) % 7, HS.kinLabel(k) + " " + HS.ek(k.name, "gen") + " doğum günü", "dogum"));
    if (s.partner) {
      yearly(bw(s.partner, s.seed + 11), (s.seed >> 2) % 7, HS.ek(s.partner.name, "gen") + " doğum günü", "dogum");
      if (s.partner.married) yearly(bw((s.partner.ann = s.partner.ann || {}), s.seed + 29), 5, "Evlilik yıl dönümü", "dogum");
    }
    s.children.forEach((c) => yearly(bw(c, c.name.length * 7 + c.born), 2, HS.ek(c.name, "gen") + " doğum günü", "dogum"));
    // Para
    const nextMonth = (() => {
      for (let i = 1; i <= 6; i++) {
        const t = s.weeks + i;
        if (Math.floor(t / HS.WEEKS_PER_MONTH) !== Math.floor((t - 1) / HS.WEEKS_PER_MONTH)) return t;
      }
      return null;
    })();
    if (nextMonth) {
      const b = HS.budget(s);
      if (s.job !== "none" || s.retired) add(nextMonth, 4, (s.retired ? "Emekli maaşı" : "Maaş günü") + " · ~" + HS.money(b.income * HS.WEEKS_PER_MONTH), "para");
      if (b.rent > 0) add(nextMonth, 0, "Kira ödemesi · " + HS.money(b.rent * HS.WEEKS_PER_MONTH), "para");
      if (HS.billPlan && HS.billPlan(s).length) add(nextMonth, 1, "Yeni faturalar gelecek", "para");
      (s.loans || []).forEach((l) => add(nextMonth, 2, l.name + " taksiti · " + HS.money(l.monthly), "para"));
      if (s.card) add(nextMonth, 3, "Kredi kartı hesap kesimi", "para");
      if (s.job === "factory" || s.job === "nurse") add(nextMonth, 0, "Vardiya değişiyor", "is");
    }
    (s.bills || []).forEach((b) => add(Math.max(s.weeks, b.due), 4, b.name + " faturası son ödeme · " + HS.money(b.amt) + (b.late ? " (gecikmiş!)" : ""), "para"));
    if (s.card && s.card.stmt > 1 && s.card.paid + 1 < s.card.stmt) add(s.card.due, 4, "Kart ekstresi son ödeme · " + HS.money(s.card.stmt - s.card.paid), "para");
    (s.deposits || []).forEach((d) => add(d.until, 0, "Vadeli hesap doluyor · " + HS.money(d.amt), "para"));
    if (s.gym && s.gym.until > s.weeks) add(s.gym.until, 0, "Spor salonu üyeliği bitiyor", "kisisel");
    // İş, okul, süreçler
    (s.apps || []).forEach((a) => add(a.due, 2, (a.co && HS.co ? HS.co(a.co).name : HS.JOBS[a.job].name) + " başvurusu: haber bekleniyor", "is"));
    (s.courses || []).forEach((c) => add(s.weeks + c.left, 4, HS.COURSES.find((x) => x.id === c.id).name + " bitiyor", "okul"));
    if (s.license === "kurs" || s.license === "direksiyon") add(s.licenseAt, 2, s.license === "kurs" ? "Sürücü kursu bitiyor" : "Direksiyon sınavı", "kisisel");
    if (s.mil === "serving") add(s.milUntil, 4, "Tezkere", "kisisel");
    if (s.tour) add(s.tour.until, 6, HS.TOURS[s.tour.k].name + " bitiyor", "is");
    if (s.visa) {
      if (s.visa.stage === "randevu") add(s.visa.apptAt, 2, s.visa.country + " vize randevusu", "kisisel");
      if (s.visa.stage === "degerlendirme") add(s.visa.decideAt, 3, s.visa.country + " vize kararı", "kisisel");
    }
    if (s.edu === "ogrenci") {
      yearly(3, 0, "Bahar dönemi başlıyor", "okul");
      yearly(22, 0, "Final haftası", "okul");
      yearly(38, 0, "Güz dönemi başlıyor", "okul");
      yearly(2, 0, "Vize/final sınavları", "okul");
    }
    // Sınav takvimi
    if (s.exam && s.exam.phase !== "bitti") {
      const E = HS.EXAM_WEEKS,
        y = s.exam.year;
      const at = (w) => HS.ywToAbs(s, y, w);
      if (!s.exam.applied) add(Math.max(s.weeks, at(E.applyFrom)), 0, y + " YKS başvuruları açılıyor (son gün " + HS.fmtDate(HS.weekToDate(y, E.applyTo, 4)) + ")", "okul");
      add(at(E.applyTo), 4, "YKS başvurusu son gün", "okul");
      add(at(E.exam), 5, y + " YKS (TYT cumartesi, AYT pazar)", "okul");
      add(at(E.result), 2, "YKS sonuçları açıklanıyor", "okul");
      add(at(E.pref), 1, "Tercih dönemi", "okul");
      add(at(E.place), 3, "Yerleştirme sonuçları", "okul");
      add(at(E.enroll), 0, "Üniversite kaydı", "okul");
    }
    // Elle eklenen notlar
    (s.calNotes || []).forEach((n, i) => {
      if (n.w >= s.weeks) add(n.w, null, n.t, "elle");
    });
    HS.HOOKS.calendar.forEach((f) => f(s, add));
    out.sort((a, b) => a.date - b.date);
    return out;
  };
  HS.todayDate = (s) => HS.weekToDate(s.year, s.week, s.clock ? s.clock.day : 0);
})(globalThis.HS || (globalThis.HS = {}));
