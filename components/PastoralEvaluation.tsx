
import React, { useMemo, useState } from 'react';
import { 
    Users, Award, UserCheck, Network, Search, ChevronDown, ChevronUp, 
    Download, LayoutDashboard, Target, TrendingUp, Info
} from 'lucide-react';
import { CellLeader } from '../types';
import { ROLE_COLORS } from './constants';

interface PastoralEvaluationProps {
  leaders: CellLeader[];
}

type SortKey = 'mgCode' | 'displayName' | 'ordinationDate' | 'directCount' | 'agmCount' | 'totalCount';

const PastoralEvaluation: React.FC<PastoralEvaluationProps> = ({ leaders }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState<{ key: SortKey, direction: 'asc' | 'desc' }>({ 
    key: 'mgCode', 
    direction: 'asc' 
  });

  const getLeaderStats = (leader: CellLeader) => {
    const currentYear = new Date().getFullYear();
    const startDate = `${currentYear}-01-01`;
    const endDate = `${currentYear}-10-01`;
    const isRecent = (dateStr?: string) => dateStr ? (dateStr >= startDate && dateStr <= endDate) : false;

    const directDisciples = leaders.filter(l => l.parentLeaderId === leader.id && l.roles.includes('小組長'));
    
    const agmDisciples = directDisciples.filter(l => {
        const wasRecentlyOrdained = isRecent(l.ordinationDate);
        const wasRecentlyTransferred = l.transferHistory?.some(t => isRecent(t.changeDate));
        const wasRecentlyReinstated = l.statusHistory?.some(s => s.newStatus === 'active' && isRecent(s.changeDate));
        return !wasRecentlyOrdained && !wasRecentlyTransferred && !wasRecentlyReinstated;
    });

    const totalLineage = leaders.filter(l => l.mgCode.startsWith(leader.mgCode));

    return {
        directCount: directDisciples.length,
        agmCount: agmDisciples.length,
        totalCount: totalLineage.length
    };
  };

  const processedData = useMemo(() => {
    return leaders
      .filter(l => l.status === 'active' && (l.roles.includes('小組長') || l.roles.includes('族長')))
      .map(l => ({
        ...l,
        ...getLeaderStats(l),
        displayName: `${l.chineseName || ''} ${l.firstName || ''}`.trim()
      }))
      .filter(l => {
        const full = `${l.displayName} ${l.mgCode}`.toLowerCase();
        return full.includes(searchQuery.toLowerCase());
      })
      .sort((a, b) => {
        const valA = a[sortConfig.key];
        const valB = b[sortConfig.key];
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
  }, [leaders, searchQuery, sortConfig]);

  const requestSort = (key: SortKey) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '--';
    const parts = dateStr.split('-');
    return parts.length === 3 ? `${parts[2]}/${parts[1]}/${parts[0]}` : dateStr;
  };

  const handleExport = () => {
    const headers = ["ID-Name", "Roles", "Ordination Date", "Direct Disciples", "AGM Mature Disciples", "Total Lineage"];
    const rows = processedData.map(l => [
        `"${l.mgCode} - ${l.displayName}"`,
        `"${l.roles.join(', ')}"`,
        l.ordinationDate || '--',
        l.directCount,
        l.agmCount,
        l.totalCount
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `AGM_Evaluation_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-50 overflow-hidden animate-in fade-in duration-500">
      <div className="bg-white px-8 py-6 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Target className="w-7 h-7 text-indigo-600" />
            AGM Performance (績效評核)
          </h1>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mt-1">Evaluating mature discipleship metrics</p>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-black text-sm shadow-lg shadow-slate-100 hover:bg-slate-800 transition-all active:scale-95">
          <Download className="w-4 h-4" /> Export Assessment
        </button>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col p-6 sm:p-8">
        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 flex-1 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
             <div className="relative w-full sm:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search by name or MG code..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                />
             </div>
             <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Direct</span>
                </div>
                <div className="flex items-center gap-2">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AGM Mature</span>
                </div>
             </div>
          </div>

          <div className="flex-1 overflow-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead className="sticky top-0 bg-white z-10 border-b border-slate-100 shadow-sm">
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('mgCode')}>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID-Name</span>
                        {sortConfig.key === 'mgCode' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-indigo-600" /> : <ChevronDown className="w-3 h-3 text-indigo-600" />)}
                    </div>
                  </th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Roles</th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors" onClick={() => requestSort('ordinationDate')}>
                    <div className="flex items-center gap-2">
                        <Award className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">按立日期</span>
                        {sortConfig.key === 'ordinationDate' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-indigo-600" /> : <ChevronDown className="w-3 h-3 text-indigo-600" />)}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors text-center" onClick={() => requestSort('directCount')}>
                    <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1.5">
                            <Users className="w-3.5 h-3.5 text-indigo-50" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">直系門徒</span>
                        </div>
                        {sortConfig.key === 'directCount' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-indigo-600" /> : <ChevronDown className="w-3 h-3 text-indigo-600" />)}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors text-center" onClick={() => requestSort('agmCount')}>
                    <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1.5">
                            <UserCheck className="w-3.5 h-3.5 text-emerald-500" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">直系門徒(AGM)</span>
                        </div>
                        {sortConfig.key === 'agmCount' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-indigo-600" /> : <ChevronDown className="w-3 h-3 text-indigo-600" />)}
                    </div>
                  </th>
                  <th className="px-6 py-4 cursor-pointer hover:bg-slate-100 transition-colors text-center" onClick={() => requestSort('totalCount')}>
                    <div className="flex flex-col items-center gap-1">
                        <div className="flex items-center gap-1.5">
                            <Network className="w-3.5 h-3.5 text-slate-900" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">體系人數</span>
                        </div>
                        {sortConfig.key === 'totalCount' && (sortConfig.direction === 'asc' ? <ChevronUp className="w-3 h-3 text-indigo-600" /> : <ChevronDown className="w-3 h-3 text-indigo-600" />)}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {processedData.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black text-xs border border-slate-200 overflow-hidden shadow-sm">
                            {l.avatarUrl ? <img src={l.avatarUrl} className="w-full h-full object-cover" /> : l.displayName.charAt(0)}
                         </div>
                         <div>
                            <div className="font-black text-slate-900 text-sm leading-none mb-1.5">{l.mgCode} - {l.displayName}</div>
                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Gen {l.generation}</div>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-1">
                        {l.roles.map(role => (
                          <span key={role} className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase ${ROLE_COLORS[role] || 'bg-slate-50 text-slate-400'}`}>
                            {role}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                        <span className="font-bold text-slate-600 text-xs">{formatDate(l.ordinationDate)}</span>
                    </td>
                    <td className="px-6 py-5 text-center">
                        <div className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 bg-indigo-50 text-indigo-700 rounded-lg font-black text-xs border border-indigo-100">
                            {l.directCount}
                        </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                        <div className={`inline-flex items-center justify-center min-w-[32px] px-2 py-1 rounded-lg font-black text-xs border ${l.agmCount > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                            {l.agmCount}
                        </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                        <div className="inline-flex items-center justify-center min-w-[32px] px-2 py-1 bg-slate-900 text-white rounded-lg font-black text-xs">
                            {l.totalCount}
                        </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="p-6 bg-slate-50/50 border-t flex justify-between items-center">
              <div className="flex items-center gap-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  <div className="flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5" /> Growth Analytics Enabled</div>
                  <div className="w-1 h-1 bg-slate-300 rounded-full" />
                  <div>Reflecting Current Evaluation Cycle</div>
              </div>
              <Info className="w-4 h-4 text-slate-300" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PastoralEvaluation;
