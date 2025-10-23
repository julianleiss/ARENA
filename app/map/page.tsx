// ARENA V1.0 - Map Page
'use client'

import MapView from '@/app/components/MapView' // Deck.gl + Google Maps version
import { useState } from 'react'

export default function MapPage() {
  const [mapMode, setMapMode] = useState<'navigate' | 'create'>('navigate')
  const [selectionMode, setSelectionMode] = useState<'building' | 'point' | 'polygon'>('building')

  return (
    <div className="flex flex-col h-screen">
      <header className="bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-3.5 flex items-center justify-between z-20 shadow-sm">
        <div className="flex items-center gap-6">
          <a href="/" className="text-gray-400 hover:text-gray-600 transition-colors">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </a>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-semibold text-gray-900 tracking-tight">ARENA</h1>
            <span className="px-2.5 py-0.5 bg-green-50 text-green-700 text-xs font-medium rounded-full border border-green-200">
              v0.103
            </span>
          </div>
        </div>

        {/* Edit mode selection tools */}
        {mapMode === 'create' && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectionMode('building')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectionMode === 'building'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              🏢 Edificios
            </button>
            <button
              onClick={() => setSelectionMode('point')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectionMode === 'point'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              📍 Punto
            </button>
            <button
              onClick={() => setSelectionMode('polygon')}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectionMode === 'polygon'
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                  : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              ⬡ Área
            </button>
          </div>
        )}

        <div className="flex items-center gap-2">
          {mapMode === 'create' ? (
            <button
              onClick={() => setMapMode('navigate')}
              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-all"
            >
              Cancelar
            </button>
          ) : (
            <>
              <a
                href="/proposals"
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium rounded-xl transition-all"
              >
                Propuestas
              </a>
              <button
                onClick={() => setMapMode('create')}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl transition-all shadow-md shadow-indigo-200 flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Nueva Propuesta
              </button>
            </>
          )}
        </div>
      </header>
      <div className="flex-1 relative">
        <MapView
          externalMapMode={mapMode}
          externalSelectionMode={selectionMode}
          onMapModeChange={setMapMode}
          onSelectionModeChange={setSelectionMode}
        />
      </div>
    </div>
  )
}