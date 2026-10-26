// Başarımlar ve hayat istatistikleri.
// Başarımlar her hafta kontrol edilir; açılınca ara sahne ve ses çıkar.
// İstatistik: her yıl başında net değer, sağlık, mutluluk, kilo kaydı (grafik için).
(function (HS) {
  "use strict";
  const A = (id, name, desc, icon, check) => ({ id, name, desc, icon, check });
  HS.ACHIEVEMENTS = [
    A("ilkMaas", "İlk maaş", "İlk işine gir.", "dollar-banknote", (s) => s.worked),
    A("mezun", "Kep havaya", "Üniversiteden mezun ol.", "graduation-cap", (s) => s.edu === "universite"),
    A("ask", "Kalp atışı", "Bir ilişkiye başla.", "ring", (s) => !!s.partner),
    A("evlilik", "Evet dedim", "Evlen.", "wedding", (s) => s.partner && s.partner.married),
    A("ebeveyn", "Ailemiz büyüdü", "Çocuk sahibi ol.", "baby-bottle", (s) => s.children.length > 0),
    A("torun", "Torun sevgisi", "Torun sahibi ol.", "people-hugging", (s) => !!s.flags.torun),
    A("ehliyet", "Direksiyonda", "Ehliyet al.", "oncoming-automobile", (s) => s.license === "var"),
    A("araba", "Kapıda araba", "Motorlu bir araç al.", "automobile", (s) => s.car && s.car !== "bisiklet"),
    A("spor", "Hız tutkusu", "Spor araba al.", "racing-car", (s) => s.car === "spor"),
    A("ev", "Anahtar teslim", "Kendi evini al.", "key", (s) => s.assets.house),
    A("villa", "Villa sahibi", "Villa al.", "house-with-garden", (s) => s.assets.house && s.homeType === "villa"),
    A("emlakci", "Emlak baronu", "Kendi evin dışında 3 mülk edin.", "office-building", (s) => (s.props || []).length >= 3),
    A("milyon", "İlk milyon", "Net değerin 1 milyon TL'yi (2026 fiyatıyla) geçsin.", "money-bag", (s) => HS.netWorth(s) / s.idx.cpi >= 1e6),
    A("onMilyon", "Servet", "Net değerin 10 milyon TL'yi (2026 fiyatıyla) geçsin.", "gem-stone", (s) => HS.netWorth(s) / s.idx.cpi >= 1e7),
    A("borcsuz", "Borçsuz yaşam", "40 yaşına borçsuz gel.", "bank", (s) => s.age >= 40 && s.debt < 1),
    A("mudur", "Zirvede", "Mesleğinin en üst basamağına çık.", "1st-place-medal", (s) => (s.jobLevel || 0) >= 4),
    A("top5", "En iyi işverenlerden", "Sıralamada ilk 5 şirketten birinde çalış.", "trophy", (s) => s.company && HS.coRanking().slice(0, 5).some((x) => x.id === s.company)),
    A("ikiDil", "Çok dilli", "İki yabancı dilde 50 beceriye ulaş.", "globe-showing-europe-africa", (s) => ["ingilizce", "almanca", "fransizca"].filter((k) => HS.Skills.get(s, k) >= 50).length >= 2),
    A("kasli", "Demir gibi", "Kas oranın 70'e ulaşsın.", "flexed-biceps", (s) => s.body && s.body.mus >= 70),
    A("gocmen", "Gurbetçi", "Vize alıp yurt dışına yerleş.", "passport-control", (s) => s.abroad && HS.CITIES[s.city]?.region === "abroad"),
    A("gezgin", "Anadolu gezgini", "Türkiye'de 20 il gör.", "world-map", (s) => s.visited && s.visited.tr.length >= 20),
    A("hepsi", "81 il", "Türkiye'nin 81 ilinin hepsini gör.", "world-map", (s) => s.visited && s.visited.tr.length >= 81),
    A("dunya", "Dünya vatandaşı", "10 ülke gör.", "airplane-departure", (s) => s.visited && s.visited.world.length >= 10),
    A("yildiz", "Yıldız", "Şöhretin 80'i geçsin.", "microphone", (s) => (s.fame || 0) >= 80),
    A("turne", "Yollarda", "Bir turneyi tamamla.", "stadium", (s) => (s.log || []).some((l) => /turnesini tamamladı/.test(l.text))),
    A("kumbara", "Kumbara", "Net değerin ₺500.000 (2026 fiyatıyla) geçsin.", "money-bag", (s) => HS.netWorth(s) / s.idx.cpi >= 500000),
    A("asker", "Tezkere", "Askerliğini tamamla.", "military-helmet", (s) => s.mil === "yapildi" || s.mil === "bedelli"),
    A("kedi", "Patili dost", "Bir kedi sahiplen.", "cat", (s) => !!s.flags.kedi),
    A("yuzyil", "Asırlık çınar", "90 yaşını gör.", "deciduous-tree", (s) => s.age >= 90),
  ];

  function init(s) {
    s.ach = s.ach || [];
    s.hist = s.hist || [];
  }
  HS.HOOKS.newLife.push(init);
  HS.HOOKS.migrate.push(init);

  HS.HOOKS.weekly.push((s) => {
    for (const a of HS.ACHIEVEMENTS) {
      if (s.ach.includes(a.id)) continue;
      let ok = false;
      try {
        ok = !!a.check(s);
      } catch (e) {}
      if (ok) {
        s.ach.push(a.id);
        s.scenes.push({ t: "Başarım: " + a.name, p: a.desc, art: "★", kind: "win", ach: a.id });
        if (HS.onAchievement) HS.onAchievement(a);
      }
    }
  });
  // Yıllık istatistik kaydı
  const snap = (s) => s.hist.push({ age: s.age, year: s.year, net: Math.round(HS.netWorth(s) / s.idx.cpi), cash: Math.round(s.cash / s.idx.cpi), health: Math.round(s.health), mood: Math.round(s.mood), kg: s.body ? Math.round(s.body.w) : null });
  HS.HOOKS.newLife.push(snap);
  HS.HOOKS.yearly.push(snap);
})(globalThis.HS || (globalThis.HS = {}));
