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
  assert(before.length === 1 && before[0].weeks >= 55, "haftalar kaydedilmedi");

  // Sahne seçici: oda değiştir
  for (const v of ["yatak", "mutfak", "salon"]) {
    await p.click(`#viewChips [data-v=${v}]`);
    assert((await p.evaluate(() => HS.ui.active.view)) === v, v + " sahnesine geçilmedi");
    await shot(p, "04-oda-" + v);
  }
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
  // Berber
  await p.evaluate(() => (HS.ui.active.cash = 50000000));
  await p.click(".tab[data-tab=me]");
  await clickRow("Kazınmış saç");
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
  await clickRow("Al: SUV");
  assert((await p.evaluate(() => HS.ui.active.car)) === "suv", "araba alınmadı");
  await p.click("#viewChips [data-v=garaj]");
  assert(await p.$("#sceneArt .hs-car"), "araba garajda yok");
  await shot(p, "05-garaj");
  // Yatırım ve bahis
  await p.click(".tab[data-tab=money]");
  await p.click('#panel .inv:has-text("Hisse senedi") .mini:has-text("Al %10")');
  assert((await p.evaluate(() => HS.invVal(HS.ui.active, "borsa"))) > 0, "borsa alımı olmadı");
  const betBtn = await p.$("#panel .bet .mini:not([disabled])");
  await betBtn.click();
  while (await p.isVisible("#event")) await p.click("#eventContinue");
  assert((await p.evaluate(() => HS.ui.active.bets.n)) === 1, "bahis oynanmadı");
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
  await p.click('#panel [data-a="dinlen"]');
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
    await noOverflow(q, w + "px oyun");
    await q.click(".tab[data-tab=money]");
    await noOverflow(q, w + "px para");
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
