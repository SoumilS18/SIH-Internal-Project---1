"""
src/risk_engine.py
Agricultural Risk and Environmental Suitability Engine for Indian Crops.
Calculates crop-specific drought, waterlogging, heat stress, evaporative water demand,
and irrigation-mitigated penalties with soil-type aware moisture calibration.
Guarded against NaN, Inf, and physically absurd external telemetry inputs.
"""

import math
from typing import Dict, Any, List, Optional
from src.config import (
    IRRIGATION_MITIGATION, IRRIGATION_RELIABILITY_WEIGHT,
    INDIAN_SEASONS, CROP_AGRONOMIC_PROFILES
)

# Calibrated Volumetric Soil Moisture Thresholds (m3/m3) for Major Indian Soil Types
SOIL_MOISTURE_PROFILES = {
    "Medium Black Soil": {"wilting_point": 0.24, "deficit": 0.32, "optimal": 0.45, "saturation": 0.52},
    "Deep Black Soil (Vertisol)": {"wilting_point": 0.26, "deficit": 0.35, "optimal": 0.48, "saturation": 0.54},
    "Black Cotton Soil": {"wilting_point": 0.25, "deficit": 0.34, "optimal": 0.46, "saturation": 0.53},
    "Alluvial Soil": {"wilting_point": 0.16, "deficit": 0.24, "optimal": 0.36, "saturation": 0.46},
    "Alluvial Deltaic Soil": {"wilting_point": 0.18, "deficit": 0.26, "optimal": 0.38, "saturation": 0.48},
    "Sandy Loam": {"wilting_point": 0.12, "deficit": 0.18, "optimal": 0.28, "saturation": 0.40},
    "Red Sandy Loam": {"wilting_point": 0.14, "deficit": 0.20, "optimal": 0.30, "saturation": 0.42},
    "Red and Yellow Soil": {"wilting_point": 0.16, "deficit": 0.22, "optimal": 0.32, "saturation": 0.44},
    "Black & Red Loam": {"wilting_point": 0.20, "deficit": 0.28, "optimal": 0.38, "saturation": 0.48},
    "Default": {"wilting_point": 0.20, "deficit": 0.30, "optimal": 0.42, "saturation": 0.50}
}

def _is_valid_num(val: Any) -> bool:
    """Checks if value is a valid finite float/int."""
    if val is None:
        return False
    try:
        f = float(val)
        return not (math.isnan(f) or math.isinf(f))
    except (ValueError, TypeError):
        return False

