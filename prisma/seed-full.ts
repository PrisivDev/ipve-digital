// prisma/seed-full.ts
// Comprehensive seed data for IPVE Digital School Management
// Run: cd /home/z/my-project && unset DATABASE_URL && node prisma/seed-full.ts

import dotenv from 'dotenv';
import path from 'path';
import { PrismaClient } from '@prisma/client';

// Load .env and override system env (system has SQLite URL)
dotenv.config({ path: path.resolve(__dirname, '..', '.env'), override: true });

const prisma = new PrismaClient({
  datasourceUrl: process.env.DATABASE_URL,
});

async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcryptjs');
  return bcrypt.hash(password, 12);
}

const MONTHS_FR = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

// ─── Seed Data Definitions ────────────────────────────────────

const FILIERES = [
  { name: 'Informatique', code: 'INFO', description: 'Licence en Informatique', durationYears: 3 },
  { name: 'Gestion', code: 'GEST', description: 'Licence en Gestion des Entreprises', durationYears: 3 },
  { name: 'Marketing', code: 'MKTG', description: 'Licence en Marketing & Commerce', durationYears: 3 },
  { name: 'Comptabilité', code: 'COMPTA', description: 'Licence en Comptabilité & Finance', durationYears: 3 },
];

const LEVEL_NAMES = ['L1', 'L2', 'L3'];
const TUITION_FEES = [350000, 400000, 450000];

const SUBJECTS_BY_FILIERE: Record<string, { name: string; code: string }[]> = {
  INFO: [
    { name: 'Algorithmique', code: 'INFO-ALGO' },
    { name: 'Bases de Données', code: 'INFO-BDD' },
    { name: 'Réseaux Informatiques', code: 'INFO-RESEAU' },
  ],
  GEST: [
    { name: 'Management', code: 'GEST-MGT' },
    { name: 'Comptabilité Générale', code: 'GEST-COMPTA' },
    { name: 'Droit des Affaires', code: 'GEST-DROIT' },
  ],
  MKTG: [
    { name: 'Marketing Fondamental', code: 'MKTG-FOND' },
    { name: 'Communication', code: 'MKTG-COMM' },
    { name: 'Études de Marché', code: 'MKTG-ETUDE' },
  ],
  COMPTA: [
    { name: 'Comptabilité Approfondie', code: 'COMPTA-APPROF' },
    { name: 'Gestion Financière', code: 'COMPTA-FIN' },
    { name: 'Fiscalité', code: 'COMPTA-FISC' },
  ],
};

const TEACHERS = [
  { email: 'kouadio.prof@ipve.edu.ci', firstName: 'Jean-Claude', lastName: 'Kouadio', password: 'Teacher@2025' },
  { email: 'traore.prof@ipve.edu.ci', firstName: 'Aminata', lastName: 'Traoré', password: 'Teacher@2025' },
  { email: 'diallo.prof@ipve.edu.ci', firstName: 'Ibrahim', lastName: 'Diallo', password: 'Teacher@2025' },
];

const ACCOUNTANT = { email: 'comptable@ipve.edu.ci', firstName: 'Marie', lastName: 'Konan', password: 'Compta@2025' };
const CASHIER = { email: 'caissier@ipve.edu.ci', firstName: 'Ahou', lastName: 'Bamba', password: 'Cashier@2025' };

