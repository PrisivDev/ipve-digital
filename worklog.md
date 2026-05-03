---
Task ID: 1
Agent: Main
Task: Migrate IPVE Digital from SQLite to Supabase PostgreSQL as primary backend + Fix RBAC permissions seed bug

Work Log:
- Verified current state: .env, schema.prisma, db.ts, supabase.ts already configured for PostgreSQL/Supabase
- Ran `prisma db push` — database already in sync with Supabase PostgreSQL
- Discovered RBAC seed bug: `permIdMap` used stored module names (LMS, ERP) while `ROLE_PERMS` used original module names (students, payments) — causing only 83/164 permissions to map
- Fixed `seedRBAC()` function: added two-step lookup — index DB permissions by stored key, then map original module names to stored IDs
- Cleaned database via Prisma deleteMany (proper FK order)
- Seeded in 4 parts to avoid Supabase connection timeout:
  - Part 1: 6 roles, 6 users, academic year, 3 filières, 6 levels, 9 subjects
  - Part 2: 4 classes, 20 students, 6 payment plans, 40 payments
  - Part 3: 59 OHADA accounts, 4 notifications, institution settings
  - Part 4: 201 permissions, 301 role-permission mappings (all roles 100% matched)
- Tested login: `admin@ipve.edu.ci / Admin@123` — returned 200 with user, JWT tokens, and all 201 permissions
- Updated seed.ts comments (164 → 201), added missing `filiere.deleteMany()` to cleanDatabase()
- Cleaned up temporary seed files (seed-part1-4.ts, clean.ts, fix.ts, check.ts)
- Committed and pushed to GitHub: `fix: RBAC permissions seed — resolve module name mapping bug`

Stage Summary:
- Supabase PostgreSQL is the active primary backend (29 tables created)
- All 201 RBAC permissions correctly mapped to 6 roles (301 total mappings)
- Login flow verified end-to-end against Supabase
- GitHub push successful: https://github.com/PrisivDev/ipve-digital.git (commit 143c04f)
- Test accounts: admin@ipve.edu.ci / Admin@123 (and 5 other demo users)
