import React, { useState } from 'react';
import {
  Sparkles,
  ShieldCheck,
  TrendingUp,
  Droplets,
  Calendar,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  MapPin,
  Maximize2,
  IndianRupee,
  Coins,
  Activity,
  Layers,
  HelpCircle,
  X,
  Check,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { getCropDisplayName } from '@/i18n/cropNames';
import { getStateDisplayName, getDistrictDisplayName } from '@/i18n/geoNames';
import {
  formatCurrency,
  formatCurrencyWords,
  formatArea,
  formatYield,
  formatRainfall,
} from '@/i18n/formatters';
import {
  translateRiskLevel,
  translateIrrigationType,
  translateIrrigationReliability,
  translateSeason,
} from '@/i18n/enums';
import {
  getFarmerWhyCards,
  getFarmerNextActionSteps,
  getFarmerRecommendationHeadline,
} from '@/i18n/semanticAdapter';
import { DetailedAnalysisView } from '@/components/DetailedAnalysisView';
import type { FarmDecisionResponse } from '@/types/farm';

interface FarmPlanScreenProps {
  userName?: string;
  selectedState: string;
  selectedDistrict: string;
  landAcres: number;
  budgetInr: number;
  irrigationType: 'Borewell' | 'Rainfed' | 'Canal' | 'Drip' | 'Sprinkler';
  irrigationReliability: 'High' | 'Medium' | 'Low';
  season: 'Kharif' | 'Rabi' | 'Zaid';
  riskTolerance: 'Conservative' | 'Balanced' | 'Aggressive';
  decision: FarmDecisionResponse | null;
  loading: boolean;
  onLandAcresChange: (acres: number) => void;
  onBudgetInrChange: (budget: number) => void;
  onIrrigationTypeChange: (type: 'Borewell' | 'Rainfed' | 'Canal' | 'Drip' | 'Sprinkler') => void;
  onIrrigationReliabilityChange: (rel: 'High' | 'Medium' | 'Low') => void;
  onSeasonChange: (season: 'Kharif' | 'Rabi' | 'Zaid') => void;
  onRiskToleranceChange: (risk: 'Conservative' | 'Balanced' | 'Aggressive') => void;
  onRecalculate: () => void;
  onChangeLocation: () => void;
  onProceedToSentinel: () => void;
  onLogout: () => void;
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
  if (c.includes('tomato') || c.includes('टमाटर')) return '🍅';
  if (c.includes('sunflower') || c.includes('सूरजमुखी')) return '🌻';
  if (c.includes('mung') || c.includes('moong') || c.includes('मूंग')) return '🌱';
  if (c.includes('urad') || c.includes('उड़द')) return '🌿';
  return '🌱';
}

export function FarmPlanScreen({
  userName = 'Demo Farmer',
  selectedState,
  selectedDistrict,
  landAcres,
  budgetInr,
  irrigationType,
  irrigationReliability,
  season,
  riskTolerance,
  decision,
  loading,
  onLandAcresChange,
  onBudgetInrChange,
  onIrrigationTypeChange,
  onIrrigationReliabilityChange,
  onSeasonChange,
  onRiskToleranceChange,
  onRecalculate,
  onChangeLocation,
  onProceedToSentinel,
  onLogout,
}: FarmPlanScreenProps) {
  const { t, language } = useLanguage();
  const isHi = language === 'hi';

  const [isEditingParams, setIsEditingParams] = useState<boolean>(!decision);
  const [showDetailedModal, setShowDetailedModal] = useState<boolean>(false);
  const [showFull7DayModal, setShowFull7DayModal] = useState<boolean>(false);
  const [showWhyExpanded, setShowWhyExpanded] = useState<boolean>(false);

  const landPresets = [
    { label: isHi ? '1 एकड़' : '1 Ac', value: 1 },
    { label: isHi ? '2 एकड़' : '2 Ac', value: 2 },
    { label: isHi ? '5 एकड़' : '5 Ac', value: 5 },
    { label: isHi ? '10 एकड़' : '10 Ac', value: 10 },
  ];

  const budgetPresets = [
    { label: isHi ? '₹50 हज़ार' : '₹50K', value: 50000 },
    { label: isHi ? '₹1.2 लाख' : '₹1.2L', value: 120000 },
    { label: isHi ? '₹2 लाख' : '₹2 Lakh', value: 200000 },
    { label: isHi ? '₹5 लाख' : '₹5 Lakh', value: 500000 },
  ];

  // Derived decision values
  const allocatedCrops = decision?.allocated_crops || [];
  const farmTotals = decision?.farm_totals;
  const netProfit = farmTotals?.total_expected_net_profit_inr ?? 0;
  const totalInvestment = farmTotals?.total_investment_inr ?? budgetInr;
  const roiPct = farmTotals?.expected_farm_roi_pct ?? 0;
  const riskLabel = farmTotals?.weighted_risk_label?.toUpperCase() || 'LOW';

  const whyCards = decision ? getFarmerWhyCards(decision, language) : [];
  const nextSteps = decision ? getFarmerNextActionSteps(decision, language) : [];
  const recHeadline = decision ? getFarmerRecommendationHeadline(decision, language) : '';

  // 7-day micro-plan summary days
  const default7Days = [
    { day: 1, title: isHi ? 'खेत की जुताई' : 'Land Prep', desc: isHi ? 'खेत की गहरी जुताई व पाटा लगाना' : 'Deep ploughing & seedbed preparation' },
    { day: 2, title: isHi ? 'बीजोपचार' : 'Seed Treatment', desc: isHi ? 'प्रमाणित बीज व ट्राइकोडर्मा बीजोपचार' : 'Certified seed & bio-fungicide treatment' },
    { day: 3, title: isHi ? 'बुवाई / रोपाई' : 'Sowing', desc: isHi ? 'नमी अनुसार कतारबद्ध बुवाई' : 'Line sowing aligned with soil moisture' },
    { day: 4, title: isHi ? 'सिंचाई जांच' : 'Irrigation', desc: isHi ? 'हल्की नमी जांच व जल निकासी' : 'Moisture check & drip/drainage check' },
    { day: 5, title: isHi ? 'आधार खाद' : 'Fertilizer 1', desc: isHi ? 'संतुलित डीएपी/एनपीके आधार खुराक' : 'Basal DAP/NPK balanced dosage' },
    { day: 6, title: isHi ? 'खरपतवार नियंत्रण' : 'Weed Control', desc: isHi ? 'निराई-गुड़ाई व खेत की सफाई' : 'Manual weeding & inter-culture' },
    { day: 7, title: isHi ? 'फसल निरीक्षण' : 'Field Check', desc: isHi ? 'अंकुरण प्रतिशत व कीट जांच' : 'Germination percentage & health check' },
  ];

  return (
    <div className="relative min-h-screen w-full bg-transparent text-[#1F2937] flex flex-col justify-between selection:bg-[#E2725B]/20 selection:text-[#873322]">
      {/* ===================================================================== */}
      {/* 1. TOP NAVIGATION BAR */}
      {/* ===================================================================== */}
      <header className="sticky top-0 z-30 border-b border-[#EDE4D5] bg-[#FAF7F2]/90 backdrop-blur-md px-4 sm:px-8 py-3">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Stage Indicator */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onChangeLocation}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#EDE4D5] bg-[#FFFFFF] text-[#4B5563] hover:bg-[#F5EFE6] transition-colors"
              title={isHi ? 'स्थान बदलें' : 'Back to Location Selection'}
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg font-bold tracking-tight text-[#1F2937]">
                  AgriOptima AI
                </span>
                <span className="rounded-full bg-[#EAF3ED] px-2.5 py-0.5 text-[10px] font-semibold text-[#2D5A43] border border-[#D4E7DC]">
                  {isHi ? 'चरण 3/4: खेत योजना' : 'Step 3/4: Farm Plan'}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Tab Breadcrumb & Right Controls */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowDetailedModal(true)}
              className="hidden md:flex items-center gap-1.5 rounded-xl border border-[#EDE4D5] bg-[#FFFFFF] px-3 py-1.5 text-xs font-semibold text-[#374151] hover:border-[#D1D5DB] hover:bg-[#F5EFE6] transition-colors"
            >
              <Layers size={14} className="text-[#E2725B]" />
              <span>{isHi ? 'विस्तृत तकनीकी विश्लेषण' : 'Detailed Analysis'}</span>
            </button>

            <LanguageSelector />

            <button
              type="button"
              onClick={onProceedToSentinel}
              className="flex items-center gap-1.5 rounded-xl bg-[#E2725B] px-3.5 py-1.5 text-xs font-bold text-[#FFFFFF] shadow-sm hover:bg-[#D9654D] transition-colors cursor-pointer"
            >
              <span>{isHi ? 'सेंटीनेल सहायक' : 'Sentinel Agent'}</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. MAIN 2-COLUMN WORKSPACE */}
      {/* ===================================================================== */}
      <main className="flex-1 px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* =================================================================== */}
          {/* LEFT COLUMN: "YOUR FARM" (32% width) */}
          {/* =================================================================== */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-[#EDE4D5] bg-[#FFFFFF] p-5 shadow-sm space-y-4">
              
              {/* Header with Edit Toggle */}
              <div className="flex items-center justify-between border-b border-[#EDE4D5] pb-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#EAF3ED] text-[#2D5A43] text-sm">
                    🌾
                  </span>
                  <h2 className="font-serif text-base font-bold text-[#1F2937]">
                    {isHi ? 'आपका खेत' : 'Your Farm'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditingParams(!isEditingParams)}
                  className="text-xs font-semibold text-[#E2725B] hover:text-[#B54832] transition-colors"
                >
                  {isEditingParams ? (isHi ? 'पूर्ण' : 'Done') : (isHi ? 'बदलें' : 'Edit Details')}
                </button>
              </div>

              {/* Location Tag */}
              <div className="flex items-center justify-between rounded-xl bg-[#FAF7F2] border border-[#EDE4D5] p-3">
                <div className="flex items-center gap-2">
                  <MapPin size={15} className="text-[#E2725B] shrink-0" />
                  <div>
                    <span className="text-[10px] uppercase font-bold text-[#6B7280] block">
                      {isHi ? 'खेत का स्थान' : 'Farm Location'}
                    </span>
                    <span className="text-xs font-bold text-[#1F2937]">
                      {getDistrictDisplayName(selectedDistrict, language)}, {getStateDisplayName(selectedState, language)}
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={onChangeLocation}
                  className="text-[11px] font-semibold text-[#2D5A43] hover:underline"
                >
                  {isHi ? 'बदलें' : 'Change'}
                </button>
              </div>

              {/* Farm Parameters (Read or Quick Edit Mode) */}
              {!isEditingParams ? (
                /* Compact Summary Cards */
                <div className="space-y-2.5 text-xs">
                  <div className="flex items-center justify-between py-1.5 border-b border-[#FAF7F2]">
                    <span className="text-[#6B7280]">{isHi ? 'जमीन का आकार' : 'Land Size'}</span>
                    <span className="font-bold text-[#1F2937]">{landAcres} {isHi ? 'एकड़' : 'Acres'}</span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-[#FAF7F2]">
                    <span className="text-[#6B7280]">{isHi ? 'निवेश बजट' : 'Investment Budget'}</span>
                    <span className="font-bold text-[#1F2937]">{formatCurrency(budgetInr, language)}</span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-[#FAF7F2]">
                    <span className="text-[#6B7280]">{isHi ? 'सिंचाई साधन' : 'Irrigation'}</span>
                    <span className="font-bold text-[#1F2937]">{translateIrrigationType(irrigationType, language)} ({translateIrrigationReliability(irrigationReliability, language)})</span>
                  </div>

                  <div className="flex items-center justify-between py-1.5 border-b border-[#FAF7F2]">
                    <span className="text-[#6B7280]">{isHi ? 'फसल मौसम' : 'Season'}</span>
                    <span className="font-bold text-[#1F2937]">{translateSeason(season, language)}</span>
                  </div>

                  <div className="flex items-center justify-between py-1.5">
                    <span className="text-[#6B7280]">{isHi ? 'जोखिम स्तर' : 'Risk Level'}</span>
                    <span className="font-bold text-[#1F2937]">{riskTolerance}</span>
                  </div>
                </div>
              ) : (
                /* Quick Edit Form */
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setIsEditingParams(false);
                    onRecalculate();
                  }}
                  className="space-y-3.5 text-xs pt-1"
                >
                  {/* Land Size */}
                  <div>
                    <label className="block font-semibold text-[#374151] mb-1">
                      {isHi ? 'जमीन का आकार (एकड़):' : 'Land Size (Acres):'}
                    </label>
                    <input
                      type="number"
                      min="0.5"
                      max="100"
                      step="0.5"
                      value={landAcres}
                      onChange={(e) => onLandAcresChange(parseFloat(e.target.value) || 1)}
                      className="w-full rounded-xl border border-[#D1D5DB] bg-[#FAF7F2] px-3 py-2 text-xs font-semibold focus:border-[#E2725B] focus:bg-[#FFFFFF] focus:outline-none"
                    />
                    <div className="flex gap-1 mt-1.5">
                      {landPresets.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => onLandAcresChange(p.value)}
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-medium ${
                            landAcres === p.value
                              ? 'bg-[#E2725B] text-white font-bold'
                              : 'bg-[#FAF7F2] border border-[#EDE4D5] text-[#6B7280]'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Budget */}
                  <div>
                    <label className="block font-semibold text-[#374151] mb-1">
                      {isHi ? 'निवेश बजट (₹):' : 'Investment Budget (₹):'}
                    </label>
                    <input
                      type="number"
                      min="5000"
                      step="5000"
                      value={budgetInr}
                      onChange={(e) => onBudgetInrChange(parseInt(e.target.value, 10) || 50000)}
                      className="w-full rounded-xl border border-[#D1D5DB] bg-[#FAF7F2] px-3 py-2 text-xs font-semibold focus:border-[#E2725B] focus:bg-[#FFFFFF] focus:outline-none"
                    />
                    <div className="flex gap-1 mt-1.5">
                      {budgetPresets.map((p) => (
                        <button
                          key={p.value}
                          type="button"
                          onClick={() => onBudgetInrChange(p.value)}
                          className={`rounded-lg px-2 py-0.5 text-[10px] font-medium ${
                            budgetInr === p.value
                              ? 'bg-[#E2725B] text-white font-bold'
                              : 'bg-[#FAF7F2] border border-[#EDE4D5] text-[#6B7280]'
                          }`}
                        >
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Irrigation Type */}
                  <div>
                    <label className="block font-semibold text-[#374151] mb-1">
                      {isHi ? 'सिंचाई साधन:' : 'Irrigation Source:'}
                    </label>
                    <select
                      value={irrigationType}
                      onChange={(e) => onIrrigationTypeChange(e.target.value as any)}
                      className="w-full rounded-xl border border-[#D1D5DB] bg-[#FAF7F2] px-3 py-2 text-xs font-medium focus:border-[#E2725B] focus:outline-none"
                    >
                      <option value="Borewell">{isHi ? 'बोरवेल (Borewell)' : 'Borewell'}</option>
                      <option value="Canal">{isHi ? 'नहर (Canal)' : 'Canal'}</option>
                      <option value="Drip">{isHi ? 'ड्रिप सिंचाई (Drip)' : 'Drip'}</option>
                      <option value="Sprinkler">{isHi ? 'फव्वारा (Sprinkler)' : 'Sprinkler'}</option>
                      <option value="Rainfed">{isHi ? 'वर्षा आधारित (Rainfed)' : 'Rainfed'}</option>
                    </select>
                  </div>

                  {/* Season */}
                  <div>
                    <label className="block font-semibold text-[#374151] mb-1">
                      {isHi ? 'फसल मौसम:' : 'Crop Season:'}
                    </label>
                    <select
                      value={season}
                      onChange={(e) => onSeasonChange(e.target.value as any)}
                      className="w-full rounded-xl border border-[#D1D5DB] bg-[#FAF7F2] px-3 py-2 text-xs font-medium focus:border-[#E2725B] focus:outline-none"
                    >
                      <option value="Kharif">{isHi ? 'खरीफ (Kharif)' : 'Kharif'}</option>
                      <option value="Rabi">{isHi ? 'रबी (Rabi)' : 'Rabi'}</option>
                      <option value="Zaid">{isHi ? 'जायद (Zaid)' : 'Zaid'}</option>
                    </select>
                  </div>

                  {/* Risk Preference */}
                  <div>
                    <label className="block font-semibold text-[#374151] mb-1">
                      {isHi ? 'जोखिम लेने की क्षमता:' : 'Risk Tolerance:'}
                    </label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['Conservative', 'Balanced', 'Aggressive'] as const).map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => onRiskToleranceChange(r)}
                          className={`rounded-lg py-1.5 text-[10px] font-semibold transition-colors ${
                            riskTolerance === r
                              ? 'bg-[#2D5A43] text-white'
                              : 'bg-[#FAF7F2] border border-[#EDE4D5] text-[#6B7280]'
                          }`}
                        >
                          {r}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit Update Button */}
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full rounded-xl py-3 text-xs font-bold text-white shadow-sm transition-all cursor-pointer ${
                      !decision
                        ? 'bg-[#E2725B] hover:bg-[#D9654D] shadow-md hover:shadow-lg'
                        : 'bg-[#2D5A43] hover:bg-[#224432]'
                    }`}
                  >
                    {loading
                      ? (isHi ? 'गणना हो रही है...' : 'Calculating Optimal Plan...')
                      : !decision
                      ? (isHi ? 'AI खेत योजना तैयार करें →' : 'Generate AI Farm Plan →')
                      : (isHi ? 'योजना अपडेट करें' : 'Update Farm Plan')}
                  </button>
                </form>
              )}

              {/* Recalculate CTA */}
              {!isEditingParams && decision && (
                <button
                  type="button"
                  onClick={onRecalculate}
                  disabled={loading}
                  className="w-full rounded-xl border border-[#D4E7DC] bg-[#EAF3ED] py-2.5 text-xs font-semibold text-[#2D5A43] hover:bg-[#D4E7DC] transition-colors cursor-pointer"
                >
                  {loading ? (isHi ? 'गणना हो रही है...' : 'Optimizing...') : (isHi ? 'योजना पुनः अनुकूलित करें' : 'Re-Optimize Plan')}
                </button>
              )}

            </div>
          </div>

          {/* =================================================================== */}
          {/* RIGHT COLUMN: "YOUR RECOMMENDED PLAN" or "CONFIGURE FARM DETAILS" */}
          {/* =================================================================== */}
          <div className="lg:col-span-8 space-y-5">
            
            {/* INITIAL ZERO-ASSUMPTION PROMPT (Shown when farmer has not generated plan yet) */}
            {!decision ? (
              <div className="rounded-3xl border border-[#EDE4D5] bg-[#FFFFFF] p-8 sm:p-12 shadow-[0_4px_25px_rgba(56,49,39,0.04)] text-center space-y-6">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-[#FDEEE9] text-[#E2725B] text-4xl shadow-inner">
                  🌱
                </div>

                <div className="max-w-lg mx-auto space-y-2.5">
                  <div className="inline-flex items-center gap-1.5 rounded-full border border-[#D4E7DC] bg-[#EAF3ED] px-3.5 py-1 text-xs font-semibold text-[#2D5A43]">
                    <MapPin size={13} className="text-[#3F7253]" />
                    <span>{getDistrictDisplayName(selectedDistrict, language)}, {getStateDisplayName(selectedState, language)}</span>
                  </div>

                  <h2 className="font-serif text-2xl sm:text-3xl font-bold text-[#1F2937] tracking-tight">
                    {isHi ? 'अपने खेत का विवरण दर्ज करें' : 'Ready to Generate Your Farm Plan'}
                  </h2>
                  <p className="text-xs sm:text-sm text-[#6B7280] leading-relaxed">
                    {isHi
                      ? 'बाईं ओर अपनी जमीन का आकार, बजट और सिंचाई का साधन दर्ज करें। फिर "AI खेत योजना तैयार करें" पर क्लिक करें ताकि आपके खेत के अनुसार वास्तविक फसल योजना प्राप्त हो सके।'
                      : 'Please enter your actual land acreage, investment capital, and irrigation details on the left, then click "Generate AI Farm Plan" to calculate your personalized crop portfolio.'}
                  </p>
                </div>

                {/* 3 Step Guidance Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 max-w-2xl mx-auto pt-3 text-left">
                  <div className="rounded-2xl border border-[#EDE4D5] bg-[#FAF7F2] p-4">
                    <span className="text-xs font-bold text-[#2D5A43] block mb-1">
                      1. {isHi ? 'जमीन व बजट' : 'Land & Budget'}
                    </span>
                    <p className="text-[11px] text-[#6B7280] leading-snug">
                      {isHi ? 'अपनी उपलब्ध खेती योग्य भूमि और कार्यशील पूंजी दर्ज करें।' : 'Input your available land acres and working capital.'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#EDE4D5] bg-[#FAF7F2] p-4">
                    <span className="text-xs font-bold text-[#2A7575] block mb-1">
                      2. {isHi ? 'सिंचाई व मौसम' : 'Water & Season'}
                    </span>
                    <p className="text-[11px] text-[#6B7280] leading-snug">
                      {isHi ? 'बोरवेल, नहर, ड्रिप, फव्वारा या वर्षा आधारित साधन।' : 'Select borewell, canal, drip, sprinkler, or rainfed.'}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-[#EDE4D5] bg-[#FAF7F2] p-4">
                    <span className="text-xs font-bold text-[#E2725B] block mb-1">
                      3. {isHi ? 'अनुकूलित AI योजना' : 'AI Crop Plan'}
                    </span>
                    <p className="text-[11px] text-[#6B7280] leading-snug">
                      {isHi ? 'गणितीय LP इंजन द्वारा अधिकतम शुद्ध मुनाफा।' : 'Deterministic LP solver optimizes for maximum profit.'}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
            {/* HERO RECOMMENDATION CARD */}
            <div className="rounded-3xl border border-[#EDE4D5] bg-[#FFFFFF] p-6 sm:p-7 shadow-[0_4px_25px_rgba(56,49,39,0.04)] space-y-6">
              
              {/* Hero Title & Confidence Badge */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EDE4D5] pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#E2725B]">
                      {isHi ? 'सर्वोत्तम AI सिफारिश' : 'Recommended Farm Plan'}
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#EAF3ED] px-2 py-0.5 text-[9px] font-semibold text-[#2D5A43] border border-[#D4E7DC]">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#3F7253] animate-pulse" />
                      <span>{isHi ? 'विश्वसनीयता: उच्च' : 'Confidence: High'}</span>
                    </span>
                  </div>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold text-[#1F2937] tracking-tight mt-0.5">
                    {recHeadline || (allocatedCrops.length > 0
                      ? `${isHi ? 'उगाएं' : 'Grow'} ${allocatedCrops.map(c => getCropDisplayName(c.crop_name, language)).join(' + ')}`
                      : (isHi ? 'अनुकूलित फसल योजना' : 'Optimal Farm Portfolio'))}
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <span className="rounded-xl border border-[#D4E7DC] bg-[#EAF3ED] px-3 py-1.5 text-xs font-bold text-[#2D5A43]">
                    {translateSeason(season, language)} 2026
                  </span>
                </div>
              </div>

              {/* RECOMMENDED CROP ALLOCATION CARDS */}
              <div>
                <span className="text-xs font-bold text-[#374151] block mb-2.5">
                  {isHi ? 'फसल आवंटन एवं अनुमानित लाभ' : 'Recommended Crops & Acreage'}
                </span>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {allocatedCrops.map((crop, idx) => {
                    const sharePct = ((crop.allocated_acres / (decision?.farm_totals.total_allocated_acres || 1)) * 100).toFixed(0);
                    return (
                      <div
                        key={idx}
                        className="rounded-2xl border border-[#EDE4D5] bg-[#FAF7F2] p-4 transition-all hover:border-[#D4E7DC] hover:shadow-sm"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{getCropIcon(crop.crop_name)}</span>
                          <span className="rounded-full bg-[#FFFFFF] px-2 py-0.5 text-[10px] font-bold text-[#2D5A43] border border-[#EDE4D5]">
                            {sharePct}% {isHi ? 'हिस्सा' : 'Share'}
                          </span>
                        </div>

                        <h3 className="font-serif text-base font-bold text-[#1F2937]">
                          {getCropDisplayName(crop.crop_name, language)}
                        </h3>
                        <p className="text-xs font-semibold text-[#E2725B] mt-0.5">
                          {crop.allocated_acres.toFixed(1)} {isHi ? 'एकड़' : 'Acres'}
                        </p>

                        <div className="mt-3 pt-2.5 border-t border-[#EDE4D5] space-y-1 text-[11px]">
                          <div className="flex justify-between text-[#6B7280]">
                            <span>{isHi ? 'अनुमानित उपज' : 'Est. Yield'}:</span>
                            <span className="font-medium text-[#1F2937]">{crop.expected_yield_qtl_acre.toFixed(1)} Q/Ac</span>
                          </div>
                          <div className="flex justify-between text-[#6B7280]">
                            <span>{isHi ? 'अनुमानित लाभ' : 'Est. Profit'}:</span>
                            <span className="font-bold text-[#2D5A43]">{formatCurrency(crop.net_profit_inr, language)}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* FINANCIAL SUMMARY STRIP (Hero 4 Key Metrics) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
                <div className="rounded-2xl border border-[#D4E7DC] bg-[#EAF3ED] p-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#2D5A43] block">
                    {isHi ? 'कुल अनुमानित लाभ' : 'Total Expected Profit'}
                  </span>
                  <p className="font-serif text-base sm:text-lg font-bold text-[#1F2937] mt-0.5">
                    {formatCurrency(netProfit, language)}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#EDE4D5] bg-[#FAF7F2] p-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">
                    {isHi ? 'कुल आवश्यक निवेश' : 'Total Investment'}
                  </span>
                  <p className="font-serif text-base sm:text-lg font-bold text-[#1F2937] mt-0.5">
                    {formatCurrency(totalInvestment, language)}
                  </p>
                </div>

                <div className="rounded-2xl border border-[#EDE4D5] bg-[#FAF7F2] p-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">
                    {isHi ? 'अनुमानित रिटर्न (ROI)' : 'Expected ROI'}
                  </span>
                  <p className="font-serif text-base sm:text-lg font-bold text-[#2D5A43] mt-0.5">
                    +{roiPct.toFixed(1)}%
                  </p>
                </div>

                <div className="rounded-2xl border border-[#EDE4D5] bg-[#FAF7F2] p-3.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#6B7280] block">
                    {isHi ? 'जोखिम स्तर' : 'Risk Level'}
                  </span>
                  <p className="font-serif text-base sm:text-lg font-bold text-[#E2725B] mt-0.5">
                    {translateRiskLevel(riskLabel, language)}
                  </p>
                </div>
              </div>
            </div>

            {/* =============================================================== */}
            {/* 7-DAY MICRO PLAN SECTION */}
              {/* =============================================================== */}
              <div className="rounded-2xl border border-[#EDE4D5] bg-[#FAF7F2] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-serif text-sm sm:text-base font-bold text-[#1F2937]">
                      {isHi ? '7-दिवसीय कृषि कार्ययोजना' : '7-Day Farm Action Plan'}
                    </h3>
                    <p className="text-[11px] text-[#6B7280]">
                      {isHi ? 'लाइव मौसम और बुवाई खिड़की के अनुसार इस सप्ताह की योजना' : 'Next 7 days action plan for your farm'}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowFull7DayModal(true)}
                    className="text-xs font-semibold text-[#E2725B] hover:underline cursor-pointer"
                  >
                    {isHi ? 'पूरी योजना देखें' : 'View Full Plan'}
                  </button>
                </div>

                {/* 7-Day Micro Cards Strip */}
                <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2 pt-1">
                  {default7Days.map((step) => (
                    <div
                      key={step.day}
                      className="rounded-xl border border-[#EDE4D5] bg-[#FFFFFF] p-2.5 text-center shadow-xs"
                    >
                      <span className="text-[9px] font-mono font-bold text-[#E2725B] uppercase block">
                        {isHi ? `दिन ${step.day}` : `Day ${step.day}`}
                      </span>
                      <h4 className="text-xs font-bold text-[#1F2937] mt-0.5 truncate">
                        {step.title}
                      </h4>
                      <p className="text-[10px] text-[#6B7280] mt-1 leading-tight line-clamp-2">
                        {step.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* =============================================================== */}
              {/* WHY WE RECOMMEND THIS (Progressive Disclosure) */}
              {/* =============================================================== */}
              <div className="rounded-2xl border border-[#EDE4D5] bg-[#FFFFFF] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif text-sm sm:text-base font-bold text-[#1F2937]">
                    {isHi ? 'हम यह सिफारिश क्यों कर रहे हैं?' : 'Why are we recommending this?'}
                  </h3>
                  <button
                    type="button"
                    onClick={() => setShowWhyExpanded(!showWhyExpanded)}
                    className="flex items-center gap-1 text-xs font-semibold text-[#6B7280] hover:text-[#1F2937]"
                  >
                    <span>{showWhyExpanded ? (isHi ? 'संक्षिप्त' : 'Less') : (isHi ? 'विस्तार' : 'More')}</span>
                    {showWhyExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
                  {whyCards.slice(0, showWhyExpanded ? whyCards.length : 4).map((c, i) => (
                    <div key={i} className="flex items-start gap-2.5 rounded-xl bg-[#FAF7F2] p-3 border border-[#EDE4D5]">
                      <span className="text-base shrink-0 mt-0.5">{c.icon}</span>
                      <div>
                        <span className="font-bold text-[#1F2937] block">{c.title}</span>
                        <p className="text-[11px] text-[#6B7280] mt-0.5 leading-snug">{c.explanation}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setShowDetailedModal(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-[#E2725B] hover:text-[#B54832] transition-colors"
                  >
                    <span>{isHi ? 'वैज्ञानिक एवं गणितीय विश्लेषण देखें →' : 'See Detailed Mathematical & Agro Analysis →'}</span>
                  </button>
                </div>
              </div>

              {/* PROCEED TO AUTONOMOUS SENTINEL CTA */}
              <div className="rounded-2xl border border-[#F9D0C5] bg-gradient-to-r from-[#FDEEE9] to-[#FAF7F2] p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="font-serif text-base font-bold text-[#1F2937]">
                    {isHi ? 'स्वायत्त खेत सहायक सक्रिय करें' : 'Next Step: Autonomous Sentinel Monitoring'}
                  </h3>
                  <p className="text-xs text-[#6B7280] mt-0.5 max-w-lg">
                    {isHi
                      ? 'योजना बन जाने के बाद, एग्रीऑप्टिमा सेंटीनेल मौसम, बीमारी और मंडी भाव की 24/7 निगरानी रखता है।'
                      : 'After planning, Sentinel continuously monitors weather, crop stress, and market changes 24/7.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={onProceedToSentinel}
                  className="shrink-0 flex items-center gap-2 rounded-xl bg-[#E2725B] px-5 py-3 text-xs font-bold text-white shadow-sm hover:bg-[#D9654D] transition-colors cursor-pointer"
                >
                  <span>{isHi ? 'सेंटीनेल चालू करें' : 'Proceed to Autonomous Sentinel'}</span>
                  <ArrowRight size={15} />
                </button>
              </div>
            </div>
            )}

          </div>

        </div>
      </main>

      {/* ===================================================================== */}
      {/* 3. FULL 7-DAY ACTION PLAN MODAL */}
      {/* ===================================================================== */}
      {showFull7DayModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="w-full max-w-2xl rounded-3xl border border-[#EDE4D5] bg-[#FFFFFF] p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EDE4D5] pb-3">
              <div>
                <h3 className="font-serif text-lg font-bold text-[#1F2937]">
                  {isHi ? 'विस्तृत 7-दिवसीय खेत कार्ययोजना' : 'Comprehensive 7-Day Farm Action Plan'}
                </h3>
                <p className="text-xs text-[#6B7280]">
                  {isHi ? 'आपके खेत व मिट्टी के अनुसार दैनिक कार्य' : 'Daily operational checklist tailored to your farm allocation'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFull7DayModal(false)}
                className="rounded-full p-1 text-[#6B7280] hover:bg-[#FAF7F2]"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {default7Days.map((step) => (
                <div key={step.day} className="flex items-start gap-3 rounded-xl border border-[#EDE4D5] bg-[#FAF7F2] p-3.5">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#E2725B] text-xs font-bold text-white">
                    {step.day}
                  </span>
                  <div>
                    <h4 className="text-xs font-bold text-[#1F2937]">{step.title}</h4>
                    <p className="text-xs text-[#6B7280] mt-0.5">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="button"
                onClick={() => setShowFull7DayModal(false)}
                className="rounded-xl bg-[#2D5A43] px-4 py-2 text-xs font-bold text-white hover:bg-[#224432]"
              >
                {isHi ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. DETAILED EXPERT ANALYSIS MODAL / DRAWER */}
      {/* ===================================================================== */}
      {showDetailedModal && decision && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-2 sm:px-4 backdrop-blur-sm">
          <div className="w-full max-w-5xl rounded-3xl border border-[#EDE4D5] bg-[#FAF7F2] text-[#1F2937] p-4 sm:p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-[#EDE4D5] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FDEEE9] text-[#E2725B] text-lg">
                  🔬
                </span>
                <div>
                  <h3 className="font-serif text-base sm:text-lg font-bold text-[#1F2937]">
                    {isHi ? 'वैज्ञानिक एवं गणितीय निर्णय विश्लेषण' : 'Expert Decision & Optimization Analysis'}
                  </h3>
                  <p className="text-xs text-[#6B7280]">
                    HiGHS Simplex Engine • ICAR Scientific Agronomy • Open-Meteo Professional Telemetry
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDetailedModal(false)}
                className="rounded-full bg-[#FFFFFF] border border-[#EDE4D5] p-2 text-[#6B7280] hover:text-[#1F2937] hover:bg-[#F5EFE6] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            {/* Render full existing DetailedAnalysisView with all solvers, scenarios, and causality */}
            <div className="pt-2">
              <DetailedAnalysisView
                decision={decision}
                onReturnToFarmerView={() => setShowDetailedModal(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 5. FOOTER */}
      {/* ===================================================================== */}
      <footer className="border-t border-[#EDE4D5] bg-[#FAF7F2] px-4 sm:px-8 py-3 text-xs text-[#6B7280]">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3 text-[11px]">
          <span>{isHi ? 'भारतीय कृषि अनुसंधान परिषद (ICAR) एवं मंडी डेटा द्वारा संचालित' : 'Powered by ICAR Agronomy Engine & Real-time Mandi Telemetry'}</span>
          <span>© 2026 AgriOptima AI</span>
        </div>
      </footer>
    </div>
  );
}
