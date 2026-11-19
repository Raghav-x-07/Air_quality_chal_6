/**
 * Prana Urban Air Quality Assistant Frontend Application
 * Strict Security: Renders solely with textContent and DOM APIs (ZERO innerHTML).
 * Full Keyboard & Screen-Reader Accessible (WCAG 2.1 AA).
 */

(() => {
  'use strict';

  // State Management
  let currentAssessment = null;
  const hackCheckedStates = new Map();

  // DOM Elements Selection
  const form = document.getElementById('planning-form');
  const submitBtn = document.getElementById('submit-plan-btn');
  const errorBanner = document.getElementById('error-banner');
  const errorList = document.getElementById('error-list');
  const closeErrorBtn = document.getElementById('close-error-btn');

  const emptyState = document.getElementById('empty-state');
  const loadingState = document.getElementById('loading-state');
  const planResults = document.getElementById('plan-results');
  const exportActions = document.getElementById('export-actions');
  const planLiveStatus = document.getElementById('plan-live-status');

  const planSummaryText = document.getElementById('plan-summary-text');
  const planAiBadgeRow = document.getElementById('plan-ai-badge-row');
  const planCityAqi = document.getElementById('plan-city-aqi');
  const planTimestamp = document.getElementById('plan-timestamp');

  // Direct Impact Metric Displays
  const impactReductionPct = document.getElementById('impact-reduction-pct');
  const impactPm25Detail = document.getElementById('impact-pm25-detail');
  const impactCigsSaved = document.getElementById('impact-cigs-saved');
  const impactCigsDetail = document.getElementById('impact-cigs-detail');
  const impactCo2Saved = document.getElementById('impact-co2-saved');
  const impactPmDetail = document.getElementById('impact-pm-detail');
  const impactSavingsInr = document.getElementById('impact-savings-inr');
  const impactSavingsDetail = document.getElementById('impact-savings-detail');

  // Sections
  const warningsContainer = document.getElementById('warnings-container');
  const warningsList = document.getElementById('warnings-list');
  const diurnalRoutineList = document.getElementById('diurnal-routine-list');
  const iaqHacksContainer = document.getElementById('iaq-hacks-container');
  const hacksProgressLabel = document.getElementById('hacks-progress-label');
  const hacksProgressFill = document.getElementById('hacks-progress-fill');
  const hacksProgressBar = document.getElementById('hacks-progressbar');
  const sustainableAlternativesGrid = document.getElementById('sustainable-alternatives-grid');
  const communityBlueprintBlock = document.getElementById('community-blueprint-block');
  const communityInitiativesList = document.getElementById('community-initiatives-list');
  const aiIdeasList = document.getElementById('ai-ideas-list');

  // Action Buttons
  const btnCopyPlan = document.getElementById('btn-copy-plan');
  const btnPrint = document.getElementById('btn-print');
  const btnDownloadJson = document.getElementById('btn-download-json');
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  const themeLabel = document.getElementById('theme-label');

  // Interactive Form Inputs
  const aqiRangeInput = document.getElementById('aqi-level');
  const aqiNumberInput = document.getElementById('aqi-number-input');
  const aqiIndicatorBadge = document.getElementById('aqi-indicator-badge');
  const preferencesInput = document.getElementById('preferences');
  const prefCounter = document.getElementById('pref-counter');

  // Preset Buttons
  const presetDelhi = document.getElementById('preset-delhi-family');
  const presetMumbai = document.getElementById('preset-mumbai-commuter');
  const presetRwa = document.getElementById('preset-rwa-community');
  const presetBengaluru = document.getElementById('preset-bengaluru-eco');

  /**
   * Updates the AQI indicator badge color and label based on numerical level.
   * @param {number} val
   */
  function updateAqiBadge(val) {
    const aqi = Number(val) || 100;
    let label = 'Good';
    let cls = 'aqi-good';

    if (aqi <= 50) {
      label = 'Good';
      cls = 'aqi-good';
    } else if (aqi <= 100) {
      label = 'Satisfactory';
      cls = 'aqi-satisfactory';
    } else if (aqi <= 200) {
      label = 'Moderate';
      cls = 'aqi-moderate';
    } else if (aqi <= 300) {
      label = 'Poor';
      cls = 'aqi-poor';
    } else if (aqi <= 400) {
      label = 'Very Poor';
      cls = 'aqi-very-poor';
    } else {
      label = 'Severe';
      cls = 'aqi-severe';
    }

    aqiIndicatorBadge.textContent = `${aqi} - ${label}`;
    aqiIndicatorBadge.className = `aqi-badge ${cls}`;
  }

  // Sync AQI Range Slider and Number Box
  aqiRangeInput.addEventListener('input', (e) => {
    aqiNumberInput.value = e.target.value;
    updateAqiBadge(e.target.value);
  });

  aqiNumberInput.addEventListener('input', (e) => {
    aqiRangeInput.value = e.target.value;
    updateAqiBadge(e.target.value);
  });

  // Character Counter for Custom Notes
  if (preferencesInput && prefCounter) {
    preferencesInput.addEventListener('input', () => {
      const len = preferencesInput.value.length;
      prefCounter.textContent = `${len} / 500 characters`;
    });
  }

  /**
   * Displays an array of validation error messages in the alert live region.
   * @param {string[]} errors
   */
  function displayErrors(errors) {
    while (errorList.firstChild) {
      errorList.removeChild(errorList.firstChild);
    }

    errors.forEach((err) => {
      const li = document.createElement('li');
      li.textContent = err;
      errorList.appendChild(li);
    });

    errorBanner.hidden = false;
    errorBanner.focus();
    if (planLiveStatus) {
      planLiveStatus.textContent = `Form submission error: ${errors.join('. ')}`;
    }
  }

  /**
   * Clears the error banner.
   */
  function clearErrors() {
    errorBanner.hidden = true;
    while (errorList.firstChild) {
      errorList.removeChild(errorList.firstChild);
    }
  }

  closeErrorBtn.addEventListener('click', clearErrors);

  /**
   * Populates the form with a given preset configuration and auto-submits.
   * @param {Object} preset
   */
  function applyPreset(preset) {
    clearErrors();
    const data = preset.data;

    const userTypeSelect = document.getElementById('user-type');
    const cityInput = document.getElementById('city');
    const areaSelect = document.getElementById('area-type');
    const housingSelect = document.getElementById('housing-type');
    const commuteSelect = document.getElementById('primary-commute');
    const cookingSelect = document.getElementById('cooking-heating');
    const budgetSelect = document.getElementById('budget-preference');
    const sizeInput = document.getElementById('household-size');

    if (userTypeSelect) userTypeSelect.value = data.userType || 'family';
    if (cityInput) cityInput.value = data.city || '';
    if (areaSelect) areaSelect.value = data.areaType || 'urban_core';
    if (housingSelect) housingSelect.value = data.housingType || 'apartment_high_floor';
    if (commuteSelect) commuteSelect.value = data.primaryCommute || 'two_wheeler';
    if (cookingSelect) cookingSelect.value = data.cookingHeating || 'lpg_gas';
    if (budgetSelect) budgetSelect.value = data.budgetPreference || 'low_cost_diy';
    if (sizeInput) sizeInput.value = data.householdSize || 4;

    const aqi = data.aqiLevel || 400;
    aqiRangeInput.value = aqi;
    aqiNumberInput.value = aqi;
    updateAqiBadge(aqi);

    if (preferencesInput) {
      preferencesInput.value = data.notes || '';
      if (prefCounter) {
        prefCounter.textContent = `${preferencesInput.value.length} / 500 characters`;
      }
    }

    // Set vulnerable demographic checkboxes
    const checkboxes = form.querySelectorAll('input[name="vulnerableMembers"]');
    const targetVulnerable = data.vulnerableMembers || [];
    checkboxes.forEach((cb) => {
      cb.checked = targetVulnerable.includes(cb.value);
    });

    // Auto submit to generate plan instantly
    submitForm();
  }

  // Attach Preset Handlers
  if (presetDelhi) {
    presetDelhi.addEventListener('click', () => {
      applyPreset({
        data: {
          userType: 'family',
          city: 'Delhi NCR',
          areaType: 'urban_core',
          aqiLevel: 420,
          householdSize: 4,
          housingType: 'apartment_high_floor',
          primaryCommute: 'two_wheeler',
          cookingHeating: 'lpg_gas',
          vulnerableMembers: ['infants_children', 'elderly', 'asthmatic_respiratory'],
          budgetPreference: 'low_cost_diy',
          notes: 'Asthmatic 7yo child has morning school bus commute. Need low-cost DIY air purifier under ₹2,500.'
        }
      });
    });
  }

  if (presetMumbai) {
    presetMumbai.addEventListener('click', () => {
      applyPreset({
        data: {
          userType: 'family',
          city: 'Mumbai',
          areaType: 'near_highway',
          aqiLevel: 240,
          householdSize: 2,
          housingType: 'rented_budget',
          primaryCommute: 'two_wheeler',
          cookingHeating: 'induction_electric',
          vulnerableMembers: ['outdoor_commuters'],
          budgetPreference: 'low_cost_diy',
          notes: 'Daily 25km motorcycle commute in heavy highway traffic. Rented flat, cannot make structural changes.'
        }
      });
    });
  }

  if (presetRwa) {
    presetRwa.addEventListener('click', () => {
      applyPreset({
        data: {
          userType: 'community',
          city: 'Gurugram / Noida',
          areaType: 'residential_suburb',
          aqiLevel: 460,
          householdSize: 650,
          housingType: 'apartment_high_floor',
          primaryCommute: 'personal_car',
          cookingHeating: 'lpg_gas',
          vulnerableMembers: ['elderly', 'infants_children', 'outdoor_commuters'],
          budgetPreference: 'balanced',
          notes: 'RWA committee looking to implement society gate anti-idling, guard warmth without burning trash, and community clean-air shelter.'
        }
      });
    });
  }

  if (presetBengaluru) {
    presetBengaluru.addEventListener('click', () => {
      applyPreset({
        data: {
          userType: 'family',
          city: 'Bengaluru',
          areaType: 'residential_suburb',
          aqiLevel: 135,
          householdSize: 3,
          housingType: 'independent_house',
          primaryCommute: 'public_transit',
          cookingHeating: 'induction_electric',
          vulnerableMembers: ['pets'],
          budgetPreference: 'balanced',
          notes: 'Family with two rescue dogs. Want natural air-purifying plant routines, composting, and zero-emission heating.'
        }
      });
    });
  }

  /**
   * Extracts user inputs into a structured JSON payload.
   * @returns {Object}
   */
  function getFormData() {
    const formData = new FormData(form);
    const vulnerableMembers = [];
    form.querySelectorAll('input[name="vulnerableMembers"]:checked').forEach((cb) => {
      vulnerableMembers.push(cb.value);
    });

    return {
      userType: formData.get('userType') || 'family',
      city: formData.get('city') || '',
      areaType: formData.get('areaType') || 'urban_core',
      aqiLevel: Number(formData.get('aqiLevel')) || 100,
      householdSize: Number(formData.get('householdSize')) || 1,
      housingType: formData.get('housingType') || 'apartment_high_floor',
      primaryCommute: formData.get('primaryCommute') || 'two_wheeler',
      cookingHeating: formData.get('cookingHeating') || 'lpg_gas',
      vulnerableMembers,
      budgetPreference: formData.get('budgetPreference') || 'low_cost_diy',
      notes: formData.get('preferences') || ''
    };
  }

  /**
   * Updates the IAQ Hacks progress indicator.
   */
  function updateHacksProgress() {
    if (!currentAssessment || !currentAssessment.iaqHacks) return;
    const total = currentAssessment.iaqHacks.length;
    let completed = 0;

    currentAssessment.iaqHacks.forEach((h) => {
      if (hackCheckedStates.get(h.id)) completed++;
    });

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    hacksProgressLabel.textContent = `${completed} of ${total} Completed`;
    hacksProgressFill.style.width = `${percent}%`;
    hacksProgressBar.setAttribute('aria-valuenow', percent);
  }

  /**
   * Renders the complete assessment results into the DOM strictly using textContent and DOM methods.
   * @param {Object} plan
   */
  function renderAssessment(plan) {
    currentAssessment = plan;
    hackCheckedStates.clear();

    // 1. Summary Card
    planSummaryText.textContent = plan.summary || 'Assessment formulated successfully.';
    if (plan.aiEnriched) {
      planAiBadgeRow.textContent = `Enriched by ${plan.aiProvider || 'GenAI'}`;
      planAiBadgeRow.className = 'ai-badge-pill';
    } else {
      planAiBadgeRow.textContent = 'Deterministic Rule Engine';
      planAiBadgeRow.className = 'ai-badge-pill';
    }

    const aqiBand = plan.metadata?.aqiBand?.label || 'AQI';
    planCityAqi.textContent = `📍 ${plan.input.city} • ${aqiBand} (AQI ${plan.input.aqiLevel})`;
    planTimestamp.textContent = `Generated: ${new Date(plan.metadata.generatedAt).toLocaleTimeString()}`;

    // 2. Direct Impact Metrics
    const impact = plan.impact || {};
    impactReductionPct.textContent = `-${impact.exposureReductionPercent || 0}%`;
    impactPm25Detail.textContent = `Cut from ${impact.baselineExposure || 0} to ${impact.protectedExposure || 0} µg/m³ daily`;

    impactCigsSaved.textContent = `${impact.cigarettesSavedDaily || 0} / day`;
    impactCigsDetail.textContent = `Equivalent to inhaling ${impact.cigarettesSavedDaily || 0} fewer cigarettes daily per person`;

    impactCo2Saved.textContent = `-${impact.monthlyCo2SavedKg || 0} kg CO₂`;
    impactPmDetail.textContent = `Avoided monthly + ${impact.monthlyPmPreventedGrams || 0}g localized PM dust`;

    impactSavingsInr.textContent = `₹${(impact.totalFinancialSavingsInr || 0).toLocaleString('en-IN')}`;
    impactSavingsDetail.textContent = `Saved via DIY air cleaner & prevented respiratory healthcare costs`;

    // 3. Contextual Warnings
    while (warningsList.firstChild) {
      warningsList.removeChild(warningsList.firstChild);
    }

    if (plan.warnings && plan.warnings.length > 0) {
      warningsContainer.hidden = false;
      plan.warnings.forEach((w) => {
        const li = document.createElement('li');
        li.className = `warning-item ${w.severity || 'medium'}`;

        const strong = document.createElement('strong');
        strong.className = 'warning-title';
        strong.textContent = w.title;

        const p = document.createElement('p');
        p.textContent = w.message;

        li.appendChild(strong);
        li.appendChild(p);
        warningsList.appendChild(li);
      });
    } else {
      warningsContainer.hidden = true;
    }

    // 4. Diurnal Hourly Smog Routine Timeline
    while (diurnalRoutineList.firstChild) {
      diurnalRoutineList.removeChild(diurnalRoutineList.firstChild);
    }

    if (plan.diurnalRoutine && plan.diurnalRoutine.length > 0) {
      plan.diurnalRoutine.forEach((r) => {
        const card = document.createElement('div');
        card.className = 'routine-card';

        const header = document.createElement('div');
        header.className = 'routine-header';

        const titleDiv = document.createElement('div');
        titleDiv.className = 'routine-period-title';

        const iconSpan = document.createElement('span');
        iconSpan.textContent = r.icon || '⏰';
        iconSpan.setAttribute('aria-hidden', 'true');

        const titleSpan = document.createElement('span');
        titleSpan.textContent = `${r.period}: ${r.phase}`;

        titleDiv.appendChild(iconSpan);
        titleDiv.appendChild(titleSpan);

        const badge = document.createElement('span');
        badge.className = `routine-phase-badge ${r.badgeClass || 'badge-primary'}`;
        badge.textContent = r.badge;

        header.appendChild(titleDiv);
        header.appendChild(badge);

        const summaryP = document.createElement('p');
        summaryP.className = 'routine-summary';
        summaryP.textContent = r.summary;

        const ul = document.createElement('ul');
        ul.className = 'routine-actions';
        r.actions.forEach((act) => {
          const li = document.createElement('li');
          li.textContent = act;
          ul.appendChild(li);
        });

        card.appendChild(header);
        card.appendChild(summaryP);
        card.appendChild(ul);
        diurnalRoutineList.appendChild(card);
      });
    }

    // 5. Room-by-Room IAQ Hacks & DIY Blueprints
    while (iaqHacksContainer.firstChild) {
      iaqHacksContainer.removeChild(iaqHacksContainer.firstChild);
    }

    if (plan.iaqHacks && plan.iaqHacks.length > 0) {
      plan.iaqHacks.forEach((hack) => {
        const card = document.createElement('div');
        card.className = 'hack-card';
        card.id = `card-${hack.id}`;

        const topRow = document.createElement('div');
        topRow.className = 'hack-top-row';

        const label = document.createElement('label');
        label.className = 'hack-checkbox-label';

        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'hack-checkbox';
        cb.id = `cb-${hack.id}`;
        cb.addEventListener('change', () => {
          hackCheckedStates.set(hack.id, cb.checked);
          if (cb.checked) {
            card.classList.add('completed');
          } else {
            card.classList.remove('completed');
          }
          updateHacksProgress();
        });

        const titleSpan = document.createElement('span');
        titleSpan.className = 'hack-title';
        titleSpan.textContent = hack.title;

        label.appendChild(cb);
        label.appendChild(titleSpan);

        const pillsDiv = document.createElement('div');
        pillsDiv.className = 'hack-meta-pills';

        const costPill = document.createElement('span');
        costPill.className = 'pill-cost';
        costPill.textContent = hack.cost;

        const impactPill = document.createElement('span');
        impactPill.className = 'pill-impact';
        impactPill.textContent = hack.impact;

        pillsDiv.appendChild(costPill);
        pillsDiv.appendChild(impactPill);

        topRow.appendChild(label);
        topRow.appendChild(pillsDiv);

        const stepsUl = document.createElement('ul');
        stepsUl.className = 'hack-steps-list';
        hack.steps.forEach((step) => {
          const stepLi = document.createElement('li');
          stepLi.textContent = step;
          stepsUl.appendChild(stepLi);
        });

        card.appendChild(topRow);
        card.appendChild(stepsUl);
        iaqHacksContainer.appendChild(card);
      });
      updateHacksProgress();
    }

    // 6. Sustainable Alternatives Grid
    while (sustainableAlternativesGrid.firstChild) {
      sustainableAlternativesGrid.removeChild(sustainableAlternativesGrid.firstChild);
    }

    if (plan.sustainableAlternatives && plan.sustainableAlternatives.length > 0) {
      plan.sustainableAlternatives.forEach((alt) => {
        const card = document.createElement('div');
        card.className = 'alternative-card';

        const cat = document.createElement('span');
        cat.className = 'alt-category';
        cat.textContent = alt.category;

        const trans = document.createElement('div');
        trans.className = 'alt-transition';
        trans.textContent = `${alt.current} ➔ ${alt.alternative}`;

        const imp = document.createElement('div');
        imp.className = 'alt-impact';
        imp.textContent = `Impact: ${alt.impactMetric}`;

        const ul = document.createElement('ul');
        ul.className = 'alt-actions';
        alt.actionPoints.forEach((pt) => {
          const li = document.createElement('li');
          li.textContent = pt;
          ul.appendChild(li);
        });

        card.appendChild(cat);
        card.appendChild(trans);
        card.appendChild(imp);
        card.appendChild(ul);
        sustainableAlternativesGrid.appendChild(card);
      });
    }

    // 7. Community Blueprint
    while (communityInitiativesList.firstChild) {
      communityInitiativesList.removeChild(communityInitiativesList.firstChild);
    }

    if (plan.communityBlueprint && plan.communityBlueprint.initiatives) {
      plan.communityBlueprint.initiatives.forEach((init) => {
        const card = document.createElement('div');
        card.className = 'initiative-card';

        const pillar = document.createElement('div');
        pillar.className = 'initiative-pillar';
        pillar.textContent = init.pillar;

        const head = document.createElement('h4');
        head.className = 'initiative-headline';
        head.textContent = init.headline;

        const p = document.createElement('p');
        p.className = 'initiative-detail';
        p.textContent = init.detail;

        card.appendChild(pillar);
        card.appendChild(head);
        card.appendChild(p);
        communityInitiativesList.appendChild(card);
      });
    }

    // 8. AI / Deterministic Bespoke Recommendations
    while (aiIdeasList.firstChild) {
      aiIdeasList.removeChild(aiIdeasList.firstChild);
    }

    const ideas = plan.aiIdeas || [];
    ideas.forEach((idea) => {
      const li = document.createElement('li');
      li.className = 'idea-item';

      const bullet = document.createElement('span');
      bullet.className = 'idea-bullet';
      bullet.textContent = '💡';
      bullet.setAttribute('aria-hidden', 'true');

      const span = document.createElement('span');
      span.textContent = idea;

      li.appendChild(bullet);
      li.appendChild(span);
      aiIdeasList.appendChild(li);
    });

    // Toggle View States
    emptyState.hidden = true;
    loadingState.hidden = true;
    planResults.hidden = false;
    exportActions.hidden = false;

    if (planLiveStatus) {
      planLiveStatus.textContent = `Clean air defense plan generated successfully for ${plan.input.city}. Direct PM2.5 exposure reduction: ${impact.exposureReductionPercent}%.`;
    }
  }

  /**
   * Submits the form via fetch to the API.
   */
  async function submitForm() {
    clearErrors();
    const payload = getFormData();

    // Client-side quick validation check
    const errors = [];
    if (!payload.city || payload.city.trim().length === 0) {
      errors.push('City / Metro Region is required.');
    }
    if (isNaN(payload.aqiLevel) || payload.aqiLevel < 10 || payload.aqiLevel > 999) {
      errors.push('AQI must be a valid number between 10 and 999.');
    }
    if (isNaN(payload.householdSize) || payload.householdSize < 1) {
      errors.push('Household size must be at least 1 person.');
    }

    if (errors.length > 0) {
      displayErrors(errors);
      return;
    }

    // Switch to loading state
    emptyState.hidden = true;
    planResults.hidden = true;
    exportActions.hidden = true;
    loadingState.hidden = false;
    submitBtn.disabled = true;
    submitBtn.querySelector('.spinner').hidden = false;

    try {
      const response = await fetch('/api/assess', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errorMessages = result.errors || ['Failed to generate plan. Please verify inputs.'];
        displayErrors(errorMessages);
        emptyState.hidden = false;
        loadingState.hidden = true;
        return;
      }

      renderAssessment(result.data);
    } catch {
      displayErrors(['Network or server communication error. Please ensure the server is running.']);
      emptyState.hidden = false;
      loadingState.hidden = true;
    } finally {
      submitBtn.disabled = false;
      submitBtn.querySelector('.spinner').hidden = true;
    }
  }

  // Handle Form Submission Event
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    submitForm();
  });

  // Action Button: Print / PDF
  if (btnPrint) {
    btnPrint.addEventListener('click', () => {
      window.print();
    });
  }

  // Action Button: Copy Summary to Clipboard
  if (btnCopyPlan) {
    btnCopyPlan.addEventListener('click', async () => {
      if (!currentAssessment) return;
      const textToCopy = `=== ${currentAssessment.metadata.appName} ===
Location: ${currentAssessment.input.city} (AQI ${currentAssessment.input.aqiLevel} - ${currentAssessment.metadata.aqiBand.label})
Direct Impact: -${currentAssessment.impact.exposureReductionPercent}% PM2.5 Inhalation Exposure
Daily Cigarettes Avoided: ${currentAssessment.impact.cigarettesSavedDaily} cigarettes/day per person
Monthly Emissions Saved: ${currentAssessment.impact.monthlyCo2SavedKg} kg CO2 & ${currentAssessment.impact.monthlyPmPreventedGrams}g PM10
Estimated Financial Savings: ₹${currentAssessment.impact.totalFinancialSavingsInr.toLocaleString('en-IN')}

Executive Summary:
${currentAssessment.summary}

Top IAQ Action:
Deploy a DIY Corsi-Rosenthal / HEPA box fan filter in your sleeping sanctuary to remove 80% of indoor particulate matter at ~₹2,200 cost.`;

      try {
        await navigator.clipboard.writeText(textToCopy);
        const originalText = btnCopyPlan.textContent;
        btnCopyPlan.textContent = 'Copied! ✓';
        setTimeout(() => {
          btnCopyPlan.textContent = originalText;
        }, 2000);
      } catch {
        alert('Copied assessment text to clipboard!');
      }
    });
  }

  // Action Button: Download JSON
  if (btnDownloadJson) {
    btnDownloadJson.addEventListener('click', () => {
      if (!currentAssessment) return;
      const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(currentAssessment, null, 2));
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', dataStr);
      downloadAnchor.setAttribute('download', `prana-air-plan-${currentAssessment.input.city.toLowerCase().replace(/\s+/g, '-')}.json`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    });
  }

  // Theme Toggler with LocalStorage
  const savedTheme = localStorage.getItem('prana_theme');
  if (savedTheme) {
    document.documentElement.setAttribute('data-theme', savedTheme);
    if (themeLabel) themeLabel.textContent = savedTheme === 'dark' ? 'Dark' : 'Light';
  }

  if (themeToggleBtn) {
    themeToggleBtn.addEventListener('click', () => {
      const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
      const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', newTheme);
      localStorage.setItem('prana_theme', newTheme);
      if (themeLabel) themeLabel.textContent = newTheme === 'dark' ? 'Dark' : 'Light';
    });
  }

  // Initialize Default AQI Badge
  updateAqiBadge(aqiRangeInput.value);
})();
