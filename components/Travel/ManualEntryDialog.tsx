'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Itinerary } from '@/lib/travel-utils';

interface ManualEntryDialogProps {
  isOpen: boolean;
  itineraries: Itinerary[];
  onClose: () => void;
  onCreate: (payload: {
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
  }) => Promise<void>;
  isLoading?: boolean;
  initialItineraryName?: string;
}

const ENTRY_TYPES = ['flight', 'hotel', 'activity', 'transport', 'meal', 'other'] as const;
const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

export default function ManualEntryDialog({
  isOpen,
  itineraries,
  onClose,
  onCreate,
  isLoading,
  initialItineraryName,
}: ManualEntryDialogProps) {
  const [itineraryName, setItineraryName] = useState('');
  const [type, setType] = useState('flight');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [cost, setCost] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [location, setLocation] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const itineraryOptions = useMemo(() => itineraries.map((item) => item.name), [itineraries]);

  useEffect(() => {
    if (!isOpen) {
      setItineraryName('');
      setType('flight');
      setTitle('');
      setDescription('');
      setStartDate('');
      setEndDate('');
      setCost('');
      setCurrency('USD');
      setLocation('');
      setNotes('');
      setError('');
    }
  }, [isOpen]);

  useEffect(() => {
    // if opened with an initial itinerary name, prefill it
    if (isOpen && initialItineraryName) {
      setItineraryName(initialItineraryName);
    }
  }, [isOpen, initialItineraryName]);

  const handleSubmit = async () => {
    if (!itineraryName.trim()) {
      setError('Itinerary name is required');
      return;
    }
    if (!title.trim()) {
      setError('Entry title is required');
      return;
    }

    setError('');
    await onCreate({
      itineraryName: itineraryName.trim(),
      entry: {
        type,
        title: title.trim(),
        description: description.trim() || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        cost: cost ? Number(cost) : undefined,
        currency: cost ? currency : undefined,
        location: location.trim() || undefined,
        notes: notes.trim() || undefined,
      },
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999]">
      <div className="bg-slate-900 rounded-lg w-full max-w-2xl mx-4 shadow-xl border border-slate-700">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Add Itinerary Entry</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Itinerary Name</label>
            <input
              list="itinerary-list"
              value={itineraryName}
              onChange={(e) => setItineraryName(e.target.value)}
              placeholder="e.g., Summer Europe 2026"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <datalist id="itinerary-list">
              {itineraryOptions.map((name) => (
                <option key={name} value={name} />
              ))}
            </datalist>
            <p className="text-xs text-slate-500 mt-2">
              Choose an existing itinerary or type a new name to create one.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Entry Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                {ENTRY_TYPES.map((entryType) => (
                  <option key={entryType} value={entryType}>
                    {entryType}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Entry Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Flight to BLQ"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description (optional)</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full h-20 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              placeholder="Extra context for this entry"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">Cost (optional)</label>
              <input
                type="number"
                min="0"
                value={cost}
                onChange={(e) => setCost(e.target.value)}
                placeholder="250"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Currency</label>
              <select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                {CURRENCIES.map((code) => (
                  <option key={code} value={code}>
                    {code}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Location (optional)</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Bologna, Italy"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Notes (optional)</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-16 px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              placeholder="Additional notes"
            />
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-700 text-red-300 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}
        </div>

        <div className="flex gap-3 p-6 border-t border-slate-700 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg hover:bg-slate-700 font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed font-medium transition"
          >
            {isLoading ? 'Saving...' : 'Add Entry'}
          </button>
        </div>
      </div>
    </div>
  );
}
