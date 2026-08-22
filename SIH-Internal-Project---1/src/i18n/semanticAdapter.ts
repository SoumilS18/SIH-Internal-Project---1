/**
 * src/i18n/semanticAdapter.ts
 * Semantic Presentation Translation Adapter for AgriOptima AI.
 * Transforms raw structured backend response models into fully localized, natural-language
 * explanations without modifying the backend or hardcoding static demo strings.
 */

import type { FarmDecisionResponse, ScenarioItem } from '@/types/farm';
import { formatCurrency, formatArea, formatTemperature, formatRainfall, formatPercentage, formatSoilMoisture, formatVpd } from './formatters';
import { getCropDisplayName } from './cropNames';
import { getStateDisplayName, getDistrictDisplayName } from './geoNames';
import { translateIrrigationType, translateRiskLevel } from './enums';

/**
 * 1. Strategic Headline Narrative Generator
 */
export function getStrategicHeadline(decision: FarmDecisionResponse, lang: string = 'en'): string {
  const { farm_totals, location, allocated_crops } = decision;
  const state = getStateDisplayName(location.state_name, lang);
  const district = getDistrictDisplayName(location.district_name, lang);
  const acres = formatArea(farm_totals.total_land_acres, lang);
  const profit = formatCurrency(farm_totals.total_expected_net_profit_inr, lang);
  const roi = farm_totals.expected_farm_roi_pct.toFixed(1);

  if (allocated_crops.length === 0) {
    if (farm_totals.all_negative_profits) {
      return lang === 'hi'
        ? `${state} के ${district} में ${acres} के लिए: वर्तमान प्रतिकूल पर्यावरणीय परिस्थितियों और उच्च लागत के कारण सभी फसलों पर नुकसान का अनुमान है। पूंजी सुरक्षा के लिए भूमि परती रखने की सलाह दी जाती है।`
        : `Strategic Plan for ${acres} in ${district}, ${state}: High environmental risk and production costs project negative margins across all candidate crops. Fallow preservation recommended.`;
    }
    return lang === 'hi'
      ? `${state} के ${district} में ${acres} के लिए: चयनित परिस्थितियों के लिए कोई उपयुक्त फसल नहीं मिली।`
      : `Strategic Plan for ${acres} in ${district}, ${state}: No suitable crop allocation found under current constraints.`;
  }

  // Build allocation summary string
  const allocParts = allocated_crops.map((c) => {
    const cropName = getCropDisplayName(c.crop_name, lang);
    const cropAcres = formatArea(c.allocated_acres, lang);
    const share = c.acre_share_pct.toFixed(0);
    return lang === 'hi'
      ? `${cropAcres} ${cropName} (${share}%)`
      : `${cropAcres} ${cropName} (${share}%)`;
  });

  const allocText = allocParts.join(lang === 'hi' ? ', ' : ', ');

  if (lang === 'hi') {
    return `${state} के ${district} में ${acres} के लिए रणनीतिक योजना: ${allocText} आवंटित करें। अनुमानित शुद्ध लाभ ${profit} है (ROI: +${roi}%)।`;
  }

  return `Strategic Plan for ${acres} in ${district}, ${state}: Allocate ${allocText} for a projected Net Profit of ${profit} (ROI: +${roi}%).`;
}

/**
 * 2. Environmental Summary Narrative Generator
 */
