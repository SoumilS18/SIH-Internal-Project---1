import React, { useEffect } from 'react';
import {
  X,
  ShieldCheck,
  FileText,
  Lock,
  Database,
  UserCheck,
  AlertTriangle,
  Scale,
  Cpu,
  HelpCircle,
} from 'lucide-react';
import { useLanguage } from '@/i18n/LanguageContext';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'privacy' | 'terms';
}

export function LegalModal({ isOpen, onClose, type }: LegalModalProps) {
  const { language } = useLanguage();
  const isHi = language === 'hi';

  // Handle ESC key to close
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-forest-950/85 p-4 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative flex max-h-[90vh] w-full max-w-3xl flex-col rounded-3xl border border-gold-300/30 bg-gradient-to-b from-forest-900/95 via-forest-950/95 to-forest-950 p-6 sm:p-8 text-cream-100 shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-start justify-between border-b border-gold-300/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-gold-300/30 bg-gold-400/15 text-gold-300 shadow-sm">
              {type === 'privacy' ? <ShieldCheck size={20} /> : <FileText size={20} />}
            </div>
            <div>
              <h2 className="font-serif text-xl sm:text-2xl font-bold text-gold-100">
                {type === 'privacy'
                  ? isHi
                    ? 'गोपनीयता नीति (Privacy Policy)'
                    : 'Privacy Policy'
                  : isHi
                  ? 'सेवा की शर्तें (Terms of Service)'
                  : 'Terms of Service'}
              </h2>
              <p className="font-mono text-[11px] text-cream-300/70">
                {isHi
                  ? 'एग्रीऑप्टिमा एआई • डिजिटल पर्सनल डेटा प्रोटेक्शन (DPDP) अनुपालन'
                  : 'AgriOptima AI • Digital Personal Data Protection (DPDP) Act Compliance'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-forest-700/60 bg-forest-950/80 p-2 text-cream-300/80 hover:bg-forest-800 hover:text-white transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Document Content */}
        <div className="mt-4 flex-1 space-y-6 overflow-y-auto pr-2 text-xs leading-relaxed text-cream-200/90 font-sans">
          {type === 'privacy' ? (
            /* ========================================================================= */
            /* PRIVACY POLICY CONTENT */
            /* ========================================================================= */
            <>
              {/* Section 1: Commitment */}
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-4 space-y-2">
                <div className="flex items-center gap-2 font-serif text-sm font-bold text-emerald-300">
                  <Lock size={16} />
                  <span>
                    {isHi
                      ? '1. किसान डेटा सुरक्षा एवं गोपनीयता प्रतिबद्धता'
                      : '1. Farmer Privacy & Data Sovereign Commitment'}
                  </span>
                </div>
                <p>
                  {isHi
                    ? 'एग्रीऑप्टिमा एआई (AgriOptima AI) में, हम भारतीय किसानों के डेटा की संप्रभुता और गोपनीयता का पूर्ण सम्मान करते हैं। यह नीति डिजिटल व्यक्तिगत डेटा संरक्षण (DPDP) अधिनियम 2023 के प्रावधानों के तहत तैयार की गई है।'
                    : 'At AgriOptima AI, we uphold the sovereign data rights of Indian farmers. This policy outlines our stringent data protection standards formulated in adherence with the Digital Personal Data Protection (DPDP) Act, 2023.'}
                </p>
              </div>

              {/* Section 2: Data Collected */}
              <div className="space-y-2">
                <h3 className="font-serif text-sm font-bold text-gold-200 flex items-center gap-2">
                  <Database size={15} className="text-gold-400" />
                  {isHi ? '2. हम कौन सा डेटा एकत्र करते हैं' : '2. Information We Collect'}
                </h3>
                <ul className="list-disc pl-5 space-y-1.5 text-cream-300/80">
                  <li>
                    <strong className="text-cream-100">
                      {isHi ? 'खेत एवं स्थान विवरण:' : 'Farm Telemetry & Geographic Attributes:'}
                    </strong>{' '}
                    {isHi
                      ? 'राज्य, जिला, अक्षांश/देशांतर निर्देशांक, कुल भूमि का आकार (एकड़ में), एवं सिंचाई का प्रकार।'
                      : 'State, district, GPS/centroid coordinates, farm land size (acres), and irrigation infrastructure type.'}
                  </li>
                  <li>
                    <strong className="text-cream-100">
                      {isHi ? 'मृदा एवं कृषि-जलवायु डेटा:' : 'Soil & Agro-Climatic Parameters:'}
                    </strong>{' '}
                    {isHi
                      ? 'मृदा का प्रकार (Vertisols, Alluvial आदि), मृदा नमी (ERA5/NASA MERRA-2), और स्थानीय मौसम पूर्वानुमान।'
                      : 'Soil classification (Vertisols, Alluvial, etc.), root-zone soil moisture telemetry, and IMD/Open-Meteo meteorological forecasts.'}
                  </li>
                  <li>
                    <strong className="text-cream-100">
                      {isHi ? 'आर्थिक व वित्तीय सीमाएं:' : 'Economic Constraints:'}
                    </strong>{' '}
                    {isHi
                      ? 'कार्यशील पूंजी बजट (₹) और जोखिम सहनशीलता (रूढ़िवादी, संतुलित, आक्रामक)।'
                      : 'Working capital budget allocation (₹) and farmer risk preference (Conservative, Balanced, Aggressive).'}
                  </li>
                </ul>
              </div>

              {/* Section 3: Usage */}
              <div className="space-y-2">
                <h3 className="font-serif text-sm font-bold text-gold-200 flex items-center gap-2">
                  <Cpu size={15} className="text-gold-400" />
                  {isHi ? '3. आपके डेटा का उपयोग कैसे किया जाता है' : '3. How Your Data Is Utilized'}
                </h3>
                <p>
                  {isHi
                    ? 'एकत्रित डेटा का उपयोग केवल निम्नलिखित तकनीकी और विश्लेषणात्मक उद्देश्यों के लिए किया जाता है:'
                    : 'Your farm data is processed strictly for algorithmic and agronomic decision intelligence:'}
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="rounded-xl border border-forest-800 bg-forest-900/60 p-3">
                    <span className="font-bold text-gold-300 block mb-1">
                      {isHi ? 'गणितीय LP अनुकूलन' : 'Deterministic Optimization'}
                    </span>
                    <span className="text-[11px] text-cream-300/80">
                      {isHi
                        ? 'HiGHS सॉल्वर द्वारा अधिकतम लाभ और न्यूनतम जोखिम वाली फसल योजना तैयार करना।'
                        : 'Executing HiGHS linear programming to determine profit-maximizing crop allocations.'}
                    </span>
                  </div>
                  <div className="rounded-xl border border-forest-800 bg-forest-900/60 p-3">
                    <span className="font-bold text-emerald-300 block mb-1">
                      {isHi ? 'स्वायत्त प्रहरी परामर्श' : 'Autonomous Sentinel Alerts'}
                    </span>
                    <span className="text-[11px] text-cream-300/80">
                      {isHi
                        ? 'सूखा, जलभराव या लू की स्थिति में सक्रिय सुरक्षात्मक निर्देश देना।'
                        : 'Generating proactive evening irrigation, drainage, and heat mitigation directives.'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 4: Zero Commercial Exploitation */}
              <div className="rounded-2xl border border-gold-300/25 bg-forest-950 p-4 space-y-1.5">
                <h3 className="font-serif text-sm font-bold text-gold-200 flex items-center gap-2">
                  <ShieldCheck size={15} className="text-gold-400" />
                  {isHi ? '4. शून्य वाणिज्यिक डेटा बिक्री (No Commercial Exploitation)' : '4. Zero Third-Party Monetization'}
                </h3>
                <p className="text-cream-200 font-medium">
                  {isHi
                    ? 'हम आपके कृषि डेटा, मोबाइल नंबर या स्थान विवरण को किसी भी तीसरे पक्ष, कीटनाशक कंपनी या विज्ञापनदाता को कभी नहीं बेचते या साझा नहीं करते हैं।'
                    : 'We NEVER monetize, sell, lease, or distribute farmer telemetry to third-party commercial advertisers, chemical marketing companies, or data brokers.'}
                </p>
              </div>

              {/* Section 5: Farmer Rights & Security */}
              <div className="space-y-2">
                <h3 className="font-serif text-sm font-bold text-gold-200 flex items-center gap-2">
                  <UserCheck size={15} className="text-gold-400" />
                  {isHi ? '5. किसान अधिकार व डेटा सुरक्षा' : '5. Farmer Rights & Security Standards'}
                </h3>
                <p>
                  {isHi
                    ? 'सभी डेटा ट्रांसमिशन TLS 1.3 एन्क्रिप्शन द्वारा सुरक्षित हैं और स्थानीय सर्वर पर AES-256 मानकों के अनुसार संग्रहीत हैं। किसान किसी भी समय अपने डेटा को रीसेट या मिटाने का अनुरोध कर सकते हैं।'
                    : 'All telemetry transmissions are encrypted using TLS 1.3 in-flight and AES-256 at-rest. Farmers maintain full rights to access, rectify, or purge their profile records upon request.'}
                </p>
              </div>
            </>
          ) : (
            /* ========================================================================= */
            /* TERMS OF SERVICE CONTENT */
            /* ========================================================================= */
            <>
              {/* Section 1: Agreement */}
              <div className="rounded-2xl border border-gold-300/30 bg-forest-900/60 p-4 space-y-2">
                <div className="flex items-center gap-2 font-serif text-sm font-bold text-gold-200">
                  <Scale size={16} className="text-gold-400" />
                  <span>
                    {isHi
                      ? '1. नियम एवं शर्तों की स्वीकृति'
                      : '1. Acceptance of Terms'}
                  </span>
                </div>
                <p>
                  {isHi
                    ? 'एग्रीऑप्टिमा एआई स्वायत्त कृषि निर्णय पोर्टल का उपयोग करके, आप इन नियमों और शर्तों का पालन करने के लिए अपनी सहमति व्यक्त करते हैं। यह मंच कृषि निर्णय सहायता और जलवायु-सचेत योजना के लिए बनाया गया है।'
                    : 'By accessing or utilizing the AgriOptima AI Autonomous Decision Portal, you agree to be bound by these Terms of Service. This platform is engineered to deliver climate-resilient agricultural decision intelligence.'}
                </p>
              </div>

              {/* Section 2: Human in the loop & Bounded Autonomy */}
              <div className="space-y-2">
                <h3 className="font-serif text-sm font-bold text-emerald-300 flex items-center gap-2">
                  <Cpu size={15} className="text-emerald-400" />
                  {isHi
                    ? '2. सीमित स्वायत्तता एवं मानव-नियंत्रित सिद्धांत (Human-in-the-Loop)'
                    : '2. Bounded Autonomy & Human-in-the-Loop Architecture'}
                </h3>
                <p>
                  {isHi
                    ? 'एग्रीऑप्टिमा स्वायत्त प्रहरी (Autonomous Sentinel) केवल "सीमित स्वायत्तता" के सिद्धांत पर कार्य करता है। यह प्रणाली केवल गैर-विनाशकारी विश्लेषणात्मक परामर्श उत्पन्न करती है और किसी भी वित्तीय लेनदेन, बीज/रासायनिक खरीद या अनधिकृत डेटा संचालन को कभी निष्पादित नहीं करती है। अंतिम कृषि निर्णय सदैव किसान के विवेक पर निर्भर है।'
                    : 'The AgriOptima Autonomous Sentinel operates strictly under a "Bounded Autonomy" framework. The agent is strictly limited to non-destructive advisory generation and NEVER executes financial transactions, seed/chemical orders, or hardware pump operations. Final operational discretion rests solely with the farmer.'}
                </p>
              </div>

              {/* Section 3: Data Sources and Deterministic Modeling */}
              <div className="space-y-2">
                <h3 className="font-serif text-sm font-bold text-gold-200 flex items-center gap-2">
                  <Database size={15} className="text-gold-400" />
                  {isHi
                    ? '3. डेटा स्रोत एवं गणितीय प्रमाणन'
                    : '3. Data Provenance & Deterministic Modeling'}
                </h3>
                <p>
                  {isHi
                    ? 'हमारी सिफारिशें भारतीय कृषि अनुसंधान परिषद (ICAR), कृषि लागत एवं मूल्य आयोग (CACP), नासा (NASA POWER), और भारतीय मौसम विभाग (IMD) के मान्य डेटा और HiGHS रैखिक प्रोग्रामिंग पर आधारित हैं।'
                    : 'Recommendations are calculated deterministically using ICAR agro-climatic standards, CACP Comprehensive Scheme crop cost baselines (Cost C2), Agmarknet APMC mandi prices, and IMD/NASA meteorological reanalysis.'}
                </p>
              </div>

              {/* Section 4: Agricultural Disclaimers */}
              <div className="rounded-2xl border border-amber-500/30 bg-amber-950/20 p-4 space-y-2">
                <div className="flex items-center gap-2 font-serif text-sm font-bold text-amber-300">
                  <AlertTriangle size={16} />
                  <span>
                    {isHi ? '4. कृषि उपज अस्वीकरण (Agronomic Advisory Notice)' : '4. Agronomic Advisory & Natural Risk Notice'}
                  </span>
                </div>
                <p className="text-cream-200">
                  {isHi
                    ? 'यद्यपि एग्रीऑप्टिमा एआई गणितीय रूप से जोखिम को कम करने और लाभ को अधिकतम करने के लिए सर्वोत्तम योजना तैयार करता है, परंतु प्राकृतिक आपदाओं (ओलावृष्टि, बादल फटना, कीट आक्रमण) से होने वाले अप्रत्याशित नुकसान के लिए मंच प्रत्यक्ष रूप से उत्तरदायी नहीं है।'
                    : 'While AgriOptima AI minimizes exposure to environmental volatility through dual-simplex optimization and stress penalties, agricultural outcomes remain inherently subject to force majeure natural events (severe hailstorms, sudden cloudbursts, pest outbreaks).'}
                </p>
              </div>

              {/* Section 5: Intellectual Property */}
              <div className="space-y-2">
                <h3 className="font-serif text-sm font-bold text-gold-200 flex items-center gap-2">
                  <HelpCircle size={15} className="text-gold-400" />
                  {isHi ? '5. बौद्धिक संपदा एवं उपयोग अधिकार' : '5. Intellectual Property & Fair Use'}
                </h3>
                <p>
                  {isHi
                    ? 'एग्रीऑप्टिमा एआई मंच के सभी एल्गोरिदम, अनुकूलन मॉडल, और यूजर इंटरफेस स्मार्ट इंडिया हैकाथॉन (SIH 2026) के तहत संरक्षित हैं। किसानों को व्यक्तिगत कृषि उपयोग के लिए निःशुल्क अधिकार प्रदान किया गया है।'
                    : 'All mathematical formulations, stress-testing routines, and interface designs are the intellectual property of AgriOptima AI (SIH 2026). Individual farmers are granted a non-exclusive, royalty-free license for personal agricultural decision-making.'}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="mt-5 flex items-center justify-between border-t border-gold-300/15 pt-4">
          <span className="font-mono text-[10px] text-cream-300/60">
            {isHi ? 'अंतिम अद्यतन: 23 अगस्त 2026' : 'Last Updated: August 23, 2026'}
          </span>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-gold-300/30 bg-gradient-to-r from-gold-400/20 to-gold-500/20 px-6 py-2 text-xs font-bold text-gold-200 hover:border-gold-300 hover:bg-gold-400/30 hover:text-white transition-all shadow-md"
          >
            {isHi ? 'बंद करें (Close)' : 'Close'}
          </button>
        </div>
      </div>
    </div>
  );
}
