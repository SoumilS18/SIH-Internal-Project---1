"""
src/optimization_engine.py
Economic Optimization and Crop Portfolio Allocation Core using SciPy Linear Programming.
Maximizes risk-adjusted profit under land, budget, irrigation, and dynamic weather constraints.
"""

from typing import Dict, Any, List
import numpy as np
from scipy.optimize import linprog

from src.config import ACRES_TO_HECTARES
from src.dynamic_farm_state import DynamicFarmState
from src.risk_engine import AgriculturalRiskEngine

class DynamicFarmOptimizer:
    def __init__(self, risk_engine: AgriculturalRiskEngine = None):
        self.risk_engine = risk_engine or AgriculturalRiskEngine()

    def optimize_farm_plan(
        self,
        farm_state: DynamicFarmState,
        candidate_crop_baselines: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        """
        Executes linear programming optimization for crop portfolio allocation.
        Flow:
        Historical Baseline + Live Environmental State
        -> Dynamic Risk Penalties (Soil-Type Aware)
        -> Crop-Specific Yield Adjustments
        -> Expected Revenue & Net Profit
        -> Risk-Adjusted Profit
        -> SciPy HiGHS Solver
        -> Optimal Allocation
        """
        farmer = farm_state.farmer
        cur = farm_state.current
        rec = farm_state.recent
        fct = farm_state.forecast
        loc = farm_state.location
        farm_risks = farm_state.risk

        total_land_acres = max(0.0, farmer.land_size_acres)
        budget_inr = max(0.0, farmer.budget_capital_inr)
        risk_tolerance = farmer.risk_tolerance

        # Risk tolerance aversion parameter lambda
        risk_weights = {
            "Conservative": 0.50,
            "Balanced": 0.25,
            "Aggressive": 0.10
        }
        lambda_risk = risk_weights.get(risk_tolerance, 0.25)

        # Process each candidate crop
        processed_candidates = []
        for baseline in candidate_crop_baselines:
            crop_name = baseline["crop_name"]
            
            # Evaluate crop-specific weather and risk adjustments
            suitability = self.risk_engine.evaluate_crop_suitability(
                crop_name=crop_name,
                farm_risks={
                    "effective_drought_mitigation": farm_risks.effective_drought_mitigation
                },
                root_zone_sm=cur.root_zone_soil_moisture_m3m3,
                rainfall_anomaly_pct=rec.rainfall_anomaly_pct,
                forecast_rain_7d=fct.forecast_rain_7d_total_mm,
                forecast_max_temp=fct.forecast_temp_max_c,
                current_temp_c=cur.current_temperature_c,
                irrigation_type=farmer.irrigation_type,
                soil_type=loc.major_soil_type
            )
            
            # Historical values (convert from per Hectare to per Acre)
            hist_yield_ha = baseline["historical_yield_qtl_ha"]
            hist_yield_acre = hist_yield_ha * ACRES_TO_HECTARES
            
            cost_c2_ha = baseline["cost_c2_per_ha"]
            cost_c2_acre = cost_c2_ha * ACRES_TO_HECTARES
            
            mandi_price = baseline["modal_price_per_qtl"]

            # Dynamic weather adjustment applied to yield
            weather_mult = suitability["weather_adjustment_multiplier"]
            expected_yield_acre = round(hist_yield_acre * weather_mult, 2)
            
            expected_revenue_acre = round(expected_yield_acre * mandi_price, 2)
            expected_profit_acre = round(expected_revenue_acre - cost_c2_acre, 2)
            
            # Risk-adjusted economic return (Objective function coefficient)
            risk_score = suitability["risk_score"]
            risk_adjusted_profit_acre = round(expected_profit_acre * (1.0 - (risk_score * lambda_risk)), 2)

            processed_candidates.append({
                "crop_name": crop_name,
                "season": baseline["season"],
                "hist_yield_qtl_acre": round(hist_yield_acre, 2),
                "expected_yield_qtl_acre": expected_yield_acre,
                "modal_price_per_qtl": mandi_price,
                "cost_c2_per_acre": round(cost_c2_acre, 2),
                "expected_revenue_per_acre": expected_revenue_acre,
                "expected_profit_per_acre": expected_profit_acre,
                "risk_adjusted_profit_per_acre": risk_adjusted_profit_acre,
                "weather_multiplier": weather_mult,
                "risk_score": risk_score,
                "drought_penalty": suitability["drought_penalty"],
                "waterlogging_penalty": suitability["waterlogging_penalty"],
                "heat_penalty": suitability["heat_penalty"],
                "min_acres": baseline.get("min_acres", 0.5),
                "max_acre_share": baseline.get("max_acre_share", 0.75),
                "water_req_mm": baseline.get("water_req_mm", 500),
                "reasons": suitability["reasons"],
                "description": baseline.get("description", "")
            })

        # Check if all candidate crops suffer from negative profit
        all_negative_profits = all([cand["expected_profit_per_acre"] < 0 for cand in processed_candidates]) if processed_candidates else False

        # Edge case 1: Empty candidates
        if not processed_candidates:
            return {
                "status": "error",
                "message": "No suitable crops found for selected season.",
                "solver_status": "No Candidates Found",
                "allocated_crops": [],
                "all_candidate_evaluations": [],
                "budget_constrained": False,
                "all_negative_profits": False,
                "farm_totals": {
                    "total_land_acres": total_land_acres,
                    "total_allocated_acres": 0.0,
                    "fallow_acres": total_land_acres,
                    "total_investment_inr": 0.0,
                    "total_expected_revenue_inr": 0.0,
                    "total_expected_net_profit_inr": 0.0,
                    "expected_farm_roi_pct": 0.0,
                    "weighted_risk_score": 0.0
                }
            }

        # Edge case 2: Zero land or Zero budget
        if total_land_acres <= 0 or budget_inr <= 0:
            return {
                "status": "success",
                "solver_status": "Zero Land / Zero Budget (All Fallow)",
                "allocated_crops": [],
                "all_candidate_evaluations": processed_candidates,
                "budget_constrained": True,
                "all_negative_profits": all_negative_profits,
                "farm_totals": {
                    "total_land_acres": total_land_acres,
                    "total_allocated_acres": 0.0,
                    "fallow_acres": total_land_acres,
                    "total_investment_inr": 0.0,
                    "total_expected_revenue_inr": 0.0,
                    "total_expected_net_profit_inr": 0.0,
                    "expected_farm_roi_pct": 0.0,
                    "weighted_risk_score": 0.0
                }
            }

        num_crops = len(processed_candidates)
        # Maximization of risk_adjusted_profit -> Negated for linprog minimization
        c = [-cand["risk_adjusted_profit_per_acre"] for cand in processed_candidates]

        # Minimum capital needed to cultivate the cheapest crop across full acreage
        min_crop_cost_acre = min([cand["cost_c2_per_acre"] for cand in processed_candidates])
        min_full_farm_cost = min_crop_cost_acre * total_land_acres
        budget_constrained = (budget_inr < min_full_farm_cost)

        # Bounds: Ensure total capacity across candidates >= total_land_acres to prevent artificial infeasibility
        total_max_capacity = sum([cand["max_acre_share"] * total_land_acres for cand in processed_candidates])
        if total_max_capacity < total_land_acres:
            scale = total_land_acres / max(0.001, total_max_capacity)
            bounds = [(0.0, min(total_land_acres, cand["max_acre_share"] * total_land_acres * scale)) for cand in processed_candidates]
        else:
            bounds = [(0.0, cand["max_acre_share"] * total_land_acres) for cand in processed_candidates]

        # Constraints Setup
        # 1. Budget Constraint: Sum x_i * Cost_i <= budget_inr
        # 2. Land Constraint:
        # If budget is sufficient: Sum x_i = total_land_acres (equality)
        # If budget is strictly deficient: Sum x_i <= total_land_acres (inequality to cultivate max possible within budget)
        if not budget_constrained:
            A_ub = [[cand["cost_c2_per_acre"] for cand in processed_candidates]]
            b_ub = [budget_inr]
            A_eq = [[1.0] * num_crops]
            b_eq = [total_land_acres]
        else:
            A_ub = [
                [cand["cost_c2_per_acre"] for cand in processed_candidates],
                [1.0] * num_crops
            ]
            b_ub = [budget_inr, total_land_acres]
            A_eq = None
            b_eq = None

        # Solve Linear Program with HiGHS solver
        res = linprog(
            c,
            A_ub=A_ub,
            b_ub=b_ub,
            A_eq=A_eq,
            b_eq=b_eq,
            bounds=bounds,
            method="highs"
        )

        allocated_crops = []
        if res.success:
            allocations = res.x
            for i, cand in enumerate(processed_candidates):
                acres = round(float(allocations[i]), 2)
                if acres >= 0.1: # Meaningful allocation threshold
                    tot_rev = round(acres * cand["expected_revenue_per_acre"], 2)
                    tot_cost = round(acres * cand["cost_c2_per_acre"], 2)
                    tot_profit = round(tot_rev - tot_cost, 2)
                    roi_pct = round((tot_profit / tot_cost) * 100.0, 1) if tot_cost > 0 else 0.0

                    allocated_crops.append({
                        "crop_name": cand["crop_name"],
                        "season": cand["season"],
                        "allocated_acres": acres,
                        "acre_share_pct": round((acres / total_land_acres) * 100.0, 1),
                        "expected_yield_qtl_acre": cand["expected_yield_qtl_acre"],
                        "total_production_qtl": round(acres * cand["expected_yield_qtl_acre"], 1),
                        "modal_price_per_qtl": cand["modal_price_per_qtl"],
                        "total_cost_inr": tot_cost,
                        "total_revenue_inr": tot_rev,
                        "net_profit_inr": tot_profit,
                        "roi_pct": roi_pct,
                        "risk_score": cand["risk_score"],
                        "water_req_mm": cand["water_req_mm"],
                        "reasons": cand["reasons"]
                    })
        else:
            # Direct greedy fallback
            best_crop = sorted(processed_candidates, key=lambda x: x["risk_adjusted_profit_per_acre"], reverse=True)[0]
            target_acres = min(total_land_acres, budget_inr / max(1.0, best_crop["cost_c2_per_acre"]))
            target_acres = round(max(0.0, target_acres), 2)
            if target_acres > 0.05:
                tot_cost = round(target_acres * best_crop["cost_c2_per_acre"], 2)
                tot_rev = round(target_acres * best_crop["expected_revenue_per_acre"], 2)
                tot_profit = round(tot_rev - tot_cost, 2)
                allocated_crops.append({
                    "crop_name": best_crop["crop_name"],
                    "season": best_crop["season"],
                    "allocated_acres": target_acres,
                    "acre_share_pct": round((target_acres / total_land_acres) * 100.0, 1),
                    "expected_yield_qtl_acre": best_crop["expected_yield_qtl_acre"],
                    "total_production_qtl": round(target_acres * best_crop["expected_yield_qtl_acre"], 1),
                    "modal_price_per_qtl": best_crop["modal_price_per_qtl"],
                    "total_cost_inr": tot_cost,
                    "total_revenue_inr": tot_rev,
                    "net_profit_inr": tot_profit,
                    "roi_pct": round((tot_profit / tot_cost) * 100.0, 1) if tot_cost > 0 else 0.0,
                    "risk_score": best_crop["risk_score"],
                    "water_req_mm": best_crop["water_req_mm"],
                    "reasons": best_crop["reasons"]
                })

        # Calculate Farm Total Metrics
        total_allocated = sum([c["allocated_acres"] for c in allocated_crops])
        total_invested = sum([c["total_cost_inr"] for c in allocated_crops])
        total_revenue = sum([c["total_revenue_inr"] for c in allocated_crops])
        total_net_profit = sum([c["net_profit_inr"] for c in allocated_crops])
        farm_roi = round((total_net_profit / total_invested) * 100.0, 1) if total_invested > 0 else 0.0
        avg_risk = round(sum([c["risk_score"] * (c["allocated_acres"] / max(0.01, total_allocated)) for c in allocated_crops]), 2) if total_allocated > 0 else 0.0
        fallow_acres = round(max(0.0, total_land_acres - total_allocated), 2)

        return {
            "status": "success",
            "solver_status": "Optimal (HiGHS)" if res.success else "Fallback Greedy",
            "allocated_crops": allocated_crops,
            "all_candidate_evaluations": processed_candidates,
            "budget_constrained": budget_constrained,
            "all_negative_profits": all_negative_profits,
            "farm_totals": {
                "total_land_acres": total_land_acres,
                "total_allocated_acres": total_allocated,
                "fallow_acres": fallow_acres,
                "total_investment_inr": total_invested,
                "total_expected_revenue_inr": total_revenue,
                "total_expected_net_profit_inr": total_net_profit,
                "expected_farm_roi_pct": farm_roi,
                "weighted_risk_score": avg_risk
            }
        }
