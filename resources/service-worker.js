const CACHE_NAME = "artgroup-cache-v1";
const urlsToCache = [
  "/staffmanage/",
  "/staffmanage/index.html",
  "/staffmanage/manifest.json",
  "/staffmanage/assets/images/icon.png"
];

// Install Service Worker and cache assets
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
  console.log("✅ Service Worker Installed");
});

// Activate SW
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.map(key => key !== CACHE_NAME && caches.delete(key)))
    )
  );
  console.log("🚀 Service Worker Activated");
});

// Fetch from cache or network
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
