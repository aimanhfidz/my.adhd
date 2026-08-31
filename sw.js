/* ============ my.adhd — service worker ============
   Two jobs: make the home-screen copy openable with no signal, and give
   Chrome the fetch handler it wants before it will offer a real install.

   Network first, cache second. The app is a single small shell that gets
   edited often, so a fresh copy always wins when there is a connection;
   the cache is the parachute, not the source of truth. The triage API is
   never cached — a stale answer is worse than an honest failure. */

const CACHE = 'myadhd-v27';

const SHELL = [
  '/',
  '/install',
  '/app',
  '/privacy',
  '/terms',
  '/app.js',
  '/gcal.js',
  '/cloud.js',
  '/voice.js',
  '/auth.js',
  '/config.js',
  '/theme.js',
  '/waves.js',
  '/styles.css?v=4',
  '/theme.css',
  '/landing.css',
  '/legal.css',
  '/install.css',
  '/favicon.svg?v=3',
  '/fonts/Baloo2-Variable.ttf',
  '/icons/apple-touch-icon.png?v=3',
  '/icons/favicon-16.png?v=3',
  '/icons/favicon-32.png?v=3',
  '/icons/icon-192.png?v=3',
  '/icons/icon-512.png?v=3',
  '/site.webmanifest?v=3',

  /* The pictures the two waits are made of. Runtime caching picks these up
     after one online visit, which is no use to the install that goes onto
     the home screen and straight onto a train: the dump opened on a broken
     image and the loading screen on nothing at all. Both morphs, because
     which one is asked for depends on the theme at the time. */
  '/welcome-meme.jpg',
  '/animation/app/morph-light.mp4',
  '/animation/app/morph-dark.mp4',
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
