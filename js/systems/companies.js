// Şirketler: kurmaca işverenler, sıralama, çok aşamalı mülakat, ikramiye, zam,
// şube tayini, mobbing ve başka şirketten teklif. Tüm şirket adları hayal ürünüdür.
(function (HS) {
  "use strict";
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const r = () => HS.rng();
  const c = (label, hint, fx = {}) => ({ label, hint, fx });

  // stars: çalışan puanı (1-5), mult: maaş çarpanı, stages: mülakat aşaması,
  // mobbing: kötü yönetim riski (0-1), bonus: ikramiye cömertliği (0-1)
  const C = (id, name, sector, stars, mult, stages, mobbing, bonus, jobs, cities, perk) => ({
    id, name, sector, stars, mult, stages, mobbing, bonus, jobs, cities, perk,
  });
  const BIG = ["İstanbul", "Ankara", "İzmir"];
  HS.COMPANIES = [
    C("atlas", "Atlas Yazılım", "Teknoloji", 4.7, 1.75, 4, 0.08, 0.8, ["office"], ["İstanbul", "Ankara", "İzmir", "Berlin", "Amsterdam"], "Esnek çalışma, yurt dışı ofisleri"),
    C("pusula", "Pusula Teknoloji", "Teknoloji", 4.3, 1.5, 3, 0.12, 0.6, ["office"], ["İstanbul", "Ankara", "Eskişehir", "Kocaeli"], "Eğitim bütçesi"),
    C("kuzeyveri", "Kuzey Veri Analitik", "Teknoloji", 3.9, 1.35, 3, 0.18, 0.5, ["office"], ["Ankara", "Trabzon", "İstanbul"], "Hızlı terfi"),
    C("yildizbank", "Yıldız Yatırım Bankası", "Finans", 4.1, 1.6, 4, 0.25, 0.9, ["office"], ["İstanbul", "Ankara", "İzmir", "Bursa", "Antalya", "Londra"], "Yüksek ikramiye, uzun mesai"),
    C("liman", "Liman Katılım Finans", "Finans", 3.6, 1.3, 3, 0.2, 0.6, ["office"], ["İstanbul", "Konya", "Kayseri", "Gaziantep"], "Düzenli mesai"),
    C("egesig", "Ege Sigorta", "Sigorta", 3.4, 1.15, 2, 0.22, 0.4, ["office"], ["İzmir", "Manisa", "Aydın", "Denizli", "Muğla"], "Özel sağlık sigortası"),
    C("kervan", "Kervan Lojistik", "Lojistik", 3.2, 1.1, 2, 0.3, 0.3, ["office", "factory"], ["Kocaeli", "Mersin", "İstanbul", "Ankara", "Samsun"], "Yemek kartı"),
    C("dalga", "Dalga Medya", "Medya", 3.5, 1.2, 3, 0.35, 0.3, ["office", "music"], ["İstanbul", "İzmir"], "Yaratıcı ortam, düzensiz mesai"),
    C("ruzgargulu", "Rüzgârgülü Enerji", "Enerji", 4.4, 1.55, 3, 0.1, 0.7, ["office", "factory"], ["Çanakkale", "Balıkesir", "İzmir", "Ankara", "Hamburg"], "Servis, sağlık sigortası"),
    C("anadolutekstil", "Anadolu Tekstil", "Tekstil", 2.9, 1.05, 1, 0.38, 0.25, ["factory", "office"], ["Denizli", "Kahramanmaraş", "Gaziantep", "Uşak", "Bursa"], "Bayram ikramiyesi"),
    C("marmaraoto", "Marmara Oto Yan Sanayi", "Otomotiv", 3.7, 1.25, 2, 0.2, 0.55, ["factory", "office"], ["Bursa", "Kocaeli", "Sakarya", "Düzce"], "Toplu sözleşme"),
    C("torosgida", "Toros Gıda", "Gıda", 3.3, 1.1, 1, 0.25, 0.4, ["factory", "office"], ["Mersin", "Adana", "Konya", "Hatay", "Osmaniye"], "Ürün indirimi"),
    C("karadenizcay", "Yaylacı Çay İşletmeleri", "Gıda", 3.1, 1.0, 1, 0.22, 0.35, ["factory", "office"], ["Rize", "Trabzon", "Artvin", "Giresun"], "Lojman"),
    C("demlik", "Demlik Kafe Zinciri", "Perakende", 3.8, 1.12, 1, 0.15, 0.3, ["cafe", "office"], ["İstanbul", "Ankara", "İzmir", "Antalya", "Bursa", "Eskişehir", "Berlin"], "Bahşiş havuzu"),
    C("firinkahve", "Fırın & Fincan", "Perakende", 3.0, 1.0, 1, 0.3, 0.2, ["cafe"], ["Konya", "Kayseri", "Samsun", "Trabzon", "Diyarbakır", "Erzurum", "Van"], "Esnek vardiya"),
    C("derman", "Derman Sağlık Grubu", "Sağlık", 3.6, 1.2, 2, 0.32, 0.4, ["nurse", "office"], ["İstanbul", "Ankara", "İzmir", "Bursa", "Adana", "Diyarbakır"], "Nöbet ücreti"),
    C("akasya", "Akasya Tıp Merkezleri", "Sağlık", 4.0, 1.35, 3, 0.18, 0.5, ["nurse"], ["İstanbul", "Antalya", "Muğla", "Londra"], "Yurt içi eğitim"),
    C("bilge", "Bilge Koleji", "Eğitim", 3.9, 1.2, 2, 0.2, 0.3, ["teacher"], ["İstanbul", "Ankara", "İzmir", "Bursa", "Konya", "Kocaeli"], "Çocuğuna indirimli okul"),
    C("pergel", "Pergel Eğitim Kurumları", "Eğitim", 3.2, 1.05, 1, 0.28, 0.2, ["teacher"], ["Gaziantep", "Şanlıurfa", "Malatya", "Elazığ", "Sivas", "Samsun"], "Yaz tatili"),
    C("kentas", "Kent A.Ş. (belediye şirketi)", "Kamu", 3.3, 1.0, 2, 0.25, 0.2, ["memur"], null, "İş güvencesi"),
    C("devletokul", "Devlet okulları (kurmaca bakanlık)", "Kamu", 3.4, 1.0, 1, 0.18, 0.1, ["teacher"], null, "Kadro güvencesi"),
    C("devlethastane", "Devlet hastaneleri (kurmaca)", "Kamu", 3.1, 1.0, 1, 0.3, 0.1, ["nurse"], null, "Kadro güvencesi"),
  ];
  const CO = (id) => HS.COMPANIES.find((x) => x.id === id);
  HS.co = CO;
  // Sıralama puanı: çalışan memnuniyeti ağırlıklı
  HS.coScore = (x) => Math.round(x.stars * 18 + x.mult * 10 - x.mobbing * 20 + x.bonus * 6);
  HS.coRanking = () => HS.COMPANIES.slice().sort((a, b) => HS.coScore(b) - HS.coScore(a));
  // Şirket bu şehirde mi? (kamu her ilde)
  HS.coIn = (x, city) => !x.cities || x.cities.includes(city);

  // Maaş: şirket çarpanı ve kişisel zam
  HS.wageMod = (s, job, co) => {
    const id = co !== undefined ? co : job === s.job ? s.company : null;
    const x = id && CO(id);
    if (!x) return 1;
    return x.mult * (co === undefined ? s.payAdj || 1 : 1);
  };

  function init(s) {
    s.payAdj = s.payAdj || 1;
    s.perf = s.perf ?? 55;
    if (s.job !== "none" && !s.company && !["music", "business", "crime"].includes(s.job)) {
      const opts = HS.COMPANIES.filter((x) => x.jobs.includes(s.job) && HS.coIn(x, s.city));
      if (opts.length) s.company = opts[(s.seed || 0) % opts.length].id;
    }
  }
  HS.HOOKS.newLife.push(init);
  HS.HOOKS.migrate.push(init);

  // Mülakat aşamaları
  const STAGES = {
    1: ["Yönetici mülakatı"],
    2: ["Ön eleme testi", "Yönetici mülakatı"],
    3: ["Ön eleme testi", "Teknik mülakat", "Yönetici mülakatı"],
    4: ["Ön eleme testi", "Vaka çalışması", "Teknik mülakat", "Yönetici mülakatı"],
  };
  HS.coStages = (x) => STAGES[x.stages];
  // Toplam kabul şansı: genel başvuru şansı, şirketin seçiciliği
  HS.coChance = (s, x, job) => clamp(HS.appChance(s, job) * (1.35 - x.stars * 0.13) + (x.stars < 3.3 ? 0.08 : 0), 0.04, 0.95);
  const relevant = (s, job) => (HS.Skills.PRACTICE[job] || []).reduce((a, k) => a + HS.Skills.get(s, k), 0) / Math.max(1, (HS.Skills.PRACTICE[job] || []).length);

  HS.CAN.coApply = (s, v) => {
    const x = CO(v.co);
    if (!x) return "Şirket bulunamadı.";
    if (s.retired) return "Emekli oldun.";
    if (s.company === v.co && s.job === v.job) return "Zaten burada çalışıyorsun.";
    if ((s.apps || []).some((a) => a.co === v.co)) return "Bu şirkete zaten başvurdun.";
    if ((s.apps || []).length >= 3) return "Aynı anda en fazla 3 başvuru.";
    const j = HS.JOBS[v.job];
    if (s.edu === "ogrenci" && !j.student) return "Öğrenciyken yalnızca yarı zamanlı iş.";
    if (j.need) {
      const n = j.need(s);
      if (n !== true) return n;
    }
    if (!HS.coIn(x, s.city) && !v.relocate) return "Bu şirketin " + HS.ek(s.city, "loc") + " şubesi yok.";
    return true;
  };
  HS.FX.coApply = (s, v) => {
    const x = CO(v.co);
    const total = HS.coChance(s, x, v.job);
    s.apps.push({
      job: v.job,
      co: v.co,
      city: HS.coIn(x, s.city) ? s.city : x.cities[0],
      stage: 0,
      p: total,
      sp: Math.pow(total, 1 / x.stages), // her aşamanın temel geçme şansı
      due: s.weeks + 1 + ((r() * 2) | 0),
      from: s.weeks,
    });
  };
  // Aşama sonucu: {co, pass}
  HS.FX.coStage = (s, v) => {
    const a = s.apps.find((x) => x.co === v.co);
    if (!a) return;
    const x = CO(v.co);
    if (!v.pass) {
      s.apps = s.apps.filter((y) => y !== a);
      HS.Skills.add(s, "iletisim", 1);
      return;
    }
    a.stage++;
    if (a.stage >= x.stages) {
      a.offer = true;
      a.due = s.weeks + 1;
    } else a.due = s.weeks + 1 + ((r() * 2) | 0);
  };
  // Teklifi kabul: {co, adj}
  HS.FX.coHire = (s, v) => {
    const a = s.apps.find((x) => x.co === v.co);
    if (!a) return;
    s.apps = s.apps.filter((y) => y !== a);
    if (a.city !== s.city) HS.apply(s, { moveCity: a.city, keepJob: true, relocationPaid: true });
    HS.apply(s, { job: a.job });
    s.company = v.co;
    s.payAdj = v.adj || 1;
    s.perf = 55;
    s.mobbing = 0;
    HS.note(s, CO(v.co).name + " şirketinde " + HS.Skills.title(s) + " olarak başladı.");
    s.scenes.push({ t: "Hoş geldin!", p: CO(v.co).name + " kapılarını açtı. Unvanın: " + HS.Skills.title(s) + ". Aylık net " + HS.money(HS.wage(s)) + ".", art: "✓", kind: "win" });
  };
  HS.FX.coDecline = (s, co) => (s.apps = s.apps.filter((x) => x.co !== co));
  HS.FX.leaveCompany = (s) => {
    s.company = null;
    s.payAdj = 1;
    s.mobbing = 0;
  };
  HS.FX.payAdj = (s, v) => (s.payAdj = clamp((s.payAdj || 1) * v, 0.6, 3));
  HS.FX.perf = (s, v) => (s.perf = clamp((s.perf ?? 55) + v, 0, 100));
  HS.FX.mobbingEnd = (s) => (s.mobbing = 0);
  HS.FX.mobbingStart = (s) => (s.mobbing = 1);

  // İş değişince (başka yerden iş, istifa) şirket bağı kopar
  const prevJob = new WeakMap();
  HS.HOOKS.weekly.push((s) => {
    if (s.job === "none" || ["music", "business", "crime"].includes(s.job)) {
      if (s.company) {
        s.company = null;
        s.payAdj = 1;
      }
    } else if (!s.company) {
      const opts = HS.COMPANIES.filter((x) => x.jobs.includes(s.job) && HS.coIn(x, s.city)).sort((a, b) => a.stars - b.stars);
      if (opts.length) s.company = opts[0].id; // şirketsiz başlanan işler için en mütevazı işveren
    }
    // Performans: becerilerin ve mobbingin etkisi
    if (s.company) {
      const target = 40 + relevant(s, s.job) * 0.6 - (s.mobbing ? 12 : 0) + (HS.outfitFits(s, s.job) ? 4 : 0);
      s.perf = clamp((s.perf ?? 55) + (target - (s.perf ?? 55)) * 0.05 + (r() - 0.5) * 2, 0, 100);
      if (s.mobbing) s.mood = clamp(s.mood - 1.2, 0, 100);
    }
  });
  // İkramiye: yılda iki kez (26. ve 52. hafta), şirkete ve performansa göre
  HS.HOOKS.weekly.push((s) => {
    if (!s.company || (s.week !== 26 && s.week !== 52)) return;
    const x = CO(s.company);
    if (r() > x.bonus * (0.5 + s.perf / 100)) return;
    const amt = HS.wage(s) * (0.4 + x.bonus * 1.2) * (0.5 + s.perf / 100);
    HS.earn(s, "İkramiye", amt);
    s.scenes.push({ t: "İkramiye yattı!", p: x.name + " " + (s.week === 26 ? "yaz" : "yıl sonu") + " ikramiyesi olarak hesabına " + HS.money(amt) + " yatırdı.", art: "★", kind: "win" });
  });
  // Yıllık performans değerlendirmesi ve zam
  HS.HOOKS.yearly.push((s) => {
    if (!s.company) return;
    const raise = s.perf >= 75 ? 0.08 : s.perf >= 55 ? 0.04 : s.perf >= 40 ? 0.01 : 0;
    s.payAdj = clamp((s.payAdj || 1) * (1 + raise), 0.6, 3);
    s.scenes.push({
      t: "Performans değerlendirmesi",
      p: "Yıllık değerlendirmende puanın " + Math.round(s.perf) + "/100. " + (raise ? "Enflasyon zammına ek %" + Math.round(raise * 100) + " liyakat zammı aldın." : "Bu yıl ek zam çıkmadı."),
      art: raise ? "★" : "◒",
      kind: raise ? "win" : null,
    });
  });

  HS.EVENTS.push(
    // ---- Mülakat aşaması ----
    {
      id: "coStage",
      priority: 87,
      cooldown: 0,
      when: (s) => (s.apps || []).some((a) => a.co && !a.offer && s.weeks >= a.due),
      title: (s) => {
        const a = s.apps.find((a) => a.co && !a.offer && s.weeks >= a.due);
        return CO(a.co).name + ": " + HS.coStages(CO(a.co))[a.stage];
      },
      text: (s) => {
        const a = s.apps.find((a) => a.co && !a.offer && s.weeks >= a.due);
        const x = CO(a.co);
        const name = HS.coStages(x)[a.stage];
        const desc = {
          "Ön eleme testi": "Çevrim içi bir test: mantık soruları, kısa bir İngilizce bölümü ve kişilik envanteri. Süre 45 dakika.",
          "Vaka çalışması": "Şirket 48 saat içinde teslim edilecek bir vaka gönderdi: gerçekçi bir iş problemi ve sunum.",
          "Teknik mülakat": "Alanından iki uzman karşında. Sorular derin ve hızlı.",
          "Yönetici mülakatı": "Ekibin yöneticisiyle tanışma: motivasyon, takım uyumu, beklentiler.",
        }[name];
        return desc + " Aşama " + (a.stage + 1) + "/" + x.stages + ".";
      },
      choices: (s) => {
        const a = s.apps.find((a) => a.co && !a.offer && s.weeks >= a.due);
        const x = CO(a.co);
        const name = HS.coStages(x)[a.stage];
        const rel = relevant(s, a.job);
        const eng = HS.Skills.get(s, "ingilizce");
        const base = clamp(a.sp + (rel - 25) * 0.004 + (name === "Ön eleme testi" ? (eng - 30) * 0.003 : 0) + (HS.outfitFits(s, a.job) && name === "Yönetici mülakatı" ? 0.06 : 0), 0.05, 0.95);
        const stage = (p, extra = {}, winT = "Aşamayı geçtin!", loseT = "Elendin") => ({
          ...extra,
          chance: {
            p: clamp(p, 0.03, 0.97),
            win: { coStage: { co: a.co, pass: true } },
            lose: { coStage: { co: a.co, pass: false }, m: -3 },
            winT,
            winP: a.stage + 1 >= x.stages ? "Son aşamayı da geçtin. Teklif yolda." : "Bir sonraki aşama için davet geldi.",
            loseT,
            loseP: "Bu süreç burada bitti. Deneyim yine de becerilerine eklendi.",
          },
        });
        if (name === "Vaka çalışması")
          return [
            c("Hafta sonunu vakaya ver", "Bir boş zaman harcar; şans artar.", stage(base + 0.15, { useFree: 1, sk: { sunum: 1 } })),
            c("Kısaca hazırla", "Zamanını koru.", stage(base)),
          ];
        return [
          c("İyi hazırlan", "Şirketi araştır, örnek soruları çalış.", stage(base + 0.07, { sk: { iletisim: 0.5 } })),
          c("Olduğun gibi git", "Rahat ol.", stage(base)),
          name === "Yönetici mülakatı" ? c("Maaş beklentini yüksek söyle", "Geçersen daha yüksek teklif; risk de artar.", stage(base - 0.08, { flag: "highAsk" })) : null,
        ];
      },
    },
    // ---- Teklif ----
    {
      id: "coOffer",
      priority: 88,
      cooldown: 0,
      when: (s) => (s.apps || []).some((a) => a.offer && s.weeks >= a.due),
      title: (s) => CO(s.apps.find((a) => a.offer).co).name + " teklif yaptı",
      text: (s) => {
        const a = s.apps.find((a) => a.offer);
        const x = CO(a.co);
        const lvl = s.edu === "universite" && ["office", "teacher", "nurse"].includes(a.job) ? 1 : 0;
        const w = HS.wage(s, a.job, lvl, a.co) * (s.flags.highAsk ? 1.1 : 1);
        return (
          HS.Skills.title(s, a.job, lvl) + " pozisyonu için aylık net " + HS.money(w) + " teklif ediliyor" +
          (a.city !== s.city ? " (" + a.city + " şubesi; taşınma masrafını şirket karşılıyor)" : "") +
          ". Yan haklar: " + x.perk.toLocaleLowerCase("tr-TR") + "."
        );
      },
      choices: (s) => {
        const a = s.apps.find((a) => a.offer);
        const adj = s.flags.highAsk ? 1.1 : 1;
        return [
          c("Kabul et", s.job !== "none" ? "Mevcut işinden ayrılırsın." : "Yeni işine başla.", { coHire: { co: a.co, adj }, flag: "highAskUsed" }),
          c("Pazarlık et", "%60 ihtimalle %8 daha fazla; aksi hâlde teklif geri çekilebilir.", {
            chance: {
              p: 0.6,
              win: { coHire: { co: a.co, adj: adj * 1.08 } },
              lose: { coDecline: a.co, m: -4 },
              winT: "Pazarlık tuttu",
              winP: "İK, %8 daha yüksek bir rakamla döndü.",
              loseT: "Teklif geri çekildi",
              loseP: "İK, bütçelerinin bu rakama yetmediğini söyleyip başka adaya geçti.",
            },
          }),
          c("Reddet", "Başka kapılar da var.", { coDecline: a.co }),
        ];
      },
    },
    // ---- Şube tayini ----
    {
      id: "coTransfer",
      weight: (s) => (s.company && CO(s.company).cities && CO(s.company).cities.length > 1 ? 0.7 : 0),
      cooldown: 156,
      minAge: 22,
      maxAge: 58,
      title: "Şube tayini teklifi",
      text: (s) => {
        const x = CO(s.company);
        const to = x.cities.filter((k) => k !== s.city)[(s.weeks + s.seed) % (x.cities.length - 1)];
        return x.name + " seni " + HS.ek(to, "gen") + " şubesine göndermek istiyor. %15 zam ve taşınma masrafları şirketten. Ama tanıdık sokakları, belki de sevdiklerini geride bırakacaksın.";
      },
      choices: (s) => {
        const x = CO(s.company);
        const to = x.cities.filter((k) => k !== s.city)[(s.weeks + s.seed) % (x.cities.length - 1)];
        const abroad = HS.CITIES[to] && !HS.CITIES[to].tr;
        return [
          c(HS.ek(to, "dat") + " git", abroad ? "Şirket vize sürecini hızlandırır." : "Yeni şehir, yeni ofis.", { moveCity: to, keepJob: true, relocationPaid: true, payAdj: 1.15, people: -4, perf: 5, theme: "journey", emigrateCo: abroad ? to : undefined }),
          c("Kalmak istiyorum", "Kariyerinde küçük bir iz bırakabilir.", { perf: -6, m: 1 }),
        ];
      },
    },
    // ---- Mobbing ----
    {
      id: "mobbing",
      weight: (s) => (s.company && !s.mobbing ? CO(s.company).mobbing * 2.5 : 0),
      cooldown: 52,
      title: "Yöneticinin baskısı",
      text: "Yeni yöneticin seni toplantılarda herkesin önünde küçümsüyor, işlerini başkasına veriyor, mesai sonrası mesaj atıyor. Bu durum haftalardır sürüyor.",
      choices: [
        c("İK'ya resmî şikâyet", "Şirket kültürüne göre sonuç değişir.", (s) => ({
          chance: {
            p: clamp(1 - CO(s.company).mobbing * 1.4, 0.2, 0.85),
            win: { mobbingEnd: 1, m: 5 },
            lose: { mobbingStart: 1, perf: -10, m: -6 },
            winT: "Şikâyetin ciddiye alındı",
            winP: "Yönetici uyarıldı ve başka bir ekibe alındı.",
            loseT: "Dosya kapatıldı",
            loseP: "İK \"iletişim sorunu\" deyip geçti. Ortam daha da gerildi.",
          },
        })),
        c("Sessiz kal", "Her hafta biraz daha yıpranırsın.", { mobbingStart: 1, m: -5 }),
        c("Avukata git", "Masraflı; tazminat kazanabilirsin.", (s) => ({
          cost: 25000,
          chance: {
            p: 0.45,
            win: { cash: (HS.wage(s) * 6) / s.idx.cpi, job: "none", leaveCompany: 1, m: 6 },
            lose: { mobbingStart: 1, m: -8 },
            winT: "Tazminat kazandın",
            winP: "Mahkeme mobbingi kabul etti; altı maaş tutarında tazminat aldın ve işten ayrıldın.",
            loseT: "Dava sürüncemede",
            loseP: "Delil yetersiz bulundu. İşe dönmek zorundasın.",
          },
        })),
        c("İstifa et", "Huzur her şeyden önemli.", { job: "none", leaveCompany: 1, m: 4 }),
      ],
    },
    {
      id: "mobbingCont",
      weight: (s) => (s.mobbing ? 3 : 0),
      cooldown: 12,
      title: "Bitmeyen gerginlik",
      text: "Pazartesi sabahı mide ağrısıyla uyandın. İşe gitmek her hafta daha zor.",
      choices: [
        c("Psikolojik destek al", "Seans başı ücret.", { cost: 2500, m: 6, h: 2 }),
        c("İstifa et", "Kapıyı arkandan kapat.", { job: "none", leaveCompany: 1, m: 6 }),
        c("Dayan", "Biraz daha.", { m: -4, h: -2 }),
      ],
    },
    // ---- Başka şirketten teklif (avcı) ----
    {
      id: "headhunter",
      weight: (s) => (s.company && s.perf >= 65 ? 1 : 0),
      cooldown: 104,
      title: "Bir insan kaynakları avcısı aradı",
      text: (s) => {
        const x = better(s);
        return x ? x.name + " (" + x.stars.toFixed(1) + "★) için seninle görüşmek istiyorlar. Maaş beklentin şimdikinden yüksek olabilir." : "";
      },
      when: (s) => !!better(s),
      choices: (s) => {
        const x = better(s);
        return [c("Sürece gir", "Mülakatlar yine de zorlu.", { coApply: { co: x.id, job: s.job, relocate: true } }), c("Şimdilik ilgilenmiyorum", "Bulunduğun yerde kal.", { perf: 2 })];
      },
    },
    {
      id: "overtime",
      weight: (s) => (s.company ? 1.2 : 0),
      cooldown: 20,
      title: "Hafta sonu mesaisi",
      text: "Proje gecikmiş; yönetici herkesten cumartesi gelmesini istiyor. Fazla mesai ücreti ödenecek.",
      choices: [
        c("Gel", "Ek ücret, performans +", (s) => ({ cash: (HS.wage(s) * 0.12) / s.idx.cpi, perf: 4, h: -2, m: -2 })),
        c("Mazeret bildir", "Hafta sonu senin.", { perf: -3, m: 2 }),
      ],
    },
    {
      id: "teamDinner",
      weight: (s) => (s.company ? 0.8 : 0),
      cooldown: 52,
      title: "Ekip yemeği",
      text: "Çeyrek hedefleri tuttu; şirket ekibi akşam yemeğine çıkarıyor.",
      choices: [
        c("Katıl, kaynaş", "Çevre ve performans +", { people: 2, perf: 2, m: 3 }),
        c("Erken ayrıl", "Evde dinlen.", { h: 1 }),
      ],
    },
  );
  function better(s) {
    if (!s.company) return null;
    const cur = CO(s.company);
    return HS.coRanking().find((x) => x.jobs.includes(s.job) && HS.coScore(x) > HS.coScore(cur) + 5 && !(s.apps || []).some((a) => a.co === x.id) && x.cities);
  }
})(globalThis.HS || (globalThis.HS = {}));

