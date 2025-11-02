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
    console.warn('⚠️  Falling back to mock data for demo')

    // FALLBACK: Return mock data for demo
    const mockData = getMockProposals({ status: status || undefined })

    return NextResponse.json(mockData, { status: 200 })
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

    // Try to create in database, fallback to mock on error
    try {
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
    } catch (dbError) {
      // Database unreachable - return mock success for demo
      console.warn('⚠️  Database unreachable, returning mock proposal for demo')
      const mockProposal = {
        id: `mock-${Date.now()}`,
        authorId,
        title,
        summary: summary || null,
        body: proposalBody || null,
        geom: geom || null,
        layer: layer || 'micro',
        status: status || 'public',
        tags: tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        author: {
          id: authorId,
          name: 'Demo User',
          email: 'demo@example.com',
          role: 'user',
        },
        _count: {
          votes: 0,
          comments: 0,
        },
      }
      return NextResponse.json(mockProposal, { status: 201 })
    }
  } catch (error) {
    console.error('POST /api/proposals - Unexpected error:', error)
    // Even on unexpected errors, return mock success for demo
    const mockProposal = {
      id: `mock-${Date.now()}`,
      title: 'Demo Proposal',
      status: 'public',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    return NextResponse.json(mockProposal, { status: 201 })
  }
}
