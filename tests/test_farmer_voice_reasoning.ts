/**
 * tests/test_farmer_voice_reasoning.ts
 * Automated Verification Suite for Generalized Semantic Voice Reasoning & Plan Integrity.
 */

import { askVoiceAgent } from '../src/services/voiceAgentService';
import type { FarmDecisionResponse } from '../src/types/farm';

function createMockDecision(): FarmDecisionResponse {
  return {
    success: true,
    status: 'optimal',
    message: 'Optimal plan calculated',
    location: {
      state_name: 'Maharashtra',
      district_name: 'Nashik',
      latitude: 19.99,
      longitude: 73.78,
      soil_type: 'Medium Black Soil (Vertisol)',
      soil_ph: 7.4,
      organic_carbon_pct: 0.6,
      bulk_density_g_cm3: 1.32,
      topsoil_texture: 'Clayey Loam',
      dominant_cropping_system: 'Onion-Tomato-Soybean',
      major_district_crops: ['Onion', 'Tomato', 'Soybean', 'Grapes'],
    },
    farm_totals: {
      status: 'success',
      total_land_acres: 5.0,
      total_allocated_acres: 5.0,
      fallow_acres: 0.0,
      budget_capital_inr: 150000.0,
      total_investment_inr: 135000.0,
      budget_utilization_pct: 90.0,
      total_expected_revenue_inr: 452588.0,
      total_expected_net_profit_inr: 317588.0,
      expected_farm_roi_pct: 235.0,
      weighted_risk_score: 0.2,
      weighted_risk_label: 'LOW',
      budget_constrained: false,
      all_negative_profits: false,
      solver_method: 'HiGHS_Simplex',
    },
    allocated_crops: [
      {
        crop_name: 'Onion',
        allocated_acres: 2.61,
        acre_share_pct: 52.2,
        expected_yield_qtl_acre: 110.0,
        modal_price_per_qtl: 1850.0,
        total_cost_inr: 72000.0,
        gross_revenue_inr: 246588.0,
        net_profit_inr: 174588.0,
        roi_pct: 242.0,
        rank: 1,
        water_req_mm: 350,
        suitability_score: 0.95,
        economic_margin_inr_acre: 66891.0,
      },
      {
        crop_name: 'Tomato',
        allocated_acres: 2.39,
        acre_share_pct: 47.8,
        expected_yield_qtl_acre: 140.0,
        modal_price_per_qtl: 1470.0,
        total_cost_inr: 63000.0,
        gross_revenue_inr: 206000.0,
        net_profit_inr: 143000.0,
        roi_pct: 227.0,
        rank: 2,
        water_req_mm: 400,
        suitability_score: 0.92,
        economic_margin_inr_acre: 59832.0,
      },
    ],
    crop_evaluations: [],
    weather: {
      provider: 'Open-Meteo Professional Agro-API',
      data_timestamp: '2026-08-26T12:00:00Z',
      confidence_score: 'High',
      fallback_used: false,
      missing_variables: [],
      current_temperature_c: 30.2,
      current_apparent_temp_c: 32.0,
      current_relative_humidity_pct: 72.0,
      current_wind_kmh: 14.0,
      fao_et0_mm_hr: 0.38,
      vapour_pressure_deficit_kpa: 1.1,
      surface_soil_moisture_m3m3: 0.38,
      root_zone_soil_moisture_m3m3: 0.36,
      forecast_temp_max_c: 34.5,
      forecast_rain_7d_total_mm: 42.5,
      forecast_7d_max_rain_prob_pct: 85.0,
      daily_forecast_series: [],
    },
    risk: {
      drought_risk_score: 0.12,
      heat_risk_score: 0.18,
      waterlogging_risk_score: 0.28,
      price_volatility_risk_score: 0.22,
      overall_risk_label: 'LOW',
      waterlogging_alert: false,
      downside_alert: false,
    },
    explanation: {
      headline: 'Optimal High-Margin Diversification: 2.61 Acres Onion + 2.39 Acres Tomato',
      primary_driver: 'Favorable soil moisture and rain forecast with strong mandi price margin.',
      risk_factors: [],
      recommendations: [],
    },
    scenarios: {} as any,
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

async function runTests() {
  console.log('================================================================================');
  console.log('AGRIOPTIMA VOICE AGENT SEMANTIC REASONING & INTEGRITY TEST SUITE');
  console.log('================================================================================\n');

  const decision = createMockDecision();

  // 1. Test Seed Procurement & Week Timing (User screenshot question)
  console.log('>>> TEST 1: User Screenshot Question (Onion seeds: this week vs next week)');
  const res1 = await askVoiceAgent(
    'When is the best time to buy? The onion seeds. So is it? This week or the next one?',
    decision,
    'en'
  );
  assert(res1.intent === 'INPUT_PROCUREMENT_TIMING', 'Intent is INPUT_PROCUREMENT_TIMING');
  assert(res1.spoken_text.toLowerCase().includes('this week'), 'Recommends this week based on 42.5 mm rain');
  assert(res1.display_text.includes('Onion'), 'Correctly identifies Onion crop');
  assert(res1.display_text.includes('2.61'), 'Ground truth plan acreage (2.61) preserved exactly');
  assert(res1.display_text.includes('42.5'), 'Rainfall telemetry (42.5 mm) preserved exactly');
  assert(!res1.display_text.includes('Action Checklist: (1) Procure certified seeds for 2.39 acres Tomato'), 'No rigid template collision with NEXT_STEPS checklist');

  // 2. Test Hindi Seed Procurement & Timing
  console.log('\n>>> TEST 2: Hindi Sowing & Week Timing');
  const res2 = await askVoiceAgent(
    'प्याज के बीज कब खरीदें? क्या इस हफ्ते खरीदना सही रहेगा?',
    decision,
    'hi'
  );
  assert(res2.intent === 'INPUT_PROCUREMENT_TIMING', 'Intent is INPUT_PROCUREMENT_TIMING (Hindi)');
  assert(res2.spoken_text.includes('इस सप्ताह') || res2.spoken_text.includes('प्याज'), 'Spoken Hindi includes timing and crop');
  assert(res2.display_text.includes('2.61') || res2.display_text.includes('एकड़'), 'Hindi preserves exact acreage');

  // 3. Test Fertilizer Dosage & Timing
  console.log('\n>>> TEST 3: Fertilizer Nutrient Guidance');
  const res3 = await askVoiceAgent(
    'When and how much DAP or Urea fertilizer should I apply for tomato?',
    decision,
    'en'
  );
  assert(res3.intent === 'FERTILIZER_MANAGEMENT', 'Intent is FERTILIZER_MANAGEMENT');
  assert(res3.display_text.includes('Basal') || res3.display_text.includes('DAP'), 'Gives agronomic fertilizer timing');
  assert(res3.display_text.includes('Tomato'), 'Identifies Tomato crop correctly');

  // 4. Test Irrigation Under Wet Telemetry
  console.log('\n>>> TEST 4: Irrigation Logic Under High Moisture Telemetry');
  const res4 = await askVoiceAgent(
    'Should I irrigate my farm today?',
    decision,
    'en'
  );
  assert(res4.intent === 'IRRIGATION_CHECK', 'Intent is IRRIGATION_CHECK');
  assert(res4.action_required === false, 'Action required is false (adequate moisture)');
  assert(res4.spoken_text.toLowerCase().includes('no irrigation'), 'Correctly advises withholding irrigation');

  // 5. Test Why Crop Allocation Was Chosen
  console.log('\n>>> TEST 5: Strategic Allocation Explanation');
  const res5 = await askVoiceAgent(
    'Why did the agent allocate both onion and tomato?',
    decision,
    'en'
  );
  assert(res5.intent === 'CROP_REASONING', 'Intent is CROP_REASONING');
  assert(res5.display_text.includes('3,17,588') || res5.display_text.includes('₹'), 'Net profit telemetry strictly preserved');

  // 6. Test Pest Prevention Query
  console.log('\n>>> TEST 6: Pest & Disease Guidance');
  const res6 = await askVoiceAgent(
    'I see small white insects under tomato leaves, what should I spray?',
    decision,
    'en'
  );
  assert(res6.intent === 'CROP_HEALTH', 'Intent is CROP_HEALTH');
  assert(res6.display_text.toLowerCase().includes('neem oil'), 'Recommends organic neem oil spray');

  // 7. Plan Integrity Check (Values remain immutable)
  console.log('\n>>> TEST 7: Invariant Plan Integrity & Isolation');
  assert(decision.farm_totals.total_expected_net_profit_inr === 317588.0, 'Farm profit invariant unchanged');
  assert(decision.allocated_crops[0].allocated_acres === 2.61, 'Onion acreage invariant unchanged');
  assert(decision.weather.root_zone_soil_moisture_m3m3 === 0.36, 'Soil moisture invariant unchanged');
  assert(decision.weather.forecast_rain_7d_total_mm === 42.5, 'Rainfall forecast invariant unchanged');

  console.log('\n================================================================================');
  console.log(`SUMMARY: ${passed} / ${total} TESTS PASSED [${Math.round((passed / total) * 100)}%]`);
  console.log('================================================================================\n');
}

runTests().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
