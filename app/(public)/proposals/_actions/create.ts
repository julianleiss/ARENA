// ARENA - Create Proposal Server Action
'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/app/lib/prisma'
import { safe } from '@/app/lib/safe-action'

// Zod schema for validation
const createProposalSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title too long'),
  description: z.string().min(1, 'Description is required'),
  authorId: z.string().min(1, 'Author ID is required'),
})

const _createProposal = async (formData: FormData) => {
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

  return { success: true, proposal }
}

export const createProposal = safe(_createProposal)
