'use client';

import React, { useMemo, useState } from 'react';
import {
  Itinerary,
  formatCurrency,
  formatDateRange,
  getItineraryCommittedSpend,
  getItineraryRemaining,
} from '@/lib/travel-utils';

interface ItineraryKanbanProps {
  itineraries: Itinerary[];
  onOpen: (itinerary: Itinerary) => void;
  onSetBudget: (itinerary: Itinerary) => void;
  onToggleLock: (itinerary: Itinerary) => void;
  onToggleLive: (itinerary: Itinerary) => void;
  onSetStatus: (itinerary: Itinerary, status: Itinerary['status']) => void;
  onDelete: (id: string) => void;
}

const columns = [
  {
    key: 'in-progress',
    title: 'In Progress',
    description: 'Trip is live and underway',
  },
  {
    key: 'locked-in',
    title: 'Locked In',
    description: 'Planned for sure',
  },
  {
    key: 'planning',
    title: 'Planning',
    description: 'Drafting itinerary details',
  },
] as const;

function resolveColumn(status: Itinerary['status']): (typeof columns)[number]['key'] {
  if (status === 'in-progress') return 'in-progress';
  if (status === 'locked-in') return 'locked-in';
  if (status === 'completed' || status === 'archived') return 'locked-in';
  return 'planning';
}

