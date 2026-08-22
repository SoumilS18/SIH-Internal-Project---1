# AgriOptima AI — Frontend Data Mapping Specification

**Target:** Smart India Hackathon 2026  
**Document Version:** 1.0.0  
**Purpose:** Maps every planned frontend dashboard section, UI widget, chart, and metric card to its exact backend response field in `FarmDecisionResponse` (`src/api_models.py`).

---

## 1. Farm Setup (Global Request Controls)

| UI Input Widget | Request Field (`FarmDecisionRequest`) | Data Type | Default Value | Description / Options |
| :--- | :--- | :--- | :--- | :--- |
| **State Selector** | `state_name` | `string` | `"Madhya Pradesh"` | Selected Indian State from catalog |
| **District Selector** | `district_name` | `string` | `"Bhopal"` | Selected Indian District within the state |
| **Season Selector** | `season` | `enum` | `"Kharif"` | `"Kharif"`, `"Rabi"`, `"Zaid"` |
| **Farm Land Size** | `land_size_acres` | `float` | `5.0` | Total operational land in Acres ($\ge 0.0$) |
| **Capital Budget** | `budget_inr` | `float` | `120000.0` | Available cultivation capital in ₹ INR ($\ge 0.0$) |
| **Irrigation Source** | `irrigation_type` | `enum` | `"Borewell"` | `"Borewell"`, `"Rainfed"`, `"Canal"`, `"Drip"`, `"Sprinkler"` |
| **Irrigation Reliability** | `irrigation_reliability` | `enum` | `"High"` | `"High"`, `"Medium"`, `"Low"` |
| **Risk Tolerance** | `risk_tolerance` | `enum` | `"Balanced"` | `"Balanced"`, `"Conservative"`, `"Aggressive"` |
| **Custom GPS Latitude** | `custom_lat` | `float \| null` | `null` | Custom latitude override (Decimal Degrees) |
| **Custom GPS Longitude**| `custom_lon` | `float \| null` | `null` | Custom longitude override (Decimal Degrees) |
| **Scenario Override** | `weather_override` | `string \| null`| `null` | Stress test scenario selection |
| **Force Telemetry Refresh**| `force_refresh` | `boolean` | `false` | Bypasses local SQLite cache when true |
| **Simulate Primary Fail**| `simulate_primary_failure`| `boolean` | `false` | Forces NASA POWER MERRA-2 fallback tier |
| **Simulate Offline Mode**| `simulate_all_failure` | `boolean` | `false` | Forces local IMD historical climatology |

---

## 2. Executive KPIs

| UI Card Element | Backend Response Field (`FarmDecisionResponse`) | Format / Unit | Fallback / Default |
| :--- | :--- | :--- | :--- |
| **Projected Net Profit** | `farm_totals.total_expected_net_profit_inr` | `₹{value:,.0f}` | `₹0` |
| **Expected Farm ROI** | `farm_totals.expected_farm_roi_pct` | `+{value:.1f}%` | `+0.0%` |
| **Total Capital Investment**| `farm_totals.total_investment_inr` | `₹{value:,.0f}` | `₹0` |
| **Budget Utilization %**| `farm_totals.budget_utilization_pct` | `{value:.0f}% utilized` | `0%` |
| **Weighted Risk Score** | `farm_totals.weighted_risk_score` | `{value:.2f} / 1.0` | `0.20` |
| **Weighted Risk Label** | `farm_totals.weighted_risk_label` | `"LOW" \| "MODERATE" \| "HIGH" \| "CRITICAL"` | `"LOW"` |
| **Cultivated Land** | `farm_totals.total_allocated_acres` | `{value:.1f} Acres` | `0.0 Acres` |
| **Fallow Land** | `farm_totals.fallow_acres` | `{value:.1f} Acres` | `0.0 Acres` |
| **Soil Moisture Status** | `risk.soil_moisture_status` | `string` (e.g. `"Optimal Moisture"`) | `"Normal Baseline"` |

---

## 3. Environmental Conditions & Soil Profile

