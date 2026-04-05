# Architecture Patterns: Road Trip Planner

**Domain:** Multi-user interactive route planning with map visualization, location discovery, and POI exploration
**Researched:** 2026-04-05
**Stack:** React (frontend) + Node.js/Express (backend) + PostgreSQL (database) + Leaflet/OSRM/Nominatim/Overpass (external APIs)

## System Overview Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                             │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  Auth Component  │  │ Trip Management  │  │   Map Component  │  │
│  │ (Login/Register) │  │ (CRUD Trips)     │  │ (Leaflet + POIs) │  │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘  │
│           │                      │                     │            │
│  ┌─────────────────────────────────────────────────────┴──────────┐ │
│  │              React Context / State Management                    │ │
│  │  - AuthContext (user, token)                                   │ │
│  │  - TripContext (trips, stops, loading)                         │ │
│  │  - MapContext (mapState, selectedStop, POIs)                   │ │
│  └─────────────────────────────────────────────────────┬──────────┘ │
│                                                         │            │
└─────────────────────────────────────────────────────────┼────────────┘
                                                          │
                                                          ▼
                        ┌──────────────────────────────────────┐
                        │   API Gateway (CORS, logging)        │
                        └──────────────────────────────────────┘
                                        │
                ┌───────────────────────┼───────────────────────┐
                ▼                       ▼                       ▼
        ┌─────────────────────────────────────────────────────────────┐
        │                  BACKEND (Node.js/Express)                  │
        │                                                              │
        │  ┌──────────────┐  ┌──────────────┐  ┌──────────────────┐ │
        │  │Auth Routes   │  │ Trip Routes  │  │ Stop Routes      │ │
        │  │- login       │  │ - create     │  │ - create stop    │ │
        │  │- register    │  │ - getTrips   │  │ - updateStop     │ │
        │  │- oauth       │  │ - getTrip    │  │ - deleteStop     │ │
        │  │- refresh     │  │ - update     │  │ - reorderStops   │ │
        │  │- logout      │  │ - delete     │  └──────────────────┘ │
        │  └──────────────┘  └──────────────┘                        │
        │                                                              │
        │  ┌──────────────────────────────────────────────────────┐  │
        │  │          POI / Geocoding Routes                       │  │
        │  │ - searchAddress (Nominatim)                          │  │
        │  │ - getPOIsForStop (Overpass cache)                    │  │
        │  │ - getRoute (OSRM)                                    │  │
        │  │ - getUnsplashPhoto (trip cover search)               │  │
        │  └──────────────────────────────────────────────────────┘  │
        │                                                              │
        │  ┌──────────────────────────────────────────────────────┐  │
        │  │     Request Caching & Rate Limiting Middleware       │  │
        │  │ - Nominatim cache (Redis/in-memory)                 │  │
        │  │ - Overpass response cache                           │  │
        │  │ - Rate limiter (1 req/sec per user for Nominatim)   │  │
        │  └──────────────────────────────────────────────────────┘  │
        │                                                              │
        └──────────────────────────────────────────────────────────────┘
                │                    │                    │
                ▼                    ▼                    ▼
        ┌────────────────┐  ┌──────────────────┐  ┌──────────────────┐
        │ PostgreSQL     │  │ External APIs    │  │ Cache Layer      │
        │ - users        │  │ - Nominatim      │  │ (Redis/Memory)   │
        │ - trips        │  │ - OSRM           │  │ Rate limit safe  │
        │ - stops        │  │ - Overpass       │  │                  │
        │ - POIs         │  │ - Unsplash       │  │                  │
        │ - auth_tokens  │  │ - Google OAuth   │  │                  │
        └────────────────┘  └──────────────────┘  └──────────────────┘
