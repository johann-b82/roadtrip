# Phase 3: Map Visualization & POI Discovery - Research

**Researched:** 2026-04-05
**Domain:** Interactive mapping (Leaflet), routing (OSRM), POI discovery (Overpass API)
**Confidence:** MEDIUM-HIGH

## Summary

Phase 3 adds the visual and discovery layer to the road trip planner. The existing codebase already has `leaflet` (1.9.x) and `react-leaflet` (5.0.0) installed, and a basic `MapPreview` component showing a single marker. This phase must upgrade that component into a full trip map with multi-stop markers, route polylines from OSRM, distance/duration calculations, and POI discovery via the Overpass API.

The critical architectural decision is OSRM hosting. The public demo server (`router.project-osrm.org`) is unreliable -- reports from late 2025 show frequent downtime. For development, the public server is acceptable as a fallback, but production needs a self-hosted OSRM Docker container added to docker-compose.yml. Since Docker is planned for Phase 4 deployment, Phase 3 should add the OSRM service to docker-compose.yml now and also support a configurable OSRM base URL (defaulting to the public server for local dev without Docker).

A major finding: **OSM/Overpass does NOT provide images or ratings**. Requirement POI-02 says "POI list shows images and ratings (from OSM/Overpass data)." OSM tags include `name`, `opening_hours`, `website`, `phone`, `cuisine`, and sometimes `image` or `wikimedia_commons` links, but structured ratings do not exist in OSM data. The implementation should show available OSM metadata (name, category, opening hours, website, cuisine) and display Wikimedia Commons images when the `image` or `wikimedia_commons` tag exists. For POIs without images, use category-based placeholder icons.

**Primary recommendation:** Build a backend routing proxy for OSRM and Overpass API calls (caching both), a `TripMap` component replacing `MapPreview` with polylines and multi-stop markers, and a POI panel triggered by clicking a stop marker.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MAP-01 | Full trip displayed on interactive OpenStreetMap map (Leaflet) | Existing MapPreview + react-leaflet already installed; upgrade to TripMap with fitBounds for all stops |
| MAP-02 | All stops shown as markers on the map | Use react-leaflet Marker components with custom numbered icons; fitBounds auto-zooms |
| MAP-03 | Route between stops visualized as polyline | OSRM Route API returns encoded polyline; decode with @mapbox/polyline; render with react-leaflet Polyline |
| MAP-04 | Distance and drive time for each leg (OSRM) | OSRM response includes per-leg `distance` (meters) and `duration` (seconds) in `routes[0].legs[]` |
| MAP-05 | Total trip distance and drive time shown | Sum all leg distances/durations from OSRM response; also available as `routes[0].distance` and `routes[0].duration` |
| POI-01 | POIs around each stop discovered and displayed | Overpass API `around:radius,lat,lon` query for amenity/tourism/leisure tags; backend proxy with caching |
| POI-02 | POI list shows images and ratings | OSM has NO ratings; images sparse (wikimedia_commons/image tags). Show available metadata + category icons as fallback |
| POI-03 | User can search for specific POIs around a stop | Overpass query with user-specified tag (map search terms to OSM tag keys/values) |
| POI-04 | Discovered POIs stored in PostgreSQL | New `pois` table with stop_id FK, OSM data cached, user selections persisted |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **Stack**: React frontend, Node.js/Express backend, PostgreSQL database
- **Maps**: OpenStreetMap + Leaflet + OSRM (no Google Maps)
- **Geocoding**: Nominatim (already implemented in Phase 2)
- **Cost**: All external APIs must be free-tier compatible
- **Backend**: CommonJS (`type: "commonjs"`)
- **DB access**: Via `{ pool, query }` from `db/connection.js`
- **Deployment**: Docker Compose (services defined in docker-compose.yml)

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| leaflet | 1.9.4 | Map rendering | Already in frontend/package.json; stable, 42KB |
| react-leaflet | 5.0.0 | React bindings | Already installed; MapContainer, TileLayer, Marker, Polyline, Popup components |

### New Dependencies
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @mapbox/polyline | 1.2.1 | Decode OSRM polyline geometry | Standard polyline decoder, tiny package, Mapbox-maintained |

