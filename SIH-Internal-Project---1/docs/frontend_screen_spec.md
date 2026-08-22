# AgriOptima AI (USICT038) — Frontend Screen & State Specification

**Target:** Smart India Hackathon 2026  
**Document Version:** 1.0.0  
**Status:** Approved Functional Specification (Styling-Agnostic)

---

## 1. Architectural Role & Boundary

This document specifies the **functional structure, information architecture, navigation, and state transitions** for the future dedicated AgriOptima AI user interface. 

The future UI operates strictly as a consumer of `FarmDecisionService.get_farm_decision(request)` and renders data from `FarmDecisionResponse`.

---

## 2. Screen Specifications

### SCREEN 1: Farm Setup & Operational Profile
* **Purpose:** Collects farmer geography, land boundary, financial capital, seasonal calendar, and irrigation context.
* **Functional Elements:**
  * **State & District Dropdowns:** Cascading selector populating districts based on selected Indian State.
  * **Season Selector:** Radio / Dropdown (`"Kharif"`, `"Rabi"`, `"Zaid"`).
  * **Land Size Slider / Input:** Decimal numeric input for total farm area in Acres (default: `5.0`).
  * **Capital Budget Input:** Numeric input in ₹ INR (default: `₹1,20,000`).
  * **Irrigation Infrastructure:** Source dropdown (`"Borewell"`, `"Rainfed"`, `"Canal"`, `"Drip"`, `"Sprinkler"`) and Reliability (`"High"`, `"Medium"`, `"Low"`).
  * **Risk Tolerance:** Optimization risk penalty weighting (`"Balanced"`, `"Conservative"`, `"Aggressive"`).
  * **Optional GPS Override Toggle:** Expandable inputs for exact Latitude and Longitude.
  * **Action Button:** "Generate Strategic Farm Plan" (Dispatches `FarmDecisionRequest`).

---

### SCREEN 2: Strategic Farm Dashboard (Executive Overview)
* **Purpose:** Answers the core question in 30 seconds: *"What should I plant, how much profit will I make, and what risks are present?"*
* **Functional Elements:**
  * **Executive Top-Bar / Badge Strip:**
    * Resolved District, State, Centroid Coordinates, Agro-Climatic Zone, and Soil Classification (`response.location`).
    * Provenance Badge, Data Provider, Data Freshness, Observation Timestamp, and Confidence Level (`response.weather`).
  * **4 Primary KPI Summary Metric Cards:**
    1. **Projected Net Farm Profit** (`response.farm_totals.total_expected_net_profit_inr`) + Net Profit / Acre.
    2. **Expected Farm ROI** (`response.farm_totals.expected_farm_roi_pct`).
    3. **Capital Invested** (`response.farm_totals.total_investment_inr` of `budget_capital_inr`) + % utilized.
    4. **Weighted Farm Risk Index** (`response.farm_totals.weighted_risk_score` + `weighted_risk_label`).
  * **Strategic Directive Box:**
    * Executive Headline Directive (`response.explanation.headline`).
    * Environmental Synthesis summary (`response.explanation.environmental_summary`).
    * Irrigation & Risk Buffer impact (`response.explanation.irrigation_impact`).
  * **Optimal Allocation Breakdown:**
    * Acreage Split Bar Chart / Distribution View (`response.allocated_crops`).
    * Summary Table of allocated crops showing Acres, Share %, Expected Yield, Mandi Price, Net Profit, and ROI.
    * Farm Totals Footer: Cultivated vs Fallow Land callout.

---

### SCREEN 3: Crop-by-Crop Agronomic & Economic Analysis
* **Purpose:** Provides deep transparency into how weather telemetry mathematically modified every candidate crop.
* **Functional Elements:**
  * **Candidate Comparison Matrix Table:**
    * Columns: Crop Name, Historical Yield, Weather Multiplier, Risk-Adjusted Expected Yield, Total Risk Penalty %, Mandi Price (₹/Qtl), CACP Cost C2 (₹/Ac), Gross Revenue, Net Margin, Risk-Adjusted Margin, Optimizer Status (Allocated / Unallocated).
  * **Agronomic Penalty Breakdown:**
    * Per-crop drought penalty %, waterlogging penalty %, and heat penalty %.
  * **Unselected Crop Insights:**
    * Dedicated panel explaining why non-allocated crops were deprioritized or eliminated (`response.explanation.unselected_crop_insights`).

---

### SCREEN 4: 4-Way Scenario Stress-Testing Playground
* **Purpose:** Demonstrates the dynamic responsiveness of the linear program under environmental anomalies.
* **Functional Elements:**
  * **4 Scenario Selector / Tabs:**
    1. `Live Observed Weather` (`response.scenarios["live"]`)
    2. `Severe Drought Anomaly (-40% rain, dry soil)` (`response.scenarios["drought"]`)
    3. `Heavy Rain & Waterlogging (+80% rain, saturated)` (`response.scenarios["waterlogging"]`)
    4. `Severe Heat Wave (41°C forecast)` (`response.scenarios["heat_wave"]`)
  * **Side-by-Side Acreage Comparison Table:**
    * Displays crop acreage across all 4 states simultaneously.
  * **Profit & ROI Delta Cards:**
    * Displays Net Profit (₹) and profit delta from the live baseline (`₹ delta`).
  * **Comparative Profit Bar Chart:**
    * Visual bar chart comparing projected farm profits across the 4 scenarios.
  * **Causal Transition Notes:**
    * Agronomic explanation of why acreage shifted under each stressor.

