
import React from 'react';
import { 
  BarChart3, 
  Compass, 
  Layers, 
  Search, 
  Database, 
  HardDrive,
  Map as MapIcon,
  Factory,
  Share2,
  TableProperties,
  DatabaseZap,
  FileText,
  Table2,
  Box,
  Palette,
  LayoutGrid,
  Settings,
  ClipboardCheck,
  ShieldCheck,
  Shield,
  SearchCode,
  Component,
  Building2,
  Store,
  Network,
  Workflow,
  FileUp,
  FolderInput,
} from 'lucide-react';
import { MenuItem, TableRow, TreeNode, TabItem, DataSensitivity, DataThemeBindOption } from './types';

/** 通用地理数据示意图：灰度世界地图（数据卡片封面、详情默认封面等） */
export const WORLD_MAP_SCHEMATIC_COVER_URL =
  'https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/World_map_blank_without_borders.svg/1280px-World_map_blank_without_borders.svg.png';

// Sidebar Menu Data
export const MENU_ITEMS: MenuItem[] = [
  { id: 'header1', label: '基础数据底座', type: 'header' },
  { id: 'stats', label: '数据统计', icon: <BarChart3 size={20} /> },
  { 
    id: 'search', 
    label: '时空综合检索', 
    icon: <Search size={20} />,
    children: [
      { id: 'spatio_temporal_search', label: '时空综合检索', icon: <MapIcon size={18} /> },
      { id: 'knowledge_graph_search', label: '知识图谱检索', icon: <Network size={18} /> },
    ]
  },
  { id: 'data_list', label: '数据总库', icon: <TableProperties size={20} /> },
  { 
    id: 'resources', 
    label: '数据集市', 
    icon: <HardDrive size={20} />, 
    children: [
      { id: 'service_market', label: '服务集市', icon: <LayoutGrid size={18} /> },
      { id: 'public_data_market', label: '公共数据集市', icon: <Store size={18} /> },
    ] 
  },
  { id: 'cloud_disk', label: '数据云盘', icon: <HardDrive size={20} />, children: [] },
  
  { id: 'header2', label: '数据治理开发', type: 'header' },
  { 
    id: 'planning', 
    label: '数据规划', 
    icon: <Compass size={20} />, 
    children: [
      { id: 'data_theme', label: '数据主题', icon: <Database size={18} /> },
      { id: 'business_management', label: '业务管理', icon: <Building2 size={18} /> },
      { id: 'data_layer', label: '数据分层', icon: <Layers size={18} /> },
      { id: 'data_standard', label: '数据标准', icon: <FileText size={18} /> },
      { id: 'standard_code_table', label: '标准码表', icon: <Table2 size={18} /> },
      { id: 'data_model', label: '数据模型', icon: <Box size={18} /> },
    ] 
  },
  { 
    id: 'data_integration', 
    label: '数据集成', 
    icon: <DatabaseZap size={20} />,
    children: [
      { id: 'datasource_mgmt', label: '数据源管理', icon: <Database size={18} /> },
      { id: 'business_ingestion', label: '业务数据入库', icon: <TableProperties size={18} /> },
      {
        id: 'spatial_ingestion',
        label: '时空数据入库',
        icon: <Share2 size={18} />,
        children: [
          { id: 'spatial_ingestion_single', label: '单次入库', icon: <FileUp size={16} /> },
          { id: 'spatial_ingestion_batch', label: '批量入库', icon: <FolderInput size={16} /> },
        ],
      },
    ]
  },
  { id: 'metadata', label: '元数据管理', icon: <Database size={20} /> },
  { id: 'quality', label: '数据质量', icon: <BarChart3 size={20} />, children: [] },
  { id: 'development', label: '数据开发', icon: <Factory size={20} />, children: [] },
  { 
    id: 'services', 
    label: '服务开发', 
    icon: <Share2 size={20} />, 
    children: [
      { id: 'service_dev', label: '服务开发', icon: <Share2 size={18} /> },
      { id: 'style_mgmt', label: '样式管理', icon: <Palette size={18} /> },
      { id: 'service_stats', label: '服务调用统计', icon: <BarChart3 size={18} /> },
    ] 
  },
  {
    id: 'data_security',
    label: '数据安全',
    icon: <ShieldCheck size={20} />,
    children: [
      { id: 'data_sensitivity', label: '数据密级', icon: <Shield size={18} /> },
      { id: 'sensitive_data_config', label: '敏感数据配置', icon: <TableProperties size={18} /> },
      { id: 'identification_rules', label: '识别规则管理', icon: <SearchCode size={18} /> },
    ]
  },
  { id: 'governance_tools', label: '治理工具', icon: <Workflow size={20} /> },
  { 
    id: 'system_mgmt', 
    label: '系统管理', 
    icon: <Settings size={20} />, 
    children: [
      { id: 'audit_application', label: '数据申请审核', icon: <ClipboardCheck size={18} /> },
      { id: 'audit_listing', label: '数据上架审核', icon: <ShieldCheck size={18} /> },
    ] 
  },

  { id: 'header3', label: '数据应用与分析', type: 'header' },
  { 
    id: 'smart_map_parent', 
    label: '地图场景', 
    icon: <MapIcon size={20} />,
    children: [
      { id: 'smart_map', label: '地图场景设计', icon: <Component size={18} /> },
      { id: 'smart_map_market', label: '地图场景集市', icon: <Component size={18} /> },
    ]
  },
];

