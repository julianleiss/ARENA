// ARENA V1.0 - POIs API Endpoint
// GET /api/pois - Returns all Points of Interest

import { NextResponse } from 'next/server'
import prisma from '@/app/lib/db'

// Mock POIs for local development when DB is unreachable
const MOCK_POIS = [
  {
    id: 'mock-1',
    name: 'Plaza Balcarce',
    type: 'espacio_verde',
    geom: { type: 'Point', coordinates: [-58.4583, -34.5447] },
    address: 'Av. del Libertador 7800',
    source: 'manual',
    createdAt: new Date(),
  },
  {
    id: 'mock-2',
    name: 'Hospital Rivadavia',
    type: 'salud',
    geom: { type: 'Point', coordinates: [-58.4520, -34.5460] },
    address: 'Av. Las Heras 2670',
    source: 'manual',
    createdAt: new Date(),
  },
  {
    id: 'mock-3',
    name: 'Escuela Primaria Común N° 12',
    type: 'educacion',
    geom: { type: 'Point', coordinates: [-58.4600, -34.5470] },
    address: 'Cabildo 3500',
    source: 'manual',
    createdAt: new Date(),
  },
  {
    id: 'mock-4',
    name: 'Estación Núñez',
    type: 'transporte',
    geom: { type: 'Point', coordinates: [-58.4650, -34.5420] },
    address: 'Av. del Libertador 8000',
    source: 'manual',
    createdAt: new Date(),
  },
]

export async function GET() {
  try {
    // Try to fetch from database with timeout (30s to account for cold starts and connection pooling)
    const pois = await Promise.race([
      prisma.pOI.findMany({
        orderBy: {
          name: 'asc',
        },
      }),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('DB timeout')), 30000)
      )
    ])

    return NextResponse.json({
      pois,
      count: pois.length,
      source: 'database',
    }, { status: 200 })

  } catch (error) {
    console.error('Error fetching POIs from DB, using mock data:', error)
    
    // Return mock data in development
    if (process.env.NODE_ENV === 'development') {
      return NextResponse.json({
        pois: MOCK_POIS,
        count: MOCK_POIS.length,
        source: 'mock',
      }, { status: 200 })
    }
    
    return NextResponse.json({
      error: 'Failed to fetch POIs',
      pois: [],
      count: 0,
    }, { status: 500 })
  }
}