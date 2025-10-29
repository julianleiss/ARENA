// ARENA - Create Sandbox Server Action
'use server'

import { supabase } from '@/app/lib/supabase-client'
import { z } from 'zod'
import { Polygon } from '@/app/lib/zod-geo'
import { redirect } from 'next/navigation'
import { safe } from '@/app/lib/safe-action'

const createSandboxSchema = z.object({
  geometry: Polygon,
})

const _createSandbox = async (geometry: unknown) => {
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
    throw new Error('Failed to create sandbox')
  }

  // Return the sandbox ID so the component can handle redirect
  return { id }
}

export const createSandbox = safe(_createSandbox)
