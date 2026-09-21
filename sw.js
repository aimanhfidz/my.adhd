/* ============ my.adhd — service worker ============
   Two jobs: make the home-screen copy openable with no signal, and give
   Chrome the fetch handler it wants before it will offer a real install.

   Network first, cache second. The app is a single small shell that gets
   edited often, so a fresh copy always wins when there is a connection;
   the cache is the parachute, not the source of truth. The triage API is
   never cached — a stale answer is worse than an honest failure. */

/* v50: the lists screen reads two ways — the four deadline headings, and
   an Eisenhower matrix behind a toggle in the header, fed by a new
   `importance` field on the task. Notes were rebuilt: the editor is a
   screen of its own now, a note is a list of blocks rather than a string,
   and it carries pictures and a reminder. app.html, app.js and styles.css
   all moved, so the stylesheet goes to v8 — bumped in app.html and in the
   SHELL entry below together, or one of them asks for a file nobody kept.
   landing.css became chrome.css in the same pass, which is the other reason
   this had to move: a cached shell listing a filename that no longer exists
   fails its install and takes the whole precache with it.

   v49: settings became a grouped list — subscription, account, sync,
   about — with the profile, the feedback box and the plans on screens of
   their own under it. billing.js is loaded by the app now; it was already
   in the shell below, cached and never executed.

   v48: the bar is home / calendar / + / lists / notes. The dump box moved
   onto home, the profile and feedback screens became one settings screen
   behind the gear on it, and the stylesheet went to v7 with them — which
   is cached with its query string, so app.html and the SHELL entry below
   have to be bumped together or one of them asks for a file nobody kept.

   v47: the app is shut behind /soon — every cached copy of /app and
   /install carries the hold now, and /soon has to be cached with them or
   a home-screen copy opened offline redirects into nothing. */
const CACHE = 'myadhd-v53';   // v53: the matrix is back, for the iOS shell only

const SHELL = [
  '/',
  '/install',
  '/app',
  '/soon',
  '/privacy',
  '/terms',
  /* The public site. '/' above is the scene; these are the pages under
     it. */
  '/activities',
  '/about',
  '/testimonials',
  '/contact',
  '/self-check',
  '/blog',
  '/habits',
  '/reading-list',
  '/tools',
  '/app.js',
  '/gcal.js',
  '/cloud.js',
  '/voice.js',
  '/auth.js',
  '/billing.js',
  '/config.js',
  '/theme.js',
  '/clock.js',
  '/styles.css?v=8',
  '/theme.css',
  '/site.css',
  '/site.js',
  '/site.ms.js',
  /* the self-check is its own page with its own two files — see the
     head of test.css for why it shares nothing with the site */
  '/test.css',
  '/test.js',
  '/chrome.css',
  '/legal.css',
  '/install.css',
  '/favicon.svg?v=3',
  '/fonts/Baloo2-Variable.ttf',
  /* The site's two faces. Baloo above is the app's and the wordmark's;
     these are every other page's, and a home-screen copy opened offline
     without them falls back to the system sans, which is a different
     website. */
  '/fonts/DMSans-Variable.ttf',
  '/fonts/DMMono-Regular.ttf',
  '/fonts/DMMono-Light.ttf',
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
