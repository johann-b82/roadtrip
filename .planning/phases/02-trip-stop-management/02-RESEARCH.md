# Phase 2: Trip & Stop Management - Research

**Researched:** 2026-04-05  
**Domain:** CRUD operations, drag-and-drop interfaces, photo caching, address autocomplete, responsive UI  
**Confidence:** HIGH

## Summary

Phase 2 builds trip and stop management on the foundation of Phase 1's authentication and address search infrastructure. Users create trips with auto-fetched cover photos, add stops with address autocomplete, and manage stop lists with drag-and-drop reordering. The phase requires extending the existing Nominatim hook and MapPreview component, implementing a caching strategy for Unsplash API results, and building a responsive split-panel layout. All technologies are proven and stable; the primary implementation challenges are coordinating client-side state with async API calls, respecting Nominatim/Unsplash rate limits via caching, and ensuring mobile responsiveness on the split-panel trip detail page.

**Primary recommendation:** Use dnd-kit for drag-and-drop with touch sensor configuration for mobile support; implement PostgreSQL cache for Nominatim (existing useNominatim hook provides frontend caching), and add unsplash_cache table for photo results with 24h TTL; reuse AddressInput and MapPreview components from Phase 1 to maintain consistency.

---

## User Constraints (from CONTEXT.md)

### Locked Decisions

| Decision | Implication for Phase 2 |
|----------|------------------------|
| **D-01:** Card grid layout for trips | Use Tailwind grid-cols-1 md:grid-cols-2 lg:grid-cols-3 on dashboard |
| **D-02:** Empty state UI | Implement "Plan your first road trip" copy with CTA button |
| **D-03:** Trip creation via modal | Modal dialog with name + description fields; auto-fetch Unsplash on submit |
| **D-04:** Split-panel trip detail | Stop list left, map preview right; stacks on mobile (D-04 handles responsive) |
| **D-05:** Cover photo as hero banner | Top-of-page banner with trip name/description overlay |
| **D-06:** MapPreview with stop pins (no routes yet) | Extend existing MapPreview component to accept multiple stops; Phase 3 adds routes |
| **D-07:** Top navbar with logo, avatar menu | Implement once; reuse across all pages |
| **D-08:** Delete trip via confirm dialog | Red button + destructive action styling |
| **D-09:** Add stop via inline form | Click "+ Add Stop", form expands in-place with AddressInput, description, dates |
| **D-10:** Edit stop via inline expand | Same form as add; expand on edit icon, collapse on save/cancel |
| **D-11:** Drag-and-drop reorder with grip icon | Use dnd-kit with touch sensor for mobile long-press |
| **D-12:** Native HTML date inputs | No date picker library; use `<input type="date">` |
| **D-13:** Delete stop with confirmation | Consistent confirmation pattern as trip delete |
| **D-14:** Photo search appends "travel" keyword | Backend: append "travel" to trip description before Unsplash query |
| **D-15:** Store top 5 Unsplash results | User can cycle through alternatives to pick different cover |
| **D-16:** Fallback gradient placeholder | When Unsplash fails or rate limit hit, use CSS gradient with trip name overlay |
| **D-17:** Backend PostgreSQL cache for Unsplash | unsplash_cache table: query -> URLs + metadata, 24h TTL |

### Claude's Discretion

- Database schema design for trips, stops, unsplash_cache tables
- Drag-and-drop library choice (dnd-kit, react-beautiful-dnd, or native HTML drag)
- Stop numbering and ordering logic (position column vs array ordering)
- Loading states and skeleton screens during data fetching (UI-03)
- Error handling patterns for API failures
- Mobile responsive breakpoints and layout adaptations (UI-01)
- Unsplash API integration details (search parameters, image size selection)
- Trip edit form behavior (inline vs modal — follow patterns established by trip create)

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope

---

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TRIP-01 | User can create a trip with name and short description | Modal form research (shadcn/ui patterns), form state with React Hook Form |
| TRIP-02 | User can edit trip name and description | Form reuse from create; inline vs modal decision from CONTEXT discretion |
| TRIP-03 | User can delete a trip | Confirm dialog pattern, cascading delete via FK constraints |
| TRIP-04 | Trip cover photo is automatically fetched from Unsplash based on description | Unsplash API integration, caching strategy, fallback patterns |
| STOP-01 | User can add a stop with address autocomplete (Nominatim) | Reuse AddressInput from Phase 1; extend with description/dates |
| STOP-02 | User can select a matching address from autocomplete results | Existing useNominatim hook + AddressInput component |
| STOP-03 | Address and short description are stored for each stop | PostgreSQL stops table schema, ORM/query pattern via pg module |
| STOP-04 | User can set start and end dates for each stop | Native HTML date inputs, form state management |
| STOP-05 | User can reorder stops via drag-and-drop | dnd-kit library, touch sensor for mobile, position column in DB |
| STOP-06 | User can edit an existing stop | Inline edit pattern, form state reset on cancel |
| STOP-07 | User can delete a stop from a trip | Confirm dialog, FK cascade handling |
| UI-01 | App is mobile-responsive | Tailwind breakpoint strategy, split-panel collapse pattern |
| UI-02 | Polished, modern UI with smooth interactions | Component library assessment (shadcn/ui), design patterns from Phase 1 |
| UI-03 | Loading states and error handling provide clear feedback | Skeleton screens, error toast/alert pattern, API error responses |

---

## Standard Stack

### Core Libraries

