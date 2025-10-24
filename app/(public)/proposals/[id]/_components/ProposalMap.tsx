// ARENA - Proposal Detail Map (Iteration 6)
'use client'

import { useMemo } from 'react'
import { Map } from 'react-map-gl/maplibre'
import DeckGL from '@deck.gl/react'
import { GeoJsonLayer } from '@deck.gl/layers'
import { MapViewState } from '@deck.gl/core'
import * as turf from '@turf/turf'
import 'maplibre-gl/dist/maplibre-gl.css'

type ProposalMapProps = {
  geom: GeoJSON.FeatureCollection
  mask: GeoJSON.Polygon
}

export default function ProposalMap({ geom, mask }: ProposalMapProps) {
  // Calculate center from mask
  const viewState: MapViewState = useMemo(() => {
    const maskPolygon = turf.polygon(mask.coordinates)
    const center = turf.centroid(maskPolygon)
    const [lng, lat] = center.geometry.coordinates

    return {
      longitude: lng,
      latitude: lat,
      zoom: 16,
      pitch: 60,
      bearing: 0,
    }
  }, [mask])

  // Create layers
  const layers = useMemo(() => {
    const layerArray: any[] = []

    // Main geometry layer - extruded 2.5D
    const geomLayer = new GeoJsonLayer({
      id: 'proposal-geom',
      data: geom,
      pickable: false,
      stroked: false,
      filled: true,
      extruded: true,
      wireframe: false,
      opacity: 0.8,
      getElevation: (f: any) => {
        if (f.properties.floors) {
          return f.properties.floors * 3 // 3 meters per floor
        }
        return f.properties.height || 3
      },
      getFillColor: [99, 102, 241, 220], // Indigo
      getLineColor: [67, 56, 202, 255],
      lineWidthMinPixels: 1,
    })

    layerArray.push(geomLayer)

    // Mask border
    const maskLayer = new GeoJsonLayer({
      id: 'proposal-mask',
      data: {
        type: 'Feature',
        geometry: mask,
        properties: {},
      },
      pickable: false,
      stroked: true,
      filled: false,
      lineWidthMinPixels: 3,
      getLineColor: [99, 102, 241, 255],
      getDashArray: [6, 3],
    })

    layerArray.push(maskLayer)

    return layerArray
  }, [geom, mask])

  return (
    <div className="relative w-full h-full">
      <DeckGL
        initialViewState={viewState}
        controller={true}
        layers={layers}
        style={{ position: 'relative' }}
      >
        <Map
          mapStyle="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
          attributionControl={false}
        />
      </DeckGL>
    </div>
  )
}
