# Autonomous AI Agent for Strategic Farm Management & Dynamic Economic Optimization

**Smart India Hackathon (SIH) 2026**  
*An India-centric, risk-aware autonomous agricultural decision support and portfolio optimization system.*

---

## 1. Problem Statement
Indian smallholder farmers face severe economic vulnerability due to static crop planning. Traditional agricultural advisories recommend crops based strictly on historical regional averages ("What usually grows here?"). However, Indian agriculture is subject to extreme intra-seasonal climate variability—delayed monsoons, sudden moisture deficits, unseasonal waterlogging, heat waves during flowering, and volatile mandi prices. Farmers lack an integrated system that connects live environmental conditions, soil physics, market price dynamics, and their personal capital constraints to formulate an optimal, risk-mitigated crop allocation plan.

## 2. Proposed Solution
**AgriOptima AI** transforms farm decision-making from static guesswork into a **deterministic, explainable, and risk-optimized economic strategy**. The system merges compiled Indian historical agricultural baselines with live numerical weather predictions, multi-depth soil moisture telemetry, and a forward 7-day forecast. It translates environmental stressors into crop-specific yield response factors, recalculates net farm margins per acre, and solves a constrained Linear Program using the SciPy HiGHS optimization engine.

```
HISTORICAL BASELINES (DES APY, Agmarknet, CACP C2, IMD)
                       +
LIVE ENVIRONMENTAL TELEMETRY (Open-Meteo & ERA5-Land Reanalysis)
                       ↓
DYNAMIC AGRO-METEOROLOGICAL RISK ENGINE (Soil-Type Aware)
                       ↓
CROP-SPECIFIC WEATHER ADJUSTMENTS (FAO-56 / ICAR Response Curves)
                       ↓
ECONOMIC MARGIN & ROI RECALCULATION (₹/Acre)
                       ↓
SCIPY HiGHS LINEAR PROGRAMMING SOLVER (Land, Capital, Risk Bounds)
                       ↓
EXPLAINABLE 8-STEP CAUSAL DECISION DIRECTIVE & STREAMLIT DASHBOARD
```

---

## 3. Key Innovations
1. **Dynamic Agro-Economic Coupling:** Weather anomalies do not just generate alerts; they dynamically adjust yield factors, revenues, and risk-adjusted profit margins inside an optimization solver.
2. **Soil-Type Aware Moisture Physics:** Calibrated volumetric soil moisture thresholds ($m^3/m^3$) differentiate Sandy Loam ($0.22\text{ m}^3/\text{m}^3$ is optimal) from Deep Vertisol ($0.22\text{ m}^3/\text{m}^3$ is severe deficit near wilting point).
3. **Agronomically Grounded Irrigation Mitigation:** Irrigation buffers drought and moisture deficits by up to 92%, while correctly recognizing that irrigation cannot mitigate flooding, root asphyxiation, or atmospheric heat waves.
4. **Transparent 8-Step Causal Chain:** Complete explainability from ground-truth baseline to weather delta to exact rupee-and-acre allocations without black-box hallucination.
5. **Zero-Fabrication Data Fallback Hierarchy:** Live Open-Meteo $\to$ NASA POWER MERRA-2 fallback $\to$ Offline Historical Climatology. Missing telemetry is declared honestly (`None`), and decision confidence is transparently downgraded.

---

## 4. Architecture & Technical Stack

