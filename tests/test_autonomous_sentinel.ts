/**
 * tests/test_autonomous_sentinel.ts
 * Comprehensive Automated Verification Suite for AgriOptima Autonomous Sentinel.
 * Tests all 15 state transitions (Tests A through O) + Edge Cases.
 */

import {
  runAutonomousCycle,
  computeStateFingerprint,
  ActionValidator,
  ActionExecutor,
  ExecutionVerifier,
  WHITELISTED_ACTIONS,
} from '../src/services/autonomousSentinel';
import type { FarmDecisionResponse } from '../src/types/farm';
import type { AutonomousAction } from '../src/types/autonomous';

function createMockResponse(overrides: Partial<FarmDecisionResponse> = {}): FarmDecisionResponse {
  return {
    success: true,
    status: 'optimal',
    message: 'Optimal plan found',
    location: {
      state_name: 'Madhya Pradesh',
      district_name: 'Bhopal',
      latitude: 23.25,
      longitude: 77.41,
      soil_type: 'Medium to Deep Black (Vertisols)',
      soil_ph: 7.2,
      organic_carbon_pct: 0.55,
      bulk_density_g_cm3: 1.35,
      topsoil_texture: 'Clay',
      dominant_cropping_system: 'Soybean-Wheat',
      major_district_crops: ['Soybean', 'Wheat', 'Gram (Chickpea)'],
    },
    farm_totals: {
      total_land_acres: 5.0,
      total_allocated_acres: 5.0,
      fallow_acres: 0.0,
      land_utilization_pct: 100.0,
      budget_capital_inr: 100000.0,
      total_production_cost_inr: 75000.0,
      budget_utilized_pct: 75.0,
      budget_headroom_inr: 25000.0,
      budget_constrained: false,
      expected_gross_revenue_inr: 180000.0,
      expected_net_profit_inr: 105000.0,
      overall_farm_roi_pct: 140.0,
    },
    allocated_crops: [
      {
        crop_name: 'Soybean',
        allocated_acres: 3.0,
        acre_share_pct: 60.0,
        expected_yield_qtl_acre: 8.5,
        modal_price_per_qtl: 4200.0,
        total_cost_inr: 45000.0,
        gross_revenue_inr: 107100.0,
        net_profit_inr: 62100.0,
        roi_pct: 138.0,
        rank: 1,
        water_req_mm: 450,
        suitability_score: 0.9,
        economic_margin_inr_acre: 20700.0,
      },
      {
        crop_name: 'Gram (Chickpea)',
        allocated_acres: 2.0,
        acre_share_pct: 40.0,
        expected_yield_qtl_acre: 6.0,
        modal_price_per_qtl: 5100.0,
        total_cost_inr: 30000.0,
        gross_revenue_inr: 61200.0,
        net_profit_inr: 31200.0,
        roi_pct: 104.0,
        rank: 2,
        water_req_mm: 300,
        suitability_score: 0.85,
        economic_margin_inr_acre: 15600.0,
      },
    ],
    crop_evaluations: [],
    weather: {
      provider: 'Open-Meteo Professional Agro-API',
      data_timestamp: '2026-08-23T12:00:00Z',
      confidence_score: 'High',
      fallback_used: false,
      missing_variables: [],
      current_temperature_c: 28.5,
      current_apparent_temp_c: 29.0,
      current_relative_humidity_pct: 65.0,
      current_wind_kmh: 12.0,
      fao_et0_mm_hr: 0.35,
      vapour_pressure_deficit_kpa: 1.2,
      surface_soil_moisture_m3m3: 0.32,
      root_zone_soil_moisture_m3m3: 0.30,
      forecast_temp_max_c: 32.0,
      forecast_rain_7d_total_mm: 15.0,
      forecast_7d_max_rain_prob_pct: 40.0,
      daily_forecast_series: [],
    },
    risk: {
      drought_risk_score: 0.15,
      heat_risk_score: 0.1,
      waterlogging_risk_score: 0.1,
      price_volatility_risk_score: 0.2,
      overall_risk_label: 'LOW',
      waterlogging_alert: false,
      downside_alert: false,
    },
    explanation: {
      headline: 'Optimal Multi-Crop Allocation',
      primary_driver: 'Soil and weather conditions are optimal.',
      risk_factors: [],
      recommendations: [],
    },
    scenarios: {} as any,
    ...overrides,
  };
}

