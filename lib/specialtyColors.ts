export interface SpecialtyColorScheme {
  badge: string;
  borderLeft: string;
  cardGlow: string;
  tabUnselected: string;
  tabSelected: string;
  pillActive?: string;
  headerAccent: string;
  countBadge: string;
  label: string;
  colorName?: string;
}

export interface CustomSpecialtyConfig {
  id: string;
  name: string;
  color: string; // e.g. 'sky', 'teal', 'rose', 'purple', 'emerald', 'amber', 'indigo', 'cyan', 'pink', 'blue'
  icon?: string;
}

export const DEFAULT_SPECIALTIES: CustomSpecialtyConfig[] = [
  { id: 'general medical', name: 'General Medical', color: 'sky' },
  { id: 'allergy & asthma', name: 'Allergy & Asthma', color: 'teal' },
  { id: 'cardiology', name: 'Cardiology', color: 'rose' },
  { id: 'dental', name: 'Dental', color: 'cyan' },
  { id: 'dermatology', name: 'Dermatology', color: 'pink' },
  { id: 'orthopedics', name: 'Orthopedics', color: 'indigo' },
  { id: 'psychiatry', name: 'Psychiatry', color: 'purple' },
  { id: 'pulmonology', name: 'Pulmonology', color: 'blue' },
  { id: 'over-the-counter (otc)', name: 'Over-The-Counter (OTC)', color: 'emerald' },
  { id: 'supplies', name: 'Supplies', color: 'amber' },
];

export function getCustomSpecialties(): CustomSpecialtyConfig[] {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('mission_rx_custom_specialties');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback to default
      }
    }
  }
  return DEFAULT_SPECIALTIES;
}

export function saveCustomSpecialties(specialties: CustomSpecialtyConfig[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('mission_rx_custom_specialties', JSON.stringify(specialties));
  }
}

