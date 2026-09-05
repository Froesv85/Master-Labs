'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { LogoIcon } from '@/components/logo';

const BASE_NAV_ITEMS = [
  { href: '/feed', label: 'Feed' },
  { href: '/robots', label: 'Robôs' },
  { href: '/teams', label: 'Equipes' },
  { href: '/communities', label: 'Comunidades' },
];

const ADMIN_NAV_ITEM = { href: '/admin/metrics', label: 'Métricas' };

type Props = {
  userId: number;
  userName: string | null;
  isAdmin: boolean;
};

export default function AppNav({ userId, userName, isAdmin }: Props) {
  const pathname = usePathname();
  const router = useRouter();
  const NAV_ITEMS = isAdmin ? [...BASE_NAV_ITEMS, ADMIN_NAV_ITEM] : BASE_NAV_ITEMS;

  const initials = userName
    ? userName.split(' ').slice(0, 2).map((n) => n[0]).join('').toUpperCase()
    : '?';

  async function handleLogout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-50 border-b border-amber-500/20 bg-[#080c17]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-0">
        {/* Logo */}
        <Link href="/feed" className="flex items-center gap-2 py-3">
          <LogoIcon size={36} />
          <div className="hidden sm:block">
            <span className="text-base font-black tracking-tight text-white">
              MAKER<span className="text-amber-400">CONNECT</span>
            </span>
            <span className="ml-2 rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-amber-400">
              BETA
            </span>
          </div>
        </Link>

        {/* Navigation */}
        <nav className="hidden items-center md:flex">
          {NAV_ITEMS.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== '/feed' && item.href !== '/admin/metrics' && pathname.startsWith(`/${item.href.split('/')[1]}`));
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

        {/* Right: profile + logout */}
        <div className="flex items-center gap-2">
          <Link
            href={`/profile/${userId}`}
            className="flex items-center gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-1.5 text-xs font-semibold text-amber-400 transition-all hover:bg-amber-500/20"
          >
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-black text-black">
              {initials}
            </span>
            <span className="hidden sm:block">{userName ?? 'Maker'}</span>
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-white/10 px-3 py-1.5 text-xs text-zinc-500 transition hover:border-white/20 hover:text-zinc-300"
            title="Sair"
          >
            Sair
          </button>
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
  );
}
