// Çevrimdışı çalışma için basit önbellek. Dosya listesi değişince sürümü artır.
const CACHE = "hayat-simulator-v12";
const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./assets/fonts/baloo2-latin-ext.woff2",
  "./assets/fonts/baloo2-latin.woff2",
  "./assets/fonts/fonts.css",
  "./assets/fonts/nunito-latin-ext.woff2",
  "./assets/fonts/nunito-latin.woff2",
  "./js/content/economy.js",
  "./js/content/config.js",
  "./js/content/cities.js",
  "./js/content/costs.js",
  "./js/content/events.js",
  "./js/content/events-daily.js",
  "./js/content/events-family.js",
  "./js/content/events-life.js",
  "./js/content/activities.js",
  "./js/content/endings.js",
  "./js/content/questions.js",
  "./js/art/fluent.js",
  "./js/art/turkey-map.js",
  "./js/art/character.js",
  "./js/art/scene.js",
  "./js/art/rooms.js",
  "./js/engine.js",
  "./js/systems/body.js",
  "./js/systems/skills.js",
  "./js/systems/companies.js",
  "./js/systems/invest.js",
  "./js/systems/migration.js",
  "./js/systems/housing.js",
  "./js/systems/music.js",
  "./js/systems/time.js",
  "./js/systems/bank.js",
  "./js/systems/life.js",
  "./js/systems/budget.js",
  "./js/systems/family.js",
  "./js/systems/exam.js",
  "./js/systems/calendar.js",
  "./js/systems/realism.js",
  "./js/systems/stories.js",
  "./js/systems/internship.js",
  "./js/systems/circle.js",
  "./js/content/stories-home.js",
  "./js/content/stories-life.js",
  "./js/content/stories-work.js",
  "./js/content/stories-fame.js",
  "./js/content/moments.js",
  "./js/systems/achievements.js",
  "./js/audio.js",
  "./js/cloud.js",
  "./js/shop.js",
  "./js/ui.js",
  "./manifest.webmanifest",
  "./icon.svg",
];
self.addEventListener("install", (e) =>
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES))),
);
self.addEventListener("activate", (e) =>
  e.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)),
        ),
      ),
  ),
);
// Önce ağ, olmazsa önbellek: güncellemeler hemen görünür, çevrimdışı da çalışır.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((r) => {
        if (r.ok) {
          const copy = r.clone();
          caches.open(CACHE).then((c) => c.put(e.request, copy));
        }
        return r;
      })
      .catch(() =>
        caches.match(e.request).then((m) => m || caches.match("./index.html")),
      ),
  );
});
