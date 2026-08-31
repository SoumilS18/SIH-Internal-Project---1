import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Mic,
  MicOff,
  Send,
  ArrowRight,
  CheckCircle2,
  Check,
  CloudRain,
  TrendingUp,
  FileText,
  Bug,
  AlertOctagon,
  Loader2,
  RefreshCw,
  VolumeX,
  Radio,
  Sparkles,
  Clock,
  AlertCircle,
  Camera,
  Landmark,
  Scan,
  ShieldCheck,
  ChevronRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import { useLanguage } from '@/i18n/LanguageContext';
import { JourneyNav } from '@/components/JourneyNav';
import { getCropDisplayName } from '@/i18n/cropNames';
import { getStateDisplayName, getDistrictDisplayName } from '@/i18n/geoNames';
import { formatRainfall } from '@/i18n/formatters';
import { translateSeason } from '@/i18n/enums';
import {
  askFarmerVoiceAssistant,
  speakVoiceAgentAudio,
  type VoiceAgentResponse,
} from '@/services/voiceAgentService';
import { AutonomousLogModal } from '@/components/AutonomousLogModal';
import { CropHealthScannerModal } from '@/components/CropHealthScannerModal';
import { FarmDigitalTwin } from '@/components/FarmDigitalTwin';
import { Reveal } from '@/components/ui/motion';

import { ReadingRow } from '@/components/ui/ReadingRow';
import type { FarmDecisionResponse } from '@/types/farm';
import type { AutonomousCycleLog, ProactiveAdvisory } from '@/types/autonomous';
import type { PlanReasoningContext } from '@/types/planLifecycle';
import {
  calculatePlanProgress,
  type PlanExecutionState,
} from '@/lib/planProgress';
import {
  getContextualTaskChecklist,
  getContextualSuggestedPrompts,
  UNIVERSAL_OBSERVATIONS,
} from '@/lib/contextualChecklists';

function getCategoryDisplayName(category: string | undefined, isHi: boolean): string {
  if (!category) return isHi ? 'कृषि कार्य' : 'FARM WORK';
  const cat = category.toUpperCase();
  if (cat.includes('IRRIG') || cat.includes('सिंचाई')) return isHi ? 'सिंचाई प्रबंधन' : 'IRRIGATION';
  if (cat.includes('NUTRI') || cat.includes('FERT') || cat.includes('खाद') || cat.includes('पोषण')) return isHi ? 'उर्वरक व पोषण' : 'NUTRIENT & FERTILIZER';
  if (cat.includes('PEST') || cat.includes('DISEASE') || cat.includes('कीट')) return isHi ? 'कीट एवं रोग रोकथाम' : 'PEST & DISEASE';
  if (cat.includes('PREP') || cat.includes('SOIL') || cat.includes('जुताई')) return isHi ? 'खेत तैयारी व जुताई' : 'FIELD PREPARATION';
  if (cat.includes('HARVEST') || cat.includes('कटाई')) return isHi ? 'कटाई एवं भंडारण' : 'HARVEST & STORAGE';
  if (cat.includes('WEED') || cat.includes('निराई')) return isHi ? 'निराई-गुड़ाई' : 'WEED MANAGEMENT';
  return isHi ? 'दैनिक कृषि कार्य' : category.toUpperCase();
}

function localizeTimestamp(ts: string, isHi: boolean): string {
  if (ts === 'Just now' || ts === 'अभी-अभी') return isHi ? 'अभी-अभी' : 'Just now';
  if (ts === 'Today · Day 1' || ts === 'आज · दिन 1') return isHi ? 'आज · दिन 1' : 'Today · Day 1';
  if (ts === '2 hours ago' || ts === '2 घंटे पहले') return isHi ? '2 घंटे पहले' : '2 hours ago';
  return ts;
}

function localizeObservationTitle(title: string, isHi: boolean): string {
  if (!title) return '';
  if (isHi) {
    if (title.toLowerCase().includes('heavy rain')) {
      return 'अत्याधिक भारी वर्षा दर्ज की गई';
    }
    if (title.toLowerCase().includes('leveling was done') || title.toLowerCase().includes('level the field')) {
      return 'खेत समतलीकरण व तैयारी का अवलोकन';
    }
    if (title.toLowerCase().includes('soil moisture and field drainage')) {
      return 'मिट्टी नमी स्तर और जल निकासी की समीक्षा पूरी';
    }
    if (title.toLowerCase().includes('field preparation & deep ploughing')) {
      return 'खेत की प्रारंभिक तैयारी व जुताई जांची गई';
    }
  } else {
    if (title.includes('अत्याधिक भारी वर्षा') || title.includes('अप्रत्याशित भारी बारिश')) {
      return 'Unexpected heavy rainfall reported';
    }
    if (title.includes('खेत समतलीकरण')) {
      return 'Field leveling and preparation observation';
    }
    if (title.includes('मिट्टी नमी स्तर')) {
      return 'Soil moisture and field drainage inspected';
    }
    if (title.includes('प्रारंभिक तैयारी व जुताई')) {
      return 'Field preparation & deep ploughing verified';
    }
  }
  return title;
}



/**
 * A section label on the workspace: caps, then a continuous hairline running to the edge.
 */
function SectionHeader({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-5 gap-y-2">
      <div className="flex min-w-0 flex-1 items-baseline gap-3">
        <h2 className="t-eyebrow shrink-0 text-[0.68rem] text-[var(--ink-soft)] uppercase tracking-wider font-bold">
          {title}
        </h2>
        <span
          className="h-px min-w-4 flex-1 -translate-y-[3px]"
          style={{ background: 'var(--line)' }}
          aria-hidden
        />
      </div>
      {children}
    </div>
  );
}

interface RecentObservationItem {
  id: string;
  title: string;
  timestamp: string;
  day: number;
  week: number;
  status: 'acknowledged' | 'under_review' | 'action_recommended' | 'plan_updated';
}

const RECENT_OBS_STORAGE_KEY = 'agrioptima_recent_observations_v1';

