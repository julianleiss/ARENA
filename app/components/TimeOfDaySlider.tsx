'use client'

/**
 * TimeOfDaySlider - Interactive time-of-day controller for ARENA maps
 *
 * Allows users to change the time of day on the map, updating lighting,
 * atmosphere, and sky colors in real-time.
 *
 * Features:
 * - Slider from midnight (0) to midnight (24)
 * - Real-time preview of lighting changes
 * - Preset buttons (sunrise, noon, sunset, night)
 * - Time display in HH:MM format
 * - localStorage persistence
 * - Keyboard shortcuts
 *
 * @example
 * ```tsx
 * <TimeOfDaySlider
 *   map={mapInstance}
 *   onTimeChange={(hour) => console.log('Time changed to', hour)}
 * />
 * ```
 */

import { useState, useEffect, useCallback } from 'react'
import type { Map as MapboxMap } from 'mapbox-gl'
import {
  updateMapLighting,
  formatTime,
  getCurrentHour,
  TIME_PRESETS,
  getTimePeriod
} from '@/app/lib/mapbox-lighting'

// Simple icon components (replacing lucide-react)
const Sun = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2M4.22 4.22l1.42 1.42m12.72 12.72l1.42 1.42M1 12h2m18 0h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/></svg>
)
const Moon = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>
)
const Sunrise = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17 18a5 5 0 00-10 0"/><path d="M12 2v7m0 0l-4-4m4 4l4-4M3 22h18"/></svg>
)
const Sunset = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M17 18a5 5 0 00-10 0"/><path d="M12 9v7m0 0l-4-4m4 4l4-4M3 22h18"/></svg>
)
const Clock = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>
)

// ============================================================================
// TYPES
// ============================================================================

export interface TimeOfDaySliderProps {
  /** Mapbox map instance */
  map: MapboxMap | null
  /** Initial hour (default: current time) */
  initialHour?: number
  /** Callback when time changes */
  onTimeChange?: (hour: number) => void
  /** Show preset buttons (default: true) */
  showPresets?: boolean
  /** Collapsed by default (default: false) */
  collapsed?: boolean
  /** CSS class name */
  className?: string
}

