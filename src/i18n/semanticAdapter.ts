/**
 * src/i18n/semanticAdapter.ts
 * Semantic Narrative and Explanation Adapter for AgriOptima AI (USICT038)
 * Generates natural, human-friendly farmer explanations and structured expert analytics
 * across all supported Indian languages (English & Hindi) without hardcoded static stubs.
 */

import type {
  FarmDecisionResponse,
  ScenarioItem,
} from '@/types/farm';
import {
  formatCurrency,
  formatCurrencyWords,
  formatArea,
  formatTemperature,
  formatRainfall,
  formatSoilMoisture,
  formatVpd,
} from './formatters';
import { getCropDisplayName } from './cropNames';
import { getStateDisplayName, getDistrictDisplayName } from './geoNames';
import { translateIrrigationType } from './enums';

export interface FarmerWhyCard {
  icon: string;
  title: string;
  status: string;
  statusType: 'good' | 'warning' | 'neutral';
  explanation: string;
}

export interface FarmerActionStep {
  stepNumber: number;
  icon: string;
  title: string;
  action: string;
}

/**
 * 1. Strategic Headline Narrative Generator (Farmer View & Overview)
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
        ? `${district}, ${state} में ${acres} खेत के लिए: उच्च पर्यावरणीय जोखिम और लागत के कारण सभी फसलों में घाटे का अनुमान है। पूंजी सुरक्षा के लिए परती छोड़ना बेहतर है।`
        : `Strategic Plan for ${acres} in ${district}, ${state}: High environmental risk and production costs project negative margins across candidate crops. Fallow preservation recommended.`;
    }
    return lang === 'hi'
      ? `${district}, ${state} में ${acres} खेत के लिए: वर्तमान परिस्थितियों में कोई उपयुक्त फसल आवंटन नहीं मिला।`
      : `Strategic Plan for ${acres} in ${district}, ${state}: No suitable crop allocation found under current constraints.`;
  }

  const allocParts = allocated_crops.map((c) => {
    const cropName = getCropDisplayName(c.crop_name, lang);
    const cropAcres = formatArea(c.allocated_acres, lang);
    const share = c.acre_share_pct.toFixed(0);
    return `${cropAcres} ${cropName} (${share}%)`;
  });

  const allocText = allocParts.join(lang === 'hi' ? ', ' : ', ');

  if (lang === 'hi') {
    return `${district}, ${state} में ${acres} खेत के लिए: ${allocText} की बुवाई करें, जिससे अनुमानित शुद्ध मुनाफा ${profit} (ROI: +${roi}%) प्राप्त होगा।`;
  }

  return `Strategic Plan for ${acres} in ${district}, ${state}: Allocate ${allocText} for a projected Net Profit of ${profit} (ROI: +${roi}%).`;
}

/**
 * 2. Farmer-First Simple Recommendation Headline
 */
export function getFarmerRecommendationHeadline(decision: FarmDecisionResponse, lang: string = 'en'): string {
  const { farm_totals, location, allocated_crops } = decision;
  const state = getStateDisplayName(location.state_name, lang);
  const district = getDistrictDisplayName(location.district_name, lang);
  const acres = formatArea(farm_totals.total_land_acres, lang);
  const profitWords = formatCurrencyWords(farm_totals.total_expected_net_profit_inr, lang);
  const isHi = lang === 'hi';

  if (allocated_crops.length === 0) {
    return isHi
      ? `${district}, ${state} में ${acres} खेत: प्रतिकूल मौसम के कारण परती भूमि रखना सुरक्षित है।`
      : `Recommendation for ${acres} in ${district}, ${state}: Capital preservation recommended due to adverse climate.`;
  }

  const cropNames = allocated_crops.map((c) => getCropDisplayName(c.crop_name, lang)).join(isHi ? ' + ' : ' + ');

  if (isHi) {
    return `🌾 ${district}, ${state} में आपके ${acres} खेत के लिए अनुशंसित योजना: ${cropNames} उगाएं। अनुमानित शुद्ध कमाई: ${profitWords}।`;
  }

  return `🌾 Recommended plan for your ${acres} farm in ${district}, ${state}: Grow ${cropNames} for an estimated earning of ${profitWords}.`;
}

