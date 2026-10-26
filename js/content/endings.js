// Hayat sonu sistemi.
// Son profili 11 boyuttan oluşur. Her boyut, hayatın sonundaki duruma ve
// hayat boyunca biriken kararlara göre bir değişken seçer; her değişken final
// anlatısına kendine özgü cümleler ekler ve bazı boyutlar birbirinin metnini
// değiştirir (ör. çocukların akıbeti eğitim, servet ve bağa göre şekillenir).
// Profil anahtarı boyut değerlerinin birleşimidir; aynı anahtar aynı anlatı
// iskeletini, farklı anahtar farklı bir anlatıyı verir.
(function (HS) {
  "use strict";

  const ek = (...a) => HS.ek(...a);
  const lower = (t) => String(t).toLocaleLowerCase("tr-TR");
  // İsimden kararlı küçük bir sayı (aynı çocuk her seferinde aynı yolu alır).
  const hashStr = (t) => {
    let h = 2166136261;
    for (const ch of String(t)) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
    // FNV'nin alt bitleri zayıf; son karıştırma ile dağılımı düzelt.
    h ^= h >>> 16;
    h = Math.imul(h, 0x85ebca6b);
    h ^= h >>> 13;
    return h >>> 0;
  };

  const TRAIT_NORM = {
    career: 90,
    family: 90,
    care: 300,
    risk: 30,
    journey: 10,
    craft: 70,
    community: 260,
    security: 230,
  };

  // ---------- Boyutlar ----------
  const DIMS = [
    {
      id: "son",
      name: "Hayatın kapanışı",
      values: [
        "uzun",
        "dogal",
        "erken-hastalik",
        "gec-hastalik",
        "suc",
        "kriz",
        "secim-genc",
        "secim-olgun",
      ],
      of: (s) => {
        if (s.ending === "health")
          return s.age < 60 ? "erken-hastalik" : "gec-hastalik";
        if (s.ending === "crime") return "suc";
        if (s.ending === "crisis") return "kriz";
        if (s.ending === "chosen")
          return s.age < 40 ? "secim-genc" : "secim-olgun";
        return s.age >= 85 ? "uzun" : "dogal";
      },
    },
    {
      id: "kariyer",
      name: "Meslek ve yükseliş",
      values: (() => {
        const v = ["hic"];
        [
          "cafe",
          "factory",
          "music",
          "office",
          "teacher",
          "nurse",
          "memur",
          "business",
          "crime",
        ].forEach((j) =>
          ["cirak", "usta", "zirve"].forEach((b) => v.push(j + "-" + b)),
        );
        return v;
      })(),
      of: (s) => {
        const t = Object.entries(s.jobTime || {}).sort((a, b) => b[1] - a[1]);
        if (!t.length || t[0][1] < 8) return "hic";
        const peak = s.peak || 0;
        const band =
          peak >= 2 && s.skill >= 50
            ? "zirve"
            : peak >= 1 || s.skill >= 40
              ? "usta"
              : "cirak";
        return t[0][0] + "-" + band;
      },
    },
    {
      id: "egitim",
      name: "Eğitim",
      values: ["lise", "universite", "yarim"],
      of: (s) =>
        s.edu === "universite"
          ? "universite"
          : s.edu === "lise"
            ? "lise"
            : "yarim",
    },
    {
      id: "ask",
      name: "Aşk hayatı",
      values: [
        "hic",
        "ayrilik",
        "bosanma",
        "partner",
        "evli-yakin",
        "evli-mesafeli",
      ],
      of: (s) => {
        if (s.partner)
          return s.partner.married
            ? s.partner.bond >= 50
              ? "evli-yakin"
              : "evli-mesafeli"
            : "partner";
        if (s.divorced) return "bosanma";
        return s.exes > 0 ? "ayrilik" : "hic";
      },
    },
    {
      id: "cocuk",
      name: "Çocuklar",
      values: ["yok", "bir-yakin", "bir-uzak", "cok-yakin", "cok-uzak"],
      of: (s) => {
        const n = s.children.length;
        if (!n) return "yok";
        const bond = s.children.reduce((a, k) => a + k.bond, 0) / n;
        return (n === 1 ? "bir" : "cok") + (bond >= 50 ? "-yakin" : "-uzak");
      },
    },
    {
      id: "cevre",
      name: "Çevre",
      values: ["yalniz", "az-oz", "kalabalik"],
      of: (s) =>
        s.people < 15 ? "yalniz" : s.people < 45 ? "az-oz" : "kalabalik",
    },
    {
      id: "servet",
      name: "Servet ve ev",
      values: ["borclu", "kit", "orta", "rahat", "varlikli"].flatMap((m) => [
        m + "-ev",
        m + "-evsiz",
      ]),
      of: (s) => {
        const real = HS.netWorth(s) / s.idx.cpi; // 2026 TL'sine indirgenmiş
        const m =
          real < 0
            ? "borclu"
            : real < 100000
              ? "kit"
              : real < 1500000
                ? "orta"
                : real < 6000000
                  ? "rahat"
                  : "varlikli";
        return m + (s.assets.house ? "-ev" : "-evsiz");
      },
    },
    {
      id: "yer",
      name: "Yer",
      values: ["memleket", "baska-sehir", "yurtdisi", "donus"],
      of: (s) =>
        s.abroad
          ? s.returned && s.city === s.birthCity
            ? "donus"
            : "yurtdisi"
          : s.city !== s.birthCity
            ? "baska-sehir"
            : "memleket",
    },
    {
      id: "beden",
      name: "Beden ve ruh",
      values: ["kirilgan", "dengeli", "dinc"].flatMap((h) =>
        ["huzursuz", "sakin", "mutlu"].map((m) => h + "-" + m),
      ),
      of: (s) =>
        (s.health < 35 ? "kirilgan" : s.health < 70 ? "dengeli" : "dinc") +
        "-" +
        (s.mood < 35 ? "huzursuz" : s.mood < 65 ? "sakin" : "mutlu"),
    },
    {
      id: "tema",
      name: "Baskın yaşam teması",
      values: [
        "career",
        "family",
        "care",
        "risk",
        "journey",
        "craft",
        "community",
        "security",
      ],
      // Puanlar, o temanın ortalama bir hayatta ne kadar biriktiğine bölünür;
      // böylece sık fırsat çıkan temalar (ör. bakım) her hayatı ele geçirmez.
      // TRAIT_NORM değerleri tests/simulate.js çıktısındaki ortalamalardan alınmıştır.
      of: (s) => {
        const t = Object.entries(s.traits)
          .map(([k, v]) => [k, v / TRAIT_NORM[k]])
          .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
        return t[0][1] > 0 ? t[0][0] : "care";
      },
    },
    {
      id: "iz",
      name: "Risk geçmişi",
      values: ["temiz", "kurtulan", "golgeli"],
      of: (s) =>
        s.riskEver <= 0 ? "temiz" : s.risk < 2 ? "kurtulan" : "golgeli",
    },
  ];
  // Mantıksal olarak imkânsız birleşimler (sayımdan düşülür).
  const INVALID = [(p) => p.son === "suc" && p.iz === "temiz"];

  // ---------- Metin parçaları ----------
  const JOBN = {
    cafe: ["kafede", "tezgâhın arkasında geçen yıllar"],
    factory: ["fabrikada", "vardiya düdükleriyle geçen yıllar"],
    music: ["sahnede", "gece yarısı biten konserler"],
    office: ["ofiste", "toplantılar ve teslim tarihleri"],
    teacher: ["okulda", "teneffüs zilleri ve öğrenci defterleri"],
    nurse: ["klinikte", "nöbet geceleri ve iyileşen hastalar"],
    business: ["dükkânında", "kepenk açıp kapatarak geçen yıllar"],
    memur: ["belediye şirketinde", "dosyalar, mühürler ve çay molaları"],
    crime: ["gece işlerinde", "kimseye anlatılamayan geceler"],
  };
  const ARCH_NOUN = {
    hic: "bir gezgin",
    cafe: "bir kafe emekçisi",
    factory: "bir usta işçi",
    music: "bir müzisyen",
    office: "bir ofis insanı",
    teacher: "bir öğretmen",
    nurse: "bir şifacı",
    business: "bir esnaf",
    memur: "bir memur",
    crime: "bir gece insanı",
  };
  const ARCH_ADJ = {
    career: "Hırslı",
    family: "Ailesine adanmış",
    care: "Kendine iyi bakan",
    risk: "Tehlikeyle dans eden",
    journey: "Yollara düşen",
    craft: "Üreten",
    community: "Herkesin dostu",
    security: "Temkinli",
  };

  const T = {
    son: {
      uzun: (s, h) =>
        s.age +
        " yaşına kadar yaşadı; ömrünün son kışında bile sabahları pencereyi açıp şehrin sesini dinledi.",
      dogal: (s, h) =>
        s.age + " yaşında, bir sonbahar sabahı uykusunda sessizce gitti.",
      "erken-hastalik": (s) =>
        "Henüz " +
        s.age +
        " yaşındayken bedeni daha fazla dayanamadı; gidişi herkese erken geldi.",
      "gec-hastalik": (s) =>
        s.age +
        " yaşında, uzun süren bir hastalığın ardından aramızdan ayrıldı.",
      suc: (s) =>
        s.age +
        " yaşında geçmişin hesabı kapısını çaldı; hikâyesi bir mahkeme koridorunda yarım kaldı.",
      kriz: (s) =>
        s.age +
        " yaşında, uzun bir karanlık dönemin içinde yorgun düştü; hikâye orada sustu.",
      "secim-genc": (s) =>
        s.age +
        " yaşında bu hikâyeyi kendi isteğinle kapattın; yazılmamış sayfalar başka bir hayata kaldı.",
      "secim-olgun": (s) =>
        s.age + " yaşında anı defterini kendi elinle kapattın.",
    },
    yer: {
      memleket: (s) =>
        "Bütün ömrünü " +
        ek(s.birthCity, "loc") +
        " geçirdi; sokaklar onu, o sokakları tanıyordu.",
      "baska-sehir": (s) =>
        ek(s.birthCity, "abl") +
        " çıkıp " +
        ek(s.city, "loc") +
        " yeni bir hayat kurdu; iki şehrin arasında bölünmüş bir hafıza taşıdı.",
      yurtdisi: (s) =>
        ek(s.birthCity, "loc") +
        " başlayan yol onu " +
        ek(s.city, "dat") +
        " götürdü; son yıllarını başka bir dilin içinde yaşadı.",
      donus: (s) =>
        "Yıllarca yurt dışında yaşadıktan sonra " +
        ek(s.birthCity, "dat") +
        " geri döndü; dönüşü, gidişinden daha çok şey anlattı.",
    },
    egitim: {
      lise: "Lise diplomasıyla başladı; ne öğrendiyse hayatın içinde öğrendi.",
      universite:
        "Üniversite diploması kapıları açtı; okul yıllarının arkadaşlıkları ömür boyu sürdü.",
      yarim:
        "Üniversiteye başladı ama bitiremedi; yarım kalan o yıllar kafasının bir köşesinde hep durdu.",
    },
    kariyer: (s, v) => {
      if (v === "hic")
        return "Hiçbir işte uzun süre kalmadı; düzenli bir mesleğin değil, değişen günlerin insanı oldu.";
      const [job, band] = v.split("-");
      const [where, memory] = JOBN[job];
      const bandText = {
        cirak: "işin başında kaldı ama emeğini hiç esirgemedi",
        usta: "zamanla ustalaştı ve sözü dinlenen biri oldu",
        zirve:
          "mesleğinin en üst basamaklarına çıktı; adı işinde örnek gösterildi",
      }[band];
      return (
        "Çalışma hayatının çoğu " +
        where +
        " geçti: " +
        memory +
        ". Orada " +
        bandText +
        "."
      );
    },
    ask: (s, v) => {
      const p = s.partner;
      switch (v) {
        case "hic":
          return "Hayatına kimseyi tam olarak almadı; yalnızlığı bazen bir seçim, bazen bir yorgunluktu.";
        case "ayrilik":
          return "Birkaç kez sevdi, birkaç kez ayrıldı; her ilişkiden geriye bir şarkı, bir sokak adı kaldı.";
        case "bosanma":
          return "Evlendi ama o evlilik sürmedi; boşanmanın ardından kendini yeniden kurmayı öğrendi.";
        case "partner":
          return (
            ek(p.name, "with") +
            " evlenmeden ama yan yana yaşlandılar; resmî bir imzaya hiç ihtiyaç duymadılar."
          );
        case "evli-yakin":
          return (
            ek(p.name, "with") +
            " evliliği sonuna dek sıcak kaldı; son gün de ellerini bırakmadı."
          );
        case "evli-mesafeli":
          return (
            ek(p.name, "with") +
            " evli kaldılar ama aralarındaki mesafe yıllar içinde büyüdü; aynı evde iki ayrı sessizlik oldular."
          );
      }
    },
    cevre: {
      yalniz:
        "Çevresi küçüktü; kapısını çalan birkaç kişi dışında dünyayla arasına bir perde çekti.",
      "az-oz":
        "Az ama sağlam dostlukları vardı; zor günde arayabileceği isimler hep aynı kaldı.",
      kalabalik:
        "Kalabalık bir çevresi vardı; mahallede, işte ve sofrada adı hep anıldı.",
    },
    servet: (s, v) => {
      const [m, ev] = v.split("-");
      const money = {
        borclu: "Geriye ödenmemiş borçlar bıraktı",
        kit: "Hayatı boyunca kıt kanaat geçindi",
        orta: "Ne zengin ne yoksuldu; kenarda her zaman biraz parası oldu",
        rahat: "Maddi açıdan rahat bir hayat sürdü",
        varlikli: "Gençliğinde hayal bile edemeyeceği bir servet biriktirdi",
      }[m];
      const home =
        ev === "ev"
          ? m === "borclu"
            ? "; yine de kendi evinin tapusu üzerindeydi."
            : "; kendi evinin kapısını kendi anahtarıyla açtı."
          : m === "varlikli" || m === "rahat"
            ? " ama hiçbir yere kök salıp ev almadı."
            : "; ömrü kirada ve başkalarının evlerinde geçti.";
      return money + home;
    },
    beden: (s, v) => {
      const [hb, mb] = v.split("-");
      const body = {
        kirilgan: "Son yıllarında bedeni kırılgandı",
        dengeli: "Sağlığı inişli çıkışlıydı",
        dinc: "Son ana kadar dinç kaldı",
      }[hb];
      const soul = {
        huzursuz: "içindeki huzursuzluk hiç tam dinmedi",
        sakin: "ruhu ise sakin bir göl gibiydi",
        mutlu: "yüzündeki gülümseme ise hiç eksilmedi",
      }[mb];
      return body + "; " + soul + ".";
    },
    tema: {
      career:
        "Ona bakınca insanlar önce emeğini, öğrenme açlığını ve hiç bitmeyen hedeflerini hatırladı.",
      family:
        "Kararlarının çoğu sevdikleri içindi; hayatını bir aile sofrasının etrafında kurdu.",
      care: "Kendine ve bedenine iyi baktı; yavaşlamayı bilen nadir insanlardandı.",
      risk: "Kolay paranın ve tehlikenin çekimine defalarca kapıldı; hayatı bir ip cambazının yürüyüşüne benzedi.",
      journey:
        "Hep bir sonraki yolu, bir sonraki şehri düşledi; valizi hiçbir zaman tam boşalmadı.",
      craft:
        "Üretmeyi sevdi; geride elinden çıkmış işler, şarkılar ya da düzenlenmiş bir dükkân kaldı.",
      community: "Başkalarının derdine koşan biriydi; mahallesinde iz bıraktı.",
      security:
        "Her kararından önce hesap yaptı; temkinli adımlarla, sağlam bir zemin kurdu.",
    },
    iz: {
      temiz: "",
      kurtulan:
        "Gençliğindeki riskli işlerden zamanında uzaklaştı; o yılları kimseye pek anlatmadı.",
      golgeli:
        "Karanlık işlerin gölgesi onu hiç bırakmadı; yakınları bazı soruları hiç sormadı.",
    },
  };

  // Çocukların akıbeti: ebeveynin eğitimi, serveti, teması ve bağa göre.
  function kidFate(s, k, p) {
    const age = s.year - k.born;
    if (age < 18)
      return (
        k.name +
        " henüz " +
        age +
        " yaşındaydı; " +
        (s.partner
          ? ek(s.partner.name, "gen") + " yanında büyüyecek"
          : "akrabalarının yanında büyüyecek") +
        "."
      );
    const close = k.bond >= 50;
    const rich = /rahat|varlikli/.test(p.servet);
    const r = hashStr(k.name + p.tema + p.egitim) % 4;
    let path;
    if (p.egitim === "universite" || rich)
      path = [
        "üniversiteyi bitirip öğretmen oldu",
        "doktor olarak çalıştı",
        "kendi mimarlık ofisini kurdu",
        "bir araştırma laboratuvarında çalıştı",
      ][r];
    else if (p.tema === "craft")
      path = [
        "müzikle hayatını kazandı",
        "bir atölye açtı",
        "fotoğrafçı oldu",
        "sahne tasarımcısı oldu",
      ][r];
    else if (p.tema === "journey" || p.yer === "yurtdisi")
      path = [
        "başka bir ülkeye yerleşti",
        "gemilerde çalıştı",
        "rehber oldu",
        "iki ülke arasında yaşadı",
      ][r];
    else
      path = [
        "kendi dükkânını açtı",
        "fabrikada usta oldu",
        "belediyede memur oldu",
        "aşçı oldu",
      ][r];
    const bondText = close
      ? [
          "her pazar kapısını çaldı",
          "son günlerde başucundan ayrılmadı",
          "onun hikâyelerini çocuklarına anlattı",
        ][r % 3]
      : [
          "yılda birkaç kez aradı",
          "aradaki kırgınlığı tam kapatamadı",
          "uzaktan, mesafeli bir sevgi taşıdı",
        ][r % 3];
    return k.name + " " + path + "; " + bondText + ".";
  }

  // Veda sahnesi: çevre, aşk ve çocuk boyutlarının birleşimi.
  function farewell(s, p) {
    const who = [];
    if (s.partner) who.push(s.partner.name);
    if (s.children.length)
      who.push(s.children.length === 1 ? s.children[0].name : "çocukları");
    if (s.flags.torun) who.push("torunları");
    const crowd = {
      yalniz: "birkaç kişi",
      "az-oz": "en yakın dostları",
      kalabalik: "mahalleden, işten, eski okuldan onlarca kişi",
    }[p.cevre];
    if (p.son === "suc")
      return (
        "Son gününde yanında " +
        (who.length ? who.join(", ") : "kimse") +
        " yoktu; haberi " +
        crowd +
        " gazeteden öğrendi."
      );
    if (!who.length && p.cevre === "yalniz")
      return "Vedasında yalnızca birkaç komşu vardı; biri pencere önündeki saksıları sulamayı üstlendi.";
    return (
      "Vedasında " +
      (who.length ? who.join(", ") + " ve " : "") +
      crowd +
      " vardı" +
      (p.tema === "community"
        ? "; mahallenin kahvesinde onun için bir sandalye boş bırakıldı."
        : ".")
    );
  }

  function profileOf(s) {
    const p = {};
    DIMS.forEach((d) => (p[d.id] = d.of(s)));
    return p;
  }
  function keyOf(p) {
    return DIMS.map((d) => p[d.id]).join("|");
  }
  function archetype(p) {
    const job = p.kariyer === "hic" ? "hic" : p.kariyer.split("-")[0];
    return ARCH_ADJ[p.tema] + " " + ARCH_NOUN[job];
  }

  function compose(s) {
    s.ending = s.ending || "age";
    const p = profileOf(s);
    const key = keyOf(p);
    const name = s.first + " " + s.last;
    const paras = [];
    paras.push(name + ", " + T.son[p.son](s) + " " + T.yer[p.yer](s));
    paras.push(
      T.egitim[p.egitim] + " " + T.kariyer(s, p.kariyer) + " " + T.tema[p.tema],
    );
    const love = [T.ask(s, p.ask)];
    s.children.slice(0, 4).forEach((k) => love.push(kidFate(s, k, p)));
    if (s.children.length > 4)
      love.push("Diğer çocukları da aynı sofranın etrafında büyüdü.");
    if (s.flags.torun)
      love.push(
        "Torunlarını kucağına aldığı gün, hayatının en uzun gülümsemesiydi.",
      );
    paras.push(love.join(" "));
    paras.push(T.servet(s, p.servet) + " " + T.cevre[p.cevre]);
    paras.push((T.beden(s, p.beden) + " " + T.iz[p.iz]).trim());
    const moments = (s.log || [])
      .slice(-5)
      .map((m) => m.age + " yaşında: " + m.text);
    paras.push(farewell(s, p));
    return {
      key,
      profile: p,
      title: archetype(p),
      heading: {
        age: "Dolu dolu bir ömür",
        health: "Bir hayatın son sayfası",
        crime: "Bir kararın ağır bedeli",
        crisis: "Ağır bir dönemin sonu",
        chosen: "Bu hayatı burada kapattın",
      }[s.ending],
      paragraphs: paras,
      moments,
      stats: { age: s.age, year: s.year, weeks: s.weeks },
    };
  }

  // Geçerli profil uzayının büyüklüğü (imkânsız birleşimler hariç).
  function spaceSize() {
    const total = DIMS.reduce((a, d) => a * d.values.length, 1);
    // Tek kısıt: suç sonu temiz geçmişle olamaz.
    const sonN = DIMS[0].values.length,
      izN = DIMS.find((d) => d.id === "iz").values.length;
    const invalid = (total / (sonN * izN)) * 1 * 1;
    return total - invalid;
  }

  // Anı defterinde gösterilen okunur etiketler.
  const WORDS = {
    uzun: "uzun bir ömür",
    dogal: "doğal veda",
    "erken-hastalik": "erken gelen hastalık",
    "gec-hastalik": "hastalık sonrası veda",
    suc: "geçmişin hesabı",
    kriz: "ağır bir dönem",
    "secim-genc": "erken kapanış (seçim)",
    "secim-olgun": "kendi kapanışı",
    hic: "yok",
    cirak: "başlangıç",
    usta: "usta",
    zirve: "zirve",
    cafe: "kafe",
    factory: "fabrika",
    music: "müzik",
    office: "ofis",
    teacher: "öğretmenlik",
    nurse: "sağlık",
    business: "esnaflık",
    memur: "memurluk",
    crime: "gece işleri",
    lise: "lise",
    universite: "üniversite",
    yarim: "yarım kalan üniversite",
    ayrilik: "ayrılıklar",
    bosanma: "boşanma",
    partner: "evlenmeden birlikte",
    "evli-yakin": "sıcak bir evlilik",
    "evli-mesafeli": "mesafeli evlilik",
    yok: "yok",
    "bir-yakin": "bir çocuk, yakın",
    "bir-uzak": "bir çocuk, mesafeli",
    "cok-yakin": "çocuklar, yakın",
    "cok-uzak": "çocuklar, mesafeli",
    yalniz: "yalnız",
    "az-oz": "az ama öz",
    kalabalik: "kalabalık",
    borclu: "borçlu",
    kit: "kıt",
    orta: "orta",
    rahat: "rahat",
    varlikli: "varlıklı",
    ev: "ev sahibi",
    evsiz: "ev sahibi değil",
    memleket: "memleketinde",
    "baska-sehir": "başka bir şehirde",
    yurtdisi: "yurt dışında",
    donus: "yurt dışından dönüş",
    kirilgan: "kırılgan",
    dengeli: "dengeli",
    dinc: "dinç",
    huzursuz: "huzursuz",
    sakin: "sakin",
    mutlu: "mutlu",
    career: "kariyer",
    family: "aile",
    care: "öz bakım",
    risk: "risk",
    journey: "yolculuk",
    craft: "üretmek",
    community: "topluluk",
    security: "güvence",
    temiz: "temiz",
    kurtulan: "riskten dönen",
    golgeli: "gölgeli",
  };
  function label(dim, v) {
    if (dim === "kariyer" && v !== "hic") {
      const [j, b] = v.split("-");
      return WORDS[j] + " · " + WORDS[b];
    }
    if (WORDS[v]) return WORDS[v];
    return v
      .split("-")
      .map((x) => WORDS[x] || x)
      .join(" · ");
  }

  HS.Endings = {
    DIMS,
    label,
    INVALID,
    profileOf,
    keyOf,
    compose,
    archetype,
    spaceSize,
    T,
    kidFate,
    farewell,
  };
})(globalThis.HS || (globalThis.HS = {}));
