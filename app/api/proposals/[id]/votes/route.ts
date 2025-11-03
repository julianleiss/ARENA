// ARENA V1.0 - Proposal Votes API Endpoint
// POST /api/proposals/[id]/votes - Toggle vote on a proposal

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/db'
import { enforce } from '@/app/lib/rate-limit'
import { nanoid } from 'nanoid'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // Rate limiting: 60 requests per 5 minutes
    const rateLimitResult = await enforce(request, 'votes:create', 60, 300000)
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
    const { type } = await request.json()

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

    // Get or create temporary user session ID from request
    // In production, this would use proper authentication
    const userSessionId = request.cookies.get('arena_session')?.value || `temp-${nanoid()}`

    // Find or create user for this session
    let user = await prisma.user.findFirst({
      where: { id: userSessionId }
    })

    if (!user) {
      // Create temporary user for this session
      user = await prisma.user.create({
        data: {
          id: userSessionId,
          email: `${userSessionId}@temp.arena`,
          name: `Usuario ${userSessionId.slice(-6)}`,
          role: 'citizen'
        }
      })
    }

    // Find existing vote from this user
    const existingVote = await prisma.vote.findUnique({
      where: {
        proposalId_userId: {
          proposalId,
          userId: user.id
        }
      }
    })

    if (type === 'up' && !existingVote) {
      // Create new vote
      await prisma.vote.create({
        data: {
          proposalId,
          userId: user.id,
          option: 'UP',
          origin: 'web'
        }
      })
    } else if (type === 'remove' && existingVote) {
      // Remove existing vote
      await prisma.vote.delete({
        where: {
          id: existingVote.id
        }
      })
    }

    // Return updated count
    const count = await prisma.vote.count({
      where: { proposalId }
    })

    // Set session cookie
    const response = NextResponse.json({ count })
    response.cookies.set('arena_session', userSessionId, {
      maxAge: 60 * 60 * 24 * 365, // 1 year
      httpOnly: true,
      sameSite: 'lax',
      path: '/'
    })

    return response
  } catch (error) {
    console.error('Error voting:', error)

    // Fallback for demo mode
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️  Demo mode: Returning mock vote count')
      return NextResponse.json({ count: Math.floor(Math.random() * 50) })
    }

    return NextResponse.json(
      { error: 'Failed to vote' },
      { status: 500 }
    )
  }
}