```

## Component Boundaries

### Frontend Layer

| Component | Responsibility | Communicates With | Notes |
|-----------|---------------|-------------------|-------|
| **AuthComponent** | Login/register UI, credential handling | AuthContext, AuthRoutes | Triggers OAuth flow for Google; stores JWT in localStorage |
| **TripListComponent** | Display user's trips, create new trip | TripContext, /api/trips | Fetches trips on mount; triggers photo search (Unsplash) |
| **TripEditorComponent** | Edit trip name/description, manage stops | TripContext, /api/trips/:id, /api/stops | Shows stop list, reorder UI |
| **StopCardComponent** | Display single stop details, dates | TripContext, /api/stops/:id | Inline edit for dates/description |
| **MapComponent** | Interactive map visualization | MapContext, /api/routes, /api/pois | Renders Leaflet map, markers, polylines, popups for POIs |
| **AddressAutocompleteComponent** | Address search with dropdown | /api/geocode/search (Nominatim cache) | Rate-limited to 1 req/sec, debounced input |
| **POIListComponent** | Display POIs around a stop | MapContext, /api/pois/:stopId | Shows cached results from Overpass API |
| **AuthContext** | Global auth state | localStorage, AuthRoutes | Stores user ID, email, token; triggers token refresh |
| **TripContext** | Global trip/stop state | API routes | Syncs with backend; manages optimistic updates |
| **MapContext** | Map interaction state | MapComponent, POI routes | Tracks selected stop, visible POIs, map bounds |

### Backend Layer

| Component | Responsibility | Communicates With | Critical Pattern |
|-----------|---------------|-------------------|------------------|
| **AuthController** | Login, register, OAuth, token refresh | PostgreSQL (users, auth_tokens) | JWT + refresh tokens; rate limit per IP for auth attempts |
| **TripController** | CRUD trips, fetch user's trips | PostgreSQL (trips, stops), TripContext | Owner verification; cascading deletes |
| **StopController** | CRUD stops, reorder stops | PostgreSQL (stops), Nominatim (geocode validation) | Orphan prevention; order index management |
| **PoiController** | Fetch POIs for stop, cache management | PostgreSQL (pois), Overpass API, Redis/Memory cache | Spatial queries; cache key = (lat, lon, type); TTL 24h |
| **RoutingController** | Calculate routes, distances, times | OSRM API, stop coordinates | Caches entire route geometry; TTL 7d (stale if stop edited) |
| **GeocodingController** | Address search, autocomplete, validation | Nominatim API, Redis cache | Rate limit: 1 req/sec; cache key = query string; TTL 30d |
| **SearchController** | Unsplash trip photo search | Unsplash API | Rate limit: 50 req/hour (API limit) |
| **CacheMiddleware** | Nominatim/Overpass request caching | Redis or in-memory store | Key = hash(query + bounds), includes version/timestamp |
| **RateLimitMiddleware** | Enforce 1 req/sec for Nominatim | PostgreSQL (logs optional) | Per-user or per-IP; reject with 429 if exceeded |

### Database Layer (PostgreSQL)

| Table | Columns | Primary Purpose | Relationships |
|-------|---------|-----------------|---|
| **users** | id, email, password_hash, name, google_id, home_location, created_at | User account & profile | Owns many trips |
| **trips** | id, user_id, name, description, cover_photo_url, created_at, updated_at | Trip metadata | References user; owns many stops |
| **stops** | id, trip_id, order_index, address, lat, lon, description, start_date, end_date, created_at | Trip waypoints | References trip; has many POIs |
| **pois** | id, stop_id, name, lat, lon, type (restaurant/museum/etc), rating, osm_id, cached_at | Point of interest data | References stop; POI data from Overpass API |
| **auth_tokens** | id, user_id, token, refresh_token, expires_at | Auth session management | References user; row-per login |
| **geocode_cache** | id, query, lat, lon, address, cached_at, expires_at | Nominatim request cache | Not a formal table; optional Redis key-value |

### External APIs (Third-Party)

| Service | Purpose | Rate Limits | Caching Strategy |
|---------|---------|-----------|---|
| **Nominatim (OSM)** | Address autocomplete, reverse geocoding | 1 req/sec public | Cache in Redis/memory; key = query; TTL 30 days |
| **OSRM** | Route calculation, distances, drive times | ~10 req/sec (public) | Cache route geometry; key = ordered coordinates; TTL 7 days |
| **Overpass API** | POI search by type/location | Public heavily loaded | Cache POI results; key = (lat,lon,bbox); TTL 24 hours |
| **Unsplash API** | Trip cover photos via search | 50 req/hour free tier | Cache search results; key = trip name; TTL 7 days |
| **Google OAuth** | Third-party authentication | N/A | Token refresh handles expiry |

## Data Flow

### User Authentication Flow

```
1. User submits email/password or clicks "Login with Google"
   └─> AuthComponent → AuthRoutes (/auth/login or /auth/google/callback)

2. Backend validates credentials (email/password) or OAuth code
   └─> AuthController → PostgreSQL (users table)

