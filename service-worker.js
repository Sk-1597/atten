const CACHE_NAME = "artgroup-cache-v2";
const urlsToCache = [
    "./",
    "./index.html",
    "./resources/manifest.json",
    "./assets/images/icon.png",
    "./assets/css/mobil.css",
    "./assets/js/auth.js"
];

// Install Service Worker and cache assets
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            console.log("Opened cache");
            return cache.addAll(urlsToCache);
        })
    );
    self.skipWaiting();
});

// Activate SW
self.addEventListener("activate", event => {
    event.waitUntil(
        caches.keys().then(keys =>
            Promise.all(
                keys.map(key => {
                    if (key !== CACHE_NAME) {
                        console.log("Clearing old cache", key);
                        return caches.delete(key);
                    }
                })
            )
        )
    );
    self.clients.claim();
    console.log("🚀 Service Worker Activated");
});

// Fetch from cache or network
self.addEventListener("fetch", event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request).catch(() => {
                // Optional: Return offline page if fetch fails and not in cache
            });
        })
    );
});
