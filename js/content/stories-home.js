// Ev ve mahalle hikâyeleri: beyaz eşya, kombi, apartman yönetimi, komşular, kedi, kargo,
// ev arkadaşı, misafir... Hepsi aynı kalıcı tanıdıkları (komşu, usta, apartman yöneticisi)
// paylaşır; bir hikâyedeki karar (ör. kombi ustasının dürüstlüğü, komşuyla dostluk) başka
// hikâyelerde metni ve seçenekleri değiştirir. Kimlik ön eki: "h_".
(function (HS) {
  "use strict";
  const c = (label, hint, fx = {}) => ({ label, hint, fx });

  // ---------- Yardımcılar ----------
  const apt = (s) => s.housing === "kira" || s.housing === "kira-paylasim" || s.housing === "ev";
  const own = (s) => s.housing === "ev";
  const renter = (s) => s.housing === "kira" || s.housing === "kira-paylasim";
  const has = (s, k) => (s.items || []).includes(k);
  const rel = (s, role) => HS.castRel(s, role);
  // Yaşça büyükse "Hanım/Bey" ile anılır
  const hitap = (s, role) => {
    const k = HS.cast(s, role);
    return k.name + (s.year - k.born >= s.age + 8 ? (k.woman ? " Hanım" : " Bey") : "");
  };
  const komsu = (s) => hitap(s, "komsu");
  const yon = (s) => hitap(s, "yonetim");
  const usta = (s) => HS.castName(s, "usta") + " Usta";
  // Kombi hikâyesindeki usta dürüst müydü? "durust" | "hileci" | undefined
  const ustaDurum = (s) => HS.storyData(s, "h_kombi").usta;
  const komsuDost = (s) => HS.done(s, "h_komsu") === "dost" || rel(s, "komsu") >= 70;
  const komsuKus = (s) => ["kuskun", "mesafe"].includes(HS.done(s, "h_komsu")) || rel(s, "komsu") < 40;
  const kapici = (s) => ["Rıza", "Hüseyin", "Cemal", "Nuri", "Bayram"][((s.first || "").length + (s.birthCity || "").length) % 5] + " Efendi";
  const sen = (s) => (s.look === "woman" ? "abla" : "abi");
  const Sen = (s) => (s.look === "woman" ? "Abla" : "Abi");

  // =====================================================================
  // 1) Bulaşık makinesi: bir kez karar verilir, bir kez kurulur, bir kez arızalanır.
  // =====================================================================
  HS.story("h_bulasik", {
    when: (s) => !has(s, "bulasik") && s.housing !== "aile",
    weight: 0.7,
    room: "mutfak",
    title: "Bulaşık makinesi kararı",
    text: (s) =>
      "Lavabo yine tepeleme doldu; son temiz çatal da kullanıldı. Gece yarısı elinde süngerle dikilirken bir karar vermenin vakti geldiğini anladın." +
      (s.partner ? " " + s.partner.name + " de arkadan sesleniyor: \"Bir makine alsak artık?\"" : "") +
      " Üstelik komşun " + komsu(s) + " yenisini aldığı için eskisini satmak istediğini söylemişti.",
    choices: (s, h) => [
      c("Sıfır makine al", h.tl(21000) + " · 2 yıl garanti", { cost: 21000, itemGive: "bulasik", m: 2, stress: -2, bond: s.partner ? 2 : 0, set: { tip: "sifir" }, go: "kurulum" }),
      c(HS.ek(komsu(s), "gen") + " eskisini al", h.tl(8500) + " · ucuz ama ne kadar dayanır?", { cost: 8500, itemGive: "bulasik", rel: { komsu: 4 }, m: 1, set: { tip: "ikinci" }, go: "kurulum" }),
      c("Elde yıkamaya devam", "Para cepte kalır · stres +", { stress: 2, m: -1, bond: s.partner ? -2 : 0, end: "elde" }),
    ],
    steps: {
      kurulum: {
        gap: 1,
        title: "Kurulum günü",
        text: (s, h) => {
          const u = ustaDurum(s);
          return (
            (h.d.tip === "sifir" ? "Makine kutusuyla geldi; servis kurulum için on gün sonraya randevu verdi." : "Makineyi " + komsu(s) + " ile merdivenlerden zar zor taşıdınız.") +
            " Ama mutfakta ayrı bir su vanası yok, tahliye hortumu da lavaboya yetişmiyor." +
            (u === "durust" ? " Kombiyi dürüstçe tamir eden " + usta(s) + " aklına geldi." : u === "hileci" ? " Kombi işindeki " + usta(s) + " aklına geldi ama o hesabı unutmadın." : "")
          );
        },
        choices: (s, h) => [
          ustaDurum(s) === "hileci"
            ? c("Yine de " + HS.ek(usta(s), "acc") + " ara", "Şans %50 · fazla isteyebilir", { chance: { p: 0.5, win: { cost: 1800, set: { montaj: "usta" }, go: "ariza" }, lose: { cost: 4500, stress: 4, rel: { usta: -5 }, set: { montaj: "usta" }, go: "ariza" }, winT: "Bu sefer adam gibi", winP: "Vanayı taktı, hortumu uzattı, makul bir para istedi.", loseT: "Yine kazık", loseP: "\"Özel conta\" dedi, iki katı yazdı. Ders alınmadı." } })
            : c(HS.ek(usta(s), "acc") + " çağır", h.tl(1800) + " · aynı gün biter", { cost: 1800, stress: -1, rel: { usta: 3 }, set: { montaj: "usta" }, go: "ariza" }),
          h.d.tip === "sifir"
            ? c("Yetkili servisi bekle", "Ücretsiz · on gün daha elde yıkama", { stress: 3, m: -1, set: { montaj: "servis" }, go: "ariza" })
            : c("İnternetten izleyip kendin tak", "Şans %60 · bedava", { chance: { p: 0.6, win: { skill: 1, m: 3, set: { montaj: "kendin" }, go: "ariza" }, lose: { cost: 1500, stress: 4, set: { montaj: "kendin" }, go: "ariza" }, winT: "Usta gibi", winP: "Bir conta, iki kelepçe; makine ilk yıkamasını yaptı.", loseT: "Mutfak göl oldu", loseP: "Kelepçe sıkılmamış. Havlular, kova, yeni hortum..." } }),
        ],
      },
      ariza: {
        gap: 8,
        when: (s) => has(s, "bulasik"),
        title: (s, h) => (h.d.tip === "sifir" ? "Ekranda hata kodu" : "Makine su kaçırıyor"),
        text: (s, h) =>
          h.d.tip === "sifir"
            ? "Bulaşık makinesi programın ortasında durdu, ekranda E15 yazıyor. Neyse ki garantisi var; ama servis \"bu hafta yoğunuz\" diyor."
            : HS.ek(komsu(s), "abl") + " aldığın makinenin altından su sızıyor. Gelen usta \"pompa gitmiş, bu yaşta makineye değmez\" diyor.",
        choices: (s, h) =>
          h.d.tip === "sifir"
            ? [
                c("Garantiyle servisi bekle", "Ücretsiz · bir hafta elde yıkama", { stress: 2, end: "garanti" }),
                c("Beklemeden özel ustaya yaptır", h.tl(2500) + " · garanti bozulabilir", { cost: 2500, stress: -1, end: "ozelusta" }),
              ]
            : [
                c("Pompayı değiştirt", h.tl(4500) + " · birkaç yıl daha", { cost: 4500, end: "tamir" }),
                c("Hurdacıya sat, bitsin", "+" + h.tl(1500) + " · makine gider", { cash: 1500, itemLose: "bulasik", m: -2, end: "satti" }),
                c(HS.ek(komsu(s), "dat") + " durumu anlat", rel(s, "komsu") >= 55 ? "Yarısını karşılayabilir" : "Arası bozulabilir", rel(s, "komsu") >= 55 ? { cost: 2250, rel: { komsu: -1 }, end: "komsu" } : { cost: 4500, rel: { komsu: -8 }, stress: 2, end: "komsu" }),
              ],
      },
    },
  });

  // =====================================================================
  // 2) Kombi: kışın bozulur; ustanın dürüstlüğü başka hikâyelere taşınır.
  // =====================================================================
  HS.story("h_kombi", {
    when: (s) => s.housing !== "aile" && (s.week >= 45 || s.week <= 10),
    weight: 0.75,
    room: "salon",
    title: "Kombi buz kesti",
    text: (s) => "Sabah duşta sıcak su yok, petekler buz gibi. Kombinin ekranında F28 yanıp sönüyor. Dışarıda " + (s.week >= 45 ? "kasım ayazı" : "ocak soğuğu") + " var.",
    choices: (s, h) => [
      c(HS.ek(usta(s), "acc") + " çağır", "Tanıdık usta · " + h.tl(1500) + " servis", { cost: 1500, go: "teshis" }),
      c("Yetkili servisi çağır", h.tl(3500) + " · üç gün beklersin", { cost: 3500, h: -1, stress: 3, set: { usta: "yok" }, end: "yetkili" }),
      renter(s)
        ? c("Ev sahibine bildir", "Şans %50 · kombi demirbaş", { chance: { p: 0.5, win: { stress: -1, end: "evsahibi" }, loseT: "\"Kullanım hatası\"", loseP: "Ev sahibi \"bozan sizsiniz\" deyip ustayı sana yolladı.", winT: "Ev sahibi halletti", winP: "Kendi ustasını gönderdi, parasını da ödedi.", lose: { stress: 3, go: "teshis" } } })
        : null,
      c("Elektrikli ısıtıcıyla idare et", h.tl(1200) + " fatura · üşürsün", { cost: 1200, h: -2, stress: 3, end: "soguk" }),
    ],
    steps: {
      teshis: {
        gap: 1,
        title: "Ustanın teşhisi",
        text: (s) => usta(s) + " kombinin kapağını açtı, iki dakika baktı: \"Anakart yanmış " + sen(s) + ", değişmesi lazım. Orijinal parça, işçilik dahil on iki buçuk.\"",
        choices: (s, h) => [
          c("Tamam, değiştir", h.tl(12500) + " · bu akşam ısınırsın", {
            cost: 12500,
            chance: {
              p: 0.6,
              win: { m: 2, rel: { usta: 6 }, set: { usta: "durust" }, go: "kontrol" },
              lose: { m: 1, set: { usta: "hileci" }, go: "kontrol" },
              winT: "Ev ısındı",
              winP: "Eski kartı da gösterdi, yanık izi belliydi. Faturasını kesti.",
              loseT: "Ev ısındı ama...",
              loseP: "Eski parçayı \"ben atarım\" deyip hızla çantasına koydu. Fatura sorunca \"gerek yok\" dedi.",
            },
          }),
          c("Önce ikinci görüş al", h.tl(2500) + " · bir gün daha soğuk", {
            cost: 2500,
            h: -1,
            chance: {
              p: 0.5,
              win: { cost: 3000, rel: { usta: -20 }, esteem: 2, set: { usta: "hileci" }, end: "usta_hileci" },
              lose: { cost: 12500, rel: { usta: 4 }, set: { usta: "durust" }, go: "kontrol" },
              winT: "Sadece sensörmüş",
              winP: "Yetkili servis sensörü değiştirdi; anakart sapasağlam. Tanıdık ustaya güvenin kalmadı.",
              loseT: "Usta haklıymış",
              loseP: "Servis de anakart dedi. Ustadan özür diledin, işi ona verdin.",
            },
          }),
          c("Bu kış ısıtıcıyla geçir", h.tl(1200) + " · sağlık −", { cost: 1200, h: -3, stress: 4, end: "soguk" }),
        ],
      },
      kontrol: {
        gap: 6,
        title: (s, h) => (h.d.usta === "durust" ? usta(s) + " aradı" : "Kombi yine sustu"),
        text: (s, h) =>
          h.d.usta === "durust"
            ? usta(s) + " arayıp kombinin nasıl gittiğini sordu. \"Seneye eylülde bir bakım yapalım, petekleri de temizleriz\" diyor."
            : "Kombi aynı hatayı verdi. Gelen başka bir usta kartı çıkarınca güldü: \"Bu kart en az beş yıllık, kimse bir şey değiştirmemiş.\"",
        choices: (s, h) =>
          h.d.usta === "durust"
            ? [
                c("Bakımı şimdiden ayarla", h.tl(2000) + " · faturalar düşer", { cost: 2000, rel: { usta: 6 }, stress: -2, end: "usta_durust" }),
                c("Teşekkür et, gerek yok", "Ücretsiz", { rel: { usta: 2 }, end: "usta_durust" }),
              ]
            : [
                c(HS.ek(usta(s), "acc") + " arayıp hesap sor", "Şans %40 · paranın bir kısmı", { rel: { usta: -15 }, chance: { p: 0.4, win: { cash: 6000, esteem: 2, end: "usta_hileci" }, lose: { stress: 5, end: "usta_hileci" }, winT: "Parayı geri verdi", winP: "Kekeleyerek yarısını iade etti.", loseT: "Telefonu açmıyor", loseP: "Numaranı engellemiş." } }),
                c("e-Devlet'ten tüketici hakem heyetine başvur", "Şans %55 · uğraştırır", { stress: 3, rel: { usta: -25 }, chance: { p: 0.55, win: { cash: 12500, m: 4, end: "usta_hileci" }, lose: { stress: 3, end: "usta_hileci" }, winT: "Heyet haklı buldu", winP: "Paranın tamamı iade edildi.", loseT: "Fatura yok, delil yok", loseP: "Başvuru reddedildi. Fatura istemeyi öğrendin." } }),
                c("Kızgın ama yeni ustaya yaptır", h.tl(3000), { cost: 3000, rel: { usta: -20 }, m: -2, end: "usta_hileci" }),
              ],
      },
    },
  });

  // =====================================================================
  // 3) Çamaşır makinesi: kendi evine geçince. Kombi ustası yeniden sahnede.
  // =====================================================================
  HS.story("h_camasir", {
    when: (s) => (s.housing === "kira" || s.housing === "ev") && !has(s, "camasir"),
    weight: (s) => (s.flags.newLease && s.weeks - s.flags.newLease < 26 ? 0.8 : 0.45),
    room: "mutfak",
    title: "Kirli sepeti taştı",
    text: "Yeni evde her şey güzel ama kirli sepeti taştı; son temiz çorabı da giydin. Bir çamaşır makinesi şart.",
    choices: (s, h) => [
      c("Sıfır makine al", h.tl(23000) + " · sessiz, A sınıfı", { cost: 23000, itemGive: "camasir", m: 2, stress: -1, set: { tip: "sifir" }, go: "kurulum" }),
      c("İkinci el ilanından al", h.tl(9500) + " · on yaşında", { cost: 9500, itemGive: "camasir", set: { tip: "ikinci" }, go: "kurulum" }),
      c("Çamaşırhaneye götür", h.tl(600) + " her sefer · zaman gider", { cost: 600, stress: 2, end: "camasirhane" }),
    ],
    steps: {
      kurulum: {
        gap: 1,
        title: "Makine banyoya sığmıyor",
        text: (s) => {
          const u = ustaDurum(s);
          return (
            "Makine geldi ama banyoda musluk çıkışı yok, gider de ters tarafta. Birinin tesisatı uzatması lazım." +
            (u === "hileci" ? " Kombi faciasından sonra " + HS.ek(usta(s), "gen") + " numarasını silmiştin." : u === "durust" ? " Kombiyi dürüstçe yapan " + usta(s) + " \"ne zaman istersen\" demişti." : "")
          );
        },
        choices: (s, h) => [
          ustaDurum(s) === "hileci"
            ? c("O ustayı arama; uygulamadan usta bul", h.tl(3200) + " · yabancı ama faturalı", { cost: 3200, set: { montaj: "uygulama" }, go: "sel" })
            : c(HS.ek(usta(s), "acc") + " çağır", h.tl(2000) + (ustaDurum(s) === "durust" ? " · güvenilir" : ""), { cost: 2000, rel: { usta: 3 }, set: { montaj: "usta" }, go: "sel" }),
          c("Hortumu kendin uzat", "Bedava · Şans %50 sağlam olur", { skill: 0.5, chance: { p: 0.5, win: { m: 2, set: { montaj: "kendin_iyi" }, go: "sel" }, lose: { set: { montaj: "kendin" }, go: "sel" }, winT: "Tıkır tıkır", winP: "İlk yıkama sorunsuz.", loseT: "Galiba oldu", loseP: "Kelepçe biraz gevşek ama su kaçırmıyor... şimdilik." } }),
        ],
      },
      sel: {
        gap: 4,
        when: (s) => has(s, "camasir"),
        title: "Alt kattan kapı çalındı",
        text: (s, h) =>
          "Sabah yedide kapı çalındı. Alt kattaki komşun " + komsu(s) + " pijamalarıyla kapında: \"Tavanımızdan su akıyor!\" Makinenin tahliye hortumu yerinden fırlamış." +
          (h.d.montaj === "kendin" ? " Gevşek kelepçe... senin eserin." : h.d.montaj === "usta" ? " Hortumu " + usta(s) + " bağlamıştı." : "") +
          (komsuDost(s) ? " Neyse ki aranız iyi; " + komsu(s) + " önce \"sen iyi misin?\" diye sordu." : ""),
        choices: (s, h) => [
          c("Tavan boyasını sen öde", h.tl(6000) + " · komşuluk kurtulur", { cost: 6000, rel: { komsu: 8 }, stress: 2, end: "odedi" }),
          c("Kek götür, özür dile", "Şans %" + Math.round(Math.min(0.9, rel(s, "komsu") / 100 + 0.2) * 100) + " · " + h.tl(300), { cost: 300, chance: { p: Math.min(0.9, rel(s, "komsu") / 100 + 0.2), win: { rel: { komsu: 4 }, m: 1, end: "barisik" }, lose: { rel: { komsu: -12 }, stress: 4, end: "kuskun" }, winT: "Kek kurtardı", winP: "\"Olur böyle şeyler\" dedi. Boyayı kendisi halledecek.", loseT: "Kapı yüzüne kapandı", loseP: "Kek kutusu elinde kaldı. Merdivende selamı da kesti." } }),
          h.d.montaj === "usta" && ustaDurum(s) !== "hileci"
            ? c(HS.ek(usta(s), "acc") + " ara, işçilik hatası", "Usta düzeltir · komşu biraz bekler", { rel: { usta: -3, komsu: -3 }, stress: 1, end: "usta" })
            : null,
          s.flags.konutSig ? c("Konut sigortasına bildir", "Poliçen var · evrak işi", { stress: 2, rel: { komsu: 3 }, end: "sigorta" }) : null,
        ],
      },
    },
  });

  // =====================================================================
  // 4) Komşuyla tanışma: ufak bir iyilik dostluğa ya da soğukluğa döner.
  // =====================================================================
  HS.story("h_komsu", {
    when: apt,
    weight: 0.7,
    room: "sokak",
    title: "Merdivendeki pazar fileleri",
    text: (s) => {
      const k = HS.cast(s, "komsu");
      return "Asansör yine bozuk. Merdivende komşun " + komsu(s) + ", iki elinde ağzına kadar dolu pazar fileleriyle nefes nefese. " + "Seni görünce yüzü aydınlandı.";
    },
    choices: [
      c("Fileleri yukarı taşı", "Kollar yanar · komşuluk başlar", { rel: { komsu: 8 }, h: 0.5, people: 1, go: "cay" }),
      c("Bir fileyi al, gerisini o taşısın", "Orta yol", { rel: { komsu: 3 }, go: "cay" }),
      c("Selam verip geç", "Acelen var", { rel: { komsu: -4 }, end: "mesafe" }),
    ],
    steps: {
      cay: {
        gap: 2,
        room: "salon",
        title: "Çaya davet",
        text: (s) =>
          komsu(s) + " seni çaya çağırdı. Ev börek kokuyor, çaylar ince belli bardakta. Ama sorular da var: " +
          (s.partner ? "\"Düğün ne zaman?\"" : "\"Hâlâ yalnız mısın? Benim bir tanıdık var...\""),
        choices: [
          c("Git, akşama kadar otur", "Moral + · bir akşam gider", { rel: { komsu: 8 }, m: 2, people: 1, stress: -1, go: "rica" }),
          c("Yarım saatliğine uğra", "Kibarlık yerini bulur", { rel: { komsu: 3 }, go: "rica" }),
          c("Bahane bul", "Ev sende kalır · araya mesafe girer", { rel: { komsu: -6 }, stress: -1, end: "mesafe" }),
        ],
      },
      rica: {
        gap: 5,
        title: "Anahtar emaneti",
        text: (s) => komsu(s) + " bir haftalığına memlekete gidiyor. Kapında elinde anahtarla duruyor: \"Çiçeklerimi sular mısın? Bir de balıkları... Sana güveniyorum.\"",
        choices: [
          c("Tabii, anahtarı ver", "Şans %80 · unutursan ayıp olur", { chance: { p: 0.8, win: { rel: { komsu: 12 }, m: 2, people: 1, end: "dost" }, lose: { rel: { komsu: -14 }, m: -3, end: "kuskun" }, winT: "Görev tamam", winP: "Döndüğünde elinde kocaman bir kutu lokum vardı. Artık gerçek bir dostun var.", loseT: "Sardunyalar kurudu", loseP: "Üç gün unuttun. Balıklar yaşıyor ama sardunyalar..." } }),
          c("Bu hafta çok yoğunum", "Dürüst ama soğuk", { rel: { komsu: -5 }, end: "mesafe" }),
        ],
      },
    },
  });

  // =====================================================================
  // 5) Gürültü şikâyeti: komşuyla aran iyi değilse.
  // =====================================================================
  HS.story("h_gurultu", {
    when: (s) => apt(s) && HS.done(s, "h_komsu") !== "dost" && rel(s, "komsu") < 55,
    weight: (s) => (komsuKus(s) ? 0.7 : 0.4),
    room: "salon",
    title: "Gece yarısı kapı",
    text: (s) => "Saat 23.40. Arkadaşlarla sohbet koyulaşmış, müzik açık. Kapı çaldı: " + komsu(s) + " " + (HS.done(s, "h_komsu") === "kuskun" ? "zaten sana küskündü; şimdi iyice sinirli: " : "sinirli: ") + "\"Sesiniz yatak odamıza geliyor, sabah işe gideceğiz!\"",
    choices: [
      c("Özür dile, müziği kapat", "Gece biter · komşu yumuşar", { m: -2, people: -0.5, rel: { komsu: 4 }, end: "ozur" }),
      c("\"Daha saat on iki olmadı\"", "Gece sürer · kavga büyür", { m: 2, rel: { komsu: -10 }, go: "yonetim" }),
    ],
    steps: {
      yonetim: {
        gap: 3,
        title: "Yönetime dilekçe",
        text: (s) => "Apartman yöneticisi " + yon(s) + " arayıp " + HS.ek(komsu(s), "gen") + " yazılı şikâyetini okudu: \"Yönetim planına göre saat 23'ten sonra gürültü yasak. Bir daha olursa tutanak tutacağız.\"",
        choices: (s, h) => [
          c("Halı ve keçe al, yalıtım yap", h.tl(3500) + " · ilişkiler düzelir", { cost: 3500, rel: { komsu: 8, yonetim: 3 }, stress: -1, end: "barisik" }),
          c("Kapısına tatlı götür", "Şans %50 · " + h.tl(450), { cost: 450, chance: { p: 0.5, win: { rel: { komsu: 10 }, m: 2, end: "barisik" }, lose: { rel: { komsu: -4 }, end: "dusman" }, winT: "Buzlar eridi", winP: "\"Biz de çok üstüne geldik\" dedi.", loseT: "Kabul etmedi", loseP: "Tatlıyı kapıda bırakıp gittin. Ertesi gün kapının önünde boş tabak vardı." } }),
          c("Yönetim kuruluna itiraz et", "Şans %35 · gururun", { stress: 3, chance: { p: 0.35, win: { esteem: 3, rel: { komsu: -5 }, end: "hakli" }, lose: { rel: { komsu: -10, yonetim: -8 }, m: -3, end: "dusman" }, winT: "Haklı bulundun", winP: "Kurul, şikâyetin abartılı olduğuna karar verdi.", loseT: "Tutanak tutuldu", loseP: "Asansörde artık kimse seninle konuşmuyor." } }),
        ],
      },
    },
  });

  // =====================================================================
  // 6) Aidat toplantısı ve asansör revizyonu
  // =====================================================================
  HS.story("h_aidat", {
    when: apt,
    weight: 0.6,
    room: "salon",
    title: "Olağan genel kurul",
    text: (s) =>
      "Apartman panosunda duyuru: \"Kat malikleri toplantısı pazar 14.00'te sığınakta.\" Yönetici " + yon(s) + " aidatı " + (s.housing === "ev" ? "aylık ₺1.800'den ₺2.900'e" : "%60") + " çıkarmak istiyor." +
      (renter(s) ? " Kiracısın; aidat sana yansıyacak ama oy hakkın ev sahibinde." : ""),
    choices: (s) => [
      c("Toplantıya git, bütçeyi sorgula", "Şans %50 · stres +", { stress: 2, people: 1, chance: { p: 0.5, win: { esteem: 2, rel: { yonetim: -4 }, cash: 3000, set: { sorgu: 1 }, go: "asansor" }, lose: { rel: { yonetim: -6 }, m: -2, set: { sorgu: 1 }, go: "asansor" }, winT: "Zam yarıya indi", winP: "Bahçe ilaçlamasına üç kez para ödendiği ortaya çıktı. Herkes sana bakıyor.", loseT: "Kimse destek vermedi", loseP: "Herkes başını salladı ama oylamada elini kaldıran olmadı." } }),
      own(s) ? c("Yönetim kuruluna gönüllü ol", "Söz sende · dert de sende", { stress: 4, people: 2, rel: { yonetim: 10 }, esteem: 1, set: { kurul: 1 }, go: "asansor" }) : null,
      c("Gitme, ne çıkarsa", "Pazar senin", { stress: -1, rel: { yonetim: -1 }, go: "asansor" }),
    ],
    steps: {
      asansor: {
        gap: 4,
        title: "Asansöre kırmızı etiket",
        text: (s, h) =>
          "Yıllık asansör muayenesinde kırmızı etiket çıktı; asansör mühürlendi. Revizyon için daire başı ₺12.000 isteniyor." +
          (h.d.kurul ? " Kurul üyesi olarak teklifleri sen topladın; en ucuzu buydu." : "") +
          (renter(s) ? " Bu aslında ev sahibinin ödemesi gereken bir masraf." : "") +
          (s.housing === "kira-paylasim" ? " Ev arkadaşınla bölüşürsünüz." : ""),
        choices: (s, h) => {
          const pay = s.housing === "kira-paylasim" ? 6000 : 12000;
          return renter(s)
            ? [
                c("Ev sahibine yönlendir", "Şans %60", { chance: { p: 0.6, win: { stress: -1, end: "evsahibi" }, lose: { cost: pay, stress: 3, end: "odedi" }, winT: "Ev sahibi ödedi", winP: "\"Tabii, demirbaş benim\" dedi.", loseT: "\"Kiradan düşersin\"", loseP: "Kiradan düşeceğini söyledi; şimdilik para senden çıktı." } }),
                c("Kiradan düşerim deyip öde", h.tl(pay) + " · iş uzamaz", { cost: pay, rel: { yonetim: 5 }, end: "odedi" }),
                c("Merdiven kullan, ödeme", "Sağlık + · yönetim kızar", { h: 1, stress: 2, rel: { yonetim: -6 }, end: "merdiven" }),
              ]
            : [
                c("Payını hemen öde", h.tl(12000), { cost: 12000, rel: { yonetim: 5 }, stress: -1, end: "odedi" }),
                h.d.kurul || h.d.sorgu ? c("Üç taksit önerisi getir", h.tl(4000) + " şimdilik · kabul ettirirsin", { cost: 4000, people: 1, stress: 1, end: "taksit" }) : null,
                c("Ödemeyi geciktir", "Gecikme faizi · yönetim kızar", { rel: { yonetim: -10 }, stress: 3, end: "gecikti" }),
              ];
        },
      },
    },
  });

  // =====================================================================
  // 7) Dış cephe boyası oylaması (ev sahipleri). Aidat toplantısına bağlı.
  // =====================================================================
  HS.story("h_boya", {
    when: (s) => own(s) && HS.done(s, "h_aidat") !== undefined && s.week >= 10 && s.week <= 30,
    weight: 0.5,
    room: "sokak",
    title: "Cephe oylaması",
    text: (s) => {
      const a = HS.storyData(s, "h_aidat");
      return (
        "Binanın dış cephesi dökülüyor; yağmurda kuzey duvarı rutubet yapıyor. " + yon(s) + " iki teklif getirdi: mantolama ve boya ya da sadece boya." +
        (a.kurul ? " Kurulda olduğun için son sözü senin oyun belirleyecek." : HS.done(s, "h_aidat") === "gecikti" ? " Asansör payını geciktirdiğin için " + yon(s) + " sana pek sıcak bakmıyor." : "")
      );
    },
    choices: (s, h) => [
      c("Mantolama + boya", h.tl(38000) + " · kışın ısınma faturası düşer", { cost: 38000, m: 2, stress: -1, rel: { yonetim: 4 }, set: { secim: "mantolama" }, go: "iskele" }),
      c("Sadece boya", h.tl(18000) + " · görüntü kurtulur", { cost: 18000, set: { secim: "boya" }, go: "iskele" }),
      c("Hayır oyu ver", "Para cepte · bina eskir", { rel: { yonetim: -6 }, people: -0.5, end: "hayir" }),
    ],
    steps: {
      iskele: {
        gap: 6,
        title: "İskele kuruldu",
        text: (s, h) => "Binanın etrafı iskeleyle sarıldı. Sabah sekizde boyacılar pencerenin önünde türkü söylüyor; sen pijamayla kahve içerken göz göze geldiniz." + (h.d.secim === "mantolama" ? " Kalın strafor levhalar bir bir yapıştırılıyor." : ""),
        choices: (s, h) => [
          c("Ustalara çay demle", h.tl(200) + " · iş özenli olur", { cost: 200, people: 1, m: 2, end: h.d.secim }),
          c("Perdeleri kapat, sabret", "Üç hafta karanlık", { m: -2, stress: 2, end: h.d.secim }),
          c("Pencere kenarı boyanmamış, şikâyet et", "Şans %60", { chance: { p: 0.6, win: { m: 2, end: h.d.secim }, lose: { stress: 3, rel: { yonetim: -3 }, end: h.d.secim }, winT: "Rötuş yapıldı", winP: "Usta özür dileyip pencereyi yeniden boyadı.", loseT: "Duyan yok", loseP: "\"Abi o kısım teklifte yok\" dediler." } }),
        ],
      },
    },
  });

  // =====================================================================
  // 8) Kapıcı: bahşiş, sohbet, gece kapıda kalmak.
  // =====================================================================
  HS.story("h_kapici", {
    when: (s) => apt(s) && s.week >= 5,
    weight: 0.5,
    room: "sokak",
    title: (s) => kapici(s),
    text: (s) => "Kapıcı " + kapici(s) + " her sabah ekmeğini kapı koluna asıyor, çöpleri alıyor, kargoları teslim alıyor. Bu hafta torununun sünneti varmış; apartmanda zarf toplanıyor.",
    choices: (s, h) => [
      c("Zarfa para koy", h.tl(1500) + " · gönlü olur", { cost: 1500, m: 1, set: { iyi: 2 }, go: "anahtar" }),
      c("Çay ısmarla, sohbet et", "Para yok, gönül var", { people: 1, set: { iyi: 1 }, go: "anahtar" }),
      c("Bu ay olmaz", "Kimse fark etmez... belki", { set: { iyi: 0 }, go: "anahtar" }),
    ],
    steps: {
      anahtar: {
        gap: 6,
        when: apt,
        room: "sokak",
        title: "Gece kapıda kaldın",
        text: (s, h) =>
          "Gece biri. Kapıyı çektin, anahtarlar içeride kaldı. Telefonun %8." +
          (h.d.iyi ? " " + HS.ek(kapici(s), "gen") + " bodrum katındaki ışık yanıyor." : " Bodrumdan " + HS.ek(kapici(s), "gen") + " televizyon sesi geliyor.") +
          (HS.done(s, "h_kargo") === "kapici" ? " Geçen ay kargonu bulan da oydu." : ""),
        choices: (s, h) => [
          h.d.iyi
            ? c(HS.ek(kapici(s), "dat") + " seslen", "Yedek anahtar dolabı · ücretsiz", { m: 2, people: 0.5, end: "kapici" })
            : c(HS.ek(kapici(s), "dat") + " seslen", "Şans %40 · zarf meselesi", { chance: { p: 0.4, win: { m: 1, end: "kapici" }, lose: { cost: 2500, stress: 3, end: "cilingir" }, winT: "Kapıyı açtı", winP: "Gözlerini ovuşturarak yedek anahtarı getirdi.", loseT: "\"Bende yedek yok\"", loseP: "Çilingir çağırmak zorunda kaldın." } }),
          komsuDost(s) ? c("Yedek anahtar " + HS.ek(komsu(s), "loc") + "", "Ücretsiz · biraz mahcubiyet", { rel: { komsu: 2 }, m: 1, end: "komsu" }) : null,
          c("Çilingir çağır", h.tl(2500) + " · gece tarifesi", { cost: 2500, stress: 2, end: "cilingir" }),
        ],
      },
    },
  });

  // =====================================================================
  // 9) Otopark kavgası (arabası olanlar)
  // =====================================================================
  HS.story("h_otopark", {
    when: (s) => apt(s) && !!s.car && s.car !== "bisiklet",
    weight: 0.5,
    room: "garaj",
    title: "Park yerine kim koydu?",
    text: "Akşam yorgun argın geldin; sana ayrılan park yerinde yine aynı beyaz sedan duruyor. Kapıcıya sorunca öğrendin: 4 numaradakilerin üniversiteli oğlu Berkay.",
    choices: [
      c("Cama kibar bir not bırak", "Sakin yol", { go: "cevap", set: { yol: "not" } }),
      c("Yönetime şikâyet et", "Resmî yol", { stress: 1, rel: { yonetim: 2 }, go: "cevap", set: { yol: "yonetim" } }),
      c("Arkasına park et, sabah sıkışsın", "Şans %50 · intikam tatlıdır", { chance: { p: 0.5, win: { m: 3, end: "intikam" }, lose: { stress: 5, cost: 1500, end: "cizik" }, winT: "Ders aldı", winP: "Sabah 7'de kapını çalıp özür diledi.", loseT: "Kapıya çizik", loseP: "Çıkarken senin arabayı sürttü; boya ve tartışma." } }),
    ],
    steps: {
      cevap: {
        gap: 2,
        title: "Berkay'ın cevabı",
        text: (s, h) =>
          (h.d.yol === "not"
            ? "Notunun altına kurşun kalemle yazılmış: \"" + Sen(s) + " kusura bakma, bizim yerde inşaat malzemesi var.\""
            : "Yönetici " + yon(s) + " Berkay'ın ailesini uyardı. " + (HS.storyData(s, "h_aidat").kurul ? "Kurulda olduğun için herkes bu kararı senin sanıyor." : "Ailesi sana küsmüş.")) + " Bir hafta sorun yok ama otopark hâlâ sıkışık.",
        choices: (s, h) => [
          c("Berkay'la konuş, sırayla kullanın", "Komşuluk kazanır · bazen sokağa park", { people: 1, stress: 1, m: 1, end: "anlasma" }),
          c("Park yerine katlanır bariyer taktır", h.tl(3500) + " · kesin çözüm", { cost: 3500, stress: -2, rel: { yonetim: -2 }, end: "bariyer" }),
          c("Boş ver, sokağa park et", "Stres + · kış sabahı buzlu cam", { stress: 2, end: "sokak" }),
        ],
      },
    },
  });

  // =====================================================================
  // 10) Su sızıntısı: üst kattan. Dost komşu yardım eder, sigorta işe yarar.
  // =====================================================================
  HS.story("h_sizinti", {
    when: apt,
    weight: 0.5,
    room: "mutfak",
    title: "Tavanda sarı leke",
    text: (s) =>
      "Banyonun tavanında kocaman sarı bir leke belirdi; köşeden damla damla su iniyor. Üst kattaki daire yazlıkta, telefonları kapalı." +
      (komsuDost(s) ? " Sesini duyan " + komsu(s) + " elinde kovayla kapına geldi bile." : ""),
    choices: (s) => [
      komsuDost(s) ? c(komsu(s) + " ile ana vanayı bulun", "Dostluk işe yarar · stres −", { rel: { komsu: 4 }, stress: -2, people: 0.5, set: { yardim: 1 }, go: "hasar" }) : null,
      c(renter(s) ? "Ev sahibini ara" : "Yöneticiyi ara", "Resmî kayıt olur", { stress: 2, rel: renter(s) ? {} : { yonetim: 2 }, set: { bildirdi: 1 }, go: "hasar" }),
      c("Kova koy, sabaha bak", "Hasar büyüyebilir", { stress: 3, set: { gecikti: 1 }, go: "hasar" }),
    ],
    steps: {
      hasar: {
        gap: 2,
        title: "Hasar tespiti",
        text: (s, h) => {
          const dmg = h.d.gecikti ? 18000 : 12000;
          return (
            "Üst katta çamaşır makinesinin hortumu patlamış. Senin banyonun alçısı kabardı, dolap şişti; ustanın keşfi " + h.tl(dmg) + "." +
            (h.d.yardim ? " " + komsu(s) + " üst kat sahibinin İzmir'deki oğlunun numarasını buldu bile." : "") +
            (s.flags.konutSig ? " Deprem çantasını hazırlarken yaptırdığın konut sigortası aklına geldi." : "")
          );
        },
        choices: (s, h) => {
          const dmg = h.d.gecikti ? 18000 : 12000;
          return [
            s.flags.konutSig ? c("Konut sigortasına bildir", h.tl(1500) + " muafiyet · eksper gelir", { cost: 1500, stress: 2, end: "sigorta" }) : null,
            c("Üst kat sahibinden iste", "Şans %" + (h.d.yardim ? 75 : 45), { chance: { p: h.d.yardim ? 0.75 : 0.45, win: { stress: -1, end: "ustkat" }, lose: { cost: dmg, stress: 5, m: -3, end: "odedi" }, winT: "Hepsini ödedi", winP: "Mahcup oldu; ustasını da kendisi gönderdi.", loseT: "\"Benim sigortam yok\"", loseP: "Sulh hukuk yolu uzun; parayı sen bastın." } }),
            renter(s) ? c("Ev sahibi halletsin", "Şans %55 · beklersin", { stress: 2, chance: { p: 0.55, win: { end: "evsahibi" }, lose: { cost: dmg / 2, stress: 3, end: "odedi" }, winT: "Ev sahibi üstlendi", winP: "İki hafta rutubet kokusu, ama masraf senden çıkmadı.", loseT: "Yarı yarıya", loseP: "\"Dolap senin\" dedi; yarısı sana kaldı." } }) : null,
            ustaDurum(s) === "durust"
              ? c(usta(s) + " yapsın", h.tl(dmg * 0.6) + " · hızlı ve ucuz", { cost: dmg * 0.6, rel: { usta: 4 }, stress: -1, end: "usta" })
              : c("Ustaya kendin yaptır", h.tl(dmg) + " · hızlı biter", { cost: dmg, stress: -1, end: "odedi" }),
            c("Leke kalsın, bekle", "Ücretsiz · rutubet ve küf", { h: -2, m: -2, end: "bekle" }),
          ];
        },
      },
    },
  });

  // =====================================================================
  // 11) Deprem hazırlığı: çanta, konut sigortası, bina analizi
  // =====================================================================
  HS.story("h_deprem", {
    when: apt,
    weight: 0.55,
    room: "salon",
    title: "Deprem çantası",
    text: "Gece 03.12'de avize sallandı; 4,6 büyüklüğünde bir deprem. Sabah apartmanın grubunda herkes aynı şeyi soruyor: \"Bu bina sağlam mı?\"",
    choices: (s, h) => [
      c("Deprem çantası hazırla", h.tl(2500) + " · su, fener, düdük", { cost: 2500, stress: -2, set: { canta: 1 }, go: "bina" }),
      c("Çanta + konut sigortası", h.tl(6000) + " · eşya ve tesisat da güvende", { cost: 6000, stress: -4, flag: "konutSig", set: { canta: 1 }, go: "bina" }),
      c("Düşünmek istemiyorum", "Stres biraz artar", { stress: 2, go: "bina" }),
    ],
    steps: {
      bina: {
        gap: 5,
        title: "Bina analizi",
        text: (s, h) =>
          yon(s) + " binaya karot alınıp deprem dayanıklılık analizi yaptırmayı öneriyor: daire başı ₺4.500." +
          (HS.storyData(s, "h_aidat").kurul ? " Kurulda olduğun için firmayı sen seçeceksin." : "") +
          (renter(s) ? " Kiracı olarak masraf sana düşmez ama sonuç kötü çıkarsa taşınman gerekebilir." : ""),
        choices: (s, h) => [
          c("Analizi destekle", (own(s) ? h.tl(4500) + " · " : "") + "Şans %65 bina sağlam", { cost: own(s) ? 4500 : 0, rel: { yonetim: 4 }, chance: { p: 0.65, win: { stress: -4, m: 2, end: "saglam" }, lose: { stress: 6, go: "riskli" }, winT: "Rapor temiz", winP: "Beton dayanımı yönetmeliğe uygun çıktı. Rahat bir uyku.", loseT: "Rapor kötü", loseP: "Beton dayanımı düşük, demirler korozyonlu." } }),
          c("Karşı çık, \"boşuna masraf\"", "Bilmemek de bir seçim", { rel: { yonetim: -4 }, stress: 1, end: "bilinmiyor" }),
        ],
      },
      riskli: {
        gap: 3,
        title: "Riskli yapı",
        text: (s) => (own(s) ? "Bina riskli yapı ilan edilebilir. Müteahhitler kapıda; kentsel dönüşüm toplantısı var." : "Bina riskli çıktı. Ev sahibi \"abartıyorlar\" diyor ama sen geceleri her tıkırtıda uyanıyorsun."),
        choices: (s, h) =>
          own(s)
            ? [
                c("Dönüşüme evet de", "Bir buçuk yıl kirada · yeni bina", { stress: 6, m: -2, esteem: 2, end: "donusum" }),
                c("Güçlendirme öner", h.tl(60000) + " · bina ayakta kalır", { cost: 60000, stress: -3, rel: { yonetim: 3 }, end: "guclendirme" }),
                c("Bekle, başkaları karar versin", "Stres sürer", { stress: 4, end: "riskli" }),
              ]
            : [
                c("Taşınmayı planla", "İçin rahatlar · masraf sonra", { stress: -2, m: 1, end: "tasinacak" }),
                c("Şimdilik kal", "Kira ucuz ama huzur yok", { stress: 5, sleep: 2, end: "riskli" }),
              ],
      },
    },
  });

  // =====================================================================
  // 12) Sokak kedisi
  // =====================================================================
  HS.story("h_kedi", {
    when: (s) => !s.flags.kedi && s.housing !== "aile",
    weight: 0.5,
    room: "sokak",
    title: "Kapıdaki yavru",
    text: (s) =>
      "Apartman girişinde bir yavru kedi, bir haftadır kapının önünde. Kulağı yaralı, sana bakıp miyavlıyor." +
      (komsuDost(s) ? " " + komsu(s) + " \"Sen alırsan ben de bakarım\" diyor." : ""),
    choices: (s, h) => [
      c("Veterinere götür, sahiplen", h.tl(3000) + " ilk muayene, mama, kum", { cost: 3000, m: 6, stress: -2, flag: "kedi", log: "Bir sokak kedisini sahiplendi.", go: "asi" }),
      c("Mama ve su kabı koy", h.tl(400) + " · mahallenin kedisi olsun", { cost: 400, m: 1, people: 0.5, end: "sokak" }),
      c("Belediyenin hayvan ekibini ara", "Ücretsiz · içinde bir burukluk", { m: -1, end: "hayir" }),
    ],
    steps: {
      asi: {
        gap: 3,
        room: "salon",
        title: "Aşı takvimi",
        text: "Veteriner karma aşı, kuduz, iç-dış parazit ve kısırlaştırma için bir liste verdi. \"Kısırlaştırmazsanız birkaç ay sonra gece konserleri başlar\" dedi gülerek.",
        choices: (s, h) => [
          c("Hepsini yaptır", h.tl(8000) + " · içi rahat", { cost: 8000, m: 2, set: { kisir: 1 }, go: "olay" }),
          c("Sadece aşılar", h.tl(2500) + " · kısırlaştırma sonra", { cost: 2500, set: { kisir: 0 }, go: "olay" }),
        ],
      },
      olay: {
        gap: 7,
        when: (s) => !!s.flags.kedi,
        room: "salon",
        title: (s, h) => (h.d.kisir ? "Kedi bir şey yuttu" : "Gece konseri"),
        text: (s, h) =>
          h.d.kisir
            ? "Kedi ip yutmuş; kusuyor, yemek yemiyor. Acil veteriner gece tarifesinde."
            : "Kedi kızgınlığa girdi; sabaha kadar bağırıyor. Sabah " + komsu(s) + " kapıda: \"Bebek mi var sizde?\"",
        choices: (s, h) =>
          h.d.kisir
            ? [
                c("Hemen acile götür", h.tl(9000) + " · kurtulur", { cost: 9000, m: 2, stress: 3, end: "kedi" }),
                c("Sabahı bekle, gözle", "Şans %60 · ucuz", { chance: { p: 0.6, win: { stress: 2, end: "kedi" }, lose: { cost: 14000, stress: 8, m: -4, end: "kedi" }, winT: "Kendiliğinden çıktı", winP: "Sabaha karşı ipi çıkardı ve hiçbir şey olmamış gibi mamasını yedi.", loseT: "Ameliyat", loseP: "Bağırsakta takılmış; ameliyat şart oldu." } }),
              ]
            : [
                c("Kısırlaştırmayı şimdi yaptır", h.tl(5500) + " · komşuya özür", { cost: 5500, rel: { komsu: 2 }, end: "kedi" }),
                c("Komşuya kek götür, idare et", h.tl(300) + " · geceler uzun", { cost: 300, sleep: 3, rel: { komsu: komsuDost(s) ? 1 : -6 }, end: "kedi" }),
              ],
      },
    },
  });

  // =====================================================================
  // 13) Bitkiler ve yolculuk: dost komşu sular, kedi de beslenir.
  // =====================================================================
  HS.story("h_bitki", {
    when: (s) => s.housing !== "aile",
    weight: 0.45,
    room: "salon",
    title: "Saksı merakı",
    text: "Çiçekçide indirim var: dev bir deve tabanı, sarmaşıklar, sukulentler. Salonun bir köşesi bomboş duruyor.",
    choices: (s, h) => [
      c("Salonu ormana çevir", h.tl(2400) + " · moral +", { cost: 2400, m: 4, stress: -2, set: { cok: 1 }, go: "seyahat" }),
      c("Bir deve tabanı yeter", h.tl(900), { cost: 900, m: 2, go: "seyahat" }),
      c("Bir kaktüs al, unutsan da yaşar", h.tl(150), { cost: 150, m: 1, end: "kaktus" }),
    ],
    steps: {
      seyahat: {
        gap: 7,
        title: "Bir hafta evde yoksun",
        text: (s, h) =>
          "Bir haftalığına memlekete gitmen gerekiyor. " + (h.d.cok ? "Salondaki on iki saksı" : "Deve tabanı") + " ne olacak?" +
          (s.flags.kedi ? " Kedinin de mamasını ve kumunu birinin halletmesi lazım." : "") +
          (komsuDost(s) ? " " + komsu(s) + " daha sen sormadan \"anahtarı bırak\" dedi." : ""),
        choices: (s, h) => [
          komsuDost(s) ? c("Anahtarı " + HS.ek(komsu(s), "dat") + " bırak", "Ücretsiz · dönüşte hediye götür", { rel: { komsu: 4 }, cost: 500, m: 2, end: "komsu" }) : null,
          c("Damla sulama düzeneği kur", h.tl(700) + (s.flags.kedi ? " · kedi için ayrıca bakıcı " + h.tl(2500) : "") + " · Şans %70", { cost: s.flags.kedi ? 3200 : 700, chance: { p: 0.7, win: { m: 1, end: "yasadi" }, lose: { m: -3, end: "kurudu" }, winT: "Hepsi hayatta", winP: "Döndüğünde yapraklar parlıyordu.", loseT: "Hortum tıkanmış", loseP: "Deve tabanı boynunu bükmüş." } }),
          c("Kaderine bırak", "Ücretsiz · Şans %30", { stress: s.flags.kedi ? 3 : 0, chance: { p: 0.3, win: { end: "yasadi" }, lose: { m: -4, end: "kurudu" }, winT: "Dayanıklı çıktılar", winP: "Biraz solgun ama yaşıyorlar.", loseT: "Kuru yapraklar", loseP: "Salon sonbahara dönmüş." } }),
        ],
      },
    },
  });

  // =====================================================================
  // 14) İnternet aboneliği: taahhüt ve cayma bedeli
  // =====================================================================
  HS.story("h_internet", {
    when: (s) => s.housing !== "aile",
    weight: 0.5,
    room: "salon",
    title: "İnternet aboneliği",
    text: "Yeni evde internet yok; telefondan paylaşım yapmaktan kotan bitti. Fiber kampanyası: 24 ay taahhütle aylık ₺650, taahhütsüz ₺950.",
    choices: (s, h) => [
      c("24 ay taahhütlü al", h.tl(650) + "/ay · bağlanırsın", { cost: 650, m: 2, set: { taahhut: 1 }, go: "kesinti" }),
      c("Taahhütsüz al", h.tl(950) + "/ay · özgürsün", { cost: 950, m: 2, set: { taahhut: 0 }, go: "kesinti" }),
      c("Mobil hatla idare et", "Ucuz · görüntülü toplantıda donar", { stress: 2, perf: -1, end: "mobil" }),
    ],
    steps: {
      kesinti: {
        gap: 6,
        when: (s) => s.housing !== "aile",
        title: "Akşam dokuzda kopan internet",
        text: (s, h) =>
          "Her akşam dokuz gibi internet kopuyor; hız testinde 1000 yerine 28 Mbps. Müşteri hizmetleri seni üç kez menüden menüye attı." +
          (h.d.taahhut ? " Başka şirkete geçersen cayma bedeli " + h.tl(4800) + "." : "") +
          (s.housing === "kira-paylasim" ? " Ev arkadaşın da bu yüzden oyunlarda kaybettiğini söyleyip duruyor." : ""),
        choices: (s, h) =>
          h.d.taahhut
            ? [
                c("Cayma bedelini öde, geç", h.tl(4800) + " · hemen kurtulursun", { cost: 4800, stress: -3, end: "gecti" }),
                c("Bilgi Teknolojileri Kurumu'na şikâyet et", "Şans %50 · uğraşırsın", { stress: 2, chance: { p: 0.5, win: { m: 4, esteem: 2, end: "kazandi" }, lose: { stress: 3, m: -2, end: "katlandi" }, winT: "Cayma bedelsiz fesih", winP: "Altyapı sorunu kayda geçti; ücretsiz çıktın.", loseT: "\"Teknik ekip yönlendirildi\"", loseP: "Yönlendirildi. Ve yönlendirildi." } }),
                c("Katlan, 18 ay kaldı", "Ücretsiz · sinir bozucu", { stress: 4, perf: -1, end: "katlandi" }),
              ]
            : [
                c("Hemen başka şirkete geç", h.tl(500) + " kurulum · pişman olmazsın", { cost: 500, stress: -3, m: 2, end: "gecti" }),
                c("Bir ay daha dene", "Belki düzelir", { stress: 2, end: "katlandi" }),
              ],
      },
    },
  });

  // =====================================================================
  // 15) Kargo karışıklığı: komşuyla aran ne durumda?
  // =====================================================================
  HS.story("h_kargo", {
    when: apt,
    weight: 0.55,
    room: "sokak",
    title: "\"Teslim edildi\" ama nerede?",
    text: (s) => "Uygulama \"Teslim edildi\" diyor, kapında bir şey yok. Kuryenin çektiği fotoğrafta paket, " + HS.ek(komsu(s), "gen") + " kapısının önünde.",
    choices: [
      c("Komşunun kapısını çal", "Hızlı yol", { go: "kapi" }),
      c("Kargo şirketine şikâyet yaz", "Resmî yol · yavaş", { stress: 2, set: { sikayet: 1 }, go: "kapi" }),
    ],
    steps: {
      kapi: {
        gap: 1,
        title: (s) => (rel(s, "komsu") >= 55 ? "Paket bulundu... açılmış" : "\"Bana bir şey gelmedi\""),
        text: (s, h) =>
          rel(s, "komsu") >= 55
            ? komsu(s) + " paketi elinde getirdi, yüzü kıpkırmızı: \"Kendi siparişim sandım, açtım... İçinden kırmızı dantelli bir şey çıktı.\""
            : komsu(s) + " kapıyı aralık açıp \"bana bir şey gelmedi\" dedi. Ama kapısının arkasında aynı boyda bir kutu gözüne çarptı." + (h.d.sikayet ? " Kargo şirketi de \"teslim edildi\" diye ısrar ediyor." : ""),
        choices: (s, h) =>
          rel(s, "komsu") >= 55
            ? [
                c("Birlikte gül, kahve yap", "Komşuluk pekişir", { rel: { komsu: 6 }, m: 3, end: "guldu" }),
                c("Paketi kap, hızla kapıyı kapat", "Utanç geçer", { m: -1, esteem: -1, end: "utandi" }),
              ]
            : [
                c("Kapıcıya sor", "Şans %70 · " + kapici(s) + " her şeyi görür", { chance: { p: 0.7, win: { m: 2, end: "kapici" }, lose: { cost: 1800, m: -2, end: "kayip" }, winT: "Paket bulundu", winP: kapici(s) + " kutuyu bodrumda emanete almış; fotoğraf başka kapıdaymış.", loseT: "Paket kayıp", loseP: "Kimse görmemiş. Ürünü yeniden aldın." } }),
                c("Israr et, kutuya bak", "Şans %50 · kavga çıkabilir", { chance: { p: 0.5, win: { rel: { komsu: -3 }, esteem: 1, end: "buldu" }, lose: { rel: { komsu: -10 }, stress: 4, cost: 1800, end: "kavga" }, winT: "Seninmiş", winP: "\"Aaa, ben fark etmemişim\" dedi. Kutuyu aldın.", loseT: "Kutu onunmuş", loseP: "Kendi kutusuymuş. Hem paket yok hem komşuyla aran bozuk." } }),
                c("İade iste, uğraşma", "Paran üç haftada döner", { stress: 2, end: "iade" }),
              ],
      },
    },
  });

  // =====================================================================
  // 16) Ev arkadaşı (yalnızca kira-paylaşım)
  // =====================================================================
  const EA = ["Mert", "Ece", "Onur", "Selin", "Emre", "Melis", "Kaan", "Zeynep"];
  const eaAd = (s) => EA[(s.weeks + (s.first || "").length) % EA.length];
  HS.story("h_evarkadasi", {
    when: (s) => s.housing === "kira-paylasim",
    weight: 0.7,
    room: "mutfak",
    title: "Lavabodaki üç günlük tencere",
    text: (s) => "Ev arkadaşın " + eaAd(s) + " üç gündür menemen tavasını lavaboda bekletiyor. Buzdolabındaki yoğurdunun da yarısı gitmiş. Sabrın taşmak üzere.",
    choices: (s) => {
      const ad = eaAd(s);
      return [
        c("Ev toplantısı yap, görev çizelgesi", "Yetişkince · biraz gergin", { stress: 1, people: 0.5, set: { ad, yol: "cizelge" }, go: "fatura" }),
        c("Buzdolabına pasif-agresif not as", "\"Yoğurt kendi kendine bitmiyor :)\"", { m: 1, set: { ad, yol: "not" }, go: "fatura" }),
        c("Sessizce kendin yıka", "Huzur · içinde birikir", { stress: 3, set: { ad, yol: "sessiz" }, go: "fatura" }),
      ];
    },
    steps: {
      fatura: {
        gap: 3,
        when: (s, d) => s.housing === "kira-paylasim" && !!d.ad,
        title: "Doğalgaz faturası",
        text: (s, h) =>
          "Doğalgaz faturası " + h.tl(4800) + " geldi. " + h.d.ad + " gece kombiyi 26 dereceye açıp unutuyor; üstelik sevgilisi haftanın dört günü sizde kalıyor." +
          (h.d.yol === "cizelge" ? " En azından çizelge sayesinde bulaşıklar düzene girdi." : h.d.yol === "not" ? " Notunun altına \"Sen de duşta 40 dakika kalıyorsun :)\" yazılmıştı." : ""),
        choices: (s, h) => [
          c("Yarı yarıya öde, uzatma", h.tl(2400) + " · barış sürer", { cost: 2400, stress: 1, set: { son: "iyi" }, go: "ayrilik" }),
          c("Üçe böl, sevgilisi de ödesin", "Şans %50 · haklısın ama", { chance: { p: 0.5, win: { cost: 1600, esteem: 2, set: { son: "iyi" }, go: "ayrilik" }, lose: { cost: 2400, stress: 4, set: { son: "kotu" }, go: "ayrilik" }, winT: "Kabul etti", winP: "\"Haklısın\" dedi; sevgilisi de bir koli çay getirdi.", loseT: "Kapılar çarptı", loseP: "Bir hafta konuşmadınız." } }),
          c("Akıllı termostat al", h.tl(3500) + " · tartışma biter", { cost: 3500, stress: -2, skill: 0.5, set: { son: "iyi" }, go: "ayrilik" }),
        ],
      },
      ayrilik: {
        gap: 8,
        when: (s, d) => s.housing === "kira-paylasim" && !!d.ad,
        title: (s, h) => h.d.ad + " taşınıyor",
        text: (s, h) =>
          h.d.ad + " başka şehirde iş bulmuş; ay sonunda çıkıyor. " +
          (h.d.son === "iyi" ? "Son akşam balkonda çay içip eski günleri andınız." : "Odasını boşaltırken kimse kimseye bakmıyor.") +
          " Kiranın yarısı artık boşta.",
        choices: (s, h) => [
          c("İlan ver, yeni ev arkadaşı bul", "Şans %60 iyi biri gelir", { chance: { p: 0.6, win: { m: 3, people: 1, end: "yeni" }, lose: { stress: 5, m: -2, end: "yeni_kotu" }, winT: "Temiz ve sessiz", winP: "Yeni gelen her pazar börek yapıyor.", loseT: "Gece kuşu", loseP: "Yeni ev arkadaşın sabah dörtte davul çalışıyor." } }),
          c("Bir arkadaşını davet et", "Tanıdık şeytan", { people: 1, m: 2, rel: { enYakin: 3 }, end: "arkadas" }),
          c("Bir ay kirayı tek başına öde", h.tl(16000) + " · yalnızlık huzuru", { cost: 16000, stress: -2, m: 1, end: "yalniz" }),
          h.d.son === "iyi" ? c(HS.ek(h.d.ad, "dat") + " veda hediyesi al", h.tl(800) + " · dostluk kalır", { cost: 800, people: 1, m: 2, end: "dost" }) : null,
        ],
      },
    },
  });

  // =====================================================================
  // 17) Memleketten misafir: sınava gelen genç akraba
  // =====================================================================
  const young = (s) =>
    (s.kin || []).find((k) => k.alive && ["kuzen", "kardesK", "kardesE"].includes(k.rel) && k.city !== s.city && s.year - k.born >= 17 && s.year - k.born <= 24);
  HS.story("h_misafir", {
    when: (s) => s.housing !== "aile" && !!young(s),
    weight: 0.6,
    room: "salon",
    title: "Memleketten telefon",
    text: (s, h) => {
      const k = young(s);
      const yks = s.year - k.born <= 19;
      return HS.kinLabel(k) + " " + k.name + " arıyor: " + (yks ? "YKS için senin şehrinde sınava girecekmiş." : "senin şehrinde bir iş mülakatı varmış.") + " \"Üç gece sende kalabilir miyim?\"" + (s.flags.kedi ? " Kediye alerjisi olduğunu da ekliyor." : "");
    },
    choices: (s, h) => {
      const k = young(s);
      const yks = s.year - k.born <= 19;
      return [
        c("Tabii, gelsin", h.tl(1500) + " misafir masrafı · bağ +", { cost: 1500, kinBond: { id: k.id, v: 8 }, stress: 1, set: { id: k.id, ad: k.name, yks }, go: "sinav" }),
        c("Yakında bir pansiyon ayarla", h.tl(4000) + " · ev düzenin bozulmaz", { cost: 4000, kinBond: { id: k.id, v: 2 }, end: "pansiyon" }),
        c("Bu ara müsait değilim", "Aile grubunda konuşulur", { kinBond: { id: k.id, v: -8 }, m: -1, end: "hayir" }),
      ];
    },
    steps: {
      sinav: {
        gap: 1,
        when: (s, d) => !!d.ad,
        title: (s, h) => (h.d.yks ? "Sınav sabahı" : "Mülakat sabahı"),
        text: (s, h) => "Saat 07.30. " + h.d.ad + " heyecandan kahvaltı edemedi; " + (h.d.yks ? "kimliği" : "dosyasını") + " iki kez kontrol etti." + (s.flags.kedi ? " Gece kedi yüzünden hapşırıp durdu." : "") + " Bina şehrin öbür ucunda.",
        choices: (s, h) => [
          s.car && s.car !== "bisiklet"
            ? c("Arabayla götür, kapıda bekle", h.tl(400) + " benzin · işe geç kalırsın", { cost: 400, perf: s.job !== "none" ? -1 : 0, kinBond: { id: h.d.id, v: 6 }, chance: { p: s.flags.kedi ? 0.45 : 0.55, win: { set: { sonuc: 1 }, go: "sonuc" }, lose: { set: { sonuc: 0 }, go: "sonuc" }, winT: "İyi geçti", winP: "Çıkışta gülümsüyordu.", loseT: "Zor geçti", loseP: "Çıkışta sessizdi." } })
            : c("Taksiye bindir", h.tl(650), { cost: 650, chance: { p: s.flags.kedi ? 0.45 : 0.55, win: { set: { sonuc: 1 }, go: "sonuc" }, lose: { set: { sonuc: 0 }, go: "sonuc" }, winT: "İyi geçti", winP: "Akşam \"bence oldu\" diye mesaj attı.", loseT: "Zor geçti", loseP: "Akşam sessizdi." } }),
          c("Metroyla birlikte git, moral ver", "Yarım gün gider · bağ ++", { perf: s.job !== "none" ? -1 : 0, kinBond: { id: h.d.id, v: 10 }, chance: { p: 0.55, win: { set: { sonuc: 1 }, go: "sonuc" }, lose: { set: { sonuc: 0 }, go: "sonuc" }, winT: "İyi geçti", winP: "Yolda konuşa konuşa stresi dağıldı.", loseT: "Zor geçti", loseP: "Elinden geleni yaptı." } }),
        ],
      },
      sonuc: {
        gap: 6,
        when: (s, d) => !!d.ad,
        title: (s, h) => (h.d.sonuc ? h.d.ad + " kazandı!" : HS.ek(h.d.ad, "abl") + " haber"),
        text: (s, h) =>
          h.d.sonuc
            ? h.d.ad + " " + (h.d.yks ? "senin şehrindeki üniversiteyi kazanmış" : "işe alınmış") + "! \"" + Sen(s) + ", " + (h.d.yks ? "yurt çıkana" : "ev tutana") + " kadar bir dönem sende kalabilir miyim?\""
            : h.d.ad + " bu sefer olmadı. Telefonda sesi titriyor: \"" + (h.d.yks ? "Seneye yine gelirim, beni yine alır mısın?" : "Başka mülakatlar da çıkar, yine gelsem olur mu?") + "\"",
        choices: (s, h) =>
          h.d.sonuc
            ? [
                c("Kalsın, bir dönem", h.tl(6000) + " ek masraf · kalabalık ev", { cost: 6000, stress: 3, kinBond: { id: h.d.id, v: 12 }, people: 1, end: "kaldi" }),
                c(h.d.yks ? "Yurt bulmasına yardım et" : "Ev bulmasına yardım et", h.tl(1500) + " depozito katkısı", { cost: 1500, kinBond: { id: h.d.id, v: 5 }, end: "yurt" }),
              ]
            : [
                c("\"Kapım hep açık\" de", "Bağ +", { kinBond: { id: h.d.id, v: 8 }, m: 1, end: "teselli" }),
                c(h.d.yks ? "Dershane parasına katkı yap" : "Kurs parasına katkı yap", h.tl(5000), { cost: 5000, kinBond: { id: h.d.id, v: 12 }, m: 2, end: "destek" }),
              ],
      },
    },
  });

  // =====================================================================
  // 18) Taşınma günü
  // =====================================================================
  HS.story("h_tasinma", {
    when: (s) => renter(s) && s.flags.newLease && s.weeks - s.flags.newLease <= 6 && s.weeks > 8,
    weight: 0.8,
    room: "sokak",
    title: "Taşınma günü",
    text: (s) =>
      "Nakliyeci \"üç kişi geliriz\" demişti; kamyon tek şoförle geldi. Yeni evin asansörü dar, koltuk sığmıyor." +
      (has(s, "camasir") || has(s, "bulasik") ? " Bir de " + (has(s, "camasir") ? "çamaşır" : "bulaşık") + " makinesini söküp takmak lazım." : ""),
    choices: (s, h) => [
      c("Ekstra hamal parası öde", h.tl(3500) + " · bel kurtulur", { cost: 3500, stress: -2, go: "ilkgece" }),
      c("Arkadaşları çağır, lahmacun ısmarla", h.tl(1200) + " · koltuk çizilebilir", { cost: 1200, people: 1, m: 2, rel: { enYakin: 4 }, go: "ilkgece" }),
      c("Şoförle ikiniz taşıyın", "Ucuz · Şans %50 bel", { chance: { p: 0.5, win: { m: 1, go: "ilkgece" }, lose: { h: -4, stress: 4, go: "ilkgece" }, winT: "Bitti", winP: "Son kolinin ardından merdivende oturup ayran içtin.", loseT: "Bel tuttu", loseP: "Koltuğu dördüncü kata çıkarırken belin \"tık\" dedi." } }),
    ],
    steps: {
      ilkgece: {
        gap: 1,
        room: "yatak",
        title: "Yeni evde ilk gece",
        text: (s) => "Perdeler yok, sokak lambası tam yüzüne vuruyor. Kolilerin arasında yatağı buldun ama sıcak su yok; doğalgaz aboneliği açılmamış." + (HS.done(s, "h_kombi") === "usta_durust" ? " " + usta(s) + " \"taşınınca söyle, kombiyi bir kontrol ederim\" demişti." : ""),
        choices: (s, h) => [
          HS.done(s, "h_kombi") === "usta_durust"
            ? c(HS.ek(usta(s), "acc") + " çağır", h.tl(1000) + " · ertesi gün sıcak su", { cost: 1000, rel: { usta: 3 }, stress: -2, end: "usta" })
            : c("e-Devlet'ten aboneliği aç, bekle", "Üç gün soğuk duş", { stress: 2, h: -1, end: "bekle" }),
          c("İlk gece otelde kal", h.tl(2500), { cost: 2500, m: 2, sleep: -2, end: "otel" }),
          c("Kolilerin arasında pizza ye", h.tl(450) + " · yeni başlangıç", { cost: 450, m: 3, end: "pizza" }),
        ],
      },
    },
  });

  // =====================================================================
  // 19) Yan dairede tadilat
  // =====================================================================
  HS.story("h_tadilat", {
    when: apt,
    weight: 0.45,
    room: "salon",
    title: "Sabah sekizde kırıcı",
    text: (s) =>
      "Yan daireyi yeni sahibi yıktırıyor: sabah sekizde kırıcı, öğlen spiral, akşam yine kırıcı." +
      (HS.done(s, "h_gurultu") === "dusman" ? " Senin müziğinden şikâyet eden " + komsu(s) + " bile kapıya çıkıp söyleniyor; ironik." : "") +
      (HS.done(s, "h_kombi") === "usta_durust" ? " Merdivende " + HS.ek(usta(s), "acc") + " gördün; tesisatı o yapıyormuş." : ""),
    choices: (s, h) => [
      c("Gürültü önleyici kulaklık al", h.tl(4500) + " · huzur", { cost: 4500, stress: -3, m: 1, go: "catlak" }),
      c("Yönetime şikâyet: çalışma saatleri", "Yönetmelik 09.00-19.00", { stress: 1, rel: { yonetim: 3 }, go: "catlak" }),
      HS.done(s, "h_kombi") === "usta_durust"
        ? c(HS.ek(usta(s), "abl") + " rica et, öğle arası sessiz olsun", "Tanıdıklık işe yarar", { rel: { usta: 2 }, stress: -2, go: "catlak" })
        : c("Üç gün kafede çalış", h.tl(900) + " · iş verimli", { cost: 900, perf: 1, go: "catlak" }),
    ],
    steps: {
      catlak: {
        gap: 3,
        when: apt,
        title: "Duvarda çatlak",
        text: "Kırıcının titreşiminden senin salon duvarında saç kılı gibi bir çatlak belirdi; mutfakta bir fayans düştü.",
        choices: (s, h) => [
          c("Fotoğrafla, yan daire sahibine göster", "Şans %60 masrafı karşılar", { chance: { p: 0.6, win: { stress: -1, end: "odedi" }, lose: { cost: 3500, stress: 3, end: "kendin" }, winT: "Kabul etti", winP: "Ustasını gönderip çatlağı da fayansı da yaptırdı.", loseT: "\"Zaten çatlaktı\"", loseP: "Tamir sana kaldı." } }),
          c("Kendin macunla, uğraşma", h.tl(500), { cost: 500, skill: 0.5, end: "kendin" }),
          c("Deprem değil ya, boş ver", "Ücretsiz · içine kurt düşer", { stress: HS.done(s, "h_deprem") === "riskli" ? 6 : 2, end: "bosver" }),
        ],
      },
    },
  });
})(globalThis.HS || (globalThis.HS = {}));
