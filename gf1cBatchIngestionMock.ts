/**
 * GF1C 卫星批量入库演示数据（三景）及云盘高分系列同步条目
 */

import type { CloudFile } from './components/CloudDiskSelectionPage';

export const GF1C_BATCH_PARENT_ID = 'bp-gf1c';

export const GF1C_SCENE_IDS = ['gf1c-s1', 'gf1c-s2', 'gf1c-s3'] as const;

export type Gf1cSceneId = (typeof GF1C_SCENE_IDS)[number];

export interface Gf1cSceneFile {
  id: Gf1cSceneId;
  /** 景产品名（不含 .tar.gz） */
  productName: string;
  archiveName: string;
  sizeGb: string;
  cloudFileId: string;
  lon: string;
  lat: string;
  acqDate: string;
  l1aId: string;
}

export const GF1C_SCENE_FILES: Gf1cSceneFile[] = [
  {
    id: 'gf1c-s1',
    productName: 'GF1C_PMS_E110.8_N31.9_20250924_L1A1257670979',
    archiveName: 'GF1C_PMS_E110.8_N31.9_20250924_L1A1257670979.tar.gz',
    sizeGb: '2.08',
    cloudFileId: 'gf1c-tgz-1',
    lon: '110.8',
    lat: '31.9',
    acqDate: '20250924',
    l1aId: 'L1A1257670979',
  },
  {
    id: 'gf1c-s2',
    productName: 'GF1C_PMS_E111.0_N32.4_20250924_L1A1257670980',
    archiveName: 'GF1C_PMS_E111.0_N32.4_20250924_L1A1257670980.tar.gz',
    sizeGb: '2.11',
    cloudFileId: 'gf1c-tgz-2',
    lon: '111.0',
    lat: '32.4',
    acqDate: '20250924',
    l1aId: 'L1A1257670980',
  },
  {
    id: 'gf1c-s3',
    productName: 'GF1C_PMS_E111.1_N33.0_20250924_L1A1257670976',
    archiveName: 'GF1C_PMS_E111.1_N33.0_20250924_L1A1257670976.tar.gz',
    sizeGb: '2.05',
    cloudFileId: 'gf1c-tgz-3',
    lon: '111.1',
    lat: '33.0',
    acqDate: '20250924',
    l1aId: 'L1A1257670976',
  },
];

export const GF1C_BATCH_DIRECTORY_NAME = 'GF1C卫星批量入库';

/** 云盘 · 原始卫星数据 · 高分系列 根目录文件（前三条为 GF1C 演示景） */
const GF1C_CLOUD_DATES = ['2025-09-26 00:46:00', '2025-09-26 00:50:00', '2025-09-26 00:53:00'];

export const GF1C_GAOFEN_CLOUD_FILES: CloudFile[] = GF1C_SCENE_FILES.map((s, i) => ({
  id: s.cloudFileId,
  name: s.archiveName,
  size: `${s.sizeGb} GB`,
  type: 'GF1C L1A 标准景压缩包 / tar.gz',
  date: GF1C_CLOUD_DATES[i],
  iconType: 'zip' as const,
}));

/** 数据预览 · 图层管理：GF1/GF2 景产品典型三图层（MUX / PAN / Fusion） */
export interface SatellitePreviewLayer {
  id: number;
  name: string;
  band: 'MUX' | 'PAN' | 'Fusion';
  endpoints: { protocol: string; url: string }[];
}

export function buildSatellitePreviewLayers(productName: string): SatellitePreviewLayer[] {
  const slug = productName.replace(/[^a-zA-Z0-9]+/g, '_').toLowerCase();
  const bandUrl = (band: string, protocol: string) =>
    `https://api.spatial-data.com/v1/satellite/${slug}/${band.toLowerCase()}?service=${protocol}`;

  return [
    {
      id: 1,
      name: `${productName}-MUX`,
      band: 'MUX',
      endpoints: [
        { protocol: 'WMS', url: bandUrl('MUX', 'WMS') },
        { protocol: 'WMTS', url: bandUrl('MUX', 'WMTS') },
      ],
    },
    {
      id: 2,
      name: `${productName}-PAN`,
      band: 'PAN',
      endpoints: [
        { protocol: 'WMS', url: bandUrl('PAN', 'WMS') },
        { protocol: 'WMTS', url: bandUrl('PAN', 'WMTS') },
      ],
    },
    {
      id: 3,
      name: `${productName}-Fusion`,
      band: 'Fusion',
      endpoints: [
        { protocol: 'WMS', url: bandUrl('Fusion', 'WMS') },
        { protocol: 'WMTS', url: bandUrl('Fusion', 'WMTS') },
        { protocol: 'COG', url: `https://api.spatial-data.com/v1/cog/${slug}/fusion.tif` },
      ],
    },
  ];
}

