(() => {
  "use strict";
  const $ = (id) => document.getElementById(id),
    KEY = "hayatSimulatuoruSavesV1",
    PAGES = ["home", "create", "world", "records"];
  let saves = [],
    active = null,
    look = "woman",
    selected = -1,
    event = null, // ekranda gösterilen olay (haftalık olay ya da sekme menüsü)
    weekEvent = null, // bu haftanın hikâye olayı; sekmeden HAYAT'a dönünce geri gelir
    onEventContinue = null,
    tab = "life";
  const RETIRE_AGE = 64,
    ARC_COOLDOWN = 156; // aynı yan hikâye en erken ~3 yıl sonra tekrar gelir
  // Hayat boyunca geçen toplam hafta (yıl içindeki 1–52 haftadan bağımsız).
  const lifeWeek = (s = active) => (s.history?.length || 0) + 1;
  const ECONOMY = {
    year: 2026,
    cpi: 0.2973,
    food: 0.2762,
    transport: 0.351,
    housing: 0.3999,
    minWage: 28075.5,
    rent: {
      İstanbul: 45510,
      Ankara: 34440,
      İzmir: 33369,
      Bursa: 28040,
      Adana: 28040,
      Trabzon: 28040,
      Diyarbakır: 28040,
    },
    homeSqm: {
      İstanbul: 67949,
      Ankara: 40417,
      İzmir: 54310,
      Bursa: 46681,
      Adana: 46681,
      Trabzon: 46681,
      Diyarbakır: 46681,
    },
    car: 1215000,
  };
  const JOBS = {
    none: { name: "İş arıyor", pay: 0, prop: "ODA" },
    cafe: { name: "Kafe çalışanı", pay: ECONOMY.minWage, prop: "KAFE" },
    factory: { name: "Fabrika işçisi", pay: 36000, prop: "FABRİKA" },
    music: { name: "Müzisyen", pay: 22000, prop: "SAHNE" },
    office: { name: "Ofis çalışanı", pay: 45000, prop: "OFİS" },
    crime: { name: "Gece işleri", pay: 52000, prop: "GECE" },
  };
  const STORIES = [
    {
      t: "Yeni bir çevre",
      p: "Mahallendeki küçük kitapçıda aynı kişiye üçüncü kez rastladın. Gülümseyip selam verebilir ya da kendi işine bakabilirsin.",
      c: [
        [
          "Selam ver",
          "Belki güzel bir tanışıklık başlar.",
          { m: 5, people: 1 },
        ],
        ["Sessizce geç", "Bugün kendi düşüncelerinle kal.", { m: 1 }],
      ],
    },
    {
      t: "Beklenmedik masraf",
      p: "Evdeki musluk gece boyunca damlatmış. Tamirci makul bir ücret istiyor; şimdilik kovayla da idare edebilirsin.",
      c: [
        ["Tamir ettir", "Bir daha aklında kalmasın.", { cash: -1800, m: 2 }],
        ["Sonra bakarım", "Bu hafta parayı elinde tut.", { m: -4 }],
      ],
    },
    {
      t: "Eski bir arkadaş",
      p: "Liseden bir arkadaşın mesaj attı. Uzun zamandır konuşmadınız; hafta sonu buluşmayı öneriyor.",
      c: [
        [
          "Buluşmaya git",
          "Eski dostluklara biraz vakit ayır.",
          { cash: -650, m: 8, people: 2 },
        ],
        ["Yoğun olduğunu söyle", "Bu hafta dinlenmeyi seç.", { m: -1 }],
      ],
    },
    {
      t: "Bir kurs ilanı",
      p: "Otobüs durağındaki ilanda kısa bir meslek kursu gördün. Ücreti bütçeni biraz zorlayacak ama yeni kapılar açabilir.",
      c: [
        [
          "Kursa yazıl",
          "Öğrenmek için şimdi küçük bir yatırım.",
          { cash: -3200, skill: 5, m: 4 },
        ],
        ["İlanın fotoğrafını çek", "Fırsat belki sonra da durur.", { m: 1 }],
      ],
    },
    {
      t: "Yağmurlu akşam",
      p: "Vardiyadan çıktığında yağmur başlamış. Eve erken gidebilir ya da bir arkadaşa uğrayıp çay içebilirsin.",
      c: [
        ["Eve dön", "Sıcak bir duş iyi gelecek.", { h: 2, m: 1 }],
        [
          "Çaya uğra",
          "Biraz sohbet bütün yorgunluğu aldı.",
          { cash: -180, m: 6, people: 1 },
        ],
      ],
    },
    {
      t: "Küçük birikim",
      p: "Hesabında az da olsa kenara koyduğun para var. Birikimi vadeli mevduata koyabilir ya da kendin için harcayabilirsin.",
      c: [
        ["Birikim yap", "Küçük bir güvence oluştur.", { save: 1, m: 1 }],
        [
          "Kendine yemek ısmarla",
          "Bazen bugünü de yaşamak gerekir.",
          { cash: -700, m: 7 },
        ],
      ],
    },
    {
      t: "Mahallede yeni biri",
      p: "Yeni taşınan komşun kolileri taşırken yardım istedi. İşten yorgunsun ama birkaç dakika ayırabilirsin.",
      c: [
        ["Yardım et", "Apartmanda bir tanıdığın olsun.", { m: 4, people: 2 }],
        ["Yarın selam ver", "Bugün biraz dinlen.", { h: 2 }],
      ],
    },
    {
      t: "Şehirde büyük haber",
      p: "Bu hafta ülke gündeminde seçim tartışmaları var. İnsanlar gelecekten kaygılı; sen de hesabını gözden geçiriyorsun.",
      c: [
        [
          "Biraz nakit kenara ayır",
          "Belirsizliğe karşı temkinli ol.",
          { save: 1, m: -1 },
        ],
        [
          "Günlük hayatına devam et",
          "Her şeyi kontrol etmek mümkün değil.",
          { m: 2 },
        ],
      ],
    },
    {
      t: "Bir teklif",
      p: "Tanıdığın biri hızlı para kazanabileceğin bir işten söz etti. Ayrıntıları belirsiz, ama teklifin cazibesi büyük.",
      c: [
        [
          "Daha fazlasını sor",
          "Riskleri öğrenmeden karar verme.",
          { m: 1, skill: 1 },
        ],
        [
          "Teklifi kabul et",
          "Kolay para bazen pahalıya patlar.",
          { job: "crime", m: -5, cash: 4500, crime: 1 },
        ],
      ],
    },
    {
      t: "Kendine zaman ayır",
      p: "Son haftalarda iş, masraflar ve başkalarının beklentileri arasında sıkıştın. Bu hafta kendin için bir şey seç.",
      c: [
        [
          "Uzun bir yürüyüşe çık",
          "Şehirle ve kendinle baş başa kal.",
          { h: 3, m: 5 },
        ],
        ["Evde dinlen", "Hiçbir şey yapmamak da ihtiyaçtır.", { h: 4, m: 2 }],
      ],
    },
    {
      t: "Piyasa dalgalandı",
      p: "Birikim hesabındaki yatırım fonu değer kaybetti. Satıp zararı kabul edebilir ya da dalgalanmayı bekleyebilirsin.",
      c: [
        ["Yatırımı boz", "Kalanı güvenceye al.", { cash: 500, m: -2 }],
        [
          "Beklemeyi seç",
          "Piyasa her zaman düz bir çizgi değil.",
          { m: -4, invest: 1 },
        ],
      ],
    },
    {
      t: "Uzaklardan haber",
      p: "Yakınlarından biri başka ülkeye taşınmış; sana da orada iş bulabileceğini söylüyor. Yeni bir hayat pahalı ve belirsiz.",
      c: [
        [
          "Başvuru için biriktir",
          "Yavaş yavaş yeni bir kapı aç.",
          { cash: -1800, m: 4, abroad: 1 },
        ],
        ["Burada kal", "Kurduğun düzeni sürdür.", { m: 2 }],
      ],
    },
  ];
  const AGE = {
    20: [
      "Yirmiler başlıyor",
      "Çevrendekiler ne yapacağını sorup duruyor. Herkesin yolunun başka olduğunu yavaş yavaş anlıyorsun.",
    ],
    25: [
      "Beş yıl geçti",
      "Geride kalan yıllar sana neyi sevdiğini, neyi artık istemediğini öğretti. Hayatın yeni bir ritim buluyor.",
    ],
    30: [
      "Yeni bir on yıl",
      "Otuzuna bastın. Bazı hayaller biçim değiştirdi; bazılarıysa ilk kez gerçekten mümkün görünüyor.",
    ],
    40: [
      "Kırklı yaşlar",
      "Zamanın kıymetini eskisinden iyi biliyorsun. Etrafındaki insanlar ve kurduğun düzen daha çok anlam taşıyor.",
    ],
    50: [
      "Yarım asırlık hayat",
      "Hayatının ilk elli yılına dönüp bakıyorsun. Biriktirdiklerin yalnızca para ve eşya değil.",
    ],
    60: [
      "Altmışıncı yaş günü",
      "Yeni yaşını kutlarken bedeninin bazı şeyler için daha fazla dinlenmeye ihtiyaç duyduğunu hissediyorsun.",
    ],
    70: [
      "Yetmiş yılın izleri",
      "Yüzünde yılların çizgileri, hafızanda sayısız hikâye var. Bir zamanlar verdiğin kararlar bugünkü hayatını kurdu.",
    ],
    80: [
      "Sekseninci bahar",
      "Günler daha sakin akıyor. Sevdiklerin yanında olduğunda sıradan bir çay bile bayram gibi.",
    ],
    90: [
      "Doksan yaşında",
      "Çok şey gördün, çok şey değişti. Şehir artık gençliğindeki gibi değil ama sabah ışığı hâlâ aynı.",
    ],
  };
  const PARTNER = {
    t: "Kalbin birine yakınlaştı",
    p: "Bir süredir görüştüğün kişiyle gelecek hakkında konuşmaya başladınız. Bu ilişkiye yer açmak istiyor musun?",
    c: [
      [
        "Birlikte deneyelim",
        "İlişkiniz ciddileşiyor.",
        { m: 12, people: 3, partner: 1 },
      ],
      ["Acele etmeyelim", "Biraz daha zamana ihtiyacınız var.", { m: 2 }],
    ],
  };
  const ARCS = [
    {
      ok: (s) => s.age < 24 && s.skill < 3,
      t: "Sınav sabahı",
      p: "Kaldığın yerde bir sertifika programının son başvuru günü. Ücreti az değil; yine de yeni bir beceri daha iyi iş kapısı açabilir.",
      c: [
        [
          "Sınava gir",
          "Birikiminin bir kısmını eğitime ayır.",
          { cash: -2400, skill: 3, m: 2 },
        ],
        ["Bu dönemi pas geç", "Önce düzenli gelir bul.", { m: 1 }],
      ],
    },
    {
      ok: (s) => s.job === "cafe",
      t: "Tezgâhın arkasında",
      p: "Müşteri siparişi yanlış aldığını söylüyor. Sorumlu kişi olayı duymamış; hatayı düzeltip özür dileyebilirsin ya da tartışabilirsin.",
      c: [
        [
          "Hata bende de, düzeltelim",
          "Güven kazandın; bahşiş biraz arttı.",
          { m: 2, cash: 650, people: 1 },
        ],
        [
          "Kameraya bakalım",
          "Hakkını savun ama ortam gerilsin.",
          { m: -2, skill: 1 },
        ],
      ],
    },
    {
      ok: (s) => s.job === "factory",
      t: "Vardiya çizelgesi değişiyor",
      p: "Usta başı seni gece vardiyasına almak istiyor. Ulaşım daha zor ama vardiya primi var.",
      c: [
        [
          "Gece vardiyasını kabul et",
          "Ek ücret, daha az uyku.",
          { cash: 1100, h: -2, skill: 1 },
        ],
        ["Gündüz kal", "Düzenini koru.", { m: 1 }],
      ],
    },
    {
      ok: (s) => s.job === "music",
      t: "Kayıt odasında fırsat",
      p: "Mahalledeki küçük kayıt odası bir şarkını kaydetmeyi önerdi. Ücretini karşılayabilir misin?",
      c: [
        [
          "Demo kaydet",
          "Sahneden önce kalıcı bir iz bırak.",
          { cash: -1700, skill: 2, m: 5 },
        ],
        [
          "Canlı çalmaya devam et",
          "Şimdilik masraf yapma.",
          { cash: 450, m: 1 },
        ],
      ],
    },
    {
      ok: (s) => s.job === "office",
      t: "Terfi konuşması",
      p: "Yöneticin yeni görev teklif ediyor. Daha yüksek ücret ihtimali var; karşılığında ekibin yükünü de üstleneceksin.",
      c: [
        [
          "Görüşmeye hazırlan",
          "Becerini göster ve zam iste.",
          { skill: 2, cash: 1800, m: 2 },
        ],
        [
          "Şimdiki rolümü koruyayım",
          "İş-özel hayat dengesini gözet.",
          { h: 2, m: 1 },
        ],
      ],
    },
    {
      ok: (s) => s.renting,
      t: "Ev sahibi kira artışı istedi",
      p: "Kira yenileme zamanı yaklaştı. İstenen artış bütçeni zorluyor; ev arkadaşı bulabilir ya da taşınmayı düşünebilirsin.",
      c: [
        [
          "Ev arkadaşı bul",
          "Mahremiyet azalır, gider paylaşılır.",
          { m: -1, rentCut: 0.5, people: 1 },
        ],
        [
          "Aile evine dön",
          "Bağımsızlığını ertele, borçtan kaçın.",
          { moveHome: 1, m: -3 },
        ],
      ],
    },
    {
      ok: (s) => s.cash < 10000 && s.debt > 0,
      t: "Ödeme günü yaklaşıyor",
      p: "Beklenmedik giderler birikmiş. Borç veren kuruluş yapılandırma teklif ediyor; toplam maliyet artacak ama haftalık baskı azalabilir.",
      c: [
        [
          "Ödemeyi planla",
          "Düzenli ödeme için yeni bütçe kur.",
          { m: 1, debtPlan: 1 },
        ],
        [
          "Bir yakından destek iste",
          "Yardım etmek ilişkide karşılık bulabilir.",
          { debtGift: 3000, people: 1, m: -1 },
        ],
      ],
    },
    {
      ok: (s) => s.age >= 30 && !s.assets.house,
      t: "İlk evin hayali",
      p: "Uzun süredir aynı evde yaşama fikri aklında. Konut fiyatları ve kredi maliyeti bunu kolaylaştırmıyor.",
      c: [
        [
          "Peşinat için biriktir",
          "Bankadaki birikime bu hafta katkı yap.",
          { save: 1, m: 2 },
        ],
        ["Kira düzenini sürdür", "Şimdilik esnek kal.", { m: 1 }],
      ],
    },
    {
      ok: (s) => s.age >= 45 && s.health < 70,
      t: "Kontrol sırası",
      p: "Doktorun düzenli kontrolleri aksatmamanı hatırlattı. Randevu ve tetkik masraflı; erken müdahale ise önemli olabilir.",
      c: [
        [
          "Randevu al",
          "Bütçenden sağlık payı ayır.",
          { cash: -2100, h: 8, m: 1 },
        ],
        ["Biraz daha bekle", "Şimdilik dinlenip takip et.", { h: -5 }],
      ],
    },
    {
      ok: (s) => s.partner && !s.children.length && s.age > 27,
      t: "Birlikte gelecek planı",
      p: "Partnerinle gelecek hakkında yeniden konuştunuz. Çocuk sahibi olmak bir seçenek; hayatınızda büyük sorumluluklar getirecek.",
      c: [
        [
          "Aileyi büyütelim",
          "Çocuğun adını bu karar belirlesin: Eylül.",
          { cash: -6500, m: 8, child: "Eylül" },
        ],
        [
          "Bir süre daha bekleyelim",
          "Birlikte geçireceğiniz zamana odaklan.",
          { m: 2 },
        ],
      ],
    },
    {
      ok: (s) => s.children.length > 0,
      t: "Okul etkinliği",
      p: (s) =>
        s.children[0] +
        "’in okulunda ailelerden küçük bir katkı isteniyor. İşte yoğun bir haftadasın ama bu onun için önemli.",
      c: [
        [
          "Etkinliğe git",
          "Vardiyanı değiştir, anı biriktir.",
          { cash: -700, m: 6, people: 2 },
        ],
        ["İşten çıkamıyorum", "Başka gün telafi et.", { cash: 500, m: -3 }],
      ],
    },
    {
      ok: (s) => s.age >= 58 && s.job !== "none",
      t: "Emeklilik hesabı",
      p: "Çalışma hayatının ileriki yılları için ne kadar kenara koyduğunu kontrol ettin. Bugünkü isteklerle gelecek güvencesi arasında denge kur.",
      c: [
        ["Düzenli katkı yap", "Bu haftaki harcamayı kıs.", { save: 1, m: -1 }],
        [
          "Kendime zaman ayır",
          "Emekliliği düşünürken bugünü de yaşa.",
          { m: 3 },
        ],
      ],
    },
    {
      ok: (s) => s.assets.car,
      t: "Araç masrafı",
      p: "Aracından alışılmadık bir ses geliyor. Bakımı şimdi yaptırmak pahalı, geciktirmek daha büyük masraf çıkarabilir.",
      c: [
        [
          "Bakım yaptır",
          "Bütçeyi zorla ama aracı koru.",
          { cash: -5200, m: 2 },
        ],
        [
          "Bir ay daha kullan",
          "Risk alıp bugünü kurtar.",
          { cash: -400, h: -1 },
        ],
      ],
    },
    {
      ok: (s) => s.assets.land,
      t: "Arsa için teklif",
      p: "Sahip olduğun arsaya ortaklık teklifi geldi. Teklif peşin para sağlayabilir ama kontrolün azalır.",
      c: [
        [
          "Teklifi kabul et",
          "Arsanın bir kısmını elden çıkar.",
          { cash: 90000, m: 2, landDeal: 1 },
        ],
        ["Teklifi reddet", "Uzun vadeli planında kal.", { m: 1 }],
      ],
    },
    {
      ok: (s) => s.abroad,
      t: "Yeni şehirde ilk kış",
      p: "Yeni ülkedeki kış beklediğinden daha uzun ve yalnız geçti. Bir kurs, yeni arkadaşlıklar kurmana yardım edebilir.",
      c: [
        [
          "Dil kursuna yazıl",
          "Masraf et, çevreni genişlet.",
          { cash: -3200, skill: 2, people: 2 },
        ],
        ["Evdekileri ara", "Uzaktaki bağlarını tazele.", { cash: -300, m: 5 }],
      ],
    },
    {
      ok: (s) => s.risk > 0,
      t: "Eski çevreden haber",
      p: "Geçmişte riskli işlere karıştığın biri yeniden aradı. Bu kez uzak durmak, eskiden yaptıklarının sonuçlarını ortadan kaldırmayacak.",
      c: [
        [
          "Açıkça hayır de",
          "Güvenli bir iş ara.",
          { job: "none", riskDown: 1, m: 3 },
        ],
        [
          "Bir kez daha kabul et",
          "Para kazan ama riskini büyüt.",
          { cash: 8000, crime: 1, h: -2 },
        ],
      ],
    },
    {
      ok: (s) => s.savings > 12000,
      t: "Banka danışmanı",
      p: "Kurmacadaki bankanın danışmanı, birikimini vadeli hesapta tutmanı öneriyor. Erken çekim getiriyi azaltabilir.",
      c: [
        [
          "Bir kısmını vadeye koy",
          "Güvenceyi artır, erişim azalır.",
          { save: 1, m: 1 },
        ],
        ["Parayı erişilebilir tut", "Beklenmedik olaylara hazır ol.", { m: 1 }],
      ],
    },
    {
      ok: (s) => s.age >= 18,
      t: "Hafta sonu pazarı",
      p: "Mahalle pazarında sebze meyve fiyatları bu hafta değişmiş. Toplu alışveriş daha ucuz ama çabuk bozulabilir.",
      c: [
        [
          "Haftalık alışverişi yap",
          "Daha az dışarıda ye.",
          { cash: -1250, h: 1, m: 2 },
        ],
        [
          "Az az al",
          "Nakitini koru, fiyat riskini üstlen.",
          { cash: -400, m: -1 },
        ],
      ],
    },
    {
      ok: (s) => s.age >= 18,
      t: "Toplu ulaşım kartı yenilemesi",
      p: "Aylık ulaşım gideri yükseldi. Kurmaca şehir içi ulaşım işletmesi yeni abonman sundu; peşin ödeme indirimli.",
      c: [
        [
          "Abonman al",
          "Peşin öde, sonraki haftalarda tasarruf et.",
          { cash: -1800, transitPass: 1 },
        ],
        [
          "Tek biniş kullan",
          "Esnek kal ama daha pahalıya gelebilir.",
          { m: -1 },
        ],
      ],
    },
    {
      ok: (s) => s.partner && s.mood < 60,
      t: "Birlikte konuşmak",
      p: "Son zamanlarda iş ve para konuşmalarınız tartışmaya dönüşüyor. Bir akşamı birbirinize ayırabilirsiniz.",
      c: [
        [
          "Dürüstçe konuş",
          "Birlikte bütçe ve beklentileri gözden geçir.",
          { m: 7, people: 2 },
        ],
        ["Konuyu ertele", "Gerginlik bir süre daha sürer.", { m: -3 }],
      ],
    },
    {
      ok: (s) => s.age >= 18,
      t: "Mahallede küçük dayanışma",
      p: "Apartman sakinleri kış öncesi ortak bakım için katkı topluyor. Vereceğin para bütçende hissedilir ama komşuluk ilişkisi güçlenir.",
      c: [
        ["Katkı ver", "Ortak alanı onarın.", { cash: -900, people: 2, m: 2 }],
        ["Bu ay katılamam", "Bütçeni koru.", { m: -1 }],
      ],
    },
  ];
  const ARCS_MORE = [
    {
      ok: (s) => s.job !== "none" && s.age < 62,
      t: "İş arkadaşının teklifi",
      p: "Bir iş arkadaşın birlikte küçük bir yan iş kurmayı önerdi. İlk yatırım ve zaman gerekiyor ama ek gelir getirebilir.",
      c: [
        [
          "Ortak ol",
          "Bir miktar para ve emek ayır.",
          { cash: -2600, skill: 2, people: 1 },
        ],
        ["Önce hesap yapalım", "Riskleri yazıya dök.", { skill: 1, m: 1 }],
      ],
    },
    {
      ok: (s) => s.job !== "none" && s.week % 5 === 0,
      t: "İş yerinde zor gün",
      p: "İş yeri bu ay bütçe kısıntısına gitti. Ekipten bir kişinin vardiyası azaltılacak; yöneticin fikrini soruyor.",
      c: [
        [
          "Dönüşümlü vardiya öner",
          "Yük herkes arasında paylaşılsın.",
          { people: 2, m: 2 },
        ],
        [
          "Kendi saatlerimi koruyayım",
          "Kendi geçimini güvenceye al.",
          { m: -1 },
        ],
      ],
    },
    {
      ok: (s) => s.age >= 18 && s.health < 90,
      t: "Diş ağrısı",
      p: "Bir süredir ertelediğin diş ağrısı bu hafta arttı. Tedavi masrafı can sıkıcı ama geciktirmek daha pahalı olabilir.",
      c: [
        ["Randevu al", "Sağlığa bütçeden pay ayır.", { cash: -2500, h: 5 }],
        ["Biraz daha bekle", "Bu hafta parayı koru.", { h: -5, m: -1 }],
      ],
    },
    {
      ok: (s) => s.age >= 18 && s.age < 50,
      t: "Akşam kursu",
      p: "Kurmaca halk merkezinde akşam kursu açılmış. Dersler işten sonra yorucu olacak ama yeni bir beceri öğrenebilirsin.",
      c: [
        [
          "Kursa katıl",
          "Zaman ve para yatırımı.",
          { cash: -1900, skill: 3, h: -1 },
        ],
        ["Bu dönem yoğun", "Şimdilik dinlen.", { h: 2 }],
      ],
    },
    {
      ok: (s) => s.children.length > 0,
      t: "Çocuğun büyüyor",
      p: (s) =>
        s.children[0] +
        " artık kendi kararlarını daha çok vermek istiyor. Birlikte zaman geçirmeniz ilişkinizi güçlendirebilir.",
      c: [
        [
          "Birlikte gün geçir",
          "İşten izin al, bağınızı güçlendir.",
          { cash: -900, m: 6, people: 2 },
        ],
        ["Bu haftayı ertele", "Başka bir gün için söz ver.", { m: -2 }],
      ],
    },
    {
      ok: (s) => s.partner,
      t: "Ortak bütçe",
      p: "Partnerin bu ay bütçeyi birlikte gözden geçirmeyi önerdi. Bazı harcamaları kısabilir ya da ortak bir hedef seçebilirsiniz.",
      c: [
        [
          "Bir hedef için biriktir",
          "Ortak birikim planı kur.",
          { save: 1, people: 1 },
        ],
        ["Harcama özgürlüğünü koru", "Kendi bütçenizi ayrı tutun.", { m: 1 }],
      ],
    },
    {
      ok: (s) => s.age >= 35 && s.age < 60,
      t: "Aileden destek isteği",
      p: "Ailenden biri geçici bir maddi sıkıntı yaşadığını söyledi. Yardım edebilirsin; ama kendi borcunu da göz önünde bulundurmalısın.",
      c: [
        [
          "Destek ol",
          "Bütçene göre katkı ver.",
          { cash: -1800, people: 2, m: 2 },
        ],
        [
          "Şu an gücüm yetmiyor",
          "İhtiyacını dinle, para sözü verme.",
          { people: 1, m: -1 },
        ],
      ],
    },
    {
      ok: (s) => s.age >= 18,
      t: "Elektrik faturası",
      p: "Kışın ilk soğuk günleri geldi. Isınma ve elektrik giderleri yükseldi; evde tüketimi azaltacak bir düzen kurabilirsin.",
      c: [
        [
          "Tasarruf düzeni kur",
          "Küçük bir harcamayla faturayı düşür.",
          { cash: -600, skill: 1 },
        ],
        ["Aynı şekilde devam et", "Bu ay rahatını bozma.", { cash: -950 }],
      ],
    },
    {
      ok: (s) => s.job === "none" && s.age < 64,
      t: "İş görüşmesi",
      p: "Başvurduğun yerden görüşme daveti geldi. Deneyimini net anlatman, ücret ve çalışma saatlerini konuşman gerekiyor.",
      c: [
        [
          "Ücret ve hakları sor",
          "Beklentini açıkça paylaş.",
          { job: "office", skill: 1, m: 2 },
        ],
        [
          "Hemen kabul et",
          "İş sahibi olmak şu an önceliğin.",
          { job: "factory", m: 1 },
        ],
      ],
    },
    {
      ok: (s) => s.age >= 18 && s.age < 30,
      t: "Taşınma fikri",
      p: "Yakın bir arkadaşın başka bir ilçeye taşınıyor ve ev arkadaşı arıyor. Yolun uzayabilir, kira giderin düşebilir.",
      c: [
        [
          "Birlikte eve çık",
          "Paylaşımlı kira düzenine geç.",
          // true = depozito + ilk ay, oyuncunun o anki şehrine göre apply() içinde hesaplanır
          { rentStart: true, m: 3, people: 1 },
        ],
        ["Şimdiki düzenimde kal", "Değişiklik için hazır değilsin.", { m: 1 }],
      ],
    },
    {
      ok: (s) => s.assets.house,
      t: "Evin bakım masrafı",
      p: "Banyodaki boruda kaçak başladı. Ertelemek alt kata zarar verebilir; usta hemen gelebileceğini söylüyor.",
      c: [
        [
          "Onarımı yaptır",
          "Şimdi öde, büyük zararı önle.",
          { cash: -8500, m: 1 },
        ],
        [
          "Bir süre gözle",
          "Nakit sende kalsın, risk al.",
          { cash: -1200, m: -2 },
        ],
      ],
    },
    {
      ok: (s) => s.age >= 18 && s.age < 45,
      t: "Spor alışkanlığı",
      p: "Mahalle parkında ücretsiz yürüyüş grubu kurulmuş. Düzenli katılım sağlık ve moraline iyi gelebilir.",
      c: [
        [
          "Katılmaya başla",
          "Haftada bir akşam ayır.",
          { h: 3, m: 4, people: 1 },
        ],
        ["Kendi başıma yürürüm", "Programını kendin belirle.", { h: 2, m: 1 }],
      ],
    },
    {
      ok: (s) => s.age >= 62,
      t: "Emeklilik düzeni",
      p: "Çalışma hayatı yavaşladı. Günün yapısını koruyacak bir uğraş bulmak, kendini iyi hissetmene yardımcı olabilir.",
      c: [
        [
          "Gönüllü çalış",
          "Mahallede haftada bir katkı ver.",
          { m: 5, people: 2, h: 1 },
        ],
        ["Evde dinlen", "Daha sakin bir düzen kur.", { h: 3, m: 1 }],
      ],
    },
    {
      ok: (s) => s.age >= 18,
      t: "Mahalle kütüphanesi",
      p: "Mahalledeki kurmaca kütüphane geç saatlere kadar açık kalmak için gönüllü arıyor. İstersen bir akşam kitapları düzenleyebilirsin.",
      c: [
        ["Gönüllü ol", "Yeni insanlarla tanış.", { people: 2, m: 3 }],
        ["Bir kitap ödünç al", "Bu hafta kendine sakin zaman ayır.", { m: 2 }],
      ],
    },
    {
      ok: (s) => s.invest > 0,
      t: "Piyasa sert geriledi",
      p: "Endeks fonun bu hafta değer kaybetti. Dalgalanma geçici olabilir, ama yatırımın hiçbir zaman garanti değil.",
      c: [
        [
          "Fonun bir kısmını sat",
          "Zararı kabul edip riski düşür.",
          { sellInvestment: 0.5, m: -1 },
        ],
        ["Beklemeyi seç", "Kısa vadeli inişe rağmen kal.", { m: -2 }],
      ],
    },
    {
      ok: (s) => s.age >= 18,
      t: "Küçük kutlama",
      p: "Bu hafta uzun zamandır beklediğin bir güzel haber aldın. Sevdiklerinle küçük bir kutlama yapmak ister misin?",
      c: [
        [
          "Kutlama yap",
          "Biraz para harca, birlikte anı biriktir.",
          { cash: -1100, m: 6, people: 2 },
        ],
        ["Sade tut", "Bir kahveyle kutlayın.", { cash: -250, m: 3 }],
      ],
    },
    {
      ok: (s) => s.age >= 40 && s.job !== "none",
      t: "Kariyer değişikliği",
      p: "Mesleğinde edindiğin deneyim başka bir alanda işe yarayabilir. Eğitim için zaman ayırırsan geçiş yapabilirsin.",
      c: [
        [
          "Yeni beceri öğren",
          "Gelir düşebilir, seçeneklerin artar.",
          { cash: -3500, skill: 4, m: 2 },
        ],
        ["Mevcut işimde kal", "Tanıdık düzeni sürdür.", { m: 1 }],
      ],
    },
    {
      ok: (s) => s.debt > 0,
      t: "Borç yapılandırma teklifi",
      p: "Kurmaca kredi kuruluşunun borç danışmanı, ödemeleri yeniden düzenlemeyi öneriyor.",
      c: [
        [
          "Danışmanla plan yap",
          "Ödemeyi zamana yay, toplam maliyet artsın.",
          { debtPlan: 1, m: 1 },
        ],
        ["Teklifi reddet", "Mevcut planında kal.", { m: -1 }],
      ],
    },
    {
      ok: (s) => s.age >= 18,
      t: "Şehirde yoğun trafik",
      p: "Yol çalışması yüzünden işe gidiş süren uzadı. Daha erken çıkabilir, toplu ulaşım kartı alabilir veya bu hafta evden çalışma isteyebilirsin.",
      c: [
        ["Erken yola çık", "Uykundan biraz feragat et.", { h: -1 }],
        [
          "Evden çalışma iste",
          "Yöneticin kabul ederse yol masrafı azalır.",
          { cash: 250, m: 2 },
        ],
      ],
    },
    {
      ok: (s) => s.age >= 18,
      t: "Bir yakınının düğünü",
      p: "Uzun süredir görmediğin bir yakının düğün davetiyesi geldi. Yol ve hediye masrafı var ama aile bağları için önemli.",
      c: [
        [
          "Düğüne git",
          "Masraf et, akrabalarla buluş.",
          { cash: -2200, people: 2, m: 4 },
        ],
        ["Tebrik mesajı gönder", "Bu kez bütçeni koru.", { m: -1, people: 1 }],
      ],
    },
    {
      ok: (s) => s.age >= 20 && s.age < 65,
      t: "Yeni bir iş ilanı",
      p: "Daha iyi ücretli bir iş ilanı gördün. Başvurmak, mevcut iş yerinde güvensizlik yaratmadan yapılabilir.",
      c: [
        [
          "Başvuru yap",
          "Yeni bir fırsatın kapısını arala.",
          { skill: 1, m: 2 },
        ],
        ["İlanı kaydet", "Önce özgeçmişini güncelle.", { skill: 1 }],
      ],
    },
    {
      ok: (s) => s.age >= 18,
      t: "Kıyıda kısa bir tatil",
      p: "İki günlük bir sahil kaçamağı planlayabilirsin. Biraz masraflı ama uzun zamandır ara vermedin.",
      c: [
        ["Tatile çık", "Harca ve dinlen.", { cash: -3200, h: 5, m: 8 }],
        [
          "İzin gününü evde geçir",
          "Ücretsiz ama yine de dinlenebilirsin.",
          { h: 3, m: 3 },
        ],
      ],
    },
    {
      ok: (s) => s.age >= 18,
      t: "Birikim hedefi",
      p: "Kendine küçük bir hedef koydun: düzenli kenara para ayırmak. Bu hafta hedefe bağlı kalmak istiyor musun?",
      c: [
        ["Hedefe katkı yap", "Bütçenden ₺1.000 ayır.", { save: 1, skill: 1 }],
        ["Bu ay ara ver", "Kendine biraz esneklik tanı.", { m: 1 }],
      ],
    },
    {
      ok: (s) => s.renting && s.debt > 0,
      t: "Kira ve borç aynı haftaya geldi",
      p: "Kira yenilemesiyle borç ödemen aynı döneme denk geldi. Ev arkadaşı payını artırabilir ya da başka eve taşınabilirsin.",
      c: [
        [
          "Bütçeyi birlikte yap",
          "Ev arkadaşıyla giderleri konuş.",
          { rentCut: 0.85, m: 1, people: 1 },
        ],
        [
          "Daha ucuz eve bak",
          "Taşınma masrafı var ama kira düşebilir.",
          { cash: -2400, rentCut: 0.75, m: -1 },
        ],
      ],
    },
  ];
  function load() {
    try {
      saves = JSON.parse(localStorage.getItem(KEY) || "[]");
    } catch {
      saves = [];
    }
    if (!Array.isArray(saves)) saves = [];
  }
  function save() {
    if (!active) return;
    let i = saves.findIndex((x) => x.id === active.id);
    if (i < 0) saves.push(active);
    else saves[i] = active;
    try {
      localStorage.setItem(KEY, JSON.stringify(saves));
    } catch {
      toast("Cihazda kayıt alanı kalmamış olabilir.");
    }
  }
  function page(id) {
    PAGES.forEach((x) => $(x).classList.toggle("hidden", x !== id));
    $("event").classList.add("hidden");
    $("backBtn").style.visibility = id === "home" ? "hidden" : "visible";
    $("menuBtn").style.visibility = id === "world" ? "visible" : "hidden";
  }
  function cash(n) {
    return "₺" + Math.round(n).toLocaleString("tr-TR");
  }
  function esc(s) {
    return String(s).replace(
      /[&<>"']/g,
      (x) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[x],
    );
  }
  function begin() {
    const first = $("firstName").value.trim() || "Deniz",
      last = $("lastName").value.trim() || "Yılmaz";
    active = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2),
      first,
      last,
      city: $("birthCity").value,
      look,
      age: 18,
      year: 2026,
      week: 1,
      cash: 10000,
      health: 82,
      mood: 65,
      job: "none",
      hair: "short",
      beard: false,
      transplanted: false,
      skill: 0,
      people: 0,
      debt: 0,
      risk: 0,
      retired: false,
      renting: false,
      policy: "neutral",
      partner: false,
      married: false,
      children: [],
      savings: 0,
      invest: 0,
      assets: { house: false, car: false, land: false, passport: false },
      abroad: false,
      history: [],
      alive: true,
      ending: null,
      lastAge: 0,
      lastEvent: "",
    };
    saves.push(active);
    save();
    page("world");
    newWeek(true);
  }
  function records() {
    let box = $("recordList");
    box.innerHTML = "";
    if (!saves.length)
      box.innerHTML =
        '<div class="record"><div><h3>Henüz kayıt yok</h3><p>İlk hayatını oluşturarak başlayabilirsin.</p></div></div>';
    saves.forEach((s, i) => {
      let d = document.createElement("div");
      d.className = "record";
      d.innerHTML =
        "<div><h3>" +
        esc(s.first + " " + s.last) +
        "</h3><p>" +
        esc(s.city) +
        " · " +
        s.age +
        " yaş · " +
        esc(JOBS[s.job]?.name || "") +
        " · " +
        (s.alive ? "Devam ediyor" : "Tamamlandı") +
        '</p></div><button data-id="' +
        s.id +
        '">' +
        (s.alive ? "DEVAM ET" : "ANI DEFTERİ") +
        "</button>";
      box.append(d);
    });
    box.querySelectorAll("[data-id]").forEach(
      (b) =>
        (b.onclick = () => {
          active = saves.find((s) => s.id === b.dataset.id);
          if (!active.alive) ending();
          else resume();
        }),
    );
    page("records");
  }
  function renderLife() {
    let s = active;
    if (!s) return;
    $("personName").textContent = s.first + " " + s.last;
    $("slotPill").textContent = "HAYAT " + (saves.indexOf(s) + 1);
    $("ageTag").textContent = s.age + " YAŞ";
    $("cashStat").textContent = cash(s.cash);
    $("healthStat").textContent = "♡ " + s.health;
    $("moodStat").textContent = "☼ " + s.mood;
    $("dateLabel").textContent =
      s.city.toLocaleUpperCase("tr-TR") + " · " + s.year;
    $("weekLabel").textContent = s.week + ". HAFTA";
    let ch = $("character");
    ch.style.setProperty(
      "--scale",
      String(1 - Math.max(0, s.age - 18) * 0.0015),
    );
    ch.style.setProperty(
      "--gray",
      Math.max(0, Math.min(100, (s.age - 30) * 1.6)) + "%",
    );
    ch.className =
      "character " +
      s.look +
      " " +
      s.job +
      " hair-" +
      (s.hair || "short") +
      (s.beard ? " beard" : "") +
      (s.transplanted ? " transplanted" : "");
    ch.parentElement.className = "character-wrap scene-" + s.job;
    $("roomProp").innerHTML = s.assets?.house
      ? "⌂<small>EVİM</small>"
      : s.assets?.car
        ? "▰<small>ARABAM</small>"
        : (s.job === "none"
            ? "▤"
            : s.job === "music"
              ? "♫"
              : s.job === "cafe"
                ? "☕"
                : s.job === "factory"
                  ? "⚙"
                  : "▣") +
          "<small>" +
          JOBS[s.job].prop +
          "</small>";
    document
      .querySelectorAll(".tab")
      .forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
  }
  function scenarioRate(base, year = active.year) {
    return year <= 2026
      ? base
      : Math.max(
          0.045,
          base * Math.pow(0.84, year - 2026) + Math.sin(year * 1.2) * 0.018,
        );
  }
  function inflation() {
    return scenarioRate(ECONOMY.cpi);
  }
  function categoryRate(k) {
    return scenarioRate(ECONOMY[k]);
  }
  function indexFor(k) {
    let idx = 1;
    for (let y = 2026; y < active.year; y++)
      idx *= 1 + scenarioRate(ECONOMY[k], y);
    return idx;
  }
  function homePrice() {
    return (ECONOMY.homeSqm[active.city] || 46681) * 70 * indexFor("housing");
  }
  function rentPrice() {
    return (
      (ECONOMY.rent[active.city] || 28040) *
      0.35 *
      (active.rentMultiplier || 1) *
      indexFor("housing")
    );
  }
  function wage(job) {
    let idx = 1;
    for (let y = 2026; y < active.year; y++)
      idx *= 1 + Math.max(0.04, scenarioRate(ECONOMY.cpi, y) * 0.9);
    return JOBS[job].pay * idx;
  }
  // Emekli maaşı: çalışmış olana son işinin ücretinin %60'ı, hiç çalışmamışa
  // asgari ücretin %40'ı kadar sosyal destek (oyun varsayımı).
  function pension() {
    return active.worked
      ? wage(active.lastJob || "cafe") * 0.6
      : wage("cafe") * 0.4;
  }
  function choices(list) {
    selected = -1;
    $("choices").innerHTML = "";
    list.forEach((c, i) => {
      let b = document.createElement("button");
      b.className = "choice";
      b.innerHTML =
        '<span class="bullet">' +
        String.fromCharCode(65 + i) +
        "</span><span><b>" +
        esc(c[0]) +
        "</b><small>" +
        esc(c[1]) +
        "</small></span>";
      b.onclick = () => {
        selected = i;
        $("choices")
          .querySelectorAll(".choice")
          .forEach((x, j) => x.classList.toggle("selected", j === i));
        $("advanceBtn").disabled = false;
      };
      $("choices").append(b);
    });
    $("advanceBtn").disabled = true;
  }
  function jobEvent() {
    // İşsizken her hafta değil, ilk haftalarda ve sonra 3 haftada bir iş ilanı gelir;
    // aradaki haftalarda diğer hikâyeler de görünebilsin. Emekliye iş ilanı gelmez.
    if (
      active.job === "none" &&
      !active.retired &&
      active.age < RETIRE_AGE &&
      (lifeWeek() <= 3 || active.week % 3 === 1)
    )
      return {
        t: "İş arama haftası",
        p: "Bu hafta üç farklı ilan dikkatini çekti. Hangi gündelik hayatı denemek istersin?",
        c: [
          [
            "Kafeye başvur",
            "İnsanlarla iç içe. Başlangıç maaşı " + cash(wage("cafe")) + ".",
            { job: "cafe" },
          ],
          [
            "Fabrikaya başvur",
            "Düzenli vardiya. Başlangıç maaşı " + cash(wage("factory")) + ".",
            { job: "factory" },
          ],
          [
            "Sahne işlerini kovala",
            "Müzik yakınında, gelir değişken.",
            { job: "music" },
          ],
        ],
      };
    if (active.job === "factory" && active.week % 7 === 0)
      return {
        t: "Fazla mesai",
        p: "Hat sorumlusu hafta sonu vardiyası için gönüllü arıyor. Para işine yarar ama son haftalarda yeterince dinlenmedin.",
        c: [
          [
            "Mesaiye kal",
            "Ek gelir ve biraz yorgunluk.",
            { cash: 2600, h: -5 },
          ],
          ["Dinlenme gününü koru", "Bedenine kulak ver.", { h: 4, m: 2 }],
        ],
      };
    if (active.job === "cafe" && active.week % 6 === 0)
      return {
        t: "Kafenin yoğun günü",
        p: "Beklenmedik bir grup geldi; ekipten biri hastalanmış. Servisi tek başına toparlayabilir ya da destek isteyebilirsin.",
        c: [
          [
            "Servisi üstlen",
            "Zor gün, işin fark edildi.",
            { cash: 1400, h: -2, skill: 2 },
          ],
          ["Destek iste", "Ekip olmak da işin parçası.", { m: 2, people: 1 }],
        ],
      };
    if (active.job === "music" && active.week % 4 === 0)
      return {
        t: "Sahne ışıkları",
        p: "Bir mekânın sahibi seni dinledi. Daha çok gece çalıp tanınmayı deneyebilirsin ya da düzenli programında kalabilirsin.",
        c: [
          [
            "Yeni mekânda çal",
            "Daha çok kazanç, daha geç saatler.",
            { cash: 2800, m: 8, skill: 2 },
          ],
          [
            "Düzenli sahnene dön",
            "Kendi kitleni kur.",
            { cash: 900, m: 4, skill: 1 },
          ],
        ],
      };
    if (active.job === "crime" && active.week % 9 === 0)
      return {
        t: "Gece telefon çaldı",
        p: "Seni bu çevreye sokan kişi bir iş daha öneriyor. Para iyi; risk de büyüyor.",
        c: [
          [
            "Kabul et",
            "Riskli para ve ağır bedel.",
            { cash: 7200, h: -4, m: -6, crime: 1 },
          ],
          [
            "Uzaklaş",
            "Kolay olmayacak ama çıkış arayacaksın.",
            { job: "none", m: 5 },
          ],
        ],
      };
  }

  // Kayıttan devam ederken yarım kalan haftanın olayını geri getirir.
  function resume() {
    page("world");
    tab = "life";
    if (active.current) {
      weekEvent = active.current;
      renderLife();
      showEvent(weekEvent);
    } else newWeek(true);
  }
  function showEvent(ev) {
    event = ev;
    $("storyTitle").textContent = ev.t;
    $("storyText").textContent = ev.p;
    $("storyTags").innerHTML =
      '<span class="tag">' +
      esc(active.city) +
      '</span><span class="tag">' +
      esc(active.retired ? "Emekli" : JOBS[active.job].name) +
      "</span>" +
      (active.partner ? '<span class="tag">Bir ilişki</span>' : "") +
      (active.children.length ? '<span class="tag">Aile</span>' : "");
    choices(ev.c);
  }
  function newWeek(first = false) {
    if (!active || !active.alive) return;
    tab = "life";
    renderLife();
    $("weather").textContent = [
      "☁ SERİN",
      "☼ AÇIK",
      "☂ YAĞMURLU",
      "≋ RÜZGÂRLI",
    ][(Math.random() * 4) | 0];
    let ev = null;
    if (!ev && !first && active.week % 52 === 1 && active.week > 1) {
      active.year++;
      active.week = 1;
      if (
        active.year >= 2028 &&
        active.year % 4 === 0 &&
        active.lastElection !== active.year
      ) {
        active.lastElection = active.year;
        ev = {
          t: "Seçim haftası",
          p: "Kurmaca seçim döneminde iki aday farklı gelecek öneriyor. Aven Ral toplu ulaşımı desteklemeyi; Sera Mavek küçük işletmelere vergi indirimi vermeyi vaat ediyor.",
          c: [
            [
              "Aven Ral’ın ulaşım planı",
              "Ulaşım giderlerine destek ver.",
              { policy: "transit", m: 2 },
            ],
            [
              "Sera Mavek’in üretim planı",
              "İşletmelere destek, çalışanlara ücret takviyesi.",
              { policy: "enterprise", m: 1 },
            ],
          ],
        };
      } else
        ev = {
          t: active.year + " yılı başlıyor",
          p:
            "Yeni yılda genel fiyat düzeyi varsayımsal olarak %" +
            Math.round(inflation() * 100) +
            " değişti. Gıda, ulaşım ve konutun artış hızı ayrı hesaplanıyor.",
          c: [["Yıla başla", "Planlarını yeni koşullara göre yap.", { m: 1 }]],
        };
    }
    if (!ev && !first && AGE[active.age] && active.lastAge !== active.age) {
      active.lastAge = active.age;
      ev = {
        t: AGE[active.age][0],
        p: AGE[active.age][1],
        c: [["Yoluna devam et", "Geçmişi yanına alıp ilerle.", { m: 3 }]],
      };
    }
    if (!ev && !first) ev = jobEvent();
    if (
      !ev &&
      !first &&
      active.age >= 24 &&
      !active.partner &&
      lifeWeek() % 39 === 0 &&
      active.mood > 40
    )
      ev = { ...PARTNER };
    if (
      !ev &&
      !first &&
      active.partner &&
      !active.children.length &&
      active.age >= 28 &&
      lifeWeek() % 73 === 0
    )
      ev = {
        t: "Aileniz büyüyebilir",
        p: "Partnerinle çocuk sahibi olma ihtimali gündeminize geldi. Bu büyük sorumluluğa hazır mısınız?",
        c: [
          [
            "Ada",
            "Ailenize yeni bir hayat katılıyor.",
            { cash: -5000, m: 10, child: "Ada" },
          ],
          [
            "Ege",
            "Ailenize yeni bir hayat katılıyor.",
            { cash: -5000, m: 10, child: "Ege" },
          ],
          [
            "Lina",
            "Ailenize yeni bir hayat katılıyor.",
            { cash: -5000, m: 10, child: "Lina" },
          ],
          [
            "Başka bir ad seç",
            "Çocuğunun adını kendin yaz.",
            { cash: -5000, m: 10, child: "CUSTOM" },
          ],
          ["Şimdilik bekleyelim", "Bu dönemi birlikte yaşayın.", { m: 2 }],
        ],
      };
    if (
      !ev &&
      !first &&
      active.partner &&
      active.married === false &&
      active.age >= 25 &&
      lifeWeek() % 137 === 0
    )
      ev = {
        t: "Birlikte bir gelecek",
        p: "Partnerinle ilişkinizi resmileştirmeyi konuşuyorsunuz. Düğün büyük ya da küçük olabilir; karar ve masraf size ait.",
        c: [
          [
            "Küçük bir kutlama yap",
            "Kurmaca nikâh ve kutlama için bütçe ayır.",
            { cash: -8500, m: 8, married: 1 },
          ],
          [
            "Şimdilik bekleyelim",
            "Birbirinize bağlılığınızı böyle de sürdürebilirsiniz.",
            { m: 1 },
          ],
        ],
      };
    if (
      !ev &&
      !first &&
      active.partner &&
      active.children.length > 0 &&
      active.children.length < 3 &&
      active.age >= 30 &&
      lifeWeek() % 211 === 0
    )
      ev = {
        t: "Aileniz yeniden büyüyebilir",
        p: "Partnerinle ikinci bir çocuk ihtimalini konuştunuz. Bu kez önceki deneyimleriniz de kararınıza yön veriyor.",
        c: [
          [
            "Bir isim seç",
            "Çocuğuna Ada adını ver.",
            { cash: -4500, m: 7, child: "Ada" },
          ],
          [
            "Kendi adımı yaz",
            "İsim seçimini kendin yap.",
            { cash: -4500, m: 7, child: "CUSTOM" },
          ],
          [
            "Şimdilik hayır",
            "Ailenizin şimdiki düzeni size yetiyor.",
            { m: 1 },
          ],
        ],
      };
    if (
      !ev &&
      !first &&
      active.age >= 50 &&
      lifeWeek() % 87 === 0 &&
      active.health < 76
    )
      ev = {
        t: "Bedenin yavaşlamanı istiyor",
        p: "Bir süredir yorgunluk geçmiyor. Doktor kontrole gelmeni önerdi. Randevu masraflı ama sağlığını ertelemek istemiyorsun.",
        c: [
          [
            "Kontrole git",
            "Erken davranmak içini rahatlattı.",
            { cash: -2800, h: 10, m: 2 },
          ],
          ["Şimdilik dinlen", "Belirtileri takip et.", { h: -7, m: -2 }],
        ],
      };
    if (
      !ev &&
      !first &&
      active.age >= 21 &&
      !active.abroad &&
      lifeWeek() % 101 === 0
    )
      ev = {
        t: "Başka bir ülkede fırsat",
        p: "Yurt dışında iş bulma ihtimali belirdi. Yeni bir ülke, yeni başlangıç; ama yol masraflı ve belirsiz.",
        c: [
          active.assets.passport
            ? [
                "Pasaportum var, taşın",
                "Berlin’de yeni bir düzen kur.",
                { city: "Berlin", cash: -6500, abroad: 1, m: 5 },
              ]
            : [
                "Pasaport çıkar",
                "Önce başvuru masrafını karşıla.",
                { passport: 1, cash: -1800 },
              ],
          ["Burada kal", "Kurduğun hayatı sürdür.", { m: 2 }],
        ],
      };
    if (!ev && !first && active.savings > 0 && lifeWeek() % 31 === 0)
      ev = {
        t: "Birikimin büyüyor",
        p: "Banka hesabındaki birikim faiz kazandı. Vadede tutarsan küçük bir ek getiri alırsın ya da bir kısmını bugünkü ihtiyacın için çekebilirsin.",
        c: [
          ["Vadede tut", "Güvenceyi koru, ek faiz al.", { interest: 1 }],
          [
            "Bir kısmını çek",
            "Birikimin %40’ını bugünkü ihtiyacına harca.",
            { save: -1 },
          ],
        ],
      };
    // Yan hikâyeler: her biri en fazla ARC_COOLDOWN haftada bir gelir.
    // Eski kayıtlarda arcSeen bir diziydi; nesneye çevrilir.
    if (!ev && !first && Math.random() < 0.75) {
      if (Array.isArray(active.arcSeen) || !active.arcSeen)
        active.arcSeen = Object.fromEntries(
          (active.arcSeen || []).map((t) => [t, lifeWeek()]),
        );
      let now = lifeWeek(),
        candidates = ARCS.concat(ARCS_MORE).filter(
          (a) =>
            a.ok(active) &&
            !(now - (active.arcSeen[a.t] ?? -Infinity) < ARC_COOLDOWN),
        );
      if (candidates.length) {
        let a = candidates[(Math.random() * candidates.length) | 0];
        active.arcSeen[a.t] = now;
        ev = {
          t: a.t,
          p: typeof a.p === "function" ? a.p(active) : a.p,
          c: a.c,
        };
      }
    }
    if (!ev && !first) {
      let pool = STORIES.filter((x) => x.t !== active.lastStory);
      let x = pool[(Math.random() * pool.length) | 0];
      active.lastStory = x.t;
      ev = { t: x.t, p: x.p, c: x.c.map((y) => [...y]) };
    }
    if (!ev && first && lifeWeek() === 1)
      ev = {
        t: "İlk hafta",
        p:
          active.first +
          ", " +
          active.city +
          "’deki aile evinde 18 yaşına bastın. Cebinde " +
          cash(active.cash) +
          " var. Önünde koca bir hayat; ilk adımı nereden atacaksın?",
        c: [
          [
            "Hemen iş aramaya başla",
            "Önce düzenli bir gelir.",
            { m: 1, skill: 1 },
          ],
          [
            "Bir hafta kendine ayır",
            "Biraz dinlen, şehri dolaş.",
            { cash: -400, m: 5, h: 1 },
          ],
          [
            "Bir kursa yazıl",
            "Erken yaşta beceri edin.",
            { cash: -2500, skill: 4, m: 2 },
          ],
        ],
      };
    weekEvent = ev || {
      t: "Sıradan bir hafta",
      p: "Yeni bir haftaya uyandın. Hayat küçük seçimlerle yön değiştiriyor.",
      c: [["Günlük düzenine devam et", "Bu hafta sakin geçsin.", { m: 1 }]],
    };
    active.current = weekEvent;
    showEvent(weekEvent);
    save();
  }
  function apply(e) {
    if (e.child === "CUSTOM") {
      let nm = prompt("Çocuğunun adı ne olsun?");
      if (!nm || !nm.trim()) return false;
      e = { ...e, child: nm.trim().slice(0, 24) };
    }
    if (e.buy) {
      if (active.cash < e.cost) {
        toast("Bu varlık için yeterli paran yok.");
        return false;
      }
      active.assets[e.buy] = true;
      active.cash -= e.cost;
    }
    if (e.passport) active.assets.passport = true;
    if (e.city) active.city = e.city;
    if (e.rentStart) {
      if (active.renting || active.assets.house) {
        toast("Zaten kendi düzenin var.");
        return false;
      }
      let cost = e.rentStart === true ? 2 * rentPrice() : e.rentStart;
      if (active.cash < cost) {
        toast("Taşınmak için depozito ve ilk kira yeterli değil.");
        return false;
      }
      active.renting = true;
      active.rentMultiplier = 1;
      active.cash -= cost;
    }
    if (e.moveHome) {
      active.renting = false;
      active.rentMultiplier = 1;
    }
    if (e.policy) active.policy = e.policy;
    // Kira indirimleri birikir ama kira tam dairenin payının %40'ının altına inmez.
    if (e.rentCut && active.renting)
      active.rentMultiplier = Math.max(
        0.4,
        (active.rentMultiplier || 1) * e.rentCut,
      );
    if (e.debtPlan) active.debtPlan = true;
    if (e.debtGift) active.debt = Math.max(0, active.debt - e.debtGift);
    if (e.riskDown) active.risk = Math.max(0, active.risk - e.riskDown);
    if (e.transitPass) active.transitPass = 10;
    if (e.landDeal) active.assets.land = false;
    if (e.hair) active.hair = e.hair;
    if (e.beard !== undefined) active.beard = e.beard;
    if (e.transplant) {
      if (active.cash < e.transplant) {
        toast("Bu işlem için yeterli paran yok.");
        return false;
      }
      active.cash -= e.transplant;
      active.transplanted = true;
    }
    if (e.cash) {
      let next = active.cash + e.cash;
      if (next < 0) {
        active.debt = (active.debt || 0) - next;
        active.cash = 0;
      } else active.cash = next;
    }
    if (e.h) active.health = Math.max(0, Math.min(100, active.health + e.h));
    if (e.m) active.mood = Math.max(0, Math.min(100, active.mood + e.m));
    if (e.skill) active.skill += e.skill;
    if (e.people) active.people += e.people;
    if (e.partner) active.partner = true;
    if (e.married) active.married = true;
    if (e.breakup) {
      active.partner = false;
      active.married = false;
    }
    if (e.child) active.children.push(e.child);
    if (e.job) {
      if (active.retired && e.job !== "none") {
        toast("Emekliliğin başladı; artık çalışmıyorsun.");
        return false;
      }
      active.job = e.job;
      if (e.job !== "none") {
        active.worked = true;
        active.lastJob = e.job;
      }
    }
    if (e.abroad) active.abroad = true;
    if (e.save) {
      if (e.save > 0 && active.cash >= 1000) {
        active.cash -= 1000;
        active.savings += 1000;
      } else if (e.save < 0 && active.savings) {
        active.cash += Math.round(active.savings * 0.4);
        active.savings *= 0.6;
      }
    }
    // Vadede tutma bonusu: yıllık oranın ~%5'i kadar tek seferlik ek getiri.
    if (e.interest)
      active.savings += Math.round(active.savings * inflation() * 0.05);
    if (e.investment && active.cash >= e.investment) {
      active.cash -= e.investment;
      active.invest += e.investment;
    }
    if (e.sellInvestment && active.invest > 0) {
      let share = active.invest * e.sellInvestment;
      active.invest -= share;
      active.cash += share;
    }
    if (e.crime) active.risk = (active.risk || 0) + e.crime;
    return true;
  }
  function advance() {
    if (selected < 0 || !event) return;
    let c = event.c[selected];
    if (apply(c[2] || {}) === false) return;
    active.history.push({
      age: active.age,
      year: active.year,
      week: active.week,
      story: event.t,
      choice: c[0],
      effect: c[2] || {},
    });
    let inf = inflation(),
      baseExpense = active.job === "none" ? 2200 : 3000;
    let expense =
      baseExpense * 0.55 * indexFor("food") +
      baseExpense * 0.3 * indexFor("transport") +
      baseExpense * 0.15 * indexFor("cpi");
    if (active.assets.house) expense *= 0.48;
    if (active.assets.car) expense += 650 * indexFor("transport");
    if (active.renting) expense += rentPrice() / 4.345;
    if (active.transitPass > 0) {
      expense -= 210;
      active.transitPass--;
    }
    let afterBill = active.cash - expense;
    if (afterBill < 0) {
      active.debt = (active.debt || 0) - afterBill;
      active.cash = 0;
      active.mood = Math.max(0, active.mood - 1);
    } else active.cash = afterBill;
    let income =
      active.job !== "none"
        ? (wage(active.job) / 4.345) * (1 + active.skill * 0.006)
        : active.retired
          ? pension() / 4.345
          : 0;
    if (active.debt > 0) {
      active.debt *=
        1 + (scenarioRate(ECONOMY.cpi) * (active.debtPlan ? 0.65 : 1)) / 52;
      let pay = Math.min(active.debt, income * 0.3);
      active.debt -= pay;
      income -= pay;
    }
    active.cash += income;
    if (active.policy === "transit") active.cash += 280;
    if (active.policy === "enterprise" && active.job !== "none")
      active.cash += 190;
    // Mevduat: yıllık getiri enflasyonun ~%90'ı, haftaya bölünür.
    if (active.savings)
      active.savings += Math.round((active.savings * inf * 0.9) / 52);
    if (active.invest)
      active.invest = Math.max(
        0,
        active.invest * (1 + (Math.random() - 0.49) * 0.025),
      );
    if (active.week % 52 === 0) {
      active.age++;
      if (active.age >= 44)
        active.health = Math.max(0, active.health - (active.age >= 70 ? 2 : 1));
      if (active.age >= RETIRE_AGE && !active.retired) {
        active.retired = true;
        active.job = "none";
        toast("Emekli oldun. Bundan sonra emekli maaşı alacaksın.");
      }
    }
    active.week++;
    if (active.health <= 0) {
      finish("health");
      return;
    }
    if (active.age >= 100) {
      finish("age");
      return;
    }
    if (
      active.age >= 84 &&
      Math.random() < 0.008 + (100 - active.health) * 0.0005
    ) {
      finish("age");
      return;
    }
    if (active.cash === 0 && active.week % 8 === 0)
      active.mood = Math.max(0, active.mood - 4);
    if (active.risk > 2 && Math.random() < 0.025) {
      finish("crime");
      return;
    }
    if (active.mood <= 0 && active.health < 15) {
      finish("crisis");
      return;
    }
    save();
    newWeek();
    renderLife();
    if (active.history.length % 26 === 0) halfYear();
  }
  // Her 26 haftada bir kısa ara özet.
  function halfYear() {
    let s = active;
    cutscene(
      "Altı ay daha geçti",
      s.first +
        ", " +
        s.age +
        " yaşındasın. Nakit " +
        cash(s.cash) +
        ", banka " +
        cash(s.savings) +
        (s.debt > 0 ? ", borç " + cash(s.debt) : "") +
        ". Sağlığın " +
        s.health +
        ", mutluluğun " +
        s.mood +
        ". " +
        (s.retired
          ? "Emekli maaşınla günlerini kendi ritminde geçiriyorsun."
          : s.job === "none"
            ? "Henüz düzenli bir işin yok."
            : JOBS[s.job].name + " olarak çalışıyorsun."),
    );
  }
  function cutscene(title, text, art, next = null) {
    $("eventTitle").textContent = title;
    $("eventText").textContent = text;
    $("eventArt").textContent =
      art || ["✳", "☼", "◒", "♫", "♡"][(Math.random() * 5) | 0];
    onEventContinue = next;
    $("event").classList.remove("hidden");
  }
  function finish(reason) {
    active.alive = false;
    active.ending = reason;
    save();
    ending();
  }
  function hashEnd(input) {
    let a = 1779033703,
      b = 3144134277,
      c = 1013904223,
      d = 2773480762;
    for (let i = 0; i < input.length; i++) {
      let k = input.charCodeAt(i);
      a = Math.imul(a ^ k, 597399067);
      b = Math.imul(b ^ k, 2869860233);
      c = Math.imul(c ^ k, 951274213);
      d = Math.imul(d ^ k, 2716044179);
    }
    a = Math.imul(a ^ (b >>> 0), 597399067);
    b = Math.imul(b ^ (c >>> 0), 2869860233);
    c = Math.imul(c ^ (d >>> 0), 951274213);
    d = Math.imul(d ^ (a >>> 0), 2716044179);
    return [a >>> 0, b >>> 0, c >>> 0, d >>> 0]
      .map((x) => x.toString(36))
      .join("");
  }
  function ending() {
    let s = active,
      w = s.ending || "age",
      h = s.history || [],
      score = {
        career: 0,
        family: 0,
        care: 0,
        risk: 0,
        journey: 0,
        craft: 0,
        community: 0,
        security: 0,
      };
    h.forEach((x) => {
      let e = x.effect || {};
      if (e.skill) score.career += e.skill;
      if (e.job) score.career += 4;
      if (e.partner || e.child) score.family += 5;
      if (e.h > 0) score.care += e.h;
      if (e.crime) score.risk += 5;
      if (e.abroad || e.city) score.journey += 4;
      if (e.investment || e.save || e.buy) score.security += 3;
      if (e.people) score.community += e.people;
      if (/sahne|müzik|şiir/i.test(x.choice || "")) score.craft += 3;
    });
    let path = Object.entries(score).sort((a, b) => b[1] - a[1])[0][0],
      career = [...h].reverse().find((x) => x.effect?.job)?.effect.job || s.job,
      ageBand =
        s.age < 25
          ? "18-24"
          : s.age < 30
            ? "25-29"
            : s.age < 40
              ? "30lar"
              : s.age < 50
                ? "40lar"
                : s.age < 60
                  ? "50ler"
                  : s.age < 70
                    ? "60lar"
                    : s.age < 80
                      ? "70ler"
                      : s.age < 90
                        ? "80ler"
                        : "90lar",
      net = s.cash + (s.savings || 0) + (s.invest || 0) - (s.debt || 0),
      moneyBand =
        net < 0
          ? "borç"
          : net < 25000
            ? "kısıtlı"
            : net < 250000
              ? "birikim"
              : net < 2500000
                ? "rahat"
                : "varlıklı",
      healthBand =
        s.health < 25
          ? "kırılgan"
          : s.health < 55
            ? "yıpranmış"
            : s.health < 80
              ? "dengeli"
              : "dinç",
      moodBand =
        s.mood < 25
          ? "umutsuz"
          : s.mood < 50
            ? "durgun"
            : s.mood < 75
              ? "umutlu"
              : "neşeli",
      assets =
        (s.assets.house ? 1 : 0) +
        (s.assets.car ? 2 : 0) +
        (s.assets.land ? 4 : 0) +
        (s.assets.passport ? 8 : 0),
      family = s.partner
        ? s.children.length
          ? s.married
            ? "evli-ebeveyn"
            : "partner-çocuk"
          : s.married
            ? "evli"
            : "partner"
        : s.children.length
          ? "tek-ebeveyn"
          : "yalnız",
      riskBand =
        (s.risk || 0) === 0 ? "temiz" : s.risk < 3 ? "riskli" : "yüksek-risk",
      appearance =
        (s.hair || "short") +
        (s.beard ? "sakal" : "") +
        (s.transplanted ? "ekim" : ""),
      ageLength =
        h.length < 52
          ? "ilk yıl"
          : h.length < 260
            ? "gençlik"
            : h.length < 520
              ? "orta yaş"
              : "uzun yaşam",
      profile = hashEnd(
        [
          ageBand,
          career,
          family,
          s.city,
          assets,
          moneyBand,
          healthBand,
          moodBand,
          path,
          w,
          ageLength,
          riskBand,
          appearance,
          s.policy || "nötr",
          s.children.join(","),
          h.map((x) => x.story + ":" + x.choice).join(">"),
        ].join("|"),
      );
    let discovered = [];
    try {
      discovered = JSON.parse(
        localStorage.getItem("hayatSimEndingProfilesV1") || "[]",
      );
    } catch {}
    if (!discovered.includes(profile)) {
      discovered.push(profile);
      try {
        localStorage.setItem(
          "hayatSimEndingProfilesV1",
          JSON.stringify(discovered),
        );
      } catch {}
    }
    s.endingProfile = profile;
    save();
    let phrase = {
      career: "Öğrenme ve çalışma kararların hayatının omurgası oldu.",
      family:
        "En belirleyici dönemeçlerin sevdiklerinle kurduğun bağlardan çıktı.",
      care: "Kendini ve sağlığını gözettiğin seçimler yolunu değiştirdi.",
      risk: "Riskli çevrelerle ilişkin hayatında kalıcı izler bıraktı.",
      journey: "Yeni yerler ve değişim arayışı hayatının rotasını çizdi.",
      craft: "Üretmek ve sahnede ya da işinde iz bırakmak seni ileri taşıdı.",
      community: "Çevrendeki insanlara verdiğin önem hikâyenin parçası oldu.",
      security: "Birikim ve güvence arayışın kararlarını biçimlendirdi.",
    }[path];
    let p = [
      s.first +
        " " +
        s.last +
        ", " +
        s.city +
        "’de başlayan hayatında " +
        s.age +
        " yaşına ve " +
        h.length +
        " haftalık karara ulaştı.",
      phrase,
      "Hayatının sonunda " +
        (s.partner ? "partnerinle " : "") +
        (s.children.length ? "çocuklarınla " : "") +
        (s.partner || s.children.length ? "yaşadın." : "tek başına yaşadın.") +
        " Maddi durumun " +
        moneyBand +
        ", sağlığın " +
        healthBand +
        ", ruh hâlin " +
        moodBand +
        " idi.",
    ];
    h.filter(
      (x) =>
        x.effect &&
        (x.effect.job ||
          x.effect.child ||
          x.effect.partner ||
          x.effect.married ||
          x.effect.crime ||
          x.effect.abroad ||
          x.effect.buy ||
          x.effect.skill >= 3),
    )
      .slice(-4)
      .forEach((v) =>
        p.push(
          "Hayatında iz bırakan bir dönemeç «" +
            v.story +
            "» haftasında «" +
            v.choice +
            "» demesiydi.",
        ),
      );
    [
      0,
      Math.floor(h.length * 0.25),
      Math.floor(h.length * 0.5),
      Math.floor(h.length * 0.75),
      h.length - 1,
    ]
      .filter((i, j, a) => i >= 0 && a.indexOf(i) === j)
      .map((i) => h[i])
      .filter(Boolean)
      .forEach((v) =>
        p.push(
          v.age +
            " yaşında «" +
            v.story +
            "» sırasında «" +
            v.choice +
            "» dedi.",
        ),
      );
    if (s.worked)
      p.push(
        "İş geçmişinde " +
          JOBS[career]?.name.toLocaleLowerCase("tr-TR") +
          " dönemi önemli yer tuttu.",
      );
    if (s.assets.house) p.push("Kendi evini aldı.");
    if (s.assets.car) p.push("Kendi aracıyla yollara çıktı.");
    if (s.assets.land) p.push("Geleceği için arsa edindi.");
    if (s.abroad) p.push("Başka bir ülkede de yeni bir düzen kurdu.");
    if (s.debt > 0) p.push("Son hesabında " + cash(s.debt) + " borç kaldı.");
    if (s.children.length)
      p.push("Çocukları " + s.children.join(", ") + " onu sevgiyle anıyor.");
    cutscene(
      w === "health"
        ? "Bir hayatın son sayfası"
        : w === "crime"
          ? "Bir kararın ağır bedeli"
          : w === "chosen"
            ? "Bu hayatı burada kapattın"
            : w === "crisis"
              ? "Ağır bir dönemin sonu"
              : "Dolu dolu bir ömür",
      p.join(" ") +
        " Bu cihazda keşfedilen farklı son profili: " +
        discovered.length +
        " / 100.000.",
      w === "age" ? "☼" : "✿",
      records,
    );
  }
  function toast(t) {
    $("toast").textContent = t;
    $("toast").classList.remove("hidden");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => $("toast").classList.add("hidden"), 2000);
  }
  function tabView(t) {
    tab = t;
    if (t === "life") {
      renderLife();
      if (weekEvent) showEvent(weekEvent);
      return;
    }
    let title = "",
      body = "",
      opts = [];
    if (t === "work") {
      title = active.job === "none" ? "İş ve geçim" : "İş yerindeki hayat";
      body =
        active.job === "none"
          ? "İş seçimin gelirini ve işte karşılaşacağın olayları değiştirir. 2026 başlangıç ücretlerinde kafe işi net asgari ücret varsayımı kullanır."
          : "Meslek: " +
            JOBS[active.job].name +
            ". Tahmini haftalık gelir " +
            cash(wage(active.job) / 4.345) +
            ".";
      opts =
        active.job === "none"
          ? [
              [
                "Kafede çalış",
                "Aylık net yaklaşık " + cash(JOBS.cafe.pay) + ".",
                { job: "cafe" },
              ],
              [
                "Fabrikaya gir",
                "Aylık ücret tahmini " + cash(JOBS.factory.pay) + ".",
                { job: "factory" },
              ],
              ["Müzisyen ol", "Sahne geliri değişken.", { job: "music" }],
            ]
          : [
              ["Bu işi sürdür", "İş rutinine devam et.", { m: 1 }],
              ["Yeni iş ara", "Başka kariyer yolu dene.", { skill: 1 }],
            ];
    } else if (t === "city") {
      title = "Şehir ve dünya";
      body =
        active.city +
        "’de yaşıyorsun. Yeni daire ilanlarının ortalaması " +
        cash(ECONOMY.rent[active.city] || 28040) +
        "/ay. Ev arkadaşı payı oyunda bunun %35’i kabul edilir. Bu 2026 başlangıç tahminidir.";
      opts = [
        ["Şehrimde kal", "Kurulu düzenini sürdür.", { m: 1 }],
        ["Şehri keşfet", "Yeni mahalle gör.", { cash: -350, m: 3, people: 1 }],
        active.assets.passport
          ? [
              "Berlin’e taşın",
              "Yurt dışında yeni düzen kur.",
              { city: "Berlin", cash: -6500, abroad: 1, m: 5 },
            ]
          : [
              "Pasaport çıkar",
              "Yurt dışı planlarına hazırlan.",
              { passport: 1, cash: -1800 },
            ],
      ];
    } else if (t === "people") {
      title = "Yakınlar ve kişisel bakım";
      body =
        (active.partner
          ? "Hayatını paylaştığın biri var. "
          : "Şimdilik partnerin yok. ") +
        (active.children.length
          ? "Çocukların: " + active.children.join(", ") + ". "
          : "") +
        "İlişkilerine zaman ayır veya görünüşünü değiştirmek için berbere uğra.";
      opts = [
        [
          "Bir yakını ara",
          "İlişkilerine zaman ayır.",
          { cash: -120, m: 5, people: 1 },
        ],
        ["Kendime vakit ayır", "Biraz dinlen.", { h: 2, m: 1 }],
        [
          "Saçını kısalt",
          "Berber ücreti ₺500.",
          { hair: "short", cash: -500, m: 1 },
        ],
        [
          "Saçını uzat",
          "Yeni bir görünüm; bakım ₺500.",
          { hair: "long", cash: -500, m: 1 },
        ],
        [
          "Sakalını değiştir",
          "Berberde bakım ₺350.",
          { beard: !active.beard, cash: -350, m: 1 },
        ],
        [
          "Saç ekimi yaptır",
          "Kalıcı işlem, oyun bedeli ₺85.000.",
          { transplant: 85000, m: 3 },
        ],
      ];
    } else {
      title = "Ev, araç ve birikimler";
      body =
        "Nakit " +
        cash(active.cash) +
        " · Borç " +
        cash(active.debt || 0) +
        " · Banka " +
        cash(active.savings) +
        " · Endeks fonu " +
        cash(active.invest) +
        ". Kira " +
        (active.renting ? cash(rentPrice()) + "/ay" : "ailenin yanında 0 TL") +
        ". Ev " +
        (active.assets.house ? "var" : "yok") +
        " · araç " +
        (active.assets.car ? "var" : "yok") +
        " · arsa " +
        (active.assets.land ? "var" : "yok") +
        ". Tahmini ev (" +
        active.city +
        ", 70 m²): " +
        cash(homePrice()) +
        ".";
      let base = [
        [
          "Ev satın al",
          "Şehirde 70 m² ortalama ilan değerine göre.",
          { buy: "house", cost: homePrice() },
        ],
        [
          "Araç satın al",
          "Markasız giriş sınıfı araç tahmini.",
          { buy: "car", cost: ECONOMY.car * indexFor("transport") },
        ],
        [
          "Arsa al",
          "Oyun içi yaklaşık değer.",
          { buy: "land", cost: homePrice() * 0.14 },
        ],
        ["Birikim yap", "₺1.000 bankaya aktar.", { save: 1 }],
        [
          "Endeks fonu al",
          "₺1.000 yatır; değer haftalık oynar.",
          { investment: 1000 },
        ],
      ];
      opts = active.assets.house
        ? [
            ["Eve bakım yap", "Onarım bütçesi ayır.", { cash: -12000, m: 2 }],
            ...base.slice(3),
          ]
        : base;
      if (active.renting)
        opts.unshift([
          "Aile evine dön",
          "Kira giderini kaldır.",
          { moveHome: 1 },
        ]);
      else if (!active.assets.house)
        opts.unshift([
          "Ev arkadaşıyla kiraya çık",
          "Depozito ve ilk ay payı: " + cash(2 * rentPrice()) + ".",
          { rentStart: 2 * rentPrice() },
        ]);
    }
    event = { t: title, p: body, c: opts };
    $("storyTitle").textContent = title;
    $("storyText").textContent = body;
    $("storyTags").innerHTML =
      '<span class="tag">' + t.toLocaleUpperCase("tr-TR") + "</span>";
    choices(opts);
    $("choices")
      .querySelectorAll(".choice")
      .forEach((b, i) => {
        let e = opts[i][2];
        if (e?.buy && active.cash < e.cost) b.disabled = true;
        if (e?.investment && active.cash < e.investment) b.disabled = true;
        if (e?.rentStart && active.cash < e.rentStart) b.disabled = true;
        if (e?.transplant && active.cash < e.transplant) b.disabled = true;
      });
    document
      .querySelectorAll(".tab")
      .forEach((b) => b.classList.toggle("active", b.dataset.tab === t));
  }
  $("newLife").onclick = () => page("create");
  $("recordNew").onclick = () => page("create");
  $("continueLife").onclick = records;
  $("menuBtn").onclick = records;
  $("beginLife").onclick = begin;
  $("advanceBtn").onclick = advance;
  $("slotPill").onclick = records;
  $("recordBack").onclick = () => (active?.alive ? resume() : page("home"));
  $("backBtn").onclick = () =>
    !$("world").classList.contains("hidden") ? records() : page("home");
  document.querySelectorAll(".look").forEach(
    (b) =>
      (b.onclick = () => {
        look = b.dataset.look;
        document
          .querySelectorAll(".look")
          .forEach((x) => x.classList.toggle("selected", x === b));
      }),
  );
  document
    .querySelectorAll(".tab")
    .forEach((b) => (b.onclick = () => tabView(b.dataset.tab)));
  $("eventContinue").onclick = () => {
    $("event").classList.add("hidden");
    let next = onEventContinue;
    onEventContinue = null;
    if (next) next();
    else if (active?.alive) renderLife();
  };
  $("endCurrent").onclick = () => {
    if (
      active?.alive &&
      confirm(
        "Bu hayatı burada sonlandırıp anı defterine kaydetmek istiyor musun?",
      )
    )
      finish("chosen");
  };
  load();
  page("home");
})();
