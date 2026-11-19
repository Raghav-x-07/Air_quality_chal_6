# Prana - Urban Air Quality & Smog Defense Assistant 🍃

> **Challenge 6: Urban Air Quality Assistant**  
> *"Create a GenAI-powered assistant that helps families and communities navigate severe winter smog and urban air pollution. The application should suggest low-emission daily routines, indoor air quality hacks, and sustainable alternatives tailored to their location and lifestyle, while clearly explaining the direct impact of their choices."*

A production-grade, zero-external-dependency web application engineered for **families, commuters, and Resident Welfare Associations (RWAs)** navigating severe urban winter smog. Built with Node.js 18+ standard library and accessible vanilla HTML5/CSS3/JavaScript. Operates with exact scientific exposure reduction calculations, diurnal thermal inversion scheduling, room-by-room DIY air purification hacks, and a dual-mode GenAI + offline deterministic rule engine.

---

## 1. Chosen Vertical and Persona

- **Target Persona & Scale**:
  - **Urban Families**: Households with vulnerable members (infants, elderly grandparents, asthmatic children, pregnant women, and pets) seeking low-cost, immediately actionable ways to shield their homes from toxic ambient smog.
  - **Daily Commuters**: Motorcyclists, two-wheeler riders, pedestrians, and public transit commuters exposed to roadway tailpipe soot and particulate matter.
  - **Communities & RWAs**: Apartment complexes, housing societies, and school committees needing collective anti-smog gate protocols, security guard welfare policies, and community clean-air shelters.
- **Geographic & Environmental Grounding**:
  - Calibrated for severe winter smog corridors across the **Indo-Gangetic Plains, Delhi-NCR, Mumbai, Kolkata, Lucknow, Patna, Kanpur, Varanasi, and global smog-impacted metropolitan areas**.
  - Aligned with **Central Pollution Control Board (CPCB)**, **US EPA**, and **World Health Organization (WHO)** air quality breakpoints.

---

## 2. Approach and Science

### A. Direct Exposure Impact & Berkeley Earth Equivalence
The engine quantifies personal and family risk reductions using peer-reviewed atmospheric health benchmarks:
1. **Ambient PM2.5 Estimation**: Maps local AQI readings across standard non-linear breakpoint curves to calculate ambient particulate concentration ($\mu\text{g}/\text{m}^3$).
2. **Inhalation Mass Balance**:
   - Accounts for diurnal distribution (20h indoors, 2h commute, 2h ambient errands).
   - Computes structural baseline infiltration (e.g. 70% in unsealed high-rise or rented apartments).
   - Incorporates commute-specific multipliers (e.g. 1.35x for two-wheelers in vehicle exhaust plumes vs 0.35x for air-conditioned metro transit).
   - Measures indoor cooking spikes (e.g. +110 $\mu\text{g}/\text{m}^3$ for unvented biomass/sigri, +22 $\mu\text{g}/\text{m}^3$ for unvented gas, +5 $\mu\text{g}/\text{m}^3$ for induction).
3. **Protected Exposure**:
   - Evaluates the combined effect of weather-stripping draft seals (cuts infiltration to 35%), DIY Corsi-Rosenthal / HEPA filtration (removes 80-85% of suspended indoor particulate), certified N95 masking on commutes (85% filtration), and kitchen pre-exhaust protocols (75% cooking surge reduction).
   - **Exposure Reduction Percentage**: Systematically delivers **65% to 85% lower daily PM2.5 inhalation**.
4. **Berkeley Earth Cigarette Equivalence**:
   - Uses the landmark Berkeley Earth scientific rule: $22\,\mu\text{g}/\text{m}^3\text{ of PM2.5 over 24 hours} \approx 1\text{ cigarette inhaled}$.
   - Displays baseline daily cigarettes vs. protected daily cigarettes, directly communicating: *"Equivalent to inhaling 14 fewer cigarettes daily per person."*
5. **Carbon & Particulate Offsets**:
   - Quantifies monthly $\text{CO}_2$ emissions avoided (kg) from shifting single-occupancy vehicle commutes to public transit and enforcing anti-idling.
   - Calculates localized PM10 dust prevented (grams/month) by replacing dry brooming with microfiber wet-mopping and avoiding leaf/trash burning.