export function getEnvironmentalSummary(decision: FarmDecisionResponse, lang: string = 'en'): string {
  const { weather } = decision;
  const temp = formatTemperature(weather.current_temperature_c, lang);
  const rh = weather.current_humidity_pct ?? 70;
  const vpd = formatVpd(weather.vapour_pressure_deficit_kpa);
  const rootZone = formatSoilMoisture(weather.root_zone_soil_moisture_m3m3);
  const rain7d = formatRainfall(weather.forecast_rain_7d_total_mm, lang);
  const peakProb = weather.max_rain_probability_7d_pct ?? 0;

  if (lang === 'hi') {
    return `लाइव टेलीमेट्री ${temp} तापमान, ${rh}% सापेक्ष आर्द्रता, ${vpd} वाष्प दबाव घाटा (VPD), और ${rootZone} जड़-क्षेत्र मृदा नमी दर्शाती है। 7-दिवसीय पूर्वानुमान कुल ${rain7d} वर्षा और ${peakProb}% अधिकतम वर्षा संभावना का संकेत देता है।`;
  }

  return `Live telemetry reflects ${temp} temperature, ${rh}% relative humidity, VPD of ${vpd}, and root-zone soil moisture of ${rootZone}. 7-day outlook indicates ${rain7d} total rainfall with ${peakProb}% peak precipitation probability.`;
}

/**
 * 3. Irrigation Impact Narrative Generator
 */
export function getIrrigationImpact(decision: FarmDecisionResponse, lang: string = 'en'): string {
  const { request, risk } = decision;
  const irrigation = translateIrrigationType(request.irrigation_type, lang);
  const buffer = Math.round(risk.irrigation_buffer_pct);

  if (request.irrigation_type.toLowerCase() === 'rainfed') {
    if (lang === 'hi') {
      return `वर्षा-आधारित (असिंचित) प्रणाली पूर्ण रूप से प्राकृतिक वर्षा पर निर्भर है, जिससे सूखे और वर्षा की कमी का जोखिम 100% बना रहता है।`;
    }
    return `Rainfed farm configuration relies entirely on natural precipitation, exposing crops to unbuffered drought variability.`;
  }

  if (lang === 'hi') {
    return `${irrigation} प्रणाली पर्यावरणीय नमी के उतार-चढ़ाव के खिलाफ एक विश्वसनीय सुरक्षा बफर प्रदान करती है, जिससे सूखे के प्रभाव में ${buffer}% तक की कमी आती है।`;
  }

  return `${irrigation} irrigation system buffers crops against environmental moisture volatility, mitigating drought risk by ${buffer}%.`;
}

/**
 * 4. 8-Step Causal Chain Dynamic Detail Generator
 */
export function getCausalStepTitle(stepNumber: number, lang: string = 'en'): string {
  const titles_en = [
    '1. Historical Ground Truth',
    '2. Real-Time Telemetry Observation',
    '3. 7-Day Forecast Trajectory',
    '4. Dynamic Risk Surface Translation',
    '5. Crop-Specific Yield Penalties',
    '6. Economic Margin Recalculation',
    '7. Linear Programming Optimization',
    '8. Actionable Farmer Directive',
  ];

  const titles_hi = [
    '1. ऐतिहासिक आधारभूत सत्य',
    '2. वास्तविक समय टेलीमेट्री अवलोकन',
    '3. 7-दिवसीय मौसम पूर्वानुमान',
    '4. गतिशील जोखिम सतह रूपांतरण',
    '5. फसल-विशिष्ट पैदावार समायोजन',
    '6. आर्थिक मार्जिन का पुनःपरिकलन',
    '7. लीनियर प्रोग्रामिंग अनुकूलन',
    '8. किसान के लिए अंतिम कार्यकारी निर्देश',
  ];

  const idx = Math.max(0, Math.min(7, stepNumber - 1));
  return lang === 'hi' ? titles_hi[idx] : titles_en[idx];
}