export interface SatelliteSceneDetailPayload {
  sceneId: Gf1cSceneId;
  name: string;
  description: string;
  tags: string[];
  level: string;
  source: string;
  adminDivision: string;
  themeNodeId: string;
  collectTime: string;
  ingestTime: string;
  updateTime: string;
  metadataRows: { key: string; en: string; cn: string; value: string }[];
  /** 预览地图图层：多光谱 / 全色 / 融合 */
  previewLayers: SatellitePreviewLayer[];
  centerLon: string;
  centerLat: string;
}

function formatAcqDisplay(yyyymmdd: string) {
  return `${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`;
}

export function getGf1cSceneDetail(sceneId: string): SatelliteSceneDetailPayload | null {
  const scene = GF1C_SCENE_FILES.find((s) => s.id === sceneId);
  if (!scene) return null;
  const acq = formatAcqDisplay(scene.acqDate);
  return {
    sceneId: scene.id,
    name: scene.productName,
    description: `高分一号 C 星（GF1C）PMS 传感器 L1A 标准景。成像中心约 E${scene.lon}° N${scene.lat}°，获取日期 ${acq}，产品号 ${scene.l1aId}。入库包为 ${scene.archiveName}，含全色与多光谱栅格及元数据 XML，无矢量属性表。`,
    tags: ['GF1C', '高分系列', 'PMS', 'L1A', '卫星影像', '栅格'],
    level: '内部',
    source: '省高分卫星数据中心',
    adminDivision: '湖北省',
    themeNodeId: 'rs-sat-s2',
    collectTime: `${acq} 08:12:00`,
    ingestTime: '2025-09-26 00:46:00',
    updateTime: '2025-09-26 01:05:00',
    metadataRows: [
      { key: 'dataID', en: 'dataID', cn: '数据名称', value: scene.productName },
      { key: 'catagories', en: 'catagories', cn: '数据分类', value: '遥感遥测 / 卫星遥感 / 高分系列' },
      { key: 'dataSeclevel', en: 'dataSeclevel', cn: '数据安全等级', value: '内部' },
      { key: 'dataVer', en: 'dataVer', cn: '数据版本', value: 'L1A' },
      { key: 'dataType', en: 'dataType', cn: '数据类型', value: '栅格影像' },
      { key: 'serviceType', en: 'serviceType', cn: '服务类型', value: '影像服务' },
      { key: 'publishTime', en: 'publishTime', cn: '发布时间', value: '2025-09-26' },
      { key: 'uuid', en: 'uuid', cn: '唯一标识', value: scene.l1aId },
      {
        key: 'abstract',
        en: 'abstract',
        cn: '摘要',
        value: `GF1C PMS L1A 景产品，中心坐标 E${scene.lon} N${scene.lat}，获取时间 ${acq}。`,
      },
      { key: 'contact', en: 'contact', cn: '联系人', value: '高分卫星数据管理员' },
      { key: 'satellite', en: 'satellite', cn: '卫星代号', value: 'GF1C' },
      { key: 'sensor', en: 'sensor', cn: '传感器', value: 'PMS' },
      { key: 'centerLon', en: 'centerLon', cn: '中心经度', value: scene.lon },
      { key: 'centerLat', en: 'centerLat', cn: '中心纬度', value: scene.lat },
      { key: 'productId', en: 'productId', cn: '产品编号', value: scene.l1aId },
      { key: 'archive', en: 'archive', cn: '原始包', value: scene.archiveName },
    ],
    previewLayers: buildSatellitePreviewLayers(scene.productName),
    centerLon: scene.lon,
    centerLat: scene.lat,
  };
}

export function getGf1cScenePreviewLayers(sceneId: string): SatellitePreviewLayer[] | null {
  const scene = GF1C_SCENE_FILES.find((s) => s.id === sceneId);
  if (!scene) return null;
  return buildSatellitePreviewLayers(scene.productName);
}

export function isGf1cSceneTaskId(taskId: string): taskId is Gf1cSceneId {
  return GF1C_SCENE_IDS.includes(taskId as Gf1cSceneId);
}
