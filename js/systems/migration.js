// Göç ve vize süreci. Aşamalar:
//   evrak → randevu bekleme → konsolosluk mülakatı → değerlendirme → onay/ret → taşınma
// Her evrak para ve zaman ister; bazıları (iş teklifi, dil sertifikası) şansa bağlıdır.
// Sonuç hiçbir zaman kesin değildir. Ret hâlinde harçlar geri gelmez; 26 hafta sonra yeniden başvurulabilir.
(function (HS) {
  "use strict";
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const r = () => HS.rng();
  const c = (label, hint, fx = {}) => ({ label, hint, fx });
  const tl = (s, n) => n * s.idx.cpi;
  const C = () => HS.COSTS;
  const cur = (co, n) => n * HS.FX_RATES[co.cur];

  // Evraklar: cost (2026 TL), weeks (hazırlanma süresi), need(s, co) → true|metin
  HS.VISA_DOCS = [
    { id: "pasaport", name: "Pasaport", weeks: 0, cost: 0, need: (s) => (s.assets.passport ? true : "Önce pasaport çıkar (ŞEHİR sekmesi).") },
    { id: "diploma", name: "Diploma tercümesi ve noter onayı", weeks: 2, cost: () => C().translationPage * 4 + C().notary, need: () => true },
    { id: "sicil", name: "Adli sicil kaydı (apostilli)", weeks: 1, cost: () => C().notary },
    { id: "sigorta", name: "Sağlık/seyahat sigortası", weeks: 1, cost: () => C().travelInsurance },
    { id: "finans", name: "Banka dökümü / bloke hesap", weeks: 2, cost: () => 0, fundsCheck: true },
    { id: "dil", name: "Dil sertifikası sınavı", weeks: 3, cost: () => 8500, chance: true },
    { id: "teklif", name: "Yurt dışından iş teklifi", weeks: 4, cost: () => 0, chance: true },
  ];

  function init(s) {
    s.visa = s.visa || null;
    s.visited = s.visited || { tr: [], world: [] };
    const pl = HS.CITIES[s.city] && HS.CITIES[s.city].plaka;
    if (pl && !s.visited.tr.includes(pl)) s.visited.tr.push(pl);
  }
  HS.HOOKS.newLife.push(init);
  HS.HOOKS.migrate.push(init);

  const country = (s) => s.visa && HS.COUNTRIES[s.visa.country];
  HS.visaCountry = country;
  // Onay ihtimali: ülke tabanı + dil + beceri + iş teklifi + diploma − sicil − önceki retler
  function approval(s) {
    const v = s.visa,
      co = country(s);
    const lang = HS.Skills.get(s, co.lang);
    let p = co.approve + (lang - co.langMin) * 0.006 + (s.edu === "universite" ? 0.08 : -0.06) + (v.offerStrong ? 0.08 : 0) + Math.min(0.06, s.skill * 0.002);
    if (s.riskEver > 0) p -= 0.25;
    p -= (v.tries || 0) * 0.04;
    if (v.sponsor) p = Math.max(p, 0.88);
    return clamp(p, 0.05, 0.95);
  }
  HS.visaApproval = approval;
  HS.visaDocsReady = (s) => s.visa && HS.VISA_DOCS.every((d) => s.visa.docs[d.id] === "hazir");

  // ---- etkiler ----
  HS.CAN.visaStart = (s, k) => {
    if (s.visa && !["red"].includes(s.visa.stage)) return "Zaten açık bir göç dosyan var.";
    if (s.visa && s.visa.stage === "red" && s.weeks < s.visa.retryAt) return "Ret sonrası " + (s.visa.retryAt - s.weeks) + " hafta beklemelisin.";
    if (s.abroad && HS.CITIES[s.city].region === "abroad") return "Zaten yurt dışındasın.";
    return true;
  };
  HS.FX.visaStart = (s, k) => {
    const tries = s.visa && s.visa.country === k ? (s.visa.tries || 0) : 0;
    s.visa = { country: k, stage: "evrak", docs: {}, ready: {}, tries, fees: 0 };
    if (s.assets.passport) s.visa.docs.pasaport = "hazir";
    HS.note(s, k + " için göç dosyası açtı.");
  };
  HS.FX.visaCancel = (s) => {
    if (s.visa && s.visa.blocked) s.cash += s.visa.blocked;
    s.visa = null;
  };
  // Evrak hazırlama: boş zaman + para
  HS.CAN.visaDoc = (s, id) => {
    const v = s.visa;
    if (!v || v.stage !== "evrak") return "Önce bir göç dosyası aç.";
    const d = HS.VISA_DOCS.find((x) => x.id === id);
    if (v.docs[id] === "hazir") return "Bu evrak hazır.";
    if (v.docs[id] === "hazirlaniyor") return (v.ready[id] - s.weeks) + " hafta sonra hazır.";
    if (d.need) {
      const n = d.need(s);
      if (n !== true) return n;
    }
    if ((s.free || 0) < 1) return "Bu hafta boş zamanın kalmadı.";
    const cost = tl(s, typeof d.cost === "function" ? d.cost() : d.cost);
    if (HS.fundsOf(s) < cost) return HS.short(s, cost);
    if (d.fundsCheck) {
      const need = cur(country(s), country(s).funds);
      if (s.cash + s.savings < need) return "Hesabında en az " + HS.money(need) + " görünmeli.";
    }
    return true;
  };
  HS.FX.visaDoc = (s, id) => {
    const v = s.visa,
      co = country(s),
      d = HS.VISA_DOCS.find((x) => x.id === id);
    s.free--;
    const cost = tl(s, typeof d.cost === "function" ? d.cost() : d.cost);
    if (cost) HS.book(s, d.name, cost);
    v.fees += cost;
    if (d.fundsCheck && co.cur === "EUR" && v.country === "Almanya") {
      // Almanya: bloke hesaba para kilitlenir; varışta geri açılır
      const need = cur(co, co.funds);
      const fromCash = Math.min(s.cash, need);
      s.cash -= fromCash;
      s.savings -= need - fromCash;
      v.blocked = need;
    }
    if (id === "dil") {
      const lang = HS.Skills.get(s, co.lang);
      const p = clamp(0.25 + (lang - co.langMin) * 0.025, 0.05, 0.95);
      v.docs[id] = "hazirlaniyor";
      v.ready[id] = s.weeks + d.weeks;
      v.pending = v.pending || {};
      v.pending[id] = p;
      return;
    }
    if (id === "teklif") {
      const lang = HS.Skills.get(s, co.lang);
      const p = clamp(0.12 + (lang - 30) * 0.006 + s.skill * 0.004 + (s.edu === "universite" ? 0.1 : 0) + (s.jobLevel || 0) * 0.04, 0.03, 0.8);
      v.docs[id] = "hazirlaniyor";
      v.ready[id] = s.weeks + d.weeks;
      v.pending = v.pending || {};
      v.pending[id] = p;
      return;
    }
    v.docs[id] = d.weeks ? "hazirlaniyor" : "hazir";
    v.ready[id] = s.weeks + d.weeks;
  };
  HS.CAN.visaAppt = (s) => (!s.visa || s.visa.stage !== "evrak" ? "Dosya bu aşamada değil." : !HS.visaDocsReady(s) ? "Önce bütün evrakları hazırla." : HS.fundsOf(s) < tl(s, C().agencyEUR * HS.FX_RATES.EUR) ? HS.short(s, tl(s, C().agencyEUR * HS.FX_RATES.EUR)) : true);
  HS.FX.visaAppt = (s) => {
    const fee = C().agencyEUR * HS.FX_RATES.EUR * s.idx.cpi;
    HS.book(s, "Vize randevu hizmet bedeli", fee);
    s.visa.fees += fee;
    s.visa.stage = "randevu";
    s.visa.apptAt = s.weeks + 2 + ((r() * 9) | 0); // randevu yoğunluğu: 2-10 hafta
  };
  HS.FX.visaInterview = (s, bonus) => {
    const co = country(s);
    const fee = cur(co, co.fee) * s.idx.cpi;
    HS.book(s, "Vize harcı", fee);
    s.visa.fees += fee;
    s.visa.bonus = (s.visa.bonus || 0) + bonus;
    s.visa.stage = "degerlendirme";
    s.visa.decideAt = s.weeks + 2 + ((r() * 7) | 0);
  };
  HS.FX.visaDecide = (s) => {
    const v = s.visa,
      co = country(s);
    const lotteryOk = co.lottery && !v.sponsor ? r() < co.lottery : true;
    const p = clamp(approval(s) + (v.bonus || 0), 0.03, 0.97);
    const ok = lotteryOk && r() < p;
    if (ok) {
      v.stage = "onay";
      v.deadline = s.weeks + 26;
      HS.note(s, v.country + " vizesi onaylandı.");
      s.scenes.push({ t: "Vize onaylandı!", p: "Pasaportuna vize etiketi yapıştırıldı. 26 hafta içinde " + HS.ek(co.city, "dat") + " taşınmalısın. Bilet, çıkış harcı, ilk kira ve depozito seni bekliyor.", art: "✓", kind: "win", odds: Math.round(p * (co.lottery && !v.sponsor ? co.lottery : 1) * 100) });
    } else {
      v.stage = "red";
      v.tries = (v.tries || 0) + 1;
      v.retryAt = s.weeks + 26;
      if (v.blocked) {
        s.cash += v.blocked;
        v.blocked = 0;
      }
      s.mood = clamp(s.mood - 8, 0, 100);
      s.scenes.push({
        t: lotteryOk ? "Vize reddedildi" : "Kurada çıkmadın",
        p: lotteryOk
          ? "Konsolosluk \"başvuru sahibinin geri dönüş niyeti ve mesleki yeterliliği yeterince kanıtlanamamıştır\" gerekçesiyle başvuruyu reddetti. Ödenen " + HS.money(v.fees) + " geri gelmiyor. 26 hafta sonra yeniden deneyebilirsin."
          : "Bu yılki çalışma vizesi kurasında adın çıkmadı. Harçlar geri gelmiyor. Gelecek yıl yeniden deneyebilirsin.",
        art: "✕",
        kind: "lose",
        odds: Math.round(p * (co.lottery && !v.sponsor ? co.lottery : 1) * 100),
      });
    }
  };
  // Taşınma maliyeti: bilet + çıkış harcı + ilk kira + depozito (2 ay)
  HS.emigrateCost = (s, k) => {
    const co = HS.COUNTRIES[k];
    const flight = C()["flight" + co.flight];
    const rent = HS.CITIES[co.city].rent;
    return { flight: tl(s, flight), exit: tl(s, C().exitFee), rent: rent * s.idx.housing, deposit: rent * 2 * s.idx.housing, total: tl(s, flight + C().exitFee) + rent * 3 * s.idx.housing };
  };
  HS.CAN.visaMove = (s) => {
    if (!s.visa || s.visa.stage !== "onay") return "Onaylı vizen yok.";
    const k = HS.emigrateCost(s, s.visa.country);
    return s.cash + (s.visa.blocked || 0) < k.total ? "Taşınmak için " + HS.money(k.total) + " gerekiyor." : true;
  };
  HS.FX.visaMove = (s) => {
    const v = s.visa,
      co = country(s),
      k = HS.emigrateCost(s, v.country);
    if (v.blocked) {
      s.cash += v.blocked;
      v.blocked = 0;
    }
    HS.book(s, "Uçak bileti", k.flight);
    HS.book(s, "Yurt dışı çıkış harcı", k.exit);
    HS.book(s, "İlk kira ve depozito", k.rent + k.deposit);
    const offer = v.offerJob;
    const keep = v.sponsor;
    if (HS.houseToProp) HS.houseToProp(s);
    HS.apply(s, { emigrate: co.city, keepJob: keep });
    if (!keep && offer) HS.apply(s, { job: offer, level: 0 });
    s.housing = s.housing === "ev" ? "kira" : s.housing === "aile" ? "kira-paylasim" : s.housing;
    if (!s.visited.world.includes(v.country)) s.visited.world.push(v.country);
    s.visa = null;
  };

  // Haftalık: hazırlanan evraklar, randevu, değerlendirme
  HS.HOOKS.weekly.push((s) => {
    const v = s.visa;
    if (!v) return;
    for (const d of HS.VISA_DOCS) {
      if (v.docs[d.id] === "hazirlaniyor" && s.weeks >= v.ready[d.id]) {
        if (v.pending && v.pending[d.id] != null) {
          const ok = r() < v.pending[d.id];
          const p = v.pending[d.id];
          delete v.pending[d.id];
          if (ok) {
            v.docs[d.id] = "hazir";
            if (d.id === "teklif") {
              v.offerJob = s.edu === "universite" ? (s.job === "nurse" ? "nurse" : "office") : s.job !== "none" && HS.JOBS[s.job].pay ? s.job : "cafe";
              v.offerStrong = s.edu === "universite";
            }
            s.scenes.push({ t: d.id === "teklif" ? "Yurt dışından iş teklifi!" : "Dil sınavını geçtin", p: d.id === "teklif" ? HS.COUNTRIES[v.country].city + " merkezli bir şirket " + HS.JOBS[v.offerJob].name.toLocaleLowerCase("tr-TR") + " pozisyonu için sözleşme gönderdi." : "Sertifikan geldi; dosyana eklendi.", art: "✓", kind: "win", odds: Math.round(p * 100) });
          } else {
            delete v.docs[d.id];
            s.scenes.push({ t: d.id === "teklif" ? "Yurt dışı başvurular sonuçsuz" : "Dil sınavından kaldın", p: d.id === "teklif" ? "Gönderdiğin başvurulara ya yanıt gelmedi ya da \"başka adayla devam ediyoruz\" dendi. Dili ve becerilerini geliştirip yeniden dene." : "Puanın yetmedi. Kursa devam edip yeniden girebilirsin.", art: "✕", kind: "lose", odds: Math.round(p * 100) });
          }
        } else v.docs[d.id] = "hazir";
      }
    }
    if (v.stage === "onay" && s.weeks > v.deadline) {
      s.scenes.push({ t: "Vizenin süresi doldu", p: "Taşınmadığın için vize geçersiz oldu. Göç dosyası kapandı.", art: "✕", kind: "lose" });
      HS.FX.visaCancel(s);
    }
  });

  HS.EVENTS.push(
    {
      id: "visaInterview",
      priority: 84,
      cooldown: 0,
      when: (s) => s.visa && s.visa.stage === "randevu" && s.weeks >= s.visa.apptAt,
      title: (s) => s.visa.country + " konsolosluğunda mülakat",
      text: (s) => {
        const co = country(s);
        return "Sabah 7'de kuyruktasın. Görevli dosyanı inceliyor: " + co.visa + ". Vize harcı " + HS.money(cur(co, co.fee) * s.idx.cpi) + " bugün ödenecek. Tahmini onay ihtimalin %" + Math.round(approval(s) * (co.lottery && !s.visa.sponsor ? co.lottery : 1) * 100) + (co.lottery && !s.visa.sponsor ? " (kura dahil)" : "") + ".";
      },
      choices: (s) => {
        const co = country(s);
        const lang = HS.Skills.get(s, co.lang);
        return [
          c("Görüşmeyi " + HS.SKILLS[co.lang].name.toLocaleLowerCase("tr-TR") + " yap", lang >= co.langMin ? "Dilin yeterli; artı puan." : "Dilin zayıf; risk.", { visaInterview: lang >= co.langMin ? 0.06 : -0.08 }),
          c("Tercüman iste, kısa cevaplar ver", "Güvenli ama etkisiz.", { visaInterview: 0 }),
          c("Geri dönüş planını uzun uzun anlat", "Bazen işe yarar, bazen şüphe uyandırır.", { visaInterview: r() < 0.5 ? 0.05 : -0.05 }),
        ];
      },
    },
    {
      id: "visaDecision",
      priority: 84,
      cooldown: 0,
      when: (s) => s.visa && s.visa.stage === "degerlendirme" && s.weeks >= s.visa.decideAt,
      title: "Kargodan bir zarf",
      text: (s) => "Pasaportun aracı kurumdan döndü. Zarfı açmadan önce bir an duraksadın. " + s.visa.country + " başvurunun sonucu içeride.",
      choices: [c("Zarfı aç", "Kalbin hızlı atıyor.", { visaDecide: 1 })],
    },
    {
      id: "visaRemind",
      weight: (s) => (s.visa && s.visa.stage === "onay" ? 4 : 0),
      cooldown: 8,
      title: "Valizler hazırlanıyor mu?",
      text: (s) => "Vizen onaylı; " + Math.max(0, s.visa.deadline - s.weeks) + " hafta içinde taşınmalısın. Taşınma toplamı yaklaşık " + HS.money(HS.emigrateCost(s, s.visa.country).total) + ".",
      choices: (s) => [c("Şimdi taşın", "Bilet, çıkış harcı, ilk kira ve depozito.", { visaMove: 1, people: -5, m: 6 }), c("Biraz daha düşün", "Süren işliyor.", { m: -1 })],
    },
    {
      id: "abroadLoneliness",
      weight: (s) => (s.abroad && HS.CITIES[s.city]?.region === "abroad" ? 1.5 : 0),
      cooldown: 60,
      title: "Gurbet",
      text: (s) => "Bayram sabahı " + s.city + " sessiz. Telefonda annenin sesi titriyor.",
      choices: [c("Görüntülü bayramlaş", "Uzaktan da olsa.", { m: 2, people: 1 }), c("Türk derneğine git", "Yeni dostluklar.", { people: 3, m: 4, cost: 800 }), c("Bilet al, gel", "Pahalı ama değer.", (s) => ({ cost: (HS.COSTS.flightEurope * 2) , m: 10, people: 3 }))],
    },
    {
      id: "abroadBureaucracy",
      weight: (s) => (s.abroad && HS.CITIES[s.city]?.region === "abroad" ? 1.2 : 0),
      cooldown: 52,
      title: "Oturum izni yenileme",
      text: "Yabancılar dairesinden yazı geldi: oturum iznini uzatmak için evrak ve ücret istiyorlar. Randevular aylar sonrasına.",
      choices: [c("Avukat tut, hızlandır", "Masraflı ama garantiye yakın.", { cost: 30000, m: 1 }), c("Kendin hallet", "Dil ve sabır ister.", { sk: { almanca: 1, ingilizce: 1 }, m: -3, cost: 6000 })],
    },
  );
  // Şirket tayini yurt dışına: şirket vize sponsoru olur, süreç değerlendirmeden başlar
  HS.FX.emigrateCo = (s, city) => {
    const k = Object.keys(HS.COUNTRIES).find((x) => HS.COUNTRIES[x].city === city);
    if (!k) return;
    s.visa = { country: k, stage: "degerlendirme", docs: {}, ready: {}, tries: 0, fees: 0, sponsor: true, decideAt: s.weeks + 4 };
  };
  // Seyahat (turist/Schengen) vizesi: tatil ve turneler için
  HS.CAN.travelVisa = (s) => (!s.assets.passport ? "Önce pasaport gerekir." : HS.fundsOf(s) < tl(s, (C().schengenEUR + C().agencyEUR) * HS.FX_RATES.EUR) ? HS.short(s, tl(s, (C().schengenEUR + C().agencyEUR) * HS.FX_RATES.EUR)) : true);
  HS.FX.travelVisa = (s) => {
    HS.book(s, "Schengen vizesi", tl(s, (C().schengenEUR + C().agencyEUR) * HS.FX_RATES.EUR));
    const p = clamp(0.82 - (s.riskEver > 0 ? 0.3 : 0) + (s.job !== "none" ? 0.08 : -0.1), 0.2, 0.95);
    const ok = r() < p;
    if (ok) s.schengenUntil = s.weeks + 52;
    s.scenes.push({ t: ok ? "Schengen vizen çıktı" : "Schengen vizesi reddedildi", p: ok ? "Bir yıl geçerli çok girişli vize. Avrupa'ya tatil ya da turne yapabilirsin." : "Gerekçe: seyahat amacı ve geri dönüş güvencesi yetersiz. Ücret iade edilmez.", art: ok ? "✓" : "✕", kind: ok ? "win" : "lose", odds: Math.round(p * 100) });
  };
})(globalThis.HS || (globalThis.HS = {}));
