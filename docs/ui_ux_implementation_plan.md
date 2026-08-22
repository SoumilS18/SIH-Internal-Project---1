# AgriOptima AI (USICT038) — Frontend & UI/UX Implementation Plan

**Target:** Smart India Hackathon (SIH) 2026  
**Document Version:** 1.0.0  
**Backend Status:** 32/32 Automated Tests Passing | Decoupled & Verified  
**Purpose:** Technical and functional blueprint for building the dedicated presentation layer consuming `FarmDecisionService.get_farm_decision()`.

---

## A. Application Information Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            AgriOptima AI AppShell                           │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ TopBar: Location Badge | Agro-Zone | Soil Type | Data Freshness | Conf │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────┬──────────────────────────────────────────────┐  │
│  │ SIDEBAR / SETUP PANEL  │ MAIN CONTENT VIEW (Tabs / Screen Router)     │  │
│  │ • State & District     │                                              │  │
│  │ • Season & Land Area   │ [1] Strategic Dashboard (Overview)           │  │
│  │ • Capital Budget (₹)   │ [2] Environmental Intelligence & Soil Gauges │  │
│  │ • Irrigation & Buffer  │ [3] Crop Agronomic & Economic Analysis       │  │
│  │ • Risk Tolerance       │ [4] 4-Way Scenario Stress-Testing Playground │  │
│  │ • Custom GPS (Opt.)    │ [5] 8-Step Causal Decision Chain & Audit     │  │
│  │ • Scenario Controls    │ [6] Data Provenance, Lineage & System Health │  │
│  │ • Submit / Refresh     │                                              │  │
│  └────────────────────────┴──────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Screen & Navigation Hierarchy:
1. **Global AppShell:** Persistent top bar with live location metadata, soil type, data provider, and confidence score badge.
2. **Farm Configuration (Sidebar / Modal):** Input controls collecting `FarmDecisionRequest` parameters.
3. **Screen 1 — Strategic Dashboard (Overview):** Executive KPIs, optimal crop portfolio distribution bar chart, financial summary, and strategic directive headline.
4. **Screen 2 — Environmental Intelligence:** Real-time atmospheric conditions, multi-depth soil moisture layer profile ($0\text{--}81\text{ cm}$), 7-day forecast series, and rainfall anomaly.
5. **Screen 3 — Crop Agronomic & Economic Analysis:** Candidate evaluation comparison matrix showing how weather factors scale historical yields into net margins.
6. **Screen 4 — 4-Way Scenario Playground:** Interactive comparison of Live Weather vs Severe Drought vs Heavy Rain/Waterlogging vs Heat Wave.
7. **Screen 5 — Explainable Decision Chain:** Visual step-by-step causal chain (Steps 1 through 8) explaining the exact mathematical derivation of the decision.
8. **Screen 6 — Data Trust & System Provenance:** Data lineage, cache status, declared missing variables list, and fallback diagnostic health.

---

## B. Design System Requirements (Semantic Tokens)

To allow the UI/UX designer full visual freedom while ensuring strict component consistency, the frontend must rely on semantic design tokens:

### 1. Semantic Color Tokens
* `--primary`: Brand green / agricultural identity (e.g. emerald/forest tone).
* `--primary-hover`: Darkened primary for interactive hover states.
* `--background`: Base application background.
* `--surface`: Card and modal container background.
* `--surface-subtle`: Secondary container background (table headers, muted sections).
* `--border`: Container and divider border color.
* `--text-primary`: High-contrast body and heading text.
* `--text-secondary`: Muted metadata, units, and secondary labels.
* `--text-inverse`: Light text over dark or brand surfaces.
* `--success`: Positive margins, high ROI, and `LOW` risk tags.
* `--warning`: `MODERATE` risk, capital budget constraint, or fallow land notices.
* `--danger`: `HIGH` / `CRITICAL` risk, heat waves, and downside loss warnings.
* `--info`: Technical provenance notes, reanalysis latency notices, and GPS fallbacks.

### 2. Typography Hierarchy
* **Display / Hero:** 2.25rem (36px) — Bold (800) — Main Application Title.
* **Heading 1:** 1.5rem (24px) — Bold (700) — Section & Screen Titles.
* **Heading 2:** 1.25rem (20px) — SemiBold (600) — Card Headers & Subheadings.
* **Heading 3 / Metric Value:** 1.75rem (28px) — ExtraBold (800) — Numerical KPIs (₹ Net Profit, ROI %).
* **Body Regular:** 1.0rem (16px) — Regular (400) — Paragraphs and Causal Step Details.
* **Body Small / Captions:** 0.875rem (14px) — Medium (500) — Table Cells and Badges.
* **Micro / Monospace:** 0.75rem (12px) — Regular (400) — Timestamps, coordinates, and raw telemetry keys.

