/**
 * Deterministic Engine for Prana Urban Air Quality Assistant
 * Computes exact quantitative impact metrics, diurnal routines, room-by-room IAQ hacks,
 * sustainable alternatives, and community blueprints based on scientific benchmarks.
 */

import {
  AQI_BANDS,
  IMPACT_FACTORS,
  USER_TYPES,
  AREA_TYPES,
  HOUSING_TYPES,
  COMMUTE_MODES,
  COOKING_HEATING,
  VULNERABLE_GROUPS,
  BUDGET_PREFERENCES
} from './constants.js';

/**
 * Maps an AQI number to its corresponding CPCB/WHO standard band.
 *
 * @param {number} aqi
 * @returns {typeof AQI_BANDS[keyof typeof AQI_BANDS]}
 */
export function getAqiBand(aqi) {
  const numericAqi = Number(aqi) || 50;
  if (numericAqi <= 50) return AQI_BANDS.GOOD;
  if (numericAqi <= 100) return AQI_BANDS.SATISFACTORY;
  if (numericAqi <= 200) return AQI_BANDS.MODERATE;
  if (numericAqi <= 300) return AQI_BANDS.POOR;
  if (numericAqi <= 400) return AQI_BANDS.VERY_POOR;
  return AQI_BANDS.SEVERE;
}

/**
 * Estimates baseline ambient PM2.5 concentration (µg/m³) from AQI based on standard breakpoint curves.
 *
 * @param {number} aqi
 * @returns {number} Estimated PM2.5 in µg/m³
 */
export function estimateAmbientPm25(aqi) {
  const numericAqi = Math.max(10, Math.min(999, Number(aqi) || 100));

  if (numericAqi <= 50) {
    return Math.round(numericAqi * 0.6);
  }
  if (numericAqi <= 100) {
    return Math.round(30 + (numericAqi - 50) * 0.6);
  }
  if (numericAqi <= 200) {
    return Math.round(60 + (numericAqi - 100) * 0.3);
  }
  if (numericAqi <= 300) {
    return Math.round(90 + (numericAqi - 200) * 0.3);
  }
  if (numericAqi <= 400) {
    return Math.round(120 + (numericAqi - 300) * 1.3);
  }
  return Math.round(250 + (numericAqi - 400) * 1.15);
}

/**
 * Calculates direct quantitative impact metrics:
 * - Baseline vs. Protected PM2.5 exposure (µg/m³)
 * - Exposure reduction percentage
 * - Daily cigarette equivalents avoided (Berkeley Earth formula)
 * - Monthly carbon (CO2) and particulate matter (PM10) emissions averted
 * - Estimated financial savings in INR
 *
 * @param {Object} input - Sanitized assessment input
 * @returns {Object} Comprehensive direct impact metrics
 */
