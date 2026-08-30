/**
 * src/lib/contextualChecklists.ts
 * Generates dynamic, context-aware farmer observation checklists
 * tailored to today's active agricultural task and seasonal stage.
 */

import type { DailyAction } from '@/lib/seasonalActionPlans';
import type { ContextualQuestion, TaskSpecificChecklist } from '@/types/planLifecycle';

export interface UniversalObservation {
  id: string;
  label: { en: string; hi: string };
  icon?: string;
  suggestedActionType?: 'reschedule' | 'irrigate' | 'drain' | 'protect';
}

export const UNIVERSAL_OBSERVATIONS: UniversalObservation[] = [
  {
    id: 'rain_heavy',
    label: {
      en: 'Unexpected heavy rainfall occurred',
      hi: 'अप्रत्याशित भारी बारिश हुई',
    },
    suggestedActionType: 'drain',
  },
  {
    id: 'pest_symptoms',
    label: {
      en: 'Pest or disease symptoms noticed',
      hi: 'खेत में कीट या बीमारी के लक्षण दिखे',
    },
    suggestedActionType: 'protect',
  },
  {
    id: 'leaf_yellowing',
    label: {
      en: 'Crop color changed / leaves yellowing',
      hi: 'पत्तियों का रंग पीला पड़ा या मरोड़ दिखा',
    },
    suggestedActionType: 'protect',
  },
  {
    id: 'irrigation_fault',
    label: {
      en: 'Water or irrigation problem occurred',
      hi: 'पानी या सिंचाई में समस्या आई',
    },
    suggestedActionType: 'irrigate',
  },
  {
    id: 'task_delayed',
    label: {
      en: 'Today\'s scheduled task could not be completed',
      hi: 'आज का निर्धारित कार्य पूरा नहीं हो सका',
    },
    suggestedActionType: 'reschedule',
  },
];

/**
 * Returns dynamic contextual checklist questions specifically for today's task.
 */
