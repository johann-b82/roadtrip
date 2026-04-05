# Domain Pitfalls: Road Trip Planner

**Domain:** Web-based road trip planner with interactive maps and POI discovery
**Researched:** 2026-04-05
**Overall Confidence:** MEDIUM (ecosystem patterns verified, some domain-specific challenges from WebSearch)

---

## Critical Pitfalls

These mistakes cause major rewrites, performance degradation, or loss of user data.

### Pitfall 1: Nominatim Rate Limiting and Service Blockage

**What goes wrong:**
- Application sends repeated requests to public Nominatim API (openstreetmap.org)
- Server hits rate limit of 1 request/second per Terms of Service
- IP is temporarily or permanently blocked for "faulty" behavior
- All address autocomplete, reverse geocoding, and stop creation fails silently
- Users cannot add stops to trips or refine locations

**Why it happens:**
- Developers assume "free API = unlimited usage"
- No client-side caching implemented for identical searches
- Each user keystroke triggers a fresh API request instead of debouncing
- Autocomplete UI doesn't show pending requests, leading to user hammering
- The public Nominatim service runs on donated hardware at capacity limits

**Consequences:**
- Complete feature blockage for users behind the blocked IP
- No graceful fallback; application appears broken
- User frustration and loss of trust
- Requires manual IP unblocking request to OSM ops team

**Prevention:**
- Implement aggressive client-side caching: deduplicate identical queries within 24 hours
- Add debouncing to address autocomplete (minimum 300ms between requests)
- Implement query normalization (trim, lowercase, remove duplicates)
- Show "cached" indicator in UI when returning cached results
- Set up backend caching layer (Redis) for commonly searched addresses
- Monitor rate limit compliance in staging/production
- Add request throttling and backoff logic for rate limit responses (HTTP 429)
- Document Terms of Service prominently: users must understand 1 req/sec limit
- Consider self-hosted Nominatim instance for production if usage exceeds ~5K requests/day

**Detection:**
- Sudden inability to geocode any addresses
- Warnings in application logs showing 429 responses
- User reports of "broken location search"
- Monitor HTTP 429 responses from Nominatim API

**Phase to Address:** Phase 2 (Geocoding) — implement caching before launch

---

### Pitfall 2: Nominatim Precision and Accuracy Gaps

**What goes wrong:**
- Address autocomplete returns wrong location (neighbor address matches instead)
- User selects "123 Main St" and map shows "123 Main St" 3 towns over
- Routing calculates wrong distance because stop coordinates are off by miles
- POI search radius is centered on wrong location
- User completes trip planning but discovers stops are in wrong state/country

**Why it happens:**
- Nominatim cannot correct spelling errors—requires exact OSM match
- Nominatim ranking uses importance heuristics (Wikipedia links, OSM tagging)
- Postcode support is "very primitive" in Nominatim
- Rural/international addresses have sparse OSM coverage
- Nominatim returns closest match by importance, not by actual relevance
- Users don't visually verify stop locations on map after selection

**Consequences:**
- Users plan routes to wrong locations
- Routing calculates wrong distances/times
- Trust in app erodes ("this took me to the wrong place")
- Potential legal liability if user relies on coordinates without verification

**Prevention:**
- **Always require visual confirmation on map:** After selecting an address, show map marker and require user to confirm "Yes, this is the right location" before saving
- Implement address components display: show full result (street, town, state, country) not just street name
- Add confidence scoring: flag low-confidence results (ambiguous matches)
- For autocomplete, display result hierarchy: "123 Main St, Springfield, IL" not just "123 Main St"
- Provide manual address entry fallback with lat/lng input
- Validate using bounding box: if user is planning US trip but autocomplete suggests Australian address, flag it
- Cache and reuse verified addresses: if user previously selected "123 Main St, Springfield, IL", prioritize it
- Add optional "Verify Address" step: show full details + map before saving stop
- Document limitation: "Autocomplete may not work for rural/international addresses"

**Detection:**
- User reports stops appearing in wrong locations on map
- Distances/times seem wildly off
- API responses show low confidence scores or unusual result rankings

