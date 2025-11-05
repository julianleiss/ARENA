# Mapbox Cinematic Enhancements - Configuration Guide

## Overview

ARENA v1.1 includes a comprehensive suite of cinematic visual enhancements for Mapbox GL JS maps. These features transform the standard map experience into an immersive, premium visualization platform.

**Key Features**:
- ✨ Dynamic lighting system based on time of day
- 🌫️ Atmospheric fog and sky gradients
- 🎥 Smooth camera animations and transitions
- ⏰ Interactive time-of-day controls
- 📸 View presets for quick navigation
- 🎬 Loading transitions and effects

## Quick Start

### Basic Setup

```tsx
import MapboxView from '@/app/components/MapboxView'

export default function MyMap() {
  return (
    <MapboxView
      enableCinematicEnhancements={true}
      showTimeControl={true}
      showViewPresets={true}
      initialTimeOfDay={12} // Noon
      initialViewState={{
        longitude: -58.3816,
        latitude: -34.6037,
        zoom: 14,
        pitch: 60
      }}
    />
  )
}
```

### With Custom Configuration

```tsx
<MapboxView
  enableCinematicEnhancements={true}
  showTimeControl={true}
  showViewPresets={true}
  initialTimeOfDay={18.5} // Golden hour
  style="standard"
  showNavigationControls={true}
  onMapLoad={(map) => {
    console.log('Map loaded with cinematic enhancements!')
  }}
/>
```

## Architecture

### File Structure

```
app/
├── components/
│   ├── MapboxView.tsx           # Main map component with enhancements
│   ├── TimeOfDaySlider.tsx      # Time control UI
│   └── ViewPresetsPanel.tsx     # Camera presets UI
├── lib/
│   ├── mapbox-lighting.ts       # Lighting & atmosphere system
│   ├── mapbox-camera.ts         # Camera animations
│   ├── mapbox-config.ts         # Configuration constants
│   └── mapbox-layers.ts         # Layer utilities
```

## Core Systems

### 1. Dynamic Lighting System

**Location**: `app/lib/mapbox-lighting.ts`

Calculates realistic sun positions for Buenos Aires (-34.6037°) and applies time-based lighting.

#### Time Periods

