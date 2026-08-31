/**
 * src/lib/governmentSchemes.ts
 * Authentic Agricultural Schemes & Financial Eligibility Engine for Indian Farmers.
 * Contains central and state-specific scheme databases and deterministic eligibility evaluation.
 */

export type SchemeCategory =
  | 'income_support'
  | 'insurance'
  | 'irrigation_subsidy'
  | 'mechanization_subsidy'
  | 'credit_loan'
  | 'solar_energy'
  | 'organic_farming'
  | 'state_specific';

export type EligibilityMatchLevel = 'POTENTIALLY_ELIGIBLE' | 'VERIFICATION_REQUIRED' | 'NOT_APPLICABLE';

export interface GovernmentScheme {
  id: string;
  name: { en: string; hi: string };
  officialCode: string;
  agency: { en: string; hi: string };
  category: SchemeCategory;
  benefitHighlight: { en: string; hi: string };
  shortDescription: { en: string; hi: string };
  detailedBenefits: { en: string[]; hi: string[] };
  qualificationCriteria: { en: string[]; hi: string[] };
  requiredDocuments: { en: string[]; hi: string[] };
  officialPortalUrl: string;
  isStateSpecific?: boolean;
  applicableStates?: string[];
  maxLandAcres?: number;
  minLandAcres?: number;
  applicableFarmerCategories?: ('small_marginal' | 'medium' | 'large' | 'women' | 'sc_st' | 'all')[];
  applicableCrops?: string[];
  applicableIrrigation?: ('rainfed' | 'canal' | 'borewell' | 'drip' | 'all')[];
}

export interface FarmerEligibilityInput {
  state: string;
  district: string;
  landAcres: number;
  primaryCrop: string;
  irrigationType: string;
  farmerCategory: 'small_marginal' | 'medium' | 'large' | 'women' | 'sc_st';
  preferredSupport: 'all' | 'income_support' | 'subsidies' | 'credit' | 'insurance';
  annualIncomeRange?: 'below_1_5L' | '1_5L_to_3L' | '3L_to_6L' | 'above_6L';
}

export interface SchemeEvaluationResult {
  scheme: GovernmentScheme;
  matchLevel: EligibilityMatchLevel;
  matchScore: number; // 0 to 100
  reasonsForMatch: { en: string[]; hi: string[] };
  verificationNotes: { en: string[]; hi: string[] };
  estimatedAnnualBenefitInr?: number;
  subsidyPercentage?: number;
}

