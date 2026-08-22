import { useCallback, useEffect, useState } from 'react';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { MainScreen } from '@/components/MainScreen';
import { usePrefersReducedMotion } from '@/lib/hooks';
import type { LanguageCode } from '@/lib/languages';

type AppState = 'welcome' | 'transitioning' | 'main';

export default function App() {
  const [state, setState] = useState<AppState>('welcome');
  const [selectedLang, setSelectedLang] = useState<LanguageCode>('en');
  const reduced = usePrefersReducedMotion();

  const enterApp = useCallback((lang: LanguageCode) => {
    setSelectedLang(lang);
    setState('transitioning');
    const delay = reduced ? 60 : 820;
    window.setTimeout(() => {
      setState('main');
    }, delay);
  }, [reduced]);

  const backToWelcome = useCallback(() => {
    setState('welcome');
  }, []);

  // Keyboard: Escape returns to welcome from main
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (state === 'main' && e.key === 'Escape') {
        backToWelcome();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [state, backToWelcome]);

  const welcomeTranslate = state === 'main' ? '-100%' : '0%';
  const mainTranslate = state === 'main' ? '0%' : '100%';
  const transitionDuration = state === 'transitioning' ? (reduced ? '0ms' : '820ms') : '0ms';

  return (
    <div className="relative h-screen w-screen overflow-hidden bg-forest-950">
      {/* Welcome panel */}
      <div
        className="absolute inset-0 h-full w-full"
        style={{
          transform: `translateX(${welcomeTranslate})`,
          transition: `transform ${transitionDuration} cubic-bezier(0.22, 1, 0.36, 1)`,
          willChange: 'transform',
        }}
      >
        <WelcomeScreen onEnter={enterApp} />
      </div>

      {/* Main panel */}
      <div
        className="absolute inset-0 h-full w-full"
        style={{
          transform: `translateX(${mainTranslate})`,
          transition: `transform ${transitionDuration} cubic-bezier(0.22, 1, 0.36, 1)`,
          willChange: 'transform',
        }}
        aria-hidden={state === 'welcome'}
      >
        <MainScreen onBack={backToWelcome} initialLanguage={selectedLang} />
      </div>
    </div>
  );
}