6. **Financial Savings**:
   - Compares the cost of assembling an effective DIY Corsi-Rosenthal box cleaner (~₹2,200) vs. purchasing commercial brand purifiers (~₹16,000), showing upfront savings of ₹13,800+ alongside avoided respiratory nebulizer medical expenses.

---

### B. Diurnal Low-Emission Daily Routine
Winter urban smog follows distinct diurnal atmospheric cycles governed by thermal inversion:
1. **Early Morning (06:00 - 09:30) - Inversion Peak**:
   - Nocturnal radiation cooling traps vehicle soot and industrial plumes in the shallowest 50 meters of air.
   - *Protocol*: Keep external doors and windows strictly locked; prohibit outdoor cardio or morning jogging; equip children with N95 masks before boarding school buses; run indoor air filtration.
2. **Midday (11:30 - 15:00) - Solar Convection Clearing Window**:
   - Solar warming breaks the thermal ceiling, promoting vertical air mixing and improving ambient AQI to its daily minimum.
   - *Protocol*: Safe window for a controlled 20-30 minute cross-ventilation flush (if ambient AQI < 250); optimal time for outdoor errands and sun exposure; damp-cloth wipe downs of balcony ledges.
3. **Evening Rush (17:00 - 20:30) - Traffic Congestion & Secondary Inversion**:
   - Plunging evening temperatures re-establish surface inversion while traffic volume peaks.
   - *Protocol*: Seal windows before sunset (17:00); switch vehicle AC strictly to internal recirculation mode; turn on kitchen exhaust fans 3 minutes *before* lighting stoves.
4. **Night & Sleep (21:00 - 06:00) - Clean Air Sleep Sanctuary**:
   - 8 hours of continuous rest allows respiratory mucosal cilia to clear inhaled soot.
   - *Protocol*: Keep bedroom doors closed and run DIY/HEPA filters continuously on low; maintain relative humidity at 40-50% to drop suspended aerosols; strictly ban mosquito coils, dhoop, or incense sticks (which emit benzene, formaldehyde, and heavy PM2.5); never sleep with unvented coal/wood sigris.

---

### C. Room-by-Room Indoor Air Quality (IAQ) Hacks
Actionable, low-cost domestic interventions formatted as an interactive checklist:
1. **DIY Corsi-Rosenthal / HEPA Box Fan Cleaner**: Step-by-step instructions to pair an affordable box fan with a MERV-13/HEPA filter panel for ₹2,200, delivering 300+ m³/h Clean Air Delivery Rate (CADR).
2. **Microfiber Damp-Mopping (Anti-Resuspension)**: Prohibits traditional dry broom sweeping (which flings settled toxic heavy metals back into breathing height) in favor of damp microfiber mopping.
3. **Kitchen Pre-Exhaust & Splatter Shielding**: Establishes negative pressure before cooking and runs exhaust for 10 minutes post-cooking to evacuate aerosolized oil droplets.
4. **Self-Adhesive Draft Stripping & Door Sweeps**: Low-cost, non-damaging foam tape on balcony sliders and silicone bottom door sweeps to halt smog drafts.
5. **Botanical Air Purifying Plants**: Areca Palm (daytime oxygen and humidity), Snake Plant / Sansevieria (CAM photosynthesis absorbing $\text{CO}_2$ at night), and Spider Plant (volatile organic compound absorption).
6. **Entryway Shoe Barrier**: Exterior coir scrape mat and indoor shoe-drop zone preventing toxic roadway brake-dust from tracking into rugs.

---

### D. Community & Society Action Blueprint
Scalable collective protocols for RWAs, apartment societies, and school committees:
- **Society Gate No-Idling Enforcement**: Mandatory engine shutdown for delivery vans, school buses, and cabs waiting >15 seconds.
- **Dignified Security Guard Welfare**: Supplying ceramic electric heaters, thermal jackets, and hot beverage stations so night guards do not burn garbage or scrap wood for warmth.
- **Designated Clean-Air Community Shelter**: Equipping society clubhouses or libraries with HEPA filtration as emergency sanctuaries for elders and infants during AQI 400+ episodes.
- **Paved Pathway Water Misting**: Spraying recycled STP water mist on internal driveways at 10:00 AM to suppress road dust resuspension.
- **Perimeter Botanical Buffers**: Dense evergreen bougainvillea and bamboo screens along boundary walls facing highways to trap road soot.

