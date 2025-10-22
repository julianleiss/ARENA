// ARENA V1.0 - Health Check Endpoint
// GET /api/health - Returns system status

import { NextResponse } from 'next/server'
import prisma from '@/app/lib/db'

export async function GET() {
  let dbStatus = 'disconnected'
  let dbError = null

  try {
    // Try database connection with timeout
    await Promise.race([
      prisma.$queryRaw`SELECT 1`,
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Connection timeout')), 3000)
      )
    ])
    dbStatus = 'connected'
  } catch (error) {
    console.error('Health check - DB connection failed:', error)
    dbError = error instanceof Error ? error.message : 'Unknown error'
    
    // Don't fail the health check if we're in development
    if (process.env.NODE_ENV === 'development') {
      dbStatus = 'local-bypass'
    }
  }

  const isHealthy = dbStatus === 'connected' || dbStatus === 'local-bypass'

  return NextResponse.json({
    status: isHealthy ? 'ok' : 'error',
    version: '0.101',
    timestamp: new Date().toISOString(),
    database: dbStatus,
    service: 'ARENA MVP',
    ...(dbError && { error: dbError }),
  }, { status: isHealthy ? 200 : 503 })
}