```
SIH-Internal-Project---1/
├── app.py                     # Streamlit interactive decision & scenario dashboard
├── requirements.txt           # Minimal, verified production dependencies
├── .gitignore                 # Clean repository hygiene
├── src/
│   ├── config.py              # District catalogs, soil constants, and bounds
│   ├── db_builder.py          # Unified SQLite database generator
│   ├── db_manager.py          # Parameterized query manager with self-healing DB creation
│   ├── weather_service.py     # Live Open-Meteo feed, NASA POWER fallback & local cache
│   ├── dynamic_farm_state.py  # Dataclass schemas for unified farm state
│   ├── risk_engine.py         # Multi-factor risk engine with finite-number validation
│   ├── optimization_engine.py # SciPy HiGHS LP solver with boundary safeguards
│   ├── agent_explainer.py     # 8-step causal reasoning & financial alert generator
│   └── farm_service.py        # Central pipeline coordinator with GPS fallback
├── data/
│   └── processed/
│       ├── unified_farm_engine.db # Compiled historical SQLite baseline database
│       └── weather_cache.db       # Local 3-hour TTL weather cache database
└── tests/
    ├── test_suite_full.py     # 22 automated verification tests (100% pass)
    ├── test_bhopal_live.py    # Bhopal Kharif end-to-end integration test
    ├── test_rainfed_vs_irrigated.py # Irrigation drought buffer contrast test
    └── test_weather_shift_delta.py  # Multi-scenario dynamic re-allocation test
```

### Technology Stack:
* **Core Language:** Python 3.10+ (Standard Library, Dataclasses, Typing)
* **Optimization Core:** `scipy.optimize.linprog` (HiGHS Interior-Point / Dual-Simplex Solver)
* **Data Processing:** `pandas`, `numpy`, `sqlite3`
* **Network & Ingestion:** `requests` (Open-Meteo API, NASA POWER Daily API)
* **User Interface:** `streamlit` (Responsive multi-tab executive dashboard)

---

## 5. Data Sources & Provenance Matrix

| Dimension | Primary Data Source | Underlying Authority | Nature of Data |
| :--- | :--- | :--- | :--- |
| **Historical Crop Yields** | DES APY District Records | Directorate of Economics & Statistics, MoA&FW | Compiled Local SQLite Baselines |
| **Wholesale Mandi Prices** | Agmarknet / DMI Records | Directorate of Marketing & Inspection, MoA&FW | Compiled APMC Modal Price Benchmarks |
| **Cost of Cultivation (C2)** | CACP State Surveys | Commission for Agricultural Costs & Prices | Compiled Comprehensive Cost Structures |
| **Rainfall Climatology** | IMD Normal Tables | India Meteorological Department, MoES | 100-Year Seasonal Normals |
| **Live Weather & Soil** | Open-Meteo API | ECMWF / Numerical Weather Prediction (NWP) | Live Hourly Telemetry & ERA5-Land ($0\text{--}81\text{ cm}$) |
| **7-Day Forecast** | Open-Meteo Forecast | Global NWP Ensemble Models | Live 7-Day Precipitation & Temperature |
| **Fallback Reanalysis** | NASA POWER Point API | NASA Langley Research Center / MERRA-2 | Satellite Reanalysis (~2–3 Day Latency) |

> **Strict Data Integrity Rule:** Historical government records are stored as compiled reference baselines in SQLite. NASA POWER data has a 2–3 day satellite observation latency and is never labeled as real-time. Unobserved variables remain `None` and are registered in `missing_variables`.

---

## 6. Agricultural Risk Engine & Soil Physics

The risk engine computes calibrated environmental indices:

1. **Soil-Type Moisture Evaluation:**
   $$\text{Deficit Factor} = \max\left(0.0, \frac{\text{Optimal Moisture} - \text{Root Zone SM}}{\text{Optimal Moisture}}\right)$$
2. **Rainfall Anomaly:**
   $$\text{Rain Anomaly (\%)} = \left(\frac{\text{Recent Rain} - \text{IMD Monthly Normal}}{\text{IMD Monthly Normal}}\right) \times 100$$
3. **Effective Drought Penalty:**
   $$\text{Drought Penalty}_i = \text{Raw Drought Penalty}_i \times \text{Effective Drought Mitigation}$$
   $$\text{Effective Drought Mitigation} = \text{Base Mitigation}_{\text{irrigation}} \times \text{Reliability Weight}$$
