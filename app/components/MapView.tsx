'use client'

// ARENA V1.0 - Deck.gl + Google Maps MapView
import { useEffect, useState, useRef, useCallback } from 'react'
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps'
import { GeoJsonLayer, IconLayer } from '@deck.gl/layers'
import { GoogleMapsOverlay } from '@deck.gl/google-maps'
import { AmbientLight, DirectionalLight, LightingEffect } from '@deck.gl/core'
import type { DetectedFeature } from '@/src/lib/feature-detection'

interface Proposal {
  id: string
  title: string
  summary: string | null
  geom: {
    type: string
    coordinates: [number, number]
  }
  status: string
  layer: string
  tags: string[]
  osmId?: string | null
  osmType?: string | null
  author?: {
    name: string
    email: string
  }
  createdAt?: string
}

interface MapViewDeckProps {
  externalMapMode?: 'navigate' | 'create'
  externalSelectionMode?: 'building' | 'point' | 'polygon'
  onMapModeChange?: (mode: 'navigate' | 'create') => void
  onSelectionModeChange?: (mode: 'building' | 'point' | 'polygon') => void
  onAreaSelected?: (area: {
    type: 'building' | 'point' | 'polygon'
    geometry: any
    bounds: {
      north: number
      south: number
      east: number
      west: number
    }
  }) => void
  onRefreshProposals?: React.MutableRefObject<(() => void) | null>
  onProposalClick?: (proposalId: string) => void
}

