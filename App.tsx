
import React, { useEffect, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { DataThemePanel } from './components/DataThemePanel';
import { DataTablePanel } from './components/DataTablePanel';
import { DataDetailPanel } from './components/DataDetailPanel';
import { DataSmartMapPanel } from './components/DataSmartMapPanel';
import { DataSmartMapMarketPanel } from './components/DataSmartMapMarketPanel';
import { ProductionLinePanel } from './components/ProductionLinePanel';
import { SpatialDataIngestionPanel } from './components/SpatialDataIngestionPanel';
import { CreateIngestionTaskPanel } from './components/CreateIngestionTaskPanel';
import { CloudDiskSelectionPage, type CloudFile } from './components/CloudDiskSelectionPage';
import { getGf1cSceneDetail, isGf1cSceneTaskId } from './gf1cBatchIngestionMock';
import type { IngestionBatchSubTaskEditContext } from './lib/ingestionBatchSubTaskEdit';
import { DataStatsPanel } from './components/DataStatsPanel';
import { ServiceDevelopmentPanel, DirectoryNode } from './components/ServiceDevelopmentPanel';
import { ServiceMarketPanel } from './components/ServiceMarketPanel';
import { PersonalConsolePanel } from './components/PersonalConsolePanel';
import { MyApplicationsPanel } from './components/MyApplicationsPanel';
import { AuditApplicationPanel } from './components/AuditApplicationPanel';
import { SpatialSearchPanel } from './components/SpatialSearchPanel';
import { KnowledgeGraphSearchPanel } from './components/KnowledgeGraphSearchPanel';
import { DataSensitivityPanel } from './components/DataSensitivityPanel';
import { SensitiveDataConfigPanel } from './components/SensitiveDataConfigPanel';
import { IdentificationRulesPanel } from './components/IdentificationRulesPanel';
import { GovernanceToolsPanel } from './components/GovernanceToolsPanel';
import { BusinessManagementPanel } from './components/BusinessManagementPanel';
import { DataStandardPanel } from './components/DataStandardPanel';
import { StandardCodeTablePanel } from './components/StandardCodeTablePanel';
import { MOCK_API_DATA, APIRow } from './constants';
import { ApplicationRecord, MarketNode, TableRow } from './types';
import { LayoutGrid } from 'lucide-react';

/* Fix: Define initial directories and applications data with rich mock records */
const INITIAL_DIRECTORIES: DirectoryNode[] = [
  { id: 'ogc', label: 'OGC 标准服务', count: 4, children: [] },
  { id: 'rest', label: 'REST 业务服务', count: 4, children: [] },
  { id: 'cloud', label: '云原生服务', count: 1, children: [] },
];

const INITIAL_MARKET_TREE: MarketNode[] = [
  { id: 'all', label: '全部场景', icon: <LayoutGrid size={16} />, count: 128 },
  { 
    id: 'natural', 
    label: '自然资源', 
    children: [
      { 
        id: 'scene_urban_planning', 
        label: '国土空间规划一张图', 
        children: [
            { id: 'layer_urban_1', label: '图层一：城镇开发边界' },
            { id: 'layer_urban_2', label: '图层二：基本农田红线' }
        ]
      },
      { 
        id: 'scene_land_monitoring', 
        label: '土地利用现状监测', 
        children: [
            { id: 'layer_land_1', label: '图层一：分类植被覆盖' },
            { id: 'layer_land_2', label: '图层二：年度变更调查' }
        ]
      }
    ] 
  },
  { 
    id: 'water_dept', 
    label: '水利部门', 
    children: [
      { id: 'water', label: '水利政务管理', count: 15 },
      { id: 'river', label: '河道采砂监管', count: 7 }
    ] 
  },
  { 
    id: 'traffic_dept', 
    label: '交通运输', 
    children: [
      { id: 'traffic', label: '智慧交通出行', count: 28 },
      { id: 'highway', label: '高速公路资产', count: 12 }
    ] 
  },
  { id: 'ecology', label: '生态环境监测', count: 31 },
  { id: 'emergency', label: '应急指挥调度', count: 12 },
];

const DATA_MARKET_FAVORITES_STORAGE_KEY = 'data-market-favorites-v1';

function readDataMarketFavoriteIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DATA_MARKET_FAVORITES_STORAGE_KEY);
    if (!raw) return new Set();
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

