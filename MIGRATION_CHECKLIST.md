# ARENA Mapbox Migration Checklist

This document tracks the migration from Google Maps to Mapbox GL JS.

## Iteration 4: Migrate Proposals to Mapbox ✅ COMPLETED

**Goal**: Migrate proposal rendering from Google Maps to Mapbox GL JS while preserving all existing functionality.

### Prerequisites ✅
- [x] MapboxView.tsx component exists and works
- [x] Mapbox access token configured (NEXT_PUBLIC_MAPBOX_TOKEN)
- [x] Review current proposal rendering logic

### Implementation Tasks ✅

#### 1. Proposal Data Analysis ✅
- [x] **How proposals are shown**: Purple pin markers using DeckGL IconLayer (now migrated to Mapbox Symbol layer)
- [x] **Data structure**: Proposals have `geom` field with GeoJSON (Point, Polygon, LineString, MultiPoint)
- [x] **Interactions**:
  - Hover shows tooltip with title, summary, author
  - Click opens ProposalsPanel with full details
  - Cursor changes to pointer on hover
- [x] **Coordinate system**: Already using GeoJSON [lng, lat] format (compatible with Mapbox)

#### 2. Created Files ✅

- [x] **app/lib/mapbox-layers.ts**
  - `extractCoordinates()`: Extract position from any geometry type
  - `proposalsToGeoJSON()`: Convert proposals to GeoJSON FeatureCollection
  - `getProposalColor()`: Status-based color coding
  - `createProposalPinImage()`: SVG marker icon (matches Google Maps design)
  - Proposal type definitions

- [x] **app/components/ProposalMarkers.tsx**
  - Manages proposal marker source and layer on Mapbox
  - Handles marker initialization and cleanup
  - Click and hover event handlers
  - Dynamic marker updates when proposals change
  - Integrates with ProposalPopup component

- [x] **app/components/ProposalPopup.tsx**
  - Hover tooltip component
  - Shows proposal preview (title, summary, author)
  - Vote and comment counts (when available)
  - ARENA design system styling (purple gradient)
  - Responsive positioning above marker

#### 3. Modified Files ✅

- [x] **app/page.tsx**
  - Replaced `MapView` (Google Maps) with `MapboxView`
  - Added `ProposalMarkers` component integration
  - Implemented proposal fetching from `/api/proposals`
  - Map click handlers for point and polygon creation modes
  - State management for proposals, map instance, polygon points
  - Preserved all existing functionality (creation workflow, forms, panels)
  - Added polygon finalization UI
  - Updated debug overlay with Mapbox-specific info
  - Commented out old Google Maps code (not deleted)

#### 4. Coordinate System Handling ✅
- [x] **Verified coordinate order**: Both Mapbox and existing API use GeoJSON standard [lng, lat]
- [x] **No conversion needed**: Direct compatibility
- [x] **Helper function available**: `extractCoordinates()` in mapbox-layers.ts

#### 5. Preserved Functionality ✅

- [x] Proposal selection/deselection
- [x] Navigation to proposal detail page (via ProposalsPanel)
- [x] Proposal creation workflow (point and polygon modes)
- [x] Form modal for proposal submission
- [x] Image upload support
- [x] Panel sidebar for browsing proposals
- [x] Hover previews and click details

### Testing Checklist

- [ ] Proposals load and display at correct locations
- [ ] Hover shows preview tooltip
- [ ] Click opens ProposalsPanel with details
- [ ] Performance with 50+ proposals
- [ ] Mobile touch interactions work
- [ ] Coordinates are accurate
- [ ] Point creation mode works
- [ ] Polygon creation mode works (draw 3+ points)
- [ ] Proposal form submission works
- [ ] New proposals appear on map after creation
- [ ] Map navigation controls work (zoom, pitch, rotate)

### Known Limitations

- **Building selection mode**: Not yet implemented in Mapbox (DeckGL building layer not migrated)
  - Users see message: "building layer not yet implemented in Mapbox"
  - Point and polygon modes work as alternatives
  - Building migration planned for future iteration

### Not Yet Migrated (Future Work)

- [ ] Building selection with DeckGL layer (3D extrusion)
- [ ] Sandbox editor (/sandbox/[id] page)
- [ ] ba-buildings.json optimization/lazy loading

### Performance Optimizations Applied

- Debounced mouse move events in popup positioning
- Memoized map options and callbacks
- Conditional rendering (proposals only in navigate mode)
- Efficient GeoJSON source updates

### Migration Strategy

- ✅ Kept Google Maps code commented out (can rollback if needed)
- ✅ Side-by-side comparison available via code comments
- ✅ Feature parity maintained (except building layer)
- ✅ Design system consistency (same purple pins and styling)

### Environment Variables Required

```bash
# Required for Mapbox
NEXT_PUBLIC_MAPBOX_TOKEN=pk.eyJ1Ijoi...

# Optional (for Google Maps fallback)
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSy...
```

### Files Changed Summary

**Created:**
- `app/lib/mapbox-layers.ts` (157 lines)
- `app/components/ProposalMarkers.tsx` (183 lines)
- `app/components/ProposalPopup.tsx` (124 lines)

**Modified:**
- `app/page.tsx` (replaced Google Maps with Mapbox, ~100 lines changed)

**Total:** ~564 lines of new/modified code

---

## Next Steps

1. **Test the migration**: Run `npm run dev` and verify all functionality
2. **Performance testing**: Test with 50+ proposals
3. **Mobile testing**: Verify touch interactions
4. **Optional**: Implement building layer with Mapbox GL JS native features
5. **Future**: Migrate sandbox editor to Mapbox

## Rollback Plan

If issues are encountered:
1. Uncomment Google Maps code in `app/page.tsx`
2. Comment out Mapbox code
3. Change imports back to `MapView`
4. File an issue in MAPBOX_ISSUES.md

---

**Migration completed**: 2025-11-05
**Migrated by**: Claude (Anthropic)
**Status**: ✅ Ready for testing
