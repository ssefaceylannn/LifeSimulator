// Oyun dengesi ayarları. Varsayılanlar burada; oyuncu Ayarlar › "Oyun dengesi" ekranından
// değiştirebilir (değişiklikler bu cihazda saklanır, JSON olarak dışa/içe aktarılabilir).
// Kod bu değerleri HS.CFG üzerinden okur; yeni bir ayar eklemek için FIELDS listesine satır ekle.
(function (HS) {
  "use strict";
  const KEY = "hayatSimConfigV1";
  HS.CFG_FIELDS = [
    // grup, anahtar, etiket, açıklama, varsayılan, min, max, adım
    ["Başlangıç", "startCash", "Başlangıç parası (₺)", "Yeni hayata başlarken cepteki para.", 50000, 0, 1000000, 5000],
    ["Başlangıç", "startAge", "Başlangıç yaşı", "Yeni hayat bu yaşta başlar.", 18, 16, 30, 1],
    ["Giderler", "familyShare", "Aile evinde gidere katkı (%)", "Aile yanında yaşarken yemek, ulaşım ve diğer giderlerin yüzde kaçını sen ödersin. 0 = hiç.", 0, 0, 100, 5],
    ["Giderler", "familyBills", "Aile evinde telefon faturası", "1 = kendi telefon faturanı sen ödersin, 0 = ailen öder.", 0, 0, 1, 1],
    ["Giderler", "livingScale", "Yaşam gideri çarpanı", "Kendi evindeyken yemek, ulaşım, diğer giderler. 1 = 2026 ortalaması.", 1, 0.2, 3, 0.05],
    ["Giderler", "rentScale", "Kira çarpanı", "Bütün kiralar bu oranla çarpılır.", 1, 0.2, 3, 0.05],
    ["Giderler", "billScale", "Fatura çarpanı", "Elektrik, doğalgaz, su, internet, telefon, aidat.", 1, 0, 3, 0.05],
    ["Giderler", "eventCostScale", "Olay masrafı çarpanı", "Seçimlerdeki harcamalar (düğün, tamir, tatil...). 0,5 = yarısı.", 1, 0, 3, 0.05],
    ["Gelir", "wageScale", "Maaş çarpanı", "Bütün maaşlar bu oranla çarpılır.", 1, 0.2, 5, 0.05],
    ["Gelir", "eventGainScale", "Olay kazancı çarpanı", "Seçimlerden gelen para (ikramiye, bahşiş, harçlık...).", 1, 0, 5, 0.05],
    ["Haftalar", "weekMin", "Haftada en az olay", "Bir haftada gelecek en az olay sayısı.", 3, 1, 10, 1],
    ["Haftalar", "weekMax", "Haftada en çok olay", "Bir haftada gelecek en çok olay sayısı.", 5, 1, 12, 1],
    ["Haftalar", "weekStep", "Her turda geçen hafta (oyun hızı)", "Bir haftanın olayları bitince kaç hafta ilerlenir. 4 = yıllar dört kat hızlı geçer; aradaki haftalarda maaş, giderler ve yaş yine işlenir.", 2, 1, 8, 1],
    ["Haftalar", "fateScale", "Kader olayı sıklığı", "Kaza, hastalık, deprem gibi olayların sıklık çarpanı. 0 = hiç.", 1, 0, 5, 0.1],
    ["Para piyasası", "investUp", "Borsa/fon/kripto kazanma ihtimali (%)", "Her ay riskli yatırımların değer kazanma ihtimali.", 30, 0, 100, 5],
    ["Para piyasası", "betLimit", "Haftalık en çok kupon", "Bahiste bir haftada yapılabilecek kupon sayısı.", 3, 0, 20, 1],
    ["Para piyasası", "bankRateScale", "Banka faiz çarpanı", "Kart, kredi ve mevduat faizleri.", 1, 0, 3, 0.05],
    ["Gelişim", "xpScale", "Deneyim hızı", "Seviye atlama hızı.", 1, 0.2, 5, 0.1],
    ["Gelişim", "levelLocks", "Lüks alımlarda seviye kilidi", "1 = spor araba, villa gibi alımlar seviye ister; 0 = istemez.", 1, 0, 1, 1],
  ];
  HS.CFG_DEFAULTS = Object.fromEntries(HS.CFG_FIELDS.map((f) => [f[1], f[4]]));
  let saved = {};
  try {
    saved = (typeof localStorage !== "undefined" && JSON.parse(localStorage.getItem(KEY))) || {};
  } catch (e) {
    saved = {};
  }
  HS.CFG = { ...HS.CFG_DEFAULTS, ...saved };
  HS.saveConfig = (cfg) => {
    HS.CFG = { ...HS.CFG_DEFAULTS, ...cfg };
    try {
      localStorage.setItem(KEY, JSON.stringify(cfg));
    } catch (e) {}
  };
  HS.resetConfig = () => {
    HS.CFG = { ...HS.CFG_DEFAULTS };
    try {
      localStorage.removeItem(KEY);
    } catch (e) {}
  };
})(globalThis.HS || (globalThis.HS = {}));
