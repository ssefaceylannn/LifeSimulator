// Çevre: hikâyelerde geçen tanıdıkların kim olduğu, zamanla değişen çevre ve yeni arkadaşlıklar.
// - Metinde bir tanıdığın adı geçince ilk geçtiği yerde rolü de yazılır ("komşun Handan").
// - Taşınınca komşu, apartman yöneticisi ve bakkal; iş değişince iş arkadaşı ve yönetici değişir.
//   Eskiler "eski tanıdıklar" listesine geçer.
// - Yeni arkadaşlar edinilir (spor salonu, kurs, iş, mahalle, düğün, okul...); her arkadaşın
//   kendi hayatından haberler gelir (evlenir, taşınır, iş bulur...) ve aynı haber iki kez gelmez.
// - BEN › Çevre sekmesi herkesi rolü ve aranızdaki bağla gösterir.
(function (HS) {
  "use strict";
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const r = () => HS.rng();
  const c = (label, hint, fx = {}) => ({ label, hint, fx });
  const pickN = (a) => a[(r() * a.length) | 0];

  // Geniş ad havuzu (tanıdıklar için; akrabalar family.js'teki havuzu kullanır)
  HS.CIRCLE_NAMES = {
    w: ["Handan", "Gül", "Nermin", "Sevim", "Filiz", "Canan", "Yasemin", "Pınar", "Burcu", "Ezgi", "Damla", "Ceren", "Aslı", "Özge", "Tuba", "Şule", "Nazlı", "Ebru", "Gamze", "Dilek", "Hande", "İrem", "Sinem", "Neslihan", "Meltem", "Berna", "Didem", "Şeyma", "Rabia", "Kübra", "Duygu", "Ece", "Ilgın", "Asya", "Nil", "Beril", "Cansu", "Tülay", "Songül", "Aynur", "Feride", "Leyla", "Sevda", "Arzu", "Zerrin", "Begüm", "Öykü", "Su", "Esin", "Yeliz"],
    m: ["Kadir", "Levent", "Sinan", "Tarık", "Barış", "Erkan", "Gökhan", "Taner", "Ferhat", "Özgür", "Uğur", "Selim", "Cenk", "Koray", "Alper", "Berk", "Doğan", "Hakan", "Ercan", "Yiğit", "Batuhan", "Furkan", "Tayfun", "Ilgaz", "Mert", "Serdar", "Onur", "Tolga", "Emre", "Kerem", "Deniz", "Orhan", "Rıdvan", "Cihan", "Bülent", "Engin", "Kaan", "Arda", "Görkem", "Halil", "Metin", "Yavuz", "Recep", "Sefa", "Taha", "Utku", "Volkan", "Zafer", "Kutay", "Anıl"],
  };
  // Hikâye motorundaki tanıdık üretimi bu havuzu kullansın
  const prevCast = HS.cast;
  HS.cast = (s, role) => {
    s.cast = s.cast || {};
    if (s.cast[role]) return s.cast[role];
    const x = prevCast(s, role);
    const used = new Set([s.first, s.partner && s.partner.name, ...(s.kin || []).map((k) => k.name), ...Object.values(s.cast).filter((y) => y !== x).map((y) => y.name), ...(s.friends || []).map((f) => f.name), ...(s.circlePast || []).map((f) => f.name)]);
    const pool = HS.CIRCLE_NAMES[x.woman ? "w" : "m"].filter((n) => !used.has(n));
    if (pool.length) x.name = pickN(pool);
    return x;
  };
  HS.castName = (s, role) => HS.cast(s, role).name;

  // Metinde rol ön eki
  HS.ROLE_PREFIX = {
    komsu: "komşun",
    enYakin: "en yakın arkadaşın",
    isArk: "iş arkadaşın",
    yonetici: "yöneticin",
    liseArk: "liseden arkadaşın",
    bakkal: "bakkal",
    usta: "usta",
    yonetim: "apartman yöneticisi",
    doktor: "aile hekimin",
  };
  const STEM = { komsu: "komşu", enYakin: "arkadaş", isArk: "arkadaş", yonetici: "yönetici", liseArk: "lise", bakkal: "bakkal", usta: "usta", yonetim: "yönetici", doktor: "hekim" };
  const esc = (t) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const lower = (t) => t.toLocaleLowerCase("tr-TR");
  function annotate(text, s) {
    if (!text || typeof text !== "string") return text;
    try {
    const people = [];
    for (const [role, x] of Object.entries(s.cast || {})) people.push([x.name, HS.ROLE_PREFIX[role] || "tanıdığın", STEM[role] || ""]);
    for (const f of s.friends || []) people.push([f.name, "arkadaşın", "arkadaş"]);
    for (const [name, pre, stem] of people) {
      const re = new RegExp("(^|[^A-Za-zÇĞİÖŞÜçğıöşü])(" + esc(name) + ")(?![A-Za-zÇĞİÖŞÜçğıöşü])");
      const m = re.exec(text);
      if (!m) continue;
      const at = m.index + m[1].length;
      // Rol zaten yakınında yazıyorsa dokunma
      const near = lower(text.slice(Math.max(0, at - 28), at + name.length + 28));
      if (stem && near.includes(stem)) continue;
      if (near.includes(lower(pre))) continue;
      const start = at === 0 || /[.!?…"“]\s*$/.test(text.slice(0, at));
      const p = start ? pre.charAt(0).toLocaleUpperCase("tr-TR") + pre.slice(1) : pre;
      text = text.slice(0, at) + p + " " + text.slice(at);
    }
    } catch (e) {}
    return text;
  }
  HS.annotateNames = annotate;
  // ---- Çevre değişimi ----
  const homeKey = (s) => [s.city, s.housing, s.homeType || "", s.abroad ? 1 : 0].join("|");
  const workKey = (s) => [s.job, s.company || ""].join("|");
  function retire(s, roles, why) {
    s.circlePast = s.circlePast || [];
    for (const role of roles) {
      const x = s.cast && s.cast[role];
      if (!x) continue;
      s.circlePast.unshift({ name: x.name, role, rel: x.rel, why, until: s.weeks });
      // İyi anlaşılan eski tanıdık arkadaş listesine geçer
      if (x.rel >= 65 && (s.friends || []).length < 12) addFriend(s, { name: x.name, woman: x.woman, how: "eski " + (HS.ROLE_PREFIX[role] || "tanıdığın").replace(/n$/, ""), rel: x.rel - 10 });
      delete s.cast[role];
    }
    s.circlePast = s.circlePast.slice(0, 30);
  }
  function init(s) {
    s.friends = s.friends || [];
    s.circlePast = s.circlePast || [];
    s.circleKey = s.circleKey || { home: homeKey(s), work: workKey(s) };
  }
  HS.HOOKS.newLife.push(init);
  HS.HOOKS.migrate.push(init);
  HS.HOOKS.weekly.push((s) => {
    init(s);
    const h = homeKey(s),
      w = workKey(s);
    if (h !== s.circleKey.home) {
      const cityChanged = h.split("|")[0] !== s.circleKey.home.split("|")[0];
      retire(s, cityChanged ? ["komsu", "yonetim", "bakkal", "usta", "doktor"] : ["komsu", "yonetim", "bakkal"], "taşındın");
      s.circleKey.home = h;
    }
    if (w !== s.circleKey.work) {
      retire(s, ["isArk", "yonetici"], "işin değişti");
      s.circleKey.work = w;
    }
    // Yurt dışına giden en yakın arkadaşın yerini zamanla başka biri alabilir
    for (const f of s.friends) f.rel = clamp(f.rel - 0.15, 0, 100);
  });

  // ---- Arkadaşlar ----
  let fid = 0;
  function addFriend(s, o) {
    s.friends = s.friends || [];
    const woman = o.woman ?? r() < 0.5;
    const used = new Set([s.first, s.partner && s.partner.name, ...(s.kin || []).map((k) => k.name), ...Object.values(s.cast || {}).map((x) => x.name), ...s.friends.map((f) => f.name)]);
    const pool = HS.CIRCLE_NAMES[woman ? "w" : "m"].filter((n) => !used.has(n));
    const f = {
      id: "f" + (++fid).toString(36) + ((r() * 1e6) | 0).toString(36),
      name: o.name || pickN(pool.length ? pool : HS.CIRCLE_NAMES[woman ? "w" : "m"]),
      woman,
      how: o.how || "tanışma",
      job: o.job || pickN(["öğretmen", "hemşire", "yazılımcı", "garson", "muhasebeci", "mimar", "kuaför", "kargo şoförü", "grafik tasarımcı", "eczacı", "polis memuru", "esnaf", "öğrenci", "avukat", "aşçı", "fizyoterapist"]),
      age: o.age || s.age + Math.round((r() - 0.5) * 8),
      rel: o.rel ?? 45,
      met: s.weeks,
      news: [],
    };
    s.friends.push(f);
    return f;
  }
  HS.addFriend = addFriend;
  HS.FX.friendAdd = (s, o) => {
    const f = addFriend(s, typeof o === "object" ? o : { how: o });
    s.scenes.push({ t: "Yeni bir arkadaş", p: f.name + " artık çevrende (" + f.how + "). BEN › Çevre bölümünde görebilirsin.", art: "☺", kind: "win" });
  };
  HS.FX.friendRel = (s, v) => {
    const f = (s.friends || []).find((x) => x.id === v.id);
    if (f) f.rel = clamp(f.rel + v.n, 0, 100);
  };
  HS.FX.friendNews = (s, v) => {
    const f = (s.friends || []).find((x) => x.id === v.id);
    if (f && !f.news.includes(v.k)) f.news.push(v.k);
    if (f && v.gone) f.gone = v.gone;
  };
  HS.FX.friendBest = (s, id) => {
    const f = (s.friends || []).find((x) => x.id === id);
    if (!f) return;
    s.cast = s.cast || {};
    if (s.cast.enYakin) retire(s, ["enYakin"], "yollarınız ayrıldı");
    s.cast.enYakin = { role: "enYakin", name: f.name, woman: f.woman, born: s.year - f.age, rel: Math.max(70, f.rel), met: f.met };
    s.friends = s.friends.filter((x) => x !== f);
  };

  // Tanışma yerleri: koşul, metin
  const MEET = [
    ["spor salonunda", (s) => s.gym && s.gym.until > s.weeks, "Spor salonunda yan yana koşu bandında koşarken {n} su şişeni düşürdüğünü fark edip uzattı; laf lafı açtı."],
    ["kursta", (s) => (s.courses || []).length > 0, "Kursta yanına oturan {n} notlarını seninle paylaştı; teneffüste çay içtiniz."],
    ["işte", (s) => s.job !== "none" && !s.retired, "Başka departmandan {n} ile asansörde mahsur kaldınız; on beş dakikada bütün hayat hikâyesini öğrendin."],
    ["mahallede", (s) => !s.abroad, "Pazarda aynı domates tezgâhına uzanan {n} ile güldünüz; meğer aynı sokakta oturuyormuşsunuz."],
    ["bir düğünde", (s) => s.age >= 20, "Bir düğünde aynı masaya düştüğün {n} ile bütün gece halay çektiniz."],
    ["okulda", (s) => s.edu === "ogrenci", "Kantinde son poğaçayı paylaştığın {n} ile aynı derse girdiğinizi fark ettiniz."],
    ["parkta", (s) => s.children.length > 0, "Parkta çocuklar kaydıraktayken bankta yanına oturan {n} ile çocuk dertleşmesi yaptınız."],
    ["vapurda / otobüste", (s) => !s.abroad, "Her sabah aynı otobüste gördüğün {n} bugün yanına oturdu ve kitabını sordu."],
    ["gönüllü bir etkinlikte", (s) => s.people >= 4, "Sokak hayvanları için mama dağıtımında {n} ile aynı gruba düştünüz."],
    ["köpek parkında", (s) => !!s.flags.kedi || r() < 0.3, "Hayvan dostu bir kafede {n} kedin/köpeğin hakkında soru sordu; fotoğraf paylaştınız."],
    ["yurt dışında", (s) => !!s.abroad, "Türk marketinde {n} ile tanıştın; o da senin gibi gurbette."],
    ["emekliler lokalinde", (s) => s.retired, "Lokalde tavla masasında {n} sana rakip oldu; ertesi gün rövanş sözü aldınız."],
  ];
  HS.EVENTS.push({
    id: "newFriend",
    repeat: true, // her seferinde farklı yerde, farklı kişiyle
    cooldown: 20,
    weight: (s) => ((s.friends || []).length < 3 ? 1.2 : (s.friends || []).length < 8 ? 0.5 : 0.15),
    when: (s) => MEET.some((m) => m[1](s)),
    title: "Yeni biriyle tanıştın",
    text: (s) => {
      const m = s.meetNext || { how: "mahallede", text: MEET[3][2], name: "Deniz" };
      return m.text.replace("{n}", m.name) + " Numaralarınızı alacak mısınız?";
    },
    choices: (s) => [
      c("Numaralaşın, bir kahve sözü ver", "Çevre +, yeni arkadaş", { friendAdd: { name: s.meetNext && s.meetNext.name, woman: s.meetNext && s.meetNext.woman, how: (s.meetNext && s.meetNext.how) || "tanışma", rel: 50 }, people: 1, m: 2 }),
      c("Sohbet güzeldi, o kadar", "", { m: 1 }),
    ],
  });
  // Arkadaşın hayatından haberler (her arkadaş için her konu bir kez)
  const NEWS = [
    { k: "evlilik", when: (f) => f.age >= 23, t: (f) => f.name + " evleniyor!", p: (f) => f.name + " nişanlandığını müjdeledi ve seni düğüne çağırıyor.", ch: (f) => [c("Düğüne git, takı tak", "₺4.500", { cost: 4500, people: 1, m: 3, friendRel: { id: f.id, n: 10 } }), c("Gidemiyorum, mesajla kutla", "", { friendRel: { id: f.id, n: -4 } })] },
    { k: "is", t: (f) => f.name + " yeni bir iş buldu", p: (f) => f.name + " aylardır aradığı işe girdi ve kutlamaya çağırıyor.", ch: (f) => [c("Kutlamaya katıl", "₺900", { cost: 900, m: 3, friendRel: { id: f.id, n: 6 } }), c("Tebrik et, sonra görüşelim de", "", { friendRel: { id: f.id, n: 1 } })] },
    { k: "tasinma", t: (f) => f.name + " taşınıyor", p: (f) => f.name + " başka bir şehre taşınıyor ve eşyaları için yardım istiyor.", ch: (f) => [c("Bütün gün kolileri taşı", "Yorgunluk, bağ +", { h: -1, stress: 2, friendRel: { id: f.id, n: 12 }, friendNews: { id: f.id, k: "uzak", gone: "başka şehirde" } }), c("Veda yemeğine git", "₺1.200", { cost: 1200, m: 2, friendRel: { id: f.id, n: 5 }, friendNews: { id: f.id, k: "uzak", gone: "başka şehirde" } })] },
    { k: "ayrilik", when: (f) => f.age >= 20, t: (f) => f.name + " zor günler geçiriyor", p: (f) => f.name + " uzun ilişkisi bittiği için çok üzgün; gece yarısı arıyor.", ch: (f) => [c("Saatlerce dinle", "Uykusuzluk +, bağ ++", { sleep: 3, friendRel: { id: f.id, n: 12 }, m: -1 }), c("Yarın konuşalım de", "", { friendRel: { id: f.id, n: -6 } })] },
    { k: "bebek", when: (f) => f.age >= 25, t: (f) => f.name + " bebek bekliyor", p: (f) => f.name + " ultrason fotoğrafı gönderdi; baby shower yapılacak.", ch: (f) => [c("Hediye al, kutlamaya git", "₺1.800", { cost: 1800, m: 3, friendRel: { id: f.id, n: 8 } }), c("Tebrik mesajı at", "", { friendRel: { id: f.id, n: 1 } })] },
    { k: "borc", t: (f) => f.name + " senden borç istiyor", p: (f) => f.name + " kirasını ödeyemediğini, ay sonuna kadar ₺8.000 lazım olduğunu söylüyor.", ch: (f) => [c("Ver", "Geri gelir mi?", { cost: 8000, chance: { p: 0.7, win: { cash: 8000, friendRel: { id: f.id, n: 10 } }, lose: { friendRel: { id: f.id, n: -10 }, m: -4 }, winT: "Parayı geri verdi", winP: f.name + " ayın sonunda parayı bir kutu baklavayla getirdi.", loseT: "Para gelmedi", loseP: f.name + " mesajlarına geç cevap vermeye başladı." } }), c("Nazikçe reddet", "", { friendRel: { id: f.id, n: -5 } })] },
    { k: "dogumgunu", t: (f) => f.name + " doğum günü", p: (f) => f.name + " evinde küçük bir doğum günü yapıyor.", ch: (f) => [c("Pasta alıp git", "₺700", { cost: 700, m: 3, people: 0.5, friendRel: { id: f.id, n: 6 } }), c("Kartla kutla", "", { friendRel: { id: f.id, n: 1 } })] },
    { k: "tatil", t: (f) => f.name + " ortak tatil öneriyor", p: (f) => f.name + " hafta sonu için Kapadokya'da ucuz bir pansiyon bulmuş, birlikte gidelim diyor.", ch: (f) => [c("Git", "₺6.500 · stres −−", { cost: 6500, stress: -8, m: 5, friendRel: { id: f.id, n: 10 } }), c("Bütçem yok", "", { friendRel: { id: f.id, n: -2 } })] },
    { k: "kavga", when: (f, s) => f.rel < 45, t: (f) => f.name + " ile aranız bozuk", p: (f) => f.name + " bir süredir mesajlarına soğuk cevap veriyor. Bir yanlış anlaşılma var gibi.", ch: (f) => [c("Arayıp açık açık konuş", "Bağ +", { friendRel: { id: f.id, n: 15 }, stress: 1 }), c("Bırak, zamanla geçer", "Uzaklaşırsınız.", { friendRel: { id: f.id, n: -10 } })] },
    { k: "enyakin", when: (f, s) => f.rel >= 75 && (!s.cast || !s.cast.enYakin || s.flags.enYakinGurbet), t: (f) => f.name + " ile kardeş gibisiniz", p: (f) => f.name + " ile artık her şeyi konuşuyorsunuz; en zor gününde ilk aradığın kişi o.", ch: (f) => [c(f.name + " artık en yakın arkadaşım", "Hikâyelerde en yakın arkadaşın olur", { friendBest: f.id, m: 4 }), c("Böyle iyi", "", { m: 1 })] },
  ];
  HS.EVENTS.push({
    id: "friendNews",
    repeat: true,
    cooldown: 6,
    weight: (s) => Math.min(1.4, (s.friends || []).filter((f) => !f.gone).length * 0.35),
    when: (s) => !!pickNews(s, true),
    title: (s) => {
      const x = cur(s);
      return x ? x.n.t(x.f) : "Arkadaşından haber";
    },
    text: (s) => {
      const x = cur(s);
      return x ? x.n.p(x.f) + " (" + x.f.how + " tanıştığın, " + x.f.job + ")" : "";
    },
    choices: (s) => {
      const x = cur(s);
      if (!x) return [c("Tamam", "", {})];
      return x.n.ch(x.f).map((ch) => ({ ...ch, fx: { ...ch.fx, friendNews: { id: x.f.id, k: x.n.k, ...(ch.fx.friendNews || {}) } } }));
    },
  });
  // Olay seçilince (seçenekler hazırlanmadan önce) kişi ve konu belirlenir
  HS.HOOKS.event.push((s, def) => {
    if (def.id === "friendNews") {
      const x = pickNews(s);
      s.newsNow = x && { id: x.f.id, k: x.n.k };
    }
    if (def.id === "newFriend") {
      const avail = MEET.filter((m) => m[1](s));
      const fresh = avail.filter((m) => !(s.meetUsed || []).includes(m[0]));
      const m = pickN(fresh.length ? fresh : avail.length ? avail : [MEET[3]]);
      const woman = r() < 0.5;
      const used = new Set([s.first, s.partner && s.partner.name, ...(s.friends || []).map((f) => f.name), ...Object.values(s.cast || {}).map((x) => x.name), ...(s.kin || []).map((k) => k.name)]);
      const pool = HS.CIRCLE_NAMES[woman ? "w" : "m"].filter((n) => !used.has(n));
      s.meetNext = { name: pickN(pool.length ? pool : HS.CIRCLE_NAMES[woman ? "w" : "m"]), woman, how: m[0], text: m[2] };
      s.meetUsed = (s.meetUsed || []).concat(m[0]).slice(-8);
    }
  });
  const cur = (s) => {
    if (!s.newsNow) return null;
    const f = (s.friends || []).find((y) => y.id === s.newsNow.id);
    const n = NEWS.find((y) => y.k === s.newsNow.k);
    return f && n ? { f, n } : null;
  };
  function pickNews(s, test) {
    const opts = [];
    for (const f of s.friends || []) {
      if (f.gone && f.news.includes("uzak")) continue;
      for (const n of NEWS) if (!f.news.includes(n.k) && (!n.when || n.when(f, s)) && s.weeks - f.met >= 4) opts.push({ f, n });
    }
    if (test) return opts.length > 0;
    return opts.length ? opts[(r() * opts.length) | 0] : null;
  }
})(globalThis.HS || (globalThis.HS = {}));
