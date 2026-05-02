import { readFileSync } from 'fs'
import { join } from 'path'
import { PrismaClient } from '@prisma/client'

/**
 * Prisma client singleton using globalThis pattern.
 * Prevents multiple instances during hot-reloading in development.
 *
 * IMPORTANT: System-level DATABASE_URL may override .env values.
 * We explicitly read .env and force DATABASE_URL for Prisma.
 */
let supabaseUrl: string | undefined

try {
  const envPath = join(process.cwd(), '.env')
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('DATABASE_URL=') && !trimmed.startsWith('#')) {
      supabaseUrl = trimmed.substring('DATABASE_URL='.length)
      break
    }
  }
} catch {
  // .env not found, will use process.env.DATABASE_URL
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasourceUrl: supabaseUrl,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
