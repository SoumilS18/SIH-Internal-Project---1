import { getCropDisplayName } from '@/i18n/cropNames';

export interface DailyAction {
  day: number; // 1 to 7
  dayOfSeason: number;
  title: string;
  desc: string;
  category: 'prep' | 'sowing' | 'irrigation' | 'nutrient' | 'protection' | 'monitoring' | 'harvest';
}

export interface WeekPlan {
  week: number;
  totalWeeks: number;
  stageName: string;
  phaseLabel: string;
  summary: string;
  days: DailyAction[];
}

export const SEASON_WEEKS_COUNT: Record<'Kharif' | 'Rabi' | 'Zaid', number> = {
  Kharif: 18,
  Rabi: 20,
  Zaid: 10,
};

export function getSeasonWeeksCount(season: 'Kharif' | 'Rabi' | 'Zaid'): number {
  return SEASON_WEEKS_COUNT[season] || 18;
}

export type CropCategory = 'vegetable' | 'cereal' | 'pulse' | 'fibre_cane' | 'oilseed' | 'general';

export function detectCropCategory(cropName: string): CropCategory {
  const c = (cropName || '').toLowerCase().trim();
  if (
    c.includes('tomato') ||
    c.includes('टमाटर') ||
    c.includes('potato') ||
    c.includes('आलू') ||
    c.includes('onion') ||
    c.includes('प्याज') ||
    c.includes('chilli') ||
    c.includes('मिर्च') ||
    c.includes('brinjal') ||
    c.includes('बैंगन') ||
    c.includes('vegetable') ||
    c.includes('सब्जी') ||
    c.includes('okra') ||
    c.includes('भिंडी') ||
    c.includes('cucumber') ||
    c.includes('खीरा')
  ) {
    return 'vegetable';
  }

  if (
    c.includes('rice') ||
    c.includes('paddy') ||
    c.includes('चावल') ||
    c.includes('धान') ||
    c.includes('wheat') ||
    c.includes('गेहूँ') ||
    c.includes('maize') ||
    c.includes('corn') ||
    c.includes('मक्का') ||
    c.includes('bajra') ||
    c.includes('बाजरा') ||
    c.includes('jowar') ||
    c.includes('ज्वार') ||
    c.includes('barley') ||
    c.includes('जौ')
  ) {
    return 'cereal';
  }

  if (
    c.includes('gram') ||
    c.includes('chana') ||
    c.includes('चना') ||
    c.includes('soybean') ||
    c.includes('soyabean') ||
    c.includes('सोयाबीन') ||
    c.includes('pigeonpea') ||
    c.includes('arhar') ||
    c.includes('tur') ||
    c.includes('अरहर') ||
    c.includes('moong') ||
    c.includes('mung') ||
    c.includes('मूंग') ||
    c.includes('urad') ||
    c.includes('उड़द') ||
    c.includes('lentil') ||
    c.includes('masoor') ||
    c.includes('मसूर') ||
    c.includes('pulse') ||
    c.includes('दाल')
  ) {
    return 'pulse';
  }

  if (
    c.includes('cotton') ||
    c.includes('कपास') ||
    c.includes('sugarcane') ||
    c.includes('गन्ना')
  ) {
    return 'fibre_cane';
  }

  if (
    c.includes('mustard') ||
    c.includes('सरसों') ||
    c.includes('groundnut') ||
    c.includes('peanut') ||
    c.includes('मूंगफली') ||
    c.includes('sunflower') ||
    c.includes('सूरजमुखी') ||
    c.includes('sesame') ||
    c.includes('तिल')
  ) {
    return 'oilseed';
  }

  return 'general';
}

interface WeekTemplate {
  stage: { en: string; hi: string };
  phase: { en: string; hi: string };
  summary: { en: string; hi: string };
  days: Array<{
    title: { en: string; hi: string };
    desc: { en: string; hi: string };
    cat: DailyAction['category'];
  }>;
}