export function calculateDirectImpact(input) {
  const ambientPm25 = estimateAmbientPm25(input.aqiLevel);

  // 1. Commute exposure factor
  let commuteExposureFactor = 0.5; // default
  let commuteDailyKm = IMPACT_FACTORS.AVERAGE_DAILY_COMMUTE_KM;

  switch (input.primaryCommute) {
    case COMMUTE_MODES.TWO_WHEELER:
      commuteExposureFactor = 1.35; // Direct tailpipe plume inhalation
      break;
    case COMMUTE_MODES.ACTIVE_WALK_CYCLE:
      commuteExposureFactor = 1.20; // High ventilation volume
      break;
    case COMMUTE_MODES.PERSONAL_CAR:
      commuteExposureFactor = 0.60; // Partial cabin infiltration
      break;
    case COMMUTE_MODES.CARPOOL_CAB:
      commuteExposureFactor = 0.55;
      break;
    case COMMUTE_MODES.PUBLIC_TRANSIT:
      commuteExposureFactor = 0.35; // Sealed metro / AC bus
      break;
    case COMMUTE_MODES.WORK_FROM_HOME:
      commuteExposureFactor = 0.0;
      commuteDailyKm = 0;
      break;
  }

  // 2. Indoor baseline infiltration
  let indoorInfiltration = IMPACT_FACTORS.UNSEALED_INFILTRATION;
  if (input.housingType === HOUSING_TYPES.APARTMENT_HIGH_FLOOR) {
    indoorInfiltration += 0.05; // Thermal inversion stagnation at elevation
  } else if (input.housingType === HOUSING_TYPES.RENTED_BUDGET) {
    indoorInfiltration += 0.08; // Older windows / loose draft clearances
  }

  // 3. Indoor cooking addition
  let cookingAddition = 10;
  if (input.cookingHeating === COOKING_HEATING.BIOMASS_WOOD || input.cookingHeating === COOKING_HEATING.UNVENTED_SIGRI) {
    cookingAddition = 110;
  } else if (input.cookingHeating === COOKING_HEATING.LPG_GAS) {
    cookingAddition = 22;
  } else if (input.cookingHeating === COOKING_HEATING.INDUCTION_ELECTRIC) {
    cookingAddition = 5;
  }

  // Weighted baseline daily exposure (20h indoor + 2h commute + 2h ambient)
  const indoorBaselinePm25 = ambientPm25 * indoorInfiltration + cookingAddition;
  const commuteBaselinePm25 = ambientPm25 * commuteExposureFactor;
  const baselineExposure = Math.round((indoorBaselinePm25 * 20 + commuteBaselinePm25 * 2 + ambientPm25 * 2) / 24);

  // 4. Protected exposure after Prana interventions
  // - Weather-stripping reduces infiltration
  // - DIY Corsi-Rosenthal or HEPA air purifier cuts indoor particulate by 80%
  // - N95 mask / commute shift cuts commute exposure by 85%
  // - Kitchen exhaust protocol cuts cooking addition by 75%
  const protectedInfiltration = IMPACT_FACTORS.WEATHER_SEALED_INFILTRATION;
  const purifierEfficiency = input.budgetPreference === BUDGET_PREFERENCES.PREMIUM_AUTOMATED
    ? IMPACT_FACTORS.COMMERCIAL_HEPA_EFFICIENCY
    : IMPACT_FACTORS.DIY_CORSI_ROSENTHAL_EFFICIENCY;

  const protectedCookingAddition = cookingAddition * (1 - IMPACT_FACTORS.KITCHEN_EXHAUST_REDUCTION);
  const indoorCleanPm25 = (ambientPm25 * protectedInfiltration * (1 - purifierEfficiency)) + protectedCookingAddition;
  
  let protectedCommutePm25 = commuteBaselinePm25;
  if (input.primaryCommute === COMMUTE_MODES.TWO_WHEELER || input.primaryCommute === COMMUTE_MODES.ACTIVE_WALK_CYCLE) {
    // With N95 mask
    protectedCommutePm25 = ambientPm25 * (1 - IMPACT_FACTORS.N95_MASK_COMMUTE_EFFICIENCY);
  } else if (input.primaryCommute === COMMUTE_MODES.PERSONAL_CAR) {
    // With internal recirculation
    protectedCommutePm25 = ambientPm25 * 0.25;
  }

  const protectedAmbientShort = ambientPm25 * 0.25; // Brief outdoor exposure with N95
  const protectedExposure = Math.max(12, Math.round((indoorCleanPm25 * 20 + protectedCommutePm25 * 2 + protectedAmbientShort * 2) / 24));

  // Exposure reduction percentage
  const exposureReductionPercent = Math.max(0, Math.min(95, Math.round(((baselineExposure - protectedExposure) / baselineExposure) * 100)));

  // Berkeley Earth Cigarette Equivalence: 22 µg/m³ of PM2.5 over 24h ≈ 1 cigarette
  const baselineCigarettes = Number((baselineExposure / IMPACT_FACTORS.BERKELEY_EARTH_PM25_PER_CIGARETTE).toFixed(1));
  const protectedCigarettes = Number((protectedExposure / IMPACT_FACTORS.BERKELEY_EARTH_PM25_PER_CIGARETTE).toFixed(1));
  const cigarettesSavedDaily = Math.max(0, Number((baselineCigarettes - protectedCigarettes).toFixed(1)));

  // Carbon and Emission Offsets (per month)
  // Shift to public transit or carpooling + anti-idling
  let monthlyCo2SavedKg = 0;
  if (input.primaryCommute === COMMUTE_MODES.PERSONAL_CAR) {
    // Shifting to metro / carpooling 3 days a week
    monthlyCo2SavedKg = Math.round((IMPACT_FACTORS.CAR_CO2_PER_KM - IMPACT_FACTORS.METRO_CO2_PER_KM) * commuteDailyKm * 14);
  } else if (input.primaryCommute === COMMUTE_MODES.TWO_WHEELER) {
    monthlyCo2SavedKg = Math.round((IMPACT_FACTORS.TWO_WHEELER_CO2_PER_KM - IMPACT_FACTORS.METRO_CO2_PER_KM) * commuteDailyKm * 14);
  }
  // Anti-idling at traffic stops saves additional ~3.5 kg CO2/month
  monthlyCo2SavedKg += 4;

  // Localized PM10 prevented from avoiding open leaf/waste burning and dry sweeping (grams/month)
  const monthlyPmPreventedGrams = Math.round(80 + (input.householdSize * 15));

  // Financial Savings
  const commercialPurifierCount = Math.max(1, Math.min(4, Math.ceil(input.householdSize / 2)));
  const diySavings = (IMPACT_FACTORS.COMMERCIAL_PURIFIER_COST_INR - IMPACT_FACTORS.DIY_CORSI_ROSENTHAL_COST_INR) * commercialPurifierCount;
  const nebulizerSavings = input.vulnerableMembers.includes(VULNERABLE_GROUPS.ASTHMATIC_RESPIRATORY)
    ? IMPACT_FACTORS.ANNUAL_NEBULIZER_SAVINGS_INR
    : 1500;
  const totalFinancialSavingsInr = diySavings + nebulizerSavings;

  return {
    ambientPm25,
    baselineExposure,
    protectedExposure,
    exposureReductionPercent,
    baselineCigarettes,
    protectedCigarettes,
    cigarettesSavedDaily,
    monthlyCo2SavedKg,
    monthlyPmPreventedGrams,
    totalFinancialSavingsInr
  };
}

