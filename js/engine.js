// Oyun motoru: durum, ekonomi, etkiler, olay seçimi ve haftalık ilerleme.
// DOM'a dokunmaz; tarayıcıda ve Node testlerinde aynı şekilde çalışır.
(function (HS) {
  "use strict";

  const E = () => HS.ECONOMY;
  const SAVE_VERSION = 3;
  const RETIRE_AGE = 64;
  const WEEKS_PER_MONTH = 4.345;
  HS.RETIRE_AGE = RETIRE_AGE;
  HS.rng = HS.rng || Math.random;
  const rnd = () => HS.rng();
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const pick = (arr) => arr[(rnd() * arr.length) | 0];

  // ---------- Eklenti altyapısı ----------
  // Sistem dosyaları (js/systems/*.js) motoru buradan genişletir:
  //   HS.FX[anahtar]  = (s, değer, fx) => void        yeni etki anahtarı
  //   HS.CAN[anahtar] = (s, değer, fx) => true|metin  uygulanabilir mi?
  //   HS.HOOKS.newLife / migrate / weekly / monthly / yearly : (s) => void
  //   HS.HOOKS.worth : (s) => sayı   (net değere eklenir)
  HS.FX = HS.FX || {};
  HS.CAN = HS.CAN || {};
  HS.HOOKS = HS.HOOKS || {};
  for (const k of ["newLife", "migrate", "weekly", "monthly", "yearly", "worth", "event", "half"])
    HS.HOOKS[k] = HS.HOOKS[k] || [];
  const runHooks = (k, s) => HS.HOOKS[k].forEach((f) => f(s));
  HS.clamp = clamp;
  HS.pick = pick;
  // Haftalık gelir/gider defteri (hafta özetinde gösterilir)
  function earn(s, label, amt) {
    if (!(amt > 0)) return;
    s.cash += amt;
    (s.ledger = s.ledger || { in: [], out: [] }).in.push([label, amt]);
  }
  function book(s, label, amt) {
    if (!(amt > 0)) return;
    pay(s, amt);
    (s.ledger = s.ledger || { in: [], out: [] }).out.push([label, amt]);
  }
  HS.earn = earn;
  HS.book = book;

  // ---------- Türkçe yardımcılar ----------
  const BACK = "aıou",
    FRONT = "eiöü",
    HARD = "fstkçşhp";
  function lastVowel(w) {
    const s = w.toLocaleLowerCase("tr-TR");
    for (let i = s.length - 1; i >= 0; i--)
      if ((BACK + FRONT).includes(s[i])) return s[i];
    return "e";
  }
  // ek("İstanbul","loc") → "İstanbul’da"; özel adlarda kesme işareti kullanılır.
  function ek(word, kind, proper = true) {
    const w = String(word),
      v = lastVowel(w),
      last = w.slice(-1).toLocaleLowerCase("tr-TR"),
      endsVowel = (BACK + FRONT).includes(last),
      hard = HARD.includes(last),
      two = BACK.includes(v) ? "a" : "e",
      four = "aı".includes(v)
        ? "ı"
        : "ei".includes(v)
          ? "i"
          : "ou".includes(v)
            ? "u"
            : "ü";
    let suf = "";
    if (kind === "loc") suf = (hard ? "t" : "d") + two;
    else if (kind === "abl") suf = (hard ? "t" : "d") + two + "n";
    else if (kind === "dat") suf = (endsVowel ? "y" : "") + two;
    else if (kind === "acc") suf = (endsVowel ? "y" : "") + four;
    else if (kind === "gen") suf = (endsVowel ? "n" : "") + four + "n";
    else if (kind === "with") suf = (endsVowel ? "yl" : "l") + two;
    return w + (proper ? "’" : "") + suf;
  }
  HS.ek = ek;
  HS.money = (n) =>
    (n < -0.5 ? "-" : "") +
    "₺" +
    Math.abs(Math.round(n)).toLocaleString("tr-TR");
  HS.upper = (t) => String(t).toLocaleUpperCase("tr-TR");

  // ---------- Kurmaca isim havuzları ----------
  HS.NAMES = {
    partner: [
      "Ece",
      "Bora",
      "Selin",
      "Kaan",
      "Defne",
      "Arda",
      "Nehir",
      "Emre",
      "İpek",
      "Tolga",
      "Zeynep",
      "Can",
      "Lale",
      "Ozan",
      "Ilgın",
      "Barış",
    ],
    child: [
      "Ada",
      "Ege",
      "Lina",
      "Aras",
      "Elif",
      "Deniz",
      "Mira",
      "Kuzey",
      "Su",
      "Yağız",
      "Duru",
      "Atlas",
    ],
  };

  // ---------- Durum ----------
  function newLife({ first, last, city, look, skin, hairColor, hair }) {
    const scenarioIds = Object.keys(HS.SCENARIOS);
    const s0 = migrate({
      v: SAVE_VERSION,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      first: first || "Deniz",
      last: last || "Yılmaz",
      look: look === "man" ? "man" : "woman",
      skin: skin ?? 1,
      hairColor: hairColor || "kahve",
      hair: hair || (look === "man" ? "short" : "long"),
      outfits: look === "man" ? ["gunluk", "gomlek"] : ["gunluk", "elbise"],
      birthCity: city,
      city,
      age: HS.CFG ? HS.CFG.startAge : 18,
      year: E().startYear,
      week: 1,
      weeks: 0,
      cash: HS.CFG ? HS.CFG.startCash : E().startCash,
      scenario: pick(scenarioIds),
      seed: (rnd() * 1000) | 0,
      created: Date.now(),
      free: 4,
    });
    runHooksNew(s0);
    return s0;
  }
  function runHooksNew(s) {
    HS.HOOKS.newLife.forEach((f) => f(s));
  }

  // Eski (v1) ve eksik kayıtları güncel biçime getirir.
  function migrate(s) {
    const d = {
      v: SAVE_VERSION,
      look: "woman",
      age: 18,
      year: E().startYear,
      week: 1,
      weeks: s.history ? s.history.length : 0,
      cash: 0,
      debt: 0,
      savings: 0,
      fund: s.invest || 0,
      health: 82,
      mood: 65,
      skill: 0,
      people: 0,
      edu: "lise",
      eduWeeks: 0,
      job: "none",
      jobLevel: 0,
      jobWeeks: 0,
      jobTime: {},
      lastJob: null,
      worked: false,
      retired: false,
      housing: s.renting ? "kira-paylasim" : "aile",
      rentMult: s.rentMultiplier || 1,
      mortgage: null,
      assets: { house: false, car: false, land: false, passport: false },
      abroad: false,
      returned: false,
      moved: false,
      risk: 0,
      riskEver: 0,
      policy: "neutral",
      scenario: "yavas",
      seed: 7,
      idx: { cpi: 1, food: 1, transport: 1, housing: 1, wage: 1 },
      partner: null,
      exes: 0,
      divorced: false,
      children: [],
      hair: "short",
      hairColor: "kahve",
      skin: 1,
      outfit: "gunluk",
      outfits: ["gunluk"],
      car: s.assets && s.assets.car ? "ekonomik" : null,
      carColor: 0,
      homeType: null,
      homeV: 0,
      apps: [],
      free: 3,
      beard: false,
      transplanted: false,
      thinning: false,
      traits: {
        career: 0,
        family: 0,
        care: 0,
        risk: 0,
        journey: 0,
        craft: 0,
        community: 0,
        security: 0,
      },
      log: [],
      flags: {},
      seen: {},
      scenes: [],
      transitPass: 0,
      current: null,
      alive: true,
      ending: null,
    };
    for (const k in d) if (s[k] === undefined) s[k] = d[k];
    // v1 → v2 dönüşümleri
    if (typeof s.partner === "boolean")
      s.partner = s.partner
        ? { name: pick(HS.NAMES.partner), bond: 60, married: !!s.married }
        : null;
    s.children = (s.children || []).map((c) =>
      typeof c === "string" ? { name: c, born: s.year - 3, bond: 60 } : c,
    );
    if (s.job && !HS.JOBS[s.job]) s.job = "none";
    if (s.look !== "man") s.look = "woman"; // "Diğer" seçeneği kaldırıldı
    if (!s.outfits.includes(s.outfit)) s.outfits.push(s.outfit);
    if (s.assets && s.assets.car && !s.car) s.car = "ekonomik";
    if (s.assets && s.assets.house && !s.homeType) s.homeType = "daire";
    if (!HS.SCENARIOS[s.scenario]) s.scenario = "yavas";
    s.assets = Object.assign(
      { house: false, car: false, land: false, passport: false },
      s.assets,
    );
    if (s.current && !Array.isArray(s.current.c)) s.current = null;
    if (s.current && s.current.c.some((c) => Array.isArray(c)))
      s.current = null; // v1 olay biçimi
    // v2 → v3: meslek basamakları 3'ten 5'e çıktı (eski 0 → yeni 1)
    if ((s.v || 2) < 3 && s.job && s.job !== "none") s.jobLevel = Math.min(4, (s.jobLevel || 0) + 1);
    runHooks("migrate", s);
    delete s.history;
    delete s.invest;
    delete s.renting;
    delete s.rentMultiplier;
    delete s.married;
    s.v = SAVE_VERSION;
    return s;
  }

  // ---------- Ekonomi ----------
  // Yıllık oran: 2026'da TÜİK değeri, sonrasında kurmaca senaryo.
  // Kategori oranları zamanla genel enflasyona yakınsar; böylece ör. kira
  // onlarca yıl boyunca ücretlerden sınırsızca kopmaz.
  function rate(s, k, year = s.year) {
    const R = E().rates2026,
      base = R[k === "wage" ? "cpi" : k];
    if (year <= E().startYear) return base;
    const sc = HS.SCENARIOS[s.scenario],
      n = year - E().startYear;
    const cpi = Math.max(
      sc.floor,
      R.cpi * Math.pow(sc.decay, n) + sc.wobble * Math.sin(s.seed + year * 1.7),
    );
    return Math.max(sc.floor * 0.5, cpi + (base - R.cpi) * Math.pow(0.75, n));
  }
  function yearTurn(s) {
    for (const k of ["cpi", "food", "transport", "housing"])
      s.idx[k] *= 1 + rate(s, k, s.year - 1);
    // Ücretler enflasyonun biraz altında artar (kurmaca varsayım).
    s.idx.wage *= 1 + rate(s, "cpi", s.year - 1) * 0.95;
  }
  const cityData = (s) => HS.CITIES[s.city] || HS.CITIES.İstanbul;
  // Yurt dışı çarpanları ülkeye göre (js/content/costs.js HS.COUNTRIES)
  const abroadMul = (s, k) => {
    const c = cityData(s);
    if (c.region !== "abroad") return 1;
    const co = HS.COUNTRIES && HS.COUNTRIES[c.country];
    if (!co) return k === "wage" ? E().abroadWage : E().abroadCost;
    return k === "wage" ? co.wageMul : co.costMul;
  };

  // Basamak maaş çarpanı (js/systems/skills.js içindeki meslek basamakları)
  function levelMult(job, level) {
    const lad = HS.LADDERS && HS.LADDERS[job];
    return lad ? lad[Math.max(0, Math.min(level || 0, lad.length - 1))].mult : 1 + 0.2 * (level || 0);
  }
  HS.levelMult = levelMult;
  // co: belirli bir şirketin teklifini hesaplamak için (verilmezse mevcut işveren)
  function wage(s, job = s.job, level = s.jobLevel, co) {
    const j = HS.JOBS[job];
    if (!j || !j.pay) return 0;
    let p =
      j.pay *
      s.idx.wage *
      levelMult(job, level) *
      (1 + Math.min(s.skill, 60) * 0.004) *
      abroadMul(s, "wage") *
      (HS.wageMod ? HS.wageMod(s, job, co) : 1);
    if (s.policy === "enterprise" && (job === "business" || job === "factory"))
      p *= 1.05;
    return p * (HS.CFG ? HS.CFG.wageScale : 1);
  }
  function pension(s) {
    const base = s.worked && s.lastJob ? wage(s, s.lastJob, 0) * 0.6 : 0;
    return Math.max(E().minPension * s.idx.wage, base);
  }
  function rentFull(s) {
    let r = cityData(s).rent * s.idx.housing;
    if (s.policy === "housing") r *= 0.92;
    return r * (HS.CFG ? HS.CFG.rentScale : 1);
  }
  function rentShare(s) {
    // Kiracının kirası sözleşmeyle sabitlenir (yıllık artış sınırı: js/systems/realism.js)
    const base = s.rentBase && s.rentCity === s.city ? s.rentBase * (HS.CFG ? HS.CFG.rentScale : 1) : rentFull(s);
    if (s.housing === "kira") return base * s.rentMult;
    if (s.housing === "kira-paylasim") return base * 0.5 * s.rentMult;
    return 0;
  }
  // Ev tipleri: daire 70 m², müstakil 140 m² (m² fiyatı biraz düşük), villa 250 m² (m² fiyatı yüksek).
  const HOME_TYPES = {
    daire: { name: "Daire (70 m²)", m2: 70, k: 1 },
    mustakil: { name: "Bahçeli müstakil ev (140 m²)", m2: 140, k: 0.85 },
    villa: { name: "Villa (250 m²)", m2: 250, k: 1.45 },
  };
  HS.HOME_TYPES = HOME_TYPES;
  function homePrice(s, type) {
    type = type || s.homeType || "daire";
    const t = HOME_TYPES[type] || HOME_TYPES.daire;
    return cityData(s).sqm * t.m2 * t.k * s.idx.housing;
  }
  // Araç modelleri sahne dosyasında (HS.Art.CARS) tanımlı; fiyatlar 2026 TL.
  const CAR_UPKEEP = {
    bisiklet: 150,
    scooter: 1500,
    ekonomik: 4500,
    pikap: 6000,
    suv: 7000,
    spor: 16000,
  };
  function carPrice(s, model = s.car || "ekonomik") {
    const c = HS.Art && HS.Art.CARS && HS.Art.CARS[model];
    return (c ? c.price : E().car) * s.idx.transport;
  }
  function landPrice(s) {
    return homePrice(s) * 0.35;
  }
  // Aylık temel gider (kira hariç).
  function basket(s) {
    const b = E().basket;
    let transport = b.transport * s.idx.transport;
    if (s.car) {
      const motor = !["bisiklet", "scooter"].includes(s.car);
      transport =
        transport * (motor ? 0.4 : s.car === "scooter" ? 0.6 : 0.85) +
        (CAR_UPKEEP[s.car] || 4500) * s.idx.transport;
    }
    if (s.policy === "transit") transport *= 0.85;
    // Oyuncunun seçtiği yaşam tarzı (js/systems/budget.js): tutumlu, normal, rahat
    const st = HS.styleMul ? HS.styleMul(s) : { food: 1, transport: 1, other: 1 };
    let total = b.food * s.idx.food * st.food + transport * st.transport + b.other * s.idx.cpi * st.other;
    // Aile evinde giderlerin yalnızca ayarlanan kadarı (varsayılan %0) oyuncuya düşer.
    if (s.housing === "aile") total *= HS.CFG ? HS.CFG.familyShare / 100 : E().familyContribution;
    else total *= HS.CFG ? HS.CFG.livingScale : 1;
    if (s.housing === "ev") total += rentFull(s) * 0.05; // aidat ve bakım
    return total * abroadMul(s, "cost");
  }
  function childCost(s) {
    const kids = s.children.filter((c) => s.year - c.born < 19).length;
    let c = kids * E().childMonthly * s.idx.cpi * abroadMul(s, "cost");
    if (s.policy === "family") c -= kids * 3000 * s.idx.cpi;
    return Math.max(0, c);
  }
  // Haftalık bütçe dökümü (arayüzde de gösterilir).
  function budget(s) {
    const job = HS.JOBS[s.job];
    let income = 0;
    if (s.job !== "none") income = wage(s) / WEEKS_PER_MONTH;
    else if (s.retired) income = pension(s) / WEEKS_PER_MONTH;
    // Evli çiftte eş, ev giderlerinin yarısını üstlenir.
    const share = s.partner && s.partner.married ? 0.5 : 1;
    const living = basket(s) / WEEKS_PER_MONTH;
    const rent = (rentShare(s) / WEEKS_PER_MONTH) * share;
    const kids = (childCost(s) / WEEKS_PER_MONTH) * (s.partner ? 0.5 : 1);
    const mortgage = s.mortgage ? s.mortgage.weekly : 0;
    return {
      income,
      living: living * (share === 0.5 ? 0.75 : 1),
      rent,
      kids,
      mortgage,
      volatile: job && job.volatile ? job.volatile : 0,
    };
  }
  function netWorth(s) {
    let n = s.cash + s.savings + s.fund - s.debt;
    if (s.assets.house) n += homePrice(s) - (s.mortgage ? s.mortgage.left : 0);
    if (s.assets.land) n += landPrice(s);
    if (s.car) n += carPrice(s) * 0.5;
    HS.HOOKS.worth.forEach((f) => (n += f(s) || 0));
    return n;
  }
  Object.assign(HS, {
    rate,
    wage,
    pension,
    rentFull,
    rentShare,
    homePrice,
    carPrice,
    landPrice,
    budget,
    netWorth,
    WEEKS_PER_MONTH,
  });

  // ---------- Etkiler ----------
  // Bir seçimin etkisi sayılardan ve anahtarlardan oluşur; tümü JSON'a
  // yazılabilir, böylece yarım kalan olay kayıtla birlikte saklanır.
  const MAJOR = [
    "job",
    "edu",
    "partner",
    "marry",
    "breakup",
    "child",
    "buy",
    "sell",
    "emigrate",
    "returnHome",
    "moveCity",
    "risk",
    "transplant",
    "rent",
    "business",
  ];
  // Seçimin yaşam temasına katkısı. Yalnızca belirgin kararlar sayılır;
  // küçük günlük seçimler temayı tek başına belirlemesin diye eşikler var.
  function autoTheme(fx) {
    if (fx.theme) return fx.theme;
    if (fx.risk > 0) return "risk";
    if (fx.child || fx.partner || fx.marry || fx.kidBond >= 5 || fx.bond >= 8)
      return "family";
    if (fx.emigrate || fx.moveCity || fx.passport || fx.returnHome)
      return "journey";
    if (fx.save || fx.fund || fx.buy || fx.debtPlan || fx.payDebt)
      return "security";
    if (fx.job === "music") return "craft";
    if (fx.skill >= 2 || fx.job || fx.edu || fx.promote) return "career";
    if (fx.people >= 2) return "community";
    if (fx.h >= 3) return "care";
    return null;
  }
  // Kullanılabilir para: nakit + (varsa) kredi kartının boş limiti.
  const funds = (s) => (HS.funds ? HS.funds(s) : s.cash);
  // Parası yetmeyen için açıklama: fiyat ve eksik tutar (arayüz ilerleme çubuğu çizer).
  const short = (s, price) => "Fiyatı " + HS.money(price) + " · " + HS.money(Math.max(0, price - funds(s))) + " eksik";
  HS.short = short;
  HS.fundsOf = funds;
  // Seçim yapılabilir mi? true ya da gerekçe metni döner.
  function canApply(s, fx) {
    if (!fx) return true;
    // cost/cash 2026 TL cinsinden yazılır ve enflasyonla ölçeklenir (raw hariç).
    if (fx.cost && funds(s) < fx.cost * (fx.raw ? 1 : s.idx.cpi))
      return short(s, fx.cost * (fx.raw ? 1 : s.idx.cpi));
    if (fx.job && fx.job !== "none") {
      const j = HS.JOBS[fx.job];
      if (s.retired) return "Emekli oldun.";
      if (s.edu === "ogrenci" && !j.student)
        return "Öğrenciyken yalnızca yarı zamanlı iş.";
      if (j.need) {
        const r = j.need(s);
        if (r !== true) return r;
      }
      if (j.startup && funds(s) < j.startup * s.idx.cpi)
        return short(s, j.startup * s.idx.cpi);
    }
    if (fx.buy === "house" && s.assets.house) return "Zaten bir evin var.";
    if (fx.buy === "car" && s.car && !fx.trade)
      return "Önce mevcut aracını sat.";
    if (fx.buy === "house" && fx.mortgage) {
      if (s.cash < homePrice(s, fx.homeType) * 0.3) return "Peşinat " + short(s, homePrice(s, fx.homeType) * 0.3).replace("Fiyatı ", "");
    } else if (fx.buy) {
      const price =
        fx.buy === "house"
          ? homePrice(s, fx.homeType)
          : fx.buy === "car"
            ? carPrice(s, fx.model)
            : landPrice(s);
      if (funds(s) < price) return short(s, price);
    }
    if (fx.apply) {
      const j = HS.JOBS[fx.apply];
      if (s.retired) return "Emekli oldun.";
      if (s.job === fx.apply) return "Zaten bu işte çalışıyorsun.";
      if ((s.apps || []).some((a) => a.job === fx.apply))
        return "Bu işe zaten başvurdun.";
      if ((s.apps || []).length >= 3) return "Aynı anda en fazla 3 başvuru.";
      if (s.edu === "ogrenci" && !j.student)
        return "Öğrenciyken yalnızca yarı zamanlı iş.";
      if (j.need && !fx.torpil) {
        const r = j.need(s);
        if (r !== true) return r;
      }
    }
    if (fx.useFree && (s.free || 0) < 1) return "Bu hafta boş zamanın kalmadı.";
    if (fx.outfitBuy) {
      const o = HS.Art && HS.Art.OUTFITS[fx.outfitBuy];
      if (o && funds(s) < o.price * s.idx.cpi) return short(s, o.price * s.idx.cpi);
    }
    if (fx.rent && funds(s) < rentFull(s) * (fx.rent === "kira" ? 2 : 1))
      return short(s, rentFull(s) * (fx.rent === "kira" ? 2 : 1));
    if (fx.save && s.cash < fx.save) return "Bu kadar nakit yok.";
    if (fx.fund && s.cash < fx.fund) return "Bu kadar nakit yok.";
    if (fx.transplant && funds(s) < E().transplant * s.idx.cpi)
      return short(s, E().transplant * s.idx.cpi);
    if (fx.emigrate && !s.assets.passport) return "Önce pasaport gerekir.";
    for (const k in fx)
      if (HS.CAN[k]) {
        const r = HS.CAN[k](s, fx[k], fx);
        if (r !== true && r != null) return r;
      }
    return true;
  }
  // Yaşa bağlı sağlık tavanı: iyi bakım yaşlanmayı yavaşlatır ama durdurmaz.
  function healthCap(s) {
    return clamp(100 - Math.max(0, s.age - 35) * 1.15, 20, 100);
  }
  HS.healthCap = healthCap;
  // Doygunluk: değer tavana yaklaştıkça artış, sıfıra yaklaştıkça düşüş zayıflar.
  function soft(delta, value, cap) {
    if (delta > 0) return delta * clamp((cap - value) / 40, 0, 1);
    return delta * clamp(value / 30, 0.3, 1);
  }
  function pay(s, amount) {
    // Önce nakit, yetmezse kredi kartı (varsa), o da yetmezse fark borca yazılır.
    s.cash -= amount;
    if (s.cash < 0) {
      let left = -s.cash;
      s.cash = 0;
      if (HS.chargeCard) left = HS.chargeCard(s, left);
      if (left > 0) s.debt += left;
    }
  }
  HS.pay = pay;
  function note(s, text) {
    s.log.push({ age: s.age, year: s.year, text });
    if (s.log.length > 160) s.log.splice(20, 1); // ilk anıları korur
  }
  function scene(s, t, p, art) {
    s.scenes.push({ t, p, art: art || "✦" });
  }
  function apply(s, fx, label, title) {
    fx = fx || {};
    const ok = canApply(s, fx);
    if (ok !== true) return ok;
    // Tema yalnızca haftalık kararlardan ve büyük adımlardan birikir; boş zaman etkinlikleri saymaz.
    const theme = fx.noTheme ? null : autoTheme(fx);
    if (theme) s.traits[theme] += fx.themeWeight || 1;

    if (fx.cost) pay(s, fx.cost * (fx.raw ? 1 : s.idx.cpi));
    if (fx.cash) {
      const v = fx.cash * (fx.raw ? 1 : s.idx.cpi);
      if (v < 0) pay(s, -v);
      else s.cash += v;
    }
    if (fx.h)
      s.health = clamp(s.health + soft(fx.h, s.health, healthCap(s)), 0, 100);
    if (fx.m) s.mood = clamp(s.mood + soft(fx.m, s.mood, 100), 0, 100);
    if (fx.skill) s.skill = clamp(s.skill + fx.skill, 0, 100);
    if (fx.people) s.people = Math.max(0, s.people + fx.people);
    if (fx.bond && s.partner)
      s.partner.bond = clamp(s.partner.bond + fx.bond, 0, 100);
    if (fx.kidBond)
      s.children.forEach((c) => (c.bond = clamp(c.bond + fx.kidBond, 0, 100)));
    if (fx.flag) s.flags[fx.flag] = s.year;
    if (fx.useFree) s.free = Math.max(0, (s.free || 0) - 1);
    if (fx.apply) {
      const interview = ["office", "teacher", "nurse", "memur"].includes(
        fx.apply,
      );
      s.apps.push({
        job: fx.apply,
        p: fx.torpil ? 0.92 : appChance(s, fx.apply) + (fx.boost || 0),
        due: s.weeks + (interview ? 2 : 1) + ((rnd() * 2) | 0),
        interview,
        torpil: !!fx.torpil,
        from: s.weeks,
      });
    }
    if (fx.boostApp) {
      const a = s.apps.find((x) => x.job === fx.boostApp);
      if (a) {
        a.p = clamp(a.p + (fx.boost || 0), 0.03, 0.97);
        a.interview = false;
      }
    }
    if (fx.resolveApp) resolveApp(s, fx.resolveApp, fx.decline);
    if (fx.outfitBuy) {
      const o = HS.Art.OUTFITS[fx.outfitBuy];
      pay(s, o.price * s.idx.cpi);
      if (!s.outfits.includes(fx.outfitBuy)) s.outfits.push(fx.outfitBuy);
      s.outfit = fx.outfitBuy;
    }
    if (fx.wear && s.outfits.includes(fx.wear)) s.outfit = fx.wear;
    if (fx.hairColor) s.hairColor = fx.hairColor;
    if (fx.carColor !== undefined) s.carColor = fx.carColor;
    // Şans: sonucu zarla belirlenen seçimler. Sonuç ara sahne olarak gösterilir.
    if (fx.chance) {
      const c = fx.chance;
      // Uykusuzluk ve benzeri durumlar şansı düşürebilir (js/systems/realism.js)
      const p = HS.chanceMod ? HS.chanceMod(s, c.p) : c.p;
      const won = rnd() < p;
      apply(s, (won ? c.win : c.lose) || {});
      s.scenes.push({
        t: won ? c.winT || "Şans yüzüne güldü" : c.loseT || "Bu sefer olmadı",
        p: won ? c.winP || "" : c.loseP || "",
        art: won ? "✓" : "✕",
        kind: won ? "win" : "lose",
        odds: Math.round(p * 100),
      });
    }
    if (fx.policy) s.policy = fx.policy;

    // Eğitim
    if (fx.edu === "ogrenci") {
      s.edu = "ogrenci";
      s.eduWeeks = 0;
      if (s.job !== "none" && !HS.JOBS[s.job].student) s.job = "none";
      note(s, "Üniversiteye başladı.");
      scene(
        s,
        "Kampüste ilk gün",
        "Kayıt kuyruğu, yeni yüzler ve ders programı. Önünde dört yıl var.",
        "✎",
      );
    } else if (fx.edu === "yarim") {
      s.edu = "yarim";
      note(s, "Üniversiteyi yarıda bıraktı.");
    }

    // İş
    if (fx.job) {
      if (fx.job !== s.job) {
        s.job = fx.job;
        // Başlangıç basamağı: diplomalılar ofis/öğretmenlik/sağlıkta bir basamak yukarıdan,
        // dükkân açan "dükkân sahibi" olarak başlar.
        s.jobLevel =
          fx.level ??
          ((s.edu === "universite" && ["office", "teacher", "nurse"].includes(fx.job)) || fx.job === "business" ? 1 : 0);
        s.jobWeeks = 0;
        if (fx.job !== "none") {
          s.worked = true;
          s.lastJob = fx.job;
          const j = HS.JOBS[fx.job];
          if (j.startup) pay(s, j.startup * s.idx.cpi);
          // İş kıyafeti işveren tarafından verilir
          if (j.uniform && !s.outfits.includes(j.uniform))
            s.outfits.push(j.uniform);
          if (j.uniform) s.outfit = j.uniform;
          s.apps = s.apps.filter((a) => a.job !== fx.job);
          note(s, j.name + " olarak çalışmaya başladı.");
        } else note(s, "İşinden ayrıldı.");
      }
    }
    if (fx.promote && s.job !== "none") {
      s.jobLevel = Math.min(4, s.jobLevel + 1);
      s.peak = Math.max(s.peak || 0, s.jobLevel);
      note(s, HS.JOBS[s.job].name + " olarak terfi aldı.");
    }

    // İlişkiler
    if (fx.partner === "new" && !s.partner) {
      s.partner = {
        name: fx.partnerName || pick(HS.NAMES.partner),
        bond: 55,
        married: false,
        met: s.year,
      };
      note(s, s.partner.name + " ile ilişkisi başladı.");
      delete s.flags.pp;
    }
    if (fx.marry && s.partner && !s.partner.married) {
      s.partner.married = true;
      s.partner.wed = s.year;
      s.partner.bond = clamp(s.partner.bond + 10, 0, 100);
      note(s, s.partner.name + " ile evlendi.");
      scene(
        s,
        "Nikâh günü",
        ek(s.partner.name, "with", true) +
          " aynı masada imza attınız. Küçük bir salon, sevdiğiniz birkaç yüz ve uzun bir gece.",
        "♡",
      );
    }
    if (fx.breakup && s.partner) {
      const was = s.partner;
      if (was.married) s.divorced = true;
      s.exes++;
      s.partner = null;
      note(
        s,
        was.married
          ? ek(was.name, "abl") + " boşandı."
          : ek(was.name, "abl") + " ayrıldı.",
      );
    }
    if (fx.child) {
      const name = String(fx.child).trim().slice(0, 24);
      s.children.push({ name, born: s.year, bond: 70 });
      note(s, name + " dünyaya geldi.");
      scene(
        s,
        name + " doğdu",
        "Hastane koridorunda saatler geçti. Sonra küçük bir el parmağını sıktı ve her şey başka bir anlam kazandı.",
        "✿",
      );
    }

    // Para ve varlıklar
    if (fx.save) {
      const v = Math.min(fx.save, s.cash);
      s.cash -= v;
      s.savings += v;
    }
    if (fx.withdraw && s.savings > 0) {
      const v = s.savings * fx.withdraw;
      s.savings -= v;
      s.cash += v;
    }
    if (fx.fund) {
      s.cash -= fx.fund;
      s.fund += fx.fund;
    }
    if (fx.sellFund && s.fund > 0) {
      const v = s.fund * fx.sellFund;
      s.fund -= v;
      s.cash += v;
    }
    if (fx.payDebt && s.debt > 0) {
      const v = Math.min(s.debt, s.cash);
      s.cash -= v;
      s.debt -= v;
    }
    if (fx.debtPlan) s.flags.debtPlan = s.year;
    if (fx.debtGift) s.debt = Math.max(0, s.debt - fx.debtGift * s.idx.cpi);
    if (fx.buy) {
      if (fx.buy === "house") {
        s.homeType = fx.homeType || "daire";
        s.homeV = (s.homeV || 0) + 1;
        const price = homePrice(s);
        if (fx.mortgage) {
          const down = price * 0.3,
            loan = price - down,
            r = (rate(s, "cpi") * 1.25) / 52,
            n = 52 * 15;
          s.cash -= down;
          s.mortgage = {
            left: loan,
            weekly: (loan * r) / (1 - Math.pow(1 + r, -n)),
            r,
          };
        } else book(s, "Ev alımı", price);
        s.assets.house = true;
        s.housing = "ev";
        s.rentMult = 1;
        note(
          s,
          ek(s.city, "loc") +
            " kendi evini aldı (" +
            HOME_TYPES[s.homeType].name
              .split(" (")[0]
              .toLocaleLowerCase("tr-TR") +
            ").",
        );
        scene(
          s,
          "Anahtar teslimi",
          "Boş odalarda sesin yankılanıyor. Duvarlar henüz çıplak ama burası artık senin.",
          "⌂",
        );
      } else if (fx.buy === "car") {
        if (s.car && fx.trade) s.cash += carPrice(s) * 0.55; // eskisini takasla
        const model = fx.model || "ekonomik";
        book(s, HS.Art.CARS[model].name + " alımı", carPrice(s, model));
        s.car = model;
        s.carColor = fx.carColor ?? (rnd() * 6) | 0;
        s.assets.car = !["bisiklet"].includes(model);
        note(s, HS.Art.CARS[model].name + " aldı.");
      } else {
        book(s, "Arsa alımı", landPrice(s));
        s.assets.land = true;
        note(s, "Arsa aldı.");
      }
    }
    if (fx.sell === "car" && s.car) s.assets.car = true; // bisiklet de satılabilir
    if (fx.sell && s.assets[fx.sell]) {
      const v =
        fx.sell === "house"
          ? homePrice(s) - (s.mortgage ? s.mortgage.left : 0)
          : fx.sell === "car"
            ? carPrice(s) * 0.55
            : landPrice(s) * (fx.sellShare || 1);
      s.cash += Math.max(0, v);
      if (fx.sell === "house") {
        s.mortgage = null;
        s.housing = "kira";
        s.homeType = null;
        s.homeV++;
      }
      if (fx.sell === "car") s.car = null;
      if (fx.sell !== "land" || !fx.sellShare || fx.sellShare >= 1)
        s.assets[fx.sell] = false;
      note(
        s,
        { house: "Evini", car: "Arabasını", land: "Arsasını" }[fx.sell] +
          " sattı.",
      );
    }
    if (fx.rent) {
      book(s, "Depozito ve ilk kira", rentFull(s) * (fx.rent === "kira" ? 2 : 1));
      s.housing = fx.rent;
      s.rentMult = 1;
      s.homeV++;
      note(
        s,
        fx.rent === "kira"
          ? "Tek başına eve çıktı."
          : "Ev arkadaşıyla eve çıktı.",
      );
    }
    if (fx.moveHome) {
      s.housing = "aile";
      s.rentMult = 1;
      s.homeV++;
    }
    if (fx.sharedFlat && s.housing === "kira") s.housing = "kira-paylasim";
    if (fx.landGift) {
      s.assets.land = true;
      note(s, "Mirastan bir arsa kaldı.");
    }
    if (fx.rentCut && s.housing.startsWith("kira"))
      s.rentMult = Math.max(0.4, s.rentMult * fx.rentCut);
    if (fx.transitPass) s.transitPass = 4;
    if (fx.passport) {
      s.assets.passport = true;
      pay(s, E().passport * s.idx.cpi);
    }

    // Yer değiştirme
    if (fx.emigrate) {
      s.city = fx.emigrate;
      s.abroad = true;
      s.homeV++;
      if (s.housing === "aile") s.housing = "kira-paylasim";
      if (s.job !== "none" && !fx.keepJob) {
        s.job = "none";
        s.jobLevel = 0;
      }
      note(s, ek(s.city, "dat") + " taşındı.");
      scene(
        s,
        "Yeni bir ülke",
        "Valizlerin bantla tutturulmuş, cebinde yarım öğrenilmiş bir dil var. " +
          s.city +
          " ilk gece hem soğuk hem çok parlak.",
        "✈",
      );
    }
    if (fx.returnHome) {
      s.city = s.birthCity;
      s.returned = true;
      s.homeV++;
      if (s.job !== "none") s.job = "none";
      note(s, ek(s.city, "dat") + " geri döndü.");
    }
    if (fx.moveCity && fx.moveCity !== s.city) {
      // Taşınma masrafları ve evin mülke dönüşmesi js/systems/housing.js içinde
      if (HS.onMove) HS.onMove(s, fx);
      s.city = fx.moveCity;
      s.moved = true;
      s.homeV++;
      if (s.job !== "none" && !fx.job && !fx.keepJob) s.job = "none";
      if (s.housing === "aile") s.housing = "kira-paylasim";
      if (s.assets.house) s.housing = "kira";
      if (HS.afterMove) HS.afterMove(s, fx);
      note(s, ek(s.city, "dat") + " taşındı.");
    }

    // Risk
    if (fx.risk) {
      s.risk = Math.max(0, s.risk + fx.risk);
      if (fx.risk > 0) s.riskEver += fx.risk;
    }

    // Görünüm
    if (fx.hair) s.hair = fx.hair;
    if (fx.beard !== undefined) s.beard = fx.beard;
    if (fx.transplant) {
      pay(s, E().transplant * s.idx.cpi);
      s.transplanted = true;
      s.thinning = false;
      note(s, "Saç ekimi yaptırdı.");
    }
    if (fx.thinning) s.thinning = true;

    // Sistem dosyalarının tanımladığı etkiler
    for (const k in fx) if (HS.FX[k]) HS.FX[k](s, fx[k], fx);
    if (fx.scene) scene(s, fx.scene.t, fx.scene.p, fx.scene.art);
    if (MAJOR.some((k) => fx[k]) && label && title && fx.logChoice !== false)
      s.flags.lastMajor = title + ": " + label;
    if (fx.log) note(s, fx.log);
    return true;
  }
  HS.apply = apply;
  HS.canApply = canApply;

  // ---------- Olay seçimi ----------
  // Olay metinlerine verilen yardımcılar. tl(n): 2026 TL tutarını o yılın fiyatına çevirip yazar.
  const ctx = (s) => ({
    ek,
    money: HS.money,
    pick,
    tl: (n) => HS.money(n * s.idx.cpi),
  });
  function resolveText(v, s) {
    return typeof v === "function" ? v(s, ctx(s)) : v;
  }
  // Olay seçeneklerindeki para miktarlarını oyun dengesi ayarlarıyla ölçekler.
  function scaleMoney(fx) {
    const C = HS.CFG;
    if (!C || !fx) return;
    const one = (f) => {
      if (f.cost) f.cost *= C.eventCostScale;
      if (f.cash) f.cash *= f.cash > 0 ? C.eventGainScale : C.eventCostScale;
    };
    one(fx);
    if (fx.chance) {
      if (fx.chance.win) one((fx.chance.win = { ...fx.chance.win }));
      if (fx.chance.lose) one((fx.chance.lose = { ...fx.chance.lose }));
    }
  }
  // Olay tanımını, kayda yazılabilir düz bir nesneye çevirir.
  function materialize(def, s) {
    const raw =
      typeof def.choices === "function" ? def.choices(s, ctx(s)) : def.choices;
    const c = raw.filter(Boolean).map((ch) => {
      const fx =
        typeof ch.fx === "function" ? ch.fx(s, ctx(s)) : { ...(ch.fx || {}) };
      scaleMoney(fx);
      if (ch.theme) fx.theme = ch.theme;
      const ok = ch.need ? ch.need(s) : true;
      const can = ok === true ? canApply(s, fx) : ok;
      return {
        label: resolveText(ch.label, s),
        hint: resolveText(ch.hint || "", s),
        odds: fx.chance ? Math.round((HS.chanceMod ? HS.chanceMod(s, fx.chance.p) : fx.chance.p) * 100) : null,
        fx,
        need: ok === true ? null : ok, // olay anındaki koşul (ör. diploma)
        off: can === true ? null : can,
      };
    });
    ensureOpen(c);
    return {
      id: def.id,
      t: resolveText(def.title, s),
      p: resolveText(def.text, s),
      art: def.art || null,
      tag: def.tag || null,
      c,
    };
  }
  HS.materialize = materialize;
  // Nakit gibi durumlar hafta içinde değişirse (sekme eylemleri) seçeneklerin
  // uygunluğunu yeniden hesaplar.
  function refresh(s) {
    if (!s.current) return;
    s.current.c.forEach((ch) => {
      if (ch.need) return;
      const can = canApply(s, ch.fx);
      ch.off = can === true ? null : can;
    });
    ensureOpen(s.current.c);
  }
  // Her olayda en az bir seçilebilir seçenek olmalı (ör. nakit bitmişken).
  function ensureOpen(c) {
    if (!c.some((x) => !x.off))
      c.push({
        label: "Bu kez geç",
        hint: "Şu an gücün yetmiyor.",
        fx: { m: -1 },
        need: null,
        off: null,
      });
  }
  HS.refresh = refresh;

  function eligible(def, s) {
    if (def.minAge && s.age < def.minAge) return false;
    if (def.maxAge && s.age > def.maxAge) return false;
    if (def.jobs && !def.jobs.includes(s.job)) return false;
    const last = s.seen[def.id];
    if (last !== undefined) {
      if (def.once) return false;
      // Haftada birden çok olay geldiği için bekleme süreleri ölçeklenir (js/systems/time.js).
      if (s.weeks - last < (def.cooldown ?? 52) * (HS.COOLDOWN_SCALE || 1)) return false;
    }
    try {
      return !def.when || !!def.when(s, ctx(s));
    } catch (e) {
      return false;
    }
  }
  function chooseEvent(s) {
    const all = HS.EVENTS;
    // 1) Öncelikli olaylar (yıl başı, doğum günü dönemeçleri, aile vb.)
    const pri = all
      .filter((d) => d.priority && eligible(d, s))
      .sort((a, b) => b.priority - a.priority);
    if (pri.length) return pri[0];
    // 2) Ağırlıklı rastgele havuz
    const pool = all.filter((d) => !d.priority && eligible(d, s));
    let total = 0;
    const w = pool.map((d) => {
      const v = Math.max(
        0,
        typeof d.weight === "function" ? d.weight(s) : (d.weight ?? 1),
      ) * (/^fate/.test(d.id) && HS.CFG ? HS.CFG.fateScale : 1);
      total += v;
      return v;
    });
    let r = rnd() * total;
    for (let i = 0; i < pool.length; i++) if ((r -= w[i]) < 0) return pool[i];
    return HS.FALLBACK_EVENT;
  }
  function nextEvent(s) {
    const def = s.weeks === 0 && s.seen[HS.INTRO_EVENT.id] === undefined ? HS.INTRO_EVENT : chooseEvent(s);
    s.seen[def.id] = s.weeks;
    (HS.HOOKS.event || []).forEach((f) => f(s, def));
    s.current = materialize(def, s);
    return s.current;
  }
  HS.nextEvent = nextEvent;

  // ---------- Haftalık ilerleme ----------
  // Seçimi uygular, haftayı işletir ve yeni olayı hazırlar.
  // Döner: {ok:true} | {ok:false, reason} | {ended:reason}
  function choose(s, i, customName) {
    const ev = s.current;
    if (!ev || !ev.c[i]) return { ok: false, reason: "Seçim bulunamadı." };
    const ch = ev.c[i];
    if (ch.off) return { ok: false, reason: ch.off };
    let fx = { ...ch.fx };
    if (fx.child === "CUSTOM") {
      if (!customName || !customName.trim())
        return { ok: false, reason: "İsim girilmedi.", needName: true };
      fx.child = customName.trim();
    }
    const r = apply(s, fx, ch.label, ev.t);
    if (r !== true) return { ok: false, reason: r };
    if (fx.endLife) return { ended: endLife(s, "chosen") };
    return HS.tick ? HS.tick(s) : week(s);
  }
  HS.choose = choose;

  // Sekmelerdeki eylemler: haftayı ilerletmeden uygulanır (alışveriş, berber vb.).
  function quickAction(s, fx) {
    const r = apply(s, fx);
    refresh(s);
    return r;
  }
  HS.quickAction = quickAction;

  // ---------- İş başvuruları ----------
  // Kabul şansı: işin zorluğu, beceri, eğitim, çevre, kıyafet ve yaş.
  const APP_BASE = {
    cafe: 0.7,
    factory: 0.6,
    music: 0.35,
    office: 0.3,
    teacher: 0.4,
    nurse: 0.45,
    memur: 0.25,
    crime: 0.9,
  };
  function outfitFits(s, job) {
    const o = HS.Art && HS.Art.OUTFITS[s.outfit];
    return (
      !!o &&
      ((o.jobs || []).includes(job) ||
        (o.formal && ["office", "teacher", "memur"].includes(job)))
    );
  }
  function appChance(s, job) {
    let p = APP_BASE[job] ?? 0.4;
    p += Math.min(0.25, s.skill * 0.006);
    if (
      s.edu === "universite" &&
      ["office", "teacher", "nurse", "memur"].includes(job)
    )
      p += 0.15;
    p += Math.min(0.1, s.people / 300);
    if (outfitFits(s, job)) p += 0.1;
    p -= Math.max(0, s.age - 45) * 0.01;
    if (s.flags.bilinen) p += 0.05; // önceki işten iyi referans
    return clamp(p, 0.05, 0.95);
  }
  function resolveApp(s, job, decline) {
    const a = s.apps.find((x) => x.job === job);
    if (!a) return;
    s.apps = s.apps.filter((x) => x !== a);
    const j = HS.JOBS[job];
    if (decline) {
      note(s, j.name + " başvurusunu geri çekti.");
      return;
    }
    const won = rnd() < a.p;
    if (won) {
      apply(s, { job });
      if (a.torpil) s.torpilJob = job;
      s.mood = clamp(s.mood + 8, 0, 100);
      s.scenes.push({
        t: "İşe alındın!",
        p:
          j.name +
          " olarak başlıyorsun. Aylık net " +
          HS.money(wage(s, job, 0)) +
          "." +
          (j.uniform ? " İş kıyafetin dolabında." : ""),
        art: "✓",
        kind: "win",
        odds: Math.round(a.p * 100),
      });
    } else {
      s.mood = clamp(s.mood - 4, 0, 100);
      s.skill = clamp(s.skill + 1, 0, 100); // her mülakat bir deneyim
      s.scenes.push({
        t: "Bu sefer olmadı",
        p:
          j.name +
          " başvurun olumsuz sonuçlandı. Becerini geliştirmek, uygun kıyafet ve çevre şansını artırır.",
        art: "✕",
        kind: "lose",
        odds: Math.round(a.p * 100),
      });
    }
  }
  HS.appChance = appChance;
  HS.outfitFits = outfitFits;

  // ---------- Boş zaman ----------
  // Her hafta karar dışında harcanabilecek boş zaman. Çalışan ve öğrenci 2,
  // işsiz ve emekli 4, diğer durumlar 3; küçük çocuk 1 azaltır.
  function freeSlots(s) {
    let n = s.job !== "none" || s.edu === "ogrenci" ? 2 : 4;
    if (s.job !== "none" && s.edu === "ogrenci") n = 1;
    if (s.children.some((k) => s.year - k.born < 6)) n -= 1;
    if (HS.freeSlotsMod) n += HS.freeSlotsMod(s);
    return Math.max(1, n);
  }
  HS.freeSlots = freeSlots;
  // Etkinlik: boş zaman harcar; bazen beklenmedik bir şey olur.
  function doActivity(s, id, param) {
    const a = (HS.ACTIVITIES || []).find((x) => x.id === id);
    if (!a) return { ok: false, reason: "Etkinlik bulunamadı." };
    if ((s.free || 0) < 1)
      return { ok: false, reason: "Bu hafta boş zamanın kalmadı." };
    if (a.when && !a.when(s)) return { ok: false, reason: "Şu an yapılamaz." };
    s.flags.actDone = s.flags.actDone || {};
    if (a.oncePerWeek !== false && s.flags.actDone[id])
      return { ok: false, reason: "Bunu bu hafta zaten yaptın." };
    if (a.pick && !param) return { ok: false, reason: "Bir seçim yap.", needPick: a.pick };
    const fx = typeof a.fx === "function" ? a.fx(s, ctx(s), param) : { ...a.fx };
    const can = canApply(s, fx);
    if (can !== true) return { ok: false, reason: can };
    apply(s, { ...fx, noTheme: true });
    s.free--;
    s.flags.actDone[id] = true;
    let text = typeof a.done === "function" ? a.done(s, ctx(s), param) : a.done || "";
    // Rastgele sürprizler
    const surprise = (a.surprises || []).find(
      (x) => (!x.when || x.when(s)) && rnd() < x.p,
    );
    if (surprise) {
      apply(s, {
        ...(typeof surprise.fx === "function"
          ? surprise.fx(s, ctx(s))
          : surprise.fx || {}),
        noTheme: true,
      });
      s.scenes.push({
        t: surprise.t,
        p:
          typeof surprise.text === "function"
            ? surprise.text(s, ctx(s))
            : surprise.text,
        art: surprise.art || "✦",
        kind: surprise.kind || null,
      });
    }
    refresh(s);
    return { ok: true, text };
  }
  HS.doActivity = doActivity;

  function week(s) {
    // Defter, sekmelerde yapılan harcamaları da kapsar; hafta sonunda sıfırlanır.
    s.ledger = s.ledger || { in: [], out: [] };
    const cash0 = s.cash,
      worth0 = netWorth(s);
    s.weeks++;
    s.week++;
    if (s.week > 52) {
      s.week = 1;
      s.year++;
      s.age++;
      yearTurn(s);
      yearlyBody(s);
      runHooks("yearly", s);
    }
    weeklyMoney(s);
    weeklyLife(s);
    runHooks("weekly", s);
    if (HS.isMonthTurn(s)) runHooks("monthly", s);
    s.lastWeek = {
      in: s.ledger.in,
      out: s.ledger.out,
      cash: s.cash - cash0,
      worth: netWorth(s) - worth0,
    };
    s.ledger = { in: [], out: [] };
    s.free = freeSlots(s);
    s.flags.actDone = {};
    const end = deathCheck(s);
    if (end) return { ended: endLife(s, end) };
    if (s.weeks % 26 === 0) halfYearScene(s);
    nextEvent(s);
    return { ok: true };
  }
  HS.week = week;

  // Ay dönümü: yılda 12 kez (52 hafta / 12).
  HS.isMonthTurn = (s) => Math.floor(s.weeks / WEEKS_PER_MONTH) !== Math.floor((s.weeks - 1) / WEEKS_PER_MONTH);
  function weeklyMoney(s) {
    const b = budget(s);
    let living = b.living;
    if (s.transitPass > 0) {
      living -= (E().basket.transport * s.idx.transport * 0.12) / WEEKS_PER_MONTH;
      s.transitPass--;
    }
    // Maaş, kira ve yaşam giderleri ayda bir işlenir (Türkiye'de maaş ve kira aylıktır).
    if (HS.isMonthTurn(s)) {
      const M = WEEKS_PER_MONTH;
      let income = b.income * M;
      if (b.volatile) income *= 1 + (rnd() * 2 - 1) * b.volatile;
      income = Math.max(0, income);
      if (s.edu === "ogrenci" && s.job !== "none") income *= 0.5; // yarı zamanlı
      if (HS.taxAdj && s.job !== "none" && !s.retired) income *= HS.taxAdj(s, income);
      earn(s, s.retired ? "Emekli maaşı" : s.job !== "none" ? "Aylık maaş" : "Gelir", income);
      book(s, "Aylık yaşam giderleri", living * M);
      book(s, "Aylık kira", b.rent * M);
      book(s, "Çocuk giderleri (aylık)", b.kids * M);
    }
    if (s.mortgage) {
      const interest = s.mortgage.left * s.mortgage.r;
      const p = Math.min(s.mortgage.weekly, s.mortgage.left + interest);
      s.mortgage.left = Math.max(0, s.mortgage.left + interest - p);
      book(s, "Konut kredisi", p);
      if (s.mortgage.left < 1) {
        s.mortgage = null;
        note(s, "Konut kredisini kapattı.");
      }
    }
    // Borç faizi ve asgari ödeme
    if (s.debt > 0) {
      const plan = s.flags.debtPlan ? 0.7 : 1;
      s.debt *= 1 + (rate(s, "cpi") * 1.5 * plan) / 52;
      const min = Math.min(s.debt, Math.max(s.debt * 0.02, 200 * s.idx.cpi));
      const paid = Math.min(min, s.cash);
      s.cash -= paid;
      s.debt -= paid;
      if (paid > 0) s.ledger.out.push(["Borç ödemesi", paid]);
      if (paid < min) s.mood = clamp(s.mood - 1, 0, 100);
      if (s.debt < 1) s.debt = 0;
    }
    // Mevduat: 2026'da gerçek mevduat ortalaması, sonra enflasyonun biraz üstü
    const dep =
      s.year <= E().startYear ? E().depositRate : rate(s, "cpi") * 1.08 + 0.01;
    // Vadesiz (günlük getirili) hesap, vadeli mevduatın yarısı kadar faiz alır; vadeli hesaplar js/systems/bank.js içinde.
    if (s.savings > 0) s.savings *= 1 + (dep * 0.5) / 52;
    // Fon ve diğer yatırımlar js/systems/invest.js içinde aylık değerlenir.
  }

  function weeklyLife(s) {
    if (s.job !== "none") {
      s.jobWeeks++;
      s.jobTime[s.job] = (s.jobTime[s.job] || 0) + 1;
    }
    if (s.edu === "ogrenci") {
      s.eduWeeks++;
      if (s.eduWeeks % 13 === 0) s.skill += 1;
    }
    // Riskli işte risk yavaş birikir; uzak durdukça zamanla azalır.
    if (HS.JOBS[s.job]?.risky) {
      if (s.weeks % 8 === 0) {
        s.risk += 0.25;
        s.riskEver += 0.25;
      }
    } else if (s.risk > 0 && s.weeks % 26 === 0)
      s.risk = Math.max(0, s.risk - 0.25);
    // Ruh hâli, hayatın koşullarından oluşan bir dengeye doğru yavaşça kayar:
    // ilişki ve çocuklarla bağ, çevre, sağlık, borç, iş ve barınma.
    const kids = s.children.length
      ? s.children.reduce((a, k) => a + k.bond, 0) / s.children.length
      : 50;
    const base =
      45 +
      (s.partner ? (s.partner.bond - 55) / 4 : s.age > 55 ? -8 : -4) +
      (kids - 55) / 6 +
      Math.min(6, s.people / 10) +
      (s.health - 60) / 6 -
      (s.debt > wage(s, "cafe", 0) * 3 ? 10 : 0) -
      (s.job === "none" && !s.retired && s.edu !== "ogrenci" && s.age > 22
        ? 6
        : 0) -
      (HS.JOBS[s.job]?.risky ? 8 : 0) +
      (s.flags.kedi ? 2 : 0);
    // Olayların etkisi kısa sürer; ruh hâli haftalar içinde koşulların belirlediği düzeye döner.
    s.mood = clamp(s.mood + (base - s.mood) * 0.2, 0, 100);
    // Sağlık, yaşın izin verdiği tavanın üstündeyse yavaşça ona iner.
    const cap = healthCap(s);
    if (s.health > cap) s.health -= (s.health - cap) * 0.02;
    // İlişki bağı ilgi görmezse yavaşça zayıflar.
    if (s.partner) s.partner.bond = clamp(s.partner.bond - 0.35, 0, 100);
    // Arkadaşlıklar da emek ister: ilgilenilmeyen çevre yıllar içinde küçülür.
    s.people *= 0.97;
    s.children.forEach((c) => (c.bond = clamp(c.bond - 0.05, 0, 100)));
  }

  function yearlyBody(s) {
    // Yaşa bağlı sağlık kaybı; düşük mutluluk ve yüksek risk de yıpratır.
    let loss = Math.max(0, s.age - 38) * 0.11 + rnd() * 1.2;
    if (s.mood < 30) loss += 1.5;
    if (HS.JOBS[s.job]?.risky) loss += 1.5;
    if (s.job === "factory") loss += 0.5;
    s.health = clamp(Math.round((s.health - loss) * 10) / 10, 0, 100);
    if (s.age >= RETIRE_AGE && !s.retired) {
      s.retired = true;
      if (s.job !== "none") s.lastJob = s.job;
      s.job = "none";
      note(s, "Emekli oldu.");
      scene(
        s,
        "Son iş günü",
        "Masanı topladın, vedalaştın. Yarın sabah alarm çalmayacak; emekli maaşı " +
          HS.money(pension(s)) +
          " ile yeni bir düzen başlıyor.",
        "☼",
      );
    }
    if (s.edu === "ogrenci" && s.eduWeeks >= (s.major ? s.major.years * 52 : 208)) {
      s.edu = "universite";
      s.skill += 4;
      note(s, "Üniversiteden mezun oldu.");
      scene(
        s,
        "Mezuniyet",
        (s.major ? s.major.name + " diploman elinde. " : "") + "Kep havaya uçtu. Diploma artık çekmecede; öğretmenlik, sağlık ve ofis işlerinin kapısı aralandı.",
        "✎",
      );
    }
  }

  function deathCheck(s) {
    if (s.health <= 0) return "health";
    if (s.health < 20 && rnd() < (20 - s.health) * 0.0015) return "health";
    if (s.age >= 104) return "age";
    if (s.age >= 75) {
      const p =
        0.0006 * Math.pow(1.11, s.age - 75) + (100 - s.health) * 0.00006;
      // Sağlığı zayıfken gelen ölüm "hastalık sonrası" sayılır.
      if (rnd() < p) return s.health < 40 ? "health" : "age";
    }
    // Riskli işi bırakan kişi için yakalanma ihtimali belirgin şekilde düşer.
    if (
      s.risk >= 3 &&
      rnd() < (HS.JOBS[s.job]?.risky ? 0.001 : 0.0003) * s.risk
    )
      return "crime";
    if (s.mood <= 2 && s.health < 20) return "crisis";
    return null;
  }

  function halfYearScene(s) {
    const job = s.retired
      ? "Emekli maaşınla kendi ritminde yaşıyorsun."
      : s.edu === "ogrenci"
        ? "Derslerle hayat arasında koşturuyorsun."
        : s.job === "none"
          ? "Henüz düzenli bir işin yok."
          : HS.JOBS[s.job].name + " olarak çalışıyorsun.";
    scene(
      s,
      "Altı ay daha geçti",
      s.first +
        ", " +
        s.age +
        " yaşındasın. Nakit " +
        HS.money(s.cash) +
        ", banka " +
        HS.money(s.savings) +
        (s.debt > 0 ? ", borç " + HS.money(s.debt) : "") +
        ". " +
        job,
      "◒",
    );
  }

  function endLife(s, reason) {
    s.alive = false;
    s.ending = reason;
    s.current = null;
    s.scenes = [];
    s.final = HS.Endings.compose(s);
    return reason;
  }
  HS.endLife = endLife;

  HS.newLife = newLife;
  HS.migrate = migrate;
  HS.note = note;
})(globalThis.HS || (globalThis.HS = {}));