// 1. SIMPLE, PRACTICAL VEGETABLE ACTIONS (Tomato, Chilli, Brinjal, Onion, etc.)
function getVegetableWeekTemplate(week: number, totalWeeks: number, cropName: string): WeekTemplate {
  const norm = Math.round(((week - 1) / Math.max(1, totalWeeks - 1)) * 17) + 1; // 1 to 18

  switch (norm) {
    case 1:
      return {
        stage: { en: `Field Preparation & Manure for ${cropName}`, hi: `${cropName} के लिए खेत की जुताई व गोबर खाद` },
        phase: { en: 'Field Prep', hi: 'खेत तैयारी' },
        summary: { en: `Deep ploughing with tractor, spreading cow dung manure, and making water channels.`, hi: `गहरी जुताई करें, देसी गोबर की खाद डालें और क्यारियां बनाएं।` },
        days: [
          { title: { en: 'Deep Ploughing', hi: 'गहरी जुताई' }, desc: { en: 'Plough field 2-3 times to break hard soil clods and let sun heat kill pests.', hi: 'ट्रैक्टर से 2-3 बार गहरी जुताई करें ताकि मिट्टी धूप से भुरभुरी हो जाए।' }, cat: 'prep' },
          { title: { en: 'Level the Field', hi: 'खेत को समतल करना' }, desc: { en: 'Use patta/leveler so water spreads evenly to every corner.', hi: 'पाटा चलाकर खेत समतल करें ताकि पानी हर जगह बराबर पहुंचे।' }, cat: 'prep' },
          { title: { en: 'Spread Desi Manure', hi: 'गोबर की खाद डालना' }, desc: { en: 'Spread 4-5 trolley well-rotted cow dung manure evenly in the field.', hi: '4-5 ट्रॉली अच्छी सड़ी गोबर की खाद पूरे खेत में बराबर बिखेरें।' }, cat: 'nutrient' },
          { title: { en: 'Make Raised Beds', hi: 'उठी क्यारियां बनाना' }, desc: { en: 'Form 3-feet wide raised beds so roots do not rot in standing water.', hi: '3 फीट चौड़ी उठी क्यारियां बनाएं ताकि जड़ों में पानी न भरे।' }, cat: 'prep' },
          { title: { en: 'Add Basic Khad (DAP/Zinc)', hi: 'शुरुआती खाद मिलाना' }, desc: { en: 'Mix basic DAP and Zinc with topsoil before sowing.', hi: 'थोड़ी डीएपी और जिंक मिट्टी में अच्छी तरह मिला लें।' }, cat: 'nutrient' },
          { title: { en: 'Clean Water Drains', hi: 'पानी की नाली साफ करना' }, desc: { en: 'Dig side drains so extra rain water flows out easily.', hi: 'किनारे की नालियां साफ करें ताकि ज्यादा पानी आसानी से निकल जाए।' }, cat: 'irrigation' },
          { title: { en: 'Buy Quality Seeds', hi: 'अच्छे बीज की व्यवस्था' }, desc: { en: `Purchase disease-free certified hybrid seeds of ${cropName} from reliable shop.`, hi: `${cropName} के प्रमाणित व पक्के बीज भरोसेमंद दुकान से लाएं।` }, cat: 'monitoring' },
        ],
      };

    case 2:
      return {
        stage: { en: `Nursery Bed & Seed Sowing for ${cropName}`, hi: `${cropName} की नर्सरी तैयार करना व बीज बोना` },
        phase: { en: 'Nursery Sowing', hi: 'नर्सरी बुवाई' },
        summary: { en: `Seed treatment with bio-medicine, sowing in pro-trays or nursery beds, and light watering.`, hi: `बीज को दवा से उपचारित करें, नर्सरी में बोएं और फव्वारे से हल्का पानी दें।` },
        days: [
          { title: { en: 'Seed Treatment', hi: 'बीजोपचार करना' }, desc: { en: 'Mix seeds with Trichoderma powder or bio-fungicide to prevent disease.', hi: 'बीज को ट्राइकोडर्मा पाउडर से मिलाकर उपचारित करें ताकि बीमारी न लगे।' }, cat: 'protection' },
          { title: { en: 'Prepare Nursery Soil', hi: 'नर्सरी की मिट्टी तैयार करना' }, desc: { en: 'Mix soft soil with vermicompost (kenchua khad) in trays or beds.', hi: 'बारीक मिट्टी में केंचुआ खाद मिलाकर नर्सरी की क्यारी या ट्रे तैयार करें।' }, cat: 'prep' },
          { title: { en: 'Sow Seeds in Lines', hi: 'कतार में बीज बोना' }, desc: { en: 'Sow seeds thinly at half-inch depth and cover lightly with soil.', hi: 'आधा इंच गहराई पर बीज बोकर ऊपर से हल्की मिट्टी की परत डालें।' }, cat: 'sowing' },
          { title: { en: 'Light Water Spray', hi: 'फव्वारे से पानी देना' }, desc: { en: 'Sprinkle water with a rose-can so seeds do not wash away.', hi: 'हल्के फव्वारे से पानी दें ताकि बीज अपनी जगह से न हिलें।' }, cat: 'irrigation' },
          { title: { en: 'Cover with Green Net', hi: 'हरी जाली (नेट) से ढकना' }, desc: { en: 'Cover with net or straw to protect tender sprouts from harsh sun.', hi: 'तेज धूप और पक्षियों से बचाने के लिए ऊपर हरी जाली या घास-फूस ढकें।' }, cat: 'protection' },
          { title: { en: 'Check Moisture Daily', hi: 'रोजाना नमी देखना' }, desc: { en: 'Check morning and evening that nursery soil remains moist.', hi: 'सुबह-शाम देखें कि नर्सरी में हल्की नमी बनी रहे।' }, cat: 'irrigation' },
          { title: { en: 'Watch Sprout Growth', hi: 'अंकुरण देखना' }, desc: { en: 'Watch small green sprouts emerge within 4-6 days.', hi: '4-6 दिन में छोटे हरे पौधे निकलने की स्थिति देखें।' }, cat: 'monitoring' },
        ],
      };

    case 3:
      return {
        stage: { en: `Drip Setup & Seedling Care`, hi: `ड्रिप पाइप बिछाना व पौधों को धूप दिखाना` },
        phase: { en: 'Nursery Care', hi: 'पौध की देखरेख' },
        summary: { en: `Laying drip pipes, removing nursery shade to harden plants, and checking field readiness.`, hi: `खेत में ड्रिप पाइप बिछाएं, नर्सरी से जाली हटाएं ताकि पौधे मजबूत हों।` },
        days: [
          { title: { en: 'Lay Drip Pipes', hi: 'ड्रिप पाइप बिछाना' }, desc: { en: 'Lay black drip pipes straight on the raised beds.', hi: 'उठी क्यारियों के ऊपर ड्रिप के काले पाइप सीधे बिछाएं।' }, cat: 'irrigation' },
          { title: { en: 'Test Water Flow', hi: 'पानी चलाकर देखना' }, desc: { en: 'Run motor for 15 minutes to check that all drippers are dripping properly.', hi: '15 मिनट मोटर चलाकर देखें कि सभी छेदों से बराबर पानी टपक रहा है।' }, cat: 'irrigation' },
          { title: { en: 'Remove Net for Sun', hi: 'धूप में पौधे मजबूत करना' }, desc: { en: 'Remove shade net for 3-4 hours daily so seedlings get tough for planting.', hi: 'दिन में कुछ घंटे जाली हटाएं ताकि पौधे धूप सहन करने लायक बनें।' }, cat: 'prep' },
          { title: { en: 'Put Yellow Sticky Traps', hi: 'पीले पत्ते (ट्रैप) लगाना' }, desc: { en: 'Tie yellow sticky sheets on field corners to catch small flies.', hi: 'खेत के कोनों पर पीले चिपचिपे पत्ते लगाएं ताकि रस चूसक कीड़े चिपकें।' }, cat: 'protection' },
          { title: { en: 'Check 4-Leaf Stage', hi: 'पौधों में 4 पत्ते देखना' }, desc: { en: 'Ensure seedlings have 4-5 strong green leaves and good roots.', hi: 'देखें कि पौधों में 4-5 मजबूत हरे पत्ते और अच्छी जड़ें बन गई हैं।' }, cat: 'monitoring' },
          { title: { en: 'Light Evening Watering', hi: 'शाम को हल्का पानी' }, desc: { en: 'Give light water in evening to keep seedlings fresh.', hi: 'शाम को हल्का पानी दें ताकि पौधे ताजे रहें।' }, cat: 'irrigation' },
          { title: { en: 'Plan Planting Day', hi: 'रोपाई की तैयारी' }, desc: { en: 'Prepare field and arrange extra hands for tomorrow evening planting.', hi: 'कल शाम को रोपाई के लिए खेत तैयार रखें और मजदूरों की व्यवस्था करें।' }, cat: 'prep' },
        ],
      };

    case 4:
      return {
        stage: { en: `Planting Saplings in Main Field for ${cropName}`, hi: `${cropName} के पौधों की खेत में रोपाई` },
        phase: { en: 'Transplanting', hi: 'पौध रोपाई' },
        summary: { en: `Planting saplings in evening hours, dipping roots in bio-medicine, and immediate watering.`, hi: `शाम को ठंडक में पौधे लगाएं, जड़ों को दवा में डुबोएं और तुरंत पानी दें।` },
        days: [
          { title: { en: 'Pull Plants Gently', hi: 'पौधे सावधानी से निकालना' }, desc: { en: 'Gently pull plants with wet soil ball without breaking roots.', hi: 'नर्सरी से गीली मिट्टी सहित पौधे निकालें ताकि जड़ें न टूटें।' }, cat: 'sowing' },
          { title: { en: 'Dip Roots in Medicine', hi: 'जड़ों को दवा में डुबोना' }, desc: { en: 'Dip roots in bio-fungicide water for 10 minutes before planting.', hi: 'जड़ों को 10 मिनट ट्राइकोडर्मा या दवा के घोल में डुबोकर रखें।' }, cat: 'protection' },
          { title: { en: 'Plant in Evening', hi: 'शाम को रोपाई करना' }, desc: { en: 'Plant at 1.5 to 2 feet distance during cool evening hours.', hi: 'शाम 4 बजे के बाद डेढ़-दो फीट की दूरी पर पौधे लगाएं।' }, cat: 'sowing' },
          { title: { en: 'Press Soil Around Stem', hi: 'जड़ के पास मिट्टी दबाना' }, desc: { en: 'Gently press soil around plant stem with fingers so it stands upright.', hi: 'पौधे के चारों ओर हाथ से मिट्टी दबाएं ताकि पौधा सीधा खड़ा रहे।' }, cat: 'sowing' },
          { title: { en: 'Give Water Immediately', hi: 'तुरंत पानी देना' }, desc: { en: 'Run drip for 30 minutes right after planting so soil settles.', hi: 'रोपाई के तुरंत बाद 30 मिनट पानी चलाएं ताकि जड़ें मिट्टी पकड़ लें।' }, cat: 'irrigation' },
          { title: { en: 'Check for Wilted Plants', hi: 'मुरझाए पौधे देखना' }, desc: { en: 'Check next morning for any dead or wilted plants.', hi: 'अगली सुबह देखें कि कौन से पौधे सूखे या मुरझाए हैं।' }, cat: 'monitoring' },
          { title: { en: 'Replace Empty Spots', hi: 'खाली जगह नया पौधा लगाना' }, desc: { en: 'Plant fresh healthy saplings in empty spots immediately.', hi: 'मुरझाए पौधों की जगह तुरंत नए पौधे लगाकर कतार पूरी करें।' }, cat: 'sowing' },
        ],
      };

    case 5:
      return {
        stage: { en: `Root Settlement & First Light Khad`, hi: `जड़ जमना व पहली हल्की खाद` },
        phase: { en: 'Early Growth', hi: 'शुरुआती बढ़त' },
        summary: { en: `Light watering, pulling small weeds by hand, and giving first growth booster.`, hi: `हल्की सिंचाई करें, हाथ से घास निकालें और पौधों में पहली खाद दें।` },
        days: [
          { title: { en: 'Check New Green Leaves', hi: 'नई कोपलें देखना' }, desc: { en: 'Look for fresh light green leaves showing plants have rooted.', hi: 'पौधों के सिर पर नई ताजी पत्तियां देखें, इसका मतलब जड़ जम गई है।' }, cat: 'monitoring' },
          { title: { en: 'Pull Small Weeds', hi: 'हाथ से घास निकालना' }, desc: { en: 'Pull out small wild grass around plant stems by hand.', hi: 'पौधों के पास उगी छोटी घास को हाथ से उखाड़कर साफ करें।' }, cat: 'prep' },
          { title: { en: 'First Khad with Water (19:19:19)', hi: 'पानी के साथ पहली खाद' }, desc: { en: 'Give 19:19:19 water-soluble khad through drip or sprinkler.', hi: 'ड्रिप या पानी के साथ 19:19:19 खाद थोड़ी मात्रा में दें।' }, cat: 'nutrient' },
          { title: { en: 'Morning Water Cycle', hi: 'सुबह का पानी' }, desc: { en: 'Give 20-30 minutes water every 2 days in morning hours.', hi: 'सुबह के समय 2 दिन में एक बार 20-30 मिनट पानी चलाएं।' }, cat: 'irrigation' },
          { title: { en: 'Spray Neem Oil', hi: 'नीम के तेल का छिड़काव' }, desc: { en: 'Spray neem oil mixed in water to keep small leaf-eating insects away.', hi: 'नीम का तेल पानी में घोलकर छिड़कें ताकि कीड़े पत्ती न काटें।' }, cat: 'protection' },
          { title: { en: 'Check Under Leaves', hi: 'पत्ती के नीचे देखना' }, desc: { en: 'Turn leaves over to check for white flies or tiny green aphids.', hi: 'पत्तियों को पलटकर देखें कि कोई बारीक हरा या सफेद कीड़ा तो नहीं है।' }, cat: 'monitoring' },
          { title: { en: 'Note Plant Growth', hi: 'बढ़त का अंदाजा लेना' }, desc: { en: 'Check that all rows are growing uniformly green.', hi: 'देखें कि सभी कतारों में पौधे एकसमान हरे और तंदुरुस्त बढ़ रहे हैं।' }, cat: 'monitoring' },
        ],
      };

    case 6:
      return {
        stage: { en: `Bamboo Support (Staking) & Weeding for ${cropName}`, hi: `${cropName} को बांस का सहारा देना व निराई` },
        phase: { en: 'Staking Support', hi: 'बांस का सहारा' },
        summary: { en: `Fixing bamboo poles, tying vines with string so fruits do not touch soil, and removing extra shoots.`, hi: `बांस गाड़कर तार बांधें, पौधों को सुतली से बांधें ताकि फल मिट्टी न छुएं।` },
        days: [
          { title: { en: 'Fix Bamboo Poles', hi: 'बांस की खूंटियां गाड़ना' }, desc: { en: 'Fix strong bamboo sticks every 10 feet along the plant rows.', hi: 'कतारों में हर 8-10 फीट पर मजबूत बांस की खूंटियां गाड़ें।' }, cat: 'prep' },
          { title: { en: 'Tie Wire Horizontally', hi: 'तार या मजबूत रस्सी बांधना' }, desc: { en: 'Tie wire across poles 1.5 feet above the ground.', hi: 'बांसों पर जमीन से डेढ़ फीट ऊपर मजबूत तार या रस्सी खींचकर बांधें।' }, cat: 'prep' },
          { title: { en: 'Tie Plants with String', hi: 'सुतली से पौधे बांधना' }, desc: { en: 'Gently tie plant stems to wire with loose sutli (string).', hi: 'पौधों को सुतली से ढीला बांधकर तार के सहारे ऊपर उठाएं।' }, cat: 'prep' },
          { title: { en: 'Pinch Bottom Extra Shoots', hi: 'निचली गैर-जरूरी डालियां हटाना' }, desc: { en: 'Pinch off small weak shoots near the ground to make top strong.', hi: 'जमीन के पास की छोटी कमजोर डालियां तोड़ दें ताकि मुख्य तना मजबूत हो।' }, cat: 'prep' },
          { title: { en: 'Clean Inter-Row Weeds', hi: 'रास्ते की घास साफ करना' }, desc: { en: 'Hoe between rows with khurpi or wheel-hoe to clean grass.', hi: 'खुरपी या खुरपे से कतारों के बीच की सारी घास साफ करें।' }, cat: 'prep' },
          { title: { en: 'Add Calcium / Khad', hi: 'कैल्शियम खाद देना' }, desc: { en: 'Add a little Calcium Nitrate near roots to make stems thick.', hi: 'तनों को मोटा और मजबूत करने के लिए थोड़ी कैल्शियम खाद दें।' }, cat: 'nutrient' },
          { title: { en: 'Check Upright Plants', hi: 'सीधे खड़े पौधे देखना' }, desc: { en: 'Ensure no branches are drooping or touching muddy soil.', hi: 'देखें कि कोई भी डाली जमीन पर न गिरे और पौधे सीधे खड़े रहें।' }, cat: 'monitoring' },
        ],
      };

    case 7:
      return {
        stage: { en: `Branching & Growth Tonic Spray`, hi: `शाखाओं का फैलाव व टॉनिक छिड़काव` },
        phase: { en: 'Active Branching', hi: 'शाखा फैलाव' },
        summary: { en: `Spraying micro-nutrient tonic for healthy green branches and checking for leaf curl.`, hi: `पौधों पर टॉनिक व सूक्ष्म पोषक छिड़कें और पत्ती मुड़ने की जांच करें।` },
        days: [
          { title: { en: 'Spray Plant Tonic / Micronutrient', hi: 'सूक्ष्म पोषक टॉनिक स्प्रे' }, desc: { en: 'Spray Zinc and Boron mixture on leaves for deep green color.', hi: 'पत्तियों पर जिंक व बोरॉन का हल्का घोल छिड़कें ताकि चमक आए।' }, cat: 'nutrient' },
          { title: { en: 'Train Branches on Wire', hi: 'डालियों को तार पर चढ़ाना' }, desc: { en: 'Spread side branches along wire netting so sunlight hits all leaves.', hi: 'फैलती डालियों को तार पर फैलाएं ताकि सबको बराबर धूप मिले।' }, cat: 'prep' },
          { title: { en: 'Check Leaf Curl (Murcha)', hi: 'पत्ती मरोड़ (मुर्रा) देखना' }, desc: { en: 'Look for upward curled leaves caused by sucking thrips.', hi: 'देखें कि पत्तियां ऊपर की ओर मुड़ तो नहीं रहीं (कीड़ों का प्रकोप)।' }, cat: 'protection' },
          { title: { en: 'Spray Bio-Pesticide', hi: 'जैविक कीटनाशक छिड़काव' }, desc: { en: 'Spray neem or bio-medicine on leaf undersides.', hi: 'पत्तियों के नीचे अच्छी तरह नीम दवा का छिड़काव करें।' }, cat: 'protection' },
          { title: { en: 'Regular Morning Watering', hi: 'नियमित सुबह पानी' }, desc: { en: 'Give steady morning water; do not let soil get bone-dry.', hi: 'सुबह के समय खेत में नमी रखें; मिट्टी को ज्यादा सूखने न दें।' }, cat: 'irrigation' },
          { title: { en: 'Remove Yellow Bottom Leaves', hi: 'पीली निचली पत्तियां काटना' }, desc: { en: 'Cut off old yellow bottom leaves to let fresh air circulate.', hi: 'निचली पीली पुरानी पत्तियां काटकर हटाएं ताकि हवा आर-पार हो।' }, cat: 'prep' },
          { title: { en: 'Look for First Flower Buds', hi: 'पहली कलियां खोजना' }, desc: { en: 'Search top branches for small yellow flower bud clusters.', hi: 'पौधे के ऊपरी हिस्से में पीले फूलों की छोटी कलियां देखें।' }, cat: 'monitoring' },
        ],
      };

    case 8:
      return {
        stage: { en: `First Flowers & Flower Drop Prevention`, hi: `फूल आना व फूल झड़ने से रोकना` },
        phase: { en: 'Flower Budding', hi: 'फूल आना' },
        summary: { en: `Spraying Boron to stop flower drop, maintaining steady water, and hanging fruit fly traps.`, hi: `फूल झड़ने से रोकने हेतु बोरॉन छिड़कें, नियमित पानी दें और मखी ट्रैप लगाएं।` },
        days: [
          { title: { en: 'Count Yellow Flowers', hi: 'फूलों की संख्या देखना' }, desc: { en: 'Check that plenty of bright yellow flower bunches are opening.', hi: 'देखें कि पौधों पर पीले फूलों के अच्छे गुच्छे खिल रहे हैं।' }, cat: 'monitoring' },
          { title: { en: 'Spray Boron (Stop Flower Drop)', hi: 'बोरॉन का छिड़काव (फूल बचाना)' }, desc: { en: 'Spray 1 gram Boron per liter water so flowers do not fall off.', hi: '1 ग्राम बोरॉन प्रति लीटर पानी में मिलाकर छिड़कें ताकि फूल न झड़ें।' }, cat: 'nutrient' },
          { title: { en: 'Give 0:52:34 Khad with Water', hi: '0:52:34 खाद पानी में देना' }, desc: { en: 'Give 0:52:34 khad through drip to help small flowers turn to fruit.', hi: 'फूलों को फल में बदलने के लिए ड्रिप से 0:52:34 खाद दें।' }, cat: 'nutrient' },
          { title: { en: 'Hang Fruit Fly / Moth Traps', hi: 'फल मक्खी ट्रैप टांगना' }, desc: { en: 'Hang 4-5 pheromone fly traps in field to catch borer moths.', hi: 'खेत में 4-5 मक्खी ट्रैप टांगें ताकि सुंडी वाले पतंगे पकड़े जाएं।' }, cat: 'protection' },
          { title: { en: 'Steady Light Water (No Flooding)', hi: 'हल्का व नियमित पानी' }, desc: { en: 'Give light daily water; heavy flooding causes flowers to drop.', hi: 'हल्का पानी दें; ज्यादा पानी भरने से फूल झड़ जाते हैं।' }, cat: 'irrigation' },
          { title: { en: 'Check for Honeybees', hi: 'मधुमक्खियां देखना' }, desc: { en: 'Notice bees buzzing on flowers; they help turn flowers into fruit.', hi: 'फूलों पर मधुमक्खियां देखें, ये फूल से फल बनाने में मदद करती हैं।' }, cat: 'monitoring' },
          { title: { en: 'Look for First Tiny Fruit', hi: 'छोटे फल बनते देखना' }, desc: { en: 'Look inside fading flowers for small green pea-sized fruits.', hi: 'मुरझाए फूल के नीचे छोटे हरे मटर के दाने जितने फल देखें।' }, cat: 'monitoring' },
        ],
      };

    case 9:
      return {
        stage: { en: `Peak Bloom & Bee-Friendly Care`, hi: `भरपूर फूल व मधुमक्खी सुरक्षा` },
        phase: { en: 'Flowering & Setting', hi: 'फूल व फल बनना' },
        summary: { en: `No strong chemical sprays in daytime to protect bees, light watering, and organic tonic.`, hi: `दिन में तेज दवा न छिड़कें ताकि मधुमक्खियां बची रहें, हल्का पानी दें।` },
        days: [
          { title: { en: 'Protect Friendly Bees (No Day Spray)', hi: 'मधुमक्खी बचाना (दिन में नो स्प्रे)' }, desc: { en: 'Do not spray chemical poison between 8am and 2pm when bees work.', hi: 'सुबह 8 से दोपहर 2 बजे तक कोई तेज दवा न छिड़कें।' }, cat: 'protection' },
          { title: { en: 'Spray Flower Tonic (Planofix / NAA)', hi: 'फूल टॉनिक स्प्रे' }, desc: { en: 'Spray light flower booster in late evening to set heavy fruit.', hi: 'शाम को हल्का फूल टॉनिक छिड़कें ताकि खूब फल बनें।' }, cat: 'nutrient' },
          { title: { en: 'Look for Black Spots on Leaves', hi: 'पत्ती पर काले धब्बे देखना' }, desc: { en: 'Check for dark spots on leaves and spray bio-fungicide if seen.', hi: 'पत्तियों पर काले धब्बे देखें, दिखने पर जैविक फफूंद दवा छिड़कें।' }, cat: 'protection' },
          { title: { en: 'Regular Morning Drip', hi: 'सुबह की ड्रिप' }, desc: { en: 'Keep soil moist like a squeezed sponge (not too dry, not swampy).', hi: 'खेत में हल्की नमी बनाए रखें, न ज्यादा सूखा न कीचड़।' }, cat: 'irrigation' },
          { title: { en: 'Give 13:0:45 Potash Khad', hi: '13:0:45 पोटाश खाद' }, desc: { en: 'Feed a little 13:0:45 through drip to give energy to new fruitlets.', hi: 'छोटे नए फलों को ताकत देने के लिए 13:0:45 खाद दें।' }, cat: 'nutrient' },
          { title: { en: 'Tighten Loose Strings', hi: 'ढीली सुतली कसना' }, desc: { en: 'Retie any plants leaning sideways so they stay straight.', hi: 'झुक रहे पौधों को फिर से सुतली से सीधा बांधें।' }, cat: 'prep' },
          { title: { en: 'Count Marble-Sized Fruits', hi: 'कंचे जितने फल गिनना' }, desc: { en: 'Check clusters of small round green fruits forming on branches.', hi: 'डालियों पर गुच्छों में बन रहे गोल कंचे जैसे फल देखें।' }, cat: 'monitoring' },
        ],
      };

    case 10:
      return {
        stage: { en: `Small Fruit Growth & Bottom Rot Check for ${cropName}`, hi: `${cropName} में फल बढ़ना व नीचे से सड़न रोकना` },
        phase: { en: 'Fruit Setting', hi: 'फल बढ़वार' },
        summary: { en: `Spraying calcium to prevent black bottom rot, checking for fruit boring worms, and steady watering.`, hi: `फल को नीचे से काला होने से रोकने के लिए कैल्शियम दें और सुंडी की जांच करें।` },
        days: [
          { title: { en: 'Check Bottom of Fruits for Black Spot', hi: 'फल के नीचे काला दाग देखना' }, desc: { en: 'Inspect fruit tips; black bottom spot means plant needs Calcium.', hi: 'फल के नीचे का हिस्सा देखें; काला दाग दिखे तो तुरंत कैल्शियम दें।' }, cat: 'monitoring' },
          { title: { en: 'Spray Calcium on Fruit Bunches', hi: 'फलों पर कैल्शियम छिड़कना' }, desc: { en: 'Spray Calcium Nitrate mixed in water directly on fruit bunches.', hi: 'कैल्शियम खाद पानी में घोलकर सीधे फलों के गुच्छों पर छिड़कें।' }, cat: 'nutrient' },
          { title: { en: 'Check for Fruit Borer Holes', hi: 'फल में सुंडी का छेद देखना' }, desc: { en: 'Check if any worm has drilled a hole in green fruits; pluck and destroy.', hi: 'देखें किसी फल में कीड़े ने छेद तो नहीं किया; खराब फल तोड़कर फेंकें।' }, cat: 'protection' },
          { title: { en: 'Spray Bt / Neem Bio-Medicine', hi: 'जैविक सुंडी नाशक स्प्रे' }, desc: { en: 'Spray bio-pesticide (Bt powder or Neem) in evening to kill small worms.', hi: 'शाम को जैविक दवा या नीम का स्प्रे करें ताकि सुंडी मर जाए।' }, cat: 'protection' },
          { title: { en: 'Daily Split Drip (Morning & Evening)', hi: 'सुबह-शाम थोड़ा पानी' }, desc: { en: 'Give 15 mins morning and 15 mins evening so fruits do not crack.', hi: 'सुबह-शाम 15-15 मिनट पानी दें ताकि फल चटके नहीं।' }, cat: 'irrigation' },
          { title: { en: 'Cut Yellow Lower Foliage', hi: 'नीचे की पीली पत्तियां काटना' }, desc: { en: 'Cut away dry leaves near ground to stop mold from spreading.', hi: 'जमीन से छूती सूखी पत्तियां काट दें ताकि फफूंद न लगे।' }, cat: 'prep' },
          { title: { en: 'Measure Fruit Size', hi: 'फल का आकार देखना' }, desc: { en: 'See that green fruits are getting heavier and smooth.', hi: 'देखें कि हरे फल वजनी, गोल और चमकदार बन रहे हैं।' }, cat: 'monitoring' },
        ],
      };

    case 11:
      return {
        stage: { en: `Fruit Sizing & Weight Booster (Potash)`, hi: `फलों का आकार व वजन बढ़ाना (पोटाश)` },
        phase: { en: 'Fruit Sizing', hi: 'वजन बढ़ाना' },
        summary: { en: `Giving 0:0:50 Potash khad for solid heavy pulp, thinning extra fruits, and tightening support wire.`, hi: `वजन व गूदा बढ़ाने के लिए 0:0:50 पोटाश खाद दें, अतिरिक्त छोटे फल हटाएं।` },
        days: [
          { title: { en: 'Give 0:0:50 Potash Khad', hi: '0:0:50 पोटाश खाद देना' }, desc: { en: 'Give 0:0:50 khad through drip; potash makes fruits heavy and shiny.', hi: 'ड्रिप से 0:0:50 पोटाश खाद दें, इससे फल भारी और चमकदार होते हैं।' }, cat: 'nutrient' },
          { title: { en: 'Thin Out Extra Tiny Fruits', hi: 'अतिरिक्त छोटे फल हटाना' }, desc: { en: 'Pluck extra tiny fruits in crowded bunches so remaining grow big.', hi: 'गुच्छे में से छोटे-कमजोर फल तोड़ दें ताकि बाकी फल बड़े आकार के बनें।' }, cat: 'prep' },
          { title: { en: 'Check Wire & Support Poles', hi: 'बांस व तारों को कसना' }, desc: { en: 'Support heavy branches laden with green fruits with extra sticks.', hi: 'फलों के भारी वजन से झुक रही डालियों को अतिरिक्त खूंटी का सहारा दें।' }, cat: 'prep' },
          { title: { en: 'Spray Boron (Stop Cracking)', hi: 'बोरॉन का हल्का स्प्रे' }, desc: { en: 'Spray light Boron so fruit skin stretches without cracking.', hi: 'हल्का बोरॉन छिड़कें ताकि फल का छिलका मजबूत रहे और फटे नहीं।' }, cat: 'nutrient' },
          { title: { en: 'Clean Fruit Fly Traps', hi: 'मक्खी ट्रैप साफ करना' }, desc: { en: 'Empty traps and add fresh lure capsule to keep catching flies.', hi: 'ट्रैप में फंसी मक्खियां साफ करें और नई टिकिया लगाएं।' }, cat: 'protection' },
          { title: { en: 'Keep Soil Evenly Moist', hi: 'मिट्टी में बराबर नमी' }, desc: { en: 'Do not let ground dry up and then flood; keep water uniform.', hi: 'खेत को ज्यादा सूखने न दें, नियमित पानी दें।' }, cat: 'irrigation' },
          { title: { en: 'Check Big Green Fruits', hi: 'बड़े हरे फल देखना' }, desc: { en: 'Check bottom bunches have reached full big market size.', hi: 'देखें कि नीचे के फल पूरे बड़े बाजारू आकार के हो गए हैं।' }, cat: 'monitoring' },
        ],
      };

    case 12:
      return {
        stage: { en: `Fruit Bulking & Sun Protection for ${cropName}`, hi: `${cropName} में फलों का पूर्ण भराव व धूप से बचाव` },
        phase: { en: 'Fruit Bulking', hi: 'पूर्ण भराव' },
        summary: { en: `Protecting fruits from direct sun-burn with leaf cover, checking local mandi crate rates.`, hi: `फलों को तेज धूप से बचाएं, मंडी में कैरेट के भाव की जानकारी लें।` },
        days: [
          { title: { en: 'Cover Fruits from Harsh Sun', hi: 'धूप से फलों को ढंकना' }, desc: { en: 'Make sure top leaves shade fruit clusters so sun does not burn them.', hi: 'देखें कि ऊपर की पत्तियां फलों को धूप से बचा रही हैं।' }, cat: 'prep' },
          { title: { en: 'Give Light Potash & Magnesium', hi: 'हल्की पोटाश खाद' }, desc: { en: 'Give light feed through drip for rich red pulp inside.', hi: 'फलों के अंदर गहरा लाल रंग व स्वाद भरने हेतु ड्रिप से खाद दें।' }, cat: 'nutrient' },
          { title: { en: 'Check for Blight Spots', hi: 'झुलसा रोग की जांच' }, desc: { en: 'Check if leaves or fruits show brown wet patches; spray copper medicine.', hi: 'पत्तियों पर भूरे धब्बे देखें, दिखने पर कॉपर दवा का छिड़काव करें।' }, cat: 'protection' },
          { title: { en: 'Inquire Local Mandi Rates', hi: 'सब्जी मंडी का भाव पता करना' }, desc: { en: 'Call mandi arhatiya / traders to know current crate prices.', hi: 'मंडी के आढ़ती या व्यापारी से बात कर कैरेट का वर्तमान भाव पता करें।' }, cat: 'monitoring' },
          { title: { en: 'Arrange Plastic Crates', hi: 'प्लास्टिक कैरेट की व्यवस्था' }, desc: { en: 'Arrange 40-50 clean plastic crates ready in field shed.', hi: 'खेत पर 40-50 साफ प्लास्टिक कैरेट तैयार रखें।' }, cat: 'prep' },
          { title: { en: 'Check for Color Change (Pinkish)', hi: 'हल्का रंग बदलना देखना' }, desc: { en: 'Watch bottom fruits turning from green to yellowish-pink (Breaker).', hi: 'निचले फलों को हरे से हल्का पीला-गुलाबी रंग बदलते देखें।' }, cat: 'monitoring' },
          { title: { en: 'Get Picking Team Ready', hi: 'तुड़ाई की तैयारी' }, desc: { en: 'Plan early morning picking round with family or workers.', hi: 'कल सुबह जल्दी पहली तुड़ाई का समय तय करें।' }, cat: 'prep' },
        ],
      };

    case 13:
      return {
        stage: { en: `First Harvest Picking (Color Break) for ${cropName}`, hi: `${cropName} की पहली सुबह की तुड़ाई (रंग बदलना)` },
        phase: { en: 'First Picking', hi: 'पहली तुड़ाई' },
        summary: { en: `Picking mature pink/breaker fruits in cool early morning, packing in crates, and sending to mandi.`, hi: `सुबह ठंडक में हल्के पके फल तोड़ें, कैरेट में भरें और मंडी भेजें।` },
        days: [
          { title: { en: 'Pick in Cool Early Morning', hi: 'सुबह जल्दी तुड़ाई करना' }, desc: { en: 'Pick mature breaker fruits with stem cap between 6am and 9am.', hi: 'सुबह 6 से 9 बजे के बीच डंठल सहित हल्के पके फल सावधानी से तोड़ें।' }, cat: 'harvest' },
          { title: { en: 'Handle in Plastic Crates', hi: 'कैरेट में सलीके से रखना' }, desc: { en: 'Place fruits gently in crates; do not use heavy sacks that crush fruit.', hi: 'फलों को प्लास्टिक कैरेट में रखें; बोरी में न भरें ताकि फल दबें नहीं।' }, cat: 'prep' },
          { title: { en: 'Separate Grade-A Clean Fruits', hi: 'बड़े चमकदार फल अलग करना' }, desc: { en: 'Separate big clean fruits from small ones to get highest mandi rate.', hi: 'दाग-मुक्त बड़े फलों को अलग कैरेट में रखें ताकि ऊंचा भाव मिले।' }, cat: 'prep' },
          { title: { en: 'Weigh Crates on Scale', hi: 'कैरेट का वजन करना' }, desc: { en: 'Weigh crates on digital scale (around 25kg per crate) and count total.', hi: 'कांटे पर कैरेट का वजन करें (लगभग 25 किलो) और कुल संख्या लिखें।' }, cat: 'monitoring' },
          { title: { en: 'Send to Mandi Fast', hi: 'जल्दी मंडी रवाना करना' }, desc: { en: 'Load on tempo/trolley and dispatch to mandi before afternoon heat.', hi: 'दोपहर की धूप से पहले गाड़ी लोड कर मंडी रवाना करें।' }, cat: 'harvest' },
          { title: { en: 'Water Plants After Picking', hi: 'तुड़ाई के बाद पानी देना' }, desc: { en: 'Run drip for 20 mins and give a little khad for next upper fruits.', hi: 'तुड़ाई के बाद 20 मिनट पानी चलाएं ताकि ऊपर के फल तेजी से बढ़ें।' }, cat: 'irrigation' },
          { title: { en: 'Record Mandi Payout in Diary', hi: 'मंडी की कमाई डायरी में लिखना' }, desc: { en: 'Record total crates sold, price per crate and payment received.', hi: 'बिके कैरेट, मिला भाव और कुल कमाई अपनी कृषि डायरी में दर्ज करें।' }, cat: 'monitoring' },
        ],
      };

    case 14:
      return {
        stage: { en: `Main Large-Scale Harvest Picking (Round 1)`, hi: `मुख्य बड़ी तुड़ाई (पहला बड़ा चक्र)` },
        phase: { en: 'Main Harvest 1', hi: 'मुख्य तुड़ाई 1' },
        summary: { en: `Heavy systematic picking, packing clean crates, selling at wholesale mandi, and feeding vines.`, hi: `बड़े पैमाने पर कतारबद्ध तुड़ाई, कैरेट पैकिंग, मंडी में बिक्री व खाद।` },
        days: [
          { title: { en: 'Full Field Picking Round', hi: 'पूरे खेत की बड़ी तुड़ाई' }, desc: { en: 'Pick all mature ripe and breaker fruits row by row.', hi: 'कतार से कतार सभी तैयार फलों की व्यवस्थित तुड़ाई पूरी करें।' }, cat: 'harvest' },
          { title: { en: 'Clean and Sort in Shade Shed', hi: 'छाया में सफाई व छंटाई' }, desc: { en: 'Wipe fruits clean with dry cloth under shade.', hi: 'छायादार जगह पर फलों को साफ कपड़े से पोंछकर कैरेट में लगाएं।' }, cat: 'prep' },
          { title: { en: 'Count Total Crates Loaded', hi: 'कुल भरे कैरेट गिनना' }, desc: { en: 'Count 50-100+ crates loaded securely on vehicle.', hi: 'गाड़ी में लोड किए गए कुल कैरेट की गिनती नोट करें।' }, cat: 'monitoring' },
          { title: { en: 'Mandi Auction & Sale', hi: 'मंडी में नीलामी व बिक्री' }, desc: { en: 'Sell produce to top-bidding trader at mandi or e-NAM.', hi: 'मंडी में आढ़ती के जरिए सबसे ऊंची बोली पर माल बेचें।' }, cat: 'harvest' },
          { title: { en: 'Feed 19:19:19 for Next Flush', hi: 'अगले फलों के लिए खाद' }, desc: { en: 'Feed 19:19:19 through drip so upper branches produce more big fruits.', hi: 'ड्रिप से 19:19:19 खाद दें ताकि ऊपर के नए फल तेजी से बड़े हों।' }, cat: 'nutrient' },
          { title: { en: 'Prune Damaged Vines', hi: 'टूटी डालियां साफ करना' }, desc: { en: 'Snip off any broken branches or dried leaves after picking.', hi: 'तुड़ाई के दौरान टूटी डालियां व सूखी पत्तियां काटकर हटाएं।' }, cat: 'prep' },
          { title: { en: 'Collect Payment in Bank', hi: 'बैंक खाते में भुगतान लेना' }, desc: { en: 'Collect payment directly into bank account via UPI or cash.', hi: 'बिक्री का पैसा सीधे बैंक खाते या नकद प्राप्त कर हिसाब लिखें।' }, cat: 'monitoring' },
        ],
      };

    case 15:
      return {
        stage: { en: `Second Major Picking & Plant Re-nourishing`, hi: `दूसरी मुख्य तुड़ाई व पौधों की देखभाल` },
        phase: { en: 'Main Harvest 2', hi: 'मुख्य तुड़ाई 2' },
        summary: { en: `Harvesting middle-tier fruit load, giving water, and keeping plants green for more yields.`, hi: `पौधे के बीच के हिस्से से तुड़ाई करें, पानी दें और पौधों को हरा रखें।` },
        days: [
          { title: { en: 'Second Major Picking Round', hi: 'दूसरी बड़ी तुड़ाई' }, desc: { en: 'Harvest heavy fruit clusters from middle branches.', hi: 'डालियों के बीच से तैयार फलों की दूसरी बड़ी तुड़ाई करें।' }, cat: 'harvest' },
          { title: { en: 'Separate Local vs Distant Transport', hi: 'स्थानीय व दूर की मंडी की छंटाई' }, desc: { en: 'Pack red-ripe for local sale, yellowish-pink for distant markets.', hi: 'लाल पके फल पास के बाजार और हल्के पके दूर की मंडी हेतु अलग करें।' }, cat: 'prep' },
          { title: { en: 'Feed Potash for Remaining Fruit', hi: 'बचे फलों को पोटाश देना' }, desc: { en: 'Give a little 13:0:45 khad through drip for top remaining fruits.', hi: 'ऊपर बचे छोटे फलों को बड़ा करने के लिए ड्रिप से पोटाश दें।' }, cat: 'nutrient' },
          { title: { en: 'Check for Worms or Spots', hi: 'कीट या धब्बे देखना' }, desc: { en: 'Spray neem water if white flies or worms appear on top leaves.', hi: 'ऊपरी पत्तियों पर कीड़े दिखने पर नीम के पानी का स्प्रे करें।' }, cat: 'protection' },
          { title: { en: 'Flush Drip Pipes with Clean Water', hi: 'ड्रिप पाइप साफ करना' }, desc: { en: 'Open pipe ends to flush out any dirt or salt clogging.', hi: 'पाइपों के किनारे खोलकर अंदर जमी मिट्टी व कचरा साफ करें।' }, cat: 'irrigation' },
          { title: { en: 'Vehicle Dispatch to Mandi', hi: 'मंडी गाड़ी रवाना' }, desc: { en: 'Send crates to wholesale mandi safely covered with tarpaulin.', hi: 'कैरेट को तिरपाल से ढककर सुरक्षित मंडी रवाना करें।' }, cat: 'harvest' },
          { title: { en: 'Calculate Profit So Far', hi: 'अब तक का मुनाफा जोड़ना' }, desc: { en: 'Add up all earnings so far and subtract worker/vehicle costs.', hi: 'अब तक की कुल कमाई में से मजदूरी व भाड़ा घटाकर मुनाफा जोड़ें।' }, cat: 'monitoring' },
        ],
      };

    case 16:
      return {
        stage: { en: `Third Picking Round & Late Season Care`, hi: `तीसरी तुड़ाई व अंतिम देखरेख` },
        phase: { en: 'Main Harvest 3', hi: 'तीसरी तुड़ाई' },
        summary: { en: `Picking third flush of fruits, light watering, and packing for mandi.`, hi: `तीसरे चक्र के फल तोड़ें, हल्का पानी दें और मंडी में बिक्री करें।` },
        days: [
          { title: { en: 'Third Picking Round', hi: 'तीसरे चक्र की तुड़ाई' }, desc: { en: 'Pick fully sized fruits from top branches of the trellis.', hi: 'ऊपरी डालियों पर तैयार सभी फलों की तुड़ाई पूरी करें।' }, cat: 'harvest' },
          { title: { en: 'Crate Sorting & Packing', hi: 'कैरेट भराई व छंटाई' }, desc: { en: 'Pack good fruits in crates and discard spoiled ones.', hi: 'अच्छे फल कैरेट में भरें और खराब फलों को गड्ढे में दबाएं।' }, cat: 'prep' },
          { title: { en: 'Light Late Blight Spray', hi: 'झुलसा रोग से बचाव' }, desc: { en: 'Spray light bio-medicine if humid weather causes leaf spots.', hi: 'बादल या नमी में पत्ती सड़न रोकने हेतु हल्की जैविक दवा छिड़कें।' }, cat: 'protection' },
          { title: { en: 'Short Drip Watering', hi: 'कम समय ड्रिप चलाना' }, desc: { en: 'Run drip for only 15-20 mins as plants complete life cycle.', hi: 'अब केवल 15-20 मिनट ड्रिप चलाएं क्योंकि फसल पकने की ओर है।' }, cat: 'irrigation' },
          { title: { en: 'Direct Mandi / Local Sale', hi: 'मंडी व स्थानीय बिक्री' }, desc: { en: 'Sell crates at mandi or directly to local vegetable shopkeepers.', hi: 'कैरेट मंडी में या सीधे स्थानीय सब्जी व्यापारियों को बेचें।' }, cat: 'harvest' },
          { title: { en: 'Inspect Remaining Green Fruits', hi: 'बचे हुए अंतिम फल देखना' }, desc: { en: 'See how many small green fruits are left for final picking.', hi: 'देखें कि अंतिम तुड़ाई के लिए कितने फल पौधे पर बाकी हैं।' }, cat: 'monitoring' },
          { title: { en: 'Log Total Quintals Sold', hi: 'कुल क्विंटल उपज लिखना' }, desc: { en: 'Write down total quintals sold in farm notebook.', hi: 'अब तक बिके कुल क्विंटल का हिसाब कॉपी में दर्ज करें।' }, cat: 'monitoring' },
        ],
      };

    case 17:
      return {
        stage: { en: `Final Complete Picking & Clearing Support for ${cropName}`, hi: `${cropName} की अंतिम तुड़ाई व बांस-तार समेटना` },
        phase: { en: 'Final Picking', hi: 'अंतिम तुड़ाई' },
        summary: { en: `Plucking all remaining fruits, untying string, rolling wires, and stacking bamboo for next season.`, hi: `सभी बचे फल तोड़ें, सुतली खोलें, तार व बांस सुरक्षित समेटकर रखें।` },
        days: [
          { title: { en: 'Final Strip Harvest (All Fruits)', hi: 'अंतिम पूरी तुड़ाई' }, desc: { en: 'Pluck all remaining mature green and red fruits to clear plants.', hi: 'पौधों पर लगे सभी छोटे-बड़े पके फल तोड़कर खेत खाली करें।' }, cat: 'harvest' },
          { title: { en: 'Sell Final Lot to Local Market', hi: 'अंतिम लॉट की बिक्री' }, desc: { en: 'Sell final batch to local retail vendors or processing buyers.', hi: 'अंतिम माल को स्थानीय बाजार या खरीदारों को बेचें।' }, cat: 'harvest' },
          { title: { en: 'Untie Strings & Roll Wire', hi: 'सुतली खोलना व तार लपेटना' }, desc: { en: 'Untie jute strings and roll up GI wire neatly for next crop.', hi: 'सुतली खोलें और लोहे के तार का रोल बनाकर अगली फसल हेतु रखें।' }, cat: 'prep' },
          { title: { en: 'Pull & Stack Bamboo Poles', hi: 'बांस की खूंटियां उखाड़कर रखना' }, desc: { en: 'Pull bamboo poles from soil and stack in dry shed for next season.', hi: 'बांस की खूंटियां उखाड़कर छायादार कमरे में सुरक्षित रखें।' }, cat: 'prep' },
          { title: { en: 'Roll Drip Pipes Safely', hi: 'ड्रिप पाइप समेटना' }, desc: { en: 'Flush and roll black drip pipes to store safely without cuts.', hi: 'ड्रिप पाइपों को साफ कर गोल रोल बनाकर कमरे में रखें।' }, cat: 'prep' },
          { title: { en: 'Calculate Total Season Profit', hi: 'पूरे सीजन का कुल शुद्ध मुनाफा' }, desc: { en: 'Calculate total income minus seed, khad, and labor expenses.', hi: 'कुल आमदनी में से बीज, खाद व मजदूरी का खर्च घटाकर शुद्ध मुनाफा निकालें।' }, cat: 'monitoring' },
          { title: { en: 'Celebrate Harvest Success', hi: 'सीजन की सफलता का संतोष' }, desc: { en: 'Review season yield achievements with family and team.', hi: 'परिवार के साथ बैठकर फसल के अच्छे उत्पादन व मुनाफे का संतोष लें।' }, cat: 'monitoring' },
        ],
      };

    default: // 18
      return {
        stage: { en: `Field Cleaning, Desi Khad & Next Crop Planning`, hi: `खेत की सफाई, गोबर खाद व अगली फसल की तैयारी` },
        phase: { en: 'Next Crop Prep', hi: 'अगली तैयारी' },
        summary: { en: `Ploughing dry plant residue into soil as manure, soil testing, and selecting next season crop.`, hi: `सूखे पौधों को जोतकर खाद बनाएं, मिट्टी जांचें व अगली फसल चुनें।` },
        days: [
          { title: { en: 'Chop Dry Plant Foliage', hi: 'सूखे पौधों को काटना' }, desc: { en: 'Chop dry leftover vines and leaves right in the field.', hi: 'खेत में बची सूखी बेलों व पत्तियों को काटकर बारीक फैलाएं।' }, cat: 'prep' },
          { title: { en: 'Spray Bio-Decomposer Solution', hi: 'सड़ाने वाली दवा (डीकम्पोजर) छिड़कना' }, desc: { en: 'Spray bio-decomposer (desi gur + decomposer) to turn waste to khad.', hi: 'वेस्ट डीकम्पोजर का घोल छिड़कें ताकि अवशेष सड़कर खाद बन जाएं।' }, cat: 'nutrient' },
          { title: { en: 'Deep Tractor Ploughing', hi: 'ट्रैक्टर से गहरी जुताई' }, desc: { en: 'Plough field to bury green matter deep under soil.', hi: 'मिट्टी पलटने वाले हल से जुताई कर अवशेषों को मिट्टी में दबाएं।' }, cat: 'prep' },
          { title: { en: 'Take Soil Sample for Test', hi: 'मिट्टी का नमूना जांच भेजना' }, desc: { en: 'Take soil samples from 4 corners to check khad levels for next crop.', hi: 'खेत से मिट्टी लेकर जांच कराएं ताकि पता चले अगली फसल में कितनी खाद चाहिए।' }, cat: 'monitoring' },
          { title: { en: 'Sow Green Manure (Dhaincha)', hi: 'हरी खाद (ढैंचा) बोना' }, desc: { en: 'Broadcast Dhaincha seeds if rains are starting to enrich soil.', hi: 'मिट्टी की ताकत बढ़ाने हेतु ढैंचा या सनई के बीज बोएं।' }, cat: 'prep' },
          { title: { en: 'Choose Next Crop Variety', hi: 'अगली फसल की योजना' }, desc: { en: 'Select high-earning crop rotation for upcoming season.', hi: 'आने वाले मौसम के अनुसार सबसे ज्यादा मुनाफे वाली फसल चुनें।' }, cat: 'monitoring' },
          { title: { en: 'Close Farm Ledger', hi: 'कृषि डायरी पूरी करना' }, desc: { en: 'Complete season entries, profit figures and lessons in farm notebook.', hi: 'अपनी कृषि डायरी में इस सीजन का पूरा लेखा-जोखा लिखकर समाप्त करें।' }, cat: 'monitoring' },
        ],
      };
  }
}

