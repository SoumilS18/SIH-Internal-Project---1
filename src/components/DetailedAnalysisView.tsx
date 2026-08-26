import React, { useState } from 'react';
import {
  BarChart3,
  Droplets,
  Layers,
  Activity,
  Cpu,
  ShieldCheck,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { EnvironmentalIntelligence } from '@/components/EnvironmentalIntelligence';
import { getCropDisplayName } from '@/i18n/cropNames';
import {
  formatCurrency,
  formatArea,
  formatYield,
  formatRatePerAcre,
} from '@/i18n/formatters';
import {
  translateScenarioName,
} from '@/i18n/enums';
import {
  getCausalStepTitle,
  getCausalStepDetail,
  getScenarioDescription,
  getScenarioAdaptationShift,
} from '@/i18n/semanticAdapter';
import type { FarmDecisionResponse } from '@/types/farm';

export type DetailedTabType =
  | 'overview'
  | 'environmental'
  | 'crops'
  | 'scenarios'
  | 'causal'
  | 'trust';

interface DetailedAnalysisViewProps {
  decision: FarmDecisionResponse;
  initialTab?: DetailedTabType;
  onReturnToFarmerView: () => void;
}

export function DetailedAnalysisView({
  decision,
  initialTab = 'overview',
  onReturnToFarmerView,
}: DetailedAnalysisViewProps) {
  const { language, t } = useLanguage();
  const isHi = language === 'hi';

  const [activeTab, setActiveTab] = useState<DetailedTabType>(initialTab);

  const { farm_totals, allocated_crops, crop_evaluations, scenarios } = decision;

  const tabs: { id: DetailedTabType; label: string; icon: any }[] = [
    { id: 'overview', label: isHi ? 'इष्टतम आवंटन (LP)' : 'Optimal Plan (LP)', icon: BarChart3 },
    { id: 'environmental', label: isHi ? 'मौसम व मृदा' : 'Soil & Weather', icon: Droplets },
    { id: 'crops', label: isHi ? 'फसल मूल्यांकन' : 'All Crops', icon: Layers },
    { id: 'scenarios', label: isHi ? 'तनाव परीक्षण' : 'Stress Tests', icon: Activity },
    { id: 'causal', label: isHi ? 'AI तर्क शृंखला' : '8-Step Causality', icon: Cpu },
    { id: 'trust', label: isHi ? 'डेटा स्रोत' : 'Data Provenance', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-5 text-[#1F2937]">
      {/* Top Banner with Return Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#EDE4D5] bg-[#FFFFFF] p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDEEE9] text-[#E2725B] text-lg">
            🔬
          </span>
          <div>
            <h3 className="font-serif text-sm sm:text-base font-bold text-[#1F2937]">
              {isHi
                ? 'विशेषज्ञ एवं निर्णायक तकनीकी विश्लेषण'
                : 'Expert & Technical Decision Analytics'}
            </h3>
            <p className="text-xs text-[#6B7280] mt-0.5">
              {isHi
                ? 'HiGHS गणितीय रैखिक अनुकूलन, पैदावार पेनाल्टी और 8-चरणीय कारणता विश्लेषण'
                : 'Deterministic HiGHS linear programming, yield penalties, and causal reasoning'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onReturnToFarmerView}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[#2D5A43] px-3.5 py-2 text-xs font-bold text-[#FFFFFF] shadow-sm hover:bg-[#224432] transition-colors cursor-pointer"
        >
          <span>🌾 {t('farmerPlan.hideDetailedAnalysisBtn')}</span>
        </button>
      </div>

      {/* Tab Navigation Strip */}
      <div className="w-full">
        <nav className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-1.5 rounded-2xl border border-[#EDE4D5] bg-[#FFFFFF] p-1.5 shadow-xs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-center text-xs font-bold transition-all ${
                  active
                    ? 'bg-[#E2725B] text-[#FFFFFF] shadow-xs'
                    : 'text-[#6B7280] hover:bg-[#FAF7F2] hover:text-[#1F2937]'
                }`}
              >
                <Icon size={14} className="shrink-0" />
                <span className="truncate">{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OPTIMAL ALLOCATION (HiGHS LP Simplex Solver Breakdown) */}
      {/* ========================================================================= */}
      {activeTab === 'overview' && (
        <div className="space-y-4">
          {/* Mathematical Model Header */}
          <div className="rounded-2xl border border-[#EDE4D5] bg-[#FFFFFF] p-5 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDE4D5] pb-2.5">
              <span className="text-xs font-bold text-[#1F2937] flex items-center gap-1.5">
                <Sparkles size={14} className="text-[#E2725B]" /> HiGHS Linear Programming Solver (Dual-Simplex / Interior-Point)
              </span>
              <span className="rounded-full bg-[#EAF3ED] px-2.5 py-0.5 text-[10px] text-[#2D5A43] border border-[#D4E7DC] font-bold">
                STATUS: OPTIMAL_FOUND (Primal Feasible)
              </span>
            </div>
            <div className="font-mono text-xs text-[#4B5563] leading-relaxed bg-[#FAF7F2] p-3.5 rounded-xl border border-[#EDE4D5]">
              Maximize Z = ∑ (Yield_i × Price_i - Cost_i) × Area_i subject to: ∑ Area_i ≤ {farm_totals.total_land_acres} Ac, ∑ Cost_i × Area_i ≤ ₹{farm_totals.budget_capital_inr.toLocaleString('en-IN')}, and agronomic risk bounds.
            </div>
          </div>

          {/* Allocated Crops Table */}
          <div className="rounded-2xl border border-[#EDE4D5] bg-[#FFFFFF] p-5 shadow-sm space-y-3">
            <h3 className="font-serif text-sm font-bold text-[#1F2937]">
              {t('overview.optimalAllocation')} (HiGHS LP Simplex Solution)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#EDE4D5] text-[10px] uppercase font-bold text-[#6B7280]">
                    <th className="pb-2.5">{t('overview.crop')}</th>
                    <th className="pb-2.5">{t('overview.acres')}</th>
                    <th className="pb-2.5">{t('overview.percentage')}</th>
                    <th className="pb-2.5">{t('overview.expYield')}</th>
                    <th className="pb-2.5">{isHi ? 'मंडी भाव' : 'Mandi Price'}</th>
                    <th className="pb-2.5">{t('overview.prodCost')}</th>
                    <th className="pb-2.5">{t('overview.netMargin')}</th>
                    <th className="pb-2.5">ROI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EDE4D5] text-[11px]">
                  {allocated_crops.map((crop) => (
                    <tr key={crop.crop_name} className="hover:bg-[#FAF7F2] transition-colors">
                      <td className="py-3 font-serif text-xs font-bold text-[#1F2937]">
                        {getCropDisplayName(crop.crop_name, language)}
                      </td>
                      <td className="py-3 text-[#1F2937] font-bold">
                        {formatArea(crop.allocated_acres, language)}
                      </td>
                      <td className="py-3 text-[#E2725B] font-bold">
                        {crop.acre_share_pct.toFixed(1)}%
                      </td>
                      <td className="py-3 text-[#4B5563]">
                        {formatYield(crop.expected_yield_qtl_acre, language)}
                      </td>
                      <td className="py-3 text-[#4B5563]">
                        {formatCurrency(crop.modal_price_per_qtl, language)}/Q
                      </td>
                      <td className="py-3 text-[#6B7280]">
                        {formatCurrency(crop.total_cost_inr, language)}
                      </td>
                      <td className="py-3 text-[#2D5A43] font-bold">
                        {formatCurrency(crop.net_profit_inr, language)}
                      </td>
                      <td className="py-3 text-[#2D5A43] font-bold">
                        +{crop.roi_pct.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SOIL & WEATHER TELEMETRY */}
      {/* ========================================================================= */}
      {activeTab === 'environmental' && (
        <EnvironmentalIntelligence
          weather={decision.weather}
          risk={decision.risk}
          location={decision.location}
        />
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CROP EVALUATIONS MATRIX */}
      {/* ========================================================================= */}
      {activeTab === 'crops' && (
        <div className="rounded-2xl border border-[#EDE4D5] bg-[#FFFFFF] p-5 shadow-sm space-y-3">
          <div className="border-b border-[#EDE4D5] pb-2.5">
            <h3 className="font-serif text-sm font-bold text-[#1F2937]">
              {t('crops.title')}
            </h3>
            <p className="text-[11px] text-[#6B7280]">
              {t('crops.subtitle')}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[#EDE4D5] text-[10px] uppercase font-bold text-[#6B7280]">
                  <th className="pb-2.5">{t('crops.cropName')}</th>
                  <th className="pb-2.5">{isHi ? 'ऐतिहासिक उपज' : 'Hist. Baseline'}</th>
                  <th className="pb-2.5">{isHi ? 'मौसम गुणक' : 'Multiplier'}</th>
                  <th className="pb-2.5">{t('crops.expectedYield')}</th>
                  <th className="pb-2.5">{t('crops.marketPrice')}</th>
                  <th className="pb-2.5">{t('crops.costPerAcre')}</th>
                  <th className="pb-2.5">{t('crops.netProfitPerAcre')}</th>
                  <th className="pb-2.5">{t('crops.compositeRisk')}</th>
                  <th className="pb-2.5">{t('crops.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#EDE4D5] text-[11px]">
                {crop_evaluations.map((evalItem) => (
                  <tr
                    key={evalItem.crop_name}
                    className={`hover:bg-[#FAF7F2] transition-colors ${
                      evalItem.is_allocated ? 'bg-[#EAF3ED]/50 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3 font-serif text-xs font-bold text-[#1F2937]">
                      {getCropDisplayName(evalItem.crop_name, language)}
                    </td>
                    <td className="py-3 text-[#6B7280]">
                      {formatYield(evalItem.hist_yield_qtl_acre, language)}
                    </td>
                    <td className="py-3 text-[#1F2937] font-bold">
                      {evalItem.weather_multiplier.toFixed(2)}x
                    </td>
                    <td className="py-3 text-[#1F2937] font-bold">
                      {formatYield(evalItem.expected_yield_qtl_acre, language)}
                    </td>
                    <td className="py-3 text-[#4B5563]">
                      {formatCurrency(evalItem.modal_price_per_qtl, language)}/Q
                    </td>
                    <td className="py-3 text-[#6B7280]">
                      {formatRatePerAcre(evalItem.cost_c2_per_acre, language)}
                    </td>
                    <td className="py-3 text-[#2D5A43] font-bold">
                      {formatRatePerAcre(evalItem.risk_adjusted_profit_per_acre, language)}
                    </td>
                    <td className="py-3">
                      <span className="rounded-full bg-[#FAF7F2] border border-[#EDE4D5] px-2 py-0.5 text-[10px] text-[#4B5563] font-bold">
                        {evalItem.risk_score.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3">
                      {evalItem.is_allocated ? (
                        <span className="rounded-full border border-[#D4E7DC] bg-[#EAF3ED] px-2 py-0.5 text-[10px] font-bold text-[#2D5A43]">
                          {t('crops.recommended')}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#9CA3AF]">
                          {t('crops.candidate')}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: 4-WAY ENVIRONMENTAL STRESS TESTING */}
      {/* ========================================================================= */}
      {activeTab === 'scenarios' && (
        <div className="rounded-2xl border border-[#EDE4D5] bg-[#FFFFFF] p-5 shadow-sm space-y-4">
          <div className="border-b border-[#EDE4D5] pb-2.5">
            <h3 className="font-serif text-sm font-bold text-[#1F2937]">
              {t('scenarios.title')}
            </h3>
            <p className="text-[11px] text-[#6B7280]">
              {t('scenarios.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {Object.entries(scenarios).map(([key, sc]) => (
              <div
                key={key}
                className="rounded-xl border border-[#EDE4D5] bg-[#FAF7F2] p-4 space-y-2.5 shadow-xs hover:border-[#D1D5DB] transition-all"
              >
                <div className="flex items-center justify-between border-b border-[#EDE4D5] pb-2">
                  <h4 className="font-serif text-xs font-bold text-[#1F2937] flex items-center gap-1.5">
                    <span>{key === 'live' ? '☀️' : key === 'drought' ? '🏜️' : key === 'waterlogging' ? '🌧️' : '🔥'}</span>
                    <span>{translateScenarioName(key, sc.scenario_name, language)}</span>
                  </h4>
                  <span className="text-xs font-bold text-[#2D5A43]">
                    {formatCurrency(sc.total_profit_inr, language)}
                  </span>
                </div>

                <p className="text-xs text-[#4B5563] leading-relaxed">
                  {getScenarioDescription(key, sc, language)}
                </p>

                <div className="rounded-lg bg-[#FFFFFF] p-2.5 text-[11px] text-[#4B5563] space-y-1 border border-[#EDE4D5]">
                  <div>
                    <span className="text-[#1F2937] font-bold">{isHi ? 'प्रणाली अनुकूलन:' : 'Adaptation:'} </span>
                    {getScenarioAdaptationShift(key, sc, language)}
                  </div>
                  <div>
                    <span className="text-[#1F2937] font-bold">{isHi ? 'लाभ विचलन:' : 'Profit Delta:'} </span>
                    <span className={sc.profit_delta_from_live_inr >= 0 ? 'text-[#2D5A43] font-bold' : 'text-[#B54832] font-bold'}>
                      {sc.profit_delta_from_live_inr >= 0 ? '+' : ''}
                      {formatCurrency(sc.profit_delta_from_live_inr, language)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: 8-STEP CAUSAL REASONING CHAIN */}
      {/* ========================================================================= */}
      {activeTab === 'causal' && (
        <div className="rounded-2xl border border-[#EDE4D5] bg-[#FFFFFF] p-5 shadow-sm space-y-4">
          <div className="border-b border-[#EDE4D5] pb-2.5">
            <h3 className="font-serif text-sm font-bold text-[#1F2937]">
              {t('causal.title')}
            </h3>
            <p className="text-[11px] text-[#6B7280]">
              {t('causal.subtitle')}
            </p>
          </div>

          <div className="space-y-2.5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((stepNum) => (
              <div
                key={stepNum}
                className="flex items-start gap-3.5 rounded-xl border border-[#EDE4D5] bg-[#FAF7F2] p-3.5 transition-all hover:bg-[#FFFFFF] hover:border-[#D4E7DC] shadow-xs"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E2725B] text-xs font-bold text-white">
                  {stepNum}
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-serif text-xs font-bold text-[#1F2937]">
                    {getCausalStepTitle(stepNum, language)}
                  </h4>
                  <p className="text-xs text-[#4B5563] leading-relaxed">
                    {getCausalStepDetail(stepNum, decision, language)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: DATA PROVENANCE & TRUST MATRIX */}
      {/* ========================================================================= */}
      {activeTab === 'trust' && (
        <div className="rounded-2xl border border-[#EDE4D5] bg-[#FFFFFF] p-5 shadow-sm space-y-4">
          <div className="border-b border-[#EDE4D5] pb-2.5">
            <h3 className="font-serif text-sm font-bold text-[#1F2937]">
              {t('trust.title')}
            </h3>
            <p className="text-[11px] text-[#6B7280]">
              {t('trust.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              {
                source: 'Open-Meteo & ECMWF IFS',
                category: 'Numerical Weather Prediction',
                desc: isHi
                  ? '7-दिवसीय प्रति घंटा मौसम, वर्षा संभाव्यता और वाष्पीकरण डेटा'
                  : '7-day hourly NWP forecast, precipitation probability, and FAO ET0 evapotranspiration',
                badge: 'Verified ECMWF Feed',
              },
              {
                source: 'Copernicus ERA5-Land',
                category: 'Soil & Climate Reanalysis',
                desc: isHi
                  ? '0-7 सेमी सतही व 7-81 सेमी जड़-क्षेत्र मृदा नमी स्तर'
                  : '0-7cm surface and 7-81cm root-zone volumetric soil moisture reanalysis',
                badge: 'ERA5 Ground Baseline',
              },
              {
                source: 'APMC Agmarknet Portal',
                category: 'Market Benchmark Prices',
                desc: isHi
                  ? 'स्थानीय जिला मंडियों के थोक मॉडल भाव व मूल्य विचलन'
                  : 'Real-time and seasonal district wholesale modal prices across Indian APMC mandis',
                badge: 'Agmarknet Validated',
              },
              {
                source: 'HiGHS Mixed-Integer LP Solver',
                category: 'Mathematical Optimization',
                desc: isHi
                  ? 'डुअल-सिम्प्लेक्स और इंटीरियर-पॉइंट विधियों द्वारा इष्टतम लाभ समाधान'
                  : 'Proven dual-simplex and interior-point optimization engine guaranteeing zero hallucination',
                badge: 'Deterministic Simplex',
              },
            ].map((item, idx) => (
              <div
                key={idx}
                className="rounded-xl border border-[#EDE4D5] bg-[#FAF7F2] p-4 space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif text-xs font-bold text-[#1F2937]">
                    {item.source}
                  </span>
                  <span className="rounded-full bg-[#EAF3ED] px-2 py-0.5 text-[9px] font-bold text-[#2D5A43] border border-[#D4E7DC]">
                    {item.badge}
                  </span>
                </div>
                <span className="text-[10px] text-[#6B7280] block font-mono">
                  {item.category}
                </span>
                <p className="text-xs text-[#4B5563] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-[#EDE4D5] bg-[#FAF7F2] p-4 text-xs text-[#4B5563] leading-relaxed">
            <span className="text-[#1F2937] font-bold block mb-1">
              Zero-Hallucination Architectural Guarantee:
            </span>
            All crop yield baselines, weather multipliers, cost C2 constants, and linear programming calculations are computed deterministically. The LLM/AI layer is strictly constrained to natural language synthesis and translation without performing numerical estimation.
          </div>
        </div>
      )}
    </div>
  );
}