**Phase to Address:** Phase 2 (Geocoding) — build verification into stop creation UX

---

### Pitfall 3: Overpass API Data Quality and POI Gaps

**What goes wrong:**
- POI search for "campground" returns 2 results when 50+ exist in radius
- Returned POIs lack names, opening hours, or images
- User sees empty POI list around popular stops
- Missing restaurants, gas stations, or other critical amenities
- Different POI counts between OSRM query and Overpass query

**Why it happens:**
- OpenStreetMap coverage is volunteer-driven, sparse in rural areas
- "Dark POIs" exist in OSM (locations without proper type tags)
- Urban areas have better data than exurban/rural regions
- POI attributes (hours, phone, website) are incomplete for many entries
- No rating system in OSM (unlike Google Places)
- Overpass query syntax complexity means missing filters for relevant POI types

**Consequences:**
- User perceives app as unhelpful for discovering places
- Rural road trips show barren landscape (no POIs)
- Feature feels incomplete compared to Google Maps
- Users abandon app in favor of Google Places/Apple Maps

**Prevention:**
- **Set expectations:** Document that POI data comes from crowdsourced OSM; be transparent about coverage gaps
- Use multiple POI query strategies:
  - Overpass for specific tags (amenity=restaurant, tourism=campground)
  - Fallback to simpler radius queries if specific search returns empty
  - Show warning if results are sparse in rural areas
- Cache POI results aggressively (POI data changes rarely)
- Filter POI results for quality: exclude entries with no name, or require minimum 1 attribute (hours/website/phone)
- Provide user feedback loop: "Can't find a POI? Add it to OpenStreetMap" with link to OSM editor
- For critical amenities (gas, food, lodging), clearly label data source as "may be incomplete"
- Augment Overpass data with external source for critical stops (optional premium feature): campground.com, AllStays, etc.
- Consider caching populated/verified POI lists for popular stops

**Detection:**
- Empty or sparse POI lists in rural areas
- User reports missing POI entries
- Mismatch between expected and returned POI counts

**Phase to Address:** Phase 3 (POI Discovery) — clearly communicate data limitations in UI

---

### Pitfall 4: Leaflet Map Performance Degradation with Large Route Polylines

**What goes wrong:**
- Adding 10+ stops to trip causes map to freeze or lag
- Panning/zooming becomes slow or unresponsive
- Drawing polylines between 50+ waypoints causes visible stutter
- Mobile view becomes unusable
- Browser tab crashes on complex routes (50+ stops)

**Why it happens:**
- Leaflet SVG renderer (default) creates individual DOM elements for each polyline vertex
- Large polylines with thousands of vertices bloat DOM
- No viewport-based rendering: all markers and polylines rendered even if outside map view
- Lack of geometry simplification: polylines rendered with full precision
- Client-side state management doesn't efficiently handle stop updates
- React component re-renders entire map on stop array changes

**Consequences:**
- Users cannot plan long road trips (>15 stops)
- Mobile users abandon app entirely
- Poor first impression (app feels unpolished)
- Support tickets about "app performance is terrible"

**Prevention:**
- **Implement geometry simplification:** Simplify polylines using Turf.js or Simplify.js with configurable tolerance before rendering
  - Reduces vertices by 80-90% with imperceptible visual difference
  - Critical for long routes with many waypoints
- Use Canvas renderer instead of SVG for better performance with large datasets
- Implement viewport-based rendering: only render markers and polylines visible in current map bounds
- Add lazy loading for POIs: only fetch/render when user clicks on a stop
- Batch map updates: don't redraw on every stop change, batch updates and render once per 500ms
- Test performance ceiling: measure and document max stops before degradation
- Provide user feedback: show "rendering..." if operation takes >500ms
- Consider pagination: allow viewing 5 stops at a time instead of all 50

**Detection:**
- Noticeable lag when adding stops
- Map freezes during panning/zooming
- POI list slow to load for stops with many results

**Phase to Address:** Phase 3 (Map & Routing) — implement geometry simplification before Phase 4 multi-stop routes

---

### Pitfall 5: Database Schema Migrations Running in Parallel Containers

