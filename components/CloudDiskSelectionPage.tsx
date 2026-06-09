import React, { useMemo, useState } from 'react';
import { GF1C_GAOFEN_CLOUD_FILES } from '../gf1cBatchIngestionMock';
import {
    ArrowLeft,
    ChevronRight,
    Folder,
    Link,
    Share2,
    Upload,
    LayoutGrid,
    FileArchive,
    Image,
    Shapes,
    Box,
    Plane,
    Mountain,
    Layers,
    CircleDot,
    FileText,
    Table2,
    BookOpen,
} from 'lucide-react';
import { RequirementsSpecDrawer, type FeaturePoint } from './RequirementsSpecDrawer';

/** 云盘条目（文件或占位目录），供入库任务选择 */
export interface CloudFile {
    id: string;
    name: string;
    size: string;
    type: string;
    date: string;
    iconType:
        | 'zip'
        | 'folder'
        | 'link'
        | 'raster'
        | 'vector'
        | 'model3d'
        | 'drone'
        | 'terrain'
        | 'tile_raster'
        | 'tile_vector'
        | 'pointcloud'
        | 'business'
        | 'unknown';
    selected?: boolean;
}

/** 原始卫星数据：右侧浏览层级（高分 / 哨兵 → 解压景目录内文件） */
type RawSatelliteNav =
    | { step: 'series' }
    | { step: 'gaofen' }
    | { step: 'sentinel' }
    | { step: 'gf2_scene' };

const ROOT_FOLDERS: { id: string; label: string }[] = [
    { id: 'raw_satellite', label: '原始卫星数据' },
    { id: 'thematic_rs', label: '专题遥感数据' },
    { id: 'vector', label: '矢量数据' },
    { id: 'model3d', label: '三维模型数据' },
    { id: 'uav', label: '无人机数据' },
    { id: 'terrain', label: '地形数据' },
    { id: 'raster_tiles', label: '栅格瓦片数据' },
    { id: 'vector_tiles', label: '矢量瓦片数据' },
    { id: 'business_tables', label: '业务表数据' },
];

/** 原始卫星数据 → 系列选择 */
const RAW_SATELLITE_SERIES_ENTRIES: CloudFile[] = [
    { id: 'raw-nav-gaofen', name: '高分系列', size: '-', type: '子目录', date: '-', iconType: 'folder' },
    { id: 'raw-nav-sentinel', name: '哨兵系列', size: '-', type: '子目录', date: '-', iconType: 'folder' },
];

/** 高分系列：仅 L1A 压缩包 + 解压后的景文件夹（进入文件夹后见内部文件） */
const GAOFEN_SERIES_ROOT_FILES: CloudFile[] = [
    ...GF1C_GAOFEN_CLOUD_FILES,
    { id: 'gf2-tgz-1', name: 'GF2_PMS1_E111.4_N32.3_20250526_L1A14660056001.tar.gz', size: '2.05 GB', type: 'GF2 L1A 标准景压缩包 / tar.gz', date: '2025-05-27 09:20:00', iconType: 'zip' },
    { id: 'gf2-tgz-2', name: 'GF2_PMS1_E111.4_N32.4_20250526_L1A14660055001.tar.gz', size: '2.12 GB', type: 'GF2 L1A 标准景压缩包 / tar.gz', date: '2025-05-27 09:22:15', iconType: 'zip' },
    { id: 'gf2-tgz-3', name: 'GF2_PMS1_E111.5_N32.6_20250526_L1A14660054001.tar.gz', size: '1.98 GB', type: 'GF2 L1A 标准景压缩包 / tar.gz', date: '2025-05-27 09:25:40', iconType: 'zip' },
    { id: 'gf2-tgz-4', name: 'GF2_PMS1_E111.5_N32.8_20250526_L1A14660053001.tar.gz', size: '2.18 GB', type: 'GF2 L1A 标准景压缩包 / tar.gz', date: '2025-05-27 09:28:02', iconType: 'zip' },
    { id: 'gf2-tgz-5', name: 'GF2_PMS2_E109.4_N32.4_20250427_L1A14598810001.tar.gz', size: '1.86 GB', type: 'GF2 L1A 标准景压缩包 / tar.gz（PMS2）', date: '2025-04-28 11:05:33', iconType: 'zip' },
    { id: 'gf2-tgz-6', name: 'GF2_PMS2_E109.8_N32.9_20250422_L1A14588636001.tar.gz', size: '2.01 GB', type: 'GF2 L1A 标准景压缩包 / tar.gz（PMS2）', date: '2025-04-23 14:18:00', iconType: 'zip' },
    { id: 'gf2-tgz-7', name: 'GF2_PMS2_E109.8_N33.1_20250422_L1A14588635001.tar.gz', size: '1.94 GB', type: 'GF2 L1A 标准景压缩包 / tar.gz（PMS2）', date: '2025-04-23 14:20:11', iconType: 'zip' },
    {
        id: 'gf2-scene-dir',
        name: 'GF2_PMS1_E109.7_N31.5_20250615_L1A14703019001',
        size: '-',
        type: '解压后景数据文件夹（点击进入）',
        date: '2025-06-17 10:00:00',
        iconType: 'folder',
    },
];

