// ARENA V1.0 - Prisma Client Singleton (Iteration 10)
// Reusable Prisma client with hot-reload protection

import { PrismaClient } from '@prisma/client'

/**
 * Prisma Client singleton
 * Prevents multiple instances during Next.js hot reload in development
 */

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

// Default export for convenience
export default prisma