**What goes wrong:**
- Deploy new version of app with schema changes (add column, create index)
- Docker Compose spins up 2+ app containers for load balancing
- Both containers run migration on startup simultaneously
- Database deadlock or corruption occurs
- Migration conflicts: second container tries to create index that first already created
- Application data is corrupted or inconsistent
- Rollback becomes difficult because schema state is unknown

**Why it happens:**
- Developers assume only one app container runs at startup
- Migrations run inside app container startup scripts (common pattern)
- Docker Compose 3.x doesn't enforce startup ordering or single-run semantics
- No migration locking mechanism in place
- Schema changes are tightly coupled to app version

**Consequences:**
- Application fails to start
- Data corruption requiring manual recovery
- Downtime while diagnosing and fixing
- Difficulty rolling back to previous version

**Prevention:**
- **Run migrations outside app containers:** Use a dedicated migration job/service, not app startup
  - Add separate `migrations` service in docker-compose.yml that runs before app services
  - Ensure migration service runs once, not per container replica
- Implement migration locking: database lock ensures only one migration runs at a time
- Decouple schema migrations from app code: migrations managed separately (Flyway, Knex, Alembic)
- Make migrations idempotent: safe to run multiple times (use `CREATE IF NOT EXISTS`, `DROP IF EXISTS`)
- Use purely additive migrations in short term: add new columns, don't delete; add new tables, don't modify existing
- Test migrations locally first: verify they run without conflicts
- Document migration strategy: how/when migrations run in production
- Plan rollback strategy: document how to roll back schema if needed

**Detection:**
- Application won't start after deploy
- Database reports lock timeouts or integrity errors
- Migration logs show conflicting operations

**Phase to Address:** Phase 1 (Setup & Auth) — establish migration pattern before building features

---

## Moderate Pitfalls

### Pitfall 1: Address Autocomplete UX Doesn't Match Expected Behavior

**What goes wrong:**
- User types "Denver CO" expecting to set home location to Denver
- Autocomplete returns specific addresses or ambiguous results
- User selects closest match without reading full address
- Resulting location is a street address instead of city center
- Trip routing starts from wrong point

**Why it happens:**
- Nominatim mixes street addresses and places in results
- Results ranked by importance, not relevance to user intent
- UI shows only street name, not full address components
- No clear visual distinction between "city" and "street address"

**Prevention:**
- Separate place types in autocomplete results: show "Cities" section and "Addresses" section
- Display full address hierarchy: "Denver, Denver County, Colorado, USA"
- Add result type badges: [City], [Street], [Place]
- Implement context: if setting home location, prioritize city-level results; if adding stop, prioritize specific addresses
- Test autocomplete with common queries to ensure expected results

**Detection:**
- User reports wrong location selected
- Home location or stops appear at street addresses instead of expected locations

**Phase to Address:** Phase 2 (Geocoding) — implement semantic result grouping in autocomplete

---

### Pitfall 2: OAuth Redirect URI Mismatch (Production-Only Bugs)

**What goes wrong:**
- Google OAuth works in dev (localhost:3000)
- Deploy to production (api.example.com)
- OAuth flow fails silently with cryptic "invalid_grant" error
- Error unrelated to actual cause: redirect URI has trailing slash in production but not in dev
- Users cannot log in via Google
- Support team cannot diagnose without deep OAuth debugging

**Why it happens:**
- OAuth redirect URI must match **exactly** (trailing slash, protocol, domain all matter)
- Configuration differs between environments (dev uses localhost, prod uses domain)
- Error message doesn't indicate mismatch; instead shows generic auth failure
- Developers test in dev only; production issues discovered at launch

**Consequences:**
- OAuth login blocked in production
- Only email/password login works
- Users relying on "Sign in with Google" cannot access app
- Requires quick hotfix and redeploy

**Prevention:**
- Document redirect URI exactly: "https://api.example.com/auth/callback/google" (note: no trailing slash)
- Use environment variables for OAuth config: different redirect URIs for dev/staging/production
- Test OAuth flow in production environment before launch (real domain, real OAuth credentials)
- Log redirect URI in error messages for debugging
- Validate redirect URI configuration on app startup: log expected vs configured URIs
- Add integration test for OAuth flow: mock redirect and verify token exchange

