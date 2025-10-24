// ARENA - Get Proposal Detail Server Action (Iteration 6)
'use server'

import { supabase } from '@/app/lib/supabase-client'

export type ProposalDetail = {
  id: string
  title: string
  description: string
  status: string
  created_at: string
  author: {
    name: string | null
    email: string
  }
  preview: {
    geom: GeoJSON.FeatureCollection
    mask: GeoJSON.Polygon
  } | null
}

export async function getProposalById(id: string): Promise<ProposalDetail | null> {
  try {
    const { data, error } = await supabase
      .from('proposals')
      .select(
        `
        id,
        title,
        description,
        status,
        created_at,
        author:users!author_id (
          name,
          email
        ),
        preview:proposal_previews (
          geom,
          mask
        )
      `
      )
      .eq('id', id)
      .single()

    if (error || !data) {
      console.error('Failed to fetch proposal:', error)
      return null
    }

    // Transform to expected format
    return {
      id: data.id,
      title: data.title,
      description: data.description,
      status: data.status,
      created_at: data.created_at,
      author: Array.isArray(data.author) ? data.author[0] : data.author,
      preview: Array.isArray(data.preview) && data.preview.length > 0
        ? data.preview[0]
        : null,
    }
  } catch (error) {
    console.error('Failed to fetch proposal:', error)
    return null
  }
}
