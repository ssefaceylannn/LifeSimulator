// Arayüz: ekranlar, sahne, sekmeler, harita, ayarlar, ses, kayıtlar ve anı defteri.
(function (HS) {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const SAVE_KEY = "hayatSimulatuoruSavesV1"; // eski sürümle aynı anahtar: kayıtlar korunur
  const PROFILE_KEY = "hayatSimEndingProfilesV2";
  const SET_KEY = "hayatSimSettingsV1";
  const ACH_KEY = "hayatSimAchievementsV1";
  const PAGES = ["home", "create", "world", "records", "memoir", "settings"];
  const money = HS.money;
  const Art = HS.Art;
  const esc = (t) => String(t).replace(/[&<>"']/g, (x) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[x]);
  const reduced = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;
  const pct = (v) => "%" + Math.round(v * 100);
  const lc = (t) => String(t).toLocaleLowerCase("tr-TR");

  const TABS = [
    { id: "life", label: "HAYAT", icon: "house" },
    { id: "work", label: "İŞ", icon: "briefcase" },
    { id: "skills", label: "BECERİ", icon: "brain" },
    { id: "me", label: "BEN", icon: "t-shirt" },
    { id: "world", label: "DÜNYA", icon: "world-map" },
    { id: "money", label: "PARA", icon: "money-bag" },
  ];
  const HAIRS = { short: "Kısa", long: "Uzun", curly: "Kıvırcık", bun: "Topuz", braid: "Örgü", shaved: "Kazınmış" };
  const DEFAULTS = { music: true, sfx: true, vibration: true, volume: 0.8, commute: true, text: "normal" };

  let saves = [],
    active = null,
    selected = -1,
    tab = "life",
    sceneSig = "",
    mapSel = null,
    meSub = "ben",
    depMonths = 3,
    loanSel = { kind: "ihtiyac", frac: 0.5, months: 24 },
    moneySub = "banka",
    lastWeekOpen = false,
    create = { look: "woman", skin: 1, hairColor: "kahve", hair: "long" },
    settings = { ...DEFAULTS },
    H = []; // panel tıklama işleyicileri

  // ---------- Depolama ----------
  const store = {
    get(k, d) {
      try {
        const v = JSON.parse(localStorage.getItem(k));
        return v ?? d;
      } catch {
        return d;
      }
    },
    set(k, v) {
      try {
        localStorage.setItem(k, JSON.stringify(v));
        return true;
      } catch {
        return false;
      }
    },
  };
  function load() {
    saves = store.get(SAVE_KEY, []);
    if (!Array.isArray(saves)) saves = [];
    saves = saves
      .filter((s) => s && s.id)
      .map((s) => {
        try {
          return HS.migrate(s);
        } catch (e) {
          return null;
        }
      })
      .filter(Boolean);
    settings = { ...DEFAULTS, ...store.get(SET_KEY, {}) };
  }
  function persist() {
    if (!store.set(SAVE_KEY, saves)) toast("Cihazda kayıt alanı kalmamış olabilir.");
  }
  function save() {
    if (!active) return;
    const i = saves.findIndex((x) => x.id === active.id);
    if (i < 0) saves.push(active);
    else saves[i] = active;
    persist();
  }
  function addProfile(key) {
    const p = store.get(PROFILE_KEY, []);
    if (!p.includes(key)) {
      p.push(key);
      store.set(PROFILE_KEY, p);
    }
    return p.length;
  }

  // ---------- Ses ----------
  const sfx = (n) => HS.Audio && HS.Audio.play(n);
  const buzz = (n) => HS.Audio && HS.Audio.vibrate(n);
  HS.onAchievement = () => sfx("levelup");

  // ---------- Gezinme ----------
  function page(id) {
    PAGES.forEach((x) => $(x).classList.toggle("hidden", x !== id));
    $("event").classList.add("hidden");
    $("backBtn").style.visibility = id === "home" ? "hidden" : "visible";
    $("menuBtn").style.visibility = id === "world" ? "visible" : "hidden";
    $(id).scrollTop = 0;
  }
  function toast(t, kind) {
    $("toast").textContent = t;
    $("toast").classList.remove("hidden");
    if (kind === "error") {
      sfx("error");
      buzz("error");
    }
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => $("toast").classList.add("hidden"), 2800);
  }
  function ask(text, onYes, yesLabel = "Evet", extra = "") {
    $("confirmText").textContent = text;
    $("confirmExtra").innerHTML = extra;
    $("confirmYes").textContent = yesLabel;
    $("confirmModal").classList.remove("hidden");
    sfx("notify");
    $("confirmYes").onclick = () => {
      $("confirmModal").classList.add("hidden");
      onYes();
    };
    $("confirmNo").onclick = () => $("confirmModal").classList.add("hidden");
  }
  function pickFrom(title, items, cb, kicker = "SEÇ") {
    $("pickKicker").textContent = kicker;
    $("pickTitle").textContent = title;
    $("pickList").innerHTML = items
      .map((it, i) => `<button class="choice" data-p="${i}"><span class="bullet">${it.icon ? Art.icon(it.icon, 24) : i + 1}</span><span><b>${esc(it.label)}</b><small>${esc(it.hint || "")}</small></span></button>`)
      .join("");
    $("pickModal").classList.remove("hidden");
    $("pickList").querySelectorAll("[data-p]").forEach((b) => {
      b.onclick = () => {
        $("pickModal").classList.add("hidden");
        cb(items[+b.dataset.p]);
      };
    });
    $("pickCancel").onclick = () => $("pickModal").classList.add("hidden");
  }

  // ---------- Ana ekran ve oluşturma ----------
  function homeScene() {
    const demo = HS.newLife({ first: "", last: "", city: "İstanbul", look: "woman" });
    demo.week = 24;
    demo.car = "scooter";
    demo.partner = { name: "Bora", bond: 80, married: false };
    $("homeScene").innerHTML = Art.scene(demo, "salon");
  }
  function renderCreate() {
    const p = { gender: create.look, skin: create.skin, hair: create.hair, hairColor: create.hairColor, age: 18, outfit: "gunluk", mood: 1, fat: 0.3, mus: 0.25 };
    $("preview").innerHTML = `<svg viewBox="0 0 120 220">${Art.person(p)}</svg>`;
    $("lookPicker").querySelectorAll("button").forEach((b) => b.classList.toggle("selected", b.dataset.look === create.look));
    $("skinPicker").innerHTML = Art.SKINS.map((c, i) => `<button style="background:${c}" data-i="${i}" class="${i === create.skin ? "selected" : ""}" aria-label="Ten rengi ${i + 1}"></button>`).join("");
    $("hairColorPicker").innerHTML = Object.entries(Art.HAIR_COLORS)
      .map(([k, c]) => `<button style="background:${c}" data-k="${k}" class="${k === create.hairColor ? "selected" : ""}" aria-label="${Art.HAIR_NAMES[k]}"></button>`)
      .join("");
    const hairs = create.look === "man" ? ["short", "curly", "long", "shaved"] : ["long", "braid", "bun", "curly", "short"];
    if (!hairs.includes(create.hair)) create.hair = hairs[0];
    $("hairPicker").innerHTML = hairs.map((h) => `<button data-h="${h}" class="${h === create.hair ? "selected" : ""}">${HAIRS[h]}</button>`).join("");
    $("skinPicker").querySelectorAll("button").forEach((b) => (b.onclick = () => ((create.skin = +b.dataset.i), renderCreate())));
    $("hairColorPicker").querySelectorAll("button").forEach((b) => (b.onclick = () => ((create.hairColor = b.dataset.k), renderCreate())));
    $("hairPicker").querySelectorAll("button").forEach((b) => (b.onclick = () => ((create.hair = b.dataset.h), renderCreate())));
  }
  function begin() {
    const first = $("firstName").value.trim() || "Deniz",
      last = $("lastName").value.trim() || "Yılmaz";
    active = HS.newLife({ first, last, city: $("birthCity").value, ...create });
    HS.nextEvent(active);
    saves.push(active);
    save();
    openWorld();
  }
  function openWorld() {
    page("world");
    tab = "life";
    sceneSig = "";
    if (!active.current) HS.nextEvent(active);
    if (active.free === undefined) active.free = HS.freeSlots(active);
    render();
    showScenes();
  }

  // ---------- Dünya ekranı ----------
  function render() {
    const s = active;
    if (!s) return;
    $("personName").textContent = s.first + " " + s.last;
    $("titleLine").textContent =
      (s.retired ? "Emekli" : s.mil === "serving" ? "Er (askerde)" : s.edu === "ogrenci" && s.job === "none" ? "Üniversite öğrencisi" : s.job === "none" ? "İş arıyor" : HS.Skills.title(s)) +
      (s.company ? " · " + HS.co(s.company).name : "") +
      (s.tour ? " · turnede" : "");
    $("slotPill").textContent = "HAYAT " + (saves.indexOf(s) + 1);
    $("ageTag").textContent = s.age + " YAŞ";
    $("weekLabel").textContent = (s.clock ? HS.fmtTime(s.clock) : s.week + ". hafta") + " · " + s.year;
    $("lvNum").textContent = "Sv. " + HS.level(s);
    $("lvBar").style.width = Math.round(HS.levelProgress(s) * 100) + "%";
    $("stressStat").textContent = Math.round(s.stress);
    $("stressBar").style.width = s.stress + "%";
    const city = HS.CITIES[s.city] || {};
    $("dateLabel").textContent = HS.upper(s.city) + (city.country ? " · " + HS.upper(city.country) : "");
    $("cashStat").textContent = Math.abs(s.cash) >= 1e7 ? "₺" + (s.cash / 1e6).toLocaleString("tr-TR", { maximumFractionDigits: 1 }) + " Mn" : money(s.cash);
    $("healthStat").textContent = Math.round(s.health);
    $("moodStat").textContent = Math.round(s.mood);
    $("healthBar").style.width = s.health + "%";
    $("moodBar").style.width = s.mood + "%";
    const parts = [];
    if (s.savings > 1) parts.push("Banka " + money(s.savings));
    if (s.deposits && s.deposits.length) parts.push("Vadeli " + money(HS.depositTotal(s)));
    if (s.card && s.card.bal > 1) parts.push('<b class="neg">Kart ' + money(s.card.bal) + "</b>");
    if (s.loans && s.loans.length) parts.push("Kredi " + money(s.loans.reduce((a, l) => a + l.left, 0)));
    if (s.bills && s.bills.length) parts.push('<b class="neg">' + s.bills.length + " fatura</b>");
    const inv = HS.invTotal(s);
    if (inv > 1) parts.push("Yatırım " + money(inv));
    if (s.debt > 1) parts.push('<b class="neg">Borç ' + money(s.debt) + "</b>");
    if (s.mortgage) parts.push("Kredi " + money(s.mortgage.left));
    $("moneyLine").innerHTML = parts.join(" · ") || "Henüz birikim yok";
    drawScene();
    $("tabbar").innerHTML = TABS.map((t) => `<button class="tab${t.id === tab ? " active" : ""}" data-tab="${t.id}" aria-label="${t.label}">${Art.icon(t.icon, 24)}<small>${t.label}</small></button>`).join("");
    $("tabbar").querySelectorAll(".tab").forEach((b) => {
      b.onclick = () => {
        tab = b.dataset.tab;
        mapSel = null;
        render();
        $("world").scrollTop = 0;
      };
    });
    renderPanel();
  }
  function drawScene() {
    const s = active;
    const sig = JSON.stringify([
      s.city, s.week, s.age, s.job, s.housing, s.homeType, s.homeV, s.car, s.carColor, s.outfit, s.hair, s.hairColor, s.beard, s.thinning, s.transplanted,
      s.mood >= 62 ? 1 : s.mood < 35 ? -1 : 0, s.partner && [s.partner.bond >= 55, s.partner.married],
      s.children.map((k) => k.name + (s.year - k.born < 4 ? 0 : s.year - k.born < 11 ? 1 : s.year - k.born < 18 ? 2 : 3)),
      s.flags.kedi, s.edu, s.body && Math.round(s.body.w), s.body && Math.round(s.body.mus / 5),
      s.items, s.guest, s.visitKin, s.clock && s.clock.hour,
    ]);
    // Yeni olay geldiyse sahne olayın geçtiği yere geçer
    const evKey = s.weeks * 2 + (s.half || 0) + ":" + (s.current && s.current.id);
    if (evKey !== s.evKey) {
      s.evKey = evKey;
      const room = s.clock && s.clock.room;
      if (room) s.view = room;
    }
    const views = Art.views(s);
    if (!views.some((v) => v.id === s.view)) s.view = "salon";
    $("viewChips").innerHTML = views.map((v) => `<button class="view-chip${v.id === s.view ? " on" : ""}" data-v="${v.id}" role="tab" aria-selected="${v.id === s.view}">${esc(v.label)}</button>`).join("");
    $("viewChips").querySelectorAll("[data-v]").forEach((b) => {
      b.onclick = () => {
        if (s.view === b.dataset.v) return;
        s.view = b.dataset.v;
        sfx("select");
        save();
        drawScene();
      };
    });
    // Gece görünümü yalnızca karakterin o an bulunduğu yerde
    const night = !!(s.clock && s.view === s.clock.room && HS.isNight(s));
    if (sig + s.view + night === sceneSig) return;
    sceneSig = sig + s.view + night;
    $("sceneArt").innerHTML = Art.scene(s, s.view, { night });
  }
  function react(delta) {
    if (Math.abs(delta) < 3) return;
    const el = $("scene");
    el.classList.remove("react-up", "react-down");
    void el.offsetWidth;
    el.classList.add(delta > 0 ? "react-up" : "react-down");
    setTimeout(() => el.classList.remove("react-up", "react-down"), 1300);
  }

  // ---------- Panel yardımcıları ----------
  const on = (fn) => {
    H.push(fn);
    return ` data-h="${H.length - 1}"`;
  };
  const card = (title, body, cls = "") => `<article class="card ${cls}">${title ? `<h3>${title}</h3>` : ""}${body ? `<div class="card-body">${body}</div>` : ""}</article>`;
  const sectionTitle = (t, sub) => `<div class="section-title">${t}${sub ? `<small>${sub}</small>` : ""}</div>`;
  const bar = (v, cls = "") => `<i class="bar inline ${cls}"><i style="width:${Math.max(0, Math.min(100, v))}%"></i></i>`;
  // Parası yetmeyen için fiyat ve eksik tutar; seviye kilidi için yıldız.
  const num = (t) => +String(t).replace(/[^\d]/g, "");
  function needHtml(reason) {
    const m = String(reason).match(/₺[\d.]+/g);
    if (/eksik$/.test(reason) && m && m.length >= 2) {
      const price = num(m[0]),
        miss = num(m[1]);
      const pct = price ? Math.round(((price - miss) / price) * 100) : 0;
      return `<span class="need">${/^Peşinat/.test(reason) ? "Peşinat " : ""}<b>${m[0]}</b> · ${m[1]} daha biriktir</span>${bar(pct, "need")}`;
    }
    if (/^Seviye/.test(reason)) return `<span class="need lv">★ ${esc(reason)}</span>`;
    return "🔒 " + esc(reason);
  }
  // Eylem satırı: fx uygulanabilir değilse kilitli görünür
  function row(label, hint, fx, opt = {}) {
    let off = opt.off || null;
    if (!off) {
      const c = HS.canApply(active, fx);
      if (c !== true) off = c;
    }
    if (!off && opt.weekly && active.flags.tabUse?.[opt.weekly] === active.weeks) off = "Bu hafta yapıldı.";
    const icon = opt.icon ? Art.icon(opt.icon, 24) : "•";
    return `<button class="choice"${off ? " disabled" : on(() => act(fx, opt))}><span class="bullet">${icon}</span><span><b>${esc(label)}</b><small>${off ? (hint && /eksik$/.test(off) ? esc(hint) + "<br>" : "") + needHtml(off) : esc(hint)}</small></span>${opt.badge ? `<span class="odds-tag">${esc(opt.badge)}</span>` : ""}</button>`;
  }
  const rows = (arr) => `<div class="choice-list">${arr.filter(Boolean).join("")}</div>`;
  function act(fx, opt = {}, confirmed = false) {
    const s = active;
    if (opt.weekly) {
      s.flags.tabUse = s.flags.tabUse || {};
      if (s.flags.tabUse[opt.weekly] === s.weeks) return toast("Bunu bu hafta zaten yaptın.", "error");
    }
    if (opt.confirm && !confirmed) return ask(opt.confirm, () => act(fx, opt, true), opt.yes || "Evet", opt.extra || "");
    const before = s.mood,
      cash0 = s.cash;
    const r = HS.quickAction(s, fx);
    if (r !== true) return toast(r, "error");
    if (opt.weekly) s.flags.tabUse[opt.weekly] = s.weeks;
    if (s.cash < cash0 - 1) sfx("buy");
    else if (s.cash > cash0 + 1) sfx("coin");
    else sfx("select");
    if (opt.done) toast(opt.done);
    save();
    render();
    react(s.mood - before);
    showScenes();
  }

  function renderPanel() {
    H = [];
    const s = active;
    let html = "";
    if (tab === "life") html = lifeTab(s);
    else if (tab === "work") html = workTab(s);
    else if (tab === "skills") html = skillsTab(s);
    else if (tab === "me") html = meTab(s);
    else if (tab === "world") html = worldTab(s);
    else html = moneyTab(s);
    if (tab !== "life") html += '<p class="fine center">Bu sekmedeki işlemler haftayı ilerletmez; boş zaman harcayanlar belirtilmiştir.</p>';
    $("panel").innerHTML = html;
    $("panel").onclick = (e) => {
      const el = e.target.closest("[data-h]");
      if (el && !el.disabled) {
        sfx("tap");
        buzz("tap");
        H[+el.dataset.h]();
      }
    };
    if (tab === "life") bindChoices();
  }

  // ---------- HAYAT ----------
  function lifeTab(s) {
    const ev = s.current;
    const seasonName = { kis: "Kış", ilkbahar: "İlkbahar", yaz: "Yaz", sonbahar: "Sonbahar" }[Art.season(s)];
    const tags = [];
    if (s.partner) tags.push(s.partner.married ? "Evli" : "İlişkisi var");
    if (s.children.length) tags.push(s.children.length + " çocuk");
    const place = { salon: "evde", mutfak: "mutfakta", yatak: "yatak odasında", garaj: "garajda", is: s.edu === "ogrenci" && s.job === "none" ? "okulda" : "işte", sokak: "dışarıda" }[s.clock && s.clock.room] || "";
    let html = `<article class="card story"><div class="story-meta"><span>${s.clock ? esc(HS.fmtTime(s.clock)) + " · " + place : seasonName}</span><span>${esc(tags.join(" · "))}</span></div><h3 id="storyTitle">${esc(ev.t)}</h3><p>${esc(ev.p)}</p></article>`;
    html += `<div class="choice-list" id="choices">${ev.c
      .map(
        (c, i) =>
          `<button class="choice" data-c="${i}"${c.off ? " disabled" : ""}><span class="bullet">${String.fromCharCode(65 + i)}</span><span><b>${esc(c.label)}</b><small>${c.off ? needHtml(c.off) : esc(c.hint)}</small></span>${c.odds != null && !c.off ? `<span class="odds-tag" title="Başarı şansı">🎲 %${c.odds}</span>` : ""}</button>`,
      )
      .join("")}</div>`;
    html += `<button class="advance" id="advanceBtn" disabled>${s.half ? "Perşembe-Pazar'ı yaşa" : "Pazartesi-Çarşamba'yı yaşa"} <span>→</span></button>`;
    // Boş zaman
    const total = Math.max(s.free, Math.ceil(HS.freeSlots(s) / 2));
    const done = s.flags.actDone || {};
    html += `<section class="card free"><div class="free-head"><h3>Boş zaman</h3><div class="dots">${Array.from({ length: total }, (_, i) => `<i class="${i < s.free ? "" : "used"}"></i>`).join("")}</div></div>`;
    html += `<p class="fine">${s.tour ? "Turnedesin; boş zamanın yok." : s.mil === "serving" ? "Askerdesin; boş zamanın çok kısıtlı." : s.free ? (s.half ? "Perşembe-Pazar" : "Pazartesi-Çarşamba") + " arasında " + s.free + " boş zamanın var. İşten sonra ya da hafta sonu ne yapacaksın?" : "Bu günlerin boş zamanı bitti."}</p>`;
    html += `<div class="acts">${HS.ACTIVITIES.filter((a) => !a.when || a.when(s))
      .map((a) => `<button class="act${done[a.id] ? " done" : ""}" data-a="${a.id}"${done[a.id] || !s.free ? " disabled" : on(() => doActivity(a))}>${Art.icon(a.art, 32)}<b>${esc(a.label)}</b><small>${esc(done[a.id] ? "Yapıldı" : a.hint)}</small></button>`)
      .join("")}</div></section>`;
    // Süren işler
    const proc = processes(s);
    if (proc.length) html += card("Süren işler", '<div id="procList">' + proc.map((p) => `<div class="proc">${p}</div>`).join("") + "</div>");
    // Geçen hafta
    if (s.lastWeek) {
      const lw = s.lastWeek;
      const sum = (a) => a.reduce((x, y) => x + y[1], 0);
      const lines = []
        .concat(lw.in.map(([k, v]) => `<div class="led in"><span>${esc(k)}</span><b>+${money(v)}</b></div>`))
        .concat(lw.out.map(([k, v]) => `<div class="led out"><span>${esc(k)}</span><b>−${money(v)}</b></div>`));
      html += `<article class="card"><button class="collapse"${on(() => ((lastWeekOpen = !lastWeekOpen), renderPanel()))}><h3>Geçen haftanın dökümü</h3><span>${lw.cash >= 0 ? "+" : "−"}${money(Math.abs(lw.cash))} ${lastWeekOpen ? "▴" : "▾"}</span></button>${lastWeekOpen ? `<div class="ledger">${lines.join("") || '<p class="fine">Kayıt yok.</p>'}<div class="led total"><span>Toplam</span><b>${money(sum(lw.in) - sum(lw.out))}</b></div></div>` : ""}</article>`;
    }
    return html;
  }
  function processes(s) {
    const out = [];
    (s.apps || []).forEach((a) => {
      const x = a.co && HS.co(a.co);
      out.push(`${Art.icon("envelope", 20)} ${esc(x ? x.name : HS.JOBS[a.job].name)} başvurusu · ${a.offer ? "teklif bekleniyor" : x ? "aşama " + (a.stage + 1) + "/" + x.stages : "sonuç bekleniyor"} · ${Math.max(0, a.due - s.weeks)} hafta`);
    });
    if (s.visa) {
      const st = { evrak: "evrak hazırlığı", randevu: "randevu bekleniyor (" + Math.max(0, s.visa.apptAt - s.weeks) + " hafta)", degerlendirme: "değerlendirmede", onay: "onaylandı, taşınma bekliyor", red: "reddedildi" }[s.visa.stage];
      out.push(`${Art.icon("passport-control", 20)} ${esc(s.visa.country)} göç dosyası: ${st}`);
    }
    if (s.license === "kurs" || s.license === "direksiyon") out.push(`${Art.icon("oncoming-automobile", 20)} Ehliyet: ${s.license === "kurs" ? "kurs" : "direksiyon sınavı"} (${Math.max(0, s.licenseAt - s.weeks)} hafta)`);
    (s.courses || []).forEach((c) => {
      const d = HS.COURSES.find((x) => x.id === c.id);
      out.push(`${Art.icon("books", 20)} ${esc(d.name)} · ${c.left} hafta kaldı`);
    });
    if (s.tour) out.push(`${Art.icon("stadium", 20)} ${HS.TOURS[s.tour.k].name} · ${Math.max(0, s.tour.until - s.weeks)} hafta`);
    if (s.bills && s.bills.length) {
      const late = s.bills.filter((b) => b.late).length;
      out.push(`${Art.icon("receipt", 20)} ${s.bills.length} ödenmemiş fatura · ${money(s.bills.reduce((a, b) => a + b.amt, 0))}${late ? ' · <b class="neg">' + late + " gecikmiş</b>" : ""} <button class="mini"${on(() => ((tab = "money"), (moneySub = "banka"), render()))}>Öde</button>`);
    }
    if (s.card && s.card.stmt > 1 && s.card.paid + 1 < s.card.stmt && s.card.due >= s.weeks) out.push(`${Art.icon("credit-card", 20)} Kart ekstresi ${money(s.card.stmt - s.card.paid)} · son ödeme ${Math.max(0, s.card.due - s.weeks)} hafta (asgari ${money(Math.max(0, s.card.minDue - s.card.paid))})`);
    (s.deposits || []).forEach((d) => out.push(`${Art.icon("bank", 20)} Vadeli hesap ${money(d.amt)} · ${Math.max(0, Math.ceil((d.until - s.weeks) / 4.33))} ay kaldı (kilitli)`));
    if (s.gym && s.gym.until > s.weeks) out.push(`${Art.icon("flexed-biceps", 20)} Spor salonu üyeliği · ${Math.max(0, Math.ceil((s.gym.until - s.weeks) / 4.33))} ay`);
    const sch = HS.schedule(s);
    if (sch) out.unshift(`${Art.icon("stopwatch", 20)} ${esc(sch.label)}`);
    if (s.mil === "serving") out.push(`${Art.icon("military-helmet", 20)} Askerlik · ${Math.max(0, s.milUntil - s.weeks)} hafta`);
    (s.props || []).filter((p) => p.seeking).forEach((p) => out.push(`${Art.icon("key", 20)} ${esc(p.city)} mülkü için kiracı aranıyor`));
    return out;
  }
  function bindChoices() {
    const box = $("choices");
    box.querySelectorAll("[data-c]").forEach((b) => {
      b.onclick = () => {
        selected = +b.dataset.c;
        sfx("select");
        box.querySelectorAll(".choice").forEach((x, j) => x.classList.toggle("selected", j === selected));
        $("advanceBtn").disabled = false;
      };
    });
    selected = -1;
    $("advanceBtn").onclick = advance;
  }
  function doActivity(a, param) {
    if (a.pick === "skill" && !param) {
      const vis = HS.Skills.visible(active);
      return pickFrom(
        "Hangi beceriye çalışacaksın?",
        vis.map((k) => ({ label: HS.SKILLS[k].name, hint: "Şu an " + Math.round(HS.Skills.get(active, k)), icon: HS.SKILLS[k].icon, k })),
        (it) => doActivity(a, it.k),
        "KENDİ KENDİNE ÇALIŞ",
      );
    }
    const before = active.mood;
    const r = HS.doActivity(active, a.id, param);
    if (!r.ok) return toast(r.reason, "error");
    if (a.room && Art.views(active).some((v) => v.id === a.room)) active.view = a.room;
    sfx("select");
    save();
    render();
    react(active.mood - before);
    if (r.text && !active.scenes.length) toast(r.text);
    showScenes();
  }

  function advance() {
    if (selected < 0 || !active?.current) return;
    const ch = active.current.c[selected];
    if (ch.fx.child === "CUSTOM") return askName((n) => doChoose(n));
    doChoose();
  }
  function doChoose(name) {
    const s = active;
    const before = s.mood;
    const r = HS.choose(s, selected, name);
    if (r.ok === false) return toast(r.reason, "error");
    save();
    sfx("advance");
    if (r.ended) return finish();
    tab = "life";
    commute(() => {
      render();
      $("world").scrollTop = 0;
      react(s.mood - before);
      showScenes();
    });
  }
  // İşe gidiş ve eve dönüş (ayarlardan kapatılabilir; dokununca geçer).
  // Hafta içi günlerde, işi ya da okulu olan karakter için oynar.
  function commute(next) {
    const s = active;
    const sch = HS.schedule(s);
    const goes = sch && (s.job !== "none" || s.edu === "ogrenci") && !s.tour && s.mil !== "serving" && s.job !== "crime";
    if (!settings.commute || reduced() || !goes) return next();
    // Az önce yaşanan günler: ilk yarı bittiyse Pzt-Çrş, ikinci yarı bittiyse Prş-Cuma
    const day = s.half ? s.weeks % 3 : 3 + (s.weeks % 2);
    const d = HS.DAYS[day];
    const hh = (h, m) => String(((h % 24) + 24) % 24).padStart(2, "0") + ":" + String(m).padStart(2, "0");
    const dest = s.edu === "ogrenci" && s.job === "none" ? "Okula" : s.company ? HS.ek(HS.co(s.company).name, "dat") : s.job === "factory" ? "Fabrikaya" : s.job === "music" ? "Sahneye" : "İşe";
    const frames = [
      { art: Art.commute(s, sch.start >= 18 || sch.start < 5 ? "aksam" : "sabah"), text: d + " " + hh(sch.start - 1, 20 + (s.weeks % 4) * 5) + " · " + dest + " gidiyorsun" },
      { art: Art.commute(s, sch.end >= 17 || sch.end < 5 ? "aksam" : "sabah"), text: hh(sch.end, 0) + " · Mesai bitti, eve dönüyorsun" },
    ];
    const el = $("commute");
    el.classList.remove("hidden");
    let i = 0,
      done = false,
      timer;
    const show = () => {
      $("commuteArt").innerHTML = frames[i].art;
      $("commuteText").textContent = frames[i].text;
      timer = setTimeout(stepNext, 1700);
    };
    const end = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      el.classList.add("hidden");
      next();
    };
    const stepNext = () => (++i < frames.length ? show() : end());
    el.onclick = end;
    show();
  }

  // Ara sahneler: şanslı sonuçlarda kısa bir bekleyiş
  function showScenes(after) {
    const s = active;
    if (!s || !s.scenes.length) {
      if (after) after();
      return;
    }
    const sc = s.scenes.shift();
    save();
    const cardEl = $("eventCard");
    cardEl.className = "event-card" + (sc.kind ? " " + sc.kind : "");
    $("eventOdds").classList.toggle("hidden", sc.odds == null);
    $("eventOdds").textContent = sc.odds != null ? "🎲 Şans %" + sc.odds : "";
    $("eventExtra").innerHTML = sc.ach ? `<div class="ach-pop">${Art.icon(HS.ACHIEVEMENTS.find((a) => a.id === sc.ach).icon, 56)}</div>` : "";
    $("event").classList.remove("hidden");
    const reveal = () => {
      $("suspense").classList.add("hidden");
      $("eventArt").textContent = sc.art || "✦";
      $("eventTitle").textContent = sc.t;
      $("eventText").textContent = sc.p || "";
      $("eventArt").classList.remove("hidden");
      $("eventContinue").classList.remove("hidden");
      if (sc.kind) cardEl.className = "event-card " + sc.kind;
      if (sc.kind === "win") {
        sfx(sc.ach ? "levelup" : "win");
        buzz("win");
      } else if (sc.kind === "lose") {
        sfx("lose");
        buzz("lose");
      } else sfx("notify");
    };
    if (sc.odds != null && !reduced()) {
      cardEl.className = "event-card";
      $("eventArt").classList.add("hidden");
      $("eventTitle").textContent = "Sonuç bekleniyor…";
      $("eventText").textContent = "";
      $("eventContinue").classList.add("hidden");
      $("suspense").classList.remove("hidden");
      sfx("dice");
      setTimeout(reveal, 1100);
    } else reveal();
    $("eventContinue").onclick = () => {
      $("event").classList.add("hidden");
      render();
      showScenes(after);
    };
  }
  function askName(cb) {
    $("nameModal").classList.remove("hidden");
    $("nameInput").value = "";
    setTimeout(() => $("nameInput").focus(), 50);
    $("nameOk").onclick = () => {
      const v = $("nameInput").value.trim();
      if (!v) return toast("Bir isim yaz.", "error");
      $("nameModal").classList.add("hidden");
      cb(v);
    };
    $("nameCancel").onclick = () => $("nameModal").classList.add("hidden");
  }

  // ---------- İŞ ----------
  function workTab(s) {
    const cpi = s.idx.cpi,
      M = HS.WEEKS_PER_MONTH,
      b = HS.budget(s);
    let html = "";
    let info;
    if (s.retired) info = "Emeklisin. Aylık emekli maaşın " + money(HS.pension(s)) + ".";
    else if (s.job === "none") info = s.mil === "serving" ? "Askerdesin." : "Şu an çalışmıyorsun.";
    else info = `<b>${esc(HS.Skills.title(s))}</b> · ${esc(HS.JOBS[s.job].name)} · ${Math.floor(s.jobWeeks / 52)} yıl ${s.jobWeeks % 52} hafta<br>Aylık net ${money(HS.wage(s))}`;
    if (s.company) {
      const x = HS.co(s.company);
      info += `<br>${Art.icon("office-building", 18)} ${esc(x.name)} · ${x.stars.toFixed(1)}★ · ${esc(x.sector)}<br>Performans ${bar(s.perf)} ${Math.round(s.perf)}/100${s.mobbing ? ' · <b class="neg">mobbing sürüyor</b>' : ""}`;
    }
    info += `<br>Aylık: gelir ${money(b.income * M)} · yaşam ${money(b.living * M)}${b.rent ? " · kira " + money(b.rent * M) : ""}${b.kids ? " · çocuk " + money(b.kids * M) : ""}`;
    html += card("İş", info);
    const sch = HS.schedule(s);
    if (sch) html += card("Çalışma düzeni", esc(sch.label) + (sch.shift ? "<br>Vardiya her ay döner: sabah → akşam → gece. Gece vardiyası sağlığı ve stresi zorlar." : "") + "<br>Hafta sonu: " + (sch.days >= 7 ? "yok" : sch.days >= 6 ? "yalnızca pazar" : "cumartesi-pazar tatil" + (["office", "factory", "memur", "business"].includes(s.job) ? " (bazen cumartesi mesaisi çıkar)" : "")) + "<br>Stres: " + esc(HS.stressLabel(s.stress)) + " (" + Math.round(s.stress) + ")");
    // Kariyer basamakları
    const lad = HS.Skills.ladder(s);
    if (lad && s.job !== "none") {
      let l = "";
      lad.forEach((st, i) => {
        const cur = i === s.jobLevel,
          next = i === s.jobLevel + 1;
        if (i > s.jobLevel + 1) {
          l += `<div class="ladder locked"><span>${i + 1}</span><b>???</b><small>Önceki basamağa ulaşınca görünür</small></div>`;
          return;
        }
        const m = next ? HS.Skills.missing(s) : null;
        const req = Object.entries(st.req)
          .map(([k, v]) => {
            const ok = HS.Skills.get(s, k) >= v;
            return `<span class="req ${ok ? "ok" : ""}">${ok ? "✓" : "✗"} ${esc(HS.SKILLS[k].name)} ${Math.round(HS.Skills.get(s, k))}/${v}</span>`;
          })
          .join("");
        l += `<div class="ladder ${cur ? "cur" : i < s.jobLevel ? "past" : ""}"><span>${i + 1}</span><b>${esc(st.title)}</b><small>Maaş ×${st.mult}${next && m.weeksLeft ? " · " + m.weeksLeft + " hafta daha kıdem" : ""}</small>${next ? `<div class="reqs">${req || '<span class="req ok">Şart yok</span>'}</div>` : ""}</div>`;
      });
      html += card("Kariyer basamakları", l);
    }
    if (!s.retired && s.mil !== "serving") {
      // Şirket sıralaması ve başvurular
      html += sectionTitle("En iyi işverenler", "Kurmaca şirketler · 2026 sıralaması");
      const myJobs = ["office", "cafe", "factory", "nurse", "teacher", "memur"].filter((j) => !HS.JOBS[j].need || HS.JOBS[j].need(s) === true);
      const list = HS.coRanking();
      html += `<div class="co-list">${list
        .map((x, i) => {
          const jobs = x.jobs.filter((j) => myJobs.includes(j));
          const here = HS.coIn(x, s.city);
          const apply = jobs
            .map((j) => {
              const fx = { coApply: { co: x.id, job: j, relocate: !here } };
              const c = HS.canApply(s, fx);
              return `<button class="mini"${c === true ? on(() => act(fx, { done: "Başvurun gönderildi.", confirm: x.name + " · " + HS.JOBS[j].name + " başvurusu gönderilsin mi? " + x.stages + " aşamalı mülakat var." + (here ? "" : " İşe alınırsan " + x.cities[0] + " şubesine taşınırsın (masrafı şirket öder).") })) : ` disabled title="${esc(c)}"`}>${esc(HS.JOBS[j].name)} · %${Math.round(HS.coChance(s, x, j) * 100)}</button>`;
            })
            .join("");
          return `<div class="co${s.company === x.id ? " mine" : ""}"><div class="co-rank">${i + 1}</div><div class="co-main"><b>${esc(x.name)}</b><small>${x.stars.toFixed(1)}★ · ${esc(x.sector)} · maaş ×${x.mult} · ${x.stages} aşama · ${x.cities ? esc(x.cities.slice(0, 3).join(", ")) + (x.cities.length > 3 ? "…" : "") : "her ilde"}</small><small>${esc(x.perk)}${x.mobbing > 0.3 ? " · yönetim sert" : ""}</small>${apply ? `<div class="mini-row">${apply}</div>` : `<small class="neg">Uygun pozisyon yok (diploma ya da beceri gerekir)</small>`}</div></div>`;
        })
        .join("")}</div>`;
      // Şirket dışı işler
      const other = [];
      if (s.job !== "music") other.push(row("Müzisyen olarak başla", "Bar ve mekânlara başvur · şans %" + Math.round(HS.appChance(s, "music") * 100) + " · 1 boş zaman", { apply: "music", useFree: 1 }, { icon: "guitar", done: "Başvurun gönderildi." }));
      if (s.job !== "business") other.push(row("Dükkân aç", "Sermaye " + money(HS.JOBS.business.startup * cpi) + " · kazanç ay ay değişir.", { job: "business" }, { icon: "convenience-store", confirm: "Dükkân açmak için sermaye ödeyeceksin. Emin misin?" }));
      if (s.job !== "none") other.push(row("İstifa et", "Gelirin kesilir.", { job: "none", leaveCompany: 1 }, { icon: "warning", confirm: "İşinden istifa etmek istediğine emin misin?" }));
      html += sectionTitle("Diğer yollar") + rows(other);
    }
    // Müzisyen: şöhret ve turneler
    if (s.job === "music" || (s.fame || 0) > 5) {
      let m = `Şöhret ${bar(s.fame || 0)} ${Math.round(s.fame || 0)}/100 · aylık dinlenme geliri ~${money(Math.pow(s.fame || 0, 2) * 18 * cpi)}`;
      html += card("Sahne", m);
      html += rows(
        Object.entries(HS.TOURS).map(([k, t]) =>
          row(t.name, t.weeks + " hafta · organizasyon " + money(t.cost * cpi) + " · en az " + t.fame + " şöhret" + (t.schengen ? " · Schengen vizesi" : ""), { tour: k }, { icon: "stadium", confirm: t.name + "ne çıkılsın mı? " + t.weeks + " hafta boyunca boş zamanın olmayacak." }),
        ),
      );
    }
    return html;
  }

  // ---------- BECERİ ----------
  function skillsTab(s) {
    let html = "";
    const m = s.job !== "none" ? HS.Skills.missing(s) : null;
    if (m) html += card("Sıradaki basamak: " + esc(m.step.title), m.miss.length ? "Eksikler: " + m.miss.map(([k, v]) => esc(HS.SKILLS[k].name) + " " + Math.round(HS.Skills.get(s, k)) + "/" + v).join(", ") + (m.weeksLeft ? " · " + m.weeksLeft + " hafta kıdem" : "") : m.weeksLeft ? m.weeksLeft + " hafta kıdem kaldı." : "Bütün şartları taşıyorsun; terfi teklifi yakında gelebilir.");
    const cats = [["genel", "Genel"], ["dil", "Diller"]];
    const jobCats = Object.keys(HS.LADDERS);
    jobCats.forEach((j) => cats.push([j, HS.JOBS[j].name]));
    cats.forEach(([cat, name]) => {
      const list = Object.entries(HS.SKILLS).filter(([k, d]) => d.cat === cat);
      const open = cat === "genel" || cat === "dil" || (s.skSeen && s.skSeen[cat]);
      if (!open) {
        html += `<article class="card skill-cat locked"><h3>${esc(name)} becerileri</h3><p class="fine">??? · ${list.length} gizli beceri. Bu alanda çalışınca ya da bir kursa yazılınca açılır.</p></article>`;
        return;
      }
      html += `<article class="card skill-cat"><h3>${esc(name)}${cat === s.job ? ' <span class="pill">mesleğin</span>' : ""}</h3>${list
        .map(([k, d]) => {
          const v = HS.Skills.get(s, k);
          return `<div class="skill">${Art.icon(d.icon, 26)}<span>${esc(d.name)}</span>${bar(v, "sk")}<b>${Math.round(v)}</b></div>`;
        })
        .join("")}</article>`;
    });
    html += sectionTitle("Kurslar", "Her hafta bir boş zaman kullanır");
    html += rows(
      HS.COURSES.map((c) => {
        const run = (s.courses || []).find((x) => x.id === c.id);
        return run
          ? row(c.name + " (devam ediyor)", run.left + " hafta kaldı · " + HS.SKILLS[c.skill].name, { dropCourse: c.id }, { icon: "books", confirm: "Kursu bırakmak istiyor musun? Ücret iade edilmez." })
          : row(c.name, c.weeks + " hafta · " + money(c.cost * s.idx.cpi) + " · " + HS.SKILLS[c.skill].name + " +" + Math.round(c.weeks * c.gain), { course: c.id }, { icon: HS.SKILLS[c.skill].icon });
      }),
    );
    return html;
  }

  // ---------- BEN ----------
  // Alt sekme düğmeleri
  function subTabs(cur, list, set) {
    return `<div class="subtabs" role="tablist">${list.map(([id, label]) => `<button class="subtab${id === cur ? " on" : ""}" role="tab" aria-selected="${id === cur}"${on(() => (set(id), renderPanel()))}>${esc(label)}</button>`).join("")}</div>`;
  }
  const head = (P, size = 52) => `<svg viewBox="22 2 76 76" width="${size}" height="${size}" aria-hidden="true">${Art.person({ ...P, hs: 1 })}</svg>`;
  function meTab(s) {
    let html = subTabs(meSub, [["ben", "Ben"], ["aile", "Aile"], ["stil", "Stil"], ["esya", "Eşyalar"], ["basari", "Başarımlar"]], (v) => (meSub = v));
    if (meSub === "aile") return html + familyPanel(s);
    if (meSub === "stil") return html + stylePanel(s);
    if (meSub === "esya") return html + itemsPanel(s);
    if (meSub === "basari") return html + sectionTitle("Seviye " + HS.level(s), "Deneyim " + s.xp + " · sonraki seviyeye %" + Math.round(HS.levelProgress(s) * 100)) + sectionTitle("Başarımlar", (s.ach || []).length + "/" + HS.ACHIEVEMENTS.length) + `<div class="ach-grid">${achGrid(s)}</div>` + sectionTitle("Hayatının grafiği", "Net değer (2026 TL ile)") + `<div class="chart">${chart(s)}</div>`;
    const cpi = s.idx.cpi;
    const b = s.body;
    html += card(
      "Durum",
      `Sağlık ${bar(s.health)} ${Math.round(s.health)} · Mutluluk ${bar(s.mood, "mood")} ${Math.round(s.mood)}<br>Stres ${bar(s.stress, "stress")} ${Math.round(s.stress)} · <b>${esc(HS.stressLabel(s.stress))}</b><br><small class="fine">Stresi iş yükü, borç, geciken faturalar, vardiya ve mobbing artırır; dinlenmek, uyku, spor, gezmek ve sevdiklerinle vakit azaltır. 70'in üstünde sağlık ve ilişkin yıpranır.</small>`,
    );
    html += card(
      "Beden",
      `Boy ${Math.round(b.h)} cm · Kilo ${b.w.toFixed(1)} kg · BKİ ${HS.Body.bmi(s).toFixed(1)} (${esc(HS.Body.label(s))})<br>Kas ${bar(b.mus)} ${Math.round(b.mus)}/100 · ${esc(HS.Body.muscleLabel(s))}`,
    );
    html += sectionTitle("Spor salonu", s.gym && s.gym.until > s.weeks ? "Üyeliğin " + Math.ceil((s.gym.until - s.weeks) / 4.33) + " ay daha geçerli" : "Üyelik yoksa her giriş ₺" + Math.round(450 * cpi).toLocaleString("tr-TR"));
    html += `<div class="packs">${HS.GYM_PACKS.map((g) => {
      const price = HS.gymPrice(s, g.months);
      const fx = { gymBuy: g.months };
      const c = HS.canApply(s, fx);
      return `<button class="pack"${c === true ? on(() => act(fx, { confirm: g.months + " aylık üyelik " + money(price) + ". Alınsın mı?", yes: "Satın al", done: "Üyeliğin başladı." })) : " disabled"}><b>${g.months} ay</b><span>${money(price)}</span><small>${g.off ? "%" + Math.round(g.off * 100) + " indirim · aylık " + money(price / g.months) : "Esnek"}</small>${c === true ? "" : `<small>${needHtml(c)}</small>`}</button>`;
    }).join("")}</div>`;
    html += rows([!s.flags.kedi ? row("Bir kedi sahiplen", "Mama, kum ve veteriner: ilk masraf " + money(6500 * cpi), { cost: 6500, m: 6, flag: "kedi", log: "Bir kedi sahiplendi." }, { icon: "cat" }) : null]);
    return html;
  }
  function familyPanel(s) {
    const cpi = s.idx.cpi;
    let html = "";
    // İlişki
    if (s.partner) {
      html += card(esc(s.partner.name) + (s.partner.married ? " · eşin" : " · partnerin"), `Bağ ${bar(s.partner.bond)} ${Math.round(s.partner.bond)}`);
      html += rows([
        !s.partner.married ? row("Evlenme teklif et", "Yüzük ve akşam yemeği " + money(35000 * cpi), { cost: 35000, chance: { p: Math.min(0.95, Math.max(0.1, s.partner.bond / 100 + 0.1)), win: { marry: true, m: 10 }, lose: { bond: -12, m: -8 }, winT: s.partner.name + " evet dedi!", winP: "Restoranda herkes alkışladı.", loseT: "Henüz hazır değil", loseP: s.partner.name + " biraz daha zamana ihtiyacı olduğunu söyledi." } }, { weekly: "propose", icon: "ring" }) : null,
        row(s.partner.married ? "Boşan" : "Ayrıl", s.partner.married ? "Avukat ve dava " + money(45000 * cpi) + "; birikimler paylaşılır." : "İlişkiyi bitir.", { breakup: true, m: -8, stress: 10, cost: s.partner.married ? 45000 : 0, divorceSplit: s.partner.married ? 1 : 0 }, { confirm: "Bu ilişkiyi bitirmek istediğine emin misin?", icon: "warning" }),
      ]);
    } else html += card("İlişki", "Şu an bir ilişkin yok." + (s.exes ? " Geçmişte " + s.exes + " ayrılık." : "") + " Yakın çevren: " + Math.round(s.people) + " kişi.");
    // Soy ağacı
    html += sectionTitle("Soy ağacı", "Ara, ziyaret et; bağ zayıflarsa uzaklaşırsınız");
    const gens = HS.familyTree(s);
    const names = ["Büyükanne ve büyükbaba", "Anne, baba ve akrabalar", "Sen ve kardeşlerin", "Çocukların", "Torunlar"];
    const P = Art.fromState(s);
    html += `<div class="tree">`;
    gens.forEach((g, gi) => {
      if (!g.length) return;
      html += `<div class="gen"><div class="gen-name">${names[gi]}</div><div class="gen-row">`;
      g.forEach((n) => {
        if (n.me) html += `<div class="node me">${head(P)}<b>${esc(s.first)}</b><small>Sen · ${s.age}</small></div>`;
        else if (n.partner) html += `<div class="node">${head(Art.partnerLook(s, P))}<b>${esc(s.partner.name)}</b><small>${s.partner.married ? "Eşin" : "Partnerin"}</small></div>`;
        else if (n.child) html += `<div class="node">${head(Art.childLook(s, n.child, P))}<b>${esc(n.child.name)}</b><small>Çocuğun · ${s.year - n.child.born}</small>${bar(n.child.bond)}</div>`;
        else if (n.grand) html += `<div class="node"><span class="q">♡</span><b>Torunların</b><small>Var</small></div>`;
        else {
          const k = n.kin;
          const a = HS.kinAge(s, k);
          html += `<div class="node${k.alive ? "" : " dead"}">${head(HS.kinLook(s, k))}<b>${esc(k.name)}</b><small>${esc(HS.kinLabel(k))} · ${k.alive ? a : "vefat " + k.died}</small>${k.alive ? bar(k.bond) + `<small>${esc(k.city)}</small><div class="mini-row"><button class="mini"${HS.canApply(s, { callKin: k.id }) === true ? on(() => act({ callKin: k.id }, { done: k.name + " ile konuştun." })) : " disabled"}>Ara</button><button class="mini"${HS.canApply(s, { visit: k.id }) === true ? on(() => act({ visit: k.id }, { confirm: k.name + " ziyaret edilsin mi? " + (k.city === s.city ? "Yol ve hediye " : k.city + " yolu ") + money(HS.visitCost(s, k)) + "." })) : ` disabled title="${esc(HS.canApply(s, { visit: k.id }))}"`}>Ziyaret ${money(HS.visitCost(s, k))}</button></div>` : ""}</div>`;
        }
      });
      html += `</div></div>`;
    });
    html += `</div>`;
    return html;
  }
  function stylePanel(s) {
    const E = HS.ECONOMY,
      cpi = s.idx.cpi;
    const P = Art.fromState(s);
    let html = sectionTitle("Gardırop", "İşe uygun kıyafet başvuru ve terfi şansını artırır");
    html += `<div class="outfits">${Object.entries(Art.OUTFITS)
      .filter(([k, o]) => !(o.type === "dress" && s.look === "man") && (!o.hidden || s.outfits.includes(k)))
      .map(([k, o]) => {
        const owned = s.outfits.includes(k);
        const onIt = s.outfit === k;
        const fits = s.job !== "none" && HS.outfitFits({ ...s, outfit: k }, s.job);
        const can = owned ? true : HS.canApply(s, { outfitBuy: k });
        const handler = onIt ? "" : owned ? on(() => act({ wear: k })) : can === true ? on(() => act({ outfitBuy: k }, { confirm: o.name + " " + money(o.price * cpi) + " karşılığında alınsın mı?", yes: "Satın al" })) : " disabled";
        return `<button class="outfit${onIt ? " on" : ""}"${handler}><svg viewBox="0 0 120 220">${Art.person({ ...P, outfit: k, mood: 1 })}</svg><b>${esc(o.name)}</b><small${fits ? ' class="fit"' : ""}>${onIt ? "Giyiliyor" : owned ? "Giy" : money(o.price * cpi)}${fits ? " · işe uygun" : ""}</small></button>`;
      })
      .join("")}</div>`;
    html += sectionTitle("Berber ve kuaför", "Saç modeline dokun; fiyat modele göre değişir");
    const list = Art.HAIR_FOR[s.look === "man" ? "man" : "woman"];
    const price = (h) => Math.round(E.haircut * ({ curly: 2.4, afro: 3, braid: 1.8, wavy: 2.2, pompadour: 1.4, bob: 1.3, pixie: 1.3 }[h] || 1) * cpi);
    html += `<div class="hairs">${list
      .map((h) => {
        const fx = { hair: h, cost: price(h) / cpi };
        const c = h === s.hair ? "Şu anki modelin" : s.flags.tabUse?.barber === s.weeks ? "Bu hafta kuaföre gittin." : HS.canApply(s, fx);
        return `<button class="hair${h === s.hair ? " on" : ""}"${c === true ? on(() => act(fx, { weekly: "barber" })) : " disabled"}>${head({ ...P, hair: h, thin: false }, 64)}<b>${esc(Art.HAIR_STYLES[h])}</b><small>${h === s.hair ? "Şu an" : money(price(h))}</small></button>`;
      })
      .join("")}</div>`;
    html += rows([
      s.look === "man" ? row(s.beard ? "Sakalı kestir" : "Sakal bırak", "Berber " + money(E.beard * cpi), { beard: !s.beard, cost: E.beard }, { weekly: "beard", icon: "barber-pole" }) : null,
      ...Object.keys(Art.HAIR_COLORS).filter((k) => k !== s.hairColor).map((k) => row("Saçı boyat: " + Art.HAIR_NAMES[k], "Boya " + money(1800 * cpi), { hairColor: k, cost: 1800 }, { weekly: "dye", icon: "scissors" })),
      s.look === "man" && !s.transplanted ? row("Saç ekimi", "Kalıcı işlem, " + money(E.transplant * cpi) + ".", { transplant: true, m: 3 }, { confirm: "Saç ekimi yaptırmak istiyor musun?", icon: "barber-pole" }) : null,
    ]);
    return html;
  }
  function itemsPanel(s) {
    let html = sectionTitle("Kişisel eşyalar", "Peşin ya da kredi kartıyla taksitli · bazıları odalarında görünür");
    html += `<div class="items">${Object.entries(HS.ITEMS)
      .map(([k, it]) => {
        const owned = s.items.includes(k);
        const price = HS.itemPrice(s, k, 1);
        let btns = "";
        if (owned) {
          const sell = it.price * s.idx.cpi * Math.max(0.15, 0.6 - (s.weeks - (s.itemAt[k] || 0)) / 520);
          btns = `<button class="mini"${on(() => act({ itemSell: k }, { confirm: it.name + " ikinci ele " + money(sell) + " karşılığında satılsın mı?" }))}>Sat ${money(sell)}</button>`;
        } else {
          const c1 = HS.canApply(s, { itemBuy: { id: k, inst: 1 } });
          btns = `<button class="mini"${c1 === true ? on(() => act({ itemBuy: { id: k, inst: 1 } }, { confirm: it.name + " " + money(price) + " peşin alınsın mı?", yes: "Satın al" })) : " disabled"}>Peşin</button>`;
          if (s.card && !it.consumable)
            [3, 6, 9].forEach((n) => {
              const c = HS.canApply(s, { itemBuy: { id: k, inst: n } });
              const pr = HS.itemPrice(s, k, n);
              btns += `<button class="mini"${c === true ? on(() => act({ itemBuy: { id: k, inst: n } }, { confirm: it.name + " kartla " + n + " taksit: aylık " + money(pr / n) + ", toplam " + money(pr) + ". Onaylıyor musun?", yes: "Taksitle al" })) : " disabled"}>${n} taksit · ${money(pr / n)}</button>`;
            });
          if (c1 !== true) btns += `<small>${needHtml(c1)}</small>`;
        }
        return `<div class="item${owned ? " own" : ""}">${Art.icon(it.icon, 34)}<div><b>${esc(it.name)}</b><small>${esc(it.desc)}</small><small><b>${money(price)}</b>${it.lv ? " · ★ Seviye " + it.lv : ""}${owned ? " · sende" : ""}</small><div class="mini-row">${btns}</div></div></div>`;
      })
      .join("")}</div>`;
    if (!s.card) html += '<p class="fine">Taksitle almak için PARA › Banka bölümünden kredi kartına başvurabilirsin.</p>';
    return html;
  }
  function achGrid(s) {
    return HS.ACHIEVEMENTS.map((a) => {
      const got = (s.ach || []).includes(a.id);
      return `<div class="ach${got ? " got" : ""}" title="${esc(a.desc)}">${got ? Art.icon(a.icon, 34) : '<span class="q">?</span>'}<small>${esc(got ? a.name : "???")}</small></div>`;
    }).join("");
  }
  function chart(s) {
    const h = (s.hist || []).concat([{ age: s.age, net: Math.round(HS.netWorth(s) / s.idx.cpi) }]);
    if (h.length < 2) return '<p class="fine">Grafik bir yıl sonra oluşur.</p>';
    const W = 320,
      Hh = 120,
      pad = 24;
    const xs = h.map((p) => p.age),
      ys = h.map((p) => p.net);
    const x0 = Math.min(...xs),
      x1 = Math.max(...xs),
      y0 = Math.min(0, ...ys),
      y1 = Math.max(1, ...ys);
    const X = (v) => pad + ((v - x0) / Math.max(1, x1 - x0)) * (W - pad - 6);
    const Y = (v) => Hh - 16 - ((v - y0) / Math.max(1, y1 - y0)) * (Hh - 26);
    const pts = h.map((p) => X(p.age).toFixed(1) + "," + Y(p.net).toFixed(1)).join(" ");
    const short = (n) => (Math.abs(n) >= 1e6 ? (n / 1e6).toFixed(1) + " Mn" : Math.abs(n) >= 1e3 ? Math.round(n / 1e3) + " B" : Math.round(n));
    return `<svg viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Net değer grafiği"><path d="M${pad} ${Y(0)}H${W - 6}" stroke="var(--line)" stroke-dasharray="3 3"/><polygon points="${pts} ${X(x1)},${Y(y0)} ${X(x0)},${Y(y0)}" fill="var(--blue)" opacity=".12"/><polyline points="${pts}" fill="none" stroke="var(--blue)" stroke-width="2.5" stroke-linejoin="round"/><circle cx="${X(h[h.length - 1].age)}" cy="${Y(h[h.length - 1].net)}" r="4" fill="var(--blue)"/><text x="2" y="${Y(y1) + 4}" font-size="9" fill="var(--muted)">₺${short(y1)}</text><text x="2" y="${Y(y0) + 3}" font-size="9" fill="var(--muted)">₺${short(y0)}</text><text x="${pad}" y="${Hh - 2}" font-size="9" fill="var(--muted)">${x0} yaş</text><text x="${W - 40}" y="${Hh - 2}" font-size="9" fill="var(--muted)">${x1} yaş</text></svg>`;
  }

  // ---------- DÜNYA ----------
  function worldTab(s) {
    const cpi = s.idx.cpi;
    const city = HS.CITIES[s.city] || {};
    const sc = HS.SCENARIOS[s.scenario];
    const rate = (k) => "%" + Math.round(HS.rate(s, k) * 100);
    let html = card(
      esc(s.city) + (city.country ? " · " + esc(city.country) : ""),
      "Ortalama daire kirası " + money(HS.rentFull(s)) + "/ay" + (city.est ? " (tahmini)" : "") + " · 70 m² daire " + money(HS.homePrice(s, "daire")) + "<br>" +
        s.year + " oranları (" + (s.year <= HS.ECONOMY.startYear ? "TÜİK Eylül 2026" : "kurmaca senaryo: " + esc(sc.name)) + "): genel " + rate("cpi") + ", gıda " + rate("food") + ", ulaşım " + rate("transport") + ", konut " + rate("housing") +
        "<br>Gezdiğin iller: <b>" + s.visited.tr.length + "/81</b> · ülkeler: <b>" + s.visited.world.length + "</b>",
    );
    // Harita
    if (HS.TR_MAP) {
      const cur = city.plaka;
      const paths = Object.entries(HS.TR_MAP.prov)
        .map(([pl, p]) => {
          const n = +pl;
          const cls = n === cur ? "here" : mapSel === n ? "sel" : s.visited.tr.includes(n) ? "seen" : (s.props || []).some((x) => HS.CITIES[x.city]?.plaka === n) ? "own" : "";
          return `<path d="${p.d}" class="${cls}"${on(() => ((mapSel = n), renderPanel()))}><title>${esc(p.n)}</title></path>`;
        })
        .join("");
      const label = cur ? `<circle cx="${HS.TR_MAP.prov[cur].x}" cy="${HS.TR_MAP.prov[cur].y}" r="7" class="pin"/>` : "";
      html += `<div class="map"><svg viewBox="${HS.TR_MAP.viewBox}" role="img" aria-label="Türkiye haritası">${paths}${label}</svg><div class="legend"><span class="lg here"></span>Yaşadığın <span class="lg seen"></span>Gördüğün <span class="lg own"></span>Mülkün <span class="lg sel"></span>Seçili</div></div>`;
      if (mapSel) {
        const name = HS.TR_MAP.prov[mapSel].n;
        const c = HS.CITIES[name];
        const mc = HS.moveCost(s, name);
        html += card(
          esc(name),
          `Kira ${money(c.rent * s.idx.housing)}/ay${c.est ? " (tahmini)" : ""} · m² ${money(c.sqm * s.idx.housing)} · ${HS.km(s.city, name)} km<br>Taşınma: nakliye ${money(mc.nakliye)}, depozito ${money(mc.deposit)}, emlakçı ${money(mc.agent)}, ilk kira ${money(mc.first)} = <b>${money(mc.total)}</b>${mc.own ? " (orada evin var)" : ""}`,
        );
        if (name !== s.city && !city.country)
          html += rows([
            row(HS.ek(name, "dat") + " taşın", "Toplam " + money(mc.total) + (s.job !== "none" ? " · işinden ayrılırsın" : ""), { moveCity: name }, { icon: "delivery-truck", confirm: HS.ek(name, "dat") + " taşınmak istiyor musun? Toplam masraf " + money(mc.total) + "." + (s.job !== "none" ? " İşinden ayrılacaksın." : "") }),
            row(HS.ek(name, "dat") + " 3 günlük gezi", money(HS.tripCost(s, name)) + " · 2 boş zaman", { trip: name }, { icon: "airplane-departure" }),
          ]);
      }
    }
    // Pasaport ve göç
    html += sectionTitle("Pasaport ve yurt dışı");
    const items = [];
    if (!s.assets.passport) items.push(row("Pasaport çıkar (10 yıllık)", "Harç ve defter " + money(HS.COSTS.passport10 * cpi), { passport: 1 }, { icon: "passport-control", done: "Pasaportun hazır." }));
    items.push(row(s.schengenUntil > s.weeks ? "Schengen vizen geçerli" : "Schengen vizesine başvur", s.schengenUntil > s.weeks ? Math.round((s.schengenUntil - s.weeks) / 4.3) + " ay daha geçerli" : "€" + (HS.COSTS.schengenEUR + HS.COSTS.agencyEUR) + " (" + money((HS.COSTS.schengenEUR + HS.COSTS.agencyEUR) * HS.FX_RATES.EUR * cpi) + ") · sonuç belirsiz", { travelVisa: 1 }, { icon: "passport-control", off: s.schengenUntil > s.weeks ? "Zaten geçerli." : null }));
    html += rows(items);
    // Tatil
    html += sectionTitle("Yurt dışı tatil", "2 boş zaman · çıkış harcı dahil");
    html += rows(Object.entries(HS.TRAVEL).map(([k, t]) => row((t.label || k) + (s.visited.world.includes(k) ? " ✓" : ""), money(HS.abroadTripCost(s, k)) + (t.schengen ? " · Schengen" : " · vize gerekmez"), { abroadTrip: k }, { icon: "airplane-departure" })));
    // Göç dosyası
    html += sectionTitle("Göç", "Vize süreci uzun, masraflı ve sonucu belirsizdir");
    if (s.abroad && city.region === "abroad") {
      html += rows([row(HS.ek(s.birthCity, "dat") + " kesin dönüş", "Uçak ve nakliye", { returnHome: true, cost: 60000 }, { icon: "airplane-departure", confirm: "Türkiye'ye kesin dönüş yapmak istiyor musun?" })]);
    } else if (!s.visa || s.visa.stage === "red") {
      html += (s.visa ? card("Önceki başvuru reddedildi", s.visa.retryAt > s.weeks ? (s.visa.retryAt - s.weeks) + " hafta sonra yeniden başvurabilirsin." : "Yeniden başvurabilirsin.") : "") +
        `<div class="countries">${Object.entries(HS.COUNTRIES)
          .map(([k, c]) => {
            const lang = HS.Skills.get(s, c.lang);
            const fx = { visaStart: k };
            const can = HS.canApply(s, fx);
            return `<div class="country"><b>${esc(k)} · ${esc(c.city)}</b><small>${esc(c.visa)}</small><small>Harç ${c.cur} ${c.fee} · kanıtlanacak birikim ${c.cur} ${c.funds.toLocaleString("tr-TR")} (${money(c.funds * HS.FX_RATES[c.cur])})</small><small>Dil: ${esc(HS.SKILLS[c.lang].name)} ${Math.round(lang)}/${c.langMin} · kira ${c.cur} ${c.rent}/ay · tipik net maaş ${c.cur} ${c.wage}${c.lottery ? " · kura %" + Math.round(c.lottery * 100) : ""}</small><button class="mini"${can === true ? on(() => act(fx, { confirm: k + " için göç dosyası açılsın mı? Evrak hazırlığı haftalar sürer ve her biri ücretlidir." })) : ` disabled title="${esc(can)}"`}>Dosya aç</button></div>`;
          })
          .join("")}</div>`;
    } else {
      const v = s.visa,
        co = HS.COUNTRIES[v.country];
      const st = { evrak: "1/4 Evrak hazırlığı", randevu: "2/4 Randevu bekleniyor", degerlendirme: "3/4 Değerlendirmede", onay: "4/4 Onaylandı" }[v.stage];
      let body = `<b>${esc(st)}</b> · ödenen ${money(v.fees)}${v.blocked ? " · bloke hesapta " + money(v.blocked) : ""}<br>Tahmini onay şansı %${Math.round(HS.visaApproval(s) * (co.lottery && !v.sponsor ? co.lottery : 1) * 100)}${co.lottery && !v.sponsor ? " (kura dahil)" : ""}`;
      if (v.stage === "randevu") body += "<br>Randevuna " + Math.max(0, v.apptAt - s.weeks) + " hafta var.";
      if (v.stage === "degerlendirme") body += "<br>Sonuç " + Math.max(0, v.decideAt - s.weeks) + " hafta içinde.";
      html += card(esc(v.country) + " göç dosyası", body);
      if (v.stage === "evrak") {
        html += rows(
          HS.VISA_DOCS.map((d) => {
            const state = v.docs[d.id];
            const cost = typeof d.cost === "function" ? d.cost() : d.cost;
            const hint = state === "hazir" ? "Hazır ✓" : state === "hazirlaniyor" ? Math.max(0, v.ready[d.id] - s.weeks) + " hafta sonra" + (v.pending && v.pending[d.id] != null ? " · başarı şansı %" + Math.round(v.pending[d.id] * 100) : "") : (cost ? money(cost * s.idx.cpi) + " · " : "") + (d.weeks ? d.weeks + " hafta · " : "") + "1 boş zaman";
            return row(d.name, hint, { visaDoc: d.id }, { icon: state === "hazir" ? "clipboard" : "page-facing-up", off: state === "hazir" ? "Hazır ✓" : null });
          }),
        );
        html += rows([row("Randevu al", "Aracı kurum hizmet bedeli €" + HS.COSTS.agencyEUR + " · bekleme 2-10 hafta", { visaAppt: 1 }, { icon: "calendar" }), row("Dosyayı kapat", "Ödenen ücretler geri gelmez.", { visaCancel: 1 }, { icon: "warning", confirm: "Göç dosyasını kapatmak istiyor musun?" })]);
      }
      if (v.stage === "onay") {
        const k = HS.emigrateCost(s, v.country);
        html += rows([row(HS.ek(co.city, "dat") + " taşın", "Bilet " + money(k.flight) + " + çıkış harcı " + money(k.exit) + " + ilk kira ve depozito " + money(k.rent + k.deposit), { visaMove: 1, people: -5, m: 6 }, { icon: "airplane-departure", confirm: co.city + " seni bekliyor. Taşınmaya hazır mısın?" })]);
      }
    }
    return html;
  }

  // ---------- PARA ----------
  function moneyTab(s) {
    const cpi = s.idx.cpi;
    let html = subTabs(moneySub, [["banka", "Banka"], ["yatirim", "Yatırım"], ["mulk", "Ev ve mülk"], ["arac", "Araç"]], (v) => (moneySub = v));
    if (moneySub === "banka") return html + bankPanel(s);
    if (moneySub === "yatirim") {
    // Yatırımlar
    html += sectionTitle("Yatırımlar", "Riskli araçlarda her ay %30 kazanç, %70 kayıp ihtimali");
    html += `<div class="inv-list">${Object.entries(HS.INVEST)
      .map(([k, d]) => {
        const v = HS.invVal(s, k);
        const cost = (s.invCost || {})[k] || 0;
        const pl = v - cost;
        const last = (s.invLast || {})[k];
        const buy = (f) => {
          const amt = Math.round(s.cash * f);
          const fx = { invest: { k, amt } };
          const c = HS.canApply(s, fx);
          return `<button class="mini"${c === true && amt > 0 ? on(() => act(fx)) : " disabled"}>Al %${f * 100}</button>`;
        };
        const sell = (f) => `<button class="mini"${v > 1 ? on(() => act({ divest: { k, frac: f } })) : " disabled"}>Sat ${f === 1 ? "hepsi" : "%" + f * 100}</button>`;
        return `<div class="inv">${Art.icon(d.icon, 30)}<div><b>${esc(d.name)}</b><small>Risk: ${esc(d.risk)} · ${esc(d.desc)}</small><small>Değer ${money(v)}${v > 1 ? ` · <span class="${pl >= 0 ? "pos" : "neg"}">${pl >= 0 ? "+" : "−"}${money(Math.abs(pl))}</span>` : ""}${last != null && v > 1 ? ` · geçen ay ${last >= 0 ? "▲" : "▼"}%${Math.abs(Math.round(last * 100))}` : ""}</small><div class="mini-row">${buy(0.1)}${buy(0.25)}${sell(0.5)}${sell(1)}</div></div></div>`;
      })
      .join("")}</div>`;
    // Bahis
    html += sectionTitle("Yasal bahis bayisi (kurmaca)", "18 yaş üstü · haftada en fazla 3 kupon · bilanço " + money(s.bets.net));
    const stakes = [100, 500, 2000, 10000].map((n) => Math.round(n * cpi));
    html += `<div class="bets">${Object.entries(HS.BETS)
      .map(([k, b]) => `<div class="bet"><b>${esc(b.name)}</b><small>Oran ${b.odds.toFixed(2)} · tutma ihtimali %${Math.round(b.p * 100)} · ${esc(b.desc)}</small><div class="mini-row">${stakes.map((st) => `<button class="mini"${HS.canApply(s, { bet: { type: k, stake: st } }) === true ? on(() => act({ bet: { type: k, stake: st } })) : " disabled"}>${money(st)}</button>`).join("")}</div></div>`)
      .join("")}</div><p class="fine">Bahis bağımlılık yapabilir. Oyundaki oranlar bayinin her zaman kazandığı biçimde ayarlıdır.</p>`;
      return html;
    }
    if (moneySub === "mulk") {
    // Ev ve mülkler
    html += sectionTitle("Ev ve mülkler");
    const homeRows = [];
    if (!s.assets.house)
      Object.entries(HS.HOME_TYPES).forEach(([k, h]) => {
        homeRows.push(row(h.name + " · peşin", money(HS.homePrice(s, k)) + " · " + s.city, { buy: "house", homeType: k }, { confirm: h.name + " peşin almak istiyor musun?", icon: k === "daire" ? "office-building" : "house-with-garden" }));
        homeRows.push(row(h.name + " · kredili", "%30 peşinat " + money(HS.homePrice(s, k) * 0.3) + ", 15 yıl", { buy: "house", homeType: k, mortgage: true }, { confirm: h.name + " için konut kredisi çekmek istiyor musun?", icon: k === "daire" ? "office-building" : "house-with-garden" }));
      });
    else homeRows.push(row("Oturduğun evi sat", "Değer " + money(HS.homePrice(s)) + (s.mortgage ? " (kredi düşülür)" : "") + " · komisyon %2,4", { sell: "house" }, { confirm: "Evini satmak istiyor musun? Kiraya geçeceksin.", icon: "house" }));
    if (s.housing === "aile") {
      homeRows.push(row("Ev arkadaşıyla kiraya çık", "Depozito " + money(HS.rentFull(s)) + ", kiranın yarısı senden.", { rent: "kira-paylasim" }, { icon: "office-building" }));
      homeRows.push(row("Tek başına kiraya çık", "Depozito + ilk ay " + money(HS.rentFull(s) * 2) + ".", { rent: "kira" }, { icon: "office-building" }));
    }
    if (s.housing.startsWith("kira")) homeRows.push(row("Aile evine dön", "Kira biter.", { moveHome: 1, m: -3 }, { confirm: "Aile evine dönmek istiyor musun?", icon: "house" }));
    html += rows(homeRows);
    (s.props || []).forEach((p) => {
      const val = HS.propPrice(s, p.city, p.type);
      html += card(
        esc(p.city) + " · " + esc(HS.HOME_TYPES[p.type].name),
        "Değer " + money(val) + " · " + (p.rented ? "kirada, aylık " + money(HS.propRent(s, p) * 0.9) : p.seeking ? "kiracı aranıyor" : "boş"),
      );
      html += rows([
        !p.rented && !p.seeking ? row("Kiraya ver", "Aylık ~" + money(HS.propRent(s, p) * 0.9) + " · kiracı bulmak 1-4 hafta", { rentOut: p.id }, { icon: "key" }) : null,
        p.rented ? row("Kiracıyı çıkar", "Ev boşalır.", { endLease: p.id }, { icon: "key", confirm: "Kiracıyla sözleşmeyi bitirmek istiyor musun?" }) : null,
        row("Sat", money(val * (1 - HS.COSTS.saleCommission)) + " (komisyon sonrası)", { sellProp: p.id }, { icon: "money-bag", confirm: p.city + " mülkünü satmak istiyor musun?" }),
      ]);
    });
    html += `<div class="buyprop"><select id="propCity" aria-label="İl">${HS.HOME_CITIES.map((c) => `<option${c === s.city ? " selected" : ""}>${esc(c)}</option>`).join("")}</select><select id="propType" aria-label="Tür">${Object.entries(HS.HOME_TYPES).map(([k, h]) => `<option value="${k}">${esc(h.name)}</option>`).join("")}</select><button class="mini"${on(() => {
      const city = $("propCity").value,
        type = $("propType").value;
      const price = HS.propPrice(s, city, type) * (1 + HS.COSTS.saleCommission + 0.02);
      act({ buyProp: { city, type } }, { confirm: city + " · " + HS.HOME_TYPES[type].name + " yatırım amaçlı alınsın mı? Tapu harcı ve komisyon dahil " + money(price) + "." });
    })}>Yatırım için al</button></div>`;
    if (!s.assets.land) html += rows([row("Arsa al", "Yaklaşık " + money(HS.landPrice(s)), { buy: "land" }, { confirm: "Arsa almak istiyor musun?", icon: "national-park" })]);
    else html += rows([row("Arsayı sat", "Değer " + money(HS.landPrice(s)), { sell: "land" }, { confirm: "Arsanı satmak istiyor musun?", icon: "national-park" })]);
      return html;
    }
    // Araç, ehliyet, sigorta
    html += sectionTitle("Araç ve ehliyet");
    const lic = { yok: "Ehliyetin yok", kurs: "Sürücü kursundasın", direksiyon: "Direksiyon sınavı bekliyor", var: "Ehliyetin var" }[s.license];
    html += card("", lic + (s.car ? " · " + esc(Art.CARS[s.car].name) + " · ikinci el değeri " + money(HS.carPrice(s) * 0.55) : " · aracın yok"));
    const carRows = [];
    if (s.license === "yok") carRows.push(row("Sürücü kursuna yazıl", "Kurs + e-sınav " + money((HS.COSTS.drivingCourse + HS.COSTS.eExam) * cpi) + " · sonra direksiyon sınavı ve harç", { license: 1 }, { icon: "oncoming-automobile" }));
    Object.entries(Art.CARS)
      .filter(([k]) => k !== s.car)
      .forEach(([k, c]) => carRows.push(row((s.car ? "Takasla: " : "Al: ") + c.name, money(HS.carPrice(s, k)) + (s.car ? " (eskisi " + money(HS.carPrice(s) * 0.55) + " düşülür)" : "") + (k !== "bisiklet" ? " · yıllık MTV ve sigorta" : ""), { buy: "car", model: k, trade: !!s.car }, { confirm: c.name + " almak istiyor musun?", icon: c.art })));
    if (s.car) {
      carRows.push(row("Aracı boyat", "Yeni renk " + money(18000 * cpi), { cost: 18000, carColor: ((s.carColor || 0) + 1) % 6 }, { icon: Art.CARS[s.car].art }));
      carRows.push(row("Aracı sat", "İkinci el " + money(HS.carPrice(s) * 0.55), { sell: "car" }, { confirm: "Aracını satmak istiyor musun?", icon: Art.CARS[s.car].art }));
      if (s.car !== "bisiklet") carRows.push(row(s.ins.kasko ? "Kaskoyu iptal et" : "Kasko yaptır", "Yıllık ~" + money(HS.COSTS.kasko * cpi), { ins: { k: "kasko", on: !s.ins.kasko } }, { icon: "warning" }));
    }
    carRows.push(row(s.ins.health ? "Özel sağlık sigortasını iptal et" : "Özel sağlık sigortası yaptır", "Yıllık ~" + money(HS.COSTS.privateHealth * cpi) + " · sağlık olaylarında masraf azalır", { ins: { k: "health", on: !s.ins.health } }, { icon: "health-worker" }));
    html += rows(carRows);
    return html;
  }
  function bankPanel(s) {
    const cpi = s.idx.cpi;
    const R = HS.bankRates(s);
    const pctS = (v, d = 2) => "%" + (v * 100).toFixed(d).replace(".", ",");
    let html = card(
      "Hesap özeti",
      `Nakit <b>${money(s.cash)}</b> · Vadesiz hesap <b>${money(s.savings)}</b>${s.deposits.length ? " · Vadeli " + money(HS.depositTotal(s)) : ""}<br>` +
        (s.card ? `Kart borcu ${money(s.card.bal)} / limit ${money(s.card.limit)}<br>` : "") +
        (s.loans.length ? `Kredi borcu ${money(s.loans.reduce((a, l) => a + l.left, 0))} · aylık taksit ${money(s.loans.reduce((a, l) => a + l.monthly, 0))}<br>` : "") +
        (s.mortgage ? `Konut kredisi ${money(s.mortgage.left)}<br>` : "") +
        (s.debt > 1 ? `<b class="neg">Takipteki borç ${money(s.debt)}</b><br>` : "") +
        `Kredi notu <b>${Math.round(s.score)}</b>/1900 · ${esc(HS.scoreLabel(s.score))} · Net değer <b>${money(HS.netWorth(s))}</b>`,
    );
    // Vadesiz
    html += sectionTitle("Vadesiz hesap", "Günlük getirili, istediğin an çekilir · yıllık ~" + pctS(R.deposit * 0.5, 0));
    html += `<div class="mini-row wide">${[0.25, 0.5, 1].map((f) => `<button class="mini"${s.cash >= 100 ? on(() => act({ save: Math.round(s.cash * f) })) : " disabled"}>Yatır ${f === 1 ? "hepsi" : "%" + f * 100}</button>`).join("")}${[0.5, 1].map((f) => `<button class="mini"${s.savings > 1 ? on(() => act({ withdraw: f })) : " disabled"}>Çek ${f === 1 ? "hepsi" : "%" + f * 100}</button>`).join("")}</div>`;
    // Vadeli
    html += sectionTitle("Vadeli mevduat", "Vade dolana kadar para kilitli; bozarsan faiz yanar · stopaj %17,5");
    html += `<div class="seg mini-seg">${HS.DEPOSIT_TERMS.map((t) => `<button class="${depMonths === t.months ? "selected" : ""}"${on(() => ((depMonths = t.months), renderPanel()))}>${t.months} ay<small>${pctS(HS.depositRate(s, t.months), 0)}</small></button>`).join("")}</div>`;
    html += `<div class="mini-row wide">${[0.25, 0.5, 1].map((f) => {
      const amt = Math.floor(s.cash * f);
      const fx = { depositOpen: { amt, months: depMonths } };
      const c = HS.canApply(s, fx);
      return `<button class="mini"${c === true ? on(() => act(fx, { confirm: money(amt) + " " + depMonths + " ay vadeye yatsın mı? Net getiri ~" + money(HS.depositNet(s, amt, depMonths)) + ". Vade bitene kadar çekemezsin.", yes: "Yatır" })) : " disabled"}>${f === 1 ? "Nakdin hepsi" : "%" + f * 100} · ${money(amt)}</button>`;
    }).join("")}</div>`;
    s.deposits.forEach((d) => (html += rows([row("Vadeli · " + money(d.amt) + " · " + d.months + " ay", Math.max(0, Math.ceil((d.until - s.weeks) / 4.33)) + " ay kaldı · beklenen net faiz " + money(d.amt * d.rate * (d.months / 12) * (1 - R.stopaj)), { depositBreak: d.id }, { icon: "bank", confirm: "Vadeyi bozarsan işlemiş faizin tamamı yanar. Emin misin?", yes: "Boz" })])));
    // Kart
    html += sectionTitle("Kredi kartı", "Aylık akdi faiz " + pctS(R.card) + " · gecikme " + pctS(R.cardLate) + " · asgari ödeme %20");
    if (!s.card) html += rows([row("Kredi kartına başvur", "Önerilen limit " + money(HS.cardOffer(s)) + " · onay şansı %" + Math.round(HS.cardChance(s) * 100), { cardApply: 1 }, { icon: "credit-card" })]);
    else {
      const k = s.card;
      const inst = (k.inst || []).filter((i) => i.left > 0);
      html += card(
        "",
        `Limit ${money(k.limit)} · Borç <b>${money(k.bal)}</b> · Kullanılabilir ${money(HS.cardAvail(s))}${k.blocked ? ' · <b class="neg">KULLANIMA KAPALI</b>' : ""}<br>` +
          (k.stmt > 1 ? `Son ekstre ${money(k.stmt)} · ödenen ${money(k.paid)} · asgari ${money(k.minDue)} · son ödeme ${k.due >= s.weeks ? k.due - s.weeks + " hafta sonra" : "geçti"}<br>` : "Ekstre ay sonunda kesilir.<br>") +
          (inst.length ? "Taksitler: " + inst.map((i) => esc(i.name) + " " + i.left + "×" + money(i.amt)).join(", ") + "<br>" : "") +
          `Otomatik ödeme: <b>${{ off: "kapalı", min: "asgari tutar", full: "ekstrenin tamamı" }[k.auto]}</b>${k.late ? ' · <b class="neg">' + k.late + " geciken ekstre</b>" : ""}`,
      );
      html += `<div class="mini-row wide">
        <button class="mini"${k.stmt - k.paid > 1 && s.cash > 1 ? on(() => act({ cardPay: "stmt" })) : " disabled"}>Ekstreyi öde ${money(Math.max(0, k.stmt - k.paid))}</button>
        <button class="mini"${k.minDue - k.paid > 1 && s.cash > 1 ? on(() => act({ cardPay: "min" })) : " disabled"}>Asgariyi öde ${money(Math.max(0, k.minDue - k.paid))}</button>
        <button class="mini"${k.bal > 1 && s.cash > 1 ? on(() => act({ cardPay: "all" })) : " disabled"}>Tüm borcu kapat</button></div>`;
      html += `<div class="seg mini-seg">${[["off", "Talimat yok"], ["min", "Asgari"], ["full", "Tamamı"]].map(([v, l]) => `<button class="${k.auto === v ? "selected" : ""}"${on(() => act({ cardAuto: v }))}>${l}</button>`).join("")}</div>`;
      html += rows([row("Limit artışı iste", "Bir yıl düzgün kullanımdan sonra gelirin 4 katına kadar", { cardLimitUp: 1 }, { icon: "chart-increasing" }), row("Kartı kapat", "Borç sıfır olmalı", { cardClose: 1 }, { icon: "scissors", confirm: "Kredi kartını kapatmak istiyor musun?" })]);
    }
    // Krediler
    html += sectionTitle("Krediler", "İhtiyaç " + pctS(R.ihtiyac) + " · taşıt " + pctS(R.tasit) + " aylık (vergiler dahil) · taksitler gelirinin yarısını geçemez");
    const mx = HS.loanMax(s, loanSel.kind);
    const amt = Math.floor((mx * loanSel.frac) / 1000) * 1000;
    const mon = HS.loanMonthly(amt, R[loanSel.kind], loanSel.months);
    html += `<div class="loan-form"><div class="seg mini-seg">${Object.entries(HS.LOANS).map(([k, l]) => `<button class="${loanSel.kind === k ? "selected" : ""}"${on(() => ((loanSel.kind = k), renderPanel()))}>${esc(l.name)}</button>`).join("")}</div>
      <div class="seg mini-seg">${[0.25, 0.5, 1].map((f) => `<button class="${loanSel.frac === f ? "selected" : ""}"${on(() => ((loanSel.frac = f), renderPanel()))}>${money(Math.floor((mx * f) / 1000) * 1000)}</button>`).join("")}</div>
      <div class="seg mini-seg">${[12, 24, 36].map((m) => `<button class="${loanSel.months === m ? "selected" : ""}"${on(() => ((loanSel.months = m), renderPanel()))}>${m} ay</button>`).join("")}</div></div>`;
    html += rows([row(HS.LOANS[loanSel.kind].name + " · " + money(amt), amt > 0 ? "Aylık " + money(mon) + " × " + loanSel.months + " = " + money(mon * loanSel.months) + " · onay şansı %" + Math.round(HS.loanChance(s, loanSel.kind, amt) * 100) : "Gelirine göre çekilebilecek kredi yok.", { loanApply: { kind: loanSel.kind, amt, months: loanSel.months } }, { icon: "money-bag", off: amt <= 0 ? "Düzenli gelir ve boş taksit payı gerekir." : null, confirm: money(amt) + " kredi başvurusu yapılsın mı? Aylık taksit " + money(mon) + "." })]);
    s.loans.forEach((l) => (html += rows([row(l.name + " · kalan " + money(l.left), "Aylık " + money(l.monthly) + " · erken kapama %2 ücretli", { loanClose: l.id }, { icon: "money-with-wings", confirm: "Krediyi " + money(l.left * 1.02) + " ödeyerek kapatmak istiyor musun?" })])));
    // Faturalar
    html += sectionTitle("Faturalar", s.housing === "aile" ? "Aile evinde yalnızca kendi telefon faturan sende" : "Her ay gelir; 2 hafta içinde ödenmezse gecikme bedeli, 1 ay sonra kesinti");
    if (!s.bills.length) html += card("", "Ödenmemiş faturan yok. " + (s.billAuto ? "Otomatik ödeme talimatın açık." : ""));
    else {
      html += `<div class="bills">${s.bills
        .map((b) => `<div class="bill${b.late ? " late" : ""}"><span>${esc(b.name)}${s.cut[b.k] ? " · <b class='neg'>kesik</b>" : ""}</span><small>${b.late ? "gecikmiş" : "son ödeme " + Math.max(0, b.due - s.weeks) + " hafta"}</small><b>${money(b.amt * (b.late ? 1.05 : 1))}</b><button class="mini"${HS.canApply(s, { billPay: b.id }) === true ? on(() => act({ billPay: b.id })) : " disabled"}>Öde</button></div>`)
        .join("")}</div>`;
      html += rows([row("Hepsini öde", money(s.bills.reduce((a, b) => a + b.amt * (b.late ? 1.05 : 1), 0)), { billPay: "all" }, { icon: "page-facing-up" })]);
    }
    html += `<button class="setting"${on(() => act({ billAuto: !s.billAuto }))}><span><b>Otomatik fatura ödeme talimatı</b><small>Faturalar gelince nakitten (yetmezse karttan) ödenir</small></span><i class="switch${s.billAuto ? " on" : ""}"></i></button>`;
    if (s.debt > 1) html += rows([row("Takipteki borcu öde", "Nakdin kadarını kapat · faiz işliyor", { payDebt: 1 }, { icon: "money-with-wings" })]);
    return html;
  }

  // ---------- Kayıtlar ----------
  function records() {
    const box = $("recordList");
    box.innerHTML = "";
    if (!saves.length) box.innerHTML = '<div class="card"><h3>Henüz kayıt yok</h3><p class="fine">İlk hayatını oluşturarak başla.</p></div>';
    saves.forEach((s) => {
      const d = document.createElement("div");
      d.className = "card record" + (s === active ? " current" : "");
      const status = s.alive ? s.city + " · " + s.age + " yaş · " + (s.retired ? "Emekli" : s.job === "none" ? "İş arıyor" : HS.Skills.title(s)) : (s.final ? s.final.title : "Tamamlandı") + " · " + s.age + " yaş";
      d.innerHTML =
        `<div class="face"><svg viewBox="24 6 72 72">${Art.person(Art.fromState(s))}</svg></div>` +
        "<div><h3>" + esc(s.first + " " + s.last) + "</h3><p>" + esc(status) + "</p></div>" +
        `<div class="record-actions"><button class="go" data-open="${s.id}">${s.alive ? "Devam et" : "Anı defteri"}</button><button class="del" data-del="${s.id}" aria-label="Sil">✕</button></div>`;
      box.append(d);
    });
    box.querySelectorAll("[data-open]").forEach((b) => {
      b.onclick = () => {
        active = saves.find((s) => s.id === b.dataset.open);
        if (!active.alive) memoir();
        else openWorld();
      };
    });
    box.querySelectorAll("[data-del]").forEach((b) => {
      b.onclick = () => {
        const s = saves.find((x) => x.id === b.dataset.del);
        ask(s.first + " " + s.last + " kaydı silinsin mi? Bu geri alınamaz.", () => {
          saves = saves.filter((x) => x !== s);
          if (active === s) active = null;
          persist();
          records();
        }, "Sil");
      };
    });
    $("endCurrent").classList.toggle("hidden", !(active && active.alive));
    page("records");
  }

  // ---------- Ayarlar ----------
  function setSetting(k, v) {
    settings[k] = v;
    store.set(SET_KEY, settings);
    if (HS.Audio && ["music", "sfx", "vibration", "volume"].includes(k)) HS.Audio.set(k, v);
    applyText();
    renderSettings();
  }
  function applyText() {
    document.documentElement.classList.toggle("big-text", settings.text === "big");
  }
  function renderSettings() {
    const tg = (k, label, hint) => `<button class="setting" data-k="${k}" role="switch" aria-checked="${!!settings[k]}"><span><b>${label}</b><small>${hint}</small></span><i class="switch${settings[k] ? " on" : ""}"></i></button>`;
    $("settingsBody").innerHTML =
      `<article class="card"><h3>Ses</h3>` +
      tg("music", "Müzik", "Hafif, akustik oyun müziği") +
      tg("sfx", "Ses efektleri", "Tuş sesleri, kazanma ve kaybetme sesleri") +
      tg("vibration", "Titreşim", "Destekleyen telefonlarda (iPhone tarayıcıda desteklenmez)") +
      `<label class="range"><span>Ses düzeyi</span><input type="range" id="volume" min="0" max="1" step="0.05" value="${settings.volume}"></label></article>` +
      `<article class="card"><h3>Oynanış</h3>` +
      tg("commute", "İşe gidiş ve eve dönüş", "Hafta içi sabah işe gidişi ve akşam eve dönüşü göster") +
      `<button class="setting" data-text="1"><span><b>Yazı boyutu</b><small>${settings.text === "big" ? "Büyük" : "Normal"}</small></span><i class="pill">${settings.text === "big" ? "A+" : "A"}</i></button></article>` +
      `<article class="card"><h3>Hesap</h3><p class="fine">App Store ve Google Play sürümünde kayıtların Apple ile giriş / Game Center ya da Google Play Oyunlar hesabına bağlanabilecek. Bu tarayıcı prototipinde kayıtlar yalnızca bu cihazda tutulur.</p><button class="secondary" disabled>Hesabını bağla (mağaza sürümünde)</button></article>` +
      `<article class="card"><h3>Kayıtlar</h3><p class="fine">Kayıtlarını başka bir cihaza taşımak için kodu kopyala, diğer cihazda yapıştır.</p><button class="secondary" id="exportBtn">Kayıt kodunu kopyala</button><textarea id="importBox" rows="3" placeholder="Kayıt kodunu buraya yapıştır" aria-label="Kayıt kodu"></textarea><button class="secondary" id="importBtn">Kodu içe aktar</button><button class="secondary danger" id="wipeBtn">Bütün verileri sil</button></article>` +
      `<article class="card"><h3>Hakkında</h3><p class="fine">Hayat Simülatörü · prototip sürüm 0.3<br>Çizimler: Microsoft Fluent Emoji (MIT). Harita: Natural Earth verisi, react-turkey-map (MIT). Yazı tipleri: Baloo 2 ve Nunito (SIL OFL).<br>Ekonomi 2026 verileriyle kalibre edilmiştir; 2027 sonrası kurmacadır. Kişi, parti, şirket ve markalar hayal ürünüdür. Yatırım ve bahis bölümleri tavsiye değildir.</p></article>`;
    $("settingsBody").querySelectorAll("[data-k]").forEach((b) => (b.onclick = () => setSetting(b.dataset.k, !settings[b.dataset.k])));
    $("settingsBody").querySelector("[data-text]").onclick = () => setSetting("text", settings.text === "big" ? "normal" : "big");
    $("volume").oninput = (e) => {
      settings.volume = +e.target.value;
      store.set(SET_KEY, settings);
      if (HS.Audio) HS.Audio.set("volume", settings.volume);
    };
    $("exportBtn").onclick = () => {
      const code = btoa(unescape(encodeURIComponent(JSON.stringify(saves))));
      const done = () => toast("Kayıt kodu kopyalandı.");
      try {
        navigator.clipboard.writeText(code).then(done, () => {
          $("importBox").value = code;
          $("importBox").select();
          toast("Kod aşağıya yazıldı; seçip kopyalayabilirsin.");
        });
      } catch {
        $("importBox").value = code;
        $("importBox").select();
      }
    };
    $("importBtn").onclick = () => {
      try {
        const arr = JSON.parse(decodeURIComponent(escape(atob($("importBox").value.trim()))));
        if (!Array.isArray(arr)) throw 0;
        const add = arr.filter((x) => x && x.id && !saves.some((y) => y.id === x.id)).map((x) => HS.migrate(x));
        saves = saves.concat(add);
        persist();
        toast(add.length + " hayat içe aktarıldı.");
      } catch {
        toast("Kod okunamadı.", "error");
      }
    };
    $("wipeBtn").onclick = () =>
      ask("Bütün hayatlar, keşfedilen sonlar ve ayarlar silinsin mi? Bu geri alınamaz.", () => {
        saves = [];
        active = null;
        [SAVE_KEY, PROFILE_KEY, ACH_KEY].forEach((k) => store.set(k, null));
        toast("Bütün veriler silindi.");
        page("home");
      }, "Sil");
  }

  // ---------- Son ve anı defteri ----------
  function finish() {
    showScenes(() => memoir(true));
  }
  function memoir(fresh) {
    const s = active,
      f = s.final || (s.final = HS.Endings.compose(s));
    const count = addProfile(f.key);
    save();
    $("memoirScene").innerHTML = Art.scene(s, "salon");
    $("memoirKicker").textContent = "ANI DEFTERİ · " + s.first + " " + s.last;
    $("memoirTitle").textContent = f.heading;
    $("memoirArch").textContent = f.title + " · " + f.stats.age + " yaş · " + f.stats.weeks + " hafta";
    $("memoirBody").innerHTML = f.paragraphs.map((p) => "<p>" + esc(p) + "</p>").join("");
    $("memoirChart").innerHTML = chart(s);
    $("memoirMoments").innerHTML = (f.moments.length ? f.moments : ["Kayda geçen büyük bir dönemeç yok."]).map((m) => "<li>" + esc(m) + "</li>").join("");
    $("memoirAch").innerHTML = achGrid(s);
    $("memoirProfile").innerHTML = HS.Endings.DIMS.map((d) => "<dt>" + esc(d.name) + "</dt><dd>" + esc(HS.Endings.label(d.id, f.profile[d.id])) + "</dd>").join("");
    $("memoirCount").textContent = "Bu cihazda keşfedilen farklı son profili: " + count + " · Olası geçerli profil sayısı: " + HS.Endings.spaceSize().toLocaleString("tr-TR") + ".";
    page("memoir");
    if (fresh) {
      toast("Hayat tamamlandı ve anı defterine kaydedildi.");
      sfx("notify");
    }
  }

  // ---------- Bağlantılar ----------
  function init() {
    load();
    applyText();
    if (HS.Audio) HS.Audio.init({ music: settings.music, sfx: settings.sfx, vibration: settings.vibration, volume: settings.volume });
    $("birthCity").innerHTML = HS.HOME_CITIES.map((c) => `<option${c === "İstanbul" ? " selected" : ""}>${esc(c)}</option>`).join("");
    const toCreate = () => {
      page("create");
      renderCreate();
    };
    $("newLife").onclick = toCreate;
    $("recordNew").onclick = toCreate;
    $("lookPicker").querySelectorAll("button").forEach((b) => {
      b.onclick = () => {
        create.look = b.dataset.look;
        create.hair = create.look === "man" ? "short" : "long";
        renderCreate();
      };
    });
    $("continueLife").onclick = records;
    $("menuBtn").onclick = records;
    $("slotPill").onclick = records;
    $("settingsBtn").onclick = () => {
      settings._from = PAGES.find((p) => !$(p).classList.contains("hidden"));
      renderSettings();
      page("settings");
    };
    $("beginLife").onclick = begin;
    $("memoirDone").onclick = records;
    $("recordBack").onclick = () => (active?.alive ? openWorld() : page("home"));
    $("backBtn").onclick = () => {
      if (!$("settings").classList.contains("hidden")) return settings._from === "world" && active?.alive ? openWorld() : page(settings._from && settings._from !== "settings" ? settings._from : "home");
      if (!$("world").classList.contains("hidden")) return records();
      if (!$("records").classList.contains("hidden")) return active?.alive ? openWorld() : page("home");
      if (!$("memoir").classList.contains("hidden")) return records();
      page("home");
    };
    $("endCurrent").onclick = () => {
      if (!active?.alive) return;
      ask("Bu hayatı burada sonlandırıp anı defterine kaydetmek istiyor musun?", () => {
        HS.endLife(active, "chosen");
        save();
        memoir(true);
      }, "Sonlandır");
    };
    $("nameInput").addEventListener("keydown", (e) => e.key === "Enter" && $("nameOk").click());
    // Genel buton sesi (panel dışındaki butonlar)
    document.addEventListener("click", (e) => {
      const b = e.target.closest("button");
      if (b && !b.closest("#panel") && !b.disabled) {
        sfx("tap");
        buzz("tap");
      }
    });
    homeScene();
    page("home");
    if (saves.some((s) => s.alive)) $("continueLife").textContent = "Kayıtlı hayatlara devam et";
  }
  init();
  HS.ui = {
    records,
    render,
    get active() {
      return active;
    },
    get settings() {
      return settings;
    },
  };
})(globalThis.HS || (globalThis.HS = {}));
