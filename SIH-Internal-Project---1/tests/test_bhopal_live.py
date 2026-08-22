"""
tests/test_bhopal_live.py
Test script validating end-to-end execution on Bhopal, Madhya Pradesh with live Open-Meteo weather.
"""

import sys
import io

# Ensure UTF-8 output formatting for terminal
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')

from src.farm_service import FarmDecisionService

def test_bhopal_live_pipeline():
    print("==================================================")
    print("TEST 1: BHOPAL LIVE AGRO-ECONOMIC PIPELINE")
    print("==================================================")

    service = FarmDecisionService()
    result = service.execute_decision_pipeline(
        state_name="Madhya Pradesh",
        district_name="Bhopal",
        land_size_acres=5.0,
        budget_inr=120000.0,
        irrigation_type="Borewell",
        irrigation_reliability="High",
        season="Kharif",
        risk_tolerance="Balanced",
        force_refresh=True
    )

    state = result["farm_state"]
    opt = result["optimization"]
    exp = result["explanation"]

    print("\n1. DYNAMIC FARM STATE (Bhopal, MP):")
    print(f"  * District: {state['location']['district_name']}, {state['location']['state_name']}")
    print(f"  * Coordinates: Lat {state['location']['latitude']} deg N, Lon {state['location']['longitude']} deg E")
    print(f"  * Agro-climatic Zone: {state['location']['agro_climatic_zone']}")
    print(f"  * Soil Type: {state['location']['major_soil_type']}")
    print(f"  * IMD Annual Rainfall Normal: {state['historical']['imd_annual_rainfall_mm']} mm")
    print(f"  * Live Weather Source: {state['quality']['data_provider']} ({state['quality']['weather_timestamp']})")
    print(f"  * Live Temp: {state['current']['current_temperature_c']} C | RH: {state['current']['current_humidity_pct']}% | Wind: {state['current']['current_wind_kmh']} km/h")
    print(f"  * Live Root-Zone Soil Moisture: {state['current']['root_zone_soil_moisture_m3m3']} m3/m3 ({state['recent']['soil_moisture_status']})")
    print(f"  * 7-Day Rain Forecast: {state['forecast']['forecast_rain_7d_total_mm']} mm (Max Prob: {state['forecast']['max_rain_probability_7d_pct']}%)")
    print(f"  * Seasonal Rain Anomaly vs IMD: {state['recent']['rainfall_anomaly_pct']:+.1f}%")

    print("\n2. CROP PORTFOLIO ALLOCATION (Linear Program Result):")
    for crop in opt["allocated_crops"]:
        print(f"  -> {crop['crop_name']}: {crop['allocated_acres']} Acres ({crop['acre_share_pct']}%) | "
              f"Yield: {crop['expected_yield_qtl_acre']} Qtl/Acre | Price: Rs. {crop['modal_price_per_qtl']:,.0f}/Qtl | "
              f"Cost: Rs. {crop['total_cost_inr']:,.0f} | Revenue: Rs. {crop['total_revenue_inr']:,.0f} | "
              f"Net Profit: Rs. {crop['net_profit_inr']:,.0f} (ROI: +{crop['roi_pct']}%)")

    print(f"\n3. FARM TOTALS:")
    totals = opt["farm_totals"]
    print(f"  * Total Allocated: {totals['total_allocated_acres']} / {totals['total_land_acres']} Acres")
    print(f"  * Total Capital Required: Rs. {totals['total_investment_inr']:,.0f}")
    print(f"  * Total Expected Revenue: Rs. {totals['total_expected_revenue_inr']:,.0f}")
    print(f"  * Total Expected Net Profit: Rs. {totals['total_expected_net_profit_inr']:,.0f} (ROI: +{totals['expected_farm_roi_pct']}%)")

    print("\n4. AUTONOMOUS AGENT DECISION EXPLANATION:")
    print(f"  * Headline: {exp['headline']}")
    print(f"  * Environmental Summary: {exp['environmental_summary']}")
    print(f"  * Irrigation Impact: {exp['irrigation_impact']}")
    print("  * Crop Breakdown:")
    for c_exp in exp['allocated_crop_breakdown']:
        print(f"    {c_exp}")

    assert opt["status"] == "success", "Optimization should succeed"
    assert len(opt["allocated_crops"]) > 0, "Should allocate at least 1 crop"
    print("\n[SUCCESS] Bhopal live test passed successfully!")

if __name__ == "__main__":
    test_bhopal_live_pipeline()
