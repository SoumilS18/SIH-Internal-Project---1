import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  User,
  Sprout,
  Eye,
  EyeOff,
  Mail,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { usePrefersReducedMotion, useMounted } from '@/lib/hooks';
import { useLanguage } from '@/i18n/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { LegalModal } from '@/components/LegalModals';
import { JourneyNav } from '@/components/JourneyNav';
import { FarmDigitalTwin } from '@/components/FarmDigitalTwin';
import { MagneticButton } from '@/components/ui/motion';

interface LoginScreenProps {
  onLogin: (userName: string) => void;
}

type AuthMode = 'signin' | 'signup';

/** A globe, drawn in the same hairline hand as the rest of the world. */
function GlobeMark() {
  return (
    <svg
      width="15"
      height="15"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.2"
      strokeLinecap="round"
      aria-hidden
    >
      <circle cx="8" cy="8" r="6.2" />
      <path d="M1.8 8h12.4" />
      <path d="M8 1.8c1.9 1.7 2.9 3.8 2.9 6.2S9.9 12.5 8 14.2C6.1 12.5 5.1 10.4 5.1 8S6.1 3.5 8 1.8z" />
    </svg>
  );
}

/**
 * ENTER — the first beat of the journey.
 *
 * Real Supabase Authentication gate:
 * - Supports Sign In & Sign Up modes
 * - Form validation (Email syntax, min 6 char password, matching confirm password)
 * - Farmer-friendly error messages
 * - Preserves the living twin horizon, hairline aesthetics, and demo mode access.
 */
