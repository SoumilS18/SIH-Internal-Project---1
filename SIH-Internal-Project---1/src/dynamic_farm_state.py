"""
src/dynamic_farm_state.py
Structured Data Model for Dynamic Farm State.
Unifies Indian Historical Data + Live Environmental Data + 7-Day Forecast + Computed Risk Metrics.
"""

from dataclasses import dataclass, field, asdict
from typing import Dict, Any, List, Optional

@dataclass
class LocationProfile:
    district_id: str
    state_name: str
    district_name: str
    latitude: float
    longitude: float
    agro_climatic_zone: str
    major_soil_type: str

@dataclass
class HistoricalBaseline:
    imd_annual_rainfall_mm: float
    imd_season_rainfall_mm: float
    crop_baselines: List[Dict[str, Any]]

@dataclass
class CurrentConditions:
    observation_timestamp: str
    current_temperature_c: Optional[float]
    current_humidity_pct: Optional[float]
    current_apparent_temp_c: Optional[float]
    current_wind_kmh: Optional[float]
    current_precipitation_mm: Optional[float]
    surface_soil_moisture_m3m3: Optional[float]
    root_zone_soil_moisture_m3m3: Optional[float]
    fao_et0_mm_hr: Optional[float]
    vapour_pressure_deficit_kpa: Optional[float]

@dataclass
class RecentConditions:
    recent_rainfall_30d_mm: Optional[float]
    rainfall_anomaly_pct: Optional[float]
    soil_moisture_status: str  # 'Severe Deficit', 'Moderate Deficit', 'Optimal', 'Saturated / Waterlogged', 'Unknown (Offline)'

@dataclass
class ForecastConditions:
    forecast_rain_7d_total_mm: Optional[float]
    max_rain_probability_7d_pct: Optional[float]
    forecast_temp_max_c: Optional[float]
    forecast_temp_min_c: Optional[float]
    daily_series: List[Dict[str, Any]] = field(default_factory=list)

@dataclass
class FarmRiskSummary:
    soil_moisture_status: str
    drought_risk_score: float
    waterlogging_risk_score: float
    heat_risk_score: float
    atmospheric_water_stress_score: float
    effective_drought_mitigation: float
    waterlogging_alert: str
    heat_alert: str

@dataclass
class DataQuality:
    weather_source: str
    data_provider: str
    weather_timestamp: str
    cache_hit: bool
    fallback_used: bool
    data_freshness: str
    confidence_score: str        # 'High', 'Medium', 'Low'
    missing_variables: List[str] = field(default_factory=list)

@dataclass
class FarmerProfile:
    land_size_acres: float
    budget_capital_inr: float
    irrigation_type: str        # 'Rainfed', 'Borewell', 'Canal', 'Drip', 'Sprinkler'
    irrigation_reliability: str # 'High', 'Medium', 'Low'
    selected_season: str        # 'Kharif', 'Rabi', 'Zaid'
    risk_tolerance: str         # 'Conservative', 'Balanced', 'Aggressive'

@dataclass
class DynamicFarmState:
    location: LocationProfile
    historical: HistoricalBaseline
    current: CurrentConditions
    recent: RecentConditions
    forecast: ForecastConditions
    risk: FarmRiskSummary
    quality: DataQuality
    farmer: FarmerProfile

    def to_dict(self) -> Dict[str, Any]:
        """Converts state to dictionary for JSON serialization and API responses."""
        return asdict(self)