---

### E. Dual-Mode GenAI Layer + Deterministic Fallback
- **Generative AI Integration**: Compatible with **Google Gemini 2.5 Flash** and **Groq** APIs.
- **Prompt-Injection Defense**: User notes and free-text inputs are encapsulated inside inert `<UNTRUSTED_USER_NOTES>` delimiters with strict system instructions prohibiting prompt escape. Outputs are type-checked, schema-validated, and length-bounded.
- **100% Offline Feature Parity**: If no API key is supplied or if network timeouts / API errors occur (`AbortSignal.timeout(8000)`), the application **never crashes**. It automatically falls back to its deterministic atmospheric rules engine.

---

## 3. Architecture & How It Works

### Architecture Diagram
```mermaid
graph TD
    Client["Browser Client (Vanilla HTML/CSS/JS)"] -->|POST /api/assess (JSON, CSP, textContent)| Server["Node.js Native HTTP Server"]
    Server -->|Body Size & Rate Limit Check| Limiter["In-Memory Rate Limiter & Security Headers"]
    Limiter -->|Strict Schema Validation| Validator["src/validate.js"]
    Validator -->|Sanitized Input| Engine["src/engine.js (Atmospheric Engine)"]
    Engine -->|Direct Exposure & Berkeley Earth Math| Impact["Impact Calculator"]
    Engine -->|Thermal Inversion Scheduling| Routine["Diurnal Routine Engine"]
    Engine -->|Room-by-Room Checklist| Hacks["IAQ Hack Engine"]
    Engine -->|Vulnerability & Smog Advisories| Rules["Contextual Rules & Blueprint"]
    Engine -->|Base Assessment| AILayer["src/ai.js (Gemini / Groq Integration)"]
    AILayer -->|API Key Configured?| AIBranch{"Key Available?"}
    AIBranch -->|Yes (with 8s Timeout)| LLM["Google Gemini / Groq API"]
    AIBranch -->|No or API Error| OfflineFallback["Deterministic Offline Plan"]
    LLM -->|Sanitized & Schema Checked| OutputMerge["Merge Bespoke Ideas + Summary"]
    OfflineFallback --> OutputMerge
    OutputMerge -->|200 OK Response| Client
```

### File Structure & Responsibilities
```
├── server.js               # Native HTTP server, security headers, rate limiting, static file serving
├── src/
│   ├── constants.js        # CPCB/WHO AQI breakpoints, Berkeley Earth factors, sample presets
│   ├── validate.js         # Strict payload validation, boundary checking, control-character stripping
│   ├── engine.js           # Quantitative impact math, diurnal routines, room-by-room IAQ hacks, blueprints
│   ├── planner.js          # Backward-compatibility re-export module pointing to engine.js
│   └── ai.js               # Gemini & Groq client, prompt injection isolation, schema parser, timeout handling
├── public/
│   ├── index.html          # Semantic HTML5, accessible landmarks, table scopes, live regions, zero inline scripts
│   ├── styles.css          # Fresh atmospheric palette, dark/light theme, contrast >= 4.5:1, print stylesheet
│   └── app.js              # Safe textContent rendering (NO innerHTML), preset handlers, export actions
├── test/
│   ├── validate.test.js    # Validation rules, payload boundary checks, XSS sanitization tests
│   ├── engine.test.js      # Impact math, cigarette equivalence, diurnal routines, IAQ hacks, warnings
│   ├── planner.test.js     # Legacy re-export parity verification
│   ├── ai.test.js          # Prompt injection defense, schema enforcement, network timeout tests
│   └── server.test.js      # Status codes (200, 400, 404, 405, 413, 429), path traversal & security headers
├── .env.example            # Environment variables template
├── .gitignore              # Ignores node_modules, logs, .env to stay lightweight
└── package.json            # Scripts: npm start, npm test (zero external production dependencies)
```

---

## 4. How to Run and Test

### Prerequisites
- Node.js version 18.0.0 or higher (`node -v`).

