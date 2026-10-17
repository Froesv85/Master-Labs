import { NextRequest, NextResponse } from 'next/server';

import { getSession } from '@/lib/auth';
import { generateProjectDraft } from '@/lib/project-draft';

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado.' }, { status: 401 });
  }

  const body = (await req.json().catch(() => null)) as
    | { title?: string; objective?: string; category?: string }
    | null;

  const title = body?.title?.trim();
  if (!title || title.length < 3) {
    return NextResponse.json(
      { error: 'Informe um título com pelo menos 3 caracteres antes de pedir sugestão.' },
      { status: 400 }
    );
  }

  try {
    const draft = await generateProjectDraft({
      title,
      objective: body?.objective,
      category: body?.category,
    });
    return NextResponse.json({ data: draft });
  } catch (error) {
    console.error('POST /api/projects/draft failed', error);
    return NextResponse.json(
      { error: 'Não foi possível gerar a sugestão agora. Tente novamente ou preencha manualmente.' },
      { status: 502 }
    );
  }
}