const INITIAL_APPLICATIONS: ApplicationRecord[] = [
  {
    id: 'APP-20250115-921',
    serviceId: '1',
    serviceName: '湖北省2m卫星影像',
    category: '时空数据服务',
    type: 'WMTS',
    duration: '永久',
    status: 'approved',
    applyTime: '2025-01-15 10:20:00',
    protocols: ['WMTS', 'WMS'],
    applicant: '系统管理员',
    source: '服务集市',
    auditOpinion: '符合项目基础底图调用需求，准予通过。',
    appKey: 'ak-sp8x2j9m1',
    appSecret: 'sk-xxxxxxxxxxxx'
  },
  {
    id: 'APP-20250116-435',
    serviceId: '9',
    serviceName: '气象数据下载服务',
    category: '业务数据服务',
    type: '获取服务',
    duration: '3个月',
    status: 'pending',
    applyTime: '2025-01-16 14:45:12',
    protocols: ['RESTful'],
    applicant: '系统管理员',
    source: '服务集市'
  },
  {
    id: 'APP-20250116-882',
    serviceId: '15',
    serviceName: '智慧交通违章监测',
    category: '业务数据服务',
    type: '查询服务',
    duration: '1个月',
    status: 'pending',
    applyTime: '2025-01-16 16:30:05',
    protocols: ['RESTful'],
    applicant: '张三 (交通部)',
    source: '内部共享'
  },
  {
    id: 'APP-20250114-112',
    serviceId: '13',
    serviceName: '全省人口分布统计',
    category: '业务数据服务',
    type: '统计服务',
    duration: '永久',
    status: 'approved',
    applyTime: '2025-01-14 09:12:33',
    protocols: ['RESTful'],
    applicant: '李四 (社保局)',
    source: '服务集市',
    auditOpinion: '用于年度人口普查报告分析，审核通过。',
    appKey: 'ak-rj4k3l0p9',
    appSecret: 'sk-yyyyyyyyyyyy'
  },
  {
    id: 'APP-20250112-108',
    serviceId: '11',
    serviceName: '用户消费行为分析',
    category: '业务数据服务',
    type: '分析服务',
    duration: '7天',
    status: 'rejected',
    applyTime: '2025-01-12 09:15:33',
    protocols: ['RESTful'],
    applicant: '系统管理员',
    source: '服务集市',
    auditOpinion: '申请理由不充分，且该服务包含敏感消费数据，需补交数据使用协议。'
  },
  {
    id: 'APP-20250110-567',
    serviceId: '3',
    serviceName: '黄石2025标准地图',
    category: '时空数据服务',
    type: 'WMS',
    duration: '1个月',
    status: 'approved',
    applyTime: '2025-01-10 15:22:18',
    protocols: ['WMS'],
    applicant: '王五 (黄石规划局)',
    source: '服务集市',
    auditOpinion: '所属辖区标准地图调用，正常通过。',
    appKey: 'ak-nm2v7c4x1',
    appSecret: 'sk-zzzzzzzzzzzz'
  },
  {
    id: 'APP-20250116-001',
    serviceId: '7',
    serviceName: '全国16米一张图',
    category: '时空数据服务',
    type: 'COG',
    duration: '7天',
    status: 'pending',
    applyTime: '2025-01-16 17:05:44',
    protocols: ['COG'],
    applicant: '系统管理员',
    source: '服务集市'
  }
];

