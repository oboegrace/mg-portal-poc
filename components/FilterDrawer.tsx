
import React from 'react';
import { X, Check } from 'lucide-react';
import { FilterState, ZoneCode, DayOfWeek } from '../types';
import { ZONES, DAYS } from './constants';

interface FilterDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
}

const FilterDrawer: React.FC<FilterDrawerProps> = ({ isOpen, onClose, filters, setFilters }) => {
  if (!isOpen) return null;

  const toggleFilter = <T extends string | number>(
    category: keyof FilterState,
    value: T
  ) => {
    setFilters((prev) => {
      const current = prev[category] as T[];
      const exists = current.includes(value);
      const updated = exists
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
  };

  const isSelected = <T extends string | number>(category: keyof FilterState, value: T) => {
    return (filters[category] as T[]).includes(value);
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
        <div className="p-4 border-b flex justify-between items-center bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">Filter Groups</h2>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {/* Generation Filter */}
          <section>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Generation (代數)</h3>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5, 6].map((gen) => (
                <button
                  key={gen}
                  onClick={() => toggleFilter('generations', gen)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    isSelected('generations', gen)
                      ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
                  }`}
                >
                  Gen {gen}
                </button>
              ))}
            </div>
          </section>

          {/* Zone Filter */}
          <section>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Pastor Zone (牧區)</h3>
            <div className="flex flex-wrap gap-2">
              {ZONES.map((zone) => (
                <button
                  key={zone.code}
                  onClick={() => toggleFilter('zones', zone.code)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                    isSelected('zones', zone.code)
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-emerald-400'
                  }`}
                >
                  {zone.label}
                </button>
              ))}
            </div>
          </section>

          {/* Meeting Day Filter */}
          <section>
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-3">Meeting Day (開組日)</h3>
            <div className="grid grid-cols-4 gap-2">
              {DAYS.map((day) => (
                <button
                  key={day}
                  onClick={() => toggleFilter('days', day)}
                  className={`px-2 py-3 rounded-lg text-sm font-medium border transition-all flex justify-center ${
                    isSelected('days', day)
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-400'
                  }`}
                >
                  {day}
                </button>
              ))}
            </div>
          </section>
        </div>

        <div className="p-4 border-t bg-slate-50">
          <button 
            onClick={() => setFilters({ generations: [], zones: [], days: [] })}
            className="w-full py-3 text-slate-600 font-medium hover:text-slate-800 transition-colors mb-2"
          >
            Reset All
          </button>
          <button 
            onClick={onClose}
            className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-lg shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            <Check className="w-5 h-5" />
            Apply Filters
          </button>
        </div>
      </div>
    </div>
  );
};

export default FilterDrawer;
