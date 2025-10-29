// ARENA V1.0 - Asset Upload API Endpoint (Iteration 7)
// POST /api/assets/upload - Upload glTF/GLB model to Supabase storage

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import prisma from '@/app/lib/db'

const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10MB

// Initialize Supabase client with service role for storage operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const name = formData.get('name') as string

    // Validation
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Asset name is required' },
        { status: 400 }
      )
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size exceeds 10MB limit (${(file.size / 1024 / 1024).toFixed(2)}MB)` },
        { status: 400 }
      )
    }

    // Check file extension
    const fileName = file.name.toLowerCase()
    const ext = fileName.split('.').pop()
    if (ext !== 'glb' && ext !== 'gltf') {
      return NextResponse.json(
        { error: 'Only .glb and .gltf files are allowed' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const randomStr = Math.random().toString(36).substring(2, 9)
    const storagePath = `models/${timestamp}_${randomStr}.${ext}`

    // Convert File to ArrayBuffer for upload
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to Supabase Storage
    const { data: uploadData, error: uploadError } = await supabaseAdmin.storage
      .from('arena-models')
      .upload(storagePath, buffer, {
        contentType: file.type || (ext === 'glb' ? 'model/gltf-binary' : 'model/gltf+json'),
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Supabase upload error:', uploadError)
      return NextResponse.json(
        { error: `Storage upload failed: ${uploadError.message}` },
        { status: 500 }
      )
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from('arena-models')
      .getPublicUrl(storagePath)

    const modelUrl = urlData.publicUrl

    // Create Asset in database
    const asset = await prisma.asset.create({
      data: {
        name: name.trim(),
        kind: 'custom',
        modelUrl,
        defaultParams: {
          scale: 1,
          height: 10, // Default height for custom models
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        assetId: asset.id,
        modelUrl,
        message: `Asset "${name}" created successfully`,
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error uploading asset:', error)
    return NextResponse.json(
      { error: 'Failed to upload asset' },
      { status: 500 }
    )
  }
}