let passed = 0;
let total = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  total++;
  if (condition) {
    passed++;
    console.log(`  [PASS] ${testName}`);
  } else {
    console.error(`  [FAIL] ${testName}${detail ? ` - ${detail}` : ''}`);
    process.exitCode = 1;
  }
}

console.log('================================================================================');
console.log('AGRIOPTIMA AUTONOMOUS SENTINEL - AUTOMATED HARDENING SUITE');
console.log('================================================================================\n');

// -----------------------------------------------------------------------------
// TEST A: Normal Weather Baseline -> Optimal Status Recorded
// -----------------------------------------------------------------------------
console.log('>>> TEST A: Normal Weather Baseline');
const normalDecision = createMockResponse();
const resA = runAutonomousCycle(normalDecision, 'en');
assert(resA.log.action_type === 'RECORD_OPTIMAL_STATUS', 'TEST A.1: Action is RECORD_OPTIMAL_STATUS');
assert(resA.log.verification_status === 'VERIFIED', 'TEST A.2: Verification status is VERIFIED');
assert(resA.advisory === null, 'TEST A.3: No disruptive advisory generated for optimal conditions');

// -----------------------------------------------------------------------------
// TEST B: Normal -> Severe Drought Transition
// -----------------------------------------------------------------------------
console.log('\n>>> TEST B: Transition to Severe Drought');
const droughtDecision = createMockResponse({
  weather: {
    ...normalDecision.weather,
    root_zone_soil_moisture_m3m3: 0.16,
    surface_soil_moisture_m3m3: 0.14,
    forecast_rain_7d_total_mm: 1.0,
  },
  risk: {
    ...normalDecision.risk,
    drought_risk_score: 0.85,
    overall_risk_label: 'HIGH',
  },
});
const resB = runAutonomousCycle(droughtDecision, 'en');
assert(resB.log.action_type === 'APPLY_PROACTIVE_ADVISORY', 'TEST B.1: Action is APPLY_PROACTIVE_ADVISORY');
assert(resB.advisory !== null, 'TEST B.2: Advisory generated');
assert(resB.advisory?.headline.includes('Irrigation'), 'TEST B.3: Generates Evening Pulse Irrigation directive');
assert(resB.log.verification_status === 'VERIFIED', 'TEST B.4: Verification is VERIFIED');

// -----------------------------------------------------------------------------
// TEST C: Duplicate Severe Drought Telemetry -> No Duplicate Advisory
// -----------------------------------------------------------------------------
console.log('\n>>> TEST C: Duplicate Protection on Identical Telemetry');
const previousState = {
  fingerprint: resB.log.fingerprint,
  activeAdvisory: resB.advisory,
  lastActionType: resB.log.action_type,
};
const resC = runAutonomousCycle(droughtDecision, 'en', previousState);
assert(resC.log.monitoring_status === 'CONDITION_UNCHANGED', 'TEST C.1: Status is CONDITION_UNCHANGED');
assert(resC.log.state_changed === false, 'TEST C.2: State changed flag is false');
assert(resC.advisory?.id === resB.advisory?.id, 'TEST C.3: Preserves existing advisory ID without generating spam');

// -----------------------------------------------------------------------------
// TEST D: Severe Drought Resolves -> Resolution State Change
// -----------------------------------------------------------------------------
console.log('\n>>> TEST D: Stress Resolution (Drought Normalized)');
const resD = runAutonomousCycle(normalDecision, 'en', previousState);
assert(resD.log.monitoring_status === 'STRESS_RESOLVED', 'TEST D.1: Status is STRESS_RESOLVED');
assert(resD.log.state_changed === true, 'TEST D.2: State changed flag is true');
assert(resD.advisory === null, 'TEST D.3: Previous stress advisory cleared');