**Detection:**
- OAuth login fails in production but works in dev
- "invalid_grant" or "redirect_uri_mismatch" errors in logs
- Users report "Sign in with Google not working"

**Phase to Address:** Phase 1 (Setup & Auth) — test OAuth in production environment before launch

---

### Pitfall 3: OSRM Response Parsing and Coordinate Order Bugs

**What goes wrong:**
- Route distance/time looks correct but polyline is displayed incorrectly
- Coordinates appear reversed or out of order
- Map shows route looping back on itself or appearing fragmented
- User sees wrong route visualization

**Why it happens:**
- OSRM returns coordinates as [longitude, latitude] (GeoJSON standard)
- Leaflet expects [latitude, longitude]
- Easy to mix up coordinate order in parsing
- No validation that polyline coordinates make sense

**Prevention:**
- Document coordinate order explicitly in code: add comments on every polyline parse
- Add coordinate validation: verify that consecutive coordinates are close (not thousands of miles apart)
- Test route parsing with sample OSRM response before deployment
- Log parsed polylines for debugging
- Validate bounding box: if any coordinate is outside USA (for US road trips), flag as error

**Detection:**
- Polyline appears wrong on map (loops, fragments, or reversed)
- Distances seem reasonable but visual routing is incorrect

**Phase to Address:** Phase 3 (Routing) — validate coordinate parsing in unit tests

---

### Pitfall 4: Unsplash API Rate Limiting Breaks Trip Photo Feature

**What goes wrong:**
- User creates new trip, app searches Unsplash for cover photo
- First 50 requests work fine
- 51st request fails: rate limit (50/hour on free tier)
- Subsequent trips cannot fetch photos
- App returns broken image or blank cover

**Why it happens:**
- Developers assume 50 photos/hour is unlimited
- Photo search triggered on every trip creation without caching
- No rate limit handling in client code
- Multiple users creating trips simultaneously hits limit faster

**Consequences:**
- Trip cover photo feature becomes unreliable
- Users see broken images or generic placeholders
- Perceived as unpolished

**Prevention:**
- Cache Unsplash results by trip name/query: if "Yellowstone" was searched before, reuse cached results
- Implement fallback: if Unsplash fails, use solid color placeholder instead of broken image
- Track API usage: monitor requests per hour and show warning if approaching limit
- Use local image fallback: pre-populate database with high-quality images for popular destinations
- Consider upgrading Unsplash plan if needed (not much more expensive)
- Add request throttling: wait between photo searches if hitting limit

**Detection:**
- Trip photos fail to load after certain number of creations
- Unsplash API returns 403 Forbidden
- Users see broken image placeholders

**Phase to Address:** Phase 2 (Trip Creation) — implement caching and fallback for photo fetching

---

### Pitfall 5: Multi-User Concurrency: Lost Updates When Editing Stops

**What goes wrong:**
- User A and User B both editing the same shared trip (if sharing added later)
- User A changes stop name, User B changes stop dates simultaneously
- Both hit "Save" at same time
- Database commits both changes but one overwrites the other
- User B's date change is lost (or vice versa)
- Data inconsistency: stop name updated but dates reverted

**Why it happens:**
- No optimistic or pessimistic locking on stop records
- Application assumes only one user editing a trip
- Database just commits latest write without conflict detection

**Consequences:**
- User loses their edits without warning
- Data inconsistency
- User frustration: "Where did my changes go?"

**Prevention:**
- Implement optimistic locking: add `version` column to stops table
  - On save, include `WHERE version = :expectedVersion`
  - If another transaction updated it first, version mismatch causes save to fail
  - Prompt user: "Stop was changed by someone else. Reload or confirm your changes?"
- Or implement pessimistic locking: lock stop record while user editing (less user-friendly)
- Document multi-user expectations: "Personal trips are not shared; each user has their own copy"
- Add conflict detection: warn user if another session modified the stop

**Detection:**
- User reports "My changes disappeared"
- Stop data shows some fields updated, others reverted

