"use client";

import React, { useState } from 'react';
import {
  Itinerary,
  formatCurrency,
  formatDateRange,
  getItineraryCommittedSpend,
  getItineraryPlannedCost,
  getItineraryRemaining,
} from '@/lib/travel-utils';

interface Props {
  itineraries: Itinerary[];
  detailItinerary: Itinerary | null;
  onOpen: (itinerary: Itinerary) => void;
  onSetBudget: (itinerary: Itinerary) => void;
  onToggleLock: (itinerary: Itinerary) => void;
  onToggleLive: (itinerary: Itinerary) => void;
  onSetStatus: (itinerary: Itinerary, status: Itinerary['status']) => void;
  onDelete: (id: string) => void;
  onCloseDetail: () => void;
  onAddEntry?: (itineraryName: string) => void;
}

export default function PlannerMapRail({
  itineraries,
  detailItinerary,
  onOpen,
  onSetBudget,
  onToggleLock,
  onToggleLive,
  onSetStatus,
  onDelete,
  onCloseDetail,
  onAddEntry,
}: Props) {
  const [expandedYears, setExpandedYears] = useState<Record<number, boolean>>({});
  const [yearTabState, setYearTabState] = useState<Record<number, 'list' | 'timeline' | 'archive'>>({});
  const [activeTab, setActiveTab] = useState<'list' | 'timeline' | 'archive'>('list');
  const [archived, setArchived] = useState<Itinerary[]>([]);
  const [showArchived, setShowArchived] = useState<boolean>(false);

  const openLocal = (it: Itinerary) => {
    onOpen(it);
  };

  const handleArchive = async (it: Itinerary) => {
    // soft-archive: set status to archived (backend may interpret)
    try {
      await onSetStatus(it, 'archived' as Itinerary['status']);
      setArchived((prev) => [it, ...prev]);
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <div className="lg:col-span-8 bg-slate-800 rounded-xl p-4">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="text-sm font-semibold">Itineraries</div>
          <div className="text-xs text-slate-500">Total: {itineraries.length}</div>
        </div>
        <div className="p-4 overflow-auto max-h-[64vh]">
          {itineraries.length ? (
            itineraries.filter((it) => showArchived ? true : it.status !== 'archived').map((it) => (
              <div key={it._id} className="mb-3 p-3 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-between">
                <div onClick={() => onOpen(it)} className="flex-1 pr-4 cursor-pointer">
                  <div className="font-semibold text-slate-100">{it.name}</div>
                  <div className="text-xs text-slate-300">{(it as any).description || it.citiesCountries?.join(', ') || formatDateRange(it.startDate, it.endDate) || 'No description'}</div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <div className={`px-2 py-1 text-xs text-white rounded-full ${it.status === 'archived' ? 'bg-rose-600' : it.status === 'locked-in' ? 'bg-purple-600' : it.status === 'in-progress' ? 'bg-emerald-600' : 'bg-slate-600'}`}>{it.status}</div>
                  <div className="flex gap-2 items-center">
                    <div className="text-xs text-slate-300 mr-2">${Math.round(getItineraryCommittedSpend(it))}</div>
                    <button onClick={(e) => { e.stopPropagation(); onSetBudget(it); }} className="px-2 py-1 text-xs bg-sky-700 text-sky-100 rounded">Budget</button>
                    <button onClick={(e) => { e.stopPropagation(); onToggleLive(it); }} className="px-2 py-1 text-xs bg-emerald-700 text-emerald-100 rounded">{it.status === 'in-progress' ? 'Live' : 'Mark Live'}</button>
                  </div>

                  <div className="flex gap-2">
                    {it.status !== 'locked-in' ? (
                      <button onClick={(e) => { e.stopPropagation(); if (confirm(`Lock in itinerary "${it.name}"?`)) { onSetStatus(it, 'locked-in'); } }} className="px-2 py-1 text-xs bg-purple-700 text-purple-100 rounded">Lock In</button>
                    ) : (
                      <div className="px-2 py-1 text-xs bg-purple-800 text-purple-100 rounded">Locked</div>
                    )}

                    <button onClick={(e) => { e.stopPropagation(); onToggleLock(it); }} className="px-2 py-1 text-xs bg-amber-700 text-amber-100 rounded">{it.isLocked ? 'Unlock' : 'Lock'}</button>

                    <button onClick={(e) => { e.stopPropagation(); if (confirm(`Archive itinerary "${it.name}"?`)) { onSetStatus(it, 'archived'); } }} className="px-2 py-1 text-xs bg-rose-600 text-rose-100 rounded">Archive</button>

                    <button onClick={(e) => { e.stopPropagation(); if (it.isLocked) { alert('This itinerary is locked and cannot be deleted. Unlock first.'); return; } if (confirm(`Delete itinerary "${it.name}"? This cannot be undone.`)) { onDelete(it._id); } }} className="px-2 py-1 text-xs bg-rose-700 text-rose-100 rounded">Delete</button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-slate-300">No itineraries</div>
          )}
        </div>
      </div>

      <aside className="lg:col-span-4">
        <div className="p-4 bg-slate-800 rounded-xl border border-slate-700">
          <div className="text-sm font-semibold mb-3">Filters</div>
          <input placeholder="Search itineraries" className="w-full mb-3 p-2 rounded bg-slate-900 border border-slate-700 text-sm text-slate-200" />
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-xs text-slate-300">
              <input type="checkbox" checked={showArchived} onChange={(e) => setShowArchived(e.target.checked)} />
              Show archived
            </label>
            <button className="px-2 py-1 bg-sky-600 rounded text-xs">Apply</button>
          </div>
        </div>
      </aside>

      {detailItinerary ? (
        <div className="fixed left-8 right-8 bottom-8">
          <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-4 flex justify-between items-start">
            <div>
              <h4 className="text-lg font-semibold text-slate-100">{detailItinerary.name}</h4>
              <div className="text-xs text-slate-300">{formatDateRange(detailItinerary.startDate, detailItinerary.endDate)} • {detailItinerary.citiesCountries?.join(', ')}</div>
              <div className="mt-2 text-sm text-slate-400">Planned activities</div>
              <ul className="mt-2 text-sm">
                {(detailItinerary.plannedActivities || []).map((p: any, i: number) => (
                  <li key={i} className="flex justify-between"><span>{p.title || 'Untitled'}</span><span className="text-xs text-slate-300">{p.cost ? `$${p.cost}` : '-'}</span></li>
                ))}
              </ul>
            </div>
            <div className="flex flex-col items-end gap-2">
              {detailItinerary.status !== 'locked-in' ? (
                <button onClick={() => onSetStatus(detailItinerary, 'locked-in' as Itinerary['status'])} className="px-3 py-1 rounded bg-purple-700 text-purple-100">📌 Lock In</button>
              ) : (
                <div className="px-3 py-1 rounded bg-purple-800 text-purple-100">📌 Locked</div>
              )}
              <button onClick={() => onToggleLock(detailItinerary)} className="px-3 py-1 rounded bg-amber-600 text-amber-100">{detailItinerary.isLocked ? 'Unlock' : 'Lock'}</button>
              <button onClick={() => onSetStatus(detailItinerary, 'archived' as Itinerary['status'])} className="px-3 py-1 rounded bg-rose-600 text-rose-100">Archive</button>
              <button onClick={() => {
                if (detailItinerary.isLocked) {
                  // eslint-disable-next-line no-alert
                  alert('This itinerary is locked and cannot be deleted. Unlock first.');
                  return;
                }
                // eslint-disable-next-line no-restricted-globals
                if (confirm(`Delete itinerary "${detailItinerary.name}"? This cannot be undone.`)) {
                  onDelete(detailItinerary._id);
                }
              }} className="px-3 py-1 rounded bg-rose-600 text-rose-100">Delete</button>
              <button onClick={() => onCloseDetail()} className="px-3 py-1 rounded bg-slate-700 text-slate-100">Close</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function YearNode({ year, items, archived, onOpen, onSetBudget, onToggleLock, onToggleLive, onSetStatus, onDelete }: any) {
  const [expanded, setExpanded] = useState(true);
  const [tab, setTab] = useState<'list' | 'timeline' | 'archive'>('list');

  const itemsForYear: Itinerary[] = items || [];

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-3">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <button onClick={() => setExpanded((s) => !s)} className="px-2 py-1 bg-slate-700 rounded text-xs">{expanded ? '▾' : '▸'}</button>
          <div className="text-sm font-semibold">{year}</div>
          <div className="text-xs text-slate-400">{itemsForYear.length} itineraries</div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setTab('list')} className={`${tab === 'list' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300'} px-2 py-1 rounded-full text-xs`}>List</button>
          <button onClick={() => setTab('timeline')} className={`${tab === 'timeline' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300'} px-2 py-1 rounded-full text-xs`}>Timeline</button>
          <button onClick={() => setTab('archive')} className={`${tab === 'archive' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-300'} px-2 py-1 rounded-full text-xs`}>Archive</button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-2 max-h-[42vh] overflow-y-auto">
          {tab === 'list' && (
            <div>
              {itemsForYear.map((it: Itinerary) => (
                <div key={it._id} className="mb-2 p-3 bg-slate-800 rounded-lg border border-slate-700 flex items-start justify-between">
                  <div onClick={() => onOpen(it)} className="cursor-pointer">
                    <div className="font-semibold text-slate-100">{it.name}</div>
                    <div className="text-xs text-slate-300">{(it as any).description || it.citiesCountries?.join(', ') || formatDateRange(it.startDate, it.endDate) || 'No description'}</div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <div className="text-xs text-slate-400">{it.status}</div>
                    <div className="flex gap-2">
                      <button onClick={(e) => { e.stopPropagation(); onSetBudget(it); }} className="px-2 py-1 text-xs bg-sky-700 text-sky-100 rounded">Budget</button>
                      <button onClick={(e) => { e.stopPropagation(); onToggleLive(it); }} className="px-2 py-1 text-xs bg-emerald-700 text-emerald-100 rounded">{it.status === 'in-progress' ? 'Live' : 'Mark Live'}</button>
                      {it.status !== 'locked-in' ? (
                        <button onClick={(e) => { e.stopPropagation(); onSetStatus(it, 'locked-in'); }} className="px-2 py-1 text-xs bg-purple-700 text-purple-100 rounded">📌 Lock</button>
                      ) : (
                        <div className="px-2 py-1 text-xs bg-purple-800 text-purple-100 rounded">Locked</div>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); onToggleLock(it); }} className="px-2 py-1 text-xs bg-amber-700 text-amber-100 rounded">{it.isLocked ? 'Unlock' : 'Lock'}</button>
                      <button onClick={(e) => { e.stopPropagation(); if (it.isLocked) { alert('This itinerary is locked and cannot be deleted. Unlock first.'); return; } if (confirm(`Delete itinerary "${it.name}"? This cannot be undone.`)) { onDelete(it._id); } }} className="px-2 py-1 text-xs bg-rose-600 text-rose-100 rounded">Delete</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'timeline' && (
            <div>
              {itemsForYear.map((it: Itinerary) => (
                <div key={it._id} className="mb-2 p-3 bg-slate-800 rounded-lg border border-slate-700">
                  <div className="font-semibold text-slate-100">{it.name}</div>
                  <div className="text-xs text-slate-300">{formatDateRange(it.startDate, it.endDate)}</div>
                </div>
              ))}
            </div>
          )}

          {tab === 'archive' && (
            <div>
              {(itemsForYear.filter((it: Itinerary) => it.status === 'archived').length === 0) ? (
                <div className="text-xs text-slate-300">No archived items for {year}</div>
              ) : (
                itemsForYear.filter((it: Itinerary) => it.status === 'archived').map((it: Itinerary) => (
                  <div key={it._id} className="mb-2 p-3 bg-slate-800 rounded-lg border border-slate-700">
                    <div className="font-semibold text-slate-100">{it.name}</div>
                    <div className="text-xs text-slate-300">archived</div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
