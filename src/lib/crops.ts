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

export function cropVisual(name: string): CropVisual {
  const key = (name || '').toLowerCase().trim();
  for (const k of Object.keys(CROP_TABLE)) {
    if (key.includes(k)) return CROP_TABLE[k];
  }
  return FALLBACK_PALETTE[hashString(key) % FALLBACK_PALETTE.length];
}

export function cropEmoji(name: string): string {
  return cropVisual(name).emoji;
}
