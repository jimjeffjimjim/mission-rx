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
  customHex?: string;
}

export interface CustomSpecialtyConfig {
  id: string;
  name: string;
  color: string; // Tailwind color key or hex code
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
        // Fallback
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
    red: {
      badge: 'bg-red-100 text-red-800 border-red-300 font-extrabold',
      borderLeft: 'border-l-[6px] border-l-red-500',
      cardGlow: 'hover:border-red-300 hover:shadow-lg hover:shadow-red-500/5',
      tabUnselected: 'bg-red-100 text-red-800 border-red-300 font-bold shadow-2xs hover:bg-red-200/70',
      tabSelected: 'bg-red-600 text-white font-black shadow-md shadow-red-600/25 border-red-700 scale-[1.03]',
      headerAccent: 'text-red-800 bg-red-100 border-red-300',
      countBadge: 'bg-red-100 text-red-800 border-red-300 font-bold',
      label,
      colorName: 'red',
    },
    orange: {
      badge: 'bg-orange-100 text-orange-800 border-orange-300 font-extrabold',
      borderLeft: 'border-l-[6px] border-l-orange-500',
      cardGlow: 'hover:border-orange-300 hover:shadow-lg hover:shadow-orange-500/5',
      tabUnselected: 'bg-orange-100 text-orange-800 border-orange-300 font-bold shadow-2xs hover:bg-orange-200/70',
      tabSelected: 'bg-orange-600 text-white font-black shadow-md shadow-orange-600/25 border-orange-700 scale-[1.03]',
      headerAccent: 'text-orange-800 bg-orange-100 border-orange-300',
      countBadge: 'bg-orange-100 text-orange-800 border-orange-300 font-bold',
      label,
      colorName: 'orange',
    },
    amber: {
      badge: 'bg-amber-100 text-amber-800 border-amber-300 font-extrabold',
      borderLeft: 'border-l-[6px] border-l-amber-500',
      cardGlow: 'hover:border-amber-300 hover:shadow-lg hover:shadow-amber-500/5',
      tabUnselected: 'bg-amber-100 text-amber-800 border-amber-300 font-bold shadow-2xs hover:bg-amber-200/70',
      tabSelected: 'bg-amber-600 text-white font-black shadow-md shadow-amber-600/25 border-amber-700 scale-[1.03]',
      headerAccent: 'text-amber-800 bg-amber-100 border-amber-300',
      countBadge: 'bg-amber-100 text-amber-800 border-amber-300 font-bold',
      label,
      colorName: 'amber',
    },
    yellow: {
      badge: 'bg-yellow-100 text-yellow-900 border-yellow-300 font-extrabold',
      borderLeft: 'border-l-[6px] border-l-yellow-500',
      cardGlow: 'hover:border-yellow-300 hover:shadow-lg hover:shadow-yellow-500/5',
      tabUnselected: 'bg-yellow-100 text-yellow-900 border-yellow-300 font-bold shadow-2xs hover:bg-yellow-200/70',
      tabSelected: 'bg-yellow-500 text-slate-950 font-black shadow-md shadow-yellow-500/25 border-yellow-600 scale-[1.03]',
      headerAccent: 'text-yellow-900 bg-yellow-100 border-yellow-300',
      countBadge: 'bg-yellow-100 text-yellow-900 border-yellow-300 font-bold',
      label,
      colorName: 'yellow',
    },
    lime: {
      badge: 'bg-lime-100 text-lime-900 border-lime-300 font-extrabold',
      borderLeft: 'border-l-[6px] border-l-lime-500',
      cardGlow: 'hover:border-lime-300 hover:shadow-lg hover:shadow-lime-500/5',
      tabUnselected: 'bg-lime-100 text-lime-900 border-lime-300 font-bold shadow-2xs hover:bg-lime-200/70',
      tabSelected: 'bg-lime-600 text-white font-black shadow-md shadow-lime-600/25 border-lime-700 scale-[1.03]',
      headerAccent: 'text-lime-900 bg-lime-100 border-lime-300',
      countBadge: 'bg-lime-100 text-lime-900 border-lime-300 font-bold',
      label,
      colorName: 'lime',
    },
    green: {
      badge: 'bg-green-100 text-green-800 border-green-300 font-extrabold',
      borderLeft: 'border-l-[6px] border-l-green-500',
      cardGlow: 'hover:border-green-300 hover:shadow-lg hover:shadow-green-500/5',
      tabUnselected: 'bg-green-100 text-green-800 border-green-300 font-bold shadow-2xs hover:bg-green-200/70',
      tabSelected: 'bg-green-600 text-white font-black shadow-md shadow-green-600/25 border-green-700 scale-[1.03]',
      headerAccent: 'text-green-800 bg-green-100 border-green-300',
      countBadge: 'bg-green-100 text-green-800 border-green-300 font-bold',
      label,
      colorName: 'green',
    },
    emerald: {
      badge: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-extrabold',
      borderLeft: 'border-l-[6px] border-l-emerald-500',
      cardGlow: 'hover:border-emerald-300 hover:shadow-lg hover:shadow-emerald-500/5',
      tabUnselected: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold shadow-2xs hover:bg-emerald-200/70',
      tabSelected: 'bg-emerald-600 text-white font-black shadow-md shadow-emerald-600/25 border-emerald-700 scale-[1.03]',
      headerAccent: 'text-emerald-800 bg-emerald-100 border-emerald-300',
      countBadge: 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold',
      label,
      colorName: 'emerald',
    },
    teal: {
      badge: 'bg-teal-100 text-teal-800 border-teal-300 font-extrabold',
      borderLeft: 'border-l-[6px] border-l-teal-500',
      cardGlow: 'hover:border-teal-300 hover:shadow-lg hover:shadow-teal-500/5',
      tabUnselected: 'bg-teal-100 text-teal-800 border-teal-300 font-bold shadow-2xs hover:bg-teal-200/70',
      tabSelected: 'bg-teal-600 text-white font-black shadow-md shadow-teal-600/25 border-teal-700 scale-[1.03]',
      headerAccent: 'text-teal-800 bg-teal-100 border-teal-300',
      countBadge: 'bg-teal-100 text-teal-800 border-teal-300 font-bold',
      label,
      colorName: 'teal',
    },
    cyan: {
      badge: 'bg-cyan-100 text-cyan-800 border-cyan-300 font-extrabold',
      borderLeft: 'border-l-[6px] border-l-cyan-500',
      cardGlow: 'hover:border-cyan-300 hover:shadow-lg hover:shadow-cyan-500/5',
      tabUnselected: 'bg-cyan-100 text-cyan-800 border-cyan-300 font-bold shadow-2xs hover:bg-cyan-200/70',
      tabSelected: 'bg-cyan-600 text-white font-black shadow-md shadow-cyan-600/25 border-cyan-700 scale-[1.03]',
      headerAccent: 'text-cyan-800 bg-cyan-100 border-cyan-300',
      countBadge: 'bg-cyan-100 text-cyan-800 border-cyan-300 font-bold',
      label,
      colorName: 'cyan',
    },
    sky: {
      badge: 'bg-sky-100 text-sky-800 border-sky-300 font-extrabold',
      borderLeft: 'border-l-[6px] border-l-sky-500',
      cardGlow: 'hover:border-sky-300 hover:shadow-lg hover:shadow-sky-500/5',
      tabUnselected: 'bg-sky-100 text-sky-800 border-sky-300 font-bold shadow-2xs hover:bg-sky-200/70',
      tabSelected: 'bg-sky-600 text-white font-black shadow-md shadow-sky-600/25 border-sky-700 scale-[1.03]',
      headerAccent: 'text-sky-800 bg-sky-100 border-sky-300',
      countBadge: 'bg-sky-100 text-sky-800 border-sky-300 font-bold',
      label,
      colorName: 'sky',
    },
    blue: {
      badge: 'bg-blue-100 text-blue-800 border-blue-300 font-extrabold',
      borderLeft: 'border-l-[6px] border-l-blue-500',
      cardGlow: 'hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5',
      tabUnselected: 'bg-blue-100 text-blue-800 border-blue-300 font-bold shadow-2xs hover:bg-blue-200/70',
      tabSelected: 'bg-blue-600 text-white font-black shadow-md shadow-blue-600/25 border-blue-700 scale-[1.03]',
      headerAccent: 'text-blue-800 bg-blue-100 border-blue-300',
      countBadge: 'bg-blue-100 text-blue-800 border-blue-300 font-bold',
      label,
      colorName: 'blue',
    },
    indigo: {
      badge: 'bg-indigo-100 text-indigo-800 border-indigo-300 font-extrabold',
      borderLeft: 'border-l-[6px] border-l-indigo-500',
      cardGlow: 'hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/5',
      tabUnselected: 'bg-indigo-100 text-indigo-800 border-indigo-300 font-bold shadow-2xs hover:bg-indigo-200/70',
      tabSelected: 'bg-indigo-600 text-white font-black shadow-md shadow-indigo-600/25 border-indigo-700 scale-[1.03]',
      headerAccent: 'text-indigo-800 bg-indigo-100 border-indigo-300',
      countBadge: 'bg-indigo-100 text-indigo-800 border-indigo-300 font-bold',
      label,
      colorName: 'indigo',
    },
    violet: {
      badge: 'bg-violet-100 text-violet-800 border-violet-300 font-extrabold',
      borderLeft: 'border-l-[6px] border-l-violet-500',
      cardGlow: 'hover:border-violet-300 hover:shadow-lg hover:shadow-violet-500/5',
      tabUnselected: 'bg-violet-100 text-violet-800 border-violet-300 font-bold shadow-2xs hover:bg-violet-200/70',
      tabSelected: 'bg-violet-600 text-white font-black shadow-md shadow-violet-600/25 border-violet-700 scale-[1.03]',
      headerAccent: 'text-violet-800 bg-violet-100 border-violet-300',
      countBadge: 'bg-violet-100 text-violet-800 border-violet-300 font-bold',
      label,
      colorName: 'violet',
    },
    purple: {
      badge: 'bg-purple-100 text-purple-800 border-purple-300 font-extrabold',
      borderLeft: 'border-l-[6px] border-l-purple-500',
      cardGlow: 'hover:border-purple-300 hover:shadow-lg hover:shadow-purple-500/5',
      tabUnselected: 'bg-purple-100 text-purple-800 border-purple-300 font-bold shadow-2xs hover:bg-purple-200/70',
      tabSelected: 'bg-purple-600 text-white font-black shadow-md shadow-purple-600/25 border-purple-700 scale-[1.03]',
      headerAccent: 'text-purple-800 bg-purple-100 border-purple-300',
      countBadge: 'bg-purple-100 text-purple-800 border-purple-300 font-bold',
      label,
      colorName: 'purple',
    },
    fuchsia: {
      badge: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300 font-extrabold',
      borderLeft: 'border-l-[6px] border-l-fuchsia-500',
      cardGlow: 'hover:border-fuchsia-300 hover:shadow-lg hover:shadow-fuchsia-500/5',
      tabUnselected: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300 font-bold shadow-2xs hover:bg-fuchsia-200/70',
      tabSelected: 'bg-fuchsia-600 text-white font-black shadow-md shadow-fuchsia-600/25 border-fuchsia-700 scale-[1.03]',
      headerAccent: 'text-fuchsia-800 bg-fuchsia-100 border-fuchsia-300',
      countBadge: 'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-300 font-bold',
      label,
      colorName: 'fuchsia',
    },
    pink: {
      badge: 'bg-pink-100 text-pink-800 border-pink-300 font-extrabold',
      borderLeft: 'border-l-[6px] border-l-pink-500',
      cardGlow: 'hover:border-pink-300 hover:shadow-lg hover:shadow-pink-500/5',
      tabUnselected: 'bg-pink-100 text-pink-800 border-pink-300 font-bold shadow-2xs hover:bg-pink-200/70',
      tabSelected: 'bg-pink-600 text-white font-black shadow-md shadow-pink-600/25 border-pink-700 scale-[1.03]',
      headerAccent: 'text-pink-800 bg-pink-100 border-pink-300',
      countBadge: 'bg-pink-100 text-pink-800 border-pink-300 font-bold',
      label,
      colorName: 'pink',
    },
    rose: {
      badge: 'bg-rose-100 text-rose-800 border-rose-300 font-extrabold',
      borderLeft: 'border-l-[6px] border-l-rose-500',
      cardGlow: 'hover:border-rose-300 hover:shadow-lg hover:shadow-rose-500/5',
      tabUnselected: 'bg-rose-100 text-rose-800 border-rose-300 font-bold shadow-2xs hover:bg-rose-200/70',
      tabSelected: 'bg-rose-600 text-white font-black shadow-md shadow-rose-600/25 border-rose-700 scale-[1.03]',
      headerAccent: 'text-rose-800 bg-rose-100 border-rose-300',
      countBadge: 'bg-rose-100 text-rose-800 border-rose-300 font-bold',
      label,
      colorName: 'rose',
    },
    slate: {
      badge: 'bg-slate-100 text-slate-800 border-slate-300 font-extrabold',
      borderLeft: 'border-l-[6px] border-l-slate-500',
      cardGlow: 'hover:border-slate-300 hover:shadow-lg hover:shadow-slate-500/5',
      tabUnselected: 'bg-slate-100 text-slate-800 border-slate-300 font-bold shadow-2xs hover:bg-slate-200/80',
      tabSelected: 'bg-slate-900 text-white font-black shadow-md shadow-slate-900/25 border-slate-950 scale-[1.03]',
      headerAccent: 'text-slate-800 bg-slate-100 border-slate-300',
      countBadge: 'bg-slate-100 text-slate-800 border-slate-300 font-bold',
      label,
      colorName: 'slate',
    },
    zinc: {
      badge: 'bg-zinc-200 text-zinc-900 border-zinc-400 font-extrabold',
      borderLeft: 'border-l-[6px] border-l-zinc-600',
      cardGlow: 'hover:border-zinc-400 hover:shadow-lg hover:shadow-zinc-600/5',
      tabUnselected: 'bg-zinc-200 text-zinc-900 border-zinc-400 font-bold shadow-2xs hover:bg-zinc-300',
      tabSelected: 'bg-zinc-800 text-white font-black shadow-md shadow-zinc-800/25 border-zinc-900 scale-[1.03]',
      headerAccent: 'text-zinc-900 bg-zinc-200 border-zinc-400',
      countBadge: 'bg-zinc-200 text-zinc-900 border-zinc-400 font-bold',
      label,
      colorName: 'zinc',
    },
    stone: {
      badge: 'bg-stone-200 text-stone-900 border-stone-400 font-extrabold',
      borderLeft: 'border-l-[6px] border-l-stone-600',
      cardGlow: 'hover:border-stone-400 hover:shadow-lg hover:shadow-stone-600/5',
      tabUnselected: 'bg-stone-200 text-stone-900 border-stone-400 font-bold shadow-2xs hover:bg-stone-300',
      tabSelected: 'bg-stone-800 text-white font-black shadow-md shadow-stone-800/25 border-stone-900 scale-[1.03]',
      headerAccent: 'text-stone-900 bg-stone-200 border-stone-400',
      countBadge: 'bg-stone-200 text-stone-900 border-stone-400 font-bold',
      label,
      colorName: 'stone',
    },
  };

  return (
    colorMap[norm] || {
      badge: 'bg-slate-100 text-slate-800 border-slate-300 font-extrabold',
      borderLeft: 'border-l-[6px] border-l-teal-500',
      cardGlow: 'hover:border-teal-300 hover:shadow-lg hover:shadow-teal-500/5',
      tabUnselected: 'bg-slate-100 text-slate-800 border-slate-300 font-bold shadow-2xs hover:bg-slate-200/80',
      tabSelected: 'bg-slate-900 text-white font-black shadow-md shadow-slate-900/25 border-slate-950 scale-[1.03]',
      headerAccent: 'text-slate-800 bg-slate-100 border-slate-300',
      countBadge: 'bg-slate-100 text-slate-800 border-slate-300 font-bold',
      label,
      colorName: norm,
    }
  );
}

export function getSpecialtyColor(category: string): SpecialtyColorScheme {
  const norm = category ? category.toLowerCase().trim() : 'general medical';

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
