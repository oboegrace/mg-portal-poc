
import React, { useState, useEffect } from 'react';
import { User, Users, Settings, Bell, Globe, LogOut, X, PlusCircle, ChevronDown, ChevronRight, LayoutDashboard, Database, BarChartHorizontal, ClipboardCheck, ShieldCheck, Target, Camera, Contact } from 'lucide-react';
import { CellLeader, CellGroup } from '../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: string;
  onChangeView: (view: string) => void;
  user: CellLeader;
  onEditGroup: (group: CellGroup) => void;
  onLogout: () => void;
  activeSubItemId?: string | null;
  hasDescendants?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  onClose, 
  currentView, 
  onChangeView, 
  user, 
  onEditGroup,
  onLogout,
  activeSubItemId,
  hasDescendants = false
}) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  const fullName = `${user.chineseName || ''} ${user.firstName || ''} ${user.lastName || ''}`.trim();
  const displayName = fullName || user.mgCode;
  const initialChar = (user.chineseName ? user.chineseName.charAt(0) : (user.firstName ? user.firstName.charAt(0) : user.mgCode.charAt(0))) || '?';

  // Only show Formal Groups (Open/Disciple) in the settings menu
  const formalGroups = user.groups.filter(g => !g.isDeleted && (g.category === 'open_cell' || g.category === 'disciple_cell'));
  const isAdmin = !!user.isAdmin;

  const primaryRole = user.roles && user.roles.length > 0 ? user.roles[0] : 'Leader';

  useEffect(() => {
    if (activeSubItemId || currentView === 'group-settings') {
      if (!expandedItems.includes('group-settings')) {
        setExpandedItems(prev => [...prev, 'group-settings']);
      }
    } else {
      setExpandedItems(prev => prev.filter(item => item !== 'group-settings'));
    }
  }, [activeSubItemId, currentView]);

  const menuItems = [
    { id: 'my-groups', icon: User, label: 'My Groups' },
    { id: 'member-directory', icon: Contact, label: 'Member Directory' },
    ...(hasDescendants ? [{ id: 'descendant-groups', icon: Users, label: 'Descendant Groups' }] : []),
    ...(isAdmin ? [
        { id: 'admin-dashboard', icon: LayoutDashboard, label: 'Organization Insight' },
        { id: 'tribe-statistics', icon: BarChartHorizontal, label: 'Tribe Statistics' },
        { id: 'lineage-photo-view', icon: Camera, label: 'Lineage Photo View' },
        { id: 'pastoral-evaluation', icon: Target, label: 'Pastoral Evaluation' },
        { id: 'reporting-status', icon: ClipboardCheck, label: 'Reporting Status' },
        { id: 'leader-management', icon: Database, label: 'Leader Management' }
    ] : []),
    { id: 'group-settings', icon: Settings, label: 'Cell Group Settings', hasSubMenu: true },
    { id: 'notifications', icon: Bell, label: 'Notification', badge: 3 },
  ];

  const handleNavigation = (itemId: string, hasSubMenu?: boolean) => {
    if (itemId === 'group-settings' && hasSubMenu) {
        const isExpanded = expandedItems.includes(itemId);
        const newExpanded = isExpanded 
            ? expandedItems.filter(i => i !== itemId)
            : [...expandedItems, itemId];
        setExpandedItems(newExpanded);
        return;
    }
    onChangeView(itemId);
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleProfileClick = () => {
    onChangeView('profile-settings');
    if (window.innerWidth < 1024) {
      onClose();
    }
  };

  const handleSubItemClick = (group: CellGroup) => {
      onEditGroup(group);
      if (window.innerWidth < 1024) {
          onClose();
      }
  };

  const handleCreateGroupClick = () => {
      onChangeView('create-group');
      if (window.innerWidth < 1024) {
          onClose();
      }
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={onClose} />
      )}
      <aside 
        className={`fixed top-0 left-0 bottom-0 z-50 w-[260px] bg-[#E85C10] text-white flex flex-col transition-transform duration-300 lg:translate-x-0 lg:static ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="h-16 flex items-center px-6 font-bold text-xl tracking-tight border-b border-orange-600/30">
          <div className="w-8 h-8 bg-white/20 rounded mr-3 flex items-center justify-center font-serif italic">An</div>
          Shepherd View
          <button onClick={onClose} className="ml-auto lg:hidden p-1 hover:bg-white/10 rounded"><X className="w-5 h-5" /></button>
        </div>

        <button 
            onClick={handleProfileClick}
            className={`px-6 py-6 border-b border-orange-600/30 flex items-center gap-3 w-full text-left transition-all hover:bg-white/5 group ${currentView === 'profile-settings' ? 'bg-white/10' : ''}`}
        >
            <div className="relative">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg overflow-hidden border-2 border-white/20 group-hover:border-white transition-colors">
                    {user.avatarUrl ? <img src={user.avatarUrl} alt={displayName} className="w-full h-full object-cover" /> : initialChar}
                </div>
                {isAdmin && (
                  <div className="absolute -top-1 -right-1 bg-white text-orange-600 rounded-full p-0.5 border-2 border-orange-500">
                    <ShieldCheck className="w-2.5 h-2.5" />
                  </div>
                )}
            </div>
            <div className="flex-1 min-w-0">
                <div className="font-bold text-sm truncate">{displayName}</div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="text-[9px] text-orange-200 uppercase tracking-wider font-medium">{user.mgCode}</div>
                  <div className="w-1 h-1 bg-orange-300/40 rounded-full"></div>
                  <div className="text-[9px] text-white/70 font-bold truncate max-w-[80px]">{primaryRole}</div>
                </div>
            </div>
        </button>

        <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto no-scrollbar">
          {menuItems.map((item) => {
            const isSettingsParent = item.id === 'group-settings';
            const isActive = currentView === item.id && !activeSubItemId;
            const isExpanded = expandedItems.includes(item.id);
            return (
              <div key={item.id}>
                  <button onClick={() => handleNavigation(item.id, item.hasSubMenu)} className={`w-full flex items-center px-3 py-3 rounded-lg text-sm font-medium transition-colors relative ${isActive ? 'bg-white/20 text-white shadow-sm ring-1 ring-white/20' : 'text-orange-100 hover:bg-white/5 hover:text-white'}`}>
                    <item.icon className={`w-5 h-5 mr-3 ${isActive ? 'opacity-100' : 'opacity-80'}`} />
                    <span className="flex-1 text-left">{item.label}</span>
                    {item.badge && <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{item.badge}</span>}
                    {item.hasSubMenu && <span className="ml-auto">{isExpanded ? <ChevronDown className="w-4 h-4 opacity-70"/> : <ChevronRight className="w-4 h-4 opacity-70"/>}</span>}
                  </button>
                  {isSettingsParent && isExpanded && (
                      <div className="mt-1 ml-4 space-y-1 border-l border-white/20 pl-2 animate-in slide-in-from-top-2 duration-200">
                          {formalGroups.length > 0 ? (
                              formalGroups.map(group => {
                                  const isSubActive = activeSubItemId === group.id;
                                  return (
                                      <button key={group.id} onClick={() => handleSubItemClick(group)} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors ${isSubActive ? 'bg-white/20 text-white font-bold' : 'text-orange-100 hover:bg-white/10 hover:text-white'}`}>
                                          <div className="truncate">{group.category === 'open_cell' ? 'Open Cell' : 'Disciple Cell'}</div>
                                          <div className="opacity-80 text-[10px]">{group.groupDay} {group.groupTime}</div>
                                      </button>
                                  );
                              })
                          ) : <div className="px-3 py-2 text-xs text-orange-200 italic">No formal groups</div>}
                          <button onClick={handleCreateGroupClick} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-2 mt-1 ${currentView === 'create-group' ? 'bg-white/10 text-white' : 'text-orange-100 hover:bg-white/10 hover:text-white'}`}>
                             <PlusCircle className="w-3 h-3 opacity-70" /> Create Cell Group
                          </button>
                      </div>
                  )}
              </div>
            );
          })}
        </nav>
        <div className="p-4 border-t border-orange-600/30 space-y-2">
            <button className="w-full flex items-center px-3 py-2 text-sm text-orange-100 hover:text-white rounded-lg hover:bg-white/5 transition-colors"><Globe className="w-5 h-5 mr-3 opacity-80" />Language</button>
            <button onClick={onLogout} className="w-full flex items-center px-3 py-2 text-sm text-orange-100 hover:text-white rounded-lg hover:bg-white/5 transition-colors"><LogOut className="w-5 h-5 mr-3 opacity-80" />Logout</button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
