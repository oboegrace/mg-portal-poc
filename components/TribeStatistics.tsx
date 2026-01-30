
import React, { useMemo } from 'react';
import { Target, Search, BarChart3, TrendingUp, Users, Network, Info, Download, User } from 'lucide-react';
import { CellLeader } from '../types';

interface TribeStatisticsProps {
  allLeaders: CellLeader[];
}

interface TribeRow {
  rootLeader: CellLeader;
  tribeName: string;
  tribeCode: string;
  totalDescendants: number;
  maleCount: number;
  femaleCount: number;
  maxGeneration: number;
  generationBreakdown: Record<number, number>;
}

const TribeStatistics: React.FC<TribeStatisticsProps> = ({ allLeaders }) => {
  const tribeData = useMemo(() => {
    // 1. Identify Tribe Leaders (Only those with 2-digit codes like GJ, GA, G4)
    const roots = allLeaders.filter(l => l.mgCode && l.mgCode.length === 2);

    // 2. Aggregate Lineage Stats for each Tribe Leader
    const data: TribeRow[] = roots.map(root => {
      // Find all descendants who belong to this lineage prefix (including the root itself)
      const descendants = allLeaders.filter(l => 
        l.mgCode === root.mgCode || l.mgCode.startsWith(root.mgCode)
      );

      const breakdown: Record<number, number> = {};
      let maxGen = root.generation;
      let maleCount = 0;
      let femaleCount = 0;

      descendants.forEach(d => {
        breakdown[d.generation] = (breakdown[d.generation] || 0) + 1;
        if (d.generation > maxGen) maxGen = d.generation;
        
        // Gender tallies
        if (d.gender === 'Male') maleCount++;
        if (d.gender === 'Female') femaleCount++;
      });

      return {
        rootLeader: root,
        tribeName: `${root.chineseName || ''} ${root.firstName || ''}`.trim(),
        tribeCode: root.mgCode,
        totalDescendants: descendants.length,
        maleCount,
        femaleCount,
        maxGeneration: maxGen,
        generationBreakdown: breakdown
      };
    }).sort((a, b) => a.tribeCode.localeCompare(b.tribeCode));

    return data;
  }, [allLeaders]);

  const handleExportCSV = () => {
    const headers = [
      "Name",
      "Max Gen (最高代數)",
      "MG Code (MG 小組代號)",
      "Total Leaders (族系小組長總數)",
      "Male Leaders (男性小組長總數)",
      "Female Leaders (女性小組長總數)",
      "Gen 1",
      "Gen 2",
      "Gen 3",
      "Gen 4",
      "Gen 5",
      "Gen 6+"
    ];

    const rows = tribeData.map(row => [
      `"${row.rootLeader.mgCode} ${row.rootLeader.chineseName || ''} ${row.rootLeader.firstName || ''}"`,
      row.maxGeneration,
      row.tribeCode,
      row.totalDescendants,
      row.maleCount,
      row.femaleCount,
      row.generationBreakdown[1] || 0,
      row.generationBreakdown[2] || 0,
      row.generationBreakdown[3] || 0,
      row.generationBreakdown[4] || 0,
      row.generationBreakdown[5] || 0,
      row.generationBreakdown[6] || 0
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    // Add UTF-8 BOM for Excel compatibility
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Tribe_Statistics_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-50 overflow-hidden animate-in fade-in duration-500">
      <div className="bg-white px-8 py-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <BarChart3 className="w-7 h-7 text-indigo-600" />
            Tribe Statistics (族系統計)
          </h1>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mt-1">Generational Lineage & Gender Breakdown</p>
        </div>
        <button 
          onClick={handleExportCSV}
          className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200"
        >
          <Download className="w-4 h-4" /> Export CSV
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col p-6 sm:p-8">
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 flex-1 flex flex-col overflow-hidden">
          
          <div className="flex-1 overflow-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1300px]">
              <thead className="sticky top-0 bg-white z-10">
                <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                  <th className="px-6 py-5 flex items-center gap-2 sticky left-0 bg-slate-50 z-20 shadow-[2px_0_5px_rgba(0,0,0,0.05)]"><Search className="w-3.5 h-3.5" /> Name (MG Code-Name)</th>
                  <th className="px-6 py-5 text-center"><Target className="w-3.5 h-3.5 inline mr-1" /> 最高代數</th>
                  <th className="px-6 py-5">MG 代號</th>
                  <th className="px-6 py-5 text-center"><Network className="w-3.5 h-3.5 inline mr-1" /> 族系小組長總數</th>
                  <th className="px-6 py-5 text-center bg-blue-50/30">
                    <User className="w-3.5 h-3.5 inline mr-1 text-blue-500" /> 男性小組長總數
                  </th>
                  <th className="px-6 py-5 text-center bg-rose-50/30">
                    <User className="w-3.5 h-3.5 inline mr-1 text-rose-500" /> 女性小組長總數
                  </th>
                  <th className="px-6 py-5 text-center">第一代</th>
                  <th className="px-6 py-5 text-center">第二代</th>
                  <th className="px-6 py-5 text-center">第三代</th>
                  <th className="px-6 py-5 text-center">第四代</th>
                  <th className="px-6 py-5 text-center">第五代</th>
                  <th className="px-6 py-5 text-center">第六代+</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {tribeData.map((row, idx) => (
                  <tr key={row.rootLeader.id} className={`hover:bg-indigo-50/30 transition-colors group ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                    <td className="px-6 py-4 sticky left-0 bg-inherit z-20 shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                      <div className="font-black text-slate-900 text-sm">
                        {row.rootLeader.mgCode} - {row.rootLeader.chineseName || row.rootLeader.firstName}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-black text-slate-700">{row.maxGeneration}</span>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-bold">{row.tribeCode}</td>
                    <td className="px-6 py-4 text-center">
                      <div className="inline-flex items-center justify-center w-10 h-10 bg-slate-100 rounded-lg font-black text-slate-900 group-hover:bg-white group-hover:shadow-sm">
                        {row.totalDescendants}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full text-xs">
                        {row.maleCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="font-bold text-rose-600 bg-rose-50 px-3 py-1 rounded-full text-xs">
                        {row.femaleCount}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-800">{row.generationBreakdown[1] || 0}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-800">{row.generationBreakdown[2] || 0}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-800">{row.generationBreakdown[3] || 0}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-800">{row.generationBreakdown[4] || 0}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-800">{row.generationBreakdown[5] || 0}</td>
                    <td className="px-6 py-4 text-center font-bold text-slate-800">{row.generationBreakdown[6] || 0}</td>
                  </tr>
                ))}
                {tribeData.length === 0 && (
                  <tr>
                    <td colSpan={12} className="px-6 py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">
                      No 2-Digit MG Tribe Leaders Found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          <div className="p-6 bg-slate-50 border-t flex justify-between items-center">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-indigo-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Lineage Growth</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Male Breakdown</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-rose-500" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Female Breakdown</span>
              </div>
            </div>
            <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
              Showing {tribeData.length} Verified Tribe Leaders (2-Digit MG)
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TribeStatistics;
