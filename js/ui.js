// Arayüz: ekranlar, sahne, sekmeler, boş zaman, kayıtlar ve anı defteri.
(function (HS) {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const SAVE_KEY = "hayatSimulatuoruSavesV1"; // eski sürümle aynı anahtar: kayıtlar korunur
  const PROFILE_KEY = "hayatSimEndingProfilesV2";
  const PAGES = ["home", "create", "world", "records", "memoir"];
  const money = HS.money;
  const Art = HS.Art;
  const esc = (t) =>
    String(t).replace(
      /[&<>"']/g,
      (x) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[x],
    );
  const reduced = () =>
    window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  const TABS = [
    { id: "life", label: "HAYAT", icon: "house" },
    { id: "work", label: "İŞ", icon: "briefcase" },
    { id: "style", label: "STİL", icon: "t-shirt" },
    { id: "people", label: "İNSANLAR", icon: "people-hugging" },
    { id: "city", label: "ŞEHİR", icon: "office-building" },
    { id: "money", label: "PARA", icon: "money-bag" },
  ];
  const HAIRS = {
    short: "Kısa",
    long: "Uzun",
    curly: "Kıvırcık",
    bun: "Topuz",
    shaved: "Kazınmış",
  };

  let saves = [],
    active = null,
    selected = -1,
    tab = "life",
    sceneSig = "",
    create = { look: "woman", skin: 1, hairColor: "kahve", hair: "long" };

  // ---------- Kayıt ----------
  function load() {
    try {
      saves = JSON.parse(localStorage.getItem(SAVE_KEY) || "[]");
      if (!Array.isArray(saves)) saves = [];
    } catch {
      saves = [];
    }
    saves = saves
      .filter((s) => s && s.id)
      .map((s) => {
        try {
          return HS.migrate(s);
        } catch {
          return null;
        }
      })
      .filter(Boolean);
  }
  function persist() {
    try {
      localStorage.setItem(SAVE_KEY, JSON.stringify(saves));
    } catch {
      toast("Cihazda kayıt alanı kalmamış olabilir.");
    }
  }
  function save() {
    if (!active) return;
    const i = saves.findIndex((x) => x.id === active.id);
    if (i < 0) saves.push(active);
    else saves[i] = active;
    persist();
  }
  function profiles() {
    try {
      const p = JSON.parse(localStorage.getItem(PROFILE_KEY) || "[]");
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  function addProfile(key) {
    const p = profiles();
    if (!p.includes(key)) {
      p.push(key);
      try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(p));
      } catch {}
    }
    return p.length;
  }

  // ---------- Gezinme ----------
  function page(id) {
    PAGES.forEach((x) => $(x).classList.toggle("hidden", x !== id));
    $("event").classList.add("hidden");
    $("backBtn").style.visibility = id === "home" ? "hidden" : "visible";
    $("menuBtn").style.visibility = id === "world" ? "visible" : "hidden";
    $(id).scrollTop = 0;
  }
  function toast(t) {
    $("toast").textContent = t;
    $("toast").classList.remove("hidden");
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => $("toast").classList.add("hidden"), 2600);
  }
  function ask(text, onYes, yesLabel = "Evet") {
    $("confirmText").textContent = text;
    $("confirmYes").textContent = yesLabel;
    $("confirmModal").classList.remove("hidden");
    $("confirmYes").onclick = () => {
      $("confirmModal").classList.add("hidden");
      onYes();
    };
    $("confirmNo").onclick = () => $("confirmModal").classList.add("hidden");
  }

  // ---------- Ana ekran ve oluşturma ----------
  function homeScene() {
    const demo = HS.newLife({
      first: "",
      last: "",
      city: "İstanbul",
      look: "woman",
    });
    demo.week = 24;
    demo.car = "scooter";
    demo.partner = { name: "Bora", bond: 80, married: false };
    $("homeScene").innerHTML = Art.scene(demo);
  }
  function renderCreate() {
    const p = {
      gender: create.look,
      skin: create.skin,
      hair: create.hair,
      hairColor: create.hairColor,
      age: 18,
      outfit: "gunluk",
      mood: 1,
    };
    $("preview").innerHTML =
      `<svg viewBox="0 0 120 220">${Art.person(p)}</svg>`;
    $("lookPicker")
      .querySelectorAll("button")
      .forEach((b) =>
        b.classList.toggle("selected", b.dataset.look === create.look),
      );
    $("skinPicker").innerHTML = Art.SKINS.map(
      (c, i) =>
        `<button style="background:${c}" data-i="${i}" class="${i === create.skin ? "selected" : ""}" aria-label="Ten rengi ${i + 1}"></button>`,
    ).join("");
    $("hairColorPicker").innerHTML = Object.entries(Art.HAIR_COLORS)
      .map(
        ([k, c]) =>
          `<button style="background:${c}" data-k="${k}" class="${k === create.hairColor ? "selected" : ""}" aria-label="${Art.HAIR_NAMES[k]}"></button>`,
      )
      .join("");
    const hairs =
      create.look === "man"
        ? ["short", "curly", "long", "shaved"]
        : ["long", "bun", "curly", "short"];
    if (!hairs.includes(create.hair)) create.hair = hairs[0];
    $("hairPicker").innerHTML = hairs
      .map(
        (h) =>
          `<button data-h="${h}" class="${h === create.hair ? "selected" : ""}">${HAIRS[h]}</button>`,
      )
      .join("");
    $("skinPicker")
      .querySelectorAll("button")
      .forEach(
        (b) =>
          (b.onclick = () => ((create.skin = +b.dataset.i), renderCreate())),
      );
    $("hairColorPicker")
      .querySelectorAll("button")
      .forEach(
        (b) =>
          (b.onclick = () => (
            (create.hairColor = b.dataset.k),
            renderCreate()
          )),
      );
    $("hairPicker")
      .querySelectorAll("button")
      .forEach(
        (b) =>
          (b.onclick = () => ((create.hair = b.dataset.h), renderCreate())),
      );
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

  // ---------- Dünya ----------
  function render() {
    const s = active;
    if (!s) return;
    $("personName").textContent = s.first + " " + s.last;
    $("slotPill").textContent = "HAYAT " + (saves.indexOf(s) + 1);
    $("ageTag").textContent = s.age + " YAŞ";
    $("weekLabel").textContent = s.year + " · " + s.week + ". hafta";
    $("dateLabel").textContent =
      HS.upper(s.city) +
      (HS.CITIES[s.city]?.country
        ? " · " + HS.upper(HS.CITIES[s.city].country)
        : "");
    $("cashStat").textContent = money(s.cash);
    $("healthStat").textContent = Math.round(s.health);
    $("moodStat").textContent = Math.round(s.mood);
    $("healthBar").style.width = s.health + "%";
    $("moodBar").style.width = s.mood + "%";
    const parts = [];
    if (s.savings > 1) parts.push("Banka " + money(s.savings));
    if (s.fund > 1) parts.push("Fon " + money(s.fund));
    if (s.debt > 1) parts.push('<b class="neg">Borç ' + money(s.debt) + "</b>");
    if (s.mortgage) parts.push("Kredi " + money(s.mortgage.left));
    $("moneyLine").innerHTML = parts.join(" · ") || "Henüz birikim yok";
    drawScene();
    $("tabbar").innerHTML = TABS.map(
      (t) =>
        `<button class="tab${t.id === tab ? " active" : ""}" data-tab="${t.id}" aria-label="${t.label}">${Art.icon(t.icon, 24)}<small>${t.label}</small></button>`,
    ).join("");
    $("tabbar")
      .querySelectorAll(".tab")
      .forEach((b) => {
        b.onclick = () => {
          tab = b.dataset.tab;
          render();
          $("world").scrollTop = 0;
        };
      });
    $("panel").classList.toggle("hidden", tab !== "life");
    $("tabPanel").classList.toggle("hidden", tab === "life");
    if (tab === "life") {
      renderEvent();
      renderFree();
    } else renderTab(tab);
  }
  // Sahne yalnızca görünür bir şey değişince yeniden çizilir; animasyonlar kesilmesin.
  function drawScene() {
    const s = active;
    const sig = JSON.stringify([
      s.city,
      s.week,
      s.age,
      s.job,
      s.housing,
      s.homeType,
      s.homeV,
      s.car,
      s.carColor,
      s.outfit,
      s.hair,
      s.hairColor,
      s.beard,
      s.thinning,
      s.transplanted,
      s.mood >= 62 ? 1 : s.mood < 35 ? -1 : 0,
      s.partner && [s.partner.bond >= 55, s.partner.married],
      s.children.map(
        (k) =>
          k.name +
          (s.year - k.born < 4
            ? 0
            : s.year - k.born < 11
              ? 1
              : s.year - k.born < 18
                ? 2
                : 3),
      ),
      s.flags.kedi,
      s.edu,
    ]);
    if (sig === sceneSig) return;
    sceneSig = sig;
    $("sceneArt").innerHTML = Art.scene(s);
  }
  function react(delta) {
    if (Math.abs(delta) < 3) return;
    const el = $("scene");
    el.classList.remove("react-up", "react-down");
    void el.offsetWidth;
    el.classList.add(delta > 0 ? "react-up" : "react-down");
    setTimeout(() => el.classList.remove("react-up", "react-down"), 1300);
  }

  function renderEvent() {
    const s = active,
      ev = s.current;
    const seasonName = {
      kis: "Kış",
      ilkbahar: "İlkbahar",
      yaz: "Yaz",
      sonbahar: "Sonbahar",
    }[Art.season(s)];
    $("seasonLabel").textContent = seasonName;
    const tags = [
      s.retired
        ? "Emekli"
        : s.edu === "ogrenci"
          ? "Öğrenci"
          : HS.JOBS[s.job].name,
    ];
    if (s.partner) tags.push(s.partner.married ? "Evli" : "İlişkisi var");
    if (s.children.length) tags.push(s.children.length + " çocuk");
    $("tagsLine").textContent = tags.join(" · ");
    $("storyTitle").textContent = ev.t;
    $("storyText").textContent = ev.p;
    selected = -1;
    const box = $("choices");
    box.innerHTML = "";
    ev.c.forEach((c, i) => {
      const b = document.createElement("button");
      b.className = "choice";
      b.disabled = !!c.off;
      b.innerHTML =
        '<span class="bullet">' +
        String.fromCharCode(65 + i) +
        "</span><span><b>" +
        esc(c.label) +
        "</b><small>" +
        esc(c.off ? "🔒 " + c.off : c.hint) +
        "</small></span>" +
        (c.odds != null && !c.off
          ? '<span class="odds-tag" title="Başarı şansı">🎲 %' +
            c.odds +
            "</span>"
          : "");
      b.onclick = () => {
        selected = i;
        box
          .querySelectorAll(".choice")
          .forEach((x, j) => x.classList.toggle("selected", j === i));
        $("advanceBtn").disabled = false;
      };
      box.append(b);
    });
    $("advanceBtn").disabled = true;
  }

  function renderFree() {
    const s = active;
    const total = Math.max(s.free, HS.freeSlots(s));
    $("freeDots").innerHTML = Array.from(
      { length: total },
      (_, i) => `<i class="${i < s.free ? "" : "used"}"></i>`,
    ).join("");
    $("freeHint").textContent = s.free
      ? "Haftanı yaşamadan önce " +
        s.free +
        " boş zamanın var. Her etkinlik haftada bir kez yapılır."
      : "Bu haftanın boş zamanı bitti. Kararını verip haftayı yaşayabilirsin.";
    const done = s.flags.actDone || {};
    $("acts").innerHTML = HS.ACTIVITIES.filter((a) => !a.when || a.when(s))
      .map(
        (a) =>
          `<button class="act${done[a.id] ? " done" : ""}" data-a="${a.id}"${done[a.id] || !s.free ? " disabled" : ""}>${Art.icon(a.art, 32)}<b>${esc(a.label)}</b><small>${esc(done[a.id] ? "Yapıldı" : a.hint)}</small></button>`,
      )
      .join("");
    $("acts")
      .querySelectorAll("[data-a]")
      .forEach((b) => {
        b.onclick = () => {
          const before = active.mood;
          const r = HS.doActivity(active, b.dataset.a);
          if (!r.ok) return toast(r.reason);
          save();
          render();
          react(active.mood - before);
          if (r.text && !active.scenes.length) toast(r.text);
          showScenes();
        };
      });
    $("appsLine").innerHTML = (s.apps || [])
      .map(
        (a) =>
          `<span class="app-chip">${esc(HS.JOBS[a.job].name)} · %${Math.round(a.p * 100)} · ${Math.max(0, a.due - s.weeks)} hafta</span>`,
      )
      .join("");
  }

  function advance() {
    if (selected < 0 || !active?.current) return;
    const ch = active.current.c[selected];
    if (ch.fx.child === "CUSTOM") return askName((n) => doChoose(n));
    doChoose();
  }
  function doChoose(name) {
    const before = active.mood;
    const r = HS.choose(active, selected, name);
    if (r.ok === false) {
      toast(r.reason);
      return;
    }
    save();
    if (r.ended) return finish();
    tab = "life";
    render();
    $("world").scrollTop = 0;
    react(active.mood - before);
    showScenes();
  }

  // Ara sahneler sırayla gösterilir; şanslı sonuçlarda kısa bir bekleyiş olur.
  function showScenes(after) {
    const s = active;
    if (!s || !s.scenes.length) {
      if (after) after();
      return;
    }
    const sc = s.scenes.shift();
    save();
    const card = $("eventCard");
    card.className = "event-card" + (sc.kind ? " " + sc.kind : "");
    $("eventOdds").classList.toggle("hidden", sc.odds == null);
    $("eventOdds").textContent = sc.odds != null ? "🎲 Şans %" + sc.odds : "";
    $("event").classList.remove("hidden");
    const reveal = () => {
      $("suspense").classList.add("hidden");
      $("eventArt").textContent = sc.art || "✦";
      $("eventTitle").textContent = sc.t;
      $("eventText").textContent = sc.p || "";
      $("eventArt").classList.remove("hidden");
      $("eventContinue").classList.remove("hidden");
      if (sc.kind) card.className = "event-card " + sc.kind;
    };
    if (sc.odds != null && !reduced()) {
      card.className = "event-card";
      $("eventArt").classList.add("hidden");
      $("eventTitle").textContent = "Sonuç bekleniyor…";
      $("eventText").textContent = "";
      $("eventContinue").classList.add("hidden");
      $("suspense").classList.remove("hidden");
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
      if (!v) return toast("Bir isim yaz.");
      $("nameModal").classList.add("hidden");
      cb(v);
    };
    $("nameCancel").onclick = () => $("nameModal").classList.add("hidden");
  }

  // ---------- Sekmeler ----------
  // Sekme eylemleri haftayı ilerletmez; useFree olanlar bir boş zaman harcar.
  function act(fx, opt = {}, confirmed = false) {
    const s = active;
    if (opt.weekly) {
      s.flags.tabUse = s.flags.tabUse || {};
      if (s.flags.tabUse[opt.weekly] === s.weeks)
        return toast("Bunu bu hafta zaten yaptın.");
    }
    if (opt.confirm && !confirmed)
      return ask(opt.confirm, () => act(fx, opt, true), opt.yes);
    const before = s.mood;
    const r = HS.quickAction(s, fx);
    if (r !== true) return toast(r);
    if (opt.weekly) s.flags.tabUse[opt.weekly] = s.weeks;
    if (opt.done) toast(opt.done);
    save();
    render();
    react(s.mood - before);
    showScenes();
  }
  function row(label, hint, fx, opt = {}) {
    let off = opt.off || null;
    if (!off) {
      const c = HS.canApply(active, fx);
      if (c !== true) off = c;
    }
    if (
      !off &&
      opt.weekly &&
      active.flags.tabUse?.[opt.weekly] === active.weeks
    )
      off = "Bu hafta yapıldı.";
    return { label, hint, fx, opt, off, icon: opt.icon };
  }
  const bar = (v) =>
    '<i class="bar inline"><i style="width:' + Math.round(v) + '%"></i></i>';
  function rowsHtml(rows, start = 0) {
    return (
      '<div class="choice-list">' +
      rows
        .filter(Boolean)
        .map(
          (r, i) =>
            `<button class="choice" data-r="${start + i}"${r.off ? " disabled" : ""}><span class="bullet">${r.icon ? Art.icon(r.icon, 24) : i + 1}</span><span><b>${esc(r.label)}</b><small>${esc(r.off ? "🔒 " + r.off : r.hint)}</small></span></button>`,
        )
        .join("") +
      "</div>"
    );
  }

  function renderTab(t) {
    const box = $("tabPanel");
    const all = []; // tüm satırlar (data-r indeksleri)
    const sec = (title, body, rows) => {
      const list = rows.filter(Boolean);
      const html =
        `<article class="card"><h3>${esc(title)}</h3>${body ? "<p>" + body + "</p>" : ""}</article>` +
        (list.length ? rowsHtml(list, all.length) : "");
      all.push(...list);
      return html;
    };
    const s = active,
      E = HS.ECONOMY,
      cpi = s.idx.cpi,
      M = HS.WEEKS_PER_MONTH;
    let html = "";

    if (t === "work") {
      const b = HS.budget(s);
      const lines = [
        s.retired
          ? "Emeklisin. Aylık emekli maaşın " + money(HS.pension(s)) + "."
          : s.job === "none"
            ? "Şu an çalışmıyorsun."
            : esc(HS.JOBS[s.job].name) +
              " · kademe " +
              (s.jobLevel + 1) +
              "/3 · " +
              Math.floor(s.jobWeeks / 52) +
              " yıl " +
              (s.jobWeeks % 52) +
              " hafta",
        "Eğitim: " +
          {
            lise: "lise",
            ogrenci:
              "üniversite öğrencisi (%" +
              Math.min(100, Math.round((s.eduWeeks / 208) * 100)) +
              ")",
            universite: "üniversite mezunu",
            yarim: "üniversiteyi yarıda bıraktı",
          }[s.edu] +
          " · Beceri " +
          Math.round(s.skill),
        "Aylık: gelir " +
          money(b.income * M) +
          " · yaşam " +
          money(b.living * M) +
          (b.rent ? " · kira " + money(b.rent * M) : "") +
          (b.kids ? " · çocuk " + money(b.kids * M) : "") +
          (b.mortgage ? " · kredi " + money(b.mortgage * M) : ""),
      ];
      html += sec("İş ve eğitim", lines.join("<br>"), []);
      if (!s.retired) {
        const jobs = [
          "cafe",
          "factory",
          "music",
          "office",
          "teacher",
          "nurse",
          "memur",
        ].filter((j) => j !== s.job);
        html += `<div class="section-title">İş başvurusu</div><p class="fine">Başvuru bir boş zaman harcar. Sonuç 1-3 hafta içinde gelir; bazı işlerde mülakat olur. Uygun kıyafet şansı artırır.</p>`;
        html += sec(
          "",
          "",
          jobs.map((j) =>
            row(
              HS.JOBS[j].name,
              "Aylık " +
                (HS.JOBS[j].volatile ? "ort. " : "") +
                money(HS.wage(s, j, 0)) +
                " · kabul şansı %" +
                Math.round(HS.appChance(s, j) * 100) +
                (HS.outfitFits(s, j) ? " · kıyafetin uygun" : ""),
              { apply: j, useFree: 1 },
              { done: "Başvurun gönderildi. Sonucu bekle." },
            ),
          ),
        ).replace(/<article class="card"><h3><\/h3><\/article>/, "");
        const shop = HS.JOBS.business;
        html += sec("Kendi işin", "", [
          s.job !== "business"
            ? row(
                "Dükkân aç",
                "Sermaye " +
                  money(shop.startup * cpi) +
                  " · kazanç ay ay değişir.",
                { job: "business" },
                {
                  confirm: "Dükkân açmak için sermaye ödeyeceksin. Emin misin?",
                  done: "Dükkânın açıldı!",
                },
              )
            : null,
          s.job !== "none"
            ? row(
                "İşten ayrıl",
                "Gelirin kesilir.",
                { job: "none" },
                { confirm: "İşinden ayrılmak istediğine emin misin?" },
              )
            : null,
        ]).replace(
          /<article class="card"><h3>Kendi işin<\/h3><\/article>/,
          '<div class="section-title">Kendi işin</div>',
        );
      }
    } else if (t === "style") {
      const outs = Object.entries(Art.OUTFITS).filter(
        ([k, o]) => !(o.type === "dress" && s.look === "man"),
      );
      const P = Art.fromState(s);
      html += `<article class="card"><h3>Gardırop</h3><p>Giydiğin kıyafet sahnede görünür. İşine uygun kıyafet başvurularda ve terfide şansını artırır.</p></article><div class="outfits">`;
      outs.forEach(([k, o]) => {
        const owned = s.outfits.includes(k);
        const on = s.outfit === k;
        const fits =
          s.job !== "none" && HS.outfitFits({ ...s, outfit: k }, s.job);
        html += `<button class="outfit${on ? " on" : ""}" data-o="${k}"><svg viewBox="0 0 120 220">${Art.person({ ...P, outfit: k, mood: 1 })}</svg><b>${esc(o.name)}</b><small${fits ? ' class="fit"' : ""}>${on ? "Giyiliyor" : owned ? "Giy" : money(o.price * cpi)}${fits ? " · işe uygun" : ""}</small></button>`;
      });
      html += "</div>";
      const hairs =
        s.look === "man"
          ? ["short", "curly", "long", "shaved"]
          : ["long", "bun", "curly", "short", "shaved"];
      html += sec(
        "Berber ve kuaför",
        "Saç: " +
          HAIRS[s.hair] +
          (s.beard ? " · sakallı" : "") +
          (s.thinning && !s.transplanted ? " · seyrelmiş" : "") +
          (s.transplanted ? " · ekimli" : ""),
        [
          ...hairs
            .filter((h) => h !== s.hair)
            .map((h) =>
              row(
                HAIRS[h] + " saç",
                "Kuaför " + money(E.haircut * (h === "curly" ? 2.4 : 1) * cpi),
                { hair: h, cost: E.haircut * (h === "curly" ? 2.4 : 1) },
                { weekly: "barber", icon: "barber-pole" },
              ),
            ),
          s.look === "man"
            ? row(
                s.beard ? "Sakalı kestir" : "Sakal bırak",
                "Berber " + money(E.beard * cpi),
                { beard: !s.beard, cost: E.beard },
                { weekly: "beard", icon: "barber-pole" },
              )
            : null,
          ...Object.keys(Art.HAIR_COLORS)
            .filter((k) => k !== s.hairColor)
            .map((k) =>
              row(
                "Saçı boyat: " + Art.HAIR_NAMES[k],
                "Boya " + money(1500 * cpi),
                { hairColor: k, cost: 1500 },
                { weekly: "dye", icon: "scissors" },
              ),
            ),
          s.look === "man" && !s.transplanted
            ? row(
                "Saç ekimi",
                "Kalıcı işlem, " + money(E.transplant * cpi) + ".",
                { transplant: true, m: 3 },
                {
                  confirm: "Saç ekimi yaptırmak istiyor musun?",
                  done: "Saç ekimi tamamlandı.",
                },
              )
            : null,
        ],
      );
    } else if (t === "people") {
      let body = "";
      if (s.partner)
        body +=
          esc(s.partner.name) +
          (s.partner.married ? " · eşin" : " · partnerin") +
          bar(s.partner.bond) +
          "<br>";
      else
        body +=
          "Şu an bir ilişkin yok." +
          (s.exes ? " Geçmişte " + s.exes + " ayrılık." : "") +
          "<br>";
      s.children.forEach(
        (k) =>
          (body +=
            esc(k.name) +
            " · " +
            (s.year - k.born) +
            " yaş" +
            bar(k.bond) +
            "<br>"),
      );
      body +=
        "Yakın çevre: " +
        Math.round(s.people) +
        " kişi. Arkadaşlık ve aile ziyaretleri HAYAT sekmesindeki boş zaman etkinliklerinden yapılır.";
      html += sec("Yakınların", body, [
        s.partner && !s.partner.married
          ? row(
              "Evlenme teklif et",
              "Yüzük ve akşam yemeği " + money(12000 * cpi),
              {
                cost: 12000,
                chance: {
                  p: Math.min(0.95, Math.max(0.1, s.partner.bond / 100 + 0.1)),
                  win: { marry: true, m: 10 },
                  lose: { bond: -12, m: -8 },
                  winT: s.partner.name + " evet dedi!",
                  winP: "Restoranda herkes alkışladı. Nikâh tarihini konuşmaya başladınız.",
                  loseT: "Henüz hazır değil",
                  loseP:
                    s.partner.name +
                    " biraz daha zamana ihtiyacı olduğunu söyledi. Ortam biraz buruk.",
                },
              },
              { weekly: "propose", icon: "ring" },
            )
          : null,
        s.partner
          ? row(
              s.partner.married ? "Boşan" : "Ayrıl",
              "İlişkiyi bitir.",
              { breakup: true, m: -8, cost: s.partner.married ? 20000 : 0 },
              {
                confirm: "Bu ilişkiyi bitirmek istediğine emin misin?",
                icon: "wedding",
              },
            )
          : null,
        !s.flags.kedi
          ? row(
              "Bir kedi sahiplen",
              "Mama ve veteriner " + money(3000 * cpi),
              { cost: 3000, m: 6, flag: "kedi", log: "Bir kedi sahiplendi." },
              { icon: "cat" },
            )
          : null,
      ]);
    } else if (t === "city") {
      const city = HS.CITIES[s.city];
      const sc = HS.SCENARIOS[s.scenario];
      const pct = (k) => "%" + Math.round(HS.rate(s, k) * 100);
      html += sec(
        s.city + (city.country ? " · " + city.country : ""),
        "Ortalama daire kirası " +
          money(HS.rentFull(s)) +
          "/ay" +
          (city.est ? " (tahmini)" : "") +
          " · 70 m² daire " +
          money(HS.homePrice(s, "daire")) +
          ".<br>" +
          s.year +
          " oranları (" +
          (s.year <= E.startYear
            ? "TÜİK Eylül 2026"
            : "kurmaca senaryo: " + sc.name) +
          "): genel " +
          pct("cpi") +
          ", gıda " +
          pct("food") +
          ", ulaşım " +
          pct("transport") +
          ", konut " +
          pct("housing") +
          "." +
          (s.policy !== "neutral"
            ? "<br>Kurmaca politika: " +
              {
                transit: "toplu ulaşım desteği",
                enterprise: "küçük işletme indirimi",
                housing: "kira sınırı",
                family: "aile desteği",
              }[s.policy] +
              "."
            : ""),
        [],
      );
      if (!city.country) {
        html += `<div class="section-title">Başka bir ile taşın</div><div class="move-row"><select id="moveSelect" aria-label="Taşınılacak il">${HS.HOME_CITIES.filter(
          (c) => c !== s.city,
        )
          .map(
            (c) =>
              `<option value="${esc(c)}">${esc(c)} · kira ${money(HS.CITIES[c].rent * s.idx.housing)}</option>`,
          )
          .join(
            "",
          )}</select><button id="moveBtn">Taşın</button></div><p class="fine">Taşınma ${money(15000 * cpi)}. İşinden ayrılırsın; evin varsa kiraya geçersin.</p>`;
      }
      html += sec("Dünya", "", [
        !s.assets.passport
          ? row(
              "Pasaport çıkar",
              "Harç ve defter " + money(E.passport * cpi) + ".",
              { passport: 1 },
              { done: "Pasaportun hazır.", icon: "airplane" },
            )
          : null,
        !city.country
          ? row(
              "Berlin’e göç et",
              "Yol ve ilk masraf " + money(30000 * cpi) + ". İşini bırakırsın.",
              { emigrate: "Berlin", cost: 30000, people: -5 },
              {
                confirm: "Yurt dışına taşınmak istiyor musun?",
                icon: "airplane",
              },
            )
          : row(
              HS.ek(s.birthCity, "dat") + " geri dön",
              "Dönüş " + money(20000 * cpi) + ".",
              { returnHome: true, cost: 20000 },
              {
                confirm: "Memleketine dönmek istiyor musun?",
                icon: "airplane",
              },
            ),
      ]);
    } else {
      const b = HS.budget(s);
      html += sec(
        "Para ve varlıklar",
        "Nakit " +
          money(s.cash) +
          " · Banka " +
          money(s.savings) +
          " · Fon " +
          money(s.fund) +
          " · Borç " +
          money(s.debt) +
          (s.mortgage
            ? "<br>Konut kredisi " +
              money(s.mortgage.left) +
              " (haftalık " +
              money(s.mortgage.weekly) +
              ")"
            : "") +
          "<br>Barınma: " +
          {
            aile: "aile evi",
            kira: "kiralık (tek başına)",
            "kira-paylasim": "kiralık (ev arkadaşıyla)",
            ev: (
              HS.HOME_TYPES[s.homeType]?.name || "kendi evin"
            ).toLocaleLowerCase("tr-TR"),
          }[s.housing] +
          " · Net değer " +
          money(HS.netWorth(s)) +
          "<br><small>Mevduat ve fon getirisi kurmacadır; fon değer kaybedebilir.</small>",
        [
          row(
            "Bankaya yatır (%25)",
            money(s.cash * 0.25) + " mevduata.",
            { save: Math.round(s.cash * 0.25) },
            { off: s.cash < 400 ? "Nakit yok." : null, icon: "bank" },
          ),
          s.savings > 1
            ? row(
                "Bankadan çek (%50)",
                money(s.savings * 0.5) + " nakde.",
                { withdraw: 0.5 },
                { icon: "bank" },
              )
            : null,
          row(
            "Fona yatır (%25)",
            money(s.cash * 0.25) + " endeks fonuna.",
            { fund: Math.round(s.cash * 0.25) },
            { off: s.cash < 400 ? "Nakit yok." : null, icon: "money-bag" },
          ),
          s.fund > 1
            ? row(
                "Fonu sat (%50)",
                money(s.fund * 0.5) + " nakde.",
                { sellFund: 0.5 },
                { icon: "money-bag" },
              )
            : null,
          s.debt > 1
            ? row(
                "Borcu öde",
                "Nakdin kadarını kapat.",
                { payDebt: 1 },
                { icon: "money-bag" },
              )
            : null,
        ],
      );
      // Araçlar
      const cars = Object.entries(Art.CARS);
      html += sec(
        "Araç",
        s.car
          ? "Şu an: " +
              Art.CARS[s.car].name +
              " · ikinci el değeri " +
              money(HS.carPrice(s) * 0.55)
          : "Aracın yok. Araç yol masrafını değiştirir ve evinin önünde görünür.",
        [
          ...cars
            .filter(([k]) => k !== s.car)
            .map(([k, c]) =>
              row(
                (s.car ? "Takasla: " : "Al: ") + c.name,
                money(HS.carPrice(s, k)) +
                  (s.car
                    ? " (eskisi " + money(HS.carPrice(s) * 0.55) + " düşülür)"
                    : ""),
                { buy: "car", model: k, trade: !!s.car },
                { confirm: c.name + " almak istiyor musun?", icon: c.art },
              ),
            ),
          s.car
            ? row(
                "Aracı boyat",
                "Yeni renk " + money(18000 * cpi),
                { cost: 18000, carColor: ((s.carColor || 0) + 1) % 6 },
                { icon: Art.CARS[s.car].art },
              )
            : null,
          s.car
            ? row(
                "Aracı sat",
                "İkinci el " + money(HS.carPrice(s) * 0.55),
                { sell: "car" },
                {
                  confirm: "Aracını satmak istiyor musun?",
                  icon: Art.CARS[s.car].art,
                },
              )
            : null,
        ],
      );
      // Ev
      const homeRows = [];
      if (!s.assets.house)
        Object.entries(HS.HOME_TYPES).forEach(([k, h]) => {
          homeRows.push(
            row(
              h.name + " · peşin",
              money(HS.homePrice(s, k)),
              { buy: "house", homeType: k },
              {
                confirm: h.name + " peşin almak istiyor musun?",
                icon: k === "daire" ? "office-building" : "house-with-garden",
              },
            ),
          );
          homeRows.push(
            row(
              h.name + " · kredili",
              "%30 peşinat " + money(HS.homePrice(s, k) * 0.3) + ", 15 yıl",
              { buy: "house", homeType: k, mortgage: true },
              {
                confirm: h.name + " için konut kredisi çekmek istiyor musun?",
                icon: k === "daire" ? "office-building" : "house-with-garden",
              },
            ),
          );
        });
      else
        homeRows.push(
          row(
            "Evi sat",
            "Değer " +
              money(HS.homePrice(s)) +
              (s.mortgage ? " (kredi düşülür)" : ""),
            { sell: "house" },
            {
              confirm: "Evini satmak istiyor musun? Kiraya geçeceksin.",
              icon: "house",
            },
          ),
        );
      if (s.housing === "aile") {
        homeRows.push(
          row(
            "Ev arkadaşıyla kiraya çık",
            "Depozito " + money(HS.rentFull(s)) + ", kiranın yarısı senden.",
            { rent: "kira-paylasim" },
            { icon: "office-building" },
          ),
        );
        homeRows.push(
          row(
            "Tek başına kiraya çık",
            "Depozito + ilk ay " + money(HS.rentFull(s) * 2) + ".",
            { rent: "kira" },
            { icon: "office-building" },
          ),
        );
      }
      if (s.housing.startsWith("kira"))
        homeRows.push(
          row(
            "Aile evine dön",
            "Kira biter.",
            { moveHome: 1, m: -3 },
            { confirm: "Aile evine dönmek istiyor musun?", icon: "house" },
          ),
        );
      homeRows.push(
        !s.assets.land
          ? row(
              "Arsa al",
              "Yaklaşık " + money(HS.landPrice(s)),
              { buy: "land" },
              { confirm: "Arsa almak istiyor musun?", icon: "national-park" },
            )
          : row(
              "Arsayı sat",
              "Değer " + money(HS.landPrice(s)),
              { sell: "land" },
              {
                confirm: "Arsanı satmak istiyor musun?",
                icon: "national-park",
              },
            ),
      );
      html += sec("Ev ve arsa", "", homeRows).replace(
        /<article class="card"><h3>Ev ve arsa<\/h3><\/article>/,
        '<div class="section-title">Ev ve arsa</div>',
      );
    }
    html += '<p class="fine">Bu sekmedeki işlemler haftayı ilerletmez.</p>';
    box.innerHTML = html;
    box.querySelectorAll("[data-r]").forEach((b) => {
      b.onclick = () => {
        const r = all[+b.dataset.r];
        act(r.fx, r.opt);
      };
    });
    box.querySelectorAll("[data-o]").forEach((b) => {
      b.onclick = () => {
        const k = b.dataset.o;
        if (active.outfit === k) return;
        if (active.outfits.includes(k)) act({ wear: k });
        else
          act(
            { outfitBuy: k },
            {
              confirm:
                Art.OUTFITS[k].name +
                " " +
                money(Art.OUTFITS[k].price * active.idx.cpi) +
                " karşılığında alınsın mı?",
              yes: "Satın al",
            },
          );
      };
    });
    const mb = $("moveBtn");
    if (mb)
      mb.onclick = () => {
        const c = $("moveSelect").value;
        act(
          { moveCity: c, cost: 15000 },
          { confirm: c + " iline taşınmak istiyor musun?" },
        );
      };
  }

  // ---------- Kayıtlar ----------
  function records() {
    const box = $("recordList");
    box.innerHTML = "";
    if (!saves.length)
      box.innerHTML =
        '<div class="card"><h3>Henüz kayıt yok</h3><p class="fine">İlk hayatını oluşturarak başla.</p></div>';
    saves.forEach((s) => {
      const d = document.createElement("div");
      d.className = "card record" + (s === active ? " current" : "");
      const status = s.alive
        ? s.city +
          " · " +
          s.age +
          " yaş · " +
          (s.retired ? "Emekli" : HS.JOBS[s.job].name)
        : (s.final ? s.final.title : "Tamamlandı") + " · " + s.age + " yaş";
      d.innerHTML =
        `<div class="face"><svg viewBox="24 6 72 72">${Art.person(Art.fromState(s))}</svg></div>` +
        "<div><h3>" +
        esc(s.first + " " + s.last) +
        "</h3><p>" +
        esc(status) +
        "</p></div>" +
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
        ask(
          s.first + " " + s.last + " kaydı silinsin mi? Bu geri alınamaz.",
          () => {
            saves = saves.filter((x) => x !== s);
            if (active === s) active = null;
            persist();
            records();
          },
          "Sil",
        );
      };
    });
    $("endCurrent").classList.toggle("hidden", !(active && active.alive));
    page("records");
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
    $("memoirScene").innerHTML = Art.scene(s);
    $("memoirKicker").textContent = "ANI DEFTERİ · " + s.first + " " + s.last;
    $("memoirTitle").textContent = f.heading;
    $("memoirArch").textContent =
      f.title + " · " + f.stats.age + " yaş · " + f.stats.weeks + " hafta";
    $("memoirBody").innerHTML = f.paragraphs
      .map((p) => "<p>" + esc(p) + "</p>")
      .join("");
    $("memoirMoments").innerHTML = (
      f.moments.length ? f.moments : ["Kayda geçen büyük bir dönemeç yok."]
    )
      .map((m) => "<li>" + esc(m) + "</li>")
      .join("");
    $("memoirProfile").innerHTML = HS.Endings.DIMS.map(
      (d) =>
        "<dt>" +
        esc(d.name) +
        "</dt><dd>" +
        esc(HS.Endings.label(d.id, f.profile[d.id])) +
        "</dd>",
    ).join("");
    $("memoirCount").textContent =
      "Bu cihazda keşfedilen farklı son profili: " +
      count +
      " · Olası geçerli profil sayısı: " +
      HS.Endings.spaceSize().toLocaleString("tr-TR") +
      ".";
    page("memoir");
    if (fresh) toast("Hayat tamamlandı ve anı defterine kaydedildi.");
  }

  // ---------- Bağlantılar ----------
  function init() {
    $("birthCity").innerHTML = HS.HOME_CITIES.map(
      (c) => `<option${c === "İstanbul" ? " selected" : ""}>${esc(c)}</option>`,
    ).join("");
    $("newLife").onclick = () => {
      page("create");
      renderCreate();
    };
    $("recordNew").onclick = () => {
      page("create");
      renderCreate();
    };
    $("lookPicker")
      .querySelectorAll("button")
      .forEach((b) => {
        b.onclick = () => {
          create.look = b.dataset.look;
          create.hair = create.look === "man" ? "short" : "long";
          renderCreate();
        };
      });
    $("continueLife").onclick = records;
    $("menuBtn").onclick = records;
    $("slotPill").onclick = records;
    $("beginLife").onclick = begin;
    $("advanceBtn").onclick = advance;
    $("memoirDone").onclick = records;
    $("recordBack").onclick = () =>
      active?.alive ? openWorld() : page("home");
    $("backBtn").onclick = () => {
      if (!$("world").classList.contains("hidden")) return records();
      if (!$("records").classList.contains("hidden"))
        return active?.alive ? openWorld() : page("home");
      if (!$("memoir").classList.contains("hidden")) return records();
      page("home");
    };
    $("endCurrent").onclick = () => {
      if (!active?.alive) return;
      ask(
        "Bu hayatı burada sonlandırıp anı defterine kaydetmek istiyor musun?",
        () => {
          HS.endLife(active, "chosen");
          save();
          memoir(true);
        },
        "Sonlandır",
      );
    };
    $("nameInput").addEventListener(
      "keydown",
      (e) => e.key === "Enter" && $("nameOk").click(),
    );
    load();
    homeScene();
    page("home");
    if (saves.some((s) => s.alive))
      $("continueLife").textContent = "Kayıtlı hayatlara devam et";
  }
  init();
  HS.ui = {
    records,
    render,
    get active() {
      return active;
    },
  };
})(globalThis.HS || (globalThis.HS = {}));
