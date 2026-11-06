import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/admin';
import { getVisitSummary } from '@/lib/visits';

// Visitas autenticadas x convidados, para o painel /admin/metrics.
export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Acesso restrito ao administrador' }, { status: 403 });
  }
  return NextResponse.json(await getVisitSummary());
}
