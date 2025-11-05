'use client'

/**
 * ViewPresetsPanel - Quick camera presets for ARENA maps
 *
 * Provides one-click access to predefined camera positions and styles.
 * Perfect for showcasing different perspectives and map styles.
 *
 * Features:
 * - Predefined view presets (overview, street level, satellite, etc.)
 * - Smooth camera transitions
 * - Map style switching
 * - Time-of-day integration
 * - Keyboard shortcuts
 *
 * @example
 * ```tsx
 * <ViewPresetsPanel
 *   map={mapInstance}
 *   onPresetChange={(preset) => console.log('Switched to', preset.name)}
 * />
 * ```
 */

import { useState, useCallback } from 'react'
import type { Map as MapboxMap } from 'mapbox-gl'
import { easeCameraTo, type CameraPosition } from '@/app/lib/mapbox-camera'
import { updateMapLighting } from '@/app/lib/mapbox-lighting'
import { BUENOS_AIRES_CENTER } from '@/app/lib/mapbox-config'

// Simple icon components (replacing lucide-react)
const MapPin = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0116 0z"/><circle cx="12" cy="10" r="3"/></svg>
)
const Building = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/></svg>
)
const Satellite = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M13 7L9 3 5 7l4 4m6 8l4 4 4-4-4-4M5 21l7-7m-7 0l7 7m3-14.5l2-2m0 0l2 2m-2-2v8"/></svg>
)
const Eye = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
)
const MapIcon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M1 6v16l7-4 8 4 7-4V2l-7 4-8-4-7 4z"/></svg>
)
const Mountain = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="m8 3 4 8 5-5 5 15H2L8 3z"/></svg>
)

// ============================================================================
// TYPES
// ============================================================================

export interface ViewPreset {
  /** Preset identifier */
  id: string
  /** Display name */
  name: string
  /** Description */
  description: string
  /** Icon component */
  icon: React.ReactNode
  /** Camera position */
  viewState: CameraPosition
  /** Time of day (0-24) */
  timeOfDay: number
  /** Map style (optional) */
  style?: string
  /** Keyboard shortcut */
  shortcut?: string
}

export interface ViewPresetsPanelProps {
  /** Mapbox map instance */
  map: MapboxMap | null
  /** Callback when preset is selected */
  onPresetChange?: (preset: ViewPreset) => void
  /** Custom presets (in addition to defaults) */
  customPresets?: ViewPreset[]
  /** Collapsed by default (default: false) */
  collapsed?: boolean
  /** CSS class name */
  className?: string
}

// ============================================================================
// DEFAULT PRESETS
// ============================================================================

const DEFAULT_PRESETS: ViewPreset[] = [
  {
    id: 'overview',
    name: 'Buenos Aires Overview',
    description: 'High-altitude city view',
    icon: <MapIcon className="w-5 h-5" />,
    viewState: {
      lng: BUENOS_AIRES_CENTER[0],
      lat: BUENOS_AIRES_CENTER[1],
      zoom: 11,
      pitch: 45,
      bearing: 0
    },
    timeOfDay: 12, // Noon
    shortcut: 'Q'
  },
  {
    id: 'neighborhood',
    name: 'Neighborhood View',
    description: 'Medium altitude, perfect for proposals',
    icon: <Building className="w-5 h-5" />,
    viewState: {
      lng: BUENOS_AIRES_CENTER[0],
      lat: BUENOS_AIRES_CENTER[1],
      zoom: 14,
      pitch: 60,
      bearing: -17.6
    },
    timeOfDay: 15, // Afternoon
    shortcut: 'W'
  },
  {
    id: 'street',
    name: 'Street Level',
    description: 'Ground-level perspective',
    icon: <Eye className="w-5 h-5" />,
    viewState: {
      lng: -58.46,
      lat: -34.545,
      zoom: 18,
      pitch: 70,
      bearing: 45
    },
    timeOfDay: 18.5, // Golden hour
    shortcut: 'E'
  },
  {
    id: 'satellite',
    name: 'Satellite View',
    description: 'Satellite imagery',
    icon: <Satellite className="w-5 h-5" />,
    viewState: {
      lng: BUENOS_AIRES_CENTER[0],
      lat: BUENOS_AIRES_CENTER[1],
      zoom: 15,
      pitch: 0,
      bearing: 0
    },
    timeOfDay: 12,
    style: 'mapbox://styles/mapbox/satellite-streets-v12',
    shortcut: 'R'
  },
  {
    id: 'night',
    name: 'Night View',
    description: 'Dramatic nighttime perspective',
    icon: <MapPin className="w-5 h-5" />,
    viewState: {
      lng: BUENOS_AIRES_CENTER[0],
      lat: BUENOS_AIRES_CENTER[1],
      zoom: 14,
      pitch: 60,
      bearing: 0
    },
    timeOfDay: 22, // Night
    shortcut: 'A'
  },
  {
    id: '3d-buildings',
    name: '3D Buildings',
    description: 'Showcase building heights',
    icon: <Mountain className="w-5 h-5" />,
    viewState: {
      lng: -58.38,
      lat: -34.60,
      zoom: 16,
      pitch: 75,
      bearing: 60
    },
    timeOfDay: 15,
    shortcut: 'S'
  }
]

