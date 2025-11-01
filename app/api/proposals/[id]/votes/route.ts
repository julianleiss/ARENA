import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: proposalId } = await params
    const { type } = await request.json()

    // Simple implementation: just count votes
    // In a real app, you'd track userId and prevent duplicate votes
    if (type === 'up') {
      // Create a vote (for now without userId)
      await prisma.vote.create({
        data: {
          proposalId,
          option: 'UP',
          userId: 'anonymous', // TODO: Get from session
          origin: 'web'
        }
      })
    } else if (type === 'remove') {
      // Remove the most recent vote for this proposal
      // In a real app, you'd delete the user's specific vote
      const lastVote = await prisma.vote.findFirst({
        where: { proposalId },
        orderBy: { createdAt: 'desc' }
      })
      if (lastVote) {
        await prisma.vote.delete({
          where: { id: lastVote.id }
        })
      }
    }

    // Return updated count
    const count = await prisma.vote.count({
      where: { proposalId }
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Error voting:', error)
    return NextResponse.json({ error: 'Failed to vote' }, { status: 500 })
  }
}