/**
 * Generates an optimized Diurnal Daily Routine structured around winter thermal inversion cycles.
 *
 * @param {Object} input - Sanitized assessment input
 * @returns {Array<Object>} Chronological daily schedule blocks
 */
export function generateDiurnalRoutine(input) {
  const isSevere = input.aqiLevel >= 400;
  const hasKids = input.vulnerableMembers.includes(VULNERABLE_GROUPS.INFANTS_CHILDREN);
  const hasAsthma = input.vulnerableMembers.includes(VULNERABLE_GROUPS.ASTHMATIC_RESPIRATORY);
  const hasElders = input.vulnerableMembers.includes(VULNERABLE_GROUPS.ELDERLY);

  return [
    {
      period: 'Early Morning (06:00 - 09:30)',
      phase: 'Severe Thermal Inversion Peak',
      badge: 'High Hazard Window',
      badgeClass: 'badge-danger',
      icon: '🌫️',
      summary: 'Cold night air traps nocturnal vehicular exhaust and soot within the lowest 50 meters of the atmosphere.',
      actions: [
        'Keep all external doors, balcony sliders, and windows strictly sealed.',
        hasAsthma || hasElders
          ? 'Strictly avoid morning walks or outdoor exercise; shift physical stretches to the indoor clean air sanctuary.'
          : 'Avoid outdoor cardio/running; indoor breathing rate is 3x safer during inversion peaks.',
        hasKids
          ? 'School Commute: Fasten certified N95 masks before stepping into hallways; keep school van/bus windows shut.'
          : 'Commute Protocol: Fit an N95 mask before leaving home; do not remove it at transit stops.',
        'Run your DIY Corsi-Rosenthal box or HEPA purifier in active daytime living areas.'
      ]
    },
    {
      period: 'Midday (11:30 - 15:00)',
      phase: 'Solar Convection Clearing Window',
      badge: 'Optimal Ventilation Slot',
      badgeClass: 'badge-success',
      icon: '☀️',
      summary: 'Solar surface warming lifts the boundary layer, diluting ground-level particulate matter to its daily low.',
      actions: [
        isSevere
          ? 'Ambient AQI remains hazardous (>400): Avoid full window opening; use quick 5-minute single-direction air flush only.'
          : 'Safest window for a controlled 20-30 minute cross-ventilation airing if local AQI is below 250.',
        'Optimal time for outdoor grocery runs, laundry drying, and essential errands.',
        'Perform damp-cloth wipe downs of window sills and balcony entry ledges to trap settled soot.',
        'Place air-purifying indoor plants (Snake Plant, Areca Palm) near bright natural light for peak photosynthesis.'
      ]
    },
    {
      period: 'Evening Rush (17:00 - 20:30)',
      phase: 'Traffic Congestion & Secondary Inversion',
      badge: 'Evening Smog Spike',
      badgeClass: 'badge-warning',
      icon: '🚗',
      summary: 'Dropping evening temperatures combine with peak traffic volumes, trapping fresh nitrogen oxides and black carbon.',
      actions: [
        'Seal all windows and exterior vents before 17:00 as temperatures begin cooling.',
        input.primaryCommute === COMMUTE_MODES.PERSONAL_CAR
          ? 'Switch vehicle air conditioning strictly to "Internal Recirculation Mode" to prevent drafting exhaust into the cabin.'
          : 'Wear an N95/FFP2 mask throughout public transit corridors and auto/cab waits.',
        'Turn on kitchen exhaust fan 3 minutes BEFORE cooking dinner; cover frying pans with lids to avoid indoor PM2.5 spikes.',
        'Establish a "Shoe Drop Zone" at your entry doorway to prevent tracking toxic road dust into bedrooms.'
      ]
    },
    {
      period: 'Night & Sleep (21:00 - 06:00)',
      phase: 'Clean Air Sleep Sanctuary',
      badge: 'Recovery Sanctuary',
      badgeClass: 'badge-primary',
      icon: '🌙',
      summary: 'Your respiratory system spends 8 hours resting; maintaining pristine air quality allows mucosal cilia recovery.',
      actions: [
        'Designate the primary bedroom as a Clean Air Sanctuary: Keep room door closed and run air filtration continuously on low.',
        'Maintain indoor relative humidity between 40% and 50% using a damp towel or cool-mist humidifier to drop airborne aerosols.',
        'Strictly eliminate mosquito coils, incense sticks (agarbatti), or scented candles—they emit toxic benzene, formaldehyde, and heavy PM2.5.',
        input.cookingHeating === COOKING_HEATING.UNVENTED_SIGRI || input.cookingHeating === COOKING_HEATING.BIOMASS_WOOD
          ? 'CRITICAL WARNING: NEVER sleep with coal/wood sigri or charcoal braziers indoors—deadly Carbon Monoxide (CO) poisoning risk.'
          : 'Use radiant electric room heaters or warm microfiber quilts for clean, emission-free nighttime heating.'
      ]
    }
  ];
}

