import { db } from '@/lib/db';
import { NextRequest } from 'next/server';
import { json } from '@/lib/json';
import { hash } from 'bcryptjs';
import { verifySettingsAdmin } from '@/lib/auth/settings-auth';
import { verifyAuth } from '@/lib/auth-helpers/route-auth';

// ─── GET /api/teachers?search=xxx&status=active|inactive ────────────
export async function GET(request: NextRequest) {
  const auth = await verifyAuth(request);
  if (!auth.authorized) return auth.response;

  try {
    const { searchParams } = request.nextUrl;
    const search = searchParams.get('search')?.trim() || '';
    const status = searchParams.get('status') || ''; // 'active' | 'inactive' | ''

    const teacherRole = await db.role.findFirst({ where: { name: 'TEACHER' } });
    if (!teacherRole) {
      return json({ teachers: [] });
    }

    // Build where clause
    const where: Record<string, unknown> = { roleId: teacherRole.id };
    if (status === 'active') {
      where.isActive = true;
    } else if (status === 'inactive') {
      where.isActive = false;
    }

    if (search) {
      (where as Record<string, unknown>).OR = [
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const teachers = await db.user.findMany({
      where,
      orderBy: { lastName: 'asc' },
      include: {
        role: { select: { name: true } },
        classSubjects: {
          include: {
            subject: { select: { name: true, code: true } },
            class: { select: { name: true } },
          },
        },
        employeeProfile: {
          select: {
            contractType: true,
            department: true,
            baseSalary: true,
            hireDate: true,
            position: true,
          },
        },
      },
    });

    const enriched = teachers.map((t) => {
      const totalSubjects = t.classSubjects.length;
      const totalHours = t.classSubjects.reduce(
        (sum, cs) => sum + cs.hoursPerWeek,
        0,
      );
      return {
        id: t.id,
        firstName: t.firstName,
        lastName: t.lastName,
        email: t.email,
        phone: t.phone,
        isActive: t.isActive,
        roleName: t.role.name,
        totalSubjects,
        totalHours,
        subjects: t.classSubjects.map((cs) => ({
          name: cs.subject.name,
          code: cs.subject.code,
          className: cs.class.name,
          hoursPerWeek: cs.hoursPerWeek,
        })),
        contract: t.employeeProfile
          ? {
              type: t.employeeProfile.contractType,
              department: t.employeeProfile.department,
              baseSalary: t.employeeProfile.baseSalary,
              hireDate: t.employeeProfile.hireDate,
              position: t.employeeProfile.position,
            }
          : null,
      };
    });

    return json({ teachers: enriched });
  } catch (error) {
    console.error('Teachers API error:', error);
    return json({ error: 'Échec du chargement des enseignants' }, { status: 500 });
  }
}

// ─── POST /api/teachers ────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    // Auth check — admin only
    const auth = await verifySettingsAdmin(request);
    if (auth instanceof Response) return auth;

    const body = await request.json();
    const { firstName, lastName, email, phone, contractType, department, position, baseSalary, hireDate } = body;

    // Validation
    if (!firstName?.trim() || !lastName?.trim() || !email?.trim()) {
      return json(
        { success: false, error: 'Le prénom, le nom et l\'email sont obligatoires.' },
        { status: 400 },
      );
    }

    // Check email uniqueness
    const existingUser = await db.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (existingUser) {
      return json(
        { success: false, error: 'Un utilisateur avec cet email existe déjà.' },
        { status: 409 },
      );
    }

    // Find TEACHER role
    const teacherRole = await db.role.findFirst({ where: { name: 'TEACHER' } });
    if (!teacherRole) {
      return json(
        { success: false, error: 'Le rôle ENSEIGNANT n\'existe pas dans le système.' },
        { status: 400 },
      );
    }

    // Hash default password
    const passwordHash = await hash('Enseignant@2025', 12);

    // Create User
    const user = await db.user.create({
      data: {
        email: email.trim().toLowerCase(),
        passwordHash,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone?.trim() || null,
        roleId: teacherRole.id,
        isActive: true,
      },
      include: { role: { select: { name: true } } },
    });

    // Optionally create Employee profile if contract info provided
    let employeeProfile = null;
    if (contractType) {
      // Generate employee number
      const count = await db.employee.count();
      const employeeNumber = `EMP-${String(count + 1).padStart(4, '0')}`;

      employeeProfile = await db.employee.create({
        data: {
          employeeNumber,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          userId: user.id,
          hireDate: hireDate ? new Date(hireDate) : new Date(),
          contractType: contractType as 'CDI' | 'CDD' | 'INTERIM' | 'FREELANCE' | 'STAGE',
          department: (department as 'DIRECTION' | 'ACADEMIQUE' | 'FINANCIER' | 'ADMINISTRATIF' | 'INFORMATIQUE') || 'ACADEMIQUE',
          position: position?.trim() || null,
          baseSalary: baseSalary ? Number(baseSalary) : 0,
          isActive: true,
        },
      });
    }

    return json({
      success: true,
      teacher: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        isActive: user.isActive,
        roleName: user.role.name,
        totalSubjects: 0,
        totalHours: 0,
        subjects: [],
        contract: employeeProfile
          ? {
              type: employeeProfile.contractType,
              department: employeeProfile.department,
              baseSalary: employeeProfile.baseSalary,
              hireDate: employeeProfile.hireDate,
              position: employeeProfile.position,
            }
          : null,
      },
    });
  } catch (error) {
    console.error('Create teacher error:', error);
    return json(
      { success: false, error: 'Erreur lors de la création de l\'enseignant.' },
      { status: 500 },
    );
  }
}
