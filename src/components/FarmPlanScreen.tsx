import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowRight,
  Layers,
  Pencil,
  X,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
  Calendar,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { JourneyNav } from '@/components/JourneyNav';
import { getCropDisplayName } from '@/i18n/cropNames';
import { getStateDisplayName, getDistrictDisplayName } from '@/i18n/geoNames';
import { formatCurrency, formatCurrencyWords } from '@/i18n/formatters';
import {
  translateRiskLevel,
  translateSeason,
} from '@/i18n/enums';
import { DetailedAnalysisView } from '@/components/DetailedAnalysisView';
import { FarmDigitalTwin } from '@/components/FarmDigitalTwin';
import { AIAgentOrb } from '@/components/AIAgentOrb';
import { StatBlock, ProgressRing, AllocationBar, RiskMeter, DonutChart } from '@/components/ui/dataviz';
import { Reveal, MagneticButton, Counter } from '@/components/ui/motion';
import { usePrefersReducedMotion } from '@/lib/hooks';
import type { FarmDecisionResponse } from '@/types/farm';
import {
  getSeasonWeeksCount,
  getWeeklyActionPlan,
  getAllWeeksSummary,
} from '@/lib/seasonalActionPlans';

interface WeekDropdownProps {
  selectedWeek: number;
  totalWeeks: number;
  allWeeks: Array<{ week: number; stageName: string; phaseLabel: string }>;
  onSelectWeek: (w: number) => void;
  isHi: boolean;
  className?: string;
}

