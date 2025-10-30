'use client'

// ARENA - Asset Palette Component
// Left sidebar for selecting 3D primitives to place on the map

import { useState, useMemo } from 'react'

// Asset data structure
export interface Asset {
  id: string
  name: string
  category: 'vegetation' | 'furniture' | 'structures' | 'lighting' | 'people'
  icon: string // emoji
  color: string
  geometry: 'box' | 'cylinder' | 'sphere' | 'cone'
  defaultScale: [number, number, number]
  thumbnail?: string
}

// Basic asset library
const BASIC_ASSETS: Asset[] = [
  // Vegetation
  {
    id: 'tree-1',
    name: 'Oak Tree',
    category: 'vegetation',
    icon: '🌳',
    color: '#2d5f2d',
    geometry: 'cylinder',
    defaultScale: [2, 8, 2],
  },
  {
    id: 'tree-2',
    name: 'Pine Tree',
    category: 'vegetation',
    icon: '🌲',
    color: '#1e4620',
    geometry: 'cone',
    defaultScale: [2, 10, 2],
  },
  {
    id: 'bush-1',
    name: 'Bush',
    category: 'vegetation',
    icon: '🌿',
    color: '#4a7c4a',
    geometry: 'sphere',
    defaultScale: [1.5, 1, 1.5],
  },

  // Furniture
  {
    id: 'bench-1',
    name: 'Park Bench',
    category: 'furniture',
    icon: '🪑',
    color: '#8b4513',
    geometry: 'box',
    defaultScale: [2, 0.5, 0.5],
  },
  {
    id: 'table-1',
    name: 'Picnic Table',
    category: 'furniture',
    icon: '🍽️',
    color: '#a0522d',
    geometry: 'box',
    defaultScale: [1.5, 0.8, 1],
  },
  {
    id: 'bin-1',
    name: 'Trash Bin',
    category: 'furniture',
    icon: '🗑️',
    color: '#505050',
    geometry: 'cylinder',
    defaultScale: [0.5, 1, 0.5],
  },

  // Structures
  {
    id: 'kiosk-1',
    name: 'Kiosk',
    category: 'structures',
    icon: '🏪',
    color: '#cd853f',
    geometry: 'box',
    defaultScale: [3, 3, 3],
  },
  {
    id: 'pergola-1',
    name: 'Pergola',
    category: 'structures',
    icon: '🏗️',
    color: '#8b7355',
    geometry: 'box',
    defaultScale: [4, 3, 4],
  },

  // Lighting
  {
    id: 'streetlight-1',
    name: 'Street Light',
    category: 'lighting',
    icon: '💡',
    color: '#708090',
    geometry: 'cylinder',
    defaultScale: [0.2, 5, 0.2],
  },
  {
    id: 'lamp-1',
    name: 'Park Lamp',
    category: 'lighting',
    icon: '🕯️',
    color: '#696969',
    geometry: 'cylinder',
    defaultScale: [0.15, 2.5, 0.15],
  },

  // People
  {
    id: 'person-1',
    name: 'Person Standing',
    category: 'people',
    icon: '🚶',
    color: '#ffa500',
    geometry: 'cylinder',
    defaultScale: [0.4, 1.7, 0.4],
  },
  {
    id: 'person-2',
    name: 'Person Sitting',
    category: 'people',
    icon: '🧘',
    color: '#ff8c00',
    geometry: 'cylinder',
    defaultScale: [0.4, 1, 0.4],
  },
]

// Category metadata
const CATEGORIES = [
  { id: 'all', name: 'All', icon: '📦' },
  { id: 'vegetation', name: 'Vegetation', icon: '🌳' },
  { id: 'furniture', name: 'Furniture', icon: '🪑' },
  { id: 'structures', name: 'Structures', icon: '🏗️' },
  { id: 'lighting', name: 'Lighting', icon: '💡' },
  { id: 'people', name: 'People', icon: '👤' },
]

interface PaletteProps {
  selectedAsset: Asset | null
  onSelectAsset: (asset: Asset | null) => void
}

export default function Palette({ selectedAsset, onSelectAsset }: PaletteProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [searchQuery, setSearchQuery] = useState('')

  console.log('🎨 Palette rendering:', { activeCategory, searchQuery, selectedAsset: selectedAsset?.id })

  // Filter assets by category and search
  const filteredAssets = useMemo(() => {
    let filtered = BASIC_ASSETS

    // Filter by category
    if (activeCategory !== 'all') {
      filtered = filtered.filter((asset) => asset.category === activeCategory)
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter((asset) =>
        asset.name.toLowerCase().includes(query)
      )
    }

    return filtered
  }, [activeCategory, searchQuery])

  const handleAssetClick = (asset: Asset) => {
    if (selectedAsset?.id === asset.id) {
      // Deselect if clicking the same asset
      onSelectAsset(null)
      console.log('🔲 Asset deselected')
    } else {
      onSelectAsset(asset)
      console.log('✅ Asset selected:', {
        id: asset.id,
        name: asset.name,
        category: asset.category,
        geometry: asset.geometry,
        defaultScale: asset.defaultScale,
      })
    }
  }

  return (
    <aside className="w-64 bg-gray-800 border-r border-gray-700 flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-700">
        <h3 className="text-sm font-semibold text-gray-200 mb-3">Asset Library</h3>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search assets..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 pl-9 bg-gray-900 border border-gray-600 rounded-lg text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          />
          <svg
            className="absolute left-3 top-2.5 w-4 h-4 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="px-2 py-3 border-b border-gray-700 overflow-x-auto">
        <div className="flex gap-1">
          {CATEGORIES.map((category) => (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeCategory === category.id
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <span>{category.icon}</span>
              <span>{category.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Asset Grid */}
      <div className="flex-1 overflow-y-auto p-3">
        {filteredAssets.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">No assets found</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {filteredAssets.map((asset) => (
              <button
                key={asset.id}
                onClick={() => handleAssetClick(asset)}
                className={`relative flex flex-col items-center p-3 rounded-lg transition-all ${
                  selectedAsset?.id === asset.id
                    ? 'bg-indigo-600 ring-2 ring-indigo-400 shadow-lg'
                    : 'bg-gray-700 hover:bg-gray-600 hover:shadow-md'
                }`}
              >
                {/* Icon */}
                <div className="text-3xl mb-2">{asset.icon}</div>

                {/* Name */}
                <div className="text-xs font-medium text-gray-200 text-center leading-tight mb-1">
                  {asset.name}
                </div>

                {/* Color Swatch */}
                <div
                  className="w-6 h-1.5 rounded-full"
                  style={{ backgroundColor: asset.color }}
                />

                {/* Geometry Type */}
                <div className="mt-1 text-[10px] text-gray-400">
                  {asset.geometry}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Footer - Stats */}
      <div className="p-3 border-t border-gray-700 bg-gray-800/50">
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>
            {filteredAssets.length} asset{filteredAssets.length !== 1 ? 's' : ''}
          </span>
          {selectedAsset && (
            <span className="text-indigo-400 font-medium">Selected: {selectedAsset.name}</span>
          )}
        </div>
      </div>
    </aside>
  )
}
