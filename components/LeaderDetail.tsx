
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { ArrowLeft, Plus, Calendar, X, ChevronRight, Check, ChevronDown, Info, Trash2, AlertTriangle, Zap, UserPlus, Users, Heart, Target, Settings, Clock, MapPin, UserCheck, Sliders, Sparkles } from 'lucide-react';
import { CellLeader, CellGroup, Report, GroupCategory, DayOfWeek, CellMember, GuestRecord } from '../types';
import { GROUP_CATEGORY_COLORS, GROUP_CATEGORY_LABELS, DAYS, ZONES } from './constants';
import GroupDetailModal from './GroupDetailModal';
import AttendanceTracker from './AttendanceTracker';

interface LeaderDetailProps {
  leader: CellLeader | null;
  onBack?: () => void;
  canEdit?: boolean;
  showMobileBack?: boolean;
  onAddReport?: (groupId: string, report: Report) => void;
  onUpdateReport?: (groupId: string, reportId: string, report: Report) => void;
  onDeleteReport?: (groupId: string, reportId: string) => void;
  onAddGroup?: (group: CellGroup) => void;
  onRedirectToSettings?: (category: GroupCategory) => void; 
  onEditGroupSettings?: (group: CellGroup) => void; 
  onOpenSettingsList?: () => void; 
  allMembers?: CellMember[];
  allLeaders?: CellLeader[];
  onAddMember?: (member: CellMember) => void;
}

const ACTIVE_TAB_STYLES: Record<string, string> = {
  disciple_cell: 'bg-emerald-600 text-white shadow-emerald-200',
  open_cell: 'bg-orange-600 text-white shadow-orange-200',
  pre_cell: 'bg-cyan-600 text-white shadow-cyan-200',
  relationship: 'bg-rose-600 text-white shadow-rose-200',
  all: 'bg-slate-800 text-white shadow-slate-200'
};