/**
 * Generates actionable, room-by-room Indoor Air Quality (IAQ) hacks and DIY blueprints.
 *
 * @param {Object} input - Sanitized assessment input
 * @returns {Array<Object>} List of categorized IAQ hacks
 */
export function generateIaqHacks(input) {
  const isRented = input.housingType === HOUSING_TYPES.RENTED_BUDGET;

  return [
    {
      id: 'hack-diy-purifier',
      category: 'Air Filtration',
      title: 'Build a DIY Corsi-Rosenthal / HEPA Box Fan Cleaner',
      cost: '₹2,200 (vs ₹16,000 commercial unit)',
      impact: '80% indoor PM2.5 reduction',
      steps: [
        'Procure a standard 12-inch or 16-inch square household box fan and a MERV-13 or H13 HEPA furnace filter panel.',
        'Seal the filter to the back (intake) of the fan with duct tape, ensuring the airflow arrow on the filter points TOWARDS the fan blades.',
        'Add a cardboard shroud ring (diameter 80% of fan blade) to the front face to prevent vortex backflow.',
        'Run on medium speed in your bedroom or living space: Delivers 300+ m³/h Clean Air Delivery Rate (CADR).'
      ],
      diyTag: 'Top Budget Hack'
    },
    {
      id: 'hack-wet-mopping',
      category: 'Cleaning Protocols',
      title: 'Microfiber Damp-Mopping (Strictly No Dry Sweeping)',
      cost: '₹150 (Zero equipment upgrade)',
      impact: 'Eliminates 40% resuspended toxic dust',
      steps: [
        'Dry sweeping with traditional grass brooms flings settled heavy-metal particles and soot back into human breathing height.',
        'Always use a damp microfiber mop with warm water and a splash of vinegar or mild soap.',
        'Mop twice daily during severe winter smog episodes: once at 10:00 AM and once at 18:00 PM.',
        'Damp-wipe shelves, television consoles, and fan blades weekly rather than feather-dusting.'
      ],
      diyTag: 'Immediate Zero-Cost'
    },
    {
      id: 'hack-kitchen-exhaust',
      category: 'Kitchen Smog Control',
      title: 'Kitchen Pre-Exhaust & Tadka Shielding',
      cost: '₹0 (Behavioral)',
      impact: 'Reduces indoor VOC/particulate spikes by 75%',
      steps: [
        'Indian tadka (tempering spices in mustard/ghee) generates massive indoor PM2.5 concentrations exceeding 500 µg/m³.',
        'Turn on the kitchen chimney or exhaust fan 3 minutes BEFORE lighting the gas stove to establish negative pressure.',
        'Always place a splatter lid over pans while tempering spices, and close kitchen doors to isolate living areas.',
        'Keep exhaust running for 10 minutes AFTER cooking is complete to evacuate all aerosolized ultrafine oils.'
      ],
      diyTag: 'Health Essential'
    },
    {
      id: 'hack-weather-stripping',
      category: 'Room Infiltration Sealing',
      title: 'Self-Adhesive Draft Stripping & Door Sweeps',
      cost: isRented ? '₹250 (Non-damaging peelable)' : '₹450',
      impact: 'Cuts outdoor smog infiltration by 50%',
      steps: [
        'Apply self-adhesive high-density foam rubber weather-stripping along the perimeter of balcony doors and sliding windows.',
        'Install removable fabric draught-stopper snakes or silicone sweeps along the bottom threshold of the main entry door.',
        'Close window trickle vents and cover non-essential exhaust gaps with removable plastic cling sheets during peak smog months.',
        'Creates an airtight seal that enables indoor purifiers to maintain <30 µg/m³ indoor air.'
      ],
      diyTag: 'Structure Hack'
    },
    {
      id: 'hack-botanical-filters',
      category: 'Natural Air Purification',
      title: 'Botanical Plant Trio (Areca, Snake, Spider)',
      cost: '₹400 - ₹800',
      impact: 'Passive CO2 reduction & ambient humidity balancing',
      steps: [
        'Areca Palm (Chrysalidocarpus lutescens): Excellent daytime oxygen producer and natural humidifier (place 4 shoulder-high plants per person in living areas).',
        'Snake Plant / Sansevieria (Mother-in-law’s tongue): Uses CAM photosynthesis to absorb CO2 and release oxygen at NIGHT (ideal for bedrooms).',
        'Spider Plant & Money Plant: Actively metabolize indoor formaldehyde, benzene, and xylene from furniture laminates.',
        'Wipe plant leaves with a damp cloth weekly so dust does not block leaf stomata.'
      ],
      diyTag: 'Natural Living'
    },
    {
      id: 'hack-shoe-barrier',
      category: 'Entryway Isolation',
      title: 'Exterior Shoe Drop & Microfiber Mat Sanctuary',
      cost: '₹200',
      impact: 'Prevents 85% of outdoor soot from entering living rugs',
      steps: [
        'Place a heavy coir scrape mat outside the front door and a washable microfiber trap mat immediately inside.',
        'Enforce a strict "No Shoes Past the Entry" policy to keep carcinogenic road grime and brake-dust out of carpets.',
        'Change out of commute clothing upon returning home; store worn outer jackets in a closed entryway closet.'
      ],
      diyTag: 'Sanctuary Protocol'
    }
  ];
}

