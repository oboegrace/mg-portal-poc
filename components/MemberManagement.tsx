
import React, { useState, useMemo, useRef } from 'react';
import { 
    Search, UserPlus, Phone, Cake, QrCode, Edit2, Trash2, X, Check, 
    ChevronDown, User, Contact, ShieldAlert, Heart, Calendar, ArrowRight,
    Smartphone, MessageSquare, ExternalLink, Filter, Grid, List
} from 'lucide-react';
import { CellLeader, CellMember, CellGroup } from '../types';
import { GROUP_CATEGORY_COLORS, GROUP_CATEGORY_LABELS } from './constants';

interface MemberManagementProps {
  currentUser: CellLeader;
  members: CellMember[];
  onAddMember: (m: CellMember) => void;
  onUpdateMember: (m: CellMember) => void;
  onDeleteMember: (id: string) => void;
}

const MemberManagement: React.FC<MemberManagementProps> = ({
  currentUser,
  members,
  onAddMember,
  onUpdateMember,
  onDeleteMember
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<CellMember | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredMembers = useMemo(() => 
    members.filter(m => 
        m.chineseName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (m.englishName && m.englishName.toLowerCase().includes(searchQuery.toLowerCase())) ||
        m.phoneNumber.includes(searchQuery)
    ).sort((a, b) => a.chineseName.localeCompare(b.chineseName))
  , [members, searchQuery]);

  const handleEdit = (m: CellMember) => {
    setEditingMember({ ...m });
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    const newMember: CellMember = {
        id: `m-${Date.now()}`,
        chineseName: '',
        englishName: '',
        phoneNumber: '',
        birthday: '',
        memberId: '',
        status: 'active',
        groupIds: currentUser.groups.length > 0 ? [currentUser.groups[0].id] : [],
        joinedDate: new Date().toISOString().split('T')[0]
    };
    // Fix: Changed newLeader to newMember to fix the reference error.
    setEditingMember(newMember);
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (!editingMember || !editingMember.chineseName || !editingMember.phoneNumber) return;
    const exists = members.some(m => m.id === editingMember.id);
    if (exists) onUpdateMember(editingMember);
    else onAddMember(editingMember);
    setIsFormOpen(false);
    setEditingMember(null);
  };

  const toggleGroupSelection = (groupId: string) => {
    if (!editingMember) return;
    const current = editingMember.groupIds;
    const updated = current.includes(groupId) 
        ? current.filter(id => id !== groupId) 
        : [...current, groupId];
    setEditingMember({ ...editingMember, groupIds: updated });
  };

  const SectionTitle = ({ title }: { title: string }) => (
      <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 mt-6 first:mt-0">{title}</h3>
  );

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-50 overflow-hidden animate-in fade-in duration-500">
      {/* Header */}
      <div className="bg-white px-8 py-6 border-b border-slate-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 no-print">
          <div>
              <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                  <Contact className="w-7 h-7 text-indigo-600" />
                  Member Directory
              </h1>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Nurturing your cell family</p>
          </div>
          <div className="flex items-center gap-3 w-full lg:w-auto">
              <button 
                onClick={() => setIsQrModalOpen(true)}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
              >
                  <QrCode className="w-4 h-4" /> Invite via QR
              </button>
              <button 
                onClick={handleAddNew}
                className="flex-1 lg:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[11px] uppercase tracking-widest hover:bg-indigo-700 transition-all active:scale-95 shadow-lg shadow-indigo-100"
              >
                  <UserPlus className="w-4 h-4" /> Add Manually
              </button>
          </div>
      </div>

      <div className="p-6 sm:p-8 flex-1 overflow-y-auto no-scrollbar">
          <div className="max-w-7xl mx-auto space-y-8">
              {/* Toolbar */}
              <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="relative w-full sm:w-96">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Find member by name or phone..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 transition-all outline-none"
                      />
                  </div>
                  <div className="flex items-center gap-2 bg-slate-200/50 p-1 rounded-xl">
                      <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-all ${viewMode === 'grid' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><Grid className="w-4 h-4" /></button>
                      <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-all ${viewMode === 'list' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}><List className="w-4 h-4" /></button>
                  </div>
              </div>

              {/* Grid View */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredMembers.map(member => (
                        <div key={member.id} className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200/60 hover:shadow-xl transition-all group relative overflow-hidden">
                            <div className="flex items-start gap-4 mb-6">
                                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center font-black text-xl border border-indigo-100 shadow-inner">
                                    {member.chineseName.charAt(0)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-slate-900 text-lg leading-tight truncate">{member.chineseName}</h4>
                                    <p className="text-xs font-bold text-slate-400 uppercase tracking-tight">{member.englishName || 'No English Name'}</p>
                                </div>
                                <div className="flex flex-col gap-1">
                                    <button onClick={() => handleEdit(member)} className="p-2 text-slate-300 hover:text-indigo-600 transition-colors"><Edit2 className="w-4 h-4" /></button>
                                </div>
                            </div>

                            <div className="space-y-3 mb-6">
                                <div className="flex items-center gap-3 text-slate-500">
                                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center"><Phone className="w-3.5 h-3.5" /></div>
                                    <span className="text-xs font-bold">{member.phoneNumber}</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-500">
                                    <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center"><Cake className="w-3.5 h-3.5" /></div>
                                    <span className="text-xs font-bold">{member.birthday || 'No DOB'}</span>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-1.5 border-t border-slate-50 pt-4">
                                {member.groupIds.map(gid => {
                                    const g = currentUser.groups.find(x => x.id === gid);
                                    if (!g) return null;
                                    return (
                                        <span key={gid} className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-tight border ${GROUP_CATEGORY_COLORS[g.category]}`}>
                                            {g.category === 'open_cell' ? 'O' : 'D'} {g.nameSuffix || ''}
                                        </span>
                                    );
                                })}
                            </div>

                            <div className="absolute bottom-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <a href={`tel:${member.phoneNumber}`} className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all shadow-sm"><Phone className="w-4 h-4" /></a>
                                <button onClick={() => window.open(`https://wa.me/852${member.phoneNumber}`, '_blank')} className="p-2.5 bg-[#25D366]/10 text-[#25D366] rounded-xl hover:bg-[#25D366] hover:text-white transition-all shadow-sm"><MessageSquare className="w-4 h-4 fill-current" /></button>
                            </div>
                        </div>
                    ))}
                    {filteredMembers.length === 0 && (
                        <div className="col-span-full py-32 text-center">
                            <Smartphone className="w-16 h-16 text-slate-100 mx-auto mb-4" />
                            <p className="text-sm font-bold text-slate-300 uppercase tracking-[0.2em]">No members found matching your search</p>
                        </div>
                    )}
                </div>
              ) : (
                /* List View - Table Style */
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 overflow-hidden">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                                <th className="px-8 py-5">Member Name</th>
                                <th className="px-6 py-5">Contact</th>
                                <th className="px-6 py-5">Birthday</th>
                                <th className="px-6 py-5">Assigned Groups</th>
                                <th className="px-8 py-5 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {filteredMembers.map(member => (
                                <tr key={member.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-8 py-4">
                                        <div className="font-black text-slate-900 text-sm leading-none mb-1">{member.chineseName}</div>
                                        <div className="text-[10px] font-bold text-slate-400 uppercase">{member.englishName || member.memberId}</div>
                                    </td>
                                    <td className="px-6 py-4 font-bold text-slate-600 text-xs">{member.phoneNumber}</td>
                                    <td className="px-6 py-4 font-bold text-slate-400 text-xs">{member.birthday || '--'}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-1.5">
                                            {member.groupIds.map(gid => (
                                                <div key={gid} className="w-2 h-2 rounded-full bg-indigo-500" title={currentUser.groups.find(x => x.id === gid)?.groupName} />
                                            ))}
                                        </div>
                                    </td>
                                    <td className="px-8 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => handleEdit(member)} className="p-2 text-slate-400 hover:text-indigo-600 transition-all"><Edit2 className="w-4 h-4" /></button>
                                            <button onClick={() => onDeleteMember(member.id)} className="p-2 text-slate-400 hover:text-red-600 transition-all"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
              )}
          </div>
      </div>

      {/* Manual Form Modal */}
      {isFormOpen && editingMember && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsFormOpen(false)} />
              <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
                  <div className="p-8 border-b flex justify-between items-center bg-white sticky top-0 z-10">
                      <div>
                          <h2 className="text-2xl font-black text-slate-900 tracking-tight">{members.some(m => m.id === editingMember.id) ? 'Edit Member' : 'Register New Member'}</h2>
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Manual administrative entry</p>
                      </div>
                      <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X className="w-6 h-6" /></button>
                  </div>

                  <div className="p-10 overflow-y-auto max-h-[70vh] no-scrollbar">
                      <div className="space-y-10">
                        <div>
                            <SectionTitle title="1. Personal Identification" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chinese Name *</label>
                                    <input type="text" value={editingMember.chineseName} onChange={(e) => setEditingMember({...editingMember, chineseName: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/10" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">English Name</label>
                                    <input type="text" value={editingMember.englishName} onChange={(e) => setEditingMember({...editingMember, englishName: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/10" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Mobile Phone *</label>
                                    <input type="tel" value={editingMember.phoneNumber} onChange={(e) => setEditingMember({...editingMember, phoneNumber: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/10" />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Birthday</label>
                                    <input type="date" value={editingMember.birthday} onChange={(e) => setEditingMember({...editingMember, birthday: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/10" />
                                </div>
                                <div className="space-y-1.5 sm:col-span-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Member ID (Optional)</label>
                                    <input type="text" value={editingMember.memberId} onChange={(e) => setEditingMember({...editingMember, memberId: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-sm outline-none focus:ring-4 focus:ring-indigo-500/10" />
                                </div>
                            </div>
                        </div>

                        <div>
                            <SectionTitle title="2. Group Assignment" />
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {currentUser.groups.map(group => {
                                    const isSelected = editingMember.groupIds.includes(group.id);
                                    return (
                                        <button 
                                            key={group.id} 
                                            onClick={() => toggleGroupSelection(group.id)}
                                            className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${isSelected ? 'bg-indigo-50 border-indigo-600' : 'bg-white border-slate-200 hover:border-indigo-300'}`}
                                        >
                                            <div>
                                                <div className="text-[10px] font-black uppercase text-slate-400 leading-tight">{GROUP_CATEGORY_LABELS[group.category]}</div>
                                                <div className="font-bold text-sm text-slate-800">{group.nameSuffix || 'No Suffix'}</div>
                                            </div>
                                            {isSelected && <Check className="w-5 h-5 text-indigo-600 stroke-[3]" />}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                      </div>
                  </div>

                  <div className="p-8 border-t bg-slate-50/50 flex justify-end gap-3">
                      <button onClick={() => setIsFormOpen(false)} className="px-8 py-3 text-slate-500 font-bold text-sm">Cancel</button>
                      <button onClick={handleSave} className="px-10 py-3 bg-indigo-600 text-white rounded-xl font-black text-sm shadow-xl shadow-indigo-100 transition-all active:scale-95">Save Member</button>
                  </div>
              </div>
          </div>
      )}

      {/* QR Invite Modal */}
      {isQrModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsQrModalOpen(false)} />
              <div className="relative bg-white w-full max-w-sm rounded-[3rem] shadow-2xl p-10 text-center animate-in zoom-in-95">
                  <div className="mb-10">
                      <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-4">
                          <QrCode className="w-8 h-8" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-900">Member Invite</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-2">Let your sheep register themselves</p>
                  </div>

                  {/* QR Mockup */}
                  <div className="bg-slate-50 p-8 rounded-[2.5rem] border-2 border-dashed border-indigo-100 mb-10 flex items-center justify-center aspect-square shadow-inner">
                      <div className="w-full h-full border-[12px] border-slate-900 rounded-lg relative flex items-center justify-center">
                          {/* QR Lines Mockup */}
                          <div className="grid grid-cols-5 grid-rows-5 gap-2 w-full p-4 opacity-10">
                                {[...Array(25)].map((_,i) => <div key={i} className="bg-slate-900 rounded-sm" />)}
                          </div>
                          <QrCode className="w-24 h-24 text-slate-900 absolute" />
                      </div>
                  </div>

                  <div className="space-y-3">
                      <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all">
                          <ExternalLink className="w-4 h-4" /> Copy Link
                      </button>
                      <button onClick={() => setIsQrModalOpen(false)} className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase tracking-widest">Close</button>
                  </div>

                  <p className="mt-8 text-[9px] font-bold text-slate-300 uppercase tracking-widest leading-relaxed">
                      Scanning will open the self-registration form.<br/>Verified entries will appear in your directory automatically.
                  </p>
              </div>
          </div>
      )}
    </div>
  );
};

export default MemberManagement;
