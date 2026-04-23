
import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { DataThemePanel } from './components/DataThemePanel';
import { DataTablePanel } from './components/DataTablePanel';
import { DataDetailPanel } from './components/DataDetailPanel';
import { DataSmartMapPanel } from './components/DataSmartMapPanel';
import { DataSmartMapMarketPanel } from './components/DataSmartMapMarketPanel';
import { ProductionLinePanel } from './components/ProductionLinePanel';
import { SpatialDataIngestionPanel } from './components/SpatialDataIngestionPanel';
import { CreateIngestionTaskPanel } from './components/CreateIngestionTaskPanel';
import { DataStatsPanel } from './components/DataStatsPanel';
import { ServiceDevelopmentPanel, DirectoryNode } from './components/ServiceDevelopmentPanel';
import { ServiceMarketPanel } from './components/ServiceMarketPanel';
import { PersonalConsolePanel } from './components/PersonalConsolePanel';
import { MyApplicationsPanel } from './components/MyApplicationsPanel';
import { AuditApplicationPanel } from './components/AuditApplicationPanel';
import { SpatialSearchPanel } from './components/SpatialSearchPanel';
import { DataSensitivityPanel } from './components/DataSensitivityPanel';
import { SensitiveDataConfigPanel } from './components/SensitiveDataConfigPanel';
import { IdentificationRulesPanel } from './components/IdentificationRulesPanel';
import { MOCK_API_DATA, APIRow } from './constants';
import { ApplicationRecord, MarketNode } from './types';
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
  
  const [ingestionSubView, setIngestionSubView] = useState<'list' | 'create'>('list');
  const [services, setServices] = useState<APIRow[]>(MOCK_API_DATA);
  const [directories, setDirectories] = useState<DirectoryNode[]>(INITIAL_DIRECTORIES);
  const [applications, setApplications] = useState<ApplicationRecord[]>(INITIAL_APPLICATIONS);
  const [marketTree, setMarketTree] = useState<MarketNode[]>(INITIAL_MARKET_TREE);

  const handleMenuSelect = (id: string) => {
    setActiveMenuId(id);
    if (id === 'spatial_ingestion') {
        setIngestionSubView('list');
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
      data_theme: '数据主题',
      my_applications: '我的申请',
      my_favorites: '我的收藏',
      personal_console: '个人中心',
      audit_application: '数据申请审核',
      audit_listing: '数据上架审核',
      datasource_mgmt: '数据源管理',
      spatio_temporal_search: '数据时空检索',
      smart_map: '地图场景设计',
      smart_map_market: '地图场景集市',
      data_sensitivity: '数据密级',
      sensitive_data_config: '敏感数据配置',
      identification_rules: '识别规则管理',
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
          <div className="flex-1 flex flex-col my-3 mr-3 ml-0 bg-white/70 backdrop-blur-xl rounded-2xl shadow-[0_25px_50px_-12px_rgba(0,0,0,0.2)] border border-white/40 p-4 overflow-hidden transition-all duration-500 ease-out">
            <div className="flex flex-col h-full bg-white rounded-xl overflow-hidden shadow-sm relative ring-1 ring-slate-900/5">
                {activeMenuId === 'data_theme' ? (
                    <DataThemePanel />
                ) : activeMenuId === 'data_list' ? (
                   <>
                       {viewMode === 'list' ? (
                         <div className="flex-1 overflow-hidden relative animate-fadeIn flex">
                             <div className="w-[280px] border-r border-slate-100 h-full overflow-hidden">
                                <DataThemePanel /> 
                             </div>
                             <DataTablePanel onViewDetail={() => setViewMode('detail')} />
                         </div>
                       ) : (
                         <DataDetailPanel onBack={() => setViewMode('list')} />
                       )}
                   </>
                ) : activeMenuId === 'stats' ? (
                    <DataStatsPanel />
                ) : activeMenuId === 'spatial_ingestion' ? (
                    ingestionSubView === 'list' ? (
                        <SpatialDataIngestionPanel onCreateTask={() => setIngestionSubView('create')} />
                    ) : (
                        <CreateIngestionTaskPanel 
                            onBack={() => setIngestionSubView('list')} 
                            onNavigate={handleMenuSelect}
                        />
                    )
                ) : activeMenuId === 'production_line' ? (
                    <ProductionLinePanel />
                ) : activeMenuId === 'smart_map' ? (
                    <DataSmartMapPanel marketTree={marketTree} />
                ) : activeMenuId === 'smart_map_market' ? (
                    <DataSmartMapMarketPanel marketTree={marketTree} setMarketTree={setMarketTree} />
                ) : activeMenuId === 'spatio_temporal_search' ? (
                    <SpatialSearchPanel />
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
