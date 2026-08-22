import { useEffect, useRef, useState, useMemo } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Loader2,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Volume2,
  XCircle,
  TrendingUp,
  Droplets,
  Sun,
  AlertTriangle,
  Layers,
  BarChart3,
  Compass,
  Cpu,
  Database,
  Calendar,
  IndianRupee,
  Activity,
  Sliders,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Info,
  ShieldAlert,
  Wind,
  CloudRain,
  Thermometer,
  User,
  LogOut,
} from 'lucide-react';
import { Atmosphere } from '@/components/Atmosphere';
import { MicPortal } from '@/components/MicPortal';
import { EnvironmentalIntelligence } from '@/components/EnvironmentalIntelligence';
import { useLanguage } from '@/i18n/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { usePrefersReducedMotion } from '@/lib/hooks';
import { getFarmDecision, getAvailableLocations, checkHealth } from '@/services/api';
import { ALL_INDIAN_DISTRICTS } from '@/lib/districtsCatalog';
import {
  formatCurrency,
  formatArea,
  formatYield,
  formatRatePerAcre,
  formatPercentage,
  formatTemperature,
  formatRainfall,
} from '@/i18n/formatters';
import { getCropDisplayName } from '@/i18n/cropNames';
import { getStateDisplayName, getDistrictDisplayName } from '@/i18n/geoNames';
import {
  translateRiskLevel,
  translateConfidence,
  translateIrrigationType,
  translateIrrigationReliability,
  translateSeason,
  translateRiskTolerance,
  translateScenarioName,
} from '@/i18n/enums';
import {
  getStrategicHeadline,
  getEnvironmentalSummary,
  getIrrigationImpact,
  getCausalStepTitle,
  getCausalStepDetail,
  getScenarioDescription,
  getScenarioAdaptationShift,
  getCropReasonTag,
  getLocalizedBudgetAlert,
  getLocalizedGpsFallbackAlert,
  getLocalizedNasaFallbackAlert,
  getLocalizedOfflineAlert,
} from '@/i18n/semanticAdapter';
import type {
  FarmDecisionRequest,
  FarmDecisionResponse,
  DistrictLocationItem,
  CropEvaluationItem,
  AllocatedCropItem,
} from '@/types/farm';

interface MainScreenProps {
  onBack: () => void;
  onLogout?: () => void;
  initialLanguage?: string;
  initialState?: string;
  initialDistrict?: string;
  userName?: string;
}

type TabType =
  | 'overview'
  | 'environmental'
  | 'crops'
  | 'scenarios'
  | 'causal'
  | 'trust';

// Comprehensive Indian districts catalog covering all 36 states and Union Territories
const FALLBACK_DISTRICTS: DistrictLocationItem[] = ALL_INDIAN_DISTRICTS;

