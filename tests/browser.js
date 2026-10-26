// Tarayıcıda uçtan uca akış testi (Playwright + Chromium).
// Kullanım: node tests/browser.js [ekranGörüntüsüKlasörü]
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const ROOT = path.join(__dirname, "..");
const SHOTS = process.argv[2] || null;
const assert = (c, m) => {
  if (!c) throw new Error("DOĞRULAMA HATASI: " + m);
};

(async () => {
  const browser = await chromium.launch();
  const errors = [];
  async function newPage(width, height) {
    const ctx = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 2,
      reducedMotion: "reduce",
      isMobile: true,
      hasTouch: true,
    });
    const p = await ctx.newPage();
    p.on("pageerror", (e) => errors.push(e.message));
    p.on("console", (m) => m.type() === "error" && errors.push(m.text()));
    // Oyun tarayıcı diyaloğu kullanmamalı (gömülü görüntüleyiciler engelliyor).
    p.on("dialog", (d) => {
      errors.push("tarayıcı diyaloğu açıldı: " + d.message());
      d.dismiss();
    });
    await p.goto("file://" + ROOT + "/index.html");
    return p;
  }
  const shot = async (p, name) =>
    SHOTS && (await p.screenshot({ path: path.join(SHOTS, name + ".png") }));
  const noOverflow = async (p, where) => {
    const o = await p.evaluate(() => {
      const bad = [];
      const W = document.documentElement.clientWidth;
      document.querySelectorAll(".app *").forEach((el) => {
        const r = el.getBoundingClientRect();
        if (
          r.width &&
          el.offsetParent !== null &&
          (r.right > W + 1 || r.left < -1) &&
          !el.closest(".scene") &&
          !el.closest(".home-scene") &&
          !el.closest(".memoir-scene")
        )
          bad.push(el.className || el.tagName);
      });
      return {
        scroll: document.documentElement.scrollWidth > W,
        bad: bad.slice(0, 5),
      };
    });
    assert(
      !o.scroll && !o.bad.length,
      where + ": yatay taşma " + JSON.stringify(o),
    );
  };
  const SAVES = () =>
    JSON.parse(localStorage.getItem("hayatSimulatuoruSavesV1") || "[]");

  if (SHOTS) fs.mkdirSync(SHOTS, { recursive: true });
  const p = await newPage(390, 844);
  await shot(p, "01-ana-ekran");
  await p.click("#newLife");
  await p.fill("#firstName", "Elif");
  await p.fill("#lastName", "Kaya");
  await p.selectOption("#birthCity", "İzmir");
  await p.click('[data-look="woman"]');
  await shot(p, "02-karakter-olustur");
  await p.click("#beginLife");
  assert(
    (await p.textContent("#storyTitle")) === "İlk hafta",
    "giriş olayı yok",
  );
  assert((await p.textContent("#dateLabel")).includes("İZMİR"), "şehir yanlış");
  await shot(p, "03-ilk-hafta");

  // Haftaları oyna
  async function playWeeks(n) {
    for (let w = 0; w < n; w++) {
      while (await p.isVisible("#event")) await p.click("#eventContinue");
      if (await p.isVisible("#memoir")) return "ended";
      const opts = await p.$$("#choices .choice:not([disabled])");
      assert(
        opts.length > 0,
        "seçilebilir seçenek yok: " + (await p.textContent("#storyTitle")),
      );
      await opts[(Math.random() * opts.length) | 0].click();
      await p.click("#advanceBtn");
      if (await p.isVisible("#nameModal")) {
        await p.fill("#nameInput", "Yaprak");
        await p.click("#nameOk");
      }
    }
  }
  await playWeeks(60);
  const before = await p.evaluate(SAVES);
  assert(before.length === 1 && before[0].weeks >= 8, "haftalar kaydedilmedi");

  // Sahne olayın geçtiği yere kendiliğinden geçer (elle seçim yok)
  while (await p.isVisible("#event")) await p.click("#eventContinue");
  const sc = await p.evaluate(() => ({ v: HS.ui.active.view, r: HS.ui.active.clock.room, views: HS.Art.views(HS.ui.active).map((x) => x.id) }));
  assert(!sc.views.includes(sc.r) || sc.v === sc.r, "sahne olayın odasına geçmedi: " + JSON.stringify(sc));
  assert(!(await p.$("#viewChips")), "elle sahne düğmeleri hâlâ var");
  // Seçimlerde para etiketi görünür
  await p.click(".tab[data-tab=life]");
  assert(await p.$("#choices .mtag"), "seçimlerde para etiketi yok");
  // Aile evinde temel gider yok
  assert((await p.evaluate(() => HS.weeklyBudget(HS.ui.active).out)) < 1 || (await p.evaluate(() => HS.ui.active.housing)) !== "aile", "aile evinde gider var");
  // Bütçe: tutumlu yaşam gideri düşürür (kendi evinde)
  await p.evaluate(() => {
    HS.ui.active.housing = "kira";
    HS.ui.render();
  });
  await p.click(".tab[data-tab=money]");
  const out0 = await p.evaluate(() => HS.weeklyBudget(HS.ui.active).out);
  await p.click('#panel .style-row:has-text("Yemek") button:has-text("Tutumlu")');
  const out1 = await p.evaluate(() => HS.weeklyBudget(HS.ui.active).out);
  assert(out1 < out0, "tutumlu yemek gideri düşürmedi");
  await shot(p, "04-butce");
  // Sekmeler
  for (const t of ["work", "skills", "me", "world", "money", "life"]) {
    await p.click(`.tab[data-tab=${t}]`);
    const txt = await p.textContent("#panel");
    assert(txt.length > 80 && !/undefined|NaN/.test(txt), t + " sekmesi bozuk: " + txt.slice(0, 200).replace(/\s+/g, " "));
    await noOverflow(p, t + " sekmesi");
    await shot(p, "04-sekme-" + t);
  }
  const clickRow = async (text) => {
    const b = await p.$(`#panel button:not([disabled]):has-text("${text}")`);
    assert(b, "düğme yok: " + text);
    await b.click();
    if (await p.isVisible("#confirmModal")) await p.click("#confirmYes");
    while (await p.isVisible("#event")) await p.click("#eventContinue");
  };
  const sub = async (t) => {
    while (await p.isVisible("#event")) await p.click("#eventContinue");
    await p.click(`#panel .subtab:has-text("${t}")`);
  };
  // Berber
  await p.evaluate(() => (HS.ui.active.cash = 50000000));
  await p.click(".tab[data-tab=me]");
  await sub("Stil");
  await p.click('#panel .hair:has-text("Kazınmış")');
  assert((await p.evaluate(() => HS.ui.active.hair)) === "shaved", "berber işlemi uygulanmadı");
  // Gardırop
  await p.click('#panel .outfit:has-text("Takım elbise")');
  await p.click("#confirmYes");
  await p.click('#panel .outfit:has-text("Takım elbise")');
  assert((await p.evaluate(() => HS.ui.active.outfit)) === "takim", "kıyafet giyilmedi");
  // Ehliyet ve araba
  await p.evaluate(() => {
    HS.ui.active.license = "var";
    HS.ui.render();
  });
  await p.click(".tab[data-tab=money]");
  await sub("Araç");
  await clickRow("Al: SUV");
  assert((await p.evaluate(() => HS.ui.active.car)) === "suv", "araba alınmadı");
  await p.evaluate(() => {
    HS.ui.active.view = "garaj";
    HS.ui.render();
  });
  assert(await p.$("#sceneArt .hs-car"), "araba garajda yok");
  await shot(p, "05-garaj");
  // Yatırım ve bahis
  await p.click(".tab[data-tab=money]");
  await sub("Yatırım");
  await p.fill("#invAmt", "1234");
  await p.click('#panel .inv:has-text("Hisse senedi") .mini:has-text("Tutarı al")');
  assert(Math.abs((await p.evaluate(() => HS.ui.active.invCost.borsa)) - 1234) < 1, "elle yazılan tutarla alım olmadı");
  assert((await p.evaluate(() => HS.invVal(HS.ui.active, "borsa"))) > 0, "borsa alımı olmadı");
  await p.fill("#betAmt", "750");
  await p.click('#panel .bet:has-text("Tek maç") .mini:has-text("Yazdığım tutarla")');
  while (await p.isVisible("#event")) await p.click("#eventContinue");
  assert((await p.evaluate(() => HS.ui.active.bets.n)) === 1, "bahis oynanmadı");
  // Banka: kart, vadeli, kredi, fatura
  await p.evaluate(() => {
    const s = HS.ui.active;
    s.job = "office";
    s.jobWeeks = 60;
    s.score = 1600;
    HS.ui.render();
  });
  await sub("Banka");
  for (let i = 0; i < 8 && !(await p.evaluate(() => !!HS.ui.active.card)); i++) {
    await p.evaluate(() => (HS.ui.active.applyBlock = 0));
    await p.click(".tab[data-tab=money]");
    await clickRow("Kredi kartına başvur");
  }
  assert(await p.evaluate(() => !!HS.ui.active.card), "kredi kartı alınamadı");
  await p.click('#panel .mini:has-text("Nakdin hepsi")').catch(() => {});
  if (await p.isVisible("#confirmModal")) await p.click("#confirmYes");
  assert((await p.evaluate(() => HS.ui.active.deposits.length)) === 1, "vadeli hesap açılmadı");
  assert((await p.evaluate(() => HS.ui.active.cash)) < 1, "vadeli hesap nakdi kilitlemedi");
  await p.evaluate(() => {
    HS.ui.active.cash = 20000000;
    HS.ui.active.bills.push({ id: "bt", k: "su", name: "Su", amt: 500, due: HS.ui.active.weeks + 2, late: false });
    HS.ui.render();
  });
  await clickRow("Hepsini öde");
  assert((await p.evaluate(() => HS.ui.active.bills.length)) === 0, "fatura ödenmedi");
  await shot(p, "06-banka");
  // Eşya: taksitle konsol
  await p.click(".tab[data-tab=me]");
  await sub("Eşyalar");
  await p.click('#panel .item:has-text("Oyun konsolu") .mini:has-text("3 taksit")');
  await p.click("#confirmYes");
  assert(await p.evaluate(() => HS.ui.active.items.includes("konsol")), "konsol alınmadı");
  assert(await p.evaluate(() => HS.ui.active.card.bal > 0), "taksit karta yansımadı");
  // Spor salonu paketi
  await sub("Ben");
  await p.click("#panel .pack >> nth=2");
  await p.click("#confirmYes");
  assert(await p.evaluate(() => !!HS.ui.active.gym), "salon üyeliği alınmadı");
  // Aile: ziyaret
  await sub("Aile");
  await p.evaluate(() => {
    HS.ui.active.free = 3;
    HS.ui.active.kin.forEach((k) => (k.city = HS.ui.active.city));
    HS.ui.render();
  });
  await p.click('#panel .node:not(.dead) .mini:has-text("Ziyaret") >> nth=0');
  await p.click("#confirmYes");
  while (await p.isVisible("#event")) await p.click("#eventContinue");
  assert((await p.evaluate(() => HS.ui.active.view)) === "ziyaret", "ziyaret sahnesine geçilmedi");
  await shot(p, "06-ziyaret");
  // Şirket başvurusu
  await p.evaluate(() => {
    const s = HS.ui.active;
    s.job = "none";
    s.company = null;
    s.retired = false;
    s.mil = s.look === "man" ? "yapildi" : s.mil;
    s.apps = [];
    s.free = 2;
    HS.ui.render();
  });
  await p.click(".tab[data-tab=work]");
  const apply = await p.$("#panel .co .mini:not([disabled])");
  assert(apply, "başvurulabilir şirket yok");
  await apply.click();
  await p.click("#confirmYes");
  assert((await p.evaluate(() => HS.ui.active.apps.length)) === 1, "şirket başvurusu kaydedilmedi");
  // Dünya: harita, il seç, pasaport, vize dosyası
  await p.click(".tab[data-tab=world]");
  await p.click(".map path:not(.here) >> nth=10");
  assert(await p.isVisible('#panel button:has-text("3 günlük gezi")'), "il seçimi çalışmadı");
  await clickRow("Pasaport çıkar");
  assert(await p.evaluate(() => HS.ui.active.assets.passport), "pasaport çıkmadı");
  await p.evaluate(() => HS.Skills.add(HS.ui.active, "almanca", 60));
  await p.click(".tab[data-tab=world]");
  await p.click('#panel .country:has-text("Almanya") .mini');
  await p.click("#confirmYes");
  assert((await p.evaluate(() => HS.ui.active.visa && HS.ui.active.visa.stage)) === "evrak", "vize dosyası açılmadı");
  await shot(p, "06-vize");
  // Beceri: kurs
  await p.click(".tab[data-tab=skills]");
  await clickRow("İngilizce");
  assert((await p.evaluate(() => HS.ui.active.courses.length)) >= 1, "kursa yazılınamadı");
  // Oyun dengesi düzenleyicisi
  await p.click("#settingsBtn");
  await p.click("#cfgToggle");
  await p.fill('[data-cfg="startCash"]', "75000");
  await p.click("#cfgSave");
  assert((await p.evaluate(() => HS.CFG.startCash)) === 75000, "oyun dengesi kaydedilmedi");
  await shot(p, "07-oyun-dengesi");
  await p.click("#cfgReset");
  await p.click("#confirmYes");
  assert((await p.evaluate(() => HS.CFG.startCash)) === 50000, "varsayılana dönülmedi");
  await p.click("#backBtn");
  // Ayarlar
  await p.click("#settingsBtn");
  assert(await p.isVisible("#settings"), "ayarlar açılmadı");
  await p.click('#settingsBody [data-k="music"]');
  assert((await p.evaluate(() => HS.ui.settings.music)) === false, "müzik kapanmadı");
  await p.click('#settingsBody [data-k="vibration"]');
  await shot(p, "07-ayarlar");
  await noOverflow(p, "ayarlar");
  await p.click("#backBtn");
  assert(await p.isVisible("#world"), "ayarlardan oyuna dönülmedi");
  // Boş zaman etkinliği
  await p.evaluate(() => {
    HS.ui.active.free = 1;
    HS.ui.active.courses = [];
    HS.ui.active.flags.actDone = {};
    HS.ui.render();
  });
  await p.click(".tab[data-tab=life]");
  await p.click('#panel [data-a="yemekyap"]');
  assert((await p.evaluate(() => HS.ui.active.view)) === "mutfak", "yemek yapınca mutfağa geçilmedi");
  while (await p.isVisible("#event")) await p.click("#eventContinue");
  assert((await p.evaluate(() => HS.ui.active.free)) === 0, "etkinlik boş zaman harcamadı");
  assert(await p.$("#procList"), "süren işler listesi görünmüyor");
  await shot(p, "08-bos-zaman");

  // Yenile ve kayıttan devam: yarım kalan olay korunmalı
  const titleBefore = await p.textContent("#storyTitle");
  await p.reload();
  await p.click("#continueLife");
  await p.click("#recordList [data-open]");
  assert(
    (await p.textContent("#storyTitle")) === titleBefore,
    "kayıttan devam edince olay değişti",
  );
  await noOverflow(p, "dünya ekranı");

  // Çocuk adı penceresi: doğrudan olayı tetikle
  await p.evaluate(() => {
    const s = HS.ui.active;
    s.partner = { name: "Bora", bond: 80, married: true, met: s.year - 2 };
    s.age = 30;
    s.cash = 500000;
    s.current = HS.materialize(
      HS.EVENTS.find((e) => e.id === "baby"),
      s,
    );
    HS.ui.render();
  });
  await p.click('#choices .choice:has-text("Başka bir ad yaz")');
  await p.click("#advanceBtn");
  assert(await p.isVisible("#nameModal"), "isim penceresi açılmadı");
  await shot(p, "05-isim-penceresi");
  await p.fill("#nameInput", "Toprak");
  await p.click("#nameOk");
  if (await p.isVisible("#event")) await shot(p, "06-ara-sahne");
  while (await p.isVisible("#event")) await p.click("#eventContinue");
  const kids = await p.evaluate(() => HS.ui.active.children.map((k) => k.name));
  assert(kids.includes("Toprak"), "çocuk adı kaydedilmedi");
  await shot(p, "07-aile");

  // İkinci hayat ve geçiş
  await p.click("#menuBtn");
  await p.click("#recordNew");
  await p.fill("#firstName", "Mert");
  await p.click('[data-look="man"]');
  await p.click("#beginLife");
  await playWeeks(5);
  while (await p.isVisible("#event")) await p.click("#eventContinue");
  await p.click("#menuBtn");
  const recs = await p.$$("#recordList .record");
  assert(recs.length === 2, "iki kayıt bekleniyordu");
  await shot(p, "08-kayitlar");
  await p.click("#recordList .record:first-child [data-open]");
  assert(
    (await p.textContent("#personName")).startsWith("Elif"),
    "ilk hayata geçilemedi",
  );

  // Hayatı sonlandır → anı defteri
  await p.click("#menuBtn");
  await p.click("#endCurrent");
  assert(await p.isVisible("#confirmModal"), "onay penceresi açılmadı");
  await p.click("#confirmYes");
  assert(await p.isVisible("#memoir"), "anı defteri açılmadı");
  const memo = await p.textContent("#memoirBody");
  assert(memo.length > 300 && !/undefined|NaN/.test(memo), "anı metni hatalı");
  await shot(p, "09-ani-defteri");
  await noOverflow(p, "anı defteri");
  const ended = await p.evaluate(SAVES);
  assert(
    ended.find((s) => s.first === "Elif").alive === false,
    "hayat kapanmadı",
  );

  // Uzun hayat: ikinci karakterle sonuna kadar
  await p.click("#memoirDone");
  await p.click("#recordList .record:nth-child(2) [data-open]");
  await p.evaluate(() => {
    const s = HS.ui.active;
    s.age = 88;
    s.health = 12;
  });
  const r = await playWeeks(800);
  assert(
    r === "ended" || (await p.isVisible("#memoir")),
    "yaşlı karakterin hayatı bitmedi",
  );
  await shot(p, "10-son");

  // Dar ekranlar
  for (const [w, h] of [
    [320, 568],
    [360, 740],
  ]) {
    const q = await newPage(w, h);
    await q.click("#continueLife");
    await q.click("#recordNew");
    await q.click("#beginLife");
    await noOverflow(q, w + "px dünya");
    for (let i = 0; i < 15; i++) {
      while (await q.isVisible("#event")) await q.click("#eventContinue");
      const o = await q.$$("#choices .choice:not([disabled])");
      await o[0].click();
      await q.click("#advanceBtn");
    }
    while (await q.isVisible("#event")) await q.click("#eventContinue");
    await noOverflow(q, w + "px oyun");
    await q.click(".tab[data-tab=money]");
    await noOverflow(q, w + "px para");
    for (const t of ["me", "work", "world"]) {
      await q.click(`.tab[data-tab=${t}]`);
      await noOverflow(q, w + "px " + t);
    }
    await q.click(".tab[data-tab=me]");
    for (const st of ["Aile", "Stil", "Eşyalar"]) {
      await q.click(`#panel .subtab:has-text("${st}")`);
      await noOverflow(q, w + "px " + st);
    }
    if (SHOTS)
      await q.screenshot({ path: path.join(SHOTS, "11-dar-" + w + ".png") });
    // Alt menü görünür ve tıklanabilir olmalı
    const tb = await q.$eval(
      ".tabbar",
      (e) => e.getBoundingClientRect().bottom,
    );
    assert(tb <= h + 1, w + "px: alt menü ekran dışında");
  }

  assert(!errors.length, "tarayıcı hataları: " + errors.join(" | "));
  await browser.close();
  console.log("TARAYICI TESTİ GEÇTİ");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