/**
 * 3. Level 2: "Why This Plan?" Visual Reason Cards
 */
export function getFarmerWhyCards(decision: FarmDecisionResponse, lang: string = 'en'): FarmerWhyCard[] {
  const { weather, risk, location, allocated_crops, request } = decision;
  const isHi = lang === 'hi';

  const temp = formatTemperature(weather.current_temperature_c, lang);
  const rain = formatRainfall(weather.forecast_rain_7d_total_mm, lang);
  const isRainHigh = (weather.forecast_rain_7d_total_mm ?? 0) > 60;
  const isHeatHigh = (weather.current_temperature_c ?? 25) > 38;

  // 1. Weather Card
  let weatherStatus = isHi ? 'अनुकूल मौसम' : 'Favorable Weather';
  let weatherStatusType: 'good' | 'warning' | 'neutral' = 'good';
  let weatherExpl = isHi
    ? `वर्तमान तापमान ${temp} और 7 दिनों में ${rain} वर्षा फसलों की अच्छी बढ़वार के लिए उपयुक्त है।`
    : `Current temperature of ${temp} and ${rain} forecast rain over 7 days support healthy crop growth.`;

  if (isRainHigh) {
    weatherStatus = isHi ? 'भारी वर्षा की संभावना' : 'Heavy Rain Expected';
    weatherStatusType = 'warning';
    weatherExpl = isHi
      ? `अगले 7 दिनों में ${rain} बारिश का अनुमान है। जलभराव से बचाव के लिए खेत में जलनिकासी की उचित व्यवस्था रखें।`
      : `Estimated ${rain} rain over next 7 days. Ensure good farm drainage to prevent excess standing water.`;
  } else if (isHeatHigh) {
    weatherStatus = isHi ? 'गर्मी का प्रभाव' : 'Elevated Heat';
    weatherStatusType = 'warning';
    weatherExpl = isHi
      ? `तापमान ${temp} तक पहुंच सकता है। समय पर हल्की सिंचाई करने की सलाह दी जाती है।`
      : `Temperatures reaching ${temp}. Timely light irrigation recommended to mitigate thermal stress.`;
  }

  // 2. Soil Card
  const soilType = location.major_soil_type || (isHi ? 'उपजाऊ दोमट मिट्टी' : 'Fertile Loam');
  const moistureStatus = risk.soil_moisture_status?.toLowerCase() || 'optimal';
  let soilStatus = isHi ? 'मिट्टी में उचित नमी' : 'Good Soil Moisture';
  let soilStatusType: 'good' | 'warning' | 'neutral' = 'good';
  let soilExpl = isHi
    ? `${soilType} मिट्टी में जड़-क्षेत्र की नमी फसल की जड़ों के लिए आदर्श स्थिति में है।`
    : `Root-zone moisture in ${soilType} soil is at optimal levels for healthy root nutrient absorption.`;

  if (moistureStatus.includes('deficit') || moistureStatus.includes('dry')) {
    soilStatus = isHi ? 'मिट्टी में नमी की कमी' : 'Moisture Deficit';
    soilStatusType = 'warning';
    soilExpl = isHi
      ? `मिट्टी में नमी कम है, इसलिए हमने कम पानी में पकने वाली मजबूत फसलों को प्राथमिकता दी है।`
      : `Soil moisture is low, so the algorithm prioritized drought-resilient crops requiring less water.`;
  } else if (moistureStatus.includes('saturated')) {
    soilStatus = isHi ? 'मिट्टी में भरपूर नमी' : 'High Soil Moisture';
    soilStatusType = 'neutral';
    soilExpl = isHi
      ? `मिट्टी में भरपूर नमी है, जिससे खरीफ फसलों को शुरुआती बढ़वार में पूरा पोषण मिलेगा।`
      : `Soil has ample moisture, providing crops with strong early vegetative growth support.`;
  }

  // 3. Water Card
  const irrigation = translateIrrigationType(request.irrigation_type, lang);
  const isRainfed = request.irrigation_type.toLowerCase() === 'rainfed';
  let waterStatus = isHi ? 'सुरक्षित जल साधन' : 'Protected Water Supply';
  let waterStatusType: 'good' | 'warning' | 'neutral' = 'good';
  let waterExpl = isHi
    ? `${irrigation} होने से बारिश की कमी होने पर भी फसल सुरक्षित रहेगी (लगभग ${Math.round(risk.irrigation_buffer_pct)}% सुरक्षा बफर)।`
    : `${irrigation} provides a strong ${Math.round(risk.irrigation_buffer_pct)}% safety buffer against dry spells.`;

  if (isRainfed) {
    waterStatus = isHi ? 'केवल वर्षा पर निर्भर' : 'Rain Dependent';
    waterStatusType = 'warning';
    waterExpl = isHi
      ? `वर्षा आधारित खेत होने के कारण योजना में केवल प्राकृतिक वर्षा सहने वाली मजबूत फसलें चुनी गई हैं।`
      : `As a rainfed farm, the plan strictly selects hardy crops suited for natural monsoon rains.`;
  }

  // 4. Market Card
  const topCrop = allocated_crops[0];
  let marketStatus = isHi ? 'स्थिर व लाभदायक मंडी भाव' : 'Strong Mandi Demand';
  let marketStatusType: 'good' | 'warning' | 'neutral' = 'good';
  let marketExpl = isHi
    ? topCrop
      ? `${getCropDisplayName(topCrop.crop_name, lang)} का मंडी भाव लगभग ${formatCurrency(topCrop.modal_price_per_qtl, lang)}/क्विंटल है, जो अच्छा मुनाफा सुनिश्चित करता है।`
      : 'मंडी भाव व उत्पादन लागत के अनुसार सर्वोत्तम मुनाफे वाली फसलें चुनी गई हैं।'
    : topCrop
    ? `APMC modal price for ${getCropDisplayName(topCrop.crop_name, lang)} is approx. ${formatCurrency(topCrop.modal_price_per_qtl, lang)}/Qtl, ensuring healthy margins.`
    : 'Crops selected based on favorable APMC modal prices and cost of cultivation benchmarks.';

  // 5. Season Card
  const seasonName = request.season;
  const seasonStatus = isHi ? `${seasonName} मौसम के अनुकूल` : `Optimal for ${seasonName}`;
  const seasonExpl = isHi
    ? `चुनी गई फसलें ${location.agro_climatic_zone || 'स्थानीय कृषि जलवायु'} के ${seasonName} मौसम चक्र में सर्वश्रेष्ठ पैदावार देती हैं।`
    : `Selected crops are agro-climatically tailored for maximum yields in the ${seasonName} cropping cycle.`;

  return [
    {
      icon: '☀️',
      title: isHi ? 'मौसम का हाल' : 'Weather Outlook',
      status: weatherStatus,
      statusType: weatherStatusType,
      explanation: weatherExpl,
    },
    {
      icon: '🌱',
      title: isHi ? 'मिट्टी की स्थिति' : 'Soil Condition',
      status: soilStatus,
      statusType: soilStatusType,
      explanation: soilExpl,
    },
    {
      icon: '💧',
      title: isHi ? 'पानी की उपलब्धता' : 'Water Availability',
      status: waterStatus,
      statusType: waterStatusType,
      explanation: waterExpl,
    },
    {
      icon: '💰',
      title: isHi ? 'मंडी भाव व मांग' : 'Mandi Market Price',
      status: marketStatus,
      statusType: marketStatusType,
      explanation: marketExpl,
    },
    {
      icon: '📅',
      title: isHi ? 'मौसम व बुवाई' : 'Season & Agronomy',
      status: seasonStatus,
      statusType: 'good',
      explanation: seasonExpl,
    },
  ];
}

