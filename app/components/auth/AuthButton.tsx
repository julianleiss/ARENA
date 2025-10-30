'use client'

// ARENA - Authentication Button
// Handles sign in/out with Supabase email OTP
import { useEffect, useState } from 'react'
import { supabase } from '@/app/lib/supabase'
import type { User } from '@supabase/supabase-js'

export default function AuthButton() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showEmailInput, setShowEmailInput] = useState(false)
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setMessage('')

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: window.location.origin,
        },
      })

      if (error) throw error

      setMessage('Check your email for the login link!')
      setEmail('')
      setShowEmailInput(false)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to send login link')
    } finally {
      setLoading(false)
    }
  }

  const handleSignOut = async () => {
    setLoading(true)
    await supabase.auth.signOut()
    setLoading(false)
  }

  if (loading && !user) {
    return (
      <div className="text-sm text-gray-600">
        Loading...
      </div>
    )
  }

  if (user) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-700">
          {user.email}
        </span>
        <button
          onClick={handleSignOut}
          disabled={loading}
          className="px-3 py-1.5 text-sm bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400 rounded transition-colors"
        >
          Sign Out
        </button>
      </div>
    )
  }

  if (showEmailInput) {
    return (
      <form onSubmit={handleSignIn} className="flex items-center gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="your@email.com"
          required
          className="px-3 py-1.5 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white rounded transition-colors"
        >
          {loading ? 'Sending...' : 'Send Link'}
        </button>
        <button
          type="button"
          onClick={() => setShowEmailInput(false)}
          className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
        >
          Cancel
        </button>
      </form>
    )
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        onClick={() => setShowEmailInput(true)}
        className="px-3 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
      >
        Sign In
      </button>
      {message && (
        <p className="text-xs text-green-600">
          {message}
        </p>
      )}
    </div>
  )
}
