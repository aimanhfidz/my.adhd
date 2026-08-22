#!/usr/bin/env python3
"""Local preview that behaves like Vercel.

The site links to /app and /install, not /app.html — so a plain
`python3 -m http.server` now 404s on every page. This resolves the same
cleanUrls rule Vercel applies. It does not run the triage function; use
`vercel dev` when you need the API.

    python3 serve.py [port]
"""
import http.server
import os
import socketserver
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000


class CleanUrls(http.server.SimpleHTTPRequestHandler):
    def translate_path(self, path):
        found = super().translate_path(path)
        if not os.path.exists(found) and not path.endswith('/') and os.path.exists(found + '.html'):
            return found + '.html'
        return found


if __name__ == '__main__':
    os.chdir(os.path.dirname(os.path.abspath(__file__)))
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(('127.0.0.1', PORT), CleanUrls) as httpd:
        print(f'my.adhd → http://localhost:{PORT}')
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            pass
