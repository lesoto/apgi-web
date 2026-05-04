# APGI Marketing Website + Quiz Implementation Audit

Date: 2026-05-04
Scope: static marketing site, quiz/assessment flows, and Express backend integration.

## Coverage and Entry Points
- Total HTML pages reviewed: 62.
- Primary entry points: `Landing.html` (`/`), `Home.html`, `Quiz.html`, `Assessment.html`, `Assessment-OnePage.html`, `APGI-Assessment.html`, `Auth.html`, `Pricing.html`, `Contact.html`, and funnel pages under `funnels/`.
- Shared frontend runtime: `config.js` → `assets/js/environment-config.js` → auth/payment/navigation helpers.
- Backend/API entry point: `server.js` (Express static + `/api/*` endpoints).

### HTML pages reviewed
- `404.html`
- `APGI-Assessment.html`
- `APGI-Experiments.html`
- `APGI-Signature.html`
- `APGI-Software-System.html`
- `Admin-Dashboard.html`
- `App-Appendix.html`
- `App-Explorer.html`
- `Assessment-OnePage.html`
- `Assessment.html`
- `Auth.html`
- `Book-Available-Now.html`
- `Book-Outline.html`
- `Contact.html`
- `Epistemic-architecture-paper.html`
- `Framework-paper.html`
- `Funnels.html`
- `Home.html`
- `Landing.html`
- `Lquid-networks-paper.html`
- `Multi-scale-consciousness-paper.html`
- `Papers-index.html`
- `Papers.html`
- `Payment-Success.html`
- `Pricing.html`
- `Privacy-Policy.html`
- `Profile.html`
- `Quiz.html`
- `SCI/Academic-Dashboard.html`
- `SCI/Consciousness-Visualization.html`
- `SCI/Neuromodulatory-Cascade.html`
- `SCI/PsyStates-Visualizer.html`
- `SCI/PsyStates.html`
- `SCI/State-Network.html`
- `Signature.html`
- `State-Assessment.html`
- `Terms-of-Service.html`
- `funnels/1_individual_self_explorers.html`
- `funnels/1_individual_self_explorers_journey.html`
- `funnels/2_therapists_coaches.html`
- `funnels/2_therapists_coaches_journey.html`
- `funnels/3_academic_researchers.html`
- `funnels/3_academic_researchers_journey.html`
- `funnels/4_organizational_development.html`
- `funnels/4_organizational_development_journey.html`
- `funnels/5_educational_institutions.html`
- `funnels/5_educational_institutions_journey.html`
- `funnels/6_healthcare_professionals.html`
- `funnels/6_healthcare_professionals_journey.html`
- `funnels/7_tech_industry_professionals.html`
- `funnels/7_tech_industry_professionals_journey.html`
- `funnels/ad-display.html`
- `funnels/social-media-ads.html`

## Six-Dimension Assessment

### 1) Architecture and Design — **76/100**
**Strengths**
- Clear monorepo split between static pages and an Express API server.
- Reusable shared assets exist (`assets/js/*`, `assets/css/*`) and navigation is componentized with runtime injection.
- Environment abstraction (`config.js`, `environment-config.js`) and dedicated services for auth/payment indicate modular intent.

**Gaps**
- Large reliance on globally-scoped browser singletons (`window.*`) increases coupling and makes change-impact broad.
- Server has duplicated security middleware configuration (Helmet declared twice), creating maintainability risk.
- Mixed persistence model (SQLite + in-memory arrays/maps for some operational data) undermines scalability and operational consistency.
- Error handling/logging are mostly console-based and not structured for observability or alerting.

### 2) Performance and Efficiency — **72/100**
**Strengths**
- Static file serving from Express is simple and predictable.
- Presence of fallback and optimization scripts suggests awareness of runtime resilience.

**Gaps**
- Many pages include multiple JS/CSS payloads with limited evidence of critical-path minimization.
- No explicit long-lived cache-control strategy, ETag tuning, asset fingerprinting, or brotli/gzip policy visible at app layer.
- Runtime navigation injection adds client round-trip for primary chrome.
- No proven performance budgets (LCP/CLS/TBT targets) or automated Lighthouse/WebPageTest gating.

