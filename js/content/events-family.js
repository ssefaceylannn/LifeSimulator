// İş başvuruları, mülakatlar ve akrabalar (torpil teklifi, görücü, bayram, borç...).
// Sonucu belli olmayan seçimler fx.chance ile yazılır: {p, win, lose, winT, winP, loseT, loseP}.
(function (HS) {
  "use strict";
  const c = (label, hint, fx = {}) => ({ label, hint, fx });
  const pct = (p) => "%" + Math.round(p * 100);
  // Şirket başvuruları (a.co) js/systems/companies.js içinde ayrıca işlenir
  const app = (s, pred) => (s.apps || []).find((a) => !a.co && pred(a));

  HS.EVENTS.push(
    // ---------------- Başvuru süreci ----------------
    {
      id: "interview",
      priority: 86,
      cooldown: 0,
      when: (s) =>
        !!app(
          s,
          (a) => a.interview && s.weeks >= a.from + 1 && s.weeks < a.due,
        ),
      title: (s) =>
        HS.JOBS[app(s, (a) => a.interview && s.weeks < a.due).job].name +
        " mülakatı",
      text: (s) => {
        const a = app(s, (x) => x.interview && s.weeks < x.due);
        return (
          "Bekleme salonunda adın okundu. Masada üç kişi var; biri özgeçmişini çeviriyor. Şu anki şansın " +
          pct(a.p) +
          (HS.outfitFits(s, a.job)
            ? ". Kıyafetin bu iş için uygun."
            : ". Kıyafetin bu işe pek uygun değil; gardıroptan daha uygun bir şey seçebilirdin.")
        );
      },
      choices: (s) => {
        const a = app(s, (x) => x.interview && s.weeks < x.due);
        return [
          c("Hazırlandığın gibi anlat", "Sakin ve net. Şansın artar.", {
            boostApp: a.job,
            boost: 0.08 + Math.min(0.08, s.skill * 0.003),
            m: 1,
          }),
          c("Kendini biraz abart", "Etkileyici ama riskli.", {
            boostApp: a.job,
            boost: 0,
            chance: {
              p: 0.5,
              win: { boostApp: a.job, boost: 0.2 },
              lose: { boostApp: a.job, boost: -0.15 },
              winT: "Herkes etkilendi",
              winP: "Hikâyen tuttu; görüşmeciler gülümseyerek not aldı.",
              loseT: "Bir soru seni yakaladı",
              loseP: "Abarttığın bir konuda ayrıntı sorulunca bocaladın.",
            },
          }),
          c("Ücret ve hakları sor", "Dürüstlük hoş karşılanabilir.", {
            boostApp: a.job,
            boost: 0.03,
            skill: 1,
          }),
        ];
      },
    },
    {
      id: "appResult",
      priority: 85,
      cooldown: 0,
      when: (s) => !!app(s, (a) => s.weeks >= a.due),
      title: "Telefon çaldı",
      text: (s) => {
        const a = app(s, (x) => s.weeks >= x.due);
        return (
          "Ekranda bilinmeyen bir numara var. " +
          HS.JOBS[a.job].name +
          " başvurunun sonucu olabilir. Tahmini şansın " +
          pct(a.p) +
          (a.torpil ? "; araya bir tanıdık girdi." : ".")
        );
      },
      choices: (s) => {
        const a = app(s, (x) => s.weeks >= x.due);
        const list = [
          c(
            "Telefonu aç",
            s.job !== "none"
              ? "Kabul edilirsen mevcut işinden ayrılırsın."
              : "Kalbin hızlı atıyor.",
            { resolveApp: a.job },
          ),
        ];
        if (s.job !== "none")
          list.push(
            c("Başvuruyu geri çek", "Şimdiki işinde kal.", {
              resolveApp: a.job,
              decline: true,
            }),
          );
        return list;
      },
    },

    // ---------------- Akrabalar ----------------
    {
      id: "torpil",
      weight: (s) =>
        s.job === "none" && !s.retired && s.edu !== "ogrenci"
          ? s.flags.torpilHint
            ? 8
            : 2.2
          : 0,
      cooldown: 104,
      minAge: 19,
      maxAge: 50,
      title: "Dayın çaya geldi",
      text: (s, h) =>
        'Dayın çayını karıştırırken belediye şirketinde bir tanıdığı olduğunu söyledi: "Bir telefonumla seni işe aldırırım." Ailen umutla sana bakıyor.',
      choices: (s) => [
        c(
          "Dayıya güven",
          "Kabul şansı %92. Ama bu iyilik bir gün geri istenebilir.",
          {
            apply: "memur",
            torpil: true,
            flag: "torpilKabul",
            people: 1,
            theme: "family",
          },
        ),
        c("Kendi yolumu bulurum", "Gururun okşanır; işi kendin bul.", {
          m: 3,
          skill: 1,
          theme: "career",
          flag: "torpilRet",
        }),
        c("Kibarca oyala", "Ne evet ne hayır.", { m: -1 }),
      ],
    },
    {
      id: "torpilGossip",
      weight: 3,
      once: true,
      when: (s) => s.torpilJob && s.job === s.torpilJob && s.jobWeeks > 6,
      title: "Koridorda fısıltılar",
      text: 'İş arkadaşların seni görünce sesini alçaltıyor. Birinin "dayısının torpiliyle geldi" dediğini duydun.',
      choices: [
        c("İşini en iyi yaparak kanıtla", "Daha çok çalış.", {
          skill: 3,
          h: -2,
          m: -1,
          theme: "career",
        }),
        c("Yüzleş ve konuş", "Sert ama açık.", {
          chance: {
            p: 0.55,
            win: { people: 3, m: 4 },
            lose: { people: -3, m: -4 },
            winT: "Hava temizlendi",
            winP: "Açık konuşman saygı kazandırdı.",
            loseT: "Ortam daha da gerildi",
            loseP: "Savunmaya geçmen dedikoduyu büyüttü.",
          },
        }),
        c("Duymazdan gel", "Zamanla geçer.", { m: -3 }),
      ],
    },
    {
      id: "torpilFavor",
      weight: 3,
      once: true,
      when: (s) => s.flags.torpilKabul && s.year - s.flags.torpilKabul >= 1,
      title: "Dayının ricası",
      text: (s, h) =>
        "Dayın aradı: oğlunun düğünü için " +
        h.tl(40000) +
        ' borç istiyor. "O zaman ben de sana yardım etmiştim" demeyi de ihmal etmedi.',
      choices: [
        c("Borç ver", "İyiliği öde. Geri gelir mi bilinmez.", {
          cost: 40000,
          people: 2,
          theme: "family",
          chance: {
            p: 0.45,
            win: { cash: 40000, m: 3 },
            lose: { m: -2 },
            winT: "Dayın sözünü tuttu",
            winP: "Birkaç ay sonra para kuruşu kuruşuna geri geldi.",
            loseT: "Para geri gelmedi",
            loseP: "Konu her açıldığında dayın lafı değiştirdi.",
          },
        }),
        c("Nazikçe reddet", "Aile içinde soğukluk olabilir.", {
          people: -4,
          m: -3,
        }),
      ],
    },
    {
      id: "gorucu",
      weight: (s) => (!s.partner ? 1.2 : 0),
      cooldown: 80,
      minAge: 23,
      maxAge: 42,
      title: "Teyzenin sürprizi",
      text: (s, h) =>
        "Teyzen, komşusunun " +
        (s.look === "man" ? "kızıyla" : "oğluyla") +
        ' tanışman için bir akşam yemeği ayarlamış. "Bir görüşüver, ne kaybedersin?"',
      choices: (s, h) => {
        const name = s.flags.pp || (s.flags.pp = h.pick(HS.NAMES.partner));
        return [
          c("Yemeğe git", "Tanışma kısmet işi.", {
            cost: 600,
            chance: {
              p: 0.45 + Math.min(0.2, s.people / 200),
              win: { partner: "new", partnerName: name, m: 6 },
              lose: { m: -2 },
              winT: name + " ile kıvılcım",
              winP: "Yemekten sonra yürüyüş uzadı. Numaralar değiş tokuş edildi.",
              loseT: "Bir türlü ısınamadınız",
              loseP:
                "Sohbet hava durumundan öteye geçmedi. Teyzen yine de umutlu.",
            },
          }),
          c("İşim var de", "Teyzen biraz bozulur.", { people: -1, m: 1 }),
        ];
      },
    },
    {
      id: "bayram",
      priority: 75,
      cooldown: 20,
      when: (s) => s.week === 14 || s.week === 24,
      title: "Bayram sabahı",
      text: (s) =>
        "Evin içi kolonya ve börek kokuyor. Büyükleri ziyaret etme zamanı." +
        (s.age >= 24 && !s.partner
          ? ' Yine "ne zaman evleniyorsun?" sorusu gelecek.'
          : ""),
      choices: (s) => [
        c(
          "Büyükleri ziyaret et",
          s.children.length ? "Çocuklara harçlık ver." : "El öp, sohbet et.",
          {
            cost: s.children.length ? 1500 : 300,
            people: 3,
            m: s.age >= 24 && !s.partner ? 1 : 4,
            kidBond: 3,
            theme: "family",
          },
        ),
        s.age <= 22
          ? c("Harçlık topla", "Büyüklerin elini öp.", {
              cash: 2500,
              m: 4,
              people: 1,
            })
          : null,
        c("Tatil fırsatı, şehirden kaç", "Aile biraz kırılır.", {
          cost: 3500,
          m: 6,
          h: 2,
          people: -2,
        }),
      ],
    },
    {
      id: "amcaBorc",
      weight: (s) => (s.cash > 30000 * s.idx.cpi ? 1 : 0),
      cooldown: 156,
      minAge: 25,
      title: "Amcanın derdi",
      text: (s, h) =>
        "Amcanın dükkânı zor durumda. Senden " +
        h.tl(25000) +
        " istiyor ve iki ayda ödeyeceğine söz veriyor.",
      choices: [
        c("Ver", "Aile her şeydir. Geri dönme ihtimali belirsiz.", {
          cost: 25000,
          theme: "family",
          chance: {
            p: 0.6,
            win: { cash: 27000, people: 2, m: 3 },
            lose: { people: 1, m: -4 },
            winT: "Amcan sözünü tuttu",
            winP: "Üstüne bir de kavanoz bal getirdi.",
            loseT: "Para batmış",
            loseP: "Dükkân kapandı; amcan senden utanıyor.",
          },
        }),
        c("Yarısını ver", "Ortası.", { cost: 12500, people: 1 }),
        c("Veremem", "Kırgınlık kalabilir.", { people: -3, m: -1 }),
      ],
    },
    {
      id: "kuzenKiyas",
      weight: 1,
      cooldown: 104,
      minAge: 20,
      maxAge: 40,
      title: "Kuzeninle kıyaslanmak",
      text: (s, h) =>
        "Aile yemeğinde biri yine " +
        ((s.kin || []).find((k) => k.rel === "kuzen" && k.alive) ? "kuzenin " + HS.ek(s.kin.find((k) => k.rel === "kuzen" && k.alive).name, "gen") + " " : "kuzeninin ") +
        h.pick([
          "doktor olduğunu",
          "ev aldığını",
          "yurt dışına yerleştiğini",
          "terfi aldığını",
        ]) +
        " anlattı. Gözler sana döndü.",
      choices: [
        c("Gülümse, kendi hedefini anlat", "Herkesin yolu başka.", {
          m: 1,
          people: 1,
        }),
        c("Hırs yap", "Bu yıl daha çok çalışacaksın.", {
          skill: 3,
          m: -2,
          theme: "career",
        }),
        c("Masadan kalk", "Bunu dinlemek zorunda değilsin.", {
          m: -3,
          people: -2,
        }),
      ],
    },
    {
      id: "aileYemegi",
      weight: 1,
      cooldown: 30,
      title: "Pazar kahvaltısı",
      text: "Annen herkesi pazar kahvaltısına çağırdı. Menemen, simit ve uzun sohbetler.",
      choices: [
        c("Git", "Sofra kalabalık olsun.", {
          people: 2,
          m: 4,
          kidBond: 2,
          bond: 2,
        }),
        c("Uyu", "Hafta yorucuydu.", { h: 2, people: -1 }),
      ],
    },
    {
      id: "miras",
      weight: 1,
      once: true,
      minAge: 45,
      maxAge: 70,
      title: "Miras kavgası",
      text: "Büyüklerinden kalan tarla için kardeşlerin arasında tartışma çıktı. Mahkemeye gitmek de var, payından vazgeçmek de.",
      choices: [
        c("Mahkemeye git", "Avukat masrafı var; sonuç belirsiz.", {
          cost: 20000,
          chance: {
            p: 0.5,
            win: { landGift: 1, people: -4, m: 2 },
            lose: { people: -5, m: -6 },
            winT: "Dava kazanıldı",
            winP: "Tarla senin oldu ama aile sofrası artık eskisi gibi değil.",
            loseT: "Dava kaybedildi",
            loseP: "Hem para hem kardeşlik gitti.",
          },
        }),
        c("Payından vazgeç", "Huzur paradan değerli.", {
          people: 5,
          m: 3,
          theme: "family",
        }),
      ],
    },
    {
      id: "harclik",
      weight: (s) => (s.age <= 21 ? 2 : 0),
      cooldown: 52,
      title: "Babaannenin zarfı",
      text: 'Babaannen ziyarete geldiğinde avucuna katlanmış bir zarf sıkıştırdı. "Annene söyleme."',
      choices: [
        c("Teşekkür et ve sakla", "Birikime ekle.", (s) => ({
          cash: 3000,
          save: 3000 * s.idx.cpi,
          m: 3,
        })),
        c("Onu dışarı yemeğe çıkar", "Parayı onunla harca.", {
          m: 6,
          people: 1,
          theme: "family",
        }),
      ],
    },
  );
})(globalThis.HS || (globalThis.HS = {}));
