"""
src/voice_ai_service.py
Dedicated Voice & AI Communication Layer for AgriOptima AI (USICT038).

Architectural Invariant:
- Deterministic optimization (LP solver, risk engine, weather data) is the sole source of truth.
- Gemini AI acts strictly as a Farm Advisory Communication Layer: explaining existing decisions
  in simple, concise, farmer-friendly language (1-3 short sentences) in English or Hindi.
- Gemini CANNOT modify crop allocations, budgets, risk scores, weather values, or farm state.
- Sarvam AI handles Speech-to-Text (Saarika model) and Text-to-Speech (Bulbul model).
"""

import os
import json
import base64
import urllib.request
import urllib.error
from typing import Dict, Any, List, Optional, Tuple


def _load_env_defaults():
    """Populates os.environ with key-values from .env if not already present."""
    try:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        root_dir = os.path.dirname(current_dir)
        env_paths = [os.path.join(root_dir, ".env"), os.path.join(current_dir, ".env"), ".env"]
        for p in env_paths:
            if os.path.isfile(p):
                with open(p, "r", encoding="utf-8") as f:
                    for line in f:
                        line = line.strip()
                        if line and not line.startswith("#") and "=" in line:
                            k, v = line.split("=", 1)
                            k = k.strip()
                            v = v.strip().strip('"').strip("'")
                            if k and k not in os.environ:
                                os.environ[k] = v
    except Exception:
        pass

_load_env_defaults()


def get_env_var(name: str, default: str = "") -> str:
    """Helper to get an environment variable safely from os.environ."""
    val = os.environ.get(name, default)
    return val.strip() if val else default


