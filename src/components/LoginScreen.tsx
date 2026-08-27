import React, { useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  User,
  Sprout,
  CloudRain,
  Bot,
  Eye,
  EyeOff,
  Phone,
} from 'lucide-react';
import { usePrefersReducedMotion, useMouseParallax, useMounted } from '@/lib/hooks';
import { useLanguage } from '@/i18n/LanguageContext';
import { LegalModal } from '@/components/LegalModals';
import { JourneyNav } from '@/components/JourneyNav';
import { FarmDigitalTwin } from '@/components/FarmDigitalTwin';
import { AIAgentOrb } from '@/components/AIAgentOrb';
import { MagneticButton } from '@/components/ui/motion';

interface LoginScreenProps {
  onLogin: (userName: string) => void;
}

/**
 * DISCOVER + ENTER — the first beat of the connected flow.
 * The living farm digital-twin is the hero (the promise: "your farm"), the
 * intelligence core hovers within the sign-in panel (the promise: "powered by
 * intelligence"). Auth contract is preserved verbatim; only the presentation
 * is rebuilt around the design system.
 */
export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);
  const reduced = usePrefersReducedMotion();
  const { language } = useLanguage();
  const isHi = language === 'hi';
  const mounted = useMounted(60);
  const twinParallax = useMouseParallax<HTMLDivElement>(10, 3);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      onLogin(identifier.trim() || (isHi ? 'किसान मित्र' : 'Demo Farmer'));
    }, reduced ? 50 : 300);
  };

  const handleDemoLogin = () => {
    setLoading(true);
    setTimeout(() => {
      onLogin(isHi ? 'किसान मित्र' : 'Demo Farmer');
    }, reduced ? 50 : 200);
  };

  // staggered entrance helper
  const rise = (i: number): React.CSSProperties =>
    reduced
      ? {}
      : {
        opacity: mounted ? 1 : 0,
        transform: mounted ? 'none' : 'translateY(18px)',
        transition: `opacity 0.7s var(--ease-out) ${i * 90}ms, transform 0.8s var(--ease-out) ${i * 90}ms`,
      };

  const capabilities = [
    { icon: Sprout, en: 'AI crop plan', hi: 'AI फसल योजना' },
    { icon: CloudRain, en: 'Live weather & mandi', hi: 'लाइव मौसम व मंडी' },
    { icon: Bot, en: '24/7 Sentinel', hi: '24/7 सेंटीनेल' },
  ];

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-hidden text-[var(--ink)] selection:bg-[var(--field-tint)] selection:text-[var(--field-deep)]">
      {/* Floating chrome — brand + language only; the journey has not begun yet */}
      <JourneyNav stage={0} />

      {/* ================================================================= */}
      {/* HERO STAGE                                                        */}
      {/* ================================================================= */}
      <main className="relative z-10 flex flex-1 items-center px-5 pb-4 pt-24 sm:px-8 sm:pt-28">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-8">
          {/* ---------------------------------------------------------- */}
          {/* LEFT — thesis headline + living twin                        */}
          {/* ---------------------------------------------------------- */}
          <div className="lg:col-span-7">
            <div className="max-w-xl" style={rise(0)}>
              <div className="t-eyebrow flex items-center gap-2.5">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-pulse-ring rounded-full bg-[var(--field)]" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--field)]" />
                </span>
                {isHi ? 'स्वायत्त कृषि बुद्धिमत्ता' : 'Autonomous farm intelligence'}
              </div>

              <h1 className="t-display mt-4 text-[var(--ink)]">
                {isHi ? (
                  <>
                    आपका खेत।
                    <br />
                    <span className="text-field">बुद्धिमत्ता से</span>
                    <br />
                    संचालित।
                  </>
                ) : (
                  <>
                    Your farm.
                    <br />
                    Powered by
                    <br />
                    <span className="text-field">intelligence.</span>
                  </>
                )}
              </h1>

              <p className="t-lead mt-5 max-w-md text-pretty">
                {isHi
                  ? 'आपकी मिट्टी, पानी, बजट और मौसम को पढ़कर एक जीवंत डिजिटल खेत — जो अधिकतम लाभ और कम जोखिम के लिए हर निर्णय सुझाता है।'
                  : 'A living digital twin of your land that reads your soil, water, budget and weather — then plans every decision for higher income and lower risk.'}
              </p>

              {/* inline signature capability row (not boxed cards) */}
              <div
                className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2"
                style={rise(1)}
              >
                {capabilities.map((c, i) => {
                  const Icon = c.icon;
                  return (
                    <React.Fragment key={c.en}>
                      {i > 0 && (
                        <span className="hidden h-4 w-px bg-[var(--line-strong)] sm:block" aria-hidden />
                      )}
                      <span className="flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ink-soft)]">
                        <Icon size={15} className="text-[var(--field)]" />
                        {isHi ? c.hi : c.en}
                      </span>
                    </React.Fragment>
                  );
                })}
              </div>
            </div>

            {/* living farm twin — the object that carries through the flow */}
            <div
              ref={twinParallax}
              className="relative mt-6 hidden sm:block"
              style={rise(2)}
            >
              <FarmDigitalTwin
                height={340}
                interactive
                showWeather
                className="w-full"
              />
              <span className="t-eyebrow absolute bottom-1 left-1 text-[var(--ink-ghost)]">
                {isHi ? 'लाइव डिजिटल फार्म ट्विन' : 'Live digital farm twin'}
              </span>
            </div>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* RIGHT — floating sign-in panel with intelligence core       */}
          {/* ---------------------------------------------------------- */}
          <div className="lg:col-span-5" style={rise(1)}>
            <div className="panel-glass relative mx-auto w-full max-w-md overflow-hidden p-6 sm:p-8">
              {/* soft field glow in the corner for depth */}
              <div
                className="pointer-events-none absolute -right-16 -top-16 h-40 w-40 rounded-full blur-3xl"
                style={{ background: 'var(--glow-field)' }}
                aria-hidden
              />

              <div className="relative flex items-center gap-3">
                <div className="shrink-0">
                  <AIAgentOrb state="idle" size={58} />
                </div>
                <div>
                  <h2 className="t-h3 text-[var(--ink)]">
                    {isHi ? 'वापसी पर स्वागत है' : 'Welcome back'}
                  </h2>
                  <p className="text-sm text-[var(--ink-soft)]">
                    {isHi ? 'अपने खेत की बुद्धिमत्ता में प्रवेश करें' : 'Sign in to your farm intelligence'}
                  </p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="relative mt-6 space-y-4">
                {/* Mobile or Email */}
                <div>
                  <label htmlFor="login-id" className="mb-1.5 block text-xs font-semibold text-[var(--ink-soft)]">
                    {isHi ? 'मोबाइल नंबर या ईमेल' : 'Mobile number or email'}
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--ink-ghost)]">
                      <User size={16} />
                    </span>
                    <input
                      id="login-id"
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={isHi ? '98765 43210 या farmer@agri.in' : '98765 43210 or farmer@example.com'}
                      className="field-input !pl-10 text-sm"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="mb-1.5 flex items-center justify-between">
                    <label htmlFor="login-pw" className="block text-xs font-semibold text-[var(--ink-soft)]">
                      {isHi ? 'पासवर्ड' : 'Password'}
                    </label>
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() =>
                        alert(
                          isHi
                            ? 'पासवर्ड रीसेट लिंक आपके नंबर पर भेजा गया है।'
                            : 'Password reset link sent to your registered mobile.'
                        )
                      }
                      className="text-[11px] font-semibold text-[var(--field)] transition-colors hover:text-[var(--field-deep)] focus:outline-none"
                    >
                      {isHi ? 'पासवर्ड भूल गए?' : 'Forgot password?'}
                    </button>
                  </div>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5 text-[var(--ink-ghost)]">
                      <Lock size={16} />
                    </span>
                    <input
                      id="login-pw"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isHi ? '••••••••' : 'Enter your password'}
                      className="field-input !pl-10 !pr-10 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? (isHi ? 'पासवर्ड छिपाएं' : 'Hide password') : (isHi ? 'पासवर्ड दिखाएं' : 'Show password')}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-[var(--ink-ghost)] transition-colors hover:text-[var(--ink-soft)]"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Primary Login Button */}
                <MagneticButton
                  type="submit"
                  disabled={loading}
                  className="btn btn-primary group w-full text-sm disabled:opacity-60"
                >
                  <span>{loading ? (isHi ? 'प्रवेश हो रहा है...' : 'Signing in…') : (isHi ? 'लॉगिन करें' : 'Sign in')}</span>
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </MagneticButton>

                {/* Divider */}
                <div className="my-1 flex items-center gap-3">
                  <div className="h-px flex-1 bg-[var(--line)]" />
                  <span className="shrink-0 text-[11px] text-[var(--ink-ghost)]">
                    {isHi ? 'या जारी रखें' : 'or continue with'}
                  </span>
                  <div className="h-px flex-1 bg-[var(--line)]" />
                </div>

                {/* Alternative Quick Sign-in */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    className="inset flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-[var(--ink-soft)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
                  >
                    <span aria-hidden>🌐</span>
                    <span>{isHi ? 'गूगल' : 'Google'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    className="inset flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold text-[var(--ink-soft)] transition-colors hover:border-[var(--line-strong)] hover:text-[var(--ink)]"
                  >
                    <Phone size={14} className="text-[var(--field)]" />
                    <span>{isHi ? 'फोन OTP' : 'Phone OTP'}</span>
                  </button>
                </div>

                {/* Quick 1-Click Demo Farmer */}
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={loading}
                  className="chip chip-field w-full justify-center py-3 text-xs disabled:opacity-60"
                >
                  <Sprout size={14} />
                  <span>{isHi ? 'किसान मित्र डेमो के रूप में प्रवेश करें' : 'Continue as Demo Farmer (1-click)'}</span>
                </button>
              </form>

              {/* Sign-up */}
              <div className="relative mt-5 border-t border-[var(--line)] pt-4 text-center text-xs text-[var(--ink-soft)]">
                <span>{isHi ? 'नया खाता बनाना चाहते हैं? ' : 'New here? '}</span>
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  className="font-semibold text-[var(--field)] transition-colors hover:text-[var(--field-deep)]"
                >
                  {isHi ? 'नया खाता बनाएं' : 'Create an account'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* ================================================================= */}
      {/* FOOTER                                                            */}
      {/* ================================================================= */}
      <footer className="relative z-10 px-5 py-4 text-xs text-[var(--ink-faint)] sm:px-8">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3">
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
