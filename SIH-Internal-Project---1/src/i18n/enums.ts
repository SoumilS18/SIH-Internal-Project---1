/**
 * src/i18n/enums.ts
 * Enum and Status Code Localization Mapping.
 * Translates semantic backend codes into natural localized labels.
 */

export function translateRiskLevel(label: string | null | undefined, lang: string = 'en'): string {
  if (!label) return '';
  if (lang !== 'hi') return label.toUpperCase();

  switch (label.toUpperCase()) {
    case 'LOW':
      return 'निम्न';
    case 'MODERATE':
      return 'मध्यम';
    case 'HIGH':
      return 'उच्च';
    case 'CRITICAL':
      return 'गंभीर';
    default:
      return label;
  }
}

export function translateConfidence(conf: string | null | undefined, lang: string = 'en'): string {
  if (!conf) return '';
  if (lang !== 'hi') return conf;

  switch (conf.toLowerCase()) {
    case 'high':
      return 'उच्च';
    case 'medium':
      return 'मध्यम';
    case 'low':
      return 'निम्न';
    default:
      return conf;
  }
}

export function translateMoistureStatus(status: string | null | undefined, lang: string = 'en'): string {
  if (!status) return '';
  if (lang !== 'hi') return status;

  const s = status.toLowerCase();
  if (s.includes('optimal')) {
    return 'इष्टतम नमी';
  } else if (s.includes('severe') && s.includes('deficit')) {
    return 'गंभीर नमी की कमी';
  } else if (s.includes('deficit')) {
    return 'नमी की कमी';
  } else if (s.includes('saturated') || s.includes('excess')) {
    return 'अत्यधिक संतृप्त (गीली)';
  } else if (s.includes('waterlog')) {
    return 'जलभराव स्थिति';
  }
  return status;
}

export function translateIrrigationType(type: string | null | undefined, lang: string = 'en'): string {
  if (!type) return '';
  if (lang !== 'hi') return type;

  switch (type.toLowerCase()) {
    case 'borewell':
      return 'बोरवेल / नलकूप';
    case 'canal':
      return 'नहर सिंचाई';
    case 'drip':
      return 'ड्रिप (टपक) सिंचाई';
    case 'sprinkler':
      return 'स्प्रिंकलर (फव्वारा)';
    case 'rainfed':
      return 'वर्षा आधारित (असिंचित)';
    default:
      return type;
  }
}

export function translateIrrigationReliability(rel: string | null | undefined, lang: string = 'en'): string {
  if (!rel) return '';
  if (lang !== 'hi') return rel;

  switch (rel.toLowerCase()) {
    case 'high':
      return 'उच्च (विश्वसनीय)';
    case 'medium':
    case 'moderate':
      return 'मध्यम';
    case 'low':
      return 'कम (अनियमित)';
    default:
      return rel;
  }
}

export function translateSeason(season: string | null | undefined, lang: string = 'en'): string {
  if (!season) return '';
  if (lang !== 'hi') return season;

  switch (season.toLowerCase()) {
    case 'kharif':
      return 'खरीफ';
    case 'rabi':
      return 'रबी';
    case 'zaid':
      return 'जायद';
    default:
      return season;
  }
}

export function translateRiskTolerance(tol: string | null | undefined, lang: string = 'en'): string {
  if (!tol) return '';
  if (lang !== 'hi') return tol;

  switch (tol.toLowerCase()) {
    case 'conservative':
      return 'रूढ़िवादी (सुरक्षित)';
    case 'balanced':
      return 'संतुलित';
    case 'aggressive':
      return 'आक्रामक (अधिकतम लाभ)';
    default:
      return tol;
  }
}

export function translateScenarioName(scenarioId: string, defaultName: string, lang: string = 'en'): string {
  if (lang !== 'hi') return defaultName;

  switch (scenarioId) {
    case 'live':
    case 'live_conditions':
      return 'वर्तमान मौसम (लाइव)';
    case 'drought':
    case 'severe_drought':
      return 'गंभीर सूखा स्थिति (+35% वर्षा घाटा)';
    case 'waterlogging':
    case 'heavy_rainfall':
      return 'अत्यधिक वर्षा एवं जलभराव (+80 मिमी)';
    case 'heat_wave':
    case 'heat':
      return 'गंभीर लू / ताप लहर (+4.5°C)';
    default:
      return defaultName;
  }
}
