/**
 * Mapbox Camera Animation Utilities for ARENA
 *
 * Provides cinematic camera movements and animations for Mapbox GL JS.
 * Includes smooth transitions, custom easing functions, and preset camera paths.
 *
 * Features:
 * - flyToProposal: Smooth camera movement to focus on a proposal
 * - orbitAround: Circular camera orbit around a point
 * - Custom easing curves for natural motion
 * - Camera path interpolation
 *
 * @see https://docs.mapbox.com/mapbox-gl-js/api/map/#map#flyto
 * @see https://docs.mapbox.com/mapbox-gl-js/api/map/#map#easeto
 */

import type { Map as MapboxMap, LngLatLike, EasingOptions } from 'mapbox-gl'

// ============================================================================
// TYPES
// ============================================================================

/**
 * Camera position in 3D space
 */
export interface CameraPosition {
  /** Center longitude */
  lng: number
  /** Center latitude */
  lat: number
  /** Zoom level (0-22) */
  zoom: number
  /** Bearing/rotation in degrees (0-360) */
  bearing?: number
  /** Pitch/tilt in degrees (0-85) */
  pitch?: number
}

/**
 * Proposal geometry (simplified)
 */
export interface ProposalGeometry {
  type: 'Point' | 'Polygon' | 'LineString' | 'MultiPoint'
  coordinates: any
}

/**
 * Animation options
 */
export interface AnimationOptions {
  /** Animation duration in milliseconds */
  duration?: number
  /** Easing function name */
  easing?: EasingFunction
  /** Padding around geometry in pixels */
  padding?: number
  /** Maximum zoom level */
  maxZoom?: number
  /** Animate linearly (no easing) */
  linear?: boolean
  /** Essential animation (won't be skipped) */
  essential?: boolean
}

/**
 * Orbit options
 */
export interface OrbitOptions {
  /** Number of full rotations (default: 1) */
  rotations?: number
  /** Orbit duration in milliseconds (default: 10000) */
  duration?: number
  /** Target pitch during orbit (default: 60) */
  pitch?: number
  /** Target zoom during orbit (default: current) */
  zoom?: number
  /** Easing function (default: 'linear') */
  easing?: EasingFunction
  /** Callback on each frame */
  onFrame?: (progress: number) => void
  /** Callback when complete */
  onComplete?: () => void
}

/**
 * Easing function names
 */
export type EasingFunction =
  | 'linear'
  | 'easeInQuad'
  | 'easeOutQuad'
  | 'easeInOutQuad'
  | 'easeInCubic'
  | 'easeOutCubic'
  | 'easeInOutCubic'
  | 'easeInQuart'
  | 'easeOutQuart'
  | 'easeInOutQuart'
  | 'cinematic' // Custom easing for cinematic feel

// ============================================================================
// EASING FUNCTIONS
// ============================================================================

/**
 * Collection of easing functions for smooth animations.
 * All functions take a value between 0 and 1 and return a value between 0 and 1.
 *
 * @see https://easings.net/
 */
export const EASING_FUNCTIONS: Record<EasingFunction, (t: number) => number> = {
  linear: (t) => t,

  easeInQuad: (t) => t * t,
  easeOutQuad: (t) => t * (2 - t),
  easeInOutQuad: (t) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t,

  easeInCubic: (t) => t * t * t,
  easeOutCubic: (t) => (--t) * t * t + 1,
  easeInOutCubic: (t) => t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1,

  easeInQuart: (t) => t * t * t * t,
  easeOutQuart: (t) => 1 - (--t) * t * t * t,
  easeInOutQuart: (t) => t < 0.5 ? 8 * t * t * t * t : 1 - 8 * (--t) * t * t * t,

  // Custom cinematic easing (ease-in-out with stronger acceleration)
  cinematic: (t) => {
    // Based on ease-in-out-quart with adjusted curve
    if (t < 0.5) {
      return 8 * t * t * t * t
    }
    const f = t - 1
    return 1 - 8 * f * f * f * f
  }
}

/**
 * Get easing function by name
 */
export function getEasingFunction(name: EasingFunction = 'easeInOutCubic'): (t: number) => number {
  return EASING_FUNCTIONS[name] || EASING_FUNCTIONS.easeInOutCubic
}

// ============================================================================
// GEOMETRY UTILITIES
// ============================================================================

/**
 * Extract center point and bounds from proposal geometry
 */
