'use client';

import React, { useEffect, useState } from 'react';
import { Itinerary, formatCurrency } from '@/lib/travel-utils';

interface BudgetDialogProps {
  isOpen: boolean;
  itinerary: Itinerary | null;
  onClose: () => void;
  onSave: (itineraryId: string, total: number, currency: string) => Promise<void>;
  isLoading?: boolean;
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];

export default function BudgetDialog({ isOpen, itinerary, onClose, onSave, isLoading }: BudgetDialogProps) {
  const [total, setTotal] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [error, setError] = useState('');

  useEffect(() => {
    if (itinerary) {
      setTotal(itinerary.budget?.total ? String(itinerary.budget.total) : '');
      setCurrency(itinerary.budget?.currency || 'USD');
      setError('');
    }
  }, [itinerary]);

  if (!isOpen || !itinerary) return null;

  const handleSave = async () => {
    if (!total || Number(total) <= 0) {
      setError('Budget total must be greater than zero');
      return;
    }

    setError('');
    await onSave(itinerary._id, Number(total), currency);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg w-full max-w-lg mx-4 shadow-xl border border-slate-700">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <div>
            <h2 className="text-xl font-semibold text-white">Set Budget</h2>
            <p className="text-sm text-slate-400 mt-1">{itinerary.name}</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">Budget Total</label>
              <input
                type="number"
                min="0"
                value={total}
                onChange={(e) => setTotal(e.target.value)}
                placeholder="5000"
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

          <div className="bg-slate-800 border border-slate-700 rounded-lg p-4 text-sm text-slate-300">
            <p className="text-slate-400 mb-2">Current total</p>
            <p className="text-lg text-white">
              {itinerary.budget?.total ? formatCurrency(itinerary.budget.total, itinerary.budget.currency) : 'Not set'}
            </p>
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
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-slate-600 disabled:cursor-not-allowed font-medium transition"
          >
            {isLoading ? 'Saving...' : 'Save Budget'}
          </button>
        </div>
      </div>
    </div>
  );
}
