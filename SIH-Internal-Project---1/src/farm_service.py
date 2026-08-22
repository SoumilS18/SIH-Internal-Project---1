"""
src/farm_service.py
Unified Orchestration Service for USICT038.
Coordinates DatabaseManager, WeatherService, AgriculturalRiskEngine,
DynamicFarmOptimizer, and AgentDecisionExplainer.
Provides clean service boundary with get_farm_decision() returning FarmDecisionResponse.
"""

from typing import Dict, Any, Optional, List, Union

from src.db_manager import DatabaseManager
from src.weather_service import WeatherService, EnvironmentalDataError
from src.risk_engine import AgriculturalRiskEngine
from src.optimization_engine import DynamicFarmOptimizer
from src.agent_explainer import AgentDecisionExplainer
from src.dynamic_farm_state import (
    DynamicFarmState, LocationProfile, HistoricalBaseline,
    CurrentConditions, RecentConditions, ForecastConditions,
    FarmRiskSummary, DataQuality, FarmerProfile
)
from src.config import INDIAN_SEASONS
from src.api_models import (
    FarmDecisionRequest, FarmDecisionResponse, LocationInfo,
    WeatherInfo, RiskInfo, CropEvaluationItem, AllocatedCropItem,
    OptimizationTotals, CausalStep, ExplanationInfo, ScenarioItem
)

def _get_risk_label(score: float) -> str:
    if score < 0.25:
        return "LOW"
    elif score < 0.55:
        return "MODERATE"
    elif score < 0.80:
        return "HIGH"
    return "CRITICAL"

