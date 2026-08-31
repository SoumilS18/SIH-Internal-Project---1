import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Building2,
  CheckCircle2,
  HelpCircle,
  AlertCircle,
  ExternalLink,
  Filter,
  Landmark,
  ShieldAlert,
  Coins,
  Droplets,
  Tractor,
  Sprout,
  FileText,
  UserCheck,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Info,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';
import {
  INDIAN_AGRICULTURAL_SCHEMES,
  evaluateFarmerSchemeEligibility,
  type SchemeEvaluationResult,
  type SchemeCategory,
} from '@/lib/governmentSchemes';
import { Reveal } from '@/components/ui/motion';

interface GovernmentBenefitsScreenProps {
  userName?: string;
  selectedState?: string;
  selectedDistrict?: string;
  landAcres?: number;
  primaryCrop?: string;
  irrigationType?: string;
  onBackToSentinel: () => void;
  onChangeLocation?: () => void;
}

export function GovernmentBenefitsScreen({
  userName = 'Farmer',
  selectedState = 'Uttar Pradesh',
  selectedDistrict = 'Varanasi',
  landAcres = 2.5,
  primaryCrop = 'Sugarcane',
  irrigationType = 'Borewell',
  onBackToSentinel,
  onChangeLocation,
}: GovernmentBenefitsScreenProps) {
  const { language } = useLanguage();
  const isHi = language === 'hi';

  // Interactive Form State (Pre-filled with active farm data)
  const [stateName, setStateName] = useState<string>(selectedState);
  const [districtName, setDistrictName] = useState<string>(selectedDistrict);
  const [currentAcres, setCurrentAcres] = useState<number>(landAcres);
  const [cropName, setCropName] = useState<string>(primaryCrop);
  const [irrigation, setIrrigation] = useState<string>(irrigationType);
  const [farmerCategory, setFarmerCategory] = useState<'small_marginal' | 'medium' | 'large' | 'women' | 'sc_st'>(
    landAcres <= 5 ? 'small_marginal' : 'medium'
  );
  const [supportFilter, setSupportFilter] = useState<'all' | 'income_support' | 'subsidies' | 'credit' | 'insurance'>('all');
  const [expandedSchemeId, setExpandedSchemeId] = useState<string | null>(null);

  // Evaluate schemes dynamically based on current parameters
  const evaluationResults = useMemo(() => {
    return evaluateFarmerSchemeEligibility({
      state: stateName,
      district: districtName,
      landAcres: currentAcres,
      primaryCrop: cropName,
      irrigationType: irrigation,
      farmerCategory,
      preferredSupport: supportFilter,
    });
  }, [stateName, districtName, currentAcres, cropName, irrigation, farmerCategory, supportFilter]);

  // Filter schemes based on selected category tab
  const filteredSchemes = useMemo(() => {
    if (supportFilter === 'all') return evaluationResults;
    if (supportFilter === 'income_support') {
      return evaluationResults.filter(
        (r) => r.scheme.category === 'income_support' || r.scheme.category === 'state_specific'
      );
    }
    if (supportFilter === 'subsidies') {
      return evaluationResults.filter(
        (r) =>
          r.scheme.category === 'irrigation_subsidy' ||
          r.scheme.category === 'mechanization_subsidy' ||
          r.scheme.category === 'solar_energy' ||
          r.scheme.category === 'organic_farming'
      );
    }
    if (supportFilter === 'credit') {
      return evaluationResults.filter((r) => r.scheme.category === 'credit_loan');
    }
    if (supportFilter === 'insurance') {
      return evaluationResults.filter((r) => r.scheme.category === 'insurance');
    }
    return evaluationResults;
  }, [evaluationResults, supportFilter]);

  const potentiallyEligibleCount = evaluationResults.filter(
    (r) => r.matchLevel === 'POTENTIALLY_ELIGIBLE'
  ).length;

  return (
    <div className="min-h-screen bg-[var(--paper)] text-[var(--ink)] pb-24 selection:bg-[var(--field)] selection:text-white">
      {/* Top Header / Back Navigation */}
      <header className="sticky top-0 z-30 border-b border-[var(--line)] bg-[var(--paper)]/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onBackToSentinel}
              className="inline-flex items-center gap-1.5 rounded-full border border-[var(--line)] bg-[var(--surface-solid)] px-3 py-1.5 text-xs font-semibold text-[var(--ink)] hover:bg-[var(--surface-inset)] transition-colors cursor-pointer"
            >
              <ArrowLeft size={14} />
              <span>{isHi ? 'सेंटीनेल पर वापस जाएं' : 'Back to Sentinel'}</span>
            </button>

            <span className="hidden sm:inline-block h-4 w-px bg-[var(--line)]" />

            <div className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-[var(--ink-soft)] font-data">
              <span>{districtName}, {stateName}</span>
              <span>·</span>
              <span>{currentAcres} {isHi ? 'एकड़' : 'Acres'}</span>
              <span>·</span>
              <span>{cropName}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="chip chip-field text-[10px] font-bold">
              {isHi ? `${potentiallyEligibleCount} योजनाएं संभावित पात्र` : `${potentiallyEligibleCount} Schemes Potentially Eligible`}
            </span>
          </div>
        </div>
      </header>

      {/* Hero Banner */}
      <main className="mx-auto max-w-6xl px-4 pt-8 sm:px-6 space-y-8">
        <Reveal delay={20} className="space-y-3">
          <div className="flex items-center gap-2 text-[var(--field-deep)]">
            <Landmark size={20} />
            <span className="t-eyebrow text-xs font-bold uppercase tracking-widest text-[var(--field-deep)]">
              {isHi ? 'सरकारी योजनाएं एवं वित्तीय पात्रता' : 'GOVERNMENT SCHEMES & FINANCIAL ELIGIBILITY'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-[var(--line)] pb-6">
            <div>
              <h1 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-extrabold text-[var(--ink)] tracking-tight">
                {isHi ? 'कृषि सब्सिडी एवं सरकारी सहायता जांच' : 'Agricultural Subsidies & Scheme Finder'}
              </h1>
              <p className="mt-2 max-w-2xl text-xs sm:text-sm text-[var(--ink-soft)] leading-relaxed">
                {isHi
                  ? 'अपनी जोत, राज्य, फसल और श्रेणी के आधार पर केंद्रीय व राज्य सरकार की प्रत्यक्ष सहायता, सब्सिडी एवं रियायती ऋण योजनाओं की पात्रता देखें।'
                  : 'Evaluate potential eligibility for central and state government direct benefits, capital subsidies, crop insurance, and concessional loans.'}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-solid)] p-3.5 shadow-xs shrink-0">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-xl bg-[var(--field-tint)] text-[var(--field-deep)] font-serif font-bold text-lg">
                  {potentiallyEligibleCount}
                </div>
                <div>
                  <span className="block text-[11px] font-semibold text-[var(--ink-soft)]">
                    {isHi ? 'पात्र होने की संभावना' : 'Potentially Qualified'}
                  </span>
                  <span className="block font-data text-xs font-bold text-[var(--field-deep)]">
                    {isHi ? '₹6,000 - ₹12,000+ वार्षिक सहायता' : '₹6,000 - ₹12,000+ Annual Potential'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </Reveal>

        {/* Profile Filter & Parameters Bar */}
        <Reveal delay={40} className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-solid)] p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-[var(--line-soft)] pb-3">
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-[var(--field-deep)]" />
              <h3 className="text-xs sm:text-sm font-bold text-[var(--ink)]">
                {isHi ? 'आपकी कृषि प्रोफाइल व पात्रता पैरामीटर' : 'Your Farm Profile & Eligibility Filters'}
              </h3>
            </div>
            <span className="text-[11px] text-[var(--ink-ghost)]">
              {isHi ? 'स्वतः लोड किया गया' : 'Auto-populated from Farm Setup'}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Land Size */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[var(--ink-soft)] uppercase tracking-wider">
                {isHi ? 'भूमि जोत (एकड़)' : 'Land Holding (Acres)'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0.1"
                  max="100"
                  step="0.5"
                  value={currentAcres}
                  onChange={(e) => setCurrentAcres(parseFloat(e.target.value) || 1)}
                  className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper-3)] px-3 py-2 text-xs font-data font-bold text-[var(--ink)] focus:border-[var(--field)] focus:outline-none"
                />
                <span className="text-xs font-medium text-[var(--ink-soft)]">
                  {currentAcres <= 5 ? (isHi ? 'लघु/सीमांत' : 'Small/Marginal') : (isHi ? 'मध्यम/बड़ा' : 'Medium/Large')}
                </span>
              </div>
            </div>

            {/* 2. Farmer Category */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[var(--ink-soft)] uppercase tracking-wider">
                {isHi ? 'कृषक श्रेणी' : 'Farmer Category'}
              </label>
              <select
                value={farmerCategory}
                onChange={(e) => setFarmerCategory(e.target.value as any)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper-3)] px-3 py-2 text-xs font-semibold text-[var(--ink)] focus:border-[var(--field)] focus:outline-none"
              >
                <option value="small_marginal">{isHi ? 'लघु एवं सीमांत किसान (< 5 एकड़)' : 'Small & Marginal (< 5 Acres)'}</option>
                <option value="medium">{isHi ? 'सामान्य / मध्यम किसान (> 5 एकड़)' : 'General / Medium (> 5 Acres)'}</option>
                <option value="women">{isHi ? 'महिला कृषक (प्राथमिकता)' : 'Women Farmer (Priority)'}</option>
                <option value="sc_st">{isHi ? 'अनुसूचित जाति / जनजाति (विशेष अनुदान)' : 'SC / ST Category (Special Grant)'}</option>
              </select>
            </div>

            {/* 3. Location State */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[var(--ink-soft)] uppercase tracking-wider">
                {isHi ? 'राज्य' : 'State'}
              </label>
              <input
                type="text"
                value={stateName}
                onChange={(e) => setStateName(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper-3)] px-3 py-2 text-xs font-semibold text-[var(--ink)] focus:border-[var(--field)] focus:outline-none"
              />
            </div>

            {/* 4. Primary Crop */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-[var(--ink-soft)] uppercase tracking-wider">
                {isHi ? 'मुख्य फसल' : 'Primary Crop'}
              </label>
              <input
                type="text"
                value={cropName}
                onChange={(e) => setCropName(e.target.value)}
                className="w-full rounded-xl border border-[var(--line)] bg-[var(--paper-3)] px-3 py-2 text-xs font-semibold text-[var(--ink)] focus:border-[var(--field)] focus:outline-none"
              />
            </div>
          </div>

          {/* Scheme Category Filter Chips */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[var(--line-soft)]">
            <span className="text-[11px] font-bold text-[var(--ink-ghost)] mr-1">
              {isHi ? 'श्रेणी अनुसार देखें:' : 'Filter Support:'}
            </span>

            {[
              { id: 'all', labelEn: 'All Schemes', labelHi: 'सभी योजनाएं' },
              { id: 'income_support', labelEn: 'Direct Cash Benefit', labelHi: 'नकद सहायता (PM-KISAN)' },
              { id: 'subsidies', labelEn: 'Subsidies & Equipment', labelHi: 'सब्सिडी व उपकरण' },
              { id: 'credit', labelEn: 'Kisan Credit Card (4%)', labelHi: 'किसान क्रेडिट कार्ड (KCC)' },
              { id: 'insurance', labelEn: 'Crop Insurance (PMFBY)', labelHi: 'फसल बीमा (PMFBY)' },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setSupportFilter(tab.id as any)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition-all cursor-pointer ${
                  supportFilter === tab.id
                    ? 'bg-[var(--field-deep)] text-white shadow-xs'
                    : 'border border-[var(--line)] bg-[var(--paper-3)] text-[var(--ink-soft)] hover:bg-[var(--surface-inset)] hover:text-[var(--ink)]'
                }`}
              >
                {isHi ? tab.labelHi : tab.labelEn}
              </button>
            ))}
          </div>
        </Reveal>

        {/* Scheme Evaluation Cards List */}
        <Reveal delay={60} className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold uppercase tracking-wider text-[var(--ink)]">
              {isHi ? `उपलब्ध योजनाएं (${filteredSchemes.length})` : `AVAILABLE SCHEMES (${filteredSchemes.length})`}
            </h2>
            <span className="text-xs text-[var(--ink-ghost)]">
              {isHi ? 'पारदर्शिता एवं आधिकारिक डेटाबेस आधारित' : 'Based on Official Central & State Guidelines'}
            </span>
          </div>

          <div className="space-y-4">
            {filteredSchemes.map((result) => {
              const { scheme, matchLevel, reasonsForMatch, verificationNotes, estimatedAnnualBenefitInr, subsidyPercentage } = result;
              const isExpanded = expandedSchemeId === scheme.id;
              const isPotentiallyEligible = matchLevel === 'POTENTIALLY_ELIGIBLE';

              return (
                <div
                  key={scheme.id}
                  className="rounded-2xl border border-[var(--line-soft)] bg-[var(--surface-solid)] p-5 sm:p-6 transition-all hover:border-[var(--field-bright)]/40 hover:shadow-sm"
                >
                  <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                    {/* Scheme Meta & Title */}
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`chip text-[10px] font-bold ${
                            isPotentiallyEligible ? 'chip-field' : 'chip-grain'
                          }`}
                        >
                          {isPotentiallyEligible
                            ? (isHi ? 'पात्र होने की संभावना' : 'Potentially Eligible')
                            : (isHi ? 'सत्यापन आवश्यक' : 'May Require Verification')}
                        </span>

                        <span className="text-[11px] font-data font-semibold text-[var(--ink-ghost)]">
                          {scheme.officialCode}
                        </span>

                        {scheme.isStateSpecific && (
                          <span className="chip chip-grain text-[9px] font-bold">
                            {isHi ? `${stateName} राज्य योजना` : `${stateName} State Specific`}
                          </span>
                        )}
                      </div>

                      <h3 className="font-serif text-lg sm:text-xl font-bold text-[var(--ink)] leading-snug">
                        {isHi ? scheme.name.hi : scheme.name.en}
                      </h3>

                      <p className="text-xs text-[var(--field-deep)] font-medium">
                        {isHi ? scheme.agency.hi : scheme.agency.en}
                      </p>

                      <p className="text-xs sm:text-[13px] text-[var(--ink-soft)] leading-relaxed pt-1">
                        {isHi ? scheme.shortDescription.hi : scheme.shortDescription.en}
                      </p>
                    </div>

                    {/* Benefit Highlight Box */}
                    <div className="flex flex-col items-start lg:items-end justify-between gap-3 shrink-0 lg:w-72 border-t lg:border-t-0 lg:border-l border-[var(--line-soft)] pt-3 lg:pt-0 lg:pl-6">
                      <div className="rounded-xl bg-[var(--field-tint)]/70 border border-[var(--field-bright)]/20 px-3.5 py-2.5 w-full text-left lg:text-right">
                        <span className="block text-[10px] font-bold text-[var(--field-deep)] uppercase tracking-wider">
                          {isHi ? 'वित्तीय लाभ / सब्सिडी' : 'FINANCIAL BENEFIT'}
                        </span>
                        <span className="block font-data text-xs sm:text-[13px] font-bold text-[var(--ink)] mt-0.5">
                          {isHi ? scheme.benefitHighlight.hi : scheme.benefitHighlight.en}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 w-full justify-between lg:justify-end">
                        <a
                          href={scheme.officialPortalUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--field-deep)] hover:underline"
                        >
                          <span>{isHi ? 'सरकारी पोर्टल' : 'Official Portal'}</span>
                          <ExternalLink size={12} />
                        </a>

                        <button
                          type="button"
                          onClick={() => setExpandedSchemeId(isExpanded ? null : scheme.id)}
                          className="inline-flex items-center gap-1 rounded-lg border border-[var(--line)] bg-[var(--paper-3)] px-2.5 py-1 text-xs font-semibold text-[var(--ink-soft)] hover:bg-[var(--surface-inset)] transition-colors cursor-pointer"
                        >
                          <span>{isExpanded ? (isHi ? 'कम देखें' : 'Less') : (isHi ? 'विवरण देखें' : 'Details')}</span>
                          {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Details Section */}
                  {isExpanded && (
                    <div className="mt-5 pt-5 border-t border-[var(--line-soft)] grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade">
                      {/* Left: Why You Qualify */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-[var(--field-deep)]">
                          <CheckCircle2 size={14} />
                          <h4 className="text-xs font-bold uppercase tracking-wider">
                            {isHi ? 'आपकी पात्रता के कारण:' : 'WHY YOU MAY QUALIFY:'}
                          </h4>
                        </div>
                        <ul className="space-y-1.5 text-xs text-[var(--ink-soft)] pl-5 list-disc">
                          {(isHi ? reasonsForMatch.hi : reasonsForMatch.en).map((reason, idx) => (
                            <li key={idx} className="leading-snug">{reason}</li>
                          ))}
                        </ul>
                      </div>

                      {/* Right: Required Documents */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-1.5 text-[var(--ink)]">
                          <FileText size={14} />
                          <h4 className="text-xs font-bold uppercase tracking-wider">
                            {isHi ? 'आवश्यक दस्तावेज:' : 'REQUIRED DOCUMENTS:'}
                          </h4>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {(isHi ? scheme.requiredDocuments.hi : scheme.requiredDocuments.en).map((doc, idx) => (
                            <span
                              key={idx}
                              className="rounded-lg border border-[var(--line)] bg-[var(--paper-3)] px-2.5 py-1 text-[11px] font-medium text-[var(--ink)]"
                            >
                              {doc}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Reveal>

        {/* Reassuring Legal Disclaimer */}
        <Reveal delay={80} className="rounded-2xl border border-[var(--warn-tint)] bg-[var(--warn-tint)]/40 p-4 sm:p-5">
          <div className="flex items-start gap-3">
            <Info size={18} className="text-[var(--warn-deep)] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-xs font-bold text-[var(--warn-deep)] uppercase tracking-wider">
                {isHi ? 'महत्वपूर्ण सूचना एवं दिशानिर्देश' : 'IMPORTANT NOTICE & DISCLAIMER'}
              </h4>
              <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
                {isHi
                  ? 'यह पात्रता मूल्यांकन कृषक द्वारा दर्ज भूमि जोत और फसल डेटा पर आधारित एक सूचनात्मक मार्गदर्शन है। वास्तविक स्वीकृति व वित्तीय अनुदान का भुगतान आधार ई-केवाईसी, बैंक सीडिंग तथा संबंधित राज्य/केंद्रीय कृषि विभाग के आधिकारिक पोर्टल पर सत्यापन के अधीन है।'
                  : 'This eligibility assessment is an indicative guidance based on farmer profile inputs. Final approval, sanction, and subsidy disbursement are subject to official Aadhaar e-KYC, bank DBT seeding, and departmental verification on the respective government portal.'}
              </p>
            </div>
          </div>
        </Reveal>
      </main>
    </div>
  );
}
