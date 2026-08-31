import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useLanguage } from '@/i18n/LanguageContext';
import { getFarmDecision, getAvailableLocations } from '@/services/api';
import { ALL_INDIAN_DISTRICTS } from '@/lib/districtsCatalog';
import { FarmDetailsScreen } from '@/components/FarmDetailsScreen';
import { FarmPlanScreen } from '@/components/FarmPlanScreen';
import { InitializingScreen } from '@/components/InitializingScreen';
import { AutonomousSentinelScreen } from '@/components/AutonomousSentinelScreen';
import type { DetailedTabType } from '@/components/DetailedAnalysisView';
import { StageSwap } from '@/components/ui/motion';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { runAutonomousCycle } from '@/services/autonomousSentinel';
import {
  loadPlanExecutionState,
  savePlanExecutionState,
  startPlanExecution,
  toggleTaskCompletion,
  applyPlanAdjustments,
  type PlanExecutionState,
} from '@/lib/planProgress';
import type { PlanReasoningContext, TaskAdjustment } from '@/types/planLifecycle';

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
    if (parsed && typeof parsed === 'object' && Array.isArray(parsed.allocated_crops)) {
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

  const isDemo = userName === 'Demo Farmer' || userName === 'किसान मित्र';
  const hasConfigured = Boolean(savedParams?.hasConfiguredFarm) || isDemo;

  // Location Catalog State
  const [locations, setLocations] = useState<DistrictLocationItem[]>(ALL_INDIAN_DISTRICTS);

  // Farm Setup Form State (defaults only applied if demo, otherwise starts fresh for user input)
  const [selectedState, setSelectedState] = useState<string>(
    initialState || savedParams?.selectedState || 'Madhya Pradesh'
  );
  const [selectedDistrict, setSelectedDistrict] = useState<string>(
    initialDistrict || savedParams?.selectedDistrict || 'Bhopal'
  );
  const [landAcres, setLandAcres] = useState<number>(
    typeof savedParams?.landAcres === 'number' ? savedParams.landAcres : (isDemo ? 5.0 : 2.0)
  );
  const [budgetInr, setBudgetInr] = useState<number>(
    typeof savedParams?.budgetInr === 'number' ? savedParams.budgetInr : (isDemo ? 120000 : 50000)
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

  // Primary View Mode: farmer (Simple on Surface) vs expert (Intelligent & Deep Underneath) vs autonomous (Sentinel)
  const [viewMode, setViewMode] = useState<ViewMode>(
    savedParams?.viewMode || 'farmer'
  );
  const [selectedExpertTab, setSelectedExpertTab] = useState<DetailedTabType>(
    savedParams?.selectedExpertTab || 'overview'
  );

  // Decision & Execution State: pre-populated if cached in localStorage
  const [decision, setDecision] = useState<FarmDecisionResponse | null>(() => {
    return loadStoredDecision(
      initialState || savedParams?.selectedState || 'Madhya Pradesh',
      initialDistrict || savedParams?.selectedDistrict || 'Bhopal'
    );
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Progressive Live Plan Execution State
  const [planExecutionState, setPlanExecutionState] = useState<PlanExecutionState>(() =>
    loadPlanExecutionState()
  );

  const handleStartPlanExecution = useCallback(() => {
    setPlanExecutionState((prev: PlanExecutionState) => {
      const next = startPlanExecution(prev);
      savePlanExecutionState(next);
      return next;
    });
  }, []);

  const handleToggleDayCompletion = useCallback((day: number) => {
    setPlanExecutionState((prev: PlanExecutionState) => {
      const next = toggleTaskCompletion(prev, day);
      savePlanExecutionState(next);
      return next;
    });
  }, []);

  const handleApplyPlanAdjustments = useCallback((adjustments: TaskAdjustment | TaskAdjustment[]) => {
    setPlanExecutionState((prev: PlanExecutionState) => {
      const next = applyPlanAdjustments(prev, adjustments);
      savePlanExecutionState(next);
      return next;
    });
  }, []);

  // Guided flow navigation: Page 3 (details entry) → cinematic → Page 4 (plan).

  const [page, setPage] = useState<'details' | 'plan'>(
    savedParams?.page === 'plan' && decision ? 'plan' : 'details'
  );
  const [generating, setGenerating] = useState<boolean>(false);

  // Sync state to storage whenever it changes so refresh never loses data
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
          page,
          selectedExpertTab,
          hasConfiguredFarm: true,
        })
      );
    } catch (err) {
      console.warn('Could not save farm params:', err);
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
    viewMode,
    page,
    selectedExpertTab,
  ]);

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

  // Tap “Generate plan” on the details page (Page 3) → play the cinematic
  // analysis overlay while the optimizer runs, then reveal the full-screen plan.
  const handleGeneratePlan = useCallback(() => {
    setGenerating(true);
    runOptimization();
  }, [runOptimization]);

  // The cinematic swaps the page while it is still covering the screen, so its
  // fade lands on the plan rather than flashing the form the farmer just left.
  const handleGenerationPrepare = useCallback(() => {
    setPage('plan');
  }, []);

  // Cinematic hand-off → the plan (Page 4) is already mounted underneath. If the
  // optimizer is still running, FarmPlanScreen shows its own “finalizing” state.
  const handleGenerationReady = useCallback(() => {
    setGenerating(false);
    setPage('plan');
  }, []);

  // “Edit details” on the plan page returns to the details form (Page 3).
  const handleEditDetails = useCallback(() => {
    setPage('details');
  }, []);

  // Trigger manual telemetry observation & verification cycle on demand
  const handleRunSentinelCheck = useCallback((planContext?: PlanReasoningContext) => {
    if (!decision) return;
    setIsCheckingSentinel(true);
    setTimeout(() => {
      try {
        const { log, advisory, planAdjustments } = runAutonomousCycle(
          decision,
          language,
          previousSentinelStateRef.current,
          planContext
        );
        previousSentinelStateRef.current = {
          fingerprint: log.fingerprint,
          activeAdvisory: advisory,
          lastActionType: log.action_type,
        };
        setSentinelLogs((prev) => [log, ...prev.slice(0, 49)]);
        setProactiveAdvisory(advisory);

        if (planAdjustments && planAdjustments.length > 0) {
          setPlanExecutionState((prev: PlanExecutionState) => {
            const next = applyPlanAdjustments(prev, planAdjustments);
            savePlanExecutionState(next);
            return next;
          });
        }
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

  // Sync initial location props from map when changed
  useEffect(() => {
    if (initialState) setSelectedState(initialState);
    if (initialDistrict) setSelectedDistrict(initialDistrict);
  }, [initialState, initialDistrict]);

  // Execute optimization calculation if on the plan page and decision is not yet loaded
  useEffect(() => {
    if (!decision && page === 'plan' && !loading) {
      runOptimization();
    } else if (decision) {
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
  }, [decision, page, loading]);

  // Guided experience: Page 3 (details entry) → cinematic → Page 4 (full-screen
  // plan) → Page 5 (Sentinel). The three live inside one StageSwap so moving
  // between them morphs in the direction of travel instead of cutting.
  const innerStage: 'details' | 'plan' | 'sentinel' =
    viewMode === 'autonomous' ? 'sentinel' : page;

  return (
    <>
      <StageSwap
        stageKey={innerStage}
        order={innerStage === 'details' ? 3 : innerStage === 'plan' ? 4 : 5}
      >
        {innerStage === 'sentinel' ? (
          <ErrorBoundary fallbackTitle={isHi ? 'सेंटीनेल स्क्रीन लोड करने में समस्या आई' : 'Unable to load Sentinel screen'}>
            <AutonomousSentinelScreen
              userName={userName}
              decision={decision || ({} as FarmDecisionResponse)}
              logs={sentinelLogs}
              advisory={proactiveAdvisory}
              isChecking={isCheckingSentinel}
              planExecutionState={planExecutionState}
              onRunCheck={handleRunSentinelCheck}
              onToggleDayCompletion={handleToggleDayCompletion}
              onApplyPlanAdjustments={handleApplyPlanAdjustments}
              onBackToPlan={() => {
                setViewMode('farmer');
                setPage('plan');
              }}
              onLogout={onLogout || onBack}
              onEditDetails={() => {
                setViewMode('farmer');
                setPage('details');
              }}
              onChangeLocation={() => {
                setViewMode('farmer');
                onBack();
              }}
            />

          </ErrorBoundary>
        ) : innerStage === 'details' ? (
          <ErrorBoundary fallbackTitle={isHi ? 'खेत विवरण स्क्रीन लोड करने में समस्या आई' : 'Unable to load Farm Details screen'}>
            <FarmDetailsScreen
              userName={userName}
              selectedState={selectedState}
              selectedDistrict={selectedDistrict}
              landAcres={landAcres}
              budgetInr={budgetInr}
              irrigationType={irrigationType}
              irrigationReliability={irrigationReliability}
              season={season}
              riskTolerance={riskTolerance}
              loading={loading}
              hasPlan={Boolean(decision)}
              onLandAcresChange={setLandAcres}
              onBudgetInrChange={setBudgetInr}
              onIrrigationTypeChange={setIrrigationType}
              onIrrigationReliabilityChange={setIrrigationReliability}
              onSeasonChange={setSeason}
              onRiskToleranceChange={setRiskTolerance}
              onGenerate={handleGeneratePlan}
              onChangeLocation={onBack}
              onViewPlan={() => setPage('plan')}
              onProceedToSentinel={() => setViewMode('autonomous')}
              onLogout={onLogout || onBack}
            />
          </ErrorBoundary>
        ) : (
          <ErrorBoundary fallbackTitle={isHi ? 'योजना स्क्रीन लोड करने में समस्या आई' : 'Unable to load Farm Plan screen'}>
            <FarmPlanScreen
              userName={userName}
              selectedState={selectedState}
              selectedDistrict={selectedDistrict}
              landAcres={landAcres}
              budgetInr={budgetInr}
              season={season}
              decision={decision}
              loading={loading}
              planExecutionState={planExecutionState}
              onStartPlan={handleStartPlanExecution}
              onToggleDayCompletion={handleToggleDayCompletion}
              onEditDetails={handleEditDetails}
              onChangeLocation={onBack}
              onProceedToSentinel={() => setViewMode('autonomous')}
              onLogout={onLogout || onBack}
            />
          </ErrorBoundary>
        )}
      </StageSwap>

      {/* Cinematic analysis overlay — the AI reads the farm factor by factor
          using these very inputs, swaps the page underneath while it is still
          covering, then cross-fades away onto the finished plan. */}
      {generating && (
        <InitializingScreen
          stateName={selectedState}
          districtName={selectedDistrict}
          landAcres={landAcres}
          budgetInr={budgetInr}
          irrigationType={irrigationType}
          irrigationReliability={irrigationReliability}
          season={season}
          decision={decision}
          onPrepare={handleGenerationPrepare}
          onReady={handleGenerationReady}
        />
      )}
    </>
  );
}

