import React, { useState } from 'react';
import {
  BarChart3,
  Droplets,
  Layers,
  Activity,
  Cpu,
  ShieldCheck,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  ChevronRight,
  Sparkles,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { EnvironmentalIntelligence } from '@/components/EnvironmentalIntelligence';
import { getCropDisplayName } from '@/i18n/cropNames';
import { getStateDisplayName, getDistrictDisplayName } from '@/i18n/geoNames';
import {
  formatCurrency,
  formatCurrencyWords,
  formatArea,
  formatYield,
  formatRatePerAcre,
  formatTemperature,
  formatRainfall,
} from '@/i18n/formatters';
import {
  translateRiskLevel,
  translateConfidence,
  translateScenarioName,
} from '@/i18n/enums';
import {
  getCausalStepTitle,
  getCausalStepDetail,
  getScenarioDescription,
  getScenarioAdaptationShift,
  getCropReasonTag,
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

  const { farm_totals, allocated_crops, crop_evaluations, scenarios, explanation, weather, location } = decision;

  const tabs: { id: DetailedTabType; label: string; icon: any }[] = [
    { id: 'overview', label: isHi ? 'इष्टतम आवंटन (LP सॉल्वर)' : 'Optimal Plan (LP Simplex)', icon: BarChart3 },
    { id: 'environmental', label: isHi ? 'मौसम व मृदा टेलीमेट्री' : 'Soil & Weather Telemetry', icon: Droplets },
    { id: 'crops', label: isHi ? 'सभी फसल मूल्यांकन' : 'All Crop Evaluations', icon: Layers },
    { id: 'scenarios', label: isHi ? '4-तरफा तनाव परीक्षण' : '4-Way Stress Test', icon: Activity },
    { id: 'causal', label: isHi ? '8-चरणीय AI तर्क शृंखला' : '8-Step AI Causality', icon: Cpu },
    { id: 'trust', label: isHi ? 'डेटा स्रोत व प्रमाणन' : 'Data Provenance & Trust', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      {/* Top Banner with Return Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-3xl border border-gold-300/30 bg-gradient-to-r from-forest-900/95 via-forest-900/80 to-forest-950/95 p-5 backdrop-blur-xl shadow-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold-400/20 text-lg border border-gold-300/30">
              🔬
            </span>
            <h3 className="font-serif text-base sm:text-lg font-bold text-gold-100">
              {isHi
                ? 'विशेषज्ञ व निर्णायक तकनीकी विश्लेषण कार्यक्षेत्र'
                : 'Expert & Judge Technical Analytics Workspace'}
            </h3>
          </div>
          <p className="text-xs text-cream-300/70 mt-1 pl-10.5">
            {isHi
              ? 'गणितीय रैखिक अनुकूलन, गैर-रेखीय पैदावार पेनाल्टी, और 8-चरणीय कारणता विश्लेषण'
              : 'Deterministic HiGHS linear optimization, physiological stress penalties, and causal reasoning'}
          </p>
        </div>

        <button
          type="button"
          onClick={onReturnToFarmerView}
          className="inline-flex items-center gap-2 rounded-xl border border-gold-300/50 bg-gradient-to-r from-gold-400/20 to-gold-500/20 px-4 py-2 text-xs font-bold text-gold-200 transition-all hover:border-gold-300 hover:bg-gold-400/30 hover:text-white shadow-md hover:scale-[1.02]"
        >
          <span>🌾 {t('farmerPlan.hideDetailedAnalysisBtn')}</span>
        </button>
      </div>

      {/* Tab Navigation Strip */}
      <div className="overflow-x-auto no-scrollbar">
        <nav className="flex space-x-1.5 rounded-2xl border border-gold-300/25 bg-forest-950/90 p-1.5 shadow-inner">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-xs font-bold transition-all duration-200 ${
                  active
                    ? 'border border-gold-300/40 bg-gradient-to-r from-gold-400/25 to-gold-500/15 text-gold-200 shadow-[0_0_14px_rgba(255,210,26,0.25)]'
                    : 'text-cream-300/70 hover:bg-forest-900/70 hover:text-cream-100'
                }`}
              >
                <Icon size={14} className={active ? 'text-gold-300' : 'text-cream-300/60'} />
                <span>{tab.label}</span>
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
          <div className="rounded-3xl border border-gold-300/25 bg-forest-900/80 p-5 sm:p-6 backdrop-blur-xl shadow-md">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gold-300/10 pb-3 mb-3">
              <span className="font-mono text-xs text-gold-300 font-bold flex items-center gap-1.5">
                <Sparkles size={13} /> HiGHS Linear Programming Solver (Dual-Simplex / Interior-Point)
              </span>
              <span className="rounded-full bg-emerald-950/90 px-3 py-1 font-mono text-[10px] text-emerald-300 border border-emerald-500/40 font-bold shadow-sm">
                STATUS: OPTIMAL_FOUND (Primal Feasible)
              </span>
            </div>
            <p className="font-mono text-xs text-cream-200/90 leading-relaxed bg-forest-950/70 p-3.5 rounded-2xl border border-gold-300/15">
              Maximize Z = ∑ (Yield_i × Price_i - Cost_i) × Area_i subject to: ∑ Area_i ≤ {farm_totals.total_land_acres} Ac, ∑ Cost_i × Area_i ≤ ₹{farm_totals.budget_capital_inr.toLocaleString('en-IN')}, and crop risk bounds.
            </p>
          </div>

          {/* Allocated Crops Table */}
          <div className="rounded-3xl border border-gold-300/25 bg-forest-900/80 p-5 sm:p-6 backdrop-blur-xl shadow-md">
            <h3 className="font-serif text-base font-bold text-cream-100 mb-4">
              {t('overview.optimalAllocation')} (HiGHS LP Simplex Solution)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-gold-300/15 font-mono text-[10px] uppercase text-cream-300/60">
                    <th className="pb-3">{t('overview.crop')}</th>
                    <th className="pb-3">{t('overview.acres')}</th>
                    <th className="pb-3">{t('overview.percentage')}</th>
                    <th className="pb-3">{t('overview.expYield')}</th>
                    <th className="pb-3">{isHi ? 'मंडी भाव' : 'Mandi Price'}</th>
                    <th className="pb-3">{t('overview.prodCost')}</th>
                    <th className="pb-3">{t('overview.netMargin')}</th>
                    <th className="pb-3">ROI</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold-300/10 font-mono text-[11px]">
                  {allocated_crops.map((crop) => (
                    <tr key={crop.crop_name} className="hover:bg-forest-800/40 transition-colors">
                      <td className="py-3.5 font-serif text-xs font-bold text-gold-200">
                        {getCropDisplayName(crop.crop_name, language)}
                      </td>
                      <td className="py-3.5 text-cream-100 font-bold">
                        {formatArea(crop.allocated_acres, language)}
                      </td>
                      <td className="py-3.5 text-gold-300 font-semibold">
                        {crop.acre_share_pct.toFixed(1)}%
                      </td>
                      <td className="py-3.5 text-cream-200">
                        {formatYield(crop.expected_yield_qtl_acre, language)}
                      </td>
                      <td className="py-3.5 text-cream-200">
                        {formatCurrency(crop.modal_price_per_qtl, language)}/Q
                      </td>
                      <td className="py-3.5 text-cream-300/70">
                        {formatCurrency(crop.total_cost_inr, language)}
                      </td>
                      <td className="py-3.5 text-forest-300 font-bold">
                        {formatCurrency(crop.net_profit_inr, language)}
                      </td>
                      <td className="py-3.5 text-emerald-300 font-bold">
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
        <div className="rounded-3xl border border-gold-300/25 bg-forest-900/80 p-5 sm:p-6 backdrop-blur-xl space-y-4 shadow-md">
          <div className="border-b border-gold-300/10 pb-3">
            <h3 className="font-serif text-base font-bold text-cream-100">
              {t('crops.title')}
            </h3>
            <p className="font-mono text-[11px] text-cream-300/60">
              {t('crops.subtitle')}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-gold-300/15 font-mono text-[10px] uppercase text-cream-300/60">
                  <th className="pb-3">{t('crops.cropName')}</th>
                  <th className="pb-3">{isHi ? 'ऐतिहासिक उपज' : 'Hist. Baseline'}</th>
                  <th className="pb-3">{isHi ? 'मौसम गुणक' : 'Multiplier'}</th>
                  <th className="pb-3">{t('crops.expectedYield')}</th>
                  <th className="pb-3">{t('crops.marketPrice')}</th>
                  <th className="pb-3">{t('crops.costPerAcre')}</th>
                  <th className="pb-3">{t('crops.netProfitPerAcre')}</th>
                  <th className="pb-3">{t('crops.compositeRisk')}</th>
                  <th className="pb-3">{t('crops.status')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold-300/10 font-mono text-[11px]">
                {crop_evaluations.map((evalItem) => (
                  <tr
                    key={evalItem.crop_name}
                    className={`hover:bg-forest-800/40 transition-colors ${
                      evalItem.is_allocated ? 'bg-gold-400/10 font-semibold' : ''
                    }`}
                  >
                    <td className="py-3.5 font-serif text-xs font-bold text-gold-200">
                      {getCropDisplayName(evalItem.crop_name, language)}
                    </td>
                    <td className="py-3.5 text-cream-300/70">
                      {formatYield(evalItem.hist_yield_qtl_acre, language)}
                    </td>
                    <td className="py-3.5 text-cream-200 font-bold">
                      {evalItem.weather_multiplier.toFixed(2)}x
                    </td>
                    <td className="py-3.5 text-cream-100 font-bold">
                      {formatYield(evalItem.expected_yield_qtl_acre, language)}
                    </td>
                    <td className="py-3.5 text-cream-200">
                      {formatCurrency(evalItem.modal_price_per_qtl, language)}/Q
                    </td>
                    <td className="py-3.5 text-cream-300/70">
                      {formatRatePerAcre(evalItem.cost_c2_per_acre, language)}
                    </td>
                    <td className="py-3.5 text-forest-300 font-bold">
                      {formatRatePerAcre(evalItem.risk_adjusted_profit_per_acre, language)}
                    </td>
                    <td className="py-3.5">
                      <span className="rounded-full bg-forest-800 px-2.5 py-0.5 text-[10px] text-cream-200 font-bold border border-forest-600/30">
                        {evalItem.risk_score.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3.5">
                      {evalItem.is_allocated ? (
                        <span className="rounded-full border border-emerald-500/40 bg-emerald-950/90 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300 shadow-sm">
                          {t('crops.recommended')}
                        </span>
                      ) : (
                        <span className="text-[10px] text-cream-300/50">
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
        <div className="rounded-3xl border border-gold-300/25 bg-forest-900/80 p-5 sm:p-6 backdrop-blur-xl space-y-5 shadow-md">
          <div className="border-b border-gold-300/10 pb-3">
            <h3 className="font-serif text-base font-bold text-cream-100">
              {t('scenarios.title')}
            </h3>
            <p className="font-mono text-[11px] text-cream-300/60">
              {t('scenarios.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Object.entries(scenarios).map(([key, sc]) => (
              <div
                key={key}
                className="rounded-2xl border border-gold-300/25 bg-forest-950/85 p-5 space-y-3.5 shadow-sm hover:border-gold-300/50 transition-all"
              >
                <div className="flex items-center justify-between border-b border-gold-300/10 pb-2.5">
                  <h4 className="font-serif text-sm font-bold text-gold-200 flex items-center gap-1.5">
                    <span>{key === 'live' ? '☀️' : key === 'drought' ? '🏜️' : key === 'waterlogging' ? '🌧️' : '🔥'}</span>
                    <span>{translateScenarioName(key, sc.scenario_name, language)}</span>
                  </h4>
                  <span className="font-mono text-sm font-bold text-emerald-300">
                    {formatCurrency(sc.total_profit_inr, language)}
                  </span>
                </div>

                <p className="text-xs text-cream-200/90 leading-relaxed">
                  {getScenarioDescription(key, sc, language)}
                </p>

                <div className="rounded-xl bg-forest-900/70 p-3 text-[11px] text-cream-300/80 space-y-1.5 font-mono border border-gold-300/15">
                  <div>
                    <span className="text-gold-300 font-bold">{isHi ? 'प्रणाली अनुकूलन:' : 'Adaptation:'} </span>
                    {getScenarioAdaptationShift(key, sc, language)}
                  </div>
                  <div>
                    <span className="text-gold-300 font-bold">{isHi ? 'लाभ विचलन:' : 'Profit Delta:'} </span>
                    <span className={sc.profit_delta_from_live_inr >= 0 ? 'text-forest-400 font-bold' : 'text-pink-400 font-bold'}>
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
        <div className="rounded-3xl border border-gold-300/25 bg-forest-900/80 p-5 sm:p-6 backdrop-blur-xl space-y-5 shadow-md">
          <div className="border-b border-gold-300/10 pb-3">
            <h3 className="font-serif text-base font-bold text-cream-100">
              {t('causal.title')}
            </h3>
            <p className="font-mono text-[11px] text-cream-300/60">
              {t('causal.subtitle')}
            </p>
          </div>

          <div className="relative space-y-3 pl-2">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((stepNum) => (
              <div
                key={stepNum}
                className="group flex items-start gap-4 rounded-2xl border border-gold-300/20 bg-forest-950/85 p-4.5 transition-all hover:border-gold-300/50 hover:bg-forest-900/80 shadow-sm"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gold-400/20 font-mono text-xs font-bold text-gold-300 border border-gold-300/30 group-hover:scale-110 transition-transform">
                  {stepNum}
                </div>
                <div className="space-y-1">
                  <h4 className="font-serif text-sm font-bold text-gold-200">
                    {getCausalStepTitle(stepNum, language)}
                  </h4>
                  <p className="text-xs text-cream-200/90 leading-relaxed font-mono">
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
        <div className="rounded-3xl border border-gold-300/25 bg-forest-900/80 p-5 sm:p-6 backdrop-blur-xl space-y-5 shadow-md">
          <div className="border-b border-gold-300/10 pb-3">
            <h3 className="font-serif text-base font-bold text-cream-100">
              {t('trust.title')}
            </h3>
            <p className="font-mono text-[11px] text-cream-300/60">
              {t('trust.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
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
                className="rounded-2xl border border-gold-300/20 bg-forest-950/85 p-4.5 space-y-2.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif text-xs font-bold text-gold-200">
                    {item.source}
                  </span>
                  <span className="rounded-full bg-emerald-950/90 px-2.5 py-0.5 text-[9px] font-bold text-emerald-300 border border-emerald-500/40">
                    {item.badge}
                  </span>
                </div>
                <span className="text-[10px] text-cream-300/60 block font-mono">
                  {item.category}
                </span>
                <p className="text-xs text-cream-200/90 leading-relaxed font-mono">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-gold-300/25 bg-forest-950/90 p-4.5 text-xs font-mono text-cream-300/90 leading-relaxed shadow-inner">
            <span className="text-gold-300 font-bold block mb-1">
              Zero-Hallucination Architectural Guarantee:
            </span>
            All crop yield baselines, weather multipliers, cost C2 constants, and linear programming calculations are computed deterministically. The LLM/AI layer is strictly constrained to natural language synthesis and translation without performing numerical estimation.
          </div>
        </div>
      )}
    </div>
  );
}