export interface APIRow {
  id: string;
  name: string;
  category: '时空数据服务' | '业务数据服务';
  dirId: string;
  type: string;
  version: string;
  status: 'online' | 'offline';
  createTime: string;
  tags?: string[];
  // 详情字段
  description?: string;
  path?: string;
  protocol?: string;
  method?: string;
  crs?: string;
  dataType?: '矢量' | '栅格' | '三维模型';
  dataFormat?: string;
  styleName?: string;
  geomField?: string;
  sql?: string;
  requestParams?: any[];
  responseParams?: any[];
  dataSource?: string;
}

export const MOCK_API_DATA: APIRow[] = [
  { 
    id: '1', 
    name: '湖北省2m卫星影像', 
    category: '时空数据服务', 
    dirId: 'ogc', 
    type: 'WMTS', 
    version: 'V1.0', 
    status: 'online', 
    createTime: '2024-05-10 15:30',
    tags: ['遥感影像', '基础地理'],
    description: '湖北省全境2米分辨率高精度卫星影像切片服务，支持标准WMTS协议调用。',
    crs: 'EPSG:4490',
    dataType: '栅格',
    dataFormat: 'geotiff',
    styleName: 'default_raster_style.sld',
    dataSource: 'geo_raster_center'
  },
  { 
    id: '3', 
    name: '黄石2025标准地图', 
    category: '时空数据服务', 
    dirId: 'ogc', 
    type: 'WMS', 
    version: 'V2.0', 
    status: 'online', 
    createTime: '2024-05-12 09:15',
    tags: ['行政区划', '标准地图'],
    description: '黄石市2025年度最新标准政区地图服务，包含县级以上界线。',
    crs: 'EPSG:4326',
    dataType: '矢量',
    dataFormat: '.shp',
    styleName: 'admin_boundary_style.sld',
    dataSource: 'hubei_vector_db'
  },
  { 
    id: '5', 
    name: '湖北省行政区-县', 
    category: '时空数据服务', 
    dirId: 'ogc', 
    type: 'WFS', 
    version: 'V1.0', 
    status: 'online', 
    createTime: '2024-05-14 14:50',
    tags: ['要素检索', '国土空间'],
    description: '提供湖北省县级行政区划矢量要素检索与获取服务。',
    crs: 'EPSG:4326',
    dataType: '矢量',
    dataFormat: 'geojson',
    styleName: 'district_poly_style.sld'
  },
  { 
    id: '7', 
    name: '全国16米一张图', 
    category: '时空数据服务', 
    dirId: 'cloud', 
    type: 'COG', 
    version: 'V1.0', 
    status: 'online', 
    createTime: '2024-05-16 08:30',
    tags: ['云原生', '大幅面影像'],
    description: '基于云原生COG格式发布的全国16米分辨率卫星影像。',
    crs: 'EPSG:3857',
    dataType: '栅格',
    dataFormat: 'geotiff'
  },
  { 
    id: '9', 
    name: '气象数据下载服务', 
    category: '业务数据服务', 
    dirId: 'rest', 
    type: '获取服务', 
    version: 'V1.0', 
    status: 'online', 
    createTime: '2024-05-18 13:25',
    tags: ['实时气象', '数据下载'],
    description: '提供全省气象站点的实时温湿度、降雨量数据下载。',
    path: '/api/weather/download',
    protocol: 'HTTPS',
    method: 'GET',
    dataSource: 'meteo_realtime_db',
    requestParams: [
        { name: 'stationCode', field: 'station_code', type: 'STRING', loc: 'QUERY', op: '=', required: true, desc: '站点编码' },
        { name: 'date', field: 'record_date', type: 'STRING', loc: 'QUERY', op: '=', required: true, desc: '查询日期' }
    ],
    responseParams: [
        { name: 'temp', field: 'temperature', type: 'FLOAT', desc: '气温' },
        { name: 'rain', field: 'rainfall', type: 'FLOAT', desc: '降水量' }
    ]
  },
  { 
    id: '11', 
    name: '用户消费行为分析', 
    category: '业务数据服务', 
    dirId: 'rest', 
    type: '分析服务', 
    version: 'V1.0', 
    status: 'online', 
    createTime: '2024-05-20 10:00',
    tags: ['大数据分析', '消费行为'],
    description: '基于用户历史订单进行聚合分析，输出月度消费趋势。',
    path: '/api/user/analysis/order',
    protocol: 'HTTP',
    method: 'POST',
    sql: 'SELECT user_id, SUM(amount) as total FROM orders WHERE city = ${city} GROUP BY user_id',
    requestParams: [
        { name: 'city', field: 'city', type: 'STRING', loc: 'BODY', op: '=', required: true, desc: '分析城市' }
    ],
    responseParams: [
        { name: 'userId', field: 'user_id', type: 'LONG', desc: '用户ID' },
        { name: 'totalAmount', field: 'total', type: 'DOUBLE', desc: '总金额' }
    ]
  },
  { 
    id: '13', 
    name: '全省人口分布统计', 
    category: '业务数据服务', 
    dirId: 'rest_stat', 
    type: '统计服务', 
    version: 'V1.1', 
    status: 'online', 
    createTime: '2024-06-01 09:00',
    tags: ['社会经济', '人口普查'],
    description: '提供湖北省各市县年度人口结构、分布密度及迁徙趋势统计数据。',
    path: '/api/census/population/stats',
    protocol: 'HTTPS',
    method: 'GET',
    requestParams: [
        { name: 'year', field: 'year', type: 'INT', loc: 'QUERY', op: '=', required: true, desc: '统计年份' }
    ],
    responseParams: [
        { name: 'region', field: 'region_name', type: 'STRING', desc: '行政区名称' },
        { name: 'total', field: 'total_pop', type: 'LONG', desc: '总人口数' }
    ]
  },
  { 
    id: '15', 
    name: '智慧交通违章监测', 
    category: '业务数据服务', 
    dirId: 'rest_query', 
    type: '查询服务', 
    version: 'V2.0', 
    status: 'online', 
    createTime: '2024-06-05 14:30',
    tags: ['智慧城市', '交通管控'],
    description: '实时对接交管系统，提供高频更新的道路交通违章记录及事故黑点查询接口。',
    path: '/api/traffic/violations/query',
    protocol: 'HTTPS',
    method: 'POST',
    requestParams: [
        { name: 'plateNo', field: 'plate_number', type: 'STRING', loc: 'BODY', op: '=', required: true, desc: '车牌号' }
    ],
    responseParams: [
        { name: 'vType', field: 'violation_type', type: 'STRING', desc: '违章类型' },
        { name: 'vTime', field: 'occur_time', type: 'STRING', desc: '发生时间' }
    ]
  },
  // 草稿箱模拟数据 (status: 'offline')
  { 
    id: 'draft-1', 
    name: '全市经济指标监控', 
    category: '业务数据服务', 
    dirId: 'rest_stat', 
    type: '统计服务', 
    version: 'V0.9-Alpha', 
    status: 'offline', 
    createTime: '2025-01-10 11:20',
    tags: ['经济指标', '内部测试'],
    description: '草稿：用于测试内部经济指标的实时聚合接口，尚未正式发布。'
  },
  { 
    id: 'draft-2', 
    name: '重点地质灾害隐患点分布', 
    category: '时空数据服务', 
    dirId: 'ogc', 
    type: 'WFS', 
    version: 'V1.0-Draft', 
    status: 'offline', 
    createTime: '2025-01-12 16:45',
    tags: ['地质灾害', '空间预警'],
    description: '草稿：全市重点地质灾害隐患点坐标要素服务，待数据核准后上线。'
  },
  { 
    id: 'draft-3', 
    name: '林业资源一张图', 
    category: '时空数据服务', 
    dirId: 'cloud', 
    type: 'COG', 
    version: 'V1.2-Beta', 
    status: 'offline', 
    createTime: '2025-01-14 09:30',
    tags: ['林业资源', '生态监测'],
    description: '草稿：基于最新遥感影像提取的林业覆盖一张图。'
  }
];

