#!/usr/bin/env tsx
// ARENA - Database Connection Diagnostic Script
// Tests Prisma connection and reports detailed error information

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

async function testConnection() {
  console.log('🔍 ARENA Database Connection Diagnostic\n')

  // Check environment variables
  const dbUrl = process.env.DATABASE_URL
  const directUrl = process.env.DIRECT_URL

  console.log('📋 Environment Variables:')
  console.log(`DATABASE_URL: ${dbUrl ? redactPassword(dbUrl) : '❌ NOT SET'}`)
  console.log(`DIRECT_URL: ${directUrl ? redactPassword(directUrl) : '⚠️  NOT SET'}\n`)

  // Parse connection string
  if (dbUrl) {
    const parsed = parseConnectionString(dbUrl)
    console.log('🔗 Connection String Analysis:')
    console.log(`  Protocol: ${parsed.protocol}`)
    console.log(`  Host: ${parsed.host}`)
    console.log(`  Port: ${parsed.port}`)
    console.log(`  Database: ${parsed.database}`)
    console.log(`  PgBouncer Mode: ${parsed.pgbouncer ? '✅ Enabled' : '❌ Disabled'}`)
    console.log(`  Recommended Port: ${parsed.port === '5432' ? '⚠️  5432 (transaction) - consider 6543 (session pooling)' : '✅ 6543 (session pooling)'}\n`)
  }

  // Test 1: Raw SQL query
  console.log('🧪 Test 1: Raw SQL Query (SELECT 1)')
  try {
    const result = await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Success:', result)
  } catch (error) {
    console.log('❌ Failed:', getErrorDetails(error))
    return false
  }

  // Test 2: Simple count query
  console.log('\n🧪 Test 2: Count Users')
  try {
    const count = await prisma.user.count()
    console.log(`✅ Success: ${count} users in database`)
  } catch (error) {
    console.log('❌ Failed:', getErrorDetails(error))
    return false
  }

  // Test 3: Connection pool info
  console.log('\n🧪 Test 3: Database Version')
  try {
    const version = await prisma.$queryRaw<Array<{ version: string }>>`SELECT version()`
    console.log('✅ Success:', version[0]?.version?.substring(0, 50) + '...')
  } catch (error) {
    console.log('❌ Failed:', getErrorDetails(error))
    return false
  }

  console.log('\n✅ All tests passed!')
  return true
}

function redactPassword(url: string): string {
  return url.replace(/:([^:@]+)@/, ':***@')
}

function parseConnectionString(url: string) {
  const match = url.match(/^(\w+):\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(\w+)(\?.*)?$/)
  if (!match) return { protocol: 'unknown', host: 'unknown', port: 'unknown', database: 'unknown', pgbouncer: false }

  const [, protocol, user, , host, port, database, params] = match
  const pgbouncer = params?.includes('pgbouncer=true') || false

  return { protocol, host, port, database, pgbouncer }
}

function getErrorDetails(error: unknown): string {
  if (error instanceof Error) {
    const err = error as any
    return `
    Name: ${err.name}
    Message: ${err.message}
    Code: ${err.code || 'N/A'}
    ErrorCode: ${err.errorCode || 'N/A'}
    ClientVersion: ${err.clientVersion || 'N/A'}
    `
  }
  return String(error)
}

testConnection()
  .then((success) => {
    process.exit(success ? 0 : 1)
  })
  .catch((error) => {
    console.error('💥 Unhandled error:', error)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
