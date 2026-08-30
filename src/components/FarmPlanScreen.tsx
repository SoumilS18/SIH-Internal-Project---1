import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ArrowRight,
  Layers,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Check,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { JourneyNav } from '@/components/JourneyNav';
import { getCropDisplayName } from '@/i18n/cropNames';
import { getStateDisplayName, getDistrictDisplayName } from '@/i18n/geoNames';
import { formatCurrency, formatCurrencyWords } from '@/i18n/formatters';
import { translateRiskLevel, translateSeason } from '@/i18n/enums';
import { DetailedAnalysisView } from '@/components/DetailedAnalysisView';
import { FarmDigitalTwin } from '@/components/FarmDigitalTwin';
import { StatBlock, ProgressRing, AllocationBar, RiskMeter, DonutChart } from '@/components/ui/dataviz';
import { Reveal, MagneticButton, Counter } from '@/components/ui/motion';
import { ReadingRow } from '@/components/ui/ReadingRow';
import { CropStandArt } from '@/components/ui/CropStandArt';
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

/**
 * The week switcher. Behaviour is unchanged — a listbox over every week of the
 * real season — but it now reads as a line of type with a caret rather than a
 * bordered control, so the schedule strip stays part of the sheet.
 */
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
    <div className={`relative ${className} ${isOpen ? 'z-[100]' : 'z-10'}`} ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex h-8 w-full min-w-[228px] max-w-md items-center justify-between gap-2 border-b border-[var(--line)] px-0.5 text-left text-[13px] text-[var(--ink)] transition-colors hover:border-[var(--field)] focus-visible:border-[var(--field)] focus-visible:outline-none sm:min-w-[300px]"
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="flex min-w-0 flex-1 items-baseline gap-2">
          <span className="font-data shrink-0 text-[11px] font-semibold text-[var(--field)]">
            {String(selectedWeek).padStart(2, '0')}
          </span>
          <span className="truncate">
            <span className="text-[var(--ink-soft)]">{isHi ? 'सप्ताह · ' : 'Week · '}</span>
            <span className="font-semibold">{activeItem?.stageName}</span>
          </span>
        </span>
        <ChevronDown
          size={14}
          className={`shrink-0 text-[var(--ink-ghost)] transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-[var(--field)]' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="panel-elevated animate-scale-in absolute left-0 top-full z-50 mt-2 max-h-80 w-full min-w-[290px] overflow-y-auto p-1.5 sm:min-w-[380px] bg-[var(--surface-elevated)] border border-[var(--line)] shadow-[0_20px_50px_rgba(0,0,0,0.14)]">
          <div className="mb-1 sticky top-0 z-10 flex items-center justify-between border-b border-[var(--line-soft)] bg-[var(--surface-elevated)] px-2.5 py-1.5">
            <span className="t-eyebrow text-[9px] text-[var(--ink-ghost)]">
              {isHi ? `कुल ${totalWeeks} सप्ताह` : `${totalWeeks} seasonal weeks`}
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
                  aria-pressed={isSelected}
                  onClick={() => {
                    onSelectWeek(item.week);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center justify-between gap-2.5 rounded-[14px] px-2.5 py-2 text-left transition-colors ${
                    isSelected
                      ? 'bg-[var(--field-tint)] font-semibold text-[var(--field-deep)]'
                      : 'text-[var(--ink)] hover:bg-[var(--surface-inset)]'
                  }`}
                >
                  <span className="flex min-w-0 flex-1 items-baseline gap-2.5">
                    <span
                      className={`font-data shrink-0 text-[11px] font-semibold ${
                        isSelected ? 'text-[var(--field)]' : 'text-[var(--ink-ghost)]'
                      }`}
                    >
                      {String(item.week).padStart(2, '0')}
                    </span>
                    <span className="block min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold">{item.stageName}</span>
                      <span className="mt-0.5 flex items-center gap-2 text-[10px] text-[var(--ink-soft)]">
                        <span className="font-data">
                          {isHi ? `दिन ${startDay}–${endDay}` : `Days ${startDay}–${endDay}`}
                        </span>
                        <span className="h-1 w-1 rounded-full bg-[var(--line-strong)]" />
                        <span className="truncate font-medium text-[var(--ink-faint)]">
                          {item.phaseLabel}
                        </span>
                      </span>
                    </span>
                  </span>
                  {isSelected && <Check size={14} className="shrink-0 text-[var(--field)]" />}
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

