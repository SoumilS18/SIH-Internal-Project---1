import React from 'react';
import {
  Thermometer,
  Droplets,
  Wind,
  CloudRain,
  Activity,
  CheckCircle2,
  Info,
  ShieldAlert,
} from 'lucide-react';
import type { WeatherInfo, RiskInfo, LocationInfo } from '@/types/farm';
import { useLanguage } from '@/i18n/LanguageContext';
import { translateRiskLevel, translateConfidence, translateMoistureStatus } from '@/i18n/enums';
import { getStateDisplayName, getDistrictDisplayName } from '@/i18n/geoNames';
import {
  formatTemperature,
  formatRainfall,
  formatSoilMoisture,
  formatVpd,
  formatWind,
} from '@/i18n/formatters';

interface EnvironmentalIntelligenceProps {
  weather: WeatherInfo;
  risk: RiskInfo;
  location: LocationInfo;
}

function getRiskColorClass(label: string) {
  switch (label?.toUpperCase()) {
    case 'LOW':
      return {
        badge: 'border-[#D4E7DC] bg-[#EAF3ED] text-[#2D5A43]',
        bar: 'bg-[#2D5A43]',
        text: 'text-[#2D5A43]',
      };
    case 'MODERATE':
      return {
        badge: 'border-[#FDEEE9] bg-[#FAF7F2] text-[#B54832]',
        bar: 'bg-[#E2725B]',
        text: 'text-[#B54832]',
      };
    case 'HIGH':
      return {
        badge: 'border-[#FED7AA] bg-[#FFF7ED] text-[#C2410C]',
        bar: 'bg-[#EA580C]',
        text: 'text-[#C2410C]',
      };
    case 'CRITICAL':
      return {
        badge: 'border-[#FECDD3] bg-[#FFF1F2] text-[#BE123C]',
        bar: 'bg-[#E11D48]',
        text: 'text-[#BE123C]',
      };
    default:
      return {
        badge: 'border-[#EDE4D5] bg-[#FAF7F2] text-[#6B7280]',
        bar: 'bg-[#6B7280]',
        text: 'text-[#6B7280]',
      };
  }
}

