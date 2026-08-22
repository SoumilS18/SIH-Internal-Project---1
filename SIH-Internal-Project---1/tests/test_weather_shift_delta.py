"""
tests/test_weather_shift_delta.py
Demonstrates how changing real-time and forecast weather conditions
dynamically changes the optimal crop allocation on the exact same farm.
"""

import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from src.farm_service import FarmDecisionService

def test_weather_shift_delta():
    print("================================================================================")
    print("TEST 3: DYNAMIC WEATHER SHIFT & ADAPTIVE CROP RE-ALLOCATION")
    print("================================================================================")

    service = FarmDecisionService()
    state = "Maharashtra"
    dist = "Aurangabad"
    land = 10.0
    budget = 250000.0
    irr_type = "Rainfed"
    irr_rel = "Medium"
    season = "Kharif"

    # 1. Normal Conditions
    res_normal = service.execute_decision_pipeline(
        state_name=state, district_name=dist, land_size_acres=land, budget_inr=budget,
        irrigation_type=irr_type, irrigation_reliability=irr_rel, season=season,
        weather_override=None # Live / Standard
    )

    # 2. Severe Waterlogging / Heavy Rain Anomaly
    res_waterlog = service.execute_decision_pipeline(
        state_name=state, district_name=dist, land_size_acres=land, budget_inr=budget,
        irrigation_type=irr_type, irrigation_reliability=irr_rel, season=season,
        weather_override="Excess Rainfall & Waterlogging (+80% rain, saturated)"
    )

    # 3. Severe Drought Anomaly
    res_drought = service.execute_decision_pipeline(
        state_name=state, district_name=dist, land_size_acres=land, budget_inr=budget,
        irrigation_type=irr_type, irrigation_reliability=irr_rel, season=season,
        weather_override="Severe Drought Anomaly (-40% rain, dry soil)"
    )

    def extract_allocation(res):
        opt = res["optimization"]
        alloc_map = {c["crop_name"]: c["allocated_acres"] for c in opt["allocated_crops"]}
        return alloc_map, opt["farm_totals"]["total_expected_net_profit_inr"], opt["farm_totals"]["expected_farm_roi_pct"]

    alloc_norm, profit_norm, roi_norm = extract_allocation(res_normal)
    alloc_water, profit_water, roi_water = extract_allocation(res_waterlog)
    alloc_dry, profit_dry, roi_dry = extract_allocation(res_drought)

    all_crops = sorted(list(set(list(alloc_norm.keys()) + list(alloc_water.keys()) + list(alloc_dry.keys()))))

    print(f"\nLocation: {dist}, {state} | Farm Size: {land} Acres | Irrigation: {irr_type}")
    print("\n" + "="*85)
    print(f"{'Crop Name':<20} | {'Normal Weather':<18} | {'Heavy Rain / Flood':<18} | {'Severe Drought':<18}")
    print("="*85)
    for crop in all_crops:
        a_n = f"{alloc_norm.get(crop, 0.0):.1f} Acres"
        a_w = f"{alloc_water.get(crop, 0.0):.1f} Acres"
        a_d = f"{alloc_dry.get(crop, 0.0):.1f} Acres"
        print(f"{crop:<20} | {a_n:<18} | {a_w:<18} | {a_d:<18}")
    print("="*85)
    print(f"{'Net Profit (Rs.)':<20} | Rs. {profit_norm:<14,.0f} | Rs. {profit_water:<14,.0f} | Rs. {profit_dry:<14,.0f}")
    print(f"{'Farm ROI (%)':<20} | {roi_norm:>13.1f}% | {roi_water:>13.1f}% | {roi_dry:>13.1f}%")
    print("="*85)

    print("\n--- AGENT REASONING UNDER WEATHER SHIFTS ---")
    print(f"1. Normal Weather : {res_normal['explanation']['headline']}")
    print(f"2. Waterlogged    : {res_waterlog['explanation']['headline']}")
    print(f"3. Severe Drought : {res_drought['explanation']['headline']}")

    # Validate that allocations are not identical across extreme weather conditions
    assert alloc_norm != alloc_dry or alloc_norm != alloc_water, "Weather change must trigger dynamic re-allocation"
    print("\n[SUCCESS] Dynamic weather shift delta test passed successfully!")

if __name__ == "__main__":
    test_weather_shift_delta()
