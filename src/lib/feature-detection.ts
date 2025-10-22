// ARENA V1.0 - Feature Detection Library
// Detects and processes OSM features from vector tiles

import * as maplibregl from 'maplibre-gl'

export interface DetectedFeature {
  id: string
  type: 'building' | 'road' | 'amenity' | 'landuse' | 'unknown'
  osmId?: string
  geometry: GeoJSON.Geometry
  properties: Record<string, any>
  layer: string
  name?: string
  description?: string
}

/**
 * Detects OSM features at a specific point on the map
 * @param map - MapLibre map instance
 * @param point - Point to query (screen coordinates)
 * @param radius - Search radius in pixels (default: 15)
 * @returns Array of detected features, deduplicated by OSM ID
 */
export function detectFeaturesAtPoint(
  map: maplibregl.Map,
  point: maplibregl.Point,
  radius: number = 15
): DetectedFeature[] {
  console.log(`🔍 Detecting features at point:`, { x: point.x, y: point.y, radius })

  // Diagnostic: Check available layers
  const availableLayers = map.getStyle().layers.map(l => l.id)
  console.log('🎯 Available layers in map:', availableLayers)

  // Query selectable layers within radius
  const selectableLayers = [
    'osm-buildings-selectable',
    'osm-roads-selectable',
    'osm-landuse-selectable',
  ]

  console.log('🔍 Querying layers:', selectableLayers)
  console.log('🔍 Layers exist in map:', selectableLayers.map(l => availableLayers.includes(l)))

  const features = map.queryRenderedFeatures(
    [
      [point.x - radius, point.y - radius],
      [point.x + radius, point.y + radius],
    ],
    { layers: selectableLayers }
  )

  console.log(`📍 Found ${features.length} raw features before deduplication`)

  // If no features found with layer filter, try without filter
  if (features.length === 0) {
    console.log('⚠️ No features found with layer filter, trying query without filter...')
    const allFeatures = map.queryRenderedFeatures(
      [
        [point.x - radius, point.y - radius],
        [point.x + radius, point.y + radius],
      ]
    )
    console.log(`📍 Found ${allFeatures.length} features total (without layer filter)`)
    if (allFeatures.length > 0) {
      console.log('📋 Sample features found:', allFeatures.slice(0, 3).map(f => ({
        id: f.id,
        layer: f.layer?.id,
        sourceLayer: f.sourceLayer,
        source: f.source
      })))
    }
  }

  if (features.length === 0) {
    console.log('❌ No features detected at this location')
    return []
  }

  // Deduplicate by OSM ID
  const seenOsmIds = new Set<string>()
  const detectedFeatures: DetectedFeature[] = []

  features.forEach((feature, index) => {
    const osmId = feature.properties?.id || feature.properties?.osm_id
    const featureId = osmId || `${feature.layer.id}-${index}`

    // Skip duplicates
    if (osmId && seenOsmIds.has(osmId)) {
      console.log(`⏭️  Skipping duplicate feature with OSM ID: ${osmId}`)
      return
    }

    if (osmId) {
      seenOsmIds.add(osmId)
    }

    const detectedFeature: DetectedFeature = {
      id: featureId,
      type: getFeatureType(feature),
      osmId: osmId,
      geometry: feature.geometry as GeoJSON.Geometry,
      properties: feature.properties || {},
      layer: feature.layer.id,
      name: extractFeatureName(feature),
      description: extractFeatureDescription(feature),
    }

    detectedFeatures.push(detectedFeature)

    console.log(`✅ Detected feature ${index + 1}:`, {
      id: detectedFeature.id,
      type: detectedFeature.type,
      osmId: detectedFeature.osmId,
      name: detectedFeature.name,
      layer: detectedFeature.layer,
      properties: detectedFeature.properties,
    })
  })

  console.log(`🎯 Total unique features after deduplication: ${detectedFeatures.length}`)

  return detectedFeatures
}

/**
 * Calculates the centroid of a GeoJSON geometry
 * @param geometry - GeoJSON geometry (Point, LineString, or Polygon)
 * @returns Centroid as {lng, lat}
 */