4. **Waterlogging Penalty:**
   $$\text{Waterlogging Penalty}_i = \min\left(1.0, \frac{\text{Forecast 7D Rain} - 60}{80} + \frac{\text{Root Zone SM} - 0.95 \times \text{Optimal}}{0.15}\right) \times \text{Waterlog Sensitivity}_i \times 0.45$$
5. **Heat Stress Penalty:**
   $$\text{Heat Penalty}_i = \min\left(0.40, \frac{\max(0, T_{\text{forecast, max}} - T_{\text{threshold}, i})}{8.0} \times 0.35\right)$$
6. **Total Risk Bounds:**
   $$\text{Total Risk Penalty}_i = \min\left(0.75, \, \text{Drought Penalty}_i + \text{Waterlogging Penalty}_i + \text{Heat Penalty}_i\right)$$
   $$\text{Weather Factor}_i = \max\left(0.25, \, 1.0 - \text{Total Risk Penalty}_i\right)$$

---

## 7. Economic Model & SciPy HiGHS Linear Program

### Economic Formulas:
* **Yield Conversion:** $\text{Yield}_{\text{acre}} = \text{Historical Yield}_{\text{ha}} \times 0.404686 \times \text{Weather Factor}$ $(\text{Qtl/Acre})$
* **Cost Conversion:** $\text{Cost C2}_{\text{acre}} = \text{Cost C2}_{\text{ha}} \times 0.404686$ $(\text{₹/Acre})$
* **Expected Revenue:** $\text{Revenue}_{\text{acre}} = \text{Yield}_{\text{acre}} \times \text{Mandi Price}_{\text{qtl}}$ $(\text{₹/Acre})$
* **Net Profit:** $\text{Net Profit}_{\text{acre}} = \text{Revenue}_{\text{acre}} - \text{Cost C2}_{\text{acre}}$ $(\text{₹/Acre})$
* **Farm ROI:** $\text{ROI (\%)} = \left(\frac{\text{Total Expected Net Profit}}{\text{Total Investment}}\right) \times 100$

### Mathematical Optimization Formulation:
$$\max_{\{x_1, \dots, x_n\}} \sum_{i=1}^n x_i \cdot \left[\text{Net Profit}_i \times (1 - \text{Risk Score}_i \times \lambda_{\text{risk}})\right]$$
$$\text{Subject to: } \sum_{i=1}^n x_i \le \text{Total Land Size (Acres)}$$
$$\sum_{i=1}^n x_i \cdot \text{Cost C2}_i \le \text{Farmer Capital Budget (₹)}$$
$$0 \le x_i \le \text{Max Acre Share}_i \times \text{Total Land Size}$$

---

## 8. Installation & Setup

### Prerequisites
* Python 3.10, 3.11, or 3.12
* Git

### Step-by-Step Installation:
```bash
# 1. Clone the repository
git clone <repo-url>
cd SIH-Internal-Project---1

# 2. Create and activate a virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# 3. Install verified dependencies
pip install -r requirements.txt

# 4. Initialize Database (Self-healing: automatically builds if missing)
python -m src.db_builder

# 5. Run Verification Tests
python -m tests.test_suite_full
```

---

## 9. Running the Application

Launch the interactive Streamlit dashboard:
```bash
streamlit run app.py
```
Open your browser at `http://localhost:8501`.

---

## 10. Automated Test Suite (22 / 22 Tests)

Run the full automated test suite:
```bash
python -m tests.test_suite_full
```

