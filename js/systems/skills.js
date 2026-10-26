// Beceriler ve meslek basamakları.
// - Genel ve dil becerileri her zaman görünür.
// - Mesleğe özel beceriler yalnızca o meslekte çalışınca (ya da bir kursa yazılınca) açılır.
// - Her mesleğin 5 basamağı var; oyuncu yalnızca bulunduğu ve bir sonraki basamağın
//   şartlarını görür, daha ilerisi "???" olarak gizlidir.
(function (HS) {
  "use strict";
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // cat: genel | dil | meslek id'si
  HS.SKILLS = {
    iletisim: { name: "İletişim", cat: "genel", icon: "speech-balloon" },
    disiplin: { name: "Disiplin", cat: "genel", icon: "stopwatch" },
    finans: { name: "Finans okuryazarlığı", cat: "genel", icon: "coin" },
    bilgisayar: { name: "Bilgisayar", cat: "genel", icon: "laptop" },
    ilkyardim: { name: "İlk yardım", cat: "genel", icon: "health-worker" },
    ingilizce: { name: "İngilizce", cat: "dil", icon: "globe-showing-europe-africa" },
    almanca: { name: "Almanca", cat: "dil", icon: "globe-showing-europe-africa" },
    fransizca: { name: "Fransızca", cat: "dil", icon: "globe-showing-europe-africa" },
    barista: { name: "Kahve hazırlama", cat: "cafe", icon: "hot-beverage" },
    servis: { name: "Müşteri hizmeti", cat: "cafe", icon: "cook" },
    isletme: { name: "Mağaza yönetimi", cat: "cafe", icon: "clipboard" },
    makine: { name: "Makine kullanımı", cat: "factory", icon: "gear" },
    isguvenligi: { name: "İş güvenliği", cat: "factory", icon: "warning" },
    kalite: { name: "Kalite kontrol", cat: "factory", icon: "bullseye" },
    enstruman: { name: "Enstrüman", cat: "music", icon: "guitar" },
    sahne: { name: "Sahne performansı", cat: "music", icon: "microphone" },
    beste: { name: "Beste", cat: "music", icon: "musical-note" },
    produksiyon: { name: "Prodüksiyon", cat: "music", icon: "speaker-high-volume" },
    tablolama: { name: "Tablolama ve raporlama", cat: "office", icon: "bar-chart" },
    sunum: { name: "Sunum", cat: "office", icon: "page-facing-up" },
    proje: { name: "Proje yönetimi", cat: "office", icon: "calendar" },
    liderlik: { name: "Liderlik", cat: "office", icon: "1st-place-medal" },
    muzakere: { name: "Müzakere", cat: "office", icon: "handshake" },
    pedagoji: { name: "Pedagoji", cat: "teacher", icon: "teacher" },
    alan: { name: "Alan bilgisi", cat: "teacher", icon: "books" },
    sinif: { name: "Sınıf yönetimi", cat: "teacher", icon: "school" },
    klinik: { name: "Klinik beceri", cat: "nurse", icon: "stethoscope" },
    hasta: { name: "Hasta iletişimi", cat: "nurse", icon: "speech-balloon" },
    acil: { name: "Acil müdahale", cat: "nurse", icon: "hospital" },
    muhasebe: { name: "Muhasebe", cat: "business", icon: "money-bag" },
    pazarlama: { name: "Pazarlama", cat: "business", icon: "chart-increasing" },
    tedarik: { name: "Tedarik ve stok", cat: "business", icon: "delivery-truck" },
    mevzuat: { name: "Mevzuat", cat: "memur", icon: "scroll" },
    yazisma: { name: "Resmî yazışma", cat: "memur", icon: "envelope" },
    sokak: { name: "Sokak bilgisi", cat: "crime", icon: "warning" },
  };

  // Meslek basamakları: unvan, maaş çarpanı ve bir üst basamağa geçiş şartları
  const L = (title, mult, req = {}, weeks = 0) => ({ title, mult, req, weeks });
  HS.LADDERS = {
    office: [L("Stajyer", 0.75), L("Uzman yardımcısı", 1, { tablolama: 12, bilgisayar: 15 }, 26), L("Uzman", 1.35, { tablolama: 28, sunum: 22, iletisim: 25 }, 104), L("Kıdemli uzman", 1.8, { proje: 40, sunum: 40, ingilizce: 35 }, 156), L("Müdür", 2.6, { liderlik: 55, muzakere: 45, proje: 55 }, 208)],
    cafe: [L("Komi", 0.95), L("Barista", 1.05, { barista: 15 }, 12), L("Kıdemli barista", 1.2, { barista: 35, servis: 25 }, 52), L("Vardiya sorumlusu", 1.45, { servis: 40, iletisim: 35, disiplin: 30 }, 104), L("Mağaza müdürü", 1.9, { isletme: 45, finans: 30, iletisim: 45 }, 156)],
    factory: [L("Çırak", 0.9), L("Operatör", 1, { makine: 15 }, 12), L("Usta", 1.25, { makine: 35, isguvenligi: 25 }, 104), L("Formen", 1.55, { kalite: 40, disiplin: 40, iletisim: 30 }, 156), L("Üretim şefi", 2.1, { liderlik: 40, kalite: 55, bilgisayar: 30 }, 208)],
    music: [L("Sokak müzisyeni", 0.6), L("Bar müzisyeni", 1, { enstruman: 18 }, 12), L("Sahne sanatçısı", 1.6, { enstruman: 35, sahne: 30 }, 52), L("Tanınan sanatçı", 2.8, { beste: 40, sahne: 50, produksiyon: 25 }, 104), L("Yıldız", 5, { beste: 60, sahne: 65, iletisim: 45 }, 156)],
    teacher: [L("Sözleşmeli öğretmen", 0.9), L("Öğretmen", 1, { pedagoji: 15, alan: 20 }, 52), L("Uzman öğretmen", 1.2, { pedagoji: 35, sinif: 30 }, 208), L("Başöğretmen", 1.4, { alan: 50, sinif: 45, iletisim: 40 }, 312), L("Müdür yardımcısı", 1.6, { liderlik: 40, mevzuat: 30, iletisim: 50 }, 364)],
    nurse: [L("Stajyer hemşire", 0.85), L("Hemşire", 1, { klinik: 15, ilkyardim: 20 }, 26), L("Uzman hemşire", 1.25, { klinik: 35, hasta: 30 }, 156), L("Sorumlu hemşire", 1.5, { acil: 40, liderlik: 30, disiplin: 40 }, 208), L("Başhemşire", 1.85, { liderlik: 50, klinik: 60, mevzuat: 25 }, 312)],
    business: [L("Seyyar satıcı", 0.7), L("Dükkân sahibi", 1, { muhasebe: 10 }, 0), L("İki şubeli esnaf", 1.6, { muhasebe: 30, pazarlama: 25 }, 104), L("Yerel zincir", 2.6, { tedarik: 40, pazarlama: 45, finans: 35 }, 156), L("Bilinen marka", 4, { liderlik: 50, pazarlama: 60, muzakere: 45 }, 260)],
    memur: [L("Memur", 1), L("Şef", 1.2, { mevzuat: 25, yazisma: 25 }, 104), L("Müdür yardımcısı", 1.45, { mevzuat: 40, iletisim: 30 }, 208), L("Müdür", 1.75, { liderlik: 40, mevzuat: 55 }, 312), L("Daire başkanı", 2.2, { liderlik: 55, muzakere: 40 }, 416)],
    crime: [L("Ayakçı", 1), L("Aracı", 1.4, { sokak: 25 }, 26), L("Sorumlu", 2, { sokak: 45, muzakere: 25 }, 104), L("Patron yardımcısı", 3, { sokak: 65 }, 208), L("Patron", 4.5, { sokak: 80, liderlik: 40 }, 312)],
  };
  // Her meslekte haftalık pratikle gelişen beceriler
  const PRACTICE = {
    office: ["tablolama", "bilgisayar", "sunum", "iletisim"],
    cafe: ["barista", "servis", "iletisim"],
    factory: ["makine", "isguvenligi", "disiplin"],
    music: ["enstruman", "sahne"],
    teacher: ["pedagoji", "alan", "sinif", "iletisim"],
    nurse: ["klinik", "hasta", "ilkyardim"],
    business: ["muhasebe", "pazarlama", "finans"],
    memur: ["mevzuat", "yazisma"],
    crime: ["sokak"],
  };
  // Kurslar: birkaç hafta boyunca her hafta bir boş zaman harcar.
  HS.COURSES = [
    { id: "ing", name: "İngilizce kursu", skill: "ingilizce", weeks: 12, gain: 2.2, cost: 4500 },
    { id: "alm", name: "Almanca kursu", skill: "almanca", weeks: 12, gain: 2.2, cost: 4800 },
    { id: "fra", name: "Fransızca kursu", skill: "fransizca", weeks: 12, gain: 2.2, cost: 4500 },
    { id: "excel", name: "Tablolama sertifikası", skill: "tablolama", weeks: 6, gain: 3, cost: 3500 },
    { id: "bilg", name: "Bilgisayar kursu", skill: "bilgisayar", weeks: 6, gain: 3, cost: 2500 },
    { id: "barista", name: "Barista eğitimi", skill: "barista", weeks: 4, gain: 4, cost: 3000 },
    { id: "muzik", name: "Enstrüman dersi", skill: "enstruman", weeks: 10, gain: 2.5, cost: 3000 },
    { id: "muhasebe", name: "Ön muhasebe kursu", skill: "muhasebe", weeks: 8, gain: 3, cost: 3500 },
    { id: "liderlik", name: "Liderlik eğitimi", skill: "liderlik", weeks: 6, gain: 3, cost: 9000 },
    { id: "ilkyardim", name: "İlk yardım sertifikası", skill: "ilkyardim", weeks: 3, gain: 6, cost: 2000 },
    { id: "pazarlama", name: "Dijital pazarlama", skill: "pazarlama", weeks: 8, gain: 3, cost: 6000 },
  ];

  const sk = (s, id) => (s.sk && s.sk[id]) || 0;
  function add(s, id, v) {
    if (!HS.SKILLS[id]) return;
    s.sk = s.sk || {};
    const cur = s.sk[id] || 0;
    // Yükseldikçe öğrenmek yavaşlar
    const k = v > 0 ? clamp(1.15 - cur / 110, 0.15, 1.15) : 1;
    s.sk[id] = clamp(cur + v * k, 0, 100);
    // Bir mesleğin becerisine dokunulduysa o kategori görünür olur
    const cat = HS.SKILLS[id].cat;
    if (cat !== "genel" && cat !== "dil") (s.skSeen = s.skSeen || {})[cat] = true;
  }
  function ladder(s, job = s.job) {
    return HS.LADDERS[job] || null;
  }
  function missing(s, job = s.job, level = (s.jobLevel || 0) + 1) {
    const lad = ladder(s, job);
    if (!lad || !lad[level]) return null;
    const step = lad[level];
    const miss = Object.entries(step.req).filter(([k, v]) => sk(s, k) < v);
    const weeksLeft = Math.max(0, step.weeks - (s.jobWeeks || 0));
    return { step, miss, weeksLeft, ok: !miss.length && !weeksLeft };
  }
  function title(s, job = s.job, level = s.jobLevel || 0) {
    const lad = ladder(s, job);
    return lad ? lad[Math.min(level, lad.length - 1)].title : HS.JOBS[job]?.name;
  }
  HS.Skills = { get: sk, add, ladder, missing, title, PRACTICE };

  // Eski kayıtlar ve yeni hayatlar
  function init(s) {
    if (!s.sk) {
      s.sk = { iletisim: 8, disiplin: 6, bilgisayar: 10, ingilizce: 12 };
      // Eski kayıtta toplam beceri varsa bir kısmını mesleğe dağıt
      if (s.skill > 0 && s.job && PRACTICE[s.job]) PRACTICE[s.job].forEach((k) => add(s, k, Math.min(40, s.skill / 2)));
      if (s.edu === "universite") add(s, "ingilizce", 15);
    }
    s.skSeen = s.skSeen || {};
    s.courses = s.courses || [];
    if (s.job && s.job !== "none") s.skSeen[s.job] = true;
  }
  HS.HOOKS.newLife.push(init);
  HS.HOOKS.migrate.push(init);

  // Etki anahtarları
  // sk: {beceri: miktar}
  HS.FX.sk = (s, v) => Object.entries(v).forEach(([k, n]) => add(s, k, n));
  // course: kurs id → kayıt
  HS.CAN.course = (s, id) => {
    const c = HS.COURSES.find((x) => x.id === id);
    if (!c) return "Kurs bulunamadı.";
    if (s.courses.some((x) => x.id === id)) return "Bu kursa zaten devam ediyorsun.";
    if (s.courses.length >= 2) return "Aynı anda en fazla 2 kurs.";
    if (HS.fundsOf(s) < c.cost * s.idx.cpi) return HS.short(s, c.cost * s.idx.cpi);
    return true;
  };
  HS.FX.course = (s, id) => {
    const c = HS.COURSES.find((x) => x.id === id);
    HS.book(s, c.name, c.cost * s.idx.cpi);
    s.courses.push({ id, left: c.weeks });
    s.skSeen[HS.SKILLS[c.skill].cat] = true;
  };
  HS.FX.dropCourse = (s, id) => (s.courses = s.courses.filter((x) => x.id !== id));

  // Haftalık: işte pratik ve kurslar
  HS.HOOKS.weekly.push((s) => {
    const p = PRACTICE[s.job];
    if (p) {
      s.skSeen[s.job] = true;
      p.forEach((k) => add(s, k, 0.22));
      if (s.jobLevel >= 2 && s.job !== "crime") add(s, "liderlik", 0.08);
    }
    if (s.edu === "ogrenci") ["ingilizce", "bilgisayar", "disiplin"].forEach((k) => add(s, k, 0.12));
    s.courses.forEach((c) => {
      const def = HS.COURSES.find((x) => x.id === c.id);
      if (s.free > 0) {
        s.free--; // kurs bir boş zaman harcar
        add(s, def.skill, def.gain);
      }
      c.left--;
      if (c.left <= 0) {
        HS.note(s, def.name + " tamamlandı.");
        s.scenes.push({ t: "Sertifika!", p: def.name + " bitti. " + HS.SKILLS[def.skill].name + " becerin " + Math.round(sk(s, def.skill)) + " oldu.", art: "✓", kind: "win" });
      }
    });
    s.courses = s.courses.filter((c) => c.left > 0);
  });

  // Etkinlik: tek başına çalışma (beceri seçilir)
  HS.ACTIVITIES.push({
    id: "calis",
    label: "Kendi kendine çalış",
    art: "brain",
    hint: "Seçtiğin beceri +",
    pick: "skill",
    fx: (s, h, param) => ({ sk: { [param || "iletisim"]: 2.2 } }),
    done: (s, h, param) => (HS.SKILLS[param] ? HS.SKILLS[param].name + " çalıştın." : "Çalıştın."),
  });

  // Görünür beceriler: genel + dil + açılmış meslekler
  HS.Skills.visible = (s) =>
    Object.entries(HS.SKILLS)
      .filter(([k, d]) => d.cat === "genel" || d.cat === "dil" || s.skSeen[d.cat])
      .map(([k]) => k);
})(globalThis.HS || (globalThis.HS = {}));
