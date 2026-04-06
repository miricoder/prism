'use client';

import React from 'react';
import {
  Itinerary,
  formatCurrency,
  formatDateRange,
  getBudgetStatus,
  getEntryTypeColor,
  getEntryTypeLabel,
  getItineraryCommittedSpend,
  getItineraryPlannedCost,
  getItineraryRemaining,
  getItinerarySpent,
  sortEntriesByDate,
} from '@/lib/travel-utils';

interface TripCardsProps {
  itineraries: Itinerary[];
  onDelete?: (id: string) => void;
  onSetBudget?: (itinerary: Itinerary) => void;
  onToggleLock?: (itinerary: Itinerary) => void;
}

export default function TripCards({ itineraries, onDelete, onSetBudget, onToggleLock }: TripCardsProps) {
  if (itineraries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 bg-slate-800 rounded-lg border border-slate-700">
        <p className="text-slate-400 mb-2">No itineraries yet</p>
        <p className="text-slate-500 text-sm">Import data or create your first itinerary to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {itineraries.map((itinerary) => {
        const spent = getItinerarySpent(itinerary);
        const planned = getItineraryPlannedCost(itinerary);
        const remaining = getItineraryRemaining(itinerary);
        const budgetStatus = getBudgetStatus(itinerary);
        const committed = getItineraryCommittedSpend(itinerary);
        const progress = itinerary.budget?.total ? Math.min((committed / itinerary.budget.total) * 100, 100) : 0;
        const entries = sortEntriesByDate(itinerary.entries || []);
        const previewEntries = entries.slice(0, 3);

        return (
          <div key={itinerary._id} className="bg-slate-900 border border-slate-700 rounded-xl p-6 shadow-lg">
            <div className="flex items-start justify-between gap-4 mb-4">
              <div>
                <p className="text-xs uppercase tracking-widest text-slate-400">{itinerary.status}</p>
                <h3 className="text-2xl font-semibold text-white">{itinerary.name}</h3>
                <p className="text-slate-400 text-sm mt-1">
                  {itinerary.destination || 'Destination TBD'}
                </p>
                {itinerary.isLocked && (
                  <span className="inline-flex items-center gap-2 mt-2 text-xs text-amber-300 bg-amber-900/30 border border-amber-700/40 px-2 py-1 rounded-full">
                    🔒 Locked
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button className="px-3 py-1 text-xs bg-slate-800 text-slate-300 rounded-md hover:bg-slate-700">
                  Research Cost
                </button>
                {onSetBudget && (
                  <button
                    onClick={() => onSetBudget(itinerary)}
                    className="px-3 py-1 text-xs bg-blue-900/40 text-blue-200 rounded-md hover:bg-blue-900/60"
                  >
                    Set Budget
                  </button>
                )}
                {onToggleLock && (
                  <button
                    onClick={() => onToggleLock(itinerary)}
                    className="px-3 py-1 text-xs bg-amber-900/40 text-amber-200 rounded-md hover:bg-amber-900/60"
                  >
                    {itinerary.isLocked ? 'Unlock' : 'Lock'}
                  </button>
                )}
                {onDelete && (
                  <button
                    onClick={() => {
                      if (itinerary.isLocked) {
                        return;
                      }
                      if (confirm(`Delete \"${itinerary.name}\"?`)) {
                        onDelete(itinerary._id);
                      }
                    }}
                    className={`px-3 py-1 text-xs rounded-md ${
                      itinerary.isLocked
                        ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                        : 'bg-rose-900/40 text-rose-300 hover:bg-rose-900/60'
                    }`}
                    disabled={itinerary.isLocked}
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm mb-4">
              <div>
                <p className="text-slate-500">Dates</p>
                <p className="text-slate-200">{formatDateRange(itinerary.startDate, itinerary.endDate)}</p>
              </div>
              <div>
                <p className="text-slate-500">Reason</p>
                <p className="text-slate-200">{itinerary.reason || 'Not set'}</p>
              </div>
            </div>

            <div className="bg-slate-800/60 border border-slate-700 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between text-sm mb-2">
                <p className="text-slate-400">Budget</p>
                <p className="text-slate-200">
                  {itinerary.budget?.total ? formatCurrency(itinerary.budget.total, itinerary.budget.currency) : 'Not set'}
                </p>
              </div>
              <div className="flex items-center justify-between text-sm mb-2">
                <p className="text-slate-400">Spent</p>
                <p className="text-slate-200">{formatCurrency(spent, itinerary.budget?.currency || 'USD')}</p>
              </div>
              {planned > 0 ? (
                <div className="flex items-center justify-between text-sm mb-2">
                  <p className="text-slate-400">Planned</p>
                  <p className="text-slate-200">{formatCurrency(planned, itinerary.budget?.currency || 'USD')}</p>
                </div>
              ) : null}
              <div className="flex items-center justify-between text-sm">
                <p className="text-slate-400">Remaining</p>
                <p className={budgetStatus === 'over' ? 'text-rose-300' : 'text-emerald-300'}>
                  {remaining === null ? 'Not set' : formatCurrency(remaining, itinerary.budget?.currency || 'USD')}
                </p>
              </div>
              {itinerary.budget?.total ? (
                <div className="mt-3">
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-2 ${
                        budgetStatus === 'over'
                          ? 'bg-rose-500'
                          : budgetStatus === 'warn'
                            ? 'bg-amber-400'
                            : 'bg-emerald-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  {budgetStatus !== 'ok' && budgetStatus !== 'none' && (
                    <p className="text-xs mt-2 text-amber-300">
                      {budgetStatus === 'over' ? 'Over budget' : 'Budget running low'}
                    </p>
                  )}
                </div>
              ) : null}
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm text-slate-400">Upcoming / Recent</p>
                <p className="text-xs text-slate-500">{entries.length} total entries</p>
              </div>
              {previewEntries.length === 0 ? (
                <div className="text-sm text-slate-500 bg-slate-800/60 border border-slate-700 rounded-lg p-3">
                  Add flights, hotels, or activities to build a timeline.
                </div>
              ) : (
                <div className="space-y-2">
                  {previewEntries.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between bg-slate-800/60 border border-slate-700 rounded-lg p-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] px-2 py-0.5 border rounded-full ${getEntryTypeColor(entry.type)}`}>
                            {getEntryTypeLabel(entry.type)}
                          </span>
                          <p className="text-sm text-slate-200">{entry.title || entry.location || 'Untitled entry'}</p>
                        </div>
                        <p className="text-xs text-slate-500 mt-1">{entry.startDate ? formatDateRange(entry.startDate, entry.endDate) : 'Date TBD'}</p>
                      </div>
                      <p className="text-sm text-slate-200">
                        {entry.cost ? formatCurrency(entry.cost, entry.currency || 'USD') : '--'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