const STUDENTS = [
  { firstName: 'Aka', lastName: 'Kouadio', gender: 'MALE' as const, status: 'ACTIVE' as const },
  { firstName: 'Fatou', lastName: 'Traoré', gender: 'FEMALE' as const, status: 'ACTIVE' as const },
  { firstName: 'Moussa', lastName: 'Diallo', gender: 'MALE' as const, status: 'ACTIVE' as const },
  { firstName: 'Aminata', lastName: 'Koné', gender: 'FEMALE' as const, status: 'ENROLLED' as const },
  { firstName: 'Yao', lastName: 'Bamba', gender: 'MALE' as const, status: 'ACTIVE' as const },
  { firstName: 'Adja', lastName: 'Ouattara', gender: 'FEMALE' as const, status: 'ACTIVE' as const },
  { firstName: 'Koffi', lastName: 'Konan', gender: 'MALE' as const, status: 'ACTIVE' as const },
  { firstName: 'Mariam', lastName: 'Coulibaly', gender: 'FEMALE' as const, status: 'ENROLLED' as const },
  { firstName: 'Seydou', lastName: 'Dembélé', gender: 'MALE' as const, status: 'ACTIVE' as const },
  { firstName: 'Aïssata', lastName: 'Cissé', gender: 'FEMALE' as const, status: 'ACTIVE' as const },
  { firstName: 'Bakary', lastName: 'Touré', gender: 'MALE' as const, status: 'ACTIVE' as const },
  { firstName: 'Djénéba', lastName: 'Sanogo', gender: 'FEMALE' as const, status: 'ENROLLED' as const },
  { firstName: 'Lamine', lastName: 'Keita', gender: 'MALE' as const, status: 'ACTIVE' as const },
  { firstName: 'Kadiatou', lastName: 'Camara', gender: 'FEMALE' as const, status: 'ACTIVE' as const },
  { firstName: 'Oumar', lastName: 'Sidibé', gender: 'MALE' as const, status: 'ENROLLED' as const },
  { firstName: 'Rokia', lastName: 'Diarra', gender: 'FEMALE' as const, status: 'ACTIVE' as const },
  { firstName: 'Abdoulaye', lastName: 'Sissoko', gender: 'MALE' as const, status: 'ACTIVE' as const },
  { firstName: 'Fatim', lastName: 'Sangaré', gender: 'FEMALE' as const, status: 'ENROLLED' as const },
  { firstName: 'Cheick', lastName: 'Traoré', gender: 'MALE' as const, status: 'ACTIVE' as const },
  { firstName: 'Bintou', lastName: 'Bagayoko', gender: 'FEMALE' as const, status: 'ACTIVE' as const },
];

const PAYMENT_METHODS = ['CASH', 'MTN_MOMO', 'ORANGE_MONEY', 'WAVE'] as const;

const PROSPECTS = [
  { firstName: 'Esnault', lastName: 'Yao', phone: '+2250701020304', source: 'WEBSITE', status: 'NOUVEAU', gender: 'MALE' },
  { firstName: 'Nathalie', lastName: 'Epée', phone: '+2250711223344', source: 'WHATSAPP', status: 'CONTACTE', gender: 'FEMALE' },
  { firstName: 'Régis', lastName: 'Ake', phone: '+2250722334455', source: 'RECOMMENDATION', status: 'INTERESSE', gender: 'MALE' },
  { firstName: 'Christelle', lastName: 'Ahou', phone: '+2250733445566', source: 'WALK_IN', status: 'NOUVEAU', gender: 'FEMALE' },
  { firstName: 'Patrick', lastName: 'Zadi', phone: '+2250744556677', source: 'WEBSITE', status: 'CONTACTE', gender: 'MALE' },
  { firstName: 'Stéphanie', lastName: 'N\'Guessan', phone: '+2250755667788', source: 'FACEBOOK', status: 'INTERESSE', gender: 'FEMALE' },
  { firstName: 'Armand', lastName: 'Koffi', phone: '+2250766778899', source: 'WHATSAPP', status: 'NOUVEAU', gender: 'MALE' },
  { firstName: 'Géraldine', lastName: 'Aka', phone: '+2250777889900', source: 'RECOMMENDATION', status: 'CONTACTE', gender: 'FEMALE' },
];

const NOTIFICATIONS = [
  { type: 'INFO', title: 'Rentrée académique', message: 'La rentrée académique 2024-2025 est fixée au 15 septembre 2024.' },
  { type: 'SUCCESS', title: 'Paiement validé', message: 'Le paiement de Kouadio Aka a été validé avec succès.' },
  { type: 'WARNING', title: 'Paiement en retard', message: '3 étudiants ont des paiements en retard de plus de 30 jours.' },
  { type: 'INFO', title: 'Nouveau professeur', message: 'M. Ibrahim Diallo a rejoint le département Informatique.' },
  { type: 'SUCCESS', title: 'Notes publiées', message: 'Les notes de composition du 1er semestre ont été publiées.' },
];

