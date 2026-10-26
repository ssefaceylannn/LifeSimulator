// Çevrimdışı çalışma için basit önbellek. Dosya listesi değişince sürümü artır.
const CACHE = "hayat-simulator-v5";
const FILES = [
  "./",
  "./index.html",
  "./style.css",
  "./js/content/economy.js",
  "./js/content/cities.js",
  "./js/content/events.js",
  "./js/content/events-daily.js",
  "./js/content/events-family.js",
  "./js/content/activities.js",
  "./js/content/endings.js",
  "./js/art/fluent.js",
  "./js/art/character.js",
  "./js/art/scene.js",
  "./js/engine.js",
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
