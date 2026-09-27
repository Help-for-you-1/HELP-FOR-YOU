const CACHE_NAME = 'help-for-you-v2';
const APP_SHELL = [
  '/HELP-FOR-YOU/',
  '/HELP-FOR-YOU/index.html',
  '/HELP-FOR-YOU/login.html',
  '/HELP-FOR-YOU/manifest.json',
  '/HELP-FOR-YOU/hfy-logo.svg',
  '/HELP-FOR-YOU/pwa-icon-192.png',
  '/HELP-FOR-YOU/pwa-icon-512.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  event.respondWith(
    fetch(event.request)
      .then(response => {
        const copy = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
        return response;
      })
      .catch(() => caches.match(event.request).then(cached => cached || caches.match('/HELP-FOR-YOU/index.html')))
  );
});