// ARENA V1.0 - Proposals API Endpoint
// GET /api/proposals - Returns all proposals (with optional filtering)
// POST /api/proposals - Create a new proposal

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/db'
import { enforce } from '@/app/lib/rate-limit'
import { getMockProposals } from '@/app/lib/mock-data'

// GET /api/proposals - Get all proposals with optional filtering
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status')
  const layer = searchParams.get('layer')

  try {
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

    console.log(`✅ Fetched ${proposals.length} proposals from database`)

    return NextResponse.json(
      {
        proposals,
        count: proposals.length,
        source: 'database',
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ Error fetching proposals from DB:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      stack: error?.stack,
      name: error?.name,
    })

    // Return detailed error
    return NextResponse.json(
      {
        proposals: [],
        count: 0,
        source: 'error',
        error: error?.message || 'Unknown error',
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      },
      { status: 500 }
    )
  }
}

// POST /api/proposals - Create a new proposal
export async function POST(request: NextRequest) {
  try {
    // Rate limiting: 60 requests per 5 minutes
    const rateLimitResult = await enforce(request, 'proposals:create', 60, 300000)
    if (!rateLimitResult.allowed) {
      const retryAfterSeconds = Math.ceil(rateLimitResult.retryAfterMs / 1000)
      return NextResponse.json(
        { error: 'Too many requests. Please try again later.' },
        {
          status: 429,
          headers: {
            'Retry-After': retryAfterSeconds.toString(),
          },
        }
      )
    }

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
    if (!authorId) {
      console.error('POST /api/proposals - Validation failed: missing authorId')
      console.error('Received body keys:', Object.keys(body))
      return NextResponse.json(
        { error: 'Missing required field: authorId' },
        { status: 400 }
      )
    }

    if (!title) {
      console.error('POST /api/proposals - Validation failed: missing title')
      return NextResponse.json(
        { error: 'Missing required field: title' },
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
      description: proposalBody || summary || title, // Required field: use body, fallback to summary or title
      summary: summary || null,
      body: proposalBody || null,
      geom: geom || null,
      layer: layer || 'micro',
      status: status || 'public',
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

    // Try to create in database
    try {
      // Create or get temp user if using temp ID
      if (authorId.startsWith('temp-')) {
        await prisma.user.upsert({
          where: { id: authorId },
          update: {},
          create: {
            id: authorId,
            email: `${authorId}@temp.arena`,
            name: 'Usuario Temporal',
            role: 'citizen',
          },
        })
        console.log('✅ Created/found temp user:', authorId)
      }

      // Create the proposal
      const newProposal = await prisma.proposal.create({
        data: proposalData,
        include: {
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
    } catch (dbError: any) {
      // Database error - return actual error with details
      console.error('❌ Database error creating proposal:', {
        message: dbError?.message,
        code: dbError?.code,
        details: dbError?.details,
        hint: dbError?.hint,
        stack: dbError?.stack,
        name: dbError?.name,
      })
      return NextResponse.json(
        {
          error: 'Database error creating proposal',
          message: dbError?.message,
          code: dbError?.code,
          details: dbError?.details,
          hint: dbError?.hint,
        },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('❌ POST /api/proposals - Unexpected error:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint,
      stack: error?.stack,
      name: error?.name,
    })
    return NextResponse.json(
      {
        error: 'Failed to create proposal',
        message: error?.message,
        code: error?.code,
        details: error?.details,
        hint: error?.hint,
      },
      { status: 500 }
    )
  }
}
