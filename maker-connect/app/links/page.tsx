import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '@/components/logo';
import { Nodo } from '@/components/nodo/nodo';

// Página de links (estilo "linktree") apontada pelo QR code do banner/poster do
// projeto. Precisa ser pública: está em PUBLIC_EXACT_PATHS no proxy.ts.

export const metadata: Metadata = {
  title: 'Links | MakerConnect',
  description: 'Acesse a MakerConnect ou o código-fonte do projeto no GitHub.',
};

const GITHUB_URL = 'https://github.com/Froesv85/Master-Labs';

function ArrowIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M5 12h14M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function GithubIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 .5a11.5 11.5 0 0 0-3.64 22.41c.58.1.79-.25.79-.56v-2c-3.2.7-3.88-1.37-3.88-1.37-.52-1.33-1.28-1.69-1.28-1.69-1.05-.72.08-.7.08-.7 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.71 1.26 3.37.96.1-.75.4-1.26.73-1.55-2.55-.29-5.24-1.28-5.24-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.46.11-3.05 0 0 .97-.31 3.17 1.18a11 11 0 0 1 5.77 0c2.2-1.49 3.17-1.18 3.17-1.18.63 1.59.23 2.76.11 3.05.74.81 1.19 1.84 1.19 3.1 0 4.42-2.7 5.39-5.26 5.68.41.36.78 1.06.78 2.14v3.17c0 .31.21.67.8.56A11.5 11.5 0 0 0 12 .5Z" />
    </svg>
  );
}

export default function LinksPage() {
  return (
    <div className="relative min-h-screen overflow-hidden bg-[#080c17] font-sans text-zinc-50">
      <div className="pointer-events-none absolute inset-0 z-0">
        <div className="absolute -top-24 left-1/2 h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-amber-500/10 blur-[120px]" />
        <div className="absolute bottom-0 right-0 h-[320px] w-[320px] rounded-full bg-orange-600/8 blur-[110px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(245,158,11,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(245,158,11,0.8) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />
      </div>

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-md flex-col items-center px-4 py-12">
        <Nodo size={120} mood="happy" pose="wave" title="Nodo, o mascote da MakerConnect" />

        <div className="mt-4 flex justify-center">
          <Logo size={40} />
        </div>
        <p className="mt-3 text-center text-sm text-zinc-400">
          A rede social dos makers, com documentação técnica gerada por IA.
        </p>

        <nav className="mt-10 flex w-full flex-col gap-4" aria-label="Links da MakerConnect">
          <Link
            href="/"
            className="group flex items-center gap-4 rounded-2xl bg-amber-500 px-5 py-4 text-[#080c17] shadow-lg shadow-amber-500/20 transition hover:bg-amber-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#080c17]">
              <Logo size={30} showText={false} />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-base font-semibold">Acessar a MakerConnect</span>
              <span className="text-xs text-[#080c17]/70">makerconnect.com.br</span>
            </span>
            <span className="transition group-hover:translate-x-1">
              <ArrowIcon />
            </span>
          </Link>

          <a
            href={GITHUB_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-4 rounded-2xl border border-amber-500/30 bg-white/[0.03] px-5 py-4 text-zinc-50 transition hover:border-amber-400/60 hover:bg-white/[0.06] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amber-300"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white/10">
              <GithubIcon />
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="text-base font-semibold">Código no GitHub</span>
              <span className="truncate text-xs text-zinc-400">github.com/Froesv85/Master-Labs</span>
            </span>
            <span className="text-amber-400 transition group-hover:translate-x-1">
              <ArrowIcon />
            </span>
          </a>
        </nav>

        <footer className="mt-auto pt-12 text-center text-xs text-zinc-500">
          TCC · Engenharia de Software · Católica SC
          <br />
          Master Labs · Master by Tech
        </footer>
      </main>
    </div>
  );
}