3. Backend generates JWT + refresh_token
   └─> Returns to frontend

4. Frontend stores JWT in localStorage, refresh_token in httpOnly cookie
   └─> AuthContext updates user state

5. All subsequent API requests include JWT in Authorization header
   └─> Middleware verifies token; rejects if expired

6. When JWT expires, frontend calls /auth/refresh with refresh_token
   └─> New JWT returned; old token invalidated
```

### Trip Creation & Stop Management Flow

```
1. User creates trip (name, description, optional cover photo search)
   └─> TripListComponent → POST /api/trips

2. Backend creates trip record, optionally searches Unsplash
   └─> TripController → PostgreSQL (trips table) + Unsplash API

3. Frontend fetches trips list and updates TripContext
   └─> GET /api/trips

4. User adds stop with address (e.g., "Yosemite Valley, CA")
   └─> StopCardComponent → Address autocomplete

5. Address input triggers autocomplete search (debounced)
   └─> GET /api/geocode/search?query=... with rate limit

6. Backend checks Nominatim cache; if miss, queries API
   └─> GeocodingController → Nominatim API with 1-req/sec throttle

7. User selects address from dropdown
   └─> Coordinates + address stored in stop record
   └─> POST /api/stops with (trip_id, address, lat, lon, dates)

8. Backend creates stop, validates geocode, stores coordinates
   └─> StopController → PostgreSQL (stops table)

9. Map re-renders with new marker; TripContext updates
   └─> MapComponent reads updated stops from TripContext

10. User edits stop order (drag-drop UI)
    └─> PUT /api/trips/:id/reorder with new stop order

11. Backend updates order_index for all stops
    └─> StopController → PostgreSQL (UPDATE stops)

12. Frontend fetches updated stops; MapComponent re-renders
```

### Route Visualization & Distance Calculation Flow

```
1. Trip has 2+ stops with coordinates
   └─> MapComponent detects stop change or user clicks "Show Route"

2. Frontend collects coordinates in order
   └─> GET /api/routes?coords=lat1,lon1;lat2,lon2;...

3. Backend checks OSRM cache for exact route
   └─> RoutingController queries Redis with key = hash(coordinates)

4. If cache miss, calls OSRM API (public instance or self-hosted)
   └─> OSRM returns route geometry (polyline), distance, duration

5. Backend caches result with 7-day TTL
   └─> RoutingController → Redis/cache

6. Frontend receives route, renders polyline on map
   └─> MapComponent → Leaflet L.polyline() with coordinates

7. Displays total distance and drive time
   └─> MapComponent renders HTML overlay on map

8. If stop is deleted or moved significantly, route cache invalidated
   └─> StopController → Cache invalidation logic
```

### POI Discovery & Display Flow

```
1. User selects a stop on map or clicks "Show POIs"
   └─> MapComponent sets selectedStop in MapContext

2. Frontend requests POIs for stop coordinates
   └─> GET /api/pois/:stopId or GET /api/pois?lat=...&lon=...

3. Backend checks POI cache for (lat, lon, search_radius)
   └─> PoiController queries PostgreSQL (pois table) + checks cache

4. If cache miss or expired, queries Overpass API
   └─> Constructs Overpass query: [bbox];(node[amenity=restaurant];...);
   └─> May include filters: restaurant, museum, cafe, etc.

5. Overpass returns OSM nodes with tags (name, rating, website)
   └─> PoiController parses response, creates POI records

6. Backend caches results with 24-hour TTL
   └─> Stores in PostgreSQL (pois table) + Redis

7. Frontend receives POI list, displays as clickable markers on map
   └─> MapComponent renders POI markers (different icon/color per type)

8. User clicks POI marker
   └─> Popup shows name, type, rating, map link
   └─> POIListComponent displays all POIs for stop

9. User scrolls through POIs
   └─> Each POI click centers map on POI, highlights stop in list
```

### Address Autocomplete (Nominatim) Flow

```
1. User types address in AddressAutocompleteComponent
   └─> Input triggers onChange with debounce (300-500ms)

2. Debounced query sent to backend
   └─> GET /api/geocode/search?q=<user_input>

3. Backend rate limiter checks: user has sent <1 req in last second?
   └─> If rate limited, return 429 Throttled

4. Backend checks Nominatim cache (Redis/in-memory)
   └─> Cache key = query string, TTL = 30 days

