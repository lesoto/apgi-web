# APGI Framework Website — Comprehensive Audit Report

**Audit Date:** 2026-02-23
**Auditor:** Automated End-to-End Audit (Claude Code)
**Repository:** `lesoto/apgi-web` — branch `claude/website-audit-f0POf`
**Scope:** All HTML pages, JavaScript assets, CSS assets, backend API (`server.js`), funnels, SCI visualizations, and marketing components.

---

## Executive Summary

The APGI Framework website is a multi-page psychology assessment and marketing platform with a Node/Express backend, Stripe payment integration, and Tailwind CSS styling. The site is architecturally coherent and visually polished, but has **not reached production readiness**. Several show-stopping issues would cause the server to crash on cold start, make payment processing impossible, and result in total data loss after any restart.

The most critical finding is the **absence of a `.env` file**: without `STRIPE_SECRET_KEY` and `JWT_SECRET`, the server will fail to start or produce broken behavior immediately. Beyond that, the backend stores all users in a plain JavaScript array (wiped on every restart), two client-called auth endpoints are entirely absent from `server.js`, and every conversion-critical CTA button across all five marketing funnel pages links to anchor targets that do not exist in the DOM.

Positively, the codebase demonstrates solid security awareness (Helmet, rate-limiting, input sanitisation, CSP headers), a well-structured CDN fallback system, a thorough design system, and reasonable accessibility scaffolding. These are good foundations to build on.

**Recommended action before any production deployment:** resolve the five Critical bugs, then systematically work through High-severity items.

---

## KPI Scores

| # | KPI | Score | Rationale |
|---|-----|------:|-----------|
| 1 | **Functional Completeness** | **34 / 100** | Server crashes without `.env`; no persistent storage; 2 backend endpoints missing; all funnel CTAs non-functional; password reset unimplemented; book purchase links are fake placeholders |
| 2 | **UI/UX Consistency** | **58 / 100** | Strong design system and Tailwind usage; however, Landing.html footer has 12 dead `#` links, responsive breakpoints are inconsistent across pages, and scarcity counters are static |
| 3 | **Responsiveness & Performance** | **62 / 100** | Performance optimizer, lazy loading, and CDN fallbacks are in place; canvas-heavy SCI visualizations have no mobile degradation path; `<meta charset>` mis-ordered in some SCI pages |
| 4 | **Error Handling & Resilience** | **44 / 100** | CDN fallbacks, global error handlers, and rate-limiting exist; however, 114 `console.*` calls remain in production JS, form submission failures are silent, and no backend error-monitoring (Sentry DSN is placeholder) |
| 5 | **Overall Implementation Quality** | **38 / 100** | Architectural intent is strong, but critical data-persistence, payment, and auth gaps, combined with XSS-risk `innerHTML` patterns and hardcoded test credentials, pull the score below the midpoint |

---

## Bug Inventory

Bugs are listed in descending severity. Each entry includes: **ID**, severity, affected file(s) / URL, description, reproduction steps, and expected vs. actual behaviour.

---

### CRITICAL

---

#### BUG-001 — Missing `.env` File Crashes Server on Start

| Field | Detail |
|-------|--------|
| **Severity** | Critical |
| **Affected** | `server.js` (line 9, 21), `/api/*` (all routes) |
| **Category** | Configuration / Deployment |

**Description:** `server.js` calls `require("stripe")(process.env.STRIPE_SECRET_KEY)` at module load time and reads `process.env.JWT_SECRET` for every authenticated route. No `.env` file exists in the repository. The only reference is `.env.example` with all placeholder values.

**Reproduction:**
1. Clone the repository on a clean machine.
2. Run `npm start`.
3. Observe either a Stripe SDK instantiation error (if key is `undefined`) or silent undefined behaviour on every JWT-authenticated call.

**Expected:** Server starts and all routes function correctly.
**Actual:** Stripe initialises with `undefined`; all auth tokens generated with `undefined` secret are insecure; `/api/create-checkout-session` throws immediately.

**Fix:** Create `.env` from `.env.example` and populate all required secrets before deployment. Add a startup guard that validates required env vars.

---

#### BUG-002 — In-Memory User Store Loses All Data on Restart