### Backend (No New Dependencies)
OSRM and Overpass API calls use `axios` (already installed). No new backend packages needed.

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @mapbox/polyline | Leaflet.encoded plugin | Plugin adds Leaflet dependency to decoder; @mapbox/polyline is lighter and works on backend too |
| Manual OSRM fetch | leaflet-routing-machine | LRM adds UI chrome (directions panel) we don't need; manual fetch gives full control |
| Overpass API | Foursquare/Google Places | Violates free-tier constraint; Overpass is free and OSM-native |

**Installation (frontend only):**
```bash
npm install @mapbox/polyline
```

## Architecture Patterns

### Recommended Project Structure (New Files)
```
backend/src/
  routing/
    routes.js          # GET /api/trips/:tripId/route — proxies OSRM
    service.js         # OSRM API client with caching
  pois/
    routes.js          # GET /api/stops/:stopId/pois, GET /api/stops/:stopId/pois/search
    model.js           # PostgreSQL CRUD for pois table
    service.js         # Overpass API client with caching

frontend/src/
  components/
    TripMap.jsx        # Full trip map (replaces MapPreview usage in TripDetail)
    TripMapController.jsx  # useMap() hook component for fitBounds
    RoutePolyline.jsx  # Polyline segment between stops
    StopMarker.jsx     # Numbered stop marker with click handler
    POIPanel.jsx       # Slide-out panel showing POIs for selected stop
    POICard.jsx        # Individual POI display card
    POISearchBar.jsx   # Search input for POI filtering
  hooks/
    useRoute.js        # Fetches route data for a trip
    usePOIs.js         # Fetches/searches POIs for a stop
  services/
    routing.api.js     # API client for /api/trips/:tripId/route
    pois.api.js        # API client for /api/stops/:stopId/pois
```

### Pattern 1: OSRM Backend Proxy with Caching
**What:** Backend proxies OSRM requests instead of frontend calling OSRM directly.
**When to use:** Always -- avoids CORS issues, enables caching, hides OSRM endpoint from client.
**Example:**
```javascript
// backend/src/routing/service.js
const axios = require('axios');

const OSRM_BASE = process.env.OSRM_BASE_URL || 'https://router.project-osrm.org';

// Cache routes by coordinate hash (stops rarely change)
const routeCache = new Map();

async function getRoute(coordinates) {
  // coordinates: [[lon, lat], [lon, lat], ...]
  const coordString = coordinates.map(c => `${c[0]},${c[1]}`).join(';');
  const cacheKey = coordString;

  if (routeCache.has(cacheKey)) return routeCache.get(cacheKey);

  const url = `${OSRM_BASE}/route/v1/driving/${coordString}`;
  const response = await axios.get(url, {
    params: {
      overview: 'full',        // Full geometry for polyline
      geometries: 'polyline',  // Google-encoded polyline (default)
      steps: false,
      alternatives: false,
    },
  });

  if (response.data.code !== 'Ok') {
    throw new Error(`OSRM error: ${response.data.code}`);
  }

  const result = {
    geometry: response.data.routes[0].geometry,  // Encoded polyline
    distance: response.data.routes[0].distance,  // Total meters
    duration: response.data.routes[0].duration,  // Total seconds
    legs: response.data.routes[0].legs.map(leg => ({
      distance: leg.distance,
      duration: leg.duration,
    })),
  };

  routeCache.set(cacheKey, result);
  return result;
}
```