// 2. SIMPLE, PRACTICAL CEREAL ACTIONS (Rice, Wheat, Maize, etc.)
function getCerealWeekTemplate(week: number, totalWeeks: number, cropName: string): WeekTemplate {
  const norm = Math.round(((week - 1) / Math.max(1, totalWeeks - 1)) * 17) + 1; // 1 to 18

  switch (norm) {
    case 1:
      return {
        stage: { en: `Field Ploughing & Manure for ${cropName}`, hi: `${cropName} हेतु जुताई, समतलीकरण व गोबर खाद` },
        phase: { en: 'Field Prep', hi: 'खेत तैयारी' },
        summary: { en: `Deep summer ploughing with tractor, field leveling, spreading cow dung manure, and repairing bunds.`, hi: `गहरी जुताई करें, खेत को पाटा लगाकर समतल करें और देसी गोबर खाद डालें।` },
        days: [
          { title: { en: 'Deep Summer Ploughing', hi: 'गहरी जुताई करना' }, desc: { en: 'Plough 2-3 times with tractor to break hard soil clods and let sun heat kill pests.', hi: 'ट्रैक्टर से 2-3 बार गहरी जुताई करें ताकि मिट्टी धूप से भुरभुरी हो जाए।' }, cat: 'prep' },
          { title: { en: 'Level the Field with Patta', hi: 'पाटा चलाकर समतल करना' }, desc: { en: 'Run patta or laser leveler so irrigation water spreads evenly.', hi: 'पाटा लगाकर खेत समतल करें ताकि पानी हर जगह बराबर पहुंचे।' }, cat: 'prep' },
          { title: { en: 'Spread Desi Cow Dung Khad', hi: 'गोबर की खाद डालना' }, desc: { en: 'Spread 4-5 trolley well-rotted cow dung manure evenly across the field.', hi: '4-5 ट्रॉली अच्छी सड़ी गोबर की खाद पूरे खेत में बराबर बिखेरें।' }, cat: 'nutrient' },
          { title: { en: 'Repair Field Boundaries (Meda)', hi: 'खेत की मेड़बंदी ठीक करना' }, desc: { en: 'Build strong high mud bunds (meda) to hold rainwater in field.', hi: 'खेत की मेड़ें मजबूत और ऊंची बनाएं ताकि पानी बाहर न बहे।' }, cat: 'prep' },
          { title: { en: 'Clean Water Inlets and Drains', hi: 'पानी की नालियां साफ करना' }, desc: { en: 'Dig and clear main water channels from tubewell/canal to field.', hi: 'ट्यूबवेल व नहर से आने वाली पानी की मुख्य नालियां साफ करें।' }, cat: 'irrigation' },
          { title: { en: 'Mix Basic DAP and Zinc', hi: 'शुरुआती डीएपी व जिंक मिलाना' }, desc: { en: 'Keep basal DAP and Zinc bags weighed and ready for sowing.', hi: 'बुवाई के लिए डीएपी और जिंक खाद की बोरियां तैयार रखें।' }, cat: 'nutrient' },
          { title: { en: 'Buy Certified Seeds', hi: 'प्रमाणित बीज लाना' }, desc: { en: `Procure certified high-yield seed bags of ${cropName} from government society/dealer.`, hi: `${cropName} के प्रमाणित व पक्के बीज समिति या भरोसेमंद दुकान से लाएं।` }, cat: 'monitoring' },
        ],
      };

    case 2:
      return {
        stage: { en: `Seed Treatment & Moisture Check for ${cropName}`, hi: `${cropName} का बीजोपचार व खेत में नमी जांच` },
        phase: { en: 'Seed Treatment', hi: 'बीजोपचार' },
        summary: { en: `Mixing seeds with bio-medicine/fungicide, checking seedbed moisture, and calibrating seed drill.`, hi: `बीज को दवा से उपचारित करें, छांव में सुखाएं और खेत में बुवाई योग्य नमी जांचें।` },
        days: [
          { title: { en: 'Seed Germination Test', hi: 'बीज का अंकुरण देखना' }, desc: { en: 'Put 100 seeds in wet cloth for 3 days; ensure at least 85 sprout.', hi: 'गीले कपड़े में 100 दाने रखकर देखें कि 85 से ज्यादा दाने अंकुरित हो रहे हैं।' }, cat: 'monitoring' },
          { title: { en: 'Seed Coating with Bio-Medicine', hi: 'दवा से बीजोपचार करना' }, desc: { en: 'Coat seeds with Trichoderma powder or Azotobacter slurry against soil diseases.', hi: 'बीज को ट्राइकोडर्मा या एज़ोटोबैक्टर कल्चर से उपचारित करें।' }, cat: 'protection' },
          { title: { en: 'Dry Seeds in Shade', hi: 'छाया में सुखाना' }, desc: { en: 'Spread treated seeds on clean sheet under shade for 45 minutes.', hi: 'उपचारित बीजों को साफ तिरपाल पर 45 मिनट छायादार जगह सुखाएं।' }, cat: 'sowing' },
          { title: { en: 'Check Field Moisture (Vattar)', hi: 'खेत की नमी (वत्तर) जांचना' }, desc: { en: 'Take fist of soil at 3-inch depth; it should crumble easily without sticking.', hi: '3 इंच नीचे की मिट्टी मुट्ठी में दबाकर देखें; भुरभुरी होनी चाहिए।' }, cat: 'irrigation' },
          { title: { en: 'Clean and Test Seed Drill', hi: 'सीड ड्रिल मशीन की जांच' }, desc: { en: 'Check seed drill pipes, depth shoes, and set sowing depth at 2 inches.', hi: 'सीड ड्रिल के पाइप व खांचे साफ करें और 2 इंच गहराई सेट करें।' }, cat: 'prep' },
          { title: { en: 'Weigh Seed & Khad per Acre', hi: 'प्रति एकड़ बीज-खाद नापना' }, desc: { en: 'Weigh 40kg seed and recommended DAP per acre in drill boxes.', hi: 'मशीन के बक्सों में प्रति एकड़ 40 किलो बीज व डीएपी भरें।' }, cat: 'nutrient' },
          { title: { en: 'Ready Tractor for Tomorrow', hi: 'ट्रैक्टर व बुवाई की तैयारी' }, desc: { en: 'Plan early morning sowing start when soil moisture is fresh.', hi: 'कल सुबह जल्दी बुवाई शुरू करने के लिए ट्रैक्टर तैयार रखें।' }, cat: 'monitoring' },
        ],
      };

    case 3:
      return {
        stage: { en: `Line Sowing & Sowing Care for ${cropName}`, hi: `${cropName} की कतार में बुवाई व पाटा लगाना` },
        phase: { en: 'Precision Sowing', hi: 'कतार बुवाई' },
        summary: { en: `Sowing in straight lines at 2-inch depth, placing fertilizer below seed, and light rolling.`, hi: `सीड ड्रिल से 2 इंच गहराई पर कतार बुवाई करें, खाद डालें और हल्का पाटा लगाएं।` },
        days: [
          { title: { en: 'Sow in Straight Lines', hi: 'सीधी कतारों में बुवाई' }, desc: { en: 'Drive seed drill slowly in straight lines to drop seeds evenly.', hi: 'सीड ड्रिल को धीरे चलाकर सीधी कतारों में बराबर बीज गिराएं।' }, cat: 'sowing' },
          { title: { en: 'Place Khad Below Seed', hi: 'बीज के नीचे खाद डालना' }, desc: { en: 'Ensure fertilizer drops 2 inches below seed furrow for strong roots.', hi: 'देखें कि खाद बीज से 2 इंच नीचे गिरे ताकि जड़ें मजबूत बनें।' }, cat: 'nutrient' },
          { title: { en: 'Run Light Patta', hi: 'हल्का पाटा फेरना' }, desc: { en: 'Run a light plank (patta) behind drill to cover seeds with soil.', hi: 'बुवाई के पीछे हल्का पाटा लगाएं ताकि बीज मिट्टी से अच्छी तरह ढक जाए।' }, cat: 'prep' },
          { title: { en: 'Hang Shiny Ribbons for Birds', hi: 'पक्षी भगाने के रिबन लगाना' }, desc: { en: 'Tie shiny reflective ribbons across field bunds to keep birds away.', hi: 'खेत की मेड़ों पर चमकीली पन्नी बांधें ताकि पक्षी बीज न चुगें।' }, cat: 'protection' },
          { title: { en: 'Spray Pre-Emergence Herbicide', hi: 'घास रोकने वाली दवा का स्प्रे' }, desc: { en: 'Spray grass prevention medicine within 48 hours of sowing if needed.', hi: 'बुवाई के 48 घंटे के भीतर खरपतवार रोकने वाली दवा का छिड़काव करें।' }, cat: 'protection' },
          { title: { en: 'Check for Hard Soil Crust', hi: 'ऊपरी पपड़ी की जांच' }, desc: { en: 'Check soil surface after light drizzle; break crust so sprouts emerge.', hi: 'हल्की बारिश के बाद पपड़ी देखें; पपड़ी बने तो हल्के से तोड़ें।' }, cat: 'irrigation' },
          { title: { en: 'Record Sowing Date in Diary', hi: 'बुवाई की तारीख लिखना' }, desc: { en: 'Write sowing date, seed variety, and total acres in farm notebook.', hi: 'बुवाई की सही तारीख, बीज की किस्म व एकड़ डायरी में लिखें।' }, cat: 'monitoring' },
        ],
      };

    default:
      return getGeneralCropWeekTemplate(week, totalWeeks, cropName, 'cereal');
  }
}

