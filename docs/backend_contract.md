# AgriOptima AI (USICT038) — Backend Service API Contract Specification

**Target:** Smart India Hackathon 2026  
**Document Version:** 1.0.0  
**Status:** Approved & Verified  

---

## 1. Overview & Architectural Philosophy

The **AgriOptima AI** backend is designed to be completely decoupled from any specific presentation layer (Streamlit, React, React Native, Flutter, or REST/gRPC microservices). 

All agricultural intelligence, multi-depth soil physics, historical econometric baselines, dynamic weather ingestion, and SciPy HiGHS linear programming optimizations are encapsulated behind a single deterministic service endpoint:

```python
from src.farm_service import FarmDecisionService
from src.api_models import FarmDecisionRequest, FarmDecisionResponse

service = FarmDecisionService()
response: FarmDecisionResponse = service.get_farm_decision(request)
json_payload = response.to_dict() # 100% JSON-serializable
```

---

## 2. Request Schema

### `FarmDecisionRequest`

| Field | Type | Required | Default | Description / Constraints |
| :--- | :--- | :--- | :--- | :--- |
| `state_name` | `string` | Yes | `"Madhya Pradesh"` | Indian State name matching catalog |
| `district_name` | `string` | Yes | `"Bhopal"` | Indian District name matching catalog |
| `land_size_acres` | `float` | Yes | `5.0` | Total farm land size in acres ($\ge 0.0$) |
| `budget_inr` | `float` | Yes | `120000.0` | Total available capital budget in ₹ INR ($\ge 0.0$) |
| `irrigation_type` | `enum` | Yes | `"Borewell"` | `"Borewell"`, `"Rainfed"`, `"Canal"`, `"Drip"`, `"Sprinkler"` |
| `irrigation_reliability` | `enum` | Yes | `"High"` | `"High"`, `"Medium"`, `"Low"` |
| `season` | `enum` | Yes | `"Kharif"` | `"Kharif"`, `"Rabi"`, `"Zaid"` |
| `risk_tolerance` | `enum` | Yes | `"Balanced"` | `"Balanced"`, `"Conservative"`, `"Aggressive"` |
| `custom_lat` | `float \| null`| No | `null` | Optional GPS latitude override in Decimal Degrees |
| `custom_lon` | `float \| null`| No | `null` | Optional GPS longitude override in Decimal Degrees |
| `weather_override` | `string \| null`| No | `null` | Stress scenario override string |
| `force_refresh` | `boolean` | No | `false` | If true, bypasses 3-hour SQLite weather cache |
| `simulate_primary_failure` | `boolean` | No | `false` | If true, forces NASA POWER fallback tier |
| `simulate_all_failure` | `boolean` | No | `false` | If true, forces offline historical climatology mode |

---

## 3. Response Schema

### `FarmDecisionResponse` Top-Level Hierarchy

```json
{
  "request": { ... },
  "location": { ... },
  "weather": { ... },
  "risk": { ... },
  "crop_evaluations": [ { ... } ],
  "allocated_crops": [ { ... } ],
  "farm_totals": { ... },
  "explanation": { ... },
  "alerts": [ ... ],
  "scenarios": { ... }
}
```

### Detailed Component Definitions

#### A. `location` (`LocationInfo`)
* `district_id` (`string`): Unique district slug (e.g. `"mp_bhopal"`).
* `state_name` (`string`): Indian State name.
* `district_name` (`string`): Indian District name.
* `latitude` (`float`): Effective latitude in Decimal Degrees.
* `longitude` (`float`): Effective longitude in Decimal Degrees.
* `agro_climatic_zone` (`string`): ICAR/Planning Commission Agro-Climatic Zone.
* `major_soil_type` (`string`): Dominant Indian soil classification.
* `is_custom_gps` (`boolean`): True if user supplied custom GPS coordinates.
* `gps_fallback_occurred` (`boolean`): True if out-of-bounds GPS was reverted to district centroid.
* `provenance_warnings` (`List[string]`): List of active data provenance notices.

