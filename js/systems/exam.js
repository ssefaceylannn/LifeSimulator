// Üniversite sınavı (YKS) süreci. Takvim (yıl içi hafta):
//   6-9 başvuru · 25 sınav (hafta sonu) · 29 sonuç · 31 tercih · 35 yerleştirme · 37 kayıt
// Hazırlık puanı (0-100) ders çalışmak, soru çözmek, deneme sınavları ve dershane ile artar;
// çalışılmayan haftalarda yavaşça düşer. Oyun sık sık gerçek bir soru sorar, annen hatırlatır,
// deneme sınavı sonuçları gelir. Sınav puanı (100-560) hazırlığa ve sınav günü kararlarına
// bağlıdır; tercih listesi puana göre açılır ve yerleşme şansı puan farkına göre hesaplanır.
(function (HS) {
  "use strict";
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const r = () => HS.rng();
  const money = (n) => HS.money(n);
  const c = (label, hint, fx = {}) => ({ label, hint, fx });
  HS.EXAM_WEEKS = { applyFrom: 6, applyTo: 9, exam: 25, result: 29, pref: 31, place: 35, enroll: 37 };
  const W = HS.EXAM_WEEKS;
  // Programlar: min = son yıllarda yerleşilen yaklaşık en düşük puan (oyun ölçeği), years = süre
  HS.PROGRAMS = [
    { id: "tip", name: "Tıp Fakültesi", min: 490, years: 6, field: "nurse", desc: "En yüksek puanlı bölüm; altı yıl." },
    { id: "hukuk", name: "Hukuk", min: 445, years: 4, field: "office", desc: "Avukatlık ve kamu sınavları." },
    { id: "bilmuh", name: "Bilgisayar Mühendisliği", min: 430, years: 4, field: "office", desc: "Yazılım şirketlerinde aranıyor." },
    { id: "psikoloji", name: "Psikoloji", min: 395, years: 4, field: "office", desc: "Klinik, kurum ve insan kaynakları." },
    { id: "sinif", name: "Sınıf Öğretmenliği", min: 370, years: 4, field: "teacher", desc: "Öğretmenlik için doğrudan yol." },
    { id: "isletme", name: "İşletme", min: 345, years: 4, field: "office", desc: "Ofis işlerinin klasik kapısı." },
    { id: "hemsire", name: "Hemşirelik", min: 345, years: 4, field: "nurse", desc: "Hastanelerde iş garantisine yakın." },
    { id: "iktisat", name: "İktisat", min: 320, years: 4, field: "office", desc: "Banka, finans ve kamu." },
    { id: "turizm", name: "Turizm İşletmeciliği", min: 270, years: 4, field: "cafe", desc: "Otel ve kafe yönetimi." },
    { id: "programci", name: "Bilgisayar Programcılığı (önlisans)", min: 225, years: 2, field: "office", desc: "İki yıllık; hızlı iş." },
    { id: "acik", name: "Açıköğretim (Adalet önlisans)", min: 150, years: 2, field: "memur", desc: "Puan şartı düşük; çalışırken okunur." },
  ];

  function init(s) {
    if (s.exam === undefined) s.exam = null;
  }
  HS.HOOKS.newLife.push(init);
  HS.HOOKS.migrate.push(init);
  // Hazırlığın hedeflediği sınav yılı
  const targetYear = (s) => (s.week <= W.applyTo ? s.year : s.year + 1);
  HS.examStart = (s) => {
    s.exam = { year: targetYear(s), applied: false, prep: Math.max(5, s.skill * 0.8), mocks: [], dershane: false, lastStudy: s.weeks, phase: "hazirlik", score: null, rank: null, choice: null, asked: [] };
    s.flags.examPrep = s.year;
  };
  HS.FX.examStart = (s) => {
    HS.examStart(s);
    s.scenes.push({ t: s.exam.year + " YKS'ye hazırlık başladı", p: "Başvurular şubatta, sınav haziranda. Her gün biraz çalış: oyun sana soru soracak, deneme sınavları gelecek. Takvime önemli tarihler not edildi.", art: "✎" });
  };
  HS.CAN.examStart = (s) => (s.edu !== "lise" && s.edu !== "yarim" ? "Zaten üniversite okudun ya da okuyorsun." : s.exam && s.exam.phase !== "bitti" ? "Hazırlığın zaten sürüyor." : s.age > 35 ? "Bu yaşta açık ve gece programları daha uygun." : true);
  HS.FX.prep = (s, v) => {
    if (!s.exam) return;
    s.exam.prep = clamp(s.exam.prep + v * (v > 0 ? clamp(1.25 - s.exam.prep / 120, 0.35, 1.2) : 1), 0, 100);
    if (v > 0) s.exam.lastStudy = s.weeks;
  };
  const active = (s) => s.exam && s.exam.phase === "hazirlik";
  HS.examActive = active;
  // Hazırlıktan beklenen TYT neti (120 soru üzerinden) ve sınav puanı
  HS.examNet = (s) => Math.round(clamp(18 + s.exam.prep * 0.95 + (r() - 0.5) * 12, 0, 120));
  HS.examScore = (s, bonus = 0) => Math.round(clamp(160 + s.exam.prep * 3.4 + s.skill * 0.4 + bonus + (r() - 0.5) * 40, 100, 560));
  HS.examRank = (score) => Math.max(1, Math.round(2600000 / (1 + Math.exp((score - 300) / 42))));

  // Haftalık: çalışılmayan hafta düşüş, dershane artışı, iş yorgunluğu
  HS.HOOKS.weekly.push((s) => {
    if (!active(s)) return;
    const idle = s.weeks - (s.exam.lastStudy || 0);
    if (idle >= 2) s.exam.prep = clamp(s.exam.prep - 0.6, 0, 100);
    if (s.exam.dershane) HS.FX.prep(s, 1.4);
    if (s.job !== "none") s.exam.prep = clamp(s.exam.prep - 0.2, 0, 100);
    // Başvuru dönemi kaçtıysa hedef bir sonraki yıla kayar
    if (!s.exam.applied && s.year === s.exam.year && s.week > W.applyTo) {
      s.exam.year++;
      s.scenes.push({ t: "Başvuru dönemi kaçtı", p: "Bu yılki YKS başvurusunu yapmadın. Hazırlık " + s.exam.year + " sınavı için sürecek.", art: "!", kind: "lose" });
    }
  });
  HS.HOOKS.monthly.push((s) => {
    if (active(s) && s.exam.dershane) HS.book(s, "Dershane taksiti", 9000 * s.idx.cpi);
  });
  // Ders çalış etkinliği hazırlığa da katkı verir
  const ders = (HS.ACTIVITIES || []).find((a) => a.id === "ders");
  if (ders) {
    const f = ders.fx;
    ders.fx = (s, ctx, p) => ({ ...(typeof f === "function" ? f(s, ctx, p) : f), ...(active(s) ? { prep: 3 } : {}) });
  }
  // Soru çözme etkinliği: arayüz soruyu gösterir, param = verilen cevap
  HS.pickQuestion = (s) => {
    const asked = (s.exam && s.exam.asked) || [];
    const pool = HS.QUESTIONS.map((q, i) => i).filter((i) => !asked.includes(i));
    const i = (pool.length ? pool : HS.QUESTIONS.map((q, j) => j))[(r() * (pool.length || HS.QUESTIONS.length)) | 0];
    const q = HS.QUESTIONS[i];
    const opts = [q.a, ...q.wrong].sort(() => r() - 0.5);
    return { i, q: q.q, ders: q.ders, opts, a: q.a, e: q.e };
  };
  HS.FX.examAnswer = (s, v) => {
    const q = HS.QUESTIONS[v.i];
    const ok = v.ans === q.a;
    if (s.exam) {
      s.exam.asked = (s.exam.asked || []).concat(v.i).slice(-40);
      s.exam.qOk = (s.exam.qOk || 0) + (ok ? 1 : 0);
      s.exam.qAll = (s.exam.qAll || 0) + 1;
    }
    HS.FX.prep(s, ok ? 2.5 : 0.8);
    s.mood = clamp(s.mood + (ok ? 2 : -1), 0, 100);
    s.scenes.push(ok ? { t: "Doğru!", p: q.ders + ": " + q.a + ". " + q.e, art: "✓", kind: "win" } : { t: "Yanlış", p: "Doğru cevap: " + q.a + ". " + q.e + " (Yanlışından da öğrendin.)", art: "✕", kind: "lose" });
  };
  HS.ACTIVITIES.push({
    id: "testcoz",
    label: "Test çöz",
    art: "page-facing-up",
    hint: "Gerçek bir YKS sorusu · hazırlık +",
    room: "yatak",
    pick: "quiz",
    when: (s) => active(s),
    fx: (s, ctx, p) => ({ examAnswer: p, stress: 1 }),
    done: "",
  });

  // ---- Olaylar ----
  const examEv = (o) => ({ cooldown: 1, ...o });
  HS.EVENTS.push(
    examEv({
      id: "examApply",
      priority: 86,
      when: (s) => active(s) && !s.exam.applied && s.year === s.exam.year && s.week >= W.applyFrom && s.week <= W.applyTo,
      title: (s) => s.exam.year + " YKS başvuruları açıldı",
      text: "ÖSYM'nin sitesinde başvuru ekranı açık. Sınav ücretini yatırıp başvurunu tamamlaman gerekiyor. Son gün yaklaşırken sistem yavaşlar.",
      choices: (s) => [
        c("Başvur, ücreti yatır", "TYT + AYT ücreti", { cost: 1000, examApplied: 1, m: 2 }),
        c("Bu yıl girmeyeceğim", "Hazırlık bir sonraki yıla kayar.", { examSkip: 1 }),
      ],
    }),
    examEv({
      id: "examQuiz",
      weight: (s) => (active(s) ? 3 : 0),
      room: "yatak",
      title: (s) => "Soru vakti · " + (s.examQ ? s.examQ.ders : ""),
      text: (s) => (s.examQ ? s.examQ.q : ""),
      choices: (s) => (s.examQ ? s.examQ.opts.map((o) => c(o, "", { examAnswer: { i: s.examQ.i, ans: o } })) : [c("Geç", "", {})]),
    }),
    examEv({
      id: "examReminder",
      weight: (s) => (active(s) && s.weeks - s.exam.lastStudy >= 2 ? 2.5 : 0),
      cooldown: 3,
      room: "salon",
      title: (s) => HS.pick(["Annen kapıda", "Takvim yaklaşıyor", "Babanın sorusu"]),
      text: (s) => {
        const left = HS.examWeeksLeft(s);
        return HS.pick(["Annen odaya girdi: \"Kaç gündür kitap açmadın. Sınava " + left + " hafta kaldı, farkında mısın?\"", "Babanın sesi salondan geldi: \"Deneme kaç net oldu? Bu gidişle olmaz.\"", "Telefonda arkadaşın yazdı: \"Ben bu hafta 3 deneme çözdüm, sen ne yaptın?\""]);
      },
      choices: [
        c("Hemen masaya otur, 4 saat çalış", "Hazırlık +, stres +", { prep: 4, stress: 3, m: -1 }),
        c("Bir saat çalış, sonra dinlen", "", { prep: 1.5 }),
        c("\"Yarın başlayacağım\" de", "Hazırlık −", { prep: -1, m: 1, stress: 2 }),
      ],
    }),
    examEv({
      id: "examMock",
      weight: (s) => (active(s) && s.exam.prep > 8 ? 1.4 : 0),
      cooldown: 6,
      weekend: true,
      room: "sokak",
      title: "Deneme sınavı",
      text: "Dershanenin açık denemesi bu hafta sonu. Gerçek sınav gibi 165 dakika.",
      choices: (s) => [
        c("Gir", "₺150 · netini öğrenirsin, hazırlık +", { cost: 150, examMock: 1, stress: 2 }),
        c("Evde kendi denemeni çöz", "Ücretsiz", { examMock: 1 }),
        c("Bu hafta pas geç", "", { m: 1 }),
      ],
    }),
    examEv({
      id: "examDershane",
      weight: (s) => (active(s) && !s.exam.dershane ? 0.9 : 0),
      cooldown: 20,
      title: "Dershane teklifi",
      text: (s) => "Mahalledeki dershane \"son kayıtlar\" diye ilan vermiş. Aylık " + money(9000 * s.idx.cpi) + "; haftada 4 gün ders ve deneme.",
      choices: [
        c("Kaydol", "Aylık ücret · hazırlık her hafta artar", { examDershane: 1, m: 1 }),
        c("Evde kendim çalışırım", "Ücretsiz; disiplin gerekir.", {}),
      ],
    }),
    examEv({
      id: "examSlump",
      weight: (s) => (active(s) && s.stress > 45 ? 1 : 0),
      cooldown: 10,
      room: "yatak",
      title: "Motivasyon dibe vurdu",
      text: "Deneme netlerin aynı yerde sayıyor. \"Ben bu sınavı kazanamayacağım\" düşüncesi kafanda dönüyor.",
      choices: [
        c("Bir gün ara ver, yürüyüşe çık", "Stres −", { stress: -8, m: 3 }),
        c("Çalışma programını baştan yaz", "Hazırlık +", { prep: 2, stress: -2 }),
        c("Rehber öğretmenle konuş", "₺600", { cost: 600, stress: -6, prep: 1 }),
      ],
    }),
    examEv({
      id: "examDay",
      priority: 95,
      weekend: true,
      when: (s) => active(s) && s.exam.applied && s.year === s.exam.year && s.week >= W.exam,
      title: (s) => s.exam.year + " YKS günü",
      text: "Sabah 07:00. Kimlik, kalem, silgi hazır. Sınav binası kalabalık; veliler kapıda bekliyor.",
      choices: [
        c("Dün erken yattım, kahvaltımı yapıp sakince git", "Sakin bir zihin", { examSit: 12 }),
        c("Gece son tekrarları yaptım, uykusuz git", "Bilgi taze ama yorgunsun", { examSit: 4, h: -2 }),
        c("Heyecandan midem bulanıyor, yine de gir", "Stres yüksek", { examSit: -6, stress: 6 }),
      ],
    }),
    examEv({
      id: "examResult",
      priority: 92,
      when: (s) => s.exam && s.exam.phase === "sonuc" && (s.year > s.exam.year || s.week >= W.result),
      title: "YKS sonuçları açıklandı",
      text: (s) => "Sonuç sayfası açıldı. Puanın: " + s.exam.score + " · Sıralaman: " + s.exam.rank.toLocaleString("tr-TR") + ". " + (s.exam.score >= 400 ? "Ailende bayram havası var." : s.exam.score >= 300 ? "Fena değil; tercihleri iyi yapmak gerekiyor." : "Beklediğinden düşük; yine de seçenekler var."),
      choices: [c("Tercih kılavuzunu incele", "", { examPhase: "tercih", m: 2 }), c("Bu yıl tercih yapmayacağım; seneye tekrar gir", "Hazırlık sürer", { examRetry: 1 })],
    }),
    examEv({
      id: "examPref",
      priority: 91,
      when: (s) => s.exam && s.exam.phase === "tercih" && (s.year > s.exam.year || s.week >= W.pref),
      title: "Tercih dönemi",
      text: (s) => "Puanın " + s.exam.score + ". Puanının yettiği ya da biraz üstündeki bölümler aşağıda. Yerleşme şansı, puanının geçen yılın taban puanına uzaklığına bağlı.",
      choices: (s) => {
        const list = HS.PROGRAMS.filter((p) => p.min <= s.exam.score + 25).slice(0, 5);
        return list
          .map((p) => {
            const pr = clamp(0.5 + (s.exam.score - p.min) / 60, 0.05, 0.97);
            return c(p.name + " (" + p.years + " yıl)", "Taban ~" + p.min + " · yerleşme şansı %" + Math.round(pr * 100) + " · " + p.desc, { examPick: p.id });
          })
          .concat([c("Hiçbirini yazma, seneye tekrar dene", "", { examRetry: 1 })]);
      },
    }),
    examEv({
      id: "examPlace",
      priority: 90,
      when: (s) => s.exam && s.exam.phase === "yerlesme" && (s.year > s.exam.year || s.week >= W.place),
      title: "Yerleştirme sonuçları",
      text: (s) => "Tercihin: " + HS.PROGRAMS.find((p) => p.id === s.exam.choice).name + ". Sonuç ekranı yükleniyor...",
      choices: (s) => {
        const p = HS.PROGRAMS.find((x) => x.id === s.exam.choice);
        const pr = clamp(0.5 + (s.exam.score - p.min) / 60, 0.05, 0.97);
        return [
          c("Sonuca bak", "Kayıt ücreti ve kitaplar ₺3.500", {
            chance: { p: pr, win: { examPlaced: p.id, cost: 3500, m: 10 }, lose: { examRetry: 1, m: -8 }, winT: p.name + "'e yerleştin!", winP: "Ekranda adın ve bölümün yazıyor. Annen telefonda ağlıyor; okul eylülde başlıyor.", loseT: "Yerleşemedin", loseP: "Taban puan bu yıl yükselmiş. Bir yıl daha hazırlanabilirsin." },
          }),
        ];
      },
    }),
  );
  // Soru olayı için soruyu seç (olay seçilirken)
  HS.HOOKS.event.push((s, def) => {
    if (def.id === "examQuiz") s.examQ = HS.pickQuestion(s);
  });
  HS.examWeeksLeft = (s) => {
    if (!s.exam) return 0;
    return Math.max(0, (s.exam.year - s.year) * 52 + W.exam - s.week);
  };
  HS.FX.examApplied = (s) => (s.exam.applied = true);
  HS.FX.examSkip = (s) => (s.exam.year = s.year + 1);
  HS.FX.examDershane = (s) => (s.exam.dershane = true);
  HS.FX.examMock = (s) => {
    const net = HS.examNet(s);
    s.exam.mocks.push({ w: s.weeks, net });
    HS.FX.prep(s, 2);
    const prev = s.exam.mocks.length > 1 ? s.exam.mocks[s.exam.mocks.length - 2].net : null;
    s.scenes.push({ t: "Deneme sonucu: " + net + " net", p: "TYT'de 120 sorudan " + net + " net." + (prev != null ? " Bir önceki deneme: " + prev + " net." : "") + " Tahmini puan aralığın " + Math.round(160 + s.exam.prep * 3.4 - 20) + "-" + Math.round(160 + s.exam.prep * 3.4 + 20) + ".", art: "✎", kind: prev != null && net < prev ? "lose" : "win" });
  };
  HS.FX.examSit = (s, bonus) => {
    s.exam.score = HS.examScore(s, bonus);
    s.exam.rank = HS.examRank(s.exam.score);
    s.exam.phase = "sonuc";
    s.scenes.push({ t: "Sınav bitti", p: "Kalemini bıraktın. Sonuçlar temmuzda açıklanacak; takvime not edildi.", art: "✎" });
    HS.note(s, s.exam.year + " YKS'ye girdi.");
  };
  HS.FX.examPhase = (s, v) => (s.exam.phase = v);
  HS.FX.examPick = (s, id) => {
    s.exam.choice = id;
    s.exam.phase = "yerlesme";
  };
  HS.FX.examRetry = (s) => {
    s.exam.phase = "hazirlik";
    s.exam.year = s.year + 1;
    s.exam.applied = false;
    s.exam.prep = Math.max(10, s.exam.prep * 0.8);
  };
  HS.FX.examPlaced = (s, id) => {
    const p = HS.PROGRAMS.find((x) => x.id === id);
    s.exam.phase = "bitti";
    s.exam.placed = id;
    s.major = { id: p.id, name: p.name, years: p.years, field: p.field };
    HS.apply(s, { edu: "ogrenci", noTheme: true });
    HS.note(s, p.name + " bölümüne yerleşti.");
  };
  // Eski tek olaylık sınavı, yeni süreç varken kapat
  const old = HS.EVENTS.find((e) => e.id === "uniExam");
  if (old) {
    const w = old.when;
    old.when = (s) => !s.exam && !s.flags.examPrep && w(s);
  }
})(globalThis.HS || (globalThis.HS = {}));