### Verified Test Cases:
1. `Test 1:` Normal Weather Baseline Execution (Bhopal Kharif $\to$ Soyabean + Maize)
2. `Test 2:` Severe Drought Anomaly Impact ($\to$ Acreage shifts to drought-hardy Arhar)
3. `Test 3:` Heavy Rain & Waterlogging Anomaly ($\to$ Taproot crops penalized)
4. `Test 4:` Heat Wave Stress Impact ($\to$ Wheat incurs -40% heat penalty above 32°C)
5. `Test 5:` Rainfed vs Drip Irrigation Mitigation (+₹35,461 net gain under drought)
6. `Test 6:` Live Weather Shift Re-allocation (Proves weather delta shifts LP decisions)
7. `Test 7:` Primary API Failure $\to$ NASA POWER Fallback (Zero fake variables, Medium confidence)
8. `Test 8:` All APIs Offline $\to$ Historical Baseline Mode (Zero fake data, Low confidence)
9. `Test 9:` Economic Unit Conversion Integrity (Exact mathematical equality verified)
10. `Test 10:` Soil-Type Aware Moisture Calibration (Sandy Loam vs Vertisol moisture response)
11. `Test 11:` Severe Capital Budget Constraint (Partial cultivation + 7.06 Ac fallow land)
12. `Test 12:` Single Candidate Capacity Bound Relaxation (Prevents artificial solver infeasibility)
13. `Test 13:` Invalid GPS Coordinates Outside India (Transparent fallback to district centroid)
14. `Test 14:` Zero Budget & Zero Land Edge Cases (All land marked fallow without zero-division)
15. `Test 15:` Weather Service Network & Timeout Safety (Exceptions handled gracefully)
16. `Test 16:` Downside Risk Mitigation Alert (Flagged when all crops face negative margins)
17. `Test 17:` Invalid Negative Acreage Clamping (Clamped to 0.0 acres)
18. `Test 18:` Invalid Negative Capital Budget Input (Clamped to 0.0 budget, all land fallow)
19. `Test 19:` Non-Existent District Query Fallback (Falls back to default catalog profile)
20. `Test 20:` Empty Candidate Crop Set Handling (Returns clean error status)
21. `Test 21:` NaN and Inf Floating-Point Telemetry Safety (Filters non-finite floats safely)
22. `Test 22:` Large Scale Farm Scalability (10,000 Acres, ₹15 Crore budget solved without overflow)

---

## 11. 5-Minute SIH Presentation Workflow

```
[0:00 - 0:45] 🎯 1. VALUE PROPOSITION & PROVENANCE STRIP
• Open http://localhost:8501.
• Point to the header: "Traditional advisory systems only look backward at static historical averages.
  AgriOptima AI integrates live environmental telemetry, soil moisture, and market economics into a linear program."
• Show the Provenance Strip: Live Open-Meteo telemetry, High Confidence, and local Medium Black Soil.

[0:45 - 1:30] 📊 2. BASELINE OPTIMAL ALLOCATION (Bhopal, Kharif, 5 Acres, Borewell)
• Highlight Section 1 KPI cards: Projected Net Profit (₹32,664), ROI (+61.7%), and Capital Invested.
• Open Tab 1: Show the optimal acreage split of Soyabean (1.5 Ac) + Maize (3.5 Ac).
• Open Tab 2: Show the multi-depth soil moisture profile (0.468 m³/m³) and 7-day rainfall forecast (109 mm).

[1:30 - 2:45] 🧪 3. STRESS-TEST SCENARIO 1: SEVERE DROUGHT (-40%)
• In the sidebar, select "Severe Drought Anomaly (-40% rain, dry soil)" and change Irrigation to "Rainfed".
• Observe:
  1. Soil moisture drops to 0.240 m³/m³ (Severe Deficit).
  2. Drought Risk score escalates to 0.85 (CRITICAL).
  3. Water-intensive crops receive heavy yield penalties.
  4. Tab 4 (Scenario Comparison) shows Cotton/Soyabean acreage decreases while drought-hardy Arhar increases!
• Explain: "The linear programming optimizer dynamically reallocates land to maximize risk-adjusted profit under moisture stress."

[2:45 - 3:30] 🌊 4. STRESS-TEST SCENARIO 2: FLOOD / WATERLOGGING & HEAT WAVE
• Select "Excess Rainfall & Waterlogging (+80% rain, saturated)".
• Show: Waterlogging Risk reaches 0.90 (CRITICAL); sensitive taproots are penalized.
• Select "Severe Heat Wave (41°C)".
• Show: Wheat incurs a -40% heat penalty above its 32°C threshold.

[3:30 - 4:15] 🔍 5. "WHY DID THE ALLOCATION CHANGE?" & 8-STEP CAUSAL CHAIN
• Switch to Tab 5 (Decision Delta Audit) and expand the "8-Step Causal Decision Chain".
• Explain: "Every rupee of profit and acre of land is traceable from ground truth to weather factor to HiGHS LP."

[4:15 - 5:00] 🏛️ 6. DATA INTEGRITY & FALLBACK VERIFICATION
• Switch Scenario to "Simulate Primary API Failure (NASA POWER Fallback)".
• Point out: Confidence changes to MEDIUM, missing variables (wind, ET0) are honestly declared as None, zero fake data is generated.
• Conclude: "This is a deterministic, explainable, and scientifically grounded agricultural optimization agent."
```

