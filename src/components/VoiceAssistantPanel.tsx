import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Loader2,
  HelpCircle,
  CheckCircle2,
  Copy,
  Check,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import { getFarmerVoiceAnswer } from '@/i18n/semanticAdapter';
import type { FarmDecisionResponse } from '@/types/farm';

interface VoiceAssistantPanelProps {
  decision: FarmDecisionResponse | null;
}

export function VoiceAssistantPanel({ decision }: VoiceAssistantPanelProps) {
  const { language, t } = useLanguage();
  const isHi = language === 'hi';

  const [isListening, setIsListening] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [voiceQuery, setVoiceQuery] = useState<string>('');
  const [voiceAnswer, setVoiceAnswer] = useState<string>('');
  const [waveform, setWaveform] = useState<number[]>([0.3, 0.4, 0.2, 0.5, 0.3, 0.4, 0.2]);
  const [speechError, setSpeechError] = useState<string | null>(null);
  const [copied, setCopied] = useState<boolean>(false);

  const recognitionRef = useRef<any>(null);
  const synthRef = useRef<SpeechSynthesis | null>(typeof window !== 'undefined' ? window.speechSynthesis : null);

  // Set default initial prompt and answer
  useEffect(() => {
    if (decision) {
      const defaultQ = isHi ? 'मुझे कौन सी फसल उगानी चाहिए?' : 'What should I grow this season?';
      setVoiceQuery(defaultQ);
      setVoiceAnswer(getFarmerVoiceAnswer(defaultQ, decision, language));
    }
  }, [decision, language, isHi]);

  // Voice synthesis speaker
  const speakText = useCallback(
    (textToSpeak: string) => {
      if (!synthRef.current) return;

      try {
        synthRef.current.cancel();

        const utterance = new SpeechSynthesisUtterance(textToSpeak);
        utterance.lang = isHi ? 'hi-IN' : 'en-IN';
        utterance.rate = 0.95;

        // Try selecting Indian English or Hindi voice
        const voices = synthRef.current.getVoices();
        const targetLangPrefix = isHi ? 'hi' : 'en';
        const matchVoice = voices.find(
          (v) => v.lang.toLowerCase().startsWith(targetLangPrefix) && (v.name.includes('India') || isHi)
        ) || voices.find((v) => v.lang.toLowerCase().startsWith(targetLangPrefix));

        if (matchVoice) {
          utterance.voice = matchVoice;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        synthRef.current.speak(utterance);
      } catch (err) {
        console.warn('Speech synthesis error:', err);
        setIsSpeaking(false);
      }
    },
    [isHi]
  );

  // Handle Query Submission
  const handleQuerySelect = (queryText: string) => {
    setVoiceQuery(queryText);
    setSpeechError(null);

    // Animate audio waveform
    let step = 0;
    const interval = setInterval(() => {
      setWaveform(Array.from({ length: 7 }, () => 0.2 + Math.random() * 0.8));
      step++;
      if (step > 6) {
        clearInterval(interval);
        setWaveform([0.3, 0.4, 0.2, 0.5, 0.3, 0.4, 0.2]);
      }
    }, 80);

    const answer = getFarmerVoiceAnswer(queryText, decision, language);
    setVoiceAnswer(answer);

    // Optional audio readout
    speakText(answer);
  };

  // Toggle speech recognition
  const toggleListening = () => {
    setSpeechError(null);

    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      return;
    }

    // Check for browser speech recognition
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setSpeechError(
        isHi
          ? 'इस ब्राउज़र में आवाज पहचान समर्थित नहीं है। कृपया नीचे दिए गए बटनों का उपयोग करें।'
          : 'Speech recognition is not supported in this browser. Please use the quick query buttons below.'
      );
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = isHi ? 'hi-IN' : 'en-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          handleQuerySelect(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setSpeechError(
            isHi
              ? 'माइक्रोफ़ोन की अनुमति नहीं मिली। कृपया माइक्रोफ़ोन की अनुमति दें।'
              : 'Microphone permission denied. Please allow microphone access to speak.'
          );
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn('Recognition start failed:', err);
      setIsListening(false);
    }
  };

  const copyToClipboard = () => {
    if (!voiceAnswer) return;
    navigator.clipboard.writeText(voiceAnswer);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const queryChips = isHi
    ? [
        'मुझे कौन सी फसल उगानी चाहिए?',
        'यह फसल क्यों अनुशंसित है?',
        'अगर बारिश कम हुई तो क्या होगा?',
        'मुझे कितना मुनाफा हो सकता है?',
        'मुझे आगे क्या करना चाहिए?',
      ]
    : [
        'What should I grow this season?',
        'Why is this crop recommended?',
        'What if there is less rain?',
        'How much profit will I make?',
        'What should I do next?',
      ];

  return (
    <div className="rounded-3xl border border-gold-300/30 bg-gradient-to-b from-forest-900/90 to-forest-950/95 p-5 sm:p-6 backdrop-blur-xl shadow-[0_12px_40px_rgba(0,0,0,0.3)] text-center">
      {/* Header */}
      <div className="flex items-center justify-center gap-2.5 mb-1.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold-400/20 text-lg border border-gold-300/30">
          🎙️
        </span>
        <h3 className="font-serif text-sm sm:text-base font-bold text-gold-100">
          {t('voice.title')}
        </h3>
      </div>
      <p className="text-xs text-cream-300/70 max-w-sm mx-auto">
        {t('voice.subtitle')}
      </p>

      {/* Microphone Interaction Button with Ripple Rings */}
      <div className="my-5 flex flex-col items-center justify-center">
        <div className="relative flex items-center justify-center">
          {isListening && (
            <>
              <span className="absolute h-20 w-20 rounded-full bg-pink-500/30 animate-ping" />
              <span className="absolute h-24 w-24 rounded-full bg-pink-500/20 animate-pulse" />
            </>
          )}

          <button
            type="button"
            onClick={toggleListening}
            className={`relative flex h-16 w-16 items-center justify-center rounded-full transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-gold-300/50 ${
              isListening
                ? 'bg-gradient-to-tr from-pink-600 to-pink-500 text-white shadow-[0_0_28px_rgba(244,63,94,0.7)] scale-110'
                : 'border-2 border-gold-300/80 bg-gradient-to-br from-gold-400 via-gold-400 to-gold-500 text-forest-950 shadow-[0_6px_24px_rgba(255,210,26,0.4)] hover:scale-105 active:scale-95'
            }`}
            aria-label={isListening ? 'Stop listening' : 'Start speaking'}
          >
            {isListening ? <MicOff size={26} /> : <Mic size={26} />}
          </button>
        </div>

        <span className="mt-2.5 text-xs font-bold text-cream-100">
          {isListening
            ? isHi ? 'सुन रहे हैं... अपना सवाल बोलें' : 'Listening... Speak your question'
            : isHi ? 'बोलने के लिए माइक दबाएं' : 'Tap to speak your question'}
        </span>
      </div>

      {/* Dynamic Waveform Visualizer */}
      <div className="flex h-7 items-center justify-center gap-1.5" aria-hidden="true">
        {waveform.map((h, i) => (
          <span
            key={i}
            className={`w-1.5 rounded-full transition-all duration-150 ${
              isListening || isSpeaking
                ? 'bg-gradient-to-t from-gold-400 to-gold-300 shadow-[0_0_8px_rgba(255,210,26,0.5)]'
                : 'bg-gold-200/25'
            }`}
            style={{ height: `${(isListening || isSpeaking ? h : 0.25) * 100}%` }}
          />
        ))}
      </div>

      {/* Error Message if any */}
      {speechError && (
        <p className="mt-2 text-xs text-amber-300 font-medium">{speechError}</p>
      )}

      {/* Quick Question Chips */}
      <div className="mt-4 flex flex-wrap gap-1.5 justify-center">
        {queryChips.map((chip, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => handleQuerySelect(chip)}
            className="rounded-full border border-gold-300/25 bg-forest-950/85 px-3 py-1.5 text-xs text-cream-200 transition-all duration-200 hover:border-gold-300/60 hover:bg-forest-900 hover:text-white hover:scale-105 active:scale-95 shadow-sm"
          >
            💬 {chip}
          </button>
        ))}
      </div>

      {/* Spoken Answer Bubble */}
      {voiceAnswer && (
        <div className="mt-4 rounded-2xl border border-gold-300/35 bg-forest-950/90 p-4 text-left shadow-md">
          <div className="flex items-center justify-between border-b border-gold-300/15 pb-2 mb-2.5">
            <span className="text-xs font-bold text-gold-300 flex items-center gap-1.5">
              <Sparkles size={14} /> {t('voice.assistantAnswer')}
            </span>
            <div className="flex items-center gap-1.5">
              {voiceQuery && (
                <span className="text-[10px] text-cream-300/60 italic truncate max-w-[150px]">
                  "{voiceQuery}"
                </span>
              )}
              <button
                type="button"
                onClick={copyToClipboard}
                className="rounded-full p-1.5 text-cream-300/70 hover:text-gold-200 hover:bg-forest-900 transition-colors"
                title={isHi ? 'कॉपी करें' : 'Copy'}
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
              <button
                type="button"
                onClick={() => speakText(voiceAnswer)}
                className="rounded-full p-1.5 text-gold-300 hover:bg-forest-900 transition-colors"
                title={isHi ? 'आवाज में सुनें' : 'Listen audio'}
              >
                {isSpeaking ? <VolumeX size={15} /> : <Volume2 size={15} />}
              </button>
            </div>
          </div>
          <p className="text-xs sm:text-sm text-cream-100 font-medium leading-relaxed">
            {voiceAnswer}
          </p>
        </div>
      )}
    </div>
  );
}
