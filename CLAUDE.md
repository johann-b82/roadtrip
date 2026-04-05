<!-- GSD:project-start source:PROJECT.md -->
## Project

**RoadTrip Planner**

A multi-user web app for planning camper road trips. Users define a home location, create trips with named stops, view routes on an interactive map, and discover points of interest around each stop. Deployed via Docker Compose with a React frontend, Node.js/Express backend, and PostgreSQL database.

**Core Value:** Users can plan a complete camper road trip — from home to stops to POIs — and see it visualized on a map with routing, distances, and timing.

### Constraints

- **Stack**: React (frontend), Node.js/Express (backend), PostgreSQL (database)
- **Maps**: OpenStreetMap + Leaflet + OSRM (no Google Maps)
- **Geocoding**: Nominatim (OSM-based, rate-limited — need caching strategy)
- **Deployment**: Docker Compose (all services containerized)
- **Auth**: Email/password + Google OAuth
- **Cost**: All external APIs must be free-tier compatible
<!-- GSD:project-end -->

<!-- GSD:stack-start source:research/STACK.md -->
## Technology Stack

## Recommended Stack
### Core Framework
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React | 19.2.1 | Frontend UI library | Latest stable with Activity component, useEffectEvent, and improved Server Component support. Production-ready with 6M+ weekly downloads. |
| Express.js | 5.2.1 | REST API backend | Latest LTS with improved error handling (rejected promises caught by router), ReDoS mitigation (path-to-regexp@8.x), and Node 18+ support. Drop-in replacement for v4 with better performance. |
| PostgreSQL | 18.3 | Relational database | Latest stable (Sept 2025) with asynchronous I/O improvements for batch operations, native uuid7() for timestamp-ordered UUIDs, and virtual generated columns. Required for complex trip/stop relationships and POI caching. |
| Node.js | 22.x LTS | Backend runtime | Latest LTS (March 2025) with native WebAssembly support, built-in URLPattern API, and npm 11. Fully compatible with Express 5.x. |
### Map & Routing
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Leaflet | 1.9.x | Map rendering | Stable library (1.9 series), 42KB, industry standard. v2.0.0-alpha exists but not production-ready. |
| react-leaflet | 5.0.0 | React bindings for Leaflet | Provides React component wrappers (MapContainer, TileLayer, Marker, Popup) for cleaner integration. Last published a year ago but stable. |
| OSRM | docker hosted | Routing engine | Deploy via Docker container locally or use public API. Use `@project-osrm/osrm` Node.js package (v6+) for native bindings if hosting locally. Provides Route, Table (distance matrix), and Nearest services. |
| Nominatim | OpenStreetMap API | Geocoding/reverse geocoding | Free tier: 1 request/second maximum. Implement client-side caching strategy essential for address autocomplete (cache resolution for 24 hours). |
### Database & ORM
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| pg | 8.20.0 | PostgreSQL client | Pure JavaScript, well-maintained, 8.2M+ weekly downloads. Offers both callback and promise-based APIs. Supports connection pooling for high concurrency. |
| node-postgres | (via pg) | Connection pooling | Built into pg module. Use connection pools for multi-user app (default pool size: 10). |
### Authentication
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| bcrypt | 6.0.0 | Password hashing | Industry standard. Use 12-14 salt rounds for production. Critical: v5.0.0+ to avoid 72-byte password truncation vulnerability. |
| Passport.js | 0.7.x | Authentication middleware | 500+ strategies. Stateless-friendly. |
| passport-jwt | 4.0.1 | JWT strategy | Last updated 3 years ago but stable. Handles Authorization header JWT extraction and verification. |
| passport-google-oauth20 | 2.0.0 | Google OAuth2 | Active maintenance (unlike passport-google-oauth2 v0.2.0). Supports third-party OAuth flow. |
| jsonwebtoken | 9.x | JWT creation/verification | Industry standard. Use HS256 or RS256 algorithms. Include `exp`, `iat`, `sub` claims. |
### Frontend State & Forms
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| React Hook Form | 7.x | Form state management | 7M+ weekly downloads, 12.12KB gzipped, zero dependencies. 5.5x smaller than Formik. Uncontrolled components reduce re-renders. Essential for complex trip/stop form with multiple fields. |
| Zustand | 4.x | Global state (optional) | 3KB bundle size, minimal boilerplate. Use for storing: current user, trips list, selected trip/stop, map view state. Not required for MVP but recommended for phase 2+. |
| React Router | 7.x | Client-side routing | Standard for React SPAs. Handle: /home, /trips, /trips/:id, /settings. |
### Styling
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Tailwind CSS | 4.x | Utility-first CSS | Rust-based engine (10x faster builds), native CSS configuration, no .js config file. 4.0+ is production-ready as of 2025. Pairs well with React. |
| Shadcn UI | latest | Component library | Copy-paste components you own (forms, buttons, cards, modals, datepickers, charts). Optional but recommended for polished UX. |
### Utilities
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| axios | 1.7.x | HTTP client (Node.js) | Promise-based, request cancellation, automatic serialization. Use for Nominatim, Overpass, Unsplash API calls. |
| node-fetch / undici | native or 3.x | HTTP client alternative | If avoiding axios dependency, use Node's native fetch (v18+) or undici pool for connection reuse. |
| dotenv | 17.4.0 | Environment variables | 45M+ weekly downloads. Loads .env into process.env. Alternative: Node 20.6+ native `--env-file` flag, but dotenv remains standard. |
| uuid | 9.x | ID generation | For stop/trip IDs if not using PostgreSQL sequences. Lightweight (4.7KB). |
### Testing
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Jest | 30.3.0 | Test runner (Node.js + React) | Latest (June 2025) with 37% faster test runs and 77% lower memory in large projects. Supports .mts/.cts files by default. Out-of-box support for mocking, snapshots, coverage. |
| React Testing Library | 16.x | React component testing | Queries by accessible semantics. Focus on user behavior, not implementation. Pairs with Jest. |
| Supertest | 7.x | HTTP assertion (Express) | Test Express routes without running server. Easy integration testing for API endpoints. |
### DevOps & Deployment
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Docker | 26.x | Containerization | Latest stable. Multi-stage builds for optimized images. |
| Docker Compose | 2.x | Multi-container orchestration | YAML-based service definition. Define frontend (React), backend (Node.js), database (PostgreSQL) services with volume persistence. |
| Nginx (optional) | 1.27.x | Reverse proxy + static serving | If hosting frontend separately. Not required for Compose dev environment. |
### Build & Development
| Technology | Version | Purpose | Why |
|------------|---------|---------|-----|
| Vite | 6.x | React build tool | Modern alternative to Create React App. 10x faster HMR, ~350KB Tailwind compile time vs 2-3 seconds with CRA. Recommended for React 19. |
| TypeScript | 5.6+ | Type safety (optional but recommended) | Catch errors at build time. Essential for team > 1 person. Use for both frontend and backend. |
## Alternatives Considered
| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| Frontend | React 19 | Vue 3, Svelte | React has largest ecosystem, most components available, wider team familiarity. |
| Backend | Express 5 | Fastify, Hono | Express has mature ecosystem (Passport, auth middleware), sufficient performance for MVP. Fastify gains relevance at >1000 req/s. |
| Database | PostgreSQL 18 | MongoDB | Trips and stops require normalized relationships (one trip → many stops → many POIs). Relational model clearer than NoSQL. |
| Form state | React Hook Form | Formik | Formik unmaintained (no updates in 12+ months). RHF 5.5x smaller, zero dependencies. |
| Map library | Leaflet | Mapbox GL | Mapbox requires paid API key. Leaflet + OSM + OSRM is fully free-tier compatible. |
| CSS | Tailwind 4 | styled-components | Tailwind bundle size 10x smaller. 4.x Rust engine eliminates CRA compile slowness. No CSS-in-JS bloat. |
| Auth middleware | Passport.js | NextAuth, Auth0 | Passport is self-hosted, free, battle-tested. Fits Express/Node backend architecture. |
## Installation
### Backend Dependencies
# Core
# Authentication
# HTTP & Routing
# Utilities
# Dev
### Frontend Dependencies
# Core
# Forms & State
# Maps
# Styling
# Dev
### Docker Compose Services
## Version Management & Upgrades
### Minor Version Policy (Patch → Minor)
- **bcrypt:** Critical security updates (72-byte truncation). Upgrade to 6.0+ immediately if on <5.0.
- **React:** Stay within 19.x for stability. Security patches auto-deploy.
- **Express:** 5.x is new (Dec 2024), so patches may be frequent. Monitor GitHub releases monthly.
### Major Version Decision Points
- **React 20+:** Adopt 1-2 quarters after release (next: ~2026 Q4).
- **Express 6+:** Only if significant architectural improvements. v5 LTS should cover 3-5 years.
- **PostgreSQL 19+:** Evaluate when current version enters end-of-life (18 → Sept 2027). Upgrade in maintenance window.
## Critical Constraints & Assumptions
### Free-Tier APIs
- **Nominatim:** 1 req/sec max. **Must implement caching.** Store address resolutions locally for 24h minimum. Use Redis or PostgreSQL for cache if multi-instance.
- **Overpass API:** No API key. Respect rate limiting (200 queries/day soft limit for heavy users).
- **Unsplash:** 50 requests/hour. Cache image URLs; don't refetch same search query within 24h.
### Data Persistence
- PostgreSQL connection pooling essential. `pg` module default pool: 10 connections. For high concurrency (10+ concurrent users), increase `max: 20`.
- Trip/stop/POI data must persist in PostgreSQL. No in-memory caching of user data.
### Production Readiness
- All dependencies are stable (1.0+) or actively maintained (within 6 months of last release).
- No beta/alpha versions in production.
- TypeScript recommended for team > 1 to prevent runtime errors.
## Confidence Assessment
| Component | Confidence | Reason |
|-----------|-----------|--------|
| React/Node/PostgreSQL versions | **HIGH** | Verified with official documentation (react.dev, expressjs.com, postgresql.org). Latest stable releases of mature projects. |
| Express 5 compatibility | **HIGH** | Express 5.2.1 confirmed as latest, officially released Dec 2024, LTS timeline announced. |
| Supporting libraries (bcrypt, passport, jwt, etc.) | **HIGH** | Versions cross-referenced with npm registry and GitHub releases. All >1.0 and actively maintained (2024-2025 activity). |
| Form handling (React Hook Form vs Formik) | **HIGH** | Formik confirmed unmaintained (12+ months no updates). RHF confirmed as 5.5x smaller with zero dependencies. |
| Map stack (Leaflet + OSRM + Nominatim) | **MEDIUM** | Leaflet 1.9 stable and widely used. OSRM official Node bindings confirmed. Nominatim rate-limiting policy verified but caching strategy requires validation in implementation phase. |
| Docker Compose production-readiness | **MEDIUM** | Standard for local dev/Compose-based deployments. Health checks and volume persistence verified in community examples. Kubernetes migration path not addressed (out of scope for v1). |
## Sources
- [React 19.2 Official Documentation](https://react.dev/versions)
- [Express.js Official Site](https://expressjs.com)
- [PostgreSQL Release Notes](https://www.postgresql.org/docs/release/)
- [node-postgres (pg) npm](https://www.npmjs.com/package/pg)
- [Leaflet Official](https://leafletjs.com/)
- [React Leaflet Documentation](https://react-leaflet.js.org/)
- [React Hook Form vs Formik Comparison (2025)](https://dev.to/hijazi313/react-hook-form-vs-formik-44144e6a01d8)
- [Passport.js Official](https://www.passportjs.org/)
- [Tailwind CSS 4 Documentation](https://tailwindcss.com/)
- [Jest 30 Release Notes](https://jestjs.io/blog/2025/06/04/jest-30)
- [OSRM Node.js Bindings](https://github.com/Project-OSRM/osrm.js)
- [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/)
- [Docker Compose Documentation](https://docs.docker.com/compose/)
- [Vite Official Documentation](https://vitejs.dev/)
<!-- GSD:stack-end -->

<!-- GSD:conventions-start source:CONVENTIONS.md -->
## Conventions

Conventions not yet established. Will populate as patterns emerge during development.
<!-- GSD:conventions-end -->

<!-- GSD:architecture-start source:ARCHITECTURE.md -->
## Architecture

Architecture not yet mapped. Follow existing patterns found in the codebase.
<!-- GSD:architecture-end -->

<!-- GSD:workflow-start source:GSD defaults -->
## GSD Workflow Enforcement

Before using Edit, Write, or other file-changing tools, start work through a GSD command so planning artifacts and execution context stay in sync.

Use these entry points:
- `/gsd:quick` for small fixes, doc updates, and ad-hoc tasks
- `/gsd:debug` for investigation and bug fixing
- `/gsd:execute-phase` for planned phase work

Do not make direct repo edits outside a GSD workflow unless the user explicitly asks to bypass it.
<!-- GSD:workflow-end -->



<!-- GSD:profile-start -->
## Developer Profile

> Profile not yet configured. Run `/gsd:profile-user` to generate your developer profile.
> This section is managed by `generate-claude-profile` -- do not edit manually.
<!-- GSD:profile-end -->