| UI Telemetry Element | Backend Response Field (`FarmDecisionResponse`) | Format / Unit | Handling if Unobserved (`None`) |
| :--- | :--- | :--- | :--- |
| **Current Temperature** | `weather.current_temperature_c` | `{value:.1f}°C` | `"Unavailable"` |
| **Apparent (Feels-Like) Temp**| `weather.current_apparent_temp_c` | `{value:.1f}°C` | `"N/A"` |
| **Relative Humidity** | `weather.current_humidity_pct` | `{value}%` | `"Unavailable"` |
| **Wind Speed** | `weather.current_wind_kmh` | `{value:.1f} km/h` | `"Unavailable (Reanalysis)"` |
| **Current Precipitation** | `weather.current_precipitation_mm` | `{value:.1f} mm` | `"0.0 mm"` |
| **Surface Soil Moisture** | `weather.surface_soil_moisture_m3m3` | `{value:.3f} m³/m³` | `"Historical Baseline"` |
| **Root-Zone Soil Moisture** | `weather.root_zone_soil_moisture_m3m3` | `{value:.3f} m³/m³` | `"Historical Baseline"` |
| **FAO-56 Evapotranspiration**| `weather.fao_et0_mm_hr` | `{value:.2f} mm/hr` | `"N/A"` |
| **Vapour Pressure Deficit** | `weather.vapour_pressure_deficit_kpa` | `{value:.2f} kPa` | `"N/A"` |
| **Seasonal Rain Anomaly** | `weather.rainfall_anomaly_pct` | `{value:+.1f}% vs IMD Normal` | `"N/A (Historical Mode)"` |
| **7-Day Rain Total** | `weather.forecast_rain_7d_total_mm` | `{value:.1f} mm` | `"Unavailable (Offline)"` |
| **Peak Rain Probability** | `weather.max_rain_probability_7d_pct`| `{value}%` | `"N/A"` |
| **Max Forecast Temp** | `weather.forecast_temp_max_c` | `{value:.1f}°C` | `"Seasonal Climatology"` |
| **Min Forecast Temp** | `weather.forecast_temp_min_c` | `{value:.1f}°C` | `"Seasonal Climatology"` |
| **7-Day Daily Forecast Table**| `weather.daily_series` | `Array of {date, t_max, t_min, rain_mm, rain_prob}` | Empty array (`[]`) |
| **Data Provider** | `weather.data_provider` | `string` (e.g. `"Open-Meteo"`) | `"IMD Historical"` |
| **Confidence Level** | `weather.confidence_score` | `"High" \| "Medium" \| "Low"` | `"Low"` |
| **Data Freshness** | `weather.data_freshness` | `string` (e.g. `"Live"`, `"~2-3 Days"`) | `"Historical Normal"` |
| **Observation Timestamp** | `weather.weather_timestamp` | `string` (e.g. `"2026-08-22T11:45"`) | `"Local Baseline"` |
| **Cache Status** | `weather.cache_hit` | `boolean` (`true` = Cache Hit, `false` = Live) | `false` |
| **Fallback Status** | `weather.fallback_used` | `boolean` | `false` |
| **Declared Missing Variables**| `weather.missing_variables` | `List[string]` | Empty list (`[]`) |

---

## 4. Multi-Factor Agricultural Risk Matrix

| UI Risk Card | Score Field | Label Field | Interpretive Subtext Field |
| :--- | :--- | :--- | :--- |
| **Drought Risk** | `risk.drought_risk_score` | `risk.drought_risk_label` | `risk.soil_moisture_status` |
| **Waterlogging Risk** | `risk.waterlogging_risk_score` | `risk.waterlogging_risk_label` | `risk.waterlogging_alert` or forecast rain |
| **Heat Stress** | `risk.heat_risk_score` | `risk.heat_risk_label` | `risk.heat_alert` or forecast max temp |
| **Atmospheric Water Stress** | `risk.atmospheric_water_stress_score`| `risk.atmospheric_water_stress_label` | `"FAO-56 ET0 & VPD"` |
| **Irrigation Drought Buffer** | `risk.effective_drought_mitigation` | `"{risk.irrigation_buffer_pct:.0f}% Buffer"` | `"{request.irrigation_type} ({request.irrigation_reliability})"` |
| **Soil Moisture Status** | `risk.soil_moisture_status` | `string` | `"Optimal Moisture"` |
| **Active Alerts** | `alerts` | `List[string]` | Special financial, weather, and provenance alerts |

---

## 5. Crop-by-Crop Analysis & Evaluation

Iterate through `crop_evaluations: List[CropEvaluationItem]`:

