import React, { useState, useRef, useEffect } from 'react';
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
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { JourneyNav } from '@/components/JourneyNav';
import { getCropDisplayName } from '@/i18n/cropNames';
import { getStateDisplayName, getDistrictDisplayName } from '@/i18n/geoNames';
import { formatRainfall } from '@/i18n/formatters';
import {
  askFarmerVoiceAssistant,
  speakVoiceAgentAudio,
  type VoiceAgentResponse,
} from '@/services/voiceAgentService';
import { AutonomousLogModal } from '@/components/AutonomousLogModal';
import { FarmDigitalTwin } from '@/components/FarmDigitalTwin';
import { Reveal } from '@/components/ui/motion';
import { ReadingRow } from '@/components/ui/ReadingRow';
import type { FarmDecisionResponse } from '@/types/farm';
import type { AutonomousCycleLog, ProactiveAdvisory } from '@/types/autonomous';

/**
 * A section label on the watch sheet: caps, then a rule running to the edge.
 * The same device the plan sheet uses, so pages 4 and 5 speak in one hand.
 */
function WatchHead({ title, children }: { title: string; children?: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-5 gap-y-3">
      <div className="flex min-w-0 flex-1 items-baseline gap-3">
        <h2 className="t-eyebrow shrink-0 text-[0.66rem] text-[var(--ink-soft)]">{title}</h2>
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

interface AutonomousSentinelScreenProps {
  userName?: string;
  decision: FarmDecisionResponse;
  logs: AutonomousCycleLog[];
  advisory: ProactiveAdvisory | null;
  isChecking: boolean;
  onRunCheck: () => void;
  onBackToPlan: () => void;
  onLogout: () => void;
  onEditDetails?: () => void;
  onChangeLocation?: () => void;
}

export function AutonomousSentinelScreen({
  userName,
  decision,
  logs,
  advisory,
  isChecking,
  onRunCheck,
  onBackToPlan,
  onLogout,
  onEditDetails,
  onChangeLocation,
}: AutonomousSentinelScreenProps) {
  const { language } = useLanguage();
  const isHi = language === 'hi';

  const [isLogModalOpen, setIsLogModalOpen] = useState<boolean>(false);

  // Farmer Ground Observation State
  const [selectedObservations, setSelectedObservations] = useState<string[]>([]);
  const [customReportText, setCustomReportText] = useState<string>('');
  const [reportSubmitted, setReportSubmitted] = useState<boolean>(false);
  const [reportFeedback, setReportFeedback] = useState<string | null>(null);

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

  const isRecordingRef = useRef<boolean>(false);
  const accumulatedSpeechRef = useRef<string>('');
  const recognitionRef = useRef<any>(null);
  const audioSpeakerRef = useRef<{ stop: () => void } | null>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const streamRef = useRef<HTMLDivElement>(null);

  // Auto-scroll input to the latest words as the user speaks
  useEffect(() => {
    if (chatInputRef.current) {
      chatInputRef.current.scrollLeft = chatInputRef.current.scrollWidth;
    }
  }, [chatInput]);

  // Keep the newest message in view. Scrolls the stream container only — never
  // the page — so landing on this screen still starts at the top.
  useEffect(() => {
    const el = streamRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [conversation, isProcessingAI]);

  const rain7d = decision?.weather?.forecast_rain_7d_total_mm ?? 0;
  const soilMoisture = decision?.weather?.root_zone_soil_moisture_m3m3 ?? 0.35;
  const allocatedCrops = decision?.allocated_crops || [];
  const primaryCropName = allocatedCrops[0]?.crop_name || 'Tomato';

  const districtLabel = getDistrictDisplayName(decision.location?.district_name || 'Bhopal', language);
  const stateLabel = getStateDisplayName(decision.location?.state_name || 'Madhya Pradesh', language);
  const latestLog = logs[0] || null;
  const watchedCrops = (allocatedCrops.length ? allocatedCrops.map((c) => c.crop_name) : [primaryCropName])
    .map((name) => getCropDisplayName(name, language))
    .join(' · ');

  // A calm plan needs no intervention; anything else is an action recommendation.
  const isCalm = !advisory || advisory.severity === 'info' || advisory.severity === 'success';

  // Toggle observation checkbox
  const toggleObservation = (id: string) => {
    setSelectedObservations((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // Submit farmer observation to trigger re-evaluation
  const handleSubmitObservation = () => {
    if (selectedObservations.length === 0 && !customReportText.trim()) return;

    setReportSubmitted(true);
    onRunCheck();

    const note = isHi
      ? 'आपकी रिपोर्ट दर्ज कर ली गई है। AI सेंटीनेल ने खेत की स्थिति का पुनः विश्लेषण किया है।'
      : 'Your report has been received. Sentinel has re-evaluated your farm condition.';

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
      const resp: VoiceAgentResponse = await askFarmerVoiceAssistant(q, decision, language);
      const answerText = isHi ? resp.display_text || resp.spoken_text : resp.display_text || resp.spoken_text;

      setConversation((prev) => [
        ...prev,
        {
          role: 'agent',
          text: answerText,
          action: resp.recommended_action,
        },
      ]);

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

  // Stop the agent's spoken reply without cancelling the conversation
  const handleStopAudio = () => {
    try {
      audioSpeakerRef.current?.stop();
    } catch {}
    setIsSpeaking(false);
  };

  // Explicit Mic Toggle Handler (Starts strictly on click, closes strictly on click)
  const handleToggleVoice = () => {
    // 1. If currently listening, clicking the mic explicitly CLOSES and SUBMITS
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

    // 2. If not listening, clicking the mic explicitly STARTS continuous listening
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
        // Continuous session: If user has NOT explicitly toggled mic off, restart listening automatically
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
          // Keep active during pauses
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

  const quickPrompts = [
    isHi ? 'क्या आज सिंचाई करनी चाहिए?' : 'Should I irrigate today?',
    isHi ? 'बीज खरीदने का सही समय क्या है?' : 'When to buy seeds?',
    isHi ? 'कौन सी खाद कब डालें?' : 'When to apply fertilizer?',
    isHi ? 'मौसम का पूर्वानुमान कैसा है?' : 'What is the 7-day weather?',
  ];

  /* ------------------------------------------------------------------ */
  /* The five streams the sentinel watches — one row per data source.    */
  /* Merges the old capability pills + surveillance checklist so each    */
  /* source is stated once, with its live reading and its cadence.       */
  /* ------------------------------------------------------------------ */
  const streams = [
    {
      id: 'weather',
      Icon: CloudRain,
      tone: 'var(--sky)',
      name: isHi ? '7-दिन मौसम' : 'Weather (7-day)',
      reading: `${formatRainfall(rain7d, language)} · ${isHi ? 'मिट्टी नमी' : 'soil'} ${(soilMoisture * 100).toFixed(0)}%`,
      live: true,
      cadence: isHi ? 'प्रत्येक 6 घंटे' : 'Every 6 hrs',
    },
    {
      id: 'mandi',
      Icon: TrendingUp,
      tone: 'var(--grain-deep)',
      name: isHi ? 'मंडी भाव' : 'Mandi prices',
      reading: isHi ? 'देशभर की मंडियां' : 'All-India feed',
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
      reading: isHi ? 'लगातार निगरानी' : 'Live monitored',
      live: true,
      cadence: isHi ? 'रियल-टाइम' : 'Real-time',
    },
  ];

  const observations = [
    { id: 'rain', label: isHi ? 'अप्रत्याशित भारी बारिश हुई' : 'Unexpected heavy rainfall' },
    { id: 'sowing', label: isHi ? 'बुवाई तय समय से पहले/देर से हुई' : 'Sown earlier or later than planned' },
    { id: 'leaf_yellow', label: isHi ? 'फसल की पत्तियों का रंग पीला पड़ा' : 'Crop color changed / leaves yellowing' },
    { id: 'pest', label: isHi ? 'खेत में कीट या बीमारी के लक्षण दिखे' : 'Pest or disease symptoms noticed' },
    { id: 'water', label: isHi ? 'पानी या सिंचाई में समस्या आई' : 'Water / irrigation problem occurred' },
  ];

  const hasReport = selectedObservations.length > 0 || customReportText.trim().length > 0;

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-between text-[var(--ink)] selection:bg-[var(--grain-tint)] selection:text-[var(--grain-deep)]">
      {/* ===================================================================== */}
      {/* 1. FLOATING JOURNEY NAV — same chrome layer as every other stage      */}
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
              onClick={onRunCheck}
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
      {/* 2. MAIN WORKSPACE                                                     */}
      {/* ===================================================================== */}
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 pb-24 pt-24 sm:px-8 sm:pt-28 md:pb-8">
        {/* ------------------------------------------------------------- */}
        {/* WATCH BAND — cinematic sentinel hero, de-boxed & spatial       */}
        {/* ------------------------------------------------------------- */}
        <Reveal className="border-b border-[var(--line)] pb-9">
          <div className="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-10">
            {/* THE FARM, UNDER WATCH — the AI lives inside the land, not beside
                it: aiState is driven by what is actually happening right now. */}
            <div className="lg:col-span-7">
              <div className="t-eyebrow flex items-center gap-2" style={{ color: 'var(--field)' }}>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-[var(--field)]" />
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--field)]" />
                </span>
                {isHi ? 'निगरानी सक्रिय' : 'Watching · live'}
              </div>

              <h1 className="t-h1 mt-3 text-[1.9rem] leading-[1.1] sm:text-[2.3rem]">
                {isHi ? 'सेंटीनेल आपके खेत पर नज़र रखे हुए है' : 'Sentinel is watching your farm'}
              </h1>

              <FarmDigitalTwin
                decision={decision}
                height={320}
                interactive
                showWeather
                scanning={isChecking}
                aiState={isChecking ? 'analyzing' : isListening ? 'listening' : 'complete'}
                showDetailCard={false}
                className="mt-6 w-full"
              />

              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="h-1.5 w-1.5 rounded-full bg-[var(--field)]" aria-hidden />
                <span className="t-eyebrow text-[0.6rem] text-[var(--ink-ghost)]">
                  {districtLabel}, {stateLabel} · {watchedCrops}
                </span>
                <span className="font-data text-[10px] text-[var(--ink-faint)]">
                  {isHi ? 'अंतिम जांच' : 'Last check'} ·{' '}
                  {latestLog ? latestLog.timestamp : isHi ? 'अभी-अभी' : 'just now'}
                </span>
              </div>
            </div>

            {/* THE VERDICT — what the watch concluded, stated as a reading */}
            <div className="lg:col-span-5 lg:border-l lg:border-[var(--line)] lg:pl-10">
              <WatchHead title={isHi ? 'एजेंट का निर्णय' : 'Agent decision'}>
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
              </WatchHead>

              <h2 className="t-h3 mt-5 text-[1.15rem] leading-snug text-[var(--ink)] sm:text-[1.3rem]">
                {advisory?.headline ||
                  (isHi
                    ? 'आपकी वर्तमान खेत योजना पूरी तरह अनुकूल है।'
                    : 'Your current farm plan matches field conditions.')}
              </h2>

              <div className="mt-6 space-y-3">
                <ReadingRow
                  label={isHi ? 'मिट्टी नमी' : 'Soil moisture'}
                  value={`${(soilMoisture * 100).toFixed(0)}%`}
                />
                <ReadingRow
                  label={isHi ? '7-दिन वर्षा' : 'Rain (7-day)'}
                  value={formatRainfall(rain7d, language)}
                />
                <ReadingRow
                  label={isHi ? 'निगरानी में फसलें' : 'Crops watched'}
                  value={watchedCrops}
                />
              </div>

              <dl className="mt-7 space-y-5 border-t border-[var(--line)] pt-5">
                <div>
                  <dt className="t-eyebrow mb-1.5">{isHi ? 'क्या स्थिति है?' : 'What changed'}</dt>
                  <dd className="text-[13px] leading-relaxed text-[var(--ink-soft)]">
                    {isHi
                      ? `7-दिवसीय वर्षा ${rain7d.toFixed(1)} mm और मिट्टी नमी ${(soilMoisture * 100).toFixed(0)}% है।`
                      : `Rainfall forecast is ${rain7d.toFixed(1)} mm and soil moisture is at ${(soilMoisture * 100).toFixed(0)}%.`}
                  </dd>
                </div>
                <div className="border-l-2 border-[var(--field)] pl-4">
                  <dt className="t-eyebrow mb-1.5">{isHi ? 'सिफारिश' : 'What you should do'}</dt>
                  <dd className="text-[13px] leading-relaxed text-[var(--ink-soft)]">
                    {advisory?.recommended_action ||
                      (isHi
                        ? 'निर्धारित 7-दिवसीय कार्ययोजना अनुसार जुताई व बीज तैयारी जारी रखें।'
                        : 'Proceed with the scheduled 7-day action plan for seedbed preparation.')}
                  </dd>
                </div>
              </dl>
            </div>
          </div>
        </Reveal>

        {/* ------------------------------------------------------------- */}
        {/* TELEMETRY — five streams as premium cards, not a flat grid     */}
        {/* ------------------------------------------------------------- */}
        <Reveal delay={60}>
          <WatchHead title={isHi ? 'सेंटीनेल क्या देख रहा है' : 'What the sentinel watches'}>
            <button
              type="button"
              onClick={() => setIsLogModalOpen(true)}
              className="inline-flex shrink-0 items-center gap-1.5 border-b border-[var(--line-strong)] pb-0.5 text-xs font-semibold text-[var(--ink-soft)] transition-colors hover:border-[var(--field)] hover:text-[var(--field-deep)]"
            >
              {isHi ? 'सभी निगरानी लॉग्स देखें' : 'View all sentinel logs'}
              <ArrowRight size={12} />
            </button>
          </WatchHead>

          {/* one ruled row per source: what it is, what it reads, how often.
              A ledger, not five cards — the sources are a list of facts. */}
          <div className="mt-5">
            {streams.map((s, i) => (
              <div
                key={s.id}
                className="animate-stream-slide flex items-center gap-4 border-b border-[var(--line-soft)] py-3.5 sm:gap-6"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span
                  className="flex w-[9.5rem] shrink-0 items-center gap-2 text-[13px] font-medium sm:w-[12rem]"
                  style={{ color: s.tone }}
                >
                  <s.Icon size={14} className="shrink-0" strokeWidth={1.75} />
                  <span className="truncate">{s.name}</span>
                </span>

                <span className="font-data min-w-0 flex-1 truncate text-[13px] text-[var(--ink)]">
                  {s.reading}
                </span>

                <span className="t-eyebrow flex shrink-0 items-center gap-1.5 text-[0.55rem] text-[var(--ink-faint)]">
                  {s.live && (
                    <span
                      className="animate-breathe h-1.5 w-1.5 rounded-full"
                      style={{ background: s.tone }}
                      aria-hidden
                    />
                  )}
                  {s.cadence}
                </span>
              </div>
            ))}
          </div>
        </Reveal>

        {/* ------------------------------------------------------------- */}
        {/* GROUND TRUTH (left) + CONVERSATION (right)                     */}
        {/* ------------------------------------------------------------- */}
        <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
          {/* ---------- FARMER OBSERVATIONS ---------- */}
          <Reveal className="lg:col-span-5" delay={90}>
            <WatchHead title={isHi ? 'खेत में क्या देखा?' : 'What did you see in the field?'} />
            <p className="mt-4 text-[13px] leading-relaxed text-[var(--ink-soft)]">
              {isHi
                ? 'खेत में कोई बदलाव दिखा हो तो एजेंट को बताएं'
                : 'Report field observations and the agent will re-evaluate the plan.'}
            </p>

            {/* each observation is a real toggle on a ruled line — no boxes,
                and the tick mark is the only fill, so the list stays quiet */}
            <div className="mt-5">
              {observations.map((item) => {
                const checked = selectedObservations.includes(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    aria-pressed={checked}
                    onClick={() => toggleObservation(item.id)}
                    className={`flex w-full items-center gap-3 border-b py-3 text-left transition-colors focus-visible:bg-[var(--surface-inset)] focus-visible:outline-none ${
                      checked ? 'border-[var(--field)]' : 'border-[var(--line-soft)]'
                    }`}
                  >
                    <span
                      className="grid h-[18px] w-[18px] shrink-0 place-items-center rounded-[6px] transition-colors"
                      style={{
                        background: checked ? 'var(--field)' : 'transparent',
                        boxShadow: checked ? 'none' : 'inset 0 0 0 1.5px var(--line-strong)',
                      }}
                      aria-hidden
                    >
                      {checked && <Check size={12} className="text-[var(--paper)]" strokeWidth={3} />}
                    </span>
                    <span
                      className={`text-[13px] ${
                        checked ? 'font-medium text-[var(--ink)]' : 'text-[var(--ink-soft)]'
                      }`}
                    >
                      {item.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <textarea
              rows={3}
              value={customReportText}
              onChange={(e) => setCustomReportText(e.target.value)}
              placeholder={
                isHi
                  ? 'अन्य कोई बात जो आपने देखी... (जैसे: टमाटर में कीड़े दिख रहे हैं)'
                  : 'Tell the agent what happened... (e.g. Tomato leaves turning yellow)'
              }
              className="line-input mt-5 w-full resize-none text-[13px]"
            />

            <button
              type="button"
              onClick={handleSubmitObservation}
              disabled={!hasReport}
              className="btn btn-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-40"
            >
              {reportSubmitted ? <CheckCircle2 size={14} /> : <ArrowRight size={14} />}
              <span>{isHi ? 'रिपोर्ट भेजें एवं पुनः जांच करें' : 'Submit report & re-evaluate'}</span>
            </button>

            {reportFeedback && (
              <p
                className="mt-4 border-l-2 border-[var(--field)] pl-3 text-[12px] leading-relaxed text-[var(--field-deep)]"
                role="status"
              >
                {reportFeedback}
              </p>
            )}
          </Reveal>

          {/* ---------- TALK TO AGRIOPTIMA ---------- */}
          <Reveal className="flex flex-col lg:col-span-7" delay={120}>
            <WatchHead title={isHi ? 'एग्रीऑप्टिमा से बात करें' : 'Talk to AgriOptima'}>
              <div className="flex shrink-0 items-center gap-3">
                {isSpeaking && (
                  <button
                    type="button"
                    onClick={handleStopAudio}
                    className="inline-flex items-center gap-1.5 text-[11px] font-semibold text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
                  >
                    <VolumeX size={12} />
                    {isHi ? 'आवाज़ बंद करें' : 'Stop audio'}
                  </button>
                )}
                <span className="t-eyebrow text-[0.55rem] text-[var(--ink-ghost)]">
                  {isHi ? 'सरवम · जेमिनी' : 'Sarvam voice · Gemini'}
                </span>
              </div>
            </WatchHead>

            {/* The exchange. Farmer and agent are told apart by the weight and
                colour of the rule they hang off, not by filled bubbles — the
                white world has no chat app in it. */}
            <div
              ref={streamRef}
              className="mt-5 h-[300px] flex-1 space-y-4 overflow-y-auto pr-1 text-[13px] sm:h-[340px]"
              aria-live="polite"
            >
              {conversation.map((msg, idx) => {
                const isUser = msg.role === 'user';
                return (
                  <div
                    key={idx}
                    className={`border-l pl-4 ${
                      isUser
                        ? 'border-[var(--line-strong)] sm:ml-8'
                        : 'border-l-2 border-[var(--field)]'
                    }`}
                  >
                    <p className="t-eyebrow mb-1 text-[0.55rem] text-[var(--ink-ghost)]">
                      {isUser ? (isHi ? 'आप' : 'You') : 'AgriOptima'}
                    </p>
                    <p
                      className={`leading-relaxed ${
                        isUser ? 'text-[var(--ink-soft)]' : 'text-[var(--ink)]'
                      }`}
                    >
                      {msg.text}
                    </p>
                    {msg.action && (
                      <p className="mt-2 flex items-start gap-1.5 text-[11px] font-semibold text-[var(--field-deep)]">
                        <Check size={12} className="mt-[2px] shrink-0" />
                        <span>
                          {isHi ? 'सुझाव:' : 'Action:'} {msg.action}
                        </span>
                      </p>
                    )}
                  </div>
                );
              })}

              {isProcessingAI && (
                <div className="flex items-center gap-2 text-xs text-[var(--ink-soft)]">
                  <Loader2 size={13} className="animate-spin text-[var(--sky)]" />
                  <span>{isHi ? 'एग्रीऑप्टिमा विचार कर रहा है...' : 'AgriOptima is thinking...'}</span>
                </div>
              )}
            </div>

            {/* Things worth asking, in the same pill language as the planning flow. */}
            <div className="mt-4 flex flex-wrap gap-2">
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAskQuestion(prompt)}
                  disabled={isProcessingAI}
                  className="choice max-w-full truncate px-3 py-1.5 text-[11px] disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* What the mic is hearing right now, on a rule rather than in a box. */}
            {isListening && chatInput && (
              <p className="mt-4 flex items-center gap-2 border-l-2 border-[var(--risk)] pl-3 text-xs">
                <span className="flex h-1.5 w-1.5 shrink-0 animate-ping rounded-full bg-[var(--risk)]" />
                <span className="t-eyebrow shrink-0 text-[0.55rem] text-[var(--grain-deep)]">
                  {isHi ? 'वर्तमान शब्द' : 'Hearing'}
                </span>
                <span className="truncate font-semibold text-[var(--ink)]">{chatInput}</span>
              </p>
            )}

            {/* Input Bar & Mic Button */}
            <div className="mt-4 flex items-center gap-3 border-t border-[var(--line)] pt-4">
              <button
                type="button"
                onClick={handleToggleVoice}
                aria-pressed={isListening}
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-full transition-all ${isListening ? 'animate-breathe' : ''}`}
                style={
                  isListening
                    ? { background: 'var(--risk)', color: '#fff' }
                    : { background: 'var(--grain-tint)', color: 'var(--grain-deep)' }
                }
                title={
                  isListening
                    ? isHi
                      ? 'रोकने और पूछने के लिए माइक दबाएं'
                      : 'Tap mic to stop & ask'
                    : isHi
                      ? 'बोलने के लिए माइक दबाएं'
                      : 'Tap mic to speak'
                }
                aria-label={
                  isListening
                    ? isHi
                      ? 'रोकने और पूछने के लिए माइक दबाएं'
                      : 'Tap mic to stop & ask'
                    : isHi
                      ? 'बोलने के लिए माइक दबाएं'
                      : 'Tap mic to speak'
                }
              >
                {isListening ? <MicOff size={18} /> : <Mic size={18} />}
              </button>

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
                      ? 'सवाल पूछें या बोलें...'
                      : 'Ask a question or tap mic...'
                }
                className="line-input flex-1 text-[13px]"
              />

              <button
                type="button"
                onClick={() => handleAskQuestion(chatInput)}
                disabled={!chatInput.trim() || isProcessingAI}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--field-deep)] text-white transition-colors hover:bg-[var(--field)] disabled:opacity-40"
                aria-label={isHi ? 'भेजें' : 'Send'}
              >
                <Send size={15} />
              </button>
            </div>
          </Reveal>
        </div>
      </main>

      {/* Activity Logs Modal */}
      <AutonomousLogModal
        isOpen={isLogModalOpen}
        onClose={() => setIsLogModalOpen(false)}
        logs={logs}
        advisory={advisory}
        onRunCheck={onRunCheck}
        isChecking={isChecking}
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