export function MainScreen({
  onBack,
  onLogout,
  initialLanguage = 'en',
  initialState = 'Madhya Pradesh',
  initialDistrict,
  userName = 'Demo Farmer',
}: MainScreenProps) {
  const reduced = usePrefersReducedMotion();
  const { t, language, languageOption } = useLanguage();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Locations state
  const [locations, setLocations] = useState<DistrictLocationItem[]>(FALLBACK_DISTRICTS);

  // Farm Setup Request Form State
  const [selectedState, setSelectedState] = useState<string>(initialState);
  const [selectedDistrict, setSelectedDistrict] = useState<string>(
    initialDistrict ||
      (ALL_INDIAN_DISTRICTS.find(
        (d) => d.state_name.toLowerCase() === initialState.toLowerCase()
      )?.district_name || 'Bhopal')
  );
  const [landAcres, setLandAcres] = useState<number>(5.0);
  const [budgetInr, setBudgetInr] = useState<number>(120000);
  const [irrigationType, setIrrigationType] = useState<FarmDecisionRequest['irrigation_type']>('Borewell');
  const [irrigationReliability, setIrrigationReliability] = useState<FarmDecisionRequest['irrigation_reliability']>('High');
  const [season, setSeason] = useState<FarmDecisionRequest['season']>('Kharif');
  const [riskTolerance, setRiskTolerance] = useState<FarmDecisionRequest['risk_tolerance']>('Balanced');

  // Diagnostics & Simulation Toggles
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);
  const [forceRefresh, setForceRefresh] = useState<boolean>(false);
  const [simulatePrimaryFail, setSimulatePrimaryFail] = useState<boolean>(false);
  const [simulateOffline, setSimulateOffline] = useState<boolean>(false);
  const [customLat, setCustomLat] = useState<string>('');
  const [customLon, setCustomLon] = useState<string>('');

  // Execution & Response State
  const [decision, setDecision] = useState<FarmDecisionResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activeScenarioKey, setActiveScenarioKey] = useState<string>('live');

  // Voice Interaction State
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [voiceQuery, setVoiceQuery] = useState<string>('');
  const [waveform, setWaveform] = useState<number[]>(Array(7).fill(0.3));

  // 1. Initial Data Load & Backend Health Check
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      let activeLocations = FALLBACK_DISTRICTS;
      try {
        const fetchedLocations = await getAvailableLocations();
        if (isMounted && fetchedLocations.length > 0) {
          activeLocations = fetchedLocations;
          setLocations(fetchedLocations);
        }
      } catch (e) {
        console.warn('Using fallback location catalog:', e);
      }

      // Initial optimization call
      if (isMounted) {
        runOptimization();
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Update district when state changes
  const availableDistricts = useMemo(() => {
    const dList = locations
      .filter((loc) => loc.state_name.toLowerCase() === selectedState.toLowerCase())
      .map((loc) => loc.district_name);
    return Array.from(new Set(dList)).sort();
  }, [locations, selectedState]);

  const availableStates = useMemo(() => {
    const sList = locations.map((loc) => loc.state_name);
    return Array.from(new Set(sList)).sort();
  }, [locations]);

  // Track if initial load has occurred
  const isInitialMount = useRef(true);

  // Execute optimization request
  const runOptimization = async (overrides?: Partial<FarmDecisionRequest>) => {
    setLoading(true);
    setError(null);

    const latNum = customLat.trim() ? parseFloat(customLat) : null;
    const lonNum = customLon.trim() ? parseFloat(customLon) : null;

    const requestPayload: FarmDecisionRequest = {
      state_name: selectedState,
      district_name: selectedDistrict,
      land_size_acres: Math.max(0.1, landAcres),
      budget_inr: Math.max(0, budgetInr),
      irrigation_type: irrigationType,
      irrigation_reliability: irrigationReliability,
      season: season,
      risk_tolerance: riskTolerance,
      custom_lat: isNaN(latNum as number) ? null : latNum,
      custom_lon: isNaN(lonNum as number) ? null : lonNum,
      force_refresh: forceRefresh,
      simulate_primary_failure: simulatePrimaryFail,
      simulate_all_failure: simulateOffline,
      ...overrides,
    };

    try {
      const response = await getFarmDecision(requestPayload);
      setDecision(response);
      setActiveScenarioKey('live');
    } catch (err: any) {
      console.error('Optimization failed:', err);
      setError(err.message || t('common.error'));
    } finally {
      setLoading(false);
    }
  };

  // Auto-recalculate whenever farm parameters or risk tolerance changes
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    const timer = setTimeout(() => {
      runOptimization();
    }, 250);

    return () => clearTimeout(timer);
  }, [
    selectedState,
    selectedDistrict,
    landAcres,
    budgetInr,
    irrigationType,
    irrigationReliability,
    season,
    riskTolerance,
    forceRefresh,
    simulatePrimaryFail,
    simulateOffline,
    customLat,
    customLon,
  ]);

  // Confidence badge color mapping
  const getConfidenceBadgeColor = (score: string) => {
    switch (score?.toLowerCase()) {
      case 'high':
        return 'border-emerald-500/40 bg-emerald-950/60 text-emerald-300';
      case 'medium':
        return 'border-gold-400/40 bg-gold-950/60 text-gold-300';
      case 'low':
        return 'border-pink-500/40 bg-pink-950/60 text-pink-300';
      default:
        return 'border-forest-600/40 bg-forest-900/60 text-cream-200';
    }
  };

  // Voice Interaction Simulator
  const handleVoiceToggle = () => {
    if (isVoiceActive) {
      setIsVoiceActive(false);
      return;
    }

    setIsVoiceActive(true);
    const samplePrompts = [
      `Optimize farm allocation for ${selectedDistrict} with ₹${budgetInr.toLocaleString('en-IN')} budget`,
      `Evaluate waterlogging risk under 7-day monsoon forecast in ${selectedDistrict}`,
      `Show drought resilience comparison between Soyabean and Maize`,
    ];
    const chosenPrompt = samplePrompts[Math.floor(Math.random() * samplePrompts.length)];
    setVoiceQuery(chosenPrompt);

    window.setTimeout(() => {
      setIsVoiceActive(false);
      runOptimization();
    }, 1800);
  };

  const currentLang = languageOption;

  // Colors based on risk levels
  const getRiskBadgeColor = (label: string) => {
    switch (label?.toUpperCase()) {
      case 'LOW':
        return 'border-forest-500/40 bg-forest-900/60 text-forest-300';
      case 'MODERATE':
        return 'border-gold-300/40 bg-gold-900/40 text-gold-200';
      case 'HIGH':
        return 'border-orange-500/40 bg-orange-950/60 text-orange-300';
      case 'CRITICAL':
        return 'border-pink-500/40 bg-pink-950/60 text-pink-300';
      default:
        return 'border-gold-300/30 bg-forest-900/40 text-cream-200';
    }
  };

  return (
    <section
      className="absolute inset-0 h-full w-full overflow-y-auto no-scrollbar text-cream-100"
      aria-label="AgriOptima AI Main Analytical Dashboard"
    >
      <Atmosphere intensity="dim" />

      <div className="relative z-10 mx-auto flex min-h-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        {/* ========================================================================= */}
        {/* 1. TOP HEADER & PROVENANCE STRIP */}
        {/* ========================================================================= */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gold-300/15 pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 rounded-full border border-gold-300/30 bg-forest-900/70 px-3.5 py-1.5 text-xs font-medium text-cream-100 transition-all duration-300 hover:border-gold-300/60 hover:bg-forest-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-300"
              aria-label="Change Farm Location"
            >
              <ArrowLeft size={13} className="text-gold-300" />
              <span>{t('header.changeFarm')}</span>
            </button>

            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <span className="font-serif text-sm font-semibold tracking-wide text-gold-100">
                  AgriOptima AI
                </span>
                <span className="hidden font-mono text-[10px] uppercase tracking-widest text-cream-300/50 sm:inline">
                  SIH 2026
                </span>
              </div>

              {decision && (
                <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-gold-300/25 bg-forest-900/70 px-3 py-0.5 text-xs font-semibold text-gold-200">
                  <Compass size={12} className="text-gold-300" />
                  <span>
                    {getDistrictDisplayName(decision.location.district_name, language)},{' '}
                    {getStateDisplayName(decision.location.state_name, language)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Section: Language Selector & Vertical Profile / Logout */}
          <div className="flex items-center gap-3">
            {/* Multilingual Selector */}
            <LanguageSelector />

            {/* User Session & Logout stacked vertically */}
            <div className="flex flex-col items-end gap-1.5">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-gold-300/20 bg-forest-900/60 px-3 py-1 text-xs text-cream-200">
                <User size={12} className="text-gold-300" />
                <span className="font-medium">{userName}</span>
              </div>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex items-center gap-1 rounded-full border border-forest-700/50 bg-forest-950/60 px-2.5 py-1 text-xs font-mono text-cream-300/70 transition-colors hover:border-pink-500/50 hover:bg-pink-950/40 hover:text-pink-300 focus:outline-none"
                  title={t('header.logout')}
                >
                  <LogOut size={12} />
                  <span>{t('header.logout')}</span>
                </button>
              )}
            </div>
          </div>
        </header>

        {/* ========================================================================= */}
        {/* ACTIVE ALERTS & PROVENANCE WARNINGS */}
        {/* ========================================================================= */}
        {decision && (
          <div className="mt-3 space-y-2">
            {decision.farm_totals.budget_constrained && (
              <div className="flex items-center gap-2 rounded-xl border border-gold-400/40 bg-gold-400/10 px-4 py-2.5 text-xs text-gold-200">
                <AlertTriangle size={15} className="shrink-0 text-gold-300" />
                <span>
                  {getLocalizedBudgetAlert(
                    decision.farm_totals.fallow_acres,
                    decision.farm_totals.budget_capital_inr,
                    decision.farm_totals.total_allocated_acres,
                    language
                  )}
                </span>
              </div>
            )}

            {decision.farm_totals.all_negative_profits && (
              <div className="flex items-center gap-2 rounded-xl border border-pink-500/40 bg-pink-500/10 px-4 py-2.5 text-xs text-pink-300">
                <ShieldAlert size={15} className="shrink-0 text-pink-400" />
                <span>
                  {language === 'hi'
                    ? 'डाउनसाइड जोखिम चेतावनी: उच्च उत्पादन लागत और प्रतिकूल मौसम के कारण सभी उम्मीदवार फसलों पर घाटे का अनुमान है।'
                    : 'Downside Risk Alert: Negative expected net margins projected across all candidate crops under current meteorological & market conditions.'}
                </span>
              </div>
            )}

            {decision.weather.fallback_used && (
              <div className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-4 py-2 text-xs text-amber-200">
                <Info size={15} className="shrink-0 text-amber-300" />
                <span>{getLocalizedNasaFallbackAlert(language)}</span>
              </div>
            )}

            {decision.location.gps_fallback_occurred && (
              <div className="flex items-center gap-2 rounded-xl border border-blue-400/40 bg-blue-400/10 px-4 py-2 text-xs text-blue-200">
                <Compass size={14} className="shrink-0 text-blue-300" />
                <span>{getLocalizedGpsFallbackAlert(decision.location.district_name, language)}</span>
              </div>
            )}
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="mt-3 flex items-center justify-between rounded-xl border border-pink-500/40 bg-pink-950/60 p-3 text-xs text-pink-200">
            <div className="flex items-center gap-2">
              <XCircle size={16} className="text-pink-400" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => runOptimization()}
              className="inline-flex items-center gap-1 text-[11px] font-mono uppercase underline hover:text-white"
            >
              <RotateCcw size={12} /> {t('common.retry')}
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. MAIN 2-COLUMN LAYOUT: SETUP & VOICE (LEFT) + WORKSPACE (RIGHT) */}
        {/* ========================================================================= */}
        <div className="mt-4 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* ----------------------------------------------------------------------- */}
          {/* LEFT COLUMN: FARM SETUP CONTROLS & VOICE ASSISTANT */}
          {/* ----------------------------------------------------------------------- */}
          <aside className="space-y-5 lg:col-span-4">
            {/* Farm Setup Card */}
            <div className="rounded-2xl border border-gold-300/20 bg-forest-900/50 p-5 backdrop-blur-md">
              <div className="mb-4 flex items-center justify-between border-b border-gold-300/10 pb-3">
                <div className="flex items-center gap-2">
                  <Sliders size={16} className="text-gold-300" />
                  <h2 className="font-serif text-sm font-semibold text-cream-100">
                    {t('config.title')}
                  </h2>
                </div>
                <span className="font-mono text-[10px] text-cream-300/50">
                  {language === 'hi' ? 'मापदंड' : 'Parameters'}
                </span>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  runOptimization();
                }}
                className="space-y-4 text-xs"
              >
                {/* State & District Selectors */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-cream-300/60">
                      {t('config.state')}
                    </label>
                    <select
                      value={selectedState}
                      onChange={(e) => {
                        setSelectedState(e.target.value);
                        const match = locations.find(
                          (l) => l.state_name.toLowerCase() === e.target.value.toLowerCase()
                        );
                        if (match) setSelectedDistrict(match.district_name);
                      }}
                      className="mt-1 w-full rounded-xl border border-gold-300/20 bg-forest-950/80 px-2.5 py-2 text-xs text-cream-100 focus:border-gold-300 focus:outline-none"
                    >
                      {availableStates.map((s) => (
                        <option key={s} value={s} className="bg-forest-950 text-cream-100">
                          {getStateDisplayName(s, language)}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-cream-300/60">
                      {t('config.district')}
                    </label>
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-gold-300/20 bg-forest-950/80 px-2.5 py-2 text-xs text-cream-100 focus:border-gold-300 focus:outline-none"
                    >
                      {availableDistricts.map((d) => (
                        <option key={d} value={d} className="bg-forest-950 text-cream-100">
                          {getDistrictDisplayName(d, language)}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Farm Land & Capital Budget */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-cream-300/60">
                      {t('config.landSize')}
                    </label>
                    <div className="relative mt-1">
                      <input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="500"
                        value={landAcres}
                        onChange={(e) => setLandAcres(parseFloat(e.target.value) || 0)}
                        className="w-full rounded-xl border border-gold-300/20 bg-forest-950/80 px-2.5 py-2 text-xs text-cream-100 focus:border-gold-300 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-cream-300/60">
                      {t('config.budget')}
                    </label>
                    <div className="relative mt-1">
                      <input
                        type="number"
                        step="5000"
                        min="0"
                        value={budgetInr}
                        onChange={(e) => setBudgetInr(parseFloat(e.target.value) || 0)}
                        className="w-full rounded-xl border border-gold-300/20 bg-forest-950/80 px-2.5 py-2 text-xs text-cream-100 focus:border-gold-300 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>

                {/* Irrigation System & Reliability */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-cream-300/60">
                      {t('config.irrigationType')}
                    </label>
                    <select
                      value={irrigationType}
                      onChange={(e) => setIrrigationType(e.target.value as any)}
                      className="mt-1 w-full rounded-xl border border-gold-300/20 bg-forest-950/80 px-2.5 py-2 text-xs text-cream-100 focus:border-gold-300 focus:outline-none"
                    >
                      <option value="Borewell">{translateIrrigationType('Borewell', language)}</option>
                      <option value="Canal">{translateIrrigationType('Canal', language)}</option>
                      <option value="Drip">{translateIrrigationType('Drip', language)}</option>
                      <option value="Sprinkler">{translateIrrigationType('Sprinkler', language)}</option>
                      <option value="Rainfed">{translateIrrigationType('Rainfed', language)}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-cream-300/60">
                      {t('config.irrigationReliability')}
                    </label>
                    <select
                      value={irrigationReliability}
                      onChange={(e) => setIrrigationReliability(e.target.value as any)}
                      className="mt-1 w-full rounded-xl border border-gold-300/20 bg-forest-950/80 px-2.5 py-2 text-xs text-cream-100 focus:border-gold-300 focus:outline-none"
                    >
                      <option value="High">{translateIrrigationReliability('High', language)}</option>
                      <option value="Medium">{translateIrrigationReliability('Medium', language)}</option>
                      <option value="Low">{translateIrrigationReliability('Low', language)}</option>
                    </select>
                  </div>
                </div>

                {/* Season & Risk Tolerance */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-cream-300/60">
                      {t('config.season')}
                    </label>
                    <select
                      value={season}
                      onChange={(e) => setSeason(e.target.value as any)}
                      className="mt-1 w-full rounded-xl border border-gold-300/20 bg-forest-950/80 px-2.5 py-2 text-xs text-cream-100 focus:border-gold-300 focus:outline-none"
                    >
                      <option value="Kharif">{translateSeason('Kharif', language)}</option>
                      <option value="Rabi">{translateSeason('Rabi', language)}</option>
                      <option value="Zaid">{translateSeason('Zaid', language)}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-cream-300/60">
                      {t('config.riskTolerance')}
                    </label>
                    <select
                      value={riskTolerance}
                      onChange={(e) => setRiskTolerance(e.target.value as any)}
                      className="mt-1 w-full rounded-xl border border-gold-300/20 bg-forest-950/80 px-2.5 py-2 text-xs text-cream-100 focus:border-gold-300 focus:outline-none"
                    >
                      <option value="Conservative">{translateRiskTolerance('Conservative', language)}</option>
                      <option value="Balanced">{translateRiskTolerance('Balanced', language)}</option>
                      <option value="Aggressive">{translateRiskTolerance('Aggressive', language)}</option>
                    </select>
                  </div>
                </div>

                {/* Submit Optimization Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-gold-300/50 bg-gradient-to-r from-gold-400 to-gold-500 py-2.5 font-serif text-xs font-semibold text-forest-950 shadow-[0_0_20px_rgba(255,210,26,0.2)] transition-all hover:brightness-110 focus:outline-none disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      <span>{t('config.optimizing')}</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>{t('config.optimizeButton')}</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Voice Assistant Portal */}
            <div className="rounded-2xl border border-gold-300/15 bg-forest-900/40 p-4 backdrop-blur-md text-center">
              <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-gold-300/70">
                {language === 'hi' ? 'वॉइस निर्णय सहायक' : 'Voice Decision Agent'}
              </p>
              <p className="mb-3 text-xs text-cream-300/60">
                {language === 'hi'
                  ? `खेत संबंधी प्रश्न पूछने के लिए माइक पर टैप करें (${currentLang.label})`
                  : `Tap microphone to speak farm queries in ${currentLang.english}`}
              </p>

              <div className="flex justify-center py-2">
                <MicPortal
                  size="main"
                  active={isVoiceActive}
                  phase={isVoiceActive ? 'listening' : 'idle'}
                  onClick={handleVoiceToggle}
                />
              </div>

              {/* Waveform */}
              <div className="mt-2 flex h-8 items-center justify-center gap-1" aria-hidden="true">
                {waveform.map((h, i) => (
                  <span
                    key={i}
                    className={`w-1 rounded-full transition-all duration-150 ${
                      isVoiceActive ? 'bg-gold-200' : 'bg-gold-200/20'
                    }`}
                    style={{ height: `${h * 100}%` }}
                  />
                ))}
              </div>

              {voiceQuery && (
                <div className="mt-3 rounded-xl border border-gold-300/10 bg-forest-950/60 p-2.5 text-left text-xs">
                  <span className="font-mono text-[9px] uppercase text-cream-300/40">
                    {language === 'hi' ? 'प्रश्न:' : 'Query:'}
                  </span>
                  <p className="text-cream-200 mt-0.5">{voiceQuery}</p>
                </div>
              )}
            </div>
          </aside>

          {/* ----------------------------------------------------------------------- */}
          {/* RIGHT COLUMN: MULTI-TAB ANALYTICAL DASHBOARD WORKSPACE */}
          {/* ----------------------------------------------------------------------- */}
          <main className="space-y-4 lg:col-span-8">
            {/* Workspace Navigation Tabs */}
            <nav className="flex flex-wrap items-center gap-1.5 rounded-2xl border border-gold-300/15 bg-forest-900/60 p-1.5 backdrop-blur-md">
              {[
                { id: 'overview', label: t('nav.overview'), icon: BarChart3 },
                { id: 'environmental', label: t('nav.environmental'), icon: Droplets },
                { id: 'crops', label: t('nav.crops'), icon: Layers },
                { id: 'scenarios', label: t('nav.scenarios'), icon: Activity },
                { id: 'causal', label: t('nav.causal'), icon: Cpu },
                { id: 'trust', label: t('nav.trust'), icon: ShieldCheck },
              ].map((tab) => {
                const Icon = tab.icon;
                const active = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id as TabType)}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-all duration-200 ${
                      active
                        ? 'border border-gold-300/40 bg-gold-300/15 text-gold-100 shadow-[0_0_12px_rgba(255,210,26,0.15)]'
                        : 'text-cream-300/70 hover:bg-forest-800/50 hover:text-cream-100'
                    }`}
                  >
                    <Icon size={13} className={active ? 'text-gold-300' : 'text-cream-300/60'} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </nav>

            {/* Content Loading Skeleton */}
            {loading && !decision && (
              <div className="flex h-96 flex-col items-center justify-center rounded-2xl border border-gold-300/15 bg-forest-900/30 p-8 text-center backdrop-blur-md">
                <Loader2 size={36} className="animate-spin text-gold-300" />
                <h3 className="mt-4 font-serif text-lg font-medium text-cream-100">
                  {language === 'hi'
                    ? 'स्वायत्त निर्णय पाइपलाइन निष्पादित हो रही है...'
                    : 'Executing Autonomous Decision Pipeline...'}
                </h3>
                <p className="mt-1 font-mono text-xs text-cream-300/50">
                  {language === 'hi'
                    ? 'NWP मौसम अंतर्ग्रहण, जोखिम वक्र और LP सिम्प्लेक्स अनुकूलन जारी है'
                    : 'Ingesting NWP weather, running risk curves, and solving LP simplex'}
                </p>
              </div>
            )}

            {/* ================================================================= */}
            {/* TAB 1: STRATEGIC OVERVIEW (DASHBOARD) */}
            {/* ================================================================= */}
            {decision && activeTab === 'overview' && (
              <div className="space-y-4">
                {/* 4 Executive KPI Cards */}
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  {/* KPI 1: Net Profit */}
                  <div className="rounded-2xl border border-gold-300/20 bg-forest-900/50 p-4 backdrop-blur-md">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-cream-300/60">
                      {t('overview.netProfit')}
                    </span>
                    <div className="mt-1 font-serif text-xl font-bold text-gold-200 sm:text-2xl">
                      {formatCurrency(decision.farm_totals.total_expected_net_profit_inr, language)}
                    </div>
                    <div className="mt-1 flex items-center gap-1 font-mono text-[11px] text-forest-300">
                      <TrendingUp size={11} />
                      <span>
                        {formatRatePerAcre(
                          decision.farm_totals.total_expected_net_profit_inr /
                            Math.max(0.1, decision.farm_totals.total_allocated_acres),
                          language
                        )}
                      </span>
                    </div>
                  </div>

                  {/* KPI 2: Expected ROI */}
                  <div className="rounded-2xl border border-gold-300/20 bg-forest-900/50 p-4 backdrop-blur-md">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-cream-300/60">
                      {t('overview.returnOnInvestment')}
                    </span>
                    <div className="mt-1 font-serif text-xl font-bold text-forest-300 sm:text-2xl">
                      {formatPercentage(decision.farm_totals.expected_farm_roi_pct, language)}
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-cream-300/50">
                      {language === 'hi' ? 'पोर्टफोलियो मार्जिन' : 'Portfolio Margin'}
                    </div>
                  </div>

                  {/* KPI 3: Capital Invested */}
                  <div className="rounded-2xl border border-gold-300/20 bg-forest-900/50 p-4 backdrop-blur-md">
                    <span className="font-mono text-[10px] uppercase tracking-wider text-cream-300/60">
                      {t('overview.capitalInvested')}
                    </span>
                    <div className="mt-1 font-serif text-xl font-bold text-cream-100 sm:text-2xl">
                      {formatCurrency(decision.farm_totals.total_investment_inr, language)}
                    </div>
                    <div className="mt-1 font-mono text-[11px] text-gold-300/80">
                      {decision.farm_totals.budget_utilization_pct.toFixed(0)}%{' '}
                      {language === 'hi' ? 'बजट उपयोग' : 'budget utilized'}
                    </div>
                  </div>

                  {/* KPI 4: Weighted Risk Score */}
                  <div className="rounded-2xl border border-gold-300/20 bg-forest-900/50 p-4 backdrop-blur-md">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-cream-300/60">
                        {language === 'hi' ? 'भारित जोखिम' : 'Weighted Risk'}
                      </span>
                      <span
                        className={`inline-block rounded-full border px-2 py-0.5 text-[9px] font-mono uppercase tracking-wider ${getRiskBadgeColor(
                          decision.farm_totals.weighted_risk_label
                        )}`}
                      >
                        {translateRiskLevel(decision.farm_totals.weighted_risk_label, language)}{' '}
                        {language === 'hi' ? 'जोखिम' : 'RISK'}
                      </span>
                    </div>

                    <div className="mt-1 flex items-baseline gap-1.5">
                      <span
                        className={`font-serif text-xl font-bold sm:text-2xl ${
                          decision.farm_totals.weighted_risk_score < 0.25
                            ? 'text-emerald-300'
                            : decision.farm_totals.weighted_risk_score < 0.50
                            ? 'text-gold-200'
                            : decision.farm_totals.weighted_risk_score < 0.75
                            ? 'text-orange-300'
                            : 'text-rose-400'
                        }`}
                      >
                        {decision.farm_totals.weighted_risk_score.toFixed(2)}
                      </span>
                      <span className="font-mono text-[10px] text-cream-300/50">/ 1.00</span>
                    </div>

                    {/* Interactive Visual Risk Scale Meter */}
                    <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-forest-950/80">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          decision.farm_totals.weighted_risk_score < 0.25
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-400'
                            : decision.farm_totals.weighted_risk_score < 0.50
                            ? 'bg-gradient-to-r from-emerald-500 via-gold-400 to-gold-300'
                            : decision.farm_totals.weighted_risk_score < 0.75
                            ? 'bg-gradient-to-r from-gold-400 to-orange-400'
                            : 'bg-gradient-to-r from-orange-400 to-rose-500'
                        }`}
                        style={{
                          width: `${Math.min(100, Math.max(6, decision.farm_totals.weighted_risk_score * 100))}%`,
                        }}
                      />
                    </div>

                    <div className="mt-1 flex items-center justify-between text-[9px] font-mono text-cream-300/45">
                      <span>0.00</span>
                      <span className="text-cream-200/60 font-medium">
                        {riskTolerance === 'Conservative'
                          ? 'Low-Risk Safe Portfolio'
                          : riskTolerance === 'Aggressive'
                          ? 'High-Return Concentrated'
                          : 'Balanced Risk Hedge'}
                      </span>
                      <span>1.00</span>
                    </div>
                  </div>
                </div>

                {/* Strategic Directive Box */}
                <div className="rounded-2xl border border-gold-300/30 bg-gradient-to-r from-forest-900/80 via-forest-900/60 to-forest-950/80 p-5 backdrop-blur-md shadow-[0_0_20px_rgba(255,210,26,0.06)]">
                  <div className="mb-2 flex items-center gap-2 text-gold-300">
                    <Sparkles size={16} />
                    <h3 className="font-serif text-sm font-semibold tracking-wide">
                      {t('overview.actionDirective')}
                    </h3>
                  </div>
                  <p className="text-sm font-medium leading-relaxed text-cream-100">
                    {getStrategicHeadline(decision, language)}
                  </p>
                  <p className="mt-2 text-xs leading-relaxed text-cream-300/70">
                    {getEnvironmentalSummary(decision, language)}
                  </p>
                  <div className="mt-3 flex items-center gap-2 border-t border-gold-300/10 pt-2.5 text-[11px] text-gold-200/90">
                    <Droplets size={13} className="shrink-0 text-gold-300" />
                    <span>{getIrrigationImpact(decision, language)}</span>
                  </div>
                </div>

                {/* Optimal Acreage Distribution Portfolio */}
                <div className="rounded-2xl border border-gold-300/20 bg-forest-900/50 p-5 backdrop-blur-md">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-2 border-b border-gold-300/10 pb-3">
                    <div>
                      <h3 className="font-serif text-sm font-semibold text-cream-100">
                        {t('overview.optimalAllocation')} (HiGHS LP Simplex)
                      </h3>
                      <p className="font-mono text-[10px] text-cream-300/50">
                        {language === 'hi' ? 'आवंटित:' : 'Cultivated:'}{' '}
                        {formatArea(decision.farm_totals.total_allocated_acres, language)} /{' '}
                        {formatArea(decision.farm_totals.total_land_acres, language)} (
                        {(
                          (decision.farm_totals.total_allocated_acres /
                            decision.farm_totals.total_land_acres) *
                          100
                        ).toFixed(0)}
                        %)
                      </p>
                    </div>
                    {decision.farm_totals.fallow_acres > 0 && (
                      <span className="rounded-full border border-gold-400/30 bg-gold-400/10 px-2.5 py-1 font-mono text-[10px] text-gold-300">
                        {language === 'hi' ? 'परती:' : 'Fallow:'}{' '}
                        {formatArea(decision.farm_totals.fallow_acres, language)}
                      </span>
                    )}
                  </div>

                  {/* Acreage Distribution Bar */}
                  <div className="mb-5">
                    <div className="flex h-4 w-full overflow-hidden rounded-full bg-forest-950 p-0.5">
                      {decision.allocated_crops.map((crop, idx) => {
                        const colors = ['bg-gold-400', 'bg-forest-500', 'bg-emerald-400', 'bg-amber-400'];
                        const barColor = colors[idx % colors.length];
                        return (
                          <div
                            key={crop.crop_name}
                            style={{ width: `${crop.acre_share_pct}%` }}
                            className={`h-full ${barColor} transition-all duration-500 first:rounded-l-full last:rounded-r-full`}
                            title={`${getCropDisplayName(crop.crop_name, language)}: ${formatArea(
                              crop.allocated_acres,
                              language
                            )} (${crop.acre_share_pct.toFixed(0)}%)`}
                          />
                        );
                      })}
                      {decision.farm_totals.fallow_acres > 0 && (
                        <div
                          style={{
                            width: `${
                              (decision.farm_totals.fallow_acres /
                                decision.farm_totals.total_land_acres) *
                              100
                            }%`,
                          }}
                          className="h-full bg-cream-300/15"
                          title={`Fallow: ${formatArea(decision.farm_totals.fallow_acres, language)}`}
                        />
                      )}
                    </div>
                  </div>

                  {/* Allocated Crops Cards */}
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {decision.allocated_crops.map((crop) => (
                      <div
                        key={crop.crop_name}
                        className="rounded-xl border border-gold-300/15 bg-forest-950/70 p-4 transition-all hover:border-gold-300/35"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <h4 className="font-serif text-sm font-semibold text-gold-100">
                              {getCropDisplayName(crop.crop_name, language)}
                            </h4>
                            <span className="font-mono text-[11px] text-gold-300">
                              {formatArea(crop.allocated_acres, language)} (
                              {crop.acre_share_pct.toFixed(1)}% {t('overview.percentage')})
                            </span>
                          </div>
                          <span className="rounded-full bg-forest-900/80 px-2 py-0.5 font-mono text-[10px] text-forest-300 border border-forest-600/30">
                            ROI {formatPercentage(crop.roi_pct, language)}
                          </span>
                        </div>

                        <div className="mt-3 grid grid-cols-3 gap-2 border-y border-gold-300/10 py-2 font-mono text-[10px]">
                          <div>
                            <span className="text-cream-300/50 block">{t('overview.expYield')}</span>
                            <span className="text-cream-100">
                              {formatYield(crop.expected_yield_qtl_acre, language)}
                            </span>
                          </div>
                          <div>
                            <span className="text-cream-300/50 block">
                              {language === 'hi' ? 'मंडी भाव' : 'Mandi Price'}
                            </span>
                            <span className="text-cream-100">
                              {formatCurrency(crop.modal_price_per_qtl, language)}/Q
                            </span>
                          </div>
                          <div>
                            <span className="text-cream-300/50 block">{t('overview.netMargin')}</span>
                            <span className="text-gold-200 font-bold">
                              {formatCurrency(crop.net_profit_inr, language)}
                            </span>
                          </div>
                        </div>

                        {crop.reasons && crop.reasons.length > 0 && (
                          <div className="mt-2.5 flex flex-wrap gap-1.5">
                            {crop.reasons.slice(0, 2).map((r, rIdx) => (
                              <span
                                key={rIdx}
                                className="rounded bg-forest-900 px-2 py-0.5 font-mono text-[9px] text-cream-300/80"
                              >
                                {getCropReasonTag(r, language)}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* TAB 2: ENVIRONMENTAL INTELLIGENCE & SOIL PROFILE */}
            {/* ================================================================= */}
            {decision && activeTab === 'environmental' && (
              <EnvironmentalIntelligence
                weather={decision.weather}
                risk={decision.risk}
                location={decision.location}
              />
            )}

            {/* ================================================================= */}
            {/* TAB 3: CROP EVALUATIONS MATRIX */}
            {/* ================================================================= */}
            {decision && activeTab === 'crops' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-gold-300/20 bg-forest-900/50 p-5 backdrop-blur-md">
                  <div className="mb-4 border-b border-gold-300/10 pb-3">
                    <h3 className="font-serif text-sm font-semibold text-cream-100">
                      {t('crops.title')}
                    </h3>
                    <p className="font-mono text-[10px] text-cream-300/50">
                      {t('crops.subtitle')}
                    </p>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gold-300/15 font-mono text-[10px] uppercase text-cream-300/60">
                          <th className="pb-2">{t('crops.cropName')}</th>
                          <th className="pb-2">{language === 'hi' ? 'आधारभूत उपज' : 'Hist. Baseline'}</th>
                          <th className="pb-2">{language === 'hi' ? 'मौसम गुणक' : 'Multiplier'}</th>
                          <th className="pb-2">{t('crops.expectedYield')}</th>
                          <th className="pb-2">{language === 'hi' ? 'जोखिम कटौती' : 'Penalty %'}</th>
                          <th className="pb-2">{t('crops.marketPrice')}</th>
                          <th className="pb-2">{t('crops.costPerAcre')}</th>
                          <th className="pb-2">{t('crops.netProfitPerAcre')}</th>
                          <th className="pb-2">{t('crops.status')}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gold-300/10 font-mono text-[11px]">
                        {decision.crop_evaluations.map((item) => (
                          <tr key={item.crop_name} className="hover:bg-forest-800/30 transition-colors">
                            <td className="py-2.5 font-serif text-xs font-medium text-cream-100">
                              {getCropDisplayName(item.crop_name, language)}
                            </td>
                            <td className="py-2.5 text-cream-300/70">
                              {formatYield(item.hist_yield_qtl_acre, language)}
                            </td>
                            <td className="py-2.5 text-gold-300">
                              {item.weather_multiplier.toFixed(3)}
                            </td>
                            <td className="py-2.5 text-cream-100 font-semibold">
                              {formatYield(item.expected_yield_qtl_acre, language)}
                            </td>
                            <td className="py-2.5 text-pink-400">
                              {item.total_risk_penalty_pct > 0
                                ? `-${item.total_risk_penalty_pct.toFixed(1)}%`
                                : '0%'}
                            </td>
                            <td className="py-2.5 text-cream-200">
                              {formatCurrency(item.modal_price_per_qtl, language)}/Q
                            </td>
                            <td className="py-2.5 text-cream-300/60">
                              {formatCurrency(item.cost_c2_per_acre, language)}
                            </td>
                            <td
                              className={`py-2.5 font-bold ${
                                item.expected_profit_per_acre >= 0 ? 'text-forest-300' : 'text-pink-400'
                              }`}
                            >
                              {formatCurrency(item.expected_profit_per_acre, language)}
                            </td>
                            <td className="py-2.5">
                              {item.is_allocated ? (
                                <span className="inline-flex items-center gap-1 rounded-full bg-forest-900/80 px-2 py-0.5 text-[9px] text-forest-300 border border-forest-600/30">
                                  <CheckCircle2 size={10} />{' '}
                                  {formatArea(item.allocated_acres, language)}
                                </span>
                              ) : (
                                <span className="text-cream-300/40 text-[10px]">
                                  {language === 'hi' ? 'गैर-आवंटित' : 'Unallocated'}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* TAB 4: 4-WAY SCENARIO STRESS-TESTING PLAYGROUND */}
            {/* ================================================================= */}
            {decision && activeTab === 'scenarios' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-gold-300/20 bg-forest-900/50 p-5 backdrop-blur-md">
                  <div className="mb-4 border-b border-gold-300/10 pb-3">
                    <h3 className="font-serif text-sm font-semibold text-cream-100">
                      {t('scenarios.title')}
                    </h3>
                    <p className="font-mono text-[10px] text-cream-300/50">
                      {t('scenarios.subtitle')}
                    </p>
                  </div>

                  {/* Scenario Buttons */}
                  <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 mb-4">
                    {Object.entries(decision.scenarios).map(([key, sc]) => {
                      const active = activeScenarioKey === key;
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() => setActiveScenarioKey(key)}
                          className={`rounded-xl p-3 text-left transition-all ${
                            active
                              ? 'border border-gold-300/60 bg-gold-300/15 shadow-[0_0_15px_rgba(255,210,26,0.15)]'
                              : 'border border-gold-300/10 bg-forest-950/60 hover:border-gold-300/30'
                          }`}
                        >
                          <span className="font-serif text-xs font-semibold block text-cream-100">
                            {translateScenarioName(key, sc.scenario_name, language)}
                          </span>
                          <span className="font-mono text-[11px] text-gold-300 font-bold mt-1 block">
                            {formatCurrency(sc.total_profit_inr, language)}
                          </span>
                          <span
                            className={`font-mono text-[9px] block mt-0.5 ${
                              sc.profit_delta_from_live_inr >= 0 ? 'text-forest-400' : 'text-pink-400'
                            }`}
                          >
                            {sc.profit_delta_from_live_inr === 0
                              ? language === 'hi'
                                ? 'लाइव आधारभूत'
                                : 'Live Baseline'
                              : `${sc.profit_delta_from_live_inr > 0 ? '+' : ''}${formatCurrency(
                                  sc.profit_delta_from_live_inr,
                                  language
                                )} अंतर`}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Active Scenario Detail Card */}
                  {decision.scenarios[activeScenarioKey] && (
                    <div className="rounded-xl border border-gold-300/20 bg-forest-950/80 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gold-300/10 pb-2.5">
                        <div>
                          <h4 className="font-serif text-sm font-bold text-gold-200">
                            {translateScenarioName(
                              activeScenarioKey,
                              decision.scenarios[activeScenarioKey].scenario_name,
                              language
                            )}
                          </h4>
                          <p className="text-xs text-cream-300/70 mt-0.5">
                            {getScenarioDescription(
                              activeScenarioKey,
                              decision.scenarios[activeScenarioKey],
                              language
                            )}
                          </p>
                        </div>
                        <span className="font-mono text-xs font-bold text-forest-300">
                          ROI {formatPercentage(decision.scenarios[activeScenarioKey].roi_pct, language)}
                        </span>
                      </div>

                      {/* Allocations in this scenario */}
                      <div className="mt-3">
                        <span className="font-mono text-[10px] uppercase text-cream-300/50 block mb-1.5">
                          {t('scenarios.primaryAllocations')}:
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(decision.scenarios[activeScenarioKey].allocations).map(
                            ([cropName, acres]) => (
                              <div
                                key={cropName}
                                className="rounded-lg border border-gold-300/20 bg-forest-900/60 px-3 py-1 font-mono text-xs text-cream-100"
                              >
                                <span className="font-semibold">
                                  {getCropDisplayName(cropName, language)}:
                                </span>{' '}
                                {formatArea(acres, language)}
                              </div>
                            )
                          )}
                          {decision.scenarios[activeScenarioKey].fallow_acres > 0 && (
                            <div className="rounded-lg border border-gold-400/20 bg-gold-400/10 px-3 py-1 font-mono text-xs text-gold-300">
                              {language === 'hi' ? 'परती:' : 'Fallow:'}{' '}
                              {formatArea(decision.scenarios[activeScenarioKey].fallow_acres, language)}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Agronomic Shift Rationale */}
                      <div className="mt-3 rounded-lg bg-forest-900/40 p-2.5 text-xs text-cream-200">
                        <span className="font-mono text-[10px] uppercase text-gold-300 block mb-0.5">
                          {t('scenarios.systemAdaptation')}:
                        </span>
                        <p>
                          {getScenarioAdaptationShift(
                            activeScenarioKey,
                            decision.scenarios[activeScenarioKey],
                            language
                          )}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* TAB 5: 8-STEP CAUSAL DECISION CHAIN */}
            {/* ================================================================= */}
            {decision && activeTab === 'causal' && (
              <div className="space-y-3">
                <div className="rounded-2xl border border-gold-300/20 bg-forest-900/50 p-5 backdrop-blur-md">
                  <div className="mb-4 border-b border-gold-300/10 pb-3">
                    <h3 className="font-serif text-sm font-semibold text-cream-100">
                      {t('causal.title')}
                    </h3>
                    <p className="font-mono text-[10px] text-cream-300/50">
                      {t('causal.subtitle')}
                    </p>
                  </div>

                  <div className="space-y-3">
                    {decision.explanation.causal_chain.map((step) => (
                      <div
                        key={step.step_number}
                        className="rounded-xl border border-gold-300/15 bg-forest-950/70 p-3.5 transition-all hover:border-gold-300/35"
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-gold-300/20 font-mono text-[10px] font-bold text-gold-200">
                            {step.step_number}
                          </span>
                          <h4 className="font-serif text-xs font-semibold text-gold-100">
                            {getCausalStepTitle(step.step_number, language)}
                          </h4>
                        </div>
                        <p className="text-xs leading-relaxed text-cream-200/80 pl-7">
                          {getCausalStepDetail(step.step_number, decision, language)}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ================================================================= */}
            {/* TAB 6: DATA TRUST & PROVENANCE */}
            {/* ================================================================= */}
            {decision && activeTab === 'trust' && (
              <div className="space-y-4">
                <div className="rounded-2xl border border-gold-300/20 bg-forest-900/50 p-5 backdrop-blur-md">
                  <div className="mb-4 border-b border-gold-300/10 pb-3">
                    <h3 className="font-serif text-sm font-semibold text-cream-100">
                      {t('trust.title')}
                    </h3>
                    <p className="font-mono text-[10px] text-cream-300/50">
                      {t('trust.subtitle')}
                    </p>
                  </div>

                  {/* Lineage Table */}
                  <div className="overflow-x-auto mb-4">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-gold-300/15 font-mono text-[10px] uppercase text-cream-300/60">
                          <th className="pb-2">{language === 'hi' ? 'डेटा परत' : 'Data Layer'}</th>
                          <th className="pb-2">{language === 'hi' ? 'अधिकृत स्रोत' : 'Authoritative Source'}</th>
                          <th className="pb-2">{language === 'hi' ? 'रिज़ॉल्यूशन / विलंबता' : 'Resolution / Latency'}</th>
                          <th className="pb-2">{language === 'hi' ? 'सत्यता गारंटी' : 'Integrity Guarantee'}</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gold-300/10 font-mono text-[11px] text-cream-200">
                        <tr>
                          <td className="py-2 font-serif text-gold-200">
                            {language === 'hi' ? 'ऐतिहासिक उपज' : 'Historical Yields'}
                          </td>
                          <td className="py-2">DES APY (Ministry of Agriculture)</td>
                          <td className="py-2">{language === 'hi' ? 'ज़िला-स्तरीय संकलित आधारभूत डेटा' : 'District-level compiled baseline'}</td>
                          <td className="py-2 text-forest-300">{language === 'hi' ? 'आधारभूत सत्य' : 'Ground Truth'}</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-serif text-gold-200">
                            {language === 'hi' ? 'थोक मंडी भाव' : 'Wholesale Mandi Prices'}
                          </td>
                          <td className="py-2">Agmarknet / DMI</td>
                          <td className="py-2">{language === 'hi' ? 'APMC मॉडल बेंचमार्क' : 'APMC modal benchmark'}</td>
                          <td className="py-2 text-forest-300">{language === 'hi' ? 'सत्यापित बाजार दर' : 'Verified Market Rate'}</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-serif text-gold-200">
                            {language === 'hi' ? 'खेती की लागत (C2)' : 'Cost of Cultivation'}
                          </td>
                          <td className="py-2">CACP Comprehensive Scheme (Cost C2)</td>
                          <td className="py-2">{language === 'hi' ? 'राज्य-स्तरीय C2 बेंचमार्क' : 'State-level C2 benchmarks'}</td>
                          <td className="py-2 text-forest-300">{language === 'hi' ? 'सांविधिक आधारभूत डेटा' : 'Statutory Baseline'}</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-serif text-gold-200">
                            {language === 'hi' ? 'वर्षा सामान्य स्तर' : 'Precipitation Normals'}
                          </td>
                          <td className="py-2">IMD 100-Year Seasonal Normals</td>
                          <td className="py-2">{language === 'hi' ? 'ज़िला जलवायु विज्ञान' : 'District Climatology'}</td>
                          <td className="py-2 text-forest-300">{language === 'hi' ? 'जलवायु आधारभूत' : 'Climatic Baseline'}</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-serif text-gold-200">
                            {language === 'hi' ? 'लाइव मौसम / मिट्टी' : 'Live Weather / Soil'}
                          </td>
                          <td className="py-2">Open-Meteo & ECMWF ERA5-Land</td>
                          <td className="py-2">{language === 'hi' ? 'रीयल-टाइम प्रति घंटा NWP' : 'Real-time hourly NWP'}</td>
                          <td className="py-2 text-forest-300">{language === 'hi' ? 'प्रत्यक्ष टेलीमेट्री' : 'Observed Telemetry'}</td>
                        </tr>
                        <tr>
                          <td className="py-2 font-serif text-gold-200">
                            {language === 'hi' ? 'उपग्रह फ़ॉलबैक' : 'Satellite Fallback'}
                          </td>
                          <td className="py-2">NASA POWER Daily (MERRA-2)</td>
                          <td className="py-2">~2-3 Days Latency</td>
                          <td className="py-2 text-amber-300">{language === 'hi' ? 'घोषित फ़ॉलबैक' : 'Declared Fallback'}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  {/* Declared Missing Variables */}
                  {decision.weather.missing_variables && decision.weather.missing_variables.length > 0 && (
                    <div className="rounded-xl border border-amber-500/20 bg-amber-950/30 p-3 text-xs mb-3">
                      <span className="font-mono text-[10px] uppercase text-amber-300 block mb-1">
                        {language === 'hi'
                          ? 'घोषित अनुपलब्ध चर (शून्य-काल्पनिक नीति):'
                          : 'Declared Missing Variables (Zero-Fabrication Policy):'}
                      </span>
                      <p className="text-amber-200/80">
                        {language === 'hi'
                          ? `निम्नलिखित टेलीमेट्री चर सीधे प्राप्त नहीं हुए और उन्हें काल्पनिक बनाने के बजाय "अनुपलब्ध" घोषित किया गया है: ${decision.weather.missing_variables.join(
                              ', '
                            )}.`
                          : `The following telemetry variables were not directly observed and are preserved as "Unavailable" rather than fabricated: ${decision.weather.missing_variables.join(
                              ', '
                            )}.`}
                      </p>
                    </div>
                  )}

                  {/* Data Trust Summary Paragraph */}
                  <div className="rounded-xl bg-forest-950/70 p-3 text-xs text-cream-300/80 leading-relaxed">
                    <span className="font-mono text-[10px] uppercase text-gold-300 block mb-1">
                      {language === 'hi' ? 'डेटा स्रोत व सत्यता वक्तव्य:' : 'Data Trust Lineage Statement:'}
                    </span>
                    <p>
                      {language === 'hi'
                        ? `${decision.location.district_name}, ${decision.location.state_name} के लिए सभी गणनाएं ओपन-डेटा सरकारी और वैज्ञानिक एजेंसियों (Open-Meteo, NASA POWER, ERA5-Land, Agmarknet, CACP) के सत्यापित आंकड़ों पर आधारित हैं। HiGHS सिम्प्लेक्स अनुकूलक बिना किसी काल्पनिक या मनगढ़ंत डेटा के 100% सटीक गणितीय समाधान प्रदान करता है।`
                        : decision.explanation.data_trust_summary}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </section>
  );
}
