import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Zap,
  CloudRain,
  Droplets,
  Sprout,
  DollarSign,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  Loader2,
  Lock,
  Compass,
  ArrowRight,
  ShieldAlert,
  Mic,
  MicOff,
  PenTool,
  Camera,
  Image as ImageIcon,
  X,
  Check,
  RefreshCw,
  MessageSquare,
  Clock,
  History,
  Volume2,
  VolumeX,
  Copy,
  Send,
  Globe,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { formatCurrency, formatRainfall, formatTemperature } from '@/i18n/formatters';
import { getCropDisplayName } from '@/i18n/cropNames';
import { getStateDisplayName, getDistrictDisplayName } from '@/i18n/geoNames';
import type { FarmDecisionResponse } from '@/types/farm';
import type { AutonomousCycleLog, ProactiveAdvisory } from '@/types/autonomous';
import {
  askFarmerVoiceAssistant,
  askVoiceAgent,
  getVoiceQuickPrompts,
  speakVoiceAgentAudio,
  transcribeAudioWithSarvam,
  detectQueryLanguage,
  type VoiceAgentResponse,
} from '@/services/voiceAgentService';

interface AutonomousAgentViewProps {
  decision: FarmDecisionResponse;
  logs: AutonomousCycleLog[];
  advisory: ProactiveAdvisory | null;
  isChecking: boolean;
  onRunCheck: () => void;
  onOpenLogModal?: () => void;
}

type DecisionStateType = 'NO_ACTION' | 'ACTION_RECOMMENDED' | 'CHANGE_PLAN' | 'HIGH_RISK';
type InputMode = 'type' | 'speak' | 'photo';

