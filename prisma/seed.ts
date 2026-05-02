/**
 * IPVE Digital — Database Seed Script (PostgreSQL / Supabase)
 * ================================================================
 * Creates initial data for the IPVE school management system:
 * - 6 roles with RBAC permissions (164 permissions)
 * - 6 default users (admin, teacher, accountant, cashier, secretary, student)
 * - 3 filières with 6 levels
 * - 1 academic year (2024-2025) with 2 periods
 * - 9 subjects
 * - 20 sample students with 4 classes
 * - Payment plans with tranches
 * - Sample payments
 * - OHADA chart of accounts
 * - Default institution settings
 * - Sample notifications
 */

import { hash } from 'bcryptjs';
import { db } from '../src/lib/db';

// ========================
// RBAC — Permission Definitions
// ========================

type PermissionDef = { module: string; resource: string; action: string; description: string };
type SystemRole = 'ADMIN' | 'ACCOUNTANT' | 'CASHIER' | 'SECRETARY' | 'TEACHER' | 'STUDENT';

const MODULE_MAP: Record<string, string> = {
  students: 'LMS', grades: 'LMS', schedule: 'LMS', attendance: 'LMS',
  documents: 'LMS', notifications: 'LMS', payments: 'ERP', accounting: 'ERP',
  hr: 'ERP', payroll: 'ERP', crm: 'CRM', reports: 'REPORTS', settings: 'SETTINGS', users: 'SETTINGS',
};

const ACTIONS = ['create', 'read', 'update', 'delete', 'export'] as const;
const ACTIONS_WITH_VALIDATE = [...ACTIONS, 'validate'] as const;

function perm(module: string, resource: string, action: string, description: string): PermissionDef {
  return { module, resource, action, description };
}

const ALL_PERMS: PermissionDef[] = [
  // Students (12)
  ...ACTIONS_WITH_VALIDATE.map(a => perm('students', 'students', a, `${a} students`)),
  ...ACTIONS_WITH_VALIDATE.map(a => perm('students', 'enrollments', a, `${a} enrollments`)),
  // Payments (11)
  ...ACTIONS_WITH_VALIDATE.map(a => perm('payments', 'payments', a, `${a} payments`)),
  ...ACTIONS.map(a => perm('payments', 'invoices', a, `${a} invoices`)),
  // Grades (11)
  ...ACTIONS_WITH_VALIDATE.map(a => perm('grades', 'grades', a, `${a} grades`)),
  ...ACTIONS.map(a => perm('grades', 'report_cards', a, `${a} report cards`)),
  // Accounting (15)
  ...ACTIONS_WITH_VALIDATE.map(a => perm('accounting', 'accounting', a, `${a} accounting`)),
  ...ACTIONS.map(a => perm('accounting', 'budgets', a, `${a} budgets`)),
  ...ACTIONS.map(a => perm('accounting', 'journal_entries', a, `${a} journal entries`)),
  // HR (16)
  ...ACTIONS_WITH_VALIDATE.map(a => perm('hr', 'employees', a, `${a} employees`)),
  ...ACTIONS.map(a => perm('hr', 'contracts', a, `${a} contracts`)),
  ...ACTIONS.map(a => perm('hr', 'leave_requests', a, `${a} leave requests`)),
  // Payroll (11)
  ...ACTIONS_WITH_VALIDATE.map(a => perm('payroll', 'payroll', a, `${a} payroll`)),
  ...ACTIONS.map(a => perm('payroll', 'salary_slips', a, `${a} salary slips`)),
  // Reports (12)
  ...ACTIONS.map(a => perm('reports', 'reports_students', a, `${a} student reports`)),
  ...ACTIONS.map(a => perm('reports', 'reports_financial', a, `${a} financial reports`)),
  ...ACTIONS.map(a => perm('reports', 'reports_academic', a, `${a} academic reports`)),
  ...ACTIONS.map(a => perm('reports', 'reports_attendance', a, `${a} attendance reports`)),
  ...ACTIONS.map(a => perm('reports', 'reports_hr', a, `${a} HR reports`)),
  ...ACTIONS.map(a => perm('reports', 'reports_general', a, `${a} general reports`)),
  // Settings (8)
  ...ACTIONS.map(a => perm('settings', 'settings_general', a, `${a} general settings`)),
  ...ACTIONS.map(a => perm('settings', 'settings_academic', a, `${a} academic settings`)),
  ...ACTIONS.map(a => perm('settings', 'settings_system', a, `${a} system settings`)),
  ...ACTIONS.map(a => perm('settings', 'settings_billing', a, `${a} billing settings`)),
  // Users (10)
  ...ACTIONS.map(a => perm('users', 'users', a, `${a} users`)),
  ...ACTIONS.map(a => perm('users', 'roles', a, `${a} roles`)),
  perm('users', 'audit_logs', 'read', 'read audit logs'),
  // Schedule (14)
  ...ACTIONS.map(a => perm('schedule', 'schedule', a, `${a} schedule`)),
  ...ACTIONS_WITH_VALIDATE.map(a => perm('schedule', 'classes', a, `${a} classes`)),
  ...ACTIONS.map(a => perm('schedule', 'rooms', a, `${a} rooms`)),
  // Attendance (9)
  ...ACTIONS_WITH_VALIDATE.map(a => perm('attendance', 'attendance', a, `${a} attendance`)),
  ...ACTIONS.map(a => perm('attendance', 'attendance_excuses', a, `${a} excuses`)),
  // Documents (10)
  ...ACTIONS.map(a => perm('documents', 'documents', a, `${a} documents`)),
  ...ACTIONS.map(a => perm('documents', 'document_templates', a, `${a} templates`)),
  // Notifications (9)
  ...ACTIONS.map(a => perm('notifications', 'notifications', a, `${a} notifications`)),
  ...ACTIONS.map(a => perm('notifications', 'notification_templates', a, `${a} templates`)),
  // CRM (16)
  ...ACTIONS.map(a => perm('crm', 'contacts', a, `${a} contacts`)),
  ...ACTIONS.map(a => perm('crm', 'campaigns', a, `${a} campaigns`)),
  ...ACTIONS_WITH_VALIDATE.map(a => perm('crm', 'leads', a, `${a} leads`)),
];

