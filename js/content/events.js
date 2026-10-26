// Hikâye olayları. Her olay düz bir veri nesnesidir:
//   id        benzersiz kimlik (tekrar süresi bununla izlenir)
//   title     başlık (metin ya da (s, h) => metin)
//   text      gövde (metin ya da (s, h) => metin)
//   when      (s, h) => true ise olay havuza girer
//   minAge/maxAge/jobs  hızlı filtreler
//   weight    havuzdaki ağırlık (sayı ya da (s) => sayı), varsayılan 1
//   cooldown  aynı olayın tekrar gelebilmesi için geçmesi gereken hafta (varsayılan 52)
//   once      hayatta yalnızca bir kez
//   priority  sayı verilirse rastgele havuzdan önce, en yüksek öncelikli uygun olay gelir
//   choices   seçenek listesi ya da (s, h) => liste
// Seçenek: { label, hint, fx, theme, need }. fx anahtarları engine.js içindeki apply() ile işlenir.
// cash/cost tutarları 2026 TL'sidir ve oyun yılına göre enflasyonla ölçeklenir.
// h yardımcıları: h.ek(kelime, "loc"|"abl"|"dat"|"acc"|"gen"|"with"), h.tl(2026 TL), h.money(n), h.pick(dizi)
(function (HS) {
  "use strict";

  const c = (label, hint, fx = {}, extra = {}) => ({
    label,
    hint,
    fx,
    ...extra,
  });
  const kidAge = (s, k) => s.year - k.born;
  // Belirli yaşa gelmiş ve o dönemeci henüz yaşamamış ilk çocuk
  const kidAt = (s, from, to, key) =>
    s.children.find(
      (k) =>
        kidAge(s, k) >= from &&
        kidAge(s, k) <= to &&
        !s.flags[key + ":" + k.name],
    );
  const pendingPartner = (s, h) =>
    s.flags.pp || (s.flags.pp = h.pick(HS.NAMES.partner));
  const babyNames = (s, h) => {
    const used = new Set(s.children.map((k) => k.name));
    const pool = HS.NAMES.child.filter((n) => !used.has(n));
    const out = [];
    while (out.length < 3 && pool.length)
      out.push(pool.splice((Math.random() * pool.length) | 0, 1)[0]);
    return out;
  };
  const working = (s) => s.job !== "none";
  const jobName = (s) => HS.JOBS[s.job].name.toLocaleLowerCase("tr-TR");

  // ---------------- Giriş ve yedek ----------------
  HS.INTRO_EVENT = {
    id: "intro",
    title: "İlk hafta",
    text: (s, h) =>
      s.first +
      ", " +
      h.ek(s.city, "loc") +
      " ailenin yanında 18 yaşına bastın. Liseyi bitirdin, cebinde " +
      h.money(s.cash) +
      " var. İlk adımı nereden atacaksın?",
    choices: [
      c("Hemen iş aramaya başla", "Önce düzenli bir gelir.", {
        skill: 1,
        m: 1,
        theme: "career",
      }),
      c(
        "Üniversite sınavına hazırlan",
        "Birkaç ay ders çalış; kapılar açılabilir.",
        { skill: 2, examStart: 1 },
      ),
      c("Bir hafta kendine ayır", "Şehri dolaş, nefes al.", {
        cost: 400,
        m: 6,
        h: 1,
      }),
    ],
  };
  const AGE_TEXT = {
    20: [
      "Yirmiler başlıyor",
      "Çevrendekiler ne yapacağını sorup duruyor. Herkesin yolunun başka olduğunu yavaş yavaş anlıyorsun.",
    ],
    25: [
      "Çeyrek asır",
      "Geride kalan yıllar sana neyi sevdiğini, neyi artık istemediğini öğretti.",
    ],
    30: [
      "Otuz",
      "Bazı hayaller biçim değiştirdi; bazılarıysa ilk kez gerçekten mümkün görünüyor.",
    ],
    40: [
      "Kırklı yaşlar",
      "Zamanın kıymetini eskisinden iyi biliyorsun. Kurduğun düzen daha çok anlam taşıyor.",
    ],
    50: [
      "Yarım asır",
      "Hayatının ilk elli yılına dönüp bakıyorsun. Biriktirdiklerin yalnızca para ve eşya değil.",
    ],
    60: [
      "Altmış",
      "Bedenin bazı şeyler için daha fazla dinlenmeye ihtiyaç duyuyor; aklın ise hiç olmadığı kadar berrak.",
    ],
    70: [
      "Yetmiş yılın izleri",
      "Yüzünde yılların çizgileri, hafızanda sayısız hikâye var.",
    ],
    80: [
      "Sekseninci bahar",
      "Günler daha sakin akıyor. Sevdiklerin yanındayken sıradan bir çay bile bayram gibi.",
    ],
    90: [
      "Doksan",
      "Şehir artık gençliğindeki gibi değil ama sabah ışığı hâlâ aynı.",
    ],
  };

  HS.EVENTS = [
    // ================= ÖNCELİKLİ: TAKVİM =================
    {
      id: "election",
      priority: 100,
      cooldown: 150,
      when: (s) => s.week === 1 && s.year >= 2028 && s.year % 4 === 0,
      title: (s) => s.year + " seçimleri",
      text: (s) => {
        const [a, b] = electionPair(s);
        return (
          "Kurmaca seçim döneminde iki aday öne çıkıyor. " +
          a.leader +
          " (" +
          a.name +
          ") " +
          a.promise +
          " vaat ediyor; " +
          b.leader +
          " (" +
          b.name +
          ") ise " +
          b.promise +
          "."
        );
      },
      choices: (s) => {
        const [a, b] = electionPair(s);
        return [
          c(
            a.leader + "’a oy ver",
            a.promise[0].toLocaleUpperCase("tr-TR") + a.promise.slice(1) + ".",
            { policy: a.policy, m: 1, people: 1 },
          ),
          c(
            b.leader + "’a oy ver",
            b.promise[0].toLocaleUpperCase("tr-TR") + b.promise.slice(1) + ".",
            { policy: b.policy, m: 1, people: 1 },
          ),
          c("Sandığa gitme", "Bu kez kenarda kal.", { m: -1 }),
        ];
      },
    },
    {
      id: "newyear",
      priority: 90,
      cooldown: 20,
      when: (s) => s.week === 1 && s.weeks > 0,
      title: (s) => s.year + " başlıyor",
      text: (s) => {
        const sc = HS.SCENARIOS[s.scenario];
        const pct = (k) => "%" + Math.round(HS.rate(s, k, s.year - 1) * 100);
        return (
          "Geçen yıl fiyatlar genel olarak " +
          pct("cpi") +
          ", gıda " +
          pct("food") +
          ", ulaşım " +
          pct("transport") +
          ", konut " +
          pct("housing") +
          " arttı. Kurmaca ekonomi senaryosu: " +
          sc.name +
          ". " +
          sc.text
        );
      },
      choices: [
        c("Yeni yıl bütçesi yap", "Harcamalarını gözden geçir.", {
          skill: 1,
          theme: "security",
        }),
        c("Yılbaşını sevdiklerinle kutla", "Bir akşam her şeyi unut.", {
          cost: 900,
          m: 5,
          people: 1,
          bond: 3,
          kidBond: 2,
        }),
      ],
    },
    {
      id: "birthday",
      priority: 80,
      cooldown: 200,
      when: (s) => s.week <= 3 && AGE_TEXT[s.age] && !s.flags["age" + s.age],
      title: (s) => AGE_TEXT[s.age][0],
      text: (s) => AGE_TEXT[s.age][1],
      choices: (s) => [
        c("Geçmişe teşekkür et", "Yoluna devam et.", {
          m: 3,
          flag: "age" + s.age,
        }),
        c("Kendine bir söz ver", "Önümüzdeki yıllar için yeni bir hedef.", {
          skill: 1,
          m: 2,
          flag: "age" + s.age,
          theme: "career",
        }),
        s.people > 10
          ? c("Arkadaşlarınla kutla", "Kalabalık bir sofra.", {
              cost: 1500,
              m: 6,
              people: 2,
              flag: "age" + s.age,
            })
          : null,
      ],
    },

    // ================= EĞİTİM =================
    {
      id: "uniExam",
      priority: 70,
      once: true,
      when: (s) =>
        s.edu === "lise" &&
        s.age <= 24 &&
        (s.flags.examPrep ? s.weeks >= 20 : s.weeks >= 30),
      title: "Sınav sonuçları açıklanıyor",
      text: (s, h) =>
        (s.flags.examPrep ? "Aylarca çalıştın. " : "Hazırlıksız girdin. ") +
        "Sonuç sayfası yükleniyor; yerleşirsen " +
        h.ek(s.city, "gen") +
        " devlet üniversitesinde gündüz öğretim ücretsiz, yurt ve kitap masrafı senden.",
      choices: (s) => [
        c(
          "Sonuca bak ve yerleştiysen kayıt ol",
          "İşin varsa yarı zamanlıya döner.",
          {
            chance: {
              p: Math.min(
                0.9,
                (s.flags.examPrep ? 0.6 : 0.25) + s.skill * 0.02,
              ),
              win: { edu: "ogrenci", cost: 2500, m: 8 },
              lose: { m: -6 },
              winT: "Yerleştin!",
              winP: "Ekranda bölümünün adı yazıyor. Annen telefonda ağlıyor.",
              loseT: "Puan yetmedi",
              loseP: "Bu yıl olmadı. İleride ikinci şans gelebilir.",
            },
          },
        ),
        c("Önce çalışıp para biriktir", "Okulu şimdilik ertele.", {
          m: -1,
          theme: "security",
        }),
      ],
    },
    {
      id: "uniLate",
      cooldown: 200,
      minAge: 22,
      maxAge: 40,
      when: (s) => s.edu === "lise" || s.edu === "yarim",
      weight: 0.4,
      title: "İkinci şans",
      text: "Açık ve gece programları yetişkinlere yeniden kapı açıyor. Yorucu olur ama diploma başka işlerin kapısını aralar.",
      choices: [
        c("Yeniden başvur", "Dört yıl derslerle dolu.", {
          edu: "ogrenci",
          cost: 3000,
        }),
        c("Bu bana göre değil", "Becerini işte geliştir.", { skill: 1 }),
      ],
    },
    {
      id: "studentExams",
      cooldown: 26,
      weight: 3,
      when: (s) => s.edu === "ogrenci",
      title: "Final haftası",
      text: "Kütüphane gece yarısına kadar dolu. Sınavlar yaklaşırken uykuyla not arasında seçim yapman gerekiyor.",
      choices: [
        c("Sabaha kadar çalış", "Not yükselir, beden yorulur.", {
          skill: 2,
          h: -2,
        }),
        c("Çalışma grubu kur", "Birlikte öğrenmek daha kolay.", {
          skill: 1,
          people: 2,
        }),
        c("Sınavı salla", "Bu dönem eğlenceye ayrıldı.", { m: 3, skill: -1 }),
      ],
    },
    {
      id: "dropout",
      cooldown: 80,
      weight: 0.8,
      when: (s) => s.edu === "ogrenci" && s.eduWeeks > 30,
      title: "Okulu bırakma düşüncesi",
      text: "Dersler uzadıkça uzuyor, cebindeki para azalıyor. Bir arkadaşın okulu bırakıp tam zamanlı çalışmaya başladı.",
      choices: [
        c("Okulu bırak", "Hemen tam zamanlı iş.", { edu: "yarim", m: 2 }),
        c("Dişini sık", "Diploma yaklaşıyor.", { m: -2, skill: 1 }),
        c("Burs başvurusu yap", "Belki destek çıkar.", {
          cash: 4000,
          skill: 1,
          m: 1,
        }),
      ],
    },
    {
      id: "internship",
      once: true,
      when: (s) => s.edu === "ogrenci" && s.eduWeeks > 104,
      title: "Staj teklifi",
      text: "Bölüm hocan yaz için bir kurmaca firmada staj ayarlayabileceğini söyledi. Ücret sembolik ama deneyim gerçek.",
      choices: [
        c("Stajı kabul et", "Yazın çalış, ağ kur.", {
          skill: 4,
          people: 2,
          cash: 3000,
        }),
        c("Yazı memlekette geçir", "Aileyle dinlen.", { h: 3, m: 4 }),
      ],
    },
    {
      id: "studentLife",
      cooldown: 40,
      weight: 2,
      when: (s) => s.edu === "ogrenci",
      title: "Kampüste bahar şenliği",
      text: "Çimlerde konserler, standlar, gece yarısı sohbetleri. Ders notların ise yerinde duruyor.",
      choices: [
        c("Şenliğe katıl", "Yeni insanlar, yeni hikâyeler.", {
          cost: 600,
          people: 3,
          m: 6,
        }),
        c("Kulübe gönüllü ol", "Etkinliği sen düzenle.", {
          people: 2,
          skill: 1,
          theme: "community",
        }),
        c("Odada kal", "Ödevler bitmiyor.", { skill: 1 }),
      ],
    },

    // ================= İŞ ARAMA VE GENEL KARİYER =================
    {
      id: "jobHunt",
      cooldown: 3,
      weight: (s) => (s.weeks < 12 ? 6 : 3),
      when: (s) =>
        !working(s) &&
        !s.retired &&
        s.age < HS.RETIRE_AGE &&
        (s.apps || []).length < 3,
      title: "İş ilanları",
      // Başvurular sonucu birkaç hafta sonra gelir; bazı işlerde araya mülakat girer.
      text: (s, h) =>
        s.edu === "ogrenci"
          ? "Derslerin arasında yapabileceğin yarı zamanlı ilanlar var."
          : "Bu hafta birkaç ilan dikkatini çekti. Hangi gündelik hayatı denemek istersin?",
      choices: (s, h) => {
        const list =
          s.edu === "ogrenci"
            ? ["cafe", "music"]
            : ["cafe", "factory", "music", "office", "teacher", "nurse"];
        // Önce girilebilen işler, sonra en iyi ücretliler; en fazla 4 ilan.
        const open = (j) => !HS.JOBS[j].need || HS.JOBS[j].need(s) === true;
        return list
          .sort((a, b) => open(b) - open(a) || HS.JOBS[b].pay - HS.JOBS[a].pay)
          .slice(0, 4)
          .map((j, i) => {
            // Şirket ilanı: bu şehirde bu işi veren şirketlerden biri
            const cos = (HS.COMPANIES || []).filter((x) => x.jobs.includes(j) && HS.coIn(x, s.city));
            const x = cos.length ? cos[(s.weeks + i * 7 + s.seed) % cos.length] : null;
            if (!x)
              return c(
                HS.JOBS[j].name + " başvurusu",
                (HS.JOBS[j].volatile ? "Gelir değişken, ort. " : "Aylık net ") +
                  h.money(HS.wage(s, j, 0)) +
                  " · kabul şansı %" +
                  Math.round(HS.appChance(s, j) * 100),
                { apply: j },
              );
            return c(
              x.name + " · " + HS.JOBS[j].name,
              x.stars.toFixed(1) + "★ · aylık " + h.money(HS.wage(s, j, 0, x.id)) + " · " + x.stages + " aşamalı mülakat · şans %" + Math.round(HS.coChance(s, x, j) * 100),
              { coApply: { co: x.id, job: j } },
            );
          })
          .concat([
            c("Bu hafta bekle", "Daha iyi bir ilan çıkabilir.", { m: -1 }),
          ]);
      },
    },
    {
      id: "promotion",
      weight: 4,
      cooldown: 52,
      when: (s) =>
        working(s) &&
        s.jobLevel < 4 &&
        HS.Skills.missing(s)?.ok &&
        s.job !== "crime" &&
        s.job !== "business",
      title: "Terfi konuşması",
      text: (s) =>
        "Yöneticin seni odasına çağırdı. " +
        HS.Skills.title(s, s.job, s.jobLevel + 1) +
        " pozisyonu açılıyor ve şartları taşıyorsun. Maaşın %" +
        Math.round((HS.levelMult(s.job, s.jobLevel + 1) / HS.levelMult(s.job, s.jobLevel) - 1) * 100) +
        " artabilir; sorumluluk da artacak.",
      choices: [
        c("Terfi mülakatına gir", "Başarırsan yeni unvan ve zam.", (s) => ({
          h: -1,
          chance: {
            p: Math.min(
              0.85,
              0.45 + s.skill * 0.006 + (HS.outfitFits(s, s.job) ? 0.1 : 0),
            ),
            win: { promote: 1, m: 6 },
            lose: { m: -4, skill: 1 },
            winT: "Terfi aldın!",
            winP: "Kapına yeni bir unvan yazıldı. Maaşın artıyor.",
            loseT: "Pozisyon başkasına gitti",
            loseP:
              'Yöneticin "bir dahaki sefere" dedi. Deneyim yine de işe yarar.',
          },
        })),
        c("Şimdiki rolümde kalayım", "İş-özel hayat dengesini koru.", {
          h: 2,
          m: 1,
          theme: "care",
        }),
      ],
    },
    {
      id: "layoff",
      weight: 0.5,
      cooldown: 260,
      when: (s) =>
        ["office", "factory", "cafe"].includes(s.job) && s.jobWeeks > 30,
      title: "Küçülme kararı",
      text: "Kurmaca şirketin yönetimi giderleri kısma kararı aldı. Listede senin adın da var; kıdem tazminatıyla ayrılabilir ya da daha düşük saatle kalabilirsin.",
      choices: [
        c("Tazminatı al ve ayrıl", "Bir süre işsiz kalacaksın.", {
          job: "none",
          cash: 30000,
          m: -4,
        }),
        c("Yarı saatle kal", "Gelir düşer ama iş sürer.", {
          m: -3,
          skill: 1,
          cash: -2000,
        }),
      ],
    },
    {
      id: "otherCityJob",
      weight: 0.6,
      cooldown: 200,
      minAge: 22,
      maxAge: 55,
      when: (s) => !s.abroad && s.edu !== "ogrenci" && !s.retired,
      title: "Başka şehirde iş",
      text: (s, h) => {
        const to = otherCity(s);
        return (
          h.ek(to, "loc") +
          " daha iyi ücretli bir iş teklifi var. Taşınmak masraflı; tanıdık sokakları geride bırakacaksın."
        );
      },
      choices: (s, h) => {
        const to = otherCity(s);
        return [
          c(
            h.ek(to, "dat") + " taşın",
            "Yeni şehir, yeni çevre. Nakliye, depozito ve ilk kira yaklaşık " + h.money(HS.moveCost ? HS.moveCost(s, to).total : 0) + ".",
            {
              moveCity: to,
              skill: 2,
              people: -3,
              m: 3,
              job: s.edu === "universite" ? "office" : "factory",
              theme: "journey",
            },
          ),
          c("Kalmayı seç", "Kökler de bir zenginlik.", { m: 1, people: 1 }),
        ];
      },
    },
    {
      id: "sideHustle",
      weight: 0.7,
      cooldown: 104,
      minAge: 20,
      maxAge: 60,
      when: working,
      title: "Yan iş fikri",
      text: "Bir iş arkadaşın hafta sonları birlikte küçük bir yan iş kurmayı önerdi. İlk yatırım ve zaman gerekiyor.",
      choices: [
        c("Ortak ol", "Para ve emek ayır; becerin artar.", {
          cost: 3000,
          skill: 3,
          people: 1,
        }),
        c("Önce hesap yapalım", "Riskleri yazıya dök.", { skill: 1 }),
      ],
    },
    {
      id: "openShop",
      weight: 0.5,
      cooldown: 156,
      minAge: 25,
      maxAge: 58,
      when: (s) => s.job !== "business" && s.skill >= 8 && !s.retired,
      title: "Kendi dükkânın",
      text: (s, h) =>
        "Mahallede devren kiralık bir dükkân var. Açılış sermayesi " +
        h.tl(250000) +
        ". Kendi işinin patronu olmak cazip ama her ay garanti maaş yok.",
      choices: [
        c("Dükkânı aç", "Esnaf ol; ilk aylar belirsiz.", (s) => ({
          job: "business",
          m: 4,
          theme: "career",
          chance: {
            p: Math.min(
              0.8,
              0.4 + s.skill * 0.01 + Math.min(0.15, s.people / 150),
            ),
            win: { cash: 40000, m: 6 },
            lose: { cash: -60000, m: -6 },
            winT: "Açılış haftası tıklım tıklım",
            winP: "Mahalle dükkânını sevdi; kasada beklenenden fazla para var.",
            loseT: "Açılış sönük geçti",
            loseP: "Tabelayı kimse fark etmedi. İlk ay zararla kapandı.",
          },
        })),
        c("Maaşlı düzende kal", "Güvenceyi bırakma.", {
          m: 1,
          theme: "security",
        }),
      ],
    },

    // ================= İŞ YERİNE ÖZGÜ =================
    {
      id: "cafeRush",
      jobs: ["cafe"],
      weight: 3,
      cooldown: 20,
      title: "Kafenin yoğun günü",
      text: "Beklenmedik bir grup geldi; ekipten biri hastalanmış. Servisi tek başına toparlayabilir ya da destek isteyebilirsin.",
      choices: [
        c("Servisi üstlen", "Zor gün, işin fark edildi.", {
          cash: 1400,
          h: -2,
          skill: 2,
        }),
        c("Destek iste", "Ekip olmak da işin parçası.", { m: 2, people: 1 }),
      ],
    },
    {
      id: "cafeRegular",
      jobs: ["cafe"],
      weight: 2,
      cooldown: 40,
      title: "Her sabahın müşterisi",
      text: "Her sabah aynı saatte gelen yaşlı bir adam bugün kahvesini içerken sana gençliğini anlattı. Arkada sipariş birikiyor.",
      choices: [
        c("Biraz daha dinle", "Bazı hikâyeler beklemez.", { m: 4, people: 1 }),
        c("Kibarca işine dön", "Siparişler bekliyor.", { skill: 1 }),
      ],
    },
    {
      id: "cafeOrder",
      jobs: ["cafe"],
      weight: 2,
      cooldown: 52,
      title: "Tezgâhın arkasında",
      text: "Müşteri siparişi yanlış aldığını söylüyor. Sorumlu olayı duymamış.",
      choices: [
        c("Özür dile, düzelt", "Güven kazandın; bahşiş arttı.", {
          m: 2,
          cash: 650,
          people: 1,
        }),
        c("Kameraya bakalım", "Hakkını savun ama ortam gerilsin.", {
          m: -2,
          skill: 1,
        }),
      ],
    },
    {
      id: "factoryOvertime",
      jobs: ["factory"],
      weight: 3,
      cooldown: 16,
      title: "Fazla mesai",
      text: "Hat sorumlusu hafta sonu vardiyası için gönüllü arıyor. Para işine yarar ama yeterince dinlenmedin.",
      choices: [
        c("Mesaiye kal", "Ek gelir ve yorgunluk.", { cash: 2600, h: -4 }),
        c("Dinlenme gününü koru", "Bedenine kulak ver.", { h: 3, m: 2 }),
      ],
    },
    {
      id: "factorySafety",
      jobs: ["factory"],
      weight: 2,
      cooldown: 60,
      title: "Hattaki arıza",
      text: "Bir makinenin koruması gevşemiş. Bildirirsen üretim duracak ve usta başı söylenecek.",
      choices: [
        c("Hemen bildir", "Güvenlik önce gelir.", {
          m: 1,
          people: 2,
          skill: 1,
          theme: "care",
        }),
        c("Vardiya bitince söylerim", "Hat dursun istemiyorsun.", {
          h: -6,
          m: -2,
        }),
      ],
    },
    {
      id: "factoryUnion",
      jobs: ["factory"],
      weight: 1.5,
      cooldown: 104,
      title: "İşçi temsilcisi seçimi",
      text: "Arkadaşların seni temsilci olarak aday göstermek istiyor. Daha çok toplantı, daha çok sorumluluk.",
      choices: [
        c("Aday ol", "Herkesin sesini taşı.", {
          people: 4,
          skill: 2,
          m: 2,
          theme: "community",
        }),
        c("Başkası olsun", "Kendi işine odaklan.", { h: 1 }),
      ],
    },
    {
      id: "musicGig",
      jobs: ["music"],
      weight: 3,
      cooldown: 12,
      title: "Sahne ışıkları",
      text: "Bir mekânın sahibi seni dinledi. Daha çok gece çalıp tanınmayı deneyebilirsin.",
      choices: [
        c("Yeni mekânda çal", "Daha çok kazanç, daha geç saatler.", {
          cash: 2800,
          m: 6, fame: 2,
          skill: 2,
          h: -1,
          theme: "craft",
        }),
        c("Düzenli sahnene dön", "Kendi kitleni kur.", {
          cash: 900,
          m: 3,
          skill: 1,
          theme: "craft",
        }),
      ],
    },
    {
      id: "musicDemo",
      jobs: ["music"],
      weight: 2,
      cooldown: 80,
      title: "Kayıt odasında fırsat",
      text: "Mahalledeki küçük kayıt odası bir şarkını kaydetmeyi önerdi.",
      choices: [
        c("Demo kaydet", "Kalıcı bir iz bırak; belki tutar.", (s) => ({
          cost: 1700,
          skill: 3,
          theme: "craft",
          chance: {
            p: Math.min(0.5, 0.1 + s.skill * 0.006),
            win: { cash: 15000, people: 4, m: 8, fame: 6 },
            lose: { m: 2 },
            winT: "Şarkın dinleniyor!",
            winP: "Demo birkaç günde binlerce kez dinlendi. Mekânlar seni arıyor.",
            loseT: "Sessiz bir yayın",
            loseP:
              "Birkaç arkadaşın dışında dinleyen olmadı. Yine de kaydın elinde.",
          },
        })),
        c("Canlı çalmaya devam et", "Şimdilik masraf yapma.", {
          cash: 450,
          m: 1,
        }),
      ],
    },
    {
      id: "musicViral",
      jobs: ["music"],
      weight: 0.6,
      cooldown: 300,
      when: (s) => s.skill >= 10,
      title: "Şarkın yayıldı",
      text: "Bir sahne kaydın kurmaca bir müzik platformunda beklenmedik şekilde yayıldı. Bir yapımcı albüm teklif ediyor.",
      choices: [
        c("Albüm yap", "Turne, röportaj, yorgunluk.", {
          cash: 60000, fame: 15,
          m: 10,
          people: 6,
          h: -3,
          theme: "craft",
          log: "Bir şarkısı geniş kitlelere ulaştı.",
        }),
        c("Bağımsız kal", "Kendi bildiğin gibi üret.", {
          m: 4,
          skill: 2,
          theme: "craft",
        }),
      ],
    },
    {
      id: "officeProject",
      jobs: ["office"],
      weight: 3,
      cooldown: 30,
      title: "Teslim tarihi",
      text: "Proje yarın teslim ve ekipte biri izinli. Gece kalırsan yetişir.",
      choices: [
        c("Geceye kal", "Takdir edilirsin.", { skill: 2, h: -2, cash: 1200 }),
        c("Ek süre iste", "Dürüstlük de profesyonelliktir.", {
          m: 1,
          people: 1,
        }),
      ],
    },
    {
      id: "officeRemote",
      jobs: ["office"],
      weight: 2,
      cooldown: 80,
      title: "Uzaktan çalışma",
      text: "Şirket haftada iki gün evden çalışmayı deneyecek. Yol masrafı azalır ama ekip bağı gevşeyebilir.",
      choices: [
        c("Evden çalış", "Yol yok, sessizlik çok.", {
          cash: 900,
          h: 2,
          people: -1,
        }),
        c("Ofiste kal", "Yüz yüze iletişim.", { people: 2 }),
      ],
    },
    {
      id: "officeMentor",
      jobs: ["office"],
      weight: 1.5,
      cooldown: 104,
      title: "Yeni başlayan",
      text: "Ekibe yeni katılan genç biri sürekli sana soru soruyor. Zamanın kısıtlı.",
      choices: [
        c("Ona mentorluk et", "Öğretmek, öğrenmenin en iyi yolu.", {
          skill: 1,
          people: 2,
          m: 2,
          theme: "community",
        }),
        c("Dokümanı göster", "Kendi işine dön.", { skill: 1 }),
      ],
    },
    {
      id: "teacherClass",
      jobs: ["teacher"],
      weight: 3,
      cooldown: 20,
      title: "Arka sıradaki öğrenci",
      text: "Sınıfın en sessiz öğrencisi ödevlerini getirmemeye başladı. Evde bir şeyler oluyor gibi.",
      choices: [
        c("Ailesini ara", "Ders saatinden fazlasını ver.", {
          m: 3,
          people: 2,
          h: -1,
          theme: "community",
        }),
        c("Rehberlik servisine bildir", "Prosedürü işlet.", { skill: 1 }),
      ],
    },
    {
      id: "teacherAssign",
      jobs: ["teacher"],
      weight: 1,
      cooldown: 200,
      title: "Tayin dönemi",
      text: (s, h) =>
        "Tayin listesinde " +
        h.ek(otherCity(s), "loc") +
        " bir okul var. Kalırsan düzenin bozulmaz.",
      choices: (s, h) => [
        c(h.ek(otherCity(s), "dat") + " git", "Yeni okul, yeni şehir.", {
          moveCity: otherCity(s),
          keepJob: true,
          relocationPaid: true, // kamu tayininde harcırah
          skill: 1,
          people: -2,
          theme: "journey",
        }),
        c("Okulumda kal", "Öğrencilerini bırakma.", { people: 2, m: 1 }),
      ],
    },
    {
      id: "nurseNight",
      jobs: ["nurse"],
      weight: 3,
      cooldown: 16,
      title: "Nöbet gecesi",
      text: "Acil serviste yoğun bir gece. Bir hastanın yakını panik içinde senden bilgi istiyor.",
      choices: [
        c("Sakinleştir ve açıkla", "Zor ama değerli.", {
          m: 2,
          people: 1,
          h: -2,
          skill: 1,
        }),
        c("Hekime yönlendir", "Kendi görevine odaklan.", { h: -1 }),
      ],
    },
    {
      id: "nurseExtra",
      jobs: ["nurse"],
      weight: 1.5,
      cooldown: 60,
      title: "Ek nöbet",
      text: "Servis eksik. Başhemşire ek nöbet tutup tutamayacağını soruyor.",
      choices: [
        c("Ek nöbete gir", "Ücret var, uyku yok.", { cash: 3500, h: -4 }),
        c("Hayır de", "Tükenmişlik gerçek.", { h: 2, m: 1, theme: "care" }),
      ],
    },
    {
      id: "shopSlow",
      jobs: ["business"],
      weight: 3,
      cooldown: 20,
      title: "Durgun bir ay",
      text: "Dükkânın önünden geçen çok ama giren az. Kampanya yapmak ya da beklemek senin elinde.",
      choices: [
        c("İndirim kampanyası", "Kâr azalır, müşteri gelir.", {
          cost: 2500,
          people: 3,
          skill: 1,
        }),
        c("Vitrini yenile", "Küçük bir yatırım.", { cost: 4000, skill: 2 }),
        c("Bekle", "Her ay böyle değil.", { m: -2 }),
      ],
    },
    {
      id: "shopGrow",
      jobs: ["business"],
      weight: 1,
      cooldown: 150,
      when: (s) => s.skill >= 15,
      title: "İkinci şube",
      text: "İşler iyi gidiyor. Yan sokakta ikinci bir dükkân boşaldı.",
      choices: [
        c("Şube aç", "Büyü ama riski de büyüt.", {
          cost: 150000,
          skill: 3,
          promote: 1,
          theme: "career",
        }),
        c("Tek dükkân yeter", "Kontrol sende kalsın.", { m: 2, h: 1 }),
      ],
    },
    {
      id: "crimeCall",
      jobs: ["crime"],
      weight: 2,
      cooldown: 16,
      title: "Gece telefon çaldı",
      text: "Seni bu çevreye sokan kişi bir iş daha öneriyor. Para iyi; risk de büyüyor.",
      choices: [
        c("Kabul et", "Riskli para ve ağır bedel.", {
          cash: 6000,
          h: -3,
          m: -4,
          risk: 0.5,
        }),
        c("Uzaklaş", "Kolay olmayacak ama çıkış arayacaksın.", {
          job: "none",
          risk: -1,
          m: 4,
          theme: "care",
        }),
      ],
    },

    // ================= RİSK =================
    {
      id: "shadyOffer",
      weight: (s) => (s.cash < 3000 ? 0.6 : 0.2),
      cooldown: 156,
      minAge: 18,
      maxAge: 50,
      when: (s) => s.job !== "crime",
      title: "Bir teklif",
      text: "Tanıdığın biri hızlı para kazanabileceğin bir işten söz etti. Ayrıntıları belirsiz, ama cazibesi büyük.",
      choices: [
        c("Daha fazlasını sor", "Riskleri öğrenmeden karar verme.", {
          m: 1,
          skill: 1,
        }),
        c("Teklifi kabul et", "Kolay para bazen pahalıya patlar.", {
          job: "crime",
          m: -4,
          risk: 1,
          chance: {
            p: 0.7,
            win: { cash: 9000 },
            lose: { cash: -5000, risk: 1, h: -3 },
            winT: "İlk iş sorunsuz geçti",
            winP: "Zarfı alırken elin titriyordu. Kimse bir şey sormadı.",
            loseT: "Polis çevirmesi",
            loseP:
              "Son anda kurtuldun ama malı bırakmak zorunda kaldın. Borçlu çıktın.",
          },
        }),
        c("Kesin olarak reddet", "Bu yollara girmeyeceksin.", {
          m: 2,
          theme: "care",
        }),
      ],
    },
    {
      id: "pastCalls",
      weight: 2,
      cooldown: 60,
      when: (s) => s.risk > 0 && s.job !== "crime",
      title: "Eski çevreden haber",
      text: "Geçmişte riskli işlere karıştığın biri yeniden aradı. Uzak durmak, geçmişin izlerini hemen silmeyecek.",
      choices: [
        c("Açıkça hayır de", "Güvenli bir hayat kur.", { risk: -1, m: 3 }),
        c("Bir kez daha", "Para kazan ama riskini büyüt.", {
          cash: 8000,
          risk: 1,
          h: -2,
        }),
      ],
    },
    {
      id: "lawyer",
      weight: 3,
      cooldown: 80,
      when: (s) => s.risk >= 2,
      title: "Kapıda iki memur",
      text: "Geçmiş işlerle ilgili ifadeye çağrıldın. Bir avukat tutmak pahalı ama yalnız gitmek daha riskli.",
      choices: [
        c("Avukat tut", "Masraflı ama güvenli.", {
          cost: 25000,
          risk: -1,
          m: -3,
        }),
        c("Yalnız git", "Belki her şey yolunda gider.", { m: -5, h: -2 }),
      ],
    },

    // ================= İLİŞKİLER =================
    {
      id: "meet",
      weight: (s) => 0.6 + Math.min(1.5, s.people / 30),
      cooldown: 40,
      minAge: 19,
      maxAge: 70,
      when: (s) => !s.partner,
      title: "Biriyle tanıştın",
      text: (s, h) =>
        h.pick([
          "Bir arkadaşının doğum gününde ",
          "Mahalle kütüphanesinin önünde ",
          "Yağmurda aynı saçağın altında beklerken ",
          "Bir kursun ilk dersinde ",
        ]) +
        pendingPartner(s, h) +
        " ile sohbetiniz uzadı. Telefon numaraları değişildi.",
      choices: (s, h) => [
        c(
          h.ek(pendingPartner(s, h), "acc") + " yemeğe davet et",
          "Bakalım nereye gidecek.",
          {
            partner: "new",
            partnerName: pendingPartner(s, h),
            cost: 900,
            m: 6,
          },
        ),
        c("Arkadaş olarak kalın", "Şimdi ilişki zamanı değil.", {
          people: 1,
          m: 1,
        }),
      ],
    },
    {
      id: "datePlans",
      weight: 1,
      cooldown: 20,
      when: (s) => s.partner,
      title: (s) => s.partner.name + " ile hafta sonu",
      text: (s, h) =>
        h.ek(s.partner.name, "with") +
        " uzun zamandır baş başa vakit geçirmediniz. Bir plan yapmak ister misin?",
      choices: [
        c("Küçük bir kaçamak", "Masraflı ama unutulmaz.", {
          cost: 2500,
          bond: 8,
          m: 5,
        }),
        c("Evde film gecesi", "Sade ve sıcak.", { bond: 4, m: 2 }),
        c("Bu hafta işim var", "Başka zaman telafi edersin.", {
          bond: -4,
          skill: 1,
        }),
      ],
    },
    {
      id: "argument",
      weight: (s) => (s.partner && s.partner.bond < 50 ? 2 : 0.5),
      cooldown: 26,
      when: (s) => s.partner,
      title: "Gergin bir akşam",
      text: (s) =>
        "Para ve zaman konusu yine tartışmaya döndü. " +
        s.partner.name +
        " kendini yalnız hissettiğini söylüyor.",
      choices: [
        c("Dürüstçe konuş", "Bütçeyi ve beklentileri birlikte gözden geçir.", {
          bond: 7,
          m: 2,
        }),
        c("Çift terapisine gidelim", "Profesyonel destek al.", {
          cost: 3000,
          bond: 12,
          m: 1,
          theme: "care",
        }),
        c("Konuyu kapat", "Gerginlik sürer.", { bond: -8, m: -3 }),
      ],
    },
    {
      id: "breakupTalk",
      priority: 40,
      cooldown: 30,
      when: (s) => s.partner && s.partner.bond < 22,
      title: "Bir yol ayrımı",
      text: (s) =>
        s.partner.name +
        " artık bu ilişkinin ikinize de iyi gelmediğini düşünüyor." +
        (s.partner.married ? " Boşanmayı konuşuyorsunuz." : ""),
      choices: (s) => [
        c(
          s.partner.married ? "Boşanmayı kabul et" : "Ayrılalım",
          "Zor ama dürüst bir son.",
          { breakup: true, m: -10, cost: s.partner.married ? 20000 : 0 },
        ),
        c("Son bir şans iste", "Her şeyi yeniden dene.", { bond: 15, m: -2 }),
      ],
    },
    {
      id: "proposal",
      weight: 3,
      cooldown: 52,
      minAge: 22,
      when: (s) =>
        s.partner &&
        !s.partner.married &&
        s.partner.bond >= 55 &&
        s.year - (s.partner.met || s.year) >= 1,
      title: "Birlikte bir gelecek",
      text: (s) =>
        s.partner.name +
        " ile ilişkinizi resmileştirmeyi konuşuyorsunuz. Düğün büyük ya da küçük olabilir.",
      choices: [
        c("Küçük bir nikâh", "Sade bir kutlama.", {
          marry: true,
          cost: 15000,
          m: 8,
        }),
        c("Büyük düğün", "Herkes gelsin; borç olsa da.", {
          marry: true,
          cost: 120000,
          m: 10,
          people: 6,
        }),
        c("Şimdilik bekleyelim", "Acele etmeyin.", { bond: -3, m: 1 }),
      ],
    },
    {
      id: "baby",
      weight: (s) => (s.children.length ? 0.7 : 1.5),
      cooldown: 80,
      minAge: 23,
      maxAge: 46,
      when: (s) => s.partner && s.partner.bond >= 45 && s.children.length < 4,
      title: (s) =>
        s.children.length
          ? "Aileniz yeniden büyüyebilir"
          : "Aileniz büyüyebilir",
      text: (s) =>
        s.partner.name +
        " ile çocuk sahibi olmayı konuşuyorsunuz." +
        (s.children.length
          ? " Bu kez önceki deneyiminiz de kararınıza yön veriyor."
          : " Hayatınızı baştan sona değiştirecek bir karar.") +
        " Adını şimdiden seçebilirsin.",
      choices: (s, h) =>
        babyNames(s, h)
          .map((n) =>
            c(n, "Çocuğuna " + n + " adını ver.", {
              child: n,
              cost: 8000,
              m: 8,
              bond: 5,
            }),
          )
          .concat([
            c("Başka bir ad yaz", "İsmi kendin seç.", {
              child: "CUSTOM",
              cost: 8000,
              m: 8,
              bond: 5,
            }),
            c("Şimdilik bekleyelim", "Bu dönemi ikiniz yaşayın.", { m: 1 }),
          ]),
    },
    {
      id: "soloParent",
      weight: 0.3,
      once: true,
      minAge: 30,
      maxAge: 45,
      when: (s) => !s.partner && s.children.length === 0 && s.cash > 50000,
      title: "Tek başına ebeveynlik",
      text: "Koruyucu aile olma programının tanıtım toplantısına katıldın. Bir çocuğa yuva olabilirsin.",
      choices: (s, h) => [
        c("Başvur", "Hayatın değişecek.", {
          child: h.pick(
            HS.NAMES.child.filter((n) => !s.children.some((k) => k.name === n)),
          ),
          cost: 5000,
          m: 6,
          theme: "family",
        }),
        c("Hazır değilim", "Belki ileride.", { m: 1 }),
      ],
    },

    // ================= ÇOCUKLAR =================
    {
      id: "kidSchool",
      priority: 50,
      cooldown: 1,
      when: (s) => kidAt(s, 6, 8, "okul"),
      title: (s) => kidAt(s, 6, 8, "okul").name + " okula başlıyor",
      text: (s, h) =>
        h.ek(kidAt(s, 6, 8, "okul").name, "gen") +
        " önlüğü biraz büyük, çantası ise neredeyse kendisinden ağır.",
      choices: (s) => {
        const k = kidAt(s, 6, 8, "okul");
        return [
          c("İlk gün yanında ol", "İzin al, kapıda bekle.", {
            flag: "okul:" + k.name,
            kidBond: 6,
            m: 5,
          }),
          c("Özel okula yazdır", "Masraflı ama imkânlı.", {
            flag: "okul:" + k.name,
            cost: 60000,
            kidBond: 2,
            skill: 0,
            theme: "security",
          }),
          c("Komşuya emanet et", "İş bekliyor.", {
            flag: "okul:" + k.name,
            kidBond: -4,
            cash: 600,
          }),
        ];
      },
    },
    {
      id: "kidTeen",
      priority: 50,
      cooldown: 1,
      when: (s) => kidAt(s, 14, 16, "ergen"),
      title: (s) => kidAt(s, 14, 16, "ergen").name + " büyüyor",
      text: (s) =>
        kidAt(s, 14, 16, "ergen").name +
        " artık kapısını kapatıp müzik dinliyor ve kendi kararlarını vermek istiyor.",
      choices: (s) => {
        const k = kidAt(s, 14, 16, "ergen");
        return [
          c("Birlikte bir hobi edin", "Haftada bir akşam ikiniz.", {
            flag: "ergen:" + k.name,
            kidBond: 8,
            cost: 1500,
          }),
          c("Kurallar koy", "Sınırlar da sevgidir.", {
            flag: "ergen:" + k.name,
            kidBond: -2,
            skill: 1,
          }),
          c("Kendi alanını tanı", "Güven ver.", {
            flag: "ergen:" + k.name,
            kidBond: 4,
          }),
        ];
      },
    },
    {
      id: "kidUni",
      priority: 50,
      cooldown: 1,
      when: (s) => kidAt(s, 18, 20, "uni"),
      title: (s) => kidAt(s, 18, 20, "uni").name + " ve gelecek",
      text: (s) =>
        kidAt(s, 18, 20, "uni").name +
        " başka bir şehirde okumak istiyor. Yurt, yol ve harçlık bütçeyi zorlayacak.",
      choices: (s) => {
        const k = kidAt(s, 18, 20, "uni");
        return [
          c("Destekle", "Aylık harçlık gönder.", {
            flag: "uni:" + k.name,
            cost: 40000,
            kidBond: 8,
            m: 3,
            theme: "family",
          }),
          c("Burada okusun", "Ev yakın, masraf az.", {
            flag: "uni:" + k.name,
            kidBond: -5,
          }),
          c("Kendi kazansın", "Çalışarak okumayı öğrensin.", {
            flag: "uni:" + k.name,
            kidBond: -2,
            theme: "security",
          }),
        ];
      },
    },
    {
      id: "kidWedding",
      priority: 45,
      cooldown: 1,
      when: (s) =>
        s.children.find(
          (k) =>
            kidAge(s, k) >= 27 &&
            !s.flags["dugun:" + k.name] &&
            k.bond > 30 &&
            Math.random() < 0.05,
        ),
      title: "Düğün davetiyesi",
      text: (s) => {
        const k = s.children.find(
          (k) => kidAge(s, k) >= 27 && !s.flags["dugun:" + k.name],
        );
        return (
          k.name +
          " evleniyor. Davetiyeyi eline aldığında yıllar gözünün önünden geçti."
        );
      },
      choices: (s) => {
        const k = s.children.find(
          (k) => kidAge(s, k) >= 27 && !s.flags["dugun:" + k.name],
        );
        return [
          c("Düğüne destek ol", "Masrafın bir kısmını üstlen.", {
            flag: "dugun:" + k.name,
            cost: 50000,
            kidBond: 6,
            m: 8,
            people: 4,
          }),
          c("Sade bir hediye", "Gönülden olan yeter.", {
            flag: "dugun:" + k.name,
            cost: 5000,
            m: 6,
          }),
        ];
      },
    },
    {
      id: "grandchild",
      weight: 3,
      once: true,
      minAge: 48,
      when: (s) => s.children.some((k) => s.flags["dugun:" + k.name]),
      title: "Torun haberi",
      text: (s) => {
        const k = s.children.find((k) => s.flags["dugun:" + k.name]);
        return (
          k.name + " telefonda sesi titreyerek bir bebek beklediğini söyledi."
        );
      },
      choices: [
        c("Hemen yanlarına git", "Bu anı kaçırma.", {
          cost: 3000,
          kidBond: 8,
          m: 10,
          flag: "torun",
          theme: "family",
          log: "Torun sahibi oldu.",
        }),
        c("Görüntülü ara", "Uzaktan da olsa birlikte.", {
          m: 6,
          flag: "torun",
          log: "Torun sahibi oldu.",
        }),
      ],
    },
    {
      id: "kidSick",
      weight: 1,
      cooldown: 80,
      when: (s) => s.children.some((k) => kidAge(s, k) < 12),
      title: "Ateşli bir gece",
      text: "Küçüğün gece yarısı ateşlendi. Sabah önemli bir işin var.",
      choices: [
        c("Sabaha kadar başında bekle", "İşi ertele.", {
          kidBond: 5,
          h: -2,
          cash: -800,
        }),
        c("Eşine ya da aileye bırak", "İşe yetiş.", { kidBond: -3, skill: 1 }),
      ],
    },
    {
      id: "kidPlay",
      weight: 2,
      cooldown: 16,
      when: (s) => s.children.some((k) => kidAge(s, k) < 14),
      title: "Pazar sabahı",
      text: "Çocuk(lar) erkenden uyandı ve parka gitmek için kapının önünde bekliyor.",
      choices: [
        c("Parka git", "Salıncak, simit, kahkaha.", { kidBond: 5, m: 4, h: 1 }),
        c("Biraz daha uyu", "Hafta yorucuydu.", { h: 2, kidBond: -2 }),
      ],
    },

    // ================= SAĞLIK VE GÖRÜNÜM =================
    {
      id: "checkup",
      weight: (s) => (s.health < 65 ? 2.5 : 0.6),
      cooldown: 52,
      minAge: 30,
      title: "Kontrol zamanı",
      text: "Doktorun düzenli kontrolleri aksatmamanı hatırlattı. Tetkik masraflı; erken müdahale ise önemli olabilir.",
      choices: [
        c("Randevu al", "Bütçenden sağlık payı ayır.", {
          cost: 2500,
          h: 7,
          m: 1,
        }),
        c("Biraz daha bekle", "Şimdilik dinlen.", { h: -4 }),
      ],
    },
    {
      id: "illness",
      weight: (s) => Math.max(0, (s.age - 40) / 20),
      cooldown: 104,
      minAge: 45,
      title: "Geçmeyen yorgunluk",
      text: "Bir süredir yorgunluk geçmiyor. Doktor ileri tetkik ve bir süre dinlenme öneriyor.",
      choices: [
        c("Tedaviye başla", "Masraflı ama gerekli.", {
          cost: 15000,
          h: 12,
          m: -2,
        }),
        c("İşe ara ver", "Gelirden vazgeç, dinlen.", {
          h: 8,
          cash: -5000,
          m: 2,
        }),
        c("Görmezden gel", "Belki kendiliğinden geçer.", { h: -10 }),
      ],
    },
    {
      id: "exercise",
      weight: 1,
      cooldown: 40,
      minAge: 18,
      maxAge: 75,
      title: "Spor alışkanlığı",
      text: "Mahalle parkında ücretsiz yürüyüş grubu kurulmuş.",
      choices: [
        c("Katıl", "Haftada iki akşam.", { h: 4, m: 3, people: 1 }),
        c("Spor salonuna yazıl", "Aylık üyelik.", { cost: 2000, h: 6, m: 2 }),
        c("Şimdilik geç", "Zamanın yok.", { m: 0 }),
      ],
    },
    {
      id: "tooth",
      weight: 0.8,
      cooldown: 104,
      title: "Diş ağrısı",
      text: "Ertelediğin diş ağrısı bu hafta arttı.",
      choices: [
        c("Dişçiye git", "Sağlığa bütçeden pay ayır.", { cost: 3000, h: 4 }),
        c("Bekle", "Bu hafta parayı koru.", { h: -4, m: -1 }),
      ],
    },
    {
      id: "thinning",
      once: true,
      weight: 3,
      minAge: 30,
      when: (s) => s.look !== "woman" && !s.transplanted,
      title: "Aynadaki değişim",
      text: "Berber, tepedeki saçlarının seyreldiğini söyledi. Aynaya daha uzun bakıyorsun.",
      choices: [
        c("Kabullen, kısa kestir", "Yaş, yüzüne yakışıyor.", {
          thinning: true,
          hair: "shaved",
          m: 1,
        }),
        c(
          "Saç ekimi araştır",
          "Saç ekimini İLİŞKİLER sekmesindeki berberden yaptırabilirsin.",
          { thinning: true, m: -1 },
        ),
      ],
    },
    {
      id: "barberChat",
      weight: 0.5,
      cooldown: 60,
      title: "Berberde sohbet",
      text: "Berber yeni bir model önerdi. Değişiklik iyi gelebilir.",
      choices: (s) => [
        c("Uzun bırak", "Bakımı biraz zor.", { hair: "long", cost: 500, m: 2 }),
        c("Kıvırcık perma", "Cesur bir değişim.", {
          hair: "curly",
          cost: 1200,
          m: 2,
        }),
        c(s.beard ? "Sakalı kes" : "Sakal bırak", "Yüzün değişsin.", {
          beard: !s.beard,
          cost: 300,
          m: 1,
        }),
        c("Aynısı olsun", "Bildiğin yoldan şaşma.", { cost: 500 }),
      ],
    },

    // ================= PARA =================
    {
      id: "unexpected",
      weight: 1,
      cooldown: 40,
      title: "Beklenmedik masraf",
      text: "Evdeki musluk gece boyunca damlatmış. Tamirci makul bir ücret istiyor.",
      choices: [
        c("Tamir ettir", "Bir daha aklında kalmasın.", { cost: 1800, m: 2 }),
        c("Sonra bakarım", "Parayı elinde tut.", { m: -3 }),
      ],
    },
    {
      id: "savingsGoal",
      weight: (s) =>
        s.cash > 20000 * s.idx.cpi ? 2 : s.cash > 3000 * s.idx.cpi ? 0.3 : 0,
      cooldown: 26,
      title: "Birikim hedefi",
      text: (s, h) =>
        "Hesabında kenara koyabileceğin para var. Mevduata koyabilir ya da endeks fonuna yatırabilirsin; fon dalgalıdır, garanti değildir.",
      choices: (s, h) => {
        const amt = Math.round(Math.max(1000, s.cash * 0.3));
        return [
          c("Bankaya " + h.money(amt), "Mevduat faizi alır.", { save: amt }),
          c("Fona " + h.money(amt), "Getiri de kayıp da olabilir.", {
            fund: amt,
            theme: "security",
          }),
          c("Kendine bir şey al", "Bazen bugünü yaşamak gerekir.", {
            cost: 1500,
            m: 5,
          }),
        ];
      },
    },
    {
      id: "marketDrop",
      weight: (s) => (s.fund > 0 ? 2 : 0),
      cooldown: 40,
      title: "Piyasa sert geriledi",
      text: "Endeks fonun bu hafta değer kaybetti. Dalgalanma geçici olabilir; olmayabilir de.",
      choices: [
        c("Yarısını sat", "Zararı kabul edip riski düşür.", {
          sellFund: 0.5,
          m: -1,
        }),
        c("Bekle", "Kısa vadeli inişe rağmen kal.", {
          m: -2,
          theme: "security",
        }),
        c("Ucuzken ekle", "Cesur bir hamle.", (s) => ({
          fund: Math.min(s.cash, 5000 * s.idx.cpi),
          theme: "risk",
        })),
      ],
    },
    {
      id: "debtCounsel",
      weight: (s) => (s.debt > 0 ? 3 : 0),
      cooldown: 52,
      title: "Borç yapılandırma",
      text: (s, h) =>
        "Kurmaca kredi kuruluşu " +
        h.money(s.debt) +
        " borcunu yeniden yapılandırmayı öneriyor. Faiz düşer ama vade uzar.",
      choices: [
        c("Yapılandır", "Faizi düşür.", {
          debtPlan: 1,
          m: 2,
          theme: "security",
        }),
        c("Elimdekiyle kapat", "Nakdin varsa borcu öde.", { payDebt: 1, m: 3 }),
        c("Aileden destek iste", "Yardım ilişkide karşılık bulur.", {
          debtGift: 5000,
          people: 1,
          m: -1,
        }),
      ],
    },
    {
      id: "inheritance",
      weight: 0.25,
      once: true,
      minAge: 35,
      title: "Uzak bir akrabadan miras",
      text: "Hiç tanımadığın bir büyük teyzeden küçük bir miras kaldı. Avukat evrakları gönderdi.",
      choices: [
        c("Arsa olarak al", "Köydeki küçük bir tarla.", {
          landGift: 1,
          m: 3,
          theme: "security",
        }),
        c("Nakde çevir", "Hemen kullanılabilir para.", { cash: 60000, fame: 15, m: 3 }),
      ],
    },
    {
      id: "transit",
      weight: 0.7,
      cooldown: 52,
      when: (s) => !s.assets.car,
      title: "Ulaşım kartı yenilemesi",
      text: (s, h) =>
        "Aylık abonman " +
        h.tl(HS.ECONOMY.transitPass) +
        ". Peşin alırsan dört hafta boyunca ulaşım giderin azalır.",
      choices: [
        c("Abonman al", "Peşin öde, sonra tasarruf et.", {
          cost: 1000,
          transitPass: 1,
          theme: "security",
        }),
        c("Tek biniş kullan", "Esnek kal.", { m: -1 }),
      ],
    },
    {
      id: "rentHike",
      weight: 2,
      cooldown: 52,
      when: (s) => s.housing.startsWith("kira"),
      title: "Ev sahibi kira artışı istedi",
      text: "Kira yenileme zamanı. İstenen artış bütçeni zorluyor.",
      choices: (s) => [
        s.housing === "kira"
          ? c("Ev arkadaşı bul", "Mahremiyet azalır, gider paylaşılır.", {
              sharedFlat: 1,
              people: 1,
              m: -1,
            })
          : c("Pazarlık et", "Biraz indirim kopar.", {
              rentCut: 0.9,
              skill: 1,
            }),
        c("Aile evine dön", "Bağımsızlığını ertele.", { moveHome: 1, m: -4 }),
        c("Artışı kabul et", "Taşınma derdi olmasın.", { m: -1 }),
      ],
    },
    {
      id: "firstHomeDream",
      weight: 1.5,
      cooldown: 104,
      minAge: 27,
      when: (s) => !s.assets.house && !s.abroad,
      title: "İlk evin hayali",
      text: (s, h) =>
        h.ek(s.city, "loc") +
        " 70 m² bir dairenin ortalama ilan değeri " +
        h.money(HS.homePrice(s)) +
        ". Kredi faizi yüksek ama kira da her yıl artıyor.",
      choices: [
        c("Peşin al", "Birikimin yetiyorsa.", { buy: "house", m: 8 }),
        c("Kredili al (%30 peşinat)", "15 yıl taksit.", {
          buy: "house",
          mortgage: true,
          m: 6,
        }),
        c("Peşinat için biriktir", "Bankaya düzenli para ayır.", (s) => ({
          save: Math.round(Math.min(s.cash, 10000 * s.idx.cpi)),
          m: 1,
        })),
        c("Kirada kal", "Esnek ol.", { m: 1 }),
      ],
    },
    {
      id: "homeRepair",
      weight: 1,
      cooldown: 80,
      when: (s) => s.assets.house,
      title: "Evin bakım masrafı",
      text: "Banyodaki boruda kaçak başladı. Ertelemek alt kata zarar verebilir.",
      choices: [
        c("Onarımı yaptır", "Şimdi öde, büyük zararı önle.", {
          cost: 8500,
          m: 1,
        }),
        c("Bir süre gözle", "Risk al.", { cost: 1200, m: -2 }),
      ],
    },
    {
      id: "carTrouble",
      weight: 1,
      cooldown: 60,
      when: (s) => s.assets.car,
      title: "Araçtan gelen ses",
      text: "Aracından alışılmadık bir ses geliyor.",
      choices: [
        c("Bakım yaptır", "Bütçeyi zorla ama aracı koru.", {
          cost: 6000,
          m: 2,
        }),
        c("Bir ay daha kullan", "Risk alıp bugünü kurtar.", {
          cost: 500,
          h: -1,
        }),
        c("Arabayı sat", "Toplu ulaşıma dön.", { sell: "car", m: -1 }),
      ],
    },
    {
      id: "landOffer",
      weight: 1,
      cooldown: 104,
      when: (s) => s.assets.land,
      title: "Arsa için teklif",
      text: "Arsana bir müteahhitten teklif geldi.",
      choices: [
        c("Sat", "Değerini nakde çevir.", { sell: "land", m: 3 }),
        c("Reddet", "Uzun vadeli planında kal.", { m: 1, theme: "security" }),
      ],
    },

    // ================= YURT DIŞI =================
    {
      id: "abroadOffer",
      weight: (s) => (s.assets.passport ? 1.2 : 0.4),
      cooldown: 150,
      minAge: 21,
      maxAge: 55,
      when: (s) => !s.abroad && s.edu !== "ogrenci" && !s.visa,
      title: "Başka bir ülkede fırsat",
      text: "Yurt dışında iş bulma ihtimali belirdi. Kurmaca bir Avrupa şirketi deneyimli çalışan arıyor. Yol masraflı ve belirsiz.",
      choices: (s, h) => [
        s.assets.passport
          ? c("Göç dosyası aç", "Vize süreci başlar: evrak, randevu, mülakat, belirsiz sonuç.", {
              visaStart: "Almanya",
              theme: "journey",
            })
          : c(
              "Pasaport çıkar",
              "Harç ve defter bedeli " + h.tl(HS.ECONOMY.passport) + ".",
              { passport: 1, theme: "journey" },
            ),
        c("Burada kal", "Kurduğun hayatı sürdür.", { m: 1, people: 1 }),
      ],
    },
    {
      id: "abroadWinter",
      weight: 3,
      cooldown: 52,
      when: (s) => s.abroad && HS.CITIES[s.city]?.region === "abroad",
      title: "Yeni şehirde kış",
      text: "Kış beklediğinden uzun ve yalnız geçiyor. Dil kursu çevreni genişletebilir.",
      choices: [
        c("Dil kursuna yazıl", "Masraf et, çevreni genişlet.", {
          cost: 6000,
          skill: 2,
          people: 3,
        }),
        c("Evdekileri ara", "Uzaktaki bağlarını tazele.", { m: 4, kidBond: 2 }),
      ],
    },
    {
      id: "abroadJob",
      weight: 5,
      cooldown: 4,
      when: (s) =>
        s.abroad &&
        HS.CITIES[s.city]?.region === "abroad" &&
        !working(s) &&
        !s.retired &&
        (s.apps || []).length < 3,
      title: (s) => HS.ek(s.city, "loc") + " iş arayışı",
      text: "Diploman ve deneyimin burada farklı değerlendiriliyor. Hangi kapıyı çalacaksın?",
      choices: (s, h) =>
        ["cafe", "factory", "office", "nurse"].map((j) =>
          c(
            HS.JOBS[j].name + " başvurusu",
            "Aylık net " +
              h.money(HS.wage(s, j, 0)) +
              " · şans %" +
              Math.round(HS.appChance(s, j) * 100),
            { apply: j },
          ),
        ),
    },
    {
      id: "homesick",
      weight: 1.5,
      cooldown: 104,
      when: (s) => s.abroad && s.city !== s.birthCity,
      title: "Memleket özlemi",
      text: (s, h) =>
        h.ek(s.birthCity, "gen") +
        " sokakları rüyana giriyor. Dönmek mi, burada kök salmak mı?",
      choices: [
        c("Geri dön", "Tanıdık sokaklara.", {
          returnHome: true,
          cost: 20000,
          m: 6,
          people: 3,
        }),
        c("Burada kal", "Burası da artık evin.", { m: 1, skill: 1 }),
      ],
    },

    // ================= GÜNLÜK HAYAT VE TOPLULUK =================
    {
      id: "bookshop",
      weight: 1,
      cooldown: 60,
      maxAge: 40,
      title: "Yeni bir çevre",
      text: "Mahallendeki küçük kitapçıda aynı kişiye üçüncü kez rastladın.",
      choices: [
        c("Selam ver", "Belki güzel bir tanışıklık başlar.", {
          m: 4,
          people: 1,
        }),
        c("Sessizce geç", "Bugün kendi düşüncelerinle kal.", { m: 1 }),
      ],
    },
    {
      id: "oldFriend",
      weight: 1,
      cooldown: 52,
      title: "Eski bir arkadaş",
      text: "Liseden bir arkadaşın mesaj attı. Hafta sonu buluşmayı öneriyor.",
      choices: [
        c("Buluşmaya git", "Eski dostluklara vakit ayır.", {
          cost: 650,
          m: 7,
          people: 2,
        }),
        c("Yoğunum de", "Dinlenmeyi seç.", { m: -1 }),
      ],
    },
    {
      id: "course",
      weight: 1,
      cooldown: 52,
      maxAge: 55,
      title: "Akşam kursu",
      text: "Kurmaca halk eğitim merkezinde akşam kursu açılmış.",
      choices: [
        c("Kursa katıl", "Zaman ve para yatırımı.", {
          cost: 1900,
          skill: 3,
          h: -1,
        }),
        c("Bu dönem yoğun", "Şimdilik dinlen.", { h: 2 }),
      ],
    },
    {
      id: "neighbor",
      weight: 1,
      cooldown: 52,
      title: "Mahallede yeni biri",
      text: "Yeni taşınan komşun kolileri taşırken yardım istedi.",
      choices: [
        c("Yardım et", "Apartmanda bir tanıdığın olsun.", { m: 3, people: 2 }),
        c("Yarın selam ver", "Bugün dinlen.", { h: 1 }),
      ],
    },
    {
      id: "solidarity",
      weight: 1,
      cooldown: 52,
      title: "Mahallede dayanışma",
      text: "Apartman sakinleri kış öncesi ortak bakım için katkı topluyor.",
      choices: [
        c("Katkı ver", "Ortak alanı onarın.", { cost: 900, people: 2, m: 2 }),
        c("Bu ay katılamam", "Bütçeni koru.", { m: -1 }),
      ],
    },
    {
      id: "rainy",
      weight: 1,
      cooldown: 30,
      title: "Yağmurlu akşam",
      text: "Dışarıda yağmur başlamış. Eve erken gidebilir ya da bir arkadaşa uğrayabilirsin.",
      choices: [
        c("Eve dön", "Sıcak bir duş iyi gelecek.", { h: 2, m: 1 }),
        c("Çaya uğra", "Sohbet yorgunluğu aldı.", {
          cost: 180,
          m: 5,
          people: 1,
        }),
      ],
    },
    {
      id: "vacation",
      weight: 0.8,
      cooldown: 52,
      title: "Kıyıda kısa bir tatil",
      text: "İki günlük bir sahil kaçamağı planlayabilirsin.",
      choices: [
        c("Tatile çık", "Harca ve dinlen.", {
          cost: 4500,
          h: 5,
          m: 8,
          bond: 5,
          kidBond: 4,
        }),
        c("İzni evde geçir", "Ücretsiz ama yine de dinlendirici.", {
          h: 3,
          m: 3,
        }),
      ],
    },
    {
      id: "wedding",
      weight: 0.8,
      cooldown: 52,
      title: "Bir yakının düğünü",
      text: "Uzun süredir görmediğin bir akrabanın düğün davetiyesi geldi.",
      choices: [
        c("Düğüne git", "Masraf et, akrabalarla buluş.", {
          cost: 2500,
          people: 2,
          m: 4,
        }),
        c("Tebrik mesajı gönder", "Bütçeni koru.", { m: -1, people: 1 }),
      ],
    },
    {
      id: "familyHelp",
      weight: 0.8,
      cooldown: 80,
      minAge: 30,
      maxAge: 65,
      title: "Aileden destek isteği",
      text: "Ailenden biri geçici bir maddi sıkıntı yaşıyor.",
      choices: [
        c("Destek ol", "Bütçene göre katkı ver.", {
          cost: 5000,
          people: 2,
          m: 2,
          theme: "family",
        }),
        c("Şu an gücüm yetmiyor", "Dinle, söz verme.", { people: 1, m: -1 }),
      ],
    },
    {
      id: "library",
      weight: 0.8,
      cooldown: 52,
      title: "Mahalle kütüphanesi",
      text: "Kütüphane geç saatlere kadar açık kalmak için gönüllü arıyor.",
      choices: [
        c("Gönüllü ol", "Yeni insanlarla tanış.", {
          people: 2,
          m: 3,
          theme: "community",
        }),
        c("Bir kitap ödünç al", "Sakin bir hafta.", { m: 2, skill: 1 }),
      ],
    },
    {
      id: "parentCare",
      weight: 1.2,
      once: true,
      minAge: 45,
      maxAge: 65,
      title: "Annenle baban yaşlanıyor",
      text: "Ailen artık eskisi kadar kendi işlerini göremiyor. Yanına almak, bakıcı tutmak ya da sık ziyaret etmek arasında karar vermelisin.",
      choices: [
        c("Yanına al", "Ev kalabalıklaşır, gönül rahatlar.", {
          cost: 5000,
          m: -2,
          people: 2,
          theme: "family",
          log: "Yaşlanan ailesine kendi evinde baktı.",
        }),
        c("Bakıcı tut", "Aylık masraf ama düzen korunur.", {
          cost: 30000,
          m: 1,
        }),
        c("Hafta sonları git", "Yorucu bir gidiş geliş.", {
          h: -3,
          m: 2,
          people: 1,
        }),
      ],
    },
    {
      id: "loss",
      weight: 0.6,
      once: true,
      minAge: 50,
      title: "Bir veda",
      text: "Çocukluğundan beri tanıdığın biri hayatını kaybetti. Cenaze kalabalığında yıllar birbirine karıştı.",
      choices: [
        c("Ailesinin yanında ol", "Günlerce destek ver.", {
          people: 2,
          m: -4,
          theme: "community",
        }),
        c("Kendi içinde yas tut", "Sessizce.", { m: -6, h: -1 }),
      ],
    },

    // ================= EMEKLİLİK =================
    {
      id: "retireVolunteer",
      weight: 2,
      cooldown: 52,
      when: (s) => s.retired,
      title: "Emeklilik düzeni",
      text: "Günün yapısını koruyacak bir uğraş bulmak iyi gelebilir.",
      choices: [
        c("Gönüllü çalış", "Mahallede haftada bir katkı ver.", {
          m: 5,
          people: 2,
          h: 1,
          theme: "community",
        }),
        c("Bahçeyle uğraş", "Toprak sabır öğretir.", {
          h: 3,
          m: 3,
          theme: "care",
        }),
        c("Evde dinlen", "Sakin bir düzen.", { h: 2, m: 1 }),
      ],
    },
    {
      id: "retireTrip",
      weight: 1,
      cooldown: 104,
      when: (s) => s.retired && s.health > 40,
      title: "Hep gitmek istediğin yer",
      text: "Gençken hep ertelediğin o yolculuk için artık vaktin var.",
      choices: [
        c("Yola çık", "Biriktirdiğin parayı harca.", {
          cost: 25000,
          m: 10,
          h: -1,
          theme: "journey",
          log: "Yıllarca ertelediği yolculuğa çıktı.",
        }),
        c("Fotoğraflara bak", "Hayal etmek de bir yolculuk.", { m: 2 }),
      ],
    },
    {
      id: "memoir",
      weight: 0.6,
      once: true,
      minAge: 65,
      title: "Anılarını yaz",
      text: "Torunlar ya da komşu çocukları hikâyelerini dinlemeye bayılıyor. Bir deftere yazmaya ne dersin?",
      choices: [
        c("Yazmaya başla", "Her akşam bir sayfa.", {
          m: 5,
          skill: 1,
          theme: "craft",
          log: "Hayat hikâyesini bir deftere yazdı.",
        }),
        c("Anlatmak yeter", "Sözler uçar ama sıcak kalır.", {
          people: 2,
          m: 3,
        }),
      ],
    },
  ];

  // ----- yardımcılar (olaylar arası) -----
  function electionPair(s) {
    const n = HS.PARTIES.length,
      a = ((s.year / 4 + s.seed) % n) | 0,
      b = (a + 1 + ((s.seed + s.year) % (n - 1))) % n;
    return [HS.PARTIES[a], HS.PARTIES[b === a ? (a + 1) % n : b]];
  }
  function otherCity(s) {
    const list = HS.HOME_CITIES.filter((x) => x !== s.city);
    return list[(s.seed + s.year) % list.length];
  }
  HS.electionPair = electionPair;
  HS.otherCity = otherCity;
})(globalThis.HS || (globalThis.HS = {}));