/** 解压后景目录内文件（仅在进入 GF2_PMS1_… 文件夹后展示） */
const GF2_SCENE_INNER_FILES: CloudFile[] = [
    { id: 'gf2-meta-xml', name: 'GF2_PMS1_E109.7_N31.5_20250615_L1A14703019001.xml', size: '12 KB', type: 'GF2 产品元数据 / XML', date: '2025-06-17 10:01:22', iconType: 'unknown' },
    { id: 'gf2-meta-chk', name: 'GF2_PMS1_E109.7_N31.5_20250615_L1A14703019001_Check.xml', size: '8 KB', type: '辐射定标等检验信息 / XML', date: '2025-06-17 10:01:22', iconType: 'unknown' },
    { id: 'gf2-preview-jpg', name: 'GF2_PMS1_E109.7_N31.5_20250615_L1A14703019001.jpg', size: '138 KB', type: '整景快视图 / JPG', date: '2025-06-17 10:01:25', iconType: 'raster' },
    { id: 'gf2-fp-shp', name: 'GF2_PMS1_E109.7_N31.5_20250615_L1A14703019001.shp', size: '4 KB', type: '成像范围足迹 / Shapefile', date: '2025-06-17 10:01:20', iconType: 'vector' },
    { id: 'gf2-fp-shx', name: 'GF2_PMS1_E109.7_N31.5_20250615_L1A14703019001.shx', size: '2 KB', type: '足迹索引 / SHX', date: '2025-06-17 10:01:20', iconType: 'vector' },
    { id: 'gf2-fp-dbf', name: 'GF2_PMS1_E109.7_N31.5_20250615_L1A14703019001.dbf', size: '1 KB', type: '足迹属性表 / DBF', date: '2025-06-17 10:01:20', iconType: 'vector' },
    { id: 'gf2-cloud-shp', name: 'GF2_PMS1_E109.7_N31.5_20250615_L1A14703019001_Cloud.shp', size: '1 KB', type: '云掩膜范围 / SHP', date: '2025-06-17 10:01:28', iconType: 'vector' },
    { id: 'gf2-cloud-shx', name: 'GF2_PMS1_E109.7_N31.5_20250615_L1A14703019001_Cloud.shx', size: '1 KB', type: '云掩膜索引 / SHX', date: '2025-06-17 10:01:28', iconType: 'vector' },
    { id: 'gf2-cloud-dbf', name: 'GF2_PMS1_E109.7_N31.5_20250615_L1A14703019001_Cloud.dbf', size: '1 KB', type: '云掩膜属性 / DBF', date: '2025-06-17 10:01:28', iconType: 'vector' },
    { id: 'gf2-mss1-tif', name: 'GF2_PMS1_E109.7_N31.5_20250615_L1A14703019001-MSS1.tiff', size: '386 MB', type: '多光谱影像 / GeoTIFF（MSS1）', date: '2025-06-17 10:02:10', iconType: 'raster' },
    { id: 'gf2-mss1-xml', name: 'GF2_PMS1_E109.7_N31.5_20250615_L1A14703019001-MSS1.xml', size: '10 KB', type: 'MSS1 元数据 / XML', date: '2025-06-17 10:02:08', iconType: 'unknown' },
    { id: 'gf2-mss1-chk', name: 'GF2_PMS1_E109.7_N31.5_20250615_L1A14703019001-MSS1_Check.xml', size: '9 KB', type: 'MSS1 检验 / XML', date: '2025-06-17 10:02:08', iconType: 'unknown' },
    { id: 'gf2-mss1-rpb', name: 'GF2_PMS1_E109.7_N31.5_20250615_L1A14703019001-MSS1.rpb', size: '3 KB', type: 'RPC 有理多项式系数', date: '2025-06-17 10:02:09', iconType: 'unknown' },
    { id: 'gf2-mss1-jpg', name: 'GF2_PMS1_E109.7_N31.5_20250615_L1A14703019001-MSS1.jpg', size: '603 KB', type: 'MSS1 预览图 / JPG', date: '2025-06-17 10:02:06', iconType: 'raster' },
    { id: 'gf2-mss1-thumb', name: 'GF2_PMS1_E109.7_N31.5_20250615_L1A14703019001-MSS1_thumb.jpg', size: '13 KB', type: 'MSS1 缩略图', date: '2025-06-17 10:02:05', iconType: 'raster' },
    { id: 'gf2-mss1-zywx', name: 'GF2_PMS1_E109.7_N31.5_20250615_L1A14703019001-MSS1_zywx.xml', size: '4 KB', type: '正射相关元数据 / XML', date: '2025-06-17 10:02:07', iconType: 'unknown' },
    { id: 'gf2-pan1-tif', name: 'GF2_PMS1_E109.7_N31.5_20250615_L1A14703019001-PAN1.tiff', size: '1.52 GB', type: '全色影像 / GeoTIFF（PAN1）', date: '2025-06-17 10:05:44', iconType: 'raster' },
    { id: 'gf2-pan1-xml', name: 'GF2_PMS1_E109.7_N31.5_20250615_L1A14703019001-PAN1.xml', size: '4 KB', type: 'PAN1 元数据 / XML', date: '2025-06-17 10:05:30', iconType: 'unknown' },
    { id: 'gf2-pan1-chk', name: 'GF2_PMS1_E109.7_N31.5_20250615_L1A14703019001-PAN1_Check.xml', size: '5 KB', type: 'PAN1 检验 / XML', date: '2025-06-17 10:05:30', iconType: 'unknown' },
    { id: 'gf2-pan1-zywx', name: 'GF2_PMS1_E109.7_N31.5_20250615_L1A14703019001-PAN1_zywx.xml', size: '4 KB', type: '正射相关元数据 / XML', date: '2025-06-17 10:05:31', iconType: 'unknown' },
    { id: 'gf2-pan1-thumb', name: 'GF2_PMS1_E109.7_N31.5_20250615_L1A14703019001-PAN1_thumb.jpg', size: '20 KB', type: 'PAN1 缩略图', date: '2025-06-17 10:05:28', iconType: 'raster' },
    { id: 'gf2-pan1-jpg', name: 'GF2_PMS1_E109.7_N31.5_20250615_L1A14703019001-PAN1.jpg', size: '885 KB', type: 'PAN1 预览图 / JPG', date: '2025-06-17 10:05:29', iconType: 'raster' },
    { id: 'gf2-pan1-jpw', name: 'GF2_PMS1_E109.7_N31.5_20250615_L1A14703019001-PAN1.jpw', size: '1 KB', type: '世界文件 / JPW', date: '2025-06-17 10:05:32', iconType: 'unknown' },
    { id: 'gf2-pan1-rpb', name: 'GF2_PMS1_E109.7_N31.5_20250615_L1A14703019001-PAN1.rpb', size: '3 KB', type: 'PAN1 RPC 系数', date: '2025-06-17 10:05:33', iconType: 'unknown' },
    { id: 'gf2-order', name: 'order.xml', size: '6 KB', type: '订单与分发说明 / XML', date: '2025-06-17 10:00:55', iconType: 'unknown' },
    { id: 'gf2-lasac', name: 'lasac', size: '0 KB', type: '分发标记文件（无扩展名）', date: '2025-06-17 10:00:50', iconType: 'unknown' },
];