// 数据密级示例（L1–L4）
export const MOCK_DATA_SENSITIVITY: DataSensitivity[] = [
  {
    id: 'ds-l1',
    code: 'L1',
    name: '公开级',
    sensitivity: '不敏感数据',
    impact: '无危害',
    securityLevel: '无风险',
    processingMethod: '可对外发布与公开共享',
    createTime: '2024-01-01 10:00:00',
  },
  {
    id: 'ds-l2',
    code: 'L2',
    name: '内部级',
    sensitivity: '低敏感数据',
    impact: '一般危害',
    securityLevel: '一般风险',
    processingMethod: '限组织内部使用，外发需脱敏与审批',
    createTime: '2024-01-01 10:00:00',
  },
  {
    id: 'ds-l3',
    code: 'L3',
    name: '敏感级',
    sensitivity: '较敏感数据',
    impact: '严重危害',
    securityLevel: '严重风险',
    processingMethod: '强身份鉴权、全链路审计、默认脱敏展示',
    createTime: '2024-01-01 10:00:00',
  },
  {
    id: 'ds-l4',
    code: 'L4',
    name: '涉密级',
    sensitivity: '涉密数据',
    impact: '特别严重危害',
    securityLevel: '特别严重风险',
    processingMethod: '专网隔离、禁止出境、按密级管理要求存储与访问',
    createTime: '2024-01-01 10:00:00',
  },
];