### 3. Layout & Spacing Scale
* Base unit: `4px` scale (`4px`, `8px`, `12px`, `16px`, `24px`, `32px`, `48px`, `64px`).
* Card Border Radius: `10px` or `12px` for unified modern appearance.
* Container Max Width: `1400px` (centered for desktop presentation).

---

## C. Component Inventory

| Component Name | Purpose | Backend Fields Consumed | User Interaction | States Required |
| :--- | :--- | :--- | :--- | :--- |
| `AppShell` | Global frame, navigation, and persistent header | `location.*`, `weather.*` | Screen tab switching | Default, Loading |
| `FarmSetupForm` | Input collection for farmer parameters | `request.*` | Select state/district, slide acres, enter budget | Default, Validating, Submitting |
| `TopProvenanceStrip` | Declares location, soil, provider, and confidence | `location.*`, `weather.*` | Hover for tooltip details | High, Med, Low confidence |
| `KpiCard` | High-impact numerical card for Profit, ROI, Capital | `farm_totals.*` | None (Informational) | Default, Highlighted, Warning |
| `StrategicDirectiveBox` | Executive headline and agronomic summary | `explanation.*` | Expandable causal toggle | Default, Alert state |
| `CropAllocationChart` | Bar chart displaying acreage distribution | `allocated_crops.*` | Hover over bars for acre details | Default, Empty/Zero state |
| `AllocatedCropTable` | Summary table of recommended crop portfolio | `allocated_crops.*` | Column sorting | Default, Empty/Fallow state |
| `EnvironmentalCardGrid`| 6-metric grid of live weather telemetry | `weather.*` | Click for detailed daily array | Live, Fallback, Offline |
| `SoilMoistureGauge` | Multi-depth soil moisture layer profile | `weather.surface_*`, `root_zone_*` | Inspect layer depths ($0\text{--}81\text{ cm}$) | Optimal, Deficit, Saturation |
| `RiskMatrixGrid` | 5-meter agro-meteorological risk cards | `risk.*` | View risk score + qualitative tag | Low, Med, High, Critical |
| `CropEvaluationTable` | Full candidate economic & risk comparison matrix | `crop_evaluations.*` | Filter, sort, inspect reasons | Default, Filtered |
| `ScenarioPlayground` | 4-way comparative scenario stress-test | `scenarios.*` | Switch between Live/Drought/Flood/Heat | Tab toggle, Side-by-side view |
| `ProfitDeltaCard` | Shows Net Profit and delta from live baseline | `scenarios.*.profit_delta_*` | None (Visual comparison) | Positive delta, Negative delta |
| `CausalChainTimeline` | Step-by-step numbered decision chain (Steps 1–8) | `explanation.causal_chain` | Click step to highlight data source | Default, Expanded |
| `DataProvenanceTable` | Declares data sources, latency, and lineage | `weather.*`, `location.*` | None (Audit transparency) | Live query, Cache hit, Fallback |
| `AlertBanner` | Displays capital constraint, downside, or GPS alerts | `alerts` | Dismiss or view details | Warning, Error, Info |
| `LoadingSkeleton` | Loading placeholder while pipeline executes | N/A | None (Loading feedback) | Animated pulse |
| `ErrorState` | Graceful error screen for invalid setups | `farm_totals.status` | "Reset Form" button | Clean error message |

---

## D. Exact Backend → Frontend Mapping

Every UI element is directly bound to a field in `FarmDecisionResponse`:

