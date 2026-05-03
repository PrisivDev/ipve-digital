import { readFileSync } from 'fs'
import { join, resolve } from 'path'
import { PrismaClient } from '@prisma/client'

/**
 * Prisma client singleton using globalThis pattern.
 * Prevents multiple instances during hot-reloading in development.
 *
 * Reads DATABASE_URL from .env and resolves relative SQLite paths
 * from the project root directory (where package.json lives).
 */
let resolvedDbUrl: string | undefined

try {
  const envPath = join(process.cwd(), '.env')
  const envContent = readFileSync(envPath, 'utf-8')
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim()
    if (trimmed.startsWith('DATABASE_URL=') && !trimmed.startsWith('#')) {
      let url = trimmed.substring('DATABASE_URL='.length)

      // For SQLite relative paths (file:./... or file:../...), resolve from CWD
      if (url.startsWith('file:./') || url.startsWith('file:../')) {
        const relativePath = url.substring('file:'.length) // e.g. "./db/custom.db"
        const absolutePath = resolve(process.cwd(), relativePath) // e.g. "/home/z/my-project/db/custom.db"
        url = `file:${absolutePath}`
      }

      resolvedDbUrl = url
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
    datasourceUrl: resolvedDbUrl,
  })

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db
}