class SarvamVoiceService:
    """
    Handles Sarvam AI Speech-to-Text (Saarika) and Text-to-Speech (Bulbul).
    """

    STT_URL = "https://api.sarvam.ai/speech-to-text"
    TTS_URL = "https://api.sarvam.ai/text-to-speech"

    @classmethod
    def get_api_key(cls) -> str:
        return get_env_var("SARVAM_API_KEY")

    @classmethod
    def is_configured(cls) -> bool:
        return bool(cls.get_api_key())

    @classmethod
    def transcribe_audio(cls, audio_bytes: bytes, language: str = "hi") -> Dict[str, Any]:
        """
        Converts audio bytes to text using Sarvam Saarika STT API.
        Supported languages: 'hi' (hi-IN), 'en' (en-IN).
        """
        api_key = cls.get_api_key()
        if not api_key:
            return {
                "status": "error",
                "error_type": "MISSING_API_KEY",
                "message": "SARVAM_API_KEY is not configured on server."
            }

        if not audio_bytes or len(audio_bytes) < 100:
            return {
                "status": "error",
                "error_type": "EMPTY_AUDIO",
                "message": "Empty or invalid audio data provided."
            }

        lang_code = "hi-IN" if language in ("hi", "hi-IN") else "en-IN"
        boundary = "----WebKitFormBoundaryAgriOptimaVoiceSTT"

        body_parts = [
            f"--{boundary}\r\n".encode("utf-8"),
            b'Content-Disposition: form-data; name="file"; filename="audio.webm"\r\n',
            b'Content-Type: audio/webm\r\n\r\n',
            audio_bytes,
            f"\r\n--{boundary}\r\n".encode("utf-8"),
            b'Content-Disposition: form-data; name="model"\r\n\r\n',
            b"saarika:v2.5\r\n",
            f"--{boundary}\r\n".encode("utf-8"),
            b'Content-Disposition: form-data; name="language_code"\r\n\r\n',
            f"{lang_code}\r\n".encode("utf-8"),
            f"--{boundary}--\r\n".encode("utf-8"),
        ]
        full_body = b"".join(body_parts)

        req = urllib.request.Request(
            cls.STT_URL,
            data=full_body,
            headers={
                "api-subscription-key": api_key,
                "Content-Type": f"multipart/form-data; boundary={boundary}"
            },
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=12) as resp:
                resp_data = json.loads(resp.read().decode("utf-8"))
                transcript = resp_data.get("transcript", "").strip()
                detected_lang = resp_data.get("language_code", lang_code)
                return {
                    "status": "success",
                    "transcript": transcript,
                    "language_code": detected_lang
                }
        except urllib.error.HTTPError as he:
            err_body = he.read().decode("utf-8", errors="replace") if hasattr(he, "read") else str(he)
            return {
                "status": "error",
                "error_type": "SARVAM_HTTP_ERROR",
                "status_code": he.code,
                "message": f"Sarvam STT HTTP Error {he.code}: {err_body}"
            }
        except Exception as ex:
            return {
                "status": "error",
                "error_type": "SARVAM_CONNECTION_ERROR",
                "message": f"Failed to connect to Sarvam STT: {str(ex)}"
            }

    @classmethod
    def synthesize_speech(cls, text: str, language: str = "hi", speaker: str = "anushka") -> Dict[str, Any]:
        """
        Converts text to speech audio WAV using Sarvam Bulbul TTS API.
        Supported languages: 'hi' (hi-IN), 'en' (en-IN).
        """
        api_key = cls.get_api_key()
        if not api_key:
            return {
                "status": "fallback_needed",
                "error_type": "MISSING_API_KEY",
                "message": "SARVAM_API_KEY is not configured on server."
            }

        clean_text = (text or "").strip()
        if not clean_text:
            return {
                "status": "error",
                "error_type": "EMPTY_TEXT",
                "message": "No text provided for speech synthesis."
            }

        # Truncate text to 1000 characters max for TTS prompt safety
        target_code = "hi-IN" if language in ("hi", "hi-IN") else "en-IN"
        valid_speakers = ["anushka", "aditya", "priya", "neha", "rahul", "pooja", "rohan", "kavya", "amit", "dev"]
        selected_speaker = speaker if speaker in valid_speakers else "anushka"

        sarvam_payload = {
            "inputs": [clean_text[:1000]],
            "target_language_code": target_code,
            "speaker": selected_speaker,
            "pitch": 0,
            "pace": 1.0,
            "loudness": 1.5,
            "speech_sample_rate": 8000,
            "enable_preprocessing": True,
            "model": "bulbul:v2"
        }

        req = urllib.request.Request(
            cls.TTS_URL,
            data=json.dumps(sarvam_payload).encode("utf-8"),
            headers={
                "api-subscription-key": api_key,
                "Content-Type": "application/json"
            },
            method="POST"
        )

        try:
            with urllib.request.urlopen(req, timeout=10) as resp:
                resp_data = json.loads(resp.read().decode("utf-8"))
                audios = resp_data.get("audios", [])
                if audios:
                    return {
                        "status": "success",
                        "audio_base64": audios[0],
                        "format": "audio/wav",
                        "language": target_code
                    }
                return {
                    "status": "fallback_needed",
                    "error_type": "NO_AUDIO_RETURNED",
                    "message": "Sarvam did not return audio."
                }
        except urllib.error.HTTPError as he:
            err_body = he.read().decode("utf-8", errors="replace") if hasattr(he, "read") else str(he)
            return {
                "status": "fallback_needed",
                "error_type": "SARVAM_HTTP_ERROR",
                "status_code": he.code,
                "message": f"Sarvam TTS HTTP Error {he.code}: {err_body}"
            }
        except Exception as ex:
            return {
                "status": "fallback_needed",
                "error_type": "SARVAM_CONNECTION_ERROR",
                "message": f"Sarvam TTS connection error: {str(ex)}"
            }


