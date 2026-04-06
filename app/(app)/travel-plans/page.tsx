'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import ImportDialog from '@/components/Travel/ImportDialog';
import ManualTripDialog from '@/components/Travel/ManualTripDialog';
import ManualEntryDialog from '@/components/Travel/ManualEntryDialog';
import BudgetDialog from '@/components/Travel/BudgetDialog';
import PlannerMapRail from '@/components/Travel/PlannerMapRail';
import ItineraryDetailModal from '@/components/Travel/ItineraryDetailModal';
import Toast from '@/components/UI/Toast';
import {
  Itinerary,
  formatCurrency,
  getItineraryCommittedSpend,
  getItineraryPlannedCost,
  getItineraryRemaining,
} from '@/lib/travel-utils';

export default function TravelPlansPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [itineraries, setItineraries] = useState<Itinerary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [budgetItinerary, setBudgetItinerary] = useState<Itinerary | null>(null);
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [isEntryOpen, setIsEntryOpen] = useState(false);
  const [isAddingEntry, setIsAddingEntry] = useState(false);
  const [entryTargetItineraryName, setEntryTargetItineraryName] = useState<string | null>(null);
  const [detailItinerary, setDetailItinerary] = useState<Itinerary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/');
    }
  }, [status, router]);

  // Load itineraries
  useEffect(() => {
    if (status === 'authenticated') {
      loadItineraries();
    }
  }, [status]);

  const loadItineraries = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/itineraries');
      if (!response.ok) throw new Error('Failed to load itineraries');
      const data = await response.json();
      setItineraries(data.data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setIsLoading(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImport = async (content: string, format: 'csv' | 'json' | 'text', itineraryName: string) => {
    try {
      setIsImporting(true);
      setError(null);

      const response = await fetch('/api/itineraries/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, format, itineraryName }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Import failed');
      }

      const data = await response.json();
      setSuccess(data.message);

      // Reload itineraries
      await loadItineraries();
      setIsImportOpen(false);

      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsImporting(false);
    }
  };

  const handleDeleteItinerary = async (id: string) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/itineraries/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to delete itinerary');
      }

      setSuccess('Itinerary deleted successfully');
      await loadItineraries();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateItinerary = async (payload: {
    name: string;
    startDate?: string;
    endDate?: string;
    citiesCountries?: string[];
    plannedActivities?: Array<{
      title: string;
      type: string;
      cost?: number;
      currency?: string;
    }>;
    budgetTotal?: number;
    budgetCurrency?: string;
  }) => {
    try {
      setIsCreating(true);
      setError(null);

      const response = await fetch('/api/itineraries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: payload.name,
          citiesCountries: payload.citiesCountries || [],
          startDate: payload.startDate,
          endDate: payload.endDate,
          plannedActivities: payload.plannedActivities || [],
          // Also seed entries from planned activities so they appear in the Entries list
          entries:
            (payload.plannedActivities || []).length > 0
              ? (payload.plannedActivities || []).map((p: any) => {
                  // Map planned activity types to entry types
                  const activityType = ((): string => {
                    if (!p?.type) return 'activity';
                    const t = p.type.toLowerCase();
                    if (t === 'breakfast' || t === 'lunch' || t === 'dinner') return 'meal';
                    if (t === 'event' || t === 'tour' || t === 'shopping') return 'activity';
                    return 'other';
                  })();

                  return {
                    title: p.title || 'Planned activity',
                    type: activityType,
                    cost: p.cost,
                    currency: p.currency || 'USD',
                  };
                })
              : [],
          budget: payload.budgetTotal
            ? { total: payload.budgetTotal, currency: payload.budgetCurrency || 'USD' }
            : undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create itinerary');
      }

      setSuccess('Itinerary created successfully');
      await loadItineraries();
      setIsCreateOpen(false);

      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleSaveBudget = async (itineraryId: string, total: number, currency: string) => {
    try {
      setIsSavingBudget(true);
      setError(null);

      const response = await fetch(`/api/itineraries/${itineraryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          budget: { total, currency },
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update budget');
      }

      setSuccess('Budget updated');
      await loadItineraries();
      setBudgetItinerary(null);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSavingBudget(false);
    }
  };

  const handleToggleLock = async (itinerary: Itinerary) => {
    try {
      setError(null);

      const response = await fetch(`/api/itineraries/${itinerary._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          isLocked: !itinerary.isLocked,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update lock');
      }

      setSuccess(itinerary.isLocked ? 'Itinerary unlocked' : 'Itinerary locked');
      await loadItineraries();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
    }
  };

  const handleCreateEntry = async (payload: {
    itineraryName: string;
    entry: {
      type: string;
      title: string;
      description?: string;
      startDate?: string;
      endDate?: string;
      cost?: number;
      currency?: string;
      location?: string;
      notes?: string;
    };
  }) => {
    try {
      setIsAddingEntry(true);
      setError(null);

      const existing = itineraries.find((item) => item.name === payload.itineraryName);
      let itineraryId = existing?._id;

      if (!itineraryId) {
        const createResponse = await fetch('/api/itineraries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: payload.itineraryName }),
        });

        if (!createResponse.ok) {
          const data = await createResponse.json();
          throw new Error(data.error || 'Failed to create itinerary');
        }

        const created = await createResponse.json();
        itineraryId = created.data?._id;
      }

      if (!itineraryId) {
        throw new Error('Itinerary could not be resolved');
      }

      const response = await fetch(`/api/itineraries/${itineraryId}/entries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entry: payload.entry }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to add entry');
      }

      setSuccess('Entry added successfully');
      await loadItineraries();
      setIsEntryOpen(false);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsAddingEntry(false);
    }
  };

  const handleToggleEntryChecked = async (itineraryId: string, entryId?: string, entryIndex?: number) => {
    try {
      setError(null);

      const itinerary = itineraries.find((item) => item._id === itineraryId);
      if (!itinerary) {
        throw new Error('Itinerary not found');
      }

      const entries = itinerary.entries || [];
      const updatedEntries = entries.map((entry: any, index: number) => {
        const matches = entryId ? entry?._id === entryId : index === entryIndex;
        if (!matches) return entry;
        return { ...entry, isChecked: !entry?.isChecked };
      });

      setItineraries((prev) =>
        prev.map((item) => (item._id === itineraryId ? { ...item, entries: updatedEntries } : item))
      );
      setDetailItinerary((prev) =>
        prev && prev._id === itineraryId ? { ...prev, entries: updatedEntries } : prev
      );

      const response = await fetch(`/api/itineraries/${itineraryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entries: updatedEntries }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update entry');
      }

      await loadItineraries();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSetStatus = async (itinerary: Itinerary, status: Itinerary['status']) => {
    try {
      setError(null);

      const response = await fetch(`/api/itineraries/${itinerary._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to update status');
      }

      const data = await response.json();
      if (data.snapshot) {
        const msg = status === 'locked-in' ? 'Locked in — snapshot saved' : 'Archived — snapshot saved';
        setSuccess(msg);
        setToastMessage(msg);
      } else {
        setSuccess('Status updated');
      }
      await loadItineraries();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggleLive = async (itinerary: Itinerary) => {
    const nextStatus = itinerary.status === 'in-progress' ? 'planning' : 'in-progress';
    await handleSetStatus(itinerary, nextStatus);
  };

  const totalBudget = itineraries.reduce((sum, itinerary) => sum + (itinerary.budget?.total || 0), 0);
  const totalSpent = itineraries.reduce((sum, itinerary) => sum + getItineraryCommittedSpend(itinerary), 0);
  const totalPlanned = itineraries.reduce((sum, itinerary) => sum + getItineraryPlannedCost(itinerary), 0);
  const totalRemaining = itineraries.reduce((sum, itinerary) => {
    const remaining = getItineraryRemaining(itinerary);
    return sum + (remaining === null ? 0 : remaining);
  }, 0);
  const lockedCount = itineraries.filter((itinerary) => itinerary.isLocked).length;
  const overBudgetCount = itineraries.filter((itinerary) => {
    const remaining = getItineraryRemaining(itinerary);
    return remaining !== null && remaining < 0;
  }).length;

  if (status === 'loading') {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="text-slate-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 relative z-40">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">✈️ Itineraries</h1>
            <p className="text-slate-300">
              Manage your itineraries, entries, and budgets
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-6 py-3 bg-slate-700 border border-slate-600 text-white rounded-lg hover:bg-slate-600 font-semibold transition"
            >
              + New Itinerary
            </button>
            <button
              onClick={() => setIsEntryOpen(true)}
              className="px-6 py-3 bg-slate-700 border border-slate-600 text-white rounded-lg hover:bg-slate-600 font-semibold transition"
            >
              + Add Entry
            </button>
            <button
              onClick={() => setIsImportOpen(true)}
              className="px-6 py-3 bg-gradient-to-r from-blue-700 to-blue-800 text-white rounded-lg hover:from-blue-800 hover:to-blue-900 font-semibold transition shadow-lg"
            >
              + Import Entries
            </button>
          </div>
        </div>

        {/* Success Message */}
        {success && (
          <div className="mb-6 p-4 bg-emerald-800/70 border border-emerald-700 text-emerald-100 rounded-lg flex items-center gap-3">
            <span>✓</span>
            <span>{success}</span>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-rose-800/70 border border-rose-700 text-rose-100 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span>✕</span>
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-rose-200 hover:text-rose-100"
            >
              ✕
            </button>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-300 text-sm mb-1">Total Itineraries</p>
            <p className="text-3xl font-bold text-slate-100">{itineraries.length}</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-300 text-sm mb-1">Upcoming</p>
            <p className="text-3xl font-bold text-sky-400">
              {itineraries.filter((t) => {
                const startDate = t.startDate ? new Date(t.startDate) : null;
                return startDate && startDate > new Date();
              }).length}
            </p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-300 text-sm mb-1">Total Entries</p>
            <p className="text-3xl font-bold text-emerald-400">
              {itineraries.reduce((sum, t) => sum + (t.entries?.length || 0), 0)}
            </p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-300 text-sm mb-1">Planned Budget</p>
            <p className="text-3xl font-bold text-amber-400">
              {formatCurrency(totalBudget)}
            </p>
            <p className="text-xs text-slate-400 mt-1">User-set targets</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-300 text-sm mb-1">Committed (planned + actual)</p>
            <p className="text-3xl font-bold text-slate-100">
              {formatCurrency(totalSpent)}
            </p>
            <p className="text-xs text-slate-400 mt-1">
              Planned activities: {formatCurrency(totalPlanned)}
            </p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-300 text-sm mb-1">Remaining</p>
            <p className="text-3xl font-bold text-slate-100">
              {formatCurrency(totalRemaining)}
            </p>
            <p className="text-xs text-slate-400 mt-1">Budget minus planned + actuals</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-300 text-sm mb-1">At Risk</p>
            <p className="text-3xl font-bold text-rose-400">{overBudgetCount}</p>
            <p className="text-xs text-slate-400 mt-1">Actuals over budget</p>
          </div>
          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-300 text-sm mb-1">Locked Itineraries</p>
            <p className="text-3xl font-bold text-slate-100">{lockedCount}</p>
            <p className="text-xs text-slate-400 mt-1">Accidental delete shield</p>
          </div>
        </div>

        {/* Itineraries View */}
        <PlannerMapRail
          itineraries={itineraries}
          detailItinerary={detailItinerary}
          onOpen={(itinerary) => setDetailItinerary(itinerary)}
          onSetBudget={(itinerary) => setBudgetItinerary(itinerary)}
          onToggleLock={handleToggleLock}
          onToggleLive={handleToggleLive}
          onSetStatus={handleSetStatus}
          onDelete={handleDeleteItinerary}
          onAddEntry={(name: string) => { setEntryTargetItineraryName(name); setIsEntryOpen(true); }}
          onCloseDetail={() => setDetailItinerary(null)}
        />

        {/* Import Dialog */}
        <ImportDialog
          isOpen={isImportOpen}
          onClose={() => setIsImportOpen(false)}
          onImport={handleImport}
          isLoading={isImporting}
        />

        <ManualTripDialog
          isOpen={isCreateOpen}
          onClose={() => setIsCreateOpen(false)}
          onCreate={handleCreateItinerary}
          isLoading={isCreating}
        />

        <ManualEntryDialog
          isOpen={isEntryOpen}
          onClose={() => setIsEntryOpen(false)}
          itineraries={itineraries}
          onCreate={handleCreateEntry}
          initialItineraryName={entryTargetItineraryName || undefined}
          isLoading={isAddingEntry}
        />

        <BudgetDialog
          isOpen={Boolean(budgetItinerary)}
          itinerary={budgetItinerary}
          onClose={() => setBudgetItinerary(null)}
          onSave={handleSaveBudget}
          isLoading={isSavingBudget}
        />

        <ItineraryDetailModal
          itinerary={detailItinerary}
          isOpen={Boolean(detailItinerary)}
          onClose={() => setDetailItinerary(null)}
          onToggleEntry={handleToggleEntryChecked}
          onArchive={(itinerary) => handleSetStatus(itinerary, 'archived')}
          onAddEntry={(name) => { setEntryTargetItineraryName(name); setIsEntryOpen(true); }}
        />

        {toastMessage ? (
          <Toast message={toastMessage} onClose={() => setToastMessage(null)} />
        ) : null}

        {/* Features Info */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-blue-900/20 to-slate-900 border border-blue-700/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">📊 Smart Import</h3>
            <p className="text-slate-400 text-sm">
              Upload CSV, JSON, or text data to append entries to an itinerary.
            </p>
          </div>

          <div className="bg-gradient-to-br from-green-900/20 to-slate-900 border border-green-700/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">🎯 Dynamic Schema</h3>
            <p className="text-slate-400 text-sm">
              Add custom fields on-the-fly. Entries store dynamic data safely under each itinerary.
            </p>
          </div>

          <div className="bg-gradient-to-br from-purple-900/20 to-slate-900 border border-purple-700/30 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-2">💼 Full Control</h3>
            <p className="text-slate-400 text-sm">
              Lock itineraries to prevent deletion. Set budgets per itinerary and track spend by entry.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
