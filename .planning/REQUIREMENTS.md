# Requirements: RoadTrip Planner

**Defined:** 2026-04-05
**Core Value:** Users can plan a complete camper road trip — from home to stops to POIs — and see it visualized on a map with routing, distances, and timing.

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Authentication

- [x] **AUTH-01**: User can sign up with email and password
- [x] **AUTH-02**: User can log in and stay logged in across browser sessions
- [x] **AUTH-03**: User can log out from any page
- [x] **AUTH-04**: User can reset password via email link

### User Profile

- [x] **PROF-01**: User can set a home location as default trip starting point
- [x] **PROF-02**: User can update their home location

### Trip Management

- [x] **TRIP-01**: User can create a trip with name and short description
- [x] **TRIP-02**: User can edit trip name and description
- [x] **TRIP-03**: User can delete a trip
- [x] **TRIP-04**: Trip cover photo is automatically fetched from Unsplash based on description
- [ ] **TRIP-05**: User can share a trip via read-only link

### Stop Management

- [x] **STOP-01**: User can add a stop to a trip with address autocomplete (Nominatim search-as-you-type)
- [x] **STOP-02**: User can select a matching address from autocomplete results
- [x] **STOP-03**: Address and short description are stored for each stop
- [x] **STOP-04**: User can set start and end dates for each stop
- [x] **STOP-05**: User can reorder stops via drag-and-drop
- [x] **STOP-06**: User can edit an existing stop (address, description, dates)
- [x] **STOP-07**: User can delete a stop from a trip

### Map & Routing

- [ ] **MAP-01**: Full trip is displayed on an interactive OpenStreetMap map (Leaflet)
- [ ] **MAP-02**: All stops are shown as markers on the map
- [ ] **MAP-03**: Route between stops is visualized as a polyline on the map
- [x] **MAP-04**: Distance and drive time are calculated and displayed for each leg (OSRM)
- [x] **MAP-05**: Total trip distance and drive time are shown

### POI Discovery

- [x] **POI-01**: POIs around each stop are discovered and displayed in a list
- [x] **POI-02**: POI list shows images and ratings (from OSM/Overpass data)
- [x] **POI-03**: User can search for specific POIs around a stop
- [x] **POI-04**: Selected/discovered POIs are stored in PostgreSQL

### UI/UX

- [x] **UI-01**: App is mobile-responsive (works on phone, tablet, desktop)
- [x] **UI-02**: Polished, modern UI with smooth interactions
- [x] **UI-03**: Loading states and error handling provide clear feedback

### Deployment

- [ ] **DEPLOY-01**: App is fully containerized with Docker Compose (frontend, backend, database)
- [ ] **DEPLOY-02**: Single `docker compose up` starts the entire application

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Authentication

- **AUTH-05**: User can log in with Google OAuth
- **AUTH-06**: User can link Google account to existing email account

### Collaboration

- **COLLAB-01**: Real-time collaborative trip editing
- **COLLAB-02**: Trip owner can invite collaborators

### Advanced Features

- **ADV-01**: AI route optimization (minimize drive time)
- **ADV-02**: Weather integration along route
- **ADV-03**: Budget tracking and expense splitting
- **ADV-04**: AI-generated trip cover photos (DALL-E or Stable Diffusion)
- **ADV-05**: Campground/accommodation filtering by amenities

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Mobile native app | Web-first, responsive design covers mobile |
| RV-specific routing (height/weight) | Niche feature, defer to v2+ |
| Offline map caching | Requires internet for maps/POI — too complex for v1 |
| Minute-by-minute scheduling | Anti-feature — kills spontaneity, low engagement |
| In-app navigation | Users prefer their own nav app (Google Maps, Waze) |
| Booking integrations | Not core value, adds complexity |
| Social trip recommendations | Low engagement (5%) per research |
| Natural language trip input | Requires LLM integration, defer |

## Traceability

Which phases cover which requirements.

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| PROF-01 | Phase 1 | Complete |
| PROF-02 | Phase 1 | Complete |
| TRIP-01 | Phase 2 | Complete |
| TRIP-02 | Phase 2 | Complete |
| TRIP-03 | Phase 2 | Complete |
| TRIP-04 | Phase 2 | Complete |
| TRIP-05 | Phase 4 | Pending |
| STOP-01 | Phase 2 | Complete |
| STOP-02 | Phase 2 | Complete |
| STOP-03 | Phase 2 | Complete |
| STOP-04 | Phase 2 | Complete |
| STOP-05 | Phase 2 | Complete |
| STOP-06 | Phase 2 | Complete |
| STOP-07 | Phase 2 | Complete |
| MAP-01 | Phase 3 | Pending |
| MAP-02 | Phase 3 | Pending |
| MAP-03 | Phase 3 | Pending |
| MAP-04 | Phase 3 | Complete |
| MAP-05 | Phase 3 | Complete |
| POI-01 | Phase 3 | Complete |
| POI-02 | Phase 3 | Complete |
| POI-03 | Phase 3 | Complete |
| POI-04 | Phase 3 | Complete |
| UI-01 | Phase 2 | Complete |
| UI-02 | Phase 2 | Complete |
| UI-03 | Phase 2 | Complete |
| DEPLOY-01 | Phase 4 | Pending |
| DEPLOY-02 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 32 total
- Mapped to phases: 32 ✓
- Unmapped: 0

---

*Requirements defined: 2026-04-05*
*Roadmap traceability updated: 2026-04-05*
