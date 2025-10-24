// ARENA - Prefab Palette Component
'use client'

import { useState, useEffect } from 'react'

type Asset = {
  id: string
  name: string
  kind: string
  modelUrl: string | null
  defaultParams: Record<string, any>
}

type PrefabPaletteProps = {
  assets: Asset[]
  selectedAssetId: string | null
  onSelectAsset: (assetId: string | null) => void
}

export default function PrefabPalette({
  assets,
  selectedAssetId,
  onSelectAsset,
}: PrefabPaletteProps) {
  const [filter, setFilter] = useState<string>('all')

  const kindIcons: Record<string, string> = {
    building: '🏢',
    tree: '🌳',
    lamp: '💡',
    road: '🛣️',
    custom: '⭐',
  }

  const filteredAssets =
    filter === 'all'
      ? assets
      : assets.filter((asset) => asset.kind === filter)

  return (
    <div className="absolute top-24 left-6 z-30 bg-white/95 backdrop-blur-sm border border-gray-300 rounded-xl shadow-lg p-4 w-80">
      {/* Header */}
      <div className="mb-3">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">
          Prefabs Library
        </h3>
        <p className="text-xs text-gray-600">
          Select a prefab to place on the map
        </p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-2">
        <button
          onClick={() => setFilter('all')}
          className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            filter === 'all'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          All
        </button>
        <button
          onClick={() => setFilter('building')}
          className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            filter === 'building'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🏢 Buildings
        </button>
        <button
          onClick={() => setFilter('tree')}
          className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            filter === 'tree'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          🌳 Trees
        </button>
        <button
          onClick={() => setFilter('lamp')}
          className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
            filter === 'lamp'
              ? 'bg-indigo-600 text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          💡 Lamps
        </button>
      </div>

      {/* Asset Grid */}
      <div className="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
        {filteredAssets.map((asset) => (
          <button
            key={asset.id}
            onClick={() =>
              onSelectAsset(selectedAssetId === asset.id ? null : asset.id)
            }
            className={`p-3 border rounded-lg text-left transition-all ${
              selectedAssetId === asset.id
                ? 'border-indigo-500 bg-indigo-50 shadow-md'
                : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">
                {kindIcons[asset.kind] || '📦'}
              </span>
              <span className="text-sm font-medium text-gray-900 truncate">
                {asset.name}
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {asset.kind === 'building' &&
                asset.defaultParams.floors &&
                `${asset.defaultParams.floors} floors`}
              {asset.kind === 'tree' &&
                asset.defaultParams.height &&
                `${asset.defaultParams.height}m`}
              {asset.kind === 'lamp' &&
                asset.defaultParams.height &&
                `${asset.defaultParams.height}m`}
              {asset.kind === 'custom' &&
                asset.defaultParams.size &&
                `${asset.defaultParams.size}m²`}
            </div>
          </button>
        ))}
      </div>

      {/* Clear Selection */}
      {selectedAssetId && (
        <button
          onClick={() => onSelectAsset(null)}
          className="mt-3 w-full px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-lg transition-colors"
        >
          Clear Selection
        </button>
      )}
    </div>
  )
}
