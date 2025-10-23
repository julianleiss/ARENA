// ARENA - Database Seeder (iteration 0 - no-op)
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.warn('[seed] no-op (iteration 0)')
  console.log('ℹ️  Database seeding will be implemented in future iterations')
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