/**
 * Generates sustainable low-emission alternatives tailored to the user's lifestyle.
 *
 * @param {Object} input - Sanitized assessment input
 * @returns {Array<Object>} Sustainable lifestyle alternatives
 */
export function generateSustainableAlternatives(input) {
  const alternatives = [];

  // 1. Commute Alternative
  if (input.primaryCommute === COMMUTE_MODES.TWO_WHEELER || input.primaryCommute === COMMUTE_MODES.PERSONAL_CAR) {
    alternatives.push({
      category: 'Commute & Mobility',
      current: input.primaryCommute === COMMUTE_MODES.PERSONAL_CAR ? 'Single-Occupancy Petrol/Diesel Car' : 'Two-Wheeler Commute',
      alternative: 'Electric Metro / AC Bus + Smart Carpooling',
      impactMetric: 'Saves 35-70 kg CO2/month & cuts direct toxic inhalation by 70%',
      actionPoints: [
        'Shift 3 days per week to the local metro network or electric feeder shuttle.',
        'Enforce Anti-Idling: Turn off vehicle engine at red lights whenever the wait timer is >15 seconds.',
        'If driving, ensure cabin pollen filter is upgraded to HEPA/activated carbon and keep AC on recirculation mode.'
      ]
    });
  } else {
    alternatives.push({
      category: 'Commute & Mobility',
      current: 'Public Transit / Active Commute',
      alternative: 'Route & Schedule Optimization',
      impactMetric: 'Eliminates peak-hour exposure bursts',
      actionPoints: [
        'Shift commute timings by 30 minutes earlier or later to avoid maximum traffic exhaust concentrations.',
        'Choose underground metro lines or segregated green corridors over congested flyovers.',
        'Always equip certified N95 masks when walking along arterial roads.'
      ]
    });
  }

  // 2. Heating & Cooking Alternative
  if (input.cookingHeating === COOKING_HEATING.BIOMASS_WOOD || input.cookingHeating === COOKING_HEATING.UNVENTED_SIGRI) {
    alternatives.push({
      category: 'Clean Heating & Cooking',
      current: 'Biomass / Unvented Charcoal Sigri',
      alternative: 'Portable Induction Cooktop & Oil-Filled Electric Radiator',
      impactMetric: 'Eliminates 100% of indoor Carbon Monoxide and toxic soot',
      actionPoints: [
        'Transition from open biomass or coal brazier to an oil-filled electric radiator (safe, silent, zero indoor combustion).',
        'Adopt an affordable 2000W induction cooktop (₹1,800) for daily boiling and heating needs.',
        'Never burn treated scrap wood, furniture ply, or plastic packaging for warmth.'
      ]
    });
  } else {
    alternatives.push({
      category: 'Clean Energy & Heating',
      current: 'Standard LPG / Electric Heater',
      alternative: 'Zoned Radiant Heating & Induction Transition',
      impactMetric: 'Cuts household energy consumption by 25% while maintaining zero indoor emissions',
      actionPoints: [
        'Heat only occupied rooms using ceramic PTC heaters rather than whole-apartment heating.',
        'Layer with thermal fleece blankets and thick window drapes to retain natural daytime heat.',
        'Transition routine boiling and milk heating to induction to minimize gas consumption.'
      ]
    });
  }

  // 3. Waste & Community Alternative
  alternatives.push({
    category: 'Waste Management & Composting',
    current: 'Municipal Waste Disposal / Garden Sweeping',
    alternative: 'On-Site Organic Composting (Strictly Anti-Burning)',
    impactMetric: 'Prevents localized burning of dried leaves and cuts community PM10 by 30%',
    actionPoints: [
      'Never burn dry autumn leaves or garden trimmings—burning garden waste produces dense carcinogenic polycyclic aromatic hydrocarbons (PAHs).',
      'Set up a simple wire-mesh leaf mold composting ring in the backyard or society corner.',
      'RWA coordination: Request municipal green waste shredding vehicles instead of roadside dumping.'
    ]
  });

  return alternatives;
}

