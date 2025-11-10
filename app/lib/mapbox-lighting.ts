/**
 * Mapbox Dynamic Lighting System for ARENA
 *
 * Provides cinematic lighting effects based on time of day.
 * Calculates sun position for Buenos Aires (-34.6037°) and applies
 * realistic lighting, atmosphere, and sky colors to Mapbox GL JS maps.
 *
 * Features:
 * - Dynamic sun position calculation
 * - Time-of-day based lighting (dawn, day, dusk, night)
 * - Atmospheric fog and haze
 * - Sky gradient colors
 *
 * @see https://docs.mapbox.com/mapbox-gl-js/api/map/#map#setlight
 * @see https://docs.mapbox.com/mapbox-gl-js/api/map/#map#setfog
 */

import type { Map as MapboxMap } from 'maplibre-gl'

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Buenos Aires latitude for sun position calculations
 */
export const BUENOS_AIRES_LAT = -34.6037

/**
 * Buenos Aires longitude (for future solar noon calculations)
 */
export const BUENOS_AIRES_LNG = -58.3816

/**
 * Time presets for quick access
 */
export const TIME_PRESETS = {
  MIDNIGHT: 0,
  SUNRISE: 6.5,   // ~6:30 AM
  MORNING: 9,
  NOON: 12,
  AFTERNOON: 15,
  GOLDEN_HOUR: 18.5, // ~6:30 PM
  SUNSET: 19.5,   // ~7:30 PM
  DUSK: 20.5,     // ~8:30 PM
  NIGHT: 22
} as const

// ============================================================================
// TYPES
// ============================================================================

/**
 * Time of day configuration
 */
export interface TimeOfDay {
  /** Hour of day (0-24, decimal for minutes, e.g., 6.5 = 6:30) */
  hour: number
  /** Formatted time string (HH:MM) */
  formatted: string
}

/**
 * Sun position in spherical coordinates
 */
export interface SunPosition {
  /** Azimuth angle in degrees (0-360, 0 = North, 90 = East) */
  azimuth: number
  /** Altitude/elevation angle in degrees (-90 to 90, 0 = horizon, 90 = zenith) */
  altitude: number
}

/**
 * Lighting configuration for different times of day
 */
export interface LightingConfig {
  /** Sun position */
  sun: SunPosition
  /** Ambient light intensity (0-1) */
  intensity: number
  /** Sky color (CSS color) */
  skyColor: string
  /** Horizon color (CSS color) */
  horizonColor: string
  /** Fog configuration */
  fog: {
    range: [number, number]    // [start, end] in km
    color: string
    highColor: string          // Horizon fog color
    spaceColor: string         // Zenith fog color
  }
}

// ============================================================================
// SUN POSITION CALCULATIONS
// ============================================================================

/**
 * Calculate sun position (azimuth and altitude) for a given time and latitude.
 *
 * Simplified solar position algorithm for visualization purposes.
 * Based on NOAA solar position calculations, adapted for Mapbox lighting.
 *
 * @param hour - Hour of day (0-24, decimal for fractional hours)
 * @param latitude - Latitude in degrees (default: Buenos Aires)
 * @returns Sun position with azimuth and altitude angles
 *
 * @example
 * ```ts
 * const noon = calculateSunPosition(12, -34.6037)
 * // { azimuth: 0, altitude: 79 } (nearly overhead in summer)
 *
 * const sunset = calculateSunPosition(19.5, -34.6037)
 * // { azimuth: 270, altitude: 0 } (on western horizon)
 * ```
 */
export function calculateSunPosition(
  hour: number,
  latitude: number = BUENOS_AIRES_LAT
): SunPosition {
  // Normalize hour to 0-24 range
  hour = ((hour % 24) + 24) % 24

  // Approximate day of year (use middle of year for consistency)
  const dayOfYear = 180

  // Solar declination (angle between sun and equator)
  // Ranges from -23.5° (winter solstice) to +23.5° (summer solstice)
  const declination = 23.45 * Math.sin((360 / 365) * (dayOfYear - 81) * Math.PI / 180)

  // Hour angle (sun's position in daily arc)
  // -180° at midnight, 0° at solar noon, +180° at midnight
  const hourAngle = 15 * (hour - 12) // 15° per hour

  // Convert to radians
  const latRad = latitude * Math.PI / 180
  const decRad = declination * Math.PI / 180
  const hourRad = hourAngle * Math.PI / 180

  // Calculate altitude (elevation above horizon)
  const sinAlt = Math.sin(latRad) * Math.sin(decRad) +
                 Math.cos(latRad) * Math.cos(decRad) * Math.cos(hourRad)
  const altitude = Math.asin(sinAlt) * 180 / Math.PI

  // Calculate azimuth (compass direction)
  const cosAzimuth = (Math.sin(decRad) - Math.sin(latRad) * sinAlt) /
                     (Math.cos(latRad) * Math.cos(Math.asin(sinAlt)))
  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAzimuth))) * 180 / Math.PI

  // Adjust azimuth based on time of day (before/after noon)
  if (hour > 12) {
    azimuth = 360 - azimuth
  }

  return {
    azimuth: Math.round(azimuth),
    altitude: Math.round(altitude * 10) / 10 // Round to 1 decimal
  }
}

