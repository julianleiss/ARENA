'use client'

/**
 * ProposalPopup - Hover tooltip for proposal markers
 *
 * Displays proposal preview on hover with title, summary, and author.
 * Matches ARENA design system with purple gradient and clean styling.
 */

import type { Proposal } from '@/app/lib/mapbox-layers'

export interface ProposalPopupProps {
  /** Proposal data to display */
  proposal: Proposal
  /** Screen position for popup (relative to map container) */
  position: { x: number; y: number }
  /** Popup type: 'hover' shows preview, 'click' shows full details */
  type?: 'hover' | 'click'
}

/**
 * ProposalPopup component
 * Renders a floating tooltip with proposal information
 */
export default function ProposalPopup({
  proposal,
  position,
  type = 'hover'
}: ProposalPopupProps) {
  // Calculate popup position (centered above the marker)
  const style: React.CSSProperties = {
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y - 20}px`, // Offset above marker
    transform: 'translate(-50%, -100%)', // Center horizontally, position above
    pointerEvents: 'none', // Don't interfere with map interactions
    zIndex: 1000
  }

  return (
    <div style={style}>
      {/* Tooltip container */}
      <div className="bg-white rounded-xl shadow-2xl border border-indigo-100 p-4 max-w-sm backdrop-blur-sm bg-white/95">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
              />
            </svg>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 text-sm mb-1 line-clamp-2">
              {proposal.title}
            </h3>

            <p className="text-xs text-gray-500 mb-1.5">
              <span className="font-medium">
                {proposal.author?.name || 'Unknown'}
              </span>
            </p>

            {proposal.summary && (
              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                {proposal.summary}
              </p>
            )}

            {type === 'hover' && (
              <p className="text-xs text-indigo-600 font-medium mt-2">
                Click para ver detalles →
              </p>
            )}

            {/* Vote and comment counts */}
            {proposal._count && (
              <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                {proposal._count.votes > 0 && (
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                    </svg>
                    <span>{proposal._count.votes}</span>
                  </div>
                )}
                {proposal._count.comments > 0 && (
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                    <span>{proposal._count.comments}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Arrow pointing down to marker */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-b border-r border-indigo-100 rotate-45"
          style={{
            bottom: '-8px'
          }}
        />
      </div>
    </div>
  )
}
