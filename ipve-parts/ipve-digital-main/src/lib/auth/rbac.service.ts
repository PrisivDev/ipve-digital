/**
 * RBAC (Role-Based Access Control) Service
 * IPVE Digital - School Management System
 *
 * 164 permissions across 14 modules, 6 roles with granular access control.
 * Server-side only module.
 *
 * Modules: students, payments, grades, accounting, hr, payroll, reports,
 *          settings, users, schedule, attendance, documents, notifications, crm
 *
 * Roles:    ADMIN, ACCOUNTANT (Comptable), CASHIER (Caissier),
 *           SECRETARY (Secrétaire), TEACHER (Enseignant), STUDENT (Étudiant)
 */

import type { PrismaClient } from '@prisma/client';
import { PermissionModule, PermissionAction } from '@prisma/client';
import { db } from '@/lib/db';

// ============================================================================
// Types
// ============================================================================

/** Single permission definition with database-mappable fields. */
export interface PermissionEntry {
  /** Logical module name (e.g., 'students', 'payments') */
  module: string;
  /** Specific resource within the module (e.g., 'students', 'enrollments') */
  resource: string;
  /** Action name in lowercase (create, read, update, delete, export, validate) */
  action: string;
  /** Prisma PermissionModule enum value for database storage */
  dbModule: PermissionModule;
  /** Human-readable description */
  description: string;
}

/** System role names (maps to RoleName enum in Prisma schema). */
export type SystemRole =
  | 'ADMIN'
  | 'ACCOUNTANT'
  | 'CASHIER'
  | 'SECRETARY'
  | 'TEACHER'
  | 'STUDENT';

// ============================================================================
// Module → PermissionModule Enum Mapping
// ============================================================================

/**
 * Maps logical modules to their Prisma PermissionModule enum values.
 * The schema has 5 enum values (CRM, ERP, LMS, SETTINGS, REPORTS)
 * covering the 14 logical modules.
 */
const MODULE_TO_DB_MODULE: Record<string, PermissionModule> = {
  // LMS – Learning Management
  students: 'LMS',
  grades: 'LMS',
  schedule: 'LMS',
  attendance: 'LMS',
  documents: 'LMS',
  notifications: 'LMS',
  // ERP – Enterprise Resource Planning
  payments: 'ERP',
  accounting: 'ERP',
  hr: 'ERP',
  payroll: 'ERP',
  // CRM – Customer Relationship Management
  crm: 'CRM',
  // REPORTS
  reports: 'REPORTS',
  // SETTINGS
  settings: 'SETTINGS',
  users: 'SETTINGS',
} as const;

// ============================================================================
// Permission Definitions (164 permissions across 14 modules)
// ============================================================================
//
// Distribution:
//   students    : 12   (students×6 + enrollments×6)
//   payments    : 11   (payments×6 + invoices×5)
//   grades      : 11   (grades×6 + report_cards×5)
//   accounting  : 15   (accounting×6 + budgets×5 + journal_entries×4)
//   hr          : 16   (employees×6 + contracts×5 + leave_requests×5)
//   payroll     : 11   (payroll×6 + salary_slips×5)
//   reports     : 12   (6 report types × read+export)
//   settings    :  8   (4 setting groups × read+update)
//   users       : 10   (users×5 + roles×4 + audit_logs×1)
//   schedule    : 14   (schedule×5 + classes×6 + rooms×3)
//   attendance  :  9   (attendance×6 + attendance_excuses×3)
//   documents   : 10   (documents×5 + document_templates×5)
//   notifications:  9  (notifications×5 + notification_templates×4)
//   crm         : 16   (contacts×5 + campaigns×5 + leads×6)
//   ─────────────────
//   TOTAL       : 164
// ============================================================================

interface PermissionDef {
  module: string;
  resource: string;
  action: string;
  description: string;
}