export function getContextualTaskChecklist(
  day: number,
  week: number,
  task: DailyAction | null,
  cropName: string = 'Crop'
): TaskSpecificChecklist {
  if (!task) {
    return {
      day,
      week,
      taskTitle: 'Standard Monitoring',
      taskCategory: 'monitoring',
      questions: [
        {
          id: 'gen_growth',
          label: {
            en: `Is ${cropName} crop growth progressing uniformly?`,
            hi: `क्या ${cropName} की बढ़वार एकसमान दिख रही है?`,
          },
          category: 'task_completion',
        },
        {
          id: 'gen_moisture',
          label: {
            en: 'Is soil moisture adequate across the field?',
            hi: 'क्या पूरे खेत में पर्याप्त नमी बनी हुई है?',
          },
          category: 'soil_condition',
        },
        {
          id: 'gen_weeds',
          label: {
            en: 'Are wild weeds noticed near crop rows?',
            hi: 'क्या पौधों के पास जंगली घास उग रही है?',
          },
          category: 'pest_disease',
        },
      ],
    };
  }

  const cat = task.category;
  const questions: ContextualQuestion[] = [];

  switch (cat) {
    case 'prep':
      questions.push(
        {
          id: 'prep_done',
          label: {
            en: `Was ${task.title} completed across all plots?`,
            hi: `क्या ${task.title} का कार्य पूरे खेत में पूरा हुआ?`,
          },
          category: 'task_completion',
          impactsAdjustment: true,
        },
        {
          id: 'prep_soil_dry',
          label: {
            en: 'Was the soil clod too hard or excessively dry?',
            hi: 'क्या मिट्टी के ढेले अधिक सख्त या ज्यादा सूखे थे?',
          },
          category: 'soil_condition',
        },
        {
          id: 'prep_equipment',
          label: {
            en: 'Did machinery / tractor operate without issues?',
            hi: 'क्या ट्रैक्टर या हल में कोई तकनीकी रुकावट आई?',
          },
          category: 'machinery',
        },
        {
          id: 'prep_leveling',
          label: {
            en: 'Is the field properly leveled and drainage ready?',
            hi: 'क्या खेत समतल हो गया और जल-निकासी की नाली बन गई?',
          },
          category: 'soil_condition',
        }
      );
      break;

    case 'sowing':
      questions.push(
        {
          id: 'sow_depth',
          label: {
            en: `Were ${cropName} seeds/saplings sown at recommended spacing?`,
            hi: `क्या ${cropName} के बीज/पौधे सही दूरी व गहराई पर रोपे गए?`,
          },
          category: 'task_completion',
          impactsAdjustment: true,
        },
        {
          id: 'sow_treatment',
          label: {
            en: 'Was seed treatment (Trichoderma / bio-fungicide) performed?',
            hi: 'क्या बीजोपचार (ट्राइकोडर्मा/दवा) किया गया?',
          },
          category: 'input_quality',
        },
        {
          id: 'sow_water_post',
          label: {
            en: 'Was light watering applied immediately after sowing/transplanting?',
            hi: 'क्या बुवाई/रोपाई के तुरंत बाद हल्का पानी दिया गया?',
          },
          category: 'soil_condition',
        },
        {
          id: 'sow_germination',
          label: {
            en: 'Are sprouts emerging healthy without wilted gaps?',
            hi: 'क्या नए पौधे तंदुरुस्त दिख रहे हैं और कोई मुरझाया तो नहीं?',
          },
          category: 'task_completion',
        }
      );
      break;

    case 'nutrient':
      questions.push(
        {
          id: 'nut_quantity',
          label: {
            en: `Was ${task.title} applied in the planned quantity?`,
            hi: `क्या ${task.title} की तय मात्रा खेत में डाली गई?`,
          },
          category: 'task_completion',
          impactsAdjustment: true,
        },
        {
          id: 'nut_moisture',
          label: {
            en: 'Was the topsoil moist before nutrient application?',
            hi: 'क्या खाद डालते समय जमीन में पर्याप्त नमी थी?',
          },
          category: 'soil_condition',
        },
        {
          id: 'nut_quality',
          label: {
            en: 'Was well-rotted manure / certified fertilizer available on time?',
            hi: 'क्या अच्छी सड़ी गोबर की खाद या असली खाद समय पर मिली?',
          },
          category: 'input_quality',
        },
        {
          id: 'nut_rain_wash',
          label: {
            en: 'Did rain runoff cause any fertilizer wash-off risk?',
            hi: 'क्या बारिश के कारण खाद बहने का कोई जोखिम हुआ?',
          },
          category: 'weather',
        }
      );
      break;

    case 'irrigation':
      questions.push(
        {
          id: 'irri_time',
          label: {
            en: `Was irrigation run for the scheduled duration?`,
            hi: `क्या तय समय तक मोटर/ड्रिप चलाकर सिंचाई पूरी हुई?`,
          },
          category: 'task_completion',
          impactsAdjustment: true,
        },
        {
          id: 'irri_penetration',
          label: {
            en: 'Did water penetrate to root depth (4-6 inches)?',
            hi: 'क्या पानी जड़ों की गहराई (4-6 इंच) तक पहुंच गया?',
          },
          category: 'soil_condition',
        },
        {
          id: 'irri_pressure',
          label: {
            en: 'Was drip/sprinkler pressure uniform across all rows?',
            hi: 'क्या सभी क्यारियों और ड्रिप छेदों से बराबर पानी टपका?',
          },
          category: 'machinery',
        },
        {
          id: 'irri_waterlogging',
          label: {
            en: 'Is there any unwanted standing water puddling in low areas?',
            hi: 'क्या खेत के निचले हिस्से में पानी तो नहीं भर रहा?',
          },
          category: 'soil_condition',
        }
      );
      break;

    case 'protection':
      questions.push(
        {
          id: 'prot_spray',
          label: {
            en: `Was ${task.title} completed during calm morning/evening hours?`,
            hi: `क्या ${task.title} का छिड़काव सुबह/शाम शांत हवा में हुआ?`,
          },
          category: 'task_completion',
          impactsAdjustment: true,
        },
        {
          id: 'prot_coverage',
          label: {
            en: 'Were leaf undersides thoroughly covered with spray?',
            hi: 'क्या पत्तियों के नीचे अच्छी तरह दवा का स्प्रे पहुंचा?',
          },
          category: 'input_quality',
        },
        {
          id: 'prot_traps',
          label: {
            en: 'Are yellow sticky traps or pheromone traps catching insects?',
            hi: 'क्या पीले चिपचिपे पत्तों (ट्रैप्स) पर कीड़े चिपक रहे हैं?',
          },
          category: 'pest_disease',
        },
        {
          id: 'prot_weed_clear',
          label: {
            en: 'Were wild grasses and weeds cleared around the plant base?',
            hi: 'क्या पौधों की जड़ के पास की सारी घास साफ हो गई?',
          },
          category: 'task_completion',
        }
      );
      break;

    case 'harvest':
      questions.push(
        {
          id: 'harv_quality',
          label: {
            en: `Was harvesting done at the peak mature color & size?`,
            hi: `क्या सही पके फल/फसल की तुड़ाई सही आकार पर हुई?`,
          },
          category: 'task_completion',
          impactsAdjustment: true,
        },
        {
          id: 'harv_time',
          label: {
            en: 'Was harvesting conducted during cool morning hours?',
            hi: 'क्या तुड़ाई सुबह के ठंडे समय में की गई?',
          },
          category: 'task_completion',
        },
        {
          id: 'harv_mandi',
          label: {
            en: 'Are crates / packing sacks ready for market transport?',
            hi: 'क्या उपज को मंडी ले जाने के लिए क्रेट/बोरे तैयार हैं?',
          },
          category: 'market',
        },
        {
          id: 'harv_price',
          label: {
            en: 'Did local Mandi price meet your target expectation?',
            hi: 'क्या स्थानीय मंडी में भाव आपकी उम्मीद अनुसार मिला?',
          },
          category: 'market',
        }
      );
      break;

    case 'monitoring':
    default:
      questions.push(
        {
          id: 'mon_leaf_health',
          label: {
            en: `Did you inspect ${cropName} leaves for spots, curl, or pests?`,
            hi: `क्या आपने ${cropName} के पत्तों में धब्बे, मरोड़ या कीड़ों की जांच की?`,
          },
          category: 'pest_disease',
          impactsAdjustment: true,
        },
        {
          id: 'mon_growth_speed',
          label: {
            en: 'Is vegetative branch and stem thickness developing well?',
            hi: 'क्या तने की मोटाई और डालियों का फैलाव सही हो रहा है?',
          },
          category: 'task_completion',
        },
        {
          id: 'mon_soil_top',
          label: {
            en: 'Is the topsoil crumbling nicely without hard crust formation?',
            hi: 'क्या जमीन की ऊपरी मिट्टी भुरभुरी है और पपड़ी तो नहीं बनी?',
          },
          category: 'soil_condition',
        },
        {
          id: 'mon_flower_set',
          label: {
            en: 'Are new flower buds or fruit knots emerging healthy?',
            hi: 'क्या नई कलियां और फूल तंदुरुस्त खिल रहे हैं?',
          },
          category: 'task_completion',
        }
      );
      break;
  }

  return {
    day,
    week,
    taskTitle: task.title,
    taskCategory: cat,
    questions,
  };
}