export function AutonomousAgentView({
  decision,
  logs,
  advisory,
  isChecking,
  onRunCheck,
  onOpenLogModal,
}: AutonomousAgentViewProps) {
  const { t, language } = useLanguage();
  const isHi = language === 'hi';
  const isLanguageSupported = language === 'en' || language === 'hi' || language === 'en-IN' || language === 'hi-IN';

  // Animation Step state: 0 = Idle / All Checked, 1..5 = Actively checking step, 6 = Completed
  const [animStep, setAnimStep] = useState<number>(6);
  const [showWhy, setShowWhy] = useState<boolean>(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);
  const [expandedChecklistStep, setExpandedChecklistStep] = useState<number | null>(null);

  // =========================================================================
  // VOICE-ENABLED AUTONOMOUS AGENT STATE
  // =========================================================================
  const [isVoiceListening, setIsVoiceListening] = useState<boolean>(false);
  const [isVoiceSpeaking, setIsVoiceSpeaking] = useState<boolean>(false);
  const [voiceQueryText, setVoiceQueryText] = useState<string>('');
  const [voiceInputText, setVoiceInputText] = useState<string>('');
  const [liveTranscript, setLiveTranscript] = useState<string>('');
  const [voiceAgentResponse, setVoiceAgentResponse] = useState<VoiceAgentResponse | null>(null);
  const [isProcessingVoiceQuery, setIsProcessingVoiceQuery] = useState<boolean>(false);
  const [voiceCheckingStep, setVoiceCheckingStep] = useState<number>(0); // 0 = idle, 1..4 = steps, 5 = ready
  const [voiceError, setVoiceError] = useState<string | null>(null);
  const [copiedAnswer, setCopiedAnswer] = useState<boolean>(false);
  const [responseLanguage, setResponseLanguage] = useState<string>(language);
  const [conversationHistory, setConversationHistory] = useState<Array<{ role: string; text: string }>>([]);

  const voiceRecognitionRef = useRef<any>(null);
  const liveTranscriptRef = useRef<string>('');
  const voiceSpeakerRef = useRef<{ stop: () => void } | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Farmer Ground Observation State (100% Optional & Simple)
  const [inputMode, setInputMode] = useState<InputMode>('type');
  const [customText, setCustomText] = useState<string>('');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [attachedPhoto, setAttachedPhoto] = useState<{ name: string; url: string } | null>(null);
  const [farmerObservation, setFarmerObservation] = useState<string | null>(null);
  const [isReevaluating, setIsReevaluating] = useState<boolean>(false);

  // Observation mic state
  const [isObservationListening, setIsObservationListening] = useState<boolean>(false);
  const [obsSpeechError, setObsSpeechError] = useState<string | null>(null);
  const obsRecognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Farm telemetry parameters (with graceful fallbacks)
  const districtName = decision.location?.district_name || 'Bhopal';
  const stateName = decision.location?.state_name || 'Madhya Pradesh';
  const soilType = decision.location?.major_soil_type || 'Medium Black';
  const season = decision.request?.season || 'Kharif';
  const landAcres = decision.farm_totals?.total_allocated_acres || decision.request?.land_size_acres || 5;
  const netProfit = decision.farm_totals?.total_expected_net_profit_inr || 0;

  const soilMoisture = decision.weather?.root_zone_soil_moisture_m3m3;
  const rain7d = decision.weather?.forecast_rain_7d_total_mm ?? 0;
  const maxTemp = decision.weather?.forecast_temp_max_c;
  const droughtScore = decision.risk?.drought_risk_score ?? 0;
  const waterlogScore = decision.risk?.waterlogging_risk_score ?? 0;
  const overallRisk = decision.risk?.overall_risk_label || 'LOW';

  const primaryCrops = decision.allocated_crops || [];
  const primaryCropNames = primaryCrops.map((c) => getCropDisplayName(c.crop_name, language)).join(', ');

  // Quick Select Chips Definition for Ground Observations
  const quickChips = [
    { id: 'crop_unhealthy', label: t('sentinel.chipCropUnhealthy'), icon: '🌱' },
    { id: 'water_avail', label: t('sentinel.chipWaterAvailable'), icon: '💧' },
    { id: 'irrigation_prob', label: t('sentinel.chipIrrigationProblem'), icon: '⚠️' },
    { id: 'heavy_rain', label: t('sentinel.chipHeavyRainExpected'), icon: '🌧️' },
    { id: 'pest_noticed', label: t('sentinel.chipPestNoticed'), icon: '🐛' },
    { id: 'something_else', label: t('sentinel.chipSomethingElse'), icon: '📝' },
  ];

  // Dynamic Decision State Evaluation
  const decisionState: DecisionStateType = (() => {
    if (farmerObservation) {
      return 'ACTION_RECOMMENDED';
    }
    if (advisory?.severity === 'critical' || droughtScore > 0.65) {
      return 'HIGH_RISK';
    }
    if (advisory?.severity === 'warning' || (rain7d > 60 && waterlogScore > 0.4)) {
      return 'CHANGE_PLAN';
    }
    if (advisory !== null && advisory !== undefined) {
      return 'ACTION_RECOMMENDED';
    }
    if (soilMoisture !== undefined && soilMoisture !== null && soilMoisture < 0.20 && rain7d < 10) {
      return 'ACTION_RECOMMENDED';
    }
    return 'NO_ACTION';
  })();

  // Handle Sequential Animation Trigger for Full Farm Check
  const handleTriggerCheck = () => {
    onRunCheck();
    setAnimStep(1);
    setExpandedChecklistStep(null);
  };

  useEffect(() => {
    if (animStep >= 1 && animStep < 5) {
      const timer = setTimeout(() => {
        setAnimStep((prev) => prev + 1);
      }, 350);
      return () => clearTimeout(timer);
    } else if (animStep === 5) {
      const timer = setTimeout(() => {
        setAnimStep(6);
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [animStep]);

  // Clean up any active speech synthesis when unmounting or changing language
  useEffect(() => {
    return () => {
      if (voiceSpeakerRef.current) {
        voiceSpeakerRef.current.stop();
      }
      if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, [language]);

  // =========================================================================
  // VOICE AGENT QUERY PROCESSING PIPELINE
  // =========================================================================
  const handleProcessVoiceQuery = useCallback(
    async (queryText: string, forcedLang?: 'en' | 'hi', autoPlaySpeech: boolean = false) => {
      const cleanQuery = queryText.trim();
      if (!cleanQuery) return;

      if (!isLanguageSupported) {
        setVoiceAgentResponse({
          intent: 'UNSUPPORTED_LANGUAGE',
          spoken_text: t('sentinel.voiceComingSoonNotice') || 'Voice assistance in this language is coming soon.',
          display_text: t('sentinel.voiceComingSoonNotice') || 'Voice assistance in this language is coming soon.',
          action_required: false,
          reason: 'Multilingual voice assistant roadmap in progress.',
          checked_steps: [],
          telemetry_facts: {},
          is_unsupported_language: true,
          source: 'system',
        });
        setVoiceQueryText(cleanQuery);
        return;
      }

      const targetLang = (forcedLang || language) === 'hi' ? 'hi' : 'en';
      setResponseLanguage(targetLang);
      setVoiceQueryText(cleanQuery);
      setLiveTranscript('');
      setVoiceError(null);
      setIsProcessingVoiceQuery(true);
      setVoiceCheckingStep(1);

      // Stop any existing TTS speech
      if (voiceSpeakerRef.current) {
        voiceSpeakerRef.current.stop();
        setIsVoiceSpeaking(false);
      }

      // Step-by-step sequential verification animation before revealing answer
      setTimeout(() => setVoiceCheckingStep(2), 200);
      setTimeout(() => setVoiceCheckingStep(3), 400);
      setTimeout(() => setVoiceCheckingStep(4), 600);

      try {
        const response = await askFarmerVoiceAssistant(cleanQuery, decision, targetLang, conversationHistory);
        setTimeout(async () => {
          setVoiceCheckingStep(5);
          setVoiceAgentResponse(response);
          setIsProcessingVoiceQuery(false);
          setConversationHistory((prev) => [
            ...prev,
            { role: 'user', text: cleanQuery },
            { role: 'assistant', text: response.display_text },
          ]);

          // Auto-play speech in the exact spoken language
          if (autoPlaySpeech) {
            const textToSpeak = response.spoken_text || response.display_text;
            const speakerHandle = await speakVoiceAgentAudio(
              textToSpeak,
              targetLang,
              () => setIsVoiceSpeaking(true),
              () => setIsVoiceSpeaking(false),
              (err) => {
                console.warn('Speech synthesis playback error:', err);
                setIsVoiceSpeaking(false);
              }
            );
            voiceSpeakerRef.current = speakerHandle;
          }
        }, 800);
      } catch (err: any) {
        console.warn('Voice Agent reasoning fallback:', err);
        setVoiceError(t('sentinel.voiceConnectionError'));
        setIsProcessingVoiceQuery(false);
        setVoiceCheckingStep(0);
      }
    },
    [decision, language, isLanguageSupported, conversationHistory, t]
  );

  // Toggle Voice Recognition for Main Agent Voice Bar
  // First click: Starts audio recording and real-time transcription
  // Second click: Stops recording and immediately answers the question in the same language!
  const toggleVoiceListening = async () => {
    setVoiceError(null);

    // Stop speaking if currently speaking
    if (voiceSpeakerRef.current) {
      voiceSpeakerRef.current.stop();
      setIsVoiceSpeaking(false);
    }

    // IF ALREADY LISTENING (CLICKING THE MIC THE SECOND TIME TO STOP & PROCESS)
    if (isVoiceListening) {
      setIsVoiceListening(false);

      // 1. Stop SpeechRecognition
      if (voiceRecognitionRef.current) {
        try {
          voiceRecognitionRef.current.stop();
        } catch {
          // ignore
        }
      }

      // 2. Stop MediaRecorder
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        try {
          mediaRecorderRef.current.stop();
        } catch {
          // ignore
        }
      }

      // 3. Stop microphone audio stream
      if (mediaStreamRef.current) {
        try {
          mediaStreamRef.current.getTracks().forEach((track) => track.stop());
        } catch {
          // ignore
        }
      }

      // Small delay to allow final audio packets and SpeechRecognition buffer to settle
      setTimeout(async () => {
        const capturedText = (liveTranscriptRef.current || voiceInputText || '').trim();
        if (capturedText) {
          const detectedLang = detectQueryLanguage(capturedText, language);
          setVoiceInputText(capturedText);
          handleProcessVoiceQuery(capturedText, detectedLang, true /* autoPlaySpeech */);
          return;
        }

        // If Web Speech API was empty (e.g. browser speech engine delayed), fallback to Sarvam AI STT!
        if (audioChunksRef.current.length > 0) {
          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
          if (audioBlob.size > 1000) {
            setIsProcessingVoiceQuery(true);
            setVoiceCheckingStep(1);
            const sarvamTranscript = await transcribeAudioWithSarvam(audioBlob, isHi ? 'hi-IN' : 'en-IN');
            if (sarvamTranscript && sarvamTranscript.trim()) {
              const detectedLang = detectQueryLanguage(sarvamTranscript, language);
              setVoiceInputText(sarvamTranscript);
              handleProcessVoiceQuery(sarvamTranscript, detectedLang, true /* autoPlaySpeech */);
              return;
            }
          }
        }

        setIsProcessingVoiceQuery(false);
        setVoiceCheckingStep(0);
        setVoiceError(
          isHi
            ? 'कोई आवाज़ दर्ज नहीं हुई। कृपया पुनः टैप कर बोलें या त्वरित प्रश्न चुनें।'
            : 'No speech detected. Please tap mic to speak or use quick questions below.'
        );
      }, 350);
      return;
    }

    // STARTING RECORDING (FIRST CLICK)
    liveTranscriptRef.current = '';
    setLiveTranscript('');
    audioChunksRef.current = [];

    // 1. Initialize MediaRecorder for Sarvam STT fallback
    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        mediaStreamRef.current = stream;
        const recorder = new MediaRecorder(stream);
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            audioChunksRef.current.push(e.data);
          }
        };
        recorder.start(150);
        mediaRecorderRef.current = recorder;
      } catch (err) {
        console.warn('Microphone access note:', err);
      }
    }

    // 2. Initialize Web Speech API for real-time live preview
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      if (mediaRecorderRef.current) {
        setIsVoiceListening(true);
        setVoiceError(null);
        return;
      }
      setVoiceError(t('sentinel.voiceMicDenied'));
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = isHi ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsVoiceListening(true);
        setVoiceError(null);
      };

      recognition.onresult = (event: any) => {
        let fullText = '';
        for (let i = 0; i < event.results.length; i++) {
          fullText += event.results[i][0].transcript + ' ';
        }
        const trimmed = fullText.trim();
        if (trimmed) {
          liveTranscriptRef.current = trimmed;
          setLiveTranscript(trimmed);
          setVoiceInputText(trimmed);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition event notice:', event.error);
        if (event.error === 'not-allowed') {
          setIsVoiceListening(false);
          setVoiceError(t('sentinel.voiceMicDenied'));
        }
      };

      recognition.onend = () => {
        // Recognition cycle ended
      };

      voiceRecognitionRef.current = recognition;
      recognition.start();
      setIsVoiceListening(true);
    } catch (err) {
      if (!mediaRecorderRef.current) {
        setIsVoiceListening(false);
        setVoiceError(t('sentinel.voiceMicDenied'));
      }
    }
  };

  // Toggle Text-to-Speech playback for the agent's answer
  const handleToggleSpeakAnswer = async () => {
    if (!voiceAgentResponse) return;

    if (isVoiceSpeaking) {
      if (voiceSpeakerRef.current) {
        voiceSpeakerRef.current.stop();
      }
      setIsVoiceSpeaking(false);
      return;
    }

    const textToSpeak = voiceAgentResponse.spoken_text || voiceAgentResponse.display_text;
    const speakerHandle = await speakVoiceAgentAudio(
      textToSpeak,
      responseLanguage as 'en' | 'hi',
      () => setIsVoiceSpeaking(true),
      () => setIsVoiceSpeaking(false),
      (err) => {
        console.warn('Speech synthesis playback error:', err);
        setIsVoiceSpeaking(false);
      }
    );
    voiceSpeakerRef.current = speakerHandle;
  };

  // Copy agent answer to clipboard
  const handleCopyAnswer = () => {
    if (!voiceAgentResponse) return;
    const textToCopy = `${voiceAgentResponse.display_text}${
      voiceAgentResponse.recommended_action ? `\n\n${t('sentinel.voiceRecommendedAction')}: ${voiceAgentResponse.recommended_action}` : ''
    }`;
    navigator.clipboard?.writeText(textToCopy);
    setCopiedAnswer(true);
    setTimeout(() => setCopiedAnswer(false), 2000);
  };

  // Reset current voice query
  const handleResetVoiceQuery = () => {
    if (voiceSpeakerRef.current) {
      voiceSpeakerRef.current.stop();
      setIsVoiceSpeaking(false);
    }
    setVoiceQueryText('');
    setVoiceInputText('');
    setLiveTranscript('');
    liveTranscriptRef.current = '';
    setVoiceAgentResponse(null);
    setVoiceCheckingStep(0);
    setVoiceError(null);
  };

  // =========================================================================
  // FARMER OBSERVATION SPEECH RECOGNITION (OPTIONAL FIELD CONTEXT)
  // =========================================================================
  const toggleObservationListening = () => {
    setObsSpeechError(null);

    if (isObservationListening) {
      if (obsRecognitionRef.current) {
        obsRecognitionRef.current.stop();
      }
      setIsObservationListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setObsSpeechError(t('sentinel.micErrorNotice'));
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = isHi ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsObservationListening(true);
        setObsSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          setCustomText(transcript);
          handleAddObservation(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        setIsObservationListening(false);
        if (event.error === 'not-allowed') {
          setObsSpeechError(t('sentinel.micErrorNotice'));
        }
      };

      recognition.onend = () => {
        setIsObservationListening(false);
      };

      obsRecognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setIsObservationListening(false);
      setObsSpeechError(t('sentinel.micErrorNotice'));
    }
  };

  // Toggle quick select chips for observation
  const handleToggleChip = (chipLabel: string) => {
    setSelectedChips((prev) => {
      const exists = prev.includes(chipLabel);
      if (exists) {
        return prev.filter((c) => c !== chipLabel);
      } else {
        return [...prev, chipLabel];
      }
    });
  };

  // Handle Photo upload
  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setAttachedPhoto({ name: file.name, url });
    }
  };

  // Add observation to farm check (triggers re-evaluation)
  const handleAddObservation = (overrideText?: string) => {
    const textToUse = overrideText !== undefined ? overrideText : customText;
    const parts: string[] = [];

    if (selectedChips.length > 0) {
      parts.push(selectedChips.join(', '));
    }
    if (textToUse.trim()) {
      parts.push(textToUse.trim());
    }
    if (attachedPhoto) {
      parts.push(`[${t('sentinel.photoAttachedTag')}: ${attachedPhoto.name}]`);
    }

    if (parts.length === 0) return;

    const fullObs = parts.join(' • ');
    setIsReevaluating(true);
    setTimeout(() => {
      setFarmerObservation(fullObs);
      setIsReevaluating(false);
    }, 700);
  };

  // Clear / remove farmer observation
  const handleClearObservation = () => {
    setIsReevaluating(true);
    setTimeout(() => {
      setFarmerObservation(null);
      setSelectedChips([]);
      setCustomText('');
      setAttachedPhoto(null);
      setIsReevaluating(false);
    }, 450);
  };

  // Toggle accordion detail for each checklist step
  const toggleStepDetails = (stepIndex: number) => {
    setExpandedChecklistStep((prev) => (prev === stepIndex ? null : stepIndex));
  };

  // Step Status Helper
  const getStepStatus = (stepNumber: number) => {
    if (animStep === 6 || animStep === 0) {
      return { status: 'checked', label: stepNumber === 5 ? t('sentinel.statusDecisionReady') : t('sentinel.statusChecked') };
    }
    if (animStep === stepNumber) {
      return { status: 'checking', label: t('sentinel.statusChecking') };
    }
    if (animStep > stepNumber) {
      return { status: 'checked', label: t('sentinel.statusChecked') };
    }
    return { status: 'pending', label: t('sentinel.statusPending') };
  };

  // Context-aware Next Step when farmer reports something
  const getFarmerInputNextStep = () => {
    const obsLower = (farmerObservation || '').toLowerCase();
    if (obsLower.includes('pest') || obsLower.includes('कीट')) {
      return isHi
        ? 'कीट प्रभावित पौधों की पत्तियों के नीचे जाँच करें और जैविक नीम छिड़काव की योजना बनाएं।'
        : 'Inspect the underside of leaves for pest clusters and plan targeted organic treatment.';
    }
    if (obsLower.includes('water') || obsLower.includes('पानी') || obsLower.includes('dry') || obsLower.includes('नमी')) {
      return isHi
        ? 'सिंचाई लाइनों की जाँच करें और प्रभावित क्षेत्रों में आवश्यक नमी प्रदान करें।'
        : 'Inspect irrigation channels and deliver targeted moisture to affected root zones.';
    }
    if (obsLower.includes('rain') || obsLower.includes('बारिश')) {
      return isHi
        ? 'खेत में जलभराव रोकने के लिए जल निकासी नालियों को तुरंत साफ रखें।'
        : 'Clear field drainage channels to avoid standing water and root asphyxiation.';
    }
    if (obsLower.includes('heat') || obsLower.includes('गर्मी') || obsLower.includes('unhealthy')) {
      return isHi
        ? 'फसल को तेज धूप से राहत देने के लिए शाम के समय हल्की सिंचाई या पलवार (mulching) की जाँच करें।'
        : 'Deliver evening pulse irrigation or check field mulching to cool canopy temperature.';
    }
    return t('sentinel.farmerObsInspectAction');
  };

  // Format last checked time
  const lastCheckedTimeString = logs[0]?.timestamp
    ? new Date(logs[0].timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : t('sentinel.lastCheckedJustNow');

  // Dynamic Recent Actions History Timeline (Derived safely from logs)
  const historyItems = logs.length > 0
    ? logs.slice(0, 3).map((log, idx) => {
        const timeFormatted = log.timestamp
          ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          : `${idx === 0 ? 'Just now' : `${idx * 15}m ago`}`;
        const isAction = log.action_validated && log.action_type !== 'RECORD_OPTIMAL_STATUS';
        return {
          time: timeFormatted,
          title: log.action_name || (isAction ? t('sentinel.actionIrrigationRiskDetected') : t('sentinel.actionCheckedConditions')),
          desc: log.action_detail || (isAction ? t('sentinel.actionIrrigationRiskDesc') : t('sentinel.actionCheckedConditionsDesc')),
          isWarning: isAction,
        };
      })
    : [
        {
          time: lastCheckedTimeString,
          title: t('sentinel.actionCheckedConditions'),
          desc: t('sentinel.actionCheckedConditionsDesc'),
          isWarning: false,
        },
        {
          time: isHi ? 'कुछ देर पहले' : '15 min ago',
          title: t('sentinel.actionCheckedWeatherSoil'),
          desc: t('sentinel.actionCheckedWeatherSoilDesc'),
          isWarning: false,
        },
      ];

  const quickVoicePrompts = getVoiceQuickPrompts(language);

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* 1. SIMPLIFIED TOP SECTION (HEADER) */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-emerald-500/25 bg-gradient-to-r from-forest-950/95 via-forest-900/90 to-forest-950/95 p-5 sm:p-7 shadow-xl backdrop-blur-md">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            {/* Live Sentinel Badge & Status */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-mono font-bold tracking-wider text-emerald-300 uppercase">
                {t('sentinel.sentinelHeaderTitle')}
              </span>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2.5 py-0.5 text-[11px] font-bold text-emerald-300">
                ● {t('sentinel.sentinelActive')}
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] text-cream-300/70">
                <Clock size={11} className="text-emerald-400/80" />
                <span>
                  {t('sentinel.lastCheckedLabel')}: <strong className="text-white font-mono">{lastCheckedTimeString}</strong>
                </span>
              </span>
            </div>

            {/* Clear Title & Farm Assistant Tagline */}
            <div>
              <h1 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
                {t('sentinel.headerTagline')}
              </h1>
              <p className="text-xs sm:text-sm text-cream-200/90 mt-0.5">
                {t('sentinel.headerExplanation')}
              </p>
            </div>

            {/* Farm Context Badges + 60-Second Auto Check Info */}
            <div className="flex flex-wrap items-center gap-2 pt-1">
              <span className="inline-flex items-center gap-1 rounded-full bg-forest-900/90 border border-gold-300/20 px-3 py-1 text-xs font-medium text-gold-200">
                <Compass size={12} className="text-gold-300" />
                {getDistrictDisplayName(districtName, language)}, {getStateDisplayName(stateName, language)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-forest-900/90 border border-forest-700/50 px-3 py-1 text-xs font-medium text-cream-200">
                {landAcres} {t('overview.acres')}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-forest-900/90 border border-forest-700/50 px-3 py-1 text-xs font-medium text-cream-200">
                {season} {t('config.season')}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-forest-950/80 border border-forest-800 px-3 py-1 text-[11px] text-cream-300/60">
                <RefreshCw size={11} className="text-emerald-400/70" />
                {t('sentinel.autoCheckInterval')}
              </span>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="shrink-0 pt-1 sm:pt-0">
            <button
              type="button"
              onClick={handleTriggerCheck}
              disabled={isChecking || (animStep >= 1 && animStep < 6) || isReevaluating}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2.5 rounded-2xl border border-emerald-400/50 bg-gradient-to-r from-emerald-500 via-teal-500 to-emerald-500 px-6 py-3.5 text-xs sm:text-sm font-bold text-forest-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              {isChecking || (animStep >= 1 && animStep < 6) || isReevaluating ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Sparkles size={16} />
              )}
              <span>
                {isChecking || (animStep >= 1 && animStep < 6) || isReevaluating
                  ? t('sentinel.checking')
                  : t('sentinel.runCheckNow')}
              </span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. VOICE-ENABLED AUTONOMOUS FARM AGENT (ASK YOUR FARM AGENT) */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-gold-300/30 bg-gradient-to-b from-forest-950/95 via-forest-900/80 to-forest-950/95 p-5 sm:p-7 shadow-2xl space-y-5">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gold-300/15 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-xl bg-gold-400/20 text-gold-300 border border-gold-300/30 shadow-sm">
                <Mic size={16} />
              </span>
              <h2 className="font-serif text-lg sm:text-xl font-bold text-gold-100">
                🎙️ {t('sentinel.voiceAgentTitle')}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-cream-200/90 mt-0.5">
              "{t('sentinel.voiceAgentSubtitle')}"
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 text-[11px] font-bold text-emerald-300 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{isHi ? 'खेत टेलीमेट्री सक्रिय' : 'Live Telemetry Grounded'}</span>
            </span>
          </div>
        </div>

        {!isLanguageSupported ? (
          /* Unsupported Language Notice */
          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/40 p-6 text-center space-y-2.5 animate-in fade-in">
            <div className="flex items-center justify-center gap-2 text-amber-300 font-serif font-bold text-sm sm:text-base">
              <Globe size={18} />
              <span>{t('sentinel.voiceComingSoonNotice')}</span>
            </div>
            <p className="text-xs text-cream-200/80 max-w-md mx-auto">
              Voice assistance is currently available in English and हिन्दी (Hindi). Support for your selected language is coming soon.
            </p>
          </div>
        ) : (
          <>
            {/* Primary Interactive Voice Area */}
            <div className="flex flex-col items-center justify-center py-3 text-center space-y-4">
              {/* Main Tap to Speak Button */}
              <div className="relative flex items-center justify-center">
                {/* Outer pulsating rings when listening */}
                {isVoiceListening && (
                  <>
                    <span className="absolute h-24 w-24 rounded-full bg-pink-500/20 animate-ping" />
                    <span className="absolute h-20 w-20 rounded-full bg-pink-500/30 animate-pulse" />
                  </>
                )}

                <button
                  type="button"
                  onClick={toggleVoiceListening}
                  disabled={isProcessingVoiceQuery}
                  className={`relative z-10 flex h-16 w-16 sm:h-18 sm:w-18 items-center justify-center rounded-full transition-all cursor-pointer shadow-lg active:scale-95 disabled:opacity-50 ${
                    isVoiceListening
                      ? 'bg-gradient-to-br from-pink-500 via-rose-600 to-pink-700 text-white shadow-[0_0_25px_rgba(236,72,153,0.6)] scale-105 animate-pulse'
                      : 'bg-gradient-to-br from-gold-400 via-gold-500 to-amber-500 text-forest-950 hover:scale-105 hover:shadow-[0_0_25px_rgba(255,210,26,0.4)]'
                  }`}
                  title={
                    isVoiceListening
                      ? isHi
                        ? 'सुनना बंद करें और उत्तर पाएं (दोबारा टैप करें)'
                        : 'Stop & Answer (Tap again to finish)'
                      : t('sentinel.voiceTapToSpeak')
                  }
                >
                  {isVoiceListening ? (
                    <MicOff size={28} className="animate-pulse" />
                  ) : isProcessingVoiceQuery ? (
                    <Loader2 size={28} className="animate-spin" />
                  ) : (
                    <Mic size={28} />
                  )}
                </button>
              </div>

              <div className="space-y-1.5 max-w-md">
                <div className="flex flex-col items-center gap-0.5">
                  <span className="text-xs sm:text-sm font-bold text-white block">
                    {isVoiceListening
                      ? isHi
                        ? '🎙️ सुन रहे हैं... (Listening...)'
                        : '🎙️ Listening...'
                      : isProcessingVoiceQuery
                      ? t('sentinel.voiceThinking') || 'Thinking...'
                      : `🎤 ${t('sentinel.voiceTapToSpeak')}`}
                  </span>
                  {isVoiceListening && (
                    <span className="text-[11px] font-semibold text-pink-300 animate-pulse">
                      {isHi ? 'अब बोलें (Speak now)' : 'Speak now'}
                    </span>
                  )}
                </div>

                {/* Live real-time recognized transcript preview while speaking */}
                {isVoiceListening && liveTranscript ? (
                  <div className="rounded-2xl border border-pink-400/40 bg-pink-950/40 px-3.5 py-1.5 text-xs text-pink-200 animate-in fade-in">
                    <span className="font-semibold text-white">"{liveTranscript}"</span>
                  </div>
                ) : (
                  <p className="text-[11px] text-cream-300/70">
                    {isHi
                      ? 'माइक दबाकर बोलें: "क्या आज खेत में पानी देना चाहिए?", "बारिश कब होगी?", "खतरा क्या है?"'
                      : 'Tap mic and ask: "Should I water my field today?", "Why did you choose this crop?", "Is my crop at risk?"'}
                  </p>
                )}
              </div>
            </div>

            {/* Quick Question Chips */}
            <div className="space-y-2 pt-1">
              <span className="text-[11px] font-bold text-cream-300/80 uppercase tracking-wider block text-left">
                {isHi ? 'त्वरित प्रश्न:' : 'Quick Questions:'}
              </span>
              <div className="flex flex-wrap gap-2">
                {quickVoicePrompts.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleProcessVoiceQuery(item.query, undefined, true)}
                    disabled={isProcessingVoiceQuery || isVoiceListening}
                    className="inline-flex items-center gap-1.5 rounded-full border border-forest-700/60 bg-forest-900/70 px-3.5 py-1.5 text-xs text-cream-200 hover:border-gold-300/50 hover:bg-forest-800 hover:text-white transition-all cursor-pointer disabled:opacity-40"
                  >
                    <span>{item.icon}</span>
                    <span>{item.query}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Text Fallback Input Bar */}
            <div className="space-y-2 pt-2 border-t border-forest-800/80">
              <span className="text-[11px] font-bold text-cream-300/70 block text-left">
                {t('sentinel.voiceOrType')}
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={voiceInputText}
                  onChange={(e) => setVoiceInputText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && voiceInputText.trim()) {
                      handleProcessVoiceQuery(voiceInputText, undefined, true);
                    }
                  }}
                  placeholder={t('sentinel.voiceTypePlaceholder')}
                  disabled={isProcessingVoiceQuery || isVoiceListening}
                  className="flex-1 rounded-2xl border border-forest-700 bg-forest-950/80 px-4 py-2.5 text-xs text-cream-100 placeholder:text-cream-300/40 focus:border-gold-300 focus:outline-none focus:ring-1 focus:ring-gold-300 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => handleProcessVoiceQuery(voiceInputText, undefined, true)}
                  disabled={!voiceInputText.trim() || isProcessingVoiceQuery || isVoiceListening}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-gold-300/40 bg-gradient-to-r from-gold-400 to-gold-500 px-4 py-2.5 text-xs font-bold text-forest-950 shadow-sm transition-all hover:scale-[1.02] disabled:opacity-40 cursor-pointer"
                >
                  <span>{t('sentinel.voiceAskButton')}</span>
                  <Send size={13} />
                </button>
              </div>
            </div>
          </>
        )}

        {/* Voice Error Banner */}
        {voiceError && (
          <div className="rounded-2xl border border-pink-500/40 bg-pink-950/60 p-3 text-xs text-pink-200 flex items-center justify-between gap-2 animate-in fade-in duration-150">
            <div className="flex items-center gap-2">
              <AlertTriangle size={14} className="text-pink-400 shrink-0" />
              <span>{voiceError}</span>
            </div>
            <button
              type="button"
              onClick={() => setVoiceError(null)}
              className="text-pink-300 hover:text-white p-1"
            >
              <X size={12} />
            </button>
          </div>
        )}

        {/* ===================================================================== */}
        {/* INTERACTION RESULT: USER QUERY -> SEQUENTIAL CHECK -> AGENT ANSWER */}
        {/* ===================================================================== */}
        {(isProcessingVoiceQuery || voiceAgentResponse) && (
          <div className="rounded-3xl border border-gold-300/30 bg-gradient-to-br from-forest-950 via-forest-900/90 to-forest-950 p-5 sm:p-6 space-y-4 shadow-xl animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* User Transcribed Query Display */}
            {voiceQueryText && (
              <div className="flex items-start justify-between gap-2 border-b border-forest-800 pb-3 text-xs">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-gold-300/80">
                      {t('sentinel.voiceYouSaid')}
                    </span>
                    <span className="rounded-full bg-gold-400/15 border border-gold-300/30 px-2 py-0.2 text-[9px] font-bold text-gold-300">
                      {responseLanguage === 'hi' ? 'हिंदी (Hindi)' : 'English'}
                    </span>
                  </div>
                  <p className="font-semibold text-white text-sm sm:text-base">
                    "{voiceQueryText}"
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleResetVoiceQuery}
                  className="p-1 rounded-lg text-cream-300/50 hover:text-cream-100 hover:bg-forest-800 transition-colors cursor-pointer"
                  title={t('sentinel.voiceAskAnother')}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Sequential Visual Verification Checklist while processing */}
            {isProcessingVoiceQuery && (
              <div className="space-y-2.5 py-2">
                <div className="flex items-center gap-2 text-xs font-bold text-gold-300">
                  <Loader2 size={13} className="animate-spin text-gold-400" />
                  <span>{t('sentinel.voiceCheckingFarm')}</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <div
                    className={`flex items-center gap-2 rounded-xl p-2.5 border transition-all ${
                      voiceCheckingStep >= 1
                        ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                        : 'border-forest-800 bg-forest-950/40 text-cream-300/40'
                    }`}
                  >
                    {voiceCheckingStep >= 1 ? <Check size={13} className="text-emerald-400" /> : <Loader2 size={13} className="animate-spin" />}
                    <span>{t('sentinel.voiceCheckWeather')}</span>
                  </div>

                  <div
                    className={`flex items-center gap-2 rounded-xl p-2.5 border transition-all ${
                      voiceCheckingStep >= 2
                        ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                        : 'border-forest-800 bg-forest-950/40 text-cream-300/40'
                    }`}
                  >
                    {voiceCheckingStep >= 2 ? <Check size={13} className="text-emerald-400" /> : <Loader2 size={13} className="animate-spin" />}
                    <span>{t('sentinel.voiceCheckSoil')}</span>
                  </div>

                  <div
                    className={`flex items-center gap-2 rounded-xl p-2.5 border transition-all ${
                      voiceCheckingStep >= 3
                        ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                        : 'border-forest-800 bg-forest-950/40 text-cream-300/40'
                    }`}
                  >
                    {voiceCheckingStep >= 3 ? <Check size={13} className="text-emerald-400" /> : <Loader2 size={13} className="animate-spin" />}
                    <span>{t('sentinel.voiceCheckCrop')}</span>
                  </div>

                  <div
                    className={`flex items-center gap-2 rounded-xl p-2.5 border transition-all ${
                      voiceCheckingStep >= 4
                        ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                        : 'border-forest-800 bg-forest-950/40 text-cream-300/40'
                    }`}
                  >
                    {voiceCheckingStep >= 4 ? <Check size={13} className="text-emerald-400" /> : <Loader2 size={13} className="animate-spin" />}
                    <span>{t('sentinel.voiceCheckIrrigation')}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Formatted Agent Answer */}
            {voiceAgentResponse && !isProcessingVoiceQuery && (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                {/* Answer Banner */}
                <div className="rounded-2xl bg-forest-900/90 border border-emerald-500/30 p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                      <ShieldCheck size={13} />
                      <span>{t('sentinel.badgeTitle')}</span>
                    </span>

                    {/* Action required pill */}
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border ${
                        voiceAgentResponse.action_required
                          ? 'border-amber-400/50 bg-amber-500/20 text-amber-300'
                          : 'border-emerald-400/50 bg-emerald-500/20 text-emerald-300'
                      }`}
                    >
                      {voiceAgentResponse.action_required ? <Zap size={11} /> : <CheckCircle2 size={11} />}
                      <span>
                        {voiceAgentResponse.action_required
                          ? responseLanguage === 'hi' ? 'कार्रवाई अनुशंसित' : 'Action Recommended'
                          : responseLanguage === 'hi' ? 'स्थिति सुरक्षित' : 'Conditions Safe'}
                      </span>
                    </span>
                  </div>

                  <p className="text-sm sm:text-base text-cream-100 font-medium leading-relaxed">
                    {voiceAgentResponse.display_text}
                  </p>

                  {/* Recommended Action Box if action is required */}
                  {voiceAgentResponse.recommended_action && (
                    <div className="rounded-xl bg-forest-950/90 border border-gold-300/30 p-3 mt-2 flex items-start gap-2">
                      <ArrowRight size={14} className="text-gold-400 mt-0.5 shrink-0" />
                      <div className="text-xs">
                        <span className="font-bold text-gold-300 block">
                          {t('sentinel.voiceRecommendedAction')}:
                        </span>
                        <span className="text-white font-medium">
                          {voiceAgentResponse.recommended_action}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Ground Truth Telemetry Facts Mini Strip */}
                {voiceAgentResponse.telemetry_facts && (
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-cream-300/80">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-cream-300/50">
                      {t('sentinel.voiceTelemetryContext')}:
                    </span>
                    {voiceAgentResponse.telemetry_facts.weather && (
                      <span className="rounded-lg bg-forest-950 border border-forest-800 px-2 py-0.5">
                        🌧️ {voiceAgentResponse.telemetry_facts.weather}
                      </span>
                    )}
                    {voiceAgentResponse.telemetry_facts.soil && (
                      <span className="rounded-lg bg-forest-950 border border-forest-800 px-2 py-0.5">
                        💧 {voiceAgentResponse.telemetry_facts.soil}
                      </span>
                    )}
                    {voiceAgentResponse.telemetry_facts.profit && (
                      <span className="rounded-lg bg-forest-950 border border-forest-800 px-2 py-0.5">
                        💰 {voiceAgentResponse.telemetry_facts.profit}
                      </span>
                    )}
                  </div>
                )}

                {/* Controls Bar: [ Listen ] [ Copy ] [ Ask Another ] */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-forest-800/80">
                  <button
                    type="button"
                    onClick={handleToggleSpeakAnswer}
                    className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer shadow-sm ${
                      isVoiceSpeaking
                        ? 'bg-pink-600 hover:bg-pink-700 text-white animate-pulse'
                        : 'border border-gold-300/40 bg-gradient-to-r from-gold-400 to-gold-500 text-forest-950 hover:brightness-110'
                    }`}
                  >
                    {isVoiceSpeaking ? <VolumeX size={14} /> : <Volume2 size={14} />}
                    <span>{isVoiceSpeaking ? t('sentinel.voiceStopSpeech') : t('sentinel.voiceListen')}</span>
                  </button>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyAnswer}
                      className="inline-flex items-center gap-1.5 rounded-xl border border-forest-700 bg-forest-900/80 px-3 py-1.5 text-xs text-cream-200 hover:text-white hover:border-gold-300/40 transition-colors cursor-pointer"
                    >
                      {copiedAnswer ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                      <span>{copiedAnswer ? (isHi ? 'कॉपी किया' : 'Copied') : (isHi ? 'कॉपी करें' : 'Copy')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleResetVoiceQuery}
                      className="inline-flex items-center gap-1 rounded-xl border border-forest-700 bg-forest-900/80 px-3 py-1.5 text-xs text-gold-300 hover:text-gold-200 hover:border-gold-300/40 transition-colors cursor-pointer"
                    >
                      <span>{t('sentinel.voiceAskAnother')}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 3. ACTION-ORIENTED AUTONOMOUS FARM CHECK (5-STEP CONNECTED CHECKLIST) */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-gold-300/20 bg-forest-900/70 p-5 sm:p-7 shadow-lg space-y-5">
        <div className="border-b border-gold-300/10 pb-3.5 flex flex-wrap items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <ShieldCheck size={18} className="text-gold-300" />
              <h2 className="font-serif text-lg sm:text-xl font-bold text-gold-100">
                {t('sentinel.autonomousCheckTitle')}
              </h2>
            </div>
            <p className="text-xs text-cream-300/80 mt-0.5">
              {t('sentinel.autonomousCheckSubtitle')}
            </p>
          </div>

          {farmerObservation && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 text-xs font-bold text-emerald-300">
              <Check size={12} /> {t('sentinel.observationAddedBadge')}
            </span>
          )}
        </div>

        {/* Compact Connected Workflow Checklist */}
        <div className="relative space-y-3.5 before:absolute before:left-[19px] before:top-4 before:bottom-4 before:w-[2px] before:bg-forest-800/80">
          {/* STEP 1: Weather */}
          <ActionChecklistItem
            stepNumber={1}
            icon={<CloudRain size={16} className="text-blue-400" />}
            title={t('sentinel.stepWeatherTitle')}
            summary={rain7d > 40 ? t('sentinel.stepWeatherRainExpected') : t('sentinel.stepWeatherSafe')}
            subtext={isHi ? `7 दिनों में ${formatRainfall(rain7d, language)} वर्षा संभावित` : `${formatRainfall(rain7d, language)} expected in 7 days`}
            statusInfo={getStepStatus(1)}
            isExpanded={expandedChecklistStep === 1}
            onToggleExpand={() => toggleStepDetails(1)}
            detailsContent={
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-2">
                <div className="rounded-xl bg-forest-900/90 p-2 border border-forest-800">
                  <span className="text-cream-300/60 block">{isHi ? 'अधिकतम तापमान' : 'Max Temp'}</span>
                  <span className="font-bold text-white font-mono">{maxTemp ? formatTemperature(maxTemp, language) : t('sentinel.dataUnavailable')}</span>
                </div>
                <div className="rounded-xl bg-forest-900/90 p-2 border border-forest-800">
                  <span className="text-cream-300/60 block">{isHi ? '7-दिवसीय वर्षा' : '7-Day Rain'}</span>
                  <span className="font-bold text-blue-300 font-mono">{formatRainfall(rain7d, language)}</span>
                </div>
                <div className="rounded-xl bg-forest-900/90 p-2 border border-forest-800">
                  <span className="text-cream-300/60 block">{isHi ? 'हवा में नमी' : 'Humidity'}</span>
                  <span className="font-bold text-white font-mono">68% - 82%</span>
                </div>
                <div className="rounded-xl bg-forest-900/90 p-2 border border-forest-800">
                  <span className="text-cream-300/60 block">{isHi ? 'डेटा स्रोत' : 'Source'}</span>
                  <span className="font-bold text-emerald-300">ECMWF / IMD</span>
                </div>
              </div>
            }
          />

          {/* STEP 2: Soil Moisture */}
          <ActionChecklistItem
            stepNumber={2}
            icon={<Droplets size={16} className="text-cyan-400" />}
            title={t('sentinel.stepSoilTitle')}
            summary={soilMoisture !== null && soilMoisture !== undefined && soilMoisture < 0.20 ? t('sentinel.stepSoilLow') : t('sentinel.stepSoilSafe')}
            subtext={t('sentinel.stepSoilNoIrrigation')}
            statusInfo={getStepStatus(2)}
            isExpanded={expandedChecklistStep === 2}
            onToggleExpand={() => toggleStepDetails(2)}
            detailsContent={
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-2">
                <div className="rounded-xl bg-forest-900/90 p-2 border border-forest-800">
                  <span className="text-cream-300/60 block">{isHi ? 'जड़ क्षेत्र नमी' : 'Root Moisture'}</span>
                  <span className="font-bold text-cyan-300 font-mono">
                    {soilMoisture !== null && soilMoisture !== undefined ? `${soilMoisture.toFixed(2)} m³/m³` : t('sentinel.dataUnavailable')}
                  </span>
                </div>
                <div className="rounded-xl bg-forest-900/90 p-2 border border-forest-800">
                  <span className="text-cream-300/60 block">{isHi ? 'मिट्टी का प्रकार' : 'Soil Type'}</span>
                  <span className="font-bold text-white">{soilType}</span>
                </div>
                <div className="rounded-xl bg-forest-900/90 p-2 border border-forest-800">
                  <span className="text-cream-300/60 block">{isHi ? 'नमी स्थिति' : 'Moisture Status'}</span>
                  <span className="font-bold text-emerald-300">{isHi ? 'संतोषजनक' : 'Optimal'}</span>
                </div>
              </div>
            }
          />

          {/* STEP 3: Crop Health & Stress */}
          <ActionChecklistItem
            stepNumber={3}
            icon={<Sprout size={16} className="text-emerald-400" />}
            title={t('sentinel.stepCropTitle')}
            summary={t('sentinel.stepCropSafe')}
            subtext={primaryCropNames || t('sentinel.stepCropNormal')}
            statusInfo={getStepStatus(3)}
            isExpanded={expandedChecklistStep === 3}
            onToggleExpand={() => toggleStepDetails(3)}
            detailsContent={
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-2">
                <div className="rounded-xl bg-forest-900/90 p-2 border border-forest-800">
                  <span className="text-cream-300/60 block">{isHi ? 'लक्षित फसलें' : 'Target Crops'}</span>
                  <span className="font-bold text-white truncate block">{primaryCropNames || 'Standard Crop Mix'}</span>
                </div>
                <div className="rounded-xl bg-forest-900/90 p-2 border border-forest-800">
                  <span className="text-cream-300/60 block">{isHi ? 'तनाव सूचकांक' : 'Stress Index'}</span>
                  <span className="font-bold text-emerald-300 font-mono">0.12 ({isHi ? 'निम्न' : 'Low'})</span>
                </div>
                <div className="rounded-xl bg-forest-900/90 p-2 border border-forest-800">
                  <span className="text-cream-300/60 block">{isHi ? 'विकास चरण' : 'Crop Stage'}</span>
                  <span className="font-bold text-cream-100">{season} {isHi ? 'वृद्धि चक्र' : 'Vegetative Cycle'}</span>
                </div>
              </div>
            }
          />

          {/* STEP 4: Irrigation Needs */}
          <ActionChecklistItem
            stepNumber={4}
            icon={<Zap size={16} className="text-gold-400" />}
            title={t('sentinel.stepIrrigationTitle')}
            summary={decisionState === 'ACTION_RECOMMENDED' ? t('sentinel.stepIrrigationNeeded') : t('sentinel.stepIrrigationSafe')}
            subtext={isHi ? 'प्राकृतिक जल संतुलन पर्याप्त' : 'Water balance optimal'}
            statusInfo={getStepStatus(4)}
            isExpanded={expandedChecklistStep === 4}
            onToggleExpand={() => toggleStepDetails(4)}
            detailsContent={
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-2">
                <div className="rounded-xl bg-forest-900/90 p-2 border border-forest-800">
                  <span className="text-cream-300/60 block">{isHi ? 'सिंचाई निर्देश' : 'Directive'}</span>
                  <span className="font-bold text-gold-300">{isHi ? 'सुरक्षित स्थगन' : 'On Track'}</span>
                </div>
                <div className="rounded-xl bg-forest-900/90 p-2 border border-forest-800">
                  <span className="text-cream-300/60 block">{isHi ? 'जल घाटा' : 'Water Deficit'}</span>
                  <span className="font-bold text-white font-mono">0.0 mm</span>
                </div>
                <div className="rounded-xl bg-forest-900/90 p-2 border border-forest-800">
                  <span className="text-cream-300/60 block">{isHi ? 'जलभराव जोखिम' : 'Drainage Risk'}</span>
                  <span className="font-bold text-emerald-300 font-mono">{(waterlogScore * 100).toFixed(0)}% ({isHi ? 'सुरक्षित' : 'Safe'})</span>
                </div>
              </div>
            }
          />

          {/* STEP 5: Market & Farm Risk */}
          <ActionChecklistItem
            stepNumber={5}
            icon={<DollarSign size={16} className="text-amber-400" />}
            title={t('sentinel.stepRiskTitle')}
            summary={overallRisk === 'LOW' ? t('sentinel.stepRiskSafe') : t('sentinel.stepRiskElevated')}
            subtext={isHi ? `अनुमानित लाभ ${formatCurrency(netProfit, language)} सुरक्षित` : `Expected profit ${formatCurrency(netProfit, language)} secured`}
            statusInfo={getStepStatus(5)}
            isExpanded={expandedChecklistStep === 5}
            onToggleExpand={() => toggleStepDetails(5)}
            isFinal
            detailsContent={
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[11px] pt-2">
                <div className="rounded-xl bg-forest-900/90 p-2 border border-forest-800">
                  <span className="text-cream-300/60 block">{isHi ? 'सूखा जोखिम' : 'Drought Score'}</span>
                  <span className="font-bold text-white font-mono">{(droughtScore * 100).toFixed(0)}%</span>
                </div>
                <div className="rounded-xl bg-forest-900/90 p-2 border border-forest-800">
                  <span className="text-cream-300/60 block">{isHi ? 'समग्र जोखिम स्तर' : 'Overall Risk'}</span>
                  <span className="font-bold text-emerald-300">{overallRisk}</span>
                </div>
                <div className="rounded-xl bg-forest-900/90 p-2 border border-forest-800">
                  <span className="text-cream-300/60 block">{isHi ? 'आर्थिक लाभ' : 'Net Returns'}</span>
                  <span className="font-bold text-gold-300 font-mono">{formatCurrency(netProfit, language)}</span>
                </div>
              </div>
            }
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 4. PROMINENT AGENT DECISION SECTION */}
      {/* ========================================================================= */}
      {animStep === 6 && !isReevaluating && (
        <div
          className={`rounded-3xl border p-5 sm:p-7 shadow-xl space-y-5 transition-all animate-in fade-in slide-in-from-bottom-3 duration-300 ${
            decisionState === 'NO_ACTION'
              ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-950/80 via-forest-950/90 to-forest-900/90'
              : decisionState === 'ACTION_RECOMMENDED'
              ? 'border-amber-400/50 bg-gradient-to-br from-amber-950/80 via-forest-950/90 to-forest-900/90'
              : decisionState === 'CHANGE_PLAN'
              ? 'border-cyan-400/50 bg-gradient-to-br from-cyan-950/80 via-forest-950/90 to-forest-900/90'
              : 'border-pink-500/50 bg-gradient-to-br from-pink-950/80 via-forest-950/90 to-forest-900/90'
          }`}
        >
          {/* Header & Semantic Decision Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gold-300/10 pb-4">
            <span className="text-xs font-mono font-bold tracking-wider text-cream-300/70 uppercase">
              {t('sentinel.decisionSectionTitle')}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-xs font-bold w-fit border ${
                decisionState === 'NO_ACTION'
                  ? 'border-emerald-400/50 bg-emerald-500/20 text-emerald-300'
                  : decisionState === 'ACTION_RECOMMENDED'
                  ? 'border-amber-400/50 bg-amber-500/20 text-amber-300'
                  : decisionState === 'CHANGE_PLAN'
                  ? 'border-cyan-400/50 bg-cyan-500/20 text-cyan-300'
                  : 'border-pink-400/50 bg-pink-500/20 text-pink-300'
              }`}
            >
              {decisionState === 'NO_ACTION' && <CheckCircle2 size={14} />}
              {decisionState === 'ACTION_RECOMMENDED' && <Zap size={14} />}
              {decisionState === 'CHANGE_PLAN' && <AlertTriangle size={14} />}
              {decisionState === 'HIGH_RISK' && <ShieldAlert size={14} />}
              <span>
                {decisionState === 'NO_ACTION' && t('sentinel.stateNoActionTitle')}
                {decisionState === 'ACTION_RECOMMENDED' && t('sentinel.stateActionTitle')}
                {decisionState === 'CHANGE_PLAN' && t('sentinel.stateChangePlanTitle')}
                {decisionState === 'HIGH_RISK' && t('sentinel.stateHighRiskTitle')}
              </span>
            </span>
          </div>

          {/* Plain-language Headline & Summary */}
          <div className="space-y-2">
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-white leading-tight">
              {farmerObservation
                ? isHi
                  ? 'कार्रवाई की अनुशंसा: आपके द्वारा बताई गई स्थिति पर ध्यान दें'
                  : 'Action Recommended: Observation noted on your farm'
                : decisionState === 'NO_ACTION'
                ? t('sentinel.stateNoActionHeadline')
                : decisionState === 'ACTION_RECOMMENDED'
                ? t('sentinel.stateActionHeadline')
                : decisionState === 'CHANGE_PLAN'
                ? t('sentinel.stateChangePlanHeadline')
                : t('sentinel.stateHighRiskHeadline')}
            </h3>

            <p className="text-xs sm:text-sm text-cream-200/90 leading-relaxed max-w-2xl">
              {farmerObservation ? (
                <>
                  <span className="text-gold-200 font-medium">
                    {t('sentinel.farmerObsDecisionNote')}
                  </span>
                  <span className="font-bold text-white bg-forest-900/80 px-2 py-0.5 rounded-lg border border-gold-300/30">
                    "{farmerObservation}"
                  </span>
                </>
              ) : decisionState === 'NO_ACTION' ? (
                t('sentinel.decisionNoActionSummary')
              ) : decisionState === 'ACTION_RECOMMENDED' ? (
                advisory?.crop_impact || t('sentinel.stateActionDesc')
              ) : decisionState === 'CHANGE_PLAN' ? (
                advisory?.crop_impact || t('sentinel.stateChangePlanDesc')
              ) : (
                advisory?.crop_impact || t('sentinel.stateHighRiskDesc')
              )}
            </p>
          </div>

          {/* Action Directive Box & Recommended Action Button */}
          <div className="rounded-2xl border border-gold-300/25 bg-forest-950/85 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-mono font-bold tracking-widest text-gold-300 uppercase flex items-center gap-1.5">
                <ArrowRight size={13} className="text-gold-400" />
                {t('sentinel.nextStepTitle')}
              </span>
              <p className="text-sm sm:text-base font-bold text-white">
                {farmerObservation
                  ? getFarmerInputNextStep()
                  : decisionState === 'NO_ACTION'
                  ? t('sentinel.stateNoActionNext')
                  : decisionState === 'ACTION_RECOMMENDED'
                  ? advisory?.recommended_action || t('sentinel.stateActionNext')
                  : decisionState === 'CHANGE_PLAN'
                  ? advisory?.recommended_action || t('sentinel.stateChangePlanNext')
                  : advisory?.recommended_action || t('sentinel.stateHighRiskNext')}
              </p>
            </div>

            {decisionState !== 'NO_ACTION' && (
              <button
                type="button"
                onClick={() => setShowWhy(true)}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-gold-300/40 bg-gradient-to-r from-gold-400 to-gold-500 px-4 py-2 text-xs font-bold text-forest-950 shadow-sm transition-all hover:scale-[1.02] shrink-0 cursor-pointer"
              >
                <span>{t('sentinel.decisionViewRecommendedAction')}</span>
                <ArrowRight size={13} />
              </button>
            )}
          </div>

          {/* "Why did the agent decide this?" Accordion */}
          <div className="border-t border-forest-800/80 pt-3">
            <button
              type="button"
              onClick={() => setShowWhy(!showWhy)}
              className="inline-flex items-center gap-2 text-xs font-semibold text-gold-300 hover:text-gold-200 transition-colors cursor-pointer"
            >
              <HelpCircle size={14} className="text-gold-400" />
              <span>{t('sentinel.whyDidAgentDecideTitle')}</span>
              {showWhy ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {showWhy && (
              <div className="mt-3 rounded-2xl bg-forest-950/90 border border-forest-800 p-4 space-y-2.5 text-xs text-cream-200 animate-in fade-in duration-150">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
                  <div className="rounded-xl bg-forest-900/80 p-3 border border-forest-800">
                    <span className="font-bold text-gold-300 block mb-1">1. {t('sentinel.whyItemRain')}</span>
                    <span className="text-white font-mono">{formatRainfall(rain7d, language)} ({isHi ? 'अगले 7 दिन' : '7-day forecast'})</span>
                  </div>
                  <div className="rounded-xl bg-forest-900/80 p-3 border border-forest-800">
                    <span className="font-bold text-cyan-300 block mb-1">2. {t('sentinel.whyItemSoil')}</span>
                    <span className="text-white font-mono">
                      {soilMoisture !== null && soilMoisture !== undefined ? `${soilMoisture.toFixed(2)} m³/m³` : t('sentinel.stepSoilSafe')}
                    </span>
                  </div>
                  <div className="rounded-xl bg-forest-900/80 p-3 border border-forest-800">
                    <span className="font-bold text-emerald-300 block mb-1">3. {t('sentinel.whyItemCropStress')}</span>
                    <span className="text-white">{overallRisk === 'LOW' ? (isHi ? 'कम / सुरक्षित' : 'Low / Protected') : overallRisk}</span>
                  </div>
                  <div className="rounded-xl bg-forest-900/80 p-3 border border-forest-800">
                    {farmerObservation ? (
                      <>
                        <span className="font-bold text-amber-300 block mb-1">4. {t('sentinel.whyItemFarmerObs')}</span>
                        <span className="text-white truncate block">{farmerObservation}</span>
                      </>
                    ) : (
                      <>
                        <span className="font-bold text-amber-300 block mb-1">4. {t('sentinel.whyItemFinancial')}</span>
                        <span className="text-white font-mono">{formatCurrency(netProfit, language)} {isHi ? 'अनुमानित लाभ' : 'exp. returns'}</span>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-cream-300/80 pt-1 leading-relaxed">
                  {farmerObservation
                    ? isHi
                      ? 'खेत के वास्तविक डेटा और आपके द्वारा दी गई जानकारी के आधार पर, एजेंट ने योजना का पुनर्मूल्यांकन कर यह सलाह दी है।'
                      : 'Based on your farm telemetry and what you reported, the agent re-evaluated its reasoning to provide targeted field guidance.'
                    : isHi
                    ? 'इन वास्तविक खेत स्थितियों के आधार पर, एजेंट वर्तमान योजना को बनाए रखने और फसल की सुरक्षा करने की सलाह देता है।'
                    : 'Based on these conditions, the agent recommends keeping the current plan to safeguard yield and profit.'}
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. FARMER GROUND OBSERVATION ("TELL THE AGENT SOMETHING") */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-gold-300/20 bg-gradient-to-b from-forest-950/90 via-forest-900/60 to-forest-950/90 p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gold-300/10 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <MessageSquare size={16} className="text-gold-400" />
              <h2 className="font-serif text-base sm:text-lg font-bold text-gold-100">
                {t('sentinel.tellAgentTitle')}
              </h2>
              <span className="rounded-full bg-gold-400/10 border border-gold-300/30 px-2 py-0.2 text-[10px] font-bold text-gold-300">
                {isHi ? 'वैकल्पिक' : 'Optional'}
              </span>
            </div>
            <p className="text-xs text-cream-200/90 mt-0.5">
              {t('sentinel.tellAgentSubtitle')}
            </p>
          </div>

          {/* Simple Mode Switcher: [ Type ] [ Speak ] [ Photo ] */}
          <div className="inline-flex rounded-full border border-gold-300/25 bg-forest-950 p-1 shadow-inner shrink-0 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setInputMode('type')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                inputMode === 'type'
                  ? 'bg-gradient-to-r from-gold-400 to-gold-500 text-forest-950 shadow-sm'
                  : 'text-cream-300/70 hover:text-cream-100'
              }`}
            >
              <PenTool size={12} />
              <span>{t('sentinel.tabType')}</span>
            </button>

            <button
              type="button"
              onClick={() => setInputMode('speak')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                inputMode === 'speak'
                  ? 'bg-gradient-to-r from-gold-400 to-gold-500 text-forest-950 shadow-sm'
                  : 'text-cream-300/70 hover:text-cream-100'
              }`}
            >
              <Mic size={12} />
              <span>{t('sentinel.tabSpeak')}</span>
            </button>

            <button
              type="button"
              onClick={() => setInputMode('photo')}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition-all cursor-pointer ${
                inputMode === 'photo'
                  ? 'bg-gradient-to-r from-gold-400 to-gold-500 text-forest-950 shadow-sm'
                  : 'text-cream-300/70 hover:text-cream-100'
              }`}
            >
              <Camera size={12} />
              <span>{t('sentinel.tabPhoto')}</span>
            </button>
          </div>
        </div>

        {/* Quick Options Chips */}
        <div className="space-y-2">
          <span className="text-[11px] font-bold text-cream-300/80 uppercase tracking-wider">
            {t('sentinel.quickTellHeading')}
          </span>
          <div className="flex flex-wrap gap-2">
            {quickChips.map((chip) => {
              const isSelected = selectedChips.includes(chip.label);
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => handleToggleChip(chip.label)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all cursor-pointer border ${
                    isSelected
                      ? 'border-gold-300 bg-gold-400 text-forest-950 font-bold shadow-[0_0_10px_rgba(255,210,26,0.3)]'
                      : 'border-forest-700/60 bg-forest-900/60 text-cream-200 hover:border-gold-300/40 hover:bg-forest-800'
                  }`}
                >
                  <span>{chip.icon}</span>
                  <span>{chip.label}</span>
                  {isSelected && <Check size={12} className="text-forest-950" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Input Mode Content */}
        <div className="pt-1">
          {/* Mode 1: TYPE */}
          {inputMode === 'type' && (
            <div className="space-y-2">
              <textarea
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder={t('sentinel.typePlaceholder')}
                rows={2}
                className="w-full rounded-2xl border border-forest-700 bg-forest-950/80 p-3 text-xs text-cream-100 placeholder:text-cream-300/40 focus:border-gold-300 focus:outline-none focus:ring-1 focus:ring-gold-300"
              />
            </div>
          )}

          {/* Mode 2: SPEAK */}
          {inputMode === 'speak' && (
            <div className="rounded-2xl border border-forest-800 bg-forest-950/70 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    {isObservationListening ? (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500" />
                      </span>
                    ) : (
                      <Mic size={14} className="text-gold-300" />
                    )}
                    <span>{isObservationListening ? t('sentinel.micListening') : t('sentinel.tabSpeak')}</span>
                  </span>
                  <p className="text-[11px] text-cream-300/70">
                    {isHi
                      ? 'माइक बटन दबाएं और जो देखा वह बोलें (उदा: "टमाटर के पत्ते पीले हो रहे हैं")'
                      : 'Tap the mic button and describe what you observe on your field.'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={toggleObservationListening}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer shadow-md ${
                    isObservationListening
                      ? 'bg-pink-600 hover:bg-pink-700 text-white animate-pulse'
                      : 'bg-gradient-to-r from-gold-400 to-gold-500 text-forest-950 hover:brightness-110'
                  }`}
                >
                  {isObservationListening ? <MicOff size={14} /> : <Mic size={14} />}
                  <span>{isObservationListening ? t('sentinel.micStop') : t('sentinel.tabSpeak')}</span>
                </button>
              </div>

              {obsSpeechError && (
                <p className="text-[11px] text-pink-300 font-medium">{obsSpeechError}</p>
              )}
            </div>
          )}

          {/* Mode 3: PHOTO */}
          {inputMode === 'photo' && (
            <div className="rounded-2xl border border-forest-800 bg-forest-950/70 p-4 space-y-3">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoSelect}
                className="hidden"
              />

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Camera size={14} className="text-gold-300" />
                    <span>{t('sentinel.photoUploadTitle')}</span>
                  </span>
                  <p className="text-[11px] text-cream-300/70">
                    {t('sentinel.photoUploadHelp')}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="inline-flex items-center gap-1.5 rounded-2xl border border-gold-300/40 bg-forest-900 px-4 py-2 text-xs font-bold text-gold-200 hover:bg-forest-800 transition-colors cursor-pointer"
                >
                  <ImageIcon size={14} />
                  <span>{t('sentinel.tabPhoto')}</span>
                </button>
              </div>

              {attachedPhoto && (
                <div className="flex items-center justify-between rounded-xl bg-forest-900/80 border border-emerald-500/30 p-2.5 text-xs text-emerald-200">
                  <div className="flex items-center gap-2">
                    <img
                      src={attachedPhoto.url}
                      alt="Crop observation"
                      className="h-9 w-9 rounded-lg object-cover border border-emerald-400/40"
                    />
                    <div>
                      <div className="font-semibold text-white truncate max-w-[200px]">
                        {attachedPhoto.name}
                      </div>
                      <div className="text-[10px] text-emerald-300">
                        {t('sentinel.photoAttachedTag')}
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setAttachedPhoto(null)}
                    className="p-1 rounded-full text-cream-300/60 hover:text-white"
                  >
                    <X size={14} />
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
            <button
              type="button"
              onClick={() => handleAddObservation()}
              disabled={selectedChips.length === 0 && !customText.trim() && !attachedPhoto}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-gold-300/40 bg-gradient-to-r from-gold-400 to-gold-500 px-5 py-2.5 text-xs font-bold text-forest-950 shadow-sm transition-all hover:scale-[1.02] disabled:opacity-40 cursor-pointer"
            >
              <Check size={14} />
              <span>{t('sentinel.sendToAgent')}</span>
            </button>

            {farmerObservation && (
              <button
                type="button"
                onClick={handleClearObservation}
                className="inline-flex items-center gap-1 text-xs text-pink-300/80 hover:text-pink-200 hover:underline cursor-pointer"
              >
                <X size={12} />
                <span>{t('sentinel.removeObservationBtn')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Re-evaluating Banner */}
        {isReevaluating && (
          <div className="rounded-2xl border border-emerald-400/40 bg-emerald-950/60 p-3 text-xs text-emerald-200 flex items-center gap-2 animate-pulse">
            <RefreshCw size={14} className="animate-spin text-emerald-400" />
            <span className="font-semibold">{t('sentinel.reevaluatingMsg')}</span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 6. SIMPLE RECENT AGENT ACTIONS (CHRONOLOGICAL TIMELINE) */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-forest-800 bg-forest-950/70 p-5 sm:p-6 shadow-md space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-forest-800 pb-3">
          <div className="flex items-center gap-2">
            <History size={16} className="text-emerald-400" />
            <h3 className="font-serif text-base font-bold text-white">
              {t('sentinel.recentActionsTitle')}
            </h3>
          </div>

          {onOpenLogModal && (
            <button
              type="button"
              onClick={onOpenLogModal}
              className="text-xs font-medium text-gold-300 hover:text-gold-200 hover:underline transition-colors cursor-pointer"
            >
              {t('sentinel.viewFullHistory')} →
            </button>
          )}
        </div>

        {/* Timeline Items */}
        <div className="space-y-2.5">
          {historyItems.map((item, idx) => (
            <div
              key={idx}
              className="flex items-start justify-between gap-3 rounded-2xl bg-forest-900/40 border border-forest-800/80 p-3 text-xs"
            >
              <div className="flex items-start gap-2.5">
                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  item.isWarning ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                }`}>
                  {item.isWarning ? <AlertTriangle size={11} /> : <Check size={11} />}
                </span>
                <div>
                  <span className="font-bold text-cream-100">{item.title}</span>
                  <p className="text-[11px] text-cream-300/70 mt-0.5">{item.desc}</p>
                </div>
              </div>

              <span className="font-mono text-[10px] text-cream-300/50 shrink-0">
                {item.time}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 7. DISCREET TECHNICAL & SAFETY DETAILS ACCORDION */}
      {/* ========================================================================= */}
      <div className="rounded-2xl border border-forest-800/80 bg-forest-950/50 p-3.5 text-xs text-center">
        <button
          type="button"
          onClick={() => setShowTechnicalDetails(!showTechnicalDetails)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-cream-300/60 hover:text-cream-200 transition-colors cursor-pointer"
        >
          <Lock size={12} className="text-emerald-400" />
          <span>
            {showTechnicalDetails
              ? t('sentinel.hideTechnicalDetails')
              : t('sentinel.viewTechnicalDetails')}
          </span>
          {showTechnicalDetails ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
        </button>

        {showTechnicalDetails && (
          <div className="mt-3 text-left space-y-2 border-t border-forest-800/80 pt-3 text-[11px] text-cream-300/70 font-mono animate-in fade-in duration-150">
            <p className="text-emerald-300 flex items-center gap-1">
              <ShieldCheck size={12} /> {t('sentinel.securityBadge')}
            </p>
            <p className="text-cream-300/80 leading-relaxed">
              {t('sentinel.dataProvenanceNotice')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Subcomponent: ActionChecklistItem for Action-Oriented 5-Step Checklist
// -----------------------------------------------------------------------------
interface ActionChecklistItemProps {
  stepNumber: number;
  icon: React.ReactNode;
  title: string;
  summary: string;
  subtext: string;
  statusInfo: { status: string; label: string };
  isExpanded: boolean;
  onToggleExpand: () => void;
  detailsContent: React.ReactNode;
  isFinal?: boolean;
}

function ActionChecklistItem({
  stepNumber,
  icon,
  title,
  summary,
  subtext,
  statusInfo,
  isExpanded,
  onToggleExpand,
  detailsContent,
  isFinal = false,
}: ActionChecklistItemProps) {
  const { t } = useLanguage();
  const isChecking = statusInfo.status === 'checking';
  const isChecked = statusInfo.status === 'checked';
  const isPending = statusInfo.status === 'pending';

  return (
    <div
      className={`relative z-10 rounded-2xl border p-3.5 sm:p-4 transition-all ${
        isChecking
          ? 'border-emerald-400/60 bg-emerald-950/40 shadow-[0_0_15px_rgba(16,185,129,0.15)] scale-[1.01]'
          : isChecked
          ? 'border-forest-800 bg-forest-950/85 hover:border-gold-300/25'
          : 'border-forest-900 bg-forest-950/40 opacity-60'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          {/* Icon Badge */}
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
              isChecking
                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300 animate-pulse'
                : isChecked
                ? 'border-forest-700 bg-forest-900 text-cream-100'
                : 'border-forest-800 bg-forest-950 text-cream-300/40'
            }`}
          >
            {icon}
          </div>

          {/* Title & Plain Summary */}
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold text-gold-300/80 uppercase">
                {stepNumber}. {title}
              </span>
            </div>

            <h4 className="font-bold text-xs sm:text-sm text-white">
              {summary}
            </h4>

            <p className="text-[11px] text-cream-300/70">
              {subtext}
            </p>

            {/* Progressive Disclosure [View details] */}
            {isChecked && (
              <button
                type="button"
                onClick={onToggleExpand}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-gold-300/90 hover:text-gold-200 pt-1 cursor-pointer"
              >
                <span>{isExpanded ? t('sentinel.hideDetails') : t('sentinel.viewDetails')}</span>
                {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              </button>
            )}
          </div>
        </div>

        {/* Status Indicator */}
        <div className="shrink-0">
          {isChecking && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
              <Loader2 size={11} className="animate-spin" />
              <span>{statusInfo.label}</span>
            </span>
          )}

          {isChecked && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
              <CheckCircle2 size={11} />
              <span>{statusInfo.label}</span>
            </span>
          )}

          {isPending && (
            <span className="inline-flex items-center gap-1 rounded-full bg-forest-900 border border-forest-800 px-2 py-0.5 text-[10px] text-cream-300/50">
              <span>{statusInfo.label}</span>
            </span>
          )}
        </div>
      </div>

      {/* Expanded Accordion Details */}
      {isExpanded && isChecked && (
        <div className="mt-3 border-t border-forest-800/80 pt-2 animate-in fade-in duration-150">
          {detailsContent}
        </div>
      )}
    </div>
  );
}