// palette for allocation segments — the same order the twin tints its plots in,
// so a colour means the same crop in the field, the bar and the key.
const ALLOC_COLORS = [
  'var(--field)',
  'var(--grain)',
  'var(--sky)',
  'var(--field-deep)',
  'var(--soil)',
  'var(--grain-deep)',
];

/**
 * A section label on a drawing sheet: caps, then a rule running to the edge.
 * Deliberately un-numbered — the parts of a plan are not a sequence the way the
 * five planning questions are, so numbering them would be decoration.
 */
function SheetHead({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="relative z-20 flex flex-wrap items-end justify-between gap-x-5 gap-y-3">
      <div className="flex min-w-0 flex-1 items-baseline gap-3">
        <h3 className="t-eyebrow shrink-0 text-[0.66rem] text-[var(--ink-soft)]">{title}</h3>
        <span className="h-px min-w-4 flex-1 -translate-y-[3px]" style={{ background: 'var(--line)' }} aria-hidden />
      </div>
      {children}
    </div>
  );
}

/**
 * THE ISSUED SHEET — the plan reveal.
 *
 * A plan is a document, so this page is drawn as one: a title block that names
 * the drawing and registers the facts it was drawn for, then the field itself
 * with the money beside it, then the outcome dimensions, then a key that maps
 * every colour in the field to a crop, then the schedule. Hairlines and section
 * rules carry the structure — there are no cards, no gradient plates and no
 * second AI floating on the page; the intelligence lives inside the twin.
 *
 * Every number is real payload. The one modelled figure (the cost split) is
 * labelled "Estimated" because the backend returns a single total.
 */
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
  // Pointing at a crop in the key previews it in the field; clicking pins it.
  // Kept separate so `aria-pressed` reports the pinned state, not the hover.
  const [hoverCrop, setHoverCrop] = useState<string | null>(null);
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const shownCrop = hoverCrop ?? activeCrop;

  // Derived decision values
  const allocatedCrops = decision?.allocated_crops || [];
  const cropNames = allocatedCrops.map((c) => c.crop_name).filter(Boolean);

  // Weeks & Seasonal Action Plan Calculation
  const totalWeeks = getSeasonWeeksCount(season);
  const clampedWeek = Math.max(1, Math.min(selectedWeek, totalWeeks));
  // The seasonal plan tables only exist in these two languages; every other
  // locale falls back to English rather than rendering blank stages.
  const planLang: 'en' | 'hi' = isHi ? 'hi' : 'en';
  const currentWeekPlan = getWeeklyActionPlan(season, clampedWeek, planLang, cropNames);
  const allWeeksSummary = getAllWeeksSummary(season, planLang, cropNames);
  const farmTotals = decision?.farm_totals;
  const netProfit = farmTotals?.total_expected_net_profit_inr ?? 0;
  const totalInvestment = typeof farmTotals?.total_investment_inr === 'number' ? farmTotals.total_investment_inr : (budgetInr || 0);
  const roiPct = farmTotals?.expected_farm_roi_pct ?? 0;
  const riskLabel = (farmTotals?.weighted_risk_label || 'LOW').toUpperCase();
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
    share: typeof c.acre_share_pct === 'number' ? c.acre_share_pct : 0,
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

  // Title-block registry — the facts this drawing was made for. All real payload.
  const plantedAcres = typeof farmTotals?.total_allocated_acres === 'number' ? farmTotals.total_allocated_acres : (landAcres || 0);
  const fallowAcres = typeof farmTotals?.fallow_acres === 'number' ? farmTotals.fallow_acres : Math.max(0, (landAcres || 0) - plantedAcres);
  const budgetUsedPct = typeof farmTotals?.budget_utilization_pct === 'number'
    ? farmTotals.budget_utilization_pct
    : budgetInr > 0 ? (totalInvestment / budgetInr) * 100 : 100;

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
            <button type="button" onClick={onProceedToSentinel} className="btn btn-primary btn-sm">
              <span>{isHi ? 'सेंटीनेल' : 'Sentinel'}</span>
              <ArrowRight size={13} />
            </button>
          </>
        }
      />

      {/* ===================================================================== */}
      {/* 2. THE SHEET                                                           */}
      {/* ===================================================================== */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-5 pb-24 pt-24 sm:px-8 sm:pt-28 md:pb-10">
        {!decision ? (
          /* ---------- DEFENSIVE: plan still finalizing ---------- */
          <div className="grid min-h-[60vh] place-items-center">
            <div className="w-full max-w-xl text-center">
              <FarmDigitalTwin height={260} showWeather aiState="analyzing" className="w-full" />
              <h2 className="t-h3 mt-6 text-[var(--ink)]">
                {isHi ? 'आपकी योजना तैयार की जा रही है…' : 'Finalizing your plan…'}
              </h2>
              <p className="mt-1.5 text-sm text-[var(--ink-soft)]">
                {isHi ? 'कृपया एक क्षण प्रतीक्षा करें।' : 'This will only take a moment.'}
              </p>
              <button type="button" onClick={onEditDetails} className="btn btn-ghost btn-sm mt-5">
                <ChevronLeft size={13} />
                {isHi ? 'विवरण पर लौटें' : 'Back to details'}
              </button>
            </div>
          </div>
        ) : (
          /* ---------- THE PLAN, ISSUED ---------- */
          <div className="space-y-12" key={planKey}>
            {/* =============================================================== */}
            {/* TITLE BLOCK — what this drawing is, and what it was drawn for    */}
            {/* =============================================================== */}
            <Reveal className="border-b border-[var(--line)] pb-8">
              <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
                <div className="lg:col-span-7">
                  <div className="t-eyebrow flex items-center gap-2" style={{ color: 'var(--field)' }}>
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-[var(--field)]" />
                      <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--field)]" />
                    </span>
                    {isHi
                      ? `योजना जारी · ${translateSeason(season, language)} 2026`
                      : `Plan issued · ${translateSeason(season, language)} 2026`}
                  </div>

                  <h2 className="plan-title animate-plan-title mt-3">{cropLine}</h2>

                  {decision.explanation?.headline && (
                    <p className="animate-plan-sub mt-3.5 max-w-xl text-[0.95rem] leading-relaxed text-[var(--ink-soft)]">
                      {decision.explanation.headline}
                    </p>
                  )}
                </div>

                {/* the registry — the same fact row used on the location and
                    planning pages, so the sheet reads back in a familiar hand */}
                <div className="space-y-3 lg:col-span-5 lg:border-l lg:border-[var(--line)] lg:pl-10">
                  <ReadingRow
                    label={isHi ? 'मौसम' : 'Season'}
                    value={`${translateSeason(season, language)} 2026`}
                  />
                  <ReadingRow
                    label={isHi ? 'स्थान' : 'Location'}
                    value={`${getDistrictDisplayName(selectedDistrict, language)}, ${getStateDisplayName(selectedState, language)}`}
                  />
                  <ReadingRow
                    label={isHi ? 'बोया गया' : 'Planted'}
                    value={
                      isHi
                        ? `${plantedAcres.toFixed(1)} / ${landAcres} एकड़`
                        : `${plantedAcres.toFixed(1)} of ${landAcres} acres`
                    }
                  />
                  {fallowAcres > 0.05 && (
                    <ReadingRow
                      label={isHi ? 'परती' : 'Left fallow'}
                      value={`${fallowAcres.toFixed(1)} ${isHi ? 'एकड़' : 'acres'}`}
                    />
                  )}
                  {typeof budgetUsedPct === 'number' && (
                    <ReadingRow
                      label={isHi ? 'बजट उपयोग' : 'Budget used'}
                      value={`${budgetUsedPct.toFixed(0)}%`}
                    />
                  )}
                </div>
              </div>
            </Reveal>

            {/* =============================================================== */}
            {/* THE DRAWING — the field, and the money, side by side             */}
            {/* =============================================================== */}
            <Reveal delay={60}>
              <div className="grid grid-cols-1 gap-8 lg:grid-cols-5 lg:gap-0">
                {/* the field */}
                <div className="relative flex flex-col justify-center lg:col-span-3 lg:pr-10">
                  <FarmDigitalTwin
                    decision={decision}
                    height={400}
                    interactive
                    showWeather
                    scanning={loading}
                    selectedCrop={shownCrop}
                    onSelectCrop={setActiveCrop}
                    className="w-full"
                  />

                  <div className="mt-1 flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--field)]" aria-hidden />
                    <span className="t-eyebrow text-[0.6rem] text-[var(--ink-ghost)]">
                      {isHi
                        ? 'आपका डिजिटल फार्म ट्विन · खेत पर टैप करें'
                        : 'Your digital farm twin · tap a plot'}
                    </span>
                  </div>
                </div>

                {/* the money */}
                <div className="flex flex-col border-t border-[var(--line)] pt-8 lg:col-span-2 lg:border-l lg:border-t-0 lg:pl-10 lg:pt-0">
                  <SheetHead title={isHi ? 'आपका पैसा कहाँ लगेगा' : 'Where your money goes'}>
                    <span className="chip chip-grain shrink-0 text-[10px]">
                      {isHi ? 'अनुमानित' : 'Estimated'}
                    </span>
                  </SheetHead>

                  <div className="mt-6 flex flex-1 flex-col items-center justify-center gap-7">
                    <DonutChart
                      segments={costSegments}
                      size={210}
                      thickness={24}
                      className="shrink-0"
                      centerTop={<Counter value={Math.round(totalInvestment)} prefix="₹" />}
                      centerBottom={isHi ? 'कुल लागत' : 'Total cost'}
                    />
                    <div className="grid w-full grid-cols-1 gap-x-8 gap-y-0.5 sm:grid-cols-2 lg:grid-cols-1">
                      {costSegments.map((s) => (
                        <div
                          key={s.name}
                          className="flex items-center justify-between gap-3 border-b border-[var(--line-soft)] py-2"
                        >
                          <span className="inline-flex items-center gap-2 text-[13px] text-[var(--ink-soft)]">
                            <span className="h-2 w-2 rounded-full" style={{ background: s.color }} />
                            {s.name}
                          </span>
                          <span className="font-data text-[13px] font-semibold text-[var(--ink)]">
                            {Math.round(s.pct * 100)}%
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ---- the outcome dimensions, under the whole drawing ---- */}
              <div className="mt-9 grid grid-cols-2 gap-x-6 gap-y-8 border-t border-[var(--line)] pt-8 lg:grid-cols-4 lg:gap-x-0 lg:divide-x lg:divide-[var(--line)]">
                <StatBlock
                  label={isHi ? 'कुल अनुमानित लाभ' : 'Expected profit'}
                  value={netProfit}
                  prefix="₹"
                  compactINR
                  tone="field"
                  className="lg:pr-6"
                  sub={formatCurrencyWords(netProfit, language)}
                />
                <div className="grid place-items-center lg:px-2">
                  <ProgressRing
                    value={Math.max(0, Math.min(100, roiPct))}
                    size={116}
                    stroke={8}
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
                  className="lg:px-6"
                  sub={formatCurrencyWords(totalInvestment, language)}
                />
                <div className="lg:pl-6">
                  <div className="t-eyebrow mb-2.5">{isHi ? 'जोखिम स्तर' : 'Risk level'}</div>
                  <RiskMeter
                    label={translateRiskLevel(riskLabel, language)}
                    level={riskLevelNum}
                    caption={`${allocatedCrops.length} ${isHi ? 'फसलें' : 'crops'}`}
                  />
                </div>
              </div>
            </Reveal>

            {/* =============================================================== */}
            {/* THE KEY — every colour in the field, named                      */}
            {/* =============================================================== */}
            <Reveal delay={90}>
              <SheetHead title={isHi ? 'फसल कुंजी · रकबा और लाभ' : 'Key · acreage and profit'}>
                <span className="t-eyebrow text-[0.6rem] text-[var(--ink-ghost)]">
                  {isHi ? 'खेत में यही रंग दिखता है' : 'Same colours as the field'}
                </span>
              </SheetHead>

              {/* the land strip: one bar, every crop's share of the ground */}
              <div className="mt-5">
                <AllocationBar segments={allocSegments} />
              </div>

              <div className="mt-2">
                {allocatedCrops.map((crop, idx) => {
                  const share = typeof crop.acre_share_pct === 'number' ? crop.acre_share_pct : 0;
                  const acres = typeof crop.allocated_acres === 'number' ? crop.allocated_acres : 0;
                  const profit = typeof crop.net_profit_inr === 'number' ? crop.net_profit_inr : 0;
                  const isPinned = activeCrop === crop.crop_name;
                  const isShown = shownCrop === crop.crop_name;
                  const color = ALLOC_COLORS[idx % ALLOC_COLORS.length];
                  return (
                    <button
                      type="button"
                      key={idx}
                      onClick={() => setActiveCrop(isPinned ? null : crop.crop_name)}
                      onMouseEnter={() => setHoverCrop(crop.crop_name)}
                      onMouseLeave={() => setHoverCrop(null)}
                      onFocus={() => setHoverCrop(crop.crop_name)}
                      onBlur={() => setHoverCrop(null)}
                      aria-pressed={isPinned}
                      className={`flex w-full items-end gap-4 border-b py-3 text-left transition-colors focus-visible:bg-[var(--surface-inset)] focus-visible:outline-none sm:gap-6 ${
                        isShown ? 'border-[var(--field)]' : 'border-[var(--line-soft)]'
                      }`}
                    >
                      {/* the crop, standing on the ground line — the same
                          morphology the twin grows in the field */}
                      <span className="flex h-[46px] w-[26px] shrink-0 items-end justify-center">
                        <CropStandArt name={crop.crop_name} delayMs={idx * 90} scale={0.62} />
                      </span>

                      <span className="block min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="flex min-w-0 items-baseline gap-2">
                            <span
                              className="h-2 w-2 shrink-0 -translate-y-px rounded-full"
                              style={{ background: color }}
                              aria-hidden
                            />
                            <span
                              className={`truncate text-[15px] transition-colors ${
                                isShown ? 'font-semibold text-[var(--field-deep)]' : 'font-medium text-[var(--ink)]'
                              }`}
                            >
                              {getCropDisplayName(crop.crop_name, language)}
                            </span>
                            {isPinned && <Check size={12} className="shrink-0 text-[var(--field)]" />}
                          </span>
                          <span className="font-data shrink-0 text-[11px] text-[var(--ink-faint)]">
                            {acres.toFixed(1)} {isHi ? 'एकड़' : 'ac'} · {share.toFixed(0)}%
                          </span>
                        </span>

                        {/* dimension line — this crop's share of the land */}
                        <span className="mt-2 block h-[3px] w-full rounded-full bg-[var(--surface-inset)]">
                          <span
                            className="block h-full rounded-full"
                            style={{
                              width: `${Math.max(3, Math.min(100, share))}%`,
                              background: color,
                              transition: reduced ? undefined : 'width 1s var(--ease-out)',
                            }}
                          />
                        </span>
                      </span>

                      <span className="hidden shrink-0 text-right sm:block">
                        <span className="t-eyebrow block text-[0.52rem] text-[var(--ink-ghost)]">
                          {isHi ? 'लाभ' : 'Profit'}
                        </span>
                        <span className="block text-[15px] font-medium text-[var(--field-deep)]">
                          {formatCurrency(profit, language)}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </Reveal>

            {/* =============================================================== */}
            {/* THE SCHEDULE — what to do, week by week                         */}
            {/* =============================================================== */}
            <Reveal delay={120} className="relative z-20">
              <SheetHead title={isHi ? 'कार्य अनुसूची' : 'Work schedule'}>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedWeek((w) => Math.max(1, w - 1))}
                    disabled={clampedWeek <= 1}
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--ink-soft)] transition-colors hover:bg-[var(--surface-inset)] hover:text-[var(--ink)] disabled:pointer-events-none disabled:opacity-25"
                    title={isHi ? 'पिछला सप्ताह' : 'Previous week'}
                    aria-label={isHi ? 'पिछला सप्ताह' : 'Previous week'}
                  >
                    <ChevronLeft size={16} />
                  </button>

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
                    className="flex h-8 w-8 items-center justify-center rounded-full text-[var(--ink-soft)] transition-colors hover:bg-[var(--surface-inset)] hover:text-[var(--ink)] disabled:pointer-events-none disabled:opacity-25"
                    title={isHi ? 'अगला सप्ताह' : 'Next week'}
                    aria-label={isHi ? 'अगला सप्ताह' : 'Next week'}
                  >
                    <ChevronRight size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowFull7DayModal(true)}
                    className="btn btn-ghost btn-sm"
                  >
                    {isHi ? 'पूरी योजना' : 'Full plan'}
                    <ArrowRight size={13} />
                  </button>
                </div>
              </SheetHead>

              {/* the active week, stated on a rule rather than in a tinted box */}
              <div className="mt-5 border-l-2 border-[var(--field)] pl-4">
                <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                  <span className="font-data text-[11px] font-semibold text-[var(--field)]">
                    {isHi
                      ? `सप्ताह ${clampedWeek} / ${totalWeeks}`
                      : `Week ${clampedWeek} / ${totalWeeks}`}
                  </span>
                  <span className="text-[15px] font-medium text-[var(--ink)]">
                    {currentWeekPlan.stageName}
                  </span>
                  <span className="text-[11px] text-[var(--ink-ghost)]">
                    {currentWeekPlan.phaseLabel}
                  </span>
                  <span className="font-data text-[11px] text-[var(--ink-ghost)]">
                    {isHi
                      ? `दिन ${(clampedWeek - 1) * 7 + 1}–${clampedWeek * 7}`
                      : `Days ${(clampedWeek - 1) * 7 + 1}–${clampedWeek * 7}`}
                  </span>
                </div>
                <p className="mt-1.5 max-w-3xl text-[13px] leading-relaxed text-[var(--ink-soft)]">
                  {currentWeekPlan.summary}
                </p>
              </div>

              {/* seven days on one continuous rule — a schedule, not seven cards */}
              <div className="no-scrollbar mt-7 overflow-x-auto pb-1 relative z-0">
                <div className="relative z-0 flex min-w-[720px] gap-4">
                  {/* the rule the whole week hangs from */}
                  <span
                    className="absolute left-2 right-2 top-[5px] h-px z-0"
                    style={{ background: 'var(--line)' }}
                    aria-hidden
                  />
                  {currentWeekPlan.days.map((step, i) => (
                    <div key={step.day} className="relative z-0 flex flex-1 flex-col">
                      <span
                        className="relative z-0 h-[11px] w-[11px] rounded-full"
                        style={{
                          background: i === 0 ? 'var(--field)' : 'var(--surface-solid)',
                          boxShadow: `inset 0 0 0 ${i === 0 ? 0 : 1.5}px var(--field)`,
                        }}
                        aria-hidden
                      />
                      <span className="t-eyebrow mt-3 text-[0.55rem] text-[var(--ink-ghost)]">
                        {isHi ? `दिन ${step.day}` : `Day ${step.day}`}
                      </span>
                      <h4 className="mt-1 text-[13px] font-semibold leading-snug text-[var(--ink)]">
                        {step.title}
                      </h4>
                      <p className="mt-1 pr-3 text-[11px] leading-relaxed text-[var(--ink-soft)]">
                        {step.desc}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </Reveal>

            {/* =============================================================== */}
            {/* THE ISSUE LINE — hand the sheet over to the Sentinel             */}
            {/* =============================================================== */}
            <Reveal
              className="flex flex-col gap-6 border-t border-[var(--line)] pt-8 sm:flex-row sm:items-center sm:justify-between"
              delay={150}
            >
              <div className="max-w-xl">
                <div className="t-eyebrow flex items-center gap-2 text-[var(--grain-deep)]">
                  <span className="animate-breathe h-1.5 w-1.5 rounded-full bg-[var(--grain)]" aria-hidden />
                  {isHi ? 'अगला चरण' : 'Next'}
                </div>
                <h3 className="t-h3 mt-2 text-[1.15rem] text-[var(--ink)]">
                  {isHi ? 'स्वायत्त सेंटीनेल सक्रिय करें' : 'Activate the autonomous Sentinel'}
                </h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--ink-soft)]">
                  {isHi
                    ? 'योजना बनने के बाद सेंटीनेल मौसम, फसल तनाव और मंडी भाव की 24/7 निगरानी करता है — और बदलाव होने पर आपको बताता है।'
                    : 'With the plan set, Sentinel watches weather, crop stress and mandi prices 24/7 — and tells you when something changes.'}
                </p>
                <button
                  type="button"
                  onClick={() => setShowDetailedModal(true)}
                  className="mt-3 inline-flex items-center gap-1.5 border-b border-[var(--line-strong)] pb-0.5 text-xs font-semibold text-[var(--ink-soft)] transition-colors hover:border-[var(--field)] hover:text-[var(--field-deep)]"
                >
                  {isHi ? 'वैज्ञानिक व गणितीय विश्लेषण देखें' : 'See the scientific & mathematical analysis'}
                  <ArrowRight size={12} />
                </button>
              </div>

              <MagneticButton
                type="button"
                onClick={onProceedToSentinel}
                className="btn btn-primary btn-lg group shrink-0"
              >
                <span>{isHi ? 'सेंटीनेल चालू करें' : 'Proceed to Sentinel'}</span>
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </MagneticButton>
            </Reveal>
          </div>
        )}
      </main>

      {/* ===================================================================== */}
      {/* 3. FULL 7-DAY ACTION PLAN MODAL                                        */}
      {/* ===================================================================== */}
      {showFull7DayModal && typeof document !== 'undefined' && createPortal(
        <div
          className="scrim fixed inset-0 z-[100] flex items-center justify-center p-4 animate-fade overflow-y-auto cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowFull7DayModal(false);
          }}
        >
          <div className="panel-modal my-auto max-h-[88vh] w-full max-w-2xl space-y-5 overflow-y-auto p-6 shadow-2xl cursor-auto">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] pb-4">
              <div>
                <h3 className="t-h3 text-[1.15rem] text-[var(--ink)]">
                  {isHi
                    ? `सप्ताह ${clampedWeek} की विस्तृत कार्ययोजना`
                    : `Full 7-day plan · Week ${clampedWeek} of ${totalWeeks}`}
                </h3>
                <p className="mt-1 text-xs text-[var(--ink-soft)]">
                  {translateSeason(season, language)} · {currentWeekPlan.stageName} ·{' '}
                  <span className="font-data">
                    {isHi
                      ? `दिन ${(clampedWeek - 1) * 7 + 1}–${clampedWeek * 7}`
                      : `Days ${(clampedWeek - 1) * 7 + 1}–${clampedWeek * 7}`}
                  </span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFull7DayModal(false)}
                className="rounded-full p-1 text-[var(--ink-soft)] transition-colors hover:bg-[var(--surface-inset)] hover:text-[var(--ink)] cursor-pointer"
                aria-label={isHi ? 'बंद करें' : 'Close'}
              >
                <X size={18} />
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <span className="t-eyebrow text-[0.6rem] text-[var(--ink-ghost)]">
                {isHi ? 'सप्ताह चुनें' : 'Select week'}
              </span>
              <WeekDropdown
                selectedWeek={clampedWeek}
                totalWeeks={totalWeeks}
                allWeeks={allWeeksSummary}
                onSelectWeek={setSelectedWeek}
                isHi={isHi}
                className="max-w-md flex-1"
              />
            </div>

            <div>
              {currentWeekPlan.days.map((step) => (
                <div
                  key={step.day}
                  className="flex items-start gap-4 border-b border-[var(--line-soft)] py-3.5"
                >
                  <span className="font-data w-7 shrink-0 pt-0.5 text-[11px] font-semibold text-[var(--field)]">
                    {String(step.day).padStart(2, '0')}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-[13px] font-semibold text-[var(--ink)]">{step.title}</h4>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--ink-soft)]">
                      {step.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-1">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedWeek((w) => Math.max(1, w - 1))}
                  disabled={clampedWeek <= 1}
                  className="btn btn-ghost btn-sm disabled:opacity-30"
                >
                  <ChevronLeft size={13} />
                  {isHi ? 'पिछला' : 'Previous'}
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedWeek((w) => Math.min(totalWeeks, w + 1))}
                  disabled={clampedWeek >= totalWeeks}
                  className="btn btn-ghost btn-sm disabled:opacity-30"
                >
                  {isHi ? 'अगला' : 'Next'}
                  <ChevronRight size={13} />
                </button>
              </div>
              <button
                type="button"
                onClick={() => setShowFull7DayModal(false)}
                className="btn btn-primary btn-sm"
              >
                {isHi ? 'बंद करें' : 'Close'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ===================================================================== */}
      {/* 4. DETAILED EXPERT ANALYSIS MODAL                                      */}
      {/* ===================================================================== */}
      {showDetailedModal && decision && typeof document !== 'undefined' && createPortal(
        <div
          className="scrim fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 animate-fade overflow-y-auto cursor-pointer"
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDetailedModal(false);
          }}
        >
          <div className="panel-modal my-auto max-h-[90vh] w-full max-w-5xl space-y-4 overflow-y-auto p-4 text-[var(--ink)] sm:p-6 shadow-2xl cursor-auto">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--line)] pb-4">
              <div>
                <h3 className="t-h3 text-[1.15rem] text-[var(--ink)]">
                  {isHi ? 'वैज्ञानिक एवं गणितीय निर्णय विश्लेषण' : 'Expert decision & optimization analysis'}
                </h3>
                <p className="mt-1 text-xs text-[var(--ink-soft)]">
                  HiGHS Simplex Engine · ICAR Scientific Agronomy · Open-Meteo Professional Telemetry
                </p>
              </div>

              <button
                type="button"
                onClick={() => setShowDetailedModal(false)}
                className="rounded-full p-1 text-[var(--ink-soft)] transition-colors hover:bg-[var(--surface-inset)] hover:text-[var(--ink)] cursor-pointer"
                aria-label={isHi ? 'बंद करें' : 'Close'}
              >
                <X size={18} />
              </button>
            </div>

            {/* Render full existing DetailedAnalysisView with all solvers, scenarios, and causality */}
            <div className="pt-1">
              <DetailedAnalysisView
                decision={decision}
                onReturnToFarmerView={() => setShowDetailedModal(false)}
              />
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* ===================================================================== */}
      {/* 5. SHEET FOOTER                                                        */}
      {/* ===================================================================== */}
      <footer className="px-5 py-4 text-xs text-[var(--ink-faint)] sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 border-t border-[var(--line-soft)] pt-3 text-[11px]">
          <span>
            {isHi
              ? 'ICAR कृषि इंजन एवं रीयल-टाइम मंडी डेटा द्वारा संचालित'
              : 'Powered by the ICAR agronomy engine & real-time mandi telemetry'}
          </span>
          <span>© 2026 AgriOptima AI</span>
        </div>
      </footer>
    </div>
  );
}