function App() {
  const [activeMenuId, setActiveMenuId] = useState<string>('smart_map'); 
  const [viewMode, setViewMode] = useState<'list' | 'detail'>('list');
  const [detailBackTarget, setDetailBackTarget] = useState<
    'data_list' | 'public_data_market' | 'my_favorites' | 'spatio_temporal_search'
  >('data_list');
  /** 从数据总库/集市列表进入详情时携带行数据 */
  const [dataListDetailContext, setDataListDetailContext] = useState<{
    name: string;
    listingStatus: TableRow['listingStatus'];
    themeNodeId?: string;
    adminDivision?: string;
  } | null>(null);
  const [spatialSearchDetailOpen, setSpatialSearchDetailOpen] = useState(false);
  
  const [ingestionSubView, setIngestionSubView] = useState<'list' | 'create' | 'cloud_disk'>('list');
  const [ingestionCreateMode, setIngestionCreateMode] = useState<'single' | 'batch'>('single');
  /** 入库列表：返回时恢复单次/批量、状态筛选与分页 */
  const [ingestionListScopeTab, setIngestionListScopeTab] = useState<'single' | 'batch'>('single');
  const [ingestionListStatusTab, setIngestionListStatusTab] = useState<
    'all' | 'processing' | 'success' | 'failure'
  >('all');
  const [ingestionListPage, setIngestionListPage] = useState(1);
  const [ingestionListPageSize, setIngestionListPageSize] = useState(10);
  /** 入库列表搜索、批量父行展开：进详情再返回列表时保留 */
  const [ingestionListSearchQuery, setIngestionListSearchQuery] = useState('');
  const [ingestionBatchExpandedParentIds, setIngestionBatchExpandedParentIds] = useState<string[]>([
    'bp-gf1c',
  ]);
  const [ingestionSceneDetailId, setIngestionSceneDetailId] = useState<string | null>(null);
  /** 从云盘选择页返回时，将选中项交给创建任务面板 */
  const [ingestionCloudPick, setIngestionCloudPick] = useState<{
    token: number;
    files: CloudFile[];
  } | null>(null);
  /** 从时空数据入库任务名进入的「已入库数据」详情 */
  const [ingestionDataDetailOpen, setIngestionDataDetailOpen] = useState(false);
  /** 编辑批量子任务：复用创建页表单 */
  const [ingestionEditSubTask, setIngestionEditSubTask] =
    useState<IngestionBatchSubTaskEditContext | null>(null);
  const [services, setServices] = useState<APIRow[]>(MOCK_API_DATA);
  const [directories, setDirectories] = useState<DirectoryNode[]>(INITIAL_DIRECTORIES);
  const [applications, setApplications] = useState<ApplicationRecord[]>(INITIAL_APPLICATIONS);
  const [marketTree, setMarketTree] = useState<MarketNode[]>(INITIAL_MARKET_TREE);

  /** 公共数据集市「收藏」与「我的收藏」列表共用 */
  const [dataMarketFavoriteIds, setDataMarketFavoriteIds] = useState(readDataMarketFavoriteIds);

  useEffect(() => {
    try {
      localStorage.setItem(
        DATA_MARKET_FAVORITES_STORAGE_KEY,
        JSON.stringify([...dataMarketFavoriteIds]),
      );
    } catch {
      /* ignore quota / private mode */
    }
  }, [dataMarketFavoriteIds]);

  useEffect(() => {
    setIngestionListPage(1);
  }, [ingestionListScopeTab, ingestionListStatusTab, ingestionListSearchQuery]);

  const toggleIngestionBatchParentExpand = (id: string) => {
    setIngestionBatchExpandedParentIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  };

  const toggleDataMarketFavorite = (id: string) => {
    setDataMarketFavoriteIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const mergeBatchDataMarketFavorites = (ids: string[]) => {
    if (ids.length === 0) return;
    setDataMarketFavoriteIds((prev) => {
      const next = new Set(prev);
      ids.forEach((id) => next.add(id));
      return next;
    });
  };

  const isSpatialIngestionMenu = (id: string) =>
    id === 'spatial_ingestion_single' || id === 'spatial_ingestion_batch';

  const handleMenuSelect = (id: string) => {
    setActiveMenuId(id);
    if (id !== 'spatio_temporal_search') {
      setSpatialSearchDetailOpen(false);
    }
    if (!isSpatialIngestionMenu(id)) {
      setIngestionDataDetailOpen(false);
      setIngestionSceneDetailId(null);
    }
    if (isSpatialIngestionMenu(id)) {
      setIngestionSubView('list');
      setIngestionDataDetailOpen(false);
      setIngestionCloudPick(null);
      setIngestionEditSubTask(null);
      setIngestionListScopeTab(id === 'spatial_ingestion_batch' ? 'batch' : 'single');
    }
    if (viewMode === 'detail') {
      setViewMode('list');
    }
  };

  const handleApplySuccess = (record: ApplicationRecord) => {
    setApplications(prev => [record, ...prev]);
  };

  const handleAuditAction = (id: string, status: 'approved' | 'rejected', auditOpinion?: string) => {
    setApplications(prev => prev.map(app => {
        if (app.id === id) {
            return {
                ...app,
                status,
                auditOpinion,
                appKey: status === 'approved' ? `ak-${Math.random().toString(36).substr(2, 9)}` : undefined
            };
        }
        return app;
    }));
  };

  const menuLabels: Record<string, string> = {
      data_list: '数据总库',
      metadata: '元数据管理',
      style_mgmt: '样式管理',
      data_theme: '数据主题',
      data_standard: '数据标准',
      standard_code_table: '标准码表',
      business_management: '业务管理',
      my_applications: '我的申请',
      my_favorites: '我的收藏',
      personal_console: '个人中心',
      audit_application: '数据申请审核',
      audit_listing: '数据上架审核',
      datasource_mgmt: '数据源管理',
      spatial_ingestion_single: '单次入库',
      spatial_ingestion_batch: '批量入库',
      spatio_temporal_search: '时空综合检索',
      knowledge_graph_search: '知识图谱检索',
      smart_map: '地图场景设计',
      smart_map_market: '地图场景集市',
      data_sensitivity: '数据密级',
      sensitive_data_config: '敏感数据配置',
      identification_rules: '识别规则管理',
      governance_tools: '治理工具',
      public_data_market: '公共数据集市',
      service_market: '服务集市',
  };

  return (
    <div className="flex h-screen w-full bg-white relative overflow-hidden font-sans">
      {/* Background with radial gradient */}
      <div 
        className="absolute inset-0 z-0" 
        style={{ 
          background: 'radial-gradient(circle at center, #DFE9FF 0%, #CFE1FB 40%, #9FC3FA 75%, #8FA1F7 100%)' 
        }} 
      />
      
      <div className="relative z-10 flex w-full h-full">
          <Sidebar activeMenuId={activeMenuId} onMenuSelect={handleMenuSelect} />
          <div className="flex-1 flex flex-col my-3 mr-3 ml-3 min-w-0 bg-white/70 backdrop-blur-xl rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.2)] border border-white/40 p-4 overflow-hidden transition-all duration-500 ease-out">
            <div
              className={
                (activeMenuId === 'data_list' ||
                  activeMenuId === 'public_data_market' ||
                  activeMenuId === 'my_favorites') &&
                  viewMode === 'list'
                  ? 'flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-transparent'
                  : 'relative flex h-full min-h-0 flex-1 flex-col overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-900/5'
              }
            >
                {activeMenuId === 'data_theme' ? (
                    <DataThemePanel />
                ) : activeMenuId === 'data_standard' ? (
                    <DataStandardPanel />
                ) : activeMenuId === 'standard_code_table' ? (
                    <StandardCodeTablePanel />
                ) : activeMenuId === 'business_management' ? (
                    <BusinessManagementPanel />
                ) : activeMenuId === 'my_favorites' ? (
                   <>
                      {viewMode === 'list' ? (
                         <div className="animate-fadeIn flex min-h-0 min-w-0 flex-1 overflow-hidden">
                             <DataTablePanel
                               dataView="my_favorites"
                               favoriteIds={dataMarketFavoriteIds}
                               onToggleFavorite={toggleDataMarketFavorite}
                               onBatchAddFavorites={mergeBatchDataMarketFavorites}
                               onViewDetail={(ctx) => {
                                 setDataListDetailContext(ctx);
                                 setDetailBackTarget('my_favorites');
                                 setViewMode('detail');
                               }}
                             />
                         </div>
                       ) : (
                         <DataDetailPanel
                           initialListingStatus={dataListDetailContext?.listingStatus}
                           initialDataName={dataListDetailContext?.name}
                           initialThemeNodeId={dataListDetailContext?.themeNodeId}
                           initialAdminDivision={dataListDetailContext?.adminDivision}
                           allowDownload={detailBackTarget !== 'data_list'}
                           allowDetailEdit={
                             detailBackTarget !== 'public_data_market' &&
                             detailBackTarget !== 'my_favorites'
                           }
                           onBack={() => {
                             setDataListDetailContext(null);
                             if (detailBackTarget === 'my_favorites') {
                               setActiveMenuId('my_favorites');
                             }
                             setViewMode('list');
                           }}
                         />
                       )}
                   </>
                ) : activeMenuId === 'data_list' || activeMenuId === 'public_data_market' ? (
                   <>
                      {viewMode === 'list' ? (
                         <div className="animate-fadeIn flex min-h-0 min-w-0 flex-1 flex-row gap-4 overflow-hidden">
                             <DataThemePanel
                               variant="sidebar"
                               sidebarTitle={
                                 activeMenuId === 'public_data_market' ? '公共数据集市' : '数据总库'
                               }
                             />
                             <DataTablePanel
                               dataView={
                                 activeMenuId === 'public_data_market'
                                   ? 'public_data_market'
                                   : 'data_list'
                               }
                               favoriteIds={dataMarketFavoriteIds}
                               onToggleFavorite={toggleDataMarketFavorite}
                               onBatchAddFavorites={mergeBatchDataMarketFavorites}
                               onViewDetail={(ctx) => {
                                 setDataListDetailContext(ctx);
                                 setDetailBackTarget(
                                   activeMenuId === 'public_data_market'
                                     ? 'public_data_market'
                                     : 'data_list',
                                 );
                                 setViewMode('detail');
                               }}
                             />
                         </div>
                       ) : (
                         <DataDetailPanel
                           initialListingStatus={dataListDetailContext?.listingStatus}
                           initialDataName={dataListDetailContext?.name}
                           initialThemeNodeId={dataListDetailContext?.themeNodeId}
                           initialAdminDivision={dataListDetailContext?.adminDivision}
                           allowDownload={detailBackTarget !== 'data_list'}
                           allowDetailEdit={
                             detailBackTarget !== 'public_data_market' &&
                             detailBackTarget !== 'my_favorites'
                           }
                           onBack={() => {
                             setDataListDetailContext(null);
                             if (detailBackTarget === 'spatio_temporal_search') {
                               setActiveMenuId('spatio_temporal_search');
                             } else if (detailBackTarget === 'public_data_market') {
                               setActiveMenuId('public_data_market');
                             }
                             setViewMode('list');
                           }}
                         />
                       )}
                   </>
                ) : activeMenuId === 'stats' ? (
                    <DataStatsPanel />
                ) : isSpatialIngestionMenu(activeMenuId) ? (
                    ingestionSubView === 'list' ? (
                        ingestionDataDetailOpen ? (
                            <DataDetailPanel
                              onBack={() => {
                                setIngestionDataDetailOpen(false);
                                setIngestionSceneDetailId(null);
                              }}
                              initialDataName={
                                ingestionSceneDetailId
                                  ? getGf1cSceneDetail(ingestionSceneDetailId)?.name
                                  : undefined
                              }
                              satelliteSceneDetail={
                                ingestionSceneDetailId
                                  ? getGf1cSceneDetail(ingestionSceneDetailId) ?? undefined
                                  : undefined
                              }
                              hideDataTable
                              allowDetailEdit={false}
                              allowDownload={false}
                            />
                        ) : (
                            <SpatialDataIngestionPanel
                                pageTitle={
                                  activeMenuId === 'spatial_ingestion_batch' ? '批量入库' : '单次入库'
                                }
                                hideScopeTabs
                                scopeTab={ingestionListScopeTab}
                                onScopeTabChange={setIngestionListScopeTab}
                                statusTab={ingestionListStatusTab}
                                onStatusTabChange={setIngestionListStatusTab}
                                listPage={ingestionListPage}
                                listPageSize={ingestionListPageSize}
                                onListPageChange={setIngestionListPage}
                                onListPageSizeChange={setIngestionListPageSize}
                                listSearchQuery={ingestionListSearchQuery}
                                onListSearchQueryChange={setIngestionListSearchQuery}
                                batchExpandedParentIds={ingestionBatchExpandedParentIds}
                                onToggleBatchParentExpand={toggleIngestionBatchParentExpand}
                                onCreateTask={(mode) => {
                                    setIngestionEditSubTask(null);
                                    setIngestionCreateMode(mode);
                                    setIngestionListScopeTab(mode);
                                    setIngestionSubView('create');
                                }}
                                onEditBatchSubTask={(task, parent) => {
                                    setIngestionEditSubTask({
                                        task,
                                        batchGroupName: parent.directoryName,
                                        parentId: parent.id,
                                    });
                                    setIngestionCreateMode('batch');
                                    setIngestionListScopeTab('batch');
                                    setIngestionSubView('create');
                                }}
                                onOpenIngestedDataDetail={(task) => {
                                  setIngestionSceneDetailId(
                                    isGf1cSceneTaskId(task.id) ? task.id : null,
                                  );
                                  setIngestionDataDetailOpen(true);
                                }}
                            />
                        )
                    ) : (
                        <div className="relative flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
                            <div
                                className={
                                    ingestionSubView === 'cloud_disk'
                                        ? 'pointer-events-none invisible absolute inset-0 flex min-h-0 min-w-0 flex-1 flex-col'
                                        : 'flex min-h-0 min-w-0 flex-1 flex-col'
                                }
                                aria-hidden={ingestionSubView === 'cloud_disk'}
                            >
                                <CreateIngestionTaskPanel
                                    createMode={ingestionCreateMode}
                                    editSubTask={ingestionEditSubTask}
                                    onBack={() => {
                                        setIngestionSubView('list');
                                        setIngestionEditSubTask(null);
                                    }}
                                    onResubmitSubTask={() => {
                                        setIngestionEditSubTask(null);
                                    }}
                                    onNavigate={handleMenuSelect}
                                    onOpenCloudDisk={() => setIngestionSubView('cloud_disk')}
                                    pendingCloudPick={ingestionCloudPick}
                                    onPendingCloudPickConsumed={() => setIngestionCloudPick(null)}
                                />
                            </div>
                            {ingestionSubView === 'cloud_disk' && (
                                <div className="absolute inset-0 z-20 flex min-h-0 min-w-0 flex-col bg-white">
                                    <CloudDiskSelectionPage
                                        onBack={() => setIngestionSubView('create')}
                                        onConfirm={(files) => {
                                            setIngestionCloudPick({ token: Date.now(), files });
                                        }}
                                    />
                                </div>
                            )}
                        </div>
                    )
                ) : activeMenuId === 'production_line' ? (
                    <ProductionLinePanel />
                ) : activeMenuId === 'smart_map' ? (
                    <DataSmartMapPanel marketTree={marketTree} />
                ) : activeMenuId === 'smart_map_market' ? (
                    <DataSmartMapMarketPanel marketTree={marketTree} setMarketTree={setMarketTree} />
                ) : activeMenuId === 'spatio_temporal_search' ? (
                    spatialSearchDetailOpen ? (
                        <DataDetailPanel onBack={() => setSpatialSearchDetailOpen(false)} />
                    ) : (
                        <SpatialSearchPanel
                            onOpenDataDetail={() => {
                                setDetailBackTarget('spatio_temporal_search');
                                setSpatialSearchDetailOpen(true);
                            }}
                        />
                    )
                ) : activeMenuId === 'knowledge_graph_search' ? (
                    <KnowledgeGraphSearchPanel />
                ) : activeMenuId === 'service_dev' ? (
                    <ServiceDevelopmentPanel 
                        apiData={services} 
                        setApiData={setServices} 
                        directories={directories}
                        setDirectories={setDirectories}
                    />
                ) : activeMenuId === 'service_market' ? (
                    <ServiceMarketPanel 
                        apiData={services}
                        directories={directories}
                        onApplySuccess={handleApplySuccess}
                    />
                ) : activeMenuId === 'personal_console' ? (
                    <PersonalConsolePanel />
                ) : activeMenuId === 'my_applications' ? (
                    <MyApplicationsPanel 
                        records={applications} 
                        apiData={services}
                    />
                ) : activeMenuId === 'audit_application' ? (
                    <AuditApplicationPanel 
                        records={applications} 
                        onAudit={handleAuditAction}
                    />
                ) : activeMenuId === 'data_sensitivity' ? (
                    <DataSensitivityPanel />
                ) : activeMenuId === 'sensitive_data_config' ? (
                    <SensitiveDataConfigPanel onNavigate={handleMenuSelect} />
                ) : activeMenuId === 'identification_rules' ? (
                    <IdentificationRulesPanel onNavigate={handleMenuSelect} />
                ) : activeMenuId === 'governance_tools' ? (
                    <GovernanceToolsPanel />
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                        <div className="p-6 bg-slate-50 rounded-3xl mb-4 border border-slate-100 shadow-inner">
                            <span className="text-5xl grayscale opacity-50">📂</span>
                        </div>
                        <h3 className="text-lg font-bold text-slate-700 mb-1">功能开发中</h3>
                        <p className="text-slate-400 text-sm font-medium">"{menuLabels[activeMenuId] || activeMenuId}" 模块正在全力打造中...</p>
                    </div>
                )}
            </div>
          </div>
      </div>
    </div>
  );
}

export default App;
