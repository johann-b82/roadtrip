---
phase: 01-authentication-user-setup
plan: 05
subsystem: frontend
tags: [geocoding, nominatim, leaflet, onboarding, address-autocomplete]
dependency_graph:
  requires:
    - "01-03 (geocoding API endpoint: GET /api/geocoding/search)"
    - "01-04 (authStore, api client, ProtectedRoute)"
  provides:
    - "useNominatim hook (reusable for Phase 2 stop address input)"
    - "AddressInput component (reusable autocomplete)"
    - "MapPreview component (reusable Leaflet pin map)"
    - "Onboarding page at /onboarding"
  affects:
    - "frontend/src/App.jsx (/onboarding route now live)"
tech_stack:
  added:
    - "react-leaflet 5.0.0 (MapContainer, TileLayer, Marker, useMap)"
    - "leaflet 1.9.x (L.Icon.Default fix for Vite)"
  patterns:
    - "Module-level Map cache for Nominatim results (24h TTL, shared across hook instances)"
    - "Debounced async fetch with clearTimeout/setTimeout pattern"
    - "onMouseDown for dropdown item clicks (prevents onBlur race condition)"
key_files:
  created:
    - frontend/src/hooks/useNominatim.js
    - frontend/src/components/AddressInput.jsx
    - frontend/src/components/MapPreview.jsx
    - frontend/src/pages/Onboarding.jsx
  modified:
    - frontend/src/App.jsx
decisions:
  - "Used module-level Map for Nominatim cache so results persist across component remounts"
  - "onMouseDown on dropdown items prevents blur event from hiding dropdown before click fires"
  - "L.Icon.Default.mergeOptions points to CDN URLs to fix Vite asset hashing issue with Leaflet icons"
  - "MapController inner component calls map.setView() on each render to re-center when coordinates change"
metrics:
  duration: "100s"
  completed_date: "2026-04-05T14:19:32Z"
  tasks_completed: 2
  tasks_total: 2
  files_created: 4
  files_modified: 1
---

# Phase 1 Plan 5: Home Location Onboarding Flow Summary

**One-liner:** Nominatim address autocomplete with 24h client-side cache, Leaflet map preview, and skippable onboarding page wired to PUT /api/users/me/home-location.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Nominatim hook, AddressInput, MapPreview | a6bb10e | useNominatim.js, AddressInput.jsx, MapPreview.jsx |
| 2 | Onboarding page and App.jsx route | d154161 | Onboarding.jsx, App.jsx |

## What Was Built

### useNominatim hook (`frontend/src/hooks/useNominatim.js`)
- Debounced Nominatim search with 500ms delay
- Module-level Map cache with 24-hour TTL (respects Nominatim rate limits)
- Returns `{ results, loading, search, clearResults }`
- Calls `GET /api/geocoding/search?q=...` via the shared axios api client

### AddressInput component (`frontend/src/components/AddressInput.jsx`)
- Text input with live autocomplete dropdown
- Uses `onMouseDown` (not `onClick`) on list items to prevent blur/click race condition
- 150ms setTimeout in `onBlur` to allow item selection before dropdown hides
- Calls `onSelect({ address, lat, lon })` when user picks a result

### MapPreview component (`frontend/src/components/MapPreview.jsx`)
- Leaflet map at fixed 180px height showing a pin at the selected coordinates
- Fixes Vite-broken Leaflet icon paths via `L.Icon.Default.mergeOptions` pointing to CDN URLs
- Inner `MapController` component re-centers the map when coordinates change

### Onboarding page (`frontend/src/pages/Onboarding.jsx`)
- Post-signup flow at protected `/onboarding` route
- AddressInput for address search, MapPreview shown after selection (D-08)
- Saves via `PUT /api/users/me/home-location` and updates authStore with returned user data
- Skip button navigates to `/dashboard` with gentle nudge text (D-10)

### App.jsx update
- Replaced `/onboarding` stub `<div>` with `<Onboarding />` component (still inside ProtectedRoute)

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Module-level Nominatim cache | Persists across component remounts; shared between all AddressInput instances |
| onMouseDown for dropdown clicks | Fires before onBlur, preventing the dropdown from closing before selection |
| CDN URLs for Leaflet icons | Vite hashes asset filenames, breaking Leaflet's built-in icon resolution |
| MapController inner component | Needed to call useMap() hook inside MapContainer context |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all functionality is wired to real backend endpoints.

## Self-Check

### Files exist:
- `frontend/src/hooks/useNominatim.js` — FOUND
- `frontend/src/components/AddressInput.jsx` — FOUND
- `frontend/src/components/MapPreview.jsx` — FOUND
- `frontend/src/pages/Onboarding.jsx` — FOUND
- `frontend/src/App.jsx` (modified) — FOUND

### Commits exist:
- `a6bb10e` — FOUND (feat(01-05): add Nominatim hook, AddressInput, and MapPreview components)
- `d154161` — FOUND (feat(01-05): add Onboarding page and wire /onboarding route in App.jsx)

## Self-Check: PASSED
