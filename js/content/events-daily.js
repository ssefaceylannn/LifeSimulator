// Gündelik olaylar: haftaları dolduran küçük anlar ve yaşam düzeni olayları.
// Yeni içerik eklemek için bu dosyaya (ya da yeni bir dosyaya) HS.EVENTS.push(...) yeterli.
(function (HS) {
  "use strict";
  const c = (label, hint, fx = {}) => ({ label, hint, fx });

  // Yedek olay da her seferinde farklı küçük bir an anlatır.
  HS.FALLBACK_EVENT = {
    id: "ordinary",
    title: (s, h) =>
      h.pick(["Sıradan bir hafta", "Sakin günler", "Takvimden bir yaprak"]),
    text: (s, h) =>
      h.pick([
        "Sabah kahvesi, akşam haberleri. Hayat bu hafta kendi ritminde aktı.",
        "Pencereden bakınca mahallede her şey aynı; sen biraz değişmişsin gibi.",
        "Bu hafta dikkat çekici bir şey olmadı. Belki de iyi haber budur.",
        "Otobüste yanındaki kişinin telefonundan eski bir şarkı çaldı; günün geri kalanında aklından çıkmadı.",
      ]),
    choices: [
      c("Düzenini sürdür", "Bu hafta sakin geçsin.", { m: 1 }),
      c("Kendine küçük bir iyilik yap", "Bir kahve, bir kitap.", {
        cost: 250,
        m: 3,
      }),
      c("Birini ara", "Uzun zamandır konuşmadığın biri.", { people: 1, m: 2 }),
    ],
  };

  HS.EVENTS.push(
    // ----- Aile evinden ayrılma -----
    {
      id: "moveOut",
      priority: 60,
      cooldown: 26,
      when: (s) =>
        s.housing === "aile" &&
        !s.abroad &&
        (s.age >= 27 || (s.partner && s.partner.married)),
      title: (s) =>
        s.partner && s.partner.married
          ? "Yeni yuvanız"
          : "Aile evinden ayrılma zamanı",
      text: (s, h) =>
        (s.partner && s.partner.married
          ? "Evlendiniz; artık kendi evinizi kurma vakti. "
          : "Odan hâlâ çocukluk posterleriyle dolu ve ailen nazikçe kendi düzenini kurman gerektiğini söylüyor. ") +
        h.ek(s.city, "loc") +
        " ortalama bir dairenin kirası aylık " +
        h.money(HS.rentFull(s)) +
        ".",
      choices: (s) => [
        c("Tek başına kirala", "Depozito + ilk ay. Mahremiyet senin.", {
          rent: "kira",
          m: 4,
        }),
        s.partner && s.partner.married
          ? null
          : c("Ev arkadaşıyla kirala", "Kiranın yarısını öde.", {
              rent: "kira-paylasim",
              m: 2,
              people: 1,
            }),
        s.age < 32 && !(s.partner && s.partner.married)
          ? c("Biraz daha kal", "Para biriktirmeye devam et.", {
              m: -3,
              theme: "security",
            })
          : null,
      ],
    },

    // ----- Gündelik anlar -----
    {
      id: "market",
      weight: 1,
      cooldown: 26,
      title: "Hafta sonu pazarı",
      text: "Pazarda sebze meyve fiyatları yine değişmiş. Toplu alışveriş ucuz ama çabuk bozulabilir.",
      choices: [
        c("Haftalık alışveriş yap", "Dışarıda daha az ye.", {
          cost: 1250,
          h: 1,
          m: 1,
        }),
        c("Az az al", "Nakdini koru.", { cost: 400, m: -1 }),
      ],
    },
    {
      id: "bill",
      weight: 1,
      cooldown: 30,
      title: "Fatura günü",
      text: "Kışın ilk soğuklarıyla elektrik ve doğalgaz faturası yükseldi.",
      choices: [
        c("Tasarruf düzeni kur", "Küçük bir harcamayla faturayı düşür.", {
          cost: 600,
          skill: 1,
          theme: "security",
        }),
        c("Aynı şekilde devam et", "Rahatını bozma.", { cost: 950 }),
      ],
    },
    {
      id: "traffic",
      weight: 1,
      cooldown: 26,
      title: "Yol çalışması",
      text: "Yol çalışması yüzünden gidip gelmek uzadı.",
      choices: [
        c("Erken çık", "Uykundan feragat et.", { h: -1, skill: 1 }),
        c("Yürü", "Biraz spor olur.", { h: 2, m: 1 }),
      ],
    },
    {
      id: "celebration",
      weight: 0.8,
      cooldown: 40,
      title: "Küçük bir kutlama",
      text: "Uzun zamandır beklediğin güzel bir haber aldın.",
      choices: [
        c("Kutlama yap", "Sevdiklerinle anı biriktir.", {
          cost: 1100,
          m: 6,
          people: 2,
        }),
        c("Sade tut", "Bir kahveyle kutla.", { cost: 250, m: 3 }),
      ],
    },
    {
      id: "phoneBroke",
      weight: 0.7,
      cooldown: 80,
      title: "Telefonun düştü",
      text: "Ekran örümcek ağı gibi çatladı. Tamir mi, yenisi mi?",
      choices: [
        c("Ekranı tamir ettir", "Ucuz çözüm.", { cost: 3500 }),
        c("Yeni telefon al", "Taksitle de olsa.", { cost: 25000, m: 3 }),
        c("Çatlakla idare et", "Parmakların alışır.", { m: -2 }),
      ],
    },
    {
      id: "cooking",
      weight: 1,
      cooldown: 30,
      title: "Mutfakta yeni bir tarif",
      text: "Annenden kalan tarif defterini buldun. Bir akşam dene?",
      choices: [
        c("Pişir ve davet et", "Sofra kalabalık olsun.", {
          cost: 800,
          people: 2,
          m: 4,
        }),
        c("Kendin için pişir", "Sakin bir akşam.", { h: 1, m: 2, skill: 1 }),
      ],
    },
    {
      id: "insomnia",
      weight: 0.8,
      cooldown: 40,
      title: "Uykusuz geceler",
      text: "Birkaç gecedir uyuyamıyorsun; aklında hep aynı düşünceler.",
      choices: [
        c("Bir uzmana danış", "Konuşmak iyi gelir.", {
          cost: 2500,
          m: 6,
          h: 2,
          theme: "care",
        }),
        c("Yürüyüşe çık", "Yorgunluk uykuyu getirir.", { h: 1, m: 1 }),
        c("Geçer", "Görmezden gel.", { h: -2, m: -2 }),
      ],
    },
    {
      id: "stray",
      weight: 0.6,
      cooldown: 200,
      title: "Kapıdaki kedi",
      text: "Bir sokak kedisi birkaç gündür kapının önünde bekliyor.",
      choices: [
        c("Sahiplen", "Mama ve veteriner masrafı.", {
          cost: 3000,
          m: 8,
          flag: "kedi",
          log: "Bir sokak kedisini sahiplendi.",
        }),
        c("Mama bırak", "Mahallenin kedisi olsun.", {
          cost: 200,
          m: 2,
          people: 1,
        }),
      ],
    },
    {
      id: "lottery",
      weight: 0.4,
      cooldown: 104,
      title: "Yılbaşı biletinden ikramiye",
      text: "Kurmaca piyangodan küçük bir ikramiye çıktı.",
      choices: [
        c("Bankaya koy", "Bir gün lazım olur.", (s) => ({
          cash: 15000,
          save: 15000 * s.idx.cpi,
          theme: "security",
        })),
        c("Hemen harca", "Bir kerelik sevinç.", {
          cash: 15000,
          cost: 12000,
          m: 8,
        }),
      ],
    },
    {
      id: "concert",
      weight: 0.8,
      cooldown: 40,
      maxAge: 60,
      title: "Açık hava konseri",
      text: "Sevdiğin bir grubun kurmaca festivalde konseri var.",
      choices: [
        c("Bilet al", "Unutulmaz bir gece.", { cost: 2200, m: 7, people: 1 }),
        c("Kayıttan izle", "Evde de keyifli.", { m: 2 }),
      ],
    },
    {
      id: "fishing",
      weight: 0.6,
      cooldown: 60,
      minAge: 35,
      title: "Kıyıda bir sabah",
      text: "Bir arkadaşın sabah erkenden balığa çıkmayı önerdi.",
      choices: [
        c("Git", "Deniz, sessizlik, çay.", { h: 2, m: 5, people: 1 }),
        c("Uyumayı seç", "Hafta yorucuydu.", { h: 2 }),
      ],
    },
    {
      id: "donate",
      weight: 0.6,
      cooldown: 60,
      title: "Kan bağışı çağrısı",
      text: "Mahalledeki sağlık merkezi acil kan bağışı istiyor.",
      choices: [
        c("Bağış yap", "Bir saatini ayır.", {
          m: 4,
          people: 1,
          theme: "community",
        }),
        c("Başka zaman", "Bu hafta değil.", {}),
      ],
    },
    {
      id: "earthquakeKit",
      weight: 0.5,
      cooldown: 200,
      title: "Deprem çantası",
      text: "Haberlerde yine deprem hazırlığı konuşuluyor. Evde bir çanta hazır mı?",
      choices: [
        c("Çanta hazırla", "Su, fener, ilk yardım.", {
          cost: 1500,
          skill: 1,
          theme: "security",
        }),
        c("Sonra yaparım", "Erteleme.", { m: -1 }),
      ],
    },
    {
      id: "secondHand",
      weight: 0.6,
      cooldown: 60,
      title: "İkinci el fırsat",
      text: "Bir ilan sitesinde neredeyse yeni bir bisiklet uygun fiyata satılıyor.",
      choices: [
        c("Satın al", "Ulaşımda tasarruf ve spor.", { cost: 4000, h: 3, m: 2 }),
        c("Vazgeç", "İhtiyaç değil.", {}),
      ],
    },
    {
      id: "neighborNoise",
      weight: 0.7,
      cooldown: 60,
      when: (s) => s.housing !== "aile",
      title: "Üst kattaki gürültü",
      text: "Üst kat komşun gece yarısı mobilya taşıyor gibi.",
      choices: [
        c("Kibarca konuş", "Komşuluk ilişkisini koru.", { people: 1, m: 1 }),
        c("Yönetime şikâyet et", "Kurallar herkes için.", { m: -1 }),
        c("Kulaklık tak", "Kendi dünyana çekil.", { h: -1 }),
      ],
    },
    {
      id: "birthdayFriend",
      weight: 0.8,
      cooldown: 40,
      title: "Arkadaşının doğum günü",
      text: "Yakın bir arkadaşının doğum günü yarın. Hediye mi, sürpriz mi?",
      choices: [
        c("Sürpriz parti düzenle", "Herkesi topla.", {
          cost: 2000,
          people: 3,
          m: 5,
        }),
        c("Küçük bir hediye", "Düşünmek yeter.", {
          cost: 500,
          people: 1,
          m: 2,
        }),
      ],
    },
    {
      id: "news",
      weight: 0.7,
      cooldown: 52,
      title: "Şehirde büyük haber",
      text: "Ülke gündeminde ekonomi tartışmaları var. İnsanlar gelecekten kaygılı.",
      choices: [
        c(
          "Biraz nakit kenara ayır",
          "Belirsizliğe karşı temkinli ol.",
          (s) => ({
            save: Math.round(Math.min(s.cash, 2000 * s.idx.cpi)),
            m: -1,
          }),
        ),
        c("Hayatına devam et", "Her şeyi kontrol edemezsin.", { m: 2 }),
      ],
    },
    {
      id: "walk",
      weight: 0.9,
      cooldown: 30,
      title: "Kendine zaman ayır",
      text: "Son haftalarda iş, masraflar ve beklentiler arasında sıkıştın.",
      choices: [
        c("Uzun bir yürüyüşe çık", "Şehirle ve kendinle baş başa kal.", {
          h: 3,
          m: 4,
        }),
        c("Evde dinlen", "Hiçbir şey yapmamak da ihtiyaçtır.", { h: 3, m: 2 }),
      ],
    },
    {
      id: "fixIt",
      weight: 0.6,
      cooldown: 80,
      title: "Bozulan çamaşır makinesi",
      text: "Makine yıkamanın ortasında durdu ve suyu boşaltmıyor.",
      choices: [
        c("Servis çağır", "Garantisi bitmiş.", { cost: 2800 }),
        c("Kendin onar", "Videoları izle, dene.", { skill: 2, m: -1 }),
        c("Yenisini al", "Eskisi yeter artık.", { cost: 22000, m: 2 }),
      ],
    },
    {
      id: "photoAlbum",
      weight: 0.6,
      cooldown: 120,
      minAge: 40,
      title: "Eski fotoğraflar",
      text: "Dolabın üstünden eski bir fotoğraf albümü düştü.",
      choices: [
        c("Sayfaları çevir", "Yılların içinde kaybol.", { m: 4 }),
        c("Eski dostlara gönder", "Hatıraları paylaş.", { people: 2, m: 3 }),
      ],
    },
    {
      id: "hobby",
      weight: 0.7,
      cooldown: 80,
      title: "Yeni bir uğraş",
      text: "Uzun zamandır denemek istediğin bir hobi var: seramik, gitar ya da satranç.",
      choices: [
        c("Atölyeye yazıl", "Ellerin bir şey üretsin.", {
          cost: 2500,
          skill: 1,
          m: 5,
          theme: "craft",
        }),
        c("İnternetten öğren", "Ücretsiz ama yavaş.", {
          skill: 1,
          m: 2,
          theme: "craft",
        }),
      ],
    },
    {
      id: "seniorHealth",
      weight: (s) => (s.age > 70 ? 1.5 : 0),
      cooldown: 40,
      title: "Dizlerin ağrıyor",
      text: "Merdivenler eskisinden daha uzun geliyor.",
      choices: [
        c("Fizik tedaviye git", "Düzenli egzersiz.", { cost: 4000, h: 5 }),
        c("Bastonla idare et", "Yavaş ama emin adımlar.", { h: 1, m: -1 }),
      ],
    },
    {
      id: "grandkidVisit",
      weight: (s) => (s.flags.torun ? 2 : 0),
      cooldown: 26,
      title: "Torunlar geldi",
      text: "Torunların hafta sonu sende kalmak istiyor.",
      choices: [
        c("Kapıyı aç", "Ev kahkahayla dolsun.", {
          cost: 1500,
          m: 8,
          kidBond: 4,
          h: -1,
        }),
        c("Bu hafta yorgunum", "Başka zaman.", { h: 2, kidBond: -2 }),
      ],
    },
  );
})(globalThis.HS || (globalThis.HS = {}));
