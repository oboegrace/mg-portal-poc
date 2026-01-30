
import React from 'react';
import { Plus, ChevronRight, Settings } from 'lucide-react';
import { CellLeader, CellGroup, GroupCategory } from '../types';
import { GROUP_CATEGORY_COLORS, GROUP_CATEGORY_LABELS } from './constants';

interface GroupSelectorProps {
  leader: CellLeader;
  onSelectGroup: (group: CellGroup) => void;
  onCreateNew: () => void;
}

const GroupSelector: React.FC<GroupSelectorProps> = ({ leader, onSelectGroup, onCreateNew }) => {
  // Only show formal groups that need configuration (Open and Disciple)
  const activeFormalGroups = leader.groups.filter(g => 
    !g.isDeleted && (g.category === 'open_cell' || g.category === 'disciple_cell')
  );

  const getCategoryShortCode = (category: GroupCategory) => {
    switch (category) {
        case 'open_cell': return 'O';
        case 'disciple_cell': return 'D';
        case 'pre_cell': return 'P';
        case 'relationship': return 'R';
        default: return '?';
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 p-6 overflow-y-auto animate-in fade-in duration-300">
      <div className="max-w-2xl mx-auto w-full">
          <div className="mb-8 text-center">
              <div className="w-16 h-16 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 text-slate-400">
                  <Settings className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-bold text-slate-800">Cell Group Settings</h1>
              <p className="text-slate-500 mt-2 font-medium">Select a formal group to configure or create a new one.</p>
          </div>

          <div className="space-y-4">
              {activeFormalGroups.length > 0 && (
                  <div className="space-y-3">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Configured Groups</h4>
                      {activeFormalGroups.map(group => (
                          <button
                              key={group.id}
                              onClick={() => onSelectGroup(group)}
                              className="w-full bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all group text-left flex items-center justify-between"
                          >
                              <div>
                                  <div className="flex items-center gap-2 mb-2">
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${GROUP_CATEGORY_COLORS[group.category]}`}>
                                          {getCategoryShortCode(group.category)}
                                      </span>
                                      <span className="font-bold text-slate-900">
                                          {leader.mgCode} - {GROUP_CATEGORY_LABELS[group.category]} {group.nameSuffix ? `- ${group.nameSuffix}` : ''}
                                      </span>
                                  </div>
                                  <p className="text-sm text-slate-500 uppercase font-bold tracking-tight">
                                      {group.groupDay.slice(0, 3)}s at {group.groupTime} • {group.groupLocation}
                                  </p>
                              </div>
                              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-blue-500" />
                          </button>
                      ))}
                  </div>
              )}

              <div className="pt-4 space-y-3">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Ministry Actions</h4>
                  <button
                      onClick={onCreateNew}
                      className="w-full bg-white border-2 border-dashed border-slate-300 p-5 rounded-2xl flex items-center justify-center gap-2 text-slate-500 hover:text-blue-600 hover:border-blue-400 hover:bg-blue-50/50 transition-all group"
                  >
                      <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-blue-200 group-hover:text-blue-700 transition-colors">
                          <Plus className="w-5 h-5" />
                      </div>
                      <span className="font-bold">Create New Cell Group</span>
                  </button>
              </div>
          </div>
      </div>
    </div>
  );
};

export default GroupSelector;