| Field | Detail |
|-------|--------|
| **Severity** | Critical |
| **Affected** | `server.js` (line 125): `const users = [];` |
| **Category** | Data Persistence |

**Description:** The entire user database is a plain array declared at module scope. Every server restart wipes all registered accounts. The `.env.example` references `DATABASE_URL` (PostgreSQL) but it is never consumed in `server.js`.

**Reproduction:**
1. Register a user via `POST /api/auth/register`.
2. Restart the server (`npm start`).
3. Attempt to log in with the registered credentials.

**Expected:** Login succeeds; user data persists.
**Actual:** Login returns 404 "User not found" — the array is empty.

**Fix:** Integrate a persistent data store (PostgreSQL via the referenced `DATABASE_URL`, or SQLite for low-traffic start). Migrate the `users` array and all progress/assessment records to the database.

---

#### BUG-003 — Password Reset Endpoints Not Implemented in Server

| Field | Detail |
|-------|--------|
| **Severity** | Critical |
| **Affected** | `assets/js/auth-service.js` (lines 342, 368) → `server.js` (no matching routes) |
| **Category** | Auth / Missing Backend Route |

**Description:** `auth-service.js` calls `POST /api/auth/request-reset` and `POST /api/auth/reset-password`. Neither route exists in `server.js`. All server routes were enumerated — these two are absent.

**Reproduction:**
1. Open `Auth.html`.
2. Click "Forgot Password" and submit the form.
3. Observe the network request in DevTools.

**Expected:** A password reset email is dispatched; user can reset password.
**Actual:** Server returns `404 Not Found`. The client may silently ignore the error (no error UI on the reset flow was observed).

**Fix:** Implement `POST /api/auth/request-reset` (generate token, send email) and `POST /api/auth/reset-password` (validate token, hash new password) in `server.js`. Configure an email transport (SMTP/SendGrid).

---

#### BUG-004 — All Funnel CTA Buttons Link to Non-Existent Anchor Targets

| Field | Detail |
|-------|--------|
| **Severity** | Critical |
| **Affected** | `funnels/1_individual_self_explorers.html`, `funnels/2_therapists_coaches.html`, `funnels/3_academic_researchers.html`, `funnels/4_organizational_development.html`, `funnels/social-media-ads.html` |
| **Category** | Functional / Conversion |

**Description:** Every primary CTA across all five funnel pages uses anchor links (`href="#signup"`, `href="#contact"`, `href="#demo"`, `href="#whitepaper"`, `href="#quote"`). None of these IDs exist in the page DOM. No signup form, contact form, demo registration, or download modal is present anywhere on these pages.

**Reproduction:**
1. Open `funnels/1_individual_self_explorers.html`.
2. Click "Start Mapping Your Mind" (primary CTA).
3. Observe: browser scrolls to top of page or does nothing.

**Expected:** A sign-up form, modal, or checkout flow is triggered.
**Actual:** Browser cannot find the anchor; the user is stranded with no conversion path.

**Breakdown by page:**

| Page | Broken Anchors |
|------|---------------|
| `1_individual_self_explorers.html` | `#signup` (multiple) |
| `2_therapists_coaches.html` | `#signup`, `#demo` |
| `3_academic_researchers.html` | `#whitepaper`, `#quote` |
| `4_organizational_development.html` | `#contact` (multiple) |
| `social-media-ads.html` | `#signup` |

**Fix:** Create the corresponding form sections with matching IDs, or replace anchors with functional modal triggers wired to the `/api/subscribe` or `/api/consultations` endpoints.

---

#### BUG-005 — Book Purchase Links Use Fake Placeholder IDs

| Field | Detail |
|-------|--------|
| **Severity** | Critical |
| **Affected** | `Book-Available-Now.html` (lines 362–446) |
| **Category** | Functional / Revenue |

**Description:** All purchase and download links on the book sales page use clearly fake identifiers:

| Platform | Link |
|----------|------|
| Amazon (eBook) | `https://www.amazon.com/dp/B0XYZ12345` |
| Amazon (Audiobook) | `https://www.audible.com/pd/.../B0XYZ12346` |
| Apple Books | `id6451234567` / `id6451234568` |
| Google Play | `id=ABC123` |
| Direct EPUB download | `https://example.com/download/...epub` |
| Direct MP3 download | `https://example.com/download/...mp3` |

