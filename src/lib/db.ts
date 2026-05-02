import { PrismaClient } from '@prisma/client'

/**
 * Prisma client singleton using globalThis pattern.
 *
 * Prevents multiple instances during hot-reloading in development.
 * Uses SQLite via file:./db.sqlite database URL.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
