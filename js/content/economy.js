// Ekonomi ve meslek verisi.
// 2026 değerleri gerçek kaynaklara dayanır (bkz. ECONOMY.md). 2027 ve sonrası
// tamamen kurmaca senaryodur; gerçek tahmin iddiası yoktur.
(function (HS) {
  "use strict";

  const MIN_WAGE = 28075.5; // 2026 net asgari ücret (aylık)

  HS.ECONOMY = {
    startYear: 2026,
    startCash: 10000,
    // TÜİK Eylül 2026 yıllık TÜFE: genel ve kategori bazlı
    rates2026: {
      cpi: 0.2973,
      food: 0.2762,
      transport: 0.351,
      housing: 0.3999,
    },
    minWage: MIN_WAGE,
    policyRate: 0.36, // TCMB, 22 Ekim 2026
    depositRate: 0.373, // 1-3 ay TL mevduat ortalaması (Eylül 2026)
    loanRate: 0.45, // tüketici borcu için yıllık ~%45 oyun varsayımı (aylık %3,25-4,25 kart faizinin altında)
    minPension: 23552, // Temmuz 2026 sonrası en düşük emekli aylığı
    transitPass: 3628, // büyükşehir aylık tam abonman (Temmuz 2026)
    passport: 14761, // 10 yıllık pasaport harcı + defter bedeli
    car: 1444000, // Eylül 2026 en ucuz sıfır otomobil fiyatı (marka adı oyunda yok)
    haircut: 500,
    beard: 300,
    transplant: 85000, // 2026 tipik paket aralığı ₺45.000-120.000
    // Aylık temel sepet (kira hariç), tek yetişkin bağımsız yaşarken.
    // TÜRK-İŞ Temmuz 2026: bekâr çalışanın yaşam maliyeti ₺47.758 (kira dahil).
    // Oyun bunu kira + sepet olarak böler; kalemler oyun varsayımıdır.
    basket: { food: 11500, transport: 3628, other: 7800 },
    familyContribution: 0.4, // aile yanında yaşarken sepetin bu kadarını öder
    childMonthly: 9000, // 0-18 yaş çocuk başı aylık ek gider (oyun varsayımı)
    homeSize: 70, // m²
    abroadWage: 2.3, // yurt dışında ücret çarpanı (kurmaca)
    abroadCost: 2.5, // yurt dışında gider çarpanı (kurmaca)
  };

  // Şehir verisi: js/content/cities.js (81 il + kurmaca Berlin).

  // Meslekler. pay: 2026 aylık net başlangıç ücreti.
  // need(s) → true ya da oyuncuya gösterilecek gerekçe metni.
  HS.JOBS = {
    none: { name: "İş arıyor", pay: 0, prop: "ODA", icon: "▤" },
    cafe: {
      name: "Kafe çalışanı",
      pay: MIN_WAGE, // net asgari ücret
      prop: "KAFE",
      icon: "☕",
      uniform: "kafe",
      student: true,
    },
    factory: {
      name: "Fabrika işçisi",
      pay: 39600, // 2026 ilan beklentileri: 1 yıldan az deneyim
      prop: "FABRİKA",
      icon: "⚙",
      uniform: "tulum",
    },
    music: {
      name: "Müzisyen",
      pay: 24000, // değişken; haftalık gelir rastgele oynar
      prop: "SAHNE",
      icon: "♫",
      volatile: 0.6,
      student: true,
    },
    office: {
      name: "Ofis çalışanı",
      pay: 47800, // 2026 yeni mezun ilan beklentisi
      prop: "OFİS",
      icon: "▣",
      need: (s) =>
        s.edu === "universite" || s.skill >= 14
          ? true
          : "Üniversite diploması ya da 14 beceri gerekir.",
    },
    teacher: {
      name: "Öğretmen",
      pay: 52000, // oyun varsayımı
      prop: "OKUL",
      icon: "✎",
      need: (s) =>
        s.edu === "universite" ? true : "Üniversite diploması gerekir.",
    },
    nurse: {
      name: "Sağlık çalışanı",
      pay: 54000, // oyun varsayımı
      prop: "KLİNİK",
      icon: "✚",
      uniform: "forma",
      need: (s) =>
        s.edu === "universite" ? true : "Üniversite diploması gerekir.",
    },
    memur: {
      name: "Belediye şirketi memuru",
      pay: 41000, // kurmaca belediye şirketi; oyun varsayımı
      prop: "BELEDİYE",
      icon: "▣",
      need: (s) =>
        s.edu === "universite" || s.skill >= 18
          ? true
          : "Diploma, 18 beceri ya da bir tanıdık gerekir.",
    },
    business: {
      name: "Esnaf",
      pay: 42000, // ortalama; haftalık kâr güçlü oynar
      prop: "DÜKKÂN",
      icon: "⌂",
      volatile: 0.9,
      startup: 250000, // 2026 TL ile açılış sermayesi
      need: (s) =>
        s.skill >= 8 ? true : "Dükkân açmak için en az 8 beceri gerekir.",
    },
    crime: {
      name: "Gece işleri",
      pay: 45000,
      prop: "GECE",
      icon: "☾",
      risky: true,
    },
  };

  // Kurmaca ekonomi senaryoları (2027+). Her hayat başlangıçta birini alır.
  // decay: enflasyonun yıllık sönümlenme çarpanı; floor: en düşük yıllık oran;
  // wobble: yıllar arası dalgalanma genliği.
  HS.SCENARIOS = {
    yavas: {
      name: "Yavaş dezenflasyon",
      text: "Fiyat artışları yıllar içinde ağır ağır yavaşlar.",
      decay: 0.86,
      floor: 0.06,
      wobble: 0.02,
    },
    dalgali: {
      name: "Dalgalı yıllar",
      text: "Sakin dönemlerle ani fiyat sıçramaları birbirini izler.",
      decay: 0.92,
      floor: 0.08,
      wobble: 0.09,
    },
    hizli: {
      name: "Hızlı istikrar",
      text: "Birkaç yıl içinde fiyatlar daha öngörülebilir hâle gelir.",
      decay: 0.72,
      floor: 0.04,
      wobble: 0.015,
    },
  };

  // Kurmaca siyasi partiler. Gerçek kişi, parti ya da kurumla ilgisi yoktur.
  HS.PARTIES = [
    {
      id: "ulasim",
      name: "Yeşil Hat Hareketi",
      leader: "Aven Ral",
      promise: "toplu ulaşıma destek",
      policy: "transit",
    },
    {
      id: "uretim",
      name: "Atölye Partisi",
      leader: "Sera Mavek",
      promise: "küçük işletmelere vergi indirimi",
      policy: "enterprise",
    },
    {
      id: "konut",
      name: "Çatı Birliği",
      leader: "Doruk Elvan",
      promise: "kira artışlarına sınır",
      policy: "housing",
    },
    {
      id: "aile",
      name: "Ocak Derneği Partisi",
      leader: "Melis Torun",
      promise: "çocuklu ailelere aylık destek",
      policy: "family",
    },
  ];
})(globalThis.HS || (globalThis.HS = {}));
