
import React, { useState, useMemo } from 'react';
import { Check, X, Search, UserPlus, User, Users, Plus, ShieldCheck, GraduationCap, CheckCircle2, CircleDashed } from 'lucide-react';
import { CellGroup, CellMember, GuestRecord } from '../types';

interface AttendanceTrackerProps {
  group: CellGroup;
  members: CellMember[];
  initialAttendedIds: string[];
  initialGuests: GuestRecord[];
  onComplete: (attendedMemberIds: string[], guests: GuestRecord[]) => void;
  onCancel: () => void;
  onAddMember?: (member: CellMember) => void;
}

const AttendanceTracker: React.FC<AttendanceTrackerProps> = ({
  group,
  members,
  initialAttendedIds,
  initialGuests,
  onComplete,
  onCancel,
  onAddMember
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [attendedIds, setAttendedIds] = useState<string[]>(initialAttendedIds);
  const [guests, setGuests] = useState<GuestRecord[]>(initialGuests);
  const [newGuestName, setNewGuestName] = useState('');
  
  // Quick Add Member State
  const [isAddingMember, setIsAddingMember] = useState(false);
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberPhone, setNewMemberPhone] = useState('');

  const filteredMembers = useMemo(() => 
    members.filter(m => 
        m.chineseName.toLowerCase().includes(searchQuery.toLowerCase()) || 
        (m.englishName && m.englishName.toLowerCase().includes(searchQuery.toLowerCase()))
    )
  , [members, searchQuery]);

  const toggleMember = (id: string) => {
    setAttendedIds(prev => 
        prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    const allIds = filteredMembers.map(m => m.id);
    setAttendedIds(Array.from(new Set([...attendedIds, ...allIds])));
  };

  const deselectAll = () => {
    const filteredIds = new Set(filteredMembers.map(m => m.id));
    setAttendedIds(prev => prev.filter(id => !filteredIds.has(id)));
  };

  const handleQuickAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim() || !onAddMember) return;

    const newMember: CellMember = {
        id: `m-qa-${Date.now()}`,
        chineseName: newMemberName.trim(),
        phoneNumber: newMemberPhone.trim() || 'N/A',
        status: 'active',
        groupIds: [group.id],
        joinedDate: new Date().toISOString().split('T')[0]
    };

    onAddMember(newMember);
    setAttendedIds(prev => [...prev, newMember.id]);
    
    // Reset form
    setNewMemberName('');
    setNewMemberPhone('');
    setIsAddingMember(false);
  };

  const addGuest = () => {
    if (!newGuestName.trim()) return;
    const guest: GuestRecord = { id: `gst-${Date.now()}`, name: newGuestName.trim() };
    setGuests(prev => [...prev, guest]);
    setNewGuestName('');
  };

  const removeGuest = (id: string) => {
    setGuests(prev => prev.filter(g => g.id !== id));
  };

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-white animate-in slide-in-from-right duration-300">
      {/* Header */}
      <div className="px-6 py-4 bg-white border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
              <button onClick={onCancel} className="p-2 -ml-2 hover:bg-slate-50 rounded-full text-slate-500">
                  <X className="w-6 h-6" />
              </button>
              <div>
                  <h3 className="font-black text-lg text-slate-900 leading-tight">Detailed Attendance</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{group.groupName}</p>
              </div>
          </div>
          <button 
            onClick={() => onComplete(attendedIds, guests)}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-black text-sm shadow-lg active:scale-95 transition-all"
          >
              Done ({attendedIds.length + guests.length + 1})
          </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar bg-slate-50/50">
          <div className="max-w-xl mx-auto p-6 space-y-8">
              
              {/* Search & Bulk Toggle */}
              <div className="space-y-4">
                  <div className="relative">
                      <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Search group members..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-sm shadow-sm"
                      />
                  </div>
                  
                  <div className="flex gap-2">
                      <button 
                        onClick={selectAll}
                        className="flex-1 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-black uppercase text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 transition-all"
                      >
                          <CheckCircle2 className="w-3.5 h-3.5" /> Select All
                      </button>
                      <button 
                        onClick={deselectAll}
                        className="flex-1 py-2 bg-white border border-slate-200 rounded-xl text-[11px] font-black uppercase text-slate-600 hover:bg-slate-50 flex items-center justify-center gap-2 transition-all"
                      >
                          <CircleDashed className="w-3.5 h-3.5" /> Deselect All
                      </button>
                  </div>
              </div>

              {/* Quick Add Member Section */}
              <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-1 overflow-hidden">
                {!isAddingMember ? (
                    <button 
                        onClick={() => setIsAddingMember(true)}
                        className="w-full p-4 flex items-center justify-center gap-2 text-indigo-600 font-black text-sm hover:bg-indigo-50 transition-all"
                    >
                        <UserPlus className="w-4 h-4" /> Add New Official Member
                    </button>
                ) : (
                    <div className="p-5 animate-in slide-in-from-top-4 duration-300">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Register New Member</h4>
                            <button onClick={() => setIsAddingMember(false)}><X className="w-4 h-4 text-slate-400" /></button>
                        </div>
                        <form onSubmit={handleQuickAddMember} className="space-y-4">
                            <div className="grid grid-cols-2 gap-3">
                                <input 
                                    required
                                    type="text" 
                                    placeholder="Full Name" 
                                    value={newMemberName}
                                    onChange={(e) => setNewMemberName(e.target.value)}
                                    className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10"
                                />
                                <input 
                                    type="tel" 
                                    placeholder="Phone (Optional)" 
                                    value={newMemberPhone}
                                    onChange={(e) => setNewMemberPhone(e.target.value)}
                                    className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-sm font-bold outline-none focus:ring-4 focus:ring-indigo-500/10"
                                />
                            </div>
                            <button 
                                type="submit"
                                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100 active:scale-[0.98] transition-all"
                            >
                                Register & Check
                            </button>
                        </form>
                    </div>
                )}
              </div>

              {/* Members List */}
              <div className="space-y-3">
                  <div className="flex items-center justify-between px-2">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Attendance List ({filteredMembers.length})</h4>
                      <span className="text-[10px] font-bold text-blue-600 uppercase">{attendedIds.length} Checked</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                      {filteredMembers.map(member => {
                          const isTicked = attendedIds.includes(member.id);
                          const isLeaderMember = (member as any).isLeader;
                          
                          return (
                              <button 
                                key={member.id}
                                onClick={() => toggleMember(member.id)}
                                className={`flex items-center gap-4 p-4 rounded-2xl border transition-all text-left group ${isTicked ? 'bg-blue-600 border-blue-600 shadow-lg shadow-blue-100' : 'bg-white border-slate-100 hover:border-blue-300'}`}
                              >
                                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold transition-colors ${isTicked ? 'bg-white/20 text-white' : isLeaderMember ? 'bg-indigo-50 text-indigo-500 border border-indigo-100' : 'bg-slate-100 text-slate-400'}`}>
                                      {isLeaderMember ? <GraduationCap className="w-5 h-5" /> : member.chineseName.charAt(0)}
                                  </div>
                                  <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                          <div className={`font-black text-sm ${isTicked ? 'text-white' : 'text-slate-900'}`}>{member.chineseName}</div>
                                          {isLeaderMember && (
                                              <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase ${isTicked ? 'bg-white/20 text-white' : 'bg-indigo-600 text-white'}`}>Leader</span>
                                          )}
                                      </div>
                                      {member.englishName && <div className={`text-[10px] font-bold ${isTicked ? 'text-white/70' : 'text-slate-400'}`}>{member.englishName}</div>}
                                  </div>
                                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isTicked ? 'bg-white border-white text-blue-600 scale-110' : 'bg-white border-slate-200 text-transparent'}`}>
                                      <Check className="w-4 h-4 stroke-[3]" />
                                  </div>
                              </button>
                          );
                      })}
                      {filteredMembers.length === 0 && (
                          <div className="py-12 text-center bg-white rounded-3xl border border-dashed border-slate-200">
                               <Users className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                               <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No members found</p>
                          </div>
                      )}
                  </div>
              </div>

              {/* Guests List */}
              <div className="space-y-4 pt-6">
                  <div className="flex items-center justify-between px-2">
                      <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Guests (New Visitors)</h4>
                      <span className="text-[10px] font-bold text-emerald-600 uppercase">{guests.length} Added</span>
                  </div>
                  
                  {guests.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-4">
                          {guests.map(guest => (
                              <div key={guest.id} className="flex items-center gap-2 pl-4 pr-2 py-2 bg-emerald-50 text-emerald-700 rounded-full border border-emerald-100 text-xs font-black animate-in zoom-in">
                                  {guest.name}
                                  <button onClick={() => removeGuest(guest.id)} className="p-1 hover:bg-emerald-200 rounded-full transition-colors">
                                      <X className="w-3 h-3" />
                                  </button>
                              </div>
                          ))}
                      </div>
                  )}

                  <div className="flex gap-2">
                      <div className="relative flex-1">
                          <Plus className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                          <input 
                            type="text" 
                            placeholder="Guest name..." 
                            value={newGuestName}
                            onChange={(e) => setNewGuestName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && addGuest()}
                            className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all font-medium text-sm shadow-sm"
                          />
                      </div>
                      <button 
                        onClick={addGuest}
                        disabled={!newGuestName.trim()}
                        className="px-6 bg-emerald-600 text-white rounded-2xl font-black text-sm disabled:opacity-50 transition-all active:scale-95 shadow-lg shadow-emerald-100"
                      >
                          Add Guest
                      </button>
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

export default AttendanceTracker;
