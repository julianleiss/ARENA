// ARENA - Create Sandbox Server Action
'use server'

import { supabase } from '@/app/lib/supabase-client'
import { z } from 'zod'
import { PolygonSchema } from '@/app/lib/zod-geo'
import { redirect } from 'next/navigation'

const createSandboxSchema = z.object({
  geometry: PolygonSchema,
})

export async function createSandbox(geometry: unknown) {
  try {
    // Validate geometry
    const validatedData = createSandboxSchema.parse({ geometry })

    // Generate cuid-like ID (simplified)
    const id = `sb_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Insert sandbox via Supabase REST API
    const { data, error } = await supabase
      .from('sandboxes')
      .insert({
        id,
        geometry: validatedData.geometry,
        status: 'draft',
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create sandbox:', error)
      return {
        success: false,
        error: 'Failed to create sandbox',
      }
    }

    // Redirect to sandbox page
    redirect(`/sandbox/${id}`)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      }
    }

    console.error('Failed to create sandbox:', error)
    return {
      success: false,
      error: 'Failed to create sandbox',
    }
  }
}
