'use client'

import { useEffect, useState } from 'react'
import { Map } from '@vis.gl/react-google-maps'

interface ReadOnlySandboxProps {
  proposalId: string
}

export function ReadOnlySandbox({ proposalId }: ReadOnlySandboxProps) {
  const [objects, setObjects] = useState<any[]>([])
  const [viewport, setViewport] = useState({
    longitude: -58.46,
    latitude: -34.545,
    zoom: 16
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchScene()
  }, [proposalId])

  const fetchScene = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/sandbox?proposalId=${proposalId}`)
      if (res.ok) {
        const data = await res.json()
        if (data?.scene?.objects) {
          setObjects(data.scene.objects)
        }
        // Update viewport if we have geometry bounds
        if (data?.geometry) {
          // TODO: Calculate center from geometry
        }
      }
    } catch (error) {
      console.error('Error loading scene:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative w-full h-full bg-gray-100">
      {loading ? (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : (
        <Map
          mapId={process.env.NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID}
          defaultCenter={{ lat: viewport.latitude, lng: viewport.longitude }}
          defaultZoom={viewport.zoom}
          gestureHandling="greedy"
          disableDefaultUI={true}
          style={{ width: '100%', height: '100%' }}
        >
          {/* 3D objects would be rendered here with deck.gl */}
        </Map>
      )}

      <div className="absolute top-2 left-2 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-xs text-gray-600 shadow">
        Vista previa • Solo lectura
      </div>

      {objects.length > 0 && (
        <div className="absolute bottom-2 right-2 bg-white/90 backdrop-blur px-3 py-1 rounded-lg text-xs text-gray-600 shadow">
          {objects.length} objeto{objects.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
