// ARENA - Proposal Preview Layer (Iteration 5)
'use client'

import { GeoJsonLayer } from '@deck.gl/layers'

type PreviewLayerProps = {
  geom: GeoJSON.FeatureCollection | null
  mask: GeoJSON.Polygon | null
  featureThreshold?: number
}

export function createPreviewLayers({
  geom,
  mask,
  featureThreshold = 500,
}: PreviewLayerProps) {
  if (!geom || !mask) return []

  const layerArray: any[] = []

  // Skip preview if feature count exceeds threshold (performance optimization)
  const featureCount = geom.features.length
  if (featureCount > featureThreshold) {
    console.log(
      `Preview skipped: ${featureCount} features exceeds threshold ${featureThreshold}`
    )
    return []
  }

  // Main preview layer - extruded 2.5D geometry
  const previewLayer = new GeoJsonLayer({
    id: 'preview-layer',
    data: geom,
    pickable: false,
    stroked: false,
    filled: true,
    extruded: true,
    wireframe: false,
    opacity: 0.6,
    getElevation: (f: any) => {
      if (f.properties.floors) {
        return f.properties.floors * 3 // 3 meters per floor
      }
      return f.properties.height || 3
    },
    getFillColor: [99, 102, 241, 200], // Indigo with transparency
    getLineColor: [67, 56, 202, 255],
    lineWidthMinPixels: 1,
  })

  layerArray.push(previewLayer)

  // Mask border layer - exterior attenuation
  const maskBorder = new GeoJsonLayer({
    id: 'preview-mask-border',
    data: {
      type: 'Feature',
      geometry: mask,
      properties: {},
    },
    pickable: false,
    stroked: true,
    filled: false,
    lineWidthMinPixels: 2,
    getLineColor: [99, 102, 241, 255], // Indigo border
    getDashArray: [4, 2],
  })

  layerArray.push(maskBorder)

  return layerArray
}
