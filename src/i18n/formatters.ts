/**
 * src/i18n/formatters.ts
 * Centralized formatting utilities for AgriOptima AI.
 * Ensures consistent numbers, currencies, units, and dates across all supported languages.
 */

export function formatCurrency(amount: number | null | undefined, _lang: string = 'en'): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }
  const rounded = Math.round(amount);
  return '₹' + rounded.toLocaleString('en-IN');
}

export function formatNumber(val: number | null | undefined, decimals: number = 2): string {
  if (val === null || val === undefined || isNaN(val)) {
    return '0';
  }
  return Number(val.toFixed(decimals)).toLocaleString('en-IN');
}

export function formatArea(acres: number | null | undefined, lang: string = 'en'): string {
  if (acres === null || acres === undefined || isNaN(acres)) {
    return lang === 'hi' ? '0 एकड़' : '0 Acres';
  }
  const valStr = acres.toFixed(1);
  return lang === 'hi' ? `${valStr} एकड़` : `${valStr} Acres`;
}

export function formatTemperature(tempC: number | null | undefined, _lang: string = 'en'): string {
  if (tempC === null || tempC === undefined || isNaN(tempC)) {
    return '--°C';
  }
  return `${tempC.toFixed(1)}°C`;
}

export function formatRainfall(mm: number | null | undefined, lang: string = 'en'): string {
  if (mm === null || mm === undefined || isNaN(mm)) {
    return lang === 'hi' ? '0.0 मिमी' : '0.0 mm';
  }
  const valStr = mm.toFixed(1);
  return lang === 'hi' ? `${valStr} मिमी` : `${valStr} mm`;
}

export function formatPercentage(pct: number | null | undefined, _lang: string = 'en'): string {
  if (pct === null || pct === undefined || isNaN(pct)) {
    return '0.0%';
  }
  return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
}

export function formatSoilMoisture(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) {
    return '0.000 m³/m³';
  }
  return `${val.toFixed(3)} m³/m³`;
}

export function formatVpd(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) {
    return '0.00 kPa';
  }
  return `${val.toFixed(2)} kPa`;
}

export function formatWind(kmh: number | null | undefined, lang: string = 'en'): string {
  if (kmh === null || kmh === undefined || isNaN(kmh)) {
    return lang === 'hi' ? '0.0 किमी/घंटा' : '0.0 km/h';
  }
  const valStr = kmh.toFixed(1);
  return lang === 'hi' ? `${valStr} किमी/घंटा` : `${valStr} km/h`;
}

export function formatYield(qtl: number | null | undefined, lang: string = 'en'): string {
  if (qtl === null || qtl === undefined || isNaN(qtl)) {
    return lang === 'hi' ? '0.0 क्विंटल/एकड़' : '0.0 Qtl/Ac';
  }
  const valStr = qtl.toFixed(1);
  return lang === 'hi' ? `${valStr} क्विंटल/एकड़` : `${valStr} Qtl/Ac`;
}

export function formatRatePerAcre(amount: number | null | undefined, lang: string = 'en'): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return lang === 'hi' ? '₹0/एकड़' : '₹0/Ac';
  }
  const formatted = Math.round(amount).toLocaleString('en-IN');
  return lang === 'hi' ? `₹${formatted}/एकड़` : `₹${formatted}/Ac`;
}

export function formatDays(days: number | null | undefined, lang: string = 'en'): string {
  if (days === null || days === undefined || isNaN(days)) {
    return lang === 'hi' ? '0 दिन' : '0 days';
  }
  return lang === 'hi' ? `${days} दिन` : `${days} days`;
}