/**
 * 4. Level 1: "What Should I Do Next?" (Actionable Next Steps)
 */
export function getFarmerNextActionSteps(decision: FarmDecisionResponse, lang: string = 'en'): FarmerActionStep[] {
  const { allocated_crops, weather, request } = decision;
  const isHi = lang === 'hi';
  const rain = weather.forecast_rain_7d_total_mm ?? 0;

  const topCropNames = allocated_crops.slice(0, 2).map((c) => getCropDisplayName(c.crop_name, lang));
  const cropsText = topCropNames.join(isHi ? ' व ' : ' & ') || (isHi ? 'अनुशंसित फसलों' : 'recommended crops');

  if (isHi) {
    return [
      {
        stepNumber: 1,
        icon: '🌱',
        title: '1. प्रमाणित बीज की व्यवस्था करें',
        action: `नजदीकी कृषि विज्ञान केंद्र (KVK) या अधिकृत बीज विक्रेता से ${cropsText} के प्रमाणित व उन्नत बीज प्राप्त करें।`,
      },
      {
        stepNumber: 2,
        icon: '🚜',
        title: '2. खेत की तैयारी व जुताई',
        action: 'मिट्टी में उचित नमी का लाभ उठाते हुए गहरी जुताई करें और पाटा लगाकर खेत को बुवाई के लिए तैयार करें।',
      },
      {
        stepNumber: 3,
        icon: '💧',
        title: '3. सिंचाई की योजना बनाएं',
        action: rain > 30
          ? `अगले 7 दिनों में लगभग ${formatRainfall(rain, lang)} बारिश का अनुमान है। जलभराव से बचाव के लिए खेत में जल निकासी नाली तैयार रखें।`
          : `${translateIrrigationType(request.irrigation_type, lang)} के जरिए बुवाई के बाद पहली हल्की सिंचाई की तैयारी रखें।`,
      },
      {
        stepNumber: 4,
        icon: '🧪',
        title: '4. संतुलित खाद व पोषण प्रबंधन',
        action: 'मिट्टी परीक्षण के अनुसार बेसल डोज (डीएपी, पोटाश व यूरिया) की अनुशंसित मात्रा बुवाई के समय डालें।',
      },
    ];
  }

  return [
    {
      stepNumber: 1,
      icon: '🌱',
      title: '1. Procure Certified Seeds',
      action: `Arrange certified, high-yielding variety seeds for ${cropsText} from your nearest KVK or registered seed depot.`,
    },
    {
      stepNumber: 2,
      icon: '🚜',
      title: '2. Seedbed & Field Preparation',
      action: 'Perform primary tillage while root-zone soil moisture is favorable to ensure uniform seed germination.',
    },
    {
      stepNumber: 3,
      icon: '💧',
      title: '3. Water & Irrigation Scheduling',
      action: rain > 30
        ? `Upcoming 7-day forecast indicates ${formatRainfall(rain, lang)} rain. Clear field drainage channels to prevent standing water.`
        : `Prepare your ${request.irrigation_type} system for timely first irrigation following seed germination.`,
    },
    {
      stepNumber: 4,
      icon: '🧪',
      title: '4. Basal Fertilizer & Nutrition',
      action: 'Apply recommended basal NPK fertilizer per acre at the time of sowing according to soil requirements.',
    },
  ];
}

