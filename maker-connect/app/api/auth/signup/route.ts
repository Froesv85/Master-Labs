import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { signSession, sessionCookieOptions } from '@/lib/auth';

export async function POST(req: NextRequest) {
  try {
    const { email, password, name } = await req.json() as {
      email?: string;
      password?: string;
      name?: string;
    };

    if (!email?.trim() || !password) {
      return NextResponse.json({ error: 'Email e senha são obrigatórios' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Senha deve ter no mínimo 6 caracteres' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: 'Email já cadastrado' }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email: email.toLowerCase(),
        name: name?.trim() || null,
        password: hashed,
        profile: { create: {} },
      },
    });

    const token = await signSession({ userId: user.id, email: user.email, name: user.name });
    const res = NextResponse.json({ id: user.id, email: user.email, name: user.name }, { status: 201 });
    res.cookies.set(sessionCookieOptions(token));
    return res;
  } catch {
    return NextResponse.json({ error: 'Erro interno' }, { status: 500 });
  }
}
