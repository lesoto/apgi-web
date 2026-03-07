# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
# Development
npm run dev          # Start server with nodemon (hot reload) on port 3001
npm start            # Start server with node

# CSS
npm run build        # Build Tailwind CSS in watch mode
npm run build:once   # One-time Tailwind CSS build (assets/css/input.css → assets/css/tailwind-built.css)

# Quality
npm test             # Run Jest tests
npm run lint         # ESLint
npm run format       # Prettier (writes)

# Utilities
npm run screenshots  # Puppeteer screenshot workflow (screenshot-workflow.js)
```

## Architecture

This is a **vanilla HTML/JS frontend + Express.js backend** monorepo. There is no frontend build step beyond Tailwind CSS compilation.

### Backend (`server.js`)

Single Express.js server that serves both static files and a REST API on port 3001. It:

- Serves static HTML pages directly (`express.static(".")`)
- Exposes REST API at `/api/*`
- Injects frontend config at `/config.js` (reads server-side env vars, exposes as `window.env`)
- Serves `Landing.html` at `/`, `404.html` for 404s
- Uses SQLite (`apgi.db`) for users, consultations, progress, and quiz_results tables
- Uses in-memory storage for some data (consultations array, progressData Map) — these are not persisted to SQLite yet

**Required env vars**: `JWT_SECRET`, `ADMIN_API_KEY`, `STRIPE_SECRET_KEY` (server exits in production if missing).

### Frontend Architecture

Pages are standalone HTML files that load JS via `<script>` tags. Global singletons are established in this order:

1. **`/config.js`** (served by backend) → sets `window.env`
2. **`assets/js/environment-config.js`** → creates `window.envConfig` (reads `window.env`, provides typed config access)
3. **`assets/js/auth-service.js`** → creates `window.authService` (JWT auth, localStorage persistence)
4. **`assets/js/payment-service.js`** → creates `window.paymentService` (Stripe integration)
5. **`assets/js/navigation-loader.js`** → auto-loads `components/navigation.html` into `#navigation-container`

Pages in subdirectories (`SCI/`, `funnels/`) must adjust relative paths when loading these scripts.

### Page Groups

- **Root pages**: `Landing.html`, `Home.html`, `Quiz.html`, `Assessment.html`, `Profile.html`, `Pricing.html`, `Auth.html`, `Admin-Dashboard.html`, etc.
- **`SCI/`**: Scientific visualization tools (PsyStates, Academic Dashboard, Consciousness Visualization, etc.)
- **`funnels/`**: Audience-specific marketing pages (individual, therapists, academic, organizational, healthcare, tech)
- **`components/`**: Shared navigation component loaded dynamically

### Navigation

`components/navigation.html` is fetched and injected at runtime by `navigation-loader.js`. It detects subdirectories via `window.location.pathname` and adjusts the fetch path. If loading fails, an embedded fallback navigation is rendered.

### CSS

- Tailwind config in `tailwind.config.js` (scans all `.html` files)
- Custom fonts: Space Grotesk (display), IBM Plex Sans (body)
- Multiple fallback CSS files for offline/CDN-failure scenarios (`assets/css/tailwind-fallback.css`, `fontawesome-fallback.css`, etc.)

### CDN Fallbacks

The `assets/js/` directory contains fallback implementations for CDN-loaded libraries (React, ReactDOM, D3, Chart.js, Plotly, Recharts, Lucide) used when CDN is unavailable.

### Test/Dev Mode

`payment-service.js` and `auth-service.js` detect dev mode via `window.location.hostname === "localhost"` and simulate API calls rather than hitting real endpoints. The payment service also uses `window.envConfig.isProductionReady()` to determine test vs. live Stripe mode.
