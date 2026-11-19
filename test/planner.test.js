import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generatePlan } from '../src/planner.js';
import { generateAssessment } from '../src/engine.js';

describe('Planner Module Legacy Re-export Suite', () => {
  it('re-exports generateAssessment as generatePlan with exact parity', () => {
    const input = {
      userType: 'family',
      city: 'Delhi NCR',
      areaType: 'urban_core',
      aqiLevel: 350,
      householdSize: 4,
      housingType: 'apartment_high_floor',
      primaryCommute: 'two_wheeler',
      cookingHeating: 'lpg_gas',
      vulnerableMembers: [],
      budgetPreference: 'low_cost_diy',
      notes: ''
    };

    const fromPlanner = generatePlan(input);
    const fromEngine = generateAssessment(input);

    assert.equal(fromPlanner.impact.exposureReductionPercent, fromEngine.impact.exposureReductionPercent);
    assert.equal(fromPlanner.summary, fromEngine.summary);
  });
});
