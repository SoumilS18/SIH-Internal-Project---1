import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  ArrowLeft,
  Compass,
  User,
  LogOut,
  RotateCcw,
  XCircle,
  AlertTriangle,
  Info,
  Sparkles,
} from 'lucide-react';
import { Atmosphere } from '@/components/Atmosphere';
import { useLanguage } from '@/i18n/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { getFarmDecision, getAvailableLocations } from '@/services/api';
import { ALL_INDIAN_DISTRICTS } from '@/lib/districtsCatalog';
import { getStateDisplayName, getDistrictDisplayName } from '@/i18n/geoNames';
import {
  getLocalizedBudgetAlert,
  getLocalizedNasaFallbackAlert,
} from '@/i18n/semanticAdapter';
import { FarmSetupFlow } from '@/components/FarmSetupFlow';
import { FarmerSimpleView } from '@/components/FarmerSimpleView';
import { DetailedAnalysisView, DetailedTabType } from '@/components/DetailedAnalysisView';
import { VoiceAssistantPanel } from '@/components/VoiceAssistantPanel';
import { AutonomousSentinelPill } from '@/components/AutonomousSentinelPill';
import { AutonomousLogModal } from '@/components/AutonomousLogModal';
import { AutonomousAgentView } from '@/components/AutonomousAgentView';
import { runAutonomousCycle } from '@/services/autonomousSentinel';
import type {
  FarmDecisionRequest,
  FarmDecisionResponse,
  DistrictLocationItem,
} from '@/types/farm';
import type {
  AutonomousCycleLog,
  ProactiveAdvisory,
  ActionType,
} from '@/types/autonomous';

interface MainScreenProps {
  onBack: () => void;
  onLogout?: () => void;
  initialLanguage?: string;
  initialState?: string;
  initialDistrict?: string;
  userName?: string;
}

type ViewMode = 'farmer' | 'expert' | 'autonomous';

const FARM_PARAMS_STORAGE_KEY = 'agrioptima_farm_params_v1';
const FARM_DECISION_STORAGE_KEY = 'agrioptima_farm_decision_v1';

