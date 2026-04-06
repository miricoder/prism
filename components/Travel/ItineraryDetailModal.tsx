'use client';

import React from 'react';
import { Itinerary, formatCurrency, formatDateRange } from '@/lib/travel-utils';

interface ItineraryDetailModalProps {
  itinerary: Itinerary | null;
  isOpen: boolean;
  onClose: () => void;
  onToggleEntry: (itineraryId: string, entryId?: string, entryIndex?: number) => void;
  onArchive?: (itinerary: Itinerary) => void;
  onAddEntry?: (itineraryName: string) => void;
}

export default function ItineraryDetailModal({ itinerary, isOpen, onClose, onToggleEntry, onArchive, onAddEntry }: ItineraryDetailModalProps) {
  if (!isOpen || !itinerary) return null;

  const planned = itinerary.plannedActivities || [];
  const entries = itinerary.entries || [];
  const totalEntries = entries.length;
  const completedEntries = entries.filter((e: any) => e?.isChecked).length;
  const allCompleted = totalEntries > 0 && completedEntries === totalEntries;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-slate-950 border border-slate-800 rounded-xl w-full max-w-3xl mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-start justify-between p-6 border-b border-slate-800">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-slate-500">Itinerary</p>
            <h2 className="text-2xl font-semibold text-white mt-1">{itinerary.name}</h2>
            <p className="text-sm text-slate-400 mt-2">{formatDateRange(itinerary.startDate, itinerary.endDate)}</p>

            <div className="mt-3">
              <div className="flex items-center gap-3">
                <div className="text-xs text-slate-400">Entries</div>
                <div className="text-sm font-semibold text-slate-100">{completedEntries}/{totalEntries} completed</div>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 mt-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${totalEntries === 0 ? 0 : Math.round((completedEntries / totalEntries) * 100)}%` }} />
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-xl"
            aria-label="Close itinerary details"
          >
            ✕
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-400">Cities & Countries</p>
              <p className="text-slate-200 mt-1">
                {itinerary.citiesCountries?.length ? itinerary.citiesCountries.join(', ') : 'Not set'}
              </p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-400">Planned Activities</p>
                <span className="text-xs text-slate-500">{planned.length} items</span>
              </div>
              {planned.length === 0 ? (
                <p className="text-sm text-slate-500">No planned activities yet.</p>
              ) : (
                <div className="space-y-2">
                  {planned.map((activity, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div>
                        <p className="text-slate-200">{activity.title || 'Planned activity'}</p>
                        <p className="text-xs text-slate-500">{activity.type}</p>
                      </div>
                      <p className="text-slate-200">
                        {activity.cost ? formatCurrency(activity.cost, activity.currency || 'USD') : '--'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="text-sm text-slate-400">Entries</p>
                <span className="text-xs text-slate-500">{entries.length} items</span>
              </div>
              {entries.length === 0 ? (
                <p className="text-sm text-slate-500">No entries yet.</p>
              ) : (
                <div className="space-y-3">
                  {entries.map((entry: any, index: number) => (
                    <div key={entry?._id || index} className="flex flex-col gap-2 rounded-lg border border-slate-800 bg-slate-950 p-3">
                      <div className="flex items-start justify-between gap-3">
                        <label className="flex items-start gap-3 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(entry?.isChecked)}
                            onChange={() => onToggleEntry(itinerary._id, entry?._id, index)}
                            className="mt-1 h-4 w-4 rounded border-slate-600 bg-slate-900 text-emerald-400"
                          />
                          <div>
                            <p className="text-slate-200 text-sm">
                              {entry.title || entry.location || 'Entry'}
                            </p>
                            <p className="text-xs text-slate-500">
                              {entry.type || 'other'}
                            </p>
                          </div>
                        </label>
                        <p className="text-sm text-slate-200">
                          {entry.cost ? formatCurrency(entry.cost, entry.currency || 'USD') : '--'}
                        </p>
                      </div>
                      <div className="text-xs text-slate-500 flex flex-wrap gap-3">
                        <span>
                          {entry.startDate || entry.endDate
                            ? formatDateRange(entry.startDate, entry.endDate)
                            : 'Date TBD'}
                        </span>
                        {entry.location ? <span>Location: {entry.location}</span> : null}
                      </div>
                      {entry.description ? (
                        <p className="text-xs text-slate-400">{entry.description}</p>
                      ) : null}
                      {entry.notes ? (
                        <p className="text-xs text-slate-400">Notes: {entry.notes}</p>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            {allCompleted && (
              <div className="bg-emerald-900/20 border border-emerald-700 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-emerald-200">All entries completed</p>
                    <p className="text-xs text-emerald-100">Would you like to archive this itinerary or add more entries?</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => onAddEntry?.(itinerary.name)} className="px-3 py-1 text-sm bg-sky-700 text-white rounded">Add Entry</button>
                    <button onClick={() => onArchive?.(itinerary)} className="px-3 py-1 text-sm bg-rose-600 text-white rounded">Archive</button>
                  </div>
                </div>
              </div>
            )}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-400">Status</p>
              <p className="text-slate-200 mt-1">{itinerary.status}</p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-400">Budget</p>
              <p className="text-slate-200 mt-1">
                {itinerary.budget?.total ? formatCurrency(itinerary.budget.total, itinerary.budget.currency) : 'Not set'}
              </p>
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-400">Lock</p>
              <p className="text-slate-200 mt-1">{itinerary.isLocked ? 'Locked' : 'Unlocked'}</p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onClose}
            className="w-full py-2 bg-slate-800 border border-slate-700 text-slate-200 rounded-lg hover:bg-slate-700"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