**Reproduction:**
1. Open `Book-Available-Now.html`.
2. Click any purchase or download button.
3. Observe: link leads to a dead Amazon/Apple/example.com URL.

**Expected:** User reaches the actual product listing and can purchase.
**Actual:** 404 on every storefront; `example.com` shows ICANN placeholder page.

**Fix:** Replace all placeholder IDs and URLs with real storefront listings once the book is published, or gate the page behind a "coming soon" notice until then.

---

### HIGH

---

#### BUG-006 — JWT Tokens Stored in `localStorage` (XSS Vulnerability)

| Field | Detail |
|-------|--------|
| **Severity** | High |
| **Affected** | `assets/js/auth-service.js` (lines 22, 95, 265) |
| **Category** | Security |

**Description:** After login, the JWT access token is written to `localStorage`. Any XSS vulnerability anywhere on the site allows an attacker to read the token and impersonate the user indefinitely.

**Fix:** Store access tokens in memory (JS variable) and use `HttpOnly` cookies for the refresh token. If `localStorage` must be used, implement strict CSP and sanitise all dynamic HTML.

---

#### BUG-007 — `innerHTML` Used with Unsanitised Data (XSS Risk)

| Field | Detail |
|-------|--------|
| **Severity** | High |
| **Affected** | `assets/js/payment-service.js` (lines 252, 300, 341, 377), `Admin-Dashboard.html` (lines 356, 489, 562) |
| **Category** | Security |

**Description:** Multiple components assign server-provided or user-provided strings directly to `element.innerHTML` with no sanitisation. An attacker who can influence stored data (e.g. a malicious assessment submission) could inject script tags that execute in other users' browsers.

**Fix:** Replace `innerHTML` assignments with `textContent` where HTML is not needed, or use a sanitisation library (DOMPurify) before assigning to `innerHTML`.

---

#### BUG-008 — `/api/quiz-results` Endpoint Missing from Server

| Field | Detail |
|-------|--------|
| **Severity** | High |
| **Affected** | `assets/js/offline-quiz-manager.js` (line 101) → `server.js` |
| **Category** | Missing Backend Route |

**Description:** `offline-quiz-manager.js` posts completed quiz results to `POST /api/quiz-results`. This route does not exist in `server.js`. Quiz completions are silently lost when the device comes back online.

**Fix:** Implement `POST /api/quiz-results` in `server.js` and store results in the persistent database (see BUG-002).

---

#### BUG-009 — Landing.html Footer Contains 12 Dead `href="#"` Links

| Field | Detail |
|-------|--------|
| **Severity** | High |
| **Affected** | `Landing.html` (lines 1114–1140) |
| **Category** | Functional Completeness |

**Description:** The entire footer link block on the landing page consists of `href="#"` placeholders. Sections labelled Features, Pricing, Research, About, Blog, Contact, Privacy, Terms, Compliance, Twitter, LinkedIn, and GitHub all point to `#`.

**Reproduction:**
1. Open `Landing.html`.
2. Scroll to footer.
3. Click any footer link.

**Expected:** User navigates to the corresponding page or section.
**Actual:** Page jumps to top; no navigation occurs.

**Fix:** Replace `#` with actual page paths (e.g. `Home.html#pricing`, `Privacy-Policy.html`, `Terms-of-Service.html`) and real social media profile URLs.

---

#### BUG-010 — Hardcoded Fake Stripe Key in `environment-config.js`

| Field | Detail |
|-------|--------|
| **Severity** | High |
| **Affected** | `assets/js/environment-config.js` (line 51, 147) |
| **Category** | Configuration / Security |

**Description:** The client-side environment config falls back to `pk_test_51234567890abcdef` — a clearly fabricated test key. If Stripe loads with this key, all payment attempts will fail silently or throw SDK errors.

```js
"pk_test_51234567890abcdef"  // line 51 — hardcoded fake
```