/** 哨兵系列：S1 / S2 / S3 等典型产品 mock */
const SENTINEL_SERIES_FILES: CloudFile[] = [
    {
        id: 's2-safe',
        name: 'S2A_MSIL2A_20240602T023531_N0500_R046_T50SNC_20240602T045912.SAFE',
        size: '780 MB',
        type: 'Sentinel-2 L2A 产品目录（.SAFE）',
        date: '2025-06-02 16:20:00',
        iconType: 'folder',
    },
    {
        id: 's2-l1c-zip',
        name: 'S2B_MSIL1C_20250520T023529_N0500_R046_T50TLK_20250520T041525.zip',
        size: '920 MB',
        type: 'Sentinel-2 L1C 原始包 / ZIP',
        date: '2025-05-20 12:10:33',
        iconType: 'zip',
    },
    {
        id: 's1-slc',
        name: 'S1A_IW_SLC__1SDV_20250410T101234_20250410T101259_052123_064A12_7C88.zip',
        size: '4.2 GB',
        type: 'Sentinel-1 IW SLC 原始包 / ZIP',
        date: '2025-04-10 18:45:00',
        iconType: 'zip',
    },
    {
        id: 's1-grd',
        name: 'S1B_EW_GRDM_1SDH_20250301T082456_20250301T082500_045678_057BCD_VH.tif',
        size: '1.1 GB',
        type: 'Sentinel-1 EW GRD GeoTIFF（单极化）',
        date: '2025-03-01 09:30:22',
        iconType: 'raster',
    },
    {
        id: 's3-wfr',
        name: 'S3B_OL_1_EFR____20250415T092012_20250415T092312_20250416T004512_0180_095_245_0.SEN3',
        size: '-',
        type: 'Sentinel-3 OLCI L1 产品目录（.SEN3）',
        date: '2025-04-16 02:45:11',
        iconType: 'folder',
    },
    {
        id: 's5p-nc',
        name: 'S5P_OFFL_L2__NO2____20250501T052006_20250501T070236_08192_03_020400_20250503T042112.nc',
        size: '156 MB',
        type: 'Sentinel-5P OFFL L2 NO2 / NetCDF',
        date: '2025-05-03 04:21:12',
        iconType: 'raster',
    },
];

/** 矢量数据：根目录列表（含 3 个 shp 压缩包 + 二级文件夹入口，其余格式保留） */
const VECTOR_ROOT_FILES: CloudFile[] = [
    { id: 'v-shp-zip-1', name: '省界县级_2024_shp_bundle.zip', size: '72 MB', type: 'ZIP / Shapefile 集合', date: '2025-04-10 15:50:49', iconType: 'zip' },
    { id: 'v-shp-zip-2', name: '城市道路网_中心线_shp_bundle.zip', size: '128 MB', type: 'ZIP / Shapefile 集合（线）', date: '2025-05-16 11:22:08', iconType: 'zip' },
    { id: 'v-shp-zip-3', name: '用地斑块_国土变更_shp_bundle.zip', size: '256 MB', type: 'ZIP / Shapefile 集合（面）', date: '2025-06-02 09:40:00', iconType: 'zip' },
    /** 演示：完整性校验失败（必备 shp 侧车文件不齐） */
    {
        id: 'v-shp-zip-bad',
        name: '旧版导出_缺dbf_shp_bundle.zip',
        size: '18 MB',
        type: 'ZIP / Shapefile（校验：缺 .dbf）',
        date: '2024-11-03 08:00:00',
        iconType: 'zip',
    },
    {
        id: 'v-vec-sub-shp-bundle',
        name: '基础几何_sample_shp分件',
        size: '-',
        type: '子目录 / 含独立 .shp 分图层',
        date: '2025-06-18 10:15:00',
        iconType: 'folder',
    },
    { id: 'v-gpkg', name: 'POI_兴趣点_全国_subset.gpkg', size: '1.1 GB', type: 'GeoPackage / 矢量+空间索引', date: '2025-05-22 10:20:20', iconType: 'vector' },
    { id: 'v-geojson', name: '规划范围_东湖高新区.geojson', size: '4.2 MB', type: 'GeoJSON', date: '2025-06-01 09:18:33', iconType: 'vector' },
    { id: 'v-kml', name: '航线巡查路径_2024Q3.kml', size: '128 KB', type: 'KML', date: '2025-09-12 14:00:01', iconType: 'vector' },
    { id: 'v-kmz', name: '勘测定界_地块A.kmz', size: '2.4 MB', type: 'KMZ / 压缩 KML', date: '2025-07-19 11:33:44', iconType: 'zip' },
    { id: 'v-tab', name: '地下管线_tab_bundle.zip', size: '35 MB', type: 'ZIP / MapInfo TAB', date: '2025-08-08 08:08:08', iconType: 'zip' },
    { id: 'v-dxf', name: '园区总平面_2024.dxf', size: '18 MB', type: 'AutoCAD DXF', date: '2025-02-28 16:16:16', iconType: 'vector' },
    { id: 'v-csv', name: '监测站点_xy_wgs84.csv', size: '560 KB', type: 'CSV / 带经纬度', date: '2025-11-01 13:45:00', iconType: 'vector' },
];

/** 矢量数据 → 二级文件夹内：三个独立 .shp */
const VECTOR_SUBFOLDER_SHP_FILES: CloudFile[] = [
    {
        id: 'v-sub-points-shp',
        name: 'points.shp',
        size: '3.2 MB',
        type: 'Shapefile / 点要素（设施点）',
        date: '2025-06-18 10:16:02',
        iconType: 'vector',
    },
    {
        id: 'v-sub-lines-shp',
        name: 'lines.shp',
        size: '12.8 MB',
        type: 'Shapefile / 线要素（道路中心线）',
        date: '2025-06-18 10:16:05',
        iconType: 'vector',
    },
    {
        id: 'v-sub-polygons-shp',
        name: 'polygons.shp',
        size: '46 MB',
        type: 'Shapefile / 面要素（地块边界）',
        date: '2025-06-18 10:16:18',
        iconType: 'vector',
    },
];

