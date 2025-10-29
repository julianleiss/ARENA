// ARENA V1.0 - Proposal Votes API Endpoint
// POST /api/proposals/[id]/votes - Vote for a proposal
// DELETE /api/proposals/[id]/votes - Remove vote from a proposal

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

// POST /api/proposals/[id]/votes - Vote for a proposal
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: proposalId } = await params
    const body = await request.json()
    const { userId, origin = 'web' } = body

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
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

    // Check if user already voted
    const existingVote = await prisma.vote.findFirst({
      where: {
        proposalId,
        userId,
      },
    })

    if (existingVote) {
      return NextResponse.json(
        { error: 'User has already voted for this proposal' },
        { status: 409 }
      )
    }

    // Create the vote
    const vote = await prisma.vote.create({
      data: {
        proposalId,
        userId,
        option: 'support', // Default vote option
        origin,
      },
    })

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'vote',
        entity: 'proposal',
        entityId: proposalId,
        metadata: {
          origin,
        },
      },
    })

    // Get updated vote count
    const voteCount = await prisma.vote.count({
      where: { proposalId },
    })

    return NextResponse.json(
      {
        vote,
        voteCount,
        message: 'Vote recorded successfully',
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating vote:', error)
    return NextResponse.json(
      { error: 'Failed to record vote' },
      { status: 500 }
    )
  }
}

// DELETE /api/proposals/[id]/votes - Remove vote from a proposal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: proposalId } = await params
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')

    if (!userId) {
      return NextResponse.json(
        { error: 'userId query parameter is required' },
        { status: 400 }
      )
    }

    // Find the vote
    const vote = await prisma.vote.findFirst({
      where: {
        proposalId,
        userId,
      },
    })

    if (!vote) {
      return NextResponse.json(
        { error: 'Vote not found' },
        { status: 404 }
      )
    }

    // Delete the vote
    await prisma.vote.delete({
      where: { id: vote.id },
    })

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'unvote',
        entity: 'proposal',
        entityId: proposalId,
        metadata: {},
      },
    })

    // Get updated vote count
    const voteCount = await prisma.vote.count({
      where: { proposalId },
    })

    return NextResponse.json(
      {
        voteCount,
        message: 'Vote removed successfully',
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error removing vote:', error)
    return NextResponse.json(
      { error: 'Failed to remove vote' },
      { status: 500 }
    )
  }
}
