'use client'

/**
 * MapboxView - Base Mapbox GL JS map component for ARENA
 *
 * A performant, feature-rich map component that replaces Google Maps with Mapbox GL JS.
 * Provides 3D buildings, smooth animations, and comprehensive controls.
 *
 * @example
 * ```tsx
 * <MapboxView
 *   initialViewState={{ longitude: -58.46, latitude: -34.545, zoom: 15, pitch: 60 }}
 *   onMapLoad={(map) => console.log('Map loaded:', map)}
 *   onViewStateChange={(viewState) => console.log('View changed:', viewState)}
 * >
 *   <CustomOverlay />
 * </MapboxView>
 * ```
 */

import { useEffect, useRef, useState, useCallback, useMemo, forwardRef, useImperativeHandle } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'

// ============================================================================
// Types
// ============================================================================

/**
 * Map view state defining camera position and orientation
 */
export interface ViewState {
  /** Longitude coordinate (center of map) */
  longitude: number
  /** Latitude coordinate (center of map) */
  latitude: number
  /** Zoom level (0-22, where 22 is most zoomed in) */
  zoom: number
  /** Bearing/rotation in degrees (0-360) */
  bearing?: number
  /** Pitch/tilt in degrees (0-85) */
  pitch?: number
}

/**
 * Mapbox map style options
 * - 'standard': Mapbox Standard style with 3D buildings (default)
 * - 'streets': Mapbox Streets
 * - 'outdoors': Mapbox Outdoors
 * - 'light': Mapbox Light
 * - 'dark': Mapbox Dark
 * - 'satellite': Mapbox Satellite
 * - 'satellite-streets': Mapbox Satellite Streets
 * - Custom style URL
 */
export type MapStyle =
  | 'standard'
  | 'streets'
  | 'outdoors'
  | 'light'
  | 'dark'
  | 'satellite'
  | 'satellite-streets'
  | string

/**
 * MapboxView component props
 */
export interface MapboxViewProps {
  /** Initial camera position and orientation */
  initialViewState?: ViewState
  /** Callback when map finishes loading */
  onMapLoad?: (map: mapboxgl.Map) => void
  /** Callback when view state changes (move, zoom, rotate, pitch) */
  onViewStateChange?: (viewState: ViewState) => void
  /** Map style to use */
  style?: MapStyle
  /** React children (for custom overlays) */
  children?: React.ReactNode
  /** CSS class name for the container */
  className?: string
  /** Show navigation controls (default: true) */
  showNavigationControls?: boolean
  /** Show fullscreen control (default: true) */
  showFullscreenControl?: boolean
  /** Show scale control (default: true) */
  showScaleControl?: boolean
  /** Show geolocate control (default: false) */
  showGeolocateControl?: boolean
  /** Enable 3D terrain (requires Mapbox terrain source, default: false) */
  enable3DTerrain?: boolean
  /** Minimum zoom level (default: 0) */
  minZoom?: number
  /** Maximum zoom level (default: 22) */
  maxZoom?: number
}

/**
 * Imperative handle for programmatic map control
 */
export interface MapboxViewHandle {
  /** Get the underlying Mapbox map instance */
  getMap: () => mapboxgl.Map | null
  /** Fly to a specific location with animation */
  flyTo: (viewState: Partial<ViewState>, options?: Omit<mapboxgl.EasingOptions, keyof ViewState>) => void
  /** Jump to a specific location without animation */
  jumpTo: (viewState: Partial<ViewState>) => void
  /** Fit map to bounds */
  fitBounds: (bounds: mapboxgl.LngLatBoundsLike, options?: mapboxgl.FitBoundsOptions) => void
}

// ============================================================================
// Constants
// ============================================================================

/** Buenos Aires city center (Núñez neighborhood) */
const DEFAULT_VIEW_STATE: ViewState = {
  longitude: -58.46,
  latitude: -34.545,
  zoom: 15,
  bearing: 0,
  pitch: 60 // 3D view by default
}

