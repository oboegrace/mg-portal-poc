
import React, { useState, useMemo, useRef } from 'react';
import { 
    Search, Edit2, Trash2, X, Check, User, ShieldAlert, Mail, Phone, Database, 
    ShieldCheck, Lock, Tags, Eye, EyeOff, Ban, CheckCircle2, Network, 
    ChevronDown, Info, Calendar, UserPlus, Fingerprint, Send, Heart, Briefcase, Camera,
    MessageSquare, ExternalLink, MoveHorizontal, ArrowRight, History, Award, UserMinus, 
    UserCheck, FileText, TrendingUp, Download, Upload, FileSpreadsheet, Loader2
} from 'lucide-react';
import { CellLeader, TransferRecord, StatusChangeRecord, FollowUpRecord, AccountStatus } from '../types';
import { 
    ROLE_OPTIONS, ROLE_COLORS, GENDERS, PROFILE_AGE_RANGES, 
    MARRIAGE_STATUSES, SPECIAL_CONDITIONS, YES_NO 
} from './constants';

interface LeaderManagementProps {
  leaders: CellLeader[];
  onSaveLeader: (leader: CellLeader) => void;
  onBulkSaveLeaders: (leaders: CellLeader[]) => void;
  onDeleteLeader: (leaderId: string) => void;
  currentUser: CellLeader;
}

const BRAND_PURPLE = '#5856D6';

const WHATSAPP_TEMPLATES = [
  {
    id: 'greeting',
    title: '問候 (Greeting)',
    text: '親愛的小組長 ###，主內平安！想了解一下近況，願主大大祝福您的服事！'
  },
  {
    id: 'reminder',
    title: '行政提醒 (Admin Reminder)',
    text: '小組長 ### 您好，溫馨提醒：請記得更新個人資料或查看最新的行政公告。感謝！'
  },
  {
    id: 'connect',
    title: '聯繫溝通 (Contact)',
    text: '### 您好，我是教會行政同工，有些關於小組事項想與您溝通，方便時請回電或訊息，謝謝。'
  }
];

