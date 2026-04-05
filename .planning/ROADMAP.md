# RoadTrip Planner Roadmap

**Project:** RoadTrip Planner  
**Created:** 2026-04-05  
**Granularity:** Coarse (4 phases, ~3-4 weeks each)  
**Mode:** YOLO (rapid iteration with verification)

---

## Overview

Four-phase MVP roadmap for a multi-user web-based road trip planner. Each phase delivers a complete, verifiable user capability:

1. **Phase 1:** Users can sign up, log in, and define home location (foundation for all downstream features)
2. **Phase 2:** Users can plan complete trips with stops, descriptions, and auto-fetched photos (core trip planning loop)
3. **Phase 3:** Users can visualize trips on an interactive map with routes, distances, and discover POIs (visualization + discovery)
4. **Phase 4:** App is production-ready, mobile-optimized, and can be deployed and shared (launch readiness)

---

## Phases

- [ ] **Phase 1: Authentication & User Setup** - Users register, log in, and define home location
- [ ] **Phase 2: Trip & Stop Management** - Users create trips with stops, addresses, and descriptions
- [ ] **Phase 3: Map Visualization & POI Discovery** - Users see interactive map with routes and points of interest
- [ ] **Phase 4: Deployment & Polish** - App fully deployed and production-ready

---

## Phase Details

### Phase 1: Authentication & User Setup

**Goal:** Users can securely create accounts, log in persistently, and define a home location for future trip planning.

**Depends on:** Nothing (first phase)

**Requirements:** AUTH-01, AUTH-02, AUTH-03, AUTH-04, PROF-01, PROF-02

**Success Criteria** (what must be TRUE):
1. User can sign up with email and password, receive confirmation, and immediately log in
2. User can log in with saved credentials and remain logged in across browser sessions
3. User can reset a forgotten password via secure email link
4. User can log out from any page and cannot access protected features
5. User can set and update a home location as their default trip starting point
6. User can return to app and home location persists across sessions

**Plans:** TBD

---

### Phase 2: Trip & Stop Management

**Goal:** Users can plan complete trips from concept to detailed stops with addresses, descriptions, dates, and auto-fetched cover photos.

**Depends on:** Phase 1 (requires authenticated user)

**Requirements:** TRIP-01, TRIP-02, TRIP-03, TRIP-04, STOP-01, STOP-02, STOP-03, STOP-04, STOP-05, STOP-06, STOP-07, UI-01, UI-02, UI-03

**Success Criteria** (what must be TRUE):
1. User can create a trip with name and description; app automatically fetches a cover photo from Unsplash
2. User can add stops by typing address (search-as-you-type via Nominatim autocomplete) and selecting from results
3. User can add description and start/end dates to each stop; stops are stored and persist
4. User can see all stops in their trip, reorder them via drag-and-drop, edit existing stops, or delete stops
5. App is fully mobile-responsive and works smoothly on phone, tablet, and desktop with no broken layouts
6. Loading states and error messages provide clear feedback (no silent failures)
7. User can edit or delete a trip after creation

**Plans:** TBD

**UI hint:** yes

---

### Phase 3: Map Visualization & POI Discovery

**Goal:** Users can see their complete trip on an interactive map with calculated routes, distances, drive times, and discover interesting points of interest around each stop.

**Depends on:** Phase 2 (requires trips and stops with valid addresses)

**Requirements:** MAP-01, MAP-02, MAP-03, MAP-04, MAP-05, POI-01, POI-02, POI-03, POI-04

**Success Criteria** (what must be TRUE):
1. User can view full trip on interactive OpenStreetMap (Leaflet) with all stops displayed as markers
2. Route between consecutive stops is visualized as a polyline on the map; route recalculates when stops are reordered
3. User can see distance and drive time for each leg of the trip and total trip distance/duration (OSRM)
4. User can click a stop and see discovered POIs around it (restaurants, attractions, lodging) with images and ratings from OpenStreetMap data
5. User can search for specific types of POIs around a stop (e.g., "coffee shops", "hiking trails")
6. Selected or discovered POIs are stored in PostgreSQL and persist across sessions