export const INDIAN_AGRICULTURAL_SCHEMES: GovernmentScheme[] = [
  {
    id: 'pm-kisan',
    name: {
      en: 'PM-KISAN (Pradhan Mantri Kisan Samman Nidhi)',
      hi: 'पीएम-किसान (प्रधानमंत्री किसान सम्मान निधि)',
    },
    officialCode: 'PM-KISAN',
    agency: { en: 'Ministry of Agriculture & Farmers Welfare, Govt of India', hi: 'कृषि एवं किसान कल्याण मंत्रालय, भारत सरकार' },
    category: 'income_support',
    benefitHighlight: { en: '₹6,000 / year Direct Cash Transfer', hi: '₹6,000 / वर्ष प्रत्यक्ष बैंक अंतरण' },
    shortDescription: {
      en: 'Direct income support of ₹6,000 per year paid in three equal installments of ₹2,000 every 4 months directly into the farmer\'s bank account.',
      hi: 'सभी पात्र किसान परिवारों को प्रति वर्ष ₹6,000 की वित्तीय सहायता, ₹2,000 की तीन समान किस्तों में सीधे बैंक खाते में दी जाती है।',
    },
    detailedBenefits: {
      en: [
        '₹2,000 transferred every 4 months via Direct Benefit Transfer (DBT)',
        '100% centrally funded without middlemen',
        'Helps procure agricultural seeds, fertilizers, and meet farm input costs',
      ],
      hi: [
        'प्रत्येक 4 माह में ₹2,000 डीबीटी (DBT) के माध्यम से सीधे बैंक खाते में',
        '100% केंद्र सरकार द्वारा वित्तपोषित पारदर्शी सहायता',
        'बीज, खाद व कृषि आदानों की खरीद में तत्काल आर्थिक सहयोग',
      ],
    },
    qualificationCriteria: {
      en: [
        'Landholding farmer families with cultivable land in their name',
        'Aadhaar seeded bank account with e-KYC completed',
        'Institutional landholders and high-income tax payers are excluded',
      ],
      hi: [
        'अपने नाम पर कृषि योग्य भूमि रखने वाले सभी किसान परिवार',
        'आधार से जुड़ा बैंक खाता और ई-केवाईसी (e-KYC) पूर्ण होना आवश्यक',
        'संस्थागत भूमि धारक एवं आयकर दाता इस योजना में शामिल नहीं हैं',
      ],
    },
    requiredDocuments: {
      en: ['Aadhaar Card', 'Land Record (Khasra/Khatauni/ROR)', 'Bank Account Passbook', 'Active Mobile Number'],
      hi: ['आधार कार्ड', 'भू-अभिलेख (खसरा/खतौनी)', 'बैंक खाता पासबुक', 'सक्रिय मोबाइल नंबर'],
    },
    officialPortalUrl: 'https://pmkisan.gov.in',
    applicableFarmerCategories: ['all', 'small_marginal', 'medium', 'large', 'women', 'sc_st'],
  },
  {
    id: 'pmksy-micro-irrigation',
    name: {
      en: 'PMKSY (Per Drop More Crop - Drip & Sprinkler Subsidy)',
      hi: 'प्रधानमंत्री कृषि सिंचाई योजना (प्रति बूंद अधिक फसल - ड्रिप व स्प्रिंकलर)',
    },
    officialCode: 'PMKSY-PDMC',
    agency: { en: 'Department of Agriculture & Farmers Welfare', hi: 'कृषि एवं किसान कल्याण विभाग, भारत सरकार' },
    category: 'irrigation_subsidy',
    benefitHighlight: { en: '55% to 80% Capital Subsidy on Micro-Irrigation', hi: 'सूक्ष्म सिंचाई प्रणाली पर 55% से 80% तक सब्सिडी' },
    shortDescription: {
      en: 'High-value capital subsidy for installing precision drip and sprinkler micro-irrigation systems, saving up to 50% water and boosting yield by 30%.',
      hi: 'ड्रिप एवं फव्वारा सिंचाई संयंत्र लगाने के लिए भारी सब्सिडी, जिससे 50% तक पानी की बचत और 30% तक अधिक पैदावार प्राप्त होती है।',
    },
    detailedBenefits: {
      en: [
        '80% subsidy for Small & Marginal farmers (< 5 acres) in most states',
        '55% subsidy for other farmers',
        'Fertigation capability reducing fertilizer consumption by 25%',
      ],
      hi: [
        'अधिकांश राज्यों में लघु एवं सीमांत किसानों (< 5 एकड़) को 80% तक अनुदान',
        'अन्य सामान्य किसानों को 55% तक का पूंजीगत अनुदान',
        'फर्टिगेशन सुविधा जिससे 25% तक रासायनिक खाद की बचत',
      ],
    },
    qualificationCriteria: {
      en: [
        'Farmers with assured water source (borewell, well, canal, or farm pond)',
        'Cultivable land suitable for micro-irrigation setup',
      ],
      hi: [
        'निश्चित जल स्रोत (नलकूप, कुआं, नहर या खेत तालाब) वाले किसान',
        'सूक्ष्म सिंचाई प्रणाली स्थापित करने योग्य कृषि भूमि',
      ],
    },
    requiredDocuments: {
      en: ['Land Ownership Proof (7/12, Khasra)', 'Water Source Proof / Electricity Connection', 'Aadhaar Card', 'Soil & Water Test Report'],
      hi: ['भूमि स्वामित्व प्रमाण (खसरा/खतौनी/7-12)', 'जल स्रोत प्रमाण / बिजली कनेक्शन', 'आधार कार्ड', 'मृदा व जल परीक्षण रिपोर्ट'],
    },
    officialPortalUrl: 'https://pmksy.gov.in',
    applicableFarmerCategories: ['all', 'small_marginal', 'medium', 'women', 'sc_st'],
  },
  {
    id: 'pmfby-crop-insurance',
    name: {
      en: 'PMFBY (Pradhan Mantri Fasal Bima Yojana)',
      hi: 'प्रधानमंत्री फसल बीमा योजना (PMFBY)',
    },
    officialCode: 'PMFBY',
    agency: { en: 'Ministry of Agriculture & Farmers Welfare', hi: 'कृषि एवं किसान कल्याण मंत्रालय, भारत सरकार' },
    category: 'insurance',
    benefitHighlight: { en: 'Comprehensive Risk Cover at only 1.5% - 2% Premium', hi: 'मात्र 1.5% - 2% प्रीमियम पर संपूर्ण फसल सुरक्षा' },
    shortDescription: {
      en: 'Complete financial safety net covering yield losses from unseasonal rains, drought, pests, flood, and post-harvest localized risks.',
      hi: 'असमय वर्षा, सूखा, कीट-रोग, जलभराव एवं कटाई उपरांत फसल नुकसान पर पूर्ण वित्तीय सुरक्षा कवच।',
    },
    detailedBenefits: {
      en: [
        'Farmer pays only 1.5% premium for Rabi crops, 2.0% for Kharif crops, 5.0% for Commercial/Horticulture',
        'Direct satellite and crop-cutting experiment based claim settlement',
        'Covers prevented sowing, mid-season adversity, and localized calamity',
      ],
      hi: [
        'किसान द्वारा देय प्रीमियम: रबी फसल मात्र 1.5%, खरीफ फसल मात्र 2.0%, बागवानी 5.0%',
        'उपग्रह टेलीमेट्री व फसल कटाई प्रयोगों पर आधारित सीधा दावा निपटान',
        'बुवाई न हो पाने, मध्य सत्र प्रतिकूलता व स्थानीय आपदा पर पूर्ण क्षतिपूर्ति',
      ],
    },
    qualificationCriteria: {
      en: [
        'All farmers growing notified crops in notified areas',
        'Both loanee and non-loanee farmers eligible',
      ],
      hi: [
        'अधिसूचित क्षेत्रों में अधिसूचित फसलें उगाने वाले सभी किसान',
        'ऋणी एवं गैर-ऋणी दोनों प्रकार के किसान पात्र',
      ],
    },
    requiredDocuments: {
      en: ['Sowing Certificate / Patwari Report', 'Land Record Document', 'Bank Passbook with IFSC', 'Aadhaar Card'],
      hi: ['बुवाई प्रमाण पत्र / पटवारी रिपोर्ट', 'भू-अभिलेख खसरा नकल', 'बैंक पासबुक (IFSC कोड सहित)', 'आधार कार्ड'],
    },
    officialPortalUrl: 'https://pmfby.gov.in',
    applicableFarmerCategories: ['all', 'small_marginal', 'medium', 'large', 'women', 'sc_st'],
  },
  {
    id: 'kisan-credit-card',
    name: {
      en: 'Kisan Credit Card (KCC) Concessional Agri Credit',
      hi: 'किसान क्रेडिट कार्ड (KCC) रियायती कृषि ऋण',
    },
    officialCode: 'KCC-SCHEME',
    agency: { en: 'Reserve Bank of India & NABARD', hi: 'भारतीय रिजर्व बैंक एवं नाबार्ड' },
    category: 'credit_loan',
    benefitHighlight: { en: 'Loans up to ₹3 Lakh at 4% Effective Annual Interest', hi: '₹3 लाख तक का ऋण मात्र 4% प्रभावी वार्षिक ब्याज पर' },
    shortDescription: {
      en: 'Flexible institutional working capital credit for crop inputs, cultivation costs, maintenance, and post-harvest expenses with prompt repayment subvention.',
      hi: 'फसल लागत, बीज, खाद व कीटनाशक खरीद हेतु आसान संस्थागत कार्यशील ऋण, समय पर भुगतान करने पर 3% अतिरिक्त ब्याज छूट।',
    },
    detailedBenefits: {
      en: [
        'Base interest rate 7%, reduced to 4% with 3% Prompt Repayment Incentive',
        'Collateral-free loan limit up to ₹1.60 Lakh',
        'Includes crop cultivation, post-harvest expenses, and farm asset maintenance',
      ],
      hi: [
        'मूल ब्याज दर 7%, समय पर चुकाने पर 3% छूट के साथ मात्र 4% ब्याज',
        'बिना किसी बंधक (Collateral-free) ₹1.60 लाख तक का ऋण',
        'फसल बुवाई, कटाई उपरांत खर्च एवं कृषि उपकरणों के रखरखाव में मान्य',
      ],
    },
    qualificationCriteria: {
      en: [
        'All individual land-owning farmers, joint borrowers, tenant farmers, and sharecroppers',
        'Engaged in crop cultivation or animal husbandry/fisheries',
      ],
      hi: [
        'सभी व्यक्तिगत भूस्वामी किसान, साझेदार किसान, बटाईदार व काश्तकार',
        'फसल उत्पादन, पशुपालन अथवा मत्स्य पालन में संलग्न',
      ],
    },
    requiredDocuments: {
      en: ['Land Record Ledger / Lease Deed', 'Identity Proof (Aadhaar/Voter ID)', 'Passport Size Photographs', 'No Dues Certificate (if applicable)'],
      hi: ['भू-अभिलेख खतौनी / पट्टा दस्तावेज', 'पहचान प्रमाण (आधार/मतदाता पत्र)', 'पासपोर्ट फोटो', 'अदेयता प्रमाण पत्र'],
    },
    officialPortalUrl: 'https://myscheme.gov.in',
    applicableFarmerCategories: ['all', 'small_marginal', 'medium', 'large', 'women', 'sc_st'],
  },
  {
    id: 'pm-kusum-solar-pump',
    name: {
      en: 'PM-KUSUM (Solar Agricultural Pump Subsidy Scheme)',
      hi: 'पीएम-कुसुम (सोलर कृषि पंप अनुदान योजना)',
    },
    officialCode: 'PM-KUSUM',
    agency: { en: 'Ministry of New & Renewable Energy, Govt of India', hi: 'नवीन एवं नवीकरणीय ऊर्जा मंत्रालय, भारत सरकार' },
    category: 'solar_energy',
    benefitHighlight: { en: 'Up to 60% - 90% Subsidy on Standalone Solar Pumps', hi: 'सोलर कृषि पंप पर 60% से 90% तक की भारी सब्सिडी' },
    shortDescription: {
      en: 'Replaces costly diesel generators with dependable daytime solar-powered irrigation pumps, dramatically cutting operational farming expenses to zero.',
      hi: 'महंगे डीजल पंपों से मुक्ति और दिन में निर्बाध सिंचाई हेतु सोलर पंप की स्थापना, जिससे सिंचाई का दैनिक खर्च शून्य हो जाता है।',
    },
    detailedBenefits: {
      en: [
        'Central Govt provides 30% subsidy, State Govt provides 30% to 50% subsidy',
        'Farmer only pays 10% to 40% of total system cost',
        'Guaranteed daytime irrigation eliminating night farm visits',
      ],
      hi: [
        'केंद्र सरकार द्वारा 30% तथा राज्य सरकार द्वारा 30% से 50% तक का अनुदान',
        'किसान को कुल लागत का मात्र 10% से 40% हिस्सा वहन करना होता है',
        'दिन के समय निर्बाध सौर ऊर्जा से सिंचाई, रात में खेत जाने की आवश्यकता नहीं',
      ],
    },
    qualificationCriteria: {
      en: [
        'Farmers having cultivable land with borewell/open well or water body',
        'Preference to farmers without existing electric grid connection',
      ],
      hi: [
        'कृषि भूमि तथा नलकूप/कुआं या जल स्रोत उपलब्ध रखने वाले किसान',
        'बिजली ग्रिड कनेक्शन विहीन क्षेत्रों के किसानों को विशेष प्राथमिकता',
      ],
    },
    requiredDocuments: {
      en: ['Land Title Deed (Khasra/Khatauni)', 'Borewell / Water Source Certificate', 'Aadhaar Card', 'Bank Passbook'],
      hi: ['जमीन की खसरा/खतौनी नकल', 'जल स्रोत / बोरवेल प्रमाण', 'आधार कार्ड', 'बैंक पासबुक'],
    },
    officialPortalUrl: 'https://pmkusum.mnre.gov.in',
    applicableFarmerCategories: ['all', 'small_marginal', 'medium', 'women', 'sc_st'],
  },
  {
    id: 'smam-farm-mechanization',
    name: {
      en: 'SMAM (Sub-Mission on Agricultural Mechanization)',
      hi: 'कृषि यंत्रीकरण उप-मिशन (ट्रैक्टर व कृषि उपकरण सब्सिडी)',
    },
    officialCode: 'SMAM',
    agency: { en: 'Department of Agriculture & Cooperation', hi: 'कृषि एवं सहकारिता विभाग, भारत सरकार' },
    category: 'mechanization_subsidy',
    benefitHighlight: { en: '40% to 50% Subsidy on Farm Equipment & Implements', hi: 'कृषि यंत्रों, रोटावेटर व कल्टीवेटर पर 40% से 50% सब्सिडी' },
    shortDescription: {
      en: 'Financial grants for purchasing modern farm machinery including power tillers, rotavators, seed drills, laser levelers, and sprayers.',
      hi: 'आधुनिक कृषि उपकरणों जैसे पावर टिलर, रोटावेटर, सीड-ड्रिल, लेजर लैंड लेवलर व पावर स्प्रेयर की खरीद पर वित्तीय अनुदान।',
    },
    detailedBenefits: {
      en: [
        '50% subsidy for Small, Marginal, SC/ST, and Women farmers',
        '40% subsidy for other general category farmers',
        'Substantially reduces manual labor time and optimizes tillage',
      ],
      hi: [
        'लघु, सीमांत, महिला एवं अनुसूचित जाति/जनजाति किसानों को 50% तक छूट',
        'अन्य सामान्य श्रेणी के किसानों को 40% तक की छूट',
        'खेत की तैयारी के समय में 60% तक की बचत और कार्यक्षमता में वृद्धि',
      ],
    },
    qualificationCriteria: {
      en: [
        'Individual farmers with verified land records',
        'Should not have availed subsidy on same equipment in last 3-5 years',
      ],
      hi: [
        'सत्यापित भू-अभिलेख रखने वाले व्यक्तिगत कृषक',
        'विगत 3-5 वर्षों में उसी कृषि उपकरण पर सरकारी अनुदान न लिया हो',
      ],
    },
    requiredDocuments: {
      en: ['Land Record Proof', 'Aadhaar Card', 'Quotation from Authorized Implement Dealer', 'Bank Details'],
      hi: ['भू-अभिलेख प्रमाण', 'आधार कार्ड', 'अधिकृत कृषि यंत्र डीलर का कोटेशन', 'बैंक खाता विवरण'],
    },
    officialPortalUrl: 'https://agrimachinery.nic.in',
    applicableFarmerCategories: ['all', 'small_marginal', 'medium', 'women', 'sc_st'],
  },
  {
    id: 'pkvy-organic-farming',
    name: {
      en: 'PKVY (Paramparagat Krishi Vikas Yojana - Organic Farming)',
      hi: 'परम्परागत कृषि विकास योजना (जैविक एवं प्राकृतिक खेती प्रोत्साहन)',
    },
    officialCode: 'PKVY',
    agency: { en: 'Ministry of Agriculture & Farmers Welfare', hi: 'कृषि एवं किसान कल्याण मंत्रालय, भारत सरकार' },
    category: 'organic_farming',
    benefitHighlight: { en: '₹50,000 / hectare over 3 Years for Organic Inputs & Certification', hi: 'जैविक खाद, कीटनाशक व प्रमाणीकरण हेतु ₹50,000 / हेक्टेयर (3 वर्ष)' },
    shortDescription: {
      en: 'Comprehensive financial incentive to transition conventional farms to certified organic cultivation with zero synthetic chemical dependency.',
      hi: 'रासायनिक उर्वरकों से मुक्त पारंपरिक जैविक खेती अपनाने, जैविक खाद तैयार करने व जैविक प्रमाणीकरण के लिए वित्तीय सहायता।',
    },
    detailedBenefits: {
      en: [
        '₹31,000/ha directly provided for organic inputs, vermicompost, and bio-fertilizers',
        '₹8,800/ha provided for post-harvest, packaging, and mandi marketing linkage',
        'Free PGS-India organic certification',
      ],
      hi: [
        'जैविक खाद, वर्मीकम्पोस्ट व जैव-कीटनाशकों की खरीद हेतु ₹31,000/हेक्टेयर सीधा सहयोग',
        'कटाई उपरांत पैकेजिंग, ब्रांडिंग व मंडी विपणन हेतु ₹8,800/हेक्टेयर',
        'निःशुल्क पीजीएस-इंडिया (PGS-India) जैविक प्रमाणीकरण',
      ],
    },
    qualificationCriteria: {
      en: [
        'Farmers willing to adopt certified organic agricultural practices in clusters of 20 or more farmers',
      ],
      hi: [
        '20 या अधिक किसानों के समूह में जैविक खेती अपनाने के इच्छुक कृषक',
      ],
    },
    requiredDocuments: {
      en: ['Aadhaar Card', 'Land Record Document', 'Group Registration / Farmer Producer Group Form', 'Bank Passbook'],
      hi: ['आधार कार्ड', 'भू-अभिलेख नकल', 'कृषक समूह पंजीकरण प्रपत्र', 'बैंक पासबुक'],
    },
    officialPortalUrl: 'https://pgsindia-ncof.gov.in',
    applicableFarmerCategories: ['all', 'small_marginal', 'medium', 'women', 'sc_st'],
  },
  // --- STATE SPECIFIC SCHEMES ---
  {
    id: 'mp-kisan-kalyan',
    name: {
      en: 'MP Mukhyamantri Kisan Kalyan Yojana',
      hi: 'मध्य प्रदेश मुख्यमंत्री किसान कल्याण योजना',
    },
    officialCode: 'MP-MKKY',
    agency: { en: 'Department of Revenue & Agriculture, Govt of Madhya Pradesh', hi: 'राजस्व एवं कृषि विभाग, मध्य प्रदेश शासन' },
    category: 'state_specific',
    benefitHighlight: { en: 'Additional ₹6,000 / year State Top-Up (Total ₹12,000 / yr)', hi: 'अतिरिक्त ₹6,000 / वर्ष राज्य सहायता (कुल ₹12,000 / वर्ष)' },
    shortDescription: {
      en: 'State top-up scheme providing additional ₹6,000 annually over and above PM-KISAN, giving eligible MP farmers a total of ₹12,000 per year.',
      hi: 'पीएम-किसान के अतिरिक्त मध्य प्रदेश सरकार द्वारा ₹6,000 प्रति वर्ष की अतिरिक्त सहायता, जिससे कुल ₹12,000 वार्षिक प्राप्त होते हैं।',
    },
    detailedBenefits: {
      en: [
        '₹6,000 transferred in two equal installments of ₹3,000 each',
        'Combined with PM-KISAN, provides ₹12,000 guaranteed annual support',
        'Direct Bank Transfer into verified Samagra ID linked account',
      ],
      hi: [
        '₹3,000 की दो समान किस्तों में ₹6,000 का वार्षिक भुगतान',
        'पीएम-किसान के साथ मिलकर कुल ₹12,000 वार्षिक सुनिश्चित सहयोग',
        'समग्र आईडी से लिंक सत्यापित बैंक खाते में सीधा अंतरण',
      ],
    },
    qualificationCriteria: {
      en: [
        'Resident farmers of Madhya Pradesh enrolled in PM-KISAN',
        'Verified on MP Saara portal with Samagra e-KYC',
      ],
      hi: [
        'मध्य प्रदेश के मूल निवासी किसान जो पीएम-किसान में पंजीकृत हैं',
        'एमपी सारा (SAARA) पोर्टल पर सत्यापित एवं समग्र ई-केवाईसी पूर्ण',
      ],
    },
    requiredDocuments: {
      en: ['Samagra ID', 'Aadhaar Card', 'MP Land Record (B-1/Khasra)', 'Bank Passbook'],
      hi: ['समग्र परिवार आईडी', 'आधार कार्ड', 'खसरा बी-1 नकल', 'बैंक पासबुक'],
    },
    officialPortalUrl: 'https://saara.mp.gov.in',
    isStateSpecific: true,
    applicableStates: ['Madhya Pradesh'],
    applicableFarmerCategories: ['all', 'small_marginal', 'medium', 'large', 'women', 'sc_st'],
  },
  {
    id: 'mh-namo-shetkari',
    name: {
      en: 'Maharashtra Namo Shetkari Maha Samman Nidhi Yojana',
      hi: 'महाराष्ट्र नमो शेतकरी महा सन्मान निधी योजना',
    },
    officialCode: 'MH-NSMSNY',
    agency: { en: 'Department of Agriculture, Govt of Maharashtra', hi: 'कृषि विभाग, महाराष्ट्र शासन' },
    category: 'state_specific',
    benefitHighlight: { en: 'Additional ₹6,000 / year State Top-Up (Total ₹12,000 / yr)', hi: 'अतिरिक्त ₹6,000 / वर्ष राज्य सहायता (कुल ₹12,000 / वर्ष)' },
    shortDescription: {
      en: 'Maharashtra state government companion scheme contributing ₹6,000/yr alongside PM-KISAN, providing ₹12,000 total annual liquidity.',
      hi: 'महाराष्ट्र शासन द्वारा पीएम-किसान के साथ ₹6,000 प्रतिवर्ष की अतिरिक्त आर्थिक मदद, कुल ₹12,000 वार्षिक सहायता।',
    },
    detailedBenefits: {
      en: [
        '₹6,000 per annum paid in 3 installments of ₹2,000 each',
        'Combined annual financial assistance of ₹12,000',
        'Aadhaar-based direct bank transfer',
      ],
      hi: [
        '₹2,000 की तीन किस्तों में ₹6,000 प्रति वर्ष का भुगतान',
        'कुल ₹12,000 की वार्षिक सीधी आर्थिक सुरक्षा',
        'आधार आधारित पारदर्शी डीबीटी भुगतान',
      ],
    },
    qualificationCriteria: {
      en: [
        'Resident landholding farmers of Maharashtra active on PM-KISAN portal',
      ],
      hi: [
        'महाराष्ट्र के भूस्वामी किसान जो पीएम-किसान पोर्टल पर सक्रिय हैं',
      ],
    },
    requiredDocuments: {
      en: ['Aadhaar Card', '7/12 & 8-A Extract', 'Bank Passbook'],
      hi: ['आधार कार्ड', '7/12 व 8-अ उतारा', 'बैंक पासबुक'],
    },
    officialPortalUrl: 'https://krishi.maharashtra.gov.in',
    isStateSpecific: true,
    applicableStates: ['Maharashtra'],
    applicableFarmerCategories: ['all', 'small_marginal', 'medium', 'large', 'women', 'sc_st'],
  },
  {
    id: 'up-kisan-kalyan-mission',
    name: {
      en: 'UP Kisan Kalyan Mission & Certified Seed Grant',
      hi: 'उत्तर प्रदेश किसान कल्याण मिशन व प्रमाणित बीज अनुदान',
    },
    officialCode: 'UP-KKM',
    agency: { en: 'Department of Agriculture, Govt of Uttar Pradesh', hi: 'कृषि विभाग, उत्तर प्रदेश सरकार' },
    category: 'state_specific',
    benefitHighlight: { en: 'Up to 50% Direct Subsidy on High-Yield Certified Seeds', hi: 'उच्च उपज प्रमाणित बीजों पर 50% तक सीधा अनुदान' },
    shortDescription: {
      en: 'Subsidized distribution of certified seeds for wheat, paddy, pulses, and oilseeds, along with mini-kit distribution for small farmers.',
      hi: 'गेहूं, धान, दलहन व तिलहन के प्रमाणित बीजों पर 50% अनुदान एवं लघु किसानों को निःशुल्क मिनीकिट वितरण।',
    },
    detailedBenefits: {
      en: [
        'Direct 50% subsidy credited directly to bank account on purchasing certified seeds from government stores',
        'Free seed mini-kits for high-protein pulses and oilseed crops',
      ],
      hi: [
        'राजकीय कृषि बीज भंडारों से प्रमाणित बीज खरीद पर 50% अनुदान सीधे बैंक खाते में',
        'दलहन एवं तिलहन फसलों के निःशुल्क उन्नत बीज मिनीकिट',
      ],
    },
    qualificationCriteria: {
      en: ['Registered farmers on UP Agriculture Portal (upagriculture.com)'],
      hi: ['यूपी कृषि विभाग पोर्टल (upagriculture.com) पर पंजीकृत कृषक'],
    },
    requiredDocuments: {
      en: ['UP Kisan Registration Number', 'Aadhaar Card', 'Land Record Khatauni'],
      hi: ['यूपी किसान पंजीकरण संख्या', 'आधार कार्ड', 'खतौनी नकल'],
    },
    officialPortalUrl: 'https://upagriculture.com',
    isStateSpecific: true,
    applicableStates: ['Uttar Pradesh'],
    applicableFarmerCategories: ['all', 'small_marginal', 'medium', 'women', 'sc_st'],
  },
];