const PERMISSION_DEFINITIONS: PermissionDef[] = [
  // ── Students Module (12) ─────────────────────────────────────────────
  { module: 'students', resource: 'students', action: 'create', description: 'Create student records' },
  { module: 'students', resource: 'students', action: 'read', description: 'View student records' },
  { module: 'students', resource: 'students', action: 'update', description: 'Update student records' },
  { module: 'students', resource: 'students', action: 'delete', description: 'Delete student records' },
  { module: 'students', resource: 'students', action: 'export', description: 'Export student records' },
  { module: 'students', resource: 'students', action: 'validate', description: 'Validate student enrollment' },
  { module: 'students', resource: 'enrollments', action: 'create', description: 'Create enrollment records' },
  { module: 'students', resource: 'enrollments', action: 'read', description: 'View enrollment records' },
  { module: 'students', resource: 'enrollments', action: 'update', description: 'Update enrollment records' },
  { module: 'students', resource: 'enrollments', action: 'delete', description: 'Delete enrollment records' },
  { module: 'students', resource: 'enrollments', action: 'export', description: 'Export enrollment records' },
  { module: 'students', resource: 'enrollments', action: 'validate', description: 'Validate enrollment records' },

  // ── Payments Module (11) ─────────────────────────────────────────────
  { module: 'payments', resource: 'payments', action: 'create', description: 'Create payment records' },
  { module: 'payments', resource: 'payments', action: 'read', description: 'View payment records' },
  { module: 'payments', resource: 'payments', action: 'update', description: 'Update payment records' },
  { module: 'payments', resource: 'payments', action: 'delete', description: 'Delete payment records' },
  { module: 'payments', resource: 'payments', action: 'export', description: 'Export payment records' },
  { module: 'payments', resource: 'payments', action: 'validate', description: 'Validate payment records' },
  { module: 'payments', resource: 'invoices', action: 'create', description: 'Create invoices' },
  { module: 'payments', resource: 'invoices', action: 'read', description: 'View invoices' },
  { module: 'payments', resource: 'invoices', action: 'update', description: 'Update invoices' },
  { module: 'payments', resource: 'invoices', action: 'delete', description: 'Delete invoices' },
  { module: 'payments', resource: 'invoices', action: 'export', description: 'Export invoices' },

  // ── Grades Module (11) ───────────────────────────────────────────────
  { module: 'grades', resource: 'grades', action: 'create', description: 'Create grade entries' },
  { module: 'grades', resource: 'grades', action: 'read', description: 'View grade entries' },
  { module: 'grades', resource: 'grades', action: 'update', description: 'Update grade entries' },
  { module: 'grades', resource: 'grades', action: 'delete', description: 'Delete grade entries' },
  { module: 'grades', resource: 'grades', action: 'export', description: 'Export grade entries' },
  { module: 'grades', resource: 'grades', action: 'validate', description: 'Validate grade entries' },
  { module: 'grades', resource: 'report_cards', action: 'create', description: 'Create report cards' },
  { module: 'grades', resource: 'report_cards', action: 'read', description: 'View report cards' },
  { module: 'grades', resource: 'report_cards', action: 'update', description: 'Update report cards' },
  { module: 'grades', resource: 'report_cards', action: 'delete', description: 'Delete report cards' },
  { module: 'grades', resource: 'report_cards', action: 'export', description: 'Export report cards' },

  // ── Accounting Module (15) ───────────────────────────────────────────
  { module: 'accounting', resource: 'accounting', action: 'create', description: 'Create accounting entries' },
  { module: 'accounting', resource: 'accounting', action: 'read', description: 'View accounting entries' },
  { module: 'accounting', resource: 'accounting', action: 'update', description: 'Update accounting entries' },
  { module: 'accounting', resource: 'accounting', action: 'delete', description: 'Delete accounting entries' },
  { module: 'accounting', resource: 'accounting', action: 'export', description: 'Export accounting entries' },
  { module: 'accounting', resource: 'accounting', action: 'validate', description: 'Validate accounting entries' },
  { module: 'accounting', resource: 'budgets', action: 'create', description: 'Create budgets' },
  { module: 'accounting', resource: 'budgets', action: 'read', description: 'View budgets' },
  { module: 'accounting', resource: 'budgets', action: 'update', description: 'Update budgets' },
  { module: 'accounting', resource: 'budgets', action: 'delete', description: 'Delete budgets' },
  { module: 'accounting', resource: 'budgets', action: 'export', description: 'Export budgets' },
  { module: 'accounting', resource: 'journal_entries', action: 'create', description: 'Create journal entries' },
  { module: 'accounting', resource: 'journal_entries', action: 'read', description: 'View journal entries' },
  { module: 'accounting', resource: 'journal_entries', action: 'update', description: 'Update journal entries' },
  { module: 'accounting', resource: 'journal_entries', action: 'delete', description: 'Delete journal entries' },

  // ── HR Module (16) ───────────────────────────────────────────────────
  { module: 'hr', resource: 'employees', action: 'create', description: 'Create employee records' },
  { module: 'hr', resource: 'employees', action: 'read', description: 'View employee records' },
  { module: 'hr', resource: 'employees', action: 'update', description: 'Update employee records' },
  { module: 'hr', resource: 'employees', action: 'delete', description: 'Delete employee records' },
  { module: 'hr', resource: 'employees', action: 'export', description: 'Export employee records' },
  { module: 'hr', resource: 'employees', action: 'validate', description: 'Validate employee records' },
  { module: 'hr', resource: 'contracts', action: 'create', description: 'Create contracts' },
  { module: 'hr', resource: 'contracts', action: 'read', description: 'View contracts' },
  { module: 'hr', resource: 'contracts', action: 'update', description: 'Update contracts' },
  { module: 'hr', resource: 'contracts', action: 'delete', description: 'Delete contracts' },
  { module: 'hr', resource: 'contracts', action: 'export', description: 'Export contracts' },
  { module: 'hr', resource: 'leave_requests', action: 'create', description: 'Create leave requests' },
  { module: 'hr', resource: 'leave_requests', action: 'read', description: 'View leave requests' },
  { module: 'hr', resource: 'leave_requests', action: 'update', description: 'Update leave requests' },
  { module: 'hr', resource: 'leave_requests', action: 'delete', description: 'Delete leave requests' },
  { module: 'hr', resource: 'leave_requests', action: 'export', description: 'Export leave requests' },

  // ── Payroll Module (11) ──────────────────────────────────────────────
  { module: 'payroll', resource: 'payroll', action: 'create', description: 'Create payroll runs' },
  { module: 'payroll', resource: 'payroll', action: 'read', description: 'View payroll runs' },
  { module: 'payroll', resource: 'payroll', action: 'update', description: 'Update payroll runs' },
  { module: 'payroll', resource: 'payroll', action: 'delete', description: 'Delete payroll runs' },
  { module: 'payroll', resource: 'payroll', action: 'export', description: 'Export payroll runs' },
  { module: 'payroll', resource: 'payroll', action: 'validate', description: 'Validate payroll runs' },
  { module: 'payroll', resource: 'salary_slips', action: 'create', description: 'Create salary slips' },
  { module: 'payroll', resource: 'salary_slips', action: 'read', description: 'View salary slips' },
  { module: 'payroll', resource: 'salary_slips', action: 'update', description: 'Update salary slips' },
  { module: 'payroll', resource: 'salary_slips', action: 'delete', description: 'Delete salary slips' },
  { module: 'payroll', resource: 'salary_slips', action: 'export', description: 'Export salary slips' },

  // ── Reports Module (12) ──────────────────────────────────────────────
  { module: 'reports', resource: 'reports_students', action: 'read', description: 'Read student reports' },
  { module: 'reports', resource: 'reports_students', action: 'export', description: 'Export student reports' },
  { module: 'reports', resource: 'reports_financial', action: 'read', description: 'Read financial reports' },
  { module: 'reports', resource: 'reports_financial', action: 'export', description: 'Export financial reports' },
  { module: 'reports', resource: 'reports_academic', action: 'read', description: 'Read academic reports' },
  { module: 'reports', resource: 'reports_academic', action: 'export', description: 'Export academic reports' },
  { module: 'reports', resource: 'reports_attendance', action: 'read', description: 'Read attendance reports' },
  { module: 'reports', resource: 'reports_attendance', action: 'export', description: 'Export attendance reports' },
  { module: 'reports', resource: 'reports_hr', action: 'read', description: 'Read HR reports' },
  { module: 'reports', resource: 'reports_hr', action: 'export', description: 'Export HR reports' },
  { module: 'reports', resource: 'reports_general', action: 'read', description: 'Read general reports' },
  { module: 'reports', resource: 'reports_general', action: 'export', description: 'Export general reports' },

  // ── Settings Module (8) ──────────────────────────────────────────────
  { module: 'settings', resource: 'settings_general', action: 'read', description: 'Read general settings' },
  { module: 'settings', resource: 'settings_general', action: 'update', description: 'Update general settings' },
  { module: 'settings', resource: 'settings_academic', action: 'read', description: 'Read academic settings' },
  { module: 'settings', resource: 'settings_academic', action: 'update', description: 'Update academic settings' },
  { module: 'settings', resource: 'settings_system', action: 'read', description: 'Read system settings' },
  { module: 'settings', resource: 'settings_system', action: 'update', description: 'Update system settings' },
  { module: 'settings', resource: 'settings_billing', action: 'read', description: 'Read billing settings' },
  { module: 'settings', resource: 'settings_billing', action: 'update', description: 'Update billing settings' },

  // ── Users Module (10) ────────────────────────────────────────────────
  { module: 'users', resource: 'users', action: 'create', description: 'Create user accounts' },
  { module: 'users', resource: 'users', action: 'read', description: 'View user accounts' },
  { module: 'users', resource: 'users', action: 'update', description: 'Update user accounts' },
  { module: 'users', resource: 'users', action: 'delete', description: 'Delete user accounts' },
  { module: 'users', resource: 'users', action: 'export', description: 'Export user accounts' },
  { module: 'users', resource: 'roles', action: 'create', description: 'Create roles' },
  { module: 'users', resource: 'roles', action: 'read', description: 'View roles' },
  { module: 'users', resource: 'roles', action: 'update', description: 'Update roles' },
  { module: 'users', resource: 'roles', action: 'delete', description: 'Delete roles' },
  { module: 'users', resource: 'audit_logs', action: 'read', description: 'View audit logs' },

  // ── Schedule Module (14) ─────────────────────────────────────────────
  { module: 'schedule', resource: 'schedule', action: 'create', description: 'Create schedule entries' },
  { module: 'schedule', resource: 'schedule', action: 'read', description: 'View schedule entries' },
  { module: 'schedule', resource: 'schedule', action: 'update', description: 'Update schedule entries' },
  { module: 'schedule', resource: 'schedule', action: 'delete', description: 'Delete schedule entries' },
  { module: 'schedule', resource: 'schedule', action: 'export', description: 'Export schedule entries' },
  { module: 'schedule', resource: 'classes', action: 'create', description: 'Create classes' },
  { module: 'schedule', resource: 'classes', action: 'read', description: 'View classes' },
  { module: 'schedule', resource: 'classes', action: 'update', description: 'Update classes' },
  { module: 'schedule', resource: 'classes', action: 'delete', description: 'Delete classes' },
  { module: 'schedule', resource: 'classes', action: 'export', description: 'Export classes' },
  { module: 'schedule', resource: 'classes', action: 'validate', description: 'Validate classes' },
  { module: 'schedule', resource: 'rooms', action: 'create', description: 'Create rooms' },
  { module: 'schedule', resource: 'rooms', action: 'read', description: 'View rooms' },
  { module: 'schedule', resource: 'rooms', action: 'update', description: 'Update rooms' },

  // ── Attendance Module (9) ────────────────────────────────────────────
  { module: 'attendance', resource: 'attendance', action: 'create', description: 'Create attendance records' },
  { module: 'attendance', resource: 'attendance', action: 'read', description: 'View attendance records' },
  { module: 'attendance', resource: 'attendance', action: 'update', description: 'Update attendance records' },
  { module: 'attendance', resource: 'attendance', action: 'delete', description: 'Delete attendance records' },
  { module: 'attendance', resource: 'attendance', action: 'export', description: 'Export attendance records' },
  { module: 'attendance', resource: 'attendance', action: 'validate', description: 'Validate attendance records' },
  { module: 'attendance', resource: 'attendance_excuses', action: 'create', description: 'Create attendance excuses' },
  { module: 'attendance', resource: 'attendance_excuses', action: 'read', description: 'View attendance excuses' },
  { module: 'attendance', resource: 'attendance_excuses', action: 'update', description: 'Update attendance excuses' },

  // ── Documents Module (10) ────────────────────────────────────────────
  { module: 'documents', resource: 'documents', action: 'create', description: 'Create documents' },
  { module: 'documents', resource: 'documents', action: 'read', description: 'View documents' },
  { module: 'documents', resource: 'documents', action: 'update', description: 'Update documents' },
  { module: 'documents', resource: 'documents', action: 'delete', description: 'Delete documents' },
  { module: 'documents', resource: 'documents', action: 'export', description: 'Export documents' },
  { module: 'documents', resource: 'document_templates', action: 'create', description: 'Create document templates' },
  { module: 'documents', resource: 'document_templates', action: 'read', description: 'View document templates' },
  { module: 'documents', resource: 'document_templates', action: 'update', description: 'Update document templates' },
  { module: 'documents', resource: 'document_templates', action: 'delete', description: 'Delete document templates' },
  { module: 'documents', resource: 'document_templates', action: 'export', description: 'Export document templates' },

  // ── Notifications Module (9) ─────────────────────────────────────────
  { module: 'notifications', resource: 'notifications', action: 'create', description: 'Create notifications' },
  { module: 'notifications', resource: 'notifications', action: 'read', description: 'View notifications' },
  { module: 'notifications', resource: 'notifications', action: 'update', description: 'Update notifications' },
  { module: 'notifications', resource: 'notifications', action: 'delete', description: 'Delete notifications' },
  { module: 'notifications', resource: 'notifications', action: 'export', description: 'Export notifications' },
  { module: 'notifications', resource: 'notification_templates', action: 'create', description: 'Create notification templates' },
  { module: 'notifications', resource: 'notification_templates', action: 'read', description: 'View notification templates' },
  { module: 'notifications', resource: 'notification_templates', action: 'update', description: 'Update notification templates' },
  { module: 'notifications', resource: 'notification_templates', action: 'delete', description: 'Delete notification templates' },

  // ── CRM Module (16) ──────────────────────────────────────────────────
  { module: 'crm', resource: 'contacts', action: 'create', description: 'Create contacts' },
  { module: 'crm', resource: 'contacts', action: 'read', description: 'View contacts' },
  { module: 'crm', resource: 'contacts', action: 'update', description: 'Update contacts' },
  { module: 'crm', resource: 'contacts', action: 'delete', description: 'Delete contacts' },
  { module: 'crm', resource: 'contacts', action: 'export', description: 'Export contacts' },
  { module: 'crm', resource: 'campaigns', action: 'create', description: 'Create campaigns' },
  { module: 'crm', resource: 'campaigns', action: 'read', description: 'View campaigns' },
  { module: 'crm', resource: 'campaigns', action: 'update', description: 'Update campaigns' },
  { module: 'crm', resource: 'campaigns', action: 'delete', description: 'Delete campaigns' },
  { module: 'crm', resource: 'campaigns', action: 'export', description: 'Export campaigns' },
  { module: 'crm', resource: 'leads', action: 'create', description: 'Create leads' },
  { module: 'crm', resource: 'leads', action: 'read', description: 'View leads' },
  { module: 'crm', resource: 'leads', action: 'update', description: 'Update leads' },
  { module: 'crm', resource: 'leads', action: 'delete', description: 'Delete leads' },
  { module: 'crm', resource: 'leads', action: 'export', description: 'Export leads' },
  { module: 'crm', resource: 'leads', action: 'validate', description: 'Validate leads' },
];

