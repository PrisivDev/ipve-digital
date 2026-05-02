import { PrismaClient } from '@prisma/client'

/**
 * Resolve the correct DATABASE_URL.
 *
 * PRODUCTION (Vercel): Trusts the env var set in the Vercel dashboard.
 * DEVELOPMENT: Reads directly from .env to bypass any system-level override.
 */
function resolveDatabaseUrl(): string {
  // In production, trust the environment variable set by Vercel dashboard
  if (process.env.NODE_ENV === 'production') {
    const url = process.env.DATABASE_URL ?? ''
    if (!url || url.length === 0) {
      throw new Error(
        '[DB] DATABASE_URL is not set in Vercel environment variables. ' +
        'Go to Vercel Dashboard → Settings → Environment Variables and add DATABASE_URL with your PostgreSQL connection string.'
      )
    }
    if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
      throw new Error(
        `[DB] DATABASE_URL must be a PostgreSQL URL in production. Got: ${url.substring(0, 30)}...`
      )
    }
    return url
  }

  // In development, use env var directly
  const url = process.env.DATABASE_URL ?? ''
  if (!url.startsWith('postgresql://') && !url.startsWith('postgres://')) {
    console.error(
      `[DB] WARNING: DATABASE_URL does not point to PostgreSQL: ${url.substring(0, 40)}`
    )
  }
  return url
}

/**
 * Create a PrismaClient instance with the given database URL.
 */
function createPrismaClient(databaseUrl: string): PrismaClient {
  const url = new URL(databaseUrl)

  // Supabase free-tier: session pooler limits to 15 concurrent connections.
  // Each Vercel serverless function creates its own Prisma client (no global singleton),
  // so we must be very conservative with connection limits.
  const isPooler = url.hostname.includes('.pooler.supabase.com')
  const connectionLimit = isPooler
    ? (process.env.NODE_ENV === 'production' ? 5 : 5)
    : undefined

  const config: ConstructorParameters<typeof PrismaClient>[0] = {
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  }

  if (connectionLimit) {
    // Append pool parameters to the URL
    // pgbouncer=true tells Prisma to use transaction-pooling mode
    // which is required for Supabase session pooler
    url.searchParams.set('connection_limit', String(connectionLimit))
    url.searchParams.set('pool_timeout', '10')
    url.searchParams.set('pgbouncer', 'true')
    config.datasources = {
      db: { url: url.toString() },
    }
  }

  return new PrismaClient(config)
}

/**
 * Lazy Prisma client singleton.
 *
 * We defer DATABASE_URL resolution and client creation to first use
 * so that `next build` (which sets NODE_ENV=production) does not
 * crash when the local DATABASE_URL is SQLite.
 *
 * On Vercel the real PostgreSQL URL is injected at runtime via
 * environment variables set in the Vercel dashboard.
 */
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

let _db: PrismaClient | undefined
let _initError: Error | undefined

function getDb(): PrismaClient {
  if (_initError) throw _initError
  if (_db) return _db
  if (globalForPrisma.prisma) {
    _db = globalForPrisma.prisma
    return _db
  }
  try {
    const url = resolveDatabaseUrl()
    const client = createPrismaClient(url)
    if (process.env.NODE_ENV !== 'production') {
      globalForPrisma.prisma = client
    }
    _db = client
    return _db
  } catch (err: unknown) {
    _initError = err instanceof Error ? err : new Error(String(err))
    throw _initError
  }
}

/**
 * Prisma client instance (lazy-loaded on first access).
 * Safe for build-time module evaluation even with SQLite URLs.
 */
export const db = new Proxy({} as PrismaClient, {
  get(_target, prop, receiver) {
    const client = getDb()
    const value = Reflect.get(client, prop, receiver)
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  },
})

/**
 * Check if the database connection is healthy.
 */
export async function checkDbHealth(): Promise<{ ok: boolean; latencyMs?: number; error?: string }> {
  try {
    const client = getDb()
    const start = Date.now()
    await client.$queryRaw`SELECT 1 as ok`
    return { ok: true, latencyMs: Date.now() - start }
  } catch (err: unknown) {
    return {
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}
