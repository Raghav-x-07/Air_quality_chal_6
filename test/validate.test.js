import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { sanitizeString, validateAssessmentInput } from '../src/validate.js';
import {
  USER_TYPES,
  AREA_TYPES,
  HOUSING_TYPES,
  COMMUTE_MODES,
  COOKING_HEATING,
  VULNERABLE_GROUPS,
  BUDGET_PREFERENCES
} from '../src/constants.js';

describe('Validation Module - sanitizeString', () => {
  it('strips ASCII control characters and retains valid text', () => {
    const raw = 'Delhi\x00\x08\x1F NCR Smog Safe';
    assert.equal(sanitizeString(raw), 'Delhi NCR Smog Safe');
  });

  it('handles empty or non-string input safely', () => {
    assert.equal(sanitizeString(null), '');
    assert.equal(sanitizeString(undefined), '');
    assert.equal(sanitizeString(12345), '');
    assert.equal(sanitizeString({}), '');
  });

  it('preserves clean unicode characters and emojis', () => {
    const text = 'Pure Air 🍃 🫁 New Delhi';
    assert.equal(sanitizeString(text), text);
  });
});

describe('Validation Module - validateAssessmentInput', () => {
  const validPayload = {
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
    notes: 'Need low cost DIY Corsi-Rosenthal filter advice for asthmatic 6yo child.'
  };

  it('accepts a fully valid payload', () => {
    const result = validateAssessmentInput(validPayload);
    assert.equal(result.valid, true);
    assert.equal(result.errors.length, 0);
    assert.ok(result.sanitized);
    assert.equal(result.sanitized.city, 'Delhi NCR');
    assert.equal(result.sanitized.aqiLevel, 420);
    assert.equal(result.sanitized.householdSize, 4);
  });

  it('rejects non-object or null payloads', () => {
    assert.equal(validateAssessmentInput(null).valid, false);
    assert.equal(validateAssessmentInput('invalid string').valid, false);
    assert.equal(validateAssessmentInput([]).valid, false);
  });

  it('rejects missing or empty city name', () => {
    const payload = { ...validPayload, city: '   ' };
    const res = validateAssessmentInput(payload);
    assert.equal(res.valid, false);
    assert.ok(res.errors.some((e) => e.includes('City/Location is required')));
  });

  it('rejects city name exceeding 80 characters', () => {
    const payload = { ...validPayload, city: 'A'.repeat(85) };
    const res = validateAssessmentInput(payload);
    assert.equal(res.valid, false);
    assert.ok(res.errors.some((e) => e.includes('City name exceeds')));
  });

  it('rejects non-numeric or out-of-bounds AQI levels', () => {
    assert.equal(validateAssessmentInput({ ...validPayload, aqiLevel: 'high' }).valid, false);
    assert.equal(validateAssessmentInput({ ...validPayload, aqiLevel: 5 }).valid, false);
    assert.equal(validateAssessmentInput({ ...validPayload, aqiLevel: 1050 }).valid, false);
  });

  it('rejects invalid or non-integer household size', () => {
    assert.equal(validateAssessmentInput({ ...validPayload, householdSize: 0 }).valid, false);
    assert.equal(validateAssessmentInput({ ...validPayload, householdSize: 2.5 }).valid, false);
    assert.equal(validateAssessmentInput({ ...validPayload, householdSize: 20000 }).valid, false);
  });

  it('falls back to safe enum defaults for unrecognized enum values', () => {
    const payload = {
      ...validPayload,
      userType: 'unrecognized_user',
      areaType: 'unknown_area',
      housingType: 'tent',
      primaryCommute: 'helicopter',
      cookingHeating: 'nuclear_fusion',
      budgetPreference: 'infinite_budget'
    };
    const res = validateAssessmentInput(payload);
    assert.equal(res.valid, true);
    assert.equal(res.sanitized.userType, USER_TYPES.FAMILY);
    assert.equal(res.sanitized.areaType, AREA_TYPES.URBAN_CORE);
    assert.equal(res.sanitized.housingType, HOUSING_TYPES.APARTMENT_HIGH_FLOOR);
    assert.equal(res.sanitized.primaryCommute, COMMUTE_MODES.PUBLIC_TRANSIT);
    assert.equal(res.sanitized.cookingHeating, COOKING_HEATING.LPG_GAS);
    assert.equal(res.sanitized.budgetPreference, BUDGET_PREFERENCES.LOW_COST_DIY);
  });

  it('filters out invalid vulnerable group members safely', () => {
    const payload = {
      ...validPayload,
      vulnerableMembers: [
        VULNERABLE_GROUPS.INFANTS_CHILDREN,
        'invalid_member_tag',
        VULNERABLE_GROUPS.ELDERLY
      ]
    };
    const res = validateAssessmentInput(payload);
    assert.equal(res.valid, true);
    assert.deepEqual(res.sanitized.vulnerableMembers, [
      VULNERABLE_GROUPS.INFANTS_CHILDREN,
      VULNERABLE_GROUPS.ELDERLY
    ]);
  });

  it('rejects notes exceeding 500 characters', () => {
    const payload = { ...validPayload, notes: 'A'.repeat(550) };
    const res = validateAssessmentInput(payload);
    assert.equal(res.valid, false);
    assert.ok(res.errors.some((e) => e.includes('Notes exceed maximum')));
  });

  it('defends against XSS by sanitizing input fields', () => {
    const payload = {
      ...validPayload,
      city: '<script>alert("xss")</script> Delhi',
      notes: '<img src=x onerror=alert(1)> Needs air filter.'
    };
    const res = validateAssessmentInput(payload);
    assert.equal(res.valid, true);
    assert.ok(!res.sanitized.city.includes('\x00'));
  });
});