/** 矢量数据浏览：根目录 / 二级文件夹内 */
type VectorNav = 'root' | 'subfolder_shp';

/** 各一级目录下：主流空间数据格式 mock（原始卫星数据由 RawSatelliteNav 单独驱动；矢量数据由 VectorNav 单独驱动） */
const MOCK_CLOUD_FILES_BY_FOLDER: Record<string, CloudFile[]> = {
    thematic_rs: [
        { id: 'th-ndvi', name: 'Hubei_NDVI_2024Q2_cog.tif', size: '1.2 GB', type: 'COG / NDVI 季度合成', date: '2025-06-30 09:00:00', iconType: 'raster' },
        { id: 'th-lst', name: 'MODIS_LST_monthly_202405.tif', size: '480 MB', type: 'GeoTIFF / 地表温度', date: '2025-05-31 22:15:40', iconType: 'raster' },
        { id: 'th-fvc', name: 'China_FVC_10m_2023.tif', size: '8.4 GB', type: 'GeoTIFF / 植被覆盖度', date: '2025-01-12 14:02:11', iconType: 'raster' },
        { id: 'th-mndwi', name: 'Yangtze_mNDWI_summer.jp2', size: '620 MB', type: 'JPEG2000 / 水体指数', date: '2025-08-20 11:11:11', iconType: 'raster' },
        { id: 'th-vrt', name: 'ChangeDetect_2023_2024_stack.vrt', size: '12 KB', type: 'VRT / 多期影像虚拟栅格', date: '2025-10-01 08:30:00', iconType: 'raster' },
        { id: 'th-img', name: 'NightLight_monthly_202401.hdr', size: '2 KB', type: 'ENVI HDR / 指向同名栅格', date: '2025-02-01 19:45:00', iconType: 'raster' },
        { id: 'th-nc', name: 'ERA5_surface_temp_2024_subset.nc', size: '156 MB', type: 'NetCDF / 格网气象与遥感派生', date: '2025-03-15 12:00:00', iconType: 'raster' },
    ],
    model3d: [
        { id: 'm-glb', name: 'CityLOD2_buildings.glb', size: '240 MB', type: 'glTF 二进制 / Web 三维', date: '2025-03-03 12:12:12', iconType: 'model3d' },
        { id: 'm-gltf', name: 'Bridge_component.gltf', size: '45 MB', type: 'glTF + bin 纹理引用', date: '2025-04-14 09:09:09', iconType: 'model3d' },
        { id: 'm-obj', name: 'Historic_tower.obj', size: '82 MB', type: 'Wavefront OBJ', date: '2025-05-05 15:15:15', iconType: 'model3d' },
        { id: 'm-fbx', name: 'Equipment_cluster.fbx', size: '128 MB', type: 'Autodesk FBX', date: '2025-06-18 18:18:18', iconType: 'model3d' },
        { id: 'm-ifc', name: 'Office_block_L4.ifc', size: '96 MB', type: 'IFC / BIM 交换', date: '2025-07-07 07:07:07', iconType: 'model3d' },
        { id: 'm-dae', name: 'Terrain_tile_collada.dae', size: '22 MB', type: 'Collada DAE', date: '2025-08-24 20:20:20', iconType: 'model3d' },
        { id: 'm-3ds', name: 'Tree_pack_v2.3ds', size: '8 MB', type: '3DS Max 3DS', date: '2025-09-09 09:09:09', iconType: 'model3d' },
        { id: 'm-osgb', name: 'Tile_000_001_L19.osgb', size: '64 MB', type: 'OSGB / 倾斜摄影瓦块', date: '2025-10-10 10:10:10', iconType: 'model3d' },
    ],
    uav: [
        { id: 'u-dom', name: 'Survey_202405_ortho_DOM.tif', size: '3.8 GB', type: 'GeoTIFF / 正射影像 DOM', date: '2025-05-20 17:00:00', iconType: 'drone' },
        { id: 'u-dsm', name: 'Survey_202405_DSM.tif', size: '2.1 GB', type: 'GeoTIFF / 数字表面模型', date: '2025-05-20 17:05:00', iconType: 'drone' },
        { id: 'u-las', name: 'Strip_merge_classified.las', size: '5.6 GB', type: 'LAS / 机载点云', date: '2025-05-21 08:30:22', iconType: 'pointcloud' },
        { id: 'u-laz', name: 'Strip_merge_classified.laz', size: '1.9 GB', type: 'LAZ / 压缩点云', date: '2025-05-21 08:35:00', iconType: 'pointcloud' },
        { id: 'u-jpg', name: 'RGB_mosaic_part01_3cm.jpg', size: '420 MB', type: 'JPEG / 拼图块', date: '2025-05-19 12:12:12', iconType: 'raster' },
        { id: 'u-dng', name: 'DJI_20240518103000_0001.DNG', size: '48 MB', type: 'RAW / 传感器原始', date: '2025-05-18 10:30:01', iconType: 'unknown' },
        { id: 'u-mp4', name: 'Inspection_flight_01_4k.mp4', size: '2.2 GB', type: 'MP4 / 巡查视频', date: '2025-05-18 18:00:00', iconType: 'unknown' },
    ],
    terrain: [
        { id: 't-dem', name: 'Hubei_SRTM30_merge.tif', size: '2.4 GB', type: 'GeoTIFF / DEM 镶嵌', date: '2025-02-02 02:02:02', iconType: 'terrain' },
        { id: 't-asc', name: 'Watershed_1m_dem.asc', size: '890 MB', type: 'ESRI ASCII Grid', date: '2025-03-12 12:12:12', iconType: 'terrain' },
        { id: 't-flt', name: 'Basin_flowdir.flt', size: '120 MB', type: 'Binary FLT + HDR', date: '2025-04-04 04:04:04', iconType: 'terrain' },
        { id: 't-hgt', name: 'N30E114.hgt', size: '14 MB', type: 'SRTM HGT 1° 瓦片', date: '2025-01-20 00:00:00', iconType: 'terrain' },
        { id: 't-dem2', name: 'City_core_LiDAR_DSM.dem', size: '640 MB', type: 'USGS DEM', date: '2025-06-06 06:06:06', iconType: 'terrain' },
        { id: 't-terrain', name: 'Globe_tile_12_3456_7890.terrain', size: '1.2 MB', type: 'Cesium Quantized Mesh', date: '2025-07-01 09:00:00', iconType: 'tile_raster' },
    ],
    raster_tiles: [
        { id: 'rt-mbt', name: 'WorldImagery_WGS84_z0-8.mbtiles', size: '12 GB', type: 'MBTiles / 栅格金字塔', date: '2025-01-15 10:00:00', iconType: 'tile_raster' },
        { id: 'rt-tpk', name: 'Hubei_BaseMap_2024.tpk', size: '4.5 GB', type: 'ArcGIS Tile Package', date: '2025-08-01 11:22:33', iconType: 'tile_raster' },
        { id: 'rt-xyz', name: 'GoogleStyle_xyz_png_z6-12.zip', size: '890 MB', type: 'ZIP / XYZ 瓦片目录', date: '2025-09-09 09:09:09', iconType: 'zip' },
        { id: 'rt-tms', name: 'Global_L8_TMS_root', size: '-', type: 'TMS 瓦片目录', date: '2025-10-01 08:00:00', iconType: 'folder' },
        { id: 'rt-cog', name: 'PlanetScope_cog_z_overviews.tif', size: '2.1 GB', type: 'COG / 内部金字塔', date: '2025-11-11 11:11:11', iconType: 'raster' },
        { id: 'rt-json', name: 'Sentinel2_visual_tileset.json', size: '8 KB', type: 'TileJSON 元数据', date: '2025-12-01 12:00:00', iconType: 'unknown' },
    ],
    vector_tiles: [
        { id: 'vt-mbt', name: 'Admin_poly_world_z0-10.mbtiles', size: '3.2 GB', type: 'MBTiles / MVT 矢量瓦片', date: '2025-02-14 14:14:14', iconType: 'tile_vector' },
        { id: 'vt-pmtiles', name: 'Road_network_CN.pmtiles', size: '18 GB', type: 'PMTiles / 单文件矢量切片', date: '2025-05-05 05:05:05', iconType: 'tile_vector' },
        { id: 'vt-pbf', name: 'Buildings_z14_bundle.pbf.zip', size: '420 MB', type: 'ZIP / Mapbox Vector Tile PBF', date: '2025-06-20 20:20:20', iconType: 'zip' },
        { id: 'vt-mvt', name: 'Custom_layer_z8-12.mvt', size: '64 MB', type: 'MVT 单级切片', date: '2025-07-07 07:07:07', iconType: 'tile_vector' },
        { id: 'vt-sqlite', name: 'Gaode_vector_cache.sqlitedb', size: '1.1 GB', type: 'SQLite 矢量缓存', date: '2025-08-08 08:08:08', iconType: 'tile_vector' },
        { id: 'vt-folder', name: 'OSM_vector_tiles_pbf_tree', size: '-', type: '目录 / x/y/z.pbf 树', date: '2025-09-19 19:19:19', iconType: 'folder' },
    ],
    business_tables: [
        { id: 'bt-xlsx', name: '气象站点小时观测_2024.xlsx', size: '28 MB', type: 'Excel 工作簿 (.xlsx)', date: '2025-06-01 08:30:00', iconType: 'business' },
        { id: 'bt-xls', name: '人口普查汇总表_2010.xls', size: '12 MB', type: 'Excel 97-2003 (.xls)', date: '2025-01-15 14:00:00', iconType: 'business' },
        { id: 'bt-csv', name: '订单明细_export_utf8.csv', size: '156 MB', type: 'CSV / UTF-8', date: '2025-11-20 10:12:33', iconType: 'business' },
        { id: 'bt-tsv', name: '日志解析结果_202410.tsv', size: '890 MB', type: 'TSV / 制表符分隔', date: '2025-10-31 23:59:00', iconType: 'business' },
        { id: 'bt-parquet', name: '用户行为宽表_2024Q3.snappy.parquet', size: '2.4 GB', type: 'Apache Parquet', date: '2025-10-01 09:00:00', iconType: 'business' },
        { id: 'bt-orc', name: '仓库存货快照_202409.orc', size: '640 MB', type: 'Apache ORC', date: '2025-09-28 16:45:12', iconType: 'business' },
        { id: 'bt-dbf', name: '地籍属性表_legacy.dbf', size: '48 MB', type: 'dBASE DBF', date: '2024-12-01 11:11:11', iconType: 'business' },
        { id: 'bt-ods', name: '预算执行进度_2025.ods', size: '2.1 MB', type: 'OpenDocument 电子表格', date: '2025-05-12 12:00:00', iconType: 'business' },
        { id: 'bt-jsonl', name: '设备遥测流_sample.jsonl', size: '320 MB', type: 'JSON Lines', date: '2025-08-08 08:08:08', iconType: 'business' },
        { id: 'bt-sqlite', name: '业务中间库_snapshot.sqlite', size: '180 MB', type: 'SQLite / 非空间业务库', date: '2025-07-07 07:07:07', iconType: 'business' },
        { id: 'bt-mdb', name: '登记台账_archive.mdb', size: '64 MB', type: 'Access MDB', date: '2023-03-03 03:03:03', iconType: 'business' },
        { id: 'bt-zip', name: '多表批量导出_20241231.zip', size: '95 MB', type: 'ZIP / 多 CSV + 说明', date: '2025-01-02 09:30:00', iconType: 'zip' },
    ],
};