/**
 * 5. Plain Language Risk Description
 */
export function getFarmerRiskPlainDescription(decision: FarmDecisionResponse, lang: string = 'en'): string {
  const { farm_totals } = decision;
  const isHi = lang === 'hi';
  const label = farm_totals.weighted_risk_label?.toUpperCase() || 'LOW';

  if (label === 'LOW') {
    return isHi
      ? `🟢 कम जोखिम (सुरक्षित योजना): वर्तमान मौसम, मिट्टी की नमी और आपके पानी के साधन के आधार पर यह योजना बहुत स्थिर है और घाटे की संभावना न्यूनतम है।`
      : `🟢 Low Risk (Safe Plan): Favorable weather, soil moisture, and your irrigation buffer provide stable returns with minimal downside risk.`;
  }
  if (label === 'MODERATE') {
    return isHi
      ? `🟡 मध्यम जोखिम (संतुलित योजना): मौसम में सामान्य बदलाव होने पर भी यह योजना लाभदायक रहेगी, हालांकि समय पर हल्की सिंचाई जरूरी होगी।`
      : `🟡 Moderate Risk (Balanced Plan): The plan remains profitable under normal climate fluctuations, with recommended light irrigation scheduling.`;
  }
  return isHi
    ? `🔴 अधिक जोखिम (सावधानी आवश्यक): मौसम या बाजार भाव में उतार-चढ़ाव संभव है। हमने जोखिम कम करने के लिए विविध फसलों का आवंटन किया है।`
    : `🔴 High Risk (Caution Required): Environmental variability detected. The system diversified crop allocations to hedge against potential downside.`;
}

