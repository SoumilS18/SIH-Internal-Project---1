/**
 * Shared crop visual language — emoji + field colours used by the digital twin
 * and the plan reveal so a crop always looks the same across the product.
 * Colours are tuned to the AgriOptima palette (cropland greens, wheat golds,
 * soil ochres) rather than literal photographic colours.
 */

export interface CropVisual {
  emoji: string;
  /** top-surface colours (light / dark worlds) */
  topLight: string;
  topDark: string;
  /** extruded soil-side colours */
  sideLight: string;
  sideDark: string;
}

const CROP_TABLE: Record<string, CropVisual> = {
  rice: { emoji: '🌾', topLight: '#7FB88E', topDark: '#2E8F63', sideLight: '#5E8F62', sideDark: '#1c5c40' },
  paddy: { emoji: '🌾', topLight: '#7FB88E', topDark: '#2E8F63', sideLight: '#5E8F62', sideDark: '#1c5c40' },
  wheat: { emoji: '🌾', topLight: '#E4C05A', topDark: '#D9A82E', sideLight: '#B48F32', sideDark: '#8a6a17' },
  maize: { emoji: '🌽', topLight: '#EBC24C', topDark: '#E4B12E', sideLight: '#B58C2B', sideDark: '#8f6f1c' },
  corn: { emoji: '🌽', topLight: '#EBC24C', topDark: '#E4B12E', sideLight: '#B58C2B', sideDark: '#8f6f1c' },
  cotton: { emoji: '🌱', topLight: '#DCE3CE', topDark: '#8FB89A', sideLight: '#A9B593', sideDark: '#4d6b54' },
  sugarcane: { emoji: '🎋', topLight: '#5FA36C', topDark: '#2FA05C', sideLight: '#437a4c', sideDark: '#1c6b3e' },
  soybean: { emoji: '🫘', topLight: '#93B96F', topDark: '#5FA85C', sideLight: '#6b8a4e', sideDark: '#3c6b3a' },
  groundnut: { emoji: '🥜', topLight: '#CBA75E', topDark: '#C79A4A', sideLight: '#9c7e3f', sideDark: '#7a5f2a' },
  mustard: { emoji: '🌼', topLight: '#F0CE3E', topDark: '#F0C24B', sideLight: '#c19e2a', sideDark: '#977b1e' },
  gram: { emoji: '🫛', topLight: '#A9C57E', topDark: '#7FB86A', sideLight: '#7d9457', sideDark: '#4f7a44' },
  chickpea: { emoji: '🫛', topLight: '#A9C57E', topDark: '#7FB86A', sideLight: '#7d9457', sideDark: '#4f7a44' },
  bajra: { emoji: '🌾', topLight: '#C9AE6A', topDark: '#BFA050', sideLight: '#9a854a', sideDark: '#786633' },
  jowar: { emoji: '🌾', topLight: '#CBB878', topDark: '#C2A94F', sideLight: '#9a8a4e', sideDark: '#786a33' },
  tur: { emoji: '🫛', topLight: '#9BBE72', topDark: '#6FAF5E', sideLight: '#728c50', sideDark: '#456f3c' },
  arhar: { emoji: '🫛', topLight: '#9BBE72', topDark: '#6FAF5E', sideLight: '#728c50', sideDark: '#456f3c' },
  moong: { emoji: '🫛', topLight: '#A6C77C', topDark: '#78B562', sideLight: '#7a9556', sideDark: '#4a7340' },
  potato: { emoji: '🥔', topLight: '#C79A6B', topDark: '#B9834E', sideLight: '#977049', sideDark: '#6f5433' },
  tomato: { emoji: '🍅', topLight: '#D9694E', topDark: '#D9684A', sideLight: '#a44e39', sideDark: '#7d3a2a' },
  onion: { emoji: '🧅', topLight: '#C88CA0', topDark: '#B96F86', sideLight: '#96687a', sideDark: '#6f4c5a' },
  chilli: { emoji: '🌶️', topLight: '#CE5442', topDark: '#CE4E3A', sideLight: '#9c3f31', sideDark: '#762f24' },
  turmeric: { emoji: '🟡', topLight: '#E0A32E', topDark: '#E0A32E', sideLight: '#b17f22', sideDark: '#8a6117' },
  banana: { emoji: '🍌', topLight: '#5FA36C', topDark: '#3FA05C', sideLight: '#457a4c', sideDark: '#26663d' },
  barley: { emoji: '🌾', topLight: '#D8C579', topDark: '#CDB456', sideLight: '#a68f45', sideDark: '#7f6d30' },
  sunflower: { emoji: '🌻', topLight: '#EEC23A', topDark: '#EEBE2E', sideLight: '#bd9526', sideDark: '#94741b' },
  sesame: { emoji: '🌱', topLight: '#C7B78A', topDark: '#B7A46A', sideLight: '#9a8a63', sideDark: '#756848' },
  lentil: { emoji: '🫘', topLight: '#B79A6A', topDark: '#A9874E', sideLight: '#8a6f45', sideDark: '#69542f' },
  masoor: { emoji: '🫘', topLight: '#B79A6A', topDark: '#A9874E', sideLight: '#8a6f45', sideDark: '#69542f' },
  pea: { emoji: '🟢', topLight: '#8FC07A', topDark: '#66B85E', sideLight: '#6b9057', sideDark: '#427340' },
};

