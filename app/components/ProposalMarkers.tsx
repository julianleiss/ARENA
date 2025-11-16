'use client'

/**
 * ProposalMarkers - Mapbox proposal marker management
 *
 * Renders proposal pins on a Mapbox map with hover and click interactions.
 * Manages marker source, layers, and event handlers.
 */

import { useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'
import {
  proposalsToGeoJSON,
  createProposalPinImage,
  type Proposal
} from '@/app/lib/mapbox-layers'
import ProposalPopup from './ProposalPopup'

export interface ProposalMarkersProps {
  /** Mapbox map instance */
  map: mapboxgl.Map | null
  /** Array of proposals to display */
  proposals: Proposal[]
  /** Callback when proposal marker is clicked */
  onProposalClick?: (proposalId: string) => void
}

const SOURCE_ID = 'proposals'
const LAYER_ID = 'proposal-markers'
const IMAGE_ID = 'proposal-pin'

/**
 * ProposalMarkers component
 * Adds proposal markers to a Mapbox map instance
 */
export default function ProposalMarkers({
  map,
  proposals,
  onProposalClick
}: ProposalMarkersProps) {
  const [hoveredProposal, setHoveredProposal] = useState<Proposal | null>(null)
  const [popupPosition, setPopupPosition] = useState<{ x: number; y: number } | null>(null)
  const isInitialized = useRef(false)

  // Initialize map source and layers
  useEffect(() => {
    console.log('🔍 ProposalMarkers useEffect triggered', {
      hasMap: !!map,
      isInitialized: isInitialized.current,
      proposalsCount: proposals.length
    })

    if (!map) return
    if (isInitialized.current) return

    const initializeMapLayers = async () => {
      try {
        console.log('🚀 Starting ProposalMarkers initialization...')

        // Wait for map style to load
        if (!map.isStyleLoaded()) {
          console.log('⏳ Map style not loaded yet, waiting...')
          map.once('style.load', () => initializeMapLayers())
          return
        }

        console.log('✅ Map style loaded, adding proposal markers...')

        // Load custom pin image
        if (!map.hasImage(IMAGE_ID)) {
          try {
            const image = await createProposalPinImage()
            // Double-check after async operation
            if (!map.hasImage(IMAGE_ID)) {
              map.addImage(IMAGE_ID, image, { pixelRatio: 2 })
            }
          } catch (error) {
            console.error('Failed to load proposal pin image:', error)
          }
        }

        // Add source for proposals
        if (!map.getSource(SOURCE_ID)) {
          map.addSource(SOURCE_ID, {
            type: 'geojson',
            data: proposalsToGeoJSON([])
          })
        }

        // Add marker layer
        // NOTE: Adding without beforeId puts layer at the TOP of the layer stack
        // This ensures proposal pins render on top of all map features
        if (!map.getLayer(LAYER_ID)) {
          map.addLayer({
            id: LAYER_ID,
            type: 'symbol',
            source: SOURCE_ID,
            layout: {
              'icon-image': IMAGE_ID,
              'icon-size': [
                'interpolate',
                ['linear'],
                ['zoom'],
                10, 1.5,    // Increased from 1.2
                14, 2.0,    // Increased from 1.6
                16, 2.5,    // Increased from 2.0
                18, 3.0     // Increased from 2.5
              ],
              'icon-anchor': 'bottom',
              'icon-allow-overlap': true,      // Allow pins to overlap other symbols
              'icon-ignore-placement': true,    // Don't participate in collision detection
              'symbol-sort-key': 1000          // Render on top of other symbols
            },
            paint: {
              'icon-opacity': 1.0
            }
          })

          // Make layer interactive
          map.on('click', LAYER_ID, handleMarkerClick)
          map.on('mouseenter', LAYER_ID, handleMarkerMouseEnter)
          map.on('mousemove', LAYER_ID, handleMarkerMouseMove)
          map.on('mouseleave', LAYER_ID, handleMarkerMouseLeave)
        }

        isInitialized.current = true
        console.log('✅ Proposal markers initialized')
      } catch (error) {
        console.error('❌ Failed to initialize proposal markers:', error)
      }
    }

    initializeMapLayers()

    // Re-initialize when style loads (ensures layer stays on top after style changes)
    const handleStyleLoad = () => {
      console.log('🔄 Map style reloaded, re-adding proposal markers on top')
      isInitialized.current = false
      initializeMapLayers()
    }

    map.on('style.load', handleStyleLoad)

    // Cleanup
    return () => {
      if (!map) return

      // Remove style.load listener
      map.off('style.load', handleStyleLoad)

      // Remove event listeners
      map.off('click', LAYER_ID, handleMarkerClick)
      map.off('mouseenter', LAYER_ID, handleMarkerMouseEnter)
      map.off('mousemove', LAYER_ID, handleMarkerMouseMove)
      map.off('mouseleave', LAYER_ID, handleMarkerMouseLeave)

      // Remove layer and source
      if (map.getLayer(LAYER_ID)) {
        map.removeLayer(LAYER_ID)
      }
      if (map.getSource(SOURCE_ID)) {
        map.removeSource(SOURCE_ID)
      }
      if (map.hasImage(IMAGE_ID)) {
        map.removeImage(IMAGE_ID)
      }

      isInitialized.current = false
    }
  }, [map])

  // Update proposals data when it changes
  useEffect(() => {
    console.log('🔄 Updating proposal markers data', {
      hasMap: !!map,
      isInitialized: isInitialized.current,
      proposalsCount: proposals.length
    })

    if (!map || !isInitialized.current) {
      console.log('⏭️ Skipping update - map not ready or not initialized')
      return
    }

    const source = map.getSource(SOURCE_ID) as mapboxgl.GeoJSONSource
    if (source) {
      const geojson = proposalsToGeoJSON(proposals)
      console.log('📍 Setting proposal data:', {
        featuresCount: geojson.features.length,
        features: geojson.features.map(f => ({
          id: f.properties?.id,
          title: f.properties?.title,
          coords: f.geometry.coordinates
        }))
      })
      source.setData(geojson)
      console.log(`✅ Updated ${proposals.length} proposal markers`)
    } else {
      console.error('❌ Proposal source not found!')
    }
  }, [map, proposals])

  // Event handlers
  const handleMarkerClick = (e: mapboxgl.MapMouseEvent) => {
    if (!e.features || e.features.length === 0) return

    const feature = e.features[0]
    const proposalId = feature.properties?.id

    if (proposalId && onProposalClick) {
      console.log('📍 Proposal marker clicked:', proposalId)
      onProposalClick(proposalId)
    }
  }

  const handleMarkerMouseEnter = (e: mapboxgl.MapMouseEvent) => {
    if (!map) return

    // Change cursor to pointer
    map.getCanvas().style.cursor = 'pointer'

    // Find the full proposal object
    if (e.features && e.features.length > 0) {
      const proposalId = e.features[0].properties?.id
      const proposal = proposals.find(p => p.id === proposalId)

      if (proposal) {
        setHoveredProposal(proposal)
      }
    }
  }

  const handleMarkerMouseMove = (e: mapboxgl.MapMouseEvent) => {
    // Update popup position
    const canvas = e.target.getCanvas()
    const rect = canvas.getBoundingClientRect()

    setPopupPosition({
      x: e.point.x,
      y: e.point.y - rect.top
    })
  }

  const handleMarkerMouseLeave = () => {
    if (!map) return

    // Reset cursor
    map.getCanvas().style.cursor = ''

    // Hide popup
    setHoveredProposal(null)
    setPopupPosition(null)
  }

  return (
    <>
      {/* Hover popup */}
      {hoveredProposal && popupPosition && (
        <ProposalPopup
          proposal={hoveredProposal}
          position={popupPosition}
          type="hover"
        />
      )}
    </>
  )
}