function pk(m: string, r: string, a: string): string { return `${m}.${r}.${a}`; }
function modKeys(m: string): string[] { return ALL_PERMS.filter(p => p.module === m).map(p => pk(p.module, p.resource, p.action)); }

const ROLE_PERMS: Record<SystemRole, string[]> = {
  ADMIN: ALL_PERMS.map(p => pk(p.module, p.resource, p.action)),
  ACCOUNTANT: [
    ...modKeys('accounting'), ...modKeys('payments'),
    pk('reports', 'reports_financial', 'read'), pk('reports', 'reports_financial', 'export'),
    pk('reports', 'reports_general', 'read'), pk('reports', 'reports_general', 'export'),
    pk('settings', 'settings_billing', 'read'), pk('settings', 'settings_billing', 'update'),
    pk('settings', 'settings_general', 'read'),
  ],
  CASHIER: [
    pk('payments', 'payments', 'create'), pk('payments', 'payments', 'read'), pk('payments', 'payments', 'update'),
    pk('payments', 'invoices', 'create'), pk('payments', 'invoices', 'read'),
    pk('reports', 'reports_financial', 'read'),
  ],
  SECRETARY: [
    ...modKeys('students'), ...modKeys('crm'),
    pk('schedule', 'schedule', 'read'), pk('attendance', 'attendance', 'read'), pk('notifications', 'notifications', 'read'),
  ],
  TEACHER: [
    ...modKeys('grades'), ...modKeys('attendance'),
    pk('schedule', 'schedule', 'read'), pk('students', 'students', 'read'),
  ],
  STUDENT: [
    pk('grades', 'grades', 'read'), pk('attendance', 'attendance', 'read'),
    pk('schedule', 'schedule', 'read'), pk('payments', 'payments', 'read'), pk('documents', 'documents', 'read'),
  ],
};

const ROLE_MAP: Record<string, SystemRole> = {
  'ADMIN': 'ADMIN', 'TEACHER': 'TEACHER', 'ACCOUNTANT': 'ACCOUNTANT',
  'CASHIER': 'CASHIER', 'SECRETARY': 'SECRETARY', 'STUDENT': 'STUDENT',
};

async function seedRBAC() {
  // 1. Clear existing data
  await db.rolePermission.deleteMany();
  await db.permission.deleteMany();

  // 2. Create all permissions in one batch
  const permData = ALL_PERMS.map(p => ({
    module: (MODULE_MAP[p.module] ?? 'LMS'),
    action: p.action.toUpperCase(),
    resource: p.resource,
  }));
  // Use loop to avoid conflicts on duplicate permissions
  for (const p of permData) {
    await db.permission.create({ data: p }).catch(() => {});
  }

  // 3. Fetch created permissions and build mapping
  const allPerms = await db.permission.findMany();
  const permIdMap = new Map<string, string>();
  for (const p of allPerms) {
    permIdMap.set(`${p.module.toString().toLowerCase()}.${p.resource}.${p.action.toLowerCase()}`, p.id);
  }

  // 4. Build role-permission mapping
  const roles = await db.role.findMany();
  const rolePermData: { roleId: string; permissionId: string }[] = [];
  for (const role of roles) {
    const sysRole = ROLE_MAP[role.name];
    if (!sysRole) continue;
    const permKeys = ROLE_PERMS[sysRole];
    for (const key of permKeys) {
      const pid = permIdMap.get(key);
      if (pid) rolePermData.push({ roleId: role.id, permissionId: pid });
    }
  }

  // 5. Create all role-permission mappings in one batch
  if (rolePermData.length > 0) {
    await db.rolePermission.deleteMany();
    await db.rolePermission.createMany({ data: rolePermData });
  }

  console.log(`  ${ALL_PERMS.length} permissions RBAC created (${rolePermData.length} mappings)`);
}

// Shared transaction timeout — 5 minutes
const TX_TIMEOUT = { timeout: 300_000 };