// -----------------------------------------------------------------------------
// TEST E: Heavy Rain / Waterlogging Anomaly
// -----------------------------------------------------------------------------
console.log('\n>>> TEST E: Waterlogging Priority Anomaly');
const rainDecision = createMockResponse({
  weather: {
    ...normalDecision.weather,
    root_zone_soil_moisture_m3m3: 0.44,
    forecast_rain_7d_total_mm: 78.0,
  },
  risk: {
    ...normalDecision.risk,
    waterlogging_risk_score: 0.88,
    waterlogging_alert: true,
    overall_risk_label: 'CRITICAL',
  },
});
const resE = runAutonomousCycle(rainDecision, 'en');
assert(resE.log.action_type === 'APPLY_PROACTIVE_ADVISORY', 'TEST E.1: Action is APPLY_PROACTIVE_ADVISORY');
assert(resE.advisory?.headline.includes('Drainage'), 'TEST E.2: Drainage directive generated');
assert(resE.advisory?.severity === 'critical', 'TEST E.3: Severity marked critical');

// -----------------------------------------------------------------------------
// TEST F: Severe Heat Wave
// -----------------------------------------------------------------------------
console.log('\n>>> TEST F: Severe Heat Wave Mitigation');
const heatDecision = createMockResponse({
  weather: {
    ...normalDecision.weather,
    forecast_temp_max_c: 41.5,
    current_temperature_c: 40.0,
  },
  risk: {
    ...normalDecision.risk,
    heat_risk_score: 0.82,
    overall_risk_label: 'HIGH',
  },
});
const resF = runAutonomousCycle(heatDecision, 'en');
assert(resF.log.action_type === 'APPLY_PROACTIVE_ADVISORY', 'TEST F.1: Action is APPLY_PROACTIVE_ADVISORY');
assert(resF.advisory?.headline.includes('Heat'), 'TEST F.2: Heat mitigation directive generated');

// -----------------------------------------------------------------------------
// TEST G: Simultaneous Multi-Risk -> Deterministic Hierarchy
// -----------------------------------------------------------------------------
console.log('\n>>> TEST G: Simultaneous Multi-Risk Conflict Resolution');
const multiRiskDecision = createMockResponse({
  weather: {
    ...normalDecision.weather,
    root_zone_soil_moisture_m3m3: 0.18,
    forecast_rain_7d_total_mm: 65.0,
    forecast_temp_max_c: 40.0,
  },
  risk: {
    ...normalDecision.risk,
    waterlogging_risk_score: 0.85,
    drought_risk_score: 0.55,
    heat_risk_score: 0.60,
    overall_risk_label: 'CRITICAL',
  },
});
const resG = runAutonomousCycle(multiRiskDecision, 'en');
// Waterlogging is Priority 1 over Drought and Heat
assert(resG.advisory?.headline.includes('Drainage'), 'TEST G.1: Waterlogging prioritized over drought/heat');
assert(resG.log.reason.includes('Drainage management takes precedence'), 'TEST G.2: Causal explanation details precedence');

// -----------------------------------------------------------------------------
// TEST H: Missing Soil Moisture Telemetry -> Irrigation Withheld
// -----------------------------------------------------------------------------
console.log('\n>>> TEST H: Missing Soil Moisture Telemetry');
const missingMoistureDecision = createMockResponse({
  weather: {
    ...normalDecision.weather,
    root_zone_soil_moisture_m3m3: null,
    surface_soil_moisture_m3m3: null,
    forecast_rain_7d_total_mm: null,
    fallback_used: true,
    missing_variables: ['root_zone_soil_moisture_m3m3', 'forecast_rain_7d_total_mm'],
  },
});
const resH = runAutonomousCycle(missingMoistureDecision, 'en');
assert(resH.log.monitoring_status === 'DEGRADED_TELEMETRY', 'TEST H.1: Status is DEGRADED_TELEMETRY');
assert(resH.log.reason.includes('safely withheld'), 'TEST H.2: Action safely withheld due to missing telemetry');

// -----------------------------------------------------------------------------
// TEST I: Missing Forecast Telemetry -> Forecast Action Withheld
// -----------------------------------------------------------------------------
console.log('\n>>> TEST I: Missing 7-Day Forecast Telemetry');
assert(resH.log.telemetry.forecast_rain_7d_mm === null, 'TEST I.1: Forecast preserved strictly as null without fabrication');

// -----------------------------------------------------------------------------
// TEST J: Unsafe Action Request -> ActionValidator Rejection
// -----------------------------------------------------------------------------
console.log('\n>>> TEST J: ActionValidator Hard Security Boundary');
const validationSafe = ActionValidator.validate('APPLY_PROACTIVE_ADVISORY');
assert(validationSafe.is_approved === true, 'TEST J.1: Whitelisted action approved');
assert(validationSafe.security_clearance === 'WHITELISTED_SAFE', 'TEST J.2: Clearance is WHITELISTED_SAFE');

