'use client'

// ARENA V1.0 - MapLibre Map Component
import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import ProposalDrawer from './ProposalDrawer'
import { detectFeaturesAtPoint, getCentroid, DetectedFeature } from '@/src/lib/feature-detection'

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

interface MapViewProps {
  externalMapMode?: 'navigate' | 'create'
  externalSelectionMode?: 'building' | 'point' | 'polygon'
  onMapModeChange?: (mode: 'navigate' | 'create') => void
  onSelectionModeChange?: (mode: 'building' | 'point' | 'polygon') => void
}

export default function MapView({
  externalMapMode,
  externalSelectionMode,
  onMapModeChange,
  onSelectionModeChange
}: MapViewProps = {}) {
  const mapContainer = useRef<HTMLDivElement>(null)
  const map = useRef<maplibregl.Map | null>(null)
  const [proposals, setProposals] = useState<Proposal[]>([])
  const [loading, setLoading] = useState(true)

  // Map mode state (use external if provided)
  const [internalMapMode, setInternalMapMode] = useState<'navigate' | 'create'>('navigate')
  const mapMode = externalMapMode ?? internalMapMode
  const setMapMode = (mode: 'navigate' | 'create') => {
    setInternalMapMode(mode)
    onMapModeChange?.(mode)
  }

  // Selection mode (use external if provided)
  const [internalSelectionMode, setInternalSelectionMode] = useState<'building' | 'point' | 'polygon'>('building')
  const selectionMode = externalSelectionMode ?? internalSelectionMode
  const setSelectionMode = (mode: 'building' | 'point' | 'polygon') => {
    setInternalSelectionMode(mode)
    onSelectionModeChange?.(mode)
  }

  // Drawer state
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [drawerMode, setDrawerMode] = useState<'create' | 'view'>('create')
  const [selectedCoords, setSelectedCoords] = useState<{ lng: number; lat: number } | undefined>()
  const [selectedProposalId, setSelectedProposalId] = useState<string | undefined>()

  // Feature selection state (multi-selection)
  const [selectedFeatures, setSelectedFeatures] = useState<DetectedFeature[]>([])
  const [drawnPolygon, setDrawnPolygon] = useState<GeoJSON.Polygon | null>(null)

  // Polygon drawing state
  const [polygonPoints, setPolygonPoints] = useState<[number, number][]>([])

  // 3D view state (default to 3D)
  const [is3DView, setIs3DView] = useState(true)

  // Point mode radius state (in meters)
  const [pointRadius, setPointRadius] = useState(50)

  // Proposal hover state (for highlighting related features)
  const [hoveredProposal, setHoveredProposal] = useState<Proposal | null>(null)

  // Store markers references
  const proposalMarkersRef = useRef<maplibregl.Marker[]>([])
  const previewMarkerRef = useRef<maplibregl.Marker | null>(null)
  const confirmedMarkerRef = useRef<maplibregl.Marker | null>(null)
  const radiusCircleRef = useRef<maplibregl.Marker | null>(null)
  const previewRadiusCoords = useRef<{ lng: number; lat: number } | null>(null)

  // Set loading to false after initial setup
  useEffect(() => {
    setLoading(false)
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

  // Store mapMode, selectionMode, and is3DView in refs to avoid reinitialization
  const mapModeRef = useRef(mapMode)
  const selectionModeRef = useRef(selectionMode)
  const is3DViewRef = useRef(is3DView)

  useEffect(() => {
    mapModeRef.current = mapMode
  }, [mapMode])

  useEffect(() => {
    selectionModeRef.current = selectionMode
  }, [selectionMode])

  useEffect(() => {
    is3DViewRef.current = is3DView
  }, [is3DView])

  // Update selected features visualization
  useEffect(() => {
    if (!map.current) return

    console.log('🔍 Selected features:', selectedFeatures)

    // Get IDs of selected features by type
    // Support both CartoDB layer names ('building', 'building-top') and OSM ('osm-buildings-selectable')
    const buildingIds = selectedFeatures
      .filter(f => f.type === 'building' || f.layer?.includes('building'))
      .map(f => {
        const id = f.properties?.id || f.id
        console.log('Building feature ID:', id, 'layer:', f.layer, 'from', f)
        return id
      })
      .filter(id => id !== undefined && id !== null)

    const roadIds = selectedFeatures
      .filter(f => f.type === 'road' || f.layer?.includes('road') || f.layer?.includes('transportation'))
      .map(f => f.properties?.id || f.id)
      .filter(id => id !== undefined && id !== null)

    console.log('🏢 Building IDs for selection:', buildingIds)
    console.log('🛣️ Road IDs for selection:', roadIds)

    // Update building selection layer (2D)
    if (map.current.getLayer('building-selected')) {
      if (buildingIds.length > 0) {
        map.current.setFilter('building-selected', ['in', ['id'], ['literal', buildingIds]])
      } else {
        map.current.setFilter('building-selected', ['in', ['id'], ['literal', []]])
      }
    }

    // Update building selection border layer (2D)
    if (map.current.getLayer('building-selected-border')) {
      if (buildingIds.length > 0) {
        map.current.setFilter('building-selected-border', ['in', ['id'], ['literal', buildingIds]])
      } else {
        map.current.setFilter('building-selected-border', ['in', ['id'], ['literal', []]])
      }
    }

    // Update building selection layer (3D)
    if (map.current.getLayer('building-3d-selected')) {
      if (buildingIds.length > 0) {
        map.current.setFilter('building-3d-selected', ['in', ['id'], ['literal', buildingIds]])
      } else {
        map.current.setFilter('building-3d-selected', ['in', ['id'], ['literal', []]])
      }
    }

    // Update transportation selection layer
    if (map.current.getLayer('transportation-selected')) {
      if (roadIds.length > 0) {
        map.current.setFilter('transportation-selected', ['in', ['id'], ['literal', roadIds]])
      } else {
        map.current.setFilter('transportation-selected', ['in', ['id'], ['literal', []]])
      }
    }
  }, [selectedFeatures])

  // Visualize polygon drawing
  useEffect(() => {
    if (!map.current || polygonPoints.length === 0) {
      // Remove polygon layer if no points
      if (map.current?.getLayer('polygon-drawing')) {
        map.current.removeLayer('polygon-drawing')
      }
      if (map.current?.getLayer('polygon-points')) {
        map.current.removeLayer('polygon-points')
      }
      if (map.current?.getSource('polygon-drawing')) {
        map.current.removeSource('polygon-drawing')
      }
      return
    }

    // Create GeoJSON for polygon visualization
    const polygonGeoJSON: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features: []
    }

    // Add points
    polygonPoints.forEach((point, idx) => {
      polygonGeoJSON.features.push({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: point
        },
        properties: { index: idx }
      })
    })

    // Add lines if we have 2+ points
    if (polygonPoints.length >= 2) {
      polygonGeoJSON.features.push({
        type: 'Feature',
        geometry: {
          type: 'LineString',
          coordinates: polygonPoints
        },
        properties: {}
      })
    }

    // Add polygon fill if we have 3+ points
    if (polygonPoints.length >= 3) {
      const closedRing = [...polygonPoints, polygonPoints[0]]
      polygonGeoJSON.features.push({
        type: 'Feature',
        geometry: {
          type: 'Polygon',
          coordinates: [closedRing]
        },
        properties: {}
      })
    }

    // Add or update source
    if (map.current.getSource('polygon-drawing')) {
      (map.current.getSource('polygon-drawing') as maplibregl.GeoJSONSource).setData(polygonGeoJSON)
    } else {
      map.current.addSource('polygon-drawing', {
        type: 'geojson',
        data: polygonGeoJSON
      })

      // Add polygon fill layer
      map.current.addLayer({
        id: 'polygon-fill',
        type: 'fill',
        source: 'polygon-drawing',
        paint: {
          'fill-color': '#6366f1',
          'fill-opacity': 0.3
        },
        filter: ['==', ['geometry-type'], 'Polygon']
      })

      // Add line layer
      map.current.addLayer({
        id: 'polygon-lines',
        type: 'line',
        source: 'polygon-drawing',
        paint: {
          'line-color': '#4f46e5',
          'line-width': 3
        },
        filter: ['==', ['geometry-type'], 'LineString']
      })

      // Add points layer
      map.current.addLayer({
        id: 'polygon-points',
        type: 'circle',
        source: 'polygon-drawing',
        paint: {
          'circle-radius': 6,
          'circle-color': '#4f46e5',
          'circle-stroke-color': '#ffffff',
          'circle-stroke-width': 2
        },
        filter: ['==', ['geometry-type'], 'Point']
      })
    }
  }, [polygonPoints])

  // Highlight proposal-related features on hover
  useEffect(() => {
    if (!map.current) return

    if (hoveredProposal && hoveredProposal.osmId) {
      console.log('Highlighting proposal feature:', hoveredProposal.osmId, hoveredProposal.osmType)

      // Determine the source layer based on osmType
      let sourceLayer = 'building'
      if (hoveredProposal.osmType === 'road' || hoveredProposal.osmType === 'way') {
        sourceLayer = 'transportation'
      }

      // Add proposal hover layers if they don't exist
      if (!map.current.getLayer('proposal-hover-fill')) {
        map.current.addLayer({
          id: 'proposal-hover-fill',
          type: 'fill',
          source: 'carto',
          'source-layer': 'building',
          paint: {
            'fill-color': '#a5b4fc', // Light indigo
            'fill-opacity': 0.4,
          },
          filter: ['==', ['id'], -999999], // Start hidden
        })
      }

      if (!map.current.getLayer('proposal-hover-line')) {
        map.current.addLayer({
          id: 'proposal-hover-line',
          type: 'line',
          source: 'carto',
          'source-layer': 'transportation',
          paint: {
            'line-color': '#a5b4fc', // Light indigo
            'line-width': 4,
            'line-opacity': 0.6,
          },
          filter: ['==', ['id'], -999999], // Start hidden
        })
      }

      // Update filters to show the hovered feature
      if (sourceLayer === 'building') {
        map.current.setFilter('proposal-hover-fill', ['==', ['id'], Number(hoveredProposal.osmId)])
      } else {
        map.current.setFilter('proposal-hover-line', ['==', ['id'], Number(hoveredProposal.osmId)])
      }
    } else {
      // Clear proposal hover highlights
      if (map.current.getLayer('proposal-hover-fill')) {
        map.current.setFilter('proposal-hover-fill', ['==', ['id'], -999999])
      }
      if (map.current.getLayer('proposal-hover-line')) {
        map.current.setFilter('proposal-hover-line', ['==', ['id'], -999999])
      }
    }
  }, [hoveredProposal])

  // Update point preview radius in real-time when radius changes
  useEffect(() => {
    if (!map.current || selectionMode !== 'point' || mapMode !== 'create') return
    if (!previewRadiusCoords.current) return

    // Helper function to create a circle geometry
    const createCircle = (center: [number, number], radiusInMeters: number): GeoJSON.Feature => {
      const points = 64
      const coords = []
      const distanceX = radiusInMeters / (111320 * Math.cos(center[1] * Math.PI / 180))
      const distanceY = radiusInMeters / 110540

      for (let i = 0; i < points; i++) {
        const angle = (i / points) * 2 * Math.PI
        const dx = distanceX * Math.cos(angle)
        const dy = distanceY * Math.sin(angle)
        coords.push([center[0] + dx, center[1] + dy])
      }
      coords.push(coords[0]) // Close the circle

      return {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [coords]
        }
      }
    }

    const circleFeature = createCircle(
      [previewRadiusCoords.current.lng, previewRadiusCoords.current.lat],
      pointRadius
    )

    // Update or create preview radius source
    if (map.current.getSource('point-radius-preview')) {
      (map.current.getSource('point-radius-preview') as maplibregl.GeoJSONSource).setData({
        type: 'FeatureCollection',
        features: [circleFeature]
      })
    } else {
      map.current.addSource('point-radius-preview', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: [circleFeature]
        }
      })

      // Add circle fill layer
      map.current.addLayer({
        id: 'point-radius-preview-fill',
        type: 'fill',
        source: 'point-radius-preview',
        paint: {
          'fill-color': '#818cf8',
          'fill-opacity': 0.15
        }
      })

      // Add circle outline layer
      map.current.addLayer({
        id: 'point-radius-preview-line',
        type: 'line',
        source: 'point-radius-preview',
        paint: {
          'line-color': '#6366f1',
          'line-width': 2,
          'line-opacity': 0.6,
          'line-dasharray': [2, 2]
        }
      })
    }
  }, [pointRadius, selectionMode, mapMode])

  // Toggle 3D view
  useEffect(() => {
    if (!map.current) return

    if (is3DView) {
      // Enable 3D view - add pitch and change to 3D building layers
      map.current.easeTo({
        pitch: 60,
        bearing: 0,
        duration: 1000
      })

      // Hide 2D building layers
      if (map.current.getLayer('building')) {
        map.current.setLayoutProperty('building', 'visibility', 'none')
      }
      if (map.current.getLayer('building-border')) {
        map.current.setLayoutProperty('building-border', 'visibility', 'none')
      }
      if (map.current.getLayer('building-top')) {
        map.current.setLayoutProperty('building-top', 'visibility', 'none')
      }
      if (map.current.getLayer('building-hover')) {
        map.current.setLayoutProperty('building-hover', 'visibility', 'none')
      }
      if (map.current.getLayer('building-hover-border')) {
        map.current.setLayoutProperty('building-hover-border', 'visibility', 'none')
      }
      if (map.current.getLayer('building-selected')) {
        map.current.setLayoutProperty('building-selected', 'visibility', 'none')
      }
      if (map.current.getLayer('building-selected-border')) {
        map.current.setLayoutProperty('building-selected-border', 'visibility', 'none')
      }

      // Show 3D building layers (will be created in map load)
      if (map.current.getLayer('building-3d')) {
        map.current.setLayoutProperty('building-3d', 'visibility', 'visible')
      }
      if (map.current.getLayer('building-3d-hover')) {
        map.current.setLayoutProperty('building-3d-hover', 'visibility', 'visible')
      }
      if (map.current.getLayer('building-3d-selected')) {
        map.current.setLayoutProperty('building-3d-selected', 'visibility', 'visible')
      }
    } else {
      // Disable 3D view - reset pitch and show 2D layers
      map.current.easeTo({
        pitch: 0,
        bearing: 0,
        duration: 1000
      })

      // Show 2D building layers
      if (map.current.getLayer('building')) {
        map.current.setLayoutProperty('building', 'visibility', 'visible')
      }
      if (map.current.getLayer('building-border')) {
        map.current.setLayoutProperty('building-border', 'visibility', 'visible')
      }
      if (map.current.getLayer('building-top')) {
        map.current.setLayoutProperty('building-top', 'visibility', 'visible')
      }
      if (map.current.getLayer('building-hover')) {
        map.current.setLayoutProperty('building-hover', 'visibility', 'visible')
      }
      if (map.current.getLayer('building-hover-border')) {
        map.current.setLayoutProperty('building-hover-border', 'visibility', 'visible')
      }
      if (map.current.getLayer('building-selected')) {
        map.current.setLayoutProperty('building-selected', 'visibility', 'visible')
      }
      if (map.current.getLayer('building-selected-border')) {
        map.current.setLayoutProperty('building-selected-border', 'visibility', 'visible')
      }

      // Hide 3D building layers
      if (map.current.getLayer('building-3d')) {
        map.current.setLayoutProperty('building-3d', 'visibility', 'none')
      }
      if (map.current.getLayer('building-3d-hover')) {
        map.current.setLayoutProperty('building-3d-hover', 'visibility', 'none')
      }
      if (map.current.getLayer('building-3d-selected')) {
        map.current.setLayoutProperty('building-3d-selected', 'visibility', 'none')
      }
    }
  }, [is3DView])

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [-58.4173, -34.6037], // Center of Buenos Aires
      zoom: 11, // Zoom out to show whole city
      attributionControl: false,
    })

    map.current.addControl(new maplibregl.NavigationControl(), 'bottom-left')
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
      // Light indigo BORDER by default → Expanded darker border on hover → Dark indigo fill when selected

      // Add light indigo border to buildings (not fill)
      map.current.setPaintProperty('building', 'fill-color', 'transparent')
      map.current.setPaintProperty('building', 'fill-opacity', 0)

      // Add building border layer (light indigo)
      map.current.addLayer({
        id: 'building-border',
        type: 'line',
        source: 'carto',
        'source-layer': 'building',
        paint: {
          'line-color': '#a5b4fc', // Light indigo
          'line-width': 1,
          'line-opacity': 0.6,
        },
      })

      // Building SELECTION layer (dark indigo fill for selected buildings)
      map.current.addLayer({
        id: 'building-selected',
        type: 'fill',
        source: 'carto',
        'source-layer': 'building',
        paint: {
          'fill-color': '#4338ca', // Dark indigo
          'fill-opacity': 0.7,
        },
        filter: ['in', ['id'], ['literal', []]], // Start with empty array
      })

      // Building selected BORDER (dark indigo stroke)
      map.current.addLayer({
        id: 'building-selected-border',
        type: 'line',
        source: 'carto',
        'source-layer': 'building',
        paint: {
          'line-color': '#4338ca', // Dark indigo
          'line-width': 2,
          'line-opacity': 0.9,
        },
        filter: ['in', ['id'], ['literal', []]], // Start with empty array
      })

      // Building hover (expanded darker border + subtle fill)
      map.current.addLayer({
        id: 'building-hover',
        type: 'fill',
        source: 'carto',
        'source-layer': 'building',
        paint: {
          'fill-color': '#6366f1', // Medium indigo
          'fill-opacity': 0.3,
        },
        filter: ['==', ['id'], -999999], // Start hidden
      })

      // Building hover BORDER (expanded + darker)
      map.current.addLayer({
        id: 'building-hover-border',
        type: 'line',
        source: 'carto',
        'source-layer': 'building',
        paint: {
          'line-color': '#4f46e5', // Darker indigo
          'line-width': 2.5, // Expanded stroke
          'line-opacity': 0.8,
        },
        filter: ['==', ['id'], -999999], // Start hidden
      })

      // Add light indigo borders to roads/transportation
      map.current.addLayer({
        id: 'transportation-border',
        type: 'line',
        source: 'carto',
        'source-layer': 'transportation',
        paint: {
          'line-color': '#a5b4fc', // Light indigo
          'line-width': 1.5,
          'line-opacity': 0.5,
        },
      })

      // Transportation SELECTION layer (dark indigo)
      map.current.addLayer({
        id: 'transportation-selected',
        type: 'line',
        source: 'carto',
        'source-layer': 'transportation',
        paint: {
          'line-color': '#4338ca', // Dark indigo
          'line-width': 4,
          'line-opacity': 0.8,
        },
        filter: ['in', ['id'], ['literal', []]], // Start with empty array
      })

      // Transportation hover (expanded + darker)
      map.current.addLayer({
        id: 'transportation-hover',
        type: 'line',
        source: 'carto',
        'source-layer': 'transportation',
        paint: {
          'line-color': '#4f46e5', // Darker indigo
          'line-width': 5, // Expanded stroke
          'line-opacity': 0.7,
        },
        filter: ['==', ['id'], -999999], // Start hidden
      })

      // 3D BUILDING LAYERS (fill-extrusion type)
      // Base 3D buildings (light indigo outline)
      map.current.addLayer({
        id: 'building-3d',
        type: 'fill-extrusion',
        source: 'carto',
        'source-layer': 'building',
        paint: {
          'fill-extrusion-color': '#f0f0f0', // Light gray
          'fill-extrusion-opacity': 0.7,
          'fill-extrusion-height': [
            'case',
            ['has', 'render_height'], ['get', 'render_height'],
            ['has', 'height'], ['get', 'height'],
            10 // Default height for buildings without height data
          ],
          'fill-extrusion-base': 0,
          'fill-extrusion-vertical-gradient': true,
        },
        layout: {
          'visibility': 'none' // Start hidden (2D view by default)
        }
      })

      // 3D buildings SELECTED layer (dark indigo)
      map.current.addLayer({
        id: 'building-3d-selected',
        type: 'fill-extrusion',
        source: 'carto',
        'source-layer': 'building',
        paint: {
          'fill-extrusion-color': '#4338ca', // Dark indigo
          'fill-extrusion-opacity': 0.85,
          'fill-extrusion-height': [
            'case',
            ['has', 'render_height'], ['get', 'render_height'],
            ['has', 'height'], ['get', 'height'],
            10
          ],
          'fill-extrusion-base': 0,
          'fill-extrusion-vertical-gradient': true,
        },
        filter: ['in', ['id'], ['literal', []]],
        layout: {
          'visibility': 'none'
        }
      })

      // 3D buildings HOVER layer (medium indigo)
      map.current.addLayer({
        id: 'building-3d-hover',
        type: 'fill-extrusion',
        source: 'carto',
        'source-layer': 'building',
        paint: {
          'fill-extrusion-color': '#6366f1', // Medium indigo
          'fill-extrusion-opacity': 0.75,
          'fill-extrusion-height': [
            'case',
            ['has', 'render_height'], ['get', 'render_height'],
            ['has', 'height'], ['get', 'height'],
            10
          ],
          'fill-extrusion-base': 0,
          'fill-extrusion-vertical-gradient': true,
        },
        filter: ['==', ['id'], -999999],
        layout: {
          'visibility': 'none'
        }
      })

      // Track currently hovered feature
      let hoveredFeature: { layer: string; id: any } | null = null

      // Map of source-layers to hover layer IDs (only small vectors)
      const hoverLayerMap: Record<string, string[]> = {
        'building': ['building-hover', 'building-hover-border'],
        'transportation': ['transportation-hover'],
      }

      const hoverLayerMap3D: Record<string, string> = {
        'building': 'building-3d-hover',
      }

      // Helper function to update hover highlight (only in create mode)
      const updateHover = (newFeature: { layer: string; id: any } | null) => {
        // Only show hover in create mode
        if (mapModeRef.current !== 'create') {
          // Clear all hovers in navigate mode
          if (hoveredFeature) {
            const hoverLayerIds = hoverLayerMap[hoveredFeature.layer]
            if (hoverLayerIds) {
              hoverLayerIds.forEach(hoverLayerId => {
                if (map.current!.getLayer(hoverLayerId)) {
                  map.current!.setFilter(hoverLayerId, ['==', ['id'], -999999])
                }
              })
            }

            const hoverLayerId3D = hoverLayerMap3D[hoveredFeature.layer]
            if (hoverLayerId3D && map.current!.getLayer(hoverLayerId3D)) {
              map.current!.setFilter(hoverLayerId3D, ['==', ['id'], -999999])
            }
            hoveredFeature = null
          }
          return
        }

        // Clear previous hover
        if (hoveredFeature) {
          const hoverLayerIds = hoverLayerMap[hoveredFeature.layer]
          if (hoverLayerIds) {
            hoverLayerIds.forEach(hoverLayerId => {
              if (map.current!.getLayer(hoverLayerId)) {
                // Set to empty - no features shown
                map.current!.setFilter(hoverLayerId, ['==', ['id'], -999999])
              }
            })
          }

          // Also clear 3D hover if it exists
          const hoverLayerId3D = hoverLayerMap3D[hoveredFeature.layer]
          if (hoverLayerId3D && map.current!.getLayer(hoverLayerId3D)) {
            map.current!.setFilter(hoverLayerId3D, ['==', ['id'], -999999])
          }
        }

        hoveredFeature = newFeature

        // Set new hover
        if (newFeature && newFeature.id !== undefined) {
          const hoverLayerIds = hoverLayerMap[newFeature.layer]
          if (hoverLayerIds) {
            hoverLayerIds.forEach(hoverLayerId => {
              if (map.current!.getLayer(hoverLayerId)) {
                // Match by feature ID (not property)
                console.log('Setting hover for', newFeature.layer, 'ID:', newFeature.id)
                map.current!.setFilter(hoverLayerId, ['==', ['id'], newFeature.id])
              }
            })
          }

          // Also set 3D hover if it exists
          const hoverLayerId3D = hoverLayerMap3D[newFeature.layer]
          if (hoverLayerId3D && map.current!.getLayer(hoverLayerId3D)) {
            map.current!.setFilter(hoverLayerId3D, ['==', ['id'], newFeature.id])
          }
        }
      }

      // Add hover events ONLY for small vectors (buildings and roads)
      // NO large areas like blocks, landuse, boundaries

      const selectableLayerGroups = {
        'building': ['building', 'building-top', 'building-3d'], // Include 3D building layer
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

    // Point mode: preview circle on mousemove
    map.current.on('mousemove', (e) => {
      if (mapModeRef.current === 'create' && selectionModeRef.current === 'point') {
        // Update preview radius coordinates
        previewRadiusCoords.current = { lng: e.lngLat.lng, lat: e.lngLat.lat }

        // Helper function to create a circle geometry
        const createCircle = (center: [number, number], radiusInMeters: number): GeoJSON.Feature => {
          const points = 64
          const coords = []
          const distanceX = radiusInMeters / (111320 * Math.cos(center[1] * Math.PI / 180))
          const distanceY = radiusInMeters / 110540

          for (let i = 0; i < points; i++) {
            const angle = (i / points) * 2 * Math.PI
            const dx = distanceX * Math.cos(angle)
            const dy = distanceY * Math.sin(angle)
            coords.push([center[0] + dx, center[1] + dy])
          }
          coords.push(coords[0]) // Close the circle

          return {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [coords]
            }
          }
        }

        const circleFeature = createCircle([e.lngLat.lng, e.lngLat.lat], pointRadius)

        // Update or create preview radius source
        if (map.current!.getSource('point-radius-preview')) {
          (map.current!.getSource('point-radius-preview') as maplibregl.GeoJSONSource).setData({
            type: 'FeatureCollection',
            features: [circleFeature]
          })
        } else {
          map.current!.addSource('point-radius-preview', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [circleFeature]
            }
          })

          // Add circle fill layer
          map.current!.addLayer({
            id: 'point-radius-preview-fill',
            type: 'fill',
            source: 'point-radius-preview',
            paint: {
              'fill-color': '#818cf8',
              'fill-opacity': 0.15
            }
          })

          // Add circle outline layer
          map.current!.addLayer({
            id: 'point-radius-preview-line',
            type: 'line',
            source: 'point-radius-preview',
            paint: {
              'line-color': '#6366f1',
              'line-width': 2,
              'line-opacity': 0.6,
              'line-dasharray': [2, 2]
            }
          })
        }

        // Create or update preview marker
        if (!previewMarkerRef.current) {
          const el = document.createElement('div')
          el.style.width = '12px'
          el.style.height = '12px'
          el.style.borderRadius = '50%'
          el.style.backgroundColor = '#6366f1'
          el.style.border = '2px solid white'
          el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'
          el.style.opacity = '0.8'

          previewMarkerRef.current = new maplibregl.Marker({ element: el })
            .setLngLat(e.lngLat)
            .addTo(map.current!)
        } else {
          previewMarkerRef.current.setLngLat(e.lngLat)
        }
      } else {
        // Remove preview marker and radius if not in point mode
        if (previewMarkerRef.current) {
          previewMarkerRef.current.remove()
          previewMarkerRef.current = null
        }
        previewRadiusCoords.current = null

        // Remove preview radius layers
        if (map.current!.getLayer('point-radius-preview-fill')) {
          map.current!.removeLayer('point-radius-preview-fill')
        }
        if (map.current!.getLayer('point-radius-preview-line')) {
          map.current!.removeLayer('point-radius-preview-line')
        }
        if (map.current!.getSource('point-radius-preview')) {
          map.current!.removeSource('point-radius-preview')
        }
      }
    })

    // Add click handler for creating proposals with 3 selection modes
    map.current.on('click', (e) => {
      if (mapModeRef.current !== 'create') return

      const point = map.current!.project(e.lngLat)

      // MODE 1: Building/Road selection
      if (selectionModeRef.current === 'building') {
        console.log('🖱️ Building mode click at:', e.lngLat)

        // Query buildings directly from the CartoDB source (both 2D and 3D layers)
        const buildingLayers = is3DViewRef.current ? ['building-3d'] : ['building', 'building-top']

        const features = map.current!.queryRenderedFeatures(
          [
            [point.x - 5, point.y - 5],
            [point.x + 5, point.y + 5],
          ],
          { layers: buildingLayers }
        )

        console.log(`📍 Found ${features.length} building features at click point`)

        if (features.length > 0) {
          const mapFeature = features[0]
          console.log('✅ Raw MapLibre feature:', {
            id: mapFeature.id,
            layer: mapFeature.layer.id,
            sourceLayer: mapFeature.sourceLayer,
            source: mapFeature.source,
            properties: mapFeature.properties
          })

          // Convert to our DetectedFeature format
          const detectedFeature: DetectedFeature = {
            id: mapFeature.id?.toString() || `${mapFeature.layer.id}-${Date.now()}`,
            type: 'building',
            geometry: mapFeature.geometry as GeoJSON.Geometry,
            properties: mapFeature.properties || {},
            layer: mapFeature.layer.id,
            name: mapFeature.properties?.name,
          }

          console.log('✅ Detected feature:', detectedFeature)

          // Single selection (replace previous selection)
          setSelectedFeatures([detectedFeature])
        } else {
          console.log('❌ No buildings found at click point')
          // Click on empty space - deselect
          setSelectedFeatures([])
        }
      }

      // MODE 2: Point (single coordinate) with radius
      else if (selectionModeRef.current === 'point') {
        // Remove preview marker
        if (previewMarkerRef.current) {
          previewMarkerRef.current.remove()
          previewMarkerRef.current = null
        }

        // Create confirmed marker (darker)
        if (confirmedMarkerRef.current) {
          confirmedMarkerRef.current.remove()
        }

        const el = document.createElement('div')
        el.style.width = '28px'
        el.style.height = '28px'
        el.style.borderRadius = '50%'
        el.style.backgroundColor = '#4f46e5' // Strong indigo
        el.style.border = '3px solid white'
        el.style.boxShadow = '0 3px 12px rgba(79, 70, 229, 0.5)'

        confirmedMarkerRef.current = new maplibregl.Marker({ element: el })
          .setLngLat(e.lngLat)
          .addTo(map.current!)

        // Create radius circle visualization
        const createCircle = (center: [number, number], radiusInMeters: number): GeoJSON.Feature => {
          const points = 64
          const coords = []
          const distanceX = radiusInMeters / (111320 * Math.cos(center[1] * Math.PI / 180))
          const distanceY = radiusInMeters / 110540

          for (let i = 0; i < points; i++) {
            const angle = (i / points) * 2 * Math.PI
            const dx = distanceX * Math.cos(angle)
            const dy = distanceY * Math.sin(angle)
            coords.push([center[0] + dx, center[1] + dy])
          }
          coords.push(coords[0]) // Close the circle

          return {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'Polygon',
              coordinates: [coords]
            }
          }
        }

        const circleFeature = createCircle([e.lngLat.lng, e.lngLat.lat], pointRadius)

        // Add or update radius circle source
        if (map.current!.getSource('point-radius')) {
          (map.current!.getSource('point-radius') as maplibregl.GeoJSONSource).setData({
            type: 'FeatureCollection',
            features: [circleFeature]
          })
        } else {
          map.current!.addSource('point-radius', {
            type: 'geojson',
            data: {
              type: 'FeatureCollection',
              features: [circleFeature]
            }
          })

          // Add circle fill layer
          map.current!.addLayer({
            id: 'point-radius-fill',
            type: 'fill',
            source: 'point-radius',
            paint: {
              'fill-color': '#818cf8',
              'fill-opacity': 0.2
            }
          })

          // Add circle outline layer
          map.current!.addLayer({
            id: 'point-radius-line',
            type: 'line',
            source: 'point-radius',
            paint: {
              'line-color': '#4f46e5',
              'line-width': 2,
              'line-opacity': 0.8
            }
          })
        }

        setSelectedCoords({ lng: e.lngLat.lng, lat: e.lngLat.lat })
        setDrawerMode('create')
        setDrawerOpen(true)
        setMapMode('navigate')
      }

      // MODE 3: Polygon drawing (manual point-by-point)
      else if (selectionModeRef.current === 'polygon') {
        const newPoint: [number, number] = [e.lngLat.lng, e.lngLat.lat]
        console.log('📍 Adding polygon point:', newPoint)

        setPolygonPoints(prev => [...prev, newPoint])
      }
    })

    return () => {
      map.current?.remove()
    }
  }, [])


  // Add proposal markers
  useEffect(() => {
    if (!map.current || proposals.length === 0) return

    // Clear existing proposal markers
    proposalMarkersRef.current.forEach((marker) => marker.remove())
    proposalMarkersRef.current = []

    proposals.forEach((proposal) => {
      if (!proposal.geom || proposal.geom.type !== 'Point') return

      const [lng, lat] = proposal.geom.coordinates

      // Create custom marker element (simple circle without emoji)
      const el = document.createElement('div')
      el.style.width = '16px'
      el.style.height = '16px'
      el.style.borderRadius = '50%'
      el.style.cursor = 'pointer'
      el.style.backgroundColor = '#6366f1'
      el.style.border = '2px solid white'
      el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)'
      el.style.transition = 'transform 0.2s, box-shadow 0.2s'

      // Hover effect (no scale transform to prevent movement)
      el.addEventListener('mouseenter', () => {
        el.style.boxShadow = '0 4px 8px rgba(99, 102, 241, 0.4)'
        // Set hovered proposal to highlight related features
        setHoveredProposal(proposal)
      })
      el.addEventListener('mouseleave', () => {
        el.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)'
        // Clear hovered proposal
        setHoveredProposal(null)
      })

      // Format date
      const createdDate = new Date(proposal.createdAt || Date.now())
      const formattedDate = createdDate.toLocaleDateString('es-AR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })

      const popup = new maplibregl.Popup({
        offset: 15,
        closeButton: false,
        className: 'proposal-tooltip'
      }).setHTML(`
        <div style="padding: 12px; min-width: 240px; max-width: 300px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;">
          <h3 style="margin: 0 0 8px 0; font-weight: 600; font-size: 15px; color: #1f2937;">${proposal.title}</h3>
          <div style="margin: 0 0 8px 0; font-size: 12px; color: #6b7280; line-height: 1.5;">
            ${proposal.summary ? proposal.summary.substring(0, 120) + (proposal.summary.length > 120 ? '...' : '') : 'Sin descripción'}
          </div>
          <div style="display: flex; justify-content: space-between; align-items: center; padding-top: 8px; border-top: 1px solid #e5e7eb;">
            <span style="font-size: 11px; color: #9ca3af;">Por ${proposal.author?.name || 'Usuario'}</span>
            <span style="font-size: 11px; color: #9ca3af;">${formattedDate}</span>
          </div>
        </div>
      `)

      // Create marker with proper anchor (center, center) to prevent movement
      const marker = new maplibregl.Marker({
        element: el,
        anchor: 'center' // This prevents the marker from moving
      })
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
    setSelectedFeatures([]) // Clear selected features
    setDrawnPolygon(null) // Clear drawn polygon
    setPolygonPoints([]) // Clear polygon points

    // Remove confirmed point marker
    if (confirmedMarkerRef.current) {
      confirmedMarkerRef.current.remove()
      confirmedMarkerRef.current = null
    }

    // Remove confirmed point radius circle
    if (map.current && map.current.getSource('point-radius')) {
      if (map.current.getLayer('point-radius-fill')) {
        map.current.removeLayer('point-radius-fill')
      }
      if (map.current.getLayer('point-radius-line')) {
        map.current.removeLayer('point-radius-line')
      }
      map.current.removeSource('point-radius')
    }

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
        className={`w-full h-full ${
          mapMode === 'create'
            ? selectionMode === 'polygon' ? 'cursor-crosshair' : 'cursor-pointer'
            : 'cursor-grab active:cursor-grabbing'
        }`}
      />

      {/* 2D/3D Toggle - Material Design */}
      <div className="absolute top-4 right-4 z-30">
        <button
          onClick={() => setIs3DView(!is3DView)}
          className={`px-4 py-2 rounded-xl shadow-md text-sm font-medium transition-all ${
            is3DView
              ? 'bg-indigo-600 text-white shadow-indigo-200'
              : 'bg-white/95 backdrop-blur-sm text-gray-700 border border-gray-200 hover:bg-gray-50'
          }`}
          title={is3DView ? 'Switch to 2D view' : 'Switch to 3D view'}
        >
          {is3DView ? '🏗️ 3D' : '🗺️ 2D'}
        </button>
      </div>

      {/* Point mode radius control - Material Design */}
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
              style={{
                background: `linear-gradient(to right, #4f46e5 0%, #4f46e5 ${((pointRadius - 1) / 99) * 100}%, #e0e7ff ${((pointRadius - 1) / 99) * 100}%, #e0e7ff 100%)`
              }}
            />
            <div className="flex justify-between text-xs text-indigo-600 mt-2 font-medium">
              <span>1m</span>
              <span>100m</span>
            </div>
          </div>
        </div>
      )}

      {/* Selection info - bottom center - Material Design */}
      {mapMode === 'create' && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-sm border border-gray-200 rounded-xl shadow-lg px-5 py-3.5">
          {selectionMode === 'building' && (
            <div className="flex items-center gap-3">
              {selectedFeatures.length > 0 ? (
                <>
                  <span className="text-sm text-indigo-900 font-medium">
                    {selectedFeatures.length} building{selectedFeatures.length > 1 ? 's' : ''} selected
                  </span>
                  <button
                    onClick={() => {
                      // Calculate centroid from all selected features
                      const allCoords = selectedFeatures.flatMap(f => {
                        const centroid = getCentroid(f.geometry)
                        return [[centroid.lng, centroid.lat]]
                      })
                      const avgLng = allCoords.reduce((sum, c) => sum + c[0], 0) / allCoords.length
                      const avgLat = allCoords.reduce((sum, c) => sum + c[1], 0) / allCoords.length

                      setSelectedCoords({ lng: avgLng, lat: avgLat })
                      setDrawerMode('create')
                      setDrawerOpen(true)
                    }}
                    className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200 font-medium text-sm"
                  >
                    Create Proposal
                  </button>
                </>
              ) : (
                <span className="text-sm text-gray-600">Click a building to select</span>
              )}
            </div>
          )}
          {selectionMode === 'point' && (
            <span className="text-sm text-gray-600">Click anywhere to place a point</span>
          )}
          {selectionMode === 'polygon' && polygonPoints.length === 0 && (
            <span className="text-sm text-gray-600">Click to draw an area</span>
          )}
          {selectionMode === 'polygon' && polygonPoints.length > 0 && polygonPoints.length < 3 && (
            <span className="text-sm text-purple-900 font-medium">
              {polygonPoints.length} point{polygonPoints.length > 1 ? 's' : ''} • Need 3+ for polygon
            </span>
          )}
          {selectionMode === 'polygon' && polygonPoints.length >= 3 && (
            <div className="flex items-center gap-3">
              <span className="text-sm text-purple-900 font-medium">
                {polygonPoints.length} points • Polygon ready
              </span>
              <button
                onClick={() => {
                  // Create polygon from points
                  const closedRing = [...polygonPoints, polygonPoints[0]]
                  const polygon: GeoJSON.Polygon = {
                    type: 'Polygon',
                    coordinates: [closedRing]
                  }

                  // Calculate centroid
                  let sumLng = 0
                  let sumLat = 0
                  polygonPoints.forEach(point => {
                    sumLng += point[0]
                    sumLat += point[1]
                  })
                  const centroidLng = sumLng / polygonPoints.length
                  const centroidLat = sumLat / polygonPoints.length

                  setDrawnPolygon(polygon)
                  setSelectedCoords({ lng: centroidLng, lat: centroidLat })
                  setDrawerMode('create')
                  setDrawerOpen(true)
                }}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium text-sm"
              >
                Create Proposal
              </button>
            </div>
          )}
        </div>
      )}

      <ProposalDrawer
        isOpen={drawerOpen}
        mode={drawerMode}
        onClose={handleCloseDrawer}
        coordinates={selectedCoords}
        proposalId={selectedProposalId}
        onProposalCreated={handleProposalCreated}
        selectedFeatures={selectedFeatures}
        drawnPolygon={drawnPolygon}
        pointRadius={selectionMode === 'point' ? pointRadius : undefined}
      />
    </div>
  )
}