class GeminiFarmAdvisor:
    """
    Communicates with Google Gemini API as the Farm Advisory Communication Layer.
    Translates deterministic system metrics into simple, concise, farmer-friendly advice.
    """

    GEMINI_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models"

    @classmethod
    def get_api_key(cls) -> str:
        return get_env_var("GEMINI_API_KEY")

    @classmethod
    def get_model_name(cls) -> str:
        return get_env_var("GEMINI_MODEL", "gemini-2.5-flash")

    @classmethod
    def is_configured(cls) -> bool:
        return bool(cls.get_api_key())

    @classmethod
    def build_system_prompt(cls, language: str) -> str:
        """
        Builds comprehensive, logically grounded system guardrail instructions for Gemini.
        """
        is_hindi = language in ("hi", "hi-IN")
        if is_hindi:
            language_rule = "1. OUTPUT LANGUAGE: You MUST respond EXCLUSIVELY in clear, natural Hindi using Devanagari script (हिन्दी). Absolutely DO NOT use English sentences or Latin script."
            vocab_rule = """4. VOCABULARY & TONE:
   - Use warm, respectful, farmer-friendly Hindi vocabulary (e.g. "किसान भाई", "खेत की तैयारी", "खाद", "दवा/कीटनाशक", "नमी", "बुवाई").
   - Avoid bureaucratic or academic jargon (e.g. say "मिट्टी में नमी" instead of "volumetric water content index")."""
            irrelevant_reply = "'मैं आपके खेत, फसलों, मौसम, सिंचाई, खाद-दवा और कृषि निर्णयों के बारे में मदद कर सकता हूँ।'"
        else:
            language_rule = "1. OUTPUT LANGUAGE: You MUST respond EXCLUSIVELY in clear, simple English. Absolutely DO NOT use Hindi or Devanagari script under any circumstances."
            vocab_rule = """4. VOCABULARY & TONE:
   - Use warm, clear, farmer-friendly English (e.g. "field preparation", "compost/fertilizer", "seed treatment", "soil moisture", "sowing").
   - Absolutely DO NOT include any Hindi words or Devanagari script."""
            irrelevant_reply = "'I am your farm advisor and can assist you with your crops, weather, soil, fertilizers, irrigation, and agricultural decisions.'"

        return f"""You are the AgriOptima AI Farm Advisory & Agronomy Assistant.
Your mission is to serve as a trustworthy, practical, and highly knowledgeable agricultural advisor for Indian farmers, explaining their personalized farm decision plan and providing logical, scientifically sound farming advice.

STRICT OPERATIONAL RULES:
{language_rule}

2. DUAL-TIER REASONING & ALIGNMENT:
   - TIER 1 (FARM PLAN GROUND TRUTH): When the farmer asks about their specific farm plan numbers (location, soil moisture, 7-day rainfall forecast, temperature, allocated crops, expected profits, or risk scores):
     * Strictly use the metrics provided in the CURRENT REAL FARM CONTEXT.
     * Never contradict or invent different acreage, profit, or weather numbers.
   - TIER 2 (GENERAL AGRONOMY & LOGICAL REASONING): When the farmer asks broader agricultural, agronomic, or practical farming questions (e.g. fertilizer dosage & timing, seed treatment, pest & disease management, organic remedies, irrigation methods, intercropping benefits, crop care, harvesting techniques, storage tips, market readiness, weather adaptation):
     * Answer helpfully, logically, and accurately using established agricultural science and Indian farming best practices (ICAR / KVK standards).
     * Always tailor your advice logically to the farmer's region (State/District), soil type, season, and allocated crops from the context!
     * NEVER refuse legitimate agricultural, crop care, soil, weather, or farming questions.

3. CRISPNESS, BREVITY & COMPLETENESS:
   - Keep answers concise, crisp, and direct: approximately 2 to 4 short sentences (about 45 to 80 words).
   - Avoid lengthy essays, long introductory preambles, or large bullet lists.
   - State the core insight directly and conclude smoothly so the response is fast to read and pleasant to hear over audio.

{vocab_rule}

5. IRRELEVANT / NON-FARMING TOPICS:
   - If the user asks about completely non-agricultural topics unrelated to farming, rural life, weather, soil, or crops (e.g. movies, coding, politics, video games), politely reply: {irrelevant_reply}

6. CONTINUITY:
   - If conversation history is provided, maintain context and understand pronouns or references to previously discussed crops or topics."""

    @classmethod
    def format_farm_context(cls, context_dict: Optional[Dict[str, Any]]) -> str:
        """
        Formats real active application state into a rich structured block for Gemini.
        """
        if not context_dict:
            return "FARM CONTEXT: Farm details not yet initialized."

        lines = ["=== CURRENT REAL FARM CONTEXT (Ground Truth) ==="]

        # Location & Farm basics
        state = context_dict.get("state_name") or "Unavailable"
        district = context_dict.get("district_name") or "Unavailable"
        land_acres = context_dict.get("land_acres")
        land_str = f"{land_acres} Acres" if land_acres is not None else "Unavailable"
        season = context_dict.get("season") or "Unavailable"
        soil_type = context_dict.get("soil_type") or "Unavailable"
        irrigation_type = context_dict.get("irrigation_type") or "Unavailable"
        irrigation_rel = context_dict.get("irrigation_reliability") or "Unavailable"
        budget = context_dict.get("budget_inr")
        budget_str = f"₹{budget:,.0f}" if budget is not None else "Standard Farm Budget"

        lines.append(f"- Location: {district}, {state}")
        lines.append(f"- Total Land Size: {land_str} | Capital Budget: {budget_str}")
        lines.append(f"- Season: {season} | Soil Type: {soil_type}")
        lines.append(f"- Irrigation Infrastructure: {irrigation_type} ({irrigation_rel} reliability)")

        # Weather & Soil Telemetry
        temp = context_dict.get("current_temp_c")
        temp_str = f"{temp}°C" if temp is not None else "Unavailable"
        max_temp = context_dict.get("forecast_temp_max_c")
        max_temp_str = f"{max_temp}°C" if max_temp is not None else "Unavailable"
        rain_7d = context_dict.get("forecast_rain_7d_total_mm")
        rain_str = f"{rain_7d} mm" if rain_7d is not None else "Unavailable"
        soil_moisture = context_dict.get("root_zone_soil_moisture_m3m3")
        sm_str = f"{soil_moisture:.3f} m³/m³" if (soil_moisture is not None and isinstance(soil_moisture, (int, float))) else "Unavailable"

        lines.append(f"- Current Temperature: {temp_str} (Forecast Max: {max_temp_str})")
        lines.append(f"- 7-Day Rainfall Forecast: {rain_str}")
        lines.append(f"- Root-Zone Soil Moisture: {sm_str}")

        # Risk Engine Output
        overall_risk = context_dict.get("overall_risk_label") or "Unavailable"
        drought_score = context_dict.get("drought_risk_score")
        drought_str = f"{drought_score:.2f}" if drought_score is not None else "Unavailable"
        waterlog_score = context_dict.get("waterlogging_risk_score")
        waterlog_str = f"{waterlog_score:.2f}" if waterlog_score is not None else "Unavailable"
        heat_score = context_dict.get("heat_risk_score")
        heat_str = f"{heat_score:.2f}" if heat_score is not None else "Unavailable"

        lines.append(f"- Overall Farm Risk: {overall_risk}")
        lines.append(f"- Specific Risk Scores (0=Low, 1=High): Drought={drought_str}, Waterlogging={waterlog_str}, Heat Stress={heat_str}")

        # Allocated Crops from Optimizer
        allocated_crops = context_dict.get("allocated_crops", [])
        if allocated_crops:
            crop_strs = []
            for c in allocated_crops:
                name = c.get("crop_name", "Crop")
                acres = c.get("allocated_acres", 0)
                profit = c.get("net_profit_inr", 0)
                crop_strs.append(f"{acres} Acres {name} (Net Profit ₹{profit:,.0f})")
            lines.append(f"- Optimal Crop Plan Chosen: {', '.join(crop_strs)}")
        else:
            lines.append("- Optimal Crop Plan: No crops allocated (Fallow / Capital constrained)")

        # Candidate Crops Considered
        candidate_crops = context_dict.get("candidate_crops", [])
        if candidate_crops:
            cand_names = [c.get("crop_name", "") for c in candidate_crops[:5] if c.get("crop_name")]
            if cand_names:
                lines.append(f"- Other Suitable Crops Evaluated for this Region: {', '.join(cand_names)}")

        # Total Net Profit & ROI
        net_profit = context_dict.get("total_net_profit_inr")
        if net_profit is not None:
            lines.append(f"- Total Expected Net Profit from Plan: ₹{net_profit:,.0f}")
        roi = context_dict.get("expected_farm_roi_pct")
        if roi is not None:
            lines.append(f"- Expected Farm ROI: +{roi:.1f}%")

        # Current Recommended Action / Sentinel directive
        rec_action = context_dict.get("recommended_action")
        if rec_action:
            lines.append(f"- Autonomous Recommended Action: {rec_action}")

        # Explanation summary if present
        headline = context_dict.get("decision_headline")
        if headline:
            lines.append(f"- Strategic Decision Rationale: {headline}")

        return "\n".join(lines)

    @classmethod
    def ask_gemini(
        cls,
        query: str,
        language: str = "en",
        farm_context: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        """
        Sends the farmer's question with full farm context and history to Google Gemini API.
        """
        api_key = cls.get_api_key()
        if not api_key:
            return {
                "status": "fallback_needed",
                "error_type": "MISSING_API_KEY",
                "message": "GEMINI_API_KEY is not configured on server."
            }

        clean_query = (query or "").strip()
        if not clean_query:
            return {
                "status": "error",
                "error_type": "EMPTY_QUERY",
                "message": "Question is empty."
            }

        system_instruction = cls.build_system_prompt(language)
        context_text = cls.format_farm_context(farm_context)

        # Build contents list
        contents = []

        # Add conversation history turns if present
        if conversation_history:
            for turn in conversation_history[-4:]:  # last 4 turns for lightweight context
                role = "user" if turn.get("role") in ("user", "farmer") else "model"
                text = turn.get("text", "")
                if text:
                    contents.append({
                        "role": role,
                        "parts": [{"text": text}]
                    })

        # Add current turn with context and query
        current_turn_text = f"{context_text}\n\nFarmer Question: {clean_query}"
        contents.append({
            "role": "user",
            "parts": [{"text": current_turn_text}]
        })

        payload = {
            "system_instruction": {
                "parts": [{"text": system_instruction}]
            },
            "contents": contents,
            "generationConfig": {
                "temperature": 0.3,
                "topP": 0.9,
                "maxOutputTokens": 1200
            }
        }

        # Try specified model first, then fallback to current available flash models
        primary_model = cls.get_model_name()
        candidate_models = [primary_model, "gemini-2.5-flash", "gemini-1.5-flash", "gemini-2.0-flash", "gemini-2.5-pro"]
        models_to_try = []
        for m in candidate_models:
            if m not in models_to_try:
                models_to_try.append(m)

        last_error = ""
        for model in models_to_try:
            url = f"{cls.GEMINI_BASE_URL}/{model}:generateContent?key={api_key}"
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )

            try:
                with urllib.request.urlopen(req, timeout=30) as resp:
                    resp_json = json.loads(resp.read().decode("utf-8"))
                    candidates = resp_json.get("candidates", [])
                    if candidates:
                        content_obj = candidates[0].get("content", {})
                        parts = content_obj.get("parts", [])
                        if parts:
                            raw_answer = parts[0].get("text", "").strip()
                            if raw_answer:
                                return {
                                    "status": "success",
                                    "answer": raw_answer,
                                    "language": language,
                                    "model": model,
                                    "source": "gemini"
                                }
            except urllib.error.HTTPError as he:
                err_body = he.read().decode("utf-8", errors="replace") if hasattr(he, "read") else str(he)
                last_error = f"Gemini HTTP {he.code}: {err_body}"
            except Exception as ex:
                last_error = f"Gemini Connection Error: {str(ex)}"

        return {
            "status": "fallback_needed",
            "error_type": "GEMINI_API_ERROR",
            "message": last_error or "Gemini API did not return a valid candidate."
        }


