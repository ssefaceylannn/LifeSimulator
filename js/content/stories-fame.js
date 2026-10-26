// Şöhret yolu ve "kirli işler" hikâyeleri (ön ek: "f_").
// Şöhret (s.fame 0-100, fx fame) birbirini besler: viral bir video yarışma davetini, yarışma
// menajer teklifini, şöhret de eski bir paylaşımın faturasını büyütür.
// Gri ekonomi hikâyeleri (kayıt dışı iş, sahte fatura, tefeci, kaçak depo, rüşvet...) hiçbir
// zaman özendirilmez: her birinde "hayır de / bildir" seçeneği var; suç yolu risk, ceza,
// vicdan ve bozulan ilişkilerle ödenir.
(function (HS) {
  "use strict";
  const c = (label, hint, fx = {}) => ({ label, hint, fx });
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // ---------- Yardımcılar ----------
  const done = (s, id) => HS.done(s, id);
  const flag = (s, k) => !!(s.flags && s.flags[k]);
  const fame = (s) => s.fame || 0;
  const local = (s) => !s.abroad && !s.retired;
  const sk = (s, id) => (HS.Skills ? HS.Skills.get(s, id) : 0);
  const working = (s) => !!s.job && s.job !== "none" && s.job !== "crime" && !s.retired;
  const team = (s) => working(s) && !["music", "business"].includes(s.job);
  const motorCar = (s) => s.car && !["bisiklet", "scooter"].includes(s.car);
  // Hayata özel kader: her hikâye her hayatta açılmaz (aynı konular her oyunda tekrar etmesin)
  const fate = (s, k, n) => ((s.seed || 0) * 31 + k * 17) % 100 < n;
  const pct = (p) => "%" + Math.round(p * 100);
  const bigCity = (s) => ["İstanbul", "Ankara", "İzmir"].includes(s.city);
  const kinAlive = (s, rels) => (s.kin || []).some((k) => k.alive && rels.includes(k.rel));
  // Seni tanınır yapan şey (talk show, hayran, menajer metinleri için)
  const knownFor = (s) => {
    if (done(s, "f_yarisma") === "finalist") return "\"Sesin Yeter\" finalisti";
    if (s.job === "music" && fame(s) >= 15) return "şarkıların";
    if (flag(s, "oyuncu")) return "dizideki rolün";
    if (flag(s, "standupci")) return "stand-up klibin";
    if (flag(s, "yemekci")) return "yemek videoların";
    if (flag(s, "podcastci")) return "podcast'in";
    if (flag(s, "yazar")) return "kitabın";
    if (flag(s, "icerikUretici")) return "kısa videoların";
    return "sosyal medyadaki paylaşımların";
  };
  // Liseden arkadaş daha önce saadet zincirine/kripto tüyosuna bulaştıysa
  const liseShady = (s) => {
    const a = done(s, "l_saadet");
    const b = done(s, "l_kripto");
    return (a !== undefined && a !== "reddetti") || (b !== undefined && b !== "girmedi");
  };

  // =====================================================================
  // ŞÖHRET YOLU
  // =====================================================================

  // 1) Kısa videolar → viral → marka anlaşması → nefret yorumları / tükenmişlik
  HS.story("f_icerik", {
    when: (s) => local(s) && !flag(s, "icerikUretici"),
    minAge: 18,
    maxAge: 50,
    weight: 0.5,
    room: "salon",
    title: "On beş saniyelik video",
    text: (s, h) => {
      const konu = s.job === "cafe" ? "kafede latte sanatını yüzüne gözüne bulaştırdığın" : s.job === "factory" ? "vardiya çıkışı servisi kaçırıp koştuğun" : s.edu === "ogrenci" ? "yurtta tek tencereyle üç öğün yaptığın" : "mahallenin kedisinin bakkala her sabah selam verdiği";
      return "Telefonla çektiğin, " + konu + " o kısa video bir gecede " + h.pick(["38", "42", "51"]) + " bin kez izlenmiş. Yorumlarda \"devamı gelsin!\" yazanlar var. Kafanda bir ses: \"Ya bu iş olursa?\"";
    },
    choices: (s, h) => [
      c("Her gün bir video çek", "Pazarlama + · stres +", { sk: { pazarlama: 1 }, stress: 3, set: { tempo: "gunluk" }, go: "viral" }),
      c("Haftada bir, keyfine göre", "Hafif tempo", { m: 2, set: { tempo: "hafta" }, go: "viral" }),
      c("Bir kerelik şanstı, hesabı kapat", "Huzur", { m: 1, end: "kapatti" }),
    ],
    steps: {
      viral: {
        gap: 4,
        title: "Algoritma kapıyı aralıyor",
        text: (s, h) => (h.d.tempo === "gunluk" ? "Bir ayda otuz video. " : "Dört video, dördü de özenli. ") + "Takipçin " + h.pick(["8", "11", "14"]) + " bine çıktı. Herkes aynı trend sesle aynı dansı yapıyor; sen ise kendi tarzının oturduğunu hissediyorsun.",
        choices: (s, h) => {
          const p = clamp((h.d.tempo === "gunluk" ? 0.5 : 0.38) + sk(s, "pazarlama") / 120, 0.25, 0.8);
          return [
            c("Trend akıma katıl", "Şans " + pct(p), { chance: { p, win: { fame: 5, people: 3, esteem: 3, flag: "icerikUretici", go: "marka" }, lose: { m: -3, end: "az" }, winT: "Patladı!", winP: "Video iki milyonu geçti. Sokakta biri \"sen o değil misin?\" diye sordu.", loseT: "Kalabalıkta kayboldu", loseP: "Aynı sesle yüz bin video daha vardı. Seninki onların arasında boğuldu." } }),
            c("Kendi tarzını koru", "Şans " + pct(p - 0.1) + " · tutarsa daha sağlam", { chance: { p: p - 0.1, win: { fame: 6, esteem: 5, people: 2, flag: "icerikUretici", go: "marka" }, lose: { esteem: 1, m: -1, end: "az" }, winT: "Kendi sesinle viral", winP: "Yorumlarda \"bunu kimse böyle anlatmamıştı\" yazıyor.", loseT: "Sadık ama küçük", loseP: "Üç bin kişi seni gerçekten seviyor; algoritma sevmiyor." } }),
          ];
        },
      },
      marka: {
        gap: 3,
        title: "Gelen kutusunda iş birliği teklifleri",
        text: (s, h) => "İki teklif var. Biri adını hiç duymadığın bir \"detoks çayı\": " + h.tl(25000) + ", tek video, \"üç günde beş kilo\" demen isteniyor. Diğeri semtteki bağımsız bir kitapçı: " + h.tl(6000) + ", istediğin gibi anlat.",
        choices: (s, h) => [
          c("Detoks çayını tanıt", h.tl(25000) + " · güven riski", { cash: 25000, fame: 1, esteem: -2, set: { detoks: 1 }, go: "yorum" }),
          c("Kitapçıyı tanıt", h.tl(6000) + " · içten", { cash: 6000, fame: 2, esteem: 2, people: 1, go: "yorum" }),
          c("Reklam almam", "Özgüven + · gelir yok", { esteem: 3, m: 1, go: "yorum" }),
        ],
      },
      yorum: {
        gap: 4,
        title: "Yorumlar zehirleniyor",
        text: (s, h) => (h.d.detoks ? "Bir diyetisyen detoks çayı videonu \"tehlikeli yanlış bilgi\" diye paylaştı. " : "Takipçin arttıkça yorumların tonu değişti. ") + "Gece ikide hâlâ yorum okuyorsun; biri dişlerine, biri sesine, biri ailene laf etmiş. Sabah kamerayı açınca gülümsemek zor geliyor.",
        choices: (s, h) => [
          c("Bir ay mola ver, telefonu kapat", "Şöhret − · stres −−", { fame: -2, stress: -8, m: 4, end: "mola" }),
          c("Durmadan devam", "Şöhret + · tükenmişlik", { fame: 3, stress: 10, sleep: 3, h: -2, end: "tukenmis" }),
          c("Yorumlara yanıt ver, topluluk kur", "İletişim · şans %50", { sk: { iletisim: 2 }, chance: { p: 0.5, win: { fame: 3, people: 4, m: 3, end: "topluluk" }, lose: { fame: -1, m: -6, stress: 6, end: "tukenmis" }, winT: "Yorumlar ısındı", winP: "Kötü yorumlara takipçilerin senden önce cevap vermeye başladı.", loseT: "Tartışma büyüdü", loseP: "Her cevap yeni bir kavga açtı." } }),
          h.d.detoks ? c("Reklamı kaldır, açıkça özür dile", "Şöhret − · özgüven +", { fame: -1, esteem: 3, m: 1, end: "ozur" }) : null,
        ],
      },
    },
  });

  // 2) Televizyon ses yarışması (enstrüman/sahne becerisi ya da müzisyenlik)
  HS.story("f_yarisma", {
    when: (s) => local(s) && (s.job === "music" || sk(s, "enstruman") >= 10 || sk(s, "sahne") >= 8 || done(s, "l_gitar") === "sahne"),
    minAge: 18,
    maxAge: 45,
    weight: (s) => 0.4 + (flag(s, "icerikUretici") ? 0.3 : 0) + (s.job === "music" ? 0.2 : 0),
    room: "salon",
    title: "\"Sesin Yeter\" ön elemeleri",
    text: (s, h) => {
      let t = "Televizyonun en çok izlenen ses yarışması \"Sesin Yeter\" yeni sezon için ön eleme yapıyor. ";
      if (flag(s, "icerikUretici")) t += "Üstelik yapımcılar videolarını görmüş; sana doğrudan mesaj attılar: \"Ön elemeyi atla, jüriye çık.\" ";
      else if (done(s, "l_gitar") === "sahne") t += "Açık mikrofon gecesindeki alkış hâlâ kulağında. ";
      if (s.city !== "İstanbul") t += "Çekimler İstanbul'da; yol ve otel sana ait.";
      else t += "Çekimler stüdyoda, metroyla kırk dakika.";
      return t;
    },
    choices: (s, h) => {
      const yol = s.city === "İstanbul" ? 1500 : 7000;
      return [
        c("Ön elemeye git", h.tl(yol) + " · binlerce aday", { cost: yol, stress: 3, go: "juri" }),
        flag(s, "icerikUretici") ? c("Davetle doğrudan jüriye çık", "Kestirme · beklenti yüksek", { set: { davet: 1 }, stress: 4, go: "juri" }) : null,
        c("Benim işim değil", "Sahne bekleyebilir", { m: -1, end: "basvurmadi" }),
      ];
    },
    steps: {
      juri: {
        gap: 3,
        title: "Arkası dönük dört koltuk",
        text: (s, h) => "Kulisteki sunucu omzuna dokundu: \"Otuz saniye. Bir koltuk dönerse devam.\" Işıklar yandı; dört jüri koltuğu arkası dönük bekliyor.",
        choices: (s, h) => {
          const p = clamp(0.25 + (sk(s, "sahne") + sk(s, "enstruman")) / 150 + (s.job === "music" ? 0.15 : 0) + (h.d.davet ? 0.08 : 0), 0.2, 0.85);
          return [
            c("Kendi besteni söyle", "Şans " + pct(p - 0.05) + " · akılda kalır", { chance: { p: p - 0.05, win: { fame: 6, esteem: 6, sk: { sahne: 2, beste: 1 }, set: { beste: 1 }, go: "final" }, lose: { fame: 1, m: -6, esteem: -4, end: "elendi" }, winT: "Üç koltuk döndü!", winP: "Jüriden biri \"bu şarkı kimin?\" diye sordu. \"Benim.\"", loseT: "Hiçbir koltuk dönmedi", loseP: "Kamera arkasında biri \"cesurdu ama\" dedi." } }),
            c("Herkesin bildiği bir türküyü söyle", "Şans " + pct(p), { chance: { p, win: { fame: 5, esteem: 4, sk: { sahne: 2 }, go: "final" }, lose: { fame: 1, m: -5, esteem: -3, end: "elendi" }, winT: "Bir koltuk döndü", winP: "Son saniyede. Ama döndü.", loseT: "Koltuklar kıpırdamadı", loseP: "Teşekkür edip sahneden indin." } }),
            c("Son anda vazgeç", "Moral −", { m: -4, esteem: -3, end: "vazgecti" }),
          ];
        },
      },
      final: {
        gap: 4,
        title: "Canlı yayın haftası",
        text: (s, h) => "Yapım ekibi canlı yayın öncesi bir \"hayat hikâyesi\" filmi çekmek istiyor. Senaryoyu okudun: yaşamadığın bir yoksulluk, hiç olmayan bir küslük. \"Seyirci ağlamazsa oy vermez\" diyorlar. Bir de sözleşmede küçük bir madde var: üç yıl boyunca tüm kayıt hakları yapımda.",
        choices: (s, h) => [
          c("Senaryolu hikâyeyi oyna", "Şans %55 · vicdan −", { esteem: -3, fame: 2, chance: { p: 0.55, win: { fame: 6, cash: 40000, m: 4, end: "finalist" }, lose: { fame: 2, m: -3, end: "yariFinal" }, winT: "Finale kaldın", winP: "Oylar yağdı. Annen \"o hikâye ne öyle?\" diye aradı.", loseT: "Yarı finalde veda", loseP: "Film ağlattı ama oylar başkasına gitti." } }),
          c("\"Hikâyem bana ait\" de, sadece şarkı söyle", "Şans %40 · özgüven +", { esteem: 3, chance: { p: 0.4, win: { fame: 7, cash: 40000, m: 6, end: "finalist" }, lose: { fame: 2, m: -2, end: "yariFinal" }, winT: "Sadece sesinle finale", winP: "Jüri: \"Bu sezonun en dürüst performansı.\"", loseT: "Yarı finalde veda", loseP: "Ama sahneden başın dik indin." } }),
          c("Hak devri maddesini görünce çekil", "Özgürlük · fırsat kaybı", { esteem: 4, fame: 1, sk: { muzakere: 1 }, end: "cekildi" }),
        ],
      },
    },
  });

  // 3) Figüranlık → tek replik → oyuncu ajansı (peşin para isteyen sahte ajans tuzağı)
  HS.story("f_figuran", {
    when: (s) => local(s) && bigCity(s),
    minAge: 18,
    maxAge: 70,
    weight: 0.45,
    room: "sokak",
    title: "\"Dizi setine figüran aranıyor\"",
    text: (s, h) => "Mahalle grubunda bir ilan: \"Polisiye dizi için figüran, günlük " + h.tl(1800) + ", sabah 06.00 servis, yemek bizden.\" " + (s.city === "İstanbul" ? "Set Beykoz'da bir köşkte." : "Set şehrin dışında, eski bir fabrikada."),
    choices: (s, h) => [
      c("Git, bir gün dene", h.tl(1800) + " · erken kalkış", { cash: 1800, sleep: 2, go: "set" }),
      c("Uğraşamam", "Uyku daha tatlı", { m: 1, end: "gitmedi" }),
    ],
    steps: {
      set: {
        gap: 3,
        title: "\"Repliği olan biri lazım!\"",
        text: (s, h) => "Üçüncü set gününde, karakol sahnesinde replik söyleyecek oyuncu gelmedi. Yönetmen figüranlara döndü: \"Tek cümle: 'Komiserim, kapı zaten açıktı!' Kim söyler?\"",
        choices: (s, h) => {
          const p = clamp(0.35 + sk(s, "sahne") / 80 + sk(s, "iletisim") / 150, 0.3, 0.85);
          return [
            c("Elini kaldır", "Şans " + pct(p), { chance: { p, win: { fame: 2, cash: 5000, esteem: 4, sk: { sahne: 2 }, go: "ajans" }, lose: { m: -3, esteem: -2, end: "figuran" }, winT: "Tek çekimde tamam", winP: "Yönetmen \"bu yüzü not alın\" dedi.", loseT: "Yedi tekrar", loseP: "Sekizincide repliği başkasına verdiler." } }),
            c("Arka planda kal, yevmiyeni al", h.tl(1800), { cash: 1800, end: "figuran" }),
          ];
        },
      },
      ajans: {
        gap: 4,
        title: "\"Yıldız Cast\" arıyor",
        text: (s, h) => "Bir oyuncu ajansı aradı: \"Seni kataloğumuza alalım. Sadece portfolyo çekimi ve kayıt ücreti, " + h.tl(15000) + " peşin. Sonra roller yağar.\" Setteki eski figüranlar \"peşin para isteyen ajanstan kaç\" diyordu.",
        choices: (s, h) => [
          c("Peşin öde", h.tl(15000) + " · şans %25", { cost: 15000, chance: { p: 0.25, win: { fame: 3, cash: 20000, end: "rol" }, lose: { m: -6, esteem: -3, end: "dolandirildi" }, winT: "Gerçekmiş", winP: "Bir reklam filminde küçük bir rol geldi.", loseT: "Telefon kapalı", loseP: "Ofis diye gittiğin adreste bir kırtasiye var." } }),
          c("Araştır: setteki oyunculara, sendikaya sor", "İletişim + · doğru ajansı bul", { sk: { iletisim: 1 }, people: 2, go: "gercek" }),
          c("Bu iş bana göre değil", "Hatıra kalsın", { m: 1, end: "birakti" }),
        ],
      },
      gercek: {
        gap: 3,
        title: "Komisyonla çalışan ajans",
        text: (s, h) => "Gerçek bir ajans buldun: peşin para yok, yalnızca kazandığın işten %20 komisyon. İlk teklif: bir dizide sekiz bölüm sürecek küçük bir rol, \"kafedeki garson\".",
        choices: (s, h) => [
          c("Rolü al", "Şöhret + · çekim temposu", { fame: 4, cash: 30000, stress: 4, sk: { sahne: 3 }, flag: "oyuncu", end: "rol" }),
          working(s) ? c("Sadece hafta sonu çekimlerini kabul et", "Yarım rol · uyku −", { fame: 2, cash: 12000, sleep: 3, flag: "oyuncu", end: "yanRol" }) : null,
          c("Teşekkür et, şimdilik değil", "Kapı açık kalır", { esteem: 1, end: "birakti" }),
        ],
      },
    },
  });

  // 4) En yakın arkadaşla podcast
  HS.story("f_podcast", {
    when: (s) => local(s) && fate(s, 1, 65),
    minAge: 20,
    maxAge: 60,
    weight: 0.4,
    room: "salon",
    title: (s, h) => h.cast("enYakin").name + " ile podcast",
    text: (s, h) => h.cast("enYakin").name + " yine saatlerce konuştuğunuz bir akşamın sonunda dedi ki: \"Biz bunu bedavaya yapıyoruz. Kaydetsek ya?\" İyi bir mikrofon seti " + h.tl(7500) + ".",
    choices: (s, h) => [
      c("Mikrofon al, ciddi başla", h.tl(7500) + " · ses kalitesi", { cost: 7500, rel: { enYakin: 5 }, go: "bolum" }),
      c("Telefonla kaydedelim", "Bedava · cızırtılı", { rel: { enYakin: 3 }, set: { ucuz: 1 }, go: "bolum" }),
      c("Sen yap, ben dinlerim", "İlişki az −", { rel: { enYakin: -2 }, end: "dinleyici" }),
    ],
    steps: {
      bolum: {
        gap: 5,
        title: "On bölüm, iki yüz dinleyici",
        text: (s, h) => (h.d.ucuz ? "Yorumların yarısı \"sesiniz yankılanıyor\". " : "Ses tertemiz ama dinleyici yavaş artıyor. ") + h.cast("enYakin").name + " bir fikir attı: \"Mahallede herkesin tanıdığı o kavgacı esnafı çağıralım, izlenme patlar.\"",
        choices: (s, h) => [
          c("Düzenli yayın: her pazartesi", "Disiplin · yavaş büyüme", { sk: { sunum: 2, disiplin: 1 }, fame: 2, go: "sponsor" }),
          c("Kavgacı konuğu çağır", "Şans %50", { chance: { p: 0.5, win: { fame: 5, people: 2, set: { tartisma: 1 }, go: "sponsor" }, lose: { fame: -1, m: -3, rel: { enYakin: -4 }, end: "kavga" }, winT: "Bölüm dilden dile", winP: "Esnaf mikrofonda tüm semtle kavga etti; dinlenme on katına çıktı.", loseT: "Bölümü yayınlayamadınız", loseP: "Konuk kayıttan sonra \"yayınlarsanız dava açarım\" dedi." } }),
        ],
      },
      sponsor: {
        gap: 5,
        title: "İlk sponsor",
        text: (s, h) => "Bir online kurs platformu aylık " + h.tl(20000) + " sponsorluk teklif etti. " + h.cast("enYakin").name + " \"yarı yarıya\" diyor; ama kurgu, yükleme ve sosyal medya hep sende." + (h.d.tartisma ? " Tartışmalı bölümden sonra dinleyiciler biraz da kavga bekliyor." : ""),
        choices: (s, h) => [
          c("Yarı yarıya böl", h.tl(10000) + " · dostluk +", { cash: 10000, fame: 2, rel: { enYakin: 6 }, flag: "podcastci", end: "buyudu" }),
          c("\"Emeğim daha çok, %70 benim\"", h.tl(14000) + " · ilişki −−", { cash: 14000, fame: 1, rel: { enYakin: -12 }, flag: "podcastci", end: "bozuldu" }),
          c("Sponsorsuz, dinleyici desteğiyle", "Bağımsız · az para", { cash: 3000, fame: 3, esteem: 2, flag: "podcastci", end: "bagimsiz" }),
        ],
      },
    },
  });

  // 5) Stand-up: açık mikrofon → kulüp → klip (eski paylaşım skandalıyla bağlantılı)
  HS.story("f_standup", {
    when: (s) => local(s) && (fate(s, 2, 60) || done(s, "l_gitar") === "sahne"),
    minAge: 18,
    maxAge: 55,
    weight: (s) => 0.35 + (done(s, "l_gitar") === "sahne" ? 0.2 : 0) + (sk(s, "sahne") > 10 ? 0.1 : 0),
    room: "sokak",
    title: "Stand-up açık mikrofon",
    text: (s, h) => "Kadıköy tarzı küçük bir bar her perşembe \"açık mikrofon\" yapıyor: beş dakika, bir mikrofon, otuz yabancı." + (done(s, "l_gitar") === "sahne" ? " Gitarla çıktığın sahneyi biliyorsun; ama bu sefer elinde saklanacak bir şey yok." : " Arkadaşların seni yıllardır \"en komik kişi\" ilan ediyor."),
    choices: (s, h) => [
      c("Aile malzemesiyle yaz", "Bayram sofraları, teyzeler", { set: { konu: "aile" }, go: "sahne" }),
      working(s) ? c("İş yeri malzemesiyle yaz", "Toplantılar, mesai", { set: { konu: "is" }, go: "sahne" }) : null,
      c("Bu hafta seyirci ol", "Ortamı tanı", { m: 2, people: 1, end: "seyirci" }),
    ],
    steps: {
      sahne: {
        gap: 2,
        title: "Beş dakika",
        text: (s, h) => "Senden önceki komedyen sessizlikte boğuldu. Sunucu adını okudu. Mikrofon biraz yüksek; " + (h.d.konu === "is" ? "ilk espri pazartesi toplantıları üzerine." : "ilk espri teyzenin düğündeki dansı üzerine."),
        choices: (s, h) => {
          const p = clamp(0.35 + sk(s, "sahne") / 80 + sk(s, "iletisim") / 120, 0.25, 0.8);
          return [
            c("Çık ve konuş", "Şans " + pct(p), { chance: { p, win: { fame: 2, esteem: 6, m: 6, sk: { sahne: 2 }, go: "kulup" }, lose: { esteem: -5, m: -5, go: "ikinci" }, winT: "Salon güldü", winP: "Üçüncü espride biri masaya vurarak güldü.", loseT: "Cırcır böcekleri", loseP: "Kimse gülmedi. Biri bardağını devirdi; en büyük kahkaha ona geldi." } }),
            c("Son anda adını sildir", "Moral −", { m: -3, esteem: -2, end: "cekildi" }),
          ];
        },
      },
      ikinci: {
        gap: 3,
        title: "Bir daha mı?",
        text: "Herkes \"ilk sahnede herkes düşer\" diyor. Perşembe yine geliyor.",
        choices: [
          c("Tekrar çık", "Şans %55", { chance: { p: 0.55, win: { fame: 1, esteem: 5, sk: { sahne: 2 }, go: "kulup" }, lose: { m: -4, end: "birakti" }, winT: "İkinci sefer tuttu", winP: "Bu kez sessizliği esprinin parçası yaptın.", loseT: "Yine olmadı", loseP: "Mikrofonu bıraktın; belki bir gün." } }),
          c("Bırak, komiklik arkadaş masasında kalsın", "Huzur", { m: -1, end: "birakti" }),
        ],
      },
      kulup: {
        gap: 4,
        title: "Kulüpten teklif",
        text: (s, h) => "Bir komedi kulübü cuma geceleri yirmi dakikalık ücretli set teklif etti: gecelik " + h.tl(4000) + ". Seyircilerden biri setini çekmiş; içinde bir espri var ki bir meslek grubunu fena hâlde iğneliyor. Klip paylaşılırsa ya uçar ya da başını yakar.",
        choices: (s, h) => [
          c("Klibi olduğu gibi paylaş", "Şöhret ++ · ileride sorun çıkabilir", { fame: 4, cash: 4000, set: { klip: 1 }, flag: "standupci", end: "kulup" }),
          c("Riskli espriyi çıkar, temiz set", "Şöhret + · içi rahat", { fame: 2, cash: 4000, esteem: 2, flag: "standupci", end: "temiz" }),
        ],
      },
    },
  });

  // 6) Kitap: tanınmışsan anı kitabı teklifi, değilsen roman dosyası
  HS.story("f_kitap", {
    when: (s) => !s.retired && (fame(s) >= 12 || sk(s, "iletisim") >= 25 || flag(s, "podcastci") || done(s, "l_tarifDefteri") === "kitap"),
    minAge: 24,
    maxAge: 75,
    weight: 0.35,
    room: "salon",
    title: (s) => (fame(s) >= 15 ? "Anı kitabı teklifi" : "Çekmecedeki roman"),
    text: (s, h) => {
      if (fame(s) >= 15) return "\"Mavi Kanat Yayınları\" aradı: " + knownFor(s) + " sayesinde adın biliniyor, hayat hikâyeni kitap yapmak istiyorlar. Avans " + h.tl(60000) + ". \"İstersen hayalet yazar verelim, sen sadece anlat.\"";
      return (flag(s, "podcastci") ? "Podcast'te anlattığın hikâyeler birikti; " : "") + "Gecelerin bir dosyada birikti: iki yüz sayfalık bir roman. Bir yayınevi \"ortak yayın\" teklif etti: baskı masrafının " + h.tl(35000) + " kısmını sen ödüyorsun.";
    },
    choices: (s, h) =>
      fame(s) >= 15
        ? [
            c("Hayalet yazarla, hızlıca", h.tl(60000) + " · biraz senin gibi olmayabilir", { cash: 60000, fame: 2, esteem: -2, set: { tur: "hayalet" }, go: "cikis" }),
            c("Kendin yaz", "Gece mesaisi · iletişim +", { cash: 30000, sk: { iletisim: 2 }, stress: 5, sleep: 2, set: { tur: "kendi" }, go: "cikis" }),
            c("Hayatımı satmam", "Mahremiyet", { esteem: 2, end: "reddetti" }),
          ]
        : [
            c("Ortak yayına öde", h.tl(35000) + " · kitabın basılır", { cost: 35000, set: { tur: "parali" }, go: "cikis" }),
            c("Gerçek yayınevlerine dosya gönder", "Şans %20 · sabır", { chance: { p: 0.2, win: { cash: 15000, esteem: 5, set: { tur: "yayinevi" }, go: "cikis" }, lose: { m: -4, sk: { iletisim: 1 }, end: "ret" }, winT: "Kabul mektubu!", winP: "Küçük ama saygın bir yayınevi dosyanı seçti.", loseT: "On iki ret", loseP: "Biri \"dilin güzel, kurgu zayıf\" diye not düşmüş. O not bile değerli." } }),
            c("Çekmecede kalsın", "Belki bir gün", { m: -1, end: "cekmece" }),
          ],
    steps: {
      cikis: {
        gap: 6,
        title: "Kitap raflarda",
        text: (s, h) => {
          if (h.d.tur === "hayalet") return "Kitap çıktı. Okurken bir bölümde durdun: hayalet yazar sana hiç yaşamadığın bir \"babamla barıştığımız gece\" yazmış. İmza günü cumartesi.";
          if (h.d.tur === "parali") return "Beş yüz kitap koliler hâlinde eve geldi. Yayınevinin \"dağıtım\" dediği şey, iki kitapçının en alt rafı.";
          return "Kitap çıktı; kapağında senin adın. Kitapçı vitrininde görünce bir an durdun. İmza günü cumartesi.";
        },
        choices: (s, h) => {
          const p = fame(s) >= 15 ? 0.7 : h.d.tur === "parali" ? 0.25 : 0.4;
          return [
            c("İmza gününe çık", "Şans " + pct(p), { chance: { p, win: { fame: 3, people: 4, m: 6, cash: h.d.tur === "parali" ? 8000 : 10000, flag: "yazar", end: "basari" }, lose: { m: -4, flag: "yazar", end: "sessiz" }, winT: "Kuyruk kapıya kadar", winP: "Bir okur \"bu kitap bana iyi geldi\" dedi. Bunun parası yok.", loseT: "Üç okur, bir de annen", loseP: "Annen iki kitap aldı." } }),
            c("Sosyal medyada tanıt", "Pazarlama +", { sk: { pazarlama: 2 }, fame: 1, cash: 3000, flag: "yazar", end: "tanitti" }),
            h.d.tur === "hayalet" ? c("Bir röportajda o bölümün uydurma olduğunu söyle", "Dürüstlük · şöhret az −", { esteem: 4, fame: -1, flag: "yazar", end: "durust" }) : null,
          ];
        },
      },
    },
  });

  // 7) Yemek hesabı (ninenin tarif defteri bağlantılı)
  HS.story("f_yemek", {
    when: (s) => local(s) && (fate(s, 3, 55) || ["viral", "kitap", "paylasti"].includes(done(s, "l_tarifDefteri"))),
    minAge: 18,
    maxAge: 70,
    weight: (s) => (["viral", "kitap", "paylasti"].includes(done(s, "l_tarifDefteri")) ? 0.65 : 0.3),
    room: "mutfak",
    title: "Yemek hesabı açmak",
    text: (s, h) => {
      const t = done(s, "l_tarifDefteri");
      if (t === "viral") return "Revani videosundan sonra herkes \"başka tarif yok mu?\" diye soruyor. Tarif defteri hâlâ mutfak dolabında; bir yemek hesabı açmanın tam zamanı.";
      if (t === "kitap" || t === "paylasti") return "Tarif defterinden bastırdığın/paylaştığın tarifler akrabalar arasında dolaşıyor. \"Bunları herkes görsün\" diyorlar.";
      return "Akşam yaptığın mercimek köftesinin fotoğrafına arkadaşlar \"tarifi ver\" diye yorum yağdırdı. Belki ayrı bir yemek hesabı açmalısın.";
    },
    choices: (s, h) => [
      c("Ev yemekleri, ucuz tarifler", "Pazarlama +", { sk: { pazarlama: 1 }, set: { tarz: "ev" }, go: "buyume" }),
      c("Mekân incelemeleri yap", h.tl(3000) + " · ilk birkaç hesap senden", { cost: 3000, set: { tarz: "mekan" }, go: "buyume" }),
      c("Sadece kendime pişiririm", "Huzurlu mutfak", { m: 1, end: "yok" }),
    ],
    steps: {
      buyume: {
        gap: 5,
        title: (s, h) => (h.d.tarz === "mekan" ? "\"Bizden olsun\"" : "\"Haftalık bütçe menüsü\""),
        text: (s, h) =>
          h.d.tarz === "mekan"
            ? "Takipçin yirmi bine yaklaştı. Yeni açılan bir kebapçı mesaj attı: \"Gelin yiyin, hesap bizden; tek ricamız güzel yazmanız.\""
            : "\"Dört kişilik aile, haftalık " + h.tl(2500) + " ile yedi akşam\" serin tuttu. Bir sonraki adım ne olsun?",
        choices: (s, h) =>
          h.d.tarz === "mekan"
            ? [
                c("Bedava ye, güzel yaz", "Şöhret + · güven riski", { fame: 2, esteem: -3, set: { bedava: 1 }, go: "olay" }),
                c("Hesabı öde, dürüst yaz", h.tl(2500) + " · güvenilirlik", { cost: 2500, fame: 3, esteem: 3, go: "olay" }),
              ]
            : [
                c("Seriyi büyüt", "Şöhret + · pazarlama +", { fame: 3, sk: { pazarlama: 1 }, go: "olay" }),
                c("Canlı yayında pişir", "Şans %50", { chance: { p: 0.5, win: { fame: 4, people: 2, go: "olay" }, lose: { fame: 1, m: -3, go: "olay" }, winT: "Canlı yayın bayram yeri", winP: "Bin kişi aynı anda soğan doğradı.", loseT: "Tencere taştı", loseP: "Yanık kokusu ekrandan bile geliyordu. Ama samimiydi." } }),
              ],
      },
      olay: {
        gap: 4,
        title: (s, h) => (h.d.bedava ? "Hijyen cezası haberi" : "Sabah programından davet"),
        text: (s, h) =>
          h.d.bedava
            ? "Övdüğün kebapçıya belediye hijyen cezası kesti; haber sitesi senin \"mükemmel, tertemiz\" videonu da habere eklemiş. Takipçiler \"bedava yemek karşılığı mı yazdın?\" diye soruyor."
            : "Bir sabah programı seni yemek köşesine çağırdı: canlı yayında on dakika, " + h.tl(8000) + " ücret. Bir yandan da mahallede \"yemek atölyesi\" açman isteniyor.",
        choices: (s, h) =>
          h.d.bedava
            ? [
                c("Açıkça özür dile, kuralını açıkla", "Şöhret − · özgüven +", { fame: -2, esteem: 2, end: "ozur" }),
                c("Videoyu sil, sus", "Şöhret −− · moral −", { fame: -4, m: -3, end: "sustu" }),
              ]
            : [
                c("Programa çık", h.tl(8000) + " · şöhret ++", { cash: 8000, fame: 4, sk: { sunum: 2 }, flag: "yemekci", end: "tv" }),
                c("Atölye aç", h.tl(12000) + " · çevre +", { cash: 12000, people: 3, sk: { pazarlama: 1 }, flag: "yemekci", end: "atolye" }),
              ],
      },
    },
  });

  // 8) İşini anlatan kanal → yöneticin öğreniyor
  HS.story("f_isKanali", {
    when: (s) => working(s) && local(s) && s.job !== "music",
    minAge: 20,
    maxAge: 60,
    weight: 0.4,
    room: "is",
    title: "\"Mesleğimin bir günü\"",
    text: (s, h) => {
      const m = { cafe: "baristalığın", factory: "fabrikada bir vardiyanın", office: "ofis hayatının", teacher: "öğretmenliğin", nurse: "hemşireliğin", memur: "devlet dairesinin", business: "esnaflığın" }[s.job] || "işinin";
      return "İnsanlar " + m + " perde arkasını merak ediyor. Bir kanal açsan: sabah rutini, ilginç anlar, sık sorulan sorular." + (done(s, "w_teslim") === "sustu" ? " Emeğinin başkasına mal edildiği o sunumdan beri bir yere anlatmak istiyorsun." : "");
    },
    choices: (s, h) => [
      c("Yüzsüz, isimsiz anlat", "Anonim · güvenli", { set: { anonim: 1 }, sk: { bilgisayar: 1 }, go: "buyume" }),
      c("Yüzünle, açıkça", "Şöhret + · görünür", { fame: 1, set: { anonim: 0 }, sk: { sunum: 1 }, go: "buyume" }),
      c("Vazgeç, iş işte kalsın", "Sınır", { m: 1, end: "yok" }),
    ],
    steps: {
      buyume: {
        gap: 5,
        when: working,
        title: "Kanal büyüyor",
        text: (s, h) => "İlk ay " + h.pick(["6", "9", "12"]) + " bin abone. En çok izlenen videolar ise iş yerindeki saçmalıkları anlattıkların. Reklam geliri de başladı: " + h.tl(4000) + ".",
        choices: (s, h) => [
          c("Eğitici içerikte kal", "Şöhret + · sakin", { fame: 2, cash: 4000, sk: { iletisim: 1 }, go: "yonetici" }),
          c("İş yeri eleştirisine yüklen", "İzlenme patlar · risk", { fame: 4, cash: 6000, set: { elestiri: 1 }, go: "yonetici" }),
        ],
      },
      yonetici: {
        gap: 3,
        when: working,
        title: "\"Bu kanal senin mi?\"",
        text: (s, h) => (team(s) ? h.cast("yonetici").name + " telefonunu masana koydu; ekranda senin kanalın." : "Müşterilerden biri videonu tanıdı ve herkese gösterdi.") + (h.d.elestiri ? " \"İçeriden bilgi sızdırmak\" kelimeleri havada." : " \"Bir konuşalım\" dedi."),
        choices: (s, h) => {
          const p = (h.d.elestiri ? 0.3 : 0.7) + (h.d.anonim ? 0.05 : 0);
          return [
            c("İzin iste, kanalı resmîleştir", "Şans " + pct(p), { chance: { p, win: { fame: 2, ...(s.company ? { perf: 3 } : {}), ...(team(s) ? { rel: { yonetici: 5 } } : {}), end: "resmi" }, lose: { ...(s.company ? { perf: -6 } : {}), ...(team(s) ? { rel: { yonetici: -10 } } : {}), stress: 6, m: -4, end: "ihtar" }, winT: "\"Kurum tanıtımına da katkı olur\"", winP: "Hatta işveren hesabında paylaşıldın.", loseT: "Yazılı ihtar", loseP: "\"Bir daha olursa tutanak tutulur.\"" } }),
            c("Kanalı kapat", "Şöhret − · huzur", { fame: -2, m: -3, end: "kapatti" }),
            c("İstifa et, tam zamanlı içerik üret", "Kumar gibi · özgüven +", { resign: "notice", fame: 3, esteem: 4, stress: 5, flag: "icerikUretici", end: "tamZaman" }),
          ];
        },
      },
    },
  });

  // 9) Hayranlar ve sınırları aşan bir hayran (güvenli, kurumsal çözümler)
  HS.story("f_hayran", {
    when: (s) => local(s) && fame(s) >= 15,
    minAge: 18,
    weight: 0.55,
    room: "sokak",
    title: "Hayran buluşması",
    text: (s, h) => "Bir AVM'de " + knownFor(s) + " için küçük bir buluşma düzenlendi. Kuyruk uzun; el yapımı bir bileklik, bir çizim, bir mektup… Aralarında, her paylaşımına ilk yorumu yapan o hesabın sahibi de var.",
    choices: (s, h) => [
      c("Herkesle fotoğraf, saatlerce", "Şöhret + · yorgunluk", { fame: 2, people: 3, h: -1, m: 4, go: "takip" }),
      c("Kısa ve kibar", "Dengeli", { fame: 1, m: 2, go: "takip" }),
      c("Buluşmayı iptal et", "Şöhret −", { fame: -2, end: "iptal" }),
    ],
    steps: {
      takip: {
        gap: 3,
        title: "Kapıcı bir not getirdi",
        text: (s, h) => "Kapıcı bir zarf getirdi: \"Biri bıraktı, sizi tanıyormuş.\" Aynı hayran. Günde kırk mesaj, her gittiğin yerin fotoğrafı yorumlarda. Henüz tehdit yok; ama sınır da yok." + (s.partner ? " " + s.partner.name + " tedirgin." : ""),
        choices: (s, h) => [
          c("Kibar ama net bir mesajla sınır çiz", "Şans %55", { chance: { p: 0.55, win: { m: 3, esteem: 2, end: "sinir" }, lose: { stress: 5, go: "koruma" }, winT: "Anladı", winP: "\"Özür dilerim, haddimi aştım.\" Mesajlar kesildi.", loseT: "Mesajlar arttı", loseP: "\"Benimle konuştun, demek ki önemsiyorsun!\"" } }),
          c("Kapıcıyı ve komşuları bilgilendir, kayıt tut", "İletişim + · komşu +", { rel: { komsu: 3 }, sk: { iletisim: 1 }, stress: 2, set: { kayit: 1 }, go: "koruma" }),
          c("Görmezden gel", "Stres +", { stress: 4, go: "koruma" }),
        ],
      },
      koruma: {
        gap: 3,
        title: "Israrlı takip",
        text: (s, h) => "Mesajlar sürüyor; dün akşam apartman önünde bekliyordu." + (h.d.kayit ? " Neyse ki tarihli ekran görüntüleri ve komşuların tanıklığı elinde." : " Elinde ne kadar delil var, emin değilsin."),
        choices: (s, h) => [
          c("Savcılığa ısrarlı takip başvurusu yap", "Şans " + (h.d.kayit ? "%85" : "%60") + " · koruma kararı", { stress: 3, chance: { p: h.d.kayit ? 0.85 : 0.6, win: { m: 6, esteem: 3, end: "koruma" }, lose: { stress: 6, m: -4, end: "suruyor" }, winT: "Uzaklaştırma kararı", winP: "Mesajlar kesildi. Kapıcı \"bir daha görmedim\" diyor.", loseT: "Dosya uzadı", loseP: "Delil yetersiz bulundu; hesaplarını gizliye aldın." } }),
          c("Hayranın ailesine ulaş, sakin bir konuşma", "Şans %50 · insani", { chance: { p: 0.5, win: { m: 4, people: 1, end: "aile" }, lose: { stress: 5, end: "suruyor" }, winT: "Ailesi destek aldı", winP: "Annesi ağlayarak teşekkür etti; oğlu/kızı tedaviye başlamış.", loseT: "Kapı yüzüne kapandı", loseP: "\"Bizim çocuğumuz öyle şey yapmaz.\"" } }),
          c("Sosyal medyadan bir süre çekil", "Şöhret − · sakinlik", { fame: -3, stress: -4, end: "cekildi" }),
        ],
      },
    },
  });

  // 10) Eski paylaşım skandalı (şöhret yükseldikçe ağırlaşır)
  HS.story("f_eskiTweet", {
    when: (s) => local(s) && fame(s) >= 8,
    minAge: 20,
    weight: (s) => 0.25 + fame(s) / 150,
    room: "salon",
    title: "On iki yıl önceki paylaşım",
    text: (s, h) => {
      const k = fame(s) >= 30;
      let t = "Biri on iki yıl önce, " + (s.age - 12 >= 14 ? s.age - 12 + " yaşındayken" : "çok gençken") + " attığın bir paylaşımı buldu: bir şehirden insanlarla dalga geçen, bugün okuyunca yüzünü kızartan bir espri.";
      if (HS.storyData(s, "f_standup").klip) t += " Stand-up klibindeki meslek esprisiyle yan yana konmuş: \"Değişmemiş.\"";
      if (done(s, "l_saadet") === "reddetti") t += " Ekran görüntüsünü ilk paylaşan hesap tanıdık: " + h.cast("liseArk").name + ".";
      t += k ? " Gündemin üst sıralarında; iş birliği yaptığın markalar sessiz." : " Henüz küçük bir çevrede dönüyor.";
      return t;
    },
    choices: (s, h) => {
      const k = fame(s) >= 30 ? 2 : 1;
      return [
        c("Hemen, samimi bir özür", "Şöhret −" + (k > 1 ? "−" : ""), { fame: -2 * k, m: -3, esteem: 1, set: { yol: "ozur" }, go: "sonra" }),
        c("\"Bağlamından koparıldı\" diye savun", "Şans %35 · ters teperse ağır", { chance: { p: 0.35, win: { fame: 1, set: { yol: "savun" }, go: "sonra" }, lose: { fame: -6 * k, m: -6, stress: 6, set: { yol: "savun" }, go: "sonra" }, winT: "Destek gördün", winP: "Takipçilerin \"12 yıl önce çocuktu\" diye arkanda durdu.", loseT: "Daha da büyüdü", loseP: "Savunma, ilk paylaşımdan daha çok tepki aldı." } }),
        c("Hesabı dondur, bekle", "Şöhret − · stres az −", { fame: -3 * k, stress: -2, set: { yol: "kacis" }, go: "sonra" }),
      ];
    },
    steps: {
      sonra: {
        gap: 4,
        title: "Fırtınanın ertesi",
        text: (s, h) => (h.d.yol === "ozur" ? "Özrün çoğu kişiye samimi geldi; yine de bazıları affetmedi. " : h.d.yol === "kacis" ? "Hesabını açtığında gündem değişmişti; ama arama motoru adınla birlikte o kelimeyi öneriyor. " : "Tartışma bitti ama izi kaldı. ") + (flag(s, "icerikUretici") || flag(s, "podcastci") ? "Bir sponsor sessizce sözleşmeyi yenilemedi." : ""),
        choices: (s, h) => [
          c("İncittiğin şehirde bir derneğe gönüllü destek", h.tl(5000) + " · telafi", { cost: 5000, people: 2, fame: 2, esteem: 3, end: "telafi" }),
          c("Bir röportajda açık açık konuş", "İletişim + · şöhret az +", { sk: { iletisim: 2 }, fame: 1, end: "konustu" }),
          c("Unutulmasını bekle", "Moral az −", { m: -1, end: "unutuldu" }),
          done(s, "l_saadet") === "reddetti" ? c(h.ek(h.cast("liseArk").name, "acc") + " arayıp yüzleş", "İlişki −− · içini dök", { rel: { liseArk: -10 }, esteem: 2, m: 1, end: "yuzlesti" }) : null,
        ],
      },
    },
  });

  // 11) Menajerlik teklifi (sömürücü şartlar; prodüktör hikâyesine bağlı)
  HS.story("f_menajer", {
    when: (s) => local(s) && (fame(s) >= 12 || (s.job === "music" && fame(s) >= 5) || done(s, "f_yarisma") === "finalist"),
    minAge: 18,
    weight: 0.5,
    room: "is",
    title: "\"Parlak Yıldız Menajerlik\"",
    text: (s, h) => {
      let t = "Takım elbiseli biri " + knownFor(s) + " yüzünden seni aradı ve masaya kalın bir sözleşme koydu: on yıl, tüm gelirlerin %40'ı, sosyal medya şifreleri onlarda, cayma bedeli " + h.tl(500000) + ". Karşılığında " + h.tl(50000) + " peşin avans.";
      const p = done(s, "w_produktor");
      if (p === "bagli" || p === "fesih") t += " Prodüktör sözleşmesinden sonra küçük puntoları okumayı öğrendin.";
      else if (p === "anlasma") t += " Avukatla yaptığın prodüktör anlaşması hâlâ iyi işliyor; bu sefer de aynı yolu deneyebilirsin.";
      return t;
    },
    choices: (s, h) => {
      const p = clamp(0.5 + sk(s, "muzakere") / 100 + (["bagli", "fesih", "anlasma"].includes(done(s, "w_produktor")) ? 0.1 : 0), 0.4, 0.85);
      return [
        c("Hemen imzala", h.tl(50000) + " avans · ağır şartlar", { cash: 50000, fame: 3, set: { imza: 1 }, go: "sonuc" }),
        c("Avukatla pazarlık et", h.tl(12000) + " · şans " + pct(p), { cost: 12000, sk: { muzakere: 3 }, chance: { p, win: { set: { imza: 2 }, esteem: 3, go: "sonuc" }, lose: { m: -2, end: "anlasmadi" }, winT: "Şartlar değişti", winP: "İki yıl, %20, şifreler sende, makul cayma bedeli.", loseT: "Masadan kalktılar", loseP: "\"Bizim şartlarımız bunlar.\" Kapı kapandı." } }),
        c("Kendi işimi kendim yönetirim", "Bağımsız · yavaş", { esteem: 3, sk: { liderlik: 1 }, end: "bagimsiz" }),
      ];
    },
    steps: {
      sonuc: {
        gap: 6,
        title: (s, h) => (h.d.imza === 1 ? "Takvim senin değil" : "İlk ortak sezon"),
        text: (s, h) =>
          h.d.imza === 1
            ? "Menajerlik seni bir çamaşır suyu reklamında dans ettirdi, üç düğüne \"sürpriz konuk\" olarak yolladı, hesabından senin dilinle konuşmayan paylaşımlar yaptı. Ödemelerin %40'ı kesildikten sonra eline geçen az; uykun hiç yok."
            : "Menajerin işleri seçerken sana soruyor. İlk sezonda üç büyük organizasyon geldi, takvimin dolu ama senin.",
        choices: (s, h) =>
          h.d.imza === 1
            ? [
                c("Fesih davası aç", h.tl(30000) + " · şans %50", { cost: 30000, chance: { p: 0.5, win: { esteem: 5, m: 4, end: "fesih" }, lose: { m: -6, stress: 6, end: "bagli" }, winT: "Mahkeme: sözleşme ahlaka aykırı", winP: "Cayma bedeli ödemeden çıktın. Şifrelerin yeniden sende.", loseT: "Dava sürüyor", loseP: "Avukat \"en az iki yıl\" diyor; sözleşme o zamana kadar geçerli." } }),
                c("Sabret, kazancı kabullen", h.tl(20000) + " · moral −", { cash: 20000, fame: 3, m: -5, stress: 6, end: "bagli" }),
              ]
            : [
                c("Organizasyonları al", h.tl(35000) + " · şöhret +", { cash: 35000, fame: 5, sk: { sahne: 1 }, stress: 3, end: "iyiAnlasma" }),
                c("Yarısını al, nefes payı kalsın", "Denge", { cash: 18000, fame: 2, m: 3, end: "iyiAnlasma" }),
              ],
      },
    },
  });

  // 12) Yardım gecesi ve bağış şeffaflığı
  HS.story("f_yardim", {
    when: (s) => local(s) && fame(s) >= 18,
    minAge: 20,
    weight: 0.45,
    room: "is",
    title: "Köy okulu için yardım gecesi",
    text: (s, h) => "Selden zarar gören bir köy okulu için yardım gecesi düzenleniyor. Organizatör, " + knownFor(s) + " yüzünden seni \"gecenin yüzü\" olarak istiyor: \"Biletler senin adınla satılır.\"",
    choices: (s, h) => [
      c("Ücretsiz katıl", "Şöhret + · moral +", { fame: 3, m: 5, people: 3, go: "hesap" }),
      c("Sadece masraflarım karşılansın", "Makul", { fame: 2, people: 1, go: "hesap" }),
      c("Takvim dolu", "Şöhret az −", { fame: -1, end: "katilmadi" }),
    ],
    steps: {
      hesap: {
        gap: 3,
        title: "Bağışlar nerede?",
        text: (s, h) => "Gece kapalı gişe geçti. Ama üç hafta sonra okul müdürü aradı: \"Bize henüz bir şey ulaşmadı.\" Organizatör ise \"masraflar çıktı, hesap yapıyoruz\" diyor.",
        choices: (s, h) => [
          c("Makbuzları kamuoyu önünde iste", "Şans %60", { stress: 3, chance: { p: 0.6, win: { fame: 3, esteem: 4, end: "seffaf" }, lose: { fame: -2, stress: 4, m: -4, end: "skandal" }, winT: "Para okula ulaştı", winP: "Baskı işe yaradı; okul makbuzları paylaştı.", loseT: "Organizatör kayıp", loseP: "Adın bir dolandırıcılık haberinde geçti; sen de mağdur olduğunu açıklamak zorunda kaldın." } }),
          c("Okulun ihtiyacını kendi cebinden karşıla", h.tl(25000) + " · gönül rahat", { cost: 25000, fame: 2, m: 6, end: "bagis" }),
          c("Sorgulama, onlar halleder", "Şans %50", { chance: { p: 0.5, win: { end: "tamam" }, lose: { fame: -5, m: -5, end: "skandal" }, winT: "Geç de olsa ulaştı", winP: "Para iki ay sonra okula yattı.", loseT: "Adın skandala karıştı", loseP: "\"Ünlü ismin yardım gecesinde paralar kayıp\" manşeti." } }),
        ],
      },
    },
  });

  // 13) Gece talk show'u
  HS.story("f_talkShow", {
    when: (s) => local(s) && fame(s) >= 20,
    minAge: 18,
    weight: 0.5,
    room: "salon",
    title: "Gece programından davet",
    text: (s, h) => "\"Gece Yarısı Sohbetleri\" programı aradı: " + knownFor(s) + " çok konuşuluyor, seni koltukta görmek istiyorlar. Canlı yayın; sunucu sivri soruları ve doğaçlama oyunlarıyla meşhur.",
    choices: (s, h) => [
      c("Hazırlan: kıyafet, kuaför, prova", h.tl(4000) + " · özgüven", { cost: 4000, sk: { sunum: 1 }, set: { haz: 1 }, go: "yayin" }),
      c("Doğaçlama git", "Ne olacaksa olsun", { go: "yayin" }),
      c("Kibarca reddet", "Kamera ışığı bekleyebilir", { end: "gitmedi" }),
    ],
    steps: {
      yayin: {
        gap: 2,
        title: "Canlı yayın, ikinci bölüm",
        text: (s, h) => {
          const e = done(s, "f_eskiTweet");
          if (e) return "Sunucu gülümsedi ve ekrana o eski paylaşımı yansıttı: \"Bunu konuşmadan geçmeyelim.\" Stüdyo bir anda sessiz.";
          return "Sunucu kartına baktı: \"Herkes merak ediyor: " + (s.partner ? "evlilik ne zaman?" : "kalbin boş mu?") + " Bir de kazancını söyler misin?\" Stüdyo gülüşüyor.";
        },
        choices: (s, h) => {
          const p = clamp((h.d.haz ? 0.6 : 0.42) + sk(s, "sunum") / 200, 0.3, 0.85);
          return [
            c("Esprili bir cevapla topu çevir", "Şans " + pct(p), { chance: { p, win: { fame: 6, sk: { sunum: 2 }, m: 5, end: "parladi" }, lose: { fame: -2, m: -4, end: "bocaladi" }, winT: "Gecenin klibi senin", winP: "Cevabın ertesi gün herkesin telefonundaydı.", loseT: "Espri havada kaldı", loseP: "Sunucu \"neyse, reklamlar\" dedi." } }),
            c("Ciddi ve dürüst cevap ver", "Şöhret + · özgüven +", { fame: 3, esteem: 3, end: "durust" }),
            c("Konuyu değiştir, şarkı/hikâye anlat", "Güvenli", { fame: 2, end: "gecistirdi" }),
          ];
        },
      },
    },
  });

  // =====================================================================
  // GRİ EKONOMİ VE KİRLİ İŞLER (her zaman "hayır" ve "bildir" seçeneği var)
  // =====================================================================

  // 1) Kayıt dışı iş / eksik sigorta bildirimi
  HS.story("f_kayitDisi", {
    when: (s) => local(s) && fate(s, 4, 55) && (s.job === "none" || s.job === "cafe" || s.job === "factory") && s.edu !== "ogrenci",
    minAge: 18,
    maxAge: 60,
    weight: 0.4,
    room: "is",
    title: "\"Sigortayı boş ver, elden vereyim\"",
    text: (s, h) =>
      s.job === "none"
        ? "Semtteki bir tekstil atölyesinin sahibi iş teklif etti: haftalık " + h.tl(8000) + ", elden, sigortasız. \"Sigorta yaparsam sana daha az kalır, iki taraf da kazanır.\""
        : "Patronun seni odasına çağırdı: \"Seni asgari ücretten göstereyim, farkı elden vereyim. Senin de vergin azalır.\" Eline her ay " + h.tl(3000) + " fazla geçecek; ama emekliliğin ve tazminatın düşük maaştan hesaplanacak.",
    choices: (s, h) => [
      c("Kabul et", (s.job === "none" ? h.tl(16000) + " ilk iki hafta" : h.tl(6000) + " ilk iki ay") + " · güvence yok", { cash: s.job === "none" ? 16000 : 6000, set: { olay: HS.rng() < 0.5 ? "kaza" : "denetim" }, go: "sonra" }),
      c("\"Sigortasız çalışmam\"", "Özgüven + · gelir yok", { esteem: 2, m: s.job === "none" ? -2 : 0, end: "reddetti" }),
      c("ALO 170'e (SGK) bildir", "Şans %60 · işyeri gerilir", { stress: 4, chance: { p: 0.6, win: { esteem: 4, m: 2, flag: "ihbarci", end: "bildirdi" }, lose: { m: -5, stress: 4, end: "bildirdi" }, winT: "Denetim geldi", winP: "Atölyedeki herkes kayda alındı. Kimse kimin aradığını bilmiyor.", loseT: "Kim aradı biliniyor", loseP: "Kayda geçildi ama patronun yüzüne bakmak artık zor." } }),
    ],
    steps: {
      sonra: {
        gap: 6,
        title: (s, h) => (h.d.olay === "kaza" ? "Makine elini sıyırdı" : "SGK müfettişi kapıda"),
        text: (s, h) =>
          h.d.olay === "kaza"
            ? "Bir anlık dalgınlık: makinenin kayışı elini sıyırdı, dikiş gerekiyor. Patron hastanede \"benim çalışanım değil, misafirdi\" dedi. Sigorta olmadığı için masraf sende: " + h.tl(18000) + "."
            : "SGK müfettişi işyerine geldi. Patronun kulağına eğildi: \"Sorarlarsa bugün deneme günündesin, tamam mı?\" Müfettiş sana doğru yürüyor.",
        choices: (s, h) =>
          h.d.olay === "kaza"
            ? [
                c("Masrafı öde, sus", h.tl(18000) + " · moral −", { cost: 18000, h: -3, m: -5, end: "kaza" }),
                c("Hizmet tespit davası aç", "Şans %60 · uzun süreç", { stress: 6, h: -3, chance: { p: 0.6, win: { cash: 25000, esteem: 4, end: "dava" }, lose: { m: -5, cost: 6000, end: "dava" }, winT: "Mahkeme haklı buldu", winP: "Geçmiş günlerin sigortalı sayıldı, masrafın tazmin edildi.", loseT: "Tanık bulunamadı", loseP: "İş arkadaşların ifade vermekten korktu." } }),
              ]
            : [
                c("\"Deneme günüm\" de", "Yalan beyan · risk", { risk: 1, cash: 3000, m: -3, esteem: -2, end: "yalan" }),
                c("Doğruyu söyle", "Şans %50 · kaydın yapılır ya da iş gider", { chance: { p: 0.5, win: { esteem: 4, m: 3, end: "kayitli" }, lose: { m: -5, ...(s.job !== "none" ? { job: "none", leaveCompany: 1 } : {}), end: "kovuldu" }, winT: "Geriye dönük kayıt", winP: "Patron ceza yedi; sen sigortalı oldun.", loseT: "\"Yarın gelme\"", loseP: "Kayıt yapıldı ama ertesi hafta işine son verildi." } }),
              ],
      },
    },
  });

  // 2) Sahte fatura (paravan şirket)
  HS.story("f_sahteFatura", {
    when: (s) => local(s) && fate(s, 5, 70) && (s.job === "office" || s.job === "business" || sk(s, "muhasebe") >= 10),
    minAge: 22,
    maxAge: 65,
    weight: 0.35,
    room: "is",
    title: "Paravan şirketin faturaları",
    text: (s, h) => {
      if (s.job === "business") return "Bir adam dükkâna geldi: \"" + (s.look === "woman" ? "Abla" : "Abi") + ", vergin çok çıkıyor. " + h.tl(10000) + " ver, sana " + h.tl(80000) + "'lik gider faturası keseyim; vergin " + h.tl(40000) + " düşer.\" Kartvizitinde var olmayan bir \"inşaat-gıda-tekstil\" şirketi yazıyor.";
      let t = "Şirket sahibi Hayati Bey seni odaya çağırdı: \"Şu faturaları sisteme gir, sorma. Yıl sonu primin " + h.tl(25000) + ".\" Faturalar, adresi boş bir arsa olan bir şirketten.";
      if (done(s, "w_ortbas") === "ihbar") t += " Bir kez iş arkadaşını yöneticine bildirmiştin; bu kez karşındaki patronun kendisi.";
      return t;
    },
    choices: (s, h) =>
      s.job === "business"
        ? [
            c("Faturayı al", h.tl(10000) + " · vergiden " + h.tl(40000) + " kaçar · risk", { cost: 10000, cash: 40000, risk: 1, m: -2, set: { ne: "girdi" }, go: "denetim" }),
            c("Muhasebecine danış, reddet", "Finans +", { sk: { muhasebe: 1, finans: 1 }, esteem: 2, end: "reddetti" }),
            c("Vergi dairesine bildir", "Esnaf arasında laf olur", { esteem: 4, stress: 3, flag: "ihbarci", end: "ihbar" }),
          ]
        : [
            c("Gir, primi al", h.tl(25000) + " · suça ortaklık", { cash: 25000, risk: 1, m: -3, set: { ne: "girdi" }, go: "denetim" }),
            c("Görmezden gel, başkası girsin", "Sessizlik", { stress: 3, set: { ne: "sustu" }, go: "denetim" }),
            c("Reddet, yazılı talimat iste", "Özgüven + · patronla ters", { esteem: 4, stress: 4, ...(s.company ? { perf: -3 } : {}), set: { ne: "red" }, go: "denetim" }),
          ],
    steps: {
      denetim: {
        gap: 8,
        title: "Vergi müfettişi",
        text: (s, h) =>
          h.d.ne === "red"
            ? "Vergi müfettişleri şirkete geldi; paravan şirket bir operasyonda çökmüş. Faturalara senin değil, başkasının şifresi basılı."
            : h.d.ne === "sustu"
              ? "Vergi müfettişleri şirkete geldi. Faturaları sen girmedin ama gördüğünü herkes biliyor. Tanık olarak ifaden isteniyor."
              : "Paravan şirket bir operasyonda çöktü; müşteri listesinde senin de adın var. Vergi müfettişi belgeleri istiyor.",
        choices: (s, h) =>
          h.d.ne === "red"
            ? [c("Rahat bir nefes al", "Temiz çıktın", { m: 4, esteem: 3, end: "temiz" }), working(s) ? c("Bu şirketten ayrıl", "İstifa · ihbar süresi", { resign: "notice", esteem: 2, end: "ayrildi" }) : null]
            : h.d.ne === "sustu"
              ? [
                  c("İfadede doğruyu söyle", "Özgüven + · patron kızar", { esteem: 3, stress: 3, end: "tanik" }),
                  c("\"Bir şey görmedim\" de", "Yalan ifade · risk", { risk: 1, m: -4, end: "korudu" }),
                ]
              : [
                  c("İşbirliği yap, her şeyi anlat", h.tl(15000) + " ceza · risk azalır", { cost: 15000, risk: -1, m: -4, end: "itiraf" }),
                  c("İnkâr et", "Şans %45", { chance: { p: 0.45, win: { stress: 6, m: -3, end: "kurtuldu" }, lose: { cost: 60000, risk: 1, m: -10, esteem: -4, end: "yakalandi" }, winT: "Delil yetersiz", winP: "Kurtuldun; ama her mektupta kalbin duruyor.", loseT: "Sahte belge kullanmaktan dosya", loseP: "Vergi ziyaı cezası ve ceza davası. Avukat \"etkin pişmanlık için geç kaldık\" dedi." } }),
                ],
      },
    },
  });

  // 3) Tefeci ağında tahsilatçılık (liseden arkadaş üzerinden)
  HS.story("f_tefeciTahsil", {
    when: (s) => local(s) && (fate(s, 6, 35) || (liseShady(s) && fate(s, 12, 60)) || s.job === "crime") && (s.job === "none" || s.job === "crime" || s.cash < 10000),
    minAge: 20,
    maxAge: 55,
    weight: (s) => 0.3 + (liseShady(s) ? 0.2 : 0),
    room: "sokak",
    title: (s, h) => h.cast("liseArk").name + " bir iş öneriyor",
    text: (s, h) => {
      let t = h.cast("liseArk").name + " çay ocağında anlattı: \"Bir abinin alacaklarını topluyoruz. Ayda " + h.tl(35000) + ". Kapıya gideceksin, konuşacaksın, o kadar.\" Faiz oranını sorduğunda gözünü kaçırdı.";
      if (done(s, "l_saadet") && done(s, "l_saadet") !== "reddetti") t += " Altın Yaşam'dan sonra şimdi de bu.";
      if (s.job === "crime") t += " Gece işlerinden tanıdık yüzler de bu ağda.";
      return t;
    },
    choices: (s, h) => [
      c("Kabul et", h.tl(12000) + " ilk iş · risk", { cash: 12000, risk: 1, m: -2, go: "kapi" }),
      c(h.ek(h.cast("enYakin").name, "dat") + " danış", "Bir akıl daha", { go: "uyari" }),
      c("Reddet", "İlişki az −", { rel: { liseArk: -5 }, esteem: 2, end: "reddetti" }),
    ],
    steps: {
      uyari: {
        gap: 1,
        title: (s, h) => h.cast("enYakin").name + " kaşlarını çattı",
        text: (s, h) => h.cast("enYakin").name + ": \"Tefecilik suç. Kapıya giden de ortak sayılır. Ayrıca o kapının arkasında senin gibi biri var.\"" + (flag(s, "cuzdanPara") ? " Bir an, yıllar önce bulduğun cüzdandaki parayı hatırladın." : ""),
        choices: (s, h) => [
          c("Haklısın, bulaşmıyorum", "Dostluk +", { rel: { enYakin: 6, liseArk: -5 }, m: 2, end: "vazgecti" }),
          c("Bir kere gideceğim", h.tl(12000) + " · risk", { cash: 12000, risk: 1, rel: { enYakin: -8 }, go: "kapi" }),
        ],
      },
      kapi: {
        gap: 3,
        title: "Kapının arkasındaki aile",
        text: (s, h) => "Adres bir apartmanın bodrum katı. Kapıyı küçük bir çocuk açtı; arkasında, dükkânı batmış bir baba. Bir yıl önce " + h.tl(50000) + " almış, şimdi borç " + h.tl(180000) + " olmuş. \"Kirayı bile ödeyemiyorum,\" diyor.",
        choices: (s, h) => [
          c("Baskı yap, parayı al", h.tl(15000) + " · vicdan −−", { cash: 15000, risk: 1, m: -10, esteem: -5, sk: { sokak: 2 }, set: { baski: 1 }, go: "sonuc" }),
          c("\"Bu faiz yasa dışı, savcılığa gidin\" de", "Ağa ihanet · vicdan +", { rel: { liseArk: -15 }, m: 4, esteem: 3, set: { uyardi: 1 }, go: "sonuc" }),
          c("Arkanı dön, bir daha arama", "Kurtuluş", { rel: { liseArk: -10 }, risk: -1, m: 1, end: "birakti" }),
        ],
      },
      sonuc: {
        gap: 4,
        title: "Tefeci operasyonu",
        text: (s, h) => "Sabah haberlerinde: \"Tefeci şebekesine operasyon: 14 gözaltı.\" " + (h.d.uyardi ? "Şikâyeti o bodrum katındaki baba yapmış; savcılık seni tanık olarak çağırıyor." : "Telefon kayıtlarında senin numaran da var.") + " " + h.cast("liseArk").name + " gözaltında.",
        choices: (s, h) =>
          h.d.uyardi
            ? [
                c("Tanık ol, ifade ver", "Özgüven + · risk temizlenir", { esteem: 5, risk: -1, flag: "ihbarci", stress: 4, end: "tanik" }),
                c("Şehirden bir süre uzaklaş", "Stres −", { cost: 6000, stress: -2, m: -2, end: "uzaklasti" }),
              ]
            : [
                c("Bekle, belki adın çıkmaz", "Şans %45", { chance: { p: 0.45, win: { m: -4, stress: 6, end: "kurtuldu" }, lose: { cost: 40000, risk: 1, m: -10, end: "yakalandi" }, winT: "Adın geçmedi", winP: "Ama her kapı çalındığında irkiliyorsun.", loseT: "Gözaltı", loseP: "Avukat masrafı, ifade, adli kontrol. Annen haberi komşudan duydu." } }),
                c("Savcılığa git, etkin pişmanlık", h.tl(20000) + " avukat · risk azalır", { cost: 20000, risk: -1, m: -4, esteem: 2, end: "teslim" }),
              ],
      },
    },
  });

  // 4) Tefeciden borç almak
  HS.story("f_tefeciBorc", {
    when: (s) => local(s) && (s.debt > 30000 * s.idx.cpi || s.cash < 3000 || done(s, "w_kendiIs") === "batti" || done(s, "l_kripto") === "kayip"),
    minAge: 20,
    maxAge: 70,
    weight: 0.35,
    room: "sokak",
    title: "Kahvehanedeki \"yardımsever\"",
    text: (s, h) => {
      let t = "Banka kredi başvurunu reddetti. Kahvehanede biri yanına oturdu: \"" + h.tl(40000) + " şimdi, elden. Haftalık %10, dostlar arasında.\"";
      if (done(s, "w_kendiIs") === "batti") t += " Batan işin borçları hâlâ kapıda.";
      if (done(s, "l_kripto") === "kayip") t += " Kripto platformunda kaybettiğin para olmasa bu masada olmazdın.";
      const b = done(s, "l_borc");
      if (b === "odemedi" || b === "kavga") t += " " + h.cast("enYakin").name + " sana olan borcunu ödeseydi…";
      return t;
    },
    choices: (s, h) => [
      c("Parayı al", h.tl(40000) + " · haftalık %10", { cash: 40000, stress: 6, flag: "tefeciBorc", go: "faiz" }),
      kinAlive(s, ["anne", "baba", "abi", "abla", "dayi", "amca", "teyze", "hala"]) ? c("Ailenden iste", h.tl(20000) + " · gurur −", { cash: 20000, esteem: -3, m: -2, end: "aile" }) : null,
      c("Bankayla borç yapılandırması konuş", "Finans + · yavaş çıkış", { sk: { finans: 2 }, stress: 2, end: "banka" }),
      c("Hayır, kemer sıkarım", "Moral −", { m: -3, stress: 3, end: "reddetti" }),
    ],
    steps: {
      faiz: {
        gap: 4,
        title: "Borç şişiyor",
        text: (s, h) => "Dört hafta geçti; borç " + h.tl(58000) + " olmuş. Adamlar dün " + (working(s) ? "iş yerinin önünde" : "apartmanın önünde") + " bekliyordu. Sadece \"selam söylediler\".",
        choices: (s, h) => [
          c("Ne olursa olsun öde, kurtul", h.tl(58000), { cost: 58000, m: 2, stress: -4, end: "odedi" }),
          c("Polise/savcılığa şikâyet et", "Şans %65 · tefecilik suç", { stress: 6, chance: { p: 0.65, win: { m: 6, esteem: 4, flag: "ihbarci", end: "sikayet" }, lose: { stress: 8, m: -6, go: "baski" }, winT: "Takipsizlik değil, tutuklama", winP: "Senin gibi on iki kişi daha şikâyetçiymiş. Borç senedi geçersiz sayıldı.", loseT: "Delil yetersiz", loseP: "Senet de, şahit de yok. Adamlar şikâyeti duymuş." } }),
          c("Başka yerden borç bulup kapat", "Döngü sürer", { stress: 8, m: -4, go: "baski" }),
        ],
      },
      baski: {
        gap: 3,
        title: "Ailenle konuşma zamanı",
        text: (s, h) => "Kimseye anlatamıyorsun; uykular kaçtı. " + h.cast("enYakin").name + " bir şeylerin ters gittiğini fark etti: \"Anlat, birlikte çıkarız.\"",
        choices: (s, h) => [
          c("Her şeyi anlat, birlikte savcılığa gidin", "Şans %80", { rel: { enYakin: 8 }, chance: { p: 0.8, win: { m: 6, stress: -6, end: "kurtuldu" }, lose: { cost: 30000, m: -4, end: "odedi" }, winT: "Yalnız değilsin", winP: "Avukat bir arkadaşın arkadaşıydı; dosya güçlüydü. Tefeci tutuklandı.", loseT: "Ödeyerek kapattın", loseP: "Uzlaşma için ana parayı ödedin; en azından bitti." } }),
          c("Kalanı ne pahasına olursa öde", h.tl(70000), { cost: 70000, m: -6, stress: -3, end: "odedi" }),
        ],
      },
    },
  });

  // 5) Kaçak sigara ve kayıtsız telefon deposu
  HS.story("f_depo", {
    when: (s) => local(s) && (fate(s, 7, 40) || s.job === "crime") && (s.job === "none" || s.job === "factory" || s.job === "crime"),
    minAge: 19,
    maxAge: 55,
    weight: 0.35,
    room: "garaj",
    title: "Gece vardiyası, nakit ödeme",
    text: (s, h) => "Sanayi sitesinde bir \"lojistik\" deposu gece yükleme elemanı arıyor: gecelik " + h.tl(2500) + ", nakit. Telefonda tek kural söylendi: \"Kolileri açma, soru sorma.\"",
    choices: (s, h) => [
      c("Kabul et", h.tl(7500) + " üç gece · soru sorma", { cash: 7500, sleep: 3, risk: 1, go: "fark" }),
      c("Reddet", "Şüpheli", { m: 1, end: "reddetti" }),
    ],
    steps: {
      fark: {
        gap: 3,
        title: "Yırtılan koli",
        text: (s, h) => "Bir koli yere düşüp yırtıldı: bandrolsüz sigara paketleri. Diğer odada kutusundan çıkarılmış, kaydı olmayan yüzlerce telefon. Depo şefi bir telefonu sana uzattı: \"Al, hediye. Aramızda.\"",
        choices: (s, h) => [
          c("Devam et, sorgulama", h.tl(10000) + " · risk +", { cash: 10000, risk: 1, m: -3, go: "baskin" }),
          c("Son yevmiyeni al, bir daha gitme", "Kurtuluş", { m: 2, end: "birakti" }),
          c("Kolluğa isimsiz ihbar et", "Şans %70 · fark edilmezsen", { chance: { p: 0.7, win: { m: 3, esteem: 3, flag: "ihbarci", end: "ihbar" }, lose: { stress: 8, m: -4, end: "ihbar" }, winT: "Operasyon", winP: "İki hafta sonra depoya baskın yapıldı; sen orada değildin.", loseT: "Şüphelendiler", loseP: "Depo şefi \"kim konuştu?\" diye herkesi aradı. Bir süre telefonunu açamadın." } }),
          s.job === "none" ? c("Patronun \"daha büyük işler\" teklifini kabul et", "Gece işlerine girersin · ağır bedel", { job: "crime", risk: 1, m: -4, end: "geceIsleri" }) : null,
        ],
      },
      baskin: {
        gap: 3,
        title: "Kapıda mavi ışıklar",
        text: "Gece ikide depo kapısı açıldı: gümrük ve kaçakçılık ekipleri. Herkes yere oturtuldu. Bir memur sana dönüp \"Kaç zamandır buradasın?\" diye soruyor.",
        choices: [
          c("Doğruyu anlat, iş birliği yap", "Şans %60 · tanık olabilirsin", { m: -6, chance: { p: 0.6, win: { risk: -1, stress: 6, end: "ifade" }, lose: { cost: 25000, risk: 1, m: -6, end: "yakalandi" }, winT: "Tanık olarak serbest", winP: "İfaden tutanağa geçti; şebekenin elebaşları tutuklandı.", loseT: "Kaçakçılık dosyası", loseP: "Adli para cezası ve uzun bir dava. Avukatın masrafı da cabası." } }),
          c("\"Bir şey bilmiyorum\" de", "Şans %40", { chance: { p: 0.4, win: { m: -4, stress: 6, end: "kurtuldu" }, lose: { cost: 35000, risk: 1, m: -10, end: "yakalandi" }, winT: "Ayakçı sayıldın", winP: "Sabaha karşı bırakıldın. O depo yolundan bir daha geçmiyorsun.", loseT: "Kameralar konuştu", loseP: "Her gece koli taşıdığın kayıtlarda. İfaden çelişkili bulundu." } }),
        ],
      },
    },
  });

  // 6) Hileli çekiliş (fenomen arkadaş)
  HS.story("f_cekilis", {
    when: (s) => local(s) && fate(s, 8, 70) && (flag(s, "icerikUretici") || fame(s) >= 8 || flag(s, "podcastci")),
    minAge: 18,
    maxAge: 50,
    weight: 0.4,
    room: "salon",
    title: "\"Ortak çekiliş yapalım\"",
    text: (s, h) => (liseShady(s) ? h.cast("liseArk").name + " artık kendini \"dijital girişimci\" diye tanıtıyor. " : "Liseden " + h.cast("liseArk").name + " artık 300 bin takipçili bir fenomen. ") + "Teklifi şu: \"Son model telefon çekilişi yapalım; takip et, üç kişi etiketle. Kazanan zaten belli, kuzenim. Sen paylaş, sana " + h.tl(15000) + ".\"",
    choices: (s, h) => [
      c("Paylaş, parayı al", h.tl(15000) + " · takipçilerini kandırırsın", { cash: 15000, fame: 2, risk: 1, esteem: -3, go: "sikayet" }),
      c("\"Gerçek ve izinli çekilişse varım\"", "Şart koş", { sk: { muzakere: 1 }, rel: { liseArk: -3 }, esteem: 2, end: "sartKostu" }),
      c("Takipçilerini bu tür çekilişlere karşı uyar", "Dürüstlük · arkadaşlık biter", { rel: { liseArk: -15 }, fame: 1, esteem: 3, end: "uyardi" }),
    ],
    steps: {
      sikayet: {
        gap: 4,
        title: "Kazanan kim?",
        text: (s, h) => "Takipçilerin, kazananın " + h.ek(h.cast("liseArk").name, "gen") + " kuzeni olduğunu buldu. İzinsiz çekiliş için şikâyetler yağıyor; bir avukat \"Ticaret Bakanlığı'na bildirdik\" yazmış.",
        choices: (s, h) => [
          c("Özür dile, parayı bağışla", h.tl(15000) + " · güven onarılır", { cost: 15000, fame: -1, esteem: 3, end: "ozur" }),
          c("Yorumları kapat, sus", "Şans %50", { chance: { p: 0.5, win: { fame: -1, m: -2, end: "unutuldu" }, lose: { fame: -5, cost: 20000, risk: 1, m: -6, end: "ceza" }, winT: "Geçti", winP: "Bir hafta sonra kimse konuşmuyordu; sen hâlâ düşünüyorsun.", loseT: "İdari para cezası", loseP: "İzinsiz çekilişe ortaklıktan ceza geldi; markalar seninle çalışmayı bıraktı." } }),
          c("Suçu arkadaşına at", "Şöhret − · ilişki −−", { fame: -2, rel: { liseArk: -20 }, m: -2, end: "suclama" }),
        ],
      },
    },
  });

  // 7) Belediyede rüşvet (memursan teklif edilir, değilsen istenir)
  HS.story("f_rusvet", {
    when: (s) => local(s) && (s.job === "memur" || fate(s, 9, 55)) && (s.job === "memur" || s.job === "business" || !!(s.assets && s.assets.house)),
    minAge: 22,
    maxAge: 70,
    weight: 0.35,
    room: "is",
    title: (s) => (s.job === "memur" ? "Masadaki zarf" : "\"Çay parası\""),
    text: (s, h) =>
      s.job === "memur"
        ? "Bir müteahhit dosyasını getirdi; ruhsat için eksik evrak var. Giderken masada bir zarf unuttu: içinde " + h.tl(50000) + ". \"Dosya bu hafta çıkarsa bir o kadar daha.\""
        : (s.job === "business" ? "Dükkânın tabela ruhsatı" : "Evinin tadilat izni") + " aylardır belediyede bekliyor. Kapıda bir \"takipçi\" yanaştı: \"" + h.tl(30000) + " ver, içeride tanıdık var, iki günde çıkar.\"",
    choices: (s, h) =>
      s.job === "memur"
        ? [
            c("Zarfı al", h.tl(50000) + " · rüşvet suçu", { cash: 50000, risk: 2, m: -6, esteem: -4, set: { al: 1 }, go: "sonra" }),
            c("Zarfı geri ver, kimseye söyleme", "Stres +", { stress: 3, set: { al: 0 }, go: "sonra" }),
            c("Tutanakla amirine bildir", "Özgüven ++", { esteem: 5, flag: "rusvetRed", ...(team(s) ? { rel: { yonetici: 5 } } : {}), set: { al: 2 }, go: "sonra" }),
          ]
        : [
            c("Öde, iş bitsin", h.tl(30000) + " · rüşvet suçu", { cost: 30000, risk: 1, m: -3, set: { al: 1 }, go: "sonra" }),
            c("Sırana bekle, yasal yoldan", "Zaman kaybı", { stress: 5, m: -2, set: { al: 0 }, go: "sonra" }),
            c("CİMER'e bildir", "Özgüven +", { esteem: 4, flag: "rusvetRed", set: { al: 2 }, go: "sonra" }),
          ],
    steps: {
      sonra: {
        gap: 6,
        title: "Belediyeye rüşvet operasyonu",
        text: (s, h) => "Sabah haberlerinde belediyenin önündeki polis araçları: \"İmar ve ruhsat işlemlerinde rüşvet çarkı.\" " + (h.d.al === 1 ? "Telefon ve banka kayıtları inceleniyor." : h.d.al === 2 ? "Savcılık bildiriminden yola çıkılmış; tanık listesinde adın var." : "Senin dosyan hâlâ sırada; ama içeride kimse rahat değil."),
        choices: (s, h) => {
          if (h.d.al === 1)
            return [
              c("Bekle, belki kayıtlara takılmazsın", "Şans %50", { chance: { p: 0.5, win: { m: -4, stress: 6, end: "kurtuldu" }, lose: { cost: s.job === "memur" ? 50000 : 30000, risk: 1, m: -12, ...(s.job === "memur" ? { job: "none", leaveCompany: 1 } : {}), end: "yakalandi" }, winT: "Adın geçmedi", winP: "Ama o para hiç senin gibi hissettirmedi.", loseT: "Gözaltı", loseP: s.job === "memur" ? "Görevden uzaklaştırıldın; avukat \"meslekten ihraç da gündemde\" diyor." : "Rüşvet vermekten soruşturma açıldı; ruhsat da iptal." } }),
              c("Savcılığa git, etkin pişmanlık", h.tl(10000) + " · risk azalır", { cost: 10000, risk: -1, m: -3, esteem: 2, end: "itiraf" }),
            ];
          if (h.d.al === 2) return [c("İfade ver", "Özgüven + · çevre +", { esteem: 3, m: 4, people: 2, flag: "ihbarci", end: "tanik" })];
          return [
            c("Sabret, dosya sırayla çıksın", "Stres −", { stress: -2, m: 2, end: "temiz" }),
            s.job !== "memur" ? c("İzin gecikmesi için dilekçeyle hakkını ara", "Mevzuat +", { sk: { mevzuat: 1 }, esteem: 2, end: "temiz" }) : null,
          ];
        },
      },
    },
  });

  // 8) Ufak kazadan sonra sigorta dolandırıcılığı cazibesi
  HS.story("f_sigorta", {
    when: (s) => local(s) && motorCar(s),
    minAge: 18,
    maxAge: 75,
    weight: (s) => (done(s, "l_kaza") !== undefined ? 0.45 : 0.3),
    room: "garaj",
    title: "Otoparkta hafif bir sürtme",
    text: (s, h) => {
      let t = "AVM otoparkında biri geri çıkarken kapına sürttü; hasar " + h.tl(6000) + " civarı. Karşı taraf kusurunu kabul etti. ";
      const u = h.cast("usta").name;
      t += (HS.castRel(s, "usta") >= 55 ? "Tanıdık usta " + u : "Bir \"tanıdık\" ekspertizci") + " göz kırptı: \"Öbür taraftaki eski göçüğü, tampon çiziğini de bu kazaya yazalım. Sigorta " + h.tl(45000) + " öder, kimse anlamaz.\"";
      if (done(s, "l_kaza")) t += " Geçen kazadan sigorta süreçlerini iyi biliyorsun.";
      return t;
    },
    choices: (s, h) => [
      c("Hasarı şişir", "Sigorta dolandırıcılığı · risk", { risk: 1, m: -2, set: { sis: 1 }, go: "eksper" }),
      c("Sadece gerçek hasarı bildir", h.tl(6000) + " · temiz", { cash: 6000, esteem: 2, end: "durust" }),
      c("Hiç bulaşma, karşı tarafla anlaş", h.tl(4000) + " elden · hızlı", { cash: 4000, end: "anlasti" }),
    ],
    steps: {
      eksper: {
        gap: 3,
        title: "Eksper fotoğraflara bakıyor",
        text: "Sigorta eksperi büyüteçle eski göçüğe eğildi: \"Burada pas var. Bu hasar iki haftalık değil.\" Dosya henüz kapanmadı.",
        choices: (s, h) => [
          c("Israr et", "Şans %40", { chance: { p: 0.4, win: { cash: 45000, m: -2, end: "aldi" }, lose: { cost: 15000, risk: 1, m: -8, rel: { usta: -10 }, end: "yakalandi" }, winT: "Ödeme yattı", winP: "Para hesabında; ama poliçeni yenilerken sesin titredi.", loseT: "Dolandırıcılık şüphesiyle dosya", loseP: "Ödeme reddedildi, rücu ve suç duyurusu geldi. Usta telefonlarına çıkmıyor." } }),
          c("Dosyayı düzelt, sadece yeni hasar", h.tl(6000) + " · son dakika vicdanı", { cash: 6000, esteem: 2, end: "geriCekti" }),
        ],
      },
    },
  });

  // 9) Pazarda taklit marka satmak
  HS.story("f_sahteMarka", {
    when: (s) => local(s) && fate(s, 10, 40) && (s.job === "none" || s.job === "business" || s.job === "cafe"),
    minAge: 19,
    maxAge: 65,
    weight: 0.35,
    room: "sokak",
    title: "Çuvalla \"lüks marka\"",
    text: (s, h) => "Bir toptancı " + (s.job === "business" ? "dükkâna" : "salı pazarındaki tanıdığına") + " geldi: \"Lüks marka çanta ve parfüm, birebir kopya. " + h.tl(20000) + "'lik mal " + h.tl(60000) + "'ye satılır.\" Logolar tanıdık, dikişler değil.",
    choices: (s, h) => [
      c("Malı al, sat", h.tl(20000) + " · taklit · risk", { cost: 20000, risk: 1, go: "pazar" }),
      c("Markasız, kendi ürünlerinle tezgâh aç", h.tl(10000) + " · temiz ticaret", { cost: 10000, sk: { pazarlama: 2 }, set: { temiz: 1 }, go: "pazar" }),
      c("Uzak dur", "Kaybın yok", { m: 1, end: "reddetti" }),
    ],
    steps: {
      pazar: {
        gap: 3,
        title: (s, h) => (h.d.temiz ? "Tezgâhın ilk ayı" : "Zabıta ve marka vekili"),
        text: (s, h) => (h.d.temiz ? "Kendi seçtiğin markasız ürünler yavaş ama düzenli gidiyor. Müdavimlerin oluştu." : "Pazar kurulurken zabıtayla birlikte bir marka vekili tezgâhları geziyor; iki tezgâh ötede mallara el kondu."),
        choices: (s, h) =>
          h.d.temiz
            ? [c("Devam et", h.tl(16000) + " kâr", { cash: 16000, people: 2, sk: { tedarik: 1 }, end: "temiz" }), c("Malın kalanını sat, bırak", h.tl(11000), { cash: 11000, end: "temiz" })]
            : [
                c("Malları sakla, satmaya devam", "Şans %50", { chance: { p: 0.5, win: { cash: 50000, m: -2, end: "satti" }, lose: { cost: 30000, risk: 1, m: -8, end: "elKonuldu" }, winT: "Hepsi satıldı", winP: "Para cebinde; \"orijinal mi?\" diye soran teyzenin yüzünü unutamıyorsun.", loseT: "El konuldu", loseP: "Mallar toplandı, marka hakkına tecavüzden dosya açıldı." } }),
                c("Malı tezgâhtan kaldır, zararı kabullen", h.tl(8000) + " kurtarılan", { cash: 8000, m: -3, end: "birakti" }),
              ],
      },
    },
  });

  // 10) Yasa dışı bahis "kupon" grubu ve hesap kiralama tuzağı
  HS.story("f_bahis", {
    when: (s) => local(s) && (fate(s, 11, 35) || (done(s, "l_kripto") !== undefined && done(s, "l_kripto") !== "girmedi" && fate(s, 13, 60)) || s.debt > 60000 * s.idx.cpi),
    minAge: 18,
    maxAge: 60,
    weight: (s) => 0.25 + (done(s, "l_kripto") !== undefined && done(s, "l_kripto") !== "girmedi" ? 0.2 : 0),
    room: "salon",
    title: "\"VIP kupon\" grubu",
    text: (s, h) => (done(s, "l_kripto") !== undefined && done(s, "l_kripto") !== "girmedi" ? "Kripto sinyal grubundan sonra aynı uygulamada yeni bir davet: " : "Bir mesajlaşma grubuna habersizce eklendin: ") + "\"Şike bilgisi, %100 tutan kupon. Aylık üyelik " + h.tl(2500) + ", yasa dışı sitede oynanıyor, kimse bilmez.\" Grupta kazanç ekran görüntüleri dönüyor.",
    choices: (s, h) => [
      c("Gruptan çık, numarayı engelle", "Finans + · huzur", { sk: { finans: 1 }, m: 1, end: "reddetti" }),
      c("Grubu şikâyet et", "Özgüven +", { esteem: 2, flag: "ihbarci", end: "ihbar" }),
      c("Üye ol, bir bakayım", h.tl(2500) + " · risk", { cost: 2500, risk: 1, go: "hesap" }),
    ],
    steps: {
      hesap: {
        gap: 2,
        title: "Kupon yattı, teklif geldi",
        text: (s, h) => "\"Garanti\" kupon ilk maçta yattı. Grup yöneticisi özelden yazdı: \"Zararını çıkaralım. Banka hesabını bize kirala, ayda " + h.tl(10000) + ". Sadece para girip çıkacak.\"",
        choices: (s, h) => [
          c("Hayır, gruptan çık", "Ders alındı", { m: -3, sk: { finans: 1 }, end: "kaybetti" }),
          c("Polise her şeyi anlat", "Risk azalır", { risk: -1, esteem: 3, flag: "ihbarci", end: "ihbar" }),
          c("Hesabını kirala", h.tl(10000) + " · ağır risk", { cash: 10000, risk: 2, m: -4, go: "masak" }),
        ],
      },
      masak: {
        gap: 4,
        title: "Hesabın donduruldu",
        text: "Bankadan mesaj: \"Hesabınız şüpheli işlem nedeniyle bloke edilmiştir.\" Ertesi gün emniyetten ifadeye çağrıldın: hesabından yasa dışı bahis paraları geçmiş.",
        choices: [
          c("Avukat tut, ifade ver", "Avukat parası · moral −−", { cost: 25000, m: -8, stress: 6, end: "ifade" }),
          c("Her şeyi anlat, etkin pişmanlık", "Risk azalır", { cost: 5000, risk: -1, m: -5, esteem: 1, end: "ifade" }),
        ],
      },
    },
  });
})(globalThis.HS || (globalThis.HS = {}));
