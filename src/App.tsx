import React, { useCallback, useEffect, useState, useMemo } from 'react';
import { LoginScreen } from '@/components/LoginScreen';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { InitializingScreen } from '@/components/InitializingScreen';
import { MainScreen } from '@/components/MainScreen';
import { LanguageProvider } from '@/i18n/LanguageContext';
import { LanguageComingSoonModal } from '@/components/LanguageComingSoonModal';

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
  const initialSession = useMemo(() => loadStoredSession(), []);

  const [stage, setStage] = useState<AppStage>(initialSession?.stage || 'login');
  const [userName, setUserName] = useState<string>(initialSession?.userName || 'Demo Farmer');
  const [selectedState, setSelectedState] = useState<string>(initialSession?.selectedState || 'Madhya Pradesh');
  const [selectedDistrict, setSelectedDistrict] = useState<string>(initialSession?.selectedDistrict || 'Bhopal');
  const [welcomeKey, setWelcomeKey] = useState<number>(0);

  // Sync session state to storage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem(
        SESSION_STORAGE_KEY,
        JSON.stringify({
          stage,
          userName,
          selectedState,
          selectedDistrict,
        })
      );
    } catch (err) {
      console.warn('Could not save session state:', err);
    }
  }, [stage, userName, selectedState, selectedDistrict]);

  // 1. Handle Login
  const handleLogin = useCallback((name: string) => {
    const finalName = name || 'Demo Farmer';
    setUserName(finalName);
    setStage('map');
  }, []);

  // 2. Handle Logout
  const handleLogout = useCallback(() => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem('agrioptima_farm_params_v1');
      localStorage.removeItem('agrioptima_farm_decision_v1');
    } catch {}
    setUserName('Demo Farmer');
    setStage('login');
  }, []);

  // 3. Handle Location Confirmation from Map & District Modal
  const handleConfirmLocation = useCallback(
    (stateName: string, districtName: string) => {
      setSelectedState(stateName);
      setSelectedDistrict(districtName);
      setStage('initializing');
    },
    []
  );

  // 4. Handle Initialization Ready
  const handleInitializationReady = useCallback(() => {
    setStage('dashboard');
  }, []);

  // 5. Handle Change Farm (Return to Map)
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

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#FAF7F2] font-sans text-[#1F2937]">
      {/* Atmospheric Seafoam / Mint-Aqua Ambient Glow from Right & Bottom-Right */}
      <div
        className="pointer-events-none fixed -bottom-24 -right-24 z-0 h-[600px] w-[600px] sm:h-[800px] sm:w-[800px] lg:h-[1050px] lg:w-[1050px] rounded-full bg-[radial-gradient(circle_at_bottom_right,_rgba(142,219,206,0.68)_0%,_rgba(168,230,219,0.48)_32%,_rgba(198,240,232,0.28)_55%,_rgba(228,248,243,0.12)_75%,_transparent_90%)] blur-3xl animate-ambient-bloom"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none fixed top-1/3 -right-24 z-0 h-[450px] w-[450px] sm:h-[650px] sm:w-[650px] rounded-full bg-[radial-gradient(circle_at_center,_rgba(160,226,215,0.36)_0%,_rgba(195,239,231,0.18)_45%,_transparent_75%)] blur-3xl"
        aria-hidden="true"
      />

      {/* Multilingual Coming Soon Modal (accessible anywhere) */}
      <LanguageComingSoonModal />

      {/* 1. LOGIN SCREEN */}
      {stage === 'login' && <LoginScreen onLogin={handleLogin} />}

      {/* 2. INDIA MAP / STATE & DISTRICT SELECTION */}
      {stage === 'map' && (
        <WelcomeScreen
          key={welcomeKey}
          userName={userName}
          onLogout={handleLogout}
          onConfirmLocation={handleConfirmLocation}
        />
      )}

      {/* 3. INITIALIZING TRANSITION SCREEN */}
      {stage === 'initializing' && (
        <InitializingScreen
          stateName={selectedState}
          districtName={selectedDistrict}
          onReady={handleInitializationReady}
        />
      )}

      {/* 4. MAIN FARM INTELLIGENCE DASHBOARD */}
      {stage === 'dashboard' && (
        <MainScreen
          userName={userName}
          onBack={handleChangeFarm}
          onLogout={handleLogout}
          initialState={selectedState}
          initialDistrict={selectedDistrict}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AppContent />
    </LanguageProvider>
  );
}
