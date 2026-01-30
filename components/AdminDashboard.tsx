
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { BarChart3, Download, TrendingUp, Users, Calendar, ArrowUpRight, ArrowDownRight, Filter, LayoutDashboard, Network, UserCheck, Layers, GitBranch, ArrowDown, ChevronRight, Share2, MoveHorizontal, ChevronDown, Globe } from 'lucide-react';
import { CellLeader, Report, GroupCategory } from '../types';

interface AdminDashboardProps {
  user: CellLeader;
  allLeaders: CellLeader[];
}

interface WeeklyStat {
  yearWeek: string;
  range: string;
  totalGroups: number;
  openGroups: number;
  openAttendance: number;
  discipleGroups: number;
  discipleAttendance: number;
  totalGatherings: number;
  totalAttendance: number;
}

const getISOWeek = (date: Date) => {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
};

const getWeekRange = (date: Date) => {
  const d = new Date(date);
  const day = d.getDay(), diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return `${monday.toISOString().split('T')[0]} to ${sunday.toISOString().split('T')[0]}`;
};

const AdminDashboard: React.FC<AdminDashboardProps> = ({ user, allLeaders }) => {
  const [filterRange, setFilterRange] = useState<'3m' | '6m' | '1y' | 'all'>('3m');
  const [scope, setScope] = useState<'church' | 'lineage'>('church');
  const [hoveredWeek, setHoveredWeek] = useState<string | null>(null);
  const chartScrollRef = useRef<HTMLDivElement>(null);

  const activeLeadersForScope = useMemo(() => {
      if (scope === 'lineage') {
          return allLeaders.filter(l => l.mgCode.startsWith(user.mgCode));
      }
      return allLeaders;
  }, [allLeaders, scope, user.mgCode]);

  // 1. Leadership Network Logic
  const leadershipNetwork = useMemo(() => {
    const targetLeaders = scope === 'church' 
        ? allLeaders 
        : allLeaders.filter(l => l.mgCode.startsWith(user.mgCode) && l.mgCode.length > user.mgCode.length);
    
    const genCounts: Record<number, number> = {};
    targetLeaders.forEach(l => {
      genCounts[l.generation] = (genCounts[l.generation] || 0) + 1;
    });
    return {
      total: targetLeaders.length,
      generations: Object.entries(genCounts)
        .map(([gen, count]) => ({ gen: parseInt(gen), count }))
        .sort((a, b) => a.gen - b.gen)
    };
  }, [allLeaders, scope, user.mgCode]);

  // 2. Weekly Aggregate Logic
  const allWeeklyStats = useMemo(() => {
    const statsMap: Record<string, WeeklyStat> = {};
    activeLeadersForScope.forEach(leader => {
      leader.groups.filter(g => !g.isDeleted).forEach(group => {
        group.reports.forEach(report => {
          const date = new Date(report.gatheringDate);
          const key = `${date.getFullYear()}-W${getISOWeek(date).toString().padStart(2, '0')}`;
          if (!statsMap[key]) {
            statsMap[key] = {
              yearWeek: key, range: getWeekRange(date), totalGroups: 0,
              openGroups: 0, openAttendance: 0, discipleGroups: 0, discipleAttendance: 0,
              totalGatherings: 0, totalAttendance: 0
            };
          }
          const stat = statsMap[key];
          stat.totalGatherings += 1;
          stat.totalAttendance += report.attendanceCount;
          if (report.category === 'open_cell') {
            stat.openAttendance += report.attendanceCount;
            stat.openGroups += 1; 
          } else {
            stat.discipleAttendance += report.attendanceCount;
            stat.discipleGroups += 1;
          }
          stat.totalGroups = stat.openGroups + stat.discipleGroups;
        });
      });
    });
    return Object.values(statsMap).sort((a, b) => b.yearWeek.localeCompare(a.yearWeek));
  }, [activeLeadersForScope]);

  const displayedStats = useMemo(() => {
    let limit = filterRange === '6m' ? 26 : filterRange === '1y' ? 52 : filterRange === 'all' ? allWeeklyStats.length : 12;
    return allWeeklyStats.slice(0, limit);
  }, [allWeeklyStats, filterRange]);

  const latest = allWeeklyStats[0] || null;
  const previous = allWeeklyStats[1] || null;

  useEffect(() => {
    if (chartScrollRef.current) {
        chartScrollRef.current.scrollLeft = chartScrollRef.current.scrollWidth;
    }
  }, [displayedStats]);

  const calculateGrowth = (curr: number, prev: number) => prev ? ((curr - prev) / prev) * 100 : 0;

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-50 overflow-hidden animate-in fade-in duration-500">
      {/* Header with Scope Switcher */}
      <div className="bg-white px-6 sm:px-8 py-6 border-b border-slate-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <LayoutDashboard className="w-6 h-6 sm:w-7 sm:h-7 text-orange-600" />
                Organization Insight
            </h1>
            <p className="text-[10px] sm:text-xs text-slate-400 font-black uppercase tracking-widest mt-1">
                {scope === 'church' ? 'Entire Church Global View' : `My Lineage: ${user.mgCode}`}
            </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="flex bg-slate-100 p-1 rounded-2xl w-full sm:w-auto shadow-inner border border-slate-200/50">
                <button 
                    onClick={() => setScope('church')}
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${scope === 'church' ? 'bg-white text-slate-900 shadow-lg ring-1 ring-slate-200' : 'text-slate-400'}`}
                >
                    <Globe className="w-4 h-4" />
                    Entire Church
                </button>
                <button 
                    onClick={() => setScope('lineage')}
                    className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${scope === 'lineage' ? 'bg-white text-slate-900 shadow-lg ring-1 ring-slate-200' : 'text-slate-400'}`}
                >
                    <Network className="w-4 h-4" />
                    My Lineage
                </button>
            </div>
            <button className="flex items-center justify-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95 shadow-lg shadow-slate-200 w-full sm:w-auto">
                <Download className="w-4 h-4" /> Export
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 sm:p-8 no-scrollbar">
        <div className="max-w-7xl mx-auto space-y-10 pb-24">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                {[
                    { label: 'Total Presence', val: latest?.totalAttendance, prev: previous?.totalAttendance, icon: Users, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { label: 'Groups Active', val: latest?.totalGroups, prev: previous?.totalGroups, icon: BarChart3, color: 'text-orange-600', bg: 'bg-orange-50' },
                    { label: 'Open Cell', val: latest?.openAttendance, prev: previous?.openAttendance, icon: TrendingUp, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Disciple Cell', val: latest?.discipleAttendance, prev: previous?.discipleAttendance, icon: Layers, color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map((kpi, i) => {
                    const growth = calculateGrowth(kpi.val || 0, kpi.prev || 0);
                    return (
                        <div key={i} className="bg-white p-5 sm:p-6 rounded-[2rem] shadow-sm border border-slate-200/60 flex flex-col justify-between transition-all hover:shadow-md">
                            <div className="flex justify-between items-start mb-4">
                                <div className={`p-2 sm:p-3 ${kpi.bg} ${kpi.color} rounded-2xl`}>
                                    <kpi.icon className="w-5 h-5" />
                                </div>
                                {growth !== 0 && (
                                    <div className={`text-[9px] sm:text-xs font-black px-2 py-1 rounded-lg ${growth > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-500'}`}>
                                        {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
                                    </div>
                                )}
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">{kpi.label}</p>
                                <h3 className="text-xl sm:text-3xl font-black text-slate-900 mt-1">{kpi.val || 0}</h3>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Hierarchical Visualization */}
            <div className="bg-white rounded-[2.5rem] sm:rounded-[3.5rem] shadow-sm border border-slate-200/60 p-6 sm:p-12 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-80 h-80 bg-slate-50 rounded-full -translate-y-1/2 translate-x-1/2 opacity-50 -z-0" />
                
                <div className="relative z-10 flex flex-col items-center">
                    <div className="text-center mb-16 animate-in fade-in zoom-in duration-700">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 text-white rounded-2xl mb-6 shadow-xl shadow-slate-200">
                            {scope === 'church' ? <Globe className="w-4 h-4 text-emerald-400" /> : <Share2 className="w-4 h-4 text-orange-400" />}
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{scope === 'church' ? 'Global Church Root' : 'Lineage Origin'}</span>
                        </div>
                        <h2 className="text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">{scope === 'church' ? 'Total Church Leaders' : 'My Descendant Count'}</h2>
                        <div className="flex items-baseline justify-center gap-4">
                            <span className="text-6xl sm:text-8xl font-black text-slate-900 tracking-tighter">{leadershipNetwork.total}</span>
                            <span className="text-xl sm:text-2xl font-black text-slate-300 uppercase">Leaders</span>
                        </div>
                    </div>

                    <div className="w-full max-w-4xl relative">
                        <div className="absolute left-1/2 -translate-x-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-slate-900 via-indigo-500 to-emerald-400 rounded-full hidden md:block opacity-10" />

                        <div className="space-y-12">
                            {leadershipNetwork.generations.length > 0 ? leadershipNetwork.generations.map((g, idx) => {
                                const ratio = (g.count / leadershipNetwork.total) * 100;
                                const isEven = idx % 2 === 0;
                                
                                return (
                                    <div key={g.gen} className={`flex flex-col md:flex-row items-center gap-6 md:gap-12 animate-in slide-in-from-bottom duration-700 ${isEven ? 'md:flex-row' : 'md:flex-row-reverse'}`} style={{ animationDelay: `${idx * 150}ms` }}>
                                        <div className="relative z-10 flex-shrink-0">
                                            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-3xl sm:rounded-[2rem] border-4 border-white shadow-2xl flex flex-col items-center justify-center transition-transform hover:scale-110 cursor-default ${idx === 0 ? 'bg-slate-900 text-white' : 'bg-white text-slate-800'}`}>
                                                <span className="text-[8px] sm:text-[10px] font-black opacity-50">GEN</span>
                                                <span className="text-xl sm:text-2xl font-black -mt-1">{g.gen}</span>
                                            </div>
                                            {idx < leadershipNetwork.generations.length - 1 && (
                                                <div className="absolute top-full left-1/2 -translate-x-1/2 h-12 flex flex-col items-center opacity-20">
                                                    <div className="w-0.5 h-full bg-slate-900" />
                                                    <ArrowDown className="w-4 h-4 -mt-1" />
                                                </div>
                                            )}
                                        </div>

                                        <div className={`flex-1 w-full bg-slate-50/50 hover:bg-white border border-slate-100 p-6 sm:p-8 rounded-[2.5rem] transition-all hover:shadow-xl group ${isEven ? 'text-left' : 'md:text-right'}`}>
                                            <div className={`flex flex-col ${isEven ? 'items-start' : 'md:items-end'} mb-4`}>
                                                <h4 className="text-base sm:text-xl font-black text-slate-800">Generation {g.gen}</h4>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-3xl font-black text-indigo-600">{g.count}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Active Leaders</span>
                                                </div>
                                            </div>
                                            <div className={`h-2.5 w-full bg-slate-200/50 rounded-full overflow-hidden flex ${!isEven ? 'justify-end' : ''}`}>
                                                <div 
                                                    className={`h-full transition-all duration-1000 ease-out rounded-full ${idx === 0 ? 'bg-slate-900' : 'bg-gradient-to-r from-indigo-500 to-emerald-400'}`} 
                                                    style={{ width: `${ratio}%` }} 
                                                />
                                            </div>
                                            <div className={`mt-6 flex items-center gap-3 ${isEven ? 'flex-row' : 'md:flex-row-reverse'}`}>
                                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.1em]">{ratio.toFixed(1)}% of scoped total</span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }) : (
                                <div className="text-center py-12 text-slate-400 font-bold uppercase tracking-widest text-xs">No leadership data for this scope</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Trends Section */}
            <div className="bg-white p-6 sm:p-10 rounded-[2.5rem] sm:rounded-[3rem] shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
                        <h3 className="text-lg font-black text-slate-800">Historical Attendance Trend</h3>
                    </div>
                    <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1 w-full sm:w-auto overflow-x-auto no-scrollbar">
                        {['3m', '6m', '1y', 'all'].map(id => (
                            <button 
                                key={id} onClick={() => setFilterRange(id as any)}
                                className={`flex-1 sm:flex-none px-5 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${filterRange === id ? 'bg-white text-slate-900 shadow-md ring-1 ring-slate-200' : 'text-slate-500'}`}
                            >
                                {id}
                            </button>
                        ))}
                    </div>
                </div>

                <div ref={chartScrollRef} className="overflow-x-auto no-scrollbar cursor-grab active:cursor-grabbing pb-6">
                    <div className="h-72 flex items-end justify-between gap-1 px-2 relative border-b border-slate-100 pb-2" style={{ minWidth: displayedStats.length > 8 ? `${displayedStats.length * 64}px` : '100%' }}>
                        {displayedStats.slice().reverse().map((s, i) => {
                            const max = Math.max(...allWeeklyStats.map(x => x.totalAttendance)) || 1;
                            const height = (s.totalAttendance / max) * 100;
                            const openRatio = (s.openAttendance / s.totalAttendance) * 100 || 0;
                            const isHovered = hoveredWeek === s.yearWeek;

                            return (
                                <div 
                                    key={i} className="flex-1 flex flex-col items-center group relative h-full"
                                    onClick={() => setHoveredWeek(isHovered ? null : s.yearWeek)}
                                    onMouseEnter={() => setHoveredWeek(s.yearWeek)} onMouseLeave={() => setHoveredWeek(null)}
                                >
                                    <div className="w-full flex flex-col justify-end bg-slate-50/80 rounded-t-2xl h-full relative overflow-hidden transition-all group-hover:bg-slate-100">
                                        <div className={`w-full transition-all absolute bottom-0 rounded-t-xl ${isHovered ? 'bg-blue-600' : 'bg-blue-500/30'}`} style={{ height: `${height}%` }}>
                                            <div className={`absolute bottom-0 w-full rounded-t-xl ${isHovered ? 'bg-orange-500' : 'bg-orange-500/40'}`} style={{ height: `${openRatio}%` }} />
                                        </div>
                                    </div>
                                    <span className={`text-[9px] font-black mt-4 transition-colors ${isHovered ? 'text-blue-600' : 'text-slate-400'} rotate-[-45deg] origin-top-left translate-x-1.5 whitespace-nowrap`}>
                                        {s.yearWeek}
                                    </span>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="mt-16 flex flex-wrap items-center justify-center gap-10">
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-orange-500/60 rounded-md" />
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Open Cell (開組)</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="w-4 h-4 bg-blue-500/30 rounded-md" />
                        <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Disciple Cell (門徒)</span>
                    </div>
                </div>
            </div>

            {/* Stats Table */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200/60 overflow-hidden">
                <div className="px-8 py-6 border-b border-slate-100 bg-slate-50/50">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Weekly Log: {scope === 'church' ? 'Global' : 'Lineage'}</h3>
                </div>
                <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/30">
                                <th className="px-8 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest">Year-Week</th>
                                <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Active Groups</th>
                                <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Open Presence</th>
                                <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Disciple Presence</th>
                                <th className="px-6 py-5 text-[9px] font-black text-slate-400 uppercase tracking-widest text-center">Total Presence</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {allWeeklyStats.map((s, idx) => (
                                <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="font-black text-slate-900 text-sm">{s.yearWeek}</div>
                                        <div className="text-[9px] font-bold text-slate-400 mt-0.5 uppercase">{s.range}</div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className="px-3 py-1 bg-slate-100 rounded-lg text-xs font-black text-slate-700">{s.totalGroups}</span>
                                    </td>
                                    <td className="px-6 py-5 text-center font-black text-orange-600 text-sm">{s.openAttendance}</td>
                                    <td className="px-6 py-5 text-center font-black text-emerald-600 text-sm">{s.discipleAttendance}</td>
                                    <td className="px-6 py-5 text-center font-black text-blue-600 text-sm">{s.totalAttendance}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
