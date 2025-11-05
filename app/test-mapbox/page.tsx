'use client'

/**
 * Mapbox Test Page
 *
 * Test harness for the MapboxView component. This page verifies:
 * - Map initialization and loading
 * - 3D buildings visibility
 * - Navigation controls functionality
 * - Camera animations (flyTo)
 * - View state tracking
 * - Error handling
 * - Performance (check FPS in DevTools)
 */

import { useRef, useState } from 'react'
import MapboxView, { type MapboxViewHandle, type ViewState } from '@/app/components/MapboxView'
import BuildingsLayer, { BuildingsLoadingIndicator } from '@/app/components/BuildingsLayer'
import type mapboxgl from 'mapbox-gl'

export default function TestMapboxPage() {
  const mapRef = useRef<MapboxViewHandle>(null)
  const [viewState, setViewState] = useState<ViewState | null>(null)
  const [mapLoaded, setMapLoaded] = useState(false)
  const [flyToLocation, setFlyToLocation] = useState<'nunez' | 'obelisco' | 'puerto' | 'palermo'>('nunez')
  const [map, setMap] = useState<mapboxgl.Map | null>(null)
  const [buildingsLoading, setBuildingsLoading] = useState(false)
  const [showBuildings, setShowBuildings] = useState(true)

  // Predefined locations in Buenos Aires for testing
  const locations = {
    nunez: {
      name: 'Núñez (Default)',
      longitude: -58.46,
      latitude: -34.545,
      zoom: 16,
      pitch: 60,
      bearing: 0
    },
    obelisco: {
      name: 'Obelisco',
      longitude: -58.3816,
      latitude: -34.6037,
      zoom: 17,
      pitch: 70,
      bearing: 45
    },
    puerto: {
      name: 'Puerto Madero',
      longitude: -58.3636,
      latitude: -34.6118,
      zoom: 15.5,
      pitch: 65,
      bearing: 90
    },
    palermo: {
      name: 'Palermo',
      longitude: -58.4173,
      latitude: -34.5786,
      zoom: 15,
      pitch: 55,
      bearing: 180
    }
  }

  const handleMapLoad = (mapInstance: mapboxgl.Map) => {
    console.log('✅ Map loaded successfully!')
    console.log('Map instance:', mapInstance)
    console.log('Map style:', mapInstance.getStyle().name)
    console.log('Map center:', mapInstance.getCenter())
    console.log('Map zoom:', mapInstance.getZoom())
    console.log('Map pitch:', mapInstance.getPitch())
    console.log('Map bearing:', mapInstance.getBearing())
    setMapLoaded(true)
    setMap(mapInstance)
  }

  const handleViewStateChange = (vs: ViewState) => {
    setViewState(vs)
  }

  const handleFlyTo = (location: keyof typeof locations) => {
    setFlyToLocation(location)
    mapRef.current?.flyTo(locations[location], {
      duration: 2000,
      easing: (t) => t * (2 - t) // easeOutQuad
    })
  }

  const handleJumpTo = (location: keyof typeof locations) => {
    setFlyToLocation(location)
    mapRef.current?.jumpTo(locations[location])
  }

  const handleReset3D = () => {
    mapRef.current?.flyTo({
      pitch: 60,
      bearing: 0
    }, {
      duration: 1000
    })
  }

  const handleToggle2D3D = () => {
    const currentMap = mapRef.current?.getMap()
    if (!currentMap) return

    const currentPitch = currentMap.getPitch()
    const newPitch = currentPitch > 30 ? 0 : 60

    mapRef.current?.flyTo({
      pitch: newPitch
    }, {
      duration: 800
    })
  }

  return (
    <div className="w-screen h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 shadow-sm z-50">
        <div className="px-6 py-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Mapbox Test Page
          </h1>
          <p className="text-sm text-gray-600">
            Testing MapboxView component with controls and animations
          </p>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex relative">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto p-6 space-y-6">
          {/* Status */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Status
            </h2>
            <div className="space-y-1 text-sm">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${mapLoaded ? 'bg-green-500' : 'bg-yellow-500'}`} />
                <span className="text-gray-700">
                  Map: {mapLoaded ? 'Loaded' : 'Loading...'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${buildingsLoading ? 'bg-yellow-500' : mapLoaded ? 'bg-green-500' : 'bg-gray-400'}`} />
                <span className="text-gray-700">
                  Buildings: {buildingsLoading ? 'Loading...' : mapLoaded ? 'Ready' : 'Waiting'}
                </span>
              </div>
            </div>
          </div>

          {/* Current View State */}
          {viewState && (
            <div className="space-y-2">
              <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
                View State
              </h2>
              <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-gray-500">Longitude:</span>
                  <span className="text-gray-900">{viewState.longitude.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Latitude:</span>
                  <span className="text-gray-900">{viewState.latitude.toFixed(4)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Zoom:</span>
                  <span className="text-gray-900">{viewState.zoom.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Pitch:</span>
                  <span className="text-gray-900">{viewState.pitch?.toFixed(1) || 0}°</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Bearing:</span>
                  <span className="text-gray-900">{viewState.bearing?.toFixed(1) || 0}°</span>
                </div>
              </div>
            </div>
          )}

          {/* Camera Controls */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Camera Controls
            </h2>

            <div className="space-y-2">
              <p className="text-xs text-gray-500 mb-2">Fly to location:</p>
              {Object.entries(locations).map(([key, loc]) => (
                <button
                  key={key}
                  onClick={() => handleFlyTo(key as keyof typeof locations)}
                  className={`w-full px-3 py-2 text-sm rounded-lg transition-all ${
                    flyToLocation === key
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {loc.name}
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-gray-200 space-y-2">
              <button
                onClick={handleToggle2D3D}
                className="w-full px-3 py-2 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-all"
              >
                Toggle 2D/3D View
              </button>
              <button
                onClick={handleReset3D}
                className="w-full px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-all"
              >
                Reset Camera (North, 60° pitch)
              </button>
            </div>
          </div>

          {/* Buildings Layer Controls */}
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Buildings Layer
            </h2>
            <div className="space-y-2">
              <button
                onClick={() => setShowBuildings(!showBuildings)}
                className={`w-full px-3 py-2 text-sm rounded-lg transition-all ${
                  showBuildings
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {showBuildings ? '✓ Buildings Visible' : '✗ Buildings Hidden'}
              </button>
            </div>
            <div className="bg-blue-50 rounded-lg p-3 text-xs text-blue-800">
              <p className="font-semibold mb-1">💡 Buildings Layer Features:</p>
              <ul className="space-y-0.5">
                <li>• Lazy loading (async)</li>
                <li>• Viewport filtering</li>
                <li>• Clustering at zoom {'<'} 13</li>
                <li>• LOD: simplified at zoom 13-15</li>
                <li>• Full 3D at zoom {'>'} 15</li>
              </ul>
            </div>
          </div>

          {/* Testing Checklist */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Testing Checklist
            </h2>
            <ul className="text-xs text-gray-600 space-y-1.5">
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Map loads correctly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>3D buildings visible (zoom in if needed)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Navigation controls work (zoom, compass, pitch)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Fullscreen control works</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Scale control visible (bottom-left)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Camera animations smooth (test flyTo)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>View state updates correctly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>No console errors</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-green-600 mt-0.5">✓</span>
                <span>Performance good (check FPS in DevTools)</span>
              </li>
            </ul>
          </div>

          {/* Environment Check */}
          <div className="space-y-2">
            <h2 className="text-sm font-semibold text-gray-900 uppercase tracking-wide">
              Environment
            </h2>
            <div className="bg-gray-50 rounded-lg p-3 space-y-1 text-xs">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${
                  process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? 'bg-green-500' : 'bg-red-500'
                }`} />
                <span className="text-gray-700">
                  MAPBOX_TOKEN: {process.env.NEXT_PUBLIC_MAPBOX_TOKEN ? 'Set' : 'Missing'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapboxView
            ref={mapRef}
            initialViewState={locations.nunez}
            onMapLoad={handleMapLoad}
            onViewStateChange={handleViewStateChange}
            style="standard"
            showNavigationControls
            showFullscreenControl
            showScaleControl
            showGeolocateControl={false}
          >
            {/* Optimized Buildings Layer */}
            {showBuildings && (
              <BuildingsLayer
                map={map}
                enableViewportFiltering
                enableClustering
                enable3D
                onLoadingChange={setBuildingsLoading}
                onError={(error) => console.error('Buildings layer error:', error)}
              />
            )}
          </MapboxView>

          {/* Loading indicator */}
          {buildingsLoading && <BuildingsLoadingIndicator />}

          {/* Instructions overlay */}
          <div className="absolute top-6 left-6 bg-white/95 backdrop-blur-sm rounded-xl shadow-lg p-4 max-w-sm border border-gray-200">
            <h3 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <svg className="w-5 h-5 text-indigo-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Test Instructions
            </h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Use mouse to pan/zoom the map</li>
              <li>• Right-click + drag to rotate</li>
              <li>• Ctrl + drag to tilt (pitch)</li>
              <li>• Use sidebar controls to test animations</li>
              <li>• Check console for debug logs</li>
              <li>• Zoom out to see building clusters ({'<'}13)</li>
              <li>• Zoom in to see 3D buildings ({'>'}15)</li>
              <li>• Toggle buildings layer on/off in sidebar</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
