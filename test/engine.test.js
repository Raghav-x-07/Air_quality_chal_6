import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  getAqiBand,
  estimateAmbientPm25,
  calculateDirectImpact,
  generateDiurnalRoutine,
  generateIaqHacks,
  generateSustainableAlternatives,
  generateWarnings,
  generateCommunityBlueprint,
  generateAssessment
} from '../src/engine.js';
import {
  AQI_BANDS,
  USER_TYPES,
  AREA_TYPES,
  HOUSING_TYPES,
  COMMUTE_MODES,
  COOKING_HEATING,
  VULNERABLE_GROUPS,
  BUDGET_PREFERENCES
} from '../src/constants.js';

describe('Engine Module - getAqiBand & estimateAmbientPm25', () => {
  it('correctly categorizes AQI levels into official standard bands', () => {
    assert.equal(getAqiBand(40).label, AQI_BANDS.GOOD.label);
    assert.equal(getAqiBand(75).label, AQI_BANDS.SATISFACTORY.label);
    assert.equal(getAqiBand(150).label, AQI_BANDS.MODERATE.label);
    assert.equal(getAqiBand(250).label, AQI_BANDS.POOR.label);
    assert.equal(getAqiBand(350).label, AQI_BANDS.VERY_POOR.label);
    assert.equal(getAqiBand(450).label, AQI_BANDS.SEVERE.label);
    assert.equal(getAqiBand(600).label, AQI_BANDS.SEVERE.label);
    assert.equal(getAqiBand(null).label, AQI_BANDS.GOOD.label);
  });

  it('estimates monotonic ambient PM2.5 concentrations from AQI across all bands', () => {
    const pm30 = estimateAmbientPm25(30);
    const pm70 = estimateAmbientPm25(70);
    const pm150 = estimateAmbientPm25(150);
    const pm250 = estimateAmbientPm25(250);
    const pm350 = estimateAmbientPm25(350);
    const pm450 = estimateAmbientPm25(450);

    assert.ok(pm30 < pm70);
    assert.ok(pm70 < pm150);
    assert.ok(pm150 < pm250);
    assert.ok(pm250 < pm350);
    assert.ok(pm350 < pm450);
    assert.ok(pm450 >= 250);
  });
});

describe('Engine Module - calculateDirectImpact and Variations', () => {
  const baseInput = {
    userType: USER_TYPES.FAMILY,
    city: 'Delhi NCR',
    areaType: AREA_TYPES.URBAN_CORE,
    aqiLevel: 420,
    householdSize: 4,
    housingType: HOUSING_TYPES.APARTMENT_HIGH_FLOOR,
    primaryCommute: COMMUTE_MODES.TWO_WHEELER,
    cookingHeating: COOKING_HEATING.LPG_GAS,
    vulnerableMembers: [
      VULNERABLE_GROUPS.INFANTS_CHILDREN,
      VULNERABLE_GROUPS.ASTHMATIC_RESPIRATORY
    ],
    budgetPreference: BUDGET_PREFERENCES.LOW_COST_DIY,
    notes: ''
  };

  it('calculates significant PM2.5 exposure reductions (>50%)', () => {
    const impact = calculateDirectImpact(baseInput);

    assert.ok(impact.baselineExposure > impact.protectedExposure);
    assert.ok(impact.exposureReductionPercent >= 50);
    assert.ok(impact.exposureReductionPercent <= 95);
  });

  it('computes Berkeley Earth equivalent cigarettes saved daily', () => {
    const impact = calculateDirectImpact(baseInput);

    assert.ok(impact.baselineCigarettes > 0);
    assert.ok(impact.cigarettesSavedDaily > 0);
    assert.equal(
      impact.cigarettesSavedDaily,
      Number((impact.baselineCigarettes - impact.protectedCigarettes).toFixed(1))
    );
  });

  it('computes monthly CO2 and PM10 offsets across car and two-wheeler commutes', () => {
    const carInput = { ...baseInput, primaryCommute: COMMUTE_MODES.PERSONAL_CAR };
    const carImpact = calculateDirectImpact(carInput);
    assert.ok(carImpact.monthlyCo2SavedKg > 10);
    assert.ok(carImpact.monthlyPmPreventedGrams > 50);

    const bikeImpact = calculateDirectImpact(baseInput);
    assert.ok(bikeImpact.monthlyCo2SavedKg > 0);
  });

  it('handles commute modes: walk/cycle, carpool, and work-from-home', () => {
    const walkImpact = calculateDirectImpact({ ...baseInput, primaryCommute: COMMUTE_MODES.ACTIVE_WALK_CYCLE });
    assert.ok(walkImpact.baselineExposure > 0);

    const carpoolImpact = calculateDirectImpact({ ...baseInput, primaryCommute: COMMUTE_MODES.CARPOOL_CAB });
    assert.ok(carpoolImpact.baselineExposure > 0);

    const wfhImpact = calculateDirectImpact({ ...baseInput, primaryCommute: COMMUTE_MODES.WORK_FROM_HOME });
    assert.ok(wfhImpact.baselineExposure > 0);
  });

  it('handles housing types and heating setups (biomass, induction, rented)', () => {
    const biomassImpact = calculateDirectImpact({
      ...baseInput,
      housingType: HOUSING_TYPES.RENTED_BUDGET,
      cookingHeating: COOKING_HEATING.BIOMASS_WOOD
    });
    assert.ok(biomassImpact.baselineExposure > 0);

    const inductionImpact = calculateDirectImpact({
      ...baseInput,
      housingType: HOUSING_TYPES.INDEPENDENT_HOUSE,
      cookingHeating: COOKING_HEATING.INDUCTION_ELECTRIC,
      budgetPreference: BUDGET_PREFERENCES.PREMIUM_AUTOMATED,
      vulnerableMembers: []
    });
    assert.ok(inductionImpact.protectedExposure < inductionImpact.baselineExposure);
  });

  it('computes substantial financial savings for DIY purifier compared to commercial', () => {
    const impact = calculateDirectImpact(baseInput);
    assert.ok(impact.totalFinancialSavingsInr >= 13800);
  });
});

