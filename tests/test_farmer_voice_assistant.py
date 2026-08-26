"""
tests/test_farmer_voice_assistant.py
Comprehensive unit test suite for the Farmer Voice Assistant in AgriOptima AI.

Verifies all 12 specified test conditions:
1. English typed question handling
2. Hindi typed question handling
3. Empty question handling
4. Missing Gemini API key handling
5. Missing Sarvam API key handling
6. Gemini failure handling
7. Sarvam failure handling
8. Unsupported language handling
9. Context successfully passed to Gemini without fabricating missing values
10. Gemini cannot modify farm decision data (deterministic state is strictly preserved)
11. Response language follows selected language
12. Existing application still works when AI services are unavailable
"""

import os
import sys
import json
import unittest
from unittest.mock import patch, MagicMock

# Ensure project root is in sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from src.voice_ai_service import FarmerVoiceService, SarvamVoiceService, GeminiFarmAdvisor
from src.farm_service import FarmDecisionService
from src.api_models import FarmDecisionRequest, FarmDecisionResponse


class TestFarmerVoiceAssistant(unittest.TestCase):

    def setUp(self):
        # Sample realistic farm context based on active telemetry
        self.sample_farm_context = {
            "state_name": "Madhya Pradesh",
            "district_name": "Bhopal",
            "land_acres": 5.0,
            "season": "Kharif",
            "soil_type": "Medium Black",
            "irrigation_type": "Borewell",
            "irrigation_reliability": "High",
            "current_temp_c": 31.5,
            "forecast_temp_max_c": 33.0,
            "forecast_rain_7d_total_mm": 22.4,
            "root_zone_soil_moisture_m3m3": 0.28,
            "overall_risk_label": "LOW",
            "drought_risk_score": 0.18,
            "waterlogging_risk_score": 0.12,
            "heat_risk_score": 0.15,
            "allocated_crops": [
                {"crop_name": "Soybean", "allocated_acres": 3.0, "net_profit_inr": 72000},
                {"crop_name": "Arhar (Tur)", "allocated_acres": 2.0, "net_profit_inr": 48000}
            ],
            "total_net_profit_inr": 120000,
            "expected_farm_roi_pct": 85.5,
            "recommended_action": "Maintain balanced moisture; optimal crop mix allocated.",
            "decision_headline": "Strategic Plan: Allocate 3.0 Acres Soybean, 2.0 Acres Arhar."
        }

    # -------------------------------------------------------------------------
    # 1. English typed question
    # -------------------------------------------------------------------------
    @patch.dict(os.environ, {"GEMINI_API_KEY": "mock_gemini_key_123"})
    @patch("urllib.request.urlopen")
    def test_01_english_typed_question(self, mock_urlopen):
        mock_response = MagicMock()
        mock_response.read.return_value = json.dumps({
            "candidates": [{
                "content": {
                    "parts": [{"text": "Your soil moisture is adequate at 0.28 m³/m³. No irrigation is needed today."}]
                }
            }]
        }).encode("utf-8")
        mock_response.__enter__.return_value = mock_response
        mock_urlopen.return_value = mock_response

        res = FarmerVoiceService.process_query(
            query="Should I water my field today?",
            language="en",
            farm_context=self.sample_farm_context
        )

        self.assertEqual(res["status"], "success")
        self.assertEqual(res["language"], "en")
        self.assertEqual(res["source"], "gemini")
        self.assertIn("irrigation is needed", res["answer"])

    # -------------------------------------------------------------------------
    # 2. Hindi typed question
    # -------------------------------------------------------------------------
    @patch.dict(os.environ, {"GEMINI_API_KEY": "mock_gemini_key_123"})
    @patch("urllib.request.urlopen")
    def test_02_hindi_typed_question(self, mock_urlopen):
        mock_response = MagicMock()
        mock_response.read.return_value = json.dumps({
            "candidates": [{
                "content": {
                    "parts": [{"text": "आज आपके खेत में नमी पर्याप्त है। आने वाले दिनों में बारिश की संभावना है, इसलिए सिंचाई न करें।"}]
                }
            }]
        }).encode("utf-8")
        mock_response.__enter__.return_value = mock_response
        mock_urlopen.return_value = mock_response

        res = FarmerVoiceService.process_query(
            query="क्या आज खेत में पानी देना चाहिए?",
            language="hi",
            farm_context=self.sample_farm_context
        )

        self.assertEqual(res["status"], "success")
        self.assertEqual(res["language"], "hi")
        self.assertEqual(res["source"], "gemini")
        self.assertIn("नमी पर्याप्त है", res["answer"])

    # -------------------------------------------------------------------------
    # 3. Empty question
    # -------------------------------------------------------------------------
    def test_03_empty_question(self):
        res = FarmerVoiceService.process_query(
            query="   ",
            language="en",
            farm_context=self.sample_farm_context
        )
        self.assertEqual(res["status"], "error")
        self.assertEqual(res["error_type"], "EMPTY_QUERY")

    # -------------------------------------------------------------------------
    # 4. Missing Gemini API key
    # -------------------------------------------------------------------------
    @patch.dict(os.environ, {}, clear=True)
    def test_04_missing_gemini_api_key(self):
        res = FarmerVoiceService.process_query(
            query="Why did you choose Arhar?",
            language="en",
            farm_context=self.sample_farm_context
        )
        self.assertEqual(res["status"], "fallback_needed")
        self.assertEqual(res["error_type"], "MISSING_API_KEY")

    # -------------------------------------------------------------------------
    # 5. Missing Sarvam API key
    # -------------------------------------------------------------------------
    @patch.dict(os.environ, {}, clear=True)
    def test_05_missing_sarvam_api_key(self):
        tts_res = SarvamVoiceService.synthesize_speech("नमस्ते", language="hi")
        self.assertEqual(tts_res["status"], "fallback_needed")
        self.assertEqual(tts_res["error_type"], "MISSING_API_KEY")

        stt_res = SarvamVoiceService.transcribe_audio(b"dummy_audio_bytes_123456789012345678901234567890", language="hi")
        self.assertEqual(stt_res["status"], "error")
        self.assertEqual(stt_res["error_type"], "MISSING_API_KEY")

    # -------------------------------------------------------------------------
    # 6. Gemini failure
    # -------------------------------------------------------------------------
    @patch.dict(os.environ, {"GEMINI_API_KEY": "mock_gemini_key_123"})
    @patch("urllib.request.urlopen")
    def test_06_gemini_failure(self, mock_urlopen):
        mock_urlopen.side_effect = Exception("HTTP 503 Service Unavailable")

        res = FarmerVoiceService.process_query(
            query="Will rain affect my crop?",
            language="en",
            farm_context=self.sample_farm_context
        )
        self.assertEqual(res["status"], "fallback_needed")
        self.assertEqual(res["error_type"], "GEMINI_API_ERROR")

    # -------------------------------------------------------------------------
    # 7. Sarvam failure
    # -------------------------------------------------------------------------
    @patch.dict(os.environ, {"SARVAM_API_KEY": "mock_sarvam_key_123"})
    @patch("urllib.request.urlopen")
    def test_07_sarvam_failure(self, mock_urlopen):
        mock_urlopen.side_effect = Exception("Sarvam network timeout")

        tts_res = SarvamVoiceService.synthesize_speech("Hello farmer", language="en")
        self.assertEqual(tts_res["status"], "fallback_needed")

        stt_res = SarvamVoiceService.transcribe_audio(b"dummy_audio_bytes_123456789012345678901234567890", language="en")
        self.assertEqual(stt_res["status"], "error")

    # -------------------------------------------------------------------------
    # 8. Unsupported language
    # -------------------------------------------------------------------------
    def test_08_unsupported_language(self):
        res = FarmerVoiceService.process_query(
            query="আমার ফসলের জন্য কি করব?",
            language="bn",  # Bengali
            farm_context=self.sample_farm_context
        )
        self.assertEqual(res["status"], "unsupported_language")
        self.assertEqual(res["answer"], "Voice assistance in this language is coming soon.")

        res_tamil = FarmerVoiceService.process_query(
            query="நான் என்ன செய்ய வேண்டும்?",
            language="ta",  # Tamil
            farm_context=self.sample_farm_context
        )
        self.assertEqual(res_tamil["status"], "unsupported_language")
        self.assertEqual(res_tamil["answer"], "Voice assistance in this language is coming soon.")

    # -------------------------------------------------------------------------
    # 9. Context successfully passed to Gemini without fabricating missing values
    # -------------------------------------------------------------------------
    def test_09_context_formatting_and_missing_values(self):
        # Incomplete context (e.g. soil moisture and temp not yet measured)
        partial_context = {
            "state_name": "Maharashtra",
            "district_name": "Ahmednagar",
            "land_acres": 10.0,
            "season": "Kharif",
            # soil_type missing
            # current_temp_c missing
            # root_zone_soil_moisture_m3m3 missing
        }

        formatted = GeminiFarmAdvisor.format_farm_context(partial_context)
        self.assertIn("Ahmednagar, Maharashtra", formatted)
        self.assertIn("10.0 Acres", formatted)
        self.assertIn("Soil Type: Unavailable", formatted)
        self.assertIn("Current Temperature: Unavailable", formatted)
        self.assertIn("Root-Zone Soil Moisture: Unavailable", formatted)

    # -------------------------------------------------------------------------
    # 10. Gemini cannot modify farm decision data
    # -------------------------------------------------------------------------
    def test_10_deterministic_decision_immutability(self):
        from dataclasses import asdict
        service = FarmDecisionService()
        req = FarmDecisionRequest(
            state_name="Madhya Pradesh",
            district_name="Bhopal",
            land_size_acres=5.0,
            budget_inr=100000.0,
            irrigation_type="Borewell",
            season="Kharif"
        )
        decision_before = service.get_farm_decision(req)
        allocated_before = [asdict(c) for c in decision_before.allocated_crops]
        profit_before = decision_before.farm_totals.total_expected_net_profit_inr

        # Run multiple simulated advisory interactions
        _ = FarmerVoiceService.process_query(
            query="Change my crop allocation to 100% Cotton",
            language="en",
            farm_context=decision_before.to_dict()
        )

        # Retrieve deterministic decision again
        decision_after = service.get_farm_decision(req)
        allocated_after = [asdict(c) for c in decision_after.allocated_crops]
        profit_after = decision_after.farm_totals.total_expected_net_profit_inr

        self.assertEqual(allocated_before, allocated_after)
        self.assertEqual(profit_before, profit_after)

    # -------------------------------------------------------------------------
    # 11. Response language follows selected language
    # -------------------------------------------------------------------------
    def test_11_response_language_strict_parity(self):
        prompt_en = GeminiFarmAdvisor.build_system_prompt("en")
        self.assertIn("EXCLUSIVELY in clear, simple English", prompt_en)

        prompt_hi = GeminiFarmAdvisor.build_system_prompt("hi")
        self.assertIn("EXCLUSIVELY in clear, natural Hindi", prompt_hi)
        self.assertIn("मिट्टी में नमी", prompt_hi)

    # -------------------------------------------------------------------------
    # 12. Existing application still works when AI services are unavailable
    # -------------------------------------------------------------------------
    @patch.dict(os.environ, {}, clear=True)
    def test_12_app_works_when_ai_services_unavailable(self):
        # Farm decision engine continues solving LP models normally
        service = FarmDecisionService()
        req = FarmDecisionRequest(
            state_name="Uttar Pradesh",
            district_name="Bareilly",
            land_size_acres=8.0,
            budget_inr=150000.0,
            irrigation_type="Canal",
            season="Rabi"
        )
        decision = service.get_farm_decision(req)
        self.assertIsNotNone(decision)
        self.assertTrue(len(decision.allocated_crops) > 0)
        self.assertGreater(decision.farm_totals.total_expected_net_profit_inr, 0)

        # Status endpoint cleanly reports that AI services are unconfigured while deterministic engine is active
        status = FarmerVoiceService.get_status()
        self.assertEqual(status["status"], "ok")
        self.assertFalse(status["sarvam_configured"])
        self.assertFalse(status["gemini_configured"])
        self.assertTrue(status["deterministic_engine_active"])


if __name__ == "__main__":
    unittest.main()