function WeekDropdown({
  selectedWeek,
  totalWeeks,
  allWeeks,
  onSelectWeek,
  isHi,
  className = '',
}: WeekDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const activeItem = allWeeks.find((w) => w.week === selectedWeek) || allWeeks[0];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Aesthetic Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-full min-w-[240px] sm:min-w-[320px] max-w-md items-center justify-between gap-2 rounded-xl border border-[var(--line-strong)] bg-[var(--surface-solid)] px-3 py-1 text-left text-xs font-semibold text-[var(--ink)] shadow-xs transition-all hover:border-[var(--field)] hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-[var(--field)]/20 cursor-pointer"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <span className="grid h-5 w-5 shrink-0 place-items-center rounded-md bg-[var(--field)] font-data text-[10px] font-bold text-white">
            {selectedWeek}
          </span>
          <span className="truncate font-display font-medium text-[var(--ink)]">
            {isHi ? `सप्ताह ${selectedWeek}: ` : `Week ${selectedWeek}: `}
            <span className="font-semibold">{activeItem?.stageName}</span>
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`shrink-0 text-[var(--ink-faint)] transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[var(--field)]' : ''
          }`}
        />
      </button>

      {/* Aesthetic Popover Menu */}
      {isOpen && (
        <div className="panel-elevated absolute left-0 sm:right-0 sm:left-auto top-full z-50 mt-1.5 max-h-80 w-full min-w-[290px] sm:min-w-[380px] overflow-y-auto rounded-2xl border border-[var(--line)] bg-[var(--surface-solid)] p-1.5 shadow-xl animate-scale-in">
          <div className="px-2.5 py-1.5 border-b border-[var(--line-soft)] mb-1 flex items-center justify-between">
            <span className="t-eyebrow text-[9px] text-[var(--ink-faint)]">
              {isHi ? `कुल ${totalWeeks} सप्ताह उपलब्ध` : `${totalWeeks} Seasonal Weeks`}
            </span>
            <span className="text-[10px] font-semibold text-[var(--grain-deep)]">
              {isHi ? 'सप्ताह चुनें' : 'Select week'}
            </span>
          </div>
          <div className="space-y-0.5">
            {allWeeks.map((item) => {
              const isSelected = item.week === selectedWeek;
              const startDay = (item.week - 1) * 7 + 1;
              const endDay = item.week * 7;
              return (
                <button
                  key={item.week}
                  type="button"
                  onClick={() => {
                    onSelectWeek(item.week);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2.5 rounded-xl px-2.5 py-2 text-left transition-all ${
                    isSelected
                      ? 'bg-[var(--field-tint)] text-[var(--field-deep)] font-semibold ring-1 ring-[var(--field)]/20'
                      : 'text-[var(--ink)] hover:bg-[var(--surface-inset)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1">
                    <span
                      className={`grid h-6 w-6 shrink-0 place-items-center rounded-lg font-data text-[10px] font-bold ${
                        isSelected
                          ? 'bg-[var(--field)] text-white shadow-xs'
                          : 'bg-[var(--surface-inset)] text-[var(--ink-soft)] border border-[var(--line-soft)]'
                      }`}
                    >
                      {item.week}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-xs font-semibold">
                        {isHi ? `सप्ताह ${item.week}: ` : `Week ${item.week}: `}
                        {item.stageName}
                      </div>
                      <div className="mt-0.5 flex items-center gap-2 text-[10px] text-[var(--ink-soft)]">
                        <span className="font-data">
                          {isHi ? `दिन ${startDay}–${endDay}` : `Days ${startDay}–${endDay}`}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-[var(--line-strong)]" />
                        <span className="text-[var(--ink-faint)] font-medium truncate">
                          {item.phaseLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <Check size={14} className="shrink-0 text-[var(--field)] font-bold" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

interface FarmPlanScreenProps {
  userName?: string;
  selectedState: string;
  selectedDistrict: string;
  landAcres: number;
  budgetInr: number;
  season: 'Kharif' | 'Rabi' | 'Zaid';
  decision: FarmDecisionResponse | null;
  loading: boolean;
  onEditDetails: () => void;
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

// palette for allocation segments (theme-aware tokens, matches the twin's language)
const ALLOC_COLORS = [
  'var(--field)',
  'var(--grain)',
  'var(--sky)',
  'var(--field-deep)',
  'var(--soil)',
  'var(--grain-deep)',
];

export function FarmPlanScreen({
  userName,
  selectedState,
  selectedDistrict,
  landAcres,
  budgetInr,
  season,
  decision,
  loading,
  onEditDetails,
  onChangeLocation,
  onProceedToSentinel,
  onLogout,
}: FarmPlanScreenProps) {
  const { language } = useLanguage();
  const isHi = language === 'hi';
  const reduced = usePrefersReducedMotion();

  const [showDetailedModal, setShowDetailedModal] = useState<boolean>(false);
  const [showFull7DayModal, setShowFull7DayModal] = useState<boolean>(false);
  const [activeCrop, setActiveCrop] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);

  // Derived decision values
  const allocatedCrops = decision?.allocated_crops || [];
  const cropNames = allocatedCrops.map((c) => c.crop_name);

  // Weeks & Seasonal Action Plan Calculation
  const totalWeeks = getSeasonWeeksCount(season);
  const clampedWeek = Math.max(1, Math.min(selectedWeek, totalWeeks));
  const currentWeekPlan = getWeeklyActionPlan(season, clampedWeek, language, cropNames);
  const allWeeksSummary = getAllWeeksSummary(season, language, cropNames);
  const farmTotals = decision?.farm_totals;
  const netProfit = farmTotals?.total_expected_net_profit_inr ?? 0;
  const totalInvestment = farmTotals?.total_investment_inr ?? budgetInr;
  const roiPct = farmTotals?.expected_farm_roi_pct ?? 0;
  const riskLabel = farmTotals?.weighted_risk_label?.toUpperCase() || 'LOW';
  // Parse fill strength from the RAW English risk so the meter stays correct even when the label is shown in Hindi.
  const riskLevelNum: 1 | 2 | 3 | 4 = riskLabel.includes('CRIT')
    ? 4
    : riskLabel.includes('HIGH')
      ? 3
      : riskLabel.includes('MOD')
        ? 2
        : 1;

  const allocSegments = allocatedCrops.map((c, i) => ({
    name: getCropDisplayName(c.crop_name, language),
    share: c.acre_share_pct,
    color: ALLOC_COLORS[i % ALLOC_COLORS.length],
  }));

  // Estimated cost breakdown — the backend returns a single total_investment_inr with no
  // category split, so we model a realistic Labor/Fertilizer/Other/Seeds/Irrigation spread
  // over the REAL total and surface it as "Estimated". Percentages sum to 1.00.
  const COST_MODEL: Array<{ key: string; label: string; pct: number; color: string }> = [
    { key: 'labor', label: isHi ? 'मज़दूरी' : 'Labor', pct: 0.26, color: 'var(--field-deep)' },
    { key: 'fertilizer', label: isHi ? 'खाद' : 'Fertilizer', pct: 0.22, color: 'var(--field)' },
    { key: 'other', label: isHi ? 'अन्य लागत' : 'Other inputs', pct: 0.22, color: 'var(--soil)' },
    { key: 'seeds', label: isHi ? 'बीज' : 'Seeds', pct: 0.18, color: 'var(--grain)' },
    { key: 'irrigation', label: isHi ? 'सिंचाई' : 'Irrigation', pct: 0.12, color: 'var(--sky)' },
  ];
  const costSegments = COST_MODEL.map((c) => ({
    name: c.label,
    value: Math.round(totalInvestment * c.pct),
    pct: c.pct,
    color: c.color,
  }));

  // Remount key so the plan-reveal entrance animations replay whenever a new/recalculated plan lands.
  const planKey = decision
    ? `${allocatedCrops.map((c) => c.crop_name).join('-')}|${Math.round(netProfit)}|${Math.round(totalInvestment)}`
    : 'none';
  const cropLine =
    allocatedCrops.length > 0
      ? `${isHi ? 'उगाएं ' : 'Grow '}${allocatedCrops.map((c) => getCropDisplayName(c.crop_name, language)).join(' + ')}`
      : isHi
        ? 'अनुकूलित फसल योजना'
        : 'Optimized crop plan';

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
    <div className="relative flex min-h-screen w-full flex-col justify-between text-[var(--ink)] selection:bg-[var(--grain-tint)] selection:text-[var(--grain-deep)]">
      {/* ===================================================================== */}
      {/* 1. FLOATING JOURNEY NAV — the growth line is gold once a plan exists   */}
      {/* ===================================================================== */}
      <JourneyNav
        stage={3}
        accent="grain"
        userName={userName}
        reachable={[1, 2, 4]}
        onNavigate={(target) => {
          if (target === 1) onChangeLocation();
          if (target === 2) onEditDetails();
          if (target === 4) onProceedToSentinel();
        }}
        onLogout={onLogout}
        actions={
          <>
            {decision && (
              <button
                type="button"
                onClick={() => setShowDetailedModal(true)}
                className="nav-pill flex h-9 items-center gap-1.5 px-3 text-xs font-medium text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
                title={isHi ? 'विस्तृत विश्लेषण' : 'Detailed Analysis'}
              >
                <Layers size={14} className="text-[var(--grain-deep)]" />
                <span className="hidden sm:inline">{isHi ? 'विस्तृत विश्लेषण' : 'Detailed Analysis'}</span>
              </button>
            )}
            <button
              type="button"
              onClick={onProceedToSentinel}
              className="btn btn-primary btn-sm"
            >
              <span>{isHi ? 'सेंटीनेल' : 'Sentinel'}</span>
              <ArrowRight size={13} />
            </button>
          </>
        }
      />

      {/* ===================================================================== */}
      {/* 2. MAIN WORKSPACE                                                      */}
      {/* ===================================================================== */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-24 pt-24 sm:px-8 sm:pt-28 md:pb-8">
        {!decision ? (
          /* ---------- DEFENSIVE: plan still finalizing ---------- */
          <div className="grid min-h-[60vh] place-items-center">
            <div className="flex max-w-md flex-col items-center gap-4 text-center">
              <AIAgentOrb state="analyzing" size={120} />
              <div>
                <h2 className="t-h3 text-[var(--ink)]">
                  {isHi ? 'आपकी योजना तैयार की जा रही है…' : 'Finalizing your plan…'}
                </h2>
                <p className="mt-1 text-sm text-[var(--ink-soft)]">
                  {isHi ? 'कृपया एक क्षण प्रतीक्षा करें।' : 'This will only take a moment.'}
                </p>
              </div>
              <button type="button" onClick={onEditDetails} className="btn-ghost text-sm">
                {isHi ? '← विवरण पर लौटें' : '← Back to details'}
              </button>
            </div>
          </div>
        ) : (
          /* ---------- PLAN REVEAL (full width) ---------- */
          <div className="space-y-6" key={planKey}>
                {/* PLAN SURFACE — cinematic gradient, atmospheric, de-boxed */}
                <Reveal
                  className="relative overflow-hidden rounded-[var(--radius-lg)] p-6 sm:p-8"
                  style={{
                    background: 'linear-gradient(135deg, rgba(231,241,231,0.92) 0%, rgba(255,255,255,0.97) 50%, rgba(248,238,214,0.88) 100%)',
                    boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.95), 0 24px 64px rgb(52 58 44 / 0.10), 0 4px 16px rgb(52 58 44 / 0.04)',
                  }}
                >
                  {/* Atmospheric field glow — top-left */}
                  <div
                    className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full blur-3xl"
                    style={{ background: 'radial-gradient(circle, rgba(70,169,104,0.12) 0%, transparent 70%)' }}
                    aria-hidden
                  />
                  {/* Grain glow — bottom-right */}
                  <div
                    className="pointer-events-none absolute -bottom-16 -right-16 h-64 w-64 rounded-full blur-3xl"
                    style={{ background: 'radial-gradient(circle, rgba(216,166,60,0.12) 0%, transparent 70%)' }}
                    aria-hidden
                  />

                  {/* headline — large brand-gradient block heading with a reveal wipe */}
                  <div className="relative flex flex-wrap items-start justify-between gap-3">
                    <div className="max-w-2xl">
                      <div className="t-eyebrow flex items-center gap-2" style={{ color: 'var(--field)' }}>
                        <span className="relative flex h-1.5 w-1.5">
                          <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-[var(--field)]" />
                          <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--field)]" />
                        </span>
                        {isHi ? `सर्वोत्तम योजना · ${translateSeason(season, language)} 2026` : `Recommended plan · ${translateSeason(season, language)} 2026`}
                      </div>
                      <h2 className="plan-title animate-plan-title mt-3">{cropLine}</h2>
                      <p className="animate-plan-sub mt-3 text-[0.95rem] font-medium text-[var(--ink-soft)]">
                        {landAcres} {isHi ? 'एकड़' : 'acres'} · {getDistrictDisplayName(selectedDistrict, language)}, {getStateDisplayName(selectedState, language)}
                      </p>
                    </div>
                  </div>

                  {/* TWIN + COST — the field and where the money goes, side by side */}
                  <div className="relative mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-0">
                    <div className="relative flex flex-col justify-center lg:col-span-3 lg:pr-7">
                      {/* twin centerpiece — now showing the REAL allocation */}
                      <div className="relative">
                        <FarmDigitalTwin
                          decision={decision}
                          height={380}
                          interactive
                          showWeather
                          scanning={loading}
                          selectedCrop={activeCrop}
                          onSelectCrop={setActiveCrop}
                          className="w-full"
                        />
                        <span className="t-eyebrow absolute bottom-1 left-1 text-[var(--ink-ghost)]">
                          {isHi ? 'आपका डिजिटल फार्म ट्विन' : 'Your digital farm twin'}
                        </span>
                        {/* Floating profit badge — spatially over the twin */}
                        <div
                          className="animate-metric-pop pointer-events-none absolute right-3 top-3 flex flex-col items-end gap-0.5 rounded-2xl p-3"
                          style={{
                            background: 'rgba(255,255,255,0.88)',
                            backdropFilter: 'blur(12px)',
                            boxShadow: '0 4px 18px rgb(52 58 44 / 0.12), inset 0 1px 0 rgba(255,255,255,0.9)',
                          }}
                        >
                          <span className="t-eyebrow text-[0.52rem]">{isHi ? 'अनुमानित लाभ' : 'Est. profit'}</span>
                          <span
                            className="font-display text-base font-semibold leading-none"
                            style={{ color: 'var(--field-deep)' }}
                          >
                            ₹{Math.round(netProfit / 1000)}K
                          </span>
                          <span className="font-data text-[9px] font-semibold" style={{ color: 'var(--grain-deep)' }}>
                            +{roiPct.toFixed(0)}% ROI
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col border-t border-[var(--line)] pt-5 lg:col-span-2 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <div>
                          <h3 className="t-h3 text-[1.05rem] text-[var(--ink)]">
                            {isHi ? 'आपका पैसा कहाँ लगेगा' : 'Where your money goes'}
                          </h3>
                          <p className="mt-1 text-[13px] text-[var(--ink-soft)]">
                            {isHi ? 'अनुमानित कुल लागत' : 'Estimated total cost'} ·{' '}
                            <span className="font-data font-semibold text-[var(--ink)]">
                              ₹{Math.round(totalInvestment).toLocaleString('en-IN')}
                            </span>
                          </p>
                        </div>
                        <span className="chip chip-grain shrink-0 text-[10px]">{isHi ? 'अनुमानित' : 'Estimated'}</span>
                      </div>
                      <div className="mt-5 flex flex-1 flex-col items-center justify-center gap-6">
                        <DonutChart
                          segments={costSegments}
                          size={210}
                          thickness={26}
                          className="shrink-0"
                          centerTop={<Counter value={Math.round(totalInvestment)} prefix="₹" />}
                          centerBottom={isHi ? 'कुल लागत' : 'Total cost'}
                        />
                        <div className="grid w-full grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
                          {costSegments.map((s) => (
                            <div
                              key={s.name}
                              className="flex items-center justify-between gap-3 border-b border-[var(--line)] pb-2"
                            >
                              <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--ink-soft)]">
                                <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
                                {s.name}
                              </span>
                              <span className="font-data text-sm font-semibold text-[var(--ink)]">
                                {Math.round(s.pct * 100)}%
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* animated stats — open, hairline-divided (no inner cards) */}
                  <div className="mt-6 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-[var(--line)] pt-6 lg:grid-cols-4 lg:gap-x-0 lg:divide-x lg:divide-[var(--line)]">
                    <StatBlock
                      label={isHi ? 'कुल अनुमानित लाभ' : 'Expected profit'}
                      value={netProfit}
                      prefix="₹"
                      compactINR
                      tone="field"
                      className="lg:pr-4"
                      sub={formatCurrencyWords(netProfit, language)}
                    />
                    <div className="grid place-items-center lg:px-2">
                      <ProgressRing
                        value={Math.max(0, Math.min(100, roiPct))}
                        size={116}
                        stroke={9}
                        tone="grain"
                        centerTop={<Counter value={roiPct} decimals={0} prefix="+" suffix="%" />}
                        centerBottom={isHi ? 'रिटर्न' : 'ROI'}
                      />
                    </div>
                    <StatBlock
                      label={isHi ? 'कुल निवेश' : 'Total investment'}
                      value={totalInvestment}
                      prefix="₹"
                      compactINR
                      tone="sky"
                      className="lg:px-4"
                      sub={formatCurrencyWords(totalInvestment, language)}
                    />
                    <div className="lg:pl-4">
                      <div className="t-eyebrow mb-2">{isHi ? 'जोखिम स्तर' : 'Risk level'}</div>
                      <RiskMeter
                        label={translateRiskLevel(riskLabel, language)}
                        level={riskLevelNum}
                        caption={`${allocatedCrops.length} ${isHi ? 'फसलें' : 'crops'}`}
                      />
                    </div>
                  </div>

                  {/* allocation bar + legend */}
                  <div className="mt-6 border-t border-[var(--line)] pt-5">
                    <div className="t-eyebrow mb-2.5">{isHi ? 'फसल आवंटन' : 'Crop allocation'}</div>
                    <AllocationBar segments={allocSegments} />
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5">
                      {allocSegments.map((s) => (
                        <span key={s.name} className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--ink-soft)]">
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
                          {s.name} · {s.share.toFixed(0)}%
                        </span>
                      ))}
                    </div>
                  </div>
                </Reveal>

                {/* CROP DETAIL — clean hairline rows (not a 3-col card grid) */}
                <Reveal className="panel p-5 sm:p-6" delay={60}>
                  <h3 className="t-h3 text-[1.05rem] text-[var(--ink)]">
                    {isHi ? 'फसलें, रकबा और अनुमानित लाभ' : 'Crops, acreage & expected profit'}
                  </h3>
                  <div className="mt-3 divide-y divide-[var(--line)]">
                    {allocatedCrops.map((crop, idx) => {
                      const share = crop.acre_share_pct;
                      const isActive = activeCrop === crop.crop_name;
                      return (
                        <button
                          type="button"
                          key={idx}
                          onMouseEnter={() => setActiveCrop(crop.crop_name)}
                          onFocus={() => setActiveCrop(crop.crop_name)}
                          onMouseLeave={() => setActiveCrop(null)}
                          onBlur={() => setActiveCrop(null)}
                          className={`flex w-full items-center gap-4 py-3.5 text-left transition-colors ${isActive ? 'bg-[var(--surface-inset)]' : ''}`}
                        >
                          <span
                            className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl text-xl leaf-radius"
                            style={{ background: 'var(--field-tint)' }}
                          >
                            {getCropIcon(crop.crop_name)}
                          </span>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="truncate font-display text-sm font-semibold text-[var(--ink)]">
                                {getCropDisplayName(crop.crop_name, language)}
                              </span>
                              <span className="shrink-0 font-data text-[11px] text-[var(--ink-faint)]">
                                {crop.allocated_acres.toFixed(1)} {isHi ? 'एकड़' : 'ac'} · {share.toFixed(0)}%
                              </span>
                            </div>
                            {/* per-crop share track */}
                            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[var(--surface-inset)]">
                              <div
                                className="h-full rounded-full"
                                style={{
                                  width: `${Math.max(4, Math.min(100, share))}%`,
                                  background: ALLOC_COLORS[idx % ALLOC_COLORS.length],
                                  transition: reduced ? undefined : 'width 1s var(--ease-out)',
                                }}
                              />
                            </div>
                          </div>

                          <div className="hidden shrink-0 text-right sm:block">
                            <span className="t-eyebrow block text-[0.5rem]">{isHi ? 'लाभ' : 'Profit'}</span>
                            <span className="font-display text-sm font-semibold text-[var(--field-deep)]">
                              {formatCurrency(crop.net_profit_inr, language)}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Reveal>

                {/* 7-DAY ACTION PLAN WITH INTEGRATED WEEK DROPDOWN SELECTOR */}
                <Reveal className="panel p-5 sm:p-6" delay={90}>
                  {/* Top Bar: Title, Season Metadata, Dropdown Box & Navigation */}
                  <div className="flex flex-col gap-3.5 border-b border-[var(--line)] pb-4 md:flex-row md:items-center md:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="grid h-6 w-6 place-items-center rounded-lg bg-[var(--field-tint)] text-[var(--field-deep)]">
                          <Calendar size={13} />
                        </span>
                        <h3 className="t-h3 text-[1.05rem] text-[var(--ink)]">
                          {isHi ? '7-दिवसीय कार्ययोजना' : '7-Day Action Plan'}
                        </h3>
                        <span className="chip chip-field py-0.5 px-2 text-[10px] font-semibold">
                          {translateSeason(season, language)} · {totalWeeks} {isHi ? 'सप्ताह' : 'Weeks'}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-[var(--ink-soft)]">
                        {isHi
                          ? `आपकी फसल योजना (${cropLine}) हेतु साप्ताहिक कृषि कार्य`
                          : `Weekly operational schedule for your farm (${cropLine})`}
                      </p>
                    </div>

                    {/* Dropdown Selector Controls */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedWeek((w) => Math.max(1, w - 1))}
                          disabled={clampedWeek <= 1}
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface-solid)] text-[var(--ink-soft)] transition-colors hover:bg-[var(--paper-2)] hover:text-[var(--ink)] disabled:pointer-events-none disabled:opacity-30"
                          title={isHi ? 'पिछला सप्ताह' : 'Previous week'}
                          aria-label={isHi ? 'पिछला सप्ताह' : 'Previous week'}
                        >
                          <ChevronLeft size={15} />
                        </button>

                        {/* The Aesthetic Dropdown Box */}
                        <WeekDropdown
                          selectedWeek={clampedWeek}
                          totalWeeks={totalWeeks}
                          allWeeks={allWeeksSummary}
                          onSelectWeek={setSelectedWeek}
                          isHi={isHi}
                        />

                        <button
                          type="button"
                          onClick={() => setSelectedWeek((w) => Math.min(totalWeeks, w + 1))}
                          disabled={clampedWeek >= totalWeeks}
                          className="flex h-8 w-8 items-center justify-center rounded-xl border border-[var(--line)] bg-[var(--surface-solid)] text-[var(--ink-soft)] transition-colors hover:bg-[var(--paper-2)] hover:text-[var(--ink)] disabled:pointer-events-none disabled:opacity-30"
                          title={isHi ? 'अगला सप्ताह' : 'Next week'}
                          aria-label={isHi ? 'अगला सप्ताह' : 'Next week'}
                        >
                          <ChevronRight size={15} />
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setShowFull7DayModal(true)}
                        className="btn btn-secondary h-8 px-3 text-xs font-semibold"
                      >
                        {isHi ? 'पूरी योजना →' : 'Full plan →'}
                      </button>
                    </div>
                  </div>

                  {/* Active Week Stage Context Strip */}
                  <div className="mt-3.5 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--line-soft)] bg-[var(--surface-inset)] px-3.5 py-2.5">
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="chip chip-field py-0 px-2 text-[10px] font-bold">
                          {isHi ? `सप्ताह ${clampedWeek}` : `Week ${clampedWeek}`} · {currentWeekPlan.phaseLabel}
                        </span>
                        <span className="font-display text-xs font-bold text-[var(--ink)]">
                          {currentWeekPlan.stageName}
                        </span>
                        <span className="text-[10px] font-data text-[var(--ink-faint)]">
                          ({isHi
                            ? `दिन ${(clampedWeek - 1) * 7 + 1}–${clampedWeek * 7}`
                            : `Days ${(clampedWeek - 1) * 7 + 1}–${clampedWeek * 7}`})
                        </span>
                      </div>
                      <p className="mt-1 text-xs text-[var(--ink-soft)]">
                        {currentWeekPlan.summary}
                      </p>
                    </div>
                  </div>

                  {/* 7-Day Connected Horizontal Timeline */}
                  <div className="mt-4 flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                    {currentWeekPlan.days.map((step, i) => {
                      const isLast = i === currentWeekPlan.days.length - 1;
                      return (
                        <div key={step.day} className="relative flex min-w-[124px] flex-1 flex-col">
                          {/* Clean connector line running between nodes */}
                          {!isLast && (
                            <span
                              className="absolute left-6 -right-3 top-[10px] hidden h-[1.5px] bg-[var(--line-strong)] sm:block"
                              aria-hidden
                            />
                          )}
                          <div className="flex items-center gap-1.5">
                            <span className="relative z-10 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[var(--field)] font-data text-[9px] font-bold text-white ring-2 ring-[var(--surface-solid)] shadow-2xs">
                              {step.day}
                            </span>
                            <span className="t-eyebrow relative z-10 rounded-md bg-[var(--surface-solid)] px-1 text-[0.55rem] font-bold text-[var(--ink-soft)] shadow-2xs">
                              {isHi ? `दिन ${step.day}` : `Day ${step.day}`}
                            </span>
                          </div>
                          <h4 className="mt-2 text-xs font-semibold text-[var(--ink)]">{step.title}</h4>
                          <p className="mt-0.5 text-[10px] leading-tight text-[var(--ink-soft)]">{step.desc}</p>
                        </div>
                      );
                    })}
                  </div>
                </Reveal>

                {/* DEEPER — the full scientific & mathematical breakdown */}
                <Reveal className="flex justify-end" delay={120}>
                  <button
                    type="button"
                    onClick={() => setShowDetailedModal(true)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--grain-deep)] transition-colors hover:text-[var(--field)]"
                  >
                    {isHi ? 'वैज्ञानिक व गणितीय विश्लेषण देखें →' : 'See the scientific & mathematical analysis →'}
                  </button>
                </Reveal>

                {/* SENTINEL CTA — de-boxed gradient banner with the intelligence core */}
                <Reveal
                  className="relative flex flex-col items-center justify-between gap-4 overflow-hidden rounded-3xl border border-[var(--grain-tint)] p-5 sm:flex-row sm:p-6"
                  delay={150}
                  style={{ background: 'linear-gradient(100deg, var(--grain-tint), var(--surface))' }}
                >
                  <div className="flex items-center gap-4">
                    <AIAgentOrb state="idle" size={52} />
                    <div>
                      <h3 className="t-h3 text-[1.05rem] text-[var(--ink)]">
                        {isHi ? 'स्वायत्त सेंटीनेल सक्रिय करें' : 'Activate the autonomous Sentinel'}
                      </h3>
                      <p className="mt-0.5 max-w-lg text-xs text-[var(--ink-soft)]">
                        {isHi
                          ? 'योजना बनने के बाद सेंटीनेल मौसम, फसल तनाव और मंडी भाव की 24/7 निगरानी करता है।'
                          : 'Once the plan is set, Sentinel watches weather, crop stress and mandi prices 24/7.'}
                      </p>
                    </div>
                  </div>

                  <MagneticButton
                    type="button"
                    onClick={onProceedToSentinel}
                    className="btn btn-primary group shrink-0 text-sm"
                  >
                    <span>{isHi ? 'सेंटीनेल चालू करें' : 'Proceed to Sentinel'}</span>
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </MagneticButton>
                </Reveal>
              </div>
            )}
      </main>

      {/* ===================================================================== */}
      {/* 3. FULL 7-DAY ACTION PLAN MODAL                                        */}
      {/* ===================================================================== */}
      {showFull7DayModal && (
        <div className="scrim fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="panel-modal max-h-[88vh] w-full max-w-2xl space-y-4 overflow-y-auto p-6">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div>
                <h3 className="font-display text-lg font-semibold text-[var(--ink)]">
                  {isHi
                    ? `सप्ताह ${clampedWeek} की विस्तृत कार्ययोजना (${totalWeeks} में से)`
                    : `Comprehensive 7-Day Plan · Week ${clampedWeek} of ${totalWeeks}`}
                </h3>
                <p className="text-xs text-[var(--ink-soft)]">
                  {translateSeason(season, language)} · {currentWeekPlan.stageName} (
                  {isHi ? `दिन ${(clampedWeek - 1) * 7 + 1}–${clampedWeek * 7}` : `Days ${(clampedWeek - 1) * 7 + 1}–${clampedWeek * 7}`})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFull7DayModal(false)}
                className="rounded-full p-1 text-[var(--ink-soft)] hover:bg-[var(--surface-inset)]"
                aria-label={isHi ? 'बंद करें' : 'Close'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Aesthetic Dropdown Week Switcher in Modal */}
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-[var(--surface-inset)] p-2.5">
              <span className="text-xs font-semibold text-[var(--ink-soft)]">
                {isHi ? 'सप्ताह चुनें:' : 'Select Week:'}
              </span>
              <WeekDropdown
                selectedWeek={clampedWeek}
                totalWeeks={totalWeeks}
                allWeeks={allWeeksSummary}
                onSelectWeek={setSelectedWeek}
                isHi={isHi}
                className="flex-1 max-w-md"
              />
            </div>

            <div className="space-y-3">
              {currentWeekPlan.days.map((step) => (
                <div
                  key={step.day}
                  className="flex items-start gap-3 rounded-xl border border-[var(--line)] bg-[var(--surface-inset)] p-3.5"
                >
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-[var(--field)] text-xs font-semibold text-white">
                    {step.day}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <h4 className="text-xs font-semibold text-[var(--ink)]">{step.title}</h4>
                      <span className="shrink-0 font-data text-[10px] text-[var(--ink-faint)]">
                        {isHi ? `दिन ${step.day}` : `Day ${step.day}`}
                      </span>
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--ink-soft)]">{step.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedWeek((w) => Math.max(1, w - 1))}
                  disabled={clampedWeek <= 1}
                  className="btn btn-secondary px-3 py-1.5 text-xs disabled:opacity-30"
                >
                  ← {isHi ? 'पिछला' : 'Prev Week'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedWeek((w) => Math.min(totalWeeks, w + 1))}
                  disabled={clampedWeek >= totalWeeks}
                  className="btn btn-secondary px-3 py-1.5 text-xs disabled:opacity-30"
                >
                  {isHi ? 'अगला' : 'Next Week'} →
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowFull7DayModal(false)}
                className="btn btn-primary px-4 py-2 text-xs"
              >
                {isHi ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* 4. DETAILED EXPERT ANALYSIS MODAL                                      */}
      {/* ===================================================================== */}
      {showDetailedModal && decision && (
        <div className="scrim fixed inset-0 z-50 flex items-center justify-center px-2 sm:px-4">
          <div className="panel-modal max-h-[92vh] w-full max-w-5xl space-y-4 overflow-y-auto p-4 text-[var(--ink)] sm:p-6">
            <div className="flex items-center justify-between border-b border-[var(--line)] pb-3">
              <div className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-[var(--grain-tint)] text-lg text-[var(--grain-deep)]">
                  🔬
                </span>
                <div>
                  <h3 className="font-display text-base font-semibold text-[var(--ink)] sm:text-lg">
                    {isHi ? 'वैज्ञानिक एवं गणितीय निर्णय विश्लेषण' : 'Expert Decision & Optimization Analysis'}
                  </h3>
                  <p className="text-xs text-[var(--ink-soft)]">
                    HiGHS Simplex Engine • ICAR Scientific Agronomy • Open-Meteo Professional Telemetry
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setShowDetailedModal(false)}
                className="rounded-full border border-[var(--line)] bg-[var(--surface-inset)] p-2 text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
                aria-label={isHi ? 'बंद करें' : 'Close'}
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
      {/* 5. FOOTER                                                              */}
      {/* ===================================================================== */}
      <footer className="border-t border-[var(--line)] px-4 py-3 text-xs text-[var(--ink-soft)] sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-[11px]">
          <span>{isHi ? 'ICAR कृषि इंजन एवं रीयल-टाइम मंडी डेटा द्वारा संचालित' : 'Powered by ICAR Agronomy Engine & Real-time Mandi Telemetry'}</span>
          <span>© 2026 AgriOptima AI</span>
        </div>
      </footer>
    </div>
  );
}
