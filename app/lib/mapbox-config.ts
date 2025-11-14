/**
 * ARENA - Mapbox GL JS Configuration
 *
 * Centralized configuration for Mapbox GL JS integration.
 * Provides predefined styles, viewport settings, and utilities
 * for Buenos Aires urban planning visualization.
 *
 * NOTE: This project uses Mapbox GL JS v3.
 * Mapbox cannot use mapbox:// style URLs - must use HTTPS URLs with access tokens.
 *
 * @see https://docs.mapbox.com/mapbox-gl-js/api/
 */

import type { LngLatBoundsLike, MapboxOptions } from 'mapbox-gl'

// ============================================================================
// TOKEN MANAGEMENT
// ============================================================================

/**
 * Get Mapbox access token from environment variables.
 * Throws error if token is missing to prevent silent failures.
 */
export function getMapboxToken(): string {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  if (!token) {
    throw new Error(
      'NEXT_PUBLIC_MAPBOX_TOKEN is not defined. ' +
      'Please add it to your .env.local file. ' +
      'Get your token at: https://account.mapbox.com/access-tokens/'
    )
  }

  return token
}

/**
 * Check if Mapbox token is configured (without throwing).
 * Useful for conditional rendering or fallback logic.
 */
export function hasMapboxToken(): boolean {
  return !!process.env.NEXT_PUBLIC_MAPBOX_TOKEN
}

// ============================================================================
// MAP STYLES
// ============================================================================

/**
 * Predefined Mapbox map style identifiers
 * NOTE: Using custom ARENA style as default
 */
export const MAPBOX_STYLES = {
  /** Custom ARENA style - optimized for civic engagement */
  ARENA: 'standard',

  /** Clean, minimal streets map - good for urban planning overlays */
  STREETS: 'streets',

  /** Light background - emphasizes data visualization */
  LIGHT: 'light-v10',

  /** Dark theme - good for night mode or dramatic visualizations */
  DARK: 'dark-v10',

  /** Outdoors style - shows parks, trails, terrain */
  OUTDOORS: 'outdoors-v11',

  /** Satellite imagery - good for real-world context */
  SATELLITE: 'satellite-v9',

  /** Satellite with streets overlay - balanced hybrid view */
  SATELLITE_STREETS: 'satellite-streets-v11',
} as const

/**
 * Get full HTTPS URL for a Mapbox style
 *
 * @param styleId - Style identifier (e.g., 'streets-v12')
 * @param accessToken - Mapbox access token (optional, uses env var if not provided)
 * @returns Full HTTPS URL to the Mapbox style JSON
 *
 * @example
 * ```ts
 * const styleUrl = getMapboxStyleUrl('streets-v12', token)
 * // Returns: https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=...
 * ```
 */
export function getMapboxStyleUrl(styleId: string, accessToken?: string): string {
  const token = accessToken || process.env.NEXT_PUBLIC_MAPBOX_TOKEN

  if (!token) {
    throw new Error('Mapbox access token is required')
  }

  return `https://api.mapbox.com/styles/v1/mapbox/${styleId}?access_token=${token}`
}

/**
 * Default style for ARENA (custom style optimized for civic engagement)
 */
export const DEFAULT_STYLE = MAPBOX_STYLES.ARENA

// ============================================================================
// BUENOS AIRES CONFIGURATION
// ============================================================================

/**
 * Geographic center of Buenos Aires
 * Coordinates: Obelisco de Buenos Aires (iconic landmark)
 */
export const BUENOS_AIRES_CENTER: [number, number] = [-58.3816, -34.6037]

/**
 * Núñez neighborhood center (university area from ba-buildings.json)
 * This is where most of the existing building data is located
 */
export const NUNEZ_CENTER: [number, number] = [-58.46, -34.545]

/**
 * Default viewport configuration for Buenos Aires
 */
export const DEFAULT_VIEWPORT = {
  /** Center point [longitude, latitude] */
  center: BUENOS_AIRES_CENTER,

  /** Initial zoom level (17 = building scale) */
  zoom: 17,

  /** Camera pitch in degrees (0 = top-down, 60 = 3D perspective) */
  pitch: 60,

  /** Map bearing/rotation in degrees (-17.6 matches city grid alignment) */
  bearing: -17.6,
} as const