const LeaderManagement: React.FC<LeaderManagementProps> = ({ leaders, onSaveLeader, onBulkSaveLeaders, onDeleteLeader, currentUser }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingLeader, setEditingLeader] = useState<CellLeader | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isValidatingMember, setIsValidatingMember] = useState(false);
  const [selectedLeaderForWA, setSelectedLeaderForWA] = useState<CellLeader | null>(null);
  
  // Bulk States
  const [isBulkProcessing, setIsBulkProcessing] = useState(false);
  const [importSummary, setImportSummary] = useState<{ new: number, updated: number, errors: string[] } | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  // Status Change State
  const [pendingStatusChange, setPendingStatusChange] = useState<{ id: string, target: 'active' | 'disabled' } | null>(null);
  const [statusReason, setStatusReason] = useState('');

  // Transfer States
  const [transferringLeader, setTransferringLeader] = useState<CellLeader | null>(null);
  const [newParentId, setNewParentId] = useState<string>('');
  const [transferReason, setTransferReason] = useState<string>('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredLeaders = useMemo(() => {
    return [...leaders]
      .filter(l => {
        const full = `${l.chineseName} ${l.firstName} ${l.lastName} ${l.mgCode} ${l.email} ${l.memberId}`.toLowerCase();
        return full.includes(searchQuery.toLowerCase());
      })
      .sort((a, b) => (a.mgCode || '').localeCompare(b.mgCode || ''));
  }, [leaders, searchQuery]);

  // CSV Logic
  const handleExportCSV = () => {
    const headers = [
        "mgCode", "memberId", "chineseName", "firstName", "lastName", 
        "email", "phoneNumber", "roles", "parentLeaderName", 
        "ordinationDate", "generation", "status", "identity"
    ];

    const rows = leaders.map(l => [
        l.mgCode || "",
        l.memberId || "",
        l.chineseName || "",
        l.firstName || "",
        l.lastName || "",
        l.email,
        l.phoneNumber,
        (l.roles || []).join(";"),
        l.parentLeaderName || "",
        l.ordinationDate || "",
        l.generation,
        l.status,
        l.identity || ""
    ]);

    const csvContent = [
        headers.join(","),
        ...rows.map(r => r.map(val => `"${val}"`).join(","))
    ].join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Leader_Directory_Export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadTemplate = () => {
    const headers = [
        "mgCode", "memberId", "chineseName", "firstName", "lastName", 
        "email", "phoneNumber", "roles", "parentLeaderName", 
        "ordinationDate", "generation", "status", "identity"
    ];
    const example = [
        "GA", "M1001", "張三", "San", "Zhang", "san.zhang@example.com", 
        "90001000", "小組長;族長", "ROOT", "2023-01-01", "1", "active", "Professional"
    ];
    const csvContent = [headers.join(","), example.map(v => `"${v}"`).join(",")].join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "Cell_Leader_Import_Template.csv";
    link.click();
  };

  const handleImportCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsBulkProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split(/\r?\n/).filter(line => line.trim() !== "");
        if (lines.length < 2) {
            setIsBulkProcessing(false);
            alert("CSV file is empty or missing headers.");
            return;
        }

        const headers = lines[0].split(",").map(h => h.replace(/"/g, "").trim());
        const importedLeaders: CellLeader[] = [];
        let newCount = 0;
        let updateCount = 0;
        let errors: string[] = [];

        for (let i = 1; i < lines.length; i++) {
            // Basic CSV parser logic for quoted values with potential semicolons
            const regex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
            const values = lines[i].match(/"[^"]*"|[^,]+/g)?.map(v => v.replace(/^"|"$/g, "").trim()) || [];
            
            if (values.length < headers.length) continue;

            const row: any = {};
            headers.forEach((header, idx) => {
                row[header] = values[idx];
            });

            if (!row.email || !row.firstName) {
                errors.push(`Row ${i+1}: Missing Email or First Name.`);
                continue;
            }

            // Map to existing or new
            const existing = leaders.find(l => l.email === row.email || (l.memberId && l.memberId === row.memberId));
            
            if (existing) updateCount++;
            else newCount++;

            const leaderData: CellLeader = {
                id: existing?.id || `l-imp-${Date.now()}-${i}`,
                personId: existing?.personId || `p-imp-${Date.now()}-${i}`,
                mgCode: row.mgCode || "",
                memberId: row.memberId || "",
                chineseName: row.chineseName || "",
                firstName: row.firstName || "",
                lastName: row.lastName || "",
                email: row.email,
                phoneNumber: row.phoneNumber || "",
                roles: (row.roles || "").split(";").filter((r: string) => r.length > 0),
                parentLeaderName: row.parentLeaderName || "",
                ordinationDate: row.ordinationDate || "",
                generation: parseInt(row.generation) || 1,
                status: (row.status as AccountStatus) || "active",
                identity: row.identity || "",
                password: existing?.password || "611" + Math.floor(100 + Math.random() * 900),
                tribeCode: row.mgCode ? row.mgCode.slice(0, 2) : (existing?.tribeCode || ""),
                groups: existing?.groups || [],
                transferHistory: existing?.transferHistory || [],
                statusHistory: existing?.statusHistory || [],
                followUpRecords: existing?.followUpRecords || []
            };
            importedLeaders.push(leaderData);
        }

        onBulkSaveLeaders(importedLeaders);
        setImportSummary({ new: newCount, updated: updateCount, errors });
        setIsBulkProcessing(false);
        if (csvInputRef.current) csvInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const getTimelineEvents = (leader: CellLeader) => {
    const events: { 
        date: string, 
        type: 'transfer' | 'status' | 'followup' | 'ordination', 
        title: string, 
        subtitle?: string, 
        actor?: string, 
        icon: any, 
        color: string,
        raw: any
    }[] = [];

    if (leader.ordinationDate) {
        events.push({
            date: leader.ordinationDate,
            type: 'ordination',
            title: '按立小組長 (Ordination)',
            subtitle: '正式按立成為 611 靈糧堂小組長',
            icon: Award,
            color: 'text-purple-600 bg-purple-50',
            raw: leader.ordinationDate
        });
    }

    leader.transferHistory?.forEach(t => {
        events.push({
            date: t.changeDate,
            type: 'transfer',
            title: '族系調動 (Transfer)',
            subtitle: `${t.fromParentName || 'Root'} ➔ ${t.toParentName || 'Root'}${t.reason ? ` - "${t.reason}"` : ''}`,
            actor: t.changedBy,
            icon: MoveHorizontal,
            color: 'text-orange-600 bg-orange-50',
            raw: t
        });
    });

    leader.statusHistory?.forEach(s => {
        const isSuspension = s.newStatus === 'disabled';
        events.push({
            date: s.changeDate,
            type: 'status',
            title: isSuspension ? '服事停牌 (Suspended)' : '服事復牌 (Reinstated)',
            subtitle: s.reason || (isSuspension ? '暫停服事資格' : '恢復服事資格'),
            actor: s.changedBy,
            icon: isSuspension ? UserMinus : UserCheck,
            color: isSuspension ? 'text-red-600 bg-red-50' : 'text-emerald-600 bg-emerald-50',
            raw: s
        });
    });

    leader.followUpRecords?.forEach(f => {
        events.push({
            date: f.date,
            type: 'followup',
            title: '行政跟進 (Follow-up)',
            subtitle: f.content,
            actor: f.adminName,
            icon: FileText,
            color: 'text-blue-600 bg-blue-50',
            raw: f
        });
    });

    return events.sort((a, b) => b.date.localeCompare(a.date));
  };

  const toggleRole = (role: string) => {
    if (!editingLeader) return;
    const currentRoles = editingLeader.roles || [];
    const newRoles = currentRoles.includes(role)
      ? currentRoles.filter(r => r !== role)
      : [...currentRoles, role];
    
    const isSpecialRole = newRoles.includes('小組長');
    setEditingLeader({ 
        ...editingLeader, 
        roles: newRoles,
        mgCode: isSpecialRole ? editingLeader.mgCode : '',
        generation: isSpecialRole ? editingLeader.generation : 0,
        ordinationDate: isSpecialRole ? editingLeader.ordinationDate : ''
    });
  };

  const handleInputChange = (field: keyof CellLeader, value: any) => {
    if (!editingLeader) return;
    setEditingLeader({ ...editingLeader, [field]: value });
  };

  const handleParentChange = (parentId: string) => {
    if (!editingLeader) return;
    if (!parentId) {
        setEditingLeader({ ...editingLeader, parentLeaderId: undefined, parentLeaderName: undefined, generation: 1 });
        return;
    }
    const parent = leaders.find(l => l.id === parentId);
    if (parent) {
        setEditingLeader({
            ...editingLeader,
            parentLeaderId: parent.id,
            parentLeaderName: `${parent.chineseName || parent.firstName}`,
            tribeCode: parent.tribeCode || parent.mgCode,
            generation: parent.generation + 1
        });
    }
  };

  const handleStatusUpdate = () => {
    if (!pendingStatusChange || !editingLeader) return;
    
    const record: StatusChangeRecord = {
        id: `sc-${Date.now()}`,
        oldStatus: editingLeader.status,
        newStatus: pendingStatusChange.target,
        changeDate: new Date().toISOString().split('T')[0],
        changedBy: currentUser.chineseName || currentUser.firstName || 'Admin',
        changedById: currentUser.id,
        reason: statusReason
    };

    const updated: CellLeader = {
        ...editingLeader,
        status: pendingStatusChange.target,
        statusHistory: [record, ...(editingLeader.statusHistory || [])]
    };

    setEditingLeader(updated);
    setPendingStatusChange(null);
    setStatusReason('');
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && editingLeader) {
      const url = URL.createObjectURL(file);
      setEditingLeader({ ...editingLeader, avatarUrl: url });
    }
  };

  const handleEdit = (leader: CellLeader) => {
    setEditingLeader({ ...leader, roles: leader.roles || [] });
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    const newLeader: CellLeader = {
      id: `l-${Date.now()}`,
      personId: `p-${Date.now()}`,
      memberId: '',
      mgCode: '',
      tribeCode: '',
      generation: 1,
      email: '',
      phoneNumber: '',
      roles: [],
      isAdmin: false,
      status: 'active',
      password: '611' + Math.floor(100 + Math.random() * 900),
      groups: [],
      transferHistory: [],
      statusHistory: [],
      followUpRecords: []
    };
    setEditingLeader(newLeader);
    setIsFormOpen(true);
  };

  const handleSave = () => {
    if (editingLeader) {
      if (!editingLeader.email || !editingLeader.firstName) {
          alert("Email and First Name are required.");
          return;
      }
      onSaveLeader(editingLeader);
      setIsFormOpen(false);
      setEditingLeader(null);
    }
  };

  const handleConfirmTransfer = () => {
    if (!transferringLeader) return;
    
    const newParent = leaders.find(l => l.id === newParentId);
    
    const transferRecord: TransferRecord = {
      id: `tr-${Date.now()}`,
      transferType: 'transfer',
      fromParentId: transferringLeader.parentLeaderId,
      fromParentName: transferringLeader.parentLeaderName,
      toParentId: newParent?.id,
      toParentName: newParent ? `${newParent.chineseName || newParent.firstName}` : 'Root',
      changeDate: new Date().toISOString().split('T')[0],
      changedBy: currentUser.chineseName || currentUser.firstName || 'Admin',
      changedById: currentUser.id,
      reason: transferReason
    };

    const updatedLeader: CellLeader = {
      ...transferringLeader,
      parentLeaderId: newParent?.id,
      parentLeaderName: newParent ? `${newParent.chineseName || newParent.firstName}` : undefined,
      generation: newParent ? newParent.generation + 1 : 1,
      tribeCode: newParent ? (newParent.tribeCode || newParent.mgCode) : transferringLeader.mgCode,
      transferHistory: [transferRecord, ...(transferringLeader.transferHistory || [])]
    };

    onSaveLeader(updatedLeader);
    
    if (editingLeader && editingLeader.id === updatedLeader.id) {
        setEditingLeader(updatedLeader);
    }

    setTransferringLeader(null);
    setNewParentId('');
    setTransferReason('');
  };

  const sendWhatsApp = (leader: CellLeader, templateText: string) => {
      const name = leader.chineseName || leader.firstName;
      const message = templateText.replace('###', name);
      const encodedMsg = encodeURIComponent(message);
      const phone = leader.phoneNumber.replace(/\s+/g, '');
      const waUrl = `https://wa.me/852${phone}?text=${encodedMsg}`;
      window.open(waUrl, '_blank');
      setSelectedLeaderForWA(null);
  };

  const showLeadershipFields = editingLeader?.roles?.includes('小組長');

  const SectionTitle = ({ title, icon: Icon }: { title: string, icon: any }) => (
      <div className="flex items-center gap-3 border-b border-slate-100 pb-2 mb-6 mt-10 first:mt-0">
          <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center text-slate-400">
              <Icon className="w-4 h-4" />
          </div>
          <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">{title}</h3>
      </div>
  );

  return (
    <div className="flex-1 h-full flex flex-col bg-slate-50 overflow-hidden animate-in fade-in duration-500">
      {/* List Header */}
      <div className="bg-white px-8 py-6 border-b border-slate-200 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Database className="w-7 h-7" style={{ color: BRAND_PURPLE }} />
            Leader Directory
          </h1>
          <p className="text-sm text-slate-500 font-bold uppercase tracking-wider mt-1">Full management of pastoral accounts</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 w-full xl:w-auto">
            <div className="flex bg-slate-100 p-1 rounded-xl shadow-inner border border-slate-200/50">
                <button 
                  onClick={handleExportCSV}
                  className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  <Download className="w-3.5 h-3.5" /> Export CSV
                </button>
                <div className="w-px h-4 bg-slate-300 self-center mx-1" />
                <button 
                  onClick={() => csvInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 text-slate-600 hover:text-slate-900 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all"
                >
                  <Upload className="w-3.5 h-3.5" /> Bulk Import
                </button>
                <input type="file" ref={csvInputRef} onChange={handleImportCSV} accept=".csv" className="hidden" />
            </div>

            <button 
              onClick={handleDownloadTemplate}
              className="flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-sm"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" /> Template
            </button>

            <button 
              onClick={handleAddNew}
              className="flex items-center gap-2 px-6 py-3 text-white rounded-xl font-black text-sm shadow-lg shadow-indigo-100 hover:opacity-90 transition-all active:scale-95"
              style={{ backgroundColor: BRAND_PURPLE }}
            >
              <UserPlus className="w-5 h-5" />
              New Account
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col p-6 sm:p-8">
        {/* Import Summary Alert */}
        {importSummary && (
            <div className="mb-6 p-5 bg-white border border-emerald-100 rounded-3xl shadow-sm flex items-center justify-between animate-in slide-in-from-top-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-black text-slate-900 text-sm">Import Complete</h4>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                            {importSummary.new} New Added • {importSummary.updated} Updated • {importSummary.errors.length} Failures
                        </p>
                    </div>
                </div>
                {importSummary.errors.length > 0 && (
                    <button onClick={() => alert(importSummary.errors.join("\n"))} className="text-[10px] font-black text-red-600 uppercase border-b border-red-200">View Errors</button>
                )}
                <button onClick={() => setImportSummary(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X className="w-4 h-4" /></button>
            </div>
        )}

        <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200/60 flex-1 flex flex-col overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
             <div className="relative w-full sm:w-96">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search by name, email, MG code..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                />
             </div>
             {isBulkProcessing && (
                 <div className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-full">
                     <Loader2 className="w-3.5 h-3.5 animate-spin" />
                     <span className="text-[10px] font-black uppercase tracking-widest">Processing Bulk Data...</span>
                 </div>
             )}
          </div>

          <div className="flex-1 overflow-auto no-scrollbar">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead className="sticky top-0 bg-white z-10 border-b border-slate-100 shadow-sm">
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">MG Code / ID</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Leader Identity</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Roles</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Parent Link</th>
                  <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredLeaders.map((l) => (
                  <tr key={l.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-5">
                      <div className="font-black text-slate-900 text-sm flex items-center gap-2 uppercase">
                        {l.mgCode || '--'}
                        {l.isAdmin && <ShieldCheck className="w-3.5 h-3.5 text-indigo-50" />}
                      </div>
                      <div className="text-[10px] font-bold text-slate-400 uppercase mt-0.5">
                        {l.memberId || 'NO MEMBER ID'}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center text-slate-400 font-black text-xs border border-slate-200 overflow-hidden">
                            {l.avatarUrl ? <img src={l.avatarUrl} className="w-full h-full object-cover" /> : (l.chineseName?.charAt(0) || l.firstName?.charAt(0) || '?')}
                         </div>
                         <div>
                            <div className="font-black text-slate-900 text-sm leading-none mb-1">{l.chineseName || l.firstName}</div>
                            <div className="text-[10px] font-bold text-slate-500 lowercase flex items-center gap-1"><Mail className="w-2.5 h-2.5" /> {l.email}</div>
                         </div>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-black uppercase border ${l.status === 'active' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                            {l.status}
                        </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-wrap gap-1">
                        {l.roles && l.roles.length > 0 ? l.roles.map(role => (
                          <span key={role} className={`px-2 py-0.5 rounded text-[8px] font-black border uppercase ${ROLE_COLORS[role] || 'bg-slate-50 text-slate-400'}`}>
                            {role}
                          </span>
                        )) : '--'}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-800 truncate max-w-[120px]">{l.parentLeaderName || '--'}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                       <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => setSelectedLeaderForWA(l)} 
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-all"
                            title="Send WhatsApp"
                          >
                            <MessageSquare className="w-4 h-4" />
                          </button>
                          <button onClick={() => handleEdit(l)} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Edit2 className="w-4 h-4" /></button>
                          <button onClick={() => setShowDeleteConfirm(l.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"><Trash2 className="w-4 h-4" /></button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Status Update Reason Modal */}
      {pendingStatusChange && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" />
            <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 animate-in zoom-in-95">
                <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mb-6 mx-auto ${pendingStatusChange.target === 'active' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                    {pendingStatusChange.target === 'active' ? <UserCheck className="w-8 h-8" /> : <Ban className="w-8 h-8" />}
                </div>
                <h4 className="text-xl font-black text-slate-900 text-center mb-2">
                    {pendingStatusChange.target === 'active' ? '確認復牌 (Reinstate)' : '確認停牌 (Suspend)'}
                </h4>
                <p className="text-xs font-bold text-slate-400 text-center uppercase tracking-widest mb-6">請輸入異動原因以供備核</p>
                <textarea 
                    autoFocus
                    rows={3}
                    placeholder="例如：安息期結束、個人原因、行政處置..."
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:ring-4 focus:ring-slate-100 outline-none transition-all resize-none"
                />
                <div className="flex flex-col gap-2 mt-6">
                    <button 
                        onClick={handleStatusUpdate}
                        disabled={!statusReason.trim()}
                        className={`w-full py-4 text-white rounded-2xl font-black text-sm transition-all disabled:opacity-50 ${pendingStatusChange.target === 'active' ? 'bg-emerald-600' : 'bg-red-600'}`}
                    >
                        確認更新
                    </button>
                    <button onClick={() => setPendingStatusChange(null)} className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-sm">取消</button>
                </div>
            </div>
        </div>
      )}

      {/* Transfer Hierarchy Modal */}
      {transferringLeader && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setTransferringLeader(null)} />
          <div className="relative bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95">
              <div className="p-8 pb-4 flex justify-between items-start">
                  <div>
                      <h3 className="text-2xl font-black text-slate-900 tracking-tight">Transfer Hierarchy</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">
                        調動小組長: {transferringLeader.chineseName || transferringLeader.firstName} ({transferringLeader.mgCode})
                      </p>
                  </div>
                  <button onClick={() => setTransferringLeader(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><X className="w-6 h-6" /></button>
              </div>

              <div className="p-8 pt-4 space-y-8">
                  <div className="flex items-center justify-between p-6 bg-slate-50 rounded-3xl border border-slate-200">
                      <div className="text-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Current Parent</p>
                          <div className="px-4 py-2 bg-white border border-slate-200 rounded-xl font-bold text-sm text-slate-600">
                              {transferringLeader.parentLeaderName || 'Root (None)'}
                          </div>
                      </div>
                      <div className="flex flex-col items-center px-4">
                          <ArrowRight className="w-6 h-6 text-orange-500 animate-pulse" />
                      </div>
                      <div className="text-center">
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">New Destination</p>
                          <div className={`px-4 py-2 border rounded-xl font-bold text-sm transition-all ${newParentId ? 'bg-orange-600 text-white border-orange-600' : 'bg-slate-200 text-slate-400 border-transparent'}`}>
                              {newParentId ? (leaders.find(l => l.id === newParentId)?.chineseName || 'Root') : 'Select Below'}
                          </div>
                      </div>
                  </div>

                  <div className="space-y-6">
                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select New Parent Leader</label>
                          <div className="relative">
                              <select 
                                  value={newParentId} 
                                  onChange={(e) => setNewParentId(e.target.value)}
                                  className="w-full appearance-none p-4 bg-white border border-slate-200 rounded-2xl outline-none font-bold text-sm focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all cursor-pointer"
                              >
                                  <option value="">Move to Root (Top Level)</option>
                                  {leaders.filter(l => l.id !== transferringLeader.id && (l.roles.includes('族長') || l.roles.includes('小組長'))).map(l => (
                                      <option key={l.id} value={l.id}>{l.mgCode} - {l.chineseName || l.firstName}</option>
                                  ))}
                              </select>
                              <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                          </div>
                      </div>

                      <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reason for Transfer (Required)</label>
                          <textarea 
                              rows={3}
                              value={transferReason}
                              onChange={(e) => setTransferReason(e.target.value)}
                              placeholder="Describe why this leader is being moved..."
                              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium outline-none focus:ring-4 focus:ring-orange-500/10 focus:border-orange-500 transition-all resize-none"
                          />
                      </div>
                  </div>
              </div>

              <div className="p-8 border-t bg-slate-50/50 flex justify-end gap-3">
                  <button onClick={() => setTransferringLeader(null)} className="px-8 py-3 text-slate-600 font-bold text-sm">Cancel</button>
                  <button 
                      onClick={handleConfirmTransfer}
                      disabled={!transferReason.trim()}
                      className="px-10 py-3 bg-orange-600 text-white rounded-xl font-black text-sm shadow-xl shadow-orange-100 hover:bg-orange-700 transition-all active:scale-95 disabled:opacity-50"
                  >
                      Confirm Transfer
                  </button>
              </div>
          </div>
        </div>
      )}

      {/* Admin Edit Modal */}
      {isFormOpen && editingLeader && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={() => setIsFormOpen(false)} />
          <div className="relative bg-white w-full max-w-6xl h-[95vh] rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
             
             <div className="px-8 py-6 border-b flex justify-between items-center bg-white sticky top-0 z-10">
               <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                        <Database className="w-6 h-6" />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">
                            {editingLeader.email ? 'Edit Leader Account' : 'Register New Leader'}
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Comprehensive Profile Management</p>
                    </div>
               </div>
               <button onClick={() => setIsFormOpen(false)} className="p-2 hover:bg-slate-100 rounded-full text-slate-500 transition-colors"><X className="w-6 h-6" /></button>
             </div>
             
             <div className="p-10 overflow-y-auto no-scrollbar">
                <div className="max-w-4xl mx-auto">
                    <div className="flex flex-col items-center mb-12">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border-4 border-slate-50 shadow-xl bg-slate-100 flex items-center justify-center transition-all group-hover:brightness-90">
                                {editingLeader.avatarUrl ? (
                                    <img src={editingLeader.avatarUrl} className="w-full h-full object-cover" />
                                ) : (
                                    <User className="w-16 h-16 text-slate-300" />
                                )}
                            </div>
                            <div className="absolute -bottom-2 -right-2 bg-white text-indigo-600 p-2 rounded-2xl border border-slate-100 shadow-lg">
                                <Camera className="w-4 h-4" />
                            </div>
                            <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                        </div>
                    </div>

                    <SectionTitle title="1. Account Identity (身份)" icon={Tags} />
                    <div className="flex flex-wrap gap-4 mb-10">
                        {ROLE_OPTIONS.map(role => {
                            const isSelected = editingLeader.roles?.includes(role);
                            return (
                                <button
                                    key={role}
                                    onClick={() => toggleRole(role)}
                                    className={`px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest border transition-all ${isSelected ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-100' : 'bg-slate-50 border-slate-200 text-slate-400 hover:border-indigo-400 hover:bg-white'}`}
                                >
                                    {role}
                                </button>
                            );
                        })}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                        <div>
                            <SectionTitle title="2. Personal Data" icon={User} />
                            <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Chinese Name</label>
                                        <input type="text" value={editingLeader.chineseName} onChange={(e) => handleInputChange('chineseName', e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex justify-between">
                                            Member ID
                                            {isValidatingMember && <span className="text-indigo-600 animate-pulse text-[8px]">VALIDATING...</span>}
                                        </label>
                                        <input type="text" value={editingLeader.memberId} onChange={(e) => handleInputChange('memberId', e.target.value)} onBlur={() => {setIsValidatingMember(true); setTimeout(()=>setIsValidatingMember(false),800)}} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none" placeholder="e.g. M123" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">First Name</label>
                                        <input type="text" value={editingLeader.firstName} onChange={(e) => handleInputChange('firstName', e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Last Name</label>
                                        <input type="text" value={editingLeader.lastName} onChange={(e) => handleInputChange('lastName', e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none" />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nick Name</label>
                                        <input type="text" value={editingLeader.nickName} onChange={(e) => handleInputChange('nickName', e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none" />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Gender</label>
                                        <select value={editingLeader.gender} onChange={(e) => handleInputChange('gender', e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none">
                                            {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Age Range</label>
                                        <select value={editingLeader.ageRange} onChange={(e) => handleInputChange('ageRange', e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none">
                                            {PROFILE_AGE_RANGES.map(a => <option key={a} value={a}>{a}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Marriage Status</label>
                                        <select value={editingLeader.marriageStatus} onChange={(e) => handleInputChange('marriageStatus', e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none">
                                            {MARRIAGE_STATUSES.map(m => <option key={m} value={m}>{m}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Occupation</label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input type="text" value={editingLeader.occupation} onChange={(e) => handleInputChange('occupation', e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none" placeholder="Your profession" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div>
                            <SectionTitle title="3. Communication" icon={Mail} />
                            <div className="space-y-6">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Email Address</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input type="email" value={editingLeader.email} onChange={(e) => handleInputChange('email', e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none" />
                                    </div>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Phone Number</label>
                                    <div className="relative">
                                        <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                        <input type="tel" value={editingLeader.phoneNumber} onChange={(e) => handleInputChange('phoneNumber', e.target.value)} className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none" />
                                    </div>
                                </div>

                                <SectionTitle title="4. System Control" icon={ShieldCheck} />
                                <div className="space-y-4">
                                    <label className="flex items-center justify-between p-4 bg-slate-50 border border-slate-100 rounded-2xl cursor-pointer hover:bg-white transition-all">
                                        <div className="flex items-center gap-3">
                                            <ShieldAlert className={`w-5 h-5 ${editingLeader.isAdmin ? 'text-indigo-600' : 'text-slate-300'}`} />
                                            <div>
                                                <div className="text-xs font-black text-slate-800">Admin Privileges</div>
                                                <div className="text-[9px] font-bold text-slate-400 uppercase">Organization View</div>
                                            </div>
                                        </div>
                                        <input type="checkbox" checked={editingLeader.isAdmin || false} onChange={(e) => handleInputChange('isAdmin', e.target.checked)} className="w-5 h-5 rounded border-slate-300 text-indigo-600" />
                                    </label>

                                    <div className="flex bg-slate-100 p-1.5 rounded-2xl">
                                        <button 
                                            onClick={() => editingLeader.status !== 'active' && setPendingStatusChange({ id: editingLeader.id, target: 'active' })} 
                                            className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${editingLeader.status === 'active' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-400 hover:text-emerald-400'}`}
                                        >
                                            Active (復牌)
                                        </button>
                                        <button 
                                            onClick={() => editingLeader.status !== 'disabled' && setPendingStatusChange({ id: editingLeader.id, target: 'disabled' })} 
                                            className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${editingLeader.status === 'disabled' ? 'bg-white text-red-50 shadow-sm' : 'text-slate-400 hover:text-red-400'}`}
                                        >
                                            Disabled (停牌)
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <SectionTitle title="5. Ministry & Hierarchy" icon={Network} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Parent Leader (所屬組長)</label>
                                    {!editingLeader.id.startsWith('new-') && (
                                        <button 
                                            onClick={() => setTransferringLeader(editingLeader)}
                                            className="p-1.5 bg-orange-50 text-orange-600 rounded-lg hover:bg-orange-600 hover:text-white transition-all group"
                                            title="Transfer Hierarchy (調動)"
                                        >
                                            <MoveHorizontal className="w-3.5 h-3.5" />
                                        </button>
                                    )}
                                </div>
                                <div className="relative">
                                    <select 
                                        disabled={!editingLeader.id.startsWith('new-')}
                                        value={editingLeader.parentLeaderId || ''} 
                                        onChange={(e) => handleParentChange(e.target.value)}
                                        className={`w-full appearance-none p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none font-bold text-sm transition-all ${!editingLeader.id.startsWith('new-') ? 'cursor-not-allowed opacity-70' : 'focus:ring-4 focus:ring-indigo-500/10 cursor-pointer'}`}
                                    >
                                        <option value="">None (Root Leader)</option>
                                        {leaders.filter(l => l.id !== editingLeader.id).map(l => (
                                            <option key={l.id} value={l.id}>{l.mgCode} - {l.chineseName || l.firstName}</option>
                                        ))}
                                    </select>
                                    {editingLeader.id.startsWith('new-') && <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />}
                                </div>
                            </div>

                            {showLeadershipFields ? (
                                <div className="space-y-6 p-6 bg-blue-50/50 rounded-[2rem] border border-blue-100/50 animate-in zoom-in-95 duration-300">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">MG Code</label>
                                            <input type="text" value={editingLeader.mgCode} onChange={(e) => handleInputChange('mgCode', e.target.value.toUpperCase())} className="w-full p-3.5 bg-white border border-blue-200 rounded-xl font-bold text-sm outline-none" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Generation</label>
                                            <input type="number" value={editingLeader.generation} onChange={(e) => handleInputChange('generation', parseInt(e.target.value))} className="w-full p-3.5 bg-white border border-blue-200 rounded-xl font-bold text-sm outline-none" />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Ordination Date</label>
                                        <input type="date" value={editingLeader.ordinationDate} onChange={(e) => handleInputChange('ordinationDate', e.target.value)} className="w-full p-3.5 bg-white border border-blue-200 rounded-xl font-bold text-sm outline-none" />
                                    </div>
                                </div>
                            ) : (
                                <div className="p-8 bg-slate-50 border border-slate-100 border-dashed rounded-[2rem] text-center">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Leadership fields appear for '小組長' identity.</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-6">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Identity (身份屬性)</label>
                                <input type="text" value={editingLeader.identity} onChange={(e) => handleInputChange('identity', e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none" placeholder="e.g. Intern, Professional" />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recommend Team?</label>
                                    <select value={editingLeader.recommendTeamMembers} onChange={(e) => handleInputChange('recommendTeamMembers', e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none">
                                        {YES_NO.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Emotional Issues?</label>
                                    <select value={editingLeader.pastorEmotionalIssues} onChange={(e) => handleInputChange('pastorEmotionalIssues', e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none">
                                        {YES_NO.map(y => <option key={y} value={y}>{y}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Special Condition member</label>
                                <select value={editingLeader.specialConditionMember} onChange={(e) => handleInputChange('specialConditionMember', e.target.value)} className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-sm outline-none">
                                    {SPECIAL_CONDITIONS.map(s => <option key={s} value={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <SectionTitle title="6. Ministry Journey (牧養歷程時間軸)" icon={TrendingUp} />
                    <div className="mt-8 space-y-0 relative before:content-[''] before:absolute before:left-4 sm:before:left-1/2 before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100">
                        {getTimelineEvents(editingLeader).length > 0 ? getTimelineEvents(editingLeader).map((event, idx) => (
                            <div key={`${event.type}-${idx}`} className="relative mb-12 last:mb-0">
                                <div className={`absolute left-4 sm:left-1/2 -translate-x-1/2 top-0 w-8 h-8 rounded-full border-4 border-white shadow-md z-10 flex items-center justify-center ${event.color}`}>
                                    <event.icon className="w-4 h-4" />
                                </div>
                                <div className={`absolute left-16 sm:left-auto sm:right-[calc(50%+2rem)] top-0 pt-1 text-right hidden sm:block`}>
                                    <div className="text-xs font-black text-slate-900 tracking-tight">{event.date}</div>
                                    {event.actor && <div className="text-[9px] font-bold text-slate-400 uppercase">By {event.actor}</div>}
                                </div>
                                <div className={`ml-16 sm:ml-0 sm:w-[calc(50%-2rem)] transition-all hover:scale-[1.01]`}>
                                    <div className={`p-5 rounded-3xl border shadow-sm ${idx % 2 === 0 ? 'bg-white border-slate-100' : 'bg-slate-50/50 border-slate-100'} ${event.type === 'status' && event.title.includes('停牌') ? 'border-red-100' : ''}`}>
                                        <div className="sm:hidden text-[9px] font-black text-slate-400 uppercase mb-1">{event.date} {event.actor ? `• By ${event.actor}` : ''}</div>
                                        <div className="text-sm font-black text-slate-900">{event.title}</div>
                                        <p className="text-[11px] font-medium text-slate-600 mt-1 leading-relaxed italic">
                                            {event.subtitle}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="py-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs relative z-10 bg-white/80 rounded-[2.5rem]">
                                <History className="w-12 h-12 opacity-10 mx-auto mb-4" />
                                沒有相關歷程紀錄
                            </div>
                        )}
                    </div>

                    <div className="mt-16 pt-10 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
                        <div className="bg-[#0B1120] p-8 rounded-[2.5rem] text-white shadow-2xl relative overflow-hidden group">
                            <div className="flex justify-between items-center relative z-10">
                                <div>
                                    <label className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">Secret Credential</label>
                                    <div className="text-2xl font-black tracking-[0.3em] mt-2 font-mono">
                                        {showPassword ? editingLeader.password : '••••••'}
                                    </div>
                                </div>
                                <button onClick={() => setShowPassword(!showPassword)} className="p-3 bg-white/10 hover:bg-white/20 rounded-2xl transition-all">
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 p-6 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100">
                            <div className="p-3 bg-indigo-600 text-white rounded-2xl">
                                <Send className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Auto-Workflow</p>
                                <p className="text-[9px] font-bold text-indigo-500 uppercase mt-1">Saves Audit Log & Notifies Leader</p>
                            </div>
                        </div>
                    </div>
                </div>
             </div>

             <div className="p-8 border-t bg-slate-50/50 flex justify-end gap-3 sticky bottom-0 z-10">
               <button onClick={() => setIsFormOpen(false)} className="px-10 py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-sm transition-all hover:bg-slate-100">Cancel</button>
               <button onClick={handleSave} className="px-12 py-4 text-white rounded-2xl font-black text-sm shadow-xl shadow-indigo-100 hover:opacity-90 transition-all flex items-center gap-3 active:scale-95" style={{ backgroundColor: BRAND_PURPLE }}>
                 <Check className="w-5 h-5 stroke-[4]" /> Save All Updates
               </button>
             </div>
          </div>
        </div>
      )}

      {/* WhatsApp Template Modal */}
      {selectedLeaderForWA && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 sm:p-4">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300" onClick={() => setSelectedLeaderForWA(null)} />
              <div className="relative bg-white w-full max-md rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
                  <div className="p-8 pb-6">
                      <div className="flex justify-between items-start mb-6">
                          <div>
                              <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#25D366]/10 text-[#25D366] rounded-full text-[10px] font-black uppercase tracking-widest mb-2">
                                  <MessageSquare className="w-3 h-3 fill-current" /> WhatsApp Reminder
                              </div>
                              <h3 className="text-2xl font-black text-slate-900 tracking-tight">選擇訊息範本</h3>
                              <p className="text-xs font-bold text-slate-400 mt-1 uppercase tracking-wider">To: {selectedLeaderForWA.chineseName || selectedLeaderForWA.firstName}</p>
                          </div>
                          <button onClick={() => setSelectedLeaderForWA(null)} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 transition-all"><X className="w-6 h-6" /></button>
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
                                  <div className="absolute right-4 bottom-4 opacity-0 group-hover:opacity-100 transition-opacity"><ExternalLink className="w-4 h-4 text-[#25D366]" /></div>
                              </button>
                          ))}
                      </div>
                  </div>
                  <div className="p-8 bg-slate-50 border-t border-slate-100 text-center">
                       <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Message will open in WhatsApp Web/App</p>
                  </div>
              </div>
          </div>
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowDeleteConfirm(null)} />
          <div className="relative bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl p-8 text-center animate-in zoom-in-95 duration-300">
            <div className="w-20 h-20 bg-red-50 text-red-600 rounded-3xl flex items-center justify-center mx-auto mb-6"><ShieldAlert className="w-10 h-10" /></div>
            <h4 className="text-2xl font-black text-slate-900 mb-2">Delete Account?</h4>
            <p className="text-slate-500 font-medium mb-8">Irreversible action removing user data from directory.</p>
            <div className="flex flex-col gap-3">
              <button onClick={() => { onDeleteLeader(showDeleteConfirm); setShowDeleteConfirm(null); }} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black text-sm hover:bg-red-700 transition-all shadow-lg shadow-red-100">Confirm Removal</button>
              <button onClick={() => setShowDeleteConfirm(null)} className="w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-sm hover:bg-slate-200 transition-all">Keep Account</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeaderManagement;
