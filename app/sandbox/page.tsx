'use client'

// ARENA - Standalone Sandbox Preview Page
// Direct URL: /sandbox
// Purpose: Demo/preview page for Monday presentation

import { useState } from 'react'
import Header from '@/app/components/Header'
import SandboxOverlay from '@/app/components/SandboxOverlay'

export default function SandboxPreviewPage() {
  const [geometryType, setGeometryType] = useState<'building' | 'point' | 'polygon'>('building')
  const [hasPlacement, setHasPlacement] = useState(false)

  return (
    <div className="relative w-full h-screen bg-gradient-to-br from-slate-100 to-slate-200">
      {/* Header */}
      <Header
        onOpenProposals={() => {}}
        createMode={true}
        onToggleCreate={() => {}}
        selectedGeometry={geometryType}
        onSelectGeometry={setGeometryType}
      />

      {/* Sandbox Overlay - Always visible */}
      <SandboxOverlay
        geometryType={geometryType}
        hasPlacement={hasPlacement}
        onFinalize={() => alert('Vista previa: En produccion, esto abriria el formulario')}
        onCancel={() => setHasPlacement(false)}
      />

      {/* Map Placeholder */}
      <div className="pt-20 h-full flex items-center justify-center">
        <div className="text-center max-w-2xl px-6">
          <div className="mb-6">
            <div className="w-24 h-24 mx-auto mb-4 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center">
              <svg className="w-12 h-12 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
              </svg>
            </div>
          </div>

          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Vista Previa del Sandbox
          </h1>

          <p className="text-lg text-gray-600 mb-6">
            Demo para presentacion - Modo de creacion activo
          </p>

          <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Como funciona:</h2>
            <div className="text-left space-y-3 text-gray-700">
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 font-semibold text-sm">1</div>
                <div>
                  <strong>Selecciona geometria:</strong> Usa los botones EDIFICIO | PUNTO | AREA en el header
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 font-semibold text-sm">2</div>
                <div>
                  <strong>Coloca en el mapa:</strong> Haz clic en el mapa para colocar tu seleccion
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 font-semibold text-sm">3</div>
                <div>
                  <strong>Finaliza:</strong> El boton FINALIZAR se activa cuando hay una ubicacion
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center flex-shrink-0 font-semibold text-sm">4</div>
                <div>
                  <strong>Crea propuesta:</strong> Completa el formulario y guarda
                </div>
              </div>
            </div>
          </div>

          {/* Test Placement Button */}
          <button
            onClick={() => setHasPlacement(!hasPlacement)}
            className={`px-8 py-3 rounded-xl font-medium transition-all ${
              hasPlacement
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-indigo-600 text-white hover:bg-indigo-700'
            }`}
          >
            {hasPlacement ? '✓ Ubicacion Colocada' : 'Simular Colocacion'}
          </button>

          <p className="mt-6 text-sm text-gray-500">
            En produccion, aqui se mostraria el mapa de Google con Deck.gl
          </p>

          {/* Debug Info */}
          <div className="mt-8 p-4 bg-gray-100 rounded-lg text-left font-mono text-xs">
            <div className="font-bold mb-2">Estado Actual:</div>
            <div>Tipo: {geometryType}</div>
            <div>Ubicacion: {hasPlacement ? 'SI' : 'NO'}</div>
            <div>Overlay visible: SI (siempre en esta demo)</div>
          </div>
        </div>
      </div>
    </div>
  )
}