// ============================================================================
// COMPONENT
// ============================================================================

export default function ViewPresetsPanel({
  map,
  onPresetChange,
  customPresets = [],
  collapsed: initialCollapsed = false,
  className = ''
}: ViewPresetsPanelProps) {
  // ============================================================================
  // STATE
  // ============================================================================

  const [activePreset, setActivePreset] = useState<string | null>(null)
  const [collapsed, setCollapsed] = useState(initialCollapsed)
  const [isTransitioning, setIsTransitioning] = useState(false)

  const allPresets = [...DEFAULT_PRESETS, ...customPresets]

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const applyPreset = useCallback((preset: ViewPreset) => {
    if (!map || isTransitioning) return

    setIsTransitioning(true)
    setActivePreset(preset.id)

    // Change map style if specified
    if (preset.style && map.getStyle().sprite !== preset.style) {
      map.setStyle(preset.style)

      // Wait for style to load before moving camera
      map.once('style.load', () => {
        easeCameraTo(map, preset.viewState, {
          duration: 2000,
          easing: 'cinematic'
        })

        updateMapLighting(map, preset.timeOfDay, {
          duration: 2000
        })

        setTimeout(() => {
          setIsTransitioning(false)
          onPresetChange?.(preset)
        }, 2000)
      })
    } else {
      // Just move camera and update lighting
      easeCameraTo(map, preset.viewState, {
        duration: 2000,
        easing: 'cinematic'
      })

      updateMapLighting(map, preset.timeOfDay, {
        duration: 2000
      })

      setTimeout(() => {
        setIsTransitioning(false)
        onPresetChange?.(preset)
      }, 2000)
    }
  }, [map, isTransitioning, onPresetChange])

  const handlePresetClick = useCallback((preset: ViewPreset) => {
    applyPreset(preset)
  }, [applyPreset])

  // Keyboard shortcuts
  useState(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      // Check if any preset matches this key
      const preset = allPresets.find(p => p.shortcut?.toLowerCase() === e.key.toLowerCase())
      if (preset) {
        applyPreset(preset)
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  })

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div
      className={`
        bg-white rounded-lg shadow-lg border border-gray-200
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-12 h-12' : 'w-72'}
        ${className}
      `}
    >
      {/* Collapsed state */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="w-full h-full flex items-center justify-center text-gray-700 hover:text-indigo-600 transition-colors"
          title="Open view presets"
          aria-label="Open view presets"
        >
          <MapIcon className="w-5 h-5" />
        </button>
      )}

      {/* Expanded state */}
      {!collapsed && (
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-gray-900">View Presets</h3>
              <p className="text-xs text-gray-500">Quick camera positions</p>
            </div>

            <button
              onClick={() => setCollapsed(true)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Collapse"
              aria-label="Collapse view presets"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Presets grid */}
          <div className="space-y-2">
            {allPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetClick(preset)}
                disabled={isTransitioning}
                className={`
                  w-full flex items-center gap-3 p-3 rounded-lg
                  transition-all duration-200
                  ${activePreset === preset.id
                    ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }
                  ${isTransitioning ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
                title={`${preset.description}${preset.shortcut ? ` (Press ${preset.shortcut})` : ''}`}
                aria-label={preset.name}
              >
                {/* Icon */}
                <div className={`
                  flex-shrink-0 p-2 rounded
                  ${activePreset === preset.id ? 'bg-indigo-200' : 'bg-white'}
                `}>
                  {preset.icon}
                </div>

                {/* Text */}
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">
                      {preset.name}
                    </p>
                    {preset.shortcut && (
                      <kbd className={`
                        px-2 py-0.5 text-xs font-mono rounded border
                        ${activePreset === preset.id
                          ? 'bg-indigo-200 border-indigo-400 text-indigo-900'
                          : 'bg-gray-200 border-gray-300 text-gray-700'
                        }
                      `}>
                        {preset.shortcut}
                      </kbd>
                    )}
                  </div>
                  <p className="text-xs opacity-75">
                    {preset.description}
                  </p>
                </div>
              </button>
            ))}
          </div>

          {/* Help text */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Use keyboard shortcuts for quick access
            </p>
          </div>

          {/* Transition indicator */}
          {isTransitioning && (
            <div className="mt-3 flex items-center justify-center gap-2 text-indigo-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600" />
              <span className="text-xs font-medium">Transitioning...</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ============================================================================
// UTILITY EXPORTS
// ============================================================================

/**
 * Create a custom view preset
 *
 * @param config - Preset configuration
 * @returns ViewPreset object
 *
 * @example
 * ```tsx
 * const myPreset = createViewPreset({
 *   id: 'my-view',
 *   name: 'My Custom View',
 *   description: 'A special perspective',
 *   icon: <MapPin />,
 *   viewState: { lng: -58.46, lat: -34.545, zoom: 15, pitch: 60 },
 *   timeOfDay: 12
 * })
 * ```
 */
export function createViewPreset(config: Omit<ViewPreset, 'icon'> & { icon?: React.ReactNode }): ViewPreset {
  return {
    icon: <MapPin className="w-5 h-5" />,
    ...config
  }
}
