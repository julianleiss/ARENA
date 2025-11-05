'use client'

/**
 * Cinematic Mapbox Demo Page
 *
 * Showcases all cinematic visual enhancements:
 * - Dynamic lighting system
 * - Time-of-day controls
 * - View presets
 * - Camera animations
 * - Atmospheric fog
 */

import { useRef, useState } from 'react'
import MapboxView, { type MapboxViewHandle } from '@/app/components/MapboxView'

export default function CinematicDemoPage() {
  const mapRef = useRef<MapboxViewHandle>(null)
  const [mapLoaded, setMapLoaded] = useState(false)

  const handleMapLoad = () => {
    console.log('✨ Cinematic map loaded!')
    setMapLoaded(true)
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 shadow-xl z-50">
        <div className="px-6 py-4">
          <h1 className="text-3xl font-bold text-white mb-1 flex items-center gap-3">
            <span>✨</span>
            ARENA Cinematic Maps
            <span>🎬</span>
          </h1>
          <p className="text-indigo-100 text-sm">
            Dynamic lighting • Atmospheric fog • Camera animations • Time-of-day controls
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 relative">
        <MapboxView
          ref={mapRef}
          initialViewState={{
            longitude: -58.3816,
            latitude: -34.6037,
            zoom: 14,
            pitch: 60,
            bearing: -17.6
          }}
          onMapLoad={handleMapLoad}
          style="standard"
          enableCinematicEnhancements={true}
          showTimeControl={true}
          showViewPresets={true}
          showNavigationControls={true}
          showFullscreenControl={true}
          showScaleControl={true}
          initialTimeOfDay={18.5} // Golden hour by default
        />

        {/* Welcome overlay */}
        {!mapLoaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-indigo-900 to-purple-900 z-40">
            <div className="text-center text-white">
              <div className="inline-block animate-spin rounded-full h-16 w-16 border-b-4 border-white mb-6" />
              <h2 className="text-2xl font-bold mb-2">Loading Cinematic Experience</h2>
              <p className="text-indigo-200">Preparing atmosphere, lighting, and fog...</p>
            </div>
          </div>
        )}

        {/* Instructions overlay */}
        {mapLoaded && (
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-6 max-w-2xl border border-gray-200 z-30">
            <h3 className="font-bold text-gray-900 mb-4 text-lg flex items-center gap-2">
              <span className="text-2xl">🎮</span>
              Interactive Controls
            </h3>
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <h4 className="font-semibold text-indigo-600 mb-2">⏰ Time of Day</h4>
                <ul className="text-gray-600 space-y-1">
                  <li><kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">1</kbd> Sunrise (6:30 AM)</li>
                  <li><kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">2</kbd> Noon (12:00 PM)</li>
                  <li><kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">3</kbd> Sunset (6:30 PM)</li>
                  <li><kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">4</kbd> Night (10:00 PM)</li>
                  <li><kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">T</kbd> Toggle current/noon</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-purple-600 mb-2">📸 View Presets</h4>
                <ul className="text-gray-600 space-y-1">
                  <li><kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">Q</kbd> Buenos Aires Overview</li>
                  <li><kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">W</kbd> Neighborhood View</li>
                  <li><kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">E</kbd> Street Level</li>
                  <li><kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">R</kbd> Satellite View</li>
                  <li><kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">A</kbd> Night View</li>
                  <li><kbd className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">S</kbd> 3D Buildings</li>
                </ul>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200">
              <h4 className="font-semibold text-gray-700 mb-2">✨ Features Active:</h4>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium">
                  Dynamic Lighting
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  Atmospheric Fog
                </span>
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                  Sky Gradients
                </span>
                <span className="px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-xs font-medium">
                  Smooth Animations
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                  3D Buildings
                </span>
              </div>
            </div>
            <button
              onClick={() => {
                const overlay = document.getElementById('instructions-overlay')
                if (overlay) overlay.style.display = 'none'
              }}
              className="mt-4 w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all font-medium"
              id="hide-instructions"
            >
              Got it! Hide Instructions
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
