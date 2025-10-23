'use client'

// ARENA V1.0 - MapLibre Map Component
import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import ProposalDrawer from './ProposalDrawer'
import { detectFeaturesAtPoint, getCentroid, DetectedFeature } from '@/src/lib/feature-detection'

interface POI {
  id: string
  name: string
  type: string
  geom: {
    type: string
    coordinates: [number, number]
  }
  address?: string
}

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
}

export default function MapView() {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [pois, setPois] = useState<POI[]>([])
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)

  // Map mode state
  const [mapMode, setMapMode] = useState<'navigate' | 'create'>('navigate')

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'create' | 'view'>('create')
  const [selectedCoords, setSelectedCoords] = useState<{ lng: number; lat: number } | undefined>()
  const [selectedProposalId, setSelectedProposalId] = useState<string | undefined>()

  // Feature selection state
  const [selectedFeature, setSelectedFeature] = useState<DetectedFeature | null>(null)

  // Store markers references
  const proposalMarkersRef = useRef<maplibregl.Marker[]>([])

  // Fetch POIs
  useEffect(() => {
    async function fetchPOIs() {
      try {
        const response = await fetch('/api/pois')
        if (response.ok) {
          const data = await response.json()
          setPois(data.pois || [])
        }
      } catch (error) {
        console.error('Error fetching POIs:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchPOIs()
  }, [])

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
        console.error('Error fetching proposals:', error)
      }
    }
    fetchProposals()
  }, [])

  // Store mapMode in a ref to avoid reinitialization
  const mapModeRef = useRef(mapMode)
  useEffect(() => {
    mapModeRef.current = mapMode
  }, [mapMode])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [-58.4600, -34.5450],
      zoom: 14,
      attributionControl: false,
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'top-right')
    map.current.addControl(new maplibregl.AttributionControl({ compact: true }), 'bottom-right')

    // Add OSM Vector Tiles source and layers after the style loads
    map.current.on('load', () => {
      if (!map.current) return

      // Add OSM Vector Tiles source (OpenFreeMap - uses OpenMapTiles schema)
      map.current.addSource('osm-vector', {
        type: 'vector',
        tiles: ['https://tiles.openfreemap.org/planet/{z}/{x}/{y}.pbf'],
        minzoom: 0,
        maxzoom: 14,
        attribution: '© OpenFreeMap © OpenStreetMap contributors'
      })

      // Add transparent layers for OSM feature detection
      // These layers are invisible but allow querying OSM features
      // Using OpenMapTiles schema layer names

      // Buildings layer (transparent)
      map.current.addLayer({
        id: 'osm-buildings-selectable',
        type: 'fill',
        source: 'osm-vector',
        'source-layer': 'building',
        paint: {
          'fill-color': 'transparent',
          'fill-opacity': 0,
        },
      })

      // Roads layer (transparent)
      map.current.addLayer({
        id: 'osm-roads-selectable',
        type: 'line',
        source: 'osm-vector',
        'source-layer': 'transportation',
        paint: {
          'line-color': 'transparent',
          'line-width': 5,
          'line-opacity': 0,
        },
      })

      // Landuse layer (transparent)
      map.current.addLayer({
        id: 'osm-landuse-selectable',
        type: 'fill',
        source: 'osm-vector',
        'source-layer': 'landuse',
        paint: {
          'fill-color': 'transparent',
          'fill-opacity': 0,
        },
      })

      console.log('OSM Vector Tiles source and layers added successfully')

      // REFINED: Only small vectors (buildings, roads, small features)
      // Soft indigo by default → Strong indigo on hover

      // First, make buildings visible with soft indigo
      map.current.setPaintProperty('building', 'fill-color', '#818cf8') // Soft indigo
      map.current.setPaintProperty('building', 'fill-opacity', 0.3)

      // Building hover (strong indigo)
      map.current.addLayer({
        id: 'building-hover',
        type: 'fill',
        source: 'carto',
        'source-layer': 'building',
        paint: {
          'fill-color': '#4f46e5', // Strong indigo
          'fill-opacity': 0.8,
        },
        filter: ['==', ['id'], ''],
      })

      // Transportation hover (strong indigo line)
      map.current.addLayer({
        id: 'transportation-hover',
        type: 'line',
        source: 'carto',
        'source-layer': 'transportation',
        paint: {
          'line-color': '#4f46e5', // Strong indigo
          'line-width': 5,
          'line-opacity': 0.9,
        },
        filter: ['==', ['id'], ''],
      })

      // Track currently hovered feature
      let hoveredFeature: { layer: string; id: any } | null = null

      // Map of source-layers to hover layer IDs (only small vectors)
      const hoverLayerMap: Record<string, string> = {
        'building': 'building-hover',
        'transportation': 'transportation-hover',
      }

      // Helper function to update hover highlight
      const updateHover = (newFeature: { layer: string; id: any } | null) => {
        // Clear previous hover
        if (hoveredFeature) {
          const hoverLayerId = hoverLayerMap[hoveredFeature.layer]
          if (hoverLayerId && map.current!.getLayer(hoverLayerId)) {
            map.current!.setFilter(hoverLayerId, ['==', ['id'], ''])
          }
        }

        hoveredFeature = newFeature

        // Set new hover
        if (newFeature) {
          const hoverLayerId = hoverLayerMap[newFeature.layer]
          if (hoverLayerId && map.current!.getLayer(hoverLayerId)) {
            map.current!.setFilter(hoverLayerId, ['==', ['id'], newFeature.id])
          }
        }
      }

      // Add hover events ONLY for small vectors (buildings and roads)
      // NO large areas like blocks, landuse, boundaries

      const selectableLayerGroups = {
        'building': ['building', 'building-top'],
        'transportation': [
          'road_service_fill', 'road_minor_fill',
          'road_sec_fill_noramp', 'road_pri_fill_noramp',
          'road_trunk_fill_noramp', 'road_mot_fill_noramp',
          'road_pri_fill_ramp', 'road_trunk_fill_ramp', 'road_mot_fill_ramp',
          'tunnel_service_fill', 'tunnel_minor_fill', 'tunnel_sec_fill',
          'tunnel_pri_fill', 'tunnel_trunk_fill', 'tunnel_mot_fill',
          'bridge_service_fill', 'bridge_minor_fill', 'bridge_sec_fill',
          'bridge_pri_fill', 'bridge_trunk_fill', 'bridge_mot_fill',
          'rail', 'tunnel_rail', 'bridge_path'
        ]
      }

      // For each group, add hover listeners to all related layers
      Object.entries(selectableLayerGroups).forEach(([sourceLayerName, layerIds]) => {
        layerIds.forEach(layerId => {
          if (map.current!.getLayer(layerId)) {
            map.current!.on('mousemove', layerId, (e) => {
              if (e.features && e.features.length > 0) {
                map.current!.getCanvas().style.cursor = 'pointer'
                const feature = e.features[0]
                if (feature.id !== undefined) {
                  updateHover({ layer: sourceLayerName, id: feature.id })
                }
              }
            })

            map.current!.on('mouseleave', layerId, () => {
              map.current!.getCanvas().style.cursor = ''
              updateHover(null)
            })
          }
        })
      })

      // Diagnostic logging
      const style = map.current.getStyle()
      console.log('🗺️ Available layers:', style.layers.map(l => l.id))
      console.log('📦 Available sources:', Object.keys(style.sources))

      // Log all layers with their types and source-layers
      console.log('📋 All layers details:', style.layers.map(l => ({
        id: l.id,
        type: l.type,
        source: (l as any).source,
        sourceLayer: (l as any)['source-layer']
      })))

      // Log CartoDB source details
      const cartoSource = style.sources['carto'] as any
      console.log('🗺️ CartoDB source details:', {
        type: cartoSource?.type,
        url: cartoSource?.url,
        tiles: cartoSource?.tiles
      })

      // Log building layer details from CartoDB
      const buildingLayerInfo = style.layers.find(l => l.id === 'building')
      console.log('🏢 Building layer from CartoDB:', {
        id: buildingLayerInfo?.id,
        type: buildingLayerInfo?.type,
        source: (buildingLayerInfo as any)?.source,
        sourceLayer: (buildingLayerInfo as any)?.['source-layer']
      })

      // Verify osm-vector source has data
      map.current.on('sourcedata', (e) => {
        if (e.sourceId === 'osm-vector' && e.isSourceLoaded) {
          console.log('✅ osm-vector source loaded successfully')
          const source = map.current!.getSource('osm-vector') as any
          if (source._tileCache) {
            console.log('📍 Tile cache size:', source._tileCache.size || 0)
          }
        }
      })

      // Test query at map center after 3 seconds
      setTimeout(() => {
        if (!map.current) return
        const center = map.current.getCenter()
        const point = map.current.project(center)
        const testFeatures = map.current.queryRenderedFeatures(point)
        console.log('🧪 Test query at center:', {
          center: { lng: center.lng, lat: center.lat },
          point: { x: point.x, y: point.y },
          featuresFound: testFeatures.length,
          features: testFeatures.slice(0, 5).map(f => ({
            id: f.id,
            type: f.type,
            sourceLayer: f.sourceLayer,
            source: f.source,
            layer: f.layer?.id,
            properties: f.properties
          }))
        })

        // Log ALL features grouped by source
        const featuresBySource = testFeatures.reduce((acc, f) => {
          const key = `${f.source}/${f.sourceLayer || 'no-layer'}`
          if (!acc[key]) acc[key] = []
          acc[key].push(f)
          return acc
        }, {} as Record<string, any[]>)
        console.log('📊 Features grouped by source/sourceLayer:',
          Object.entries(featuresBySource).map(([key, features]) => ({
            key,
            count: features.length,
            sampleProperties: features[0]?.properties ? Object.keys(features[0].properties) : []
          }))
        )

        // Test query specifically for our OSM layers
        const osmFeatures = map.current!.queryRenderedFeatures(point, {
          layers: ['osm-buildings-selectable', 'osm-roads-selectable', 'osm-landuse-selectable']
        })
        console.log('🧪 Test query for OSM layers specifically:', {
          osmFeaturesFound: osmFeatures.length,
          osmFeatures: osmFeatures.slice(0, 3)
        })

        // Check if source has any loaded tiles
        const osmSource = map.current!.getSource('osm-vector') as any
        if (osmSource) {
          console.log('🗺️ OSM Source state:', {
            type: osmSource.type,
            tiles: osmSource.tiles,
            loaded: osmSource._loaded,
            hasTiles: osmSource._tiles ? Object.keys(osmSource._tiles).length : 0,
            tileKeys: osmSource._tiles ? Object.keys(osmSource._tiles).slice(0, 5) : []
          })

          // If tiles exist, inspect one
          if (osmSource._tiles) {
            const firstTileKey = Object.keys(osmSource._tiles)[0]
            if (firstTileKey) {
              const firstTile = osmSource._tiles[firstTileKey]
              console.log('🔍 First tile inspection:', {
                key: firstTileKey,
                state: firstTile.state,
                hasData: !!firstTile.vectorTile,
                layers: firstTile.vectorTile?.layers ? Object.keys(firstTile.vectorTile.layers) : []
              })
            }
          }
        }

        // Check if there are any error events
        const errors: any[] = []
        map.current!.on('error', (e) => {
          console.error('🚨 Map error:', e)
          errors.push(e)
        })

        // Try to query a specific source-layer to see what's available
        setTimeout(() => {
          if (!map.current) return
          const style = map.current.getStyle()
          const osmSource = style.sources['osm-vector'] as any
          console.log('🔎 OSM Source configuration:', {
            type: osmSource?.type,
            tiles: osmSource?.tiles,
            minzoom: osmSource?.minzoom,
            maxzoom: osmSource?.maxzoom
          })
        }, 4000)
      }, 3000)
    })

    // Add click handler for creating proposals
    map.current.on('click', (e) => {
      if (mapModeRef.current === 'create') {
        // Detect features at click point
        const point = map.current!.project(e.lngLat)
        const features = detectFeaturesAtPoint(map.current!, point, 5) // Smaller radius for precision

        console.log('Features detectadas:', features)

        if (features.length > 0) {
          // Directly use the first (top-most) feature
          const feature = features[0]
          console.log('✅ Feature selected:', feature)

          // Get centroid of feature geometry
          const centroid = getCentroid(feature.geometry)

          setSelectedFeature(feature)
          setSelectedCoords(centroid)
          setDrawerMode('create')
          setDrawerOpen(true)
          setMapMode('navigate') // Return to navigation mode
        } else {
          // No features detected, proceed directly with exact point
          setSelectedFeature(null)
          setSelectedCoords({ lng: e.lngLat.lng, lat: e.lngLat.lat })
          setDrawerMode('create')
          setDrawerOpen(true)
          setMapMode('navigate') // Return to navigation mode
        }
      }
      // If mapMode === 'navigate', do nothing (just navigate)
    })

    return () => {
      map.current?.remove()
    }
  }, [])

  useEffect(() => {
    if (!map.current || pois.length === 0) return

    const markers: maplibregl.Marker[] = []

    pois.forEach((poi) => {
      const [lng, lat] = poi.geom.coordinates
      const el = document.createElement('div')
      el.style.width = '32px'
      el.style.height = '32px'
      el.style.borderRadius = '50%'
      el.style.cursor = 'pointer'
      el.style.display = 'flex'
      el.style.alignItems = 'center'
      el.style.justifyContent = 'center'
      el.style.fontSize = '18px'
      
      const poiStyles = {
        espacio_verde: { bg: '#22c55e', emoji: '🌳' },
        salud: { bg: '#ef4444', emoji: '🏥' },
        educacion: { bg: '#3b82f6', emoji: '🎓' },
        transporte: { bg: '#f59e0b', emoji: '🚉' },
        default: { bg: '#6366f1', emoji: '📍' },
      }

      const style = poiStyles[poi.type as keyof typeof poiStyles] || poiStyles.default
      el.style.backgroundColor = style.bg
      el.textContent = style.emoji

      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-weight: 600; font-size: 14px;">${poi.name}</h3>
          <p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${poi.type.replace('_', ' ')}</p>
          ${poi.address ? `<p style="margin: 0; font-size: 12px; color: #999;">${poi.address}</p>` : ''}
        </div>
      `)

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current!)

      markers.push(marker)
    })

    return () => {
      markers.forEach((marker) => marker.remove())
    }
  }, [pois])

  // Add proposal markers
  useEffect(() => {
    if (!map.current || proposals.length === 0) return

    // Clear existing proposal markers
    proposalMarkersRef.current.forEach((marker) => marker.remove())
    proposalMarkersRef.current = []

    proposals.forEach((proposal) => {
      if (!proposal.geom || proposal.geom.type !== 'Point') return

      const [lng, lat] = proposal.geom.coordinates

      // Create custom marker element
      const el = document.createElement('div')
      el.style.width = '36px'
      el.style.height = '36px'
      el.style.borderRadius = '50%'
      el.style.cursor = 'pointer'
      el.style.display = 'flex'
      el.style.alignItems = 'center'
      el.style.justifyContent = 'center'
      el.style.fontSize = '20px'
      el.style.backgroundColor = '#6366f1'
      el.style.border = '2px solid white'
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)'
      el.textContent = '💡'

      // Hover effect
      el.addEventListener('mouseenter', () => {
        el.style.transform = 'scale(1.1)'
        el.style.transition = 'transform 0.2s'
      })
      el.addEventListener('mouseleave', () => {
        el.style.transform = 'scale(1)'
      })

      const popup = new maplibregl.Popup({ offset: 25 }).setHTML(`
        <div style="padding: 8px; min-width: 200px;">
          <h3 style="margin: 0 0 8px 0; font-weight: 600; font-size: 14px;">${proposal.title}</h3>
          ${proposal.summary ? `<p style="margin: 0 0 4px 0; font-size: 12px; color: #666;">${proposal.summary.substring(0, 80)}${proposal.summary.length > 80 ? '...' : ''}</p>` : ''}
          <p style="margin: 4px 0 0 0; font-size: 11px; color: #999;">Click para ver detalles</p>
        </div>
      `)

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([lng, lat])
        .setPopup(popup)
        .addTo(map.current!)

      // Click handler for marker
      el.addEventListener('click', (e) => {
        e.stopPropagation() // Prevent map click event
        setSelectedProposalId(proposal.id)
        setDrawerMode('view')
        setDrawerOpen(true)
      })

      proposalMarkersRef.current.push(marker)
    })

    return () => {
      proposalMarkersRef.current.forEach((marker) => marker.remove())
      proposalMarkersRef.current = []
    }
  }, [proposals])

  // Handler for when a new proposal is created
  const handleProposalCreated = (newProposal: any) => {
    setProposals((prev) => [newProposal, ...prev])
  }

  // Handler for closing drawer
  const handleCloseDrawer = () => {
    setDrawerOpen(false)
    setSelectedFeature(null) // Clear selected feature
    setMapMode('navigate') // Ensure return to navigation mode
  }

  return (
    <div className="relative w-full h-full">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-90 z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-600">Cargando mapa...</p>
          </div>
        </div>
      )}
      
      <div
        ref={mapContainer}
        className={`w-full h-full ${mapMode === 'create' ? 'cursor-crosshair' : 'cursor-grab active:cursor-grabbing'}`}
      />

      {/* Feedback banner for creation mode */}
      {mapMode === 'create' && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-40 bg-indigo-100 border-2 border-indigo-500 rounded-lg px-6 py-3 shadow-lg flex items-center gap-4">
          <span className="text-indigo-900 font-medium">
            🏢 Hover over buildings/roads and click to select
          </span>
          <button
            onClick={() => setMapMode('navigate')}
            className="text-indigo-700 hover:text-indigo-900 font-medium transition"
          >
            Cancel ✕
          </button>
        </div>
      )}

      {/* Add Proposal button */}
      {mapMode === 'navigate' && (
        <button
          onClick={() => setMapMode('create')}
          className="fixed bottom-6 right-6 z-30 flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-full shadow-lg hover:bg-indigo-700 transition-all hover:scale-105"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          <span className="font-medium">Add Proposal</span>
        </button>
      )}

      <div className="absolute bottom-8 left-4 bg-white rounded-lg shadow-lg p-4 z-10">
        <h4 className="text-xs font-semibold text-gray-700 mb-2">Puntos de Interés</h4>
        <div className="space-y-2 text-xs">
          <div className="flex items-center gap-2"><span>🌳</span><span>Espacio Verde</span></div>
          <div className="flex items-center gap-2"><span>🏥</span><span>Salud</span></div>
          <div className="flex items-center gap-2"><span>🎓</span><span>Educación</span></div>
          <div className="flex items-center gap-2"><span>🚉</span><span>Transporte</span></div>
        </div>
      </div>

      {pois.length > 0 && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg px-3 py-2 z-10">
          <p className="text-xs text-gray-600">
            <span className="font-semibold text-gray-900">{pois.length}</span> POIs cargados
          </p>
        </div>
      )}

      {proposals.length > 0 && (
        <div className="absolute top-16 left-4 bg-indigo-100 border border-indigo-300 rounded-lg shadow-lg px-3 py-2 z-10">
          <p className="text-xs text-indigo-900">
            <span className="font-semibold">{proposals.length}</span> propuestas 💡
          </p>
        </div>
      )}

      <ProposalDrawer
        isOpen={drawerOpen}
        mode={drawerMode}
        onClose={handleCloseDrawer}
        coordinates={selectedCoords}
        proposalId={selectedProposalId}
        onProposalCreated={handleProposalCreated}
        selectedFeature={selectedFeature}
      />
    </div>
  )
}