/**
 * Viewport bounds to restrict map panning to Buenos Aires metropolitan area.
 * Prevents users from scrolling too far away from the area of interest.
 *
 * Bounds: [southwest, northeast] in [lng, lat] format
 */
export const BUENOS_AIRES_BOUNDS: LngLatBoundsLike = [
  [-58.53, -34.70],  // Southwest corner (Riachuelo, west of city)
  [-58.33, -34.52],  // Northeast corner (Rio de la Plata, north suburbs)
]

/**
 * Maximum bounds (wider area) for less restrictive panning
 */
export const BUENOS_AIRES_MAX_BOUNDS: LngLatBoundsLike = [
  [-58.65, -34.80],  // Southwest (includes La Matanza)
  [-58.20, -34.45],  // Northeast (includes Tigre/San Isidro)
]

// ============================================================================
// MAP CONFIGURATION PRESETS
// ============================================================================

/**
 * Configuration preset for the main map view (homepage)
 * Optimized for proposal visualization with 3D buildings
 *
 * NOTE: These presets use style IDs (not full URLs). MapboxView component
 * will convert them to full HTTPS URLs with access tokens.
 */
export const MAIN_MAP_CONFIG: Partial<MapboxOptions> = {
  style: DEFAULT_STYLE,
  center: BUENOS_AIRES_CENTER,
  zoom: 17,
  pitch: 60,
  bearing: -17.6,
  maxBounds: BUENOS_AIRES_MAX_BOUNDS,

  // Performance & interaction settings
  antialias: true,              // Smooth 3D rendering
  preserveDrawingBuffer: true,  // Required for deck.gl

  // UI controls
  attributionControl: true,
  customAttribution: ['ARENA v1.1 - Civic Engagement Platform'],

  // Interaction settings
  dragRotate: true,
  touchZoomRotate: true,
  touchPitch: true,
} as const

/**
 * Configuration preset for the sandbox editor (3D workspace)
 * Higher initial zoom for detailed editing
 */
export const SANDBOX_MAP_CONFIG: Partial<MapboxOptions> = {
  style: DEFAULT_STYLE,
  center: NUNEZ_CENTER,
  zoom: 18,                    // Closer zoom for editing
  pitch: 60,
  bearing: 0,
  maxBounds: BUENOS_AIRES_BOUNDS,

  // Performance
  antialias: true,
  preserveDrawingBuffer: true,

  // UI
  attributionControl: true,

  // Interaction
  dragRotate: true,
  touchZoomRotate: true,
  touchPitch: true,
} as const

/**
 * Configuration preset for read-only proposal previews
 * Simplified, no rotation or pitch controls
 */
export const PREVIEW_MAP_CONFIG: Partial<MapboxOptions> = {
  style: MAPBOX_STYLES.LIGHT,
  zoom: 16,
  pitch: 0,                    // Top-down view
  bearing: 0,

  // Disable most interactions for read-only view
  interactive: true,
  dragRotate: false,
  touchZoomRotate: false,
  touchPitch: false,

  // Minimal UI
  attributionControl: false,
  logoPosition: 'bottom-right',
} as const

// ============================================================================
// ZOOM LEVELS
// ============================================================================

/**
 * Semantic zoom levels for different scales of urban planning
 */
export const ZOOM_LEVELS = {
  /** City-wide view (shows entire Buenos Aires) */
  CITY: 11,

  /** Neighborhood scale (multiple blocks) */
  NEIGHBORHOOD: 14,

  /** Block scale (single city block) */
  BLOCK: 16,

  /** Building scale (individual buildings) */
  BUILDING: 18,

  /** Detail scale (for precise editing) */
  DETAIL: 20,
} as const

// ============================================================================
// UTILITIES
// ============================================================================

/**
 * Calculate optimal zoom level based on geometry bounds.
 * Useful for auto-fitting map to proposal or selection area.
 *
 * @param bounds - Geographic bounds [west, south, east, north]
 * @param containerWidth - Map container width in pixels
 * @param containerHeight - Map container height in pixels
 * @returns Optimal zoom level (number between 0-22)
 */