// Header Tabs
export const HEADER_TABS: TabItem[] = [
  { id: 'home', label: '首页', closable: true },
  { id: 'task', label: '任务中心', closable: true },
  { id: 'prod_list', label: '产线列表', closable: true, active: true },
];

// Left Tree Data
export const TREE_DATA: TreeNode[] = [
  {
    id: 'common',
    label: '通用数据',
    type: 'category',
    expanded: true,
    children: [
      { id: 'geo', label: '基础地理', type: 'folder', children: [] },
      { 
        id: 'rs', 
        label: '遥感监测', 
        type: 'folder', 
        expanded: true,
        children: [
          { id: 'sentry', label: '哨兵数据集', type: 'dataset' },
          { id: 'image', label: '影像地图', type: 'dataset' },
          { id: 'notes', label: '注记地图', type: 'dataset' },
        ] 
      },
      { id: 'industry', label: '行业专题', type: 'category', children: [] },
    ]
  }
];

/** 数据列表「入库主题」可选项（与 DataThemePanel 树结构对应） */
export const DATA_THEME_BIND_OPTIONS: DataThemeBindOption[] = [
  { id: 'geo-admin', path: '基础地理 / 行政区划' },
  { id: 'geo-poi', path: '基础地理 / 地名地址 / POI' },
  { id: 'geo-aoi', path: '基础地理 / 地名地址 / AOI' },
  { id: 'geo-map-notes', path: '基础地理 / 地图服务 / 注记地图' },
  { id: 'geo-map-image', path: '基础地理 / 地图服务 / 影像地图' },
  { id: 'geo-map-vector', path: '基础地理 / 地图服务 / 电子地图' },
  { id: 'geo-map-terrain', path: '基础地理 / 地图服务 / 地形' },
  { id: 'geo-map-placename', path: '基础地理 / 地图服务 / 地名' },
  { id: 'geo-3d-white', path: '基础地理 / 实景三维 / 白模' },
  { id: 'geo-3d-oblique', path: '基础地理 / 实景三维 / 倾斜摄影' },
  { id: 'geo-3d-bim', path: '基础地理 / 实景三维 / BIM' },
  { id: 'geo-3d-cim', path: '基础地理 / 实景三维 / CIM' },
  { id: 'geo-survey-other', path: '基础地理 / 其他测绘数据' },
  { id: 'rs-sat-s3', path: '遥感遥测 / 卫星遥感 / 哨兵三号' },
  { id: 'rs-sat-s1', path: '遥感遥测 / 卫星遥感 / 哨兵一号' },
  { id: 'rs-sat-s2', path: '遥感遥测 / 卫星遥感 / 哨兵二号' },
];

const DEFAULT_THEME_IDS = DATA_THEME_BIND_OPTIONS.map((o) => o.id);

