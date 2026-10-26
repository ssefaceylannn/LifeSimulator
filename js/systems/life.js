// Günlük hayat katmanı: stres, kader olayları, spor salonu üyeliği, kişisel eşyalar,
// seviye (deneyim puanı) ve ev içi etkinlikler.
// Stres 0-100: iş yükü, borç, geciken faturalar, mobbing ve vardiya artırır; dinlenmek,
// spor, gezmek ve sevdiklerinle vakit geçirmek azaltır. Yüksek stres sağlığı, mutluluğu
// ve ilişkiyi yıpratır; çok yükselirse tükenmişlik olayı çıkar.
(function (HS) {
  "use strict";
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const r = () => HS.rng();
  const money = (n) => HS.money(n);
  const c = (label, hint, fx = {}) => ({ label, hint, fx });
  const M = () => HS.WEEKS_PER_MONTH || 4.33;

  function init(s) {
    s.stress = s.stress ?? 25;
    s.items = s.items || [];
    s.itemAt = s.itemAt || {};
    s.gym = s.gym || null;
    s.xp = s.xp || 0;
  }
  HS.HOOKS.newLife.push(init);
  HS.HOOKS.migrate.push(init);

  // ---- Stres ----
  HS.addStress = (s, v) => (s.stress = clamp((s.stress ?? 25) + v * (v > 0 ? 1 : 1), 0, 100));
  HS.FX.stress = (s, v) => HS.addStress(s, v);
  HS.stressLabel = (v) => (v >= 80 ? "Tükenmek üzere" : v >= 60 ? "Çok stresli" : v >= 40 ? "Gergin" : v >= 20 ? "Dengeli" : "Rahat");
  HS.HOOKS.weekly.push((s) => {
    const sch = HS.schedule ? HS.schedule(s) : null;
    let base = 18;
    if (s.job !== "none") base += 10 + (sch && sch.days >= 6 ? 6 : 0) + (sch && sch.shift && sch.shift.id === "gece" ? 6 : 0);
    if (s.mobbing) base += 16;
    if (HS.JOBS[s.job] && HS.JOBS[s.job].risky) base += 12;
    if (s.debt > 0) base += 8;
    if ((s.bills || []).some((b) => b.late)) base += 5;
    if (Object.keys(s.cut || {}).length) base += 8;
    if (s.job === "none" && !s.retired && s.edu !== "ogrenci" && s.age > 22) base += 8;
    if (s.children.some((k) => s.year - k.born < 4)) base += 7;
    if (s.partner && s.partner.bond >= 70) base -= 5;
    if (s.partner && s.partner.bond < 30) base += 6;
    if (s.flags.kedi) base -= 3;
    if (s.retired) base -= 6;
    if (s.health < 40) base += 6;
    s.stress = clamp(s.stress + (base - s.stress) * 0.12, 0, 100);
    if (s.stress > 70) {
      s.health = clamp(s.health - (s.stress - 70) / 40, 0, 100);
      s.mood = clamp(s.mood - (s.stress - 70) / 25, 0, 100);
      if (s.partner) s.partner.bond = clamp(s.partner.bond - 0.25, 0, 100);
    }
    // Spor salonu üyeliği
    if (s.gym && s.weeks >= s.gym.until) {
      s.gym = null;
      delete s.flags.salonUye;
      s.scenes.push({ t: "Salon üyeliğin bitti", p: "Turnike kartın artık okumuyor. Yenilemek için BEN sekmesine bak.", art: "◷" });
    }
    // Deneyim
    s.xp += 2 * (HS.CFG ? HS.CFG.xpScale : 1);
  });

  // ---- Seviye ----
  HS.level = (s) => Math.floor(Math.sqrt((s.xp || 0) / 18)) + 1;
  HS.levelProgress = (s) => {
    const L = HS.level(s);
    const a = (L - 1) * (L - 1) * 18,
      b = L * L * 18;
    return clamp(((s.xp || 0) - a) / (b - a), 0, 1);
  };
  HS.FX.xp = (s, v) => (s.xp = (s.xp || 0) + v);
  const prevAch = HS.onAchievement;
  HS.HOOKS.weekly.push((s) => {
    const n = (s.ach || []).length;
    if (n > (s.achXp || 0)) {
      s.xp += (n - (s.achXp || 0)) * 25 * (HS.CFG ? HS.CFG.xpScale : 1);
      s.achXp = n;
    }
    const lv = HS.level(s);
    if (lv > (s.lvSeen || 1)) {
      s.lvSeen = lv;
      s.scenes.push({ t: "Seviye " + lv + "!", p: "Hayat deneyimin arttı. " + (LEVEL_UNLOCK[lv] ? LEVEL_UNLOCK[lv] : "Yeni fırsatlar seni bekliyor."), art: "★", kind: "win" });
    }
  });
  const LEVEL_UNLOCK = {
    3: "Amiral gemisi telefon ve akıllı saat mağazada açıldı.",
    5: "Pırlanta kolye ve tasarım koltuk takımı açıldı.",
    8: "Spor araba bayisi seni artık ciddiye alıyor.",
    10: "Villa satıcıları seni arıyor.",
  };
  // Lüks alımlar seviye ister (parası olsa bile)
  const LV_NEED = { spor: 8, villa: 10 };
  HS.levelNeed = (fx) => (fx.buy === "car" ? LV_NEED[fx.model] : fx.buy === "house" ? LV_NEED[fx.homeType] : fx.buyProp ? LV_NEED[fx.buyProp.type] : 0) || 0;
  const prevBuy = HS.CAN.buy;
  HS.CAN.buy = (s, v, fx) => {
    const need = HS.levelNeed(fx);
    if (need && (!HS.CFG || HS.CFG.levelLocks) && HS.level(s) < need) return "Seviye " + need + " gerekir (şu an " + HS.level(s) + ")";
    return prevBuy ? prevBuy(s, v, fx) : true;
  };
  const prevBuyProp = HS.CAN.buyProp;
  HS.CAN.buyProp = (s, v, fx) => {
    const need = HS.levelNeed(fx);
    if (need && (!HS.CFG || HS.CFG.levelLocks) && HS.level(s) < need) return "Seviye " + need + " gerekir (şu an " + HS.level(s) + ")";
    return prevBuyProp ? prevBuyProp(s, v, fx) : true;
  };

  // ---- Spor salonu ----
  HS.GYM_PACKS = [
    { months: 1, off: 0 },
    { months: 3, off: 0.1 },
    { months: 6, off: 0.2 },
    { months: 12, off: 0.32 },
  ];
  HS.gymPrice = (s, months) => {
    const p = HS.GYM_PACKS.find((x) => x.months === months);
    const city = HS.CITIES[s.city] || {};
    const big = ["İstanbul", "Ankara", "İzmir"].includes(s.city) ? 1.25 : 1;
    return Math.round(HS.COSTS.gymMonthly * months * (1 - p.off) * big * s.idx.cpi * (city.region === "abroad" ? 1.8 : 1));
  };
  HS.CAN.gymBuy = (s, m) => (HS.fundsOf(s) < HS.gymPrice(s, m) ? HS.short(s, HS.gymPrice(s, m)) : true);
  HS.FX.gymBuy = (s, m) => {
    HS.book(s, "Spor salonu üyeliği (" + m + " ay)", HS.gymPrice(s, m));
    const from = s.gym && s.gym.until > s.weeks ? s.gym.until : s.weeks;
    s.gym = { until: from + Math.round(m * M()), months: m };
    s.flags.salonUye = s.year;
  };

  // ---- Kişisel eşyalar ----
  // price: 2026 TL. lv: gereken seviye. room: odada görünür. Markalar kurmacadır.
  HS.ITEMS = {
    telefon: { name: "Akıllı telefon (orta segment)", price: 24000, icon: "mobile-phone", fx: { m: 3, people: 1 }, desc: "Sosyal medya, harita, mesaj." },
    amiral: { name: "Amiral gemisi telefon", price: 82000, icon: "mobile-phone", lv: 3, fx: { m: 5, people: 1 }, desc: "Kamerası harika; düşürünce yüreğin ağzına gelir." },
    laptop: { name: "Dizüstü bilgisayar", price: 36000, icon: "laptop", fx: { m: 2 }, desc: "Kendi kendine çalışma ve kurslar daha verimli.", room: "salon" },
    konsol: { name: "Oyun konsolu", price: 27000, icon: "video-game", fx: { m: 4 }, desc: "\"Oyun oyna\" etkinliğini açar.", room: "salon" },
    tv: { name: "65 inç televizyon", price: 42000, icon: "television", fx: { m: 3 }, desc: "Maç ve dizi keyfi; salonda görünür.", room: "salon" },
    gitar: { name: "Akustik gitar", price: 9500, icon: "guitar", fx: { m: 2 }, desc: "\"Gitar çal\" etkinliğini açar.", room: "salon" },
    saat: { name: "Akıllı saat", price: 9000, icon: "alarm-clock", lv: 3, fx: { h: 1 }, desc: "Adım ve uyku takibi; koşu daha verimli." },
    kahve: { name: "Espresso makinesi", price: 14000, icon: "hot-beverage", fx: { m: 2 }, desc: "Sabahları mutfakta.", room: "mutfak" },
    klima: { name: "Klima", price: 38000, icon: "high-voltage", fx: { m: 2 }, desc: "Yazın serin; elektrik faturası artar.", room: "salon" },
    yatak: { name: "Ortopedik yatak", price: 26000, icon: "bed", fx: { h: 2 }, desc: "Daha iyi uyku: stres azalır.", room: "yatak" },
    koltuk: { name: "Tasarım koltuk takımı", price: 95000, icon: "couch-and-lamp", lv: 5, fx: { m: 4 }, desc: "Salonun havası değişir.", room: "salon" },
    bulasik: { name: "Bulaşık makinesi", price: 21000, icon: "cook", fx: { stress: -3, m: 2 }, desc: "Lavabo taşmaz; ev işi stresi azalır.", room: "mutfak" },
    camasir: { name: "Çamaşır makinesi", price: 23000, icon: "t-shirt", fx: { stress: -2, m: 1 }, desc: "Kendi evine geçince şart.", room: "mutfak" },
    kitap: { name: "Kitaplık ve kitaplar", price: 7500, icon: "books", fx: { m: 1 }, desc: "\"Kitap oku\" etkinliğini açar.", room: "salon" },
    kolye: { name: "Pırlanta kolye (hediye)", price: 120000, icon: "gem-stone", lv: 5, fx: { bond: 12, m: 4 }, desc: "Partnerine hediye: bağ çok güçlenir.", gift: true },
    parfum: { name: "Parfüm", price: 3800, icon: "wrapped-gift", fx: { m: 2, people: 1 }, desc: "Tükenir; birkaç ayda bir alınır.", consumable: true },
  };
  HS.itemPrice = (s, k, inst = 1) => HS.ITEMS[k].price * s.idx.cpi * (inst >= 9 ? 1.1 : inst >= 6 ? 1.06 : 1);
  HS.CAN.itemBuy = (s, v) => {
    const it = HS.ITEMS[v.id];
    if (!it) return "Ürün yok.";
    if (it.lv && (!HS.CFG || HS.CFG.levelLocks) && HS.level(s) < it.lv) return "Seviye " + it.lv + " gerekir (şu an " + HS.level(s) + ")";
    if (!it.consumable && s.items.includes(v.id)) return "Zaten sende var.";
    if (it.gift && !s.partner) return "Hediye edecek bir partnerin yok.";
    const price = HS.itemPrice(s, v.id, v.inst || 1);
    if ((v.inst || 1) > 1) {
      if (!s.card) return "Taksit için kredi kartı gerekir.";
      if (HS.cardAvail(s) < price) return "Kart limitin yetmiyor (" + money(price) + " gerekir).";
      return true;
    }
    return HS.fundsOf(s) < price ? HS.short(s, price) : true;
  };
  HS.FX.itemBuy = (s, v) => {
    const it = HS.ITEMS[v.id];
    const inst = v.inst || 1;
    const price = HS.itemPrice(s, v.id, inst);
    if (inst > 1) {
      s.card.bal += price;
      s.card.inst = s.card.inst || [];
      s.card.inst.push({ amt: price / inst, left: inst, name: it.name });
      (s.ledger = s.ledger || { in: [], out: [] }).out.push([it.name + " (" + inst + " taksit, karta)", 0]);
    } else HS.book(s, it.name, price);
    if (!it.consumable && !it.gift) s.items.push(v.id);
    s.itemAt[v.id] = s.weeks;
    HS.apply(s, { ...it.fx, noTheme: true });
    if (it.gift) s.scenes.push({ t: "Hediye", p: s.partner.name + " kutuyu açınca bir süre konuşamadı.", art: "♡", kind: "win" });
  };
  // Hikâyeler eşyayı (parasını ayrıca cost ile ödeterek) verir
  HS.FX.itemGive = (s, k) => {
    if (!HS.ITEMS[k] || s.items.includes(k)) return;
    s.items.push(k);
    s.itemAt[k] = s.weeks;
  };
  HS.FX.itemLose = (s, k) => (s.items = s.items.filter((x) => x !== k));
  HS.FX.itemSell = (s, k) => {
    const v = HS.ITEMS[k].price * s.idx.cpi * Math.max(0.15, 0.6 - (s.weeks - (s.itemAt[k] || 0)) / 520);
    s.items = s.items.filter((x) => x !== k);
    HS.earn(s, HS.ITEMS[k].name + " (ikinci el)", v);
  };
  HS.HOOKS.worth.push((s) => s.items.reduce((a, k) => a + (HS.ITEMS[k] ? HS.ITEMS[k].price * s.idx.cpi * 0.3 : 0), 0));
  // Telefon yaşlanır: 3-4 yılda bozulur
  HS.HOOKS.yearly.push((s) => {
    for (const k of ["telefon", "amiral", "laptop"]) {
      if (s.items.includes(k) && s.weeks - (s.itemAt[k] || 0) > 156 && r() < 0.45) {
        s.items = s.items.filter((x) => x !== k);
        s.scenes.push({ t: HS.ITEMS[k].name + " bozuldu", p: "Yıllarca dayandı ama artık açılmıyor. Yenisini almak gerekecek.", art: "✕", kind: "lose" });
      }
    }
  });

  // ---- Etkinliklere yer, stres ve gerçekçi ücret ----
  const TUNE = {
    spor: { room: "sokak", stress: -5 },
    salon: { room: "sokak", stress: -4 },
    diyet: { room: "mutfak", stress: 1 },
    disarida: { room: "sokak", stress: -3, cost: 1100 },
    ders: { room: "yatak", stress: 1 },
    arkadas: { room: "sokak", stress: -5, cost: 900 },
    aile: { room: "ziyaret", stress: -3 },
    partner: { room: "salon", stress: -5, cost: 1500 },
    cocuk: { room: "salon", stress: -3 },
    ekis: { room: "sokak", stress: 4 },
    gez: { room: "sokak", stress: -6, cost: 650 },
    gonullu: { room: "sokak", stress: -3 },
    dinlen: { room: "yatak", stress: -7 },
    calis: { room: "yatak", stress: 2 },
  };
  for (const a of HS.ACTIVITIES) {
    const t = TUNE[a.id];
    if (!t) continue;
    a.room = t.room;
    const base = a.fx;
    a.fx = (s, ctx, param) => {
      const fx = typeof base === "function" ? base(s, ctx, param) : { ...base };
      if (t.cost && fx.cost) fx.cost = t.cost;
      fx.stress = (fx.stress || 0) + t.stress;
      return fx;
    };
    if (t.cost && a.hint && !/₺/.test(a.hint)) a.hint += " · ₺" + t.cost.toLocaleString("tr-TR") + "+";
  }
  // Spor salonu: üyelik yoksa günlük giriş
  const salon = HS.ACTIVITIES.find((a) => a.id === "salon");
  if (salon) {
    const f = salon.fx;
    salon.fx = (s, ctx, p) => ({ ...f(s, ctx, p), cost: s.gym ? 0 : 450 });
    salon.hint = "Kas +, kilo − · üyelik yoksa günlük giriş ₺450";
  }
  // Ev içi etkinlikler
  HS.ACTIVITIES.push(
    { id: "tvizle", label: "Dizi ya da maç izle", art: "television", hint: "Stres −, salon", room: "salon", fx: (s) => ({ m: s.items.includes("tv") ? 3 : 2, stress: -4, kg: 0.05 }), done: "Kanepeye gömüldün; bir bölüm derken üç bölüm oldu." },
    { id: "yemekyap", label: "Yemek yap", art: "cook", hint: "Malzeme ₺300, mutfak", room: "mutfak", fx: (s) => ({ cost: 300, m: 2, stress: -2, kg: -0.05, bond: s.partner ? 2 : 0, kidBond: 1 }), done: "Mutfak mis gibi kokuyor.", surprises: [{ p: 0.05, t: "Elini yaktın", text: "Tencereyi tutarken bezi unuttun.", fx: { h: -2, m: -2 }, art: "✕", kind: "lose" }] },
    { id: "erkenyat", label: "Erken yat", art: "bed", hint: "Sağlık +, stres −", room: "yatak", fx: (s) => ({ h: s.items.includes("yatak") ? 3 : 2, stress: s.items.includes("yatak") ? -6 : -4 }), done: "Sekiz saat deliksiz uyudun." },
    { id: "oyun", label: "Konsolda oyun", art: "video-game", hint: "Mutluluk +, stres −", room: "salon", when: (s) => s.items.includes("konsol"), fx: { m: 4, stress: -6 }, done: "Bir bölüm daha derken gece yarısı oldu." },
    { id: "gitarcal", label: "Gitar çal", art: "guitar", hint: "Sahne becerisi +", room: "salon", when: (s) => s.items.includes("gitar") || s.job === "music", fx: { m: 3, stress: -4, sk: { sahne: 0.8, beste: 0.5 } }, done: "Parmak uçların sızlıyor ama yeni bir akor oturdu." },
    { id: "kitapoku", label: "Kitap oku", art: "books", hint: "Beceri +, stres −", room: "yatak", when: (s) => s.items.includes("kitap") || s.edu !== "lise", fx: { skill: 1, m: 2, stress: -4 }, done: "Sayfalar kendiliğinden döndü." },
    { id: "arabayika", label: "Arabayı yıka", art: "automobile", hint: "₺350, garaj", room: "garaj", when: (s) => s.car && s.car !== "bisiklet", fx: { cost: 350, m: 1, stress: -1 }, done: "Araba pırıl pırıl." },
  );

  // ---- Kader olayları ----
  const RISKY_QUAKE = ["İstanbul", "İzmir", "Kahramanmaraş", "Hatay", "Malatya", "Adıyaman", "Düzce", "Bolu", "Erzincan", "Bingöl", "Van", "Manisa", "Denizli", "Sakarya", "Kocaeli", "Balıkesir", "Muğla"];
  const hospital = (s, base) => Math.round(base * s.idx.cpi * (s.ins && s.ins.health ? 0.2 : 1));
  HS.EVENTS.push(
    {
      id: "burnout",
      priority: 60,
      cooldown: 26,
      when: (s) => s.stress >= 85,
      title: "Tükenmişlik",
      text: "Sabah alarm çaldığında yataktan kalkamadın. Kalbin hızlı atıyor, kimseyle konuşmak istemiyorsun. Doktor \"dinlenmezsen daha kötü olacak\" diyor.",
      choices: (s) => [
        c("İki hafta rapor al, dinlen", "Gelir biraz düşer; stres çok azalır.", { stress: -35, m: 4, h: 3, perf: -6, cash: -Math.round(HS.wage(s) * 0.15), raw: true }),
        c("Terapiye başla", "Seans başı ₺2.500 (2026).", { cost: 10000, stress: -25, m: 6 }),
        c("Dişini sık, devam et", "Sağlık ve ilişkiler yıpranır.", { stress: 5, h: -8, m: -6, bond: -6 }),
      ],
    },
    {
      id: "fateAccident",
      weight: (s) => 0.12 + (s.car && s.car !== "bisiklet" ? 0.12 : 0),
      cooldown: 156,
      minAge: 18,
      title: "Kaza",
      text: (s) => (s.car && s.car !== "bisiklet" ? "Kırmızıda geçen bir araç sana yandan çarptı. Ambulansla hastaneye kaldırıldın." : "Karşıya geçerken hızla dönen bir motosiklet sana çarptı. Bacağın kırıldı."),
      choices: (s) => [
        c("Özel hastanede tedavi", (s.ins && s.ins.health ? "Özel sigortan masrafın çoğunu karşılar: " : "Masraf ") + money(hospital(s, 90000)), { cost: hospital(s, 90000), raw: true, h: -14, stress: 12, m: -8 }),
        c("Devlet hastanesinde tedavi", "Ücretsiz ama iyileşme uzun sürer.", { h: -22, stress: 16, m: -10, perf: -8 }),
      ],
    },
    {
      id: "fateIllness",
      weight: (s) => (s.age >= 35 ? 0.1 + (s.age - 35) / 300 + (s.stress > 70 ? 0.1 : 0) : 0.03),
      cooldown: 260,
      title: "Kötü haber",
      text: "Rutin bir tahlilde doktor kaşlarını çattı. İleri tetkik gerekiyor: ciddi bir hastalık olabilir.",
      choices: (s) => [
        c("Hemen özel hastanede tedaviye başla", "Erken teşhis çok önemli. " + money(hospital(s, 260000)), { cost: hospital(s, 260000), raw: true, chance: { p: 0.82, win: { h: -10, stress: 10 }, lose: { h: -35, stress: 25, m: -15 }, winT: "Erken yakalandı", winP: "Tedavi zor geçti ama doktorlar sonuçtan memnun.", loseT: "Uzun bir mücadele", loseP: "Tedavi aylarca sürecek. Sağlığın eskisi gibi olmayabilir." } }),
        c("Devlet hastanesinde sıra bekle", "Randevu birkaç ay sonra.", { chance: { p: 0.6, win: { h: -14, stress: 14 }, lose: { h: -40, stress: 28, m: -18 }, winT: "Zamanında", winP: "Bekleyiş seni yordu ama tedavi işe yaradı.", loseT: "Geç kalındı", loseP: "Hastalık ilerlemişti. Tedavi uzun ve ağır olacak." } }),
      ],
    },
    {
      id: "fateTheft",
      weight: (s) => (s.housing !== "aile" ? 0.18 : 0.05),
      cooldown: 156,
      title: "Eve hırsız girdi",
      text: (s) => "Akşam eve döndüğünde kapı aralıktı. Çekmeceler yerlerde." + (s.items.length ? " Bazı eşyaların yok." : ""),
      choices: (s) => {
        const lost = s.items.filter((k) => ["laptop", "konsol", "amiral", "telefon", "saat"].includes(k)).slice(0, 2);
        return [c("Polise bildir, kilit değiştir", "Çilingir ₺3.000; çalınanlar: " + (lost.map((k) => HS.ITEMS[k].name).join(", ") || "biraz nakit"), { cost: 3000, loseItems: lost, cash: -Math.min(s.cash * 0.1, 8000 * s.idx.cpi), raw: true, stress: 12, m: -8 })];
      },
    },
    {
      id: "fateQuake",
      weight: (s) => (RISKY_QUAKE.includes(s.city) ? 0.05 : 0.01),
      cooldown: 520,
      title: "Deprem",
      text: (s) => "Gece yarısı bina sallandı. Herkes sokağa döküldü. " + (s.assets.house ? "Evinde ağır hasar var." : "Kaldığın binada çatlaklar oluştu."),
      choices: (s) => {
        const dmg = s.assets.house ? Math.round(HS.homePrice(s) * 0.25) : Math.round(30000 * s.idx.cpi);
        return [
          c(s.assets.house ? "DASK ile onarım" : "Yeni bir ev bul", s.assets.house ? "Zorunlu deprem sigortası hasarın bir kısmını karşılar. Kalan: " + money(dmg * 0.4) : "Taşınma ve depozito: " + money(dmg), { cost: s.assets.house ? dmg * 0.4 : dmg, raw: true, stress: 20, m: -12, people: 2, h: -4 }),
          c("Bir süre çadır kentte kal", "Para harcamazsın ama zor günler.", { stress: 28, m: -16, h: -8, people: 4 }),
        ];
      },
    },
    {
      id: "fateLandlord",
      weight: (s) => (s.housing === "kira" || s.housing === "kira-paylasim" ? 0.35 : 0),
      cooldown: 104,
      title: "Ev sahibi evi satıyor",
      text: "Ev sahibi aradı: evi satmaya karar vermiş, iki ay içinde çıkmanı istiyor. Yeni ev, yeni depozito, nakliye...",
      choices: (s) => {
        const cost = Math.round(HS.rentFull(s) * 2.2 + 12000 * s.idx.cpi);
        return [
          c("Aynı semtte yeni ev bul", "Depozito, emlakçı ve nakliye: " + money(cost), { cost, raw: true, stress: 10, m: -4, homeV: 1 }),
          c("Aile evine dön", "Masraf yok ama özgürlük de yok.", { moveHome: 1, m: -8, stress: 4 }),
        ];
      },
    },
    {
      id: "fateLayoff",
      weight: (s) => (s.company && HS.co(s.company) && HS.co(s.company).stars < 3.8 ? 0.25 : s.job === "office" || s.job === "factory" ? 0.08 : 0),
      cooldown: 156,
      title: "Toplu işten çıkarma",
      text: (s) => (s.company ? HS.co(s.company).name : "Şirket") + " küçülmeye gidiyor. İnsan kaynakları seni de toplantıya çağırdı.",
      choices: (s) => [
        c("Tazminatını al, yeni iş ara", "Kıdem tazminatı: " + money(HS.wage(s) * Math.max(1, s.jobWeeks / 52)), { cash: Math.round(HS.wage(s) * Math.max(1, s.jobWeeks / 52)), raw: true, job: "none", leaveCompany: 1, stress: 14, m: -10 }),
        c("Yarı maaşla kalmayı teklif et", "Şans %45", { chance: { p: 0.45, win: { payAdj: 0.75, stress: 8 }, lose: { cash: Math.round(HS.wage(s) * Math.max(1, s.jobWeeks / 52)), raw: true, job: "none", leaveCompany: 1, stress: 16, m: -12 }, winT: "Kaldın", winP: "Maaşın düştü ama işin duruyor.", loseT: "Olmadı", loseP: "Listeden çıkamadın; tazminatınla birlikte uğurlandın." } }),
      ],
    },
    {
      id: "fateWindfall",
      weight: 0.08,
      cooldown: 520,
      title: "Hiç beklemediğin bir haber",
      text: "Adını bile hatırlamadığın uzak bir akrabandan küçük bir miras kaldığını öğrendin.",
      choices: (s) => [c("Bankaya yatır", "", { cash: Math.round(150000 * s.idx.cpi), raw: true, m: 6 }), c("Ailenle paylaş", "Yakınların çok sevinir.", { cash: Math.round(70000 * s.idx.cpi), raw: true, people: 4, m: 8 })],
    },
  );
  HS.FX.loseItems = (s, list) => (s.items = s.items.filter((k) => !list.includes(k)));
  HS.FX.homeV = (s, v) => (s.homeV = (s.homeV || 0) + v);
})(globalThis.HS || (globalThis.HS = {}));