export function EnvironmentalIntelligence({
  weather,
  risk,
  location,
}: EnvironmentalIntelligenceProps) {
  const { t, language } = useLanguage();
  const isHindi = language === 'hi';

  // 1. Calculate Root-Zone Position for the Soil Moisture Gauge (0.10 to 0.60 m3/m3 scale)
  const rootZoneValue = weather.root_zone_soil_moisture_m3m3 ?? 0.35;
  const minGauge = 0.1;
  const maxGauge = 0.6;
  const gaugePercent = Math.min(
    100,
    Math.max(0, ((rootZoneValue - minGauge) / (maxGauge - minGauge)) * 100)
  );

  // 2. Derive 7-Day Trajectory Trend (Rain & Temp shifts)
  const series = weather.daily_series || [];
  let weatherTrend = isHindi
    ? '7-दिवसीय दृष्टिकोण में स्थिर मौसम संबंधी स्थितियां अपेक्षित हैं'
    : 'Stable meteorological conditions expected across the 7-day outlook';

  if (series.length >= 4) {
    const earlyRain = series.slice(0, 3).reduce((acc, d) => acc + d.rain_mm, 0);
    const lateRain = series.slice(-3).reduce((acc, d) => acc + d.rain_mm, 0);
    const earlyTemp =
      series.slice(0, 3).reduce((acc, d) => acc + d.t_max, 0) / 3;
    const lateTemp = series.slice(-3).reduce((acc, d) => acc + d.t_max, 0) / 3;

    if (lateRain - earlyRain > 15) {
      weatherTrend = isHindi
        ? 'अधिक वर्षा का रुझान: पूर्वानुमान चक्र के मध्य और अंत में वर्षा में वृद्धि'
        : 'Wetter trajectory: Elevated precipitation concentrated in mid-to-late forecast cycle';
    } else if (earlyRain - lateRain > 15) {
      weatherTrend = isHindi
        ? 'शुष्क होने का रुझान: शुरुआती हल्की बारिश के बाद साफ मौसम'
        : 'Drying trajectory: Early showers tapering off to clear conditions';
    } else if (lateTemp - earlyTemp > 3.0) {
      weatherTrend = isHindi
        ? `तापमान वृद्धि: अधिकतम तापमान में +${(lateTemp - earlyTemp).toFixed(1)}°C की बढ़ोतरी`
        : `Warming trend: Maximum temperatures rising by +${(lateTemp - earlyTemp).toFixed(1)}°C`;
    } else if (earlyTemp - lateTemp > 3.0) {
      weatherTrend = isHindi
        ? `तापमान में गिरावट: तापमान में -${(earlyTemp - lateTemp).toFixed(1)}°C की कमी`
        : `Cooling trend: Temperatures tapering by -${(earlyTemp - lateTemp).toFixed(1)}°C`;
    }
  }

  // 3. Dynamic "What this means" Sentences (Bilingual)
  const tempVal = weather.current_temperature_c ?? 28;
  const rhVal = weather.current_humidity_pct ?? 70;
  const rain7dVal = weather.forecast_rain_7d_total_mm ?? 50;

  const currentStatement = isHindi
    ? `वर्तमान तापमान ${tempVal.toFixed(1)}°C और आर्द्रता ${rhVal}% अनुकूल है। मिट्टी की नमी (${(
        weather.root_zone_soil_moisture_m3m3 ?? 0.35
      ).toFixed(3)} m³/m³) ${translateMoistureStatus(risk.soil_moisture_status, language)} दर्शाती है।`
    : `Current temperatures are ${tempVal.toFixed(1)}°C with ${rhVal}% humidity. Soil moisture levels are ${
        risk.soil_moisture_status || 'optimal'
      } at ${(weather.root_zone_soil_moisture_m3m3 ?? 0.35).toFixed(3)} m³/m³.`;

  const forecastStatement = isHindi
    ? `अगले 7 दिनों में कुल ${rain7dVal.toFixed(1)} मिमी वर्षा का अनुमान है। ${weatherTrend}।`
    : `7-day precipitation totals ${rain7dVal.toFixed(1)} mm. ${weatherTrend}.`;

  let implicationStatement = isHindi
    ? 'वर्तमान पर्यावरणीय परिस्थितियां सामान्य फसल वृद्धि और पोषक तत्व अवशोषण के लिए अनुकूल हैं। अतिरिक्त सिंचाई की आवश्यकता नहीं है।'
    : 'Conditions are favourable for standard crop growth and nutrient uptake. No emergency irrigation adjustments needed.';

  if (risk.waterlogging_risk_score > 0.6) {
    implicationStatement = isHindi
      ? 'अत्यधिक वर्षा और जलभराव का खतरा: संवेदनशील फसलों के लिए खेतों में जल निकासी सुनिश्चित करें और अतिरिक्त सिंचाई स्थगित करें।'
      : 'Elevated waterlogging risk: Ensure adequate furrow drainage and defer supplemental irrigation to avoid root hypoxia.';
  } else if (risk.drought_risk_score > 0.6) {
    implicationStatement = isHindi
      ? 'नमी की गंभीर कमी का खतरा: मिट्टी में नमी बनाए रखने के लिए ड्रिप सिंचाई और मल्चिंग को प्राथमिकता दें।'
      : 'Elevated moisture deficit: Prioritize drought-resilient crops and optimize irrigation schedule to protect yield margins.';
  } else if (risk.heat_risk_score > 0.6) {
    implicationStatement = isHindi
      ? 'उच्च तापमान और वाष्पीकरण तनाव: फूलों और दाने भरने के चरण में दोपहर के ताप तनाव से फसलों की सुरक्षा करें।'
      : 'High thermal stress: Atmospheric water demand elevated. Schedule irrigation during cooler evening or morning windows.';
  }

  // 4. Alert evaluation
  const hasWaterlogAlert = Boolean(risk.waterlogging_alert);
  const hasHeatAlert = Boolean(risk.heat_alert);
  const hasCriticalRisk =
    risk.overall_risk_label?.toUpperCase() === 'CRITICAL' ||
    risk.overall_risk_score > 0.75;

  return (
    <div className="space-y-4 text-[#1F2937]">
      {/* --------------------------------------------------------------------- */}
      {/* 1. PAGE HEADER */}
      {/* --------------------------------------------------------------------- */}
      <div className="rounded-2xl border border-[#EDE4D5] bg-[#FFFFFF] p-4 shadow-sm">
        <h2 className="font-serif text-base font-bold text-[#1F2937] sm:text-lg">
          {t('telemetry.title')}
        </h2>
        <p className="mt-0.5 text-xs text-[#6B7280]">
          {t('telemetry.subtitle')}{' '}
          <span className="font-semibold text-[#E2725B]">
            {getDistrictDisplayName(location.district_name, language)},{' '}
            {getStateDisplayName(location.state_name, language)}
          </span>
        </p>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 2. TELEMETRY STATUS STRIP (4 Key Metadata Chips) */}
      {/* --------------------------------------------------------------------- */}
      <div className="grid grid-cols-2 gap-2 rounded-2xl border border-[#EDE4D5] bg-[#FAF7F2] p-3 sm:grid-cols-4">
        <div>
          <span className="block text-[9px] uppercase font-bold tracking-wider text-[#6B7280]">
            {t('telemetry.dataProvider')}
          </span>
          <span className="text-xs font-bold text-[#1F2937]">
            {weather.data_provider || 'Open-Meteo & ERA5'}
          </span>
        </div>

        <div>
          <span className="block text-[9px] uppercase font-bold tracking-wider text-[#6B7280]">
            {t('telemetry.confidenceScore')}
          </span>
          <span className="text-xs font-bold text-[#2D5A43]">
            {translateConfidence(weather.confidence_score, language)}
          </span>
        </div>

        <div>
          <span className="block text-[9px] uppercase font-bold tracking-wider text-[#6B7280]">
            {t('telemetry.lastUpdated')}
          </span>
          <span className="text-xs font-semibold text-[#4B5563]">
            {weather.weather_timestamp
              ? weather.weather_timestamp.replace('T', ' ').slice(0, 16)
              : isHindi
              ? 'लाइव अवलोकन'
              : 'Live Observation'}
          </span>
        </div>

        <div>
          <span className="block text-[9px] uppercase font-bold tracking-wider text-[#6B7280]">
            {t('telemetry.soilStatus')}
          </span>
          <span className="text-xs font-bold text-[#E2725B]">
            {translateMoistureStatus(risk.soil_moisture_status, language)}
          </span>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 3. CURRENT ENVIRONMENTAL CONDITIONS (5 Primary Metrics Grid) */}
      {/* --------------------------------------------------------------------- */}
      <div className="rounded-2xl border border-[#EDE4D5] bg-[#FFFFFF] p-4 shadow-sm">
        <h3 className="mb-3 font-serif text-sm font-bold text-[#1F2937]">
          {t('telemetry.currentConditions')}
        </h3>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          {/* Temperature */}
          <div className="rounded-xl border border-[#EDE4D5] bg-[#FAF7F2] p-3">
            <div className="flex items-center gap-1.5 text-[#E2725B]">
              <Thermometer size={14} />
              <span className="text-[10px] uppercase font-bold text-[#6B7280]">
                {t('telemetry.temperature')}
              </span>
            </div>
            <div className="mt-1.5 font-serif text-lg font-bold text-[#1F2937]">
              {formatTemperature(weather.current_temperature_c, language)}
            </div>
          </div>

          {/* Humidity */}
          <div className="rounded-xl border border-[#EDE4D5] bg-[#FAF7F2] p-3">
            <div className="flex items-center gap-1.5 text-[#2D5A43]">
              <Droplets size={14} />
              <span className="text-[10px] uppercase font-bold text-[#6B7280]">
                {t('telemetry.humidity')}
              </span>
            </div>
            <div className="mt-1.5 font-serif text-lg font-bold text-[#1F2937]">
              {weather.current_humidity_pct !== null ? `${weather.current_humidity_pct}%` : '73%'}
            </div>
          </div>

          {/* Wind Velocity */}
          <div className="rounded-xl border border-[#EDE4D5] bg-[#FAF7F2] p-3">
            <div className="flex items-center gap-1.5 text-[#4B5563]">
              <Wind size={14} />
              <span className="text-[10px] uppercase font-bold text-[#6B7280]">
                {t('telemetry.wind')}
              </span>
            </div>
            <div className="mt-1.5 font-serif text-lg font-bold text-[#1F2937]">
              {formatWind(weather.current_wind_kmh, language)}
            </div>
          </div>

          {/* Precipitation */}
          <div className="rounded-xl border border-[#EDE4D5] bg-[#FAF7F2] p-3">
            <div className="flex items-center gap-1.5 text-[#2563EB]">
              <CloudRain size={14} />
              <span className="text-[10px] uppercase font-bold text-[#6B7280]">
                {t('telemetry.rainfall')}
              </span>
            </div>
            <div className="mt-1.5 font-serif text-lg font-bold text-[#2563EB]">
              {formatRainfall(weather.current_precipitation_mm, language)}
            </div>
          </div>

          {/* VPD */}
          <div className="rounded-xl border border-[#EDE4D5] bg-[#FAF7F2] p-3">
            <div className="flex items-center gap-1.5 text-[#B54832]">
              <Activity size={14} />
              <span className="text-[10px] uppercase font-bold text-[#6B7280]">
                {t('telemetry.vpd')}
              </span>
            </div>
            <div className="mt-1.5 font-serif text-lg font-bold text-[#1F2937]">
              {formatVpd(weather.vapour_pressure_deficit_kpa)}
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 4. SOIL MOISTURE SECTION (Visual Centerpiece) */}
      {/* --------------------------------------------------------------------- */}
      <div className="rounded-2xl border border-[#EDE4D5] bg-[#FFFFFF] p-5 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDE4D5] pb-2.5">
          <h3 className="font-serif text-sm font-bold text-[#1F2937]">
            {t('telemetry.rootZoneTitle')}
          </h3>
          <span className="rounded-full border border-[#D4E7DC] bg-[#EAF3ED] px-3 py-0.5 text-[11px] font-bold text-[#2D5A43]">
            {translateMoistureStatus(risk.soil_moisture_status, language)}
          </span>
        </div>

        {/* Moisture Metrics Row */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-[#EDE4D5] bg-[#FAF7F2] p-3.5">
            <span className="block text-[10px] uppercase font-bold text-[#6B7280]">
              {t('telemetry.surfaceSoilMoisture')}
            </span>
            <div className="mt-1 font-serif text-xl font-bold text-[#1F2937]">
              {formatSoilMoisture(weather.surface_soil_moisture_m3m3)}
            </div>
          </div>

          <div className="rounded-xl border border-[#EDE4D5] bg-[#FAF7F2] p-3.5">
            <span className="block text-[10px] uppercase font-bold text-[#6B7280]">
              {t('telemetry.rootZoneSoilMoisture')}
            </span>
            <div className="mt-1 font-serif text-xl font-bold text-[#E2725B]">
              {formatSoilMoisture(weather.root_zone_soil_moisture_m3m3)}
            </div>
          </div>
        </div>

        {/* Continuous Horizontal Moisture Gauge */}
        <div className="pt-2">
          <div className="mb-1.5 flex justify-between text-[10px] font-bold text-[#6B7280]">
            <span>{t('telemetry.distributionScale')}</span>
            <span className="text-[#1F2937]">
              {t('telemetry.current')}: {formatSoilMoisture(weather.root_zone_soil_moisture_m3m3 ?? 0.468)}
            </span>
          </div>

          <div className="relative">
            {/* Multi-tier Gradient Bar */}
            <div className="flex h-3 w-full overflow-hidden rounded-full border border-[#EDE4D5] bg-[#F5EFE6]">
              <div className="w-1/4 bg-[#D97706]/70" title="Dry" />
              <div className="w-1/4 bg-[#F59E0B]/80" title="Deficit" />
              <div className="w-1/4 bg-[#10B981]/90" title="Optimal" />
              <div className="w-1/4 bg-[#3B82F6]/90" title="Saturated" />
            </div>

            {/* Dynamic Marker Pointer */}
            <div
              className="absolute -top-1 -bottom-1 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-500"
              style={{ left: `${gaugePercent}%` }}
            >
              <div className="h-5 w-1.5 rounded-full bg-[#1F2937] shadow-sm" />
            </div>
          </div>

          {/* Scale Labels */}
          <div className="mt-1.5 grid grid-cols-4 text-center text-[10px] font-semibold text-[#6B7280]">
            <span>{t('telemetry.dry')}</span>
            <span>{t('telemetry.deficit')}</span>
            <span className="text-[#2D5A43] font-bold">{t('telemetry.optimal')}</span>
            <span>{t('telemetry.saturated')}</span>
          </div>
        </div>

        {/* Soil Type & Explanation */}
        <div className="rounded-xl bg-[#FAF7F2] border border-[#EDE4D5] p-3 text-xs">
          <div className="text-[11px] font-bold text-[#1F2937]">
            {t('telemetry.soilType')}: {location.major_soil_type || 'Medium Black Soil'}
          </div>
          <p className="mt-0.5 leading-relaxed text-[#4B5563]">
            {risk.soil_moisture_status.toLowerCase().includes('optimal')
              ? t('telemetry.optimalExplanation')
              : risk.soil_moisture_status.toLowerCase().includes('deficit')
              ? t('telemetry.deficitExplanation')
              : t('telemetry.saturatedExplanation')}
          </p>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 5. 7-DAY WEATHER TRAJECTORY */}
      {/* --------------------------------------------------------------------- */}
      <div className="rounded-2xl border border-[#EDE4D5] bg-[#FFFFFF] p-4 shadow-sm space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#EDE4D5] pb-2.5">
          <h3 className="font-serif text-sm font-bold text-[#1F2937]">
            {t('telemetry.forecast7dTitle')}
          </h3>

          <div className="flex items-center gap-3 text-xs">
            <div className="text-right">
              <span className="block text-[9px] uppercase font-bold text-[#6B7280]">
                {t('telemetry.forecastRainfall7d')}
              </span>
              <span className="font-bold text-[#2563EB]">
                {formatRainfall(weather.forecast_rain_7d_total_mm, language)}
              </span>
            </div>

            <div className="border-l border-[#EDE4D5] pl-3 text-right">
              <span className="block text-[9px] uppercase font-bold text-[#6B7280]">
                {t('telemetry.peakRainProb')}
              </span>
              <span className="font-bold text-[#E2725B]">
                {weather.max_rain_probability_7d_pct ?? 95}%
              </span>
            </div>
          </div>
        </div>

        {/* Trajectory Daily Cards */}
        {series.length > 0 ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {series.map((day) => (
              <div
                key={day.date}
                className="rounded-xl border border-[#EDE4D5] bg-[#FAF7F2] p-2.5 text-center text-xs"
              >
                <span className="block text-[10px] font-bold text-[#6B7280]">
                  {day.date.slice(5)}
                </span>
                <span className="mt-1 block font-serif text-xs font-bold text-[#1F2937]">
                  {day.t_max.toFixed(0)}° / {day.t_min.toFixed(0)}°
                </span>
                <div className="mt-1 flex items-center justify-center gap-1 text-[11px] text-[#2563EB] font-bold">
                  <Droplets size={10} />
                  <span>{formatRainfall(day.rain_mm, language)}</span>
                </div>
                <span className="mt-0.5 block text-[9px] text-[#6B7280]">
                  {day.rain_prob}% {t('telemetry.rain')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#6B7280]">
            {isHindi
              ? 'दैनिक संख्यात्मक मौसम प्रक्षेपवक्र अनुपलब्ध है।'
              : 'Daily numerical weather trajectory unavailable.'}
          </p>
        )}

        {/* Trajectory Direction Footer */}
        <div className="flex items-center gap-2 rounded-xl bg-[#FAF7F2] border border-[#EDE4D5] px-3 py-2 text-xs text-[#4B5563]">
          <Info size={13} className="shrink-0 text-[#E2725B]" />
          <span>{weatherTrend}</span>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 6. ENVIRONMENTAL RISK (4 Horizontal Risk Indicators) */}
      {/* --------------------------------------------------------------------- */}
      <div className="rounded-2xl border border-[#EDE4D5] bg-[#FFFFFF] p-4 shadow-sm space-y-3">
        <h3 className="font-serif text-sm font-bold text-[#1F2937]">
          {t('telemetry.environmentalRisk')}
        </h3>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {/* Drought Risk */}
          <div className="rounded-xl border border-[#EDE4D5] bg-[#FAF7F2] p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1F2937]">
                {t('telemetry.droughtRisk')}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                    getRiskColorClass(risk.drought_risk_label).badge
                  }`}
                >
                  {translateRiskLevel(risk.drought_risk_label, language)}
                </span>
                <span className="text-xs font-bold text-[#1F2937]">
                  {risk.drought_risk_score.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-[#EDE4D5] overflow-hidden">
              <div
                className={`h-full rounded-full ${getRiskColorClass(risk.drought_risk_label).bar}`}
                style={{ width: `${Math.min(100, risk.drought_risk_score * 100)}%` }}
              />
            </div>
          </div>

          {/* Waterlogging Risk */}
          <div className="rounded-xl border border-[#EDE4D5] bg-[#FAF7F2] p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1F2937]">
                {t('telemetry.waterloggingRisk')}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                    getRiskColorClass(risk.waterlogging_risk_label).badge
                  }`}
                >
                  {translateRiskLevel(risk.waterlogging_risk_label, language)}
                </span>
                <span className="text-xs font-bold text-[#1F2937]">
                  {risk.waterlogging_risk_score.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-[#EDE4D5] overflow-hidden">
              <div
                className={`h-full rounded-full ${getRiskColorClass(risk.waterlogging_risk_label).bar}`}
                style={{ width: `${Math.min(100, risk.waterlogging_risk_score * 100)}%` }}
              />
            </div>
          </div>

          {/* Heat Risk */}
          <div className="rounded-xl border border-[#EDE4D5] bg-[#FAF7F2] p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1F2937]">
                {t('telemetry.heatRisk')}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                    getRiskColorClass(risk.heat_risk_label).badge
                  }`}
                >
                  {translateRiskLevel(risk.heat_risk_label, language)}
                </span>
                <span className="text-xs font-bold text-[#1F2937]">
                  {risk.heat_risk_score.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-[#EDE4D5] overflow-hidden">
              <div
                className={`h-full rounded-full ${getRiskColorClass(risk.heat_risk_label).bar}`}
                style={{ width: `${Math.min(100, risk.heat_risk_score * 100)}%` }}
              />
            </div>
          </div>

          {/* Atmospheric Water Stress */}
          <div className="rounded-xl border border-[#EDE4D5] bg-[#FAF7F2] p-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-[#1F2937]">
                {t('telemetry.atmosphericWaterStress')}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-md border px-2 py-0.5 text-[10px] font-bold ${
                    getRiskColorClass(risk.atmospheric_water_stress_label).badge
                  }`}
                >
                  {translateRiskLevel(risk.atmospheric_water_stress_label, language)}
                </span>
                <span className="text-xs font-bold text-[#1F2937]">
                  {risk.atmospheric_water_stress_score.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-[#EDE4D5] overflow-hidden">
              <div
                className={`h-full rounded-full ${getRiskColorClass(risk.atmospheric_water_stress_label).bar}`}
                style={{ width: `${Math.min(100, risk.atmospheric_water_stress_score * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 7. IMPORTANT ALERT */}
      {/* --------------------------------------------------------------------- */}
      {hasWaterlogAlert || hasHeatAlert || hasCriticalRisk ? (
        <div className="rounded-2xl border border-[#FECDD3] bg-[#FFF1F2] p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert size={18} className="mt-0.5 shrink-0 text-[#E11D48]" />
            <div>
              <h4 className="font-serif text-sm font-bold text-[#9F1239]">
                {hasWaterlogAlert
                  ? t('telemetry.waterloggingAlert')
                  : hasHeatAlert
                  ? t('telemetry.heatAlert')
                  : t('telemetry.criticalRiskAlert')}
              </h4>
              <p className="mt-0.5 text-xs leading-relaxed text-[#9F1239]">
                {risk.waterlogging_alert ||
                  risk.heat_alert ||
                  (isHindi
                    ? 'पूर्वानुमान वर्षा और वर्तमान मिट्टी की स्थिति जलभराव के बढ़े हुए जोखिम का संकेत देती है। वर्षा की परिवर्तनशीलता की भरपाई के लिए केवल सिंचाई नहीं बढ़ाई जानी चाहिए।'
                    : 'Forecast rainfall and current soil conditions indicate elevated waterlogging risk. Irrigation should not be increased solely to compensate for rainfall variability.')}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-2 rounded-2xl border border-[#D4E7DC] bg-[#EAF3ED] px-4 py-3 text-xs text-[#2D5A43]">
          <CheckCircle2 size={16} className="shrink-0 text-[#3F7253]" />
          <span className="font-medium">{t('telemetry.acceptableLimitsBanner')}</span>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 8. SIMPLE "WHAT THIS MEANS" SECTION (Environmental Interpretation) */}
      {/* --------------------------------------------------------------------- */}
      <div className="rounded-2xl border border-[#EDE4D5] bg-[#FFFFFF] p-4 shadow-sm space-y-2.5 text-xs">
        <h3 className="font-serif text-sm font-bold text-[#1F2937]">
          {t('telemetry.interpretationTitle')}
        </h3>

        <div className="space-y-2">
          <div className="flex items-start gap-2.5">
            <span className="w-24 shrink-0 text-[10px] uppercase font-bold text-[#6B7280]">
              {t('telemetry.currentLabel')}
            </span>
            <p className="text-[#1F2937]">{currentStatement}</p>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-24 shrink-0 text-[10px] uppercase font-bold text-[#6B7280]">
              {t('telemetry.forecastLabel')}
            </span>
            <p className="text-[#1F2937]">{forecastStatement}</p>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-24 shrink-0 text-[10px] uppercase font-bold text-[#6B7280]">
              {t('telemetry.implicationLabel')}
            </span>
            <p className="text-[#4B5563]">{implicationStatement}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