class FarmerVoiceService:
    """
    Unified Voice & Advisory Controller.
    Orchestrates: Farmer Speech -> Sarvam STT -> Gemini Farm Advisor -> Sarvam TTS.
    """

    SUPPORTED_LANGUAGES = ["en", "hi"]

    @classmethod
    def get_status(cls) -> Dict[str, Any]:
        """Returns API readiness status."""
        sarvam_ok = SarvamVoiceService.is_configured()
        gemini_ok = GeminiFarmAdvisor.is_configured()
        return {
            "status": "ok",
            "sarvam_configured": sarvam_ok,
            "gemini_configured": gemini_ok,
            "supported_languages": cls.SUPPORTED_LANGUAGES,
            "deterministic_engine_active": True
        }

    @classmethod
    def process_query(
        cls,
        query: str,
        language: str = "en",
        farm_context: Optional[Dict[str, Any]] = None,
        conversation_history: Optional[List[Dict[str, str]]] = None,
    ) -> Dict[str, Any]:
        """
        Processes a farmer's typed or transcribed question using Gemini AI + real farm context.
        Enforces language constraints and fallback mechanisms.
        """
        clean_query = (query or "").strip()
        if not clean_query:
            return {
                "status": "error",
                "error_type": "EMPTY_QUERY",
                "message": "Please ask a question about your farm."
            }

        # Language Guard: Only 'en' and 'hi' are supported in the first implementation
        if language not in cls.SUPPORTED_LANGUAGES and language not in ("en-IN", "hi-IN"):
            return {
                "status": "unsupported_language",
                "language": language,
                "answer": "Voice assistance in this language is coming soon.",
                "message": "Voice assistance in this language is coming soon."
            }

        effective_lang = "hi" if language in ("hi", "hi-IN") else "en"

        # Ask Gemini Farm Advisor
        gemini_res = GeminiFarmAdvisor.ask_gemini(
            query=clean_query,
            language=effective_lang,
            farm_context=farm_context,
            conversation_history=conversation_history
        )

        if gemini_res.get("status") == "success":
            return {
                "status": "success",
                "answer": gemini_res["answer"],
                "language": effective_lang,
                "source": "gemini",
                "model": gemini_res.get("model", "gemini-1.5-flash")
            }

        # If Gemini is not configured or failed, return fallback_needed signal
        return {
            "status": "fallback_needed",
            "error_type": gemini_res.get("error_type", "GEMINI_UNAVAILABLE"),
            "message": gemini_res.get("message", "Gemini service unavailable. Using deterministic engine."),
            "language": effective_lang
        }
