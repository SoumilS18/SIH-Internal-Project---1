import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Lock,
  User,
  Leaf,
  Sprout,
  CloudRain,
  Bot,
  Volume2,
  CheckCircle2,
  Eye,
  EyeOff,
  Phone,
} from 'lucide-react';
import { usePrefersReducedMotion } from '@/lib/hooks';
import { useLanguage } from '@/i18n/LanguageContext';
import { LanguageSelector } from '@/components/LanguageSelector';
import { LegalModal } from '@/components/LegalModals';

interface LoginScreenProps {
  onLogin: (userName: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | null>(null);
  const reduced = usePrefersReducedMotion();
  const { t, language } = useLanguage();
  const isHi = language === 'hi';

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

  return (
    <div className="relative min-h-screen w-full bg-transparent text-[#1F2937] flex flex-col justify-between selection:bg-[#E2725B]/20 selection:text-[#873322]">
      {/* ========================================================================= */}
      {/* 1. TOP HEADER BAR WITH CAPABILITY PILLS */}
      {/* ========================================================================= */}
      <header className="sticky top-0 z-30 border-b border-[#EDE4D5] bg-[#FAF7F2]/90 backdrop-blur-md px-4 sm:px-8 py-3">
        <div className="mx-auto max-w-7xl flex items-center justify-between gap-3">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#EAF3ED] border border-[#D4E7DC] text-[#2D5A43] shadow-sm">
              <Leaf size={20} className="text-[#3F7253]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif text-lg sm:text-xl font-bold tracking-tight text-[#1F2937]">
                  AgriOptima AI
                </span>
              </div>
              <p className="text-[11px] text-[#6B7280] font-medium hidden sm:block">
                {isHi ? 'सटीक निर्णय • समृद्ध किसान' : 'Smart Decisions. Stronger Farms.'}
              </p>
            </div>
          </div>

          {/* Capability Highlights Strip (Desktop) */}
          <div className="hidden xl:flex items-center gap-2 text-xs">
            <div className="flex items-center gap-2 rounded-full border border-[#EDE4D5] bg-[#FFFFFF] px-3 py-1.5 shadow-sm">
              <Sprout size={14} className="text-[#3F7253]" />
              <div>
                <span className="font-semibold text-[#1F2937]">{isHi ? 'AI योजना' : 'AI-Powered Plans'}</span>
                <span className="text-[10px] text-[#6B7280] ml-1.5">{isHi ? 'डेटा-आधारित फसल आवंटन' : 'Data-driven crop mix'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-[#EDE4D5] bg-[#FFFFFF] px-3 py-1.5 shadow-sm">
              <CloudRain size={14} className="text-[#2A7575]" />
              <div>
                <span className="font-semibold text-[#1F2937]">{isHi ? 'लाइव मौसम' : 'Real-time Intel'}</span>
                <span className="text-[10px] text-[#6B7280] ml-1.5">{isHi ? '7-दिवसीय वर्षा व मंडी भाव' : 'Weather & mandi rates'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-[#EDE4D5] bg-[#FFFFFF] px-3 py-1.5 shadow-sm">
              <Bot size={14} className="text-[#E2725B]" />
              <div>
                <span className="font-semibold text-[#1F2937]">{isHi ? 'सेंटीनेल एजेंट' : 'Autonomous Agent'}</span>
                <span className="text-[10px] text-[#6B7280] ml-1.5">{isHi ? 'निरंतर निगरानी' : '24/7 proactive checks'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-full border border-[#EDE4D5] bg-[#FFFFFF] px-3 py-1.5 shadow-sm">
              <Volume2 size={14} className="text-[#7C3AED]" />
              <div>
                <span className="font-semibold text-[#1F2937]">{isHi ? 'ध्वनि सहायक' : 'Farmer Voice'}</span>
                <span className="text-[10px] text-[#6B7280] ml-1.5">{isHi ? 'सरवम व जेमिनी AI' : 'Sarvam + Gemini AI'}</span>
              </div>
            </div>
          </div>

          {/* Language Selector */}
          <div className="flex items-center gap-3">
            <LanguageSelector />
          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. MAIN TWO-COLUMN BODY WITH FULL-SCREEN PANORAMIC FARM BACKGROUND */}
      {/* ========================================================================= */}
      <main className="relative flex-1 flex items-center px-4 sm:px-8 pt-3 pb-8 sm:pt-5 sm:pb-10 overflow-hidden">
        {/* Full-Screen Panoramic Wallpaper (Extends edge-to-edge behind the whole page) */}
        <div
          className="pointer-events-none absolute inset-0 w-full h-full z-0 select-none overflow-hidden"
          aria-hidden="true"
        >
          <img
            src="/assets/farmer_illustration_bg.jpg"
            alt=""
            className="h-full w-full object-cover object-bottom"
          />
        </div>

        <div className="relative z-10 mx-auto w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* ======================================================================= */}
          {/* LEFT HERO SECTION (58% width) */}
          {/* ======================================================================= */}
          <div className="lg:col-span-7 flex flex-col justify-start self-start pt-0 space-y-3.5 max-w-xl">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-[#F9D0C5] bg-[#FDEEE9]/95 backdrop-blur-xs px-3 py-0.5 text-[11px] font-semibold text-[#B54832]">
                <Sparkles size={12} className="text-[#E2725B]" />
                <span>{isHi ? 'कृषि निर्णय का आधुनिक मंच' : 'Modern Agricultural Decision Platform'}</span>
              </div>

              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-[#1F2937] leading-tight">
                {isHi ? (
                  <>
                    सटीक योजना बनाएं। <br />
                    <span className="text-[#E2725B]">बेहतर और समृद्ध खेती करें।</span>
                  </>
                ) : (
                  <>
                    Plan Smarter. <br />
                    <span className="text-[#E2725B]">Farm Better.</span>
                  </>
                )}
              </h1>

              <p className="text-xs sm:text-[13px] leading-relaxed text-[#374151] max-w-lg font-medium">
                {isHi
                  ? 'AI-संचालित योजना जो आपके खेत, मिट्टी, पानी और बजट के अनुसार अधिकतम लाभ और सुरक्षित पैदावार सुनिश्चित करती है।'
                  : 'AI-powered planning that helps you make the right decisions for higher income, reduced risk, and a sustainable future.'}
              </p>
            </div>

            {/* 3 Core Value Pillars */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-0.5">
              <div className="rounded-2xl border border-[#EDE4D5]/90 bg-[#FFFFFF]/90 backdrop-blur-md p-3 shadow-xs transition-all hover:border-[#D4E7DC] hover:shadow-md hover:bg-[#FFFFFF]">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#EAF3ED] text-[#2D5A43] mb-1.5">
                  <Sprout size={15} />
                </div>
                <h3 className="text-[11px] font-bold text-[#1F2937] mb-0.5">
                  {isHi ? 'व्यक्तिगत कृषि योजना' : 'Personalized Farm Plan'}
                </h3>
                <p className="text-[9.5px] text-[#6B7280] leading-snug">
                  {isHi ? 'आपकी जमीन और बजट अनुसार फसल आवंटन।' : 'Multi-crop portfolio tuned to your land.'}
                </p>
              </div>

              <div className="rounded-2xl border border-[#EDE4D5]/90 bg-[#FFFFFF]/90 backdrop-blur-md p-3 shadow-xs transition-all hover:border-[#B2DFDB] hover:shadow-md hover:bg-[#FFFFFF]">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#E0F2F1] text-[#2A7575] mb-1.5">
                  <CloudRain size={15} />
                </div>
                <h3 className="text-[11px] font-bold text-[#1F2937] mb-0.5">
                  {isHi ? 'लाइव मौसम व मंडी भाव' : 'Real-Time Intelligence'}
                </h3>
                <p className="text-[9.5px] text-[#6B7280] leading-snug">
                  {isHi ? '7-दिन वर्षा व मंडी दरें।' : '7-day rain forecast & APMC market prices.'}
                </p>
              </div>

              <div className="rounded-2xl border border-[#EDE4D5]/90 bg-[#FFFFFF]/90 backdrop-blur-md p-3 shadow-xs transition-all hover:border-[#F9D0C5] hover:shadow-md hover:bg-[#FFFFFF]">
                <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-[#FDEEE9] text-[#E2725B] mb-1.5">
                  <Bot size={15} />
                </div>
                <h3 className="text-[11px] font-bold text-[#1F2937] mb-0.5">
                  {isHi ? 'स्वायत्त कृषि सहायक' : 'Autonomous Assistant'}
                </h3>
                <p className="text-[9.5px] text-[#6B7280] leading-snug">
                  {isHi ? 'योजना के बाद 24/7 निगरानी।' : 'Continuous Sentinel monitoring.'}
                </p>
              </div>
            </div>
          </div>

          {/* ======================================================================= */}
          {/* RIGHT LOGIN CARD (42% width) */}
          {/* ======================================================================= */}
          <div className="lg:col-span-5 flex justify-center lg:justify-end">
            <div className="w-full max-w-md rounded-3xl border border-[#EDE4D5] bg-[#FFFFFF] p-6 sm:p-8 shadow-[0_10px_35px_rgba(56,49,39,0.06)]">
              
              {/* Card Header */}
              <div>
                <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight text-[#1F2937]">
                  {isHi ? 'स्वागत है!' : 'Welcome Back!'}
                </h2>
                <p className="mt-1 text-xs text-[#6B7280]">
                  {isHi ? 'अपने एग्रीऑप्टिमा AI खाते में लॉगिन करें' : 'Login to your AgriOptima AI account'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                {/* Mobile or Email */}
                <div>
                  <label className="block text-xs font-semibold text-[#374151] mb-1.5">
                    {isHi ? 'मोबाइल नंबर या ईमेल' : 'Mobile number or Email'}
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#9CA3AF]">
                      <User size={15} />
                    </span>
                    <input
                      type="text"
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder={isHi ? '98765 43210 या farmer@agri.in' : '98765 43210 or farmer@example.com'}
                      className="w-full rounded-xl border border-[#D1D5DB] bg-[#FAF7F2] py-2.5 pl-10 pr-3 text-xs text-[#1F2937] placeholder:text-[#9CA3AF] focus:border-[#E2725B] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#E2725B]/20 transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-semibold text-[#374151]">
                      {isHi ? 'पासवर्ड' : 'Password'}
                    </label>
                    <button
                      type="button"
                      tabIndex={-1}
                      onClick={() => alert(isHi ? 'पासवर्ड रीसेट लिंक आपके नंबर पर भेजा गया है।' : 'Password reset link sent to your registered mobile.')}
                      className="text-[11px] font-medium text-[#E2725B] hover:text-[#B54832] transition-colors focus:outline-none"
                    >
                      {isHi ? 'पासवर्ड भूल गए?' : 'Forgot password?'}
                    </button>
                  </div>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 text-[#9CA3AF]">
                      <Lock size={15} />
                    </span>
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder={isHi ? '••••••••' : 'Enter your password'}
                      className="w-full rounded-xl border border-[#D1D5DB] bg-[#FAF7F2] py-2.5 pl-10 pr-10 text-xs text-[#1F2937] placeholder:text-[#9CA3AF] focus:border-[#E2725B] focus:bg-[#FFFFFF] focus:outline-none focus:ring-2 focus:ring-[#E2725B]/20 transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-3 text-[#9CA3AF] hover:text-[#4B5563]"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                </div>

                {/* Primary Login Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="group flex w-full items-center justify-center gap-2 rounded-xl bg-[#E2725B] py-3 text-xs font-bold text-[#FFFFFF] shadow-sm transition-all hover:bg-[#D9654D] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#E2725B]/30 disabled:opacity-60 cursor-pointer"
                >
                  <span>{loading ? (isHi ? 'प्रमाणित हो रहा है...' : 'Logging in...') : (isHi ? 'लॉगिन करें' : 'Login')}</span>
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                </button>

                {/* Divider */}
                <div className="flex items-center gap-3 my-2.5">
                  <div className="flex-1 border-t border-[#EDE4D5]" />
                  <span className="shrink-0 text-[11px] text-[#9CA3AF] whitespace-nowrap">
                    {isHi ? 'या जारी रखें' : 'or continue with'}
                  </span>
                  <div className="flex-1 border-t border-[#EDE4D5]" />
                </div>

                {/* Alternative Quick Sign-in Grid */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-[#EDE4D5] bg-[#FAF7F2] py-2 text-[11px] font-medium text-[#374151] hover:bg-[#F5EFE6] hover:border-[#DDD0BD] transition-colors"
                  >
                    <span>🌐</span>
                    <span>{isHi ? 'गूगल' : 'Google'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDemoLogin}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-[#EDE4D5] bg-[#FAF7F2] py-2 text-[11px] font-medium text-[#374151] hover:bg-[#F5EFE6] hover:border-[#DDD0BD] transition-colors"
                  >
                    <Phone size={13} className="text-[#3F7253]" />
                    <span>{isHi ? 'फोन OTP' : 'Phone OTP'}</span>
                  </button>
                </div>

                {/* Quick 1-Click Demo Farmer Button */}
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  disabled={loading}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-[#D4E7DC] bg-[#EAF3ED] py-2.5 text-xs font-semibold text-[#2D5A43] hover:bg-[#D4E7DC] transition-colors cursor-pointer"
                >
                  <Sprout size={14} className="text-[#3F7253]" />
                  <span>{isHi ? 'किसान मित्र डेमो के रूप में प्रवेश करें' : 'Continue as Demo Farmer (1-Click)'}</span>
                </button>
              </form>

              {/* Bottom Sign-up Link */}
              <div className="mt-5 pt-4 border-t border-[#EDE4D5] text-center text-xs text-[#6B7280]">
                <span>{isHi ? 'नया खाता बनाना चाहते हैं? ' : 'New here? '}</span>
                <button
                  type="button"
                  onClick={handleDemoLogin}
                  className="font-semibold text-[#E2725B] hover:text-[#B54832] transition-colors"
                >
                  {isHi ? 'नया खाता बनाएं' : 'Create an account'}
                </button>
              </div>
            </div>
          </div>

        </div>
      </main>

      {/* ========================================================================= */}
      {/* 3. BOTTOM FOOTER BAR */}
      {/* ========================================================================= */}
      <footer className="border-t border-[#EDE4D5] bg-[#FAF7F2] px-4 sm:px-8 py-3 text-xs text-[#6B7280]">
        <div className="mx-auto max-w-7xl flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-[11px]">
            <ShieldCheck size={14} className="text-[#3F7253]" />
            <span>{isHi ? 'सुरक्षित एवं निजी: आपका कृषि डेटा एन्क्रिप्टेड है' : 'Secure & Private: Your farm data is protected and never shared.'}</span>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <span>© 2026 AgriOptima AI</span>
            <button
              type="button"
              onClick={() => setLegalModalType('privacy')}
              className="hover:text-[#1F2937] transition-colors cursor-pointer"
            >
              {isHi ? 'गोपनीयता नीति' : 'Privacy Policy'}
            </button>
            <button
              type="button"
              onClick={() => setLegalModalType('terms')}
              className="hover:text-[#1F2937] transition-colors cursor-pointer"
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