/**
 * 6. Farmer-Friendly Voice Assistant Answer Generator
 */
export function getFarmerVoiceAnswer(query: string, decision: FarmDecisionResponse | null, lang: string = 'en'): string {
  if (!decision) {
    return lang === 'hi'
      ? 'कृपया पहले अपने खेत की जानकारी भरें और सर्वोत्तम योजना खोजें बटन दबाएं।'
      : 'Please enter your farm details and calculate your plan first.';
  }

  const isHi = lang === 'hi';
  const q = (query || '').toLowerCase();
  const { farm_totals, allocated_crops, location } = decision;
  const district = getDistrictDisplayName(location.district_name, lang);
  const profitWords = formatCurrencyWords(farm_totals.total_expected_net_profit_inr, lang);
  const cropsText = allocated_crops.map((c) => `${formatArea(c.allocated_acres, lang)} ${getCropDisplayName(c.crop_name, lang)}`).join(isHi ? ' और ' : ' and ');

  // Question 1: What should I grow?
  if (q.includes('what') || q.includes('grow') || q.includes('कौन') || q.includes('उगाऊं') || q.includes('फसल')) {
    if (isHi) {
      return `${district} में आपके ${formatArea(farm_totals.total_land_acres, lang)} खेत के लिए सर्वोत्तम योजना है: ${cropsText} उगाएं। इससे आपको ${profitWords} की शुद्ध कमाई होने का अनुमान है।`;
    }
    return `For your ${formatArea(farm_totals.total_land_acres, lang)} farm in ${district}, we recommend growing ${cropsText}. Your estimated net earning is ${profitWords}.`;
  }

  // Question 2: Why this recommendation?
  if (q.includes('why') || q.includes('क्यों') || q.includes('कारण')) {
    if (isHi) {
      return `यह योजना इसलिए अनुशंसित है क्योंकि आपके क्षेत्र की ${location.major_soil_type || 'मिट्टी'}, वर्तमान मौसम और आपके पानी के साधन के आधार पर इन फसलों में सबसे कम जोखिम और अधिकतम मुनाफा है।`;
    }
    return `This plan is recommended because local soil (${location.major_soil_type || 'soil'}), live weather conditions, and your irrigation buffer maximize net profits while keeping risks low.`;
  }

  // Question 3: What if rain is less / drought?
  if (q.includes('rain') || q.includes('drought') || q.includes('बारिश') || q.includes('सूखा')) {
    const droughtScenario = decision.scenarios?.drought;
    const droughtProfit = droughtScenario ? formatCurrencyWords(droughtScenario.total_profit_inr, lang) : profitWords;
    if (isHi) {
      return `यदि इस मौसम में बारिश कम होती है, तो भी आपकी फसल सुरक्षित रहेगी और अनुमानित मुनाफा ${droughtProfit} रहेगा, क्योंकि हमने कम पानी चाहने वाली फसलों को प्राथमिकता दी है।`;
    }
    return `If rainfall is deficient, your plan is protected by drought-resilient crop selection, projecting an estimated earning of ${droughtProfit}.`;
  }

  // Question 4: How much money / profit?
  if (q.includes('profit') || q.includes('earning') || q.includes('कमाई') || q.includes('मुनाफा') || q.includes('पैसा') || q.includes('बजट')) {
    if (isHi) {
      return `इस योजना में कुल लागत लगभग ${formatCurrency(farm_totals.total_investment_inr, lang)} आएगी और सभी खर्च काटकर आपकी शुद्ध कमाई ${profitWords} (ROI: +${farm_totals.expected_farm_roi_pct.toFixed(0)}%) होने का अनुमान है।`;
    }
    return `Total investment is approx. ${formatCurrency(farm_totals.total_investment_inr, lang)}, and your projected net profit after all expenses is ${profitWords} (ROI: +${farm_totals.expected_farm_roi_pct.toFixed(0)}%).`;
  }

  // Question 5: What should I do next?
  if (q.includes('next') || q.includes('आगे') || q.includes('कदम') || q.includes('क्या करूं')) {
    if (isHi) {
      return `अगला कदम है: नजदीकी कृषि केंद्र से प्रमाणित बीज प्राप्त करें, खेत की जुताई कर पाटा लगाएं, और मौसम के अनुसार बुवाई की तैयारी करें।`;
    }
    return `Next steps: Procure certified seeds from your nearest agricultural center, prepare your seedbed with primary tillage, and schedule sowing around the weather forecast.`;
  }

  // Default Answer
  if (isHi) {
    return `AgriOptima AI के अनुसार ${district} में आपके लिए सर्वोत्तम योजना: ${cropsText} उगाएं, जिससे ${profitWords} की कमाई हो सके।`;
  }
  return `According to AgriOptima AI, the optimal plan for ${district} is to grow ${cropsText}, projecting net earnings of ${profitWords}.`;
}

