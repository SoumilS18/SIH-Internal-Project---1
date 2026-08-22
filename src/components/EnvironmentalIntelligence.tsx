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
        badge: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
        bar: 'bg-emerald-500',
        text: 'text-emerald-400',
      };
    case 'MODERATE':
      return {
        badge: 'border-gold-400/30 bg-gold-400/10 text-gold-300',
        bar: 'bg-gold-400',
        text: 'text-gold-300',
      };
    case 'HIGH':
      return {
        badge: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
        bar: 'bg-amber-500',
        text: 'text-amber-300',
      };
    case 'CRITICAL':
      return {
        badge: 'border-pink-500/30 bg-pink-500/10 text-pink-300',
        bar: 'bg-pink-500',
        text: 'text-pink-400',
      };
    default:
      return {
        badge: 'border-forest-600/30 bg-forest-900/40 text-cream-200',
        bar: 'bg-forest-400',
        text: 'text-cream-200',
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
    <div className="space-y-4">
      {/* --------------------------------------------------------------------- */}
      {/* 1. PAGE HEADER */}
      {/* --------------------------------------------------------------------- */}
      <div className="rounded-xl border border-gold-300/20 bg-forest-900/60 p-4 backdrop-blur-sm">
        <h2 className="font-serif text-lg font-bold tracking-wide text-gold-100 sm:text-xl">
          {t('telemetry.title')}
        </h2>
        <p className="mt-1 text-xs text-cream-300/70">
          {t('telemetry.subtitle')}{' '}
          <span className="font-semibold text-gold-300">
            {getDistrictDisplayName(location.district_name, language)},{' '}
            {getStateDisplayName(location.state_name, language)}
          </span>
        </p>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 2. TELEMETRY STATUS STRIP (4 Key Metadata Chips) */}
      {/* --------------------------------------------------------------------- */}
      <div className="grid grid-cols-2 gap-2 rounded-xl border border-gold-300/10 bg-forest-950/80 p-3 sm:grid-cols-4">
        <div>
          <span className="block font-mono text-[9px] uppercase tracking-wider text-cream-300/50">
            {t('telemetry.dataProvider')}
          </span>
          <span className="font-mono text-xs font-semibold text-cream-100">
            {weather.data_provider || 'Open-Meteo & ERA5'}
          </span>
        </div>

        <div>
          <span className="block font-mono text-[9px] uppercase tracking-wider text-cream-300/50">
            {t('telemetry.confidenceScore')}
          </span>
          <span className="font-mono text-xs font-semibold text-emerald-300">
            {translateConfidence(weather.confidence_score, language)}
          </span>
        </div>

        <div>
          <span className="block font-mono text-[9px] uppercase tracking-wider text-cream-300/50">
            {t('telemetry.lastUpdated')}
          </span>
          <span className="font-mono text-xs text-cream-200">
            {weather.weather_timestamp
              ? weather.weather_timestamp.replace('T', ' ').slice(0, 16)
              : isHindi
              ? 'लाइव अवलोकन'
              : 'Live Observation'}
          </span>
        </div>

        <div>
          <span className="block font-mono text-[9px] uppercase tracking-wider text-cream-300/50">
            {t('telemetry.soilStatus')}
          </span>
          <span className="font-mono text-xs font-semibold text-gold-300">
            {translateMoistureStatus(risk.soil_moisture_status, language)}
          </span>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 3. CURRENT ENVIRONMENTAL CONDITIONS (5 Primary Metrics Grid) */}
      {/* --------------------------------------------------------------------- */}
      <div className="rounded-xl border border-gold-300/15 bg-forest-900/40 p-4 backdrop-blur-sm">
        <h3 className="mb-3 font-serif text-sm font-semibold text-gold-100">
          {t('telemetry.currentConditions')}
        </h3>

        <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
          {/* Temperature */}
          <div className="rounded-lg border border-gold-300/10 bg-forest-950/60 p-3">
            <div className="flex items-center gap-1.5 text-amber-300">
              <Thermometer size={14} />
              <span className="font-mono text-[10px] uppercase text-cream-300/60">
                {t('telemetry.temperature')}
              </span>
            </div>
            <div className="mt-1.5 font-serif text-lg font-bold text-cream-100">
              {formatTemperature(weather.current_temperature_c, language)}
            </div>
          </div>

          {/* Humidity */}
          <div className="rounded-lg border border-gold-300/10 bg-forest-950/60 p-3">
            <div className="flex items-center gap-1.5 text-emerald-300">
              <Droplets size={14} />
              <span className="font-mono text-[10px] uppercase text-cream-300/60">
                {t('telemetry.humidity')}
              </span>
            </div>
            <div className="mt-1.5 font-serif text-lg font-bold text-cream-100">
              {weather.current_humidity_pct !== null ? `${weather.current_humidity_pct}%` : '73%'}
            </div>
          </div>

          {/* Wind Velocity */}
          <div className="rounded-lg border border-gold-300/10 bg-forest-950/60 p-3">
            <div className="flex items-center gap-1.5 text-cream-200">
              <Wind size={14} />
              <span className="font-mono text-[10px] uppercase text-cream-300/60">
                {t('telemetry.wind')}
              </span>
            </div>
            <div className="mt-1.5 font-serif text-lg font-bold text-cream-100">
              {formatWind(weather.current_wind_kmh, language)}
            </div>
          </div>

          {/* Precipitation */}
          <div className="rounded-lg border border-gold-300/10 bg-forest-950/60 p-3">
            <div className="flex items-center gap-1.5 text-blue-300">
              <CloudRain size={14} />
              <span className="font-mono text-[10px] uppercase text-cream-300/60">
                {t('telemetry.rainfall')}
              </span>
            </div>
            <div className="mt-1.5 font-serif text-lg font-bold text-blue-200">
              {formatRainfall(weather.current_precipitation_mm, language)}
            </div>
          </div>

          {/* VPD */}
          <div className="rounded-lg border border-gold-300/10 bg-forest-950/60 p-3">
            <div className="flex items-center gap-1.5 text-gold-300">
              <Activity size={14} />
              <span className="font-mono text-[10px] uppercase text-cream-300/60">
                {t('telemetry.vpd')}
              </span>
            </div>
            <div className="mt-1.5 font-serif text-lg font-bold text-gold-200">
              {formatVpd(weather.vapour_pressure_deficit_kpa)}
            </div>
          </div>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 4. SOIL MOISTURE SECTION (Visual Centerpiece) */}
      {/* --------------------------------------------------------------------- */}
      <div className="rounded-xl border border-gold-300/20 bg-forest-900/60 p-5 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gold-300/10 pb-3">
          <h3 className="font-serif text-base font-semibold text-cream-100">
            {t('telemetry.rootZoneTitle')}
          </h3>
          <span className="rounded-full border border-gold-300/30 bg-gold-300/10 px-3 py-0.5 font-mono text-[11px] font-semibold text-gold-200">
            {translateMoistureStatus(risk.soil_moisture_status, language)}
          </span>
        </div>

        {/* Moisture Metrics Row */}
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-lg border border-gold-300/10 bg-forest-950/70 p-3.5">
            <span className="block font-mono text-[10px] uppercase text-cream-300/60">
              {t('telemetry.surfaceSoilMoisture')}
            </span>
            <div className="mt-1 font-serif text-xl font-bold text-cream-100">
              {formatSoilMoisture(weather.surface_soil_moisture_m3m3)}
            </div>
          </div>

          <div className="rounded-lg border border-gold-300/15 bg-forest-950/70 p-3.5">
            <span className="block font-mono text-[10px] uppercase text-cream-300/60">
              {t('telemetry.rootZoneSoilMoisture')}
            </span>
            <div className="mt-1 font-serif text-xl font-bold text-gold-200">
              {formatSoilMoisture(weather.root_zone_soil_moisture_m3m3)}
            </div>
          </div>
        </div>

        {/* Continuous Horizontal Moisture Gauge */}
        <div className="mt-5">
          <div className="mb-2 flex justify-between font-mono text-[10px] text-cream-300/60">
            <span>{t('telemetry.distributionScale')}</span>
            <span className="text-gold-300 font-semibold">
              {t('telemetry.current')}: {formatSoilMoisture(weather.root_zone_soil_moisture_m3m3 ?? 0.468)}
            </span>
          </div>

          <div className="relative">
            {/* Multi-tier Gradient Bar */}
            <div className="flex h-3.5 w-full overflow-hidden rounded-full border border-gold-300/20 bg-forest-950 p-[1px]">
              <div className="w-1/4 bg-amber-600/70 border-r border-forest-950" title="Dry" />
              <div className="w-1/4 bg-amber-400/80 border-r border-forest-950" title="Deficit" />
              <div className="w-1/4 bg-emerald-500/90 border-r border-forest-950" title="Optimal" />
              <div className="w-1/4 bg-blue-500/90" title="Saturated" />
            </div>

            {/* Dynamic Marker Pointer */}
            <div
              className="absolute -top-1 -bottom-1 -translate-x-1/2 flex flex-col items-center pointer-events-none transition-all duration-500"
              style={{ left: `${gaugePercent}%` }}
            >
              <div className="h-5 w-1 rounded-full bg-cream-100 shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
            </div>
          </div>

          {/* Scale Labels */}
          <div className="mt-2 grid grid-cols-4 text-center font-mono text-[10px]">
            <span className="text-amber-400">{t('telemetry.dry')}</span>
            <span className="text-amber-300">{t('telemetry.deficit')}</span>
            <span className="text-emerald-400 font-semibold">{t('telemetry.optimal')}</span>
            <span className="text-blue-400">{t('telemetry.saturated')}</span>
          </div>
        </div>

        {/* Soil Type & Explanation */}
        <div className="mt-4 rounded-lg bg-forest-950/60 p-3 text-xs">
          <div className="font-mono text-[11px] font-semibold text-gold-300">
            {t('telemetry.soilType')}: {location.major_soil_type || 'Medium Black Soil'}
          </div>
          <p className="mt-1 leading-relaxed text-cream-200/80">
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
      <div className="rounded-xl border border-gold-300/15 bg-forest-900/40 p-4 backdrop-blur-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-gold-300/10 pb-3">
          <h3 className="font-serif text-sm font-semibold text-cream-100">
            {t('telemetry.forecast7dTitle')}
          </h3>

          <div className="flex items-center gap-3 font-mono text-xs">
            <div className="text-right">
              <span className="block text-[9px] uppercase text-cream-300/50">
                {t('telemetry.forecastRainfall7d')}
              </span>
              <span className="font-bold text-blue-200">
                {formatRainfall(weather.forecast_rain_7d_total_mm, language)}
              </span>
            </div>

            <div className="border-l border-gold-300/10 pl-3 text-right">
              <span className="block text-[9px] uppercase text-cream-300/50">
                {t('telemetry.peakRainProb')}
              </span>
              <span className="font-bold text-gold-300">
                {weather.max_rain_probability_7d_pct ?? 95}%
              </span>
            </div>
          </div>
        </div>

        {/* Trajectory Daily Cards */}
        {series.length > 0 ? (
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-7">
            {series.map((day) => (
              <div
                key={day.date}
                className="rounded-lg border border-gold-300/10 bg-forest-950/70 p-2.5 text-center text-xs transition-colors hover:border-gold-300/30"
              >
                <span className="block font-mono text-[10px] text-cream-300/50">
                  {day.date.slice(5)}
                </span>
                <span className="mt-1 block font-serif text-sm font-bold text-cream-100">
                  {day.t_max.toFixed(0)}° / {day.t_min.toFixed(0)}°
                </span>
                <div className="mt-1.5 flex items-center justify-center gap-1 font-mono text-[11px] text-blue-300">
                  <Droplets size={10} />
                  <span>{formatRainfall(day.rain_mm, language)}</span>
                </div>
                <span className="mt-0.5 block font-mono text-[9px] text-cream-300/50">
                  {day.rain_prob}% {t('telemetry.rain')}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-xs text-cream-300/60">
            {isHindi
              ? 'दैनिक संख्यात्मक मौसम प्रक्षेपवक्र अनुपलब्ध है।'
              : 'Daily numerical weather trajectory unavailable.'}
          </p>
        )}

        {/* Trajectory Direction Footer */}
        <div className="mt-3 flex items-center gap-2 rounded-lg bg-forest-950/50 px-3 py-2 text-xs text-cream-300/80">
          <Info size={13} className="shrink-0 text-gold-300" />
          <span>{weatherTrend}</span>
        </div>
      </div>

      {/* --------------------------------------------------------------------- */}
      {/* 6. ENVIRONMENTAL RISK (4 Horizontal Risk Indicators) */}
      {/* --------------------------------------------------------------------- */}
      <div className="rounded-xl border border-gold-300/15 bg-forest-900/40 p-4 backdrop-blur-sm">
        <h3 className="mb-3 font-serif text-sm font-semibold text-cream-100">
          {t('telemetry.environmentalRisk')}
        </h3>

        <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
          {/* Drought Risk */}
          <div className="rounded-lg border border-gold-300/10 bg-forest-950/70 p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-cream-200">
                {t('telemetry.droughtRisk')}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold ${
                    getRiskColorClass(risk.drought_risk_label).badge
                  }`}
                >
                  {translateRiskLevel(risk.drought_risk_label, language)}
                </span>
                <span className="font-mono text-xs font-bold text-cream-100">
                  {risk.drought_risk_score.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-forest-900 overflow-hidden">
              <div
                className={`h-full rounded-full ${getRiskColorClass(risk.drought_risk_label).bar}`}
                style={{ width: `${Math.min(100, risk.drought_risk_score * 100)}%` }}
              />
            </div>
          </div>

          {/* Waterlogging Risk */}
          <div className="rounded-lg border border-gold-300/10 bg-forest-950/70 p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-cream-200">
                {t('telemetry.waterloggingRisk')}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold ${
                    getRiskColorClass(risk.waterlogging_risk_label).badge
                  }`}
                >
                  {translateRiskLevel(risk.waterlogging_risk_label, language)}
                </span>
                <span className="font-mono text-xs font-bold text-cream-100">
                  {risk.waterlogging_risk_score.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-forest-900 overflow-hidden">
              <div
                className={`h-full rounded-full ${getRiskColorClass(risk.waterlogging_risk_label).bar}`}
                style={{ width: `${Math.min(100, risk.waterlogging_risk_score * 100)}%` }}
              />
            </div>
          </div>

          {/* Heat Risk */}
          <div className="rounded-lg border border-gold-300/10 bg-forest-950/70 p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-cream-200">
                {t('telemetry.heatRisk')}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold ${
                    getRiskColorClass(risk.heat_risk_label).badge
                  }`}
                >
                  {translateRiskLevel(risk.heat_risk_label, language)}
                </span>
                <span className="font-mono text-xs font-bold text-cream-100">
                  {risk.heat_risk_score.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-forest-900 overflow-hidden">
              <div
                className={`h-full rounded-full ${getRiskColorClass(risk.heat_risk_label).bar}`}
                style={{ width: `${Math.min(100, risk.heat_risk_score * 100)}%` }}
              />
            </div>
          </div>

          {/* Atmospheric Water Stress */}
          <div className="rounded-lg border border-gold-300/10 bg-forest-950/70 p-3">
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs text-cream-200">
                {t('telemetry.atmosphericWaterStress')}
              </span>
              <div className="flex items-center gap-2">
                <span
                  className={`rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold ${
                    getRiskColorClass(risk.atmospheric_water_stress_label).badge
                  }`}
                >
                  {translateRiskLevel(risk.atmospheric_water_stress_label, language)}
                </span>
                <span className="font-mono text-xs font-bold text-cream-100">
                  {risk.atmospheric_water_stress_score.toFixed(2)}
                </span>
              </div>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-forest-900 overflow-hidden">
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
        <div className="rounded-xl border border-pink-500/40 bg-pink-950/40 p-4">
          <div className="flex items-start gap-3">
            <ShieldAlert size={18} className="mt-0.5 shrink-0 text-pink-400" />
            <div>
              <h4 className="font-serif text-sm font-semibold tracking-wide text-pink-200">
                {hasWaterlogAlert
                  ? t('telemetry.waterloggingAlert')
                  : hasHeatAlert
                  ? t('telemetry.heatAlert')
                  : t('telemetry.criticalRiskAlert')}
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-pink-100/90">
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
        <div className="flex items-center gap-2 rounded-xl border border-forest-600/30 bg-forest-950/60 px-4 py-3 text-xs text-forest-300">
          <CheckCircle2 size={16} className="shrink-0 text-forest-400" />
          <span>{t('telemetry.acceptableLimitsBanner')}</span>
        </div>
      )}

      {/* --------------------------------------------------------------------- */}
      {/* 8. SIMPLE "WHAT THIS MEANS" SECTION (Environmental Interpretation) */}
      {/* --------------------------------------------------------------------- */}
      <div className="rounded-xl border border-gold-300/15 bg-forest-900/50 p-4 backdrop-blur-sm">
        <h3 className="mb-3 font-serif text-sm font-semibold text-gold-100">
          {t('telemetry.interpretationTitle')}
        </h3>

        <div className="space-y-2.5 text-xs">
          <div className="flex items-start gap-2.5">
            <span className="w-24 shrink-0 font-mono text-[10px] uppercase tracking-wider text-gold-300/70">
              {t('telemetry.currentLabel')}
            </span>
            <p className="text-cream-100">{currentStatement}</p>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-24 shrink-0 font-mono text-[10px] uppercase tracking-wider text-gold-300/70">
              {t('telemetry.forecastLabel')}
            </span>
            <p className="text-cream-100">{forecastStatement}</p>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-24 shrink-0 font-mono text-[10px] uppercase tracking-wider text-gold-300/70">
              {t('telemetry.implicationLabel')}
            </span>
            <p className="text-cream-200/90">{implicationStatement}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
