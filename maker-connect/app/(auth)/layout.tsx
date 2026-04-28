import type { ReactNode } from 'react';
import { LogoIcon } from '@/components/logo';

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#0a0f1e] flex flex-col items-center justify-center px-4">
      <div className="mb-8 flex flex-col items-center gap-3">
        <LogoIcon size={48} />
        <span className="text-xl font-black uppercase tracking-widest text-white">
          MAKER<span className="text-amber-400">CONNECT</span>
        </span>
      </div>
      <div className="w-full max-w-sm">{children}</div>
    </div>
  );
}
