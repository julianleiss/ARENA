// ARENA V1.0 - FeatureSelector Usage Example
// This file demonstrates how to integrate FeatureSelector in MapView

import { useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import { detectFeaturesAtPoint, DetectedFeature } from '@/src/lib/feature-detection'
import FeatureSelector from './FeatureSelector'

/**
 * Example: Integrate FeatureSelector in MapView component
 */
export function MapViewWithFeatureSelector() {
  const [features, setFeatures] = useState<DetectedFeature[]>([])
  const [clickPoint, setClickPoint] = useState<{ lng: number; lat: number } | null>(null)
  const [showSelector, setShowSelector] = useState(false)

  const handleMapClick = (map: maplibregl.Map, e: maplibregl.MapMouseEvent) => {
    // Detect features at click point
    const point = map.project(e.lngLat)
    const detectedFeatures = detectFeaturesAtPoint(map, point, 15)

    // Store click point and features
    setClickPoint({ lng: e.lngLat.lng, lat: e.lngLat.lat })
    setFeatures(detectedFeatures)

    // Show selector
    setShowSelector(true)
  }

  const handleFeatureSelect = (feature: DetectedFeature | null) => {
    if (feature) {
      console.log('User selected feature:', feature)
      // Do something with the selected feature
      // For example, open a proposal drawer with feature info
    } else {
      console.log('User selected exact point:', clickPoint)
      // Use exact click point
    }

    // Close selector
    setShowSelector(false)
  }

  const handleClose = () => {
    setShowSelector(false)
    setFeatures([])
    setClickPoint(null)
  }

  return (
    <>
      {/* Your map component here */}

      {/* Feature Selector */}
      {showSelector && clickPoint && (
        <FeatureSelector
          features={features}
          clickPoint={clickPoint}
          onSelect={handleFeatureSelect}
          onClose={handleClose}
        />
      )}
    </>
  )
}

/**
 * Example: Integration in existing MapView.tsx
 *
 * 1. Add state at the top of MapView component:
 * ```typescript
 * const [detectedFeatures, setDetectedFeatures] = useState<DetectedFeature[]>([])
 * const [clickPoint, setClickPoint] = useState<{ lng: number; lat: number } | null>(null)
 * const [showFeatureSelector, setShowFeatureSelector] = useState(false)
 * ```
 *
 * 2. Modify the map click handler:
 * ```typescript
 * map.current.on('click', (e) => {
 *   if (mapModeRef.current === 'create') {
 *     // Detect features
 *     const point = map.current!.project(e.lngLat)
 *     const features = detectFeaturesAtPoint(map.current!, point, 15)
 *
 *     // Store state
 *     setClickPoint({ lng: e.lngLat.lng, lat: e.lngLat.lat })
 *     setDetectedFeatures(features)
 *     setShowFeatureSelector(true)
 *   }
 * })
 * ```
 *
 * 3. Handle feature selection:
 * ```typescript
 * const handleFeatureSelect = (feature: DetectedFeature | null) => {
 *   if (feature) {
 *     // Use feature centroid
 *     const centroid = getCentroid(feature.geometry)
 *     setSelectedCoords(centroid)
 *   } else {
 *     // Use exact click point
 *     setSelectedCoords(clickPoint!)
 *   }
 *
 *   // Open drawer
 *   setDrawerMode('create')
 *   setDrawerOpen(true)
 *   setShowFeatureSelector(false)
 *   setMapMode('navigate')
 * }
 * ```
 *
 * 4. Add FeatureSelector component in JSX:
 * ```tsx
 * {showFeatureSelector && clickPoint && (
 *   <FeatureSelector
 *     features={detectedFeatures}
 *     clickPoint={clickPoint}
 *     onSelect={handleFeatureSelect}
 *     onClose={() => {
 *       setShowFeatureSelector(false)
 *       setMapMode('navigate')
 *     }}
 *   />
 * )}
 * ```
 */