/** 勾选文件夹时展开为可入库的文件列表 */
function expandFolderToFiles(file: CloudFile): CloudFile[] {
    switch (file.id) {
        case 'raw-nav-gaofen':
            return [
                ...GAOFEN_SERIES_ROOT_FILES.filter((f) => f.iconType !== 'folder'),
                ...GF2_SCENE_INNER_FILES,
            ];
        case 'raw-nav-sentinel':
            return SENTINEL_SERIES_FILES;
        case 'gf2-scene-dir':
            return GF2_SCENE_INNER_FILES;
        case 'v-vec-sub-shp-bundle':
            return VECTOR_SUBFOLDER_SHP_FILES;
        default:
            return [file];
    }
}

function resolveConfirmedSelection(selectedIds: Set<string>, visibleFiles: CloudFile[]): CloudFile[] {
    const byId = new Map(visibleFiles.map((f) => [f.id, f]));
    const out: CloudFile[] = [];
    const seen = new Set<string>();
    const add = (f: CloudFile) => {
        if (seen.has(f.id)) return;
        seen.add(f.id);
        out.push(f);
    };
    selectedIds.forEach((id) => {
        const file = byId.get(id);
        if (!file) return;
        if (file.iconType === 'folder') {
            expandFolderToFiles(file).forEach(add);
        } else {
            add(file);
        }
    });
    return out;
}

