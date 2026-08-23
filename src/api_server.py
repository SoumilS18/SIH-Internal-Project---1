"""
src/api_server.py
Lightweight, multi-threaded REST API server for Autonomous Farm Decision Intelligence.
Exposes standard HTTP endpoints:
  - GET  /api/health
  - GET  /api/locations
  - POST /api/farm/decision
"""

import sys
import io
import json
import argparse
from http.server import HTTPServer, BaseHTTPRequestHandler
from socketserver import ThreadingMixIn
from typing import Dict, Any, Optional

import os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

from src.farm_service import FarmDecisionService
from src.api_models import FarmDecisionRequest, FarmDecisionResponse
from src.db_manager import DatabaseManager

class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    """Multi-threaded HTTP Server for handling concurrent requests."""
    daemon_threads = True
    allow_reuse_address = True

class FarmDecisionApiHandler(BaseHTTPRequestHandler):
    """HTTP Request Handler for Farm Decision Intelligence API."""
    
    # Shared service instances
    _service: Optional[FarmDecisionService] = None
    _db: Optional[DatabaseManager] = None

    @classmethod
    def get_service(cls) -> FarmDecisionService:
        if cls._service is None:
            cls._service = FarmDecisionService()
        return cls._service

    @classmethod
    def get_db(cls) -> DatabaseManager:
        if cls._db is None:
            cls._db = DatabaseManager()
        return cls._db

    def _set_cors_headers(self, status: int = 200, content_type: str = "application/json"):
        self.send_response(status)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Content-Type", content_type)
        self.end_headers()

    def do_OPTIONS(self):
        """Handle CORS pre-flight request."""
        self._set_cors_headers(200)

    def do_GET(self):
        """Handle GET requests."""
        url_path = self.path.split("?")[0]

        if url_path == "/api/health" or url_path == "/":
            payload = {
                "status": "ok",
                "service": "Autonomous Farm Decision Intelligence",
                "version": "1.0.0",
                "hackathon": "Smart India Hackathon 2026"
            }
            body = json.dumps(payload).encode("utf-8")
            self._set_cors_headers(200)
            self.wfile.write(body)
            return

        elif url_path == "/api/locations":
            try:
                db = self.get_db()
                districts = db.get_all_districts()
                body = json.dumps(districts).encode("utf-8")
                self._set_cors_headers(200)
                self.wfile.write(body)
            except Exception as e:
                err_payload = {"status": "error", "message": f"Failed to retrieve locations: {str(e)}"}
                body = json.dumps(err_payload).encode("utf-8")
                self._set_cors_headers(500)
                self.wfile.write(body)
            return

        else:
            self._set_cors_headers(404)
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode("utf-8"))

    def do_POST(self):
        """Handle POST requests."""
        url_path = self.path.split("?")[0]

        if url_path in ("/api/farm/decision", "/api/decision"):
            try:
                content_length = int(self.headers.get("Content-Length", 0))
                if content_length == 0:
                    self._set_cors_headers(400)
                    self.wfile.write(json.dumps({"status": "error", "message": "Empty request body"}).encode("utf-8"))
                    return

                raw_body = self.rfile.read(content_length).decode("utf-8")
                try:
                    data = json.loads(raw_body)
                except json.JSONDecodeError as je:
                    self._set_cors_headers(400)
                    self.wfile.write(json.dumps({"status": "error", "message": f"Invalid JSON payload: {str(je)}"}).encode("utf-8"))
                    return

                # Convert incoming JSON dict to validated FarmDecisionRequest
                request_obj = FarmDecisionRequest.from_dict(data)

                # Execute decision pipeline
                service = self.get_service()
                response_obj: FarmDecisionResponse = service.get_farm_decision(request_obj)

                # Serialize to clean JSON
                response_dict = response_obj.to_dict()
                body = json.dumps(response_dict).encode("utf-8")

                self._set_cors_headers(200)
                self.wfile.write(body)

            except Exception as e:
                err_payload = {
                    "status": "error",
                    "message": f"Farm decision pipeline error: {str(e)}"
                }
                body = json.dumps(err_payload).encode("utf-8")
                self._set_cors_headers(500)
                self.wfile.write(body)
            return

        else:
            self._set_cors_headers(404)
            self.wfile.write(json.dumps({"error": "Endpoint not found"}).encode("utf-8"))

    def handle_one_request(self):
        try:
            super().handle_one_request()
        except (ConnectionResetError, BrokenPipeError):
            pass
        except Exception as e:
            sys.stderr.write(f"[HTTP Handler Error] {e}\n")

    def log_message(self, format: str, *args: Any):
        """Custom concise logging format."""
        sys.stderr.write(f"[{self.log_date_time_string()}] {format % args}\n")

def run_server(host: str = "127.0.0.1", port: int = 8000):
    """Starts the Threaded HTTPServer."""
    server_address = (host, port)
    httpd = ThreadedHTTPServer(server_address, FarmDecisionApiHandler)
    print(f"==================================================")
    print(f"AgriOptima Farm Intelligence API Server")
    print(f"Running on http://{host}:{port}")
    print(f"Health Check: http://{host}:{port}/api/health")
    print(f"Locations:    http://{host}:{port}/api/locations")
    print(f"Decision:     POST http://{host}:{port}/api/farm/decision")
    print(f"==================================================")
    while True:
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server gracefully...")
            httpd.shutdown()
            httpd.server_close()
            break
        except Exception as ex:
            sys.stderr.write(f"[Server Recovered] {ex}\n")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="AgriOptima API Server")
    parser.add_argument("--host", default="127.0.0.1", help="Host binding address (default: 127.0.0.1)")
    parser.add_argument("--port", type=int, default=8000, help="Port to bind server (default: 8000)")
    args = parser.parse_args()
    run_server(host=args.host, port=args.port)