// ============================================================================
// PERMISSIONS Map
// ============================================================================

/**
 * All 164 system permissions as a Map.
 *
 * Key format: `{module}.{resource}.{action}`
 *   e.g., `students.enrollments.create`, `accounting.budgets.read`
 *
 * ADMIN role has all 164 permissions.
 * Other roles have a curated subset – see ROLE_PERMISSIONS.
 */
export const PERMISSIONS: Map<string, PermissionEntry> = new Map(
  PERMISSION_DEFINITIONS.map((def) => {
    const key = `${def.module}.${def.resource}.${def.action}`;
    return [
      key,
      {
        module: def.module,
        resource: def.resource,
        action: def.action,
        dbModule: MODULE_TO_DB_MODULE[def.module],
        description: def.description,
      } satisfies PermissionEntry,
    ];
  }),
);

// ============================================================================
// Helpers for building permission key lists
// ============================================================================

/** Build a permission key: `module.resource.action` */
function p(module: string, resource: string, action: string): string {
  return `${module}.${resource}.${action}`;
}

/** Return all permission keys for a given logical module. */
function moduleKeys(module: string): string[] {
  const keys: string[] = [];
  for (const [key, entry] of PERMISSIONS) {
    if (entry.module === module) keys.push(key);
  }
  return keys;
}

