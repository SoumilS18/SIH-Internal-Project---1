import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Lock,
  User,
  Leaf,
  Sprout,
  CloudRain,
  Droplets,
  TrendingUp,
  Activity,
  CheckCircle2,
  Quote,
} from 'lucide-react';
import { usePrefersReducedMotion } from '@/lib/hooks';
import { useLanguage } from '@/i18n/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';

interface LoginScreenProps {
  onLogin: (userName: string) => void;
}

const PARTICLES = Array.from({ length: 32 }, (_, id) => ({
  id,
  top: Math.random() * 95,
  left: Math.random() * 98,
  size: 1 + Math.random() * 2.2,
  delay: Math.random() * 5,
  duration: 3 + Math.random() * 5,
  opacity: 0.3 + Math.random() * 0.6,
}));

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const reduced = usePrefersReducedMotion();
  const { t } = useLanguage();
  const particles = useMemo(() => PARTICLES, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      onLogin(identifier.trim() || t('login.demoFarmer'));
    }, reduced ? 50 : 350);
  };

  const handleDemoLogin = () => {
    setLoading(true);
    setTimeout(() => {
      onLogin(t('login.demoFarmer'));
    }, reduced ? 50 : 250);
  };

  // Feature Highlights (2x3 Grid)
  const features = [
    {
      icon: CloudRain,
      label: t('hero.featureWeather'),
    },
    {
      icon: Sprout,
      label: t('hero.featureSoil'),
    },
    {
      icon: TrendingUp,
      label: t('hero.featureEconomics'),
    },
    {
      icon: Droplets,
      label: t('hero.featureIrrigation'),
    },
    {
      icon: ShieldCheck,
      label: t('hero.featureRisk'),
    },
    {
      icon: Activity,
      label: t('hero.featureStress'),
    },
  ];

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-forest-950 text-cream-100 flex flex-col justify-between selection:bg-gold-400 selection:text-forest-950">
      {/* ========================================================================= */}
      {/* SEAMLESS FULL-CANVAS BLENDED BACKGROUND & ATMOSPHERIC ORBIT SYSTEM */}
      {/* ========================================================================= */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden="true">
        {/* Full-bleed agricultural hero visual spanning 100% width and height without elongation */}
        <img
          src="/assets/agri_hero_visual.jpg"
          alt="AgriOptima AI Agricultural Intelligence"
          className="absolute inset-0 h-full w-full object-cover object-[28%_center] opacity-85 brightness-100 contrast-105 saturate-110 select-none"
        />

        {/* Concentric Holographic AI Telemetry Orbit Arcs spanning across center & right */}
        <div className="absolute left-[45%] top-[50%] -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="h-[620px] w-[620px] rounded-full border border-gold-300/[0.12] animate-[spin_160s_linear_infinite]" />
          <div className="absolute -inset-16 rounded-full border border-emerald-400/[0.09] border-dashed animate-[spin_110s_linear_infinite_reverse]" />
          <div className="absolute -inset-36 rounded-full border border-gold-300/[0.06]" />
          <div className="absolute -inset-60 rounded-full border border-emerald-400/[0.05] border-dotted animate-[spin_200s_linear_infinite]" />
        </div>

        {/* Atmospheric Floating Star Particles across the upper sky and dark zones */}
        <div className="absolute inset-0">
          {particles.map((p) => (
            <span
              key={p.id}
              className="absolute rounded-full bg-gold-200"
              style={{
                top: `${p.top}%`,
                left: `${p.left}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                opacity: p.opacity,
                boxShadow: '0 0 6px rgba(255,210,26,0.6)',
                animation: reduced ? undefined : `twinkle ${p.duration}s ease-in-out ${p.delay}s infinite`,
              }}
            />
          ))}
        </div>

        {/* Smooth radial and directional gradient integration */}
        {/* Right card backdrop deepening mask */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(2,21,16,0.92)_20%,rgba(2,21,16,0.6)_55%,transparent_90%)]" />
        
        {/* Top-to-bottom gentle atmospheric vignette */}
        <div className="absolute inset-0 bg-gradient-to-b from-forest-950/70 via-transparent to-forest-950/80" />
        
        {/* Horizontal blend to ensure left text contrast and right card separation */}
        <div className="absolute inset-0 bg-gradient-to-r from-forest-950/40 via-transparent to-forest-950/80" />

        {/* Golden dawn horizon glow on the left */}
        <div className="absolute -left-20 top-1/3 h-[500px] w-[500px] rounded-full bg-gold-400/10 blur-[130px]" />
        
        {/* Glowing emerald AI HUD bloom in center */}
        <div className="absolute left-[35%] top-[45%] h-[400px] w-[400px] rounded-full bg-emerald-500/15 blur-[110px]" />

        {/* Subtle grid texture */}
        <div className="absolute inset-0 grid-texture radial-fade opacity-10" />
      </div>

      {/* ========================================================================= */}
      {/* 1. TOP HEADER BAR */}
      {/* ========================================================================= */}
      <header className="relative z-20 flex shrink-0 items-center justify-between px-5 py-4 sm:px-8 lg:px-12 backdrop-blur-[2px]">
        <div className="flex items-center gap-3">
          <img
            src="/logo.png"
            alt="AgriOptima AI Logo"
            className="h-10 w-10 sm:h-12 sm:w-12 rounded-full object-contain border border-gold-300/40 bg-gradient-to-br from-forest-800 to-forest-950 shadow-[0_0_15px_rgba(255,210,26,0.2)]"
          />
          <div>
            <div className="flex items-center gap-2">
              <span className="font-serif text-lg font-bold tracking-tight text-cream-100 drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
                AgriOptima AI
              </span>
              <span className="hidden font-mono text-[11px] text-gold-300 sm:inline drop-shadow-[0_2px_4px_rgba(0,0,0,0.7)]">
                | {t('brand.problemCode')}
              </span>
            </div>
            <p className="font-mono text-[9px] uppercase tracking-wider text-cream-200/70 hidden sm:block">
              {t('brand.tagline')}
            </p>
          </div>
        </div>

        {/* 22-Language Multilingual Selector */}
        <div className="flex items-center gap-3">
          <LanguageSelector />
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN TWO-COLUMN BODY */}
      {/* ========================================================================= */}
      <main className="relative z-10 flex-1 flex items-center px-5 py-6 sm:px-8 lg:px-12">
        <div className="mx-auto w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* ======================================================================= */}
          {/* LEFT HERO SECTION (55% width) */}
          {/* ======================================================================= */}
          <div className="lg:col-span-7 flex flex-col justify-center space-y-6">
            {/* Display Headline */}
            <div>
              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-cream-100 drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)]">
                <span>{t('hero.headlineLine1')}</span>
                <br />
                <span className="text-gold-300 font-extrabold drop-shadow-[0_0_30px_rgba(255,210,26,0.4)]">
                  {t('hero.headlineLine2')}
                </span>
                <br />
                <span>{t('hero.headlineLine3')}</span>
              </h1>

              {/* Decorative flourish line */}
              <div className="flex items-center gap-3 my-4">
                <div className="h-[1.5px] w-12 bg-gradient-to-r from-gold-300/80 to-transparent" />
                <Leaf size={14} className="text-gold-300" />
                <div className="h-[1.5px] w-24 bg-gradient-to-r from-gold-300/40 to-transparent" />
              </div>

              {/* Description */}
              <p className="text-xs sm:text-sm leading-relaxed text-cream-100/90 font-medium max-w-xl drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                {t('hero.description')}
              </p>
            </div>

            {/* Feature Highlights Grid (2x3) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-3 max-w-xl">
              {features.map((feature, idx) => {
                const IconComponent = feature.icon;
                return (
                  <div
                    key={idx}
                    className="group flex items-center gap-2.5 rounded-xl border border-gold-300/25 bg-forest-950/75 p-2.5 backdrop-blur-md transition-all duration-200 hover:border-gold-300/60 hover:bg-forest-900/90 hover:shadow-[0_6px_20px_rgba(0,0,0,0.5)]"
                  >
                    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-gold-300/35 bg-forest-800/90 text-gold-300 transition-transform duration-200 group-hover:scale-105">
                      <IconComponent size={14} />
                    </div>
                    <span className="text-[11px] font-medium leading-tight text-cream-100 group-hover:text-gold-200">
                      {feature.label}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Standalone Glassmorphic Mission Quote Box */}
            <div className="relative max-w-xl p-4 sm:p-5 rounded-2xl border border-gold-300/30 bg-forest-950/80 backdrop-blur-md shadow-[0_16px_40px_rgba(0,0,0,0.65)]">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gold-400/20 text-gold-300 border border-gold-300/30">
                  <Quote size={13} className="rotate-180" />
                </div>
                <p className="font-serif italic text-xs sm:text-[13px] leading-relaxed text-cream-100">
                  "{t('hero.missionQuote')}"
                </p>
              </div>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* RIGHT LOGIN CARD (45% width) */}
          {/* ======================================================================= */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-md rounded-2xl border border-gold-300/30 bg-forest-950/85 p-6 sm:p-8 shadow-[0_25px_60px_rgba(0,0,0,0.85)] backdrop-blur-xl transition-all duration-300 hover:border-gold-300/50 hover:shadow-[0_30px_70px_rgba(0,0,0,0.95)]">
              
              {/* Top Badges */}
              <div className="flex items-center justify-between text-xs">
                <span className="inline-flex items-center gap-1 rounded-full border border-gold-300/30 bg-gold-300/10 px-2.5 py-0.5 font-mono text-[10px] uppercase tracking-wider text-gold-300">
                  {t('brand.problemCode')}
                </span>
                <span className="inline-flex items-center gap-1 font-mono text-[10px] text-emerald-400">
                  <CheckCircle2 size={12} />
                  {t('login.verifiedPortal')}
                </span>
              </div>

              {/* Brand Header */}
              <div className="mt-4 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-gold-300/40 bg-gradient-to-br from-gold-400/20 to-forest-900/90 p-1 shadow-[0_0_20px_rgba(255,210,26,0.25)]">
                  <img
                    src="/logo.png"
                    alt="AgriOptima AI Logo"
                    className="h-full w-full rounded-xl object-contain"
                  />
                </div>

                <h2 className="mt-3 font-serif text-2xl font-bold tracking-tight text-cream-100 sm:text-3xl">
                  {t('brand.name')}
                </h2>
                <p className="mt-1 font-mono text-[10px] sm:text-xs uppercase tracking-widest text-gold-300/90 font-semibold">
                  {t('login.cardSubtitle')}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-cream-300/70">
                  {t('login.cardDescription')}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="mt-6 space-y-3.5">
                {/* Identifier Input */}
                <div>
                  <label className="block font-mono text-[10px] uppercase tracking-wider text-cream-300/70">
                    {t('login.mobileOrEmail')}
                  </label>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-cream-300/40">
                      <User size={14} />
                    </span>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={t('login.mobilePlaceholder')}
                      className="w-full rounded-xl border border-gold-300/25 bg-forest-900/90 py-2.5 pl-9 pr-3 text-xs text-cream-100 placeholder:text-cream-300/30 focus:border-gold-300 focus:outline-none focus:ring-1 focus:ring-gold-300 transition-colors"
                    />
                  </div>
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between">
                    <label className="block font-mono text-[10px] uppercase tracking-wider text-cream-300/70">
                      {t('login.password')}
                    </label>
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => alert(t('i18n.supportedNotice'))}
                      className="font-mono text-[10px] text-gold-300/70 hover:text-gold-300 transition-colors focus:outline-none"
                    >
                      {t('login.forgotPassword')}
                    </button>
                  </div>
                  <div className="relative mt-1">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-cream-300/40">
                      <Lock size={14} />
                    </span>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={t('login.passwordPlaceholder')}
                      className="w-full rounded-xl border border-gold-300/25 bg-forest-900/90 py-2.5 pl-9 pr-3 text-xs text-cream-100 placeholder:text-cream-300/30 focus:border-gold-300 focus:outline-none focus:ring-1 focus:ring-gold-300 transition-colors"
                    />
                  </div>
                </div>

                {/* Primary Action Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group relative flex w-full items-center justify-center gap-2 rounded-xl border border-gold-300/50 bg-gradient-to-r from-gold-400 to-gold-500 py-3 font-serif text-xs font-bold text-forest-950 shadow-[0_0_24px_rgba(255,210,26,0.3)] transition-all duration-300 hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-gold-300 disabled:opacity-50"
                >
                  <Sparkles size={14} />
                  <span>{loading ? t('login.authenticating') : t('login.enterIntelligence')}</span>
                  <ArrowRight
                    size={14}
                    className="transition-transform duration-200 group-hover:translate-x-1"
                  />
                </button>

                {/* Secondary Option: Continue as Demo Farmer */}
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    disabled={loading}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-gold-300/25 bg-forest-900/80 py-2.5 font-mono text-xs text-cream-200 transition-all duration-200 hover:border-gold-300/50 hover:bg-forest-900 hover:text-gold-200 focus:outline-none"
                  >
                    <Sprout size={13} className="text-gold-300" />
                    <span>{t('login.continueAsDemo')}</span>
                  </button>
                </div>
              </form>

              {/* Trust Badge */}
              <div className="mt-5 pt-4 border-t border-gold-300/10 flex items-center justify-center gap-1.5 text-center text-[10px] font-mono text-cream-300/60">
                <ShieldCheck size={12} className="text-emerald-400 shrink-0" />
                <span>{t('login.trustBadge')}</span>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* ========================================================================= */}
      {/* 3. BOTTOM FOOTER BAR */}
      {/* ========================================================================= */}
      <footer className="relative z-20 flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-gold-300/10 bg-forest-950/80 px-5 py-3 text-[11px] font-mono text-cream-300/60 sm:px-8 lg:px-12 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={13} className="text-emerald-400" />
          <span>{t('footer.badges')}</span>
        </div>
        <div className="flex flex-wrap items-center gap-4 text-cream-300/50">
          <span>{t('footer.copyright')}</span>
          <span className="hover:text-gold-300 cursor-pointer transition-colors">
            {t('footer.privacy')}
          </span>
          <span className="hover:text-gold-300 cursor-pointer transition-colors">
            {t('footer.terms')}
          </span>
        </div>
      </footer>
    </div>
  );
}