### Pattern 2: Overpass POI Query
**What:** Backend queries Overpass API for POIs around a stop's coordinates.
**When to use:** When user clicks a stop or searches for POIs.
**Example:**
```javascript
// backend/src/pois/service.js
const axios = require('axios');
const OVERPASS_URL = 'https://overpass-api.de/api/interpreter';

async function queryPOIs(lat, lon, radius = 5000, categories = null) {
  // Default categories: restaurants, attractions, lodging
  const defaultTags = [
    '["amenity"~"restaurant|cafe|bar|fast_food"]',
    '["tourism"~"attraction|museum|viewpoint|hotel|motel|camp_site|caravan_site"]',
    '["leisure"~"park|nature_reserve|beach_resort"]',
  ];

  const tags = categories || defaultTags;
  const queries = tags.map(tag =>
    `nwr${tag}(around:${radius},${lat},${lon});`
  ).join('\n');

  const query = `
    [out:json][timeout:25];
    (
      ${queries}
    );
    out center tags;
  `;

  const response = await axios.post(OVERPASS_URL, `data=${encodeURIComponent(query)}`, {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  });

  return response.data.elements.map(el => ({
    osm_id: el.id,
    osm_type: el.type,
    lat: el.lat || el.center?.lat,
    lon: el.lon || el.center?.lon,
    name: el.tags?.name || 'Unnamed',
    category: el.tags?.amenity || el.tags?.tourism || el.tags?.leisure || 'other',
    cuisine: el.tags?.cuisine || null,
    opening_hours: el.tags?.opening_hours || null,
    website: el.tags?.website || null,
    phone: el.tags?.phone || null,
    image_url: el.tags?.image || null,
    wikimedia_commons: el.tags?.wikimedia_commons || null,
  }));
}
```

### Pattern 3: Polyline Decoding on Frontend
**What:** Decode OSRM encoded polyline to lat/lng array for react-leaflet Polyline.
**When to use:** After receiving route data from backend.
**Example:**
```javascript
// frontend/src/components/RoutePolyline.jsx
import { Polyline } from 'react-leaflet';
import polyline from '@mapbox/polyline';

export default function RoutePolyline({ geometry, color = '#3b82f6', weight = 4 }) {
  const positions = polyline.decode(geometry); // Returns [[lat, lng], ...]
  return <Polyline positions={positions} color={color} weight={weight} opacity={0.8} />;
}
```

### Pattern 4: fitBounds for Auto-Zoom
**What:** Auto-zoom map to fit all stop markers.
**When to use:** When trip loads or stops change.
**Example:**
```javascript
// frontend/src/components/TripMapController.jsx
import { useMap } from 'react-leaflet';
import { useEffect } from 'react';
import L from 'leaflet';

export default function TripMapController({ stops }) {
  const map = useMap();

  useEffect(() => {
    if (stops.length === 0) return;
    const bounds = L.latLngBounds(
      stops
        .filter(s => s.address_lat && s.address_lon)
        .map(s => [s.address_lat, s.address_lon])
    );
    if (bounds.isValid()) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 14 });
    }
  }, [map, stops]);

  return null;
}
```

### Anti-Patterns to Avoid
- **Calling OSRM from frontend directly:** CORS issues with public server; no caching; exposes routing infrastructure.
- **Querying Overpass on every map interaction:** Rate-limited; cache POI results in PostgreSQL for 24 hours.
- **Re-fetching route on every render:** Route only changes when stops change (add/remove/reorder). Cache by stop coordinate hash.
- **Single OSRM call for all stops at once:** OSRM handles this natively with multiple waypoints -- do NOT make N-1 separate calls for N stops.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Polyline decoding | Manual Google polyline decoder | @mapbox/polyline | Edge cases with precision, negative coordinates |
| Distance formatting | Manual meters-to-km conversion | Simple utility function (not a library) | Straightforward: `(meters / 1000).toFixed(1) + ' km'` |
| Duration formatting | Manual seconds-to-hours | Simple utility function | `Math.floor(s/3600) + 'h ' + Math.floor((s%3600)/60) + 'min'` |
| POI category mapping | Hardcoded tag-to-label mapping | A lookup object mapping OSM tags to display labels/icons | OSM has hundreds of amenity values; start with top 15-20 |
| Map marker clustering | Custom spatial index | Leaflet.markercluster (if POI count > 50 per stop) | Not needed for stops (max 15-20) but may be needed for POIs |

## Common Pitfalls

### Pitfall 1: OSRM Coordinate Order
**What goes wrong:** OSRM uses `longitude,latitude` order, but Leaflet uses `[latitude, longitude]`. Swapped coordinates produce routes in the wrong hemisphere.
**Why it happens:** Different conventions between routing APIs and mapping libraries.
**How to avoid:** When building OSRM coordinate strings from stops, always use `stop.address_lon,stop.address_lat`. When passing to Leaflet, always use `[stop.address_lat, stop.address_lon]`.
**Warning signs:** Route appears on the wrong continent or as a straight line.