#### B. `weather` (`WeatherInfo`)
* `data_provider` (`string`): Data provider name (`"Open-Meteo"`, `"NASA POWER Daily"`, `"IMD Historical"`).
* `confidence_score` (`enum`): `"High"`, `"Medium"`, or `"Low"`.
* `data_freshness` (`string`): Telemetry freshness label (`"Live"`, `"Recent Reanalysis (~2-3 days)"`, `"Historical Normal"`).
* `weather_timestamp` (`string`): ISO timestamp or observation date string.
* `cache_hit` (`boolean`): True if served from local 3-hour SQLite cache.
* `fallback_used` (`boolean`): True if primary Open-Meteo feed was unavailable.
* `current_temperature_c` (`float | null`): Temperature in °C (or `null` if unobserved).
* `current_apparent_temp_c` (`float | null`): Feels-like temperature in °C.
* `current_humidity_pct` (`int | null`): Relative humidity in % ($0\text{--}100$).
* `current_wind_kmh` (`float | null`): 10m wind speed in km/h.
* `current_precipitation_mm` (`float | null`): Current precipitation in mm.
* `surface_soil_moisture_m3m3` (`float | null`): $0\text{--}1\text{ cm}$ volumetric soil moisture in $\text{m}^3/\text{m}^3$.
* `root_zone_soil_moisture_m3m3` (`float | null`): $9\text{--}27\text{ cm}$ root-zone volumetric soil moisture.
* `fao_et0_mm_hr` (`float | null`): FAO-56 reference evapotranspiration in mm/hr.
* `vapour_pressure_deficit_kpa` (`float | null`): Vapour Pressure Deficit in kPa.
* `rainfall_anomaly_pct` (`float | null`): Seasonal rainfall departure % from IMD normal.
* `forecast_rain_7d_total_mm` (`float | null`): 7-day cumulative precipitation in mm.
* `max_rain_probability_7d_pct` (`int | null`): Peak 7-day precipitation probability %.
* `forecast_temp_max_c` (`float | null`): Maximum forecast temperature in °C.
* `forecast_temp_min_c` (`float | null`): Minimum forecast temperature in °C.
* `daily_series` (`List[object]`): 7-day daily forecast breakdown array.
* `missing_variables` (`List[string]`): Explicit declaration of unobserved variables.

#### C. `risk` (`RiskInfo`)
* `overall_risk_score` (`float`): Weighted farm portfolio risk score ($0.0\text{--}1.0$).
* `overall_risk_label` (`enum`): `"LOW"`, `"MODERATE"`, `"HIGH"`, `"CRITICAL"`.
* `drought_risk_score` (`float`): Soil moisture deficit & precipitation risk score ($0.0\text{--}1.0$).
* `drought_risk_label` (`enum`): Drought risk qualitative label.
* `waterlogging_risk_score` (`float`): Saturated soil & heavy rain forecast risk score ($0.0\text{--}1.0$).
* `waterlogging_risk_label` (`enum`): Waterlogging risk qualitative label.
* `heat_risk_score` (`float`): High temperature stress score ($0.0\text{--}1.0$).
* `heat_risk_label` (`enum`): Heat risk qualitative label.
* `atmospheric_water_stress_score` (`float`): High ET0 / VPD evaporative demand score.
* `atmospheric_water_stress_label` (`enum`): Evaporative pull qualitative label.
* `effective_drought_mitigation` (`float`): Irrigation drought multiplier ($\le 1.0$).
* `irrigation_buffer_pct` (`float`): Percentage of surface drought buffered by irrigation.
* `soil_moisture_status` (`string`): Agronomic interpretation of root-zone moisture.
* `waterlogging_alert` (`string | null`): Warning message if flood risk is critical.
* `heat_alert` (`string | null`): Warning message if heat wave is forecast.

#### D. `crop_evaluations` (`List[CropEvaluationItem]`)
Detailed evaluation for every candidate crop before and during optimization:
* `crop_name` (`string`): Crop name.
* `hist_yield_qtl_acre` (`float`): Historical district yield in Quintals/Acre.
* `weather_multiplier` (`float`): Calibrated weather adjustment factor ($0.25\text{--}1.0$).
* `expected_yield_qtl_acre` (`float`): Risk-adjusted expected yield ($\text{Hist} \times \text{Multiplier}$).
* `total_risk_penalty_pct` (`float`): Combined risk penalty percentage ($0\%\text{--}75\%$).
* `drought_penalty_pct` (`float`): Crop-specific drought penalty %.
* `waterlogging_penalty_pct` (`float`): Crop-specific waterlogging penalty %.
* `heat_penalty_pct` (`float`): Crop-specific heat stress penalty %.
* `modal_price_per_qtl` (`float`): Mandi wholesale price benchmark in ₹/Quintal.
* `cost_c2_per_acre` (`float`): CACP Cost of Cultivation (C2) in ₹/Acre.
* `expected_revenue_per_acre` (`float`): Expected revenue in ₹/Acre.
* `expected_profit_per_acre` (`float`): Expected net profit in ₹/Acre ($\text{Revenue} - \text{Cost}$).
* `risk_adjusted_profit_per_acre` (`float`): Objective function coefficient for LP.
* `risk_score` (`float`): Crop risk index ($0.0\text{--}1.0$).
* `is_allocated` (`boolean`): True if selected for planting by optimizer.
* `allocated_acres` (`float`): Acreage allocated by optimizer.
* `acre_share_pct` (`float`): Share of farm land allocated %.
* `reasons` (`List[string]`): Agronomic causal explanation notes.

