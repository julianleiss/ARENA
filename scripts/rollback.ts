// ARENA - Database Rollback Script (iteration 1)
// Clear all data from database (use with caution!)
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('⚠️  Rolling back database...')
  console.log('⚠️  This will delete ALL data!')

  // Delete in order to respect foreign key constraints
  await prisma.metric.deleteMany()
  console.log('✅ Deleted metrics')

  await prisma.comment.deleteMany()
  console.log('✅ Deleted comments')

  await prisma.vote.deleteMany()
  console.log('✅ Deleted votes')

  await prisma.proposal.deleteMany()
  console.log('✅ Deleted proposals')

  await prisma.pOI.deleteMany()
  console.log('✅ Deleted POIs')

  await prisma.auditLog.deleteMany()
  console.log('✅ Deleted audit logs')

  await prisma.user.deleteMany()
  console.log('✅ Deleted users')

  console.log('🎉 Rollback completed successfully!')
  console.log('💡 Run `npm run db:seed` to populate with fresh data')
}

main()
  .catch((e) => {
    console.error('❌ Rollback failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