/**
 * Generates tailored contextual warnings and health advisories.
 *
 * @param {Object} input - Sanitized assessment input
 * @returns {Array<Object>} List of contextual advisories
 */
export function generateWarnings(input) {
  const warnings = [];

  // Severe Smog Advisory
  if (input.aqiLevel >= 400) {
    warnings.push({
      severity: 'critical',
      title: '🚨 Severe Smog Emergency Advisory (AQI 400+)',
      message: 'Air quality in your area has breached emergency thresholds. Ambient particulate matter is at hazardous concentrations. Cease all outdoor non-essential physical exertion. Keep all domestic windows locked round-the-clock.'
    });
  } else if (input.aqiLevel >= 300) {
    warnings.push({
      severity: 'high',
      title: '⚠️ Very Poor Air Quality Alert (AQI 300 - 400)',
      message: 'Prolonged exposure will cause respiratory illness in healthy individuals and severe distress to vulnerable groups. Enforce indoor air purification and N95 masking.'
    });
  }

  // Vulnerable Group Alerts
  if (input.vulnerableMembers.includes(VULNERABLE_GROUPS.ASTHMATIC_RESPIRATORY)) {
    warnings.push({
      severity: 'critical',
      title: '🫁 Respiratory Condition Alert (Asthma / COPD)',
      message: 'Winter smog exacerbates bronchial spasms. Keep rescue bronchodilator inhalers within arm’s reach at all times. Consult your pulmonologist regarding preventive corticosteroid dosage adjustment during high-smog weeks.'
    });
  }

  if (input.vulnerableMembers.includes(VULNERABLE_GROUPS.INFANTS_CHILDREN)) {
    warnings.push({
      severity: 'high',
      title: '👶 Infant & Child Protection Advisory',
      message: 'Children breathe 50% more air per kilogram of body weight than adults and their lung alveoli are actively developing. Strictly prohibit early morning school ground drills and ensure indoor classroom air filters are operational.'
    });
  }

  if (input.vulnerableMembers.includes(VULNERABLE_GROUPS.ELDERLY)) {
    warnings.push({
      severity: 'high',
      title: '👵 Senior Citizen Cardiovascular Advisory',
      message: 'Fine PM2.5 crosses alveolar membranes directly into the bloodstream, triggering vascular inflammation, elevated blood pressure, and stroke risks. Cancel early morning park walks and schedule indoor walking in filtered rooms.'
    });
  }

  if (input.primaryCommute === COMMUTE_MODES.TWO_WHEELER) {
    warnings.push({
      severity: 'medium',
      title: '🛵 Two-Wheeler Inhalation Exposure Alert',
      message: 'Riding a motorcycle or scooter in urban traffic places your breathing zone directly in the exhaust plume of heavy vehicles. Standard cloth or surgical masks provide under 15% protection against PM2.5. Always wear a well-fitted, certified N95 or FFP2 respirator with tight nose clips.'
    });
  }

  if (input.cookingHeating === COOKING_HEATING.UNVENTED_SIGRI || input.cookingHeating === COOKING_HEATING.BIOMASS_WOOD) {
    warnings.push({
      severity: 'critical',
      title: '☠️ Lethal Carbon Monoxide (CO) Hazard',
      message: 'Burning unvented coal, wood, or charcoal inside enclosed rooms creates lethal Carbon Monoxide (CO) concentrations. CO is odorless, colorless, and can cause fatal asphyxiation during sleep. Replace with electric heaters immediately.'
    });
  }

  return warnings;
}

