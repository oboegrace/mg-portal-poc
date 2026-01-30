
import React from 'react';
import { X, Calendar, MapPin, Users, FileText, Clock, Globe, Target, Layers } from 'lucide-react';
import { CellGroup, CellLeader } from '../types';
import { GROUP_CATEGORY_LABELS, GROUP_CATEGORY_COLORS, ZONES } from './constants';

interface GroupDetailModalProps {
  group: CellGroup | null;
  leader: CellLeader | null;
  onClose: () => void;
}

const GroupDetailModal: React.FC<GroupDetailModalProps> = ({ group, leader, onClose }) => {
  if (!group || !leader) return null;

  const categoryColor = GROUP_CATEGORY_COLORS[group.category];
  const categoryLabel = GROUP_CATEGORY_LABELS[group.category];
  const zoneLabel = ZONES.find(z => z.code === group.pastorZoneId)?.label || group.pastorZoneId;

  // Combined name logic: "陳大文 Jason Chan"
  const fullName = `${leader.chineseName || ''} ${leader.firstName || ''} ${leader.lastName || ''}`.trim();

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-slate-50 border-b p-6 flex justify-between items-start flex-shrink-0">
            <div>
                <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold border mb-2 uppercase tracking-wider ${categoryColor}`}>
                    {categoryLabel}
                </span>
                <h2 className="text-xl font-bold text-slate-900 leading-tight">
                    {fullName}
                </h2>
                <div className="flex items-center gap-2 mt-1">
                    <p className="text-slate-500 text-xs font-mono bg-slate-200 px-1.5 py-0.5 rounded">{leader.mgCode}</p>
                    <span className="text-slate-300">•</span>
                    <p className="text-slate-500 text-xs font-bold uppercase tracking-tighter">Gen {leader.generation}</p>
                </div>
            </div>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 -mt-2 bg-white rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-all border border-slate-100 shadow-sm"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 no-scrollbar">
            <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Meets</span>
                    </div>
                    <p className="font-bold text-slate-800 text-sm">{group.groupDay.charAt(0).toUpperCase() + group.groupDay.slice(1)}s</p>
                    <p className="text-[10px] text-slate-500 mt-1 italic">{group.groupFrequency.replace('_', ' ')}</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                     <div className="flex items-center gap-2 text-slate-400 mb-1">
                        <Clock className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">Time</span>
                    </div>
                    <p className="font-bold text-slate-800 text-sm">{group.groupTime}</p>
                </div>
            </div>

            <div className="space-y-4">
                 <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
                        <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Location</p>
                        <p className="text-slate-800 font-medium text-sm">{group.groupLocation}</p>
                    </div>
                 </div>

                 <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
                        <Layers className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Pastor Zone</p>
                        <p className="text-slate-800 font-medium text-sm">{zoneLabel}</p>
                    </div>
                 </div>

                 <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
                        <Target className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Target Audience</p>
                        <p className="text-slate-800 font-medium text-sm">{group.targetAudience || 'Mixed'}</p>
                    </div>
                 </div>

                 <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
                        <Globe className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Languages</p>
                        <div className="flex flex-wrap gap-1 mt-1">
                            {group.languages.map(l => (
                                <span key={l} className="px-2 py-0.5 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-600">
                                    {l}
                                </span>
                            ))}
                        </div>
                    </div>
                 </div>

                 <div className="flex items-start gap-4">
                    <div className="p-2.5 bg-slate-100 text-slate-600 rounded-xl">
                        <Users className="w-5 h-5" />
                    </div>
                    <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Regular Scale</p>
                        <p className="text-slate-800 font-medium text-sm">{group.regularMemberRange} Members</p>
                    </div>
                 </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="bg-slate-50 p-4 border-t flex-shrink-0">
            <button 
                onClick={onClose}
                className="w-full py-3 bg-white border border-slate-200 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-all text-sm"
            >
                Close Details
            </button>
        </div>
      </div>
    </div>
  );
};

export default GroupDetailModal;
