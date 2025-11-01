// ARENA V1.0 - Proposal Comments API Endpoint
// GET /api/proposals/[id]/comments - Get all comments for a proposal
// POST /api/proposals/[id]/comments - Create a new comment

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/db'
import { enforce } from '@/app/lib/rate-limit'
import { getMockComments, getMockProposal } from '@/app/lib/mock-data'

// GET /api/proposals/[id]/comments - Get all comments for a proposal
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: proposalId } = await params

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

    // Fetch comments with author info
    const comments = await prisma.comment.findMany({
      where: {
        proposalId,
      },
      include: {
        author: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(comments, { status: 200 })
  } catch (error) {
    console.error('Error fetching comments:', error)
    console.warn('⚠️  Falling back to mock comments for demo')

    // FALLBACK: Check if proposal exists in mock data
    const { id: proposalId } = await params
    const mockProposal = getMockProposal(proposalId)

    if (!mockProposal) {
      return NextResponse.json([], { status: 200 })
    }

    // Return mock comments
    const mockComments = getMockComments(proposalId)
    return NextResponse.json(mockComments, { status: 200 })
  }
}

// POST /api/proposals/[id]/comments - Create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting: 60 requests per 5 minutes
    const rateLimitResult = await enforce(request, 'comments:create', 60, 300000)
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

    const { id: proposalId } = await params
    const body = await request.json()
    const { text, authorName } = body

    if (!text || !authorName) {
      return NextResponse.json(
        { error: 'text and authorName are required' },
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

    // Find or create user with this name
    let user = await prisma.user.findFirst({
      where: { name: authorName }
    })

    if (!user) {
      // Create a temporary user
      const timestamp = new Date().getTime()
      const random = Math.random().toString(36).substring(7)
      user = await prisma.user.create({
        data: {
          id: `temp-${timestamp}-${random}`,
          email: `${authorName.toLowerCase().replace(/\s+/g, '')}@temp.arena`,
          name: authorName,
          role: 'CITIZEN'
        }
      })
    }

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        proposalId,
        authorId: user.id,
        body: text,
      },
      include: {
        author: {
          select: {
            name: true,
          },
        },
      },
    })

    return NextResponse.json(comment, { status: 201 })
  } catch (error) {
    console.error('Error creating comment:', error)
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    )
  }
}
