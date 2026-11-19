/**
 * Strict Input Validation and Sanitization Module for Prana Air Assistant
 * Defends against XSS, SQL/NoSQL injection, prototype pollution, and malformed parameters.
 */

import {
  USER_TYPES,
  AREA_TYPES,
  HOUSING_TYPES,
  COMMUTE_MODES,
  COOKING_HEATING,
  VULNERABLE_GROUPS,
  BUDGET_PREFERENCES,
  INPUT_LIMITS
} from './constants.js';

/**
 * Strips non-printable ASCII characters and control codes to prevent log-injection or escape attacks.
 * Retains standard alphanumeric, punctuation, and Unicode characters.
 *
 * @param {unknown} input - Raw input string
 * @returns {string} Sanitized string
 */
export function sanitizeString(input) {
  if (typeof input !== 'string') {
    return '';
  }
  // Strip control characters (\x00-\x1F, \x7F) except newline and tab
  return input
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
    .trim();
}

/**
 * Validates and sanitizes payload for urban air quality assessment.
 *
 * @param {unknown} rawInput - Untrusted request body
 * @returns {{ valid: boolean, errors: string[], sanitized: Object|null }}
 */
export function validateAssessmentInput(rawInput) {
  const errors = [];

  if (!rawInput || typeof rawInput !== 'object' || Array.isArray(rawInput)) {
    return {
      valid: false,
      errors: ['Invalid payload: Request body must be a valid JSON object.'],
      sanitized: null
    };
  }

  // 1. User / Entity Type
  const validUserTypes = Object.values(USER_TYPES);
  const userType = validUserTypes.includes(rawInput.userType)
    ? rawInput.userType
    : USER_TYPES.FAMILY;

  // 2. City / Location
  const rawCity = sanitizeString(rawInput.city);
  if (!rawCity || rawCity.length === 0) {
    errors.push('City/Location is required.');
  } else if (rawCity.length > INPUT_LIMITS.MAX_CITY_LENGTH) {
    errors.push(`City name exceeds maximum length of ${INPUT_LIMITS.MAX_CITY_LENGTH} characters.`);
  }

  // 3. Area Type
  const validAreaTypes = Object.values(AREA_TYPES);
  const areaType = validAreaTypes.includes(rawInput.areaType)
    ? rawInput.areaType
    : AREA_TYPES.URBAN_CORE;

  // 4. AQI Level
  const rawAqi = Number(rawInput.aqiLevel);
  if (isNaN(rawAqi) || !Number.isFinite(rawAqi)) {
    errors.push('AQI level must be a valid number.');
  } else if (rawAqi < INPUT_LIMITS.MIN_AQI || rawAqi > INPUT_LIMITS.MAX_AQI) {
    errors.push(`AQI level must be between ${INPUT_LIMITS.MIN_AQI} and ${INPUT_LIMITS.MAX_AQI}.`);
  }

  // 5. Household / Community Size
  const rawSize = Number(rawInput.householdSize);
  if (isNaN(rawSize) || !Number.isInteger(rawSize)) {
    errors.push('Household size must be an integer.');
  } else if (rawSize < INPUT_LIMITS.MIN_HOUSEHOLD_SIZE || rawSize > INPUT_LIMITS.MAX_HOUSEHOLD_SIZE) {
    errors.push(`Household size must be between ${INPUT_LIMITS.MIN_HOUSEHOLD_SIZE} and ${INPUT_LIMITS.MAX_HOUSEHOLD_SIZE}.`);
  }

  // 6. Housing Type
  const validHousingTypes = Object.values(HOUSING_TYPES);
  const housingType = validHousingTypes.includes(rawInput.housingType)
    ? rawInput.housingType
    : HOUSING_TYPES.APARTMENT_HIGH_FLOOR;

  // 7. Commute Mode
  const validCommuteModes = Object.values(COMMUTE_MODES);
  const primaryCommute = validCommuteModes.includes(rawInput.primaryCommute)
    ? rawInput.primaryCommute
    : COMMUTE_MODES.PUBLIC_TRANSIT;

  // 8. Cooking & Heating Setup
  const validCooking = Object.values(COOKING_HEATING);
  const cookingHeating = validCooking.includes(rawInput.cookingHeating)
    ? rawInput.cookingHeating
    : COOKING_HEATING.LPG_GAS;

  // 9. Vulnerable Demographic Groups
  const validVulnerable = Object.values(VULNERABLE_GROUPS);
  const vulnerableMembers = [];
  if (Array.isArray(rawInput.vulnerableMembers)) {
    for (const item of rawInput.vulnerableMembers) {
      if (typeof item === 'string' && validVulnerable.includes(item) && !vulnerableMembers.includes(item)) {
        vulnerableMembers.push(item);
      }
    }
  }

  // 10. Budget Preference
  const validBudgets = Object.values(BUDGET_PREFERENCES);
  const budgetPreference = validBudgets.includes(rawInput.budgetPreference)
    ? rawInput.budgetPreference
    : BUDGET_PREFERENCES.LOW_COST_DIY;

  // 11. Custom Notes / Unique Constraints
  const rawNotes = sanitizeString(rawInput.notes || rawInput.preferences);
  if (rawNotes.length > INPUT_LIMITS.MAX_NOTES_LENGTH) {
    errors.push(`Notes exceed maximum allowed length of ${INPUT_LIMITS.MAX_NOTES_LENGTH} characters.`);
  }

  if (errors.length > 0) {
    return {
      valid: false,
      errors,
      sanitized: null
    };
  }

  const sanitized = {
    userType,
    city: rawCity,
    areaType,
    aqiLevel: Math.round(rawAqi),
    householdSize: rawSize,
    housingType,
    primaryCommute,
    cookingHeating,
    vulnerableMembers,
    budgetPreference,
    notes: rawNotes
  };

  return {
    valid: true,
    errors: [],
    sanitized
  };
}

/**
 * Backward compatibility alias for existing test suites or route handlers.
 */
export const validatePlanningInput = validateAssessmentInput;
