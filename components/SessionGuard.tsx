import { useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';

export default function SessionGuard({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.sessionToken) return;
    const interval = setInterval(async () => {
      const res = await fetch('/api/auth/validate-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: session.sessionToken }),
      });
      const data = await res.json();
      if (!data.active) {
        signOut({ callbackUrl: '/login' });
      }
    }, 5000); // Check every 5 seconds
    return () => clearInterval(interval);
  }, [session?.sessionToken]);

  return <>{children}</>;
}
