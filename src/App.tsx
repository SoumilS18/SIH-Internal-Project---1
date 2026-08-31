import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { LoginScreen } from '@/components/LoginScreen';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { MainScreen } from '@/components/MainScreen';
import { LanguageProvider, useLanguage } from '@/i18n/LanguageContext';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { LanguageComingSoonModal } from '@/components/LanguageComingSoonModal';
import { WorldBackground } from '@/components/WorldBackground';
import { StageSwap } from '@/components/ui/motion';

type AppStage = 'login' | 'map' | 'initializing' | 'dashboard';

interface StoredSession {
  stage: AppStage;
  userName: string;
  selectedState: string;
  selectedDistrict: string;
}

const SESSION_STORAGE_KEY = 'agrioptima_session_state_v1';

function loadStoredSession(): StoredSession | null {
  try {
    const raw = localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      const validStages: AppStage[] = ['login', 'map', 'initializing', 'dashboard'];
      const stage: AppStage = validStages.includes(parsed.stage)
        ? parsed.stage === 'initializing'
          ? 'dashboard'
          : parsed.stage
        : 'login';
      return {
        stage,
        userName: typeof parsed.userName === 'string' ? parsed.userName : 'Demo Farmer',
        selectedState: typeof parsed.selectedState === 'string' ? parsed.selectedState : 'Madhya Pradesh',
        selectedDistrict: typeof parsed.selectedDistrict === 'string' ? parsed.selectedDistrict : 'Bhopal',
      };
    }
  } catch (err) {
    console.warn('Could not restore session from storage:', err);
  }
  return null;
}

function AppContent() {
  const { user, profile, loading: authLoading, userName: authUserName, signOut, isDemo, updateLanguagePreference } = useAuth();
  const { language, setLanguage } = useLanguage();

  const initialSession = useMemo(() => loadStoredSession(), []);

  const [stage, setStage] = useState<AppStage>(() => {
    // If logged out initially, force login stage
    if (!user && !isDemo && !initialSession) return 'login';
    return initialSession?.stage || 'login';
  });

  const [selectedState, setSelectedState] = useState<string>(initialSession?.selectedState || 'Madhya Pradesh');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(initialSession?.selectedDistrict || 'Bhopal');
  const [welcomeKey, setWelcomeKey] = useState<number>(0);

  const profileLanguageLoadedRef = useRef(false);

  // Sync user profile preferred language into LanguageContext ONCE on initial profile load
  useEffect(() => {
    if (profile?.preferred_language && !profileLanguageLoadedRef.current) {
      profileLanguageLoadedRef.current = true;
      if (profile.preferred_language === 'en' || profile.preferred_language === 'hi') {
        if (profile.preferred_language !== language) {
          setLanguage(profile.preferred_language);
        }
      }
    }
  }, [profile?.preferred_language, language, setLanguage]);

  // When language changes in UI and user is authenticated, sync to Supabase profile
  useEffect(() => {
    if (user && profile && profile.preferred_language !== language) {
      updateLanguagePreference(language);
    }
  }, [language, user, profile, updateLanguagePreference]);


  // If user is authenticated or demo, move past login if at login stage
  useEffect(() => {
    if (!authLoading) {
      if ((user || isDemo) && stage === 'login') {
        const savedStage = initialSession?.stage && initialSession.stage !== 'login' ? initialSession.stage : 'map';
        setStage(savedStage);
      } else if (!user && !isDemo) {
        setStage('login');
      }
    }
  }, [user, isDemo, authLoading, initialSession?.stage]);

  // Sync session state to storage whenever it changes
  useEffect(() => {
    if (user || isDemo) {
      try {
        localStorage.setItem(
          SESSION_STORAGE_KEY,
          JSON.stringify({
            stage,
            userName: authUserName,
            selectedState,
            selectedDistrict,
          })
        );
      } catch (err) {
        console.warn('Could not save session state:', err);
      }
    }
  }, [stage, authUserName, selectedState, selectedDistrict, user, isDemo]);

  // 1. Handle Login
  const handleLogin = useCallback((_name: string) => {
    setStage('map');
  }, []);

  // 2. Handle Logout
  const handleLogout = useCallback(async () => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem('agrioptima_farm_params_v1');
      localStorage.removeItem('agrioptima_farm_decision_v1');
    } catch {}
    await signOut();
    setStage('login');
  }, [signOut]);

  // 3. Handle Location Confirmation from Map & District Modal
  const handleConfirmLocation = useCallback(
    (stateName: string, districtName: string) => {
      setSelectedState(stateName);
      setSelectedDistrict(districtName);
      setStage('dashboard');
    },
    []
  );

  // 4. Handle Change Farm (Return to Map)
  const handleChangeFarm = useCallback(() => {
    setWelcomeKey((k) => k + 1);
    setStage('map');
  }, []);

  // Keyboard: Escape returns to map when in dashboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (stage === 'dashboard' && e.key === 'Escape') {
        handleChangeFarm();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [stage, handleChangeFarm]);

  // Loading state while checking active Supabase session
  if (authLoading) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center font-sans text-[var(--ink)] bg-[var(--surface)]">
        <WorldBackground variant="ambient" />
        <div className="relative z-10 flex flex-col items-center gap-3">
          <div className="h-9 w-9 animate-spin rounded-full border-2 border-[var(--field-tint)] border-t-[var(--field)]" />
          <span className="text-xs font-medium text-[var(--ink-soft)]">
            {language === 'hi' ? 'सत्र लोड हो रहा है...' : 'Restoring secure session…'}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden font-sans text-[var(--ink)]">
      {/* Persistent living-world atmosphere — one daylight world, never unmounted */}
      <WorldBackground variant="ambient" />

      {/* Multilingual Coming Soon Modal (accessible anywhere) */}
      <LanguageComingSoonModal />

      {/* One continuous world: the pages morph into one another rather than
          cutting, and the atmosphere behind them never unmounts. Order is the
          farmer's position in the journey, so Back travels back. */}
      <StageSwap stageKey={stage} order={stage === 'login' ? 1 : stage === 'map' ? 2 : 3}>
        {/* 1. LOGIN SCREEN */}
        {stage === 'login' && <LoginScreen onLogin={handleLogin} />}

        {/* 2. INDIA MAP / STATE & DISTRICT SELECTION */}
        {stage === 'map' && (
          <WelcomeScreen
            key={welcomeKey}
            userName={authUserName}
            onLogout={handleLogout}
            onConfirmLocation={handleConfirmLocation}
          />
        )}

        {/* 3. MAIN FARM INTELLIGENCE DASHBOARD (guided Pages 3–5 live inside) */}
        {stage === 'dashboard' && (
          <MainScreen
            key={`${selectedState}-${selectedDistrict}`}
            userName={authUserName}
            onBack={handleChangeFarm}
            onLogout={handleLogout}
            initialState={selectedState}
            initialDistrict={selectedDistrict}
          />
        )}
      </StageSwap>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}
