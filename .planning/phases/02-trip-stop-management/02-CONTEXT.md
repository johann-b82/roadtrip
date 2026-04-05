# Phase 2: Trip & Stop Management - Context

**Gathered:** 2026-04-05
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can create and manage trips with names, descriptions, and auto-fetched Unsplash cover photos. Within each trip, users can add stops with address autocomplete (Nominatim), descriptions, and start/end dates. Stops can be reordered via drag-and-drop, edited inline, and deleted. A split-panel trip detail page shows the stop list alongside a map preview with stop pins. The dashboard displays all trips as a responsive card grid.

Requirements: TRIP-01, TRIP-02, TRIP-03, TRIP-04, STOP-01, STOP-02, STOP-03, STOP-04, STOP-05, STOP-06, STOP-07, UI-01, UI-02, UI-03

</domain>

<decisions>
## Implementation Decisions

### Trip Dashboard
- **D-01:** Card grid layout — trips displayed as visual cards with cover photo, name, stop count, and date range. Responsive grid (1-3 columns based on viewport).
- **D-02:** Empty state — illustrated CTA with travel icon/illustration, "Plan your first road trip" heading, and prominent "+ New Trip" button.
- **D-03:** New trip creation via modal dialog — name + description fields. On submit, creates trip and navigates to trip detail page.

### Trip Detail Page
- **D-04:** Split-panel layout — stop list on the left, map preview on the right. Collapses to stacked layout on mobile (stop list above, map below).
- **D-05:** Cover photo as hero banner at top of the page with trip name and description overlay.
- **D-06:** Map preview shows stop pins immediately (Phase 2) — reuse MapPreview/Leaflet from Phase 1. No routing lines yet; Phase 3 adds routes, distances, and POIs on top.
- **D-07:** Top navbar across the app — slim bar with app name/logo, user avatar/menu (settings, logout). Detail pages add a back button. No sidebar.
- **D-08:** Delete trip via confirm dialog — "Delete this trip and all its stops?" with Cancel/Delete buttons. Red delete button for destructive action.

### Stop Management
- **D-09:** Add stop via inline form — click "+ Add Stop" at bottom of stop list, form expands in-place with AddressInput autocomplete, description, and date fields. Reuses AddressInput and useNominatim from Phase 1.
- **D-10:** Edit stop via inline expand — click edit icon on a stop, it expands in-place showing editable fields (same form as add). Save or cancel collapses back. Consistent with add pattern.
- **D-11:** Drag-and-drop reorder with drag handle (grip icon) on each stop. Visual placeholder shows drop target. Mobile: long-press to initiate drag.
- **D-12:** Native HTML date inputs for stop start/end dates. Zero library overhead, accessible, functional across browsers.
- **D-13:** Delete stop with confirmation (consistent with trip delete pattern).

### Unsplash Cover Photos
- **D-14:** Photo search triggered by trip description text on create. Appends "travel" to search query for better results.
- **D-15:** Store top 5 Unsplash results. User can cycle through alternatives on the trip detail page to pick a different cover photo.
- **D-16:** Fallback: gradient placeholder with trip name overlaid when Unsplash returns no results or rate limit (50/hr) is hit. Retry on next trip view.
- **D-17:** Backend cache in PostgreSQL — unsplash_cache table stores query -> image URLs + metadata with 24h TTL. Serve from cache on repeat views; only hit Unsplash API on new/changed descriptions.

### Claude's Discretion
- Database schema design for trips, stops, and unsplash_cache tables
- Drag-and-drop library choice (dnd-kit, react-beautiful-dnd, or native HTML drag)
- Stop numbering and ordering logic (position column vs array ordering)
- Loading states and skeleton screens during data fetching (UI-03)
- Error handling patterns for API failures
- Mobile responsive breakpoints and layout adaptations (UI-01)
- Unsplash API integration details (search parameters, image size selection)
- Trip edit form behavior (inline vs modal — follow patterns established by trip create)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project Docs
- `.planning/PROJECT.md` — Core constraints (stack, auth approach, free-tier APIs, Unsplash 50 req/hr limit)
- `.planning/REQUIREMENTS.md` — TRIP-01 through TRIP-04, STOP-01 through STOP-07, UI-01 through UI-03 acceptance criteria
- `.planning/ROADMAP.md` — Phase 2 success criteria and dependency on Phase 1
- `CLAUDE.md` — Technology stack with exact versions, Nominatim rate limiting policy, Unsplash constraints

### Phase 1 Context
- `.planning/phases/01-authentication-user-setup/01-CONTEXT.md` — Prior decisions (D-08: Nominatim autocomplete pattern, D-14: travel-themed design)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `frontend/src/components/AddressInput.jsx` — Nominatim autocomplete component, reuse directly for stop address input
- `frontend/src/components/MapPreview.jsx` — Leaflet map with pin marker, extend for multiple stop pins
- `frontend/src/hooks/useNominatim.js` — Debounced search hook with 24h LRU cache, reuse for stops
- `frontend/src/services/api.js` — Axios instance with credentials, extend with trip/stop API methods
- `frontend/src/store/authStore.js` — Zustand store pattern, replicate for trip/stop state
- `frontend/src/components/ProtectedRoute.jsx` — All new pages must be wrapped in this

### Established Patterns
- Zustand with persist middleware for client state (authStore)
- Axios with withCredentials for API calls
- React Router 7 for routing (BrowserRouter, Routes, Route)
- Tailwind CSS 4 utility classes for styling
- Travel-themed gradient backgrounds on auth pages
- Express 5 route mounting pattern (separate router files per domain)
- PostgreSQL with pg module, connection pool (max 20), { pool, query } exports

### Integration Points
- `frontend/src/App.jsx` — Add /dashboard (replace stub), /trips/:id routes
- `backend/src/index.js` — Mount trips and stops routers
- `backend/src/db/schema.sql` — Add trips, stops, unsplash_cache tables (FK to users.id)
- `backend/src/auth/middleware.js` — requireAuth middleware protects all new endpoints

</code_context>

<specifics>
## Specific Ideas

- Dashboard should feel like opening a travel journal — cover photos front and center on cards
- Split panel on trip detail gives spatial context even before Phase 3 adds routing
- Inline add/edit for stops keeps users in flow — no modal interruptions for stop management
- Gradient placeholder for missing cover photos maintains visual consistency with travel theme

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-trip-stop-management*
*Context gathered: 2026-04-05*