| Table Column | Backend Field in `CropEvaluationItem` | Format / Unit | Description |
| :--- | :--- | :--- | :--- |
| **Crop Name** | `item.crop_name` | `string` | Crop name |
| **Historical Baseline Yield** | `item.hist_yield_qtl_acre` | `{value:.2f} Qtl/Ac` | DES APY district baseline |
| **Weather Multiplier** | `item.weather_multiplier` | `{value:.3f}` | Calibrated weather factor ($0.25\text{--}1.0$) |
| **Risk-Adjusted Expected Yield**| `item.expected_yield_qtl_acre` | `{value:.2f} Qtl/Ac` | Yield after environmental penalty |
| **Total Risk Penalty %** | `item.total_risk_penalty_pct` | `-{value:.1f}%` | Combined penalty percentage |
| **Drought Penalty %** | `item.drought_penalty_pct` | `-{value:.1f}%` | Drought moisture penalty % |
| **Waterlogging Penalty %** | `item.waterlogging_penalty_pct` | `-{value:.1f}%` | Saturated soil / flood penalty % |
| **Heat Penalty %** | `item.heat_penalty_pct` | `-{value:.1f}%` | Temperature stress penalty % |
| **Mandi Price Benchmark** | `item.modal_price_per_qtl` | `₹{value:,.0f} / Qtl` | Agmarknet APMC wholesale benchmark |
| **Cost of Cultivation (C2)** | `item.cost_c2_per_acre` | `₹{value:,.0f} / Ac` | CACP Comprehensive Cost (Cost C2) |
| **Expected Gross Revenue** | `item.expected_revenue_per_acre`| `₹{value:,.0f} / Ac` | $\text{Yield} \times \text{Price}$ |
| **Expected Net Margin** | `item.expected_profit_per_acre` | `₹{value:,.0f} / Ac` | $\text{Revenue} - \text{Cost}$ |
| **Risk-Adjusted Margin** | `item.risk_adjusted_profit_per_acre` | `₹{value:,.0f} / Ac` | LP objective function coefficient |
| **Crop Risk Score** | `item.risk_score` | `{value:.2f}` | Crop risk index ($0.0\text{--}1.0$) |
| **Allocated Acres** | `item.allocated_acres` | `{value:.1f} Acres` | Optimal parcel size |
| **Allocation Share %** | `item.acre_share_pct` | `{value:.1f}%` | Percentage of farm land |
| **Selection Status** | `item.is_allocated` | `boolean` (`true` = Selected, `false` = Unallocated) | Selection flag |
| **Agronomic Rationale** | `item.reasons` | `List[string]` | Bulleted agronomic reasons |

---

## 6. Optimal Crop Allocation Portfolio

Iterate through `allocated_crops: List[AllocatedCropItem]`:

| Portfolio Metric / Column | Backend Field in `AllocatedCropItem` | Format / Unit |
| :--- | :--- | :--- |
| **Recommended Crop** | `crop.crop_name` | `string` |
| **Allocated Acreage** | `crop.allocated_acres` | `{value:.1f} Acres` |
| **Acreage Share %** | `crop.acre_share_pct` | `{value:.1f}%` |
| **Expected Yield** | `crop.expected_yield_qtl_acre` | `{value:.2f} Qtl/Acre` |
| **Expected Mandi Price** | `crop.modal_price_per_qtl` | `₹{value:,.0f} / Qtl` |
| **Total Required Capital** | `crop.total_cost_inr` | `₹{value:,.0f}` |
| **Total Expected Revenue** | `crop.total_revenue_inr` | `₹{value:,.0f}` |
| **Projected Net Profit** | `crop.net_profit_inr` | `₹{value:,.0f}` |
| **Expected Crop ROI** | `crop.roi_pct` | `+{value:.1f}%` |
| **Crop Risk Score** | `crop.risk_score` | `{value:.2f}` |
| **Decision Rationale** | `crop.reasons` | `List[string]` |

---

## 7. Farm Economics & Constraint Summary

