# AgriOptima AI — Streamlit Migration & Transition Notes

**Target:** Smart India Hackathon 2026  
**Document Version:** 1.0.0  
**Purpose:** Technical migration audit detailing how the existing prototype (`app.py`) maps to the clean frontend architecture, highlighting deprecated inline presentation logic and migration targets.

---

## 1. What `app.py` Currently Does

The current `app.py` serves as the initial demonstration prototype. It performs:
1. Direct Streamlit sidebar widget bindings for state, district, season, land, budget, irrigation, and weather scenario overrides.
2. Invocations of `service.execute_decision_pipeline(...)` and `service.compare_scenarios(...)`.
3. Manual dictionary unpacking of raw `farm_state`, `optimization`, and `explanation` dictionaries.
4. Inline DataFrame reshaping for tables and charts.
5. Inline HTML/CSS styling blocks for metric cards, provenance badges, and risk containers.

---

## 2. Migration Mapping: Replacing Ad-Hoc Calls with `get_farm_decision()`

In the dedicated frontend architecture, the entire decision pipeline and scenario comparison are unified under **a single method call**:

### Legacy Call (Current `app.py`):
```python
# Legacy 2-step call with manual dictionary unpacking:
decision_data = service.execute_decision_pipeline(
    state_name=selected_state, district_name=selected_district, land_size_acres=land_acres,
    budget_inr=budget_inr, irrigation_type=irr_type, irrigation_reliability=irr_reliability,
    season=selected_season, risk_tolerance=risk_tolerance, ...
)
scenario_data = service.compare_scenarios(...)
```

### Modern Architecture Call:
```python
# Single typed call returning FarmDecisionResponse:
req = FarmDecisionRequest(
    state_name=selected_state,
    district_name=selected_district,
    land_size_acres=land_acres,
    budget_inr=budget_inr,
    irrigation_type=irr_type,
    irrigation_reliability=irr_reliability,
    season=selected_season,
    risk_tolerance=risk_tolerance,
    custom_lat=custom_lat,
    custom_lon=custom_lon,
    weather_override=weather_override,
    force_refresh=force_refresh
)
response: FarmDecisionResponse = service.get_farm_decision(req)
```

---

## 3. Section-by-Section Migration Matrix

| Legacy `app.py` Section | Legacy Data Source | Modern Target Source (`FarmDecisionResponse`) | Streamlit-Specific Logic to Drop |
| :--- | :--- | :--- | :--- |
| **Top Provenance Strip** | `state['location']`, `state['quality']` | `response.location`, `response.weather` | Raw HTML badge concatenation |
| **Executive KPI Row** | `totals.get(...)` | `response.farm_totals.*` | Inline HTML `metric-card` styling |
| **Agent Reasoning Box** | `exp['headline']`, `exp['environmental_summary']` | `response.explanation.*` | Inline HTML `agent-box` markup |
| **Optimal Allocation Table**| Manual `DataFrame(alloc_list)` | `response.allocated_crops` | `st.dataframe(..., use_container_width=True)` |
| **Acreage Distribution Chart**| Manual `st.bar_chart` | `response.allocated_crops` | Ad-hoc DataFrame column filtering |
| **Environmental Telemetry** | `cur_w.get(...)`, `fct_w.get(...)` | `response.weather.*` | Inline string fallback checks (`"N/A"`) |
| **Soil Moisture Chart** | Hardcoded 4-layer soil DataFrame | `response.weather.surface_soil_moisture_m3m3`, `root_zone_soil_moisture_m3m3` | Manual list multipliers |
| **7-Day Forecast Table** | `fct_w["daily_series"]` | `response.weather.daily_series` | Manual column renaming dictionary |
| **Risk Factors Row** | `risks.get(...)` | `response.risk.*` | Ad-hoc color picker function `get_risk_tag()` |
| **Crop Impact Table** | Manual `DataFrame(eval_list)` | `response.crop_evaluations` | Inline calculation of `total_risk_pct` |
| **Scenario Stress-Testing** | Separate `service.compare_scenarios` call | `response.scenarios["live"]`, `["drought"]`, etc. | Manual dictionary reshaping in tab |
| **Decision Delta Audit** | Hardcoded static comparison table | `response.scenarios`, `response.explanation.unselected_crop_insights` | Static dictionary literals |
| **Data Trust & Provenance** | Markdown bullets with string interpolation | `response.weather.*`, `response.location.provenance_warnings` | Ad-hoc text blocks |

---

## 4. Streamlit-Specific Logic That MUST NOT Be Carried Over

1. **Deprecated Widget Flags:** `use_container_width=True` is deprecated in newer Streamlit versions and should be avoided or replaced with modern responsive container layouts.
2. **Inline CSS Blocks:** The hardcoded `<style>` block in `app.py` mixed typography and layout styles with Python code. Future UI components will utilize modular CSS token definitions.
3. **Manual DataFrame Reshaping:** In `app.py`, dictionaries were converted to `pandas.DataFrame` solely for table column renaming. The modern `FarmDecisionResponse` exposes clean, pre-calculated, human-readable fields directly.
4. **Duplicate Scenario Calls:** `app.py` ran `execute_decision_pipeline()` followed immediately by `compare_scenarios()`, executing the pipeline twice on startup. `service.get_farm_decision()` handles scenario bundling internally and efficiently.

---

## 5. Duplicated Calculations Removed

* **Profit per Cultivated Acre:** Previously calculated in `app.py` as `total_expected_net_profit_inr / max(0.1, total_allocated_acres)`. Now exposed directly or cleanly computed from `farm_totals`.
* **Capital Budget Utilization %:** Previously calculated inline in HTML markup (`total_investment_inr / budget_inr * 100`). Now pre-computed in `farm_totals.budget_utilization_pct`.
* **Total Risk Penalty % for Candidates:** Previously calculated in `app.py` as `(drought_penalty + waterlogging_penalty + heat_penalty) * 100`. Now pre-computed in `CropEvaluationItem.total_risk_penalty_pct`.
* **Irrigation Buffer %:** Previously calculated inline as `(1.0 - effective_drought_mitigation) * 100`. Now pre-computed in `RiskInfo.irrigation_buffer_pct`.
* **Risk Qualitative Labels:** Previously derived via inline `if/elif` helpers in Streamlit. Now standardized across `RiskInfo` and `OptimizationTotals` as `"LOW"`, `"MODERATE"`, `"HIGH"`, and `"CRITICAL"`.

---

## 6. Migration Completion Verdict

The backend and data contracts are **100% prepared for seamless frontend ingestion**. The current `app.py` remains functioning as the active prototype and will be superseded during the dedicated UI/UX implementation phase.