**Fix:** Remove the hardcoded fallback. The publishable key must be injected from the server or a build-time environment variable. Add a startup validation that throws if the key is not a valid `pk_live_` or `pk_test_` value from the actual Stripe dashboard.

---

#### BUG-011 — Social Media links in `Paper.html` Point to Unverified Accounts

| Field | Detail |
|-------|--------|
| **Severity** | High |
| **Affected** | `Paper.html` (lines 2671, 2682) |
| **Category** | Functional / Brand |

**Description:** Footer social links reference `https://www.tiktok.com/@apgi-framework` and `https://www.youtube.com/@apgi-framework`. These accounts have not been verified to exist and may be owned by third parties.

**Fix:** Verify account ownership before linking, or replace with verified channel URLs.

---

#### BUG-012 — Testimonial Author Links to Fake Twitter Profile

| Field | Detail |
|-------|--------|
| **Severity** | High |
| **Affected** | `Home.html` (line 2158) |
| **Category** | Credibility / Functional |

**Description:** A testimonial block links to `https://twitter.com/DrMichaelRivers`. This is a placeholder name; the account likely does not exist or belongs to an unrelated person.

**Fix:** Use a real verified testimonial with a real (and consented) social media link, or remove the link entirely and use initials + title only.

---

### MEDIUM

---

#### BUG-013 — Filename Typo: `Neuromoduratory-Cascade.html` (5 pages affected)

| Field | Detail |
|-------|--------|
| **Severity** | Medium |
| **Affected** | `SCI/Neuromoduratory-Cascade.html` (filename), `components/navigation.html` (lines 53, 178), `Assessment.html` (line 2241), `Assessment-OnePage.html` (line 1407), `APGI-Software-System.html` (line 801) |
| **Category** | Content / Broken Link Risk |

**Description:** The filename and all five linking `href` attributes spell the word as **"Neuromoduratory"** instead of the correct **"Neuromodulatory"**. While the link currently resolves because both the filename and `href` share the same typo, any external link, search engine index, or future rename will break.

**Fix:** Rename `SCI/Neuromoduratory-Cascade.html` → `SCI/Neuromodulatory-Cascade.html` and update all five `href` references simultaneously.

---

#### BUG-014 — `<meta charset>` Declared After Script Tags in SCI Pages

| Field | Detail |
|-------|--------|
| **Severity** | Medium |
| **Affected** | `SCI/Academic-Dashboard.html` (lines 4–21) |
| **Category** | Standards Compliance / Performance |

**Description:** Four `<script>` tags are loaded before `<meta charset="UTF-8">`. Per the HTML spec, charset must be in the first 1024 bytes of the document. Scripts that execute before charset declaration can misinterpret multi-byte characters.

```html
<script src="../assets/js/performance-optimizer.js"></script>  <!-- line 4 -->
<script src="../assets/js/accessibility-enhancer.js"></script>
<script src="../assets/js/navigation.js"></script>
<script src="../assets/js/cdn-fallbacks.js"></script>
<meta charset="UTF-8" />  <!-- line 21 — TOO LATE -->
```

**Fix:** Move `<meta charset="UTF-8">` to be the very first element inside `<head>`.

---

#### BUG-015 — Malformed HTML in `social-media-ads.html` (7 Instances)

| Field | Detail |
|-------|--------|
| **Severity** | Medium |
| **Affected** | `funnels/social-media-ads.html` (lines 573, 596, 619, 642, 665, 688, 711) |
| **Category** | HTML Validity |

**Description:** A `style` attribute appears *after* the self-closing `/>` of `<img>` tags, making it orphaned text content rather than an attribute:

```html
<img
  src="../assets/images/ads/APGI-AD-SELF-EXPLORERS-1.png"
  alt="..."
/>
style="width: 100%; height: 100%; object-fit: cover;">  <!-- invalid -->
```

All seven images on the page are affected. The images render (browsers are forgiving) but the intended `object-fit: cover` style is never applied, causing layout distortion.

**Fix:** Move the `style` attribute inside the opening `<img` tag before `/>`.

---

#### BUG-016 — Static Scarcity Counter ("127 claimed") Not Connected to Inventory