/** Return permission keys for a specific resource with given actions. */
function resourceKeys(
  module: string,
  resource: string,
  actions: string[],
): string[] {
  return actions.map((a) => p(module, resource, a));
}

// Pre-built module key sets (used in role definitions below)
const STUDENTS_ALL = moduleKeys('students');                    // 12
const PAYMENTS_ALL = moduleKeys('payments');                    // 11
const GRADES_ALL = moduleKeys('grades');                        // 11
const ACCOUNTING_ALL = moduleKeys('accounting');                // 15
const HR_ALL = moduleKeys('hr');                                // 16
const PAYROLL_ALL = moduleKeys('payroll');                      // 11
const REPORTS_ALL = moduleKeys('reports');                      // 12
const SETTINGS_ALL = moduleKeys('settings');                    //  8
const USERS_ALL = moduleKeys('users');                          // 10
const SCHEDULE_ALL = moduleKeys('schedule');                    // 14
const ATTENDANCE_ALL = moduleKeys('attendance');                //  9
const DOCUMENTS_ALL = moduleKeys('documents');                  // 10
const NOTIFICATIONS_ALL = moduleKeys('notifications');          //  9
const CRM_ALL = moduleKeys('crm');                              // 16
const ALL_PERMISSION_KEYS = Array.from(PERMISSIONS.keys());     // 164

