import { NextResponse } from 'next/server';
import { prospectService } from '@/services/prospect.service';
import { json } from '@/lib/json';

// GET /api/prospects/stats — get conversion stats
export async function GET() {
  try {
    const stats = await prospectService.getConversionStats();
    return json(stats);
  } catch (error) {
    console.error('GET /api/prospects/stats error:', error);
    return NextResponse.json({ error: 'Erreur lors du chargement des statistiques' }, { status: 500 });
  }
}