const validationUnsafe1 = ActionValidator.validate('PURCHASE_PESTICIDES_CHEMICALS');
assert(validationUnsafe1.is_approved === false, 'TEST J.3: Chemical purchase blocked');
assert(validationUnsafe1.security_clearance === 'REJECTED_UNSAFE', 'TEST J.4: Clearance is REJECTED_UNSAFE');

const validationUnsafe2 = ActionValidator.validate('TRANSFER_FINANCIAL_FUNDS');
assert(validationUnsafe2.is_approved === false, 'TEST J.5: Financial transaction blocked');

const validationUnsafe3 = ActionValidator.validate('DELETE_FARMER_DATABASE');
assert(validationUnsafe3.is_approved === false, 'TEST J.6: Destructive db operation blocked');

// -----------------------------------------------------------------------------
// TEST K & L: Verification Engine (VERIFIED vs FAILED)
// -----------------------------------------------------------------------------
console.log('\n>>> TEST K & L: Execution Verification Engine');
const validAction: AutonomousAction = {
  action_id: 'ACT-001',
  action_type: 'APPLY_PROACTIVE_ADVISORY',
  title: 'Valid Directive',
  description: 'Irrigate farm',
  target_crops: ['Soybean'],
  priority: 'HIGH',
  is_approved: true,
  validation_reason: 'Approved',
  timestamp: '12:00:00',
};

const validExec = {
  success: true,
  advisory: {
    id: 'ADV-001',
    fingerprint: '1234',
    headline: 'Pulse Irrigation',
    severity: 'warning' as const,
    recommended_action: 'Pulse water in evening',
    crop_impact: 'Soybean',
    source: 'Sentinel',
    timestamp: '12:00:00',
  },
  detail: 'Registered successfully',
};
assert(ExecutionVerifier.verify(validExec, validAction) === true, 'TEST K: Verification returns true on valid state');

const failedExec = {
  success: false,
  advisory: null,
  detail: 'State mutation failed',
};
assert(ExecutionVerifier.verify(failedExec, validAction) === false, 'TEST L: Verification returns false on failed state');

// -----------------------------------------------------------------------------
// TEST M & N: English & Hindi Localization Parity
// -----------------------------------------------------------------------------
console.log('\n>>> TEST M & N: English & Hindi Language Parity');
const resM_En = runAutonomousCycle(droughtDecision, 'en');
assert(resM_En.log.decision.startsWith('Autonomous decision:'), 'TEST M.1: Valid English decision prefix');
assert(resM_En.advisory?.headline === 'Evening Pulse Irrigation Directive', 'TEST M.2: English headline matching');

const resN_Hi = runAutonomousCycle(droughtDecision, 'hi');
assert(resN_Hi.log.decision.startsWith('स्वायत्त निर्णय:'), 'TEST N.1: Valid Hindi decision prefix');
assert(resN_Hi.advisory?.headline === 'शाम की सिंचाई सलाह (स्प्लिट पल्स)', 'TEST N.2: Idiomatic Hindi headline matching');

// -----------------------------------------------------------------------------
// TEST O: Idempotency & Determinism (Same Input -> Same Classification)
// -----------------------------------------------------------------------------
console.log('\n>>> TEST O: Determinism & Idempotency');
const hash1 = computeStateFingerprint(droughtDecision);
const hash2 = computeStateFingerprint(droughtDecision);
assert(hash1 === hash2, 'TEST O.1: Deterministic state hash generation');

const cycle1 = runAutonomousCycle(droughtDecision, 'en');
const cycle2 = runAutonomousCycle(droughtDecision, 'en');
assert(cycle1.log.fingerprint === cycle2.log.fingerprint, 'TEST O.2: Same fingerprint produced');
assert(cycle1.log.action_type === cycle2.log.action_type, 'TEST O.3: Same action type selected');
assert(cycle1.advisory?.headline === cycle2.advisory?.headline, 'TEST O.4: Same advisory title generated');

console.log('\n================================================================================');
console.log(`SUMMARY: ${passed} / ${total} TESTS PASSED [${Math.round((passed / total) * 100)}%]`);
console.log('================================================================================\n');

if (passed !== total) {
  process.exit(1);
}
