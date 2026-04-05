# RoadTrip Planner

## What This Is

A multi-user web app for planning camper road trips. Users define a home location, create trips with named stops, view routes on an interactive map, and discover points of interest around each stop. Deployed via Docker Compose with a React frontend, Node.js/Express backend, and PostgreSQL database.

## Core Value

Users can plan a complete camper road trip — from home to stops to POIs — and see it visualized on a map with routing, distances, and timing.

## Requirements

### Validated

- [x] Multi-user authentication (email/password) — Validated in Phase 1: Authentication & User Setup
- [x] User-defined home location as trip starting point — Validated in Phase 1: Authentication & User Setup
- [x] Create trips with name, description, and auto-fetched cover photo (Unsplash search) — Validated in Phase 2: Trip & Stop Management
- [x] Add stops with address autocomplete (Nominatim/OSM), description, and start/end dates — Validated in Phase 2: Trip & Stop Management
- [x] Reorder, edit, and delete stops within a trip — Validated in Phase 2: Trip & Stop Management
- [x] Display full trip on an OpenStreetMap map (Leaflet) with route, distance, and drive time (OSRM) — Validated in Phase 3: Map Visualization & POI Discovery
- [x] Show POIs around each stop with images and ratings (Overpass API / OSM data) — Validated in Phase 3: Map Visualization & POI Discovery
- [x] POI search and storage in PostgreSQL — Validated in Phase 3: Map Visualization & POI Discovery

### Active
- [ ] Polished, responsive UI with smooth UX
- [ ] Docker Compose deployment (frontend, backend, database)

### Out of Scope

- AI-generated trip photos — deferred, start with Unsplash search only for v1
- Mobile native app — web-first, responsive design covers mobile
- Real-time collaboration — trips are personal, no live co-editing
- Offline mode — requires internet for maps and POI data
- Trip sharing/social features — not in v1

## Context

- All external services are free/open-source: OpenStreetMap, Leaflet, OSRM, Nominatim, Overpass API
- Unsplash API for trip cover photos (free tier: 50 requests/hour)
- No paid API dependencies in v1
- Target: polished product, not just functional — UI quality matters
- POI data from OSM may have limited ratings/images compared to Google Places — acceptable tradeoff for free tier

## Constraints

- **Stack**: React (frontend), Node.js/Express (backend), PostgreSQL (database)
- **Maps**: OpenStreetMap + Leaflet + OSRM (no Google Maps)
- **Geocoding**: Nominatim (OSM-based, rate-limited — need caching strategy)
- **Deployment**: Docker Compose (all services containerized)
- **Auth**: Email/password + Google OAuth
- **Cost**: All external APIs must be free-tier compatible

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| OpenStreetMap over Google Maps | Free, open-source, no API cost concerns | — Pending |
| Nominatim for geocoding | Consistent with OSM stack, free | — Pending |
| Unsplash for trip photos (AI gen deferred) | Simpler v1, revisit AI generation later | — Pending |
| OSM/Overpass for POIs | Free, matches map stack, acceptable data quality | — Pending |
| Multi-user with dual auth | Email/password + Google OAuth covers most users | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-04-05 after Phase 3 completion*
