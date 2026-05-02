import { NextRequest, NextResponse } from 'next/server';
import { json } from '@/lib/json';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { studentService } = await import('@/services/student.service');
  try {
    const student = await studentService.getById(id);
    return json(student);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur';
    if (message === 'Étudiant non trouvé') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { studentService } = await import('@/services/student.service');
  try {
    const body = await request.json();
    const student = await studentService.update(id, body);
    return json(student);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur';
    if (message === 'Étudiant non trouvé') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { studentService } = await import('@/services/student.service');
  try {
    await studentService.remove(id);
    return json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Erreur';
    if (message === 'Étudiant non trouvé') {
      return NextResponse.json({ error: message }, { status: 404 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