| Field | Detail |
|-------|--------|
| **Severity** | Medium |
| **Affected** | `funnels/1_individual_self_explorers.html` |
| **Category** | Functional / Misleading Content |

**Description:** The page displays "🔥 Launch Bonus: First 500 — 127 claimed" as a hardcoded string. The number never changes regardless of actual purchases. If the product sells more than 500 units, the counter remains "127 claimed".

**Fix:** Fetch the real claim count from a backend counter endpoint, or remove the false scarcity element entirely.

---

#### BUG-017 — No Email Provider Configured (Mailchimp/ConvertKit Keys Are Placeholders)

| Field | Detail |
|-------|--------|
| **Severity** | Medium |
| **Affected** | `.env.example`, `assets/js/form-handler.js` (line 6), `server.js` (line 515) |
| **Category** | Functional — Email Capture |

**Description:** `POST /api/subscribe` is implemented on the server but all email provider credentials (`VITE_MAILCHIMP_API_KEY`, `VITE_CONVERTKIT_API_KEY`, list IDs) are placeholder strings. The route will execute but will not add any subscriber to any list. No confirmation email will be sent.

**Fix:** Obtain real API keys from Mailchimp or ConvertKit, populate `.env`, and test the subscribe flow end-to-end.

---

#### BUG-018 — No CSRF Protection on State-Mutating API Routes

| Field | Detail |
|-------|--------|
| **Severity** | Medium |
| **Affected** | `server.js` — all `POST`/`PUT` routes |
| **Category** | Security |

**Description:** Authenticated `POST` and `PUT` endpoints (register, change-password, subscribe, create-checkout-session, consultations, progress) are not protected against Cross-Site Request Forgery. An attacker can craft a form on an external site that submits to these endpoints using the victim's cookies (if cookies are ever used).

**Fix:** Implement CSRF tokens (e.g. the `csurf` middleware for Express) on all state-mutating routes, or ensure the API is strictly token-based (Bearer header only, never cookies).

---

#### BUG-019 — 114 `console.*` Statements Remain in Production JavaScript

| Field | Detail |
|-------|--------|
| **Severity** | Medium |
| **Affected** | All files in `assets/js/` (highest concentrations: `auth-service.js` ×10, `payment-service.js` ×9, `progress-tracker.js` ×7) |
| **Category** | Code Quality / Information Disclosure |

**Description:** `console.log`, `console.warn`, and `console.error` calls are scattered throughout all JS files. In production, these leak internal state (user objects, API payloads, webhook data) to anyone with DevTools open.

Notable: `payment-service.js` line 423 logs the entire Stripe webhook payload to the console.

**Fix:** Remove or gate all `console.*` calls behind an `isDev` flag. For persistent error tracking, route errors through `error-logger.js` to the (currently placeholder) Sentry DSN.

---

#### BUG-020 — Sentry DSN Is a Placeholder — No Production Error Monitoring

| Field | Detail |
|-------|--------|
| **Severity** | Medium |
| **Affected** | `.env.example`: `SENTRY_DSN=your_sentry_dsn_for_error_tracking` |
| **Category** | Observability |

**Description:** Error tracking is architecturally anticipated but the Sentry DSN has never been populated. Errors in production are invisible to the development team.

**Fix:** Create a Sentry project, populate `SENTRY_DSN` in `.env`, and verify that uncaught exceptions reach the Sentry dashboard.

---

#### BUG-021 — Mobile Dropdown Overlay Ignores Status Bar / Safe Areas

| Field | Detail |
|-------|--------|
| **Severity** | Medium |
| **Affected** | `components/navigation.html` (lines 670–699) |
| **Category** | Responsiveness |

**Description:** The mobile menu uses `position: fixed; top: 0; left: 0; height: 100vh` with a hardcoded `padding-top: 4rem`. On notched phones (iPhone X and later) or devices with software navigation bars, the menu content is clipped behind the status bar or navigation bar.

**Fix:** Add `padding-top: env(safe-area-inset-top)` and `padding-bottom: env(safe-area-inset-bottom)` to the overlay container.

---

#### BUG-022 — Tablet Grid Remains 3-Column at 968 px (Too Cramped)

