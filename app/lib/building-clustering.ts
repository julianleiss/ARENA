/**
 * ARENA - Building Clustering Configuration
 *
 * Provides clustering configuration for Mapbox GL JS to efficiently
 * render large numbers of buildings at different zoom levels.
 *
 * Uses Mapbox's native clustering (via GeoJSON source) for optimal performance.
 * Automatically aggregates buildings when zoomed out and shows individuals when zoomed in.
 *
 * Key features:
 * - Native Mapbox clustering (GPU-accelerated)
 * - Configurable cluster radius and thresholds
 * - Zoom-based LOD (Level of Detail)
 * - Cluster aggregate properties (avg height, count)
 *
 * @see https://docs.mapbox.com/mapbox-gl-js/example/cluster/
 */

import mapboxgl from 'mapbox-gl'
import type { BuildingsData, BuildingFeature } from './buildings-loader'
import { estimateBuildingHeight } from './buildings-loader'

// Type for GeoJSON source options
type GeoJSONSourceOptions = mapboxgl.GeoJSONSourceSpecification

// ============================================================================
// Constants
// ============================================================================

/**
 * Zoom level thresholds for different rendering strategies
 */
export const ZOOM_THRESHOLDS = {
  /** Below this zoom: Show clusters only */
  CLUSTER_ONLY: 13,

  /** Between CLUSTER_ONLY and BUILDINGS: Show simplified footprints */
  SIMPLIFIED: 15,

  /** Above this zoom: Show full 3D buildings with extrusion */
  BUILDINGS_3D: 15,

  /** Above this zoom: Show detailed 3D buildings with all properties */
  DETAILED: 17
} as const

/**
 * Cluster configuration presets
 */
export const CLUSTER_CONFIG = {
  /** Cluster radius in pixels (how far apart clusters should be) */
  CLUSTER_RADIUS: 50,

  /** Maximum zoom to cluster points on (zoom >= this will show individual buildings) */
  CLUSTER_MAX_ZOOM: 14,

  /** Minimum number of buildings to form a cluster */
  CLUSTER_MIN_POINTS: 2
} as const

// ============================================================================
// Types
// ============================================================================

/**
 * Cluster aggregate properties calculated from clustered buildings
 */
export interface ClusterProperties {
  /** Total number of buildings in cluster */
  point_count: number

  /** Average building height in cluster */
  avg_height: number

  /** Maximum building height in cluster */
  max_height: number

  /** Number of buildings with height data */
  buildings_with_height: number
}

/**
 * Enhanced building feature with cluster support
 */
export interface ClusterableBuildingFeature extends BuildingFeature {
  properties: BuildingFeature['properties'] & {
    /** Estimated height for clustering (pre-calculated) */
    _cluster_height?: number
  }
}

// ============================================================================
// GeoJSON Source Configuration
// ============================================================================

/**
 * Create Mapbox GeoJSON source options with clustering enabled.
 * Use this to create a data source for the buildings layer.
 *
 * @param options - Optional overrides for clustering configuration
 * @returns GeoJSON source options for Mapbox
 *
 * @example
 * ```typescript
 * const sourceOptions = createBuildingsSourceOptions()
 * map.addSource('buildings', {
 *   ...sourceOptions,
 *   data: buildingsGeoJSON
 * })
 * ```
 */
export function createBuildingsSourceOptions(
  options?: Partial<GeoJSONSourceOptions>
): GeoJSONSourceOptions {
  return {
    type: 'geojson',

    // Enable clustering
    cluster: true,
    clusterMaxZoom: CLUSTER_CONFIG.CLUSTER_MAX_ZOOM,
    clusterRadius: CLUSTER_CONFIG.CLUSTER_RADIUS,

    // Cluster properties: calculate aggregates
    clusterProperties: {
      // Average height of buildings in cluster
      avg_height: [
        ['/', ['+', ['accumulated'], ['get', '_cluster_height']], ['get', 'point_count']],
        ['coalesce', ['get', '_cluster_height'], 0]
      ] as any,

      // Max height of buildings in cluster
      max_height: [
        ['max', ['accumulated'], ['get', '_cluster_height']],
        ['coalesce', ['get', '_cluster_height'], 0]
      ] as any,

      // Count of buildings with height data
      buildings_with_height: [
        ['+', ['accumulated'], ['case', ['has', '_cluster_height'], 1, 0]],
        ['case', ['has', '_cluster_height'], 1, 0]
      ] as any
    },

    // Tolerance for geometry simplification (improves performance)
    tolerance: 0.375,

    // Buffer around tile to avoid edge clipping
    buffer: 128,

    // Generate unique IDs for features
    generateId: true,

    // Override with custom options
    ...options
  }
}