---

## 12. Likely SIH Judge Questions & Technical Answers

1. **Where does your data come from?**  
   *Answer:* Historical crop yields come from DES APY (Ministry of Agriculture), mandi prices from Agmarknet modal benchmarks, cultivation costs from CACP Comprehensive Scheme (Cost C2), and 100-year rainfall normals from IMD. Current weather and soil moisture come from Open-Meteo (ECMWF & ERA5-Land), with NASA POWER MERRA-2 as fallback.
2. **Is the weather data real-time?**  
   *Answer:* Open-Meteo provides hourly numerical weather predictions and ERA5-Land reanalysis with near real-time ingestion. Fallback NASA POWER data has a 2–3 day satellite observation latency.
3. **Do you use direct satellite imagery or NDVI?**  
   *Answer:* No. The current version uses numerical weather models and ERA5-Land satellite reanalysis. Spatial NDVI and high-resolution optical imagery are planned for future integration.
4. **Do you use IoT soil probes?**  
   *Answer:* No hardware probes are required. The system leverages ERA5-Land multi-depth volumetric soil moisture ($0\text{--}81\text{ cm}$) calibrated against Indian soil types.
5. **How do you handle weather API failure?**  
   *Answer:* The system uses a 3-tier fallback hierarchy: (1) Live Open-Meteo $\to$ (2) NASA POWER Daily reanalysis $\to$ (3) Local IMD historical climatology baseline.
6. **What happens if there is no internet connection?**  
   *Answer:* The system operates in Offline Mode using local SQLite historical baselines (`unified_farm_engine.db`) and transparently downgrades decision confidence to `LOW`.
7. **How do you calculate crop risk?**  
   *Answer:* Multi-factor risk combines soil-type calibrated moisture deficits, seasonal rainfall anomalies, 7-day heavy precipitation forecasts, and maximum temperature thresholds relative to crop biological limits (ICAR/FAO standards).
8. **How does irrigation affect the model?**  
   *Answer:* Irrigation infrastructure (e.g., Borewell, Drip) reduces drought penalties by up to 92%. However, the model strictly prevents irrigation from reducing flooding, waterlogging, or atmospheric heat wave penalties.
9. **Why Linear Programming instead of an LLM or ML model?**  
   *Answer:* Linear Programming guarantees exact constraint satisfaction (land and capital limits cannot be violated), global optimality, and mathematical reproducibility. LLMs are used for explanation, not arithmetic.
10. **Why not a black-box Deep Learning model for economic optimization?**  
    *Answer:* Agricultural decisions require verifiable accountability. A linear program with audited objective coefficients ensures farmers and lenders can trace every rupee and acre.
11. **Is the yield prediction scientifically exact?**  
    *Answer:* It is an empirical decision-support estimate based on historical district baselines scaled by piecewise weather factors, not a continuous physiological crop model like DSSAT.
12. **How are mandi prices obtained?**  
    *Answer:* They are compiled APMC mandi modal price benchmarks from Agmarknet historical series stored locally in SQLite.
13. **What happens if all crops are projected to make a loss?**  
    *Answer:* The optimizer triggers a Downside Risk Mitigation Alert and solves for the portfolio that minimizes financial loss while respecting capital limits.