// ============================================================================
// ROLE_PERMISSIONS – Role → Permission Keys mapping
// ============================================================================

/**
 * Maps each system role to its set of permission keys.
 *
 * Role breakdown:
 *   ADMIN      : 164 – Full system access
 *   ACCOUNTANT :  33 – Accounting, payments, financial reports, billing settings
 *   CASHIER    :   6 – Payments (create/read/update), invoices (create/read), financial reports (read)
 *   SECRETARY  :  31 – Students, CRM, schedule (read), attendance (read), notifications (read)
 *   TEACHER    :  22 – Grades, attendance, schedule (read), students (read)
 *   STUDENT    :   5 – Own grades, attendance, schedule, payments, documents (read only)
 */
export const ROLE_PERMISSIONS: Record<SystemRole, string[]> = {
  ADMIN: ALL_PERMISSION_KEYS,

  ACCOUNTANT: [
    // All accounting permissions (15)
    ...ACCOUNTING_ALL,
    // All payments permissions (11)
    ...PAYMENTS_ALL,
    // Financial reports (2)
    p('reports', 'reports_financial', 'read'),
    p('reports', 'reports_financial', 'export'),
    // General reports (2)
    p('reports', 'reports_general', 'read'),
    p('reports', 'reports_general', 'export'),
    // Billing settings (2)
    p('settings', 'settings_billing', 'read'),
    p('settings', 'settings_billing', 'update'),
    // General settings – read only (1)
    p('settings', 'settings_general', 'read'),
  ],

  CASHIER: [
    // Payments – create, read, update (3)
    p('payments', 'payments', 'create'),
    p('payments', 'payments', 'read'),
    p('payments', 'payments', 'update'),
    // Invoices – create, read (2)
    p('payments', 'invoices', 'create'),
    p('payments', 'invoices', 'read'),
    // Financial reports – read only (1)
    p('reports', 'reports_financial', 'read'),
  ],

  SECRETARY: [
    // All student permissions (12)
    ...STUDENTS_ALL,
    // All CRM permissions (16)
    ...CRM_ALL,
    // Schedule – read only (1)
    p('schedule', 'schedule', 'read'),
    // Attendance – read only (1)
    p('attendance', 'attendance', 'read'),
    // Notifications – read only (1)
    p('notifications', 'notifications', 'read'),
  ],

  TEACHER: [
    // All grades permissions (11)
    ...GRADES_ALL,
    // All attendance permissions (9)
    ...ATTENDANCE_ALL,
    // Schedule – read only (1)
    p('schedule', 'schedule', 'read'),
    // Students – read only (1)
    p('students', 'students', 'read'),
  ],

  STUDENT: [
    // Grades – read own (1)
    p('grades', 'grades', 'read'),
    // Attendance – read own (1)
    p('attendance', 'attendance', 'read'),
    // Schedule – read (1)
    p('schedule', 'schedule', 'read'),
    // Payments – read own (1)
    p('payments', 'payments', 'read'),
    // Documents – read own (1)
    p('documents', 'documents', 'read'),
  ],
};

