import { redirect } from 'next/navigation';
import type { ReactNode } from 'react';
import { getAdminSession } from '@/lib/admin';

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getAdminSession();
  if (!session) redirect('/feed');

  return <>{children}</>;
}