/**
 * Create simplified GeoJSON source (no clustering) for high zoom levels.
 * Use when zoom >= ZOOM_THRESHOLDS.BUILDINGS_3D for better detail.
 *
 * @param options - Optional GeoJSON source options
 * @returns GeoJSON source options without clustering
 *
 * @example
 * ```typescript
 * const sourceOptions = createSimpleBuildingsSourceOptions()
 * map.addSource('buildings-detailed', {
 *   ...sourceOptions,
 *   data: buildingsGeoJSON
 * })
 * ```
 */
export function createSimpleBuildingsSourceOptions(
  options?: Partial<GeoJSONSourceOptions>
): GeoJSONSourceOptions {
  return {
    type: 'geojson',
    cluster: false,
    tolerance: 0.1, // Less tolerance for detailed view
    buffer: 64,
    generateId: true,
    ...options
  }
}

// ============================================================================
// Data Preparation
// ============================================================================

/**
 * Prepare buildings data for clustering by adding computed properties.
 * Adds _cluster_height property for cluster aggregation.
 *
 * @param buildings - Raw buildings GeoJSON data
 * @returns Enhanced buildings data ready for clustering
 *
 * @example
 * ```typescript
 * const rawBuildings = await loadBuildings()
 * const clusterableBuildings = prepareBuildingsForClustering(rawBuildings)
 * map.getSource('buildings').setData(clusterableBuildings)
 * ```
 */
export function prepareBuildingsForClustering(
  buildings: BuildingsData
): BuildingsData {
  console.time('⏱️ Prepare buildings for clustering')

  const enhancedFeatures: ClusterableBuildingFeature[] = buildings.features.map(feature => {
    // Calculate height for clustering
    const height = estimateBuildingHeight(feature)

    return {
      ...feature,
      properties: {
        ...feature.properties,
        // Add pre-calculated height for cluster aggregation
        _cluster_height: height
      }
    }
  })

  console.timeEnd('⏱️ Prepare buildings for clustering')

  return {
    type: 'FeatureCollection',
    features: enhancedFeatures
  }
}

// ============================================================================
// Cluster Styling Helpers
// ============================================================================

/**
 * Generate cluster circle radius based on point count.
 * Creates a step expression for Mapbox paint properties.
 *
 * @returns Mapbox expression for cluster circle radius
 *
 * @example
 * ```typescript
 * map.addLayer({
 *   id: 'clusters',
 *   type: 'circle',
 *   source: 'buildings',
 *   filter: ['has', 'point_count'],
 *   paint: {
 *     'circle-radius': getClusterRadiusExpression()
 *   }
 * })
 * ```
 */
export function getClusterRadiusExpression() {
  return [
    'step',
    ['get', 'point_count'],
    15,  // radius for < 10 buildings
    10, 20,  // radius for >= 10 buildings
    30, 25,  // radius for >= 30 buildings
    50, 30,  // radius for >= 50 buildings
    100, 35  // radius for >= 100 buildings
  ] as any
}

/**
 * Generate cluster circle color based on average height.
 * Creates a step expression for color coding by building height.
 *
 * @returns Mapbox expression for cluster circle color
 *
 * @example
 * ```typescript
 * map.addLayer({
 *   id: 'clusters',
 *   type: 'circle',
 *   paint: {
 *     'circle-color': getClusterColorExpression()
 *   }
 * })
 * ```
 */
