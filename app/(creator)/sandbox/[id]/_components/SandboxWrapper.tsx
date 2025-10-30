'use client'

// ARENA - Sandbox Wrapper Component
// Handles client-side state for asset selection

import { useState } from 'react'
import Palette, { Asset } from '../../_components/Palette'
import SandboxClient from './SandboxClient'

interface SandboxWrapperProps {
  proposalId: string
  proposalTitle: string
  proposalGeom: any
  centerLng: number
  centerLat: number
  isMock: boolean
  displayProposal: any
}

export default function SandboxWrapper({
  proposalId,
  proposalTitle,
  proposalGeom,
  centerLng,
  centerLat,
  isMock,
  displayProposal,
}: SandboxWrapperProps) {
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null)

  console.log('🎭 SandboxWrapper state:', { selectedAsset: selectedAsset?.id })

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* Left Sidebar - Asset Palette */}
      <Palette selectedAsset={selectedAsset} onSelectAsset={setSelectedAsset} />

      {/* Center - 3D Canvas */}
      <main className="flex-1 relative">
        <SandboxClient
          proposalId={proposalId}
          proposalTitle={proposalTitle}
          proposalGeom={proposalGeom}
          centerLng={centerLng}
          centerLat={centerLat}
          selectedAsset={selectedAsset}
        />
      </main>

      {/* Right Sidebar - Inspector */}
      <aside className="w-80 bg-gray-800 border-l border-gray-700 overflow-y-auto">
        <div className="p-4">
          <h3 className="text-sm font-semibold text-gray-300 mb-3">Inspector</h3>
          <div className="space-y-3 text-xs text-gray-400">
            {isMock && (
              <div className="p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                <p className="text-orange-400 font-medium mb-1">⚠️ Testing Mode</p>
                <p className="text-orange-300 text-xs">
                  Database not connected. Using mock data to demonstrate 3D sandbox functionality.
                </p>
              </div>
            )}

            {/* Selected Asset Info */}
            {selectedAsset && (
              <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
                <p className="text-indigo-400 font-medium mb-2">Selected Asset</p>
                <div className="space-y-2">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <div className="mt-0.5 text-gray-300">{selectedAsset.name}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Category:</span>
                    <div className="mt-0.5 text-gray-300 capitalize">{selectedAsset.category}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Geometry:</span>
                    <div className="mt-0.5 text-gray-300 capitalize">{selectedAsset.geometry}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">Scale:</span>
                    <div className="mt-0.5 text-gray-300 font-mono text-xs">
                      [{selectedAsset.defaultScale.join(', ')}]
                    </div>
                  </div>
                  <div>
                    <span className="text-gray-500">Color:</span>
                    <div className="mt-0.5 flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded border border-gray-600"
                        style={{ backgroundColor: selectedAsset.color }}
                      />
                      <span className="text-gray-300 font-mono text-xs">{selectedAsset.color}</span>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-indigo-300">
                  💡 Click on the map to place this asset
                </p>
              </div>
            )}

            <div>
              <span className="text-gray-500">Proposal ID:</span>
              <div className="mt-1 text-gray-300 font-mono text-xs break-all">
                {displayProposal.id}
              </div>
            </div>
            <div>
              <span className="text-gray-500">Center:</span>
              <div className="mt-1 text-gray-300 font-mono">
                {centerLng.toFixed(6)}, {centerLat.toFixed(6)}
              </div>
            </div>
            {displayProposal.geom && (
              <div>
                <span className="text-gray-500">Geometry Type:</span>
                <div className="mt-1 text-gray-300">{displayProposal.geom.type}</div>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  )
}