class FarmDecisionService:
    def __init__(self):
        self.db = DatabaseManager()
        self.weather = WeatherService()
        self.risk_engine = AgriculturalRiskEngine()
        self.optimizer = DynamicFarmOptimizer(self.risk_engine)
        self.explainer = AgentDecisionExplainer()

    def get_available_locations(self) -> List[Dict[str, Any]]:
        """Returns all pre-configured Indian states and districts."""
        return self.db.get_all_districts()

    def build_farm_state(
        self,
        state_name: str,
        district_name: str,
        land_size_acres: float = 5.0,
        budget_inr: float = 100000.0,
        irrigation_type: str = "Borewell",
        irrigation_reliability: str = "High",
        season: str = "Kharif",
        risk_tolerance: str = "Balanced",
        custom_lat: Optional[float] = None,
        custom_lon: Optional[float] = None,
        force_refresh: bool = False,
        weather_override: Optional[str] = None,
        simulate_primary_failure: bool = False,
        simulate_all_failure: bool = False
    ) -> DynamicFarmState:
        """
        Retrieves historical data, live Open-Meteo weather, and combines into DynamicFarmState.
        """
        # Input boundary validation
        land_size_acres = max(0.0, float(land_size_acres))
        budget_inr = max(0.0, float(budget_inr))

        dist_info = self.db.get_district_by_name(state_name, district_name)
        if not dist_info:
            dist_info = self.db.get_all_districts()[0]

        district_id = dist_info["district_id"]
        lat = custom_lat if custom_lat is not None else dist_info["latitude"]
        lon = custom_lon if custom_lon is not None else dist_info["longitude"]

        # 1. Location Profile
        loc_profile = LocationProfile(
            district_id=district_id,
            state_name=dist_info["state_name"],
            district_name=dist_info["district_name"],
            latitude=lat,
            longitude=lon,
            agro_climatic_zone=dist_info["agro_climatic_zone"],
            major_soil_type=dist_info["major_soil_type"]
        )

        # 2. Historical Baseline
        imd_normals = self.db.get_imd_rainfall_normals(district_id) or {
            "annual_normal_mm": 1000.0, "kharif_normal_mm": 750.0, "rabi_normal_mm": 150.0, "zaid_normal_mm": 100.0
        }
        season_normal_key = f"{season.lower()}_normal_mm"
        season_normal = imd_normals.get(season_normal_key, imd_normals.get("annual_normal_mm", 1000.0) * 0.75)

        crop_baselines = self.db.get_historical_crop_baselines(district_id, season)
        if not crop_baselines:
            crop_baselines = self.db.get_historical_crop_baselines(district_id, None)

        hist_baseline = HistoricalBaseline(
            imd_annual_rainfall_mm=imd_normals.get("annual_normal_mm", 1000.0),
            imd_season_rainfall_mm=season_normal,
            crop_baselines=crop_baselines
        )

        # 3. Live Environmental Conditions (with GPS boundary fallback)
        try:
            env_raw = self.weather.get_environmental_state(
                lat, lon,
                force_refresh=force_refresh,
                simulate_primary_failure=simulate_primary_failure,
                simulate_all_failure=simulate_all_failure
            )
        except EnvironmentalDataError as e:
            print(f"[Warning] Custom GPS ({lat}, {lon}) outside India: {e}. Falling back to district centroid.")
            lat = dist_info["latitude"]
            lon = dist_info["longitude"]
            loc_profile.latitude = lat
            loc_profile.longitude = lon
            env_raw = self.weather.get_environmental_state(
                lat, lon,
                force_refresh=force_refresh,
                simulate_primary_failure=simulate_primary_failure,
                simulate_all_failure=simulate_all_failure
            )
            env_raw["missing_variables"] = env_raw.get("missing_variables", []) + ["custom_gps_outside_india_reverted_to_centroid"]

        # Handle Weather Overrides for Scenario Simulations
        if weather_override == "Severe Drought Anomaly (-40% rain, dry soil)":
            env_raw["current_temperature_c"] = 34.5
            env_raw["root_zone_soil_moisture_m3m3"] = 0.24
            env_raw["surface_soil_moisture_m3m3"] = 0.18
            env_raw["forecast_7d_rain_total_mm"] = 2.0
            env_raw["forecast_7d_max_rain_prob_pct"] = 10
            env_raw["forecast_temp_max_c"] = 37.0
            recent_rain = 25.0
        elif weather_override == "Excess Rainfall & Waterlogging (+80% rain, saturated)":
            env_raw["current_temperature_c"] = 26.0
            env_raw["root_zone_soil_moisture_m3m3"] = 0.54
            env_raw["surface_soil_moisture_m3m3"] = 0.52
            env_raw["forecast_7d_rain_total_mm"] = 145.0
            env_raw["forecast_7d_max_rain_prob_pct"] = 95
            env_raw["forecast_temp_max_c"] = 28.0
            recent_rain = 280.0
        elif weather_override == "Severe Heat Wave (41°C forecast)":
            env_raw["current_temperature_c"] = 39.5
            env_raw["root_zone_soil_moisture_m3m3"] = 0.32
            env_raw["forecast_7d_rain_total_mm"] = 5.0
            env_raw["forecast_temp_max_c"] = 42.0
            recent_rain = 50.0
        else:
            recent_rain = (env_raw.get("forecast_7d_rain_total_mm") * 4.0) if env_raw.get("forecast_7d_rain_total_mm") is not None else None

        # 4. Current Conditions Model
        current_cond = CurrentConditions(
            observation_timestamp=env_raw.get("observation_timestamp", ""),
            current_temperature_c=env_raw.get("current_temperature_c"),
            current_humidity_pct=env_raw.get("current_humidity_pct"),
            current_apparent_temp_c=env_raw.get("current_apparent_temp_c"),
            current_wind_kmh=env_raw.get("current_wind_kmh"),
            current_precipitation_mm=env_raw.get("current_precipitation_mm"),
            surface_soil_moisture_m3m3=env_raw.get("surface_soil_moisture_m3m3"),
            root_zone_soil_moisture_m3m3=env_raw.get("root_zone_soil_moisture_m3m3"),
            fao_et0_mm_hr=env_raw.get("fao_et0_mm_hr"),
            vapour_pressure_deficit_kpa=env_raw.get("vapour_pressure_deficit_kpa")
        )

        # 5. Recent Anomaly Calculations
        rain_anomaly = self.risk_engine.calculate_rainfall_anomaly(
            recent_rain, hist_baseline.imd_annual_rainfall_mm, season
        )
        
        # 6. Farm-level Risk Summary
        farm_risks_dict = self.risk_engine.evaluate_farm_risks(
            current_temp_c=current_cond.current_temperature_c,
            root_zone_sm=current_cond.root_zone_soil_moisture_m3m3,
            forecast_rain_7d=env_raw.get("forecast_7d_rain_total_mm"),
            forecast_max_temp=env_raw.get("forecast_temp_max_c"),
            fao_et0_mm_hr=current_cond.fao_et0_mm_hr,
            vpd_kpa=current_cond.vapour_pressure_deficit_kpa,
            irrigation_type=irrigation_type,
            irrigation_reliability=irrigation_reliability,
            soil_type=loc_profile.major_soil_type
        )

        risk_summary = FarmRiskSummary(
            soil_moisture_status=farm_risks_dict["soil_moisture_status"],
            drought_risk_score=farm_risks_dict["drought_risk_score"],
            waterlogging_risk_score=farm_risks_dict["waterlogging_risk_score"],
            heat_risk_score=farm_risks_dict["heat_risk_score"],
            atmospheric_water_stress_score=farm_risks_dict["atmospheric_water_stress_score"],
            effective_drought_mitigation=farm_risks_dict["effective_drought_mitigation"],
            waterlogging_alert=farm_risks_dict["waterlogging_alert"],
            heat_alert=farm_risks_dict["heat_alert"]
        )

        recent_cond = RecentConditions(
            recent_rainfall_30d_mm=round(recent_rain, 1) if recent_rain is not None else None,
            rainfall_anomaly_pct=rain_anomaly,
            soil_moisture_status=farm_risks_dict["soil_moisture_status"]
        )

        # 7. Forecast Model
        forecast_cond = ForecastConditions(
            forecast_rain_7d_total_mm=env_raw.get("forecast_7d_rain_total_mm"),
            max_rain_probability_7d_pct=env_raw.get("forecast_7d_max_rain_prob_pct"),
            forecast_temp_max_c=env_raw.get("forecast_temp_max_c"),
            forecast_temp_min_c=env_raw.get("forecast_temp_min_c"),
            daily_series=env_raw.get("daily_forecast_series", [])
        )

        # 8. Data Quality & Provenance
        data_qual = DataQuality(
            weather_source=env_raw.get("source_type", "Primary"),
            data_provider=env_raw.get("data_provider", "Open-Meteo"),
            weather_timestamp=env_raw.get("observation_timestamp", ""),
            cache_hit=env_raw.get("cache_hit", False),
            fallback_used=env_raw.get("fallback_used", False),
            data_freshness=env_raw.get("data_freshness", "Live"),
            confidence_score=env_raw.get("confidence_score", "High"),
            missing_variables=env_raw.get("missing_variables", [])
        )

        # 9. Farmer Profile
        farmer_prof = FarmerProfile(
            land_size_acres=land_size_acres,
            budget_capital_inr=budget_inr,
            irrigation_type=irrigation_type,
            irrigation_reliability=irrigation_reliability,
            selected_season=season,
            risk_tolerance=risk_tolerance
        )

        return DynamicFarmState(
            location=loc_profile,
            historical=hist_baseline,
            current=current_cond,
            recent=recent_cond,
            forecast=forecast_cond,
            risk=risk_summary,
            quality=data_qual,
            farmer=farmer_prof
        )

    def execute_decision_pipeline(
        self,
        state_name: str,
        district_name: str,
        land_size_acres: float = 5.0,
        budget_inr: float = 100000.0,
        irrigation_type: str = "Borewell",
        irrigation_reliability: str = "High",
        season: str = "Kharif",
        risk_tolerance: str = "Balanced",
        custom_lat: Optional[float] = None,
        custom_lon: Optional[float] = None,
        force_refresh: bool = False,
        weather_override: Optional[str] = None,
        simulate_primary_failure: bool = False,
        simulate_all_failure: bool = False
    ) -> Dict[str, Any]:
        """
        Executes the full end-to-end autonomous decision pipeline.
        """
        farm_state = self.build_farm_state(
            state_name=state_name,
            district_name=district_name,
            land_size_acres=land_size_acres,
            budget_inr=budget_inr,
            irrigation_type=irrigation_type,
            irrigation_reliability=irrigation_reliability,
            season=season,
            risk_tolerance=risk_tolerance,
            custom_lat=custom_lat,
            custom_lon=custom_lon,
            force_refresh=force_refresh,
            weather_override=weather_override,
            simulate_primary_failure=simulate_primary_failure,
            simulate_all_failure=simulate_all_failure
        )

        candidate_baselines = farm_state.historical.crop_baselines
        opt_result = self.optimizer.optimize_farm_plan(farm_state, candidate_baselines)
        explanation = self.explainer.generate_explanation(farm_state, opt_result)

        return {
            "farm_state": farm_state.to_dict(),
            "optimization": opt_result,
            "explanation": explanation
        }

    def get_farm_decision(
        self,
        request: Union[FarmDecisionRequest, Dict[str, Any]]
    ) -> FarmDecisionResponse:
        """
        Single unified frontend-independent API entry point.
        Accepts request parameters and returns a complete, typed, JSON-serializable FarmDecisionResponse.
        """
        if isinstance(request, dict):
            req_obj = FarmDecisionRequest.from_dict(request)
        else:
            req_obj = request

        # 1. Run main decision pipeline
        pipeline_res = self.execute_decision_pipeline(
            state_name=req_obj.state_name,
            district_name=req_obj.district_name,
            land_size_acres=req_obj.land_size_acres,
            budget_inr=req_obj.budget_inr,
            irrigation_type=req_obj.irrigation_type,
            irrigation_reliability=req_obj.irrigation_reliability,
            season=req_obj.season,
            risk_tolerance=req_obj.risk_tolerance,
            custom_lat=req_obj.custom_lat,
            custom_lon=req_obj.custom_lon,
            force_refresh=req_obj.force_refresh,
            weather_override=req_obj.weather_override,
            simulate_primary_failure=req_obj.simulate_primary_failure,
            simulate_all_failure=req_obj.simulate_all_failure
        )

        f_state = pipeline_res["farm_state"]
        opt_res = pipeline_res["optimization"]
        exp_res = pipeline_res["explanation"]
        totals = opt_res.get("farm_totals", {})

        # 2. Map Location
        loc_dict = f_state["location"]
        qual_dict = f_state["quality"]
        cur_dict = f_state["current"]
        rec_dict = f_state["recent"]
        fct_dict = f_state["forecast"]
        risk_dict = f_state["risk"]

        is_gps_override = (req_obj.custom_lat is not None and req_obj.custom_lon is not None)
        gps_fallback = "custom_gps_outside_india_reverted_to_centroid" in qual_dict.get("missing_variables", [])
        prov_warnings = []
        if gps_fallback:
            prov_warnings.append("Custom GPS coordinates fell outside India; reverted to district centroid.")
        if qual_dict.get("fallback_used"):
            prov_warnings.append("Primary weather API unavailable; using NASA POWER MERRA-2 fallback.")
        if qual_dict.get("confidence_score") == "Low":
            prov_warnings.append("All external telemetry offline; operating in Historical Climatology Mode.")

        loc_info = LocationInfo(
            district_id=loc_dict["district_id"],
            state_name=loc_dict["state_name"],
            district_name=loc_dict["district_name"],
            latitude=loc_dict["latitude"],
            longitude=loc_dict["longitude"],
            agro_climatic_zone=loc_dict["agro_climatic_zone"],
            major_soil_type=loc_dict["major_soil_type"],
            is_custom_gps=is_gps_override,
            gps_fallback_occurred=gps_fallback,
            provenance_warnings=prov_warnings
        )

        # 3. Map Weather
        weather_info = WeatherInfo(
            data_provider=qual_dict.get("data_provider", "Open-Meteo"),
            confidence_score=qual_dict.get("confidence_score", "High"),
            data_freshness=qual_dict.get("data_freshness", "Live"),
            weather_timestamp=qual_dict.get("weather_timestamp", ""),
            cache_hit=qual_dict.get("cache_hit", False),
            fallback_used=qual_dict.get("fallback_used", False),
            current_temperature_c=cur_dict.get("current_temperature_c"),
            current_apparent_temp_c=cur_dict.get("current_apparent_temp_c"),
            current_humidity_pct=cur_dict.get("current_humidity_pct"),
            current_wind_kmh=cur_dict.get("current_wind_kmh"),
            current_precipitation_mm=cur_dict.get("current_precipitation_mm"),
            surface_soil_moisture_m3m3=cur_dict.get("surface_soil_moisture_m3m3"),
            root_zone_soil_moisture_m3m3=cur_dict.get("root_zone_soil_moisture_m3m3"),
            fao_et0_mm_hr=cur_dict.get("fao_et0_mm_hr"),
            vapour_pressure_deficit_kpa=cur_dict.get("vapour_pressure_deficit_kpa"),
            rainfall_anomaly_pct=rec_dict.get("rainfall_anomaly_pct"),
            forecast_rain_7d_total_mm=fct_dict.get("forecast_rain_7d_total_mm"),
            max_rain_probability_7d_pct=fct_dict.get("max_rain_probability_7d_pct"),
            forecast_temp_max_c=fct_dict.get("forecast_temp_max_c"),
            forecast_temp_min_c=fct_dict.get("forecast_temp_min_c"),
            daily_series=fct_dict.get("daily_series", []),
            missing_variables=qual_dict.get("missing_variables", [])
        )

        # 4. Map Risk
        w_risk = totals.get("weighted_risk_score", 0.20)
        d_risk = risk_dict.get("drought_risk_score", 0.15)
        wl_risk = risk_dict.get("waterlogging_risk_score", 0.10)
        h_risk = risk_dict.get("heat_risk_score", 0.10)
        et_risk = risk_dict.get("atmospheric_water_stress_score", 0.10)
        eff_mit = risk_dict.get("effective_drought_mitigation", 0.25)

        risk_info = RiskInfo(
            overall_risk_score=w_risk,
            overall_risk_label=_get_risk_label(w_risk),
            drought_risk_score=d_risk,
            drought_risk_label=_get_risk_label(d_risk),
            waterlogging_risk_score=wl_risk,
            waterlogging_risk_label=_get_risk_label(wl_risk),
            heat_risk_score=h_risk,
            heat_risk_label=_get_risk_label(h_risk),
            atmospheric_water_stress_score=et_risk,
            atmospheric_water_stress_label=_get_risk_label(et_risk),
            effective_drought_mitigation=eff_mit,
            irrigation_buffer_pct=round((1.0 - eff_mit) * 100.0, 1),
            soil_moisture_status=risk_dict.get("soil_moisture_status", "Optimal"),
            waterlogging_alert=risk_dict.get("waterlogging_alert"),
            heat_alert=risk_dict.get("heat_alert")
        )

        # 5. Map Crop Evaluations
        eval_items: List[CropEvaluationItem] = []
        allocated_names = {c["crop_name"]: c for c in opt_res.get("allocated_crops", [])}
        
        for cand in opt_res.get("all_candidate_evaluations", []):
            c_name = cand["crop_name"]
            is_alloc = c_name in allocated_names
            alloc_ac = allocated_names[c_name]["allocated_acres"] if is_alloc else 0.0
            alloc_pct = allocated_names[c_name]["acre_share_pct"] if is_alloc else 0.0
            
            d_pen = cand.get("drought_penalty", 0.0) * 100.0
            wl_pen = cand.get("waterlogging_penalty", 0.0) * 100.0
            h_pen = cand.get("heat_penalty", 0.0) * 100.0
            tot_pen = d_pen + wl_pen + h_pen

            eval_items.append(CropEvaluationItem(
                crop_name=c_name,
                hist_yield_qtl_acre=cand["hist_yield_qtl_acre"],
                weather_multiplier=cand["weather_multiplier"],
                expected_yield_qtl_acre=cand["expected_yield_qtl_acre"],
                total_risk_penalty_pct=round(tot_pen, 1),
                drought_penalty_pct=round(d_pen, 1),
                waterlogging_penalty_pct=round(wl_pen, 1),
                heat_penalty_pct=round(h_pen, 1),
                modal_price_per_qtl=cand["modal_price_per_qtl"],
                cost_c2_per_acre=cand["cost_c2_per_acre"],
                expected_revenue_per_acre=cand["expected_revenue_per_acre"],
                expected_profit_per_acre=cand["expected_profit_per_acre"],
                risk_adjusted_profit_per_acre=cand["risk_adjusted_profit_per_acre"],
                risk_score=cand["risk_score"],
                is_allocated=is_alloc,
                allocated_acres=alloc_ac,
                acre_share_pct=alloc_pct,
                reasons=cand.get("reasons", [])
            ))

        # 6. Map Allocated Crops
        alloc_items: List[AllocatedCropItem] = []
        for c in opt_res.get("allocated_crops", []):
            alloc_items.append(AllocatedCropItem(
                crop_name=c["crop_name"],
                allocated_acres=c["allocated_acres"],
                acre_share_pct=c["acre_share_pct"],
                expected_yield_qtl_acre=c["expected_yield_qtl_acre"],
                modal_price_per_qtl=c["modal_price_per_qtl"],
                total_cost_inr=c["total_cost_inr"],
                total_revenue_inr=c["total_revenue_inr"],
                net_profit_inr=c["net_profit_inr"],
                roi_pct=c["roi_pct"],
                risk_score=c["risk_score"],
                reasons=c.get("reasons", [])
            ))

        # 7. Map Optimization Totals
        opt_totals = OptimizationTotals(
            status=opt_res.get("status", "success"),
            total_land_acres=totals.get("total_land_acres", req_obj.land_size_acres),
            total_allocated_acres=totals.get("total_allocated_acres", 0.0),
            fallow_acres=totals.get("fallow_acres", 0.0),
            budget_capital_inr=totals.get("budget_capital_inr", req_obj.budget_inr),
            total_investment_inr=totals.get("total_investment_inr", 0.0),
            budget_utilization_pct=round((totals.get("total_investment_inr", 0.0) / max(1.0, req_obj.budget_inr)) * 100.0, 1),
            total_expected_revenue_inr=totals.get("total_expected_revenue_inr", 0.0),
            total_expected_net_profit_inr=totals.get("total_expected_net_profit_inr", 0.0),
            expected_farm_roi_pct=totals.get("expected_farm_roi_pct", 0.0),
            weighted_risk_score=w_risk,
            weighted_risk_label=_get_risk_label(w_risk),
            budget_constrained=opt_res.get("budget_constrained", False),
            all_negative_profits=opt_res.get("all_negative_profits", False)
        )

        # 8. Map Explanation & Causal Chain
        causal_steps: List[CausalStep] = []
        raw_chain = exp_res.get("causal_chain", [])
        for idx, text in enumerate(raw_chain, 1):
            parts = text.split(":", 1)
            title = parts[0].replace(f"{idx}. ", "").replace("**", "").strip() if len(parts) > 1 else f"Step {idx}"
            detail = parts[1].strip() if len(parts) > 1 else text
            causal_steps.append(CausalStep(step_number=idx, title=title, detail=detail))

        explanation_info = ExplanationInfo(
            headline=exp_res.get("headline", ""),
            environmental_summary=exp_res.get("environmental_summary", ""),
            irrigation_impact=exp_res.get("irrigation_impact", ""),
            allocated_crop_breakdown=exp_res.get("allocated_crop_breakdown", []),
            special_alerts=exp_res.get("special_alerts", []),
            unselected_crop_insights=exp_res.get("unselected_crop_insights", []),
            causal_chain=causal_steps,
            data_trust_summary=exp_res.get("data_trust_summary", "")
        )

        # 9. Alerts
        alerts_list = list(exp_res.get("special_alerts", []))
        if prov_warnings:
            alerts_list.extend(prov_warnings)

        # 10. Scenario Comparisons
        scenario_data = self.compare_scenarios(
            state_name=req_obj.state_name,
            district_name=req_obj.district_name,
            land_size_acres=req_obj.land_size_acres,
            budget_inr=req_obj.budget_inr,
            irrigation_type=req_obj.irrigation_type,
            irrigation_reliability=req_obj.irrigation_reliability,
            season=req_obj.season,
            risk_tolerance=req_obj.risk_tolerance
        )

        sc_live = scenario_data["live_current"]
        sc_dry = scenario_data["drought_scenario"]
        sc_wet = scenario_data["waterlog_scenario"]
        sc_heat = scenario_data.get("heat_scenario", sc_live)

        live_profit = sc_live["net_profit_inr"]

        scenarios_dict: Dict[str, ScenarioItem] = {
            "live": ScenarioItem(
                scenario_id="live",
                scenario_name="Live Current Weather",
                description="Live Open-Meteo & ERA5-Land observed environmental conditions",
                total_profit_inr=live_profit,
                profit_delta_from_live_inr=0.0,
                roi_pct=sc_live["roi_pct"],
                total_allocated_acres=sum(sc_live["allocations"].values()),
                fallow_acres=max(0.0, req_obj.land_size_acres - sum(sc_live["allocations"].values())),
                allocations=sc_live["allocations"],
                primary_risk_factor=f"Live telemetry (Weighted Risk: {sc_live['risk_score']:.2f})",
                key_allocation_shift="Baseline live portfolio allocation"
            ),
            "drought": ScenarioItem(
                scenario_id="drought",
                scenario_name="Severe Drought Anomaly",
                description="-40% seasonal rainfall deficit with soil moisture near wilting point",
                total_profit_inr=sc_dry["net_profit_inr"],
                profit_delta_from_live_inr=sc_dry["net_profit_inr"] - live_profit,
                roi_pct=sc_dry["roi_pct"],
                total_allocated_acres=sum(sc_dry["allocations"].values()),
                fallow_acres=max(0.0, req_obj.land_size_acres - sum(sc_dry["allocations"].values())),
                allocations=sc_dry["allocations"],
                primary_risk_factor="Severe root-zone moisture deficit",
                key_allocation_shift="Water-intensive cash crops penalized; shifts acreage to drought-hardy pulses"
            ),
            "waterlogging": ScenarioItem(
                scenario_id="waterlogging",
                scenario_name="Heavy Rain & Waterlogging",
                description="+80% rainfall with 145mm 7-day forecast on saturated soils",
                total_profit_inr=sc_wet["net_profit_inr"],
                profit_delta_from_live_inr=sc_wet["net_profit_inr"] - live_profit,
                roi_pct=sc_wet["roi_pct"],
                total_allocated_acres=sum(sc_wet["allocations"].values()),
                fallow_acres=max(0.0, req_obj.land_size_acres - sum(sc_wet["allocations"].values())),
                allocations=sc_wet["allocations"],
                primary_risk_factor="Saturated soil + heavy precipitation forecast",
                key_allocation_shift="Taproot and pulse crops penalized due to root asphyxiation; favors flood-tolerant crops"
            ),
            "heat_wave": ScenarioItem(
                scenario_id="heat_wave",
                scenario_name="Severe Heat Wave",
                description="41°C forecast maximum exceeding critical crop flowering thresholds",
                total_profit_inr=sc_heat["net_profit_inr"],
                profit_delta_from_live_inr=sc_heat["net_profit_inr"] - live_profit,
                roi_pct=sc_heat["roi_pct"],
                total_allocated_acres=sum(sc_heat["allocations"].values()),
                fallow_acres=max(0.0, req_obj.land_size_acres - sum(sc_heat["allocations"].values())),
                allocations=sc_heat["allocations"],
                primary_risk_factor="Extreme temperature stress above crop thresholds",
                key_allocation_shift="Heat-sensitive crops penalized; favors heat-resilient alternatives"
            )
        }

        return FarmDecisionResponse(
            request=req_obj,
            location=loc_info,
            weather=weather_info,
            risk=risk_info,
            crop_evaluations=eval_items,
            allocated_crops=alloc_items,
            farm_totals=opt_totals,
            explanation=explanation_info,
            alerts=alerts_list,
            scenarios=scenarios_dict
        )

    def compare_scenarios(
        self,
        state_name: str,
        district_name: str,
        land_size_acres: float = 5.0,
        budget_inr: float = 100000.0,
        irrigation_type: str = "Rainfed",
        irrigation_reliability: str = "Medium",
        season: str = "Kharif",
        risk_tolerance: str = "Balanced"
    ) -> Dict[str, Any]:
        """
        Runs and compares key environmental states:
        1. Current Live Weather (Open-Meteo)
        2. Severe Drought Anomaly (-40% rain, dry soil)
        3. Heavy Rain & Waterlogging (+80% rain, saturated soil)
        4. Severe Heat Wave (41°C)
        """
        res_live = self.execute_decision_pipeline(
            state_name=state_name, district_name=district_name, land_size_acres=land_size_acres,
            budget_inr=budget_inr, irrigation_type=irrigation_type, irrigation_reliability=irrigation_reliability,
            season=season, risk_tolerance=risk_tolerance, weather_override=None
        )

        res_drought = self.execute_decision_pipeline(
            state_name=state_name, district_name=district_name, land_size_acres=land_size_acres,
            budget_inr=budget_inr, irrigation_type=irrigation_type, irrigation_reliability=irrigation_reliability,
            season=season, risk_tolerance=risk_tolerance, weather_override="Severe Drought Anomaly (-40% rain, dry soil)"
        )

        res_waterlog = self.execute_decision_pipeline(
            state_name=state_name, district_name=district_name, land_size_acres=land_size_acres,
            budget_inr=budget_inr, irrigation_type=irrigation_type, irrigation_reliability=irrigation_reliability,
            season=season, risk_tolerance=risk_tolerance, weather_override="Excess Rainfall & Waterlogging (+80% rain, saturated)"
        )

        res_heat = self.execute_decision_pipeline(
            state_name=state_name, district_name=district_name, land_size_acres=land_size_acres,
            budget_inr=budget_inr, irrigation_type=irrigation_type, irrigation_reliability=irrigation_reliability,
            season=season, risk_tolerance=risk_tolerance, weather_override="Severe Heat Wave (41°C forecast)"
        )

        def summarize(res):
            opt = res["optimization"]
            totals = opt.get("farm_totals", {})
            alloc_dict = {c["crop_name"]: c["allocated_acres"] for c in opt.get("allocated_crops", [])}
            return {
                "allocations": alloc_dict,
                "net_profit_inr": totals.get("total_expected_net_profit_inr", 0),
                "roi_pct": totals.get("expected_farm_roi_pct", 0),
                "risk_score": totals.get("weighted_risk_score", 0),
                "headline": res["explanation"]["headline"]
            }

        return {
            "live_current": summarize(res_live),
            "drought_scenario": summarize(res_drought),
            "waterlog_scenario": summarize(res_waterlog),
            "heat_scenario": summarize(res_heat),
            "full_live_result": res_live
        }