// Role metadata for database seeding
const ROLE_DEFINITIONS: Array<{
  name: SystemRole;
  description: string;
  frenchName: string;
}> = [
  { name: 'ADMIN', frenchName: 'Administrateur', description: 'Full system access to all modules and permissions' },
  { name: 'ACCOUNTANT', frenchName: 'Comptable', description: 'Access to accounting, payments, financial reports, and billing settings' },
  { name: 'CASHIER', frenchName: 'Caissier', description: 'Access to payment creation, invoicing, and financial reports' },
  { name: 'SECRETARY', frenchName: 'Secrétaire', description: 'Access to student management, CRM, schedule viewing, and notifications' },
  { name: 'TEACHER', frenchName: 'Enseignant', description: 'Access to grades, attendance, schedule viewing, and student records' },
  { name: 'STUDENT', frenchName: 'Étudiant', description: 'Read-only access to own grades, attendance, schedule, payments, and documents' },
];

// ============================================================================
// Permission Check Functions
// ============================================================================

/**
 * Check whether a given role has a specific permission.
 *
 * Performs a broad match: returns true if the role has ANY permission
 * whose logical module and action match the query, regardless of resource.
 *
 * @example
 * hasPermission('TEACHER', 'grades', 'create')  // true (has grades.grades.create, grades.report_cards.create)
 * hasPermission('STUDENT', 'grades', 'create')  // false (only has grades.grades.read)
 *
 * @param userRoleName - The system role name (e.g., 'ADMIN', 'TEACHER')
 * @param module       - The logical module name (e.g., 'students', 'payments')
 * @param action       - The action name (e.g., 'create', 'read', 'update')
 * @returns true if the role has at least one matching permission
 */
