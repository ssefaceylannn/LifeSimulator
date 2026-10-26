// Oyun motoru: durum, ekonomi, etkiler, olay seçimi ve haftalık ilerleme.
// DOM'a dokunmaz; tarayıcıda ve Node testlerinde aynı şekilde çalışır.
(function (HS) {
  "use strict";

  const E = () => HS.ECONOMY;
  const SAVE_VERSION = 2;
  const RETIRE_AGE = 64;
  const WEEKS_PER_MONTH = 4.345;
  HS.RETIRE_AGE = RETIRE_AGE;
  HS.rng = HS.rng || Math.random;
  const rnd = () => HS.rng();
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const pick = (arr) => arr[(rnd() * arr.length) | 0];

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
  function newLife({ first, last, city, look }) {
    const scenarioIds = Object.keys(HS.SCENARIOS);
    return migrate({
      v: SAVE_VERSION,
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      first: first || "Deniz",
      last: last || "Yılmaz",
      look: look || "woman",
      birthCity: city,
      city,
      age: 18,
      year: E().startYear,
      week: 1,
      weeks: 0,
      cash: E().startCash,
      scenario: pick(scenarioIds),
      seed: (rnd() * 1000) | 0,
      created: Date.now(),
    });
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
    if (!HS.SCENARIOS[s.scenario]) s.scenario = "yavas";
    s.assets = Object.assign(
      { house: false, car: false, land: false, passport: false },
      s.assets,
    );
    if (s.current && !Array.isArray(s.current.c)) s.current = null;
    if (s.current && s.current.c.some((c) => Array.isArray(c)))
      s.current = null; // v1 olay biçimi
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
  const abroadMul = (s, k) =>
    cityData(s).region === "abroad"
      ? k === "wage"
        ? E().abroadWage
        : E().abroadCost
      : 1;

  function wage(s, job = s.job, level = s.jobLevel) {
    const j = HS.JOBS[job];
    if (!j || !j.pay) return 0;
    let p =
      j.pay *
      s.idx.wage *
      (1 + 0.2 * level) *
      (1 + Math.min(s.skill, 60) * 0.004) *
      abroadMul(s, "wage");
    if (s.policy === "enterprise" && (job === "business" || job === "factory"))
      p *= 1.05;
    return p;
  }
  function pension(s) {
    const base = s.worked && s.lastJob ? wage(s, s.lastJob, 0) * 0.6 : 0;
    return Math.max(E().minPension * s.idx.wage, base);
  }
  function rentFull(s) {
    let r = cityData(s).rent * s.idx.housing;
    if (s.policy === "housing") r *= 0.92;
    return r;
  }
  function rentShare(s) {
    if (s.housing === "kira") return rentFull(s) * s.rentMult;
    if (s.housing === "kira-paylasim") return rentFull(s) * 0.5 * s.rentMult;
    return 0;
  }
  function homePrice(s) {
    return cityData(s).sqm * E().homeSize * s.idx.housing;
  }
  function carPrice(s) {
    return E().car * s.idx.transport;
  }
  function landPrice(s) {
    return homePrice(s) * 0.35;
  }
  // Aylık temel gider (kira hariç).
  function basket(s) {
    const b = E().basket;
    let transport = b.transport * s.idx.transport;
    if (s.assets.car) transport = transport * 0.4 + 4500 * s.idx.transport;
    if (s.policy === "transit") transport *= 0.85;
    let total = b.food * s.idx.food + transport + b.other * s.idx.cpi;
    if (s.housing === "aile") total *= E().familyContribution;
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
    if (s.assets.car) n += carPrice(s) * 0.5;
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
  // Seçim yapılabilir mi? true ya da gerekçe metni döner.
  function canApply(s, fx) {
    if (!fx) return true;
    // cost/cash 2026 TL cinsinden yazılır ve enflasyonla ölçeklenir (raw hariç).
    if (fx.cost && s.cash < fx.cost * (fx.raw ? 1 : s.idx.cpi))
      return "Yeterli nakit yok.";
    if (fx.job && fx.job !== "none") {
      const j = HS.JOBS[fx.job];
      if (s.retired) return "Emekli oldun.";
      if (s.edu === "ogrenci" && !j.student)
        return "Öğrenciyken yalnızca yarı zamanlı iş.";
      if (j.need) {
        const r = j.need(s);
        if (r !== true) return r;
      }
      if (j.startup && s.cash < j.startup * s.idx.cpi)
        return "Sermaye için " + HS.money(j.startup * s.idx.cpi) + " gerekir.";
    }
    if (fx.buy === "house" && fx.mortgage) {
      if (s.cash < homePrice(s) * 0.3) return "Peşinat yetmiyor.";
    } else if (fx.buy) {
      const price = { house: homePrice, car: carPrice, land: landPrice }[
        fx.buy
      ](s);
      if (s.cash < price) return "Yeterli nakit yok.";
    }
    if (fx.rent && s.cash < rentFull(s) * (fx.rent === "kira" ? 2 : 1))
      return "Depozito ve ilk kira için para yetmiyor.";
    if (fx.save && s.cash < fx.save) return "Bu kadar nakit yok.";
    if (fx.fund && s.cash < fx.fund) return "Bu kadar nakit yok.";
    if (fx.transplant && s.cash < E().transplant * s.idx.cpi)
      return "Yeterli nakit yok.";
    if (fx.emigrate && !s.assets.passport) return "Önce pasaport gerekir.";
    return true;
  }
  // Yaşa bağlı sağlık tavanı: iyi bakım yaşlanmayı yavaşlatır ama durdurmaz.
  function healthCap(s) {
    return clamp(100 - Math.max(0, s.age - 35) * 0.9, 25, 100);
  }
  HS.healthCap = healthCap;
  // Doygunluk: değer tavana yaklaştıkça artış, sıfıra yaklaştıkça düşüş zayıflar.
  function soft(delta, value, cap) {
    if (delta > 0) return delta * clamp((cap - value) / 40, 0, 1);
    return delta * clamp(value / 30, 0.3, 1);
  }
  function pay(s, amount) {
    // Para yetmezse fark borca yazılır.
    s.cash -= amount;
    if (s.cash < 0) {
      s.debt += -s.cash;
      s.cash = 0;
    }
  }
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
    const theme = autoTheme(fx);
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
        s.jobLevel = 0;
        s.jobWeeks = 0;
        if (fx.job !== "none") {
          s.worked = true;
          s.lastJob = fx.job;
          const j = HS.JOBS[fx.job];
          if (j.startup) pay(s, j.startup * s.idx.cpi);
          note(s, j.name + " olarak çalışmaya başladı.");
        } else note(s, "İşinden ayrıldı.");
      }
    }
    if (fx.promote && s.job !== "none") {
      s.jobLevel = Math.min(2, s.jobLevel + 1);
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
        } else s.cash -= price;
        s.assets.house = true;
        s.housing = "ev";
        s.rentMult = 1;
        note(s, ek(s.city, "loc") + " kendi evini aldı.");
        scene(
          s,
          "Anahtar teslimi",
          "Boş odalarda sesin yankılanıyor. Duvarlar henüz çıplak ama burası artık senin.",
          "⌂",
        );
      } else {
        s.cash -= fx.buy === "car" ? carPrice(s) : landPrice(s);
        s.assets[fx.buy] = true;
        note(s, fx.buy === "car" ? "Araba aldı." : "Arsa aldı.");
      }
    }
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
      }
      if (fx.sell !== "land" || !fx.sellShare || fx.sellShare >= 1)
        s.assets[fx.sell] = false;
      note(
        s,
        { house: "Evini", car: "Arabasını", land: "Arsasını" }[fx.sell] +
          " sattı.",
      );
    }
    if (fx.rent) {
      s.cash -= rentFull(s) * (fx.rent === "kira" ? 2 : 1);
      s.housing = fx.rent;
      s.rentMult = 1;
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
      if (s.housing === "aile") s.housing = "kira-paylasim";
      if (s.job !== "none") s.job = "none";
      s.jobLevel = 0;
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
      if (s.job !== "none") s.job = "none";
      note(s, ek(s.city, "dat") + " geri döndü.");
    }
    if (fx.moveCity && fx.moveCity !== s.city) {
      s.city = fx.moveCity;
      s.moved = true;
      if (s.housing === "aile") s.housing = "kira-paylasim";
      if (s.assets.house) s.housing = "kira";
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
  // Olay tanımını, kayda yazılabilir düz bir nesneye çevirir.
  function materialize(def, s) {
    const raw =
      typeof def.choices === "function" ? def.choices(s, ctx(s)) : def.choices;
    const c = raw.filter(Boolean).map((ch) => {
      const fx =
        typeof ch.fx === "function" ? ch.fx(s, ctx(s)) : { ...(ch.fx || {}) };
      if (ch.theme) fx.theme = ch.theme;
      const ok = ch.need ? ch.need(s) : true;
      const can = ok === true ? canApply(s, fx) : ok;
      return {
        label: resolveText(ch.label, s),
        hint: resolveText(ch.hint || "", s),
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
      if (s.weeks - last < (def.cooldown ?? 52)) return false;
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
      );
      total += v;
      return v;
    });
    let r = rnd() * total;
    for (let i = 0; i < pool.length; i++) if ((r -= w[i]) < 0) return pool[i];
    return HS.FALLBACK_EVENT;
  }
  function nextEvent(s) {
    const def = s.weeks === 0 ? HS.INTRO_EVENT : chooseEvent(s);
    s.seen[def.id] = s.weeks;
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
    return week(s);
  }
  HS.choose = choose;

  // Sekmelerdeki eylemler: haftayı ilerletmeden uygulanır (alışveriş, berber vb.).
  function quickAction(s, fx) {
    const r = apply(s, fx);
    refresh(s);
    return r;
  }
  HS.quickAction = quickAction;

  function week(s) {
    s.weeks++;
    s.week++;
    if (s.week > 52) {
      s.week = 1;
      s.year++;
      s.age++;
      yearTurn(s);
      yearlyBody(s);
    }
    weeklyMoney(s);
    weeklyLife(s);
    const end = deathCheck(s);
    if (end) return { ended: endLife(s, end) };
    if (s.weeks % 26 === 0) halfYearScene(s);
    nextEvent(s);
    return { ok: true };
  }
  HS.week = week;

  function weeklyMoney(s) {
    const b = budget(s);
    let income = b.income;
    if (b.volatile) income *= 1 + (rnd() * 2 - 1) * b.volatile;
    income = Math.max(0, income);
    if (s.edu === "ogrenci" && s.job !== "none") income *= 0.5; // yarı zamanlı
    let out = b.living + b.rent + b.kids;
    if (s.transitPass > 0) {
      out -= (E().basket.transport * s.idx.transport * 0.12) / WEEKS_PER_MONTH;
      s.transitPass--;
    }
    s.cash += income;
    pay(s, out);
    if (s.mortgage) {
      const interest = s.mortgage.left * s.mortgage.r;
      const p = Math.min(s.mortgage.weekly, s.mortgage.left + interest);
      s.mortgage.left = Math.max(0, s.mortgage.left + interest - p);
      pay(s, p);
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
      if (paid < min) s.mood = clamp(s.mood - 1, 0, 100);
      if (s.debt < 1) s.debt = 0;
    }
    // Mevduat: 2026'da gerçek mevduat ortalaması, sonra enflasyonun biraz üstü
    const dep =
      s.year <= E().startYear ? E().depositRate : rate(s, "cpi") * 1.08 + 0.01;
    if (s.savings > 0) s.savings *= 1 + dep / 52;
    // Endeks fonu: enflasyon üstü beklenen getiri, yüksek oynaklık
    if (s.fund > 0)
      s.fund *= Math.max(
        0.7,
        1 + (rate(s, "cpi") * 1.12) / 52 + (rnd() * 2 - 1) * 0.045,
      );
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
    if (s.partner) s.partner.bond = clamp(s.partner.bond - 0.25, 0, 100);
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
    if (s.edu === "ogrenci" && s.eduWeeks >= 208) {
      s.edu = "universite";
      s.skill += 4;
      note(s, "Üniversiteden mezun oldu.");
      scene(
        s,
        "Mezuniyet",
        "Kep havaya uçtu. Diploma artık çekmecede; öğretmenlik, sağlık ve ofis işlerinin kapısı aralandı.",
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