/**
 * 7. Environmental Summary Narrative Generator (Expert View)
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
    return `लाइव टेलीमेट्री में ${temp} तापमान, ${rh}% सापेक्ष आर्द्रता, ${vpd} वाष्प दाब घाटा (VPD), और ${rootZone} जड़-क्षेत्र मिट्टी नमी दर्ज है। 7-दिवसीय पूर्वानुमान में ${rain7d} कुल वर्षा व ${peakProb}% अधिकतम वर्षा संभावना है।`;
  }

  return `Live telemetry reflects ${temp} temperature, ${rh}% relative humidity, VPD of ${vpd}, and root-zone soil moisture of ${rootZone}. 7-day outlook indicates ${rain7d} total rainfall with ${peakProb}% peak precipitation probability.`;
}

/**
 * 8. Irrigation Impact Narrative Generator (Expert View)
 */
export function getIrrigationImpact(decision: FarmDecisionResponse, lang: string = 'en'): string {
  const { request, risk } = decision;
  const irrigation = translateIrrigationType(request.irrigation_type, lang);
  const buffer = Math.round(risk.irrigation_buffer_pct);

  if (request.irrigation_type.toLowerCase() === 'rainfed') {
    if (lang === 'hi') {
      return `वर्षा-आधारित (असिंचित) प्रणाली पूर्ण रूप से प्राकृतिक वर्षा पर निर्भर है, जिससे सूखे का जोखिम 100% बना रहता है।`;
    }
    return `Rainfed farm configuration relies entirely on natural precipitation, exposing crops to unbuffered drought variability.`;
  }

  if (lang === 'hi') {
    return `${irrigation} प्रणाली पर्यावरणीय नमी के उतार-चढ़ाव के खिलाफ एक विश्वसनीय सुरक्षा बफर प्रदान करती है, जिससे सूखे के प्रभाव में ${buffer}% तक की कमी आती है।`;
  }

  return `${irrigation} irrigation system buffers crops against environmental moisture volatility, mitigating drought risk by ${buffer}%.`;
}

