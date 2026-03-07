'use client';

import { useSession, signOut } from 'next-auth/react';

export default function TopBar() {
  const { data: session } = useSession();

  return (
    <div className="bg-[#1e293b] border-b border-[#334155] px-6 py-4 flex items-center justify-between">
      <div>
        <h2 className="text-sm text-[#cbd5e1]">Welcome</h2>
        <p className="font-semibold">{session?.user?.email}</p>
      </div>

      <button
        onClick={() => signOut({ redirect: true, callbackUrl: '/' })}
        className="bg-[#ef4444] hover:bg-[#dc2626] text-white px-4 py-2 rounded font-semibold text-sm"
      >
        Sign Out
      </button>
    </div>
  );
}
