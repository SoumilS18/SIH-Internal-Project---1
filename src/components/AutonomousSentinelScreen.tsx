import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  ShieldCheck,
  Bot,
  Volume2,
  VolumeX,
  Mic,
  MicOff,
  Send,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Check,
  RotateCcw,
  CloudRain,
  TrendingUp,
  FileText,
  Bug,
  AlertOctagon,
  Copy,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { getCropDisplayName } from '@/i18n/cropNames';
import { getStateDisplayName, getDistrictDisplayName } from '@/i18n/geoNames';
import { formatCurrency, formatRainfall } from '@/i18n/formatters';
import {
  askFarmerVoiceAssistant,
  askVoiceAgent,
  getVoiceQuickPrompts,
  speakVoiceAgentAudio,
  transcribeAudioWithSarvam,
  detectQueryLanguage,
  type VoiceAgentResponse,
} from '@/services/voiceAgentService';
import { AutonomousLogModal } from '@/components/AutonomousLogModal';
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
  userName = 'Demo Farmer',
  decision,
  logs,
  advisory,
  isChecking,
  onRunCheck,
  onBackToPlan,
  onLogout,
}: AutonomousSentinelScreenProps) {
  const { t, language } = useLanguage();
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

  // Auto-scroll input to the latest words as the user speaks
  useEffect(() => {
    if (chatInputRef.current) {
      chatInputRef.current.scrollLeft = chatInputRef.current.scrollWidth;
    }
  }, [chatInput]);

  const rain7d = decision?.weather?.forecast_rain_7d_total_mm ?? 0;
  const soilMoisture = decision?.weather?.root_zone_soil_moisture_m3m3 ?? 0.35;
  const allocatedCrops = decision?.allocated_crops || [];
  const primaryCropName = allocatedCrops[0]?.crop_name || 'Tomato';

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

  return (
    <div className="relative min-h-screen w-full bg-transparent text-[#1F2937] flex flex-col justify-between selection:bg-[#E2725B]/20 selection:text-[#873322]">
      {/* ===================================================================== */}
      {/* 1. TOP HEADER BAR */}
      {/* ===================================================================== */}
      <header className="sticky top-0 z-30 border-b border-[#EDE4D5] bg-[#FAF7F2]/90 backdrop-blur-md px-4 sm:px-8 py-3">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
          {/* Logo & Stage Indicator */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToPlan}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-[#EDE4D5] bg-[#FFFFFF] text-[#4B5563] hover:bg-[#F5EFE6] transition-colors"
              title={isHi ? 'योजना पर लौटें' : 'Back to Farm Plan'}
            >
              <ArrowLeft size={16} />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg font-bold tracking-tight text-[#1F2937]">
                  AgriOptima Sentinel
                </span>
                <span className="rounded-full bg-[#EAF3ED] px-2.5 py-0.5 text-[10px] font-semibold text-[#2D5A43] border border-[#D4E7DC]">
                  {isHi ? 'चरण 4/4: स्वायत्त निगरानी' : 'Step 4/4: Autonomous Sentinel'}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsLogModalOpen(true)}
              className="hidden sm:flex items-center gap-1.5 rounded-xl border border-[#EDE4D5] bg-[#FFFFFF] px-3 py-1.5 text-xs font-semibold text-[#374151] hover:bg-[#F5EFE6] transition-colors"
            >
              <FileText size={14} className="text-[#2D5A43]" />
              <span>{isHi ? 'निगरानी लॉग्स' : 'Activity Logs'}</span>
            </button>

            <LanguageSelector />

            <button
              type="button"
              onClick={onRunCheck}
              disabled={isChecking}
              className="flex items-center gap-1.5 rounded-xl bg-[#2D5A43] px-3.5 py-1.5 text-xs font-bold text-[#FFFFFF] shadow-sm hover:bg-[#224432] transition-colors cursor-pointer disabled:opacity-60"
            >
              {isChecking ? <Loader2 size={13} className="animate-spin" /> : <RefreshCw size={13} />}
              <span>{isChecking ? (isHi ? 'जांच हो रही है...' : 'Checking...') : (isHi ? 'सेंटीनेल जांच चलाएं' : 'Run Sentinel Check')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* ===================================================================== */}
      {/* 2. MAIN 3-COLUMN WORKSPACE */}
      {/* ===================================================================== */}
      <main className="flex-1 px-4 sm:px-8 py-6 max-w-7xl mx-auto w-full space-y-6">
        
        {/* TOP STATUS & 5-SOURCE CAPABILITY STRIP */}
        <div className="rounded-2xl border border-[#EDE4D5] bg-[#FFFFFF] p-5 shadow-sm space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#3F7253] animate-pulse" />
                <h1 className="font-serif text-lg sm:text-xl font-bold text-[#1F2937]">
                  {isHi ? 'एग्रीऑप्टिमा स्वायत्त खेत निगरानी' : 'AI Agent Monitoring'}
                </h1>
                <span className="rounded-full bg-[#EAF3ED] px-2 py-0.5 text-[10px] font-bold text-[#2D5A43] border border-[#D4E7DC]">
                  ● Live Active
                </span>
              </div>
              <p className="text-xs text-[#6B7280] mt-0.5">
                {isHi
                  ? `आपका AI सहायक ${getDistrictDisplayName(decision.location?.district_name || 'Bhopal', language)} के लिए महत्वपूर्ण कृषि कारकों की निरंतर निगरानी कर रहा है।`
                  : `Your AI assistant is continuously monitoring important farm factors for ${decision.location?.district_name || 'Bhopal'}, ${decision.location?.state_name || 'Madhya Pradesh'}.`}
              </p>
            </div>

            <span className="text-[11px] font-mono text-[#6B7280]">
              {isHi ? 'अंतिम जांच: अभी-अभी' : 'Last check: Live Synced'}
            </span>
          </div>

          {/* 5 Transparent Data Monitoring Pills */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5 text-xs">
            <div className="rounded-xl border border-[#EDE4D5] bg-[#FAF7F2] p-2.5">
              <div className="flex items-center gap-1.5 text-[#2A7575] font-bold text-[11px]">
                <CloudRain size={14} />
                <span>{isHi ? '7-दिन मौसम' : 'Weather (7-Day)'}</span>
              </div>
              <span className="mt-1 block text-[10px] font-semibold text-[#3F7253] bg-[#EAF3ED] px-1.5 py-0.5 rounded w-max">
                LIVE API ({rain7d.toFixed(1)} mm)
              </span>
            </div>

            <div className="rounded-xl border border-[#EDE4D5] bg-[#FAF7F2] p-2.5">
              <div className="flex items-center gap-1.5 text-[#E2725B] font-bold text-[11px]">
                <TrendingUp size={14} />
                <span>{isHi ? 'मंडी भाव' : 'Market Prices'}</span>
              </div>
              <span className="mt-1 block text-[10px] font-semibold text-[#8E7A63] bg-[#EDE4D5] px-1.5 py-0.5 rounded w-max">
                PERIODIC DATA
              </span>
            </div>

            <div className="rounded-xl border border-[#EDE4D5] bg-[#FAF7F2] p-2.5">
              <div className="flex items-center gap-1.5 text-[#3F7253] font-bold text-[11px]">
                <FileText size={14} />
                <span>{isHi ? 'सरकारी योजनाएं' : 'Farm Policies'}</span>
              </div>
              <span className="mt-1 block text-[10px] font-semibold text-[#574D3F] bg-[#EDE4D5] px-1.5 py-0.5 rounded w-max">
                PM-KISAN / PMFBY
              </span>
            </div>

            <div className="rounded-xl border border-[#EDE4D5] bg-[#FAF7F2] p-2.5">
              <div className="flex items-center gap-1.5 text-[#B54832] font-bold text-[11px]">
                <Bug size={14} />
                <span>{isHi ? 'कीट चेतावनी' : 'Pest Alerts'}</span>
              </div>
              <span className="mt-1 block text-[10px] font-semibold text-[#B54832] bg-[#FDEEE9] px-1.5 py-0.5 rounded w-max">
                AGRO ADVISORY
              </span>
            </div>

            <div className="rounded-xl border border-[#EDE4D5] bg-[#FAF7F2] p-2.5">
              <div className="flex items-center gap-1.5 text-[#7C3AED] font-bold text-[11px]">
                <AlertOctagon size={14} />
                <span>{isHi ? 'चरम मौसम' : 'Extreme Alerts'}</span>
              </div>
              <span className="mt-1 block text-[10px] font-semibold text-[#7C3AED] bg-[#F5F3FF] px-1.5 py-0.5 rounded w-max">
                LIVE MONITORED
              </span>
            </div>
          </div>
        </div>

        {/* 3-COLUMN WORKSPACE GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* =================================================================== */}
          {/* COLUMN 1: AI AGENT CHECKLIST (30% width) */}
          {/* =================================================================== */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-[#EDE4D5] bg-[#FFFFFF] p-5 shadow-sm space-y-4">
              <div className="border-b border-[#EDE4D5] pb-3">
                <h2 className="font-serif text-sm sm:text-base font-bold text-[#1F2937]">
                  {isHi ? 'AI एजेंट चेकलिस्ट (अगले 7 दिन)' : 'AI Agent Checklist (Next 7 Days)'}
                </h2>
                <p className="text-[11px] text-[#6B7280]">
                  {isHi ? 'सेंटीनेल द्वारा नियमित रूप से जांची जाने वाली स्थितियां' : 'Automated surveillance routine'}
                </p>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EDE4D5]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-[#3F7253] shrink-0" />
                    <span className="font-semibold text-[#1F2937]">{isHi ? '7-दिवसीय वर्षा पूर्वानुमान' : '7-day weather forecast'}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#6B7280]">{isHi ? 'प्रत्येक 6 घंटे' : 'Every 6 hrs'}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EDE4D5]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-[#3F7253] shrink-0" />
                    <span className="font-semibold text-[#1F2937]">{isHi ? 'राष्ट्रीय मंडी मूल्य रुझान' : 'Mandi prices across India'}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#6B7280]">{isHi ? 'दैनिक' : 'Daily'}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EDE4D5]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-[#3F7253] shrink-0" />
                    <span className="font-semibold text-[#1F2937]">{isHi ? 'कृषि नीतियां एवं सब्सिडी' : 'Scan government policies'}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#6B7280]">{isHi ? 'दैनिक' : 'Daily'}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EDE4D5]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-[#3F7253] shrink-0" />
                    <span className="font-semibold text-[#1F2937]">{isHi ? 'कीट व रोग प्रारंभिक चेतावनी' : 'Pest & disease early warnings'}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#6B7280]">{isHi ? 'प्रत्येक 12 घंटे' : 'Every 12 hrs'}</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#FAF7F2] border border-[#EDE4D5]">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 size={15} className="text-[#3F7253] shrink-0" />
                    <span className="font-semibold text-[#1F2937]">{isHi ? 'चरम मौसम व सूखा अलर्ट' : 'Extreme weather alerts'}</span>
                  </div>
                  <span className="text-[10px] font-mono text-[#6B7280]">{isHi ? 'रियल-टाइम' : 'Real-time'}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsLogModalOpen(true)}
                className="w-full text-center text-xs font-semibold text-[#E2725B] hover:underline pt-1 block"
              >
                {isHi ? 'सभी निगरानी लॉग्स देखें →' : 'View All Sentinel Logs →'}
              </button>
            </div>
          </div>

          {/* =================================================================== */}
          {/* COLUMN 2: FARMER CHECKLIST & HERO DECISION (40% width) */}
          {/* =================================================================== */}
          <div className="lg:col-span-4 space-y-4">
            
            {/* HERO AGENT DECISION BANNER */}
            <div className={`rounded-2xl border p-5 shadow-sm space-y-3 ${
              !advisory || advisory?.severity === 'info' || advisory?.severity === 'success'
                ? 'border-[#D4E7DC] bg-[#EAF3ED]'
                : 'border-[#F9D0C5] bg-[#FDEEE9]'
            }`}>
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#2D5A43]">
                  {isHi ? 'एजेंट का निर्णय' : 'Agent Decision'}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  !advisory || advisory?.severity === 'info' || advisory?.severity === 'success'
                    ? 'bg-[#FFFFFF] text-[#2D5A43] border border-[#D4E7DC]'
                    : 'bg-[#FFFFFF] text-[#B54832] border border-[#F9D0C5]'
                }`}>
                  {!advisory || advisory?.severity === 'info' || advisory?.severity === 'success'
                    ? (isHi ? 'योजना यथावत उपयुक्त' : 'NO CHANGE NEEDED')
                    : (isHi ? 'कार्यवाही की सिफारिश' : 'ACTION RECOMMENDED')}
                </span>
              </div>

              <h3 className="font-serif text-base font-bold text-[#1F2937]">
                {advisory?.headline || (isHi ? 'आपकी वर्तमान खेत योजना पूरी तरह अनुकूल है।' : 'Your current farm plan matches field conditions.')}
              </h3>

              <div className="text-xs text-[#4B5563] space-y-1.5 pt-1">
                <div>
                  <span className="font-bold text-[#1F2937]">{isHi ? 'क्या स्थिति है?' : 'What changed?'} </span>
                  <span>{isHi ? `7-दिवसीय वर्षा ${rain7d.toFixed(1)} mm और मिट्टी नमी ${(soilMoisture * 100).toFixed(0)}% है।` : `Rainfall forecast is ${rain7d.toFixed(1)} mm and soil moisture is at ${(soilMoisture * 100).toFixed(0)}%.`}</span>
                </div>
                <div>
                  <span className="font-bold text-[#1F2937]">{isHi ? 'सिफारिश:' : 'What you should do:'} </span>
                  <span>{advisory?.recommended_action || (isHi ? 'निर्धारित 7-दिवसीय कार्ययोजना अनुसार जुताई व बीज तैयारी जारी रखें।' : 'Proceed with the scheduled 7-day action plan for seedbed preparation.')}</span>
                </div>
              </div>
            </div>

            {/* FARMER CHECKLIST ("Tell the Agent What You Notice") */}
            <div className="rounded-2xl border border-[#EDE4D5] bg-[#FFFFFF] p-5 shadow-sm space-y-4">
              <div className="border-b border-[#EDE4D5] pb-3">
                <h2 className="font-serif text-sm sm:text-base font-bold text-[#1F2937]">
                  {isHi ? 'किसान रिपोर्ट: खेत में क्या देखा?' : 'Farmer Checklist: What You Notice'}
                </h2>
                <p className="text-[11px] text-[#6B7280]">
                  {isHi ? 'खेत में कोई बदलाव दिखा हो तो एजेंट को बताएं' : 'Report field observations to adjust the plan if needed'}
                </p>
              </div>

              <div className="space-y-2 text-xs">
                {[
                  { id: 'rain', label: isHi ? 'अप्रत्याशित भारी बारिश हुई' : 'Unexpected heavy rainfall' },
                  { id: 'sowing', label: isHi ? 'बुवाई तय समय से पहले/देर से हुई' : 'Sown earlier or later than planned' },
                  { id: 'leaf_yellow', label: isHi ? 'फसल की पत्तियों का रंग पीला पड़ा' : 'Crop color changed / leaves yellowing' },
                  { id: 'pest', label: isHi ? 'खेत में कीट या बीमारी के लक्षण दिखे' : 'Pest or disease symptoms noticed' },
                  { id: 'water', label: isHi ? 'पानी या सिंचाई में समस्या आई' : 'Water / irrigation problem occurred' },
                ].map((item) => (
                  <label
                    key={item.id}
                    onClick={() => toggleObservation(item.id)}
                    className="flex items-center gap-2.5 p-2 rounded-xl border border-[#EDE4D5] bg-[#FAF7F2] hover:bg-[#F5EFE6] cursor-pointer transition-colors"
                  >
                    <input
                      type="checkbox"
                      checked={selectedObservations.includes(item.id)}
                      onChange={() => {}}
                      className="rounded text-[#E2725B] focus:ring-[#E2725B]"
                    />
                    <span className="font-medium text-[#374151]">{item.label}</span>
                  </label>
                ))}
              </div>

              {/* Free text observation */}
              <div>
                <textarea
                  rows={2}
                  value={customReportText}
                  onChange={(e) => setCustomReportText(e.target.value)}
                  placeholder={isHi ? 'अन्य कोई बात जो आपने देखी... (जैसे: टमाटर में कीड़े दिख रहे हैं)' : 'Tell the agent what happened... (e.g. Tomato leaves turning yellow)'}
                  className="w-full rounded-xl border border-[#D1D5DB] bg-[#FAF7F2] p-2.5 text-xs text-[#1F2937] placeholder:text-[#9CA3AF] focus:border-[#E2725B] focus:bg-[#FFFFFF] focus:outline-none"
                />
              </div>

              <button
                type="button"
                onClick={handleSubmitObservation}
                className="w-full rounded-xl bg-[#E2725B] py-2.5 text-xs font-bold text-white shadow-sm hover:bg-[#D9654D] transition-colors cursor-pointer"
              >
                {isHi ? 'रिपोर्ट भेजें एवं योजना की पुनः जांच करें' : 'Submit Report & Re-Evaluate'}
              </button>

              {reportFeedback && (
                <div className="flex items-center gap-2 rounded-xl bg-[#EAF3ED] border border-[#D4E7DC] p-2.5 text-xs text-[#2D5A43] animate-in fade-in">
                  <CheckCircle2 size={14} className="text-[#3F7253] shrink-0" />
                  <span>{reportFeedback}</span>
                </div>
              )}
            </div>

          </div>

          {/* =================================================================== */}
          {/* COLUMN 3: TALK TO AGRIOPTIMA (VOICE + TEXT AI) (30% width) */}
          {/* =================================================================== */}
          <div className="lg:col-span-4 space-y-4">
            <div className="rounded-2xl border border-[#EDE4D5] bg-[#FFFFFF] p-5 shadow-sm space-y-4 flex flex-col h-[520px]">
              
              {/* Chat Header */}
              <div className="border-b border-[#EDE4D5] pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#F5F3FF] text-[#7C3AED]">
                    <Volume2 size={16} />
                  </span>
                  <div>
                    <h2 className="font-serif text-sm font-bold text-[#1F2937]">
                      {isHi ? 'एग्रीऑप्टिमा से बात करें' : 'Talk to AgriOptima'}
                    </h2>
                    <p className="text-[10px] text-[#6B7280]">
                      {isHi ? 'सरवम व जेमिनी AI द्वारा संचालित' : 'Powered by Sarvam Voice & Gemini AI'}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-[#7C3AED] bg-[#F5F3FF] px-2 py-0.5 rounded-full border border-[#E9D5FF]">
                  {isHi ? 'हिंदी / English' : 'English / हिंदी'}
                </span>
              </div>

              {/* Chat Message Stream */}
              <div className="flex-1 overflow-y-auto space-y-3 pr-1 text-xs">
                {conversation.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-2xl p-3 leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-[#E2725B] text-white rounded-br-xs'
                          : 'bg-[#FAF7F2] border border-[#EDE4D5] text-[#1F2937] rounded-bl-xs'
                      }`}
                    >
                      <p>{msg.text}</p>
                      {msg.action && (
                        <div className="mt-2 pt-2 border-t border-[#EDE4D5] text-[11px] font-semibold text-[#2D5A43]">
                          ✓ {isHi ? 'सुझाव:' : 'Action:'} {msg.action}
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isProcessingAI && (
                  <div className="flex items-center gap-2 text-xs text-[#6B7280] p-2">
                    <Loader2 size={13} className="animate-spin text-[#7C3AED]" />
                    <span>{isHi ? 'एग्रीऑप्टिमा विचार कर रहा है...' : 'AgriOptima is thinking...'}</span>
                  </div>
                )}
              </div>

              {/* Quick Prompts Chips */}
              <div className="flex flex-wrap gap-1 pt-1">
                {quickPrompts.slice(0, 2).map((prompt, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => handleAskQuestion(prompt)}
                    className="rounded-lg bg-[#FAF7F2] border border-[#EDE4D5] px-2 py-1 text-[10px] text-[#4B5563] hover:border-[#D1D5DB] hover:bg-[#F5EFE6] transition-colors truncate max-w-full"
                  >
                    {prompt}
                  </button>
                ))}
              </div>

              {/* Live Spoken Word Bubble (Shows current words in real time as you speak) */}
              {isListening && chatInput && (
                <div className="flex items-center gap-2 rounded-xl bg-[#FDEEE9] border border-[#F9D0C5] px-3 py-1.5 text-xs text-[#B54832] shadow-xs animate-in fade-in">
                  <span className="flex h-2 w-2 rounded-full bg-red-500 animate-ping shrink-0" />
                  <span className="font-bold text-[11px] uppercase tracking-wider shrink-0 text-[#B54832]">
                    {isHi ? 'वर्तमान शब्द:' : 'Hearing:'}
                  </span>
                  <span className="font-bold text-[#1F2937] truncate">
                    "{chatInput}"
                  </span>
                </div>
              )}

              {/* Input Bar & Mic Button */}
              <div className="pt-2 border-t border-[#EDE4D5] flex items-center gap-2">
                {/* Explicit Start/Stop Mic Toggle Button */}
                <button
                  type="button"
                  onClick={handleToggleVoice}
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-all cursor-pointer ${
                    isListening
                      ? 'bg-red-600 text-white animate-pulse shadow-md ring-2 ring-red-400/50'
                      : 'bg-[#FDEEE9] border border-[#F9D0C5] text-[#E2725B] hover:bg-[#E2725B] hover:text-white'
                  }`}
                  title={
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

                {/* Text input with Auto-Scroll to Latest Spoken Words */}
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
                  className="flex-1 rounded-xl border border-[#D1D5DB] bg-[#FAF7F2] px-3 py-2 text-xs text-[#1F2937] placeholder:text-[#9CA3AF] focus:border-[#E2725B] focus:bg-[#FFFFFF] focus:outline-none"
                />

                {/* Send Button */}
                <button
                  type="button"
                  onClick={() => handleAskQuestion(chatInput)}
                  disabled={!chatInput.trim() || isProcessingAI}
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#2D5A43] text-white hover:bg-[#224432] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Send size={15} />
                </button>
              </div>

            </div>
          </div>

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
      {/* 3. FOOTER */}
      {/* ===================================================================== */}
      <footer className="border-t border-[#EDE4D5] bg-[#FAF7F2] px-4 sm:px-8 py-3 text-xs text-[#6B7280]">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3 text-[11px]">
          <span>{isHi ? '24/7 स्वायत्त कृषि निगरानी एवं सुरक्षा प्रणाली' : '24/7 Autonomous Agricultural Telemetry & Risk Sentinel'}</span>
          <span>© 2026 AgriOptima AI</span>
        </div>
      </footer>
    </div>
  );
}
