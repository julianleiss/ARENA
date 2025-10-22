// ARENA V1.0 - Feature Detection Usage Example
// This file demonstrates how to use the feature detection library

import * as maplibregl from 'maplibre-gl'
import {
  detectFeaturesAtPoint,
  getCentroid,
  getFeatureIcon,
  DetectedFeature,
} from './feature-detection'

/**
 * Example 1: Detect features on map click
 */
export function setupFeatureDetection(map: maplibregl.Map) {
  map.on('click', (e) => {
    // Convert lat/lng to screen coordinates
    const point = map.project(e.lngLat)

    // Detect features at click point with 15px radius
    const features = detectFeaturesAtPoint(map, point, 15)

    if (features.length === 0) {
      console.log('No features detected')
      return
    }

    // Process detected features
    features.forEach((feature) => {
      console.log(`Feature detected:`)
      console.log(`  ${getFeatureIcon(feature.type)} ${feature.name || 'Unnamed'}`)
      console.log(`  Type: ${feature.type}`)
      console.log(`  OSM ID: ${feature.osmId}`)
      console.log(`  Description: ${feature.description}`)

      // Get centroid
      const centroid = getCentroid(feature.geometry)
      console.log(`  Centroid: ${centroid.lat}, ${centroid.lng}`)
    })
  })
}

/**
 * Example 2: Show feature popup on hover
 */
export function setupFeatureHover(map: maplibregl.Map) {
  let popup: maplibregl.Popup | null = null

  map.on('mousemove', (e) => {
    const point = map.project(e.lngLat)
    const features = detectFeaturesAtPoint(map, point, 10)

    if (features.length > 0) {
      const feature = features[0]
      const centroid = getCentroid(feature.geometry)

      // Remove previous popup
      if (popup) {
        popup.remove()
      }

      // Create new popup
      popup = new maplibregl.Popup({ closeButton: false })
        .setLngLat([centroid.lng, centroid.lat])
        .setHTML(`
          <div style="padding: 8px;">
            <strong>${getFeatureIcon(feature.type)} ${feature.name || 'Unnamed'}</strong><br>
            <small>${feature.description || feature.type}</small>
          </div>
        `)
        .addTo(map)
    } else {
      // Remove popup if no features
      if (popup) {
        popup.remove()
        popup = null
      }
    }
  })
}

/**
 * Example 3: Highlight detected features
 */
export function highlightFeature(map: maplibregl.Map, feature: DetectedFeature) {
  // Add a temporary highlight layer
  const sourceId = `highlight-${feature.id}`
  const layerId = `highlight-layer-${feature.id}`

  // Add source with feature geometry
  map.addSource(sourceId, {
    type: 'geojson',
    data: {
      type: 'Feature',
      geometry: feature.geometry,
      properties: {},
    },
  })

  // Add highlight layer based on geometry type
  if (feature.geometry.type === 'Point') {
    map.addLayer({
      id: layerId,
      type: 'circle',
      source: sourceId,
      paint: {
        'circle-radius': 10,
        'circle-color': '#ff0000',
        'circle-opacity': 0.5,
      },
    })
  } else if (feature.geometry.type === 'LineString' || feature.geometry.type === 'MultiLineString') {
    map.addLayer({
      id: layerId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#ff0000',
        'line-width': 3,
        'line-opacity': 0.5,
      },
    })
  } else {
    // Polygon
    map.addLayer({
      id: layerId,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': '#ff0000',
        'fill-opacity': 0.3,
      },
    })
  }

  // Remove highlight after 3 seconds
  setTimeout(() => {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId)
    }
    if (map.getSource(sourceId)) {
      map.removeSource(sourceId)
    }
  }, 3000)
}
