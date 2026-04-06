'use client';

import React, { useEffect, useState } from 'react';

interface ManualTripDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (payload: {
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
  }) => Promise<void>;
  isLoading?: boolean;
}

const CURRENCIES = ['USD', 'EUR', 'GBP', 'CAD', 'AUD'];
const ACTIVITY_TYPES = ['event', 'shopping', 'breakfast', 'lunch', 'dinner', 'tour', 'other'];

export default function ManualTripDialog({ isOpen, onClose, onCreate, isLoading }: ManualTripDialogProps) {
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [citiesCountries, setCitiesCountries] = useState('');
  const [budgetTotal, setBudgetTotal] = useState('');
  const [budgetCurrency, setBudgetCurrency] = useState('USD');
  const [activities, setActivities] = useState<
    Array<{ title: string; type: string; cost: string; currency: string }>
  >([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isOpen) {
      setName('');
      setStartDate('');
      setEndDate('');
      setCitiesCountries('');
      setBudgetTotal('');
      setBudgetCurrency('USD');
      setActivities([]);
      setError('');
    }
  }, [isOpen]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Itinerary name is required');
      return;
    }

    setError('');
    await onCreate({
      name: name.trim(),
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      citiesCountries: citiesCountries
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean),
      plannedActivities: activities
        .map((activity) => {
          const trimmedTitle = activity.title.trim();
          const costValue = activity.cost ? Number.parseFloat(activity.cost) : NaN;
          return {
            title: trimmedTitle || 'Planned activity',
            type: activity.type,
            cost: Number.isFinite(costValue) ? costValue : undefined,
            currency: Number.isFinite(costValue) ? activity.currency : undefined,
          };
        })
        .filter((activity) => activity.title || activity.cost !== undefined),
      budgetTotal: budgetTotal ? Number(budgetTotal) : undefined,
      budgetCurrency: budgetTotal ? budgetCurrency : undefined,
    });
  };

  const handleAddActivity = () => {
    setActivities((prev) => [
      ...prev,
      { title: '', type: 'event', cost: '', currency: 'USD' },
    ]);
  };

  const handleActivityChange = (index: number, field: string, value: string) => {
    setActivities((prev) =>
      prev.map((activity, idx) =>
        idx === index ? { ...activity, [field]: value } : activity
      )
    );
  };

  const handleRemoveActivity = (index: number) => {
    setActivities((prev) => prev.filter((_, idx) => idx !== index));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-slate-900 rounded-lg w-full max-w-xl mx-4 shadow-xl border border-slate-700">
        <div className="flex items-center justify-between p-6 border-b border-slate-700">
          <h2 className="text-xl font-semibold text-white">Create Itinerary</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-white">✕</button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Itinerary Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Summer Europe 2026"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Cities & Countries</label>
            <input
              type="text"
              value={citiesCountries}
              onChange={(e) => setCitiesCountries(e.target.value)}
              placeholder="Bologna, Warsaw, Italy, Poland"
              className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <p className="text-xs text-slate-500 mt-2">Separate with commas</p>
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

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-slate-300">Planned Activities</label>
              <button
                type="button"
                onClick={handleAddActivity}
                className="text-xs text-blue-300 hover:text-blue-200"
              >
                + Add activity
              </button>
            </div>
            {activities.length === 0 ? (
              <div className="text-xs text-slate-500 bg-slate-800 border border-slate-700 rounded-lg p-3">
                Add planned activities to describe this itinerary.
              </div>
            ) : (
              <div className="space-y-3">
                {activities.map((activity, index) => (
                  <div key={index} className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    <div className="md:col-span-4">
                      <input
                        type="text"
                        value={activity.title}
                        onChange={(e) => handleActivityChange(index, 'title', e.target.value)}
                        placeholder="Activity name"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="md:col-span-3">
                      <select
                        value={activity.type}
                        onChange={(e) => handleActivityChange(index, 'type', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      >
                        {ACTIVITY_TYPES.map((type) => (
                          <option key={type} value={type}>
                            {type}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-3">
                      <input
                        type="number"
                        min="0"
                        value={activity.cost}
                        onChange={(e) => handleActivityChange(index, 'cost', e.target.value)}
                        placeholder="Cost"
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="md:col-span-1">
                      <select
                        value={activity.currency}
                        onChange={(e) => handleActivityChange(index, 'currency', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                      >
                        {CURRENCIES.map((currency) => (
                          <option key={currency} value={currency}>
                            {currency}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="md:col-span-1 flex items-center">
                      <button
                        type="button"
                        onClick={() => handleRemoveActivity(index)}
                        className="text-xs text-rose-300 hover:text-rose-200"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">Itinerary Budget (optional)</label>
              <input
                type="number"
                min="0"
                value={budgetTotal}
                onChange={(e) => setBudgetTotal(e.target.value)}
                placeholder="5000"
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Currency</label>
              <select
                value={budgetCurrency}
                onChange={(e) => setBudgetCurrency(e.target.value)}
                className="w-full px-4 py-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                {CURRENCIES.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>
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
            {isLoading ? 'Saving...' : 'Create Itinerary'}
          </button>
        </div>
      </div>
    </div>
  );
}