/**
 * Generates community-scale initiatives for Residential Welfare Associations (RWAs) and societies.
 *
 * @param {Object} input - Sanitized assessment input
 * @returns {Object} Community action blueprint
 */
export function generateCommunityBlueprint(input) {
  const isCommunity = input.userType === USER_TYPES.COMMUNITY;

  return {
    scale: isCommunity ? 'Community / RWA Society Scale' : 'Neighborhood Collective Action',
    title: 'Community Clean Air Blueprint',
    initiatives: [
      {
        id: 'comm-anti-idling',
        pillar: 'Traffic & Gates',
        headline: 'Society Gate No-Idling Enforcement',
        detail: 'School buses, delivery vans, and resident cabs idling at entry barriers create dense localized PM2.5 hotspots. Install "No Idling Zone" signs and instruct security to enforce engine shutdown for stops >15 seconds.'
      },
      {
        id: 'comm-guard-welfare',
        pillar: 'Security Welfare',
        headline: 'Dignified Electric Warming for Security Personnel',
        detail: 'Night security guards frequently burn wood scraps, leaves, and plastic packaging to stay warm in winter. The RWA must provide radiant quartz/ceramic heaters, warm thermal jackets, and hot beverage stations to eliminate open fires completely.'
      },
      {
        id: 'comm-shelter',
        pillar: 'Civic Protection',
        headline: 'Designate Community Clean-Air Club Sanctuary',
        detail: 'Equip the society clubhouse or library with commercial HEPA units or multi-fan Corsi-Rosenthal boxes. Provide a safe clean-air sanctuary for senior citizens and children during severe (AQI 400+) emergency days.'
      },
      {
        id: 'comm-dust-misting',
        pillar: 'Dust Mitigation',
        headline: 'Anti-Dust Water Misting on Paved Pathways',
        detail: 'Instruct grounds staff to lightly mist paved internal roads and driveways with recycled STP water at 10:00 AM daily to suppress dust resuspension without creating mud puddles.'
      },
      {
        id: 'comm-green-screens',
        pillar: 'Botanical Barriers',
        headline: 'Perimeter Bamboo & Dense Hedge Smog Buffers',
        detail: 'Plant dense evergreen hedges (such as Bougainvillea, Bamboo, and Ficus) along the society perimeter facing heavy traffic highways to trap road soot before it reaches residential towers.'
      }
    ]
  };
}

