// ARENA - Instance CRUD Server Actions
'use server'

import { supabase } from '@/app/lib/supabase-client'
import { z } from 'zod'
import { GeometrySchema } from '@/app/lib/zod-geo'
import { revalidatePath } from 'next/cache'

// Validation schemas
const TransformSchema = z.object({
  scale: z.union([z.number(), z.tuple([z.number(), z.number(), z.number()])]).optional(),
  rotation: z.union([z.number(), z.tuple([z.number(), z.number(), z.number()])]).optional(),
})

const CreateInstanceSchema = z.object({
  sandboxId: z.string(),
  assetId: z.string(),
  geom: GeometrySchema,
  params: z.record(z.any()).optional().default({}),
  transform: TransformSchema.optional().default({}),
})

const UpdateInstanceSchema = z.object({
  id: z.string(),
  params: z.record(z.any()).optional(),
  transform: TransformSchema.optional(),
  geom: GeometrySchema.optional(),
})

const DeleteInstanceSchema = z.object({
  id: z.string(),
})

// Create instance
export async function createInstance(input: unknown) {
  try {
    const validated = CreateInstanceSchema.parse(input)

    const id = `inst_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const { data, error } = await supabase
      .from('instances')
      .insert({
        id,
        sandbox_id: validated.sandboxId,
        asset_id: validated.assetId,
        geom: validated.geom,
        params: validated.params,
        transform: validated.transform,
        state: 'added',
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create instance:', error)
      return {
        success: false,
        error: 'Failed to create instance',
      }
    }

    revalidatePath(`/sandbox/${validated.sandboxId}`)

    return {
      success: true,
      data: {
        id: data.id,
        sandboxId: data.sandbox_id,
        assetId: data.asset_id,
        geom: data.geom,
        params: data.params,
        transform: data.transform,
        state: data.state,
      },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      }
    }

    console.error('Failed to create instance:', error)
    return {
      success: false,
      error: 'Failed to create instance',
    }
  }
}

// Update instance
export async function updateInstance(input: unknown) {
  try {
    const validated = UpdateInstanceSchema.parse(input)

    const updates: Record<string, any> = {
      state: 'modified',
    }

    if (validated.params !== undefined) {
      updates.params = validated.params
    }
    if (validated.transform !== undefined) {
      updates.transform = validated.transform
    }
    if (validated.geom !== undefined) {
      updates.geom = validated.geom
    }

    const { data, error } = await supabase
      .from('instances')
      .update(updates)
      .eq('id', validated.id)
      .select('sandbox_id')
      .single()

    if (error) {
      console.error('Failed to update instance:', error)
      return {
        success: false,
        error: 'Failed to update instance',
      }
    }

    revalidatePath(`/sandbox/${data.sandbox_id}`)

    return {
      success: true,
      data: { id: validated.id },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      }
    }

    console.error('Failed to update instance:', error)
    return {
      success: false,
      error: 'Failed to update instance',
    }
  }
}

// Delete instance
export async function deleteInstance(input: unknown) {
  try {
    const validated = DeleteInstanceSchema.parse(input)

    // Get sandbox_id before deleting
    const { data: instance } = await supabase
      .from('instances')
      .select('sandbox_id')
      .eq('id', validated.id)
      .single()

    const { error } = await supabase
      .from('instances')
      .delete()
      .eq('id', validated.id)

    if (error) {
      console.error('Failed to delete instance:', error)
      return {
        success: false,
        error: 'Failed to delete instance',
      }
    }

    if (instance) {
      revalidatePath(`/sandbox/${instance.sandbox_id}`)
    }

    return {
      success: true,
      data: { id: validated.id },
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      }
    }

    console.error('Failed to delete instance:', error)
    return {
      success: false,
      error: 'Failed to delete instance',
    }
  }
}

// Get all instances for a sandbox
export async function getInstances(sandboxId: string) {
  try {
    const { data, error } = await supabase
      .from('instances')
      .select('id, sandbox_id, asset_id, geom, params, transform, state')
      .eq('sandbox_id', sandboxId)
      .order('id', { ascending: true })

    if (error) {
      console.error('Failed to fetch instances:', error)
      return {
        success: false,
        error: 'Failed to fetch instances',
        data: [],
      }
    }

    return {
      success: true,
      data: data.map((instance) => ({
        id: instance.id,
        sandboxId: instance.sandbox_id,
        assetId: instance.asset_id,
        geom: instance.geom,
        params: instance.params,
        transform: instance.transform,
        state: instance.state,
      })),
    }
  } catch (error) {
    console.error('Failed to fetch instances:', error)
    return {
      success: false,
      error: 'Failed to fetch instances',
      data: [],
    }
  }
}

// Get all assets
export async function getAssets() {
  try {
    const { data, error } = await supabase
      .from('assets')
      .select('id, name, kind, model_url, default_params')
      .order('name', { ascending: true })

    if (error) {
      console.error('Failed to fetch assets:', error)
      return {
        success: false,
        error: 'Failed to fetch assets',
        data: [],
      }
    }

    return {
      success: true,
      data: data.map((asset) => ({
        id: asset.id,
        name: asset.name,
        kind: asset.kind,
        modelUrl: asset.model_url,
        defaultParams: asset.default_params,
      })),
    }
  } catch (error) {
    console.error('Failed to fetch assets:', error)
    return {
      success: false,
      error: 'Failed to fetch assets',
      data: [],
    }
  }
}
