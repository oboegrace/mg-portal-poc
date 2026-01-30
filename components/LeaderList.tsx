
import React, { useMemo } from 'react';
import { Search, Filter, Users } from 'lucide-react';
import { CellLeader, FilterState } from '../types';

interface LeaderListProps {
  leaders: CellLeader[];
  currentUser: CellLeader;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  filters: FilterState;
  onOpenFilter: () => void;
  selectedLeaderId: string | null;
  onSelectLeader: (leader: CellLeader) => void;
}

const LeaderList: React.FC<LeaderListProps> = ({
  leaders,
  currentUser,
  searchQuery,
  setSearchQuery,
  filters,
  onOpenFilter,
  selectedLeaderId,
  onSelectLeader
}) => {
  
  const filteredLeaders = useMemo(() => {
    // 1. Get only descendants (starts with currentUser.mgCode but is longer)
    let descendants = leaders.filter(leader => 
        leader.mgCode.startsWith(currentUser.mgCode) && 
        leader.mgCode.length > currentUser.mgCode.length
    );

    // 2. Apply search and filters
    return descendants.filter(leader => {
      const fullName = `${leader.chineseName || ''} ${leader.firstName || ''} ${leader.lastName || ''}`.toLowerCase();
      const matchesSearch = 
        fullName.includes(searchQuery.toLowerCase()) || 
        leader.mgCode.toLowerCase().includes(searchQuery.toLowerCase());

      if (!matchesSearch) return false;
      if (filters.generations.length > 0 && !filters.generations.includes(leader.generation)) return false;
      
      if (filters.zones.length > 0) {
        const hasZoneGroup = leader.groups.some(g => filters.zones.includes(g.pastorZoneId));
        if (!hasZoneGroup) return false;
      }

      if (filters.days.length > 0) {
        if (!leader.groups.some(g => filters.days.includes(g.groupDay))) return false;
      }
      return true;
    }).sort((a, b) => a.mgCode.localeCompare(b.mgCode)); // Alphanumeric sort handles hierarchy
  }, [currentUser.mgCode, searchQuery, filters, leaders]);

  const activeFilterCount = filters.generations.length + filters.zones.length + filters.days.length;

  return (
    <div className="flex flex-col h-full bg-white border-r border-slate-200">
      <div className="p-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-2 mb-4">
            <Users className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-slate-800">Descendants</h2>
        </div>
        
        <div className="flex items-center gap-2">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    type="text" 
                    placeholder="Search downline..." 
                    className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
            <button 
                onClick={onOpenFilter}
                className={`p-2.5 rounded-xl border transition-all relative ${activeFilterCount > 0 ? 'text-blue-600 bg-blue-50 border-blue-200' : 'text-slate-500 bg-white border-slate-200 hover:bg-slate-50'}`}
            >
                <Filter className="w-5 h-5" />
                {activeFilterCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-blue-600 rounded-full border-2 border-white" />
                )}
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar">
        {filteredLeaders.length > 0 ? (
            filteredLeaders.map((leader) => {
                const primaryGroup = leader.groups.filter(g => !g.isDeleted)[0];
                const isSelected = selectedLeaderId === leader.mgCode;
                
                const displayName = `${leader.chineseName || ''} ${leader.firstName || ''} ${leader.lastName || ''}`.trim();
                const avatarChar = leader.chineseName?.charAt(0) || leader.firstName?.charAt(0) || '?';
                
                return (
                    <div 
                        key={leader.id}
                        onClick={() => onSelectLeader(leader)}
                        className={`
                            p-4 flex gap-4 border-b border-slate-50 cursor-pointer transition-all hover:bg-slate-50
                            ${isSelected ? 'bg-blue-50/50 border-l-4 border-l-orange-500' : 'border-l-4 border-l-transparent'}
                        `}
                    >
                        <div className="w-12 h-12 flex-shrink-0 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-bold text-lg border border-slate-200 shadow-sm">
                            {avatarChar}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start mb-1">
                                <h3 className="font-bold text-slate-900 text-sm truncate">{displayName}</h3>
                                <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                                    {leader.mgCode}
                                </span>
                            </div>
                            
                            <div className="flex flex-wrap gap-1.5 mt-2">
                                {primaryGroup ? (
                                    <>
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-blue-50 text-blue-700 uppercase tracking-tight">
                                            {primaryGroup.groupDay.slice(0,3)} • {primaryGroup.groupTime}
                                        </span>
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-white uppercase tracking-tight">
                                            {primaryGroup.pastorZoneId}
                                        </span>
                                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-100">
                                            GEN {leader.generation}
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-[10px] text-slate-400 italic">No active groups</span>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })
        ) : (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center text-slate-400">
                <Users className="w-12 h-12 mb-4 opacity-20" />
                <p className="text-sm font-medium">No descendants found matching your search.</p>
            </div>
        )}
      </div>
      
      <div className="p-4 bg-slate-50 border-t border-slate-100 text-xs text-slate-500 font-medium flex justify-between">
          <span>Total Records</span>
          <span className="bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">{filteredLeaders.length}</span>
      </div>
    </div>
  );
};

export default LeaderList;