// Table Data（数据总库列表）
export const MOCK_TABLE_DATA: TableRow[] = [
  {
    id: 'row-0',
    name: '湖北省10米卫星遥感影像20251001',
    dataType: 'tiff',
    ingestTime: '2026-05-08 17:35:11',
    dataVolume: '8.26 GB',
    publishStatus: '已发布',
    listingStatus: 'not_listed',
    isChecked: false,
    themeNodeId: DEFAULT_THEME_IDS[0],
    adminDivision: '湖北省',
    description:
      '湖北省全域10米分辨率多光谱卫星影像成果，适用于国土监测、要素提取与专题制图，坐标系与省级基础测绘一致。',
    tags: ['遥感影像', '卫星', '10米', '全省'],
  },
  {
    id: 'row-1',
    name: '大冶市0.8米卫星遥感影像20250901',
    dataType: 'tiff',
    ingestTime: '2026-05-07 14:22:03',
    dataVolume: '10.77 GB',
    publishStatus: '已发布',
    listingStatus: 'not_listed',
    isChecked: true,
    themeNodeId: DEFAULT_THEME_IDS[1],
    adminDivision: '黄石市 · 大冶市',
    description:
      '大冶市域亚米级真彩色影像，可用于城市规划精细建模、三维仿真底图及重大项目选址论证。',
    tags: ['亚米级', '真彩色', '县级'],
  },
  {
    id: 'row-2',
    name: '湖北省30米数字高程模型2015',
    dataType: 'tiff',
    ingestTime: '2026-05-06 09:10:00',
    dataVolume: '3.42 GB',
    publishStatus: '已发布',
    listingStatus: 'not_listed',
    isChecked: false,
    themeNodeId: DEFAULT_THEME_IDS[2],
    adminDivision: '湖北省',
    description:
      '全省统一基准下的30米分辨率DEM，适用于水文分析、坡度坡向计算及大范围地形可视化。',
    tags: ['DEM', '地形', '栅格'],
  },
  {
    id: 'row-3',
    name: '江汉平原农作物长势遥感监测202507',
    dataType: 'tiff',
    ingestTime: '2026-05-05 11:45:30',
    dataVolume: '15.20 GB',
    publishStatus: '已发布',
    listingStatus: 'not_listed',
    isChecked: false,
    themeNodeId: DEFAULT_THEME_IDS[3],
    adminDivision: '江汉平原相关市县',
    description:
      '基于多时相植被指数反演的作物长势监测成果，支撑农业估产、干旱预警与种植结构调研。',
    tags: ['农业', 'NDVI', '平原'],
  },
  {
    id: 'row-4',
    name: '武汉市主城区夜光遥感影像202506',
    dataType: 'tiff',
    ingestTime: '2026-05-04 16:01:22',
    dataVolume: '6.08 GB',
    publishStatus: '已发布',
    listingStatus: 'not_listed',
    isChecked: false,
    themeNodeId: DEFAULT_THEME_IDS[4],
    adminDivision: '武汉市',
    description:
      '夜间灯光强度与建成区扩张监测数据，可用于能耗热点识别、城镇化进程评估与城市体检指标。',
    tags: ['夜光', '城市', '监测'],
  },
  {
    id: 'row-5',
    name: '长江流域水体提取成果栅格202508',
    dataType: 'tiff',
    ingestTime: '2026-05-03 08:55:44',
    dataVolume: '22.31 GB',
    publishStatus: '已发布',
    listingStatus: 'not_listed',
    isChecked: true,
    themeNodeId: DEFAULT_THEME_IDS[5],
    adminDivision: '长江流域（湖北省）',
    description:
      '水体范围与岸线提取成果，覆盖长江湖北段干支流及附属湖泊，适用于防洪预案编制与生态红线校核。',
    tags: ['水体', '长江', '生态'],
  },
  {
    id: 'row-6',
    name: '鄂西山区森林资源监测影像202509',
    dataType: 'tiff',
    ingestTime: '2026-05-02 13:20:18',
    dataVolume: '12.05 GB',
    publishStatus: '已发布',
    listingStatus: 'listed',
    isChecked: false,
    themeNodeId: DEFAULT_THEME_IDS[6],
    adminDivision: '鄂西山区',
    description:
      '鄂西山地林区多时相影像与专题分类成果，支撑林地变更调查、碳汇核算与地质灾害隐患识别。',
    tags: ['林业', '山地', '监测'],
  },
];