**Plans:** TBD

**UI hint:** yes

---

### Phase 4: Deployment & Polish

**Goal:** App is production-ready, fully optimized for mobile, and can be deployed as a complete containerized system with optional trip sharing via read-only links.

**Depends on:** Phase 3 (requires all features working together)

**Requirements:** DEPLOY-01, DEPLOY-02, TRIP-05

**Success Criteria** (what must be TRUE):
1. Single `docker compose up` command starts entire app (frontend, backend, database) with no manual configuration
2. App is fully responsive and performant on mobile devices (no lag, no broken map rendering)
3. All API errors are caught and display user-friendly messages (no 500 error dumps)
4. User can share a trip via read-only link that non-users can view without authentication (map, stops, POIs visible)
5. Monitoring and logging are configured so issues can be diagnosed in production

**Plans:** TBD

---

## Progress Tracking

| Phase | Requirements | Success Criteria | Status | Completed |
|-------|--------------|------------------|--------|-----------|
| 1. Auth & User Setup | 6 | 6 | Not started | - |
| 2. Trip & Stop Management | 14 | 7 | Not started | - |
| 3. Map Visualization & POI Discovery | 9 | 6 | Not started | - |
| 4. Deployment & Polish | 3 | 5 | Not started | - |

---

## Coverage Validation

**Total v1 Requirements:** 32  
**Mapped to Phases:** 32  
**Orphaned Requirements:** 0

**Coverage by Category:**

| Category | Requirements | Phase(s) |
|----------|--------------|----------|
| Authentication | AUTH-01, AUTH-02, AUTH-03, AUTH-04 | Phase 1 |
| User Profile | PROF-01, PROF-02 | Phase 1 |
| Trip Management | TRIP-01, TRIP-02, TRIP-03, TRIP-04, TRIP-05 | Phase 2 (1-4), Phase 4 (5) |
| Stop Management | STOP-01, STOP-02, STOP-03, STOP-04, STOP-05, STOP-06, STOP-07 | Phase 2 |
| Map & Routing | MAP-01, MAP-02, MAP-03, MAP-04, MAP-05 | Phase 3 |
| POI Discovery | POI-01, POI-02, POI-03, POI-04 | Phase 3 |
| UI/UX | UI-01, UI-02, UI-03 | Phase 2 |
| Deployment | DEPLOY-01, DEPLOY-02 | Phase 4 |

**✓ 100% Coverage — All v1 requirements mapped to exactly one phase**

---

## Dependencies & Critical Path

```
Phase 1: Authentication & User Setup
    ↓ (requires authenticated user)
Phase 2: Trip & Stop Management
    ↓ (requires trips and valid addresses)
Phase 3: Map Visualization & POI Discovery
    ↓ (requires all features integrated)
Phase 4: Deployment & Polish
```

**Critical Path Items (High Risk):**
1. Nominatim rate limiting & caching (Phase 2 design, implement early)
2. Address precision & user confirmation (Phase 2, must get right before Phase 3)
3. Leaflet performance with 15+ stops (Phase 3, benchmark and optimize)
4. OAuth redirect URI in production (Phase 1, test in staging)

---

## Research Gaps to Resolve During Phase Planning

1. **Nominatim caching strategy:** Redis vs. in-memory for multi-instance production? Deferred to Phase 2 planning.
2. **Leaflet performance ceiling:** Exact max stop count before degradation. Recommend benchmarking in Phase 3.
3. **Unsplash rate limit handling:** Fallback strategy when 50 photos/hour limit reached. Plan in Phase 2.

---

*Roadmap created: 2026-04-05*  
*Next step: `/gsd:plan-phase 1`*