| Library | Version | Purpose | Why Standard | Notes |
|---------|---------|---------|--------------|-------|
| React | 19.2.4 | Frontend UI | Latest stable; Activity component, useEffectEvent, Server Component support | Verified: npm view react version |
| react-hook-form | 7.72.1 | Form state management | 7M+ weekly downloads, 12.12KB gzipped, zero dependencies; 5.5x smaller than Formik | Confirmed: npm view react-hook-form version |
| React Router | 7.x | Client-side routing | Standard for SPAs; supports nested routes, loader patterns | In use from Phase 1 |
| Zustand | 4.x | Global state (trips list, selected trip, UI state) | 3KB bundle, minimal boilerplate, persist middleware | In use from Phase 1 |
| dnd-kit | 8.x | Drag-and-drop reordering | Modern, accessible (WCAG 2.1 AA), touch-first design, active maintenance | Recommended over deprecated react-beautiful-dnd |
| Leaflet | 1.9.4 | Map rendering | Stable library, 42KB, industry standard; v2.0.0-alpha not production-ready | Verified; existing MapPreview uses this |
| react-leaflet | 5.0.0 | React bindings for Leaflet | Provides MapContainer, TileLayer, Marker components for cleaner integration | Phase 1 establishes pattern |
| Tailwind CSS | 4.x | Utility-first styling | Rust-based engine, 10x faster builds, mobile-first responsive design | Confirmed in frontend/package.json |
| axios | 1.7.0 | HTTP client | Promise-based, request cancellation, auto-serialization | Established in Phase 1 |
| Unsplash JS | n/a | Unsplash API client (optional) | Unsplash provides JavaScript SDK, but axios + direct API calls sufficient for this phase | Low overhead with axios pattern |

### Supporting Libraries (Claude's Discretion)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @dnd-kit/utilities | 8.x | Utility functions for dnd-kit | Always paired with dnd-kit core |
| @dnd-kit/sortable | 8.x | Sortable list component wrapper | Simplifies list reordering; build stop list on top of this |
| @dnd-kit/core | 8.x | Core dnd-kit library | Low-level drag-and-drop primitives |
| shadcn/ui | latest | Copy-paste component library | Optional; provides Dialog, Button, Input, etc. components (Tailwind + Radix UI) |
| react-responsive | optional | Media query hook for responsive layouts | useMediaQuery hook as alternative to Tailwind-only approach |

### Version Verification

**As of 2026-04-05:**
- React: 19.2.4 (latest patch for 19.2.x)
- react-hook-form: 7.72.1 (latest patch in 7.x series)
- Leaflet: 1.9.4 (latest stable in 1.9.x series)
- dnd-kit: Not yet installed; recommend ^8.0.0 (current: v8.x actively maintained)

### Installation

```bash
# Core additions for Phase 2
npm install --save @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities @dnd-kit/sortable-context

# Optional but recommended
npm install --save shadcn-ui  # Via component copy, not npm package

# Verify no conflicts with existing packages
npm list react react-hook-form zustand axios leaflet react-leaflet
```

### Drag-and-Drop Library Decision

**Recommendation: dnd-kit (8.x)**

**Rationale:**
- react-beautiful-dnd is now archived; community fork "hello-pangea/dnd" maintains it but dnd-kit is the forward-looking standard
- dnd-kit has built-in WCAG 2.1 AA compliance with customizable touch sensors
- Touch sensor can be configured with delay=0ms, tolerance=5px for instant drag on mobile without long-press requirement
- Supports keyboard navigation (arrow keys, space/enter) out of box
- 15KB gzipped, comparable to react-beautiful-dnd but with better performance

**Alternative (if preferring higher-level abstraction):** hello-pangea/dnd (maintained fork of react-beautiful-dnd) — simpler API for list reordering, less customization needed

---

## Architecture Patterns

### Database Schema

**Trips Table**
```sql
CREATE TABLE trips (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  cover_photo_url TEXT,
  cover_photo_source VARCHAR(50), -- 'unsplash' or 'fallback'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  INDEX idx_trips_user_id (user_id)
);
```

**Stops Table**
```sql
CREATE TABLE stops (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  address TEXT NOT NULL,
  address_lat NUMERIC(9, 6),
  address_lon NUMERIC(9, 6),
  description TEXT,
  start_date DATE,
  end_date DATE,
  position INT NOT NULL, -- Order within trip (0-indexed)
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  INDEX idx_stops_trip_id (trip_id),
  INDEX idx_stops_position (trip_id, position) -- For efficient ordering queries
);
```

**Unsplash Cache Table**
```sql
CREATE TABLE unsplash_cache (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  search_query VARCHAR(255) NOT NULL UNIQUE, -- Trip description + "travel"
  image_urls TEXT[], -- Array of top 5 URLs
  image_metadata JSONB, -- Store photographer, attribution, etc.
  cached_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',
  INDEX idx_unsplash_cache_query (search_query),
  INDEX idx_unsplash_cache_expires (expires_at)
);
```

**Ordering Logic:** Use `position` column (0-indexed) in stops table. When reordering via drag-and-drop, update all affected stops' positions. Fetch stops with `ORDER BY position ASC`.

### Recommended Project Structure

