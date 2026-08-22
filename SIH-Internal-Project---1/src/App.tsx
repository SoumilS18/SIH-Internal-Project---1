import React, { useCallback, useEffect, useState } from 'react';
import { LoginScreen } from '@/components/LoginScreen';
import { WelcomeScreen } from '@/components/WelcomeScreen';
import { InitializingScreen } from '@/components/InitializingScreen';
import { MainScreen } from '@/components/MainScreen';
import { LanguageProvider } from '@/i18n/LanguageContext';
import { LanguageComingSoonModal } from '@/components/LanguageComingSoonModal';

type AppStage = 'login' | 'map' | 'initializing' | 'dashboard';

function AppContent() {
  const [stage, setStage] = useState<AppStage>('login');
  const [userName, setUserName] = useState<string>('Demo Farmer');
  const [selectedState, setSelectedState] = useState<string>('Madhya Pradesh');
  const [selectedDistrict, setSelectedDistrict] = useState<string>('Bhopal');
  const [welcomeKey, setWelcomeKey] = useState<number>(0);

  // 1. Handle Login
  const handleLogin = useCallback((name: string) => {
    setUserName(name || 'Demo Farmer');
    setStage('map');
  }, []);

  // 2. Handle Logout
  const handleLogout = useCallback(() => {
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
    <div className="relative h-screen w-screen overflow-hidden bg-forest-950 font-sans text-cream-100">
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
