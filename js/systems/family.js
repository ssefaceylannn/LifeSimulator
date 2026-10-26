// Aile: anne, baba, kardeşler, büyükanne-büyükbaba, dayı/teyze/amca/hala, evlenince
// kayınvalide ve kayınpeder. Her akrabanın adı, yaşı, yaşadığı il, görünüşü ve seninle
// bağı var. Akrabalar yaşlanır ve vefat edebilir. Ziyarete gidilir (onların evinde, sahnede
// görünürler); bazen onlar ziyarete gelir ve salonda yanında dururlar.
(function (HS) {
  "use strict";
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const r = () => HS.rng();
  const money = (n) => HS.money(n);
  const c = (label, hint, fx = {}) => ({ label, hint, fx });
  const W = ["Ayşe", "Fatma", "Emine", "Hatice", "Zehra", "Sevgi", "Nurten", "Gülsüm", "Hülya", "Serap", "Sibel", "Derya", "Elif", "Merve", "Büşra", "Gizem", "Esra", "Seda", "Melis", "Tuğba"];
  const MEN = ["Mehmet", "Mustafa", "Ahmet", "Ali", "Hüseyin", "Hasan", "İbrahim", "Osman", "Yusuf", "Murat", "Kemal", "Halil", "Burak", "Oğuz", "Serkan", "Volkan", "Onur", "Cem", "Eren", "Umut"];
  const OLD_W = ["Hayriye", "Şükriye", "Naciye", "Fadime", "Saniye", "Zübeyde", "Mukaddes"];
  const OLD_M = ["Rıza", "Necati", "Şükrü", "Cemal", "Nuri", "Hamdi", "Sabri"];
  const pickN = (a) => a[(r() * a.length) | 0];
  HS.KIN_REL = {
    anne: "Annen",
    baba: "Baban",
    kardesK: "Kız kardeşin",
    kardesE: "Erkek kardeşin",
    kuzen: "Kuzenin",
    abla: "Ablan",
    abi: "Abin",
    anneanne: "Anneannen",
    dede: "Deden",
    babaanne: "Babaannen",
    dayi: "Dayın",
    teyze: "Teyzen",
    amca: "Amcan",
    hala: "Halan",
    kayinvalide: "Kayınvaliden",
    kayinpeder: "Kayınpederin",
  };
  const GEN = { anneanne: 0, dede: 0, babaanne: 0, anne: 1, baba: 1, dayi: 1, teyze: 1, amca: 1, hala: 1, kayinvalide: 1, kayinpeder: 1, kardesK: 2, kardesE: 2, abla: 2, abi: 2, kuzen: 2 };
  HS.KIN_GEN = GEN;
  let uid = 0;
  // Aynı ailede iki kişiye aynı ad verilmesin (oyuncu dahil)
  const pickFree = (s, list) => {
    const used = new Set([s.first, ...(s.kin || []).map((k) => k.name), ...(s._kinTmp || [])]);
    const free = list.filter((n) => !used.has(n));
    const n = pickN(free.length ? free : list);
    (s._kinTmp = s._kinTmp || []).push(n);
    return n;
  };
  function mk(s, rel, gender, ageAt18, opt = {}) {
    const born = s.year - (s.age - 18) - ageAt18;
    const old = ageAt18 > 60;
    return {
      id: "k" + (++uid).toString(36) + ((r() * 1e6) | 0).toString(36),
      rel,
      gender,
      name: opt.name || pickFree(s, gender === "woman" ? (old ? OLD_W : W) : old ? OLD_M : MEN),
      born,
      alive: true,
      city: opt.city || s.birthCity,
      bond: opt.bond ?? 45 + ((r() * 35) | 0),
      skin: opt.skin ?? s.skin ?? 1,
      hairColor: opt.hairColor || (r() < 0.6 ? s.hairColor : pickN(Object.keys(HS.Art ? HS.Art.HAIR_COLORS : { kahve: 1 }))),
      seed: (r() * 1000) | 0,
      blood: opt.blood !== false,
    };
  }
  function init(s) {
    if (s.kin) return;
    const k = [];
    const momAge = 42 + ((r() * 10) | 0),
      dadAge = momAge + 2 + ((r() * 5) | 0);
    k.push(mk(s, "anne", "woman", momAge, { bond: 70 }));
    k.push(mk(s, "baba", "man", dadAge, { bond: 62, name: undefined }));
    const sib = r() < 0.1 ? 0 : r() < 0.55 ? 1 : r() < 0.85 ? 2 : 3;
    for (let i = 0; i < sib; i++) {
      const older = r() < 0.5;
      const g = r() < 0.5 ? "woman" : "man";
      const age = older ? 20 + ((r() * 8) | 0) : 10 + ((r() * 7) | 0);
      k.push(mk(s, older ? (g === "woman" ? "abla" : "abi") : g === "woman" ? "kardesK" : "kardesE", g, age, { bond: 55 + ((r() * 30) | 0) }));
    }
    if (r() < 0.7) k.push(mk(s, "anneanne", "woman", momAge + 24 + ((r() * 6) | 0), { bond: 70 }));
    if (r() < 0.45) k.push(mk(s, "dede", "man", momAge + 28 + ((r() * 6) | 0)));
    if (r() < 0.5) k.push(mk(s, "babaanne", "woman", dadAge + 25 + ((r() * 6) | 0)));
    k.push(mk(s, "dayi", "man", momAge - 3 + ((r() * 6) | 0), { bond: 45, city: r() < 0.6 ? s.birthCity : pickN(HS.HOME_CITIES) }));
    if (r() < 0.8) k.push(mk(s, "teyze", "woman", momAge - 4 + ((r() * 8) | 0), { bond: 55 }));
    if (r() < 0.7) k.push(mk(s, "amca", "man", dadAge - 4 + ((r() * 8) | 0), { bond: 40, city: r() < 0.5 ? s.birthCity : pickN(HS.HOME_CITIES) }));
    if (r() < 0.5) k.push(mk(s, "hala", "woman", dadAge - 4 + ((r() * 8) | 0), { bond: 45 }));
    // Anne ve baba aynı soyadı; anne ile babanın kökeni farklı il olabilir
    s.kin = k;
    delete s._kinTmp;
  }
  // Kuzenler: dayı, teyze, amca ve halanın çocukları (her birinden 0-2)
  function cousins(s) {
    if (!s.kin || s.flags.kuzenGen) return;
    s.flags.kuzenGen = 1;
    const parents = s.kin.filter((k) => ["dayi", "teyze", "amca", "hala"].includes(k.rel));
    for (const p of parents) {
      const n = r() < 0.25 ? 0 : r() < 0.7 ? 1 : 2;
      for (let i = 0; i < n; i++) {
        const g = r() < 0.5 ? "woman" : "man";
        const c = mk(s, "kuzen", g, 12 + ((r() * 16) | 0), { bond: 35 + ((r() * 35) | 0), city: p.city, skin: p.skin, hairColor: p.hairColor });
        c.parent = p.id;
        s.kin.push(c);
      }
    }
    delete s._kinTmp;
  }
  HS.HOOKS.newLife.push(init);
  HS.HOOKS.migrate.push(init);
  HS.HOOKS.newLife.push(cousins);
  HS.HOOKS.migrate.push(cousins);
  const age = (s, k) => s.year - k.born;
  HS.kinAge = age;
  HS.kinLabel = (k) => HS.KIN_REL[k.rel] || "Akraban";
  HS.kinDetail = (s, k) => {
    if (k.rel !== "kuzen") return HS.kinLabel(k);
    const p = s.kin.find((x) => x.id === k.parent);
    return p ? HS.ek(p.name, "gen") + " " + (k.gender === "woman" ? "kızı" : "oğlu") : "Kuzenin";
  };
  // Akrabanın görünüşü (karakter motoruna parametre)
  HS.kinLook = (s, k) => {
    const a = age(s, k);
    const h = k.seed;
    const W2 = ["long", "bun", "bob", "ponytail", "curly", "braid"],
      M2 = ["short", "sidepart", "curly", "short", "pompadour"];
    let hair = k.gender === "woman" ? W2[h % W2.length] : M2[h % M2.length];
    if (k.gender === "woman" && a >= 60) hair = h % 2 ? "bun" : "bob";
    const outfit = a >= 60 ? (k.gender === "woman" ? (h % 2 ? "hirka" : "emekli") : h % 2 ? "kaban" : "emekli") : a >= 40 ? (h % 3 ? "gomlek" : "hirka") : ["gunluk", "ceket", "kapusonlu", "esofman"][h % 4];
    return {
      gender: k.gender,
      skin: k.skin,
      hair,
      hairColor: k.hairColor,
      gray: clamp((a - 38 - (h % 9)) / 32, 0, 1),
      beard: k.gender === "man" && h % 3 === 0 && a >= 25,
      thin: k.gender === "man" && a >= 55 && h % 2 === 0,
      age: a,
      outfit: outfit === "elbise" && k.gender === "man" ? "gunluk" : outfit,
      mood: k.bond >= 55 ? 1 : k.bond < 30 ? -1 : 0,
      glasses: a >= 55,
      fat: clamp(0.25 + Math.max(0, a - 30) / 90 + ((h >> 3) % 4) / 12, 0, 0.85),
      mus: 0.2,
      eyeColor: h % 4,
      hs: a >= 75 ? 0.95 : 1,
    };
  };

  // ---- Yaşlanma, vefat, kayın aile ----
  HS.HOOKS.yearly.push((s) => {
    for (const k of s.kin) {
      if (!k.alive) continue;
      const a = age(s, k);
      const p = a < 45 ? 0.001 : 0.0006 * Math.exp(0.085 * (a - 30));
      if (r() < Math.min(0.45, p)) {
        k.alive = false;
        k.died = s.year;
        const close = ["anne", "baba", "kardesK", "kardesE", "abla", "abi"].includes(k.rel);
        s.mood = clamp(s.mood - (close ? 18 : 8), 0, 100);
        if (HS.addStress) HS.addStress(s, close ? 14 : 6);
        HS.note(s, HS.kinLabel(k) + " " + k.name + " " + a + " yaşında hayatını kaybetti.");
        s.scenes.push({ t: HS.kinLabel(k) + " " + k.name + "'ı kaybettin", p: a + " yaşındaydı. " + (k.bond >= 60 ? "Son yıllarda sık görüştüğünüz için içinde bir huzur var; ama yokluğu her yerde." : "Keşke daha sık arasaydım diye düşünüyorsun.") + " Cenaze " + k.city + "'da kalabalık oldu.", art: "✿", kind: "lose" });
        if (close) s.people += 2;
      }
    }
    // Uzak akrabalarla bağ zamanla gevşer
    s.kin.forEach((k) => (k.bond = clamp(k.bond - 1.5, 0, 100)));
  });
  HS.HOOKS.weekly.push((s) => {
    if (s.partner && s.partner.married && !s.kin.some((k) => k.rel === "kayinvalide")) {
      const pc = pickN(HS.HOME_CITIES);
      const sk = (s.seed + 1) % 4;
      s.kin.push(mk(s, "kayinvalide", "woman", 43 + ((r() * 10) | 0), { bond: 40, city: pc, skin: sk, blood: false }));
      s.kin.push(mk(s, "kayinpeder", "man", 47 + ((r() * 10) | 0), { bond: 35, city: pc, skin: sk, blood: false }));
    }
    if (s.guest && s.weeks > s.guest.until) s.guest = null;
  });

  // ---- Ziyaret ----
  HS.visitCost = (s, k) => (k.city === s.city ? Math.round(450 * s.idx.cpi) : HS.tripCost ? Math.round(HS.tripCost(s, k.city) * 0.55) : 5000);
  HS.CAN.visit = (s, id) => {
    const k = s.kin.find((x) => x.id === id);
    if (!k || !k.alive) return "Ziyaret edilemez.";
    if ((s.free || 0) < (k.city === s.city ? 1 : 2)) return k.city === s.city ? "Bu hafta boş zamanın kalmadı." : "Başka ile gitmek için 2 boş zaman gerekir.";
    if (s.flags.visited === s.weeks) return "Bu hafta zaten bir ziyaret yaptın.";
    const cost = HS.visitCost(s, k);
    return HS.fundsOf(s) < cost ? HS.short(s, cost) : true;
  };
  const VISIT_TEXT = {
    anne: ["Annen en sevdiğin yemeği yapmış; kapıdan girer girmez kokusu sardı.", "Annen yine \"zayıflamışsın\" dedi ve tabağını iki kez doldurdu."],
    baba: ["Babanla balkonda çay içip maç konuştunuz.", "Baban emekliliğindeki yeni hobisini gösterdi: domates fideleri."],
    anneanne: ["Anneannen seni görünce ağladı, sonra bir kavanoz reçel tutuşturdu.", "Anneannenin hikâyelerini yine dinledin; bu kez not aldın."],
    dede: ["Dedenle tavla oynadınız; yine yendi.", "Deden gençliğini anlattı; bazı yerleri her seferinde değişiyor."],
    babaanne: ["Babaannen el öptürdü, harçlık sıkıştırmaya çalıştı.", "Babaannen dualar etti, kapıya kadar uğurladı."],
  };
  HS.FX.visit = (s, id) => {
    const k = s.kin.find((x) => x.id === id);
    const cost = HS.visitCost(s, k);
    HS.book(s, (k.city === s.city ? "Ziyaret: " : k.city + " yolu: ") + HS.kinLabel(k).toLocaleLowerCase("tr-TR"), cost);
    s.free = Math.max(0, s.free - (k.city === s.city ? 1 : 2));
    s.flags.visited = s.weeks;
    k.bond = clamp(k.bond + 9, 0, 100);
    s.mood = clamp(s.mood + 3, 0, 100);
    if (HS.addStress) HS.addStress(s, -4);
    s.visitKin = { id: k.id, at: HS.slotKey(s) };
    s.view = "ziyaret";
    const lines = VISIT_TEXT[k.rel] || [k.name + " seni görünce çok sevindi; saatlerce sohbet ettiniz.", k.name + " ile eski fotoğraflara baktınız."];
    let extra = "";
    if (["anne", "baba", "anneanne", "babaanne", "dede"].includes(k.rel) && s.age < 30 && r() < 0.35) {
      const cash = Math.round(1000 * s.idx.cpi);
      s.cash += cash;
      extra = " Çıkarken cebine " + money(cash) + " sıkıştırdı.";
    }
    s.scenes.push({ t: HS.kinLabel(k) + " " + k.name, p: pickN(lines) + extra, art: "♡", kind: "win" });
  };
  HS.visitNow = (s) => {
    if (!s.visitKin || s.visitKin.at !== HS.slotKey(s)) return null;
    return s.kin.find((k) => k.id === s.visitKin.id) || null;
  };
  HS.CAN.callKin = (s, id) => (s.flags["call" + id] === s.weeks ? "Bu hafta zaten aradın." : true);
  HS.FX.callKin = (s, id) => {
    const k = s.kin.find((x) => x.id === id);
    k.bond = clamp(k.bond + 3, 0, 100);
    s.flags["call" + id] = s.weeks;
  };

  // ---- Misafir ----
  HS.guestNow = (s) => (s.guest && s.weeks <= s.guest.until ? s.kin.find((k) => k.id === s.guest.id) || null : null);
  HS.FX.guest = (s, id) => (s.guest = { id, until: s.weeks });
  const living = (s, rels) => s.kin.filter((k) => k.alive && (!rels || rels.includes(k.rel)));
  HS.EVENTS.push(
    {
      id: "guestVisit",
      weight: (s) => (s.housing !== "aile" && living(s).length ? 1.1 : 0),
      cooldown: 10,
      room: "salon",
      title: (s) => {
        const k = s.guestPick && s.kin.find((x) => x.id === s.guestPick);
        return k ? HS.kinLabel(k) + " geldi" : "Misafir";
      },
      text: (s) => {
        const k = s.kin.find((x) => x.id === s.guestPick);
        return k ? (k.city === s.city ? k.name + " haber vermeden kapıyı çaldı: \"Yakından geçiyordum, bir çayını içeyim dedim.\"" : k.name + ", " + k.city + "'dan birkaç günlüğüne sana geldi. Bavulu kapının önünde.") : "Kapı çaldı.";
      },
      choices: (s) => {
        const id = s.guestPick;
        return [
          c("Çay ve kurabiye ikram et", "₺250, bağ +", { cost: 250, kinBond: { id, v: 6 }, m: 2, stress: -1 }),
          c("Akşam yemeğine alıkoy", "Mutfakta şölen: ₺1.200", { cost: 1200, kinBond: { id, v: 12 }, m: 4, stress: 1 }),
          c("İşin olduğunu söyle, kısa tut", "Bağ −", { kinBond: { id, v: -6 }, stress: -1 }),
        ];
      },
    },
    {
      id: "momCall",
      weight: (s) => (living(s, ["anne"]).length ? 1.1 : 0),
      cooldown: 10,
      title: "Annen arıyor",
      text: (s) => HS.pick(["\"Yemek yiyor musun? Sesin yorgun geliyor.\"", "\"Komşunun kızı evleniyor, sen ne zaman?\"", "\"Bayramda geliyorsun değil mi? Herkes soruyor.\"", "\"Kapı komşusu çok iyi bir doktor biliyormuş, bir göster kendini.\""]),
      choices: (s) => {
        const m = living(s, ["anne"])[0];
        return [c("Uzun uzun konuş", "Bağ +, stres −", { kinBond: { id: m.id, v: 5 }, stress: -2, m: 1 }), c("\"Anne müsait değilim\" de", "Kısa ve gergin.", { kinBond: { id: m.id, v: -4 } })];
      },
    },
    {
      id: "siblingLoan",
      weight: (s) => (living(s, ["kardesK", "kardesE", "abla", "abi"]).length && s.cash > 20000 * s.idx.cpi ? 0.6 : 0),
      cooldown: 52,
      title: "Kardeşin borç istiyor",
      text: (s) => {
        const k = living(s, ["kardesK", "kardesE", "abla", "abi"])[0];
        return k.name + " sıkıştığını, ev kirasını ödeyemediğini söyledi. " + money(Math.round(25000 * s.idx.cpi)) + " istiyor; \"ay sonu öderim\" diyor.";
      },
      choices: (s) => {
        const k = living(s, ["kardesK", "kardesE", "abla", "abi"])[0];
        const amt = Math.round(25000 * s.idx.cpi);
        return [
          c("Ver", "Geri gelip gelmeyeceği belli değil.", { cash: -amt, raw: true, kinBond: { id: k.id, v: 12 }, chance: { p: 0.55, win: { cash: amt, raw: true }, lose: { m: -3 }, winT: "Sözünü tuttu", winP: k.name + " parayı bir ay sonra çiçekle birlikte getirdi.", loseT: "Ses yok", loseP: "Aylar geçti; konuyu açmak ikinizi de geriyor." } }),
          c("Yarısını ver", "", { cash: -Math.round(amt / 2), raw: true, kinBond: { id: k.id, v: 4 } }),
          c("Reddet", "Kırılabilir.", { kinBond: { id: k.id, v: -12 }, stress: 2 }),
        ];
      },
    },
    {
      id: "kinWedding",
      weight: (s) => (living(s, ["kardesK", "kardesE", "abla", "abi"]).some((k) => age(s, k) >= 24 && age(s, k) <= 34 && !k.married) ? 0.5 : 0),
      cooldown: 104,
      room: "sokak",
      title: "Kardeşin evleniyor",
      text: "Düğün davetiyesi geldi. Takı merasiminde ne takacağını herkes merak ediyor.",
      choices: (s) => {
        const k = living(s, ["kardesK", "kardesE", "abla", "abi"]).find((x) => age(s, x) >= 24 && !x.married);
        return [
          c("Bilezik tak", "Yaklaşık " + money(Math.round(52000 * s.idx.cpi)), { cost: 52000, kinBond: { id: k.id, v: 15 }, kinMarry: k.id, m: 5 }),
          c("Çeyrek altın tak", "Yaklaşık " + money(Math.round(12500 * s.idx.cpi)), { cost: 12500, kinBond: { id: k.id, v: 6 }, kinMarry: k.id, m: 3 }),
          c("Gidemeyeceğini söyle", "Ailede konuşulur.", { kinBond: { id: k.id, v: -15 }, kinMarry: k.id, m: -2 }),
        ];
      },
    },
  );
  const cousin = (s, f) => living(s, ["kuzen"]).filter(f || (() => true));
  HS.EVENTS.push(
    {
      id: "kuzenDugun",
      weight: (s) => (cousin(s, (k) => age(s, k) >= 23 && !k.married).length ? 0.5 : 0),
      cooldown: 52,
      room: "sokak",
      title: (s) => "Kuzenin " + (s.cuzPick ? s.kin.find((k) => k.id === s.cuzPick).name : "") + " evleniyor",
      text: "Düğün salonu tutulmuş, davetiyeler dağıtılmış. Bütün akrabalar orada olacak; kimin ne taktığı konuşulacak.",
      choices: (s) => {
        const k = s.kin.find((x) => x.id === s.cuzPick) || cousin(s)[0];
        return [
          c("Çeyrek altın tak, halaya katıl", "Yaklaşık " + money(Math.round(12500 * s.idx.cpi)), { cost: 12500, kinBond: { id: k.id, v: 10 }, kinMarry: k.id, people: 2, m: 4 }),
          c("Zarfa para koy", money(Math.round(3000 * s.idx.cpi)), { cost: 3000, kinBond: { id: k.id, v: 4 }, kinMarry: k.id, m: 2 }),
          c("İşim var de, gitme", "Akrabalar konuşur.", { kinBond: { id: k.id, v: -10 }, kinMarry: k.id, people: -1 }),
        ];
      },
    },
    {
      id: "kuzenIs",
      weight: (s) => (cousin(s, (k) => age(s, k) >= 25).length && s.job === "none" && !s.retired && s.age >= 20 ? 0.7 : 0),
      cooldown: 52,
      title: "Kuzeninden bir telefon",
      text: (s) => {
        const k = cousin(s, (x) => age(s, x) >= 25)[0];
        return k.name + " (" + HS.kinDetail(s, k) + ") arıyor: çalıştığı yerde eleman aranıyormuş, istersen seni önerebilirmiş.";
      },
      choices: (s) => {
        const k = cousin(s, (x) => age(s, x) >= 25)[0];
        return [
          c("Önersin", "Başvuru şansın artar", { apply: HS.pick(["office", "cafe", "factory"]), boost: 0.25, kinBond: { id: k.id, v: 6 }, useFree: 0 }),
          c("Teşekkür et, kendin bulacaksın", "", { kinBond: { id: k.id, v: 2 } }),
        ];
      },
    },
    {
      id: "kuzenBorc",
      weight: (s) => (cousin(s, (k) => age(s, k) >= 20).length && s.cash > 15000 * s.idx.cpi ? 0.4 : 0),
      cooldown: 104,
      title: "Kuzenin yardım istiyor",
      text: (s) => {
        const k = cousin(s, (x) => age(s, x) >= 20)[0];
        return k.name + " araba tamiri için " + money(Math.round(15000 * s.idx.cpi)) + " istiyor. \"Maaş yatınca veririm\" diyor.";
      },
      choices: (s) => {
        const k = cousin(s, (x) => age(s, x) >= 20)[0];
        const amt = Math.round(15000 * s.idx.cpi);
        return [
          c("Ver", "Geri gelmeyebilir.", { cash: -amt, raw: true, kinBond: { id: k.id, v: 10 }, chance: { p: 0.6, win: { cash: amt, raw: true }, lose: { m: -2 }, winT: "Geri ödedi", winP: k.name + " sözünü tuttu; üstüne bir kutu baklava getirdi.", loseT: "Unutuldu", loseP: "Bayramda karşılaştınız; ikiniz de konuyu açmadınız." } }),
          c("Kibarca reddet", "", { kinBond: { id: k.id, v: -8 } }),
        ];
      },
    },
    {
      id: "kuzenBulusma",
      weight: (s) => (cousin(s, (k) => Math.abs(age(s, k) - s.age) < 8 && k.city === s.city).length ? 0.6 : 0),
      cooldown: 26,
      room: "sokak",
      title: "Kuzenlerle buluşma",
      text: "Kuzen grubunda biri yazdı: \"Cumartesi kahvaltıya çıkalım mı? Çok oldu görüşmeyeli.\"",
      choices: (s) => {
        const list = cousin(s, (k) => Math.abs(age(s, k) - s.age) < 8 && k.city === s.city);
        return [
          c("Katıl", "₺650 · eski günler", { cost: 650, m: 4, stress: -3, people: 1, kinBondAll: list.map((k) => k.id) }),
          c("Bu sefer gelemem", "", {}),
        ];
      },
    },
  );
  HS.FX.kinBondAll = (s, ids) => ids.forEach((id) => HS.FX.kinBond(s, { id, v: 6 }));
  // Misafir olayı seçilirken kimin geleceği belirlenir
  HS.HOOKS.event.push((s, def) => {
    if (def.id === "kuzenDugun") {
      const k = cousin(s, (x) => age(s, x) >= 23 && !x.married)[0];
      s.cuzPick = k ? k.id : null;
    }
    if (def.id === "guestVisit") {
      const list = living(s).filter((k) => !["dede"].includes(k.rel) || k.city === s.city);
      const k = list.sort((a, b) => b.bond + r() * 40 - (a.bond + r() * 40))[0];
      s.guestPick = k ? k.id : null;
      if (k) s.guest = { id: k.id, until: s.weeks };
    }
  });
  HS.FX.kinBond = (s, v) => {
    const k = s.kin.find((x) => x.id === v.id);
    if (k) k.bond = clamp(k.bond + v.v, 0, 100);
  };
  HS.FX.kinMarry = (s, id) => {
    const k = s.kin.find((x) => x.id === id);
    if (k) k.married = s.year;
  };
  // Soy ağacı: kuşaklara göre
  HS.familyTree = (s) => {
    const g = [[], [], [], [], []];
    s.kin.forEach((k) => g[GEN[k.rel] ?? 1].push({ kin: k }));
    g[2].push({ me: true });
    if (s.partner) g[2].push({ partner: true });
    s.children.forEach((ch) => g[3].push({ child: ch }));
    if (s.flags.torun) g[4].push({ grand: true });
    return g;
  };
})(globalThis.HS || (globalThis.HS = {}));
