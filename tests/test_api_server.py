"""
tests/test_api_server.py
Unit and Integration tests for src/api_server.py
Validates /api/health, /api/locations, /api/farm/decision, zero budget, and edge cases.
"""

import sys
import io
import json
import threading
import time
import urllib.request
import urllib.error

if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

from src.api_server import ThreadedHTTPServer, FarmDecisionApiHandler

TEST_PORT = 8088
BASE_URL = f"http://127.0.0.1:{TEST_PORT}"

def run_server_bg(httpd):
    httpd.serve_forever()

def test_api_server_endpoints():
    print("==================================================")
    print("TESTING USICT038 REST API SERVER")
    print("==================================================")

    server_address = ("127.0.0.1", TEST_PORT)
    httpd = ThreadedHTTPServer(server_address, FarmDecisionApiHandler)
    server_thread = threading.Thread(target=run_server_bg, args=(httpd,), daemon=True)
    server_thread.start()
    time.sleep(0.5)

    try:
        # 1. Test GET /api/health
        print("\n1. Testing GET /api/health...")
        req = urllib.request.Request(f"{BASE_URL}/api/health")
        with urllib.request.urlopen(req) as resp:
            assert resp.status == 200, f"Expected 200, got {resp.status}"
            data = json.loads(resp.read().decode("utf-8"))
            assert data.get("status") == "ok", "Status must be ok"
            print(f"   [PASS] Health check verified: {data}")

        # 2. Test GET /api/locations
        print("\n2. Testing GET /api/locations...")
        req = urllib.request.Request(f"{BASE_URL}/api/locations")
        with urllib.request.urlopen(req) as resp:
            assert resp.status == 200, f"Expected 200, got {resp.status}"
            locations = json.loads(resp.read().decode("utf-8"))
            assert len(locations) > 0, "Locations list must not be empty"
            print(f"   [PASS] Locations retrieved: {len(locations)} districts cataloged")

        # 3. Test POST /api/farm/decision (Bhopal Baseline)
        print("\n3. Testing POST /api/farm/decision (Bhopal Kharif 5 Acres)...")
        bhopal_req = {
            "state_name": "Madhya Pradesh",
            "district_name": "Bhopal",
            "season": "Kharif",
            "land_size_acres": 5.0,
            "budget_inr": 120000.0,
            "irrigation_type": "Borewell",
            "irrigation_reliability": "High",
            "risk_tolerance": "Balanced",
            "force_refresh": True
        }
        req_data = json.dumps(bhopal_req).encode("utf-8")
        req = urllib.request.Request(
            f"{BASE_URL}/api/farm/decision",
            data=req_data,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as resp:
            assert resp.status == 200, f"Expected 200, got {resp.status}"
            res_json = json.loads(resp.read().decode("utf-8"))
            assert "farm_totals" in res_json, "Response must contain farm_totals"
            assert "weather" in res_json, "Response must contain weather"
            assert "risk" in res_json, "Response must contain risk"
            assert "crop_evaluations" in res_json, "Response must contain crop_evaluations"
            assert "allocated_crops" in res_json, "Response must contain allocated_crops"
            assert "explanation" in res_json, "Response must contain explanation"
            assert "scenarios" in res_json, "Response must contain scenarios"
            
            totals = res_json["farm_totals"]
            print(f"   [PASS] Decision Pipeline Output:")
            print(f"          - Net Profit: Rs. {totals['total_expected_net_profit_inr']:,.0f}")
            print(f"          - Expected ROI: +{totals['expected_farm_roi_pct']}%")
            print(f"          - Allocated Land: {totals['total_allocated_acres']} Acres")
            print(f"          - Headline: {res_json['explanation']['headline']}")

        # 4. Test Zero Budget POST /api/farm/decision
        print("\n4. Testing POST /api/farm/decision with Zero Budget (Edge Case)...")
        zero_req = {
            "state_name": "Madhya Pradesh",
            "district_name": "Bhopal",
            "season": "Kharif",
            "land_size_acres": 5.0,
            "budget_inr": 0.0,
            "force_refresh": True
        }
        req_data = json.dumps(zero_req).encode("utf-8")
        req = urllib.request.Request(
            f"{BASE_URL}/api/farm/decision",
            data=req_data,
            headers={"Content-Type": "application/json"}
        )
        with urllib.request.urlopen(req) as resp:
            assert resp.status == 200, f"Expected 200, got {resp.status}"
            res_json = json.loads(resp.read().decode("utf-8"))
            totals = res_json["farm_totals"]
            assert totals["total_allocated_acres"] == 0.0, "Allocated acres must be 0 for zero budget"
            assert totals["fallow_acres"] == 5.0, "Fallow acres must be 5.0 for zero budget"
            print(f"   [PASS] Zero budget correctly yielded 0 allocated acres and {totals['fallow_acres']} fallow acres.")

        # 5. Test Invalid Endpoint 404
        print("\n5. Testing 404 on invalid route...")
        try:
            req = urllib.request.Request(f"{BASE_URL}/api/unknown")
            urllib.request.urlopen(req)
            assert False, "Should have returned 404"
        except urllib.error.HTTPError as e:
            assert e.code == 404, f"Expected 404, got {e.code}"
            print("   [PASS] 404 properly returned for unknown route.")

        print("\n==================================================")
        print("ALL API SERVER ENDPOINT TESTS PASSED SUCCESSFULLY!")
        print("==================================================")

    finally:
        httpd.shutdown()
        httpd.server_close()

if __name__ == "__main__":
    test_api_server_endpoints()
