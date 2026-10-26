// Hayat hikâyeleri: sosyal çevre, aile, sağlık, hobiler, para ve şehir hayatı.
// Kalıcı tanıdıklar (en yakın arkadaş, lise arkadaşı, aile hekimi, komşu, usta) ve
// akrabalar (s.kin) birden fazla hikâyede görünür; önceki kararlar sonraki metinleri değiştirir.
(function (HS) {
  "use strict";
  const c = (label, hint, fx = {}) => ({ label, hint, fx });
  const ek = (w, k) => HS.ek(w, k);
  const F = (s) => HS.cast(s, "enYakin").name;
  const L = (s) => HS.cast(s, "liseArk").name;
  const D = (s) => HS.cast(s, "doktor").name;
  const P = (s) => (s.partner ? s.partner.name : "Partnerin");
  const done = (s, id) => HS.done(s, id);
  const local = (s) => !s.abroad;
  const working = (s) => s.job && s.job !== "none" && s.job !== "crime" && !s.retired;
  const kin = (s, rels) => (s.kin || []).filter((k) => k.alive && rels.includes(k.rel));
  const kinById = (s, id) => (s.kin || []).find((k) => k.id === id && k.alive);
  const kAge = (s, k) => s.year - k.born;
  const motorCar = (s) => s.car && !["bisiklet", "scooter"].includes(s.car);
  // Düğünde oynanacak rol: aynı cinsiyetteyse sağdıç/nedime, değilse nikâh şahidi
  const yaver = (s) => {
    const f = HS.cast(s, "enYakin");
    if (!f.woman && s.look === "man") return "sağdıç";
    if (f.woman && s.look === "woman") return "nedime";
    return "nikâh şahidi";
  };
  const abiAbla = (s) => (s.look === "woman" ? "abla" : "abi");

  // =====================================================================
  // EN YAKIN ARKADAŞ ZİNCİRİ: borç → düğün → ortaklık → gurbet
  // =====================================================================
  HS.story("l_borc", {
    when: (s) => local(s),
    minAge: 19,
    maxAge: 45,
    weight: 0.6,
    room: "salon",
    title: (s) => F(s) + " zor durumda",
    text: (s, h) =>
      F(s) + " gece yarısı mesaj attı: ev sahibi kirayı artırmış, taşınmak zorunda. Yeni evin depozitosu ve nakliye için " + h.tl(20000) + " lazım. “Üç ayda öderim, söz,” diyor. Yıllardır en yakın arkadaşın; ilk kez senden para istiyor.",
    choices: (s, h) => [
      c("Tamamını ver", h.tl(20000) + " · geri gelir mi?", { cost: 20000, rel: { enYakin: 8 }, m: 1, set: { amt: 20000 }, go: "vade" }),
      c("Yarısını ver", h.tl(10000) + " · “elimden bu kadar geliyor”", { cost: 10000, rel: { enYakin: 2 }, set: { amt: 10000 }, go: "vade" }),
      c("Kibarca reddet", "Paranı korursun; arkadaşın kırılır.", { rel: { enYakin: -8 }, m: -2, stress: 1, end: "vermedi" }),
    ],
    steps: {
      vade: {
        gap: 10,
        title: "Üç ay doldu",
        text: (s, h) => F(s) + " için söz verilen üç ay doldu. " + h.tl(h.d.amt || 10000) + " hâlâ ortada. Bir yandan da hesap kartının ekstresi geliyor.",
        choices: (s, h) => {
          const a = h.d.amt || 10000;
          return [
            c("Bir şey deme, kendisi açsın", "Şans %50 · arkadaşlık gerilmez", { chance: { p: 0.5, win: { cash: a, m: 3, rel: { enYakin: 5 }, end: "odedi" }, lose: { m: -2, stress: 2, go: "hatirlat" }, winT: "Para geldi", winP: F(s) + " hesabına kuruşu kuruşuna yatırmış; üstüne bir de kutu baklava bıraktı.", loseT: "Ses yok", loseP: "Haftalar geçti; konu hiç açılmadı." } }),
            c("Nazikçe hatırlat", "Şans %65 · biraz tuhaf kaçabilir", { chance: { p: 0.65, win: { cash: a, rel: { enYakin: 1 }, end: "odedi" }, lose: { rel: { enYakin: -4 }, stress: 2, go: "hatirlat" }, winT: "“Haklısın, hemen yatırıyorum”", winP: "Biraz mahcup oldu ama parayı aynı gün gönderdi.", loseT: "“Bu ay biraz sıkışığım”", loseP: "Telefonu çabuk kapattı." } }),
            c("Borcu sil, dostluk önemli", "Para gider; gönül kalır.", { rel: { enYakin: 12 }, m: -1, esteem: 2, end: "affetti" }),
          ];
        },
      },
      hatirlat: {
        gap: 4,
        title: "Bahaneler bitmiyor",
        text: (s) => F(s) + " yine “bu ay da olmadı” diyor. Ama dün akşam Instagram’da yeni telefonunun kutu açılışını paylaştı.",
        choices: (s, h) => {
          const a = h.d.amt || 10000;
          return [
            c("Yüz yüze, açık konuş", "Şans %50 · ya hava temizlenir ya da kopar", { chance: { p: 0.5, win: { cash: Math.round(a / 2), rel: { enYakin: -2 }, end: "yarisi" }, lose: { rel: { enYakin: -15 }, m: -4, stress: 3, end: "kavga" }, winT: "Yarısı geldi", winP: "“Kalanı için sözüm söz,” dedi. Sözünü artık pek ciddiye almıyorsun.", loseT: "Kapı çarpıldı", loseP: "“Telefon kampanyaydı, sen de hep hesap soruyorsun!” Konuşmuyorsunuz." } }),
            c("Taksit öner", "Şans %70 · yavaş ama sakin", { chance: { p: 0.7, win: { cash: a, rel: { enYakin: 2 }, end: "odedi" }, lose: { m: -3, end: "odemedi" }, winT: "Taksitler tamam", winP: "Dört ay boyunca her ayın 15’inde düzenli yatırdı.", loseT: "İki taksitten sonra kesildi", loseP: "Kalanı bir daha hiç konuşulmadı." } }),
            c("Defteri kapat, bir daha borç verme", "Kırgınlık kalır ama kafan rahat.", { m: -3, rel: { enYakin: -5 }, flag: "borcVermem", end: "odemedi" }),
          ];
        },
      },
    },
  });

  HS.story("l_dugun", {
    when: (s) => local(s) && !HS.inStory(s, "l_borc"),
    minAge: 24,
    maxAge: 45,
    weight: 0.5,
    room: "salon",
    title: (s) => F(s) + " evleniyor!",
    text: (s, h) => {
      const b = done(s, "l_borc");
      const head = "Kapıya simli bir davetiye geldi: " + F(s) + " evleniyor. ";
      if (b === "kavga") return head + "Aranız borç yüzünden bozulalı aylar oldu; davetiyenin arkasına el yazısıyla not düşmüş: “Borcu unutmadım. Gel, konuşalım.”";
      if (b === "odemedi") return head + "Borcunu hâlâ ödemedi, ama düğün şehrin en pahalı salonlarından birinde. Telefonda yine de çok samimi: “Sen olmadan olmaz!”";
      if (b === "odedi" || b === "affetti") return head + "Telefonda sesi titriyor: “Zor günümde yanımdaydın. Seni " + yaver(s) + " olarak istiyorum.”";
      return head + (HS.castRel(s, "enYakin") >= 55 ? "Seni " + yaver(s) + " olarak istiyor." : "Masa numaran bile belli: 7.");
    },
    choices: (s) => {
      const b = done(s, "l_borc");
      const asked = b !== "kavga" && b !== "odemedi" && (b === "odedi" || b === "affetti" || HS.castRel(s, "enYakin") >= 55);
      return [
        asked ? c("Kabul et, " + yaver(s) + " ol", "Onur verici · koşturmaca da cabası", { m: 4, rel: { enYakin: 8 }, stress: 2, set: { rol: 1 }, go: "hazirlik" }) : null,
        b === "kavga" ? c("Git, barışmayı dene", "Gurur mu, dostluk mu?", { esteem: -1, set: { baris: 1 }, go: "gun" }) : c("Davetli olarak git", "Düğünde bir masa, bir takı", { set: { rol: 0 }, go: "gun" }),
        b === "odemedi" ? c("“Takını borçtan düşerim” diye takıl", "Şans %50 · espri mi, hakaret mi?", { chance: { p: 0.5, win: { m: 3, rel: { enYakin: 3 }, set: { takiDus: 1 }, go: "gun" }, lose: { m: -2, rel: { enYakin: -10 }, end: "kirgin" }, winT: "Kahkaha attı", winP: "“Tamam, ödeştik say!” dedi; ilk kez borçtan rahatça bahsettiniz.", loseT: "Telefon sessizleşti", loseP: "“Bunu düğünümde mi konuşacağız?” Davetiye bir anda soğudu." } }) : null,
        c("Bahane bul, gitme", "Masraf yok; ama unutulmaz.", { rel: { enYakin: -10 }, m: -1, people: -1, end: "gitmedi" }),
      ];
    },
    steps: {
      hazirlik: {
        gap: 3,
        title: "Bekârlığa veda",
        text: (s) => "Bekârlığa veda organizasyonu senin üstünde. WhatsApp grubu “" + F(s) + " Son Kez Özgür” adıyla açıldı; herkes fikir atıyor, kimse para göndermiyor.",
        choices: (s, h) => [
          c("Kapadokya’da hafta sonu", h.tl(12000) + " · unutulmaz", { cost: 12000, m: 6, people: 2, rel: { enYakin: 6 }, go: "gun" }),
          c("Evde mütevazı bir gece", h.tl(2500) + " · pizza ve eski fotoğraflar", { cost: 2500, m: 2, rel: { enYakin: 2 }, go: "gun" }),
          c("Sürpriz video derle", "Gece gündüz montaj · gözyaşı garantili", { stress: 3, sleep: 2, sk: { bilgisayar: 0.8 }, rel: { enYakin: 7 }, go: "gun" }),
        ],
      },
      gun: {
        gap: 3,
        title: "Düğün günü",
        text: (s, h) => {
          if (h.d.baris) return "Salona girdiğinde " + F(s) + " seni gördü ve düğün telaşının ortasında bir an durdu. Takı sırası yaklaşıyor.";
          if (h.d.rol) return "Sabahtan beri ayaktasın: kuaför, fotoğrafçı, kayıp kol düğmeleri. " + yaver(s) + " olmak düşündüğünden yorucu ama " + F(s) + " sana her baktığında gülümsüyor.";
          return "Davul zurna, uzun bir masa, tanımadığın akrabalar. Takı sırası yaklaşırken çantanı yokluyorsun.";
        },
        choices: (s, h) => [
          c("Çeyrek altın tak", h.tl(18000) + " · gelenek", { cost: 18000, rel: { enYakin: 4 }, people: 2, m: 3, end: "takti" }),
          c("Zarfa para koy", h.tl(5000) + " · pratik", { cost: 5000, people: 1, m: 2, end: "zarf" }),
          c("Elin boş git, gönlünü getir", "Ay sonu · biraz mahcubiyet", { m: -1, esteem: -2, rel: { enYakin: 1 }, end: "elibos" }),
          h.d.takiDus ? c("“Borçtan düştüm” kartını tak", "Bedava · salon kahkahaya boğulur", { m: 5, people: 2, rel: { enYakin: 2 }, end: "sakaTaki" }) : null,
          h.d.baris ? c("Sarıl, geçmişi geride bırak", "Gurur bir kenara", { m: 6, esteem: 2, rel: { enYakin: 20 }, cost: 5000, end: "baristi" }) : null,
          !s.partner ? c("Bekâr masasında biriyle sohbete dal", h.tl(5000) + " zarf · gece uzayabilir", { cost: 5000, m: 4, esteem: 3, flag: "dugunTanisma", end: "zarf" }) : null,
          h.d.rol ? c("Halayı sen başlat", "Mendil sende · ertesi gün belin ağrır", { cost: 5000, m: 6, h: -1, people: 3, rel: { enYakin: 5 }, end: "halay" }) : null,
        ],
      },
    },
  });

  HS.story("l_ortaklik", {
    when: (s) => local(s) && (done(s, "l_dugun") !== undefined || s.age >= 30) && !HS.inStory(s, "l_dugun") && HS.castRel(s, "enYakin") >= 30,
    minAge: 26,
    maxAge: 52,
    weight: 0.45,
    room: "sokak",
    title: "Ortaklık teklifi",
    text: (s, h) => {
      const b = done(s, "l_borc");
      let t = F(s) + " kendi işini kurmak istiyor: " + ek(s.city, "loc") + " küçük bir kahve kavurma dükkânı. Senden " + h.tl(250000) + " karşılığında %40 ortaklık istiyor. “İş planı hazır, ilk yıl kâra geçeriz.”";
      if (b === "odemedi" || b === "kavga" || b === "yarisi") t += " Borcunu ödemekte ne kadar zorlandığı aklının bir köşesinde.";
      else if (b === "odedi") t += " Borcunu kuruşu kuruşuna ödemişti; sözünün eri biri.";
      if (done(s, "l_dugun") === "gitmedi") t += " Düğününe gitmediğin hâlâ aranızda bir gölge.";
      return t;
    },
    choices: (s, h) => [
      c("Ortak ol", h.tl(250000) + " · %40 hisse", { cost: 250000, stress: 3, rel: { enYakin: 8 }, set: { pay: 250000 }, go: "ilkAy" }),
      c("Küçük bir pay al", h.tl(75000) + " · %10 hisse", { cost: 75000, rel: { enYakin: 3 }, set: { pay: 75000 }, go: "ilkAy" }),
      c("Para yok ama emek var", "Hafta sonları dükkânda · yorgunluk", { stress: 2, h: -1, rel: { enYakin: 5 }, set: { pay: 0, emek: 1 }, go: "ilkAy" }),
      c("Reddet", "Arkadaşlık ve para ayrı kalsın.", { rel: { enYakin: -4 }, sk: { finans: 0.5 }, end: "reddetti" }),
    ],
    steps: {
      ilkAy: {
        gap: 8,
        title: "Dükkânın ilk ayları",
        text: (s) => "Dükkân açıldı. Kavurma makinesinin kokusu sokağı sardı ama kasa beklenen kadar dolmuyor. " + F(s) + " gece 1’de mesaj atıyor: “Sosyal medya şart, ne dersin?”",
        choices: (s, h) => [
          c("Sosyal medya hesabını sen yönet", "Akşamların gider · satış artabilir", { stress: 3, sk: { pazarlama: 1, bilgisayar: 0.5 }, set: { emek: 1 }, go: "karne" }),
          c("Ek sermaye koy", h.tl(50000) + " · nefes aldırır", { cost: 50000, set: { ek: 1 }, go: "karne" }),
          c("Rakamlara uzaktan bak", "Kendi hayatına dön.", { stress: -1, go: "karne" }),
        ],
      },
      karne: {
        gap: 10,
        title: "Birinci yıl karnesi",
        text: (s) => F(s) + " defteri önüne koydu. Toptan satış anlaşmaları umut verici ama kira iki kez zamlandı. Kararlar şimdi verilecek.",
        choices: (s, h) => {
          const pay = h.d.pay || 0;
          const p = 0.42 + (h.d.emek ? 0.15 : 0) + (h.d.ek ? 0.1 : 0);
          return [
            c("Devam, büyümeye oyna", "Şans %" + Math.round(p * 100), { chance: { p, win: { cash: Math.round(pay * 0.5), m: 6, rel: { enYakin: 6 }, end: "kazandi" }, lose: { m: -6, stress: 5, rel: { enYakin: -6 }, end: "batti" }, winT: "Kahve tuttu", winP: "Üç kafeyle toptan anlaşma yapıldı; ilk kâr payı yattı.", loseT: "Kepenk indi", loseP: "Kira ve borçlar yetişmedi; makine yarı fiyatına satıldı." } }),
            pay > 0 ? c("Hisseni sat, çık", "Paranın çoğu geri döner", { cash: Math.round(pay * 0.85), rel: { enYakin: -5 }, end: "cikti" }) : c("Kenara çekil", "Emeğin kalır; ortaklık biter.", { rel: { enYakin: -2 }, end: "cikti" }),
          ];
        },
      },
    },
  });

  HS.story("l_gurbet", {
    when: (s) => local(s) && !HS.inStory(s, "l_ortaklik") && done(s, "l_ortaklik") !== "kazandi" && done(s, "l_ortaklik") !== "cikti" && (done(s, "l_ortaklik") !== undefined || s.age >= 33) && HS.castRel(s, "enYakin") >= 25,
    minAge: 26,
    maxAge: 55,
    weight: 0.45,
    room: "sokak",
    title: (s) => F(s) + " gidiyor",
    text: (s) => {
      const city = F(s).length % 2 ? "Berlin" : "Amsterdam";
      const o = done(s, "l_ortaklik");
      if (o === "batti") return "Dükkân kapandıktan sonra " + F(s) + " toparlanamadı. Şimdi " + ek(city, "loc") + " bir lojistik şirketinden teklif almış: “Burada sıfırdan başlayamam, orada başlarım.”";
      if (o === "reddetti") return F(s) + " dükkânı tek başına açamadı ve başka bir kapı aradı: " + ek(city, "dat") + " gidiyor. “Belki de sen haklıydın,” diyor, gülerek ama gözleri dolu.";
      return F(s) + " haberi bir çay bahçesinde verdi: " + ek(city, "loc") + " bir iş bulmuş, iki ay sonra uçuyor. Yıllardır her hafta gördüğün yüz artık ekranda olacak.";
    },
    choices: (s, h) => [
      c("Veda partisi düzenle", h.tl(4000) + " · herkes toplansın", { cost: 4000, people: 2, m: 2, rel: { enYakin: 8 }, flag: "enYakinGurbet", go: "ozlem" }),
      c("Havalimanına kadar götür", "Sabah 4’te kalkış · son sarılma", { sleep: 2, m: -2, rel: { enYakin: 6 }, flag: "enYakinGurbet", go: "ozlem" }),
      c("Kırgınlığını belli et", "“Herkes gidiyor zaten.”", { m: -3, rel: { enYakin: -6 }, flag: "enYakinGurbet", end: "kus" }),
    ],
    steps: {
      ozlem: {
        gap: 8,
        title: "Ekrandaki yüz",
        text: (s) => {
          const city = F(s).length % 2 ? "Berlin" : "Amsterdam";
          return "Görüntülü konuşmada " + F(s) + " zayıflamış görünüyor. “Burada herkes kibar ama kimse çaya çağırmıyor. Bir hafta gel; kanepe senin, " + city + " benden.”";
        },
        choices: (s, h) => [
          c("Bilet al, git", h.tl(40000) + " · uçak, vize ve harçlık", { cost: 40000, m: 8, stress: -4, rel: { enYakin: 10 }, flag: "yurtdisiZiyaret", end: "ziyaret" }),
          c("Her pazar görüntülü konuşma sözü", "Ucuz ama uzak", { m: 1, rel: { enYakin: 3 }, end: "uzaktan" }),
          c("Mesajlar seyrekleşsin", "Hayat akıyor.", { people: -1, rel: { enYakin: -8 }, end: "koptu" }),
        ],
      },
    },
  });

  // =====================================================================
  // LİSE ARKADAŞI ZİNCİRİ: 10. yıl buluşması → iş referansı → saadet zinciri
  // =====================================================================
  HS.story("l_mezuniyet", {
    when: (s) => local(s),
    minAge: 26,
    maxAge: 31,
    weight: 0.55,
    room: "salon",
    title: "Lise 10. yıl buluşması",
    text: (s, h) => L(s) + " WhatsApp’ta “12-C Efsaneleri” grubunu kurdu; 34 kişi eklendi, bildirimler susmuyor. Ay sonunda bir restoranda 10. yıl buluşması var: kişi başı " + h.tl(2500) + ". Gruba şimdiden eski sınıf fotoğrafları düşmeye başladı.",
    choices: (s, h) => [
      c("Katıl", h.tl(2500) + " · nostalji", { cost: 2500, set: { org: 0 }, go: "gece" }),
      c("Organizasyonu üstlen", h.tl(2500) + " · stres ama herkes seni hatırlar", { cost: 2500, stress: 4, sk: { iletisim: 1 }, rel: { liseArk: 8 }, set: { org: 1 }, go: "gece" }),
      c("Grubu sessize al", "Geçmiş geçmişte kalsın.", { m: -1, people: -1, rel: { liseArk: -3 }, end: "gitmedi" }),
    ],
    steps: {
      gece: {
        gap: 3,
        title: "Herkes ne iş yapıyor?",
        text: (s) => {
          const job = working(s) ? HS.JOBS[s.job].name.toLocaleLowerCase("tr-TR") : null;
          return "Masada aynı soru dönüp duruyor: “Sen ne yapıyorsun şimdi?” Biri doktor olmuş, biri iki çocuk babası, biri hâlâ aynı mahallede. " + (job ? "Sıra sana geldi; sen " + job + " olarak çalışıyorsun." : "Sıra sana geldi; şu an bir işin yok.") + (s.partner ? "" : " Lisedeki platonik aşkın da karşı masada.");
        },
        choices: (s, h) => [
          c("Başarılarını biraz abart", "Özgüven + · bir gün geri dönebilir", { esteem: 3, m: 2, people: 1, flag: "liseAbartti", end: "parladi" }),
          c("Dürüst ol, gülerek anlat", "Samimiyet kazandırır", { esteem: 1, m: 3, rel: { liseArk: 5 }, end: "samimi" }),
          !s.partner ? c("Platonik aşkınla sohbet et", "Şans %40 · on yıllık cesaret", { chance: { p: 0.4, win: { m: 6, esteem: 4, flag: "flort", end: "samimi" }, lose: { m: -3, esteem: -3, end: "samimi" }, winT: "On yıl sonra ilk kahkaha", winP: "Numara alışverişi yapıldı; “bir kahve içeriz” dendi.", loseT: "Yüzük parmağında", loseP: "Meğer nişanlıymış. Lafı hava durumuna getirdin." } }) : null,
          h.d.org ? c("Kapanış konuşması yap", "Sahne senin · sesin titreyebilir", { esteem: 4, people: 3, sk: { sunum: 0.5 }, rel: { liseArk: 5 }, end: "parladi" }) : null,
          c("Erkenden kaç", "Kıyaslanmaya gelmedin.", { m: -2, esteem: -1, end: "kacti" }),
        ],
      },
    },
  });

  HS.story("l_referans", {
    when: (s) => local(s) && working(s) && s.jobWeeks > 20 && s.job !== "music",
    minAge: 22,
    maxAge: 50,
    weight: 0.5,
    room: "is",
    title: (s) => L(s) + " iş arıyor",
    text: (s) => {
      const co = s.company && HS.co(s.company) ? HS.co(s.company).name : "senin çalıştığın yer";
      const m = done(s, "l_mezuniyet");
      let t = L(s) + " aradı. Bir süredir işsizmiş; " + co + " için referans olmanı istiyor.";
      if (m === "parladi") t += " “Buluşmada anlattıklarından sonra aklıma ilk sen geldin; orada sözün geçiyor, değil mi?” Buluşmada biraz abartmış olabilirsin.";
      else if (m === "samimi") t += " “Buluşmada içten konuşmuştun, sana güveniyorum,” diyor.";
      else t += " Liseden beri pek görüşmemiştiniz ama sesi gerçekten çaresiz.";
      return t;
    },
    choices: (s) => [
      c("Referans ol", "İmzan altında · riskli ama sıcak", { rel: { liseArk: 8 }, set: { ref: 1 }, go: "ise" }),
      c("CV’sini ilet, kefil olma", "Ortası", { rel: { liseArk: 2 }, set: { ref: 0 }, go: "ise" }),
      c("“Bizde alım yok” de", "Sorumluluk almazsın.", { rel: { liseArk: -6 }, m: -1, end: "reddetti" }),
    ],
    steps: {
      ise: {
        gap: 5,
        when: (s) => working(s),
        title: "Mülakat sonucu",
        text: (s) => "İnsan kaynaklarından biri koridorda yanına geldi: “" + L(s) + " senin arkadaşın mı? Bugün mülakattaydı.”",
        choices: (s, h) => [
          c("“Çok çalışkandır” de", "Şans %" + (h.d.ref ? 70 : 45), { chance: { p: h.d.ref ? 0.7 : 0.45, win: { rel: { liseArk: 10 }, m: 2, go: "performans" }, lose: { rel: { liseArk: -2 }, m: -1, end: "alinmadi" }, winT: "İşe alındı", winP: L(s) + " seni arayıp ağlayarak teşekkür etti.", loseT: "Olmadı", loseP: "Başka bir aday tercih edildi; " + L(s) + " sesini çıkarmadı." } }),
          c("“Liseden tanırım, o kadar” de", "Sorumluluk azalır", { chance: { p: 0.35, win: { go: "performans" }, lose: { rel: { liseArk: -5 }, end: "alinmadi" }, winT: "Yine de alındı", winP: "Mülakatı iyi geçmiş.", loseT: "Alınmadı", loseP: "Senin çekingen tavrın da duyulmuş." } }),
        ],
      },
      performans: {
        gap: 8,
        when: (s) => working(s),
        title: "Aynı çatı altında",
        text: (s) => L(s) + " artık seninle aynı yerde çalışıyor. İlk haftalar iyiydi ama son zamanlarda geç geliyor, öğle arası uzuyor. Yöneticin “Senin arkadaşın,” diye sana bakıyor.",
        choices: (s) => [
          c("Ona mentorluk yap", "Şans %60 · zamanından çalar", { stress: 2, chance: { p: 0.6, win: { perf: 3, rel: { liseArk: 6 }, sk: { iletisim: 1 }, end: "parladi" }, lose: { perf: -3, stress: 3, end: "basagridi" }, winT: "Toparladı", winP: "Üç ay sonra ayın çalışanı seçildi; ilk tebriği sana yaptı.", loseT: "Değişmedi", loseP: "Sen anlattıkça o savunmaya geçti; adın onunla birlikte anılıyor." } }),
          c("Mesafeni koru", "Herkes kendi işinden sorumlu", { chance: { p: 0.55, win: { end: "normal" }, lose: { perf: -2, rel: { liseArk: -4 }, end: "basagridi" }, winT: "Kendi yolunu buldu", winP: "Aranız soğudu ama işler yolunda.", loseT: "Laf sana da sıçradı", loseP: "Toplantıda “referans verirken dikkat edelim” dendi." } }),
          c("Yöneticine açıkça söyle", "Dürüstlük · arkadaşlık biter", { perf: 2, rel: { liseArk: -15 }, m: -2, end: "ispik" }),
        ],
      },
    },
  });

  HS.story("l_saadet", {
    when: (s) => local(s) && !HS.inStory(s, "l_referans") && done(s, "l_referans") !== "ispik",
    minAge: 22,
    maxAge: 55,
    weight: 0.45,
    room: "sokak",
    title: "“Bir kahve içelim mi?”",
    text: (s, h) => {
      const r = done(s, "l_referans");
      let t = L(s) + " aylar sonra aradı, kahveye çağırdı. Laf dolandı, dolandı ve çantadan tablet çıktı: “Altın Yaşam” diye bir takviye şirketi, “kendi işinin patronu olma” fırsatı. Başlangıç paketi " + h.tl(18000) + "; altına iki kişi getirirsen paran çıkarmış.";
      if (r === "parladi" || r === "normal" || r === "basagridi") t += " Senin referansınla girdiği işten de ayrılmış: “Maaşa mahkûm değilim artık!”";
      return t;
    },
    choices: (s, h) => [
      c("Katıl", h.tl(18000) + " · belki gerçekten tutar", { cost: 18000, m: 2, esteem: 2, go: "alt" }),
      c("Bir kutu ürün al, kırma", h.tl(2500) + " · vitamin de lazımdı zaten", { cost: 2500, rel: { liseArk: 3 }, end: "urunAldi" }),
      c("“Bu piramit” de", "Açık sözlülük · arkadaşlık soğur", { rel: { liseArk: -10 }, esteem: 2, sk: { finans: 1 }, end: "reddetti" }),
    ],
    steps: {
      alt: {
        gap: 4,
        title: "Altına kimi yazacaksın?",
        text: (s) => {
          const gone = s.flags.enYakinGurbet;
          return "“Liderlik semineri”nde salonda yüzlerce kişi alkışladı: “En yakınlarınızdan başlayın!” " + L(s) + " sana dönüp " + ek(F(s), "acc") + " soruyor." + (gone ? " “Yurt dışında mı? Daha iyi, Avrupa’ya da göndeririz!”" : "");
        },
        choices: (s) => [
          c(ek(F(s), "acc") + " ikna et", "Şans %45 · dostluk riske girer", { chance: { p: 0.45, win: { cash: 6000, rel: { enYakin: -4 }, set: { yazdi: 1 }, go: "cokus" }, lose: { rel: { enYakin: -12 }, m: -3, go: "cokus" }, winT: "Kaydoldu", winP: F(s) + " gönülsüzce kartını uzattı. İlk primin yattı.", loseT: "“Sen de mi?”", loseP: F(s) + " sana öyle bir baktı ki konuyu kapattın." } }),
          c("Sosyal medyadan sat", "Takipçi kaybedersin, birkaç satış", { stress: 3, people: -1, cash: 3000, go: "cokus" }),
          c("Ürünler koridorda kalsın", "Zararı kabullen.", { m: -3, end: "zarar" }),
        ],
      },
      cokus: {
        gap: 6,
        title: "Altın Yaşam’a soruşturma",
        text: (s) => "Akşam haberlerinde tanıdık bir logo: “Altın Yaşam” hakkında saadet zinciri soruşturması başlatılmış, hesaplara el konmuş. " + L(s) + " telefonlara çıkmıyor; evdeki koliler sana bakıyor.",
        choices: (s, h) => [
          c("Ürünleri ucuza elden çıkar", "Bir kısmını kurtar", { cash: 5000, m: -2, end: "zarar" }),
          c("Şikâyetçi ol", "Şans %40 · iade belki", { stress: 4, rel: { liseArk: -15 }, chance: { p: 0.4, win: { cash: 12000, sk: { finans: 1 }, end: "iade" }, lose: { m: -3, end: "zarar" }, winT: "Kısmi iade", winP: "Tüketici hakem heyeti paranın bir kısmını geri aldırdı.", loseT: "Dosya uzadıkça uzadı", loseP: "Avukat “yıllar sürer” dedi." } }),
          c(ek(L(s), "acc") + " ara, moral ver", "O da kandırılmış", { rel: { liseArk: 10 }, m: -1, end: "zarar" }),
          h.d.yazdi ? c(ek(F(s), "dat") + " özür dile, parasını öde", h.tl(18000) + " · vicdan", { cost: 18000, rel: { enYakin: 15 }, m: 2, esteem: 2, end: "ozur" }) : null,
        ],
      },
    },
  });

  // =====================================================================
  // ROMANTİZM (bekârken: yalnızca flört; ilişkideyken: tatil, ortak hesap, ev işleri)
  // =====================================================================
  HS.story("l_flort", {
    when: (s) => !s.partner && local(s),
    minAge: 20,
    maxAge: 42,
    weight: 0.5,
    room: "yatak",
    title: "Flört uygulaması",
    text: (s) => {
      if (s.flags.dugunTanisma) return "Düğünde bekâr masasında sohbet ettiğin kişi Instagram’dan takip isteği gönderdi. " + F(s) + " hemen yorum yaptı: “Bırak uygulamaları, buna yaz!”";
      return F(s) + " telefonunu elinden aldı ve flört uygulamasında profil açtı: “Bu fotoğraflar olmaz, biri seni pasaport fotoğrafından tanıyacak.” Bir haftada on iki eşleşme, iki anlamlı mesaj.";
    },
    choices: (s, h) => [
      s.flags.dugunTanisma ? c("Düğündeki kişiye yaz", "Ortak tanıdık güven verir", { esteem: 1, set: { kanal: "dugun" }, go: "bulusma" }) : null,
      c("Uygulamada şansını dene", h.tl(1200) + " premium üyelik · daha çok eşleşme", { cost: 1200, esteem: 1, set: { kanal: "app" }, go: "bulusma" }),
      c("Arkadaş ortamında tanışmayı seç", ek(F(s), "dat") + " güven", { people: 1, rel: { enYakin: 2 }, set: { kanal: "tanidik" }, go: "bulusma" }),
      c("Şu an kendime odaklanıyorum", "Özgüven + · biraz yalnızlık", { esteem: 2, m: -1, end: "odak" }),
    ],
    steps: {
      bulusma: {
        gap: 2,
        when: (s) => !s.partner,
        title: "İlk buluşma",
        text: (s, h) => (h.d.kanal === "app" ? "Uygulamadaki eşleşmeyle bir kafede buluşacaksın. Profil fotoğrafları biraz filtreli gibiydi; birazdan göreceksin." : h.d.kanal === "dugun" ? "Düğünden tanıdığın kişiyle buluşuyorsunuz. En azından konuşacak ortak bir konu var: " + F(s) + "." : F(s) + " bir arkadaşını getirdi, sonra “benim işim var” deyip ortadan kayboldu. Çok belli etti."),
        choices: (s, h) => {
          const p = h.d.kanal === "dugun" ? 0.6 : h.d.kanal === "app" ? 0.4 : 0.5;
          const ch = (pp) => ({ p: pp, win: { m: 6, esteem: 4, flag: "flort", go: "ikinci" }, lose: { m: -3, esteem: -3, end: "kotuIlk" }, winT: "Saatler su gibi aktı", winP: "Kafe kapanırken hâlâ konuşuyordunuz.", loseT: "Kimya yok", loseP: h.d.kanal === "app" ? "Profil fotoğrafı beş yıl önceymiş; sohbet de öyle." : "Sohbet kripto paraya ve eski sevgiliye kilitlendi." });
          return [
            c("Sade bir kahve", h.tl(800) + " · Şans %" + Math.round(p * 100), { cost: 800, chance: ch(p) }),
            c("Şık bir akşam yemeği", h.tl(3500) + " · Şans %" + Math.round((p + 0.1) * 100), { cost: 3500, chance: ch(p + 0.1) }),
            c("Son anda iptal et", "Kalbin hızlı attı.", { esteem: -2, m: -1, end: "iptal" }),
          ];
        },
      },
      ikinci: {
        gap: 3,
        when: (s) => !s.partner,
        title: "“Görüldü”",
        text: "İkinci buluşma harikaydı. Sonra mesajlar seyreldi; iki gündür son mesajının altında yalnızca “görüldü” yazıyor.",
        choices: (s, h) => [
          c("Açık açık sor: “Ne istiyoruz?”", "Şans %50 · netlik", { chance: { p: 0.5, win: { m: 4, esteem: 3, end: "devam" }, lose: { m: -3, esteem: 1, end: "arkadas" }, winT: "“Yavaş gidelim ama gidelim”", winP: "Hafta sonu için plan yapıldı.", loseT: "Sadece arkadaş", loseP: "“Seni çok seviyorum ama öyle değil.” Kırık ama net." } }),
          c("Konser bileti al, sürpriz yap", h.tl(3000) + " · Şans %50", { cost: 3000, chance: { p: 0.5, win: { m: 7, esteem: 4, end: "devam" }, lose: { m: -5, esteem: -4, end: "ghost" }, winT: "Gözleri parladı", winP: "Konserde elini tuttu.", loseT: "Cevap gelmedi", loseP: "Bilet ekran görüntüsü “görüldü”de kaldı." } }),
          c("Sen de sessiz kal", "Gurur korunur.", { m: -2, end: "ghost" }),
        ],
      },
    },
  });

  HS.story("l_tatil", {
    when: (s) => !!s.partner && local(s),
    minAge: 20,
    maxAge: 68,
    weight: 0.55,
    room: "salon",
    title: (s) => ek(P(s), "with") + " tatil planı",
    text: (s, h) => {
      let t = "Yaz yaklaşıyor. " + P(s) + " telefonda üç sekme açmış: Kaş’ta bir pansiyon (" + h.tl(30000) + "), Kapadokya’da balon turu (" + h.tl(38000) + ") ve vizesiz bir Balkan turu (" + h.tl(55000) + "). “Sen seç,” diyor ama gözü belli bir sekmede.";
      if (done(s, "l_ortakHesap") === "ortak") t += " Ortak hesapta tatil için biriken para da var.";
      return t;
    },
    choices: (s, h) => [
      c("Kaş: deniz ve sessizlik", h.tl(30000), { cost: 30000, bond: 3, set: { yer: "Kaş" }, go: "yolda" }),
      c("Kapadokya: balon ve fotoğraf", h.tl(38000), { cost: 38000, bond: 4, set: { yer: "Kapadokya" }, go: "yolda" }),
      c("Balkan turu: üç ülke, bir otobüs", h.tl(55000), { cost: 55000, bond: 5, m: 2, set: { yer: "Balkan" }, go: "yolda" }),
      c("Bu yıl tatil yok, birikim yapalım", "Akıllıca ama tatsız", { bond: -4, m: -2, sk: { finans: 0.5 }, end: "iptal" }),
    ],
    steps: {
      yolda: {
        gap: 6,
        when: (s) => !!s.partner,
        title: (s, h) => (h.d.yer === "Balkan" ? "Balkan turu" : (h.d.yer || "Kaş") + " tatili"),
        text: (s, h) =>
          h.d.yer === "Kaş"
            ? "Üçüncü gün. Deniz masmavi ama pansiyon sahibinin “beş dakika” dediği koy, yokuş yukarı kırk dakika çıktı. " + P(s) + " terli ama gülüyor."
            : h.d.yer === "Kapadokya"
              ? "Sabah 4’te kalktınız; rüzgâr yüzünden balonlar uçmadı. Yarın tekrar denenecek ama otel bir gece daha istiyor."
              : "Otobüs sınır kapısında dört saat bekledi. Rehber Üsküp’te serbest zaman verdi; " + P(s) + " haritayı sana uzattı.",
        choices: (s, h) => [
          c("Planı bırak, akışına git", "Rahatla", { bond: 6, m: 6, stress: -6, end: "guzel" }),
          c("Her günü dakika dakika programla", "Şans %50", { chance: { p: 0.5, win: { bond: 4, m: 4, end: "guzel" }, lose: { bond: -5, trust: -2, stress: 3, end: "gergin" }, winT: "Her şey yolunda", winP: "Programın sayesinde hiçbir şeyi kaçırmadınız.", loseT: "“Tatil mi bu, kamp mı?”", loseP: "Akşam yemeğinde sessizlik." } }),
          working(s) ? c("Arada iş maillerine bak", "Performans + · bağ −", { perf: 2, bond: -6, end: "gergin" }) : null,
          !s.partner.married && s.partner.bond >= 60 ? c("Gün batımında geleceği konuş", "Şans %55 · büyük konu", { chance: { p: 0.55, win: { bond: 10, trust: 5, m: 6, flag: "tatilSoz", end: "soz" }, lose: { bond: -4, m: -3, end: "erken" }, winT: "Gözler doldu", winP: "“Evet, ben de seninle yaşlanmak istiyorum.”", loseT: "Biraz erken", loseP: "“Şimdi mi konuşacağız bunu?” Güneş battı, konu da." } }) : null,
        ],
      },
    },
  });

  HS.story("l_ortakHesap", {
    when: (s) => !!s.partner && local(s) && (s.partner.married || s.housing !== "aile"),
    minAge: 22,
    maxAge: 70,
    weight: 0.45,
    room: "mutfak",
    title: "Ortak hesap tartışması",
    text: (s) => P(s) + " kahvesini masaya koydu: “Her ay kim neyi ödedi diye hesap tutmaktan yoruldum. Ortak bir hesap açalım; ikimiz de maaşın yarısını yatıralım, ev giderleri oradan.”",
    choices: (s) => [
      c("Ortak hesap aç", "Güven + · kontrol azalır", { trust: 5, bond: 3, sk: { finans: 0.5 }, set: { tip: "ortak" }, go: "surpriz" }),
      c("Yalnızca faturalar için", "Orta yol", { trust: 2, set: { tip: "fatura" }, go: "surpriz" }),
      c("Herkes kendi parasını yönetsin", "Bağımsızlık · biraz kırgınlık", { trust: -4, bond: -2, m: 1, end: "ayri" }),
    ],
    steps: {
      surpriz: {
        gap: 8,
        when: (s) => !!s.partner,
        title: "Hesap ekstresi",
        text: (s, h) =>
          h.d.tip === "ortak"
            ? "Ortak hesabın ekstresinde " + h.tl(14000) + " tutarında bir harcama var. " + P(s) + " kardeşine, haber vermeden para göndermiş. “Acil durumdu,” diyor."
            : "Faturalar otomatik ödeniyor; bu ay ilk kez ay sonunda kimse “elektriği sen mi ödedin?” diye sormadı. " + P(s) + " şimdi birikimi de eklemeyi öneriyor.",
        choices: (s, h) =>
          h.d.tip === "ortak"
            ? [
                c("Sorun etme", "Aile bu, olur", { trust: 3, m: -2, end: "ortak" }),
                c("Haber verme kuralı koyalım", "Şans %60", { chance: { p: 0.6, win: { trust: 2, bond: 2, sk: { finans: 1 }, end: "ortak" }, lose: { trust: -5, bond: -4, stress: 3, end: "gergin" }, winT: "Anlaştınız", winP: "Küçük harcamalar serbest, büyükler önce konuşulacak; buzdolabına yazıp astınız.", loseT: "“Bana güvenmiyor musun?”", loseP: "Konu paradan çıktı, güvene geldi." } }),
                c("Hesabı kapat", "Kendi paran, kendi kararın", { trust: -8, bond: -4, end: "ayri" }),
              ]
            : [
                c("Birikimi de ekleyelim", "Birlikte hedef", { trust: 3, bond: 2, sk: { finans: 0.5 }, end: "ortak" }),
                c("Böyle iyi, kurcalamayalım", "Huzur", { m: 2, end: "fatura" }),
              ],
      },
    },
  });

  HS.story("l_evIsleri", {
    when: (s) => !!s.partner && local(s) && s.housing !== "aile",
    minAge: 20,
    maxAge: 75,
    weight: 0.5,
    room: "mutfak",
    title: "Ev işleri kimde?",
    text: (s) => {
      let t = "Lavabo yine taştı. " + P(s) + " buzdolabına bir çizelge astı: çamaşır, bulaşık, çöp, banyo. Her satırda bir isim var; senin adının karşısı boş.";
      if (done(s, "l_ortakHesap") === "ortak" && !s.items.includes("bulasik")) t += " Altına küçük bir not düşmüş: “Ortak hesaptan bulaşık makinesi?”";
      if (done(s, "l_tatil") === "gergin") t += " Tatildeki gerginlik de hâlâ havada.";
      return t;
    },
    choices: (s, h) => [
      c("Çizelgeyi imzala", "Disiplin ister", { stress: 2, bond: 4, trust: 3, sk: { disiplin: 0.5 }, set: { plan: "cizelge" }, go: "takip" }),
      !s.items.includes("bulasik") ? c("Bulaşık makinesi al", h.tl(21000) + " · sorunun yarısı biter", { cost: 21000, itemGive: "bulasik", bond: 3, stress: -3, set: { plan: "makine" }, go: "takip" }) : null,
      c("İki haftada bir temizlik desteği", h.tl(4000) + " her gelişte", { cost: 4000, bond: 2, stress: -2, set: { plan: "destek" }, go: "takip" }),
      c("“Ben zaten yapıyorum!”", "Savunma · tartışma", { bond: -5, trust: -3, set: { plan: "inat" }, go: "takip" }),
    ],
    steps: {
      takip: {
        gap: 5,
        when: (s) => !!s.partner,
        title: "Bir ay sonra",
        text: (s, h) =>
          ({
            cizelge: "İlk iki hafta harikaydı. Üçüncü hafta çöp gecesi kaçtı ve apartman merdiveni koktu. " + P(s) + " çizelgeye kırmızı kalemle bir çarpı attı.",
            makine: "Makine bulaşığı çözdü ama şimdi de makineyi kimin boşaltacağı tartışılıyor. Evet, gerçekten.",
            destek: "Temizlik desteği düzenli geliyor; ev pırıl pırıl. Ama ay sonu bütçe tablosunda o satır göze batıyor.",
            inat: "Bir aydır ev işleri konusu açılmadı; bu iyi bir işaret değil. " + P(s) + " artık sadece kendi tabağını yıkıyor.",
          })[h.d.plan] || "Ev düzeni yeniden konuşuluyor.",
        choices: (s, h) => [
          c("Telafi et, bir de çiçek al", h.tl(600), { cost: 600, bond: 5, trust: 2, end: "duzen" }),
          h.d.plan === "destek" ? c("Desteğe devam", h.tl(8000) + " aylık", { cost: 8000, stress: -3, end: "destek" }) : null,
          c("Sistemi esnet, konuşarak çöz", "Şans %55", { chance: { p: 0.55, win: { bond: 3, sk: { iletisim: 0.5 }, end: "duzen" }, lose: { bond: -4, stress: 2, end: "surtusme" }, winT: "Uzlaştınız", winP: "Herkes sevdiği işi aldı: sen bulaşık, " + P(s) + " çamaşır.", loseT: "Yine kim haklı tartışması", loseP: "Çizelge yerinde ama kimse bakmıyor." } }),
          c("“Kim kaçırdı” tartışmasına gir", "Haklı çıkabilirsin; kazanamazsın", { bond: -6, trust: -2, stress: 4, end: "kavga" }),
        ],
      },
    },
  });

  // =====================================================================
  // AİLE: annenin sağlığı, babanın kafe hayali, kardeşin üniversitesi, tarif defteri
  // =====================================================================
  const anneOf = (s) => kin(s, ["anne"])[0];
  HS.story("l_anneSaglik", {
    when: (s) => local(s) && anneOf(s) && kAge(s, anneOf(s)) >= 50,
    minAge: 24,
    weight: 0.5,
    room: "salon",
    title: "Annenden tedirgin bir telefon",
    text: (s) => {
      const a = anneOf(s);
      return "Annen " + a.name + ": “Bir şey yok, merak etme… Sadece merdiven çıkınca göğsüm sıkışıyor, sol kolum da uyuşuyor.” Sesi her zamankinden kısık." + (a.city && a.city !== s.city ? " Aranızda kilometreler var." : "");
    },
    choices: (s, h) => {
      const a = anneOf(s);
      const sib = kin(s, ["kardesK", "kardesE", "abla", "abi"])[0];
      return [
        c("MHRS’den kardiyoloji randevusu al", "Ücretsiz · birkaç hafta bekleme", { stress: 2, set: { kid: a.id, yol: "devlet" }, go: "tahlil" }),
        c("Hemen özel hastaneye götür", h.tl(7500) + " · muayene ve EKG", { cost: 7500, kinBond: { id: a.id, v: 6 }, set: { kid: a.id, yol: "ozel" }, go: "tahlil" }),
        c("Bekleme, acile git", "Saatlerce kuyruk · içi rahat eder", { stress: 4, sleep: 2, kinBond: { id: a.id, v: 4 }, set: { kid: a.id, yol: "acil" }, go: "tahlil" }),
        sib ? c(ek(sib.name, "dat") + " haber ver, o götürsün", "Sen yükü paylaşırsın; annen bozulur", { kinBond: { id: a.id, v: -4 }, m: -1, set: { kid: a.id, yol: "kardes", sib: sib.name }, go: "tahlil" }) : null,
      ];
    },
    steps: {
      tahlil: {
        gap: 2,
        when: (s, d) => !!kinById(s, d.kid),
        title: "Sonuçlar geldi",
        text: (s, h) => {
          const yol = { devlet: "Randevu üç hafta sonraya çıkmıştı; bekleme salonunda annen tespihini hiç bırakmadı. ", ozel: "Özel hastanede her şey bir günde yapıldı. ", acil: "Acilde altı saat beklediniz; sonunda kardiyolog geldi. " };
          const pre = h.d.yol === "kardes" ? (h.d.sib || "Kardeşin") + " götürdü, sonuçları sana telefonda okudu. " : yol[h.d.yol] || "";
          let t = pre + "Anjiyo yapıldı: bir damarda ciddi darlık var, stent takılması gerekiyor. Hastane ameliyat öncesi ailenin kan bağışı yapmasını istiyor.";
          if (s.flags.kanBagisci) t += " Neyse ki sen zaten düzenli bağışçısın; kan merkezindekiler seni tanıyor.";
          return t;
        },
        choices: (s, h) => [
          c("Devlet hastanesinde stent, sırayı bekle", "Ücretsiz · iki hafta kaygı", { stress: 5, go: "bakim" }),
          c("Özel hastane farkını öde", h.tl(85000) + " · bu hafta ameliyat", { cost: 85000, stress: -2, kinBond: { id: h.d.kid, v: 8 }, go: "bakim" }),
          s.flags.kanBagisci || done(s, "l_kanBagisi") === "paylasti"
            ? c("Bağışçı çevrenden destek iste", "Mahalle grubu seferber olur", { people: 3, m: 3, rel: { komsu: 4 }, kinBond: { id: h.d.kid, v: 5 }, go: "bakim" })
            : c("Kan için sosyal medyada çağrı yap", "Tanımadığın insanlar gelir", { people: 1, m: 2, stress: 2, go: "bakim" }),
        ],
      },
      bakim: {
        gap: 3,
        when: (s, d) => !!kinById(s, d.kid),
        title: "İyileşme dönemi",
        text: (s) => "Ameliyat iyi geçti. Doktor üç ay dinlenme, tuzsuz yemek ve her gün yürüyüş dedi. Annen ise ilk günden mutfağa girmeye çalışıyor.",
        choices: (s, h) => {
          const baba = kin(s, ["baba"])[0];
          return [
            working(s) ? c("İzin al, yanında kal", "Performans − · annen mutlu", { perf: -4, stress: 3, m: 2, kinBond: { id: h.d.kid, v: 10 }, end: "yaninda" }) : c("Yanına taşın, bir süre kal", "Kendi düzenin bozulur", { stress: 3, m: 2, kinBond: { id: h.d.kid, v: 10 }, end: "yaninda" }),
            c("Gündüz bakıcı tut", h.tl(25000) + " · bir aylık", { cost: 25000, kinBond: { id: h.d.kid, v: 3 }, stress: -2, end: "bakici" }),
            c("Yürüyüş ve diyet programı hazırla", "Her akşam telefonla takip", { sk: { ilkyardim: 0.5, disiplin: 0.5 }, kinBond: { id: h.d.kid, v: 6 }, flag: "anneKalp", end: "program" }),
            baba ? c("Babanla nöbetleşin", "Yük paylaşılır · baban da yorulur", { kinBond: { id: baba.id, v: 6 }, stress: 1, end: "nobet" }) : null,
          ];
        },
      },
    },
  });

  const babaOf = (s) => kin(s, ["baba"])[0];
  HS.story("l_babaKafe", {
    when: (s) => local(s) && babaOf(s) && kAge(s, babaOf(s)) >= 56 && kAge(s, babaOf(s)) <= 72 && !HS.inStory(s, "l_anneSaglik"),
    minAge: 22,
    weight: 0.45,
    room: "ziyaret",
    title: "Babanın kafe hayali",
    text: (s, h) => {
      const b = babaOf(s);
      let t = "Baban " + b.name + " emekli ikramiyesini masaya koyar gibi konuştu: “Otuz yıl başkası için çalıştım. Mahallede bir kafe açacağım: tost, çay, tavla. Sen de hafta sonları yardım edersin.”";
      if (anneOf(s)) t += " Annen arkada başını iki yana sallıyor.";
      if (done(s, "l_ortaklik") === "batti") t += " Senin kahve dükkânı maceranı biliyor: “Siz beceremediniz ama ben esnaf çocuğuyum,” diye takıldı.";
      if (s.flags.anneKalp) t += " Annenin kalp ameliyatından sonra evde gerginlik istemiyorsun.";
      return t;
    },
    choices: (s, h) => {
      const b = babaOf(s);
      return [
        c("Destek ol, birlikte yapalım", "Hafta sonların gider", { kinBond: { id: b.id, v: 8 }, stress: 2, set: { kid: b.id, emek: 1 }, go: "acilis" }),
        c("Önce küçük başlasın: kiralık büfe", "Risk azalır · baban biraz bozulur", { kinBond: { id: b.id, v: 2 }, sk: { finans: 0.5 }, set: { kid: b.id, kucuk: 1 }, go: "acilis" }),
        c("Sermayeye katkı yap", h.tl(50000) + " · baban gururlanır", { cost: 50000, kinBond: { id: b.id, v: 10 }, set: { kid: b.id, katki: 1, emek: 1 }, go: "acilis" }),
        c("Vazgeçir, ikramiye kalsın", "Mantıklı ama kırıcı", { kinBond: { id: b.id, v: -8 }, sk: { finans: 1 }, end: "vazgecti" }),
      ];
    },
    steps: {
      acilis: {
        gap: 8,
        when: (s, d) => !!kinById(s, d.kid),
        title: "Açılış günü",
        text: (s, h) => {
          const b = kinById(s, h.d.kid);
          let t = "Tabela asıldı: “" + ek(b.name, "gen") + " Yeri”. Mahalleli çaya geldi, bakkal çiçek gönderdi. Baban önlüğüyle hiç bu kadar mutlu görünmemişti.";
          const tr = done(s, "l_tarifDefteri");
          if (tr && tr !== "ertelendi") t += " Menüde bir sürpriz var: tarif defterindeki revani ve su böreği!";
          return t;
        },
        choices: (s, h) => [
          c("Hafta sonları kasaya geç", "Yorucu ama baba-evlat zamanı", { stress: 3, h: -1, m: 3, kinBond: { id: h.d.kid, v: 6 }, set: { emek: 1 }, go: "yil" }),
          c("Instagram hesabını kur", "Dijital pazarlama", { sk: { pazarlama: 0.8, bilgisayar: 0.5 }, set: { dijital: 1 }, go: "yil" }),
          c("Uzaktan izle", "Kendi hayatın da var.", { go: "yil" }),
        ],
      },
      yil: {
        gap: 10,
        when: (s, d) => !!kinById(s, d.kid),
        title: "Kafede bir yıl",
        text: "Kafe bir yıla yaklaştı. Hafta sonları dolu, hafta içi tavla sesinden başka ses yok. Kira sözleşmesi yenilenecek; ev sahibi %60 zam istiyor.",
        choices: (s, h) => {
          const tr = done(s, "l_tarifDefteri");
          const p = Math.min(0.85, 0.38 + (h.d.emek ? 0.12 : 0) + (h.d.dijital ? 0.12 : 0) + (h.d.kucuk ? 0.12 : 0) + (tr && tr !== "ertelendi" ? 0.1 : 0));
          return [
            c("Zammı kabul et, devam", "Şans %" + Math.round(p * 100), { chance: { p, win: { m: 6, kinBond: { id: h.d.kid, v: 6 }, end: "tuttu" }, lose: { m: -5, stress: 4, kinBond: { id: h.d.kid, v: 2 }, end: "kapandi" }, winT: "Mahallenin kafesi", winP: "Müdavimler sözleşme gününe pasta getirdi.", loseT: "Kepenk indi", loseP: "Baban son tavlayı oynayıp anahtarı teslim etti. Gözleri doldu ama “denedim” dedi." } }),
            c("Devretmesini öner", "Kâra çıkmadan çıkış", { kinBond: { id: h.d.kid, v: -3 }, sk: { finans: 0.5 }, end: "devretti" }),
            c("Yeri değiştirin, daha ucuz bir sokağa", h.tl(20000) + " taşınma", { cost: 20000, kinBond: { id: h.d.kid, v: 4 }, chance: { p: p - 0.05, win: { m: 4, end: "tuttu" }, lose: { m: -4, end: "kapandi" }, winT: "Yeni yer, eski müşteri", winP: "Müdavimler yeni adresi buldu.", loseT: "Yeni sokakta kimse yok", loseP: "Üç ay sonra kafe kapandı." } }),
          ];
        },
      },
    },
  });

  const youngSib = (s) => kin(s, ["kardesK", "kardesE"]).find((k) => kAge(s, k) >= 17 && kAge(s, k) <= 19);
  const UNI = ["Eskişehir", "Ankara", "İzmir", "Trabzon", "Erzurum", "Samsun"];
  const BOLUM = ["bilgisayar mühendisliği", "hukuk", "hemşirelik", "işletme", "sınıf öğretmenliği", "mimarlık"];
  HS.story("l_kardesUni", {
    when: (s) => local(s) && !!youngSib(s),
    minAge: 20,
    weight: 0.55,
    room: "ziyaret",
    title: (s) => youngSib(s).name + " üniversiteyi kazandı!",
    text: (s, h) => {
      const k = youngSib(s);
      const n = k.name.length;
      let t = k.name + " " + ek(UNI[n % UNI.length], "loc") + " " + BOLUM[(n + k.born) % BOLUM.length] + " kazandı. Evde sevinç var ama hesap kitap da başladı: devlet yurdu çıkmadı, özel yurt aylık " + h.tl(15000) + ", bir de laptop lazım.";
      const bk = done(s, "l_babaKafe");
      if (bk === "kapandi" || HS.inStory(s, "l_babaKafe")) t += " Babanın ikramiyesi kafeye gittiği için ailenin bütçesi dar.";
      return t;
    },
    choices: (s, h) => {
      const k = youngSib(s);
      return [
        c("Aylık harçlık sözü ver", h.tl(5000) + " her ay · uzun soluklu", { cost: 5000, kinBond: { id: k.id, v: 10 }, stress: 2, set: { kid: k.id, aylik: 1 }, go: "donem" }),
        c("Laptopunu sen al", h.tl(36000) + " · tek seferlik", { cost: 36000, kinBond: { id: k.id, v: 8 }, set: { kid: k.id, laptop: 1 }, go: "donem" }),
        c("Burs ve yarı zamanlı iş bulmasına yardım et", "Para yok, emek var", { sk: { iletisim: 0.5 }, kinBond: { id: k.id, v: 3 }, set: { kid: k.id, burs: 1 }, go: "donem" }),
        c("Benim de durumum yok", "Dürüst ama soğuk", { kinBond: { id: k.id, v: -6 }, m: -2, end: "yardimYok" }),
      ];
    },
    steps: {
      donem: {
        gap: 10,
        when: (s, d) => !!kinById(s, d.kid),
        title: "İlk dönem sonu",
        text: (s, h) => {
          const k = kinById(s, h.d.kid);
          if (h.d.laptop) return k.name + " aradı: laptopla yaptığı proje bölümde ödül almış. “Sensiz olmazdı,” diyor. Bir de finaller yaklaşıyor, sesi yorgun.";
          if (h.d.burs) return k.name + " aradı: bulduğunuz burs çıkmış, akşamları bir kafede çalışıyor. Ama derslere yetişemediğinden yakınıyor.";
          return k.name + " aradı: “Harçlık bu ay gelmedi, sorun değil ama… yurt parası yaklaşıyor.” Bir yandan da kulüpte arkadaş edinmiş, mutlu görünüyor.";
        },
        choices: (s, h) => [
          h.d.aylik ? c("Sözünü tut: dört aylık harçlık", h.tl(20000), { cost: 20000, kinBond: { id: h.d.kid, v: 8 }, end: "destek" }) : null,
          h.d.aylik ? c("“Bu aylar biraz zor” de", "Güven sarsılır", { kinBond: { id: h.d.kid, v: -6 }, m: -2, end: "aksadi" }) : null,
          c("Ziyaretine git, şehri gezdir", h.tl(6000) + " · yol ve yemek", { cost: 6000, kinBond: { id: h.d.kid, v: 7 }, m: 4, end: "ziyaret" }),
          c("Telefonda abi/abla nasihati", "Ucuz ve biraz sıkıcı", { kinBond: { id: h.d.kid, v: 1 }, end: "nasihat" }),
        ],
      },
    },
  });

  const nineOf = (s) => kin(s, ["anneanne", "babaanne"])[0];
  HS.story("l_tarifDefteri", {
    when: (s) => !!nineOf(s),
    minAge: 18,
    maxAge: 60,
    weight: 0.45,
    room: "mutfak",
    title: (s) => HS.kinLabel(nineOf(s)) + " tarif defteri",
    text: (s) => {
      const k = nineOf(s);
      return HS.kinLabel(k) + " " + k.name + " sandıktan sararmış bir defter çıkardı: elli yıllık tarifler, kenarlarda “bir tutam”, “göz kararı”, “kıvamını görünce anlarsın” notları. “Bunlar bende kalırsa benimle gider,” dedi.";
    },
    choices: (s, h) => {
      const k = nineOf(s);
      return [
        c("Yanına git, birlikte pişirin", h.tl(1500) + " · yol ve malzeme", { cost: 1500, m: 4, kinBond: { id: k.id, v: 8 }, set: { kid: k.id }, go: "mutfak" }),
        c("Defteri fotoğrafla, dijitale geçir", "Akşamların gider", { sk: { bilgisayar: 0.5 }, kinBond: { id: k.id, v: 3 }, set: { kid: k.id, dijital: 1 }, go: "mutfak" }),
        c("Sonra bakarım", "Hep bir “sonra” vardır.", { kinBond: { id: k.id, v: -3 }, end: "ertelendi" }),
      ];
    },
    steps: {
      mutfak: {
        gap: 4,
        title: "Defterin geleceği",
        text: (s, h) => {
          const k = kinById(s, h.d.kid);
          if (!k) return "Defter artık sende. Kenardaki el yazısı notlara her baktığında sesini duyar gibisin.";
          return (h.d.dijital ? "Tarifleri tek tek yazdın; " : "Üç pazar boyunca mutfaktaydınız; ") + k.name + " “şimdi içim rahat” diyor. Defterle ne yapacağına sen karar vereceksin.";
        },
        choices: (s, h) => [
          c("Ailece bir sofra kur", h.tl(3000) + " · herkes bir tarif pişirsin", { cost: 3000, people: 3, m: 5, end: "sofra" }),
          c("Kitapçık bastır, herkese hediye et", h.tl(6000) + " · kalıcı hatıra", { cost: 6000, people: 2, m: 4, end: "kitap" }),
          c("Tarifleri sosyal medyada paylaş", "Şans %30 · belki tutar", { chance: { p: 0.3, win: { esteem: 5, m: 6, people: 3, end: "viral" }, lose: { m: 1, end: "paylasti" }, winT: "Revani videosu patladı", winP: "Yüz binlerce izlenme; yorumlar “ninemin tarifi de böyleydi” diye dolu.", loseT: "Birkaç beğeni", loseP: "Ama kuzenlerin kaydetmiş, o da bir şey." } }),
        ],
      },
    },
  });

  // =====================================================================
  // SAĞLIK VE SPOR: check-up, koşu, halı saha
  // =====================================================================
  HS.story("l_checkup", {
    when: (s) => local(s),
    minAge: 28,
    weight: 0.5,
    room: "sokak",
    title: "Aile hekiminden mesaj",
    text: (s) => {
      let t = "Aile hekimin " + D(s) + " e-Nabız’dan mesaj göndermiş: “" + s.age + " yaşına geldin; kan tahlili, tansiyon ve kolesterol için bir genel kontrol zamanı.”";
      const k = done(s, "l_kosu");
      if (k === "yariMaraton") t += " Altına bir not eklemiş: “Yarı maraton fotoğrafını gördüm, tebrikler!”";
      if (done(s, "l_halisaha") === "sakat") t += " Dizindeki eski sakatlığı da sormayı unutmamış.";
      return t;
    },
    choices: (s, h) => [
      c("Aile sağlığı merkezinde ücretsiz tahlil", "Sabah 8’de aç karnına sıra", { stress: 1, rel: { doktor: 3 }, set: { yol: "asm" }, go: "sonuc" }),
      c("Özel check-up paketi", h.tl(9500) + " · her şey bir günde", { cost: 9500, stress: -1, set: { yol: "ozel" }, go: "sonuc" }),
      c("Bir şeyim yok, gerek yok", "Rahat · ama bilinmezlik", { m: 1, rel: { doktor: -3 }, end: "gitmedi" }),
    ],
    steps: {
      sonuc: {
        gap: 2,
        title: "Tahlil sonuçları",
        text: (s) => {
          const fit = ["yariMaraton", "onK", "hobi"].includes(done(s, "l_kosu"));
          let t = fit ? D(s) + " sonuçlara bakıp gülümsedi: “Kolesterol mükemmel, nabız sporcu nabzı. Sadece D vitamini düşük, ofiste güneş görmüyorsun.”" : D(s) + " kaşlarını çattı: “LDL kolesterol 165, D vitamini 11. Henüz ilaç şart değil ama yaşam tarzı değişmeli.”";
          if (s.flags.kanBagisci) t += " “Kan bağışlarındaki değerlerin de dosyanda, hemoglobinin iyi.”";
          return t;
        },
        choices: (s, h) => {
          const fit = ["yariMaraton", "onK", "hobi"].includes(done(s, "l_kosu"));
          if (fit)
            return [
              c("D vitamini damlası al", h.tl(400), { cost: 400, h: 2, esteem: 2, rel: { doktor: 3 }, end: "saglikli" }),
              c("Öğle aralarında yürüyüşe çık", "Güneş ve hareket", { h: 2, m: 2, stress: -2, end: "saglikli" }),
            ];
          return [
            c("Diyetisyene git", h.tl(3500) + " seans başı", { cost: 3500, set: { plan: "diyet" }, go: "plan" }),
            c("Kendin hallet: yürüyüş, az ekmek", "Ücretsiz · irade ister", { sk: { disiplin: 0.5 }, set: { plan: "kendi" }, go: "plan" }),
            c("İlaç yazsın, gerisi boş", h.tl(600) + " aylık", { cost: 600, h: 1, m: 1, end: "ilac" }),
          ];
        },
      },
      plan: {
        gap: 8,
        title: "Üç ay sonra kontrol",
        text: (s, h) => (h.d.plan === "diyet" ? "Diyetisyenin listesine sadık kalmaya çalıştın; arada bir lahmacun kaçamağı oldu." : "Akşam yürüyüşleri ilk ay düzenliydi; sonra yağmur başladı.") + " " + D(s) + " kontrol tahlili istiyor.",
        choices: (s, h) => [
          c("Tahlile git", "Şans %" + (h.d.plan === "diyet" ? 70 : 45), { chance: { p: h.d.plan === "diyet" ? 0.7 : 0.45, win: { kg: -2, h: 4, m: 4, rel: { doktor: 5 }, end: "duzeldi" }, lose: { h: -1, m: -3, end: "duzelmedi" }, winT: "Değerler normale döndü", winP: D(s) + " sonucu iki kez okudu: “Aferin, ilaçsız başardın.”", loseT: "Pek değişmemiş", loseP: "“Daha çok hareket,” dedi " + D(s) + ". “Koşu, yüzme, ne olursa.”" } }),
          c("Kontrolü ertele", "Bilmemek rahatlatır", { h: -1, rel: { doktor: -2 }, end: "birakti" }),
        ],
      },
    },
  });

  HS.story("l_kosu", {
    when: (s) => local(s) && s.health >= 40,
    minAge: 18,
    maxAge: 60,
    weight: 0.55,
    room: "sokak",
    title: "Koşuya başlamak",
    text: (s) => {
      let t = "Sabahları parkta koşanları görüp için gidiyor. " + F(s) + " “Pazartesi başlıyoruz,” dedi; bu kaçıncı pazartesi, sayamıyorsun.";
      const ch = done(s, "l_checkup");
      if (ch === "duzelmedi" || ch === "ilac" || ch === "birakti") t += " " + D(s) + " de “daha çok hareket” demişti.";
      return t;
    },
    choices: (s, h) => [
      c("Koşu ayakkabısı al, programa başla", h.tl(5000) + " · 8 haftalık plan", { cost: 5000, h: 2, kg: -0.5, stress: -2, go: "onK" }),
      c("Eski spor ayakkabılarla dene", "Ücretsiz · sakatlık riski", { h: 1, set: { eski: 1 }, go: "onK" }),
      c("Koşu kulübüne yazıl", h.tl(1500) + " aylık · yeni insanlar", { cost: 1500, people: 2, set: { kulup: 1 }, go: "onK" }),
      c("Koşmak bana göre değil", "Kanepe kazandı.", { m: -1, end: "baslamadi" }),
    ],
    steps: {
      onK: {
        gap: 6,
        title: "İlk 10K",
        text: (s, h) => "Altı hafta oldu. Şehirde bir 10 km yarışı var, kayıt " + h.tl(900) + ". " + (h.d.kulup ? "Kulüpten herkes yazıldı; yazılmamak ayıp olur." : h.d.eski ? "Son günlerde kaval kemiğinde hafif bir sızı var." : "Bacakların hazır gibi."),
        choices: (s, h) => {
          const p = 0.75 + (h.d.kulup ? 0.1 : 0) - (h.d.eski ? 0.2 : 0);
          return [
            c("Yarışa katıl", "Şans %" + Math.round(p * 100), { cost: 900, chance: { p, win: { m: 7, esteem: 5, h: 2, go: "yari" }, lose: { h: -4, m: -3, end: "sakat" }, winT: "Madalya boynunda", winP: "Son kilometrede kimin olduğunu bilmediğin biri “hadi!” diye bağırdı; bitiş çizgisinde ağladın.", loseT: "7. kilometrede bitti", loseP: h.d.eski ? "Eski ayakkabılar kaval kemiğini fena hâlde zorladı." : "Bacağın kramp girdi; sağlık ekibi seni kenara aldı." } }),
            c("Yarışsız devam et", "Kendi temponla", { h: 2, m: 2, end: "hobi" }),
          ];
        },
      },
      yari: {
        gap: 10,
        title: "Yarı maraton: 21 kilometre",
        text: "10K’dan sonra hırslandın. Önünde iki seçenek var: köprüden geçen İstanbul Yarı Maratonu ya da düz parkuru ve deniz manzarasıyla Antalya.",
        choices: (s, h) => {
          const ist = s.city === "İstanbul";
          return [
            c("İstanbul Yarı Maratonu", (ist ? h.tl(2000) : h.tl(9000)) + (ist ? " · kayıt" : " · kayıt, yol, otel") + " · Şans %68", { cost: ist ? 2000 : 9000, chance: { p: 0.68, win: { m: 10, esteem: 8, h: 3, kg: -1, flag: "yariMaraton", end: "yariMaraton" }, lose: { m: -4, h: -2, end: "yarida" }, winT: "21,1 km!", winP: "Köprünün üstünde boğaza bakıp “ben bunu yapıyorum” dedin.", loseT: "16. kilometrede yürüdün", loseP: "Yokuşlar acımasızdı. Ama bir dahaki sefere." } }),
            c("Antalya Yarı Maratonu", h.tl(14000) + " · kayıt, uçak, otel · Şans %75", { cost: 14000, people: 1, chance: { p: 0.75, win: { m: 10, esteem: 8, h: 3, kg: -1, stress: -4, flag: "yariMaraton", end: "yariMaraton" }, lose: { m: -3, h: -2, end: "yarida" }, winT: "Bitiş çizgisinde deniz", winP: "Madalyayı aldın ve doğruca denize girdin.", loseT: "Sıcak çarptı", loseP: "Mart dedik ama güneş acımadı; 15. kilometrede bıraktın." } }),
            c("Hazır değilim, 10K’da kal", "Sakatlıktan uzak", { h: 1, end: "onK" }),
          ];
        },
      },
    },
  });

  HS.story("l_halisaha", {
    when: (s) => local(s) && s.health >= 45,
    minAge: 18,
    maxAge: 50,
    weight: 0.5,
    room: "sokak",
    title: "Halı saha daveti",
    text: (s, h) => {
      let t = F(s) + ": “Perşembe 21:00, halı saha. Bir kişi eksiğiz; kaleye geçmezsin merak etme.” Saha kirası kişi başı " + h.tl(600) + ".";
      const k = done(s, "l_kosu");
      if (k === "yariMaraton" || k === "onK" || k === "hobi") t += " Koşu yaptığını duyan herkes seni kanata yazmış bile.";
      if (s.flags.enYakinGurbet) t = "Takımın eski kaptanı " + F(s) + " gittiğinden beri perşembe maçlarında bir kişi hep eksik. Gruptan mesaj geldi: “Gelir misin?” Saha kirası kişi başı " + h.tl(600) + ".";
      return t;
    },
    choices: (s, h) => [
      c("Gel tabii", h.tl(600) + " · ter ve kahkaha", { cost: 600, people: 2, m: 3, go: "mac" }),
      c("Kaleye geç", h.tl(600) + " · daha az koşu, daha çok küfür", { cost: 600, people: 2, set: { kaleci: 1 }, go: "mac" }),
      c("“Dizim müsait değil”", "Evde kal", { rel: { enYakin: -2 }, end: "gitmedi" }),
    ],
    steps: {
      mac: {
        gap: 2,
        title: "Maç kızıştı",
        text: (s, h) => "Skor 7-7. Karşı takımdan biri her topa topuğa basıyor; " + F(s) + " hakemsiz maçta hakemlik yapmaya kalktı." + (h.d.kaleci ? " Kalede sen varsın ve son dakika penaltısı geliyor." : ""),
        choices: (s, h) => {
          const fit = ["yariMaraton", "onK", "hobi"].includes(done(s, "l_kosu"));
          const p = fit ? 0.85 : 0.65;
          return [
            c("Sert girene sert gir", "Şans %50", { chance: { p: 0.5, win: { m: 5, people: 1, set: { sakat: 0 }, go: "sonrasi" }, lose: { h: -6, m: -4, set: { sakat: 1 }, go: "sonrasi" }, winT: "Saygı kazandın", winP: "Adam bir daha topuğa basmadı.", loseT: "Ayağın burkuldu", loseP: "Yere düştüğünde dizinden bir “tık” sesi geldi." } }),
            c("Ortamı yumuşat", "Maç maçtır", { rel: { enYakin: 3 }, people: 1, sk: { iletisim: 0.5 }, set: { sakat: 0 }, go: "sonrasi" }),
            c(h.d.kaleci ? "Penaltıda köşeye uç" : "Temkinli oyna", "Şans %" + Math.round(p * 100), { chance: { p, win: { m: h.d.kaleci ? 7 : 2, esteem: h.d.kaleci ? 3 : 0, set: { sakat: 0 }, go: "sonrasi" }, lose: { h: -5, set: { sakat: 1 }, go: "sonrasi" }, winT: h.d.kaleci ? "Kurtardın!" : "Sağ salim bitti", winP: h.d.kaleci ? "Takım üstüne çullandı." : "Kondisyon işe yaradı.", loseT: "Kötü düştün", loseP: "Omzunun üstüne sert düştün, ağrı geçmiyor." } }),
          ];
        },
      },
      sonrasi: {
        gap: 1,
        title: (s, h) => (h.d.sakat ? "Ertesi sabah" : "Maç sonrası çay ocağı"),
        text: (s, h) => (h.d.sakat ? "Ertesi sabah dizin şişmiş. Ortopedist “menisküs zorlanması, en az altı hafta futbol yok” dedi." : "Maçtan sonra herkes çay ocağında toplandı. " + F(s) + " öneriyor: “Haftalık sabit takım kuralım, aylık sahayı peşin tutalım.”"),
        choices: (s, h) =>
          h.d.sakat
            ? [
                c("Fizik tedavi, 10 seans", h.tl(15000), { cost: 15000, h: 4, end: "sakat" }),
                c("Devlet hastanesi, buz ve bekle", "Ücretsiz · yavaş iyileşme", { h: -2, stress: 3, end: "sakat" }),
                c("Geçer, perşembe yine oynarım", "Şans %40", { chance: { p: 0.4, win: { m: 3, end: "devam" }, lose: { h: -8, m: -4, end: "sakat" }, winT: "Şanslısın", winP: "Diz dayandı.", loseT: "Durum ağırlaştı", loseP: "Bu sefer MR ve aylarca tedavi." } }),
              ]
            : [
                c("Takımı kur", h.tl(2400) + " aylık · sabit perşembe", { cost: 2400, people: 3, h: 2, rel: { enYakin: 4 }, end: "takim" }),
                c("Canım istedikçe gelirim", "Esnek", { people: 1, end: "arada" }),
              ],
      },
    },
  });

  // =====================================================================
  // HOBİ: gitar → açık mikrofon
  // =====================================================================
  HS.story("l_gitar", {
    when: (s) => (s.items || []).includes("gitar") && s.job !== "music",
    minAge: 16,
    maxAge: 65,
    weight: 0.5,
    room: "salon",
    title: "Köşedeki gitar",
    text: (s, h) => "Gitar köşede tozlanıyor. Semtteki müzik atölyesi haftada bir akşam ders veriyor (aylık " + h.tl(4000) + "); YouTube’da da “30 günde gitar” videoları var.",
    choices: (s, h) => [
      c("Atölyeye yazıl", h.tl(4000) + " · düzenli ders", { cost: 4000, sk: { enstruman: 1 }, people: 1, set: { ders: 1 }, go: "pratik" }),
      c("YouTube’dan öğren", "Ücretsiz · disiplin ister", { sk: { enstruman: 0.5 }, go: "pratik" }),
      c("Gitarı sat", "Biraz para · biraz hüzün", { itemSell: "gitar", m: -1, end: "satti" }),
    ],
    steps: {
      pratik: {
        gap: 5,
        title: "Parmak uçları nasır tuttu",
        text: "Fa akoru hâlâ cızırdıyor ama “Gesi Bağları”nı baştan sona çalabiliyorsun. Komşular henüz şikâyet etmedi.",
        choices: (s) => [
          c("Her gün yarım saat çalış", "Disiplin", { sk: { enstruman: 1.5, disiplin: 0.5 }, m: 2, go: "sahne" }),
          c("Arkadaşlarla akşam meşk et", "Sosyal ve keyifli", { sk: { enstruman: 0.8 }, people: 2, m: 3, go: "sahne" }),
          c("Bırak, zaman yok", "Gitar köşesine döner.", { m: -2, end: "birakti" }),
        ],
      },
      sahne: {
        gap: 6,
        title: "Açık mikrofon gecesi",
        text: (s, h) => {
          let t = "Semtteki bir bar her çarşamba “açık mikrofon” gecesi yapıyor; iki şarkı, beş dakika, sahne senin.";
          if (done(s, "l_flort") === "devam") t += " Geçen ay tanıştığın kişi de geleceğini yazdı.";
          if (done(s, "l_mezuniyet") && done(s, "l_mezuniyet") !== "gitmedi") t += " Lise grubundan biri “canlı yayın açın!” diye yazmış bile.";
          return t;
        },
        choices: (s, h) => {
          const p = h.d.ders ? 0.65 : 0.5;
          return [
            c("Sahneye çık", "Şans %" + Math.round(p * 100), { chance: { p, win: { m: 8, esteem: 6, people: 3, sk: { sahne: 1 }, end: "sahne" }, lose: { m: -4, esteem: -5, end: "titredi" }, winT: "Alkış!", winP: "İkinci şarkıda salon nakaratı seninle söyledi.", loseT: "Eller titredi", loseP: "İkinci kıtada sözleri unuttun; biri kibarca alkışladı." } }),
            c("Bu sefer seyirci ol", "Ortamı tanı", { m: 2, people: 1, end: "seyirci" }),
          ];
        },
      },
    },
  });

  // =====================================================================
  // PARA: kripto tüyosu, trafikte kaza, bulunan cüzdan
  // =====================================================================
  HS.story("l_kripto", {
    when: (s) => local(s) && !HS.inStory(s, "l_saadet"),
    minAge: 20,
    maxAge: 55,
    weight: 0.45,
    room: "salon",
    title: "“Kesin bilgi” kripto",
    text: (s, h) => {
      const sd = done(s, "l_saadet");
      if (sd && sd !== "reddetti") return L(s) + " yine aradı: “Altın Yaşam işini unut, asıl para burada.” Telegram’daki bir sinyal grubunun önerdiği yeni bir coin. “Bir haftada iki katı, garanti.”";
      let t = F(s) + " heyecanla ekran görüntüsü atıyor: Telegram’daki bir “sinyal grubu” yeni bir coin önermiş. “Kuzenim yüzde üç yüz kazandı, kaçırma!”";
      if (done(s, "l_ortaklik") === "batti") t += " Dükkânın zararını bununla çıkaracağına inanıyor.";
      return t;
    },
    choices: (s, h) => {
      const sd = done(s, "l_saadet");
      const who = sd && sd !== "reddetti" ? "liseArk" : "enYakin";
      return [
        c("Büyük oyna", h.tl(30000), { cost: 30000, set: { amt: 30000, who }, go: "yukselis" }),
        c("Az bir parayla dene", h.tl(5000), { cost: 5000, set: { amt: 5000, who }, go: "yukselis" }),
        c("Uzak dur", "Kaçırma korkusu ile yaşarsın", { sk: { finans: 0.5 }, end: "girmedi" }),
      ];
    },
    steps: {
      yukselis: {
        gap: 3,
        title: "Ekran yemyeşil",
        text: (s, h) => "Coin üç haftada %60 yükseldi. " + h.tl(h.d.amt || 5000) + " şimdi " + h.tl(Math.round((h.d.amt || 5000) * 1.6)) + " görünüyor. Grupta herkes “daha başlamadı bile” diye yazıyor.",
        choices: (s, h) => {
          const a = h.d.amt || 5000;
          return [
            c("Kârı al, çık", "Komisyonlar düşülünce ~" + h.tl(Math.round(a * 1.5)), { cash: Math.round(a * 1.5), m: 5, sk: { finans: 1 }, end: "kar" }),
            c("Daha çok koy", h.tl(20000) + " · tren kaçmasın", { cost: 20000, set: { amt: a + 20000 }, go: "cokus" }),
            c("Bekle, daha çıkar", "Hiçbir şey yapma", { go: "cokus" }),
          ];
        },
      },
      cokus: {
        gap: 3,
        title: "Çekim yapılamıyor",
        text: (s, h) => "Sabah uyandığında platform “bakım çalışması” diyordu. Öğlen Telegram grubu silindi. Akşam haberlerde: “Kripto platformu kurucuları yurt dışına kaçtı.” İçeride " + h.tl(h.d.amt || 5000) + " var.",
        choices: (s, h) => {
          const a = h.d.amt || 5000;
          const who = h.d.who || "enYakin";
          return [
            c("Siber suçlara şikâyette bulun", "Şans %20 · uzun süreç", { stress: 4, chance: { p: 0.2, win: { cash: Math.round(a * 0.3), end: "kismen" }, lose: { m: -5, end: "kayip" }, winT: "Kısmi iade", winP: "Yıllar sonra paranın bir kısmı el konan hesaplardan iade edildi.", loseT: "Dosya kapandı", loseP: "Faillere ulaşılamadı." } }),
            c("Kaybı kabullen, ders çıkar", "Acı ama öğretici", { m: -8, sk: { finans: 1.5 }, end: "kayip" }),
            c("Tüyoyu verene hesap sor", "Öfkeni boşalt", { m: -3, rel: { [who]: -15 }, end: "kayip" }),
          ];
        },
      },
    },
  });

  HS.story("l_kaza", {
    when: (s) => local(s) && motorCar(s),
    minAge: 18,
    maxAge: 78,
    weight: 0.45,
    room: "sokak",
    title: "Kırmızı ışıkta “tık”",
    text: (s, h) => "Kırmızıda beklerken arkadan bir araç çarptı. Arka tampon içeri göçtü. Sürücü inip ellerini kaldırdı: “" + abiAbla(s) + ", tutanakla uğraşmayalım, " + h.tl(8000) + " vereyim, kapatalım.”",
    choices: (s, h) => [
      c("Kaza tespit tutanağı doldurun", "Karşı tarafın sigortası öder · bürokrasi", { stress: 2, set: { yol: "tutanak" }, go: "servis" }),
      c("Nakit al, kapat", h.tl(8000) + " hemen · ama hasar ne kadar?", { cash: 8000, set: { yol: "nakit" }, go: "servis" }),
      c("Polis çağır", "Saatler sürer · kayıt kesin", { stress: 3, set: { yol: "polis" }, go: "servis" }),
    ],
    steps: {
      servis: {
        gap: 2,
        when: (s) => !!s.car,
        title: "Servis faturası",
        text: (s, h) => {
          const usta = HS.cast(s, "usta").name;
          const tanidik = HS.castRel(s, "usta") >= 55 ? " Tanıdık usta " + usta + " “bana getir, sana iyi fiyat yaparım” dedi." : " Bir de tanıdık usta " + usta + " var ama ona ne kadar güvendiğinden emin değilsin.";
          if (h.d.yol === "nakit") return "Usta aracı kaldırdı: arka tampon, park sensörü, bagaj sacı… Toplam " + h.tl(32000) + ". Aldığın " + h.tl(8000) + " yetmedi; karşı tarafın numarası da artık kapalı." + tanidik;
          return "Karşı tarafın trafik sigortası hasarı kabul etti. Yetkili servis " + h.tl(45000) + " dedi; parça bekleniyor, üç hafta araçsızsın." + (h.d.yol === "polis" ? " Polis raporu sayesinde kusur oranı tartışmasız." : "");
        },
        choices: (s, h) => {
          const good = HS.castRel(s, "usta") >= 55;
          if (h.d.yol === "nakit")
            return [
              c("Farkı kendin öde, yetkili servis", h.tl(24000), { cost: 24000, stress: -1, end: "cebinden" }),
              c("Tanıdık ustaya yaptır", h.tl(14000) + " · Şans %" + (good ? 80 : 55), { cost: 14000, chance: { p: good ? 0.8 : 0.55, win: { rel: { usta: 5 }, m: 2, end: "usta" }, lose: { rel: { usta: -8 }, m: -4, stress: 3, end: "usta" }, winT: "Tertemiz oldu", winP: "Boya tonu bile tuttu.", loseT: "Boya tutmadı", loseP: "Tampon güneşte başka renk görünüyor." } }),
              c("Böyle kalsın", "Göçük tampon, rahat cüzdan", { m: -3, end: "gocuk" }),
            ];
          return [
            c("Yetkili serviste bekle", "Üç hafta toplu taşıma", { stress: 3, m: -1, end: "sigorta" }),
            c("Değer kaybı da talep et", "Şans %60 · eksper ve dilekçe", { stress: 2, chance: { p: 0.6, win: { cash: 15000, sk: { finans: 0.5 }, end: "degerKaybi" }, lose: { stress: 3, end: "sigorta" }, winT: "Değer kaybı ödendi", winP: "Sigorta şirketi " + h.tl(15000) + " değer kaybını hesabına yatırdı.", loseT: "Reddedildi", loseP: "“Aracın kilometresi yüksek” dendi." } }),
          ];
        },
      },
    },
  });

  HS.story("l_cuzdan", {
    when: (s) => local(s),
    minAge: 18,
    maxAge: 80,
    weight: 0.45,
    room: "sokak",
    title: "Yerde bir cüzdan",
    text: (s, h) => "Otobüs durağında kalın, eski bir deri cüzdan buldun: içinde " + h.tl(4000) + " nakit, kimlik, iki banka kartı ve bir torun vesikalığı. Kimlikte “Necdet Yalçın, 1951” yazıyor; adres de belli.",
    choices: (s, h) => [
      c("Adresine kendin götür", "Yarım saat yol", { m: 2, go: "sahibi" }),
      c("Karakola teslim et", "Prosedür · içi rahat", { m: 2, esteem: 1, end: "karakol" }),
      c("Parayı al, cüzdanı posta kutusuna at", h.tl(4000) + " · vicdan?", { cash: 4000, m: -4, esteem: -3, flag: "cuzdanPara", end: "aldi" }),
    ],
    steps: {
      sahibi: {
        gap: 1,
        title: "Necdet Bey’in kapısı",
        text: "Kapıyı hırkalı, gözlüklü bir amca açtı. Cüzdanı görünce gözleri doldu: “Rahmetli eşimin fotoğrafı var içinde, para umurumda değil.” İçeri buyur ediyor, bir de zarf uzatıyor.",
        choices: (s, h) => [
          c("Ödülü kabul et", h.tl(2000), { cash: 2000, m: 2, end: "odul" }),
          c("Zarfı geri çevir, çayını iç", "Sohbet uzar", { m: 5, people: 2, go: "davet" }),
        ],
      },
      davet: {
        gap: 6,
        title: "Necdet Bey’den telefon",
        text: (s) => (s.job === "none" && !s.retired && s.edu !== "ogrenci" ? "Necdet Bey aradı: “Oğlumun şirketinde bir pozisyon açılmış, senden bahsettim. Dürüst insan bulmak zor, görüşmeye git.”" : "Necdet Bey aradı: torunu matematikten zorlanıyormuş; bir de pazar günü seni yemeğe çağırıyor. “Sen artık bu evin evladısın.”"),
        choices: (s) =>
          s.job === "none" && !s.retired && s.edu !== "ogrenci"
            ? [
                c("Görüşmeye git", "Referanslı başvuru", { apply: "office", boost: 0.2, m: 3, end: "is" }),
                c("Teşekkür et, kendi yolumu bulurum", "Gurur", { esteem: 2, end: "dost" }),
              ]
            : [
                c("Pazar yemeğine git", "Yeni bir aile büyüğü", { people: 3, m: 4, end: "dost" }),
                c("Toruna birkaç ders ver", "Akşamların gider · gönlün dolar", { sk: { iletisim: 0.5 }, m: 3, stress: 1, end: "dost" }),
                c("Kibarca geçiştir", "Hayat yoğun", { end: "odul" }),
              ],
      },
    },
  });

  // =====================================================================
  // ŞEHİR VE GÖNÜLLÜLÜK: kan bağışı
  // =====================================================================
  HS.story("l_kanBagisi", {
    when: (s) => local(s) && s.health >= 50,
    minAge: 18,
    maxAge: 65,
    weight: 0.5,
    room: "sokak",
    title: "Acil kan aranıyor",
    text: (s) => "Mahalle WhatsApp grubunda bir mesaj: “ACİL! " + ek(HS.castName(s, "komsu"), "gen") + " babası ameliyatta, A Rh+ ve 0 Rh− kan aranıyor. Devlet hastanesi kan merkezi, akşam 8’e kadar.”",
    choices: (s) => [
      c("Hemen git, bağış yap", "Yarım gün · halsizlik", { h: -2, m: 6, people: 2, rel: { komsu: 8 }, flag: "kanBagisci", go: "sms" }),
      c("Mesajı paylaş, çevreni seferber et", "Kendi kanın değil, sesin", { people: 1, rel: { komsu: 3 }, end: "paylasti" }),
      c("İğneden korkuyorum", "Vicdan biraz sızlar.", { m: -2, end: "gitmedi" }),
    ],
    steps: {
      sms: {
        gap: 8,
        title: "Bir SMS",
        text: (s) => "Telefonuna bir SMS düştü: “Bağışladığınız kan bugün bir hastamıza ulaştı. Teşekkür ederiz.” " + HS.castName(s, "komsu") + " de babasının taburcu olduğunu söyledi; kapına bir tepsi baklava bıraktı.",
        choices: (s) => [
          c("Düzenli bağışçı ol", "Üç ayda bir · halsizlik", { h: -1, m: 4, esteem: 3, people: 1, end: "duzenli" }),
          c("Arada bir, çağrı gelince", "Esnek", { m: 2, end: "birKez" }),
          c("Komşunla bir kahve iç", "Yeni bir dostluk", { rel: { komsu: 6 }, people: 1, m: 2, end: "birKez" }),
        ],
      },
    },
  });
})(globalThis.HS || (globalThis.HS = {}));
