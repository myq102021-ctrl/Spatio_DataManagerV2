import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  WORLD_MAP_SCHEMATIC_COVER_URL,
  type APIRow,
  DATA_THEME_BIND_OPTIONS,
} from '../constants';
import type { SatelliteSceneDetailPayload } from '../gf1cBatchIngestionMock';
import { ServiceDetailView } from './ServiceDetailView';
import { PaginationBar } from './PaginationBar';
import { themePathByNodeId } from '../lib/dataThemePath';
import {
  buildDdlFromFieldDefs,
  metadataRowsFromAgentOutput,
  runMetadataGenerationAgent,
  type MetadataAgentOutput,
} from '../lib/metadataGenerationAgent';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Undo2, Map, Heart, Share2, Copy, Download, Info, ShieldCheck, Layers, Table, ChevronDown, Plus, Minus, Globe, CheckCircle2, Circle, PanelLeftClose, PanelLeftOpen, Camera, Upload, Image as ImageIcon, X, RefreshCw, Tag, Check, Scale, AlertTriangle, ScrollText, Copyright, Edit2, Save, Sparkles, LoaderCircle, Send, Satellite } from 'lucide-react';

/** 数据预览默认视角（武汉附近，全国尺度） */
const DATA_PREVIEW_DEFAULT_CENTER: L.LatLngTuple = [30.6, 114.3];
const DATA_PREVIEW_DEFAULT_ZOOM = 7;

/** 与数据列表「上架状态」一致：是否已上架到数据集市（服务集市） */
export type DetailListingStatus = 'listed' | 'not_listed';

interface DataDetailPanelProps {
  onBack: () => void;
  /** 从数据总库列表进入时带入该行「上架状态」，与数据集市上架一致 */
  initialListingStatus?: DetailListingStatus;
  /** 从数据总库列表进入时带入该行「数据名称」，与列表展示一致 */
  initialDataName?: string;
  /** 与列表「编辑主题」绑定的主题节点 id，对应 DATA_THEME_BIND_OPTIONS */
  initialThemeNodeId?: string;
  /** 行政区划文案（可选） */
  initialAdminDivision?: string;
  /** 是否显示顶部「下载数据」按钮；数据总库进入详情时应为 false */
  allowDownload?: boolean;
  /** 是否允许详情编辑（公共数据集市进入时为只读，不展示「编辑」） */
  allowDetailEdit?: boolean;
  /** 卫星景产品详情（批量入库子任务） */
  satelliteSceneDetail?: SatelliteSceneDetailPayload;
  /** 栅格卫星数据无属性表，数据表 Tab 显示空状态 */
  hideDataTable?: boolean;
}

const SERVICE_THUMBNAIL_URL = WORLD_MAP_SCHEMATIC_COVER_URL;
const DATA_DETAIL_COVER_STORAGE_KEY = 'data-detail-cover-v1';

const RECOMMENDED_TAGS = [
    '国土空间', '自然资源', '生态保护', '交通路网', 
    '公共设施', '水利设施', '地质灾害', '遥感影像', 
    '地形地貌', '气象水文', '社会经济', '历史文化'
];

/** 详情页默认展示的标签条数，超出部分折叠为「+N 更多」 */
const TAG_PREVIEW_LIMIT = 10;

const INITIAL_DETAIL_TAGS = [
  '行政区划', '城市规划', '2025年度', '矢量数据',
  '国土空间', '生态保护', '遥感影像', '地形地貌',
  '政务共享', '离线可用', '质检通过', '高分辨率',
  'POI要素', '地名地址', '三维建模', '实时更新',
  '气象水文', '社会经济', '历史文化', '水利设施',
  '交通路网', '地质灾害', '精度校核', '年度更新',
];

const INITIAL_METADATA_ROWS: { key: string; en: string; cn: string; value: string }[] = [
  { key: 'dataID', en: 'dataID', cn: '数据名称', value: 'sla-iw1-sic-vh-' },
  { key: 'catagories', en: 'catagories', cn: '数据分类', value: '遥感遥测' },
  { key: 'dataSeclevel', en: 'dataSeclevel', cn: '数据安全等级', value: '公开' },
  { key: 'dataVer', en: 'dataVer', cn: '数据版本', value: 'V1.0' },
  { key: 'dataType', en: 'dataType', cn: '数据类型', value: 'tiff' },
  { key: 'serviceType', en: 'serviceType', cn: '服务类型', value: '时空服务' },
  { key: 'publishTime', en: 'publishTime', cn: '发布时间', value: '2025-12-16' },
  { key: 'uuid', en: 'uuid', cn: '唯一标识', value: 'a1b2-c3d4-e5f6-g7h8' },
  { key: 'abstract', en: 'abstract', cn: '摘要', value: '该数据集包含了2025年度行政区划点位数据...' },
  { key: 'contact', en: 'contact', cn: '联系人', value: 'System Admin' },
];

const DATA_LEVEL_OPTIONS = ['公开', '内部', '秘密', '机密'] as const;

/** 元数据表格：若从列表带入名称，同步「数据名称」行（dataID） */
function metadataRowsWithOptionalName(dataName?: string) {
  const rows = INITIAL_METADATA_ROWS.map((r) => ({ ...r }));
  const i = rows.findIndex((r) => r.key === 'dataID');
  if (i >= 0 && dataName != null && String(dataName).trim() !== '') {
    rows[i] = { ...rows[i], value: dataName.trim() };
  }
  return rows;
}

const INITIAL_DETAIL_OVERVIEW: {
  name: string;
  description: string;
  level: string;
  source: string;
  copyright: string;
  listingStatus: DetailListingStatus;
  adminDivision: string;
  /** 与 DATA_THEME_BIND_OPTIONS.id 对应 */
  themeNodeId: string;
  collectTime: string;
  ingestTime: string;
  updateTime: string;
} = {
  name: 'yehan_shp_1216002',
  description:
    '该数据集包含了2025年度行政区划点位数据，适用于地理信息系统分析、城市规划及相关人口分布研究。数据精度高，属性字段完整。',
  level: '公开',
  source: '市规划和自然资源局',
  copyright:
    '该数据集的所有权及解释权归市规划和自然资源局所有。未经书面许可，任何单位和个人不得将本数据用于商业营利目的，不得对数据进行深度加工或转售。',
  listingStatus: 'listed',
  adminDivision: '湖北省',
  themeNodeId: 'geo-admin',
  collectTime: '2025-12-16 11:46',
  ingestTime: '2025-12-16 11:46',
  updateTime: '2026-05-13 09:38:19',
};

/** 数据表字段定义（与下方数据记录列一致） */
const ATTRIBUTE_FIELD_DEFS: { name: string; type: string; length: string; desc: string }[] = [
  { name: 'OBJECTID', type: 'OID', length: '4', desc: '唯一标识符' },
  { name: 'NAME_CN', type: 'String', length: '255', desc: '中文名称' },
  { name: 'NAME_EN', type: 'String', length: '255', desc: '英文名称' },
  { name: 'Code_ID', type: 'Integer', length: '10', desc: '行政代码' },
  { name: 'Type_Code', type: 'String', length: '50', desc: '分类编码' },
  { name: 'City_Code', type: 'String', length: '20', desc: '城市代码' },
  { name: 'Shape_Area', type: 'Double', length: '8', desc: '几何面积' },
  { name: 'Shape_Len', type: 'Double', length: '8', desc: '几何周长' },
  { name: 'Create_Time', type: 'Date', length: '8', desc: '创建时间' },
  { name: 'Update_Time', type: 'Date', length: '8', desc: '更新时间' },
  { name: 'Creator', type: 'String', length: '50', desc: '创建人' },
  { name: 'Status', type: 'Integer', length: '2', desc: '数据状态' },
  { name: 'Remarks', type: 'String', length: '500', desc: '备注信息' },
];

const MOCK_ATTRIBUTE_TOTAL_COUNT = 2156;
const ATTRIBUTE_PAGE_SIZE = 10;

/** 用于分页时循环生成示例行 */
const MOCK_ATTRIBUTE_RECORDS: Record<string, string>[] = [
  {
    OBJECTID: '1',
    NAME_CN: '武昌区',
    NAME_EN: 'Wuchang District',
    Code_ID: '420106',
    Type_Code: 'DISTRICT',
    City_Code: '420100',
    Shape_Area: '62789450.12',
    Shape_Len: '45231.88',
    Create_Time: '2025-12-01',
    Update_Time: '2025-12-15',
    Creator: 'system',
    Status: '1',
    Remarks: '年度质检通过',
  },
  {
    OBJECTID: '2',
    NAME_CN: '江汉区',
    NAME_EN: 'Jianghan District',
    Code_ID: '420103',
    Type_Code: 'DISTRICT',
    City_Code: '420100',
    Shape_Area: '33150201.45',
    Shape_Len: '28904.56',
    Create_Time: '2025-12-01',
    Update_Time: '2025-12-15',
    Creator: 'system',
    Status: '1',
    Remarks: '—',
  },
  {
    OBJECTID: '3',
    NAME_CN: '东湖高新区',
    NAME_EN: 'East Lake High-Tech Zone',
    Code_ID: '420115',
    Type_Code: 'DEV_ZONE',
    City_Code: '420100',
    Shape_Area: '51890322.00',
    Shape_Len: '51002.11',
    Create_Time: '2025-12-02',
    Update_Time: '2025-12-16',
    Creator: '张三',
    Status: '1',
    Remarks: '三维建模核对完成',
  },
  {
    OBJECTID: '4',
    NAME_CN: '洪山区',
    NAME_EN: 'Hongshan District',
    Code_ID: '420111',
    Type_Code: 'DISTRICT',
    City_Code: '420100',
    Shape_Area: '48022188.33',
    Shape_Len: '39876.42',
    Create_Time: '2025-12-02',
    Update_Time: '2025-12-16',
    Creator: 'system',
    Status: '1',
    Remarks: '—',
  },
  {
    OBJECTID: '5',
    NAME_CN: '江岸区',
    NAME_EN: "Jiang'an District",
    Code_ID: '420102',
    Type_Code: 'DISTRICT',
    City_Code: '420100',
    Shape_Area: '41230567.88',
    Shape_Len: '36543.20',
    Create_Time: '2025-12-03',
    Update_Time: '2025-12-16',
    Creator: '李四',
    Status: '1',
    Remarks: '地名地址库已关联',
  },
  {
    OBJECTID: '6',
    NAME_CN: '硚口区',
    NAME_EN: 'Qiaokou District',
    Code_ID: '420104',
    Type_Code: 'DISTRICT',
    City_Code: '420100',
    Shape_Area: '29876543.21',
    Shape_Len: '27109.65',
    Create_Time: '2025-12-03',
    Update_Time: '2025-12-17',
    Creator: 'system',
    Status: '1',
    Remarks: '—',
  },
  {
    OBJECTID: '7',
    NAME_CN: '汉阳区',
    NAME_EN: 'Hanyang District',
    Code_ID: '420105',
    Type_Code: 'DISTRICT',
    City_Code: '420100',
    Shape_Area: '35678234.56',
    Shape_Len: '31278.90',
    Create_Time: '2025-12-04',
    Update_Time: '2025-12-17',
    Creator: 'system',
    Status: '0',
    Remarks: '待复核边界',
  },
  {
    OBJECTID: '8',
    NAME_CN: '青山区',
    NAME_EN: 'Qingshan District',
    Code_ID: '420107',
    Type_Code: 'DISTRICT',
    City_Code: '420100',
    Shape_Area: '38901234.67',
    Shape_Len: '33456.78',
    Create_Time: '2025-12-04',
    Update_Time: '2025-12-18',
    Creator: '王五',
    Status: '1',
    Remarks: '政务共享目录已发布',
  },
];

