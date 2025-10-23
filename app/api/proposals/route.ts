// ARENA V1.0 - Proposals API Endpoint
// GET /api/proposals - Returns all proposals (with optional filtering)
// POST /api/proposals - Create a new proposal

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/db'

// GET /api/proposals - Get all proposals with optional filtering
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const layer = searchParams.get('layer')

    // Build filter conditions
    const where: any = {}
    if (status && status !== 'all') {
      where.status = status
    }
    if (layer) {
      where.layer = layer
    }

    // Fetch proposals with timeout
    const proposals = await Promise.race([
      prisma.proposal.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          _count: {
            select: {
              votes: true,
              comments: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('DB timeout')), 5000)
      ),
    ])

    return NextResponse.json(
      {
        proposals,
        count: proposals.length,
        source: 'database',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching proposals from DB:', error)

    return NextResponse.json(
      { error: 'Failed to fetch proposals', proposals: [], count: 0 },
      { status: 500 }
    )
  }
}

// POST /api/proposals - Create a new proposal
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    console.log('POST /api/proposals - Received body:', JSON.stringify(body, null, 2))

    const {
      authorId,
      title,
      summary,
      body: proposalBody,
      geom,
      layer,
      status,
      tags,
      images,
      feature, // OSM feature data from frontend
    } = body

    // Validate required fields
    if (!authorId || !title) {
      console.error('POST /api/proposals - Validation failed: missing authorId or title')
      return NextResponse.json(
        { error: 'Missing required fields: authorId and title are required' },
        { status: 400 }
      )
    }

    // Validate geom format if provided
    if (geom && geom.type === 'Point') {
      if (!Array.isArray(geom.coordinates) || geom.coordinates.length !== 2) {
        console.error('POST /api/proposals - Invalid geom format:', geom)
        return NextResponse.json(
          { error: 'Invalid geom format: Point must have [lng, lat] coordinates' },
          { status: 400 }
        )
      }
    }

    // Create the proposal data object
    const proposalData: any = {
      authorId,
      title,
      summary: summary || null,
      body: proposalBody || null,
      geom: geom || null,
      layer: layer || 'micro',
      status: status || 'draft',
      tags: tags || [],
      // OSM Feature Data
      osmType: feature?.type || null,
      osmId: feature?.osmId || null,
      osmTags: feature?.properties || null,
      featureName: feature?.name || null,
    }

    // Log if OSM feature is linked
    if (feature) {
      console.log('📍 Feature OSM vinculado:', feature.name || 'Sin nombre', feature.osmId || 'Sin ID')
    }

    // Only add images if they exist and the field is available in schema
    if (images && Array.isArray(images) && images.length > 0) {
      try {
        proposalData.images = images
      } catch (e) {
        console.warn('Images field not available in schema, skipping')
      }
    }

    console.log('POST /api/proposals - Creating proposal with data:', JSON.stringify(proposalData, null, 2))

    // Create the proposal
    const newProposal = await prisma.proposal.create({
      data: proposalData,
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        _count: {
          select: {
            votes: true,
            comments: true,
          },
        },
      },
    })

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId: authorId,
        action: 'create_proposal',
        entity: 'proposal',
        entityId: newProposal.id,
        metadata: {
          title: newProposal.title,
          status: newProposal.status,
        },
      },
    })

    console.log('POST /api/proposals - Proposal created successfully:', newProposal.id)
    return NextResponse.json(newProposal, { status: 201 })
  } catch (error) {
    console.error('POST /api/proposals - Error creating proposal:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to create proposal', details: errorMessage },
      { status: 500 }
    )
  }
}