export function hasPermission(
  userRoleName: string,
  module: string,
  action: string,
): boolean {
  const rolePerms = ROLE_PERMISSIONS[userRoleName as SystemRole];
  if (!rolePerms) return false;

  return rolePerms.some((key) => {
    const entry = PERMISSIONS.get(key);
    return entry !== undefined && entry.module === module && entry.action === action;
  });
}

/**
 * Check whether a given role has a specific resource-level permission.
 *
 * @example
 * hasResourcePermission('TEACHER', 'grades', 'report_cards', 'create')  // true
 * hasResourcePermission('SECRETARY', 'students', 'enrollments', 'create') // true
 *
 * @param userRoleName - The system role name
 * @param module       - The logical module name
 * @param resource     - The specific resource name
 * @param action       - The action name
 * @returns true if the role has the exact module.resource.action permission
 */
export function hasResourcePermission(
  userRoleName: string,
  module: string,
  resource: string,
  action: string,
): boolean {
  const rolePerms = ROLE_PERMISSIONS[userRoleName as SystemRole];
  if (!rolePerms) return false;

  const key = p(module, resource, action);
  return rolePerms.includes(key);
}

/**
 * Get all permission keys assigned to a role.
 *
 * @example
 * getUserPermissions('STUDENT')  // ['grades.grades.read', 'attendance.attendance.read', ...]
 *
 * @param userRoleName - The system role name
 * @returns Array of permission keys, or empty array for unknown roles
 */
export function getUserPermissions(userRoleName: string): string[] {
  return ROLE_PERMISSIONS[userRoleName as SystemRole] ?? [];
}

/**
 * Get all permission entries assigned to a role.
 *
 * @param userRoleName - The system role name
 * @returns Array of PermissionEntry objects
 */
export function getUserPermissionEntries(userRoleName: string): PermissionEntry[] {
  const keys = getUserPermissions(userRoleName);
  return keys
    .map((key) => PERMISSIONS.get(key))
    .filter((entry): entry is PermissionEntry => entry !== undefined);
}

/**
 * Get the count of permissions assigned to a role.
 *
 * @param userRoleName - The system role name
 * @returns Number of permissions assigned to the role
 */
export function getPermissionCount(userRoleName: string): number {
  return getUserPermissions(userRoleName).length;
}

