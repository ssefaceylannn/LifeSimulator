// İş, kariyer ve üniversite öğrenciliği hikâyeleri (ön ek: "w_").
// Aynı iş arkadaşı (isArk) ve yönetici (yonetici) hikâyeler boyunca tekrar görünür;
// bir hikâyenin sonucu (HS.done / HS.storyData / bayraklar) sonrakinin metnini ve
// seçeneklerini değiştirir.
(function (HS) {
  "use strict";
  const c = (label, hint, fx = {}) => ({ label, hint, fx });
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

  // ---------- Yardımcılar ----------
  const isWork = (s) => !!s.job && s.job !== "none" && s.job !== "crime" && !s.retired;
  // Ekip ve yöneticisi olan işler (müzisyen ve esnaf hariç)
  const team = (s) => isWork(s) && !["music", "business"].includes(s.job);
  const stu = (s) => s.edu === "ogrenci";
  const coName = (s) => (s.company && HS.co(s.company) ? HS.co(s.company).name : "iş yeri");
  const P = (s, v) => (s.company ? { payAdj: v } : {});
  const N = (s, r) => HS.castName(s, r);
  const rel = (s, r) => HS.castRel(s, r);
  const perf = (s) => s.perf ?? 55;
  const majorName = (s) => (s.major && s.major.name ? s.major.name : "bölümün");
  const nm = (s, list, k) => list[((s.seed || 0) + k) % list.length];
  const sk = (s, id) => (HS.Skills ? HS.Skills.get(s, id) : 0);
  const PLACE = { office: "ofis", cafe: "kafe", factory: "fabrika", teacher: "okul", nurse: "servis", memur: "daire" };
  const place = (s) => PLACE[s.job] || "iş yeri";
  const done = (s, id) => HS.done(s, id);
  const flag = (s, k) => !!(s.flags && s.flags[k]);

  // ==========================================================
  // 1) İş arkadaşı üçlemesi: ilk gün yardımı → terfi yarışı → örtbas
  // ==========================================================
  HS.story("w_ilkGun", {
    when: (s) => team(s) && (s.jobWeeks || 0) < 30,
    weight: 0.8,
    room: "is",
    title: "Yeni yerde ilk günler",
    text: (s, h) =>
      h.ek(coName(s), "loc") + " daha kimin nerede oturduğunu bilmiyorsun. " + h.cast("isArk").name +
      " yanına geldi: \"Şifreler, yemekhane, kimin kahvesine dokunulmaz… Hepsini bir öğlende anlatırım.\"",
    choices: (s, h) => [
      c("Öğle yemeğini sen ısmarla", "₺900 · iyi bir başlangıç", { cost: 900, m: 3, people: 1, rel: { isArk: 12 }, set: { yemek: 1 }, go: "kahve" }),
      c("Teşekkür et, notlarını al", "Mesafeli ama kibar", { sk: { disiplin: 1 }, rel: { isArk: 4 }, go: "kahve" }),
      c("Kendi başıma çözerim", "Özgüven + · ilişki −", { esteem: 3, m: -1, rel: { isArk: -8 }, end: "yalniz" }),
    ],
    steps: {
      kahve: {
        gap: 3,
        when: team,
        title: (s, h) => h.ek(h.cast("isArk").name, "gen") + " ilk sırrı",
        text: (s, h) =>
          "Çay ocağında " + h.cast("isArk").name + " sesini alçalttı: \"" + h.cast("yonetici").name +
          " cuma akşamları iş verir, pazartesi sabah ister. Ona hemen 'olur' deme.\" Bu bilgiyi kime söylediğine dikkat etmen gerek.",
        choices: (s, h) => [
          c("Sır olarak sakla, dostluğu büyüt", "İlişki + · çevre +", { rel: { isArk: 10 }, people: 1, m: 2, end: "dost" }),
          c("Yöneticiyle iyi geçin, bu sözleri unut", "Performans + · ilişki −", { perf: 3, rel: { yonetici: 5, isArk: -6 }, end: "mesafe" }),
          c("Takıl: \"Senin cuma işlerin de az değil\"", "İletişim +", { sk: { iletisim: 2 }, rel: { isArk: 3 }, m: 1, end: "dost" }),
        ],
      },
    },
  });

  HS.story("w_terfi", {
    when: (s) => team(s) && (s.jobWeeks || 0) >= 26 && done(s, "w_ilkGun") !== undefined,
    weight: 0.6,
    room: "is",
    title: "Tek kişilik koltuk",
    text: (s, h) => {
      const fr = done(s, "w_ilkGun") === "dost";
      return (
        h.cast("yonetici").name + " ekipte bir \"takım sorumlusu\" seçileceğini duyurdu. Aday iki kişi: sen ve " +
        h.cast("isArk").name + ". " +
        (fr ? "İlk günden beri birbirinize yardım ettiniz; şimdi aynı koltuğa bakıyorsunuz." : "Aranızda zaten pek sıcaklık yoktu; koridorlar daha da soğudu.")
      );
    },
    choices: (s, h) => [
      c("Sunumla göz doldur", "Hafta sonları hazırlık · stres +", { stress: 6, sleep: 3, sk: { sunum: 3, proje: 1 }, set: { yol: "sunum" }, go: "karar" }),
      c(h.cast("isArk").name + " ile açık konuş", "Kim kazanırsa diğerine destek", { sk: { iletisim: 2 }, rel: { isArk: 8 }, set: { yol: "anlasma" }, go: "karar" }),
      c("Adaylıktan çekil", "Arkadaşlık + · kariyer −", { esteem: -3, rel: { isArk: 15 }, perf: -2, m: -1, end: "cekildi" }),
    ],
    steps: {
      karar: {
        gap: 4,
        when: team,
        title: "Kararın açıklandığı gün",
        text: (s, h) =>
          "Toplantı odasına çağrıldın. " + h.cast("yonetici").name + " dosyayı açtı; " + h.cast("isArk").name +
          " camın ardından bakıyor. Son bir şey söyleme şansın var.",
        choices: (s, h) => {
          const p = clamp(0.3 + (perf(s) - 50) / 70 + (h.d.yol === "sunum" ? 0.1 : 0) + (rel(s, "yonetici") - 50) / 200, 0.12, 0.85);
          return [
            c("Rakamlarınla konuş", "Şans performansına bağlı", {
              chance: {
                p,
                win: { ...P(s, 1.08), perf: 5, esteem: 6, m: 6, rel: { isArk: h.d.yol === "anlasma" ? 0 : -10 }, end: "kazandi" },
                lose: { m: -5, esteem: -4, rel: { isArk: -3 }, end: "kaybetti" },
                winT: "Koltuk senin",
                winP: "Ekibin küçük bir pasta aldı. Maaş bordronda farkı ay sonu göreceksin.",
                loseT: "Koltuk " + h.ek(h.cast("isArk").name, "gen") + " oldu",
                loseP: "Tebrik ederken gülümsemen biraz zorlandı.",
              },
            }),
            c("\"Ekip için en iyisi kimse o\" de", "Ilımlı · ilişki +", { rel: { isArk: 6, yonetici: 4 }, perf: 1, m: -1, end: "kaybetti" }),
          ];
        },
      },
    },
  });

  const HATA = {
    office: "müşteriye giden raporda bir sıfır fazla yazmış; fark henüz kimsenin gözüne çarpmamış",
    cafe: "kasada ₺2.400 açık vermiş; gün sonu sayımında senin vardiyan da var",
    factory: "hatalı bir partiyi kalite kontrolden geçirmiş; kutular yarın sevkiyatta",
    teacher: "yazılı kâğıtlarından bir desteyi kaybetmiş; notlar e-Okul'a cuma girilecek",
    nurse: "bir ilacı uyguladığı hâlde sisteme girmeyi unutmuş; gece nöbetçisi tekrar verebilir",
    memur: "evrakı yanlış birime havale etmiş; yasal süre pazartesi doluyor",
  };
  HS.story("w_ortbas", {
    when: (s) => team(s) && (done(s, "w_terfi") !== undefined || rel(s, "isArk") >= 62),
    weight: 0.55,
    room: "is",
    title: "Aramızda kalsın",
    text: (s, h) => {
      const t = done(s, "w_terfi");
      const pre = t === "kaybetti" ? "Terfiyi senin önünden alan " : t === "kazandi" ? "Artık ekibinde olan " : t === "cekildi" ? "Uğruna adaylıktan çekildiğin " : "";
      return pre + h.cast("isArk").name + " kapıyı kapattı: " + (HATA[s.job] || HATA.office) + ". \"Kimseye söyleme, ben bir yolunu bulurum. Sadece sen de görmemiş ol.\"";
    },
    choices: (s, h) => [
      c("Görmemiş ol", "İlişki ++ · ortaya çıkarsa ikiniz de yanarsınız", { rel: { isArk: 15 }, stress: 5, set: { ne: "sakla" }, go: "sonra" }),
      c("\"Git kendin söyle, yanında olurum\"", "Zor ama dürüst", { rel: { isArk: -4 }, esteem: 3, sk: { iletisim: 1 }, set: { ne: "itiraf" }, go: "sonra" }),
      c(h.ek(h.cast("yonetici").name, "dat") + " bildir", "Performans + · ilişki −−", { perf: 4, rel: { isArk: -25, yonetici: 8 }, m: -3, people: -1, end: "ihbar" }),
    ],
    steps: {
      sonra: {
        gap: 3,
        when: team,
        title: (s, h) => (h.d.ne === "sakla" ? "Sessizliğin bedeli" : "İtirafın ertesi"),
        text: (s, h) =>
          h.d.ne === "sakla"
            ? "Bir denetim maili geldi: \"Geçen ayın kayıtlarını gözden geçiriyoruz.\" " + h.cast("isArk").name + " sana bakmıyor bile."
            : h.cast("isArk").name + " hatasını " + h.ek(h.cast("yonetici").name, "dat") + " kendisi anlattı. Fırça yedi ama kimse yalan söylemedi. Şimdi sana teşekkür etmek için bir şey istiyor.",
        choices: (s, h) =>
          h.d.ne === "sakla"
            ? [
                c("Sus, fırtınanın geçmesini bekle", "Şans · yakalanırsan performans −−", {
                  chance: {
                    p: 0.6,
                    win: { m: 2, rel: { isArk: 8 }, end: "koruldu" },
                    lose: { perf: -10, esteem: -5, stress: 10, rel: { yonetici: -12 }, end: "yakalandi" },
                    winT: "Kimse fark etmedi",
                    winP: h.cast("isArk").name + " o akşam sana sadece \"borçluyum\" diye yazdı.",
                    loseT: "Kayıtlar ortaya çıktı",
                    loseP: "\"Sen de biliyordun, değil mi?\" sorusu odada asılı kaldı.",
                  },
                }),
                c("Son anda her şeyi anlat", "Performans − · vicdan rahat", { perf: -3, esteem: 2, rel: { isArk: -15, yonetici: 3 }, end: "itiraf" }),
              ]
            : [
                c("Akşam bir çay içelim yeter", "Çevre + · moral +", { m: 3, people: 1, rel: { isArk: 6 }, end: "itiraf" }),
                c("\"Ödeşmek yok, bir dahaki sefere dikkat\"", "Özgüven +", { esteem: 2, rel: { isArk: 2 }, end: "itiraf" }),
              ],
      },
    },
  });

  // ==========================================================
  // 2) Yönetici arkı: imkânsız teslim → hafta sonu mesaisi → emek hırsızlığı
  // ==========================================================
  HS.story("w_teslim", {
    when: (s) => team(s) && (s.jobWeeks || 0) >= 8,
    weight: 0.65,
    room: "is",
    title: "Pazartesiye yetişir, değil mi?",
    text: (s, h) =>
      (done(s, "w_ilkGun") === "dost" ? "Tam " + h.ek(h.cast("isArk").name, "gen") + " dediği gibi: cuma 17.40. " : "Cuma 17.40. ") +
      h.cast("yonetici").name + " masana bir dosya bıraktı: \"Normalde iki haftalık iş ama pazartesi sabah genel müdüre sunacağım. Sana güveniyorum.\"",
    choices: (s, h) => [
      c("Tamam de, hafta sonunu feda et", "Uyku − · performans +", { stress: 6, go: "haftasonu" }),
      c("Kapsamı pazarlık et", "Müzakere · şans", {
        chance: {
          p: clamp(0.35 + sk(s, "muzakere") / 80 + (rel(s, "yonetici") - 50) / 150, 0.2, 0.85),
          win: { sk: { muzakere: 3 }, esteem: 3, m: 2, end: "pazarlik" },
          lose: { rel: { yonetici: -6 }, stress: 4, go: "haftasonu" },
          winT: "Yarısı yeterli oldu",
          winP: "\"Peki, sadece özet tabloları yap.\" Hafta sonun kurtuldu.",
          loseT: "Pazarlık tutmadı",
          loseP: "\"Herkes fedakârlık yapıyor.\" Dosya yine masanda.",
        },
      }),
      c("\"Hafta sonu ailemle sözüm var\"", "İlişki − · moral +", { rel: { yonetici: -10 }, perf: -4, m: 3, end: "hayir" }),
    ],
    steps: {
      haftasonu: {
        gap: 1,
        when: team,
        title: "Cumartesi, boş ofis",
        text: (s, h) =>
          "Kahve makinesinin sesinden başka ses yok. " +
          (s.partner ? ek2(s.partner.name, "gen") + " mesajı geldi: \"Bu hafta sonu da mı?\" " : "Arkadaş grubunda kahvaltı fotoğrafları dönüyor. ") +
          (done(s, "w_ilkGun") === "dost" ? h.cast("isArk").name + " de \"iki saatliğine gelirim\" yazdı." : ""),
        choices: (s, h) => [
          c("Gece yarısına kadar bitir", "Uyku −− · sağlık −", { sleep: 6, h: -3, sk: { proje: 2, tablolama: 2 }, perf: 5, ...(s.partner ? { bond: -3 } : { m: -2 }), go: "toplanti" }),
          c(done(s, "w_ilkGun") === "dost" ? h.cast("isArk").name + " ile bölüş" : "Yeterince iyi olsun, eve git", done(s, "w_ilkGun") === "dost" ? "Yük yarıya iner · ilişki +" : "Kalite − · moral +", done(s, "w_ilkGun") === "dost" ? { sleep: 2, perf: 3, rel: { isArk: 8 }, people: 1, set: { yardim: 1 }, go: "toplanti" } : { sleep: 1, perf: 1, m: 2, go: "toplanti" }),
        ],
      },
      toplanti: {
        gap: 1,
        when: team,
        title: "Genel müdür sunumu",
        text: (s, h) =>
          "Toplantıda " + h.cast("yonetici").name + " senin hazırladığın tabloları açtı: \"Hafta sonu oturup bunu çıkardım.\" Genel müdür onu tebrik ediyor. " +
          (h.d.yardim ? h.cast("isArk").name + " masanın altından sana bakıyor." : "Kimse senin adını anmadı."),
        choices: (s, h) => [
          c("Orada söz al: \"Ayrıntıları ben anlatayım\"", "Özgüven ++ · yönetici kırılır", {
            chance: {
              p: clamp(0.4 + sk(s, "sunum") / 90, 0.3, 0.85),
              win: { esteem: 8, perf: 6, ...P(s, 1.04), rel: { yonetici: -15 }, sk: { sunum: 2 }, end: "sesimi" },
              lose: { esteem: 3, perf: -3, rel: { yonetici: -20 }, stress: 6, end: "sesimi" },
              winT: "Genel müdür adını not aldı",
              winP: "\"Bu tabloları sen mi hazırladın? Güzel iş.\" " + h.cast("yonetici").name + " gülümsemeye çalıştı.",
              loseT: "Oda buz kesti",
              loseP: "Haklıydın ama yanlış anda konuştuğunu düşünenler oldu.",
            },
          }),
          c("Toplantıdan sonra kapısını çal", "Özel konuşma · iletişim +", { sk: { iletisim: 2, muzakere: 1 }, rel: { yonetici: -3 }, esteem: 3, perf: 2, end: "ozel" }),
          c("Yut ve sus", "Özgüven − · huzur", { esteem: -5, m: -4, rel: { yonetici: 4 }, end: "sustu" }),
        ],
      },
    },
  });
  // Partner adı ekleri için kısa yol (h dışından)
  const ek2 = (w, k) => HS.ek(w, k);

  // ==========================================================
  // 3) Küçülme söylentisi (performans + önceki tavırlar)
  // ==========================================================
  HS.story("w_kucultme", {
    when: (s) => team(s) && !!s.company && (s.jobWeeks || 0) >= 40,
    weight: (s) => (perf(s) < 45 ? 0.7 : 0.45),
    room: "is",
    title: "Koridorlarda fısıltı",
    text: (s, h) => {
      const tip = rel(s, "isArk") >= 65;
      return (
        h.ek(coName(s), "loc") + " \"verimlilik çalışması\" başlamış. Danışmanlar her masaya bakıyor. " +
        (tip ? h.cast("isArk").name + " kulağına eğildi: \"Liste hazırlanıyormuş. Bu ara göze batma.\" " : "Kimse kimseye bir şey söylemiyor. ") +
        (done(s, "w_teslim") === "sesimi" ? "Toplantıda " + h.ek(h.cast("yonetici").name, "acc") + " düzelttiğin gün hâlâ akıllarda." : "")
      );
    },
    choices: (s, h) => [
      c("Mesaiyi uzat, görünür ol", "Performans + · stres +", { perf: 6, stress: 8, sleep: 2, go: "liste" }),
      c("Sessizce CV'ni güncelle", "Bayrak: CV hazır", { flag: "cvGuncel", sk: { bilgisayar: 1 }, m: -1, go: "liste" }),
      c(h.ek(h.cast("yonetici").name, "dat") + " açıkça sor", "İlişkiye göre değişir", { rel: { yonetici: rel(s, "yonetici") >= 55 ? 4 : -4 }, esteem: 2, go: "liste" }),
    ],
    steps: {
      liste: {
        gap: 3,
        when: team,
        title: "Liste açıklandı",
        text: (s, h) => "İnsan kaynakları sabah dokuzda herkese aynı maili attı: \"Bireysel görüşmeler bugün yapılacaktır.\" Sıran öğleden sonra.",
        choices: (s, h) => {
          const p = clamp(
            0.5 + (perf(s) - 50) / 70 + (rel(s, "yonetici") - 50) / 180 - (done(s, "w_teslim") === "sesimi" ? 0.12 : 0) + (done(s, "w_ortbas") === "ihbar" ? 0.06 : 0) - (done(s, "w_ortbas") === "yakalandi" ? 0.1 : 0),
            0.15, 0.92);
          return [
            c("Görüşmeye gir", "Şans performansına bağlı", {
              chance: {
                p,
                win: { m: 4, stress: -4, perf: 2, end: "kaldi" },
                lose: { m: -6, stress: 8, go: "kesinti" },
                winT: "Adın listede yok",
                winP: "Masana döndüğünde boşalan iki sandalye gördün. Rahatlamak bile tuhaf geldi.",
                loseT: "\"Seni kaybetmek istemiyoruz ama…\"",
                loseP: "İşten çıkarılmadın; ama masaya bir maaş kesintisi önerisi kondu.",
              },
            }),
          ];
        },
      },
      kesinti: {
        gap: 1,
        when: team,
        title: "Yüzde yedilik kesinti",
        text: (s, h) => "Önerilen: bir yıl boyunca maaşta %7 kesinti, karşılığında kadroda kalmak. " + (flag(s, "cvGuncel") ? "CV'n zaten hazır; iki ilana bakmıştın." : "CV'n en son mezuniyette güncellenmişti."),
        choices: (s, h) => [
          c("Kabul et", "Maaş −%7 · güvence", { ...P(s, 0.93), m: -3, end: "kesinti" }),
          c("Pazarlık et", "Müzakere · şans", {
            chance: {
              p: clamp(0.3 + sk(s, "muzakere") / 70, 0.2, 0.75),
              win: { ...P(s, 0.97), sk: { muzakere: 3 }, esteem: 4, end: "pazarlik" },
              lose: { ...P(s, 0.93), esteem: -2, end: "kesinti" },
              winT: "%3'te anlaştınız",
              loseT: "Teklif değişmedi",
            },
          }),
          c("Kabul et ama iş aramaya başla", "Kesinti · bayrak", { ...P(s, 0.93), flag: "cvGuncel", m: -1, end: "aramada" }),
        ],
      },
    },
  });

  // ==========================================================
  // 4) Ofis hayatı: doğum günü parası → yılbaşı çekilişi; dedikodu; ofise dönüş
  // ==========================================================
  HS.story("w_dogumGunu", {
    when: team,
    weight: 0.5,
    room: "is",
    title: "Zarf dolaşıyor",
    text: (s, h) =>
      "Bir zarf masadan masaya geziyor: \"Yarın " + h.ek(h.cast("yonetici").name, "gen") + " doğum günü, pasta ve hediye için toplanıyoruz.\" Zarfın içinde bir sürü ₺200 var, bir de tek bir ₺1.000.",
    choices: (s, h) => [
      c("₺500 koy", "Ortalama katılım", { cost: 500, rel: { yonetici: 2 }, end: "katildi" }),
      c("Organizasyonu üstlen", "₺1.500 · çevre + · zaman", { cost: 1500, people: 2, sk: { proje: 1, iletisim: 1 }, go: "pasta" }),
      c("Zarfı sessizce sonrakine ver", "₺0 · göze batabilir", { rel: { yonetici: -2 }, people: -1, end: "uzak" }),
    ],
    steps: {
      pasta: {
        gap: 1,
        when: team,
        title: "Sürpriz kutlama",
        text: (s, h) => "Pasta geldi ama mumlar unutulmuş. " + h.cast("yonetici").name + " toplantıdan çıkmak üzere; herkes sana bakıyor.",
        choices: (s, h) => [
          c("Telefon fenerleriyle 'mum' yaptır", "Yaratıcı · moral +", { m: 4, people: 2, rel: { yonetici: 6 }, flag: "ofisOrganizator", end: "organizator" }),
          c("Bakkala koş", "₺120 · sağlık az −", { cost: 120, h: -1, rel: { yonetici: 4 }, flag: "ofisOrganizator", end: "organizator" }),
        ],
      },
    },
  });

  HS.story("w_cekilis", {
    when: (s) => team(s) && s.week >= 46,
    weight: 0.75,
    room: "is",
    title: "Yılbaşı çekilişi",
    text: (s, h) =>
      (done(s, "w_dogumGunu") === "organizator" ? "Doğum günü organizasyonundan sonra çekilişi de sana yıktılar. " : "Ofiste yılbaşı çekilişi yapıldı, limit ₺1.000. ") +
      "Kâğıdı açtın: " + h.cast("yonetici").name + ". " +
      (done(s, "w_teslim") === "sustu" || done(s, "w_teslim") === "sesimi" ? "Hani şu sunumda emeğini kendine mal eden." : "Ne sever, hiçbir fikrin yok."),
    choices: (s, h) => [
      c("Özenli hediye: güzel bir defter ve kalem", "₺950 · ilişki +", { cost: 950, rel: { yonetici: 6 }, m: 1, go: "acilis" , set: { hediye: "ozenli" } }),
      c("Esprili hediye: \"Pazartesi sabahı\" kupası", "₺300 · risk", { cost: 300, set: { hediye: "espri" }, go: "acilis" }),
      c("Kâğıdı " + h.ek(h.cast("isArk").name, "gen") + " kâğıdıyla değiştir", "Ufak hile · ilişki +", { rel: { isArk: 4 }, cost: 600, set: { hediye: "takas" }, go: "acilis" }),
    ],
    steps: {
      acilis: {
        gap: 1,
        when: team,
        title: "Paketler açılıyor",
        text: (s, h) =>
          h.d.hediye === "espri"
            ? "Kupa çıkınca oda bir an sustu. Sonra herkes " + h.ek(h.cast("yonetici").name, "acc") + " izledi."
            : h.d.hediye === "takas"
              ? h.cast("isArk").name + " " + h.ek(h.cast("yonetici").name, "dat") + " hediye verirken sana göz kırptı. Senin paketin ise muhasebeden birinden geldi."
              : "Senin paketin açılınca " + h.cast("yonetici").name + " \"Bunu kim seçtiyse dikkatli biri\" dedi.",
        choices: (s, h) =>
          h.d.hediye === "espri"
            ? [
                c("Kahkahayı bekle", "Şans", {
                  chance: {
                    p: 0.55,
                    win: { m: 5, people: 2, rel: { yonetici: 5 }, end: "guldu" },
                    lose: { m: -3, rel: { yonetici: -6 }, end: "bozuldu" },
                    winT: "Kahkaha koptu",
                    winP: "Kupa ertesi gün masasındaydı.",
                    loseT: "Gülmedi",
                    loseP: "\"Pazartesi sabahları sizin için mi zor?\" diye sordu.",
                  },
                }),
              ]
            : [c("Çay demle, kutlamaya katıl", "Moral +", { m: 3, people: 1, end: "katildi" })],
      },
    },
  });

  HS.story("w_dedikodu", {
    when: (s) => team(s) && done(s, "w_ilkGun") === "dost",
    weight: 0.45,
    room: "is",
    title: "Asansörde duyulan cümle",
    text: (s, h) =>
      "Asansörde iki kişi konuşuyordu: \"" + s.first + " ile " + h.cast("isArk").name + " çıkıyormuş, öğle yemeklerini hep birlikte yiyorlar.\" Kapı açıldı, seni görünce sustular." +
      (s.partner ? " Akşam " + ek2(s.partner.name, "acc") + " göreceksin." : ""),
    choices: (s, h) => [
      c("Gülüp geç", "Dedikodu kendi kendine söner mi?", { m: -1, go: "yayilma" , set: { tavir: "gul" } }),
      c("Kaynağı bul ve yüzleş", "İletişim + · gerginlik", { sk: { iletisim: 2 }, stress: 4, esteem: 3, people: -1, set: { tavir: "yuz" }, go: "yayilma" }),
      c(h.cast("isArk").name + " ile yemeklere ara ver", "İlişki −", { rel: { isArk: -8 }, m: -2, end: "mesafe" }),
    ],
    steps: {
      yayilma: {
        gap: 2,
        when: team,
        title: "Söz yayıldı",
        text: (s, h) =>
          (s.partner
            ? ek2(s.partner.name, "gen") + " bir arkadaşı " + ek2(coName(s), "loc") + " çalışıyormuş. Akşam yemeğinde soru geldi: \"" + h.cast("isArk").name + " kim?\""
            : h.cast("isArk").name + " de duymuş; yüzü kızarmış. \"Ne diyeceğiz şimdi?\"") +
          (h.d.tavir === "yuz" ? " En azından ofiste herkes kimin konuştuğunu öğrendi." : ""),
        choices: (s, h) =>
          s.partner
            ? [
                c("Hepsini açık açık anlat", "Güven +", { trust: 4, bond: 2, end: "acik" }),
                c("\"Saçmalık\" deyip geç", "Güven −", { trust: -5, m: -2, end: "gecistirdi" }),
                c(h.ek(h.cast("isArk").name, "acc") + " yemeğe davet et", "₺1.400 · herkes tanışsın", { cost: 1400, trust: 6, bond: 3, rel: { isArk: 5 }, end: "tanistirdi" }),
              ]
            : [
                c("Birlikte espriyle karşılık verin", "Moral + · çevre +", { m: 3, people: 1, rel: { isArk: 5 }, end: "espri" }),
                c("Bir süre ayrı oturun", "İlişki −", { rel: { isArk: -5 }, end: "mesafe" }),
              ],
      },
    },
  });

  HS.story("w_ofiseDonus", {
    when: (s) => s.job === "office" && !!s.company,
    weight: 0.5,
    room: "is",
    title: "Haftada beş gün ofis",
    text: (s, h) =>
      h.ek(coName(s), "gen") + " yönetimi duyurdu: hibrit dönem bitiyor, ay sonundan itibaren herkes haftada beş gün ofiste. Yol, yemek, servis… " +
      (HS.inStory(s, "w_serbest") || done(s, "w_serbest") === "buyudu" ? "Akşamları yürüttüğün serbest işler de bu düzene sığmayacak." : "Ekip WhatsApp grubu çoktan kaynamaya başladı."),
    choices: (s, h) => [
      c("Uy, şikâyet etme", "Yol masrafı · ilişki +", { cost: 2500, rel: { yonetici: 4 }, stress: 3, end: "uydu" }),
      c("Hibrit için gerekçe yaz", "Müzakere · şans", {
        chance: {
          p: clamp(0.3 + perf(s) / 200 + sk(s, "muzakere") / 100, 0.2, 0.8),
          win: { m: 4, sk: { muzakere: 2, yazisma: 0 }, end: "hibrit" },
          lose: { rel: { yonetici: -4 }, cost: 2500, end: "uydu" },
          winT: "İki gün evden onaylandı",
          winP: "Verilerinle gelen tek kişi sendin.",
          loseT: "\"Kural herkes için\"",
        },
      }),
      c(h.cast("isArk").name + " ile imza topla", "Çevre + · risk", { people: 2, rel: { isArk: 6 }, go: "dilekce" }),
    ],
    steps: {
      dilekce: {
        gap: 2,
        when: (s) => s.job === "office",
        title: "Kırk iki imza",
        text: (s, h) => "Dilekçe insan kaynaklarına ulaştı. " + h.cast("yonetici").name + " seni odasına çağırdı: \"Bu işi başlatan sen misin?\"",
        choices: (s, h) => [
          c("\"Evet, ekibin sesi olarak\"", "Liderlik + · şans", {
            chance: {
              p: 0.5,
              win: { sk: { liderlik: 3 }, esteem: 5, people: 2, m: 3, end: "kazanildi" },
              lose: { perf: -5, rel: { yonetici: -10 }, sk: { liderlik: 2 }, end: "reddedildi" },
              winT: "Haftada iki gün evden",
              winP: "Şirket geri adım attı; koridorda insanlar sana teşekkür ediyor.",
              loseT: "Dilekçe çekmecede kaldı",
              loseP: "Kural değişmedi; adın ise bir yerlere yazıldı.",
            },
          }),
          c("\"Ben sadece imzaladım\"", "Güvenli · ilişki −", { rel: { isArk: -10 }, esteem: -3, cost: 2500, end: "geri" }),
        ],
      },
    },
  });

  // ==========================================================
  // 5) Mesleğe özel arklar
  // ==========================================================
  // Kafe: her gün gelen müşteri aslında işe alım uzmanı
  const REC = ["Nesrin Hanım", "Oya Hanım", "Bülent Bey", "Melih Bey", "Selma Hanım"];
  const rival = (s) => HS.COMPANIES.find((x) => x.jobs.includes("cafe") && x.id !== s.company && HS.coIn(x, s.city));
  HS.story("w_kafeMusteri", {
    when: (s) => s.job === "cafe",
    weight: 0.6,
    room: "is",
    title: "Köşedeki dizüstü",
    text: (s, h) => nm(s, REC, 1) + " üç haftadır her sabah geliyor: sade filtre kahve, köşe masa, açık dizüstü. Bugün kahvesini alırken \"Bu kalabalığı nasıl bu kadar sakin yönetiyorsun?\" diye sordu.",
    choices: (s, h) => [
      c("Laflayıp ritüelini anlat", "İletişim +", { sk: { iletisim: 2, servis: 1 }, m: 2, go: "kart" }),
      c("Gülümse, sıradakine geç", "Hız +", { sk: { barista: 1 }, perf: 1, end: "gecti" }),
    ],
    steps: {
      kart: {
        gap: 2,
        when: (s) => s.job === "cafe",
        title: "Bir kartvizit",
        text: (s, h) => {
          const r = rival(s);
          return nm(s, REC, 1) + " bardağın altına bir kartvizit bıraktı: \"İşe alım uzmanıyım. " + (r ? r.name + " için vardiya sorumlusu arıyoruz." : "Bir zincir için vardiya sorumlusu arıyoruz.") + " Bir konuşalım mı?\"";
        },
        choices: (s, h) => {
          const r = rival(s);
          return [
            r ? c("Başvur", r.name + " · mülakat süreci", { coApply: { co: r.id, job: "cafe" }, esteem: 3, end: "basvurdu" }) : null,
            c("Teklifi kendi müdürüne söyle", "Pazarlık kozu · şans", {
              chance: {
                p: 0.5,
                win: { ...P(s, 1.06), perf: 3, end: "koz" },
                lose: { rel: { yonetici: -6 }, m: -2, end: "ters" },
                winT: "Seni kaybetmek istemediler",
                winP: "Maaşına küçük bir iyileştirme geldi.",
                loseT: "\"Gitmek istiyorsan kapı orada\"",
              },
            }),
            c("Teşekkür et, şimdilik kalmak istiyorum", "Sadakat · moral +", { m: 1, rel: { yonetici: 2 }, end: "kaldi" }),
          ];
        },
      },
    },
  });

  // Fabrika: ramak kala → sendika
  HS.story("w_ramakKala", {
    when: (s) => s.job === "factory",
    weight: 0.6,
    room: "is",
    title: "Ramak kala",
    text: (s, h) => "Forklift, yanında yürüdüğün paletleri yarım metreyle ıskaladı. Şoför yeni başlamış; sarı çizgiler yıllardır silik. " + h.cast("isArk").name + " \"Kayıt girersen hat durur, vardiya amiri sinirlenir\" dedi.",
    choices: (s, h) => [
      c("Ramak kala bildirimi yaz", "İş güvenliği + · amir kızar", { sk: { isguvenligi: 3 }, rel: { yonetici: -4 }, people: 2, set: { bildirdi: 1 }, go: "sendika" }),
      c("Şoförle konuş, kayıt girme", "Sessiz çözüm", { sk: { iletisim: 1 }, rel: { isArk: 3 }, go: "sendika" }),
      c("Unut gitsin", "Stres + · bir dahaki sefere?", { stress: 4, h: -1, go: "sendika" }),
    ],
    steps: {
      sendika: {
        gap: 4,
        when: (s) => s.job === "factory",
        title: "Soyunma odasında form",
        text: (s, h) =>
          "Bir sendika temsilcisi soyunma odasında üyelik formu dağıtıyor; e-Devlet'ten de üye olunabiliyor. Yetki için çalışanların yarısı gerekiyor. " +
          (h.d.bildirdi ? "Forklift olayını bildirdiğin için \"Sen de bizdensin\" diyorlar." : "Herkes önce kimin imzalayacağına bakıyor."),
        choices: (s, h) => [
          c("Üye ol", "Aidat ~₺450/ay · dayanışma", { cost: 450, people: 3, flag: "sendikali", go: "baski" }),
          c("Bekle, kimse görmesin", "Güvenli · çevre −", { people: -1, end: "uzak" }),
          c("Arkadaşlarını da ikna et", "Liderlik + · risk", { sk: { liderlik: 2, iletisim: 2 }, people: 4, flag: "sendikali", stress: 5, set: { onde: 1 }, go: "baski" }),
        ],
      },
      baski: {
        gap: 3,
        when: (s) => s.job === "factory",
        title: "İnsan kaynaklarında bir görüşme",
        text: (s, h) => "İK seni çağırdı. Çay ikram ettiler, sonra lafı dolandırdılar: \"Sendika işleri üretimi aksatıyor. Siz akıllı birisiniz.\"" + (h.d.onde ? " Adının listenin başında olduğunu biliyorlar." : ""),
        choices: (s, h) => [
          c("Geri adım atma", "Şans · dayanışma", {
            chance: {
              p: h.d.onde ? 0.5 : 0.6,
              win: { esteem: 6, people: 3, m: 4, ...P(s, 1.05), end: "yetki" },
              lose: { perf: -6, stress: 8, esteem: 3, end: "baski" },
              winT: "Sendika yetki aldı",
              winP: "Toplu sözleşmeyle ilk zam masaya geldi.",
              loseT: "Yetki çıkmadı",
              loseP: "Çoğunluk sağlanamadı; vardiya listesinde adın en kötü saatlere yazıldı.",
            },
          }),
          c("Üyelikten çekil", "Özgüven − · amir memnun", { esteem: -5, m: -3, rel: { yonetici: 5, isArk: -6 }, end: "cekildi" }),
        ],
      },
    },
  });

  // Öğretmen: zor veli → okul gezisi
  const VELI = ["Hülya Hanım", "Recep Bey", "Sevgül Hanım", "Turgay Bey"];
  const KID = ["Emir", "Elif", "Kerem", "Zeynep", "Yusuf", "Defne"];
  HS.story("w_veli", {
    when: (s) => s.job === "teacher",
    weight: 0.6,
    room: "is",
    title: "Veli toplantısından sonra",
    text: (s, h) => nm(s, VELI, 2) + " herkes çıktıktan sonra sınıfa girdi: \"" + nm(s, KID, 3) + " 85 alacaktı, siz 70 vermişsiniz. Gerekirse CİMER'e yazarım.\"",
    choices: (s, h) => [
      c("Kâğıdı açıp puan puan göster", "Pedagoji + · gerginlik", { sk: { pedagoji: 2, iletisim: 2 }, stress: 3, set: { veli: "acik" }, go: "gezi" }),
      c("Müdüre yönlendir", "Prosedür · ilişki −", { sk: { mevzuat: 1 }, rel: { yonetici: -3 }, set: { veli: "mudur" }, go: "gezi" }),
      c("Notu yükselt", "Huzur · özgüven −", { esteem: -6, stress: -2, set: { veli: "yukseltti" }, go: "gezi" }),
    ],
    steps: {
      gezi: {
        gap: 5,
        when: (s) => s.job === "teacher",
        title: "Okul gezisi",
        text: (s, h) =>
          "Sınıf müzeye gidecek; otobüs kişi başı ₺350. " + nm(s, KID, 3) + " gezi formunu getirmemiş. " +
          (h.d.veli === "yukseltti" ? "Annesi-babası artık selam bile vermiyor; diğer veliler de notu duymuş." : nm(s, VELI, 2) + " telefonu açmıyor."),
        choices: (s, h) => [
          c(nm(s, KID, 3) + " için ücreti sen öde", "₺350 · öğrenci bağı", { cost: 350, m: 4, sk: { sinif: 1 }, go: "sonuc" }),
          c("Velinin yazılı izni olmadan götüremem", "Mevzuat + · çocuk üzülür", { sk: { mevzuat: 2 }, m: -2, end: "kural" }),
        ],
      },
      sonuc: {
        gap: 2,
        when: (s) => s.job === "teacher",
        title: "Kapıda bir kavanoz reçel",
        text: (s, h) => nm(s, VELI, 2) + " okul kapısında bekliyordu. Elinde bir kavanoz vişne reçeli var: \"" + nm(s, KID, 3) + " gezide gördüklerini bir hafta anlattı. Ben de size haksızlık ettim.\"",
        choices: (s, h) => [
          c("Reçeli al, barış", "Moral ++ · çevre +", { m: 6, people: 2, esteem: 3, end: "baris" }),
          c("\"Önemli olan çocuk\" de", "Pedagoji +", { sk: { pedagoji: 2 }, m: 3, end: "baris" }),
        ],
      },
    },
  });

  // Hemşire: nöbet baskısı → hasta yakınının hediyesi
  HS.story("w_nobet", {
    when: (s) => s.job === "nurse",
    weight: 0.6,
    room: "is",
    title: "Bu ay yedinci nöbet",
    text: (s, h) =>
      "Nöbet listesi asıldı: bu ay yedi gece. " + h.cast("isArk").name + " yanına geldi: \"Çocuğum hasta, cumartesi gecemi alır mısın? " +
      (done(s, "w_ortbas") === "koruldu" ? "Biliyorum, sana zaten bir borcum var…\"" : "Sonra ben de seninkini alırım.\""),
    choices: (s, h) => [
      c("Al", "Sekizinci nöbet · ek ödeme", { cash: 2800, sleep: 5, h: -3, rel: { isArk: 10 }, go: "hediye" }),
      c("Sorumlu hemşireye listeyi itiraz et", "Liderlik + · ilişki −", { sk: { liderlik: 1, iletisim: 1 }, rel: { yonetici: -5, isArk: -3 }, esteem: 3, go: "hediye" }),
      c("Kibarca hayır", "Sağlık korunur", { h: 2, rel: { isArk: -6 }, go: "hediye" }),
    ],
    steps: {
      hediye: {
        gap: 3,
        when: (s) => s.job === "nurse",
        title: "Taburcu günü",
        text: (s, h) => "Üç gece başında beklediğin yaşlı hastanın oğlu taburcu günü bir kutu baklava getirdi. Kutunun altında bir zarf da var.",
        choices: (s, h) => [
          c("Baklavayı serviste paylaş, zarfı geri ver", "Etik · çevre +", { m: 4, people: 2, esteem: 3, sk: { hasta: 2 }, end: "zarfiIade" }),
          c("Hiçbirini kabul etme", "Kurallı · moral az −", { m: -1, sk: { hasta: 1 }, esteem: 2, end: "reddetti" }),
          c("Zarfı al", "₺5.000 · vicdan ve risk", {
            chance: {
              p: 0.75,
              win: { cash: 5000, esteem: -4, end: "aldi" },
              lose: { cash: 5000, perf: -10, stress: 10, esteem: -6, end: "sorusturma" },
              winT: "Kimse görmedi",
              loseT: "Hasta hakları birimi aradı",
              loseP: "Başka bir yakın şikâyet etmiş; ifaden alınacak.",
            },
          }),
        ],
      },
    },
  });

  // Memur: e-imza reformu → teftiş
  HS.story("w_eimza", {
    when: (s) => s.job === "memur",
    weight: 0.55,
    room: "is",
    title: "Kâğıtsız daire",
    text: (s, h) => "Bakanlık genelgesi geldi: altı ay içinde tüm yazışmalar elektronik belge yönetim sistemine geçecek. " + h.cast("yonetici").name + " şef \"Ben otuz yıldır ıslak imzayla çalışıyorum\" diye söyleniyor. Pilot birim için gönüllü aranıyor.",
    choices: (s, h) => [
      c("Pilot olmaya gönüllü ol", "Bilgisayar + · iş yükü", { sk: { bilgisayar: 2, yazisma: 2 }, stress: 4, go: "egitim" }),
      c("Şefin yanında dur, yavaş geç", "İlişki + · beceri az", { rel: { yonetici: 6 }, end: "eskiUsul" }),
    ],
    steps: {
      egitim: {
        gap: 3,
        when: (s) => s.job === "memur",
        title: "Sisteme kim öğretecek?",
        text: (s, h) => "Pilot iyi gitti; şimdi tüm daireye eğitim vermen isteniyor. " + h.cast("yonetici").name + " şef en arka sırada kollarını kavuşturmuş oturuyor.",
        choices: (s, h) => [
          c("Şefe birebir, sabırla göster", "İletişim ++ · ilişki ++", { sk: { iletisim: 3 }, rel: { yonetici: 12 }, m: 2, go: "teftis" }),
          c("Toplu sunum yap, gerisi kendi işi", "Sunum +", { sk: { sunum: 2 }, rel: { yonetici: -4 }, go: "teftis" }),
        ],
      },
      teftis: {
        gap: 4,
        when: (s) => s.job === "memur",
        title: "Müfettiş geldi",
        text: (s, h) => "Teftiş kurulu dosyaları inceliyor. Elektronik kayıtlar tertemiz ama geçiş öncesinden bir eksik evrak çıktı. " + (rel(s, "yonetici") >= 60 ? "Şef \"Bu dönem benim sorumluluğumda\" diye öne çıktı." : "Herkes birbirine bakıyor."),
        choices: (s, h) => [
          c("Eksikliği raporla, sistemi göster", "Mevzuat + · takdir şansı", {
            chance: {
              p: rel(s, "yonetici") >= 60 ? 0.75 : 0.5,
              win: { sk: { mevzuat: 3 }, perf: 6, esteem: 5, flag: "takdirname", end: "takdir" },
              lose: { sk: { mevzuat: 2 }, perf: -2, stress: 5, end: "uyari" },
              winT: "Takdirname",
              winP: "Raporda dairenin dijital geçişi örnek gösterildi.",
              loseT: "Yazılı uyarı",
              loseP: "Eski eksik herkesin dosyasına bir satır olarak geçti.",
            },
          }),
        ],
      },
    },
  });

  // Esnaf: tedarikçi zammı → vergi denetimi → büyüme
  HS.story("w_esnafZam", {
    when: (s) => s.job === "business",
    weight: 0.65,
    room: "is",
    title: "Tedarikçiden yeni liste",
    text: (s, h) => "Toptancı yeni fiyat listesini WhatsApp'tan attı: her kalemde %18 zam, \"döviz yüzünden\". Bir başka satıcı faturasız, %10 ucuza mal veriyor.",
    choices: (s, h) => [
      c("Zammı fiyatlara yansıt", "Müşteri kaybı riski", { sk: { muhasebe: 1 }, people: -1, set: { yol: "fiyat" }, go: "vergi" }),
      c("Kârdan kıs, fiyat sabit", "₺12.000 · müşteri sadakati", { cost: 12000, people: 2, set: { yol: "kis" }, go: "vergi" }),
      c("Faturasız tedarikçiye geç", "Ucuz · riskli", { cash: 8000, set: { yol: "faturasiz" }, go: "vergi" }),
    ],
    steps: {
      vergi: {
        gap: 5,
        when: (s) => s.job === "business",
        title: "Vergi denetimi",
        text: (s, h) => "Kapıda iki vergi müfettişi: \"Son altı ayın alış faturalarını görebilir miyiz?\"" + (h.d.yol === "faturasiz" ? " Raflardaki malın yarısının faturası yok." : " Klasörler muhasebecide ama düzenli."),
        choices: (s, h) =>
          h.d.yol === "faturasiz"
            ? [
                c("Muhasebeciyi ara, uzlaşma iste", "₺45.000 ceza · kayıt temizlenir", { cost: 45000, stress: 10, sk: { muhasebe: 2, mevzuat: 1 }, end: "ceza" }),
                c("\"Hepsi ev eşyası\" de", "Şans · ağır risk", {
                  chance: {
                    p: 0.3,
                    win: { m: 2, stress: 6, go: "buyume" },
                    lose: { cost: 70000, stress: 14, esteem: -6, end: "agirCeza" },
                    winT: "Müfettişler ikna oldu",
                    loseT: "Usulsüzlük cezası kesildi",
                    loseP: "Üstüne tutanağa yalan beyan da girdi.",
                  },
                }),
              ]
            : [c("Klasörleri getir", "Temiz dosya · rahatlama", { m: 4, stress: -3, sk: { muhasebe: 2 }, go: "buyume" })],
      },
      buyume: {
        gap: 6,
        when: (s) => s.job === "business",
        title: "Yan dükkân boşaldı",
        text: (s, h) => "Komşu dükkânın sahibi emekli oluyor; devir bedeli ₺250.000, kira ayda ₺28.000. " + (h.d.yol === "kis" ? "Zam döneminde fiyat sabit tuttuğunu müşterilerin unutmadı; dükkân dolup taşıyor." : "Müşteri sayın idare eder durumda."),
        choices: (s, h) => [
          c("Devral, büyü", "₺250.000 · risk ve ödül", {
            cost: 250000,
            chance: {
              p: h.d.yol === "kis" ? 0.7 : 0.5,
              win: { cash: 380000, sk: { tedarik: 3, pazarlama: 3 }, esteem: 6, end: "buyudu" },
              lose: { cash: 120000, stress: 12, m: -6, end: "zorlandi" },
              winT: "İki dükkân, tek tabela",
              winP: "Bir yılın sonunda yatırım fazlasıyla geri döndü.",
              loseT: "Duvarı yıkmak kolaydı, müşteriyi doldurmak değil",
              loseP: "Devri yarı fiyatına başka birine bıraktın.",
            },
          }),
          c("Küçük ve sağlam kal", "Huzur", { m: 2, stress: -3, end: "kucuk" }),
        ],
      },
    },
  });

  // Müzisyen: prodüktör teklifi
  const PROD = ["Cem Kaya", "Serdar Aydın", "Tülay Er", "Hakan Oral"];
  HS.story("w_produktor", {
    when: (s) => s.job === "music",
    weight: 0.6,
    room: "is",
    title: "Kulisteki prodüktör",
    text: (s, h) => "Konserden sonra kulise " + nm(s, PROD, 0) + " adında bir prodüktör geldi. \"Seni büyük dijital platformlarda listelere sokarım\" dedi ve masaya on iki sayfalık bir sözleşme koydu: beş yıl, tüm haklar %70 onda.",
    choices: (s, h) => [
      c("Hemen imzala", "Hızlı fırsat · ağır şartlar", { m: 6, set: { yol: "imza" }, go: "sonuc" }),
      c("Avukata okut", "₺9.000 · müzakere", { cost: 9000, sk: { muzakere: 3 }, set: { yol: "avukat" }, go: "sonuc" }),
      c("Kibarca reddet, bağımsız kal", "Özgürlük · fırsat kaybı", { esteem: 4, m: -2, end: "bagimsiz" }),
    ],
    steps: {
      sonuc: {
        gap: 6,
        when: (s) => s.job === "music",
        title: (s, h) => (h.d.yol === "imza" ? "İlk telif raporu" : "Yeni taslak"),
        text: (s, h) =>
          h.d.yol === "imza"
            ? "Şarkın bir çalma listesine girdi, dinlenme sayısı arttı. Gelen ilk telif raporunda senin payın: ₺4.200. Sahnede çalmak için bile izin istemen gerekiyor."
            : "Avukatın şartları değiştirdi: iki yıl, %50, sahne hakları sende. " + nm(s, PROD, 0) + " önce somurttu, sonra \"Peki\" dedi.",
        choices: (s, h) =>
          h.d.yol === "imza"
            ? [
                c("Sözleşmeyi feshetmeye çalış", "₺30.000 cayma bedeli", { cost: 30000, esteem: 4, m: 2, end: "fesih" }),
                c("Sabret, beş yıl çabuk geçer", "Görünürlük + · moral −", { cash: 4200, sk: { sahne: 2 }, m: -4, people: 3, end: "bagli" }),
              ]
            : [c("İmzala", "Dengeli anlaşma", { cash: 15000, sk: { produksiyon: 3, sahne: 2 }, people: 3, esteem: 5, end: "anlasma" })],
      },
    },
  });

  // ==========================================================
  // 6) Yan gelir: serbest çevirmenlik / tasarım
  // ==========================================================
  HS.story("w_serbest", {
    when: (s) => (s.items || []).includes("laptop") && !s.retired && s.age <= 60 && s.job !== "crime",
    weight: 0.55,
    room: "salon",
    title: "Akşamları serbest iş",
    text: (s, h) => "Bir serbest çalışma platformunda ilan gördün: \"Ürün kataloğu çevirisi ve basit tasarım, ₺12.000.\" Dizüstü bilgisayarın masada duruyor; akşamların ise " + (isWork(s) ? "zaten yorgun." : "boş.") ,
    choices: (s, h) => [
      c("Teklif ver", "İngilizce · bilgisayar", { sk: { ingilizce: 1, bilgisayar: 1 }, go: "musteri" }),
      c("Şimdi değil", "Dinlenmeye devam", { m: 1, end: "yok" }),
    ],
    steps: {
      musteri: {
        gap: 2,
        title: "İlk müşteri",
        text: (s, h) => "İşi aldın. Müşteri teslimden sonra üç kez revizyon istedi, sonra sustu. Ödeme \"muhasebede\" bekliyormuş.",
        choices: (s, h) => [
          c("Platformun hakem sürecini başlat", "Şans · sabır", {
            chance: {
              p: 0.7,
              win: { cash: 12000, sk: { ingilizce: 2 }, m: 3, go: "buyume" },
              lose: { m: -5, stress: 4, end: "yandi" },
              winT: "Ödeme geldi",
              loseT: "Para hiç gelmedi",
              loseP: "İlk dersin: avanssız iş yok.",
            },
          }),
          c("Müşteriyi telefonla sıkıştır", "Müzakere +", { sk: { muzakere: 2 }, cash: 9000, stress: 3, go: "buyume" }),
        ],
      },
      buyume: {
        gap: 4,
        title: "İşler çoğaldı",
        text: (s, h) =>
          "Platformdaki puanın yükseldi; haftada iki-üç iş geliyor. Vergi dairesinde \"genç girişimci muafiyeti\" diye bir şey duydun." +
          (s.company && team(s) ? " Bu arada " + h.cast("yonetici").name + " gündüz mesaide uykulu olduğunu fark etti." : ""),
        choices: (s, h) => [
          c("Şahıs şirketi aç, büyüt", "₺6.000 kuruluş · gelir +", { cost: 6000, cash: 30000, sleep: 4, stress: 6, ...(s.company ? { perf: -4 } : {}), flag: "serbestIs", end: "buyudu" }),
          c("Ayda bir iş al, sınırlı tut", "Denge", { cash: 8000, sk: { ingilizce: 1 }, end: "sinirli" }),
          c("Bırak, uykun önemli", "Sağlık +", { h: 2, sleep: -3, end: "birakti" }),
        ],
      },
    },
  });

  // ==========================================================
  // 7) Üniversite öğrenciliği
  // ==========================================================
  HS.story("w_kyk", {
    when: stu,
    weight: 0.7,
    room: "salon",
    title: "KYK sonuçları",
    text: (s, h) => "e-Devlet'te KYK sonuçları açıklandı: burs çıkmadı ama öğrenim kredisi hakkın var. Aylık ₺4.000; mezuniyetten sonra faizsiz, TÜFE'ye göre geri ödeniyor.",
    choices: (s, h) => [
      c("Krediyi al", "₺16.000 ilk taksitler · ileride borç", { cash: 16000, flag: "kykKredi", set: { kredi: 1 }, go: "faiz" }),
      c("Alma, yarı zamanlı çalış", "Disiplin + · yorgunluk", { sk: { disiplin: 2 }, h: -1, end: "almadi" }),
    ],
    steps: {
      faiz: {
        gap: 5,
        when: stu,
        title: "Yurt odasında finans dersi",
        text: (s, h) => "Oda arkadaşın kredi parasını vadeli mevduata yatırıyor: \"Faizsiz kredi, %40 faizli hesap. Bedava para.\" Senin para ise çoktan kantinde, kırtasiyede ve kargo kapılarında eridi.",
        choices: (s, h) => [
          c("Kalanı mevduata koy", "Finans +", { sk: { finans: 3 }, cash: 2500, flag: "kykBiriktirdi", end: "biriktirdi" }),
          c("Harca: dizüstü taksiti, kitaplar", "Moral +", { m: 3, cost: 1500, end: "harcadi" }),
          c("Aileye destek olarak gönder", "Aile bağı · moral", { m: 2, cost: 3000, end: "aileye" }),
        ],
      },
    },
  });

  HS.story("w_kulup", {
    when: stu,
    weight: 0.6,
    room: "sokak",
    title: "Kulüp seçimi",
    text: (s, h) => "Kampüsteki " + majorName(s) + " öğrencilerinin de takıldığı kariyer kulübünde başkanlık seçimi var. Geçen yılki başkan seni aday göstermek istiyor: \"Sponsor görüşmeleri, etkinlikler… CV'ne çok yakışır.\"",
    choices: (s, h) => [
      c("Aday ol", "Şans · liderlik", {
        chance: {
          p: clamp(0.35 + sk(s, "iletisim") / 80, 0.25, 0.8),
          win: { sk: { liderlik: 3 }, esteem: 5, people: 3, flag: "kulupBaskani", go: "etkinlik" },
          lose: { m: -3, people: 1, end: "kaybetti" },
          winT: "Başkan sensin",
          loseT: "İki oyla kaybettin",
        },
      }),
      c("Üye olarak kal", "Çevre +", { people: 2, end: "uye" }),
    ],
    steps: {
      etkinlik: {
        gap: 4,
        when: stu,
        title: "Kariyer günü",
        text: (s, h) => "Kariyer gününe üç şirket gelecek, salon ayarlandı. Bir gün kala sponsor afiş parasını (₺6.000) ödemekten vazgeçti.",
        choices: (s, h) => [
          c("Kulüp kasasından öde, aidat topla", "Müzakere + · stres", { sk: { muzakere: 2, proje: 2 }, stress: 5, people: 2, end: "basarili" }),
          c("Afişleri kendin tasarla, fotokopiyle bas", "₺800 · yaratıcı", { cost: 800, sk: { bilgisayar: 2 }, m: 3, end: "basarili" }),
          c("Etkinliği ertele", "Rahat · güven kaybı", { people: -2, esteem: -3, end: "ertelendi" }),
        ],
      },
    },
  });

  HS.story("w_grupOdevi", {
    when: stu,
    weight: 0.65,
    room: "salon",
    title: "Dört kişilik grup, bir kişilik emek",
    text: (s, h) => "Dönem projesi dört kişilik. Grup WhatsApp'ında iki kişi \"görüldü\" atıyor, biri ise \"ben sunumda konuşurum\" dedi. Teslime üç hafta var." + (flag(s, "kulupBaskani") ? " Kulüp başkanlığından alıştığın iş bölümü burada da işe yarayabilir." : ""),
    choices: (s, h) => [
      c("Görev dağılımı tablosu çıkar", "Proje yönetimi +", { sk: { proje: 2, liderlik: flag(s, "kulupBaskani") ? 2 : 1 }, set: { yol: "tablo" }, go: "sunum" }),
      c("Hepsini kendin yap", "Uyku − · not garantisi", { sleep: 5, stress: 5, sk: { disiplin: 2 }, set: { yol: "tek" }, go: "sunum" }),
      c("Hocaya önceden söyle", "Dürüst · grup küser", { people: -1, esteem: 2, set: { yol: "hoca" }, go: "sunum" }),
    ],
    steps: {
      sunum: {
        gap: 3,
        when: stu,
        title: "Sunum günü",
        text: (s, h) =>
          h.d.yol === "tablo"
            ? "Tablo işe yaradı; iki kişi kendi bölümünü getirdi. \"Sunumda konuşurum\" diyen ise sabah \"hastayım\" yazdı."
            : h.d.yol === "tek"
              ? "Sunum hazır, hepsi senin elinden çıkma. Hoca \"Herkes kendi kısmını anlatsın\" dedi; diğerleri slaytlara ilk kez bakıyor."
              : "Hoca puanlamayı kişisel katkıya göre yapacağını söyledi. Grup sana selam vermiyor.",
        choices: (s, h) => [
          c("Akıcı biçimde tek başına anlat", "Sunum ++ · not +", { sk: { sunum: 3 }, esteem: 4, m: 3, end: h.d.yol === "tek" ? "kurtardi" : "iyi" }),
          c("Arkadaşlarına da söz bırak", "Çevre + · not riski", { people: 2, m: 1, chance: { p: 0.5, win: { m: 3, end: "iyi" }, lose: { m: -3, end: "orta" }, winT: "Hepsi toparladı", loseT: "Hoca soruyla sıkıştırdı" } }),
        ],
      },
    },
  });

  HS.story("w_finaller", {
    when: (s) => stu(s) && (s.week >= 20 && s.week <= 24 || s.week >= 1 && s.week <= 3 || s.week >= 48),
    weight: 0.8,
    room: "yatak",
    title: "Finale iki gün",
    text: (s, h) =>
      "Finale iki gün kaldı; " + majorName(s) + " notlarının yarısını hiç görmedin. " +
      (done(s, "w_grupOdevi") === "kurtardi" ? "Grup projesini sırtlandığın için vize ortalaman yüksek, biraz nefes payın var." : "Vize notun sınırda.") +
      (done(s, "w_hoca") === "asistan" ? " Hocan zaten seni tanıyor; bu dersi kötü vermek olmaz." : ""),
    choices: (s, h) => [
      c("Sabaha kadar çalış", "Uyku −− · şans", { sleep: 7, stress: 6, cost: 300, set: { yol: "gece" }, go: "sinav" }),
      c("Kütüphanede düzenli çalış, uyu", "Disiplin +", { sk: { disiplin: 2 }, set: { yol: "duzen" }, go: "sinav" }),
      c("Üst sınıftan özet satın al", "₺750 · kestirme", { cost: 750, set: { yol: "ozet" }, go: "sinav" }),
    ],
    steps: {
      sinav: {
        gap: 1,
        when: stu,
        title: "Sınav salonu",
        text: (s, h) => (h.d.yol === "gece" ? "Gözlerin yanıyor; üçüncü kahve midende. " : "") + "Kâğıt dağıtıldı. İlk soru tam da atladığın konudan.",
        choices: (s, h) => {
          let p = 0.6 + (done(s, "w_grupOdevi") === "kurtardi" ? 0.1 : 0) + (h.d.yol === "duzen" ? 0.12 : h.d.yol === "ozet" ? -0.08 : 0);
          return [
            c("Soğukkanlı ol, bildiğinden başla", "Şans", {
              chance: {
                p: clamp(p, 0.2, 0.9),
                win: { m: 6, esteem: 3, sk: { disiplin: 1 }, end: "gecti" },
                lose: { m: -6, stress: 6, end: "butunleme" },
                winT: "BA geldi",
                winP: "OBS'yi yenilerken ellerin titriyordu.",
                loseT: "Bütünlemeye kaldın",
                loseP: "Yaz tatilinin bir haftası kütüphanede geçecek.",
              },
            }),
          ];
        },
      },
    },
  });

  const HOCA = ["Prof. Dr. Nurhan Aksoy", "Doç. Dr. Kemal Ateş", "Prof. Dr. Sibel Uçar", "Dr. Öğr. Üyesi Murat Tan"];
  HS.story("w_hoca", {
    when: (s) => stu(s) && (s.eduWeeks || 0) >= 40,
    weight: 0.5,
    room: "sokak",
    title: "Hocanın odası",
    text: (s, h) => nm(s, HOCA, 0) + " ders çıkışı seni odasına çağırdı: \"TÜBİTAK destekli bir projemiz var, bursiyer öğrenci arıyorum. Ayda ₺5.000, haftada on beş saat. Veri girişi, literatür, biraz da sabır.\"",
    choices: (s, h) => [
      c("Kabul et", "Ek gelir · zaman", { cash: 5000, sk: { tablolama: 2, ingilizce: 1 }, stress: 3, go: "bildiri" }),
      c("Teşekkür et, yarı zamanlı işim var", "Fırsat kaybı", { m: -1, end: "reddetti" }),
    ],
    steps: {
      bildiri: {
        gap: 6,
        when: stu,
        title: "Bildiri özeti",
        text: (s, h) => "Topladığın verilerle bir kongre bildirisi hazırlandı. " + nm(s, HOCA, 0) + " \"İsmini üçüncü yazar olarak koydum; sunumu da sen yapar mısın? Kayıt ücreti ₺2.500, otel bizden.\"",
        choices: (s, h) => [
          c("Sun", "₺2.500 · akademi kapısı", { cost: 2500, sk: { sunum: 3, ingilizce: 2 }, esteem: 5, people: 2, flag: "akademi", end: "asistan" }),
          c("Sadece adın yazsın, sunma", "Rahat", { sk: { tablolama: 1 }, flag: "akademi", end: "yazar" }),
        ],
      },
    },
  });

  HS.story("w_erasmus", {
    when: (s) => stu(s) && !s.abroad,
    weight: 0.55,
    room: "salon",
    title: "Erasmus başvurusu",
    text: (s, h) => "Uluslararası ofis duyurdu: Erasmus başvuruları açık. Puan; not ortalaması ve İngilizce sınavından hesaplanıyor. Gidenler İtalya, Polonya ve Portekiz'den fotoğraf paylaşıyor." + (flag(s, "kulupBaskani") ? " Kulüp başkanlığı ek puan getiriyor." : ""),
    choices: (s, h) => [
      c("Sınava gir", "Şans İngilizceye bağlı", {
        chance: {
          p: clamp(0.2 + sk(s, "ingilizce") / 70 + (flag(s, "kulupBaskani") ? 0.08 : 0), 0.15, 0.9),
          win: { sk: { ingilizce: 2 }, esteem: 5, m: 5, go: "hibe" },
          lose: { m: -4, sk: { ingilizce: 1 }, end: "kaldi" },
          winT: "Asil listedesin",
          loseT: "Yedek listede kaldın",
        },
      }),
      c("Önce İngilizcemi geliştireyim", "Gelecek yıl belki", { sk: { ingilizce: 1 }, end: "erteledi" }),
    ],
    steps: {
      hibe: {
        gap: 4,
        when: stu,
        title: "Hibe yetecek mi?",
        text: (s, h) =>
          "Hibe ayda 450 avro; ama kabul edildiğin şehirde bir oda bile 500 avro. Vize, uçak ve depozito için en az ₺60.000 gerekecek." +
          (HS.done(s, "w_kyk") === "biriktirdi" ? " Mevduatta biriktirdiğin KYK parası tam burada işe yarar." : ""),
        choices: (s, h) => [
          c("Git", "₺60.000 · bir dönem yurt dışı", { cost: HS.done(s, "w_kyk") === "biriktirdi" ? 45000 : 60000, sk: { ingilizce: 6, iletisim: 3 }, people: 4, m: 8, flag: "erasmus", end: "gitti" }),
          c("Aileden destek iste", "Bağ · gurur", { cost: 25000, sk: { ingilizce: 5 }, people: 3, m: 5, esteem: -2, flag: "erasmus", end: "gitti" }),
          c("Vazgeç", "Para cebinde, içinde ukde", { m: -6, end: "vazgecti" }),
        ],
      },
    },
  });

  // ==========================================================
  // 8) Kariyer değişimi: yüksek lisans, "kendi işimi kurayım mı?"
  // ==========================================================
  HS.story("w_yuksekLisans", {
    when: (s) => s.edu === "universite" && isWork(s) && s.age <= 45,
    weight: 0.5,
    room: "salon",
    title: "Akşamları yüksek lisans",
    text: (s, h) =>
      "Bir vakıf üniversitesi tezsiz akşam yüksek lisansı açmış: iki dönem ₺180.000. Devletin tezli programı ise ALES ve gündüz ders istiyor." +
      (flag(s, "akademi") ? " Öğrenciliğinde bildirisinde adın geçen hocan referans olmaya hazır." : "") +
      (s.company && team(s) && rel(s, "yonetici") >= 60 ? " " + h.cast("yonetici").name + " \"Şirket yarısını karşılayabilir\" dedi." : ""),
    choices: (s, h) => {
      const half = s.company && team(s) && rel(s, "yonetici") >= 60;
      return [
        c("Tezsiz programa yazıl", half ? "₺90.000 (şirket desteğiyle)" : "₺180.000", { cost: half ? 90000 : 180000, sk: { proje: 2 }, stress: 5, set: { tur: "tezsiz" }, go: "donem" }),
        c("ALES'e çalış, tezliye gir", "₺1.100 sınav · emek", {
          cost: 1100,
          chance: {
            p: clamp(0.4 + sk(s, "disiplin") / 120 + (flag(s, "akademi") ? 0.2 : 0), 0.2, 0.9),
            win: { esteem: 4, set: { tur: "tezli" }, go: "donem" },
            lose: { m: -4, end: "ales" },
            winT: "Mülakatı geçtin",
            loseT: "ALES puanın yetmedi",
          },
        }),
        c("Bunun yerine sertifika programı al", "₺14.000 · kısa", { cost: 14000, sk: { proje: 3, tablolama: 2 }, end: "sertifika" }),
      ];
    },
    steps: {
      donem: {
        gap: 8,
        when: isWork,
        title: "İş, ders, sınav",
        text: (s, h) => "Haftada üç akşam ders. " + (h.d.tur === "tezli" ? "Danışmanın tez konusunu daraltmanı istiyor; gündüz derslerine izin almak gerekiyor." : "Final projesi ile iş teslimi aynı haftaya denk geldi."),
        choices: (s, h) => [
          c("İki tarafı da taşı", "Uyku − · diploma", { sleep: 5, stress: 8, sk: { proje: 3, sunum: 2, ingilizce: 2 }, ...(s.company ? { perf: -3 } : {}), go: "mezun" }),
          c("Bir dönem dondur", "Nefes · gecikme", { m: 2, stress: -4, go: "mezun", set: { dondurdu: 1 } }),
        ],
      },
      mezun: {
        gap: 10,
        when: isWork,
        title: "Yüksek lisans diploması",
        text: (s, h) => (h.d.dondurdu ? "Bir dönem gecikmeli de olsa " : "") + "Diploma töreninde cübbe yine biraz büyük geldi. Masaya yeni bir CV satırı eklendi.",
        choices: (s, h) => [
          c("Zam iste", "Müzakere · şans", {
            chance: {
              p: clamp(0.45 + perf(s) / 200, 0.3, 0.85),
              win: { ...P(s, 1.1), esteem: 6, flag: "yuksekLisans", end: "zam" },
              lose: { esteem: 2, flag: "yuksekLisans", flag2: 1, end: "diploma" },
              winT: "%10 zam",
              loseT: "\"Bütçe yok\"",
            },
          }),
          c("Kutla, yeter", "Moral +", { m: 6, people: 2, flag: "yuksekLisans", end: "diploma" }),
        ],
      },
    },
  });

  HS.story("w_kendiIs", {
    when: (s) => isWork(s) && s.job !== "business" && s.age >= 24 && s.age <= 50,
    weight: (s) => (flag(s, "serbestIs") || flag(s, "cvGuncel") ? 0.7 : 0.4),
    room: "salon",
    title: "Kendi işimi kursam?",
    text: (s, h) =>
      "Pazartesi sabahı alarm çaldığında aynı cümle kafanda: \"Bunu başkası için değil, kendim için yapsam?\" " +
      (flag(s, "serbestIs") ? "Serbest işlerden düzenli müşterilerin bile var. " : "") +
      (done(s, "w_kucultme") === "kesinti" || done(s, "w_kucultme") === "aramada" ? "Maaş kesintisinden sonra bu soru daha yüksek sesle soruluyor. " : "") +
      (rel(s, "isArk") >= 65 && team(s) ? h.cast("isArk").name + " de yıllardır aynı hayali kuruyor." : ""),
    choices: (s, h) => [
      c("Hafta sonları küçük bir deneme yap", "₺15.000 · pazar testi", { cost: 15000, sk: { pazarlama: 2, finans: 1 }, set: { ortak: 0 }, go: "deneme" }),
      rel(s, "isArk") >= 65 && team(s)
        ? c(h.cast("isArk").name + " ile ortaklık konuş", "Yük paylaşılır · ilişki riski", { cost: 8000, rel: { isArk: 6 }, sk: { muzakere: 2 }, set: { ortak: 1 }, go: "deneme" })
        : null,
      c("Hayal olarak kalsın", "Güvence", { m: -2, end: "hayal" }),
    ],
    steps: {
      deneme: {
        gap: 5,
        when: isWork,
        title: "İlk üç ayın hesabı",
        text: (s, h) =>
          "Excel tablosu ortada: ilk siparişler geldi ama kârın ancak kargo ve reklamı karşılıyor. " +
          (h.d.ortak ? h.cast("isArk").name + " sermayeyi artırmak istiyor; sen temkinlisin." : "Akşamların ve hafta sonların tamamen bu işe gidiyor."),
        choices: (s, h) => [
          c("Biraz daha büyüt", "₺25.000 · şans", {
            cost: 25000,
            chance: {
              p: 0.45 + (flag(s, "serbestIs") ? 0.1 : 0) + (sk(s, "pazarlama") > 20 ? 0.1 : 0),
              win: { cash: 55000, esteem: 6, m: 5, flag: "girisimHazir", rel: h.d.ortak ? { isArk: 8 } : {}, end: "tuttu" },
              lose: { m: -6, stress: 8, rel: h.d.ortak ? { isArk: -12 } : {}, end: "batti" },
              winT: "İş kendi ayakları üzerinde",
              winP: "Artık istifa dilekçesi kafanda bir taslak değil, bir seçenek.",
              loseT: "Zarar büyüdü",
              loseP: "Stoktaki kolileri akrabalara dağıttın.",
            },
          }),
          c("Yan iş olarak kalsın", "Küçük ama güvenli", { cash: 6000, m: 1, end: "yanIs" }),
          c("Kapat, dersini al", "Rahatlama", { m: 2, stress: -4, sk: { finans: 2 }, end: "kapatti" }),
        ],
      },
    },
  });
})(globalThis.HS || (globalThis.HS = {}));
