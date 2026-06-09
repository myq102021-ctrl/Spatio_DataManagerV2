
import React, { useEffect, useMemo, useState } from 'react';
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
} from 'lucide-react';
import { PaginationBar } from './PaginationBar';

interface ThemeItem {
  id: string;
  code: string;
  name: string;
  desc: string;
  sort: number;
}

const MOCK_THEMES: ThemeItem[] = [
  {
    id: '1',
    code: 'annotation_map',
    name: '注记地图',
    desc: '道路、水系、地名等注记要素，用于底图与矢量/影像叠置标注及制图整饰。',
    sort: 1,
  },
  {
    id: '2',
    code: 'fundamental_geography',
    name: '基础地理',
    desc: '行政区划、地名地址与地图服务等框架数据，为各行业空间分析提供统一基底。',
    sort: 1,
  },
  {
    id: '4',
    code: 'survey_mapping_data',
    name: '其他测绘数据',
    desc: '工程测量、管线探测等专题测绘成果，支撑规划核实与设施资产台账管理。',
    sort: 1,
  },
  {
    id: '5',
    code: 'city_information_model',
    name: 'CIM',
    desc: '城市信息模型，统筹地上地下与室内外要素，支撑数字孪生与智慧城市运行。',
    sort: 1,
  },
  {
    id: '6',
    code: 'building_information_m...',
    name: 'BIM',
    desc: '建筑信息模型，表达构件与属性，用于设计审查、施工协同与运维阶段管理。',
    sort: 1,
  },
  {
    id: '7',
    code: 'oblique_photography',
    name: '倾斜摄影',
    desc: '实景三维倾斜模型，可用于精细建模、立面提取与变化检测等应用。',
    sort: 1,
  },
  {
    id: '8',
    code: 'simple_3d_model',
    name: '白模',
    desc: '建筑体块白模表达城市体量与高度，适用于大范围城市仿真与日照分析。',
    sort: 1,
  },
  {
    id: '9',
    code: 'area_of_interest',
    name: 'AOI',
    desc: '面状兴趣区域，用于范围裁剪、统计汇总与空间约束类查询。',
    sort: 1,
  },
  {
    id: '10',
    code: 'point_of_interest',
    name: 'POI',
    desc: '点状兴趣点，涵盖设施与地物语义，支撑检索、导航与商业选址分析。',
    sort: 1,
  },
];

export type DataThemePanelVariant = 'page' | 'sidebar';

export interface DataThemePanelProps {
  /** page：数据主题管理整页（树+表）；sidebar：仅左侧主题树，用于数据列表与总库列表左右分栏 */
  variant?: DataThemePanelVariant;
  /** sidebar 时顶部标题，默认「数据总库」 */
  sidebarTitle?: string;
}

const DATA_LIST_LAYER_TABS = [
  { id: 'source' as const, label: '贴源层' },
  { id: 'public' as const, label: '公共层' },
  { id: 'app' as const, label: '应用层' },
];

const ThemeTreeBranches: React.FC<{
  L: number;
  expandedKeys: Set<string>;
  toggleExpand: (key: string) => void;
}> = ({ L, expandedKeys, toggleExpand }) => (
  <>
    <TreeItem
      label="基础地理"
      level={L}
      isOpen={expandedKeys.has('base')}
      onToggle={() => toggleExpand('base')}
      active
    >
      <TreeItem label="行政区划" level={1 + L} />
      <TreeItem label="地名地址" level={1 + L} isOpen={expandedKeys.has('address')} onToggle={() => toggleExpand('address')}>
        <TreeItem label="POI" level={2 + L} />
        <TreeItem label="AOI" level={2 + L} />
      </TreeItem>
      <TreeItem label="地图服务" level={1 + L} isOpen={expandedKeys.has('map')} onToggle={() => toggleExpand('map')}>
        <TreeItem label="注记地图" level={2 + L} />
        <TreeItem label="影像地图" level={2 + L} />
        <TreeItem label="电子地图" level={2 + L} />
        <TreeItem label="地形" level={2 + L} />
        <TreeItem label="地名" level={2 + L} />
      </TreeItem>
      <TreeItem label="实景三维" level={1 + L} isOpen={expandedKeys.has('3d')} onToggle={() => toggleExpand('3d')}>
        <TreeItem label="白模" level={2 + L} />
        <TreeItem label="倾斜摄影" level={2 + L} />
        <TreeItem label="BIM" level={2 + L} />
        <TreeItem label="CIM" level={2 + L} />
      </TreeItem>
      <TreeItem label="其他测绘数据" level={1 + L} />
    </TreeItem>

    <TreeItem label="遥感遥测" level={L} isOpen={expandedKeys.has('rs')} onToggle={() => toggleExpand('rs')}>
      <TreeItem label="卫星遥感" level={1 + L} isOpen={expandedKeys.has('sat')} onToggle={() => toggleExpand('sat')}>
        <TreeItem label="哨兵" level={2 + L} />
        <TreeItem label="哨兵三号" level={3 + L} />
        <TreeItem label="哨兵一号" level={3 + L} />
        <TreeItem label="哨兵二号" level={3 + L} />
      </TreeItem>
    </TreeItem>

    <TreeItem label="行业专题" level={L} isOpen={expandedKeys.has('industry')} onToggle={() => toggleExpand('industry')} />
  </>
);

