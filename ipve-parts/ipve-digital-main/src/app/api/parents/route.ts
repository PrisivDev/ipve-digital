import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { json } from '@/lib/json';

// GET /api/parents — list unique parents grouped by phone with search + pagination
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search') || undefined;
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '25');

  try {
    // 1. Query all students with a parent phone
    const students = await db.student.findMany({
      where: {
        parentPhone: { not: null },
      },
      select: {
        id: true,
        parentName: true,
        parentPhone: true,
        parentEmail: true,
        emergencyContact: true,
        firstName: true,
        lastName: true,
        filiere: { select: { name: true } },
        level: { select: { name: true } },
        status: true,
      },
    });

    // 2. Group by parentPhone to deduplicate
    const parentMap = new Map<
      string,
      {
        students: (typeof students)[number][];
      }
    >();

    for (const s of students) {
      const key = s.parentPhone!;
      if (!parentMap.has(key)) {
        parentMap.set(key, { students: [] });
      }
      parentMap.get(key)!.students.push(s);
    }

    // 3. Map to parent objects
    let allParents = Array.from(parentMap.entries()).map(([phone, group]) => ({
      id: group.students[0].id,
      parentPhone: phone,
      parentName: group.students[0].parentName,
      parentEmail: group.students[0].parentEmail,
      emergencyContact: group.students[0].emergencyContact,
      childrenCount: group.students.length,
      children: group.students.map((s) => ({
        studentId: s.id,
        studentName: `${s.lastName} ${s.firstName}`,
        filiere: s.filiere?.name ?? null,
        level: s.level?.name ?? null,
        status: s.status,
      })),
    }));

    // 4. Search filter (in-memory)
    if (search) {
      const term = search.toLowerCase();
      allParents = allParents.filter(
        (p) =>
          (p.parentName ?? '').toLowerCase().includes(term) ||
          p.parentPhone.toLowerCase().includes(term) ||
          (p.parentEmail ?? '').toLowerCase().includes(term)
      );
    }

    // 5. Pagination
    const total = allParents.length;
    const totalPages = Math.max(1, Math.ceil(total / limit));
    const offset = (page - 1) * limit;
    const parents = allParents.slice(offset, offset + limit);

    return json({
      parents,
      pagination: {
        page,
        limit,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('GET /api/parents error:', error);
    return json({ error: 'Erreur lors du chargement des parents' }, { status: 500 });
  }
}

// PUT /api/parents — update parent info across ALL students sharing the same parentPhone
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { parentPhone, parentName, parentEmail, emergencyContact } = body;

    if (!parentPhone) {
      return json({ error: 'Le numero de telephone du parent est requis' }, { status: 400 });
    }

    const result = await db.student.updateMany({
      where: { parentPhone },
      data: {
        parentName: parentName ?? undefined,
        parentEmail: parentEmail ?? undefined,
        emergencyContact: emergencyContact ?? undefined,
      },
    });

    return json({
      success: true,
      updatedCount: result.count,
    });
  } catch (error) {
    console.error('PUT /api/parents error:', error);
    return json({ error: 'Erreur lors de la mise a jour du parent' }, { status: 500 });
  }
}
