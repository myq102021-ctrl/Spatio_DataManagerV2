
import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Edit3, 
  ChevronDown, 
  ChevronRight, 
  Database, 
  Folder, 
  FolderOpen,
  MoreVertical,
  PlusCircle,
  ChevronLeft,
  ChevronRight as ChevronRightIcon
} from 'lucide-react';

interface ThemeItem {
  id: string;
  code: string;
  name: string;
  desc: string;
  sort: number;
}

const MOCK_THEMES: ThemeItem[] = [
  { id: '1', code: 'annotation_map', name: '注记地图', desc: '', sort: 1 },
  { id: '2', code: 'fundamental_geography', name: '基础地理', desc: '各类基础地理信息要素，...', sort: 1 },
  { id: '3', code: '1213', name: '313131', desc: '313', sort: 2 },
  { id: '4', code: 'survey_mapping_data', name: '其他测绘数据', desc: '', sort: 1 },
  { id: '5', code: 'city_information_model', name: 'CIM', desc: '', sort: 1 },
  { id: '6', code: 'building_information_m...', name: 'BIM', desc: '', sort: 1 },
  { id: '7', code: 'oblique_photography', name: '倾斜摄影', desc: '', sort: 1 },
  { id: '8', code: 'simple_3d_model', name: '白模', desc: '', sort: 1 },
  { id: '9', code: 'area_of_interest', name: 'AOI', desc: '', sort: 1 },
  { id: '10', code: 'point_of_interest', name: 'POI', desc: '', sort: 1 },
];

