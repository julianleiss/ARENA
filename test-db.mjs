import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient({
  log: ['error', 'warn'],
})

console.log('🔍 Testing Supabase connection...\n')

try {
  await prisma.$connect()
  console.log('✅ Connection successful!')
  
  const result = await prisma.$queryRaw`SELECT NOW()`
  console.log('✅ Query executed:', result)
  
} catch (error) {
  console.error('❌ Error:', error.message)
} finally {
  await prisma.$disconnect()
}
