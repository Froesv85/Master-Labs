import Link from 'next/link';
import type { ReactNode } from 'react';
import { Logo } from '@/components/logo';

export const LEGAL_CONTACT_EMAIL = 'privacidade@makerconnect.com.br';
export const LEGAL_UPDATED_AT = '21 de outubro de 2026';

export function LegalPage({ title, intro, children }: { title: string; intro: ReactNode; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#080c17] text-zinc-300">
      <header className="border-b border-amber-500/10 px-4 py-4 sm:px-8">
        <div className="mx-auto flex max-w-3xl items-center justify-between">
          <Link href="/" aria-label="Voltar para a página inicial">
            <Logo size={32} />
          </Link>
          <nav className="flex gap-5 text-sm text-zinc-500">
            <Link href="/termos" className="hover:text-amber-400">Termos de Uso</Link>
            <Link href="/privacidade" className="hover:text-amber-400">Privacidade</Link>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-12 sm:px-8">
        <h1 className="text-3xl font-black text-white sm:text-4xl">{title}</h1>
        <p className="mt-2 text-sm text-zinc-500">Última atualização: {LEGAL_UPDATED_AT}</p>
        <div className="mt-6 text-base leading-relaxed text-zinc-300">{intro}</div>
        <div className="mt-10 space-y-10">{children}</div>
        <p className="mt-12 border-t border-white/5 pt-6 text-sm text-zinc-500">
          Dúvidas? Escreva para{' '}
          <a href={`mailto:${LEGAL_CONTACT_EMAIL}`} className="text-amber-400 hover:text-amber-300">
            {LEGAL_CONTACT_EMAIL}
          </a>
          .
        </p>
      </main>
    </div>
  );
}

export function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="scroll-mt-8">
      <h2 className="text-xl font-bold text-white">{title}</h2>
      <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-zinc-400 [&_strong]:text-zinc-200 [&_a]:text-amber-400 [&_a:hover]:text-amber-300">
        {children}
      </div>
    </section>
  );
}

export function List({ children }: { children: ReactNode }) {
  return <ul className="list-disc space-y-1.5 pl-5 marker:text-amber-500/60">{children}</ul>;
}