| Field | Detail |
|-------|--------|
| **Severity** | Medium |
| **Affected** | `funnels/4_organizational_development.html` (lines 346–356) |
| **Category** | Responsiveness |

**Description:** At the 968 px breakpoint the visualization grid continues to use `grid-template-columns: repeat(3, 1fr)`. On 768–968 px tablets this produces three very narrow columns that overflow or require horizontal scrolling.

**Fix:** Change the breakpoint to switch to `repeat(2, 1fr)` at ≤968 px and `repeat(1, 1fr)` at ≤600 px.

---

#### BUG-023 — Missing `<label>` Elements on Email Input Fields (Accessibility)

| Field | Detail |
|-------|--------|
| **Severity** | Medium |
| **Affected** | All funnel email capture forms, `Home.html` contact section |
| **Category** | Accessibility — WCAG 2.1 Level A |

**Description:** Email input fields use `placeholder` text as the only visible label. Placeholders disappear when the user types and are not announced by screen readers as field labels.

**Fix:** Add a `<label for="...">` element associated with each `<input>`, or use `aria-label` if a visible label is not desired.

---

#### BUG-024 — Inconsistent Pricing Models Across Funnel Pages

| Field | Detail |
|-------|--------|
| **Severity** | Medium |
| **Affected** | All four funnel pricing pages |
| **Category** | UX / Content Consistency |

**Description:** Each funnel presents a different pricing structure with no cross-references:

| Page | Model |
|------|-------|
| Individual Self-Explorers | $149 one-time + $49/year |
| Therapists & Coaches | $499/$899/$1,499 per year |
| Academic Researchers | $1,999/year |
| Organisational Development | $10K/$25K/Custom per year |

A user who visits multiple pages receives contradictory signals about the product's price tier. No "compare plans" page exists to contextualise these.

**Fix:** Create a unified pricing page; link each funnel page to it. Ensure that pricing reflects the same product at different access tiers, not four unrelated products.

---

### LOW

---

#### BUG-025 — `prefers-reduced-motion` CSS Does Not Disable `transform` Animations

| Field | Detail |
|-------|--------|
| **Severity** | Low |
| **Affected** | `components/navigation.html` (lines 504–509) |
| **Category** | Accessibility |

**Description:** The `@media (prefers-reduced-motion: reduce)` block sets `transition: none` but does not reset `transform` keyframe animations. Users sensitive to motion still experience animated transformations.

**Fix:** Add `animation: none; transform: none;` to the reduced-motion block for all elements that use keyframe animations.

---

#### BUG-026 — `event.target` Used Without Null-Guard in `social-media-ads.html`

| Field | Detail |
|-------|--------|
| **Severity** | Low |
| **Affected** | `funnels/social-media-ads.html` (line 725) |
| **Category** | JavaScript Robustness |

**Description:** `event.target.classList.add("active")` is called with no null check on `event.target`. If the function is invoked programmatically or via keyboard, a null reference error can crash the event handler.

**Fix:** Add `if (!event || !event.target) return;` before accessing `event.target`.

---

#### BUG-027 — Uncited Statistical Claims on Marketing Pages

| Field | Detail |
|-------|--------|
| **Severity** | Low |
| **Affected** | `funnels/2_therapists_coaches.html`, `funnels/3_academic_researchers.html` |
| **Category** | Content Integrity |

**Description:** Pages present statistical claims (e.g. `N = 2,847`, `r > 0.78`, `> 0.85` reliability, "6→2 Sessions to Aha") with no citations, linked research, or methodology notes. These may constitute misleading advertising in some jurisdictions.

**Fix:** Add footnote citations linking to the underlying research, or qualify the statistics with "internal pilot study" language.

---

#### BUG-028 — `analytics.js` / `site-search.js` Loaded But Not Validated

| Field | Detail |
|-------|--------|
| **Severity** | Low |
| **Affected** | `components/navigation.html` (lines 1071, 1074) |
| **Category** | Code Quality |

**Description:** The navigation component loads `assets/js/site-search.js` and `assets/js/analytics.js` but neither file's functionality has been audited for correctness. The analytics file contains localhost guards but the production tracking IDs remain as placeholders (`GA-XXXXXXXXX`, `apgi-framework.com` domain not confirmed).

