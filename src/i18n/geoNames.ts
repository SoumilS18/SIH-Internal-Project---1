/**
 * src/i18n/geoNames.ts
 * Exhaustive Geographic State & District Name Localization.
 * Provides complete official Hindi script for all 36 Indian states/UTs and all 786 Indian districts.
 */

import districtsData from './districtsHindi.json';

export const STATE_TRANSLATIONS: Record<string, { hi: string }> = {
  'andaman and nicobar islands': { hi: 'अंडमान और निकोबार द्वीप समूह' },
  'andhra pradesh': { hi: 'आंध्र प्रदेश' },
  'arunachal pradesh': { hi: 'अरुणाचल प्रदेश' },
  assam: { hi: 'असम' },
  bihar: { hi: 'बिहार' },
  chandigarh: { hi: 'चंडीगढ़' },
  chhattisgarh: { hi: 'छत्तीसगढ़' },
  'dadra and nagar haveli and daman and diu': { hi: 'दादरा और नगर हवेली तथा दमन और दीव' },
  delhi: { hi: 'दिल्ली' },
  goa: { hi: 'गोवा' },
  gujarat: { hi: 'गुजरात' },
  haryana: { hi: 'हरियाणा' },
  'himachal pradesh': { hi: 'हिमाचल प्रदेश' },
  'jammu and kashmir': { hi: 'जम्मू और कश्मीर' },
  jharkhand: { hi: 'झारखंड' },
  karnataka: { hi: 'कर्नाटक' },
  kerala: { hi: 'केरल' },
  ladakh: { hi: 'लद्दाख' },
  lakshadweep: { hi: 'लक्षद्वीप' },
  'madhya pradesh': { hi: 'मध्य प्रदेश' },
  maharashtra: { hi: 'महाराष्ट्र' },
  manipur: { hi: 'मणिपुर' },
  meghalaya: { hi: 'मेघालय' },
  mizoram: { hi: 'मिज़ोरम' },
  nagaland: { hi: 'नागालैंड' },
  odisha: { hi: 'ओडिशा' },
  puducherry: { hi: 'पुडुचेरी' },
  punjab: { hi: 'पंजाब' },
  rajasthan: { hi: 'राजस्थान' },
  sikkim: { hi: 'सिक्किम' },
  'tamil nadu': { hi: 'तमिलनाडु' },
  telangana: { hi: 'तेलंगाना' },
  tripura: { hi: 'त्रिपुरा' },
  'uttar pradesh': { hi: 'उत्तर प्रदेश' },
  uttarakhand: { hi: 'उत्तराखंड' },
  'west bengal': { hi: 'पश्चिम बंगाल' },
};

const ALL_DISTRICTS_HINDI: Record<string, string> = districtsData as Record<string, string>;

export function getStateDisplayName(stateName: string | null | undefined, lang: string = 'en'): string {
  if (!stateName) return '';
  if (lang !== 'hi') return stateName;

  const key = stateName.toLowerCase().trim();
  if (STATE_TRANSLATIONS[key]) {
    return STATE_TRANSLATIONS[key].hi;
  }

  // Partial match check
  for (const [k, v] of Object.entries(STATE_TRANSLATIONS)) {
    if (key.includes(k) || k.includes(key)) {
      return v.hi;
    }
  }

  return stateName;
}

export function getDistrictDisplayName(districtName: string | null | undefined, lang: string = 'en'): string {
  if (!districtName) return '';
  if (lang !== 'hi') return districtName;

  const key = districtName.toLowerCase().trim();

  // 1. Direct dictionary match
  if (ALL_DISTRICTS_HINDI[key]) {
    return ALL_DISTRICTS_HINDI[key];
  }

  // 2. Normalized key match (removing hyphens, extra spaces)
  const normalizedKey = key.replace(/[-_]/g, ' ').replace(/\s+/g, ' ');
  if (ALL_DISTRICTS_HINDI[normalizedKey]) {
    return ALL_DISTRICTS_HINDI[normalizedKey];
  }

  // 3. Partial key match
  for (const [k, val] of Object.entries(ALL_DISTRICTS_HINDI)) {
    if (key.includes(k) || k.includes(key)) {
      return val;
    }
  }

  return districtName;
}
