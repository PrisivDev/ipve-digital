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

import { config } from 'dotenv';
import { join } from 'path';
config({ path: join(process.cwd(), '.env'), override: true });

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
  await db.rolePermission.deleteMany();
  await db.permission.deleteMany();

  const permData = ALL_PERMS.map(p => ({
    module: (MODULE_MAP[p.module] ?? 'LMS'),
    action: p.action.toUpperCase(),
    resource: p.resource,
  }));
  for (const p of permData) {
    await db.permission.create({ data: p }).catch(() => {});
  }

  const allPerms = await db.permission.findMany();
  const permIdMap = new Map<string, string>();
  for (const p of allPerms) {
    permIdMap.set(`${p.module.toString().toLowerCase()}.${p.resource}.${p.action.toLowerCase()}`, p.id);
  }

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

  if (rolePermData.length > 0) {
    await db.rolePermission.deleteMany();
    await db.rolePermission.createMany({ data: rolePermData });
  }

  console.log(`  ${ALL_PERMS.length} permissions RBAC created (${rolePermData.length} mappings)`);
}

const TX_TIMEOUT = { timeout: 300_000 };

async function seed() {
  console.log('Seeding IPVE database (Supabase PostgreSQL)...\n');

  // 6 ROLES
  const [adminRole, teacherRole, accountantRole, cashierRole, secretaryRole, studentRole] =
    await db.$transaction([
      db.role.upsert({ where: { name: 'ADMIN' }, update: {}, create: { name: 'ADMIN', description: 'Accès complet à toutes les fonctionnalités' } }),
      db.role.upsert({ where: { name: 'TEACHER' }, update: {}, create: { name: 'TEACHER', description: 'Gestion des notes, emploi du temps, assiduité' } }),
      db.role.upsert({ where: { name: 'ACCOUNTANT' }, update: {}, create: { name: 'ACCOUNTANT', description: 'Gestion financière et comptabilité OHADA' } }),
      db.role.upsert({ where: { name: 'CASHIER' }, update: {}, create: { name: 'CASHIER', description: 'Gestion des paiements et encaissements' } }),
      db.role.upsert({ where: { name: 'SECRETARY' }, update: {}, create: { name: 'SECRETARY', description: 'Gestion des inscriptions et étudiants' } }),
      db.role.upsert({ where: { name: 'STUDENT' }, update: {}, create: { name: 'STUDENT', description: 'Consultation des notes, emploi du temps, paiements' } }),
    ], TX_TIMEOUT);
  console.log('  6 roles created');

  // Password hashes
  const [hashAdmin, hashTeacher, hashAccountant, hashCashier, hashSecretary, hashStudent] =
    await Promise.all([hash('Admin@123', 12), hash('Teacher@2025', 12), hash('Finance@2025', 12), hash('Caissier@2025', 12), hash('Secret@2025', 12), hash('Student@2025', 12)]);

  // 6 USERS
  const users = await db.$transaction([
    db.user.upsert({ where: { email: 'admin@ipve.edu.ci' }, update: {}, create: { email: 'admin@ipve.edu.ci', passwordHash: hashAdmin, firstName: 'Kouadio', lastName: 'Amani', phone: '+225 07 12 34 56', roleId: adminRole.id, isActive: true } }),
    db.user.upsert({ where: { email: 'm.konan@ipve.edu.ci' }, update: {}, create: { email: 'm.konan@ipve.edu.ci', passwordHash: hashTeacher, firstName: 'Moussa', lastName: 'Konan', phone: '+225 05 98 76 54', roleId: teacherRole.id, isActive: true } }),
    db.user.upsert({ where: { email: 'finance@ipve.edu.ci' }, update: {}, create: { email: 'finance@ipve.edu.ci', passwordHash: hashAccountant, firstName: 'Fatou', lastName: 'Diallo', phone: '+225 07 65 43 21', roleId: accountantRole.id, isActive: true } }),
    db.user.upsert({ where: { email: 'caisse@ipve.edu.ci' }, update: {}, create: { email: 'caisse@ipve.edu.ci', passwordHash: hashCashier, firstName: 'Aminata', lastName: 'Coulibaly', phone: '+225 01 55 44 33', roleId: cashierRole.id, isActive: true } }),
    db.user.upsert({ where: { email: 'secretariat@ipve.edu.ci' }, update: {}, create: { email: 'secretariat@ipve.edu.ci', passwordHash: hashSecretary, firstName: 'Marie', lastName: 'Bamba', phone: '+225 05 11 22 33', roleId: secretaryRole.id, isActive: true } }),
    db.user.upsert({ where: { email: 'a.kone@etu.ipve.ci' }, update: {}, create: { email: 'a.kone@etu.ipve.ci', passwordHash: hashStudent, firstName: 'Abdoulaye', lastName: 'Koné', phone: '+225 07 88 99 00', roleId: studentRole.id, isActive: true } }),
  ], TX_TIMEOUT);
  console.log('  6 users created');

  // Academic year + periods
  const [academicYear, period1, period2] = await db.$transaction([
    db.academicYear.upsert({ where: { id: 'ay-2024-2025' }, update: {}, create: { id: 'ay-2024-2025', name: '2024-2025', startDate: new Date('2024-10-01'), endDate: new Date('2025-07-31'), isCurrent: true } }),
    db.period.upsert({ where: { id: 'period-s1' }, update: {}, create: { id: 'period-s1', name: 'Semestre 1', academicYearId: 'ay-2024-2025', startDate: new Date('2024-10-01'), endDate: new Date('2025-02-28'), isCurrent: true } }),
    db.period.upsert({ where: { id: 'period-s2' }, update: {}, create: { id: 'period-s2', name: 'Semestre 2', academicYearId: 'ay-2024-2025', startDate: new Date('2025-03-01'), endDate: new Date('2025-07-31'), isCurrent: false } }),
  ], TX_TIMEOUT);
  console.log('  Academic year 2024-2025 created');

  // 3 filières + 6 levels
  const { filieres, levels } = await db.$transaction(async (tx) => {
    const f1 = await tx.filiere.upsert({ where: { code: 'INFO-BTS' }, update: {}, create: { code: 'INFO-BTS', name: 'BTS Informatique', description: 'Développement Web, Bases de données, Réseaux', durationYears: 2, isActive: true } });
    const f2 = await tx.filiere.upsert({ where: { code: 'GECO-BTS' }, update: {}, create: { code: 'GECO-BTS', name: 'BTS Gestion & Comptabilité', description: 'Comptabilité OHADA, Gestion, Droit des affaires', durationYears: 2, isActive: true } });
    const f3 = await tx.filiere.upsert({ where: { code: 'CPTA-BTS' }, update: {}, create: { code: 'CPTA-BTS', name: 'BTS Comptabilité', description: 'Comptabilité OHADA, Fiscalité, Audit', durationYears: 2, isActive: true } });
    const l1 = await tx.level.upsert({ where: { id: 'level-info-bts1' }, update: {}, create: { id: 'level-info-bts1', name: 'BTS 1 Informatique', filiereId: f1.id, yearNumber: 1, tuitionFee: 425000 } });
    const l2 = await tx.level.upsert({ where: { id: 'level-info-bts2' }, update: {}, create: { id: 'level-info-bts2', name: 'BTS 2 Informatique', filiereId: f1.id, yearNumber: 2, tuitionFee: 425000 } });
    const l3 = await tx.level.upsert({ where: { id: 'level-geco-bts1' }, update: {}, create: { id: 'level-geco-bts1', name: 'BTS 1 Gestion & Comptabilité', filiereId: f2.id, yearNumber: 1, tuitionFee: 360000 } });
    const l4 = await tx.level.upsert({ where: { id: 'level-geco-bts2' }, update: {}, create: { id: 'level-geco-bts2', name: 'BTS 2 Gestion & Comptabilité', filiereId: f2.id, yearNumber: 2, tuitionFee: 360000 } });
    const l5 = await tx.level.upsert({ where: { id: 'level-cpta-bts1' }, update: {}, create: { id: 'level-cpta-bts1', name: 'BTS 1 Comptabilité', filiereId: f3.id, yearNumber: 1, tuitionFee: 390000 } });
    const l6 = await tx.level.upsert({ where: { id: 'level-cpta-bts2' }, update: {}, create: { id: 'level-cpta-bts2', name: 'BTS 2 Comptabilité', filiereId: f3.id, yearNumber: 2, tuitionFee: 390000 } });
    return { filieres: [f1, f2, f3], levels: [l1, l2, l3, l4, l5, l6] };
  }, TX_TIMEOUT);
  console.log('  3 filieres and 6 levels created');

  // 9 Subjects
  await db.$transaction([
    db.subject.upsert({ where: { code: 'INF101' }, update: {}, create: { code: 'INF101', name: 'Algorithmique & Programmation', description: "Cours d'algorithmique et programmation structurée", isActive: true } }),
    db.subject.upsert({ where: { code: 'INF102' }, update: {}, create: { code: 'INF102', name: 'Bases de données', description: 'SQL, modélisation, MySQL/PostgreSQL', isActive: true } }),
    db.subject.upsert({ where: { code: 'INF201' }, update: {}, create: { code: 'INF201', name: 'Développement Web', description: 'HTML, CSS, JavaScript, React, Node.js', isActive: true } }),
    db.subject.upsert({ where: { code: 'GEC101' }, update: {}, create: { code: 'GEC101', name: 'Comptabilité Générale', description: 'Comptabilité OHADA, bilan, compte de résultat', isActive: true } }),
    db.subject.upsert({ where: { code: 'GEC102' }, update: {}, create: { code: 'GEC102', name: 'Droit des affaires', description: 'Droit OHADA, contrats, sociétés', isActive: true } }),
    db.subject.upsert({ where: { code: 'MKT101' }, update: {}, create: { code: 'MKT101', name: 'Marketing Digital', description: 'SEO, SEM, réseaux sociaux, analytics', isActive: true } }),
    db.subject.upsert({ where: { code: 'MKT102' }, update: {}, create: { code: 'MKT102', name: 'Communication visuelle', description: 'Design graphique, identité visuelle, PAO', isActive: true } }),
    db.subject.upsert({ where: { code: 'CPT101' }, update: {}, create: { code: 'CPT101', name: 'Comptabilité OHADA', description: 'Plan comptable SYSCOA, écritures, états financiers', isActive: true } }),
    db.subject.upsert({ where: { code: 'ANG101' }, update: {}, create: { code: 'ANG101', name: 'Anglais professionnel', description: 'Business English, TOEIC', isActive: true } }),
  ], TX_TIMEOUT);
  console.log('  9 subjects created');

  // 20 students + 4 classes
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
          studentNumber: `IPVE-2024-${String(i + 1).padStart(4, '0')}`, firstName: s.fn, lastName: s.ln,
          dateOfBirth: new Date(2001 + (i % 4), (i % 12) + 1, (i % 28) + 1), gender: s.g,
          nationality: 'Ivoirienne', address: ['Cocody', 'Plateau', 'Marcory', 'Yopougon', 'Treichville', 'Adjamé'][i % 6] + ', Abidjan',
          enrollmentDate: new Date('2024-10-01'), status: 'ACTIVE', filiereId: filieres[s.f].id, levelId: levelMap[s.l].id,
          parentName: `Parent ${s.ln}`, parentPhone: `+225 07 ${String(50 + i).padStart(2, '0')} ${String(10 + i * 3).padStart(2, '0')} ${String(20 + i * 2).padStart(2, '0')}`,
          userId: s.hasUser ? users[5].id : null,
        },
      });
      createdStudents.push(student);
    }
    const c0 = await tx.class.upsert({ where: { id: 'class-info-bts1' }, update: {}, create: { id: 'class-info-bts1', name: 'BTS 1 Info - Groupe A', levelId: levels[0].id, academicYearId: academicYear.id, capacity: 35, room: 'Salle A1' } });
    const c1 = await tx.class.upsert({ where: { id: 'class-info-bts2' }, update: {}, create: { id: 'class-info-bts2', name: 'BTS 2 Info - Groupe A', levelId: levels[1].id, academicYearId: academicYear.id, capacity: 30, room: 'Labo Info' } });
    const c2 = await tx.class.upsert({ where: { id: 'class-geco-bts1' }, update: {}, create: { id: 'class-geco-bts1', name: 'BTS 1 Geco - Groupe A', levelId: levels[2].id, academicYearId: academicYear.id, capacity: 40, room: 'Salle B2' } });
    const c3 = await tx.class.upsert({ where: { id: 'class-cpta-bts1' }, update: {}, create: { id: 'class-cpta-bts1', name: 'BTS 1 Compta - Groupe A', levelId: levels[4].id, academicYearId: academicYear.id, capacity: 35, room: 'Salle C3' } });
    const createdClasses = [c0, c1, c2, c3];
    for (const student of createdStudents) {
      const sf = filieres.findIndex((f) => f.id === student.filiereId);
      const sl = levels.findIndex((l) => l.id === student.levelId);
      let classId: string;
      if (sf === 0 && sl === 0) classId = createdClasses[0].id;
      else if (sf === 0 && sl === 1) classId = createdClasses[1].id;
      else if (sf === 1) classId = createdClasses[2].id;
      else classId = createdClasses[3].id;
      await tx.student.update({ where: { id: student.id }, data: { classId } });
    }
    return { students: createdStudents, classes: createdClasses };
  }, TX_TIMEOUT);
  console.log('  20 students created, 4 classes created');

  // Payment plans
  const planConfigs = [
    { level: levels[0], name: 'BTS 1 Info - Standard', total: 425000, tranches: [{ n: 1, name: 'Inscription', amount: 125000, due: '2024-10-15' }, { n: 2, name: '1ère tranche', amount: 150000, due: '2025-01-15' }, { n: 3, name: '2ème tranche', amount: 150000, due: '2025-04-15' }] },
    { level: levels[1], name: 'BTS 2 Info - Standard', total: 425000, tranches: [{ n: 1, name: 'Inscription', amount: 125000, due: '2024-10-15' }, { n: 2, name: '1ère tranche', amount: 150000, due: '2025-01-15' }, { n: 3, name: '2ème tranche', amount: 150000, due: '2025-04-15' }] },
    { level: levels[2], name: 'BTS 1 Geco - Standard', total: 360000, tranches: [{ n: 1, name: 'Inscription', amount: 110000, due: '2024-10-15' }, { n: 2, name: '1ère tranche', amount: 125000, due: '2025-01-15' }, { n: 3, name: '2ème tranche', amount: 125000, due: '2025-04-15' }] },
    { level: levels[3], name: 'BTS 2 Geco - Standard', total: 360000, tranches: [{ n: 1, name: 'Inscription', amount: 110000, due: '2024-10-15' }, { n: 2, name: '1ère tranche', amount: 125000, due: '2025-01-15' }, { n: 3, name: '2ème tranche', amount: 125000, due: '2025-04-15' }] },
    { level: levels[4], name: 'BTS 1 Compta - Standard', total: 390000, tranches: [{ n: 1, name: 'Inscription', amount: 120000, due: '2024-10-15' }, { n: 2, name: '1ère tranche', amount: 135000, due: '2025-01-15' }, { n: 3, name: '2ème tranche', amount: 135000, due: '2025-04-15' }] },
    { level: levels[5], name: 'BTS 2 Compta - Standard', total: 390000, tranches: [{ n: 1, name: 'Inscription', amount: 120000, due: '2024-10-15' }, { n: 2, name: '1ère tranche', amount: 135000, due: '2025-01-15' }, { n: 3, name: '2ème tranche', amount: 135000, due: '2025-04-15' }] },
  ];
  const paymentPlans = await db.$transaction(
    planConfigs.map(config =>
      db.paymentPlan.upsert({
        where: { id: `plan-${config.level.id}` }, update: {},
        create: {
          id: `plan-${config.level.id}`, name: config.name, levelId: config.level.id,
          academicYearId: academicYear.id, totalAmount: config.total, currency: 'XOF', isActive: true,
          tranches: { create: config.tranches.map(t => ({ trancheNumber: t.n, name: t.name, amount: t.amount, dueDate: new Date(t.due), isMandatory: true })) },
        },
        include: { tranches: true },
      }),
    ), TX_TIMEOUT,
  );
  console.log(`  ${paymentPlans.length} payment plans created`);

  // Sample payments
  await db.payment.deleteMany();
  const paymentMethods = ['CASH', 'MTN_MOMO', 'ORANGE_MONEY', 'WAVE', 'BANK_TRANSFER', 'CHEQUE'];
  const paymentOps = [];
  let paymentCount = 0;
  for (let i = 0; i < students.length; i++) {
    const student = students[i];
    const levelIdx = levelMap.findIndex(l => l.id === student.levelId);
    if (levelIdx === -1) continue;
    const plan = paymentPlans[levelIdx];
    if (!plan || !plan.tranches.length) continue;
    paymentOps.push(db.payment.create({ data: { paymentNumber: `PV-${new Date().getFullYear()}-${String(paymentCount + 1).padStart(5, '0')}`, studentId: student.id, trancheId: plan.tranches[0].id, amountPaid: plan.tranches[0].amount, paymentDate: new Date('2024-10-' + String(Math.min(15 + i, 28)).padStart(2, '0')), paymentMethod: paymentMethods[i % paymentMethods.length], receivedBy: users[3].id, status: 'COMPLETED' } }));
    paymentCount++;
    if (i % 10 < 7) { paymentOps.push(db.payment.create({ data: { paymentNumber: `PV-${new Date().getFullYear()}-${String(paymentCount + 1).padStart(5, '0')}`, studentId: student.id, trancheId: plan.tranches[1].id, amountPaid: plan.tranches[1].amount, paymentDate: new Date('2025-01-' + String(Math.min(10 + i, 28)).padStart(2, '0')), paymentMethod: paymentMethods[(i + 2) % paymentMethods.length], receivedBy: users[3].id, status: 'COMPLETED' } })); paymentCount++; }
    if (i % 10 < 3) { paymentOps.push(db.payment.create({ data: { paymentNumber: `PV-${new Date().getFullYear()}-${String(paymentCount + 1).padStart(5, '0')}`, studentId: student.id, trancheId: plan.tranches[2].id, amountPaid: plan.tranches[2].amount, paymentDate: new Date('2025-03-' + String(Math.min(5 + i, 28)).padStart(2, '0')), paymentMethod: paymentMethods[(i + 4) % paymentMethods.length], receivedBy: users[2].id, status: 'COMPLETED' } })); paymentCount++; }
  }
  await db.$transaction(paymentOps, TX_TIMEOUT);
  console.log(`  ${paymentCount} payments created`);

  // OHADA Chart of Accounts
  const ohadaAccounts = [
    { number: '101', name: 'Capital social', cls: '1', type: 'EQUITY', balance: 'CREDIT' },
    { number: '104', name: "Primes liées au capital", cls: '1', type: 'EQUITY', balance: 'CREDIT' },
    { number: '106', name: 'Réserves', cls: '1', type: 'EQUITY', balance: 'CREDIT' },
    { number: '108', name: "Compte de l'exploitant", cls: '1', type: 'EQUITY', balance: 'CREDIT' },
    { number: '12', name: "Résultat de l'exercice", cls: '1', type: 'EQUITY', balance: 'CREDIT' },
    { number: '16', name: 'Emprunts et dettes assimilées', cls: '1', type: 'LIABILITY', balance: 'CREDIT' },
    { number: '21', name: 'Immobilisations incorporelles', cls: '2', type: 'ASSET', balance: 'DEBIT' },
    { number: '23', name: 'Immobilisations corporelles', cls: '2', type: 'ASSET', balance: 'DEBIT' },
    { number: '24', name: 'Immobilisations financières', cls: '2', type: 'ASSET', balance: 'DEBIT' },
    { number: '28', name: 'Amortissements', cls: '2', type: 'ASSET', balance: 'CREDIT' },
    { number: '31', name: 'Stocks de marchandises', cls: '3', type: 'ASSET', balance: 'DEBIT' },
    { number: '35', name: 'Produits finis', cls: '3', type: 'ASSET', balance: 'DEBIT' },
    { number: '36', name: 'Stocks provenant de tiers', cls: '3', type: 'ASSET', balance: 'DEBIT' },
    { number: '38', name: 'Achats stockés', cls: '3', type: 'ASSET', balance: 'DEBIT' },
    { number: '401', name: 'Fournisseurs', cls: '4', type: 'LIABILITY', balance: 'CREDIT' },
    { number: '404', name: "Fournisseurs d'immobilisations", cls: '4', type: 'LIABILITY', balance: 'CREDIT' },
    { number: '411', name: 'Clients', cls: '4', type: 'ASSET', balance: 'DEBIT' },
    { number: '421', name: 'Personnel - Rémunérations dues', cls: '4', type: 'LIABILITY', balance: 'CREDIT' },
    { number: '43', name: 'Organismes sociaux', cls: '4', type: 'LIABILITY', balance: 'CREDIT' },
    { number: '441', name: 'État - Subventions à recevoir', cls: '4', type: 'ASSET', balance: 'DEBIT' },
    { number: '442', name: 'État - Impôts et taxes', cls: '4', type: 'LIABILITY', balance: 'CREDIT' },
    { number: '445', name: 'TVA', cls: '4', type: 'LIABILITY', balance: 'CREDIT' },
    { number: '45', name: 'Groupe et associés', cls: '4', type: 'ASSET', balance: 'DEBIT' },
    { number: '47', name: "Comptes d'attente", cls: '4', type: 'ASSET', balance: 'DEBIT' },
    { number: '48', name: 'Charges à payer', cls: '4', type: 'LIABILITY', balance: 'CREDIT' },
    { number: '51', name: 'Banques', cls: '5', type: 'ASSET', balance: 'DEBIT' },
    { number: '52', name: 'Instruments de trésorerie', cls: '5', type: 'ASSET', balance: 'DEBIT' },
    { number: '53', name: 'Caisse', cls: '5', type: 'ASSET', balance: 'DEBIT' },
    { number: '56', name: 'Banques - Crédits de trésorerie', cls: '5', type: 'LIABILITY', balance: 'CREDIT' },
    { number: '58', name: "Régies d'avances et accréditifs", cls: '5', type: 'ASSET', balance: 'DEBIT' },
    { number: '601', name: 'Achats de marchandises', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '604', name: "Achats d'études et prestations", cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '61', name: 'Transports', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '621', name: 'Personnel extérieur', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '623', name: 'Publicité, publications', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '625', name: 'Déplacements, missions', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '626', name: 'Frais postaux et télécommunications', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '63', name: 'Services extérieurs B', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '641', name: 'Rémunérations du personnel', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '645', name: 'Charges de sécurité sociale', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '646', name: 'Cotisations sociales', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '65', name: 'Autres charges', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '66', name: 'Charges financières', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '67', name: 'Éléments extraordinaires (charges)', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '68', name: 'Dotations aux amortissements', cls: '6', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '701', name: 'Ventes de marchandises', cls: '7', type: 'REVENUE', balance: 'CREDIT' },
    { number: '706', name: 'Prestations de services', cls: '7', type: 'REVENUE', balance: 'CREDIT' },
    { number: '707', name: 'Produits accessoires', cls: '7', type: 'REVENUE', balance: 'CREDIT' },
    { number: '71', name: "Subventions d'exploitation", cls: '7', type: 'REVENUE', balance: 'CREDIT' },
    { number: '74', name: "Subventions d'équilibre", cls: '7', type: 'REVENUE', balance: 'CREDIT' },
    { number: '75', name: 'Autres produits', cls: '7', type: 'REVENUE', balance: 'CREDIT' },
    { number: '76', name: 'Produits financiers', cls: '7', type: 'REVENUE', balance: 'CREDIT' },
    { number: '77', name: 'Éléments extraordinaires (produits)', cls: '7', type: 'REVENUE', balance: 'CREDIT' },
    { number: '78', name: 'Reprises de provisions', cls: '7', type: 'REVENUE', balance: 'CREDIT' },
    { number: '79', name: 'Transferts de charges', cls: '7', type: 'REVENUE', balance: 'CREDIT' },
    { number: '81', name: 'Valeur ajoutée', cls: '8', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '83', name: "Résultat brut d'exploitation", cls: '8', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '85', name: 'Résultat net avant impôt', cls: '8', type: 'EXPENSE', balance: 'DEBIT' },
    { number: '88', name: "Résultat de l'exercice", cls: '8', type: 'EXPENSE', balance: 'DEBIT' },
  ];
  await db.$transaction(
    ohadaAccounts.map(a => db.chartOfAccount.upsert({
      where: { accountNumber: a.number }, update: {},
      create: { accountNumber: a.number, accountName: a.name, accountClass: a.cls, accountType: a.type, normalBalance: a.balance, isActive: true },
    })),
    TX_TIMEOUT,
  );
  console.log(`  ${ohadaAccounts.length} OHADA accounts created`);

  // Notifications
  await db.notification.deleteMany();
  await db.$transaction([
    db.notification.create({ data: { userId: users[0].id, type: 'INFO', title: 'Rentrée académique 2024-2025', message: 'La rentrée est programmée le 1er octobre 2024.' } }),
    db.notification.create({ data: { userId: users[0].id, type: 'WARNING', title: 'Paiements en retard', message: '8 étudiants ont des paiements en retard.' } }),
    db.notification.create({ data: { userId: users[1].id, type: 'INFO', title: 'Saisie des notes S1', message: 'La saisie des notes du Semestre 1 est ouverte.' } }),
    db.notification.create({ data: { userId: users[2].id, type: 'SUCCESS', title: 'Comptabilité à jour', message: 'Les écritures du mois de novembre sont validées.' } }),
  ], TX_TIMEOUT);
  console.log('  Notifications created');

  // Institution settings
  await db.institutionSettings.upsert({
    where: { id: 'default-settings' }, update: {},
    create: {
      id: 'default-settings', schoolName: "Institut Polytechnique Vase d'Élites", shortName: 'IPVE',
      motto: 'Scientia Nobis Lumen', address: "Abidjan, Côte d'Ivoire", phone: '+225 27 21 00 00',
      email: 'infos@pve.edu.ci', website: 'www.ipve.edu.ci', academicYear: '2024-2025',
      currency: 'XOF', locale: 'fr-FR', passwordMinLength: 8, passwordRequireUppercase: true,
      passwordRequireNumbers: true, passwordRequireSpecial: false, sessionTimeoutMinutes: 480,
      maxLoginAttempts: 5, twoFactorEnforced: false, defaultPaymentMethod: 'CASH',
      latePenaltyPercent: 0, gracePeriodDays: 0,
    },
  });
  console.log('  Institution settings created');

  // RBAC permissions
  await seedRBAC();

  console.log('\nSeed completed successfully!');
  console.log('  - 6 roles, 6 users, 164 permissions');
  console.log('  - 3 filieres, 6 levels, 9 subjects');
  console.log('  - 20 students, 4 classes');
  console.log(`  - ${paymentPlans.length} payment plans, ${paymentCount} payments`);
  console.log(`  - ${ohadaAccounts.length} OHADA accounts`);
  console.log('\nTest accounts:');
  console.log('  Admin:     admin@ipve.edu.ci / Admin@123');
}

seed()
  .catch((e) => {
    console.error('Seed failed:', e.message?.substring(0, 500));
    process.exit(1);
  })
  .finally(() => db.$disconnect());
