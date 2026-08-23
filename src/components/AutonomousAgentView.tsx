import React, { useState, useEffect, useRef } from 'react';
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
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { formatCurrency, formatRainfall, formatTemperature } from '@/i18n/formatters';
import { getCropDisplayName } from '@/i18n/cropNames';
import { getStateDisplayName, getDistrictDisplayName } from '@/i18n/geoNames';
import type { FarmDecisionResponse } from '@/types/farm';
import type { AutonomousCycleLog, ProactiveAdvisory } from '@/types/autonomous';

interface AutonomousAgentViewProps {
  decision: FarmDecisionResponse;
  logs: AutonomousCycleLog[];
  advisory: ProactiveAdvisory | null;
  isChecking: boolean;
  onRunCheck: () => void;
}

type DecisionStateType = 'NO_ACTION' | 'ACTION_RECOMMENDED' | 'CHANGE_PLAN' | 'HIGH_RISK';
type InputMode = 'type' | 'speak' | 'photo';

export function AutonomousAgentView({
  decision,
  logs,
  advisory,
  isChecking,
  onRunCheck,
}: AutonomousAgentViewProps) {
  const { t, language } = useLanguage();
  const isHi = language === 'hi';

  // Animation Step state: 0 = Idle / All Checked, 1..5 = Actively checking step, 6 = Completed
  const [animStep, setAnimStep] = useState<number>(6);
  const [showWhy, setShowWhy] = useState<boolean>(false);
  const [showTechnicalDetails, setShowTechnicalDetails] = useState<boolean>(false);

  // Farmer Input State (100% Optional)
  const [inputMode, setInputMode] = useState<InputMode>('type');
  const [customText, setCustomText] = useState<string>('');
  const [selectedChips, setSelectedChips] = useState<string[]>([]);
  const [attachedPhoto, setAttachedPhoto] = useState<{ name: string; url: string } | null>(null);
  const [farmerObservation, setFarmerObservation] = useState<string | null>(null);
  const [isReevaluating, setIsReevaluating] = useState<boolean>(false);

  // Voice recording state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Farm telemetry parameters
  const districtName = decision.location?.district_name || 'Bhopal';
  const stateName = decision.location?.state_name || 'Madhya Pradesh';
  const soilType = decision.location?.soil_type || 'Medium Black';
  const season = decision.location?.season || 'Kharif';
  const landAcres = decision.farm_totals?.total_allocated_acres || decision.request?.land_size_acres || 5;
  const netProfit = decision.farm_totals?.total_net_profit_inr || 0;

  const soilMoisture = decision.weather?.root_zone_soil_moisture_m3m3;
  const rain7d = decision.weather?.forecast_rain_7d_total_mm ?? 0;
  const maxTemp = decision.weather?.forecast_temp_max_c;
  const droughtScore = decision.risk?.drought_risk_score ?? 0;
  const waterlogScore = decision.risk?.waterlogging_risk_score ?? 0;
  const overallRisk = decision.risk?.overall_risk_label || 'LOW';

  const primaryCrops = decision.allocated_crops || [];
  const primaryCropNames = primaryCrops.map((c) => getCropDisplayName(c.crop_name, language)).join(', ');

  // Quick Select Chips Definition
  const quickChips = [
    { id: 'crop_diff', label: t('sentinel.chipCropDifferent'), icon: '🌱', tag: isHi ? 'फसल में परिवर्तन' : 'Crop discoloration / difference' },
    { id: 'water_prob', label: t('sentinel.chipWaterProblem'), icon: '💧', tag: isHi ? 'पानी की समस्या' : 'Water / moisture issue' },
    { id: 'pest', label: t('sentinel.chipPestNoticed'), icon: '🐛', tag: isHi ? 'कीट देखे गए' : 'Pest infestation noticed' },
    { id: 'heavy_rain', label: t('sentinel.chipHeavyRain'), icon: '🌧', tag: isHi ? 'असामान्य भारी वर्षा' : 'Unexpected heavy rain' },
    { id: 'heat', label: t('sentinel.chipUnusualHeat'), icon: '🌡', tag: isHi ? 'अत्यधिक गर्मी' : 'Unusual heat stress' },
    { id: 'equipment', label: t('sentinel.chipEquipmentProblem'), icon: '🛠', tag: isHi ? 'उपकरण में खराबी' : 'Irrigation / equipment issue' },
  ];

  // Dynamic Decision State
  const decisionState: DecisionStateType = (() => {
    if (farmerObservation) {
      return 'ACTION_RECOMMENDED';
    }
    if (advisory?.stress_type === 'HEAT_DROUGHT' || droughtScore > 0.65) {
      return 'HIGH_RISK';
    }
    if (advisory?.stress_type === 'WATERLOG_SATURATION' || (rain7d > 60 && waterlogScore > 0.4)) {
      return 'CHANGE_PLAN';
    }
    if (advisory !== null && advisory !== undefined) {
      return 'ACTION_RECOMMENDED';
    }
    return 'NO_ACTION';
  })();

  // Handle Sequential Animation Trigger
  const handleTriggerCheck = () => {
    onRunCheck();
    setAnimStep(1);
  };

  useEffect(() => {
    if (animStep >= 1 && animStep < 5) {
      const timer = setTimeout(() => {
        setAnimStep((prev) => prev + 1);
      }, 300);
      return () => clearTimeout(timer);
    } else if (animStep === 5) {
      const timer = setTimeout(() => {
        setAnimStep(6);
      }, 320);
      return () => clearTimeout(timer);
    }
  }, [animStep]);

  // Handle Speech Recognition
  const toggleListening = () => {
    setSpeechError(null);

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError(t('sentinel.micErrorNotice'));
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = isHi ? 'hi-IN' : 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
        setSpeechError(null);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setCustomText(transcript);
          // Auto add to farm check
          handleAddObservation(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError(t('sentinel.micErrorNotice'));
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setIsListening(false);
      setSpeechError(t('sentinel.micErrorNotice'));
    }
  };

  // Toggle quick select chips
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
    }, 750);
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
    }, 500);
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

  // Dynamic step result texts
  const weatherResult = isHi
    ? `अगले 7 दिनों में ${formatRainfall(rain7d, language)} वर्षा संभावित। अधिकतम तापमान: ${maxTemp ? formatTemperature(maxTemp, language) : 'सामान्य'}`
    : `${formatRainfall(rain7d, language)} rain expected in next 7 days. Max temp: ${maxTemp ? formatTemperature(maxTemp, language) : 'normal'}`;

  const soilResult = isHi
    ? soilMoisture !== null && soilMoisture !== undefined
      ? `मृदा नमी ${soilMoisture.toFixed(2)} m³/m³ (${soilType} मिट्टी के लिए उपयुक्त)`
      : 'मृदा नमी संतोषजनक स्थिति में है।'
    : soilMoisture !== null && soilMoisture !== undefined
      ? `Soil moisture is ${soilMoisture.toFixed(2)} m³/m³ (adequate for ${soilType} soil)`
      : 'Soil moisture is in adequate condition.';

  const cropResult = isHi
    ? primaryCropNames
      ? `${primaryCropNames} पर कोई असामान्य तनाव नहीं पाया गया।`
      : 'फसलों की स्थिति सामान्य है।'
    : primaryCropNames
      ? `No abnormal stress detected on ${primaryCropNames}.`
      : 'Crop conditions remain normal.';

  const riskResult = isHi
    ? `वर्तमान फसल योजना आर्थिक रूप से उपयुक्त है (अनुमानित लाभ ${formatCurrency(netProfit, language)})`
    : `Current crop plan remains financially suitable (Expected profit ${formatCurrency(netProfit, language)})`;

  const decisionStepResult = isHi
    ? decisionState === 'NO_ACTION'
      ? 'वर्तमान फसल योजना को जारी रखना सर्वोत्तम है।'
      : 'खेत की स्थिति के अनुसार सलाह तैयार।'
    : decisionState === 'NO_ACTION'
      ? 'Current farm plan remains optimal.'
      : 'Action directive prepared for farm.';

  // Context-aware Next Step when farmer reports something
  const getFarmerInputNextStep = () => {
    const obsLower = (farmerObservation || '').toLowerCase();
    if (obsLower.includes('pest') || obsLower.includes('कीट')) {
      return isHi
        ? 'कीट प्रभावित पौधों की पत्तियों के नीचे जाँच करें और जैविक नीम छिड़काव की योजना बनाएं।'
        : 'Inspect the underside of leaves for pest clusters and plan targeted neem/organic treatment.';
    }
    if (obsLower.includes('water') || obsLower.includes('पानी') || obsLower.includes('dry')) {
      return isHi
        ? 'सिंचाई लाइनों की जाँच करें और प्रभावित क्षेत्रों में हल्की नमी पहुंचाएं।'
        : 'Inspect irrigation channels/drip emitters and deliver targeted moisture to affected roots.';
    }
    if (obsLower.includes('rain') || obsLower.includes('बारिश')) {
      return isHi
        ? 'खेत में जलभराव रोकने के लिए जल निकासी नालियों को तुरंत साफ रखें।'
        : 'Clear field drainage channels to avoid root asphyxiation from standing water.';
    }
    if (obsLower.includes('heat') || obsLower.includes('गर्मी')) {
      return isHi
        ? 'फसल को लू से बचाने के लिए शाम के समय हल्की स्पिंकलर/ड्रिप सिंचाई दें।'
        : 'Deliver evening pulse irrigation to cool canopy temperature and relieve heat stress.';
    }
    return t('sentinel.farmerObsInspectAction');
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6 animate-in fade-in duration-200">
      {/* ========================================================================= */}
      {/* 1. COMPACT AGENT HEADER */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/70 via-forest-950/90 to-forest-900/80 p-5 sm:p-6 shadow-xl backdrop-blur-md">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="text-xs font-mono font-bold tracking-wider text-emerald-300 uppercase">
                {t('sentinel.sentinelHeaderTitle')}
              </span>
              <span className="rounded-full bg-emerald-500/20 border border-emerald-400/40 px-2 py-0.2 text-[10px] font-bold text-emerald-300">
                {t('sentinel.sentinelActive')}
              </span>
            </div>

            <h1 className="font-serif text-xl sm:text-2xl font-bold text-white tracking-tight">
              {t('sentinel.sentinelHeaderSubtitle')}
            </h1>

            <p className="text-xs text-cream-200/85">
              {t('sentinel.sentinelHeaderDesc')}
            </p>

            {/* Essential farm context only */}
            <div className="flex flex-wrap items-center gap-2 pt-1 text-xs text-cream-300/80">
              <span className="inline-flex items-center gap-1 rounded-full bg-forest-900/90 border border-gold-300/20 px-3 py-1 font-medium text-gold-200">
                <Compass size={12} className="text-gold-300" />
                {getDistrictDisplayName(districtName, language)}, {getStateDisplayName(stateName, language)}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-forest-900/90 border border-forest-700/50 px-3 py-1 font-medium text-cream-200">
                {landAcres} {t('overview.acres')}
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-forest-900/90 border border-forest-700/50 px-3 py-1 font-medium text-cream-200">
                {season} {t('config.season')}
              </span>
            </div>
          </div>

          {/* Primary Action Button */}
          <div className="shrink-0 pt-1 sm:pt-0">
            <button
              type="button"
              onClick={handleTriggerCheck}
              disabled={isChecking || (animStep >= 1 && animStep < 6) || isReevaluating}
              className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-2xl border border-emerald-400/50 bg-gradient-to-r from-emerald-500 to-teal-500 px-5 py-3 text-xs sm:text-sm font-bold text-forest-950 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all hover:scale-[1.02] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)] active:scale-95 disabled:opacity-50 cursor-pointer"
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
      {/* 2. TODAY'S FARM CHECK (5-STEP SIMPLE VERTICAL WORKFLOW CHECKLIST) */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-gold-300/20 bg-forest-900/70 p-5 sm:p-7 shadow-lg space-y-5">
        <div className="border-b border-gold-300/10 pb-3.5 flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="font-serif text-lg sm:text-xl font-bold text-gold-100 flex items-center gap-2">
              <span>{t('sentinel.todayCheckTitle')}</span>
            </h2>
            <p className="text-xs text-cream-300/80 mt-0.5">
              {t('sentinel.todayCheckSubtitle')}
            </p>
          </div>

          {farmerObservation && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 px-3 py-1 text-xs font-bold text-emerald-300">
              <Check size={12} /> {t('sentinel.observationAddedBadge')}
            </span>
          )}
        </div>

        {/* 5-Step Vertical Checklist */}
        <div className="space-y-3">
          {/* STEP 1: Weather */}
          <StepItem
            stepNumber={1}
            icon={<CloudRain size={18} className="text-blue-400" />}
            title={t('sentinel.step1Title')}
            description={t('sentinel.step1Desc')}
            statusInfo={getStepStatus(1)}
            result={weatherResult}
          />

          {/* STEP 2: Soil & Water */}
          <StepItem
            stepNumber={2}
            icon={<Droplets size={18} className="text-cyan-400" />}
            title={t('sentinel.step2Title')}
            description={t('sentinel.step2Desc')}
            statusInfo={getStepStatus(2)}
            result={soilResult}
          />

          {/* STEP 3: Crops */}
          <StepItem
            stepNumber={3}
            icon={<Sprout size={18} className="text-emerald-400" />}
            title={t('sentinel.step3Title')}
            description={t('sentinel.step3Desc')}
            statusInfo={getStepStatus(3)}
            result={cropResult}
          />

          {/* STEP 4: Farm Risk */}
          <StepItem
            stepNumber={4}
            icon={<DollarSign size={18} className="text-gold-400" />}
            title={t('sentinel.step4Title')}
            description={t('sentinel.step4Desc')}
            statusInfo={getStepStatus(4)}
            result={riskResult}
          />

          {/* STEP 5: Make Decision */}
          <StepItem
            stepNumber={5}
            icon={<Sparkles size={18} className="text-amber-400" />}
            title={t('sentinel.step5Title')}
            description={t('sentinel.step5Desc')}
            statusInfo={getStepStatus(5)}
            result={decisionStepResult}
            isFinal
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. OPTIONAL "TELL THE AGENT" SECTION (FARMER CONTEXT) */}
      {/* ========================================================================= */}
      <div className="rounded-3xl border border-gold-300/25 bg-gradient-to-b from-forest-950/90 via-forest-900/60 to-forest-950/90 p-5 sm:p-6 shadow-md space-y-4">
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
            <p className="text-[11px] text-cream-300/60">
              {t('sentinel.tellAgentHelp')}
            </p>
          </div>

          {/* 3 Simple Mode Tabs: [ Speak ] [ Type ] [ Add Photo ] */}
          <div className="inline-flex rounded-full border border-gold-300/25 bg-forest-950 p-1 shadow-inner shrink-0 self-start sm:self-auto">
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

        {/* Quick Select Chips ("Quickly tell us:") */}
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

        {/* Active Input Mode Area */}
        <div className="pt-1">
          {/* Mode 1: SPEAK */}
          {inputMode === 'speak' && (
            <div className="rounded-2xl border border-forest-800 bg-forest-950/70 p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <span className="text-xs font-bold text-white flex items-center gap-2">
                    {isListening ? (
                      <span className="flex h-2 w-2 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-pink-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-pink-500" />
                      </span>
                    ) : (
                      <Mic size={14} className="text-gold-300" />
                    )}
                    <span>{isListening ? t('sentinel.micListening') : t('sentinel.tabSpeak')}</span>
                  </span>
                  <p className="text-[11px] text-cream-300/70">
                    {isHi
                      ? 'माइक बटन दबाएं और जो देखा वह बोलें (उदा: "टमाटर के पत्ते पीले हो रहे हैं")'
                      : 'Tap the mic button and describe your observation (e.g. "My tomato leaves are turning yellow")'}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={toggleListening}
                  className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer shadow-md ${
                    isListening
                      ? 'bg-pink-600 hover:bg-pink-700 text-white animate-pulse'
                      : 'bg-gradient-to-r from-gold-400 to-gold-500 text-forest-950 hover:brightness-110'
                  }`}
                >
                  {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                  <span>{isListening ? t('sentinel.micStop') : t('sentinel.tabSpeak')}</span>
                </button>
              </div>

              {speechError && (
                <p className="text-[11px] text-pink-300 font-medium">{speechError}</p>
              )}
            </div>
          )}

          {/* Mode 2: TYPE */}
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

              <p className="text-[10px] text-cream-300/60 italic font-mono">
                ℹ️ {t('sentinel.photoVisionNotice')}
              </p>
            </div>
          )}

          {/* Action Bar: [ Add to Farm Check ] or [ Clear Observation ] */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3">
            <button
              type="button"
              onClick={() => handleAddObservation()}
              disabled={selectedChips.length === 0 && !customText.trim() && !attachedPhoto}
              className="inline-flex items-center gap-1.5 rounded-2xl border border-gold-300/40 bg-gradient-to-r from-gold-400 to-gold-500 px-4 py-2 text-xs font-bold text-forest-950 shadow-sm transition-all hover:scale-[1.02] disabled:opacity-40 cursor-pointer"
            >
              <Check size={13} />
              <span>{t('sentinel.addToFarmCheckBtn')}</span>
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

        {/* Visible Re-evaluating banner if actively re-evaluating */}
        {isReevaluating && (
          <div className="rounded-2xl border border-emerald-400/40 bg-emerald-950/60 p-3 text-xs text-emerald-200 flex items-center gap-2 animate-pulse">
            <RefreshCw size={14} className="animate-spin text-emerald-400" />
            <span className="font-semibold">{t('sentinel.reevaluatingMsg')}</span>
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* 4. YOUR FARM DECISION (ACTION-ORIENTED RESULT CARD) */}
      {/* ========================================================================= */}
      {animStep === 6 && !isReevaluating && (
        <div
          className={`rounded-3xl border p-5 sm:p-7 shadow-xl space-y-5 transition-all animate-in fade-in slide-in-from-bottom-3 duration-300 ${
            decisionState === 'NO_ACTION'
              ? 'border-emerald-500/40 bg-gradient-to-br from-emerald-950/70 via-forest-950/90 to-forest-900/90'
              : decisionState === 'ACTION_RECOMMENDED'
              ? 'border-amber-400/50 bg-gradient-to-br from-amber-950/70 via-forest-950/90 to-forest-900/90'
              : decisionState === 'CHANGE_PLAN'
              ? 'border-cyan-400/50 bg-gradient-to-br from-cyan-950/70 via-forest-950/90 to-forest-900/90'
              : 'border-pink-500/50 bg-gradient-to-br from-pink-950/70 via-forest-950/90 to-forest-900/90'
          }`}
        >
          {/* Card Header & Decision Badge */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-gold-300/10 pb-4">
            <span className="text-xs font-mono font-bold tracking-wider text-cream-300/70 uppercase">
              {t('sentinel.decisionCardTitle')}
            </span>

            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold w-fit border ${
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

          {/* Decision Headline & Explanation */}
          <div className="space-y-2">
            <h3 className="font-serif text-xl sm:text-2xl font-bold text-white">
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
                isHi
                  ? 'जल्द ही बारिश का अनुमान है और मिट्टी की नमी पर्याप्त है, इसलिए इस समय अतिरिक्त सिंचाई की आवश्यकता नहीं है।'
                  : 'Rain is expected soon and soil moisture is adequate, so extra irrigation is not recommended right now.'
              ) : decisionState === 'ACTION_RECOMMENDED' ? (
                advisory?.advisory_reason || (
                  isHi
                    ? 'मिट्टी की नमी कम हो रही है और अगले 3 दिनों में कम बारिश का अनुमान है।'
                    : 'Soil moisture is lower than expected and little rain is forecast.'
                )
              ) : decisionState === 'CHANGE_PLAN' ? (
                advisory?.advisory_reason || (
                  isHi
                    ? 'आने वाले दिनों में भारी बारिश का अनुमान है जिससे अतिरिक्त सिंचाई से पानी का नुकसान हो सकता है।'
                    : 'Heavy rainfall is forecast; extra irrigation may waste water and cause waterlogging.'
                )
              ) : (
                advisory?.advisory_reason || (
                  isHi
                    ? 'उच्च तापमान और नमी की कमी के कारण फसल पर दबाव की संभावना है।'
                    : 'High temperature and low soil moisture are expected.'
                )
              )}
            </p>
          </div>

          {/* NEXT STEP Box */}
          <div className="rounded-2xl border border-gold-300/20 bg-forest-950/80 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
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
                  ? advisory?.proactive_directive || t('sentinel.stateActionNext')
                  : decisionState === 'CHANGE_PLAN'
                  ? advisory?.proactive_directive || t('sentinel.stateChangePlanNext')
                  : advisory?.proactive_directive || t('sentinel.stateHighRiskNext')}
              </p>
            </div>

            <span className="rounded-full bg-forest-900 border border-forest-700/60 px-3 py-1 text-xs font-medium text-cream-200 shrink-0 w-fit">
              {isHi ? 'मार्गदर्शन सक्रिय' : 'Guidance Active'}
            </span>
          </div>

          {/* "Why did the agent decide this?" Toggle & Explanations */}
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
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-xl bg-forest-900/70 p-2.5 border border-forest-800">
                    <span className="font-bold text-gold-300">1. {t('sentinel.whyItemRain')}: </span>
                    <span className="text-white font-mono">{formatRainfall(rain7d, language)} (7d)</span>
                  </div>
                  <div className="rounded-xl bg-forest-900/70 p-2.5 border border-forest-800">
                    <span className="font-bold text-cyan-300">2. {t('sentinel.whyItemSoil')}: </span>
                    <span className="text-white font-mono">
                      {soilMoisture !== null && soilMoisture !== undefined ? `${soilMoisture.toFixed(2)} m³/m³` : 'Adequate'}
                    </span>
                  </div>
                  <div className="rounded-xl bg-forest-900/70 p-2.5 border border-forest-800">
                    <span className="font-bold text-emerald-300">3. {t('sentinel.whyItemCropStress')}: </span>
                    <span className="text-white">{overallRisk === 'LOW' ? (isHi ? 'कम / सुरक्षित' : 'Low / Protected') : overallRisk}</span>
                  </div>
                  <div className="rounded-xl bg-forest-900/70 p-2.5 border border-forest-800">
                    {farmerObservation ? (
                      <>
                        <span className="font-bold text-amber-300">4. {t('sentinel.whyItemFarmerObs')}: </span>
                        <span className="text-white truncate block">{farmerObservation}</span>
                      </>
                    ) : (
                      <>
                        <span className="font-bold text-amber-300">4. {t('sentinel.whyItemFinancial')}: </span>
                        <span className="text-white font-mono">{formatCurrency(netProfit, language)} exp. profit</span>
                      </>
                    )}
                  </div>
                </div>

                <p className="text-[11px] text-cream-300/80 pt-1 leading-relaxed">
                  {farmerObservation
                    ? isHi
                      ? 'खेत के वास्तविक डेटा और आपके द्वारा दी गई जानकारी के आधार पर, एजेंट ने योजना का पुनर्मूल्यांकन कर यह सलाह दी है।'
                      : 'Based on your farm data and what you reported, the agent updated its reasoning to provide targeted field guidance.'
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
      {/* 5. DISCREET TECHNICAL DETAILS DRAWER */}
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
            <p className="text-cream-300/80">
              {t('sentinel.dataProvenanceNotice')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// -----------------------------------------------------------------------------
// Subcomponent: StepItem for 5-Step Checklist
// -----------------------------------------------------------------------------
interface StepItemProps {
  stepNumber: number;
  icon: React.ReactNode;
  title: string;
  description: string;
  statusInfo: { status: string; label: string };
  result: string;
  isFinal?: boolean;
}

function StepItem({
  stepNumber,
  icon,
  title,
  description,
  statusInfo,
  result,
  isFinal = false,
}: StepItemProps) {
  const isChecking = statusInfo.status === 'checking';
  const isChecked = statusInfo.status === 'checked';
  const isPending = statusInfo.status === 'pending';

  return (
    <div
      className={`rounded-2xl border p-3.5 sm:p-4 transition-all ${
        isChecking
          ? 'border-emerald-400/60 bg-emerald-950/30 shadow-[0_0_15px_rgba(16,185,129,0.15)] scale-[1.01]'
          : isChecked
          ? 'border-forest-800 bg-forest-950/80 hover:border-gold-300/20'
          : 'border-forest-900 bg-forest-950/40 opacity-60'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
              isChecking
                ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                : isChecked
                ? 'border-forest-700 bg-forest-900 text-cream-100'
                : 'border-forest-800 bg-forest-950 text-cream-300/40'
            }`}
          >
            {icon}
          </div>

          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold text-gold-300/80">
                STEP {stepNumber}
              </span>
              <h3 className="font-bold text-xs sm:text-sm text-white">{title}</h3>
            </div>
            <p className="text-[11px] text-cream-300/70">{description}</p>

            {isChecked && (
              <p className="text-[11px] font-medium text-cream-100 pt-1 animate-in fade-in duration-200">
                {result}
              </p>
            )}
          </div>
        </div>

        {/* Status Badge */}
        <div className="shrink-0">
          {isChecking && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
              <Loader2 size={11} className="animate-spin" />
              <span>{statusInfo.label}</span>
            </span>
          )}

          {isChecked && (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-950 border border-emerald-500/40 px-2.5 py-0.5 text-[10px] font-bold text-emerald-300">
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
    </div>
  );
}
