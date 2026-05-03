import { readFileSync } from 'fs'
import { join } from 'path'
import { PrismaClient } from '@prisma/client'

/**
 * IPVE Digital — Prisma Client (Supabase PostgreSQL)
 *
 * Singleton pattern to prevent multiple instances during hot-reload.
 *
 * IMPORTANT: We explicitly read DATABASE_URL from the .env file because
 * some hosting environments inject a default DATABASE_URL that points to
 * a local SQLite file. Reading directly from .env ensures we always use
 * the configured Supabase PostgreSQL connection.
 */

function readEnvUrl(varName: string): string | undefined {
  try {
    const envPath = join(process.cwd(), '.env')
    const envContent = readFileSync(envPath, 'utf-8')
    for (const line of envContent.split('\n')) {
      const trimmed = line.trim()
      // Skip comments and empty lines
      if (!trimmed || trimmed.startsWith('#')) continue
      const eqIdx = trimmed.indexOf('=')
      if (eqIdx === -1) continue
      const key = trimmed.substring(0, eqIdx).trim()
      if (key === varName) {
        // Handle quoted values: DATABASE_URL="postgres://..." or DATABASE_URL='...'
        let val = trimmed.substring(eqIdx + 1).trim()
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1)
        }
        // Strip inline comments: DATABASE_URL=postgres://... # comment
        const hashIdx = val.indexOf(' #')
        if (hashIdx !== -1) val = val.substring(0, hashIdx).trim()
        return val
      }
    }
  } catch {
    // .env not found — let Prisma use process.env as fallback
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

/**
 * Health check for the database connection.
 * Returns { ok, latencyMs, error? }
 */
export async function checkDbHealth(): Promise<{ ok: boolean; latencyMs: number; error?: string }> {
  const start = Date.now()
  try {
    await db.$queryRaw`SELECT 1`
    return { ok: true, latencyMs: Date.now() - start }
  } catch (err) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
