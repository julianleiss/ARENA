// ARENA V1.0 - Health Check Endpoint
// GET /api/health - Returns system status with database connectivity test

import { NextResponse } from 'next/server'
import prisma from '@/app/lib/db'

export async function GET() {
  try {
    // Real database ping with SELECT 1 AS ok
    const result = await prisma.$queryRaw<Array<{ ok: number }>>`SELECT 1 AS ok`

    if (!result || result.length === 0 || result[0].ok !== 1) {
      throw new Error('Invalid database response')
    }

    return NextResponse.json({
      status: 'ok',
      database: 'connected',
      time: new Date().toISOString(),
    }, { status: 200 })

  } catch (error) {
    console.error('Health check - DB connection failed:', error)

    return NextResponse.json({
      status: 'error',
      error: error instanceof Error ? error.message : 'Database connection failed',
    }, { status: 500 })
  }
}