export function calculateOptimalZoom(
  bounds: [number, number, number, number],
  containerWidth: number,
  containerHeight: number
): number {
  const [west, south, east, north] = bounds

  // Calculate bounds dimensions in degrees
  const lngDiff = east - west
  const latDiff = north - south

  // Earth circumference at equator in meters
  const EARTH_CIRCUMFERENCE = 40075017

  // Calculate zoom based on container size and bounds
  const latZoom = Math.log2(containerHeight * 360 / (latDiff * 256))
  const lngZoom = Math.log2(containerWidth * 360 / (lngDiff * 256))

  // Use the more conservative (lower) zoom level
  const zoom = Math.min(latZoom, lngZoom)

  // Clamp between valid zoom range
  return Math.max(0, Math.min(22, zoom))
}

/**
 * Convert a GeoJSON geometry to map center and zoom.
 * Useful for centering map on a proposal geometry.
 *
 * @param geometry - GeoJSON geometry (Point, Polygon, LineString, etc.)
 * @returns Object with center [lng, lat] and suggested zoom level
 */
export function geometryToViewport(geometry: any): {
  center: [number, number]
  zoom: number
} {
  if (geometry.type === 'Point') {
    return {
      center: geometry.coordinates as [number, number],
      zoom: ZOOM_LEVELS.BUILDING,
    }
  }

  if (geometry.type === 'Polygon') {
    const coords = geometry.coordinates[0]
    const lngs = coords.map((c: [number, number]) => c[0])
    const lats = coords.map((c: [number, number]) => c[1])

    const center: [number, number] = [
      (Math.min(...lngs) + Math.max(...lngs)) / 2,
      (Math.min(...lats) + Math.max(...lats)) / 2,
    ]

    return {
      center,
      zoom: ZOOM_LEVELS.BLOCK,
    }
  }

  if (geometry.type === 'LineString') {
    const coords = geometry.coordinates
    const lngs = coords.map((c: [number, number]) => c[0])
    const lats = coords.map((c: [number, number]) => c[1])

    const center: [number, number] = [
      (Math.min(...lngs) + Math.max(...lngs)) / 2,
      (Math.min(...lats) + Math.max(...lats)) / 2,
    ]

    return {
      center,
      zoom: ZOOM_LEVELS.NEIGHBORHOOD,
    }
  }

  // Default fallback
  return {
    center: BUENOS_AIRES_CENTER,
    zoom: ZOOM_LEVELS.NEIGHBORHOOD,
  }
}

/**
 * Check if coordinates are within Buenos Aires bounds.
 * Useful for validation before creating proposals.
 *
 * @param lng - Longitude
 * @param lat - Latitude
 * @returns true if coordinates are within Buenos Aires area
 */
export function isWithinBuenosAires(lng: number, lat: number): boolean {
  const bounds = BUENOS_AIRES_MAX_BOUNDS as [[number, number], [number, number]]
  const [[westMax, southMax], [eastMax, northMax]] = bounds
  return lng >= westMax && lng <= eastMax && lat >= southMax && lat <= northMax
}

// ============================================================================
// TYPE EXPORTS
// ============================================================================

/**
 * Type for map style keys (for type-safe style selection)
 */
export type MapStyleKey = keyof typeof MAPBOX_STYLES

/**
 * Type for zoom level keys (for semantic zoom level selection)
 */
export type ZoomLevelKey = keyof typeof ZOOM_LEVELS

/**
 * Type for map configuration preset names
 */
export type MapConfigPreset = 'main' | 'sandbox' | 'preview'

/**
 * Get configuration preset by name
 */
export function getMapConfig(preset: MapConfigPreset): Partial<MapboxOptions> {
  switch (preset) {
    case 'main':
      return MAIN_MAP_CONFIG
    case 'sandbox':
      return SANDBOX_MAP_CONFIG
    case 'preview':
      return PREVIEW_MAP_CONFIG
    default:
      return MAIN_MAP_CONFIG
  }
}
