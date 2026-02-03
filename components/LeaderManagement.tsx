
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

  // Robust CSV Parser Helper
  const parseCSVLine = (line: string) => {
    const result = [];
    let curValue = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(curValue.trim());
            curValue = "";
        } else {
            curValue += char;
        }
    }
    result.push(curValue.trim());
    return result;
  };

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
            setImportSummary({ new: 0, updated: 0, errors: ["CSV file is empty or missing headers."] });
            return;
        }

        // Handle Headers - Case insensitive and trim spaces
        const rawHeaders = parseCSVLine(lines[0]);
        const headerMap: Record<string, number> = {};
        rawHeaders.forEach((h, idx) => {
            headerMap[h.toLowerCase().trim()] = idx;
        });

        // Verification of minimum required fields
        if (headerMap['email'] === undefined || (headerMap['firstname'] === undefined && headerMap['firstname'] === undefined)) {
            setIsBulkProcessing(false);
            setImportSummary({ new: 0, updated: 0, errors: ["Missing critical headers: 'email' and 'firstName' are required."] });
            return;
        }

        const importedLeaders: CellLeader[] = [];
        let newCount = 0;
        let updateCount = 0;
        let errorLogs: string[] = [];

        for (let i = 1; i < lines.length; i++) {
            const values = parseCSVLine(lines[i]);
            
            // Map values back to keys using our map
            const getVal = (key: string) => {
                const idx = headerMap[key.toLowerCase()];
                return idx !== undefined ? values[idx] : "";
            };

            const email = getVal('email');
            const firstName = getVal('firstName') || getVal('firstname'); // common typo
            
            if (!email) {
                errorLogs.push(`Row ${i + 1}: Skip - Email is missing.`);
                continue;
            }

            // Find existing
            const existing = leaders.find(l => l.email.toLowerCase() === email.toLowerCase());
            
            if (existing) updateCount++;
            else newCount++;

            const leaderData: CellLeader = {
                id: existing?.id || `l-imp-${Date.now()}-${i}`,
                personId: existing?.personId || `p-imp-${Date.now()}-${i}`,
                mgCode: getVal('mgCode'),
                memberId: getVal('memberId'),
                chineseName: getVal('chineseName'),
                firstName: firstName || "",
                lastName: getVal('lastName'),
                email: email,
                phoneNumber: getVal('phoneNumber'),
                roles: getVal('roles').split(";").map(r => r.trim()).filter(r => r.length > 0),
                parentLeaderName: getVal('parentLeaderName'),
                ordinationDate: getVal('ordinationDate'),
                generation: parseInt(getVal('generation')) || 1,
                status: (getVal('status').toLowerCase() as AccountStatus) || "active",
                identity: getVal('identity'),
                password: existing?.password || "611" + Math.floor(100 + Math.random() * 900),
                tribeCode: getVal('mgCode') ? getVal('mgCode').slice(0, 2) : (existing?.tribeCode || ""),
                groups: existing?.groups || [],
                transferHistory: existing?.transferHistory || [],
                statusHistory: existing?.statusHistory || [],
                followUpRecords: existing?.followUpRecords || []
            };
            importedLeaders.push(leaderData);
        }

        if (importedLeaders.length > 0) {
            onBulkSaveLeaders(importedLeaders);
        }
        
        setImportSummary({ new: newCount, updated: updateCount, errors: errorLogs });
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