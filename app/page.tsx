'use client';

import { FormEvent, useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import SessionConflictDialog from '@/components/Auth/SessionConflictDialog';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [conflictDialog, setConflictDialog] = useState<{
    isOpen: boolean;
    existingSession?: {
      browser: string;
      os: string;
      createdAt: string;
    };
    newDevice?: {
      browser: string;
      os: string;
    };
  }>({ isOpen: false });
  const [pendingCredentials, setPendingCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const router = useRouter();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // First, check if there's a session conflict
    try {
      // Get user ID by making a dummy request or checking existing session
      // For now, we'll use email as a temporary identifier
      const conflictRes = await fetch('/api/session/check-conflict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: email }),
      });

      if (conflictRes.ok) {
        const conflictData = await conflictRes.json();

        // If there's a conflict, show dialog
        if (conflictData.conflict) {
          setConflictDialog({
            isOpen: true,
            existingSession: conflictData.existingSession,
            newDevice: conflictData.newDevice,
          });
          setPendingCredentials({ email, password });
          setLoading(false);
          return;
        }
      }
    } catch (err) {
      console.error('Failed to check conflict:', err);
      // Continue with login anyway
    }

    // Proceed with sign in
    await proceedWithSignIn(email, password);
  }

  async function proceedWithSignIn(email: string, password: string) {
    setLoading(true);
    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.ok) {
      router.push('/dashboard');
    }
  }

  function handleConflictConfirm() {
    if (pendingCredentials) {
      setConflictDialog({ isOpen: false });
      proceedWithSignIn(pendingCredentials.email, pendingCredentials.password);
    }
  }

  function handleConflictCancel() {
    setConflictDialog({ isOpen: false });
    setPendingCredentials(null);
    setLoading(false);
  }

  return (
    <>
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#0f172a] to-[#1a1f36]">
        <div className="w-full max-w-md p-8 bg-[#1e293b] border border-[#334155] rounded-lg">
          <h1 className="text-3xl font-bold mb-2 text-center">PRISM</h1>
          <p className="text-center text-[#cbd5e1] mb-6">Ultimate Personal Planner</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="your@email.com"
              />
            </div>

            <div>
              <label className="block text-sm mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>

            {error && <p className="text-[#ef4444] text-sm">{error}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#2563eb] hover:bg-[#1d4ed8] text-white py-2 rounded font-semibold disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-[#cbd5e1] text-sm mt-4">
            Demo: Use any email and password (auto-creates account)
          </p>

          {/* Session Info */}
          <div className="mt-6 pt-6 border-t border-[#334155]">
            <p className="text-xs text-[#64748b] text-center">
              <strong>Single Session Per Device:</strong> You can be logged in on desktop and mobile simultaneously, but only one browser per device type.
            </p>
          </div>
        </div>
      </div>

      {/* Session Conflict Dialog */}
      {conflictDialog.existingSession && conflictDialog.newDevice && (
        <SessionConflictDialog
          isOpen={conflictDialog.isOpen}
          existingSession={conflictDialog.existingSession}
          newDevice={conflictDialog.newDevice}
          onConfirm={handleConflictConfirm}
          onCancel={handleConflictCancel}
          isLoading={loading}
        />
      )}
    </>
  );
}
