
import React from 'react';
import { 
  BarChart3, 
  Compass, 
  Layers, 
  Search, 
  List, 
  Database, 
  HardDrive,
  Map as MapIcon,
  Factory,
  Share2,
  TableProperties,
  DatabaseZap,
  FileText,
  Box,
  Palette,
  LayoutGrid,
  Settings,
  ClipboardCheck,
  ShieldCheck,
  Component
} from 'lucide-react';
import { MenuItem, TableRow, TreeNode, TabItem } from './types';

// Sidebar Menu Data
export const MENU_ITEMS: MenuItem[] = [
  { id: 'stats', label: '数据统计', icon: <BarChart3 size={20} /> },
  { 
    id: 'planning', 
    label: '数据规划', 
    icon: <Compass size={20} />, 
    children: [
      { id: 'data_theme', label: '数据主题', icon: <Database size={18} /> },
      { id: 'data_layer', label: '数据分层', icon: <Layers size={18} /> },
      { id: 'data_standard', label: '数据标准', icon: <FileText size={18} /> },
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
      { id: 'spatial_ingestion', label: '时空数据入库', icon: <Share2 size={18} /> },
    ]
  },
  { 
    id: 'search', 
    label: '数据检索', 
    icon: <Search size={20} />,
    children: [
      { id: 'spatio_temporal_search', label: '数据时空检索', icon: <MapIcon size={18} /> },
      { id: 'comprehensive_search', label: '数据综合检索', icon: <Search size={18} /> },
      { id: 'intelligent_search', label: '数据智能检索', icon: <DatabaseZap size={18} /> },
    ]
  },
  { 
    id: 'list', 
    label: '数据目录', 
    icon: <List size={20} />, 
    children: [
      { id: 'data_list', label: '数据列表', icon: <TableProperties size={18} /> },
      { id: 'metadata', label: '元数据管理', icon: <Database size={18} /> },
      { id: 'style_mgmt', label: '样式管理', icon: <Palette size={18} /> },
    ] 
  },
  { 
    id: 'smart_map_parent', 
    label: '地图场景', 
    icon: <MapIcon size={20} />,
    children: [
      { id: 'smart_map', label: '地图场景设计', icon: <Component size={18} /> },
      { id: 'smart_map_market', label: '地图场景集市', icon: <Component size={18} /> },
    ]
  },
  { id: 'resources', label: '数据资源', icon: <HardDrive size={20} />, children: [] },
  { id: 'quality', label: '数据质量', icon: <BarChart3 size={20} />, children: [] },
  { id: 'development', label: '数据开发', icon: <Factory size={20} />, children: [] },
  { 
    id: 'services', 
    label: '服务开发', 
    icon: <Share2 size={20} />, 
    children: [
      { id: 'service_dev', label: '服务开发', icon: <Share2 size={18} /> },
      { id: 'service_market', label: '服务集集市', icon: <LayoutGrid size={18} /> },
      { id: 'service_stats', label: '服务调用统计', icon: <BarChart3 size={18} /> },
    ] 
  },
  { id: 'cloud_disk', label: '数据云盘', icon: <HardDrive size={20} />, children: [] },
  { 
    id: 'system_mgmt', 
    label: '系统管理', 
    icon: <Settings size={20} />, 
    children: [
      { id: 'audit_application', label: '数据申请审核', icon: <ClipboardCheck size={18} /> },
      { id: 'audit_listing', label: '数据上架审核', icon: <ShieldCheck size={18} /> },
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

// Table Data
export const MOCK_TABLE_DATA: TableRow[] = Array(6).fill(null).map((_, i) => ({
  id: `row-${i}`,
  name: 'GF2-PMS1-E114KJM9013D',
  collectionTime: '2011-11-10 15:00:00',
  storageTime: '2011-11-10 15:00:00',
  isChecked: i === 1 || i === 5,
}));