### 3) Security — **70/100**
**Strengths**
- Good baseline middleware choices: Helmet, CORS allowlist, rate limiting, bcrypt password hashing, JWT auth.
- SQL queries use parameterized placeholders, reducing classic SQL injection risk.

**Gaps**
- CSP allows `'unsafe-inline'` in scripts/styles, reducing XSS protection efficacy.
- Role assignment is accepted from registration payload (`role = "user"` default but writable), creating privilege-escalation risk unless strictly constrained.
- JWT secret/API key fallback warnings exist, but non-production startup can continue with weak defaults.
- No visible CSRF strategy for cookie-based auth flows (if credentials mode or cookies are used by clients in future).

### 4) Code Quality and Maintainability — **74/100**
**Strengths**
- Linting is configured and currently passes.
- Project has a README-like architecture note (`CLAUDE.md`) and organized asset folders.

**Gaps**
- HTML consistency issues across page set: missing metadata and semantic completeness on many pages.
- Test coverage is effectively zero (`npm test` reports no tests found).
- Mixed coding styles and duplicate patterns (e.g., middleware duplication) increase maintenance cost.
- Accessibility quality is uneven across a large page inventory and requires formal auditing.

### 5) Integration and Compatibility — **75/100**
**Strengths**
- Thoughtful CDN fallbacks for major frontend libraries (React/D3/Chart.js/Plotly/Recharts).
- Subdirectory-aware navigation loading supports `SCI/` and `funnels/` sections.

**Gaps**
- No documented browser support matrix and no automated cross-browser CI checks.
- Configuration management is partially centralized, but static pages still have brittle script-order dependencies.
- Backward compatibility/versioning strategy for APIs and frontend contracts is not explicit.

### 6) Compliance and Standards — **68/100**
**Strengths**
- Privacy/Terms pages exist and indicate compliance intent.

**Gaps**
- WCAG conformance is not demonstrated with automated + manual evidence.
- No explicit GDPR/CCPA implementation details observed (consent logging, data subject request workflow, retention/deletion automation).
- W3C validation and semantic checks are not integrated into CI.

## Overall Score: **73/100**
This is a **functional but flawed implementation**: architecture and security foundations are present, but major quality, compliance, and scalability controls are incomplete.

## Prioritized Actions to Reach 100/100

### P0 (Immediate, highest risk)
1. **Security hardening**
   - Remove inline script/style dependence and enforce strict CSP (nonce/hash-based policies).
   - Force strong secrets in all environments except explicit local-dev mode; fail fast otherwise.
   - Lock registration role to user server-side; manage role changes only via admin-only endpoint + audit log.
   - Add centralized input validation schemas (e.g., Zod/Joi) for all API payloads.
2. **Persistence and integrity**
   - Eliminate in-memory production data stores; move consultations/progress fully to SQLite/Postgres.
   - Add DB migration/versioning workflow and backup/restore procedures.

### P1 (Near-term)
3. **Performance engineering**
   - Add compression middleware and immutable cache headers for fingerprinted assets.
   - Introduce build pipeline for minification/tree-shaking and code-splitting where possible.
   - Define and enforce Core Web Vitals budgets in CI.
4. **Quality and test depth**
   - Establish baseline tests: API auth flows, quiz submission, assessment scoring, and navigation loading.
   - Add E2E tests (Playwright/Cypress) across key funnels and quiz states.
   - Add automated accessibility checks (axe) and HTML validation jobs.

### P2 (Maturity and governance)
5. **Architecture refinement**
   - Gradually migrate global `window.*` services to module-scoped architecture with explicit dependency injection.
   - Standardize structured logging (request-id correlation, severity levels) and error telemetry pipeline.
6. **Compliance operations**
   - Implement consent management, retention/deletion policy automation, and DSAR handling playbooks.
   - Document browser/API support policy, versioning guarantees, and deprecation timelines.

## Evidence from repository checks
- `npm run lint` passes.
- `npm test` reports no tests found.
- Static page quality scan found missing metadata/semantic coverage across a substantial fraction of pages (description/lang/h1/title inconsistencies).
