
import React, { useMemo, useState } from 'react';
import { ClipboardCheck, Search, Calendar, Phone, Mail, AlertCircle, Clock, ChevronRight, User, Info, Globe, Network, MessageSquare, X, Check, ExternalLink, History, Plus, Send } from 'lucide-react';
import { CellLeader, FollowUpRecord } from '../types';

interface ReportingStatusProps {
  allLeaders: CellLeader[];
  currentUser: CellLeader;
}

const WHATSAPP_TEMPLATES = [
  {
    id: 'gentle',
    title: '溫馨提醒 (Gentle)',
    text: '親愛的小組長 ###，主內平安！提醒您請盡快匯報兩週內的開組人數。感謝您的勞苦！'
  },
  {
    id: 'urgent',
    title: '正式催報 (Official)',
    text: '小組長 ### 您好，系統顯示您的小組報表已逾期，請點擊連結補回資料以利行政統計。'
  },
  {
    id: 'support',
    title: '協助引導 (Support)',
    text: '### 您好，如果您在提交報表時遇到困難，隨時可以聯繫我。請抽空點選連結回報本週人數。'
  }
];

const ReportingStatus: React.FC<ReportingStatusProps> = ({ allLeaders, currentUser }) => {
  // Default to 14 days ago
  const defaultDate = new Date();
  defaultDate.setDate(defaultDate.getDate() - 14);
  
  const [thresholdDate, setThresholdDate] = useState(defaultDate.toISOString().split('T')[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [scope, setScope] = useState<'all' | 'lineage'>('lineage');
  
  // WhatsApp Template State
  const [selectedLeaderForWA, setSelectedLeaderForWA] = useState<CellLeader | null>(null);
  
  // Follow Up State
  const [selectedLeaderForFollowUp, setSelectedLeaderForFollowUp] = useState<CellLeader | null>(null);
  const [newFollowUpContent, setNewFollowUpContent] = useState('');
  const [newFollowUpDate, setNewFollowUpDate] = useState(new Date().toISOString().split('T')[0]);

  const inactiveLeaders = useMemo(() => {
    const threshold = new Date(thresholdDate);
    
    return allLeaders
      .filter(leader => {
        if (scope === 'lineage') {
            const isDescendant = leader.mgCode.startsWith(currentUser.mgCode);
            if (!isDescendant) return false;
        }

        const isTargetLeader = leader.roles.some(r => r === '小組長' || r === '族長');
        if (!isTargetLeader) return false;

        if (leader.status !== 'active') return false;

        const matchesSearch = 
            `${leader.chineseName} ${leader.firstName} ${leader.mgCode}`
            .toLowerCase()
            .includes(searchQuery.toLowerCase());

        if (!matchesSearch) return false;

        const activeGroups = leader.groups.filter(g => !g.isDeleted);
        let latestDate: Date | null = null;
        activeGroups.forEach(group => {
            group.reports.forEach(report => {
                const reportDate = new Date(report.gatheringDate);
                if (!latestDate || reportDate > latestDate) {
                    latestDate = reportDate;
                }
            });
        });

        return !latestDate || latestDate < threshold;
      })
      .map(leader => {
          let latestDateStr = 'Never Reported';
          let latestDate: Date | null = null;
          leader.groups.filter(g => !g.isDeleted).forEach(group => {
              group.reports.forEach(report => {
                  const d = new Date(report.gatheringDate);
                  if (!latestDate || d > latestDate) latestDate = d;
              });
          });
          if (latestDate) latestDateStr = latestDate.toISOString().split('T')[0];
          
          return { ...leader, lastReportDate: latestDateStr };
      })
      .sort((a, b) => a.mgCode.localeCompare(b.mgCode));
  }, [allLeaders, thresholdDate, searchQuery, scope, currentUser.mgCode]);

  const sendWhatsApp = (leader: CellLeader, templateText: string) => {
      const name = leader.chineseName || leader.firstName;
      const appUrl = window.location.origin;
      const message = templateText.replace('###', name) + `\n\nURL: ${appUrl}`;
      const encodedMsg = encodeURIComponent(message);
      const phone = leader.phoneNumber.replace(/\s+/g, '');
      const waUrl = `https://wa.me/852${phone}?text=${encodedMsg}`;
      window.open(waUrl, '_blank');
      setSelectedLeaderForWA(null);
  };

  const handleAddFollowUp = () => {
    if (!selectedLeaderForFollowUp || !newFollowUpContent.trim()) return;

    const newRecord: FollowUpRecord = {
        id: `f-${Date.now()}`,
        adminId: currentUser.id,
        adminName: currentUser.chineseName || currentUser.firstName || 'Admin',
        date: newFollowUpDate,
        content: newFollowUpContent
    };

    if (!selectedLeaderForFollowUp.followUpRecords) {
        selectedLeaderForFollowUp.followUpRecords = [];
    }
    selectedLeaderForFollowUp.followUpRecords = [newRecord, ...selectedLeaderForFollowUp.followUpRecords];
    
    setNewFollowUpContent('');
    setNewFollowUpDate(new Date().toISOString().split('T')[0]);
  };

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-50 overflow-hidden animate-in fade-in duration-500">
      <div className="bg-white px-8 py-6 border-b border-slate-200 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <ClipboardCheck className="w-7 h-7 text-orange-600" />
            Reporting Status (報表追蹤)
          </h1>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mt-1">Monitoring leaders with missing reports</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200/50 w-full sm:w-auto">
                <button 
                    onClick={() => setScope('lineage')}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${scope === 'lineage' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                >
                    <Network className="w-3 h-3" /> My Lineage
                </button>
                <button 
                    onClick={() => setScope('all')}
                    className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${scope === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
                >
                    <Globe className="w-3 h-3" /> All Leaders
                </button>
            </div>

            <div className="relative w-full sm:w-auto">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <input 
                    type="date"
                    value={thresholdDate}
                    onChange={(e) => setThresholdDate(e.target.value)}
                    className="w-full sm:w-auto pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-bold text-sm focus:ring-4 focus:ring-orange-500/10 outline-none transition-all"
                />
            </div>
            <div className="relative w-full sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                    type="text"
                    placeholder="Search name or code..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                />
            </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col p-6 sm:p-8">
        {/* KPI Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200/60 flex items-center gap-6">
                <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-2xl flex items-center justify-center">
                    <AlertCircle className="w-7 h-7" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">At Risk Leaders</p>
                    <h3 className="text-3xl font-black text-slate-900">{inactiveLeaders.length}</h3>
                </div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200/60 flex items-center gap-6">
                <div className="w-14 h-14 bg-red-50 text-red-600 rounded-2xl flex items-center justify-center">
                    <Clock className="w-7 h-7" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Never Reported</p>
                    <h3 className="text-3xl font-black text-slate-900">
                        {inactiveLeaders.filter(l => l.lastReportDate === 'Never Reported').length}
                    </h3>
                </div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-200/60 flex items-center gap-6">
                <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                    <Calendar className="w-7 h-7" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tracing Since</p>
                    <h3 className="text-lg font-black text-slate-900 truncate">{thresholdDate}</h3>
                </div>
            </div>
        </div>

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1100px]">
              <thead className="sticky top-0 bg-white z-10 shadow-sm">
                <tr className="bg-slate-50/50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200">
                  <th className="px-8 py-5">Leader Name & Code</th>
                  <th className="px-6 py-5 text-center">Last Report</th>
                  <th className="px-6 py-5">Latest Follow-up (最新跟進)</th>
                  <th className="px-6 py-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {inactiveLeaders.map((leader) => {
                  const latestFollowUp = leader.followUpRecords && leader.followUpRecords.length > 0 
                    ? leader.followUpRecords[0] 
                    : null;
                  
                  return (
                    <tr key={leader.id} className="hover:bg-slate-50/50 transition-colors group">
                        <td className="px-8 py-5">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black text-xs border border-slate-200">
                                    {leader.chineseName?.charAt(0) || leader.firstName?.charAt(0) || '?'}
                                </div>
                                <div>
                                    <div className="font-black text-slate-900 text-sm leading-tight">{leader.chineseName || leader.firstName}</div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <span className="text-[10px] font-black text-blue-600 font-mono tracking-tight uppercase">{leader.mgCode}</span>
                                        <span className="w-1 h-1 bg-slate-200 rounded-full"></span>
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{leader.personId}</span>
                                    </div>
                                </div>
                            </div>
                        </td>
                        
                        <td className="px-6 py-5 text-center">
                            <span className={`px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-tight ${
                                leader.lastReportDate === 'Never Reported' 
                                ? 'bg-red-50 text-red-600 border border-red-100' 
                                : 'bg-orange-50 text-orange-600 border border-orange-100'
                            }`}>
                                {leader.lastReportDate}
                            </span>
                        </td>

                        <td className="px-6 py-5 max-w-[400px]">
                            {latestFollowUp ? (
                                <div className="p-3 bg-blue-50/50 rounded-2xl border border-blue-100/50 group/log hover:bg-white hover:shadow-sm transition-all">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[9px] font-black text-blue-600 uppercase bg-white px-1.5 py-0.5 rounded border border-blue-100">{latestFollowUp.adminName}</span>
                                        <span className="text-[9px] font-bold text-slate-400 italic">{latestFollowUp.date}</span>
                                    </div>
                                    <p className="text-[11px] font-medium text-slate-600 line-clamp-2 leading-relaxed">
                                        {latestFollowUp.content}
                                    </p>
                                </div>
                            ) : (
                                <span className="text-[11px] font-bold text-slate-300 uppercase tracking-widest flex items-center gap-2">
                                    <Info className="w-3.5 h-3.5 opacity-50" /> No record yet
                                </span>
                            )}
                        </td>

                        <td className="px-6 py-5 text-right">
                            <div className="flex justify-end gap-2">
                                {/* Follow-up Button */}
                                <button 
                                    onClick={() => setSelectedLeaderForFollowUp(leader)}
                                    className={`p-2.5 rounded-xl transition-all border shadow-sm relative ${latestFollowUp ? 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-600 hover:text-white' : 'bg-slate-100 text-slate-600 border-transparent hover:bg-slate-200'}`}
                                    title="Follow-up Log (跟進紀錄)"
                                >
                                    <History className="w-4 h-4" />
                                    {latestFollowUp && <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-blue-600 rounded-full border-2 border-white" />}
                                </button>

                                {/* WhatsApp Button */}
                                <button 
                                    onClick={() => setSelectedLeaderForWA(leader)}
                                    className="p-2.5 bg-[#25D366]/10 text-[#25D366] rounded-xl hover:bg-[#25D366] hover:text-white transition-all border border-[#25D366]/20 shadow-sm"
                                    title="Send WhatsApp Reminder"
                                >
                                    <MessageSquare className="w-4 h-4 fill-current" />
                                </button>
                                
                                <a 
                                    href={`tel:${leader.phoneNumber}`} 
                                    className="p-2.5 bg-slate-100 text-slate-600 rounded-xl hover:bg-white hover:text-indigo-600 hover:shadow-md border border-transparent hover:border-indigo-100 transition-all"
                                    title="Call Leader"
                                >
                                    <Phone className="w-4 h-4" />
                                </a>
                                <button 
                                    className="p-2.5 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all shadow-sm active:scale-95"
                                    title="View Profile"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        </td>
                    </tr>
                  );
                })}
                {inactiveLeaders.length === 0 && (
                  <tr>
                    <td colSpan={4} className="px-8 py-24 text-center">
                        <div className="flex flex-col items-center gap-4 text-slate-300">
                            <ClipboardCheck className="w-16 h-16 opacity-20" />
                            <p className="font-black text-xs uppercase tracking-[0.2em]">Everyone is up to date!</p>
                        </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          <div className="px-8 py-5 bg-slate-50/50 border-t border-slate-100 flex justify-between items-center">
             <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Displaying {inactiveLeaders.length} leaders needing follow-up
             </span>
             <Info className="w-4 h-4 text-slate-300" />
          </div>
        </div>
      </div>

      {/* Follow-up Record Modal */}
      {selectedLeaderForFollowUp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-4">
              <div 
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                  onClick={() => setSelectedLeaderForFollowUp(null)}
              />
              <div className="relative bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 flex flex-col max-h-[90vh]">
                  <div className="p-8 pb-6 border-b border-slate-100">
                      <div className="flex justify-between items-start">
                          <div>
                              <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-full text-[10px] font-black uppercase tracking-widest mb-2">
                                  <History className="w-3 h-3" /> Follow-up Log (跟進紀錄)
                              </div>
                              <h3 className="text-2xl font-black text-slate-900 tracking-tight">跟進紀錄卡</h3>
                              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">
                                Leader: {selectedLeaderForFollowUp.chineseName || selectedLeaderForFollowUp.firstName} ({selectedLeaderForFollowUp.mgCode})
                              </p>
                          </div>
                          <button 
                              onClick={() => setSelectedLeaderForFollowUp(null)}
                              className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all"
                          >
                              <X className="w-6 h-6" />
                          </button>
                      </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-8 no-scrollbar">
                      {/* Add New Entry Form */}
                      <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Add New Entry</h4>
                          <div className="space-y-4">
                               <div className="flex flex-col sm:flex-row gap-4">
                                   <div className="sm:w-32 flex-shrink-0">
                                       <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Follow-up By</label>
                                       <div className="p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-500 truncate">
                                           {currentUser.chineseName || currentUser.firstName}
                                       </div>
                                   </div>
                                   <div className="flex-1">
                                       <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Date</label>
                                       <input 
                                           type="date"
                                           value={newFollowUpDate}
                                           onChange={(e) => setNewFollowUpDate(e.target.value)}
                                           className="w-full p-3 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all"
                                       />
                                   </div>
                               </div>
                               <div>
                                   <label className="text-[9px] font-black text-slate-400 uppercase block mb-1">Status / Notes</label>
                                   <textarea 
                                       rows={3}
                                       value={newFollowUpContent}
                                       onChange={(e) => setNewFollowUpContent(e.target.value)}
                                       placeholder="Describe follow-up details..."
                                       className="w-full p-4 bg-white border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 transition-all resize-none"
                                   />
                               </div>
                               <button 
                                   onClick={handleAddFollowUp}
                                   disabled={!newFollowUpContent.trim()}
                                   className="w-full py-3 bg-blue-600 text-white rounded-xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50"
                               >
                                   <Plus className="w-4 h-4 stroke-[3]" /> Save Entry
                               </button>
                          </div>
                      </div>

                      {/* History Timeline */}
                      <div className="space-y-6">
                          <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-2">History Timeline</h4>
                          {selectedLeaderForFollowUp.followUpRecords && selectedLeaderForFollowUp.followUpRecords.length > 0 ? (
                              <div className="relative pl-6 space-y-8 before:content-[''] before:absolute before:left-0 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200">
                                  {selectedLeaderForFollowUp.followUpRecords.map((record) => (
                                      <div key={record.id} className="relative">
                                          <div className="absolute -left-6 top-1.5 w-3 h-3 rounded-full bg-blue-500 border-2 border-white ring-4 ring-blue-50" />
                                          <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm transition-all hover:shadow-md">
                                              <div className="flex justify-between items-start mb-2">
                                                  <div className="flex items-center gap-2">
                                                      <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase">{record.adminName}</span>
                                                      <span className="text-[10px] font-bold text-slate-400 italic">{record.date}</span>
                                                  </div>
                                              </div>
                                              <p className="text-sm font-medium text-slate-700 leading-relaxed">
                                                  {record.content}
                                              </p>
                                          </div>
                                      </div>
                                  ))}
                              </div>
                          ) : (
                              <div className="py-12 text-center text-slate-300">
                                  <History className="w-12 h-12 opacity-10 mx-auto mb-2" />
                                  <p className="text-[10px] font-black uppercase tracking-widest">No follow-up history found</p>
                              </div>
                          )}
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* WhatsApp Template Modal */}
      {selectedLeaderForWA && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6 sm:p-4">
              <div 
                  className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300"
                  onClick={() => setSelectedLeaderForWA(null)}
              />
              <div className="relative bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="p-8 pb-6">
                      <div className="flex justify-between items-start mb-6">
                          <div>
                              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#25D366]/10 text-[#25D366] rounded-full text-[10px] font-black uppercase tracking-widest mb-2">
                                  <MessageSquare className="w-3 h-3 fill-current" /> WhatsApp Reminder
                              </div>
                              <h3 className="text-2xl font-black text-slate-900 tracking-tight">選擇訊息範本</h3>
                              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">To: {selectedLeaderForWA.chineseName || selectedLeaderForWA.firstName}</p>
                          </div>
                          <button 
                              onClick={() => setSelectedLeaderForWA(null)}
                              className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all"
                          >
                              <X className="w-6 h-6" />
                          </button>
                      </div>

                      <div className="space-y-3">
                          {WHATSAPP_TEMPLATES.map((tmpl) => (
                              <button
                                  key={tmpl.id}
                                  onClick={() => sendWhatsApp(selectedLeaderForWA, tmpl.text)}
                                  className="w-full text-left p-5 bg-slate-50 border border-slate-200 rounded-2xl hover:border-[#25D366] hover:bg-[#25D366]/5 transition-all group relative"
                              >
                                  <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 group-hover:text-[#25D366] transition-colors">{tmpl.title}</div>
                                  <p className="text-sm font-bold text-slate-700 leading-relaxed group-hover:text-slate-900 transition-colors">
                                      {tmpl.text.replace('###', (selectedLeaderForWA.chineseName || selectedLeaderForWA.firstName))}
                                  </p>
                                  <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <ExternalLink className="w-4 h-4 text-[#25D366]" />
                                  </div>
                              </button>
                          ))}
                      </div>
                  </div>

                  <div className="p-8 bg-slate-50 border-t border-slate-100 text-center">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Message includes automatic link:</p>
                       <div className="bg-white p-3 rounded-xl border border-slate-200 text-[10px] font-mono text-slate-500 break-all">
                           {window.location.origin}
                       </div>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ReportingStatus;