function loadStoredFarmParams() {
  try {
    const raw = localStorage.getItem(FARM_PARAMS_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function loadStoredDecision(targetState: string, targetDistrict: string): FarmDecisionResponse | null {
  try {
    const raw = localStorage.getItem(FARM_DECISION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      parsed &&
      parsed.request &&
      parsed.request.state_name?.toLowerCase() === targetState.toLowerCase() &&
      parsed.request.district_name?.toLowerCase() === targetDistrict.toLowerCase()
    ) {
      return parsed as FarmDecisionResponse;
    }
  } catch {
    return null;
  }
  return null;
}

export function MainScreen({
  onBack,
  onLogout,
  initialState = 'Madhya Pradesh',
  initialDistrict = 'Bhopal',
  userName = 'Demo Farmer',
}: MainScreenProps) {
  const { language, t } = useLanguage();
  const isHi = language === 'hi';
  const savedParams = useMemo(() => loadStoredFarmParams(), []);

  // Primary View Mode: farmer (Simple on Surface) vs expert (Intelligent & Deep Underneath)
  const [viewMode, setViewMode] = useState<ViewMode>(
    savedParams?.viewMode || 'farmer'
  );
  const [selectedExpertTab, setSelectedExpertTab] = useState<DetailedTabType>(
    savedParams?.selectedExpertTab || 'overview'
  );

  // Location Catalog State
  const [locations, setLocations] = useState<DistrictLocationItem[]>(ALL_INDIAN_DISTRICTS);

  // Farm Setup Form State
  const [selectedState, setSelectedState] = useState<string>(
    initialState || savedParams?.selectedState || 'Madhya Pradesh'
  );
  const [selectedDistrict, setSelectedDistrict] = useState<string>(
    initialDistrict || savedParams?.selectedDistrict || 'Bhopal'
  );
  const [landAcres, setLandAcres] = useState<number>(
    typeof savedParams?.landAcres === 'number' ? savedParams.landAcres : 5.0
  );
  const [budgetInr, setBudgetInr] = useState<number>(
    typeof savedParams?.budgetInr === 'number' ? savedParams.budgetInr : 120000
  );
  const [irrigationType, setIrrigationType] = useState<'Borewell' | 'Rainfed' | 'Canal' | 'Drip' | 'Sprinkler'>(
    savedParams?.irrigationType || 'Borewell'
  );
  const [irrigationReliability, setIrrigationReliability] = useState<'High' | 'Medium' | 'Low'>(
    savedParams?.irrigationReliability || 'High'
  );
  const [season, setSeason] = useState<'Kharif' | 'Rabi' | 'Zaid'>(
    savedParams?.season || 'Kharif'
  );
  const [riskTolerance, setRiskTolerance] = useState<'Conservative' | 'Balanced' | 'Aggressive'>(
    savedParams?.riskTolerance || 'Balanced'
  );

  // Decision & Execution State: pre-populated from cached decision if available
  const [decision, setDecision] = useState<FarmDecisionResponse | null>(() => {
    return loadStoredDecision(
      initialState || savedParams?.selectedState || 'Madhya Pradesh',
      initialDistrict || savedParams?.selectedDistrict || 'Bhopal'
    );
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Autonomous Sentinel State
  const [sentinelLogs, setSentinelLogs] = useState<AutonomousCycleLog[]>([]);
  const [proactiveAdvisory, setProactiveAdvisory] = useState<ProactiveAdvisory | null>(null);
  const [isCheckingSentinel, setIsCheckingSentinel] = useState<boolean>(false);
  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const previousSentinelStateRef = React.useRef<{
    fingerprint: string;
    activeAdvisory: ProactiveAdvisory | null;
    lastActionType: ActionType;
  } | null>(null);

  // Save farm parameters whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(
        FARM_PARAMS_STORAGE_KEY,
        JSON.stringify({
          selectedState,
          selectedDistrict,
          landAcres,
          budgetInr,
          irrigationType,
          irrigationReliability,
          season,
          riskTolerance,
          viewMode,
          selectedExpertTab,
        })
      );
    } catch {}
  }, [
    selectedState,
    selectedDistrict,
    landAcres,
    budgetInr,
    irrigationType,
    irrigationReliability,
    season,
    riskTolerance,
    viewMode,
    selectedExpertTab,
  ]);

  // Load locations on mount
  useEffect(() => {
    async function loadCatalog() {
      try {
        const fetched = await getAvailableLocations();
        if (fetched && fetched.length > 0) {
          setLocations(fetched);
        }
      } catch (err) {
        console.warn('Locations load fallback:', err);
      }
    }
    loadCatalog();
  }, []);

  // Update district when state changes
  const handleStateChange = useCallback(
    (newState: string) => {
      setSelectedState(newState);
      const match = locations.find(
        (l) => l.state_name.toLowerCase() === newState.toLowerCase()
      );
      if (match) {
        setSelectedDistrict(match.district_name);
      }
    },
    [locations]
  );

  // Run Optimization Calculation
  const runOptimization = useCallback(async () => {
    setLoading(true);
    setError(null);

    const request: FarmDecisionRequest = {
      state_name: selectedState,
      district_name: selectedDistrict,
      land_size_acres: landAcres,
      budget_inr: budgetInr,
      irrigation_type: irrigationType,
      irrigation_reliability: irrigationReliability,
      season: season,
      risk_tolerance: riskTolerance,
    };

    try {
      const response = await getFarmDecision(request);
      setDecision(response);
      try {
        localStorage.setItem(FARM_DECISION_STORAGE_KEY, JSON.stringify(response));
      } catch {}

      // Autonomous Sentinel Cycle: OBSERVE -> REASON -> DECIDE -> VALIDATE -> ACT -> VERIFY -> MONITOR
      try {
        const { log, advisory } = runAutonomousCycle(response, language, previousSentinelStateRef.current);
        previousSentinelStateRef.current = {
          fingerprint: log.fingerprint,
          activeAdvisory: advisory,
          lastActionType: log.action_type,
        };
        setSentinelLogs((prev) => [log, ...prev.slice(0, 49)]);
        setProactiveAdvisory(advisory);
      } catch (sentinelErr) {
        console.warn('Autonomous Sentinel cycle fallback:', sentinelErr);
      }
    } catch (err: any) {
      console.error('Optimization error:', err);
      setError(
        isHi
          ? 'योजना की गणना करने में समस्या आई। कृपया पुनः प्रयास करें।'
          : 'Unable to calculate optimal farm plan. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [
    selectedState,
    selectedDistrict,
    landAcres,
    budgetInr,
    irrigationType,
    irrigationReliability,
    season,
    riskTolerance,
    language,
    isHi,
  ]);

  // Trigger manual telemetry observation & verification cycle on demand
  const handleRunSentinelCheck = useCallback(() => {
    if (!decision) return;
    setIsCheckingSentinel(true);
    setTimeout(() => {
      try {
        const { log, advisory } = runAutonomousCycle(decision, language, previousSentinelStateRef.current);
        previousSentinelStateRef.current = {
          fingerprint: log.fingerprint,
          activeAdvisory: advisory,
          lastActionType: log.action_type,
        };
        setSentinelLogs((prev) => [log, ...prev.slice(0, 49)]);
        setProactiveAdvisory(advisory);
      } catch (err) {
        console.warn('Manual Sentinel check fallback:', err);
      } finally {
        setIsCheckingSentinel(false);
      }
    }, 350);
  }, [decision, language]);

  // Update latest log language if language switches
  useEffect(() => {
    if (decision && sentinelLogs.length > 0) {
      try {
        const { log, advisory } = runAutonomousCycle(decision, language, null);
        previousSentinelStateRef.current = {
          fingerprint: log.fingerprint,
          activeAdvisory: advisory,
          lastActionType: log.action_type,
        };
        setSentinelLogs((prev) => [log, ...prev.slice(1, 50)]);
        setProactiveAdvisory(advisory);
      } catch {
        // Safe fallback
      }
    }
  }, [language]);

  // Periodic background autonomous monitoring loop (OBSERVE -> REASON -> MONITOR)
  useEffect(() => {
    if (!decision) return;
    const interval = setInterval(() => {
      try {
        const { log, advisory } = runAutonomousCycle(decision, language, previousSentinelStateRef.current);
        previousSentinelStateRef.current = {
          fingerprint: log.fingerprint,
          activeAdvisory: advisory,
          lastActionType: log.action_type,
        };
        setSentinelLogs((prev) => [log, ...prev.slice(0, 49)]);
        setProactiveAdvisory(advisory);
      } catch (err) {
        console.warn('Background Sentinel monitor cycle fallback:', err);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [decision, language]);

  // Execute initial optimization calculation on mount if no cached decision exists
  useEffect(() => {
    if (!decision) {
      runOptimization();
    } else {
      try {
        const { log, advisory } = runAutonomousCycle(decision, language, null);
        previousSentinelStateRef.current = {
          fingerprint: log.fingerprint,
          activeAdvisory: advisory,
          lastActionType: log.action_type,
        };
        setSentinelLogs([log]);
        setProactiveAdvisory(advisory);
      } catch (err) {
        console.warn('Initial cached Sentinel cycle fallback:', err);
      }
    }
  }, []);

  return (
    <section
      className="relative min-h-screen w-full overflow-y-auto text-cream-100 selection:bg-gold-400 selection:text-forest-950"
      aria-label="AgriOptima AI Farm Decision Dashboard"
    >
      <Atmosphere intensity="dim" />

      <div className="relative z-10 mx-auto flex min-h-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8 pb-20">
        {/* ========================================================================= */}
        {/* 1. TOP HEADER & PROVENANCE BAR */}
        {/* ========================================================================= */}
        <header className="flex flex-wrap items-center justify-between gap-3 border-b border-gold-300/15 pb-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              className="inline-flex items-center gap-1.5 rounded-full border border-gold-300/30 bg-forest-900/80 px-3.5 py-1.5 text-xs font-bold text-cream-100 transition-all hover:border-gold-300/70 hover:bg-forest-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-300 shadow-sm"
              aria-label="Change Farm Location"
            >
              <ArrowLeft size={14} className="text-gold-300" />
              <span>{t('header.changeFarm')}</span>
            </button>

            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="font-serif text-sm sm:text-base font-bold tracking-wide text-gold-100">
                  AgriOptima AI
                </span>
                <span className="hidden font-mono text-[10px] uppercase tracking-widest text-cream-300/50 sm:inline">
                  SIH 2026
                </span>
              </div>

              {decision && (
                <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-gold-300/25 bg-forest-900/70 px-2.5 py-0.5 text-xs font-semibold text-gold-200">
                  <Compass size={12} className="text-gold-300" />
                  <span>
                    {getDistrictDisplayName(decision.location.district_name, language)},{' '}
                    {getStateDisplayName(decision.location.state_name, language)}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Right Section: View Mode Toggle, Language Selector & Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Progressive Disclosure Mode Switcher: 3-Option Primary Navigation */}
            <div className="inline-flex items-center rounded-full border border-gold-300/25 bg-forest-950/90 p-1 shadow-inner max-w-full overflow-x-auto no-scrollbar">
              {/* 1. Farmer View */}
              <button
                type="button"
                onClick={() => setViewMode('farmer')}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  viewMode === 'farmer'
                    ? 'bg-gradient-to-r from-gold-400 to-gold-500 text-forest-950 shadow-[0_0_12px_rgba(255,210,26,0.3)]'
                    : 'text-cream-300/70 hover:text-cream-100 hover:bg-forest-900/40'
                }`}
              >
                <span>🌾</span>
                <span>{isHi ? 'सरल किसान दृश्य' : 'Farmer View'}</span>
              </button>

              {/* 2. Detailed Analysis */}
              <button
                type="button"
                onClick={() => setViewMode('expert')}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  viewMode === 'expert'
                    ? 'bg-gradient-to-r from-gold-400 to-gold-500 text-forest-950 shadow-[0_0_12px_rgba(255,210,26,0.3)]'
                    : 'text-cream-300/70 hover:text-cream-100 hover:bg-forest-900/40'
                }`}
              >
                <span>📊</span>
                <span>{isHi ? 'विस्तृत विश्लेषण' : 'Detailed Analysis'}</span>
              </button>

              {/* 3. Autonomous Agent */}
              <button
                type="button"
                onClick={() => setViewMode('autonomous')}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 sm:px-3 py-1.5 text-xs font-bold transition-all shrink-0 cursor-pointer ${
                  viewMode === 'autonomous'
                    ? 'bg-gradient-to-r from-gold-400 to-gold-500 text-forest-950 shadow-[0_0_12px_rgba(255,210,26,0.3)]'
                    : 'text-cream-300/70 hover:text-cream-100 hover:bg-forest-900/40'
                }`}
              >
                <span className="relative flex items-center justify-center">
                  <Sparkles
                    size={13}
                    className={viewMode === 'autonomous' ? 'text-forest-950' : 'text-emerald-400'}
                  />
                  {/* Subtle active monitoring indicator dot */}
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                  </span>
                </span>
                <span>{isHi ? 'स्वायत्त एजेंट' : 'Autonomous Agent'}</span>
              </button>
            </div>

            {/* Multilingual Selector */}
            <LanguageSelector />

            {/* User Session & Logout */}
            <div className="hidden sm:flex items-center gap-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-gold-300/20 bg-forest-900/60 px-3 py-1.5 text-xs text-cream-200 font-medium">
                <User size={13} className="text-gold-300" />
                <span>{userName}</span>
              </div>

              {onLogout && (
                <button
                  type="button"
                  onClick={onLogout}
                  className="inline-flex items-center rounded-full border border-forest-700/50 bg-forest-950/60 p-1.5 text-cream-300/70 transition-colors hover:border-pink-500/50 hover:bg-pink-950/40 hover:text-pink-300 focus:outline-none"
                  title={t('header.logout')}
                >
                  <LogOut size={13} />
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Active Alerts Banner */}
        {decision && (
          <div className="mt-3 space-y-2">
            {decision.farm_totals.budget_constrained && (
              <div className="flex items-center gap-2.5 rounded-2xl border border-gold-400/30 bg-gold-400/10 px-4 py-2.5 text-xs text-gold-200 font-medium">
                <AlertTriangle size={16} className="shrink-0 text-gold-300" />
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

            {decision.weather.fallback_used && (
              <div className="flex items-center gap-2 rounded-2xl border border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-200 font-medium">
                <Info size={15} className="shrink-0 text-amber-300" />
                <span>{getLocalizedNasaFallbackAlert(language)}</span>
              </div>
            )}
          </div>
        )}

        {/* Global Error Banner */}
        {error && (
          <div className="mt-3 flex items-center justify-between rounded-2xl border border-pink-500/40 bg-pink-950/70 p-3.5 text-xs text-pink-200">
            <div className="flex items-center gap-2">
              <XCircle size={16} className="text-pink-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => runOptimization()}
              className="inline-flex items-center gap-1 font-bold underline hover:text-white"
            >
              <RotateCcw size={12} /> {t('common.retry')}
            </button>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. MAIN 2-COLUMN LAYOUT: GUIDED SETUP & VOICE (LEFT) + WORKSPACE (RIGHT) */}
        {/* ========================================================================= */}
        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* ----------------------------------------------------------------------- */}
          {/* LEFT COLUMN: GUIDED FARM SETUP FORM + VOICE ASSISTANT */}
          {/* ----------------------------------------------------------------------- */}
          <aside className="space-y-6 lg:col-span-4">
            {/* Guided Conversational Farm Setup */}
            <FarmSetupFlow
              selectedState={selectedState}
              selectedDistrict={selectedDistrict}
              landAcres={landAcres}
              budgetInr={budgetInr}
              irrigationType={irrigationType}
              irrigationReliability={irrigationReliability}
              season={season}
              riskTolerance={riskTolerance}
              locations={locations}
              loading={loading}
              onStateChange={handleStateChange}
              onDistrictChange={setSelectedDistrict}
              onLandAcresChange={setLandAcres}
              onBudgetInrChange={setBudgetInr}
              onIrrigationTypeChange={setIrrigationType}
              onIrrigationReliabilityChange={setIrrigationReliability}
              onSeasonChange={setSeason}
              onRiskToleranceChange={setRiskTolerance}
              onSubmit={runOptimization}
            />

            {/* Voice Assistant Panel */}
            <VoiceAssistantPanel decision={decision} />
          </aside>

          {/* ----------------------------------------------------------------------- */}
          {/* RIGHT COLUMN: MAIN WORKSPACE (FARMER SIMPLE VIEW / DETAILED ANALYSIS) */}
          {/* ----------------------------------------------------------------------- */}
          <main className="space-y-6 lg:col-span-8">
            {decision ? (
              viewMode === 'farmer' ? (
                <FarmerSimpleView
                  decision={decision}
                  advisory={proactiveAdvisory}
                  onOpenDetailedAnalysis={() => {
                    setSelectedExpertTab('overview');
                    setViewMode('expert');
                  }}
                  onSelectTab={(tabId) => {
                    setSelectedExpertTab(tabId as DetailedTabType);
                    setViewMode('expert');
                  }}
                />
              ) : viewMode === 'expert' ? (
                <DetailedAnalysisView
                  decision={decision}
                  initialTab={selectedExpertTab}
                  onReturnToFarmerView={() => setViewMode('farmer')}
                />
              ) : (
                <AutonomousAgentView
                  decision={decision}
                  logs={sentinelLogs}
                  advisory={proactiveAdvisory}
                  isChecking={isCheckingSentinel}
                  onRunCheck={handleRunSentinelCheck}
                />
              )
            ) : null}
          </main>
        </div>
      </div>

      {/* Autonomous Decision & Action Log Modal */}
      <AutonomousLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        logs={sentinelLogs}
        advisory={proactiveAdvisory}
        onRunCheck={handleRunSentinelCheck}
        isChecking={isCheckingSentinel}
      />
    </section>
  );
}

