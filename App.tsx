
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

const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentView, setCurrentView] = useState('my-groups'); 
  
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

  // Calculate if current user has any descendants
  const hasDescendants = useMemo(() => {
    if (!currentUser) return false;
    return leaders.some(l => 
      l.mgCode.startsWith(currentUser.mgCode) && 
      l.mgCode.length > currentUser.mgCode.length
    );
  }, [currentUser, leaders]);

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
    setLeaders(prev => prev.map(l => l.id === updatedUser.id ? updatedUser : l));
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
        
        // Update currentUser if they were part of the bulk update
        if (currentUser) {
            const foundSelf = updatedLeaders.find(l => l.id === currentUser.id);
            if (foundSelf) setCurrentUser(foundSelf);
        }
        
        return newList;
    });
  };

  const getHeaderTitle = () => {
      switch(currentView) {
          case 'my-groups': return 'My Groups';
          case 'group-settings': return isSettingsMode === 'create' ? 'Create Group' : 'Cell Group Settings';
          case 'descendant-groups': return 'Descendant Groups';
          case 'profile-settings': return 'Profile Settings';
          case 'admin-dashboard': return 'Organization Insight';
          case 'leader-management': return 'Leader Management';
          case 'tribe-statistics': return 'Tribe Statistics';
          case 'reporting-status': return 'Reporting Status';
          case 'pastoral-evaluation': return 'Pastoral Evaluation';
          case 'lineage-photo-view': return 'Lineage Photo View';
          case 'member-directory': return 'Member Directory';
          case 'self-registration': return 'Join Cell Group';
          default: return 'Shepherd View';
      }
  };

  if (currentView === 'self-registration') {
    return <MemberSelfRegistration onComplete={(newMember) => { handleAddMember(newMember); setCurrentView('login'); }} onCancel={() => setCurrentView('login')} />;
  }

  if (!isAuthenticated || !currentUser) {
    return <Login onLoginSuccess={handleLoginSuccess} leaders={leaders} />;
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
        hasDescendants={hasDescendants}
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
                  allMembers={members}
                  allLeaders={leaders}
                  onAddMember={handleAddMember}
                />
             </div>
          )}
          {currentView === 'member-directory' && (
            <div className="flex-1 bg-white h-full overflow-hidden">
                <MemberManagement 
                  currentUser={currentUser}
                  members={members}
                  onAddMember={handleAddMember}
                  onUpdateMember={handleUpdateMember}
                  onDeleteMember={handleDeleteMember}
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
                  onSaveLeader={(l) => setLeaders(prev => prev.map(ex => ex.id === l.id ? l : ex))} 
                  onBulkSaveLeaders={handleBulkUpdateLeaders}
                  onDeleteLeader={(id) => setLeaders(prev => prev.filter(l => l.id !== id))} 
                  currentUser={currentUser} 
                />
              </div>
          )}
          {currentView === 'group-settings' && (
              <div className="flex-1 bg-white h-full overflow-hidden">
                  {isSettingsMode === 'list' && (
                      <GroupSelector leader={currentUser} onSelectGroup={(g) => { setSettingsGroup(g); setIsSettingsMode('edit'); }} onCreateNew={() => { setSettingsGroup(null); setIsSettingsMode('create'); }} />
                  )}
                  {(isSettingsMode === 'edit' || isSettingsMode === 'create') && (
                      <GroupSettings 
                        leader={currentUser} 
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
                 <LeaderDetail leader={selectedLeader} onBack={() => setSelectedLeader(null)} canEdit={false} showMobileBack={true} allMembers={members} allLeaders={leaders} onAddMember={handleUpdateMember} />
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