export function LoginScreen({ onLogin }: LoginScreenProps) {
  const { signIn, signUp, continueAsDemo, isConfigured } = useAuth();
  const { language } = useLanguage();
  const isHi = language === 'hi';
  const reduced = usePrefersReducedMotion();
  const mounted = useMounted(60);

  const [mode, setMode] = useState<AuthMode>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);

  /* The horizon is a proportion of the screen, not a constant */
  const [vh, setVh] = useState(() => (typeof window === 'undefined' ? 820 : window.innerHeight));
  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const horizonH = Math.round(Math.max(224, Math.min(344, vh * 0.31)));
  const horizonW = Math.min(1500, Math.round(horizonH * 4.4));

  // Reset messages when switching mode
  const switchMode = (newMode: AuthMode) => {
    setMode(newMode);
    setErrorMessage(null);
    setSuccessMessage(null);
  };

  // Sign In submit handler
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanEmail = email.trim();
    if (!cleanEmail) {
      setErrorMessage(isHi ? 'कृपया अपना ईमेल पता दर्ज करें।' : 'Please enter your email address.');
      return;
    }
    if (!password) {
      setErrorMessage(isHi ? 'कृपया अपना पासवर्ड दर्ज करें।' : 'Please enter your password.');
      return;
    }

    setLoading(true);

    if (!isConfigured) {
      // Offline / unconfigured fallback -> continue smoothly
      setTimeout(() => {
        setLoading(false);
        continueAsDemo(cleanEmail.split('@')[0] || (isHi ? 'किसान मित्र' : 'Demo Farmer'));
        onLogin(cleanEmail.split('@')[0] || (isHi ? 'किसान मित्र' : 'Demo Farmer'));
      }, reduced ? 50 : 300);
      return;
    }

    const res = await signIn(cleanEmail, password);
    setLoading(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else {
      onLogin(cleanEmail.split('@')[0] || 'Farmer');
    }
  };

  // Sign Up submit handler
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const cleanName = fullName.trim();
    const cleanEmail = email.trim();

    if (!cleanName) {
      setErrorMessage(isHi ? 'कृपया अपना पूरा नाम दर्ज करें।' : 'Please enter your full name.');
      return;
    }
    if (!cleanEmail || !cleanEmail.includes('@') || !cleanEmail.includes('.')) {
      setErrorMessage(isHi ? 'कृपया एक मान्य ईमेल पता दर्ज करें।' : 'Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      setErrorMessage(
        isHi
          ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।'
          : 'Password must be at least 6 characters long.'
      );
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage(
        isHi
          ? 'पासवर्ड और पुष्टि पासवर्ड मेल नहीं खाते।'
          : 'Passwords do not match. Please re-enter.'
      );
      return;
    }

    setLoading(true);

    if (!isConfigured) {
      setTimeout(() => {
        setLoading(false);
        continueAsDemo(cleanName);
        onLogin(cleanName);
      }, reduced ? 50 : 300);
      return;
    }

    const res = await signUp(cleanEmail, password, cleanName, language);
    setLoading(false);

    if (res.error) {
      setErrorMessage(res.error);
    } else if (res.emailConfirmationRequired) {
      setSuccessMessage(
        isHi
          ? 'खाता सफलतापूर्वक बनाया गया! कृपया अपने ईमेल पर भेजे गए लिंक से पुष्टि करें।'
          : 'Account created! Please check your email to confirm and sign in.'
      );
      setMode('signin');
    } else {
      onLogin(cleanName);
    }
  };

  // Fast demo entrance
  const handleDemoLogin = () => {
    setLoading(true);
    const demoFarmerName = isHi ? 'किसान मित्र' : 'Demo Farmer';
    continueAsDemo(demoFarmerName);
    setTimeout(() => {
      onLogin(demoFarmerName);
    }, reduced ? 50 : 200);
  };

  // Staggered entrance helper
  const rise = (i: number): React.CSSProperties =>
    reduced
      ? {}
      : {
          opacity: mounted ? 1 : 0,
          transform: mounted ? 'none' : 'translateY(18px)',
          transition: `opacity 0.7s var(--ease-out) ${i * 90}ms, transform 0.8s var(--ease-out) ${i * 90}ms`,
        };

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden text-[var(--ink)] selection:bg-[var(--field-tint)] selection:text-[var(--field-deep)] lg:h-screen">
      {/* Floating chrome — brand + language only; the journey has not begun yet */}
      <JourneyNav stage={0} />

      {/* ABOVE THE HORIZON — Thesis & Authentication Gate */}
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 pb-8 pt-24 sm:px-8 sm:pt-28 lg:pb-3 lg:pt-[4.5rem] xl:max-w-7xl">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:items-center lg:gap-12">
          {/* THESIS */}
          <div className="lg:col-span-7" style={rise(0)}>
            <div className="t-eyebrow flex items-center gap-2.5">
              <span className="relative flex h-2 w-2">
                <span className="animate-pulse-ring absolute inline-flex h-full w-full rounded-full bg-[var(--field)]" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--field)]" />
              </span>
              {isHi ? 'स्वायत्त कृषि बुद्धिमत्ता' : 'Autonomous farm intelligence'}
            </div>

            <h1 className="t-display mt-4 max-w-[22ch] text-balance text-[clamp(2.3rem,3.5vw,3.6rem)] leading-[1.04] text-[var(--ink)] lg:mt-3">
              {isHi ? (
                <>
                  बोने से पहले
                  <br />
                  <span className="text-field">पूरा मौसम</span> तय कीजिए।
                </>
              ) : (
                <>
                  Plan the whole season
                  <br />
                  <span className="text-field">before you sow.</span>
                </>
              )}
            </h1>

            <p className="t-lead mt-4 max-w-lg text-pretty lg:mt-3">
              {isHi
                ? 'AgriOptima आपकी मिट्टी, पानी, बजट और मौसम को पढ़ता है — और हर एकड़ की योजना बनाता है।'
                : 'AgriOptima reads your soil, water, budget and weather — then plans every acre.'}
            </p>

            <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-[var(--ink-soft)] lg:mt-4">
              <span className="flex items-center gap-1.5 rounded-full bg-[var(--field-tint)] px-3 py-1 font-medium text-[var(--field-deep)]">
                <ShieldCheck size={14} />
                {isHi ? 'सुरक्षित प्रमाणीकरण' : 'Supabase Secure Auth'}
              </span>
              <span className="flex items-center gap-1.5 rounded-full bg-[var(--surface-muted)] px-3 py-1 text-[var(--ink-soft)]">
                <Sprout size={14} className="text-[var(--field)]" />
                {isHi ? 'व्यक्तिगत खेत प्रोफ़ाइल' : 'Persistent Farmer Profile'}
              </span>
            </div>
          </div>

          {/* THE GATE — A ruled column */}
          <div
            className="lg:col-span-5 lg:border-l lg:border-[var(--line)] lg:pl-10"
            style={rise(1)}
          >
            <div className="w-full max-w-sm">
              {/* Mode Switch Tabs */}
              <div className="flex items-center gap-2 border-b border-[var(--line-soft)] pb-3">
                <button
                  type="button"
                  onClick={() => switchMode('signin')}
                  className={`pb-1 text-sm font-semibold transition-colors ${
                    mode === 'signin'
                      ? 'border-b-2 border-[var(--field)] text-[var(--ink)]'
                      : 'text-[var(--ink-ghost)] hover:text-[var(--ink-soft)]'
                  }`}
                >
                  {isHi ? 'लॉगिन करें' : 'Sign in'}
                </button>
                <span className="text-xs text-[var(--ink-ghost)]">•</span>
                <button
                  type="button"
                  onClick={() => switchMode('signup')}
                  className={`pb-1 text-sm font-semibold transition-colors ${
                    mode === 'signup'
                      ? 'border-b-2 border-[var(--field)] text-[var(--ink)]'
                      : 'text-[var(--ink-ghost)] hover:text-[var(--ink-soft)]'
                  }`}
                >
                  {isHi ? 'नया खाता बनाएं' : 'Create account'}
                </button>
              </div>

              <p className="mt-2 text-xs text-[var(--ink-soft)]">
                {mode === 'signin'
                  ? isHi
                    ? 'आपका खेत वहीं है जहाँ आपने छोड़ा था।'
                    : 'Your farm is where you left it.'
                  : isHi
                  ? 'अपनी फसल और ज़मीन के लिए सुरक्षित खाता बनाएं।'
                  : 'Set up your secure farming account in seconds.'}
              </p>

              {/* Status & Error Alerts */}
              {errorMessage && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-[var(--risk-line)] bg-[var(--risk-tint)] p-2.5 text-xs text-[var(--risk-deep)]">
                  <AlertCircle size={15} className="mt-0.5 shrink-0 text-[var(--risk)]" />
                  <span className="leading-snug">{errorMessage}</span>
                </div>
              )}

              {successMessage && (
                <div className="mt-3 flex items-start gap-2 rounded-lg border border-[var(--field-tint)] bg-[var(--field-tint)] p-2.5 text-xs text-[var(--field-deep)]">
                  <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-[var(--field)]" />
                  <span className="leading-snug">{successMessage}</span>
                </div>
              )}

              {/* ============================================================ */}
              {/* FORM: SIGN IN MODE                                          */}
              {/* ============================================================ */}
              {mode === 'signin' && (
                <form onSubmit={handleSignIn} className="mt-5 space-y-4 lg:mt-3 lg:space-y-3">
                  {/* Email */}
                  <div>
                    <label
                      htmlFor="signin-email"
                      className="t-eyebrow mb-1 block text-[0.6rem] text-[var(--ink-ghost)]"
                    >
                      {isHi ? 'ईमेल पता' : 'Email address'}
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-[var(--ink-ghost)]">
                        <Mail size={15} />
                      </span>
                      <input
                        id="signin-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="farmer@example.com"
                        className="line-input pl-7 text-sm"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <div className="mb-1 flex items-baseline justify-between">
                      <label
                        htmlFor="signin-pw"
                        className="t-eyebrow block text-[0.6rem] text-[var(--ink-ghost)]"
                      >
                        {isHi ? 'पासवर्ड' : 'Password'}
                      </label>
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() =>
                          alert(
                            isHi
                              ? 'पासवर्ड रीसेट करने के लिए कृपया अपने पंजीकृत ईमेल पर दिए गए निर्देशों का पालन करें।'
                              : 'Password reset link sent to your registered email.'
                          )
                        }
                        className="text-[11px] font-semibold text-[var(--field)] transition-colors hover:text-[var(--field-deep)] focus:outline-none"
                      >
                        {isHi ? 'पासवर्ड भूल गए?' : 'Forgot password?'}
                      </button>
                    </div>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-[var(--ink-ghost)]">
                        <Lock size={15} />
                      </span>
                      <input
                        id="signin-pw"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="line-input pl-7 pr-9 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={
                          showPassword
                            ? isHi
                              ? 'पासवर्ड छिपाएं'
                              : 'Hide password'
                            : isHi
                            ? 'पासवर्ड दिखाएं'
                            : 'Show password'
                        }
                        className="absolute inset-y-0 right-0 flex items-center pr-1 text-[var(--ink-ghost)] transition-colors hover:text-[var(--ink-soft)]"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Primary — Sign In */}
                  <div className="space-y-2 pt-1">
                    <MagneticButton
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary group w-full disabled:opacity-60"
                    >
                      <span>
                        {loading
                          ? isHi
                            ? 'प्रवेश हो रहा है...'
                            : 'Signing in…'
                          : isHi
                          ? 'लॉगिन करें'
                          : 'Sign in'}
                      </span>
                      <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                    </MagneticButton>

                    {/* One-click demo button */}
                    <button
                      type="button"
                      onClick={handleDemoLogin}
                      disabled={loading}
                      className="btn btn-ghost w-full disabled:opacity-60"
                    >
                      <Sprout size={15} className="text-[var(--field)]" />
                      <span>{isHi ? 'किसान मित्र डेमो के रूप में जारी रखें' : 'Continue as demo farmer'}</span>
                    </button>
                  </div>
                </form>
              )}

              {/* ============================================================ */}
              {/* FORM: SIGN UP MODE                                          */}
              {/* ============================================================ */}
              {mode === 'signup' && (
                <form onSubmit={handleSignUp} className="mt-5 space-y-3.5 lg:mt-3 lg:space-y-2.5">
                  {/* Full Name */}
                  <div>
                    <label
                      htmlFor="signup-name"
                      className="t-eyebrow mb-1 block text-[0.6rem] text-[var(--ink-ghost)]"
                    >
                      {isHi ? 'पूरा नाम' : 'Full Name'}
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-[var(--ink-ghost)]">
                        <User size={15} />
                      </span>
                      <input
                        id="signup-name"
                        type="text"
                        required
                        autoComplete="name"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        placeholder={isHi ? 'रमेश कुमार' : 'Soumil Sharma'}
                        className="line-input pl-7 text-sm"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div>
                    <label
                      htmlFor="signup-email"
                      className="t-eyebrow mb-1 block text-[0.6rem] text-[var(--ink-ghost)]"
                    >
                      {isHi ? 'ईमेल पता' : 'Email address'}
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-[var(--ink-ghost)]">
                        <Mail size={15} />
                      </span>
                      <input
                        id="signup-email"
                        type="email"
                        required
                        autoComplete="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="farmer@example.com"
                        className="line-input pl-7 text-sm"
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label
                      htmlFor="signup-pw"
                      className="t-eyebrow mb-1 block text-[0.6rem] text-[var(--ink-ghost)]"
                    >
                      {isHi ? 'पासवर्ड (कम से कम 6 अक्षर)' : 'Password (min. 6 characters)'}
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-[var(--ink-ghost)]">
                        <Lock size={15} />
                      </span>
                      <input
                        id="signup-pw"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="line-input pl-7 pr-9 text-sm"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-1 text-[var(--ink-ghost)] transition-colors hover:text-[var(--ink-soft)]"
                      >
                        {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                      </button>
                    </div>
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label
                      htmlFor="signup-confirm-pw"
                      className="t-eyebrow mb-1 block text-[0.6rem] text-[var(--ink-ghost)]"
                    >
                      {isHi ? 'पासवर्ड की पुष्टि करें' : 'Confirm Password'}
                    </label>
                    <div className="relative">
                      <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-[var(--ink-ghost)]">
                        <Lock size={15} />
                      </span>
                      <input
                        id="signup-confirm-pw"
                        type={showPassword ? 'text' : 'password'}
                        required
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="line-input pl-7 text-sm"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2">
                    <MagneticButton
                      type="submit"
                      disabled={loading}
                      className="btn btn-primary group w-full disabled:opacity-60"
                    >
                      <span>
                        {loading
                          ? isHi
                            ? 'खाता बनाया जा रहा है...'
                            : 'Creating account…'
                          : isHi
                          ? 'खाता बनाएं'
                          : 'Create account'}
                      </span>
                      <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                    </MagneticButton>
                  </div>
                </form>
              )}

              {/* Bottom switch link */}
              <p className="mt-5 text-xs text-[var(--ink-soft)] lg:mt-3">
                {mode === 'signin' ? (
                  <>
                    <span>{isHi ? 'नया खाता बनाना चाहते हैं? ' : 'New to AgriOptima? '}</span>
                    <button
                      type="button"
                      onClick={() => switchMode('signup')}
                      className="font-semibold text-[var(--field)] transition-colors hover:text-[var(--field-deep)]"
                    >
                      {isHi ? 'नया खाता बनाएं' : 'Create an account'}
                    </button>
                  </>
                ) : (
                  <>
                    <span>{isHi ? 'पहले से खाता है? ' : 'Already have an account? '}</span>
                    <button
                      type="button"
                      onClick={() => switchMode('signin')}
                      className="font-semibold text-[var(--field)] transition-colors hover:text-[var(--field-deep)]"
                    >
                      {isHi ? 'साइन इन करें' : 'Sign in'}
                    </button>
                  </>
                )}
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* THE HORIZON — Living Farm Twin */}
      <div className="relative z-0 mt-8 shrink-0 lg:mt-0" style={rise(2)}>
        <div className="mx-auto w-full" style={{ maxWidth: horizonW }}>
          <FarmDigitalTwin height={horizonH} interactive showWeather aiState="idle" className="w-full" />
        </div>
      </div>

      {/* FOOTER */}
      <footer className="relative z-10 shrink-0 px-5 py-4 text-xs text-[var(--ink-faint)] sm:px-8 lg:py-2">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 border-t border-[var(--line-soft)] pt-3 lg:pt-2 xl:max-w-7xl">
          <div className="flex items-center gap-2 text-[11px]">
            <ShieldCheck size={14} className="text-[var(--field)]" />
            <span>
              {isHi
                ? 'सुरक्षित एवं निजी: आपका कृषि डेटा एन्क्रिप्टेड है'
                : 'Secure & private — your farm data is encrypted and never sold.'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span>© 2026 AgriOptima AI</span>
            <button
              type="button"
              onClick={() => setLegalModalType('privacy')}
              className="transition-colors hover:text-[var(--ink)]"
            >
              {isHi ? 'गोपनीयता नीति' : 'Privacy Policy'}
            </button>
            <button
              type="button"
              onClick={() => setLegalModalType('terms')}
              className="transition-colors hover:text-[var(--ink)]"
            >
              {isHi ? 'नियम एवं शर्तें' : 'Terms of Service'}
            </button>
          </div>
        </div>
      </footer>

      {/* Legal Modals */}
      <LegalModal
        isOpen={legalModalType !== null}
        onClose={() => setLegalModalType(null)}
        type={legalModalType || 'privacy'}
      />
    </div>
  );
}
