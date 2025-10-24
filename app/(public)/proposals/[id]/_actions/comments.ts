// ARENA - Comments Server Actions (Iteration 6)
'use server'

import { supabase } from '@/app/lib/supabase-client'
import { z } from 'zod'
import { revalidatePath } from 'next/cache'

// Validation schemas
const CreateCommentSchema = z.object({
  proposalId: z.string(),
  authorId: z.string(),
  body: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment too long (max 2000 characters)'),
})

export type Comment = {
  id: string
  proposal_id: string
  author_id: string
  body: string
  created_at: string
  author?: {
    name: string | null
    email: string
  }
}

// POST comment
export async function createComment(input: unknown) {
  try {
    const validated = CreateCommentSchema.parse(input)

    const commentId = `com_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    const { data, error } = await supabase
      .from('comments')
      .insert({
        id: commentId,
        proposal_id: validated.proposalId,
        author_id: validated.authorId,
        body: validated.body,
      })
      .select()
      .single()

    if (error) {
      console.error('Failed to create comment:', error)
      return {
        success: false,
        error: 'Failed to post comment',
      }
    }

    revalidatePath(`/proposals/${validated.proposalId}`)

    return {
      success: true,
      data,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.issues[0].message,
      }
    }

    console.error('Failed to create comment:', error)
    return {
      success: false,
      error: 'Failed to post comment',
    }
  }
}

// GET comments by proposal (DESC by createdAt)
export async function getCommentsByProposal(proposalId: string) {
  try {
    const { data, error } = await supabase
      .from('comments')
      .select(
        `
        id,
        proposal_id,
        author_id,
        body,
        created_at,
        author:users!author_id (
          name,
          email
        )
      `
      )
      .eq('proposal_id', proposalId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Failed to fetch comments:', error)
      return []
    }

    return (data || []) as Comment[]
  } catch (error) {
    console.error('Failed to fetch comments:', error)
    return []
  }
}
