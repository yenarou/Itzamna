#!/usr/bin/env python3
"""
Sirve el frontend (dist) y hace proxy de /api al backend para acceso en LAN.
Uso: python3 serve_lan.py [puerto]   (default: 8080)
"""
import http.server
import os
import socket
import socketserver
import sys
import urllib.error
import urllib.request
from urllib.parse import urlsplit

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "frontend", "dist")
BACKEND = os.environ.get("ITZAMNA_BACKEND", "http://127.0.0.1:5000")
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8080


def lan_ips():
    ips = set()
    try:
        for info in socket.getaddrinfo(socket.gethostname(), None):
            ip = info[4][0]
            if ip and not ip.startswith("127.") and ":" not in ip:
                ips.add(ip)
    except Exception:
        pass
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ips.add(s.getsockname()[0])
        s.close()
    except Exception:
        pass
    # fallback: read from `ip` output not needed, common cases covered
    return sorted(ips) or ["<IP-DE-ESTA-MAQUINA>"]


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, fmt, *args):
        # menos ruido
        sys.stdout.write("%s - %s\n" % (self.address_string(), fmt % args))

    def end_headers(self):
        # CORS in case the frontend calls this endpoint directly.
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def _proxy(self):
        target = BACKEND + self.path
        length = int(self.headers.get("Content-Length", 0) or 0)
        body = self.rfile.read(length) if length else None
        headers = {}
        ct = self.headers.get("Content-Type")
        if ct:
            headers["Content-Type"] = ct
        req = urllib.request.Request(target, data=body, headers=headers, method=self.command)
        try:
            with urllib.request.urlopen(req, timeout=180) as resp:
                data = resp.read()
                self.send_response(resp.status)
                rct = resp.headers.get("Content-Type", "application/json")
                self.send_header("Content-Type", rct)
                self.send_header("Content-Length", str(len(data)))
                self.end_headers()
                self.wfile.write(data)
        except urllib.error.HTTPError as e:
            data = e.read()
            self.send_response(e.code)
            self.send_header("Content-Type", e.headers.get("Content-Type", "application/json"))
            self.send_header("Content-Length", str(len(data)))
            self.end_headers()
            self.wfile.write(data)
        except Exception as e:
            msg = ("Proxy error: %s" % e).encode("utf-8")
            self.send_response(502)
            self.send_header("Content-Type", "text/plain; charset=utf-8")
            self.send_header("Content-Length", str(len(msg)))
            self.end_headers()
            self.wfile.write(msg)

    def do_GET(self):
        if self.path == "/api" or self.path.startswith("/api/"):
            return self._proxy()
        return super().do_GET()

    def do_POST(self):
        if self.path == "/api" or self.path.startswith("/api/"):
            return self._proxy()
        self.send_error(405, "Method Not Allowed")

    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            index = os.path.join(path, "index.html")
            if os.path.exists(index):
                path = index
        if not os.path.exists(path):
            # SPA fallback
            path = os.path.join(ROOT, "index.html")
        ctype = self.guess_type(path)
        try:
            f = open(path, "rb")
        except OSError:
            self.send_error(404, "File not found")
            return None
        try:
            fs = os.fstat(f.fileno())
            self.send_response(200)
            self.send_header("Content-type", ctype)
            self.send_header("Content-Length", str(fs.st_size))
            self.end_headers()
            return f
        except Exception:
            f.close()
            raise


class Threaded(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True


if __name__ == "__main__":
    if not os.path.isdir(ROOT):
        print("No existe frontend/dist en", ROOT)
        sys.exit(1)
    with Threaded(("0.0.0.0", PORT), Handler) as httpd:
        print("Sirviendo frontend:", ROOT)
        print("Proxy /api ->", BACKEND)
        for ip in lan_ips():
            print(f"URL LAN: http://{ip}:{PORT}/")
        print(f"URL local: http://127.0.0.1:{PORT}/")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nDetenido")
