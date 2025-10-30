'use client'

// ARENA - 3D Sandbox Client Component
// Manages 3D canvas with deck.gl + Google Maps

import { useState, useEffect, useRef, useCallback } from 'react'
import { Deck } from '@deck.gl/core'
import { GeoJsonLayer } from '@deck.gl/layers'
import { GoogleMapsOverlay } from '@deck.gl/google-maps'
import { AmbientLight, DirectionalLight, LightingEffect } from '@deck.gl/core'

interface SandboxClientProps {
  proposalId: string
  proposalTitle: string
  proposalGeom: any
  centerLng: number
  centerLat: number
}

export default function SandboxClient({
  proposalId,
  proposalTitle,
  proposalGeom,
  centerLng,
  centerLat,
}: SandboxClientProps) {
  const mapRef = useRef<google.maps.Map | null>(null)
  const deckOverlayRef = useRef<GoogleMapsOverlay | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const [buildingsData, setBuildingsData] = useState<any>(null)
  const [loadingBuildings, setLoadingBuildings] = useState(true)
  const [error, setError] = useState<string | null>(null)

  console.log('🎨 SandboxClient rendering:', { proposalId, centerLng, centerLat, hasGeom: !!proposalGeom })

  // Fetch buildings from OSM Overpass API
  useEffect(() => {
    async function fetchBuildings() {
      try {
        setLoadingBuildings(true)
        console.log('🏢 Fetching buildings around:', { lng: centerLng, lat: centerLat })

        // Define bounding box (approx 500m radius)
        const offset = 0.005 // roughly 500m
        const bbox = `${centerLat - offset},${centerLng - offset},${centerLat + offset},${centerLng + offset}`

        const query = `
          [out:json][timeout:25];
          (
            way["building"](${bbox});
          );
          out geom;
        `

        const response = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: query,
          headers: { 'Content-Type': 'text/plain' },
        })

        if (!response.ok) {
          throw new Error(`Overpass API error: ${response.status}`)
        }

        const data = await response.json()
        console.log('🏢 Fetched OSM data:', { elementCount: data.elements?.length || 0 })

        // Convert OSM data to GeoJSON
        const features = data.elements
          .filter((el: any) => el.type === 'way' && el.geometry)
          .map((el: any) => {
            const coordinates = el.geometry.map((node: any) => [node.lon, node.lat])
            // Close the polygon if not already closed
            if (coordinates.length > 0 &&
                (coordinates[0][0] !== coordinates[coordinates.length - 1][0] ||
                 coordinates[0][1] !== coordinates[coordinates.length - 1][1])) {
              coordinates.push([...coordinates[0]])
            }

            const height = parseFloat(el.tags?.['building:levels'] || el.tags?.height || '10')
            const heightMeters = el.tags?.height ? height : height * 3 // levels to meters

            return {
              type: 'Feature',
              properties: {
                id: el.id,
                height: heightMeters,
                name: el.tags?.name || 'Building',
                type: el.tags?.building || 'yes',
              },
              geometry: {
                type: 'Polygon',
                coordinates: [coordinates],
              },
            }
          })

        const geojson = {
          type: 'FeatureCollection',
          features,
        }

        console.log('🏢 Converted to GeoJSON:', { featureCount: features.length })
        setBuildingsData(geojson)
        setLoadingBuildings(false)
      } catch (error) {
        console.error('❌ Error fetching buildings:', error)
        setError(error instanceof Error ? error.message : 'Failed to load buildings')
        setLoadingBuildings(false)
      }
    }

    fetchBuildings()
  }, [centerLng, centerLat])

  // Initialize Google Maps
  useEffect(() => {
    if (!containerRef.current) return

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
    if (!apiKey) {
      setError('Google Maps API key not configured')
      return
    }

    console.log('🗺️ Initializing Google Maps...')

    // Load Google Maps script
    const loadGoogleMaps = () => {
      if (window.google?.maps) {
        initializeMap()
        return
      }

      const script = document.createElement('script')
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&v=weekly`
      script.async = true
      script.defer = true
      script.onload = initializeMap
      script.onerror = () => setError('Failed to load Google Maps')
      document.head.appendChild(script)
    }

    const initializeMap = () => {
      if (!containerRef.current) return

      console.log('🗺️ Creating Google Maps instance')

      const map = new google.maps.Map(containerRef.current, {
        center: { lat: centerLat, lng: centerLng },
        zoom: 18,
        tilt: 60, // 3D view
        heading: 0,
        mapId: 'bf51a910020fa25a', // Enable 3D
        mapTypeId: 'roadmap',
        disableDefaultUI: false,
        gestureHandling: 'greedy',
      })

      mapRef.current = map

      // Initialize deck.gl overlay
      initializeDeckOverlay(map)
    }

    loadGoogleMaps()
  }, [centerLng, centerLat])

  // Initialize deck.gl overlay
  const initializeDeckOverlay = useCallback((map: google.maps.Map) => {
    console.log('🎨 Initializing deck.gl overlay')

    // Set up lighting
    const ambientLight = new AmbientLight({
      color: [255, 255, 255],
      intensity: 0.3,
    })

    const directionalLight = new DirectionalLight({
      color: [255, 255, 255],
      intensity: 0.7,
      direction: [-1, -3, -1], // Sun from northeast
      _shadow: true,
    })

    const lightingEffect = new LightingEffect({ ambientLight, directionalLight })

    const overlay = new GoogleMapsOverlay({
      effects: [lightingEffect],
    })

    overlay.setMap(map)
    deckOverlayRef.current = overlay

    console.log('✅ Deck.gl overlay initialized')
  }, [])

  // Update deck.gl layers when data changes
  useEffect(() => {
    if (!deckOverlayRef.current) return

    console.log('🔄 Updating deck.gl layers:', {
      hasBuildingsData: !!buildingsData,
      buildingCount: buildingsData?.features?.length || 0,
      hasProposalGeom: !!proposalGeom
    })

    const layers = []

    // Buildings layer
    if (buildingsData) {
      layers.push(
        new GeoJsonLayer({
          id: 'buildings-layer',
          data: buildingsData,
          extruded: true,
          wireframe: false,
          filled: true,
          pickable: false,

          getElevation: (f: any) => f.properties.height || 10,
          getFillColor: [148, 163, 184, 180], // gray-400 with transparency
          getLineColor: [100, 116, 139, 255], // gray-500 border
          lineWidthMinPixels: 1,

          // Lighting material
          material: {
            ambient: 0.35,
            diffuse: 0.6,
            shininess: 32,
            specularColor: [60, 64, 70],
          },
        })
      )
    }

    // Proposal highlight layer
    if (proposalGeom) {
      let highlightData: any = null

      if (proposalGeom.type === 'Point') {
        // Create circle around point (50m radius)
        const radius = 50 / 111320 // Convert 50m to degrees (approx)
        const [lng, lat] = proposalGeom.coordinates
        const segments = 32
        const coordinates = []

        for (let i = 0; i <= segments; i++) {
          const angle = (i / segments) * 2 * Math.PI
          coordinates.push([
            lng + radius * Math.cos(angle),
            lat + radius * Math.sin(angle),
          ])
        }

        highlightData = {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [coordinates],
          },
          properties: { type: 'proposal-area' },
        }
      } else if (proposalGeom.type === 'Polygon') {
        highlightData = {
          type: 'Feature',
          geometry: proposalGeom,
          properties: { type: 'proposal-area' },
        }
      }

      if (highlightData) {
        layers.push(
          new GeoJsonLayer({
            id: 'proposal-highlight',
            data: highlightData,
            filled: true,
            stroked: true,
            pickable: false,

            getFillColor: [251, 191, 36, 127], // yellow-400 with 50% opacity
            getLineColor: [251, 191, 36, 255], // solid yellow
            getLineWidth: 3,
            lineWidthMinPixels: 3,
          })
        )
      }
    }

    deckOverlayRef.current.setProps({ layers })
    console.log('✅ Deck.gl layers updated:', { layerCount: layers.length })
  }, [buildingsData, proposalGeom])

  return (
    <div className="relative w-full h-full">
      {/* Map Container */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Loading Overlay */}
      {loadingBuildings && (
        <div className="absolute top-4 right-4 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg px-4 py-3 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-gray-600 border-t-indigo-500 rounded-full animate-spin" />
            <span className="text-sm text-gray-300">Loading buildings...</span>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="absolute top-4 right-4 bg-red-900/90 backdrop-blur-sm border border-red-700 rounded-lg px-4 py-3 shadow-lg max-w-sm">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-200">Error</p>
              <p className="text-xs text-red-300 mt-1">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overlay */}
      <div className="absolute bottom-4 left-4 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg px-4 py-3 shadow-lg">
        <div className="space-y-1 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Buildings:</span>
            <span className="text-gray-200 font-medium">
              {buildingsData?.features?.length || 0}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">Camera:</span>
            <span className="text-gray-200 font-mono">
              {centerLat.toFixed(5)}, {centerLng.toFixed(5)}
            </span>
          </div>
        </div>
      </div>

      {/* Controls Help */}
      <div className="absolute bottom-4 right-4 bg-gray-800/90 backdrop-blur-sm border border-gray-700 rounded-lg px-4 py-3 shadow-lg">
        <h4 className="text-xs font-semibold text-gray-300 mb-2">Controls</h4>
        <div className="space-y-1 text-xs text-gray-400">
          <div>• Drag to pan</div>
          <div>• Scroll to zoom</div>
          <div>• Ctrl + Drag to rotate</div>
          <div>• Shift + Drag to tilt</div>
        </div>
      </div>
    </div>
  )
}
