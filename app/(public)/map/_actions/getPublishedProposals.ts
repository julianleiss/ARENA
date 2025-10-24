// ARENA - Get Published Proposals Server Action
'use server'

import { supabase } from '@/app/lib/supabase-client'
import * as turf from '@turf/turf'

export type PublishedProposal = {
  id: string
  title: string
  centroid: [number, number] // [lng, lat]
  mask: GeoJSON.Polygon
  geomLOD0: GeoJSON.FeatureCollection
}

export async function getPublishedProposals(
  bbox?: [number, number, number, number] // [minLng, minLat, maxLng, maxLat]
): Promise<PublishedProposal[]> {
  try {
    // Fetch all published proposals with their previews
    const { data: proposals, error } = await supabase
      .from('proposals')
      .select(
        `
        id,
        title,
        preview:proposal_previews(geom, mask)
      `
      )
      .eq('status', 'published')

    if (error) {
      console.error('Failed to fetch published proposals:', error)
      return []
    }

    if (!proposals || proposals.length === 0) {
      return []
    }

    // Transform to PublishedProposal format
    const result: PublishedProposal[] = proposals
      .filter((p: any) => p.preview && p.preview.geom && p.preview.mask)
      .map((p: any) => {
        // Calculate centroid from mask polygon
        const maskPolygon = turf.polygon(p.preview.mask.coordinates)
        const center = turf.centroid(maskPolygon)
        const [lng, lat] = center.geometry.coordinates

        // Filter by bbox if provided
        if (bbox) {
          const [minLng, minLat, maxLng, maxLat] = bbox
          if (lng < minLng || lng > maxLng || lat < minLat || lat > maxLat) {
            return null
          }
        }

        return {
          id: p.id,
          title: p.title,
          centroid: [lng, lat] as [number, number],
          mask: p.preview.mask,
          geomLOD0: p.preview.geom,
        }
      })
      .filter(Boolean) as PublishedProposal[]

    return result
  } catch (error) {
    console.error('Failed to fetch published proposals:', error)
    return []
  }
}