```
FarmDecisionResponse
├── request
│   ├── state_name, district_name, season, land_size_acres, budget_inr
│   └── irrigation_type, irrigation_reliability, risk_tolerance
├── location
│   ├── district_id, state_name, district_name, latitude, longitude
│   ├── agro_climatic_zone, major_soil_type
│   └── is_custom_gps, gps_fallback_occurred, provenance_warnings
├── weather
│   ├── data_provider, confidence_score, data_freshness, weather_timestamp
│   ├── cache_hit, fallback_used
│   ├── current_temperature_c, current_apparent_temp_c, current_humidity_pct
│   ├── current_wind_kmh, current_precipitation_mm
│   ├── surface_soil_moisture_m3m3, root_zone_soil_moisture_m3m3
│   ├── fao_et0_mm_hr, vapour_pressure_deficit_kpa, rainfall_anomaly_pct
│   ├── forecast_rain_7d_total_mm, max_rain_probability_7d_pct
│   ├── forecast_temp_max_c, forecast_temp_min_c, daily_series
│   └── missing_variables
├── risk
│   ├── overall_risk_score, overall_risk_label
│   ├── drought_risk_score, drought_risk_label
│   ├── waterlogging_risk_score, waterlogging_risk_label
│   ├── heat_risk_score, heat_risk_label
│   ├── atmospheric_water_stress_score, atmospheric_water_stress_label
│   ├── effective_drought_mitigation, irrigation_buffer_pct
│   ├── soil_moisture_status
│   └── waterlogging_alert, heat_alert
├── crop_evaluations [Array]
│   └── crop_name, hist_yield_qtl_acre, weather_multiplier, expected_yield_qtl_acre
│       total_risk_penalty_pct, drought_penalty_pct, waterlogging_penalty_pct, heat_penalty_pct
│       modal_price_per_qtl, cost_c2_per_acre, expected_revenue_per_acre, expected_profit_per_acre
│       risk_adjusted_profit_per_acre, risk_score, is_allocated, allocated_acres, acre_share_pct, reasons
├── allocated_crops [Array]
│   └── crop_name, allocated_acres, acre_share_pct, expected_yield_qtl_acre
│       modal_price_per_qtl, total_cost_inr, total_revenue_inr, net_profit_inr, roi_pct, risk_score, reasons
├── farm_totals
│   ├── status, total_land_acres, total_allocated_acres, fallow_acres
│   ├── budget_capital_inr, total_investment_inr, budget_utilization_pct
│   ├── total_expected_revenue_inr, total_expected_net_profit_inr, expected_farm_roi_pct
│   ├── weighted_risk_score, weighted_risk_label
│   └── budget_constrained, all_negative_profits, solver_method
├── explanation
│   ├── headline, environmental_summary, irrigation_impact
│   ├── allocated_crop_breakdown, special_alerts, unselected_crop_insights
│   ├── causal_chain [Array of {step_number, title, detail}]
│   └── data_trust_summary
├── alerts [Array of string]
└── scenarios [Dict of ScenarioItem: live, drought, waterlogging, heat_wave]
    └── scenario_id, scenario_name, description, total_profit_inr, profit_delta_from_live_inr
        roi_pct, total_allocated_acres, fallow_acres, allocations, primary_risk_factor, key_allocation_shift
```

---

## E. 11-Step Primary SIH Judge User Flow

```
[Step 1] Setup Configuration ──> User selects Bhopal, MP | Kharif | 5 Acres | ₹1,20,000 | Borewell
         │
[Step 2] Ingestion & Telemetry ──> Backend fetches live Open-Meteo NWP & ERA5-Land soil moisture
         │
[Step 3] Risk Evaluation ──> AgriculturalRiskEngine evaluates soil deficit, waterlogging & heat
         │
[Step 4] Crop Yield Adjustment ──> Biological response factors scale historical district yields
         │
[Step 5] LP Optimization ──> SciPy HiGHS solves constrained risk-adjusted profit linear program
         │
[Step 6] Optimal Plan Rendered ──> UI renders Soyabean (1.5 Ac) + Maize (3.5 Ac) | Profit ₹32,664 | ROI 61.7%
         │
[Step 7] Environmental Deep-Dive ──> Judge inspects root-zone moisture (0.468 m³/m³) & 7-day rain (109 mm)
         │
[Step 8] Drought Scenario Test ──> Judge clicks "Severe Drought": Acreage reallocates to hardy Arhar (5 Ac)
         │
[Step 9] Flood & Heat Tests ──> Judge clicks "Waterlogging" & "Heat Wave" to see yield penalties in action
         │
[Step 10] Causal Chain Audit ──> Judge expands 8-Step Timeline: Traces exact rupees and acres from ground truth
         │
[Step 11] Provenance Verification ──> Judge verifies NASA POWER fallback and zero-fabrication guarantees
```

---

## F. Responsive Design & Breakpoint Strategy

* **Desktop ($\ge 1280\text{px}$):** Two-column layout (Left: Setup sidebar / sticky input panel; Right: Comprehensive multi-tab analytical workspace).
* **Laptop ($1024\text{px}\text{--}1279\text{px}$):** Stacked metric cards (2x2 grid), scrollable comparison tables, responsive SVG bar charts.
* **Tablet ($768\text{px}\text{--}1023\text{px}$):** Collapsible sidebar drawer, single-column KPI stream, swipeable scenario tabs.
* **Mobile ($< 768\text{px}$):** Vertical bottom-sheet setup modal, simplified high-impact metric cards, horizontal swipe on data tables.

---

## G. State Management & Lifecycle

