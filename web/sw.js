/* Snake II service worker: precaches the static game, works offline. */
const CACHE = "snake-ii-v2.3.0";
const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/notice.css",
  "./css/style.css",
  "./js/audio.js",
  "./js/config.js",
  "./js/control.js",
  "./js/engine.js",
  "./js/font.js",
  "./js/fontpacks.js",
  "./js/framebuffer.js",
  "./js/i18n.js",
  "./js/input.js",
  "./js/lcd.js",
  "./js/main.js",
  "./js/notice.js",
  "./js/phone.js",
  "./js/pictures.js",
  "./js/rng.js",
  "./js/runtime.js",
  "./js/save.js",
  "./js/scene.js",
  "./js/screens.js",
  "./js/store.js",
  "./js/text.js",
  "./js/texts.js",
  "./js/tiles.js",
  "./js/tones.js",
  "./icons/icon-192.png",
  "./icons/icon-512.png",
  "./icons/maskable-192.png",
  "./icons/maskable-512.png",
  "./icons/apple-touch-icon.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

/* Network first (so a new release shows up at once), cache when offline. */
self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  event.respondWith(
    fetch(req)
      .then((res) => {
        if (res.ok) { const copy = res.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
        return res;
      })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((hit) => hit || caches.match("./index.html")))
  );
});
