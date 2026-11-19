/**
 * Centralized Constants for Prana - Urban Air Quality Assistant
 * Standardized against Central Pollution Control Board (CPCB), US EPA, and WHO benchmarks.
 */

export const APP_NAME = 'Prana Urban Air Quality Assistant';

/**
 * User / Entity Categories
 */
export const USER_TYPES = Object.freeze({
  FAMILY: 'family',
  COMMUNITY: 'community'
});

/**
 * Urban Area Environmental Profiles
 */
export const AREA_TYPES = Object.freeze({
  URBAN_CORE: 'urban_core',
  INDUSTRIAL_CORRIDOR: 'industrial_corridor',
  NEAR_HIGHWAY: 'near_highway',
  RESIDENTIAL_SUBURB: 'residential_suburb',
  GREEN_ZONE: 'green_zone'
});

/**
 * Housing Structural Types
 */
export const HOUSING_TYPES = Object.freeze({
  APARTMENT_HIGH_FLOOR: 'apartment_high_floor', // Floor 5+ (inversion layer exposure)
  APARTMENT_LOW_FLOOR: 'apartment_low_floor',   // Ground to 4th (street dust & vehicle exhaust)
  INDEPENDENT_HOUSE: 'independent_house',       // Multiple drafts / courtyards
  RENTED_BUDGET: 'rented_budget'               // Non-modifiable infrastructure (portable DIY hacks)
});

/**
 * Daily Commute Modes
 */
export const COMMUTE_MODES = Object.freeze({
  TWO_WHEELER: 'two_wheeler',         // Motorbike / scooter (highest direct exposure)
  PUBLIC_TRANSIT: 'public_transit',   // Metro / Electric Bus (low emissions, filtered cabin)
  PERSONAL_CAR: 'personal_car',       // AC cabin filter, high carbon footprint
  CARPOOL_CAB: 'carpool_cab',         // Shared vehicle
  ACTIVE_WALK_CYCLE: 'active_walk_cycle', // High respiration rate in ambient smog
  WORK_FROM_HOME: 'work_from_home'    // Shielded indoor stay
});

/**
 * Cooking & Heating Setups
 */
export const COOKING_HEATING = Object.freeze({
  INDUCTION_ELECTRIC: 'induction_electric', // Zero indoor combustion
  LPG_GAS: 'lpg_gas',                       // Clean combustion, requires kitchen exhaust
  BIOMASS_WOOD: 'biomass_wood',             // Extreme particulate & VOC hazard
  ELECTRIC_HEATER: 'electric_heater',       // Clean indoor warmth
  UNVENTED_SIGRI: 'unvented_sigri'          // Coal/wood brazier (severe CO & PM2.5 risk)
});

/**
 * Vulnerable Demographic Enums
 */
export const VULNERABLE_GROUPS = Object.freeze({
  INFANTS_CHILDREN: 'infants_children',
  ELDERLY: 'elderly',
  ASTHMATIC_RESPIRATORY: 'asthmatic_respiratory',
  PREGNANT: 'pregnant',
  OUTDOOR_COMMUTERS: 'outdoor_commuters',
  PETS: 'pets'
});

/**
 * Budget Approaches for IAQ Interventions
 */
export const BUDGET_PREFERENCES = Object.freeze({
  LOW_COST_DIY: 'low_cost_diy',       // DIY Corsi-Rosenthal box, draft stoppers, wet mopping
  BALANCED: 'balanced',               // HEPA air purifiers + DIY room sealing
  PREMIUM_AUTOMATED: 'premium_automated' // Smart automated purifiers, IAQ monitors, ERV/HRV systems
});

/**
 * AQI Breakpoints and Severity Bands (CPCB / WHO Standards)
 */
export const AQI_BANDS = Object.freeze({
  GOOD: { min: 0, max: 50, label: 'Good', pm25Baseline: 25, color: '#16A34A' },
  SATISFACTORY: { min: 51, max: 100, label: 'Satisfactory', pm25Baseline: 45, color: '#65A30D' },
  MODERATE: { min: 101, max: 200, label: 'Moderate', pm25Baseline: 80, color: '#D97706' },
  POOR: { min: 201, max: 300, label: 'Poor', pm25Baseline: 125, color: '#EA580C' },
  VERY_POOR: { min: 301, max: 400, label: 'Very Poor', pm25Baseline: 210, color: '#DC2626' },
  SEVERE: { min: 401, max: 999, label: 'Severe / Hazardous', pm25Baseline: 380, color: '#7F1D1D' }
});

/**
 * Quantitative Impact Factors & Mathematical Constants
 */
