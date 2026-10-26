// Staj: gerçek hayattaki gibi yalnızca üniversite öğrencileri (en az 1. yılını bitirmiş) yaz
// stajına başvurabilir. Bahar döneminde başvuru, yazın 6-8 haftalık staj, sonunda değerlendirme.
// İyi geçen staj, mezuniyette o şirketten doğrudan iş teklifi olarak geri döner.
(function (HS) {
  "use strict";
  const c = (label, hint, fx = {}) => ({ label, hint, fx });
  const FIELD_JOB = { office: "office", nurse: "nurse", teacher: "teacher", cafe: "office", memur: "office" };
  const jobOf = (s) => FIELD_JOB[(s.major && s.major.field) || "office"] || "office";
  // Bölüme uygun şirketler: biri seçici (iyi), biri ulaşılabilir
  const options = (s) => {
    const job = jobOf(s);
    const list = HS.COMPANIES.filter((x) => x.jobs.includes(job) && x.cities);
    const near = list.filter((x) => HS.coIn(x, s.city));
    const top = (near.length ? near : list).slice().sort((a, b) => b.stars - a.stars)[0];
    const mid = (near.length ? near : list).slice().sort((a, b) => a.stars - b.stars).find((x) => x !== top) || top;
    return { job, top, mid };
  };
  const odds = (s, x) => {
    const en = HS.Skills.get(s, "ingilizce");
    const p = 0.25 + s.skill / 160 + en / 220 + s.people / 300 - (x.stars - 3) * 0.12;
    return Math.max(0.12, Math.min(0.85, p));
  };

  HS.FX.internOffer = (s, id) => (s.internOffer = id);
  HS.FX.internJoin = (s) => {
    const x = HS.co(s.internOffer);
    if (!x) return;
    const job = jobOf(s);
    if (!HS.coIn(x, s.city)) HS.apply(s, { moveCity: x.cities[0], keepJob: true, relocationPaid: true, noTheme: true });
    HS.apply(s, { job, level: 1, noTheme: true });
    s.company = x.id;
    s.payAdj = 1;
    s.perf = 62;
    s.internOffer = null;
    HS.note(s, x.name + " şirketinde, staj yaptığı yerde " + HS.Skills.title(s) + " olarak işe başladı.");
  };

  HS.story("staj", {
    weight: 1.4,
    when: (s) => s.edu === "ogrenci" && s.eduWeeks >= 40 && s.week >= 8 && s.week <= 20 && !s.abroad,
    room: "yatak",
    title: "Yaz stajı başvuruları",
    text: (s) => {
      const o = options(s);
      return (s.major ? s.major.name + " bölümünde" : "Okulda") + " staj zorunlu ve kariyer merkezi ilanları açtı. " + o.top.name + " (" + o.top.stars.toFixed(1) + "★) çok seçici; " + o.mid.name + " daha ulaşılabilir. Staj yazın 8 hafta sürecek.";
    },
    choices: (s) => {
      const o = options(s);
      const pt = odds(s, o.top),
        pm = Math.min(0.92, odds(s, o.mid) + 0.25);
      return [
        c(HS.ek(o.top.name, "dat") + " başvur", "Şans %" + Math.round(pt * 100) + " · İngilizce ve beceri önemli", {
          sk: { iletisim: 1 },
          chance: { p: pt, win: { set: { co: o.top.id, top: 1 }, go: "basla", m: 6, esteem: 4 }, lose: { set: { co: o.mid.id }, go: "yedek", m: -3 }, winT: "Kabul aldın!", winP: o.top.name + " seni bu yaz stajyer olarak bekliyor.", loseT: "Olumsuz döndüler", loseP: "Bu yıl " + o.top.name + " çok başvuru almış. Bir yedek planın var mı?" },
        }),
        c(HS.ek(o.mid.name, "dat") + " başvur", "Şans %" + Math.round(pm * 100), {
          chance: { p: pm, win: { set: { co: o.mid.id }, go: "basla", m: 3 }, lose: { end: "yok", m: -3 }, winT: "Staj yerin belli", winP: o.mid.name + " seni yaz stajına kabul etti.", loseT: "Kontenjan doldu", loseP: "Stajını bu yıl okulun laboratuvarında / bir tanıdığın yanında tamamlayacaksın." },
        }),
        c("Bu yaz staj yapma, yarı zamanlı çalış", "Para kazanırsın, deneyim azalır", { end: "atla", m: 1 }),
      ];
    },
    steps: {
      yedek: {
        gap: 1,
        title: "Yedek plan",
        text: (s, h) => "Seçici şirket olmadı ama " + HS.co(h.d.co).name + " hâlâ başvuru alıyor.",
        choices: (s, h) => [
          c(HS.ek(HS.co(h.d.co).name, "dat") + " başvur", "Şans yüksek", { chance: { p: 0.75, win: { go: "basla", m: 2 }, lose: { end: "yok", m: -2 }, winT: "Kabul", winP: "Yazın stajın belli oldu.", loseT: "Olmadı", loseP: "Bu yaz stajsız geçecek." } }),
          c("Vazgeç", "", { end: "atla" }),
        ],
      },
      basla: {
        gap: 4,
        when: (s) => s.week >= 25 && s.week <= 34,
        room: "is",
        title: (s, h) => "Stajın başladı: " + HS.co(h.d.co).name,
        text: (s, h) => "Yaka kartın, Wi-Fi şifren ve bir masa. Mentorun " + HS.castName(s, "isArk") + " seni ekibe tanıttı. Sekiz hafta boyunca nasıl çalışacaksın?",
        choices: [
          c("Her işe talip ol, geç saate kal", "Beceri ++, yorgunluk", { set: { score: 3 }, go: "son", sk: { iletisim: 3, bilgisayar: 3, tablolama: 2 }, sleep: 4, stress: 6, rel: { isArk: 6 } }),
          c("Dengeli çalış, sorular sor", "Beceri +", { set: { score: 2 }, go: "son", sk: { iletisim: 2, bilgisayar: 2 }, stress: 2, rel: { isArk: 3 } }),
          c("İmzanı attır, gerisini boş ver", "Rahat bir yaz", { set: { score: 0 }, go: "son", m: 3, rel: { isArk: -4 } }),
        ],
      },
      son: {
        gap: 6,
        room: "is",
        title: "Stajın son günü",
        text: (s, h) => HS.castName(s, "isArk") + " staj değerlendirme formunu dolduruyor. " + (h.d.score >= 2 ? "Ekip senden memnun görünüyor." : "Masanda pek görünmediğini herkes fark etti."),
        choices: (s, h) => {
          const x = HS.co(h.d.co);
          const p = h.d.score >= 3 ? 0.8 : h.d.score >= 2 ? 0.5 : 0.08;
          return [
            c("Mezuniyette kadro olup olmadığını sor", "Şans %" + Math.round(p * 100), {
              chance: { p, win: { internOffer: x.id, end: "teklif", m: 6, esteem: 5 }, lose: { end: "bitti", m: -1 }, winT: "Kapı açık", winP: x.name + ": \"Mezun olunca bize gel, sana bir masa ayıralım.\" Teklif mezuniyete kadar geçerli.", loseT: "Şimdilik kadro yok", loseP: "Referans mektubu verdiler; CV'nde güzel duracak." },
            }),
            c("Teşekkür et, referans mektubu iste", "CV +", { end: "bitti", people: 1, sk: { iletisim: 1 } }),
          ];
        },
      },
    },
  });

  // Mezuniyette staj teklifi
  HS.EVENTS.push({
    id: "internJob",
    priority: 70,
    once: true,
    when: (s) => s.edu === "universite" && s.internOffer && HS.co(s.internOffer),
    title: "Staj yaptığın şirketten telefon",
    text: (s) => HS.co(s.internOffer).name + " mezuniyetini tebrik etti: \"Söz verdiğimiz kadro hazır. Uzman yardımcısı olarak başlayabilirsin.\" Mülakat yok; staj notun yeterli.",
    choices: (s) => [
      c("Kabul et", s.job !== "none" ? "Mevcut işinden ayrılırsın." : "Aylık net ~" + HS.money(HS.JOBS[jobOf(s)].pay * s.idx.cpi * HS.co(s.internOffer).mult), { internJoin: 1, m: 8 }),
      c("Teşekkür et, başka yerlere bakacağım", "Teklif kapanır", { internOffer: null, m: -1 }),
    ],
  });
})(globalThis.HS || (globalThis.HS = {}));
