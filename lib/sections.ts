export interface Section {
  id: string;
  label: string;
  icon: string;
  enabled: boolean;
  route: string;
}

export const SECTIONS: Section[] = [
  { id: 'dashboard', label: 'Dashboard', icon: '📊', enabled: true, route: '/dashboard' },
  { id: 'travel', label: 'Travel Plans', icon: '✈️', enabled: true, route: '/travel-plans' },
  { id: 'expenses', label: 'Expenses', icon: '💳', enabled: false, route: '/expenses' },
  { id: 'skills', label: 'Skills', icon: '🎓', enabled: false, route: '/skills' },
  { id: 'resume', label: 'Resume', icon: '📄', enabled: false, route: '/resume' },
];

export function getEnabledSections(): Section[] {
  return SECTIONS.filter(s => s.enabled);
}
