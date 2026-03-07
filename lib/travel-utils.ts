/**
 * Travel Plans utilities
 */

export type TripStatus = 'planning' | 'in-progress' | 'completed' | 'archived';

export interface Trip {
  _id: string;
  name: string;
  destination?: string;
  startDate?: string;
  endDate?: string;
  reason?: string;
  description?: string;
  budget?: {
    total: number;
    currency: string;
    spent?: number;
  };
  entries?: any[];
  fields?: any[];
  status: TripStatus;
  tags?: string[];
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
  if (!value) return '-';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(value);
}

export function getStatusColor(status: TripStatus): string {
  switch (status) {
    case 'planning':
      return 'bg-blue-100 text-blue-800';
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