/** 数据详情「数据服务」卡片 → 服务详情页（ServiceDetailView）所需 API 模型 */
function serviceCardToApiRow(service: {
  id: number;
  name: string;
  endpoints: { protocol: string; url: string }[];
  dataType: string;
  serviceType: string;
  ref: string;
}): APIRow {
  const dtLower = service.dataType.toLowerCase();
  const rasterLike =
    dtLower.includes('栅格') || dtLower.includes('tiff') || dtLower.includes('影像');
  const apiDataType: NonNullable<APIRow['dataType']> = rasterLike ? '栅格' : '矢量';

  return {
    id: `dd-svc-${service.id}`,
    name: service.name,
    category: '时空数据服务',
    dirId: 'ogc',
    type: service.endpoints[0]?.protocol ?? 'WMS',
    version: 'V1.0',
    status: 'online',
    createTime: '2024-05-10 15:30',
    tags: ['遥感影像', 'OGC'],
    description:
      service.id === 1
        ? '湖北省全境10米分辨率卫星影像服务，支持 WMS、WMTS、TMS 等标准协议调用。'
        : `${service.name}，服务类型：${service.serviceType}。`,
    crs:
      service.ref.includes('WGS') || service.ref.includes('4326') ? 'EPSG:4326' : 'EPSG:3857',
    dataType: apiDataType,
    dataFormat: service.dataType,
    dataSource: 'geo_service_registry',
  };
}

function buildAttributeRecordAt(globalZeroBasedIndex: number): Record<string, string> {
  const template = MOCK_ATTRIBUTE_RECORDS[globalZeroBasedIndex % MOCK_ATTRIBUTE_RECORDS.length];
  const salt = globalZeroBasedIndex * 1337;
  const id = globalZeroBasedIndex + 1;
  return {
    ...template,
    OBJECTID: String(id),
    Code_ID: String(420100 + (salt % 899)),
    Shape_Area: (30000000 + (salt % 50000000)).toFixed(2),
    Shape_Len: (20000 + (salt % 45000)).toFixed(2),
  };
}

