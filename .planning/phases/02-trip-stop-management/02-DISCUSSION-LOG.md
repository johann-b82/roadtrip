# Phase 2: Trip & Stop Management - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-04-05
**Phase:** 02-trip-stop-management
**Areas discussed:** Trip dashboard layout, Stop management UX, Unsplash cover photos, Trip detail page structure

---

## Trip Dashboard Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Card grid | Trips as visual cards with cover photo, name, stop count, dates. Responsive grid 1-3 columns. | ✓ |
| Compact list | Trips as rows with small thumbnail. More trips visible, less visual. | |

**User's choice:** Card grid
**Notes:** Best for showcasing Unsplash cover photos in a travel app context.

### Empty State

| Option | Description | Selected |
|--------|-------------|----------|
| Illustrated CTA | Centered illustration with "Plan your first road trip" heading and prominent "+ New Trip" button. | ✓ |
| Minimal prompt | Just a button at top with subtle message. | |

**User's choice:** Illustrated CTA

### New Trip Creation

| Option | Description | Selected |
|--------|-------------|----------|
| Modal dialog | Opens modal with name + description fields. Quick, stays in dashboard context. | ✓ |
| Dedicated page | Navigates to /trips/new. More room but breaks flow. | |

**User's choice:** Modal dialog

---

## Stop Management UX

### Adding a Stop

| Option | Description | Selected |
|--------|-------------|----------|
| Inline form in stop list | Click "+ Add Stop", form expands inline with AddressInput, description, dates. | ✓ |
| Modal form | Click opens modal with all fields. More room but context switch. | |

**User's choice:** Inline form in stop list

### Drag-and-Drop Reorder

| Option | Description | Selected |
|--------|-------------|----------|
| Drag handle on each stop | Grip icon, drag to reorder, visual placeholder. Long-press on mobile. | ✓ |
| Up/down arrow buttons | Simple buttons, more accessible, no drag library. | |

**User's choice:** Drag handle

### Editing a Stop

| Option | Description | Selected |
|--------|-------------|----------|
| Inline expand | Click edit icon, expands in-place with editable fields. Consistent with add pattern. | ✓ |
| Modal form | Opens modal with pre-filled fields. Breaks inline consistency. | |

**User's choice:** Inline expand

---

## Unsplash Cover Photos

### Photo Search Trigger

| Option | Description | Selected |
|--------|-------------|----------|
| Trip name on create | Search using trip name. Simple, immediate. | |
| Trip description | Search using description text. More context for better results. | ✓ |
| First stop address | Wait for first stop, search by location. Delayed, no cover until stop added. | |

**User's choice:** Trip description
**Notes:** Description provides richer context for more relevant photo results.

### Fallback Behavior

| Option | Description | Selected |
|--------|-------------|----------|
| Gradient placeholder | Tasteful gradient with trip name overlaid. Retry next view. | ✓ |
| Default stock images | Bundle 3-5 generic travel images. Rotate through. | |

**User's choice:** Gradient placeholder

### User Photo Selection

| Option | Description | Selected |
|--------|-------------|----------|
| Pick from alternatives | Store top 5 results. User can cycle through on trip detail page. | ✓ |
| Fully automatic | One photo, auto-selected. Simpler. | |

**User's choice:** Pick from alternatives

### Caching Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Backend cache in PostgreSQL | unsplash_cache table, query -> URLs + metadata, 24h TTL. | ✓ |
| In-memory only | Node.js process memory. Lost on restart. | |

**User's choice:** Backend cache in PostgreSQL

---

## Trip Detail Page Structure

### Page Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Header + stop list | Cover photo hero, then vertical stop list. Clean, scrollable. | |
| Split panel (list + map) | Stop list left, map preview right. Collapses on mobile. | ✓ |

**User's choice:** Split panel
**Notes:** Provides spatial context even before Phase 3 adds full routing.

### Map Preview Scope

| Option | Description | Selected |
|--------|-------------|----------|
| Show stop pins now | Reuse MapPreview, show markers for each stop. No routing lines. | ✓ |
| Placeholder until Phase 3 | "Map coming soon" placeholder. | |

**User's choice:** Show stop pins now

### Navigation

| Option | Description | Selected |
|--------|-------------|----------|
| Top navbar | Slim bar with app name, user avatar/menu, back button on detail pages. | ✓ |
| Sidebar navigation | Collapsible sidebar with trip list. Desktop-first. | |

**User's choice:** Top navbar

### Date Picker

| Option | Description | Selected |
|--------|-------------|----------|
| Native HTML date inputs | Browser native pickers. Zero overhead, accessible. | ✓ |
| Custom date picker component | Library-based. Consistent look, adds dependency. | |

**User's choice:** Native HTML date inputs

### Delete Trip

| Option | Description | Selected |
|--------|-------------|----------|
| Confirm dialog | "Delete this trip and all its stops?" Cancel/Delete. Red button. | ✓ |
| Swipe/inline delete | No confirmation, undo toast instead. | |

**User's choice:** Confirm dialog

---

## Claude's Discretion

- Database schema for trips, stops, unsplash_cache tables
- Drag-and-drop library choice
- Stop ordering logic
- Loading states and skeleton screens
- Error handling patterns
- Mobile responsive breakpoints
- Unsplash API integration details
- Trip edit form behavior

## Deferred Ideas

None — discussion stayed within phase scope
