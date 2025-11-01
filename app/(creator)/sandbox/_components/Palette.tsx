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

// Expanded asset library (25+ assets)
const BASIC_ASSETS: Asset[] = [
  // Vegetación (8)
  {
    id: 'tree-oak',
    name: 'Roble',
    category: 'vegetation',
    icon: '🌳',
    color: '#2d5f2d',
    geometry: 'cylinder',
    defaultScale: [3, 8, 3],
  },
  {
    id: 'tree-pine',
    name: 'Pino',
    category: 'vegetation',
    icon: '🌲',
    color: '#1e4620',
    geometry: 'cone',
    defaultScale: [2.5, 10, 2.5],
  },
  {
    id: 'tree-palm',
    name: 'Palmera',
    category: 'vegetation',
    icon: '🌴',
    color: '#3a7d3a',
    geometry: 'cylinder',
    defaultScale: [1.5, 7, 1.5],
  },
  {
    id: 'tree-willow',
    name: 'Sauce',
    category: 'vegetation',
    icon: '🌳',
    color: '#4a7c59',
    geometry: 'sphere',
    defaultScale: [4, 6, 4],
  },
  {
    id: 'bush',
    name: 'Arbusto',
    category: 'vegetation',
    icon: '🌿',
    color: '#4a7c4a',
    geometry: 'sphere',
    defaultScale: [1.5, 1, 1.5],
  },
  {
    id: 'flower-bed',
    name: 'Cantero de Flores',
    category: 'vegetation',
    icon: '🌺',
    color: '#ff69b4',
    geometry: 'box',
    defaultScale: [2, 0.3, 1],
  },
  {
    id: 'hedge',
    name: 'Seto',
    category: 'vegetation',
    icon: '🪴',
    color: '#355e3b',
    geometry: 'box',
    defaultScale: [3, 1.5, 0.5],
  },
  {
    id: 'grass-patch',
    name: 'Césped',
    category: 'vegetation',
    icon: '🍀',
    color: '#7cfc00',
    geometry: 'box',
    defaultScale: [3, 0.1, 3],
  },

  // Mobiliario (7)
  {
    id: 'park-bench',
    name: 'Banco de Plaza',
    category: 'furniture',
    icon: '🪑',
    color: '#8b4513',
    geometry: 'box',
    defaultScale: [2, 0.8, 0.6],
  },
  {
    id: 'picnic-table',
    name: 'Mesa de Picnic',
    category: 'furniture',
    icon: '🍽️',
    color: '#a0522d',
    geometry: 'box',
    defaultScale: [2, 0.8, 1.5],
  },
  {
    id: 'trash-bin',
    name: 'Papelera',
    category: 'furniture',
    icon: '🗑️',
    color: '#505050',
    geometry: 'cylinder',
    defaultScale: [0.5, 1, 0.5],
  },
  {
    id: 'bike-rack',
    name: 'Bicicletero',
    category: 'furniture',
    icon: '🚲',
    color: '#696969',
    geometry: 'box',
    defaultScale: [2, 1, 0.3],
  },
  {
    id: 'drinking-fountain',
    name: 'Bebedero',
    category: 'furniture',
    icon: '⛲',
    color: '#4682b4',
    geometry: 'cylinder',
    defaultScale: [0.8, 1.2, 0.8],
  },
  {
    id: 'playground-swing',
    name: 'Hamaca',
    category: 'furniture',
    icon: '🏀',
    color: '#ff6347',
    geometry: 'box',
    defaultScale: [2, 2.5, 1],
  },
  {
    id: 'slide',
    name: 'Tobogán',
    category: 'furniture',
    icon: '🎢',
    color: '#ffd700',
    geometry: 'box',
    defaultScale: [1.5, 2, 3],
  },

  // Estructuras (5)
  {
    id: 'kiosk',
    name: 'Kiosco',
    category: 'structures',
    icon: '🏪',
    color: '#cd853f',
    geometry: 'box',
    defaultScale: [3, 3, 3],
  },
  {
    id: 'pergola',
    name: 'Pérgola',
    category: 'structures',
    icon: '🏗️',
    color: '#8b7355',
    geometry: 'box',
    defaultScale: [4, 3, 4],
  },
  {
    id: 'gazebo',
    name: 'Gazebo',
    category: 'structures',
    icon: '⛺',
    color: '#daa520',
    geometry: 'cylinder',
    defaultScale: [4, 3.5, 4],
  },
  {
    id: 'shelter',
    name: 'Refugio',
    category: 'structures',
    icon: '🏕️',
    color: '#b8860b',
    geometry: 'box',
    defaultScale: [5, 2.5, 3],
  },
  {
    id: 'stage',
    name: 'Escenario',
    category: 'structures',
    icon: '🎪',
    color: '#8b0000',
    geometry: 'box',
    defaultScale: [6, 1, 4],
  },

  // Iluminación (3)
  {
    id: 'street-light',
    name: 'Farola',
    category: 'lighting',
    icon: '💡',
    color: '#708090',
    geometry: 'cylinder',
    defaultScale: [0.3, 6, 0.3],
  },
  {
    id: 'park-lamp',
    name: 'Lámpara de Plaza',
    category: 'lighting',
    icon: '🕯️',
    color: '#696969',
    geometry: 'cylinder',
    defaultScale: [0.2, 3, 0.2],
  },
  {
    id: 'spotlight',
    name: 'Reflector',
    category: 'lighting',
    icon: '🔦',
    color: '#2f4f4f',
    geometry: 'cylinder',
    defaultScale: [0.4, 2, 0.4],
  },

  // Personas (2)
  {
    id: 'person-standing',
    name: 'Persona de Pie',
    category: 'people',
    icon: '🚶',
    color: '#ffa500',
    geometry: 'cylinder',
    defaultScale: [0.5, 1.75, 0.5],
  },
  {
    id: 'person-sitting',
    name: 'Persona Sentada',
    category: 'people',
    icon: '🧘',
    color: '#ff8c00',
    geometry: 'cylinder',
    defaultScale: [0.5, 1.1, 0.5],
  },
]

// Category metadata
const CATEGORIES = [
  { id: 'all', name: 'Todos', icon: '📦' },
  { id: 'vegetation', name: 'Vegetación', icon: '🌳' },
  { id: 'furniture', name: 'Mobiliario', icon: '🪑' },
  { id: 'structures', name: 'Estructuras', icon: '🏗️' },
  { id: 'lighting', name: 'Iluminación', icon: '💡' },
  { id: 'people', name: 'Personas', icon: '👤' },
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
        <h3 className="text-sm font-semibold text-gray-200 mb-3">Biblioteca de Objetos</h3>

        {/* Search Bar */}
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar objetos..."
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
            <p className="text-sm text-gray-500">No se encontraron objetos</p>
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
            {filteredAssets.length} objeto{filteredAssets.length !== 1 ? 's' : ''}
          </span>
          {selectedAsset && (
            <span className="text-indigo-400 font-medium">Seleccionado: {selectedAsset.name}</span>
          )}
        </div>
      </div>
    </aside>
  )
}
