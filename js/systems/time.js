// Zaman akışı: her ana karar 3-4 gün sürer (Pazartesi-Çarşamba, Perşembe-Pazar).
// Ekonomi haftalık işlemeye devam eder; iki karar bir haftayı tamamlar.
// Her olaya bir gün, saat ve yer atanır: iş olayı mesai saatinde iş yerinde, yemek olayı
// mutfakta, televizyon ya da aile olayı akşam salonda, uykusuzluk gece yatak odasında...
// Çalışma düzeni mesleğe göre değişir: hafta içi 08:00-17:00, kafe ve dükkânda 6 gün,
// fabrika ve hastanede aylık dönen vardiya (sabah, akşam, gece). Cumartesi bazen mesai çıkar.
(function (HS) {
  "use strict";
  const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
  const r = () => HS.rng();
  const c = (label, hint, fx = {}) => ({ label, hint, fx });
  HS.DAYS = ["Pazartesi", "Salı", "Çarşamba", "Perşembe", "Cuma", "Cumartesi", "Pazar"];

  // ---- Çalışma düzeni ----
  const SHIFTS = [
    { id: "sabah", name: "Sabah vardiyası", start: 7, end: 15 },
    { id: "aksam", name: "Akşam vardiyası", start: 15, end: 23 },
    { id: "gece", name: "Gece vardiyası", start: 23, end: 7 },
  ];
  HS.SHIFTS = SHIFTS;
  HS.schedule = function (s) {
    const j = s.job;
    if (s.mil === "serving") return { start: 6, end: 22, days: 7, label: "Askerlik: 06:00 içtima, 22:00 yat borusu" };
    if (j === "none") {
      if (s.edu === "ogrenci") return { start: 9, end: 16, days: 5, label: "Dersler hafta içi 09:00-16:00" };
      return null;
    }
    if (j === "factory" || j === "nurse") {
      const sh = SHIFTS[s.shiftIdx || 0];
      return { start: sh.start, end: sh.end, days: j === "nurse" ? 5 : 6, shift: sh, label: sh.name + " (" + pad(sh.start) + "-" + pad(sh.end) + ")" + (j === "factory" ? ", haftada 6 gün" : ", ayda iki hafta sonu nöbet") };
    }
    if (j === "cafe") return { start: 7, end: 16, days: 6, label: "07:00-16:00, haftada 6 gün (izin günü pazartesi)" };
    if (j === "business") return { start: 8, end: 20, days: 6, label: "Dükkân 08:00-20:00, pazar kapalı" };
    if (j === "teacher") return { start: 8, end: 15, days: 5, label: "Hafta içi 08:00-15:30, akşamları kâğıt okuma" };
    if (j === "music") return { start: 20, end: 1, days: 4, label: "Perşembe-pazar sahne, 20:00-01:00" };
    if (j === "crime") return { start: 22, end: 4, days: 3, label: "Belli bir saati yok; çoğu iş gece" };
    if (j === "memur") return { start: 8, end: 17, days: 5, label: "Hafta içi 08:00-17:00 (öğle arası 12:00-13:00)" };
    return { start: 8, end: 17, days: 5, label: "Hafta içi 08:00-17:00, cumartesi bazen mesai" };
  };
  const pad = (h) => String(((h % 24) + 24) % 24).padStart(2, "0") + ":00";
  HS.fmtTime = (cl) => (cl ? HS.DAYS[cl.day] + " " + String(cl.hour).padStart(2, "0") + ":" + String(cl.min).padStart(2, "0") : "");
  HS.isNight = (s) => {
    const h = s.clock ? s.clock.hour : 20;
    return h >= 20 || h < 7;
  };

  function init(s) {
    s.half = s.half || 0;
    s.shiftIdx = s.shiftIdx || 0;
    s.clock = s.clock || { day: 0, hour: 8, min: 0, room: "salon" };
  }
  HS.HOOKS.newLife.push(init);
  HS.HOOKS.migrate.push(init);

  // Vardiya her ay döner
  HS.HOOKS.monthly.push((s) => {
    if (s.job === "factory" || s.job === "nurse") {
      s.shiftIdx = ((s.shiftIdx || 0) + 1) % 3;
      const sh = SHIFTS[s.shiftIdx];
      s.scenes.push({ t: "Vardiyan değişti", p: "Bu ay " + sh.name.toLocaleLowerCase("tr-TR") + "ndasın (" + pad(sh.start) + "-" + pad(sh.end) + ")." + (sh.id === "gece" ? " Gündüz uyumaya alışmak zor olacak." : ""), art: "◷" });
    }
  });
  HS.HOOKS.weekly.push((s) => {
    const sch = HS.schedule(s);
    if (sch && sch.shift && sch.shift.id === "gece") {
      s.health = clamp(s.health - 0.25, 0, 100);
      if (HS.addStress) HS.addStress(s, 1.2);
    }
    if (sch && sch.days >= 6 && HS.addStress) HS.addStress(s, 0.6);
  });

  // ---- Yarım hafta ilerleyişi ----
  // Karar uygulandıktan sonra çağrılır: ilk yarıda yalnızca yeni olay gelir,
  // ikinci yarıda hafta (maaş, gider, yaş) işlenir.
  HS.tick = function (s) {
    const total = HS.freeSlots(s);
    if (!s.half) {
      s.half = 1;
      s.free = Math.max(1, total - Math.ceil(total / 2)) + (s.free > 0 ? 0 : 0);
      HS.HOOKS.half && HS.HOOKS.half.forEach((f) => f(s));
      if (s.tour || s.mil === "serving") s.free = s.mil === "serving" ? 1 : 0;
      HS.nextEvent(s);
      return { ok: true, half: true };
    }
    s.half = 0;
    const res = HS.week(s);
    if (s.alive) s.free = Math.ceil(HS.freeSlots(s) / 2);
    return res;
  };
  HS.HOOKS.half = HS.HOOKS.half || [];

  // ---- Olayın zamanı ve yeri ----
  const ROOM = {
    is: "promotion layoff cafeRush cafeRegular cafeOrder factoryOvertime factorySafety factoryUnion officeProject officeMentor teacherClass nurseNight nurseExtra shopSlow shopGrow mobbing mobbingCont overtime torpilGossip musicGig musicDemo tourLife studentExams studentLife internship satMesai shiftSwap coTransfer perfReview",
    mutfak: "market bill cooking aileYemegi fastFood kiloUyari savingsGoal unexpected homeRepair rentalRepair debtCounsel billLate billCut cardStatement depositEmergency harclik",
    yatak: "insomnia illness tooth seniorHealth kidSick aynaAyna belAgrisi thinning memoir fateIllness burnout",
    garaj: "carTrouble fixIt",
    sokak: "traffic stray walk concert fishing donate secondHand birthdayFriend transit rainy neighbor bookshop library oldFriend solidarity vacation wedding kidWedding meet barberChat exercise jobHunt interview coStage military militaryLife license abroadOffer abroadWinter abroadJob homesick abroadLoneliness abroadBureaucracy visaInterview teamDinner fateAccident fateTheft retireTrip retireVolunteer",
  };
  const ROOM_OF = {};
  for (const k in ROOM) ROOM[k].split(" ").forEach((id) => (ROOM_OF[id] = k));
  HS.EVENT_ROOM = ROOM_OF;
  const between = (a, b) => a + r() * (b - a);
  function place(s, def) {
    const id = def.id;
    let room = def.room || ROOM_OF[id] || (def.jobs ? "is" : "salon");
    const sch = HS.schedule(s);
    const weekend = s.half === 1 && r() < 0.5;
    let day = s.half ? (weekend ? 5 + ((r() * 2) | 0) : 3 + ((r() * 2) | 0)) : (r() * 3) | 0;
    if (id === "satMesai") day = 5;
    let hour;
    if (room === "is") {
      if (!sch) room = "sokak";
      else {
        if (day >= sch.days) day = (r() * Math.min(5, sch.days)) | 0;
        const len = ((sch.end - sch.start + 24) % 24) || 8;
        hour = (sch.start + 1 + r() * Math.max(1, len - 2)) % 24;
      }
    }
    if (hour == null) {
      const workDay = sch && day < sch.days && room !== "is";
      if (room === "mutfak") hour = r() < 0.35 ? between(7, 8.5) : between(19, 21.5);
      else if (room === "yatak") hour = r() < 0.6 ? between(23, 24.9) % 24 : between(6, 7.5);
      else if (room === "sokak") hour = workDay ? between(17.5, 20) : between(10, 19);
      else if (room === "garaj") hour = workDay ? between(7, 7.6) : between(10, 17);
      else hour = workDay ? between(19.5, 22.5) : between(11, 22);
      // Gece vardiyasındaki biri gündüz evdedir
      if (sch && sch.shift && sch.shift.id === "gece" && room !== "is" && room !== "yatak") hour = between(14, 21);
    }
    s.clock = { day, hour: Math.floor(hour) % 24, min: (Math.floor(r() * 12) * 5) % 60, room };
  }
  HS.HOOKS.event = HS.HOOKS.event || [];
  HS.HOOKS.event.push(place);
  HS.placeEvent = place;

  // ---- Olaylar ----
  HS.EVENTS.push(
    {
      id: "satMesai",
      weight: (s) => (s.half === 1 && ["office", "factory", "memur", "business"].includes(s.job) ? 1.6 : 0),
      cooldown: 6,
      title: "Cumartesi mesaisi",
      text: (s) => (s.job === "factory" ? "Sipariş yetişmiyor; ustabaşı cumartesi herkesi fabrikada istiyor." : "Müdürün cuma akşamı yazdı: \"Yarın birkaç saat gelebilir misin? Teslim pazartesi.\""),
      choices: (s) => {
        const extra = Math.round((HS.wage(s) / 22) * 1.5);
        return [
          c("Mesaiye kal", "Fazla mesai ücreti ₺" + extra.toLocaleString("tr-TR") + ", stres +", { cash: extra, raw: true, stress: 6, m: -2, perf: 3, sk: s.job === "office" ? { proje: 0.6 } : {} }),
          c("Ailevi bir işin olduğunu söyle", "Hafta sonu senin; amirin bozulabilir.", { stress: -3, perf: -3, m: 2 }),
        ];
      },
    },
    {
      id: "shiftSwap",
      weight: (s) => (["factory", "nurse"].includes(s.job) ? 0.8 : 0),
      cooldown: 12,
      title: "Vardiya değişimi rica",
      text: "Bir iş arkadaşın bu hafta vardiyanı değiştirmek istiyor; çocuğu hastaymış.",
      choices: [
        c("Kabul et", "Arkadaşlık +, yorgunluk +", { people: 2, stress: 3, h: -1 }),
        c("Kibarca reddet", "Kendi düzenini koru.", { stress: -1, people: -1 }),
      ],
    },
    {
      id: "weekendRest",
      weight: (s) => (s.half === 1 && s.job !== "none" ? 1 : 0),
      cooldown: 4,
      room: "salon",
      title: (s) => (HS.isNight(s) ? "Cumartesi gecesi" : "Pazar sabahı"),
      text: "Hafta boyu koşturdun. Nihayet kendine ait birkaç saat var.",
      choices: (s) => [
        c("Kanepeye uzan, dizi izle", "Stres −, kilo biraz +", { stress: -6, m: 3, kg: 0.1 }),
        c("Uzun bir kahvaltı hazırla", "Mutfakta keyif. Market masrafı.", { cost: 450, m: 4, stress: -4, bond: s.partner ? 3 : 0 }),
        c("Ev işlerini bitir", "Haftaya temiz başla.", { stress: -2, m: -1, h: 1 }),
      ],
    },
  );
})(globalThis.HS || (globalThis.HS = {}));