interface TimePreset {
  name: string
  hour: number
  icon: React.ReactNode
  description: string
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEY = 'arena-time-of-day'

const PRESETS: TimePreset[] = [
  {
    name: 'Sunrise',
    hour: TIME_PRESETS.SUNRISE,
    icon: <Sunrise className="w-4 h-4" />,
    description: 'Dawn (6:30 AM)'
  },
  {
    name: 'Noon',
    hour: TIME_PRESETS.NOON,
    icon: <Sun className="w-4 h-4" />,
    description: 'Midday (12:00 PM)'
  },
  {
    name: 'Sunset',
    hour: TIME_PRESETS.GOLDEN_HOUR,
    icon: <Sunset className="w-4 h-4" />,
    description: 'Golden Hour (6:30 PM)'
  },
  {
    name: 'Night',
    hour: TIME_PRESETS.NIGHT,
    icon: <Moon className="w-4 h-4" />,
    description: 'Night (10:00 PM)'
  }
]

// ============================================================================
// COMPONENT
// ============================================================================

export default function TimeOfDaySlider({
  map,
  initialHour,
  onTimeChange,
  showPresets = true,
  collapsed: initialCollapsed = false,
  className = ''
}: TimeOfDaySliderProps) {
  // ============================================================================
  // STATE
  // ============================================================================

  const [hour, setHour] = useState<number>(() => {
    // Try to load from localStorage first
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        return parseFloat(stored)
      }
    }
    // Fall back to initial or current time
    return initialHour ?? getCurrentHour()
  })

  const [collapsed, setCollapsed] = useState(initialCollapsed)
  const [isDragging, setIsDragging] = useState(false)

  // ============================================================================
  // EFFECTS
  // ============================================================================

  // Apply lighting when hour changes
  useEffect(() => {
    if (!map) return

    updateMapLighting(map, hour, {
      animated: !isDragging, // No animation while dragging for better performance
      duration: isDragging ? 0 : 1000
    })

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, hour.toString())
    }

    // Callback
    onTimeChange?.(hour)
  }, [hour, map, isDragging, onTimeChange])

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      // Only handle if not typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return
      }

      switch (e.key.toLowerCase()) {
        case '1':
          handlePresetClick(TIME_PRESETS.SUNRISE)
          break
        case '2':
          handlePresetClick(TIME_PRESETS.NOON)
          break
        case '3':
          handlePresetClick(TIME_PRESETS.GOLDEN_HOUR)
          break
        case '4':
          handlePresetClick(TIME_PRESETS.NIGHT)
          break
        case 't':
          // Toggle current/noon
          setHour(h => h === TIME_PRESETS.NOON ? getCurrentHour() : TIME_PRESETS.NOON)
          break
      }
    }

    window.addEventListener('keydown', handleKeyPress)
    return () => window.removeEventListener('keydown', handleKeyPress)
  }, [])

  // ============================================================================
  // HANDLERS
  // ============================================================================

  const handleSliderChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newHour = parseFloat(e.target.value)
    setHour(newHour)
  }, [])

  const handlePresetClick = useCallback((presetHour: number) => {
    setHour(presetHour)
  }, [])

  const handleMouseDown = useCallback(() => {
    setIsDragging(true)
  }, [])

  const handleMouseUp = useCallback(() => {
    setIsDragging(false)
  }, [])

  const handleResetToNow = useCallback(() => {
    setHour(getCurrentHour())
  }, [])

  // ============================================================================
  // RENDER HELPERS
  // ============================================================================

  const period = getTimePeriod(hour)
  const timeString = formatTime(hour)

  const periodColors = {
    night: 'bg-slate-900 text-white',
    dawn: 'bg-orange-200 text-orange-900',
    day: 'bg-sky-200 text-sky-900',
    dusk: 'bg-orange-300 text-orange-950'
  }

  const periodIcons = {
    night: <Moon className="w-5 h-5" />,
    dawn: <Sunrise className="w-5 h-5" />,
    day: <Sun className="w-5 h-5" />,
    dusk: <Sunset className="w-5 h-5" />
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div
      className={`
        bg-white rounded-lg shadow-lg border border-gray-200
        transition-all duration-300 ease-in-out
        ${collapsed ? 'w-12 h-12' : 'w-80'}
        ${className}
      `}
    >
      {/* Collapsed state - just icon */}
      {collapsed && (
        <button
          onClick={() => setCollapsed(false)}
          className="w-full h-full flex items-center justify-center text-gray-700 hover:text-indigo-600 transition-colors"
          title="Open time controls"
          aria-label="Open time of day controls"
        >
          <Clock className="w-5 h-5" />
        </button>
      )}

      {/* Expanded state */}
      {!collapsed && (
        <div className="p-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded ${periodColors[period]}`}>
                {periodIcons[period]}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900">Time of Day</h3>
                <p className="text-xs text-gray-500 capitalize">{period}</p>
              </div>
            </div>

            <button
              onClick={() => setCollapsed(true)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="Collapse"
              aria-label="Collapse time controls"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Time display */}
          <div className="mb-4 text-center">
            <div className="text-3xl font-bold text-gray-900 tabular-nums">
              {timeString}
            </div>
            <button
              onClick={handleResetToNow}
              className="text-xs text-indigo-600 hover:text-indigo-700 transition-colors mt-1"
            >
              Reset to current time
            </button>
          </div>

          {/* Slider */}
          <div className="mb-4">
            <input
              type="range"
              min="0"
              max="24"
              step="0.25" // 15-minute increments
              value={hour}
              onChange={handleSliderChange}
              onMouseDown={handleMouseDown}
              onMouseUp={handleMouseUp}
              onTouchStart={handleMouseDown}
              onTouchEnd={handleMouseUp}
              className="w-full h-2 bg-gradient-to-r from-slate-900 via-sky-400 to-slate-900 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right,
                  #0f172a 0%,
                  #fb923c 20%,
                  #60a5fa 30%,
                  #60a5fa 70%,
                  #fb923c 80%,
                  #0f172a 100%
                )`
              }}
              aria-label="Time of day slider"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>00:00</span>
              <span>06:00</span>
              <span>12:00</span>
              <span>18:00</span>
              <span>24:00</span>
            </div>
          </div>

          {/* Presets */}
          {showPresets && (
            <div>
              <p className="text-xs text-gray-600 mb-2 font-medium">Quick Presets</p>
              <div className="grid grid-cols-4 gap-2">
                {PRESETS.map((preset, index) => (
                  <button
                    key={preset.name}
                    onClick={() => handlePresetClick(preset.hour)}
                    className={`
                      flex flex-col items-center gap-1 p-2 rounded-lg
                      transition-all duration-200
                      ${Math.abs(hour - preset.hour) < 0.5
                        ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500'
                        : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                      }
                    `}
                    title={`${preset.description} (Press ${index + 1})`}
                    aria-label={`Set time to ${preset.description}`}
                  >
                    {preset.icon}
                    <span className="text-xs font-medium">{preset.name}</span>
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2 text-center">
                Keyboard: 1-4 for presets, T to toggle
              </p>
            </div>
          )}
        </div>
      )}

      {/* Custom slider styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          border: 2px solid #6366f1;
          transition: transform 0.2s;
        }

        .slider::-webkit-slider-thumb:hover {
          transform: scale(1.1);
        }

        .slider::-webkit-slider-thumb:active {
          transform: scale(0.95);
        }

        .slider::-moz-range-thumb {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
          border: 2px solid #6366f1;
          transition: transform 0.2s;
        }

        .slider::-moz-range-thumb:hover {
          transform: scale(1.1);
        }

        .slider::-moz-range-thumb:active {
          transform: scale(0.95);
        }
      `}</style>
    </div>
  )
}
