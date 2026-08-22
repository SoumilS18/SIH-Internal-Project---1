/**
 * src/i18n/cropNames.ts
 * Dynamic Crop Name Localization Mapping.
 * Translates crop names for UI presentation while preserving backend crop identifiers.
 */

export const CROP_TRANSLATIONS: Record<string, { hi: string }> = {
  soyabean: { hi: 'सोयाबीन' },
  soybean: { hi: 'सोयाबीन' },
  wheat: { hi: 'गेहूँ' },
  maize: { hi: 'मक्का' },
  pigeonpea: { hi: 'अरहर (तूर)' },
  'pigeonpea (arhar)': { hi: 'अरहर (तूर)' },
  arhar: { hi: 'अरहर' },
  tur: { hi: 'तूर / अरहर' },
  groundnut: { hi: 'मूंगफली' },
  sugarcane: { hi: 'गन्ना' },
  cotton: { hi: 'कपास' },
  mustard: { hi: 'सरसों' },
  rapeseed: { hi: 'सरसों / तोरिया' },
  'rapeseed & mustard': { hi: 'सरसों व राई' },
  rice: { hi: 'धान (चावल)' },
  paddy: { hi: 'धान' },
  gram: { hi: 'चना' },
  chickpea: { hi: 'चना' },
  moong: { hi: 'मूंग' },
  'green gram': { hi: 'मूंग' },
  urad: { hi: 'उड़द' },
  'black gram': { hi: 'उड़द' },
  bajra: { hi: 'बाजरा' },
  'pearl millet': { hi: 'बाजरा' },
  jowar: { hi: 'ज्वार' },
  sorghum: { hi: 'ज्वार' },
  barley: { hi: 'जौ' },
  potato: { hi: 'आलू' },
  onion: { hi: 'प्याज' },
  tomato: { hi: 'टमाटर' },
  sunflower: { hi: 'सूरजमुखी' },
  sesamum: { hi: 'तिल' },
  sesame: { hi: 'तिल' },
  jute: { hi: 'जूट / पटसन' },
  fallow: { hi: 'परती भूमि' },
  'fallow land': { hi: 'परती भूमि' },
};

export function getCropDisplayName(cropName: string | null | undefined, lang: string = 'en'): string {
  if (!cropName) return '';
  if (lang !== 'hi') return cropName;

  const key = cropName.toLowerCase().trim();
  if (CROP_TRANSLATIONS[key]) {
    return CROP_TRANSLATIONS[key].hi;
  }

  // Check partial match
  for (const [k, v] of Object.entries(CROP_TRANSLATIONS)) {
    if (key.includes(k)) {
      return v.hi;
    }
  }

  return cropName;
}
