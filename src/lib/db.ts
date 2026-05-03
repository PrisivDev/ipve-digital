import { readFileSync } from 'fs'
import { join } from 'path'
import { PrismaClient } from '@prisma/client'

/**
 * IPVE Digital — Prisma Client (Supabase PostgreSQL)
 *
 * Singleton pattern to prevent multiple instances during hot-reload.
 *
 * IMPORTANT: We explicitly read DATABASE_URL from .env to avoid
 * system-level env vars (like SQLite defaults) overriding our config.
 */

function readEnvUrl(varName: string): string | undefined {
  try {
    const envPath = join(process.cwd(), '.env')
    const envContent = readFileSync(envPath, 'utf-8')
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim()
      if (trimmed.startsWith(`${varName}=`) && !trimmed.startsWith('#')) {
        return trimmed.substring(`${varName}=`.length)
      }
    }
  } catch {
    // .env not found
  }
  return undefined
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasourceUrl: readEnvUrl('DATABASE_URL'),
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