// 3. SIMPLE, PRACTICAL GENERAL / PULSE / FIBRE / OILSEED TEMPLATE
function getGeneralCropWeekTemplate(week: number, totalWeeks: number, cropName: string, category: CropCategory): WeekTemplate {
  const norm = Math.round(((week - 1) / Math.max(1, totalWeeks - 1)) * 17) + 1; // 1 to 18

  if (category === 'vegetable') {
    return getVegetableWeekTemplate(week, totalWeeks, cropName);
  }
  if (category === 'cereal') {
    return getCerealWeekTemplate(week, totalWeeks, cropName);
  }

  const isPulse = category === 'pulse';
  const isFibre = category === 'fibre_cane';
  const isOilseed = category === 'oilseed';

  const stagesEn = [
    `Field Ploughing & Desi Manure for ${cropName}`,
    `Seed Treatment with Bio-Medicine & Moisture Check`,
    `Line Sowing & Furrow Alignment for ${cropName}`,
    `Sprout Emergence & Filling Empty Spots`,
    `First Weeding & Light Nitrogen Khad`,
    `Branching & Spraying Growth Tonic for ${cropName}`,
    isPulse ? `Root Nodule Care & Branching` : isFibre ? `Square (Bud) Formation & Pest Scouting` : `Canopy Expansion & Zinc-Boron Feeding`,
    isPulse ? `Flower Bud Appearance & Boron Spray` : isFibre ? `Bud Care & Pink Worm Traps` : isOilseed ? `Yellow Flower Stalk Growth & Aphid Check` : `Flower Care & 0:52:34 Khad`,
    `Peak Flowering, Honeybee Protection & Steady Water`,
    isPulse ? `Small Pod Formation & Worm Protection` : isFibre ? `Boll Setting & Magnesium Spray` : isOilseed ? `Siliqua (Pod) Formation & Bee Care` : `Fruit/Pod Setting & Flower Protection`,
    isPulse ? `Pod Sizing & 13:0:45 Potash Feeding` : isFibre ? `Boll Sizing & Pest Spray` : `Pod / Seed Bulking & Moisture Check`,
    isPulse ? `Late Pod Filling & Worm Check` : isFibre ? `Boll Maturation & Potash Nutrition` : `Seed Filling & Starch Consolidation`,
    `Final Grain/Seed Filling & Planning Last Water`,
    `Crop Turning Golden / Mature & Stopping Water`,
    `Full Crop Maturity & Checking Dryness`,
    `Checking Moisture & Machine / Worker Setup`,
    isFibre ? `First Clean Seed-Cotton Picking` : `Harvesting, Threshing & Bagging for ${cropName}`,
    `Sun Drying on Tarpaulin, Mandi Sale & Next Crop Prep`,
  ];

  const stagesHi = [
    `${cropName} के लिए खेत की जुताई व गोबर खाद`,
    `दवा से बीजोपचार व खेत में नमी जांच`,
    `${cropName} की कतार में बुवाई व क्यारी बनाना`,
    `अंकुरण देखना व खाली जगह बीज बोना`,
    `पहली निराई-गुड़ाई व हल्की यूरिया खाद`,
    `${cropName} में शाखाएं बढ़ना व टॉनिक छिड़काव`,
    isPulse ? `जड़ों में गांठें बनना व शाखा फैलाव` : isFibre ? `डोडी (कली) बनना व रस चूसक कीट जांच` : `पत्तियों का फैलाव व जिंक-बोरॉन स्प्रे`,
    isPulse ? `फूल कलियां निकलना व बोरॉन छिड़काव` : isFibre ? `डोडी सुरक्षा व गुलाबी सुंडी ट्रैप` : isOilseed ? `पीले फूल की डालियां बढ़ना व माहू जांच` : `फूलों की देखरेख व 0:52:34 खाद`,
    `भरपूर फूल, मधुमक्खी सुरक्षा व हल्का पानी`,
    isPulse ? `छोटी फलियां बनना व सुंडी से बचाव` : isFibre ? `गूलर बनना व मैग्नीशियम स्प्रे` : isOilseed ? `फलियां बनना व परागण सुरक्षा` : `फल/फली सेटिंग व फूल सुरक्षा`,
    isPulse ? `फली में दाना बढ़ना व पोटाश खाद` : isFibre ? `गूलर मोटा होना व कीट दवा` : `दाना भराव व नमी संतुलन`,
    isPulse ? `फली में दाना पकना व अंतिम सुंडी जांच` : isFibre ? `गूलर पकना व पोटाश पोषण` : `दाना कड़ा होना व भराव`,
    `अंतिम दाना भराव व आखिरी पानी की योजना`,
    `${cropName} का सुनहरा पकना व पानी बंद करना`,
    `पूरी फसल पकना व दाने का सूखापन देखना`,
    `दाने की नमी जांचना व कटाई मशीन की तैयारी`,
    isFibre ? `पहली साफ कपास की चुनाई` : `${cropName} की कटाई, थ्रेशिंग व बोरियों में भराई`,
    `तिरपाल पर धूप में सुखाना, मंडी बिक्री व अगली तैयारी`,
  ];

  const phasesEn = [
    'Field Prep', 'Seed Treatment', 'Sowing', 'Emergence', 'Weeding & Khad', 'Branching',
    'Growth', 'Flower Buds', 'Peak Bloom', 'Pod Setting', 'Pod Sizing',
    'Grain Filling', 'Late Filling', 'Maturity', 'Full Maturity', 'Pre-Harvest',
    'Harvesting', 'Mandi Sale',
  ];

  const phasesHi = [
    'खेत तैयारी', 'बीजोपचार', 'बुवाई', 'अंकुरण', 'निराई व खाद', 'शाखाएं',
    'बढ़त', 'फूल कलियां', 'भरपूर फूल', 'फली बनना', 'दाना बढ़ना',
    'दाना भराव', 'अंतिम भराव', 'परिपक्वता', 'पूर्ण पकाई', 'कटाई पूर्व',
    'फसल कटाई', 'मंडी बिक्री',
  ];

  const idx = Math.min(Math.max(0, norm - 1), 17);
  const stage = { en: stagesEn[idx], hi: stagesHi[idx] };
  const phase = { en: phasesEn[idx], hi: phasesHi[idx] };
  const summary = {
    en: `Week ${week} focus: ${stagesEn[idx]} for your ${cropName} field.`,
    hi: `सप्ताह ${week}: आपके ${cropName} के खेत में ${stagesHi[idx]} के काम।`,
  };

  const days: WeekTemplate['days'] = [
    { title: { en: 'Walk the Field & Check Soil', hi: 'खेत का चक्कर लगाना व नमी देखना' }, desc: { en: `Walk across rows in the morning to check crop greenness and soil moisture.`, hi: `सुबह खेत में घूमकर देखें कि फसल हरी-भरी है और मिट्टी में नमी कैसी है।` }, cat: 'monitoring' },
    { title: { en: 'Give Scheduled Water Cycle', hi: 'समय पर हल्का पानी देना' }, desc: { en: 'Give steady water according to current crop growth stage; avoid waterlogging.', hi: 'फसल की अवस्था अनुसार हल्का पानी दें; खेत में पानी भरने न दें।' }, cat: 'irrigation' },
    { title: { en: 'Apply Stage Khad / Spray', hi: 'जरूरत अनुसार खाद या स्प्रे' }, desc: { en: `Apply recommended fertilizer or growth booster spray for ${cropName}.`, hi: `${cropName} की अवस्था अनुसार खाद डालें या टॉनिक का छिड़काव करें।` }, cat: 'nutrient' },
    { title: { en: 'Check Under Leaves for Pests', hi: 'पत्तियों के नीचे कीड़े देखना' }, desc: { en: 'Turn leaves over to check for caterpillars, aphids or yellow spots.', hi: 'पत्तियों को पलटकर देखें कि कोई सुंडी, माहू या पीलापन तो नहीं है।' }, cat: 'protection' },
    { title: { en: 'Clean Competing Grass / Weeds', hi: 'घास-फूस व खरपतवार साफ करना' }, desc: { en: 'Pull out weeds so fertilizer goes directly to your main crop.', hi: 'खेत से घास निकालें ताकि खाद का पूरा फायदा मुख्य फसल को मिले।' }, cat: 'prep' },
    { title: { en: 'Spray Neem or Bio-Medicine', hi: 'नीम तेल या दवा का छिड़काव' }, desc: { en: 'Spray neem oil in evening to keep destructive insects away.', hi: 'शाम के समय नीम का तेल या जैविक दवा छिड़कें ताकि कीड़े न लगें।' }, cat: 'protection' },
    { title: { en: 'Weekly Farm Diary Review', hi: 'साप्ताहिक काम का हिसाब डायरी में' }, desc: { en: 'Note crop progress, total money spent and plan next week tasks.', hi: 'फसल की बढ़त, हुआ खर्च और अगले हफ्ते के काम डायरी में लिखें।' }, cat: 'monitoring' },
  ];

  return { stage, phase, summary, days };
}

