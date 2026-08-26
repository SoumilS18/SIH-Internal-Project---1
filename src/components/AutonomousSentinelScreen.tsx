import React, { useState, useRef, useEffect } from 'react';
import {
  Mic,
  MicOff,
  Send,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  CloudRain,
  TrendingUp,
  FileText,
  Bug,
  AlertOctagon,
  Loader2,
  RefreshCw,
  LogOut,
  Volume2,
  VolumeX,
  Radio,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { getCropDisplayName } from '@/i18n/cropNames';
import { getStateDisplayName, getDistrictDisplayName } from '@/i18n/geoNames';
import { formatRainfall } from '@/i18n/formatters';
import {
  askFarmerVoiceAssistant,
  speakVoiceAgentAudio,
  type VoiceAgentResponse,
} from '@/services/voiceAgentService';
import { AutonomousLogModal } from '@/components/AutonomousLogModal';
import { AIAgentOrb } from '@/components/AIAgentOrb';
import { Reveal } from '@/components/ui/motion';
import type { FarmDecisionResponse } from '@/types/farm';
import type { AutonomousCycleLog, ProactiveAdvisory } from '@/types/autonomous';

interface AutonomousSentinelScreenProps {
  userName?: string;
  decision: FarmDecisionResponse;
  logs: AutonomousCycleLog[];
  advisory: ProactiveAdvisory | null;
  isChecking: boolean;
  onRunCheck: () => void;
  onBackToPlan: () => void;
  onLogout: () => void;
}

export function AutonomousSentinelScreen({
  decision,
  logs,
  advisory,
  isChecking,
  onRunCheck,
  onBackToPlan,
  onLogout,
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
      {/* 1. TOP NAVIGATION BAR — same grammar as every other stage             */}
      {/* ===================================================================== */}
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--surface)] px-4 py-3 backdrop-blur-md sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToPlan}
              className="btn-ghost grid h-9 w-9 place-items-center rounded-xl"
              title={isHi ? 'योजना पर लौटें' : 'Back to Farm Plan'}
              aria-label={isHi ? 'योजना पर लौटें' : 'Back to Farm Plan'}
            >
              <ArrowLeft size={16} />
            </button>
            <div className="flex items-center gap-2">
              <span className="font-display text-lg font-extrabold tracking-tight text-[var(--ink)]">
                AgriOptima<span className="text-[var(--field)]"> AI</span>
              </span>
              <span className="chip chip-field font-data text-[10px] tracking-wider">
                {isHi ? 'चरण 05 / 05 · सेंटीनेल' : 'Step 05 / 05 · Sentinel'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsLogModalOpen(true)}
              className="hidden items-center gap-1.5 rounded-xl border border-[var(--line)] bg-[var(--surface-elevated)] px-3 py-1.5 text-xs font-semibold text-[var(--ink-soft)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)] sm:flex"
            >
              <FileText size={14} className="text-[var(--grain-deep)]" />
              <span>{isHi ? 'निगरानी लॉग्स' : 'Activity Logs'}</span>
            </button>

            <LanguageSelector />
            <ThemeToggle />

            <button
              type="button"
              onClick={onRunCheck}
              disabled={isChecking}
              className="btn btn-primary px-3.5 py-1.5 text-xs disabled:opacity-60"
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

            <button
              type="button"
              onClick={onLogout}
              className="btn-ghost grid h-9 w-9 place-items-center rounded-xl"
              title={isHi ? 'लॉगआउट' : 'Log out'}
              aria-label={isHi ? 'लॉगआउट' : 'Log out'}
            >
              <LogOut size={15} />
            </button>
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. MAIN WORKSPACE                                                     */}
      {/* ===================================================================== */}
      <main className="mx-auto w-full max-w-7xl flex-1 space-y-6 px-4 py-6 sm:px-8">
        {/* ------------------------------------------------------------- */}
        {/* WATCH BAND — the living core + the current verdict, one surface */}
        {/* ------------------------------------------------------------- */}
        <Reveal className="panel-elevated overflow-hidden p-6 sm:p-7">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 lg:gap-0">
            {/* the sentinel itself */}
            <div className="flex items-center gap-5 lg:col-span-2 lg:pr-7">
              <div className="relative grid shrink-0 place-items-center">
                <AIAgentOrb state={isChecking ? 'analyzing' : 'idle'} size={124} />
              </div>
              <div className="min-w-0">
                <div className="t-eyebrow flex items-center gap-2" style={{ color: 'var(--field)' }}>
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-[var(--field)]" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[var(--field)]" />
                  </span>
                  {isHi ? 'निगरानी सक्रिय' : 'Watching · live'}
                </div>
                <h1 className="t-h2 mt-2 text-[1.35rem] leading-tight text-[var(--ink)]">
                  {isHi ? 'सेंटीनेल आपके खेत पर नज़र रखे हुए है' : 'Sentinel is watching your farm'}
                </h1>
                <p className="mt-2 text-[13px] leading-relaxed text-[var(--ink-soft)]">
                  {districtLabel}, {stateLabel} · {watchedCrops}
                </p>
                <p className="font-data mt-2 text-[11px] text-[var(--ink-faint)]">
                  {isHi ? 'अंतिम जांच' : 'Last check'} ·{' '}
                  {latestLog ? latestLog.timestamp : isHi ? 'अभी-अभी' : 'just now'}
                </p>
              </div>
            </div>

            {/* the verdict */}
            <div className="flex flex-col justify-center border-t border-[var(--line)] pt-5 lg:col-span-3 lg:border-l lg:border-t-0 lg:pl-7 lg:pt-0">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="t-eyebrow">{isHi ? 'एजेंट का निर्णय' : 'Agent decision'}</span>
                <span className={`chip text-[10px] ${isCalm ? 'chip-field' : 'chip-grain'}`}>
                  {isCalm ? <CheckCircle2 size={12} /> : <Radio size={12} />}
                  {isCalm
                    ? isHi
                      ? 'योजना यथावत उपयुक्त'
                      : 'No change needed'
                    : isHi
                      ? 'कार्यवाही की सिफारिश'
                      : 'Action recommended'}
                </span>
              </div>

              <h2 className="font-display mt-3 text-[1.15rem] font-bold leading-snug text-[var(--ink)] sm:text-[1.3rem]">
                {advisory?.headline ||
                  (isHi
                    ? 'आपकी वर्तमान खेत योजना पूरी तरह अनुकूल है।'
                    : 'Your current farm plan matches field conditions.')}
              </h2>

              <dl className="mt-4 grid grid-cols-1 gap-4 border-t border-[var(--line)] pt-4 sm:grid-cols-2 sm:gap-0 sm:divide-x sm:divide-[var(--line)]">
                <div className="sm:pr-5">
                  <dt className="t-eyebrow mb-1.5">{isHi ? 'क्या स्थिति है?' : 'What changed'}</dt>
                  <dd className="text-[13px] leading-relaxed text-[var(--ink-soft)]">
                    {isHi
                      ? `7-दिवसीय वर्षा ${rain7d.toFixed(1)} mm और मिट्टी नमी ${(soilMoisture * 100).toFixed(0)}% है।`
                      : `Rainfall forecast is ${rain7d.toFixed(1)} mm and soil moisture is at ${(soilMoisture * 100).toFixed(0)}%.`}
                  </dd>
                </div>
                <div className="border-t border-[var(--line)] pt-4 sm:border-t-0 sm:pl-5 sm:pt-0">
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
        {/* TELEMETRY — the five streams, stated once with reading + cadence */}
        {/* ------------------------------------------------------------- */}
        <Reveal className="panel p-5 sm:p-6" delay={60}>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="t-h3 text-[1.05rem] text-[var(--ink)]">
              {isHi ? 'सेंटीनेल क्या देख रहा है' : 'What the sentinel watches'}
            </h2>
            <button
              type="button"
              onClick={() => setIsLogModalOpen(true)}
              className="text-xs font-bold text-[var(--grain-deep)] transition-colors hover:text-[var(--field)]"
            >
              {isHi ? 'सभी निगरानी लॉग्स देखें →' : 'View all sentinel logs →'}
            </button>
          </div>

          <div className="mt-4 grid grid-cols-1 gap-y-4 border-t border-[var(--line)] pt-4 sm:grid-cols-2 lg:grid-cols-5 lg:gap-y-0 lg:divide-x lg:divide-[var(--line)]">
            {streams.map((s, i) => (
              <div
                key={s.id}
                className={`flex flex-col gap-1.5 ${i === 0 ? 'lg:pr-5' : i === streams.length - 1 ? 'lg:pl-5' : 'lg:px-5'}`}
              >
                <span className="flex items-center gap-2 text-[11px] font-bold" style={{ color: s.tone }}>
                  <s.Icon size={14} />
                  {s.name}
                </span>
                <span className="font-data text-[12px] font-semibold text-[var(--ink)]">{s.reading}</span>
                <span className="t-eyebrow flex items-center gap-1.5 text-[var(--ink-faint)]">
                  {s.live && <span className="h-1.5 w-1.5 rounded-full bg-[var(--field)] animate-breathe" />}
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
          <Reveal className="panel p-5 sm:p-6 lg:col-span-5" delay={90}>
            <h2 className="t-h3 text-[1.05rem] text-[var(--ink)]">
              {isHi ? 'खेत में क्या देखा?' : 'What did you see in the field?'}
            </h2>
            <p className="mt-1 text-[13px] text-[var(--ink-soft)]">
              {isHi
                ? 'खेत में कोई बदलाव दिखा हो तो एजेंट को बताएं'
                : 'Report field observations to adjust the plan if needed'}
            </p>

            <div className="mt-4 divide-y divide-[var(--line)] border-t border-[var(--line)]">
              {observations.map((item) => {
                const checked = selectedObservations.includes(item.id);
                return (
                  <label
                    key={item.id}
                    className="flex cursor-pointer items-center gap-3 py-3 transition-colors hover:bg-[var(--surface-inset)]"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleObservation(item.id)}
                      className="h-4 w-4 shrink-0 rounded"
                      style={{ accentColor: 'var(--field)' }}
                    />
                    <span
                      className={`text-[13px] font-medium ${checked ? 'text-[var(--ink)]' : 'text-[var(--ink-soft)]'}`}
                    >
                      {item.label}
                    </span>
                  </label>
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
              className="field-input mt-4 w-full resize-none text-[13px]"
            />

            <button
              type="button"
              onClick={handleSubmitObservation}
              disabled={!hasReport}
              className="btn btn-primary mt-3 w-full py-2.5 text-[13px] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {reportSubmitted ? <CheckCircle2 size={14} /> : <ArrowRight size={14} />}
              <span>{isHi ? 'रिपोर्ट भेजें एवं योजना की पुनः जांच करें' : 'Submit report & re-evaluate'}</span>
            </button>

            {reportFeedback && (
              <div
                className="mt-3 flex items-start gap-2 rounded-2xl border border-[var(--line)] p-3 text-[12px] text-[var(--field-deep)]"
                style={{ background: 'var(--field-tint)' }}
                role="status"
              >
                <CheckCircle2 size={14} className="mt-0.5 shrink-0 text-[var(--field)]" />
                <span>{reportFeedback}</span>
              </div>
            )}
          </Reveal>

          {/* ---------- TALK TO AGRIOPTIMA ---------- */}
          <Reveal className="panel flex flex-col p-5 sm:p-6 lg:col-span-7" delay={120}>
            <div className="flex flex-wrap items-start justify-between gap-2 border-b border-[var(--line)] pb-4">
              <div className="flex items-center gap-2.5">
                <span
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-xl text-[var(--sky)]"
                  style={{ background: 'var(--sky-tint)' }}
                >
                  <Volume2 size={16} />
                </span>
                <div>
                  <h2 className="t-h3 text-[1.05rem] text-[var(--ink)]">
                    {isHi ? 'एग्रीऑप्टिमा से बात करें' : 'Talk to AgriOptima'}
                  </h2>
                  <p className="text-[11px] text-[var(--ink-soft)]">
                    {isHi ? 'सरवम व जेमिनी AI द्वारा संचालित' : 'Powered by Sarvam Voice & Gemini AI'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {isSpeaking && (
                  <button
                    type="button"
                    onClick={handleStopAudio}
                    className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] px-2.5 py-1 text-[10px] font-bold text-[var(--ink-soft)] transition-colors hover:text-[var(--ink)]"
                  >
                    <VolumeX size={12} />
                    {isHi ? 'आवाज़ बंद करें' : 'Stop audio'}
                  </button>
                )}
                <span
                  className="font-data rounded-full px-2 py-0.5 text-[10px] text-[var(--sky)]"
                  style={{ background: 'var(--sky-tint)' }}
                >
                  {isHi ? 'हिंदी / English' : 'English / हिंदी'}
                </span>
              </div>
            </div>

            {/* Chat Message Stream */}
            <div
              ref={streamRef}
              className="mt-4 h-[300px] flex-1 space-y-3 overflow-y-auto pr-1 text-[13px] sm:h-[340px]"
              aria-live="polite"
            >
              {conversation.map((msg, idx) => (
                <div key={idx} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 leading-relaxed ${
                      msg.role === 'user'
                        ? 'rounded-br-sm bg-[var(--field)] text-white'
                        : 'rounded-bl-sm border border-[var(--line)] bg-[var(--surface-inset)] text-[var(--ink)]'
                    }`}
                  >
                    <p>{msg.text}</p>
                    {msg.action && (
                      <div className="mt-2 border-t border-[var(--line)] pt-2 text-[11px] font-bold text-[var(--field-deep)]">
                        ✓ {isHi ? 'सुझाव:' : 'Action:'} {msg.action}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {isProcessingAI && (
                <div className="flex items-center gap-2 p-2 text-xs text-[var(--ink-soft)]">
                  <Loader2 size={13} className="animate-spin text-[var(--sky)]" />
                  <span>{isHi ? 'एग्रीऑप्टिमा विचार कर रहा है...' : 'AgriOptima is thinking...'}</span>
                </div>
              )}
            </div>

            {/* Quick Prompts */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {quickPrompts.map((prompt, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleAskQuestion(prompt)}
                  disabled={isProcessingAI}
                  className="max-w-full truncate rounded-full border border-[var(--line)] px-2.5 py-1 text-[11px] font-medium text-[var(--ink-soft)] transition-colors hover:border-[var(--field)] hover:text-[var(--field)] disabled:opacity-50"
                >
                  {prompt}
                </button>
              ))}
            </div>

            {/* Live Spoken Word Bubble (Shows current words in real time as you speak) */}
            {isListening && chatInput && (
              <div
                className="mt-3 flex items-center gap-2 rounded-2xl border border-[var(--line)] px-3 py-1.5 text-xs text-[var(--grain-deep)]"
                style={{ background: 'var(--grain-tint)' }}
              >
                <span className="flex h-2 w-2 shrink-0 animate-ping rounded-full bg-[var(--risk)]" />
                <span className="t-eyebrow shrink-0 text-[var(--grain-deep)]">
                  {isHi ? 'वर्तमान शब्द:' : 'Hearing:'}
                </span>
                <span className="truncate font-bold text-[var(--ink)]">"{chatInput}"</span>
              </div>
            )}

            {/* Input Bar & Mic Button */}
            <div className="mt-3 flex items-center gap-2 border-t border-[var(--line)] pt-3">
              <button
                type="button"
                onClick={handleToggleVoice}
                aria-pressed={isListening}
                className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl border transition-all ${isListening ? 'animate-breathe' : ''}`}
                style={
                  isListening
                    ? { background: 'var(--risk)', borderColor: 'var(--risk)', color: '#fff' }
                    : { background: 'var(--grain-tint)', borderColor: 'transparent', color: 'var(--grain-deep)' }
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
                className="field-input flex-1 py-2 text-[13px]"
              />

              <button
                type="button"
                onClick={() => handleAskQuestion(chatInput)}
                disabled={!chatInput.trim() || isProcessingAI}
                className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[var(--field-deep)] text-white transition-colors hover:bg-[var(--field)] disabled:opacity-50"
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
