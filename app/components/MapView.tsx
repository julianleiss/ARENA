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

  // Selection mode: building (multi-select vectors), point (single coordinate), polygon (drawn area)
  const [selectionMode, setSelectionMode] = useState<'building' | 'point' | 'polygon'>('building')

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

  // 3D view state
  const [is3DView, setIs3DView] = useState(false)

  // Store markers references
  const proposalMarkersRef = useRef<maplibregl.Marker[]>([])
  const previewMarkerRef = useRef<maplibregl.Marker | null>(null)
  const confirmedMarkerRef = useRef<maplibregl.Marker | null>(null)

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

  // Store mapMode and selectionMode in refs to avoid reinitialization
  const mapModeRef = useRef(mapMode)
  const selectionModeRef = useRef(selectionMode)

  useEffect(() => {
    mapModeRef.current = mapMode
  }, [mapMode])

  useEffect(() => {
    selectionModeRef.current = selectionMode
  }, [selectionMode])

  // Update selected features visualization
  useEffect(() => {
    if (!map.current) return

    console.log('🔍 Selected features:', selectedFeatures)

    // Get IDs of selected features by type
    const buildingIds = selectedFeatures
      .filter(f => f.layer === 'building')
      .map(f => {
        const id = f.properties?.id || f.id
        console.log('Building feature ID:', id, 'from', f)
        return id
      })
      .filter(id => id !== undefined)

    const roadIds = selectedFeatures
      .filter(f => f.layer === 'transportation')
      .map(f => f.properties?.id || f.id)
      .filter(id => id !== undefined)

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
      if (map.current.getLayer('building-top')) {
        map.current.setLayoutProperty('building-top', 'visibility', 'none')
      }
      if (map.current.getLayer('building-hover')) {
        map.current.setLayoutProperty('building-hover', 'visibility', 'none')
      }
      if (map.current.getLayer('building-selected')) {
        map.current.setLayoutProperty('building-selected', 'visibility', 'none')
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
      if (map.current.getLayer('building-top')) {
        map.current.setLayoutProperty('building-top', 'visibility', 'visible')
      }
      if (map.current.getLayer('building-hover')) {
        map.current.setLayoutProperty('building-hover', 'visibility', 'visible')
      }
      if (map.current.getLayer('building-selected')) {
        map.current.setLayoutProperty('building-selected', 'visibility', 'visible')
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

      // Building SELECTION layer (persistent indigo for selected buildings)
      map.current.addLayer({
        id: 'building-selected',
        type: 'fill',
        source: 'carto',
        'source-layer': 'building',
        paint: {
          'fill-color': '#6366f1', // Medium indigo
          'fill-opacity': 0.6,
        },
        filter: ['in', ['id'], ['literal', []]], // Start with empty array
      })

      // Building hover (strong indigo on top)
      map.current.addLayer({
        id: 'building-hover',
        type: 'fill',
        source: 'carto',
        'source-layer': 'building',
        paint: {
          'fill-color': '#4f46e5', // Strong indigo
          'fill-opacity': 0.8,
        },
        filter: ['==', ['id'], -999999], // Start hidden
      })

      // Transportation SELECTION layer
      map.current.addLayer({
        id: 'transportation-selected',
        type: 'line',
        source: 'carto',
        'source-layer': 'transportation',
        paint: {
          'line-color': '#6366f1', // Medium indigo
          'line-width': 4,
          'line-opacity': 0.7,
        },
        filter: ['in', ['id'], ['literal', []]], // Start with empty array
      })

      // Transportation hover (strong indigo on top)
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
        filter: ['==', ['id'], -999999], // Start hidden
      })

      // 3D BUILDING LAYERS (fill-extrusion type)
      // Base 3D buildings (soft indigo)
      map.current.addLayer({
        id: 'building-3d',
        type: 'fill-extrusion',
        source: 'carto',
        'source-layer': 'building',
        paint: {
          'fill-extrusion-color': '#818cf8', // Soft indigo
          'fill-extrusion-opacity': 0.6,
          'fill-extrusion-height': [
            'case',
            ['has', 'render_height'], ['get', 'render_height'],
            ['has', 'height'], ['get', 'height'],
            10 // Default height for buildings without height data
          ],
          'fill-extrusion-base': 0,
        },
        layout: {
          'visibility': 'none' // Start hidden (2D view by default)
        }
      })

      // 3D buildings SELECTED layer
      map.current.addLayer({
        id: 'building-3d-selected',
        type: 'fill-extrusion',
        source: 'carto',
        'source-layer': 'building',
        paint: {
          'fill-extrusion-color': '#6366f1', // Medium indigo
          'fill-extrusion-opacity': 0.8,
          'fill-extrusion-height': [
            'case',
            ['has', 'render_height'], ['get', 'render_height'],
            ['has', 'height'], ['get', 'height'],
            10
          ],
          'fill-extrusion-base': 0,
        },
        filter: ['in', ['id'], ['literal', []]],
        layout: {
          'visibility': 'none'
        }
      })

      // 3D buildings HOVER layer
      map.current.addLayer({
        id: 'building-3d-hover',
        type: 'fill-extrusion',
        source: 'carto',
        'source-layer': 'building',
        paint: {
          'fill-extrusion-color': '#4f46e5', // Strong indigo
          'fill-extrusion-opacity': 0.9,
          'fill-extrusion-height': [
            'case',
            ['has', 'render_height'], ['get', 'render_height'],
            ['has', 'height'], ['get', 'height'],
            10
          ],
          'fill-extrusion-base': 0,
        },
        filter: ['==', ['id'], -999999],
        layout: {
          'visibility': 'none'
        }
      })

      // Track currently hovered feature
      let hoveredFeature: { layer: string; id: any } | null = null

      // Map of source-layers to hover layer IDs (only small vectors)
      const hoverLayerMap: Record<string, string> = {
        'building': 'building-hover',
        'transportation': 'transportation-hover',
      }

      const hoverLayerMap3D: Record<string, string> = {
        'building': 'building-3d-hover',
      }

      // Helper function to update hover highlight
      const updateHover = (newFeature: { layer: string; id: any } | null) => {
        // Clear previous hover
        if (hoveredFeature) {
          const hoverLayerId = hoverLayerMap[hoveredFeature.layer]
          if (hoverLayerId && map.current!.getLayer(hoverLayerId)) {
            // Set to empty - no features shown
            map.current!.setFilter(hoverLayerId, ['==', ['id'], -999999])
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
          const hoverLayerId = hoverLayerMap[newFeature.layer]
          if (hoverLayerId && map.current!.getLayer(hoverLayerId)) {
            // Match by feature ID (not property)
            console.log('Setting hover for', newFeature.layer, 'ID:', newFeature.id)
            map.current!.setFilter(hoverLayerId, ['==', ['id'], newFeature.id])
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

    // Point mode: preview circle on mousemove
    map.current.on('mousemove', (e) => {
      if (mapModeRef.current === 'create' && selectionModeRef.current === 'point') {
        // Create or update preview marker
        if (!previewMarkerRef.current) {
          const el = document.createElement('div')
          el.style.width = '24px'
          el.style.height = '24px'
          el.style.borderRadius = '50%'
          el.style.backgroundColor = '#818cf8' // Soft indigo
          el.style.border = '3px solid white'
          el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)'
          el.style.opacity = '0.7'
          el.style.transition = 'all 0.2s'

          previewMarkerRef.current = new maplibregl.Marker({ element: el })
            .setLngLat(e.lngLat)
            .addTo(map.current!)
        } else {
          previewMarkerRef.current.setLngLat(e.lngLat)
        }
      } else {
        // Remove preview marker if not in point mode
        if (previewMarkerRef.current) {
          previewMarkerRef.current.remove()
          previewMarkerRef.current = null
        }
      }
    })

    // Add click handler for creating proposals with 3 selection modes
    map.current.on('click', (e) => {
      if (mapModeRef.current !== 'create') return

      const point = map.current!.project(e.lngLat)

      // MODE 1: Building/Road (multi-select)
      if (selectionModeRef.current === 'building') {
        const features = detectFeaturesAtPoint(map.current!, point, 5)

        if (features.length > 0) {
          const feature = features[0]
          console.log('✅ Feature selected:', feature)

          // Add to selection (toggle if already selected)
          setSelectedFeatures(prev => {
            const exists = prev.find(f => f.id === feature.id)
            if (exists) {
              // Remove if clicking again
              return prev.filter(f => f.id !== feature.id)
            } else {
              // Add to selection
              return [...prev, feature]
            }
          })
        }
      }

      // MODE 2: Point (single coordinate)
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
    setSelectedFeatures([]) // Clear selected features
    setDrawnPolygon(null) // Clear drawn polygon
    setPolygonPoints([]) // Clear polygon points

    // Remove confirmed point marker
    if (confirmedMarkerRef.current) {
      confirmedMarkerRef.current.remove()
      confirmedMarkerRef.current = null
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
            ? selectionMode === 'polygon'
              ? 'cursor-crosshair'
              : 'cursor-pointer'
            : 'cursor-grab active:cursor-grabbing'
        }`}
      />

      {/* 2D/3D Toggle */}
      <div className="absolute top-4 right-20 z-30">
        <button
          onClick={() => setIs3DView(!is3DView)}
          className={`px-4 py-2 rounded-lg shadow-lg text-sm font-medium transition ${
            is3DView
              ? 'bg-indigo-600 text-white'
              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
          }`}
          title={is3DView ? 'Switch to 2D view' : 'Switch to 3D view'}
        >
          {is3DView ? '🏗️ 3D' : '🗺️ 2D'}
        </button>
      </div>

      {/* Selection mode controls */}
      {mapMode === 'create' && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-40 bg-white border-2 border-indigo-500 rounded-lg shadow-lg p-4">
          <div className="flex flex-col gap-3">
            {/* Mode selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setSelectionMode('building')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectionMode === 'building'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                🏢 Buildings
              </button>
              <button
                onClick={() => setSelectionMode('point')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectionMode === 'point'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                📍 Point
              </button>
              <button
                onClick={() => setSelectionMode('polygon')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  selectionMode === 'polygon'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ⬡ Area
              </button>
            </div>

            {/* Instructions */}
            <div className="text-sm text-gray-600">
              {selectionMode === 'building' && (
                <>Click buildings/roads to select (multiple). Click again to deselect.</>
              )}
              {selectionMode === 'point' && <>Click anywhere to place a point</>}
              {selectionMode === 'polygon' && <>Draw an area by clicking points. Double-click to finish.</>}
            </div>

            {/* Selection counter for building mode */}
            {selectionMode === 'building' && selectedFeatures.length > 0 && (
              <div className="bg-indigo-50 border border-indigo-200 rounded px-3 py-2 text-sm text-indigo-900 font-medium">
                {selectedFeatures.length} feature{selectedFeatures.length > 1 ? 's' : ''} selected
              </div>
            )}

            {/* Polygon points counter */}
            {selectionMode === 'polygon' && polygonPoints.length > 0 && (
              <div className="bg-purple-50 border border-purple-200 rounded px-3 py-2 text-sm text-purple-900 font-medium">
                {polygonPoints.length} point{polygonPoints.length > 1 ? 's' : ''} •
                {polygonPoints.length < 3 && ' Need 3+ for polygon'}
                {polygonPoints.length >= 3 && ' Polygon ready'}
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2">
              {/* Building mode - Create Proposal */}
              {selectionMode === 'building' && selectedFeatures.length > 0 && (
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
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  Create Proposal
                </button>
              )}

              {/* Polygon mode - Listo button */}
              {selectionMode === 'polygon' && polygonPoints.length >= 3 && (
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
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition font-medium"
                >
                  ✓ Listo
                </button>
              )}

              <button
                onClick={() => {
                  setMapMode('navigate')
                  setSelectedFeatures([])
                  setDrawnPolygon(null)
                  setPolygonPoints([])
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition font-medium"
              >
                Cancel
              </button>
            </div>
          </div>
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
        selectedFeatures={selectedFeatures}
        drawnPolygon={drawnPolygon}
      />
    </div>
  )
}