**Phase to Address:** Phase 1 (Data Model) — add version/timestamp to trips and stops for conflict detection

---

## Minor Pitfalls

### Pitfall 1: Missing Offline Graceful Degradation

**What goes wrong:**
- User's internet drops while viewing trip on mobile
- Map becomes blank
- POI data not cached
- User cannot view trip details without internet

**Why it happens:**
- No service worker or offline cache strategy
- API requests fail with no fallback

**Prevention:**
- Cache map tiles locally (Leaflet can do this)
- Provide read-only offline access to trips they've already loaded
- Show "Offline" indicator when internet unavailable
- Document: "Internet required for live map/POI updates"

**Detection:**
- App becomes unusable when offline
- User reports "Map stopped working"

**Phase to Address:** Phase 5+ (Polish) — not critical for v1

---

### Pitfall 2: Stop Ordering UI Confusion

**What goes wrong:**
- User drags stops to reorder
- Drag-and-drop is finicky or unpredictable
- Stop list doesn't visually update after drag
- Route on map doesn't reflect new order

**Why it happens:**
- Poor drag-and-drop UX
- State update delays after reorder

**Prevention:**
- Implement clear drag-and-drop UX: visual feedback, handles, smooth animation
- Update route visualization immediately after reorder
- Test reordering with 10+ stops
- Provide alternative: numbered list with up/down arrow buttons

**Detection:**
- User reports confusion about stop order
- Drag-and-drop doesn't work as expected

**Phase to Address:** Phase 2 (Trip Stops) — test reordering UX carefully

---

### Pitfall 3: POI Image Loading Slow or Missing

**What goes wrong:**
- POI list loads but images take 5+ seconds
- Some images fail to load (broken URLs)
- List feels slow and unpolished

**Why it happens:**
- No image optimization or lazy loading
- Overpass data contains broken image URLs

**Prevention:**
- Lazy load POI images: only load when POI card becomes visible
- Optimize images: compress or resize before display
- Add fallback: show icon if image fails
- Test Overpass image URLs for validity before displaying

**Detection:**
- POI list slow to load
- Users see broken image icons
- Performance metrics show slow image loading

**Phase to Address:** Phase 3 (POI Discovery) — implement image lazy loading

---

## Phase-Specific Warnings

| Phase | Topic | Likely Pitfall | Mitigation |
|-------|-------|-----------|-----------|
| Phase 1 (Setup & Auth) | Database Migrations | Parallel migrations on container startup | Use dedicated migration service, add locking |
| Phase 1 (Setup & Auth) | OAuth Integration | Redirect URI mismatch in production | Test in production environment before launch |
| Phase 2 (Geocoding) | Nominatim Rate Limiting | IP blocked, queries fail | Implement client-side caching and debouncing |
| Phase 2 (Geocoding) | Address Precision | Wrong location selected | Require visual map confirmation before saving |
| Phase 2 (Trip Creation) | Unsplash Photos | Rate limit exceeded | Implement caching and fallback images |
| Phase 3 (Routing & Map) | Polyline Rendering | Map freezes with many stops | Simplify geometries, lazy load POIs |
| Phase 3 (POI Discovery) | Data Quality | Sparse/missing POIs in rural areas | Document limitations, show data confidence |
| Phase 3 (POI Discovery) | Image Performance | Slow or broken POI images | Lazy load, optimize, fallback to icons |
| Phase 4+ (Multi-Stop) | Route Optimization | Computational complexity escalates | Document max stops before degradation |
| Phase 4+ (Multi-User) | Concurrent Edits | Lost updates to shared trips | Implement optimistic locking with conflict resolution |

---

## Sources

