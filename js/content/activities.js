// Boş zaman etkinlikleri: haftalık karardan bağımsız, her hafta birkaç kez yapılabilir.
// Her etkinlik bir boş zaman harcar ve haftada bir kez yapılır.
// surprises: [{p, when?, t, text, fx, art, kind}] — düşük ihtimalli beklenmedik olaylar.
(function (HS) {
  "use strict";
  const pp = (s) =>
    s.flags.pp ||
    (s.flags.pp =
      HS.NAMES.partner[(Math.random() * HS.NAMES.partner.length) | 0]);

  HS.ACTIVITIES = [
    {
      id: "spor",
      label: "Koşuya çık",
      art: "running-shoe",
      hint: "Kilo −, sağlık +",
      fx: { h: 3, m: 2, kg: -0.35, mus: 0.5 },
      done: "Sahil yolunda 5 km koştun.",
      surprises: [
        {
          p: 0.06,
          t: "Bileğin burkuldu",
          text: "Koşu bandından inerken ayağın kaydı. Bir hafta topallayacaksın.",
          fx: { h: -5, m: -2 },
          art: "✕",
          kind: "lose",
        },
        {
          p: 0.05,
          when: (s) => !s.partner && s.age >= 19,
          t: "Salonda bir tanışma",
          text: (s) =>
            pp(s) +
            " ile aynı makineyi beklerken sohbet açıldı. Kahve sözü verdiniz.",
          fx: (s) => ({ partner: "new", partnerName: pp(s), m: 5 }),
          art: "♡",
          kind: "win",
        },
      ],
    },
    {
      id: "salon",
      label: "Spor salonu",
      art: "flexed-biceps",
      hint: "Kas +, kilo −",
      fx: (s) => ({ cost: s.flags.salonUye ? 0 : 350, mus: s.flags.salonUye ? 3 : 2.2, kg: -0.15, h: 1 }),
      done: "Ağırlık çalıştın; kasların yanıyor.",
      surprises: [
        { p: 0.04, t: "Omzun incindi", text: "Fazla ağırlık kaldırdın; birkaç hafta dikkatli olmalısın.", fx: { h: -4, mus: -2 }, art: "✕", kind: "lose" },
      ],
    },
    {
      id: "diyet",
      label: "Sağlıklı beslen",
      art: "green-salad",
      hint: "Kilo −, mutluluk −",
      when: (s) => HS.Body.bmi(s) > 20,
      fx: { kg: -0.6, m: -2, h: 1 },
      done: "Bu hafta şekeri ve hamuru kestin.",
    },
    {
      id: "disarida",
      label: "Dışarıda ye",
      art: "hamburger",
      hint: "Mutluluk +, kilo +",
      fx: { cost: 900, m: 4, kg: 0.45 },
      done: "Sevdiğin yerde doya doya yedin.",
    },
    {
      id: "ders",
      label: "Ders çalış",
      art: "books",
      hint: "Beceri +",
      fx: (s) => ({ skill: s.edu === "ogrenci" ? 3 : 2 }),
      done: "Defterler doldu, bir şeyler yerine oturdu.",
      surprises: [
        {
          p: 0.04,
          t: "Bir sertifika fırsatı",
          text: "Çalıştığın konuda ücretsiz bir çevrim içi sertifika sınavını geçtin.",
          fx: { skill: 3, m: 4 },
          art: "✓",
          kind: "win",
        },
      ],
    },
    {
      id: "arkadas",
      label: "Arkadaşlarla buluş",
      art: "hot-beverage",
      hint: "Çevre +, mutluluk +, biraz para",
      fx: { cost: 500, people: 1.5, m: 3 },
      done: "Gece kahkahayla bitti.",
      surprises: [
        {
          p: 0.06,
          when: (s) => !s.partner && s.age >= 19,
          t: "Arkadaşının arkadaşı",
          text: (s) =>
            "Masaya sonradan katılan " +
            pp(s) +
            " ile konuşmanız saatler sürdü.",
          fx: (s) => ({ partner: "new", partnerName: pp(s), m: 6 }),
          art: "♡",
          kind: "win",
        },
        {
          p: 0.05,
          when: (s) => s.job === "none" && !s.retired,
          t: "Bir iş ipucu",
          text: "Arkadaşın, çalıştığı yerde bir pozisyon açılacağını söyledi. Başvurularda referansın olacak.",
          fx: { flag: "bilinen", m: 3 },
          art: "✦",
          kind: "win",
        },
      ],
    },
    {
      id: "aile",
      label: "Aileni ziyaret et",
      art: "house-with-garden",
      hint: "Mutluluk +, çevre +",
      fx: { m: 3, people: 0.5, kidBond: 1 },
      done: "Annenin çayı her zamanki gibi demliydi.",
      surprises: [
        {
          p: 0.12,
          when: (s) => s.age <= 24,
          t: "Cebe sıkıştırılan para",
          text: "Çıkarken babanın elini öptün; avucunda katlanmış bir para kaldı.",
          fx: { cash: 1500, m: 2 },
          art: "✦",
          kind: "win",
        },
        {
          p: 0.08,
          when: (s) => s.job === "none" && !s.retired && s.age >= 19,
          t: "Dayın da oradaydı",
          text: "Sofradaki konuşma işe geldi. Dayın bir tanıdığından söz etti; yakında arayacakmış.",
          fx: { flag: "torpilHint" },
          art: "✦",
        },
      ],
    },
    {
      id: "partner",
      label: "Partnerinle vakit",
      art: "ring",
      hint: "Bağ +",
      when: (s) => !!s.partner,
      fx: { cost: 800, bond: 4, m: 3 },
      done: (s) => s.partner.name + " ile güzel bir akşamdı.",
      surprises: [
        {
          p: 0.05,
          t: "Küçük bir kırgınlık",
          text: "Yemekte telefona fazla baktın; tatsız bir sessizlik oldu.",
          fx: { bond: -6 },
          art: "✕",
          kind: "lose",
        },
      ],
    },
    {
      id: "cocuk",
      label: "Çocuklarla oyna",
      art: "baby-bottle",
      hint: "Çocuklarla bağ +",
      when: (s) => s.children.some((k) => s.year - k.born < 18),
      fx: { kidBond: 5, m: 3 },
      done: "Oyun parkında saatin nasıl geçtiğini anlamadın.",
    },
    {
      id: "ekis",
      label: "Ek iş yap",
      art: "briefcase",
      hint: "Para +, sağlık −",
      when: (s) => !s.retired,
      fx: (s) => ({
        cash: Math.round(1200 * (1 + s.skill * 0.015)),
        h: -1,
        skill: 1,
      }),
      done: "Hafta sonu ek işinden para geldi.",
      surprises: [
        {
          p: 0.12,
          t: "Müşteri ödemeyi geciktirdi",
          text: 'Yaptığın işin parasını "ay sonu" diye erteledi. Bir kısmı hiç gelmeyebilir.',
          fx: { cash: -800, m: -2 },
          art: "✕",
          kind: "lose",
        },
      ],
    },
    {
      id: "gez",
      label: "Şehri gez",
      art: "deciduous-tree",
      hint: "Mutluluk +",
      fx: { cost: 300, m: 4 },
      done: (s, h) =>
        h.ek(s.city, "gen") + " bilmediğin bir sokağını keşfettin.",
      surprises: [
        {
          p: 0.04,
          t: "Yerde bir cüzdan",
          text: "Bankta unutulmuş bir cüzdan buldun ve sahibine ulaştırdın. Sana sarılıp teşekkür etti.",
          fx: { people: 2, m: 4 },
          art: "✦",
          kind: "win",
        },
        {
          p: 0.03,
          t: "Telefonun çalındı",
          text: "Kalabalık bir tramvayda cebin boşaldı.",
          fx: { cash: -8000, m: -5 },
          art: "✕",
          kind: "lose",
        },
      ],
    },
    {
      id: "gonullu",
      label: "Gönüllü ol",
      art: "handshake",
      hint: "Çevre ++",
      fx: { people: 2, m: 2 },
      done: "Mahalle derneğinde birkaç saat yardım ettin.",
    },
    {
      id: "dinlen",
      label: "Dinlen",
      art: "couch-and-lamp",
      hint: "Sağlık +",
      fx: { h: 2, m: 1 },
      done: "Uzun bir uyku iyi geldi.",
    },
    {
      id: "piyango",
      label: "Piyango bileti al",
      art: "four-leaf-clover",
      when: (s) => s.age >= 18,
      hint: "₺100 · küçük bir umut",
      fx: { cost: 100 },
      done: "Bilet cüzdanında; çekiliş yakında.",
      surprises: [
        {
          p: 0.004,
          t: "BÜYÜK İKRAMİYE!",
          text: "Numaraları üç kez kontrol ettin. Gerçekten tuttu.",
          fx: {
            cash: 1000000,
            m: 20,
            log: "Piyangodan büyük ikramiye kazandı.",
          },
          art: "★",
          kind: "win",
        },
        {
          p: 0.04,
          t: "Amorti ve biraz fazlası",
          text: "Küçük bir ikramiye çıktı.",
          fx: { cash: 2000, m: 3 },
          art: "✓",
          kind: "win",
        },
      ],
    },
  ];
})(globalThis.HS || (globalThis.HS = {}));