class AgriculturalRiskEngine:
    @staticmethod
    def get_soil_thresholds(soil_type: Optional[str] = None) -> Dict[str, float]:
        """Looks up soil moisture thresholds for a given Indian soil classification."""
        if not soil_type:
            return SOIL_MOISTURE_PROFILES["Default"]
        for k, v in SOIL_MOISTURE_PROFILES.items():
            if k.lower() in soil_type.lower() or soil_type.lower() in k.lower():
                return v
        return SOIL_MOISTURE_PROFILES["Default"]

    @staticmethod
    def calculate_rainfall_anomaly(
        recent_rain_mm: Optional[float],
        imd_annual_normal_mm: float,
        season: str
    ) -> Optional[float]:
        """
        Calculates seasonally-appropriate rainfall anomaly percentage.
        Respects Kharif (75%), Rabi (15%), Zaid (10%) season distribution.
        """
        if not _is_valid_num(recent_rain_mm) or not _is_valid_num(imd_annual_normal_mm):
            return None

        recent_rain_clean = max(0.0, float(recent_rain_mm))
        season_weight = INDIAN_SEASONS.get(season, {}).get("rainfall_weight", 0.75)
        expected_season_normal = float(imd_annual_normal_mm) * season_weight

        # Normalize 30-day recent estimate against monthly baseline fraction
        months_count = len(INDIAN_SEASONS.get(season, {}).get("months", [1, 2, 3, 4]))
        expected_monthly_normal = expected_season_normal / max(1, months_count)
        
        if expected_monthly_normal <= 0:
            return 0.0

        anomaly_pct = ((recent_rain_clean - expected_monthly_normal) / expected_monthly_normal) * 100.0
        return round(anomaly_pct, 1)

    @classmethod
    def evaluate_farm_risks(
        cls,
        current_temp_c: Optional[float],
        root_zone_sm: Optional[float],
        forecast_rain_7d: Optional[float],
        forecast_max_temp: Optional[float],
        fao_et0_mm_hr: Optional[float],
        vpd_kpa: Optional[float],
        irrigation_type: str,
        irrigation_reliability: str,
        soil_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Evaluates general agro-meteorological risk indicators for the farm.
        Handles missing variables and non-finite numbers gracefully.
        """
        st_thresh = cls.get_soil_thresholds(soil_type)

        sm_val = float(root_zone_sm) if _is_valid_num(root_zone_sm) else None
        rain_val = float(forecast_rain_7d) if _is_valid_num(forecast_rain_7d) else None
        t_max_val = float(forecast_max_temp) if _is_valid_num(forecast_max_temp) else None
        t_cur_val = float(current_temp_c) if _is_valid_num(current_temp_c) else None
        et0_val = float(fao_et0_mm_hr) if _is_valid_num(fao_et0_mm_hr) else None
        vpd_val = float(vpd_kpa) if _is_valid_num(vpd_kpa) else None

        # 1. Soil Moisture Assessment (Soil-Type Aware)
        if sm_val is not None:
            sm_clean = max(0.0, sm_val)
            if sm_clean < st_thresh["wilting_point"]:
                soil_status = "Severe Moisture Deficit (Near Wilting Point)"
                drought_risk_score = 0.85
            elif sm_clean < st_thresh["deficit"]:
                soil_status = "Moderate Moisture Deficit"
                drought_risk_score = 0.50
            elif sm_clean > st_thresh["saturation"]:
                soil_status = "Saturated / Waterlogged"
                drought_risk_score = 0.05
            else:
                soil_status = "Optimal Moisture"
                drought_risk_score = 0.15
        else:
            soil_status = "Unknown (Offline / Historical Baseline Mode)"
            drought_risk_score = 0.30

        # 2. Waterlogging / Heavy Rain Risk
        if rain_val is not None and sm_val is not None:
            if rain_val > 90.0 and sm_val > (st_thresh["optimal"] * 0.95):
                waterlogging_risk_score = 0.90
                waterlogging_alert = "CRITICAL: Heavy rainfall forecast on saturated soils."
            elif rain_val > 50.0:
                waterlogging_risk_score = 0.50
                waterlogging_alert = "MODERATE: Significant rainfall expected."
            else:
                waterlogging_risk_score = 0.10
                waterlogging_alert = "LOW: Normal precipitation."
        elif rain_val is not None:
            waterlogging_risk_score = 0.60 if rain_val > 80.0 else 0.10
            waterlogging_alert = "Moderate rain alert (Soil moisture sensor offline)."
        else:
            waterlogging_risk_score = 0.10
            waterlogging_alert = "No forecast rain data available (Historical Mode)."

        # 3. Heat Stress Assessment
        effective_max_t = t_max_val or t_cur_val
        if effective_max_t is not None:
            if effective_max_t >= 38.0:
                heat_risk_score = 0.80
                heat_alert = f"HIGH HEAT STRESS ({effective_max_t:.1f}°C forecast)"
            elif effective_max_t >= 34.0:
                heat_risk_score = 0.45
                heat_alert = f"MODERATE TEMPERATURE ({effective_max_t:.1f}°C forecast)"
            else:
                heat_risk_score = 0.10
                heat_alert = f"FAVORABLE TEMPERATURE ({effective_max_t:.1f}°C)"
        else:
            heat_risk_score = 0.10
            heat_alert = "Temperature in normal seasonal range (Historical Mode)."

        # 4. Atmospheric Evaporative Water Stress (High ET0 / High VPD)
        if et0_val is not None and vpd_val is not None:
            if et0_val > 0.45 or vpd_val > 1.6:
                water_stress_score = 0.70
            elif et0_val > 0.30 or vpd_val > 1.0:
                water_stress_score = 0.35
            else:
                water_stress_score = 0.10
        else:
            water_stress_score = 0.20

        # 5. Irrigation Mitigation Multiplier
        mitigation_base = IRRIGATION_MITIGATION.get(irrigation_type, 0.50)
        rel_weight = IRRIGATION_RELIABILITY_WEIGHT.get(irrigation_reliability, 1.00)
        effective_drought_mitigation = round(mitigation_base * rel_weight, 3)

        return {
            "soil_moisture_status": soil_status,
            "drought_risk_score": drought_risk_score,
            "waterlogging_risk_score": waterlogging_risk_score,
            "waterlogging_alert": waterlogging_alert,
            "heat_risk_score": heat_risk_score,
            "heat_alert": heat_alert,
            "atmospheric_water_stress_score": water_stress_score,
            "effective_drought_mitigation": effective_drought_mitigation
        }

    @classmethod
    def evaluate_crop_suitability(
        cls,
        crop_name: str,
        farm_risks: Dict[str, Any],
        root_zone_sm: Optional[float],
        rainfall_anomaly_pct: Optional[float],
        forecast_rain_7d: Optional[float],
        forecast_max_temp: Optional[float],
        current_temp_c: Optional[float],
        irrigation_type: str,
        soil_type: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Calculates crop-specific risk penalty, expected yield adjustment factor,
        and transparent causal reasoning.
        """
        profile = CROP_AGRONOMIC_PROFILES.get(crop_name, {})
        drought_sens = profile.get("drought_sensitivity", 0.50)
        waterlog_sens = profile.get("waterlogging_sensitivity", 0.50)
        heat_thresh = profile.get("heat_stress_threshold", 35.0)
        st_thresh = cls.get_soil_thresholds(soil_type)

        drought_mitigation = farm_risks.get("effective_drought_mitigation", 0.50)
        
        sm_val = float(root_zone_sm) if _is_valid_num(root_zone_sm) else None
        anom_val = float(rainfall_anomaly_pct) if _is_valid_num(rainfall_anomaly_pct) else None
        rain_val = float(forecast_rain_7d) if _is_valid_num(forecast_rain_7d) else None
        t_eff = float(forecast_max_temp) if _is_valid_num(forecast_max_temp) else (float(current_temp_c) if _is_valid_num(current_temp_c) else None)

        # 1. Drought Penalty
        if sm_val is not None and anom_val is not None:
            rain_deficit_factor = max(0.0, -anom_val / 100.0) if anom_val < 0 else 0.0
            soil_deficit_factor = max(0.0, (st_thresh["optimal"] - sm_val) / st_thresh["optimal"])
            raw_drought_penalty = (rain_deficit_factor * 0.4 + soil_deficit_factor * 0.6) * drought_sens
        elif sm_val is not None:
            soil_deficit_factor = max(0.0, (st_thresh["optimal"] - sm_val) / st_thresh["optimal"])
            raw_drought_penalty = soil_deficit_factor * drought_sens
        elif anom_val is not None:
            rain_deficit_factor = max(0.0, -anom_val / 100.0) if anom_val < 0 else 0.0
            raw_drought_penalty = rain_deficit_factor * drought_sens
        else:
            raw_drought_penalty = 0.0

        # Irrigation strictly reduces drought penalty
        effective_drought_penalty = round(raw_drought_penalty * drought_mitigation, 3)

        # 2. Waterlogging Penalty (Irrigation DOES NOT mitigate excess rain)
        if rain_val is not None and sm_val is not None:
            if rain_val > 60.0 and sm_val > (st_thresh["optimal"] * 0.95):
                excess_water_factor = min(1.0, (rain_val - 60.0) / 80.0 + (sm_val - st_thresh["optimal"] * 0.95) / 0.15)
                waterlogging_penalty = round(excess_water_factor * waterlog_sens * 0.45, 3)
            else:
                waterlogging_penalty = 0.0
        elif rain_val is not None and rain_val > 80.0:
            excess_water_factor = min(1.0, (rain_val - 60.0) / 80.0)
            waterlogging_penalty = round(excess_water_factor * waterlog_sens * 0.35, 3)
        else:
            waterlogging_penalty = 0.0

        # 3. Heat Stress Penalty (Irrigation DOES NOT eliminate atmospheric heat waves)
        if t_eff is not None and t_eff > heat_thresh:
            heat_excess = t_eff - heat_thresh
            heat_penalty = round(min(0.40, (heat_excess / 8.0) * 0.35), 3)
        else:
            heat_penalty = 0.0

        # 4. Total Combined Risk Penalty & Weather Adjustment Multiplier
        total_risk_penalty = min(0.75, effective_drought_penalty + waterlogging_penalty + heat_penalty)
        weather_adjustment_multiplier = round(max(0.25, 1.0 - total_risk_penalty), 3)

        # 5. Risk Score for Economic Objective (0.0 to 1.0)
        risk_score = round(min(1.0, total_risk_penalty * 1.5), 2)

        # 6. Detailed Causal Explanations
        reasons = []
        if effective_drought_penalty > 0.10:
            if irrigation_type == "Rainfed":
                reasons.append(f"Rainfed exposure to moisture deficit (Drought penalty: -{effective_drought_penalty*100:.0f}%)")
            else:
                reasons.append(f"Moisture deficit mitigated by {irrigation_type} irrigation (Penalty: -{effective_drought_penalty*100:.0f}%)")
        
        if waterlogging_penalty > 0.10:
            rain_str = f"{rain_val:.0f}mm" if rain_val is not None else "High"
            reasons.append(f"High forecast rain ({rain_str}) poses waterlogging risk on sensitive root systems (Penalty: -{waterlogging_penalty*100:.0f}%)")
            
        if heat_penalty > 0.05:
            reasons.append(f"Forecast temperature exceeds {crop_name} tolerance threshold ({heat_thresh:.0f}°C) (Heat penalty: -{heat_penalty*100:.0f}%)")

        if not reasons:
            reasons.append("Environmental and soil moisture conditions are optimal for this crop.")

        return {
            "crop_name": crop_name,
            "weather_adjustment_multiplier": weather_adjustment_multiplier,
            "total_risk_penalty": total_risk_penalty,
            "drought_penalty": effective_drought_penalty,
            "waterlogging_penalty": waterlogging_penalty,
            "heat_penalty": heat_penalty,
            "risk_score": risk_score,
            "reasons": reasons
        }
