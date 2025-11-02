#!/usr/bin/env tsx

/**
 * Database Connection Checker
 * Run: npm run db:check
 *
 * This script verifies your DATABASE_URL is configured correctly
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function checkConnection() {
  console.log('🔍 Checking database connection...\n')

  // Check DATABASE_URL format
  const dbUrl = process.env.DATABASE_URL

  if (!dbUrl) {
    console.error('❌ DATABASE_URL is not set in .env file')
    console.log('\n📝 Run: cp .env.example .env')
    console.log('Then edit .env and add your database password')
    process.exit(1)
  }

  console.log('✅ DATABASE_URL is set')

  // Check if using pooler (port 6543)
  if (dbUrl.includes(':5432')) {
    console.error('❌ Using DIRECT connection (port 5432)')
    console.error('   This will NOT work from Vercel or local machine!')
    console.log('\n✅ Change to POOLER connection:')
    console.log('   - Change port: 5432 → 6543')
    console.log('   - Change host: db.PROJECT.supabase.co → aws-0-us-east-1.pooler.supabase.com')
    console.log('   - Add parameter: ?pgbouncer=true')
    process.exit(1)
  }

  if (!dbUrl.includes(':6543')) {
    console.warn('⚠️  Port not detected as 6543 - verify your connection string')
  } else {
    console.log('✅ Using POOLER connection (port 6543)')
  }

  // Check username format
  if (dbUrl.includes('postgres.vtckkegygfhsvobmyhto')) {
    console.log('✅ Username format correct (postgres.PROJECT_REF)')
  } else if (dbUrl.match(/postgresql:\/\/postgres:/)) {
    console.error('❌ Wrong username format')
    console.log('   Use: postgres.vtckkegygfhsvobmyhto')
    console.log('   NOT: postgres')
    process.exit(1)
  }

  // Check pgbouncer parameter
  if (dbUrl.includes('pgbouncer=true')) {
    console.log('✅ Has pgbouncer=true parameter')
  } else {
    console.warn('⚠️  Missing ?pgbouncer=true parameter')
  }

  console.log('\n🔌 Attempting to connect to database...')

  try {
    // Try to query database
    await prisma.$queryRaw`SELECT 1 as test`
    console.log('✅ Connected successfully!')

    // Check if proposals table has data
    const count = await prisma.proposal.count()
    console.log(`✅ Found ${count} proposals in database`)

    if (count === 0) {
      console.log('\n⚠️  Database is empty!')
      console.log('   Run: npm run db:seed')
    }

    console.log('\n🎉 Database connection is working correctly!')

  } catch (error: any) {
    console.error('❌ Connection failed!')
    console.error('\nError:', error.message)

    if (error.message.includes('Tenant or user not found')) {
      console.log('\n🔑 Authentication Error:')
      console.log('   - Check your password is correct')
      console.log('   - Username must be: postgres.vtckkegygfhsvobmyhto')
    } else if (error.message.includes("Can't reach database")) {
      console.log('\n🌐 Connection Error:')
      console.log('   - Make sure you are using the POOLER connection')
      console.log('   - Host: aws-0-us-east-1.pooler.supabase.com')
      console.log('   - Port: 6543')
    } else if (error.message.includes('permission denied')) {
      console.log('\n🔒 RLS Error:')
      console.log('   - Run the RLS SQL script in Supabase:')
      console.log('   - File: prisma/migrations/enable_rls_minimal.sql')
    }

    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

checkConnection().catch(console.error)