describe('Engine Module - generateDiurnalRoutine', () => {
  const input = {
    userType: USER_TYPES.FAMILY,
    city: 'Delhi NCR',
    aqiLevel: 450,
    householdSize: 4,
    primaryCommute: COMMUTE_MODES.PERSONAL_CAR,
    vulnerableMembers: [
      VULNERABLE_GROUPS.INFANTS_CHILDREN,
      VULNERABLE_GROUPS.ASTHMATIC_RESPIRATORY
    ],
    cookingHeating: COOKING_HEATING.UNVENTED_SIGRI
  };

  it('generates all 4 chronological diurnal dayparts with specific warnings', () => {
    const routine = generateDiurnalRoutine(input);
    assert.equal(routine.length, 4);

    assert.ok(routine[0].period.includes('Morning'));
    assert.ok(routine[1].period.includes('Midday'));
    assert.ok(routine[2].period.includes('Evening'));
    assert.ok(routine[3].period.includes('Night'));

    const nightActions = routine[3].actions.join(' ');
    assert.ok(nightActions.includes('Carbon Monoxide'));
  });

  it('handles non-severe AQI without severe restrictions in routine', () => {
    const lowAqiInput = {
      ...input,
      aqiLevel: 180,
      vulnerableMembers: []
    };
    const routine = generateDiurnalRoutine(lowAqiInput);
    assert.ok(routine[1].actions[0].includes('cross-ventilation'));
  });
});

describe('Engine Module - generateIaqHacks', () => {
  it('generates high-impact actionable IAQ hacks', () => {
    const hacks = generateIaqHacks({ housingType: HOUSING_TYPES.RENTED_BUDGET });
    assert.ok(hacks.length >= 5);

    const titles = hacks.map((h) => h.title).join(' ');
    assert.ok(titles.includes('Corsi-Rosenthal'));
    assert.ok(titles.includes('Microfiber Damp-Mopping'));
    assert.ok(titles.includes('Kitchen Pre-Exhaust'));
    assert.ok(titles.includes('Draft Stripping'));
    assert.ok(titles.includes('Botanical Plant'));
  });

  it('handles owned housing type with permanent stripping', () => {
    const hacks = generateIaqHacks({ housingType: HOUSING_TYPES.INDEPENDENT_HOUSE });
    const draftHack = hacks.find((h) => h.id === 'hack-weather-stripping');
    assert.ok(draftHack.cost.includes('₹450'));
  });
});

describe('Engine Module - generateSustainableAlternatives', () => {
  it('recommends public transit transition for car and two-wheeler commuters', () => {
    const carInput = {
      primaryCommute: COMMUTE_MODES.PERSONAL_CAR,
      cookingHeating: COOKING_HEATING.LPG_GAS
    };
    const alts = generateSustainableAlternatives(carInput);
    assert.ok(alts.some((a) => a.category.includes('Commute') && a.alternative.includes('Metro')));
  });

  it('handles active walk/cycle and transit commuters', () => {
    const transitInput = {
      primaryCommute: COMMUTE_MODES.PUBLIC_TRANSIT,
      cookingHeating: COOKING_HEATING.INDUCTION_ELECTRIC
    };
    const alts = generateSustainableAlternatives(transitInput);
    assert.ok(alts.some((a) => a.alternative.includes('Schedule Optimization')));
  });

  it('recommends urgent clean electric transition if unvented biomass/sigri is used', () => {
    const sigriInput = {
      primaryCommute: COMMUTE_MODES.PUBLIC_TRANSIT,
      cookingHeating: COOKING_HEATING.UNVENTED_SIGRI
    };
    const alts = generateSustainableAlternatives(sigriInput);
    assert.ok(alts.some((a) => a.category.includes('Clean Heating') && a.alternative.includes('Induction')));
  });
});