const LeaderDetail: React.FC<LeaderDetailProps> = ({ 
  leader, 
  onBack, 
  canEdit = false,
  showMobileBack = true,
  onAddReport,
  onUpdateReport,
  onDeleteReport,
  onAddGroup,
  onRedirectToSettings,
  onEditGroupSettings,
  onOpenSettingsList,
  allMembers = [],
  allLeaders = [],
  onAddMember
}) => {
  const [activeTabId, setActiveTabId] = useState<string>('all');
  
  const [isGroupSelectorOpen, setIsGroupSelectorOpen] = useState(false);
  const [isReportFormOpen, setIsReportFormOpen] = useState(false);
  const [isAttendanceTrackerOpen, setIsAttendanceTrackerOpen] = useState(false);
  const [isInfoModalOpen, setIsInfoModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedGroupIdForReport, setSelectedGroupIdForReport] = useState<string>('');
  const [selectedGroupIdForInfo, setSelectedGroupIdForInfo] = useState<string>('');
  const [editingReportId, setEditingReportId] = useState<string | null>(null);

  // Form State
  const [gatheringDate, setGatheringDate] = useState('');
  const [gatheringTime, setGatheringTime] = useState('');
  const [attendanceCount, setAttendanceCount] = useState('');
  const [notes, setNotes] = useState('');
  const [attendedMemberIds, setAttendedMemberIds] = useState<string[]>([]);
  const [guests, setGuests] = useState<GuestRecord[]>([]);

  const attendanceInputRef = useRef<HTMLInputElement>(null);

  const groups = useMemo(() => leader?.groups.filter(g => !g.isDeleted) || [], [leader]);

  // Role Checks
  const isCellLeader = leader?.roles.includes('小組長') || leader?.roles.includes('族長');
  const isCaringLeader = leader?.roles.includes('關懷小組長');

  // Provisioning Lists
  const availableCategories = useMemo(() => {
    if (isCellLeader) return ['pre_cell', 'open_cell', 'relationship', 'disciple_cell'] as GroupCategory[];
    if (isCaringLeader) return ['pre_cell', 'open_cell'] as GroupCategory[];
    return [] as GroupCategory[];
  }, [isCellLeader, isCaringLeader]);

  const effectiveMembers = useMemo(() => {
    const currentGroup = groups.find(g => g.id === selectedGroupIdForReport);
    if (!currentGroup || !leader) return allMembers;

    let baseList = allMembers.filter(m => m.groupIds.includes(currentGroup.id));

    if (currentGroup.category === 'disciple_cell') {
        const descendants = allLeaders.filter(l => 
            l.parentLeaderId === leader.id && 
            (l.roles.includes('小組長') || l.roles.includes('同工'))
        );

        const mappedLeaders: CellMember[] = descendants.map(d => ({
            id: d.id,
            chineseName: d.chineseName || '',
            englishName: d.firstName || '',
            phoneNumber: d.phoneNumber,
            status: 'active',
            groupIds: [currentGroup.id],
            joinedDate: d.ordinationDate || '',
            isLeader: true 
        } as any));

        const existingIds = new Set(baseList.map(m => m.id));
        const uniqueLeaders = mappedLeaders.filter(l => !existingIds.has(l.id));
        return [...baseList, ...uniqueLeaders];
    }
    return baseList;
  }, [allMembers, allLeaders, leader, selectedGroupIdForReport, groups]);

  const displayedReports = useMemo(() => {
    let reports = activeTabId === 'all' 
      ? groups.flatMap(g => g.reports.map(r => ({ ...r, groupId: g.id, groupCategory: g.category })))
      : groups.find(g => g.id === activeTabId)?.reports.map(r => ({ ...r, groupId: activeTabId, groupCategory: groups.find(g => g.id === activeTabId)?.category || 'open_cell' })) || [];

    return [...reports].sort((a, b) => b.gatheringDate.localeCompare(a.gatheringDate));
  }, [activeTabId, groups]);

  useEffect(() => {
    if (activeTabId !== 'all' && !groups.some(g => g.id === activeTabId)) {
        setActiveTabId('all');
    }
  }, [groups, activeTabId]);

  useEffect(() => {
    if (isReportFormOpen && !editingReportId) {
        const group = groups.find(g => g.id === selectedGroupIdForReport);
        if (group) {
            const sorted = [...group.reports].sort((a, b) => b.gatheringDate.localeCompare(a.gatheringDate));
            const last = sorted[0];
            if (last) {
                const [y, m, d] = last.gatheringDate.split('-').map(Number);
                const date = new Date(y, m - 1, d);
                date.setDate(date.getDate() + (group.groupFrequency === 'every_week' ? 7 : 14));
                setGatheringDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
                setGatheringTime(last.gatheringTime || group.groupTime);
            } else {
                setGatheringDate(new Date().toISOString().split('T')[0]);
                setGatheringTime(group.groupTime);
            }
        }
    }
  }, [isReportFormOpen, selectedGroupIdForReport, groups, editingReportId]);

  const handleQuickGroupAdd = (category: GroupCategory) => {
    if (!leader || !onAddGroup) return;
    const newGroup: CellGroup = {
        id: `q-${category}-${Date.now()}`,
        groupName: `${leader.mgCode} - ${GROUP_CATEGORY_LABELS[category]}`,
        tribeCode: leader.tribeCode,
        category: category,
        groupDay: 'saturday',
        groupTime: '14:00',
        groupLocation: 'TBD',
        maxCapacity: 12,
        currentMemberCount: 0,
        groupFrequency: 'every_week',
        pastorZoneId: ZONES[0].code,
        targetAudience: 'Mixed',
        languages: ['Cantonese'],
        service: 'Sunday Service',
        regularMemberRange: '4-6',
        ageRanges: [],
        reports: []
    };
    onAddGroup(newGroup);
    openReportForm(newGroup.id);
  };

  const openReportForm = (groupId: string) => {
      setSelectedGroupIdForReport(groupId);
      setEditingReportId(null);
      setAttendanceCount('');
      setNotes('');
      setAttendedMemberIds([]);
      setGuests([]);
      setIsGroupSelectorOpen(false);
      setIsReportFormOpen(true);
  };

  const handleEditReport = (report: any) => {
      if (!canEdit) return;
      setSelectedGroupIdForReport(report.groupId);
      setEditingReportId(report.id);
      setGatheringDate(report.gatheringDate);
      setGatheringTime(report.gatheringTime || '19:30');
      setAttendanceCount(report.attendanceCount.toString());
      setNotes(report.notes === '-' ? '' : report.notes);
      setAttendedMemberIds(report.attendedMemberIds || []);
      setGuests(report.guests || []);
      setIsReportFormOpen(true);
  };

  const handleSaveReport = () => {
      const currentGroup = groups.find(g => g.id === selectedGroupIdForReport);
      if (!currentGroup) return;
      const reportData: Report = {
          id: editingReportId || `rep-${Date.now()}`,
          gatheringDate,
          gatheringTime,
          attendanceCount: parseInt(attendanceCount) || 0,
          newVisitorCount: 0,
          category: currentGroup.category,
          notes: notes || '-',
          attendedMemberIds,
          guests
      };

      if (editingReportId) onUpdateReport?.(currentGroup.id, editingReportId, reportData);
      else onAddReport?.(currentGroup.id, reportData);
      setIsReportFormOpen(false);
  };

  const handleAttendanceTrackComplete = (memberIds: string[], guestList: GuestRecord[]) => {
    setAttendedMemberIds(memberIds);
    setGuests(guestList);
    setAttendanceCount((memberIds.length + guestList.length + 1).toString());
    setIsAttendanceTrackerOpen(false);
  };

  const fullName = `${leader.chineseName || ''} ${leader.firstName || ''} ${leader.lastName || ''}`.trim();

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-50 relative overflow-hidden animate-in fade-in duration-300">
      
      <div className="flex-1 overflow-y-auto pb-24">
        <div className="bg-white px-6 py-6 border-b border-slate-100 flex justify-between items-center">
             <div className="flex items-center gap-4">
                {showMobileBack && onBack && (
                    <button onClick={onBack} className="lg:hidden p-2 -ml-2 text-slate-600 hover:bg-slate-50 rounded-full">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                )}
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">{leader.mgCode} - {fullName}</h1>
                </div>
            </div>
            {canEdit && (
                <button onClick={() => onOpenSettingsList?.()} className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold text-sm transition-all active:scale-95 border border-slate-200 shadow-sm">
                    <Sliders className="w-4 h-4" />
                    <span className="hidden sm:inline">Manage Groups</span>
                </button>
            )}
        </div>

        {groups.length > 0 && (
            <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-slate-200 shadow-sm">
                <div className="flex overflow-x-auto no-scrollbar py-3 px-4 gap-3">
                    <button onClick={() => setActiveTabId('all')} className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-bold transition-all ${activeTabId === 'all' ? ACTIVE_TAB_STYLES.all + ' shadow-md' : 'bg-white border border-slate-200 text-slate-600'}`}>
                        All Records
                    </button>
                    {groups.map(group => (
                        <button key={group.id} onClick={() => setActiveTabId(group.id)} className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-bold transition-all border whitespace-nowrap ${activeTabId === group.id ? (ACTIVE_TAB_STYLES[group.category] || ACTIVE_TAB_STYLES.all) + ' shadow-md border-transparent' : 'bg-white border border-slate-200 text-slate-600'}`}>
                            {GROUP_CATEGORY_LABELS[group.category]} {group.nameSuffix ? `(${group.nameSuffix})` : ''}
                        </button>
                    ))}
                </div>
            </div>
        )}

        <div className="max-w-3xl mx-auto p-4 space-y-4">
            {displayedReports.length > 0 ? (
                displayedReports.map((report) => (
                    <div key={report.id} onClick={() => handleEditReport(report)} className={`bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex justify-between items-center transition-all ${canEdit ? 'cursor-pointer hover:shadow-md hover:border-blue-200 hover:scale-[1.01] active:scale-[0.99]' : ''}`}>
                        <div>
                            <div className="text-slate-800 font-bold text-lg flex items-baseline gap-2">
                                {report.gatheringDate}
                            </div>
                            <span className={`inline-flex mt-2 px-2.5 py-1 rounded-md text-xs font-bold ${GROUP_CATEGORY_COLORS[report.groupCategory as any]}`}>
                                {GROUP_CATEGORY_LABELS[report.groupCategory as any]}
                            </span>
                             {report.notes !== '-' && <p className="text-xs text-slate-400 mt-2 italic max-w-[200px] truncate">{report.notes}</p>}
                        </div>
                        <div className="flex flex-col items-end pl-4 border-l border-slate-50 ml-2">
                            <span className={`text-3xl font-bold ${report.attendanceCount > 0 ? 'text-blue-600' : 'text-slate-300'}`}>{report.attendanceCount}</span>
                            <span className="text-xs text-slate-400 uppercase tracking-wide font-medium mt-1">Attendees</span>
                        </div>
                    </div>
                ))
            ) : (
                <div className="flex flex-col items-center justify-center py-20 text-slate-400">
                    <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                        <Calendar className="w-10 h-10 text-slate-200" />
                    </div>
                    <p className="font-bold">No reports found.</p>
                </div>
            )}
        </div>
      </div>

      <div className="absolute bottom-6 right-6 z-30 flex flex-col gap-3 items-end animate-in zoom-in duration-300">
          <button onClick={() => setIsGroupSelectorOpen(true)} className={`flex items-center justify-center rounded-full shadow-lg hover:shadow-xl transition-all transform hover:scale-105 px-6 py-4 gap-2 ${canEdit ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white'}`}>
              {canEdit ? <Plus className="w-6 h-6" /> : <Info className="w-6 h-6" />}
              <span className="font-bold text-lg">{canEdit ? 'New Report' : 'Group Info'}</span>
          </button>
      </div>

      {/* Role-Based Provisioning Modal - List View */}
      {isGroupSelectorOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsGroupSelectorOpen(false)} />
              <div className="relative bg-white w-full max-w-xl rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in slide-in-from-bottom-full duration-300 flex flex-col max-h-[90vh]">
                  
                  <div className="p-8 pb-4 flex justify-between items-center bg-white sticky top-0 z-10 border-b border-slate-50">
                      <div>
                        <h3 className="text-2xl font-black text-slate-900 tracking-tight">{canEdit ? 'Select Group' : 'View Details'}</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                            {canEdit ? 'Which gathering are you reporting?' : 'Choose a group to see info'}
                        </p>
                      </div>
                      <button onClick={() => setIsGroupSelectorOpen(false)} className="p-2 bg-slate-100 rounded-full hover:bg-slate-200 transition-colors"><X className="w-6 h-6 text-slate-500" /></button>
                  </div>

                  <div className="p-8 space-y-8 overflow-y-auto no-scrollbar">
                      {/* Section: Formal Groups */}
                      <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Formal Cell Groups (O & D)</h4>
                          <div className="space-y-3">
                              {availableCategories.filter(c => c === 'open_cell' || c === 'disciple_cell').map(cat => {
                                  const catGroups = groups.filter(g => g.category === cat);
                                  
                                  if (catGroups.length === 0) {
                                      return (
                                          <button 
                                              key={cat}
                                              onClick={() => {
                                                  if (canEdit) onRedirectToSettings?.(cat);
                                                  setIsGroupSelectorOpen(false);
                                              }}
                                              className="w-full flex items-center justify-between p-5 rounded-[1.5rem] border-2 border-dashed border-slate-200 bg-slate-50/50 hover:border-orange-400 transition-all group"
                                          >
                                              <div className="flex items-center gap-4">
                                                  <div className="w-12 h-12 rounded-2xl bg-white border border-slate-100 flex items-center justify-center text-slate-300">
                                                      <Settings className="w-6 h-6" />
                                                  </div>
                                                  <div className="text-left">
                                                      <div className="font-black text-slate-400 text-sm uppercase">{GROUP_CATEGORY_LABELS[cat]}</div>
                                                      <div className="text-[10px] font-bold text-orange-600 uppercase mt-0.5">Click to Setup Required</div>
                                                  </div>
                                              </div>
                                              <Plus className="w-5 h-5 text-slate-300 group-hover:text-orange-500 transition-colors" />
                                          </button>
                                      );
                                  }

                                  return catGroups.map(group => (
                                      <button 
                                          key={group.id}
                                          onClick={() => {
                                              if (canEdit) openReportForm(group.id);
                                              else {
                                                  setSelectedGroupIdForInfo(group.id);
                                                  setIsInfoModalOpen(true);
                                                  setIsGroupSelectorOpen(false);
                                              }
                                          }}
                                          className="w-full flex items-center justify-between p-5 rounded-[2rem] border-2 border-slate-100 bg-white hover:border-blue-500 hover:shadow-xl hover:shadow-blue-50 transition-all group"
                                      >
                                          <div className="flex items-center gap-4">
                                              <div className={`w-12 h-12 rounded-2xl shadow-sm border flex items-center justify-center ${GROUP_CATEGORY_COLORS[group.category]}`}>
                                                  {group.category === 'open_cell' ? <Users className="w-6 h-6" /> : <Target className="w-6 h-6" />}
                                              </div>
                                              <div className="text-left">
                                                  <div className="font-black text-slate-900 text-sm uppercase">
                                                      {group.nameSuffix || GROUP_CATEGORY_LABELS[group.category]}
                                                  </div>
                                                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 mt-0.5">
                                                      <Clock className="w-3 h-3" /> {group.groupDay.slice(0,3)} • {group.groupTime}
                                                  </div>
                                              </div>
                                          </div>
                                          <div className="p-2 bg-slate-50 rounded-full group-hover:bg-blue-600 group-hover:text-white transition-all">
                                              <ChevronRight className="w-4 h-4" />
                                          </div>
                                      </button>
                                  ));
                              })}
                          </div>
                      </div>

                      {/* Section: Flexible Ministries */}
                      <div className="space-y-4">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Flexible Ministry (P & R)</h4>
                          <div className="grid grid-cols-2 gap-3">
                              {availableCategories.filter(c => c === 'pre_cell' || c === 'relationship').map(cat => {
                                  const existing = groups.find(g => g.category === cat);
                                  return (
                                      <button 
                                          key={cat}
                                          onClick={() => {
                                              if (!canEdit) {
                                                  if (existing) {
                                                      setSelectedGroupIdForInfo(existing.id);
                                                      setIsInfoModalOpen(true);
                                                  }
                                                  setIsGroupSelectorOpen(false);
                                                  return;
                                              }
                                              if (existing) openReportForm(existing.id);
                                              else handleQuickGroupAdd(cat);
                                          }}
                                          className="flex flex-col items-center justify-center p-6 rounded-[2rem] border-2 border-slate-100 bg-white hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-50 transition-all group"
                                      >
                                          <div className={`w-12 h-12 rounded-2xl mb-3 shadow-sm border flex items-center justify-center group-hover:scale-110 transition-transform ${GROUP_CATEGORY_COLORS[cat]}`}>
                                              {cat === 'pre_cell' ? <Zap className="w-6 h-6" /> : <Heart className="w-6 h-6" />}
                                          </div>
                                          <div className="font-black text-slate-900 text-[10px] uppercase tracking-wider text-center line-clamp-1">{GROUP_CATEGORY_LABELS[cat]}</div>
                                          <div className="text-[8px] font-bold text-blue-600 mt-1 uppercase tracking-tighter">
                                              {existing ? 'Active Record' : 'Quick Entry'}
                                          </div>
                                      </button>
                                  );
                              })}
                          </div>
                      </div>
                  </div>

                  <div className="p-8 bg-slate-50 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-white shadow-sm flex items-center justify-center text-blue-600"><Sparkles className="w-5 h-5" /></div>
                      <p className="text-[11px] font-medium text-slate-500 italic">"Go and make disciples of all nations..."</p>
                  </div>
              </div>
          </div>
      )}

      {isReportFormOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsReportFormOpen(false)} />
              <div className="relative bg-white w-full max-w-lg sm:rounded-3xl shadow-2xl h-[90vh] sm:h-auto flex flex-col animate-in slide-in-from-bottom-full duration-500">
                  <div className="px-6 py-5 border-b bg-slate-50/50 flex justify-between items-center sm:rounded-t-3xl">
                      <div>
                          <h3 className="font-black text-2xl text-slate-900 tracking-tight">{editingReportId ? 'Edit Report' : 'New Report'}</h3>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-0.5">
                              {groups.find(g => g.id === selectedGroupIdForReport)?.groupName}
                          </p>
                      </div>
                      <button onClick={() => setIsReportFormOpen(false)} className="p-2.5 hover:bg-slate-200 rounded-full transition-all">
                        <X className="w-6 h-6 text-slate-500" />
                      </button>
                  </div>

                  <div className="p-8 space-y-8 overflow-y-auto flex-1 no-scrollbar">
                      <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]">Date</label>
                              <input type="date" value={gatheringDate} onChange={(e) => setGatheringDate(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 transition-all text-sm" />
                          </div>
                          <div className="space-y-2">
                              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]">Time</label>
                              <input type="time" value={gatheringTime} onChange={(e) => setGatheringTime(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-slate-800 transition-all text-sm" />
                          </div>
                      </div>

                      <div className="space-y-3">
                          <div className="flex justify-between items-center">
                              <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]">Total Attendance</label>
                              <button 
                                onClick={() => setIsAttendanceTrackerOpen(true)}
                                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg font-bold text-[10px] uppercase border border-blue-100 hover:bg-blue-100 transition-all"
                              >
                                  <UserCheck className="w-3.5 h-3.5" /> Track Individually
                              </button>
                          </div>
                          <input ref={attendanceInputRef} type="number" value={attendanceCount} onChange={(e) => setAttendanceCount(e.target.value)} placeholder="0" className="w-full p-6 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-black text-5xl text-blue-600 transition-all" />
                          {attendedMemberIds.length > 0 && (
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{attendedMemberIds.length} members + {guests.length} guests selected (Leader included)</p>
                          )}
                      </div>

                      <div className="space-y-2">
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.1em]">Notes / Testimonies</label>
                          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Share testimonies..." className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl outline-none text-slate-700 transition-all resize-none font-medium" />
                      </div>
                  </div>

                  <div className="p-6 border-t bg-slate-50/50 sm:rounded-b-3xl flex flex-col sm:flex-row gap-3">
                      {editingReportId && (
                        <button onClick={() => setShowDeleteConfirm(true)} className="flex-1 sm:flex-none sm:w-20 py-4 bg-red-50 hover:bg-red-100 text-red-600 rounded-2xl font-bold flex items-center justify-center transition-all group">
                            <Trash2 className="w-5 h-5" />
                        </button>
                      )}
                      <button onClick={handleSaveReport} className="flex-1 py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-xl active:scale-[0.97] transition-all">
                          <Check className="w-6 h-6 stroke-[3]" /> {editingReportId ? 'Update Report' : 'Submit Report'}
                      </button>
                  </div>
              </div>
          </div>
      )}

      {isAttendanceTrackerOpen && (
        <AttendanceTracker 
            group={groups.find(g => g.id === selectedGroupIdForReport)!}
            members={effectiveMembers}
            initialAttendedIds={attendedMemberIds}
            initialGuests={guests}
            onComplete={handleAttendanceTrackComplete}
            onCancel={() => setIsAttendanceTrackerOpen(false)}
            onAddMember={onAddMember}
        />
      )}

      {isInfoModalOpen && (
          <GroupDetailModal 
            group={groups.find(g => g.id === selectedGroupIdForInfo) || null}
            leader={leader}
            onClose={() => setIsInfoModalOpen(false)}
          />
      )}

      {showDeleteConfirm && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowDeleteConfirm(false)} />
              <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center animate-in zoom-in-95">
                  <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6"><AlertTriangle className="w-10 h-10" /></div>
                  <h4 className="text-2xl font-black text-slate-900 mb-2">Delete Report?</h4>
                  <div className="flex flex-col gap-3 mt-8">
                      <button onClick={() => {
                        if (editingReportId && selectedGroupIdForReport) {
                            onDeleteReport?.(selectedGroupIdForReport, editingReportId);
                            setIsReportFormOpen(false);
                            setShowDeleteConfirm(false);
                        }
                      }} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-sm hover:bg-red-700">Delete Permanently</button>
                      <button onClick={() => setShowDeleteConfirm(false)} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm">Cancel</button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default LeaderDetail;
