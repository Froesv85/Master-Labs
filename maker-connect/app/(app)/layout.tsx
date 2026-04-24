'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { href: '/feed', label: 'Feed', icon: '◈' },
  { href: '/profile/1', label: 'Meu Perfil', icon: '◉' },
  { href: '/robots', label: 'Robôs', icon: '◆' },
  { href: '/teams', label: 'Equipes', icon: '◇' },
  { href: '/communities', label: 'Comunidades', icon: '◎' },
  { href: '/admin/metrics', label: 'Métricas', icon: '◈' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-zinc-50">
      {/* Top Navbar — RoboCore black + MakerConnect cyan/yellow */}
      <header className="sticky top-0 z-50 border-b border-amber-500/20 bg-[#080c17]/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-0">
          {/* Logo */}
          <Link href="/feed" className="flex items-center gap-2 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500 shadow-[0_0_12px_rgba(245,158,11,0.5)]">
              <span className="text-lg font-black text-black">M</span>
            </div>
            <div className="hidden sm:block">
              <span className="text-base font-black tracking-tight text-white">
                MAKER<span className="text-amber-400">CONNECT</span>
              </span>
              <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-400">
                BETA
              </span>
            </div>
          </Link>

          {/* Navigation — RoboCore horizontal nav style */}
          <nav className="hidden items-center md:flex">
            {NAV_ITEMS.map((item) => {
              const active =
                pathname === item.href ||
                (item.href !== '/feed' && item.href !== '/admin/metrics' && pathname.startsWith(item.href.split('/')[1] ? `/${item.href.split('/')[1]}` : item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-1.5 border-b-2 px-4 py-4 text-sm font-semibold uppercase tracking-wide transition-all ${
                    active
                      ? 'border-amber-400 text-amber-400'
                      : 'border-transparent text-zinc-400 hover:border-amber-400/50 hover:text-zinc-200'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Right actions */}
          <div className="flex items-center gap-3">
            <Link
              href="/profile/1"
              className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400 transition-all hover:bg-amber-500/20"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-black">
                V
              </span>
              <span className="hidden sm:block">Vinicius</span>
            </Link>
          </div>
        </div>

        {/* Mobile nav */}
        <div className="flex overflow-x-auto border-t border-white/5 md:hidden">
          {NAV_ITEMS.map((item) => {
            const active = pathname === item.href || pathname.startsWith(`/${item.href.split('/')[1]}`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex-shrink-0 border-b-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wide transition-all ${
                  active
                    ? 'border-amber-400 text-amber-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-200'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </div>
      </header>

      {/* Page content */}
      <main className="mx-auto max-w-7xl px-4 py-6">{children}</main>
    </div>
  );
}
