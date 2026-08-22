"""
src/api_models.py
Frontend-Neutral Data Models & Schema Contracts for AgriOptima AI (USICT038).
Defines standard request and response dataclasses with JSON-serializable converters.
Ensures clean boundary decoupling between the scientific backend and any future frontend (Web, Mobile, REST API).
"""

import json
import math
from dataclasses import dataclass, field, asdict
from typing import Dict, Any, List, Optional, Union

def _clean_json_val(val: Any) -> Any:
    """Recursively converts NumPy scalars, dataclasses, and non-finite floats to clean standard Python types."""
    if val is None:
        return None
    if isinstance(val, (int, bool, str)):
        return val
    if isinstance(val, float):
        if math.isnan(val) or math.isinf(val):
            return None
        return round(val, 4)
    # Handle NumPy numbers if present
    if hasattr(val, "item"):
        py_val = val.item()
        if isinstance(py_val, float):
            return None if (math.isnan(py_val) or math.isinf(py_val)) else round(py_val, 4)
        return py_val
    if isinstance(val, dict):
        return {str(k): _clean_json_val(v) for k, v in val.items()}
    if isinstance(val, (list, tuple, set)):
        return [_clean_json_val(item) for item in val]
    if hasattr(val, "to_dict"):
        return val.to_dict()
    if hasattr(val, "__dict__"):
        return {k: _clean_json_val(v) for k, v in val.__dict__.items() if not k.startswith("_")}
    return str(val)

@dataclass
class FarmDecisionRequest:
    """
    Standardized farmer input request payload.
    Provides automatic boundary clamping and sanitization.
    """
    state_name: str = "Madhya Pradesh"
    district_name: str = "Bhopal"
    land_size_acres: float = 5.0
    budget_inr: float = 120000.0
    irrigation_type: str = "Borewell"
    irrigation_reliability: str = "High"
    season: str = "Kharif"
    risk_tolerance: str = "Balanced"
    custom_lat: Optional[float] = None
    custom_lon: Optional[float] = None
    weather_override: Optional[str] = None
    force_refresh: bool = False
    simulate_primary_failure: bool = False
    simulate_all_failure: bool = False

    def __post_init__(self):
        # Clamping and boundary sanitation
        try:
            self.land_size_acres = max(0.0, float(self.land_size_acres))
        except (ValueError, TypeError):
            self.land_size_acres = 5.0

        try:
            self.budget_inr = max(0.0, float(self.budget_inr))
        except (ValueError, TypeError):
            self.budget_inr = 100000.0

        if not self.state_name:
            self.state_name = "Madhya Pradesh"
        if not self.district_name:
            self.district_name = "Bhopal"
        if not self.season:
            self.season = "Kharif"
        if not self.irrigation_type:
            self.irrigation_type = "Borewell"
        if not self.irrigation_reliability:
            self.irrigation_reliability = "High"
        if not self.risk_tolerance:
            self.risk_tolerance = "Balanced"

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "FarmDecisionRequest":
        return cls(
            state_name=data.get("state_name", "Madhya Pradesh"),
            district_name=data.get("district_name", "Bhopal"),
            land_size_acres=data.get("land_size_acres", 5.0),
            budget_inr=data.get("budget_inr", 120000.0),
            irrigation_type=data.get("irrigation_type", "Borewell"),
            irrigation_reliability=data.get("irrigation_reliability", "High"),
            season=data.get("season", "Kharif"),
            risk_tolerance=data.get("risk_tolerance", "Balanced"),
            custom_lat=data.get("custom_lat"),
            custom_lon=data.get("custom_lon"),
            weather_override=data.get("weather_override"),
            force_refresh=bool(data.get("force_refresh", False)),
            simulate_primary_failure=bool(data.get("simulate_primary_failure", False)),
            simulate_all_failure=bool(data.get("simulate_all_failure", False))
        )

@dataclass
class LocationInfo:
    district_id: str
    state_name: str
    district_name: str
    latitude: float
    longitude: float
    agro_climatic_zone: str
    major_soil_type: str
    is_custom_gps: bool = False
    gps_fallback_occurred: bool = False
    provenance_warnings: List[str] = field(default_factory=list)