function getGeometryInfo(geom: ProposalGeometry): {
  center: [number, number]
  bounds?: [[number, number], [number, number]]
} {
  switch (geom.type) {
    case 'Point': {
      return {
        center: geom.coordinates as [number, number]
      }
    }

    case 'Polygon': {
      const coords = geom.coordinates[0] as [number, number][]
      const lngs = coords.map(c => c[0])
      const lats = coords.map(c => c[1])

      const minLng = Math.min(...lngs)
      const maxLng = Math.max(...lngs)
      const minLat = Math.min(...lats)
      const maxLat = Math.max(...lats)

      return {
        center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2],
        bounds: [[minLng, minLat], [maxLng, maxLat]]
      }
    }

    case 'LineString': {
      const coords = geom.coordinates as [number, number][]
      const lngs = coords.map(c => c[0])
      const lats = coords.map(c => c[1])

      const minLng = Math.min(...lngs)
      const maxLng = Math.max(...lngs)
      const minLat = Math.min(...lats)
      const maxLat = Math.max(...lats)

      return {
        center: [(minLng + maxLng) / 2, (minLat + maxLat) / 2],
        bounds: [[minLng, minLat], [maxLng, maxLat]]
      }
    }

    case 'MultiPoint': {
      const coords = geom.coordinates as [number, number][]
      const lngs = coords.map(c => c[0])
      const lats = coords.map(c => c[1])

      return {
        center: [
          lngs.reduce((a, b) => a + b, 0) / lngs.length,
          lats.reduce((a, b) => a + b, 0) / lats.length
        ]
      }
    }

    default: {
      throw new Error(`Unsupported geometry type: ${(geom as any).type}`)
    }
  }
}

// ============================================================================
// CAMERA ANIMATIONS
// ============================================================================

/**
 * Smoothly fly camera to a proposal with cinematic movement.
 *
 * Automatically calculates optimal camera position based on geometry type:
 * - Point: Centers on point with medium zoom
 * - Polygon/LineString: Fits bounds with padding
 * - MultiPoint: Centers on centroid
 *
 * @param map - Mapbox map instance
 * @param geometry - Proposal geometry
 * @param options - Animation options
 *
 * @example
 * ```ts
 * // Fly to a proposal point
 * flyToProposal(map, {
 *   type: 'Point',
 *   coordinates: [-58.46, -34.545]
 * })
 *
 * // Fly to polygon with custom duration
 * flyToProposal(map, proposalGeometry, {
 *   duration: 3000,
 *   easing: 'cinematic',
 *   pitch: 60
 * })
 * ```
 */
export function flyToProposal(
  map: MapboxMap,
  geometry: ProposalGeometry,
  options?: AnimationOptions & {
    /** Override pitch (default: 60 for 3D, 0 for 2D) */
    pitch?: number
    /** Override bearing (default: preserve current) */
    bearing?: number
  }
): void {
  const {
    duration = 2000,
    easing = 'cinematic',
    padding = 80,
    maxZoom = 18,
    pitch = 60,
    bearing,
    essential = true
  } = options || {}

  const { center, bounds } = getGeometryInfo(geometry)

  if (bounds && (geometry.type === 'Polygon' || geometry.type === 'LineString')) {
    // For polygons/lines, fit to bounds
    map.fitBounds(bounds as any, {
      padding,
      maxZoom,
      pitch,
      bearing: bearing ?? map.getBearing(),
      duration,
      easing: getEasingFunction(easing),
      essential
    })
  } else {
    // For points, fly to center
    const targetZoom = geometry.type === 'Point' ? 17 : 16

    map.flyTo({
      center: center as LngLatLike,
      zoom: Math.min(targetZoom, maxZoom),
      pitch,
      bearing: bearing ?? map.getBearing(),
      duration,
      easing: getEasingFunction(easing),
      essential
    })
  }
}

/**
 * Smoothly move camera to a position with custom easing.
 *
 * Lighter alternative to flyTo with more control over easing.
 *
 * @param map - Mapbox map instance
 * @param position - Target camera position
 * @param options - Animation options
 */
export function easeCameraTo(
  map: MapboxMap,
  position: Partial<CameraPosition>,
  options?: AnimationOptions
): void {
  const {
    duration = 1000,
    easing = 'easeInOutCubic',
    essential = true
  } = options || {}

  map.easeTo({
    center: position.lng !== undefined && position.lat !== undefined
      ? [position.lng, position.lat]
      : undefined,
    zoom: position.zoom,
    bearing: position.bearing,
    pitch: position.pitch,
    duration,
    easing: getEasingFunction(easing),
    essential
  } as EasingOptions)
}

/**
 * Create a circular orbit animation around a center point.
 *
 * Perfect for showcasing a proposal from all angles.
 * The camera maintains constant distance while rotating 360° around the target.
 *
 * @param map - Mapbox map instance
 * @param center - Center point to orbit around [lng, lat]
 * @param options - Orbit configuration
 * @returns Abort function to stop the animation
 *
 * @example
 * ```ts
 * // Orbit around a proposal for 10 seconds
 * const stopOrbit = orbitAround(map, [-58.46, -34.545], {
 *   duration: 10000,
 *   rotations: 2,
 *   pitch: 60
 * })
 *
 * // Stop early if needed
 * stopOrbit()
 * ```
 */