// Deck.gl overlay component
function DeckGLOverlay({
  selectedBuildingIds,
  hoveredBuildingId,
  onBuildingClick,
  onBuildingHover,
  mapMode,
  selectionMode,
  pointRadius,
  polygonPoints,
  proposals,
  onProposalClick,
  onProposalHover
}: {
  selectedBuildingIds: string[]
  hoveredBuildingId: string | null
  onBuildingClick: (id: string, coords: [number, number], multiSelect?: boolean) => void
  onBuildingHover: (id: string | null) => void
  mapMode: 'navigate' | 'create'
  selectionMode: 'building' | 'point' | 'polygon'
  pointRadius?: number
  polygonPoints?: [number, number][]
  proposals: Proposal[]
  onProposalClick: (proposalId: string) => void
  onProposalHover: (proposal: any | null) => void
}) {
  const map = useMap()
  const overlayRef = useRef<GoogleMapsOverlay | null>(null)
  const [buildingData, setBuildingData] = useState<any>(null)
  const [mapReady, setMapReady] = useState(false)
  const [mousePosition, setMousePosition] = useState<[number, number] | null>(null)

  // Wait for map to be ready
  useEffect(() => {
    if (!map) return

    const checkReady = () => {
      const googleMap = map as any
      if (googleMap.addListener) {
        setMapReady(true)
      } else {
        setTimeout(checkReady, 100)
      }
    }

    checkReady()
  }, [map])

  // Track mouse position for Point mode cursor preview (throttled)
  useEffect(() => {
    if (!map || selectionMode !== 'point') {
      setMousePosition(null)
      return
    }

    const googleMap = map as any
    let animationFrameId: number | null = null
    let pendingUpdate: [number, number] | null = null

    const listener = googleMap.addListener('mousemove', (e: any) => {
      if (e.latLng) {
        const lng = e.latLng.lng()
        const lat = e.latLng.lat()
        pendingUpdate = [lng, lat]

        // Throttle updates using requestAnimationFrame
        if (animationFrameId === null) {
          animationFrameId = requestAnimationFrame(() => {
            if (pendingUpdate) {
              setMousePosition(pendingUpdate)
            }
            animationFrameId = null
          })
        }
      }
    })

    return () => {
      if (listener) listener.remove()
      if (animationFrameId !== null) {
        cancelAnimationFrame(animationFrameId)
      }
    }
  }, [map, selectionMode])

  // Load building data
  useEffect(() => {
    fetch('/data/ba-buildings.json')
      .then(res => res.json())
      .then(data => {
        console.log(`✅ Loaded ${data.features.length} buildings`)
        setBuildingData(data)
      })
      .catch(err => console.error('❌ Failed to load buildings:', err))
  }, [])

  // Helper function to create circle GeoJSON for point radius
  const createCircleGeoJSON = (center: [number, number], radiusMeters: number) => {
    const points = 64
    const coords: [number, number][] = []
    const earthRadius = 6371000 // meters

    for (let i = 0; i <= points; i++) {
      const angle = (i * 360) / points
      const rad = (angle * Math.PI) / 180

      const lat = center[1] + (radiusMeters / earthRadius) * (180 / Math.PI) * Math.cos(rad)
      const lng = center[0] + (radiusMeters / earthRadius) * (180 / Math.PI) * Math.sin(rad) / Math.cos((center[1] * Math.PI) / 180)

      coords.push([lng, lat])
    }

    return {
      type: 'FeatureCollection',
      features: [{
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [coords]
        },
        properties: {}
      }]
    }
  }

  // Helper function to create polygon preview GeoJSON
  const createPolygonPreviewGeoJSON = (points: [number, number][]) => {
    if (points.length === 0) return { type: 'FeatureCollection', features: [] }

    const features: any[] = []

    // Add line segments connecting points
    if (points.length >= 2) {
      const lineCoords = [...points]
      if (points.length >= 3) {
        lineCoords.push(points[0]) // Close the polygon if 3+ points
      }

      features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: lineCoords
        },
        properties: {}
      })
    }

    // Add filled polygon if 3+ points
    if (points.length >= 3) {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [[...points, points[0]]]
        },
        properties: {}
      })
    }

    // Add point markers
    points.forEach((point, index) => {
      features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: point
        },
        properties: { index }
      })
    })

    return { type: 'FeatureCollection', features }
  }

  // Create deck.gl overlay (initial setup only)
  useEffect(() => {
    console.log('🔄 Overlay initial setup:', { hasMap: !!map, hasBuildingData: !!buildingData, mapReady })
    if (!map || !buildingData || !mapReady) return

    console.log('✅ Creating Deck.gl overlay with lighting...')

    // Configure lighting effects (like the trips example)
    const ambientLight = new AmbientLight({
      color: [255, 255, 255],
      intensity: 1.0
    })

    const directionalLight = new DirectionalLight({
      color: [255, 255, 255],
      intensity: 2.0,
      direction: [-1, -3, -1] // From northwest, high angle (creates shadows)
    })

    const lightingEffect = new LightingEffect({ ambientLight, directionalLight })

    // Create overlay once with lighting effects
    const overlay = new GoogleMapsOverlay({
      layers: [],
      effects: [lightingEffect]
    })
    overlay.setMap(map as any)
    overlayRef.current = overlay

    return () => {
      overlay.setMap(null)
      overlayRef.current = null
    }
  }, [map, buildingData, mapReady])

  // Update layers when state changes (without recreating overlay)
  useEffect(() => {
    if (!overlayRef.current || !buildingData) return

    // Build layers array
    const layers: any[] = []

    // Add proposal pins layer (always visible in navigate mode)
    if (mapMode === 'navigate' && proposals.length > 0) {
      // Filter proposals that have geometry
      const proposalsWithGeometry = proposals.filter(p => p.geom)

      layers.push(
        new IconLayer({
          id: 'proposal-pins',
          data: proposalsWithGeometry,
          getPosition: (d: any) => {
            if (!d.geom) return [0, 0]
            if (d.geom.type === 'Point') return d.geom.coordinates
            if (d.geom.type === 'Polygon') return d.geom.coordinates[0][0]
            if (d.geom.type === 'LineString') return d.geom.coordinates[0]
            if (d.geom.type === 'MultiPoint') return d.geom.coordinates[0]
            return [0, 0]
          },
          getIcon: (d: any) => ({
            url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPCEtLSBEcm9wIHNoYWRvdyAtLT4KPGVsbGlwc2UgY3g9IjI0IiBjeT0iNDQiIHJ4PSI2IiByeT0iMiIgZmlsbD0iYmxhY2siIG9wYWNpdHk9IjAuMiIvPgo8IS0tIFBpbiBib2R5IC0tPgo8cGF0aCBkPSJNMjQgNEMxNy4zNzI2IDQgMTIgOS4zNzI1OCAxMiAxNkMxMiAyNC41IDE5IDMzIDI0IDQwQzI5IDMzIDM2IDI0LjUgMzYgMTZDMzYgOS4zNzI1OCAzMC42Mjc0IDQgMjQgNFoiIGZpbGw9IiM4QjVDRjYiLz4KPCEtLSBJbm5lciBjaXJjbGUgLS0+CjxjaXJjbGUgY3g9IjI0IiBjeT0iMTYiIHI9IjYiIGZpbGw9IndoaXRlIi8+Cjwvc3ZnPg==',
            width: 48,
            height: 48,
            anchorY: 48 // Pin bottom at the location
          }),
          getSize: 48,
          pickable: true,
          onClick: (info: any) => {
            if (info.object) {
              console.log('📍 Clicked proposal:', info.object.id)
              onProposalClick(info.object.id)
            }
          },
          onHover: (info: any) => {
            // Set hovered proposal for tooltip
            if (info.object) {
              onProposalHover({
                id: info.object.id,
                title: info.object.title,
                summary: info.object.summary,
                author: info.object.author?.name || 'Unknown'
              })
            } else {
              onProposalHover(null)
            }

            // Change cursor on hover
            if (map) {
              const googleMap = map as any
              googleMap.setOptions({
                draggableCursor: info.object ? 'pointer' : 'grab'
              })
            }
          }
        })
      )
    }

    // Add building layer (only in create mode for performance)
    if (mapMode === 'create' && selectionMode === 'building') {
      layers.push(
        new GeoJsonLayer({
          id: 'buildings',
          data: buildingData as any,
          extruded: true,
          wireframe: false, // Solid buildings for better lighting
          filled: true,
          stroked: true,
          pickable: true,

          // Extrusion height
          getElevation: (f: any) => f.properties.height || 10,

          // Material properties (realistic lighting like trips example)
          material: {
            ambient: 0.35,      // Slightly higher ambient for visibility
            diffuse: 0.6,       // Medium diffuse for realistic surfaces
            shininess: 32,      // Slight shininess
            specularColor: [60, 64, 70]  // Subtle specular highlights
          },

          // Fill color (light gray default, dark indigo when selected, medium indigo when hovered)
          getFillColor: (f: any) => {
            const id = f.properties.id
            if (selectedBuildingIds.includes(id)) {
              return [67, 56, 202, 200] // Dark indigo (selected)
            }
            if (hoveredBuildingId === id && mapMode === 'create') {
              return [99, 102, 241, 150] // Medium indigo (hover)
            }
            return [240, 240, 240, 180] // Light gray (default)
          },

          // Line color (border)
          getLineColor: (f: any) => {
            const id = f.properties.id
            if (selectedBuildingIds.includes(id)) {
              return [67, 56, 202, 255] // Dark indigo border
            }
            if (hoveredBuildingId === id && mapMode === 'create') {
              return [79, 70, 229, 255] // Darker indigo border (hover)
            }
            return [165, 180, 252, 150] // Light indigo border (default)
          },

          lineWidthMinPixels: 1,

          // Click handler
          onClick: (info: any, event: any) => {
            console.log('🖱️ Deck.gl onClick fired:', { mapMode, selectionMode, hasObject: !!info.object, event })
            if (mapMode === 'create' && selectionMode === 'building' && info.object) {
              const buildingId = info.object.properties.id
              const coords = info.object.geometry.coordinates[0][0] as [number, number]
              // Detect Ctrl/Cmd key for multi-selection
              const multiSelect = event?.srcEvent?.ctrlKey || event?.srcEvent?.metaKey || false
              console.log('🏢 Building clicked:', { buildingId, coords, multiSelect })
              onBuildingClick(buildingId, coords, multiSelect)
            }
          },

          // Hover handler
          onHover: (info: any) => {
            const buildingId = info.object?.properties?.id || null
            onBuildingHover(buildingId)
          },

          updateTriggers: {
            getFillColor: [selectedBuildingIds, hoveredBuildingId],
            getLineColor: [selectedBuildingIds, hoveredBuildingId]
          }
        })
      )
    }

    // Add point radius circle layer (Point mode)
    if (selectionMode === 'point' && mousePosition && pointRadius) {
      const circleData = createCircleGeoJSON(mousePosition, pointRadius)
      layers.push(
        new GeoJsonLayer({
          id: 'point-radius-circle',
          data: circleData as any,
          filled: true,
          stroked: true,
          getFillColor: [99, 102, 241, 50], // Indigo with transparency
          getLineColor: [79, 70, 229, 255], // Solid indigo border
          getLineWidth: 2,
          lineWidthMinPixels: 2,
          pickable: false
        })
      )
    }

    // Add polygon preview layer (Polygon mode)
    if (selectionMode === 'polygon' && polygonPoints && polygonPoints.length > 0) {
      const polygonData = createPolygonPreviewGeoJSON(polygonPoints)
      layers.push(
        new GeoJsonLayer({
          id: 'polygon-preview',
          data: polygonData as any,
          filled: true,
          stroked: true,
          pointRadiusMinPixels: 6,
          getFillColor: [139, 92, 246, 50], // Purple with transparency
          getLineColor: [124, 58, 237, 255], // Solid purple border
          getLineWidth: 3,
          lineWidthMinPixels: 3,
          getPointRadius: 6,
          pickable: false
        })
      )
    }

    // Update layers without recreating the overlay
    overlayRef.current.setProps({ layers })
  }, [buildingData, selectedBuildingIds, hoveredBuildingId, mapMode, selectionMode, mousePosition, pointRadius, polygonPoints, proposals, map, onBuildingClick, onBuildingHover])

  return null
}

