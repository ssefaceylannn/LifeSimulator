// Arayüz: ekranlar, karakter çizimi, sekmeler, kayıtlar ve anı defteri.
(function (HS) {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const SAVE_KEY = "hayatSimulatuoruSavesV1"; // eski sürümle aynı anahtar: kayıtlar korunur
  const PROFILE_KEY = "hayatSimEndingProfilesV2";
  const PAGES = ["home", "create", "world", "records", "memoir"];
  const money = HS.money;
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

  let saves = [],
    active = null,
    look = "woman",
    selected = -1,
    tab = "life";

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

  // ---------- Yeni hayat ----------
  function begin() {
    const first = $("firstName").value.trim() || "Deniz",
      last = $("lastName").value.trim() || "Yılmaz";
    active = HS.newLife({ first, last, city: $("birthCity").value, look });
    HS.nextEvent(active);
    saves.push(active);
    save();
    openWorld();
  }
  function openWorld() {
    page("world");
    tab = "life";
    if (!active.current) HS.nextEvent(active);
    render();
    showScenes();
  }

  // ---------- Dünya ekranı ----------
  function render() {
    const s = active;
    if (!s) return;
    $("personName").textContent = s.first + " " + s.last;
    $("slotPill").textContent = "HAYAT " + (saves.indexOf(s) + 1);
    $("ageTag").textContent = s.age + " YAŞ";
    $("dateLabel").textContent = HS.upper(s.city) + " · " + s.year;
    $("weekLabel").textContent =
      s.week + ". HAFTA · " + s.weeks + ". HAYAT HAFTASI";
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
    $("moneyLine").innerHTML = parts.join(" · ") || "Birikim yok";
    drawCharacter(s);
    document
      .querySelectorAll(".tab")
      .forEach((b) => b.classList.toggle("active", b.dataset.tab === tab));
    $("panel").classList.toggle("hidden", tab !== "life");
    $("tabPanel").classList.toggle("hidden", tab === "life");
    if (tab === "life") renderEvent();
    else renderTab(tab);
  }

  function drawCharacter(s) {
    const ch = $("character");
    const gray = Math.max(0, Math.min(100, (s.age - 32) * 2.2));
    ch.style.setProperty("--gray", gray + "%");
    ch.style.setProperty(
      "--scale",
      String(1 - Math.max(0, s.age - 60) * 0.003),
    );
    ch.className = [
      "character",
      s.look,
      "job-" + (s.retired ? "retired" : s.job),
      "hair-" + (s.hair || "short"),
      s.beard ? "beard" : "",
      s.thinning && !s.transplanted ? "thin" : "",
      s.transplanted ? "transplanted" : "",
      s.age >= 45 ? "age-mid" : "",
      s.age >= 65 ? "age-old" : "",
    ].join(" ");
    const scene =
      s.abroad && HS.CITIES[s.city]?.region === "abroad"
        ? "abroad"
        : s.housing === "ev"
          ? "home"
          : s.housing === "aile"
            ? "family"
            : "flat";
    $("scene").className =
      "character-wrap scene-" +
      (s.retired ? "retired" : s.job) +
      " place-" +
      scene;
    $("sky").textContent = s.week % 2 ? "☾" : "☼";
    const job = HS.JOBS[s.retired ? "none" : s.job];
    $("roomProp").innerHTML = s.assets.house
      ? "⌂<small>EVİM</small>"
      : s.retired
        ? "☕<small>EMEKLİ</small>"
        : s.edu === "ogrenci" && s.job === "none"
          ? "✎<small>OKUL</small>"
          : job.icon + "<small>" + job.prop + "</small>";
    let fam = "";
    if (s.partner)
      fam += '<i class="p" title="' + esc(s.partner.name) + '"></i>';
    s.children.slice(0, 4).forEach((k) => {
      const a = s.year - k.born;
      fam +=
        '<i class="k' +
        (a >= 18 ? " grown" : "") +
        '" title="' +
        esc(k.name) +
        '"></i>';
    });
    if (s.flags.kedi) fam += '<i class="cat">ᓚ</i>';
    if (s.assets.car) fam += '<i class="car">▰</i>';
    $("family").innerHTML = fam;
  }

  function renderEvent() {
    const s = active,
      ev = s.current;
    $("weather").textContent = [
      "☁ SERİN",
      "☼ AÇIK",
      "☂ YAĞMURLU",
      "≋ RÜZGÂRLI",
    ][(s.weeks * 7 + s.seed) % 4];
    $("storyTitle").textContent = ev.t;
    $("storyText").textContent = ev.p;
    const tags = [
      s.city,
      s.retired
        ? "Emekli"
        : s.edu === "ogrenci"
          ? "Öğrenci"
          : HS.JOBS[s.job].name,
    ];
    if (s.partner) tags.push(s.partner.married ? "Evli" : "Bir ilişki");
    if (s.children.length) tags.push(s.children.length + " çocuk");
    $("storyTags").innerHTML = tags
      .map((t) => '<span class="tag">' + esc(t) + "</span>")
      .join("");
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
        "</small></span>";
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

  function advance() {
    if (selected < 0 || !active?.current) return;
    const ch = active.current.c[selected];
    if (ch.fx.child === "CUSTOM") return askName((n) => doChoose(n));
    doChoose();
  }
  function doChoose(name) {
    const r = HS.choose(active, selected, name);
    if (r.ok === false) {
      toast(r.reason);
      return;
    }
    save();
    if (r.ended) return finish();
    render();
    $("world").scrollTop = 0;
    showScenes();
  }

  // Ara sahneler sırayla gösterilir.
  function showScenes(after) {
    const s = active;
    if (!s || !s.scenes.length) {
      if (after) after();
      return;
    }
    const sc = s.scenes.shift();
    save();
    $("eventArt").textContent = sc.art || "✦";
    $("eventTitle").textContent = sc.t;
    $("eventText").textContent = sc.p;
    $("event").classList.remove("hidden");
    $("eventContinue").onclick = () => {
      $("event").classList.add("hidden");
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
  // Sekme eylemleri haftayı ilerletmez; bazıları haftada bir kez yapılabilir.
  function act(fx, opt = {}) {
    const s = active;
    if (opt.weekly) {
      s.flags.tabUse = s.flags.tabUse || {};
      if (s.flags.tabUse[opt.weekly] === s.weeks)
        return toast("Bunu bu hafta zaten yaptın.");
    }
    if (opt.confirm && !confirm(opt.confirm)) return;
    const r = HS.quickAction(s, fx);
    if (r !== true) return toast(r);
    if (opt.weekly) s.flags.tabUse[opt.weekly] = s.weeks;
    if (opt.done) toast(opt.done);
    save();
    render();
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
    return { label, hint, fx, opt, off };
  }
  function section(title, body, rows) {
    return { title, body, rows: rows.filter(Boolean) };
  }
  const bar = (v) =>
    '<i class="bar inline"><i style="width:' + Math.round(v) + '%"></i></i>';

  function tabContent(t) {
    const s = active,
      E = HS.ECONOMY,
      b = HS.budget(s),
      M = HS.WEEKS_PER_MONTH,
      cpi = s.idx.cpi;
    if (t === "work") {
      const lines = [];
      lines.push(
        s.retired
          ? "Emeklisin. Aylık emekli maaşın " + money(HS.pension(s)) + "."
          : s.job === "none"
            ? "Şu an çalışmıyorsun."
            : HS.JOBS[s.job].name +
              " · kademe " +
              (s.jobLevel + 1) +
              "/3 · " +
              Math.floor(s.jobWeeks / 52) +
              " yıl " +
              (s.jobWeeks % 52) +
              " hafta",
      );
      lines.push(
        "Eğitim: " +
          {
            lise: "lise",
            ogrenci:
              "üniversite öğrencisi (" +
              Math.min(100, Math.round((s.eduWeeks / 208) * 100)) +
              "%)",
            universite: "üniversite mezunu",
            yarim: "üniversiteyi yarıda bıraktı",
          }[s.edu] +
          " · Beceri " +
          Math.round(s.skill),
      );
      lines.push(
        "Aylık tahmini: gelir " +
          money(b.income * M) +
          " · yaşam " +
          money(b.living * M) +
          (b.rent ? " · kira " + money(b.rent * M) : "") +
          (b.kids ? " · çocuk " + money(b.kids * M) : "") +
          (b.mortgage ? " · kredi " + money(b.mortgage * M) : ""),
      );
      const jobs = Object.keys(HS.JOBS).filter(
        (j) => j !== "none" && j !== "crime" && j !== s.job,
      );
      const rows = s.retired
        ? []
        : jobs.map((j) =>
            row(
              HS.JOBS[j].name,
              (HS.JOBS[j].startup
                ? "Sermaye " + money(HS.JOBS[j].startup * cpi) + " · "
                : "") +
                "aylık " +
                (HS.JOBS[j].volatile ? "ort. " : "") +
                money(HS.wage(active, j, 0)),
              { job: j },
              { weekly: "job", done: HS.JOBS[j].name + " olarak başladın." },
            ),
          );
      if (!s.retired && s.job !== "none")
        rows.push(
          row(
            "İşten ayrıl",
            "Gelirin kesilir.",
            { job: "none" },
            {
              confirm: "İşinden ayrılmak istediğine emin misin?",
              weekly: "job",
            },
          ),
        );
      return section("İş ve eğitim", lines.join("<br>"), rows);
    }
    if (t === "city") {
      const city = HS.CITIES[s.city];
      const sc = HS.SCENARIOS[s.scenario];
      const pct = (k) => "%" + Math.round(HS.rate(s, k) * 100);
      const body =
        esc(s.city) +
        (city.region === "abroad" ? " (" + city.country + ")" : "") +
        ". Ortalama daire kirası " +
        money(HS.rentFull(s)) +
        "/ay · 70 m² ev " +
        money(HS.homePrice(s)) +
        ".<br>" +
        s.year +
        " yıllık oranlar (" +
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
          ? "<br>Yürürlükteki kurmaca politika: " +
            {
              transit: "toplu ulaşım desteği",
              enterprise: "küçük işletme indirimi",
              housing: "kira sınırı",
              family: "aile desteği",
            }[s.policy] +
            "."
          : "");
      const rows = [];
      if (!s.assets.passport)
        rows.push(
          row(
            "Pasaport çıkar",
            "Harç ve defter " + money(E.passport * cpi) + ".",
            { passport: 1 },
            { done: "Pasaportun hazır." },
          ),
        );
      if (city.region !== "abroad")
        HS.HOME_CITIES.filter((c) => c !== s.city).forEach((c) =>
          rows.push(
            row(
              HS.ek(c, "dat") + " taşın",
              "Taşınma " +
                money(15000 * cpi) +
                " · kira " +
                money(HS.CITIES[c].rent * s.idx.housing) +
                "/ay",
              { moveCity: c, cost: 15000 },
              { confirm: c + " şehrine taşınmak istiyor musun?" },
            ),
          ),
        );
      if (city.region !== "abroad")
        rows.push(
          row(
            "Berlin’e göç et",
            "Yol ve ilk masraf " + money(30000 * cpi) + ". İşini bırakırsın.",
            { emigrate: "Berlin", cost: 30000, people: -5 },
            {
              confirm:
                "Yurt dışına taşınmak istiyor musun? Mevcut işini bırakacaksın.",
            },
          ),
        );
      else
        rows.push(
          row(
            HS.ek(s.birthCity, "dat") + " geri dön",
            "Dönüş masrafı " + money(20000 * cpi) + ".",
            { returnHome: true, cost: 20000 },
            { confirm: "Memleketine dönmek istiyor musun?" },
          ),
        );
      rows.push(
        row(
          "Şehri keşfet",
          "Yeni bir mahalle, yeni yüzler.",
          { cost: 350, m: 3, people: 1 },
          { weekly: "explore" },
        ),
      );
      return section("Şehir ve dünya", body, rows);
    }
    if (t === "people") {
      let body = "";
      if (s.partner)
        body +=
          esc(s.partner.name) +
          (s.partner.married ? " · eşin " : " · partnerin ") +
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
            " yaş " +
            bar(k.bond) +
            "<br>"),
      );
      body +=
        "Çevre: " +
        Math.round(s.people) +
        " yakın tanıdık. Saç: " +
        { short: "kısa", long: "uzun", curly: "kıvırcık", shaved: "kazınmış" }[
          s.hair
        ] +
        (s.beard ? " · sakallı" : "") +
        (s.thinning && !s.transplanted ? " · seyrelmiş" : "") +
        (s.transplanted ? " · ekimli" : "");
      const rows = [
        row(
          "Bir arkadaşı ara",
          "İlişkilerine zaman ayır.",
          { cost: 120, people: 2, m: 2 },
          { weekly: "call" },
        ),
        s.partner
          ? row(
              s.partner.name + " ile akşam yemeği",
              "Bağınızı güçlendir.",
              { cost: 1200, bond: 6, m: 2 },
              { weekly: "date" },
            )
          : null,
        s.children.length
          ? row(
              "Çocuklarınla vakit geçir",
              "Park, oyun, sohbet.",
              { cost: 400, kidBond: 4, m: 2 },
              { weekly: "kids" },
            )
          : null,
        row(
          "Berber: kısa kesim",
          "Saç " + money(E.haircut * cpi) + ".",
          { hair: "short", cost: E.haircut },
          { weekly: "barber" },
        ),
        row(
          "Berber: uzun bırak",
          "Bakım " + money(E.haircut * cpi) + ".",
          { hair: "long", cost: E.haircut },
          { weekly: "barber" },
        ),
        row(
          "Berber: kıvırcık perma",
          "İşlem " + money(E.haircut * 2.4 * cpi) + ".",
          { hair: "curly", cost: E.haircut * 2.4 },
          { weekly: "barber" },
        ),
        row(
          "Berber: kazıt",
          "Sade ve serin. " + money(E.haircut * cpi) + ".",
          { hair: "shaved", cost: E.haircut },
          { weekly: "barber" },
        ),
        row(
          s.beard ? "Sakalı kestir" : "Sakal bırak / düzelt",
          "Sakal " + money(E.beard * cpi) + ".",
          { beard: !s.beard, cost: E.beard },
          { weekly: "beard" },
        ),
        s.transplanted
          ? null
          : row(
              "Saç ekimi",
              "Kalıcı işlem, " + money(E.transplant * cpi) + ".",
              { transplant: true, m: 3 },
              {
                confirm: "Saç ekimi yaptırmak istiyor musun?",
                done: "Saç ekimi tamamlandı.",
              },
            ),
        s.partner
          ? row(
              s.partner.married ? "Boşan" : "Ayrıl",
              "İlişkiyi bitir.",
              { breakup: true, m: -8, cost: s.partner.married ? 20000 : 0 },
              { confirm: "Bu ilişkiyi bitirmek istediğine emin misin?" },
            )
          : null,
      ];
      return section("Yakınlar ve kişisel bakım", body, rows);
    }
    // PARA
    const body =
      "Nakit " +
      money(s.cash) +
      " · Banka " +
      money(s.savings) +
      " · Fon " +
      money(s.fund) +
      " · Borç " +
      money(s.debt) +
      (s.mortgage
        ? " · Konut kredisi " +
          money(s.mortgage.left) +
          " (haftalık " +
          money(s.mortgage.weekly) +
          ")"
        : "") +
      "<br>Barınma: " +
      {
        aile: "aile evi",
        kira: "kira (tek başına)",
        "kira-paylasim": "kira (ev arkadaşıyla)",
        ev: "kendi evin",
      }[s.housing] +
      " · Net değer " +
      money(HS.netWorth(s)) +
      "<br><small>Mevduat ve fon getirisi kurmacadır; fon değer kaybedebilir.</small>";
    const quarter = Math.round(s.cash * 0.25);
    const rows = [
      row(
        "Bankaya yatır (%25)",
        money(quarter) + " mevduata.",
        { save: quarter },
        { off: quarter < 100 ? "Nakit yok." : null },
      ),
      s.savings > 1
        ? row("Bankadan çek (%50)", money(s.savings * 0.5) + " nakde.", {
            withdraw: 0.5,
          })
        : null,
      row(
        "Fona yatır (%25)",
        money(quarter) + " endeks fonuna.",
        { fund: quarter },
        { off: quarter < 100 ? "Nakit yok." : null },
      ),
      s.fund > 1
        ? row("Fonu sat (%50)", money(s.fund * 0.5) + " nakde.", {
            sellFund: 0.5,
          })
        : null,
      s.debt > 1
        ? row("Borcu öde", "Nakdin kadarını kapat.", { payDebt: 1 })
        : null,
      !s.assets.house
        ? row(
            "Ev al (peşin)",
            money(HS.homePrice(s)) + " · " + s.city + ", 70 m².",
            { buy: "house" },
            { confirm: "Evi peşin almak istiyor musun?" },
          )
        : null,
      !s.assets.house
        ? row(
            "Ev al (kredili)",
            "%30 peşinat " + money(HS.homePrice(s) * 0.3) + ", 15 yıl.",
            { buy: "house", mortgage: true },
            { confirm: "Konut kredisiyle ev almak istiyor musun?" },
          )
        : null,
      s.assets.house
        ? row(
            "Evi sat",
            "Değer " +
              money(HS.homePrice(s)) +
              (s.mortgage ? " (kredi düşülür)" : "") +
              ".",
            { sell: "house" },
            { confirm: "Evini satmak istiyor musun? Kiraya geçeceksin." },
          )
        : null,
      !s.assets.car
        ? row(
            "Araba al",
            "Giriş sınıfı sıfır araç " + money(HS.carPrice(s)) + ".",
            { buy: "car" },
            { confirm: "Araba almak istiyor musun?" },
          )
        : row(
            "Arabayı sat",
            "İkinci el " + money(HS.carPrice(s) * 0.55) + ".",
            { sell: "car" },
            { confirm: "Arabanı satmak istiyor musun?" },
          ),
      !s.assets.land
        ? row(
            "Arsa al",
            "Oyun içi yaklaşık değer " + money(HS.landPrice(s)) + ".",
            { buy: "land" },
            { confirm: "Arsa almak istiyor musun?" },
          )
        : row(
            "Arsayı sat",
            "Değer " + money(HS.landPrice(s)) + ".",
            { sell: "land" },
            { confirm: "Arsanı satmak istiyor musun?" },
          ),
      s.housing === "aile"
        ? row(
            "Ev arkadaşıyla kiraya çık",
            "Depozito " + money(HS.rentFull(s)) + ", kiranın yarısı senden.",
            { rent: "kira-paylasim" },
          )
        : null,
      s.housing === "aile"
        ? row(
            "Tek başına kiraya çık",
            "Depozito + ilk ay " + money(HS.rentFull(s) * 2) + ".",
            { rent: "kira" },
          )
        : null,
      s.housing.startsWith("kira")
        ? row(
            "Aile evine dön",
            "Kira biter, bağımsızlık ertelenir.",
            { moveHome: 1, m: -3 },
            { confirm: "Aile evine dönmek istiyor musun?" },
          )
        : null,
    ];
    return section("Para ve varlıklar", body, rows);
  }

  function renderTab(t) {
    const sec = tabContent(t);
    const box = $("tabPanel");
    box.innerHTML =
      '<article class="story-card"><h3>' +
      esc(sec.title) +
      "</h3><p>" +
      sec.body +
      "</p></article>" +
      '<div class="choice-list">' +
      sec.rows
        .map(
          (r, i) =>
            '<button class="choice" data-i="' +
            i +
            '"' +
            (r.off ? " disabled" : "") +
            '><span class="bullet">' +
            (i + 1) +
            "</span><span><b>" +
            esc(r.label) +
            "</b><small>" +
            esc(r.off ? "🔒 " + r.off : r.hint) +
            "</small></span></button>",
        )
        .join("") +
      '</div><p class="smallprint">Bu sekmedeki işlemler haftayı ilerletmez. Haftayı ilerletmek için HAYAT sekmesindeki olaya karar ver.</p>';
    box.querySelectorAll("[data-i]").forEach((b) => {
      b.onclick = () => {
        const r = sec.rows[+b.dataset.i];
        act(r.fx, r.opt);
      };
    });
  }

  // ---------- Kayıtlar ----------
  function records() {
    const box = $("recordList");
    box.innerHTML = "";
    if (!saves.length)
      box.innerHTML =
        '<div class="record"><div><h3>Henüz kayıt yok</h3><p>İlk hayatını oluşturarak başla.</p></div></div>';
    saves.forEach((s, i) => {
      const d = document.createElement("div");
      d.className = "record" + (s === active ? " current" : "");
      const status = s.alive
        ? s.city +
          " · " +
          s.age +
          " yaş · " +
          (s.retired ? "Emekli" : HS.JOBS[s.job].name)
        : (s.final ? s.final.title : "Tamamlandı") + " · " + s.age + " yaş";
      d.innerHTML =
        "<div><h3>" +
        esc(s.first + " " + s.last) +
        "</h3><p>" +
        esc(status) +
        "</p></div>" +
        '<div class="record-actions"><button data-open="' +
        s.id +
        '">' +
        (s.alive ? "DEVAM ET" : "ANI DEFTERİ") +
        '</button><button class="del" data-del="' +
        s.id +
        '" aria-label="Sil">✕</button></div>';
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
        if (
          !confirm(
            s.first + " " + s.last + " kaydı silinsin mi? Bu geri alınamaz.",
          )
        )
          return;
        saves = saves.filter((x) => x !== s);
        if (active === s) active = null;
        persist();
        records();
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
      (c) => "<option>" + esc(c) + "</option>",
    ).join("");
    $("newLife").onclick = () => page("create");
    $("recordNew").onclick = () => page("create");
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
      if (
        active?.alive &&
        confirm(
          "Bu hayatı burada sonlandırıp anı defterine kaydetmek istiyor musun?",
        )
      ) {
        HS.endLife(active, "chosen");
        save();
        memoir(true);
      }
    };
    document.querySelectorAll(".look").forEach((b) => {
      b.onclick = () => {
        look = b.dataset.look;
        document
          .querySelectorAll(".look")
          .forEach((x) => x.classList.toggle("selected", x === b));
      };
    });
    document.querySelectorAll(".tab").forEach((b) => {
      b.onclick = () => {
        tab = b.dataset.tab;
        render();
        $("world").scrollTop = 0;
      };
    });
    $("nameInput").addEventListener(
      "keydown",
      (e) => e.key === "Enter" && $("nameOk").click(),
    );
    load();
    page("home");
    if (saves.some((s) => s.alive))
      $("continueLife").textContent = "KAYITLARA DEVAM ET";
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