export function buildSchemeForColor(color: string, label: string): SpecialtyColorScheme {
  const norm = (color || 'slate').toLowerCase();

  const colorMap: Record<string, SpecialtyColorScheme> = {
    sky: {
      badge: 'bg-sky-100 text-sky-800 border-sky-300 font-extrabold',
      borderLeft: 'border-l-[6px] border-l-sky-500',
      cardGlow: 'hover:border-sky-300 hover:shadow-lg hover:shadow-sky-500/5',
      tabUnselected: 'bg-sky-100 text-sky-800 border-sky-300 font-bold shadow-2xs hover:bg-sky-200/70',
      tabSelected: 'bg-sky-600 text-white font-black shadow-md shadow-sky-600/25 border-sky-700 scale-[1.03]',
      pillActive: 'bg-sky-600 text-white font-black shadow-md shadow-sky-600/25 border-sky-700 scale-[1.03]',
      headerAccent: 'text-sky-800 bg-sky-100 border-sky-300',
      countBadge: 'bg-sky-100 text-sky-800 border-sky-300 font-bold',
      label,
      colorName: 'sky',
    },
    teal: {
      badge: 'bg-teal-100 text-teal-800 border-teal-300 font-extrabold',
      borderLeft: 'border-l-[6px] border-l-teal-500',
      cardGlow: 'hover:border-teal-300 hover:shadow-lg hover:shadow-teal-500/5',
      tabUnselected: 'bg-teal-100 text-teal-800 border-teal-300 font-bold shadow-2xs hover:bg-teal-200/70',
      tabSelected: 'bg-teal-600 text-white font-black shadow-md shadow-teal-600/25 border-teal-700 scale-[1.03]',
      pillActive: 'bg-teal-600 text-white font-black shadow-md shadow-teal-600/25 border-teal-700 scale-[1.03]',
      headerAccent: 'text-teal-800 bg-teal-100 border-teal-300',
      countBadge: 'bg-teal-100 text-teal-800 border-teal-300 font-bold',
      label,
      colorName: 'teal',
    },
    rose: {
      badge: 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold',
      borderLeft: 'border-l-[6px] border-l-rose-500',
      cardGlow: 'hover:border-rose-300 hover:shadow-lg hover:shadow-rose-500/5',
      tabUnselected: 'bg-rose-100 text-rose-800 border-rose-300 font-bold shadow-2xs hover:bg-rose-200/70',
      tabSelected: 'bg-rose-600 text-white font-black shadow-md shadow-rose-600/25 border-rose-700 scale-[1.03]',
      pillActive: 'bg-rose-600 text-white font-black shadow-md shadow-rose-600/25 border-rose-700 scale-[1.03]',
      headerAccent: 'text-rose-800 bg-rose-100 border-rose-300',
      countBadge: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
      label,
      colorName: 'rose',
    },
    cyan: {
      badge: 'bg-cyan-100 text-cyan-800 border-cyan-300 font-extrabold',
      borderLeft: 'border-l-[6px] border-l-cyan-500',
      cardGlow: 'hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-500/5',
      tabUnselected: 'bg-cyan-100 text-cyan-800 border-cyan-300 font-bold shadow-2xs hover:bg-cyan-200/70',
      tabSelected: 'bg-cyan-600 text-white font-black shadow-md shadow-cyan-600/25 border-cyan-700 scale-[1.03]',
      pillActive: 'bg-cyan-600 text-white font-black shadow-md shadow-cyan-600/25 border-cyan-700 scale-[1.03]',
      headerAccent: 'text-cyan-800 bg-cyan-100 border-cyan-300',
      countBadge: 'bg-cyan-100 text-cyan-800 border-cyan-300 font-bold',
      label,
      colorName: 'cyan',
    },
    pink: {
      badge: 'bg-pink-100 text-pink-800 border-pink-300 font-extrabold',
      borderLeft: 'border-l-[6px] border-l-pink-500',
      cardGlow: 'hover:border-pink-300 hover:shadow-lg hover:shadow-pink-500/5',
      tabUnselected: 'bg-pink-100 text-pink-800 border-pink-300 font-bold shadow-2xs hover:bg-pink-200/70',
      tabSelected: 'bg-pink-600 text-white font-black shadow-md shadow-pink-600/25 border-pink-700 scale-[1.03]',
      pillActive: 'bg-pink-600 text-white font-black shadow-md shadow-pink-600/25 border-pink-700 scale-[1.03]',
      headerAccent: 'text-pink-800 bg-pink-100 border-pink-300',
      countBadge: 'bg-pink-100 text-pink-800 border-pink-300 font-bold',
      label,
      colorName: 'pink',
    },
    indigo: {
      badge: 'bg-indigo-100 text-indigo-800 border-indigo-300 font-extrabold',
      borderLeft: 'border-l-[6px] border-l-indigo-500',
      cardGlow: 'hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5',
      tabUnselected: 'bg-indigo-100 text-indigo-800 border-indigo-300 font-bold shadow-2xs hover:bg-indigo-200/70',
      tabSelected: 'bg-indigo-600 text-white font-black shadow-md shadow-indigo-600/25 border-indigo-700 scale-[1.03]',
      pillActive: 'bg-indigo-600 text-white font-black shadow-md shadow-indigo-600/25 border-indigo-700 scale-[1.03]',
      headerAccent: 'text-indigo-800 bg-indigo-100 border-indigo-300',
      countBadge: 'bg-indigo-100 text-indigo-800 border-indigo-300 font-bold',
      label,
      colorName: 'indigo',
    },
    purple: {
      badge: 'bg-purple-100 text-purple-800 border-purple-300 font-extrabold',
      borderLeft: 'border-l-[6px] border-l-purple-500',
      cardGlow: 'hover:border-purple-300 hover:shadow-lg hover:shadow-purple-500/5',
      tabUnselected: 'bg-purple-100 text-purple-800 border-purple-300 font-bold shadow-2xs hover:bg-purple-200/70',
      tabSelected: 'bg-purple-600 text-white font-black shadow-md shadow-purple-600/25 border-purple-700 scale-[1.03]',
      pillActive: 'bg-purple-600 text-white font-black shadow-md shadow-purple-600/25 border-purple-700 scale-[1.03]',
      headerAccent: 'text-purple-800 bg-purple-100 border-purple-300',
      countBadge: 'bg-purple-100 text-purple-800 border-purple-300 font-bold',
      label,
      colorName: 'purple',
    },
    blue: {
      badge: 'bg-blue-100 text-blue-800 border-blue-300 font-extrabold',
      borderLeft: 'border-l-[6px] border-l-blue-500',
      cardGlow: 'hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5',
      tabUnselected: 'bg-blue-100 text-blue-800 border-blue-300 font-bold shadow-2xs hover:bg-blue-200/70',
      tabSelected: 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/25 border-blue-700 scale-[1.03]',
      pillActive: 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/25 border-blue-700 scale-[1.03]',
      headerAccent: 'text-blue-800 bg-blue-100 border-blue-300',
      countBadge: 'bg-blue-100 text-blue-800 border-blue-300 font-bold',
      label,
      colorName: 'blue',
    },
    emerald: {
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold',
      borderLeft: 'border-l-[6px] border-l-emerald-500',
      cardGlow: 'hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/5',
      tabUnselected: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold shadow-2xs hover:bg-emerald-200/70',
      tabSelected: 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/25 border-emerald-700 scale-[1.03]',
      pillActive: 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/25 border-emerald-700 scale-[1.03]',
      headerAccent: 'text-emerald-800 bg-emerald-100 border-emerald-300',
      countBadge: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
      label,
      colorName: 'emerald',
    },
    amber: {
      badge: 'bg-amber-100 text-amber-800 border-amber-300 font-extrabold',
      borderLeft: 'border-l-[6px] border-l-amber-500',
      cardGlow: 'hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/5',
      tabUnselected: 'bg-amber-100 text-amber-800 border-amber-300 font-bold shadow-2xs hover:bg-amber-200/70',
      tabSelected: 'bg-amber-600 text-white font-black shadow-md shadow-amber-600/25 border-amber-700 scale-[1.03]',
      pillActive: 'bg-amber-600 text-white font-black shadow-md shadow-amber-600/25 border-amber-700 scale-[1.03]',
      headerAccent: 'text-amber-800 bg-amber-100 border-amber-300',
      countBadge: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
      label,
      colorName: 'amber',
    },
  };

  return (
    colorMap[norm] || {
      badge: 'bg-slate-100 text-slate-800 border-slate-300 font-extrabold',
      borderLeft: 'border-l-[6px] border-l-slate-500',
      cardGlow: 'hover:border-slate-300 hover:shadow-lg hover:shadow-slate-500/5',
      tabUnselected: 'bg-slate-100 text-slate-800 border-slate-300 font-bold shadow-2xs hover:bg-slate-200/80',
      tabSelected: 'bg-slate-900 text-white font-black shadow-md shadow-slate-900/25 border-slate-950 scale-[1.03]',
      pillActive: 'bg-slate-900 text-white font-black shadow-md shadow-slate-900/25 border-slate-950 scale-[1.03]',
      headerAccent: 'text-slate-800 bg-slate-100 border-slate-300',
      countBadge: 'bg-slate-100 text-slate-800 border-slate-300 font-bold',
      label,
      colorName: 'slate',
    }
  );
}

export function getSpecialtyColor(category: string): SpecialtyColorScheme {
  const norm = category ? category.toLowerCase().trim() : 'general medical';

  // Check custom user specialties first
  const customSpecs = getCustomSpecialties();
  const match = customSpecs.find(
    (s) => s.id.toLowerCase() === norm || s.name.toLowerCase() === norm
  );

  if (match) {
    return buildSchemeForColor(match.color, match.name);
  }

  // Alias checks
  if (norm.includes('psych')) return buildSchemeForColor('purple', 'Psychiatry');
  if (norm.includes('otc') || norm.includes('counter')) return buildSchemeForColor('emerald', 'Over-The-Counter (OTC)');
  if (norm.includes('allergy') || norm.includes('asthma')) return buildSchemeForColor('teal', 'Allergy & Asthma');
  if (norm.includes('cardio')) return buildSchemeForColor('rose', 'Cardiology');
  if (norm.includes('derm')) return buildSchemeForColor('pink', 'Dermatology');

  return buildSchemeForColor('slate', category || 'General');
}
