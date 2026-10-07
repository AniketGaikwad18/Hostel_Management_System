"""
HostelGuard AI — Android SMS Gateway Local Simulation Server
=============================================================
This lightweight server mimics the physical Android SMS Gateway on your local machine
for development, local testing, and rapid hackathon dry-runs.

Endpoints:
- GET  /health     -> Returns gateway and SIM readiness status
- POST /send-sms   -> Authenticates Bearer token, logs emergency SMS, and returns SUCCESS

Usage:
    python android_gateway/mock_gateway.py
"""

import http.server
import json
import os
import sys
from datetime import datetime

PORT = int(os.getenv("MOCK_GATEWAY_PORT", "8080"))
API_KEY = os.getenv("SMS_GATEWAY_API_KEY", "hostelguard_sms_gateway_secret_2026")

class MockSmsGatewayHandler(http.server.BaseHTTPRequestHandler):
    def _send_json(self, status_code: int, data: dict):
        body = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/health":
            self._send_json(200, {
                "status": "ONLINE",
                "service": "HostelGuard Android SMS Gateway (Mock / Local Runner)",
                "sim_ready": True,
                "carrier": "Local Cellular SIM (Test)",
                "timestamp": datetime.utcnow().isoformat()
            })
        else:
            self._send_json(404, {"error": "Not Found"})

    def do_POST(self):
        if self.path == "/send-sms":
            # 1. Authenticate Authorization Bearer Header
            auth_header = self.headers.get("Authorization", "")
            expected_bearer = f"Bearer {API_KEY}"
            if auth_header != expected_bearer and not auth_header.endswith(API_KEY):
                print(f"[AUTH ERROR] Unauthorized request blocked. Received header: {auth_header}")
                self._send_json(401, {
                    "status": "UNAUTHORIZED",
                    "error": "Invalid or missing Bearer API Key"
                })
                return

            # 2. Parse JSON Payload
            try:
                content_len = int(self.headers.get("Content-Length", 0))
                raw_body = self.rfile.read(content_len).decode("utf-8")
                payload = json.loads(raw_body)
            except Exception as e:
                self._send_json(400, {
                    "status": "FAILED",
                    "error": f"Invalid JSON payload: {e}"
                })
                return

            phone = payload.get("phone", "")
            message = payload.get("message", "")

            if not phone or not message:
                self._send_json(400, {
                    "status": "FAILED",
                    "error": "Missing 'phone' or 'message' field"
                })
                return

            # 3. Simulate Physical SIM Transmission
            time_now = datetime.now().strftime("%I:%M:%S %p")
            print("\n" + "=" * 60)
            print(f"[ANDROID SMS GATEWAY - PHYSICAL SIM TRANSMISSION CONFIRMED]")
            print(f"Time:      {time_now}")
            print(f"Recipient: {phone}")
            print(f"Message:")
            print("-" * 60)
            print(message)
            print("=" * 60 + "\n")

            self._send_json(200, {
                "status": "SUCCESS",
                "message": "SMS dispatched to SIM radio network successfully",
                "phone": phone,
                "parts": 1 if len(message) <= 160 else 2,
                "delivered_at": datetime.utcnow().isoformat()
            })
        else:
            self._send_json(404, {"error": "Not Found"})

    def log_message(self, format, *args):
        # Clean custom logger
        return

def main():
    if hasattr(sys.stdout, 'reconfigure'):
        try:
            sys.stdout.reconfigure(encoding='utf-8', errors='replace')
        except Exception:
            pass

    server_address = ("0.0.0.0", PORT)
    httpd = http.server.ThreadingHTTPServer(server_address, MockSmsGatewayHandler)
    print("=" * 65)
    print(f"[HOSTELGUARD ANDROID SMS GATEWAY - LOCAL RUNNER ACTIVE]")
    print(f"Listening on:  http://127.0.0.1:{PORT} and local Wi-Fi")
    print(f"Required Key:  Bearer {API_KEY}")
    print(f"Status:        SIM READY (Listening for emergency alerts)")
    print("=" * 65)
    print("Press Ctrl+C to terminate.\n")
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down SMS Gateway server.")
        httpd.server_close()

if __name__ == "__main__":
    main()
