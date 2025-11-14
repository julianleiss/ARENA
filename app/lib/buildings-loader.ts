/**
 * ARENA - Optimized Buildings Data Loader
 *
 * Provides async loading, caching, and viewport filtering for ba-buildings.json.
 * Optimizes performance by lazy-loading building data and filtering by viewport bounds.
 *
 * Key features:
 * - Async loading with dynamic import
 * - In-memory caching (single load per session)
 * - Viewport-based filtering
 * - TypeScript types for type safety
 * - Performance metrics logging
 *
 * @example
 * ```typescript
 * // Load all buildings (cached after first load)
 * const buildings = await loadBuildings()
 *
 * // Get only buildings in current viewport
 * const bounds = map.getBounds()
 * const visibleBuildings = await getBuildingsInBounds(bounds)
 * ```
 */

import type { LngLatBounds } from 'mapbox-gl'
import type { Feature, FeatureCollection, Polygon, MultiPolygon } from 'geojson'

// ============================================================================
// Types
// ============================================================================

/**
 * Building feature properties from OSM data
 */
export interface BuildingProperties {
  /** Unique building ID */
  id: string
  /** OSM building ID */
  osmId: string
  /** Feature type (always "building") */
  type: 'building'
  /** Building height in meters (as string) */
  height?: string
  /** Number of floors/levels */
  levels?: string
  /** Building name (if available) */
  name?: string
  /** Building type (e.g., "residential", "university", "commercial") */
  building?: string
  /** Building levels (alternative to "levels") */
  'building:levels'?: string
  /** Building material */
  'building:material'?: string
  /** Layer/elevation */
  layer?: string
  /** Operator/owner */
  operator?: string
  /** Roof shape */
  'roof:shape'?: string
  /** Wheelchair accessibility */
  wheelchair?: string
  /** Wikidata ID */
  wikidata?: string
  /** Wikipedia article */
  wikipedia?: string
  [key: string]: any // Allow additional OSM tags
}

/**
 * GeoJSON Feature for a building
 */
export type BuildingFeature = Feature<Polygon | MultiPolygon, BuildingProperties>

/**
 * GeoJSON FeatureCollection for buildings
 */
export type BuildingsData = FeatureCollection<Polygon | MultiPolygon, BuildingProperties>

/**
 * Bounding box [west, south, east, north] in decimal degrees
 */
export type BBox = [number, number, number, number]

// ============================================================================
// Cache
// ============================================================================

/**
 * In-memory cache for buildings data
 * Persists for the duration of the browser session
 */
let buildingsCache: BuildingsData | null = null

/**
 * Loading promise to prevent duplicate concurrent requests
 */
let loadingPromise: Promise<BuildingsData> | null = null

// ============================================================================
// Core Loading Functions
// ============================================================================

/**
 * Load buildings data asynchronously with caching.
 * Uses dynamic import to avoid blocking initial page load.
 * Data is cached in memory after first load.
 *
 * @returns Promise resolving to complete buildings dataset
 * @throws Error if buildings data cannot be loaded
 *
 * @example
 * ```typescript
 * const buildings = await loadBuildings()
 * console.log(`Loaded ${buildings.features.length} buildings`)
 * ```
 */
export async function loadBuildings(): Promise<BuildingsData> {
  // Return cached data if available
  if (buildingsCache) {
    console.log('📦 Using cached buildings data')
    return buildingsCache
  }

  // Return existing loading promise if already loading
  if (loadingPromise) {
    console.log('⏳ Buildings already loading, waiting...')
    return loadingPromise
  }

  // Start loading
  console.time('⏱️ Buildings load time')

  loadingPromise = (async () => {
    try {
      // Dynamic import to avoid blocking initial render
      const response = await fetch('/data/ba-buildings.json')

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json() as BuildingsData

      // Validate data structure
      if (!data || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
        throw new Error('Invalid buildings data format')
      }

      // Cache the data
      buildingsCache = data

      console.timeEnd('⏱️ Buildings load time')
      console.log(`✅ Loaded ${data.features.length} buildings (${Math.round(JSON.stringify(data).length / 1024)}KB)`)

      return data
    } catch (error) {
      console.error('❌ Failed to load buildings:', error)
      loadingPromise = null // Reset loading promise on error
      throw error
    }
  })()

  return loadingPromise
}

/**
 * Clear the buildings cache.
 * Useful for testing or force-reloading data.
 *
 * @example
 * ```typescript
 * clearBuildingsCache()
 * const freshData = await loadBuildings() // Will reload from server
 * ```
 */
export function clearBuildingsCache(): void {
  buildingsCache = null
  loadingPromise = null
  console.log('🗑️ Buildings cache cleared')
}

/**
 * Check if buildings data is currently cached.
 *
 * @returns true if data is in cache, false otherwise
 */
export function isBuildingsCached(): boolean {
  return buildingsCache !== null
}

// ============================================================================
// Viewport Filtering
// ============================================================================

/**
 * Get buildings within a geographic bounding box.
 * Filters buildings based on their centroid or first coordinate.
 *
 * @param bounds - Mapbox LngLatBounds object
 * @returns Promise resolving to filtered buildings data
 *
 * @example
 * ```typescript
 * const map = mapRef.current
 * const bounds = map.getBounds()
 * const visibleBuildings = await getBuildingsInBounds(bounds)
 * ```
 */
