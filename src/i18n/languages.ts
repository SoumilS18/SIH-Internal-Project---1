export interface LanguageOption {
  code: string;
  label: string; // Native script
  english: string; // English name
  status: 'available' | 'coming_soon';
  isScheduled: boolean; // Recognized under Eighth Schedule of Constitution of India
}

// 1. English is an official associate language but NOT one of the 22 Eighth Schedule languages
export const ENGLISH_LANGUAGE: LanguageOption = {
  code: 'en',
  label: 'English',
  english: 'English',
  status: 'available',
  isScheduled: false,
};

// 2. The 22 Scheduled Indian Languages under the Eighth Schedule of the Constitution of India
export const SCHEDULED_INDIAN_LANGUAGES: LanguageOption[] = [
  { code: 'as', label: 'অসমীয়া', english: 'Assamese', status: 'coming_soon', isScheduled: true },
  { code: 'bn', label: 'বাংলা', english: 'Bengali', status: 'coming_soon', isScheduled: true },
  { code: 'brx', label: 'बर’', english: 'Bodo', status: 'coming_soon', isScheduled: true },
  { code: 'doi', label: 'डोगरी', english: 'Dogri', status: 'coming_soon', isScheduled: true },
  { code: 'gu', label: 'ગુજરાતી', english: 'Gujarati', status: 'coming_soon', isScheduled: true },
  { code: 'hi', label: 'हिन्दी', english: 'Hindi', status: 'available', isScheduled: true },
  { code: 'kn', label: 'ಕನ್ನಡ', english: 'Kannada', status: 'coming_soon', isScheduled: true },
  { code: 'ks', label: 'کٲشُر / डोगरी', english: 'Kashmiri', status: 'coming_soon', isScheduled: true },
  { code: 'kok', label: 'कोंकणी', english: 'Konkani', status: 'coming_soon', isScheduled: true },
  { code: 'mai', label: 'मैथिली', english: 'Maithili', status: 'coming_soon', isScheduled: true },
  { code: 'ml', label: 'മലയാളം', english: 'Malayalam', status: 'coming_soon', isScheduled: true },
  { code: 'mni', label: 'মৈতৈলোন্', english: 'Manipuri', status: 'coming_soon', isScheduled: true },
  { code: 'mr', label: 'मराठी', english: 'Marathi', status: 'coming_soon', isScheduled: true },
  { code: 'ne', label: 'नेपाली', english: 'Nepali', status: 'coming_soon', isScheduled: true },
  { code: 'or', label: 'ଓଡ଼ିଆ', english: 'Odia', status: 'coming_soon', isScheduled: true },
  { code: 'pa', label: 'ਪੰਜਾਬੀ', english: 'Punjabi', status: 'coming_soon', isScheduled: true },
  { code: 'sa', label: 'संस्कृतम्', english: 'Sanskrit', status: 'coming_soon', isScheduled: true },
  { code: 'sat', label: 'ᱥᱟᱱᱛᱟᱲᱤ', english: 'Santali', status: 'coming_soon', isScheduled: true },
  { code: 'sd', label: 'سنڌي / सिन्धी', english: 'Sindhi', status: 'coming_soon', isScheduled: true },
  { code: 'ta', label: 'தமிழ்', english: 'Tamil', status: 'coming_soon', isScheduled: true },
  { code: 'te', label: 'తెలుగు', english: 'Telugu', status: 'coming_soon', isScheduled: true },
  { code: 'ur', label: 'اردو', english: 'Urdu', status: 'coming_soon', isScheduled: true },
];

// All 23 Languages Total (English + 22 Scheduled Indian Languages)
export const ALL_SUPPORTED_LANGUAGES: LanguageOption[] = [
  ENGLISH_LANGUAGE,
  ...SCHEDULED_INDIAN_LANGUAGES,
];

// Available fully localized languages
export const AVAILABLE_LANGUAGES: LanguageOption[] = ALL_SUPPORTED_LANGUAGES.filter(
  (l) => l.status === 'available'
);

export type LanguageCode = string;

export function getLanguageByCode(code: string): LanguageOption {
  return (
    ALL_SUPPORTED_LANGUAGES.find((l) => l.code === code) || ENGLISH_LANGUAGE
  );
}

export function isLanguageAvailable(code: string): boolean {
  const lang = getLanguageByCode(code);
  return lang.status === 'available';
}
