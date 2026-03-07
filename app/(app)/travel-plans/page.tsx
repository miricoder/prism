'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ImportDialog from '@/components/Travel/ImportDialog';
import TripsTable from '@/components/Travel/TripsTable';
import { Trip } from '@/lib/travel-utils';

export default function TravelPlansPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Load trips
  useEffect(() => {
    if (status === 'authenticated') {
      loadTrips();
    }
  }, [status]);

  const loadTrips = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/trips');
      if (!response.ok) throw new Error('Failed to load trips');
      const data = await response.json();
      setTrips(data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (content: string, format: 'csv' | 'json' | 'text', tripName: string) => {
    try {
      setIsImporting(true);
      setError(null);

      const response = await fetch('/api/trips/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, format, tripName }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Import failed');
      }

      const data = await response.json();
      setSuccess(data.message);

      // Reload trips
      await loadTrips();
      setIsImportOpen(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteTrip = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/trips/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete trip');

      setSuccess('Trip deleted successfully');
      await loadTrips();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">✈️ Travel Plans</h1>
            <p className="text-slate-400">
              Manage your trips, flights, hotels, and activities
            </p>
          </div>
          <button
            onClick={() => setIsImportOpen(true)}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-semibold transition shadow-lg"
          >
            + Import Data
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-green-900/30 border border-green-700 text-green-300 rounded-lg flex items-center gap-3">
            <span>✓</span>
            <span>{success}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-700 text-red-300 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>✕</span>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300"
            >
              ✕
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Total Trips</p>
            <p className="text-3xl font-bold text-white">{trips.length}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Upcoming</p>
            <p className="text-3xl font-bold text-blue-400">
              {trips.filter((t) => {
                const startDate = t.startDate ? new Date(t.startDate) : null;
                return startDate && startDate > new Date();
              }).length}
            </p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Total Entries</p>
            <p className="text-3xl font-bold text-green-400">
              {trips.reduce((sum, t) => sum + (t.entries?.length || 0), 0)}
            </p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Total Budget</p>
            <p className="text-3xl font-bold text-yellow-400">
              ${trips.reduce((sum, t) => sum + (t.budget?.total || 0), 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Trips Table */}
        <TripsTable
          trips={trips}
          onDelete={handleDeleteTrip}
          isLoading={isLoading}
        />

        {/* Import Dialog */}
        <ImportDialog
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onImport={handleImport}
          isLoading={isImporting}
        />

        {/* Features Info */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-900/20 to-slate-900 border border-blue-700/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">📊 Smart Import</h3>
            <p className="text-slate-400 text-sm">
              Upload CSV, JSON, or text data. Our parser intelligently detects fields and creates
              dynamic columns based on your data.
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-900/20 to-slate-900 border border-green-700/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">🎯 Dynamic Schema</h3>
            <p className="text-slate-400 text-sm">
              Add custom fields on-the-fly. System auto-detects data types and stores everything
              flexibly for future scalability.
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-900/20 to-slate-900 border border-purple-700/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">💼 Full Control</h3>
            <p className="text-slate-400 text-sm">
              Edit, delete, or duplicate trips. Manage budgets, track entries, and organize by status or tags.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
