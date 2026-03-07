'use client';

import React from 'react';
import { Trip, formatDate, formatCurrency, getStatusColor, formatDaysUntil, getDaysUntilTrip } from '@/lib/travel-utils';

interface TripsTableProps {
  trips: Trip[];
  onEdit?: (trip: Trip) => void;
  onDelete?: (id: string) => void;
  isLoading?: boolean;
}

export default function TripsTable({ trips, onEdit, onDelete, isLoading }: TripsTableProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-48">
        <div className="text-slate-400">Loading trips...</div>
      </div>
    );
  }

  if (trips.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 bg-slate-800 rounded-lg border border-slate-700">
        <p className="text-slate-400 mb-2">No trips yet</p>
        <p className="text-slate-500 text-sm">Import data or create your first trip to get started</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-slate-900 rounded-lg border border-slate-700">
      <table className="w-full text-sm">
        <thead className="bg-slate-800 border-b border-slate-700">
          <tr>
            <th className="px-4 py-3 text-left font-semibold text-slate-200">Trip</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-200">Destination</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-200">Dates</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-200">Days Until</th>
            <th className="px-4 py-3 text-right font-semibold text-slate-200">Budget</th>
            <th className="px-4 py-3 text-center font-semibold text-slate-200">Entries</th>
            <th className="px-4 py-3 text-left font-semibold text-slate-200">Status</th>
            <th className="px-4 py-3 text-center font-semibold text-slate-200">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-700">
          {trips.map((trip) => (
            <tr
              key={trip._id}
              className="hover:bg-slate-800 transition"
            >
              {/* Trip Name */}
              <td className="px-4 py-3">
                <div>
                  <p className="font-medium text-white">{trip.name}</p>
                  {trip.reason && (
                    <p className="text-xs text-slate-400">{trip.reason}</p>
                  )}
                </div>
              </td>

              {/* Destination */}
              <td className="px-4 py-3 text-slate-300">
                {trip.destination || '-'}
              </td>

              {/* Dates */}
              <td className="px-4 py-3 text-slate-400 text-xs">
                <div>
                  <p>{formatDate(trip.startDate)}</p>
                  {trip.endDate && (
                    <p className="text-slate-500">{formatDate(trip.endDate)}</p>
                  )}
                </div>
              </td>

              {/* Days Until */}
              <td className="px-4 py-3">
                <span
                  className={`text-xs px-2 py-1 rounded ${
                    getDaysUntilTrip(trip.startDate) && getDaysUntilTrip(trip.startDate)! > 0
                      ? 'bg-blue-900 text-blue-300'
                      : getDaysUntilTrip(trip.startDate) === 0
                        ? 'bg-yellow-900 text-yellow-300'
                        : 'bg-gray-900 text-gray-300'
                  }`}
                >
                  {formatDaysUntil(getDaysUntilTrip(trip.startDate))}
                </span>
              </td>

              {/* Budget */}
              <td className="px-4 py-3 text-right text-slate-300">
                {trip.budget
                  ? formatCurrency(trip.budget.total, trip.budget.currency)
                  : '-'}
              </td>

              {/* Entries Count */}
              <td className="px-4 py-3 text-center">
                <span className="inline-flex items-center justify-center w-6 h-6 bg-slate-700 rounded-full text-xs text-slate-200">
                  {trip.entries?.length || 0}
                </span>
              </td>

              {/* Status */}
              <td className="px-4 py-3">
                <span
                  className={`text-xs px-3 py-1 rounded-full font-medium ${getStatusColor(
                    trip.status
                  )}`}
                >
                  {trip.status}
                </span>
              </td>

              {/* Actions */}
              <td className="px-4 py-3 text-center">
                <div className="flex justify-center gap-2">
                  {onEdit && (
                    <button
                      onClick={() => onEdit(trip)}
                      className="text-blue-400 hover:text-blue-300 transition text-xs font-medium"
                      title="Edit trip"
                    >
                      ✏️ Edit
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${trip.name}"?`)) {
                          onDelete(trip._id);
                        }
                      }}
                      className="text-red-400 hover:text-red-300 transition text-xs font-medium"
                      title="Delete trip"
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