/** Map style URL mapping */
const STYLE_URLS: Record<string, string> = {
  standard: 'mapbox://styles/mapbox/standard',
  streets: 'mapbox://styles/mapbox/streets-v12',
  outdoors: 'mapbox://styles/mapbox/outdoors-v12',
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11',
  satellite: 'mapbox://styles/mapbox/satellite-v9',
  'satellite-streets': 'mapbox://styles/mapbox/satellite-streets-v12'
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Get the Mapbox style URL from a style name or custom URL
 */
function getStyleUrl(style?: MapStyle): string {
  if (!style) return STYLE_URLS.standard
  return STYLE_URLS[style] || style
}

/**
 * Debounce function for performance optimization
 */
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

// ============================================================================
// Component
// ============================================================================

/**
 * MapboxView component - Main Mapbox GL JS map component
 */
const MapboxView = forwardRef<MapboxViewHandle, MapboxViewProps>(({
  initialViewState,
  onMapLoad,
  onViewStateChange,
  style = 'standard',
  children,
  className = '',
  showNavigationControls = true,
  showFullscreenControl = true,
  showScaleControl = true,
  showGeolocateControl = false,
  enable3DTerrain = false,
  minZoom = 0,
  maxZoom = 22
}, ref) => {
  // ============================================================================
  // State & Refs
  // ============================================================================

  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isMapLoaded, setIsMapLoaded] = useState(false)

  // ============================================================================
  // Memoized Values
  // ============================================================================

  const viewState = useMemo(
    () => ({ ...DEFAULT_VIEW_STATE, ...initialViewState }),
    [initialViewState]
  )

  const styleUrl = useMemo(() => getStyleUrl(style), [style])

  // Memoize map options to prevent unnecessary re-renders
  const mapOptions = useMemo<mapboxgl.MapboxOptions>(() => ({
    container: 'mapbox-container', // Will be set in useEffect
    style: styleUrl,
    center: [viewState.longitude, viewState.latitude],
    zoom: viewState.zoom,
    bearing: viewState.bearing || 0,
    pitch: viewState.pitch || 0,
    minZoom,
    maxZoom,
    antialias: true, // Enable antialiasing for smoother 3D rendering
    attributionControl: true
  }), [styleUrl, viewState, minZoom, maxZoom])

  // ============================================================================
  // Debounced Callbacks
  // ============================================================================

  // Debounce view state change events to avoid excessive callbacks
  const debouncedViewStateChange = useMemo(
    () => debounce((vs: ViewState) => {
      onViewStateChange?.(vs)
    }, 150),
    [onViewStateChange]
  )

  // ============================================================================
  // Map Event Handlers
  // ============================================================================

  const handleMove = useCallback(() => {
    if (!mapRef.current) return

    const map = mapRef.current
    const center = map.getCenter()

    const newViewState: ViewState = {
      longitude: center.lng,
      latitude: center.lat,
      zoom: map.getZoom(),
      bearing: map.getBearing(),
      pitch: map.getPitch()
    }

    debouncedViewStateChange(newViewState)
  }, [debouncedViewStateChange])

  // ============================================================================
  // Imperative Handle (for ref access)
  // ============================================================================

  useImperativeHandle(ref, () => ({
    getMap: () => mapRef.current,

    flyTo: (viewState: Partial<ViewState>, options?: Omit<mapboxgl.EasingOptions, keyof ViewState>) => {
      if (!mapRef.current) return

      const flyToOptions: mapboxgl.EasingOptions = {
        ...options,
        center: viewState.longitude !== undefined && viewState.latitude !== undefined
          ? [viewState.longitude, viewState.latitude]
          : undefined,
        zoom: viewState.zoom,
        bearing: viewState.bearing,
        pitch: viewState.pitch,
        essential: true // Animation won't be skipped
      }

      mapRef.current.flyTo(flyToOptions)
    },

    jumpTo: (viewState: Partial<ViewState>) => {
      if (!mapRef.current) return

      mapRef.current.jumpTo({
        center: viewState.longitude !== undefined && viewState.latitude !== undefined
          ? [viewState.longitude, viewState.latitude]
          : undefined,
        zoom: viewState.zoom,
        bearing: viewState.bearing,
        pitch: viewState.pitch
      })
    },

    fitBounds: (bounds: mapboxgl.LngLatBoundsLike, options?: mapboxgl.FitBoundsOptions) => {
      if (!mapRef.current) return
      mapRef.current.fitBounds(bounds, options)
    }
  }), [])

  // ============================================================================
  // Map Initialization & Lifecycle
  // ============================================================================

  useEffect(() => {
    // Check for access token
    const accessToken = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

    if (!accessToken) {
      setError('Mapbox access token is missing. Please set NEXT_PUBLIC_MAPBOX_TOKEN in your environment variables.')
      setIsLoading(false)
      return
    }

    if (!mapContainerRef.current) return
    if (mapRef.current) return // Already initialized

    // Set access token
    mapboxgl.accessToken = accessToken

    try {
      // Initialize map
      const map = new mapboxgl.Map({
        ...mapOptions,
        container: mapContainerRef.current
      })

      mapRef.current = map

      // Handle map load
      map.on('load', () => {
        console.log('✅ Mapbox map loaded')
        setIsLoading(false)
        setIsMapLoaded(true)

        // Enable 3D buildings layer (for standard style)
        if (style === 'standard') {
          // Mapbox Standard style has 3D buildings built-in
          // Configure 3D building layer if needed
          try {
            // For standard style, buildings are already 3D
            // We can configure them if needed
            if (map.getLayer('building')) {
              map.setPaintProperty('building', 'fill-extrusion-height', [
                'interpolate',
                ['linear'],
                ['zoom'],
                15,
                0,
                15.05,
                ['get', 'height']
              ])
            }
          } catch (err) {
            console.warn('Could not configure 3D buildings:', err)
          }
        }

        // Enable 3D terrain if requested
        if (enable3DTerrain) {
          try {
            map.addSource('mapbox-dem', {
              type: 'raster-dem',
              url: 'mapbox://mapbox.mapbox-terrain-dem-v1',
              tileSize: 512,
              maxzoom: 14
            })
            map.setTerrain({ source: 'mapbox-dem', exaggeration: 1.5 })
          } catch (err) {
            console.warn('Could not enable 3D terrain:', err)
          }
        }

        // Call onMapLoad callback
        onMapLoad?.(map)
      })

      // Handle map errors
      map.on('error', (e) => {
        console.error('❌ Mapbox error:', e)
        setError(`Map error: ${e.error?.message || 'Unknown error'}`)
      })

      // Handle view state changes
      map.on('move', handleMove)
      map.on('zoom', handleMove)
      map.on('rotate', handleMove)
      map.on('pitch', handleMove)

      // Add controls
      if (showNavigationControls) {
        const navControl = new mapboxgl.NavigationControl({
          showCompass: true,
          showZoom: true,
          visualizePitch: true
        })
        map.addControl(navControl, 'top-right')
      }

      if (showFullscreenControl) {
        const fullscreenControl = new mapboxgl.FullscreenControl()
        map.addControl(fullscreenControl, 'top-right')
      }

      if (showScaleControl) {
        const scaleControl = new mapboxgl.ScaleControl({
          maxWidth: 100,
          unit: 'metric'
        })
        map.addControl(scaleControl, 'bottom-left')
      }

      if (showGeolocateControl) {
        const geolocateControl = new mapboxgl.GeolocateControl({
          positionOptions: {
            enableHighAccuracy: true
          },
          trackUserLocation: true,
          showUserHeading: true
        })
        map.addControl(geolocateControl, 'top-right')
      }

      // Handle resize events (debounced for performance)
      const handleResize = debounce(() => {
        map.resize()
      }, 100)

      window.addEventListener('resize', handleResize)

      // Cleanup function
      return () => {
        console.log('🧹 Cleaning up Mapbox map...')

        // Remove event listeners
        map.off('move', handleMove)
        map.off('zoom', handleMove)
        map.off('rotate', handleMove)
        map.off('pitch', handleMove)
        window.removeEventListener('resize', handleResize)

        // Remove map
        map.remove()
        mapRef.current = null
      }
    } catch (err) {
      console.error('❌ Failed to initialize Mapbox:', err)
      setError(err instanceof Error ? err.message : 'Failed to initialize map')
      setIsLoading(false)
    }
  }, [
    mapOptions,
    handleMove,
    onMapLoad,
    style,
    enable3DTerrain,
    showNavigationControls,
    showFullscreenControl,
    showScaleControl,
    showGeolocateControl
  ])

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <div className={`relative w-full h-full ${className}`}>
      {/* Map container */}
      <div
        ref={mapContainerRef}
        className="absolute inset-0 w-full h-full"
        style={{
          visibility: error ? 'hidden' : 'visible'
        }}
      />

      {/* Loading state */}
      {isLoading && !error && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-gray-100"
          role="status"
          aria-label="Loading map"
        >
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mb-4" />
            <p className="text-gray-600 font-medium">Loading map...</p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div
          className="absolute inset-0 flex items-center justify-center bg-red-50"
          role="alert"
        >
          <div className="text-center p-8 max-w-md">
            <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Map Error</h2>
            <p className="text-red-700 mb-4">{error}</p>
            <p className="text-sm text-red-600">
              Check console for more details
            </p>
          </div>
        </div>
      )}

      {/* Children (custom overlays) - only render when map is loaded */}
      {isMapLoaded && !error && children}
    </div>
  )
})

MapboxView.displayName = 'MapboxView'

export default MapboxView
