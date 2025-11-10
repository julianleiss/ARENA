// ARENA - 3D Sandbox Editor (Proposal Viewer/Editor)
import SandboxClient from './_components/SandboxClient'
import SandboxWrapper from './_components/SandboxWrapper'

export const dynamic = 'force-dynamic'

async function getProposal(id: string) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/proposals/${id}`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    if (!response.ok) {
      console.error(`Failed to fetch proposal ${id}:`, response.status)
      return null
    }

    const proposal = await response.json()
    console.log('📋 Fetched proposal:', { id: proposal.id, title: proposal.title, hasGeom: !!proposal.geom })
    return proposal
  } catch (error) {
    console.error('Error fetching proposal:', error)
    return null
  }
}

export default async function SandboxPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params

  console.log('🎨 Sandbox Page - Loading proposal:', id)

  const proposal = await getProposal(id)

  // Use mock data if proposal not found (for testing)
  const mockProposal = {
    id: id,
    title: 'Mock Proposal - 3D Sandbox Test',
    status: 'draft',
    geom: {
      type: 'Point',
      coordinates: [-58.46, -34.545], // Buenos Aires Núñez
    },
  }

  const displayProposal = proposal || mockProposal
  const isMock = !proposal

  if (isMock) {
    console.warn('⚠️ Using mock proposal data for testing - database not connected')
  }

  // Extract coordinates from geom
  let centerLng = -58.46 // Default: Buenos Aires Núñez
  let centerLat = -34.545

  if (displayProposal.geom) {
    if (displayProposal.geom.type === 'Point') {
      [centerLng, centerLat] = displayProposal.geom.coordinates
    } else if (displayProposal.geom.type === 'Polygon') {
      // Calculate centroid
      const coords = displayProposal.geom.coordinates[0]
      centerLng = coords.reduce((sum: number, p: number[]) => sum + p[0], 0) / coords.length
      centerLat = coords.reduce((sum: number, p: number[]) => sum + p[1], 0) / coords.length
    }
  }

  console.log('📍 Sandbox center:', { lng: centerLng, lat: centerLat })

  return (
    <div className="h-screen bg-gray-900 flex flex-col">
      {/* Header */}
      <header className="h-20 bg-gray-800 border-b border-gray-700 flex flex-col justify-center px-6 z-50">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-1">
          <a href="/" className="hover:text-gray-200 transition-colors">Home</a>
          <span>›</span>
          <a href="/proposals" className="hover:text-gray-200 transition-colors">Proposals</a>
          <span>›</span>
          <a href={`/proposals/${displayProposal.id}`} className="hover:text-gray-200 transition-colors truncate max-w-xs">
            {displayProposal.title}
          </a>
          <span>›</span>
          <span className="text-indigo-400 font-medium">3D Sandbox</span>
        </div>

        {/* Main Header Content */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* Back to Proposal Button */}
            <a
              href={`/proposals/${displayProposal.id}`}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-200 text-sm font-medium rounded-lg transition-all"
              title="Back to Proposal"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span>Back to Proposal</span>
            </a>

            <div className="flex items-center gap-3">
              <h1 className="text-sm font-semibold text-white">3D Sandbox</h1>
              <span className="text-xs text-gray-500">•</span>
              <h2 className="text-xs text-gray-400 truncate max-w-md">{displayProposal.title}</h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Auto-saving indicator */}
            <span className="flex items-center gap-2 px-3 py-1 text-xs text-gray-400 bg-gray-700/50 rounded-lg">
              <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Auto-saving...</span>
            </span>

            {/* Share Button */}
            <button className="flex items-center gap-2 px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-all">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
              </svg>
              <span>Share</span>
            </button>

            {isMock && (
              <span className="px-3 py-1 text-xs font-medium rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                MOCK DATA
              </span>
            )}
            <span className={`px-3 py-1 text-xs font-medium rounded-full ${
              displayProposal.status === 'public' || displayProposal.status === 'published'
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
            }`}>
              {displayProposal.status}
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <SandboxWrapper
        proposalId={displayProposal.id}
        proposalTitle={displayProposal.title}
        proposalGeom={displayProposal.geom}
        centerLng={centerLng}
        centerLat={centerLat}
        isMock={isMock}
        displayProposal={displayProposal}
      />
    </div>
  )
}