@dataclass
class WeatherInfo:
    data_provider: str
    confidence_score: str
    data_freshness: str
    weather_timestamp: str
    cache_hit: bool
    fallback_used: bool
    current_temperature_c: Optional[float] = None
    current_apparent_temp_c: Optional[float] = None
    current_humidity_pct: Optional[int] = None
    current_wind_kmh: Optional[float] = None
    current_precipitation_mm: Optional[float] = None
    surface_soil_moisture_m3m3: Optional[float] = None
    root_zone_soil_moisture_m3m3: Optional[float] = None
    fao_et0_mm_hr: Optional[float] = None
    vapour_pressure_deficit_kpa: Optional[float] = None
    rainfall_anomaly_pct: Optional[float] = None
    forecast_rain_7d_total_mm: Optional[float] = None
    max_rain_probability_7d_pct: Optional[int] = None
    forecast_temp_max_c: Optional[float] = None
    forecast_temp_min_c: Optional[float] = None
    daily_series: List[Dict[str, Any]] = field(default_factory=list)
    missing_variables: List[str] = field(default_factory=list)

@dataclass
class RiskInfo:
    overall_risk_score: float
    overall_risk_label: str
    drought_risk_score: float
    drought_risk_label: str
    waterlogging_risk_score: float
    waterlogging_risk_label: str
    heat_risk_score: float
    heat_risk_label: str
    atmospheric_water_stress_score: float
    atmospheric_water_stress_label: str
    effective_drought_mitigation: float
    irrigation_buffer_pct: float
    soil_moisture_status: str
    waterlogging_alert: Optional[str] = None
    heat_alert: Optional[str] = None

@dataclass
class CropEvaluationItem:
    crop_name: str
    hist_yield_qtl_acre: float
    weather_multiplier: float
    expected_yield_qtl_acre: float
    total_risk_penalty_pct: float
    drought_penalty_pct: float
    waterlogging_penalty_pct: float
    heat_penalty_pct: float
    modal_price_per_qtl: float
    cost_c2_per_acre: float
    expected_revenue_per_acre: float
    expected_profit_per_acre: float
    risk_adjusted_profit_per_acre: float
    risk_score: float
    is_allocated: bool
    allocated_acres: float
    acre_share_pct: float
    reasons: List[str] = field(default_factory=list)

@dataclass
class AllocatedCropItem:
    crop_name: str
    allocated_acres: float
    acre_share_pct: float
    expected_yield_qtl_acre: float
    modal_price_per_qtl: float
    total_cost_inr: float
    total_revenue_inr: float
    net_profit_inr: float
    roi_pct: float
    risk_score: float
    reasons: List[str] = field(default_factory=list)

@dataclass
class OptimizationTotals:
    status: str
    total_land_acres: float
    total_allocated_acres: float
    fallow_acres: float
    budget_capital_inr: float
    total_investment_inr: float
    budget_utilization_pct: float
    total_expected_revenue_inr: float
    total_expected_net_profit_inr: float
    expected_farm_roi_pct: float
    weighted_risk_score: float
    weighted_risk_label: str
    budget_constrained: bool
    all_negative_profits: bool
    solver_method: str = "SciPy HiGHS Dual-Simplex / Interior-Point"

@dataclass
class CausalStep:
    step_number: int
    title: str
    detail: str

@dataclass
class ExplanationInfo:
    headline: str
    environmental_summary: str
    irrigation_impact: str
    allocated_crop_breakdown: List[str]
    special_alerts: List[str]
    unselected_crop_insights: List[str]
    causal_chain: List[CausalStep]
    data_trust_summary: str

@dataclass
class ScenarioItem:
    scenario_id: str
    scenario_name: str
    description: str
    total_profit_inr: float
    profit_delta_from_live_inr: float
    roi_pct: float
    total_allocated_acres: float
    fallow_acres: float
    allocations: Dict[str, float]
    primary_risk_factor: str
    key_allocation_shift: str

@dataclass
class FarmDecisionResponse:
    """
    Complete, self-contained frontend-neutral farm decision response contract.
    Guaranteed 100% JSON-serializable via to_dict().
    """
    request: FarmDecisionRequest
    location: LocationInfo
    weather: WeatherInfo
    risk: RiskInfo
    crop_evaluations: List[CropEvaluationItem]
    allocated_crops: List[AllocatedCropItem]
    farm_totals: OptimizationTotals
    explanation: ExplanationInfo
    alerts: List[str]
    scenarios: Dict[str, ScenarioItem]

    def to_dict(self) -> Dict[str, Any]:
        """Serializes the response hierarchy into a pure JSON-compatible dictionary."""
        return _clean_json_val(asdict(self))

    def to_json(self, indent: int = 2) -> str:
        """Serializes the response hierarchy into a formatted JSON string."""
        return json.dumps(self.to_dict(), indent=indent)
