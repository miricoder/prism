'use client';

import React from 'react';
import { Itinerary, formatDate, formatCurrency, getStatusColor, formatDaysUntil, getDaysUntilTrip } from '@/lib/travel-utils';

interface TripsTableProps {
  itineraries: Itinerary[];
  onEdit?: (itinerary: Itinerary) => void;
  onDelete?: (id: string) => void;
  onSetBudget?: (itinerary: Itinerary) => void;
  onToggleLock?: (itinerary: Itinerary) => void;
  isLoading?: boolean;
}

export default function TripsTable({ itineraries, onEdit, onDelete, onSetBudget, onToggleLock, isLoading }: TripsTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="text-slate-400">Loading itineraries...</div>
      </div>
    );
  }

  if (itineraries.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 bg-slate-800 rounded-lg border border-slate-700">
        <p className="text-slate-400 mb-2">No itineraries yet</p>
        <p className="text-slate-500 text-sm">Import data or create your first itinerary to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-slate-900 rounded-lg border border-slate-700">
      <table className="w-full text-sm">
        <thead className="bg-slate-800 border-b border-slate-700">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-slate-200">Itinerary</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-200">Destination</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-200">Dates</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-200">Days Until</th>
            <th className="px-4 py-3 text-right font-semibold text-slate-200">Budget</th>
            <th className="px-4 py-3 text-center font-semibold text-slate-200">Entries</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-200">Status</th>
            <th className="px-4 py-3 text-center font-semibold text-slate-200">Lock</th>
            <th className="px-4 py-3 text-center font-semibold text-slate-200">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {itineraries.map((itinerary) => (
            <tr
              key={itinerary._id}
              className="hover:bg-slate-800 transition"
            >
              {/* Itinerary Name */}
              <td className="px-4 py-3">
                <div>
                  <p className="font-medium text-white">{itinerary.name}</p>
                  {itinerary.reason && (
                    <p className="text-xs text-slate-400">{itinerary.reason}</p>
                  )}
                </div>
              </td>

              {/* Destination */}
              <td className="px-4 py-3 text-slate-300">
                {itinerary.destination || '-'}
              </td>

              {/* Dates */}
              <td className="px-4 py-3 text-slate-400 text-xs">
                <div>
                  <p>{formatDate(itinerary.startDate)}</p>
                  {itinerary.endDate && (
                    <p className="text-slate-500">{formatDate(itinerary.endDate)}</p>
                  )}
                </div>
              </td>

              {/* Days Until */}
              <td className="px-4 py-3">
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    getDaysUntilTrip(itinerary.startDate) && getDaysUntilTrip(itinerary.startDate)! > 0
                      ? 'bg-blue-900 text-blue-300'
                      : getDaysUntilTrip(itinerary.startDate) === 0
                        ? 'bg-yellow-900 text-yellow-300'
                        : 'bg-gray-900 text-gray-300'
                  }`}
                >
                  {formatDaysUntil(getDaysUntilTrip(itinerary.startDate))}
                </span>
              </td>

              {/* Budget */}
              <td className="px-4 py-3 text-right text-slate-300">
                {itinerary.budget
                  ? formatCurrency(itinerary.budget.total, itinerary.budget.currency)
                  : '-'}
              </td>

              {/* Entries Count */}
              <td className="px-4 py-3 text-center">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-slate-700 rounded-full text-xs text-slate-200">
                  {itinerary.entries?.length || 0}
                </span>
              </td>

              {/* Status */}
              <td className="px-4 py-3">
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(
                    itinerary.status
                  )}`}
                >
                  {itinerary.status}
                </span>
              </td>

              {/* Lock */}
              <td className="px-4 py-3 text-center">
                {itinerary.isLocked ? (
                  <span className="text-xs px-2 py-1 rounded-full bg-amber-900/40 text-amber-300">🔒 Locked</span>
                ) : (
                  <span className="text-xs px-2 py-1 rounded-full bg-slate-800 text-slate-400">Unlocked</span>
                )}
              </td>

              {/* Actions */}
              <td className="px-4 py-3 text-center">
                <div className="flex justify-center gap-2">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(itinerary)}
                      className="text-blue-400 hover:text-blue-300 transition text-xs font-medium"
                      title="Edit itinerary"
                    >
                      ✏️ Edit
                    </button>
                  )}
                  {onSetBudget && (
                    <button
                      onClick={() => onSetBudget(itinerary)}
                      className="text-emerald-300 hover:text-emerald-200 transition text-xs font-medium"
                      title="Set itinerary budget"
                    >
                      💰 Budget
                    </button>
                  )}
                  {onToggleLock && (
                    <button
                      onClick={() => onToggleLock(itinerary)}
                      className="text-amber-300 hover:text-amber-200 transition text-xs font-medium"
                      title={itinerary.isLocked ? 'Unlock itinerary' : 'Lock itinerary'}
                    >
                      {itinerary.isLocked ? '🔓 Unlock' : '🔒 Lock'}
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        if (itinerary.isLocked) {
                          return;
                        }
                        if (confirm(`Delete "${itinerary.name}"?`)) {
                          onDelete(itinerary._id);
                        }
                      }}
                      className={`transition text-xs font-medium ${
                        itinerary.isLocked ? 'text-slate-500 cursor-not-allowed' : 'text-red-400 hover:text-red-300'
                      }`}
                      title="Delete itinerary"
                    >
                      🗑️ Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