/**
 * Get time period name for a given hour
 *
 * @param hour - Hour of day (0-24)
 * @returns Period name: 'night', 'dawn', 'day', 'dusk'
 */
export function getTimePeriod(hour: number): 'night' | 'dawn' | 'day' | 'dusk' {
  hour = ((hour % 24) + 24) % 24

  if (hour >= 5 && hour < 7) return 'dawn'
  if (hour >= 7 && hour < 18) return 'day'
  if (hour >= 18 && hour < 20.5) return 'dusk'
  return 'night'
}

// ============================================================================
// LIGHTING CONFIGURATION
// ============================================================================

/**
 * Generate complete lighting configuration for a given time of day.
 *
 * Combines sun position, ambient lighting, sky colors, and fog settings
 * to create realistic atmospheric effects.
 *
 * @param hour - Hour of day (0-24)
 * @param latitude - Latitude in degrees (default: Buenos Aires)
 * @returns Complete lighting configuration
 */
export function getLightingConfig(
  hour: number,
  latitude: number = BUENOS_AIRES_LAT
): LightingConfig {
  const sun = calculateSunPosition(hour, latitude)
  const period = getTimePeriod(hour)

  // Base configuration varies by time period
  switch (period) {
    case 'dawn':
      return {
        sun,
        intensity: 0.3 + (hour - 5) * 0.15, // 0.3 -> 0.6
        skyColor: interpolateColor('#1e3a8a', '#60a5fa', (hour - 5) / 2), // Deep blue -> light blue
        horizonColor: interpolateColor('#fbbf24', '#fcd34d', (hour - 5) / 2), // Orange -> yellow
        fog: {
          range: [0.5, 12],
          color: interpolateColor('#fbbf24', '#fcd34d', (hour - 5) / 2),
          highColor: interpolateColor('#fb923c', '#fbbf24', (hour - 5) / 2),
          spaceColor: interpolateColor('#1e3a8a', '#3b82f6', (hour - 5) / 2)
        }
      }

    case 'day':
      return {
        sun,
        intensity: 0.85,
        skyColor: '#60a5fa',   // Bright sky blue
        horizonColor: '#93c5fd', // Light blue
        fog: {
          range: [0.5, 10],
          color: '#e0f2fe',      // Very light blue
          highColor: '#bae6fd',  // Light cyan
          spaceColor: '#60a5fa'  // Sky blue
        }
      }

    case 'dusk':
      return {
        sun,
        intensity: 0.6 - (hour - 18) * 0.2, // 0.6 -> 0.1
        skyColor: interpolateColor('#3b82f6', '#1e3a8a', (hour - 18) / 2.5), // Blue -> deep blue
        horizonColor: interpolateColor('#fb923c', '#dc2626', (hour - 18) / 2.5), // Orange -> red
        fog: {
          range: [0.5, 15],
          color: interpolateColor('#fb923c', '#7c2d12', (hour - 18) / 2.5),
          highColor: interpolateColor('#ea580c', '#991b1b', (hour - 18) / 2.5),
          spaceColor: interpolateColor('#3b82f6', '#1e293b', (hour - 18) / 2.5)
        }
      }

    case 'night':
    default:
      return {
        sun,
        intensity: 0.1,
        skyColor: '#0f172a',    // Very dark blue (almost black)
        horizonColor: '#1e293b', // Dark slate
        fog: {
          range: [0.5, 20],
          color: '#0f172a',
          highColor: '#1e293b',
          spaceColor: '#020617'  // Near black
        }
      }
  }
}

/**
 * Interpolate between two hex colors
 *
 * @param color1 - Start color (hex format)
 * @param color2 - End color (hex format)
 * @param factor - Interpolation factor (0-1, 0 = color1, 1 = color2)
 * @returns Interpolated color (hex format)
 */