export function getCausalStepDetail(stepNumber: number, decision: FarmDecisionResponse, lang: string = 'en'): string {
  const { location, weather, risk, farm_totals, allocated_crops, request } = decision;
  const state = getStateDisplayName(location.state_name, lang);
  const district = getDistrictDisplayName(location.district_name, lang);

  switch (stepNumber) {
    case 1:
      return lang === 'hi'
        ? `${district}, ${state} के लिए ऐतिहासिक कृषि सांख्यिकी, सामान्य वर्षा और ${location.major_soil_type || 'काली/दोमट'} मृदा विशेषताओं को आधारभूत सत्य के रूप में लोड किया गया।`
        : `Loaded historical yield baselines, agro-climatic normals, and ${location.major_soil_type || 'Vertisol/Loam'} soil characteristics for ${district}, ${state}.`;

    case 2:
      return lang === 'hi'
        ? `Open-Meteo व ERA5-Land से वर्तमान तापमान (${formatTemperature(weather.current_temperature_c, lang)}), आर्द्रता (${weather.current_humidity_pct ?? 70}%), VPD (${formatVpd(weather.vapour_pressure_deficit_kpa)}) और सतही मृदा नमी (${formatSoilMoisture(weather.surface_soil_moisture_m3m3)}) का लाइव अवलोकन दर्ज किया गया।`
        : `Ingested live meteorological observations: temperature (${formatTemperature(weather.current_temperature_c, lang)}), humidity (${weather.current_humidity_pct ?? 70}%), VPD (${formatVpd(weather.vapour_pressure_deficit_kpa)}), and surface soil moisture (${formatSoilMoisture(weather.surface_soil_moisture_m3m3)}).`;

    case 3:
      return lang === 'hi'
        ? `7-दिवसीय ECMWF संख्यात्मक पूर्वानुमान द्वारा ${formatRainfall(weather.forecast_rain_7d_total_mm, lang)} कुल वर्षा और ${weather.max_rain_probability_7d_pct ?? 0}% अधिकतम वर्षा संभावना का प्रक्षेपवक्र विश्लेषित किया गया।`
        : `Evaluated 7-day ECMWF forecast trajectory showing ${formatRainfall(weather.forecast_rain_7d_total_mm, lang)} cumulative precipitation with ${weather.max_rain_probability_7d_pct ?? 0}% peak rainfall probability.`;

    case 4:
      return lang === 'hi'
        ? `पर्यावरणीय टेलीमेट्री को 4 जोखिम संकेतकों में बदला गया: सूखा (${risk.drought_risk_score.toFixed(2)}), जलभराव (${risk.waterlogging_risk_score.toFixed(2)}), लू/ताप (${risk.heat_risk_score.toFixed(2)}), और वायुमंडलीय जल तनाव (${risk.atmospheric_water_stress_score.toFixed(2)})।`
        : `Translated environmental signals into calibrated stress scores: drought (${risk.drought_risk_score.toFixed(2)}), waterlogging (${risk.waterlogging_risk_score.toFixed(2)}), heat (${risk.heat_risk_score.toFixed(2)}), and atmospheric water stress (${risk.atmospheric_water_stress_score.toFixed(2)}).`;

    case 5:
      return lang === 'hi'
        ? `फसलों की शारीरिक संवेदनशीलता और ${translateIrrigationType(request.irrigation_type, lang)} के शमन बफर के आधार पर उम्मीदवार फसलों की अपेक्षित पैदावार में सटीक जोखिम कटौती की गई।`
        : `Applied physiological stress response curves and ${request.irrigation_type} mitigation buffering to calculate adjusted expected yields for all candidate crops.`;

    case 6:
      return lang === 'hi'
        ? `APMC मंडी जींस भाव और CACP उत्पादन लागत (C2) का उपयोग करके प्रत्येक फसल के लिए प्रति एकड़ शुद्ध लाभ मार्जिन और निवेश प्रतिफल (ROI) की पुनर्गणना की गई।`
        : `Recalculated per-acre production costs (C2), expected gross revenues, and net margins using real-time APMC Mandi commodity modal pricing.`;

    case 7:
      return lang === 'hi'
        ? `HiGHS लीनियर प्रोग्रामिंग इंजन द्वारा ${formatArea(farm_totals.total_land_acres, lang)} रकबा और ${formatCurrency(farm_totals.budget_capital_inr, lang)} बजट सीमाओं के तहत कुल शुद्ध लाभ को अधिकतम करने वाला इष्टतम आवंटन हल किया गया।`
        : `Executed HiGHS Simplex LP solver to maximize total farm net profit subject to ${formatArea(farm_totals.total_land_acres, lang)} land area, ${formatCurrency(farm_totals.budget_capital_inr, lang)} capital budget, and agronomic rotation limits.`;

    case 8:
      if (allocated_crops.length > 0) {
        const topCrop = getCropDisplayName(allocated_crops[0].crop_name, lang);
        const topAcres = formatArea(allocated_crops[0].allocated_acres, lang);
        return lang === 'hi'
          ? `अंतिम सिफारिश: ${topAcres} पर ${topCrop} की बुवाई करें, जिससे कुल ${formatCurrency(farm_totals.total_expected_net_profit_inr, lang)} शुद्ध लाभ और +${farm_totals.expected_farm_roi_pct.toFixed(1)}% ROI प्राप्त होगा।`
          : `Final directive: Cultivate ${topAcres} of ${topCrop} as primary crop, delivering ${formatCurrency(farm_totals.total_expected_net_profit_inr, lang)} projected net profit (+${farm_totals.expected_farm_roi_pct.toFixed(1)}% ROI).`;
      }
      return lang === 'hi'
        ? `अंतिम सिफारिश: वर्तमान मौसम में पूंजी सुरक्षा बनाए रखें।`
        : `Final directive: Preserve working capital under current environmental constraints.`;

    default:
      return '';
  }
}

