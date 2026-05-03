import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { readFileSync } from 'fs';
import { join } from 'path';
import { extractAccessToken } from '@/lib/auth';

/**
 * POST /api/setup/sync-schema
 *
 * One-time setup endpoint that creates all missing database tables, indexes,
 * enums, and foreign keys from the Prisma schema.
 *
 * Uses idempotent SQL (IF NOT EXISTS / EXCEPTION WHEN duplicate_object)
 * so it's safe to call multiple times.
 *
 * SQL parser handles DO $$ ... END $$ blocks correctly by not splitting
 * on semicolons inside dollar-quoted strings.
 */
export async function POST(request: NextRequest) {
  // Require auth — try cookie first, then Authorization header
  const accessToken = extractAccessToken(request);
  if (!accessToken) {
    return NextResponse.json(
      { success: false, error: 'Authentification requise' },
      { status: 401 },
    );
  }

  try {
    const sqlPath = join(process.cwd(), 'prisma', 'safe-schema-sync.sql');
    const sql = readFileSync(sqlPath, 'utf-8');

    // Split SQL into statements, correctly handling DO $$ ... END $$ blocks.
    // Dollar-quoting in PostgreSQL means semicolons inside $$...$$ are NOT
    // statement separators — they're part of the anonymous code block.
    const statements = splitSqlStatements(sql);

    const errors: string[] = [];
    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (const stmt of statements) {
      const fullStmt = stmt.trimEnd();
      if (!fullStmt) continue;
      // Skip pure comment lines
      if (/^\s*(--|$)/.test(fullStmt)) continue;

      try {
        await db.$executeRawUnsafe(fullStmt);
        successCount++;
      } catch (err: unknown) {
        // Ignore "already exists" type errors (belt-and-suspenders)
        const msg = err instanceof Error ? err.message : String(err);
        if (
          msg.includes('already exists') ||
          msg.includes('duplicate') ||
          msg.includes('relation')
        ) {
          successCount++;
        } else {
          errorCount++;
          errors.push(`${getPreview(fullStmt)}: ${msg.substring(0, 150)}`);
        }
      }
    }

    return NextResponse.json({
      success: errorCount === 0,
      message: `Schéma synchronisé: ${successCount} succès, ${errorCount} erreurs sur ${successCount + errorCount} instructions`,
      stats: { successCount, errorCount },
      ...(errors.length > 0 && { errors: errors.slice(0, 20) }),
    });
  } catch (error) {
    console.error('[SETUP] Schema sync error:', error);
    return NextResponse.json(
      { success: false, error: "Erreur lors de la synchronisation du schéma" },
      { status: 500 },
    );
  }
}

// GET /api/setup/sync-schema — Check which tables exist
export async function GET(request: NextRequest) {
  const accessToken = extractAccessToken(request);
  if (!accessToken) {
    return NextResponse.json(
      { success: false, error: 'Authentification requise' },
      { status: 401 },
    );
  }

  try {
    const expectedTables = [
      'users', 'roles', 'permissions', 'role_permissions',
      'prospects', 'prospect_interactions', 'students', 'filieres', 'levels',
      'academic_years', 'classes', 'subjects', 'class_subjects', 'periods',
      'grades', 'attendance', 'schedules',
      'payment_plans', 'payment_plan_tranches', 'payments',
      'expense_categories', 'suppliers', 'expenses',
      'chart_of_accounts', 'journal_entries', 'journal_entry_lines',
      'employees', 'payroll_runs', 'payslips',
      'sync_log', 'audit_log', 'notifications',
      'admissions', 'student_cards', 'institution_settings',
    ];

    const existingTables = await db.$queryRawUnsafe(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
    `) as { table_name: string }[];

    const existingSet = new Set(existingTables.map(t => t.table_name));
    const missing = expectedTables.filter(t => !existingSet.has(t));

    return NextResponse.json({
      success: true,
      data: {
        totalExpected: expectedTables.length,
        existingCount: expectedTables.length - missing.length,
        missingCount: missing.length,
        missingTables: missing,
        allTablesExist: missing.length === 0,
      },
    });
  } catch (error) {
    console.error('[SETUP] Schema check error:', error);
    return NextResponse.json(
      { success: false, error: 'Erreur lors de la vérification du schéma' },
      { status: 500 },
    );
  }
}

/**
 * Split SQL text into individual statements, correctly handling:
 * - DO $$ ... END $$; blocks (semicolons inside are NOT separators)
 * - Standard SQL statements separated by semicolons
 * - Single-line comments (-- ...)
 */
function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = '';
  let i = 0;

  while (i < sql.length) {
    // Check for DO $$ block
    if (sql.substring(i).match(/^DO\s+\$\$/i)) {
      // Find the closing $$;
      const blockStart = i;
      i = sql.indexOf('$$;', i + 5);
      if (i === -1) {
        // No closing found, take the rest
        current += sql.substring(blockStart);
        break;
      }
      i += 3; // skip past $$;
      current += sql.substring(blockStart, i);
      statements.push(current.trim());
      current = '';
      continue;
    }

    // Check for single-line comment
    if (sql[i] === '-' && sql[i + 1] === '-') {
      const endOfLine = sql.indexOf('\n', i);
      if (endOfLine === -1) {
        current += sql.substring(i);
        break;
      }
      current += sql.substring(i, endOfLine + 1);
      i = endOfLine + 1;
      continue;
    }

    // Statement separator
    if (sql[i] === ';') {
      current += ';';
      statements.push(current.trim());
      current = '';
      i++;
      continue;
    }

    current += sql[i];
    i++;
  }

  // Remaining content
  if (current.trim()) {
    statements.push(current.trim());
  }

  return statements.filter(s => s.length > 0);
}

function getPreview(sql: string): string {
  const match = sql.match(
    /CREATE\s+(TYPE|TABLE|UNIQUE\s+INDEX|INDEX)|ALTER\s+TABLE|DO\s+\$\$/i,
  );
  if (match) {
    const nameMatch = sql.match(/"(\w+)"/);
    const name = nameMatch ? nameMatch[1] : '';
    return `${match[0].toUpperCase().replace(/\s+/g, ' ')} ${name}`.substring(0, 80);
  }
  return sql.substring(0, 80);
}