/**
 * 100% farmer-friendly, simple, practical week-by-week action plan generator.
 */
export function getWeeklyActionPlan(
  season: 'Kharif' | 'Rabi' | 'Zaid',
  weekNumber: number,
  language: 'en' | 'hi',
  cropNames?: string[]
): WeekPlan {
  const isHi = language === 'hi';
  const totalWeeks = getSeasonWeeksCount(season);
  const clampedWeek = Math.max(1, Math.min(weekNumber, totalWeeks));

  const rawCropName = cropNames && cropNames.length > 0 ? cropNames[0] : (season === 'Kharif' ? 'Rice / Paddy' : season === 'Rabi' ? 'Wheat' : 'Tomato / Vegetable');
  const cropCategory = detectCropCategory(rawCropName);
  const cropDisplayName = getCropDisplayName(rawCropName, language);

  let template: WeekTemplate;
  if (cropCategory === 'vegetable') {
    template = getVegetableWeekTemplate(clampedWeek, totalWeeks, cropDisplayName);
  } else if (cropCategory === 'cereal') {
    template = getCerealWeekTemplate(clampedWeek, totalWeeks, cropDisplayName);
  } else {
    template = getGeneralCropWeekTemplate(clampedWeek, totalWeeks, cropDisplayName, cropCategory);
  }

  const days: DailyAction[] = template.days.map((d, i) => ({
    day: i + 1,
    dayOfSeason: (clampedWeek - 1) * 7 + (i + 1),
    title: isHi ? d.title.hi : d.title.en,
    desc: isHi ? d.desc.hi : d.desc.en,
    category: d.cat,
  }));

  return {
    week: clampedWeek,
    totalWeeks,
    stageName: isHi ? template.stage.hi : template.stage.en,
    phaseLabel: isHi ? template.phase.hi : template.phase.en,
    summary: isHi ? template.summary.hi : template.summary.en,
    days,
  };
}

export function getAllWeeksSummary(
  season: 'Kharif' | 'Rabi' | 'Zaid',
  language: 'en' | 'hi',
  cropNames?: string[]
): Array<{ week: number; stageName: string; phaseLabel: string }> {
  const total = getSeasonWeeksCount(season);
  const result: Array<{ week: number; stageName: string; phaseLabel: string }> = [];
  for (let w = 1; w <= total; w++) {
    const plan = getWeeklyActionPlan(season, w, language, cropNames);
    result.push({
      week: w,
      stageName: plan.stageName,
      phaseLabel: plan.phaseLabel,
    });
  }
  return result;
}
