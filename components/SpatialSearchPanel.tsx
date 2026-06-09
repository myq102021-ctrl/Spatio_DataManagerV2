import React, { useState, useEffect, useRef, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import shp from 'shpjs';
import { kml as kmlToGeoJSON } from '@tmcw/togeojson';
import { MiniBaseMapSwitcher } from './MiniBaseMapSwitcher';
import { 
    Search, 
    Calendar, 
    Square, 
    Pentagon, 
    Minus, 
    Circle, 
    RotateCcw, 
    Layers,
    Map as MapIcon,
    Database,
    Globe,
    Maximize,
    Minimize,
    Plus,
    PanelLeftClose,
    PanelLeftOpen,
    ChevronDown,
    ChevronUp,
    LoaderCircle,
    Upload,
    ArrowLeft,
    Heart,
    FilePlus2,
    Check,
    CheckSquare,
    Eye,
    EyeOff,
    LocateFixed,
    X,
    Info,
    Table
} from 'lucide-react';

type SpatialBaseMap = 'roadmap' | 'satellite' | 'terrain';
type OSMGeocodeItem = {
    placeId: number;
    displayName: string;
    lat: number;
    lon: number;
};
type OSMAdminOption = {
    relationId: number;
    name: string;
    adminLevel: '4' | '6' | '7' | '8';
};

type OverpassElement = {
    type: string;
    id: number;
    tags?: Record<string, string>;
    members?: Array<{
        type: string;
        role: string;
        geometry?: Array<{ lat: number; lon: number }>;
    }>;
};
type ParsedGeoJSON = GeoJSON.FeatureCollection<GeoJSON.Geometry, GeoJSON.GeoJsonProperties>;
type SatelliteGroup = { group: string; items: string[] };
type SearchResultItem = {
    id: string;
    title: string;
    acquiredAt: string;
    thumb: string;
    /** 类型：如 shp、影像、三维模型、业务表、视频 */
    categoryType: string;
    /** 格式：如 shp、geojson、tif、geotif、cogtif、kml、kmz */
    fileFormat: string;
    /** 已格式化的数据量，如 128.5 MB、2.40 GB */
    dataSizeLabel: string;
    /** 是否具备可定位的空间信息 */
    hasSpatialInfo: boolean;
    /** 空间表现类型：点或面；无空间信息时为 null */
    spatialShape: 'point' | 'polygon' | null;
    /** 是否具备可叠加到地图的影像预览 */
    hasSpatialPreview: boolean;
};

type ChartDetailRow = {
    id: number;
    name: string;
    value: number;
    status: 'Active' | 'Pending';
    category: 'A' | 'B' | 'C';
    time: string;
};

function formatDataSize(bytes: number): string {
    const gb = 1024 ** 3;
    const mb = 1024 ** 2;
    const kb = 1024;
    if (bytes >= gb) return `${(bytes / gb).toFixed(2)} GB`;
    if (bytes >= mb) return `${(bytes / mb).toFixed(1)} MB`;
    if (bytes >= kb) return `${Math.round(bytes / kb)} KB`;
    return `${bytes} B`;
}

type BandPlatformKey = 'sentinel2' | 'landsat89' | 'gf1' | 'zy3' | 'generic';

type SpectralBand = { id: string; tint: string };

const BAND_PLATFORM_CONFIG: Record<
    BandPlatformKey,
    { label: string; bands: SpectralBand[] }
> = {
    sentinel2: {
        label: 'Sentinel-2 MSI',
        bands: [
            { id: 'B01', tint: 'bg-violet-600' },
            { id: 'B02', tint: 'bg-sky-400' },
            { id: 'B03', tint: 'bg-emerald-400' },
            { id: 'B04', tint: 'bg-orange-500' },
            { id: 'B05', tint: 'bg-red-500' },
            { id: 'B06', tint: 'bg-red-700' },
            { id: 'B07', tint: 'bg-red-600' },
            { id: 'B08', tint: 'bg-red-600' },
            { id: 'B8A', tint: 'bg-rose-700' },
            { id: 'B09', tint: 'bg-red-900' },
            { id: 'B11', tint: 'bg-fuchsia-700' },
            { id: 'B12', tint: 'bg-rose-950' },
        ],
    },
    landsat89: {
        label: 'Landsat 8/9 OLI',
        bands: [
            { id: 'B1', tint: 'bg-violet-500' },
            { id: 'B2', tint: 'bg-sky-400' },
            { id: 'B3', tint: 'bg-emerald-400' },
            { id: 'B4', tint: 'bg-orange-500' },
            { id: 'B5', tint: 'bg-red-500' },
            { id: 'B6', tint: 'bg-red-700' },
            { id: 'B7', tint: 'bg-red-800' },
            { id: 'B8', tint: 'bg-slate-500' },
            { id: 'B9', tint: 'bg-slate-600' },
            { id: 'B10', tint: 'bg-amber-700' },
            { id: 'B11', tint: 'bg-fuchsia-800' },
        ],
    },
    gf1: {
        label: '高分一号 PMS',
        bands: [
            { id: 'B1', tint: 'bg-sky-400' },
            { id: 'B2', tint: 'bg-emerald-400' },
            { id: 'B3', tint: 'bg-orange-500' },
            { id: 'B4', tint: 'bg-red-500' },
            { id: 'PAN', tint: 'bg-slate-600' },
        ],
    },
    zy3: {
        label: '资源三号 MUX',
        bands: [
            { id: 'B1', tint: 'bg-sky-400' },
            { id: 'B2', tint: 'bg-emerald-400' },
            { id: 'B3', tint: 'bg-orange-500' },
            { id: 'B4', tint: 'bg-red-500' },
        ],
    },
    generic: {
        label: '多光谱',
        bands: [
            { id: 'B1', tint: 'bg-sky-400' },
            { id: 'B2', tint: 'bg-emerald-400' },
            { id: 'B3', tint: 'bg-orange-500' },
            { id: 'B4', tint: 'bg-red-500' },
        ],
    },
};

function resolveBandPlatformFromTitle(title: string): BandPlatformKey {
    const u = title.toUpperCase();
    if (u.includes('SENTINEL')) return 'sentinel2';
    if (u.includes('LANDSAT') || u.includes('LC08') || u.includes('LC09')) return 'landsat89';
    if (u.startsWith('GF') || u.includes('_GF') || u.includes('GF')) return 'gf1';
    if (u.includes('ZY') || u.includes('MUX') || u.includes('PMS')) return 'zy3';
    return 'generic';
}

function buildChartRowsByItem(item: SearchResultItem | null): ChartDetailRow[] {
    const seed = Number((item?.id ?? 'r1').replace(/\D/g, '')) || 1;
    return Array.from({ length: 50 }, (_, i) => {
        const idx = i + 1;
        const raw = (seed * 97 + idx * 131) % 1000;
        const categorySeed = (seed + idx) % 3;
        return {
            id: idx,
            name: `${item?.title ?? 'DATA Item'}_${String(idx).padStart(2, '0')}`,
            value: raw,
            status: idx % 2 === 0 ? 'Active' : 'Pending',
            category: categorySeed === 0 ? 'A' : categorySeed === 1 ? 'B' : 'C',
            time: item?.acquiredAt ?? '2026-04-30',
        };
    });
}

function defaultRgbForPlatform(key: BandPlatformKey): { R: string; G: string; B: string } {
    if (key === 'sentinel2') return { R: 'B08', G: 'B02', B: 'B03' };
    if (key === 'landsat89') return { R: 'B5', G: 'B3', B: 'B2' };
    if (key === 'gf1') return { R: 'B4', G: 'B2', B: 'B1' };
    if (key === 'zy3') return { R: 'B4', G: 'B2', B: 'B1' };
    return { R: 'B4', G: 'B2', B: 'B1' };
}

type BandSynthPresetRow = {
    id: string;
    name: string;
    desc: string;
    thumbClass: string;
    isCustom?: boolean;
};

const BAND_SYNTH_PRESETS_CN: BandSynthPresetRow[] = [
    { id: 'truecolor', name: '真彩色', desc: '基于波段 B4、B3、B2 合成', thumbClass: 'bg-gradient-to-br from-emerald-600/80 to-amber-800/80' },
    { id: 'falsecolor', name: '假彩色', desc: '基于波段 B8、B4、B3 合成', thumbClass: 'bg-gradient-to-br from-rose-500 to-red-800' },
    { id: 'enhanced', name: '增强自然色', desc: '增强自然色可视化', thumbClass: 'bg-gradient-to-br from-lime-600 to-emerald-900' },
    { id: 'ndvi', name: '归一化植被指数 (NDVI)', desc: '基于 (B8 − B4) / (B8 + B4)', thumbClass: 'bg-gradient-to-br from-green-400 to-green-900' },
    { id: 'falsecolor_urban', name: '假彩色（城市）', desc: '基于波段 B12、B11、B4 合成', thumbClass: 'bg-gradient-to-br from-slate-500 to-slate-800' },
    { id: 'moisture', name: '水分指数', desc: '基于 (B8A − B11) / (B8A + B11)', thumbClass: 'bg-gradient-to-br from-cyan-400 via-amber-300 to-rose-500' },
    { id: 'swir', name: '短波红外', desc: '基于波段 B12、B8A、B4 合成', thumbClass: 'bg-gradient-to-br from-lime-400 to-green-700' },
    { id: 'ndwi', name: '归一化水体指数 (NDWI)', desc: '基于 (B3 − B8) / (B3 + B8)', thumbClass: 'bg-gradient-to-br from-sky-400 to-blue-900' },
    { id: 'ndsi', name: '归一化雪指数 (NDSI)', desc: '基于 (B3 − B11) / (B3 + B11)', thumbClass: 'bg-gradient-to-br from-cyan-200 to-stone-600' },
    { id: 'scene_cls', name: '场景分类图', desc: 'ESA 场景分类算法结果', thumbClass: 'bg-gradient-to-br from-green-500 via-yellow-400 to-red-500' },
    { id: 'custom', name: '自定义', desc: '拖放波段到 R / G / B 通道进行合成', thumbClass: 'bg-slate-700', isCustom: true },
];
const DEFAULT_CENTER: [number, number] = [30.5892, 114.3021];
const DEFAULT_ZOOM = 5;

const BASE_MAP_LABEL: Record<SpatialBaseMap, string> = {
    roadmap: '电子地图',
    satellite: '卫星影像',
    terrain: '高程晕渲',
};

const SATELLITE_GROUPS: SatelliteGroup[] = [
    { group: '高分系列', items: ['GF1', 'GF2', 'GF3', 'GF4', 'GF5', 'GF6', 'GF7'] },
    { group: '环境系列', items: ['HJ1A', 'HJ1B', 'HJ2A', 'HJ2B', 'CCD', 'HSI', 'IRS'] },
    { group: '空基系列', items: ['CM1', 'FIRE', 'DQ1', 'WSI'] },
    { group: '中巴系列', items: ['CB04A', 'CB04B', 'MUX', 'WFI', 'P5M'] },
    { group: '资源系列', items: ['ZY1F', 'ZY3', 'ZY02D', 'NAD', 'PMS', 'TMS'] },
];

const CATEGORY_TYPES = ['shp', '影像', '三维模型', '业务表', '视频'] as const;
const FILE_FORMATS = ['shp', 'geojson', 'tif', 'geotif', 'cogtif', 'kml', 'kmz'] as const;
const RESULT_PANEL_STATE_KEY = 'spatial-search-result-state-v1';

const MOCK_SEARCH_RESULTS: SearchResultItem[] = Array.from({ length: 50 }, (_, i) => {
    const idx = i + 1;
    const day = String(28 - (i % 10)).padStart(2, '0');
    const thumbs = [
        'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=120&q=60',
        'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=120&q=60',
        'https://images.unsplash.com/photo-1418065460487-3e41a6c84dc5?auto=format&fit=crop&w=120&q=60',
        'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=120&q=60',
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=120&q=60',
    ];
    const categoryType = CATEGORY_TYPES[i % CATEGORY_TYPES.length];
    const fileFormat = FILE_FORMATS[i % FILE_FORMATS.length];

    let title: string;
    switch (categoryType) {
        case '影像':
            title =
                i % 3 === 0
                    ? (idx % 3 === 0 ? 'GF5A_AHSI' : 'GF5A_WTI')
                    : i % 3 === 1
                        ? (idx % 2 === 0 ? 'ZY1F_PMS' : 'ZY3_MUX')
                        : (idx % 2 === 0 ? 'SENTINEL-2_MSI' : 'SENTINEL-1_SAR');
            break;
        case '业务表':
            title = `业务表格_人口统计_${String(idx).padStart(3, '0')}`;
            break;
        case 'shp':
            title = `矢量边界_${String(idx).padStart(3, '0')}`;
            break;
        case '三维模型':
            title = `城市精细模型_${String(idx).padStart(3, '0')}`;
            break;
        case '视频':
            title = `无人机巡检_${String(idx).padStart(3, '0')}`;
            break;
        default:
            title = `数据集_${idx}`;
    }

    // 混合 KB / MB / GB，随条目变化
    const sizeTier = (idx * 17 + i * 23) % 11;
    let bytes: number;
    if (sizeTier <= 3) {
        bytes = 64 * 1024 + (idx * 7919) % (900 * 1024); // ~64KB–1MB
    } else if (sizeTier <= 8) {
        const baseMb = Math.floor(0.5 * 1024 ** 2);
        const spanMb = 400 * 1024 ** 2;
        bytes = baseMb + (idx * 133_000) % spanMb;
    } else {
        const baseGb = Math.floor(0.85 * 1024 ** 3);
        const span = Math.floor(2.4 * 1024 ** 3);
        bytes = baseGb + (idx * 97_000_001) % span;
    }

    const hasSpatialInfo =
        categoryType === '业务表'
            ? idx % 2 === 0
            : categoryType === '影像' || categoryType === 'shp' || categoryType === '三维模型' || categoryType === '视频';
    const spatialShape: SearchResultItem['spatialShape'] =
        hasSpatialInfo ? (categoryType === '视频' || idx % 4 === 0 ? 'point' : 'polygon') : null;
    const hasSpatialPreview = hasSpatialInfo && (categoryType === '影像' || categoryType === '视频');

    return {
        id: `r${idx}`,
        title,
        acquiredAt: `2026-04-${day}`,
        thumb: thumbs[i % thumbs.length],
        categoryType,
        fileFormat,
        dataSizeLabel: formatDataSize(bytes),
        hasSpatialInfo,
        spatialShape,
        hasSpatialPreview,
    };
});

function createSpatialBaseLayer(kind: SpatialBaseMap): L.TileLayer {
    switch (kind) {
        case 'roadmap':
            return L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
                maxZoom: 19,
            });
        case 'satellite':
            return L.tileLayer(
                'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
                {
                    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
                    maxZoom: 19,
                }
            );
        case 'terrain':
            return L.tileLayer('https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png', {
                subdomains: ['a', 'b', 'c'],
                attribution:
                    'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)',
                maxZoom: 17,
            });
    }
}

