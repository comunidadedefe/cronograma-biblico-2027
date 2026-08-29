const CACHE = "biblia-2027-v8";
const ASSETS = [
  "./","./index.html","./styles.css","./enhancements.css","./visual-v5.css","./app.js","./calendar-2027.js","./visual-v5.js","./data.js","./manifest.webmanifest","./icon.svg",
  "./banner-data/chunk01.js","./banner-data/chunk02.js","./banner-data/chunk03.js","./banner-data/chunk04.js",
  "./banner-data/chunk05.js","./banner-data/chunk06.js","./banner-data/chunk07.js","./banner-data/chunk08.js","./banner-data/init.js"
];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(caches.match(event.request).then(response => response || fetch(event.request)));
});
