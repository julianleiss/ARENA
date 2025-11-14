// ARENA - Sandbox Layer Component (deck.gl 2.5D rendering)
'use client'

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import { Deck } from '@deck.gl/core'
import { GeoJsonLayer } from '@deck.gl/layers'
import 'mapbox-gl/dist/mapbox-gl.css'

type Instance = {
  id: string
  sandboxId: string
  assetId: string
  geom: any
  params: Record<string, any>
  transform: Record<string, any>
  state: string
}

type Asset = {
  id: string
  name: string
  kind: string
  modelUrl: string | null
  defaultParams: Record<string, any>
}

type SandboxLayerProps = {
  sandboxGeometry: any
  instances: Instance[]
  assets: Asset[]
  selectedInstanceId: string | null
  onInstanceClick: (instanceId: string | null) => void
  onMapClick: (lng: number, lat: number) => void
}

export default function SandboxLayer({
  sandboxGeometry,
  instances,
  assets,
  selectedInstanceId,
  onInstanceClick,
  onMapClick,
}: SandboxLayerProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null)
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const deckRef = useRef<Deck | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current) return

    // Initialize Mapbox
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json',
      center: [-58.46, -34.545],
      zoom: 14,
      pitch: 45,
      bearing: 0,
    })

    mapRef.current = map

    map.on('load', () => {
      // Initialize deck.gl
      const deck = new Deck({
        canvas: 'deck-canvas',
        width: '100%',
        height: '100%',
        initialViewState: {
          longitude: -58.46,
          latitude: -34.545,
          zoom: 14,
          pitch: 45,
          bearing: 0,
        },
        controller: true,
        onViewStateChange: ({ viewState }) => {
          map.jumpTo({
            center: [viewState.longitude, viewState.latitude],
            zoom: viewState.zoom,
            bearing: viewState.bearing,
            pitch: viewState.pitch,
          })
        },
        layers: [],
      })

      deckRef.current = deck
    })

    // Map click handler
    map.on('click', (e) => {
      onMapClick(e.lngLat.lng, e.lngLat.lat)
    })

    return () => {
      if (deckRef.current) {
        deckRef.current.finalize()
      }
      map.remove()
    }
  }, [])

  // Update deck.gl layers when instances change
  useEffect(() => {
    if (!deckRef.current) return

    // Create asset lookup
    const assetMap = new Map(assets.map((a) => [a.id, a]))

    // Convert instances to GeoJSON features
    const features = instances.map((instance) => {
      const asset = assetMap.get(instance.assetId)
      const color = asset?.defaultParams?.color || '#CCCCCC'

      // Parse color hex to RGB
      const r = parseInt(color.slice(1, 3), 16)
      const g = parseInt(color.slice(3, 5), 16)
      const b = parseInt(color.slice(5, 7), 16)

      return {
        type: 'Feature' as const,
        properties: {
          id: instance.id,
          assetId: instance.assetId,
          floors: instance.params.floors || asset?.defaultParams?.floors || 1,
          height: instance.params.height || asset?.defaultParams?.height || 3,
          color: [r, g, b],
          selected: instance.id === selectedInstanceId,
        },
        geometry: instance.geom,
      }
    })

    const geojson = {
      type: 'FeatureCollection' as const,
      features,
    }

    // Create extruded 2.5D layer
    const instancesLayer = new GeoJsonLayer({
      id: 'instances-layer',
      data: geojson,
      filled: true,
      extruded: true,
      wireframe: false,
      pickable: true,
      getElevation: (f: any) => {
        if (f.properties.floors) {
          return f.properties.floors * 3 // 3 meters per floor
        }
        return f.properties.height || 3
      },
      getFillColor: (f: any): [number, number, number, number] => {
        if (f.properties.selected) {
          return [99, 102, 241, 255] // Indigo for selected
        }
        return [...f.properties.color, 200] as [number, number, number, number]
      },
      getLineColor: [80, 80, 80, 200],
      getLineWidth: 1,
      lineWidthMinPixels: 1,
      onClick: (info) => {
        if (info.object) {
          onInstanceClick(info.object.properties.id)
        } else {
          onInstanceClick(null)
        }
        return true
      },
    })

    deckRef.current.setProps({
      layers: [instancesLayer],
    })
  }, [instances, assets, selectedInstanceId, onInstanceClick])

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="absolute inset-0" />
      <canvas
        id="deck-canvas"
        className="absolute inset-0 pointer-events-none"
        style={{ pointerEvents: 'auto' }}
      />
    </div>
  )
}
