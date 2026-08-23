import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Coins,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Lightbulb,
  ArrowRight,
  Droplets,
  Sun,
  Activity,
  AlertTriangle,
  Flame,
  CloudRain,
  CheckCircle2,
  Calendar,
  Check,
  Zap,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { getCropDisplayName } from '@/i18n/cropNames';
import { getStateDisplayName, getDistrictDisplayName } from '@/i18n/geoNames';
import {
  formatCurrency,
  formatCurrencyWords,
  formatArea,
  formatYield,
} from '@/i18n/formatters';
import {
  translateRiskLevel,
  translateScenarioName,
} from '@/i18n/enums';
import {
  getFarmerWhyCards,
  getFarmerNextActionSteps,
  getFarmerRiskPlainDescription,
  getFarmerRecommendationHeadline,
} from '@/i18n/semanticAdapter';
import type { FarmDecisionResponse } from '@/types/farm';
import type { ProactiveAdvisory } from '@/types/autonomous';

interface FarmerSimpleViewProps {
  decision: FarmDecisionResponse;
  advisory?: ProactiveAdvisory | null;
  onOpenDetailedAnalysis: () => void;
  onSelectTab?: (tabId: string) => void;
}

// Crop icon mapper for friendly visual representation
function getCropIcon(cropName: string): string {
  const c = cropName.toLowerCase();
  if (c.includes('sugarcane') || c.includes('गन्ना')) return '🎋';
  if (c.includes('rice') || c.includes('paddy') || c.includes('चावल') || c.includes('धान')) return '🌾';
  if (c.includes('wheat') || c.includes('गेहूँ')) return '🌾';
  if (c.includes('maize') || c.includes('corn') || c.includes('मक्का')) return '🌽';
  if (c.includes('cotton') || c.includes('कपास')) return '☁️';
  if (c.includes('soyabean') || c.includes('soybean') || c.includes('सोयाबीन')) return '🫘';
  if (c.includes('pigeonpea') || c.includes('arhar') || c.includes('tur') || c.includes('अरहर')) return '🌿';
  if (c.includes('gram') || c.includes('chana') || c.includes('चना')) return '🌱';
  if (c.includes('mustard') || c.includes('सरसों')) return '🌼';
  if (c.includes('groundnut') || c.includes('peanut') || c.includes('मूंगफली')) return '🥜';
  if (c.includes('potato') || c.includes('आलू')) return '🥔';
  if (c.includes('onion') || c.includes('प्याज')) return '🧅';
  if (c.includes('sunflower') || c.includes('सूरजमुखी')) return '🌻';
  if (c.includes('mung') || c.includes('moong') || c.includes('मूंग')) return '🌱';
  if (c.includes('urad') || c.includes('उड़द')) return '🌿';
  return '🌱';
}

