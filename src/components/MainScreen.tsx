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
import { FarmPlanScreen } from '@/components/FarmPlanScreen';
import { AutonomousSentinelScreen } from '@/components/AutonomousSentinelScreen';
import { DetailedAnalysisView, DetailedTabType } from '@/components/DetailedAnalysisView';
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

  const isDemo = userName === 'Demo Farmer' || userName === 'किसान मित्र';
  const hasConfigured = Boolean(savedParams?.hasConfiguredFarm) || isDemo;

  // Primary View Mode: farmer (Simple on Surface) vs expert (Intelligent & Deep Underneath)
  const [viewMode, setViewMode] = useState<ViewMode>(
    savedParams?.viewMode || 'farmer'
  );
  const [selectedExpertTab, setSelectedExpertTab] = useState<DetailedTabType>(
    savedParams?.selectedExpertTab || 'overview'
  );

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

  // Decision & Execution State: pre-populated only if demo or explicitly saved
  const [decision, setDecision] = useState<FarmDecisionResponse | null>(() => {
    if (!hasConfigured) return null;
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

  // Execute initial optimization calculation on mount only in Demo Mode or if explicit cached decision exists
  useEffect(() => {
    if (isDemo && !decision) {
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
  }, [isDemo]);

  // Render Target 4-Page Experience (Page 3: Farm Plan vs Page 4: Autonomous Sentinel)
  if (viewMode === 'autonomous') {
    return (
      <AutonomousSentinelScreen
        userName={userName}
        decision={decision || ({} as FarmDecisionResponse)}
        logs={sentinelLogs}
        advisory={proactiveAdvisory}
        isChecking={isCheckingSentinel}
        onRunCheck={handleRunSentinelCheck}
        onBackToPlan={() => setViewMode('farmer')}
        onLogout={onLogout || onBack}
      />
    );
  }

  // Page 3: Farm Plan (Your Farm + Recommended Plan 2-Column Experience)
  return (
    <FarmPlanScreen
      userName={userName}
      selectedState={selectedState}
      selectedDistrict={selectedDistrict}
      landAcres={landAcres}
      budgetInr={budgetInr}
      irrigationType={irrigationType}
      irrigationReliability={irrigationReliability}
      season={season}
      riskTolerance={riskTolerance}
      decision={decision}
      loading={loading}
      onLandAcresChange={setLandAcres}
      onBudgetInrChange={setBudgetInr}
      onIrrigationTypeChange={setIrrigationType}
      onIrrigationReliabilityChange={setIrrigationReliability}
      onSeasonChange={setSeason}
      onRiskToleranceChange={setRiskTolerance}
      onRecalculate={runOptimization}
      onChangeLocation={onBack}
      onProceedToSentinel={() => setViewMode('autonomous')}
      onLogout={onLogout || onBack}
    />
  );
}