function interpolateColor(color1: string, color2: string, factor: number): string {
  // Clamp factor to 0-1
  factor = Math.max(0, Math.min(1, factor))

  // Parse hex colors
  const c1 = parseInt(color1.slice(1), 16)
  const c2 = parseInt(color2.slice(1), 16)

  const r1 = (c1 >> 16) & 0xff
  const g1 = (c1 >> 8) & 0xff
  const b1 = c1 & 0xff

  const r2 = (c2 >> 16) & 0xff
  const g2 = (c2 >> 8) & 0xff
  const b2 = c2 & 0xff

  // Interpolate
  const r = Math.round(r1 + (r2 - r1) * factor)
  const g = Math.round(g1 + (g2 - g1) * factor)
  const b = Math.round(b1 + (b2 - b1) * factor)

  // Convert back to hex
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`
}

// ============================================================================
// MAPBOX INTEGRATION
// ============================================================================

/**
 * Apply lighting configuration to a Mapbox map.
 *
 * Updates the map's light source, fog, and sky layer to match the time of day.
 * Works with Mapbox Standard style (v3+ with 3D lighting support).
 *
 * @param map - Mapbox map instance
 * @param hour - Hour of day (0-24)
 * @param options - Optional configuration
 *
 * @example
 * ```ts
 * // Set to golden hour
 * updateMapLighting(map, 18.5)
 *
 * // Set to noon with custom animation
 * updateMapLighting(map, 12, { animated: true, duration: 2000 })
 * ```
 */
export function updateMapLighting(
  map: MapboxMap,
  hour: number,
  options?: {
    /** Animate transition (default: true) */
    animated?: boolean
    /** Animation duration in ms (default: 1000) */
    duration?: number
    /** Enable fog effects (default: true) */
    enableFog?: boolean
  }
): void {
  // Safety check: ensure map is loaded and has a style
  if (!map || !map.loaded() || !map.getStyle()) {
    console.debug('Map not ready for lighting updates')
    return
  }

  const {
    animated = true,
    duration = 1000,
    enableFog = true
  } = options || {}

  const config = getLightingConfig(hour)

  // Update light source (if using 3D style)
  try {
    // Mapbox Standard style uses a different lighting API
    // For standard style, we set the light direction and intensity
    if (map.getStyle()?.name?.includes('Standard') || map.getStyle()?.sprite?.includes('standard')) {
      // Standard style uses setConfigProperty for lighting
      map.setConfigProperty('basemap', 'lightPreset', 'dusk')
    } else {
      // For other styles, use traditional light API
      map.setLight({
        anchor: 'viewport',
        position: [
          1.15, // x: slightly offset for realism
          config.sun.azimuth,
          config.sun.altitude
        ],
        intensity: config.intensity,
        color: config.skyColor
      } as any)
    }
  } catch (err) {
    console.warn('Could not update map lighting:', err)
  }

  // Update fog (atmospheric perspective)
  if (enableFog) {
    try {
      map.setFog({
        range: config.fog.range,
        color: config.fog.color,
        'high-color': config.fog.highColor,
        'space-color': config.fog.spaceColor,
        'horizon-blend': 0.1,
        'star-intensity': getTimePeriod(hour) === 'night' ? 0.6 : 0
      } as any)
    } catch (err) {
      console.warn('Could not update fog:', err)
    }
  }

  // Update sky layer (if it exists)
  try {
    // Check if map is loaded and style exists
    if (map.loaded() && map.getStyle() && map.getLayer('sky')) {
      map.setPaintProperty('sky', 'sky-atmosphere-sun', [
        config.sun.azimuth,
        config.sun.altitude
      ])

      map.setPaintProperty('sky', 'sky-gradient-center', [0, 0])
      map.setPaintProperty('sky', 'sky-gradient-radius', 90)
      map.setPaintProperty('sky', 'sky-gradient', [
        'interpolate',
        ['linear'],
        ['sky-radial-progress'],
        0, config.fog.spaceColor,    // Zenith
        0.8, config.skyColor,         // Sky
        1, config.horizonColor        // Horizon
      ])
    }
  } catch (err) {
    // Sky layer might not exist, that's okay
    console.debug('Sky layer not available:', err)
  }
}

/**
 * Initialize cinematic lighting on a map.
 *
 * Sets up the sky layer and initial lighting based on current time or specified hour.
 *
 * @param map - Mapbox map instance
 * @param hour - Initial hour (default: current local time)
 */
export function initializeMapLighting(map: MapboxMap, hour?: number): void {
  // Use current time if not specified
  if (hour === undefined) {
    const now = new Date()
    hour = now.getHours() + now.getMinutes() / 60
  }

  // Add sky layer if it doesn't exist
  try {
    // Check if map is loaded and style exists before accessing layers
    if (map.loaded() && map.getStyle() && !map.getLayer('sky')) {
      map.addLayer({
        id: 'sky',
        type: 'sky',
        paint: {
          'sky-type': 'atmosphere',
          'sky-atmosphere-sun-intensity': 5
        }
      } as any)
    }
  } catch (err) {
    console.warn('Could not add sky layer:', err)
  }

  // Apply initial lighting
  updateMapLighting(map, hour, { animated: false })
}

// ============================================================================
// TIME UTILITIES
// ============================================================================

/**
 * Format hour to HH:MM string
 *
 * @param hour - Hour of day (0-24, decimal)
 * @returns Formatted time string (e.g., "14:30")
 */
export function formatTime(hour: number): string {
  hour = ((hour % 24) + 24) % 24
  const h = Math.floor(hour)
  const m = Math.round((hour - h) * 60)
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`
}

/**
 * Parse time string to decimal hour
 *
 * @param timeString - Time string in HH:MM format
 * @returns Hour as decimal (e.g., "14:30" -> 14.5)
 */
export function parseTime(timeString: string): number {
  const [h, m] = timeString.split(':').map(Number)
  return h + (m || 0) / 60
}

/**
 * Get current local time as decimal hour
 *
 * @returns Current hour (0-24)
 */
export function getCurrentHour(): number {
  const now = new Date()
  return now.getHours() + now.getMinutes() / 60
}