14. **What happens if the farmer's budget cannot cover the whole farm?**  
    *Answer:* The LP solver allocates crops up to the budget limit and explicitly marks the remaining land as fallow with a financial warning.
15. **How does the system explain its decisions?**  
    *Answer:* Through an 8-step causal decision chain tracing Ground Truth $\to$ Current Weather $\to$ Forecast $\to$ Risk $\to$ Yield Adjustment $\to$ Economics $\to$ LP Allocation $\to$ Farmer Action.
16. **How does the system behave under drought?**  
    *Answer:* Moisture deficit near wilting point penalizes water-intensive crops (e.g., Cotton, Rice) on rainfed land, shifting acreage into drought-resilient crops (e.g., Arhar, Chickpea).
17. **How does the system behave under waterlogging?**  
    *Answer:* High 7-day forecast rain on saturated soil penalizes sensitive taproots and pulses susceptible to root asphyxiation, shifting acreage to flood-tolerant crops.
18. **How does the system behave under heat waves?**  
    *Answer:* Temperatures exceeding crop flowering thresholds (e.g., Wheat $>32^\circ\text{C}$) trigger yield penalties, favoring heat-tolerant alternatives.
19. **How do you prevent fabricated weather data?**  
    *Answer:* Unobserved variables remain `None`, missing variables are explicitly declared in the data quality contract, and synthetic values are never injected.
20. **What are the current limitations?**  
    *Answer:* Intraday mandi price spikes, micro-climatic fungal spore models, and spatial row-intercropping geometries are outside the current scope.

---

## 13. Scope & Honest Limitations

* **Price Dynamics:** Prices are historical modal seasonal benchmarks; daily market price spikes are not modeled.
* **Crop Physiology:** Piecewise empirical response curves are used rather than dynamic crop growth simulators (DSSAT/APSIM).
* **Field Geometry:** The system outputs parcel-level monoculture acreage allocations rather than mixed spatial row-intercropping layouts.
* **Pest Outbreaks:** Continuous hourly micro-climatic humidity spore models are not yet integrated.

---

## 14. Future Scope (Planned Extensions)

* Integration of real-time Agmarknet daily price streaming APIs.
* Direct integration with Sentinel-2 NDVI satellite imagery for field-level vegetative monitoring.
* Continuous dynamic crop growth modeling (DSSAT / APSIM integration).
* Multi-lingual voice advisory interface in 12 Indian regional languages.
* Micro-climate fungal blight and pest invasion predictive models.

---

## 15. SIH-Safe Claims Summary

### ✅ Safe & Defensible Claims:
* "The system dynamically integrates compiled Indian agricultural baselines (DES APY, Agmarknet, CACP C2, IMD) with live Open-Meteo atmospheric and ERA5-Land multi-depth soil moisture data."
* "Current weather conditions and 7-day forecast trajectories dynamically modify crop yields, revenues, and risk-adjusted margins before entering a linear programming optimization engine."
* "Irrigation infrastructure specifically buffers drought and moisture deficits according to empirical efficiency factors, while correctly recognizing that irrigation does not eliminate excess flooding, waterlogging, or atmospheric heat waves."
* "The system operates with strict data integrity: fallback reanalysis (NASA POWER) never fabricates missing sensor telemetry, and offline modes transparently downgrade decision confidence."
* "The decision explainer establishes a transparent, reproducible 8-step causal chain grounded in mathematical deltas."

### ❌ Claims to Avoid:
* Do **NOT** claim the system uses real-time satellite NDVI or direct IoT soil probes (it uses NWP atmospheric models and ERA5-Land reanalysis).
* Do **NOT** claim the system predicts harvest yields with 100% scientific certainty.
* Do **NOT** describe NASA POWER data as 'real-time' (it has a 2–3 day satellite assimilation lag).
* Do **NOT** claim the decision engine uses an unpredictable 'black-box' LLM for economic math (all financial optimizations are deterministic SciPy Linear Programs).