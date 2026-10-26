// Beden: boy, kilo, kas. Kilo haftalık kalori dengesiyle, kas antrenmanla değişir.
// Beden kitle indeksi (BKİ) ve kas oranı sağlığı ve karakterin görünüşünü etkiler.
(function (HS) {
  "use strict";
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const r = () => HS.rng();

  HS.Body = {
    bmi: (s) => s.body.w / Math.pow(s.body.h / 100, 2),
    // Görünüş için 0 (zayıf) – 1 (çok kilolu) arası değer
    fat: (s) => clamp((HS.Body.bmi(s) - 18) / 17, 0, 1),
    label(s) {
      const b = HS.Body.bmi(s);
      return b < 18.5 ? "Zayıf" : b < 25 ? "Normal" : b < 30 ? "Fazla kilolu" : b < 35 ? "Obez (1. derece)" : "Obez (2. derece)";
    },
    muscleLabel: (s) => (s.body.mus < 20 ? "Zayıf kas" : s.body.mus < 40 ? "Normal" : s.body.mus < 65 ? "Sportif" : "Kaslı"),
  };

  function init(s) {
    if (s.body) return;
    const man = s.look === "man";
    const h = Math.round((man ? 176 : 163) + (r() * 2 - 1) * 8);
    const bmi = 20.5 + r() * 3.5;
    s.body = { h, w: Math.round(bmi * Math.pow(h / 100, 2) * 10) / 10, mus: Math.round((man ? 24 : 18) + r() * 10), trend: 0 };
  }
  HS.HOOKS.newLife.push(init);
  HS.HOOKS.migrate.push(init);

  // Etki anahtarları: kg (kilo değişimi), mus (kas), diet
  HS.FX.kg = (s, v) => (s.body.w = clamp(s.body.w + v, 38, 180));
  HS.FX.mus = (s, v) => {
    // Kas yaşla ve seviye yükseldikçe daha zor gelişir
    const k = v > 0 ? clamp(1 - s.body.mus / 110, 0.1, 1) * clamp(1.2 - Math.max(0, s.age - 30) / 60, 0.3, 1.2) : 1;
    s.body.mus = clamp(s.body.mus + v * k, 3, 100);
  };

  // Haftalık denge
  HS.HOOKS.weekly.push((s) => {
    const b = s.body;
    let d = 0.012; // yetişkinlikte hafif kilo alma eğilimi
    d += Math.max(0, s.age - 30) * 0.0012; // metabolizma yavaşlar
    if (s.mood < 35) d += 0.05; // stres yemesi
    if (["office", "memur", "music"].includes(s.job)) d += 0.02; // masa başı / gece
    if (["factory", "cafe", "nurse"].includes(s.job)) d -= 0.025; // ayakta iş
    if (s.car && !["bisiklet", "scooter"].includes(s.car)) d += 0.012;
    if (s.car === "bisiklet") d -= 0.02;
    if (s.partner && s.partner.married) d += 0.008; // "evlilik kilosu"
    if (s.health < 35) d -= 0.04; // hastalık kilo kaybettirir
    d += (r() - 0.5) * 0.06;
    b.w = clamp(b.w + d, 38, 180);
    b.trend = b.trend * 0.8 + d * 0.2;
    // Kas: kullanılmazsa erir, yaşla daha hızlı
    b.mus = clamp(b.mus - 0.12 - Math.max(0, s.age - 50) * 0.004, 3, 100);
    // Sağlık etkisi
    const bmi = HS.Body.bmi(s);
    if (bmi >= 30) s.health = clamp(s.health - 0.04 * (bmi - 29), 0, 100);
    if (bmi < 17.5) s.health = clamp(s.health - 0.05, 0, 100);
    if (b.mus >= 45) s.health = clamp(s.health + 0.02, 0, HS.healthCap(s) + 4);
  });
  // Yaşla boy hafifçe kısalır
  HS.HOOKS.yearly.push((s) => {
    if (s.age >= 60) s.body.h = Math.max(140, s.body.h - 0.25);
  });

  HS.EVENTS.push(
    {
      id: "kiloUyari",
      weight: (s) => (HS.Body.bmi(s) >= 29 ? 2 : 0),
      cooldown: 52,
      minAge: 25,
      title: "Doktorun uyarısı",
      text: (s) => "Kontrolde tartıya çıktın: " + s.body.w.toFixed(1) + " kg, beden kitle indeksin " + HS.Body.bmi(s).toFixed(1) + ". Doktor tansiyon ve şeker riskinden söz etti.",
      choices: [
        { label: "Diyetisyene git", hint: "Üç ay boyunca beslenme planı. Kilo verirsin.", fx: { cost: 6000, kg: -4, h: 3, m: -2, theme: "care" } },
        { label: "Spora başla", hint: "Kas yapar, kilo verirsin; yorulursun.", fx: { kg: -2.5, mus: 4, h: 2 } },
        { label: "Sonra bakarım", hint: "Alışkanlıklar sürer.", fx: { m: 1, kg: 0.5 } },
      ],
    },
    {
      id: "fastFood",
      weight: (s) => (s.mood < 50 ? 1.5 : 0.7),
      cooldown: 20,
      title: "Gece acıkması",
      text: "Saat gece yarısını geçti, buzdolabı boş. Telefonda yemek uygulaması açık.",
      choices: [
        { label: "Hamburger söyle", hint: "Keyifli ama ağır.", fx: { cost: 650, m: 3, kg: 0.5 } },
        { label: "Yoğurt ye ve yat", hint: "Sağlıklı tercih.", fx: { h: 1 } },
      ],
    },
    {
      id: "aynaAyna",
      weight: (s) => (s.body.mus < 25 && s.age < 45 ? 0.8 : 0),
      cooldown: 80,
      title: "Aynadaki sen",
      text: "Arkadaşların spor salonundaki ilerlemelerini paylaşıyor. Sen de bir şeyler değiştirmek istiyor musun?",
      choices: [
        { label: "Yıllık salon üyeliği al", hint: "Her salon etkinliği daha ucuz ve etkili olur.", fx: { cost: 18000, flag: "salonUye", m: 2 } },
        { label: "Evde şınav çek", hint: "Bedava başlangıç.", fx: { mus: 2, h: 1 } },
        { label: "Umursama", hint: "Herkes kendi yolunda.", fx: {} },
      ],
    },
    {
      id: "belAgrisi",
      weight: (s) => (s.age > 35 && s.body.mus < 30 ? 1 : 0.2),
      cooldown: 104,
      title: "Bel ağrısı",
      text: "Sabah eğilirken belin tutuldu. Fizik tedavi uzman randevusu iki hafta sonra.",
      choices: [
        { label: "Fizik tedaviye git", hint: "Masraflı ama kalıcı çözüm.", fx: { cost: 7000, h: 4, mus: 2 } },
        { label: "Ağrı kesiciyle idare et", hint: "Geçici.", fx: { h: -2, m: -2 } },
      ],
    },
  );
})(globalThis.HS || (globalThis.HS = {}));
