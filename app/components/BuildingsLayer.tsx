'use client'

/**
 * BuildingsLayer - Optimized 3D Buildings Rendering for Mapbox
 *
 * Manages loading and rendering of ba-buildings.json with:
 * - Lazy loading (not blocking initial page load)
 * - Viewport-based filtering
 * - Automatic clustering at low zoom levels
 * - LOD (Level of Detail) system
 * - Mapbox native 3D extrusion for performance
 *
 * Usage:
 * ```tsx
 * <MapboxView ref={mapRef} onMapLoad={(map) => setMap(map)}>
 *   <BuildingsLayer map={map} />
 * </MapboxView>
 * ```
 */

import { useEffect, useState, useRef, useCallback } from 'react'
import mapboxgl from 'mapbox-gl'
import {
  loadBuildings
} from '@/app/lib/buildings-loader'
import {
  createBuildingsSourceOptions,
  prepareBuildingsForClustering,
  getClusterRadiusExpression,
  getClusterColorExpression,
  getClusterTextSizeExpression,
  ZOOM_THRESHOLDS
} from '@/app/lib/building-clustering'

// ============================================================================
// Types
// ============================================================================

interface BuildingsLayerProps {
  /** Mapbox map instance (from MapboxView onMapLoad) */
  map: mapboxgl.Map | null

  /** Enable viewport-based filtering (default: true) */
  enableViewportFiltering?: boolean

  /** Enable clustering (default: true) */
  enableClustering?: boolean

  /** Enable 3D extrusion (default: true) */
  enable3D?: boolean

  /** Loading indicator callback */
  onLoadingChange?: (loading: boolean) => void

  /** Error callback */
  onError?: (error: Error) => void

  /** Layer click callback (returns building feature) */
  onBuildingClick?: (feature: any) => void

  /** Layer hover callback (returns building feature or null) */
  onBuildingHover?: (feature: any | null) => void
}

// ============================================================================
// Constants
// ============================================================================

const SOURCE_ID = 'arena-buildings'
const CLUSTER_LAYER_ID = 'arena-buildings-clusters'
const CLUSTER_COUNT_LAYER_ID = 'arena-buildings-cluster-count'
const BUILDINGS_LAYER_ID = 'arena-buildings-3d'
const BUILDINGS_FOOTPRINT_LAYER_ID = 'arena-buildings-footprint'

// ============================================================================
// Component
// ============================================================================