/**
 * Evaluates farmer eligibility across all schemes using deterministic rules.
 */
export function evaluateFarmerSchemeEligibility(
  input: FarmerEligibilityInput
): SchemeEvaluationResult[] {
  const results: SchemeEvaluationResult[] = [];

  for (const scheme of INDIAN_AGRICULTURAL_SCHEMES) {
    let matchLevel: EligibilityMatchLevel = 'POTENTIALLY_ELIGIBLE';
    let matchScore = 80;
    const reasonsForMatchEn: string[] = [];
    const reasonsForMatchHi: string[] = [];
    const verificationNotesEn: string[] = [];
    const verificationNotesHi: string[] = [];

    // 1. State-specific Check
    if (scheme.isStateSpecific && scheme.applicableStates) {
      const stateMatch = scheme.applicableStates.some(
        (s) => s.toLowerCase() === input.state.toLowerCase()
      );
      if (!stateMatch) {
        continue; // Skip schemes from other states
      } else {
        matchScore += 10;
        reasonsForMatchEn.push(`Available in ${input.state}`);
        reasonsForMatchHi.push(`${input.state} राज्य में विशेष रूप से उपलब्ध`);
      }
    }

    // 2. Farmer Category / Land Size Check
    const isSmallMarginal = input.landAcres <= 5.0; // <= 2 Hectares
    if (isSmallMarginal) {
      matchScore += 10;
      reasonsForMatchEn.push(`Priority eligibility for Small/Marginal landholding (${input.landAcres.toFixed(1)} acres)`);
      reasonsForMatchHi.push(`लघु एवं सीमांत जोत (${input.landAcres.toFixed(1)} एकड़) के लिए प्राथमिकता एवं अधिकतम अनुदान`);
    }

    // 3. Category Filter Match
    if (input.preferredSupport !== 'all') {
      if (input.preferredSupport === 'income_support' && scheme.category !== 'income_support' && scheme.category !== 'state_specific') {
        matchScore -= 20;
      }
      if (input.preferredSupport === 'subsidies' && !scheme.category.includes('subsidy') && scheme.category !== 'solar_energy') {
        matchScore -= 20;
      }
      if (input.preferredSupport === 'credit' && scheme.category !== 'credit_loan') {
        matchScore -= 20;
      }
      if (input.preferredSupport === 'insurance' && scheme.category !== 'insurance') {
        matchScore -= 20;
      }
    }

    // 4. Scheme Specific Logic
    if (scheme.id === 'pmksy-micro-irrigation') {
      if (input.irrigationType.toLowerCase().includes('drip') || input.irrigationType.toLowerCase().includes('sprinkler') || input.irrigationType.toLowerCase().includes('borewell')) {
        matchScore += 10;
        reasonsForMatchEn.push(`Matches your irrigation profile (${input.irrigationType})`);
        reasonsForMatchHi.push(`आपकी सिंचाई प्रणाली (${input.irrigationType}) के अनुकूल`);
      } else {
        matchLevel = 'VERIFICATION_REQUIRED';
        verificationNotesEn.push('Requires verified water source connection at farm');
        verificationNotesHi.push('खेत पर सक्रिय जल स्रोत (कुआं/नलकूप/तालाब) का सत्यापन आवश्यक');
      }
    }

    if (scheme.id === 'pm-kusum-solar-pump') {
      if (input.landAcres >= 1) {
        reasonsForMatchEn.push('Land size is adequate for standalone solar pump installation');
        reasonsForMatchHi.push('सोलर पंप स्थापना हेतु पर्याप्त भूमि उपलब्ध');
      } else {
        matchLevel = 'VERIFICATION_REQUIRED';
        verificationNotesEn.push('Requires minimum water source discharge capacity');
        verificationNotesHi.push('जल स्रोत की न्यूनतम डिस्चार्ज क्षमता का सत्यापन आवश्यक');
      }
    }

    if (scheme.id === 'pmfby-crop-insurance') {
      reasonsForMatchEn.push(`Notified crop protection for ${input.primaryCrop || 'seasonal crops'}`);
      reasonsForMatchHi.push(`${input.primaryCrop || 'वर्तमान मौसमी फसल'} के लिए अधिसूचित सुरक्षा कवच`);
    }

    // Default general matches
    if (reasonsForMatchEn.length === 0) {
      reasonsForMatchEn.push('Landholding meets central scheme baseline criteria');
      reasonsForMatchHi.push('भूमि जोत केंद्रीय योजना के मूलभूत मानदंडों के अनुरूप है');
    }

    // Standard verification notes
    verificationNotesEn.push('Final approval depends on Aadhaar e-KYC and land record verification on the official portal.');
    verificationNotesHi.push('अंतिम स्वीकृति आधार ई-केवाईसी और आधिकारिक सरकारी पोर्टल पर भू-अभिलेख सत्यापन पर निर्भर करेगी।');

    // Benefit Estimation
    let estimatedAnnualBenefitInr: number | undefined;
    let subsidyPercentage: number | undefined;

    if (scheme.id === 'pm-kisan') estimatedAnnualBenefitInr = 6000;
    if (scheme.id === 'mp-kisan-kalyan' || scheme.id === 'mh-namo-shetkari') estimatedAnnualBenefitInr = 6000;
    if (scheme.id === 'pmksy-micro-irrigation') subsidyPercentage = isSmallMarginal ? 80 : 55;
    if (scheme.id === 'pm-kusum-solar-pump') subsidyPercentage = 60;
    if (scheme.id === 'smam-farm-mechanization') subsidyPercentage = isSmallMarginal ? 50 : 40;

    results.push({
      scheme,
      matchLevel,
      matchScore: Math.min(99, Math.max(40, matchScore)),
      reasonsForMatch: { en: reasonsForMatchEn, hi: reasonsForMatchHi },
      verificationNotes: { en: verificationNotesEn, hi: verificationNotesHi },
      estimatedAnnualBenefitInr,
      subsidyPercentage,
    });
  }

  // Sort by match score descending
  return results.sort((a, b) => b.matchScore - a.matchScore);
}
