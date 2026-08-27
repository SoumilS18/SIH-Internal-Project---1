/**
 * FARM VOCABULARY — one source of truth for the words and short descriptors
 * attached to the farmer's own inputs (irrigation, reliability, season, risk).
 *
 * The planning flow, the analysis cinematic and the plan reveal all name these
 * values, and they must name them identically. Everything here is a *definition*
 * of an option the farmer selected — never an agronomic recommendation.
 */

import type { FarmDecisionRequest } from '@/types/farm';

export type IrrigationType = FarmDecisionRequest['irrigation_type'];
export type Reliability = FarmDecisionRequest['irrigation_reliability'];
export type Season = FarmDecisionRequest['season'];
export type RiskTolerance = FarmDecisionRequest['risk_tolerance'];

export interface VocabEntry<T extends string> {
  id: T;
  en: string;
  hi: string;
  /** One short factual line. Not advice. */
  enSub: string;
  hiSub: string;
}

/** Ordered from most common in Indian smallholdings to most engineered. */
export const IRRIGATION: VocabEntry<IrrigationType>[] = [
  {
    id: 'Rainfed',
    en: 'Rainfed',
    hi: 'वर्षा आधारित',
    enSub: 'Depends on monsoon rain',
    hiSub: 'मानसून की वर्षा पर निर्भर',
  },
  {
    id: 'Borewell',
    en: 'Borewell',
    hi: 'बोरवेल',
    enSub: 'Groundwater pumped on demand',
    hiSub: 'मांग पर भूजल',
  },
  {
    id: 'Canal',
    en: 'Canal',
    hi: 'नहर',
    enSub: 'Scheduled surface water',
    hiSub: 'निर्धारित समय पर नहर का पानी',
  },
  {
    id: 'Sprinkler',
    en: 'Sprinkler',
    hi: 'स्प्रिंकलर',
    enSub: 'Overhead spray across the field',
    hiSub: 'खेत पर ऊपर से फुहार',
  },
  {
    id: 'Drip',
    en: 'Drip',
    hi: 'ड्रिप',
    enSub: 'Water delivered at the root',
    hiSub: 'सीधे जड़ तक पानी',
  },
];

export const RELIABILITY: VocabEntry<Reliability>[] = [
  { id: 'High', en: 'Dependable', hi: 'भरोसेमंद', enSub: 'Water almost always available', hiSub: 'पानी लगभग हमेशा उपलब्ध' },
  { id: 'Medium', en: 'Variable', hi: 'परिवर्तनशील', enSub: 'Available most of the season', hiSub: 'मौसम में अधिकांश समय उपलब्ध' },
  { id: 'Low', en: 'Uncertain', hi: 'अनिश्चित', enSub: 'Often short when needed', hiSub: 'ज़रूरत के समय अक्सर कमी' },
];

/** Month windows are the definition of each season, not a suggestion. */
export const SEASONS: VocabEntry<Season>[] = [
  { id: 'Kharif', en: 'Kharif', hi: 'खरीफ', enSub: 'June – October, monsoon sown', hiSub: 'जून – अक्टूबर, मानसून में बोई' },
  { id: 'Rabi', en: 'Rabi', hi: 'रबी', enSub: 'November – March, winter sown', hiSub: 'नवंबर – मार्च, सर्दी में बोई' },
  { id: 'Zaid', en: 'Zaid', hi: 'ज़ायद', enSub: 'March – June, summer sown', hiSub: 'मार्च – जून, गर्मी में बोई' },
];

export const RISK: VocabEntry<RiskTolerance>[] = [
  { id: 'Conservative', en: 'Careful', hi: 'सतर्क', enSub: 'Protect the money first', hiSub: 'पहले पूँजी की सुरक्षा' },
  { id: 'Balanced', en: 'Balanced', hi: 'संतुलित', enSub: 'Weigh return against risk', hiSub: 'लाभ और जोखिम का संतुलन' },
  { id: 'Aggressive', en: 'Bold', hi: 'साहसिक', enSub: 'Accept swings for upside', hiSub: 'अधिक लाभ के लिए उतार-चढ़ाव स्वीकार' },
];

/**
 * Crops the app has always listed against each sowing window — the same hints
 * the setup screen showed as season sub-labels, now named individually so they
 * can be drawn with the shared crop morphology.
 *
 * These describe WHEN a crop is sown. They are not a recommendation: what the
 * farmer should actually plant comes from the optimiser's allocated_crops.
 */
export const SEASON_CROPS: Record<Season, string[]> = {
  Kharif: ['Rice', 'Maize', 'Cotton', 'Soybean'],
  Rabi: ['Wheat', 'Mustard', 'Gram', 'Potato'],
  Zaid: ['Tomato', 'Onion', 'Moong', 'Groundnut'],
};

function find<T extends string>(list: VocabEntry<T>[], id: T | null | undefined): VocabEntry<T> | null {
  if (!id) return null;
  return list.find((e) => e.id === id) ?? null;
}

export const irrigationEntry = (id: IrrigationType | null | undefined) => find(IRRIGATION, id);
export const reliabilityEntry = (id: Reliability | null | undefined) => find(RELIABILITY, id);
export const seasonEntry = (id: Season | null | undefined) => find(SEASONS, id);
export const riskEntry = (id: RiskTolerance | null | undefined) => find(RISK, id);

/** Falls back to the raw backend string so an unmapped value still reads truthfully. */
export function label<T extends string>(entry: VocabEntry<T> | null, raw: string | null | undefined, isHi: boolean): string {
  if (entry) return isHi ? entry.hi : entry.en;
  return raw ?? '—';
}

/* -------------------------------------------------------------------------- */
/* NUMBER FORMATTING — Indian units, because the farmer thinks in them.        */
/* -------------------------------------------------------------------------- */

/** ₹1,20,000 → "₹1.2L" / "₹1.2 लाख". Below a lakh, grouped in the Indian system. */
export function formatInrCompact(value: number, isHi = false): string {
  if (!Number.isFinite(value)) return '—';
  if (value >= 10000000) {
    const cr = value / 10000000;
    return isHi ? `₹${cr.toFixed(cr >= 10 ? 0 : 1)} करोड़` : `₹${cr.toFixed(cr >= 10 ? 0 : 1)}Cr`;
  }
  if (value >= 100000) {
    const l = value / 100000;
    return isHi ? `₹${l.toFixed(l >= 10 ? 0 : 1)} लाख` : `₹${l.toFixed(l >= 10 ? 0 : 1)}L`;
  }
  return `₹${Math.round(value).toLocaleString('en-IN')}`;
}

/** Trims the trailing ".0" so "5 acres" doesn't read as "5.0 acres". */
export function formatAcres(value: number, isHi = false): string {
  if (!Number.isFinite(value)) return '—';
  const n = Math.round(value * 10) / 10;
  const text = Number.isInteger(n) ? String(n) : n.toFixed(1);
  return isHi ? `${text} एकड़` : `${text} ${n === 1 ? 'acre' : 'acres'}`;
}
