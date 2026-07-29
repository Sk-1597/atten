const CACHE_NAME = 'artgroup-staffmanage-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/attendance.html',
  '/profile.html',
  '/leave.html',
  '/allowance.html',
  '/history.html',
  '/performance.html',
  '/assets/css/mobil.css',
  '/assets/images/logo.png',
  '/assets/images/icon.png',
  '/assets/js/auth.js',
  '/assets/js/attendance.js',
  '/assets/js/database.js'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response;
        }
        return fetch(event.request);
      })
  );
});

self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});
