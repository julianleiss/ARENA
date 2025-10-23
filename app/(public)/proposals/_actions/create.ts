// ARENA - Create Proposal Server Action
'use server'

import { PrismaClient } from '@prisma/client'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

const prisma = new PrismaClient()

// Zod schema for validation
const createProposalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required'),
  authorId: z.string().min(1, 'Author ID is required'),
})

export async function createProposal(formData: FormData) {
  try {
    // Parse and validate form data
    const rawData = {
      title: formData.get('title'),
      description: formData.get('description'),
      authorId: formData.get('authorId'),
    }

    const validatedData = createProposalSchema.parse(rawData)

    // Create proposal with status="published"
    const proposal = await prisma.proposal.create({
      data: {
        title: validatedData.title,
        description: validatedData.description,
        authorId: validatedData.authorId,
        status: 'published',
      },
    })

    // Revalidate proposals page to show new proposal
    revalidatePath('/proposals')

    return {
      success: true,
      proposal,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      }
    }

    console.error('Failed to create proposal:', error)
    return {
      success: false,
      error: 'Failed to create proposal',
    }
  } finally {
    await prisma.$disconnect()
  }
}