// Şirket tanıtımları (tamamı kurmacadır): ne iş yapar, kuruluş, çalışan sayısı, artılar, eksiler.
(function (HS) {
  "use strict";
  const I = (about, founded, staff, pros, cons) => ({ about, founded, staff, pros, cons });
  HS.CO_INFO = {
    atlas: I("Bankalar ve e-ticaret siteleri için ödeme ve mobil uygulama yazılımları geliştirir. Avrupa'daki müşterileri için Berlin ve Amsterdam'da ofisleri var.", 2009, "1.800", ["Sektörün en yüksek maaşları", "Haftada 2 gün evden çalışma", "Yurt dışı ofislere tayin imkânı", "Yıllık eğitim ve konferans bütçesi"], ["Dört aşamalı, çok zor mülakat (vaka çalışması dahil)", "Teslim haftalarında gece yarısına kadar mesai", "Performans düşükse hızlı ayrılık"]),
    pusula: I("Okullar ve belediyeler için eğitim ve şehir yönetimi yazılımları yapar.", 2012, "650", ["Kişi başı yıllık eğitim bütçesi", "Sakin, öğretici ekipler", "Esnek giriş saatleri"], ["Maaş artışları piyasanın biraz gerisinde", "Kamu ihalelerine bağlı dönemsel belirsizlik"]),
    kuzeyveri: I("Perakende ve lojistik şirketlerine veri analizi ve raporlama hizmeti verir.", 2016, "240", ["Hızlı terfi; genç ekip", "Uzaktan çalışmaya açık", "Sorumluluk erken verilir"], ["Küçük şirket, iş güvencesi zayıf", "Müşteri baskısı yüzünden stres yüksek", "Yan haklar az"]),
    yildizbank: I("Kurumsal krediler, yatırım danışmanlığı ve hazine işlemleri yapan bir yatırım bankası. Londra'da şubesi var.", 1988, "4.200", ["Yüksek yıl sonu ikramiyesi", "Prestijli; özgeçmişte çok güçlü durur", "Londra şubesine tayin imkânı"], ["Haftada 55-60 saate varan mesai", "Mobbing şikâyetleri sık", "Dört aşamalı mülakat ve vaka sunumu"]),
    liman: I("Faizsiz bankacılık ilkeleriyle çalışan, Anadolu'da yaygın bir katılım finans kuruluşu.", 1994, "2.900", ["Düzenli mesai, 18:00'de çıkış", "Anadolu şehirlerinde çok şube", "Düşük ama istikrarlı zamlar"], ["Kariyer basamakları yavaş", "Yenilikçi projeler az"]),
    egesig: I("Ege bölgesinde araç, konut ve sağlık sigortası satan bölgesel bir sigorta şirketi.", 1997, "900", ["Çalışana ve ailesine özel sağlık sigortası", "Ege şehirlerinde yaşam", "İki aşamalı kolay mülakat"], ["Prim hedefleri baskılı", "Maaşlar ortalama", "Büyük şehirlere tayin yok"]),
    kervan: I("Limanlar ve sanayi bölgeleri arasında tır, depo ve gümrük hizmeti veren lojistik firması.", 2001, "3.500", ["Yemek kartı ve servis", "Hem ofis hem depo pozisyonları", "Mülakat hızlı"], ["Gece ve hafta sonu sevkiyatları", "Depoda iş kazası riski", "Mobbing şikâyetleri ortalamanın üstünde"]),
    dalga: I("Dijital yayın, podcast ve reklam filmleri üreten bir medya ajansı; müzisyenlerle de çalışır.", 2014, "320", ["Yaratıcı ve genç ortam", "Müzisyenlere sahne ve kayıt fırsatı", "Kıyafet serbest"], ["Düzensiz, son dakika mesaileri", "Yöneticiler sert olabiliyor", "Maaş ödemeleri bazen gecikir"]),
    ruzgargulu: I("Ege ve Marmara'da rüzgâr ve güneş santralleri kurup işleten yenilenebilir enerji şirketi. Hamburg'da mühendislik ofisi var.", 2008, "1.400", ["Servis ve özel sağlık sigortası", "Geleceği parlak bir sektör", "Saha ve ofis pozisyonları", "Mobbing oranı çok düşük"], ["Santraller şehir dışında; uzun yol", "Üç aşamalı teknik mülakat"]),
    anadolutekstil: I("İplik, kumaş ve hazır giyim üreten, ihracata çalışan köklü bir tekstil fabrikası.", 1979, "5.600", ["İş bulmak kolay; tek aşamalı mülakat", "Bayram ikramiyesi", "Vardiya primi"], ["Düşük maaş", "Sert ustabaşılar, mobbing riski yüksek", "Siparişe göre fazla mesai"]),
    marmaraoto: I("Otomobil fabrikalarına koltuk, kablo ve fren parçası üreten yan sanayi şirketi.", 1985, "4.100", ["Sendikalı; toplu sözleşmeyle düzenli zam", "Vardiya ve yemek", "Teknik beceri kazandırır"], ["Gürültülü, yorucu bant işi", "Vardiya düzeni sağlığı zorlar"]),
    torosgida: I("Makarna, salça ve konserve üreten gıda şirketi; Akdeniz ve İç Anadolu'da fabrikaları var.", 1972, "2.700", ["Ürün indirimi", "Mevsimlik ek iş fırsatları", "Tek aşamalı mülakat"], ["Hasat döneminde yoğun mesai", "Maaşlar ortalamanın altında"]),
    karadenizcay: I("Doğu Karadeniz'de çay toplama, işleme ve paketleme yapan bölgesel üretici.", 1968, "1.900", ["Lojman", "Doğa içinde huzurlu yaşam", "Samimi, aile gibi ortam"], ["Mevsimsel iş yükü", "Maaşlar düşük", "Büyük şehirlere uzak"]),
    demlik: I("Türkiye'nin büyük şehirlerinde ve Berlin'de 140 şubesi olan kahve zinciri.", 2011, "3.300", ["Bahşiş havuzu", "Şube müdürlüğüne hızlı yükselme", "Berlin şubesine tayin imkânı"], ["Ayakta, yoğun vardiyalar", "Hafta sonları çalışma", "Maaş tabanı düşük"]),
    firinkahve: I("Anadolu şehirlerinde fırın-kafe konseptiyle büyüyen yerel bir zincir.", 2015, "800", ["Esnek vardiya; öğrenciye uygun", "Kolay işe giriş"], ["Düşük maaş", "Kariyer basamağı az", "Mobbing şikâyetleri orta düzeyde"]),
    derman: I("Altı ilde özel hastaneleri olan bir sağlık grubu.", 1999, "6.800", ["Nöbet ücreti", "Çok şehirde pozisyon", "Mesleki deneyim"], ["Ağır nöbetler", "Hasta yoğunluğu ve stres", "Mobbing riski yüksek"]),
    akasya: I("Turistik bölgelerde ve Londra'da yabancı hastalara hizmet veren tıp merkezleri.", 2006, "1.200", ["Yüksek maaş", "Yabancı dil gelişir", "Yurt içi ve yurt dışı eğitim"], ["Üç aşamalı zor mülakat", "İngilizce şart gibi", "Turizm sezonunda yoğunluk"]),
    bilge: I("Okul öncesinden liseye kadar eğitim veren özel kolejler zinciri.", 1995, "2.100", ["Çocuğuna indirimli okul", "Modern okullar, küçük sınıflar", "Mesleki eğitimler"], ["Veli baskısı", "Ders dışı etkinlik ve nöbet yükü", "Sözleşmeler yıllık"]),
    pergel: I("Güneydoğu ve İç Anadolu'da dershane ve etüt merkezleri işleten eğitim kurumu.", 2003, "900", ["Uzun yaz tatili", "Kolay işe giriş"], ["Düşük maaş", "Hafta sonu dersleri", "İş güvencesi zayıf"]),
    kentas: I("Kurmaca bir belediye şirketi: park bahçe, ulaşım ve sosyal tesis hizmetleri.", 1990, "8.000", ["İş güvencesi", "Her ilde kadro", "Düzenli mesai"], ["Maaş düşük, zam yavaş", "Torpil dedikodusu bol", "Kariyer basamakları kısıtlı"]),
    devletokul: I("Kurmaca bakanlığa bağlı devlet okulları; atamayla öğretmen alır.", 1924, "1.000.000+", ["Kadro güvencesi", "Her ilde çalışma imkânı", "Uzun tatiller"], ["Kalabalık sınıflar", "İlk atamada istemediğin bir şehre gidebilirsin", "Maaş sabit"]),
    devlethastane: I("Kurmaca sağlık bakanlığına bağlı devlet hastaneleri.", 1923, "500.000+", ["Kadro güvencesi", "Her ilde çalışma", "Emeklilik garantisi"], ["Yoğun nöbetler ve hasta sayısı", "Mobbing ve şiddet riski", "Ek ödeme sınırlı"]),
  };
})(globalThis.HS || (globalThis.HS = {}));
