/**
 * Travel Plans utilities
 */

export type ItineraryStatus = 'planning' | 'locked-in' | 'in-progress' | 'completed' | 'archived';

export interface Itinerary {
  _id: string;
  correlationId?: string;
  name: string;
  destination?: string;
  citiesCountries?: string[];
  startDate?: string;
  endDate?: string;
  reason?: string;
  description?: string;
  plannedActivities?: Array<{
    title: string;
    type: 'event' | 'shopping' | 'breakfast' | 'lunch' | 'dinner' | 'tour' | 'other';
    cost?: number;
    currency?: string;
  }>;
  budget?: {
    total: number;
    currency: string;
    spent?: number;
  };
  entries?: any[];
  fields?: any[];
  status: ItineraryStatus;
  tags?: string[];
  isLocked?: boolean;
  createdAt: string;
  updatedAt: string;
}

export function formatDate(date?: string | Date): string {
  if (!date) return '-';
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatCurrency(value?: number, currency = 'USD'): string {
  if (value === undefined || value === null) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
}

export function formatDateRange(startDate?: string | Date, endDate?: string | Date): string {
  if (!startDate && !endDate) return '-';
  if (startDate && endDate) {
    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  }
  return startDate ? formatDate(startDate) : formatDate(endDate);
}

export function getEntryDate(entry: any): Date | null {
  if (!entry) return null;
  const value = entry.startDate || entry.date || entry.endDate;
  if (!value) return null;
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function sortEntriesByDate(entries: any[] = []): any[] {
  return [...entries].sort((a, b) => {
    const dateA = getEntryDate(a)?.getTime() ?? 0;
    const dateB = getEntryDate(b)?.getTime() ?? 0;
    return dateA - dateB;
  });
}

export function getItinerarySpent(itinerary: Itinerary): number {
  const entries = itinerary.entries || [];
  return entries.reduce((sum: number, entry: any) => {
    const raw = entry?.cost;
    const cost = typeof raw === 'string' ? Number.parseFloat(raw) : raw;
    return Number.isFinite(cost) ? sum + cost : sum;
  }, 0);
}

export function getItineraryPlannedCost(itinerary: Itinerary): number {
  const planned = itinerary.plannedActivities || [];
  return planned.reduce((sum, activity) => {
    const raw = activity?.cost;
    const cost = typeof raw === 'string' ? Number.parseFloat(raw) : raw;
    const numeric = Number.isFinite(cost) ? Number(cost) : 0;
    return sum + numeric;
  }, 0);
}

export function getItineraryCommittedSpend(itinerary: Itinerary): number {
  return getItinerarySpent(itinerary) + getItineraryPlannedCost(itinerary);
}

export function getItineraryRemaining(itinerary: Itinerary): number | null {
  const total = itinerary.budget?.total;
  if (total === undefined || total === null) return null;
  return total - getItineraryCommittedSpend(itinerary);
}

export function getItineraryForecastTotal(itinerary: Itinerary): number | null {
  const spent = getItinerarySpent(itinerary);
  if (!Number.isFinite(spent) || spent <= 0) return null;

  const entryDates = (itinerary.entries || [])
    .map((entry) => getEntryDate(entry))
    .filter((value): value is Date => Boolean(value));

  const start = itinerary.startDate ? new Date(itinerary.startDate) : entryDates[0];
  const end = itinerary.endDate ? new Date(itinerary.endDate) : entryDates[entryDates.length - 1];

  if (!start || !end || Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);
  const today = new Date();
  const effectiveEnd = today < start ? start : today > end ? end : today;
  const elapsedDays = Math.max(1, Math.ceil((effectiveEnd.getTime() - start.getTime()) / (1000 * 3600 * 24)) + 1);

  return (spent / elapsedDays) * totalDays;
}

export function getBudgetStatus(itinerary: Itinerary): 'ok' | 'warn' | 'over' | 'none' {
  const total = itinerary.budget?.total;
  if (total === undefined || total === null) return 'none';
  const spent = getItinerarySpent(itinerary);
  const committed = getItineraryCommittedSpend(itinerary);

  // If itinerary is explicitly locked-in, treat planned costs as committed
  if (itinerary.status === 'locked-in') {
    if (committed > total) return 'over';
    if (committed >= total * 0.8) return 'warn';
    return 'ok';
  }

  // For non-locked itineraries, 'over' is based on actuals only (At Risk = actual over-budget)
  if (spent > total) return 'over';
  if (spent >= total * 0.8) return 'warn';
  return 'ok';
}

export function getEntryTypeLabel(type?: string): string {
  switch (type) {
    case 'flight':
      return 'Flight';
    case 'hotel':
      return 'Hotel';
    case 'activity':
      return 'Activity';
    case 'transport':
      return 'Transport';
    case 'meal':
      return 'Meal';
    default:
      return 'Other';
  }
}

export function getEntryTypeColor(type?: string): string {
  switch (type) {
    case 'flight':
      return 'bg-sky-900/50 text-sky-200 border-sky-700/50';
    case 'hotel':
      return 'bg-emerald-900/50 text-emerald-200 border-emerald-700/50';
    case 'activity':
      return 'bg-purple-900/50 text-purple-200 border-purple-700/50';
    case 'transport':
      return 'bg-amber-900/50 text-amber-200 border-amber-700/50';
    case 'meal':
      return 'bg-rose-900/50 text-rose-200 border-rose-700/50';
    default:
      return 'bg-slate-800 text-slate-300 border-slate-700';
  }
}

export function getStatusColor(status: ItineraryStatus): string {
  switch (status) {
    case 'planning':
      return 'bg-blue-100 text-blue-800';
    case 'locked-in':
      return 'bg-purple-100 text-purple-800';
    case 'in-progress':
      return 'bg-yellow-100 text-yellow-800';
    case 'completed':
      return 'bg-green-100 text-green-800';
    case 'archived':
      return 'bg-gray-100 text-gray-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
}

export function getDaysUntilTrip(startDate?: string): number | null {
  if (!startDate) return null;
  const today = new Date();
  const trip = new Date(startDate);
  const diff = trip.getTime() - today.getTime();
  return Math.ceil(diff / (1000 * 3600 * 24));
}

export function formatDaysUntil(days: number | null): string {
  if (days === null) return '-';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days > 0) return `In ${days} days`;
  if (days === -1) return 'Yesterday';
  return `${Math.abs(days)} days ago`;
}