export const DataDetailPanel: React.FC<DataDetailPanelProps> = ({
  onBack,
  initialListingStatus,
  initialDataName,
  initialThemeNodeId,
  initialAdminDivision,
  allowDownload = true,
  allowDetailEdit = true,
  satelliteSceneDetail,
  hideDataTable = false,
}) => {
  const isSatelliteScene = !!satelliteSceneDetail;
  const [activeTab, setActiveTab] = useState(isSatelliteScene ? 'preview' : 'attributes');
  /** 数据表子页签：默认数据记录 */
  const [attributesSubTab, setAttributesSubTab] = useState<'records' | 'schema'>('records');
  const [attributePage, setAttributePage] = useState(1);
  const [metadataRows, setMetadataRows] = useState(() =>
    satelliteSceneDetail
      ? satelliteSceneDetail.metadataRows.map((r) => ({ ...r }))
      : metadataRowsWithOptionalName(initialDataName),
  );
  const [metadataDraft, setMetadataDraft] = useState<typeof INITIAL_METADATA_ROWS>(() =>
    satelliteSceneDetail
      ? satelliteSceneDetail.metadataRows.map((r) => ({ ...r }))
      : metadataRowsWithOptionalName(initialDataName),
  );
  const [isServicesExpanded, setIsServicesExpanded] = useState(false);
  const [mapStyle, setMapStyle] = useState<'vector' | 'satellite'>('vector');
  const [previewMapZoom, setPreviewMapZoom] = useState(DATA_PREVIEW_DEFAULT_ZOOM);
  const [previewMapLat, setPreviewMapLat] = useState(DATA_PREVIEW_DEFAULT_CENTER[0]);
  const [previewMapLng, setPreviewMapLng] = useState(DATA_PREVIEW_DEFAULT_CENTER[1]);
  const dataPreviewMapRef = useRef<L.Map | null>(null);
  const dataPreviewMapContainerRef = useRef<HTMLDivElement>(null);

  // Layer Management State
  const [isLayerPanelExpanded, setIsLayerPanelExpanded] = useState(true);
  const [checkedLayerIds, setCheckedLayerIds] = useState<Set<number>>(() =>
    satelliteSceneDetail ? new Set([1, 2, 3]) : new Set([1]),
  );

  const toggleLayerChecked = (id: number) => {
    setCheckedLayerIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const previewMapCenter = useMemo((): L.LatLngTuple => {
    if (satelliteSceneDetail) {
      const lat = parseFloat(satelliteSceneDetail.centerLat);
      const lng = parseFloat(satelliteSceneDetail.centerLon);
      if (!Number.isNaN(lat) && !Number.isNaN(lng)) return [lat, lng];
    }
    return DATA_PREVIEW_DEFAULT_CENTER;
  }, [satelliteSceneDetail?.sceneId, satelliteSceneDetail?.centerLat, satelliteSceneDetail?.centerLon]);

  const previewMapZoomLevel = satelliteSceneDetail ? 10 : DATA_PREVIEW_DEFAULT_ZOOM;

  // Cover Image State
  const [previewImage, setPreviewImage] = useState(() => {
    const fallback = "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/China_edcp_location_map.svg/1024px-China_edcp_location_map.svg.png";
    try {
      const cached = window.localStorage.getItem(DATA_DETAIL_COVER_STORAGE_KEY);
      return cached || fallback;
    } catch {
      return fallback;
    }
  });
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tags State（保存态）；编辑时使用 tagsDraft
  const [tags, setTags] = useState(() =>
    satelliteSceneDetail ? [...satelliteSceneDetail.tags] : [...INITIAL_DETAIL_TAGS],
  );
  const [tagsDraft, setTagsDraft] = useState<string[]>(() =>
    satelliteSceneDetail ? [...satelliteSceneDetail.tags] : [...INITIAL_DETAIL_TAGS],
  );
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false);
  const [tagInputValue, setTagInputValue] = useState("");

  /** 详情页顶部卡片：名称、说明、标签、级别、来源、版权声明、数据集市上架状态 */
  const buildOverviewState = () => {
    if (satelliteSceneDetail) {
      return {
        ...INITIAL_DETAIL_OVERVIEW,
        name: satelliteSceneDetail.name,
        description: satelliteSceneDetail.description,
        level: satelliteSceneDetail.level,
        source: satelliteSceneDetail.source,
        adminDivision: satelliteSceneDetail.adminDivision,
        themeNodeId: satelliteSceneDetail.themeNodeId,
        listingStatus: 'not_listed' as DetailListingStatus,
        collectTime: satelliteSceneDetail.collectTime,
        ingestTime: satelliteSceneDetail.ingestTime,
        updateTime: satelliteSceneDetail.updateTime,
      };
    }
    return {
      ...INITIAL_DETAIL_OVERVIEW,
      ...(initialListingStatus !== undefined ? { listingStatus: initialListingStatus } : {}),
      ...(initialDataName != null && String(initialDataName).trim() !== ''
        ? { name: String(initialDataName).trim() }
        : {}),
      ...(initialThemeNodeId != null &&
      DATA_THEME_BIND_OPTIONS.some((o) => o.id === initialThemeNodeId)
        ? { themeNodeId: initialThemeNodeId }
        : {}),
      ...(initialAdminDivision != null && String(initialAdminDivision).trim() !== ''
        ? { adminDivision: String(initialAdminDivision).trim() }
        : {}),
    };
  };

  const [overview, setOverview] = useState(buildOverviewState);
  const [overviewDraft, setOverviewDraft] = useState(buildOverviewState);
  const [detailEditMode, setDetailEditMode] = useState(false);
  /** 从「数据服务」进入服务详情全屏页 */
  const [openedServiceDetail, setOpenedServiceDetail] = useState<APIRow | null>(null);

  useEffect(() => {
    if (!allowDetailEdit) setDetailEditMode(false);
  }, [allowDetailEdit]);

  /** 元数据 AI：读取页面信息后生成建议值，确认后写入 metadataDraft */
  const [metadataAiOpen, setMetadataAiOpen] = useState(false);
  const [metadataAiBusy, setMetadataAiBusy] = useState(false);
  const [metadataAiSuggestion, setMetadataAiSuggestion] = useState<typeof INITIAL_METADATA_ROWS | null>(
    null,
  );
  const [metadataAiResult, setMetadataAiResult] = useState<MetadataAgentOutput | null>(null);
  const [metadataAiMessages, setMetadataAiMessages] = useState<
    { role: 'user' | 'assistant'; text: string }[]
  >([]);
  const [metadataAiChatInput, setMetadataAiChatInput] = useState('');

  const attributeTotalPages = useMemo(
    () => Math.max(1, Math.ceil(MOCK_ATTRIBUTE_TOTAL_COUNT / ATTRIBUTE_PAGE_SIZE)),
    [],
  );

  const { effectiveAttributePage, attributePageRecords, attributeRangeStart, attributeRangeEnd } =
    useMemo(() => {
      const ep = Math.min(Math.max(1, attributePage), attributeTotalPages);
      const start = (ep - 1) * ATTRIBUTE_PAGE_SIZE;
      const rows: Record<string, string>[] = [];
      for (let i = 0; i < ATTRIBUTE_PAGE_SIZE && start + i < MOCK_ATTRIBUTE_TOTAL_COUNT; i++) {
        rows.push(buildAttributeRecordAt(start + i));
      }
      const end = start + rows.length;
      return {
        effectiveAttributePage: ep,
        attributePageRecords: rows,
        attributeRangeStart: rows.length ? start + 1 : 0,
        attributeRangeEnd: end,
      };
    }, [attributePage, attributeTotalPages]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            const base64 = typeof reader.result === 'string' ? reader.result : '';
            if (base64) setTempImage(base64);
        };
        reader.readAsDataURL(file);
    }
  };

  const handleSaveCover = () => {
      if (tempImage) {
          setPreviewImage(tempImage);
          setTempImage(null);
      }
      setIsUploadModalOpen(false);
  };

  const handleCloseModal = () => {
      setTempImage(null);
      setIsUploadModalOpen(false);
  }

  const displayTags = detailEditMode ? tagsDraft : tags;

  // Tags Handlers（仅编辑态可增删）
  const handleAddCustomTag = () => {
    if (!detailEditMode) return;
    const val = tagInputValue.trim();
    if (val && !tagsDraft.includes(val)) {
      setTagsDraft((prev) => [...prev, val]);
      setTagInputValue("");
    }
  };

  const toggleTag = (tag: string) => {
    if (!detailEditMode) return;
    setTagsDraft((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  };

  const handleRemoveTag = (tagToRemove: string) => {
    if (!detailEditMode) return;
    setTagsDraft((prev) => prev.filter((tag) => tag !== tagToRemove));
  };

  // Filter suggestions
  const filteredSuggestions = RECOMMENDED_TAGS.filter(t =>
    t.toLowerCase().includes(tagInputValue.toLowerCase()),
  );

  const tagOverflowCount =
    displayTags.length > TAG_PREVIEW_LIMIT ? displayTags.length - TAG_PREVIEW_LIMIT : 0;
  const displayedTags = tagsExpanded ? displayTags : displayTags.slice(0, TAG_PREVIEW_LIMIT);
  const tagAreaScrollable = tagsExpanded && displayTags.length > TAG_PREVIEW_LIMIT;

  const handleStartDetailEdit = () => {
    if (!allowDetailEdit) return;
    setOverviewDraft({ ...overview });
    setTagsDraft([...tags]);
    setMetadataDraft(metadataRows.map((r) => ({ ...r })));
    setDetailEditMode(true);
  };

  const handleCancelDetailEdit = () => {
    setDetailEditMode(false);
    setIsTagPopoverOpen(false);
    setTagInputValue("");
    setMetadataDraft(metadataRows.map((r) => ({ ...r })));
    setMetadataAiOpen(false);
    setMetadataAiSuggestion(null);
    setMetadataAiResult(null);
    setMetadataAiMessages([]);
    setMetadataAiChatInput('');
    setMetadataAiBusy(false);
  };

  const handleSaveDetailEdit = () => {
    setOverview(overviewDraft);
    setTags([...tagsDraft]);
    setMetadataRows(metadataDraft.map((r) => ({ ...r })));
    setDetailEditMode(false);
    setIsTagPopoverOpen(false);
    setTagInputValue("");
    setMetadataAiOpen(false);
    setMetadataAiSuggestion(null);
    setMetadataAiResult(null);
    setMetadataAiMessages([]);
    setMetadataAiChatInput('');
    setMetadataAiBusy(false);
  };

  const handleBackClick = () => {
    if (detailEditMode) {
      handleCancelDetailEdit();
    }
    onBack();
  };

  // Check if current temp image is the service thumbnail
  const isServiceThumbnail = tempImage === SERVICE_THUMBNAIL_URL;

  useEffect(() => {
    try {
      window.localStorage.setItem(DATA_DETAIL_COVER_STORAGE_KEY, previewImage);
    } catch {
      // ignore storage errors
    }
  }, [previewImage]);

  useEffect(() => {
    if (!satelliteSceneDetail) return;
    setCheckedLayerIds(new Set([1, 2, 3]));
    setMapStyle('satellite');
    const lat = parseFloat(satelliteSceneDetail.centerLat);
    const lng = parseFloat(satelliteSceneDetail.centerLon);
    if (!Number.isNaN(lat) && !Number.isNaN(lng)) {
      setPreviewMapLat(lat);
      setPreviewMapLng(lng);
    }
  }, [satelliteSceneDetail?.sceneId]);

  /** 数据预览：OSM 电子地图（vector）/ 影像瓦片（satellite） */
  useEffect(() => {
    const destroyMap = () => {
      if (dataPreviewMapRef.current) {
        dataPreviewMapRef.current.remove();
        dataPreviewMapRef.current = null;
      }
    };

    destroyMap();

    if (activeTab !== 'preview' || !dataPreviewMapContainerRef.current) {
      return undefined;
    }

    const container = dataPreviewMapContainerRef.current;
    const map = L.map(container, {
      zoomControl: false,
      attributionControl: true,
    }).setView(previewMapCenter, previewMapZoomLevel);

    const osmRaster = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      maxZoom: 19,
      subdomains: 'abc',
    });

    const satelliteRaster = L.tileLayer(
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      {
        attribution:
          'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
        maxZoom: 19,
      },
    );

    (mapStyle === 'vector' ? osmRaster : satelliteRaster).addTo(map);
    dataPreviewMapRef.current = map;

    const syncFromMap = () => {
      const c = map.getCenter();
      setPreviewMapZoom(map.getZoom());
      setPreviewMapLat(c.lat);
      setPreviewMapLng(c.lng);
    };
    map.on('zoomend moveend', syncFromMap);
    syncFromMap();

    const fitTimer = window.setTimeout(() => {
      map.invalidateSize();
      syncFromMap();
    }, 120);

    return () => {
      clearTimeout(fitTimer);
      destroyMap();
    };
  }, [activeTab, mapStyle, previewMapCenter, previewMapZoomLevel]);

  /** 预览区随容器尺寸变化重算地图大小 */
  useEffect(() => {
    if (activeTab !== 'preview' || !dataPreviewMapContainerRef.current) return undefined;
    const el = dataPreviewMapContainerRef.current;
    const ro = new ResizeObserver(() => {
      dataPreviewMapRef.current?.invalidateSize();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [activeTab]);

  /** 与顶部「编辑」联动：编辑态下改「值」列写入 metadataDraft，保存时写入 metadataRows */
  const metadataDisplayRows = detailEditMode ? metadataDraft : metadataRows;

  const updateMetadataDraftValue = (key: string, value: string) => {
    if (!detailEditMode) return;
    setMetadataDraft((prev) => prev.map((r) => (r.key === key ? { ...r, value } : r)));
  };

  const openMetadataAiDialog = () => {
    if (!detailEditMode) return;
    setMetadataAiOpen(true);
    setMetadataAiBusy(true);
    setMetadataAiSuggestion(null);
    setMetadataAiResult(null);
    setMetadataAiMessages([
      {
        role: 'assistant',
        text:
          '我是元数据生成智能体。正在读取数据名称、说明、标签、格式、数据级别、时间、来源、行政区划、DDL 与样例值…',
      },
    ]);
    window.setTimeout(() => {
      const output = runMetadataGenerationAgent({
        overview: {
          name: overviewDraft.name,
          description: overviewDraft.description,
          level: overviewDraft.level,
          source: overviewDraft.source,
          copyright: overviewDraft.copyright,
          adminDivision: overviewDraft.adminDivision,
          themePath: themePathByNodeId(overviewDraft.themeNodeId),
          listingStatus: String(overviewDraft.listingStatus),
          dataFormat: 'Vector Point',
          dataSize: '368.87 MB',
          collectTime: overviewDraft.collectTime,
          ingestTime: overviewDraft.ingestTime,
          updateTime: overviewDraft.updateTime,
        },
        tags: tagsDraft,
        ddlFields: ATTRIBUTE_FIELD_DEFS,
        sampleRecords: attributePageRecords.slice(0, 6),
        existingRows: metadataDraft.map((r) => ({ ...r })),
      });
      const suggestion = metadataRowsFromAgentOutput(output);
      setMetadataAiResult(output);
      setMetadataAiSuggestion(suggestion);
      setMetadataAiBusy(false);
      const unc =
        output.uncertainty.notes.length > 0
          ? ` 注意：${output.uncertainty.notes.join(' ')}`
          : '';
      const sens =
        output.sensitiveFields.length > 0
          ? ` 已标记 ${output.sensitiveFields.length} 项敏感相关字段。`
          : '';
      setMetadataAiMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: `已依据页面信息与 DDL 生成元数据建议（符合 JSON Schema）。${sens}${unc} 请预览后点击「导入到表单」或发送「确认导入」。`,
        },
      ]);
    }, 550);
  };

  const applyMetadataAiSuggestion = () => {
    if (!metadataAiSuggestion) return;
    setMetadataDraft(metadataAiSuggestion.map((r) => ({ ...r })));
    setMetadataAiOpen(false);
    setMetadataAiSuggestion(null);
    setMetadataAiResult(null);
    setMetadataAiMessages([]);
    setMetadataAiChatInput('');
    setMetadataAiBusy(false);
  };

  const handleMetadataAiChatSend = () => {
    const t = metadataAiChatInput.trim();
    if (!t) return;
    setMetadataAiMessages((prev) => [...prev, { role: 'user', text: t }]);
    setMetadataAiChatInput('');
    if (/确认|导入|应用/.test(t)) {
      if (metadataAiSuggestion) {
        setMetadataDraft(metadataAiSuggestion.map((r) => ({ ...r })));
        setMetadataAiOpen(false);
        setMetadataAiSuggestion(null);
        setMetadataAiResult(null);
        setMetadataAiMessages([]);
        setMetadataAiBusy(false);
      } else {
        setMetadataAiMessages((prev) => [
          ...prev,
          { role: 'assistant', text: '请等待生成完成后再确认导入。' },
        ]);
      }
      return;
    }
    if (/DDL|ddl|敏感|不确定|uncertainty/i.test(t)) {
      if (metadataAiResult) {
        const ddlPreview = buildDdlFromFieldDefs(ATTRIBUTE_FIELD_DEFS).slice(0, 280);
        const sens = metadataAiResult.sensitiveFields
          .map((s) => `${s.field}→${s.level}(${s.category})`)
          .join('；') || '无';
        const unc = metadataAiResult.uncertainty.notes.join('；') || '无';
        setMetadataAiMessages((prev) => [
          ...prev,
          {
            role: 'assistant',
            text: `DDL 摘要：${ddlPreview}…\n敏感字段：${sens}\n不确定项：${unc}`,
          },
        ]);
      }
      return;
    }
    setMetadataAiMessages((prev) => [
      ...prev,
      {
        role: 'assistant',
        text: '可发送「确认导入」写入表单；或询问「DDL」「敏感字段」「不确定项」查看依据。',
      },
    ]);
  };

  const tabs = [
    { id: 'attributes', label: '数据表', icon: <Table size={14} /> },
    { id: 'service', label: '数据服务', icon: <Share2 size={14} /> },
    { id: 'metadata', label: '元数据信息', icon: <Info size={14} /> },
    { id: 'preview', label: '数据预览', icon: <Map size={14} /> },
    { id: 'copyright', label: '版权声明', icon: <ShieldCheck size={14} /> },
  ];

  /** 同一数据可发布多个服务：名称、协议、坐标系可按服务不同；数据类型、服务类型对本数据下全部服务一致 */
  const sharedServiceDataType = 'tiff';
  const sharedServiceTypeLabel = '时空服务';

  /** 与服务协议一一对应：每种协议可有独立接口地址 */
  const services: {
    id: number;
    name: string;
    endpoints: { protocol: string; url: string }[];
    dataType: string;
    serviceType: string;
    ref: string;
  }[] = [
    {
        id: 1,
        name: "湖北省10米卫星图服务",
        endpoints: [
          {
            protocol: "WMS",
            url: "http://10.20.16.1:32700/geoserver/ods/wms?service=WMS&version=1.1.0&request=GetMap&layers=ods%3Axzgdtbtc2024&bbox=114.52774631999996,29.861799322858857,115.16938871670895,30.32678251533883&width=768&height=610&srs=EPSG:4326&format=image%2Fpng",
          },
          {
            protocol: "WMTS",
            url: "http://10.20.16.1:32700/geoserver/ods/gwc/service/wmts?SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0&LAYER=ods:xzgdtbtc2024&STYLE=&TILEMATRIXSET=EPSG:4326&TILEMATRIX=EPSG:4326:{z}&TILEROW={y}&TILECOL={x}&FORMAT=image/png",
          },
          {
            protocol: "TMS",
            url: "https://api.spatial-data.com/v1/services/yehan_1216002/tms/EPSG4326/{z}/{x}/{y}.png",
          },
        ],
        dataType: sharedServiceDataType,
        serviceType: sharedServiceTypeLabel,
        ref: "GCS_WGS_1984"
    },
    {
        id: 2,
        name: "人口密度分布图层",
        endpoints: [
          {
            protocol: "WFS",
            url: "https://api.spatial-data.com/v1/services/yehan_1216002/wfs?service=WFS&version=2.0.0&request=GetFeature&typeName=pop_density&outputFormat=application/json",
          },
          {
            protocol: "GeoJSON",
            url: "https://api.spatial-data.com/v1/services/yehan_1216002/collections/pop_density/items.geojson",
          },
        ],
        dataType: sharedServiceDataType,
        serviceType: sharedServiceTypeLabel,
        ref: "Web Mercator"
    },
    {
        id: 3,
        name: "基础路网矢量瓦片",
        endpoints: [
          {
            protocol: "XYZ",
            url: "https://tiles.example.com/roads/{z}/{x}/{y}",
          },
          {
            protocol: "PBF",
            url: "https://vector.example.com/v1/tiles.pbf?layer=roads&token=demo",
          },
        ],
        dataType: sharedServiceDataType,
        serviceType: sharedServiceTypeLabel,
        ref: "GCS_WGS_1984"
    }
  ];

  const layerPanelItems = useMemo(() => {
    if (satelliteSceneDetail?.previewLayers?.length) {
      return satelliteSceneDetail.previewLayers.map((layer) => ({
        id: layer.id,
        name: layer.name,
        endpoints: layer.endpoints,
      }));
    }
    return services.map((s) => ({
      id: s.id,
      name: s.name,
      endpoints: s.endpoints,
    }));
  }, [satelliteSceneDetail, services]);

  if (openedServiceDetail) {
    return (
      <ServiceDetailView
        api={openedServiceDetail}
        onBack={() => setOpenedServiceDetail(null)}
        showSql={false}
      />
    );
  }

  return (
    <div className="relative flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-white animate-fadeIn">
      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-[450px] border border-slate-200 overflow-hidden transform transition-all scale-100">
                <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100">
                    <h3 className="font-bold text-base text-slate-800">更换数据封面</h3>
                    <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-full transition-colors">
                        <X size={18} />
                    </button>
                </div>
                
                <div className="p-6">
                    {!tempImage ? (
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 h-48 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm">
                                <Upload size={20} className="text-blue-600" />
                            </div>
                            <span className="text-sm font-medium text-slate-600">点击上传图片</span>
                            <span className="text-xs text-slate-400 mt-1">支持 JPG, PNG, SVG 格式</span>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                    ) : (
                        <div className="relative group rounded-xl overflow-hidden h-48 border border-slate-200 bg-slate-100">
                            <img src={tempImage} alt="Preview" className="w-full h-full object-cover" />
                            {/* Only show re-select button if it's NOT the service thumbnail (i.e. it's a user uploaded image) */}
                            {!isServiceThumbnail && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="bg-white/20 backdrop-blur text-white border border-white/40 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-white hover:text-slate-900 transition-all"
                                    >
                                        重新选择
                                    </button>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button 
                        className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 rounded-lg transition-colors shadow-sm flex items-center gap-2 mr-auto"
                        onClick={() => {
                            if (isServiceThumbnail) {
                                // If currently showing Service Thumbnail, switch to Upload Mode (null)
                                setTempImage(null);
                            } else {
                                // If currently in Upload Mode (null) or Custom Image, switch to Service Thumbnail
                                setTempImage(SERVICE_THUMBNAIL_URL);
                            }
                        }}
                    >
                        {isServiceThumbnail ? <Upload size={14} /> : <RefreshCw size={14} />}
                        {isServiceThumbnail ? "上传封面" : "切换服务缩略图"}
                    </button>
                    
                    <button 
                        onClick={handleCloseModal}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors"
                    >
                        取消
                    </button>
                    <button 
                        onClick={handleSaveCover}
                        disabled={!tempImage}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-all flex items-center gap-2 ${tempImage ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-slate-300 cursor-not-allowed'}`}
                    >
                        <CheckCircle2 size={14} />
                        提交
                    </button>
                </div>
            </div>
        </div>
      )}

      {metadataAiOpen && (
        <div className="absolute inset-0 z-[60] flex items-center justify-center bg-slate-900/45 p-4 animate-fadeIn backdrop-blur-[2px]">
          <button
            type="button"
            className="absolute inset-0"
            aria-label="关闭对话框"
            onClick={() => {
              setMetadataAiOpen(false);
              setMetadataAiSuggestion(null);
              setMetadataAiResult(null);
              setMetadataAiMessages([]);
              setMetadataAiChatInput('');
              setMetadataAiBusy(false);
            }}
          />
          <div
            className="relative flex max-h-[90vh] w-full max-w-lg flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="metadata-ai-title"
          >
            <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="shrink-0 text-violet-600" size={18} strokeWidth={2.25} />
                  <h3 id="metadata-ai-title" className="text-[15px] font-bold text-slate-800">
                    元数据生成智能体
                  </h3>
                </div>
                <p className="mt-0.5 pl-7 text-[11px] text-slate-500">
                  依据页面卡片、DDL 与样例值生成，不凭空编造
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setMetadataAiOpen(false);
                  setMetadataAiSuggestion(null);
                  setMetadataAiResult(null);
                  setMetadataAiMessages([]);
                  setMetadataAiChatInput('');
                  setMetadataAiBusy(false);
                }}
                className="rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
              >
                <X size={18} />
              </button>
            </div>
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
              <div className="custom-scrollbar max-h-[min(40vh,220px)] space-y-2 overflow-y-auto px-5 py-3 text-[13px] leading-relaxed">
                {metadataAiMessages.map((m, i) => (
                  <div
                    key={`${m.role}-${i}`}
                    className={`rounded-lg px-3 py-2 ${
                      m.role === 'user'
                        ? 'ml-6 bg-blue-50 text-slate-800'
                        : 'mr-6 bg-slate-100 text-slate-700'
                    }`}
                  >
                    {m.text}
                  </div>
                ))}
                {metadataAiBusy ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <LoaderCircle className="animate-spin" size={14} />
                    正在生成建议值…
                  </div>
                ) : null}
              </div>
              {metadataAiResult && metadataAiSuggestion && !metadataAiBusy ? (
                <div className="shrink-0 border-t border-slate-100 px-5 py-3 space-y-2">
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
                    生成预览（JSON Schema）
                  </div>
                  <p className="text-[11px] leading-snug text-slate-600">{metadataAiResult.sourceSummary}</p>
                  {metadataAiResult.sensitiveFields.length > 0 ? (
                    <div className="rounded-lg border border-amber-200 bg-amber-50/80 px-2.5 py-2 text-[11px] text-amber-900">
                      <span className="font-semibold">敏感字段：</span>
                      {metadataAiResult.sensitiveFields
                        .map((s) => `${s.field}(${s.category}/${s.level})`)
                        .join(' · ')}
                    </div>
                  ) : null}
                  {metadataAiResult.uncertainty.notes.length > 0 ? (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-[11px] text-slate-600">
                      <span className="font-semibold text-slate-700">不确定项：</span>
                      {metadataAiResult.uncertainty.notes.join(' ')}
                    </div>
                  ) : null}
                  <div className="custom-scrollbar max-h-[min(28vh,180px)] overflow-y-auto rounded-lg border border-slate-100 bg-slate-50/90 text-[11px]">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-400">
                          <th className="px-2 py-1 font-medium">项</th>
                          <th className="px-2 py-1 font-medium">值</th>
                          <th className="px-2 py-1 font-medium">置信</th>
                        </tr>
                      </thead>
                      <tbody>
                        {metadataAiResult.fields.map((r) => (
                          <tr key={r.key} className="border-b border-slate-100 last:border-0">
                            <td className="whitespace-nowrap px-2 py-1.5 text-slate-500">{r.cn}</td>
                            <td
                              className="max-w-[min(42vw,200px)] truncate px-2 py-1.5 font-medium text-slate-800"
                              title={r.uncertainty ? `${r.value}\n⚠ ${r.uncertainty}` : r.value}
                            >
                              {r.value}
                              {r.uncertainty ? (
                                <span className="ml-1 text-amber-600" title={r.uncertainty}>
                                  ⚠
                                </span>
                              ) : null}
                            </td>
                            <td className="whitespace-nowrap px-2 py-1.5 text-[10px] text-slate-500">
                              {r.confidence}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : null}
              <div className="flex shrink-0 gap-2 border-t border-slate-100 px-5 py-3">
                <input
                  type="text"
                  value={metadataAiChatInput}
                  onChange={(e) => setMetadataAiChatInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleMetadataAiChatSend();
                  }}
                  placeholder="确认导入 / 询问 DDL、敏感字段、不确定项"
                  className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-[13px] outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-100"
                />
                <button
                  type="button"
                  onClick={handleMetadataAiChatSend}
                  className="shrink-0 rounded-lg bg-violet-600 px-3 py-2 text-white transition-colors hover:bg-violet-700"
                  title="发送"
                >
                  <Send size={16} />
                </button>
              </div>
              <div className="flex shrink-0 justify-end gap-2 border-t border-slate-100 bg-slate-50/90 px-5 py-3">
                <button
                  type="button"
                  onClick={() => {
                    setMetadataAiOpen(false);
                    setMetadataAiSuggestion(null);
                    setMetadataAiResult(null);
                    setMetadataAiMessages([]);
                    setMetadataAiChatInput('');
                    setMetadataAiBusy(false);
                  }}
                  className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-50"
                >
                  关闭
                </button>
                <button
                  type="button"
                  disabled={!metadataAiSuggestion || metadataAiBusy}
                  onClick={applyMetadataAiSuggestion}
                  className="rounded-lg bg-blue-600 px-4 py-2 text-[13px] font-medium text-white shadow-sm transition-colors hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  导入到表单
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header Title Area */}
      <div className="flex justify-between items-center px-6 py-3 border-b border-slate-100/50 flex-shrink-0">
        <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                 <Layers size={16} />
            </div>
            <h2 className="text-base font-bold text-slate-800">
              {isSatelliteScene ? '卫星数据详情' : '数据详情'}
            </h2>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleBackClick}
            className="group flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all shadow-sm"
          >
            <Undo2 size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>返回列表</span>
          </button>
          {allowDetailEdit ? (
            !detailEditMode ? (
              <button
                type="button"
                onClick={handleStartDetailEdit}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-all shadow-sm shadow-blue-100"
              >
                <Edit2 size={14} />
                编辑
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={handleCancelDetailEdit}
                  className="px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:bg-slate-50 transition-all shadow-sm"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleSaveDetailEdit}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 transition-all shadow-sm"
                >
                  <Save size={14} />
                  保存
                </button>
              </>
            )
          ) : null}
          <div className="ml-1 flex items-center gap-1 border-l border-slate-200 pl-2">
            <button
              type="button"
              className="rounded-lg border border-slate-200 p-2 text-slate-400 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-500"
              title="收藏"
            >
              <Heart size={16} />
            </button>
            {allowDownload ? (
              <button
                type="button"
                className="rounded-lg border border-slate-200 p-2 text-slate-400 transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600"
                title="下载数据"
              >
                <Download size={16} />
              </button>
            ) : null}
          </div>
        </div>
      </div>

      {/* Main Content：概览固定高度，Tab 区占满剩余视口 */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden bg-slate-50/30">
        <div className="flex min-h-0 flex-1 flex-col gap-5 p-5">
            
            {/* Top Section: Overview Card */}
            <div className="flex shrink-0 gap-6 rounded-xl border border-slate-200/60 bg-white p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
                 {/* Thumbnail with mock metadata */}
                 <div className="w-[280px] h-[200px] bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 relative group shadow-inner">
                    <img 
                        src={previewImage}
                        alt="Map Preview" 
                        className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/55 via-slate-800/10 to-transparent pointer-events-none" />
                    {(() => {
                      const ls = detailEditMode ? overviewDraft.listingStatus : overview.listingStatus;
                      const listed = ls === 'listed';
                      return (
                        <span
                          className={`pointer-events-none absolute top-2 right-2 z-10 shrink-0 rounded border px-2 py-0.5 text-[10px] font-semibold tracking-tight backdrop-blur-md shadow-sm ${
                            listed
                              ? 'border-emerald-200/70 bg-emerald-600/90 text-white'
                              : 'border-white/25 bg-slate-900/70 text-white'
                          }`}
                        >
                          {listed ? '已上架' : '未上架'}
                        </span>
                      );
                    })()}

                    {allowDetailEdit ? (
                      <button
                        type="button"
                        onClick={() => setIsUploadModalOpen(true)}
                        className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1.5 rounded-lg hover:bg-blue-600 transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 shadow-lg border border-white/10 z-20 flex items-center gap-1.5"
                      >
                        <Camera size={14} />
                        <span className="text-xs font-medium">更换封面</span>
                      </button>
                    ) : null}
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="mb-3 flex items-start">
                        <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-3 mb-1.5">
                                {detailEditMode ? (
                                  <input
                                    type="text"
                                    value={overviewDraft.name}
                                    onChange={(e) =>
                                      setOverviewDraft((d) => ({ ...d, name: e.target.value }))
                                    }
                                    className="min-w-0 flex-1 max-w-xl rounded-md border border-blue-200 bg-white px-2.5 py-1 text-base font-bold text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                  />
                                ) : (
                                  <h1
                                    className="min-w-0 flex-1 truncate text-base font-bold text-slate-800 tracking-tight"
                                    title={overview.name}
                                  >
                                    {overview.name}
                                  </h1>
                                )}
                                {detailEditMode && (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      setOverviewDraft((d) => ({
                                        ...d,
                                        listingStatus: d.listingStatus === 'listed' ? 'not_listed' : 'listed',
                                      }))
                                    }
                                    className="shrink-0 rounded-md border border-slate-200 bg-white px-2 py-0.5 text-[11px] font-medium text-slate-600 shadow-sm transition-colors hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                                  >
                                    {overviewDraft.listingStatus === 'listed'
                                      ? '从数据集市下架'
                                      : '上架到数据集市'}
                                  </button>
                                )}
                            </div>
                            {detailEditMode ? (
                              <textarea
                                value={overviewDraft.description}
                                onChange={(e) =>
                                  setOverviewDraft((d) => ({ ...d, description: e.target.value }))
                                }
                                rows={3}
                                className="mt-1 w-full max-w-2xl resize-y rounded-md border border-slate-200 bg-white px-2.5 py-2 text-sm text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 leading-relaxed"
                                placeholder="数据说明"
                              />
                            ) : (
                              <p
                                className="max-w-2xl text-sm leading-relaxed text-slate-500 line-clamp-2"
                                title={overview.description}
                              >
                                {overview.description}
                              </p>
                            )}
                            
                            {/* 标签与「更多」同一 flex-wrap，优先铺满横向空间 */}
                            <div className="relative z-20 mt-3 mb-4 w-full min-w-0">
                                <div
                                  className={`
                                    flex w-full min-w-0 flex-wrap items-center gap-x-2 gap-y-2
                                    ${tagAreaScrollable ? 'max-h-[7.25rem] overflow-y-auto rounded-lg border border-slate-100 bg-slate-50/50 p-2 custom-scrollbar' : ''}
                                  `}
                                >
                                  {displayedTags.map((tag, idx) => (
                                    <div
                                      key={`${tag}-${idx}`}
                                      className={`group relative flex shrink-0 items-center rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-xs text-slate-600 transition-all hover:border-slate-300 hover:bg-slate-200 ${
                                        detailEditMode ? '' : 'cursor-default'
                                      }`}
                                    >
                                      <span className="text-xs font-medium">{tag}</span>
                                      {detailEditMode && (
                                        <button
                                          type="button"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleRemoveTag(tag);
                                          }}
                                          className="ml-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                                          title="移除标签"
                                        >
                                          <X size={10} strokeWidth={3} />
                                        </button>
                                      )}
                                    </div>
                                  ))}

                                  {!tagsExpanded && tagOverflowCount > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => setTagsExpanded(true)}
                                      className="shrink-0 rounded-full border border-dashed border-blue-300 bg-blue-50/80 px-2.5 py-0.5 text-xs font-medium text-blue-600 transition-colors hover:border-blue-400 hover:bg-blue-100"
                                    >
                                      +{tagOverflowCount} 更多
                                    </button>
                                  )}
                                  {tagsExpanded && tagOverflowCount > 0 && (
                                    <button
                                      type="button"
                                      onClick={() => setTagsExpanded(false)}
                                      className="shrink-0 rounded-full border border-slate-200 bg-white px-2.5 py-0.5 text-xs font-medium text-slate-600 transition-colors hover:border-slate-300 hover:bg-slate-50"
                                    >
                                      收起
                                    </button>
                                  )}

                                <div className="relative shrink-0">
                                    {detailEditMode && (
                                      <>
                                    <button 
                                        type="button"
                                        onClick={() => setIsTagPopoverOpen(!isTagPopoverOpen)}
                                        className={`px-2 py-0.5 text-xs border border-dashed rounded-full flex items-center gap-1 transition-all ${isTagPopoverOpen ? 'border-blue-500 bg-blue-50 text-blue-600' : 'text-blue-600 border-blue-300 hover:border-blue-500 hover:bg-blue-50 opacity-70 hover:opacity-100'}`}
                                    >
                                        <Plus size={10} strokeWidth={3} />
                                        <span className="font-medium text-xs">添加</span>
                                    </button>

                                    {/* Tag Popover */}
                                    {isTagPopoverOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setIsTagPopoverOpen(false)}></div>
                                            <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-left ring-1 ring-slate-900/5">
                                                <div className="relative mb-3">
                                                    <input 
                                                        type="text" 
                                                        className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all bg-slate-50 focus:bg-white"
                                                        placeholder="输入新标签按回车..."
                                                        autoFocus
                                                        value={tagInputValue}
                                                        onChange={(e) => setTagInputValue(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleAddCustomTag();
                                                            if (e.key === 'Escape') setIsTagPopoverOpen(false);
                                                        }}
                                                    />
                                                    <Tag size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                </div>
                                                
                                                <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">推荐标签</div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {filteredSuggestions.map(tag => {
                                                            const isSelected = tagsDraft.includes(tag);
                                                            return (
                                                                <button 
                                                                    key={tag}
                                                                    onClick={() => toggleTag(tag)}
                                                                    className={`
                                                                        group flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all
                                                                        ${isSelected 
                                                                            ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' 
                                                                            : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200 hover:bg-slate-50 hover:text-blue-600'}
                                                                    `}
                                                                >
                                                                    {isSelected && <Check size={10} strokeWidth={3} />}
                                                                    {tag}
                                                                </button>
                                                            )
                                                        })}
                                                        {filteredSuggestions.length === 0 && (
                                                            <div className="w-full text-center py-4 text-xs text-slate-400">
                                                                没有匹配的推荐标签
                                                                {tagInputValue && (
                                                                    <div className="mt-1 text-blue-600 cursor-pointer hover:underline" onClick={handleAddCustomTag}>
                                                                        按回车添加 "{tagInputValue}"
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                      </>
                                    )}
                                </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="bg-slate-50/50 rounded-lg border border-slate-100 p-3 grid grid-cols-3 gap-y-3 gap-x-8 text-xs mb-4">
                        <InfoItem
                          label="数据格式"
                          value={isSatelliteScene ? '栅格影像（卫星 L1A）' : 'Vector Point'}
                        />
                        <InfoItem label="数据量" value="368.87 MB" highlight />
                        {detailEditMode ? (
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-slate-400 text-xs whitespace-nowrap">数据级别:</span>
                            <select
                              value={overviewDraft.level}
                              onChange={(e) =>
                                setOverviewDraft((d) => ({ ...d, level: e.target.value }))
                              }
                              className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            >
                              {DATA_LEVEL_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <InfoItem label="数据级别" value={overview.level} />
                        )}
                        <InfoItem label="采集时间" value={overview.collectTime} />
                        <InfoItem label="入库时间" value={overview.ingestTime} />
                        <InfoItem label="更新时间" value={overview.updateTime} />
                        {detailEditMode ? (
                          <div className="flex items-start gap-2 min-w-0 col-span-1">
                            <span className="text-slate-400 text-xs whitespace-nowrap pt-1.5">数据来源:</span>
                            <input
                              type="text"
                              value={overviewDraft.source}
                              onChange={(e) =>
                                setOverviewDraft((d) => ({ ...d, source: e.target.value }))
                              }
                              className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            />
                          </div>
                        ) : (
                          <InfoItem label="数据来源" value={overview.source} />
                        )}
                        {detailEditMode ? (
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-slate-400 text-xs whitespace-nowrap">行政区划:</span>
                            <input
                              type="text"
                              value={overviewDraft.adminDivision}
                              onChange={(e) =>
                                setOverviewDraft((d) => ({
                                  ...d,
                                  adminDivision: e.target.value,
                                }))
                              }
                              className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                              placeholder="例如：湖北省 / 武汉市"
                            />
                          </div>
                        ) : (
                          <InfoItem label="行政区划" value={overview.adminDivision} />
                        )}
                        {detailEditMode ? (
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-slate-400 text-xs whitespace-nowrap">数据主题:</span>
                            <select
                              value={overviewDraft.themeNodeId}
                              onChange={(e) =>
                                setOverviewDraft((d) => ({
                                  ...d,
                                  themeNodeId: e.target.value,
                                }))
                              }
                              className="min-w-0 flex-1 rounded-md border border-slate-200 bg-white px-2 py-1 text-xs font-medium text-slate-700 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                            >
                              {DATA_THEME_BIND_OPTIONS.map((o) => (
                                <option key={o.id} value={o.id}>
                                  {o.path}
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <InfoItem
                            label="数据主题"
                            value={themePathByNodeId(overview.themeNodeId)}
                          />
                        )}
                    </div>
                </div>
            </div>

            {/* Bottom Section: Tabs & Detailed Info */}
            <div className="flex min-h-0 flex-1 flex-col rounded-xl border border-slate-200/60 bg-white shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
                {/* Tabs Header */}
                 <div className="flex shrink-0 items-center gap-6 border-b border-slate-100 px-4 pt-2">
                    {tabs.map(tab => (
                        <DetailTab 
                            key={tab.id}
                            label={tab.label} 
                            icon={tab.icon} 
                            active={activeTab === tab.id}
                            onClick={() => setActiveTab(tab.id)}
                        />
                    ))}
                </div>

                {/* Tab Content Area */}
                <div
                  className={`flex min-h-0 flex-1 flex-col ${
                    activeTab === 'preview'
                      ? 'overflow-hidden'
                      : 'overflow-y-auto p-6 custom-scrollbar'
                  }`}
                >
                    {activeTab === 'attributes' && hideDataTable && (
                        <div className="animate-fadeIn flex min-h-[420px] flex-1 flex-col items-center justify-center rounded-xl border border-dashed border-slate-200 bg-slate-50/80 px-8 py-16 text-center">
                          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                            <Satellite size={32} strokeWidth={1.5} />
                          </div>
                          <h3 className="text-base font-bold text-slate-700">暂无数据表</h3>
                          <p className="mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                            本产品为卫星栅格景数据（L1A 影像包），不包含矢量要素属性表。可在「元数据信息」查看卫星与产品参数，在「数据预览」浏览影像范围。
                          </p>
                        </div>
                    )}

                    {activeTab === 'attributes' && !hideDataTable && (
                        <div className="animate-fadeIn flex w-full min-h-[420px] flex-1 flex-col">
                            <div className="mb-3 flex w-full min-w-0 flex-wrap items-center justify-between gap-x-3 gap-y-2">
                                <div
                                    className="inline-flex shrink-0 rounded-md bg-slate-100 p-0.5 ring-1 ring-slate-200/60"
                                    role="tablist"
                                >
                                    <button
                                        type="button"
                                        role="tab"
                                        aria-selected={attributesSubTab === 'records'}
                                        onClick={() => setAttributesSubTab('records')}
                                        className={`flex items-center gap-1.5 whitespace-nowrap rounded-[5px] px-2.5 py-1 text-xs font-medium transition-all ${
                                            attributesSubTab === 'records'
                                                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/70'
                                                : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        <span>数据记录</span>
                                        {attributesSubTab === 'records' ? (
                                            <span className="rounded-full bg-blue-50 px-1.5 py-px text-[10px] font-semibold leading-none text-blue-600 tabular-nums">
                                                {MOCK_ATTRIBUTE_TOTAL_COUNT.toLocaleString()}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-medium tabular-nums text-slate-400">
                                                {MOCK_ATTRIBUTE_TOTAL_COUNT.toLocaleString()}
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        type="button"
                                        role="tab"
                                        aria-selected={attributesSubTab === 'schema'}
                                        onClick={() => setAttributesSubTab('schema')}
                                        className={`flex items-center gap-1.5 whitespace-nowrap rounded-[5px] px-2.5 py-1 text-xs font-medium transition-all ${
                                            attributesSubTab === 'schema'
                                                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-slate-200/70'
                                                : 'text-slate-500 hover:text-slate-700'
                                        }`}
                                    >
                                        <span>字段定义</span>
                                        {attributesSubTab === 'schema' ? (
                                            <span className="rounded-full bg-blue-50 px-1.5 py-px text-[10px] font-semibold leading-none text-blue-600 tabular-nums">
                                                {ATTRIBUTE_FIELD_DEFS.length}
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-medium tabular-nums text-slate-400">
                                                {ATTRIBUTE_FIELD_DEFS.length}
                                            </span>
                                        )}
                                    </button>
                                </div>
                                {attributesSubTab === 'records' && (
                                    <p className="max-w-full min-w-0 shrink text-right text-xs leading-relaxed text-slate-400">
                                        共 {MOCK_ATTRIBUTE_TOTAL_COUNT.toLocaleString()} 条 · 每页 {ATTRIBUTE_PAGE_SIZE}{' '}
                                        条 · 横向滚动可查看全部字段
                                    </p>
                                )}
                            </div>

                            {attributesSubTab === 'schema' && (
                                <div className="w-full">
                                    <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                        <table className="w-full text-sm text-left">
                                            <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200 text-sm uppercase tracking-wider">
                                                <tr>
                                                    <th className="px-4 py-2.5 font-semibold">字段名称</th>
                                                    <th className="px-4 py-2.5 font-semibold">类型</th>
                                                    <th className="px-4 py-2.5 font-semibold">长度</th>
                                                    <th className="px-4 py-2.5 font-semibold">描述</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {ATTRIBUTE_FIELD_DEFS.map((row) => (
                                                    <TableRow
                                                        key={row.name}
                                                        name={row.name}
                                                        type={row.type}
                                                        length={row.length}
                                                        desc={row.desc}
                                                    />
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {attributesSubTab === 'records' && (
                                <div className="flex min-h-0 flex-1 flex-col gap-3">
                                    <div className="min-h-0 flex-1 overflow-x-auto rounded-lg border border-slate-200 shadow-sm custom-scrollbar">
                                        <table className="min-w-[1400px] w-full text-left text-sm">
                                            <thead className="border-b border-slate-200 bg-slate-50 text-slate-500">
                                                <tr>
                                                    <th className="sticky left-0 z-20 whitespace-nowrap border-r border-slate-200 bg-slate-50 px-3 py-2.5 text-xs font-semibold text-slate-600">
                                                        #
                                                    </th>
                                                    {ATTRIBUTE_FIELD_DEFS.map((field) => (
                                                        <th
                                                            key={field.name}
                                                            className="whitespace-nowrap px-3 py-2.5 text-xs font-semibold uppercase tracking-wide"
                                                            title={field.desc}
                                                        >
                                                            <span className="font-mono text-slate-700">{field.name}</span>
                                                        </th>
                                                    ))}
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {attributePageRecords.map((rec, rowIdx) => {
                                                    const globalRank =
                                                        (effectiveAttributePage - 1) * ATTRIBUTE_PAGE_SIZE +
                                                        rowIdx +
                                                        1;
                                                    return (
                                                        <tr
                                                            key={`${effectiveAttributePage}-${rec.OBJECTID}-${rowIdx}`}
                                                            className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50/60'}
                                                        >
                                                            <td
                                                                className={`sticky left-0 z-10 whitespace-nowrap border-r border-slate-100 px-3 py-2 text-xs font-mono text-slate-500 ${
                                                                    rowIdx % 2 === 0 ? 'bg-white' : 'bg-slate-50'
                                                                }`}
                                                            >
                                                                {globalRank}
                                                            </td>
                                                            {ATTRIBUTE_FIELD_DEFS.map((field) => {
                                                                const v = rec[field.name] ?? '—';
                                                                return (
                                                                    <td
                                                                        key={field.name}
                                                                        className="max-w-[220px] whitespace-nowrap px-3 py-2 text-xs text-slate-700"
                                                                        title={v}
                                                                    >
                                                                        <span className="block truncate">{v}</span>
                                                                    </td>
                                                                );
                                                            })}
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>

                                    <div className="flex-shrink-0 border-t border-slate-100 pt-4">
                                        <PaginationBar
                                            total={MOCK_ATTRIBUTE_TOTAL_COUNT}
                                            page={effectiveAttributePage}
                                            pageSize={ATTRIBUTE_PAGE_SIZE}
                                            onPageChange={(p) => setAttributePage(p)}
                                            leftExtra={
                                                <span className="text-xs text-slate-500">
                                                    显示第 {attributeRangeStart.toLocaleString()}–
                                                    {attributeRangeEnd.toLocaleString()} 条
                                                </span>
                                            }
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'service' && (
                        <div className="space-y-4 animate-fadeIn">
                            {(isServicesExpanded ? services : services.slice(0, 2)).map((service, index) => (
                                <div key={service.id} className="bg-slate-50/50 rounded-lg border border-slate-100 p-5 hover:border-blue-200 transition-colors group relative">
                                    <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                                        <span className="text-4xl font-bold text-slate-400">0{index + 1}</span>
                                    </div>
                                    <div className="relative z-10 flex flex-col gap-5">
                                        
                                        {/* Top Row: Service Info in One Line (Grid) */}
                                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-6">
                                            <div className="flex flex-col gap-1 min-w-0">
                                                <span className="text-xs text-slate-400 font-medium ml-1">服务名称</span>
                                                <button
                                                    type="button"
                                                    onClick={() => setOpenedServiceDetail(serviceCardToApiRow(service))}
                                                    className="text-sm font-bold text-slate-700 ml-1 truncate text-left rounded px-0.5 -mx-0.5 outline-none transition-colors hover:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-400/60 focus-visible:text-blue-600"
                                                    title={`查看服务详情：${service.name}`}
                                                >
                                                    {service.name}
                                                </button>
                                            </div>
                                            
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs text-slate-400 font-medium ml-1">服务协议</span>
                                                <div className="flex flex-wrap gap-1.5">
                                                    {service.endpoints.map((ep) => (
                                                        <span key={ep.protocol} className="rounded border border-slate-200 bg-white px-2 py-0.5 text-xs font-bold text-slate-600">{ep.protocol}</span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs text-slate-400 font-medium ml-1">数据类型</span>
                                                <span className="text-sm font-medium text-slate-700 ml-1">{service.dataType}</span>
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs text-slate-400 font-medium ml-1">服务类型</span>
                                                <span className="text-sm font-medium text-slate-700 ml-1">{service.serviceType}</span>
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs text-slate-400 font-medium ml-1">坐标系</span>
                                                <span className="text-sm font-medium text-slate-700 ml-1">{service.ref}</span>
                                            </div>
                                        </div>

                                        {/* 服务接口地址：与上方协议一一对应，每种协议独立 URL */}
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-xs text-slate-400 font-medium ml-1">服务接口地址</span>
                                            <div className="flex flex-col gap-2">
                                                {service.endpoints.map((ep, epIdx) => (
                                                    <div
                                                        key={`${service.id}-${ep.protocol}`}
                                                        className={`rounded-lg px-3 py-2.5 transition-colors ${
                                                            epIdx % 2 === 0
                                                                ? "border border-blue-200 bg-white shadow-sm group-hover:border-blue-300"
                                                                : "border border-transparent bg-slate-100/80"
                                                        }`}
                                                    >
                                                        <div className="mb-1.5 flex items-center justify-between gap-2">
                                                            <span className="rounded-md bg-blue-50 px-2 py-0.5 text-[11px] font-bold text-blue-600 ring-1 ring-blue-100/80">
                                                                {ep.protocol}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    if (typeof navigator !== "undefined" && navigator.clipboard) {
                                                                        void navigator.clipboard.writeText(ep.url).catch(() => {});
                                                                    }
                                                                }}
                                                                className="shrink-0 rounded-md p-1.5 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600"
                                                                title="复制该协议地址"
                                                            >
                                                                <Copy size={14} />
                                                            </button>
                                                        </div>
                                                        <p className="break-all font-mono text-[11px] leading-relaxed text-slate-600">{ep.url}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {/* Bounding Box Row */}
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-xs text-slate-400 font-medium ml-1">图层预览范围 (Bounding Box)</span>
                                            <div className="grid grid-cols-4 gap-4 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                                <CoordinateBox label="Min X" value="112.936966" />
                                                <CoordinateBox label="Min Y" value="30.072807" />
                                                <CoordinateBox label="Max X" value="113.795578" />
                                                <CoordinateBox label="Max Y" value="30.532038" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {services.length > 2 && (
                                <div className="flex justify-center pt-2 pb-2">
                                    <button 
                                        onClick={() => setIsServicesExpanded(!isServicesExpanded)}
                                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium bg-blue-50 hover:bg-blue-100 px-5 py-2 rounded-full transition-all hover:shadow-sm"
                                    >
                                        {isServicesExpanded ? '收起更多服务' : `查看全部 ${services.length} 个服务`}
                                        <ChevronDown size={14} className={`transition-transform duration-300 ${isServicesExpanded ? 'rotate-180' : ''}`} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'metadata' && (
                         <div className="animate-fadeIn w-full space-y-3">
                            {detailEditMode ? (
                              <p className="text-xs text-slate-500">
                                编辑模式下可修改「值」列；完成后请点击顶部「保存」，或「取消」放弃全部修改。
                              </p>
                            ) : null}
                            <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200 text-sm uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-2.5 font-semibold w-1/4">英文缩写名 (EN_Name)</th>
                                            <th className="px-4 py-2.5 font-semibold w-1/4">数据项名称 (CN_Name)</th>
                                            <th className="px-4 py-2.5 font-semibold text-slate-600 normal-case tracking-normal">
                                              <div className="flex items-center justify-between gap-2">
                                                <span>值 (Value)</span>
                                                {detailEditMode ? (
                                                  <button
                                                    type="button"
                                                    onClick={openMetadataAiDialog}
                                                    className="inline-flex shrink-0 items-center gap-1 rounded-md border border-violet-200 bg-violet-50 px-2 py-1 text-[11px] font-semibold text-violet-700 transition-colors hover:bg-violet-100"
                                                  >
                                                    <Sparkles size={12} strokeWidth={2.25} />
                                                    元数据生成智能体
                                                  </button>
                                                ) : null}
                                              </div>
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {metadataDisplayRows.map((row) => (
                                          <tr key={row.key} className="hover:bg-slate-50/80 transition-colors">
                                            <td className="px-4 py-2 font-mono text-slate-600 text-sm font-medium align-top">{row.en}</td>
                                            <td className="px-4 py-2 text-slate-600 text-sm align-top">{row.cn}</td>
                                            <td className="px-4 py-2 align-top">
                                              {!detailEditMode ? (
                                                row.key === 'dataID' ? (
                                                  <button
                                                    type="button"
                                                    onClick={() =>
                                                      setOpenedServiceDetail(serviceCardToApiRow(services[0]))
                                                    }
                                                    className="max-w-full whitespace-pre-wrap break-words text-left text-sm font-medium text-slate-700 transition-colors hover:text-blue-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60 rounded px-0.5 -mx-0.5"
                                                    title="查看服务详情"
                                                  >
                                                    {row.value}
                                                  </button>
                                                ) : (
                                                  <div className="whitespace-pre-wrap break-words text-sm text-slate-700">
                                                    {row.value}
                                                  </div>
                                                )
                                              ) : row.key === 'abstract' ? (
                                                <textarea
                                                  value={row.value}
                                                  onChange={(e) => updateMetadataDraftValue(row.key, e.target.value)}
                                                  rows={3}
                                                  className="w-full min-h-[72px] resize-y rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 outline-none transition-shadow focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                />
                                              ) : (
                                                <input
                                                  type="text"
                                                  value={row.value}
                                                  onChange={(e) => updateMetadataDraftValue(row.key, e.target.value)}
                                                  className="w-full rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-sm text-slate-700 outline-none transition-shadow focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                                />
                                              )}
                                            </td>
                                          </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                         </div>
                    )}
                    
                    {activeTab === 'copyright' && (
                        <div className="animate-fadeIn w-full">
                            <div className="bg-slate-50/50 rounded-lg border border-slate-100 p-5 hover:border-blue-200 transition-colors group relative">
                                {detailEditMode ? (
                                  <textarea
                                    value={overviewDraft.copyright}
                                    onChange={(e) =>
                                      setOverviewDraft((d) => ({ ...d, copyright: e.target.value }))
                                    }
                                    rows={6}
                                    className="w-full resize-y rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 leading-relaxed outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                                    placeholder="版权声明"
                                  />
                                ) : (
                                  <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                                    {overview.copyright}
                                  </p>
                                )}
                            </div>
                        </div>
                    )}

                    {activeTab === 'preview' && (
                         <div className="group relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-lg border border-slate-200 bg-slate-100 animate-fadeIn">
                            {/* Layer Management - Top Left */}
                            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                                <div 
                                    className={`
                                        bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-lg shadow-lg ring-1 ring-slate-900/5 transition-all duration-300 overflow-hidden
                                        ${isLayerPanelExpanded ? (isSatelliteScene ? 'w-80 p-3' : 'w-64 p-3') : 'w-9 h-9 p-0 flex items-center justify-center cursor-pointer hover:bg-slate-50'}
                                    `}
                                    onClick={() => !isLayerPanelExpanded && setIsLayerPanelExpanded(true)}
                                    title={!isLayerPanelExpanded ? "展开图层管理" : ""}
                                >
                                    {isLayerPanelExpanded ? (
                                        <>
                                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                                                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                                                    <Layers size={12} className="text-blue-600"/>
                                                    图层管理
                                                </h4>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setIsLayerPanelExpanded(false); }}
                                                    className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-100 transition-colors"
                                                >
                                                    <PanelLeftClose size={14} />
                                                </button>
                                            </div>
                                            <div className="space-y-1.5 max-h-[240px] overflow-y-auto custom-scrollbar pr-1">
                                                {layerPanelItems.map((layer) => {
                                                    const isChecked = checkedLayerIds.has(layer.id);
                                                    return (
                                                    <div 
                                                        key={layer.id}
                                                        onClick={() => toggleLayerChecked(layer.id)}
                                                        className={`
                                                            flex items-center gap-2 p-2 rounded-md border text-left cursor-pointer transition-all duration-200 group/item
                                                            ${isChecked
                                                                ? 'bg-blue-50/80 border-blue-200 shadow-sm' 
                                                                : 'bg-transparent border-transparent hover:bg-slate-50 hover:border-slate-100 text-slate-500'}
                                                        `}
                                                    >
                                                        <input
                                                            type="checkbox"
                                                            checked={isChecked}
                                                            onChange={() => toggleLayerChecked(layer.id)}
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                                                            aria-label={`显示图层 ${layer.name}`}
                                                        />
                                                        <div className="flex-1 min-w-0">
                                                            {isSatelliteScene ? (
                                                              <p
                                                                className={`truncate text-xs font-bold leading-snug ${
                                                                  isChecked ? 'text-blue-800' : 'text-slate-600'
                                                                }`}
                                                                title={layer.name}
                                                              >
                                                                {layer.name}
                                                              </p>
                                                            ) : (
                                                              <button
                                                                type="button"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    const svc = services.find((s) => s.id === layer.id);
                                                                    if (svc) setOpenedServiceDetail(serviceCardToApiRow(svc));
                                                                }}
                                                                className={`w-full truncate rounded px-0.5 text-left text-xs font-bold outline-none transition-colors hover:text-blue-600 focus-visible:ring-2 focus-visible:ring-blue-400/60 focus-visible:text-blue-600 ${
                                                                    isChecked ? 'text-blue-800' : 'text-slate-600'
                                                                }`}
                                                                title={`查看服务详情：${layer.name}`}
                                                              >
                                                                {layer.name || `Service ${layer.id}`}
                                                              </button>
                                                            )}
                                                            {!isSatelliteScene && layer.endpoints.length > 0 ? (
                                                              <div className="mt-1 flex flex-wrap gap-1">
                                                                {layer.endpoints.map((ep) => (
                                                                    <span
                                                                        key={ep.protocol}
                                                                        className="rounded border border-slate-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-slate-600"
                                                                    >
                                                                        {ep.protocol}
                                                                    </span>
                                                                ))}
                                                              </div>
                                                            ) : null}
                                                        </div>
                                                    </div>
                                                    );
                                                })}
                                            </div>
                                        </>
                                    ) : (
                                        <PanelLeftOpen size={16} className="text-slate-500" />
                                    )}
                                </div>
                            </div>

                            {/* Map Controls - Right side (sync with spatial-search style) */}
                            <div className="absolute bottom-12 right-4 flex flex-col items-end gap-3 z-10">
                                <div className="flex flex-col gap-2">
                                    <button className="w-10 h-10 rounded-2xl border border-slate-200 bg-white/95 shadow-md text-slate-600 text-[11px] font-black">2D</button>
                                    <button
                                        type="button"
                                        onClick={() => setMapStyle(mapStyle === 'vector' ? 'satellite' : 'vector')}
                                        className="w-10 h-10 rounded-2xl border border-slate-200 bg-white/95 shadow-md text-slate-600 hover:text-blue-600 flex items-center justify-center"
                                        title="切换底图（OSM 电子地图 / 卫星影像）"
                                    >
                                        <Globe size={15} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() =>
                                        dataPreviewMapRef.current?.setView(previewMapCenter, previewMapZoomLevel)
                                      }
                                      className="w-10 h-10 rounded-2xl border border-slate-200 bg-white/95 shadow-md text-slate-600 hover:text-blue-600 flex items-center justify-center"
                                      title="地图复位"
                                    >
                                        <Undo2 size={15} />
                                    </button>
                                    <button className="w-10 h-10 rounded-2xl border border-slate-200 bg-white/95 shadow-md text-slate-600 hover:text-blue-600 flex items-center justify-center" title="全屏">
                                        <Map size={15} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => dataPreviewMapRef.current?.zoomIn()}
                                      className="w-10 h-10 rounded-2xl border border-slate-200 bg-white/95 shadow-md text-slate-600 hover:text-blue-600 flex items-center justify-center"
                                      title="放大"
                                    >
                                        <Plus size={15} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => dataPreviewMapRef.current?.zoomOut()}
                                      className="w-10 h-10 rounded-2xl border border-slate-200 bg-white/95 shadow-md text-slate-600 hover:text-blue-600 flex items-center justify-center"
                                      title="缩小"
                                    >
                                        <Minus size={15} />
                                    </button>
                                    <button className="w-10 h-10 rounded-2xl border border-slate-200 bg-white/95 shadow-md text-teal-600 hover:text-teal-700 flex items-center justify-center" title="图层">
                                        <Layers size={15} />
                                    </button>
                                </div>
                            </div>

                            {/* The Map Canvas — OSM 电子地图 / Esri 影像 */}
                            <div className="relative flex min-h-0 w-full flex-1 overflow-hidden bg-slate-100">
                                <div
                                  ref={dataPreviewMapContainerRef}
                                  className="absolute inset-0 z-0 h-full w-full [&_.leaflet-container]:h-full [&_.leaflet-container]:w-full [&_.leaflet-container]:bg-slate-100 [&_.leaflet-container]:outline-none [&_.leaflet-control-attribution]:max-w-[min(100%,420px)] [&_.leaflet-control-attribution]:truncate [&_.leaflet-control-attribution]:text-[10px]"
                                />

                                {/* Simulated Data Layer Visualization - Based on Active Layer */}
                                <div className="pointer-events-none absolute inset-0 z-[600] flex items-center justify-center">
                                    
                                    {/* Layer 1: Feature Server (Points) */}
                                    {checkedLayerIds.has(1) && (
                                        <>
                                            <div className="absolute top-[40%] left-[45%] w-32 h-32 bg-blue-500/10 rounded-full blur-[40px]"></div>
                                            <div className="absolute top-[42%] left-[48%] group/point pointer-events-auto cursor-pointer">
                                                <div className="w-3 h-3 bg-blue-600 rounded-full shadow-lg shadow-blue-500/50 border-2 border-white animate-pulse"></div>
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover/point:opacity-100 transition-opacity whitespace-nowrap">ID: 9013D</div>
                                            </div>
                                            <div className="absolute top-[38%] left-[52%]"><div className="w-2 h-2 bg-blue-500 rounded-full border border-white"></div></div>
                                            <div className="absolute top-[45%] left-[58%]"><div className="w-2 h-2 bg-blue-500 rounded-full border border-white"></div></div>
                                            <div className="absolute top-[55%] left-[45%]"><div className="w-2 h-2 bg-blue-500 rounded-full border border-white"></div></div>
                                            <div className="absolute top-[32%] left-[40%]"><div className="w-1.5 h-1.5 bg-blue-400 rounded-full opacity-60"></div></div>
                                        </>
                                    )}

                                    {/* Layer 2: Map Server (Heatmap/Overlay) */}
                                    {checkedLayerIds.has(2) && (
                                        <>
                                            <div className="absolute top-[45%] left-[50%] w-64 h-64 bg-gradient-to-r from-red-500/30 via-yellow-500/20 to-transparent rounded-full blur-[30px] mix-blend-multiply"></div>
                                            <div className="absolute top-[35%] left-[40%] w-48 h-48 bg-orange-500/20 rounded-full blur-[40px] mix-blend-multiply"></div>
                                            <div className="absolute top-[25%] left-[30%] px-3 py-1 bg-white/80 backdrop-blur rounded shadow text-[10px] text-slate-600 border border-slate-200">
                                                人口密度: High
                                            </div>
                                        </>
                                    )}

                                    {/* Layer 3: Vector Tiles (Grid/Lines) */}
                                    {checkedLayerIds.has(3) && (
                                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                                            <div className="absolute top-[30%] left-[30%] w-[40%] h-[1px] bg-blue-600 rotate-12"></div>
                                            <div className="absolute top-[60%] left-[20%] w-[50%] h-[1px] bg-blue-600 -rotate-6"></div>
                                        </div>
                                    )}
                                    
                                    {/* Selection Box Simulation (Common) */}
                                    <div className="absolute top-[35%] left-[42%] w-[20%] h-[25%] border-2 border-dashed border-slate-400/30 rounded-lg"></div>
                                </div>
                            </div>

                            {/* Bottom Status Bar */}
                            <div className="absolute bottom-0 left-0 right-0 h-9 bg-white/85 backdrop-blur-xl border-t border-slate-200/60 z-10 flex items-center px-4 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
                                <div className="flex-1 flex items-center divide-x divide-slate-200 h-5 text-xs">
                                    <div className="px-4 first:pl-0"><span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">层级:</span> <span className="text-blue-600 font-black ml-1">{previewMapZoom}</span></div>
                                    <div className="px-4"><span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">经度:</span> <span className="text-emerald-600 font-black ml-1">{previewMapLng.toFixed(6)}°E</span></div>
                                    <div className="px-4"><span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">纬度:</span> <span className="text-emerald-600 font-black ml-1">{previewMapLat.toFixed(6)}°N</span></div>
                                    <div className="px-4"><span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">高程:</span> <span className="text-amber-600 font-black ml-1">24.5 m</span></div>
                                    <div className="px-4"><span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">维度:</span> <span className="text-violet-600 font-black ml-1">2D</span></div>
                                    <div className="px-4"><span className="text-slate-400 font-black uppercase tracking-widest text-[10px]">底图:</span> <span className="text-slate-800 font-black ml-1">{mapStyle === 'satellite' ? '卫星影像 (Esri)' : 'OSM 电子地图'}</span></div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
    <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
        <div className="w-1 h-3.5 bg-blue-600 rounded-full"></div>
        {title}
    </h3>
)

const InfoItem: React.FC<{ label: string; value: string; highlight?: boolean; icon?: React.ReactNode }> = ({ label, value, highlight, icon }) => (
    <div className="flex min-w-0 items-center gap-2">
        <span className="flex shrink-0 items-center gap-1.5 whitespace-nowrap text-xs text-slate-400">
            {icon}
            {label}:
        </span>
        <span
            className={`min-w-0 truncate font-medium ${highlight ? 'font-bold text-slate-800' : 'text-slate-600'}`}
            title={value}
        >
            {value}
        </span>
    </div>
);

const DetailTab: React.FC<{ label: string; icon: React.ReactNode; active?: boolean; onClick?: () => void }> = ({ label, icon, active, onClick }) => (
    <div 
        onClick={onClick}
        className={`
        pb-3 border-b-2 text-sm font-medium cursor-pointer flex items-center gap-2 transition-colors
        ${active ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200'}
    `}>
        {icon}
        {label}
    </div>
);

const CoordinateBox: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex flex-col">
        <span className="text-[10px] text-slate-400 uppercase mb-0.5">{label}</span>
        <span className="text-xs font-mono text-slate-600 font-medium">{value}</span>
    </div>
);

const TableRow: React.FC<{ name: string; type: string; length: string; desc: string }> = ({ name, type, length, desc }) => (
     <tr className="hover:bg-slate-50 transition-colors">
        <td className="px-4 py-2 font-mono text-slate-600 text-sm font-medium">{name}</td>
        <td className="px-4 py-2 text-slate-600 text-sm">{type}</td>
        <td className="px-4 py-2 text-slate-400 text-sm">{length}</td>
        <td className="px-4 py-2 text-slate-500 text-sm">{desc}</td>
    </tr>
);