### Pitfall 2: OSRM Public Server Unreliability
**What goes wrong:** Route requests fail intermittently because the public demo server is down.
**Why it happens:** The public server has no uptime guarantee; reported down multiple times in 2025.
**How to avoid:** Use a configurable `OSRM_BASE_URL` env var. For development without Docker, fall back to public server. Add OSRM Docker service to docker-compose.yml for reliable local dev with Docker. Handle OSRM errors gracefully in the UI (show "Route unavailable" instead of crashing).
**Warning signs:** 502/503 errors from router.project-osrm.org.

### Pitfall 3: Overpass API Rate Limiting
**What goes wrong:** Overpass returns 429 errors when querying POIs for multiple stops rapidly.
**Why it happens:** Each user clicking through stops generates a query; Overpass has slot-based rate limiting.
**How to avoid:** Cache Overpass results in PostgreSQL (pois table) for 24 hours. Never query Overpass from the frontend. Implement exponential backoff on 429 responses. Batch POI queries where possible.
**Warning signs:** 429 status code, queries timing out.

### Pitfall 4: OSM Data Sparsity
**What goes wrong:** Rural stops return zero or very few POIs. No images or ratings available.
**Why it happens:** OSM coverage varies dramatically; rural areas have minimal POI data. OSM fundamentally does not store ratings.
**How to avoid:** Show "No POIs found in this area" gracefully. Offer to expand search radius. Use category icons instead of images. Display available metadata (name, opening hours, website, cuisine) rather than expecting images/ratings. For POI-02, interpret "ratings" as OSM quality indicators (e.g., `stars` tag for hotels when present, otherwise omit).
**Warning signs:** Empty POI lists in testing with rural coordinates.

### Pitfall 5: Leaflet Icon Path Issue in Vite
**What goes wrong:** Default Leaflet markers show as broken images.
**Why it happens:** Vite bundles assets differently from webpack; Leaflet's icon path detection breaks.
**How to avoid:** Already handled in existing MapPreview.jsx with `L.Icon.Default.mergeOptions()` fix. Ensure TripMap reuses the same fix. Extract to a shared utility.
**Warning signs:** Broken image icon on map.

### Pitfall 6: MapContainer Re-render Immutability
**What goes wrong:** MapContainer ignores updated `center` and `zoom` props after initial render.
**Why it happens:** react-leaflet's MapContainer is immutable after mount by design.
**How to avoid:** Use a child component with `useMap()` hook (TripMapController pattern) to programmatically call `fitBounds()` or `setView()`.
**Warning signs:** Map doesn't update when stops change.

## Database Schema (New Tables)

### POIs Table
```sql
-- POIs table (Phase 3)
CREATE TABLE IF NOT EXISTS pois (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  stop_id UUID NOT NULL REFERENCES stops(id) ON DELETE CASCADE,
  osm_id BIGINT NOT NULL,
  osm_type VARCHAR(20) NOT NULL,
  name TEXT NOT NULL,
  category VARCHAR(100) NOT NULL,
  lat NUMERIC(9, 6) NOT NULL,
  lon NUMERIC(9, 6) NOT NULL,
  cuisine TEXT,
  opening_hours TEXT,
  website TEXT,
  phone TEXT,
  image_url TEXT,
  wikimedia_commons TEXT,
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pois_stop_id ON pois(stop_id);
CREATE INDEX IF NOT EXISTS idx_pois_osm_id ON pois(osm_id, osm_type);
```

### Route Cache Table (Optional -- In-Memory May Suffice)
```sql
-- Route cache table (Phase 3) - optional, in-memory cache also viable
CREATE TABLE IF NOT EXISTS route_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  coordinates_hash VARCHAR(64) NOT NULL,
  geometry TEXT NOT NULL,
  total_distance NUMERIC(12, 2) NOT NULL,
  total_duration NUMERIC(12, 2) NOT NULL,
  legs JSONB NOT NULL DEFAULT '[]',
  cached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '24 hours',
  CONSTRAINT route_cache_hash_unique UNIQUE (coordinates_hash)
);

CREATE INDEX IF NOT EXISTS idx_route_cache_hash ON route_cache(coordinates_hash);
CREATE INDEX IF NOT EXISTS idx_route_cache_trip ON route_cache(trip_id);
```

