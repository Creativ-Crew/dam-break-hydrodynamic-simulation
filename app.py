from http.server import BaseHTTPRequestHandler, HTTPServer
import json

HOST, PORT = "127.0.0.1", 8000

SCENARIO = {
    "status": "ready",
    "engine": "Adaptive Multi-Fidelity",
    "outputs": ["depth", "velocity", "arrival_time"]
}

class Handler(BaseHTTPRequestHandler):
    def _send(self, code=200):
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()

    def do_GET(self):
        if self.path == "/api/health":
            self._send()
            self.wfile.write(json.dumps({"ok": True}).encode())
        elif self.path == "/api/scenario":
            self._send()
            self.wfile.write(json.dumps(SCENARIO).encode())
        else:
            self._send(404)
            self.wfile.write(json.dumps({"error": "not found"}).encode())

    def do_POST(self):
        if self.path == "/api/simulate":
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length) if length else b"{}"
            try:
                data = json.loads(body)
            except Exception:
                data = {}
            result = {
                "status": "queued",
                "message": "Simulation request accepted by prototype API.",
                "scenario": data,
            }
            self._send(202)
            self.wfile.write(json.dumps(result).encode())
        else:
            self._send(404)
            self.wfile.write(json.dumps({"error": "not found"}).encode())

if __name__ == "__main__":
    print(f"Prototype API running at http://{HOST}:{PORT}")
    HTTPServer((HOST, PORT), Handler).serve_forever()
