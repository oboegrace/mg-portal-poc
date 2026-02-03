
import React, { useState, useEffect, useMemo } from 'react';
import { Menu } from 'lucide-react';
import { MOCK_LEADERS, MOCK_MEMBERS } from './components/constants';
import { CellLeader, FilterState, CellGroup, Report, GroupCategory, CellMember } from './types';
import FilterDrawer from './components/FilterDrawer';
import Sidebar from './components/Sidebar';
import LeaderList from './components/LeaderList';
import LeaderDetail from './components/LeaderDetail';
import GroupSettings from './components/GroupSettings';
import GroupSelector from './components/GroupSelector';
import ProfileSettings from './components/ProfileSettings';
import AdminDashboard from './components/AdminDashboard';
import LeaderManagement from './components/LeaderManagement';
import TribeStatistics from './components/TribeStatistics';
import ReportingStatus from './components/ReportingStatus';
import PastoralEvaluation from './components/PastoralEvaluation';
import LineagePhotoView from './components/LineagePhotoView';
import MemberManagement from './components/MemberManagement';
import MemberSelfRegistration from './components/MemberSelfRegistration';
import Login from './components/Login';

// Translation Dictionary
export const translations = {
  en: {
    myGroups: 'My Groups',
    memberDirectory: 'Member Directory',
    descendantGroups: 'Descendant Groups',
    orgInsight: 'Organization Insight',
    tribeStats: 'Tribe Statistics',
    lineagePhoto: 'Lineage Photo View',
    pastoralEval: 'Pastoral Evaluation',
    reportingStatus: 'Reporting Status',
    leaderMgmt: 'Leader Management',
    settings: 'Cell Group Settings',
    notifications: 'Notifications',
    logout: 'Logout',
    language: 'Language',
    createGroup: 'Create Cell Group',
    manageGroups: 'Manage Groups',
    newReport: 'New Report',
    groupInfo: 'Group Info',
    allRecords: 'All Records',
    noReports: 'No reports found.',
    loading: 'Loading...',
    welcome: 'Welcome',
    joinGroup: 'Join Cell Group',
    requestAccess: 'Request Access',
    newLeader: 'New leader?',
    signIn: 'Sign In',
    email: 'Email',
    phone: 'Phone',
    password: 'Password',
    rememberMe: 'Remember Me',
    forgotPassword: 'Forgot Password?',
    authenticating: 'Authenticating...',
    switchLang: '中文',
    // Group Settings & Selector
    configuredGroups: 'Configured Groups',
    ministryActions: 'Ministry Actions',
    selectToConfigure: 'Select a formal group to configure or create a new one.',
    basicConfig: 'Basic Configuration',
    logistics: 'Logistics',
    demoService: 'Demographics & Service',
    dangerZone: 'Danger Zone',
    saveChanges: 'Save Changes',
    category: 'Category',
    nameSuffix: 'Name Suffix (e.g. Youth, A)',
    pastorZone: 'Pastor Zone',
    frequency: 'Frequency',
    groupType: 'Group Type',
    meetingDay: 'Meeting Day',
    meetingTime: 'Meeting Time',
    location: 'Location',
    languages: 'Languages',
    attendingService: 'Attending Service',
    regularMemberRange: 'Regular Member Range',
    ageRanges: 'Age Ranges',
    deleteGroupTitle: 'Delete this Cell Group?',
    deleteGroupDesc: 'This will permanently remove the group and all its attendance records. This cannot be undone.',
    deletePermanently: 'Delete Permanently',
    confirmDeletion: 'Confirm Deletion',
    confirmDeletionDesc: 'Are you absolutely sure? You are about to remove this group from your active list.',
    cancel: 'Cancel'
  },
  zh: {
    myGroups: '我的小組',
    memberDirectory: '門徒名錄',
    descendantGroups: '族系小組',
    orgInsight: '機構洞察',
    tribeStats: '族系統計',
    lineagePhoto: '族系相簿',
    pastoralEval: '牧養評核',
    reportingStatus: '報表狀態',
    leaderMgmt: '組長管理',
    settings: '小組設定',
    notifications: '系統通知',
    logout: '登出系統',
    language: '切換語言',
    createGroup: '建立新小組',
    manageGroups: '管理小組',
    newReport: '提交報表',
    groupInfo: '小組資料',
    allRecords: '所有紀錄',
    noReports: '暫無報表紀錄',
    loading: '載入中...',
    welcome: '歡迎',
    joinGroup: '加入小組',
    requestAccess: '申請權限',
    newLeader: '新組長？',
    signIn: '登入',
    email: '電子郵件',
    phone: '電話號碼',
    password: '密碼',
    rememberMe: '記住我',
    forgotPassword: '忘記密碼？',
    authenticating: '認證中...',
    switchLang: 'English',
    // Group Settings & Selector
    configuredGroups: '已設定小組',
    ministryActions: '服事操作',
    selectToConfigure: '選擇一個現有小組進行設定，或建立新小組。',
    basicConfig: '基本配置',
    logistics: '開組資料',
    demoService: '對象與崇拜',
    dangerZone: '危險區域',
    saveChanges: '儲存更動',
    category: '小組類別',
    nameSuffix: '小組名稱後綴 (例如：青年、A組)',
    pastorZone: '牧區',
    frequency: '開組頻率',
    groupType: '對象群體',
    meetingDay: '開組日子',
    meetingTime: '開組時間',
    location: '開組地點',
    languages: '使用語言',
    attendingService: '參與崇拜',
    regularMemberRange: '穩定人數範圍',
    ageRanges: '年齡層',
    deleteGroupTitle: '刪除此小組？',
    deleteGroupDesc: '這將永久移除此小組及其所有出席紀錄，此操作無法撤銷。',
    deletePermanently: '確認永久刪除',
    confirmDeletion: '確認刪除',
    confirmDeletionDesc: '您確定要刪除嗎？這將從小組清單中移除此小組。',
    cancel: '取消'
  }
};

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState('my-groups'); 
  
  // Language State
  const [language, setLanguage] = useState<'en' | 'zh'>(() => {
    const saved = localStorage.getItem('app_language');
    return (saved === 'en' || saved === 'zh') ? saved : 'en';
  });

  const t = translations[language];

  // Data State
  const [leaders, setLeaders] = useState<CellLeader[]>(MOCK_LEADERS);
  const [members, setMembers] = useState<CellMember[]>(MOCK_MEMBERS);

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<CellLeader | null>(null);

  // Settings Logic State
  const [settingsGroup, setSettingsGroup] = useState<CellGroup | null>(null);
  const [isSettingsMode, setIsSettingsMode] = useState<'list' | 'edit' | 'create' | null>(null);
  const [preSelectedCategory, setPreSelectedCategory] = useState<GroupCategory | null>(null);

  // Selection State for Descendant View
  const [selectedLeader, setSelectedLeader] = useState<CellLeader | null>(null);
  
  // Filter State
  const [filters, setFilters] = useState<FilterState>({
    generations: [],
    zones: [],
    days: []
  });

  const handleLanguageToggle = () => {
    const newLang = language === 'en' ? 'zh' : 'en';
    setLanguage(newLang);
    localStorage.setItem('app_language', newLang);
  };

  // Role check for menu visibility
  const canSeeDescendantGroups = useMemo(() => {
    if (!currentUser) return false;
    return currentUser.roles.includes('族長') || currentUser.roles.includes('小組長');
  }, [currentUser]);

  const visibleMembers = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.isAdmin) return members;
    const lineageLeaders = leaders.filter(l => l.mgCode.startsWith(currentUser.mgCode));
    const authorizedGroupIds = new Set(lineageLeaders.flatMap(l => l.groups.filter(g => !g.isDeleted).map(g => g.id)));
    return members.filter(m => m.groupIds.some(gid => authorizedGroupIds.has(gid)));
  }, [members, currentUser, leaders]);

  useEffect(() => {
    const savedUser = localStorage.getItem('remembered_user');
    if (savedUser) {
        try {
            const user = JSON.parse(savedUser);
            const updatedUser = leaders.find(l => l.id === user.id) || user;
            setCurrentUser(updatedUser);
            setIsAuthenticated(true);
            setCurrentView('my-groups');
        } catch (e) {
            localStorage.removeItem('remembered_user');
        }
    }
  }, []);

  const handleLoginSuccess = (leader: CellLeader) => {
    setCurrentUser(leader);
    setIsAuthenticated(true);
    setCurrentView('my-groups');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setSelectedLeader(null);
    setCurrentView('my-groups');
    localStorage.removeItem('remembered_user');
  };

  const handleViewChange = (view: string) => {
    if (view === 'group-settings') {
        if (!currentUser) return;
        setIsSettingsMode('list');
    } else if (view === 'create-group') {
        setSettingsGroup(null);
        setIsSettingsMode('create');
        view = 'group-settings';
    } else {
        setIsSettingsMode(null);
        setSettingsGroup(null);
        setPreSelectedCategory(null);
    }
    setCurrentView(view);
    setIsSidebarOpen(false);
  };

  const updateAllState = (updatedUser: CellLeader) => {
    setCurrentUser(updatedUser);
    setLeaders(prev => {
        const exists = prev.some(l => l.id === updatedUser.id);
        if (exists) {
            return prev.map(l => l.id === updatedUser.id ? updatedUser : l);
        }
        return [updatedUser, ...prev];
    });
    if (localStorage.getItem('remembered_user')) {
        localStorage.setItem('remembered_user', JSON.stringify(updatedUser));
    }
  };

  const handleAddReport = (groupId: string, report: Report) => {
    if (!currentUser) return;
    const updatedGroups = currentUser.groups.map(g => 
        g.id === groupId ? { ...g, reports: [report, ...g.reports] } : g
    );
    updateAllState({ ...currentUser, groups: updatedGroups });
  };

  const handleUpdateReport = (groupId: string, reportId: string, updatedReport: Report) => {
    if (!currentUser) return;
    const updatedGroups = currentUser.groups.map(g => 
        g.id === groupId ? { ...g, reports: g.reports.map(r => r.id === reportId ? updatedReport : r) } : g
    );
    updateAllState({ ...currentUser, groups: updatedGroups });
  };

  const handleDeleteReport = (groupId: string, reportId: string) => {
    if (!currentUser) return;
    const updatedGroups = currentUser.groups.map(g => 
        g.id === groupId ? { ...g, reports: g.reports.filter(r => r.id !== reportId) } : g
    );
    updateAllState({ ...currentUser, groups: updatedGroups });
  };

  const handleAddMember = (member: CellMember) => {
    setMembers(prev => [member, ...prev]);
  };

  const handleUpdateMember = (member: CellMember) => {
    setMembers(prev => prev.map(m => m.id === member.id ? member : m));
  };

  const handleDeleteMember = (memberId: string) => {
    setMembers(prev => prev.filter(m => m.id !== memberId));
  };

  const handleBulkUpdateLeaders = (updatedLeaders: CellLeader[]) => {
    setLeaders(prev => {
        const leaderMap = new Map(prev.map(l => [l.id, l]));
        updatedLeaders.forEach(l => leaderMap.set(l.id, l));
        const newList = Array.from(leaderMap.values());
        if (currentUser) {
            const foundSelf = updatedLeaders.find(l => l.id === currentUser.id);
            if (foundSelf) setCurrentUser(foundSelf);
        }
        return newList;
    });
  };

  const getHeaderTitle = () => {
      switch(currentView) {
          case 'my-groups': return t.myGroups;
          case 'group-settings': return isSettingsMode === 'create' ? t.createGroup : t.settings;
          case 'descendant-groups': return t.descendantGroups;
          case 'profile-settings': return 'Profile Settings';
          case 'admin-dashboard': return t.orgInsight;
          case 'leader-management': return t.leaderMgmt;
          case 'tribe-statistics': return t.tribeStats;
          case 'reporting-status': return t.reportingStatus;
          case 'pastoral-evaluation': return t.pastoralEval;
          case 'lineage-photo-view': return t.lineagePhoto;
          case 'member-directory': return t.memberDirectory;
          case 'self-registration': return t.joinGroup;
          default: return 'Shepherd View';
      }
  };

  if (currentView === 'self-registration') {
    return <MemberSelfRegistration onComplete={(newMember) => { handleAddMember(newMember); setCurrentView('login'); }} onCancel={() => setCurrentView('login')} />;
  }

  if (!isAuthenticated || !currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} leaders={leaders} language={language} onLanguageToggle={handleLanguageToggle} />;
  }

  return (
    <div className="flex h-screen bg-white overflow-hidden font-sans">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
        currentView={currentView}
        onChangeView={handleViewChange}
        user={currentUser}
        onEditGroup={(g) => { setSettingsGroup(g); setIsSettingsMode('edit'); setCurrentView('group-settings'); }}
        onLogout={handleLogout}
        activeSubItemId={settingsGroup?.id}
        hasDescendants={canSeeDescendantGroups}
        language={language}
        onLanguageToggle={handleLanguageToggle}
      />
      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
        <div className="lg:hidden h-14 bg-white border-b border-slate-200 flex items-center px-4 flex-shrink-0 z-20 no-print">
          <button onClick={() => setIsSidebarOpen(true)} className="p-2 -ml-2 mr-2 text-slate-600 hover:bg-slate-100 rounded-lg"><Menu className="w-6 h-6" /></button>
          <span className="font-bold text-lg text-slate-800">{getHeaderTitle()}</span>
        </div>
        <div className="flex-1 flex overflow-hidden">
          {currentView === 'my-groups' && (
             <div className="flex-1 bg-white h-full overflow-hidden">
                <LeaderDetail 
                  leader={currentUser} 
                  canEdit={true} 
                  showMobileBack={false} 
                  onAddReport={handleAddReport} 
                  onUpdateReport={handleUpdateReport}
                  onDeleteReport={handleDeleteReport}
                  onAddGroup={(g) => updateAllState({ ...currentUser, groups: [...currentUser.groups, g] })}
                  onRedirectToSettings={(cat) => { setPreSelectedCategory(cat); setIsSettingsMode('create'); setCurrentView('group-settings'); }}
                  onEditGroupSettings={(g) => { setSettingsGroup(g); setIsSettingsMode('edit'); setCurrentView('group-settings'); }}
                  onOpenSettingsList={() => handleViewChange('group-settings')}
                  allMembers={visibleMembers}
                  allLeaders={leaders}
                  onAddMember={handleAddMember}
                  language={language}
                />
             </div>
          )}
          {currentView === 'member-directory' && (
            <div className="flex-1 bg-white h-full overflow-hidden">
                <MemberManagement 
                  currentUser={currentUser}
                  members={visibleMembers}
                  onAddMember={handleAddMember}
                  onUpdateMember={handleUpdateMember}
                  onDeleteMember={handleDeleteMember}
                  language={language}
                />
            </div>
          )}
          {currentView === 'profile-settings' && (
              <div className="flex-1 bg-white h-full overflow-hidden">
                <ProfileSettings user={currentUser} onSave={updateAllState} onCancel={() => setCurrentView('my-groups')} />
              </div>
          )}
          {currentView === 'admin-dashboard' && (
              <div className="flex-1 bg-white h-full overflow-hidden">
                <AdminDashboard user={currentUser} allLeaders={leaders} />
              </div>
          )}
          {currentView === 'tribe-statistics' && (
              <div className="flex-1 bg-white h-full overflow-hidden">
                <TribeStatistics allLeaders={leaders} />
              </div>
          )}
          {currentView === 'reporting-status' && (
              <div className="flex-1 bg-white h-full overflow-hidden">
                <ReportingStatus allLeaders={leaders} currentUser={currentUser} />
              </div>
          )}
          {currentView === 'pastoral-evaluation' && (
              <div className="flex-1 bg-white h-full overflow-hidden">
                <PastoralEvaluation leaders={leaders} />
              </div>
          )}
          {currentView === 'lineage-photo-view' && (
              <div className="flex-1 bg-white h-full overflow-hidden">
                <LineagePhotoView allLeaders={leaders} />
              </div>
          )}
          {currentView === 'leader-management' && (
              <div className="flex-1 bg-white h-full overflow-hidden">
                <LeaderManagement 
                  leaders={leaders} 
                  onSaveLeader={(l) => setLeaders(prev => {
                    const exists = prev.some(ex => ex.id === l.id);
                    if (exists) {
                        return prev.map(ex => ex.id === l.id ? l : ex);
                    } else {
                        return [l, ...prev];
                    }
                  })} 
                  onBulkSaveLeaders={handleBulkUpdateLeaders}
                  onDeleteLeader={(id) => setLeaders(prev => prev.filter(l => l.id !== id))} 
                  currentUser={currentUser} 
                />
              </div>
          )}
          {currentView === 'group-settings' && (
              <div className="flex-1 bg-white h-full overflow-hidden">
                  {isSettingsMode === 'list' && (
                      <GroupSelector leader={currentUser} language={language} onSelectGroup={(g) => { setSettingsGroup(g); setIsSettingsMode('edit'); }} onCreateNew={() => { setSettingsGroup(null); setIsSettingsMode('create'); }} />
                  )}
                  {(isSettingsMode === 'edit' || isSettingsMode === 'create') && (
                      <GroupSettings 
                        leader={currentUser} 
                        language={language}
                        existingGroup={settingsGroup} 
                        initialCategory={preSelectedCategory}
                        onSave={(g) => {
                            let updatedGroups = [...currentUser.groups];
                            if (isSettingsMode === 'create') updatedGroups.push(g);
                            else updatedGroups = updatedGroups.map(ex => ex.id === g.id ? g : ex);
                            updateAllState({ ...currentUser, groups: updatedGroups });
                            setCurrentView('my-groups');
                        }} 
                        onDelete={(id) => {
                            const updatedGroups = currentUser.groups.map(g => g.id === id ? { ...g, isDeleted: true } : g);
                            updateAllState({ ...currentUser, groups: updatedGroups });
                            setCurrentView('my-groups');
                        }}
                        onCancel={() => { 
                            const formalGroups = currentUser.groups.filter(g => !g.isDeleted && (g.category === 'open_cell' || g.category === 'disciple_cell'));
                            if (formalGroups.length > 1) setIsSettingsMode('list'); 
                            else setCurrentView('my-groups');
                        }} 
                      />
                  )}
              </div>
          )}
          {currentView === 'descendant-groups' && (
            <>
              <div className={`w-full lg:w-[380px] flex-shrink-0 bg-white z-10 ${selectedLeader ? 'hidden lg:block' : 'block'}`}>
                <LeaderList leaders={leaders} currentUser={currentUser} searchQuery={searchQuery} setSearchQuery={setSearchQuery} filters={filters} onOpenFilter={() => setIsFilterOpen(true)} selectedLeaderId={selectedLeader?.mgCode || null} onSelectLeader={setSelectedLeader} />
              </div>
              <div className={`flex-1 bg-white h-full overflow-hidden ${selectedLeader ? 'block fixed inset-0 z-30 lg:static lg:z-auto bg-white' : 'hidden lg:flex'}`}>
                 <LeaderDetail leader={selectedLeader} onBack={() => setSelectedLeader(null)} canEdit={false} showMobileBack={true} allMembers={visibleMembers} allLeaders={leaders} onAddMember={handleUpdateMember} language={language} />
              </div>
            </>
          )}
        </div>
      </div>
      <FilterDrawer isOpen={isFilterOpen} onClose={() => setIsFilterOpen(false)} filters={filters} setFilters={setFilters} />
    </div>
  );
};

export default App;
