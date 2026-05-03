/**
 * IPVE Digital — Supabase Configuration
 *
 * This project uses Supabase as a PostgreSQL host only.
 * All database operations go through Prisma Client (src/lib/db.ts).
 *
 * The Supabase JS client is NOT used for:
 *   - Authentication (custom JWT via jose)
 *   - Realtime subscriptions
 *   - Storage (file uploads)
 *   - Row-Level Security
 *
 * If you need Supabase features beyond raw PostgreSQL, you can
 * import and use the client here:
 *
 *   import { createClient } from '@supabase/supabase-js'
 *   export const supabase = createClient(
 *     process.env.NEXT_PUBLIC_SUPABASE_URL!,
 *     process.env.SUPABASE_SERVICE_ROLE_KEY!
 *   )
 */