async function seed() {
  console.log('Seeding IPVE database...\n');

  // ========================
  // Batch 1: 6 RÔLES
  // ========================
  const [adminRole, teacherRole, accountantRole, cashierRole, secretaryRole, studentRole] =
    await db.$transaction([
      db.role.upsert({
        where: { name: 'ADMIN' },
        update: {},
        create: {
          name: 'ADMIN',
          description: 'Accès complet à toutes les fonctionnalités',
        },
      }),
      db.role.upsert({
        where: { name: 'TEACHER' },
        update: {},
        create: {
          name: 'TEACHER',
          description: 'Gestion des notes, emploi du temps, assiduité',
        },
      }),
      db.role.upsert({
        where: { name: 'ACCOUNTANT' },
        update: {},
        create: {
          name: 'ACCOUNTANT',
          description: 'Gestion financière et comptabilité OHADA',
        },
      }),
      db.role.upsert({
        where: { name: 'CASHIER' },
        update: {},
        create: {
          name: 'CASHIER',
          description: 'Gestion des paiements et encaissements',
        },
      }),
      db.role.upsert({
        where: { name: 'SECRETARY' },
        update: {},
        create: {
          name: 'SECRETARY',
          description: 'Gestion des inscriptions et étudiants',
        },
      }),
      db.role.upsert({
        where: { name: 'STUDENT' },
        update: {},
        create: {
          name: 'STUDENT',
          description: 'Consultation des notes, emploi du temps, paiements',
        },
      }),
    ], TX_TIMEOUT);

  console.log('  6 roles created');

  // ========================
  // Pre-compute: password hashes
  // ========================
  const [hashAdmin, hashTeacher, hashAccountant, hashCashier, hashSecretary, hashStudent] =
    await Promise.all([
      hash('Admin@123', 12),
      hash('Teacher@2025', 12),
      hash('Finance@2025', 12),
      hash('Caissier@2025', 12),
      hash('Secret@2025', 12),
      hash('Student@2025', 12),
    ]);

  // ========================
  // Batch 2: 6 USERS
  // ========================
  const users = await db.$transaction([
    db.user.upsert({
      where: { email: 'admin@ipve.edu.ci' },
      update: {},
      create: {
        email: 'admin@ipve.edu.ci',
        passwordHash: hashAdmin,
        firstName: 'Kouadio',
        lastName: 'Amani',
        phone: '+225 07 12 34 56',
        roleId: adminRole.id,
        isActive: true,
      },
    }),
    db.user.upsert({
      where: { email: 'm.konan@ipve.edu.ci' },
      update: {},
      create: {
        email: 'm.konan@ipve.edu.ci',
        passwordHash: hashTeacher,
        firstName: 'Moussa',
        lastName: 'Konan',
        phone: '+225 05 98 76 54',
        roleId: teacherRole.id,
        isActive: true,
      },
    }),
    db.user.upsert({
      where: { email: 'finance@ipve.edu.ci' },
      update: {},
      create: {
        email: 'finance@ipve.edu.ci',
        passwordHash: hashAccountant,
        firstName: 'Fatou',
        lastName: 'Diallo',
        phone: '+225 07 65 43 21',
        roleId: accountantRole.id,
        isActive: true,
      },
    }),
    db.user.upsert({
      where: { email: 'caisse@ipve.edu.ci' },
      update: {},
      create: {
        email: 'caisse@ipve.edu.ci',
        passwordHash: hashCashier,
        firstName: 'Aminata',
        lastName: 'Coulibaly',
        phone: '+225 01 55 44 33',
        roleId: cashierRole.id,
        isActive: true,
      },
    }),
    db.user.upsert({
      where: { email: 'secretariat@ipve.edu.ci' },
      update: {},
      create: {
        email: 'secretariat@ipve.edu.ci',
        passwordHash: hashSecretary,
        firstName: 'Marie',
        lastName: 'Bamba',
        phone: '+225 05 11 22 33',
        roleId: secretaryRole.id,
        isActive: true,
      },
    }),
    db.user.upsert({
      where: { email: 'a.kone@etu.ipve.ci' },
      update: {},
      create: {
        email: 'a.kone@etu.ipve.ci',
        passwordHash: hashStudent,
        firstName: 'Abdoulaye',
        lastName: 'Koné',
        phone: '+225 07 88 99 00',
        roleId: studentRole.id,
        isActive: true,
      },
    }),
  ], TX_TIMEOUT);

  console.log('  6 users created');

  // ========================
  // Batch 3: Année académique + 2 périodes
  // ========================
  const [academicYear, period1, period2] = await db.$transaction([
    db.academicYear.upsert({
      where: { id: 'ay-2024-2025' },
      update: {},
      create: {
        id: 'ay-2024-2025',
        name: '2024-2025',
        startDate: new Date('2024-10-01'),
        endDate: new Date('2025-07-31'),
        isCurrent: true,
      },
    }),
    db.period.upsert({
      where: { id: 'period-s1' },
      update: {},
      create: {
        id: 'period-s1',
        name: 'Semestre 1',
        academicYearId: 'ay-2024-2025',
        startDate: new Date('2024-10-01'),
        endDate: new Date('2025-02-28'),
        isCurrent: true,
      },
    }),
    db.period.upsert({
      where: { id: 'period-s2' },
      update: {},
      create: {
        id: 'period-s2',
        name: 'Semestre 2',
        academicYearId: 'ay-2024-2025',
        startDate: new Date('2025-03-01'),
        endDate: new Date('2025-07-31'),
        isCurrent: false,
      },
    }),
  ], TX_TIMEOUT);

  console.log('  Academic year 2024-2025 created');

  // ========================
  // Batch 4: 3 filières + 6 niveaux
  // ========================
  const { filieres, levels } = await db.$transaction(async (tx) => {
    const f1 = await tx.filiere.upsert({
      where: { code: 'INFO-BTS' },
      update: {},
      create: {
        code: 'INFO-BTS',
        name: 'BTS Informatique',
        description: 'Développement Web, Bases de données, Réseaux',
        durationYears: 2,
        isActive: true,
      },
    });
    const f2 = await tx.filiere.upsert({
      where: { code: 'GECO-BTS' },
      update: {},
      create: {
        code: 'GECO-BTS',
        name: 'BTS Gestion & Comptabilité',
        description: 'Comptabilité OHADA, Gestion, Droit des affaires',
        durationYears: 2,
        isActive: true,
      },
    });
    const f3 = await tx.filiere.upsert({
      where: { code: 'CPTA-BTS' },
      update: {},
      create: {
        code: 'CPTA-BTS',
        name: 'BTS Comptabilité',
        description: 'Comptabilité OHADA, Fiscalité, Audit',
        durationYears: 2,
        isActive: true,
      },
    });

    const l1 = await tx.level.upsert({
      where: { id: 'level-info-bts1' },
      update: {},
      create: {
        id: 'level-info-bts1',
        name: 'BTS 1 Informatique',
        filiereId: f1.id,
        yearNumber: 1,
        tuitionFee: 425000,
      },
    });
    const l2 = await tx.level.upsert({
      where: { id: 'level-info-bts2' },
      update: {},
      create: {
        id: 'level-info-bts2',
        name: 'BTS 2 Informatique',
        filiereId: f1.id,
        yearNumber: 2,
        tuitionFee: 425000,
      },
    });
    const l3 = await tx.level.upsert({
      where: { id: 'level-geco-bts1' },
      update: {},
      create: {
        id: 'level-geco-bts1',
        name: 'BTS 1 Gestion & Comptabilité',
        filiereId: f2.id,
        yearNumber: 1,
        tuitionFee: 360000,
      },
    });
    const l4 = await tx.level.upsert({
      where: { id: 'level-geco-bts2' },
      update: {},
      create: {
        id: 'level-geco-bts2',
        name: 'BTS 2 Gestion & Comptabilité',
        filiereId: f2.id,
        yearNumber: 2,
        tuitionFee: 360000,
      },
    });
    const l5 = await tx.level.upsert({
      where: { id: 'level-cpta-bts1' },
      update: {},
      create: {
        id: 'level-cpta-bts1',
        name: 'BTS 1 Comptabilité',
        filiereId: f3.id,
        yearNumber: 1,
        tuitionFee: 390000,
      },
    });
    const l6 = await tx.level.upsert({
      where: { id: 'level-cpta-bts2' },
      update: {},
      create: {
        id: 'level-cpta-bts2',
        name: 'BTS 2 Comptabilité',
        filiereId: f3.id,
        yearNumber: 2,
        tuitionFee: 390000,
      },
    });

    return {
      filieres: [f1, f2, f3],
      levels: [l1, l2, l3, l4, l5, l6],
    };
  }, TX_TIMEOUT);

  console.log('  3 filieres and 6 levels created');

  // ========================
  // Batch 5: 9 SUBJECTS
  // ========================
  await db.$transaction([
    db.subject.upsert({
      where: { code: 'INF101' },
      update: {},
      create: {
        code: 'INF101',
        name: 'Algorithmique & Programmation',
        description: "Cours d'algorithmique et programmation structurée",
        isActive: true,
      },
    }),
    db.subject.upsert({
      where: { code: 'INF102' },
      update: {},
      create: {
        code: 'INF102',
        name: 'Bases de données',
        description: 'SQL, modélisation, MySQL/PostgreSQL',
        isActive: true,
      },
    }),
    db.subject.upsert({
      where: { code: 'INF201' },
      update: {},
      create: {
        code: 'INF201',
        name: 'Développement Web',
        description: 'HTML, CSS, JavaScript, React, Node.js',
        isActive: true,
      },
    }),
    db.subject.upsert({
      where: { code: 'GEC101' },
      update: {},
      create: {
        code: 'GEC101',
        name: 'Comptabilité Générale',
        description: 'Comptabilité OHADA, bilan, compte de résultat',
        isActive: true,
      },
    }),
    db.subject.upsert({
      where: { code: 'GEC102' },
      update: {},
      create: {
        code: 'GEC102',
        name: 'Droit des affaires',
        description: 'Droit OHADA, contrats, sociétés',
        isActive: true,
      },
    }),
    db.subject.upsert({
      where: { code: 'MKT101' },
      update: {},
      create: {
        code: 'MKT101',
        name: 'Marketing Digital',
        description: 'SEO, SEM, réseaux sociaux, analytics',
        isActive: true,
      },
    }),
    db.subject.upsert({
      where: { code: 'MKT102' },
      update: {},
      create: {
        code: 'MKT102',
        name: 'Communication visuelle',
        description: 'Design graphique, identité visuelle, PAO',
        isActive: true,
      },
    }),
    db.subject.upsert({
      where: { code: 'CPT101' },
      update: {},
      create: {
        code: 'CPT101',
        name: 'Comptabilité OHADA',
        description: 'Plan comptable SYSCOA, écritures, états financiers',
        isActive: true,
      },
    }),
    db.subject.upsert({
      where: { code: 'ANG101' },
      update: {},
      create: {
        code: 'ANG101',
        name: 'Anglais professionnel',
        description: 'Business English, TOEIC',
        isActive: true,
      },
    }),
  ], TX_TIMEOUT);

  console.log('  9 subjects created');

  // ========================
  // Batch 6: 20 students + 4 classes
  // ========================
  const studentData = [
    { fn: 'Abdoulaye', ln: 'Koné', g: 'MALE', f: 0, l: 0, hasUser: true },
    { fn: 'Fatoumata', ln: 'Traoré', g: 'FEMALE', f: 0, l: 0, hasUser: false },
    { fn: 'Ibrahim', ln: 'Ouattara', g: 'MALE', f: 0, l: 1, hasUser: false },
    { fn: 'Aminata', ln: 'Diallo', g: 'FEMALE', f: 1, l: 0, hasUser: false },
    { fn: 'Ousmane', ln: 'Konan', g: 'MALE', f: 1, l: 1, hasUser: false },
    { fn: 'Kadiatou', ln: 'Coulibaly', g: 'FEMALE', f: 2, l: 0, hasUser: false },
    { fn: 'Mamadou', ln: 'Bamba', g: 'MALE', f: 2, l: 1, hasUser: false },
    { fn: 'Mariam', ln: 'Konaté', g: 'FEMALE', f: 0, l: 0, hasUser: false },
    { fn: 'Cheick', ln: 'Diabaté', g: 'MALE', f: 0, l: 1, hasUser: false },
    { fn: 'Aïcha', ln: 'Sylla', g: 'FEMALE', f: 1, l: 0, hasUser: false },
    { fn: 'Bakary', ln: 'Koné', g: 'MALE', f: 1, l: 1, hasUser: false },
    { fn: 'Djénéba', ln: 'Traoré', g: 'FEMALE', f: 2, l: 0, hasUser: false },
    { fn: 'Seydou', ln: 'Ouattara', g: 'MALE', f: 2, l: 1, hasUser: false },
    { fn: 'Rokia', ln: 'Diallo', g: 'FEMALE', f: 0, l: 0, hasUser: false },
    { fn: 'Amadou', ln: 'Konan', g: 'MALE', f: 0, l: 1, hasUser: false },
    { fn: 'Bintou', ln: 'Coulibaly', g: 'FEMALE', f: 1, l: 0, hasUser: false },
    { fn: 'Lassina', ln: 'Bamba', g: 'MALE', f: 1, l: 1, hasUser: false },
    { fn: 'Fatou', ln: 'Konaté', g: 'FEMALE', f: 2, l: 0, hasUser: false },
    { fn: 'Drissa', ln: 'Diabaté', g: 'MALE', f: 2, l: 1, hasUser: false },
    { fn: 'Awa', ln: 'Sylla', g: 'FEMALE', f: 0, l: 0, hasUser: false },
  ];

  const levelMap = [levels[0], levels[1], levels[2], levels[3], levels[4], levels[5]];

  const { students, classes } = await db.$transaction(async (tx) => {
    const createdStudents = [];
    for (let i = 0; i < studentData.length; i++) {
      const s = studentData[i];
      const student = await tx.student.upsert({
        where: { studentNumber: `IPVE-2024-${String(i + 1).padStart(4, '0')}` },
        update: {},
        create: {
          studentNumber: `IPVE-2024-${String(i + 1).padStart(4, '0')}`,
          firstName: s.fn,
          lastName: s.ln,
          dateOfBirth: new Date(2001 + (i % 4), (i % 12) + 1, (i % 28) + 1),
          gender: s.g,
          nationality: 'Ivoirienne',
          address: ['Cocody', 'Plateau', 'Marcory', 'Yopougon', 'Treichville', 'Adjamé'][i % 6] + ', Abidjan',
          enrollmentDate: new Date('2024-10-01'),
          status: 'ACTIVE',
          filiereId: filieres[s.f].id,
          levelId: levelMap[s.l].id,
          parentName: `Parent ${s.ln}`,
          parentPhone: `+225 07 ${String(50 + i).padStart(2, '0')} ${String(10 + i * 3).padStart(2, '0')} ${String(20 + i * 2).padStart(2, '0')}`,
          userId: s.hasUser ? users[5].id : null,
        },
      });
      createdStudents.push(student);
    }

    const c0 = await tx.class.upsert({
      where: { id: 'class-info-bts1' },
      update: {},
      create: {
        id: 'class-info-bts1',
        name: 'BTS 1 Info - Groupe A',
        levelId: levels[0].id,
        academicYearId: academicYear.id,
        capacity: 35,
        room: 'Salle A1',
      },
    });
    const c1 = await tx.class.upsert({
      where: { id: 'class-info-bts2' },
      update: {},
      create: {
        id: 'class-info-bts2',
        name: 'BTS 2 Info - Groupe A',
        levelId: levels[1].id,
        academicYearId: academicYear.id,
        capacity: 30,
        room: 'Labo Info',
      },
    });
    const c2 = await tx.class.upsert({
      where: { id: 'class-geco-bts1' },
      update: {},
      create: {
        id: 'class-geco-bts1',
        name: 'BTS 1 Geco - Groupe A',
        levelId: levels[2].id,
        academicYearId: academicYear.id,
        capacity: 40,
        room: 'Salle B2',
      },
    });
    const c3 = await tx.class.upsert({
      where: { id: 'class-cpta-bts1' },
      update: {},
      create: {
        id: 'class-cpta-bts1',
        name: 'BTS 1 Compta - Groupe A',
        levelId: levels[4].id,
        academicYearId: academicYear.id,
        capacity: 35,
        room: 'Salle C3',
      },
    });
    const createdClasses = [c0, c1, c2, c3];

    // Assign students to classes
    for (const student of createdStudents) {
      const studentFiliere = filieres.findIndex((f) => f.id === student.filiereId);
      const studentLevel = levels.findIndex((l) => l.id === student.levelId);

      let classId: string;
      if (studentFiliere === 0 && studentLevel === 0) classId = createdClasses[0].id;
      else if (studentFiliere === 0 && studentLevel === 1) classId = createdClasses[1].id;
      else if (studentFiliere === 1) classId = createdClasses[2].id;
      else classId = createdClasses[3].id;

      await tx.student.update({
        where: { id: student.id },
        data: { classId },
      });
    }

    return { students: createdStudents, classes: createdClasses };
  }, TX_TIMEOUT);

  console.log('  20 students created');
  console.log('  4 classes created');

  // ========================
  // Batch 7: PAYMENT PLANS WITH TRANCHES
  // ========================
  const planConfigs = [
    { level: levels[0], name: 'BTS 1 Info - Standard', total: 425000, tranches: [
      { n: 1, name: 'Inscription', amount: 125000, due: '2024-10-15' },
      { n: 2, name: '1ère tranche', amount: 150000, due: '2025-01-15' },
      { n: 3, name: '2ème tranche', amount: 150000, due: '2025-04-15' },
    ]},
    { level: levels[1], name: 'BTS 2 Info - Standard', total: 425000, tranches: [
      { n: 1, name: 'Inscription', amount: 125000, due: '2024-10-15' },
      { n: 2, name: '1ère tranche', amount: 150000, due: '2025-01-15' },
      { n: 3, name: '2ème tranche', amount: 150000, due: '2025-04-15' },
    ]},
    { level: levels[2], name: 'BTS 1 Geco - Standard', total: 360000, tranches: [
      { n: 1, name: 'Inscription', amount: 110000, due: '2024-10-15' },
      { n: 2, name: '1ère tranche', amount: 125000, due: '2025-01-15' },
      { n: 3, name: '2ème tranche', amount: 125000, due: '2025-04-15' },
    ]},
    { level: levels[3], name: 'BTS 2 Geco - Standard', total: 360000, tranches: [
      { n: 1, name: 'Inscription', amount: 110000, due: '2024-10-15' },
      { n: 2, name: '1ère tranche', amount: 125000, due: '2025-01-15' },
      { n: 3, name: '2ème tranche', amount: 125000, due: '2025-04-15' },
    ]},
    { level: levels[4], name: 'BTS 1 Compta - Standard', total: 390000, tranches: [
      { n: 1, name: 'Inscription', amount: 120000, due: '2024-10-15' },
      { n: 2, name: '1ère tranche', amount: 135000, due: '2025-01-15' },
      { n: 3, name: '2ème tranche', amount: 135000, due: '2025-04-15' },
    ]},
    { level: levels[5], name: 'BTS 2 Compta - Standard', total: 390000, tranches: [
      { n: 1, name: 'Inscription', amount: 120000, due: '2024-10-15' },
      { n: 2, name: '1ère tranche', amount: 135000, due: '2025-01-15' },
      { n: 3, name: '2ème tranche', amount: 135000, due: '2025-04-15' },
    ]},
  ];

  const paymentPlans = await db.$transaction(
    planConfigs.map(config =>
      db.paymentPlan.upsert({
        where: { id: `plan-${config.level.id}` },
        update: {},
        create: {
          id: `plan-${config.level.id}`,
          name: config.name,
          levelId: config.level.id,
          academicYearId: academicYear.id,
          totalAmount: config.total,
          currency: 'XOF',
          isActive: true,
          tranches: {
            create: config.tranches.map(t => ({
              trancheNumber: t.n,
              name: t.name,
              amount: t.amount,
              dueDate: new Date(t.due),
              isMandatory: true,
            })),
          },
        },
        include: { tranches: true },
      }),
    ),
    TX_TIMEOUT,
  );

  console.log(`  ${paymentPlans.length} payment plans created with tranches`);

  // ========================
  // Batch 8: SAMPLE PAYMENTS
  // ========================
  await db.payment.deleteMany();

  const paymentMethods: string[] = [
    'CASH', 'MTN_MOMO', 'ORANGE_MONEY', 'WAVE', 'BANK_TRANSFER', 'CHEQUE',
  ];

  const paymentOps = [];
  let paymentCount = 0;
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const levelIdx = levelMap.findIndex(l => l.id === student.levelId);
    if (levelIdx === -1) continue;

    const plan = paymentPlans[levelIdx];
    if (!plan || !plan.tranches.length) continue;

    // Every student paid tranche 1 (inscription)
    const paymentDate1 = new Date('2024-10-' + String(Math.min(15 + i, 28)).padStart(2, '0'));
    paymentOps.push(
      db.payment.create({
        data: {
          paymentNumber: `PV-${new Date().getFullYear()}-${String(paymentCount + 1).padStart(5, '0')}`,
          studentId: student.id,
          trancheId: plan.tranches[0].id,
          amountPaid: plan.tranches[0].amount,
          paymentDate: paymentDate1,
          paymentMethod: paymentMethods[i % paymentMethods.length],
          receivedBy: users[3].id,
          status: 'COMPLETED',
        },
      }),
    );
    paymentCount++;

    // 70% of students paid tranche 2
    if (i % 10 < 7) {
      const paymentDate2 = new Date('2025-01-' + String(Math.min(10 + i, 28)).padStart(2, '0'));
      paymentOps.push(
        db.payment.create({
          data: {
            paymentNumber: `PV-${new Date().getFullYear()}-${String(paymentCount + 1).padStart(5, '0')}`,
            studentId: student.id,
            trancheId: plan.tranches[1].id,
            amountPaid: plan.tranches[1].amount,
            paymentDate: paymentDate2,
            paymentMethod: paymentMethods[(i + 2) % paymentMethods.length],
            receivedBy: users[3].id,
            status: 'COMPLETED',
          },
        }),
      );
      paymentCount++;
    }

    // 30% of students paid tranche 3
    if (i % 10 < 3) {
      const paymentDate3 = new Date('2025-03-' + String(Math.min(5 + i, 28)).padStart(2, '0'));
      paymentOps.push(
        db.payment.create({
          data: {
            paymentNumber: `PV-${new Date().getFullYear()}-${String(paymentCount + 1).padStart(5, '0')}`,
            studentId: student.id,
            trancheId: plan.tranches[2].id,
            amountPaid: plan.tranches[2].amount,
            paymentDate: paymentDate3,
            paymentMethod: paymentMethods[(i + 4) % paymentMethods.length],
            receivedBy: users[2].id,
            status: 'COMPLETED',
          },
        }),
      );
      paymentCount++;
    }
  }

  await db.$transaction(paymentOps, TX_TIMEOUT);

  console.log(`  ${paymentCount} payments created`);

  // ========================
  // Batch 9a: OHADA CHART OF ACCOUNTS
  // ========================
  const ohadaAccounts = [
    // Classe 1 — Capitaux (Passif)
    { number: '101', name: 'Capital social', class: '1', type: 'EQUITY', balance: 'CREDIT' },
    { number: '104', name: "Primes liées au capital", class: '1', type: 'EQUITY', balance: 'CREDIT' },
    { number: '106', name: 'Réserves', class: '1', type: 'EQUITY', balance: 'CREDIT' },
    { number: '108', name: "Compte de l'exploitant", class: '1', type: 'EQUITY', balance: 'CREDIT' },
    { number: '12', name: "Résultat de l'exercice", class: '1', type: 'EQUITY', balance: 'CREDIT' },
    { number: '16', name: 'Emprunts et dettes assimilées', class: '1', type: 'LIABILITY', balance: 'CREDIT' },
    // Classe 2 — Immobilisations (Actif)
    { number: '21', name: 'Immobilisations incorporelles', class: '2', type: 'ASSET', balance: 'DEBIT' },
    { number: '23', name: 'Immobilisations corporelles', class: '2', type: 'ASSET', balance: 'DEBIT' },
    { number: '24', name: 'Immobilisations financières', class: '2', type: 'ASSET', balance: 'DEBIT' },
    { number: '28', name: 'Amortissements', class: '2', type: 'ASSET', balance: 'CREDIT' },
    // Classe 3 — Stocks (Actif)
    { number: '31', name: 'Stocks de marchandises', class: '3', type: 'ASSET', balance: 'DEBIT' },
    { number: '35', name: 'Produits finis', class: '3', type: 'ASSET', balance: 'DEBIT' },
    { number: '36', name: 'Stocks provenant de tiers', class: '3', type: 'ASSET', balance: 'DEBIT' },
    { number: '38', name: 'Achats stockés', class: '3', type: 'ASSET', balance: 'DEBIT' },
    // Classe 4 — Tiers (Actif/Passif)
    { number: '401', name: 'Fournisseurs', class: '4', type: 'LIABILITY', balance: 'CREDIT' },
    { number: '404', name: "Fournisseurs d'immobilisations", class: '4', type: 'LIABILITY', balance: 'CREDIT' },
    { number: '411', name: 'Clients', class: '4', type: 'ASSET', balance: 'DEBIT' },
    { number: '421', name: 'Personnel - Rémunérations dues', class: '4', type: 'LIABILITY', balance: 'CREDIT' },
    { number: '43', name: 'Organismes sociaux', class: '4', type: 'LIABILITY', balance: 'CREDIT' },
    { number: '441', name: 'État - Subventions à recevoir', class: '4', type: 'ASSET', balance: 'DEBIT' },
    { number: '442', name: 'État - Impôts et taxes', class: '4', type: 'LIABILITY', balance: 'CREDIT' },
    { number: '445', name: 'TVA', class: '4', type: 'LIABILITY', balance: 'CREDIT' },
    { number: '45', name: 'Groupe et associés', class: '4', type: 'ASSET', balance: 'DEBIT' },
    { number: '47', name: "Comptes d'attente", class: '4', type: 'ASSET', balance: 'DEBIT' },
    { number: '48', name: 'Charges à payer', class: '4', type: 'LIABILITY', balance: 'CREDIT' },
    // Classe 5 — Financiers (Actif/Passif)
    { number: '51', name: 'Banques', class: '5', type: 'ASSET', balance: 'DEBIT' },
    { number: '52', name: 'Instruments de trésorerie', class: '5', type: 'ASSET', balance: 'DEBIT' },
    { number: '53', name: 'Caisse', class: '5', type: 'ASSET', balance: 'DEBIT' },
    { number: '56', name: 'Banques - Crédits de trésorerie', class: '5', type: 'LIABILITY', balance: 'CREDIT' },
    { number: '58', name: "Régies d'avances et accréditifs", class: '5', type: 'ASSET', balance: 'DEBIT' },
    // Classe 6 — Charges
    { number: '601', name: 'Achats de marchandises', class: '6', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '604', name: "Achats d'études et prestations", class: '6', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '61', name: 'Transports', class: '6', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '621', name: 'Personnel extérieur', class: '6', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '623', name: 'Publicité, publications', class: '6', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '625', name: 'Déplacements, missions', class: '6', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '626', name: 'Frais postaux et télécommunications', class: '6', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '63', name: 'Services extérieurs B', class: '6', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '641', name: 'Rémunérations du personnel', class: '6', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '645', name: 'Charges de sécurité sociale', class: '6', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '646', name: 'Cotisations sociales', class: '6', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '65', name: 'Autres charges', class: '6', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '66', name: 'Charges financières', class: '6', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '67', name: 'Éléments extraordinaires (charges)', class: '6', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '68', name: 'Dotations aux amortissements', class: '6', type: 'EXPENSE', balance: 'DEBIT' },
    // Classe 7 — Produits
    { number: '701', name: 'Ventes de marchandises', class: '7', type: 'REVENUE', balance: 'CREDIT' },
    { number: '706', name: 'Prestations de services', class: '7', type: 'REVENUE', balance: 'CREDIT' },
    { number: '707', name: 'Produits accessoires', class: '7', type: 'REVENUE', balance: 'CREDIT' },
    { number: '71', name: "Subventions d'exploitation", class: '7', type: 'REVENUE', balance: 'CREDIT' },
    { number: '74', name: "Subventions d'équilibre", class: '7', type: 'REVENUE', balance: 'CREDIT' },
    { number: '75', name: 'Autres produits', class: '7', type: 'REVENUE', balance: 'CREDIT' },
    { number: '76', name: 'Produits financiers', class: '7', type: 'REVENUE', balance: 'CREDIT' },
    { number: '77', name: 'Éléments extraordinaires (produits)', class: '7', type: 'REVENUE', balance: 'CREDIT' },
    { number: '78', name: 'Reprises de provisions', class: '7', type: 'REVENUE', balance: 'CREDIT' },
    { number: '79', name: 'Transferts de charges', class: '7', type: 'REVENUE', balance: 'CREDIT' },
    // Classe 8 — Autres
    { number: '81', name: 'Valeur ajoutée', class: '8', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '83', name: "Résultat brut d'exploitation", class: '8', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '85', name: 'Résultat net avant impôt', class: '8', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '88', name: "Résultat de l'exercice", class: '8', type: 'EXPENSE', balance: 'DEBIT' },
  ];

  await db.$transaction(
    ohadaAccounts.map(account =>
      db.chartOfAccount.upsert({
        where: { accountNumber: account.number },
        update: {},
        create: {
          accountNumber: account.number,
          accountName: account.name,
          accountClass: account.class,
          accountType: account.type,
          normalBalance: account.balance,
          isActive: true,
        },
      }),
    ),
    TX_TIMEOUT,
  );

  console.log(`  OHADA chart of accounts created (${ohadaAccounts.length} accounts, classes 1-8)`);

  // ========================
  // Batch 9b: NOTIFICATIONS
  // ========================
  await db.notification.deleteMany();
  await db.$transaction([
    db.notification.create({
      data: {
        userId: users[0].id,
        type: 'INFO',
        title: 'Rentrée académique 2024-2025',
        message: 'La rentrée est programmée le 1er octobre 2024.',
      },
    }),
    db.notification.create({
      data: {
        userId: users[0].id,
        type: 'WARNING',
        title: 'Paiements en retard',
        message: '8 étudiants ont des paiements en retard.',
      },
    }),
    db.notification.create({
      data: {
        userId: users[1].id,
        type: 'INFO',
        title: 'Saisie des notes S1',
        message: 'La saisie des notes du Semestre 1 est ouverte.',
      },
    }),
    db.notification.create({
      data: {
        userId: users[2].id,
        type: 'SUCCESS',
        title: 'Comptabilité à jour',
        message: 'Les écritures du mois de novembre sont validées.',
      },
    }),
  ], TX_TIMEOUT);

  console.log('  Notifications created');

  // ========================
  // Batch 10: INSTITUTION SETTINGS
  // ========================
  await db.institutionSettings.upsert({
    where: { id: 'default-settings' },
    update: {},
    create: {
      id: 'default-settings',
      schoolName: "Institut Polytechnique Vase d'Élites",
      shortName: 'IPVE',
      motto: 'Scientia Nobis Lumen',
      address: 'Abidjan, Côte d\'Ivoire',
      phone: '+225 27 21 00 00',
      email: 'infos@pve.edu.ci',
      website: 'www.ipve.edu.ci',
      academicYear: '2024-2025',
      currency: 'XOF',
      locale: 'fr-FR',
      passwordMinLength: 8,
      passwordRequireUppercase: true,
      passwordRequireNumbers: true,
      passwordRequireSpecial: false,
      sessionTimeoutMinutes: 480,
      maxLoginAttempts: 5,
      twoFactorEnforced: false,
      defaultPaymentMethod: 'CASH',
      latePenaltyPercent: 0,
      gracePeriodDays: 0,
    },
  });

  console.log('  Institution settings created');

  // ========================
  // RBAC — Seed 164 permissions and role mappings
  // ========================
  await seedRBAC();

  console.log('\nSeed completed successfully!');
  console.log('Summary:');
  console.log('  - 6 roles (ADMIN, TEACHER, ACCOUNTANT, CASHIER, SECRETARY, STUDENT)');
  console.log('  - 6 test users');
  console.log('  - 164 RBAC permissions');
  console.log('  - 3 filieres, 6 levels');
  console.log('  - 9 subjects');
  console.log('  - 20 students');
  console.log('  - 4 classes');
  console.log(`  - ${paymentPlans.length} payment plans with tranches`);
  console.log(`  - ${paymentCount} payments recorded`);
  console.log(`  - ${ohadaAccounts.length} OHADA accounts (classes 1-8)`);
  console.log('\nTest accounts:');
  console.log('  Admin:     admin@ipve.edu.ci / Admin@123');
  console.log('  Teacher:   m.konan@ipve.edu.ci / Teacher@2025');
  console.log('  Accountant: finance@ipve.edu.ci / Finance@2025');
  console.log('  Cashier:   caisse@ipve.edu.ci / Caissier@2025');
  console.log('  Secretary: secretariat@ipve.edu.ci / Secret@2025');
  console.log('  Student:   a.kone@etu.ipve.ci / Student@2025');
}

seed()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