```
[INITIAL STATE] ──(User Input Change)──> [LOADING STATE (Pulse Skeleton)]
                                                  │
                ┌─────────────────────────────────┴────────────────────────────────┐
                │                                                                  │
                v                                                                  v
    [SUCCESSFUL DECISION]                                                 [HANDLED EXCEPTION]
    • High Confidence Live                                                • Zero Budget (100% Fallow)
    • Medium Fallback (NASA POWER)                                        • Negative Inputs (Clamped)
    • Low Offline (Historical IMD)                                        • GPS Error (Centroid Fallback)
    • Budget Constrained (Fallow Banner)                                  • All Negative Margins (Downside Alert)
    • Downside Loss Minimization Alert                                    • Empty Candidates (Clean Error)
```

---

## H. 4-Way Scenario Stress-Testing UX

The Scenario Playground must present all 4 states side-by-side:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                           4-WAY SCENARIO PLAYGROUND                             │
├────────────────────┬────────────────────┬───────────────────┬───────────────────┤
│ LIVE WEATHER       │ SEVERE DROUGHT     │ WATERLOGGING      │ HEAT WAVE (41°C)  │
│ Profit: ₹32,664    │ Profit: ₹18,190    │ Profit: ₹23,500   │ Profit: ₹25,100   │
│ ROI: +61.7%        │ Delta: -₹14,474    │ Delta: -₹9,164    │ Delta: -₹7,564    │
│ Alloc: 1.5 Soy/3.5Mz│ Alloc: 5.0 Arhar   │ Alloc: 5.0 Maize  │ Alloc: Shifted    │
│ Risk: 0.32 (MOD)   │ Risk: 0.85 (CRIT)  │ Risk: 0.90 (CRIT) │ Risk: 0.80 (HIGH) │
└────────────────────┴────────────────────┴───────────────────┴───────────────────┘
```
* **Interactive Insight:** Highlighting a scenario immediately reveals the **primary environmental driver** and the **exact reason why the optimizer shifted acreage**.

---

## I. SIH Demonstration Optimization (30-Second Judgement Criteria)

A visiting judge should grasp the entire product within 30–60 seconds:
1. **Headline:** *"What does this system do?"* $\to$ Dynamic, risk-aware crop optimization connecting live weather to linear programming.
2. **Top Numbers:** ₹ Net Profit, % ROI, Capital Invested.
3. **Allocation Chart:** Clear, colorful acreage distribution bar chart.
4. **Causality:** 8-Step Causal Timeline showing no black-box hallucinations.
5. **Dynamic Proof:** 1-click scenario buttons showing acreage reallocations.

---

## J. Implementation Boundary & Clean Architecture

```
[FRONTEND LAYER - NEW UI / REACT / STREAMLIT]
                     │
    Uses ONLY: FarmDecisionRequest & FarmDecisionResponse
                     │
                     v
[BACKEND ENTRY POINT: FarmDecisionService.get_farm_decision()]  <── DO NOT TOUCH BELOW THIS LINE
                     │
       ┌─────────────┼─────────────┐
       v             v             v
[DatabaseManager] [WeatherService] [RiskEngine] [DynamicOptimizer] [AgentExplainer]
```

---

## K. Migration Strategy (Phased Rollout)

1. **Phase 1 (Current):** Backend decoupled; `FarmDecisionResponse` verified; 32 tests passing.
2. **Phase 2 (Design):** External UI/UX designer creates visual layout based on `frontend_screen_spec.md` and semantic tokens.
3. **Phase 3 (Frontend Implementation):** New UI built consuming `service.get_farm_decision()`.
4. **Phase 4 (Retirement):** Legacy `app.py` replaced by the new clean frontend shell.

---

## 🌟 READY FOR EXTERNAL UI/UX DESIGN

### What the UI/UX Designer Needs to Know:
1. **Target User:** Indian farmers, agricultural extension officers, and Smart India Hackathon evaluators.
2. **Key Data Object:** All data flows through `FarmDecisionResponse` (`to_dict()` or typed attributes).
3. **Required 6 Screens:**
   * Screen 1: Farm Setup (Inputs)
   * Screen 2: Strategic Dashboard (Overview)
   * Screen 3: Crop-by-Crop Analysis (Transparency)
   * Screen 4: Scenario Playground (Stress Testing)
   * Screen 5: 8-Step Causal Decision Chain (Explainability)
   * Screen 6: Data Trust & Provenance (Integrity)
4. **Top 3 Priorities for Judges:**
   * **Speed of Understanding:** Clean hierarchy; clear ₹ and Acre figures.
   * **Proof of Dynamism:** Obvious changes when switching scenarios.
   * **Scientific Honesty:** Clear provenance badges (`High`/`Med`/`Low`) and honest disclosure of missing telemetry.
5. **Things the Designer MUST NOT Invent:**
   * Do **NOT** invent fake satellite NDVI maps or fake IoT sensor hardware graphics.
   * Do **NOT** invent ungrounded weather variables (only use fields defined in `WeatherInfo`).
   * Do **NOT** alter the 8 steps of the causal chain.
