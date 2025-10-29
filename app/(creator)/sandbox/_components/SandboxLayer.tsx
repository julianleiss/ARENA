// ARENA - Sandbox Layer Component (Iteration 7: glTF/2.5D hybrid rendering)
'use client'

import { useEffect, useRef, useState } from 'react'
import maplibregl from 'maplibre-gl'
import { Deck } from '@deck.gl/core'
import { GeoJsonLayer } from '@deck.gl/layers'
import { ScenegraphLayer } from '@deck.gl/mesh-layers'
import 'maplibre-gl/dist/maplibre-gl.css'

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
  const mapRef = useRef<maplibregl.Map | null>(null)
  const deckRef = useRef<Deck | null>(null)

  useEffect(() => {
    if (!mapContainerRef.current) return

    // Initialize MapLibre
    const map = new maplibregl.Map({
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

    // Separate instances by rendering method
    const gltfInstances: Instance[] = []
    const geojsonInstances: Instance[] = []

    instances.forEach((instance) => {
      const asset = assetMap.get(instance.assetId)
      if (asset?.modelUrl && asset.kind === 'custom') {
        gltfInstances.push(instance)
      } else {
        geojsonInstances.push(instance)
      }
    })

    const layers: any[] = []

    // Create 2.5D GeoJSON layer for standard instances
    if (geojsonInstances.length > 0) {
      const features = geojsonInstances.map((instance) => {
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

      const instancesLayer = new GeoJsonLayer({
        id: 'instances-layer-2d5',
        data: geojson,
        filled: true,
        extruded: true,
        wireframe: false,
        pickable: true,
        getElevation: (f: any) => {
          if (f.properties.floors) {
            return f.properties.floors * 3
          }
          return f.properties.height || 3
        },
        getFillColor: (f: any): [number, number, number, number] => {
          if (f.properties.selected) {
            return [99, 102, 241, 255]
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

      layers.push(instancesLayer)
    }

    // Create ScenegraphLayer for glTF models with fallback
    if (gltfInstances.length > 0) {
      const sceneData = gltfInstances.map((instance) => {
        const asset = assetMap.get(instance.assetId)!
        const coords = instance.geom.coordinates
        const transform = instance.transform || {}

        return {
          id: instance.id,
          assetId: instance.assetId,
          position: coords,
          modelUrl: asset.modelUrl!,
          scale: transform.scale || instance.params.scale || 1,
          rotation: transform.rotation || [0, 0, 0],
          selected: instance.id === selectedInstanceId,
        }
      })

      try {
        const sceneLayer = new ScenegraphLayer({
          id: 'instances-layer-gltf',
          data: sceneData,
          pickable: true,
          scenegraph: (d: any) => d.modelUrl,
          getPosition: (d: any) => d.position,
          getOrientation: (d: any) => {
            const rot = Array.isArray(d.rotation) ? d.rotation : [0, 0, 0]
            return [rot[0] || 0, rot[1] || 0, rot[2] || 0]
          },
          getScale: (d: any): [number, number, number] => {
            const s = d.scale
            if (typeof s === 'number') return [s, s, s]
            if (Array.isArray(s) && s.length === 3) return s as [number, number, number]
            return [1, 1, 1]
          },
          getColor: (d: any) =>
            d.selected ? [99, 102, 241, 255] : [200, 200, 200, 255],
          sizeScale: 1,
          _lighting: 'pbr',
          onClick: (info) => {
            if (info.object) {
              onInstanceClick(info.object.id)
            } else {
              onInstanceClick(null)
            }
            return true
          },
          onError: (error: Error) => {
            console.error('ScenegraphLayer render error:', error)
            // Fallback handled in catch block below
            return false // Don't suppress error
          },
        })

        layers.push(sceneLayer)
      } catch (error) {
        console.error('Failed to create ScenegraphLayer:', error)
        // Fallback: create 2.5D representation for failed models
        const fallbackFeatures = gltfInstances.map((instance) => {
          const asset = assetMap.get(instance.assetId)
          return {
            type: 'Feature' as const,
            properties: {
              id: instance.id,
              assetId: instance.assetId,
              height: instance.params.height || asset?.defaultParams?.height || 10,
              selected: instance.id === selectedInstanceId,
            },
            geometry: instance.geom,
          }
        })

        const fallbackLayer = new GeoJsonLayer({
          id: 'instances-layer-fallback',
          data: {
            type: 'FeatureCollection' as const,
            features: fallbackFeatures,
          },
          filled: true,
          extruded: true,
          wireframe: false,
          pickable: true,
          getElevation: (f: any) => f.properties.height || 10,
          getFillColor: (f: any) =>
            f.properties.selected ? [99, 102, 241, 255] : [150, 150, 150, 200],
          getLineColor: [80, 80, 80, 200],
          onClick: (info) => {
            if (info.object) {
              onInstanceClick(info.object.properties.id)
            } else {
              onInstanceClick(null)
            }
            return true
          },
        })

        layers.push(fallbackLayer)
      }
    }

    deckRef.current.setProps({
      layers,
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