| Period | Hours | Sky Color | Intensity | Use Case |
|--------|-------|-----------|-----------|----------|
| **Night** | 20:30 - 05:00 | Dark blue (#0f172a) | 0.1 | Dramatic views, nightlife |
| **Dawn** | 05:00 - 07:00 | Orange-blue gradient | 0.3-0.6 | Sunrise scenes |
| **Day** | 07:00 - 18:00 | Bright blue (#60a5fa) | 0.85 | Normal viewing |
| **Dusk** | 18:00 - 20:30 | Orange-red gradient | 0.6-0.1 | Golden hour, sunsets |

#### API Reference

##### `calculateSunPosition(hour, latitude?)`

Calculate sun azimuth and altitude for a given time.

```typescript
import { calculateSunPosition } from '@/app/lib/mapbox-lighting'

const sunPos = calculateSunPosition(12, -34.6037)
// { azimuth: 0, altitude: 79 }
```

##### `updateMapLighting(map, hour, options?)`

Apply lighting configuration to map.

```typescript
import { updateMapLighting } from '@/app/lib/mapbox-lighting'

updateMapLighting(map, 18.5, {
  animated: true,
  duration: 2000,
  enableFog: true
})
```

**Options**:
- `animated`: Smooth transition (default: `true`)
- `duration`: Animation duration in ms (default: `1000`)
- `enableFog`: Apply atmospheric fog (default: `true`)

##### `initializeMapLighting(map, hour?)`

Initialize cinematic lighting on map load.

```typescript
map.on('load', () => {
  initializeMapLighting(map, 12) // Noon
})
```

#### Time Presets

```typescript
import { TIME_PRESETS } from '@/app/lib/mapbox-lighting'

TIME_PRESETS.MIDNIGHT    // 0
TIME_PRESETS.SUNRISE     // 6.5
TIME_PRESETS.NOON        // 12
TIME_PRESETS.GOLDEN_HOUR // 18.5
TIME_PRESETS.SUNSET      // 19.5
TIME_PRESETS.NIGHT       // 22
```

### 2. Camera Animation System

**Location**: `app/lib/mapbox-camera.ts`

Provides cinematic camera movements with custom easing functions.

#### API Reference

##### `flyToProposal(map, geometry, options?)`

Fly to a proposal with automatic framing.

```typescript
import { flyToProposal } from '@/app/lib/mapbox-camera'

flyToProposal(map, proposalGeometry, {
  duration: 2000,
  easing: 'cinematic',
  pitch: 60,
  maxZoom: 18
})
```

**Geometry Types Supported**:
- `Point`: Centers on point at zoom 17
- `Polygon`: Fits bounds with padding
- `LineString`: Fits bounds with padding
- `MultiPoint`: Centers on centroid

##### `orbitAround(map, center, options?)`

Create a circular orbit animation.

```typescript
import { orbitAround } from '@/app/lib/mapbox-camera'

const stopOrbit = orbitAround(map, [-58.46, -34.545], {
  duration: 10000,
  rotations: 2,
  pitch: 60,
  onFrame: (progress) => console.log(`${progress * 100}%`),
  onComplete: () => console.log('Orbit complete!')
})

// Stop early if needed
stopOrbit()
```

##### `easeCameraTo(map, position, options?)`

Smooth camera movement to a position.

```typescript
import { easeCameraTo } from '@/app/lib/mapbox-camera'

easeCameraTo(map, {
  lng: -58.46,
  lat: -34.545,
  zoom: 16,
  pitch: 70,
  bearing: 45
}, {
  duration: 1500,
  easing: 'easeInOutCubic'
})
```

##### `tourPath(map, path, options?)`

Animate camera through multiple positions.

```typescript
import { tourPath } from '@/app/lib/mapbox-camera'

await tourPath(map, [
  { lng: -58.46, lat: -34.545, zoom: 15, pitch: 0 },
  { lng: -58.45, lat: -34.540, zoom: 17, pitch: 60 },
  { lng: -58.44, lat: -34.535, zoom: 16, pitch: 45 }
], {
  duration: 2000,
  pauseDuration: 1000
})
```

##### `revealLocation(map, target, options?)`

Dramatic zoom-in reveal effect.

```typescript
import { revealLocation } from '@/app/lib/mapbox-camera'

revealLocation(map, {
  lng: -58.46,
  lat: -34.545,
  zoom: 16,
  pitch: 60
}, {
  startZoom: 4,
  duration: 3000,
  easing: 'cinematic'
})
```

#### Easing Functions

| Function | Description | Best For |
|----------|-------------|----------|
| `linear` | Constant speed | Orbits, continuous movement |
| `easeInQuad` | Slow start, fast end | Zoom in |
| `easeOutQuad` | Fast start, slow end | Zoom out |
| `easeInOutQuad` | Smooth both ends | General transitions |
| `easeInCubic` | Slower start | Dramatic entrances |
| `easeOutCubic` | Slower end | Smooth stops |
| `easeInOutCubic` | Balanced smooth | Default transitions |
| `cinematic` | Custom curve | Cinematic reveals |

### 3. Time-of-Day Slider

**Location**: `app/components/TimeOfDaySlider.tsx`

Interactive UI for controlling map lighting.

#### Features

- ⏰ Slider with 15-minute increments (0-24 hours)
- 🔢 Real-time HH:MM display
- 🎨 Visual period indicator (dawn/day/dusk/night)
- 🎯 4 preset buttons (Sunrise, Noon, Sunset, Night)
- ⌨️ Keyboard shortcuts (1-4 for presets, T to toggle)
- 💾 localStorage persistence
- 📱 Mobile-friendly

#### Usage

```tsx
import TimeOfDaySlider from '@/app/components/TimeOfDaySlider'

<TimeOfDaySlider
  map={mapInstance}
  initialHour={12}
  onTimeChange={(hour) => console.log('Time:', hour)}
  showPresets={true}
  collapsed={false}
/>
```

#### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `map` | `MapboxMap \| null` | Required | Mapbox map instance |
| `initialHour` | `number` | Current time | Initial hour (0-24) |
| `onTimeChange` | `(hour: number) => void` | - | Callback on change |
| `showPresets` | `boolean` | `true` | Show preset buttons |
| `collapsed` | `boolean` | `false` | Start collapsed |
| `className` | `string` | `''` | CSS class name |

#### Keyboard Shortcuts

- `1`: Sunrise (6:30 AM)
- `2`: Noon (12:00 PM)
- `3`: Sunset/Golden Hour (6:30 PM)
- `4`: Night (10:00 PM)
- `T`: Toggle between current time and noon

### 4. View Presets Panel

**Location**: `app/components/ViewPresetsPanel.tsx`

Quick camera positions and style switching.

#### Default Presets

| Preset | Description | Zoom | Pitch | Time | Shortcut |
|--------|-------------|------|-------|------|----------|
| **Buenos Aires Overview** | High-altitude city view | 11 | 45° | Noon | Q |
| **Neighborhood View** | Perfect for proposals | 14 | 60° | 3 PM | W |
| **Street Level** | Ground perspective | 18 | 70° | Golden hour | E |
| **Satellite View** | Satellite imagery | 15 | 0° | Noon | R |
| **Night View** | Nighttime drama | 14 | 60° | 10 PM | A |
| **3D Buildings** | Showcase heights | 16 | 75° | 3 PM | S |

#### Usage

```tsx
import ViewPresetsPanel from '@/app/components/ViewPresetsPanel'

<ViewPresetsPanel
  map={mapInstance}
  onPresetChange={(preset) => console.log('Active:', preset.name)}
  collapsed={false}
/>
```

#### Custom Presets

```tsx
import { createViewPreset } from '@/app/components/ViewPresetsPanel'
import { MapPin } from 'lucide-react'

const customPreset = createViewPreset({
  id: 'my-view',
  name: 'My Custom View',
  description: 'Special perspective',
  icon: <MapPin />,
  viewState: {
    lng: -58.46,
    lat: -34.545,
    zoom: 15,
    pitch: 60,
    bearing: 0
  },
  timeOfDay: 18.5,
  shortcut: 'M'
})

<ViewPresetsPanel
  map={mapInstance}
  customPresets={[customPreset]}
/>
```

## Performance Considerations

### Benchmarks

Tested on MacBook Pro M1 (2021), Chrome 120:

| Feature | FPS Impact | Memory Impact | Notes |
|---------|------------|---------------|-------|
| Dynamic Lighting | ~2 FPS | Negligible | Only on change |
| Fog Effects | ~3 FPS | Negligible | Built-in Mapbox |
| Sky Layer | ~1 FPS | ~5 MB | One-time cost |
| Time Slider | 0 FPS | ~1 MB | UI only |
| View Presets | 0 FPS | ~500 KB | UI only |
| Camera Animations | 0-5 FPS | Negligible | During animation |

**Overall Impact**: ~5-10 FPS reduction (typically 60 FPS → 50-55 FPS)

### Optimization Tips

1. **Disable during interactions**:
   ```typescript
   map.on('drag', () => {
     // Pause lighting updates
   })
   ```

2. **Reduce animation duration for low-end devices**:
   ```typescript
   const duration = window.matchMedia('(max-width: 768px)').matches ? 1000 : 2000
   ```

3. **Conditional loading**:
   ```tsx
   <MapboxView
     enableCinematicEnhancements={!isMobile}
   />
   ```

4. **Lazy load controls**:
   ```tsx
   {isMapLoaded && showAdvancedControls && (
     <TimeOfDaySlider map={map} />
   )}
   ```

## Troubleshooting

### Lighting not working

**Symptoms**: No lighting changes when moving time slider
**Causes**:
- Map style doesn't support lighting (use `standard` style)
- Map not fully loaded
- Fog not enabled

**Solution**:
```tsx
<MapboxView
  style="standard" // ← Use standard style
  enableCinematicEnhancements={true}
  onMapLoad={(map) => {
    // Verify lighting initialized
    console.log('Sky layer:', map.getLayer('sky'))
  }}
/>
```

### Fog not visible

**Symptoms**: Atmospheric fog not appearing
**Causes**:
- Fog only visible at certain zoom levels
- Wrong map style

**Solution**:
- Zoom to 12-18 for best fog visibility
- Use `standard` or `streets` style
- Check fog range: `[0.5, 10]` km is typical

### Controls not showing

**Symptoms**: Time slider or presets panel not visible
**Causes**:
- Props not set
- Z-index conflicts
- Map not loaded

**Solution**:
```tsx
<MapboxView
  showTimeControl={true}    // ← Enable
  showViewPresets={true}    // ← Enable
  enableCinematicEnhancements={true} // ← Required
  onMapLoad={(map) => console.log('Map ready')}
/>
```

### Performance issues

**Symptoms**: Low frame rate, stuttering
**Causes**:
- Too many simultaneous animations
- Complex geometries
- Mobile device

**Solution**:
```typescript
// Disable during interaction
updateMapLighting(map, hour, {
  animated: false, // ← No animation
  duration: 0
})

// Or conditionally enable
const enableEnhancements = !isMobile && isHighPerformance
```

## Browser Support

| Browser | Version | Support Level | Notes |
|---------|---------|---------------|-------|
| Chrome | 90+ | ✅ Full | Best performance |
| Firefox | 88+ | ✅ Full | Good performance |
| Safari | 14+ | ⚠️ Partial | Some CSS animations laggy |
| Edge | 90+ | ✅ Full | Chrome-based |
| Mobile Safari | 14+ | ⚠️ Partial | Reduced performance |
| Mobile Chrome | 90+ | ✅ Full | Good performance |

## Examples

### Basic Example - Homepage Map

```tsx
'use client'

import MapboxView from '@/app/components/MapboxView'

export default function HomePage() {
  return (
    <div className="w-full h-screen">
      <MapboxView
        enableCinematicEnhancements={true}
        showTimeControl={true}
        showViewPresets={true}
        initialViewState={{
          longitude: -58.3816,
          latitude: -34.6037,
          zoom: 14,
          pitch: 60
        }}
      />
    </div>
  )
}
```

### Advanced Example - Proposal Showcase

```tsx
'use client'

import { useRef, useEffect } from 'react'
import MapboxView, { type MapboxViewHandle } from '@/app/components/MapboxView'
import { flyToProposal, orbitAround } from '@/app/lib/mapbox-camera'
import { updateMapLighting } from '@/app/lib/mapbox-lighting'

export default function ProposalShowcase({ proposal }) {
  const mapRef = useRef<MapboxViewHandle>(null)

  useEffect(() => {
    const map = mapRef.current?.getMap()
    if (!map || !proposal) return

    // Set golden hour
    updateMapLighting(map, 18.5, { duration: 1000 })

    // Fly to proposal
    setTimeout(() => {
      flyToProposal(map, proposal.geom, {
        duration: 2000,
        easing: 'cinematic',
        pitch: 70
      })
    }, 1000)

    // Orbit around it
    setTimeout(() => {
      orbitAround(map, proposal.geom.coordinates, {
        duration: 8000,
        rotations: 1,
        pitch: 70
      })
    }, 4000)
  }, [proposal])

  return (
    <MapboxView
      ref={mapRef}
      enableCinematicEnhancements={true}
      initialTimeOfDay={18.5}
      showNavigationControls={false}
    />
  )
}
```

### Example - Custom Tour

```tsx
'use client'

import { useRef } from 'react'
import MapboxView, { type MapboxViewHandle } from '@/app/components/MapboxView'
import { tourPath } from '@/app/lib/mapbox-camera'
import { updateMapLighting } from '@/app/lib/mapbox-lighting'

export default function CityTour() {
  const mapRef = useRef<MapboxViewHandle>(null)

  const startTour = async () => {
    const map = mapRef.current?.getMap()
    if (!map) return

    // Dawn
    updateMapLighting(map, 6.5, { duration: 2000 })

    await tourPath(map, [
      // Obelisco at dawn
      { lng: -58.3816, lat: -34.6037, zoom: 17, pitch: 60 },
      // Puerto Madero at noon
      { lng: -58.3636, lat: -34.6158, zoom: 16, pitch: 70 },
      // Palermo at sunset
      { lng: -58.4173, lat: -34.5875, zoom: 15, pitch: 60 }
    ], {
      duration: 3000,
      pauseDuration: 2000
    })
  }

  return (
    <div>
      <MapboxView
        ref={mapRef}
        enableCinematicEnhancements={true}
      />
      <button onClick={startTour}>Start Tour</button>
    </div>
  )
}
```

## API Summary

### Components

- `MapboxView` - Main map component with enhancements
- `TimeOfDaySlider` - Time control UI
- `ViewPresetsPanel` - Camera presets UI

### Libraries

- `mapbox-lighting.ts` - Lighting system
  - `calculateSunPosition()`
  - `updateMapLighting()`
  - `initializeMapLighting()`
  - `formatTime()`, `parseTime()`, `getCurrentHour()`
  - `TIME_PRESETS`

- `mapbox-camera.ts` - Camera animations
  - `flyToProposal()`
  - `orbitAround()`
  - `easeCameraTo()`
  - `tourPath()`
  - `revealLocation()`
  - `zoomTo()`
  - `resetCamera()`

## Future Enhancements

### v1.2 Roadmap

- [ ] Cloud layer animations
- [ ] Weather effects (rain, fog, snow)
- [ ] Seasonal lighting variations
- [ ] Custom shader effects
- [ ] VR/AR camera modes
- [ ] Cinematic replay/export
- [ ] Social sharing with preset views

### Under Consideration

- Star field at night (performance concerns)
- True depth of field (requires WebGL post-processing)
- Ray-traced shadows (not feasible in real-time)
- Volumetric fog (too GPU-intensive)

## Credits

Built for **ARENA v1.1** - Civic Engagement Platform

**Technologies**:
- Mapbox GL JS 3.x
- React 19
- TypeScript 5.x
- Lucide Icons

**Solar calculations** based on NOAA Solar Position Algorithm (simplified).

**Inspired by**:
- Google Earth's cinematic tours
- Apple Maps' 3D city views
- Microsoft Flight Simulator's atmospheric rendering

## Support

For issues or questions:
1. Check [DEPTH_OF_FIELD_RESEARCH.md](./DEPTH_OF_FIELD_RESEARCH.md) for technical limitations
2. Review [CLAUDE.md](./CLAUDE.md) for project context
3. Open GitHub issue with `[Mapbox Cinematic]` prefix