// ============================================================================
// Database Seeding
// ============================================================================

/**
 * Initialize RBAC in the database.
 *
 * Seeds all 164 permissions and 6 role-permission mappings.
 * Uses a transaction to ensure atomicity. Safe to call multiple times –
 * it clears and recreates all permission data.
 *
 * @param prisma - PrismaClient instance (defaults to the application db)
 */
export async function initRBAC(prisma: PrismaClient = db): Promise<void> {
  await prisma.$transaction(async (tx) => {
    // ── 1. Clear existing RBAC data ────────────────────────────────────
    await tx.rolePermission.deleteMany();
    await tx.permission.deleteMany();

    // ── 2. Seed all 164 permissions ────────────────────────────────────
    const permissionIdMap = new Map<string, string>();

    for (const [key, entry] of PERMISSIONS) {
      const actionUpper = entry.action.toUpperCase() as PermissionAction;

      const permission = await tx.permission.create({
        data: {
          module: entry.dbModule,
          action: actionUpper,
          resource: entry.resource,
        },
      });

      permissionIdMap.set(key, permission.id);
    }

    // ── 3. Upsert roles ────────────────────────────────────────────────
    const roleIdMap = new Map<SystemRole, string>();

    for (const roleDef of ROLE_DEFINITIONS) {
      const existing = await tx.role.findFirst({
        where: { name: roleDef.name as never },
      });

      if (existing) {
        roleIdMap.set(roleDef.name, existing.id);
      } else {
        const created = await tx.role.create({
          data: {
            name: roleDef.name as never,
            description: roleDef.description,
          },
        });
        roleIdMap.set(roleDef.name, created.id);
      }
    }

    // ── 4. Seed role-permission mappings ───────────────────────────────
    const rolePermData: Array<{ roleId: string; permissionId: string }> = [];

    for (const [roleName, permKeys] of Object.entries(ROLE_PERMISSIONS)) {
      const roleId = roleIdMap.get(roleName as SystemRole);
      if (!roleId) continue;

      for (const permKey of permKeys) {
        const permissionId = permissionIdMap.get(permKey);
        if (!permissionId) continue;

        rolePermData.push({ roleId, permissionId });
      }
    }

    // Batch create all role-permission mappings
    if (rolePermData.length > 0) {
      await tx.rolePermission.createMany({ data: rolePermData });
    }
  });

  console.log(
    `[RBAC] Initialized ${PERMISSIONS.size} permissions across ${ROLE_DEFINITIONS.length} roles.`,
  );
}

// ============================================================================
// Summary (for reference – not exported)
// ============================================================================

/**
 * Permission distribution summary:
 *
 * | Module         | Count | Resources                                      |
 * |----------------|-------|------------------------------------------------|
 * | students       |   12  | students (6), enrollments (6)                  |
 * | payments       |   11  | payments (6), invoices (5)                     |
 * | grades         |   11  | grades (6), report_cards (5)                   |
 * | accounting     |   15  | accounting (6), budgets (5), journal_entries (4)|
 * | hr             |   16  | employees (6), contracts (5), leave_requests (5)|
 * | payroll        |   11  | payroll (6), salary_slips (5)                  |
 * | reports        |   12  | 6 types × (read, export)                       |
 * | settings       |    8  | 4 groups × (read, update)                      |
 * | users          |   10  | users (5), roles (4), audit_logs (1)           |
 * | schedule       |   14  | schedule (5), classes (6), rooms (3)           |
 * | attendance     |    9  | attendance (6), attendance_excuses (3)         |
 * | documents      |   10  | documents (5), document_templates (5)          |
 * | notifications  |    9  | notifications (5), notification_templates (4)  |
 * | crm            |   16  | contacts (5), campaigns (5), leads (6)         |
 * |----------------|-------|------------------------------------------------|
 * | TOTAL          |  164  |                                                |
 *
 * Role permission counts:
 * | Role           | Count |
 * |----------------|-------|
 * | ADMIN          |   164 |
 * | ACCOUNTANT     |    33 |
 * | SECRETARY      |    31 |
 * | TEACHER        |    22 |
 * | PAYROLL        |    11 |
 * | CASHIER        |     6 |
 * | STUDENT        |     5 |
 */