5. If cache hit, return cached results immediately
   └─> Frontend populates dropdown (instant UX)

6. If cache miss, query Nominatim API (1 req/sec enforced)
   └─> Wait for response or queue if rate limit active

7. Nominatim returns results (up to 10 addresses)
   └─> Backend caches results, returns to frontend

8. Frontend renders dropdown list
   └─> User selects one address from list

9. Selected address coordinates (lat, lon) stored in stop
```

## Component Dependencies & Build Order

### Initialization Order (Recommended Phase Structure)

```
Phase 1: Core Auth & User Management
├─ users table (PostgreSQL)
├─ auth_tokens table
├─ AuthComponent (login/register UI)
├─ AuthController (JWT, refresh tokens)
└─ AuthContext (frontend state)

Phase 2: Trip CRUD & Stop Management
├─ trips table
├─ stops table
├─ TripListComponent, TripEditorComponent, StopCardComponent
├─ TripController, StopController
├─ TripContext
└─ Basic trips API (no geocoding yet)

Phase 3: Address Geocoding & Nominatim Integration
├─ GeocodingController + rate limiting middleware
├─ AddressAutocompleteComponent + debounce
├─ Nominatim cache layer (Redis/in-memory)
├─ /api/geocode/search endpoint
└─ Validate stop coordinates before storing

Phase 4: Map Visualization & Routing
├─ MapComponent (Leaflet integration)
├─ MapContext
├─ RoutingController + OSRM integration
├─ Route caching layer
├─ /api/routes endpoint
└─ Polyline rendering on map

Phase 5: POI Discovery & Overpass Integration
├─ pois table (PostgreSQL)
├─ PoiController + Overpass integration
├─ POI caching layer (24h TTL)
├─ POIListComponent
├─ /api/pois endpoint
└─ POI markers and popup display on map

Phase 6: Trip Photo Search (Unsplash)
├─ SearchController + Unsplash API
├─ Cache search results
├─ TripListComponent shows cover photos
├─ /api/search/photos endpoint
└─ Polish photo picker UI

Phase 7: Deployment & Polish
├─ Docker Compose setup (all services)
├─ Error handling & loading states
├─ Responsive design (mobile-friendly)
├─ Performance optimization (lazy load POIs, debounce inputs)
└─ User testing & bug fixes
```

### Critical Dependencies

```
TripContext depends on:
  └─ AuthContext (must have logged-in user)

MapComponent depends on:
  └─ TripContext (trips, stops loaded)
  └─ MapContext (map interaction state)

RoutingController depends on:
  └─ stops with valid (lat, lon) coordinates

PoiController depends on:
  └─ stops with valid (lat, lon) coordinates
  └─ Overpass API response parsing

AddressAutocompleteComponent depends on:
  └─ Rate limiting middleware to prevent Nominatim spam

OSRM integration depends on:
  └─ 2+ stops with coordinates in correct order