export default function ItineraryKanban({
  itineraries,
  onOpen,
  onSetBudget,
  onToggleLock,
  onToggleLive,
  onSetStatus,
  onDelete,
}: ItineraryKanbanProps) {
  const [statusFilter, setStatusFilter] = useState<'all' | 'in-progress' | 'locked-in' | 'planning'>('all');

  const filteredItineraries = useMemo(() => {
    if (statusFilter === 'all') return itineraries;
    return itineraries.filter((itinerary) => resolveColumn(itinerary.status) === statusFilter);
  }, [itineraries, statusFilter]);

  const grouped = columns.reduce<Record<string, Itinerary[]>>((acc, column) => {
    acc[column.key] = [];
    return acc;
  }, {});

  filteredItineraries.forEach((itinerary) => {
    const key = resolveColumn(itinerary.status);
    grouped[key].push(itinerary);
  });

  const totalCount = itineraries.length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Map pane (left) */}
      <div className="lg:col-span-8 bg-slate-900/10 rounded-xl p-4">
        <div className="h-[64vh] rounded-lg bg-gradient-to-b from-sky-50 to-white border border-slate-200 flex flex-col">
          <div className="px-4 py-3 flex items-center justify-between">
            <div className="text-sm font-semibold">Map • clusters & routes</div>
            <div className="text-xs text-slate-500">Markers: {filteredItineraries.length}</div>
          </div>
          <div className="flex-1 p-6">
            <div className="h-full rounded-lg border-2 border-dashed border-sky-200 flex items-center justify-center text-slate-500">
              {/* Simple interactive marker list for focus demo */}
              <div className="space-y-2 w-full max-w-xl">
                {filteredItineraries.map((it) => (
                  <button
                    key={it._id}
                    onClick={() => onOpen(it)}
                    className="w-full text-left px-3 py-2 bg-white/80 rounded-md border hover:bg-white flex items-center justify-between"
                  >
                    <div>
                      <div className="text-sm font-medium">{it.name}</div>
                      <div className="text-xs text-slate-500">{it.citiesCountries?.join(', ') || 'No location'}</div>
                    </div>
                    <div className="text-xs text-slate-400">Focus</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Planner panel (right) */}
      <div className="lg:col-span-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1 text-xs rounded-full border transition ${
                statusFilter === 'all'
                  ? 'bg-slate-700 text-white border-slate-600'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              All ({totalCount})
            </button>
            {columns.map((column) => (
              <button
                key={column.key}
                onClick={() => setStatusFilter(column.key)}
                className={`px-3 py-1 text-xs rounded-full border transition ${
                  statusFilter === column.key
                    ? 'bg-slate-700 text-white border-slate-600'
                    : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
                }`}
              >
                {column.title} ({grouped[column.key].length})
              </button>
            ))}
          </div>
        </div>

        <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-4 max-h-[64vh] overflow-y-auto">
          {filteredItineraries.length === 0 ? (
            <div className="text-xs text-slate-600 border border-dashed border-slate-700 rounded-lg p-3">
              No itineraries yet
            </div>
          ) : (
            filteredItineraries.map((itinerary) => {
              const remaining = getItineraryRemaining(itinerary);
              const committed = getItineraryCommittedSpend(itinerary);
              const isLive = itinerary.status === 'in-progress';

              return (
                <div
                  key={itinerary._id}
                  onClick={() => onOpen(itinerary)}
                  className="group cursor-pointer bg-slate-950 border border-slate-800 rounded-xl p-3 shadow-lg hover:border-slate-700 transition mb-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500">{itinerary.status}</p>
                      <h4 className="text-sm font-semibold text-white mt-1 truncate max-w-[220px]">
                        {itinerary.name}
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-2">{formatDateRange(itinerary.startDate, itinerary.endDate)}</p>
                      <p className="text-[11px] text-slate-600 mt-1 truncate max-w-[220px]">{itinerary.citiesCountries?.length ? itinerary.citiesCountries.join(', ') : 'Cities not set'}</p>
                    </div>
                    {itinerary.isLocked ? (
                      <span className="text-[10px] text-amber-300 bg-amber-900/30 border border-amber-700/40 px-2 py-1 rounded-full">🔒 Locked</span>
                    ) : null}
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                      <p className="text-slate-500">Budget</p>
                      <p className="text-slate-200 mt-1">{itinerary.budget?.total ? formatCurrency(itinerary.budget.total, itinerary.budget.currency) : 'Not set'}</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-2">
                      <p className="text-slate-500">Committed</p>
                      <p className="text-slate-200 mt-1">{formatCurrency(committed, itinerary.budget?.currency || 'USD')}</p>
                    </div>
                    <div className="bg-slate-900 border border-slate-800 rounded-lg p-2 col-span-2">
                      <p className="text-slate-500">Remaining</p>
                      <p className={remaining !== null && remaining < 0 ? 'text-rose-300 mt-1' : 'text-emerald-300 mt-1'}>{remaining === null ? 'Not set' : formatCurrency(remaining, itinerary.budget?.currency || 'USD')}</p>
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition" onClick={(event) => event.stopPropagation()}>
                    <button onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(itinerary.name)}`, '_blank', 'noopener,noreferrer')} className="px-2 py-1 text-[11px] bg-slate-800 text-slate-200 rounded-full hover:bg-slate-700">🔎 Research</button>
                    <button onClick={() => onSetBudget(itinerary)} className="px-2 py-1 text-[11px] bg-blue-900/40 text-blue-200 rounded-full hover:bg-blue-900/60">💰 Set Budget</button>
                    <button onClick={() => onToggleLock(itinerary)} className="px-2 py-1 text-[11px] bg-amber-900/40 text-amber-200 rounded-full hover:bg-amber-900/60">{itinerary.isLocked ? '🔓 Unlock' : '🔒 Lock'}</button>
                    <button onClick={() => onToggleLive(itinerary)} className={`px-2 py-1 text-[11px] rounded-full ${isLive ? 'bg-emerald-900/40 text-emerald-200 hover:bg-emerald-900/60' : 'bg-slate-800 text-slate-200 hover:bg-slate-700'}`}>{isLive ? '● Live' : '○ Live'}</button>
                    {itinerary.status !== 'locked-in' ? (<button onClick={() => onSetStatus(itinerary, 'locked-in')} className="px-2 py-1 text-[11px] bg-purple-900/40 text-purple-200 rounded-full hover:bg-purple-900/60">📌 Lock In</button>) : null}
                    {itinerary.status !== 'planning' ? (<button onClick={() => onSetStatus(itinerary, 'planning')} className="px-2 py-1 text-[11px] bg-slate-800 text-slate-200 rounded-full hover:bg-slate-700">🧭 Planning</button>) : null}
                    <button onClick={() => { if (itinerary.isLocked) return; if (confirm(`Delete "${itinerary.name}"?`)) { onDelete(itinerary._id); } }} className={`px-2 py-1 text-[11px] rounded-full ${itinerary.isLocked ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-rose-900/40 text-rose-200 hover:bg-rose-900/60'}`} disabled={itinerary.isLocked}>🗑️ Delete</button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