export default function BuildingsLayer({
  map,
  enableViewportFiltering = true,
  enableClustering = true,
  enable3D = true,
  onLoadingChange,
  onError,
  onBuildingClick,
  onBuildingHover
}: BuildingsLayerProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [isLayersAdded, setIsLayersAdded] = useState(false)
  const loadingRef = useRef(false) // Prevent duplicate loads

  // ============================================================================
  // Load Buildings Data
  // ============================================================================

  const loadAndAddBuildings = useCallback(async () => {
    if (!map || loadingRef.current) return
    if (isLayersAdded) return // Already added

    console.log('🏗️ Loading buildings layer...')

    loadingRef.current = true
    setIsLoading(true)
    onLoadingChange?.(true)

    try {
      // Load buildings data (cached after first load)
      const buildings = await loadBuildings()

      // Prepare data for clustering (adds computed properties)
      const clusterableBuildings = enableClustering
        ? prepareBuildingsForClustering(buildings)
        : buildings

      // Add GeoJSON source
      if (!map.getSource(SOURCE_ID)) {
        const sourceOptions = enableClustering
          ? createBuildingsSourceOptions()
          : createBuildingsSourceOptions({ cluster: false })

        map.addSource(SOURCE_ID, {
          ...sourceOptions,
          data: clusterableBuildings
        })

        console.log('✅ Buildings source added')
      }

      // Add layers
      addLayers()

      setIsLayersAdded(true)
      console.log('✅ Buildings layers added')

    } catch (error) {
      console.error('❌ Failed to load buildings:', error)
      onError?.(error instanceof Error ? error : new Error('Failed to load buildings'))
    } finally {
      setIsLoading(false)
      onLoadingChange?.(false)
      loadingRef.current = false
    }
  }, [map, enableClustering, isLayersAdded, onLoadingChange, onError])

  // ============================================================================
  // Add Map Layers
  // ============================================================================

  const addLayers = useCallback(() => {
    if (!map) return

    // Remove existing layers if they exist (cleanup)
    const layersToRemove = [
      CLUSTER_LAYER_ID,
      CLUSTER_COUNT_LAYER_ID,
      BUILDINGS_FOOTPRINT_LAYER_ID,
      BUILDINGS_LAYER_ID
    ]
    layersToRemove.forEach(layerId => {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId)
      }
    })

    // ========================================================================
    // LAYER 1: Cluster Circles (visible at low zoom)
    // ========================================================================

    if (enableClustering) {
      map.addLayer({
        id: CLUSTER_LAYER_ID,
        type: 'circle',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': getClusterColorExpression(),
          'circle-radius': getClusterRadiusExpression(),
          'circle-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            ZOOM_THRESHOLDS.CLUSTER_ONLY - 1, 0.8,
            ZOOM_THRESHOLDS.CLUSTER_ONLY, 0.4,
            ZOOM_THRESHOLDS.CLUSTER_ONLY + 1, 0
          ],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
          'circle-stroke-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            ZOOM_THRESHOLDS.CLUSTER_ONLY - 1, 0.8,
            ZOOM_THRESHOLDS.CLUSTER_ONLY, 0.4,
            ZOOM_THRESHOLDS.CLUSTER_ONLY + 1, 0
          ]
        },
        maxzoom: ZOOM_THRESHOLDS.CLUSTER_ONLY + 1
      })

      // ========================================================================
      // LAYER 2: Cluster Count Labels
      // ========================================================================

      map.addLayer({
        id: CLUSTER_COUNT_LAYER_ID,
        type: 'symbol',
        source: SOURCE_ID,
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-font': ['DIN Offc Pro Medium', 'Arial Unicode MS Bold'],
          'text-size': getClusterTextSizeExpression()
        },
        paint: {
          'text-color': '#ffffff',
          'text-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            ZOOM_THRESHOLDS.CLUSTER_ONLY - 1, 1,
            ZOOM_THRESHOLDS.CLUSTER_ONLY, 0.5,
            ZOOM_THRESHOLDS.CLUSTER_ONLY + 1, 0
          ]
        },
        maxzoom: ZOOM_THRESHOLDS.CLUSTER_ONLY + 1
      })
    }

    // ========================================================================
    // LAYER 3: Building Footprints (simplified, medium zoom)
    // ========================================================================

    map.addLayer({
      id: BUILDINGS_FOOTPRINT_LAYER_ID,
      type: 'fill',
      source: SOURCE_ID,
      filter: enableClustering ? ['!', ['has', 'point_count']] : undefined,
      paint: {
        'fill-color': [
          'interpolate',
          ['linear'],
          ['coalesce', ['get', '_cluster_height'], 10],
          0, '#e0e0e0',
          10, '#51bbd6',
          20, '#f1f075',
          40, '#f28cb1',
          60, '#e55e5e'
        ],
        'fill-opacity': [
          'interpolate',
          ['linear'],
          ['zoom'],
          ZOOM_THRESHOLDS.CLUSTER_ONLY, 0,
          ZOOM_THRESHOLDS.SIMPLIFIED, 0.6,
          ZOOM_THRESHOLDS.BUILDINGS_3D, 0.2,
          ZOOM_THRESHOLDS.BUILDINGS_3D + 0.5, 0
        ],
        'fill-outline-color': '#666'
      },
      minzoom: ZOOM_THRESHOLDS.CLUSTER_ONLY,
      maxzoom: ZOOM_THRESHOLDS.BUILDINGS_3D + 1
    })

    // ========================================================================
    // LAYER 4: 3D Extruded Buildings (high zoom)
    // ========================================================================

    if (enable3D) {
      map.addLayer({
        id: BUILDINGS_LAYER_ID,
        type: 'fill-extrusion',
        source: SOURCE_ID,
        filter: enableClustering ? ['!', ['has', 'point_count']] : undefined,
        paint: {
          // Height in meters
          'fill-extrusion-height': [
            'coalesce',
            ['get', '_cluster_height'],
            10 // Default height for buildings without height data
          ],

          // Base height (always 0 for buildings)
          'fill-extrusion-base': 0,

          // Color by height
          'fill-extrusion-color': [
            'interpolate',
            ['linear'],
            ['coalesce', ['get', '_cluster_height'], 10],
            0, '#e0e0e0',
            10, '#51bbd6',
            20, '#f1f075',
            40, '#f28cb1',
            60, '#e55e5e',
            100, '#8b4789'
          ],

          // Opacity with smooth fade-in
          'fill-extrusion-opacity': [
            'interpolate',
            ['linear'],
            ['zoom'],
            ZOOM_THRESHOLDS.SIMPLIFIED, 0,
            ZOOM_THRESHOLDS.BUILDINGS_3D, 0.7,
            ZOOM_THRESHOLDS.DETAILED, 0.8
          ]
        },
        minzoom: ZOOM_THRESHOLDS.SIMPLIFIED
      })
    }

    console.log('✅ All building layers configured')

  }, [map, enableClustering, enable3D])

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const handleClick = useCallback((e: mapboxgl.MapLayerMouseEvent) => {
    if (!map || !onBuildingClick) return

    const features = map.queryRenderedFeatures(e.point, {
      layers: [BUILDINGS_LAYER_ID, BUILDINGS_FOOTPRINT_LAYER_ID]
    })

    if (features.length > 0) {
      onBuildingClick(features[0])
    }
  }, [map, onBuildingClick])

  const handleHover = useCallback((e: mapboxgl.MapLayerMouseEvent) => {
    if (!map || !onBuildingHover) return

    const features = map.queryRenderedFeatures(e.point, {
      layers: [BUILDINGS_LAYER_ID, BUILDINGS_FOOTPRINT_LAYER_ID]
    })

    if (features.length > 0) {
      map.getCanvas().style.cursor = 'pointer'
      onBuildingHover(features[0])
    } else {
      map.getCanvas().style.cursor = ''
      onBuildingHover(null)
    }
  }, [map, onBuildingHover])

  const handleMouseLeave = useCallback(() => {
    if (!map) return
    map.getCanvas().style.cursor = ''
    onBuildingHover?.(null)
  }, [map, onBuildingHover])

  // ============================================================================
  // Effects
  // ============================================================================

  // Initialize: Load buildings when map is ready
  useEffect(() => {
    if (!map) return

    // Wait for map to be fully loaded
    if (!map.isStyleLoaded()) {
      const handleStyleLoad = () => {
        loadAndAddBuildings()
      }
      map.once('load', handleStyleLoad)
      return () => {
        map.off('load', handleStyleLoad)
      }
    } else {
      // Map already loaded, add buildings immediately
      loadAndAddBuildings()
    }
  }, [map, loadAndAddBuildings])

  // Add event listeners
  useEffect(() => {
    if (!map || !isLayersAdded) return

    // Click events
    if (onBuildingClick) {
      map.on('click', BUILDINGS_LAYER_ID, handleClick)
      map.on('click', BUILDINGS_FOOTPRINT_LAYER_ID, handleClick)
    }

    // Hover events
    if (onBuildingHover) {
      map.on('mousemove', BUILDINGS_LAYER_ID, handleHover)
      map.on('mousemove', BUILDINGS_FOOTPRINT_LAYER_ID, handleHover)
      map.on('mouseleave', BUILDINGS_LAYER_ID, handleMouseLeave)
      map.on('mouseleave', BUILDINGS_FOOTPRINT_LAYER_ID, handleMouseLeave)
    }

    return () => {
      if (onBuildingClick) {
        map.off('click', BUILDINGS_LAYER_ID, handleClick)
        map.off('click', BUILDINGS_FOOTPRINT_LAYER_ID, handleClick)
      }
      if (onBuildingHover) {
        map.off('mousemove', BUILDINGS_LAYER_ID, handleHover)
        map.off('mousemove', BUILDINGS_FOOTPRINT_LAYER_ID, handleHover)
        map.off('mouseleave', BUILDINGS_LAYER_ID, handleMouseLeave)
        map.off('mouseleave', BUILDINGS_FOOTPRINT_LAYER_ID, handleMouseLeave)
      }
    }
  }, [map, isLayersAdded, onBuildingClick, onBuildingHover, handleClick, handleHover, handleMouseLeave])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (!map) return

      // Remove layers
      const layersToRemove = [
        CLUSTER_LAYER_ID,
        CLUSTER_COUNT_LAYER_ID,
        BUILDINGS_FOOTPRINT_LAYER_ID,
        BUILDINGS_LAYER_ID
      ]
      layersToRemove.forEach(layerId => {
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId)
        }
      })

      // Remove source
      if (map.getSource(SOURCE_ID)) {
        map.removeSource(SOURCE_ID)
      }

      console.log('🧹 Buildings layer cleaned up')
    }
  }, [map])

  // This component doesn't render anything (layers are added directly to map)
  return null
}

// ============================================================================
// Loading Indicator Component (optional)
// ============================================================================

/**
 * Optional loading indicator for buildings layer.
 * Shows a subtle indicator while buildings are loading.
 *
 * Usage:
 * ```tsx
 * const [loadingBuildings, setLoadingBuildings] = useState(false)
 * <BuildingsLayer map={map} onLoadingChange={setLoadingBuildings} />
 * {loadingBuildings && <BuildingsLoadingIndicator />}
 * ```
 */
export function BuildingsLoadingIndicator() {
  return (
    <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm px-4 py-2 rounded-full shadow-lg z-10">
      <div className="flex items-center gap-2 text-sm text-gray-700">
        <div className="w-4 h-4 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span>Loading buildings...</span>
      </div>
    </div>
  )
}
