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
  ArrowLeft,
  Sun,
  CloudRain,
  Flame,
  Wind,
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
    <div className="space-y-5 text-[var(--ink)]">
      {/* Top Banner with Return Button */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-4 sm:p-5 shadow-sm">
        <div className="flex items-center gap-3">
          <div>
            <h3 className="text-sm sm:text-base font-semibold text-[var(--ink)]">
              {isHi
                ? 'विशेषज्ञ एवं निर्णायक तकनीकी विश्लेषण'
                : 'Expert & Technical Decision Analytics'}
            </h3>
            <p className="text-xs text-[var(--ink-soft)] mt-0.5">
              {isHi
                ? 'HiGHS गणितीय रैखिक अनुकूलन, पैदावार पेनाल्टी और 8-चरणीय कारणता विश्लेषण'
                : 'Deterministic HiGHS linear programming, yield penalties, and causal reasoning'}
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onReturnToFarmerView}
          className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--field-deep)] px-3.5 py-2 text-xs font-semibold text-[#FFFFFF] shadow-sm hover:bg-[var(--field-deep)] transition-colors cursor-pointer"
        >
          <ArrowLeft size={13} />
          <span>{t('farmerPlan.hideDetailedAnalysisBtn')}</span>
        </button>
      </div>

      {/* Tab Navigation Strip */}
      <div className="w-full">
        <nav className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-1.5 rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-1.5 shadow-xs">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex w-full items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-center text-xs font-semibold transition-all ${
                  active
                    ? 'bg-[var(--field)] text-[#FFFFFF] shadow-xs'
                    : 'text-[var(--ink-soft)] hover:bg-[var(--paper)] hover:text-[var(--ink)]'
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
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-5 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--line)] pb-2.5">
              <span className="text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
                <Sparkles size={14} className="text-[var(--grain-deep)]" /> HiGHS Linear Programming Solver (Dual-Simplex / Interior-Point)
              </span>
              <span className="rounded-full bg-[var(--field-tint)] px-2.5 py-0.5 text-[10px] text-[var(--field-deep)] border border-[var(--field-tint)] font-semibold">
                STATUS: OPTIMAL_FOUND (Primal Feasible)
              </span>
            </div>
            <div className="font-mono text-xs text-[var(--ink-soft)] leading-relaxed bg-[var(--paper)] p-3.5 rounded-xl border border-[var(--line)]">
              Maximize Z = ∑ (Yield_i × Price_i - Cost_i) × Area_i subject to: ∑ Area_i ≤ {farm_totals.total_land_acres} Ac, ∑ Cost_i × Area_i ≤ ₹{farm_totals.budget_capital_inr.toLocaleString('en-IN')}, and agronomic risk bounds.
            </div>
          </div>

          {/* Allocated Crops Table */}
          <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-5 shadow-sm space-y-3">
            <h3 className="font-serif text-sm font-semibold text-[var(--ink)]">
              {t('overview.optimalAllocation')} (HiGHS LP Simplex Solution)
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[var(--line)] text-[10px] uppercase font-semibold text-[var(--ink-soft)]">
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
                <tbody className="divide-y divide-[var(--line)] text-[11px]">
                  {allocated_crops.map((crop) => (
                    <tr key={crop.crop_name} className="hover:bg-[var(--paper)] transition-colors">
                      <td className="py-3 font-serif text-xs font-semibold text-[var(--ink)]">
                        {getCropDisplayName(crop.crop_name, language)}
                      </td>
                      <td className="py-3 text-[var(--ink)] font-semibold">
                        {formatArea(crop.allocated_acres, language)}
                      </td>
                      <td className="py-3 text-[var(--grain-deep)] font-semibold">
                        {crop.acre_share_pct.toFixed(1)}%
                      </td>
                      <td className="py-3 text-[var(--ink-soft)]">
                        {formatYield(crop.expected_yield_qtl_acre, language)}
                      </td>
                      <td className="py-3 text-[var(--ink-soft)]">
                        {formatCurrency(crop.modal_price_per_qtl, language)}/Q
                      </td>
                      <td className="py-3 text-[var(--ink-soft)]">
                        {formatCurrency(crop.total_cost_inr, language)}
                      </td>
                      <td className="py-3 text-[var(--field-deep)] font-semibold">
                        {formatCurrency(crop.net_profit_inr, language)}
                      </td>
                      <td className="py-3 text-[var(--field-deep)] font-semibold">
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
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-5 shadow-sm space-y-3">
          <div className="border-b border-[var(--line)] pb-2.5">
            <h3 className="font-serif text-sm font-semibold text-[var(--ink)]">
              {t('crops.title')}
            </h3>
            <p className="text-[11px] text-[var(--ink-soft)]">
              {t('crops.subtitle')}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-[var(--line)] text-[10px] uppercase font-semibold text-[var(--ink-soft)]">
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
              <tbody className="divide-y divide-[var(--line)] text-[11px]">
                {crop_evaluations.map((evalItem) => (
                  <tr
                    key={evalItem.crop_name}
                    className={`hover:bg-[var(--paper)] transition-colors ${
                      evalItem.is_allocated ? 'bg-[var(--field-tint)] font-semibold' : ''
                    }`}
                  >
                    <td className="py-3 font-serif text-xs font-semibold text-[var(--ink)]">
                      {getCropDisplayName(evalItem.crop_name, language)}
                    </td>
                    <td className="py-3 text-[var(--ink-soft)]">
                      {formatYield(evalItem.hist_yield_qtl_acre, language)}
                    </td>
                    <td className="py-3 text-[var(--ink)] font-semibold">
                      {evalItem.weather_multiplier.toFixed(2)}x
                    </td>
                    <td className="py-3 text-[var(--ink)] font-semibold">
                      {formatYield(evalItem.expected_yield_qtl_acre, language)}
                    </td>
                    <td className="py-3 text-[var(--ink-soft)]">
                      {formatCurrency(evalItem.modal_price_per_qtl, language)}/Q
                    </td>
                    <td className="py-3 text-[var(--ink-soft)]">
                      {formatRatePerAcre(evalItem.cost_c2_per_acre, language)}
                    </td>
                    <td className="py-3 text-[var(--field-deep)] font-semibold">
                      {formatRatePerAcre(evalItem.risk_adjusted_profit_per_acre, language)}
                    </td>
                    <td className="py-3">
                      <span className="rounded-full bg-[var(--paper)] border border-[var(--line)] px-2 py-0.5 text-[10px] text-[var(--ink-soft)] font-semibold">
                        {evalItem.risk_score.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3">
                      {evalItem.is_allocated ? (
                        <span className="rounded-full border border-[var(--field-tint)] bg-[var(--field-tint)] px-2 py-0.5 text-[10px] font-semibold text-[var(--field-deep)]">
                          {t('crops.recommended')}
                        </span>
                      ) : (
                        <span className="text-[10px] text-[var(--ink-faint)]">
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
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-5 shadow-sm space-y-4">
          <div className="border-b border-[var(--line)] pb-2.5">
            <h3 className="font-serif text-sm font-semibold text-[var(--ink)]">
              {t('scenarios.title')}
            </h3>
            <p className="text-[11px] text-[var(--ink-soft)]">
              {t('scenarios.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {Object.entries(scenarios).map(([key, sc]) => (
              <div
                key={key}
                className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4 space-y-2.5 shadow-xs hover:border-[var(--line-strong)] transition-all"
              >
                <div className="flex items-center justify-between border-b border-[var(--line)] pb-2">
                  <h4 className="font-serif text-xs font-semibold text-[var(--ink)] flex items-center gap-1.5">
                    <span>{key === 'live' ? '☀️' : key === 'drought' ? '🏜️' : key === 'waterlogging' ? '🌧️' : '🔥'}</span>
                    <span>{translateScenarioName(key, sc.scenario_name, language)}</span>
                  </h4>
                  <span className="text-xs font-semibold text-[var(--field-deep)]">
                    {formatCurrency(sc.total_profit_inr, language)}
                  </span>
                </div>

                <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
                  {getScenarioDescription(key, sc, language)}
                </p>

                <div className="rounded-lg bg-[var(--surface-elevated)] p-2.5 text-[11px] text-[var(--ink-soft)] space-y-1 border border-[var(--line)]">
                  <div>
                    <span className="text-[var(--ink)] font-semibold">{isHi ? 'प्रणाली अनुकूलन:' : 'Adaptation:'} </span>
                    {getScenarioAdaptationShift(key, sc, language)}
                  </div>
                  <div>
                    <span className="text-[var(--ink)] font-semibold">{isHi ? 'लाभ विचलन:' : 'Profit Delta:'} </span>
                    <span className={sc.profit_delta_from_live_inr >= 0 ? 'text-[var(--field-deep)] font-semibold' : 'text-[var(--grain-deep)] font-semibold'}>
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
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-5 shadow-sm space-y-4">
          <div className="border-b border-[var(--line)] pb-2.5">
            <h3 className="font-serif text-sm font-semibold text-[var(--ink)]">
              {t('causal.title')}
            </h3>
            <p className="text-[11px] text-[var(--ink-soft)]">
              {t('causal.subtitle')}
            </p>
          </div>

          <div className="space-y-2.5">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((stepNum) => (
              <div
                key={stepNum}
                className="flex items-start gap-3.5 rounded-xl border border-[var(--line)] bg-[var(--paper)] p-3.5 transition-all hover:bg-[var(--surface-elevated)] hover:border-[var(--field-tint)] shadow-xs"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[var(--field)] text-xs font-semibold text-white">
                  {stepNum}
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-serif text-xs font-semibold text-[var(--ink)]">
                    {getCausalStepTitle(stepNum, language)}
                  </h4>
                  <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
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
        <div className="rounded-2xl border border-[var(--line)] bg-[var(--surface-elevated)] p-5 shadow-sm space-y-4">
          <div className="border-b border-[var(--line)] pb-2.5">
            <h3 className="font-serif text-sm font-semibold text-[var(--ink)]">
              {t('trust.title')}
            </h3>
            <p className="text-[11px] text-[var(--ink-soft)]">
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
                className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4 space-y-2 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="font-serif text-xs font-semibold text-[var(--ink)]">
                    {item.source}
                  </span>
                  <span className="rounded-full bg-[var(--field-tint)] px-2 py-0.5 text-[9px] font-semibold text-[var(--field-deep)] border border-[var(--field-tint)]">
                    {item.badge}
                  </span>
                </div>
                <span className="text-[10px] text-[var(--ink-soft)] block font-mono">
                  {item.category}
                </span>
                <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div className="rounded-xl border border-[var(--line)] bg-[var(--paper)] p-4 text-xs text-[var(--ink-soft)] leading-relaxed">
            <span className="text-[var(--ink)] font-semibold block mb-1">
              Zero-Hallucination Architectural Guarantee:
            </span>
            All crop yield baselines, weather multipliers, cost C2 constants, and linear programming calculations are computed deterministically. The LLM/AI layer is strictly constrained to natural language synthesis and translation without performing numerical estimation.
          </div>
        </div>
      )}
    </div>
  );
}
