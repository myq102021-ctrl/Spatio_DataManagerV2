import React, { useState, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  Hexagon, 
  ChevronLeft, 
  ChevronRight, 
  LayoutGrid, 
  LogOut, 
  Settings, 
  User,
  Heart,
  ClipboardList,
  UserCircle
} from 'lucide-react';
import { MENU_ITEMS } from '../constants';
import { MenuItem } from '../types';

interface SidebarProps {
  activeMenuId: string;
  onMenuSelect: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeMenuId, onMenuSelect }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(new Set(['data_integration', 'list', 'services', 'smart_map_parent']));
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  
  // 用于实现点击外部关闭逻辑
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !containerRefContains(profileRef.current, event.target as Node)) {
        setIsProfileExpanded(false);
      }
    };

    function containerRefContains(container: HTMLElement, target: Node) {
        return container.contains(target);
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedMenus);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedMenus(next);
  };

  const personalSubMenus = [
    { id: 'personal_console', label: '个人中心', icon: <LayoutGrid size={14} /> },
    { id: 'my_applications', label: '我的申请', icon: <ClipboardList size={14} /> },
    { id: 'my_favorites', label: '我的收藏', icon: <Heart size={14} /> },
  ];

  const handleLogout = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('确认退出系统吗？')) {
      window.location.reload();
    }
  };

  return (
    <div 
        className={`
            flex-shrink-0 flex flex-col h-full text-slate-800 select-none pt-8 relative z-20 
            transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
            bg-transparent
            ${isCollapsed ? 'w-20' : 'w-64'}
        `}
    >
      {/* Collapse Toggle Button */}
      <button 
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute top-12 -right-3 z-30 w-6 h-6 rounded-full bg-white border border-slate-200/60 shadow-sm flex items-center justify-center text-slate-500 hover:text-blue-600 hover:scale-110 transition-all cursor-pointer outline-none"
      >
        {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {/* Logo Area */}
      <div className={`mb-10 flex items-center transition-all duration-300 ${isCollapsed ? 'justify-center px-0' : 'justify-start px-6 gap-3'}`}>
        <div className="w-10 h-10 flex-shrink-0 shadow-md rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center group cursor-pointer transition-transform duration-500 hover:rotate-6 ring-2 ring-white/50">
             <Hexagon className="text-white fill-white/20 w-6 h-6" />
        </div>
        {!isCollapsed && (
            <div className="flex flex-col whitespace-nowrap animate-fadeIn">
                <span className="text-[20px] font-black tracking-tight text-slate-900 leading-tight text-shadow-sm">时空大数据平台</span>
                <span className="text-[9px] font-bold text-blue-900/80 tracking-widest uppercase">Engine V2.1</span>
            </div>
        )}
      </div>

      {/* Menu Items - Changed custom-scrollbar to no-scrollbar */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1 no-scrollbar">
        {MENU_ITEMS.map((item) => {
          const isDirectlyActive = activeMenuId === item.id;
          const hasActiveChild = item.children?.some(c => c.id === activeMenuId);

          return (
            <div key={item.id}>
                <MenuRow 
                  item={item} 
                  isCollapsed={isCollapsed} 
                  isActive={isDirectlyActive} 
                  isChildActive={hasActiveChild} 
                  isExpanded={expandedMenus.has(item.id)}
                  onToggle={() => toggleExpand(item.id)}
                  onClick={() => {
                    if (!item.children || item.children.length === 0) {
                      onMenuSelect(item.id);
                    } else {
                      toggleExpand(item.id);
                    }
                  }}
                />
                {!isCollapsed && item.children && expandedMenus.has(item.id) && (
                  <div className="mt-1 ml-9 border-l border-white/30 space-y-1 animate-fadeIn">
                    {item.children.map(child => (
                      <div 
                        key={child.id}
                        onClick={() => onMenuSelect(child.id)}
                        className={`
                          py-2.5 pr-4 pl-7 rounded-xl text-[16px] tracking-wide cursor-pointer transition-all flex items-center
                          ${activeMenuId === child.id 
                            ? 'bg-white/80 text-blue-700 shadow-sm font-bold ring-1 ring-black/5' 
                            : 'text-slate-600/90 hover:bg-white/40 hover:text-slate-950 font-medium'}
                        `}
                      >
                        {child.label}
                      </div>
                    ))}
                  </div>
                )}
            </div>
          );
        })}
      </div>

      {/* User Personal Management Center */}
      <div ref={profileRef} className={`mt-auto transition-all duration-500 ${isCollapsed ? 'p-3 mb-4' : 'p-4'}`}>
        <div className="flex flex-col gap-1">
            {/* Submenus - Updated with stronger white glass effect */}
            {!isCollapsed && isProfileExpanded && (
                <div className="mb-2 px-2 py-2 bg-white/85 backdrop-blur-2xl rounded-2xl border border-white/50 space-y-1 animate-slideUp shadow-xl shadow-blue-900/10 ring-1 ring-black/5">
                    {personalSubMenus.map(sub => (
                        <div 
                            key={sub.id}
                            onClick={() => {
                                onMenuSelect(sub.id);
                                setIsProfileExpanded(false); // 选中后收起
                            }}
                            className={`
                                flex items-center gap-3 px-4 py-2 rounded-xl text-[13px] font-bold cursor-pointer transition-all
                                ${activeMenuId === sub.id 
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' 
                                    : 'text-slate-700 hover:bg-white/60 hover:text-blue-700'}
                            `}
                        >
                            {sub.icon}
                            {sub.label}
                        </div>
                    ))}
                </div>
            )}

            {/* Profile Card - Enhanced with stronger white glass effect as requested */}
            <div 
                onClick={() => {
                    if (isCollapsed) {
                        onMenuSelect('personal_console');
                    } else {
                        setIsProfileExpanded(!isProfileExpanded);
                    }
                }}
                className={`
                    group/profile relative bg-white/40 backdrop-blur-xl rounded-2xl flex items-center transition-all duration-300 cursor-pointer 
                    hover:bg-white/60 hover:shadow-2xl hover:shadow-blue-900/10 border border-white/40
                    ${isProfileExpanded || personalSubMenus.some(s => s.id === activeMenuId) ? 'bg-white/70 shadow-lg ring-1 ring-white/50' : 'shadow-sm'}
                    ${isCollapsed ? 'p-1.5 justify-center' : 'p-3 gap-3'}
                `}
            >
                <div className={`w-9 h-9 rounded-xl overflow-hidden border-2 border-white flex-shrink-0 shadow-sm transition-transform duration-300 group-hover/profile:scale-105`}>
                    <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full object-cover bg-blue-100" />
                </div>
                
                {!isCollapsed && (
                    <div className="flex flex-col min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                            <span className={`text-[13px] truncate ${personalSubMenus.some(s => s.id === activeMenuId) ? 'text-blue-700 font-bold' : 'text-slate-950 font-black'}`}>系统管理员</span>
                        </div>
                        <span className="text-[10px] text-slate-600 font-bold truncate tracking-wide flex items-center gap-1">
                            <UserCircle size={10} className="text-blue-600" /> 个人中心
                        </span>
                    </div>
                )}
                
                {!isCollapsed && (
                    <div className="flex items-center gap-1">
                        <button 
                            onClick={handleLogout}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                            title="快速登出"
                        >
                            <LogOut size={16} />
                        </button>
                        <ChevronDown size={14} className={`text-slate-500 transition-transform duration-300 ${isProfileExpanded ? 'rotate-180' : ''}`} />
                    </div>
                )}

                {/* Collapsed State Quick Menu */}
                {isCollapsed && (
                    <div className="absolute left-full ml-4 opacity-0 group-hover/profile:opacity-100 transition-all duration-300 translate-x-[-10px] group-hover/profile:translate-x-0 pointer-events-none z-50">
                        <div className="bg-white/90 backdrop-blur-2xl text-slate-800 p-3 rounded-2xl shadow-2xl border border-white/50 w-40 space-y-1">
                            <div className="px-2 py-1 mb-1 border-b border-slate-100 flex items-center justify-between">
                                <span className="text-[11px] font-black">个人管理</span>
                                <LogOut size={12} className="text-red-400 cursor-pointer" onClick={(e: any) => handleLogout(e)} />
                            </div>
                            {personalSubMenus.map(sub => (
                                <div 
                                    key={sub.id} 
                                    onClick={() => onMenuSelect(sub.id)}
                                    className="flex items-center gap-2 px-2 py-1.5 hover:bg-blue-50 hover:text-blue-600 rounded-lg text-[11px] font-bold pointer-events-auto"
                                >
                                    {sub.icon} {sub.label}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

interface MenuRowProps {
    item: MenuItem;
    isCollapsed: boolean;
    isActive: boolean;
    isChildActive?: boolean;
    isExpanded: boolean;
    onToggle: () => void;
    onClick: () => void;
}

const MenuRow: React.FC<MenuRowProps> = ({ item, isCollapsed, isActive, isChildActive, isExpanded, onToggle, onClick }) => {
  return (
    <div className="group relative" onClick={onClick}>
      <div
        className={`
          flex items-center rounded-xl cursor-pointer transition-all duration-200
          ${isCollapsed ? 'justify-center py-3' : 'gap-4 pl-6 pr-4 py-3.5'}
          ${isActive 
            ? 'bg-white/80 text-blue-700 shadow-sm font-bold ring-1 ring-black/5' 
            : 'text-slate-600/90 hover:bg-white/40 hover:text-slate-950 font-medium'}
        `}
      >
        <div className={`flex-shrink-0 w-6 h-5 flex items-center justify-center transition-colors ${isActive ? 'text-blue-700' : 'text-slate-500 group-hover:text-slate-950'}`}>
            {React.cloneElement(item.icon as React.ReactElement, { size: 20, strokeWidth: isActive ? 2.5 : 2 })}
        </div>
        
        {!isCollapsed && (
            <span className={`flex-1 text-[16px] tracking-wide truncate`}>
                {item.label}
            </span>
        )}
        
        {!isCollapsed && item.children && (
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''} ${isActive ? 'text-blue-700' : 'text-slate-500 group-hover:text-slate-950'}`} />
        )}

        {isActive && !isCollapsed && (!item.children || item.children.length === 0) && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-full shadow-[2px_0_10px_rgba(37,99,235,0.4)]"></div>
        )}
      </div>
    </div>
  );
};
