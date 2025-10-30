'use client'

// ARENA V1.0 - Deck.gl + Google Maps MapView
import { useEffect, useState, useRef, useCallback } from 'react'
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps'
import { GeoJsonLayer } from '@deck.gl/layers'
import { GoogleMapsOverlay } from '@deck.gl/google-maps'
import { AmbientLight, DirectionalLight, LightingEffect } from '@deck.gl/core'
import ProposalDrawer from './ProposalDrawer'
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

    // Add proposal markers layer (always visible in navigate mode)
    if (mapMode === 'navigate' && proposals.length > 0) {
      // Convert proposals to GeoJSON features (limit to recent 10 for performance)
      const proposalFeatures = {
        type: 'FeatureCollection',
        features: proposals
          .filter(p => p.geom && p.geom.type === 'Point') // Only show Point proposals as markers
          .slice(0, 10) // Limit to 10 most recent for performance
          .map(p => ({
            type: 'Feature',
            geometry: p.geom,
            properties: {
              id: p.id,
              title: p.title,
              summary: p.summary,
              layer: p.layer,
              status: p.status,
              tags: p.tags,
              author: p.author?.name || 'Unknown'
            }
          }))
      }

      layers.push(
        new GeoJsonLayer({
          id: 'proposals',
          data: proposalFeatures as any,
          pointType: 'circle',
          getPointRadius: 20,
          pointRadiusMinPixels: 20,
          pointRadiusMaxPixels: 30,
          getFillColor: [79, 70, 229, 255], // Indigo-600 bright for visibility
          getLineColor: [255, 255, 255, 255], // White border for contrast
          lineWidthMinPixels: 3,
          pickable: true,
          onClick: (info: any) => {
            if (info.object) {
              console.log('📍 Proposal clicked:', info.object.properties)
              onProposalClick(info.object.properties.id)
            }
          },
          onHover: (info: any) => {
            // Set hovered proposal for tooltip
            if (info.object) {
              onProposalHover(info.object.properties)
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
  onSelectionModeChange
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

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'create' | 'view'>('create')

  // Proposals state
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [viewedProposalId, setViewedProposalId] = useState<string | null>(null)
  const [hoveredProposal, setHoveredProposal] = useState<any>(null)

  // Fetch proposals
  useEffect(() => {
    async function fetchProposals() {
      try {
        const response = await fetch('/api/proposals?status=public')
        if (response.ok) {
          const data = await response.json()
          setProposals(data.proposals || [])
        }
      } catch (error) {
        console.error('Failed to fetch proposals:', error)
      }
    }
    fetchProposals()
  }, [])

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

      // Open drawer immediately for single-click (create mode)
      if (mapMode === 'create') {
        setSelectedCoords({ lng: coords[0], lat: coords[1] })
        setDrawerMode('create')
        setDrawerOpen(true)
      }
    }

    if (!multiSelect) {
      setSelectedCoords({ lng: coords[0], lat: coords[1] })
    }
  }, [mapMode])

  // Building hover handler
  const handleBuildingHover = useCallback((buildingId: string | null) => {
    setHoveredBuildingId(buildingId)
  }, [])

  // Create proposal handler
  const handleCreateProposal = () => {
    if (selectedBuildingIds.length === 0) return

    setDrawerMode('create')
    setDrawerOpen(true)
  }

  // Proposal created handler
  const handleProposalCreated = (newProposal: any) => {
    setProposals((prev) => [newProposal, ...prev])
    setSelectedBuildingIds([])
    setSelectedCoords(undefined)
    setMapMode('navigate') // Return to navigate mode after creating
  }

  // Proposal click handler (for viewing)
  const handleProposalClick = (proposalId: string) => {
    setViewedProposalId(proposalId)
    setDrawerMode('view')
    setDrawerOpen(true)
  }

  // Proposal hover handler (for tooltip)
  const handleProposalHover = (proposal: any | null) => {
    setHoveredProposal(proposal)
  }

  // Close drawer handler
  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setSelectedBuildingIds([])
    setSelectedCoords(undefined)
    setPolygonPoints([])
    setDrawnPolygon(null)
  }

  // Map click handler for Point and Polygon modes
  const handleMapClick = useCallback((event: any) => {
    if (mapMode !== 'create') return

    const { lat, lng } = event.detail.latLng

    console.log('🗺️ Map clicked:', { selectionMode, lat, lng })

    if (selectionMode === 'point') {
      // Point mode: set coordinates and open drawer
      setSelectedCoords({ lng, lat })
      setDrawerMode('create')
      setDrawerOpen(true)
    } else if (selectionMode === 'polygon') {
      // Polygon mode: add point to polygon
      setPolygonPoints(prev => [...prev, [lng, lat]])
    }
  }, [mapMode, selectionMode])

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
            <>
              {selectedBuildingIds.length > 0 ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm text-indigo-900 font-medium">
                    {selectedBuildingIds.length} building{selectedBuildingIds.length > 1 ? 's' : ''} selected
                  </span>
                  <button
                    onClick={handleCreateProposal}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 font-medium text-sm"
                  >
                    Create Proposal
                  </button>
                </div>
              ) : (
                <span className="text-sm text-gray-600">Click a building to select</span>
              )}
            </>
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
                  setDrawerMode('create')
                  setDrawerOpen(true)
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
        <div
          className="absolute pointer-events-none z-50 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-xl p-4 max-w-sm"
          style={{
            left: '50%',
            top: '50%',
            transform: 'translate(-50%, -120px)'
          }}
        >
          <h3 className="font-semibold text-gray-900 text-sm mb-1">{hoveredProposal.title}</h3>
          <p className="text-xs text-gray-500 mb-2">
            {hoveredProposal.author} • {new Date().toLocaleDateString('es-AR')}
          </p>
          {hoveredProposal.summary && (
            <p className="text-xs text-gray-700 line-clamp-2">{hoveredProposal.summary}</p>
          )}
        </div>
      )}

      <ProposalDrawer
        isOpen={drawerOpen}
        mode={drawerMode}
        onClose={handleCloseDrawer}
        coordinates={selectedCoords}
        onProposalCreated={handleProposalCreated}
        viewedProposalId={viewedProposalId}
        selectedFeatures={selectedBuildingIds.map(id => ({
          id,
          type: 'building',
          osmId: id,
          geometry: { type: 'Point', coordinates: [selectedCoords?.lng || 0, selectedCoords?.lat || 0] } as GeoJSON.Geometry,
          properties: {},
          layer: 'building'
        }))}
        drawnPolygon={drawnPolygon}
        pointRadius={selectionMode === 'point' ? pointRadius : undefined}
      />
    </div>
  )
}