#### E. `allocated_crops` (`List[AllocatedCropItem]`)
Summary of selected crops in the optimal portfolio:
* `crop_name` (`string`): Allocated crop name.
* `allocated_acres` (`float`): Optimal acreage allocated.
* `acre_share_pct` (`float`): Percentage of total farm land.
* `expected_yield_qtl_acre` (`float`): Expected yield in Quintals/Acre.
* `modal_price_per_qtl` (`float`): Expected Mandi price in ₹/Quintal.
* `total_cost_inr` (`float`): Total capital required for this crop in ₹.
* `total_revenue_inr` (`float`): Total expected revenue in ₹.
* `net_profit_inr` (`float`): Projected net profit in ₹.
* `roi_pct` (`float`): Return on capital invested %.
* `risk_score` (`float`): Crop risk score.
* `reasons` (`List[string]`): Decision rationale for this allocation.

#### F. `farm_totals` (`OptimizationTotals`)
* `status` (`string`): Solver outcome (`"success"`, `"error"`).
* `total_land_acres` (`float`): Total farm land in acres.
* `total_allocated_acres` (`float`): Cultivated land in acres.
* `fallow_acres` (`float`): Land left uncultivated due to budget or risk constraints.
* `budget_capital_inr` (`float`): Farmer's capital budget in ₹ INR.
* `total_investment_inr` (`float`): Total capital utilized in ₹ INR.
* `budget_utilization_pct` (`float`): Capital budget utilization %.
* `total_expected_revenue_inr` (`float`): Projected total farm gross revenue in ₹.
* `total_expected_net_profit_inr` (`float`): Projected total farm net profit in ₹.
* `expected_farm_roi_pct` (`float`): Net portfolio return on investment %.
* `weighted_risk_score` (`float`): Area-weighted farm risk score.
* `weighted_risk_label` (`string`): Qualitative risk label.
* `budget_constrained` (`boolean`): True if capital budget limited cultivation.
* `all_negative_profits` (`boolean`): True if downside minimization mode was triggered.
* `solver_method` (`string`): Mathematical solver employed (`"SciPy HiGHS"`).

#### G. `explanation` (`ExplanationInfo`)
* `headline` (`string`): Executive decision summary statement.
* `environmental_summary` (`string`): Synthesis of temperature, soil moisture, and rain.
* `irrigation_impact` (`string`): Explanation of irrigation drought buffer.
* `allocated_crop_breakdown` (`List[string]`): Crop-by-crop agronomic breakdown.
* `special_alerts` (`List[string]`): Capital budget and extreme downside alerts.
* `unselected_crop_insights` (`List[string]`): Insights into why unselected crops were penalized.
* `causal_chain` (`List[CausalStep]`): Structured 8-step decision causal chain.
* `data_trust_summary` (`string`): Provenance and confidence declaration.

#### H. `scenarios` (`Dict[str, ScenarioItem]`)
Comparative analysis across 4 stress scenarios (`"live"`, `"drought"`, `"waterlogging"`, `"heat_wave"`):
* `scenario_id` (`string`): Unique scenario identifier.
* `scenario_name` (`string`): Display name.
* `description` (`string`): Scenario description.
* `total_profit_inr` (`float`): Projected net profit under scenario in ₹.
* `profit_delta_from_live_inr` (`float`): Profit delta from live baseline in ₹.
* `roi_pct` (`float`): Expected farm ROI %.
* `total_allocated_acres` (`float`): Total cultivated acres.
* `fallow_acres` (`float`): Fallow land acres.
* `allocations` (`Dict[string, float]`): Crop-wise acreage allocation map.
* `primary_risk_factor` (`string`): Primary environmental driver.
* `key_allocation_shift` (`string`): Explanation of acreage shift.

