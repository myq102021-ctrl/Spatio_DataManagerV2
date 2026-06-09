import React, { useMemo, useState, useEffect } from 'react';
import { DataStandardNewWizard } from './DataStandardNewWizard';
import { PaginationBar } from './PaginationBar';
import {
  CheckCircle2,
  ChevronDown,
  Copy,
  Database,
  Edit2,
  Eye,
  FileText,
  Filter,
  Folder,
  FolderOpen,
  Info,
  LayoutPanelLeft,
  MoreVertical,
  PanelLeftClose,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';

interface StandardDirectory {
  id: string;
  label: string;
  count?: number;
  children?: StandardDirectory[];
  /** Leaf standard-set node (blue square in reference) */
  isSet?: boolean;
}

export type StandardLifecycleStatus =
  | '已生效'
  | '待生效'
  | '发布中'
  | '修订中'
  | '草稿'
  | '已失效';

interface StandardRow {
  id: string;
  numericId: string;
  name: string;
  nameEn: string;
  code: string;
  standardType: string;
  directoryPath: string;
  /** Matches StandardDirectory.id for tree filtering */
  dirId: string;
  status: StandardLifecycleStatus;
  modifyTime: string;
  creator: string;
}

/** 左侧标准集目录 mock：遥感卫星影像 / 测绘数据 / 农业业务数据 */
const DIRECTORY_TREE: StandardDirectory[] = [
  {
    id: 'root',
    label: '全部标准集',
    count: 14,
    children: [
      {
        id: 'rs',
        label: '遥感卫星影像相关',
        count: 5,
        children: [
          { id: 'rs-optical', label: '光学卫星影像标准集', count: 2, isSet: true },
          { id: 'rs-sar', label: '雷达卫星影像标准集', count: 1, isSet: true },
          { id: 'rs-meta', label: '卫星影像元数据标准集', count: 2, isSet: true },
        ],
      },
      {
        id: 'survey',
        label: '测绘数据',
        count: 4,
        children: [
          { id: 'survey-basic', label: '基础测绘成果标准集', count: 2, isSet: true },
          { id: 'survey-national', label: '地理国情监测标准集', count: 1, isSet: true },
          { id: 'survey-3d', label: '实景三维测绘标准集', count: 1, isSet: true },
        ],
      },
      {
        id: 'agri',
        label: '农业业务数据',
        count: 5,
        children: [
          { id: 'agri-growth', label: '农作物长势遥感标准集', count: 1, isSet: true },
          { id: 'agri-parcel', label: '耕地地块业务标准集', count: 2, isSet: true },
          { id: 'agri-weather', label: '农业气象观测标准集', count: 2, isSet: true },
        ],
      },
    ],
  },
];

const STANDARD_ROWS: StandardRow[] = [
  {
    id: '1',
    numericId: '20001001',
    name: '影像云量占比',
    nameEn: 'cloud_cover_ratio',
    code: 'RS_OPT_CC_001',
    standardType: '字段标准',
    directoryPath: '/遥感卫星影像相关/光学卫星影像标准集',
    dirId: 'rs-optical',
    status: '已生效',
    modifyTime: '2025/04/02 10:20',
    creator: 'rs_admin',
  },
  {
    id: '2',
    numericId: '20001002',
    name: '多光谱波段标识',
    nameEn: 'spectral_band_id',
    code: 'RS_OPT_BAND_002',
    standardType: '编码标准',
    directoryPath: '/遥感卫星影像相关/光学卫星影像标准集',
    dirId: 'rs-optical',
    status: '已生效',
    modifyTime: '2025/03/18 14:11',
    creator: 'zhangsan',
  },
  {
    id: '3',
    numericId: '20002001',
    name: 'SAR 极化方式',
    nameEn: 'sar_polarization',
    code: 'RS_SAR_POL_001',
    standardType: '编码标准',
    directoryPath: '/遥感卫星影像相关/雷达卫星影像标准集',
    dirId: 'rs-sar',
    status: '修订中',
    modifyTime: '2025/02/28 09:00',
    creator: 'zhanglei',
  },
  {
    id: '4',
    numericId: '20003001',
    name: '景幅轨道圈号',
    nameEn: 'path_row_id',
    code: 'RS_META_ORB_001',
    standardType: '字段标准',
    directoryPath: '/遥感卫星影像相关/卫星影像元数据标准集',
    dirId: 'rs-meta',
    status: '已生效',
    modifyTime: '2025/01/15 16:40',
    creator: 'rs_admin',
  },
  {
    id: '5',
    numericId: '20003002',
    name: '地面分辨率',
    nameEn: 'ground_resolution_m',
    code: 'RS_META_RES_002',
    standardType: '字段标准',
    directoryPath: '/遥感卫星影像相关/卫星影像元数据标准集',
    dirId: 'rs-meta',
    status: '草稿',
    modifyTime: '2025/04/10 11:05',
    creator: 'lisi',
  },
  {
    id: '6',
    numericId: '30001001',
    name: '平面坐标精度等级',
    nameEn: 'planar_accuracy_class',
    code: 'SVY_ACC_001',
    standardType: '字段标准',
    directoryPath: '/测绘数据/基础测绘成果标准集',
    dirId: 'survey-basic',
    status: '已生效',
    modifyTime: '2024/12/01 08:30',
    creator: 'survey_ops',
  },
  {
    id: '7',
    numericId: '30001002',
    name: 'DLG 要素分类代码',
    nameEn: 'dlg_feature_code',
    code: 'SVY_DLG_002',
    standardType: '编码标准',
    directoryPath: '/测绘数据/基础测绘成果标准集',
    dirId: 'survey-basic',
    status: '已生效',
    modifyTime: '2024/11/20 13:22',
    creator: 'survey_ops',
  },
  {
    id: '8',
    numericId: '30002001',
    name: '地表覆盖分类码',
    nameEn: 'land_cover_code',
    code: 'SVY_LC_001',
    standardType: '编码标准',
    directoryPath: '/测绘数据/地理国情监测标准集',
    dirId: 'survey-national',
    status: '发布中',
    modifyTime: '2025/03/01 10:00',
    creator: 'wangwu',
  },
  {
    id: '9',
    numericId: '30003001',
    name: '实景三维 LOD 级别',
    nameEn: 'mesh_lod_level',
    code: 'SVY_3D_LOD_001',
    standardType: '字段标准',
    directoryPath: '/测绘数据/实景三维测绘标准集',
    dirId: 'survey-3d',
    status: '已生效',
    modifyTime: '2025/02/14 15:45',
    creator: 'survey_ops',
  },
  {
    id: '10',
    numericId: '40001001',
    name: '作物 NDVI 阈值',
    nameEn: 'crop_ndvi_threshold',
    code: 'AGR_NDVI_001',
    standardType: '字段标准',
    directoryPath: '/农业业务数据/农作物长势遥感标准集',
    dirId: 'agri-growth',
    status: '已生效',
    modifyTime: '2025/04/08 09:15',
    creator: 'agri_analyst',
  },
  {
    id: '11',
    numericId: '40002001',
    name: '耕地地块权属编码',
    nameEn: 'parcel_rights_code',
    code: 'AGR_PAR_RGT_001',
    standardType: '编码标准',
    directoryPath: '/农业业务数据/耕地地块业务标准集',
    dirId: 'agri-parcel',
    status: '修订中',
    modifyTime: '2025/03/22 14:00',
    creator: 'agri_analyst',
  },
  {
    id: '12',
    numericId: '40002002',
    name: '土壤类型代码',
    nameEn: 'soil_type_code',
    code: 'AGR_SOIL_002',
    standardType: '编码标准',
    directoryPath: '/农业业务数据/耕地地块业务标准集',
    dirId: 'agri-parcel',
    status: '草稿',
    modifyTime: '2025/04/12 16:30',
    creator: 'intern_zhao',
  },
  {
    id: '13',
    numericId: '40003001',
    name: '土壤墒情等级',
    nameEn: 'soil_moisture_level',
    code: 'AGR_MOIST_001',
    standardType: '字段标准',
    directoryPath: '/农业业务数据/农业气象观测标准集',
    dirId: 'agri-weather',
    status: '已生效',
    modifyTime: '2025/01/08 10:20',
    creator: 'agri_analyst',
  },
  {
    id: '14',
    numericId: '40003002',
    name: '积温累计值',
    nameEn: 'accumulated_temperature',
    code: 'AGR_GDD_002',
    standardType: '字段标准',
    directoryPath: '/农业业务数据/农业气象观测标准集',
    dirId: 'agri-weather',
    status: '已失效',
    modifyTime: '2023/09/01 12:00',
    creator: 'legacy_user',
  },
];

/** Directory ids under `root` — selecting a parent shows all descendant rows */
const DIR_DESCENDANTS: Record<string, Set<string>> = {
  root: new Set(STANDARD_ROWS.map((r) => r.dirId)),
  rs: new Set(['rs-optical', 'rs-sar', 'rs-meta']),
  'rs-optical': new Set(['rs-optical']),
  'rs-sar': new Set(['rs-sar']),
  'rs-meta': new Set(['rs-meta']),
  survey: new Set(['survey-basic', 'survey-national', 'survey-3d']),
  'survey-basic': new Set(['survey-basic']),
  'survey-national': new Set(['survey-national']),
  'survey-3d': new Set(['survey-3d']),
  agri: new Set(['agri-growth', 'agri-parcel', 'agri-weather']),
  'agri-growth': new Set(['agri-growth']),
  'agri-parcel': new Set(['agri-parcel']),
  'agri-weather': new Set(['agri-weather']),
};

const STATUS_TABS: { key: StandardLifecycleStatus; label: string }[] = [
  { key: '已生效', label: '已生效' },
  { key: '待生效', label: '待生效' },
  { key: '发布中', label: '发布中' },
  { key: '修订中', label: '修订中' },
  { key: '草稿', label: '草稿' },
  { key: '已失效', label: '已失效' },
];

export const DataStandardPanel: React.FC = () => {
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(['root', 'rs', 'survey', 'agri'])
  );
  const [selectedDir, setSelectedDir] = useState('root');
  const [keyword, setKeyword] = useState('');
  const [statusTab, setStatusTab] = useState<StandardLifecycleStatus>('已生效');
  const [mineOnly, setMineOnly] = useState(false);
  const [viewMode, setViewMode] = useState<'查看' | '编辑'>('查看');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [batchOpen, setBatchOpen] = useState(false);
  const [createWizardOpen, setCreateWizardOpen] = useState(false);
  const [stdPage, setStdPage] = useState(1);
  const [stdPageSize, setStdPageSize] = useState(10);

  const statusCounts = useMemo(() => {
    const c: Record<StandardLifecycleStatus, number> = {
      已生效: 0,
      待生效: 0,
      发布中: 0,
      修订中: 0,
      草稿: 0,
      已失效: 0,
    };
    STANDARD_ROWS.forEach((r) => {
      c[r.status]++;
    });
    return c;
  }, []);

  const filteredRows = useMemo(() => {
    const allowed = DIR_DESCENDANTS[selectedDir] ?? new Set([selectedDir]);
    return STANDARD_ROWS.filter((row) => {
      const matchDir = allowed.has(row.dirId);
      const matchKeyword = `${row.name}${row.code}${row.numericId}${row.nameEn}`
        .toLowerCase()
        .includes(keyword.toLowerCase());
      const matchStatus = row.status === statusTab;
      const matchMine = !mineOnly || row.creator === 'zhanglei';
      return matchDir && matchKeyword && matchStatus && matchMine;
    });
  }, [keyword, statusTab, mineOnly, selectedDir]);

  const pagedStdRows = useMemo(() => {
    const start = (stdPage - 1) * stdPageSize;
    return filteredRows.slice(start, start + stdPageSize);
  }, [filteredRows, stdPage, stdPageSize]);

  useEffect(() => {
    setStdPage(1);
  }, [keyword, statusTab, mineOnly, selectedDir]);

  useEffect(() => {
    const tp = Math.max(1, Math.ceil(filteredRows.length / stdPageSize));
    setStdPage((p) => Math.min(p, tp));
  }, [filteredRows.length, stdPageSize]);

  const toggleExpand = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  return (
    <div className="relative flex-1 flex h-full min-h-0 overflow-hidden animate-fadeIn bg-white">
      {createWizardOpen && (
        <DataStandardNewWizard onClose={() => setCreateWizardOpen(false)} />
      )}
      {/* Left: 标准集 — 与数据主题等模块一致的侧栏样式 */}
      {!sidebarCollapsed && (
        <div className="w-[280px] flex-shrink-0 flex flex-col border-r border-slate-100 bg-[#fcfdfe]/50 overflow-hidden relative z-20 transition-all duration-300 ease-in-out">
          <div className="flex items-center justify-between h-12 px-4 border-b border-slate-100">
            <span className="text-[14px] font-bold text-slate-800">标准集</span>
            <div className="flex items-center gap-0.5 text-slate-400">
              <button
                type="button"
                title="收起"
                onClick={() => setSidebarCollapsed(true)}
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:text-blue-600 hover:bg-blue-50"
              >
                <PanelLeftClose size={15} />
              </button>
              <button
                type="button"
                title="新建"
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:text-blue-600 hover:bg-blue-50"
              >
                <Plus size={15} />
              </button>
              <button
                type="button"
                title="编辑"
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:text-blue-600 hover:bg-blue-50"
              >
                <Pencil size={14} />
              </button>
              <button
                type="button"
                title="删除"
                className="w-7 h-7 rounded-lg flex items-center justify-center hover:text-red-600 hover:bg-red-50"
              >
                <Trash2 size={14} />
              </button>
            </div>
          </div>
          <div className="px-3 pt-3 pb-2">
            <div className="relative">
              <Search
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300"
                size={14}
              />
              <input
                className="w-full h-8 pl-8 pr-2 bg-white border border-slate-200 rounded-lg text-[13px] outline-none transition-all focus:border-blue-400"
                placeholder="搜索标准集"
              />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-4 custom-scrollbar min-h-0">
            {DIRECTORY_TREE.map((node) => (
              <DirectoryTreeNode
                key={node.id}
                node={node}
                level={0}
                selectedId={selectedDir}
                expanded={expanded}
                onSelect={setSelectedDir}
                onToggle={toggleExpand}
              />
            ))}
          </div>
        </div>
      )}

      {sidebarCollapsed && (
        <button
          type="button"
          onClick={() => setSidebarCollapsed(false)}
          className="flex-shrink-0 w-10 border-r border-slate-100 bg-[#fcfdfe]/50 flex flex-col items-center pt-3 text-slate-400 hover:text-blue-600"
          title="展开标准集"
        >
          <LayoutPanelLeft size={18} />
        </button>
      )}

      {/* Main：与 DataThemePanel 相同 — 浅底 padding + 内层白卡片铺满高度，消除底部灰缝 */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 p-6 bg-slate-50/30 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden ring-1 ring-slate-900/5">
        {/* Toolbar row：标题一行；筛选区单行不换行（我负责的 / 搜索 / 筛选 / 编辑·查看 / 刷新） */}
        <div className="flex-shrink-0 flex flex-nowrap items-center justify-between gap-4 px-6 pt-5 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2 shrink-0">
            <h1 className="text-[16px] font-bold text-slate-800 whitespace-nowrap">
              标准列表
            </h1>
            <button
              type="button"
              className="text-slate-400 hover:text-blue-600 p-0.5"
              title="说明"
            >
              <Info size={15} />
            </button>
          </div>
          <div className="flex flex-nowrap items-center gap-2 justify-end min-w-0 flex-1 overflow-x-auto custom-scrollbar">
            <label className="flex items-center gap-1.5 text-[13px] text-slate-600 cursor-pointer select-none whitespace-nowrap shrink-0">
              <input
                type="checkbox"
                checked={mineOnly}
                onChange={(e) => setMineOnly(e.target.checked)}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
              />
              我负责的
            </label>
            <div className="relative flex-1 min-w-[140px] max-w-[280px] shrink">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none"
                size={14}
              />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="标准名称 / 编码 / ID"
                className="w-full h-8 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-blue-400 focus:bg-white transition-all"
              />
            </div>
            <button
              type="button"
              className="h-8 px-3 border border-slate-200 rounded-lg text-[13px] text-slate-600 flex items-center gap-1.5 shrink-0 hover:text-blue-600 hover:border-blue-300"
            >
              <Filter size={14} />
              筛选
            </button>
            <div className="inline-flex shrink-0 rounded-lg border border-slate-200 overflow-hidden text-[13px]">
              <button
                type="button"
                onClick={() => setViewMode('编辑')}
                className={`px-3 h-8 ${viewMode === '编辑' ? 'bg-blue-50 text-blue-600 font-medium' : 'bg-white text-slate-600 hover:text-blue-600'}`}
              >
                编辑
              </button>
              <button
                type="button"
                onClick={() => setViewMode('查看')}
                className={`px-3 h-8 border-l border-slate-200 ${viewMode === '查看' ? 'bg-blue-50 text-blue-600 font-medium' : 'bg-white text-slate-600 hover:text-blue-600'}`}
              >
                查看
              </button>
            </div>
            <button
              type="button"
              className="w-8 h-8 shrink-0 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:border-blue-300"
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* Status tabs + actions */}
        <div className="flex-shrink-0 flex flex-wrap items-center justify-between gap-3 px-6 py-2 border-b border-slate-100 bg-white">
          <div className="flex flex-wrap items-end gap-0 min-w-0 overflow-x-auto custom-scrollbar">
            {STATUS_TABS.map((tab) => {
              const active = statusTab === tab.key;
              const count = statusCounts[tab.key];
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setStatusTab(tab.key)}
                  className={`relative px-4 py-2.5 text-[13px] whitespace-nowrap transition-colors ${
                    active
                      ? 'text-blue-600 font-medium'
                      : 'text-slate-600 hover:text-blue-600'
                  }`}
                >
                  {tab.label}
                  <span className="text-slate-400 font-normal ml-1">({count})</span>
                  {active && (
                    <span className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full bg-blue-600" />
                  )}
                </button>
              );
            })}
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="relative">
              <button
                type="button"
                onClick={() => setBatchOpen(!batchOpen)}
                className="h-8 px-3 border border-slate-200 rounded-lg text-[13px] text-slate-600 flex items-center gap-1 hover:border-blue-300 hover:text-blue-600"
              >
                批量导入导出
                <ChevronDown size={14} />
              </button>
              {batchOpen && (
                <>
                  <button
                    type="button"
                    className="fixed inset-0 z-10 cursor-default"
                    aria-label="关闭菜单"
                    onClick={() => setBatchOpen(false)}
                  />
                  <div className="absolute right-0 top-full mt-1 z-20 min-w-[140px] py-1 bg-white border border-slate-100 rounded-lg shadow-lg text-[13px]">
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-slate-50"
                      onClick={() => setBatchOpen(false)}
                    >
                      批量导入
                    </button>
                    <button
                      type="button"
                      className="w-full text-left px-3 py-2 hover:bg-slate-50"
                      onClick={() => setBatchOpen(false)}
                    >
                      批量导出
                    </button>
                  </div>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={() => setCreateWizardOpen(true)}
              className="h-8 px-4 rounded-lg text-[13px] font-bold text-white flex items-center gap-1 shadow-md shadow-blue-100 bg-blue-600 hover:bg-blue-700 transition-colors"
            >
              <Plus size={14} /> 新建标准
            </button>
          </div>
        </div>

        {/* Total hint */}
        <div className="flex-shrink-0 px-6 pt-3 pb-1 flex items-baseline gap-2">
          <span className="text-[28px] font-semibold leading-none text-slate-800">
            {filteredRows.length}
          </span>
          <span className="text-[13px] text-slate-400">条符合条件</span>
        </div>

        {/* Table */}
        <div className="flex-1 min-h-0 overflow-auto px-6 pb-2 custom-scrollbar">
          <table className="w-full text-left text-[13px] border-collapse min-w-[860px]">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="py-3 px-2 w-10 text-center bg-[#f8fafc]">
                  <input type="checkbox" className="rounded border-slate-300" />
                </th>
                <th className="py-3 px-3 font-bold text-slate-500 bg-[#f8fafc]">
                  标准名称
                </th>
                <th className="py-3 px-3 font-bold text-slate-500 bg-[#f8fafc]">
                  所属目录 / 标准集
                </th>
                <th className="py-3 px-3 font-bold text-slate-500 bg-[#f8fafc]">
                  标准编码 / ID
                </th>
                <th className="py-3 px-3 font-bold text-slate-500 bg-[#f8fafc]">
                  标准类型
                </th>
                <th className="py-3 px-3 font-bold text-slate-500 text-center bg-[#f8fafc] w-[140px]">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {pagedStdRows.map((row) => (
                <tr key={row.id} className="hover:bg-blue-50/10 transition-colors">
                  <td className="py-3 px-2 text-center align-top">
                    <input type="checkbox" className="rounded border-slate-300" />
                  </td>
                  <td className="py-3 px-3 align-top">
                    <div className="flex items-start gap-2">
                      {row.status === '已生效' && (
                        <CheckCircle2
                          size={16}
                          className="text-[#52c41a] flex-shrink-0 mt-0.5"
                          strokeWidth={2}
                        />
                      )}
                      <div>
                        <div className="font-bold text-slate-800">{row.name}</div>
                        <div className="text-[12px] text-slate-400 mt-0.5">{row.nameEn}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-3 align-top">
                    <button
                      type="button"
                      className="text-left text-[13px] text-blue-600 hover:underline leading-snug break-all"
                    >
                      {row.directoryPath}
                    </button>
                  </td>
                  <td className="py-3 px-3 align-top">
                    <div className="font-mono text-[13px] text-slate-700">{row.code}</div>
                    <div className="text-[12px] text-slate-400 mt-0.5">{row.numericId}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-600 align-top">{row.standardType}</td>
                  <td className="py-3 px-2 align-top">
                    <div className="flex items-center justify-center gap-0.5 text-blue-600">
                      <button
                        type="button"
                        className="p-1.5 rounded-lg hover:text-blue-800 hover:bg-blue-50"
                        title="查看"
                      >
                        <Eye size={15} />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 rounded-lg hover:text-blue-800 hover:bg-blue-50"
                        title="编辑"
                      >
                        <Edit2 size={15} />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 rounded-lg hover:text-blue-800 hover:bg-blue-50"
                        title="复制"
                      >
                        <Copy size={15} />
                      </button>
                      <button
                        type="button"
                        className="p-1.5 rounded-lg hover:text-blue-800 hover:bg-blue-50"
                        title="更多"
                      >
                        <MoreVertical size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredRows.length === 0 && (
            <div className="py-16 text-center text-slate-400 text-[13px]">
              <Database className="mx-auto mb-2 opacity-40" size={40} />
              暂无数据，请切换状态标签或搜索条件
            </div>
          )}
        </div>

        <div className="flex-shrink-0 border-t border-slate-100 bg-white px-6 py-4">
          <PaginationBar
            total={filteredRows.length}
            page={stdPage}
            pageSize={stdPageSize}
            onPageChange={setStdPage}
            onPageSizeChange={(s) => {
              setStdPageSize(s);
              setStdPage(1);
            }}
          />
        </div>
        </div>
      </div>
    </div>
  );
};

interface DirectoryTreeNodeProps {
  node: StandardDirectory;
  level: number;
  selectedId: string;
  expanded: Set<string>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}

const DirectoryTreeNode: React.FC<DirectoryTreeNodeProps> = ({
  node,
  level,
  selectedId,
  expanded,
  onSelect,
  onToggle,
}) => {
  const hasChildren = (node.children || []).length > 0;
  const isExpanded = expanded.has(node.id);
  const isSelected = selectedId === node.id;

  return (
    <div>
      <div
        style={{ paddingLeft: `${6 + level * 14}px` }}
        className={`min-h-8 pr-2 rounded-lg flex items-center cursor-pointer group ${
          isSelected ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
        }`}
        onClick={() => onSelect(node.id)}
      >
        <button
          type="button"
          className="w-5 h-5 mr-0.5 text-[#8c8c8c] flex items-center justify-center shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggle(node.id);
          }}
        >
          {hasChildren ? (
            <ChevronDown size={14} className={`transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
          ) : (
            <span className="w-3 inline-block" />
          )}
        </button>
        {node.isSet ? (
          <span className="w-3 h-3 rounded-sm shrink-0 mr-1.5 bg-blue-600" />
        ) : hasChildren ? (
          isExpanded ? (
            <FolderOpen size={14} className="text-blue-600 shrink-0 mr-1" />
          ) : (
            <Folder size={14} className="text-blue-600 shrink-0 mr-1" />
          )
        ) : (
          <FileText size={14} className="text-[#bfbfbf] shrink-0 mr-1" />
        )}
        <span
          className={`text-[13px] truncate flex-1 ${isSelected ? 'font-medium' : ''}`}
          title={node.label}
        >
          {node.label}
        </span>
        {node.count != null && (
          <span className="text-[12px] text-slate-400 shrink-0 ml-1">({node.count})</span>
        )}
      </div>
      {hasChildren && isExpanded && node.children!.map((child) => (
        <DirectoryTreeNode
          key={child.id}
          node={child}
          level={level + 1}
          selectedId={selectedId}
          expanded={expanded}
          onSelect={onSelect}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
};
