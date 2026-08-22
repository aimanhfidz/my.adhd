/* ============ my.adhd — service worker ============
   Two jobs: make the home-screen copy openable with no signal, and give
   Chrome the fetch handler it wants before it will offer a real install.

   Network first, cache second. The app is a single small shell that gets
   edited often, so a fresh copy always wins when there is a connection;
   the cache is the parachute, not the source of truth. The triage API is
   never cached — a stale answer is worse than an honest failure. */

const CACHE = 'myadhd-v2';

const SHELL = [
  '/',
  '/install',
  '/app',
  '/app.js',
  '/styles.css',
  '/theme.css',
  '/landing.css',
  '/install.css',
  '/mascot.svg',
  '/favicon.svg',
  '/fonts/Baloo2-Variable.ttf',
  '/icons/apple-touch-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/site.webmanifest',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      // one bad URL must not fail the whole install
      .then((c) => Promise.allSettled(SHELL.map((u) => c.add(u))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  if (url.pathname.startsWith('/api/')) return;

  e.respondWith(
    fetch(req)
      .then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(req, copy));
        }
        return res;
      })
      .catch(() =>
        caches.match(req).then((hit) =>
          hit || (req.mode === 'navigate' ? caches.match('/app') : undefined)
        )
      )
  );
});
