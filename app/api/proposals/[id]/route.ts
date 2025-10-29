// ARENA V1.0 - Individual Proposal API Endpoint
// GET /api/proposals/[id] - Get a specific proposal
// PUT /api/proposals/[id] - Update a specific proposal
// DELETE /api/proposals/[id] - Delete a specific proposal

import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

// GET /api/proposals/[id] - Get a specific proposal with author and counts
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

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
        _count: {
          select: {
            votes: true,
            comments: true,
          },
        },
      },
    })

    if (!proposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(proposal, { status: 200 })
  } catch (error) {
    console.error('Error fetching proposal:', error)
    return NextResponse.json(
      { error: 'Failed to fetch proposal' },
      { status: 500 }
    )
  }
}

// PUT /api/proposals/[id] - Update a specific proposal
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const body = await request.json()

    // Extract fields that can be updated
    const { title, summary, body: proposalBody, geom, layer, status, tags } = body

    // Check if proposal exists
    const existingProposal = await prisma.proposal.findUnique({
      where: { id },
    })

    if (!existingProposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      )
    }

    // Update the proposal
    const updatedProposal = await prisma.proposal.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(summary !== undefined && { summary }),
        ...(proposalBody !== undefined && { body: proposalBody }),
        ...(geom && { geom }),
        ...(layer && { layer }),
        ...(status && { status }),
        ...(tags && { tags }),
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
        userId: existingProposal.authorId,
        action: 'update_proposal',
        entity: 'proposal',
        entityId: id,
        metadata: {
          changes: Object.keys(body),
        },
      },
    })

    return NextResponse.json(updatedProposal, { status: 200 })
  } catch (error) {
    console.error('Error updating proposal:', error)
    return NextResponse.json(
      { error: 'Failed to update proposal' },
      { status: 500 }
    )
  }
}

// DELETE /api/proposals/[id] - Delete a specific proposal
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    // Check if proposal exists
    const existingProposal = await prisma.proposal.findUnique({
      where: { id },
    })

    if (!existingProposal) {
      return NextResponse.json(
        { error: 'Proposal not found' },
        { status: 404 }
      )
    }

    // Delete the proposal (cascade will handle related records)
    await prisma.proposal.delete({
      where: { id },
    })

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        userId: existingProposal.authorId,
        action: 'delete_proposal',
        entity: 'proposal',
        entityId: id,
        metadata: {
          title: existingProposal.title,
        },
      },
    })

    return NextResponse.json(
      { message: 'Proposal deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Error deleting proposal:', error)
    return NextResponse.json(
      { error: 'Failed to delete proposal' },
      { status: 500 }
    )
  }
}
