import sys
import re
import json

sys.stdout.reconfigure(encoding='utf-8')

print("=== 1. VERIFYING TRANSLATION COMPLETENESS & KEY PARITY ===")

def extract_keys(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    keys = {}
    current_section = None
    for line in content.splitlines():
        sec_match = re.match(r'^\s*([a-zA-Z0-9_]+):\s*\{', line)
        if sec_match:
            current_section = sec_match.group(1)
            keys[current_section] = []
            continue
        if current_section:
            key_match = re.match(r'^\s*([a-zA-Z0-9_]+):', line)
            if key_match and line.strip() != '},':
                keys[current_section].append(key_match.group(1))
    return keys

en_keys = extract_keys('src/i18n/translations/en.ts')
hi_keys = extract_keys('src/i18n/translations/hi.ts')

total_en = sum(len(v) for v in en_keys.values())
total_hi = sum(len(v) for v in hi_keys.values())
print(f"Total English Keys: {total_en} across {len(en_keys)} sections")
print(f"Total Hindi Keys:   {total_hi} across {len(hi_keys)} sections")

missing = []
for sec, k_list in en_keys.items():
    hi_k_list = hi_keys.get(sec, [])
    diff = set(k_list) - set(hi_k_list)
    if diff:
        missing.append((sec, diff))

if not missing:
    print("✅ 100% Translation Key Parity verified between English and Hindi!")
else:
    print("❌ Missing keys in Hindi:", missing)
    sys.exit(1)

print("\n=== 2. VERIFYING CROP & DISTRICT LOCALIZATIONS ===")
with open('src/i18n/cropNames.ts', 'r', encoding='utf-8') as f:
    crop_code = f.read()
    assert 'गेहूँ' in crop_code, "Hindi wheat missing"
    assert 'गन्ना' in crop_code, "Hindi sugarcane missing"
    assert 'अरहर' in crop_code, "Hindi pigeonpea missing"
    assert 'मक्का' in crop_code, "Hindi maize missing"
    assert 'सोयाबीन' in crop_code, "Hindi soybean missing"
print("✅ Crop name translations verified!")

with open('src/i18n/districtsHindi.json', 'r', encoding='utf-8') as f:
    districts_hi = json.load(f)
    print(f"Loaded {len(districts_hi)} Hindi district localizations.")
    assert 'bhopal' in districts_hi or 'Bhopal' in [d.get('en') for d in districts_hi.values() if isinstance(d, dict)] or len(districts_hi) > 500
print("✅ Districts catalog verified!")

print("\n=== 3. VERIFYING SEMANTIC ADAPTER & FARMER REASONING ===")
with open('src/i18n/semanticAdapter.ts', 'r', encoding='utf-8') as f:
    semantic_code = f.read()
    assert 'getFarmerRecommendationHeadline' in semantic_code
    assert 'getFarmerWhyCards' in semantic_code
    assert 'getFarmerNextActionSteps' in semantic_code
    assert 'getFarmerRiskPlainDescription' in semantic_code
    assert 'getFarmerVoiceAnswer' in semantic_code
    assert 'getStrategicHeadline' in semantic_code
    assert 'getCausalStepTitle' in semantic_code
print("✅ Semantic adapter functions verified!")

print("\n=== 4. VERIFYING COMPONENT INTEGRATION ===")
with open('src/components/MainScreen.tsx', 'r', encoding='utf-8') as f:
    main_code = f.read()
    assert 'FarmSetupFlow' in main_code
    assert 'FarmerSimpleView' in main_code
    assert 'DetailedAnalysisView' in main_code
    assert 'VoiceAssistantPanel' in main_code
print("✅ MainScreen component architecture verified!")

print("\n🎉 ALL VERIFICATION TESTS PASSED PERFECTLY!")
