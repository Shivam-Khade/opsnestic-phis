import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Sidebar from '@/components/layout/Sidebar';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  return (
    <div className="app-layout">
      <Sidebar user={session.user as any} />
      <main className="app-main">
        {children}
      </main>
      <style>{`
        .app-main {
          overflow-y: auto;
          min-height: 100vh;
          background: transparent;
        }
      `}</style>
    </div>
  );
}
