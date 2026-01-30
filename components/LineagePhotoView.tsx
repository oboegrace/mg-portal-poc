
import React, { useMemo, useState } from 'react';
import { Camera, Users, Printer, ChevronDown, LayoutGrid, Info, Search } from 'lucide-react';
import { CellLeader } from '../types';

interface LineagePhotoViewProps {
  allLeaders: CellLeader[];
}

const GEN_COLORS: Record<number, string> = {
  1: 'border-slate-900 ring-slate-900/10',
  2: 'border-red-500 ring-red-500/20',
  3: 'border-amber-500 ring-amber-500/20',
  4: 'border-indigo-500 ring-indigo-500/20',
  5: 'border-emerald-500 ring-emerald-500/20',
  6: 'border-slate-400 ring-slate-400/10',
};

const LineagePhotoView: React.FC<LineagePhotoViewProps> = ({ allLeaders }) => {
  const rootLeaders = useMemo(() => 
    allLeaders.filter(l => l.mgCode && l.mgCode.length === 2)
    .sort((a, b) => a.mgCode.localeCompare(b.mgCode)), 
    [allLeaders]
  );

  const [selectedRootId, setSelectedRootId] = useState<string>(rootLeaders[0]?.id || '');

  const activeLineageData = useMemo(() => {
    const root = allLeaders.find(l => l.id === selectedRootId);
    if (!root) return null;

    const lineage = allLeaders.filter(l => 
      l.mgCode === root.mgCode || l.mgCode.startsWith(root.mgCode)
    ).sort((a, b) => {
        // Sort by generation first, then MG code
        if (a.generation !== b.generation) return a.generation - b.generation;
        return a.mgCode.localeCompare(b.mgCode);
    });

    const genCounts: Record<number, number> = {};
    lineage.forEach(l => {
      if (l.generation > 1) {
        genCounts[l.generation] = (genCounts[l.generation] || 0) + 1;
      }
    });

    const breakdownStr = Object.entries(genCounts)
      .map(([gen, count]) => `第${gen}代：${count}`)
      .join('、');

    return {
      root,
      lineage,
      totalCount: lineage.length,
      breakdownStr
    };
  }, [allLeaders, selectedRootId]);

  const handlePrint = () => {
    window.print();
  };

  if (!activeLineageData) return null;

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-50 overflow-hidden animate-in fade-in duration-500">
      {/* Print Styles for A3 */}
      <style>{`
        @media print {
          @page {
            size: A3 landscape;
            margin: 1cm;
          }
          body {
            background: white !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }
          .no-print {
            display: none !important;
          }
          .print-container {
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
          }
          .photo-grid {
            display: grid !important;
            grid-template-columns: repeat(8, 1fr) !important;
            gap: 10px !important;
          }
          .photo-card {
            break-inside: avoid;
          }
        }
      `}</style>

      {/* Screen Header - Hidden on Print */}
      <div className="bg-white px-8 py-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Camera className="w-7 h-7 text-rose-500" />
            Lineage Photo View
          </h1>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mt-1">Visual Directory & Organizational Chart</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative">
            <select 
              value={selectedRootId}
              onChange={(e) => setSelectedRootId(e.target.value)}
              className="appearance-none pl-6 pr-12 py-3 bg-slate-100 border border-slate-200 rounded-2xl font-black text-sm text-slate-900 outline-none focus:ring-4 focus:ring-rose-500/10 transition-all cursor-pointer"
            >
              {rootLeaders.map(l => (
                <option key={l.id} value={l.id}>{l.mgCode} - {l.chineseName || l.firstName}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          </div>
          
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg"
          >
            <Printer className="w-4 h-4" /> Print A3
          </button>
        </div>
      </div>

      {/* The Visual Grid Container */}
      <div className="flex-1 overflow-y-auto p-8 no-scrollbar print-container">
        <div className="max-w-[1600px] mx-auto">
          {/* Dynamic Header Title */}
          <div className="mb-10 text-center sm:text-left animate-in slide-in-from-top-4 duration-700">
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter">
              {activeLineageData.root.chineseName || activeLineageData.root.firstName}族系：
              <span className="text-rose-600">{activeLineageData.totalCount}</span>人
              {activeLineageData.breakdownStr && (
                <span className="text-slate-400 text-lg sm:text-xl font-bold tracking-normal ml-3">
                  ({activeLineageData.breakdownStr})
                </span>
              )}
            </h2>
            <div className="h-1.5 w-24 bg-rose-500 rounded-full mt-4 no-print" />
          </div>

          {/* Photo Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-4 sm:gap-6 photo-grid">
            {activeLineageData.lineage.map((leader, idx) => (
              <div 
                key={leader.id} 
                className="photo-card animate-in fade-in zoom-in duration-500"
                style={{ animationDelay: `${idx * 20}ms` }}
              >
                <div className={`
                  group relative bg-white rounded-2xl sm:rounded-3xl overflow-hidden border-4 sm:border-8 transition-all hover:scale-[1.03] hover:shadow-2xl shadow-sm
                  ${GEN_COLORS[leader.generation] || 'border-slate-200'}
                `}>
                  {/* Photo Area */}
                  <div className="aspect-[4/5] bg-slate-100 flex items-center justify-center relative overflow-hidden">
                    {leader.avatarUrl ? (
                      <img src={leader.avatarUrl} alt={leader.mgCode} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-slate-300 flex flex-col items-center gap-2">
                        <Users className="w-10 h-10 opacity-20" />
                        <span className="text-[10px] font-black uppercase tracking-widest opacity-20">No Image</span>
                      </div>
                    )}
                    
                    {/* Generational Badge (Corner) */}
                    <div className={`absolute top-2 right-2 px-2 py-1 rounded-lg text-[9px] font-black text-white shadow-lg ${
                      leader.generation === 1 ? 'bg-slate-900' :
                      leader.generation === 2 ? 'bg-red-500' :
                      leader.generation === 3 ? 'bg-amber-500' :
                      leader.generation === 4 ? 'bg-indigo-500' :
                      leader.generation === 5 ? 'bg-emerald-500' : 'bg-slate-400'
                    }`}>
                      G{leader.generation}
                    </div>
                  </div>

                  {/* Identity Footer */}
                  <div className="p-3 bg-white text-center">
                    <div className="text-[11px] sm:text-xs font-black text-slate-900 uppercase tracking-[0.1em]">
                      {leader.mgCode}
                    </div>
                    <div className="text-[10px] font-bold text-slate-400 truncate mt-0.5">
                      {leader.chineseName || leader.firstName}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Print Footer Legend */}
          <div className="mt-16 hidden print:flex items-center justify-center gap-8 border-t pt-8">
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-red-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Gen 2 (Red)</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-amber-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Gen 3 (Amber)</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-indigo-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Gen 4 (Indigo)</span>
            </div>
            <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-full bg-emerald-500" />
                <span className="text-[10px] font-bold uppercase tracking-widest">Gen 5 (Emerald)</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Screen Footer Legend */}
      <div className="p-6 bg-white border-t flex justify-between items-center no-print">
        <div className="flex flex-wrap items-center gap-4 sm:gap-8">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gen 2</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gen 3</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-indigo-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gen 4</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gen 5</span>
          </div>
        </div>
        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <LayoutGrid className="w-3.5 h-3.5" /> Optimal for A3 Landscape
        </div>
      </div>
    </div>
  );
};

export default LineagePhotoView;
