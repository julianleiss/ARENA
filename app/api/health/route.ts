// ARENA V1.0 - Health Check Endpoint
// GET /api/health - Returns system status with database connectivity test

import { NextResponse } from 'next/server'
import prisma from '@/app/lib/db'

export async function GET() {
  const version = process.env.npm_package_version ?? 'dev'
  const timestamp = new Date().toISOString()
  const service = 'ARENA MVP'

  const startTime = Date.now()

  try {
    // Real database ping with SELECT 1 AS ok
    await prisma.$queryRaw`SELECT 1 AS ok`

    const latencyMs = Date.now() - startTime

    return NextResponse.json({
      status: 'ok',
      version,
      timestamp,
      database: 'connected',
      service,
      latencyMs
    }, { status: 200 })

  } catch (e: unknown) {
    const latencyMs = Date.now() - startTime
    const errorCode = (e as { code?: string })?.code
    const errorMessage = (e as { message?: string })?.message
    const error = String(errorCode ?? errorMessage ?? e)

    console.error('Health check - DB connection failed:', error)

    return NextResponse.json({
      status: 'error',
      version,
      timestamp,
      database: 'unreachable',
      service,
      error
    }, { status: 500 })
  }
}