export function getClusterColorExpression() {
  return [
    'step',
    ['get', 'avg_height'],
    '#51bbd6',  // < 10m (low buildings) - cyan
    10, '#f1f075',  // 10-20m (medium-low) - yellow
    20, '#f28cb1',  // 20-40m (medium) - pink
    40, '#e55e5e',  // 40-60m (medium-high) - red
    60, '#8b4789'   // >= 60m (tall buildings) - purple
  ] as any
}

/**
 * Generate cluster text size based on point count.
 *
 * @returns Mapbox expression for cluster label size
 */
export function getClusterTextSizeExpression() {
  return [
    'step',
    ['get', 'point_count'],
    12,  // < 10 buildings
    10, 14,  // >= 10 buildings
    30, 16,  // >= 30 buildings
    100, 18  // >= 100 buildings
  ] as any
}

// ============================================================================
// LOD Helpers
// ============================================================================

/**
 * Get appropriate rendering mode based on zoom level.
 *
 * @param zoom - Current map zoom level
 * @returns Rendering mode for current zoom
 *
 * @example
 * ```typescript
 * const mode = getRenderingMode(map.getZoom())
 * if (mode === 'clusters') {
 *   // Show clusters
 * } else if (mode === '3d') {
 *   // Show 3D buildings
 * }
 * ```
 */
export function getRenderingMode(zoom: number): 'clusters' | 'simplified' | '3d' | 'detailed' {
  if (zoom < ZOOM_THRESHOLDS.CLUSTER_ONLY) {
    return 'clusters'
  } else if (zoom < ZOOM_THRESHOLDS.SIMPLIFIED) {
    return 'simplified'
  } else if (zoom < ZOOM_THRESHOLDS.DETAILED) {
    return '3d'
  } else {
    return 'detailed'
  }
}

/**
 * Check if clusters should be visible at current zoom.
 *
 * @param zoom - Current map zoom level
 * @returns true if clusters should be shown
 */
export function shouldShowClusters(zoom: number): boolean {
  return zoom < ZOOM_THRESHOLDS.CLUSTER_ONLY
}

/**
 * Check if 3D buildings should be visible at current zoom.
 *
 * @param zoom - Current map zoom level
 * @returns true if 3D buildings should be shown
 */
export function shouldShow3DBuildings(zoom: number): boolean {
  return zoom >= ZOOM_THRESHOLDS.BUILDINGS_3D
}

/**
 * Get extrusion opacity based on zoom level for smooth transitions.
 *
 * @param zoom - Current map zoom level
 * @returns Opacity value (0-1)
 */
export function getExtrusionOpacity(zoom: number): number {
  if (zoom < ZOOM_THRESHOLDS.SIMPLIFIED) return 0
  if (zoom < ZOOM_THRESHOLDS.BUILDINGS_3D) {
    // Fade in from SIMPLIFIED to BUILDINGS_3D
    const range = ZOOM_THRESHOLDS.BUILDINGS_3D - ZOOM_THRESHOLDS.SIMPLIFIED
    const progress = (zoom - ZOOM_THRESHOLDS.SIMPLIFIED) / range
    return progress * 0.8
  }
  return 0.8
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Get cluster statistics from a clustered GeoJSON source.
 * Useful for debugging and analytics.
 *
 * @param map - Mapbox map instance
 * @param sourceId - ID of the clustered GeoJSON source
 * @returns Cluster statistics
 *
 * @example
 * ```typescript
 * const stats = getClusterStats(map, 'buildings')
 * console.log(`${stats.clusterCount} clusters, ${stats.unclustered} individual buildings`)
 * ```
 */
export function getClusterStats(map: any, sourceId: string) {
  const source = map.getSource(sourceId)
  if (!source || source.type !== 'geojson') {
    throw new Error(`Source '${sourceId}' is not a GeoJSON source`)
  }

  // Get features from source
  const features = map.querySourceFeatures(sourceId)

  let clusterCount = 0
  let unclusteredCount = 0
  let totalPoints = 0

  features.forEach((feature: any) => {
    if (feature.properties.cluster) {
      clusterCount++
      totalPoints += feature.properties.point_count
    } else {
      unclusteredCount++
    }
  })

  return {
    clusterCount,
    unclustered: unclusteredCount,
    totalPoints,
    averageClusterSize: clusterCount > 0 ? totalPoints / clusterCount : 0
  }
}
