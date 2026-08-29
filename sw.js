const CACHE = "biblia-2027-v11";
const ASSETS = [
  "./","./index.html","./styles.css","./enhancements.css","./visual-v5.css","./app.js","./calendar-data-2027.js","./calendar-2027.js","./visual-v5.js","./onesignal.js","./data.js","./manifest.webmanifest","./icon.svg",
  "./01-janeiro.webp","./02-fevereiro.webp","./03-marco.webp","./04-abril.webp","./05-maio.webp","./06-junho.webp",
  "./07-julho.webp","./08-agosto.webp","./09-setembro.webp","./10-outubro.webp","./11-novembro.webp","./12-dezembro.webp",
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
  const request = event.request;
  const url = new URL(request.url);
  const isFreshAsset = request.mode === "navigate" || /\.(?:html|js|css)$/.test(url.pathname);

  if (isFreshAsset) {
    event.respondWith(
      fetch(request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE).then(cache => cache.put(request, copy));
          return response;
        })
        .catch(() => caches.match(request))
    );
    return;
  }

  event.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      const copy = response.clone();
      caches.open(CACHE).then(cache => cache.put(request, copy));
      return response;
    }))
  );
});