**Fix:** Validate both scripts function correctly in production; populate real tracking IDs.

---

#### BUG-029 — `assessment-quiz.js` Loaded via `<script>` Tag on Non-Quiz Pages

| Field | Detail |
|-------|--------|
| **Severity** | Low |
| **Affected** | `Assessment.html`, `Assessment-OnePage.html` |
| **Category** | Performance |

**Description:** Both assessment pages load `assessment-quiz.js` (large file) unconditionally on page load. On pages where the quiz is not shown by default, this is an unnecessary download.

**Fix:** Lazy-load the script only when the quiz section becomes visible using dynamic `import()` or an Intersection Observer.

---

## Missing Features Log

The following features are referenced in the codebase, UI, or `.env.example` but are entirely absent or non-functional.

| # | Feature | Evidence of Intent | Status |
|---|---------|-------------------|--------|
| MF-01 | **Persistent database** | `DATABASE_URL` in `.env.example`; `REDIS_URL` reference | Not implemented — in-memory array only |
| MF-02 | **Password reset flow** | `auth-service.js` calls two reset endpoints | Backend routes absent |
| MF-03 | **Email subscription delivery** | `POST /api/subscribe` exists but provider not configured | API exists; no email sent |
| MF-04 | **Real Stripe payment integration** | Checkout session route exists; keys are undefined/fake | Route exists; zero transactions possible |
| MF-05 | **Admin authentication** | `ADMIN_API_KEY` env var; dashboard page exists | API key check exists; key is placeholder |
| MF-06 | **Funnel signup / contact forms** | CTA buttons on all 5 funnel pages | Forms completely absent from DOM |
| MF-07 | **Book purchase fulfilment** | `Book-Available-Now.html` with pricing | All purchase links are fake placeholders |
| MF-08 | **Consultation booking backend** | `POST /api/consultations` in server; UI in Admin-Dashboard | Endpoint exists but data is not persisted |
| MF-09 | **Quiz result persistence** | `offline-quiz-manager.js` posts to `/api/quiz-results` | Endpoint not in `server.js` |
| MF-10 | **Demo / whitepaper delivery** | `href="#demo"` and `href="#whitepaper"` in funnel CTAs | No modal, file, or redirect |
| MF-11 | **Live scarcity / inventory counter** | "127 claimed / First 500" on `1_individual_self_explorers.html` | Hardcoded static string |
| MF-12 | **Sentry error monitoring** | `SENTRY_DSN` placeholder in `.env.example`; `error-logger.js` file exists | DSN never populated |
| MF-13 | **Social media presence** | Links to TikTok, YouTube, Twitter accounts in multiple pages | Accounts unverified / may not exist |
| MF-14 | **Blog / Research section** | Footer links on `Landing.html` | Dead `href="#"` — no pages exist |
| MF-15 | **Privacy, Terms, Compliance pages for Landing** | Footer links on `Landing.html` | Only `Privacy-Policy.html` and `Terms-of-Service.html` exist on the root; not linked from Landing footer |
| MF-16 | **Neuromodulatory Cascade visualisation** (correct title) | `SCI/Neuromoduratory-Cascade.html` | File exists but linked with typo in 5 places |
| MF-17 | **SSL / HTTPS configuration** | `SSL_CERT_PATH` in `.env.example` | Not configured; no redirect HTTP→HTTPS |
| MF-18 | **Backup system** | `BACKUP_SCHEDULE`, `BACKUP_S3_BUCKET` in `.env.example` | Not implemented |
| MF-19 | **Mobile-optimised SCI visualizations** | Canvas-heavy visualizations in `SCI/` | No viewport scaling or mobile degradation path |
| MF-20 | **Conversion pixel tracking** (Facebook, Google Ads) | `funnel-tracking.js` tracks clicks but not pixels | No pixel code present |

---

## Actionable Recommendations

### Tier 1 — Block Production Deployment (Must Fix First)

