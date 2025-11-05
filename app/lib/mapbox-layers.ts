/**
 * Mapbox Layer Utilities for ARENA
 *
 * Helper functions to create Mapbox GL JS layer specifications
 * for different data types (proposals, buildings, etc.)
 */

import type { GeoJSON } from 'geojson'

/**
 * Proposal data structure from API
 */
export interface Proposal {
  id: string
  title: string
  summary: string | null
  body?: string | null
  geom: {
    type: 'Point' | 'Polygon' | 'LineString' | 'MultiPoint'
    coordinates: any
  } | null
  status: string
  layer: string
  category?: string
  tags: string[]
  imageUrls?: string[]
  author?: {
    id: string
    name: string | null
    email: string
    role: string
  }
  createdAt?: string
  updatedAt?: string
  _count?: {
    votes: number
    comments: number
  }
}

/**
 * Extract a single coordinate point from any geometry type
 * Used for marker positioning
 */
export function extractCoordinates(geom: Proposal['geom']): [number, number] | null {
  if (!geom) return null

  switch (geom.type) {
    case 'Point':
      return geom.coordinates as [number, number]

    case 'Polygon':
      // Use first coordinate of outer ring
      return geom.coordinates[0][0] as [number, number]

    case 'LineString':
      // Use first point of line
      return geom.coordinates[0] as [number, number]

    case 'MultiPoint':
      // Use first point
      return geom.coordinates[0] as [number, number]

    default:
      return null
  }
}

/**
 * Convert proposals array to GeoJSON FeatureCollection
 * Each proposal becomes a Point feature at its representative location
 */
export function proposalsToGeoJSON(proposals: Proposal[]): GeoJSON.FeatureCollection {
  const features = proposals
    .filter(p => p.geom) // Only proposals with geometry
    .map(proposal => {
      const coords = extractCoordinates(proposal.geom)
      if (!coords) return null

      const feature: GeoJSON.Feature<GeoJSON.Point> = {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: coords
        },
        properties: {
          id: proposal.id,
          title: proposal.title,
          summary: proposal.summary,
          status: proposal.status,
          layer: proposal.layer,
          category: proposal.category,
          tags: proposal.tags,
          authorName: proposal.author?.name || 'Unknown',
          authorEmail: proposal.author?.email || '',
          createdAt: proposal.createdAt,
          voteCount: proposal._count?.votes || 0,
          commentCount: proposal._count?.comments || 0
        },
        id: proposal.id
      }
      return feature
    })
    .filter((f): f is GeoJSON.Feature<GeoJSON.Point> => f !== null)

  return {
    type: 'FeatureCollection',
    features
  }
}

/**
 * Get color based on proposal status
 */
export function getProposalColor(status: string): string {
  switch (status) {
    case 'draft':
      return '#9CA3AF' // Gray
    case 'published':
    case 'public':
      return '#8B5CF6' // Purple (ARENA brand color)
    case 'archived':
      return '#6B7280' // Darker gray
    default:
      return '#8B5CF6' // Default purple
  }
}

/**
 * Get icon size based on zoom level
 * Returns scale factor for icon
 */
export function getIconScale(zoom: number): number {
  if (zoom < 12) return 0.6
  if (zoom < 14) return 0.8
  if (zoom < 16) return 1.0
  return 1.2
}

/**
 * Create Mapbox layer spec for proposal markers
 * Returns a layer configuration object for use with map.addLayer()
 */
export function createProposalMarkerLayer(sourceId: string = 'proposals'): mapboxgl.AnyLayer {
  return {
    id: 'proposal-markers',
    type: 'symbol',
    source: sourceId,
    layout: {
      'icon-image': 'proposal-pin', // Custom image (will be added to map)
      'icon-size': [
        'interpolate',
        ['linear'],
        ['zoom'],
        10, 0.6,
        14, 0.8,
        16, 1.0,
        18, 1.2
      ],
      'icon-anchor': 'bottom',
      'icon-allow-overlap': true,
      'icon-ignore-placement': false
    },
    paint: {
      'icon-opacity': 1.0
    }
  } as mapboxgl.AnyLayer
}

/**
 * Create Mapbox layer spec for proposal labels
 * Shows title on hover or at high zoom
 */
export function createProposalLabelLayer(sourceId: string = 'proposals'): mapboxgl.AnyLayer {
  return {
    id: 'proposal-labels',
    type: 'symbol',
    source: sourceId,
    minzoom: 14, // Only show labels when zoomed in
    layout: {
      'text-field': ['get', 'title'],
      'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
      'text-size': 12,
      'text-offset': [0, -3],
      'text-anchor': 'top',
      'text-max-width': 10,
      'text-allow-overlap': false
    },
    paint: {
      'text-color': '#1F2937',
      'text-halo-color': '#FFFFFF',
      'text-halo-width': 2,
      'text-halo-blur': 1
    }
  } as mapboxgl.AnyLayer
}

/**
 * SVG marker icon as data URL
 * Purple pin with drop shadow (matches Google Maps version)
 */
export const PROPOSAL_PIN_SVG = `data:image/svg+xml;base64,${btoa(`
<svg width="48" height="48" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
<!-- Drop shadow -->
<ellipse cx="24" cy="44" rx="6" ry="2" fill="black" opacity="0.2"/>
<!-- Pin body -->
<path d="M24 4C17.3726 4 12 9.37258 12 16C12 24.5 19 33 24 40C29 33 36 24.5 36 16C36 9.37258 30.6274 4 24 4Z" fill="#8B5CF6"/>
<!-- Inner circle -->
<circle cx="24" cy="16" r="6" fill="white"/>
</svg>
`)}`

/**
 * Create an HTMLImageElement from the SVG for use with Mapbox
 */
export function createProposalPinImage(): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image(48, 48)
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = PROPOSAL_PIN_SVG
  })
}