/**
 * 9. 8-Step Causal Chain Dynamic Detail Generator (Expert View)
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
  const { location, weather, risk, farm_totals, allocated_crops } = decision;
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
        ? `7-दिवसीय ECMWF संख्यात्मक पूर्वानुमान द्वारा ${formatRainfall(weather.forecast_rain_7d_total_mm, lang)} कुल वर्षा और ${weather.max_rain_probability_7d_pct ?? 0}% अधिकतम वर्षा संभावना का प्रक्षेपणवक्र विश्लेषित किया गया।`
        : `Evaluated 7-day ECMWF forecast trajectory showing ${formatRainfall(weather.forecast_rain_7d_total_mm, lang)} cumulative precipitation with ${weather.max_rain_probability_7d_pct ?? 0}% peak rainfall probability.`;

    case 4:
      return lang === 'hi'
        ? `पर्यावरणीय टेलीमेट्री को 4 जोखिम संकेतकों में बदला गया: सूखा (${risk.drought_risk_score.toFixed(2)}), जलभराव (${risk.waterlogging_risk_score.toFixed(2)}), लू/ताप (${risk.heat_risk_score.toFixed(2)}), और वायुमंडलीय जल तनाव (${risk.atmospheric_water_stress_score.toFixed(2)})।`
        : `Translated environmental signals into calibrated stress scores: drought (${risk.drought_risk_score.toFixed(2)}), waterlogging (${risk.waterlogging_risk_score.toFixed(2)}), heat (${risk.heat_risk_score.toFixed(2)}), and atmospheric water stress (${risk.atmospheric_water_stress_score.toFixed(2)}).`;

    case 5:
      return lang === 'hi'
        ? `सहनशीलता थ्रेसहोल्ड के आधार पर प्रत्येक उम्मीदवार फसल के लिए गैर-रेखीय पैदावार पेनाल्टी लागू की गई।`
        : `Applied crop-specific non-linear yield penalty curves based on physiological stress response curves.`;

    case 6:
      return lang === 'hi'
        ? `APMC मंडी थोक भावों और लागत मानकों के आधार पर जोखिम-समायोजित शुद्ध लाभ का पुनःपरिकलन किया गया।`
        : `Recalculated expected revenue, cultivation costs (C2), and risk-adjusted margins per acre using APMC mandi benchmarks.`;

    case 7:
      return lang === 'hi'
        ? `HiGHS लीनियर प्रोग्रामिंग सॉल्वर द्वारा ${formatArea(farm_totals.total_land_acres, lang)} जमीन और ${formatCurrency(farm_totals.budget_capital_inr, lang)} बजट सीमाओं के भीतर शुद्ध लाभ को अधिकतम करने वाला इष्टतम आवंटन निकाला गया।`
        : `Executed HiGHS dual-simplex LP optimization to maximize farm-wide profit subject to ${formatArea(farm_totals.total_land_acres, lang)} land and ${formatCurrency(farm_totals.budget_capital_inr, lang)} capital constraints.`;

    case 8:
      return lang === 'hi'
        ? allocated_crops.length > 0
          ? `अंतिम सिफारिश: ${allocated_crops.map((c) => `${formatArea(c.allocated_acres, lang)} ${getCropDisplayName(c.crop_name, lang)}`).join(', ')} की बुवाई करें, जिससे ${formatCurrency(farm_totals.total_expected_net_profit_inr, lang)} का शुद्ध लाभ प्राप्त होगा।`
          : `अंतिम सिफारिश: उच्च जोखिम के कारण परती भूमि रखना सुरक्षित है।`
        : allocated_crops.length > 0
        ? `Directive: Allocate ${allocated_crops.map((c) => `${formatArea(c.allocated_acres, lang)} ${getCropDisplayName(c.crop_name, lang)}`).join(', ')} to achieve projected Net Profit of ${formatCurrency(farm_totals.total_expected_net_profit_inr, lang)}.`
        : `Directive: Preserve capital through fallow preservation due to adverse environmental conditions.`;

    default:
      return '';
  }
}

/**
 * 10. Scenario Descriptions & Shifts (Stress Tests)
 */
export function getScenarioDescription(scenarioId: string, item: ScenarioItem, lang: string = 'en'): string {
  if (lang !== 'hi') return item.description;

  switch (scenarioId) {
    case 'live':
      return 'वर्तमान वास्तविक समय टेलीमेट्री और 7-दिवसीय मौसम पूर्वानुमान के तहत आधारभूत प्रदर्शन।';
    case 'drought':
      return '7-दिवसीय वर्षा में 35% की कमी और सतही मृदा नमी में गिरावट का गंभीर सूखा परिदृश्य।';
    case 'waterlogging':
      return 'अत्यधिक वर्षा (+80 मिमी अतिरिक्त) और जड़-क्षेत्र में जलभराव का परिदृश्य।';
    case 'heat_wave':
      return 'तापमान में +4.5°C की तीव्र वृद्धि और उच्च वाष्प दाब घाटा (VPD) का लू परिदृश्य।';
    default:
      return item.description;
  }
}