/**
 * Generates the complete, deterministic assessment and action plan.
 *
 * @param {Object} input - Sanitized assessment input
 * @returns {Object} Complete assessment payload
 */
export function generateAssessment(input) {
  const aqiBand = getAqiBand(input.aqiLevel);
  const impact = calculateDirectImpact(input);
  const diurnalRoutine = generateDiurnalRoutine(input);
  const iaqHacks = generateIaqHacks(input);
  const sustainableAlternatives = generateSustainableAlternatives(input);
  const warnings = generateWarnings(input);
  const communityBlueprint = generateCommunityBlueprint(input);

  const defaultSummary = `Tailored Urban Air Quality Assessment for ${input.city} (${aqiBand.label} AQI ${input.aqiLevel}). Implementing diurnal smog scheduling and room-by-room DIY air filtration reduces your family's PM2.5 inhalation exposure by ${impact.exposureReductionPercent}%, equivalent to eliminating ${impact.cigarettesSavedDaily} cigarettes worth of inhaled toxic particulate daily.`;

  return {
    metadata: {
      generatedAt: new Date().toISOString(),
      appName: 'Prana Urban Air Quality Assistant',
      version: '1.0.0',
      city: input.city,
      aqiLevel: input.aqiLevel,
      aqiBand
    },
    input,
    impact,
    diurnalRoutine,
    iaqHacks,
    sustainableAlternatives,
    warnings,
    communityBlueprint,
    summary: defaultSummary,
    aiIdeas: [
      `Deploy a DIY Corsi-Rosenthal box fan in your primary bedroom to cut particulate infiltration by 80% at a fraction of commercial cost.`,
      `Strictly observe the midday ventilation window (11:30 - 15:00) when solar warming breaks the ground inversion layer.`,
      `Adopt the kitchen pre-exhaust protocol to prevent toxic oil aerosols from compounding outdoor smog.`
    ],
    aiEnriched: false,
    aiNotice: 'Operating in deterministic offline mode (no API key configured).'
  };
}

/**
 * Backward compatibility alias for generatePlan
 */
export const generatePlan = generateAssessment;

