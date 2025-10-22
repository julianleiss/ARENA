// ARENA V1.0 - Supabase Auth Helpers
// Helper functions for authentication

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

/**
 * Get the current authenticated user
 * Returns null if not authenticated
 */
export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return null
  }
  
  return user
}

/**
 * Sign in with magic link
 */
export async function signInWithMagicLink(email: string) {
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  })
  
  if (error) {
    throw error
  }
  
  return data
}

/**
 * Sign out
 */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  
  if (error) {
    throw error
  }
}
