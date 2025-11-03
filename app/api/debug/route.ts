// ARENA - Debug API Endpoint
// GET /api/debug - Test database connection and return diagnostic info
// ⚠️ REMOVE THIS FILE IN PRODUCTION OR ADD AUTHENTICATION

import { NextResponse } from 'next/server'
import prisma from '@/app/lib/db'

export async function GET() {
  const diagnostics: any = {
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    checks: {},
  }

  try {
    // Test 1: Database connection
    diagnostics.checks.database_connection = 'testing...'
    try {
      await prisma.$connect()
      diagnostics.checks.database_connection = '✅ Connected'
    } catch (error: any) {
      diagnostics.checks.database_connection = `❌ Failed: ${error.message}`
    }

    // Test 2: Count proposals
    diagnostics.checks.proposal_count = 'testing...'
    try {
      const count = await Promise.race([
        prisma.proposal.count(),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout after 5s')), 5000)
        ),
      ])
      diagnostics.checks.proposal_count = `✅ ${count} proposals`
    } catch (error: any) {
      diagnostics.checks.proposal_count = `❌ Failed: ${error.message}`
    }

    // Test 3: Fetch recent proposals
    diagnostics.checks.recent_proposals = 'testing...'
    try {
      const proposals = await Promise.race([
        prisma.proposal.findMany({
          take: 5,
          orderBy: { createdAt: 'desc' },
          select: {
            id: true,
            title: true,
            status: true,
            createdAt: true,
            geom: true,
          },
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout after 5s')), 5000)
        ),
      ])
      diagnostics.checks.recent_proposals = `✅ Fetched ${proposals.length} proposals`
      diagnostics.recent_proposals_sample = proposals.map(p => ({
        id: p.id,
        title: p.title,
        status: p.status,
        hasGeom: !!p.geom,
        createdAt: p.createdAt,
      }))
    } catch (error: any) {
      diagnostics.checks.recent_proposals = `❌ Failed: ${error.message}`
    }

    // Test 4: Count by status
    diagnostics.checks.status_breakdown = 'testing...'
    try {
      const statuses = await Promise.race([
        prisma.proposal.groupBy({
          by: ['status'],
          _count: true,
        }),
        new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('Timeout after 5s')), 5000)
        ),
      ])
      diagnostics.checks.status_breakdown = '✅ Grouped by status'
      diagnostics.status_breakdown = statuses.map(s => ({
        status: s.status,
        count: s._count,
      }))
    } catch (error: any) {
      diagnostics.checks.status_breakdown = `❌ Failed: ${error.message}`
    }

    // Test 5: Check environment variables
    diagnostics.checks.env_variables = {
      DATABASE_URL_configured: !!process.env.DATABASE_URL,
      DATABASE_URL_length: process.env.DATABASE_URL?.length || 0,
      DATABASE_URL_prefix: process.env.DATABASE_URL?.substring(0, 30) + '...',
      SUPABASE_URL_configured: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
      SUPABASE_ANON_KEY_configured: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_KEY_configured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    }

    // Overall status
    const allChecksPass = Object.values(diagnostics.checks)
      .filter(v => typeof v === 'string')
      .every(v => (v as string).startsWith('✅'))

    diagnostics.overall_status = allChecksPass ? '✅ All checks passed' : '⚠️ Some checks failed'

    return NextResponse.json(diagnostics, { status: 200 })
  } catch (error: any) {
    diagnostics.checks.unexpected_error = `❌ ${error.message}`
    diagnostics.overall_status = '❌ Critical error'
    return NextResponse.json(diagnostics, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}