export const DataThemePanel: React.FC<DataThemePanelProps> = ({
  variant = 'page',
  sidebarTitle = '数据总库',
}) => {
  const [expandedKeys, setExpandedKeys] = useState<Set<string>>(
    () => new Set(['allThemes', 'base', 'address', 'map', '3d', 'rs', 'sat']),
  );
  const [dataListLayerTab, setDataListLayerTab] = useState<(typeof DATA_LIST_LAYER_TABS)[number]['id']>('source');
  const [themePage, setThemePage] = useState(1);
  const [themePageSize, setThemePageSize] = useState(10);
  const [themeQuery, setThemeQuery] = useState('');
  /** 数据列表侧栏在「全部主题」根下多一级缩进 */
  const L = variant === 'sidebar' ? 1 : 0;

  const filteredThemes = useMemo(() => {
    const q = themeQuery.trim().toLowerCase();
    if (!q) return MOCK_THEMES;
    return MOCK_THEMES.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.code.toLowerCase().includes(q) ||
        t.desc.toLowerCase().includes(q),
    );
  }, [themeQuery]);

  const themeTotalPages = Math.max(1, Math.ceil(filteredThemes.length / themePageSize));
  const pagedThemes = useMemo(() => {
    const start = (themePage - 1) * themePageSize;
    return filteredThemes.slice(start, start + themePageSize);
  }, [filteredThemes, themePage, themePageSize]);

  useEffect(() => {
    setThemePage(1);
  }, [themeQuery]);

  useEffect(() => {
    if (themePage > themeTotalPages) setThemePage(themeTotalPages);
  }, [themePage, themeTotalPages]);

  const toggleExpand = (key: string) => {
    const next = new Set(expandedKeys);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setExpandedKeys(next);
  };

  const treeColumnClassName =
    variant === 'sidebar'
      ? 'flex h-full min-h-0 w-full flex-col overflow-hidden bg-white'
      : 'relative z-20 flex h-full min-h-0 w-[280px] shrink-0 flex-col overflow-hidden border-r border-slate-100 bg-[#fcfdfe]/50 transition-all duration-300 ease-in-out';

  const themeTreeColumn = (
    <div className={treeColumnClassName}>
        <div className="space-y-3 p-4">
          <div className="flex items-center gap-3">
            <div className="shrink-0 rounded-lg bg-blue-50 p-2 text-blue-600">
                <LayoutGrid size={20} />
            </div>
            <h2 className="whitespace-nowrap text-[15px] font-bold text-slate-800">
              {variant === 'sidebar' ? sidebarTitle : '数据主题'}
            </h2>
          </div>

          {variant === 'sidebar' ? (
            <>
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索主题"
                  className="h-9 w-full rounded-lg border border-slate-200 bg-white pl-3 pr-9 text-[13px] outline-none transition-all focus:border-blue-400"
                />
                <Search className="absolute right-2.5 top-2.5 text-slate-400" size={15} />
              </div>
              <div className="flex gap-1.5">
                {DATA_LIST_LAYER_TABS.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setDataListLayerTab(t.id)}
                    className={`
                      flex-1 rounded-md px-2 py-1.5 text-center text-[12px] font-medium transition-colors
                      ${dataListLayerTab === t.id ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
                    `}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </>
          ) : (
            <div className="flex h-8 items-center gap-2 overflow-hidden">
              <div className="group relative flex-1">
                <input
                  type="text"
                  placeholder="请输入"
                  className="h-8 w-full rounded border border-slate-200 bg-white pl-3 pr-8 text-xs outline-none transition-all focus:border-blue-400"
                />
                <Search className="absolute right-2 top-2 text-slate-300" size={14} />
              </div>
              <button
                type="button"
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-blue-600 text-white shadow-sm shadow-blue-100 hover:bg-blue-700"
              >
                <Plus size={16} />
              </button>
            </div>
          )}
        </div>

        <div
          className={`flex-1 overflow-y-auto px-2 pb-4 overflow-x-hidden ${
            variant === 'sidebar' ? 'no-scrollbar' : 'custom-scrollbar'
          }`}
        >
          <div className="space-y-0.5">
            <TreeItem
              label="全部主题"
              level={0}
              isOpen={expandedKeys.has('allThemes')}
              onToggle={() => toggleExpand('allThemes')}
            >
              <ThemeTreeBranches L={variant === 'sidebar' ? L : 1} expandedKeys={expandedKeys} toggleExpand={toggleExpand} />
            </TreeItem>
          </div>
        </div>
    </div>
  );

  if (variant === 'sidebar') {
    return (
      <aside className="flex h-full min-h-0 max-w-[320px] min-w-[220px] shrink-0 basis-[25%] animate-fadeIn flex-col overflow-hidden rounded-xl border border-slate-200/90 bg-white shadow-sm">
        {themeTreeColumn}
      </aside>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-row overflow-hidden bg-white animate-fadeIn">
      {themeTreeColumn}

      {/* 2. Main Content List */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50/30 p-6">
        <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-slate-200/60 bg-white shadow-sm">
          
          {/* Top Actions */}
          <div className="flex shrink-0 items-center justify-between border-b border-slate-100 p-4">
            <div className="group relative w-80">
              <input 
                type="text" 
                value={themeQuery}
                onChange={(e) => setThemeQuery(e.target.value)}
                placeholder="请输入主题名称搜索（名称 / 编码 / 描述）" 
                className="h-9 w-full rounded-lg border border-slate-200 bg-slate-50 pl-4 pr-10 text-sm outline-none transition-all focus:border-blue-400 focus:bg-white"
              />
              <Search className="absolute right-3 top-2.5 text-slate-300" size={16} />
            </div>
            <button type="button" className="flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white shadow-md shadow-blue-100 transition-all hover:bg-blue-700">
               <Trash2 size={16} />
               批量删除
            </button>
          </div>

          {/* Table：纵向滚动浏览，结合分页查询 */}
          <div className="min-h-0 flex-1 overflow-auto custom-scrollbar">
            <table className="w-full border-collapse text-left text-[13px]">
              <thead className="sticky top-0 z-10 border-b border-slate-100 bg-[#f8fafc] font-bold text-slate-500">
                <tr>
                  <th className="w-12 p-4 text-center"><input type="checkbox" className="rounded border-slate-300" /></th>
                  <th className="p-4">主题编码</th>
                  <th className="p-4">主题名称</th>
                  <th className="p-4">主题描述</th>
                  <th className="w-24 p-4">排序号</th>
                  <th className="w-[150px] p-4 text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {pagedThemes.map((theme) => (
                  <tr key={theme.id} className="transition-colors hover:bg-blue-50/10">
                    <td className="p-4 text-center"><input type="checkbox" className="rounded border-slate-300" /></td>
                    <td className="p-4 font-medium text-slate-600">{theme.code}</td>
                    <td className="p-4 font-bold text-slate-800">{theme.name}</td>
                    <td className="max-w-md p-4">
                      <span className="line-clamp-2 text-[12px] font-medium leading-relaxed text-slate-600" title={theme.desc}>
                        {theme.desc}
                      </span>
                    </td>
                    <td className="p-4 font-medium tabular-nums text-slate-600">{theme.sort}</td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-1.5 text-blue-600">
                        <button type="button" className="rounded-lg p-2 transition-all hover:bg-blue-50 hover:text-blue-800" title="编辑"><Edit3 size={16} /></button>
                        <button type="button" className="rounded-lg p-2 transition-all hover:bg-red-50 hover:text-red-600" title="删除"><Trash2 size={16} /></button>
                        <button type="button" className="rounded-lg p-2 transition-all hover:bg-blue-50 hover:text-blue-800" title="添加子主题"><PlusCircle size={16} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="shrink-0 border-t border-slate-100 bg-white px-6 py-4">
            <PaginationBar
              total={filteredThemes.length}
              page={themePage}
              pageSize={themePageSize}
              onPageChange={setThemePage}
              onPageSizeChange={(s) => {
                setThemePageSize(s);
                setThemePage(1);
              }}
            />
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