async function fetchOverpassElements(query: string): Promise<OverpassElement[]> {
    const resp = await fetch('https://overpass-api.de/api/interpreter', {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=UTF-8' },
        body: query,
    });
    if (!resp.ok) throw new Error(`Overpass ${resp.status}`);
    const data = await resp.json() as { elements?: OverpassElement[] };
    return data.elements ?? [];
}

async function fetchAdminOptionsByParentRelation(
    parentRelationId: number,
    level: '4' | '6' | '8'
): Promise<OSMAdminOption[]> {
    const levelFilter = level === '8' ? '~"^(7|8)$"' : `"${level}"`;
    const query = `[out:json][timeout:35];
rel(${parentRelationId})->.parent;
map_to_area .parent -> .parentArea;
relation(area.parentArea)["boundary"="administrative"]["admin_level"${levelFilter}]["name"];
out ids tags;`;
    const rows = await fetchOverpassElements(query);
    const uniq = new Map<number, OSMAdminOption>();
    rows.forEach(r => {
        if (r.type !== 'relation' || !r.tags?.name) return;
        const rawLevel = r.tags?.admin_level;
        const adminLevel: OSMAdminOption['adminLevel'] =
            rawLevel === '7' || rawLevel === '8' ? rawLevel : level;
        uniq.set(r.id, { relationId: r.id, name: r.tags.name, adminLevel });
    });
    return [...uniq.values()].sort((a, b) => a.name.localeCompare(b.name, 'zh-Hans-CN'));
}

async function fetchRelationBoundary(relationId: number): Promise<OverpassElement | null> {
    const query = `[out:json][timeout:25];
relation(${relationId});
out geom;`;
    const rows = await fetchOverpassElements(query);
    return rows.find(r => r.type === 'relation' && r.id === relationId) ?? null;
}

type SpatialSearchPanelProps = {
    onOpenDataDetail?: (item: SearchResultItem) => void;
};