const EXPENSE_CATEGORIES = [
  { name: 'Salaires', code: 'SAL', budgetLimit: 2000000 },
  { name: 'Loyers', code: 'LOY', budgetLimit: 500000 },
  { name: 'Fournitures', code: 'FOUR', budgetLimit: 200000 },
  { name: 'Électricité', code: 'ELEC', budgetLimit: 150000 },
  { name: 'Maintenance', code: 'MAINT', budgetLimit: 300000 },
];

const EXPENSES = [
  { description: 'Salaires enseignants Janvier 2025', amount: 1200000, method: 'BANK_TRANSFER', status: 'PAID', categoryIdx: 0, date: '2025-01-31' },
  { description: 'Loyer bureau principal', amount: 350000, method: 'BANK_TRANSFER', status: 'PAID', categoryIdx: 1, date: '2025-01-05' },
  { description: 'Fournitures de bureau', amount: 85000, method: 'CASH', status: 'PAID', categoryIdx: 2, date: '2025-01-15' },
  { description: 'Facture électricité Janvier', amount: 95000, method: 'WAVE', status: 'PAID', categoryIdx: 3, date: '2025-02-05' },
  { description: 'Salaires enseignants Février 2025', amount: 1200000, method: 'BANK_TRANSFER', status: 'PAID', categoryIdx: 0, date: '2025-02-28' },
  { description: 'Réparation climatisation', amount: 75000, method: 'CASH', status: 'PENDING', categoryIdx: 4, date: '2025-03-10' },
  { description: 'Salaires enseignants Mars 2025', amount: 1200000, method: 'BANK_TRANSFER', status: 'PAID', categoryIdx: 0, date: '2025-03-31' },
  { description: 'Cartouches imprimante', amount: 45000, method: 'CASH', status: 'PAID', categoryIdx: 2, date: '2025-04-02' },
];

// ─── Main Seed Function ──────────────────────────────────────