---

## 4. Example JSON Request & Response

### Request Example
```json
{
  "state_name": "Madhya Pradesh",
  "district_name": "Bhopal",
  "land_size_acres": 5.0,
  "budget_inr": 120000.0,
  "irrigation_type": "Borewell",
  "irrigation_reliability": "High",
  "season": "Kharif",
  "risk_tolerance": "Balanced"
}
```

### Response Example (Truncated Sample)
```json
{
  "request": {
    "state_name": "Madhya Pradesh",
    "district_name": "Bhopal",
    "land_size_acres": 5.0,
    "budget_inr": 120000.0,
    "irrigation_type": "Borewell",
    "irrigation_reliability": "High",
    "season": "Kharif",
    "risk_tolerance": "Balanced"
  },
  "location": {
    "district_id": "mp_bhopal",
    "state_name": "Madhya Pradesh",
    "district_name": "Bhopal",
    "latitude": 23.2599,
    "longitude": 77.4126,
    "agro_climatic_zone": "Central Plateau and Hills",
    "major_soil_type": "Medium Black Soil",
    "is_custom_gps": false,
    "gps_fallback_occurred": false,
    "provenance_warnings": []
  },
  "weather": {
    "data_provider": "Open-Meteo",
    "confidence_score": "High",
    "data_freshness": "Live",
    "weather_timestamp": "2026-08-22T11:45",
    "cache_hit": true,
    "fallback_used": false,
    "current_temperature_c": 27.8,
    "current_apparent_temp_c": 31.2,
    "current_humidity_pct": 73,
    "current_wind_kmh": 10.6,
    "current_precipitation_mm": 0.0,
    "surface_soil_moisture_m3m3": 0.452,
    "root_zone_soil_moisture_m3m3": 0.468,
    "fao_et0_mm_hr": 0.38,
    "vapour_pressure_deficit_kpa": 0.85,
    "rainfall_anomaly_pct": 169.4,
    "forecast_rain_7d_total_mm": 109.1,
    "max_rain_probability_7d_pct": 95,
    "forecast_temp_max_c": 30.2,
    "forecast_temp_min_c": 22.4,
    "missing_variables": []
  },
  "risk": {
    "overall_risk_score": 0.32,
    "overall_risk_label": "MODERATE",
    "drought_risk_score": 0.15,
    "drought_risk_label": "LOW",
    "waterlogging_risk_score": 0.90,
    "waterlogging_risk_label": "CRITICAL",
    "heat_risk_score": 0.10,
    "heat_risk_label": "LOW",
    "atmospheric_water_stress_score": 0.35,
    "atmospheric_water_stress_label": "MODERATE",
    "effective_drought_mitigation": 0.20,
    "irrigation_buffer_pct": 80.0,
    "soil_moisture_status": "Optimal Moisture"
  },
  "allocated_crops": [
    {
      "crop_name": "Soyabean",
      "allocated_acres": 1.5,
      "acre_share_pct": 30.0,
      "expected_yield_qtl_acre": 3.85,
      "modal_price_per_qtl": 4600.0,
      "total_cost_inr": 17239.5,
      "total_revenue_inr": 26565.0,
      "net_profit_inr": 9325.5,
      "roi_pct": 54.1,
      "risk_score": 0.54
    },
    {
      "crop_name": "Maize",
      "allocated_acres": 3.5,
      "acre_share_pct": 70.0,
      "expected_yield_qtl_acre": 8.07,
      "modal_price_per_qtl": 2090.0,
      "total_cost_inr": 35693.0,
      "total_revenue_inr": 59031.5,
      "net_profit_inr": 23338.5,
      "roi_pct": 65.4,
      "risk_score": 0.45
    }
  ],
  "farm_totals": {
    "status": "success",
    "total_land_acres": 5.0,
    "total_allocated_acres": 5.0,
    "fallow_acres": 0.0,
    "budget_capital_inr": 120000.0,
    "total_investment_inr": 52932.5,
    "budget_utilization_pct": 44.1,
    "total_expected_revenue_inr": 85596.5,
    "total_expected_net_profit_inr": 32664.0,
    "expected_farm_roi_pct": 61.7,
    "weighted_risk_score": 0.48,
    "weighted_risk_label": "MODERATE",
    "budget_constrained": false,
    "all_negative_profits": false,
    "solver_method": "SciPy HiGHS Dual-Simplex / Interior-Point"
  }
}
```
