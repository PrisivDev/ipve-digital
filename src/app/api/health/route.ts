import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checks: Record<string, string | boolean | number> = {
    status: 'ok',
    nodeEnv: process.env.NODE_ENV ?? 'unknown',
    database: 'SQLite (Prisma)',
    vercel: !!process.env.VERCEL,
    region: process.env.VERCEL_REGION ?? 'local',
  };

  // Test DB connection using the shared health check
  const { checkDbHealth, db } = await import('@/lib/db');
  const health = await checkDbHealth();
  checks.dbConnected = health.ok;
  if (health.latencyMs !== undefined) checks.dbLatencyMs = health.latencyMs;
  if (health.error) checks.dbError = health.error;

  // Check which tables exist in the database
  try {
    const tables = [
      'users', 'roles', 'permissions', 'role_permissions',
      'students', 'prospects', 'prospect_interactions',
      'filieres', 'levels', 'classes', 'subjects', 'class_subjects',
      'academic_years', 'periods', 'grades', 'attendance', 'schedules',
      'payment_plans', 'payment_plan_tranches', 'payments',
      'expense_categories', 'suppliers', 'expenses',
      'chart_of_accounts', 'journal_entries', 'journal_entry_lines',
      'employees', 'payroll_runs', 'payslips',
      'notifications', 'audit_log', 'sync_log',
      'admissions', 'student_cards', 'institution_settings',
    ];

    const tableResults: Record<string, boolean> = {};
    for (const table of tables) {
      try {
        await db.$queryRawUnsafe(`SELECT 1 FROM "${table}" LIMIT 1`);
        tableResults[table] = true;
      } catch {
        tableResults[table] = false;
      }
    }

    const missing = Object.entries(tableResults)
      .filter(([, exists]) => !exists)
      .map(([name]) => name);

    checks.tablesTotal = tables.length;
    checks.tablesExisting = tables.length - missing.length;
    checks.tablesMissing = missing.length;
    checks.missingTables = missing;
  } catch (err) {
    checks.tableCheckError = err instanceof Error ? err.message : String(err);
  }

  return NextResponse.json(checks);
}