export const IMPACT_FACTORS = Object.freeze({
  // Berkeley Earth formula: 1 cigarette/day ≈ 22 µg/m³ of PM2.5 inhaled over 24 hours
  BERKELEY_EARTH_PM25_PER_CIGARETTE: 22.0,

  // Average human daily respiration volume in m³
  DAILY_INHALATION_VOLUME_M3: 15.0,

  // Infiltration factors (proportion of ambient PM2.5 entering indoors)
  UNSEALED_INFILTRATION: 0.70,
  WEATHER_SEALED_INFILTRATION: 0.35,

  // Filtration efficiency factors
  DIY_CORSI_ROSENTHAL_EFFICIENCY: 0.80, // 80% indoor PM2.5 reduction
  COMMERCIAL_HEPA_EFFICIENCY: 0.85,    // 85% indoor PM2.5 reduction
  WET_MOP_RESUSPENSION_REDUCTION: 0.40, // 40% reduction in resuspended PM10
  KITCHEN_EXHAUST_REDUCTION: 0.75,      // 75% reduction in cooking emissions
  N95_MASK_COMMUTE_EFFICIENCY: 0.85,    // 85% filtration of inhaled ambient PM2.5

  // Emission offsets (kg CO2 per passenger-km)
  CAR_CO2_PER_KM: 0.170,
  TWO_WHEELER_CO2_PER_KM: 0.050,
  METRO_CO2_PER_KM: 0.015,
  AVERAGE_DAILY_COMMUTE_KM: 20,

  // Financial benchmarks in INR
  DIY_CORSI_ROSENTHAL_COST_INR: 2200,
  COMMERCIAL_PURIFIER_COST_INR: 16000,
  ANNUAL_NEBULIZER_SAVINGS_INR: 4500
});

/**
 * Input Limits for Validation and Abuse Prevention
 */
export const INPUT_LIMITS = Object.freeze({
  MIN_HOUSEHOLD_SIZE: 1,
  MAX_HOUSEHOLD_SIZE: 10000,
  MIN_AQI: 10,
  MAX_AQI: 999,
  MAX_CITY_LENGTH: 80,
  MAX_NOTES_LENGTH: 500,
  MAX_BODY_BYTES: 65536 // 64 KB
});

/**
 * Curated City Presets for Quick Demo
 */
export const SAMPLE_PRESETS = Object.freeze([
  {
    id: 'preset-delhi-family',
    title: 'Delhi NCR Severe Smog Family',
    description: 'High-floor apartment with asthmatic child & elderly grandparent in severe winter smog (AQI 420).',
    data: {
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
        VULNERABLE_GROUPS.ELDERLY,
        VULNERABLE_GROUPS.ASTHMATIC_RESPIRATORY
      ],
      budgetPreference: BUDGET_PREFERENCES.LOW_COST_DIY,
      notes: 'Need low-cost DIY air purifier hacks under ₹2,500. Asthmatic 7yo child has morning school bus commute.'
    }
  },
  {
    id: 'preset-mumbai-commuter',
    title: 'Mumbai Two-Wheeler Commuter',
    description: 'Daily 25km motorbike commuter living near highway seeking personal exposure defense.',
    data: {
      userType: USER_TYPES.FAMILY,
      city: 'Mumbai',
      areaType: AREA_TYPES.NEAR_HIGHWAY,
      aqiLevel: 240,
      householdSize: 2,
      housingType: HOUSING_TYPES.RENTED_BUDGET,
      primaryCommute: COMMUTE_MODES.TWO_WHEELER,
      cookingHeating: COOKING_HEATING.INDUCTION_ELECTRIC,
      vulnerableMembers: [
        VULNERABLE_GROUPS.OUTDOOR_COMMUTERS
      ],
      budgetPreference: BUDGET_PREFERENCES.LOW_COST_DIY,
      notes: 'Daily 25km motorcycle commute in heavy traffic. Rented flat so cannot make structural alterations.'
    }
  },
  {
    id: 'preset-rwa-community',
    title: 'Noida / Gurugram Society RWA',
    description: '180-flat residential welfare association looking for community-wide anti-smog gate policies.',
    data: {
      userType: USER_TYPES.COMMUNITY,
      city: 'Gurugram / Noida',
      areaType: AREA_TYPES.RESIDENTIAL_SUBURB,
      aqiLevel: 460,
      householdSize: 650,
      housingType: HOUSING_TYPES.APARTMENT_HIGH_FLOOR,
      primaryCommute: COMMUTE_MODES.PERSONAL_CAR,
      cookingHeating: COOKING_HEATING.LPG_GAS,
      vulnerableMembers: [
        VULNERABLE_GROUPS.ELDERLY,
        VULNERABLE_GROUPS.INFANTS_CHILDREN,
        VULNERABLE_GROUPS.OUTDOOR_COMMUTERS
      ],
      budgetPreference: BUDGET_PREFERENCES.BALANCED,
      notes: 'RWA committee looking to implement society gate anti-idling, guard warmth without burning trash, and community clean-air shelter.'
    }
  },
  {
    id: 'preset-bengaluru-eco',
    title: 'Bengaluru Suburban Eco Home',
    description: 'Eco-conscious family looking for sustainable commute and indoor botanical filtration.',
    data: {
      userType: USER_TYPES.FAMILY,
      city: 'Bengaluru',
      areaType: AREA_TYPES.RESIDENTIAL_SUBURB,
      aqiLevel: 135,
      householdSize: 3,
      housingType: HOUSING_TYPES.INDEPENDENT_HOUSE,
      primaryCommute: COMMUTE_MODES.PUBLIC_TRANSIT,
      cookingHeating: COOKING_HEATING.INDUCTION_ELECTRIC,
      vulnerableMembers: [
        VULNERABLE_GROUPS.PETS
      ],
      budgetPreference: BUDGET_PREFERENCES.BALANCED,
      notes: 'Family with two rescue dogs. Want natural air-purifying plant routines, composting, and zero-emission heating.'
    }
  }
]);
