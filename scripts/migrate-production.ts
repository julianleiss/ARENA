// ARENA V1.0 - Production Database Migration Script
// Adds OSM feature columns to proposals table

import { PrismaClient } from '@prisma/client'

const DATABASE_URL = "postgresql://postgres.vtckkegygfhsvobmyhto:bvx8zya5vdb.atb*AJU@aws-1-us-east-1.pooler.supabase.com:5432/postgres"

const prisma = new PrismaClient({
  datasources: {
    db: {
      url: DATABASE_URL
    }
  }
})

async function migrate() {
  console.log('🔧 Starting production database migration...')

  try {
    // Execute raw SQL to add columns
    await prisma.$executeRawUnsafe(`
      ALTER TABLE proposals
        ADD COLUMN IF NOT EXISTS osm_type VARCHAR(255),
        ADD COLUMN IF NOT EXISTS osm_id VARCHAR(255),
        ADD COLUMN IF NOT EXISTS osm_tags JSONB,
        ADD COLUMN IF NOT EXISTS feature_name VARCHAR(255);
    `)

    console.log('✅ Added OSM columns to proposals table')

    // Create indexes
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_proposals_osm_id ON proposals(osm_id);
    `)

    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS idx_proposals_osm_type ON proposals(osm_type);
    `)

    console.log('✅ Created indexes on OSM columns')

    // Verify columns exist
    const result = await prisma.$queryRawUnsafe(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'proposals'
        AND column_name IN ('osm_type', 'osm_id', 'osm_tags', 'feature_name')
      ORDER BY column_name;
    `)

    console.log('✅ Verified columns:', result)
    console.log('🎉 Migration completed successfully!')

  } catch (error) {
    console.error('❌ Migration failed:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

migrate()