async function main() {
  console.log('🌱 Starting IPVE comprehensive seed...');
  const dbUrl = process.env.DATABASE_URL;
  console.log(`   DATABASE_URL: ${dbUrl?.substring(0, 40)}...`);

  // ─── 1. Institution Settings ───
  console.log('\n📋 Creating institution settings...');
  await prisma.institutionSettings.upsert({
    where: { id: 'default-inst-001' },
    update: {},
    create: {
      id: 'default-inst-001',
      schoolName: 'Institut Polytechnique Vase d\'Élites',
      shortName: 'IPVE',
      motto: 'Scientia Nobis Lumen',
      address: 'Cocody Riviera 3, Abidjan, Côte d\'Ivoire',
      phone: '+225 27 20 30 40 50',
      email: 'infos@ipve.edu.ci',
      website: 'www.ipve.edu.ci',
      academicYear: '2024-2025',
      currency: 'XOF',
      locale: 'fr-FR',
    },
  });
  console.log('   ✅ Institution settings created');

  // ─── 2. Filieres ───
  console.log('\n📚 Creating filieres...');
  const filiereRecords: Record<string, { id: string }> = {};
  for (const f of FILIERES) {
    const record = await prisma.filiere.upsert({
      where: { code: f.code },
      update: {},
      create: {
        name: f.name,
        code: f.code,
        description: f.description,
        durationYears: f.durationYears,
        isActive: true,
      },
    });
    filiereRecords[f.code] = { id: record.id };
    console.log(`   ✅ Filière ${f.name} (${f.code}): ${record.id}`);
  }

  // ─── 3. Levels (3 per filiere) ───
  console.log('\n📊 Creating levels...');
  const levelRecords: Record<string, { id: string; filiereCode: string }> = {};
  for (const [code, filiere] of Object.entries(filiereRecords)) {
    for (let i = 0; i < 3; i++) {
      const level = await prisma.level.create({
        data: {
          name: `${LEVEL_NAMES[i]} ${code}`,
          filiereId: filiere.id,
          yearNumber: i + 1,
          tuitionFee: TUITION_FEES[i],
        },
      });
      const key = `${code}-L${i + 1}`;
      levelRecords[key] = { id: level.id, filiereCode: code };
      console.log(`   ✅ Level ${key}: ${level.id}`);
    }
  }

  // ─── 4. Academic Year ───
  console.log('\n📅 Creating academic year...');
  const academicYear = await prisma.academicYear.upsert({
    where: { id: 'ay-2024-2025' },
    update: {},
    create: {
      id: 'ay-2024-2025',
      name: '2024-2025',
      startDate: new Date('2024-09-15'),
      endDate: new Date('2025-07-31'),
      isCurrent: true,
    },
  });
  console.log(`   ✅ Academic Year: ${academicYear.name}`);

  // ─── 5. Classes (one per filiere L1) ───
  console.log('\n🏫 Creating classes...');
  const classRecords: Record<string, { id: string; levelId: string }> = {};
  for (const code of Object.keys(filiereRecords)) {
    const levelKey = `${code}-L1`;
    const level = levelRecords[levelKey];
    const cls = await prisma.class.create({
      data: {
        name: `${code} L1 - Groupe A`,
        levelId: level.id,
        capacity: 40,
        room: `Salle ${code}`,
        academicYearId: academicYear.id,
      },
    });
    classRecords[code] = { id: cls.id, levelId: level.id };
    console.log(`   ✅ Class ${cls.name}: ${cls.id}`);
  }

  // ─── 6. Subjects (3 per filiere) ───
  console.log('\n📖 Creating subjects...');
  const subjectRecords: Record<string, { id: string; name: string }> = {};
  for (const [code, subjects] of Object.entries(SUBJECTS_BY_FILIERE)) {
    for (const subj of subjects) {
      const subject = await prisma.subject.create({
        data: {
          name: subj.name,
          code: subj.code,
          isActive: true,
        },
      });
      subjectRecords[subj.code] = { id: subject.id, name: subject.name };
      console.log(`   ✅ Subject ${subj.name} (${subj.code}): ${subject.id}`);
    }
  }

  // ─── 7. Roles & Admin User ───
  console.log('\n🔑 Creating roles...');
  const ROLE_NAMES = [
    { name: 'ADMIN', description: 'Administrateur système' },
    { name: 'TEACHER', description: 'Enseignant' },
    { name: 'ACCOUNTANT', description: 'Comptable' },
    { name: 'CASHIER', description: 'Caissier' },
    { name: 'SECRETARY', description: 'Secrétaire' },
    { name: 'PARENT', description: 'Parent d\'élève' },
    { name: 'STUDENT', description: 'Étudiant' },
  ];

  const roleRecords: Record<string, string> = {};
  for (const r of ROLE_NAMES) {
    const role = await prisma.role.upsert({
      where: { name: r.name },
      update: { description: r.description },
      create: { name: r.name, description: r.description },
    });
    roleRecords[r.name] = role.id;
    console.log(`   ✅ Role ${r.name}: ${role.id}`);
  }

  // Create admin user if not exists
  const existingAdmin = await prisma.user.findFirst({ where: { email: 'admin@ipve.edu.ci' } });
  if (!existingAdmin) {
    const adminHashed = await hashPassword('Admin@2025');
    await prisma.user.create({
      data: {
        email: 'admin@ipve.edu.ci',
        passwordHash: adminHashed,
        firstName: 'Admin',
        lastName: 'IPVE',
        roleId: roleRecords['ADMIN'],
        isActive: true,
        phone: '+225 01 00 00 00',
      },
    });
    console.log('   ✅ Admin user created: admin@ipve.edu.ci');
  } else {
    console.log('   ⏭️  Admin user already exists, skipping');
  }

  // ─── 8. ClassSubjects (one subject per class with a teacher) ───
  console.log('\n🔗 Creating class-subjects...');
  const teacherRole = { id: roleRecords['TEACHER'] };

  const teacherUsers: { id: string }[] = [];
  for (const t of TEACHERS) {
    const hashed = await hashPassword(t.password);
    const user = await prisma.user.upsert({
      where: { email: t.email },
      update: {},
      create: {
        email: t.email,
        passwordHash: hashed,
        firstName: t.firstName,
        lastName: t.lastName,
        roleId: teacherRole?.id || '',
        isActive: true,
        phone: '+225 01 02 03 04',
      },
    });
    teacherUsers.push({ id: user.id });
    console.log(`   ✅ Teacher: ${t.firstName} ${t.lastName} (${t.email}): ${user.id}`);
  }

  // Create class-subjects: first subject for each class
  const filiereCodes = Object.keys(filiereRecords);
  const classSubjectRecords: string[] = [];
  for (let i = 0; i < filiereCodes.length; i++) {
    const code = filiereCodes[i];
    const subjectsForFiliere = SUBJECTS_BY_FILIERE[code];
    const firstSubject = subjectsForFiliere[0];
    const cls = classRecords[code];
    const teacherId = teacherUsers[i % teacherUsers.length].id;

    const cs = await prisma.classSubject.create({
      data: {
        classId: cls.id,
        subjectId: subjectRecords[firstSubject.code].id,
        teacherId,
        coefficient: 1.0,
        hoursPerWeek: 4,
      },
    });
    classSubjectRecords.push(cs.id);
    console.log(`   ✅ ClassSubject ${code}/${firstSubject.code}: ${cs.id} (teacher: ${teacherId})`);
  }

  // ─── 8. Additional Users (Accountant + Cashier) ───
  console.log('\n👤 Creating additional users...');
  const accountantRole = { id: roleRecords['ACCOUNTANT'] };
  const cashierRole = { id: roleRecords['CASHIER'] };

  const acctHashed = await hashPassword(ACCOUNTANT.password);
  const accountantUser = await prisma.user.upsert({
    where: { email: ACCOUNTANT.email },
    update: {},
    create: {
      email: ACCOUNTANT.email,
      passwordHash: acctHashed,
      firstName: ACCOUNTANT.firstName,
      lastName: ACCOUNTANT.lastName,
      roleId: accountantRole?.id || '',
      isActive: true,
    },
  });
  console.log(`   ✅ Accountant: ${ACCOUNTANT.email}: ${accountantUser.id}`);

  const cashHashed = await hashPassword(CASHIER.password);
  const cashierUser = await prisma.user.upsert({
    where: { email: CASHIER.email },
    update: {},
    create: {
      email: CASHIER.email,
      passwordHash: cashHashed,
      firstName: CASHIER.firstName,
      lastName: CASHIER.lastName,
      roleId: cashierRole?.id || '',
      isActive: true,
    },
  });
  console.log(`   ✅ Cashier: ${CASHIER.email}: ${cashierUser.id}`);

  // ─── 9. Students (20) ───
  console.log('\n🎓 Creating students...');
  const studentRecords: { id: string; firstName: string; lastName: string; studentNumber: string }[] = [];
  const filiereIds = Object.values(filiereRecords).map(f => f.id);
  const allLevelIds = Object.values(levelRecords);

  for (let i = 0; i < STUDENTS.length; i++) {
    const s = STUDENTS[i];
    const filiereIdx = i % filiereIds.length;
    const filiereCode = filiereCodes[filiereIdx];
    const levelKey = `${filiereCode}-L${(Math.floor(i / 4) % 3) + 1}`;
    const level = levelRecords[levelKey];
    const cls = classRecords[filiereCode];
    const studentNumber = `IPVE-2024-${String(i + 1).padStart(3, '0')}`;

    const student = await prisma.student.create({
      data: {
        studentNumber,
        firstName: s.firstName,
        lastName: s.lastName,
        gender: s.gender,
        status: s.status,
        filiereId: filiereIds[filiereIdx],
        levelId: level.id,
        classId: cls.id,
        enrollmentDate: new Date('2024-09-15'),
        nationality: 'Ivoirienne',
        userId: null,
      },
    });
    studentRecords.push({
      id: student.id,
      firstName: student.firstName,
      lastName: student.lastName,
      studentNumber,
    });
  }
  console.log(`   ✅ ${studentRecords.length} students created`);

  // ─── 10. Payment Plans + Tranches (4 plans, one per filiere L1) ───
  console.log('\n💳 Creating payment plans...');
  const planTrancheRecords: Record<string, { id: string }> = {};

  for (const code of filiereCodes) {
    const level = levelRecords[`${code}-L1`];
    const plan = await prisma.paymentPlan.create({
      data: {
        name: `Plan ${code} L1 2024-2025`,
        levelId: level.id,
        academicYearId: academicYear.id,
        totalAmount: 350000,
        currency: 'XOF',
        isActive: true,
      },
    });
    console.log(`   ✅ Payment Plan ${plan.name}: ${plan.id}`);

    // 4 tranches
    const trancheAmounts = [100000, 100000, 100000, 50000];
    for (let t = 0; t < 4; t++) {
      const tranche = await prisma.paymentPlanTranche.create({
        data: {
          planId: plan.id,
          trancheNumber: t + 1,
          name: `Tranche ${t + 1}`,
          amount: trancheAmounts[t],
          dueDate: new Date(2025, t * 3, 15), // Mar, Jun, Sep, Dec
          isMandatory: true,
        },
      });
      planTrancheRecords[`${code}-T${t + 1}`] = { id: tranche.id };
    }
  }

  // ─── 11. Payments (30: 15 students × 2 each) ───
  console.log('\n💰 Creating payments...');
  let paymentCount = 0;
  for (let s = 0; s < 15; s++) {
    const student = studentRecords[s];
    for (let p = 0; p < 2; p++) {
      const paymentIdx = paymentCount;
      const paymentNumber = `PAY-2024-${String(paymentIdx + 1).padStart(3, '0')}`;
      const amount = 100000 + Math.floor(Math.random() * 100001); // 100k-200k
      const status = paymentIdx < 21 ? 'COMPLETED' : 'PENDING'; // 70% completed
      const method = PAYMENT_METHODS[paymentIdx % PAYMENT_METHODS.length] as string;
      const monthOffset = Math.floor(paymentIdx / 5); // 0=Jan, 1=Feb, etc.
      const day = 5 + (paymentIdx % 20);
      const paymentDate = new Date(2025, monthOffset, Math.min(day, 28));

      // Pick a tranche from the student's filiere plan
      const studentFiliereIdx = s % filiereCodes.length;
      const filiereCode = filiereCodes[studentFiliereIdx];
      const trancheKey = `${filiereCode}-T${(p % 4) + 1}`;
      const trancheId = planTrancheRecords[trancheKey]?.id;

      if (!trancheId) continue;

      await prisma.payment.create({
        data: {
          paymentNumber,
          studentId: student.id,
          trancheId,
          amountPaid: amount,
          paymentDate,
          paymentMethod: method,
          receivedBy: cashierUser.id,
          status,
          notes: `Paiement ${p + 1} de ${student.firstName} ${student.lastName}`,
        },
      });
      paymentCount++;
    }
  }
  console.log(`   ✅ ${paymentCount} payments created`);

  // ─── 12. Period (needed for Grades) ───
  console.log('\n📅 Creating periods...');
  const period1 = await prisma.period.create({
    data: {
      name: '1er Semestre',
      academicYearId: academicYear.id,
      startDate: new Date('2024-09-15'),
      endDate: new Date('2025-02-28'),
      weight: 1,
      sortOrder: 1,
      isCurrent: true,
    },
  });
  console.log(`   ✅ Period: ${period1.name}`);

  // ─── 13. Grades (40: 10 students × mix of DEVOIR/COMPOSITION) ───
  console.log('\n📝 Creating grades...');
  const firstClassSubjectId = classSubjectRecords[0];
  const evaluationTypes = ['DEVOIR', 'COMPOSITION'];
  let gradeCount = 0;

  for (let s = 0; s < 10; s++) {
    const student = studentRecords[s];
    const numGrades = 4;
    for (let g = 0; g < numGrades && gradeCount < 40; g++) {
      const score = 6 + Math.floor(Math.random() * 13); // 6-18
      const evType = evaluationTypes[g % 2];

      await prisma.grade.create({
        data: {
          studentId: student.id,
          subjectId: firstClassSubjectId,
          classId: classRecords[filiereCodes[0]].id,
          academicYearId: academicYear.id,
          periodId: period1.id,
          evaluationType: evType,
          score,
          maxScore: 20,
          coefficient: 1,
          enteredBy: teacherUsers[0].id,
          isValidated: evType === 'COMPOSITION',
          validatedBy: evType === 'COMPOSITION' ? teacherUsers[0].id : null,
        },
      });
      gradeCount++;
    }
  }
  console.log(`   ✅ ${gradeCount} grades created`);

  // ─── 13. Attendance (30: 10 students × 3 records each) ───
  console.log('\n📋 Creating attendance records...');
  const attendanceStatuses = ['PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'PRESENT', 'ABSENT', 'LATE']; // 80/10/10
  let attCount = 0;

  for (let s = 0; s < 10; s++) {
    const student = studentRecords[s];
    for (let a = 0; a < 3; a++) {
      const status = attendanceStatuses[Math.floor(Math.random() * attendanceStatuses.length)];
      const day = 3 + (a * 5) + (s % 3);
      const date = new Date(2025, 2, Math.min(day, 28)); // March 2025

      await prisma.attendance.create({
        data: {
          studentId: student.id,
          classId: classRecords[filiereCodes[0]].id,
          subjectId: firstClassSubjectId,
          date,
          status,
          recordedBy: teacherUsers[0].id,
        },
      });
      attCount++;
    }
  }
  console.log(`   ✅ ${attCount} attendance records created`);

  // ─── 14. Prospects (8) ───
  console.log('\n📞 Creating prospects...');
  for (const p of PROSPECTS) {
    await prisma.prospect.create({
      data: {
        firstName: p.firstName,
        lastName: p.lastName,
        phone: p.phone,
        source: p.source,
        status: p.status,
        gender: p.gender,
        nationality: 'Ivoirienne',
        filiereInterest: filiereCodes[Math.floor(Math.random() * filiereCodes.length)],
        levelInterest: 'L1',
        lastContactAt: new Date(2025, 3, Math.floor(Math.random() * 15) + 1),
      },
    });
  }
  console.log(`   ✅ ${PROSPECTS.length} prospects created`);

  // ─── 15. Notifications (5) ───
  console.log('\n🔔 Creating notifications...');
  for (let i = 0; i < NOTIFICATIONS.length; i++) {
    const n = NOTIFICATIONS[i];
    await prisma.notification.create({
      data: {
        userId: null,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: i > 2, // last 2 are read
        createdAt: new Date(2025, 3, NOTIFICATIONS.length - i),
      },
    });
  }
  console.log(`   ✅ ${NOTIFICATIONS.length} notifications created`);

  // ─── 16. Expense Categories (5) ───
  console.log('\n📂 Creating expense categories...');
  const expCatRecords: string[] = [];
  for (const cat of EXPENSE_CATEGORIES) {
    const record = await prisma.expenseCategory.create({
      data: {
        name: cat.name,
        code: cat.code,
        budgetLimit: cat.budgetLimit,
        isActive: true,
      },
    });
    expCatRecords.push(record.id);
    console.log(`   ✅ Category ${cat.name}: ${record.id}`);
  }

  // ─── 17. Expenses (8) ───
  console.log('\n💸 Creating expenses...');
  for (let i = 0; i < EXPENSES.length; i++) {
    const e = EXPENSES[i];
    await prisma.expense.create({
      data: {
        expenseNumber: `EXP-2025-${String(i + 1).padStart(3, '0')}`,
        categoryId: expCatRecords[e.categoryIdx],
        description: e.description,
        amount: e.amount,
        expenseDate: new Date(e.date),
        paymentMethod: e.method,
        enteredBy: accountantUser.id,
        approvedBy: e.status === 'PAID' ? accountantUser.id : null,
        status: e.status,
      },
    });
  }
  console.log(`   ✅ ${EXPENSES.length} expenses created`);

  console.log('\n✅ Seed completed successfully!');
  console.log('   Summary:');
  console.log(`   - 1 Institution Settings`);
  console.log(`   - 4 Filieres`);
  console.log(`   - 12 Levels`);
  console.log(`   - 1 Academic Year`);
  console.log(`   - 4 Classes`);
  console.log(`   - 12 Subjects`);
  console.log(`   - 4 ClassSubjects`);
  console.log(`   - 5 Users (3 teachers + 1 accountant + 1 cashier)`);
  console.log(`   - 20 Students`);
  console.log(`   - 4 Payment Plans + 16 Tranches`);
  console.log(`   - 30 Payments`);
  console.log(`   - 40 Grades`);
  console.log(`   - 30 Attendance records`);
  console.log(`   - 8 Prospects`);
  console.log(`   - 5 Notifications`);
  console.log(`   - 5 Expense Categories`);
  console.log(`   - 8 Expenses`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