export const DataThemePanel: React.FC = () => {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(new Set(['base', 'address', 'map', '3d', 'rs', 'sat']));

  const toggleExpand = (key: string) => {
    const next = new Set(expandedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setExpandedKeys(next);
  };

  return (
    <div className="flex-1 flex bg-white h-full overflow-hidden animate-fadeIn">
      {/* 1. Left Sidebar Tree - Restored to Fixed Width */}
      <div className="w-[280px] flex-shrink-0 flex flex-col border-r border-slate-100 bg-[#fcfdfe]/50 transition-all duration-300 ease-in-out overflow-hidden relative z-20">
        <div className="p-4 space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0">
                <LayoutGrid size={20} />
            </div>
            <h2 className="text-[15px] font-bold text-slate-800 whitespace-nowrap">数据主题</h2>
          </div>
          
          <div className="flex items-center gap-2 overflow-hidden h-8">
            <div className="relative flex-1 group">
              <input 
                type="text" 
                placeholder="请输入" 
                className="w-full h-8 pl-3 pr-8 bg-white border border-slate-200 rounded text-xs outline-none focus:border-blue-400 transition-all"
              />
              <Search className="absolute right-2 top-2 text-slate-300" size={14} />
            </div>
            <button className="w-8 h-8 bg-blue-600 text-white rounded flex items-center justify-center shrink-0 hover:bg-blue-700 shadow-sm shadow-blue-100">
                <Plus size={16} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-2 pb-4 custom-scrollbar overflow-x-hidden">
          <div className="space-y-0.5">
            <TreeItem 
              label="基础地理" 
              isOpen={expandedKeys.has('base')} 
              onToggle={() => toggleExpand('base')}
              active
            >
              <TreeItem label="行政区划" level={1} />
              <TreeItem label="地名地址" level={1} isOpen={expandedKeys.has('address')} onToggle={() => toggleExpand('address')}>
                  <TreeItem label="POI" level={2} />
                  <TreeItem label="AOI" level={2} />
              </TreeItem>
              <TreeItem label="地图服务" level={1} isOpen={expandedKeys.has('map')} onToggle={() => toggleExpand('map')}>
                  <TreeItem label="注记地图" level={2} />
                  <TreeItem label="313131" level={2} />
                  <TreeItem label="影像地图" level={2} />
                  <TreeItem label="电子地图" level={2} />
                  <TreeItem label="地形" level={2} />
                  <TreeItem label="地名" level={2} />
              </TreeItem>
              <TreeItem label="实景三维" level={1} isOpen={expandedKeys.has('3d')} onToggle={() => toggleExpand('3d')}>
                  <TreeItem label="白模" level={2} />
                  <TreeItem label="倾斜摄影" level={2} />
                  <TreeItem label="BIM" level={2} />
                  <TreeItem label="CIM" level={2} />
              </TreeItem>
              <TreeItem label="其他测绘数据" level={1} />
            </TreeItem>

            <TreeItem label="遥感遥测" isOpen={expandedKeys.has('rs')} onToggle={() => toggleExpand('rs')}>
               <TreeItem label="卫星遥感" level={1} isOpen={expandedKeys.has('sat')} onToggle={() => toggleExpand('sat')}>
                  <TreeItem label="哨兵" level={2} />
                  <TreeItem label="哨兵三号" level={3} />
                  <TreeItem label="哨兵一号" level={3} />
                  <TreeItem label="哨兵二号" level={3} />
               </TreeItem>
            </TreeItem>
          </div>
        </div>
      </div>

      {/* 2. Main Content List */}
      <div className="flex-1 flex flex-col p-6 bg-slate-50/30 overflow-hidden">
        <div className="bg-white rounded-xl shadow-sm border border-slate-200/60 flex flex-col h-full overflow-hidden">
          
          {/* Top Actions */}
          <div className="p-4 flex items-center justify-between border-b border-slate-100">
            <div className="relative w-80 group">
              <input 
                type="text" 
                placeholder="请输入主题名称搜索" 
                className="w-full h-9 pl-4 pr-10 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 focus:bg-white transition-all"
              />
              <Search className="absolute right-3 top-2.5 text-slate-300" size={16} />
            </div>
            <button className="flex items-center gap-1.5 px-4 h-9 bg-blue-600 text-white rounded-lg text-sm font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100">
               <Trash2 size={16} />
               批量删除
            </button>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left text-[13px] border-collapse">
              <thead className="bg-[#f8fafc] text-slate-500 font-bold border-b border-slate-100 sticky top-0 z-10">
                <tr>
                  <th className="p-4 w-12 text-center"><input type="checkbox" className="rounded border-slate-300" /></th>
                  <th className="p-4">主题编码</th>
                  <th className="p-4">主题名称</th>
                  <th className="p-4">主题描述</th>
                  <th className="p-4 w-24">排序号</th>
                  <th className="p-4 text-center w-[150px]">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {MOCK_THEMES.map((theme) => (
                  <tr key={theme.id} className="hover:bg-blue-50/10 transition-colors">
                    <td className="p-4 text-center"><input type="checkbox" className="rounded border-slate-300" /></td>
                    <td className="p-4 text-slate-600 font-medium">{theme.code}</td>
                    <td className="p-4 text-slate-800 font-bold">{theme.name}</td>
                    <td className="p-4 text-slate-400 truncate max-w-[200px]" title={theme.desc}>{theme.desc || '-'}</td>
                    <td className="p-4 text-slate-600 tabular-nums">{theme.sort}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5 text-blue-600">
                        <button className="p-2 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all" title="编辑"><Edit3 size={16} /></button>
                        <button className="p-2 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all" title="删除"><Trash2 size={16} /></button>
                        <button className="p-2 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-all" title="添加子主题"><PlusCircle size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="px-6 py-4 bg-white border-t border-slate-100 flex items-center justify-between text-[13px] text-slate-500">
            <div>共 18 条</div>
            <div className="flex items-center gap-4">
               <div className="flex items-center gap-1.5 px-2 py-1 border border-slate-200 rounded hover:border-blue-300 cursor-pointer transition-colors">
                 10条/页 <ChevronDown size={14} className="text-slate-400" />
               </div>
               <div className="flex items-center gap-1">
                 <button className="p-1 text-slate-300 hover:text-slate-600"><ChevronLeft size={16} /></button>
                 <button className="w-7 h-7 bg-blue-600 text-white rounded font-bold">1</button>
                 <button className="w-7 h-7 border border-slate-100 rounded hover:bg-slate-50">2</button>
                 <button className="p-1 text-slate-400 hover:text-slate-600"><ChevronRightIcon size={16} /></button>
               </div>
               <div className="flex items-center gap-2">
                 前往 <input type="text" className="w-8 h-7 border border-slate-200 rounded text-center outline-none focus:border-blue-500 font-bold text-blue-600" defaultValue="1" /> 页
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const TreeItem: React.FC<{ 
  label: string; 
  level?: number; 
  isOpen?: boolean; 
  onToggle?: () => void; 
  active?: boolean;
  children?: React.ReactNode;
}> = ({ label, level = 0, isOpen, onToggle, active, children }) => {
  const hasChildren = !!children;
  return (
    <div className="flex flex-col">
      <div 
        className={`
          flex items-center gap-2 h-10 px-3 rounded-lg cursor-pointer transition-all group/item
          ${active ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-50'}
        `}
        style={{ paddingLeft: `${(level * 18) + 16}px` }}
      >
        <div className="w-4 flex items-center justify-center shrink-0">
          {hasChildren ? (
            <div onClick={(e) => { e.stopPropagation(); onToggle?.(); }} className="hover:bg-blue-100/50 rounded p-0.5 transition-colors">
              {isOpen ? <ChevronDown size={14} className="text-slate-400" /> : <ChevronRight size={14} className="text-slate-400" />}
            </div>
          ) : null}
        </div>
        <div className={`shrink-0 ${active ? 'text-blue-600' : 'text-slate-400 group-hover/item:text-blue-400'}`}>
          {level === 0 ? <Database size={18} /> : isOpen ? <FolderOpen size={18} /> : <Folder size={18} />}
        </div>
        <span className="truncate text-[13px] flex-1 whitespace-nowrap ml-1">{label}</span>
        <button className="opacity-0 group-hover/item:opacity-100 p-1 text-slate-300 hover:text-slate-600 transition-all">
          <MoreVertical size={14} />
        </button>
      </div>
      {isOpen && children && (
        <div className="flex flex-col animate-slideDown origin-top">
          {children}
        </div>
      )}
    </div>
  );
};

const LayoutGrid: React.FC<{ size: number }> = ({ size }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
        <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
    </svg>
);
