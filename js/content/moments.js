// Anlar: hayat boyunca en fazla bir kez gelen kısa, tek adımlık olaylar.
// Her biri farklı bir konu; kalıcı tanıdıklar (HS.cast), akrabalar, partner, eşyalar,
// şehir ve bayraklarla bağlantılı. Kimlikler "a_" ile başlar.
(function (HS) {
  "use strict";
  const c = (label, hint, fx = {}) => ({ label, hint, fx });
  const A = (id, room, o) => ({ id: "a_" + id, once: true, weight: 0.4, room, ...o });

  // ---- Koşul yardımcıları ----
  const TR = (s) => !s.abroad;
  const IST = (s) => !s.abroad && s.city === "İstanbul";
  const SEA = (s) => !s.abroad && ["İstanbul", "İzmir", "Antalya", "Mersin", "Samsun", "Trabzon", "Bursa", "Muğla", "Aydın", "Çanakkale", "Tekirdağ", "Kocaeli", "Balıkesir"].includes(s.city);
  const WORK = (s) => s.job !== "none" && !s.retired;
  const LEGAL = (s) => WORK(s) && s.job !== "crime";
  const OWN = (s) => s.housing !== "aile" && !s.abroad;
  const RENT = (s) => (s.housing === "kira" || s.housing === "kira-paylasim") && !s.abroad;
  const CAR = (s) => !!s.car && s.car !== "bisiklet";
  const WK = (a, b) => (s) => s.week >= a && s.week <= b;
  const has = (s, k) => (s.items || []).includes(k);
  const kin = (s, ...rels) => (s.kin || []).find((k) => k.alive && rels.includes(k.rel));
  const kinOld = (s) => kin(s, "anneanne", "babaanne", "dede");
  const kidOf = (s, lo, hi) => (s.children || []).find((k) => s.year - k.born >= lo && s.year - k.born <= hi);
  const P = (s) => s.partner && s.partner.name;
  const cast = (s, r) => HS.cast(s, r);
  const nm = (s, r) => HS.cast(s, r).name;
  const hn = (s, r) => {
    const x = HS.cast(s, r);
    return x.name + (x.woman ? " Hanım" : " Bey");
  };
  const ab = (s, r) => {
    const x = HS.cast(s, r);
    return x.name + (x.woman ? " Abla" : " Abi");
  };
  const KB = (k, v) => (k ? { kinBond: { id: k.id, v } } : {});
  // Dini bayramlar her yıl ~11 gün geriye kayar (2026: Ramazan Bayramı 20 Mart ≈ 12. hafta).
  const feastWeek = (s, add = 0) => {
    const w = Math.round(12 + add - ((s.year - 2026) * 10.9) / 7);
    return (((w - 1) % 52) + 52) % 52 + 1;
  };
  const nearFeast = (s, add = 0) => {
    const d = Math.abs(s.week - feastWeek(s, add));
    return Math.min(d, 52 - d) <= 1;
  };
  const winter = (s) => s.week <= 8 || s.week >= 50;
  const summer = WK(26, 35);

  HS.EVENTS.push(
    // =================== SOKAK: yemek, ulaşım, hava ===================
    A("simitci", "sokak", {
      when: TR,
      title: "Son simit",
      text: (s, h) => h.pick([
        "Köşedeki simitçinin tablasında tek simit kalmış. Arkanda bekleyen yaşlı amca da ona bakıyor.",
        "Sabahın yedisi; simitçi \"son sıcak simit\" diye bağırıyor. Sıradaki yaşlı bir teyze cüzdanını arıyor.",
        "Tabladaki son simit susamını dökerek seni çağırıyor. Hemen arkanda torunuyla bir dede var.",
      ]),
      choices: [
        c("Al, kendin ye", "₺25 · karnın doyar", { cost: 25, m: 1, h: 0.5 }),
        c("Onların hesabını da öde", "₺50 · küçük bir iyilik", { cost: 50, m: 3, people: 0.5, esteem: 1 }),
        c("Sırayı ver, sen poğaçacıya git", "₺40 · biraz geç kalırsın", { cost: 40, stress: 1, m: 1 }),
      ],
    }),
    A("metrobus", "sokak", {
      when: (s) => IST(s) && (WORK(s) || s.edu === "ogrenci"),
      title: "Metrobüs durağı",
      text: (s, h) => h.pick([
        "Sabah 08.10. Metrobüs geliyor; kapı açılınca içerideki insanlar dışarı taşmak üzere.",
        "Durakta dalga dalga insan. Üç metrobüs dolu geçti, dördüncüsü de pek umut vermiyor.",
        "Turnikeden geçtin, peronda omuz omuza. İçeri girersen camla yüzün arasında bir karış kalacak.",
      ]),
      choices: (s) => [
        c("Kendini içeri at", "Zamanında varırsın · stres +", { stress: 4, h: -0.5 }),
        c("Bir sonrakini bekle", s.edu === "ogrenci" && !WORK(s) ? "İlk derse geç kalırsın" : "Geç kalırsın · performans −", WORK(s) ? { perf: -1, stress: 1 } : { m: -1, stress: 1 }),
        c("Taksiye bin", "₺650 · rahat ama trafik", { cost: 650, stress: -1 }),
      ],
    }),
    A("vapur", "sokak", {
      when: IST,
      title: "Vapurda martılar",
      text: (s, h) => h.pick([
        "Karşıya geçiyorsun. Çay bardağı elinde, martılar vapurun kıçında havada asılı duruyor.",
        "Vapurun açık güvertesinde yer buldun. Rüzgâr sert ama manzara her şeye değer.",
        "Akşam vapuru; gün batımı Kız Kulesi tarafına pembe bir ışık bırakmış.",
      ]),
      choices: (s) => [
        c("Çay al, manzarayı seyret", "₺35 · stres −", { cost: 35, stress: -4, m: 2 }),
        c("Martılara simit at", "₺25 · keyif ama yasak tabelası var", { cost: 25, m: 3 }),
        has(s, "kitap") ? c("Kitabını aç", "Yolculuk verimli geçer", { skill: 0.5, stress: -2 }) : c("Telefona gömül", "Vakit geçer, manzara kaçar", { m: -1 }),
      ],
    }),
    A("dolmus", "sokak", {
      when: TR,
      title: "Dolmuşta para zinciri",
      text: (s, h) => "Arka koltuktan uzanan bozuklukları önce sana verdiler. " + h.pick([
        "\"İki tam bir öğrenci, şoför bey!\" Para üstü geri geldiğinde eksik olduğu belli.",
        "Şoföre ilettin; dönen para üstünü arkaya verirken birisi \"benim yirmi lira eksik\" diyor.",
        "Para dört elden geçip şoföre ulaştı; üstü dönerken yarısı yere düştü.",
      ]),
      choices: [
        c("Şoförle hesabı tek tek konuş", "Haklı çıkarsın ama herkes bekler", { stress: 2, people: 0.5, sk: { iletisim: 0.3 } }),
        c("Eksik parayı cebinden tamamla", "₺20 · ortalık sakinleşir", { cost: 20, m: 1, esteem: 1 }),
        c("Hiç karışma, camdan bak", "Kimse senden memnun değil", { m: -1 }),
      ],
    }),
    A("kar", "sokak", {
      when: (s) => TR(s) && winter(s),
      title: (s) => (HS.ek(s.city, "loc") + " kar"),
      text: (s, h) => h.pick([
        "Gece boyunca lapa lapa yağmış; sabah her yer bembeyaz. Valilik okulları tatil etti.",
        "Kar diz boyu. Sokakta çocuklar kardan adam yapıyor, arabalar zincir takıyor.",
        "Sabah perdeyi açınca şaşırdın: kar yağmış ve hâlâ yağıyor. Kaldırımlar buz tutmuş.",
      ]),
      choices: (s) => [
        c("Kartopu savaşına katıl", "Moral + · biraz üşüyebilirsin", { m: 5, h: -1, people: 1 }),
        c(HS.castName(s, "komsu") + " ile kapının önünü kür", "Kaldırım açılır, komşuluk ısınır", { rel: { komsu: 4 }, h: 1, stress: 1 }),
        c("Battaniye, sahlep, pencere", "₺120 · evde keyif", { cost: 120, stress: -4, kg: 0.1 }),
      ],
    }),
    A("sicakDalga", "salon", {
      when: (s) => summer(s),
      title: "Sıcak dalgası",
      text: (s, h) => h.pick([
        "Termometre 41 dereceyi gösteriyor. Gece bile ev fırın gibi.",
        "Meteoroloji turuncu uyarı vermiş: bu hafta sıcaklık mevsim normallerinin çok üstünde.",
        "Asfalt eriyor, sinekler bile gölgeye kaçmış. Uyumak imkânsız.",
      ]),
      choices: (s) => has(s, "klima")
        ? [
            c("Klimayı gece gündüz çalıştır", "₺1.400 elektrik · uyku düzelir", { cost: 1400, stress: -3, h: 1 }),
            c("26 derecede tut, idareli kullan", "Biraz terlersin", { stress: 1, skill: 0.3 }),
            c("Komşuyu serinlemeye çağır", "Klimasız komşu minnettar", { rel: { komsu: 5 }, people: 1, cost: 300 }),
          ]
        : [
            c("Vantilatör al", "₺1.900 · rahatlarsın", { cost: 1900, stress: -3, m: 1 }),
            c("Islak çarşaf, buzlu su", "Bedava ama uykusuz", { sleep: 3, stress: 2 }),
            c("Gününü AVM'de geçir", "₺400 · serin ama harcatır", { cost: 400, m: 1 }),
          ],
    }),
    A("semsiye", "sokak", {
      when: (s) => TR(s) && (WK(10, 20)(s) || WK(40, 48)(s)),
      title: "Tek şemsiye",
      text: (s, h) => h.pick([
        "Bardaktan boşanırcasına yağıyor. Durakta şemsiyesi olmayan biri ıslanıyor; sende büyük bir şemsiye var.",
        "Sağanak birden bastırdı. Yanındaki kişi çantasını başına tutmuş, sana bakıyor.",
      ]),
      choices: [
        c("Şemsiyeyi paylaş, sohbet et", "Yeni bir tanıdık", { people: 1.5, m: 2 }),
        c("Şemsiyeyi ona ver, koş", "İyilik yapmanın keyfi · ıslanırsın", { m: 3, h: -1, esteem: 2 }),
        c("Kendi yoluna bak", "Kuru kalırsın", { m: -1 }),
      ],
    }),
    A("kokorec", "sokak", {
      when: (s) => TR(s) && s.age < 60,
      title: "Gece yarısı kokoreç",
      text: (s, h) => h.pick([
        "Gece 01.00. Köşedeki kokoreççinin ızgarası tütüyor; " + nm(s, "enYakin") + " seni dürtüyor.",
        nm(s, "enYakin") + " ile eve dönüyorsunuz. Kokoreççi \"son porsiyonlar\" diye sesleniyor.",
      ]),
      choices: [
        c("Yarım ekmek, bol kekik", "₺280 · keyif + sağlık −", { cost: 280, m: 4, h: -1, kg: 0.2, rel: { enYakin: 2 } }),
        c("Çeyrek alıp paylaşın", "₺150 · dengeli", { cost: 150, m: 2, rel: { enYakin: 1 } }),
        c("Kendini tut, eve git", "Sabah midene teşekkür edersin", { h: 1, m: -1 }),
      ],
    }),
    A("lahmacun", "salon", {
      when: (s) => TR(s),
      title: "Lahmacun akşamı",
      text: (s) => nm(s, "enYakin") + " kapıda: \"Bugün maaş günüydü, lahmacun benden!\" diyor. Ama geçen sefer de o ısmarlamıştı.",
      choices: [
        c("Bu sefer sen ısmarla", "₺700 · ilişki güçlenir", { cost: 700, m: 3, rel: { enYakin: 5 }, people: 0.5 }),
        c("Yarı yarıya bölüşün", "₺350 · adil", { cost: 350, m: 2, rel: { enYakin: 2 } }),
        c("Kabul et, teşekkür et", "Bedava ama bir borç gibi kalır", { m: 2, rel: { enYakin: -2 } }),
      ],
    }),
    A("evYemegi", "mutfak", {
      when: (s) => s.housing !== "aile" && !!kin(s, "anne"),
      title: "Annemin dolması",
      text: (s, h) => {
        const k = kin(s, "anne");
        return h.pick([
          k.name + " sana iki saklama kabı dolma, bir kavanoz tarhana göndermiş. Not: \"Kapları geri getir.\"",
          "Kapıya bir koli geldi: " + HS.ek(k.name, "gen") + " mantısı, kurusu, bir de el yazısı not.",
        ]);
      },
      choices: (s) => {
        const k = kin(s, "anne");
        return [
          c("Arayıp uzun uzun teşekkür et", "Bağ güçlenir", { m: 4, ...KB(k, 5), stress: -1 }),
          c("Komşuyla paylaş", "Komşuluk ısınır", { m: 2, rel: { komsu: 4 }, people: 0.5 }),
          c("Kapları yine unut", "Annen kırılır", { m: 2, ...KB(k, -3) }),
        ];
      },
    }),
    A("kayipCuzdan", "sokak", {
      when: TR,
      title: "Yerdeki cüzdan",
      text: (s, h) => "Kaldırımda kahverengi bir cüzdan buldun. İçinde kimlik ve " + h.tl(3500) + " nakit var.",
      choices: [
        c("Kimlikteki adresi bulup elden teslim et", "Bir saat kaybedersin · içini ısıtır", { m: 4, esteem: 3, people: 1, stress: 1 }),
        c("En yakın karakola bırak", "Hızlı ve doğru", { m: 2, esteem: 1 }),
        c("Parayı al, cüzdanı posta kutusuna at", "+₺3.500 · vicdan", { cash: 3500, m: -3, esteem: -4, stress: 2 }),
      ],
    }),
    A("bakkalUstu", "sokak", {
      when: TR,
      title: "Fazla para üstü",
      text: (s) => "Bakkal " + nm(s, "bakkal") + " kalabalıkta sana fazladan iki yüz lira para üstü verdi. Fark etmedi.",
      choices: [
        c("Hemen geri ver", "Mahalle bakkalı unutmaz", { rel: { bakkal: 6 }, esteem: 2, m: 1 }),
        c("Sonra fark etmiş gibi getir", "Biraz utanırsın ama doğrusu bu", { rel: { bakkal: 3 }, stress: 1 }),
        c("Sessiz kal", "+₺200 · bir daha göz göze gelmek zor", { cash: 200, rel: { bakkal: -4 }, esteem: -2 }),
      ],
    }),
    A("sokakMuzik", "sokak", {
      when: TR,
      title: "Sokak müzisyeni",
      text: (s, h) => (s.city === "İstanbul" ? "İstiklal'de" : HS.ek(s.city, "gen") + " meydanında") + " bir genç gitarla " + h.pick(["eski bir Anadolu rock şarkısı", "bir türkü", "bir arabesk klasiği"]) + " çalıyor. Kalabalık eşlik ediyor.",
      choices: (s) => [
        c("Kutusuna bahşiş bırak", "₺100 · moral +", { cost: 100, m: 2 }),
        has(s, "gitar") || s.job === "music" ? c("Bir şarkı da sen çal", "Kalabalık alkışlar", { m: 5, esteem: 3, people: 1, sk: { sahne: 0.4 } }) : c("Durup sonuna kadar dinle", "Yarım saat gider", { m: 3, stress: -2 }),
        c("Yürümeye devam et", "", { m: 0 }),
      ],
    }),
    A("roportaj", "sokak", {
      when: TR,
      title: "Sokak röportajı",
      text: (s, h) => "Elinde mikrofon olan bir muhabir önünü kesti: \"" + h.pick(["Geçinebiliyor musunuz?", "Gençler neden yurt dışına gitmek istiyor?", "Bu yaz tatile gidecek misiniz?"]) + "\"",
      choices: [
        c("İçini dök, esprili konuş", "Şans %40: video yayılabilir", { chance: { p: 0.4, win: { m: 4, people: 2, esteem: 3 }, lose: { m: -2, stress: 3 }, winT: "Viral oldun", winP: "Röportajın paylaşıldı; herkes \"Seni gördüm!\" diye yazıyor.", loseT: "Yanlış kesildi", loseP: "Söylediklerinin yarısı kırpılmış; yorumlar pek hoş değil." } }),
        c("Kısa ve ölçülü cevap ver", "Sorunsuz", { m: 1 }),
        c("\"Acelem var\" deyip geç", "", { stress: -1 }),
      ],
    }),
    A("lokma", "sokak", {
      when: TR,
      title: "Hayrına lokma",
      text: (s, h) => "Mahallede biri " + h.pick(["rahmetli babası için", "oğlunun askerden dönüşü için", "yeni açılan dükkânı için"]) + " lokma döktürüyor. Kuyruk köşeye kadar uzamış.",
      choices: [
        c("Kuyruğa gir", "Moral + · kilo +", { m: 2, kg: 0.2, people: 0.5 }),
        c("Dağıtıma yardım et", "Mahallede tanınırsın", { people: 2, m: 3, stress: 1 }),
        c("Hayırlı olsun deyip geç", "", { m: 0.5 }),
      ],
    }),
    A("sokakKopek", "sokak", {
      when: TR,
      title: "Mahallenin köpekleri",
      text: (s) => "Gece eve dönerken köşedeki köpekler havlayarak yaklaştı. Komşun " + nm(s, "komsu") + " her akşam onlara mama veriyor; seni tanımıyorlar.",
      choices: [
        c("Sakin kal, yavaşça yürü", "Stres +", { stress: 3 }),
        c("Ertesi gün mama al, komşunla birlikte besle", "₺450 · artık seni tanırlar", { cost: 450, rel: { komsu: 5 }, m: 2 }),
        c("Belediyeye şikâyet et", "Komşun bundan hoşlanmaz", { rel: { komsu: -5 }, stress: -1 }),
      ],
    }),
    A("kargo", "sokak", {
      when: (s) => TR(s),
      title: "\"Adreste bulunamadı\"",
      text: (s, h) => "Bütün gün evdeydin ama kargo takipte \"" + h.pick(["alıcı adreste bulunamadı", "adres yetersiz", "teslim edilemedi, şubeden alınız"]) + "\" yazıyor.",
      choices: [
        c("Şubeye git, kendin al", "Yarım günün gider", { stress: 3, h: 0.5 }),
        c("Şikâyet formu doldur", "Sesin çıkar; iletişim +", { stress: 1, sk: { yazisma: 0.3 } }),
        c("Komşuna bırakılmasını iste", "Komşu bir iyilik daha yapar", { rel: { komsu: 2 }, stress: -1 }),
      ],
    }),
    A("otobusYer", "sokak", {
      when: (s) => TR(s) && s.age < 60,
      title: "Ayakta kalan",
      text: (s, h) => h.pick([
        "Uzun bir günün sonunda otobüste nihayet oturdun. Sonraki durakta elinde poşetlerle yaşlı bir teyze bindi.",
        "Ayakların zonkluyor; tam oturmuştun ki bastonlu bir amca bindi. Herkes telefonuna bakıyor.",
      ]),
      choices: [
        c("Yer ver", "Yorgunluk + · içi rahat", { h: -0.5, m: 2, esteem: 1 }),
        c("Yer ver, poşetlerini de taşı", "Bir durak fazla gidersin", { m: 3, stress: 1, people: 0.5 }),
        c("Uyuyor numarası yap", "Utanırsın", { m: -2, esteem: -1 }),
      ],
    }),
    A("turist", "sokak", {
      when: (s) => TR(s) && ["İstanbul", "Antalya", "İzmir", "Muğla", "Nevşehir"].includes(s.city),
      title: "Yol soran turist",
      text: (s, h) => "Elinde haritayla bir turist çift sana yaklaştı: \"Excuse me... " + h.pick(["Grand Bazaar?", "old town?", "the ferry?"]) + "\"",
      choices: [
        c("İngilizceyle derdini anlat", "İngilizce +", { sk: { ingilizce: 0.4 }, m: 2 }),
        c("Kolundan tutup oraya kadar götür", "Yirmi dakika gider · harika bir sohbet", { m: 3, people: 0.5, stress: 1 }),
        c("Elle kolla yön göster", "Doğru mu gösterdin, bilinmez", { m: 0.5 }),
      ],
    }),
    A("taksici", "sokak", {
      when: (s) => TR(s) && ["İstanbul", "Ankara", "İzmir"].includes(s.city),
      title: "Kısa mesafe",
      text: (s) => "Gece yarısı yağmurda taksiye el ettin. Şoför camı indirdi: \"Oraya gitmem " + (s.look === "man" ? "abi" : "abla") + ", kısa mesafe.\"",
      choices: [
        c("Plakayı alıp şikâyet et", "Haklısın ama ıslanıyorsun", { stress: 2, esteem: 1 }),
        c("Fazladan ödemeyi teklif et", "₺550 · eve kuru varırsın", { cost: 550, stress: -1 }),
        c("Yürü", "Sağlık −, moral −", { h: -1, m: -2 }),
      ],
    }),
    A("otopark", "garaj", {
      when: (s) => CAR(s) && TR(s),
      title: "Değnekçi",
      text: (s, h) => "Boş bir sokağa park ettin. Biri bitiverdi: \"Arabana bakarım, " + h.tl(150) + " ver.\"",
      choices: [
        c("Ver, uğraşma", "₺150", { cost: 150, stress: -1 }),
        c("Reddet, polisi ara", "Risk: dönüşte aynan çizik olabilir", { chance: { p: 0.6, win: { esteem: 3 }, lose: { cost: 2500, stress: 4 }, winT: "Değnekçi gitti", winP: "Ekip gelince ortadan kayboldu.", loseT: "Ayna çizilmiş", loseP: "Döndüğünde yan aynanda bir çizik vardı." } }),
        c("Ücretli otoparka çek", "₺250 · garanti", { cost: 250 }),
      ],
    }),
    A("aynaSurtme", "garaj", {
      when: (s) => CAR(s) && TR(s),
      title: "Aynada not",
      text: (s) => "Aracının yan aynası kırılmış, sileceğe bir not sıkıştırılmış: \"Özür dilerim, numaram bu.\" Usta " + nm(s, "usta") + " hemen bakabileceğini söylüyor.",
      choices: [
        c("Notu bırakanı ara, masrafı paylaşın", "Şans: dürüst biri olabilir", { chance: { p: 0.65, win: { m: 4, people: 1 }, lose: { cost: 2800, stress: 3 }, winT: "Dürüst insan", winP: "Aradın; masrafın tamamını ödedi, bir de kahve ısmarladı.", loseT: "Numara kapalı", loseP: "Numara hiç açılmadı. Masraf sana kaldı." } }),
        c("Ustaya git, hemen değiştirt", "₺2.800 · dert biter", { cost: 2800, rel: { usta: 3 }, stress: -1 }),
        c("Bantla idare et", "Bedava ama komik duruyor", { m: -2, esteem: -1 }),
      ],
    }),
    A("benzinZam", "garaj", {
      when: (s) => CAR(s) && TR(s),
      title: "Gece yarısı zammı",
      text: "Haberlerde akaryakıta gece yarısından itibaren zam geleceği söylendi. İstasyonda kuyruk caddeye taşmış.",
      choices: [
        c("Kuyruğa gir, depoyu doldur", "₺3.300 · yarım saat bekleme", { cost: 3300, stress: 2, skill: 0.2 }),
        c("Uğraşma, yarın alırsın", "Biraz daha pahalıya", { cost: 0, m: -1 }),
        c("Bu hafta toplu taşıma kullan", "Tasarruf · konfor −", { stress: 2, h: 0.5 }),
      ],
    }),
    A("kisLastigi", "garaj", {
      when: (s) => CAR(s) && TR(s) && WK(44, 50)(s),
      title: "Kış lastiği",
      text: (s) => "Usta " + nm(s, "usta") + " aradı: \"Kış lastiği zamanı geldi, stokta az kaldı. Ayırayım mı?\"",
      choices: [
        c("Dört yeni lastik tak", "₺16.000 · kışın içi rahat", { cost: 16000, stress: -3, rel: { usta: 3 } }),
        c("Sadece değişim yaptır, eskileri kullan", "₺1.200", { cost: 1200, rel: { usta: 1 } }),
        c("Bu kış idare et", "Kar yağarsa risk", { stress: 2, rel: { usta: -1 } }),
      ],
    }),
    A("muayene", "garaj", {
      when: (s) => CAR(s) && TR(s),
      title: "Araç muayenesi",
      text: "e-Devlet'ten bildirim: aracının muayene süresi doluyor. Randevular üç hafta sonrasına kadar dolu.",
      choices: [
        c("Sabah erkenden sıraya gir", "₺3.200 · yarım gün", { cost: 3200, stress: 3 }),
        c("Ön kontrol için ustaya götür, sonra git", "₺4.500 · sorunsuz geçer", { cost: 4500, stress: -1, rel: { usta: 2 } }),
        c("Ertele", "Ceza riski · stres +", { stress: 3 }),
      ],
    }),
    A("bisikletYagmur", "sokak", {
      when: (s) => s.car === "bisiklet" && TR(s),
      title: "Pedal ve yağmur",
      text: "Bisikletle yola çıktın; yarı yolda bulutlar kapandı. Bisiklet yolu bir anda göle döndü.",
      choices: [
        c("Pedala yüklen, devam", "Sağlık + · sırılsıklam", { h: 1, m: -1, kg: -0.1 }),
        c("Bir kafeye sığın, yağmuru bekle", "₺90 · geç kalırsın", { cost: 90, stress: 1, m: 1 }),
        c("Yağmurluk ve çamurluk al", "₺1.300 · bir daha hazırlıklısın", { cost: 1300, stress: -2 }),
      ],
    }),
    A("siraKacak", "sokak", {
      when: TR,
      title: "Araya kaçan",
      text: (s, h) => h.pick(["Fırın kuyruğunda", "Banka sırasında", "Eczane önünde"]) + " yirmi dakikadır bekliyorsun. Biri pişkin pişkin önüne geçti.",
      choices: [
        c("Kibarca uyar", "İletişim + · gerginlik olabilir", { stress: 2, esteem: 2, sk: { iletisim: 0.3 } }),
        c("Yüksek sesle tepki göster", "Kuyruk seni destekler ama sinirlenirsin", { stress: 4, people: 0.5, esteem: 1 }),
        c("Görmezden gel", "İçin içini yer", { stress: 1, esteem: -1 }),
      ],
    }),
    A("festival", "sokak", {
      when: (s) => TR(s) && WK(22, 38)(s),
      title: (s) => HS.ek(s.city, "gen") + " festivali",
      text: (s, h) => "Belediyenin " + h.pick(["yaz festivali", "sokak lezzetleri şenliği", "açık hava sinema günleri"]) + " başladı. " + nm(s, "liseArk") + " de oradaymış, mesaj attı.",
      choices: [
        c("Git, eski arkadaşınla buluş", "₺500 · nostalji", { cost: 500, m: 4, people: 1, rel: { liseArk: 4 } }),
        c("Sadece konserine uğra", "Bedava · kalabalık", { m: 2, stress: 1 }),
        c("Evde kal", "Sessiz bir akşam", { stress: -1, rel: { liseArk: -1 } }),
      ],
    }),
    A("memleketKoli", "salon", {
      when: (s) => TR(s) && s.city !== s.birthCity && !!kin(s, "anne", "teyze", "anneanne"),
      title: "Memleketten koli",
      text: (s) => {
        const k = kin(s, "anne", "teyze", "anneanne");
        return HS.ek(s.birthCity, "abl") + " bir koli geldi: " + HS.ek(k.name, "gen") + " gönderdiği peynir, salça, bir de kurutulmuş biber. Kolinin üstünde kocaman harflerle adın yazıyor.";
      },
      choices: (s) => {
        const k = kin(s, "anne", "teyze", "anneanne");
        return [
          c("Görüntülü arayıp kolini aç", "Hasret biraz diner", { m: 5, ...KB(k, 5), stress: -2 }),
          c("İş arkadaşlarına da tattır", "Peynirin şanı yürür", WORK(s) ? { m: 3, rel: { isArk: 3 }, people: 1 } : { m: 3, people: 1 }),
          c("Mesajla teşekkür et", "Kısa ve yeterli", { m: 2, ...KB(k, 1) }),
        ];
      },
    }),

    // =================== TEKNOLOJİ ===================
    A("guncelleme", "yatak", {
      when: (s) => true,
      title: "Gece 03.00 güncellemesi",
      text: (s, h) => h.pick([
        "Telefon gece kendi kendine güncellendi. Sabah bütün ikonlar yer değiştirmiş, alarm çalmamış.",
        "\"Güncelleme yüklendi\" mesajıyla uyandın. Pil artık yarım günde bitiyor.",
        "Güncellemeden sonra klavye değişti; mesajlarda harfler birbirine girmiş.",
      ]),
      choices: (s) => [
        c("Bir saat oturup ayarları düzelt", "Bilgisayar +", { sk: { bilgisayar: 0.5 }, stress: 1 }),
        c(s.age < 30 ? "Söylenip alış" : "Kuzeninden yardım iste", "Zaman kazandırır", { stress: 2, people: 0.5 }),
        c("Yeni telefon bakmaya başla", "₺2.500 kılıf ve kablo hevesi", { cost: 2500, m: 2 }),
      ],
    }),
    A("sifre", "salon", {
      when: (s) => true,
      title: "Şifreni unuttun",
      text: (s, h) => "E-posta şifreni hatırlamıyorsun. Kurtarma kodu " + h.pick(["eski telefon numarana", "yıllar önce açtığın başka bir e-postaya", "hiç kullanmadığın bir uygulamaya"]) + " gidiyor.",
      choices: [
        c("Tek tek uğraşıp kurtar", "Stres + · bilgisayar +", { stress: 3, sk: { bilgisayar: 0.6 } }),
        c("Yeni hesap aç, herkese duyur", "Her şeyi baştan kurarsın", { stress: 2, people: -0.5 }),
        c("Şifre yöneticisi kur", "Bir kerelik eziyet, sonra huzur", { stress: 1, skill: 0.5, sk: { bilgisayar: 0.3 } }),
      ],
    }),
    A("edevlet", "salon", {
      when: TR,
      title: "e-Devlet şifresi",
      text: (s, h) => "Bir belge lazım ama e-Devlet şifrenin süresi dolmuş. " + h.pick(["Banka ile girmeyi denedin, mobil onay gelmiyor.", "SMS'le yenilemek istedin, numaran kayıtlı değil."]),
      choices: [
        c("Postaneye gidip yeni şifre al", "Kuyruk · kesin çözüm", { stress: 2, cost: 15 }),
        c("Belgeyi kâğıt olarak almaya git", "Yarım gün gider", { stress: 3, h: -0.5 }),
        c("Ertele", "İş birikir", { stress: 2 }),
      ],
    }),
    A("sahteSms", "salon", {
      when: TR,
      title: "\"Kargonuz gümrükte\"",
      text: (s, h) => "Bir SMS: \"" + h.pick(["Kargonuz gümrükte bekliyor, ücreti ödemek için tıklayın", "Hesabınız askıya alındı, doğrulama için tıklayın", "Trafik cezanız bulunmaktadır, indirimli ödeme için tıklayın"]) + "\". Link bir garip.",
      choices: (s) => [
        c("Sil, numarayı engelle", "Güvende kalırsın", { stress: -1, sk: { bilgisayar: 0.2 } }),
        c("Aile grubunda herkesi uyar", "Faydalı · biri yine de tıklayabilir", { people: 1, m: 1, ...(kin(s, "anne", "baba") ? KB(kin(s, "anne", "baba"), 2) : {}) }),
        c("Merak edip linke tıkla", "Risk!", { chance: { p: 0.5, win: { m: -1 }, lose: { cost: 4000, stress: 6 }, winT: "Ucuz atlattın", winP: "Sayfa açılmadı bile. Bir daha yapma.", loseT: "Kart bilgisi çalındı", loseP: "Kartından tanımadığın bir harcama çekildi; bankayla uğraşıyorsun." } }),
      ],
    }),
    A("bulutDolu", "yatak", {
      when: (s) => true,
      title: "Depolama alanı dolu",
      text: (s) => "Telefon fotoğraf çekmeyi reddediyor: depolama dolu." + (s.children.length ? " Galerinin yarısı çocuk fotoğrafı." : s.partner ? " Galerinin yarısı " + HS.ek(s.partner.name, "gen") + " fotoğrafları." : " Galeride binlerce ekran görüntüsü var."),
      choices: [
        c("Aylık bulut paketi al", "₺120/ay · dert biter", { cost: 600, stress: -2 }),
        c("Bir akşam oturup ayıkla", "Nostalji ve sabır", { m: 2, stress: 1 }),
        c("Toptan sil", "Sonra pişman olabilirsin", { m: -2, stress: -1 }),
      ],
    }),
    A("aileGrubu", "salon", {
      when: (s) => !!kin(s, "dayi", "amca", "teyze", "hala"),
      title: "Aile grubunda haber",
      text: (s, h) => {
        const k = kin(s, "dayi", "amca", "teyze", "hala");
        return HS.kinLabel(k) + " " + k.name + " aile grubuna yine bir haber attı: \"" + h.pick(["Limonlu su kanseri bitiriyormuş!", "Yarından itibaren bankamatikler kapanıyormuş!", "Bu mesajı 10 kişiye atmazsan hesabın silinecek!"]) + "\"";
      },
      choices: (s) => {
        const k = kin(s, "dayi", "amca", "teyze", "hala");
        return [
          c("Nazikçe kaynağın olmadığını yaz", "Doğru olanı söylersin · biri alınabilir", { esteem: 2, ...KB(k, -2), stress: 1 }),
          c("Özelden arayıp anlat", "Daha incelikli", { ...KB(k, 3), sk: { iletisim: 0.4 }, stress: 1 }),
          c("Gruba sessize al", "Huzur", { stress: -2, people: -0.5 }),
        ];
      },
    }),
    A("liseArkPost", "salon", {
      when: (s) => true,
      title: "Hararetli yorumlar",
      text: (s) => nm(s, "liseArk") + " sosyal medyada çok iddialı bir paylaşım yaptı; altında kavga var. Senin de etiketlendiğini gördün.",
      choices: [
        c("Uzun bir cevap yaz", "Haklı çıkabilirsin ama gece boyu sürer", { stress: 4, sleep: 2, rel: { liseArk: -3 }, esteem: 1 }),
        c("Etiketi kaldır, sus", "Stres −", { stress: -1, rel: { liseArk: -1 } }),
        c("Arayıp yüz yüze konuşmayı öner", "Arkadaşlık kurtulur", { rel: { liseArk: 5 }, people: 0.5, sk: { iletisim: 0.3 } }),
      ],
    }),
    A("viral", "salon", {
      when: (s) => s.age < 50,
      title: "Komik video",
      text: (s, h) => "Çektiğin " + h.pick(["kedinin şaşkın yüzü", "trafikte dans eden polis", "mahalledeki tavuğun otobüs durağında beklemesi"]) + " videosu bir gecede yüz bin izlenmeyi geçti.",
      choices: [
        c("Devamını çek, hesap büyüt", "Şans: reklam teklifi gelebilir", { chance: { p: 0.35, win: { cash: 4000, m: 4, people: 2 }, lose: { stress: 3, m: -1 }, winT: "Reklam teklifi", winP: "Bir firma ürününü tanıtmanı istedi; küçük ama hoş bir para.", loseT: "İkinci video tutmadı", loseP: "Algoritma bir anda sustu." } }),
        c("Keyfini çıkar, normal hayata dön", "Moral +", { m: 3 }),
        c("Videoyu kaldır", "Yorumlar seni yormuştu", { stress: -2 }),
      ],
    }),
    A("wifiKomsu", "salon", {
      when: (s) => OWN(s),
      title: "Wi-fi şifresi",
      text: (s) => "Komşun " + nm(s, "komsu") + " kapıda: \"İnternetimiz kesildi, birkaç günlüğüne seninkini kullanabilir miyim?\"",
      choices: [
        c("Şifreyi ver", "Komşuluk + · internet yavaşlar", { rel: { komsu: 5 }, stress: 1 }),
        c("Misafir ağı kur, onu ver", "Bilgisayar + · hem güvenli hem cömert", { rel: { komsu: 4 }, sk: { bilgisayar: 0.4 } }),
        c("Kibarca reddet", "Komşun bozulur", { rel: { komsu: -4 } }),
      ],
    }),
    A("laptopCay", "salon", {
      when: (s) => has(s, "laptop"),
      title: "Klavyeye çay",
      text: "Dirseğin çarptı; dolu çay bardağı dizüstü bilgisayarın klavyesine boşaldı.",
      choices: [
        c("Hemen kapat, ters çevir, bekle", "Şans %60", { chance: { p: 0.6, win: { m: 2, stress: -1 }, lose: { cost: 6500, stress: 4 }, winT: "Kurtuldu", winP: "İki gün sonra açıldı; sadece Ç tuşu yapışıyor.", loseT: "Anakart gitti", loseP: "Servis tamir için bir hayli para istedi." } }),
        c("Doğrudan servise götür", "₺3.000 · garanti", { cost: 3000, stress: -1 }),
        c("Saç kurutma makinesiyle kurut", "Şans %40", { chance: { p: 0.4, win: { m: 2 }, lose: { itemLose: "laptop", m: -4 }, winT: "Çalıştı", winP: "Mucize gibi; bilgisayar açıldı.", loseT: "Bilgisayar gitti", loseP: "Sıcak hava işi bitirdi. Dizüstü artık bir hatıra." } }),
      ],
    }),
    A("konsolCocuk", "salon", {
      when: (s) => has(s, "konsol"),
      title: "Online yenilgi",
      text: "Online maçta on dört yaşında olduğu belli bir rakip seni 7-0 yendi ve mikrofondan güldü.",
      choices: [
        c("Rövanş iste", "Gece uzar", { sleep: 3, chance: { p: 0.35, win: { m: 5, esteem: 2 }, lose: { m: -3, stress: 2 }, winT: "Rövanş senin!", winP: "Son dakikada attığın golle mikrofon sustu.", loseT: "Yine kaybettin", loseP: "Bu sefer 8-1." } }),
        c("Kapat, kitap oku", "Stres −", { stress: -2, skill: 0.3 }),
        c("Antrenman moduna gir", "Gelecek sefere hazırlık", { m: 1, stress: 1 }),
      ],
    }),
    A("tvKanal", "salon", {
      when: (s) => has(s, "tv") && !!kin(s, "baba", "anne"),
      title: "Kanallar kaçtı",
      text: (s) => {
        const k = kin(s, "baba", "anne");
        return k.name + " aradı: \"Televizyonda bütün kanallar kaybolmuş, sadece karıncalanma var! Akşam haberini kaçıracağım.\"";
      },
      choices: (s) => {
        const k = kin(s, "baba", "anne");
        return [
          c("Görüntülü arayıp adım adım anlat", "Sabır testi", { ...KB(k, 4), stress: 3, sk: { iletisim: 0.3 } }),
          c("Gidip kendin ayarla", "Bir akşamın gider · çok sevinirler", { ...KB(k, 7), m: 2, stress: 1 }),
          c("\"Kumandadan kaynak tuşuna bas\" deyip kapat", "Hızlı ama kırılırlar", { ...KB(k, -2) }),
        ];
      },
    }),
    A("kahveKirec", "mutfak", {
      when: (s) => has(s, "kahve"),
      title: "Espresso makinesi öksürüyor",
      text: "Makine kahve yerine hırıltı çıkarıyor; ekranda kireç uyarısı yanıp sönüyor.",
      choices: [
        c("Kireç sökücü al, bakım yap", "₺450 · makine yaşar", { cost: 450, skill: 0.3 }),
        c("Sirkeyle dene", "Bedava · ev sirke kokar", { stress: 1, m: -1 }),
        c("Bir süre çay içmeye dön", "Çaycı ruhun canlanır", { m: 1 }),
      ],
    }),

    // =================== ALIŞVERİŞ ===================
    A("geceIndirim", "yatak", {
      when: (s) => true,
      title: "Gece yarısı indirimi",
      text: (s, h) => "Saat 00.01: \"Sadece 3 saat! %60 indirim!\" Sepette " + h.pick(["bir mont", "kablosuz kulaklık", "akıllı süpürge"]) + " bekliyor.",
      choices: (s) => [
        c("Al gitsin", "₺3.800 · moral +", { cost: 3800, m: 3 }),
        s.card ? c("Kartla 6 taksit yap", "₺4.200 toplam · borç hissi", { cost: 4200, m: 3, stress: 1 }) : c("Sepette bırak, sabah bak", "Muhtemelen fiyat geri çıkmış olur", { m: -1, stress: -1 }),
        c("Uygulamayı sil", "Finans +", { sk: { finans: 0.5 }, stress: -2 }),
      ],
    }),
    A("iade", "sokak", {
      when: TR,
      title: "İade kuyruğu",
      text: (s, h) => "Aldığın " + h.pick(["ayakkabı bir numara küçük", "gömleğin rengi fotoğraftakinden farklı", "blender ilk gün bozuldu"]) + ". Mağaza \"etiketi koparılmış\" diyerek iadeyi kabul etmiyor.",
      choices: [
        c("Tüketici hakem heyetine başvur", "Uzun ama haklısın", { stress: 3, esteem: 2, sk: { mevzuat: 0.3 } }),
        c("Mağaza müdürünü iste", "Şans %55", { chance: { p: 0.55, win: { m: 3, cash: 1500 }, lose: { stress: 3 }, winT: "İade alındı", winP: "Müdür \"müşteri memnuniyeti\" dedi; paran iade edildi.", loseT: "Kapı duvar", loseP: "Müdür de aynısını söyledi." } }),
        c("Kuzenine hediye et", "Biri sevinir", { people: 0.5, m: 1 }),
      ],
    }),
    A("kasimIndirim", "salon", {
      when: WK(46, 48),
      title: "Kasım indirimleri",
      text: (s) => "Bütün uygulamalar bildirim yağdırıyor. " + (s.partner ? s.partner.name + " bir ekran görüntüsü attı: \"Bak bu kahve makinesi yarı fiyatına!\"" : "Herkes sepetini paylaşıyor."),
      choices: (s) => [
        c("Önceden listelediğin şeyi al", "₺5.000 · planlı alışveriş", { cost: 5000, m: 2, sk: { finans: 0.3 } }),
        s.partner ? c("Birlikte bir şey seçin", "₺6.500 · bağ +", { cost: 6500, bond: 4, m: 2 }) : c("Kendine bir hediye", "₺2.000", { cost: 2000, m: 3 }),
        c("Hiçbir şey alma", "Cüzdan rahat, gözün kalır", { m: -1, stress: -1 }),
      ],
    }),
    A("pazarFazla", "sokak", {
      when: TR,
      title: "Pazarcının hatası",
      text: "Pazarcı iki kilo domates tartıp bir kiloluk para istedi. Arkasındaki levha \"Helal olsun\" diyor.",
      choices: [
        c("Doğrusunu söyle", "Pazarcı teşekkür eder, maydanoz hediye", { esteem: 2, m: 2, people: 0.5 }),
        c("Ses etme", "Küçük bir kazanç · küçük bir vicdan", { cash: 60, esteem: -1 }),
      ],
    }),

    // =================== SPOR, DİZİ, MEDYA ===================
    A("milliMac", "salon", {
      when: (s) => true,
      title: "Milli maç, penaltılar",
      text: (s, h) => "Milli maç uzatmalarda da bitmedi, penaltılara kaldı. " + h.pick(["Bütün mahalle balkonlarda.", "Kahvehaneden uğultu geliyor.", "Telefon titremekten duracak gibi değil."]),
      choices: (s) => [
        c(nm(s, "enYakin") + " ile birlikte izle", "₺400 · ya sevinç ya hüsran", { cost: 400, rel: { enYakin: 3 }, chance: { p: 0.5, win: { m: 6, stress: -3, people: 1 }, lose: { m: -3, stress: 2 }, winT: "Kazandık!", winP: "Sokaklar korna sesiyle doldu; kucaklaştınız.", loseT: "Penaltılarda elendik", loseP: "Sessizce çekirdek kabuklarını topladınız." } }),
        c("Penaltılara bakamam, odaya kaç", "Sonucu sesten anlarsın", { stress: -1, m: 1 }),
        c("Hiç izleme, uyu", "Uyku +", { sleep: -2 }),
      ],
    }),
    A("derbiBilet", "is", {
      when: (s) => LEGAL(s) && !s.abroad,
      title: "Fazladan derbi bileti",
      text: (s) => "İş arkadaşın " + nm(s, "isArk") + " fısıldadı: \"Kuzenim gelemiyor, derbi için bir bilet fazla. Gelir misin?\"",
      choices: [
        c("Git", "₺3.500 · unutulmaz bir akşam", { cost: 3500, m: 6, rel: { isArk: 5 }, stress: -3 }),
        c("Başkasına öner", "Nazik bir ret", { rel: { isArk: 1 } }),
        c("Maç saatinde mesaiye kal", "Performans + · " + "arkadaş bozulur", { perf: 2, rel: { isArk: -2 }, stress: 1 }),
      ],
    }),
    A("spoiler", "salon", {
      when: (s) => true,
      title: "Spoiler",
      text: (s, h) => "Bir haftadır kaçınıyordun. Ama " + h.pick([nm(s, "isArk") + " yemekhanede", nm(s, "enYakin") + " mesajda", "bir haber sitesi başlıkta"]) + " dizinin finalinde kimin öldüğünü söyleyiverdi.",
      choices: [
        c("Yine de izle", "Hikâye güzelse spoiler bir şey değiştirmez", { m: 2, stress: -1 }),
        c("Kızgınlığını dile getir", "Haklısın ama ortam gerilir", { stress: 1, esteem: 1, people: -0.5 }),
        c("Diziyi bırak, kitaba dön", "Bir dönem kapanır", { skill: 0.3, m: -1 }),
      ],
    }),
    A("radyoIstek", "mutfak", {
      when: (s) => s.age >= 30,
      title: "Radyoda o şarkı",
      text: (s, h) => "Mutfakta yemek yaparken radyoda " + h.pick(["lise yıllarının şarkısı", "ilk aşkının sevdiği şarkı", "babanın arabasında hep çalan kaset"]) + " çaldı.",
      choices: (s) => [
        c("Sesi aç, eşlik et", "Moral +", { m: 4, stress: -2 }),
        c("Şarkıyı " + HS.ek(nm(s, "liseArk"), "dat") + " gönder", "Eski günler", { rel: { liseArk: 4 }, m: 2, people: 0.5 }),
        c("Kanalı değiştir", "Hüzne gerek yok", { m: -1 }),
      ],
    }),

    // =================== BAYRAMLAR VE MEVSİMLER ===================
    A("yilbasi", "salon", {
      when: WK(51, 52),
      title: "Yılbaşı gecesi",
      text: (s, h) => h.pick(["Herkes bir plan yapmış.", "Market kuyrukları uzadı, hindi fiyatları dudak uçuklatıyor.", "Sokaklarda ışıklar, vitrinlerde süsler."]) + " Senin planın ne?",
      choices: (s) => [
        c(s.partner ? P(s) + " ile evde baş başa" : nm(s, "enYakin") + " ile ev partisi", "₺1.800", s.partner ? { cost: 1800, bond: 5, m: 4 } : { cost: 1800, rel: { enYakin: 4 }, m: 4, people: 1 }),
        c("Meydanda geri sayım", "₺600 · kalabalık", { cost: 600, m: 3, people: 1, stress: 1 }),
        c("Saat 23'te uyu", "Yeni yıla dinç gir", { sleep: -3, h: 1, m: -1 }),
      ],
    }),
    A("yeniYilHedef", "yatak", {
      when: WK(1, 2),
      title: "Yeni yıl kararları",
      text: (s, h) => "Ocak başı. Defterin ilk sayfasına bir hedef yazacaksın. Geçen yılki listede \"" + h.pick(["spora başla", "şekeri bırak", "erken yat"]) + "\" yazıyor; işaretlenmemiş.",
      choices: [
        c("Tek ve gerçekçi bir hedef yaz", "Disiplin +", { sk: { disiplin: 0.5 }, esteem: 1 }),
        c("On maddelik iddialı liste", "Moral + · şubatta unutulur", { m: 3, stress: 1 }),
        c("Hedef koymak bana göre değil", "", { stress: -1 }),
      ],
    }),
    A("sevgililer", "salon", {
      when: (s) => WK(6, 7)(s) && !!s.partner,
      title: "14 Şubat",
      text: (s) => "Sevgililer Günü yaklaştı. " + P(s) + " \"Bu yıl hiçbir şey almayalım, ticari bir gün\" dedi. Ama bir tuhaf gülümsedi.",
      choices: (s) => [
        c("Yine de küçük bir sürpriz yap", "₺1.500 · bağ +", { cost: 1500, bond: 6, trust: 2 }),
        c("Sözüne güven, hiçbir şey alma", "Şans %50", { chance: { p: 0.5, win: { bond: 3, m: 1 }, lose: { bond: -4, m: -2 }, winT: "Gerçekten öyleymiş", winP: "Akşam evde film izlediniz; ikiniz de rahattınız.", loseT: "Test edilmişsin", loseP: P(s) + " sana bir hediye almıştı. Ortam buz gibi." } }),
        c("Yemeğe çık", "₺3.500 · romantik ama pahalı", { cost: 3500, bond: 5, m: 3 }),
      ],
    }),
    A("anneGunu", "salon", {
      when: (s) => WK(18, 19)(s) && !!kin(s, "anne"),
      title: "Anneler Günü",
      text: (s) => "Pazar Anneler Günü. " + kin(s, "anne").name + " \"Bir şey almayın, gelin yeter\" dedi. " + (s.city !== kin(s, "anne").city ? "Ama o " + HS.ek(kin(s, "anne").city, "loc") + "." : "Aynı şehirdesiniz."),
      choices: (s) => {
        const k = kin(s, "anne");
        return [
          c(s.city !== k.city ? "Yola çık, sürpriz yap" : "Çiçekle kapısına git", s.city !== k.city ? "₺3.000 · çok mutlu olur" : "₺600", { cost: s.city !== k.city ? 3000 : 600, ...KB(k, 8), m: 4 }),
          c("Çiçek gönder, görüntülü ara", "₺900", { cost: 900, ...KB(k, 4), m: 2 }),
          c("Bir mesaj at", "Kalbi kırılır", { ...KB(k, -3) }),
        ];
      },
    }),
    A("babaGunu", "salon", {
      when: (s) => WK(24, 25)(s) && !!kin(s, "baba"),
      title: "Babalar Günü",
      text: (s, h) => kin(s, "baba").name + " hediye konusunda hep aynı: \"" + h.pick(["Ne gerek var!", "Bir kravatım var zaten.", "Paranı boşa harcama."]) + "\" Ama geçen sefer aldığın çorapları hâlâ giyiyor.",
      choices: (s) => {
        const k = kin(s, "baba");
        return [
          c("Birlikte balığa/kahveye çıkın", "₺700 · zaman en güzel hediye", { cost: 700, ...KB(k, 7), m: 3 }),
          c("İyi bir saat al", "₺4.500", { cost: 4500, ...KB(k, 5), m: 1 }),
          c("Telefonla kutla", "Kısa ve sade", { ...KB(k, 1) }),
        ];
      },
    }),
    A("cocukBayrami", "sokak", {
      when: (s) => WK(16, 17)(s) && !!kidOf(s, 5, 11),
      title: "23 Nisan gösterisi",
      text: (s) => kidOf(s, 5, 11).name + " okulun 23 Nisan gösterisinde " + (s.year % 2 ? "\"Ağaç 3\"" : "halk oyunları ekibinde") + ". Öğretmen kostüm için bir liste göndermiş.",
      choices: (s) => [
        c("Kostümü kendin dik, provaları izle", "₺400 · emek ister", { cost: 400, kidBond: 6, stress: 2, m: 3 }),
        c("Hazır kostüm al", "₺1.400 · hızlı", { cost: 1400, kidBond: 3 }),
        WORK(s) ? c("İzin al, gösteride ön sırada ol", "Performans − · çocuk çok sevinir", { kidBond: 7, perf: -2, m: 4 }) : c("Gösteriye herkesi topla", "Bütün aile alkışlar", { kidBond: 5, people: 1, m: 4 }),
      ],
    }),
    A("cumhuriyet", "sokak", {
      when: (s) => WK(43, 44)(s) && TR(s),
      title: "29 Ekim akşamı",
      text: (s) => HS.ek(s.city, "loc") + " fener alayı var; balkonlarda bayraklar dalgalanıyor. " + (s.children.length ? "Çocuklar ellerinde fenerlerle hazır." : nm(s, "komsu") + " balkondan sesleniyor: \"Gelmiyor musun?\""),
      choices: (s) => [
        c("Fener alayına katıl", "Moral + · kalabalık", s.children.length ? { m: 4, kidBond: 4, people: 1 } : { m: 4, rel: { komsu: 3 }, people: 1 }),
        c("Balkona bayrak as, havai fişekleri izle", "Huzurlu bir akşam", { m: 2, stress: -2 }),
        c("Uzun hafta sonunu tatilde geçir", "₺4.000 · kısa kaçamak", { cost: 4000, m: 3, stress: -4 }),
      ],
    }),
    A("bayramSeker", "salon", {
      when: (s) => TR(s) && nearFeast(s, 0) && s.age >= 25,
      title: "Bayram şekeri",
      text: (s, h) => "Ramazan Bayramı sabahı. Kapı çaldı: apartmanın çocukları ellerinde poşetlerle sıraya girmiş. " + h.pick(["Evde yarım paket şeker var.", "Kolonyan bitmiş.", "En küçükleri \"harçlık da var mı?\" diye soruyor."]),
      choices: [
        c("Şeker ve harçlık dağıt", "₺800 · çocuklar mutlu", { cost: 800, m: 4, people: 1, rel: { komsu: 2 } }),
        c("Sadece şeker ver", "₺150", { cost: 150, m: 2 }),
        c("Kapıyı açma", "İçin rahat değil", { m: -2, rel: { komsu: -1 } }),
      ],
    }),
    A("bayramHarclik", "salon", {
      when: (s) => TR(s) && nearFeast(s, 0) && s.age <= 22 && !!kin(s, "teyze", "hala", "dayi", "amca"),
      title: "Bayram harçlığı",
      text: (s) => {
        const k = kin(s, "teyze", "hala", "dayi", "amca");
        return "Bayram ziyareti. " + k.name + " elini öptükten sonra avucuna katlanmış bir para sıkıştırdı. \"Koca adam/kadın oldun ama bayram bayramdır!\"";
      },
      choices: (s) => {
        const k = kin(s, "teyze", "hala", "dayi", "amca");
        return [
          c("Utanarak kabul et", "+₺1.000 · tatlı bir an", { cash: 1000, m: 3, ...KB(k, 3) }),
          c("Kibarca reddet", "Büyüdüğünü gösterirsin", { esteem: 2, ...KB(k, 1) }),
          c("Al, kuzenlere dondurma ısmarla", "Herkes sevinir", { m: 4, people: 1, ...KB(k, 4) }),
        ];
      },
    }),
    A("kurban", "salon", {
      when: (s) => TR(s) && nearFeast(s, 10) && s.age >= 24,
      title: "Kurban Bayramı",
      text: (s) => "Kurban Bayramı yaklaştı. " + (kin(s, "baba", "amca") ? kin(s, "baba", "amca").name + " hisseye girip girmeyeceğini soruyor." : "Mahallede herkes hisse konuşuyor."),
      choices: (s) => {
        const k = kin(s, "baba", "amca");
        return [
          c("Hisseye gir, eti dağıt", "₺24.000 · gelenek", { cost: 24000, m: 3, people: 2, ...KB(k, 4) }),
          c("Bir yardım kuruluşuna bağışla", "₺8.000", { cost: 8000, m: 2, esteem: 1 }),
          c("Bayramı tatilde geçir", "₺9.000 · aile biraz söylenir", { cost: 9000, stress: -4, m: 3, ...KB(k, -2) }),
        ];
      },
    }),
    A("okulAcilis", "salon", {
      when: (s) => WK(35, 37)(s) && !!kidOf(s, 6, 14),
      title: "Kırtasiye listesi",
      text: (s) => kidOf(s, 6, 14).name + " okulun gönderdiği listeyi getirdi: üç sayfa. Arasında \"karakterli kalem kutusu\" da var.",
      choices: [
        c("Listedeki her şeyi al", "₺6.500 · çocuk mutlu", { cost: 6500, kidBond: 4, m: 1 }),
        c("Geçen yıldan kalanları ayıkla, eksikleri al", "₺2.800 · finans +", { cost: 2800, sk: { finans: 0.3 }, kidBond: 1 }),
        c("Velilerle ortak toptan alım örgütle", "₺2.200 · biraz uğraş", { cost: 2200, people: 1.5, stress: 2 }),
      ],
    }),
    A("karne", "salon", {
      when: (s) => (WK(3, 4)(s) || WK(25, 26)(s)) && !!kidOf(s, 7, 17),
      title: "Karne günü",
      text: (s, h) => kidOf(s, 7, 17).name + " karnesini " + h.pick(["kapıda arkasına saklayarak", "koşarak, havada sallayarak", "sessizce masaya bırakarak"]) + " getirdi. Matematik biraz düşük.",
      choices: [
        c("Önce güzel notları öv", "Bağ + · motivasyon", { kidBond: 5, m: 2 }),
        c("Yaz için özel ders ayarla", "₺6.000 · stres +", { cost: 6000, kidBond: -2, stress: 1, skill: 0.2 }),
        c("Hediye sözü ver: dönem iyi geçerse bisiklet", "Pazarlık", { kidBond: 3, stress: 1 }),
      ],
    }),
    A("sonbaharYaprak", "sokak", {
      when: (s) => TR(s) && WK(42, 46)(s) && s.age >= 35,
      title: "İlk soğuk sabah",
      text: "Bu sabah ilk defa nefesini görebildin. Kaldırımlar sarı yapraklarla kaplı; montu dolaptan çıkarmanın zamanı.",
      choices: [
        c("Uzun bir yürüyüş yap", "Sağlık + · huzur", { h: 1, stress: -3 }),
        c("Yeni bir mont al", "₺4.500", { cost: 4500, m: 2 }),
        c("Grip aşısı için hatırlatma kur", "Akıllıca", { h: 1, sk: { disiplin: 0.2 } }),
      ],
    }),
    A("bahar", "sokak", {
      when: (s) => TR(s) && WK(14, 18)(s),
      title: "Erik çiçekleri",
      text: (s) => "Sokaktaki erik ağacı çiçek açmış. " + nm(s, "komsu") + " altında taburesini açmış, çay içiyor.",
      choices: [
        c("Yanına otur, bir çay iç", "Komşuluk +", { rel: { komsu: 4 }, m: 2, stress: -2 }),
        c("Bisiklete ya da koşuya çık", "Sağlık +", { h: 1, kg: -0.1, m: 1 }),
        c("Polen alerjisi için eczaneye uğra", "₺350", { cost: 350, h: 1 }),
      ],
    }),

    // =================== HOBİLER, NOSTALJİ ===================
    A("bulmaca", "salon", {
      when: (s) => s.age >= 28,
      title: "Son kare",
      text: "Gazetenin bulmacasında tek bir kare kaldı: \"Sekiz harfli, bir Anadolu çalgısı\". Bir türlü çıkmıyor.",
      choices: (s) => [
        c("İnternetten bakma, düşün", "Beceri +", { skill: 0.5, stress: 1 }),
        kin(s, "dede", "anneanne", "babaanne", "baba") ? c(HS.ek(kin(s, "dede", "anneanne", "babaanne", "baba").name, "acc") + " ara, sor", "\"Kabak kemane!\" der, bir saat sohbet edersiniz", { ...KB(kin(s, "dede", "anneanne", "babaanne", "baba"), 5), m: 3 }) : c("Komşuya sor", "Komşuluk +", { rel: { komsu: 2 }, m: 1 }),
        c("Bulmacayı yarım bırak", "Kafanda kalır", { stress: 1 }),
      ],
    }),
    A("balkonBahce", "salon", {
      when: (s) => OWN(s) && WK(12, 20)(s),
      title: "Balkonda domates",
      text: "Pazardan aldığın fide balkonda bekliyor. Saksı, toprak, sırık... Bir yaz projesi mi başlıyor?",
      choices: [
        c("Komple bir balkon bahçesi kur", "₺1.600 · yazın domatesler", { cost: 1600, m: 4, stress: -3, flag: "balkonBahce" }),
        c("Tek saksı dene", "₺300", { cost: 300, m: 2 }),
        c("Fideyi annene/komşuna ver", "Komşuluk +", { rel: { komsu: 3 } }),
      ],
    }),
    A("hasat", "mutfak", {
      when: (s) => OWN(s) && !!s.flags.balkonBahce && WK(28, 36)(s),
      title: "İlk hasat",
      text: (s) => "Balkon bahçen ürün verdi: on iki domates, bir avuç biber. " + nm(s, "komsu") + " balkonundan imrenerek bakıyor.",
      choices: [
        c("Komşuyla paylaş", "Komşuluk +", { rel: { komsu: 5 }, m: 3 }),
        c("Kendi salçanı yap", "Yemek becerisi +", { m: 4, skill: 0.4 }),
        c("Fotoğrafını paylaş", "Beğeni yağar", { m: 3, people: 0.5 }),
      ],
    }),
    A("satranc", "sokak", {
      when: (s) => TR(s),
      title: "Parkta satranç",
      text: (s, h) => "Parkta iki emekli satranç oynuyor. " + h.pick(["Biri sana döndü: \"Sıradaki sen misin?\"", "Biri hamle yaparken sana göz kırptı.", "Kaybeden kalkıyor, bir yer boşaldı."]),
      choices: [
        c("Otur, oyna", "Şans %40", { chance: { p: 0.4, win: { m: 4, esteem: 2, people: 1 }, lose: { m: 1, people: 1, skill: 0.3 }, winT: "Şah mat", winP: "Emekliler seni haftaya da bekliyor.", loseT: "Yenildin", loseP: "Ama bir açılış öğrendin." } }),
        c("İzle, öğren", "Beceri +", { skill: 0.3, stress: -1 }),
        c("Yürümeye devam et", "", {}),
      ],
    }),
    A("oltaKopru", "sokak", {
      when: (s) => SEA(s),
      title: "Olta",
      text: (s) => "Sahilde amatör balıkçılar sıralanmış. Biri yedek oltasını uzattı: \"Bir dene, istavrit bol bugün.\"",
      choices: [
        c("Dene", "Şans %55", { chance: { p: 0.55, win: { m: 5, stress: -4 }, lose: { m: 1, stress: -2 }, winT: "Rastgele!", winP: "Bir kova istavritle eve döndün.", loseT: "Yem gitti, balık yok", loseP: "Ama denizi izlemek bile yetti." } }),
        c("Kendi oltanı al", "₺1.800 · yeni bir hobi", { cost: 1800, m: 3, flag: "olta" }),
        c("Teşekkür et, geç", "", { m: 0.5 }),
      ],
    }),
    A("fotograf", "sokak", {
      when: (s) => s.age < 55,
      title: "Altın saat",
      text: (s) => "Akşamüstü ışık her şeyi altına boyamış. " + (s.city === "İstanbul" ? "Galata'nın" : HS.ek(s.city, "gen")) + " eski sokakları kartpostal gibi.",
      choices: [
        c("Bir fotoğraf kursuna yazıl", "₺3.500 · yeni hobi", { cost: 3500, m: 3, skill: 0.8, people: 1 }),
        c("Telefonla bir saat fotoğraf çek", "Moral +", { m: 3, stress: -2 }),
        c("Eve yetiş", "", { stress: 0 }),
      ],
    }),
    A("kaset", "salon", {
      when: (s) => s.age >= 32,
      title: "Ayakkabı kutusundaki kasetler",
      text: (s, h) => "Dolabın üstündeki kutuda " + h.pick(["kendi doldurduğun karışık kasetler", "liseden kalma fotoğraf ve biletler", "eski cep telefonun ve şarj aleti"]) + " çıktı.",
      choices: (s) => [
        c("Bir akşam anılara dal", "Moral + · biraz hüzün", { m: 3, stress: -1 }),
        c("Fotoğrafını " + HS.ek(nm(s, "liseArk"), "dat") + " at", "Telefonda iki saat gülersiniz", { rel: { liseArk: 5 }, m: 4 }),
        c("Hepsini at, yer aç", "Ferahlık", { stress: -2, m: -1 }),
      ],
    }),
    A("eskiOkul", "sokak", {
      when: (s) => TR(s) && s.city === s.birthCity && s.age >= 26,
      title: "İlkokulun önünden",
      text: "Yolun ilkokulunun önünden geçti. Bahçe küçülmüş gibi; ama aynı çınar ağacı orada duruyor. Zil çaldı.",
      choices: [
        c("Okula girip öğretmeninizi sor", "Duygusal bir an", { m: 4, people: 0.5 }),
        c("Kantinden çocukluğunun gazozunu al", "₺35 · nostalji", { cost: 35, m: 2 }),
        c("Hızlanıp geç", "", { stress: -0.5 }),
      ],
    }),
    A("mahalleCocuklar", "sokak", {
      when: (s) => TR(s) && s.age >= 30,
      title: "Saklambaç",
      text: "Sokakta çocuklar saklambaç oynuyor. Ebe sayarken top senin ayağına geldi.",
      choices: [
        c("Topu ustaca geri yolla", "Çocuklar alkışlar", { m: 3, esteem: 1 }),
        c("Biraz oyuna katıl", "Dizlerin seni uyarır", { m: 4, h: -0.5, people: 0.5 }),
        c("Topu ver, yoluna devam et", "", { m: 1 }),
      ],
    }),
    A("kitapKulubu", "salon", {
      when: (s) => has(s, "kitap"),
      title: "Kitap kulübü daveti",
      text: (s) => nm(s, "enYakin") + " bir kitap kulübüne katılmış; seni de çağırıyor. Bu ayın kitabı altı yüz sayfalık bir klasik.",
      choices: [
        c("Katıl, kitabı bitir", "Beceri + · zaman ister", { skill: 1, m: 2, rel: { enYakin: 3 }, people: 1, stress: 1 }),
        c("Sadece buluşmalara git", "Sohbet güzel", { people: 1, m: 2 }),
        c("Kibarca reddet", "", { rel: { enYakin: -1 } }),
      ],
    }),
    A("kurs", "salon", {
      when: (s) => s.age >= 22 && s.age <= 70,
      title: "Halk eğitim afişi",
      text: (s, h) => "Halk eğitim merkezinin yeni dönem afişi: " + h.pick(["ebru", "seramik", "bağlama", "ahşap boyama"]) + " kursu, haftada iki akşam.",
      choices: [
        c("Kaydol", "₺900 malzeme · yeni insanlar", { cost: 900, people: 1.5, m: 3, skill: 0.5, stress: -1 }),
        c("Bir arkadaşı da ikna et", "₺900 · birlikte daha keyifli", { cost: 900, rel: { enYakin: 3 }, m: 3 }),
        c("Belki gelecek dönem", "", { m: -0.5 }),
      ],
    }),

    // =================== MAHALLE VE APARTMAN ===================
    A("aidatToplanti", "salon", {
      when: OWN,
      title: "Apartman toplantısı",
      text: (s) => "Yönetici " + hn(s, "yonetim") + " olağanüstü toplantı çağırdı: çatı tamiri için kişi başı ek ödeme. " + nm(s, "komsu") + " şimdiden itiraz ediyor.",
      choices: (s) => [
        c("Yöneticiyi destekle", "Çatı akmaz · komşu bozulur", { rel: { yonetim: 4, komsu: -2 }, cost: RENT(s) ? 0 : 3500 }),
        c("Üç teklif alınmasını öner", "Herkes seni dinler", { rel: { yonetim: 1, komsu: 2 }, sk: { muzakere: 0.4 }, stress: 1 }),
        c("Toplantıya gitme", "Kararı başkaları verir", { rel: { yonetim: -2 }, stress: -1 }),
      ],
    }),
    A("asansor", "sokak", {
      when: OWN,
      title: "Asansör yine bozuk",
      text: (s, h) => "Asansörün kapısında yine \"ARIZALI\" yazıyor. " + h.pick(["Elinde market poşetleri var.", "Kargo da tam bu sırada geldi.", "Üst kattaki yaşlı teyze merdivende soluklanıyor."]),
      choices: (s) => [
        c("Yönetici " + HS.ek(nm(s, "yonetim"), "acc") + " ara", "Stres + · belki çözülür", { stress: 2, rel: { yonetim: -1 } }),
        c("Merdivenlerden çık, teyzeye de yardım et", "Sağlık + · komşuluk +", { h: 1, rel: { komsu: 3 }, people: 0.5 }),
        c("Kendin teknik servisi ara, faturayı yönetime ilet", "Bilgisayar ve iletişim", { sk: { iletisim: 0.3 }, rel: { yonetim: 2 }, stress: 1 }),
      ],
    }),
    A("komsuCop", "sokak", {
      when: OWN,
      title: "Kapıdaki çöp",
      text: (s) => "Üst kattan biri her gece çöpünü kapının önüne bırakıyor; sabaha kedi dağıtmış. " + nm(s, "komsu") + " \"Bence şu yeni gelenler\" diyor.",
      choices: [
        c("Kibar bir not as", "Belki işe yarar", { stress: 1, sk: { yazisma: 0.3 } }),
        c("Kapılarını çalıp konuş", "Şans %60", { chance: { p: 0.6, win: { people: 1, stress: -2 }, lose: { stress: 4, people: -0.5 }, winT: "Anlaştınız", winP: "Meğer kapıcı saatini bilmiyorlarmış; özür dilediler.", loseT: "Kavga çıktı", loseP: "Kapı yüzüne kapandı." } }),
        c("Yönetime şikâyet et", "Resmî yol", { rel: { yonetim: 2, komsu: 1 }, stress: 1 }),
      ],
    }),
    A("komsuAnahtar", "salon", {
      when: OWN,
      title: "Yedek anahtar",
      text: (s) => nm(s, "komsu") + " tatile gidiyor: \"Çiçeklerimi sular mısın? Yedek anahtarı sana bırakayım.\"",
      choices: [
        c("Tabii, sula", "Komşuluk +", { rel: { komsu: 6 }, stress: 1 }),
        c("Sen de sana anahtar bırakmayı teklif et", "Karşılıklı güven", { rel: { komsu: 8 }, people: 0.5 }),
        c("Sorumluluk almak istemiyorum", "Komşu bozulur", { rel: { komsu: -4 } }),
      ],
    }),
    A("musluk", "mutfak", {
      when: OWN,
      title: "Damlayan musluk",
      text: (s) => "Mutfak musluğu bütün gece damladı; tık, tık, tık. Usta " + nm(s, "usta") + " \"Akşam uğrarım\" dedi.",
      choices: (s) => [
        c("Ustayı çağır", "₺1.800 · temiz iş", { cost: 1800, rel: { usta: 3 }, stress: -2 }),
        c("Video izleyip contayı kendin değiştir", "₺150 · Şans %65", { cost: 150, chance: { p: 0.65, win: { m: 4, skill: 0.6, esteem: 2 }, lose: { cost: 2500, stress: 4 }, winT: "Usta gibisin", winP: "Damla durdu; kendinle gurur duydun.", loseT: "Su fışkırdı", loseP: "Vanayı kapatmayı unutmuşsun; ustayı yine de çağırdın." } }),
        RENT(s) ? c("Ev sahibine bildir", "Belki o öder · bekleme", { stress: 2 }) : c("Kova koy, sonra bakarsın", "Fatura artar", { stress: 2 }),
      ],
    }),
    A("bakkalVeresiye", "sokak", {
      when: TR,
      title: "Veresiye defteri",
      text: (s) => "Bakkal " + nm(s, "bakkal") + " mahallede zincir market açıldığından beri işlerin kötü olduğunu söyledi. Defterde birkaç komşunun borcu birikmiş.",
      choices: [
        c("Alışverişini bundan sonra ondan yap", "Biraz pahalı · bakkal yaşar", { cost: 600, rel: { bakkal: 6 }, people: 0.5 }),
        c("Bir komşunun borcunu gizlice kapat", "₺1.200 · mahallede iyilik", { cost: 1200, rel: { bakkal: 4 }, m: 4, esteem: 2 }),
        c("Ucuz olana gitmeye devam", "Cüzdan rahat", { rel: { bakkal: -2 }, sk: { finans: 0.2 } }),
      ],
    }),
    A("doktorAsi", "sokak", {
      when: (s) => TR(s) && WK(40, 47)(s),
      title: "Grip aşısı",
      text: (s) => "Aile hekimin Dr. " + nm(s, "doktor") + " mesaj attı: \"Grip aşısı geldi, risk grubundaysanız bekleriz.\"" + (s.age >= 60 ? " Yaşın gereği risk grubundasın." : ""),
      choices: (s) => [
        c("Git, aşını ol", s.age >= 60 ? "Ücretsiz · sağlık +" : "₺900 · sağlık +", { cost: s.age >= 60 ? 0 : 900, h: 2, rel: { doktor: 3 } }),
        c("Vitamin ve ıhlamurla geçiştir", "₺250", { cost: 250, h: 0.5 }),
        c("Gerek yok", "Kış uzun", { stress: -0.5 }),
      ],
    }),
    A("doktorTahlil", "sokak", {
      when: (s) => TR(s) && s.age >= 35,
      title: "Tahlil sonuçları",
      text: (s, h) => "Dr. " + nm(s, "doktor") + " kan tahlilinde " + h.pick(["kolesterolün", "D vitaminin", "şekerin"]) + " sınırda olduğunu söyledi. \"İlaçlık değil ama dikkat.\"",
      choices: [
        c("Beslenmeni ciddi şekilde düzenle", "Sağlık + · moral − (tatlıya veda)", { h: 3, m: -2, kg: -0.4, rel: { doktor: 2 } }),
        c("Haftada üç gün yürüyüş", "Sağlık + · disiplin", { h: 2, sk: { disiplin: 0.3 } }),
        c("Bir ay sonra yine bakarız", "", { stress: 1 }),
      ],
    }),

    // =================== İŞ HAYATI ===================
    A("herkeseYanitla", "is", {
      when: (s) => LEGAL(s) && ["office", "memur", "business", "teacher"].includes(s.job),
      title: "Herkese yanıtla",
      text: (s) => "Yöneticin " + nm(s, "yonetici") + " hakkındaki sitemli mesajını " + HS.ek(nm(s, "isArk"), "dat") + " atacaktın. Yanlışlıkla \"Tümünü yanıtla\"ya bastın.",
      choices: [
        c("Hemen özür e-postası yaz", "Dürüstlük · biraz utanç", { rel: { yonetici: -2 }, esteem: -2, stress: 3 }),
        c("Yöneticiyle yüz yüze konuş", "Şans %55", { chance: { p: 0.55, win: { rel: { yonetici: 4 }, perf: 2, esteem: 2 }, lose: { rel: { yonetici: -6 }, perf: -3, stress: 4 }, winT: "Hava temizlendi", winP: "\"Haklı olduğun yerler var\" dedi; ilişkiniz düzeldi.", loseT: "Soğuk bir konuşma", loseP: "Yöneticin seni dinledi ama yüzü hiç gülmedi." } }),
        c("Görmezden gel, unutulur", "Koridorda fısıltılar", { rel: { yonetici: -5, isArk: -1 }, stress: 2 }),
      ],
    }),
    A("klimaSavasi", "is", {
      when: (s) => LEGAL(s) && ["office", "memur", "business"].includes(s.job) && summer(s),
      title: "Klima savaşı",
      text: (s) => nm(s, "isArk") + " klimayı 18 dereceye ayarladı; sen hırkayla oturuyorsun. Karşı masadaki herkes terliyor.",
      choices: [
        c("Uzlaşı: 24 derece", "Herkes biraz memnun", { rel: { isArk: 1 }, sk: { muzakere: 0.3 }, stress: -1 }),
        c("Battaniye getir", "Komik ama işe yarar", { m: 1, people: 0.5 }),
        c("Kumandayı sakla", "Pasif agresif", { rel: { isArk: -4 }, m: 2 }),
      ],
    }),
    A("isArkBorc", "is", {
      when: LEGAL,
      title: "Ay sonu",
      text: (s, h) => nm(s, "isArk") + " çekinerek yaklaştı: \"Maaşa kadar " + h.tl(5000) + " lazım, kiramı yatıramadım.\"",
      choices: [
        c("Ver", "₺5.000 · geri gelir mi?", { cost: 5000, rel: { isArk: 6 }, chance: { p: 0.75, win: { cash: 5000 }, lose: { m: -3, rel: { isArk: -4 } }, winT: "Borç geldi", winP: "Maaş günü parayı bir kutu baklavayla getirdi.", loseT: "Ses yok", loseP: "Aylar geçti; konuyu açmak bile tuhaf oldu." } }),
        c("Yarısını ver", "₺2.500", { cost: 2500, rel: { isArk: 3 } }),
        c("Kibarca reddet", "İlişki biraz soğur", { rel: { isArk: -3 } }),
      ],
    }),
    A("isArkIstifa", "is", {
      when: LEGAL,
      title: "Bir sır",
      text: (s) => nm(s, "isArk") + " öğle arasında fısıldadı: \"Başka yerden teklif aldım, ay sonu istifa ediyorum. Kimseye söyleme.\" Yöneticin " + nm(s, "yonetici") + " ise yeni proje ekibini kuruyor.",
      choices: [
        c("Sırrı sakla, tebrik et", "Güven +", { rel: { isArk: 6 }, stress: 1 }),
        c("Yöneticiye ima et", "Kariyer + · vicdan −", { rel: { yonetici: 3, isArk: -8 }, perf: 2, esteem: -2 }),
        c("O şirkette sana da yer var mı, sor", "Kapı aralanır", { rel: { isArk: 3 }, people: 1, m: 1 }),
      ],
    }),
    A("yoneticiHaftasonu", "yatak", {
      when: (s) => LEGAL(s) && HS.lateWeek(s),
      title: "Pazar 22.47",
      text: (s) => "Telefon titredi. Yöneticin " + nm(s, "yonetici") + ": \"Yarın sabah ilk iş şu raporu konuşalım, bir bakarsan iyi olur.\"",
      choices: [
        c("Hemen açıp çalış", "Performans + · uykusuz", { perf: 3, sleep: 3, stress: 3 }),
        c("\"Sabah bakarım\" yaz", "Sınır koyarsın", { esteem: 2, rel: { yonetici: -1 } }),
        c("Görmemiş gibi yap", "Sabah stres", { stress: 2, rel: { yonetici: -2 } }),
      ],
    }),
    A("isKek", "is", {
      when: LEGAL,
      title: "Ev yapımı kek",
      text: (s) => nm(s, "isArk") + " herkese kek getirmiş. Tadı... şüpheli. Herkes sana bakıyor; ilk dilimi sen alacaksın.",
      choices: [
        c("Ye, abartarak öv", "İş arkadaşı çok sevinir", { rel: { isArk: 5 }, m: 1, kg: 0.1 }),
        c("Dürüstçe tarifini sor", "Belki gelişir · alınabilir", { rel: { isArk: -1 }, sk: { iletisim: 0.3 } }),
        c("Diyetteyim de", "", { rel: { isArk: -1 }, kg: -0.05 }),
      ],
    }),
    A("cafeYulafSut", "is", {
      when: (s) => s.job === "cafe" && WORK(s),
      title: "Sütü değiştirebilir misiniz?",
      text: (s, h) => "Bir müşteri latte'sini üçüncü kez geri gönderdi: \"" + h.pick(["Yulaf sütü istemiştim, bu badem.", "Çok sıcak.", "Köpüğü az."]) + "\" Arkada kuyruk uzuyor.",
      choices: [
        c("Gülümse, baştan yap", "Servis + · stres +", { sk: { servis: 0.5 }, stress: 3, perf: 1 }),
        c("Müdürü çağır", "Sorumluluk paylaşılır", { stress: 1, perf: -1 }),
        c("Kibarca ama net konuş", "İletişim +", { sk: { iletisim: 0.4 }, esteem: 2, stress: 1 }),
      ],
    }),
    A("fabrikaServis", "is", {
      when: (s) => s.job === "factory" && WORK(s),
      title: "Servis kaçtı",
      text: (s) => "Sabah 06.40. Fabrika servisi köşeyi dönerken arkasından koştun ama yetişemedin. " + nm(s, "isArk") + " arabasıyla aynı sanayiye gidiyor.",
      choices: [
        c("İş arkadaşını ara", "Bir iyilik borçlanırsın", { rel: { isArk: 3 }, stress: 1 }),
        c("Taksiyle git", "₺700", { cost: 700 }),
        c("Toplu taşımayla git, geç kal", "Performans −", { perf: -2, stress: 2 }),
      ],
    }),
    A("fabrikaKask", "is", {
      when: (s) => s.job === "factory" && WORK(s),
      title: "Kaskı unutmuş",
      text: (s) => "Hattaki yeni çocuk baret takmadan forkliftin geçtiği alana girdi. Ustabaşı görmedi.",
      choices: [
        c("Uyar, kendi yedek bareti ver", "İş güvenliği +", { sk: { isguvenligi: 0.5 }, people: 1, esteem: 1 }),
        c("Ustabaşına bildir", "Kural kuraldır · çocuk ceza alabilir", { perf: 1, people: -0.5 }),
        c("Kendi işine bak", "Bir şey olursa?", { stress: 3 }),
      ],
    }),
    A("muzikIstek", "is", {
      when: (s) => s.job === "music" && WORK(s),
      title: "Düğünde istek parça",
      text: (s, h) => "Düğünde damadın amcası sahneye geldi, kulağına " + h.pick(["aynı halayı dördüncü kez", "bilmediğin bir yöresel türküyü", "çok eski bir arabeski"]) + " istedi. Eline de bahşiş sıkıştırıyor.",
      choices: [
        c("Çal, salonu coştur", "+₺1.500 bahşiş · yorgunluk", { cash: 1500, stress: 2, sk: { sahne: 0.4 } }),
        c("Doğaçlama dene", "Şans %50", { chance: { p: 0.5, win: { m: 5, esteem: 3, people: 1, sk: { enstruman: 0.5 } }, lose: { m: -2, esteem: -2 }, winT: "Salon ayağa kalktı", winP: "Bilmediğin parçayı kulaktan çıkardın; herkes alkışladı.", loseT: "Yanlış nota", loseP: "Amca kaşlarını çattı; bahşiş cebine geri girdi." } }),
        c("Programa sadık kal", "Profesyonel ama soğuk", { esteem: 1, people: -0.5 }),
      ],
    }),
    A("ogretmenVeli", "is", {
      when: (s) => s.job === "teacher" && WORK(s),
      title: "Veli grubu, 23.15",
      text: "Veli mesaj grubunda bir veli, ödevin \"çok ağır\" olduğunu yazdı. Altına on iki kişi \"aynen\" yazmış.",
      choices: [
        c("Sabah sakin bir açıklama yaz", "Pedagoji +", { sk: { pedagoji: 0.5 }, stress: 1 }),
        c("Ödevi hafiflet", "Veliler mutlu · sen kırgın", { people: 1, esteem: -1 }),
        c("Gruptan çık, okul kanalını kullan", "Sınır koyarsın", { stress: -2, people: -0.5, esteem: 1 }),
      ],
    }),
    A("ogretmenGunu", "is", {
      when: (s) => s.job === "teacher" && WORK(s) && WK(46, 48)(s),
      title: "24 Kasım",
      text: "Sınıfa girdiğinde tahtada kocaman \"Öğretmenler Gününüz Kutlu Olsun\" yazıyor. Masada el yapımı kartlar var.",
      choices: [
        c("Duygusal bir konuşma yap", "Moral +", { m: 6, esteem: 3 }),
        c("Kartları sakla, her birine cevap yaz", "Bir hafta sonun gider · iz bırakır", { m: 4, stress: 1, sk: { pedagoji: 0.4 } }),
        c("\"Hadi derse\" deyip gülümse", "", { m: 2 }),
      ],
    }),
    A("hemsireYakin", "is", {
      when: (s) => s.job === "nurse" && WORK(s),
      title: "Hasta yakını",
      text: "Gece nöbetinde bir hasta yakını, babasına neden hâlâ doktor bakmadığını bağırarak soruyor. Koridordaki herkes size bakıyor.",
      choices: [
        c("Sakinleştir, durumu açıkla", "İletişim + · enerji gider", { sk: { hasta: 0.5 }, stress: 3 }),
        c("Güvenliği çağır", "Güvendesin · gerilim kalır", { stress: 1 }),
        c("Nöbetçi doktoru tekrar ara", "Hasta önce · yorgunluk", { perf: 2, stress: 2, sleep: 2 }),
      ],
    }),
    A("memurEvrak", "is", {
      when: (s) => s.job === "memur" && WORK(s),
      title: "Eksik evrak",
      text: "Yaşlı bir vatandaş üçüncü kez geldi; yine bir belge eksik. Saat 16.55, mesai bitmek üzere.",
      choices: [
        c("Eksik belgeyi sistemden kendin çıkar", "Mevzuat + · mesai uzar", { sk: { mevzuat: 0.4 }, m: 4, stress: 1 }),
        c("Kibarca yarına gel", "Kural böyle", { stress: -1, m: -1 }),
        c("Ne getireceğini yazıp ver", "Orta yol", { sk: { yazisma: 0.3 } }),
      ],
    }),
    A("isletmeYorum", "is", {
      when: (s) => s.job === "business" && WORK(s),
      title: "Tek yıldızlı yorum",
      text: (s, h) => "İşletmen için internete tek yıldızlı bir yorum düşmüş: \"" + h.pick(["Personel ilgisiz.", "Fiyatlar uçuk.", "Bekledim, kimse gelmedi."]) + "\" Yorum yapan hiç müşterin olmamış olabilir.",
      choices: [
        c("Kibar ve profesyonel cevap yaz", "Güven verir", { sk: { pazarlama: 0.4 }, stress: 1, esteem: 1 }),
        c("Sert bir cevap yaz", "Kızgınlığın geçer · itibar −", { stress: -2, people: -1 }),
        c("Personelle bir toplantı yap", "İşleyiş düzelir", { perf: 2, sk: { liderlik: 0.3 }, stress: 2 }),
      ],
    }),
    A("crimeMahalle", "sokak", {
      when: (s) => s.job === "crime" && TR(s),
      title: "Bakkalın bakışı",
      text: (s) => "Bakkal " + nm(s, "bakkal") + " son zamanlarda seni gördüğünde sesini alçaltıyor. Bugün tezgâhın arkasından \"Evlat, kendine dikkat et\" dedi.",
      choices: [
        c("Teşekkür et, sohbet et", "Mahallede birinin seni düşünmesi iyi", { rel: { bakkal: 4 }, m: 1, stress: -1 }),
        c("Ters cevap ver", "Bakkal üzülür", { rel: { bakkal: -6 }, stress: 1 }),
        c("Uzun uzun düşün", "Belki bir şeyler değişir", { esteem: 1, risk: -1 }),
      ],
    }),
    A("isYemekhane", "is", {
      when: (s) => LEGAL(s) && ["factory", "office", "memur", "nurse", "teacher"].includes(s.job),
      title: "Yemekhanede kuru fasulye günü",
      text: (s) => "Yemekhanede kuru fasulye pilav günü. " + nm(s, "isArk") + " iki tabak almış, birini sana uzatıyor. Öğleden sonra da sunumun var.",
      choices: [
        c("Afiyetle ye", "Moral + · öğleden sonra ağırlık", { m: 3, kg: 0.15, perf: -0.5, rel: { isArk: 2 } }),
        c("Salata al", "Sağlık +", { h: 0.5, m: -1 }),
        c("Yemekte sunumu prova et", "Performans +", { perf: 2, rel: { isArk: -1 } }),
      ],
    }),

    // =================== ÖĞRENCİ ===================
    A("ogrGrupOdev", "is", {
      when: (s) => s.edu === "ogrenci",
      title: "Grup ödevi",
      text: (s, h) => "Dört kişilik grup ödevi. " + h.pick(["İki kişi mesajlara cevap vermiyor.", "Biri sadece kapak sayfasını yapmış.", "Teslim yarın, slaytların yarısı boş."]),
      choices: [
        c("Hepsini kendin bitir", "Not + · tükenmişlik", { skill: 0.6, stress: 5, sleep: 3, sk: { sunum: 0.3 } }),
        c("Hocaya durumu yaz", "Adil ama gerginlik", { stress: 2, esteem: 2, people: -0.5 }),
        c("Görev dağılımını netleştir", "Liderlik +", { sk: { liderlik: 0.4 }, stress: 2, people: 0.5 }),
      ],
    }),
    A("ogrFotokopi", "is", {
      when: (s) => s.edu === "ogrenci",
      title: "Ders kitabı",
      text: (s, h) => "Hocanın istediği kitap " + h.tl(1600) + ". Kampüsteki fotokopici bütün kitabı ciltli olarak çok daha ucuza veriyor.",
      choices: [
        c("Orijinalini al", "₺1.600 · yazara saygı", { cost: 1600, esteem: 1 }),
        c("Fotokopisini al", "₺350 · telif?", { cost: 350, esteem: -1 }),
        c("Kütüphaneden ödünç al", "Bedava · sıraya girersin", { stress: 2, skill: 0.3 }),
      ],
    }),
    A("ogrKopya", "is", {
      when: (s) => s.edu === "ogrenci",
      title: "Sınavda yan sıra",
      text: "Vizede yanındaki öğrenci kâğıdını sana doğru eğdi; cevapları açıkça görebiliyorsun. Gözetmen kapıda telefonla konuşuyor.",
      choices: [
        c("Kendi kağıdına odaklan", "Esteem + · not belirsiz", { esteem: 2, chance: { p: 0.5, win: { m: 3 }, lose: { m: -2 }, winT: "İyi geçti", winP: "Kendi bilginle yüksek aldın.", loseT: "Orta bir not", loseP: "Ama hepsi senin." } }),
        c("Bir iki soruya bak", "Şans: yakalanabilirsin", { chance: { p: 0.75, win: { m: 2, esteem: -2 }, lose: { m: -5, stress: 6, esteem: -3 }, winT: "Kimse görmedi", winP: "Not iyi ama içinde bir burukluk.", loseT: "Tutanak tutuldu", loseP: "Gözetmen döndü ve gördü. Disipline sevk edildin." } }),
      ],
    }),
    A("ogrBurs", "is", {
      when: (s) => s.edu === "ogrenci" && TR(s),
      title: "Burs başvurusu",
      text: "Bir vakıf burs başvurularını açtı: niyet mektubu, transkript ve mülakat. Son gün yarın.",
      choices: [
        c("Gece oturup mektubu yaz", "Şans %45", { sleep: 3, chance: { p: 0.45, win: { cash: 9000, m: 5, esteem: 3 }, lose: { m: -2 }, winT: "Burs çıktı", winP: "Dönem boyunca aylık destek alacaksın; ilk taksit yattı.", loseT: "Bu sefer olmadı", loseP: "Mülakat iyi geçmişti ama kontenjan dolmuş." } }),
        c("Hazır şablondan doldur", "Hızlı ama zayıf", { chance: { p: 0.15, win: { cash: 9000, m: 4 }, lose: { m: -1 }, winT: "Şanslısın", winP: "Kimse fark etmedi, burs çıktı.", loseT: "Elendin", loseP: "Kopyala-yapıştır anlaşılmış." } }),
        c("Başvurma", "", { stress: -1 }),
      ],
    }),
    A("ogrYurtOda", "yatak", {
      when: (s) => s.edu === "ogrenci" && s.housing !== "aile",
      title: "Oda arkadaşının alarmı",
      text: "Oda arkadaşının alarmı sabah beşten beri beş dakikada bir çalıyor. Kendisi derin uykuda.",
      choices: [
        c("Uyandır, konuş", "İletişim + · gerginlik", { sk: { iletisim: 0.3 }, stress: 1 }),
        c("Kulak tıkacı al", "₺120 · sorun biter", { cost: 120, sleep: -1 }),
        c("Telefonu sessize al, sabah söyle", "Pasif agresif ama etkili", { m: 1, people: -0.5 }),
      ],
    }),

    // =================== EMEKLİ ===================
    A("emekliTavla", "sokak", {
      when: (s) => s.retired && TR(s),
      title: "Kahvehanede tavla",
      text: (s) => "Kahvede emekli arkadaşların seni bekliyor. " + nm(s, "komsu") + " zarları sallıyor: \"Bugün mars ederim seni!\"",
      choices: [
        c("Otur, oyna", "Şans %50", { chance: { p: 0.5, win: { m: 5, people: 1, rel: { komsu: 2 } }, lose: { m: 1, people: 1, rel: { komsu: 2 } }, winT: "Mars ettin", winP: "Bütün kahve duydu.", loseT: "Mars oldun", loseP: "Çaylar senden." } }),
        c("Çay ısmarla, izle", "₺100", { cost: 100, people: 1, m: 2 }),
        c("Parkta yürüyüşe çık", "Sağlık +", { h: 1 }),
      ],
    }),
    A("emekliTorunBakim", "salon", {
      when: (s) => s.retired && (s.children || []).some((k) => s.year - k.born >= 25),
      title: "Torun nöbeti",
      text: "Çocuğun aradı: \"Bu hafta kreş kapalı, torunu sana bırakabilir miyiz?\" Beş gün, sabahtan akşama.",
      choices: [
        c("Tabii, gelsin", "Yorulursun ama mutlu olursun", { kidBond: 5, h: -1, m: 4, stress: 2 }),
        c("İki gün bakabilirim", "Dengeli", { kidBond: 2, m: 1 }),
        c("Planlarım var", "Biraz kırılırlar", { kidBond: -3, stress: -1 }),
      ],
    }),
    A("emekliBahce", "sokak", {
      when: (s) => s.retired && TR(s),
      title: "Hobi bahçesi",
      text: (s, h) => "Belediye şehir dışındaki hobi bahçelerini kiraya veriyor. Yıllık " + h.tl(6000) + "; domates, fasulye, belki bir de çardak.",
      choices: [
        c("Kirala", "₺6.000 · sağlık + moral +", { cost: 6000, h: 2, m: 4, people: 1, flag: "hobiBahce" }),
        c("Komşuyla ortak kirala", "₺3.000 · birlikte", { cost: 3000, h: 1, m: 3, rel: { komsu: 5 } }),
        c("Balkon yeter", "", { m: 0.5 }),
      ],
    }),
    A("emekliMaas", "sokak", {
      when: (s) => s.retired && TR(s),
      title: "Maaş günü kuyruğu",
      text: (s) => "Emekli maaşının yattığı gün. Bankamatiğin önünde uzun bir kuyruk var; önündeki teyze kartını nasıl kullanacağını bilmiyor.",
      choices: [
        c("Yardım et", "Kuyruk uzar ama teyze minnettar", { m: 3, people: 1, esteem: 1 }),
        c("Uygulamadan işlemini yap, kuyruğa girme", "Bilgisayar +", { sk: { bilgisayar: 0.4 }, stress: -1 }),
        c("Yarın gel", "", { stress: 1 }),
      ],
    }),

    // =================== YURT DIŞI ===================
    A("ydMarket", "mutfak", {
      when: (s) => s.abroad,
      title: "Türk marketi",
      text: (s) => (HS.COUNTRIES[s.city] ? HS.COUNTRIES[s.city].city : "Şehrin") + " kenar mahallesinde bir Türk marketi buldun. Raflarda simit, beyaz peynir, çay... fiyatlar üç katı.",
      choices: [
        c("Sepeti doldur", "₺3.500 · memleket kokusu", { cost: 3500, m: 5 }),
        c("Sadece çay ve peynir al", "₺900", { cost: 900, m: 2 }),
        c("Yerel mutfağa alış", "Dil ve uyum +", { sk: { iletisim: 0.3 }, m: -1 }),
      ],
    }),
    A("ydBayram", "salon", {
      when: (s) => s.abroad && !!kin(s, "anne", "baba"),
      title: "Uzaktan bayram",
      text: (s) => "Türkiye'de bayram. Aile grubunda sofra fotoğrafları birbiri ardına geliyor. " + kin(s, "anne", "baba").name + " görüntülü arıyor.",
      choices: (s) => {
        const k = kin(s, "anne", "baba");
        return [
          c("Uzun uzun konuş, herkesi tek tek gör", "Hasret biraz diner", { m: 3, ...KB(k, 5), stress: -1 }),
          c("Burada Türk arkadaşlarla bayram yemeği yap", "₺1.800 · yeni bir aile", { cost: 1800, people: 2, m: 4 }),
          c("Kısa tut; ağlamaktan korkuyorsun", "Hüzün", { m: -3, ...KB(k, 1) }),
        ];
      },
    }),
    A("ydDil", "is", {
      when: (s) => s.abroad,
      title: "Yanlış kelime",
      text: "Toplantıda yerel dilde kendinden emin bir cümle kurdun. Herkes kahkahayla güldü: bir kelimeyi çok komik bir başka kelimeyle karıştırmışsın.",
      choices: [
        c("Sen de gül", "Buz kırılır", { people: 1.5, m: 2, esteem: 1 }),
        c("Akşam kursuna yazıl", "₺4.000 · dil +", { cost: 4000, skill: 0.8, sk: { iletisim: 0.3 } }),
        c("Bir daha konuşmamaya yemin et", "Özgüven −", { esteem: -3, stress: 2 }),
      ],
    }),
    A("ydCay", "mutfak", {
      when: (s) => s.abroad,
      title: "İnce belli bardak",
      text: "İş arkadaşlarına çaydanlıkta demlenmiş çay ve ince belli bardaklarla ikram ettin. Biri neden şeker yerine bal olmadığını soruyor.",
      choices: [
        c("Çay kültürünü anlatan bir sunum yap", "Popülerleşirsin", { people: 2, m: 3, sk: { sunum: 0.3 } }),
        c("Bir dahaki sefere simit de getir", "₺400 · herkes bayılır", { cost: 400, people: 1.5, m: 2 }),
        c("Gülümse, geç", "", { m: 1 }),
      ],
    }),

    // =================== PARTNER ===================
    A("pKumanda", "salon", {
      when: (s) => !!s.partner,
      title: "Kumanda kimde?",
      text: (s, h) => P(s) + " " + h.pick(["yemek yarışması", "belgesel", "bir reality şov"]) + " izlemek istiyor; sense yarım kalan dizine dönmek istiyorsun.",
      choices: (s) => [
        c("Onun seçimine katıl", "Bağ +", { bond: 3, m: -1 }),
        c("Yazı tura at", "Adil", { chance: { p: 0.5, win: { m: 2 }, lose: { m: -1 }, winT: "Tura geldi", winP: "Dizine döndün; " + P(s) + " telefona gömüldü.", loseT: "Yazı geldi", loseP: "Ama yemek yarışması sandığından eğlenceliymiş." } }),
        c("Kulaklıkla tablette izle", "Yan yana ama ayrı", { bond: -2, m: 2 }),
      ],
    }),
    A("pEskiSevgili", "salon", {
      when: (s) => !!s.partner,
      title: "Eski bir beğeni",
      text: (s) => P(s) + " telefonunu uzattı: \"Bu kim? Fotoğrafını üç yıl öncesine kadar beğenmiş.\" Eski sevgilin.",
      choices: (s) => [
        c("Dürüstçe anlat, telefonu göster", "Güven +", { trust: 4, bond: 2, stress: 1 }),
        c("Gülerek geçiştir", "Şans %50", { chance: { p: 0.5, win: { bond: 1 }, lose: { trust: -5, bond: -3 }, winT: "Gülüp geçti", winP: P(s) + " de güldü; konu kapandı.", loseT: "Soğuk bir akşam", loseP: "Geçiştirmen şüpheyi artırdı." } }),
        c("Kişiyi engelle", "Net bir mesaj", { trust: 3, people: -0.5 }),
      ],
    }),
    A("pTatilPlan", "salon", {
      when: (s) => !!s.partner && WK(18, 26)(s),
      title: "Tatil tartışması",
      text: (s) => P(s) + " deniz kenarında her şey dahil otel istiyor; sen çadır ve yayla. Bütçe aynı.",
      choices: [
        c("Otel olsun", "₺22.000 · bağ +", { cost: 22000, bond: 5, m: 3, stress: -3 }),
        c("Kamp yapın", "₺6.000 · macera", { cost: 6000, bond: 2, m: 4, h: 1 }),
        c("Yarısı orada yarısı burada", "₺14.000 · uzlaşma", { cost: 14000, bond: 4, sk: { muzakere: 0.3 } }),
      ],
    }),
    A("pYemekDeneme", "mutfak", {
      when: (s) => !!s.partner,
      title: "İlk denemesi",
      text: (s, h) => P(s) + " ilk kez " + h.pick(["mantı", "karnıyarık", "içli köfte"]) + " yaptı ve gözlerini sana dikti. Tuz biraz fazla.",
      choices: [
        c("Bayıldım de, tabağı bitir", "Bağ + · biraz yalan", { bond: 4, h: -0.5 }),
        c("Tuzu nazikçe söyle", "Güven + · biraz bozulabilir", { trust: 3, bond: -1 }),
        c("Birlikte bir daha yapalım de", "En tatlı yol", { bond: 5, m: 2 }),
      ],
    }),
    A("pAnneTelefon", "salon", {
      when: (s) => !!s.partner && !!kin(s, "kayinvalide"),
      title: "Kayınvalide pazarı",
      text: (s) => "Kayınvalide " + kin(s, "kayinvalide").name + " pazar kahvaltısına çağırdı. Geçen sefer çayın rengini beğenmemişti.",
      choices: (s) => {
        const k = kin(s, "kayinvalide");
        return [
          c("Ev yapımı bir kek götür", "₺300 · puan topla", { cost: 300, ...KB(k, 6), bond: 3 }),
          c("Git, sessizce otur", "Sorunsuz", { ...KB(k, 2), stress: 2 }),
          c("İşim var de", P(s) + " bozulur", { ...KB(k, -4), bond: -3, stress: -2 }),
        ];
      },
    }),
    A("pYildonumu", "yatak", {
      when: (s) => !!s.partner && !!s.partner.married,
      title: "Evlilik yıldönümü",
      text: (s) => "Takvimde bir kalp: yıldönümünüz yarın. " + P(s) + " bir şey söylemedi; unuttuğunu düşünüyor olabilir.",
      choices: [
        c("Sürpriz bir akşam yemeği hazırla", "₺1.200 · bağ +", { cost: 1200, bond: 6, m: 3 }),
        c("Düğün fotoğraflarından albüm bastır", "₺2.000 · duygusal", { cost: 2000, bond: 7, trust: 2 }),
        c("Akşam sinemaya gidelim de", "₺800", { cost: 800, bond: 3, m: 2 }),
      ],
    }),

    // =================== ÇOCUKLAR ===================
    A("kidSoru", "yatak", {
      when: (s) => !!kidOf(s, 4, 9),
      title: "Uyumadan önce soru",
      text: (s, h) => kidOf(s, 4, 9).name + " yorganın altından sordu: \"" + h.pick(["Gökyüzü neden mavi?", "Ölünce nereye gidiyoruz?", "Ben bebekken de beni sever miydin?", "Dinozorlar neden yok artık?"]) + "\"",
      choices: [
        c("Oturup uzun uzun anlat", "Bağ + · geç yatarsın", { kidBond: 6, sleep: 1 }),
        c("Yarın kütüphanede birlikte araştıralım de", "Merak beslenir", { kidBond: 4, skill: 0.2 }),
        c("Kısa cevap ver, ışığı kapat", "", { kidBond: -1, sleep: -1 }),
      ],
    }),
    A("kidTablet", "salon", {
      when: (s) => !!kidOf(s, 6, 13),
      title: "Herkeste var",
      text: (s) => kidOf(s, 6, 13).name + " ağlamaklı: \"Sınıfta herkesin tableti var, bir tek benim yok!\"",
      choices: [
        c("Al", "₺14.000 · mutlu çocuk", { cost: 14000, kidBond: 4, m: 1 }),
        c("Harçlık biriktirmesine yardım et, yarısını sen koy", "₺7.000 · finans dersi", { cost: 7000, kidBond: 3, sk: { finans: 0.3 } }),
        c("Hayır de, ekran süresini konuş", "Kriz ama ilke", { kidBond: -3, stress: 2, esteem: 1 }),
      ],
    }),
    A("kidVeli", "sokak", {
      when: (s) => !!kidOf(s, 7, 17) && TR(s),
      title: "Veli toplantısı",
      text: (s) => "Öğretmen, " + HS.ek(kidOf(s, 7, 17).name, "gen") + " derste çok konuştuğunu ama çok da zeki olduğunu söyledi. Diğer veliler sana bakıyor.",
      choices: [
        c("Evde sakin bir konuşma yap", "Bağ +", { kidBond: 4 }),
        c("Ceza ver: bir hafta konsol yok", "Disiplin · kırgınlık", { kidBond: -3, stress: 1 }),
        c("Enerjisini bir kursa yönlendir", "₺3.000 · drama ya da münazara", { cost: 3000, kidBond: 5 }),
      ],
    }),
    A("kidDis", "yatak", {
      when: (s) => !!kidOf(s, 5, 8),
      title: "Diş perisi",
      text: (s) => kidOf(s, 5, 8).name + " ilk sütdişini yastığın altına koydu. Sabaha bir şey bekliyor.",
      choices: [
        c("Bozuk para ve bir not bırak", "₺50 · büyülü sabah", { cost: 50, kidBond: 5, m: 3 }),
        c("Büyük bir sürpriz yap", "₺500 · çocuk çok sevinir", { cost: 500, kidBond: 6, m: 2 }),
        c("Unut", "Sabah hayal kırıklığı", { kidBond: -3, m: -2 }),
      ],
    }),

    // =================== AKRABALAR VE BÜYÜKLER ===================
    A("anneanneTarif", "mutfak", {
      when: (s) => !!kin(s, "anneanne", "babaanne"),
      title: "Ölçüsüz tarif",
      text: (s) => {
        const k = kin(s, "anneanne", "babaanne");
        return HS.kinLabel(k) + " " + k.name + " telefonda yaprak sarma tarifini veriyor: \"Bir avuç pirinç, göz kararı salça, kıvamını görünce anlarsın.\"";
      },
      choices: (s) => {
        const k = kin(s, "anneanne", "babaanne");
        return [
          c("Görüntülü arayıp birlikte yapın", "Bağ + · unutulmaz", { ...KB(k, 8), m: 4, skill: 0.3 }),
          c("Tarifi gramajıyla bir deftere yaz", "Aile mirası", { ...KB(k, 4), m: 2, flag: "aileTarif" }),
          c("Hazırını al", "₺450", { cost: 450, ...KB(k, -1) }),
        ];
      },
    }),
    A("dedeHikaye", "salon", {
      when: (s) => !!kin(s, "dede", "anneanne", "babaanne"),
      title: "Aynı hikâye",
      text: (s) => {
        const k = kin(s, "dede", "anneanne", "babaanne");
        return k.name + " yine o hikâyeyi anlatmaya başladı; gençliğinde " + HS.ek(k.city || s.birthCity, "abl") + " yürüyerek düğüne gittiği gece. Bu kaçıncı?";
      },
      choices: (s) => {
        const k = kin(s, "dede", "anneanne", "babaanne");
        return [
          c("Sanki ilk kez duyuyormuş gibi dinle", "Bağ +", { ...KB(k, 6), m: 2 }),
          c("Bu sefer telefonla kaydet", "Bir gün çok değerli olacak", { ...KB(k, 5), m: 3, flag: "dedeKayit" }),
          c("\"Bunu anlatmıştın\" de", "Kırılır", { ...KB(k, -4) }),
        ];
      },
    }),
    A("babaWhatsapp", "salon", {
      when: (s) => !!kin(s, "baba", "anne") && s.age < 50,
      title: "Sesli mesaj",
      text: (s, h) => {
        const k = kin(s, "baba", "anne");
        return k.name + " sana " + h.pick(["dört dakikalık", "yedi dakikalık", "üç parçalı"]) + " bir sesli mesaj attı. İlk otuz saniyesi cebinden gelen hışırtı.";
      },
      choices: (s) => {
        const k = kin(s, "baba", "anne");
        return [
          c("Sonuna kadar dinle, geri ara", "Bağ +", { ...KB(k, 4), stress: 1 }),
          c("Hızlandırarak dinle", "Pratik", { ...KB(k, 1) }),
          c("\"Yazsana\" diye cevap ver", "Kırılır", { ...KB(k, -3) }),
        ];
      },
    }),
    A("kardesBorc", "salon", {
      when: (s) => !!kin(s, "kardesK", "kardesE") && s.age >= 22,
      title: "Kardeşinin mesajı",
      text: (s, h) => {
        const k = kin(s, "kardesK", "kardesE");
        return k.name + " yazdı: \"" + h.pick(["Konser bileti için biraz para lazım, annemlere söyleme.", "Ehliyet kursu taksidim kaldı.", "Telefonum kırıldı, ekran parası lazım."]) + "\"";
      },
      choices: (s) => {
        const k = kin(s, "kardesK", "kardesE");
        return [
          c("Gönder", "₺2.500 · ablalık/abilik", { cost: 2500, ...KB(k, 6) }),
          c("Yarısını gönder, yarısını kendisi biriktirsin", "₺1.250", { cost: 1250, ...KB(k, 3), sk: { finans: 0.2 } }),
          c("Annemlerle konuşalım de", "Kardeşin bozulur", { ...KB(k, -4) }),
        ];
      },
    }),
    A("kuzenDugunVideo", "salon", {
      when: (s) => !!kin(s, "kuzen"),
      title: "Kuzenin videosu",
      text: (s) => kin(s, "kuzen").name + " sosyal medyada çocukken düğünde birlikte oynadığınız eski bir videoyu paylaştı. Seni de etiketlemiş.",
      choices: (s) => {
        const k = kin(s, "kuzen");
        return [
          c("Paylaş, altına anı yaz", "Bağ + · biraz utanç", { ...KB(k, 5), m: 3, people: 0.5 }),
          c("Özelden \"sil şunu\" yaz", "Gülüşürsünüz", { ...KB(k, 2), m: 1 }),
          c("Etiketi kaldır", "", { ...KB(k, -2) }),
        ];
      },
    }),

    // =================== EVCİL HAYVAN ===================
    A("kediKoltuk", "salon", {
      when: (s) => !!s.flags.kedi,
      title: "Koltuğun kolu",
      text: (s) => "Kedin koltuğun kolunu tırmalama tahtası ilan etmiş. " + (has(s, "koltuk") ? "Hem de tasarım koltuğun!" : "Kumaş püskül püskül."),
      choices: [
        c("Büyük bir tırmalama ağacı al", "₺1.700 · çözüm", { cost: 1700, m: 2, stress: -1 }),
        c("Koltuk örtüsü at", "₺600 · geçici", { cost: 600 }),
        c("Kabullen: ev onun", "Moral + · eşyalar −", { m: 2, stress: 1 }),
      ],
    }),
    A("kediAsi", "sokak", {
      when: (s) => !!s.flags.kedi && TR(s),
      title: "Veteriner randevusu",
      text: "Kedinin karma aşısı zamanı geldi. Ama taşıma çantasını görünce yatağın altına kaçtı.",
      choices: [
        c("Sabırla ikna et, götür", "₺1.400 · sağlıklı kedi", { cost: 1400, stress: 2, m: 1 }),
        c("Veterineri eve çağır", "₺2.600 · stressiz", { cost: 2600, stress: -1 }),
        c("Gelecek aya ertele", "Risk", { stress: 1 }),
      ],
    }),
    A("kediLaptop", "salon", {
      when: (s) => !!s.flags.kedi && has(s, "laptop"),
      title: "Klavyede kedi",
      text: (s) => "Kedin klavyenin üstüne yattı; ekranda \"jjjjjjjjjjjjjj\" yazıyor." + (WORK(s) ? " Az önce bir toplantı notu gönderilmiş olabilir." : ""),
      choices: (s) => [
        c("Fotoğrafını çek, paylaş", "Beğeni yağar", { m: 3, people: 0.5 }),
        WORK(s) ? c("Toplantıdakilere açıklama yap", "Herkes güler · performans ±0", { m: 2, rel: { isArk: 2 } }) : c("Kediyi kaldır, devam et", "", { stress: 1 }),
        c("Laptop yanında ona minder koy", "₺400 · barış", { cost: 400, m: 2 }),
      ],
    }),

    // =================== EV, KİRA, SABAH-AKŞAM ===================
    A("evSahibiZiyaret", "salon", {
      when: (s) => s.housing === "kira" && !s.abroad,
      title: "Ev sahibi \"bir bakacak\"",
      text: "Ev sahibi \"evin durumuna bir bakmak\" için bu akşam uğrayacağını yazdı. Lavabo dolu, salon dağınık.",
      choices: [
        c("Gece yarısına kadar topla", "Stres + · iyi izlenim", { stress: 4, h: -0.5 }),
        c("Başka bir güne erteletmeye çalış", "Belki sinirlenir", { stress: 1 }),
        c("Olduğu gibi göster", "Yaşanan bir ev", { m: 1, esteem: 1 }),
      ],
    }),
    A("evArkadasi", "mutfak", {
      when: (s) => s.housing === "kira-paylasim" && !s.abroad,
      title: "Buzdolabında isimli kutular",
      text: "Ev arkadaşın buzdolabındaki her şeyin üstüne isim etiketi yapıştırmış. Seninkiler de dahil, yanlış isimle.",
      choices: [
        c("Oturup ortak alışveriş düzeni kurun", "İletişim +", { sk: { iletisim: 0.4 }, stress: 1, people: 0.5 }),
        c("Esprili bir etiketle cevap ver", "Gülüşürsünüz · ya da gerilir", { m: 2 }),
        c("Kendi küçük buzdolabını al", "₺7.500 · sorun biter", { cost: 7500, stress: -3 }),
      ],
    }),
    A("aileEviOda", "yatak", {
      when: (s) => s.housing === "aile" && s.age >= 20,
      title: "Odana izinsiz giriş",
      text: (s) => (kin(s, "anne") ? kin(s, "anne").name : "Annen") + " sen yokken odanı toplamış. Yıllardır sakladığın bazı kâğıtlar çöpe gitmiş.",
      choices: (s) => [
        c("Sakin ama net bir sınır koy", "Esteem + · biraz gerginlik", { esteem: 3, ...KB(kin(s, "anne"), -1) }),
        c("Teşekkür et, sus", "Huzur ama içinde kalır", { stress: 2, ...KB(kin(s, "anne"), 2) }),
        c("Ev arkadaşı ilanlarına bakmaya başla", "Bir kapı aralanır", { m: 1, stress: 1 }),
      ],
    }),
    A("sabahKahvalti", "mutfak", {
      when: (s) => HS.lateWeek(s) && (s.partner || s.children.length || s.housing === "aile"),
      title: "Serpme kahvaltı",
      text: (s, h) => "Pazar sabahı. " + h.pick(["Fırından taze ekmek kokusu geliyor.", "Menemen soğanlı mı soğansız mı tartışması başlamak üzere.", "Masaya on iki çeşit tabak sığdırılmaya çalışılıyor."]),
      choices: (s) => [
        c("Soğanlı menemen, tartışmaya son", "Bağ +", s.partner ? { bond: 3, m: 3 } : { m: 3, kidBond: s.children.length ? 2 : 0 }),
        c("Fırına koş, simit ve poğaça al", "₺250", { cost: 250, m: 3, h: -0.2 }),
        c("Uyumaya devam", "Kahvaltı sana kalmaz", { sleep: -2, m: -1 }),
      ],
    }),
    A("deprem", "yatak", {
      when: (s) => TR(s),
      title: "Gece sallantısı",
      text: (s) => "Gece 03.12'de avize sallandı; birkaç saniye sürdü. Haberlere göre " + HS.ek(s.city, "gen") + " yakınlarında orta büyüklükte bir deprem. Kimse zarar görmemiş.",
      choices: (s) => [
        c("Herkesi arayıp hal hatır sor", "Bağ +", { people: 1, stress: 2, ...(kin(s, "anne") ? KB(kin(s, "anne"), 3) : {}) }),
        c("Bina güçlendirme raporunu araştır", "Bilgi + · içi rahatsız", { stress: 3, skill: 0.3 }),
        c("Ayakkabını yatağın yanına koy, uyu", "Sağduyu", { stress: -1 }),
      ],
    }),
    A("fatura", "salon", {
      when: OWN,
      title: "Doğalgaz faturası",
      text: (s, h) => "Kış ortasında doğalgaz faturası geldi: " + h.tl(4200) + ". " + nm(s, "komsu") + " \"Biz kombiyi gündüz 18'e alıyoruz\" diyor.",
      choices: [
        c("Komşu taktiği: termostatı düşür", "Tasarruf · biraz üşürsün", { cash: 800, h: -0.5, rel: { komsu: 2 } }),
        c("Pencerelere izolasyon bandı çek", "₺600 · kalıcı tasarruf", { cost: 600, skill: 0.3, stress: -1 }),
        c("Isınmaktan vazgeçme", "Konfor", { m: 1, stress: 1 }),
      ],
    }),

    // =================== KÜÇÜK ETİK İKİLEMLER ===================
    A("restoranHesap", "sokak", {
      when: (s) => TR(s),
      title: "Eksik hesap",
      text: (s) => "Restoranda " + (s.partner ? P(s) : nm(s, "enYakin")) + " ile yemek yediniz. Hesapta bir ana yemek yazılmamış.",
      choices: (s) => [
        c("Garsona söyle", "Dürüstlük · fazladan ödersin", { cost: 900, esteem: 2, m: 1 }),
        c("Söyleme, iyi bir bahşiş bırak", "₺200 · vicdanı yumuşatır", { cost: 200, esteem: -1 }),
        c("Hiçbir şey yapma", "Ucuza gelir · içinde kalır", s.partner ? { trust: -1 } : { rel: { enYakin: -1 } }),
      ],
    }),
    A("yanlisHavale", "salon", {
      when: (s) => true,
      title: "Yanlış havale",
      text: (s, h) => "Hesabına tanımadığın birinden " + h.tl(7500) + " geldi. Açıklamada \"kira\" yazıyor. Birkaç dakika sonra telefon çaldı.",
      choices: [
        c("Bankayı arayıp iade süreci başlat", "Güvenli ve doğru", { stress: 1, esteem: 2 }),
        c("Arayan kişiye doğrudan geri gönder", "Şans: dolandırıcılık olabilir", { chance: { p: 0.7, win: { m: 3, esteem: 2 }, lose: { cost: 7500, stress: 5 }, winT: "Gerçek bir hata", winP: "Kadın ağlayarak teşekkür etti; kirası gecikmeyecek.", loseT: "Tuzak", loseP: "Para çalıntı bir hesaptan gelmiş; banka aynı tutarı geri aldı. İki kez ödedin." } }),
        c("Hiçbir şey yapma", "Para hesapta duruyor · huzursuzluk", { stress: 4 }),
      ],
    }),
    A("arkadasOdev", "salon", {
      when: (s) => s.age <= 30,
      title: "Referans mektubu",
      text: (s) => nm(s, "enYakin") + " bir iş başvurusu için senden referans istedi ve özgeçmişindeki birkaç şeyin \"biraz abartılı\" olduğunu itiraf etti.",
      choices: [
        c("Yalnızca bildiğin şeyleri yaz", "Dürüstlük · arkadaş bozulabilir", { esteem: 2, rel: { enYakin: -2 } }),
        c("İstediği gibi yaz", "Arkadaş mutlu · vicdan", { rel: { enYakin: 5 }, esteem: -2 }),
        c("Özgeçmişini birlikte düzeltin", "İki taraf da kazanır", { rel: { enYakin: 3 }, sk: { yazisma: 0.4 }, stress: 1 }),
      ],
    }),
    A("parkCeza", "sokak", {
      when: (s) => TR(s),
      title: "Yaya geçidindeki araba",
      text: "Bir araç yaya geçidini tamamen kapatmış; tekerlekli sandalyeli biri geçemiyor. Sürücü içeride telefonla konuşuyor.",
      choices: [
        c("Cama vurup uyar", "Gerilim ama hak", { stress: 2, esteem: 2 }),
        c("Sandalyeyi kaldırıma birlikte taşıyın", "Yardım · sırt ağrısı", { m: 3, h: -0.5, people: 0.5 }),
        c("Fotoğrafla ihbar et", "Bürokratik ama etkili", { sk: { mevzuat: 0.2 }, stress: 1 }),
      ],
    }),
    A("sahteYorum", "is", {
      when: (s) => LEGAL(s) && ["cafe", "business"].includes(s.job),
      title: "Beş yıldız ricası",
      text: (s) => (s.job === "business" ? "Ortağın" : "Müdürün") + " herkesin kendi hesabından işletmeye beş yıldızlı yorum yazmasını istedi; \"rakipler de yapıyor\" diyor.",
      choices: [
        c("Yaz", "Patron memnun · içi rahatsız", { perf: 2, esteem: -2 }),
        c("Gerçek müşterilerden yorum isteme kampanyası öner", "Pazarlama +", { sk: { pazarlama: 0.4 }, perf: 1, stress: 1 }),
        c("Reddet", "Prensip · gerginlik", { esteem: 3, perf: -2 }),
      ],
    }),

    // =================== ÇEŞİTLİ ===================
    A("asker", "salon", {
      when: (s) => TR(s) && s.age >= 18 && s.age <= 30 && !!kin(s, "kuzen"),
      title: "Asker uğurlaması",
      text: (s) => "Kuzenin " + kin(s, "kuzen").name + " askere gidiyor. Mahallede davullu zurnalı uğurlama var.",
      choices: (s) => {
        const k = kin(s, "kuzen");
        return [
          c("Uğurlamaya git, harçlık sıkıştır", "₺1.500 · bağ +", { cost: 1500, ...KB(k, 7), people: 1, m: 3 }),
          c("Telefonla \"kolay gelsin\" de", "", { ...KB(k, 1) }),
          c("Mektup yazacağına söz ver", "Eski usul", { ...KB(k, 4), m: 1 }),
        ];
      },
    }),
    A("enYakinTasinma", "sokak", {
      when: (s) => TR(s) && s.age <= 45,
      title: "Taşınma günü",
      text: (s) => nm(s, "enYakin") + " taşınıyor. \"Nakliyeci gelmedi, beşinci kata bir koltuk, iki dolap var. Gelir misin?\"",
      choices: [
        c("Git, sırtla", "Sağlık − · dostluk +", { h: -1, rel: { enYakin: 7 }, m: 2 }),
        c("Nakliye firması ayarla, sen öde", "₺4.000", { cost: 4000, rel: { enYakin: 5 } }),
        c("Belim ağrıyor de", "Arkadaşın anlar mı?", { rel: { enYakin: -4 } }),
      ],
    }),
    A("enYakinAyrilik", "salon", {
      when: (s) => s.age <= 40,
      title: "Gece telefonu",
      text: (s) => nm(s, "enYakin") + " gece yarısı aradı; sesi titriyor. Uzun ilişkisi bitmiş. Yarın senin erken bir işin var.",
      choices: [
        c("Hemen yanına git", "Sabaha kadar dert dinlersin", { rel: { enYakin: 8 }, sleep: 4, stress: 2 }),
        c("Telefonda bir saat konuş", "Destek", { rel: { enYakin: 4 }, sleep: 2 }),
        c("Yarın konuşalım de", "Dostluk sınanır", { rel: { enYakin: -5 }, sleep: -1 }),
      ],
    }),
    A("liseBulusma", "salon", {
      when: (s) => s.age >= 27 && s.age <= 45,
      title: "On yıl sonra",
      text: (s) => nm(s, "liseArk") + " lise mezunlarını toplamak için bir grup kurdu: \"Cumartesi buluşuyoruz, herkes geliyor!\"",
      choices: (s) => [
        c("Git", "₺1.500 · nostalji ve kıyas", { cost: 1500, m: 3, people: 2, rel: { liseArk: 5 }, esteem: s.jobLevel >= 2 || s.partner ? 2 : -2 }),
        c("Sadece fotoğraflara bak", "Bedava", { m: -1 }),
        c("Grubu sessize al", "", { rel: { liseArk: -3 }, stress: -1 }),
      ],
    }),
    A("kanBagisi", "sokak", {
      when: (s) => TR(s) && s.age < 65,
      title: "Acil kan çağrısı",
      text: (s) => nm(s, "enYakin") + " bir paylaşım iletti: şehirdeki bir hastanede ameliyata girecek bir çocuk için acil kan aranıyor. Kan grubun uyuyor.",
      choices: [
        c("Hemen git, bağışla", "Sağlık − (kısa süre) · içi rahat", { h: -1, m: 5, esteem: 3, people: 1 }),
        c("Paylaşımı yay", "Belki biri bulunur", { people: 0.5, m: 1 }),
        c("Bu hafta yorgunum", "", { stress: 1 }),
      ],
    }),
    A("piyango", "sokak", {
      when: (s) => TR(s) && s.age >= 25,
      title: "Bilet satan amca",
      text: "Her gün aynı köşede duran bilet satıcısı amca bugün çok üzgün; satış yapamamış. \"Çeyrek al evladım, bereket getirsin.\"",
      choices: [
        c("Al", "₺400 · Şans %5", { cost: 400, chance: { p: 0.05, win: { cash: 20000, m: 6 }, lose: { m: 1 }, winT: "Amortiden fazlası!", winP: "Çeyrek bilet ikramiye çıktı; amcaya baklava götürdün.", loseT: "Çıkmadı", loseP: "Ama amcanın yüzü güldü." } }),
        c("Bilet alma ama çay ısmarla", "₺40", { cost: 40, m: 2, people: 0.5 }),
        c("Geç", "", {}),
      ],
    }),
    A("telefonEkran", "sokak", {
      when: (s) => has(s, "telefon") || has(s, "amiral"),
      title: "Örümcek ağı",
      text: (s) => "Telefonun cebinden kaydı; ekranın bir köşesi örümcek ağı gibi çatladı." + (has(s, "amiral") ? " Hem de amiral gemisi." : ""),
      choices: (s) => [
        c("Yetkili serviste değiştir", has(s, "amiral") ? "₺11.000" : "₺4.500", { cost: has(s, "amiral") ? 11000 : 4500, stress: -2 }),
        c("Çarşıdaki tamirciye ver", "₺1.800 · Şans %70", { cost: 1800, chance: { p: 0.7, win: { m: 1 }, lose: { stress: 3, m: -2 }, winT: "Yeni gibi", winP: "Dokunmatik de sorunsuz.", loseT: "Dokunmatik gitti", loseP: "Ekranın alt kısmı basmıyor artık." } }),
        c("Ekran koruyucu yapıştır, kullan", "₺150", { cost: 150, m: -1 }),
      ],
    }),
    A("saatAdim", "yatak", {
      when: (s) => has(s, "saat"),
      title: "Saatin uyarısı",
      text: "Akıllı saatin uyardı: \"Bu hafta günlük ortalaman 2.100 adım. Hedefin 10.000.\" Bir de uyku puanı 54.",
      choices: [
        c("Akşam yürüyüşlerine başla", "Sağlık +", { h: 2, kg: -0.2, sk: { disiplin: 0.3 } }),
        c("Hedefi 5.000'e indir", "Gerçekçi", { m: 1, h: 0.5 }),
        c("Bildirimleri kapat", "", { stress: -1 }),
      ],
    }),
    A("gitarTel", "salon", {
      when: (s) => has(s, "gitar"),
      title: "Kopan tel",
      text: (s) => "Gitarının Sol teli çalarken koptu. " + (s.children.length ? kidOf(s, 0, 99).name + " \"Ben de çalmak istiyorum\" diye bekliyordu." : "Akşam " + nm(s, "enYakin") + " için çalacaktın."),
      choices: (s) => [
        c("Komple yeni tel takımı al", "₺650", { cost: 650, m: 2, sk: { enstruman: 0.2 } }),
        c("Beş telle çal, doğaçla", "Yaratıcılık", { skill: 0.3, m: 1 }),
        c("Gitarı bir süre köşeye koy", "", { m: -1 }),
      ],
    }),
    A("yatakYeni", "yatak", {
      when: (s) => has(s, "yatak") && s.age >= 35,
      title: "Sabah esnemesi",
      text: "Ortopedik yatak iyi geldi, ama bel ağrın hâlâ bazı sabahlar uyandırıyor. Bir arkadaşın pilates öneriyor.",
      choices: [
        c("Pilates dersine yazıl", "₺3.000 · sağlık +", { cost: 3000, h: 2, people: 0.5 }),
        c("Evde esneme videoları", "Bedava · disiplin ister", { h: 1, sk: { disiplin: 0.2 } }),
        c("Ağrı kesiciyle idare", "₺90", { cost: 90, h: -0.5 }),
      ],
    }),
    A("bulasikDolum", "mutfak", {
      when: (s) => has(s, "bulasik") && (s.partner || s.housing === "kira-paylasim"),
      title: "Makine nasıl dizilir?",
      text: (s) => (s.partner ? P(s) : "Ev arkadaşın") + " bulaşık makinesine tabakları senin dizdiğinden bambaşka şekilde dizmiş; sen gizlice yeniden diziyorsun. Yakalandın.",
      choices: (s) => [
        c("Gülüp itiraf et", "Bağ +", s.partner ? { bond: 3, m: 2 } : { people: 0.5, m: 2 }),
        c("Kendi yöntemini savun", "Küçük tartışma", s.partner ? { bond: -2, esteem: 1 } : { stress: 1, esteem: 1 }),
        c("Bundan sonra makine onun işi", "Bir iş eksildi", { stress: -2 }),
      ],
    }),
    A("camasirRenk", "mutfak", {
      when: (s) => has(s, "camasir"),
      title: "Pembe gömlekler",
      text: "Makineden çıkan beyaz çamaşırların hepsi pembe olmuş. Suçlu: kırmızı bir çorap.",
      choices: [
        c("Çamaşır suyuyla kurtarmayı dene", "Şans %50", { chance: { p: 0.5, win: { m: 2 }, lose: { cost: 1500, m: -2 }, winT: "Bembeyaz", winP: "Neredeyse eskisi gibi.", loseT: "Pembe kaldı", loseP: "Yeni gömlek almak zorunda kaldın." } }),
        c("Pembe yeni beyazdır", "Özgüven +", { esteem: 2, m: 1 }),
        c("Kırmızı çorabı çöpe at", "İntikam", { m: 1 }),
      ],
    }),
    A("tavsiye", "is", {
      when: (s) => LEGAL(s) && s.jobLevel >= 2,
      title: "Yeni gelene akıl ver",
      text: (s) => "Yöneticin " + nm(s, "yonetici") + " işe yeni başlayan stajyeri sana emanet etti. Çocuk çok hevesli ama her şeyi soruyor.",
      choices: [
        c("Zaman ayır, öğret", "Liderlik + · iş yavaşlar", { sk: { liderlik: 0.6 }, perf: -1, rel: { yonetici: 3 }, m: 2 }),
        c("Yazılı bir rehber hazırla", "Kalıcı çözüm", { sk: { yazisma: 0.5 }, stress: 2, perf: 1 }),
        c("Kendi işine dön, idare etsin", "Performans + · yönetici bozulur", { perf: 1, rel: { yonetici: -3 } }),
      ],
    }),
    A("yoneticiDogumGunu", "is", {
      when: LEGAL,
      title: "Yöneticiye hediye",
      text: (s) => "Ofiste yöneticin " + nm(s, "yonetici") + " için doğum günü parası toplanıyor. Toplayan " + nm(s, "isArk") + "; liste masada.",
      choices: [
        c("Katıl", "₺400", { cost: 400, rel: { yonetici: 2, isArk: 1 } }),
        c("Fazlasını ver, kartı sen yaz", "₺800 · görünürlük", { cost: 800, rel: { yonetici: 4 }, perf: 1 }),
        c("Katılma", "Fark edilir", { rel: { isArk: -2 } }),
      ],
    }),
    A("ustaKombi", "salon", {
      when: (s) => OWN(s) && winter(s),
      title: "Kombi bakımı",
      text: (s) => "Usta " + nm(s, "usta") + " kapıda: \"Bu kış kombine bakım yapmadık, sonra bin pişman olursun.\" Elinde çanta, ayakkabısını çıkarıyor bile.",
      choices: (s) => [
        c("Yaptır", "₺2.200 · kış güvencesi", { cost: 2200, rel: { usta: 4 }, stress: -2 }),
        c("Pazarlık yap", "₺1.600 · usta biraz bozulur", { cost: 1600, rel: { usta: -1 }, sk: { muzakere: 0.3 } }),
        RENT(s) ? c("Ev sahibinin işi de", "Bekleme", { rel: { usta: -2 }, stress: 1 }) : c("Gelecek ay", "Risk", { rel: { usta: -2 }, stress: 1 }),
      ],
    }),
    A("yonetimBahce", "sokak", {
      when: OWN,
      title: "Ortak bahçe",
      text: (s) => "Yönetici " + hn(s, "yonetim") + " apartmanın arka bahçesini düzenlemek için gönüllü arıyor. Cumartesi sabahı, kazma kürek.",
      choices: [
        c("Katıl", "Sağlık + · komşular +", { h: 1, rel: { yonetim: 5, komsu: 3 }, people: 1.5 }),
        c("Fidan bağışla", "₺700", { cost: 700, rel: { yonetim: 3 } }),
        c("Cumartesi uyku günüm", "", { sleep: -2, rel: { yonetim: -2 } }),
      ],
    }),
    A("bakkalCocuk", "sokak", {
      when: (s) => TR(s) && !!kidOf(s, 6, 12),
      title: "İlk alışveriş",
      text: (s) => kidOf(s, 6, 12).name + " ilk kez tek başına bakkala gitmek istiyor. Bakkal " + nm(s, "bakkal") + " karşı kaldırımda.",
      choices: [
        c("Gönder, pencereden izle", "Özgüven aşısı", { kidBond: 5, stress: 2, rel: { bakkal: 2 } }),
        c("Bakkalı arayıp haber ver, öyle gönder", "Güvenli", { kidBond: 3, rel: { bakkal: 4 } }),
        c("Daha erken de", "", { kidBond: -2 }),
      ],
    }),
    A("doktorKontrol", "sokak", {
      when: (s) => TR(s) && !!kidOf(s, 0, 3),
      title: "Bebek kontrolü",
      text: (s) => "Dr. " + nm(s, "doktor") + " bebek kontrolünde boy ve kiloyu ölçtü; aşı takvimini hatırlattı. Bebek aşıda öyle bir ağladı ki bekleme salonu sustu.",
      choices: [
        c("Sakin kal, kucakla", "Bağ +", { kidBond: 5, stress: 2, rel: { doktor: 2 } }),
        c("Doktora uzun uzun soru sor", "Bilgi +", { sk: { ilkyardim: 0.4 }, rel: { doktor: 3 } }),
        c("Sonra dondurma ısmarla (kendine)", "₺120", { cost: 120, m: 2 }),
      ],
    }),
  );

})(globalThis.HS || (globalThis.HS = {}));