export function FarmerSimpleView({
  decision,
  advisory,
  onOpenDetailedAnalysis,
  onSelectTab,
}: FarmerSimpleViewProps) {
  const { language, t } = useLanguage();
  const isHi = language === 'hi';

  const [showWhyExpanded, setShowWhyExpanded] = useState<boolean>(true);
  const [showNextSteps, setShowNextSteps] = useState<boolean>(true);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});

  const { farm_totals, allocated_crops, location, scenarios } = decision;

  const whyCards = getFarmerWhyCards(decision, language);
  const nextSteps = getFarmerNextActionSteps(decision, language);
  const riskPlainDesc = getFarmerRiskPlainDescription(decision, language);
  const recHeadline = getFarmerRecommendationHeadline(decision, language);

  const riskLabel = farm_totals.weighted_risk_label?.toUpperCase() || 'LOW';

  const toggleStep = (stepNum: number) => {
    setCompletedSteps((prev) => ({
      ...prev,
      [stepNum]: !prev[stepNum],
    }));
  };

  // Palette for visual allocation strip
  const barColors = [
    'bg-gradient-to-r from-gold-400 to-gold-500',
    'bg-gradient-to-r from-emerald-400 to-emerald-500',
    'bg-gradient-to-r from-teal-400 to-teal-500',
    'bg-gradient-to-r from-amber-400 to-amber-500',
  ];

  return (
    <div className="space-y-6">
      {/* ========================================================================= */}
      {/* LEVEL 1: HERO RECOMMENDATION CENTERPIECE CARD */}
      {/* ========================================================================= */}
      <div className="relative overflow-hidden rounded-3xl border-2 border-gold-300/40 bg-gradient-to-b from-forest-900/95 via-forest-900/85 to-forest-950/95 p-5 sm:p-7 backdrop-blur-xl shadow-[0_16px_48px_rgba(0,0,0,0.4)] transition-all">
        {/* Subtle decorative glow */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gold-400/15 blur-3xl" />
        <div className="pointer-events-none absolute -left-20 -bottom-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-3xl" />

        {/* Card Header: Location and Title */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gold-300/15 pb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-gold-400/30 to-gold-500/10 text-2xl shadow-inner border border-gold-300/30">
              🌾
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-gold-300 font-bold">
                  {t('farmerPlan.bestChoiceForFarm')}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-forest-800/80 px-2 py-0.5 text-[9px] font-medium text-emerald-300 border border-emerald-500/30">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                  <span>{isHi ? 'लाइव टेलीमेट्री' : 'Live Synced'}</span>
                </span>
              </div>
              <h2 className="font-serif text-lg sm:text-2xl font-bold text-cream-100 tracking-tight">
                {t('farmerPlan.title')}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/40 bg-emerald-950/90 px-3.5 py-1.5 text-xs font-bold text-emerald-300 shadow-sm">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <span>{isHi ? 'सर्वोत्तम AI योजना' : 'AI-Optimized Plan'}</span>
            </span>
          </div>
        </div>

        {/* Dynamic Farmer Headline Banner */}
        <div className="mt-4 rounded-2xl border border-gold-300/25 bg-forest-950/85 p-4 flex items-start gap-3 shadow-inner">
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-xl bg-gold-400/20 text-gold-300 mt-0.5">
            <Sparkles size={16} />
          </div>
          <p className="text-xs sm:text-sm text-cream-100 font-medium leading-relaxed">
            {recHeadline}
          </p>
        </div>

        {/* 1. WHAT SHOULD I GROW & HOW MUCH? (Crop Cards Grid) */}
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-gold-200 flex items-center gap-1.5">
              <span>🌱</span> {t('farmerPlan.recommendationLead')}
            </span>
            <span className="rounded-full bg-forest-950/80 px-2.5 py-0.5 font-mono text-[11px] text-cream-200 border border-gold-300/20 font-bold">
              {formatArea(farm_totals.total_allocated_acres, language)} / {formatArea(farm_totals.total_land_acres, language)}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2">
            {allocated_crops.map((crop, idx) => (
              <div
                key={crop.crop_name}
                className="group relative flex items-center justify-between rounded-2xl border border-gold-300/30 bg-forest-950/90 p-4 sm:p-4.5 transition-all duration-300 hover:border-gold-300/70 hover:bg-forest-900/90 shadow-md hover:-translate-y-0.5"
              >
                <div className="flex items-center gap-3.5">
                  <span className="flex h-12 w-12 sm:h-14 sm:w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-forest-900 to-forest-950 text-3xl sm:text-4xl group-hover:scale-110 transition-transform duration-300 border border-gold-300/20 shadow-inner">
                    {getCropIcon(crop.crop_name)}
                  </span>
                  <div>
                    <h3 className="font-serif text-base sm:text-lg font-bold text-cream-100 group-hover:text-gold-200 transition-colors">
                      {getCropDisplayName(crop.crop_name, language)}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="font-mono text-sm sm:text-base font-bold text-gold-300">
                        {formatArea(crop.allocated_acres, language)}
                      </span>
                      <span className="rounded-full bg-forest-800/90 px-2 py-0.5 text-[10px] text-cream-200 font-semibold border border-forest-600/30">
                        {crop.acre_share_pct.toFixed(0)}% {t('farmerPlan.allocatedShare')}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right pl-2 border-l border-gold-300/10">
                  <span className="text-[10px] uppercase tracking-wider text-cream-300/60 block font-medium">
                    {isHi ? 'अनुमानित उपज' : 'Exp. Yield'}
                  </span>
                  <span className="font-mono text-xs font-bold text-cream-100 block mt-0.5">
                    {formatYield(crop.expected_yield_qtl_acre, language)}
                  </span>
                  <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-950/80 px-2 py-0.5 text-[10px] text-emerald-300 font-bold border border-emerald-500/30 mt-1">
                    +{crop.roi_pct.toFixed(0)}% ROI
                  </span>
                </div>
              </div>
            ))}

            {/* Fallow land notice if budget constrained */}
            {farm_totals.fallow_acres > 0 && (
              <div className="flex items-center justify-between rounded-2xl border border-dashed border-gold-300/30 bg-forest-950/60 p-4">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">🛡️</span>
                  <div>
                    <h3 className="font-serif text-sm font-bold text-cream-200">
                      {isHi ? 'परती भूमि (सुरक्षित रखी गई)' : 'Uncultivated Land (Capital Safety)'}
                    </h3>
                    <p className="text-xs text-cream-300/70">
                      {formatArea(farm_totals.fallow_acres, language)} ({((farm_totals.fallow_acres / farm_totals.total_land_acres) * 100).toFixed(0)}%)
                    </p>
                  </div>
                </div>
                <span className="text-[10px] text-gold-300/90 font-bold max-w-[110px] text-right">
                  {isHi ? 'पूंजी सुरक्षा' : 'Risk Hedge'}
                </span>
              </div>
            )}
          </div>

          {/* Visual Acreage Proportion Strip */}
          <div className="pt-2">
            <div className="flex h-4 w-full overflow-hidden rounded-full bg-forest-950 p-0.5 border border-gold-300/25 shadow-inner">
              {allocated_crops.map((crop, idx) => (
                <div
                  key={crop.crop_name}
                  style={{ width: `${crop.acre_share_pct}%` }}
                  className={`h-full ${barColors[idx % barColors.length]} first:rounded-l-full last:rounded-r-full transition-all duration-500`}
                  title={`${getCropDisplayName(crop.crop_name, language)}: ${formatArea(crop.allocated_acres, language)} (${crop.acre_share_pct.toFixed(0)}%)`}
                />
              ))}
              {farm_totals.fallow_acres > 0 && (
                <div
                  style={{
                    width: `${(farm_totals.fallow_acres / farm_totals.total_land_acres) * 100}%`,
                  }}
                  className="h-full bg-cream-300/25 last:rounded-r-full transition-all"
                  title={`Fallow: ${formatArea(farm_totals.fallow_acres, language)}`}
                />
              )}
            </div>
          </div>
        </div>

        {/* 2. 4 BIG PRIMARY KPI CARDS */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* KPI 1: Expected Earning */}
          <div className="relative overflow-hidden rounded-2xl border border-gold-300/35 bg-gradient-to-b from-forest-950/90 to-forest-900/60 p-4 shadow-md group hover:border-gold-300/60 transition-all">
            <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-gold-400/10 blur-xl" />
            <div className="flex items-center gap-1.5 text-gold-300 mb-1">
              <Coins size={15} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-cream-300/70">
                {t('farmerPlan.expectedEarning')}
              </span>
            </div>
            <div className="font-serif text-lg sm:text-2xl font-bold text-gold-200">
              {formatCurrencyWords(farm_totals.total_expected_net_profit_inr, language)}
            </div>
            <div className="mt-0.5 font-mono text-xs text-cream-200 font-medium">
              {formatCurrency(farm_totals.total_expected_net_profit_inr, language)}
            </div>
            <span className="text-[10px] text-cream-300/60 block mt-1.5 font-medium leading-tight">
              {t('farmerPlan.earningHelper')}
            </span>
          </div>

          {/* KPI 2: Expected Return */}
          <div className="relative overflow-hidden rounded-2xl border border-emerald-500/35 bg-gradient-to-b from-forest-950/90 to-forest-900/60 p-4 shadow-md group hover:border-emerald-400/60 transition-all">
            <div className="pointer-events-none absolute -right-6 -top-6 h-16 w-16 rounded-full bg-emerald-400/10 blur-xl" />
            <div className="flex items-center gap-1.5 text-emerald-400 mb-1">
              <TrendingUp size={15} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-cream-300/70">
                {t('farmerPlan.expectedReturn')}
              </span>
            </div>
            <div className="font-serif text-lg sm:text-2xl font-bold text-emerald-300">
              +{farm_totals.expected_farm_roi_pct.toFixed(0)}%
            </div>
            <div className="mt-0.5 text-xs font-bold text-cream-100">
              {isHi
                ? `₹100 पर ₹${Math.round(farm_totals.expected_farm_roi_pct)} लाभ`
                : `₹${Math.round(farm_totals.expected_farm_roi_pct)} per ₹100`}
            </div>
            <span className="text-[10px] text-cream-300/60 block mt-1.5 font-medium leading-tight">
              {t('farmerPlan.returnHelper')}
            </span>
          </div>

          {/* KPI 3: Main Risk */}
          <div className="relative overflow-hidden rounded-2xl border border-gold-300/35 bg-gradient-to-b from-forest-950/90 to-forest-900/60 p-4 shadow-md group hover:border-gold-300/60 transition-all">
            <div className="flex items-center gap-1.5 text-gold-300 mb-1">
              <ShieldCheck size={15} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-cream-300/70">
                {t('farmerPlan.riskLevel')}
              </span>
            </div>
            <div className="mt-1">
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold ${
                  riskLabel === 'LOW'
                    ? 'border border-emerald-500/40 bg-emerald-950/80 text-emerald-300'
                    : riskLabel === 'MODERATE'
                    ? 'border border-gold-400/40 bg-gold-950/80 text-gold-300'
                    : 'border border-pink-500/40 bg-pink-950/80 text-pink-300'
                }`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${
                    riskLabel === 'LOW'
                      ? 'bg-emerald-400 animate-pulse'
                      : riskLabel === 'MODERATE'
                      ? 'bg-gold-400 animate-pulse'
                      : 'bg-pink-400 animate-pulse'
                  }`}
                />
                {translateRiskLevel(riskLabel, language)}
              </span>
            </div>
            <span className="text-[10px] text-cream-300/60 block mt-2 font-medium leading-tight">
              {t('farmerPlan.riskHelper')}
            </span>
          </div>

          {/* KPI 4: Money / Investment Used */}
          <div className="relative overflow-hidden rounded-2xl border border-gold-300/35 bg-gradient-to-b from-forest-950/90 to-forest-900/60 p-4 shadow-md group hover:border-gold-300/60 transition-all">
            <div className="flex items-center gap-1.5 text-gold-300 mb-1">
              <Coins size={15} />
              <span className="text-[10px] font-bold uppercase tracking-wider text-cream-300/70">
                {t('farmerPlan.moneyUsed')}
              </span>
            </div>
            <div className="font-serif text-lg sm:text-2xl font-bold text-cream-100">
              {formatCurrency(farm_totals.total_investment_inr, language)}
            </div>
            <div className="mt-0.5 text-xs font-bold text-gold-300">
              {farm_totals.budget_utilization_pct.toFixed(0)}% {t('farmerPlan.budgetUtilized')}
            </div>
            <span className="text-[10px] text-cream-300/60 block mt-1.5 font-medium leading-tight">
              {isHi ? 'बीज, खाद व जुताई खर्च' : 'Seeds, fertilizer & labor'}
            </span>
          </div>
        </div>

        {/* 3. WHAT SHOULD I DO NEXT? (PRACTICAL ACTION STEPS CHECKLIST) */}
        <div className="mt-6 rounded-2xl border border-gold-300/25 bg-forest-950/80 p-4 sm:p-5 shadow-inner">
          <div
            onClick={() => setShowNextSteps(!showNextSteps)}
            className="flex cursor-pointer items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold-400/20 text-lg">
                🚀
              </span>
              <div>
                <h3 className="font-serif text-sm sm:text-base font-bold text-gold-100">
                  {t('farmerPlan.nextStepsHeading')}
                </h3>
                <p className="text-xs text-cream-300/70">
                  {t('farmerPlan.nextStepsSubtitle')}
                </p>
              </div>
            </div>
            <button
              type="button"
              className="rounded-full p-1.5 text-gold-300 hover:bg-forest-900 transition-colors"
            >
              {showNextSteps ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>

          {showNextSteps && (
            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {nextSteps.map((step) => {
                const isDone = completedSteps[step.stepNumber];
                return (
                  <div
                    key={step.stepNumber}
                    onClick={() => toggleStep(step.stepNumber)}
                    className={`cursor-pointer rounded-2xl border p-4 transition-all duration-200 select-none ${
                      isDone
                        ? 'border-emerald-500/40 bg-emerald-950/30 opacity-90'
                        : 'border-gold-300/20 bg-forest-900/70 hover:border-gold-300/50 hover:bg-forest-900/90'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="flex items-center gap-2 text-xs font-bold text-gold-200">
                        <span className="text-base">{step.icon}</span>
                        <span className={isDone ? 'line-through text-cream-300/70' : ''}>
                          {step.title}
                        </span>
                      </div>
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-lg border transition-all ${
                          isDone
                            ? 'border-emerald-400 bg-emerald-500 text-forest-950 font-bold'
                            : 'border-gold-300/40 bg-forest-950/80 text-transparent hover:border-gold-300'
                        }`}
                      >
                        <Check size={12} className={isDone ? 'stroke-[3]' : ''} />
                      </div>
                    </div>
                    <p className="text-xs text-cream-200/90 leading-relaxed pl-6">
                      {step.action}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Action Toggle Strip */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-gold-300/15">
          <button
            type="button"
            onClick={() => setShowWhyExpanded(!showWhyExpanded)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gold-300/30 bg-forest-950/80 px-3.5 py-2 text-xs font-bold text-gold-300 hover:border-gold-300/60 hover:text-gold-100 transition-all shadow-sm"
          >
            <span>{showWhyExpanded ? '▲' : '▼'}</span>
            <span>{t('farmerPlan.whyThisPlanBtn')}</span>
          </button>

          <button
            type="button"
            onClick={onOpenDetailedAnalysis}
            className="inline-flex items-center gap-2 rounded-xl border border-gold-300/50 bg-gradient-to-r from-gold-400/20 to-gold-500/20 px-4 py-2 text-xs font-bold text-gold-200 transition-all hover:border-gold-300 hover:bg-gold-400/30 hover:text-white shadow-md hover:scale-[1.02]"
          >
            <span>🔬 {t('farmerPlan.seeDetailedAnalysisBtn')}</span>
            <ChevronRight size={14} className="text-gold-300" />
          </button>
        </div>
      </div>

      {/* Autonomous Field Directive Banner (if active) */}
      {advisory && (
        <div className="rounded-3xl border border-amber-500/40 bg-gradient-to-r from-amber-950/60 via-forest-900/80 to-amber-950/50 p-4 sm:p-5 backdrop-blur-xl shadow-lg">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl bg-amber-500/20 text-amber-300 border border-amber-500/40">
              <Zap size={18} />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono uppercase tracking-widest text-amber-300 font-bold">
                  {t('sentinel.advisoryTitle')} ({advisory.id})
                </span>
                <span className="rounded-full bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[9px] font-bold text-emerald-300">
                  ✓ {t('sentinel.actionVerified')}
                </span>
              </div>
              <h3 className="font-serif text-sm sm:text-base font-bold text-cream-100">
                {advisory.headline}
              </h3>
              <p className="text-xs text-cream-200 leading-relaxed font-medium">
                {advisory.recommended_action}
              </p>
              {advisory.crop_impact && (
                <p className="text-[11px] text-amber-200/80 pt-0.5">
                  <span className="font-semibold text-cream-300">{t('sentinel.targetCrops')}:</span> {advisory.crop_impact}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEVEL 2: "WHY THIS PLAN?" 5 SIMPLE UNDERSTANDABLE CARDS */}
      {/* ========================================================================= */}
      {showWhyExpanded && (
        <div className="rounded-3xl border border-gold-300/25 bg-forest-900/80 p-5 sm:p-6 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
          <div className="mb-4 border-b border-gold-300/15 pb-3.5">
            <div className="flex items-center gap-3">
              <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gold-400/20 text-xl border border-gold-300/30">
                💡
              </span>
              <div>
                <h3 className="font-serif text-base font-bold text-cream-100">
                  {t('farmerPlan.whyThisPlanTitle')}
                </h3>
                <p className="text-xs text-cream-300/70">
                  {isHi
                    ? 'मौसम, मिट्टी, पानी और बाजार भाव के आधार पर आसान स्पष्टीकरण'
                    : 'Clear, plain-language breakdown of environmental and market factors'}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            {whyCards.map((card, idx) => (
              <div
                key={idx}
                className="group rounded-2xl border border-gold-300/20 bg-forest-950/85 p-4 transition-all duration-300 hover:border-gold-300/50 hover:bg-forest-900/90 shadow-sm"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl group-hover:scale-110 transition-transform">
                      {card.icon}
                    </span>
                    <span className="font-serif text-xs font-bold text-gold-100">
                      {card.title}
                    </span>
                  </div>
                  <span
                    className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                      card.statusType === 'good'
                        ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/40'
                        : card.statusType === 'warning'
                        ? 'bg-amber-950/80 text-amber-300 border border-amber-500/40'
                        : 'bg-forest-900 text-cream-200 border border-forest-600/40'
                    }`}
                  >
                    {card.status}
                  </span>
                </div>
                <p className="text-xs text-cream-200/90 leading-relaxed font-normal">
                  {card.explanation}
                </p>
              </div>
            ))}
          </div>

          {/* Plain Language Risk Assessment Banner */}
          <div className="mt-4 rounded-2xl border border-gold-300/25 bg-forest-950/85 p-4 flex items-start gap-3.5 shadow-inner">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300 mt-0.5 border border-emerald-500/30">
              <ShieldCheck size={18} />
            </div>
            <div>
              <span className="font-bold text-xs text-gold-200 block mb-0.5">
                {isHi ? 'जोखिम मूल्यांकन (सरल शब्दों में)' : 'Risk Assessment (In Plain Terms)'}
              </span>
              <p className="text-xs text-cream-200/90 leading-relaxed">
                {riskPlainDesc}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* LEVEL 3 PREVIEW: QUICK "WHAT IF?" STRESS TESTS */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-gold-300/25 bg-forest-900/80 p-5 sm:p-6 backdrop-blur-xl shadow-[0_8px_32px_rgba(0,0,0,0.25)]">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gold-300/15 pb-3.5 mb-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-2xl bg-gold-400/20 text-xl border border-gold-300/30">
              🌦️
            </span>
            <div>
              <h3 className="font-serif text-base font-bold text-cream-100">
                {t('farmerPlan.whatIfHeading')}
              </h3>
              <p className="text-xs text-cream-300/70">
                {t('farmerPlan.whatIfSubtitle')}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenDetailedAnalysis}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gold-300/30 bg-forest-950/80 px-3 py-1.5 text-xs font-bold text-gold-300 hover:border-gold-300/60 hover:text-gold-100 transition-all shadow-sm"
          >
            <span>{isHi ? 'पूर्ण विश्लेषण देखें' : 'View Full Analysis'}</span>
            <ArrowRight size={13} />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(scenarios).map(([key, sc]) => {
            const icons: Record<string, string> = {
              live: '☀️',
              drought: '🏜️',
              waterlogging: '🌧️',
              heat_wave: '🔥',
            };
            return (
              <div
                key={key}
                className="rounded-2xl border border-gold-300/20 bg-forest-950/85 p-4 text-left transition-all duration-200 hover:border-gold-300/50 hover:bg-forest-900/80 shadow-sm"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-cream-100">
                  <span className="text-lg">{icons[key] || '🌾'}</span>
                  <span className="truncate">
                    {translateScenarioName(key, sc.scenario_name, language)}
                  </span>
                </div>
                <div className="mt-2.5 font-serif text-base sm:text-lg font-bold text-gold-200">
                  {formatCurrencyWords(sc.total_profit_inr, language)}
                </div>
                <div className="mt-0.5 font-mono text-[11px] text-cream-300/70">
                  {formatCurrency(sc.total_profit_inr, language)}
                </div>
                <span
                  className={`text-[10px] block mt-1.5 font-bold ${
                    sc.profit_delta_from_live_inr >= 0 ? 'text-forest-400' : 'text-pink-400'
                  }`}
                >
                  {sc.profit_delta_from_live_inr === 0
                    ? isHi ? 'आधारभूत' : 'Baseline'
                    : `${sc.profit_delta_from_live_inr > 0 ? '+' : ''}${formatCurrency(
                        sc.profit_delta_from_live_inr,
                        language
                      )}`}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
