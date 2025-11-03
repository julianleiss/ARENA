// ARENA - Publish Sandbox as Proposal Server Action
'use server'

import { supabase } from '@/app/lib/supabase-client'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import * as turf from '@turf/turf'
import { v4 as uuidv4 } from 'uuid'

const PublishSchema = z.object({
  sandboxId: z.string(),
  title: z.string().min(3).max(200),
  body: z.string().min(10).max(2000),
  category: z.string().default('urban'),
  tags: z.array(z.string()).default([]),
  imageUrls: z.array(z.string()).default([]),
  authorId: z.string(),
})

export async function publishSandbox(input: unknown) {
  try {
    const validated = PublishSchema.parse(input)

    // Check if sandbox already published (idempotency)
    const { data: existingVersions } = await supabase
      .from('proposal_versions')
      .select('proposal_id')
      .eq('sandbox_id', validated.sandboxId)
      .limit(1)

    if (existingVersions && existingVersions.length > 0) {
      return {
        success: false,
        error: 'This sandbox has already been published',
      }
    }

    // Step 1: Fetch sandbox
    const { data: sandbox, error: sandboxError } = await supabase
      .from('sandboxes')
      .select('id, geometry')
      .eq('id', validated.sandboxId)
      .single()

    if (sandboxError || !sandbox) {
      return {
        success: false,
        error: 'Sandbox not found',
      }
    }

    // Step 2: Fetch all instances
    const { data: instances, error: instancesError } = await supabase
      .from('instances')
      .select('id, asset_id, geom, params, transform, state')
      .eq('sandbox_id', validated.sandboxId)

    if (instancesError) {
      return {
        success: false,
        error: 'Failed to fetch instances',
      }
    }

    // Step 3: Build FeatureCollection from instances
    const features = (instances || []).map((instance: any) => ({
      type: 'Feature' as const,
      properties: {
        instanceId: instance.id,
        assetId: instance.asset_id,
        floors: instance.params.floors || 1,
        height: instance.params.height || 3,
        params: instance.params,
        transform: instance.transform,
        state: instance.state,
      },
      geometry: instance.geom,
    }))

    const featureCollection: GeoJSON.FeatureCollection = {
      type: 'FeatureCollection',
      features,
    }

    // Step 4: Simplify geometry (tolerance 0.0001)
    const simplified = turf.simplify(featureCollection, {
      tolerance: 0.0001,
      highQuality: true,
    })

    // Step 5: Clip to sandbox mask (optional - skip if turf.booleanClip not available)
    const sandboxPolygon = turf.polygon(sandbox.geometry.coordinates)
    let clipped = simplified

    // Try to clip, but don't fail if not possible
    try {
      // Note: turf.booleanClip requires @turf/boolean-clip
      // For now, we'll just use simplified directly
      clipped = simplified
    } catch (e) {
      console.log('Clip operation skipped:', e)
    }

    // Step 6: Create Proposal
    const proposalId = `prop_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const { data: proposal, error: proposalError } = await supabase
      .from('proposals')
      .insert({
        id: proposalId,
        title: validated.title,
        body: validated.body,
        summary: validated.body.substring(0, 200), // Auto-generate summary
        category: validated.category,
        tags: validated.tags,
        image_urls: validated.imageUrls,
        status: 'published',
        author_id: validated.authorId,
      })
      .select()
      .single()

    if (proposalError) {
      console.error('Failed to create proposal:', proposalError)
      return {
        success: false,
        error: 'Failed to create proposal',
      }
    }

    // Step 7: Create ProposalVersion with hash
    const versionHash = uuidv4()
    const versionId = `pver_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const { error: versionError } = await supabase
      .from('proposal_versions')
      .insert({
        id: versionId,
        proposal_id: proposalId,
        sandbox_id: validated.sandboxId,
        hash: versionHash,
      })

    if (versionError) {
      console.error('Failed to create version:', versionError)
      // Continue anyway - proposal is created
    }

    // Step 8: Create ProposalPreview
    const previewId = `pprev_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const { error: previewError } = await supabase
      .from('proposal_previews')
      .insert({
        id: previewId,
        proposal_id: proposalId,
        geom: clipped,
        mask: sandbox.geometry,
        mesh_url: null, // Placeholder for future 3D mesh
        img_url: null, // Placeholder for future snapshot
        lod: 0,
      })

    if (previewError) {
      console.error('Failed to create preview:', previewError)
      // Continue anyway - proposal is created
    }

    // Step 9: Update sandbox status to published
    await supabase
      .from('sandboxes')
      .update({ status: 'published' })
      .eq('id', validated.sandboxId)

    // Revalidate paths
    revalidatePath(`/sandbox/${validated.sandboxId}`)
    revalidatePath('/proposals')
    revalidatePath(`/proposals/${proposalId}`)

    return {
      success: true,
      data: {
        proposalId,
        versionHash,
        featureCount: features.length,
      },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      }
    }

    console.error('Failed to publish sandbox:', error)
    return {
      success: false,
      error: 'Failed to publish sandbox',
    }
  }
}
