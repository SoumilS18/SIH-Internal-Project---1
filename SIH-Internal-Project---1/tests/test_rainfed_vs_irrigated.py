"""
tests/test_rainfed_vs_irrigated.py
Validates how irrigation infrastructure dynamically changes agricultural risk
and crop selection under identical environmental drought conditions.
"""

import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from src.farm_service import FarmDecisionService

def test_rainfed_vs_irrigated_comparison():
    print("================================================================================")
    print("TEST 2: RAINFED vs IRRIGATED DECISION SHIFT UNDER DROUGHT")
    print("================================================================================")

    service = FarmDecisionService()
    drought_scenario = "Severe Drought Anomaly (-40% rain, dry soil)"

    # Scenario A: Rainfed Farm in Bhopal (Rabi season: Wheat vs Gram)
    res_rainfed = service.execute_decision_pipeline(
        state_name="Madhya Pradesh",
        district_name="Bhopal",
        land_size_acres=5.0,
        budget_inr=100000.0,
        irrigation_type="Rainfed",
        irrigation_reliability="Low",
        season="Rabi",
        risk_tolerance="Conservative",
        weather_override=drought_scenario
    )

    # Scenario B: Drip / Borewell Irrigated Farm in Bhopal (Rabi season)
    res_irrigated = service.execute_decision_pipeline(
        state_name="Madhya Pradesh",
        district_name="Bhopal",
        land_size_acres=5.0,
        budget_inr=100000.0,
        irrigation_type="Drip",
        irrigation_reliability="High",
        season="Rabi",
        risk_tolerance="Conservative",
        weather_override=drought_scenario
    )

    print("\n--- SCENARIO A: RAINFED FARM (No Irrigation Buffer) ---")
    opt_a = res_rainfed["optimization"]
    tot_a = opt_a["farm_totals"]
    mit_a = res_rainfed["farm_state"]["risk"]["effective_drought_mitigation"]
    print(f"Effective Drought Mitigation: {mit_a} (Full 100% Drought Exposure)")
    for c in opt_a["allocated_crops"]:
        print(f"  -> {c['crop_name']}: {c['allocated_acres']} Acres ({c['acre_share_pct']}%) | Expected Yield: {c['expected_yield_qtl_acre']} Qtl/Acre | Net Profit: Rs. {c['net_profit_inr']:,.0f} (ROI: +{c['roi_pct']}%)")
    print(f"Total Farm Expected Net Profit: Rs. {tot_a['total_expected_net_profit_inr']:,.0f} (ROI: +{tot_a['expected_farm_roi_pct']}%) | Risk: {tot_a['weighted_risk_score']}")

    print("\n--- SCENARIO B: DRIP IRRIGATED FARM (High Irrigation Buffer) ---")
    opt_b = res_irrigated["optimization"]
    tot_b = opt_b["farm_totals"]
    mit_b = res_irrigated["farm_state"]["risk"]["effective_drought_mitigation"]
    print(f"Effective Drought Mitigation: {mit_b} (92% Drought Buffer)")
    for c in opt_b["allocated_crops"]:
        print(f"  -> {c['crop_name']}: {c['allocated_acres']} Acres ({c['acre_share_pct']}%) | Expected Yield: {c['expected_yield_qtl_acre']} Qtl/Acre | Net Profit: Rs. {c['net_profit_inr']:,.0f} (ROI: +{c['roi_pct']}%)")
    print(f"Total Farm Expected Net Profit: Rs. {tot_b['total_expected_net_profit_inr']:,.0f} (ROI: +{tot_b['expected_farm_roi_pct']}%) | Risk: {tot_b['weighted_risk_score']}")

    # Comparison Check
    profit_diff = tot_b['total_expected_net_profit_inr'] - tot_a['total_expected_net_profit_inr']
    print(f"\n>> IRRIGATION SECURITY ADVANTAGE: +Rs. {profit_diff:,.0f} Net Gain (+{tot_b['expected_farm_roi_pct'] - tot_a['expected_farm_roi_pct']:.1f}% ROI Delta)")
    print(f">> Agent Explanation (Rainfed): {res_rainfed['explanation']['headline']}")
    print(f">> Agent Explanation (Irrigated): {res_irrigated['explanation']['headline']}")

    assert tot_b['total_expected_net_profit_inr'] > tot_a['total_expected_net_profit_inr'], "Irrigated farm should achieve higher profit under drought"
    print("\n[SUCCESS] Rainfed vs Irrigated comparison test passed successfully!")

if __name__ == "__main__":
    test_rainfed_vs_irrigated_comparison()