## OSRM Docker Service Configuration

Add to docker-compose.yml for self-hosted routing:

```yaml
  osrm:
    image: ghcr.io/project-osrm/osrm-backend
    ports:
      - "5000:5000"
    volumes:
      - osrm-data:/data
    command: osrm-routed --algorithm mld /data/germany-latest.osrm
    # Note: Requires pre-processed OSM data. See setup script.
```

**Complexity trade-off:** Self-hosted OSRM requires downloading and pre-processing OSM data (can take 30+ minutes for a country-sized extract). For Phase 3 development, use the public server with graceful error handling. Add Docker OSRM as an optional enhancement or defer to Phase 4.

**Recommended approach for Phase 3:** Use `OSRM_BASE_URL` env var defaulting to `https://router.project-osrm.org`. Document the self-hosted Docker setup but don't block Phase 3 on it.

## Code Examples

### OSRM Route Request (Backend)
```javascript
// Source: OSRM HTTP API docs (project-osrm.org/docs/v5.24.0/api/)
// GET /route/v1/driving/{lon1},{lat1};{lon2},{lat2};{lon3},{lat3}?overview=full&geometries=polyline

// Example URL for 3 stops:
// https://router.project-osrm.org/route/v1/driving/13.388,52.517;13.397,52.529;13.428,52.523?overview=full&geometries=polyline

// Response shape:
// {
//   "code": "Ok",
//   "routes": [{
//     "geometry": "encoded_polyline_string",
//     "distance": 12345.6,    // total meters
//     "duration": 678.9,      // total seconds
//     "legs": [
//       { "distance": 5000.0, "duration": 300.0 },  // leg 1
//       { "distance": 7345.6, "duration": 378.9 }   // leg 2
//     ]
//   }],
//   "waypoints": [...]
// }
```

### Overpass POI Query (Backend)
```javascript
// Source: wiki.openstreetmap.org/wiki/Overpass_API
// Query all restaurants, tourist attractions, and parks within 5km of a point

const query = `
[out:json][timeout:25];
(
  nwr["amenity"~"restaurant|cafe|bar|fast_food"](around:5000,48.8566,2.3522);
  nwr["tourism"~"attraction|museum|viewpoint|hotel|camp_site"](around:5000,48.8566,2.3522);
  nwr["leisure"~"park|nature_reserve"](around:5000,48.8566,2.3522);
);
out center tags;
`;
// POST to https://overpass-api.de/api/interpreter
// with body: data=<url-encoded-query>
```

### TripMap Component Structure (Frontend)
```jsx
// frontend/src/components/TripMap.jsx
import { MapContainer, TileLayer } from 'react-leaflet';
import TripMapController from './TripMapController';
import StopMarker from './StopMarker';
import RoutePolyline from './RoutePolyline';

export default function TripMap({ stops, routeGeometry, onStopClick }) {
  const defaultCenter = [51.505, -0.09];

  return (
    <MapContainer
      center={defaultCenter}
      zoom={5}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <TripMapController stops={stops} />
      {routeGeometry && <RoutePolyline geometry={routeGeometry} />}
      {stops.map((stop, index) => (
        <StopMarker
          key={stop.id}
          stop={stop}
          number={index + 1}
          onClick={() => onStopClick(stop)}
        />
      ))}
    </MapContainer>
  );
}
```

