"""
src/agent_explainer.py
Autonomous AI Agent Decision Explainer.
Generates structured, variable-grounded agronomic and economic explanations for Indian farmers.
Establishes the transparent 8-step causal chain from Historical Data + Current Weather -> Final Action.
"""

from typing import Dict, Any, List
from src.dynamic_farm_state import DynamicFarmState

class AgentDecisionExplainer:
    @staticmethod
    def generate_explanation(
        farm_state: DynamicFarmState,
        optimization_result: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Generates structured, transparent reasoning explaining how historical data,
        current weather, soil moisture, 7-day forecast, and irrigation status drove the decision.
        """
        loc = farm_state.location
        cur = farm_state.current
        fct = farm_state.forecast
        rec = farm_state.recent
        qual = farm_state.quality
        farmer = farm_state.farmer
        risks = farm_state.risk

        allocated = optimization_result.get("allocated_crops", [])
        all_evals = optimization_result.get("all_candidate_evaluations", [])
        totals = optimization_result.get("farm_totals", {})
        budget_constrained = optimization_result.get("budget_constrained", False)
        all_negative_profits = optimization_result.get("all_negative_profits", False)

        # 1. Executive Summary Headline
        if allocated:
            alloc_str = ", ".join([f"{c['allocated_acres']:.1f} Acres {c['crop_name']} ({c['acre_share_pct']}%)" for c in allocated])
            headline = (
                f"Strategic Plan for {farmer.land_size_acres} Acres in {loc.district_name}, {loc.state_name}: "
                f"Allocate {alloc_str} for a projected Net Profit of ₹{totals.get('total_expected_net_profit_inr', 0):,.0f} "
                f"(ROI: +{totals.get('expected_farm_roi_pct', 0):.1f}%)."
            )
        else:
            alloc_str = "0.0 Acres (100% Fallow)"
            fallow_val = totals.get('fallow_acres', farmer.land_size_acres)
            headline = (
                f"Strategic Plan for {farmer.land_size_acres} Acres in {loc.district_name}, {loc.state_name}: "
                f"All {fallow_val:.1f} Acres remain fallow due to capital/environmental constraints (Budget: ₹{farmer.budget_capital_inr:,.0f})."
            )

        # 2. Environmental & Soil Condition Synthesis
        t_str = f"{cur.current_temperature_c}°C" if cur.current_temperature_c is not None else "Normal Seasonal"
        rh_str = f"{cur.current_humidity_pct}%" if cur.current_humidity_pct is not None else "Normal"
        sm_str = f"{cur.root_zone_soil_moisture_m3m3:.3f} m³/m³" if cur.root_zone_soil_moisture_m3m3 is not None else "Historical Baseline"
        
        rain_fct_str = f"{fct.forecast_rain_7d_total_mm:.1f} mm" if fct.forecast_rain_7d_total_mm is not None else "Historical Average"
        rain_prob_str = f"{fct.max_rain_probability_7d_pct}%" if fct.max_rain_probability_7d_pct is not None else "N/A"
        anom_str = f"{rec.rainfall_anomaly_pct:+.1f}%" if rec.rainfall_anomaly_pct is not None else "N/A (Historical Mode)"

        env_summary = (
            f"Current temperature is {t_str} with {rh_str} humidity on {loc.major_soil_type}. "
            f"Root-zone soil moisture is measured at {sm_str} ({risks.soil_moisture_status}). "
            f"The 7-day weather forecast indicates {rain_fct_str} cumulative rainfall "
            f"with a peak rain probability of {rain_prob_str}. "
            f"Seasonal rainfall anomaly is currently {anom_str} compared with the historical IMD baseline ({farm_state.historical.imd_season_rainfall_mm:.0f} mm)."
        )

        # 3. Irrigation & Risk Mitigation Impact
        if farmer.irrigation_type == "Rainfed":
            irr_text = (
                f"Farm operation is configured as 'Rainfed' with '{farmer.irrigation_reliability}' reliability. "
                f"Full 100% drought risk exposure is applied to the crop portfolio (Mitigation factor: {risks.effective_drought_mitigation:.2f}). "
                f"Water-intensive crops receive significant yield and profit penalties during moisture deficits."
            )
        else:
            irr_text = (
                f"Farm operation is configured with '{farmer.irrigation_type}' irrigation at '{farmer.irrigation_reliability}' reliability. "
                f"This applies an effective drought mitigation factor of {risks.effective_drought_mitigation:.2f}, "
                f"buffering surface rainfall deficits by {(1.0 - risks.effective_drought_mitigation)*100:.0f}%. "
                f"Note: Irrigation buffers moisture deficits, but does NOT eliminate excess flood/waterlogging or atmospheric heat stress."
            )

        # 4. Crop-Specific Decision Breakdown
        crop_reasons = []
        for c in allocated:
            crop_name = c["crop_name"]
            c_reasons = c.get("reasons", [])
            r_str = "; ".join(c_reasons)
            crop_reasons.append(
                f"• **{crop_name} ({c['allocated_acres']} Acres):** "
                f"Expected yield is {c['expected_yield_qtl_acre']} Qtl/Acre at an expected mandi price of ₹{c['modal_price_per_qtl']:,.0f}/Qtl. "
                f"Projected Net Profit: ₹{c['net_profit_inr']:,.0f} (ROI: {c['roi_pct']}%). "
                f"Agronomic Rationale: {r_str}"
            )
        if not crop_reasons:
            crop_reasons.append("• No crops allocated for active planting under current budget/boundary conditions. Land kept fallow.")

        # Special Financial Alerts (Budget limitation or Downside minimization)
        special_alerts = []
        if budget_constrained:
            fallow_acres = totals.get("fallow_acres", 0.0)
            special_alerts.append(
                f"⚠️ **Capital Budget Constraint:** Available budget (₹{farmer.budget_capital_inr:,.0f}) allowed cultivating "
                f"{totals.get('total_allocated_acres', 0.0):.1f} of {farmer.land_size_acres:.1f} acres. "
                f"{fallow_acres:.1f} acres remain unallocated/fallow to avoid financial over-leverage."
            )
        if all_negative_profits:
            special_alerts.append(
                "⚠️ **Downside Minimization Alert:** Under current extreme environmental stressors and cost structures, "
                "all candidate crops face negative baseline margins. Allocation is mathematically optimized to minimize downside financial loss."
            )

        # 5. Why other candidate crops were reduced or eliminated
        unselected_insights = []
        allocated_names = [c["crop_name"] for c in allocated]
        for cand in all_evals:
            if cand["crop_name"] not in allocated_names:
                p_loss = (cand["drought_penalty"] + cand["waterlogging_penalty"] + cand["heat_penalty"]) * 100
                unselected_insights.append(
                    f"• **{cand['crop_name']} (0 Acres):** "
                    f"Penalized by {p_loss:.0f}% total risk penalty ({'; '.join(cand['reasons'])}), "
                    f"reducing risk-adjusted profit to ₹{cand['risk_adjusted_profit_per_acre']:,.0f}/Acre."
                )

        # 6. Explicit 8-Step Causal Chain
        max_dp = max([c.get("drought_penalty", 0.0) for c in all_evals]) if all_evals else 0.0
        causal_chain = [
            f"1. **Historical Ground Truth:** {loc.district_name} historical records establish baseline crop yields (DES APY) and CACP cultivation cost structures.",
            f"2. **Current Environmental Observation:** Current temperature ({t_str}), root-zone soil moisture ({sm_str}), and atmospheric demand ({'High ET0' if (cur.fao_et0_mm_hr or 0) > 0.4 else 'Moderate ET0'}).",
            f"3. **Forecast Trajectory:** 7-day model predicts {rain_fct_str} rainfall with a peak {rain_prob_str} precipitation likelihood.",
            f"4. **Dynamic Risk Translation:** Environmental conditions translate into a Drought Score of {risks.drought_risk_score:.2f}, Waterlogging Score of {risks.waterlogging_risk_score:.2f}, and Heat Score of {risks.heat_risk_score:.2f}.",
            f"5. **Crop-Specific Yield Adjustment:** Crop biological thresholds scale expected yields (e.g. drought-sensitive crops penalize up to -{max_dp*100:.0f}% on rainfed land).",
            f"6. **Economic Recalculation:** Yield adjustments flow into expected mandi revenue (Agmarknet) minus CACP Cost C2 to compute net margin per acre.",
            f"7. **Linear Programming Optimization:** SciPy solver maximizes farm risk-adjusted profit under farmer capital (₹{farmer.budget_capital_inr:,.0f}) and land limits ({farmer.land_size_acres} Acres).",
            f"8. **Actionable Directive:** The optimizer outputs the exact acreage allocation: {alloc_str}."
        ]

        # 7. Data Provenance & Trust Disclaimer
        missing_note = f" (Missing: {', '.join(qual.missing_variables)})" if qual.missing_variables else ""
        data_trust = (
            f"Environmental data source: {qual.data_provider} (Timestamp: {qual.weather_timestamp}). "
            f"Cache Status: {'Local Cache Hit' if qual.cache_hit else 'Live API Query'}. "
            f"Decision Confidence: **{qual.confidence_score}**{missing_note}. "
            f"All cost calculations use CACP State Survey benchmarks and historical APY district yields."
        )

        return {
            "headline": headline,
            "environmental_summary": env_summary,
            "irrigation_impact": irr_text,
            "allocated_crop_breakdown": crop_reasons,
            "special_alerts": special_alerts,
            "unselected_crop_insights": unselected_insights,
            "causal_chain": causal_chain,
            "data_trust_summary": data_trust
        }