---

### SCREEN 5: Explainable 8-Step Causal Decision Chain
* **Purpose:** Establishes complete step-by-step mathematical causality from ground truth to farmer action.
* **Functional Elements:**
  * **Numbered Causal Steps (1 through 8):**
    1. `Step 1: Historical Ground Truth` — DES APY baselines, Agmarknet mandi prices, and CACP Cost C2.
    2. `Step 2: Current Environmental Observation` — Live temperature, humidity, root-zone moisture, and ET0.
    3. `Step 3: Forecast Trajectory` — 7-day numerical precipitation and peak rain probability.
    4. `Step 4: Dynamic Risk Translation` — Computed Drought, Waterlogging, and Heat scores.
    5. `Step 5: Crop-Specific Yield Adjustment` — Biological response curves scaling expected yields.
    6. `Step 6: Economic Recalculation` — Yield adjustments flowing into mandi revenue minus Cost C2.
    7. `Step 7: Linear Programming Optimization` — SciPy HiGHS solver maximizing risk-adjusted profit under land and capital constraints.
    8. `Step 8: Actionable Directive` — Final acreage recommendation and portfolio directive.

---

### SCREEN 6: Data Trust, Provenance & System Health
* **Purpose:** Guarantees absolute scientific honesty, transparency, and data integrity.
* **Functional Elements:**
  * **Data Lineage Table:**
    * Historical Yields: DES APY (Local SQLite compiled baselines).
    * Mandi Wholesale Prices: Agmarknet / DMI (Local SQLite modal benchmarks).
    * Cost Structures: CACP Comprehensive Scheme (Cost C2).
    * Rainfall Normals: IMD 100-Year Seasonal Normals.
    * Current Weather / Soil: Open-Meteo & ECMWF ERA5-Land reanalysis.
    * Fallback Reanalysis: NASA POWER Daily MERRA-2 (2–3 day latency).
  * **System Telemetry Status:**
    * Confidence Meter: `HIGH` (Live NWP) / `MEDIUM` (NASA POWER) / `LOW` (Offline).
    * Cache Status: Disk Cache Hit vs Live Query.
    * Declared Missing Variables List: Explicit display of unobserved telemetry (e.g. `ET0`, `Wind`).
    * Coordinate Fallback Warning (if GPS was out-of-bounds).

---

## 3. State Management & Scoping

```
┌─────────────────────────────────────────────────────────────┐
│                    GLOBAL APPLICATION STATE                 │
│  • District Catalog (geo_districts table)                   │
│  • Crop Master Agronomic Profiles                           │
│  • IMD Rainfall Normals Catalog                             │
│  • Active Farmer Inputs (FarmDecisionRequest)               │
└──────────────────────────────┬──────────────────────────────┘
                               │
               (Triggered on Form Submit / Change)
                               │
                               v
┌─────────────────────────────────────────────────────────────┐
│                    REQUEST-SCOPED STATE                     │
│  • FarmDecisionResponse Object                              │
│  • All 6 Screens consume slices of this single object       │
│  • Recomputed whenever request parameters change            │
└─────────────────────────────────────────────────────────────┘
```

---

## 4. Frontend State & Failure Handling Matrix

| Application State | Trigger Condition | Frontend Visual & Behavioral Handling |
| :--- | :--- | :--- |
| **Loading / In-Flight** | Request dispatched to `get_farm_decision()` | Render loading spinner / skeleton cards while pipeline executes. |
| **Successful Execution** | `response.farm_totals.status == "success"` | Render complete dashboard across all 6 screens. |
| **Severe Budget Shortage** | `response.farm_totals.budget_constrained == true` | Display prominent amber warning: *"X.X Acres left fallow due to available capital budget (₹Y). Allocated Z.Z Acres within budget."* |
| **Zero Capital Budget (₹0)**| `request.budget_inr == 0.0` | Display warning: *"100% of farm land (X.X Acres) kept fallow due to ₹0 capital budget."* No crops allocated; profit is ₹0. |
| **Zero Land Area (0 Acres)**| `request.land_size_acres == 0.0` | Render zeroed totals without division-by-zero errors. |
| **All Crops Negative Margin**| `response.farm_totals.all_negative_profits == true` | Display Downside Minimization Alert: *"All candidate crops face negative margins under current extreme stressors. Allocation is optimized to minimize financial loss."* |
| **NASA POWER Fallback** | `response.weather.fallback_used == true` | Display `MEDIUM` confidence badge. Show notice: *"Primary API unavailable; using NASA POWER MERRA-2 satellite reanalysis (~2-3 days latency). Missing variables: Wind, ET0, VPD."* |
| **Complete Offline Mode** | `response.weather.confidence_score == "Low"` | Display `LOW` confidence badge. Show notice: *"External weather feeds offline. Operating strictly in Historical Climatology Mode using compiled IMD and APY baselines."* |
| **GPS Out-of-Bounds** | `response.location.gps_fallback_occurred == true` | Display location banner: *"Custom coordinates outside India; automatically reverted to district centroid ({district_name})."* |
| **Empty Crop Candidates** | `response.farm_totals.status == "error"` | Display informative error: *"No eligible crops found for selected district and season."* Suggest choosing a different season. |
| **Negative Inputs** | User enters negative land or budget | Auto-clamped to `0.0` by `FarmDecisionRequest.__post_init__` before calculation. |
