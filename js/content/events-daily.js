// Gündelik olaylar: haftaları dolduran küçük anlar ve yaşam düzeni olayları.
// Yeni içerik eklemek için bu dosyaya (ya da yeni bir dosyaya) HS.EVENTS.push(...) yeterli.
(function (HS) {
  "use strict";
  const c = (label, hint, fx = {}) => ({ label, hint, fx });

  // Yedek olay: o hafta yeni bir konu kalmadıysa gelir. Her seferinde farklı bir giriş
  // (mevsim, hava, gün, tanıdıklar, evdeki eşyalar) ve son kullanılmamış üç seçenek gösterir;
  // böylece "aynı soru" hissi oluşmaz.
  const FREE = [
    ["Dizi aç, kanepeye uzan", "Stres −", { stress: -4, m: 1, kg: 0.05 }],
    ["Bir arkadaşını ara", "Çevre +", { people: 1, m: 2 }],
    ["Akşam yürüyüşü", "Sağlık +, stres −", { h: 1, stress: -3, kg: -0.05 }],
    ["Kitap oku", "Beceri +", { skill: 1, stress: -2 }],
    ["Evi topla", "İçin rahatlar.", { stress: -2, m: 1 }],
    ["Ücretsiz çevrim içi ders izle", "Beceri +, yorgunluk", { skill: 1.5, stress: 1 }],
    ["Telefonda vakit geçir", "Zaman uçup gider.", { m: 1, stress: 1, sleep: 1 }],
    ["Erken yat", "Sağlık +", { h: 2, stress: -2, sleep: -3 }],
    ["Mahalle kahvesine in", "₺60 · sohbet", { cost: 60, people: 1, m: 2 }],
    ["Annene telefon et", "Aile bağı +", { m: 1, people: 0.5 }],
    ["Kendine iyi bir kahve yap", "Küçük bir keyif.", { m: 2 }],
    ["Haftaya plan yap", "Daha düzenli bir hafta.", { stress: -2, perf: 1 }],
    ["Dolapları ayıkla, eskileri bağışla", "Ev ferahlar, gönül de.", { m: 2, people: 0.5, stress: -1 }],
    ["Balkonda çay demle", "Sessiz bir saat.", { stress: -3, m: 1 }],
    ["Yeni bir yemek tarifi dene", "₺350 · şans işi", { cost: 350, m: 2, h: 1 }],
    ["Eski fotoğraflara bak", "Biraz hüzün, biraz gülümseme.", { m: 1, esteem: 1 }],
    ["Sahilde / parkta bisiklete bin", "₺120 kiralama · sağlık +", { cost: 120, h: 2, stress: -3 }],
    ["Podcast dinleyerek bulaşık/çamaşır hallet", "İki iş birden.", { stress: -1, skill: 0.5 }],
    ["Bütçeni gözden geçir", "Harcamaların netleşir.", { stress: -1, sk: { finans: 1 } }],
    ["Yabancı dil uygulamasında seri yap", "İngilizce +", { sk: { ingilizce: 1.5 }, stress: 1 }],
    ["Bir müzeye / sergiye git", "₺250 · ilham", { cost: 250, m: 3, skill: 0.5 }],
    ["Halı sahaya / spora katıl", "₺300 · çevre ve sağlık", { cost: 300, h: 1, people: 1, kg: -0.1 }],
    ["Bakkalla iki laf et, ekmek al", "Mahalle bağı +", { cost: 30, rel: { bakkal: 3 }, m: 1 }],
    ["Komşuya selam ver, hal hatır sor", "Komşuluk +", { rel: { komsu: 3 }, people: 0.5 }],
    ["Uzun bir duş ve yüz maskesi", "Kendine bakım", { stress: -3, esteem: 1, cost: 80 }],
    ["Bulmaca / sudoku çöz", "Zihin açılır.", { skill: 0.5, stress: -1 }],
    ["Saksılardaki çiçekleri sula, toprağı değiştir", "₺150", { cost: 150, m: 2, stress: -2 }],
    ["Online indirimlere göz at ama bir şey alma", "İrade testi", { m: -1, esteem: 1 }],
    ["Gece sinemasına git", "₺220", { cost: 220, m: 3, sleep: 1 }],
    ["Hiçbir şey yapma, tavanı izle", "Bazen gerek.", { stress: -2, m: 0 }],
  ];
  const PARTNER_FREE = [
    ["Partnerinle yürüyüşe çık", "Bağ +", { bond: 3, h: 1, stress: -2 }],
    ["Birlikte yemek yapın", "₺300 · bağ +", { cost: 300, bond: 4, m: 2 }],
    ["Partnerine sürpriz çiçek al", "₺400 · bağ ++", { cost: 400, bond: 5, trust: 1 }],
  ];
  const KID_FREE = [
    ["Çocuklarla kutu oyunu oyna", "Çocuk bağı +", { kidBond: 4, stress: -1 }],
    ["Çocukları parka götür", "Çocuk bağı +, yorgunluk", { kidBond: 3, h: 1, stress: 1 }],
  ];
  const OPEN = [
    (s, h) => "Bugün kimse bir şey istemedi, telefon da sustu. Bu saatleri nasıl geçireceksin?",
    (s, h) => "İş güç bitti, önünde birkaç saat var.",
    (s, h) => "Pencereden " + h.ek(s.city, "gen") + " sokaklarına baktın; herkes kendi telaşında.",
    (s, h) => "Çay demlendi. Kafanda bir sürü yapılacak iş var ama hiçbiri acil değil.",
    (s, h) => (s.week >= 23 && s.week <= 36 ? "Sıcak bir akşam; ağustos böcekleri bile yorgun." : s.week >= 48 || s.week <= 9 ? "Dışarıda soğuk bir rüzgâr var; kalorifer tıkırdıyor." : "Ilık bir akşam; hava ne sıcak ne soğuk.") + " Ne yapsan?",
    (s, h) => "Apartmanın merdiveninden " + HS.castName(s, "komsu") + " seslendi: \"Bu akşam sessiz bir akşam!\" Haklı.",
    (s, h) => "Telefonuna " + HS.castName(s, "enYakin") + " bir video atmış; gülerek düşündün: bu akşamı nasıl değerlendirsen?",
    (s, h) => (s.partner ? s.partner.name + " kitabına gömülmüş. " : "") + "Evde tatlı bir sessizlik var.",
    (s, h) => "Takvimde bu akşam için hiçbir şey yazmıyor. Nadir bir durum.",
    (s, h) => "Yağmur camlara vuruyor. İçerisi sıcak.",
    (s, h) => "Şarjın %100, enerjin %60. Plansız birkaç saat var.",
    (s, h) => "Mahalle bakkalının önünde " + HS.castName(s, "bakkal") + " ile göz göze geldin; o da sakin bir gün geçiriyor.",
  ];
  const TITLES_N = ["Boş bir akşam", "Sessiz bir gece", "Akşam üstü", "Kendine kalan saatler", "Sakin bir akşam", "Plansız bir gece"];
  const TITLES_D = ["Plansız bir gün", "Kendine kalan saatler", "Sakin bir öğleden sonra", "Boş bir öğle", "Nefes alınan bir gün"];
  HS.FALLBACK_EVENT = {
    id: "ordinary",
    title: (s, h) => h.pick(HS.isNight && HS.isNight(s) ? TITLES_N : TITLES_D),
    text: (s, h) => {
      // Son kullanılan girişleri tekrar etme
      const used = (s.freeOpen = s.freeOpen || []);
      let idx = OPEN.map((f, i) => i).filter((i) => !used.includes(i));
      if (!idx.length) idx = OPEN.map((f, i) => i);
      const i = idx[(Math.random() * idx.length) | 0];
      used.push(i);
      if (used.length > OPEN.length - 2) used.shift();
      return OPEN[i](s, h);
    },
    choices: (s, h) => {
      let pool = FREE.slice();
      if (s.partner) pool = pool.concat(PARTNER_FREE);
      if (s.children && s.children.length) pool = pool.concat(KID_FREE);
      // Son 18 seçenek gösterilmesin
      const used = (s.freeUsed = s.freeUsed || []);
      let fresh = pool.filter((x) => !used.includes(x[0]));
      if (fresh.length < 3) fresh = pool;
      const out = [];
      while (out.length < 3 && fresh.length) out.push(fresh.splice((Math.random() * fresh.length) | 0, 1)[0]);
      out.forEach((x) => used.push(x[0]));
      while (used.length > 18) used.shift();
      return out.map((x) => c(x[0], x[1], { ...x[2] }));
    },
  };

  HS.EVENTS.push(
    // ----- Aile evinden ayrılma -----
    {
      id: "moveOut",
      priority: 60,
      nag: true, // "biraz daha kal" denirse her seferinde daha geç tekrar sorulur
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