const FALLBACK_PALETTE: CropVisual[] = [
  { emoji: '🌱', topLight: '#7FB88E', topDark: '#2E9E5B', sideLight: '#5E8F62', sideDark: '#1c5c40' },
  { emoji: '🌾', topLight: '#E4C05A', topDark: '#D9A82E', sideLight: '#B48F32', sideDark: '#8a6a17' },
  { emoji: '🌿', topLight: '#9BBE72', topDark: '#6FAF5E', sideLight: '#728c50', sideDark: '#456f3c' },
  { emoji: '🍃', topLight: '#8FC07A', topDark: '#4FAE72', sideLight: '#6b9057', sideDark: '#2f7350' },
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Longest-first so "sugarcane" never matches a shorter key by accident. */
const CROP_KEYS = Object.keys(CROP_TABLE).sort((a, b) => b.length - a.length);

function matchKey(name: string): string | null {
  const key = (name || '').toLowerCase().trim();
  for (const k of CROP_KEYS) {
    if (key.includes(k)) return k;
  }
  return null;
}

export function cropVisual(name: string): CropVisual {
  const k = matchKey(name);
  if (k) return CROP_TABLE[k];
  return FALLBACK_PALETTE[hashString((name || '').toLowerCase().trim()) % FALLBACK_PALETTE.length];
}

export function cropEmoji(name: string): string {
  return cropVisual(name).emoji;
}

/* ==========================================================================
   HOW A CROP STANDS IN A FIELD
   The digital twin plants the crops the optimiser actually allocated, so each
   one has to read as itself from across the room: cane towers, cereals carry
   an ear, pulses and vegetables sit low and bushy, tubers show leaf only.
   This is plant morphology — a visual property of a known crop — not an
   agronomic recommendation.
   ========================================================================== */

export type CropForm = 'cereal' | 'cane' | 'bush' | 'tuber' | 'fibre' | 'tree';

export interface CropStand {
  form: CropForm;
  /** stand height relative to the tallest crop in the table (0.34 .. 1) */
  height: number;
  /** ear / fruit / boll / plume colour */
  head: string;
  /** how thickly this crop is planted, relative (0.7 .. 1.3) */
  spacing: number;
}

const STAND_TABLE: Record<string, CropStand> = {
  rice:      { form: 'cereal', height: 0.52, head: '#CFC486', spacing: 1.25 },
  paddy:     { form: 'cereal', height: 0.52, head: '#CFC486', spacing: 1.25 },
  wheat:     { form: 'cereal', height: 0.58, head: '#E8CC77', spacing: 1.2 },
  barley:    { form: 'cereal', height: 0.6,  head: '#E2D28C', spacing: 1.2 },
  bajra:     { form: 'cereal', height: 0.74, head: '#CDB878', spacing: 0.95 },
  jowar:     { form: 'cereal', height: 0.8,  head: '#D2BC7E', spacing: 0.9 },
  maize:     { form: 'cereal', height: 0.86, head: '#EFC24A', spacing: 0.85 },
  corn:      { form: 'cereal', height: 0.86, head: '#EFC24A', spacing: 0.85 },
  sugarcane: { form: 'cane',   height: 1,    head: '#C4D6AC', spacing: 1.05 },
  banana:    { form: 'tree',   height: 0.94, head: '#E0BE4B', spacing: 0.6 },
  cotton:    { form: 'fibre',  height: 0.55, head: '#FBF8EE', spacing: 0.9 },
  tomato:    { form: 'bush',   height: 0.5,  head: '#C9503A', spacing: 0.85 },
  chilli:    { form: 'bush',   height: 0.46, head: '#C24733', spacing: 0.9 },
  soybean:   { form: 'bush',   height: 0.42, head: '#B9C98C', spacing: 1.15 },
  groundnut: { form: 'bush',   height: 0.38, head: '#D9C48E', spacing: 1.15 },
  gram:      { form: 'bush',   height: 0.4,  head: '#C3D39A', spacing: 1.15 },
  chickpea:  { form: 'bush',   height: 0.4,  head: '#C3D39A', spacing: 1.15 },
  tur:       { form: 'bush',   height: 0.62, head: '#C8D69C', spacing: 0.9 },
  arhar:     { form: 'bush',   height: 0.62, head: '#C8D69C', spacing: 0.9 },
  moong:     { form: 'bush',   height: 0.38, head: '#BCD094', spacing: 1.2 },
  lentil:    { form: 'bush',   height: 0.36, head: '#CBB489', spacing: 1.25 },
  masoor:    { form: 'bush',   height: 0.36, head: '#CBB489', spacing: 1.25 },
  pea:       { form: 'bush',   height: 0.44, head: '#A9D48C', spacing: 1.15 },
  sesame:    { form: 'bush',   height: 0.5,  head: '#DCCFA4', spacing: 1.05 },
  mustard:   { form: 'bush',   height: 0.56, head: '#F2D24A', spacing: 1.1 },
  sunflower: { form: 'bush',   height: 0.78, head: '#F0C63C', spacing: 0.7 },
  turmeric:  { form: 'tuber',  height: 0.44, head: '#E3AE3A', spacing: 1.1 },
  potato:    { form: 'tuber',  height: 0.36, head: '#BFD3A0', spacing: 1.2 },
  onion:     { form: 'tuber',  height: 0.34, head: '#C9A0B0', spacing: 1.3 },
};

const STAND_FALLBACK: CropStand = { form: 'bush', height: 0.48, head: '#C8D69C', spacing: 1 };

export function cropStand(name: string): CropStand {
  const k = matchKey(name);
  return (k && STAND_TABLE[k]) || STAND_FALLBACK;
}