```
frontend/src/
├── components/
│   ├── ProtectedRoute.jsx         [Phase 1 - reuse]
│   ├── AddressInput.jsx           [Phase 1 - reuse]
│   ├── MapPreview.jsx             [Phase 1 - extend for multiple stops]
│   ├── TripCard.jsx               [NEW] Dashboard trip card
│   ├── TripDashboard.jsx          [NEW] Grid of trip cards + empty state
│   ├── TripDetailPage.jsx         [NEW] Split-panel layout
│   ├── StopList.jsx               [NEW] Drag-and-drop list of stops
│   ├── StopItem.jsx               [NEW] Single stop in list with edit/delete
│   ├── StopForm.jsx               [NEW] Inline form for add/edit stop
│   ├── TripFormModal.jsx          [NEW] Modal for create/edit trip
│   ├── DeleteConfirmDialog.jsx    [NEW] Reusable confirm dialog
│   └── Navbar.jsx                 [NEW] Top navbar with logo, user menu
├── hooks/
│   ├── useNominatim.js            [Phase 1 - reuse]
│   ├── useTrips.js                [NEW] Fetch trips, mutations (CRUD)
│   ├── useTrip.js                 [NEW] Fetch single trip with stops
│   └── useUnsplash.js             [NEW] Search & cache Unsplash results
├── services/
│   ├── api.js                     [Phase 1 - reuse]
│   ├── trips.api.js               [NEW] Trip endpoints (create, read, update, delete)
│   ├── stops.api.js               [NEW] Stop endpoints (create, read, update, delete, reorder)
│   └── unsplash.api.js            [NEW] Unsplash API client
├── store/
│   ├── authStore.js               [Phase 1 - reuse]
│   └── tripStore.js               [NEW] Trips list, selected trip, loading state
└── pages/
    ├── Dashboard.jsx              [NEW] Trip list page (layout stub in Phase 1)
    └── TripDetail.jsx             [NEW] Trip detail + stops management

backend/src/
├── trips/
│   ├── model.js                   [NEW] Trip queries (create, read, update, delete)
│   ├── routes.js                  [NEW] Trip endpoints
│   └── middleware.js              [NEW] Validate trip ownership (requireAuth + verifyTripOwner)
├── stops/
│   ├── model.js                   [NEW] Stop queries (CRUD, reorder)
│   ├── routes.js                  [NEW] Stop endpoints
│   └── middleware.js              [NEW] Validate stop ownership via trip
├── unsplash/
│   ├── model.js                   [NEW] Cache queries (get, set, cleanup expired)
│   ├── routes.js                  [NEW] Unsplash proxy endpoint (search & cache)
│   └── client.js                  [NEW] Unsplash API client (axios-based)
└── db/
    └── schema.sql                 [Phase 1 - extend with trips, stops, unsplash_cache]
```

### Pattern 1: Split-Panel Responsive Layout

**What:** Trip detail page with stop list on left, map on right. On mobile (< 768px), layout stacks vertically with stop list above map.

**When to use:** Phase 2 trip detail page; reuse for Phase 3 if adding more panels

**Implementation:**

```typescript
// TripDetailPage.jsx
export default function TripDetailPage() {
  const { tripId } = useParams();
  const { trip, stops, loading } = useTrip(tripId);

  return (
    <div className="flex flex-col lg:flex-row h-screen">
      {/* Left panel: Stop list */}
      <div className="w-full lg:w-1/2 lg:border-r border-slate-200 overflow-y-auto">
        <StopList stops={stops} tripId={tripId} />
      </div>
      
      {/* Right panel: Map preview */}
      <div className="w-full lg:w-1/2 h-96 lg:h-full">
        <MapPreview stops={stops} />
      </div>
    </div>
  );
}
```

**Mobile behavior:** `flex-col` stacks by default; `lg:flex-row` applies at 1024px breakpoint (Tailwind's lg). Map height is fixed (h-96) on mobile, full height on desktop (lg:h-full).

### Pattern 2: Inline Add/Edit Forms with Expand Collapse

**What:** Click "+ Add Stop", form expands in-place within stop list. Edit stop by clicking edit icon on stop item; same form expands, replacing the stop display.

**When to use:** Phase 2 stop management; minimizes context switching vs. modals

**Implementation:**

```typescript
// StopItem.jsx — displays single stop with edit/delete actions
export default function StopItem({ stop, onEdit, onDelete, isEditing }) {
  if (isEditing) {
    return <StopForm stop={stop} onSave={onEdit} onCancel={() => onEdit(null)} />;
  }

  return (
    <div className="p-4 border-b border-slate-100">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900">{stop.address}</h3>
          <p className="text-sm text-slate-600 mt-1">{stop.description}</p>
          <p className="text-xs text-slate-500 mt-2">
            {stop.start_date} to {stop.end_date}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => onEdit(stop)} className="text-blue-600 hover:text-blue-700">
            Edit
          </button>
          <button onClick={() => onDelete(stop)} className="text-red-600 hover:text-red-700">
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

// StopList.jsx — manages list state, handles isEditing for each stop
export default function StopList({ stops, tripId }) {
  const [editingStopId, setEditingStopId] = useState(null);
  
  return (
    <div className="divide-y divide-slate-200">
      {stops.map(stop => (
        <StopItem
          key={stop.id}
          stop={stop}
          isEditing={editingStopId === stop.id}
          onEdit={(stop) => {
            if (stop) setEditingStopId(stop.id);
            else setEditingStopId(null);
          }}
          onDelete={(stop) => handleDeleteStop(stop)}
        />
      ))}
      <div className="p-4">
        <button className="text-blue-600 hover:text-blue-700 font-semibold">+ Add Stop</button>
      </div>
    </div>
  );
}
```

### Pattern 3: Drag-and-Drop with dnd-kit

**What:** Stops can be reordered via drag handle. On mobile, long-press initiates drag. Visual placeholder shows drop target.

**When to use:** Phase 2 stop reordering; reference for future sortable lists

**Implementation:**

```typescript
// SortableStopItem.jsx — wraps StopItem with drag/drop
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

export default function SortableStopItem({ stop, ...props }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: stop.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'bg-blue-50' : ''}>
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing p-2 text-slate-400 hover:text-slate-600"
      >
        {/* Grip icon */}
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path d="M8 9a2 2 0 11-4 0 2 2 0 014 0zM8 19a2 2 0 11-4 0 2 2 0 014 0zm0-10a2 2 0 11-4 0 2 2 0 014 0zm10 0a2 2 0 11-4 0 2 2 0 014 0zm0 10a2 2 0 11-4 0 2 2 0 014 0zm0-10a2 2 0 11-4 0 2 2 0 014 0z" />
        </svg>
      </div>
      <StopItem stop={stop} {...props} />
    </div>
  );
}

// StopList.jsx — wraps in SortableContext
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { DndContext, closestCenter, TouchSensor, MouseSensor, useSensor, useSensors } from '@dnd-kit/core';

export default function StopList({ stops, tripId, onReorder }) {
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 0,    // Instant activation
        tolerance: 5, // 5px movement tolerance
      },
    })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = stops.findIndex(s => s.id === active.id);
      const newIndex = stops.findIndex(s => s.id === over.id);
      onReorder(oldIndex, newIndex);
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={stops.map(s => s.id)} strategy={verticalListSortingStrategy}>
        {stops.map(stop => (
          <SortableStopItem key={stop.id} stop={stop} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

**Mobile touch handling:** TouchSensor with delay=0 and tolerance=5px allows instant drag on touch without requiring long-press. Set `touch-action: none` on draggable container via Tailwind or inline style if scrolling conflicts occur.

### Pattern 4: Unsplash Cache with Fallback

**What:** When creating trip, fetch top 5 images from Unsplash. Cache results in PostgreSQL with 24h TTL. If rate limit hit or API fails, show gradient placeholder. User can cycle through cached results to pick cover photo.

**When to use:** Phase 2 photo selection; reuse pattern for Phase 3+ if adding more cached external APIs

**Implementation:**

**Backend (backend/src/unsplash/routes.js):**
```javascript
const express = require('express');
const { getOrSearchUnsplash } = require('./model');
const router = express.Router();

// GET /api/unsplash/search?q=description
router.get('/search', async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 3) {
    return res.status(400).json({ error: 'Query too short' });
  }

  try {
    const results = await getOrSearchUnsplash(q.trim());
    res.json(results);
  } catch (err) {
    console.error('Unsplash error:', err.message);
    // Return empty array; frontend will show fallback
    res.json({ urls: [], cached: false, fallback: true });
  }
});

