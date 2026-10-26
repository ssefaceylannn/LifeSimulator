// Gündelik hayat olayları: odaya, saate, işe ve duruma göre küçük ama anlamlı anlar.
// Her olay bir odada geçer (room) ve sahne oraya geçer. Kısa bekleme süreleriyle
// tekrar edebilirler; böylece "sıradan bir hafta" yerine hep yaşayan bir ev olur.
// fx anahtarları: m (mutluluk), h (sağlık), stress, cost/cash (2026 TL), bond (partner),
// kidBond, people, kg, sk (beceri), perf (iş performansı).
(function (HS) {
  "use strict";
  const c = (label, hint, fx = {}) => ({ label, hint, fx });
  const P = (a) => a[(Math.random() * a.length) | 0];
  const working = (s) => s.job !== "none" && !s.retired;
  const weekend = (s) => HS.lateWeek(s);
  const home = (s) => s.housing !== "aile";
  const E = (id, room, opts) => ({ id, room, cooldown: 16, weight: 0.55, ...opts });

  HS.EVENTS.push(
    // ---------- Mutfak ----------
    E("dishes", "mutfak", {
      title: "Bulaşık dağı",
      text: (s) => (s.partner ? "Lavabo taştı. " + s.partner.name + " sana bakıyor, sen ona." : "Lavabo taştı; son temiz çatal da kullanıldı."),
      choices: (s) => [
        c("Hemen yıka", "Stres biraz azalır.", { stress: -2, m: -1, bond: s.partner ? 3 : 0 }),
        c("Bulaşık makinesi al", "₺18.000", { cost: 18000, stress: -4, m: 2 }),
        c("Yarına bırak", "Mutfak kokmaya başlar.", { stress: 3, bond: s.partner ? -3 : 0 }),
      ],
    }),
    E("emptyFridge", "mutfak", {
      title: "Buzdolabı bomboş",
      text: "Kapağı açtın: yarım limon, bir kavanoz turşu ve umut.",
      choices: [
        c("Markete git, haftalık alışveriş", "₺2.200 · sağlıklı beslen", { cost: 2200, h: 1, kg: -0.1 }),
        c("Yemek siparişi ver", "₺650 · hızlı ama pahalı", { cost: 650, m: 2, kg: 0.2 }),
        c("Makarnayla idare et", "Bedava, biraz moral bozucu.", { m: -1 }),
      ],
    }),
    E("saltNeighbor", "mutfak", {
      when: home,
      title: "Komşu kapıda",
      text: "Alt kattaki teyze tuz istemeye gelmiş; elinde bir tabak kurabiye var.",
      choices: [
        c("İçeri buyur et, çay koy", "Mahallede bir dostun olur.", { people: 2, m: 2, cost: 100 }),
        c("Tuzu ver, teşekkür et", "", { people: 0.5 }),
      ],
    }),
    E("breakfastRush", "mutfak", {
      when: (s) => working(s) && !weekend(s),
      title: "Sabah telaşı",
      text: "Alarmı iki kez erteledin. Servis/otobüs 10 dakika sonra.",
      choices: [
        c("Kahvaltıyı atla, koş", "Gün aç başlar.", { stress: 3, h: -1 }),
        c("Ayakta simit-peynir", "Hızlı ama doyurucu.", { m: 1 }),
        c("Geç kal, düzgün kahvaltı yap", "Amirin fark edebilir.", { perf: -2, m: 3 }),
      ],
    }),
    E("cookExperiment", "mutfak", {
      title: "Yeni tarif",
      text: "Sosyal medyada gördüğün tarifi denemek istiyorsun: fırında mantı.",
      choices: (s) => [
        c("Dene", "Şans %60", { cost: 400, chance: { p: 0.6, win: { m: 5, bond: s.partner ? 4 : 0, people: 0.5 }, lose: { m: -2, stress: 2 }, winT: "Harika oldu", winP: "Tabaklar sıyrıldı; tarif aile defterine girdi.", loseT: "Fırından duman", loseP: "Hamur lastik gibi oldu. Akşam yine yumurta." } }),
        c("Bildiğin yemeği yap", "", { m: 1 }),
      ],
    }),
    E("ramadanIftar", "mutfak", {
      when: (s) => s.week >= 8 && s.week <= 12,
      cooldown: 40,
      title: "İftar sofrası",
      text: "Akşam ezanına az kaldı. Sofrada çorba, pide ve hurma.",
      choices: [
        c("Komşuları da çağır", "₺1.500 · kalabalık sofra", { cost: 1500, people: 3, m: 4 }),
        c("Ailece sessiz bir iftar", "", { m: 2, kidBond: 2, bond: 2 }),
      ],
    }),
    // ---------- Salon ----------
    E("derbyNight", "salon", {
      title: "Derbi akşamı",
      text: "Bu akşam büyük maç var. Herkes bir yerde toplanıyor.",
      choices: [
        c("Evde izle, arkadaşları çağır", "Çekirdek ve çay ₺600", { cost: 600, people: 2, m: 4, stress: -3 }),
        c("Kahvehanede izle", "₺200 · kalabalık", { cost: 200, people: 1.5, m: 3 }),
        c("Maçla ilgilenmiyorum", "Erken yat.", { h: 1 }),
      ],
    }),
    E("seriesFinale", "salon", {
      title: "Dizi finali",
      text: "İki yıldır izlediğin dizinin final bölümü bu akşam.",
      choices: (s) => [
        c("Kanepeye kurul, telefonu kapat", "Stres −", { stress: -5, m: 3 }),
        c(s.partner ? "Birlikte izleyin" : "Arkadaşla izle", "", s.partner ? { bond: 4, m: 3, stress: -3 } : { people: 1, m: 3 }),
      ],
    }),
    E("powerCut", "salon", {
      title: "Elektrik kesildi",
      text: "Mahallede elektrik gitti. Telefon şarjı %12.",
      choices: (s) => [
        c("Mum yak, sohbet et", s.partner ? "Romantik bir akşam" : "Sessiz bir akşam", { bond: s.partner ? 5 : 0, m: 2, stress: -2 }),
        c("Kafeye git, iş yetiştir", "₺250", { cost: 250, perf: 2, stress: 1 }),
      ],
    }),
    E("tvNews", "salon", {
      title: "Akşam haberleri",
      text: () => P(["Ekranda yine zam haberleri: akaryakıt, ekmek, toplu taşıma.", "Haberlerde bir sel felaketi; yardım kampanyası başlatılmış.", "Ekonomi programında herkes farklı bir şey söylüyor."]),
      choices: [
        c("Yardım kampanyasına bağış yap", "₺1.000", { cost: 1000, m: 3, people: 1 }),
        c("Kanalı değiştir", "Kafanı yorma.", { stress: -1 }),
      ],
    }),
    E("boardGame", "salon", {
      when: (s) => s.partner || s.children.length || s.people > 4,
      title: "Okey akşamı",
      text: "Biri okey takımını çıkardı. \"Bir el atalım mı?\"",
      choices: [
        c("Oyna", "Şans %50: kazanırsan keyif", { chance: { p: 0.5, win: { m: 5, people: 1 }, lose: { m: 1, people: 1 }, winT: "Okey bitti!", winP: "Taşları dizip masaya vurdun.", loseT: "Bu el kaybettin", loseP: "Ama gece kahkahayla geçti." } }),
        c("İzle, çay servis et", "", { people: 0.5, m: 1 }),
      ],
    }),
    E("homeOffice", "salon", {
      when: (s) => s.job === "office" && !weekend(s),
      title: "Evden çalışma günü",
      text: "Bugün uzaktan çalışıyorsun. Pijamayla toplantıya girmek cazip.",
      choices: [
        c("Disiplinli çalış", "Performans +", { perf: 3, stress: 1, sk: { tablolama: 0.4 } }),
        c("Kamerayı kapat, dizi aç", "Yakalanırsan...", { chance: { p: 0.75, win: { m: 3, stress: -3 }, lose: { perf: -6, stress: 6 }, winT: "Kimse fark etmedi", winP: "Gün rahat geçti.", loseT: "Mikrofon açık kalmış", loseP: "Toplantıda arka plandan dizinin sesi geldi." } }),
      ],
    }),
    E("guestsLate", "salon", {
      when: home,
      title: "Habersiz misafirler",
      text: "Gece 22:00'de kapı çaldı: eski arkadaşların yakından geçiyormuş.",
      choices: [
        c("Buyur et, sofra kur", "₺800 · gece uzar", { cost: 800, people: 3, m: 3, h: -1 }),
        c("Kapıda kısa sohbet", "Yorgunsun.", { people: 0.5 }),
      ],
    }),
    E("kidHomework", "salon", {
      when: (s) => s.children.some((k) => s.year - k.born >= 7 && s.year - k.born <= 14),
      title: "Ödev saati",
      text: "Çocuğun kesirlerde takılmış; ağlamaklı.",
      choices: [
        c("Oturup birlikte çöz", "Bağ +, sabır gerekir", { kidBond: 5, stress: 2 }),
        c("Özel ders tut", "Aylık ₺6.000", { cost: 6000, kidBond: 1 }),
        c("\"Kendin yap\" de", "", { kidBond: -4 }),
      ],
    }),
    // ---------- Yatak odası ----------
    E("lateNightPhone", "yatak", {
      title: "Gece 01:30",
      text: "Yatağa uzandın ama telefonda kısa videolar bitmiyor.",
      choices: [
        c("Telefonu bırak, uyu", "Sağlık +", { h: 1, stress: -2 }),
        c("Biraz daha", "Sabah zor uyanırsın.", { m: 1, h: -1, stress: 2 }),
      ],
    }),
    E("alarmFight", "yatak", {
      when: (s) => working(s) && !weekend(s),
      title: "Alarm savaşı",
      text: "Alarm üçüncü kez çalıyor. Dışarıda yağmur var.",
      choices: [
        c("Kalk", "Disiplin.", { perf: 1, stress: 1 }),
        c("Hasta olduğunu söyle, yat", "Bir günlük izin.", { chance: { p: 0.7, win: { stress: -6, h: 2 }, lose: { perf: -6, stress: 4 }, winT: "Uyudun", winP: "Akşama kadar dinlendin.", loseT: "Amirin aradı", loseP: "Sesin hiç de hasta gibi değildi." } }),
      ],
    }),
    E("snoring", "yatak", {
      when: (s) => s.partner && s.partner.married,
      title: "Horlama",
      text: (s) => s.partner.name + " yine horluyor. Saat 03:00.",
      choices: (s) => [
        c("Kanepeye geç", "Uykun bölünür.", { h: -1, stress: 2 }),
        c("Kulak tıkacı al", "₺150", { cost: 150, h: 1 }),
        c("Sabah konuş", "Biraz kırılabilir.", { bond: -2, h: 1 }),
      ],
    }),
    E("wardrobeCrisis", "yatak", {
      title: "Giyecek bir şey yok",
      text: "Dolap dolu ama giyecek hiçbir şey yok. Bugün önemli bir gün.",
      choices: [
        c("Alışverişe çık", "₺2.500 · kendini iyi hissedersin", { cost: 2500, m: 3 }),
        c("Eski bir kombini canlandır", "", { m: 1 }),
      ],
    }),
    E("babyNight", "yatak", {
      when: (s) => s.children.some((k) => s.year - k.born < 2),
      cooldown: 4,
      title: "Gece 04:00",
      text: "Bebek ağlıyor. Yine.",
      choices: (s) => [
        c("Sen kalk", "Uyku −, bağ +", { h: -2, stress: 3, kidBond: 3, bond: s.partner ? 3 : 0 }),
        c(s.partner ? "Sıra " + s.partner.name + "'da" : "Bekle, belki susar", "", { bond: s.partner ? -2 : 0, stress: 2 }),
      ],
    }),
    // ---------- Sokak ----------
    E("missedBus", "sokak", {
      when: (s) => (working(s) || s.edu === "ogrenci") && !s.car,
      title: "Otobüs kaçtı",
      text: "Durağa vardığında otobüs köşeyi dönüyordu. Sonraki 25 dakika sonra.",
      choices: [
        c("Taksi çağır", "₺350", { cost: 350, stress: -1 }),
        c("Bekle, geç kal", "", { perf: -2, stress: 3 }),
        c("Yürü", "Sağlık +, terli varırsın", { h: 1, kg: -0.05, stress: 1 }),
      ],
    }),
    E("streetCat", "sokak", {
      when: (s) => !s.flags.kedi,
      cooldown: 30,
      title: "Kapının önündeki kedi",
      text: "Bir sokak kedisi üç gündür kapının önünde bekliyor; bacağı biraz aksıyor.",
      choices: [
        c("Veterinere götür, sahiplen", "₺6.500 ilk masraf", { cost: 6500, flag: "kedi", m: 6, stress: -2 }),
        c("Mama ve su koy", "₺150", { cost: 150, m: 2 }),
        c("Geç", "", {}),
      ],
    }),
    E("trafficJam", "sokak", {
      when: (s) => s.car && s.car !== "bisiklet" && working(s),
      title: "Trafik kilit",
      text: "Köprüde bir kaza var; navigasyon 70 dakika diyor.",
      choices: [
        c("Podcast aç, sabret", "", { stress: 2, sk: { ingilizce: 0.2 } }),
        c("Ara yollara gir", "Şans %50", { chance: { p: 0.5, win: { stress: -1 }, lose: { stress: 5, cost: 300 }, winT: "Kurtuldun", winP: "On dakikada çıktın.", loseT: "Daha kötü", loseP: "Ara yolda da tıkandın, üstüne park cezası." } }),
      ],
    }),
    E("bazaar", "sokak", {
      when: weekend,
      weekend: true,
      title: "Semt pazarı",
      text: "Pazar tezgâhlarında mevsim sebzeleri, bağırışlar, \"abla gel bak\" sesleri.",
      choices: [
        c("Pazarlık yap, file doldur", "₺1.200 · haftalık ihtiyaç", { cost: 1200, h: 1, m: 2, people: 0.5 }),
        c("Sadece dolaş", "", { m: 1 }),
      ],
    }),
    E("parkWalk", "sokak", {
      when: weekend,
      weekend: true,
      title: "Güneşli bir öğleden sonra",
      text: (s) => "Parkta insanlar piknik yapıyor, çocuklar bisiklet sürüyor." + (s.partner ? " " + s.partner.name + " dışarı çıkmak istiyor." : ""),
      choices: (s) => [
        c("Yürüyüşe çık", "Sağlık +, stres −", { h: 1, stress: -4, bond: s.partner ? 3 : 0, kidBond: 2 }),
        c("Evde kal", "", { m: -1 }),
      ],
    }),
    E("parkingFine", "sokak", {
      when: (s) => s.car && s.car !== "bisiklet",
      cooldown: 26,
      title: "Ceza kâğıdı",
      text: "Arabanın camında bir park cezası var.",
      choices: (s) => [c("Öde (indirimli 15 gün)", "₺1.200", { cost: 1200, stress: 1 }), c("İtiraz et", "Şans %25", { chance: { p: 0.25, win: { m: 3 }, lose: { cost: 1600, stress: 3 }, winT: "İtirazın kabul edildi", winP: "Levha gerçekten görünmüyormuş.", loseT: "Reddedildi", loseP: "Üstüne gecikme bedeli eklendi." } })],
    }),
    E("concertTicket", "sokak", {
      cooldown: 26,
      title: "Konser bileti",
      text: "Sevdiğin grup şehre geliyor. Biletler satışa çıktı.",
      choices: (s) => [
        c("Bilet al", "₺2.200", { cost: 2200, m: 6, stress: -5, bond: s.partner ? 3 : 0 }),
        c("Vazgeç", "", { m: -1 }),
      ],
    }),
    E("rainNoUmbrella", "sokak", {
      title: "Sağanak",
      text: "Gökyüzü bir anda karardı; şemsiyen yok.",
      choices: [
        c("Bir şemsiye al", "₺250", { cost: 250 }),
        c("Islanarak koş", "Hasta olabilirsin.", { chance: { p: 0.7, win: { m: 1 }, lose: { h: -4, stress: 2 }, winT: "Bir şey olmadı", winP: "Eve sırılsıklam ama keyifli vardın.", loseT: "Grip oldun", loseP: "İki gün ateşle yattın." } }),
      ],
    }),
    // ---------- İş yeri ----------
    E("meetingOverrun", "is", {
      when: (s) => ["office", "memur", "teacher"].includes(s.job),
      title: "Toplantı uzadı",
      text: "17:00'de bitmesi gereken toplantı 18:30'a sarktı.",
      choices: [
        c("Sessizce dinle", "", { stress: 2, perf: 1 }),
        c("Fikir söyle, toparla", "Şans %55", { chance: { p: 0.55, win: { perf: 4, m: 2 }, lose: { perf: -1, stress: 2 }, winT: "Toplantı bitti", winP: "Herkes sana minnettar.", loseT: "Yeni bir gündem açıldı", loseP: "Toplantı bir saat daha sürdü." } }),
      ],
    }),
    E("coworkerBirthday", "is", {
      when: working,
      title: "İş yerinde doğum günü",
      text: "Bir iş arkadaşının doğum günü; pasta için para toplanıyor.",
      choices: [
        c("Katıl", "₺300", { cost: 300, people: 1, perf: 1 }),
        c("Kibarca geç", "", { people: -0.5 }),
      ],
    }),
    E("bossPraise", "is", {
      when: working,
      title: "Amirin yanına çağırdı",
      text: "Amirin seni odasına çağırdı. Yüzünden ne olduğu anlaşılmıyor.",
      choices: [
        c("Git", "Kalbin hızlı atıyor", { chance: { p: 0.65, win: { perf: 5, m: 4, stress: -2 }, lose: { perf: -3, stress: 6 }, winT: "Teşekkür etti", winP: "Son işin için seni övdü; ekibe örnek gösterdi.", loseT: "Bir hata bulmuş", loseP: "Geçen haftaki rapordaki hatayı düzeltmeni istedi." } }),
      ],
    }),
    E("lunchBreak", "is", {
      when: working,
      title: "Öğle arası",
      text: "Yemekhane mi, dışarıda esnaf lokantası mı?",
      choices: [
        c("Yemekhane", "Ücretsiz", {}),
        c("Esnaf lokantası", "₺450 · arkadaşlarla", { cost: 450, people: 1, m: 2 }),
        c("Masada atıştır, çalış", "", { perf: 1, stress: 1 }),
      ],
    }),
    E("factoryHeat", "is", {
      when: (s) => s.job === "factory" && s.week >= 24 && s.week <= 36,
      title: "Sıcak hat",
      text: "Fabrikada sıcaklık 38 derece. Bantta su molası verilmiyor.",
      choices: [
        c("Ustabaşıyla konuş", "Şans %50", { chance: { p: 0.5, win: { people: 2, stress: -2 }, lose: { perf: -3, stress: 3 }, winT: "Mola verildi", winP: "Herkes sana teşekkür etti.", loseT: "\"İşine bak\"", loseP: "Ustabaşı seni not etti." } }),
        c("Dayan", "", { h: -2, stress: 3 }),
      ],
    }),
    E("cafeTip", "is", {
      when: (s) => s.job === "cafe",
      title: "Cömert müşteri",
      text: "Bir müşteri kahvesini çok beğendi, büyük bir bahşiş bıraktı.",
      choices: [
        c("Bahşişi ekiple paylaş", "₺500 sana", { cash: 500, people: 1 }),
        c("Kendine sakla", "₺1.200", { cash: 1200, people: -0.5 }),
      ],
    }),
    E("nurseDouble", "is", {
      when: (s) => s.job === "nurse",
      title: "Acilde yoğunluk",
      text: "Bir trafik kazası; acil doldu taştı. Nöbetin bitti ama ekip eksik.",
      choices: [
        c("Kal, yardım et", "Ek ödeme, yorgunluk", { cash: 1800, stress: 6, h: -2, sk: { acil: 0.6 } }),
        c("Eve git", "", { stress: 1 }),
      ],
    }),
    E("studentCanteen", "is", {
      when: (s) => s.edu === "ogrenci" && s.job === "none",
      title: "Kantinde",
      text: "Dersler arası kantin dolu. Sınıftan biri yanına oturmak istiyor.",
      choices: [
        c("Sohbet et", "Çevre +", { people: 1.5, m: 2, cost: 80 }),
        c("Not çalış", "Beceri +", { skill: 1 }),
      ],
    }),
  );
})(globalThis.HS || (globalThis.HS = {}));
