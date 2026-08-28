import React, { useEffect, useState } from 'react';
import {
  ArrowRight,
  ShieldCheck,
  Lock,
  User,
  Sprout,
  Eye,
  EyeOff,
  Phone,
} from 'lucide-react';
import { usePrefersReducedMotion, useMounted } from '@/lib/hooks';
import { useLanguage } from '@/i18n/LanguageContext';
import { LegalModal } from '@/components/LegalModals';
import { JourneyNav } from '@/components/JourneyNav';
import { FarmDigitalTwin } from '@/components/FarmDigitalTwin';
import { MagneticButton } from '@/components/ui/motion';

interface LoginScreenProps {
  onLogin: (userName: string) => void;
}

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
 * The land is the hero: the thesis and the sign-in sit above a horizon, and the
 * living twin runs the full width beneath them, so the farm the farmer is about
 * to log into is already breathing before they type anything. The gate is a
 * ruled column, not a card — the only vertical hairline on the page separates
 * "what this does" from "come in".
 *
 * VIEWPORT CONTRACT: on a laptop the whole thing — thesis, gate, farm, footer —
 * has to land inside the first screen, because a farm twin below the fold is a
 * farm twin nobody sees. So from `lg` up this is a three-band column of exactly
 * `100vh`: the login band takes the slack and centres in it, the horizon is a
 * share of the viewport height rather than a fixed 340px, and the footer is a
 * hairline. Below `lg` the bands stack and the page scrolls normally — squeezing
 * a phone into one screen would only clip or overlap things.
 *
 * The auth contract is untouched: same handlers, same demo shortcuts, same
 * legal modals. Only the presentation changed.
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

  /* The horizon is a proportion of the screen, not a constant: 340px is a third
     of a 1080p window but nearly half of a 768px laptop, which is exactly what
     used to push the farm under the fold. Clamped so it never gets too small to
     read or so tall that the crop sprites (sized in px) look miniature. */
  const [vh, setVh] = useState(() => (typeof window === 'undefined' ? 820 : window.innerHeight));
  useEffect(() => {
    const onResize = () => setVh(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  const horizonH = Math.round(Math.max(224, Math.min(344, vh * 0.31)));
  /* The board is 84% x 56% of its box and lies back 54 degrees, so a full-bleed
     box at this height reads as a plank with its far corners off both edges of
     the window. Tying the width to the height keeps it a field at every size. */
  const horizonW = Math.min(1500, Math.round(horizonH * 4.4));

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

  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden text-[var(--ink)] selection:bg-[var(--field-tint)] selection:text-[var(--field-deep)] lg:h-screen">
      {/* Floating chrome — brand + language only; the journey has not begun yet */}
      <JourneyNav stage={0} />

      {/* ================================================================= */}
      {/* ABOVE THE HORIZON — the thesis, and the way in                     */}
      {/* This band absorbs whatever height the farm and footer do not need,  */}
      {/* and centres itself in it, so the slack reads as air rather than as  */}
      {/* a gap above the land.                                              */}
      {/* It is deliberately NOT `min-h-0`: allowing it to be squeezed below   */}
      {/* its own content is what let the copy spill down over the land in the */}
      {/* first place. Without it, a window too short for the composition      */}
      {/* scrolls — which is honest — instead of overlapping.                 */}
      {/* ================================================================= */}
      <main className="relative z-10 mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 pb-8 pt-24 sm:px-8 sm:pt-28 lg:pb-3 lg:pt-[4.5rem] xl:max-w-7xl">
        <div className="grid grid-cols-1 items-start gap-10 lg:grid-cols-12 lg:items-center lg:gap-12">
          {/* ---------------------------------------------------------- */}
          {/* THESIS                                                      */}
          {/* ---------------------------------------------------------- */}
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
          </div>

          {/* ---------------------------------------------------------- */}
          {/* THE GATE — a ruled column, not a card                       */}
          {/* ---------------------------------------------------------- */}
          <div
            className="lg:col-span-5 lg:border-l lg:border-[var(--line)] lg:pl-10"
            style={rise(1)}
          >
            <div className="w-full max-w-sm">
              <h2 className="t-h3 text-[var(--ink)]">{isHi ? 'प्रवेश करें' : 'Sign in'}</h2>
              <p className="mt-1 text-sm text-[var(--ink-soft)]">
                {isHi
                  ? 'आपका खेत वहीं है जहाँ आपने छोड़ा था।'
                  : 'Your farm is where you left it.'}
              </p>

              <form onSubmit={handleSubmit} className="mt-7 space-y-6 lg:mt-4 lg:space-y-3">
                {/* Mobile or Email */}
                <div>
                  <label
                    htmlFor="login-id"
                    className="t-eyebrow mb-1 block text-[0.6rem] text-[var(--ink-ghost)]"
                  >
                    {isHi ? 'मोबाइल नंबर या ईमेल' : 'Mobile number or email'}
                  </label>
                  <div className="relative">
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-[var(--ink-ghost)]">
                      <User size={15} />
                    </span>
                    <input
                      id="login-id"
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={isHi ? '98765 43210 या farmer@agri.in' : '98765 43210 or farmer@example.com'}
                      className="line-input pl-7 text-sm"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="mb-1 flex items-baseline justify-between">
                    <label
                      htmlFor="login-pw"
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
                    <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center text-[var(--ink-ghost)]">
                      <Lock size={15} />
                    </span>
                    <input
                      id="login-pw"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isHi ? '••••••••' : 'Enter your password'}
                      className="line-input pl-7 pr-9 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={showPassword ? (isHi ? 'पासवर्ड छिपाएं' : 'Hide password') : (isHi ? 'पासवर्ड दिखाएं' : 'Show password')}
                      className="absolute inset-y-0 right-0 flex items-center pr-1 text-[var(--ink-ghost)] transition-colors hover:text-[var(--ink-soft)]"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Primary — sign in */}
                <div className="space-y-2.5 pt-1 lg:pt-0">
                  <MagneticButton
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary group w-full disabled:opacity-60"
                  >
                    <span>{loading ? (isHi ? 'प्रवेश हो रहा है...' : 'Signing in…') : (isHi ? 'लॉगिन करें' : 'Sign in')}</span>
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </MagneticButton>

                  {/* One-click demo — the fastest way onto the land */}
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

                {/* Divider */}
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-[var(--line)]" />
                  <span className="shrink-0 text-[11px] text-[var(--ink-ghost)]">
                    {isHi ? 'या जारी रखें' : 'or continue with'}
                  </span>
                  <div className="h-px flex-1 bg-[var(--line)]" />
                </div>

                {/* Alternative quick sign-in */}
                <div className="grid grid-cols-2 gap-2.5">
                  <button type="button" onClick={handleDemoLogin} className="btn btn-ghost btn-sm">
                    <GlobeMark />
                    <span>{isHi ? 'गूगल' : 'Google'}</span>
                  </button>
                  <button type="button" onClick={handleDemoLogin} className="btn btn-ghost btn-sm">
                    <Phone size={14} className="text-[var(--field)]" />
                    <span>{isHi ? 'फोन OTP' : 'Phone OTP'}</span>
                  </button>
                </div>
              </form>

              {/* Sign-up */}
              <p className="mt-6 text-xs text-[var(--ink-soft)] lg:mt-3">
                <span>{isHi ? 'नया खाता बनाना चाहते हैं? ' : 'New here? '}</span>
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  className="font-semibold text-[var(--field)] transition-colors hover:text-[var(--field-deep)]"
                >
                  {isHi ? 'नया खाता बनाएं' : 'Create an account'}
                </button>
              </p>
            </div>
          </div>
        </div>
      </main>

      {/* ================================================================= */}
      {/* THE HORIZON — one living farm, anchoring the foot of the screen    */}
      {/* Its own sky is the separation between the copy above and the land,  */}
      {/* so no rule or extra spacing is needed between the two bands. The    */}
      {/* width is capped: full-bleed at this height turned the field into a   */}
      {/* plank and pushed its far corners off both edges of the window.      */}
      {/* ================================================================= */}
      <div className="relative z-0 mt-8 shrink-0 lg:mt-0" style={rise(2)}>
        <div className="mx-auto w-full" style={{ maxWidth: horizonW }}>
          <FarmDigitalTwin height={horizonH} interactive showWeather aiState="idle" className="w-full" />
        </div>
      </div>

      {/* ================================================================= */}
      {/* FOOTER                                                            */}
      {/* ================================================================= */}
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