describe('Engine Module - generateWarnings', () => {
  it('triggers emergency alert for severe AQI >= 400', () => {
    const input = {
      aqiLevel: 450,
      vulnerableMembers: [],
      primaryCommute: COMMUTE_MODES.PUBLIC_TRANSIT,
      cookingHeating: COOKING_HEATING.INDUCTION_ELECTRIC
    };
    const warnings = generateWarnings(input);
    assert.ok(warnings.some((w) => w.severity === 'critical' && w.title.includes('Severe Smog Emergency')));
  });

  it('triggers very poor warning for AQI between 300 and 400', () => {
    const input = {
      aqiLevel: 340,
      vulnerableMembers: [],
      primaryCommute: COMMUTE_MODES.PUBLIC_TRANSIT,
      cookingHeating: COOKING_HEATING.INDUCTION_ELECTRIC
    };
    const warnings = generateWarnings(input);
    assert.ok(warnings.some((w) => w.severity === 'high' && w.title.includes('Very Poor Air Quality')));
  });

  it('triggers demographic alerts for elders, infants, and two-wheelers', () => {
    const input = {
      aqiLevel: 250,
      vulnerableMembers: [
        VULNERABLE_GROUPS.INFANTS_CHILDREN,
        VULNERABLE_GROUPS.ELDERLY,
        VULNERABLE_GROUPS.ASTHMATIC_RESPIRATORY
      ],
      primaryCommute: COMMUTE_MODES.TWO_WHEELER,
      cookingHeating: COOKING_HEATING.LPG_GAS
    };
    const warnings = generateWarnings(input);
    assert.ok(warnings.some((w) => w.title.includes('Infant & Child')));
    assert.ok(warnings.some((w) => w.title.includes('Senior Citizen')));
    assert.ok(warnings.some((w) => w.title.includes('Two-Wheeler Inhalation')));
  });

  it('triggers lethal Carbon Monoxide warning when biomass/sigri is selected', () => {
    const input = {
      aqiLevel: 200,
      vulnerableMembers: [],
      primaryCommute: COMMUTE_MODES.PUBLIC_TRANSIT,
      cookingHeating: COOKING_HEATING.BIOMASS_WOOD
    };
    const warnings = generateWarnings(input);
    assert.ok(warnings.some((w) => w.severity === 'critical' && w.title.includes('Carbon Monoxide')));
  });
});

describe('Engine Module - generateCommunityBlueprint', () => {
  it('generates collective RWA society initiatives', () => {
    const input = { userType: USER_TYPES.COMMUNITY };
    const blueprint = generateCommunityBlueprint(input);

    assert.ok(blueprint.initiatives.length >= 4);
    const headlines = blueprint.initiatives.map((i) => i.headline).join(' ');
    assert.ok(headlines.includes('No-Idling'));
    assert.ok(headlines.includes('Security Personnel'));
    assert.ok(headlines.includes('Clean-Air Club'));
    assert.ok(headlines.includes('Water Misting'));
  });
});

describe('Engine Module - generateAssessment End-to-End', () => {
  it('produces a complete, fully populated assessment object', () => {
    const input = {
      userType: USER_TYPES.FAMILY,
      city: 'Delhi NCR',
      areaType: AREA_TYPES.URBAN_CORE,
      aqiLevel: 420,
      householdSize: 4,
      housingType: HOUSING_TYPES.APARTMENT_HIGH_FLOOR,
      primaryCommute: COMMUTE_MODES.TWO_WHEELER,
      cookingHeating: COOKING_HEATING.LPG_GAS,
      vulnerableMembers: [
        VULNERABLE_GROUPS.INFANTS_CHILDREN,
        VULNERABLE_GROUPS.ASTHMATIC_RESPIRATORY
      ],
      budgetPreference: BUDGET_PREFERENCES.LOW_COST_DIY,
      notes: 'Need DIY purifier advice'
    };

    const assessment = generateAssessment(input);

    assert.ok(assessment.metadata);
    assert.ok(assessment.impact);
    assert.ok(assessment.diurnalRoutine);
    assert.ok(assessment.iaqHacks);
    assert.ok(assessment.sustainableAlternatives);
    assert.ok(assessment.warnings);
    assert.ok(assessment.communityBlueprint);
    assert.ok(assessment.summary);
    assert.ok(Array.isArray(assessment.aiIdeas));
  });
});