export function orbitAround(
  map: MapboxMap,
  center: [number, number],
  options?: OrbitOptions
): () => void {
  const {
    rotations = 1,
    duration = 10000,
    pitch = 60,
    zoom,
    easing = 'linear',
    onFrame,
    onComplete
  } = options || {}

  let startTime: number | null = null
  let animationId: number | null = null
  let isRunning = true

  const initialBearing = map.getBearing()
  const targetZoom = zoom ?? map.getZoom()
  const easingFn = getEasingFunction(easing)

  function animate(timestamp: number) {
    if (!isRunning) return

    if (startTime === null) {
      startTime = timestamp
    }

    const elapsed = timestamp - startTime
    const progress = Math.min(elapsed / duration, 1)
    const easedProgress = easingFn(progress)

    // Calculate bearing (full 360° rotation)
    const bearing = initialBearing + (easedProgress * 360 * rotations)

    // Update camera
    map.easeTo({
      center: center as LngLatLike,
      bearing: bearing % 360,
      pitch,
      zoom: targetZoom,
      duration: 0,
      easing: (t) => t // No easing on individual frames
    })

    // Callback
    onFrame?.(progress)

    // Continue or finish
    if (progress < 1) {
      animationId = requestAnimationFrame(animate)
    } else {
      isRunning = false
      onComplete?.()
    }
  }

  // Start animation
  animationId = requestAnimationFrame(animate)

  // Return abort function
  return () => {
    isRunning = false
    if (animationId !== null) {
      cancelAnimationFrame(animationId)
    }
  }
}

/**
 * Smoothly pan camera along a path (array of points).
 *
 * Creates a cinematic tour through multiple locations.
 *
 * @param map - Mapbox map instance
 * @param path - Array of camera positions
 * @param options - Animation options
 * @returns Promise that resolves when tour completes
 *
 * @example
 * ```ts
 * await tourPath(map, [
 *   { lng: -58.46, lat: -34.545, zoom: 15, pitch: 0 },
 *   { lng: -58.45, lat: -34.540, zoom: 17, pitch: 60 },
 *   { lng: -58.44, lat: -34.535, zoom: 16, pitch: 45 }
 * ], { duration: 2000 })
 * ```
 */
export async function tourPath(
  map: MapboxMap,
  path: CameraPosition[],
  options?: AnimationOptions & {
    /** Pause at each point in milliseconds (default: 0) */
    pauseDuration?: number
  }
): Promise<void> {
  const {
    duration = 2000,
    easing = 'cinematic',
    pauseDuration = 0
  } = options || {}

  for (let i = 0; i < path.length; i++) {
    const position = path[i]

    // Move to position
    await new Promise<void>((resolve) => {
      map.once('moveend', () => resolve())

      map.flyTo({
        center: [position.lng, position.lat],
        zoom: position.zoom,
        bearing: position.bearing ?? map.getBearing(),
        pitch: position.pitch ?? map.getPitch(),
        duration,
        easing: getEasingFunction(easing),
        essential: true
      })
    })

    // Pause at this position
    if (pauseDuration > 0 && i < path.length - 1) {
      await new Promise(resolve => setTimeout(resolve, pauseDuration))
    }
  }
}

/**
 * Smoothly zoom in or out with custom easing.
 *
 * @param map - Mapbox map instance
 * @param targetZoom - Target zoom level
 * @param options - Animation options
 */
export function zoomTo(
  map: MapboxMap,
  targetZoom: number,
  options?: AnimationOptions
): void {
  const {
    duration = 800,
    easing = 'easeOutQuad'
  } = options || {}

  map.easeTo({
    zoom: targetZoom,
    duration,
    easing: getEasingFunction(easing)
  })
}

/**
 * Reset camera to default position with animation.
 *
 * @param map - Mapbox map instance
 * @param defaultPosition - Default camera position
 * @param options - Animation options
 */
export function resetCamera(
  map: MapboxMap,
  defaultPosition?: Partial<CameraPosition>,
  options?: AnimationOptions
): void {
  const {
    duration = 1500,
    easing = 'easeInOutCubic'
  } = options || {}

  const position = {
    lng: -58.3816,  // Buenos Aires center
    lat: -34.6037,
    zoom: 14,
    bearing: 0,
    pitch: 60,
    ...defaultPosition
  }

  easeCameraTo(map, position, { duration, easing })
}

// ============================================================================
// ADVANCED ANIMATIONS
// ============================================================================

/**
 * Create a "reveal" animation - starts from high altitude, zooms in dramatically.
 *
 * Great for opening sequences or highlighting a specific location.
 *
 * @param map - Mapbox map instance
 * @param target - Target position to reveal
 * @param options - Animation options
 */
export function revealLocation(
  map: MapboxMap,
  target: CameraPosition,
  options?: AnimationOptions & {
    /** Starting altitude (default: 4) */
    startZoom?: number
  }
): void {
  const {
    startZoom = 4,
    duration = 3000,
    easing = 'cinematic'
  } = options || {}

  // First, jump to high altitude
  map.jumpTo({
    center: [target.lng, target.lat],
    zoom: startZoom,
    pitch: 0,
    bearing: target.bearing ?? 0
  })

  // Then, dramatically zoom in
  setTimeout(() => {
    map.flyTo({
      center: [target.lng, target.lat],
      zoom: target.zoom ?? 16,
      pitch: target.pitch ?? 60,
      bearing: target.bearing ?? 0,
      duration,
      easing: getEasingFunction(easing),
      essential: true
    })
  }, 100)
}
