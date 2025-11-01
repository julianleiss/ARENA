'use client'

import { useState, useEffect } from 'react'

interface VoteButtonProps {
  proposalId: string
  initialCount: number
}

export function VoteButton({ proposalId, initialCount }: VoteButtonProps) {
  const [count, setCount] = useState(initialCount)
  const [voted, setVoted] = useState(false)
  const [loading, setLoading] = useState(false)

  // Check if user has voted (localStorage for now)
  useEffect(() => {
    const votes = JSON.parse(localStorage.getItem('userVotes') || '[]')
    setVoted(votes.includes(proposalId))
  }, [proposalId])

  const handleVote = async () => {
    if (loading) return

    setLoading(true)
    try {
      const res = await fetch(`/api/proposals/${proposalId}/votes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: voted ? 'remove' : 'up' })
      })

      if (res.ok) {
        const data = await res.json()
        setCount(data.count)

        // Update voted state
        const newVoted = !voted
        setVoted(newVoted)

        // Store in localStorage
        const votes = JSON.parse(localStorage.getItem('userVotes') || '[]')
        if (newVoted) {
          localStorage.setItem('userVotes', JSON.stringify([...votes, proposalId]))
        } else {
          localStorage.setItem('userVotes', JSON.stringify(votes.filter((id: string) => id !== proposalId)))
        }
      }
    } catch (error) {
      console.error('Error voting:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleVote}
      disabled={loading}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all
        ${voted
          ? 'bg-red-500 text-white hover:bg-red-600'
          : 'bg-gray-100 text-gray-700 hover:bg-red-50 hover:text-red-600'
        }
        ${loading ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105'}`}
    >
      <span className="text-lg">{voted ? '❤️' : '🤍'}</span>
      <span className="font-bold">{count}</span>
    </button>
  )
}
