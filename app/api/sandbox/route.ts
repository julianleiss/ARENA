// ARENA - Sandbox API Routes
// Handle sandbox scene save/load operations

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/db'

// Scene JSON structure
interface SceneData {
  objects: Array<{
    id: string
    assetId: string
    position: [number, number, number]
    rotation: number
    scale: number
    color?: string
    height?: number
  }>
  camera?: {
    longitude: number
    latitude: number
    zoom: number
    pitch: number
    bearing: number
  }
  settings?: Record<string, unknown>
}

// GET: Load sandbox by proposalId
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const proposalId = searchParams.get('proposalId')

    if (!proposalId) {
      return NextResponse.json(
        { error: 'proposalId is required' },
        { status: 400 }
      )
    }

    console.log('[Sandbox API] Loading sandbox for proposal:', proposalId)

    // Find the most recent sandbox version for this proposal
    const latestVersion = await prisma.proposalVersion.findFirst({
      where: { proposalId },
      orderBy: { createdAt: 'desc' },
    })

    if (!latestVersion) {
      console.log('[Sandbox API] No sandbox found for proposal:', proposalId)
      return NextResponse.json({ exists: false, scene: null })
    }

    // Get the sandbox and its instances
    const sandbox = await prisma.sandbox.findUnique({
      where: { id: latestVersion.sandboxId },
      include: {
        instances: {
          include: {
            asset: true,
          },
        },
      },
    })

    if (!sandbox) {
      console.log('[Sandbox API] Sandbox not found:', latestVersion.sandboxId)
      return NextResponse.json({ exists: false, scene: null })
    }

    // Convert instances to scene format
    const scene: SceneData = {
      objects: sandbox.instances.map((instance) => {
        const geom = instance.geom as any
        return {
          id: instance.id,
          assetId: instance.assetId,
          position: geom && geom.type === 'Point'
            ? [...geom.coordinates, 0] as [number, number, number]
            : [0, 0, 0],
          rotation: (instance.transform as any)?.rotation || 0,
          scale: (instance.transform as any)?.scale || 1,
          color: (instance.params as any)?.color,
          height: (instance.params as any)?.height,
        }
      }),
      camera: undefined,
      settings: {},
    }

    console.log('[Sandbox API] Loaded sandbox with', scene.objects.length, 'objects')

    return NextResponse.json({
      exists: true,
      scene,
      sandboxId: latestVersion.sandboxId,
      versionId: latestVersion.id,
      createdAt: latestVersion.createdAt,
    })
  } catch (error) {
    console.error('[Sandbox API] Error loading sandbox:', error)
    return NextResponse.json(
      { error: 'Failed to load sandbox' },
      { status: 500 }
    )
  }
}

// POST: Save/update sandbox
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { proposalId, scene, thumbnail } = body

    if (!proposalId || !scene) {
      return NextResponse.json(
        { error: 'proposalId and scene are required' },
        { status: 400 }
      )
    }

    console.log('[Sandbox API] Saving sandbox for proposal:', proposalId, 'with', scene.objects?.length || 0, 'objects')

    // Validate scene structure
    if (!Array.isArray(scene.objects)) {
      return NextResponse.json(
        { error: 'Invalid scene format: objects must be an array' },
        { status: 400 }
      )
    }

    // Check if proposal exists
    const proposal = await prisma.proposal.findUnique({
      where: { id: proposalId },
    })

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      )
    }

    // Find existing sandbox or create new one
    const existingVersion = await prisma.proposalVersion.findFirst({
      where: { proposalId },
      orderBy: { createdAt: 'desc' },
    })

    let sandboxId: string
    let isNew = false

    if (existingVersion) {
      sandboxId = existingVersion.sandboxId
      console.log('[Sandbox API] Updating existing sandbox:', sandboxId)
    } else {
      // Create new sandbox with a simple polygon geometry
      const newSandbox = await prisma.sandbox.create({
        data: {
          geometry: {
            type: 'Polygon',
            coordinates: [[[0, 0], [0, 1], [1, 1], [1, 0], [0, 0]]],
          },
          status: 'draft',
        },
      })
      sandboxId = newSandbox.id
      isNew = true
      console.log('[Sandbox API] Created new sandbox:', sandboxId)
    }

    // Delete existing instances for this sandbox
    await prisma.instance.deleteMany({
      where: { sandboxId },
    })

    // Create new instances from scene objects
    if (scene.objects.length > 0) {
      await prisma.instance.createMany({
        data: scene.objects.map((obj: any) => ({
          sandboxId,
          assetId: obj.assetId,
          geom: {
            type: 'Point',
            coordinates: [obj.position[0], obj.position[1]],
          },
          params: {
            color: obj.color,
            height: obj.height || 10,
          },
          transform: {
            scale: obj.scale || 1,
            rotation: obj.rotation || 0,
          },
          state: 'added',
        })),
      })
    }

    // Create or update proposal version
    const versionHash = 'v' + Date.now().toString()

    if (isNew) {
      await prisma.proposalVersion.create({
        data: {
          proposalId,
          sandboxId,
          hash: versionHash,
        },
      })
    } else {
      // Update existing version hash
      await prisma.proposalVersion.updateMany({
        where: {
          proposalId,
          sandboxId,
        },
        data: {
          hash: versionHash,
        },
      })
    }

    console.log('[Sandbox API] Successfully saved', scene.objects.length, 'objects')

    return NextResponse.json(
      {
        success: true,
        sandboxId,
        objectCount: scene.objects.length,
        isNew,
      },
      { status: isNew ? 201 : 200 }
    )
  } catch (error) {
    console.error('[Sandbox API] Error saving sandbox:', error)
    return NextResponse.json(
      { error: 'Failed to save sandbox', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