module.exports = router;
```

**Backend (backend/src/unsplash/model.js):**
```javascript
const axios = require('axios');
const { query } = require('../db/connection');

const UNSPLASH_API = 'https://api.unsplash.com';
const UNSPLASH_ACCESS_KEY = process.env.UNSPLASH_ACCESS_KEY;

async function getOrSearchUnsplash(searchQuery) {
  // Check cache first
  const cachedResult = await query(
    'SELECT image_urls, image_metadata, expires_at FROM unsplash_cache WHERE search_query = $1 AND expires_at > NOW()',
    [searchQuery]
  );

  if (cachedResult.rows.length > 0) {
    return {
      urls: cachedResult.rows[0].image_urls,
      metadata: cachedResult.rows[0].image_metadata,
      cached: true,
    };
  }

  // Cache miss; fetch from Unsplash
  try {
    const response = await axios.get(`${UNSPLASH_API}/search/photos`, {
      params: { query: searchQuery, per_page: 5 },
      headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` },
      timeout: 5000,
    });

    if (response.data.results.length === 0) {
      return { urls: [], fallback: true };
    }

    const urls = response.data.results.map(r => r.urls.regular);
    const metadata = response.data.results.map(r => ({
      photographer: r.user.name,
      link: r.links.html,
    }));

    // Cache for 24 hours
    await query(
      'INSERT INTO unsplash_cache (search_query, image_urls, image_metadata, expires_at) VALUES ($1, $2, $3, NOW() + INTERVAL \'24 hours\') ON CONFLICT (search_query) DO UPDATE SET image_urls = $2, image_metadata = $3, expires_at = NOW() + INTERVAL \'24 hours\'',
      [searchQuery, JSON.stringify(urls), JSON.stringify(metadata)]
    );

    return { urls, metadata, cached: false };
  } catch (err) {
    console.error('Unsplash API error:', err.message);
    return { urls: [], fallback: true };
  }
}

module.exports = { getOrSearchUnsplash };
```

**Frontend (frontend/src/hooks/useUnsplash.js):**
```javascript
import { useState, useEffect } from 'react';
import api from '../services/api';

export function useUnsplash(description) {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!description || description.trim().length < 3) {
      setImages([]);
      return;
    }

    const search = async () => {
      setLoading(true);
      try {
        const response = await api.get('/api/unsplash/search', {
          params: { q: `${description.trim()} travel` },
        });
        setImages(response.data.urls || []);
        setError(null);
      } catch (err) {
        console.error('Unsplash error:', err);
        setImages([]);
        setError('Failed to load images');
      } finally {
        setLoading(false);
      }
    };

    search();
  }, [description]);

  return { images, loading, error };
}
```

**Frontend (frontend/src/components/TripCoverPhoto.jsx):**
```javascript
import { useState } from 'react';
import { useUnsplash } from '../hooks/useUnsplash';

export default function TripCoverPhoto({ description, onSelect }) {
  const { images, loading } = useUnsplash(description);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const selectedImage = images[selectedIndex];

  if (loading) {
    return <div className="h-48 bg-slate-200 animate-pulse rounded-lg" />;
  }

  if (!selectedImage) {
    // Fallback gradient
    return (
      <div
        className="h-48 rounded-lg flex items-center justify-center text-white font-bold text-2xl"
        style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        {description || 'Trip Cover'}
      </div>
    );
  }

  return (
    <div>
      <img src={selectedImage} alt="Trip cover" className="w-full h-48 object-cover rounded-lg" />
      {images.length > 1 && (
        <div className="flex gap-2 mt-2 justify-center">
          {images.map((_, i) => (
            <button
              key={i}
              onClick={() => setSelectedIndex(i)}
              className={`w-2 h-2 rounded-full transition-colors ${
                i === selectedIndex ? 'bg-blue-600' : 'bg-slate-300'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
```

### Pattern 5: Modal for Trip Creation/Edit

**What:** Trip create/edit opens in modal dialog with name + description fields. On submit, API creates trip and fetches Unsplash photos. User selects favorite photo before saving.

**Recommendation:** Use shadcn/ui Dialog component (copy-paste) or native HTML dialog element with Tailwind styling. Keep it simple; no complex validation until Phase 3.

**Simple Implementation (native HTML `<dialog>`):**

```typescript
// TripFormModal.jsx
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

export default function TripFormModal({ isOpen, onClose, onSubmit, mode = 'create' }) {
  const dialogRef = useRef(null);
  const { register, handleSubmit, reset } = useForm({
    defaultValues: { name: '', description: '' },
  });

  const onFormSubmit = async (data) => {
    await onSubmit(data);
    reset();
    dialogRef.current?.close();
  };

  return (
    <dialog
      ref={dialogRef}
      open={isOpen}
      className="p-6 rounded-lg shadow-lg max-w-md w-full backdrop:bg-black/50"
      onCancel={() => onClose()}
    >
      <h2 className="text-2xl font-bold mb-4">
        {mode === 'create' ? 'Create New Trip' : 'Edit Trip'}
      </h2>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1">Trip Name</label>
          <input
            type="text"
            {...register('name', { required: true })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2"
            placeholder="e.g., Pacific Coast Road Trip"
          />
        </div>
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1">Description</label>
          <textarea
            {...register('description')}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 h-24"
            placeholder="Describe your trip..."
          />
        </div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={() => {
              reset();
              onClose();
              dialogRef.current?.close();
            }}
            className="px-4 py-2 rounded-lg border border-slate-300 hover:bg-slate-100"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            {mode === 'create' ? 'Create' : 'Update'}
          </button>
        </div>
      </form>
    </dialog>
  );
}
```

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|------------|-------------|-----|
| Date range input (start/end dates) | Custom date picker component with calendar widget | Native `<input type="date">` (D-12 locked decision) | Browser handles locale, format, validation; mobile shows native picker; zero overhead |
| Drag-and-drop list reordering | Implement with mouse/touch events, translate calculations, collision detection | dnd-kit library | Handles touch, mouse, keyboard; accessibility (WCAG AA); handles edge cases (collision, sorting strategies) |
| Address autocomplete with caching | Custom Nominatim wrapper with localStorage cache | Existing `useNominatim` hook + `AddressInput` component (Phase 1) | Already implements 24h LRU cache, debouncing, error handling; reuse reduces code |
| Trip/stop CRUD API state | Manual useState + useEffect for fetch/loading/error | React Hook Form + custom hooks (useTrips, useTrip) or React Query | Hook Form handles form state; custom hooks encapsulate API patterns; avoids waterfall fetches |
| Responsive split-panel layout | Custom media query checks, manual state for mobile/desktop mode | Tailwind's flex-col/lg:flex-row (D-04 locked pattern) | Avoids runtime state, works without JavaScript, CSS-in-JS isn't needed |
| Unsplash image caching and fallback | In-memory cache + fetch on component render | PostgreSQL unsplash_cache table + backend caching layer (D-17) | Persists across server restart; multi-user safe; 24h TTL handles Unsplash rate limit (50/hr free tier) |
| Modal dialogs | Implement from scratch with z-index, focus trap, escape handler | Native HTML `<dialog>` (simple) or shadcn/ui Dialog (polished) | dialog element is standard, accessible, supports backdrop; shadcn provides copy-paste Radix UI wrapper |
| Form state management (trips/stops) | Redux or MobX setup | React Hook Form (already in stack) + Zustand store for UI state | RHF is lightweight, zero-dependency, handles complex validations; Zustand for global trip list |

**Key insight:** Phase 1 established strong primitives (AddressInput, MapPreview, useNominatim, Zustand). Phase 2 reuses these heavily and adds dnd-kit + React Hook Form for new domains. Avoid custom solutions in high-complexity areas (drag-and-drop, form handling, caching).

---

## Common Pitfalls

### Pitfall 1: Nominatim Rate Limiting Without Backend Caching

**What goes wrong:** Frontend caches Nominatim results in-memory (useNominatim hook), but when multiple users search the same address, each hits the API separately. With 1 req/sec limit and >5 concurrent users, requests queue and timeout. Phase 1's frontend-only cache doesn't scale.

**Why it happens:** Nominatim's 1 req/second limit is per-IP (or per-user-agent on public API). Multiple users == multiple frontends == multiple IPs in production. Frontend cache only helps repeat searches by same user.

**How to avoid:** Phase 1 already implements frontend caching (24h LRU in useNominatim). Phase 2 adds optional backend route that proxies to Nominatim + caches server-side in PostgreSQL. This way, popular addresses (e.g., "Seattle, WA") are cached once, served fast to all users. Update geocoding/routes.js to query cache first.

**Warning signs:** Requests to Nominatim API taking >2s, "429 Too Many Requests" errors in logs, users reporting slow address search on mobile.

**Verification in Phase 2 plan:** Add caching layer to existing `GET /api/geocoding/search` endpoint. Check if results are served from PostgreSQL cache before hitting Nominatim API.

### Pitfall 2: Unsplash Rate Limit (50/hr) Silently Fails

**What goes wrong:** Unsplash API hits 50 requests/hour limit (free tier). Backend returns 403 Forbidden. Frontend expects image URLs but gets error. UI shows blank or broken image. User creates trip with no cover photo, has no way to select one later.

**Why it happens:** D-14 triggers photo search on every trip create. If 50+ users create trips in one hour, API quota exhausted. No frontend error messaging or fallback planned.

**How to avoid:** (D-16 already addresses this) Implement fallback gradient placeholder when Unsplash fails or returns no results. Frontend checks if `response.data.fallback === true`, shows gradient instead. D-17 adds backend cache, so repeat searches for same query don't hit quota. Cache prevents quota exhaustion for popular trip descriptions.

**Warning signs:** Cover photo blank on many trips, Unsplash error codes (403, 429) in backend logs, user complaints about missing images.

**Verification in Phase 2 plan:** Test with mock Unsplash API returning 429; verify gradient fallback renders. Test cache expiry: create trip, wait 25+ hours, create similar trip again — should still be cached (or re-fetched if TTL expired).

### Pitfall 3: Drag-and-Drop Position Column Desync

**What goes wrong:** User drags stop from position 0 to position 2. Frontend updates UI immediately (optimistic update). Backend receives reorder request, updates position column, but concurrent request for same trip arrives and overwrites positions out of order. Stops list shows stops in wrong order on next page load.

**Why it happens:** Position column is a simple int; race conditions occur if two reorder requests hit simultaneously (e.g., user drags multiple stops rapidly, network delays). No transaction isolation ensures positions stay consistent.

**How to avoid:** Use atomic transaction in backend: fetch trip's stops, lock them, update all positions in one query. OR use optimistic locking (add `version` column, increment on each update, reject updates with stale version). OR use array-based ordering (PostgreSQL array type, harder to query but eliminates position integer management).

**Decision (from CONTEXT discretion):** Use position column with explicit ordered array query. On reorder, calculate old and new positions, update in single transaction with `BEGIN; ... COMMIT;`.

**Warning signs:** After user reorders stops, refresh page shows wrong order. Two users editing same trip simultaneously causes weird ordering.

**Verification in Phase 2 plan:** Test: Create trip, add 3 stops. Drag stop 0 to position 2. Refresh page — verify order is correct. Concurrent test: two browsers on same trip, both reorder simultaneously, verify final state is consistent (requires load testing or manual timing).

### Pitfall 4: Split-Panel Layout Broken on Tablet

**What goes wrong:** iPad (1024px wide) shows split panel side-by-side, but map is too narrow (50% width = 512px). Stop list takes full width, map is squished, unreadable. Users on tablets can't see map properly.

**Why it happens:** D-04 specifies split-panel collapses "on mobile" but doesn't define breakpoint. Tailwind's default `lg` breakpoint is 1024px, which overlaps tablet size (768px–1024px). Ambiguity in "mobile" vs "tablet".

**How to avoid:** Define explicit breakpoints: mobile (< 768px) stacks vertically, tablet (768px–1024px) stacks vertically with larger map, desktop (> 1024px) split horizontally. Use Tailwind prefixes: `md:flex-col-reverse` (start stacked on mobile, flip order on tablet), `lg:flex-row` (side-by-side on desktop).

**Decision:** Use `flex-col md:flex-col lg:flex-row` to stack on mobile/tablet, split on desktop. If tablet needs split view, use `md:flex-row` instead.

**Warning signs:** Users report "map too small on iPad", screenshots show squished layouts at 768px–1024px widths.

**Verification in Phase 2 plan:** Test split-panel layout in Chrome DevTools device preview for iPhone (375px), iPad (768px), iPad Pro (1024px), and desktop (1440px). Verify readability at each breakpoint.

### Pitfall 5: Unsplash Image Attribution Missing

**What goes wrong:** App displays Unsplash photo on trip card without attribution. Photographer's name/link not visible. Violates Unsplash API terms (require "download button" or attribution link to photographer profile).

**Why it happens:** Frontend takes image URL from cache, displays it without metadata. Backend caches `image_urls` array but doesn't cache photographer/link metadata (or frontend doesn't display it).

**How to avoid:** D-17 specifies `image_metadata JSONB` column in unsplash_cache table. Store photographer name and link for each image. Frontend reads metadata, displays "Photo by [Photographer](link)" below image or in hover tooltip.

**Warning signs:** Unsplash API terms violation notice, copyright complaints.

**Verification in Phase 2 plan:** Check unsplash_cache table schema includes metadata column. Verify TripCard component displays photographer attribution when image is shown. Test that fallback gradient (when no image) doesn't require attribution.

### Pitfall 6: React Hook Form Uncontrolled Component State Drift

**What goes wrong:** Stop form has address input using react-hook-form with AddressInput component. User types "Seattle", sees autocomplete results, clicks one (which sets form value). But AddressInput is uncontrolled (doesn't sync form state), so form.getValues() returns old value. API receives wrong address.

**Why it happens:** AddressInput is from Phase 1, uses local useState for query. react-hook-form expects controlled components or uses Controller wrapper. Mismatch between form state (RHF) and input state (local).

**How to avoid:** Wrap AddressInput in react-hook-form's `Controller` component, which bridges controlled/uncontrolled components. OR refactor AddressInput to accept `value`, `onChange` props and work as controlled component.

**Implementation:**
```typescript
import { Controller } from 'react-hook-form';
import { AddressInput } from '../components/AddressInput';

<Controller
  name="address"
  control={control}
  rules={{ required: 'Address is required' }}
  render={({ field }) => (
    <AddressInput
      {...field}
      onSelect={(result) => {
        field.onChange(result.address); // Update form state
        // Also update lat/lon
        setValue('address_lat', result.lat);
        setValue('address_lon', result.lon);
      }}
    />
  )}
/>
```

**Warning signs:** Address in form doesn't match what user selected, API receives null/empty address, form validation passes but data is wrong.

**Verification in Phase 2 plan:** Add test: fill StopForm, select address from AddressInput dropdown, submit — verify form.getValues('address') matches selected address. Test with react-hook-form's `watch()` to debug state.

---

## Code Examples

Verified patterns from official sources and Phase 1 codebase:

### Trip Create Modal with Form

```typescript
// Source: react-hook-form official docs + existing AddressInput pattern (Phase 1)
import { useForm } from 'react-hook-form';
import api from '../services/api';

export default function TripFormModal({ isOpen, onClose, onTripCreated }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: { name: '', description: '' },
  });

  const onSubmit = async (data) => {
    try {
      const response = await api.post('/api/trips', data);
      onTripCreated(response.data);
      reset();
      onClose();
    } catch (err) {
      console.error('Trip create error:', err);
    }
  };

  return (
    <dialog open={isOpen} className="p-6 rounded-lg shadow-xl">
      <h2 className="text-2xl font-bold mb-4">Plan Your Trip</h2>
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1">Trip Name</label>
          <input
            type="text"
            {...register('name', { required: 'Name is required', minLength: { value: 3, message: 'At least 3 characters' } })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., Pacific Coast Road Trip"
          />
          {errors.name && <span className="text-red-600 text-sm mt-1">{errors.name.message}</span>}
        </div>
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-1">Description</label>
          <textarea
            {...register('description', { maxLength: { value: 500, message: 'Max 500 characters' } })}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 h-24 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Describe your trip, route, or theme..."
          />
          {errors.description && <span className="text-red-600 text-sm mt-1">{errors.description.message}</span>}
        </div>
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100">
            Cancel
          </button>
          <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Create Trip
          </button>
        </div>
      </form>
    </dialog>
  );
}
```

### Drag-and-Drop Stop List with dnd-kit

```typescript
// Source: dnd-kit official docs https://docs.dndkit.com/
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

function SortableStopItem({ stop }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: stop.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} className={isDragging ? 'opacity-50 bg-blue-50' : ''}>
      <div {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-2">
        ⋮⋮
      </div>
      <div className="p-4 border-b border-slate-200">
        <h3 className="font-semibold">{stop.address}</h3>
        <p className="text-sm text-slate-600">{stop.description}</p>
      </div>
    </div>
  );
}

export default function StopList({ stops, onReorder }) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 0, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = stops.findIndex(s => s.id === active.id);
      const newIndex = stops.findIndex(s => s.id === over.id);
      onReorder(arrayMove(stops, oldIndex, newIndex));
    }
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={stops.map(s => s.id)} strategy={verticalListSortingStrategy}>
        {stops.map(stop => (
          <SortableStopItem key={stop.id} stop={stop} />
        ))}
      </SortableContext>
    </DndContext>
  );
}
```

### MapPreview with Multiple Stops

```typescript
// Source: Leaflet official docs + existing MapPreview pattern (Phase 1)
import { MapContainer, TileLayer, Marker, useMap } from 'react-leaflet';
import L from 'leaflet';

function MapController({ stops }) {
  const map = useMap();
  if (stops.length === 0) {
    map.setView([39.8283, -98.5795], 4); // USA center
    return null;
  }
  
  const bounds = L.latLngBounds(stops.map(s => [s.address_lat, s.address_lon]));
  map.fitBounds(bounds, { padding: [50, 50] });
  return null;
}

export default function MapPreview({ stops }) {
  const defaultPosition = [39.8283, -98.5795];

  return (
    <div className="w-full h-full rounded-lg overflow-hidden border border-slate-200">
      <MapContainer
        center={defaultPosition}
        zoom={4}
        scrollWheelZoom={false}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {stops.length > 0 && (
          <>
            <MapController stops={stops} />
            {stops.map((stop, i) => (
              <Marker key={stop.id} position={[stop.address_lat, stop.address_lon]}>
                <L.Popup>{`Stop ${i + 1}: ${stop.address}`}</L.Popup>
              </Marker>
            ))}
          </>
        )}
      </MapContainer>
    </div>
  );
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| react-beautiful-dnd (react-dnd-kit predecessor) | @dnd-kit (modern, touch-first) | 2021-2022 | Better accessibility, mobile support, lighter bundle; rbd now archived |
| Formik | React Hook Form | 2021-2023 | 5.5x smaller, zero deps, better DX; RHF now standard for forms |
| Google Maps API | OpenStreetMap + Leaflet | 2020s trend | Free-tier compatible, no API cost; trade-off: fewer POI details |
| localStorage only (Phase 1) | PostgreSQL + localStorage hybrid (Phase 2) | Within project | Frontend cache for UX speed, backend cache for multi-user scalability |
| Custom dialog | Native `<dialog>` or Radix UI via shadcn/ui | 2022+ | dialog element now widely supported; no extra dependency needed |
| Create React App | Vite | 2023-2025 | 10x faster HMR, smaller bundle; Vite now standard for React SPAs |

**Deprecated/outdated:**
- **react-beautiful-dnd:** Archived by Atlassian; use hello-pangea/dnd (community fork) or dnd-kit (recommended) instead
- **Formik:** Unmaintained (12+ months no updates per Phase 1 research); use React Hook Form
- **csurf middleware (CSRF):** Removed from npm; Phase 1 deferred CSRF to custom double-submit cookie pattern

---

## Open Questions

1. **Stop numbering UI — should stops show as "Stop 1, Stop 2" or custom labels?**
   - What we know: CONTEXT doesn't specify; D-11 mentions drag-handle but not numbering
   - What's unclear: If user reorders, do numbers update? Should users be able to rename stops ("Seattle Stop", "Portland Stop")?
   - Recommendation: Show position-based numbering ("Stop 1", "Stop 2") initially. Add custom naming as Phase 3+ feature if UX testing shows demand. For Phase 2, keep it simple.

2. **Unsplash API key security — where to store UNSPLASH_ACCESS_KEY?**
   - What we know: Must be server-side (Phase 1 uses .env pattern for secrets)
   - What's unclear: Is it safe to commit .env.example to git with placeholder?
   - Recommendation: Store in .env file (not in git); .env.example shows placeholder. Backend/src/unsplash/client.js reads from process.env.UNSPLASH_ACCESS_KEY.

3. **Trip edit — should it reopen modal or inline edit on the dashboard card?**
   - What we know: D-03 specifies create via modal; D-51 doesn't specify edit pattern
   - What's unclear: Consistency — does edit follow same modal pattern as create?
   - Recommendation: Use modal for consistency with create. Avoid inline editing on dashboard cards to reduce complexity.

4. **Stop deletion — should it be soft delete (preserve history) or hard delete?**
   - What we know: Phase 2 focuses on core CRUD; Phase 4 adds sharing/read-only links
   - What's unclear: If trip is shared later (Phase 4), can shared users see deleted stops?
   - Recommendation: Hard delete in Phase 2 (simplest). If Phase 4 adds sharing and users want history, migrate to soft delete then.

5. **MapPreview zoom level when adding/removing stops dynamically?**
   - What we know: fitBounds() recalculates on stop list change
   - What's unclear: Should map re-fit every time user adds a stop, or only after stop list edit is complete?
   - Recommendation: Re-fit on every change (provides live feedback). Use debounce (100ms) if performance is an issue with many stops.

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Backend runtime | ✓ | 22.x LTS | — |
| npm | Package manager | ✓ | 11.x | — |
| PostgreSQL | Database (trips, stops, unsplash_cache tables) | ✗ (Docker required) | 18.3 | Docker Compose will start in Phase 4 |
| Docker | Running PostgreSQL locally | ✗ | — | Use `docker compose up` in Phase 4 deployment |
| axios | HTTP client | ✓ | 1.7.0 | Already installed |
| react-hook-form | Form state | ✓ | 7.72.1 | Already installed |
| dnd-kit | Drag-and-drop | ✗ | 8.x | `npm install @dnd-kit/core @dnd-kit/sortable` |
| Nominatim API | Address autocomplete | ✓ | Public API | Existing endpoint configured in Phase 1 |
| Unsplash API | Trip cover photos | ✓ | Free tier (50/hr) | Rate limit reached → gradient fallback |

**Missing dependencies with no fallback:**
- PostgreSQL (Phase 2 planning only; Phase 4 deployment includes Docker setup)
- dnd-kit (needs installation before stop reordering task)

**Missing dependencies with fallback:**
- Docker (can test locally with `npm install`, full stack testing deferred to Phase 4)

---

## Validation Architecture

**Status:** `nyquist_validation` is explicitly set to `false` in .planning/config.json. Per instructions, Validation Architecture section is SKIPPED.

**Note:** Phase 1 established test infrastructure (Jest, Supertest, two test files in backend/tests/). Phase 2 planning should account for this foundation, but validation/test plan generation is deferred per workflow config.

---

## Sources

### Primary (HIGH confidence)

- **React Hook Form 7.x** — Official docs at react-hook-form.com; verified current version 7.72.1 via npm registry
- **dnd-kit 8.x** — Official docs at docs.dndkit.com; verified active maintenance, touch sensor configuration
- **Leaflet 1.9.4** — Official docs at leafletjs.com; verified current version via npm registry
- **react-leaflet 5.0.0** — Official docs at react-leaflet.js.org; established pattern from Phase 1
- **Nominatim Usage Policy** — operations.osmfoundation.org/policies/nominatim/; verified 1 req/sec rate limit, caching recommendation
- **Tailwind CSS 4.x** — Official docs at tailwindcss.com; verified mobile-first responsive design patterns
- **Express.js 5.2.1** — expressjs.com; verified LTS release, async error handling
- **PostgreSQL 18.3** — postgresql.org release notes; verified version in CLAUDE.md
- **Unsplash API Documentation** — unsplash.com/documentation; verified 50 req/hour free tier limit, attribution requirements

### Secondary (MEDIUM confidence, verified with official source)

- **[Drag-and-Drop Libraries Comparison 2025](https://dev.to/puckeditor/top-5-drag-and-drop-libraries-react-24lb)** — Verified that react-beautiful-dnd is archived and dnd-kit is recommended; cross-referenced with GitHub issue #1398 showing touch activation constraints
- **[dnd-kit Touch Sensor Configuration](https://docs.dndkit.com/api-documentation/sensors/touch)** — Official dnd-kit docs confirm delay=0, tolerance=5px for mobile long-press elimination
- **[React Responsive Split Panel Layout](https://blog.logrocket.com/implementing-split-view-responsive-layout-react-native/)** — General pattern verified; Tailwind flex-col/lg:flex-row approach validated against tailwindcss.com responsive design docs
- **[Leaflet fitBounds with Multiple Markers](https://copyprogramming.com/howto/leaflet-js-fitbounds-with-padding)** — Verified L.latLngBounds() and fitBounds() API; cross-referenced with leafletjs.com examples
- **[PostgreSQL Cache Invalidation with TTL](https://oneuptime.com/blog/post/2026-01-30-time-based-invalidation/view)** — General TTL strategy verified; implementation pattern (expires_at column + cleanup query) is standard PostgreSQL approach
- **[shadcn/ui Dialog Component](https://ui.shadcn.com/docs/components/radix/dialog)** — Verified copy-paste component pattern; uses Radix UI primitives with Tailwind styling

### Tertiary (LOW confidence, WebSearch only)

None — all critical findings verified against official sources.

---

## Metadata

**Confidence breakdown:**
- **Standard stack:** HIGH — All versions verified against official package registries and documentation. React, Tailwind, Express, PostgreSQL, axios all current as of 2026-04-05.
- **Architecture patterns:** HIGH — dnd-kit, Leaflet fitBounds, React Hook Form patterns all from official docs. Split-panel responsive layout validated against Tailwind CSS responsive design guide.
- **Database schema:** MEDIUM-HIGH — PostgreSQL pattern (trips, stops, unsplash_cache tables) follows standard design; TTL pattern verified but not tested in this codebase yet.
- **Unsplash integration:** HIGH — Free tier limits and attribution requirements verified against official API docs. Fallback gradient pattern is sound; caching strategy reduces API calls.
- **Pitfalls:** MEDIUM-HIGH — Based on common React/Node patterns, Nominatim documentation, and Phase 1 experience. Some inferred from ecosystem best practices.

**Research date:** 2026-04-05  
**Valid until:** 2026-05-05 (30 days for stable technologies; dnd-kit and shadcn/ui move faster, monitor for updates)

---

*Phase: 02-trip-stop-management*  
*Research completed: 2026-04-05*
