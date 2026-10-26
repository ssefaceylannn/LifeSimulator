// Müzik kariyeri (şöhret, dinlenme geliri, turneler) ve seyahat (yurt içi gezi, yurt dışı tatil).
// Gezilen il ve ülkeler s.visited içinde tutulur ve haritada gösterilir.
(function (HS) {
  "use strict";
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const r = () => HS.rng();
  const c = (label, hint, fx = {}) => ({ label, hint, fx });

  HS.TOURS = {
    turkiye: { name: "Türkiye turnesi", fame: 20, weeks: 4, cost: 60000, cities: [6, 10], per: 26000, world: null },
    avrupa: { name: "Avrupa turnesi", fame: 50, weeks: 5, cost: 250000, cities: [5, 7], per: 90000, world: ["Almanya", "Hollanda", "Fransa", "Avusturya", "Belçika", "İsviçre", "Danimarka"], schengen: true },
    dunya: { name: "Dünya turnesi", fame: 80, weeks: 8, cost: 900000, cities: [6, 9], per: 260000, world: ["ABD", "Kanada", "Japonya", "Brezilya", "Avustralya", "Güney Kore", "Meksika", "Birleşik Arap Emirlikleri", "İngiltere"], schengen: true },
  };
  // Seyahat edilebilecek ülkeler (tatil)
  HS.TRAVEL = {
    Yunanistan: { schengen: true, flight: 0.6, nightly: 4500 },
    Italya: { label: "İtalya", schengen: true, flight: 0.9, nightly: 6500 },
    Fransa: { schengen: true, flight: 1, nightly: 7500 },
    İspanya: { schengen: true, flight: 1.1, nightly: 6000 },
    Almanya: { schengen: true, flight: 0.8, nightly: 6000 },
    Gürcistan: { schengen: false, flight: 0.5, nightly: 2500 },
    Japonya: { schengen: false, visaFree: true, flight: 3.5, nightly: 7000 },
    Mısır: { schengen: false, visaFree: true, flight: 0.8, nightly: 3000 },
  };

  function init(s) {
    s.fame = s.fame || 0;
    s.visited = s.visited || { tr: [], world: [] };
    s.tour = s.tour || null;
  }
  HS.HOOKS.newLife.push(init);
  HS.HOOKS.migrate.push(init);
  HS.FX.fame = (s, v) => (s.fame = clamp((s.fame || 0) + v * (v > 0 ? clamp(1.2 - s.fame / 120, 0.2, 1.2) : 1), 0, 100));

  // Haftalık: şöhret ve müzik geliri
  HS.HOOKS.weekly.push((s) => {
    if (s.job === "music") {
      HS.FX.fame(s, (HS.Skills.get(s, "sahne") + HS.Skills.get(s, "beste")) / 900);
    }
    s.fame = Math.max(0, (s.fame || 0) - (s.job === "music" ? 0.04 : 0.12));
    if (s.tour) {
      s.free = 0;
      if (s.partner) s.partner.bond = clamp(s.partner.bond - 0.6, 0, 100);
      if (s.weeks >= s.tour.until) endTour(s);
    }
  });
  // Aylık: dinlenme ve telif geliri (şöhretin karesiyle büyür)
  HS.HOOKS.monthly.push((s) => {
    if ((s.fame || 0) >= 8) HS.earn(s, "Dinlenme ve telif geliri", Math.pow(s.fame, 2) * 18 * s.idx.cpi);
  });

  HS.CAN.tour = (s, k) => {
    const t = HS.TOURS[k];
    if (s.job !== "music") return "Turne için müzisyen olmalısın.";
    if (s.tour) return "Zaten turnedesin.";
    if ((s.fame || 0) < t.fame) return "Şöhretin en az " + t.fame + " olmalı.";
    if (t.world && !s.assets.passport) return "Pasaport gerekir.";
    if (t.schengen && !(s.schengenUntil > s.weeks)) return "Geçerli Schengen vizesi gerekir (DÜNYA sekmesi).";
    if (HS.fundsOf(s) < t.cost * s.idx.cpi) return HS.short(s, t.cost * s.idx.cpi);
    return true;
  };
  HS.FX.tour = (s, k) => {
    const t = HS.TOURS[k];
    HS.book(s, t.name + " organizasyonu", t.cost * s.idx.cpi);
    if (t.world) HS.book(s, "Yurt dışı çıkış harcı", HS.COSTS.exitFee * s.idx.cpi);
    const n = t.cities[0] + ((r() * (t.cities[1] - t.cities[0] + 1)) | 0);
    let stops;
    if (t.world) {
      stops = t.world.slice().sort(() => r() - 0.5).slice(0, Math.min(n, t.world.length));
    } else {
      const all = HS.HOME_CITIES.filter((x) => x !== s.city);
      stops = all.sort(() => r() - 0.5).slice(0, n);
    }
    s.tour = { k, until: s.weeks + t.weeks, stops };
    HS.note(s, t.name + "ne çıktı.");
    s.scenes.push({ t: t.name + " başlıyor", p: "Durakların: " + stops.join(", ") + ". Otobüs, oteller, ses kontrolleri ve her gece başka bir kalabalık.", art: "♫" });
  };
  function endTour(s) {
    const t = HS.TOURS[s.tour.k];
    const full = clamp(0.55 + s.fame / 160 + (r() - 0.5) * 0.3, 0.3, 1.1);
    const income = t.per * s.tour.stops.length * full * s.idx.cpi * (1 + s.fame / 100);
    HS.earn(s, t.name + " geliri", income);
    s.health = clamp(s.health - t.weeks * 1.2, 0, 100);
    s.mood = clamp(s.mood + 8, 0, 100);
    HS.FX.fame(s, 4 + t.weeks);
    HS.Skills.add(s, "sahne", 4);
    if (t.world) s.tour.stops.forEach((x) => !s.visited.world.includes(x) && s.visited.world.push(x));
    else
      s.tour.stops.forEach((x) => {
        const pl = HS.CITIES[x] && HS.CITIES[x].plaka;
        if (pl && !s.visited.tr.includes(pl)) s.visited.tr.push(pl);
      });
    s.scenes.push({
      t: "Turne bitti",
      p: s.tour.stops.length + " şehirde salonların ortalama %" + Math.round(Math.min(1, full) * 100) + "'i doldu. Toplam gelir " + HS.money(income) + ". Yorgunsun ama adın her yerde konuşuluyor.",
      art: "★",
      kind: "win",
    });
    HS.note(s, t.name + "ni tamamladı.");
    s.tour = null;
  }

  // ---- Seyahat ----
  HS.tripCost = (s, city) => {
    const km = HS.km ? HS.km(s.city, city) : 600;
    const transport = (km < 450 ? 600 + km * 2.2 : 2500 + km * 1.4) * 2; // gidiş-dönüş (otobüs/uçak karışık)
    const hotel = 3 * 3500; // 3 gece
    return (transport + hotel + 3 * 1500) * s.idx.cpi;
  };
  HS.CAN.trip = (s, city) => ((s.free || 0) < 2 ? "Gezi için en az 2 boş zaman gerekir." : HS.fundsOf(s) < HS.tripCost(s, city) ? HS.short(s, HS.tripCost(s, city)) : true);
  HS.FX.trip = (s, city) => {
    HS.book(s, HS.ek(city, "dat") + " gezi", HS.tripCost(s, city));
    s.free = 0;
    s.mood = clamp(s.mood + 7, 0, 100);
    s.health = clamp(s.health + 1, 0, 100);
    const pl = HS.CITIES[city] && HS.CITIES[city].plaka;
    const first = pl && !s.visited.tr.includes(pl);
    if (first) s.visited.tr.push(pl);
    s.scenes.push({ t: HS.ek(city, "loc") + " üç gün", p: (first ? "İlk kez geldin. " : "") + "Yerel lezzetler, tarihî sokaklar, akşam çayı. Gezdiğin il sayısı: " + s.visited.tr.length + "/81.", art: "✈", kind: "win" });
  };
  HS.abroadTripCost = (s, k) => {
    const t = HS.TRAVEL[k];
    return (HS.COSTS.flightEurope * 2 * t.flight + 5 * t.nightly + 5 * 2500 + HS.COSTS.exitFee) * s.idx.cpi;
  };
  HS.CAN.abroadTrip = (s, k) => {
    const t = HS.TRAVEL[k];
    if (!s.assets.passport) return "Pasaport gerekir.";
    if (t.schengen && !(s.schengenUntil > s.weeks)) return "Geçerli Schengen vizesi gerekir.";
    if ((s.free || 0) < 2) return "Tatil için en az 2 boş zaman gerekir.";
    if (HS.fundsOf(s) < HS.abroadTripCost(s, k)) return HS.short(s, HS.abroadTripCost(s, k));
    return true;
  };
  HS.FX.abroadTrip = (s, k) => {
    HS.book(s, (HS.TRAVEL[k].label || k) + " tatili", HS.abroadTripCost(s, k));
    s.free = 0;
    s.mood = clamp(s.mood + 10, 0, 100);
    const first = !s.visited.world.includes(k);
    if (first) s.visited.world.push(k);
    s.scenes.push({ t: (HS.TRAVEL[k].label || k) + " tatili", p: (first ? "Pasaportuna yeni bir damga. " : "") + "Bir hafta boyunca başka bir dil, başka bir sofra. Gezdiğin ülke sayısı: " + s.visited.world.length + ".", art: "✈", kind: "win" });
  };

  HS.EVENTS.push(
    {
      id: "tourLife",
      weight: (s) => (s.tour ? 40 : 0),
      cooldown: 2,
      title: (s) => HS.pick(["Kapalı gişe", "Turne otobüsünde", "Ses sistemi çöktü", "Hayran kalabalığı"]),
      text: (s) => {
        const stop = HS.pick(s.tour.stops);
        return HS.pick([
          stop + " konserinin biletleri iki saatte tükendi.",
          "Otobüs gece yarısı " + stop + " yolunda. Grup arkadaşların uyuyor, sen yeni bir şarkı mırıldanıyorsun.",
          stop + " sahnesinde ilk şarkının ortasında ses gitti. Kalabalık seni bekliyor.",
          "Otel çıkışında yüzlerce kişi seni bekliyordu.",
        ]);
      },
      choices: [
        c("Sahnede her şeyini ver", "Şöhret +, yorgunluk +", { fame: 1.5, h: -2, m: 4 }),
        c("Hayranlarla vakit geçir", "İmza, fotoğraf, sohbet.", { fame: 1, people: 2, h: -1 }),
        c("Odanda dinlen", "Sesini koru.", { h: 2 }),
      ],
    },
    {
      id: "recordDeal",
      weight: (s) => (s.job === "music" && s.fame >= 30 && !s.flags.recordDeal ? 1.5 : 0),
      cooldown: 104,
      title: "Plak şirketi teklifi",
      text: "Kurmaca bir plak şirketi seninle üç albümlük anlaşma yapmak istiyor. Avans iyi ama hakların bir kısmı onlarda kalacak.",
      choices: [
        c("İmzala", "Yüksek avans, daha hızlı şöhret.", { cash: 150000, fame: 10, flag: "recordDeal", m: 6 }),
        c("Bağımsız kal", "Haklar senin; şöhret yavaş gelir.", { fame: 2, sk: { produksiyon: 3 }, theme: "craft" }),
      ],
    },
    {
      id: "fameScandal",
      weight: (s) => (s.fame >= 40 ? 0.8 : 0),
      cooldown: 104,
      title: "Sosyal medyada fırtına",
      text: "Bir röportajda söylediğin cümle bağlamından koparılıp yayıldı. Herkes bir şey söylüyor.",
      choices: [
        c("Açıklama yap, özür dile", "Fırtına diner.", { fame: -2, m: -2 }),
        c("Sessiz kal", "Ya unutulur ya büyür.", { chance: { p: 0.5, win: { fame: 2 }, lose: { fame: -8, m: -6 }, winT: "Unutuldu", winP: "Bir hafta sonra kimse hatırlamıyordu; hatta takipçin arttı.", loseT: "Büyüdü", loseP: "Birkaç konserin iptal edildi." } }),
      ],
    },
  );
})(globalThis.HS || (globalThis.HS = {}));