function loadRecentObservations(isHi: boolean): RecentObservationItem[] {
  try {
    const raw = localStorage.getItem(RECENT_OBS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch {}

  return [
    {
      id: 'obs-seed-1',
      title: isHi ? 'खेत की प्रारंभिक तैयारी व जुताई जांची गई' : 'Field preparation & deep ploughing verified',
      timestamp: isHi ? 'आज · दिन 1' : 'Today · Day 1',
      day: 1,
      week: 1,
      status: 'acknowledged',
    },
    {
      id: 'obs-seed-2',
      title: isHi ? 'मिट्टी नमी स्तर और जल निकासी की समीक्षा पूरी' : 'Soil moisture and field drainage inspected',
      timestamp: isHi ? '2 घंटे पहले' : '2 hours ago',
      day: 1,
      week: 1,
      status: 'under_review',
    },
  ];
}

interface AutonomousSentinelScreenProps {
  userName?: string;
  decision: FarmDecisionResponse;
  logs: AutonomousCycleLog[];
  advisory: ProactiveAdvisory | null;
  isChecking: boolean;
  planExecutionState?: PlanExecutionState;
  onRunCheck: (planContext?: PlanReasoningContext) => void;
  onBackToPlan: () => void;
  onLogout: () => void;
  onEditDetails?: () => void;
  onChangeLocation?: () => void;
  onToggleDayCompletion?: (day: number) => void;
  onApplyPlanAdjustments?: (adjustments: TaskAdjustment | TaskAdjustment[]) => void;
  onOpenBenefits?: () => void;
}

export function AutonomousSentinelScreen({
  userName,
  decision,
  logs,
  advisory,
  isChecking,
  planExecutionState,
  onRunCheck,
  onBackToPlan,
  onLogout,
  onEditDetails,
  onChangeLocation,
  onToggleDayCompletion,
  onApplyPlanAdjustments,
  onOpenBenefits,
}: AutonomousSentinelScreenProps) {

  const { language } = useLanguage();
  const isHi = language === 'hi';

  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);
  const [isScannerModalOpen, setIsScannerModalOpen] = useState<boolean>(false);


  // Farmer Ground Observation State
  const [selectedObservations, setSelectedObservations] = useState<string[]>([]);
  const [customReportText, setCustomReportText] = useState<string>('');
  const [reportSubmitted, setReportSubmitted] = useState<boolean>(false);
  const [reportFeedback, setReportFeedback] = useState<string | null>(null);
  const [recentObservations, setRecentObservations] = useState<RecentObservationItem[]>(() =>
    loadRecentObservations(isHi)
  );
  const [isRecentObsExpanded, setIsRecentObsExpanded] = useState<boolean>(false);


  // Voice & Text Assistant State
  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [chatInput, setChatInput] = useState<string>('');
  const [isProcessingAI, setIsProcessingAI] = useState<boolean>(false);
  const [conversation, setConversation] = useState<Array<{ role: 'user' | 'agent'; text: string; action?: string }>>([
    {
      role: 'agent',
      text: isHi
        ? 'नमस्ते किसान मित्र! मैं आपका एग्रीऑप्टिमा सहायक हूँ। आप मुझसे खेत, मौसम, बीज, खाद या सिंचाई के बारे में कुछ भी पूछ सकते हैं।'
        : 'Hello! I am your AgriOptima farm assistant. Ask me anything about your farm, weather, seeds, fertilizer, or irrigation.',
    },
  ]);

  // Sync initial conversation greeting and default observations when user switches language
  useEffect(() => {
    setConversation((prev) => {
      if (prev.length === 1 && prev[0].role === 'agent') {
        return [
          {
            role: 'agent',
            text: isHi
              ? 'नमस्ते किसान मित्र! मैं आपका एग्रीऑप्टिमा सहायक हूँ। आप मुझसे खेत, मौसम, बीज, खाद या सिंचाई के बारे में कुछ भी पूछ सकते हैं।'
              : 'Hello! I am your AgriOptima farm assistant. Ask me anything about your farm, weather, seeds, fertilizer, or irrigation.',
          },
        ];
      }
      return prev;
    });

    setRecentObservations((prev) => {
      return prev.map((obs) => {
        if (obs.id === 'obs-seed-1') {
          return {
            ...obs,
            title: isHi ? 'खेत की प्रारंभिक तैयारी व जुताई जांची गई' : 'Field preparation & deep ploughing verified',
            timestamp: isHi ? 'आज · दिन 1' : 'Today · Day 1',
          };
        }
        if (obs.id === 'obs-seed-2') {
          return {
            ...obs,
            title: isHi ? 'मिट्टी नमी स्तर और जल निकासी की समीक्षा पूरी' : 'Soil moisture and field drainage inspected',
            timestamp: isHi ? '2 घंटे पहले' : '2 hours ago',
          };
        }
        return obs;
      });
    });
  }, [isHi]);


  const isRecordingRef = useRef<boolean>(false);
  const accumulatedSpeechRef = useRef<string>('');
  const recognitionRef = useRef<any>(null);
  const audioSpeakerRef = useRef<{ stop: () => void } | null>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<HTMLDivElement>(null);
  const observationSectionRef = useRef<HTMLDivElement>(null);

  // Auto-scroll input to the latest words as the user speaks
  useEffect(() => {
    if (chatInputRef.current) {
      chatInputRef.current.scrollLeft = chatInputRef.current.scrollWidth;
    }
  }, [chatInput]);

  // Keep the newest message in view
  useEffect(() => {
    const el = streamRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [conversation, isProcessingAI]);

  const rain7d = decision?.weather?.forecast_rain_7d_total_mm ?? 0;
  const soilMoisture = decision?.weather?.root_zone_soil_moisture_m3m3 ?? 0.35;
  const allocatedCrops = decision?.allocated_crops || [];
  const primaryCropName = allocatedCrops[0]?.crop_name || 'Tomato';
  const cropNames = allocatedCrops.map((c) => c.crop_name).filter(Boolean);

  const safePlanState: PlanExecutionState = planExecutionState || {
    isStarted: false,
    startDate: null,
    lastActiveDate: null,
    currentStatus: 'NOT_STARTED',
    completedDays: [],
    skippedDays: [],
    taskNotes: {},
    taskStatusMap: {},
    adjustments: {},
  };
  const season = (decision.request?.season || 'Kharif') as 'Kharif' | 'Rabi' | 'Zaid';
  const progress = calculatePlanProgress(safePlanState, season, cropNames, isHi ? 'hi' : 'en');
  const taskChecklist = getContextualTaskChecklist(
    progress.currentDay,
    progress.currentWeek,
    progress.todayTask,
    primaryCropName
  );

  const planContext: PlanReasoningContext = {
    isStarted: safePlanState.isStarted,
    currentDay: progress.currentDay,
    currentWeek: progress.currentWeek,
    totalDays: progress.totalDays,
    totalWeeks: progress.totalWeeks,
    todayTask: progress.todayTask,
    primaryCrop: primaryCropName,
    allocatedCrops: cropNames,
    planStatus: progress.planStatus,
    farmerObservations: selectedObservations,
    customReportText: customReportText.trim() || undefined,
  };

  const districtLabel = getDistrictDisplayName(decision.location?.district_name || 'Bhopal', language);
  const stateLabel = getStateDisplayName(decision.location?.state_name || 'Madhya Pradesh', language);
  const latestLog = logs[0] || null;
  const watchedCrops = (allocatedCrops.length ? allocatedCrops.map((c) => c.crop_name) : [primaryCropName])
    .map((name) => getCropDisplayName(name, language))
    .join(' · ');

  // A calm plan needs no intervention; anything else is an action recommendation.
  const isCalm = !advisory || advisory.severity === 'info' || advisory.severity === 'success';

  // Dynamic suggested prompts for the AI assistant
  const suggestedPrompts = useMemo(() => {
    return getContextualSuggestedPrompts(
      progress.todayTask?.category,
      primaryCropName,
      progress.currentDay,
      progress.currentWeek,
      isHi
    );
  }, [progress.todayTask?.category, primaryCropName, progress.currentDay, progress.currentWeek, isHi]);

  // Toggle observation checkbox
  const toggleObservation = (id: string) => {
    setSelectedObservations((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Smooth scroll to observation section and select task delayed
  const handleReportDelay = () => {
    if (!selectedObservations.includes('task_delayed')) {
      setSelectedObservations((prev) => [...prev, 'task_delayed']);
    }
    observationSectionRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Submit farmer observation to trigger re-evaluation
  const handleSubmitObservation = () => {
    if (selectedObservations.length === 0 && !customReportText.trim()) return;

    setReportSubmitted(true);
    onRunCheck(planContext);

    // Build concise label for recent observations list
    let reportTitle = customReportText.trim();
    if (!reportTitle && selectedObservations.length > 0) {
      const firstId = selectedObservations[0];
      const matchQ = taskChecklist.questions.find((q) => q.id === firstId);
      const matchU = UNIVERSAL_OBSERVATIONS.find((u) => u.id === firstId);
      reportTitle = isHi
        ? (matchQ?.label.hi || matchU?.label.hi || 'खेत अवलोकन दर्ज किया गया')
        : (matchQ?.label.en || matchU?.label.en || 'Field observation reported');
    }

    const newObs: RecentObservationItem = {
      id: `obs-${Date.now()}`,
      title: reportTitle,
      timestamp: isHi ? 'अभी-अभी' : 'Just now',
      day: progress.currentDay,
      week: progress.currentWeek,
      status: advisory?.action_required ? 'action_recommended' : 'acknowledged',
    };

    setRecentObservations((prev) => {
      const updated = [newObs, ...prev.slice(0, 9)];
      try {
        localStorage.setItem(RECENT_OBS_STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });

    const note = isHi
      ? `आपकी रिपोर्ट दर्ज कर ली गई है। AI सेंटीनेल ने दिन ${progress.currentDay} के कार्य '${progress.todayTask?.title || 'कार्य'}' और खेत की स्थिति का पुनः विश्लेषण किया है।`
      : `Your report has been received. Sentinel has re-evaluated Day ${progress.currentDay} task (${progress.todayTask?.title || 'Task'}) with live field telemetry.`;

    setReportFeedback(note);
    setTimeout(() => setReportFeedback(null), 6000);
  };

  // Ask AI handler
  const handleAskQuestion = async (queryText: string) => {
    const q = queryText.trim();
    if (!q || isProcessingAI) return;

    setConversation((prev) => [...prev, { role: 'user', text: q }]);
    setChatInput('');
    setIsProcessingAI(true);

    try {
      const resp: VoiceAgentResponse = await askFarmerVoiceAssistant(
        q,
        decision,
        language,
        conversation.map((c) => ({ role: c.role, text: c.text })),
        planContext
      );
      const answerText = isHi ? resp.display_text || resp.spoken_text : resp.display_text || resp.spoken_text;

      setConversation((prev) => [
        ...prev,
        {
          role: 'agent',
          text: answerText,
          action: resp.recommended_action,
        },
      ]);

      // Automatically update plan for upcoming days if AI suggested task modifications
      if (resp.plan_adjustments && resp.plan_adjustments.length > 0) {
        if (onApplyPlanAdjustments) {
          onApplyPlanAdjustments(resp.plan_adjustments);
        }
        const adjDayNums = resp.plan_adjustments.map((a) => a.originalDay).join(', ');
        const adjMsg = isHi
          ? `⚡ AI अनुशंसा: दिन ${adjDayNums} की कार्य योजना को स्वतः अद्यतन कर दिया गया है।`
          : `⚡ AI recommendation: Schedule for Day ${adjDayNums} has been dynamically updated.`;
        setReportFeedback(adjMsg);
        setTimeout(() => setReportFeedback(null), 8000);
      }

      // Play TTS
      try {
        if (audioSpeakerRef.current) audioSpeakerRef.current.stop();
        audioSpeakerRef.current = await speakVoiceAgentAudio(resp.spoken_text, language);
        setIsSpeaking(true);
      } catch {
        // Fallback TTS
      }

    } catch {
      const fallback = isHi
        ? 'वर्तमान खेत योजना एवं मौसम के अनुसार स्थिति सामान्य है।'
        : 'Based on current farm telemetry, your plan remains well aligned.';
      setConversation((prev) => [...prev, { role: 'agent', text: fallback }]);
    } finally {
      setIsProcessingAI(false);
    }
  };

  // Stop the agent's spoken reply
  const handleStopAudio = () => {
    try {
      audioSpeakerRef.current?.stop();
    } catch {}
    setIsSpeaking(false);
  };

  // Explicit Mic Toggle Handler
  const handleToggleVoice = () => {
    if (isRecordingRef.current || isListening) {
      isRecordingRef.current = false;
      setIsListening(false);

      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }

      const finalQuery = (accumulatedSpeechRef.current || chatInput).trim();
      accumulatedSpeechRef.current = '';

      if (finalQuery) {
        handleAskQuestion(finalQuery);
      }
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert(
        isHi
          ? 'आपके ब्राउज़र में आवाज़ पहचान समर्थित नहीं है। कृपया टेक्स्ट टाइप करें।'
          : 'Voice recognition is not supported in this browser. Please type your query.'
      );
      return;
    }

    try {
      accumulatedSpeechRef.current = '';
      setChatInput('');
      isRecordingRef.current = true;
      setIsListening(true);

      const recognition = new SpeechRecognition();
      recognition.lang = isHi ? 'hi-IN' : 'en-IN';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let fullTranscript = '';
        for (let i = 0; i < event.results.length; i++) {
          fullTranscript += event.results[i][0].transcript + ' ';
        }
        const clean = fullTranscript.trim();
        accumulatedSpeechRef.current = clean;
        setChatInput(clean);
      };

      recognition.onend = () => {
        if (isRecordingRef.current) {
          try {
            recognition.start();
          } catch {}
        } else {
          setIsListening(false);
        }
      };

      recognition.onerror = (event: any) => {
        if (event.error === 'no-speech' && isRecordingRef.current) {
          return;
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch {
      isRecordingRef.current = false;
      setIsListening(false);
    }
  };

  /* ------------------------------------------------------------------ */
  /* The five streams the sentinel watches                               */
  /* ------------------------------------------------------------------ */
  const streams = [
    {
      id: 'weather',
      Icon: CloudRain,
      tone: 'var(--sky)',
      name: isHi ? '7-दिन मौसम' : 'Weather (7-day)',
      reading: `${formatRainfall(rain7d, language)} · ${isHi ? 'नमी' : 'Soil'} ${(soilMoisture * 100).toFixed(0)}%`,
      live: true,
      cadence: isHi ? 'प्रत्येक 6 घंटे' : 'Every 6 hrs',
    },
    {
      id: 'mandi',
      Icon: TrendingUp,
      tone: 'var(--grain-deep)',
      name: isHi ? 'मंडी भाव' : 'Mandi prices',
      reading: isHi ? 'अखिल भारतीय फीड' : 'All-India feed',
      live: false,
      cadence: isHi ? 'दैनिक' : 'Daily',
    },
    {
      id: 'policy',
      Icon: FileText,
      tone: 'var(--field)',
      name: isHi ? 'सरकारी योजनाएं' : 'Government schemes',
      reading: 'PM-KISAN · PMFBY',
      live: false,
      cadence: isHi ? 'दैनिक' : 'Daily',
    },
    {
      id: 'pest',
      Icon: Bug,
      tone: 'var(--soil)',
      name: isHi ? 'कीट व रोग' : 'Pest & disease',
      reading: isHi ? 'कृषि सलाह' : 'Agro advisory',
      live: false,
      cadence: isHi ? 'प्रत्येक 12 घंटे' : 'Every 12 hrs',
    },
    {
      id: 'extreme',
      Icon: AlertOctagon,
      tone: 'var(--risk)',
      name: isHi ? 'चरम मौसम' : 'Extreme weather',
      reading: isHi ? 'लाइव मॉनिटर' : 'Live monitored',
      live: true,
      cadence: isHi ? 'रियल-टाइम' : 'Real-time',
    },
  ];

  const hasReport = selectedObservations.length > 0 || customReportText.trim().length > 0;

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between text-[var(--ink)] selection:bg-[var(--grain-tint)] selection:text-[var(--grain-deep)]">
      {/* ===================================================================== */}
      {/* 1. TOP NAVIGATION                                                     */}
      {/* ===================================================================== */}
      <JourneyNav
        stage={4}
        accent="grain"
        userName={userName}
        reachable={[1, 2, 3]}
        onNavigate={(target) => {
          if (target === 1) onChangeLocation?.();
          if (target === 2) onEditDetails?.();
          if (target === 3) onBackToPlan();
        }}
        onLogout={onLogout}
        actions={
          <>
            <button
              type="button"
              onClick={() => setIsLogModalOpen(true)}
              className="nav-pill hidden h-9 items-center gap-1.5 px-3 text-xs font-medium text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)] sm:inline-flex"
            >
              <FileText size={14} className="text-[var(--grain-deep)]" />
              <span>{isHi ? 'निगरानी लॉग्स' : 'Activity Logs'}</span>
            </button>
            <button
              type="button"
              onClick={() => onRunCheck(planContext)}
              disabled={isChecking}
              className="btn btn-primary btn-sm disabled:opacity-60"
            >
              {isChecking ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              <span>
                {isChecking
                  ? isHi
                    ? 'जांच हो रही है...'
                    : 'Checking...'
                  : isHi
                    ? 'सेंटीनेल जांच चलाएं'
                    : 'Run Sentinel Check'}
              </span>
            </button>
          </>
        }
      />

      {/* ===================================================================== */}
      {/* 2. CONTINUOUS AI OPERATING SYSTEM WORKSPACE                           */}
      {/* ===================================================================== */}
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-12 px-5 pb-24 pt-24 sm:px-8 sm:pt-28 md:pb-12">

        {/* =================================================================== */}
        {/* SECTION 1: TOP STATUS + TODAY'S TASK (LEFT) & AGENT DECISION (RIGHT)*/}
        {/* =================================================================== */}
        <Reveal className="border-b border-[var(--line)] pb-10">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-12">

            {/* LEFT COLUMN: TODAY'S TASK & CONNECTED TIMELINE */}
            <div className="lg:col-span-7 space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-[var(--field)]" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--field)]" />
                  </span>
                  <span className="t-eyebrow text-[11px] font-bold text-[var(--field-deep)] uppercase tracking-wider">
                    {isHi ? 'सेंटीनेल निगरानी सक्रिय · 24/7' : 'SENTINEL WATCHING · 24/7'}
                  </span>
                </div>

                <span className="chip chip-field text-[11px] font-medium font-data">
                  {isHi
                    ? `दिन ${progress.currentDay} / ${progress.totalDays} · सप्ताह ${progress.currentWeek}`
                    : `Day ${progress.currentDay} of ${progress.totalDays} · Week ${progress.currentWeek}`}
                </span>
              </div>

              <div>
                <h1 className="t-h2 text-[1.75rem] font-bold tracking-tight text-[var(--ink)] sm:text-[2rem]">
                  {isHi ? `आज का कार्य (दिन ${progress.currentDay})` : `Today's Task (Day ${progress.currentDay})`}
                </h1>
                <p className="mt-1 text-xs text-[var(--ink-soft)] font-medium">
                  {districtLabel}, {stateLabel} · {watchedCrops} · {translateSeason(season, language)} 2026
                </p>
              </div>

              {/* REFINED TASK SPOTLIGHT (Prominent 3D Living Farm Digital Twin) */}
              <div className="border-l-3 border-[var(--field)] bg-[var(--field-tint)]/80 rounded-r-[20px] p-5 sm:p-6 shadow-xs">
                <div className="flex flex-col sm:flex-row items-center gap-5 sm:gap-6">
                  {/* Prominent 3D Farm Digital Twin Animation */}
                  <div className="w-full sm:w-[220px] md:w-[250px] lg:w-[270px] h-[160px] sm:h-[180px] shrink-0 rounded-[16px] overflow-hidden bg-[var(--surface-solid)] border border-[var(--line)] relative shadow-sm">
                    <FarmDigitalTwin
                      decision={decision}
                      height={180}
                      compact={true}
                      interactive={true}
                      showWeather={true}
                      scanning={isChecking}
                      aiState={isChecking ? 'analyzing' : isListening ? 'listening' : 'complete'}
                      showDetailCard={false}
                      className="w-full h-full"
                    />
                  </div>

                  {/* Task Info & Actions */}
                  <div className="flex-1 min-w-0 space-y-3 w-full">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="t-eyebrow text-[0.66rem] font-bold text-[var(--field-deep)] uppercase tracking-wider">
                          {isHi
                            ? `दिन ${progress.currentDay} · ${getCategoryDisplayName(progress.todayTask?.category, isHi)}`
                            : `DAY ${progress.currentDay} · ${getCategoryDisplayName(progress.todayTask?.category, isHi)}`}
                        </span>
                        {(progress.todayTask as any)?.isAdjusted && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-full shadow-2xs">
                            ⚡ {isHi ? 'AI द्वारा समायोजित' : 'AI Adjusted'}
                          </span>
                        )}
                      </div>


                      {safePlanState.completedDays.includes(progress.currentDay) && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--field-deep)] bg-white/70 px-2.5 py-0.5 rounded-full shadow-2xs">
                          <CheckCircle2 size={13} />
                          <span>{isHi ? 'कार्य संपन्न' : 'Completed'}</span>
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-[var(--ink)]">
                        {progress.todayTask?.title || (isHi ? 'दैनिक खेत निगरानी' : 'Daily Farm Monitoring')}
                      </h3>
                      <p className="mt-1 text-[13px] leading-relaxed text-[var(--ink-soft)]">
                        {progress.todayTask?.desc || (isHi ? 'मौसम एवं नमी के अनुसार सामान्य कृषि कार्य जारी रखें।' : 'Continue standard farm surveillance aligned with weather.')}
                      </p>
                    </div>

                    {/* Inline Task Actions */}
                    <div className="flex flex-wrap items-center gap-2.5 pt-1.5 border-t border-[var(--line-soft)]">
                      {onToggleDayCompletion && (
                        <button
                          type="button"
                          onClick={() => onToggleDayCompletion(progress.currentDay)}
                          className={`btn btn-sm ${
                            safePlanState.completedDays.includes(progress.currentDay)
                              ? 'btn-ghost border border-[var(--field)] font-semibold text-[var(--field-deep)] bg-white/80'
                              : 'btn-primary shadow-xs'
                          }`}
                        >
                          <Check size={13} />
                          <span>
                            {safePlanState.completedDays.includes(progress.currentDay)
                              ? (isHi ? 'कार्य संपन्न दर्ज है ✓' : 'Task Completed ✓')
                              : (isHi ? 'कार्य संपन्न दर्ज करें' : 'Mark as Completed')}
                          </span>
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={handleReportDelay}
                        className="btn btn-ghost btn-sm text-[var(--ink-soft)] hover:text-[var(--ink)] flex items-center gap-1.5"
                      >
                        <Clock size={13} />
                        <span>{isHi ? 'समस्या / देरी दर्ज करें' : 'Report Issue / Delay'}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* CONNECTED WEEK PROGRESS TIMELINE (A true progress journey: ●────○────○) */}
              <div className="pt-2">
                <div className="flex items-center justify-between text-xs mb-3">
                  <span className="t-eyebrow text-[10px] font-bold text-[var(--ink-soft)] uppercase tracking-wider">
                    {isHi ? `सप्ताह ${progress.currentWeek} प्रगति` : `WEEK ${progress.currentWeek} PROGRESS`}
                  </span>
                  <span className="font-data text-[11px] text-[var(--ink-soft)]">
                    {isHi ? `दिन ${(progress.currentWeek - 1) * 7 + 1}–${progress.currentWeek * 7}` : `Days ${(progress.currentWeek - 1) * 7 + 1}–${progress.currentWeek * 7}`}
                  </span>
                </div>

                <div className="relative flex items-center justify-between pt-1">
                  {/* Continuous Connecting Baseline Rule */}
                  <span
                    className="absolute left-3 right-3 top-[14px] h-[2px] z-0"
                    style={{ background: 'var(--line-strong)' }}
                    aria-hidden
                  />

                  {Array.from({ length: 7 }, (_, i) => {
                    const dayNum = (progress.currentWeek - 1) * 7 + i + 1;
                    const isToday = dayNum === progress.currentDay && safePlanState.isStarted;
                    const isDone = safePlanState.completedDays.includes(dayNum) || (dayNum < progress.currentDay && safePlanState.isStarted);
                    const hasAdjustment = Boolean(safePlanState.adjustments?.[dayNum]);

                    return (
                      <div
                        key={dayNum}
                        className="relative z-10 flex flex-col items-center group cursor-default"
                      >
                        {/* Node */}
                        <div className="relative">
                          <div
                            className={`h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-bold transition-transform ${
                              isToday
                                ? 'bg-[var(--field-deep)] text-white ring-4 ring-[var(--field-tint)] shadow-sm scale-110'
                                : isDone
                                ? 'bg-[var(--field)] text-white shadow-xs'
                                : hasAdjustment
                                ? 'bg-amber-100 border-2 border-amber-400 text-amber-900 font-bold'
                                : 'bg-[var(--surface-solid)] border-2 border-[var(--line-strong)] text-[var(--ink-ghost)]'
                            }`}
                          >
                            {isDone ? '✓' : isToday ? '●' : '○'}
                          </div>
                          {hasAdjustment && (
                            <span
                              className="absolute -top-1 -right-1 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-amber-500 text-[8px] text-white font-bold shadow-xs"
                              title={safePlanState.adjustments?.[dayNum]?.reason || 'Adjusted'}
                            >
                              ⚡
                            </span>
                          )}
                        </div>

                        {/* Day Label */}
                        <span
                          className={`mt-1.5 text-[10px] font-medium transition-colors ${
                            isToday
                              ? 'font-bold text-[var(--field-deep)]'
                              : isDone
                              ? 'text-[var(--ink)]'
                              : hasAdjustment
                              ? 'text-amber-800 font-semibold'
                              : 'text-[var(--ink-ghost)]'
                          }`}
                        >
                          {isHi ? `दिन ${i + 1}` : `Day ${i + 1}`}
                        </span>
                      </div>
                    );

                  })}
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: AGENT DECISION (Clean System Status Panel, No Cards Inside Cards) */}
            <div className="lg:col-span-5 lg:border-l lg:border-[var(--line)] lg:pl-10 space-y-6">
              <SectionHeader title={isHi ? 'एजेंट का निर्णय' : 'AGENT DECISION'}>
                <span className={`chip shrink-0 text-[10px] ${isCalm ? 'chip-field' : 'chip-grain'}`}>
                  {isCalm ? <CheckCircle2 size={12} /> : <Radio size={12} />}
                  {isCalm
                    ? isHi
                      ? 'योजना यथावत उपयुक्त'
                      : 'No change needed'
                    : isHi
                      ? 'कार्यवाही की सिफारिश'
                      : 'Action recommended'}
                </span>
              </SectionHeader>

              <div>
                <h2 className="t-h3 text-[1.25rem] font-bold leading-snug text-[var(--ink)] sm:text-[1.4rem]">
                  {advisory?.headline ||
                    (isHi
                      ? 'आपकी वर्तमान खेत योजना पूरी तरह अनुकूल है।'
                      : 'Your current farm plan matches field conditions.')}
                </h2>
                <p className="mt-1.5 text-xs text-[var(--ink-soft)] font-data">
                  {isHi ? 'अंतिम स्वचालित जांच' : 'Last autonomous scan'} · {latestLog ? latestLog.timestamp : (isHi ? 'अभी-अभी' : 'just now')}
                </p>
              </div>

              {/* Clean Monitored Metrics (Separated by subtle hairlines) */}
              <div className="divide-y divide-[var(--line-soft)] border-y border-[var(--line-soft)] py-1">
                <ReadingRow
                  label={isHi ? 'मिट्टी नमी' : 'Soil Moisture'}
                  value={`${(soilMoisture * 100).toFixed(0)}% · ${isHi ? 'अनुकूल' : 'Optimal'}`}
                />
                <ReadingRow
                  label={isHi ? '7-दिन वर्षा' : 'Rain (7-Day Forecast)'}
                  value={formatRainfall(rain7d, language)}
                />
                <ReadingRow
                  label={isHi ? 'निगरानी में फसलें' : 'Crop Watched'}
                  value={watchedCrops}
                />
              </div>

              {/* Analytical Summary */}
              <dl className="space-y-4 pt-1 text-xs">
                <div>
                  <dt className="t-eyebrow mb-1 text-[0.62rem] font-bold text-[var(--ink-soft)] uppercase tracking-wider">
                    {isHi ? 'क्या स्थिति है?' : 'WHAT CHANGED'}
                  </dt>
                  <dd className="text-[13px] leading-relaxed text-[var(--ink-soft)]">
                    {isHi
                      ? `7-दिवसीय वर्षा पूर्वानुमान ${rain7d.toFixed(1)} mm और मिट्टी नमी ${(soilMoisture * 100).toFixed(0)}% है। खेत की सभी स्थितियां सुरक्षित सीमा में हैं।`
                      : `Rainfall forecast is ${rain7d.toFixed(1)} mm and root zone soil moisture is at ${(soilMoisture * 100).toFixed(0)}%. Farm conditions remain balanced.`}
                  </dd>
                </div>

                <div className="border-l-2 border-[var(--field)] pl-3.5">
                  <dt className="t-eyebrow mb-1 text-[0.62rem] font-bold text-[var(--field-deep)] uppercase tracking-wider">
                    {isHi ? 'क्या करना चाहिए?' : 'WHAT YOU SHOULD DO'}
                  </dt>
                  <dd className="text-[13px] leading-relaxed font-medium text-[var(--ink)]">
                    {advisory?.recommended_action ||
                      (isHi
                        ? 'दिन के निर्धारित कार्य के अनुसार खेत की तैयारी व सामान्य कृषि प्रबंधन जारी रखें।'
                        : 'Proceed with the scheduled farm plan for today as planned.')}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </Reveal>

        {/* =================================================================== */}
        {/* SECTION 2: AGRIOPTIMA FARM ASSISTANT (CENTRAL HERO WORKSPACE)       */}
        {/* =================================================================== */}
        <Reveal delay={60} className="border-b border-[var(--line)] pb-8">
          <div className="space-y-4">
            {/* Assistant Header */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="grid h-8 w-8 place-items-center rounded-full bg-[var(--field)] text-white shadow-xs">
                  <Sparkles size={16} />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-bold text-[var(--ink)]">
                    {isHi ? 'एग्रीऑप्टिमा कृषि सहायक' : 'AgriOptima Farm Assistant'}
                  </h2>
                  <p className="text-[11px] text-[var(--ink-soft)]">
                    {isHi ? 'आपका AI-संचालित कृषि साथी' : 'Your AI-powered farming companion'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {isSpeaking && (
                  <button
                    type="button"
                    onClick={handleStopAudio}
                    className="btn btn-ghost btn-xs text-[var(--risk)] flex items-center gap-1 font-medium"
                  >
                    <VolumeX size={12} />
                    <span>{isHi ? 'आवाज़ बंद करें' : 'Stop Audio'}</span>
                  </button>
                )}
                <span className="t-eyebrow text-[0.6rem] text-[var(--ink-ghost)] font-medium">
                  {isHi ? 'सरवम वॉयस + जेमिनी AI' : 'POWERED BY GEMINI + SARVAM VOICE'}
                </span>
              </div>
            </div>

            {/* Central Compact Voice Interaction Hub */}
            <div className="flex flex-col items-center justify-center text-center py-3.5 border-y border-[var(--line-soft)]">
              <button
                type="button"
                onClick={handleToggleVoice}
                aria-pressed={isListening}
                className={`relative grid h-14 w-14 sm:h-16 sm:w-16 place-items-center rounded-full transition-all hover:scale-105 ${
                  isListening
                    ? 'bg-[var(--risk)] text-white shadow-[0_0_20px_rgba(239,68,68,0.45)] animate-breathe'
                    : 'bg-gradient-to-tr from-[var(--field-deep)] to-[var(--field)] text-white shadow-[0_4px_16px_rgba(46,125,50,0.25)]'
                }`}
                title={
                  isListening
                    ? isHi
                      ? 'रोकने और पूछने के लिए माइक दबाएं'
                      : 'Tap mic to stop & ask'
                    : isHi
                      ? 'बोलने के लिए माइक दबाएं'
                      : 'Tap to speak'
                }
                aria-label={isHi ? 'बोलकर सवाल पूछें' : 'Speak to AI Assistant'}
              >
                {isListening ? <MicOff size={24} /> : <Mic size={24} />}
                {isListening && (
                  <span className="absolute inset-0 rounded-full border-2 border-white animate-ping opacity-60 pointer-events-none" />
                )}
              </button>

              <h3 className="mt-2.5 text-sm sm:text-base font-bold text-[var(--ink)]">
                {isListening
                  ? (isHi ? 'सुन रहा हूँ... पूरा होने पर माइक पुनः दबाएं' : 'Listening... Tap mic when finished speaking')
                  : (isHi ? 'अपनी भाषा में बोलकर पूछें' : 'Tap to speak in your language')}
              </h3>
              <p className="mt-0.5 text-[11px] text-[var(--ink-soft)] max-w-lg">
                {isHi
                  ? 'आज के कार्य, मौसम, खाद, सिंचाई, फसलों या कृषि योजना के बारे में पूछें।'
                  : 'Ask about today\'s task, weather, fertilizer, irrigation, crops, or your farm plan.'}
              </p>

              {isListening && chatInput && (
                <div className="mt-2 max-w-md rounded-full bg-[var(--field-tint)] px-3 py-1 text-xs font-semibold text-[var(--field-deep)]">
                  {chatInput}
                </div>
              )}
            </div>

            {/* Dynamic Suggested Daily Questions */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--field)]" />
                <span className="t-eyebrow text-[9.5px] font-bold text-[var(--ink-soft)] uppercase tracking-wider">
                  {isHi ? 'आज के लिए सुझाए गए सवाल' : 'SUGGESTED QUESTIONS FOR TODAY'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {suggestedPrompts.map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleAskQuestion(prompt)}
                    disabled={isProcessingAI}
                    className="choice max-w-full truncate px-3 py-1 text-[11px] font-medium transition-all hover:border-[var(--field)] hover:text-[var(--field-deep)] disabled:opacity-50"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation Exchange Stream (Dynamic height without huge empty whitespace) */}
            <div
              ref={streamRef}
              className="min-h-[56px] max-h-[220px] space-y-3 overflow-y-auto rounded-[14px] bg-[var(--surface-inset)]/70 p-3 sm:p-3.5 text-[12.5px] border border-[var(--line-soft)]"
              aria-live="polite"
            >
              {conversation.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[9.5px] font-semibold text-[var(--ink-ghost)] mb-0.5 px-1">
                      {isUser ? (isHi ? 'आप (किसान)' : 'You') : 'AgriOptima AI'}
                    </span>
                    <div
                      className={`max-w-[85%] rounded-[12px] px-3.5 py-2 leading-relaxed ${
                        isUser
                          ? 'bg-[var(--field-deep)] text-white'
                          : 'bg-[var(--surface-solid)] border border-[var(--line-soft)] text-[var(--ink)] shadow-2xs'
                      }`}
                    >
                      <p>{msg.text}</p>
                      {msg.action && (
                        <div className="mt-1.5 flex items-start gap-1.5 pt-1.5 border-t border-[var(--line-soft)] text-[11px] font-semibold text-[var(--field-deep)]">
                          <Check size={12} className="mt-0.5 shrink-0" />
                          <span>{isHi ? 'सिफारिश:' : 'Recommended Action:'} {msg.action}</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}

              {isProcessingAI && (
                <div className="flex items-center gap-2 text-xs font-medium text-[var(--field-deep)] p-1.5">
                  <Loader2 size={13} className="animate-spin text-[var(--field)]" />
                  <span>{isHi ? 'एग्रीऑप्टिमा विचार कर रहा है...' : 'AgriOptima is thinking...'}</span>
                </div>
              )}
            </div>

            {/* Text Chat Input Bar */}
            <div className="flex items-center gap-2">
              <input
                ref={chatInputRef}
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskQuestion(chatInput)}
                placeholder={
                  isListening
                    ? isHi
                      ? 'माइक सक्रिय है... रोकने के लिए पुनः माइक दबाएं'
                      : 'Recording... Tap mic to stop & ask'
                    : isHi
                      ? 'सवाल पूछें या टाइप करें...'
                      : 'Ask a question or type here...'
                }
                className="line-input flex-1 text-xs sm:text-[13px] bg-[var(--surface-solid)] py-2"
              />

              <button
                type="button"
                onClick={() => handleAskQuestion(chatInput)}
                disabled={!chatInput.trim() || isProcessingAI}
                className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[var(--field-deep)] text-white shadow-xs transition-transform hover:scale-105 disabled:opacity-40"
                aria-label={isHi ? 'भेजें' : 'Send'}
              >
                <Send size={14} />
              </button>
            </div>
          </div>
        </Reveal>

        {/* =================================================================== */}
        {/* SECTION 3: FIELD OBSERVATIONS (LEFT) & AGRIOPTIMA TOOLS (RIGHT)      */}
        {/* =================================================================== */}
        <Reveal delay={90} ref={observationSectionRef} className="border-b border-[var(--line)] pb-12">
          <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:gap-12">

            {/* LEFT COLUMN: WHAT DID YOU SEE IN THE FIELD? */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <SectionHeader title={isHi ? 'खेत में क्या देखा?' : 'WHAT DID YOU SEE IN THE FIELD?'} />
                <p className="mt-2 text-[13px] leading-relaxed text-[var(--ink-soft)]">
                  {isHi
                    ? 'खेत के बदलाव व कार्य की स्थिति बताएं। AI सेंटीनेल तुरंत योजना का पुनः मूल्यांकन करेगा।'
                    : 'Report field observations and the agent will dynamically re-evaluate the plan.'}
                </p>
              </div>

              {/* 1. Dynamic Task-Specific Questions */}
              {taskChecklist.questions.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--field)]" />
                    <span className="t-eyebrow text-[10px] font-bold text-[var(--field-deep)] uppercase tracking-wider">
                      {isHi
                        ? `आज के कार्य से जुड़े सवाल (${progress.todayTask?.title || 'आज का कार्य'})`
                        : `TODAY'S TASK QUESTIONS (${progress.todayTask?.title || 'Day ' + progress.currentDay})`}
                    </span>
                  </div>

                  <div className="divide-y divide-[var(--line-soft)] border-y border-[var(--line-soft)] rounded-xl bg-[var(--surface-solid)]/60 px-3">
                    {taskChecklist.questions.map((item) => {
                      const checked = selectedObservations.includes(item.id);
                      return (
                        <button
                          key={item.id}
                          type="button"
                          aria-pressed={checked}
                          onClick={() => toggleObservation(item.id)}
                          className={`flex w-full items-center gap-3 py-2.5 text-left transition-colors focus-visible:bg-[var(--surface-inset)] focus-visible:outline-none ${
                            checked ? 'bg-[var(--field-tint)]/50 px-2 rounded-md' : ''
                          }`}
                        >
                          <span
                            className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] transition-colors"
                            style={{
                              background: checked ? 'var(--field)' : 'transparent',
                              boxShadow: checked ? 'none' : 'inset 0 0 0 1.5px var(--line-strong)',
                            }}
                            aria-hidden
                          >
                            {checked && <Check size={12} className="text-white" strokeWidth={3} />}
                          </span>
                          <span
                            className={`text-[12.5px] leading-snug ${
                              checked ? 'font-semibold text-[var(--ink)]' : 'text-[var(--ink-soft)]'
                            }`}
                          >
                            {isHi ? item.label.hi : item.label.en}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* 2. Universal Field Observations */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--grain)]" />
                  <span className="t-eyebrow text-[10px] font-bold text-[var(--grain-deep)] uppercase tracking-wider">
                    {isHi ? 'सामान्य खेत अवलोकन' : 'UNIVERSAL FIELD OBSERVATIONS'}
                  </span>
                </div>

                <div className="divide-y divide-[var(--line-soft)] border-y border-[var(--line-soft)] rounded-xl bg-[var(--surface-solid)]/60 px-3">
                  {UNIVERSAL_OBSERVATIONS.map((item) => {
                    const checked = selectedObservations.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        aria-pressed={checked}
                        onClick={() => toggleObservation(item.id)}
                        className={`flex w-full items-center gap-3 py-2.5 text-left transition-colors focus-visible:bg-[var(--surface-inset)] focus-visible:outline-none ${
                          checked ? 'bg-[var(--field-tint)]/50 px-2 rounded-md' : ''
                        }`}
                      >
                        <span
                          className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[5px] transition-colors"
                          style={{
                            background: checked ? 'var(--field)' : 'transparent',
                            boxShadow: checked ? 'none' : 'inset 0 0 0 1.5px var(--line-strong)',
                          }}
                          aria-hidden
                        >
                          {checked && <Check size={12} className="text-white" strokeWidth={3} />}
                        </span>
                        <span
                          className={`text-[12.5px] leading-snug ${
                            checked ? 'font-semibold text-[var(--ink)]' : 'text-[var(--ink-soft)]'
                          }`}
                        >
                          {isHi ? item.label.hi : item.label.en}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Custom Observation Input & Submit */}
              <div className="space-y-3 pt-1">
                <textarea
                  rows={2}
                  value={customReportText}
                  onChange={(e) => setCustomReportText(e.target.value)}
                  placeholder={
                    isHi
                      ? 'अन्य कोई बात जो आपने देखी... (जैसे: खेत में अधिक पानी रुका)'
                      : 'Tell the agent what happened... (e.g. Excessive standing water in north plot)'
                  }
                  className="line-input w-full resize-none text-[13px] bg-[var(--surface-solid)]"
                />

                <button
                  type="button"
                  onClick={handleSubmitObservation}
                  disabled={!hasReport}
                  className="btn btn-primary w-full shadow-xs disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {reportSubmitted ? <CheckCircle2 size={15} /> : <ArrowRight size={15} />}
                  <span>{isHi ? 'रिपोर्ट भेजें एवं पुनः जांच करें' : 'Submit Report & Re-evaluate'}</span>
                </button>

                {reportFeedback && (
                  <p
                    className="border-l-2 border-[var(--field)] pl-3 text-[12px] leading-relaxed text-[var(--field-deep)] font-medium"
                    role="status"
                  >
                    {reportFeedback}
                  </p>
                )}
              </div>
            </div>

            {/* RIGHT COLUMN: AGRIOPTIMA TOOLS */}
            <div className="lg:col-span-5 lg:border-l lg:border-[var(--line)] lg:pl-10 space-y-6">
              <div>
                <SectionHeader title={isHi ? 'एग्रीऑप्टिमा टूल्स' : 'AGRIOPTIMA TOOLS'} />
                <p className="mt-2 text-[13px] leading-relaxed text-[var(--ink-soft)]">
                  {isHi
                    ? 'बुद्धिमान कृषि उपकरण जो आपकी खेत प्रबंधन क्षमताओं को सशक्त बनाते हैं।'
                    : 'Intelligent agricultural capabilities extending your farm intelligence.'}
                </p>
              </div>

              <div className="space-y-4">
                {/* TOOL 1: CROP HEALTH SCANNER (COMING SOON) */}
                <div
                  onClick={() => setIsScannerModalOpen(true)}
                  className="group relative flex flex-col justify-between rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-solid)] p-5 transition-all hover:border-[var(--field)]/40 hover:shadow-sm cursor-pointer"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--field-tint)] text-[var(--field-deep)] border border-[var(--field-tint)] group-hover:scale-105 transition-transform">
                        <Camera size={18} />
                      </span>
                      <span className="chip chip-grain text-[9px] font-bold">
                        {isHi ? 'शीघ्र आ रहा है' : 'Coming Soon'}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-serif text-sm sm:text-base font-bold text-[var(--ink)] group-hover:text-[var(--field-deep)] transition-colors">
                        {isHi ? 'फसल स्वास्थ्य स्कैनर' : 'Crop Health Scanner'}
                      </h3>
                      <p className="mt-1 text-xs text-[var(--ink-soft)] leading-relaxed">
                        {isHi
                          ? 'स्मार्टफोन कैमरे से फसल की पत्ती स्कैन कर कीट, रोग व पोषक तत्व असंतुलन की त्वरित पहचान करें।'
                          : 'Capture a crop leaf photo to identify diseases, pests, and nutrient deficiencies with AI vision diagnosis.'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3.5 flex items-center justify-between border-t border-[var(--line-soft)] pt-2.5 text-xs font-semibold text-[var(--field-deep)]">
                    <span className="text-[10.5px] text-[var(--ink-ghost)]">
                      {isHi ? 'AI विज़न डायग्नोस्टिक्स' : 'AI Vision Diagnostics'}
                    </span>
                    <span className="inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-[11px]">
                      <span>{isHi ? 'पूर्वावलोकन देखें' : 'Preview Scanner'}</span>
                      <ChevronRight size={12} />
                    </span>
                  </div>
                </div>

                {/* TOOL 2: GOVERNMENT BENEFITS & FINANCIAL ELIGIBILITY */}
                <div
                  onClick={() => onOpenBenefits?.()}
                  className="group relative flex flex-col justify-between rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-solid)] p-5 transition-all hover:border-[var(--field)] hover:shadow-sm cursor-pointer"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--field-tint)] text-[var(--field-deep)] border border-[var(--field-tint)] group-hover:scale-105 transition-transform">
                        <Landmark size={18} />
                      </span>
                      <span className="chip chip-field text-[9px] font-bold">
                        {isHi ? 'उपलब्ध' : 'Available'}
                      </span>
                    </div>

                    <div>
                      <h3 className="font-serif text-sm sm:text-base font-bold text-[var(--ink)] group-hover:text-[var(--field-deep)] transition-colors">
                        {isHi ? 'सरकारी योजनाएं एवं वित्तीय पात्रता' : 'Government Benefits & Eligibility'}
                      </h3>
                      <p className="mt-1 text-xs text-[var(--ink-soft)] leading-relaxed">
                        {isHi
                          ? 'अपनी जोत, राज्य व फसल अनुसार पीएम-किसान, सिंचाई सब्सिडी, फसल बीमा व केसीसी रियायती ऋण पात्रता जांचें।'
                          : 'Check potential eligibility for PM-KISAN, micro-irrigation subsidies, crop insurance, and KCC concessional credit.'}
                      </p>
                    </div>
                  </div>

                  <div className="mt-3.5 flex items-center justify-between border-t border-[var(--line-soft)] pt-2.5 text-xs font-semibold text-[var(--field-deep)]">
                    <span className="text-[10.5px] text-[var(--ink-ghost)]">
                      {isHi ? '8+ योजनाएं व सब्सिडी' : '8+ Schemes & Subsidies'}
                    </span>
                    <span className="inline-flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-[11px]">
                      <span>{isHi ? 'पात्रता जांचें' : 'Check Eligibility'}</span>
                      <ChevronRight size={12} />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* =================================================================== */}
        {/* SECTION 4: RECENT OBSERVATIONS (SUPPORTING ACTIVITY HISTORY)         */}
        {/* =================================================================== */}
        <Reveal delay={110} className="border-b border-[var(--line)] pb-12">
          <div className="space-y-4">
            <SectionHeader title={isHi ? 'हाल के अवलोकन' : 'RECENT OBSERVATIONS'}>
              <button
                type="button"
                onClick={() => setIsLogModalOpen(true)}
                className="inline-flex shrink-0 items-center gap-1 text-[11px] font-semibold text-[var(--field-deep)] hover:underline"
              >
                <span>{isHi ? 'सभी अवलोकन देखें' : 'View all observations'}</span>
                <ArrowRight size={12} />
              </button>
            </SectionHeader>

            <div className="divide-y divide-[var(--line-soft)] border-y border-[var(--line-soft)] rounded-xl bg-[var(--surface-solid)]/60 px-4">
              {recentObservations.slice(0, isRecentObsExpanded ? recentObservations.length : 2).map((obs) => {
                const isDone = obs.status === 'acknowledged';
                const isAction = obs.status === 'action_recommended' || obs.status === 'plan_updated';

                return (
                  <div key={obs.id} className="py-3.5 space-y-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-start gap-2">
                        <span
                          className={`mt-0.5 text-xs ${
                            isDone ? 'text-[var(--field-deep)]' : isAction ? 'text-[var(--risk)]' : 'text-[var(--grain-deep)]'
                          }`}
                        >
                          {isDone ? '✓' : isAction ? '⚠' : '●'}
                        </span>
                        <h4 className="text-[12.5px] font-medium text-[var(--ink)] leading-snug">
                          {localizeObservationTitle(obs.title, isHi)}
                        </h4>
                      </div>

                      <span
                        className={`chip text-[9px] font-medium shrink-0 ${
                          isDone ? 'chip-field' : isAction ? 'chip-risk' : 'chip-grain'
                        }`}
                      >
                        {obs.status === 'acknowledged'
                          ? (isHi ? 'स्वीकृत' : 'Acknowledged')
                          : obs.status === 'action_recommended'
                          ? (isHi ? 'कार्यवाही अनुशंसित' : 'Action Recommended')
                          : (isHi ? 'समीक्षाधीन' : 'Under Review')}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[var(--ink-ghost)] font-data pl-5">
                      <span>{localizeTimestamp(obs.timestamp, isHi)}</span>
                      <span>{isHi ? `दिन ${obs.day} · सप्ताह ${obs.week}` : `Day ${obs.day} · Week ${obs.week}`}</span>
                    </div>
                  </div>
                );
              })}

              {recentObservations.length > 2 && (
                <div className="py-2.5 text-center">
                  <button
                    type="button"
                    onClick={() => setIsRecentObsExpanded(!isRecentObsExpanded)}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface-solid)] px-3.5 py-1 text-xs font-semibold text-[var(--field-deep)] hover:bg-[var(--surface-inset)] transition-colors cursor-pointer shadow-2xs"
                  >
                    <span>
                      {isRecentObsExpanded
                        ? (isHi ? 'कम अवलोकन दिखाएं' : 'Show fewer observations')
                        : (isHi ? `+${recentObservations.length - 2} और अवलोकन देखें` : `+${recentObservations.length - 2} more observations`)}
                    </span>
                    {isRecentObsExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                </div>
              )}
            </div>
          </div>
        </Reveal>



        {/* =================================================================== */}
        {/* SECTION 6: WHAT THE SENTINEL WATCHES (BOTTOM CONNECTED STRIP)       */}
        {/* =================================================================== */}
        <Reveal delay={120} className="space-y-4">
          <SectionHeader title={isHi ? 'सेंटीनेल क्या निगरानी करता है' : 'WHAT THE SENTINEL WATCHES'}>
            <button
              type="button"
              onClick={() => setIsLogModalOpen(true)}
              className="inline-flex shrink-0 items-center gap-1.5 text-xs font-semibold text-[var(--ink-soft)] transition-colors hover:text-[var(--field-deep)]"
            >
              <span>{isHi ? 'सभी निगरानी लॉग्स देखें' : 'View all sentinel logs'}</span>
              <ArrowRight size={12} />
            </button>
          </SectionHeader>

          <p className="text-xs text-[var(--ink-soft)]">
            {isHi
              ? 'सेंटीनेल लगातार बाहरी व जमीनी स्थितियों का विश्लेषण करता है जो आपकी कृषि योजना को प्रभावित कर सकती हैं।'
              : 'Sentinel continuously analyzes external and field conditions that may affect your farm plan.'}
          </p>

          {/* Connected Single Monitoring Strip with subtle vertical dividers */}
          <div className="rounded-[16px] border border-[var(--line)] bg-[var(--surface-solid)] divide-y sm:divide-y-0 sm:divide-x divide-[var(--line-soft)] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 shadow-2xs">
            {streams.map((s) => (
              <div
                key={s.id}
                className="p-4 space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: s.tone }}>
                    <s.Icon size={14} />
                    <span>{s.name}</span>
                  </span>
                  {s.live && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-[var(--field)]" />
                      <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--field)]" />
                    </span>
                  )}
                </div>

                <p className="font-data text-xs font-bold text-[var(--ink)] truncate">
                  {s.reading}
                </p>

                <p className="t-eyebrow text-[9px] text-[var(--ink-ghost)]">
                  {s.cadence}
                </p>
              </div>
            ))}
          </div>
        </Reveal>
      </main>

      {/* Activity Logs Modal */}
      <AutonomousLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        logs={logs}
        advisory={advisory}
        onRunCheck={() => onRunCheck(planContext)}
        isChecking={isChecking}
      />

      {/* Crop Health Scanner Preview Modal */}
      <CropHealthScannerModal
        isOpen={isScannerModalOpen}
        onClose={() => setIsScannerModalOpen(false)}
        primaryCrop={decision.primary_crop_recommendation?.crop_name || 'Crop'}
      />


      {/* ===================================================================== */}
      {/* 3. FOOTER                                                             */}
      {/* ===================================================================== */}
      <footer className="border-t border-[var(--line)] px-4 py-3 text-xs text-[var(--ink-soft)] sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 text-[11px]">
          <span>
            {isHi
              ? '24/7 स्वायत्त कृषि निगरानी एवं सुरक्षा प्रणाली'
              : '24/7 Autonomous Agricultural Telemetry & Risk Sentinel'}
          </span>
          <span>© 2026 AgriOptima AI</span>
        </div>
      </footer>
    </div>
  );
}
