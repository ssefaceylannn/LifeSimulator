// Zaman akışı: her hafta 3-6 arası (rastgele) olay gelir; hepsi seçilince hafta kapanır.
// Olaylar haftanın günlerine sırayla dağılır. Gelir, gider ve yaşlanma haftalık işler.
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
    delete s.half;
    s.evDone = s.evDone || 0;
    s.weekPlan = s.weekPlan || HS.rollWeek();
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

  // ---- Haftalık plan ----
  // Karar uygulandıktan sonra çağrılır. Haftanın planı dolmadıysa aynı haftada yeni olay
  // gelir; dolduysa hafta (maaş, gider, yaş) işlenir ve yeni haftanın olay sayısı çekilir.
  HS.tick = function (s) {
    s.evDone = (s.evDone || 0) + 1;
    if (s.evDone < (s.weekPlan || 4)) {
      // Haftada yeni bir konu kalmadıysa hafta erken kapanır: aynı "boş akşam"
      // sorusuyla hafta doldurulmaz (sakin hafta).
      const def = HS.chooseEvent(s);
      if (def !== HS.FALLBACK_EVENT) {
        HS.nextEvent(s, def);
        return { ok: true, mid: true };
      }
    }
    s.evDone = 0;
    s.weekPlan = HS.rollWeek();
    return HS.week(s);
  };
  HS.COOLDOWN_SCALE = 0.55;
  HS.rollWeek = () => {
    const lo = HS.CFG ? Math.round(HS.CFG.weekMin) : 3,
      hi = Math.max(lo, HS.CFG ? Math.round(HS.CFG.weekMax) : 6);
    return lo + ((r() * (hi - lo + 1)) | 0);
  };
  HS.lateWeek = (s) => (s.evDone || 0) >= (s.weekPlan || 4) - 2;
  HS.slotKey = (s) => s.weeks * 10 + (s.evDone || 0);

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
    // Olaylar haftaya sırayla yayılır: 1. olay hafta başında, son olay hafta sonunda.
    const plan = s.weekPlan || 4,
      i = s.evDone || 0;
    const lo = Math.floor((i * 7) / plan),
      hi = Math.max(lo, Math.floor(((i + 1) * 7) / plan) - 1);
    let day = Math.min(6, lo + ((r() * (hi - lo + 1)) | 0));
    if (def.weekend) day = 5 + ((r() * 2) | 0);
    // Gün geriye gitmesin
    if (i > 0 && s.clock && s.clock.wk === s.weeks) day = Math.max(day, s.clock.day);
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
    s.clock = { day, hour: Math.floor(hour) % 24, min: (Math.floor(r() * 12) * 5) % 60, room, wk: s.weeks };
  }
  HS.HOOKS.event = HS.HOOKS.event || [];
  HS.HOOKS.event.push(place);
  HS.placeEvent = place;

  // ---- Olaylar ----
  HS.EVENTS.push(
    {
      id: "satMesai",
      weight: (s) => (HS.lateWeek(s) && ["office", "factory", "memur", "business"].includes(s.job) ? 1.6 : 0),
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
      text: (s, h) => h.pick([HS.castName(s, "isArk") + " bu hafta vardiyanı değiştirmek istiyor; çocuğu hastaymış.", HS.castName(s, "isArk") + " kardeşinin nişanı için cumartesi vardiyanı istiyor.", "Yeni gelen bir arkadaş, okul kaydı için vardiya değişikliği rica ediyor.", HS.castName(s, "isArk") + " hastane randevusu almış; vardiyanı devralmanı istiyor."]),
      choices: [
        c("Kabul et", "Arkadaşlık +, yorgunluk +", { people: 2, stress: 3, h: -1 }),
        c("Kibarca reddet", "Kendi düzenini koru.", { stress: -1, people: -1 }),
      ],
    },
    {
      id: "weekendRest",
      weekend: true,
      weight: (s) => (HS.lateWeek(s) && s.job !== "none" ? 1 : 0),
      cooldown: 7,
      room: "salon",
      title: (s) => (HS.isNight(s) ? "Cumartesi gecesi" : "Pazar sabahı"),
      text: (s, h) => h.pick(["Hafta boyu koşturdun. Nihayet kendine ait birkaç saat var.", "Alarm kurmadan uyandın; bu duyguyu özlemişsin.", "Haftanın yorgunluğu omuzlarında. Bugün senin günün.", "Mesai bitti, hafta sonu başladı. Plan yok, sadece sen varsın."]),
      choices: (s, h) =>
        HS.FALLBACK_EVENT.choices(s, h)
          .slice(0, 2)
          .concat([
            h.pick([
              c("Kanepeye uzan, dizi izle", "Stres −, kilo biraz +", { stress: -6, m: 3, kg: 0.1 }),
              c("Uzun bir kahvaltı hazırla", "Mutfakta keyif. Market masrafı.", { cost: 450, m: 4, stress: -4, bond: s.partner ? 3 : 0 }),
              c("Öğlene kadar uyu", "Uykusuzluk −", { sleep: -6, stress: -3, m: 1 }),
              c("Şehir dışına günübirlik kaç", "₺1.200 · yol, manzara", { cost: 1200, m: 6, stress: -6, people: 0.5 }),
            ]),
          ]),
    },
  );
})(globalThis.HS || (globalThis.HS = {}));
