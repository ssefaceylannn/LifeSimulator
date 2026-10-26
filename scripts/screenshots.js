// Mağaza ekran görüntüleri: App Store (6,9" iPhone, 1290×2796) ve Google Play (1080×2340).
// Kullanım: node scripts/screenshots.js  →  store/screenshots/{ios,android}/*.png
// Oyun gerçek bir hayat oynayarak (rastgele seçimlerle) birkaç yıl ilerletilir, sonra ekranlar çekilir.
const { chromium } = require("playwright");
const path = require("path");
const fs = require("fs");
const ROOT = path.join(__dirname, "..");
const SIZES = { ios: { w: 430, h: 932, s: 3 }, android: { w: 360, h: 780, s: 3 } };

(async () => {
  const browser = await chromium.launch();
  for (const [name, z] of Object.entries(SIZES)) {
    const dir = path.join(ROOT, "store/screenshots", name);
    fs.mkdirSync(dir, { recursive: true });
    const ctx = await browser.newContext({ viewport: { width: z.w, height: z.h }, deviceScaleFactor: z.s, isMobile: true, hasTouch: true });
    const p = await ctx.newPage();
    await p.goto("file://" + path.join(ROOT, "index.html"));
    await p.evaluate(() => {
      localStorage.clear();
      localStorage.setItem("hayatSimSettingsV1", JSON.stringify({ commute: false, music: false, sfx: false }));
    });
    await p.reload();
    const shot = (n) => p.screenshot({ path: path.join(dir, n + ".png") });
    await shot("01-ana-ekran");
    await p.click("#newLife");
    await p.fill("#firstName", "Elif");
    await p.fill("#lastName", "Yıldız");
    await p.selectOption("#birthCity", "İzmir");
    await p.click('[data-look="woman"]');
    await shot("02-karakter");
    await p.click("#beginLife");
    // Birkaç yıl oyna
    for (let i = 0; i < 160; i++) {
      while (await p.isVisible("#event")) await p.click("#eventContinue");
      if (await p.isVisible("#memoir")) break;
      const opts = await p.$$("#choices .choice:not([disabled])");
      if (!opts.length) break;
      await opts[(Math.random() * opts.length) | 0].click().catch(() => {});
      await p.click("#advanceBtn");
      if (await p.isVisible("#nameModal")) {
        await p.fill("#nameInput", "Defne");
        await p.click("#nameOk");
      }
    }
    while (await p.isVisible("#event")) await p.click("#eventContinue");
    // Görüntü için hoş bir durum: kendi evinde, partnerli
    await p.evaluate(() => {
      const s = HS.ui.active;
      s.mood = 82;
      s.health = 88;
      if (!s.partner) s.partner = { name: "Kaan", bond: 82, married: false, trust: 80 };
      HS.ui.render();
    });
    await p.click(".tab[data-tab=life]");
    await p.evaluate(() => window.scrollTo(0, 0));
    await shot("03-hayat");
    const tabs = [
      ["work", "04-is"],
      ["money", "05-para"],
      ["me", "06-ben"],
      ["world", "07-dunya"],
    ];
    for (const [t, n] of tabs) {
      await p.click(`.tab[data-tab=${t}]`);
      await p.evaluate(() => window.scrollTo(0, 0));
      await shot(n);
    }
    await p.click("#calBtn").catch(() => {});
    await p.waitForTimeout(200);
    await shot("08-takvim");
    await ctx.close();
    console.log(name, "→", dir);
  }
  await browser.close();
})();