/**
 * 5. Scenario Adaptation & Comparison Localizer
 */
export function getScenarioDescription(scenarioId: string, item: ScenarioItem, lang: string = 'en'): string {
  if (lang !== 'hi') {
    return item.description || 'Simulated environmental state evaluation.';
  }

  switch (scenarioId) {
    case 'live':
    case 'live_conditions':
      return 'वर्तमान वास्तविक समय मौसम टेलीमेट्री और लाइव मिट्टी की स्थिति पर आधारित आधारभूत योजना।';
    case 'drought':
    case 'severe_drought':
      return '35% वर्षा की कमी और अत्यधिक मिट्टी नमी घाटे के तहत खेत का तनाव परीक्षण।';
    case 'waterlogging':
    case 'heavy_rainfall':
      return '80 मिमी अतिरिक्त मानसून वर्षा और अत्यधिक संतृप्त मिट्टी की स्थिति में जलभराव तनाव परीक्षण।';
    case 'heat_wave':
    case 'heat':
      return 'अधिकतम तापमान में +4.5°C की वृद्धि और उच्च वाष्पीकरण तनाव के तहत लू का प्रभाव विश्लेषण।';
    default:
      return item.description || 'पर्यावरणीय तनाव परिदृश्य का मूल्यांकन।';
  }
}

export function getScenarioAdaptationShift(scenarioId: string, item: ScenarioItem, lang: string = 'en'): string {
  if (lang !== 'hi') {
    return item.key_allocation_shift || 'Allocation adjusted for environmental conditions.';
  }

  switch (scenarioId) {
    case 'live':
    case 'live_conditions':
      return 'वर्तमान मौसम के अनुसार अधिकतम लाभप्रदता के लिए संतुलित आवंटन।';
    case 'drought':
    case 'severe_drought':
      return 'सूखा-संवेदनशील फसलों का रकबा घटाकर गहरी जड़ों वाली व कम पानी चाहने वाली फसलों में स्थानांतरण।';
    case 'waterlogging':
    case 'heavy_rainfall':
      return 'जलभराव-संवेदनशील फसलों को हटाकर अच्छी जल निकासी वाली या सहनशील फसलों का चयन।';
    case 'heat_wave':
    case 'heat':
      return 'दोपहर के उच्च तापमान से अप्रभावित रहने वाली फसलों को प्राथमिकता।';
    default:
      return item.key_allocation_shift || 'पर्यावरणीय परिस्थितियों के अनुकूल फसल आवंटन में समायोजन।';
  }
}

