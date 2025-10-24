// ARENA - Sandbox Test Component (Iteration 2 - Lite)
'use client'

import { useState } from 'react'
import { createSandbox } from '../_actions/createSandbox'

export default function SandboxTest() {
  const [loading, setLoading] = useState(false)

  async function handleCreateTestSandbox() {
    setLoading(true)

    // Test polygon (rectangle in Buenos Aires Núñez area)
    const testPolygon = {
      type: 'Polygon' as const,
      coordinates: [
        [
          [-58.465, -34.540],
          [-58.455, -34.540],
          [-58.455, -34.550],
          [-58.465, -34.550],
          [-58.465, -34.540], // Close the ring
        ],
      ],
    }

    try {
      await createSandbox(testPolygon)
      // If redirect() is called in server action, this line won't execute
      // The redirect happens automatically on the client
    } catch (error) {
      // Only catch actual errors, not NEXT_REDIRECT
      console.error('Failed to create sandbox:', error)
      alert('Failed to create sandbox')
      setLoading(false)
    }
  }

  return (
    <div className="absolute top-24 right-6 z-30 bg-white/95 backdrop-blur-sm border border-indigo-300 rounded-xl shadow-lg p-4 max-w-xs">
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-indigo-900 mb-1">
          🧪 Sandbox Test (i2-lite)
        </h3>
        <p className="text-xs text-indigo-700">
          Click to create a test sandbox area
        </p>
      </div>
      <button
        onClick={handleCreateTestSandbox}
        disabled={loading}
        className="w-full px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white text-sm font-medium rounded-lg transition-colors"
      >
        {loading ? 'Creating...' : 'Create Test Sandbox'}
      </button>
      <p className="text-xs text-gray-500 mt-2">
        Will create polygon in Núñez area
      </p>
    </div>
  )
}
