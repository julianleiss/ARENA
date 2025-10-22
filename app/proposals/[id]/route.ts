// ARENA V1.0 - Single Proposal API
// GET /api/proposals/[id] - Get one proposal
// PUT /api/proposals/[id] - Update proposal
// DELETE /api/proposals/[id] - Delete/archive proposal

import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/db'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        votes: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        comments: {
          include: {
            author: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: {
            createdAt: 'desc',
          },
        },
        metrics: true,
      },
    })

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(proposal)
  } catch (error) {
    console.error('Error fetching proposal:', error)
    return NextResponse.json(
      { error: 'Failed to fetch proposal' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const { title, summary, body: bodyText, geom, tags, status } = body

    const proposal = await prisma.proposal.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(summary !== undefined && { summary }),
        ...(bodyText !== undefined && { body: bodyText }),
        ...(geom !== undefined && { geom }),
        ...(tags !== undefined && { tags }),
        ...(status && { status }),
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: proposal.authorId,
        action: 'update_proposal',
        entity: 'proposal',
        entityId: proposal.id,
        metadata: {
          title: proposal.title,
          status: proposal.status,
        },
      },
    })

    return NextResponse.json(proposal)
  } catch (error) {
    console.error('Error updating proposal:', error)
    return NextResponse.json(
      { error: 'Failed to update proposal' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params
    
    // Soft delete: archive instead of delete
    const proposal = await prisma.proposal.update({
      where: { id },
      data: {
        status: 'archived',
      },
    })

    // Create audit log
    await prisma.auditLog.create({
      data: {
        userId: proposal.authorId,
        action: 'archive_proposal',
        entity: 'proposal',
        entityId: proposal.id,
        metadata: {
          title: proposal.title,
        },
      },
    })

    return NextResponse.json({ success: true, proposal })
  } catch (error) {
    console.error('Error archiving proposal:', error)
    return NextResponse.json(
      { error: 'Failed to archive proposal' },
      { status: 500 }
    )
  }
}