import { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ExternalLink,
  Globe,
  Loader2,
  Mic,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Volume2,
  XCircle,
} from 'lucide-react';
import { Atmosphere } from '@/components/Atmosphere';
import { MicPortal } from '@/components/MicPortal';
import { LANGUAGES, PIPELINE_STAGES, type LanguageCode, type SourceRef, type VoicePhase } from '@/lib/languages';
import { usePrefersReducedMotion } from '@/lib/hooks';

interface MainScreenProps {
  onBack: () => void;
  initialLanguage?: LanguageCode;
}

function buildResult(lang: LanguageCode, query: string) {
  const lower = query.toLowerCase();
  const refuses = ['lottery', 'stock tip', 'predict', 'crypto price', 'who will win'];
  const shouldRefuse = refuses.some((r) => lower.includes(r));

  if (shouldRefuse) {
    return {
      transcript: query,
      answer:
        'I cannot answer that with grounded evidence. The knowledge base does not contain verified information for this question, so I will not speculate.',
      confidence: 0.12,
      grounded: false,
      sources: [],
      refused: true,
    };
  }

  const sources: SourceRef[] = [
    {
      id: 1,
      title: 'Encyclopaedia of Indian Languages',
      snippet: `Reference entry covering ${lang} phonology, grammar, and common usage patterns.`,
      url: '#source-1',
    },
    {
      id: 2,
      title: 'Verified Knowledge Corpus',
      snippet: 'Peer-reviewed documents indexed for retrieval-augmented generation.',
      url: '#source-2',
    },
  ];

  return {
    transcript: query,
    answer: `Based on retrieved evidence, here is a grounded answer to your question in ${LANGUAGES.find((l) => l.code === lang)?.english}. The system located relevant passages and verified the supporting context before responding.`,
    confidence: 0.91,
    grounded: true,
    sources,
    refused: false,
  };
}