### 1. Installation & Environment Setup
Clone the repository and copy the environment template:
```bash
cp .env.example .env
```
*(Optional)* Add your Gemini or Groq API key inside `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
# or
GROQ_API_KEY=your_groq_api_key_here
```
> **Note**: Even without an API key, the app functions 100% offline with full feature parity.

### 2. Run the Server
```bash
npm start
```
The server will start at **http://localhost:3000**. Open this URL in any modern browser.

### 3. Run Automated Tests
```bash
npm test
```
To run tests with code coverage analysis:
```bash
npm run test:coverage
```
**Test Results**: **66 automated tests across 15 test suites** with **98.06% code coverage** (100% in constants, engine, planner, and validate; 99.23% in AI; 92.94% in HTTP server), executing via Node's native `node:test` runner with 100% pass rate in <300ms.

---

## 5. Evaluation Criteria Mapping

### 1. Code Quality
- **Modular Structure**: Strict separation of concerns (`validate.js`, `engine.js`, `ai.js`, `server.js`, `public/app.js`).
- **Pure Functions & Immutability**: Business logic in `engine.js` and `validate.js` is pure and deterministic, eliminating side-effects.
- **Memory Safety**: `RateLimiter` implements automatic TTL cleanup to prevent unbounded memory growth in long-running processes.
- **JSDoc**: Comprehensive JSDoc annotations documenting parameter types and return contracts.
- **Zero Magic Numbers**: All thresholds, emission factors, and benchmarks reside in `src/constants.js`.

### 2. Security & Defensive Engineering
- **Security Headers**:
  - `Content-Security-Policy`: Restricts scripts to `'self'`, fonts to Google Fonts, and blocks unauthorized framing.
  - `X-Content-Type-Options: nosniff`: Prevents MIME-confusion attacks.
  - `X-Frame-Options: DENY`: Defends against clickjacking.
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `Permissions-Policy: interest-cohort=()`.
- **Sliding-Window Rate Limiting**: Per-IP sliding-window rate limiter with automatic stale key cleanup.
- **Payload Size Capping**: Rejects requests exceeding 64 KB with `413 Payload Too Large`.
- **Path Traversal Defense**: Resolves and verifies canonical file paths against `PUBLIC_DIR`, returning `403 Forbidden` for traversal attempts.
- **DOM-XSS Prevention**: `public/app.js` renders all dynamic content exclusively using `document.createElement`, `textContent`, and safe DOM attributes—**ZERO use of `innerHTML` or `dangerouslySetInnerHTML`**.
- **Prompt Injection Defense**: Untrusted user text is isolated inside inert `<UNTRUSTED_USER_NOTES>` tags with explicit model instructions to ignore enclosed commands. Output is strictly bounded, type-checked, and length-capped.

### 3. Resilience & Offline Parity
- **Zero Production Dependencies**: Uses only Node.js native modules (`node:http`, `node:fs`, `node:path`, `node:url`).
- **100% Offline Capable**: If no API key is provided, or if the AI provider times out after 8 seconds, the application automatically falls back to its deterministic rule engine without throwing errors or breaking user experience.
- **Dual AI Provider Support**: Native support for both Google Gemini API and Groq API.

### 4. Accessibility & Responsive Design (WCAG 2.1 AA)
- **High Contrast**: Default light theme achieves 13.5:1 text-to-background contrast; dark theme achieves 14.5:1 contrast, exceeding AAA standards.
- **Semantic HTML5**: Utilizes landmarks (`<header>`, `<main>`, `<section>`, `<fieldset>`, `<footer>`), descriptive form labels, and clear help texts.
- **Screen Reader Announcements**: Uses `aria-live="assertive"` for error summaries and `aria-live="polite"` for asynchronous status updates.
- **Keyboard Navigation**: Includes a skip-to-main-content link, accessible tab orders, and high-visibility focus indicators (`:focus-visible`).
- **Responsive Layout**: Fluid CSS grid down to 320px screen widths.
- **Print Stylesheet**: Dedicated `@media print` rules clean up UI controls for professional paper/PDF reports.

---

## 6. License
MIT License. Engineered for community environmental health and sustainable urban living.
