import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  ChevronDown, 
  Hexagon, 
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
import { CollapseRailHandle } from './CollapseRailHandle';

/** 记录用户侧栏收起/展开偏好，切换菜单或刷新后仍保持 */
const SIDEBAR_COLLAPSED_STORAGE_KEY = 'spatio-platform-sidebar-collapsed';

function readStoredSidebarCollapsed(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(SIDEBAR_COLLAPSED_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

function writeStoredSidebarCollapsed(collapsed: boolean): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(SIDEBAR_COLLAPSED_STORAGE_KEY, collapsed ? '1' : '0');
  } catch {
    /* quota / private mode */
  }
}

function menuHasActiveDescendant(item: MenuItem, activeMenuId: string): boolean {
  if (!item.children?.length) return false;
  return item.children.some(
    (c) => c.id === activeMenuId || menuHasActiveDescendant(c, activeMenuId),
  );
}

/** 收起态浮层：展开带三级结构的子菜单为可点击叶子项 */
function flattenSelectableMenuItems(items: MenuItem[]): MenuItem[] {
  const out: MenuItem[] = [];
  for (const item of items) {
    if (item.children?.length) {
      out.push(...flattenSelectableMenuItems(item.children));
    } else {
      out.push(item);
    }
  }
  return out;
}

interface SidebarProps {
  activeMenuId: string;
  onMenuSelect: (id: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeMenuId, onMenuSelect }) => {
  const [isCollapsed, setIsCollapsed] = useState(readStoredSidebarCollapsed);
  const [expandedMenus, setExpandedMenus] = useState<Set<string>>(
    new Set([
      'resources',
      'data_integration',
      'spatial_ingestion',
      'services',
      'smart_map_parent',
      'data_security',
    ]),
  );
  const [isProfileExpanded, setIsProfileExpanded] = useState(false);
  /** 收起态子菜单：用 fixed 定位，避免被菜单区域 overflow 裁剪，视觉上不再「压住」侧栏 */
  const [collapsedFlyout, setCollapsedFlyout] = useState<MenuItem | null>(null);
  const [collapsedFlyoutPos, setCollapsedFlyoutPos] = useState({ top: 0, left: 0 });
  const menuScrollRef = useRef<HTMLDivElement>(null);
  const menuTriggerRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const flyoutCloseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 用于实现点击外部关闭逻辑
  const profileRef = useRef<HTMLDivElement>(null);

  const cancelFlyoutClose = () => {
    if (flyoutCloseTimer.current) {
      clearTimeout(flyoutCloseTimer.current);
      flyoutCloseTimer.current = null;
    }
  };

  const scheduleFlyoutClose = () => {
    cancelFlyoutClose();
    flyoutCloseTimer.current = setTimeout(() => {
      setCollapsedFlyout(null);
      flyoutCloseTimer.current = null;
    }, 140);
  };

  const updateCollapsedFlyoutPosition = useCallback((itemId: string) => {
    const el = menuTriggerRefs.current.get(itemId);
    if (!el) return;
    const r = el.getBoundingClientRect();
    setCollapsedFlyoutPos({ top: r.top + r.height / 2, left: r.right + 6 });
  }, []);

  const openCollapsedFlyout = (item: MenuItem) => {
    cancelFlyoutClose();
    updateCollapsedFlyoutPosition(item.id);
    setCollapsedFlyout(item);
  };

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

  useEffect(() => {
    if (!isCollapsed) setCollapsedFlyout(null);
  }, [isCollapsed]);

  useEffect(() => {
    if (!collapsedFlyout || !isCollapsed) return;
    const update = () => updateCollapsedFlyoutPosition(collapsedFlyout.id);
    const sc = menuScrollRef.current;
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    sc?.addEventListener('scroll', update);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      sc?.removeEventListener('scroll', update);
    };
  }, [collapsedFlyout, isCollapsed, updateCollapsedFlyoutPosition]);

  useEffect(() => () => cancelFlyoutClose(), []);

  useEffect(() => {
    if (
      activeMenuId === 'spatial_ingestion_single' ||
      activeMenuId === 'spatial_ingestion_batch'
    ) {
      setExpandedMenus((prev) => {
        const next = new Set(prev);
        next.add('data_integration');
        next.add('spatial_ingestion');
        return next;
      });
    }
  }, [activeMenuId]);

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
            flex shrink-0 flex-col h-full text-slate-800 select-none pt-8 relative z-40 
            transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]
            bg-transparent overflow-visible
            ${isCollapsed ? 'w-20 min-w-20' : 'w-64 min-w-64'}
        `}
    >
      {/* 收缩手柄：侧栏右缘垂直居中，与面板收缩条同款胶囊样式 */}
      <div className="pointer-events-none absolute inset-y-0 left-full z-30 w-0">
        <div
          className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-slate-200/70"
          aria-hidden
        />
        <CollapseRailHandle
          side="left"
          collapsed={isCollapsed}
          expandLabel="展开导航栏"
          collapseLabel="收起导航栏"
          onToggle={() => {
            setIsCollapsed((prev) => {
              const next = !prev;
              writeStoredSidebarCollapsed(next);
              return next;
            });
          }}
          className="pointer-events-auto absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
        />
      </div>

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
      <div ref={menuScrollRef} className="flex-1 min-h-0 overflow-y-auto overflow-x-visible px-3 space-y-1 no-scrollbar">
        {MENU_ITEMS.map((item) => {
          if (item.type === 'header') {
            if (isCollapsed) return <div key={item.id} className="h-4" />;
            return (
              <div key={item.id} className="pt-6 pb-2 px-5 flex items-center gap-2.5 animate-fadeIn">
                <div className="w-1 h-3 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"></div>
                <span className="text-[13px] font-black text-slate-500/90 tracking-widest">{item.label}</span>
              </div>
            );
          }

          const isDirectlyActive = activeMenuId === item.id;
          const hasActiveChild = menuHasActiveDescendant(item, activeMenuId);
          /** 有子项选中时，一级仅展开不高亮 */
          const isParentRowActive = isDirectlyActive && !hasActiveChild;

          const hasSubmenu = !!(item.children && item.children.length > 0);

          return (
            <div
              key={item.id}
              ref={(el) => {
                if (el) menuTriggerRefs.current.set(item.id, el);
                else menuTriggerRefs.current.delete(item.id);
              }}
              className="relative"
              onMouseEnter={() => {
                if (isCollapsed && hasSubmenu) openCollapsedFlyout(item);
              }}
              onMouseLeave={scheduleFlyoutClose}
            >
                <MenuRow 
                  item={item} 
                  isCollapsed={isCollapsed} 
                  isActive={isParentRowActive} 
                  isExpanded={expandedMenus.has(item.id) || hasActiveChild}
                  onToggle={() => toggleExpand(item.id)}
                  onClick={() => {
                    if (!item.children || item.children.length === 0) {
                      onMenuSelect(item.id);
                    } else if (!isCollapsed) {
                      toggleExpand(item.id);
                    }
                  }}
                />
                {!isCollapsed && item.children && expandedMenus.has(item.id) && (
                  <SubMenuTree
                    items={item.children}
                    depth={1}
                    activeMenuId={activeMenuId}
                    expandedMenus={expandedMenus}
                    onToggleExpand={toggleExpand}
                    onMenuSelect={onMenuSelect}
                  />
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

      {isCollapsed && collapsedFlyout && collapsedFlyout.children && collapsedFlyout.children.length > 0 && (
        <div
          className="pointer-events-auto fixed z-[200] -translate-y-1/2 pl-3 -ml-3"
          style={{ top: collapsedFlyoutPos.top, left: collapsedFlyoutPos.left }}
          onMouseEnter={cancelFlyoutClose}
          onMouseLeave={scheduleFlyoutClose}
        >
          <div className="rounded-[10px] bg-white py-3 px-4 min-w-[196px] shadow-[0_12px_40px_-8px_rgba(15,23,42,0.18)] ring-1 ring-slate-900/[0.06]">
            <div className="mb-2.5 text-[11px] font-semibold tracking-wide text-slate-400 select-none">
              {collapsedFlyout.label}
            </div>
            <div className="flex flex-col gap-0.5">
              {flattenSelectableMenuItems(collapsedFlyout.children).map((child) => (
                <button
                  key={child.id}
                  type="button"
                  onClick={() => {
                    cancelFlyoutClose();
                    setCollapsedFlyout(null);
                    onMenuSelect(child.id);
                  }}
                  className={`
                    rounded-lg px-2.5 py-2 text-left text-[13px] font-bold tracking-wide transition-colors
                    ${activeMenuId === child.id
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                >
                  {child.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface SubMenuTreeProps {
  items: MenuItem[];
  depth: number;
  activeMenuId: string;
  expandedMenus: Set<string>;
  onToggleExpand: (id: string) => void;
  onMenuSelect: (id: string) => void;
}

const SubMenuTree: React.FC<SubMenuTreeProps> = ({
  items,
  depth,
  activeMenuId,
  expandedMenus,
  onToggleExpand,
  onMenuSelect,
}) => {
  const indent = depth === 1 ? 'ml-9' : 'ml-6';
  return (
    <div className={`mt-1 ${indent} border-l border-white/30 space-y-1 animate-fadeIn`}>
      {items.map((child) => {
        const hasNested = !!(child.children && child.children.length > 0);
        const isLeafActive = activeMenuId === child.id;
        const hasActiveNested = menuHasActiveDescendant(child, activeMenuId);
        const isExpanded = expandedMenus.has(child.id) || hasActiveNested;

        if (hasNested) {
          return (
            <div key={child.id}>
              <button
                type="button"
                onClick={() => onToggleExpand(child.id)}
                className={`
                  flex w-full items-center justify-between gap-2 rounded-xl py-2.5 pr-4 pl-5 text-left transition-all
                  ${hasActiveNested
                    ? 'bg-white/60 text-blue-700 font-bold ring-1 ring-black/5'
                    : 'text-slate-600/90 hover:bg-white/40 hover:text-slate-950 font-medium'}
                `}
              >
                <span className="flex items-center gap-2 text-[15px] tracking-wide">
                  {child.icon ? (
                    <span className="flex h-4 w-4 shrink-0 items-center justify-center opacity-80">
                      {child.icon}
                    </span>
                  ) : null}
                  {child.label}
                </span>
                <ChevronDown
                  className={`h-3.5 w-3.5 shrink-0 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                />
              </button>
              {isExpanded && child.children ? (
                <SubMenuTree
                  items={child.children}
                  depth={depth + 1}
                  activeMenuId={activeMenuId}
                  expandedMenus={expandedMenus}
                  onToggleExpand={onToggleExpand}
                  onMenuSelect={onMenuSelect}
                />
              ) : null}
            </div>
          );
        }

        return (
          <button
            key={child.id}
            type="button"
            onClick={() => onMenuSelect(child.id)}
            className={`
              flex w-full items-center gap-2 rounded-xl py-2.5 pr-4 pl-5 text-left transition-all
              ${isLeafActive
                ? 'bg-white/80 text-blue-700 shadow-sm font-bold ring-1 ring-black/5'
                : 'text-slate-600/90 hover:bg-white/40 hover:text-slate-950 font-medium'}
            `}
          >
            {child.icon ? (
              <span className="flex h-4 w-4 shrink-0 items-center justify-center opacity-80">
                {child.icon}
              </span>
            ) : null}
            <span className={`tracking-wide ${depth >= 2 ? 'text-[14px]' : 'text-[16px]'}`}>
              {child.label}
            </span>
          </button>
        );
      })}
    </div>
  );
};

interface MenuRowProps {
    item: MenuItem;
    isCollapsed: boolean;
    isActive: boolean;
    isExpanded: boolean;
    onToggle: () => void;
    onClick: () => void;
}

const MenuRow: React.FC<MenuRowProps> = ({ item, isCollapsed, isActive, isExpanded, onToggle, onClick }) => {
  const rowActive = isActive;
  return (
    <div className="group relative" onClick={onClick}>
      <div
        className={`
          flex items-center rounded-xl cursor-pointer transition-all duration-200
          ${isCollapsed ? 'justify-center py-3' : 'gap-4 pl-6 pr-4 py-3.5'}
          ${rowActive 
            ? 'bg-white/80 text-blue-700 shadow-sm font-bold ring-1 ring-black/5' 
            : 'text-slate-600/90 hover:bg-white/40 hover:text-slate-950 font-medium'}
        `}
      >
        <div className={`flex-shrink-0 w-6 h-5 flex items-center justify-center transition-colors ${rowActive ? 'text-blue-700' : 'text-slate-500 group-hover:text-slate-950'}`}>
            {React.cloneElement(item.icon as React.ReactElement, { size: 20, strokeWidth: rowActive ? 2.5 : 2 })}
        </div>
        
        {!isCollapsed && (
            <span className={`flex-1 text-[16px] tracking-wide truncate`}>
                {item.label}
            </span>
        )}
        
        {!isCollapsed && item.children && (
            <ChevronDown className={`w-4 h-4 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''} ${rowActive ? 'text-blue-700' : 'text-slate-500 group-hover:text-slate-950'}`} />
        )}

        {isActive && !isCollapsed && (!item.children || item.children.length === 0) && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-5 bg-blue-600 rounded-r-full shadow-[2px_0_10px_rgba(37,99,235,0.4)]"></div>
        )}
      </div>
    </div>
  );
};