### POI Search Term to OSM Tag Mapping
```javascript
// Map user-friendly search terms to Overpass tag filters
const SEARCH_TERM_MAP = {
  'restaurants': '["amenity"="restaurant"]',
  'coffee shops': '["amenity"="cafe"]',
  'bars': '["amenity"="bar"]',
  'hotels': '["tourism"~"hotel|motel"]',
  'camping': '["tourism"~"camp_site|caravan_site"]',
  'gas stations': '["amenity"="fuel"]',
  'supermarkets': '["shop"="supermarket"]',
  'hiking trails': '["route"="hiking"]',
  'museums': '["tourism"="museum"]',
  'parks': '["leisure"="park"]',
  'beaches': '["natural"="beach"]',
  'viewpoints': '["tourism"="viewpoint"]',
  'pharmacies': '["amenity"="pharmacy"]',
  'ATMs': '["amenity"="atm"]',
};
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| OSRM public demo as primary | Self-hosted OSRM via Docker | Ongoing (demo unreliable since 2024) | Must plan for fallback |
| Google-encoded polyline only | OSRM supports polyline, polyline6, GeoJSON | v5.x | Use default polyline for simplicity |
| Leaflet Routing Machine for everything | Direct OSRM API + react-leaflet Polyline | Community consensus 2024+ | More control, less bundle size |
| Mapbox/Google for POIs | Overpass API (free, OSM-native) | Always for free-tier | No API key needed, rate-limited |

## Open Questions

1. **OSRM Hosting Strategy**
   - What we know: Public server unreliable; self-hosted requires OSM data preprocessing
   - What's unclear: Whether Docker is available in dev environment (not found on this machine)
   - Recommendation: Use public server with error handling; add OSRM Docker config as optional enhancement. Full Docker setup can be finalized in Phase 4.

2. **POI-02 "Images and Ratings"**
   - What we know: OSM does NOT store ratings. Images are sparse (wikimedia_commons tag coverage ~5-10% of POIs).
   - What's unclear: Whether the user expects external image/rating sources
   - Recommendation: Show available OSM metadata (name, category, cuisine, opening hours, website). Display wikimedia_commons images when available. Use category icons as fallback. Note "ratings" limitation in plan -- OSM has `stars` tag for some hotels but no general rating system.

3. **POI Search Granularity (POI-03)**
   - What we know: Overpass supports exact tag matching and regex
   - What's unclear: How free-form the search should be (dropdown of categories vs. text input)
   - Recommendation: Offer a dropdown of common POI categories (mapped to OSM tags) plus a free-text search that maps to the closest OSM tag. Start with 12-15 predefined categories.

## Sources

### Primary (HIGH confidence)
- [OSRM HTTP API v5.24.0](https://project-osrm.org/docs/v5.24.0/api/) - Route service parameters, response format, Table service
- [Overpass API Wiki](https://wiki.openstreetmap.org/wiki/Overpass_API) - Query language, around filter, output formats
- [Overpass API by Example](https://wiki.openstreetmap.org/wiki/Overpass_API/Overpass_API_by_Example) - POI query patterns
- [react-leaflet docs](https://react-leaflet.js.org/) - MapContainer, Polyline, useMap, component API
- [@mapbox/polyline npm](https://www.npmjs.com/package/@mapbox/polyline) - v1.2.1, polyline decode/encode
- [OSM Key:image Wiki](https://wiki.openstreetmap.org/wiki/Key:image) - Image tag coverage and limitations
- [OSM Key:wikimedia_commons Wiki](https://wiki.openstreetmap.org/wiki/Key:wikimedia_commons) - Wikimedia image linking

### Secondary (MEDIUM confidence)
- [OSRM Docker Hub](https://hub.docker.com/r/osrm/osrm-backend/) - Docker setup, data preprocessing steps
- [OSRM GitHub Issues #1873](https://github.com/Project-OSRM/osrm-backend/issues/1873) - Public demo server reliability issues
- [Leaflet fitBounds patterns](https://react-leaflet.js.org/docs/example-view-bounds/) - Auto-zoom implementation

### Tertiary (LOW confidence)
- [Overpass rate limiting behavior](https://github.com/drolbr/Overpass-API/issues/333) - Slot-based system, 429 handling

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - leaflet/react-leaflet already installed, @mapbox/polyline verified on npm
- Architecture: HIGH - OSRM API well-documented, Overpass query patterns established
- OSRM hosting: MEDIUM - Public server unreliable, Docker setup well-documented but adds complexity
- POI data completeness: MEDIUM - OSM data confirmed to lack ratings; image coverage sparse but documented
- Pitfalls: HIGH - Coordinate order, rate limiting, MapContainer immutability are well-known issues

**Research date:** 2026-04-05
**Valid until:** 2026-05-05 (stable domain, APIs unchanged for years)
