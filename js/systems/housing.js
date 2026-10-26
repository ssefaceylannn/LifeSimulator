// Konut ve resmî yükümlülükler:
// - Taşınma: mesafeye göre nakliye, depozito, emlakçı komisyonu, ilk kira
// - Birden çok mülk: yatırım amaçlı ev, kiraya verme, kira geliri, kiracı dertleri
// - Yıllık: emlak vergisi, DASK, MTV, zorunlu trafik sigortası, isteğe bağlı kasko ve özel sağlık sigortası
// - Ehliyet süreci (kurs → e-sınav → direksiyon sınavı → harç)
// - Askerlik (erkekler): tecil, er olarak 6 ay, bedelli
(function (HS) {
  "use strict";
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const r = () => HS.rng();
  const c = (label, hint, fx = {}) => ({ label, hint, fx });
  const C = () => HS.COSTS;
  const TYPE_RENT = { daire: 1, mustakil: 1.4, villa: 2.6 };
  const SIZE = { aile: 0.45, "kira-paylasim": 0.55, kira: 1, daire: 1, mustakil: 1.45, villa: 2.1 };

  // Mesafe: il merkezleri arası kuş uçuşu × 1,25 yol katsayısı
  function km(a, b) {
    const pa = HS.CITIES[a] && HS.TR_MAP && HS.TR_MAP.prov[HS.CITIES[a].plaka];
    const pb = HS.CITIES[b] && HS.TR_MAP && HS.TR_MAP.prov[HS.CITIES[b].plaka];
    if (!pa || !pb) return a === b ? 0 : 600;
    const R = 6371,
      toR = Math.PI / 180;
    const dLat = (pb.lat - pa.lat) * toR,
      dLon = (pb.lon - pa.lon) * toR;
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(pa.lat * toR) * Math.cos(pb.lat * toR) * Math.sin(dLon / 2) ** 2;
    return Math.round(2 * R * Math.asin(Math.sqrt(h)) * 1.25);
  }
  HS.km = km;
  const ownedIn = (s, city) => (s.props || []).find((p) => p.city === city && !p.rented);
  // Taşınma maliyeti dökümü
  HS.moveCost = (s, to, paid) => {
    const dist = km(s.city, to);
    const size = s.housing === "ev" ? SIZE[s.homeType || "daire"] : SIZE[s.housing] || 1;
    const nakliye = paid ? 0 : (C().movingBase + dist * C().movingPerKm) * size * s.idx.cpi;
    const own = ownedIn(s, to);
    const fullRent = (HS.CITIES[to]?.rent || 25000) * s.idx.housing;
    const rent = own ? 0 : s.housing === "aile" || s.housing === "kira-paylasim" ? fullRent * 0.5 : fullRent;
    const deposit = own ? 0 : rent * C().depositMonths;
    const agent = own || paid ? 0 : rent * C().agentCommission;
    const first = rent;
    return { km: dist, nakliye, deposit, agent, first, own: !!own, total: nakliye + deposit + agent + first };
  };

  function init(s) {
    s.props = s.props || [];
    s.license = s.license || (s.car && s.car !== "bisiklet" ? "var" : "yok");
    s.ins = s.ins || { kasko: false, health: false };
    s.homeCity = s.homeCity || (s.assets.house ? s.city : null);
    if (s.look === "man" && s.mil === undefined) s.mil = null;
  }
  HS.HOOKS.newLife.push(init);
  HS.HOOKS.migrate.push(init);

  // Taşınma anı (motor çağırır): masraf ve eski evin mülke dönüşmesi
  HS.onMove = (s, fx) => {
    const to = fx.moveCity || fx.emigrate;
    const cost = HS.moveCost(s, to, fx.relocationPaid);
    if (cost.nakliye) HS.book(s, "Nakliye (" + cost.km + " km)", cost.nakliye);
    if (cost.agent) HS.book(s, "Emlakçı komisyonu", cost.agent);
    if (cost.deposit) HS.book(s, "Kira depozitosu", cost.deposit);
    if (cost.first) HS.book(s, "İlk ay kirası", cost.first);
    houseToProp(s);
  };
  // Kendi evinden taşınırken ev mülk olarak kalır (kiraya verilebilir)
  function houseToProp(s) {
    if (!s.assets.house) return;
    s.props.push({ id: "p" + s.weeks + "_" + s.props.length, city: s.city, type: s.homeType || "daire", rented: false, since: s.year });
    s.assets.house = false;
    s.homeType = null;
    s.homeCity = null;
  }
  HS.houseToProp = houseToProp;
  HS.afterMove = (s) => {
    const own = ownedIn(s, s.city);
    if (own) {
      // Yeni şehirde zaten evin varsa oraya yerleşirsin
      s.props = s.props.filter((p) => p !== own);
      s.assets.house = true;
      s.homeType = own.type;
      s.homeCity = s.city;
      s.housing = "ev";
    } else if (s.housing === "aile") s.housing = "kira-paylasim";
    const pl = HS.CITIES[s.city] && HS.CITIES[s.city].plaka;
    if (pl && s.visited && !s.visited.tr.includes(pl)) s.visited.tr.push(pl);
  };
  // Taşınma için yeterli para var mı?
  HS.CAN.moveCity = (s, to, fx) => {
    if (to === s.city) return "Zaten buradasın.";
    const k = HS.moveCost(s, to, fx.relocationPaid);
    return s.cash < k.total ? "Taşınma için yaklaşık " + HS.money(k.total) + " gerekiyor." : true;
  };

  // ---- Yatırım amaçlı mülk ----
  HS.propPrice = (s, city, type) => (HS.CITIES[city]?.sqm || 40000) * HS.HOME_TYPES[type].m2 * HS.HOME_TYPES[type].k * s.idx.housing;
  HS.propRent = (s, p) => (HS.CITIES[p.city]?.rent || 20000) * TYPE_RENT[p.type] * s.idx.housing;
  HS.CAN.buyProp = (s, v) => {
    const price = HS.propPrice(s, v.city, v.type) * (1 + C().saleCommission + 0.02);
    return s.cash < price ? "Tapu harcı ve komisyon dahil " + HS.money(price) + " gerekiyor." : true;
  };
  HS.FX.buyProp = (s, v) => {
    const price = HS.propPrice(s, v.city, v.type);
    HS.book(s, "Mülk alımı", price);
    HS.book(s, "Tapu harcı ve emlakçı", price * (C().saleCommission + 0.02));
    s.props.push({ id: "p" + s.weeks + "_" + s.props.length, city: v.city, type: v.type, rented: false, since: s.year });
    HS.note(s, HS.ek(v.city, "loc") + " yatırım amaçlı " + HS.HOME_TYPES[v.type].name.split(" (")[0].toLocaleLowerCase("tr-TR") + " aldı.");
  };
  HS.FX.sellProp = (s, id) => {
    const p = s.props.find((x) => x.id === id);
    if (!p) return;
    const v = HS.propPrice(s, p.city, p.type);
    s.cash += v * (1 - C().saleCommission);
    s.props = s.props.filter((x) => x !== p);
    HS.note(s, HS.ek(p.city, "loc") + "ki mülkünü sattı.");
  };
  HS.FX.rentOut = (s, id) => {
    const p = s.props.find((x) => x.id === id);
    if (p) p.seeking = true;
  };
  HS.FX.endLease = (s, id) => {
    const p = s.props.find((x) => x.id === id);
    if (p) {
      p.rented = false;
      p.seeking = false;
    }
  };
  HS.HOOKS.worth.push((s) => (s.props || []).reduce((a, p) => a + HS.propPrice(s, p.city, p.type), 0));

  HS.HOOKS.weekly.push((s) => {
    for (const p of s.props) {
      if (p.seeking && !p.rented && r() < 0.3) {
        p.rented = true;
        p.seeking = false;
        p.tenantSince = s.weeks;
        s.scenes.push({ t: "Kiracı bulundu", p: HS.ek(p.city, "loc") + "ki evine bir kiracı yerleşti. Aylık " + HS.money(HS.propRent(s, p) * 0.9) + " kira alacaksın.", art: "⌂", kind: "win" });
      }
    }
  });
  HS.HOOKS.monthly.push((s) => {
    for (const p of s.props) if (p.rented && !p.unpaid) HS.earn(s, "Kira geliri (" + p.city + ")", HS.propRent(s, p) * 0.9);
  });

  // ---- Yıllık vergi ve sigortalar ----
  HS.HOOKS.yearly.push((s) => {
    const homes = (s.assets.house ? [{ city: s.city, type: s.homeType || "daire" }] : []).concat(s.props);
    homes.forEach((h) => {
      HS.book(s, "Emlak vergisi", HS.propPrice(s, h.city, h.type) * C().propertyTaxRate);
      HS.book(s, "DASK", C().dask * s.idx.cpi);
    });
    if (s.car && !["bisiklet"].includes(s.car)) {
      const tier = { scooter: 0.25, ekonomik: 1, pikap: 1.4, suv: 1.8, spor: 4 }[s.car] || 1;
      HS.book(s, "MTV", C().mtv * tier * s.idx.cpi);
      HS.book(s, "Zorunlu trafik sigortası", C().trafficInsurance * s.idx.cpi);
      if (s.ins.kasko) HS.book(s, "Kasko", C().kasko * tier * s.idx.cpi);
    }
    if (s.ins.health) HS.book(s, "Özel sağlık sigortası", C().privateHealth * (1 + Math.max(0, s.age - 35) * 0.04) * s.idx.cpi);
  });
  HS.FX.ins = (s, v) => (s.ins[v.k] = v.on);

  // ---- Ehliyet ----
  const motor = (m) => m && m !== "bisiklet";
  HS.CAN.buy = (s, v, fx) => (v === "car" && motor(fx.model) && s.license !== "var" ? "Önce ehliyet almalısın (PARA > Ehliyet)." : true);
  HS.CAN.license = (s) => (s.license !== "yok" ? "Ehliyet sürecin zaten başladı." : s.age < 18 ? "18 yaş gerekir." : s.cash < (C().drivingCourse + C().eExam) * s.idx.cpi ? "Kurs ve sınav ücreti için para yetmiyor." : true);
  HS.FX.license = (s) => {
    HS.book(s, "Sürücü kursu", (C().drivingCourse + C().eExam) * s.idx.cpi);
    s.license = "kurs";
    s.licenseAt = s.weeks + 4;
  };
  HS.FX.licenseStep = (s, v) => {
    if (v === "yaziliGecti") {
      s.license = "direksiyon";
      s.licenseAt = s.weeks + 2;
    } else if (v === "yaziliKaldi") {
      HS.book(s, "E-sınav tekrar ücreti", C().eExam * s.idx.cpi);
      s.licenseAt = s.weeks + 3;
    } else if (v === "direksiyonGecti") {
      HS.book(s, "Ehliyet harcı ve kart", C().licenseFee * s.idx.cpi);
      s.license = "var";
      HS.note(s, "Ehliyet aldı.");
    } else if (v === "direksiyonKaldi") {
      HS.book(s, "Direksiyon sınavı tekrar ücreti", C().drivingExam * s.idx.cpi);
      s.licenseAt = s.weeks + 3;
    }
  };

  // ---- Askerlik ----
  HS.FX.mil = (s, v) => {
    if (v === "er") {
      s.mil = "serving";
      s.milUntil = s.weeks + 26;
      s.preMilOutfit = s.outfit;
      if (!s.outfits.includes("uniforma")) s.outfits.push("uniforma");
      s.outfit = "uniforma";
      if (s.job !== "none" && s.job !== "memur") {
        s.job = "none";
        s.company = null;
      }
      HS.note(s, "Askere gitti.");
    } else if (v === "bedelli") {
      HS.book(s, "Bedelli askerlik", C().bedelli * s.idx.cpi);
      s.mil = "bedelli";
      HS.note(s, "Bedelli askerlik yaptı.");
    } else if (v === "tecil") {
      s.mil = "tecil";
      s.milAt = s.weeks + 52;
    } else if (v === "bakaya") {
      s.mil = "bakaya";
      s.milAt = s.weeks + 26;
      HS.book(s, "Yoklama kaçağı idari para cezası", 3500 * s.idx.cpi);
    }
  };
  HS.CAN.mil = (s, v) => (v === "bedelli" && s.cash < C().bedelli * s.idx.cpi ? "Bedelli için " + HS.money(C().bedelli * s.idx.cpi) + " gerekiyor." : true);
  HS.HOOKS.weekly.push((s) => {
    if (s.mil === "serving") {
      s.free = Math.min(s.free, 1);
      if (s.weeks >= s.milUntil) {
        s.mil = "yapildi";
        s.outfit = s.preMilOutfit && s.preMilOutfit !== "uniforma" ? s.preMilOutfit : "gunluk";
        HS.Skills.add(s, "disiplin", 12);
        s.people += 4;
        s.scenes.push({ t: "Tezkere!", p: "Altı ay bitti. Tezkereni aldın, kışlanın kapısından çıkarken arkadaşlarınla sarıldın. Disiplin becerin arttı.", art: "★", kind: "win" });
        HS.note(s, "Askerliğini tamamladı.");
      }
    }
  });

  HS.EVENTS.push(
    {
      id: "license",
      priority: 55,
      cooldown: 0,
      when: (s) => (s.license === "kurs" || s.license === "direksiyon") && s.weeks >= s.licenseAt,
      title: (s) => (s.license === "kurs" ? "E-sınav günü" : "Direksiyon sınavı"),
      text: (s) =>
        s.license === "kurs"
          ? "Elli soruluk sınav başlıyor. Trafik işaretleri, ilk yardım, motor bilgisi."
          : "Sınav görevlisi yanına oturdu. Parkur: yokuşta kalkış, paralel park, şehir içi sürüş.",
      choices: (s) => {
        const yazili = s.license === "kurs";
        const base = yazili ? 0.55 + HS.Skills.get(s, "disiplin") * 0.006 + HS.Skills.get(s, "ilkyardim") * 0.003 : 0.5 + HS.Skills.get(s, "disiplin") * 0.004;
        const ch = (p) => ({
          chance: {
            p: clamp(p, 0.1, 0.95),
            win: { licenseStep: yazili ? "yaziliGecti" : "direksiyonGecti", m: 4 },
            lose: { licenseStep: yazili ? "yaziliKaldi" : "direksiyonKaldi", m: -3 },
            winT: yazili ? "Yazılıyı geçtin" : "Ehliyetini aldın!",
            winP: yazili ? "Sırada direksiyon sınavı var." : "Kartın birkaç gün içinde adresine gelecek. Artık araç alabilirsin.",
            loseT: yazili ? "E-sınavdan kaldın" : "Direksiyon sınavından kaldın",
            loseP: "Tekrar sınav ücreti ödeyip yeniden gireceksin.",
          },
        });
        return [
          c(yazili ? "Deneme sınavları çöz" : "Ekstra ders al", yazili ? "Bir boş zaman harcar." : "Ek ders ücreti öde.", { ...(yazili ? { useFree: 1 } : { cost: 2500 }), ...ch(base + 0.15) }),
          c("Olduğu gibi gir", "Şansına güven.", ch(base)),
        ];
      },
    },
    {
      id: "military",
      priority: 58,
      cooldown: 26,
      when: (s) =>
        s.look === "man" &&
        s.age >= 20 &&
        s.age <= 40 &&
        !["serving", "yapildi", "bedelli"].includes(s.mil) &&
        !(s.mil === "tecil" && s.weeks < s.milAt) &&
        !(s.mil === "bakaya" && s.weeks < s.milAt),
      title: "Askerlik şubesinden yazı",
      text: (s) =>
        "Yoklama ve sevk zamanın geldi. Er olarak 6 ay hizmet edebilir ya da bedelli askerlik için " +
        HS.money(HS.COSTS.bedelli * s.idx.cpi) +
        " ödeyebilirsin." +
        (s.edu === "ogrenci" ? " Öğrenci olduğun için tecil hakkın var." : ""),
      choices: (s) => [
        c("Er olarak git (6 ay)", s.job === "memur" ? "Kadron korunur." : "İşinden ayrılırsın; disiplin ve çevre kazanırsın.", { mil: "er", m: -4 }),
        c("Bedelli öde", "Bir aylık temel eğitim; işine devam edersin.", { mil: "bedelli", m: 2 }),
        s.edu === "ogrenci" || (s.abroad && HS.CITIES[s.city]?.region === "abroad")
          ? c("Tecil ettir", s.edu === "ogrenci" ? "Öğrencilik bitene kadar ertelenir." : "Yurt dışında yaşadığın için ertelenir.", { mil: "tecil" })
          : c("Görmezden gel", "Yoklama kaçağı sayılırsın; idari para cezası ve sorunlar.", { mil: "bakaya", m: -2, risk: 0.25 }),
      ],
    },
    {
      id: "militaryLife",
      weight: (s) => (s.mil === "serving" ? 30 : 0),
      cooldown: 3,
      title: (s) => HS.pick(["Nöbet gecesi", "Mektup günü", "Talim", "Çarşı izni"]),
      text: (s) => HS.pick(["Gece ikiden dörde nöbettesin. Yıldızlar her zamankinden parlak.", "Postacı adını okudu. Zarftaki el yazısını hemen tanıdın.", "Sabah içtimasından sonra uzun bir yürüyüş. Ayakların su topladı ama koğuştakilerle gülüştünüz.", "Hafta sonu çarşı izni çıktı. Bir lokantada ev yemeği yedin."]),
      choices: [c("Dişini sık", "Zaman geçecek.", { sk: { disiplin: 1 }, h: -1 }), c("Arkadaşlarınla kaynaş", "Ömür boyu sürecek dostluklar.", { people: 2, m: 3 })],
    },
    {
      id: "tenantTrouble",
      weight: (s) => (s.props && s.props.some((p) => p.rented) ? 1.2 : 0),
      cooldown: 52,
      title: "Kiracı sorunu",
      text: (s) => {
        const p = s.props.find((x) => x.rented);
        return HS.ek(p.city, "loc") + "ki kiracın iki aydır kirayı ödemiyor ve telefonlara çıkmıyor.";
      },
      choices: (s) => {
        const p = s.props.find((x) => x.rented);
        return [
          c("İcra takibi başlat", "Avukat masrafı; süreç aylar sürebilir.", { cost: 15000, chance: { p: 0.65, win: { cash: (HS.propRent(s, p) * 2) / s.idx.cpi, m: 2 }, lose: { endLease: p.id, m: -4 }, winT: "Kira tahsil edildi", winP: "Kiracı borcunu ödedi ve sözleşmeye uydu.", loseT: "Tahliye ettin", loseP: "Kira alamadın ama ev boşaldı; yeni kiracı arayabilirsin." } }),
          c("Konuşup taksitlendir", "İyi niyet.", { m: -1, people: 1 }),
        ];
      },
    },
    {
      id: "rentalRepair",
      weight: (s) => (s.props && s.props.length ? 0.8 : 0),
      cooldown: 52,
      title: "Mülkünde tamir",
      text: "Kiracın aradı: kombi bozulmuş, kış kapıda.",
      choices: [c("Hemen yaptır", "Masraf senden.", { cost: 18000, people: 1 }), c("Kiracı yaptırsın, kiradan düş", "Ay sonunda daha az kira.", (s) => ({ cash: -9000, m: -1 }))],
    },
  );
})(globalThis.HS || (globalThis.HS = {}));

// Boşanmada birikim ve yatırımların yarısı paylaşılır.
(function (HS) {
  "use strict";
  HS.FX.divorceSplit = (s) => {
    const half = (s.savings || 0) / 2;
    if (half > 0) {
      s.savings -= half;
      (s.ledger = s.ledger || { in: [], out: [] }).out.push(["Boşanma paylaşımı (banka)", half]);
    }
    for (const k in s.inv || {}) {
      s.inv[k] /= 2;
      if (s.invCost) s.invCost[k] = (s.invCost[k] || 0) / 2;
    }
    s.flags.divorced = 1;
  };
})(globalThis.HS || (globalThis.HS = {}));
