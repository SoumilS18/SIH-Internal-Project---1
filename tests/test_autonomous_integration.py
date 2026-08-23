"""
tests/test_autonomous_integration.py
End-to-End Real Backend -> Autonomous Sentinel Integration Test.
Runs actual requests through FarmDecisionService and verifies integration with Autonomous Sentinel.
"""

import sys
import os
import json
import subprocess

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Ensure UTF-8 output formatting for terminal
if sys.stdout and hasattr(sys.stdout, "reconfigure"):
    try:
        sys.stdout.reconfigure(encoding='utf-8', errors='replace')
    except Exception:
        pass

from src.farm_service import FarmDecisionService
from src.api_models import FarmDecisionRequest, FarmDecisionResponse

service = FarmDecisionService()

print("================================================================================")
print("REAL BACKEND -> AUTONOMOUS SENTINEL INTEGRATION SUITE")
print("================================================================================\n")

test_scenarios = [
    {
        "name": "Bhopal Kharif Normal",
        "request": FarmDecisionRequest(
            state_name="Madhya Pradesh",
            district_name="Bhopal",
            land_size_acres=5.0,
            budget_inr=100000.0,
            irrigation_type="Borewell",
            irrigation_reliability="High",
            season="Kharif",
            risk_tolerance="Balanced",
        ),
    },
    {
        "name": "Bareilly Rabi Irrigated",
        "request": FarmDecisionRequest(
            state_name="Uttar Pradesh",
            district_name="Bareilly",
            land_size_acres=10.0,
            budget_inr=150000.0,
            irrigation_type="Canal",
            irrigation_reliability="Medium",
            season="Rabi",
            risk_tolerance="Conservative",
        ),
    },
    {
        "name": "Ahmednagar Rainfed Kharif",
        "request": FarmDecisionRequest(
            state_name="Maharashtra",
            district_name="Ahmednagar",
            land_size_acres=8.0,
            budget_inr=80000.0,
            irrigation_type="Rainfed",
            irrigation_reliability="Low",
            season="Kharif",
            risk_tolerance="Aggressive",
        ),
    },
]

passed = 0
total = 0

for sc in test_scenarios:
    total += 1
    print(f">>> Scenario: {sc['name']}")
    resp = service.get_farm_decision(sc['request'])
    resp_dict = resp.to_dict()
    
    # 1. Assert backend response validity
    assert len(resp.allocated_crops) > 0, "No crops allocated"
    assert resp.farm_totals.total_land_acres > 0, "Land size must be > 0"
    assert resp.weather is not None, "Weather missing"
    assert resp.risk is not None, "Risk missing"
    
    # 2. Assert JSON serializability
    serialized = json.dumps(resp_dict)
    assert len(serialized) > 1000, "Serialized JSON too small"
    
    # 3. Feed JSON directly to Autonomous Sentinel engine via Bun script
    test_script = f"""
    import {{ runAutonomousCycle }} from './src/services/autonomousSentinel';
    const decision = {serialized};
    const resEn = runAutonomousCycle(decision, 'en');
    const resHi = runAutonomousCycle(decision, 'hi');
    if (!resEn.log.verification_status || !resHi.log.verification_status) {{
      process.exit(1);
    }}
    console.log('    [Autonomous Cycle Result]:', resEn.log.action_name, '| Status:', resEn.log.verification_status);
    """
    
    result = subprocess.run(
        ["bun", "-e", test_script],
        capture_output=True,
        text=True,
        cwd=os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
    )
    
    if result.returncode == 0:
        passed += 1
        print(f"  [PASS] Backend -> Autonomous Sentinel cycle executed cleanly.")
        print(result.stdout.strip())
    else:
        print(f"  [FAIL] Failed executing autonomous cycle:")
        print(result.stderr)
        sys.exit(1)

print("\n================================================================================")
print(f"INTEGRATION SUMMARY: {passed} / {total} SCENARIOS VERIFIED [100% SUCCESS]")
print("================================================================================\n")
