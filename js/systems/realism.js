// Gerçekçilik paketi:
//  - Trafik: şehre ve ulaşım şekline göre günlük yol süresi; uzun yol stres ve boş zaman yer.
//  - İstifa ve ihbar süresi (kıdeme göre 2-8 hafta); hemen ayrılınca ihbar tazminatı kesilir.
//  - Gelir vergisi dilimleri: yıl içinde kümülatif gelir arttıkça net maaş erir; esnafa Bağ-Kur.
//  - Partnerle güven barı, yıl dönümü, kıskançlık.
//  - Sosyal baskı ve özgüven: "ne zaman evleniyorsun / çocuk / ev?" soruları.
//  - Çocuk mizacı, kreş-bakıcı seçimi ve aylık bakım masrafı.
//  - Kiracılık: kira sözleşmeyle sabitlenir, yıllık artış TÜFE ile sınırlı; 5 yıl sonra kira
//    tespit davası, "oğlum gelecek" tahliyesi, tahliye taahhütnamesi.
//  - İkinci el araç: ekspertizsiz alımda gizli arıza riski, sanayi masrafı.
//  - Uyku borcu: uykusuz geçen geceler şansa bağlı seçimlerde başarı ihtimalini düşürür.
//  - Kronik hastalıklar: yaş, kilo, stres ve hareketsizlikle tansiyon, bel fıtığı, diyabet.
(function (HS) {
  "use strict";
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const r = () => HS.rng();
  const money = (n) => HS.money(n);
  const c = (label, hint, fx = {}) => ({ label, hint, fx });
  const W = () => HS.WEEKS_PER_MONTH;

  function init(s) {
    s.esteem = s.esteem ?? 55;
    s.sleepDebt = s.sleepDebt ?? 0;
    s.chronic = s.chronic || [];
    s.ytdGross = s.ytdGross || 0;
    if (s.partner && s.partner.trust == null) s.partner.trust = 70;
    s.children.forEach((k) => k.temp || (k.temp = HS.pick(TEMPS)));
  }
  const TEMPS = ["sakin", "hareketli", "inatçı", "utangaç", "meraklı"];
  HS.TEMP_NAMES = { sakin: "Sakin", hareketli: "Hareketli", inatçı: "İnatçı", utangaç: "Utangaç", meraklı: "Meraklı" };
  HS.HOOKS.newLife.push(init);
  HS.HOOKS.migrate.push(init);

  // ---------- Trafik ----------
  const BIG = { İstanbul: 70, Ankara: 45, İzmir: 45, Bursa: 35, Antalya: 32, Kocaeli: 35, Adana: 30, Konya: 28, Gaziantep: 30, Mersin: 28, Kayseri: 25 };
  HS.commuteMin = (s) => {
    if (s.job === "none" && s.edu !== "ogrenci") return 0;
    if (["business", "music", "crime"].includes(s.job)) return 15;
    const city = HS.CITIES[s.city] || {};
    let m = BIG[s.city] || (city.region === "abroad" ? 40 : 20);
    const motor = s.car && !["bisiklet"].includes(s.car);
    const st = (s.style && s.style.transport) ?? 1;
    if (motor) m *= s.city === "İstanbul" ? 1.05 : 0.8;
    else if (st === 0) m *= m > 40 ? 1.6 : 1.1;
    else if (st === 2) m *= 0.85;
    else m *= 1.2;
    if (s.company && HS.co(s.company) && HS.co(s.company).id === "atlas") m *= 0.6; // evden çalışma günleri
    return Math.round(m);
  };
  HS.freeSlotsMod = (s) => (HS.commuteMin(s) >= 65 ? -1 : 0);
  HS.HOOKS.weekly.push((s) => {
    const m = HS.commuteMin(s);
    if (m > 0 && HS.addStress) HS.addStress(s, (m * 2 * 5) / 60 / 7);
  });

  // ---------- İstifa ve ihbar ----------
  HS.noticeWeeks = (s) => (s.jobWeeks < 26 ? 2 : s.jobWeeks < 78 ? 4 : s.jobWeeks < 156 ? 6 : 8);
  HS.CAN.resign = (s) => (s.job === "none" ? "Zaten çalışmıyorsun." : s.notice ? "İhbar süren zaten işliyor." : true);
  HS.FX.resign = (s, v) => {
    const n = HS.noticeWeeks(s);
    if (v === "now") {
      HS.book(s, "İhbar tazminatı (" + n + " hafta)", (HS.wage(s) / W()) * n);
      HS.apply(s, { job: "none", leaveCompany: 1, noTheme: true });
      s.scenes.push({ t: "Kapıyı çarpıp çıktın", p: n + " haftalık ihbar süresini çalışmadığın için o kadar maaşın tazminat olarak kesildi.", art: "✕" });
    } else {
      s.notice = { until: s.weeks + n };
      s.scenes.push({ t: "İstifa dilekçesi verildi", p: "İhbar süren " + n + " hafta. Bu sürede çalışmaya ve maaş almaya devam edeceksin; sonra işten ayrılacaksın.", art: "✎" });
    }
  };
  HS.HOOKS.weekly.push((s) => {
    if (s.notice && s.weeks >= s.notice.until) {
      s.notice = null;
      if (s.job !== "none") {
        HS.apply(s, { job: "none", leaveCompany: 1, noTheme: true });
        s.scenes.push({ t: "Son iş günü", p: "İhbar süren doldu; vedalaştın ve masanı topladın.", art: "✓" });
      }
    }
  });

  // ---------- Gelir vergisi ve Bağ-Kur ----------
  // 2026 ücret geliri dilimleri (yaklaşık, oyun için yuvarlanmış)
  HS.TAX_BRACKETS = [
    [190000, 0.15],
    [400000, 0.2],
    [1500000, 0.27],
    [5300000, 0.35],
    [Infinity, 0.4],
  ];
  const rateAt = (g) => HS.TAX_BRACKETS.find(([lim]) => g <= lim)[1];
  HS.taxAdj = (s, net) => {
    const cpi = s.idx.cpi;
    const gross = net / 0.6924;
    const mid = (s.ytdGross + gross / 2) / cpi;
    const before = rateAt(s.ytdGross / cpi);
    s.ytdGross += gross;
    const rt = rateAt(mid);
    s.taxRate = rt;
    if (rt > before && rt > 0.15) s.scenes.push({ t: "Vergi dilimi değişti", p: "Bu yıl kazandıkların %" + Math.round(rt * 100) + " gelir vergisi dilimine girdi. Brüt maaşın aynı ama bordrondaki net tutar düştü; ocakta yeniden %15'ten başlar.", art: "₺", kind: "lose" });
    return (0.8424 - rt) / 0.6924;
  };
  HS.HOOKS.yearly.push((s) => {
    s.ytdGross = 0;
    s.taxRate = 0.15;
  });
  HS.HOOKS.monthly.push((s) => {
    if (s.job === "business") {
      HS.book(s, "Bağ-Kur primi", 9700 * s.idx.cpi);
      HS.book(s, "Muhasebeci ücreti", 3500 * s.idx.cpi);
    }
  });

  // ---------- Partner: güven ----------
  HS.HOOKS.weekly.push((s) => {
    const p = s.partner;
    if (!p) return;
    if (p.trust == null) p.trust = 70;
    if (p.married && !p.ann) p.ann = { bw: s.week }; // yıl dönümü: evlendiğin hafta
    p.trust = clamp(p.trust + (p.bond >= 60 ? 0.15 : p.bond < 30 ? -0.25 : 0), 0, 100);
  });
  HS.FX.trust = (s, v) => s.partner && (s.partner.trust = clamp((s.partner.trust ?? 70) + v, 0, 100));

  // ---------- Özgüven ----------
  HS.FX.esteem = (s, v) => (s.esteem = clamp((s.esteem ?? 55) + v, 0, 100));
  HS.esteemLabel = (v) => (v >= 75 ? "Kendinden emin" : v >= 50 ? "Dengeli" : v >= 30 ? "Kırılgan" : "Çok düşük");
  HS.HOOKS.weekly.push((s) => {
    const base = 48 + (s.job !== "none" ? 6 : s.edu === "ogrenci" ? 4 : -8) + (s.assets.house ? 6 : 0) + (s.partner ? 4 : 0) + Math.min(10, (s.jobLevel || 0) * 2.5) + (HS.level ? Math.min(8, HS.level(s)) : 0) - (s.debt > 0 ? 8 : 0) + (s.body && HS.Body && HS.Body.bmi(s) > 30 ? -4 : 0);
    s.esteem = clamp(s.esteem + (base - s.esteem) * 0.04, 0, 100);
    if (s.esteem < 30) s.mood = clamp(s.mood - 0.4, 0, 100);
  });

  // ---------- Çocuk: mizaç ve bakım ----------
  HS.CARE = {
    devlet: { name: "Devlet anaokulu", cost: 1500, fx: { kidBond: 0 } },
    ozel: { name: "Özel kreş", cost: 30000, fx: {} },
    bakici: { name: "Bakıcı", cost: 35000, fx: { stress: -2 } },
    aile: { name: "Anneanne / babaanne bakıyor", cost: 0, fx: {} },
    ev: { name: "Evde kendin bakıyorsun", cost: 0, fx: {} },
  };
  HS.HOOKS.weekly.push((s) => {
    s.children.forEach((k) => k.temp || (k.temp = HS.pick(TEMPS)));
  });
  HS.HOOKS.monthly.push((s) => {
    s.children.forEach((k) => {
      const a = s.year - k.born;
      if (k.care && a >= 1 && a < 6 && HS.CARE[k.care].cost) HS.book(s, k.name + " · " + HS.CARE[k.care].name, HS.CARE[k.care].cost * s.idx.cpi);
    });
  });
  HS.FX.care = (s, v) => {
    const k = s.children.find((x) => x.name === v.name);
    if (k) k.care = v.care;
    if (v.care === "ev" && s.job !== "none") HS.apply(s, { stress: 6, noTheme: true });
  };

  // ---------- Kiracılık ----------
  HS.HOOKS.weekly.push((s) => {
    const renting = s.housing === "kira" || s.housing === "kira-paylasim";
    if (!renting) {
      s.rentBase = null;
      return;
    }
    if (!s.rentBase || s.rentCity !== s.city) {
      s.rentBase = HS.rentFull(s) / (HS.CFG ? HS.CFG.rentScale : 1);
      s.rentCity = s.city;
      s.rentStart = s.weeks;
      s.flags.newLease = s.weeks;
    }
  });
  HS.HOOKS.yearly.push((s) => {
    if (!s.rentBase) return;
    const cap = HS.rate(s, "cpi");
    s.rentBase *= 1 + cap;
    s.scenes.push({ t: "Kira zammı", p: "Ev sahibi kirayı yasal sınır olan son 12 ayın TÜFE ortalaması kadar (%" + Math.round(cap * 100) + ") artırdı. Yeni kira: " + money(s.rentBase * (s.housing === "kira-paylasim" ? 0.5 : 1)) + ".", art: "₺" });
  });

  // ---------- İkinci el araç ----------
  HS.usedPrice = (s, model) => HS.carPrice(s, model) * 0.62;
  HS.CAN.buyUsed = (s, v) => {
    const motor = v.model !== "bisiklet";
    if (motor && s.license !== "var") return "Ehliyet gerekir.";
    if (s.car && !v.trade) return "Önce mevcut aracını sat.";
    const price = HS.usedPrice(s, v.model) + (v.exp ? 4500 * s.idx.cpi : 0) - (s.car ? HS.carPrice(s) * 0.55 : 0);
    return HS.fundsOf(s) < price ? HS.short(s, price) : true;
  };
  HS.FX.buyUsed = (s, v) => {
    if (s.car && v.trade) s.cash += HS.carPrice(s) * 0.55;
    HS.book(s, "İkinci el " + HS.Art.CARS[v.model].name, HS.usedPrice(s, v.model));
    if (v.exp) HS.book(s, "Ekspertiz", 4500 * s.idx.cpi);
    s.car = v.model;
    s.carColor = (r() * 6) | 0;
    s.assets.car = v.model !== "bisiklet";
    s.carUsed = { hidden: r() < (v.exp ? 0.08 : 0.35), at: s.weeks };
    HS.note(s, "İkinci el " + HS.Art.CARS[v.model].name + " aldı.");
  };

  // ---------- Uyku borcu ----------
  HS.FX.sleep = (s, v) => (s.sleepDebt = clamp((s.sleepDebt || 0) + v, 0, 40));
  HS.chanceMod = (s, p) => clamp(p * (1 - Math.min(0.25, (s.sleepDebt || 0) / 120)), 0.01, 0.99);
  HS.HOOKS.weekly.push((s) => {
    const sch = HS.schedule ? HS.schedule(s) : null;
    let d = -4;
    if (sch && sch.shift && sch.shift.id === "gece") d += 4;
    if (s.children.some((k) => s.year - k.born < 2)) d += 3;
    if (s.stress > 70) d += 2;
    s.sleepDebt = clamp((s.sleepDebt || 0) + d, 0, 40);
    if (s.sleepDebt > 20) s.health = clamp(s.health - 0.3, 0, 100);
  });
  HS.HOOKS.event.push((s, def) => {
    if (["insomnia", "lateNightPhone", "babyNight", "nurseNight", "snoring", "alarmFight"].includes(def.id)) s.sleepDebt = clamp((s.sleepDebt || 0) + 3, 0, 40);
  });
  const erken = HS.ACTIVITIES.find((a) => a.id === "erkenyat");
  if (erken) {
    const f = erken.fx;
    erken.fx = (s, ctx, p) => ({ ...(typeof f === "function" ? f(s, ctx, p) : f), sleep: -8 });
  }
  const dinlen = HS.ACTIVITIES.find((a) => a.id === "dinlen");
  if (dinlen) {
    const f = dinlen.fx;
    dinlen.fx = (s, ctx, p) => ({ ...(typeof f === "function" ? f(s, ctx, p) : f), sleep: -4 });
  }
  HS.sleepLabel = (v) => (v >= 25 ? "Ağır uykusuz" : v >= 12 ? "Uykusuz" : v >= 5 ? "Biraz yorgun" : "Dinç");

  // ---------- Kronik hastalıklar ----------
  HS.CHRONIC = {
    tansiyon: { name: "Yüksek tansiyon", med: 700 },
    belfitigi: { name: "Bel fıtığı", med: 900 },
    diyabet: { name: "Tip 2 diyabet", med: 1400 },
  };
  HS.HOOKS.yearly.push((s) => {
    if (s.age < 33 || s.pendingDx) return;
    const bmi = HS.Body ? HS.Body.bmi(s) : 24;
    const mus = s.body ? s.body.mus : 30;
    const risks = {
      tansiyon: 0.01 + Math.max(0, s.age - 40) * 0.003 + (s.stress > 60 ? 0.03 : 0) + (bmi > 30 ? 0.03 : 0),
      belfitigi: 0.008 + (["office", "factory", "nurse"].includes(s.job) ? 0.015 : 0) + (mus < 20 ? 0.02 : 0) + (bmi > 30 ? 0.02 : 0),
      diyabet: 0.004 + (bmi > 30 ? 0.04 : bmi > 27 ? 0.015 : 0) + Math.max(0, s.age - 45) * 0.002,
    };
    for (const [k, p] of Object.entries(risks)) if (!s.chronic.includes(k) && r() < p) s.pendingDx = k;
  });
  HS.HOOKS.monthly.push((s) => {
    for (const k of s.chronic) HS.book(s, HS.CHRONIC[k].name + " · ilaç ve kontrol", HS.CHRONIC[k].med * s.idx.cpi * (s.ins && s.ins.health ? 0.3 : 1));
  });
  HS.HOOKS.weekly.push((s) => {
    if (s.chronic.length) s.health = clamp(s.health - 0.08 * s.chronic.length, 0, 100);
  });
  HS.FX.dx = (s, v) => {
    if (!s.chronic.includes(v)) s.chronic.push(v);
    s.pendingDx = null;
    HS.note(s, HS.CHRONIC[v].name + " teşhisi kondu.");
  };

  // ---------- Olaylar ----------
  HS.EVENTS.push(
    {
      id: "chronicDx",
      priority: 74,
      cooldown: 1,
      room: "sokak",
      when: (s) => !!s.pendingDx,
      title: (s) => "Doktorun yüzü ciddi: " + HS.CHRONIC[s.pendingDx].name,
      text: (s) => ({ tansiyon: "Baş ağrıları ve ensendeki zonklama boşuna değilmiş. Tansiyonun hep yüksek çıkıyor.", belfitigi: "Bacağına vuran ağrı belinden geliyormuş. MR sonucu net: fıtık.", diyabet: "Sürekli susuyordun. Kan şekerin yüksek; doktor yaşam tarzını değiştirmen gerektiğini söylüyor." })[s.pendingDx] + " Bundan sonra düzenli ilaç ve kontrol gerekecek.",
      choices: (s) => [
        c("Özel hastanede tedavi ve takip", "Muayene ve tetkikler " + money(Math.round(25000 * s.idx.cpi * (s.ins && s.ins.health ? 0.25 : 1))), { cost: 25000 * (s.ins && s.ins.health ? 0.25 : 1), dx: s.pendingDx, h: 2, stress: 3 }),
        c("Devlet hastanesinde sıraya gir", "Ücretsiz ama randevu haftalar sürer.", { dx: s.pendingDx, h: -3, stress: 6 }),
        c("Yaşam tarzını değiştir: spor, diyet", "Doktor uyardı; ilaca yine de başla.", { dx: s.pendingDx, kg: -1, m: -2, h: 1 }),
      ],
    },
    {
      id: "anniversary",
      priority: 66,
      cooldown: 40,
      when: (s) => s.partner && s.partner.married && s.partner.ann && s.week === s.partner.ann.bw,
      title: "Evlilik yıl dönümü",
      text: (s) => "Bugün " + s.partner.name + " ile evliliğinizin yıl dönümü. Takvimine not edilmişti.",
      choices: (s) => [
        c("Sürpriz yemek ve hediye", "₺4.500", { cost: 4500, bond: 8, trust: 6, m: 5 }),
        c("Evde mumlu bir akşam yemeği", "₺800", { cost: 800, bond: 5, trust: 3, m: 3 }),
        c("İşten geç geldin, unuttun", "Kırgınlık...", { bond: -8, trust: -10, m: -4, stress: 3 }),
      ],
    },
    {
      id: "jealousy",
      weight: (s) => (s.partner ? 0.25 + (s.partner.trust < 50 ? 0.5 : 0) : 0),
      cooldown: 60,
      title: "Telefonun ekranı yandı",
      text: (s) => "Gece bir mesaj geldi; " + s.partner.name + " ekrana baktı ve yüzü değişti. \"Kim bu?\"",
      choices: [
        c("Telefonu uzat, birlikte bakın", "Saklayacak bir şeyin yok.", { trust: 6, bond: 2 }),
        c("\"İş arkadaşım\" de, konuyu kapat", "Şüphe kalabilir.", { chance: { p: 0.6, win: { trust: 1 }, lose: { trust: -10, bond: -5, stress: 4 }, winT: "Kapandı", winP: "Bir şey demedi.", loseT: "Bir hafta küs kaldınız", loseP: "Konuşmak yerine kapıyı çarptın; aranızda bir buz duvarı oluştu." } }),
        c("Sinirlen, özel alanın olduğunu söyle", "", { trust: -6, bond: -4 }),
      ],
    },
    {
      id: "trustCrisis",
      priority: 58,
      cooldown: 52,
      when: (s) => s.partner && (s.partner.trust ?? 70) < 25,
      title: "Güven kalmadı",
      text: (s) => s.partner.name + ": \"Sana artık inanamıyorum. Böyle devam edemeyiz.\"",
      choices: (s) => [
        c("Çift terapisine gidelim", "Seans başı ₺3.000 · 8 seans", { cost: 24000, trust: 25, bond: 10, stress: -3 }),
        c("Söz ver, değişeceğim", "Şans %45", { chance: { p: 0.45, win: { trust: 15, bond: 6 }, lose: { breakup: true, m: -12, stress: 10 }, winT: "Bir şans daha", winP: "Bu sefer gerçekten çabalaman gerekecek.", loseT: "Ayrıldınız", loseP: "Bavulunu hazırladı. Ev bir anda çok sessiz." } }),
      ],
    },
    {
      id: "pressureMarry",
      weight: (s) => (s.age >= 26 && s.age <= 40 && !(s.partner && s.partner.married) ? 0.9 : 0),
      cooldown: 30,
      room: "salon",
      title: "Bayram sofrasında aynı soru",
      text: (s) => HS.pick(["Teyzen: \"Hâlâ evlenmedin mi? Bak senin yaşında ben iki çocuk büyütüyordum.\"", "Halan: \"Komşunun oğlu/kızı var, çok terbiyeli. Bir tanış istersen?\"", "Dayın: \"Yaşın geçiyor ama, ona göre.\""]),
      choices: [
        c("Gülümse, \"Zamanı gelince\" de", "Özgüven biraz sarsılır.", { esteem: -2 }),
        c("Kendi hayatını kendin seçtiğini söyle", "Özgüven +, akrabalar bozulur.", { esteem: 4, people: -1 }),
        c("İçine at, akşam moralin bozulsun", "", { esteem: -6, m: -4, stress: 3 }),
      ],
    },
    {
      id: "pressureKid",
      weight: (s) => (s.partner && s.partner.married && !s.children.length && s.age >= 27 && s.age <= 42 ? 0.9 : 0),
      cooldown: 30,
      room: "salon",
      title: "\"Torun ne zaman?\"",
      text: (s) => "Kayınvaliden kahve fincanını bırakıp sana döndü: \"Evleneli şu kadar oldu, torun ne zaman?\"",
      choices: [
        c("\"Önce ev, sonra çocuk\" de", "", { esteem: 1, trust: 2 }),
        c("Partnerinle bakışıp sus", "", { esteem: -3, stress: 2 }),
        c("Bu konunun kimseyi ilgilendirmediğini söyle", "Ortalık gerilir.", { esteem: 3, people: -1, bond: 2 }),
      ],
    },
    {
      id: "pressureHome",
      weight: (s) => (s.age >= 30 && !s.assets.house ? 0.7 : 0),
      cooldown: 40,
      room: "salon",
      title: "Kuzenin ev almış",
      text: "Aile grubunda kuzeninin yeni evinin fotoğrafları dönüyor. Annen altına \"Maşallah, bizimki de inşallah\" yazmış.",
      choices: [
        c("Tebrik et, geç", "", { esteem: -1 }),
        c("Bu akşam ev ilanlarına bak, plan yap", "Hedef koymak iyi gelir.", { esteem: 2, stress: 2 }),
        c("Kıyaslanmaktan bıktığını yaz", "", { esteem: 3, people: -1, stress: 2 }),
      ],
    },
    {
      id: "careChoice",
      priority: 64,
      cooldown: 1,
      when: (s) => s.children.some((k) => s.year - k.born >= 1 && s.year - k.born < 6 && !k.care),
      title: (s) => {
        const k = s.children.find((x) => s.year - x.born >= 1 && s.year - x.born < 6 && !x.care);
        return HS.ek(k.name, "gen") + " bakımı";
      },
      text: (s) => {
        const k = s.children.find((x) => s.year - x.born >= 1 && s.year - x.born < 6 && !x.care);
        return k.name + " büyüyor. Mizacı: " + HS.TEMP_NAMES[k.temp].toLocaleLowerCase("tr-TR") + ". Gündüzleri kim bakacak?";
      },
      choices: (s) => {
        const k = s.children.find((x) => s.year - x.born >= 1 && s.year - x.born < 6 && !x.care);
        const gran = (s.kin || []).some((x) => x.alive && ["anne", "kayinvalide"].includes(x.rel) && x.city === s.city);
        const L = (id) => HS.CARE[id];
        return [
          c(L("devlet").name, "Aylık " + money(1500 * s.idx.cpi) + " · sıra beklemek gerekebilir", { care: { name: k.name, care: "devlet" } }),
          c(L("ozel").name, "Aylık " + money(30000 * s.idx.cpi) + " · küçük gruplar", { care: { name: k.name, care: "ozel" }, kidBond: 1 }),
          c(L("bakici").name, "Aylık " + money(35000 * s.idx.cpi) + " · evde bire bir", { care: { name: k.name, care: "bakici" } }),
          gran ? c(L("aile").name, "Ücretsiz · büyükanne mutlu ama karışmaya başlar", { care: { name: k.name, care: "aile" }, stress: 1 }) : null,
          c(L("ev").name, s.job !== "none" ? "İşle birlikte çok yorucu" : "Ücretsiz · bütün gün çocukla", { care: { name: k.name, care: "ev" }, kidBond: 4 }),
        ];
      },
    },
    {
      id: "kidTemper",
      weight: (s) => (s.children.some((k) => s.year - k.born >= 2 && s.year - k.born <= 9 && ["inatçı", "hareketli"].includes(k.temp)) ? 1 : 0),
      cooldown: 16,
      room: "salon",
      title: "Market krizi",
      text: (s) => {
        const k = s.children.find((x) => s.year - x.born >= 2 && s.year - x.born <= 9 && ["inatçı", "hareketli"].includes(x.temp));
        return k.name + " şeker reyonunda kendini yere attı. Herkes size bakıyor.";
      },
      choices: [
        c("Sakin kal, sarıl, dışarı çık", "Sabır gerekir.", { kidBond: 3, stress: 3 }),
        c("İstediğini al, sussun", "₺120 · alışkanlık olabilir", { cost: 120, kidBond: -1 }),
        c("Sesini yükselt", "", { kidBond: -4, stress: 2, m: -2 }),
      ],
    },
    {
      id: "kidShy",
      weight: (s) => (s.children.some((k) => s.year - k.born >= 5 && s.year - k.born <= 12 && k.temp === "utangaç") ? 0.8 : 0),
      cooldown: 26,
      title: "Öğretmenden not",
      text: (s) => {
        const k = s.children.find((x) => s.year - x.born >= 5 && s.year - x.born <= 12 && x.temp === "utangaç");
        return "Öğretmeni " + HS.ek(k.name, "gen") + " teneffüste hep yalnız kaldığını yazmış.";
      },
      choices: [
        c("Hafta sonu arkadaşlarını eve çağır", "₺500", { cost: 500, kidBond: 4 }),
        c("Okul psikolojik danışmanıyla görüş", "", { kidBond: 2, stress: 1 }),
        c("\"Büyüyünce geçer\" de", "", { kidBond: -2 }),
      ],
    },
    {
      id: "landlordSon",
      weight: (s) => (s.rentBase && s.weeks - (s.rentStart || 0) > 30 ? 0.35 : 0),
      cooldown: 104,
      title: "\"Oğlum gelecek\"",
      text: "Ev sahibi aradı: \"Oğlum askerden dönüyor, eve o yerleşecek. İki ay içinde çıkmanızı rica ediyorum.\" Mahallede herkes bunun bahane olduğunu söylüyor.",
      choices: (s) => {
        const move = Math.round(HS.rentFull(s) * 2.2 + 12000 * s.idx.cpi);
        return [
          c("Kabul et, yeni ev bul", "Depozito, emlakçı, nakliye: " + money(move), { cost: move, raw: true, stress: 8, homeV: 1, rentReset: 1 }),
          c("Avukata danış, hakkını ara", "₺15.000 · şans %55", { cost: 15000, chance: { p: 0.55, win: { stress: -2, m: 4 }, lose: { cost: 20000, stress: 10, homeV: 1, rentReset: 1 }, winT: "Kaldın", winP: "Ev sahibinin oğlunun başka şehirde oturduğu ortaya çıktı.", loseT: "Mahkeme ev sahibinden yana", loseP: "Taşınmak zorunda kaldın; üstüne masraf." } }),
          c("Kirayı artırmayı teklif et", "Kira %25 artar", { rentHike: 0.25, stress: 3 }),
        ];
      },
    },
    {
      id: "rentCourt",
      weight: (s) => (s.rentBase && s.weeks - (s.rentStart || 0) > 260 ? 0.8 : 0),
      cooldown: 104,
      title: "Kira tespit davası",
      text: (s) => "Beş yılı dolduran kira sözleşmen için ev sahibi dava açtı: kiranın piyasa değerine (" + money(HS.rentFull(s)) + ") çekilmesini istiyor.",
      choices: (s) => [
        c("Uzlaş, piyasa kirasına geç", "", { rentMarket: 1, stress: 3 }),
        c("Davada savun", "Avukat ₺18.000 · şans %40", { cost: 18000, chance: { p: 0.4, win: { m: 3 }, lose: { rentMarket: 1, stress: 6 }, winT: "Kira biraz arttı", winP: "Hâkim artışı makul buldu, piyasanın altında kaldın.", loseT: "Piyasa kirası", loseP: "Mahkeme kiranı emsallere çekti." } }),
      ],
    },
    {
      id: "evictionPaper",
      priority: 40,
      cooldown: 52,
      when: (s) => s.rentBase && s.flags.newLease && s.weeks - s.flags.newLease < 3 && !s.flags.taahhutAsked,
      title: "Tahliye taahhütnamesi",
      text: "Ev sahibi sözleşmeyle birlikte tarihi boş bir \"tahliye taahhütnamesi\" imzalamanı istiyor. \"Formalite\" diyor.",
      choices: [
        c("İmzala", "Evi tutarsın; ileride risk olabilir.", { flag: "taahhut", taahhutAsked: 1 }),
        c("İmzalamayı reddet", "Şans %50 ev sahibi vazgeçer", { taahhutAsked: 1, chance: { p: 0.5, win: { esteem: 2 }, lose: { cost: 8000, stress: 5, homeV: 1 }, winT: "Vazgeçti", winP: "\"Peki\" dedi, imzasız devam ettiniz.", loseT: "Ev elden kaçtı", loseP: "Başka kiracıyla anlaştı; yeniden ev aramak masraf oldu." } }),
      ],
    },
    {
      id: "taahhutUsed",
      weight: (s) => (s.flags.taahhut && s.rentBase ? 0.25 : 0),
      cooldown: 156,
      title: "Taahhütname icraya kondu",
      text: "Yıllar önce imzaladığın boş tarihli taahhütname icraya konmuş. Bir ay içinde evi boşaltman gerekiyor.",
      choices: (s) => [c("Taşın", "Yeni ev masrafı " + money(Math.round(HS.rentFull(s) * 2.2 + 12000 * s.idx.cpi)), { cost: Math.round(HS.rentFull(s) * 2.2 + 12000 * s.idx.cpi), raw: true, stress: 12, m: -8, homeV: 1, rentReset: 1, unflag: "taahhut" })],
    },
    {
      id: "hiddenFault",
      priority: 45,
      cooldown: 52,
      room: "garaj",
      when: (s) => s.carUsed && s.carUsed.hidden && s.weeks - s.carUsed.at > 4,
      title: "Gizli arıza",
      text: (s) => "Aldığın ikinci el " + HS.Art.CARS[s.car].name.toLocaleLowerCase("tr-TR") + " yolda kaldı. Şanzıman ve motorda eski bir hasar çıktı; satıcı telefonlarını açmıyor.",
      choices: (s) => [
        c("Yetkili serviste yaptır", money(Math.round(HS.carPrice(s) * 0.06)), { cost: HS.carPrice(s) * 0.06, raw: true, usedFixed: 1, stress: 4 }),
        c("Sanayide ustaya götür", money(Math.round(HS.carPrice(s) * 0.03)) + " · şans %60", { cost: HS.carPrice(s) * 0.03, raw: true, chance: { p: 0.6, win: { usedFixed: 1 }, lose: { cost: HS.carPrice(s) * 0.04, raw: true, stress: 5 }, winT: "Usta işini bildi", winP: "Araba eskisinden iyi çalışıyor.", loseT: "Yine bozuldu", loseP: "Usta \"parça yanlış gelmiş\" dedi; tekrar ödedin." } }),
        c("Arabayı olduğu gibi sat", "Değerinin çok altına", { sellUsedCheap: 1, m: -4 }),
      ],
    },
  );
  HS.FX.rentReset = (s) => (s.rentBase = null);
  HS.FX.rentHike = (s, v) => s.rentBase && (s.rentBase *= 1 + v);
  HS.FX.rentMarket = (s) => {
    s.rentBase = HS.rentFull(s) / (HS.CFG ? HS.CFG.rentScale : 1);
    s.rentStart = s.weeks;
  };
  HS.FX.taahhutAsked = (s) => (s.flags.taahhutAsked = 1);
  HS.FX.unflag = (s, k) => delete s.flags[k];
  HS.FX.usedFixed = (s) => s.carUsed && (s.carUsed.hidden = false);
  HS.FX.sellUsedCheap = (s) => {
    HS.earn(s, "Arızalı araç satışı", HS.carPrice(s) * 0.3);
    s.car = null;
    s.assets.car = false;
    s.carUsed = null;
  };
  // Takvime: ihbar bitişi, kira artışı
  HS.HOOKS.calendar.push((s, add) => {
    if (s.notice) add(s.notice.until, 4, "İhbar süresi bitiyor · son iş günü", "is");
    if (s.rentBase) add(HS.ywToAbs(s, s.year + 1, 1), 0, "Yıllık kira artışı (TÜFE sınırı)", "para");
    if (s.partner && s.partner.married && s.partner.ann) add(HS.ywToAbs(s, s.week <= s.partner.ann.bw ? s.year : s.year + 1, s.partner.ann.bw), 5, "Evlilik yıl dönümü · hediye al!", "dogum");
  });
})(globalThis.HS || (globalThis.HS = {}));