1. **Create `.env` from `.env.example`** and populate all secrets: `STRIPE_SECRET_KEY`, `JWT_SECRET`, `ADMIN_API_KEY`. Add a boot-time validation guard in `server.js`.
2. **Integrate a persistent database.** PostgreSQL (already referenced) or SQLite. Migrate `users[]`, consultations, and progress arrays.
3. **Implement missing auth routes** `POST /api/auth/request-reset` and `POST /api/auth/reset-password` with a token store and email transport.
4. **Add `POST /api/quiz-results`** to `server.js` with database persistence.
5. **Replace all funnel CTA anchors** with real form sections or modal triggers wired to `/api/subscribe` and `/api/consultations`.
6. **Replace fake book purchase links** with real storefront URLs or add a "Not yet available" state.

### Tier 2 — Fix Before Marketing/Launch

7. **Move JWT to `HttpOnly` cookies** or at minimum stop storing the token in `localStorage` alongside an XSS vector.
8. **Replace `innerHTML` with `textContent` or DOMPurify** in `payment-service.js` and `Admin-Dashboard.html`.
9. **Configure email provider** (Mailchimp or ConvertKit) and verify the subscribe flow end-to-end.
10. **Remove the hardcoded `pk_test_512345...` Stripe key** fallback; inject the real publishable key at runtime.
11. **Replace all 12 `href="#"` links** in `Landing.html` footer with real destinations.
12. **Verify or remove social media links** and testimonial author handles.

### Tier 3 — Quality & Compliance

13. **Remove or gate `console.*` statements** — 114 calls across all JS files.
14. **Fix malformed HTML** in `social-media-ads.html` (7 misplaced `style=` attributes).
15. **Rename `Neuromoduratory-Cascade.html`** to `Neuromodulatory-Cascade.html` and update all 5 `href` references.
16. **Move `<meta charset>` to first position** in `SCI/Academic-Dashboard.html`.
17. **Add `<label>` elements** to all email input fields.
18. **Implement CSRF protection** on all state-mutating API routes.
19. **Populate and test Sentry DSN** for production error monitoring.
20. **Add `env(safe-area-inset-*)` padding** to mobile nav overlay.

### Tier 4 — Polish

21. Add citations or disclaimers to statistical marketing claims.
22. Implement real-time scarcity counter via API.
23. Create a unified pricing/compare-plans page.
24. Lazy-load `assessment-quiz.js` only when the quiz is rendered.
25. Add scroll-depth and form-interaction analytics tracking.
26. Extend `prefers-reduced-motion` block to cover `transform` animations.
27. Add mobile-degradation path (simplified SVG or static screenshot) for canvas-heavy SCI visualisations.

---

## File Reference Index

| File | Severity of Issues | Key Bugs |
|------|--------------------|----------|
| `server.js` | Critical | BUG-001, BUG-002, BUG-003, BUG-008 |
| `funnels/1_individual_self_explorers.html` | Critical | BUG-004, BUG-016 |
| `funnels/2_therapists_coaches.html` | Critical | BUG-004 |
| `funnels/3_academic_researchers.html` | Critical | BUG-004, BUG-027 |
| `funnels/4_organizational_development.html` | Critical | BUG-004, BUG-022 |
| `funnels/social-media-ads.html` | Medium | BUG-015, BUG-026 |
| `Book-Available-Now.html` | Critical | BUG-005 |
| `Landing.html` | High | BUG-009 |
| `assets/js/auth-service.js` | High | BUG-006 |
| `assets/js/payment-service.js` | High | BUG-007, BUG-010, BUG-019 |
| `assets/js/environment-config.js` | High | BUG-010 |
| `assets/js/offline-quiz-manager.js` | High | BUG-008 |
| `Admin-Dashboard.html` | High | BUG-007 |
| `Home.html` | High | BUG-012 |
| `Paper.html` | High | BUG-011 |
| `SCI/Academic-Dashboard.html` | Medium | BUG-014 |
| `SCI/Neuromoduratory-Cascade.html` | Medium | BUG-013 |
| `components/navigation.html` | Medium | BUG-013, BUG-021, BUG-025 |
| `.env` / `.env.example` | Critical | BUG-001, BUG-017, BUG-020 |

---

*Report generated 2026-02-23. For remediation questions, reference individual Bug IDs (BUG-XXX) or Missing Feature IDs (MF-XX).*