interface CloudDiskSelectionPageProps {
    onBack: () => void;
    onConfirm: (selectedFiles: CloudFile[]) => void;
}

const CLOUD_DISK_FEATURE_POINTS: FeaturePoint[] = [
    { key: 'page-header', label: '页面头部', description: '返回按钮与页面标题' },
    { key: 'left-folder-tree', label: '左侧目录分类', description: '原始卫星数据 / 矢量数据 / 三维模型 等分类' },
    { key: 'raw-satellite-nav', label: '原始卫星数据导航', description: '高分 → 景目录 → 文件 三级下钻' },
    { key: 'vector-nav', label: '矢量数据导航', description: '矢量目录内文件浏览' },
    { key: 'right-file-list', label: '右侧文件列表', description: '文件条目：文件名、大小、日期、类型图标' },
    { key: 'file-checkbox', label: '文件多选', description: '点击条目行或复选框选中文件' },
    { key: 'select-all', label: '全选/取消全选', description: '列表头部全选操作' },
    { key: 'confirm-bar', label: '底部确认栏', description: '已选数量显示 + 取消 + 确定按钮' },
    { key: 'folder-expand', label: '目录展开/折叠', description: '点击目录行进入子目录' },
];

/** 从云盘选择：全页（时空数据入库等入口跳转，非弹窗） */
export const CloudDiskSelectionPage: React.FC<CloudDiskSelectionPageProps> = ({ onBack, onConfirm }) => {
    const [activeFolderId, setActiveFolderId] = useState<string>(ROOT_FOLDERS[0].id);
    const [specDrawerOpen, setSpecDrawerOpen] = useState(false);
    const [rawNav, setRawNav] = useState<RawSatelliteNav>({ step: 'series' });
    const [vectorNav, setVectorNav] = useState<VectorNav>('root');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const visibleFiles = useMemo(() => {
        if (activeFolderId === 'vector') {
            return vectorNav === 'root' ? VECTOR_ROOT_FILES : VECTOR_SUBFOLDER_SHP_FILES;
        }
        if (activeFolderId !== 'raw_satellite') {
            return MOCK_CLOUD_FILES_BY_FOLDER[activeFolderId] ?? [];
        }
        switch (rawNav.step) {
            case 'series':
                return RAW_SATELLITE_SERIES_ENTRIES;
            case 'gaofen':
                return GAOFEN_SERIES_ROOT_FILES;
            case 'sentinel':
                return SENTINEL_SERIES_FILES;
            case 'gf2_scene':
                return GF2_SCENE_INNER_FILES;
            default:
                return RAW_SATELLITE_SERIES_ENTRIES;
        }
    }, [activeFolderId, rawNav.step, vectorNav]);

    const activeFolderLabel = ROOT_FOLDERS.find((f) => f.id === activeFolderId)?.label ?? '';

    const visibleIds = useMemo(() => visibleFiles.map((f) => f.id), [visibleFiles]);

    const allVisibleSelected =
        visibleIds.length > 0 && visibleIds.every((id) => selectedIds.has(id));
    const someVisibleSelected = visibleIds.some((id) => selectedIds.has(id));

    const resolvedConfirmFiles = useMemo(
        () => resolveConfirmedSelection(selectedIds, visibleFiles),
        [selectedIds, visibleFiles],
    );

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleSelectAll = () => {
        if (allVisibleSelected) {
            setSelectedIds(new Set());
            return;
        }
        setSelectedIds(new Set(visibleIds));
    };

    const selectFolder = (folderId: string) => {
        setActiveFolderId(folderId);
        setSelectedIds(new Set());
        if (folderId === 'raw_satellite') {
            setRawNav({ step: 'series' });
        }
        if (folderId === 'vector') {
            setVectorNav('root');
        }
    };

    const handleFileRowClick = (file: CloudFile) => {
        if (activeFolderId === 'vector') {
            if (vectorNav === 'root' && file.id === 'v-vec-sub-shp-bundle') {
                setVectorNav('subfolder_shp');
                setSelectedIds(new Set());
                return;
            }
            toggleSelect(file.id);
            return;
        }
        if (activeFolderId !== 'raw_satellite') {
            toggleSelect(file.id);
            return;
        }
        if (rawNav.step === 'series') {
            if (file.id === 'raw-nav-gaofen') {
                setRawNav({ step: 'gaofen' });
                setSelectedIds(new Set());
            } else if (file.id === 'raw-nav-sentinel') {
                setRawNav({ step: 'sentinel' });
                setSelectedIds(new Set());
            }
            return;
        }
        if (rawNav.step === 'gaofen' && file.id === 'gf2-scene-dir') {
            setRawNav({ step: 'gf2_scene' });
            setSelectedIds(new Set());
            return;
        }
        toggleSelect(file.id);
    };

    return (
        <>
        <div className="flex h-full min-h-0 w-full flex-1 flex-col overflow-hidden animate-fadeIn">
            <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 bg-[#f8fbfd] px-4 py-3">
                <button
                    type="button"
                    onClick={onBack}
                    className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[13px] font-bold text-slate-600 transition-colors hover:bg-white hover:text-blue-700"
                >
                    <ArrowLeft size={18} />
                    返回
                </button>
                <div className="h-5 w-px shrink-0 bg-slate-200" aria-hidden />
                <h1 className="min-w-0 flex-1 text-sm font-bold text-slate-800">从云盘选择</h1>
                <button
                    type="button"
                    onClick={() => setSpecDrawerOpen(true)}
                    className="flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-[13px] font-medium text-amber-700 transition-all hover:bg-amber-100 hover:border-amber-300"
                    title="需求规格说明（仅研发可见）"
                >
                    <BookOpen size={14} />
                    需求规格说明
                </button>
            </div>

            <div className="flex min-h-0 flex-1 flex-col overflow-hidden md:flex-row">
                    <div className="flex w-full shrink-0 flex-col overflow-y-auto border-slate-100 p-4 custom-scrollbar md:w-64 md:border-r">
                        <div className="flex items-center gap-2 mb-6 px-2">
                            <LayoutGrid size={16} className="text-slate-800" />
                            <span className="text-[13px] font-bold text-slate-800">时空数据云盘</span>
                        </div>

                        <div className="space-y-0.5">
                            {ROOT_FOLDERS.map((folder) => (
                                <button
                                    key={folder.id}
                                    type="button"
                                    onClick={() => selectFolder(folder.id)}
                                    className={`
                                        w-full flex items-center gap-2 py-2 px-2 rounded-lg text-left transition-all
                                        ${activeFolderId === folder.id
                                            ? 'bg-blue-50 text-blue-800 ring-1 ring-blue-100'
                                            : 'text-slate-600 hover:bg-slate-50'}
                                    `}
                                >
                                    <Folder
                                        size={14}
                                        className={activeFolderId === folder.id ? 'text-blue-600' : 'text-slate-400'}
                                        fill="currentColor"
                                        fillOpacity={0.15}
                                    />
                                    <span className="text-[12px] font-medium truncate">{folder.label}</span>
                                </button>
                            ))}
                        </div>

                        <div className="mt-auto pt-6 px-2">
                            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                <span>43.2 GB / 500 GB</span>
                            </div>
                            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-[8.6%]" />
                            </div>
                        </div>
                    </div>

                    <div className="flex min-h-0 min-w-0 flex-1 flex-col bg-white">
                        <div className="p-4 flex items-center justify-between border-b border-slate-50 gap-3">
                            <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1 text-[13px] text-slate-500">
                                    {activeFolderId === 'raw_satellite' ? (
                                        <>
                                            <span className="text-blue-600 font-bold shrink-0">云盘</span>
                                            <ChevronRight size={14} className="shrink-0 text-slate-300" />
                                            <button
                                                type="button"
                                                className="font-bold text-slate-800 hover:text-blue-600 truncate max-w-[160px] text-left"
                                                onClick={() => {
                                                    setRawNav({ step: 'series' });
                                                    setSelectedIds(new Set());
                                                }}
                                            >
                                                原始卫星数据
                                            </button>
                                            {rawNav.step === 'gaofen' && (
                                                <>
                                                    <ChevronRight size={14} className="shrink-0 text-slate-300" />
                                                    <span className="font-bold text-slate-800 truncate">高分系列</span>
                                                </>
                                            )}
                                            {rawNav.step === 'gf2_scene' && (
                                                <>
                                                    <ChevronRight size={14} className="shrink-0 text-slate-300" />
                                                    <button
                                                        type="button"
                                                        className="font-bold text-slate-800 hover:text-blue-600 truncate max-w-[120px] text-left"
                                                        onClick={() => {
                                                            setRawNav({ step: 'gaofen' });
                                                            setSelectedIds(new Set());
                                                        }}
                                                    >
                                                        高分系列
                                                    </button>
                                                    <ChevronRight size={14} className="shrink-0 text-slate-300" />
                                                    <span
                                                        className="font-bold text-slate-700 truncate max-w-[280px]"
                                                        title="GF2_PMS1_E109.7_N31.5_20250615_L1A14703019001"
                                                    >
                                                        GF2_PMS1_E109.7_N31.5_20250615_L1A14703019001
                                                    </span>
                                                </>
                                            )}
                                            {rawNav.step === 'sentinel' && (
                                                <>
                                                    <ChevronRight size={14} className="shrink-0 text-slate-300" />
                                                    <span className="font-bold text-slate-800 truncate">哨兵系列</span>
                                                </>
                                            )}
                                        </>
                                    ) : activeFolderId === 'vector' ? (
                                        <>
                                            <span className="text-blue-600 font-bold shrink-0">云盘</span>
                                            <ChevronRight size={14} className="shrink-0 text-slate-300" />
                                            {vectorNav === 'subfolder_shp' ? (
                                                <button
                                                    type="button"
                                                    className="font-bold text-slate-800 hover:text-blue-600 truncate max-w-[160px] text-left"
                                                    onClick={() => {
                                                        setVectorNav('root');
                                                        setSelectedIds(new Set());
                                                    }}
                                                >
                                                    矢量数据
                                                </button>
                                            ) : (
                                                <span className="font-bold text-slate-800 truncate">矢量数据</span>
                                            )}
                                            {vectorNav === 'subfolder_shp' && (
                                                <>
                                                    <ChevronRight size={14} className="shrink-0 text-slate-300" />
                                                    <span
                                                        className="font-bold text-slate-700 truncate max-w-[280px]"
                                                        title="基础几何_sample_shp分件"
                                                    >
                                                        基础几何_sample_shp分件
                                                    </span>
                                                </>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <span className="text-blue-600 font-bold shrink-0">云盘</span>
                                            <ChevronRight size={14} className="shrink-0 text-slate-300" />
                                            <span className="font-bold text-slate-800 truncate" title={activeFolderLabel}>
                                                {activeFolderLabel}
                                            </span>
                                        </>
                                    )}
                                </div>

                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    type="button"
                                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-500 rounded text-xs font-medium hover:bg-slate-50 hover:text-blue-600 transition-all"
                                >
                                    <Share2 size={14} className="text-blue-500" />
                                    传输列表
                                </button>
                                <button
                                    type="button"
                                    className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-500 rounded text-xs font-medium hover:bg-slate-50 hover:text-blue-600 transition-all"
                                >
                                    <Upload size={14} className="text-blue-500" />
                                    上传
                                </button>
                                <button
                                    type="button"
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-all"
                                >
                                    添加目录
                                </button>
                                <button type="button" className="p-1.5 border border-slate-200 text-slate-500 rounded hover:bg-slate-50">
                                    <LayoutGrid size={14} className="text-blue-500" />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
                            <table className="w-full text-left text-[13px] border-collapse">
                                <thead className="bg-[#f0f4f8] text-slate-500 font-bold sticky top-0 z-10">
                                    <tr>
                                        <th className="p-3 w-12 text-center border-r border-white">
                                            <input
                                                type="checkbox"
                                                className="rounded border-slate-300 cursor-pointer"
                                                checked={allVisibleSelected}
                                                ref={(el) => {
                                                    if (el) el.indeterminate = someVisibleSelected && !allVisibleSelected;
                                                }}
                                                onChange={toggleSelectAll}
                                                aria-label="全选当前列表"
                                                disabled={visibleIds.length === 0}
                                            />
                                        </th>
                                        <th className="p-3 pl-8 border-r border-white">名称</th>
                                        <th className="p-3 w-32 border-r border-white">大小</th>
                                        <th className="p-3 w-44 border-r border-white">类型</th>
                                        <th className="p-3 w-48">修改日期</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {visibleFiles.map((file) => (
                                        <tr
                                            key={file.id}
                                            className={`hover:bg-blue-50/30 transition-all group cursor-pointer ${selectedIds.has(file.id) ? 'bg-blue-50/50' : ''}`}
                                            onClick={() => handleFileRowClick(file)}
                                        >
                                            <td
                                                className="p-3 text-center"
                                                onClick={(e) => e.stopPropagation()}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(file.id)}
                                                    className="rounded border-slate-300 cursor-pointer"
                                                    onChange={() => toggleSelect(file.id)}
                                                    aria-label={`选择 ${file.name}`}
                                                />
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <FileIcon type={file.iconType} />
                                                    <span className="text-slate-800 font-medium truncate">{file.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-slate-500 tabular-nums whitespace-nowrap">{file.size}</td>
                                            <td className="p-3 text-slate-500 text-xs leading-snug">{file.type}</td>
                                            <td className="p-3 text-slate-400 text-xs tabular-nums whitespace-nowrap">{file.date}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <div className="flex shrink-0 items-center justify-between gap-4 border-t border-slate-100 bg-white px-6 py-4">
                    <p className="text-[12px] text-slate-500">
                        {selectedIds.size === 0 ? (
                            '勾选文件或文件夹；文件夹将按目录内全部文件入库'
                        ) : (
                            <>
                                已勾选 <span className="font-bold text-slate-700">{selectedIds.size}</span> 项
                                {resolvedConfirmFiles.length !== selectedIds.size && (
                                    <>
                                        ，确认后将导入{' '}
                                        <span className="font-bold text-blue-700">
                                            {resolvedConfirmFiles.length}
                                        </span>{' '}
                                        个文件
                                    </>
                                )}
                            </>
                        )}
                    </p>
                    <div className="flex shrink-0 gap-3">
                    <button
                        type="button"
                        onClick={onBack}
                        className="rounded border border-slate-200 px-6 py-1.5 text-[13px] font-bold text-slate-600 transition-all hover:bg-slate-50"
                    >
                        取消
                    </button>
                    <button
                        type="button"
                        disabled={selectedIds.size === 0}
                        onClick={() => {
                            onConfirm(resolvedConfirmFiles);
                            onBack();
                        }}
                        className="rounded bg-blue-600 px-6 py-1.5 text-[13px] font-bold text-white shadow-sm shadow-blue-100 transition-all hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        确定
                    </button>
                    </div>
                </div>
        </div>

        <RequirementsSpecDrawer
            open={specDrawerOpen}
            onClose={() => setSpecDrawerOpen(false)}
            pageKey="cloud-disk-selection"
            pageTitle="从云盘选择"
            featurePoints={CLOUD_DISK_FEATURE_POINTS}
        />
        </>
    );
};

const FileIcon: React.FC<{ type: CloudFile['iconType'] }> = ({ type }) => {
    const cls = 'shrink-0';
    switch (type) {
        case 'zip':
            return (
                <div className="relative">
                    <FileArchive size={20} className="text-orange-400" fill="currentColor" fillOpacity={0.12} />
                    <span className="absolute inset-0 flex items-center justify-center text-[6px] text-orange-900/80 font-black pt-2">
                        ZIP
                    </span>
                </div>
            );
        case 'folder':
            return <Folder size={20} className={`text-amber-400 ${cls}`} fill="currentColor" fillOpacity={0.2} />;
        case 'link':
            return (
                <div className="bg-amber-100 p-0.5 rounded shrink-0">
                    <Link size={16} className="text-amber-600" />
                </div>
            );
        case 'raster':
            return <Image size={20} className={`text-sky-500 ${cls}`} strokeWidth={2} />;
        case 'vector':
            return <Shapes size={20} className={`text-emerald-600 ${cls}`} strokeWidth={2} />;
        case 'model3d':
            return <Box size={20} className={`text-violet-600 ${cls}`} strokeWidth={2} />;
        case 'drone':
            return <Plane size={20} className={`text-cyan-600 ${cls}`} strokeWidth={2} />;
        case 'terrain':
            return <Mountain size={20} className={`text-stone-500 ${cls}`} strokeWidth={2} />;
        case 'tile_raster':
            return <LayoutGrid size={20} className={`text-amber-600 ${cls}`} strokeWidth={2} />;
        case 'tile_vector':
            return <Layers size={20} className={`text-indigo-600 ${cls}`} strokeWidth={2} />;
        case 'pointcloud':
            return <CircleDot size={20} className={`text-teal-600 ${cls}`} strokeWidth={2} />;
        case 'business':
            return <Table2 size={20} className={`text-slate-700 ${cls}`} strokeWidth={2} />;
        default:
            return <FileText size={20} className={`text-slate-400 ${cls}`} />;
    }
};