/**
 * 6. Crop Agronomic Reason Tag Localizer
 */
export function getCropReasonTag(reason: string, lang: string = 'en'): string {
  if (!reason) return '';
  if (lang !== 'hi') return reason;

  const r = reason.toLowerCase();
  if (r.includes('high market') || r.includes('profitable') || r.includes('high profit')) {
    return 'उच्च मंडी लाभप्रदता';
  } else if (r.includes('drought resilience') || r.includes('drought tolerance') || r.includes('drought buffer')) {
    return 'सूखा सहनशीलता बफर';
  } else if (r.includes('waterlogging tolerance') || r.includes('excess moisture')) {
    return 'जलभराव सहनशीलता';
  } else if (r.includes('heat tolerance') || r.includes('heat stress resilience')) {
    return 'ताप सहनशीलता';
  } else if (r.includes('low capital') || r.includes('budget')) {
    return 'कम लागत आवश्यकता';
  } else if (r.includes('high yield') || r.includes('high productivity')) {
    return 'उच्च पैदावार क्षमता';
  } else if (r.includes('negative profit') || r.includes('unviable') || r.includes('loss')) {
    return 'नकारात्मक मार्जिन (अलाभकारी)';
  } else if (r.includes('severe risk') || r.includes('high risk')) {
    return 'उच्च पर्यावरणीय जोखिम';
  } else if (r.includes('fallow buffer')) {
    return 'परती पूंजी संरक्षण';
  }
  return reason;
}

/**
 * 7. System Alert Localizer
 */
export function getLocalizedBudgetAlert(fallowAcres: number, budgetInr: number, allocatedAcres: number, lang: string = 'en'): string {
  const fallowStr = formatArea(fallowAcres, lang);
  const allocStr = formatArea(allocatedAcres, lang);
  const budgetStr = formatCurrency(budgetInr, lang);

  if (lang === 'hi') {
    return `पूंजी बजट सूचना: उपलब्ध कार्यशील पूंजी (${budgetStr}) सीमित होने के कारण ${fallowStr} भूमि परती रखी गई है। ${allocStr} भूमि सुरक्षित रूप से आवंटित की गई।`;
  }
  return `Capital Budget Notice: ${fallowStr} kept fallow due to available capital budget (${budgetStr}). Allocated ${allocStr} safely.`;
}

export function getLocalizedGpsFallbackAlert(districtName: string, lang: string = 'en'): string {
  const dist = getDistrictDisplayName(districtName, lang);
  if (lang === 'hi') {
    return `कस्टम जीपीएस निर्देशांक भारत की भौगोलिक सीमा से बाहर थे; स्वचालित रूप से ${dist} के ज़िला केंद्र बिंदु पर रीसेट कर दिया गया।`;
  }
  return `Custom GPS coordinates were out-of-bounds; safely defaulted to centroid for ${districtName}.`;
}

export function getLocalizedNasaFallbackAlert(lang: string = 'en'): string {
  if (lang === 'hi') {
    return `NASA POWER उपग्रह टियर: प्राथमिक मौसम टेलीमेट्री अनुपलब्ध होने के कारण NASA POWER MERRA-2 उपग्रह डेटा (~2-3 दिन विलंबता) से संचालन जारी है।`;
  }
  return `NASA POWER Reanalysis Tier: Primary weather telemetry unavailable; operating with NASA POWER MERRA-2 satellite data (~2-3 days latency).`;
}

export function getLocalizedOfflineAlert(lang: string = 'en'): string {
  if (lang === 'hi') {
    return `ऑफ़लाइन आधारभूत टियर: सभी मौसम एपीआई ऑफ़लाइन हैं; IMD ऐतिहासिक कृषि-जलवायु डेटाबेस से कम विश्वसनीयता के साथ सुरक्षित निर्णय जारी है।`;
  }
  return `Offline Baseline Tier: All real-time APIs offline; operating strictly from IMD historical agro-climatic baselines with Low confidence.`;
}