export default function MapViewDeck({
  externalMapMode,
  externalSelectionMode,
  onMapModeChange,
  onSelectionModeChange,
  onAreaSelected,
  onRefreshProposals,
  onProposalClick
}: MapViewDeckProps = {}) {
  // Map mode state
  const [internalMapMode, setInternalMapMode] = useState<'navigate' | 'create'>('navigate')
  const mapMode = externalMapMode ?? internalMapMode
  const setMapMode = (mode: 'navigate' | 'create') => {
    setInternalMapMode(mode)
    onMapModeChange?.(mode)
  }

  // Selection mode state
  const [internalSelectionMode, setInternalSelectionMode] = useState<'building' | 'point' | 'polygon'>('building')
  const selectionMode = externalSelectionMode ?? internalSelectionMode
  const setSelectionMode = (mode: 'building' | 'point' | 'polygon') => {
    setInternalSelectionMode(mode)
    onSelectionModeChange?.(mode)
  }

  // Selection state
  const [selectedBuildingIds, setSelectedBuildingIds] = useState<string[]>([])
  const [hoveredBuildingId, setHoveredBuildingId] = useState<string | null>(null)
  const [selectedCoords, setSelectedCoords] = useState<{ lng: number; lat: number } | undefined>()

  // Point mode state
  const [pointRadius, setPointRadius] = useState(50) // meters

  // Polygon mode state
  const [polygonPoints, setPolygonPoints] = useState<[number, number][]>([])
  const [drawnPolygon, setDrawnPolygon] = useState<GeoJSON.Polygon | null>(null)

  // 3D view state
  const [is3D, setIs3D] = useState(true)

  // Proposals state
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [viewedProposalId, setViewedProposalId] = useState<string | null>(null)
  const [hoveredProposal, setHoveredProposal] = useState<any>(null)

  // Fetch proposals function (exposed via ref for refresh)
  const fetchProposals = useCallback(async () => {
    try {
      console.log('🔄 Fetching proposals from API...')
      const response = await fetch('/api/proposals?status=public')
      if (response.ok) {
        const data = await response.json()
        console.log(`✅ Loaded ${data.proposals?.length || 0} proposals`)
        setProposals(data.proposals || [])
      }
    } catch (error) {
      console.error('Failed to fetch proposals:', error)
    }
  }, [])

  // Fetch proposals on mount
  useEffect(() => {
    fetchProposals()
  }, [fetchProposals])

  // Expose refresh function via ref
  useEffect(() => {
    if (onRefreshProposals) {
      onRefreshProposals.current = fetchProposals
    }
  }, [onRefreshProposals, fetchProposals])

  // Building click handler
  const handleBuildingClick = useCallback((buildingId: string, coords: [number, number], multiSelect: boolean = false) => {
    console.log('🏢 Building clicked:', { buildingId, multiSelect })

    if (multiSelect) {
      // Ctrl+click: toggle selection (add or remove)
      setSelectedBuildingIds(prev => {
        if (prev.includes(buildingId)) {
          // Remove if already selected
          return prev.filter(id => id !== buildingId)
        } else {
          // Add to selection
          return [...prev, buildingId]
        }
      })
    } else {
      // Normal click: single selection (replace previous)
      setSelectedBuildingIds([buildingId])

      // Call onAreaSelected callback with building geometry
      if (mapMode === 'create' && onAreaSelected) {
        setSelectedCoords({ lng: coords[0], lat: coords[1] })

        // Create area object for building selection
        onAreaSelected({
          type: 'building',
          geometry: {
            type: 'Point',
            coordinates: coords
          },
          bounds: {
            north: coords[1] + 0.0001,
            south: coords[1] - 0.0001,
            east: coords[0] + 0.0001,
            west: coords[0] - 0.0001
          }
        })
      }
    }

    if (!multiSelect) {
      setSelectedCoords({ lng: coords[0], lat: coords[1] })
    }
  }, [mapMode, onAreaSelected])

  // Building hover handler
  const handleBuildingHover = useCallback((buildingId: string | null) => {
    setHoveredBuildingId(buildingId)
  }, [])

  // Proposal click handler (for viewing)
  const handleProposalClick = (proposalId: string) => {
    console.log('📍 Proposal pin clicked:', proposalId)
    // Call parent handler if provided
    if (onProposalClick) {
      onProposalClick(proposalId)
    }
  }

  // Proposal hover handler (for tooltip)
  const handleProposalHover = (proposal: any | null) => {
    setHoveredProposal(proposal)
  }

  // Map click handler for Point and Polygon modes
  const handleMapClick = useCallback((event: any) => {
    if (mapMode !== 'create') return

    const { lat, lng } = event.detail.latLng

    console.log('🗺️ Map clicked:', { selectionMode, lat, lng })

    if (selectionMode === 'point') {
      // Point mode: call onAreaSelected callback
      setSelectedCoords({ lng, lat })

      if (onAreaSelected) {
        onAreaSelected({
          type: 'point',
          geometry: {
            type: 'Point',
            coordinates: [lng, lat]
          },
          bounds: {
            north: lat + 0.0001,
            south: lat - 0.0001,
            east: lng + 0.0001,
            west: lng - 0.0001
          }
        })
      }
    } else if (selectionMode === 'polygon') {
      // Polygon mode: add point to polygon
      setPolygonPoints(prev => [...prev, [lng, lat]])
    }
  }, [mapMode, selectionMode, onAreaSelected])

  // Debug logging
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
  console.log('🗺️ MapView Component - Rendering with:', {
    hasApiKey: !!apiKey,
    apiKeyLength: apiKey?.length,
    apiKeyPrefix: apiKey?.substring(0, 10) + '...',
    mapMode,
    selectionMode,
    proposalsCount: proposals.length
  })

  if (!apiKey) {
    console.error('❌ NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not defined!')
    return (
      <div className="w-full h-full flex items-center justify-center bg-red-50">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-red-600 mb-2">Google Maps API Key Missing</h2>
          <p className="text-red-500">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY environment variable is not set</p>
        </div>
      </div>
    )
  }

  return (
    <div className="relative w-full h-full">
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={{ lat: -34.545, lng: -58.46 }} // Núñez area
          defaultZoom={18}
          tilt={is3D ? 67.5 : 0}
          heading={0}
          gestureHandling="greedy"
          disableDefaultUI={false}
          className="w-full h-full"
          mapId="bf51a910020fa25a"
          mapTypeId="roadmap"
          onClick={handleMapClick}
          style={{ cursor: mapMode === 'create' ? 'crosshair' : 'auto' }}
        >
          <DeckGLOverlay
            selectedBuildingIds={selectedBuildingIds}
            hoveredBuildingId={hoveredBuildingId}
            onBuildingClick={handleBuildingClick}
            onBuildingHover={handleBuildingHover}
            mapMode={mapMode}
            selectionMode={selectionMode}
            pointRadius={pointRadius}
            polygonPoints={polygonPoints}
            proposals={proposals}
            onProposalClick={handleProposalClick}
            onProposalHover={handleProposalHover}
          />
        </Map>
      </APIProvider>

      {/* 2D/3D Toggle - top right */}
      <button
        onClick={() => setIs3D(!is3D)}
        className="absolute top-6 right-6 z-40 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg px-4 py-2.5 hover:bg-gray-50 transition-all flex items-center gap-2"
      >
        <span className="text-sm font-medium text-gray-700">
          {is3D ? '3D' : '2D'}
        </span>
        <svg className="w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
        </svg>
      </button>

      {/* Point mode radius control */}
      {mapMode === 'create' && selectionMode === 'point' && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg p-5">
          <div className="bg-indigo-50 border border-indigo-200 rounded-lg px-4 py-3">
            <label className="text-sm text-indigo-900 font-semibold mb-3 block">
              Radio: {pointRadius}m
            </label>
            <input
              type="range"
              min="1"
              max="100"
              value={pointRadius}
              onChange={(e) => setPointRadius(Number(e.target.value))}
              className="w-full h-2 bg-indigo-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-indigo-600 mt-2 font-medium">
              <span>1m</span>
              <span>100m</span>
            </div>
          </div>
        </div>
      )}

      {/* Selection info - bottom center */}
      {mapMode === 'create' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg px-5 py-3.5">
          {selectionMode === 'building' && (
            <span className="text-sm text-gray-600">
              {selectedBuildingIds.length > 0
                ? `${selectedBuildingIds.length} building${selectedBuildingIds.length > 1 ? 's' : ''} selected`
                : 'Click a building to select'}
            </span>
          )}
          {selectionMode === 'point' && (
            <span className="text-sm text-gray-600">Click anywhere to place a point</span>
          )}
          {selectionMode === 'polygon' && polygonPoints.length < 3 && (
            <span className="text-sm text-gray-600">
              {polygonPoints.length === 0 ? 'Click to draw an area' : `${polygonPoints.length} points • Need 3+ for polygon`}
            </span>
          )}
          {selectionMode === 'polygon' && polygonPoints.length >= 3 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-purple-900 font-medium">
                {polygonPoints.length} points • Polygon ready
              </span>
              <button
                onClick={() => {
                  const closedRing = [...polygonPoints, polygonPoints[0]]
                  const polygon: GeoJSON.Polygon = {
                    type: 'Polygon',
                    coordinates: [closedRing]
                  }
                  const centroidLng = polygonPoints.reduce((sum, p) => sum + p[0], 0) / polygonPoints.length
                  const centroidLat = polygonPoints.reduce((sum, p) => sum + p[1], 0) / polygonPoints.length
                  setDrawnPolygon(polygon)
                  setSelectedCoords({ lng: centroidLng, lat: centroidLat })

                  // Call onAreaSelected callback with polygon geometry
                  if (onAreaSelected) {
                    // Calculate bounds
                    const lngs = polygonPoints.map(p => p[0])
                    const lats = polygonPoints.map(p => p[1])
                    const bounds = {
                      north: Math.max(...lats),
                      south: Math.min(...lats),
                      east: Math.max(...lngs),
                      west: Math.min(...lngs)
                    }

                    onAreaSelected({
                      type: 'polygon',
                      geometry: polygon,
                      bounds
                    })
                  }
                }}
                className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 font-medium text-sm"
              >
                Create Proposal
              </button>
            </div>
          )}
        </div>
      )}

      {/* Hover tooltip for proposals */}
      {hoveredProposal && (
        <div className="absolute top-24 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
          <div className="bg-white rounded-xl shadow-2xl border border-indigo-100 p-4 max-w-sm backdrop-blur-sm bg-white/95">
            {/* Tooltip content */}
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2">{hoveredProposal.title}</h3>
                <p className="text-xs text-gray-500 mb-1.5">
                  <span className="font-medium">{hoveredProposal.author}</span>
                </p>
                {hoveredProposal.summary && (
                  <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{hoveredProposal.summary}</p>
                )}
                <p className="text-xs text-indigo-600 font-medium mt-2">Click para ver detalles →</p>
              </div>
            </div>

            {/* Arrow pointing down */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b border-r border-indigo-100 rotate-45"></div>
          </div>
        </div>
      )}
    </div>
  )
}