export function getScenarioAdaptationShift(scenarioId: string, item: ScenarioItem, lang: string = 'en'): string {
  if (lang !== 'hi') return item.key_allocation_shift;

  switch (scenarioId) {
    case 'live':
      return 'आधारभूत इष्टतम आवंटन।';
    case 'drought':
      return 'सूखा-सहनशील फसलों की ओर रकबा बढ़ाया गया; जल-संवेदनशील फसलों का रकबा घटाया गया।';
    case 'waterlogging':
      return 'उत्कृष्ट जलनिकासी सहन करने वाली फसलों को प्राथमिकता दी गई; संवेदनशील फसलों में कटौती की गई।';
    case 'heat_wave':
      return 'गर्मी-सहनशील फसलों का आवंटन बढ़ाया गया; उच्च तापमान संवेदनशील किस्मों को कम किया गया।';
    default:
      return item.key_allocation_shift;
  }
}

/**
 * 11. Crop Reason Tag Localization
 */
export function getCropReasonTag(reason: string, lang: string = 'en'): string {
  if (lang !== 'hi') return reason;

  const r = reason.toLowerCase();
  if (r.includes('highest risk-adjusted margin') || r.includes('high margin')) {
    return 'सर्वोच्च जोखिम-समायोजित मुनाफा';
  }
  if (r.includes('drought-tolerant') || r.includes('drought resilience')) {
    return 'सूखा सहनशील';
  }
  if (r.includes('optimal soil moisture') || r.includes('favorable soil')) {
    return 'अनुकूल मृदा नमी';
  }
  if (r.includes('high mandi modal price') || r.includes('favorable apmc')) {
    return 'उत्कृष्ट मंडी भाव';
  }
  if (r.includes('capital efficiency') || r.includes('budget constraint')) {
    return 'पूंजी दक्षता';
  }
  if (r.includes('waterlogging resilience')) {
    return 'जलभराव सहनशील';
  }
  if (r.includes('heat-tolerant')) {
    return 'गर्मी सहनशील';
  }
  return reason;
}

/**
 * 12. Localized Alerts
 */
export function getLocalizedBudgetAlert(fallowAcres: number, budgetInr: number, allocatedAcres: number, lang: string = 'en'): string {
  if (lang === 'hi') {
    return `⚠️ बजट सीमा चेतावनी: ₹${budgetInr.toLocaleString('en-IN')} की कार्यशील पूंजी के कारण ${formatArea(allocatedAcres, lang)} में बुवाई संभव हुई और ${formatArea(fallowAcres, lang)} जमीन खाली (परती) रखी गई है।`;
  }
  return `⚠️ Budget Constrained: Working capital of ₹${budgetInr.toLocaleString('en-IN')} allocated ${formatArea(allocatedAcres, lang)}, leaving ${formatArea(fallowAcres, lang)} fallow.`;
}

export function getLocalizedGpsFallbackAlert(districtName: string, lang: string = 'en'): string {
  if (lang === 'hi') {
    return `सूचना: GPS निर्देशांक उपलब्ध न होने के कारण ${districtName} के जिला केंद्र के भू-निर्देशांकों का उपयोग किया गया।`;
  }
  return `Info: Location resolved to ${districtName} district centroid as precise GPS was unavailable.`;
}

export function getLocalizedNasaFallbackAlert(lang: string = 'en'): string {
  if (lang === 'hi') {
    return `सूचना: प्राथमिक मौसम सेवा में विलंब के कारण बैकअप मौसम मॉडल का उपयोग किया गया।`;
  }
  return `Info: Primary weather stream experienced latency; fallback meteorological data utilized.`;
}

export function getLocalizedOfflineAlert(lang: string = 'en'): string {
  if (lang === 'hi') {
    return `ऑफ़लाइन मोड: स्थानीय स्वायत्त निर्णय इंजन सक्रिय है।`;
  }
  return `Offline Mode: Autonomous client-side decision engine active.`;
}
