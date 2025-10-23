// ARENA V1.0 - Proposal Comments API Endpoint
// GET /api/proposals/[id]/comments - Get all comments for a proposal
// POST /api/proposals/[id]/comments - Create a new comment

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/db'

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
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(
      {
        comments,
        count: comments.length,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error fetching comments:', error)
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    )
  }
}

// POST /api/proposals/[id]/comments - Create a new comment
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: proposalId } = await params
    const body = await request.json()
    const { userId, content } = body

    if (!userId || !content) {
      return NextResponse.json(
        { error: 'userId and content are required' },
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

    // Create the comment
    const comment = await prisma.comment.create({
      data: {
        proposalId,
        authorId: userId,
        body: content,
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    })

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId,
        action: 'comment',
        entity: 'proposal',
        entityId: proposalId,
        metadata: {
          commentId: comment.id,
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
