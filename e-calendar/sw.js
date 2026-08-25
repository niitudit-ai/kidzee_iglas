/* E-Calendar service worker — offline app shell.
   Bump CACHE_VERSION whenever index.html / app.css / app.js change,
   otherwise returning visitors keep the old cached copy. */
const CACHE_VERSION = 'ecal-v2.1.0';

/* The shared calendar must NEVER be served from cache first — a stale copy here
   means somebody misses a change that was already published. */
const LIVE_DATA = 'data/calendar.json';

const SHELL = [
  './',
  './index.html',
  './assets/css/app.css',
  './assets/js/app.js',
  './assets/img/favicon.svg',
  './assets/img/icon-maskable.svg',
  './manifest.webmanifest'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION)
      // addAll fails the whole install if any single file 404s, so add individually
      .then((cache) => Promise.all(SHELL.map((url) => cache.add(url).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting();
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  /* Network-first for the shared calendar: always try the real thing, and only
     fall back to the last known copy when there is no connection. */
  if (url.pathname.endsWith('/' + LIVE_DATA)) {
    event.respondWith(
      fetch(req, { cache: 'no-store' })
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE_VERSION).then((c) => c.put(req, copy));
          }
          return res;
        })
        .catch(() => caches.open(CACHE_VERSION).then((c) => c.match(req, { ignoreSearch: true })))
    );
    return;
  }

  /* Everything else: stale-while-revalidate — instant load, silent refresh. */
  event.respondWith(
    caches.open(CACHE_VERSION).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });

      const network = fetch(req)
        .then((res) => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);

      if (cached) return cached;

      const fresh = await network;
      if (fresh) return fresh;

      // Offline and never cached: fall back to the app shell for navigations.
      if (req.mode === 'navigate') {
        const shell = await cache.match('./index.html');
        if (shell) return shell;
      }
      return new Response('Offline', { status: 503, statusText: 'Offline' });
    })
  );
});