export async function getBuildingsInBounds(bounds: LngLatBounds): Promise<BuildingsData> {
  const allBuildings = await loadBuildings()

  // Extract bounds values
  const west = bounds.getWest()
  const south = bounds.getSouth()
  const east = bounds.getEast()
  const north = bounds.getNorth()

  console.time('⏱️ Buildings filter time')

  // Filter buildings by bounding box
  const filteredFeatures = allBuildings.features.filter(feature => {
    // Get first coordinate of the building polygon
    const coords = feature.geometry.type === 'Polygon'
      ? feature.geometry.coordinates[0][0]
      : feature.geometry.coordinates[0][0][0]

    // Ensure coords is an array of numbers
    const coordArray = Array.isArray(coords) ? coords : [coords]
    const [lng, lat] = coordArray as number[]

    // Check if point is within bounds
    const isInBounds = lng >= west && lng <= east && lat >= south && lat <= north

    return isInBounds
  })

  console.timeEnd('⏱️ Buildings filter time')
  console.log(`📍 Filtered to ${filteredFeatures.length} buildings in viewport (${Math.round(filteredFeatures.length / allBuildings.features.length * 100)}% of total)`)

  return {
    type: 'FeatureCollection',
    features: filteredFeatures
  }
}

/**
 * Get buildings within a custom bounding box.
 * Alternative to getBuildingsInBounds for when you have raw bbox values.
 *
 * @param bbox - Bounding box [west, south, east, north]
 * @returns Promise resolving to filtered buildings data
 *
 * @example
 * ```typescript
 * const bbox: BBox = [-58.50, -34.60, -58.40, -34.50]
 * const buildings = await getBuildingsInBBox(bbox)
 * ```
 */
export async function getBuildingsInBBox(bbox: BBox): Promise<BuildingsData> {
  const allBuildings = await loadBuildings()
  const [west, south, east, north] = bbox

  const filteredFeatures = allBuildings.features.filter(feature => {
    const coords = feature.geometry.type === 'Polygon'
      ? feature.geometry.coordinates[0][0]
      : feature.geometry.coordinates[0][0][0]

    const [lng, lat] = coords

    return lng >= west && lng <= east && lat >= south && lat <= north
  })

  return {
    type: 'FeatureCollection',
    features: filteredFeatures
  }
}

// ============================================================================
// Utilities
// ============================================================================

/**
 * Get building height in meters (parsed as number).
 * Handles string values from OSM data.
 *
 * @param feature - Building feature
 * @returns Height in meters, or undefined if not available
 *
 * @example
 * ```typescript
 * const height = getBuildingHeight(building) // 25.5
 * ```
 */
export function getBuildingHeight(feature: BuildingFeature): number | undefined {
  if (!feature.properties.height) return undefined
  const height = parseFloat(feature.properties.height)
  return isNaN(height) ? undefined : height
}

/**
 * Get building number of levels/floors.
 * Handles multiple OSM tags for levels.
 *
 * @param feature - Building feature
 * @returns Number of levels, or undefined if not available
 *
 * @example
 * ```typescript
 * const floors = getBuildingLevels(building) // 8
 * ```
 */
export function getBuildingLevels(feature: BuildingFeature): number | undefined {
  const levelsStr = feature.properties.levels || feature.properties['building:levels']
  if (!levelsStr) return undefined
  const levels = parseInt(levelsStr, 10)
  return isNaN(levels) ? undefined : levels
}

/**
 * Estimate building height from levels if height is not available.
 * Uses standard floor height of 3 meters.
 *
 * @param feature - Building feature
 * @returns Estimated height in meters, or undefined if no data
 *
 * @example
 * ```typescript
 * const height = estimateBuildingHeight(building) // 24 (for 8 floors)
 * ```
 */
export function estimateBuildingHeight(feature: BuildingFeature): number | undefined {
  // Try to get actual height first
  const height = getBuildingHeight(feature)
  if (height !== undefined) return height

  // Estimate from levels (3 meters per floor)
  const levels = getBuildingLevels(feature)
  if (levels !== undefined) return levels * 3

  return undefined
}

/**
 * Get building display name.
 * Falls back to building type if no name is available.
 *
 * @param feature - Building feature
 * @returns Display name for the building
 *
 * @example
 * ```typescript
 * const name = getBuildingName(building) // "Facultad de Ciencias Exactas" or "Residential Building"
 * ```
 */
export function getBuildingName(feature: BuildingFeature): string {
  if (feature.properties.name) return feature.properties.name

  const buildingType = feature.properties.building || 'building'
  return buildingType.charAt(0).toUpperCase() + buildingType.slice(1)
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Get statistics about the buildings dataset.
 *
 * @returns Promise resolving to dataset statistics
 *
 * @example
 * ```typescript
 * const stats = await getBuildingsStats()
 * console.log(`Average height: ${stats.avgHeight}m`)
 * ```
 */
export async function getBuildingsStats() {
  const buildings = await loadBuildings()

  let totalHeight = 0
  let buildingsWithHeight = 0
  let totalLevels = 0
  let buildingsWithLevels = 0

  const buildingTypes = new Map<string, number>()

  for (const feature of buildings.features) {
    // Heights
    const height = getBuildingHeight(feature)
    if (height !== undefined) {
      totalHeight += height
      buildingsWithHeight++
    }

    // Levels
    const levels = getBuildingLevels(feature)
    if (levels !== undefined) {
      totalLevels += levels
      buildingsWithLevels++
    }

    // Types
    const type = feature.properties.building || 'unknown'
    buildingTypes.set(type, (buildingTypes.get(type) || 0) + 1)
  }

  return {
    total: buildings.features.length,
    withHeight: buildingsWithHeight,
    withLevels: buildingsWithLevels,
    avgHeight: buildingsWithHeight > 0 ? totalHeight / buildingsWithHeight : 0,
    avgLevels: buildingsWithLevels > 0 ? totalLevels / buildingsWithLevels : 0,
    buildingTypes: Object.fromEntries(
      Array.from(buildingTypes.entries()).sort((a, b) => b[1] - a[1])
    )
  }
}