export function getCentroid(geometry: GeoJSON.Geometry): { lng: number; lat: number } {
  switch (geometry.type) {
    case 'Point':
      return {
        lng: (geometry as GeoJSON.Point).coordinates[0],
        lat: (geometry as GeoJSON.Point).coordinates[1],
      }

    case 'LineString': {
      const coords = (geometry as GeoJSON.LineString).coordinates
      // Calculate midpoint of the line
      const midIndex = Math.floor(coords.length / 2)
      return {
        lng: coords[midIndex][0],
        lat: coords[midIndex][1],
      }
    }

    case 'Polygon': {
      const coords = (geometry as GeoJSON.Polygon).coordinates[0]
      // Calculate average of all points in the outer ring
      let sumLng = 0
      let sumLat = 0
      coords.forEach((coord) => {
        sumLng += coord[0]
        sumLat += coord[1]
      })
      return {
        lng: sumLng / coords.length,
        lat: sumLat / coords.length,
      }
    }

    case 'MultiPoint': {
      const coords = (geometry as GeoJSON.MultiPoint).coordinates
      let sumLng = 0
      let sumLat = 0
      coords.forEach((coord) => {
        sumLng += coord[0]
        sumLat += coord[1]
      })
      return {
        lng: sumLng / coords.length,
        lat: sumLat / coords.length,
      }
    }

    case 'MultiLineString': {
      const coords = (geometry as GeoJSON.MultiLineString).coordinates
      const firstLine = coords[0]
      const midIndex = Math.floor(firstLine.length / 2)
      return {
        lng: firstLine[midIndex][0],
        lat: firstLine[midIndex][1],
      }
    }

    case 'MultiPolygon': {
      const coords = (geometry as GeoJSON.MultiPolygon).coordinates
      const firstPolygon = coords[0][0]
      let sumLng = 0
      let sumLat = 0
      firstPolygon.forEach((coord) => {
        sumLng += coord[0]
        sumLat += coord[1]
      })
      return {
        lng: sumLng / firstPolygon.length,
        lat: sumLat / firstPolygon.length,
      }
    }

    default:
      console.warn(`⚠️ Unsupported geometry type: ${geometry.type}`)
      return { lng: 0, lat: 0 }
  }
}

/**
 * Returns an emoji icon for a feature type
 * @param type - Feature type
 * @returns Emoji representing the feature type
 */
export function getFeatureIcon(type: DetectedFeature['type']): string {
  const icons: Record<DetectedFeature['type'], string> = {
    building: '🏢',
    road: '🛣️',
    amenity: '🌳',
    landuse: '🏘️',
    unknown: '📍',
  }

  return icons[type] || icons.unknown
}

/**
 * Helper: Extracts a human-readable name from feature properties
 */
function extractFeatureName(feature: maplibregl.MapGeoJSONFeature): string | undefined {
  const props = feature.properties || {}

  // Try common name fields
  const nameFields = [
    'name',
    'name:es', // Spanish name
    'name:en', // English name
    'ref', // Reference number (for roads)
    'addr:street', // Street address
  ]

  for (const field of nameFields) {
    if (props[field]) {
      return props[field]
    }
  }

  // Fallback: use road class or building type
  if (props.class) {
    return props.class
  }

  return undefined
}

/**
 * Helper: Extracts a description from feature properties
 */
function extractFeatureDescription(feature: maplibregl.MapGeoJSONFeature): string | undefined {
  const props = feature.properties || {}

  // Try to build a meaningful description
  const parts: string[] = []

  // Add type information
  if (props.type) {
    parts.push(props.type)
  }

  // Add class information
  if (props.class && props.class !== props.type) {
    parts.push(props.class)
  }

  // Add subclass information
  if (props.subclass) {
    parts.push(props.subclass)
  }

  // Add layer information (buildings only)
  if (props.layer && feature.layer.id.includes('building')) {
    parts.push(`Layer ${props.layer}`)
  }

  // Add height information (buildings)
  if (props.height) {
    parts.push(`${props.height}m high`)
  }

  // Add surface type (roads)
  if (props.surface) {
    parts.push(`Surface: ${props.surface}`)
  }

  return parts.length > 0 ? parts.join(' • ') : undefined
}

/**
 * Helper: Determines the feature type from layer and properties
 */
function getFeatureType(feature: maplibregl.MapGeoJSONFeature): DetectedFeature['type'] {
  const layerId = feature.layer.id
  const props = feature.properties || {}

  // Determine type based on layer
  if (layerId.includes('building')) {
    return 'building'
  }

  if (layerId.includes('road')) {
    return 'road'
  }

  if (layerId.includes('landuse')) {
    // Check if it's an amenity
    if (props.class === 'park' || props.class === 'recreation_ground' || props.amenity) {
      return 'amenity'
    }
    return 'landuse'
  }

  // Check properties for additional type hints
  if (props.building) {
    return 'building'
  }

  if (props.highway || props.road) {
    return 'road'
  }

  if (props.amenity || props.leisure) {
    return 'amenity'
  }

  if (props.landuse) {
    return 'landuse'
  }

  console.warn(`⚠️ Could not determine type for feature:`, { layerId, props })
  return 'unknown'
}