```

## Architectural Patterns to Follow

### Pattern 1: Cache Invalidation on Data Change

**What:** When a stop is edited (address, coordinates, or dates), invalidate related caches.

**When:** After any PUT/DELETE to /stops or /trips

**Example:**
```typescript
// Backend: After updating a stop's coordinates
async updateStop(stopId: string, data: Partial<Stop>) {
  const stop = await db.stops.update(stopId, data);
  
  // Invalidate route cache for this trip
  const trip = await db.trips.findById(stop.trip_id);
  cache.invalidateKey(`route:${trip.id}`);
  
  // Invalidate POI cache for this stop if coordinates changed
  if (data.lat || data.lon) {
    cache.invalidatePattern(`poi:${stopId}:*`);
  }
  
  return stop;
}
```

### Pattern 2: Rate-Limited API Wrapper

**What:** Centralize rate limiting for Nominatim to enforce 1 req/sec globally.

**When:** Every call to Nominatim geocoding API

**Example:**
```typescript
// Backend: Rate limiter middleware
const nominatimRateLimiter = rateLimit({
  windowMs: 1000, // 1 second window
  max: 1,         // 1 request per second
  message: 'Too many geocoding requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

router.get('/api/geocode/search', nominatimRateLimiter, async (req, res) => {
  const query = req.query.q;
  
  // Check cache first
  const cached = cache.get(`geocode:${query}`);
  if (cached) return res.json(cached);
  
  // Query Nominatim
  const results = await nominatim.search(query);
  cache.set(`geocode:${query}`, results, { ttl: 30 * 24 * 60 * 60 }); // 30 days
  
  res.json(results);
});
```

### Pattern 3: Optimistic Updates with Fallback

**What:** Update UI immediately after user action; rollback on server error.

**When:** Stop reorder, trip edit, stop delete

**Example:**
```typescript
// Frontend: Optimistic stop reorder
async function reorderStops(stops: Stop[]) {
  const previousStops = [...tripContext.stops]; // Backup
  
  // Optimistically update UI
  setTripContext(prev => ({ ...prev, stops }));
  
  try {
    // Send to backend
    await api.put(`/trips/${trip.id}/reorder`, {
      stops: stops.map((s, i) => ({ id: s.id, order: i }))
    });
  } catch (error) {
    // Rollback on error
    setTripContext(prev => ({ ...prev, stops: previousStops }));
    showError('Failed to reorder stops');
  }
}
```

### Pattern 4: Spatial Query with Bounding Box

**What:** When fetching POIs, use a bounding box around stop coordinates to minimize Overpass API calls.

**When:** POI discovery for a stop

**Example:**
```typescript
// Backend: POI query with bbox
async getPoisForStop(stopId: string, radius_km = 5) {
  const stop = await db.stops.findById(stopId);
  const { lat, lon } = stop;
  
  // Calculate bbox from center point + radius
  const bbox = calculateBbox(lat, lon, radius_km);
  
  // Check cache first
  const cacheKey = `poi:${stopId}:${radius_km}km`;
  const cached = cache.get(cacheKey);
  if (cached && !isStale(cached)) return cached;
  
  // Query Overpass for multiple amenity types
  const overpassQuery = buildOverpassQuery(bbox, ['restaurant', 'cafe', 'museum']);
  const pois = await overpass.query(overpassQuery);
  
  // Store in PostgreSQL + cache
  await db.pois.upsertMany(pois.map(p => ({ ...p, stop_id: stopId })));
  cache.set(cacheKey, pois, { ttl: 24 * 60 * 60 }); // 24 hours
  
  return pois;
}
```

### Pattern 5: JWT Refresh Token Rotation

**What:** Separate access token (short-lived) from refresh token (long-lived); rotate refresh token on each use.

**When:** Auth flow and token expiry

**Example:**
```typescript
// Backend: Token refresh endpoint
async refreshToken(refreshToken: string) {
  const authToken = await db.authTokens.findByRefreshToken(refreshToken);
  if (!authToken || authToken.expires_at < Date.now()) {
    throw new UnauthorizedError('Refresh token expired');
  }
  
  // Generate new tokens
  const newAccessToken = jwt.sign({ userId: authToken.user_id }, JWT_SECRET, { expiresIn: '15m' });
  const newRefreshToken = crypto.randomBytes(32).toString('hex');
  
  // Rotate: invalidate old refresh token, store new one
  await db.authTokens.update(authToken.id, {
    refresh_token: newRefreshToken,
    expires_at: Date.now() + 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  
  return { accessToken: newAccessToken, refreshToken: newRefreshToken };
}
```

## Anti-Patterns to Avoid

### Anti-Pattern 1: Unbounded Overpass API Queries

**What:** Querying Overpass for all amenity types across entire map bounds without filtering.

**Why bad:** 
- Overpass API is heavily rate-limited and often returns 500 errors
- Enormous response sizes (MB of XML/JSON) kill performance
- No cache strategy leads to repeated failures

**Instead:**
- Filter by specific amenity types (restaurant, cafe, museum only)
- Use small bounding box (e.g., 5km radius around stop)
- Implement aggressive caching (24h TTL)
- Fall back gracefully if Overpass fails (show cached or empty POI list)

### Anti-Pattern 2: Storing Raw Nominatim API Calls Without Validation

**What:** Accepting and storing user input directly as address without geocoding validation.

**Why bad:**
- No verification that address is valid/real
- Frontend filters/displays invalid addresses
- Can create orphaned stops with invalid coordinates
- Route calculations fail for stops with null coordinates

**Instead:**
- Always geocode address through Nominatim before storing
- Require (lat, lon) to be present in stop record before save
- Show user the matched address from Nominatim (not raw input)
- Add NOT NULL constraints on stops(lat, lon)

### Anti-Pattern 3: Fetching All POIs on Map Load

**What:** Loading POIs for all visible stops when map bounds change.

**Why bad:**
- Multiplies API calls (one per stop)
- Hits Overpass rate limits immediately
- Slow perceived performance (waiting for all API responses)

**Instead:**
- Lazy-load POIs only when user clicks stop or scrolls to POI panel
- Show loading state while fetching
- Prefetch POIs for nearby stops (on demand, not automatically)
- Cache aggressively (24h minimum)

### Anti-Pattern 4: Passing Secrets in Frontend Environment

**What:** Storing API keys (Unsplash, Google OAuth) in .env.js or React components.

**Why bad:**
- Secrets exposed in client-side bundle (readable in browser)
- No rate limiting per-user; anyone can use the key
- API key compromise requires frontend redeployment

**Instead:**
- Keep all API keys in backend .env file
- Frontend only calls backend /api/search/photos
- Backend proxies Unsplash requests (rate limits per user, not per API key)
- Use environment-based config for backend secrets

### Anti-Pattern 5: No Pagination or Virtual Scrolling for POI Lists

**What:** Rendering 100+ POI list items in DOM simultaneously.

**Why bad:**
- DOM becomes massive; browser performance degrades
- Scrolling is janky; user experience is poor
- Memory usage spikes

**Instead:**
- Virtual scroll (show ~20 visible items, render dynamically)
- Pagination (show 10-20 per page with "Next" button)
- Filter by amenity type (restaurants only, etc.)
- Limit Overpass query to top 50 results

## Scalability Considerations

| Concern | At 100 Users | At 10K Users | At 1M Users |
|---------|--------------|--------------|-------------|
| **Database** | Single PostgreSQL instance, 1GB | PostgreSQL with read replicas for reporting; ~10GB | PostgreSQL with sharding by user_id; distributed cache (Redis cluster) |
| **Nominatim** | In-memory cache sufficient | Migrate to Redis cache; add local Nominatim instance if at risk of rate limiting | Self-hosted Nominatim instance with custom tuning; queue geocoding jobs |
| **OSRM** | Public instance OK; cache routes 7 days | Self-host OSRM (single instance); cache routes perpetually | Multi-region OSRM instances; cache by trip, not individual route |
| **Overpass API** | Cache 24h; public instance | Self-host Overpass or use PostGIS directly; cache 7+ days | Custom tile server or local PostGIS; pre-compute POI indices by region |
| **Frontend State** | Context API sufficient | Consider Redux or Zustand for complex state | Zustand + persisted cache; server-side sessions for multi-device sync |
| **Auth** | Stateless JWT; single PostgreSQL table | JWT + Redis session store for logout tracking | OAuth2 with external identity provider (Auth0, Okta); invalidation cache |
| **API Rate Limiting** | Per-IP or per-user basic limits | Per-user sophisticated limits; queue non-critical requests | Per-user tier-based limits; background job processor for batch operations |

## Sources

- [AI Trip Planner App Development Guide](https://www.vrinsofts.com/ai-trip-planner-app-development-guide/)
- [How to build a travel planner app: 2026 Guide](https://coaxsoft.com/blog/how-to-build-a-travel-planner-app)
- [MERN Stack Patterns and Best Practices](https://dev.to/jacobandrewsky/five-design-patterns-to-know-in-nodejs-265h)
- [React Architecture and State Management](https://www.geeksforgeeks.org/reactjs/react-architecture-pattern-and-best-practices/)
- [Leaflet Documentation](https://leafletjs.com/)
- [Nominatim Usage Policy](https://operations.osmfoundation.org/policies/nominatim/)
- [OSRM: Open Source Routing Machine](https://project-osrm.org/)
- [Getting Started with OSRM](https://medium.com/ula-engineering/getting-started-with-osrm-a-guide-1854891fff11)
- [Overpass API Guide](https://wiki.openstreetmap.org/wiki/Overpass_API)
- [Loading POI Data from OpenStreetMap](https://blog.devgenius.io/loading-poi-data-from-openstreetmap-using-overpass-api-b287ed809ed8)
- [PostgreSQL Hierarchical Data Modeling](https://medium.com/learning-sql/working-with-hierarchical-data-in-postgres-d92e86464c41)
- [React Context API for State Management](https://legacy.reactjs.org/docs/context.html)
- [State Management in React 2025](https://www.developerway.com/posts/react-state-management-2025)
