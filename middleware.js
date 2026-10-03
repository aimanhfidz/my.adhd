/* focus.myadhd.my's front door.

   The subdomain's root has to serve focus/index.html, and vercel.json
   cannot do it: Vercel looks for a file before it applies a rewrite, and
   "/" always finds this repo's index.html — the main site's home page. So
   the rewrite there never fired, and the subdomain opened on the wrong
   page. Routing Middleware runs before that lookup.

   It is matched to "/" only, and anything that is not the focus host walks
   straight through untouched. Every other focus path is handled by the
   host-scoped redirects in vercel.json, which do work, because there the
   file lookup is what we want. */

export const config = { matcher: '/' };

export default function middleware(request) {
  const url = new URL(request.url);
  if (url.hostname !== 'focus.myadhd.my') return;
  return new Response(null, {
    headers: { 'x-middleware-rewrite': new URL('/focus/index.html', url).toString() },
  });
}