- [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/)
- [Nominatim Rate Limit Issues - OSM Community Forum](https://community.openstreetmap.org/t/help-nominatim-returns-usage-limit-reached/103102)
- [Nominatim Usage Policy Understanding - OSM Community](https://community.openstreetmap.org/t/understanding-and-complying-with-nominatim-usage-policy/129212)
- [How to build a travel planner app: Complete guide for 2026](https://coaxsoft.com/blog/how-to-build-a-travel-planner-app)
- [Travel Planning App - Route Optimization Challenges](https://medium.com/@van.evanfebrianto/building-a-personal-travel-route-optimizer-a-technical-odyssey-e46b5b49a1fa)
- [Route Optimization: Complete Guide for 2025 - Badger Maps](https://www.badgermapping.com/blog/route-optimization-guide/)
- [Optimizing LLM-based Trip Planning - Google Research](https://research.google/blog/optimizing-llm-based-trip-planning/)
- [Leaflet Developer's Guide to High-Performance Map Visualizations](https://andrejgajdos.com/leaflet-developer-guide-to-high-performance-map-visualizations-in-react/)
- [Rendering Huge GeoJSON Datasets on a Map - Medium](https://danw1ld.medium.com/how-to-render-huge-geojson-datasets-on-a-map-part-2-be1edf555034/)
- [Performance Optimization for Large Datasets in Leaflet.js - DEV Community](https://dev.to/azyzz/performance-optimization-when-adding-12000-markers-to-the-map-that-renders-fast-with-elixir-liveview-and-leafletjs-54pf)
- [Top UI/UX Mistakes in Travel Booking Platforms](https://miracuves.com/blog/top-ui-ux-mistakes-travel-booking-platforms/)
- [How to Improve Travel App UX - Manticpoint](https://www.manticpoint.com/blog/how-to-improve-your-travel-apps-user-experience)
- [Why Do Online Travel Apps Fail - Common Pitfalls](https://www.jploft.com/blog/why-online-travel-apps-fail)
- [10 Common UX Problems on Travel Sites - Contentsquare](https://contentsquare.com/blog/10-common-ux-problems-on-travel-sites/)
- [PostgreSQL Geospatial Guide - geowgs84.ai](https://www.geowgs84.ai/post/postgres-geospatial-a-complete-guide-to-spatial-data-with-postgis)
- [PostGIS Performance Tuning - DoHost](https://dohost.us/index.php/2025/11/16/tuning-postgresql-configuration-for-postgis-performance/)
- [Overpass API Data Quality - Dark POIs Blog](https://dev.overpass-api.de/blog/dark_pois.html)
- [Filling Data Gaps in OpenStreetMap](https://www.transitorienteddiscoveries.com/blog/filling-data-gaps-with-openstreetmap)
- [Nominatim Precision Detection - OSM Help](https://help.openstreetmap.org/questions/19938/how-to-detect-when-a-nominatim-request-is-not-precise)
- [Concurrency Strategies in Multi-User Reservation Systems - Medium](https://medium.com/devbulls/concurrency-strategies-in-multi-user-reservation-systems-b8142dea1bc8)
- [Handling Concurrency Conflicts - EF Core Docs](https://learn.microsoft.com/en-us/ef/core/saving/concurrency)
- [Preventing Multi-User Concurrency Problems - InformIT](https://www.informit.com/articles/article.aspx?p=22681)
- [Why is OAuth Still Hard in 2026 - Nango Blog](https://nango.dev/blog/why-is-oauth-still-hard/)
- [I Spent 48 Hours Debugging OAuth 2.0 Flows - Complete Guide](https://markaicode.com/debugging-oauth-authentication-flows-complete-guide/)
- [Decoupling Database Migrations from Server Startup](https://pythonspeed.com/articles/schema-migrations-server-startup/)
- [Performing Django Database Migrations with Docker Compose - Baeldung](https://www.baeldung.com/ops/django-database-migrations-docker-compose)
- [Running SQL Migrations Before Booting Docker Compose Services](https://blog.alec.coffee/running-sql-migrations-before-booting-docker-compose-services)
- [Efficient Database Migrations with Flyway and Docker](https://thinhdanggroup.github.io/flyway-migration/)
- [Rendering Leaflet Clusters Fast - DEV Community](https://dev.to/agakadela/rendering-leaflet-clusters-fast-and-dynamically-let-s-compare-3-methods-291f)
- [Nominatim FAQ - OpenStreetMap Wiki](https://wiki.openstreetmap.org/wiki/Nominatim/FAQ)
- [Nominatim Search API Documentation](https://nominatim.org/release-docs/latest/api/Search/)
