// 2026 resmî harçlar ve tipik maliyetler (Ekim 2026 araştırması; ayrıntı ve kaynaklar: COSTS-2026.md).
// Tutarlar 2026 TL'sidir; oyun yılı ilerledikçe enflasyonla ölçeklenir.
// "tahmin" yazanlar kaynak bulunamayan ya da aralıktan seçilen oyun varsayımlarıdır.
(function (HS) {
  "use strict";
  HS.FX_RATES = { EUR: 55.7, USD: 49.58, GBP: 66.14, CAD: 34.87 }; // 20-21 Ekim 2026
  HS.COSTS = {
    exitFee: 1250, // yurt dışı çıkış harcı (her çıkışta)
    passport10: 14761, // 10 yıllık pasaport: harç ₺13.410,40 + defter ₺1.351
    translationPage: 750, // noter tercüme tarifesi ₺667,67 + yazı ücreti ₺80,68 (sayfa başı)
    notary: 1180, // noter düzenleme ücreti (yaklaşık)
    criminalRecord: 0, // e-Devlet adli sicil kaydı ücretsiz
    travelInsurance: 4500, // yıllık seyahat sağlık sigortası (tahmin)
    schengenEUR: 90,
    agencyEUR: 38, // iDATA/VFS hizmet bedeli (€30-45)
    flightEurope: 7000, // tek yön (₺4.000-10.000 aralığı)
    flightTransatlantic: 25000, // tek yön (₺15.000-35.000 aralığı)
    // Ehliyet (B sınıfı)
    drivingCourse: 25000,
    eExam: 1250,
    drivingExam: 2800,
    licenseFee: 9200,
    // Askerlik
    bedelli: 472654, // Temmuz-Aralık 2026
    // Araç ve ev yıllık giderleri
    mtv: 11000, // 1.3-1.6 lt, 1-3 yaş araç
    trafficInsurance: 9500, // zorunlu trafik sigortası (ortalama)
    kasko: 16000,
    dask: 1800,
    propertyTaxRate: 0.002, // emlak vergisi binde 2 (büyükşehir konut)
    // Kiralama
    depositMonths: 2, // yasal üst sınır 3 ay; uygulamada 1-2 ay
    agentCommission: 1.2, // 1 aylık kira + %20 KDV
    saleCommission: 0.024, // satışta %2 + KDV
    // Nakliye: şehir içi taban + km başı (2+1 İstanbul→Ankara ≈ ₺35.000)
    movingBase: 9000,
    movingPerKm: 55,
    gymMonthly: 2000,
    privateHealth: 22000, // tamamlayıcı sağlık sigortası (yıllık)
    kindergarten: 30000, // özel kreş (aylık)
  };
  // Göç edilebilecek ülkeler. Kira ve maaşlar yerel para; oyunda TL'ye çevrilir.
  // fee: vize/izin harcı (yerel para), funds: gösterilmesi gereken birikim (yerel para),
  // lang: gereken dil, lottery: kura ihtimali (ABD H-1B gibi)
  HS.COUNTRIES = {
    // wage: tipik net aylık maaş (yerel para, tahmin); costMul: kira dışı yaşam maliyetinin Türkiye'ye oranı (tahmin)
    // sqm: konut m² fiyatı (yerel para, tahmin)
    Almanya: { city: "Berlin", cur: "EUR", lang: "almanca", langMin: 35, fee: 75, funds: 11904, rent: 1350, wage: 2600, sqm: 5500, costMul: 2.7, approve: 0.62, visa: "Ulusal çalışma vizesi (D)", flight: "Europe", f: ["metro", "tower"] },
    Hollanda: { city: "Amsterdam", cur: "EUR", lang: "ingilizce", langMin: 45, fee: 423, funds: 6000, rent: 1900, wage: 2900, sqm: 7500, costMul: 2.9, approve: 0.58, visa: "Yüksek nitelikli göçmen izni", flight: "Europe", f: ["sea", "metro"] },
    İngiltere: { city: "Londra", cur: "GBP", lang: "ingilizce", langMin: 50, fee: 819 + 1035 * 3, funds: 1270, rent: 1875, wage: 2100, sqm: 9000, costMul: 3.2, approve: 0.55, visa: "Skilled Worker vizesi (+3 yıllık sağlık katkısı)", flight: "Europe", f: ["clock", "bridge", "sea", "metro"] },
    Kanada: { city: "Toronto", cur: "CAD", lang: "ingilizce", langMin: 50, fee: 1590, funds: 15263, rent: 1990, wage: 3700, sqm: 9000, costMul: 2.6, approve: 0.5, visa: "Express Entry daimî oturum", flight: "Transatlantic", f: ["tower", "metro", "sea"] },
    ABD: { city: "New York", cur: "USD", lang: "ingilizce", langMin: 55, fee: 435, funds: 6000, rent: 4400, wage: 4800, sqm: 14000, costMul: 4, approve: 0.6, lottery: 0.27, visa: "H-1B çalışma vizesi (kura)", flight: "Transatlantic", f: ["metro", "bridge", "sea"] },
  };
  // Yurt dışı şehirleri TL karşılığıyla şehir listesine ekle; maaş çarpanı Türkiye'deki tipik
  // ₺45.000 net maaşa oranla bulunur.
  for (const [name, c] of Object.entries(HS.COUNTRIES)) {
    const rate = HS.FX_RATES[c.cur];
    c.wageMul = (c.wage * rate) / 45000;
    HS.CITIES[c.city] = { region: "abroad", country: name, rent: Math.round(c.rent * rate), sqm: Math.round(c.sqm * rate), f: c.f, est: true };
  }
})(globalThis.HS || (globalThis.HS = {}));