export function MainScreen({ onBack, initialLanguage = 'en' }: MainScreenProps) {
  const reduced = usePrefersReducedMotion();
  const [lang, setLang] = useState<LanguageCode>(initialLanguage);
  const [langOpen, setLangOpen] = useState(false);
  const [phase, setPhase] = useState<VoicePhase>('idle');
  const [transcript, setTranscript] = useState('');
  const [answer, setAnswer] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [grounded, setGrounded] = useState(false);
  const [sources, setSources] = useState<SourceRef[]>([]);
  const [refused, setRefused] = useState(false);
  const [waveform, setWaveform] = useState<number[]>(Array(7).fill(0.3));
  const timers = useRef<number[]>([]);
  const listeningRef = useRef(false);

  const clearTimers = () => {
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];
  };

  useEffect(() => {
    return () => clearTimers();
  }, []);

  useEffect(() => {
    if (phase !== 'listening') return;
    if (reduced) return;
    const interval = window.setInterval(() => {
      setWaveform(Array.from({ length: 7 }, () => 0.2 + Math.random() * 0.8));
    }, 140);
    return () => clearInterval(interval);
  }, [phase, reduced]);

  const reset = () => {
    clearTimers();
    listeningRef.current = false;
    setPhase('idle');
    setTranscript('');
    setAnswer('');
    setConfidence(0);
    setGrounded(false);
    setSources([]);
    setRefused(false);
  };

  const startInteraction = () => {
    if (phase === 'listening') {
      stopAndProcess();
      return;
    }
    reset();
    listeningRef.current = true;
    setPhase('listening');

    const sampleQueries = [
      'What is the history of the Konkan coast?',
      'Explain retrieval-augmented generation.',
      'Tell me about Goan monsoon patterns.',
      'What languages are spoken in Goa?',
    ];
    const query = sampleQueries[Math.floor(Math.random() * sampleQueries.length)];
    setTranscript(query);

    timers.current.push(
      window.setTimeout(() => {
        if (!listeningRef.current) return;
        setPhase('understanding');
      }, 1800),
    );
    timers.current.push(
      window.setTimeout(() => {
        if (!listeningRef.current) return;
        setPhase('searching');
      }, 2600),
    );
    timers.current.push(
      window.setTimeout(() => {
        if (!listeningRef.current) return;
        setPhase('checking');
      }, 3400),
    );
    timers.current.push(
      window.setTimeout(() => {
        if (!listeningRef.current) return;
        finishWithResult(query);
      }, 4200),
    );
  };

  const stopAndProcess = () => {
    listeningRef.current = false;
    clearTimers();
    setPhase('understanding');
    timers.current.push(window.setTimeout(() => setPhase('searching'), 800));
    timers.current.push(window.setTimeout(() => setPhase('checking'), 1600));
    timers.current.push(
      window.setTimeout(() => finishWithResult(transcript || 'Tell me about Voice RAG.'), 2400),
    );
  };

  const finishWithResult = (query: string) => {
    const result = buildResult(lang, query);
    setAnswer(result.answer);
    setConfidence(result.confidence);
    setGrounded(result.grounded);
    setSources(result.sources);
    setRefused(result.refused);
    setPhase(result.refused ? 'refused' : 'answered');
  };

  const currentLang = LANGUAGES.find((l) => l.code === lang)!;
  const active = phase === 'listening';
  const processing = ['understanding', 'searching', 'checking'].includes(phase);
  const showResult = phase === 'answered' || phase === 'refused';

  return (
    <section className="absolute inset-0 h-full w-full overflow-y-auto no-scrollbar" aria-label="Voice RAG main interface">
      <Atmosphere intensity="dim" />

      <div className="relative z-10 mx-auto flex min-h-full max-w-3xl flex-col px-5 py-6 sm:px-8 sm:py-8">
        {/* Top bar */}
        <header className="flex items-center justify-between">
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-2 rounded-full border border-gold-300/20 bg-forest-900/50 px-4 py-2 text-xs font-medium text-cream-200/80 transition-all duration-300 hover:border-gold-300/40 hover:text-cream-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-300"
            aria-label="Back to welcome"
          >
            <ArrowLeft size={14} />
            Welcome
          </button>

          <div className="flex items-center gap-2">
            <span className="hidden font-mono text-[10px] uppercase tracking-[0.2em] text-cream-300/50 sm:inline">
              Voice RAG
            </span>
            {/* Language selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setLangOpen((v) => !v)}
                className="inline-flex items-center gap-2 rounded-full border border-gold-300/30 bg-forest-900/60 px-4 py-2 text-xs font-medium text-cream-100 transition-all duration-300 hover:border-gold-300/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-300"
                aria-label={`Selected language: ${currentLang.english}. Change language`}
                aria-expanded={langOpen}
              >
                <Globe size={14} className="text-gold-200" />
                <span className="hidden sm:inline">{currentLang.english}</span>
                <span className="sm:hidden">{currentLang.label}</span>
              </button>
              {langOpen && (
                <div
                  className="absolute right-0 top-full z-20 mt-2 max-h-64 w-52 overflow-y-auto rounded-2xl border border-gold-300/20 bg-forest-900/95 p-2 shadow-2xl backdrop-blur-md no-scrollbar"
                  role="listbox"
                  aria-label="Select language"
                >
                  {LANGUAGES.map((l) => (
                    <button
                      key={l.code}
                      type="button"
                      onClick={() => {
                        setLang(l.code);
                        setLangOpen(false);
                        reset();
                      }}
                      className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors ${
                        l.code === lang
                          ? 'bg-gold-300/15 text-gold-100'
                          : 'text-cream-200/80 hover:bg-forest-800/60'
                      }`}
                      role="option"
                      aria-selected={l.code === lang}
                    >
                      <span>{l.english}</span>
                      <span className="font-serif text-xs text-cream-300/60">{l.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mic + waveform */}
        <div className="flex flex-1 flex-col items-center justify-center py-8">
          <div className="relative">
            <MicPortal
              size="main"
              active={active || processing}
              phase={active ? 'listening' : 'idle'}
              onClick={startInteraction}
            />
          </div>

          {/* Waveform */}
          <div className="mt-6 flex h-12 items-center gap-1.5" aria-hidden="true">
            {waveform.map((h, i) => (
              <span
                key={i}
                className={`w-1.5 rounded-full transition-all duration-150 ${
                  active ? 'bg-gold-200' : 'bg-gold-200/30'
                }`}
                style={{
                  height: `${h * 100}%`,
                  transform: active && !reduced ? `scaleY(${h})` : undefined,
                  animation:
                    active && !reduced ? `waveBar 0.9s ease-in-out ${i * 0.08}s infinite` : undefined,
                }}
              />
            ))}
          </div>

          {/* Status / pipeline */}
          <div className="mt-4 min-h-[24px] text-center">
            {phase === 'idle' && (
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-cream-300/50">
                Tap the microphone to speak
              </p>
            )}
            {active && (
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-pink-400">
                Listening… tap to stop
              </p>
            )}
            {processing && (
              <div className="flex items-center justify-center gap-2">
                <Loader2 size={14} className="animate-spin text-gold-200" />
                <span className="font-mono text-xs uppercase tracking-[0.2em] text-gold-200">
                  {PIPELINE_STAGES.find((s) => s.key === phase)?.label}
                </span>
              </div>
            )}
          </div>

          {/* Pipeline steps */}
          {(processing || showResult) && (
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
              {PIPELINE_STAGES.map((stage) => {
                const done =
                  showResult ||
                  (phase === 'searching' && stage.key === 'understanding') ||
                  (phase === 'checking' && stage.key !== 'checking');
                const currentStage = phase === stage.key;
                return (
                  <div
                    key={stage.key}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-mono uppercase tracking-wider transition-all duration-300 ${
                      currentStage
                        ? 'border-gold-300/60 bg-gold-300/10 text-gold-100'
                        : done
                          ? 'border-forest-600/40 bg-forest-800/40 text-cream-200/70'
                          : 'border-cream-300/10 text-cream-300/30'
                    }`}
                  >
                    {done && !currentStage && <CheckCircle2 size={11} className="text-forest-500" />}
                    {currentStage && <Loader2 size={11} className="animate-spin" />}
                    {stage.label}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Transcript */}
        {transcript && phase !== 'idle' && (
          <div className="mb-3 rounded-2xl border border-gold-300/15 bg-forest-900/40 p-4 backdrop-blur-sm">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.2em] text-cream-300/40">
              You said
            </p>
            <p className="text-sm text-cream-100">{transcript}</p>
          </div>
        )}

        {/* Answer */}
        {showResult && (
          <div
            className={`mb-3 rounded-2xl border p-5 backdrop-blur-sm ${
              refused
                ? 'border-pink-500/30 bg-pink-500/5'
                : 'border-gold-300/20 bg-forest-900/40'
            }`}
          >
            <div className="mb-3 flex items-center gap-2">
              {refused ? (
                <XCircle size={16} className="text-pink-400" />
              ) : (
                <Sparkles size={16} className="text-gold-200" />
              )}
              <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-cream-300/50">
                {refused ? 'Refused to answer' : 'Answer'}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-cream-100">{answer}</p>

            {!refused && (
              <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-gold-300/10 pt-3">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck size={14} className="text-forest-500" />
                  <span className="font-mono text-[10px] uppercase tracking-wider text-cream-300/60">
                    Grounded
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-cream-300/60">
                    Confidence
                  </span>
                  <div className="h-1.5 w-16 overflow-hidden rounded-full bg-forest-800">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-forest-500 to-gold-300"
                      style={{ width: `${confidence * 100}%` }}
                    />
                  </div>
                  <span className="font-mono text-[10px] text-gold-100">
                    {Math.round(confidence * 100)}%
                  </span>
                </div>
                <button
                  type="button"
                  className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-gold-300/20 px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-cream-200/70 transition-colors hover:border-gold-300/40 hover:text-cream-100"
                  aria-label="Play answer audio"
                >
                  <Volume2 size={12} />
                  Play
                </button>
              </div>
            )}
          </div>
        )}

        {/* Sources */}
        {showResult && !refused && sources.length > 0 && (
          <div className="mb-3">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-cream-300/40">
              Sources
            </p>
            <div className="space-y-2">
              {sources.map((s) => (
                <a
                  key={s.id}
                  href={s.url}
                  className="group flex items-start gap-3 rounded-xl border border-gold-300/10 bg-forest-900/30 p-3 transition-colors hover:border-gold-300/30"
                >
                  <ExternalLink size={14} className="mt-0.5 text-gold-200/60 group-hover:text-gold-100" />
                  <div>
                    <p className="text-sm text-cream-100">{s.title}</p>
                    <p className="mt-0.5 text-xs text-cream-300/50">{s.snippet}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Reset */}
        {showResult && (
          <button
            type="button"
            onClick={reset}
            className="mx-auto mb-4 inline-flex items-center gap-2 rounded-full border border-cream-300/15 px-5 py-2.5 text-xs font-medium text-cream-200/70 transition-all duration-300 hover:border-gold-300/40 hover:text-cream-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-gold-300"
          >
            <RotateCcw size={13} />
            Ask another question
          </button>
        )}
      </div>
    </section>
  );
}