export const SpatialSearchPanel: React.FC<SpatialSearchPanelProps> = ({ onOpenDataDetail }) => {
    const [resultPanelEntryMode, setResultPanelEntryMode] = useState<'expanded' | 'collapsed'>('expanded');
    const [activeAreaTab, setActiveAreaTab] = useState('draw');
    const [whereSql, setWhereSql] = useState('');
    const [isSearchPanelCollapsed, setIsSearchPanelCollapsed] = useState(false);
    const [showResultPanel, setShowResultPanel] = useState(false);
    const [selectedResultIds, setSelectedResultIds] = useState<string[]>([]);
    const mapHintClearTimerRef = useRef<number | null>(null);
    const [hiddenResultIds, setHiddenResultIds] = useState<string[]>([]);
    const [hoveredResultId, setHoveredResultId] = useState<string | null>(null);
    const [resultPageSize, setResultPageSize] = useState(50);
    const [resultPage, setResultPage] = useState(1);
    const [bandSynthOpen, setBandSynthOpen] = useState(false);
    const [bandSynthView, setBandSynthView] = useState<'presets' | 'custom'>('presets');
    const [bandSynthContextItemId, setBandSynthContextItemId] = useState<string | null>(null);
    const [bandSynthSelectedPresetId, setBandSynthSelectedPresetId] = useState<string | null>(null);
    const [bandRgb, setBandRgb] = useState<{ R: string | null; G: string | null; B: string | null }>({
        R: null,
        G: null,
        B: null,
    });
    const [chartPanelOpen, setChartPanelOpen] = useState(false);
    const [chartItemId, setChartItemId] = useState<string | null>(null);
    const [chartPage, setChartPage] = useState(1);
    const [chartPageSize] = useState(10);
    const [globalSearchQuery, setGlobalSearchQuery] = useState('');
    const [isMoreFiltersOpen, setIsMoreFiltersOpen] = useState(true);
    const [cloudCoverage, setCloudCoverage] = useState(50);
    const [selectedSatelliteSources, setSelectedSatelliteSources] = useState<string[]>([]);
    const [satelliteSearch, setSatelliteSearch] = useState('');
    const [isSatellitePanelOpen, setIsSatellitePanelOpen] = useState(false);
    const [pendingSatelliteSources, setPendingSatelliteSources] = useState<string[]>([]);
    const [baseMap, setBaseMap] = useState<SpatialBaseMap>('roadmap');
    const [dimension, setDimension] = useState<'2D' | '3D'>('2D');
    const [currentZoom, setCurrentZoom] = useState(5);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [isMapTilesLoading, setIsMapTilesLoading] = useState(true);
    const [hasLoadedBaseLayer, setHasLoadedBaseLayer] = useState(false);
    const [mapLoadHint, setMapLoadHint] = useState('');
    const [locationQuery, setLocationQuery] = useState('');
    const [isSearchingLocation, setIsSearchingLocation] = useState(false);
    const [locationResults, setLocationResults] = useState<OSMGeocodeItem[]>([]);
    const [locationError, setLocationError] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [timeError, setTimeError] = useState('');
    const [topLeftLon, setTopLeftLon] = useState('');
    const [topLeftLat, setTopLeftLat] = useState('');
    const [bottomRightLon, setBottomRightLon] = useState('');
    const [bottomRightLat, setBottomRightLat] = useState('');
    const [uploadHint, setUploadHint] = useState('');
    const [isUploadingVector, setIsUploadingVector] = useState(false);
    const [uploadedVectorName, setUploadedVectorName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [provinceOptions, setProvinceOptions] = useState<OSMAdminOption[]>([]);
    const [cityOptions, setCityOptions] = useState<OSMAdminOption[]>([]);
    const [districtOptions, setDistrictOptions] = useState<OSMAdminOption[]>([]);
    const [selectedProvinceId, setSelectedProvinceId] = useState<number | ''>('');
    const [selectedCityId, setSelectedCityId] = useState<number | ''>('');
    const [selectedDistrictId, setSelectedDistrictId] = useState<number | ''>('');
    const [isAdminLoading, setIsAdminLoading] = useState(false);
    const [adminLoadError, setAdminLoadError] = useState('');
    const [pointerLonLat, setPointerLonLat] = useState({ lon: 114.3021, lat: 30.5892 });
    const mapShellRef = useRef<HTMLDivElement>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const activeTileRef = useRef<L.TileLayer | null>(null);
    const selectedMarkerRef = useRef<L.Marker | null>(null);
    const adminBoundaryLayerRef = useRef<L.LayerGroup | null>(null);
    const uploadedVectorLayerRef = useRef<L.GeoJSON | null>(null);
    const bboxLayerRef = useRef<L.Rectangle | null>(null);
    const resultFootprintLayerRef = useRef<L.FeatureGroup | null>(null);
    const resultFootprintByIdRef = useRef<Map<string, L.Polygon>>(new Map());
    /** 查询结果多选时，每条选中数据对应一组地图高亮 + 可选影像预览 */
    const selectionSpatialLayersRef = useRef<Map<string, { main: L.Layer; preview: L.ImageOverlay | null }>>(new Map());
    const footprintHoverLeaveTimerRef = useRef<number | null>(null);
    const resultListScrollRef = useRef<HTMLDivElement | null>(null);
    const resultListScrollTopRef = useRef(0);
    const shouldRestoreResultScrollRef = useRef(false);
    const hasHydratedResultStateRef = useRef(false);
    const layerSwitchTokenRef = useRef(0);
    const timeQuickRanges = [
        { label: '近一周', days: 7 },
        { label: '近一月', days: 30 },
        { label: '近三月', days: 90 },
        { label: '近半年', days: 180 },
        { label: '近一年', days: 365 },
    ];

    const onMapMouseMove = useCallback((e: L.LeafletMouseEvent) => {
        setPointerLonLat({ lon: e.latlng.lng, lat: e.latlng.lat });
    }, []);

    useEffect(() => {
        const el = mapContainerRef.current;
        if (!el) return;

        const map = L.map(el, {
            preferCanvas: true,
            fadeAnimation: false,
            zoomControl: false,
            attributionControl: true,
        }).setView(DEFAULT_CENTER, DEFAULT_ZOOM);

        mapRef.current = map;
        const onZoomEnd = () => setCurrentZoom(map.getZoom());
        map.on('mousemove', onMapMouseMove);
        map.on('zoomend', onZoomEnd);
        requestAnimationFrame(() => map.invalidateSize());

        return () => {
            map.off('mousemove', onMapMouseMove);
            map.off('zoomend', onZoomEnd);
            if (selectedMarkerRef.current) {
                selectedMarkerRef.current.remove();
                selectedMarkerRef.current = null;
            }
            if (adminBoundaryLayerRef.current) {
                adminBoundaryLayerRef.current.remove();
                adminBoundaryLayerRef.current = null;
            }
            if (uploadedVectorLayerRef.current) {
                uploadedVectorLayerRef.current.remove();
                uploadedVectorLayerRef.current = null;
            }
            if (bboxLayerRef.current) {
                bboxLayerRef.current.remove();
                bboxLayerRef.current = null;
            }
            if (resultFootprintLayerRef.current) {
                resultFootprintLayerRef.current.remove();
                resultFootprintLayerRef.current = null;
            }
            selectionSpatialLayersRef.current.forEach((entry) => {
                entry.main.remove();
                if (entry.preview) entry.preview.remove();
            });
            selectionSpatialLayersRef.current.clear();
            if (footprintHoverLeaveTimerRef.current !== null) {
                window.clearTimeout(footprintHoverLeaveTimerRef.current);
                footprintHoverLeaveTimerRef.current = null;
            }
            if (mapHintClearTimerRef.current !== null) {
                window.clearTimeout(mapHintClearTimerRef.current);
                mapHintClearTimerRef.current = null;
            }
            map.remove();
            mapRef.current = null;
            activeTileRef.current = null;
        };
    }, [onMapMouseMove]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        const prevLayer = activeTileRef.current;
        const nextLayer = createSpatialBaseLayer(baseMap);
        const token = ++layerSwitchTokenRef.current;
        let tileErrorCount = 0;
        let finalized = false;

        setIsMapTilesLoading(true);
        if (mapLoadHint) setMapLoadHint('');

        const cleanup = () => {
            nextLayer.off('load', onLoad);
            nextLayer.off('tileerror', onTileError);
        };

        const finalizeSwitch = () => {
            if (finalized || token !== layerSwitchTokenRef.current) return;
            finalized = true;
            cleanup();
            if (prevLayer && map.hasLayer(prevLayer)) {
                map.removeLayer(prevLayer);
            }
            activeTileRef.current = nextLayer;
            setIsMapTilesLoading(false);
            setHasLoadedBaseLayer(true);
        };

        const onLoad = () => {
            finalizeSwitch();
        };

        const onTileError = () => {
            tileErrorCount += 1;
            // 高程服务偶发超时，失败时自动回退电子底图，避免灰屏
            if (baseMap === 'terrain' && tileErrorCount >= 6) {
                setMapLoadHint('高程底图加载较慢，已自动切换电子地图');
                setBaseMap('roadmap');
            }
            if (baseMap === 'satellite' && tileErrorCount >= 8) {
                setMapLoadHint('卫星底图加载较慢，已自动切换电子地图');
                setBaseMap('roadmap');
            }
        };

        nextLayer.on('load', onLoad);
        nextLayer.on('tileerror', onTileError);
        nextLayer.addTo(map);

        // 防止部分服务首屏长时间不触发 load 导致“灰屏感”
        const fallbackTimer = window.setTimeout(() => {
            finalizeSwitch();
        }, 1200);

        return () => {
            window.clearTimeout(fallbackTimer);
            cleanup();
            if (token === layerSwitchTokenRef.current && nextLayer !== activeTileRef.current && map.hasLayer(nextLayer)) {
                map.removeLayer(nextLayer);
            }
        };
    }, [baseMap]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        const rafId = window.requestAnimationFrame(() => map.invalidateSize());
        const timer = window.setTimeout(() => map.invalidateSize(), 180);
        return () => {
            window.cancelAnimationFrame(rafId);
            window.clearTimeout(timer);
        };
    }, [isSearchPanelCollapsed]);

    useEffect(() => {
        const onFullscreenChange = () => {
            setIsFullscreen(Boolean(document.fullscreenElement));
            mapRef.current?.invalidateSize();
        };
        document.addEventListener('fullscreenchange', onFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
    }, []);

    useEffect(() => {
        const onResize = () => mapRef.current?.invalidateSize();
        window.addEventListener('resize', onResize);
        return () => window.removeEventListener('resize', onResize);
    }, []);

    const handleZoomIn = () => {
        mapRef.current?.zoomIn();
    };

    const handleZoomOut = () => {
        mapRef.current?.zoomOut();
    };

    const toggleFullscreen = async () => {
        const shell = mapShellRef.current;
        if (!shell) return;
        try {
            if (!document.fullscreenElement) {
                await shell.requestFullscreen();
            } else {
                await document.exitFullscreen();
            }
        } catch {
            // ignore browser fullscreen errors in mock panel
        }
    };

    const focusLocationResult = useCallback((item: OSMGeocodeItem) => {
        const map = mapRef.current;
        if (!map) return;
        const latlng = L.latLng(item.lat, item.lon);
        map.flyTo(latlng, Math.max(currentZoom, 14), { duration: 0.7 });
        if (selectedMarkerRef.current) {
            selectedMarkerRef.current.remove();
        }
        selectedMarkerRef.current = L.marker(latlng).addTo(map).bindPopup(item.displayName).openPopup();
        setPointerLonLat({ lon: item.lon, lat: item.lat });
    }, [currentZoom]);

    const handleLocationSearch = useCallback(async (rawQuery: string) => {
        const q = rawQuery.trim();
        if (!q) {
            setLocationResults([]);
            setLocationError('');
            return;
        }
        setIsSearchingLocation(true);
        setLocationError('');
        try {
            const resp = await fetch(
                `https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=20&q=${encodeURIComponent(q)}`,
                { headers: { 'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8' } }
            );
            if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
            const rows = (await resp.json()) as Array<{ place_id: number; display_name: string; lat: string; lon: string }>;
            const parsed: OSMGeocodeItem[] = rows
                .map(r => ({
                    placeId: r.place_id,
                    displayName: r.display_name,
                    lat: Number(r.lat),
                    lon: Number(r.lon),
                }))
                .filter(r => Number.isFinite(r.lat) && Number.isFinite(r.lon));
            setLocationResults(parsed);
            if (parsed.length === 0) setLocationError('未找到匹配位置');
        } catch {
            setLocationError('位置检索失败，请稍后重试');
            setLocationResults([]);
        } finally {
            setIsSearchingLocation(false);
        }
    }, []);

    useEffect(() => {
        const q = locationQuery.trim();
        if (!q) {
            setLocationResults([]);
            setLocationError('');
            setIsSearchingLocation(false);
            return;
        }
        const timer = window.setTimeout(() => {
            void handleLocationSearch(q);
        }, 300);
        return () => window.clearTimeout(timer);
    }, [locationQuery, handleLocationSearch]);

    const clearAdminBoundary = useCallback(() => {
        if (adminBoundaryLayerRef.current) {
            adminBoundaryLayerRef.current.remove();
            adminBoundaryLayerRef.current = null;
        }
    }, []);

    const renderAdminBoundary = useCallback(async (relationId: number) => {
        const map = mapRef.current;
        if (!map) return;
        setAdminLoadError('');
        const relation = await fetchRelationBoundary(relationId);
        if (!relation?.members) {
            setAdminLoadError('未获取到行政区边界');
            return;
        }
        clearAdminBoundary();
        const layerGroup = L.featureGroup();
        relation.members.forEach(member => {
            if (member.type !== 'way' || member.role !== 'outer' || !member.geometry || member.geometry.length < 3) return;
            const latlngs = member.geometry.map(p => L.latLng(p.lat, p.lon));
            L.polygon(latlngs, {
                color: '#2563eb',
                weight: 2,
                fillColor: '#3b82f6',
                fillOpacity: 0.14,
            }).addTo(layerGroup);
        });
        layerGroup.addTo(map);
        adminBoundaryLayerRef.current = layerGroup;
        const bounds = layerGroup.getBounds();
        if (bounds.isValid()) {
            map.fitBounds(bounds.pad(0.08));
        } else {
            setAdminLoadError('行政区边界无有效坐标');
        }
    }, [clearAdminBoundary]);

    useEffect(() => {
        if (activeAreaTab !== 'admin' || provinceOptions.length > 0) return;
        const loadProvinces = async () => {
            setIsAdminLoading(true);
            setAdminLoadError('');
            try {
                const provinces = await fetchAdminOptionsByParentRelation(270056, '4'); // 中国 relation id
                setProvinceOptions(provinces);
            } catch {
                setAdminLoadError('行政区加载失败，请稍后重试');
            } finally {
                setIsAdminLoading(false);
            }
        };
        void loadProvinces();
    }, [activeAreaTab, provinceOptions.length]);

    const handleProvinceChange = async (value: string) => {
        const relationId = value ? Number(value) : '';
        setSelectedProvinceId(relationId);
        setSelectedCityId('');
        setSelectedDistrictId('');
        setCityOptions([]);
        setDistrictOptions([]);
        if (!relationId) {
            clearAdminBoundary();
            return;
        }
        setIsAdminLoading(true);
        try {
            await renderAdminBoundary(relationId);
            const cities = await fetchAdminOptionsByParentRelation(relationId, '6');
            setCityOptions(cities);
        } catch {
            setAdminLoadError('城市列表加载失败');
        } finally {
            setIsAdminLoading(false);
        }
    };

    const handleCityChange = async (value: string) => {
        const relationId = value ? Number(value) : '';
        setSelectedCityId(relationId);
        setSelectedDistrictId('');
        setDistrictOptions([]);
        if (!relationId) return;
        setIsAdminLoading(true);
        try {
            await renderAdminBoundary(relationId);
            const districts = await fetchAdminOptionsByParentRelation(relationId, '8');
            setDistrictOptions(districts);
        } catch {
            setAdminLoadError('区县列表加载失败');
        } finally {
            setIsAdminLoading(false);
        }
    };

    const handleDistrictChange = async (value: string) => {
        const relationId = value ? Number(value) : '';
        setSelectedDistrictId(relationId);
        if (!relationId) return;
        setIsAdminLoading(true);
        try {
            await renderAdminBoundary(relationId);
        } catch {
            setAdminLoadError('区县边界加载失败');
        } finally {
            setIsAdminLoading(false);
        }
    };

    const formatDateInput = (d: Date): string => {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    };

    const applyQuickRange = (days: number) => {
        const end = new Date();
        const start = new Date();
        start.setDate(end.getDate() - days);
        const s = formatDateInput(start);
        const e = formatDateInput(end);
        setStartDate(s);
        setEndDate(e);
        setTimeError('');
    };

    const handleTimeChange = (nextStart: string, nextEnd: string) => {
        setStartDate(nextStart);
        setEndDate(nextEnd);
        if (nextStart && nextEnd && new Date(nextStart).getTime() > new Date(nextEnd).getTime()) {
            setTimeError('开始时间不能晚于结束时间');
        } else {
            setTimeError('');
        }
    };

    const toggleSatelliteSource = (source: string) => {
        setPendingSatelliteSources(prev =>
            prev.includes(source) ? prev.filter(x => x !== source) : [...prev, source]
        );
    };

    const openSatellitePanel = () => {
        setPendingSatelliteSources(selectedSatelliteSources);
        setSatelliteSearch('');
        setIsSatellitePanelOpen(true);
    };

    const confirmSatelliteSelection = () => {
        setSelectedSatelliteSources(pendingSatelliteSources);
        setIsSatellitePanelOpen(false);
    };

    const handleLocateByCoords = () => {
        const map = mapRef.current;
        if (!map) return;
        const aLon = Number(topLeftLon);
        const aLat = Number(topLeftLat);
        const bLon = Number(bottomRightLon);
        const bLat = Number(bottomRightLat);
        if (![aLon, aLat, bLon, bLat].every(Number.isFinite)) {
            setAdminLoadError('经纬度输入不完整或格式错误');
            return;
        }
        setAdminLoadError('');
        const north = Math.max(aLat, bLat);
        const south = Math.min(aLat, bLat);
        const east = Math.max(aLon, bLon);
        const west = Math.min(aLon, bLon);
        const bounds = L.latLngBounds([south, west], [north, east]);
        if (!bounds.isValid()) {
            setAdminLoadError('经纬度范围无效');
            return;
        }
        if (bboxLayerRef.current) {
            bboxLayerRef.current.remove();
        }
        bboxLayerRef.current = L.rectangle(bounds, {
            color: '#2563eb',
            weight: 2,
            fillColor: '#60a5fa',
            fillOpacity: 0.1,
            dashArray: '6,4',
        }).addTo(map);
        map.fitBounds(bounds.pad(0.12));
    };

    const clearUploadedVectorLayer = useCallback(() => {
        if (uploadedVectorLayerRef.current) {
            uploadedVectorLayerRef.current.remove();
            uploadedVectorLayerRef.current = null;
        }
    }, []);

    const clearResultFootprints = useCallback(() => {
        if (resultFootprintLayerRef.current) {
            resultFootprintLayerRef.current.remove();
            resultFootprintLayerRef.current = null;
        }
        if (footprintHoverLeaveTimerRef.current !== null) {
            window.clearTimeout(footprintHoverLeaveTimerRef.current);
            footprintHoverLeaveTimerRef.current = null;
        }
        resultFootprintByIdRef.current.clear();
    }, []);

    const clearFocusedSpatialView = useCallback(() => {
        selectionSpatialLayersRef.current.forEach((entry) => {
            entry.main.remove();
            if (entry.preview) entry.preview.remove();
        });
        selectionSpatialLayersRef.current.clear();
    }, []);

    const removeSelectionSpatialLayer = useCallback((id: string) => {
        const entry = selectionSpatialLayersRef.current.get(id);
        if (!entry) return;
        entry.main.remove();
        if (entry.preview) entry.preview.remove();
        selectionSpatialLayersRef.current.delete(id);
    }, []);

    const rotateLatLng = useCallback((lat: number, lng: number, centerLat: number, centerLng: number, rad: number): L.LatLngExpression => {
        const dx = lng - centerLng;
        const dy = lat - centerLat;
        const x = dx * Math.cos(rad) - dy * Math.sin(rad);
        const y = dx * Math.sin(rad) + dy * Math.cos(rad);
        return [centerLat + y, centerLng + x];
    }, []);

    const setFootprintNormalStyle = useCallback((poly: L.Polygon) => {
        poly.setStyle({
            color: '#4a7df4',
            weight: 1.4,
            opacity: 0.96,
            fillColor: '#6aa3ff',
            fillOpacity: 0.1,
        });
    }, []);

    const setFootprintHighlightStyle = useCallback((poly: L.Polygon) => {
        poly.setStyle({
            color: '#ff9f2f',
            weight: 2.8,
            opacity: 1,
            fillColor: '#ffb86b',
            fillOpacity: 0.24,
        });
    }, []);

    const persistResultPanelState = useCallback(() => {
        try {
            const payload = {
                showResultPanel,
                resultPanelEntryMode,
                selectedResultIds,
                hiddenResultIds,
                resultPageSize,
                resultPage,
                resultListScrollTop: resultListScrollTopRef.current,
            };
            window.sessionStorage.setItem(RESULT_PANEL_STATE_KEY, JSON.stringify(payload));
        } catch {
            // ignore browser storage errors
        }
    }, [showResultPanel, resultPanelEntryMode, selectedResultIds, hiddenResultIds, resultPageSize, resultPage]);

    useEffect(() => {
        if (hasHydratedResultStateRef.current) return;
        hasHydratedResultStateRef.current = true;
        try {
            const raw = window.sessionStorage.getItem(RESULT_PANEL_STATE_KEY);
            if (!raw) return;
            const parsed = JSON.parse(raw) as {
                showResultPanel?: boolean;
                resultPanelEntryMode?: 'expanded' | 'collapsed';
                selectedResultIds?: string[];
                hiddenResultIds?: string[];
                resultPageSize?: number;
                resultPage?: number;
                resultListScrollTop?: number;
            };
            if (typeof parsed.showResultPanel === 'boolean') setShowResultPanel(parsed.showResultPanel);
            if (parsed.resultPanelEntryMode === 'expanded' || parsed.resultPanelEntryMode === 'collapsed') {
                setResultPanelEntryMode(parsed.resultPanelEntryMode);
            }
            if (Array.isArray(parsed.selectedResultIds)) setSelectedResultIds(parsed.selectedResultIds);
            if (Array.isArray(parsed.hiddenResultIds)) setHiddenResultIds(parsed.hiddenResultIds);
            if (typeof parsed.resultPageSize === 'number') setResultPageSize(parsed.resultPageSize);
            if (typeof parsed.resultPage === 'number') setResultPage(parsed.resultPage);
            if (typeof parsed.resultListScrollTop === 'number' && Number.isFinite(parsed.resultListScrollTop)) {
                resultListScrollTopRef.current = Math.max(0, parsed.resultListScrollTop);
                shouldRestoreResultScrollRef.current = true;
            }
        } catch {
            // ignore malformed cache
        }
    }, []);

    const normalizeToFeatureCollection = (raw: unknown): ParsedGeoJSON => {
        if (!raw || typeof raw !== 'object') throw new Error('空间文件内容为空');
        const obj = raw as Record<string, unknown>;
        if (obj.type === 'FeatureCollection' && Array.isArray(obj.features)) {
            return raw as ParsedGeoJSON;
        }
        if (obj.type === 'Feature' && obj.geometry) {
            return { type: 'FeatureCollection', features: [raw as GeoJSON.Feature] };
        }
        if (obj.type && Array.isArray(raw as unknown[])) {
            return { type: 'FeatureCollection', features: raw as GeoJSON.Feature[] };
        }
        throw new Error('不支持的空间数据格式');
    };

    const parseVectorFile = async (file: File): Promise<ParsedGeoJSON> => {
        const name = file.name.toLowerCase();
        if (name.endsWith('.geojson') || name.endsWith('.json')) {
            const text = await file.text();
            return normalizeToFeatureCollection(JSON.parse(text));
        }
        if (name.endsWith('.kml')) {
            const text = await file.text();
            const xml = new DOMParser().parseFromString(text, 'text/xml');
            return normalizeToFeatureCollection(kmlToGeoJSON(xml));
        }
        if (name.endsWith('.zip')) {
            const buffer = await file.arrayBuffer();
            const out = await shp(buffer);
            return normalizeToFeatureCollection(out);
        }
        throw new Error('仅支持 .zip(shp)、.geojson、.kml 文件');
    };

    const renderUploadedVector = useCallback((fc: ParsedGeoJSON) => {
        const map = mapRef.current;
        if (!map) return;
        clearUploadedVectorLayer();
        const layer = L.geoJSON(fc, {
            style: {
                color: '#2563eb',
                weight: 2,
                fillColor: '#60a5fa',
                fillOpacity: 0.2,
            },
            pointToLayer: (_feature, latlng) =>
                L.circleMarker(latlng, {
                    radius: 5,
                    color: '#2563eb',
                    fillColor: '#60a5fa',
                    fillOpacity: 0.9,
                    weight: 1.5,
                }),
        }).addTo(map);
        uploadedVectorLayerRef.current = layer;
        const bounds = layer.getBounds();
        if (bounds.isValid()) {
            map.fitBounds(bounds.pad(0.12));
        }
    }, [clearUploadedVectorLayer]);

    const handleVectorFile = useCallback(async (file: File | null | undefined) => {
        if (!file) return;
        setUploadHint('');
        if (file.size > 20 * 1024 * 1024) {
            setUploadHint('仅支持上传一个文件，且大小不能超过 20MB');
            return;
        }
        setIsUploadingVector(true);
        try {
            const fc = await parseVectorFile(file);
            if (!fc.features || fc.features.length === 0) {
                throw new Error('文件中未解析到有效空间要素');
            }
            renderUploadedVector(fc);
            setUploadedVectorName(file.name);
            setUploadHint(`已加载：${file.name}`);
        } catch (err) {
            setUploadHint(err instanceof Error ? err.message : '空间文件解析失败');
        } finally {
            setIsUploadingVector(false);
        }
    }, [renderUploadedVector]);

    const handleResetMap = () => {
        const map = mapRef.current;
        if (!map) return;
        clearFocusedSpatialView();
        if (mapHintClearTimerRef.current !== null) {
            window.clearTimeout(mapHintClearTimerRef.current);
            mapHintClearTimerRef.current = null;
        }
        setMapLoadHint('');
        map.setView(DEFAULT_CENTER, DEFAULT_ZOOM, { animate: true });
        setBaseMap('roadmap');
        setDimension('2D');
    };

    const toggleDimension = () => {
        setDimension(prev => {
            const next = prev === '2D' ? '3D' : '2D';
            // 当前实现采用“地形底图 + 状态切换”来表达 3D 观感
            if (next === '3D') {
                setBaseMap(curr => (curr === 'roadmap' ? 'terrain' : curr));
            }
            return next;
        });
    };

    const toggleResultSelection = (id: string) => {
        setSelectedResultIds(prev => {
            if (prev.includes(id)) {
                const next = prev.filter(x => x !== id);
                setChartItemId(cur => {
                    if (cur !== id) return cur;
                    return next.length ? next[next.length - 1] : null;
                });
                if (next.length === 0) {
                    setChartPanelOpen(false);
                    if (mapHintClearTimerRef.current !== null) {
                        window.clearTimeout(mapHintClearTimerRef.current);
                        mapHintClearTimerRef.current = null;
                    }
                    setMapLoadHint('');
                }
                return next;
            }
            const next = [...prev, id];
            setChartItemId(id);
            setChartPanelOpen(true);
            queueMicrotask(() => {
                flyToResultItem(id);
            });
            return next;
        });
    };

    const toggleResultVisibility = (id: string) => {
        setHiddenResultIds(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
    };

    const normalizedGlobalQuery = globalSearchQuery.trim().toLowerCase();
    const filteredResults = normalizedGlobalQuery
        ? MOCK_SEARCH_RESULTS.filter(item => {
            const searchableText = [
                item.id,
                item.title,
                item.categoryType,
                item.fileFormat,
                item.acquiredAt,
                item.dataSizeLabel,
            ]
                .join(' ')
                .toLowerCase();
            return searchableText.includes(normalizedGlobalQuery);
        })
        : MOCK_SEARCH_RESULTS;
    const totalResults = filteredResults.length;
    const totalPages = Math.max(1, Math.ceil(totalResults / resultPageSize));
    const clampedPage = Math.min(resultPage, totalPages);
    const pageStart = (clampedPage - 1) * resultPageSize;
    const pageEnd = pageStart + resultPageSize;
    const pagedResults = filteredResults.slice(pageStart, pageEnd);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;
        if (!showResultPanel || pagedResults.length === 0) {
            clearResultFootprints();
            return;
        }

        clearResultFootprints();
        const viewBounds = map.getBounds();
        if (!viewBounds.isValid()) return;

        const padded = viewBounds.pad(-0.08);
        const south = padded.getSouth();
        const north = padded.getNorth();
        const west = padded.getWest();
        const east = padded.getEast();
        const center = padded.getCenter();
        const angle = (-11 * Math.PI) / 180;
        const count = pagedResults.length;
        const cols = Math.max(4, Math.ceil(Math.sqrt(count * 1.35)));
        const rows = Math.max(3, Math.ceil(count / cols));
        const cellH = (north - south) / rows;
        const cellW = (east - west) / cols;

        const layerGroup = L.featureGroup();
        const byId = new Map<string, L.Polygon>();
        for (let i = 0; i < count; i += 1) {
            const r = Math.floor(i / cols);
            const c = i % cols;
            const y0 = south + r * cellH;
            const y1 = y0 + cellH;
            const x0 = west + c * cellW;
            const x1 = x0 + cellW;
            const corners: L.LatLngExpression[] = [
                rotateLatLng(y0, x0, center.lat, center.lng, angle),
                rotateLatLng(y0, x1, center.lat, center.lng, angle),
                rotateLatLng(y1, x1, center.lat, center.lng, angle),
                rotateLatLng(y1, x0, center.lat, center.lng, angle),
            ];
            const itemId = pagedResults[i].id;
            const poly = L.polygon(corners, {
                color: '#4a7df4',
                weight: 1.4,
                opacity: 0.96,
                fillColor: '#6aa3ff',
                fillOpacity: 0.1,
                fill: true,
                interactive: true,
                bubblingMouseEvents: false,
            });
            poly.on('mouseover', () => {
                if (footprintHoverLeaveTimerRef.current !== null) {
                    window.clearTimeout(footprintHoverLeaveTimerRef.current);
                    footprintHoverLeaveTimerRef.current = null;
                }
                setHoveredResultId(prev => (prev === itemId ? prev : itemId));
            });
            poly.on('mouseout', () => {
                if (footprintHoverLeaveTimerRef.current !== null) {
                    window.clearTimeout(footprintHoverLeaveTimerRef.current);
                }
                footprintHoverLeaveTimerRef.current = window.setTimeout(() => {
                    setHoveredResultId(prev => (prev === itemId ? null : prev));
                    footprintHoverLeaveTimerRef.current = null;
                }, 120);
            });
            poly.addTo(layerGroup);
            byId.set(itemId, poly);
        }

        layerGroup.addTo(map);
        resultFootprintLayerRef.current = layerGroup;
        resultFootprintByIdRef.current = byId;
        return () => clearResultFootprints();
    }, [showResultPanel, pagedResults, clearResultFootprints, rotateLatLng, setFootprintHighlightStyle, setFootprintNormalStyle]);

    useEffect(() => {
        const byId = resultFootprintByIdRef.current;
        byId.forEach((poly, id) => {
            if (id === hoveredResultId) {
                setFootprintHighlightStyle(poly);
            } else {
                setFootprintNormalStyle(poly);
            }
        });
    }, [hoveredResultId, setFootprintHighlightStyle, setFootprintNormalStyle]);

    const allCurrentPageSelected =
        pagedResults.length > 0 && pagedResults.every(item => selectedResultIds.includes(item.id));

    const bandSynthContextItem = bandSynthContextItemId
        ? MOCK_SEARCH_RESULTS.find(x => x.id === bandSynthContextItemId) ?? null
        : null;
    const bandPlatformKey: BandPlatformKey = bandSynthContextItem
        ? resolveBandPlatformFromTitle(bandSynthContextItem.title)
        : 'sentinel2';
    const bandPlatform = BAND_PLATFORM_CONFIG[bandPlatformKey];

    const openBandSynthesis = (itemId: string) => {
        resultListScrollTopRef.current = resultListScrollRef.current?.scrollTop ?? resultListScrollTopRef.current;
        persistResultPanelState();
        setBandSynthContextItemId(itemId);
        setBandSynthOpen(true);
        setBandSynthView('presets');
        setBandSynthSelectedPresetId(null);
    };

    const closeBandSynthesis = () => {
        setBandSynthOpen(false);
        setBandSynthView('presets');
        setBandSynthContextItemId(null);
        setBandSynthSelectedPresetId(null);
        shouldRestoreResultScrollRef.current = true;
        persistResultPanelState();
    };

    const enterCustomBandSynth = () => {
        const k = bandSynthContextItem ? resolveBandPlatformFromTitle(bandSynthContextItem.title) : 'sentinel2';
        setBandRgb(defaultRgbForPlatform(k));
        setBandSynthView('custom');
    };

    const bandTint = (bandId: string | null) =>
        bandPlatform.bands.find(b => b.id === bandId)?.tint ?? 'bg-slate-400';

    const resolvedChartItemId =
        chartItemId && selectedResultIds.includes(chartItemId)
            ? chartItemId
            : selectedResultIds.length > 0
              ? selectedResultIds[selectedResultIds.length - 1]
              : null;
    const activeChartItem = resolvedChartItemId
        ? MOCK_SEARCH_RESULTS.find(x => x.id === resolvedChartItemId) ?? null
        : null;
    const chartRows = buildChartRowsByItem(activeChartItem);
    const chartTotalPages = Math.max(1, Math.ceil(chartRows.length / chartPageSize));
    const chartClampedPage = Math.min(chartPage, chartTotalPages);
    const chartPageRows = chartRows.slice((chartClampedPage - 1) * chartPageSize, chartClampedPage * chartPageSize);

    /** 与查询结果勾选联动：多选多条即叠加多张图层；预览显隐随「隐藏」切换 */
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const upsertPreview = (
            id: string,
            item: SearchResultItem,
            mainLayer: L.Layer,
            bounds: L.LatLngBounds,
            centerForPoint: L.LatLng | null,
            hiddenIds: string[]
        ) => {
            const prevEntry = selectionSpatialLayersRef.current.get(id);
            if (prevEntry?.preview) {
                prevEntry.preview.remove();
            }
            const hidePreview = hiddenIds.includes(id) || !item.hasSpatialPreview;
            let preview: L.ImageOverlay | null = null;
            if (!hidePreview) {
                if (item.spatialShape === 'point' && centerForPoint) {
                    const pointBounds = L.latLngBounds(
                        [centerForPoint.lat - 0.045, centerForPoint.lng - 0.045],
                        [centerForPoint.lat + 0.045, centerForPoint.lng + 0.045],
                    );
                    preview = L.imageOverlay(item.thumb, pointBounds, { opacity: 0.58 }).addTo(map);
                } else if (bounds.isValid()) {
                    preview = L.imageOverlay(item.thumb, bounds, { opacity: 0.56 }).addTo(map);
                }
                if (preview) setBaseMap(prev => (prev !== 'satellite' ? 'satellite' : prev));
            }
            selectionSpatialLayersRef.current.set(id, { main: mainLayer, preview });
        };

        const selectedSet = new Set(selectedResultIds);
        selectionSpatialLayersRef.current.forEach((_, id) => {
            if (!selectedSet.has(id)) {
                removeSelectionSpatialLayer(id);
            }
        });

        let anyNoSpatial = false;
        for (const id of selectedResultIds) {
            const item = MOCK_SEARCH_RESULTS.find(x => x.id === id);
            if (!item) continue;

            if (!item.hasSpatialInfo) {
                anyNoSpatial = true;
                continue;
            }

            const footprint = resultFootprintByIdRef.current.get(id);
            const existing = selectionSpatialLayersRef.current.get(id);

            if (existing) {
                const polyB = footprint?.getBounds() ?? map.getBounds().pad(-0.62);
                const ptCenter =
                    item.spatialShape === 'point' && existing.main instanceof L.CircleMarker
                        ? existing.main.getLatLng()
                        : footprint?.getBounds().getCenter() ?? null;
                upsertPreview(id, item, existing.main, polyB, ptCenter, hiddenResultIds);
                continue;
            }

            const polyBounds = footprint?.getBounds() ?? map.getBounds().pad(-0.62);
            if (item.spatialShape === 'point') {
                const center = footprint?.getBounds().getCenter() ?? map.getCenter();
                const marker = L.circleMarker(center, {
                    radius: 8,
                    color: '#ff7a18',
                    weight: 2.5,
                    fillColor: '#ffb25b',
                    fillOpacity: 0.86,
                }).addTo(map);
                const pb = L.latLngBounds(
                    [center.lat - 0.045, center.lng - 0.045],
                    [center.lat + 0.045, center.lng + 0.045],
                );
                upsertPreview(id, item, marker, pb, center, hiddenResultIds);
            } else {
                const highlightRect = L.rectangle(polyBounds, {
                    color: '#ff7a18',
                    weight: 2.8,
                    fillColor: '#ffb25b',
                    fillOpacity: 0.2,
                    dashArray: '8,5',
                }).addTo(map);
                upsertPreview(id, item, highlightRect, polyBounds, null, hiddenResultIds);
            }
        }

        if (mapHintClearTimerRef.current !== null) {
            window.clearTimeout(mapHintClearTimerRef.current);
            mapHintClearTimerRef.current = null;
        }
        if (anyNoSpatial && selectedResultIds.length > 0) {
            setMapLoadHint('部分选中数据无空间位置，仅能在表中查看');
            mapHintClearTimerRef.current = window.setTimeout(() => {
                setMapLoadHint('');
                mapHintClearTimerRef.current = null;
            }, 2600);
        } else {
            setMapLoadHint('');
        }
    }, [selectedResultIds, hiddenResultIds, removeSelectionSpatialLayer, showResultPanel, pagedResults]);

    useEffect(() => {
        setChartPage(1);
    }, [chartItemId]);

    const handleOpenResultDetail = useCallback((itemId: string) => {
        const item = MOCK_SEARCH_RESULTS.find(x => x.id === itemId);
        if (!item) return;
        resultListScrollTopRef.current = resultListScrollRef.current?.scrollTop ?? resultListScrollTopRef.current;
        persistResultPanelState();
        onOpenDataDetail?.(item);
    }, [onOpenDataDetail, persistResultPanelState]);

    const flyToResultItem = useCallback((itemId: string) => {
        const map = mapRef.current;
        const item = MOCK_SEARCH_RESULTS.find(x => x.id === itemId);
        if (!map || !item) return;
        if (!item.hasSpatialInfo) {
            setMapLoadHint('该数据没有空间位置信息，无法飞往定位');
            if (mapHintClearTimerRef.current !== null) window.clearTimeout(mapHintClearTimerRef.current);
            mapHintClearTimerRef.current = window.setTimeout(() => {
                setMapLoadHint('');
                mapHintClearTimerRef.current = null;
            }, 2200);
            return;
        }
        const footprint = resultFootprintByIdRef.current.get(itemId);
        if (item.spatialShape === 'point') {
            const center = footprint?.getBounds().getCenter() ?? map.getCenter();
            map.flyTo(center, Math.max(currentZoom, 13), { animate: true, duration: 0.7 });
            return;
        }
        const bounds = footprint?.getBounds();
        if (bounds && bounds.isValid()) {
            map.flyToBounds(bounds.pad(0.8), { animate: true, duration: 0.7 });
        }
    }, [currentZoom]);

    const inspectResultItem = useCallback((itemId: string) => {
        setSelectedResultIds(prev => (prev.includes(itemId) ? prev : [...prev, itemId]));
        setChartItemId(itemId);
        setChartPanelOpen(true);
        setChartPage(1);
        queueMicrotask(() => {
            flyToResultItem(itemId);
        });
    }, [flyToResultItem]);

    const toggleSelectCurrentPage = useCallback(() => {
        const currentPageIds = pagedResults.map(item => item.id);
        setSelectedResultIds(prev => {
            if (currentPageIds.every(id => prev.includes(id))) {
                const next = prev.filter(id => !currentPageIds.includes(id));
                setChartItemId(cur => {
                    if (!cur) return null;
                    if (next.includes(cur)) return cur;
                    return next.length ? next[next.length - 1] : null;
                });
                if (next.length === 0) setChartPanelOpen(false);
                return next;
            }
            const merged = [...prev];
            let lastNew: string | null = null;
            for (const id of currentPageIds) {
                if (!merged.includes(id)) {
                    merged.push(id);
                    lastNew = id;
                }
            }
            if (lastNew) {
                setChartItemId(lastNew);
                setChartPanelOpen(true);
                queueMicrotask(() => flyToResultItem(lastNew));
            }
            return merged;
        });
    }, [pagedResults, flyToResultItem]);

    const openResultPanelByMode = useCallback((mode: 'expanded' | 'collapsed') => {
        setResultPanelEntryMode(mode);
        if (mode === 'collapsed') setIsSearchPanelCollapsed(false);
        shouldRestoreResultScrollRef.current = true;
        setShowResultPanel(true);
    }, []);

    useEffect(() => {
        persistResultPanelState();
    }, [persistResultPanelState]);

    useEffect(() => {
        if (!showResultPanel || bandSynthOpen || !shouldRestoreResultScrollRef.current) return;
        const node = resultListScrollRef.current;
        if (!node) return;
        requestAnimationFrame(() => {
            node.scrollTop = resultListScrollTopRef.current;
            shouldRestoreResultScrollRef.current = false;
        });
    }, [showResultPanel, bandSynthOpen, pagedResults.length]);

    return (
        <div className="flex-1 flex h-full bg-white overflow-hidden animate-fadeIn font-sans relative">
            {/* 1. Left Search Criteria Sidebar */}
            {!isSearchPanelCollapsed && (
            <div className="w-[400px] border-r border-slate-100 flex flex-col bg-white z-20 shadow-[4px_0_15px_rgba(0,0,0,0.02)]">
                <div className={`p-4 flex-1 ${showResultPanel ? 'overflow-hidden flex flex-col' : 'space-y-5 overflow-y-auto no-scrollbar'}`}>
                    {showResultPanel ? (
                        <div className="h-full min-h-0 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            resultListScrollTopRef.current = resultListScrollRef.current?.scrollTop ?? resultListScrollTopRef.current;
                                            persistResultPanelState();
                                            setShowResultPanel(false);
                                            if (resultPanelEntryMode === 'collapsed') setIsSearchPanelCollapsed(true);
                                        }}
                                        className="w-8 h-8 rounded-md border border-slate-200 bg-white text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-colors flex items-center justify-center"
                                        title="返回"
                                    >
                                        <ArrowLeft size={14} />
                                    </button>
                                    <span className="text-[13px] font-bold text-slate-700">查询结果</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={toggleSelectCurrentPage}
                                        className={`w-8 h-8 rounded-md border transition-colors flex items-center justify-center ${
                                            allCurrentPageSelected
                                                ? 'border-blue-500 text-blue-600 bg-blue-50'
                                                : 'border-slate-200 bg-white text-slate-500 hover:text-blue-600 hover:border-blue-200'
                                        }`}
                                        title={allCurrentPageSelected ? '取消当前页全选' : '全选当前页'}
                                    >
                                        <CheckSquare size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        className="w-8 h-8 rounded-md border border-slate-200 bg-white text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors flex items-center justify-center"
                                        title="全局收藏"
                                    >
                                        <Heart size={14} />
                                    </button>
                                    <button
                                        type="button"
                                        className="w-8 h-8 rounded-md border border-slate-200 bg-white text-slate-500 hover:text-blue-600 hover:border-blue-200 transition-colors flex items-center justify-center"
                                        title="申请"
                                    >
                                        <FilePlus2 size={14} />
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 min-h-0 rounded-xl border border-slate-200 bg-white overflow-hidden flex flex-col">
                                {bandSynthOpen ? (
                                    <>
                                        <div className="px-3 py-2.5 border-b border-slate-200 flex items-center justify-between gap-2">
                                            <div className="min-w-0">
                                                <h3 className="text-[14px] font-bold text-slate-800">
                                                    {bandSynthView === 'custom' ? '自定义波段合成' : '波段合成'}
                                                </h3>
                                                {bandSynthContextItem && (
                                                    <p className="text-[11px] text-slate-500 truncate mt-0.5">{bandSynthContextItem.title}</p>
                                                )}
                                            </div>
                                            <button
                                                type="button"
                                                onClick={closeBandSynthesis}
                                                className="w-7 h-7 rounded-md border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 hover:text-slate-800"
                                                title="关闭波段合成"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                        {bandSynthView === 'presets' ? (
                                            <ul className="flex-1 overflow-y-auto divide-y divide-slate-100">
                                                {BAND_SYNTH_PRESETS_CN.map(preset => {
                                                    const selected = bandSynthSelectedPresetId === preset.id && !preset.isCustom;
                                                    return (
                                                        <li key={preset.id}>
                                                            <button
                                                                type="button"
                                                                className={`w-full flex items-center gap-3 p-3 text-left transition-colors ${
                                                                    selected
                                                                        ? 'bg-blue-600 text-white hover:bg-blue-600'
                                                                        : 'hover:bg-slate-50 text-slate-800'
                                                                }`}
                                                                onClick={() => {
                                                                    if (preset.isCustom) enterCustomBandSynth();
                                                                    else setBandSynthSelectedPresetId(preset.id);
                                                                }}
                                                            >
                                                                <div
                                                                    className={`w-10 h-10 rounded-md shrink-0 shadow-inner ${preset.thumbClass} ${
                                                                        preset.isCustom ? 'flex items-center justify-center' : ''
                                                                    }`}
                                                                >
                                                                    {preset.isCustom && <Layers className="text-white/95" size={18} />}
                                                                </div>
                                                                <div className="min-w-0 flex-1">
                                                                    <div className={`text-[12px] font-bold ${selected ? 'text-white' : 'text-slate-800'}`}>
                                                                        {preset.name}
                                                                    </div>
                                                                    <div className={`text-[10px] mt-0.5 leading-snug ${selected ? 'text-blue-100' : 'text-slate-500'}`}>
                                                                        {preset.desc}
                                                                    </div>
                                                                </div>
                                                            </button>
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        ) : (
                                            <div className="flex-1 p-3 space-y-3 overflow-y-auto">
                                                <button
                                                    type="button"
                                                    onClick={() => setBandSynthView('presets')}
                                                    className="inline-flex items-center gap-1.5 text-[12px] font-semibold text-blue-600 hover:text-blue-700"
                                                >
                                                    <ArrowLeft size={14} />
                                                    返回预设列表
                                                </button>
                                                <div className="flex items-start gap-2 text-[11px] text-slate-600">
                                                    <Info size={14} className="shrink-0 mt-0.5 text-blue-500" />
                                                    <span>将波段拖入 R、G、B 位置完成合成（当前：{bandPlatform.label}）。</span>
                                                </div>
                                                <div className="grid grid-cols-6 gap-2 justify-items-center">
                                                    {bandPlatform.bands.map(b => (
                                                        <div
                                                            key={b.id}
                                                            draggable
                                                            onDragStart={e => {
                                                                e.dataTransfer.setData('text/plain', b.id);
                                                                e.dataTransfer.effectAllowed = 'copy';
                                                            }}
                                                            className={`w-10 h-10 rounded-full ${b.tint} flex items-center justify-center text-[9px] font-black text-white shadow-md cursor-grab active:cursor-grabbing select-none`}
                                                        >
                                                            {b.id}
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex items-end justify-center gap-6 pt-1">
                                                    {(['R', 'G', 'B'] as const).map(ch => (
                                                        <div key={ch} className="flex flex-col items-center gap-1.5">
                                                            <span className="text-[12px] font-black text-slate-800">{ch}</span>
                                                            <div
                                                                onDragOver={e => e.preventDefault()}
                                                                onDrop={e => {
                                                                    e.preventDefault();
                                                                    const id = e.dataTransfer.getData('text/plain');
                                                                    if (!id || !bandPlatform.bands.some(x => x.id === id)) return;
                                                                    setBandRgb(prev => ({ ...prev, [ch]: id }));
                                                                }}
                                                                className="w-[50px] h-[50px] rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center bg-slate-50/80"
                                                            >
                                                                {bandRgb[ch] ? (
                                                                    <div
                                                                        className={`w-10 h-10 rounded-full ${bandTint(bandRgb[ch])} flex items-center justify-center text-[10px] font-black text-white shadow`}
                                                                    >
                                                                        {bandRgb[ch]}
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-[10px] text-slate-300">拖入</span>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                                <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                                                    <button
                                                        type="button"
                                                        onClick={() => setBandSynthView('presets')}
                                                        className="px-3 py-1.5 rounded-lg border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-50"
                                                    >
                                                        取消
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={closeBandSynthesis}
                                                        className="px-3 py-1.5 rounded-lg bg-blue-600 text-white text-[12px] font-semibold hover:bg-blue-700"
                                                    >
                                                        应用合成
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <>
                                        {totalResults === 0 ? (
                                            <div className="flex-1 min-h-0 flex items-center justify-center px-6">
                                                <div className="w-full max-w-[320px] rounded-2xl border border-slate-200 bg-slate-50/60 px-5 py-8 text-center">
                                                    <div className="mx-auto mb-3 w-11 h-11 rounded-full bg-white border border-slate-200 text-slate-400 flex items-center justify-center">
                                                        <Search size={18} />
                                                    </div>
                                                    <div className="text-[15px] font-bold text-slate-700">暂无匹配数据</div>
                                                    <p className="mt-2 text-[12px] leading-5 text-slate-500">
                                                        当前筛选条件下，没有匹配到数据，请重新查询。
                                                    </p>
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowResultPanel(false)}
                                                        className="mt-4 inline-flex items-center justify-center px-4 py-2 rounded-lg bg-blue-600 text-white text-[12px] font-semibold hover:bg-blue-700 transition-colors"
                                                    >
                                                        返回筛选条件
                                                    </button>
                                                </div>
                                            </div>
                                        ) : (
                                            <div
                                                ref={resultListScrollRef}
                                                className="flex-1 overflow-y-auto no-scrollbar divide-y divide-slate-100"
                                                onScroll={(e) => {
                                                    resultListScrollTopRef.current = e.currentTarget.scrollTop;
                                                    persistResultPanelState();
                                                }}
                                            >
                                                {pagedResults.map(item => (
                                                    <div
                                                        key={item.id}
                                                        className={`group relative p-3 flex items-center gap-3 transition-colors ${
                                                            selectedResultIds.includes(item.id)
                                                                ? 'bg-blue-50/70'
                                                                : hoveredResultId === item.id
                                                                    ? 'bg-amber-50'
                                                                    : 'hover:bg-slate-50'
                                                        }`}
                                                        onMouseEnter={() => setHoveredResultId(item.id)}
                                                        onMouseLeave={() => setHoveredResultId(prev => (prev === item.id ? null : prev))}
                                                    >
                                                        <button
                                                            type="button"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const wasSelected = selectedResultIds.includes(item.id);
                                                                toggleResultSelection(item.id);
                                                                if (!wasSelected) {
                                                                    inspectResultItem(item.id);
                                                                }
                                                            }}
                                                            className={`w-4 h-4 rounded-[3px] border flex items-center justify-center transition-colors ${
                                                                selectedResultIds.includes(item.id)
                                                                    ? 'bg-blue-600 border-blue-600 text-white'
                                                                    : 'bg-white border-slate-300 text-transparent'
                                                            }`}
                                                        >
                                                            <Check size={10} />
                                                        </button>
                                                        <img src={item.thumb} alt="" className="w-12 h-12 rounded-lg object-cover border border-slate-200" />
                                                        <div
                                                            className="flex-1 min-w-0 cursor-pointer"
                                                            onClick={() => inspectResultItem(item.id)}
                                                            title="查看该数据图表"
                                                        >
                                                            <div className="text-[14px] font-black text-slate-800 leading-tight mb-1 truncate">{item.title}</div>
                                                            <div className="grid grid-cols-2 gap-x-3 text-[11px] text-slate-500">
                                                                <div className="space-y-0.5">
                                                                    <div>类型: {item.categoryType}</div>
                                                                    <div>数据量: {item.dataSizeLabel}</div>
                                                                </div>
                                                                <div className="space-y-0.5">
                                                                    <div>格式: {item.fileFormat}</div>
                                                                    <div>采集时间: {item.acquiredAt}</div>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="absolute inset-y-0 left-7 right-0 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                                            <div className="absolute inset-0 bg-white/35 backdrop-blur-[2px]" />
                                                            <div className="absolute inset-0 flex items-center justify-center gap-1.5 pointer-events-auto px-1">
                                                                <button
                                                                    type="button"
                                                                    className="w-11 h-11 rounded-full border border-white/70 bg-white/78 shadow-md text-slate-600 hover:text-rose-500 transition-colors flex items-center justify-center"
                                                                    title="收藏"
                                                                >
                                                                    <Heart size={16} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="w-11 h-11 rounded-full border border-white/70 bg-white/78 shadow-md text-slate-600 hover:text-blue-600 transition-colors flex items-center justify-center"
                                                                    title="申请"
                                                                >
                                                                    <FilePlus2 size={16} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        handleOpenResultDetail(item.id);
                                                                    }}
                                                                    className="w-11 h-11 rounded-full border border-white/70 bg-white/78 shadow-md text-slate-600 hover:text-indigo-600 transition-colors flex items-center justify-center"
                                                                    title="详情"
                                                                >
                                                                    <Info size={16} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => toggleResultVisibility(item.id)}
                                                                    className="w-11 h-11 rounded-full border border-white/70 bg-white/78 shadow-md text-slate-600 hover:text-violet-600 transition-colors flex items-center justify-center"
                                                                    title={hiddenResultIds.includes(item.id) ? '显示' : '隐藏'}
                                                                >
                                                                    {hiddenResultIds.includes(item.id) ? <EyeOff size={16} /> : <Eye size={16} />}
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        flyToResultItem(item.id);
                                                                    }}
                                                                    className="w-11 h-11 rounded-full border border-white/70 bg-white/78 shadow-md text-slate-600 hover:text-amber-600 transition-colors flex items-center justify-center"
                                                                    title="飞往"
                                                                >
                                                                    <LocateFixed size={16} />
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        openBandSynthesis(item.id);
                                                                    }}
                                                                    className="w-11 h-11 rounded-full border border-white/70 bg-white/78 shadow-md text-slate-600 hover:text-emerald-600 transition-colors flex items-center justify-center"
                                                                    title="波段合成"
                                                                >
                                                                    <Layers size={16} />
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        <div className="px-3 py-2 border-t border-slate-200 text-[11px] text-slate-500 flex items-center justify-between bg-white">
                                            <span>已选 {selectedResultIds.length} 景 / 共 {totalResults} 景</span>
                                            <div className="flex items-center gap-3">
                                                <label className="flex items-center gap-1">
                                                    <span>每页</span>
                                                    <select
                                                        value={resultPageSize}
                                                        onChange={(e) => {
                                                            setResultPageSize(Number(e.target.value));
                                                            setResultPage(1);
                                                        }}
                                                        className="h-6 rounded border border-slate-200 bg-white px-1 text-[11px] text-slate-600 outline-none"
                                                    >
                                                        <option value={20}>20</option>
                                                        <option value={50}>50</option>
                                                        <option value={100}>100</option>
                                                    </select>
                                                    <span>条</span>
                                                </label>
                                                <label className="flex items-center gap-1">
                                                    <span>第</span>
                                                    <select
                                                        value={clampedPage}
                                                        onChange={(e) => setResultPage(Number(e.target.value))}
                                                        className="h-6 rounded border border-slate-200 bg-white px-1 text-[11px] text-slate-600 outline-none"
                                                    >
                                                        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                                                            <option key={page} value={page}>
                                                                {page}
                                                            </option>
                                                        ))}
                                                    </select>
                                                    <span>页</span>
                                                </label>
                                                <span>共 {totalPages} 页</span>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    ) : (
                        <>
                    <div className="flex items-center justify-between gap-2.5 mb-3">
                        <div className="flex items-center gap-2.5">
                            <Database size={18} className="text-slate-800" />
                            <h2 className="text-[16px] font-bold text-slate-800 tracking-tight">时空综合检索</h2>
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsSearchPanelCollapsed(true)}
                            className="w-8 h-8 rounded-xl border border-slate-200 bg-white text-slate-500 hover:text-blue-600 hover:border-blue-200 hover:bg-blue-50 transition-all flex items-center justify-center shadow-sm"
                            title="收起搜索设置"
                        >
                            <PanelLeftClose size={14} />
                        </button>
                    </div>

                    {/* Step 1 */}
                    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-bold text-white">1</span>
                                <label className="text-[13px] font-bold text-slate-800">全局搜索匹配</label>
                            </div>
                            <span className="text-[11px] text-slate-500">全文检索</span>
                        </div>
                        <div className="relative group">
                            <input
                                type="text"
                                value={globalSearchQuery}
                                onChange={(e) => {
                                    setGlobalSearchQuery(e.target.value);
                                    setResultPage(1);
                                }}
                                placeholder="支持所有入库数据全文搜索匹配"
                                className="w-full h-10 pl-4 pr-10 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                            />
                            <Search className="absolute right-3 top-3 text-slate-300" size={16} />
                        </div>
                    </div>

                    {/* Step 2 */}
                    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-bold text-white">2</span>
                            <label className="text-[13px] font-bold text-slate-800">查询区域选择</label>
                        </div>
                        {/* Sub-tabs */}
                        <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
                            <AreaTab label="绘制范围" active={activeAreaTab === 'draw'} onClick={() => setActiveAreaTab('draw')} />
                            <AreaTab label="行政区域" active={activeAreaTab === 'admin'} onClick={() => setActiveAreaTab('admin')} />
                            <AreaTab label="经纬度" active={activeAreaTab === 'coords'} onClick={() => setActiveAreaTab('coords')} />
                            <AreaTab label="上传矢量" active={activeAreaTab === 'upload'} onClick={() => setActiveAreaTab('upload')} />
                        </div>

                        {activeAreaTab === 'upload' ? (
                            <div
                                className="rounded-xl border border-dashed border-blue-300 bg-blue-50/40 p-3 text-center"
                                onDragOver={(e) => {
                                    e.preventDefault();
                                    e.dataTransfer.dropEffect = 'copy';
                                }}
                                onDrop={(e) => {
                                    e.preventDefault();
                                    if (e.dataTransfer.files.length !== 1) {
                                        setUploadHint('仅支持上传一个文件');
                                        return;
                                    }
                                    void handleVectorFile(e.dataTransfer.files[0]);
                                }}
                            >
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".zip,.geojson,.json,.kml"
                                    className="hidden"
                                    onChange={(e) => {
                                        const files = e.target.files;
                                        if (!files || files.length === 0) return;
                                        if (files.length > 1) {
                                            setUploadHint('仅支持上传一个文件');
                                            return;
                                        }
                                        void handleVectorFile(files[0]);
                                        e.currentTarget.value = '';
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="mx-auto mb-2 inline-flex items-center gap-1.5 rounded-lg border border-blue-300 bg-white px-3 py-1.5 text-[12px] font-semibold text-blue-600 hover:bg-blue-50 transition-colors"
                                >
                                    <Upload size={14} />
                                    点击上传矢量
                                </button>
                                <p className="text-[11px] text-slate-500">
                                    支持拖入或点击上传：`.zip(shp)`、`.geojson`、`.kml`，仅 1 个文件，最大 20MB
                                </p>
                                {(isUploadingVector || uploadHint || uploadedVectorName) && (
                                    <p className={`mt-2 text-[11px] ${uploadHint.includes('已加载') ? 'text-emerald-600' : 'text-slate-600'}`}>
                                        {isUploadingVector ? '正在解析空间文件...' : uploadHint || `已加载：${uploadedVectorName}`}
                                    </p>
                                )}
                            </div>
                        ) : activeAreaTab === 'admin' ? (
                            <div className="space-y-2.5 rounded-xl border border-slate-200 bg-white/75 p-2.5">
                                <div className="grid grid-cols-3 gap-2">
                                    <select
                                        value={selectedProvinceId}
                                        onChange={(e) => void handleProvinceChange(e.target.value)}
                                        className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12px] font-semibold text-slate-700 outline-none focus:border-blue-400"
                                    >
                                        <option value="">省份</option>
                                        {provinceOptions.map(item => <option key={item.relationId} value={item.relationId}>{item.name}</option>)}
                                    </select>
                                    <select
                                        value={selectedCityId}
                                        onChange={(e) => void handleCityChange(e.target.value)}
                                        disabled={!selectedProvinceId}
                                        className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12px] font-semibold text-slate-700 outline-none focus:border-blue-400 disabled:bg-slate-100 disabled:text-slate-400"
                                    >
                                        <option value="">城市</option>
                                        {cityOptions.map(item => <option key={item.relationId} value={item.relationId}>{item.name}</option>)}
                                    </select>
                                    <select
                                        value={selectedDistrictId}
                                        onChange={(e) => void handleDistrictChange(e.target.value)}
                                        disabled={!selectedCityId}
                                        className="h-9 rounded-lg border border-slate-200 bg-white px-2 text-[12px] font-semibold text-slate-700 outline-none focus:border-blue-400 disabled:bg-slate-100 disabled:text-slate-400"
                                    >
                                        <option value="">区县</option>
                                        {districtOptions.map(item => <option key={item.relationId} value={item.relationId}>{item.name}</option>)}
                                    </select>
                                </div>
                                {(isAdminLoading || adminLoadError) && (
                                    <div className={`text-[11px] ${adminLoadError ? 'text-amber-600' : 'text-slate-500'}`}>
                                        {adminLoadError || '行政区边界加载中...'}
                                    </div>
                                )}
                            </div>
                        ) : activeAreaTab === 'coords' ? (
                            <div className="space-y-2.5 rounded-xl border border-slate-200 bg-white/75 p-2.5">
                                <div className="grid grid-cols-2 gap-2">
                                    <CoordInput label="左上经度" value={topLeftLon} onChange={setTopLeftLon} />
                                    <CoordInput label="左上纬度" value={topLeftLat} onChange={setTopLeftLat} />
                                    <CoordInput label="右下经度" value={bottomRightLon} onChange={setBottomRightLon} />
                                    <CoordInput label="右下纬度" value={bottomRightLat} onChange={setBottomRightLat} />
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[11px] text-slate-500">单位：度 (°)</span>
                                    <button
                                        type="button"
                                        onClick={handleLocateByCoords}
                                        className="px-3 py-1.5 rounded-md bg-blue-600 text-white text-[11px] font-bold hover:bg-blue-700 transition-colors"
                                    >
                                        范围定位
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="rounded-xl border border-slate-200 bg-white/75 p-2.5">
                                <div className="grid grid-cols-4 gap-2">
                                    <DrawTool icon={<Square size={12} />} label="矩形" />
                                    <DrawTool icon={<Pentagon size={12} />} label="多边形" />
                                    <DrawTool icon={<Minus size={12} className="rotate-45" />} label="绘制线" />
                                    <DrawTool icon={<Circle size={12} />} label="绘制圆" />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Step 3 */}
                    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-blue-600 px-1.5 text-[11px] font-bold text-white">3</span>
                            <label className="text-[13px] font-bold text-slate-800">查询时间</label>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                            {timeQuickRanges.map(item => (
                                <button
                                    key={item.label}
                                    type="button"
                                    onClick={() => applyQuickRange(item.days)}
                                    className="px-2.5 py-1 rounded-md border border-slate-200 bg-white text-[10px] font-bold text-slate-500 hover:text-blue-600 hover:border-blue-200"
                                >
                                    {item.label}
                                </button>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 h-10 px-3 bg-white border border-slate-200 rounded-lg text-sm group hover:border-slate-300 transition-all">
                            <Calendar size={15} className="text-slate-400" />
                            <input
                                type="date"
                                value={startDate}
                                onChange={(e) => handleTimeChange(e.target.value, endDate)}
                                className="w-full bg-transparent outline-none text-slate-700"
                            />
                            <span className="text-slate-300 mx-1">-</span>
                            <input
                                type="date"
                                value={endDate}
                                onChange={(e) => handleTimeChange(startDate, e.target.value)}
                                className="w-full bg-transparent outline-none text-slate-700"
                            />
                        </div>
                        {timeError && <div className="text-[11px] text-amber-600">{timeError}</div>}
                    </div>

                    {/* 更多条件（独立放在查询时间下方） */}
                    <div className="space-y-3 rounded-2xl border border-slate-200 bg-slate-50/70 p-3.5">
                        <button
                            type="button"
                            onClick={() => setIsMoreFiltersOpen(prev => !prev)}
                            className="w-full flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 bg-white text-[12px] font-semibold text-slate-700 hover:text-blue-600 hover:border-blue-200 transition-colors"
                        >
                            <span>更多条件</span>
                            {isMoreFiltersOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                        {isMoreFiltersOpen && (
                            <div className="space-y-3">
                            <div className="bg-[#f0f4f9] rounded-xl border border-slate-200 overflow-hidden shadow-inner">
                                <div className="flex items-center justify-between px-4 py-2 border-b border-white/40 bg-white/20">
                                    <span className="text-[11px] font-bold text-blue-600 uppercase tracking-widest">WHERE条件编辑器</span>
                                    <div className="flex gap-2">
                                        <button className="px-2 py-0.5 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-500 hover:text-blue-600 transition-colors">格式化</button>
                                        <button className="px-2 py-0.5 bg-blue-100 text-blue-600 rounded text-[10px] font-bold hover:bg-blue-200 transition-colors">清空</button>
                                    </div>
                                </div>
                                <textarea
                                    value={whereSql}
                                    onChange={(e) => setWhereSql(e.target.value)}
                                    placeholder="请输入WHERE条件，例如：column_name = 'value' AND status = 1"
                                    className="w-full h-32 p-4 bg-transparent outline-none text-[13px] font-mono text-slate-600 resize-none placeholder:text-slate-400 leading-relaxed"
                                />
                                <div className="px-4 py-2 bg-white/40 border-t border-white/40 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                                    <span>行数: 0  字符数: 0</span>
                                    <span className="text-blue-500 font-bold">就绪</span>
                                </div>
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-[12px] font-bold text-slate-700">云量筛选</span>
                                    <span className="text-[12px] font-black text-slate-800">&le;{cloudCoverage}%</span>
                                </div>
                                <input
                                    type="range"
                                    min={0}
                                    max={100}
                                    step={1}
                                    value={cloudCoverage}
                                    onChange={(e) => setCloudCoverage(Number(e.target.value))}
                                    className="w-full accent-blue-500"
                                />
                            </div>

                            <div className="rounded-xl border border-slate-200 bg-white p-3">
                                <div className="text-[12px] font-bold text-slate-700 mb-2">星源筛选</div>
                                <button
                                    type="button"
                                    onClick={openSatellitePanel}
                                    className="w-full h-10 px-3 rounded-lg border border-slate-200 bg-slate-50 text-left flex items-center justify-between hover:border-blue-300 transition-colors"
                                >
                                    <span className="text-[12px] text-slate-600 truncate">
                                        {selectedSatelliteSources.length > 0
                                            ? `已选 ${selectedSatelliteSources.length} 项：${selectedSatelliteSources.slice(0, 2).join('、')}${selectedSatelliteSources.length > 2 ? '...' : ''}`
                                            : '点击选择卫星/传感器或输入检索'}
                                    </span>
                                    <ChevronDown size={14} className="text-slate-400" />
                                </button>
                            </div>
                            </div>
                        )}
                    </div>
                    </>
                    )}
                </div>

                {isSatellitePanelOpen && (
                    <div className="fixed inset-0 z-[1200] bg-black/25 backdrop-blur-[1px] flex items-center justify-center p-6">
                        <div className="w-[min(980px,92vw)] max-h-[78vh] bg-white rounded-xl border border-slate-200 shadow-2xl flex flex-col overflow-hidden">
                            <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-4">
                                <div className="text-[14px] font-bold text-slate-800">卫星-传感器选择</div>
                                <input
                                    type="text"
                                    value={satelliteSearch}
                                    onChange={(e) => setSatelliteSearch(e.target.value)}
                                    placeholder="点击选择卫星/传感器或输入检索"
                                    className="w-[340px] max-w-[55%] h-9 px-3 rounded-lg border border-slate-200 text-[12px] outline-none focus:border-blue-400"
                                />
                            </div>
                            <div className="flex-1 overflow-auto p-4 grid grid-cols-5 gap-4">
                                {SATELLITE_GROUPS.map(group => (
                                    <div key={group.group}>
                                        <div className="text-[12px] font-bold text-slate-700 mb-2 pb-1 border-b border-slate-200">{group.group}</div>
                                        <div className="space-y-1.5">
                                            {group.items
                                                .filter(item => !satelliteSearch || `${group.group}${item}`.toLowerCase().includes(satelliteSearch.toLowerCase()))
                                                .map(item => {
                                                    const id = `${group.group}:${item}`;
                                                    const active = pendingSatelliteSources.includes(id);
                                                    return (
                                                        <button
                                                            key={id}
                                                            type="button"
                                                            onClick={() => toggleSatelliteSource(id)}
                                                            className={`w-full text-left px-2 py-1 rounded text-[11px] transition-colors flex items-center gap-2 ${
                                                                active ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                                                            }`}
                                                        >
                                                            <span
                                                                className={`w-3.5 h-3.5 rounded-[3px] border flex items-center justify-center shrink-0 transition-colors ${
                                                                    active
                                                                        ? 'border-white/90 bg-white/20 text-white'
                                                                        : 'border-slate-300 bg-white text-transparent'
                                                                }`}
                                                            >
                                                                <Check size={9} />
                                                            </span>
                                                            <span className="truncate">{item}</span>
                                                        </button>
                                                    );
                                                })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="px-4 py-3 border-t border-slate-200 flex items-center justify-between">
                                <div className="text-[12px] text-slate-500">当前选中：{pendingSatelliteSources.length} 项</div>
                                <div className="flex gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setIsSatellitePanelOpen(false)}
                                        className="px-4 py-1.5 rounded-md border border-slate-200 text-[12px] font-semibold text-slate-600 hover:bg-slate-50"
                                    >
                                        取消
                                    </button>
                                    <button
                                        type="button"
                                        onClick={confirmSatelliteSelection}
                                        className="px-4 py-1.5 rounded-md bg-blue-600 text-white text-[12px] font-semibold hover:bg-blue-700"
                                    >
                                        确定
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Buttons */}
                {!showResultPanel && <div className="p-4 pt-3 border-t border-slate-100 flex gap-3 bg-white/80 backdrop-blur-md">
                    <button className="flex-1 py-2.5 border border-blue-400 text-blue-600 rounded-xl text-[14px] font-bold hover:bg-blue-50 transition-all active:scale-95 shadow-sm">
                        重置
                    </button>
                    <button type="button" onClick={() => {
                        openResultPanelByMode('expanded');
                    }} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-[14px] font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200">
                        检索
                    </button>
                </div>}
            </div>
            )}

            {isSearchPanelCollapsed && (
                <div className="absolute top-4 left-4 z-[700] w-[340px] max-w-[calc(100%-7rem)]">
                    <div className="relative h-10 rounded-lg border border-slate-200 bg-white shadow-sm overflow-hidden">
                        <div className="absolute inset-y-0 left-0 right-10">
                            <input
                                type="text"
                                value={globalSearchQuery}
                                onChange={(e) => {
                                    setGlobalSearchQuery(e.target.value);
                                    setResultPage(1);
                                }}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                        e.preventDefault();
                                        openResultPanelByMode('collapsed');
                                    }
                                }}
                                placeholder="全局搜索匹配结果数据"
                                className="w-full h-full pl-4 pr-10 bg-transparent text-sm outline-none focus:ring-4 focus:ring-blue-50"
                            />
                            <button
                                type="button"
                                onClick={() => openResultPanelByMode('collapsed')}
                                className="absolute right-1.5 top-1.5 h-7 w-7 rounded-md text-slate-300 hover:text-blue-500 hover:bg-blue-50 transition-colors flex items-center justify-center"
                                title="搜索"
                            >
                                <Search size={16} />
                            </button>
                        </div>
                        <div className="absolute right-10 top-2 bottom-2 w-px bg-slate-200" />
                        <button
                            type="button"
                            onClick={() => setIsSearchPanelCollapsed(false)}
                            className="absolute right-0 top-0 h-full w-10 text-slate-600 hover:text-blue-600 hover:bg-blue-50 transition-colors flex items-center justify-center"
                            title="展开搜索设置"
                        >
                            <PanelLeftOpen size={14} />
                        </button>
                    </div>
                </div>
            )}

            {/* 2. Map area：顶栏数据详情（贴顶嵌入） + Leaflet 底图 */}
            <div ref={mapShellRef} className="flex-1 flex flex-col min-h-0 bg-slate-900 overflow-hidden">
                {chartPanelOpen && selectedResultIds.length > 0 && (
                    <div className="flex-shrink-0 z-[545] bg-white border-b border-slate-200 shadow-[0_4px_12px_rgba(15,23,42,0.06)] pointer-events-auto flex flex-col max-h-[45vh] min-h-0">
                        <div className="flex items-center gap-2 px-2 py-1.5 border-b border-slate-100 shrink-0 min-h-10">
                            <Table size={14} className="text-blue-600 shrink-0 ml-1" />
                            <div className="flex-1 flex gap-1 overflow-x-auto min-w-0 custom-scrollbar py-0.5">
                                {selectedResultIds.map(tid => {
                                    const tabItem = MOCK_SEARCH_RESULTS.find(x => x.id === tid);
                                    const label = tabItem?.title ?? tid;
                                    const active = resolvedChartItemId === tid;
                                    return (
                                        <button
                                            key={tid}
                                            type="button"
                                            title={label}
                                            onClick={() => {
                                                setChartItemId(tid);
                                                setChartPage(1);
                                                queueMicrotask(() => flyToResultItem(tid));
                                            }}
                                            className={`shrink-0 max-w-[200px] truncate px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors border ${
                                                active
                                                    ? 'border-blue-500 bg-blue-50 text-blue-700 shadow-sm'
                                                    : 'border-transparent text-slate-600 hover:bg-slate-50 hover:border-slate-200'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    );
                                })}
                            </div>
                            <button
                                type="button"
                                onClick={() => setChartPanelOpen(false)}
                                className="w-8 h-8 rounded-md hover:bg-slate-100 text-slate-500 hover:text-slate-700 flex items-center justify-center shrink-0"
                                title="收起数据表"
                            >
                                <X size={14} />
                            </button>
                        </div>
                        <div className="flex-1 min-h-0 overflow-y-auto">
                            <table className="w-full text-[12px]">
                                <thead className="sticky top-0 bg-white z-[1] shadow-[0_1px_0_0_rgb(241_245_249)]">
                                    <tr className="text-slate-400 border-b border-slate-100">
                                        <th className="text-left font-semibold px-4 py-2 w-14">ID</th>
                                        <th className="text-left font-semibold px-4 py-2">名称</th>
                                        <th className="text-left font-semibold px-4 py-2 w-24">数值</th>
                                        <th className="text-left font-semibold px-4 py-2 w-24">状态</th>
                                        <th className="text-left font-semibold px-4 py-2 w-24">分类</th>
                                        <th className="text-left font-semibold px-4 py-2 w-32">时间</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {chartPageRows.map(row => (
                                        <tr key={row.id} className="border-b border-slate-50 text-slate-700 hover:bg-blue-50/40">
                                            <td className="px-4 py-2">{row.id}</td>
                                            <td className="px-4 py-2 font-bold text-slate-800">{row.name}</td>
                                            <td className="px-4 py-2 font-semibold text-blue-600">{row.value}</td>
                                            <td className="px-4 py-2">
                                                <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-bold ${row.status === 'Active' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                                    {row.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 font-semibold">{row.category}</td>
                                            <td className="px-4 py-2 text-slate-500">{row.time}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="h-10 px-4 border-t border-slate-200 flex items-center justify-between text-[12px] text-slate-500 shrink-0 bg-slate-50/80">
                            <span>共 {chartRows.length} 条数据</span>
                            <div className="flex items-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => setChartPage(p => Math.max(1, p - 1))}
                                    className="px-2 py-0.5 rounded border border-slate-200 hover:border-blue-200 hover:text-blue-600 disabled:opacity-40"
                                    disabled={chartClampedPage === 1}
                                >
                                    上一页
                                </button>
                                <span className="font-semibold text-slate-700">{chartClampedPage} / {chartTotalPages}</span>
                                <button
                                    type="button"
                                    onClick={() => setChartPage(p => Math.min(chartTotalPages, p + 1))}
                                    className="px-2 py-0.5 rounded border border-slate-200 hover:border-blue-200 hover:text-blue-600 disabled:opacity-40"
                                    disabled={chartClampedPage === chartTotalPages}
                                >
                                    下一页
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex-1 relative min-h-0 overflow-hidden">
                <div
                    className="absolute inset-0 overflow-hidden"
                    style={{ perspective: '1400px' }}
                >
                    <div ref={mapContainerRef} className="absolute inset-0 z-0 h-full w-full [&_.leaflet-container]:h-full [&_.leaflet-container]:bg-slate-900 [&_.leaflet-control-attribution]:text-[10px] [&_.leaflet-control-attribution]:max-w-[55%] [&_.leaflet-control-attribution]:truncate" />
                    {isMapTilesLoading && !hasLoadedBaseLayer && (
                        <div className="absolute inset-0 z-[510] pointer-events-none bg-gradient-to-b from-white/20 to-white/10">
                            <div className="absolute top-4 right-4 flex items-center gap-1.5 rounded-md bg-white/85 px-2 py-1 text-[11px] text-slate-600 shadow-sm border border-slate-200/80">
                                <LoaderCircle size={12} className="animate-spin text-blue-500" />
                                底图加载中...
                            </div>
                        </div>
                    )}
                    {mapLoadHint && (
                        <div className="absolute top-4 right-4 z-[515] rounded-md bg-amber-50/95 border border-amber-200 px-2.5 py-1.5 text-[11px] text-amber-700 shadow-sm">
                            {mapLoadHint}
                        </div>
                    )}

                    {/* 地图左上角：位置检索组件 */}
                    <div className={`absolute top-4 z-[520] w-[340px] max-w-[calc(100%-7rem)] pointer-events-auto ${isSearchPanelCollapsed ? 'left-[360px]' : 'left-4'}`}>
                        <div className="p-0">
                            <div className="relative group">
                                <input
                                    type="text"
                                    value={locationQuery}
                                    onChange={(e) => setLocationQuery(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            if (locationResults[0]) {
                                                focusLocationResult(locationResults[0]);
                                                setLocationQuery(locationResults[0].displayName);
                                                setLocationResults([]);
                                            } else {
                                                void handleLocationSearch(locationQuery);
                                            }
                                        }
                                    }}
                                    placeholder="搜索位置"
                                    className="w-full h-10 pl-4 pr-10 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                                />
                                <Search className={`absolute right-3 top-3 ${isSearchingLocation ? 'text-blue-500' : 'text-slate-300'}`} size={16} />
                            </div>
                            {(locationResults.length > 0 || locationError) && (
                                <div className="mt-2 max-h-52 overflow-auto rounded-lg border border-slate-200 bg-white shadow-sm">
                                    {locationResults.map(item => (
                                        <div key={item.placeId} className="flex items-center gap-2 px-3 py-2 border-b border-slate-100 last:border-0">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    focusLocationResult(item);
                                                    setLocationQuery(item.displayName);
                                                    setLocationResults([]);
                                                }}
                                                className="min-w-0 flex-1 text-left hover:text-blue-600 transition-colors"
                                            >
                                                <div className="text-[12px] font-semibold text-slate-700 truncate">{item.displayName}</div>
                                                <div className="text-[10px] text-slate-400 font-mono">{item.lon.toFixed(6)}, {item.lat.toFixed(6)}</div>
                                            </button>
                                        </div>
                                    ))}
                                    {locationError && <div className="px-3 py-2 text-[11px] text-amber-600">{locationError}</div>}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* 地图操作与场景设计保持一致：全屏/缩放/底图切换 */}
                    <div className="absolute bottom-12 right-4 flex flex-col items-end gap-3 z-[500] animate-slideUp">
                        <div className="flex flex-col gap-2 pointer-events-auto">
                            <MapToolBtn icon={<Globe size={14} />} label={dimension === '2D' ? '切换到3D' : '切换到2D'} onClick={toggleDimension}>
                                <span className="absolute -left-9 min-w-7 text-center px-1.5 py-0.5 rounded-md bg-slate-900/85 text-white text-[10px] font-black tracking-wide">
                                    {dimension}
                                </span>
                            </MapToolBtn>
                            <MapToolBtn icon={<RotateCcw size={14} />} label="地图复位" onClick={handleResetMap} />
                            <MapToolBtn
                                icon={isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />}
                                label={isFullscreen ? '退出全屏' : '全屏'}
                                onClick={toggleFullscreen}
                            />
                            <MapToolBtn icon={<Plus size={14} />} label="地图放大" onClick={handleZoomIn} />
                            <MapToolBtn icon={<Minus size={14} />} label="地图缩小" onClick={handleZoomOut} />
                        </div>
                        <MiniBaseMapSwitcher
                            activeId={baseMap}
                            enabledIds={['roadmap', 'satellite', 'terrain']}
                            onSelect={(id) => setBaseMap(id as SpatialBaseMap)}
                        />
                    </div>

                    {/* 空间信息条 */}
                    <div className="absolute bottom-0 left-0 right-0 h-9 bg-white/85 backdrop-blur-xl border-t border-slate-200/60 z-[500] flex items-center px-4 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] pointer-events-none">
                        <div className="flex-1 flex items-center divide-x divide-slate-200 h-5">
                            <div className="flex items-center gap-1.5 px-4 first:pl-0">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">层级:</span>
                                <span className="text-sm font-black text-blue-600 font-mono tracking-tight">{currentZoom}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">经度:</span>
                                <span className="text-xs font-black text-emerald-600 font-mono tracking-tighter">{pointerLonLat.lon.toFixed(6)}°E</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">纬度:</span>
                                <span className="text-xs font-black text-emerald-600 font-mono tracking-tighter">{pointerLonLat.lat.toFixed(6)}°N</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">高程:</span>
                                <span className="text-xs font-black text-amber-600 font-mono tracking-tighter">24.5 m</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">维度:</span>
                                <span className="text-xs font-black text-violet-600 font-mono tracking-tighter">{dimension}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">底图:</span>
                                <span className="text-xs font-black text-slate-800 tracking-tight">{BASE_MAP_LABEL[baseMap]}</span>
                            </div>
                        </div>
                        <div className="ml-auto flex items-center gap-4 divide-x divide-slate-200 h-5">
                            <button
                                type="button"
                                onClick={() => {
                                    if (!chartItemId && pagedResults[0]) {
                                        inspectResultItem(pagedResults[0].id);
                                        return;
                                    }
                                    setChartPanelOpen(prev => !prev);
                                }}
                                className={`px-3 h-6 rounded-md border text-[11px] font-bold pointer-events-auto transition-colors ${
                                    chartPanelOpen
                                        ? 'border-blue-500 bg-blue-50 text-blue-600'
                                        : 'border-slate-200 bg-white text-slate-500 hover:border-blue-200 hover:text-blue-600'
                                }`}
                                title="图表视图"
                            >
                                图表视图
                            </button>
                            <div className="px-4 flex items-center">
                                <span className="text-[10px] font-black text-slate-300 font-mono tracking-widest">EPSG:4326</span>
                            </div>
                        </div>
                    </div>
                </div>
                </div>
            </div>

        </div>
    );
};

// Internal Components
const AreaTab: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`flex-1 py-1.5 text-[12px] font-bold rounded-md transition-all ${active ? 'bg-white text-blue-600 shadow-sm border border-slate-100' : 'text-slate-500 hover:text-slate-700'}`}
    >
        {label}
    </button>
);

const DrawTool: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
    <div className="flex flex-col items-center gap-0.5 group cursor-pointer">
        <div className="w-10 h-10 border border-slate-300 rounded-md flex items-center justify-center text-slate-500 group-hover:text-blue-600 group-hover:border-blue-500 group-hover:bg-blue-50/60 transition-all shadow-sm">
            {icon}
        </div>
        <span className="text-[8px] font-bold text-slate-500 group-hover:text-slate-800">{label}</span>
    </div>
);

const CoordInput: React.FC<{ label: string; value: string; onChange: (v: string) => void }> = ({ label, value, onChange }) => (
    <div className="space-y-1">
        <label className="block text-[11px] font-semibold text-slate-600">{label}</label>
        <input
            type="number"
            step="0.000001"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full h-8 px-2 rounded-md border border-slate-200 text-[12px] text-slate-700 outline-none focus:border-blue-400"
            placeholder="0.000000"
        />
    </div>
);

const MapToolBtn: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; children?: React.ReactNode }> = ({ icon, label, onClick, children }) => (
    <button
        onClick={onClick}
        className="relative w-9 h-9 bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-xl shadow-xl flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-white transition-all ring-1 ring-slate-900/5 pointer-events-auto"
        title={label}
    >
        {icon}
        {children}
    </button>
);