| Summary Field | Backend Response Field (`farm_totals`) | Format / Unit |
| :--- | :--- | :--- |
| **Total Farm Land** | `farm_totals.total_land_acres` | `{value:.1f} Acres` |
| **Allocated (Cultivated) Land**| `farm_totals.total_allocated_acres` | `{value:.1f} Acres` |
| **Fallow Land** | `farm_totals.fallow_acres` | `{value:.1f} Acres` |
| **Capital Investment** | `farm_totals.total_investment_inr` | `₹{value:,.0f}` |
| **Total Gross Revenue** | `farm_totals.total_expected_revenue_inr` | `₹{value:,.0f}` |
| **Total Net Profit** | `farm_totals.total_expected_net_profit_inr` | `₹{value:,.0f}` |
| **Expected Portfolio ROI** | `farm_totals.expected_farm_roi_pct` | `+{value:.1f}%` |
| **Budget Utilization %**| `farm_totals.budget_utilization_pct` | `{value:.1f}%` |
| **Budget Constrained Flag** | `farm_totals.budget_constrained` | `boolean` (Triggers fallow land banner if true) |
| **Downside Alert Flag** | `farm_totals.all_negative_profits` | `boolean` (Triggers loss-minimization alert if true) |
| **Optimization Solver** | `farm_totals.solver_method` | `string` (`"SciPy HiGHS Dual-Simplex / Interior-Point"`) |

---

## 8. Explainability & 8-Step Causal Chain

| Explanation Section | Backend Field in `explanation` (`ExplanationInfo`) | Content / Structure |
| :--- | :--- | :--- |
| **Executive Headline** | `explanation.headline` | Concise 1-sentence strategic decision directive |
| **Environmental Synthesis**| `explanation.environmental_summary` | Synthesis of temperature, soil moisture, and rainfall |
| **Irrigation Impact** | `explanation.irrigation_impact` | Explanation of drought mitigation factors |
| **Allocated Crop Breakdown**| `explanation.allocated_crop_breakdown` | Array of bulleted strings for each allocated crop |
| **Special Financial Alerts**| `explanation.special_alerts` | Array of budget or downside warning strings |
| **Unselected Crop Insights**| `explanation.unselected_crop_insights` | Array of strings explaining why other crops were rejected |
| **Complete 8-Step Causal Chain**| `explanation.causal_chain` | Array of 8 `CausalStep` objects (`step_number`, `title`, `detail`) |
| **Data Trust Summary** | `explanation.data_trust_summary` | Data source, timestamp, cache status, and confidence statement |

---

## 9. 4-Way Scenario Playground

Access via `scenarios: Dict[str, ScenarioItem]` (`"live"`, `"drought"`, `"waterlogging"`, `"heat_wave"`):

| Scenario UI Element | Backend Field in `ScenarioItem` | Data Format |
| :--- | :--- | :--- |
| **Scenario Name** | `scenario.scenario_name` | `string` (e.g. `"Severe Drought Anomaly"`) |
| **Scenario Description** | `scenario.description` | `string` |
| **Projected Net Profit** | `scenario.total_profit_inr` | `₹{value:,.0f}` |
| **Profit Delta from Live**| `scenario.profit_delta_from_live_inr` | `₹{value:+,.0f} delta` |
| **Expected ROI** | `scenario.roi_pct` | `+{value:.1f}%` |
| **Cultivated Land** | `scenario.total_allocated_acres` | `{value:.1f} Acres` |
| **Fallow Land** | `scenario.fallow_acres` | `{value:.1f} Acres` |
| **Crop Allocation Map** | `scenario.allocations` | `Dict[string, float]` (e.g. `{"Cotton": 5.0, "Arhar": 5.0}`) |
| **Primary Risk Driver** | `scenario.primary_risk_factor` | `string` |
| **Key Acreage Shift Explanation**| `scenario.key_allocation_shift` | `string` explaining why the solver shifted acreage |

---

## 10. Data Trust & Provenance Summary

| Provenance Element | Backend Field in `FarmDecisionResponse` | Purpose |
| :--- | :--- | :--- |
| **Data Provider** | `weather.data_provider` | `"Open-Meteo"` / `"NASA POWER Daily"` / `"IMD Historical"` |
| **Confidence Level** | `weather.confidence_score` | `"High"` / `"Medium"` / `"Low"` |
| **Data Freshness** | `weather.data_freshness` | `"Live"` / `"~2-3 Days"` / `"Historical Normal"` |
| **Observation Timestamp** | `weather.weather_timestamp` | ISO timestamp or observation date |
| **Cache Status** | `weather.cache_hit` | Indicates whether local 3-hour SQLite cache was hit |
| **Fallback Used** | `weather.fallback_used` | Indicates fallback tier activation |
| **Declared Missing Variables**| `weather.missing_variables` | Explicit disclosure of unobserved telemetry |
| **GPS Fallback Warnings** | `location.provenance_warnings` | Discloses if custom GPS was out-of-bounds |
| **Full Lineage Summary** | `explanation.data_trust_summary` | Ready-to-render paragraph declaring data lineage |
