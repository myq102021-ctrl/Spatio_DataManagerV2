import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
    Layers, 
    Database, 
    Map as MapIcon, 
    Monitor, 
    Columns, 
    Grid, 
    HelpCircle, 
    PlusCircle,
    Plus,
    Minus,
    Search,
    ChevronDown,
    FolderPlus,
    Folder, 
    FolderOpen,
    ChevronRight,
    Trash2,
    Edit3,
    X,
    Globe,
    FileText,
    GripVertical,
    LayoutGrid,
    List,
    Calculator,
    PieChart,
    BarChart2,
    TrendingUp,
    Layout,
    Table,
    ChevronLeft,
    CheckCircle2,
    Undo2,
    Zap,
    Printer,
    Compass,
    Calendar,
    Download,
    User,
    Eye,
    EyeOff,
    Link2,
    Share2,
    Tag as TagIcon,
    Clock,
    Ruler,
    Pentagon,
    AlertTriangle,
    Rocket,
    Save,
    Settings2,
    Palette,
    HardDrive,
    Info,
    Check,
    MoreVertical,
    MapPin,
    PenTool,
    Type,
    Circle as LucideCircle,
    Dot,
    SlidersHorizontal,
    Eye as EyeIcon,
    Heart,
    MousePointer2,
    PanelRightClose,
    PanelRightOpen,
    PanelLeftOpen,
    PanelLeftClose,
    ChevronLeft as ChevronLeftIcon,
    Split,
    ScrollText,
    Copyright,
    Sliders,
    ListFilter,
    PlayCircle,
    Maximize,
    Minimize
} from 'lucide-react';
import { TimePlayerProvider } from '../modules/timePlayer/TimePlayerContext';
import { TimePlayer } from '../modules/timePlayer/TimePlayer';
import { ScenePreview } from '../modules/preview/ScenePreview';
import { MiniBaseMapSwitcher } from './MiniBaseMapSwitcher';
// 导入卷帘插件
import { MapSwipePlugin } from '../modules/swipe/MapSwipePlugin';
import { MarketNode } from '../types';
import { 
    ResponsiveContainer, 
    BarChart, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    Bar,
    Cell,
    LabelList
} from 'recharts';

interface LayerNode {
    id: string;
    label: string;
    type: 'folder' | 'layer';
    children?: LayerNode[];
    isExpanded?: boolean;
    sourceId?: string;
    isVisible?: boolean;
    /** 业务表数据无法在地图上加载，点击显隐时唤起图表视图 */
    layerSourceType?: 'map' | 'businessTable';
}

interface DrawnFeature {
    id: string;
    type: 'point' | 'line' | 'polygon' | 'circle' | 'text';
    coords: string;
    /** 标绘名称（用于图层列表和标注展示） */
    name: string;
    /** 默认保存在全部图层目录根目录（root-all），也可挂到用户选中的其他目录或图层所在目录 */
    folderId: string;
}

export interface SummaryIndicator {
    id: string;
    config: {
        title: string;
        value: string;
        unit: string;
        layerId: string;
        fieldId: string;
        color: string;
        width?: number;
        height?: number;
    };
    position: { top: number; left?: number; right?: number };
}

export interface BarChartIndicator {
    id: string;
    config: {
        title: string;
        layerId: string;
        fieldId: string;
        categoryFieldId: string;
        sortOrder: 'asc' | 'desc';
        color: string;
        unit?: string;
        xAxisLabel?: string;
        yAxisLabel?: string;
        width?: number;
        height?: number;
    };
    position: { top: number; left?: number; right?: number };
}

interface DataProduct {
    id: string;
    name: string;
    source: string;
    thumbnail: string;
    category: 'service' | 'data';
    theme?: string;
    serviceType?: '时空数据服务点影像' | '时空数据服务点矢量' | '业务数据服务点业务表';
}

// --- Legend System Interfaces ---
interface LegendStyle {
    color: string;
    size?: number;
    opacity?: number;
    strokeColor?: string;
    strokeWidth?: number;
    lineType?: 'solid' | 'dashed' | 'dotted';
    shape?: 'circle' | 'square' | 'triangle';
}

interface LegendEntry {
    id: string;
    label: string;
    type: 'POINT' | 'LINE' | 'POLYGON';
    style: LegendStyle;
    isHidden: boolean;
}

interface LayerLegendGroup {
    layerId: string;
    layerName: string;
    entries: LegendEntry[];
}

interface RasterBandMeta {
    index: number;
    name: string;
    min: number;
    max: number;
}

interface GradeBreak {
    id: string;
    min: number;
    max: number;
    label: string;
    color: string;
    count: number;
}

interface LayerStyleSettings {
    layerType: 'raster' | 'vector';
    raster?: {
        renderType: 'single' | 'rgb';
        colorBandMode: 'Linear' | 'Equal Interval';
        rBand: number;
        gBand: number;
        bBand: number;
        opacity: number;
    };
    vector?: {
        styleMode: '单一色' | '分层设色';
        // 单一色
        singleFillColor?: string;
        singleStrokeColor?: string;
        singleStrokeWidth?: number;
        // 分层设色
        field?: string;
        classifyMethod?: '自然间断点' | '等间距' | '分位数' | '标准差';
        classCount?: number;
        colorSchemeIndex?: number;
        grades?: GradeBreak[];
    };
}

const MOCK_SERVICES: DataProduct[] = [
    // mock 三类服务数据：影像 / 矢量 / 业务表
    { id: 's-1', name: '全球影像瓦片服务 (WMTS)', source: '全球影像服务', thumbnail: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=100&q=80', category: 'service', serviceType: '时空数据服务点影像' },
    { id: 's-4', name: '湖北省GF-2真彩影像 (2025Q1)', source: '卫星遥感中心', thumbnail: 'https://images.unsplash.com/photo-1472396961693-142e6e269027?auto=format&fit=crop&w=100&q=80', category: 'service', serviceType: '时空数据服务点影像', theme: '遥感影像' },
    { id: 's-5', name: 'Sentinel-2 多光谱影像 (10m)', source: '欧空局公开数据', thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=100&q=80', category: 'service', serviceType: '时空数据服务点影像', theme: '多光谱' },
    { id: 's-6', name: '武汉市夜光遥感栅格 (VIIRS)', source: '城市监测专题库', thumbnail: 'https://images.unsplash.com/photo-1419833479618-c5957102ed6d?auto=format&fit=crop&w=100&q=80', category: 'service', serviceType: '时空数据服务点影像', theme: '夜光监测' },
    { id: 's-7', name: 'DEM高程栅格 (30m)', source: '基础地形数据库', thumbnail: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=100&q=80', category: 'service', serviceType: '时空数据服务点影像', theme: '地形高程' },
    { id: 's-2', name: '全国道路矢量服务 (WFS)', source: '基础地理服务', thumbnail: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=100&q=80', category: 'service', serviceType: '时空数据服务点矢量' },
    { id: 's-3', name: '企业监管业务表服务', source: '业务数据服务', thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=100&q=80', category: 'service', serviceType: '业务数据服务点业务表' },
];

const MOCK_DATA_PRODUCTS: DataProduct[] = [
    { id: 'd-1', name: '黄石市土地利用栅格 (2024)', source: '自然资源数据库', thumbnail: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=100&q=80', category: 'data', serviceType: '时空数据服务点影像', theme: '土地利用' },
    { id: 'd-2', name: '长江流域NDVI指数栅格', source: '生态监测库', thumbnail: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=100&q=80', category: 'data', serviceType: '时空数据服务点影像', theme: '生态指数' },
    { id: 'd-3', name: '武汉市热力温度栅格', source: '城市体检专题库', thumbnail: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=100&q=80', category: 'data', serviceType: '时空数据服务点影像', theme: '热岛分析' }
];

export interface TimePointConfig {
    id: string;
    time: string;
    layerId: string;
}

export interface TimePlayerConfig {
    timePoints: TimePointConfig[];
}

interface MapScene {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    tags: string[];
    isFavorite: boolean;
    isPublic?: boolean;
    status: 'published' | 'draft';
    theme?: string;
    // 场景配置数据
    layerTree?: LayerNode[];
    drawnFeatures?: DrawnFeature[];
    zoom?: number;
    mapCenter?: { lat: number; lon: number };
    activeBaseMap?: string;
    enabledBaseMaps?: string[];
    defaultBaseMap?: string;
    dimension?: '2D' | '3D';
    splitMode?: '1' | '2' | '4' | '16';
    isTimePlayerDropped?: boolean;
    timePlayerConfig?: TimePlayerConfig;
    legends?: LayerLegendGroup[];
}

// --- Scene thumbnail snapshot (layers only) ---
const getVisibleLayerLabelsFromTree = (nodes: LayerNode[] | undefined): string[] => {
    if (!nodes) return [];
    const labels: string[] = [];
    const walk = (arr: LayerNode[]) => {
        arr.forEach(n => {
            if (n.type === 'layer' && n.isVisible !== false) labels.push(n.label);
            if (n.children) walk(n.children);
        });
    };
    walk(nodes);
    return labels;
};

const buildLayersOnlySnapshotDataUrl = (layerLabels: string[]): string => {
    // A lightweight SVG snapshot so we don't need extra dependencies.
    // Only depicts layers (no UI), suitable for dashboard thumbnails.
    const w = 640;
    const h = 360;
    const hasLandcover = layerLabels.some(l => l.includes('地表覆盖') || l.includes('土地利用'));
    const hasRiver = layerLabels.some(l => l.includes('水网') || l.includes('河') || l.includes('湖'));

    const chips = layerLabels.slice(0, 6).map((l, i) => {
        const x = 18 + (i % 3) * 200;
        const y = 18 + Math.floor(i / 3) * 34;
        return `<g>
  <rect x="${x}" y="${y}" rx="10" ry="10" width="180" height="26" fill="rgba(255,255,255,0.85)" stroke="rgba(148,163,184,0.35)" />
  <text x="${x + 12}" y="${y + 17}" font-size="12" font-weight="700" fill="#334155">${l.replace(/&/g, '&amp;').replace(/</g, '&lt;')}</text>
</g>`;
    }).join('');

    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#0b1220"/>
      <stop offset="1" stop-color="#172554"/>
    </linearGradient>
    <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
      <feDropShadow dx="0" dy="8" stdDeviation="12" flood-color="#000" flood-opacity="0.25"/>
    </filter>
  </defs>
  <rect width="${w}" height="${h}" fill="url(#bg)"/>
  ${hasLandcover ? `
  <g filter="url(#soft)">
    <path d="M110 210 C160 120, 300 90, 400 140 C470 175, 520 260, 460 300 C380 355, 210 330, 140 285 C100 260, 85 235, 110 210 Z"
          fill="rgba(16,185,129,0.28)" stroke="rgba(16,185,129,0.65)" stroke-width="2"/>
    ${Array.from({ length: 14 }).map((_, i) => {
        const x = 220 + (i % 7) * 32;
        const y = 160 + Math.floor(i / 7) * 28;
        const colors = ['rgba(16,185,129,0.65)','rgba(245,158,11,0.65)','rgba(59,130,246,0.65)','rgba(244,63,94,0.65)','rgba(100,116,139,0.65)','rgba(139,92,246,0.65)'];
        const c = colors[i % colors.length];
        return `<rect x="${x}" y="${y}" width="26" height="22" rx="4" fill="${c}" opacity="0.75"/>`;
    }).join('')}
  </g>` : ''}
  ${hasRiver ? `
  <path d="M60 250 C140 210, 210 280, 290 240 C360 205, 420 250, 510 220 C560 204, 600 220, 620 210"
        fill="none" stroke="rgba(59,130,246,0.75)" stroke-width="10" stroke-linecap="round"/>
  <path d="M80 255 C150 225, 220 285, 300 250 C380 220, 430 260, 520 235"
        fill="none" stroke="rgba(96,165,250,0.75)" stroke-width="5" stroke-linecap="round" opacity="0.85"/>` : ''}
  <g>${chips}</g>
  ${layerLabels.length > 6 ? `<text x="18" y="${h - 20}" font-size="12" font-weight="700" fill="rgba(226,232,240,0.75)">+${layerLabels.length - 6} more…</text>` : ''}
</svg>`;

    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
};

const getSceneLayersOnlyThumbnail = (scene: MapScene): string => {
    const labels = getVisibleLayerLabelsFromTree(scene.layerTree);
    // If scene has no layerTree, fall back to existing thumbnail.
    if (!labels.length) return scene.thumbnail;
    return buildLayersOnlySnapshotDataUrl(labels);
};

const INITIAL_SCENES: MapScene[] = [
    {
        id: '1',
        title: '大冶市耕地提取数据',
        description: '基于 2024 年度高分辨率遥感影像，利用深度学习语义分割模型，精准提取大冶市全域范围内的耕地空间分布图层。本数据集包含了高精度的矢量边界，支持农业产量预估与流失监测。',
        thumbnail: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=600&q=80',
        tags: ['农业监测', '大冶市', '深度学习'],
        isFavorite: false,
        isPublic: true,
        status: 'published',
        theme: '土地利用监测'
    },
    {
        id: '2',
        title: '武汉市黑臭水体分布图',
        description: '结合多源卫星遥感影像与地面水质监测点数据，动态反演武汉市重点河湖黑臭水体分级情况，支持治理效果评估。包含多时序对比图层，通过空间分析技术实现污染源精准定位。',
        thumbnail: 'https://images.unsplash.com/photo-1592210454359-9043f067919b?auto=format&fit=crop&w=600&q=80',
        tags: ['环境保护', '武汉市', '遥感反演'],
        isFavorite: false,
        isPublic: true,
        status: 'draft',
        theme: '生态环境监测'
    },
    {
        id: '3',
        title: '北京市执法巡检成果',
        description: '集成无人机航测与实景三维技术，展示北京市自然资源执法巡检最新专题成果...',
        thumbnail: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=600&q=80',
        tags: ['城市治理', '北京市', '无人机航测'],
        isFavorite: true,
        isPublic: true,
        status: 'published',
        theme: '应急指挥调度'
    },
    {
        id: '5',
        title: '西部大开发矿区沉降监测',
        description: '采用 InSAR 合成孔径雷达干适应测量技术，对西部大型露天矿区进行毫米级形变监测，识别潜在的滑坡与地裂缝风险区。数据包含年度累计形变速率图及重点风险点预警信息。',
        thumbnail: 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80',
        tags: ['地质灾害', 'InSAR', '矿产资源'],
        isFavorite: false,
        isPublic: true,
        status: 'draft',
        theme: '自然资源监管'
    },
    {
        id: '6',
        title: '长江流域非法采砂动态监管',
        description: '对接实时 AIS 船舶数据与哨兵二号卫星影像，通过多模态融合识别采砂船异常聚集区，实现长江干流非法采砂行为的自动化全天候监管。',
        thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=600&q=80',
        tags: ['水利监管', 'AIS', '目标识别'],
        isFavorite: true,
        isPublic: true,
        status: 'published',
        theme: '河道采砂监管'
    }
];

export const DataSmartMapPanel: React.FC<{ onBack?: () => void, marketTree?: MarketNode[] }> = ({ onBack, marketTree = [] }) => {
  const [view, setView] = useState<'dashboard' | 'editor' | 'mapping'>('dashboard');
  const [activeLayersForMapping, setActiveLayersForMapping] = useState<string[]>([]);
  const [drawnFeaturesForMapping, setDrawnFeaturesForMapping] = useState<DrawnFeature[]>([]);
  const [currentLegends, setCurrentLegends] = useState<LayerLegendGroup[]>([]);
  const [scenes, setScenes] = useState<MapScene[]>(INITIAL_SCENES);
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
  const [editingScene, setEditingScene] = useState<MapScene | null>(null);
  const [sceneToDelete, setSceneToDelete] = useState<MapScene | null>(null);
  const [currentEditingScene, setCurrentEditingScene] = useState<MapScene | null>(null);
  const [startInPreview, setStartInPreview] = useState(false);

  const handleDesign = (scene: MapScene) => {
    setCurrentEditingScene(scene);
    setStartInPreview(false);
    setView('editor');
  };

  const handlePreview = (scene: MapScene) => {
    setCurrentEditingScene(scene);
    setStartInPreview(true);
    setView('editor');
  };

  const handleUpdateScene = (sceneId: string, data: Partial<MapScene>) => {
    setScenes(prev => prev.map(s => s.id === sceneId ? { ...s, ...data } : s));
  };

  const handlePublish = (scene: MapScene) => {
    setEditingScene(scene);
    setIsPublishModalOpen(true);
  };

  const handleUnpublish = (scene: MapScene) => {
    setScenes(prev => prev.map(s => (
      s.id === scene.id ? { ...s, status: 'draft', isPublic: false } : s
    )));
  };

  const handleEdit = (scene: MapScene) => {
    setEditingScene(scene);
    setIsPublishModalOpen(true);
  };

  const handleDelete = (scene: MapScene) => {
    setSceneToDelete(scene);
  };

  const confirmDelete = () => {
    if (sceneToDelete) {
        setScenes(prev => prev.filter(s => s.id !== sceneToDelete.id));
        setSceneToDelete(null);
    }
  };

  const handlePublishConfirm = (data: { name: string; theme: string; tags: string[] }) => {
    if (editingScene) {
        setScenes(prev => prev.map(s => s.id === editingScene.id ? {
            ...s,
            title: data.name,
            theme: data.theme,
            tags: data.tags,
            status: 'published' as const
        } : s));
    }
    setIsPublishModalOpen(false);
    setEditingScene(null);
  };

  if (view === 'dashboard') {
      return (
        <>
            <SmartMapDashboard 
                scenes={scenes} 
                onCreate={() => {
                    setCurrentEditingScene(null);
                    setStartInPreview(false);
                    setView('editor');
                }} 
                onDesign={handleDesign}
                onPublish={handlePublish}
                onUnpublish={handleUnpublish}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPreview={handlePreview}
            />
            {isPublishModalOpen && (
                <PublishModal 
                    onClose={() => { setIsPublishModalOpen(false); setEditingScene(null); }} 
                    onConfirm={handlePublishConfirm}
                    initialData={editingScene || undefined}
                />
            )}
            {sceneToDelete && (
                <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
                    <div className="bg-white rounded-2xl shadow-2xl w-[400px] border border-slate-200 overflow-hidden animate-zoomIn">
                        <div className="p-8 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-5 ring-4 ring-red-50/50">
                                <AlertTriangle size={32} />
                            </div>
                            <h3 className="text-lg font-black text-slate-800 mb-2">删除场景确认</h3>
                            <p className="text-[14px] text-slate-500 leading-relaxed">
                                您确定要删除该场景吗？<br/>
                                <span className="font-bold text-slate-700 italic">"{sceneToDelete.title}"</span>
                            </p>
                        </div>
                        <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex justify-center gap-3">
                            <button onClick={() => setSceneToDelete(null)} className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-black hover:bg-slate-50 transition-all">取消</button>
                            <button onClick={confirmDelete} className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-sm font-black shadow-lg shadow-red-200 hover:bg-red-700 transition-all">确定删除</button>
                        </div>
                    </div>
                </div>
            )}
        </>
      );
  }
  
  if (view === 'mapping') {
      return <ThematicMappingPanel 
        activeLayers={activeLayersForMapping} 
        drawnFeatures={drawnFeaturesForMapping} 
        legends={currentLegends}
        onBack={() => setView('editor')} 
      />;
  }

  return <SmartMapEditor 
            initialScene={currentEditingScene || undefined}
            initialPreviewOpen={startInPreview}
            onBack={() => {
                setCurrentEditingScene(null);
                setStartInPreview(false);
                setView('dashboard');
            }} 
            onSaveDraft={(newScene) => {
                if (currentEditingScene) {
                    handleUpdateScene(currentEditingScene.id, newScene);
                } else {
                    setScenes(prev => [newScene, ...prev]);
                }
                setView('dashboard');
            }}
            onPublishSuccess={(newScene) => {
                if (currentEditingScene) {
                    handleUpdateScene(currentEditingScene.id, { ...newScene, status: 'published' });
                } else {
                    setScenes(prev => [{ ...newScene, status: 'published' }, ...prev]);
                }
                setView('dashboard');
            }}
            onUpdateScene={(data) => {
                if (currentEditingScene) {
                    handleUpdateScene(currentEditingScene.id, data);
                }
            }}
            onGoMapping={(layers, drawn, legends) => {
                setActiveLayersForMapping(layers);
                setDrawnFeaturesForMapping(drawn);
                setCurrentLegends(legends);
                setView('mapping');
            }}
            marketTree={marketTree}
         />;
};

// --- Dashboard View Components ---

interface DashboardProps {
    scenes: MapScene[];
    onCreate: () => void;
    onDesign: (scene: MapScene) => void;
    onPublish: (scene: MapScene) => void;
    onUnpublish: (scene: MapScene) => void;
    onEdit: (scene: MapScene) => void;
    onDelete: (scene: MapScene) => void;
    onPreview: (scene: MapScene) => void;
}

const SmartMapDashboard: React.FC<DashboardProps> = ({ scenes, onCreate, onDesign, onPublish, onUnpublish, onEdit, onDelete, onPreview }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const filteredScenes = useMemo(() => {
        const q = searchQuery.trim().toLowerCase();
        if (!q) return scenes;
        return scenes.filter(scene => {
            const title = (scene.title || '').toLowerCase();
            const desc = (scene.description || '').toLowerCase();
            const tags = (scene.tags || []).join(' ').toLowerCase();
            return title.includes(q) || desc.includes(q) || tags.includes(q);
        });
    }, [scenes, searchQuery]);

    return (
        <div className="flex-1 flex flex-col h-full bg-[#f4f7f9] animate-fadeIn overflow-y-auto text-slate-800">
            <div className="bg-white border-b border-slate-200 px-8 py-5 flex items-center justify-between sticky top-0 z-30 shadow-sm">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-600 text-white rounded-lg shadow-lg shadow-blue-100">
                        <MapIcon size={20} />
                    </div>
                    <h1 className="text-lg font-black tracking-tight text-slate-900 uppercase">地图场景设计</h1>
                </div>
                
                <div className="flex items-center gap-4 flex-1 max-w-xl ml-12">
                    <div className="relative flex-1 group">
                        <input 
                            type="text" 
                            placeholder="搜索我的地图场景..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full h-10 pl-11 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                        />
                        <Search className="absolute left-4 top-2.5 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={16} />
                    </div>
                </div>

                <div className="flex items-center gap-3 ml-4">
                    <button className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl transition-all">
                        <HelpCircle size={20} />
                    </button>
                </div>
            </div>

            <div className="p-8 max-w-[1600px] mx-auto w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                    <div 
                        onClick={onCreate}
                        className="group bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-[280px]"
                    >
                        <div className="flex-1 bg-slate-50 relative overflow-hidden flex items-center justify-center p-4">
                            <img 
                                src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/BlankMap-World.svg/1024px-BlankMap-World.svg.png" 
                                className="absolute inset-0 w-full h-full object-cover opacity-10 grayscale" 
                                alt=""
                            />
                            <div className="absolute inset-0 bg-gradient-to-b from-white/40 to-transparent"></div>
                            <div className="z-10 bg-blue-600 hover:bg-blue-700 text-white px-8 py-2.5 rounded-lg font-black text-sm shadow-xl shadow-blue-100 transition-all active:scale-95">
                                创建地图
                            </div>
                        </div>
                        <div className="h-14 bg-white px-6 flex items-center justify-center border-t border-slate-100">
                             <span className="text-slate-400 text-[12px] font-bold uppercase tracking-widest">创建新的地图可视化场景</span>
                        </div>
                    </div>

                    {filteredScenes.map((scene) => (
                        <div key={scene.id} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col h-[280px] group/card">
                            <div className="h-32 relative bg-slate-100 overflow-hidden">
                                <img src={getSceneLayersOnlyThumbnail(scene)} alt={scene.title} className="w-full h-full object-cover opacity-95 group-hover/card:scale-105 transition-transform duration-500" />
                                <div className="absolute top-2 right-2">
                                    {scene.status === 'published' ? (
                                        <span className="px-2 py-0.5 bg-blue-600 text-white text-[10px] font-black rounded-md shadow-sm border border-white/20 flex items-center gap-1 animate-fadeIn">
                                            <CheckCircle2 size={10} /> 已发布
                                        </span>
                                    ) : (
                                        <span className="px-2 py-0.5 bg-slate-500 text-white text-[10px] font-black rounded-md shadow-sm border border-white/20 flex items-center gap-1 animate-fadeIn">
                                            <Clock size={10} /> 未发布
                                        </span>
                                    )}
                                </div>
                                <div className="absolute inset-0 bg-slate-900/10 opacity-0 group-hover/card:opacity-100 transition-opacity"></div>
                            </div>
                            <div className="p-4 flex-1 flex flex-col gap-2">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-[14px] font-black text-slate-800 truncate tracking-tight group-hover/card:text-blue-600 transition-colors">{scene.title}</h3>
                                    {scene.isFavorite && <Heart size={12} className="text-rose-500 fill-rose-500" />}
                                </div>
                                <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed mb-2 font-medium">{scene.description}</p>
                                <div className="flex flex-wrap gap-1.5 h-5 overflow-hidden">
                                    {scene.tags.map(tag => (
                                        <span key={tag} className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-[9px] text-slate-500 font-bold whitespace-nowrap">{tag}</span>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-auto border-t border-slate-100 grid grid-cols-5 divide-x divide-slate-100 bg-[#fcfdfe]">
                                <button onClick={() => onPreview(scene)} className="py-2.5 text-[11px] font-black text-blue-600 hover:bg-blue-50/50 transition-colors uppercase tracking-tight flex items-center justify-center gap-1" title="查看">
                                    <Eye size={12} /> 查看
                                </button>
                                <button onClick={() => onDesign(scene)} className="py-2.5 text-[11px] font-black text-blue-600 hover:bg-blue-50/50 transition-colors uppercase tracking-tight flex items-center justify-center gap-1" title="设计">
                                    <Palette size={12} /> 设计
                                </button>
                                <button
                                    onClick={() => scene.status === 'published' ? onUnpublish(scene) : onPublish(scene)}
                                    className={`py-2.5 text-[11px] font-black transition-colors uppercase tracking-tight flex items-center justify-center gap-1 ${
                                        scene.status === 'published'
                                            ? 'text-amber-600 hover:bg-amber-50/60'
                                            : 'text-blue-600 hover:bg-blue-50/50'
                                    }`}
                                    title={scene.status === 'published' ? '取消发布' : '发布'}
                                >
                                    {scene.status === 'published' ? <Undo2 size={12} /> : <Rocket size={12} />}
                                    {scene.status === 'published' ? '取消发布' : '发布'}
                                </button>
                                <button onClick={() => onEdit(scene)} className="py-2.5 text-[11px] font-black text-blue-600 hover:bg-blue-50/50 transition-colors uppercase tracking-tight flex items-center justify-center gap-1" title="编辑">
                                    <Settings2 size={12} /> 编辑
                                </button>
                                <button onClick={() => onDelete(scene)} className="py-2.5 text-[11px] font-black text-red-500 hover:bg-red-50/50 transition-colors uppercase tracking-tight flex items-center justify-center gap-1" title="删除">
                                    <Trash2 size={12} /> 删除
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
                {filteredScenes.length === 0 && (
                    <div className="py-16 text-center text-slate-400">
                        <div className="text-sm font-bold">未找到匹配的场景</div>
                        <div className="text-xs font-medium mt-2">可按场景名称、标签或描述进行搜索</div>
                    </div>
                )}
            </div>
        </div>
    );
};

// --- Editor View Components ---

/**
 * TableView Component for displaying layer/feature data
 */
export const TableView = ({ layerId, featureId, onClose }: { layerId: string | null, featureId: string | null, onClose: () => void }) => {
    const [currentPage, setCurrentPage] = useState(1);
    const pageSize = 10;

    const data = useMemo(() => {
        const rows = [];
        const count = 50;
        const prefix = layerId ? `L-${layerId}` : featureId ? `F-${featureId}` : 'DATA';
        
        for (let i = 1; i <= count; i++) {
            rows.push({
                id: i,
                name: `${prefix} Item ${i}`,
                value: Math.floor(Math.random() * 1000),
                status: i % 2 === 0 ? 'Active' : 'Pending',
                timestamp: new Date().toISOString().split('T')[0],
                category: ['A', 'B', 'C'][i % 3]
            });
        }
        return rows;
    }, [layerId, featureId]);

    const paginatedData = data.slice((currentPage - 1) * pageSize, currentPage * pageSize);
    const totalPages = Math.ceil(data.length / pageSize);

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="h-10 border-b border-slate-100 flex items-center justify-between px-4 bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <Table size={14} className="text-blue-600" />
                    <span className="text-[11px] font-black text-slate-700 uppercase tracking-wider">
                        数据详情: {layerId ? `图层 ${layerId}` : featureId ? `组件 ${featureId}` : '未选择'}
                    </span>
                </div>
                <button onClick={onClose} className="p-1 hover:bg-slate-200 rounded-md transition-all">
                    <X size={14} className="text-slate-400" />
                </button>
            </div>
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left border-collapse">
                    <thead className="sticky top-0 bg-white z-10">
                        <tr className="border-b border-slate-100">
                            <th className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                            <th className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">名称</th>
                            <th className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">数值</th>
                            <th className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">状态</th>
                            <th className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">分类</th>
                            <th className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">时间</th>
                        </tr>
                    </thead>
                    <tbody>
                        {paginatedData.map(row => (
                            <tr key={row.id} className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors group">
                                <td className="px-4 py-2 text-xs font-mono text-slate-500">{row.id}</td>
                                <td className="px-4 py-2 text-xs font-bold text-slate-700">{row.name}</td>
                                <td className="px-4 py-2 text-xs font-mono text-blue-600 font-bold">{row.value}</td>
                                <td className="px-4 py-2">
                                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${row.status === 'Active' ? 'bg-emerald-100 text-emerald-600' : 'bg-amber-100 text-amber-600'}`}>
                                        {row.status}
                                    </span>
                                </td>
                                <td className="px-4 py-2 text-xs font-bold text-slate-500">{row.category}</td>
                                <td className="px-4 py-2 text-xs text-slate-400">{row.timestamp}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            <div className="h-10 border-t border-slate-100 flex items-center justify-between px-4 bg-slate-50/30">
                <span className="text-[10px] font-bold text-slate-400">共 {data.length} 条数据</span>
                <div className="flex items-center gap-1">
                    <button 
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                        className="p-1 disabled:opacity-30 hover:bg-slate-200 rounded transition-all"
                    >
                        <ChevronLeft size={14} />
                    </button>
                    <span className="text-[10px] font-black text-slate-600 px-2">
                        {currentPage} / {totalPages}
                    </span>
                    <button 
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="p-1 disabled:opacity-30 hover:bg-slate-200 rounded transition-all"
                    >
                        <ChevronRight size={14} />
                    </button>
                </div>
            </div>
        </div>
    );
};

const SmartMapEditor: React.FC<{ 
    initialScene?: MapScene;
    initialPreviewOpen?: boolean;
    onBack: () => void; 
    onSaveDraft: (scene: MapScene) => void;
    onPublishSuccess: (scene: MapScene) => void;
    onUpdateScene: (data: Partial<MapScene>) => void;
    onGoMapping: (layers: string[], drawn: DrawnFeature[], legends: LayerLegendGroup[]) => void;
    marketTree?: MarketNode[];
}> = ({ initialScene, initialPreviewOpen = false, onBack, onSaveDraft, onPublishSuccess, onUpdateScene, onGoMapping, marketTree = [] }) => {
    const [layerTree, setLayerTree] = useState<LayerNode[]>(initialScene?.layerTree || [
        { id: 'root-all', label: '全部图层目录', type: 'folder', isExpanded: true, children: [
            { id: 'lyr-1', label: '地表覆盖分类', type: 'layer', isVisible: true },
            { id: 'lyr-2', label: '水网分布要素', type: 'layer', isVisible: false }
        ] }
    ]);
    const [drawnFeatures, setDrawnFeatures] = useState<DrawnFeature[]>(initialScene?.drawnFeatures || []);
    const [activeEditorTab, setActiveEditorTab] = useState<'layers' | 'components' | 'analysis' | 'config'>('layers');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [dimension, setDimension] = useState<'2D' | '3D'>(initialScene?.dimension || '2D');
    const [splitMode, setSplitMode] = useState<'1' | '2' | '4' | '16'>(initialScene?.splitMode || '1');
    /** 分屏时每个视口独立选择加载的图层（未设置时该视口使用全部可见图层） */
    const [viewportLayerIds, setViewportLayerIds] = useState<Record<number, string[]>>({});
    const [openViewportDropdown, setOpenViewportDropdown] = useState<number | null>(null);
    const [activeTool, setActiveTool] = useState<string | null>(null);
    const [showSplitMenu, setShowSplitMenu] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isPublishModalOpen, setIsPublishModalOpen] = useState(false);
    const [isAddMethodModalOpen, setIsAddMethodModalOpen] = useState(false); 
    const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);
    const [isImportDataModalOpen, setIsImportDataModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('create');
    const [metadataModal, setMetadataModal] = useState<{ title: string; items: { label: string; labelEn?: string; value: React.ReactNode }[] } | null>(null);
    // 当前选中的节点（目录或图层）
    const [selectedFolderId, setSelectedFolderId] = useState<string>('root-all');
    // 当前标绘要素默认保存的目录（初始为全部图层目录根）
    const [currentDrawingFolderId, setCurrentDrawingFolderId] = useState<string>('root-all');
    const [modalInitialParentId, setModalInitialParentId] = useState<string>('');
    const [editingNode, setEditingNode] = useState<LayerNode | null>(null);
    const [sourcesHeight, setSourcesHeight] = useState(340);
    // 需求：仅保留“服务集市”，移除“数据列表”
    const [activeSourceTab, setActiveSourceTab] = useState<'service'>('service');
    const [searchQuery, setSearchQuery] = useState('');
    const [isSourceSearchVisible, setIsSourceSearchVisible] = useState(false);
    const [isTimePlayerDropped, setIsTimePlayerDropped] = useState(initialScene?.isTimePlayerDropped || false); 
    const [timePlayerConfig, setTimePlayerConfig] = useState<TimePlayerConfig>(initialScene?.timePlayerConfig || { timePoints: [] });
    const [summaryIndicators, setSummaryIndicators] = useState<SummaryIndicator[]>([]);
    const [barChartIndicators, setBarChartIndicators] = useState<BarChartIndicator[]>([]);
    const [activeComponentEditor, setActiveComponentEditor] = useState<{ type: 'summaryIndicator' | 'timePlayer' | 'barChart', id?: string } | null>(null);
    const [isLegendExpanded, setIsLegendExpanded] = useState(true);
    const [activeToolbarCategory, setActiveToolbarCategory] = useState<'measure' | 'plot' | null>(null); 
    const [isPreviewOpen, setIsPreviewOpen] = useState(initialPreviewOpen);
    const [enabledBaseMaps, setEnabledBaseMaps] = useState<string[]>(
        initialScene?.enabledBaseMaps ?? ['roadmap', 'satellite', 'hybrid']
    );
    const [defaultBaseMap, setDefaultBaseMap] = useState<string>(
        initialScene?.defaultBaseMap ?? initialScene?.activeBaseMap ?? 'hybrid'
    );
    const [activeBaseMap, setActiveBaseMap] = useState(
        initialScene?.activeBaseMap || initialScene?.defaultBaseMap || 'hybrid'
    );
    const [mapCenter, setMapCenter] = useState(initialScene?.mapCenter || { lat: 30.592, lon: 114.305 });
    const [isPanning, setIsPanning] = useState(false);
    const [draggingComponent, setDraggingComponent] = useState<{ type: 'indicator' | 'timePlayer', id?: string } | null>(null);
    const [resizingSummaryId, setResizingSummaryId] = useState<{ id: string; startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);
    const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });
    const [timePlayerPosition, setTimePlayerPosition] = useState<{ top?: number; left?: number; bottom?: number; right?: number }>({ bottom: 48, left: 40 });
    const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
    const [isTableViewOpen, setIsTableViewOpen] = useState(false);
    const [selectedLayerIdForTable, setSelectedLayerIdForTable] = useState<string | null>(null);
    const [selectedFeatureIdForTable, setSelectedFeatureIdForTable] = useState<string | null>(null);
    const [queryResult, setQueryResult] = useState<any | null>(null);
    
    // 标绘要素按目录过滤 & 编辑
    const getFolderFeatures = (folderId: string) => {
        return drawnFeatures.filter(f => f.folderId === folderId);
    };

    // 重命名采用列表内联编辑，避免浏览器 prompt 被拦截导致“不生效”
    const [editingFeatureId, setEditingFeatureId] = useState<string | null>(null);
    const [editingFeatureName, setEditingFeatureName] = useState<string>('');

    const handleStartRenameFeature = (id: string) => {
        const target = drawnFeatures.find(f => f.id === id);
        setEditingFeatureId(id);
        setEditingFeatureName(target?.name || '');
    };

    const handleCommitRenameFeature = () => {
        if (!editingFeatureId) return;
        const next = editingFeatureName.trim();
        if (!next) {
            setEditingFeatureId(null);
            setEditingFeatureName('');
            return;
        }
        setDrawnFeatures(prev => prev.map(f => f.id === editingFeatureId ? { ...f, name: next } : f));
        setEditingFeatureId(null);
        setEditingFeatureName('');
    };

    const handleCancelRenameFeature = () => {
        setEditingFeatureId(null);
        setEditingFeatureName('');
    };

    const handleDeleteFeature = (id: string) => {
        if (!window.confirm('确认删除该标绘要素？')) return;
        setDrawnFeatures(prev => prev.filter(f => f.id !== id));
    };

    // 新增：图层联动定位逻辑
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setActiveTool(null);
                setActiveToolbarCategory(null);
                setEditingFeatureId(null);
                setEditingFeatureName('');
            }
            if (e.key === 'Delete' && activeComponentEditor) {
                if (activeComponentEditor.type === 'summaryIndicator' && activeComponentEditor.id) {
                    setSummaryIndicators(prev => prev.filter(i => i.id !== activeComponentEditor.id));
                    setActiveComponentEditor(null);
                } else if (activeComponentEditor.type === 'timePlayer') {
                    setIsTimePlayerDropped(false);
                    setActiveComponentEditor(null);
                } else if (activeComponentEditor.type === 'barChart' && activeComponentEditor.id) {
                    setBarChartIndicators(prev => prev.filter(i => i.id !== activeComponentEditor.id));
                    setActiveComponentEditor(null);
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [activeComponentEditor]);

    useEffect(() => {
        if (selectedFolderId === 'lyr-1') {
            // 地表覆盖分类 - 定位到武汉市中心附近的一个区域
            setMapCenter({ lat: 30.589, lon: 114.302 });
            setZoom(13);
            // 自动开启可见性
            setLayerTree(prev => {
                const updateVisibility = (nodes: LayerNode[]): LayerNode[] => {
                    return nodes.map(node => {
                        if (node.id === 'lyr-1') return { ...node, isVisible: true };
                        if (node.children) return { ...node, children: updateVisibility(node.children) };
                        return node;
                    });
                };
                return updateVisibility(prev);
            });
        } else if (selectedFolderId === 'lyr-2') {
            // 水网分布要素 - 定位到长江大桥附近
            setMapCenter({ lat: 30.550, lon: 114.285 });
            setZoom(14);
            // 自动开启可见性
            setLayerTree(prev => {
                const updateVisibility = (nodes: LayerNode[]): LayerNode[] => {
                    return nodes.map(node => {
                        if (node.id === 'lyr-2') return { ...node, isVisible: true };
                        if (node.children) return { ...node, children: updateVisibility(node.children) };
                        return node;
                    });
                };
                return updateVisibility(prev);
            });
        }
    }, [selectedFolderId]);

    // 新增：检查图层可见性助手
    const isLayerVisible = (id: string) => {
        const findNode = (nodes: LayerNode[]): LayerNode | undefined => {
            for (const node of nodes) {
                if (node.id === id) return node;
                if (node.children) {
                    const found = findNode(node.children);
                    if (found) return found;
                }
            }
        };
        const node = findNode(layerTree);
        return node?.isVisible !== false;
    };

    // 新增：卷帘状态
    const [isSwipeActive, setIsSwipeActive] = useState(false);

    const sidebarRef = useRef<HTMLDivElement>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const isResizing = useRef(false);

    // --- Legend Logic State ---
    const [legends, setLegends] = useState<LayerLegendGroup[]>(initialScene?.legends || []);
    const [editingLegendEntry, setEditingLegendEntry] = useState<{ layerId: string, entryId: string } | null>(null);
    const [isStyleSettingsOpen, setIsStyleSettingsOpen] = useState(false);
    const [selectedStyleLayerId, setSelectedStyleLayerId] = useState('');
    const [layerStyleSettings, setLayerStyleSettings] = useState<Record<string, LayerStyleSettings>>({});
    const defaultLayerStylesRef = useRef<Record<string, { legend: LayerLegendGroup; style?: LayerStyleSettings }>>({});

    const [zoom, setZoom] = useState(initialScene?.zoom || 5);
    const [isFullscreen, setIsFullscreen] = useState(false);

    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            mapContainerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    const hasChanges = useMemo(() => {
        if (!initialScene) return layerTree.length > 0 || drawnFeatures.length > 0;
        
        return JSON.stringify(layerTree) !== JSON.stringify(initialScene.layerTree) ||
               JSON.stringify(drawnFeatures) !== JSON.stringify(initialScene.drawnFeatures) ||
               zoom !== initialScene.zoom ||
               dimension !== initialScene.dimension ||
               splitMode !== initialScene.splitMode ||
               activeBaseMap !== initialScene.activeBaseMap ||
               defaultBaseMap !== initialScene.defaultBaseMap ||
               JSON.stringify(enabledBaseMaps) !== JSON.stringify(initialScene.enabledBaseMaps) ||
               JSON.stringify(mapCenter) !== JSON.stringify(initialScene.mapCenter) ||
               isTimePlayerDropped !== initialScene.isTimePlayerDropped;
    }, [layerTree, drawnFeatures, zoom, dimension, splitMode, activeBaseMap, defaultBaseMap, enabledBaseMaps, mapCenter, isTimePlayerDropped, initialScene]);

    const handleTimeChange = (time: Date) => {
        if (!timePlayerConfig || timePlayerConfig.timePoints.length === 0) return;
        
        // Find the closest time point that is <= current time
        const sortedPoints = [...timePlayerConfig.timePoints]
            .filter(tp => tp.time)
            .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
            
        let activePoint = sortedPoints[0];
        for (let i = sortedPoints.length - 1; i >= 0; i--) {
            if (new Date(sortedPoints[i].time).getTime() <= time.getTime()) {
                activePoint = sortedPoints[i];
                break;
            }
        }
        
        if (activePoint && activePoint.layerId) {
            // Update layer visibility: show active layer, hide other time point layers
            const timePointLayerIds = new Set(timePlayerConfig.timePoints.map(tp => tp.layerId).filter(Boolean));
            
            const updateLayerVisibility = (nodes: LayerNode[]): LayerNode[] => {
                return nodes.map(node => {
                    if (node.type === 'layer' && timePointLayerIds.has(node.id)) {
                        return { ...node, isVisible: node.id === activePoint.layerId };
                    }
                    if (node.children) {
                        return { ...node, children: updateLayerVisibility(node.children) };
                    }
                    return node;
                });
            };
            
            setLayerTree(prev => updateLayerVisibility(prev));
        }
    };

    const handleMapMouseDown = (e: React.MouseEvent) => {
        // 点击发生在 UI 热区（工具栏下拉等）时，不触发地图标绘/平移
        const targetEl = e.target as HTMLElement | null;
        if (targetEl?.closest?.('[data-stop-map="true"]')) return;

        // 当存在绘制类工具时，在地图上点击用于新增标绘要素，而不是拖动画布
        if (activeTool && ['point', 'line', 'polygon', 'circle', 'text'].includes(activeTool)) {
            // 简化处理：仅记录屏幕坐标 / 逻辑坐标，后续可替换为真实地理坐标
            const rect = mapContainerRef.current?.getBoundingClientRect();
            const clickX = rect ? e.clientX - rect.left : 0;
            const clickY = rect ? e.clientY - rect.top : 0;

            const mockCoords = JSON.stringify({ x: clickX, y: clickY, zoom, center: mapCenter });

            const getDefaultNameForType = (type: string) => {
                const base =
                    type === 'point' ? '点标注' :
                    type === 'line' ? '线标注' :
                    type === 'polygon' ? '多边形' :
                    type === 'circle' ? '圆形' :
                    '注记';
                const sameTypeCount = drawnFeatures.filter(f => f.type === type).length;
                return `${base} ${sameTypeCount + 1}`;
            };

            const name = getDefaultNameForType(activeTool);

            const newFeature: DrawnFeature = {
                id: `feat-${Date.now()}`,
                type: activeTool as any,
                coords: mockCoords,
                name,
                folderId: currentDrawingFolderId || 'root-all'
            };

            setDrawnFeatures(prev => [...prev, newFeature]);
            // 不进入平移模式
            return;
        }

        // 没有激活绘制工具时，才启动平移
        setIsPanning(true);
        setLastMousePos({ x: e.clientX, y: e.clientY });
        setActiveComponentEditor(null);
    };

    const handleMapMouseMove = (e: React.MouseEvent) => {
        if (draggingComponent) {
            const dx = e.clientX - lastMousePos.x;
            const dy = e.clientY - lastMousePos.y;
            
            if (draggingComponent.type === 'indicator') {
                setSummaryIndicators(prev => prev.map(indicator => {
                    if (indicator.id === draggingComponent.id) {
                        const newPos = { ...indicator.position };
                        newPos.top += dy;
                        if (newPos.left !== undefined) {
                            newPos.left += dx;
                        } else if (newPos.right !== undefined) {
                            newPos.right -= dx;
                        } else {
                            // Default was right: 24
                            newPos.right = 24 - dx;
                        }
                        return { ...indicator, position: newPos };
                    }
                    return indicator;
                }));
            } else if (draggingComponent.type === 'barChart') {
                setBarChartIndicators(prev => prev.map(indicator => {
                    if (indicator.id === draggingComponent.id) {
                        const newPos = { ...indicator.position };
                        newPos.top += dy;
                        if (newPos.left !== undefined) {
                            newPos.left += dx;
                        } else if (newPos.right !== undefined) {
                            newPos.right -= dx;
                        } else {
                            // Default was right: 24
                            newPos.right = 24 - dx;
                        }
                        return { ...indicator, position: newPos };
                    }
                    return indicator;
                }));
            } else if (draggingComponent.type === 'timePlayer') {
                setTimePlayerPosition(prev => {
                    const newPos = { ...prev };
                    if (newPos.top !== undefined) newPos.top += dy;
                    if (newPos.bottom !== undefined) newPos.bottom -= dy;
                    if (newPos.left !== undefined) newPos.left += dx;
                    if (newPos.right !== undefined) newPos.right -= dx;
                    return newPos;
                });
            }
            
            setLastMousePos({ x: e.clientX, y: e.clientY });
            return;
        }

        if (!isPanning) return;
        
        const dx = e.clientX - lastMousePos.x;
        const dy = e.clientY - lastMousePos.y;
        
        const n = Math.pow(2, zoom);
        const res = 360 / (256 * n); // degrees per pixel
        
        setMapCenter(prev => ({
            lat: Math.max(-85, Math.min(85, prev.lat + dy * res)),
            lon: prev.lon - dx * res
        }));
        
        setLastMousePos({ x: e.clientX, y: e.clientY });
    };

    const handleMapMouseUp = () => {
        setIsPanning(false);
        setDraggingComponent(null);
        setResizingSummaryId(null);
    };

    // 汇总指标卡片尺寸拖拽（document 级，避免拖出卡片后丢失）
    useEffect(() => {
        if (!resizingSummaryId) return;
        const handleMove = (e: MouseEvent) => {
            const dx = e.clientX - resizingSummaryId.startX;
            const dy = e.clientY - resizingSummaryId.startY;
            const newW = Math.max(120, resizingSummaryId.startWidth + dx);
            const newH = Math.max(60, resizingSummaryId.startHeight + dy);
            setSummaryIndicators(prev => prev.map(ind => ind.id === resizingSummaryId.id ? { ...ind, config: { ...ind.config, width: newW, height: newH } } : ind));
        };
        const handleUp = () => setResizingSummaryId(null);
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleUp);
        document.body.style.cursor = 'se-resize';
        return () => {
            document.removeEventListener('mousemove', handleMove);
            document.removeEventListener('mouseup', handleUp);
            document.body.style.cursor = '';
        };
    }, [resizingSummaryId]);

    const handleMapWheel = (e: WheelEvent) => {
        if (activeTool) return;
        e.preventDefault();
        
        if (e.deltaY < 0) {
            setZoom(z => Math.min(22, z + 1));
        } else {
            setZoom(z => Math.max(1, z - 1));
        }
    };

    useEffect(() => {
        const container = mapContainerRef.current;
        if (container) {
            container.addEventListener('wheel', handleMapWheel, { passive: false });
        }
        return () => {
            if (container) {
                container.removeEventListener('wheel', handleMapWheel);
            }
        };
    }, [activeTool]);

    useEffect(() => {
        const handleMouseMove = (e: MouseEvent) => {
            if (!isResizing.current || !sidebarRef.current) return;
            const sidebarRect = sidebarRef.current.getBoundingClientRect();
            const newHeight = sidebarRect.bottom - e.clientY;
            if (newHeight >= 120 && newHeight <= sidebarRect.height - 150) setSourcesHeight(newHeight);
        };
        const handleMouseUp = () => { isResizing.current = false; document.body.style.cursor = 'default'; };
        document.addEventListener('mousemove', handleMouseMove);
        document.addEventListener('mouseup', handleMouseUp);
        return () => { document.removeEventListener('mousemove', handleMouseMove); document.removeEventListener('mouseup', handleMouseUp); };
    }, []);

    const getVisibleLayers = (nodes: LayerNode[]): { id: string, label: string }[] => {
        let res: { id: string, label: string }[] = [];
        nodes.forEach(n => {
            if (n.type === 'layer' && n.isVisible !== false) {
                res.push({ id: n.id, label: n.label });
            }
            if (n.children) res = [...res, ...getVisibleLayers(n.children)];
        });
        return res;
    };

    /** 图层树中所有图层（用于分屏视口下拉选择） */
    const getAllLayers = (nodes: LayerNode[]): { id: string, label: string }[] => {
        let res: { id: string, label: string }[] = [];
        nodes.forEach(n => {
            if (n.type === 'layer') res.push({ id: n.id, label: n.label });
            if (n.children) res = [...res, ...getAllLayers(n.children)];
        });
        return res;
    };

    const visibleLayers = getVisibleLayers(layerTree);
    const allLayers = useMemo(() => getAllLayers(layerTree), [layerTree]);

    const buildDefaultLegendGroup = (lyr: LayerNode): LayerLegendGroup => {
        const type: 'POINT' | 'LINE' | 'POLYGON' = lyr.label.includes('分布') ? 'POINT' : lyr.label.includes('网') ? 'LINE' : 'POLYGON';
        return {
            layerId: lyr.id,
            layerName: lyr.label,
            entries: [{
                id: `entry-${Date.now()}-${Math.random()}`,
                label: '默认符号',
                type,
                style: {
                    color: type === 'POINT' ? '#3b82f6' : type === 'LINE' ? '#10b981' : '#f59e0b',
                    opacity: 0.8,
                    size: 8,
                    strokeWidth: 1,
                    strokeColor: '#ffffff'
                },
                isHidden: false
            }]
        };
    };

    // Sync legends with visible layers
    useEffect(() => {
        setLegends(prev => {
            // Keep existing groups for layers still visible, add new ones
            const newGroups: LayerLegendGroup[] = visibleLayers.map(lyr => {
                const existing = prev.find(p => p.layerId === lyr.id);
                if (existing) return existing;
                return buildDefaultLegendGroup(lyr);
            });
            return newGroups;
        });
    }, [layerTree]);

    useEffect(() => {
        // Capture per-layer initial style snapshot once, used by per-layer reset.
        legends.forEach(group => {
            if (!defaultLayerStylesRef.current[group.layerId]) {
                defaultLayerStylesRef.current[group.layerId] = {
                    legend: JSON.parse(JSON.stringify(group)),
                    style: layerStyleSettings[group.layerId] ? JSON.parse(JSON.stringify(layerStyleSettings[group.layerId])) : undefined
                };
            }
        });
    }, [legends, layerStyleSettings]);

    useEffect(() => {
        if (!selectedStyleLayerId && visibleLayers.length > 0) {
            setSelectedStyleLayerId(visibleLayers[0].id);
            return;
        }
        if (selectedStyleLayerId && !visibleLayers.some(l => l.id === selectedStyleLayerId)) {
            setSelectedStyleLayerId(visibleLayers[0]?.id || '');
        }
    }, [selectedStyleLayerId, visibleLayers]);

    const handleResetLayerStyle = (layerId: string) => {
        const confirmed = window.confirm('您确定要回到默认样式？');
        if (!confirmed) return;
        const snapshot = defaultLayerStylesRef.current[layerId];
        if (!snapshot) return;
        setLegends(prev => prev.map(group => (
            group.layerId === layerId ? JSON.parse(JSON.stringify(snapshot.legend)) : group
        )));
        setLayerStyleSettings(prev => {
            const next = { ...prev };
            if (snapshot.style) {
                next[layerId] = JSON.parse(JSON.stringify(snapshot.style));
            } else {
                delete next[layerId];
            }
            return next;
        });
    };

    const detectLayerRenderType = (layerId: string): 'raster' | 'vector' => {
        const findLayer = (nodes: LayerNode[]): LayerNode | null => {
            for (const node of nodes) {
                if (node.id === layerId) return node;
                if (node.children) {
                    const found = findLayer(node.children);
                    if (found) return found;
                }
            }
            return null;
        };
        const layer = findLayer(layerTree);
        const source = layer?.sourceId ? MOCK_SERVICES.find(s => s.id === layer.sourceId) : undefined;
        const hint = `${source?.serviceType || ''} ${source?.name || ''}`.toLowerCase();
        return hint.includes('影像') || hint.includes('wmts') || hint.includes('cog') ? 'raster' : 'vector';
    };

    const getLayerBandMeta = (layerId: string): RasterBandMeta[] => {
        const isRaster = detectLayerRenderType(layerId) === 'raster';
        if (!isRaster) return [];
        // Mock metadata reading. In real service integration, replace with backend metadata API.
        return [
            { index: 1, name: 'Band 1', min: 0, max: 1023 },
            { index: 2, name: 'Band 2', min: 0, max: 1023 },
            { index: 3, name: 'Band 3', min: 0, max: 1023 },
            { index: 4, name: 'Band 4', min: 0, max: 1023 }
        ];
    };
    const rasterLayerIds = useMemo(
        () => new Set(visibleLayers.filter(l => detectLayerRenderType(l.id) === 'raster').map(l => l.id)),
        [visibleLayers]
    );

    const toRgba = (hex: string, alpha = 1) => {
        const c = (hex || '#3b82f6').replace('#', '');
        const norm = c.length === 3 ? c.split('').map(ch => ch + ch).join('') : c.padEnd(6, '0').slice(0, 6);
        const num = Number.parseInt(norm, 16);
        const r = (num >> 16) & 255;
        const g = (num >> 8) & 255;
        const b = num & 255;
        return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
    };

    const getLayerMainStyle = (layerId: string): LegendStyle | null => {
        const group = legends.find(g => g.layerId === layerId);
        if (!group) return null;
        const firstVisible = group.entries.find(e => !e.isHidden) || group.entries[0];
        return firstVisible?.style || null;
    };

    const startResizing = (e: React.MouseEvent) => { e.preventDefault(); isResizing.current = true; document.body.style.cursor = 'ns-resize'; };

    const handleExitDesign = () => {
        if (hasChanges) {
            setIsExitConfirmOpen(true);
        } else {
            onBack();
        }
    };

    const handleSave = () => {
        const updatedData = {
            layerTree,
            drawnFeatures,
            zoom,
            dimension,
            splitMode,
            activeBaseMap,
            enabledBaseMaps,
            defaultBaseMap,
            mapCenter,
            legends,
            isTimePlayerDropped,
            timePlayerConfig
        };
        if (initialScene) {
            onUpdateScene(updatedData);
            onBack();
        } else {
            const draftScene: MapScene = {
                id: `draft-${Date.now()}`,
                title: `草稿-未命名场景-${new Date().toLocaleDateString()}`,
                description: '这是您在设计器中自动保存的草稿。',
                thumbnail: buildLayersOnlySnapshotDataUrl(getVisibleLayerLabelsFromTree(layerTree)),
                tags: ['自动保存', '草稿'],
                isFavorite: false,
                status: 'draft',
                ...updatedData
            };
            onSaveDraft(draftScene);
        }
    };

    const confirmSaveAndExit = () => {
        const updatedData = {
            layerTree,
            drawnFeatures,
            zoom,
            dimension,
            splitMode,
            activeBaseMap,
            enabledBaseMaps,
            defaultBaseMap,
            mapCenter,
            legends,
            isTimePlayerDropped,
            timePlayerConfig
        };
        if (initialScene) {
            onUpdateScene(updatedData);
            onBack();
        } else {
            const draftScene: MapScene = {
                id: `draft-${Date.now()}`,
                title: `草稿-未命名场景-${new Date().toLocaleDateString()}`,
                description: '这是您在设计器中自动保存的草稿。',
                thumbnail: buildLayersOnlySnapshotDataUrl(getVisibleLayerLabelsFromTree(layerTree)),
                tags: ['自动保存', '草稿'],
                isFavorite: false,
                status: 'draft',
                ...updatedData
            };
            onSaveDraft(draftScene);
        }
        setIsExitConfirmOpen(false);
    };

    const handlePublishToMarket = (data: { name: string; theme: string; description: string; tags: string[] }) => {
        const publishedScene: MapScene = {
            id: `pub-${Date.now()}`,
            title: data.name,
            description: data.description?.trim() ? data.description.trim() : `从编辑器发布到集市的场景，主题：${data.theme}。`,
            thumbnail: buildLayersOnlySnapshotDataUrl(getVisibleLayerLabelsFromTree(layerTree)),
            tags: data.tags,
            isFavorite: false,
            status: 'published',
            layerTree,
            drawnFeatures,
            zoom,
            dimension,
            splitMode,
            activeBaseMap,
            enabledBaseMaps,
            defaultBaseMap,
            mapCenter,
            legends,
            isTimePlayerDropped,
            timePlayerConfig
        };
        onPublishSuccess(publishedScene);
    };

    const handleAddServiceConfirm = (data: { name: string; type: string; url: string; parentId: string }) => {
        const isBusinessTable = data.type === '业务表' || data.type === '业务表数据';
        const newLayer: LayerNode = {
            id: `lyr-svc-${Date.now()}`,
            label: data.name,
            type: 'layer',
            isVisible: true,
            layerSourceType: isBusinessTable ? 'businessTable' : 'map'
        };

        const updateTree = (nodes: LayerNode[]): LayerNode[] => {
            return nodes.map(node => {
                if (node.id === data.parentId) {
                    return {
                        ...node,
                        children: [...(node.children || []), newLayer],
                        isExpanded: true
                    };
                }
                if (node.children) {
                    return { ...node, children: updateTree(node.children) };
                }
                return node;
            });
        };

        setLayerTree(updateTree(layerTree));
        setIsAddServiceModalOpen(false);
    };

    const handleNodeDrop = (draggedId: string, targetId: string, position: 'before' | 'after' | 'inside') => {
        if (draggedId === targetId) return;

        setLayerTree(prevTree => {
            let draggedNode: LayerNode | null = null;
            
            // 1. Remove the dragged node
            const removeNode = (nodes: LayerNode[]): LayerNode[] => {
                const filtered = nodes.filter(n => {
                    if (n.id === draggedId) {
                        draggedNode = n;
                        return false;
                    }
                    return true;
                });
                return filtered.map(n => ({
                    ...n,
                    children: n.children ? removeNode(n.children) : undefined
                }));
            };

            const treeWithoutDragged = removeNode(prevTree);
            if (!draggedNode) return prevTree;

            // Prevent dropping a folder into its own descendant
            const isDescendant = (node: LayerNode, targetId: string): boolean => {
                if (node.id === targetId) return true;
                if (node.children) {
                    return node.children.some(child => isDescendant(child, targetId));
                }
                return false;
            };

            if (isDescendant(draggedNode, targetId)) {
                return prevTree;
            }

            // 2. Insert the dragged node
            const insertNode = (nodes: LayerNode[]): LayerNode[] => {
                const result: LayerNode[] = [];
                for (const node of nodes) {
                    if (node.id === targetId) {
                        if (position === 'before') {
                            result.push(draggedNode!);
                            result.push(node);
                        } else if (position === 'after') {
                            result.push(node);
                            result.push(draggedNode!);
                        } else if (position === 'inside') {
                            result.push({
                                ...node,
                                isExpanded: true,
                                children: [...(node.children || []), draggedNode!]
                            });
                        }
                    } else {
                        result.push({
                            ...node,
                            children: node.children ? insertNode(node.children) : undefined
                        });
                    }
                }
                return result;
            };

            return insertNode(treeWithoutDragged);
        });
    };

    const handleDropToFolder = (targetFolderId: string, product: DataProduct) => {
        const newLayer: LayerNode = {
            id: `lyr-drop-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            label: product.name,
            type: 'layer',
            isVisible: true,
            sourceId: product.id,
            layerSourceType: product.serviceType === '业务数据服务点业务表' ? 'businessTable' : 'map'
        };

        const updateTree = (nodes: LayerNode[]): LayerNode[] => {
            return nodes.map(node => {
                if (node.id === targetFolderId && node.type === 'folder') {
                    return {
                        ...node,
                        children: [...(node.children || []), newLayer],
                        isExpanded: true
                    };
                }
                if (node.children) {
                    return { ...node, children: updateTree(node.children) };
                }
                return node;
            });
        };

        setLayerTree(updateTree(layerTree));
    };

    const handleBatchImportConfirm = (items: DataProduct[], targetFolderId: string) => {
        const newLayers: LayerNode[] = items.map(product => ({
            id: `lyr-import-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
            label: product.name,
            type: 'layer',
            isVisible: true,
            sourceId: product.id,
            layerSourceType: product.serviceType === '业务数据服务点业务表' ? 'businessTable' : 'map'
        }));

        const updateTree = (nodes: LayerNode[]): LayerNode[] => {
            return nodes.map(node => {
                if (node.id === targetFolderId && node.type === 'folder') {
                    return {
                        ...node,
                        children: [...(node.children || []), ...newLayers],
                        isExpanded: true
                    };
                }
                if (node.children) {
                    return { ...node, children: updateTree(node.children) };
                }
                return node;
            });
        };

        setLayerTree(updateTree(layerTree));
        setIsImportDataModalOpen(false);
    };

    const currentSourceList = MOCK_SERVICES;
    const filteredProducts = useMemo(() => {
        if (!searchQuery.trim()) return currentSourceList;
        return currentSourceList.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }, [searchQuery, currentSourceList]);

    const flattenedFolders = useMemo(() => {
        const folders: { id: string; label: string; level: number }[] = [];
        const traverse = (nodes: LayerNode[], level: number) => {
            nodes.forEach(node => {
                if (node.type === 'folder') {
                    folders.push({ id: node.id, label: node.label, level });
                    if (node.children) traverse(node.children, level + 1);
                }
            });
        };
        traverse(layerTree, 0);
        return folders;
    }, [layerTree]);

    const handleFolderTreeAction = (action: 'add' | 'edit' | 'delete', payload: any) => {
        const updateTree = (nodes: LayerNode[]): LayerNode[] => {
            if (action === 'delete') {
                return nodes.filter(n => n.id !== payload.id).map(n => ({
                    ...n,
                    children: n.children ? updateTree(n.children) : undefined
                }));
            }
            
            return nodes.map(node => {
                if (action === 'add' && node.id === payload.parentId) {
                    return {
                        ...node,
                        isExpanded: true,
                        children: [...(node.children || []), {
                            id: `folder-${Date.now()}`,
                            label: payload.name,
                            type: 'folder',
                            isExpanded: true,
                            children: []
                        }]
                    };
                }
                if (action === 'edit' && node.id === payload.id) {
                    return { ...node, label: payload.name };
                }
                if (node.children) {
                    return { ...node, children: updateTree(node.children) };
                }
                return node;
            });
        };

        if (action === 'add' && !payload.parentId) {
            setLayerTree([...layerTree, {
                id: `folder-${Date.now()}`,
                label: payload.name,
                type: 'folder',
                isExpanded: true,
                children: []
            }]);
        } else {
            setLayerTree(updateTree(layerTree));
        }
        setIsModalOpen(false);
    };

    const handleDeleteClick = (id: string, hasChildren: boolean) => {
        if (hasChildren) {
            if (!window.confirm("该目录下包含子目录或图层，删除将级联清除所有内容。确认删除？")) return;
        }
        handleFolderTreeAction('delete', { id });
    };

    const handleToolClick = (toolId: string) => {
        if (toolId === 'clear_all') {
            setDrawnFeatures([]);
            setActiveTool(null);
            return;
        }

        // 工具选择后保持激活，支持连续绘制；取消工具用 ESC（见 keydown）
        setActiveTool(toolId);
        // 选择后收起下拉面板，避免遮挡与误触
        setActiveToolbarCategory(null);
    };

    const visibleLayerLabels = useMemo(() => {
        const labels: string[] = [];
        const traverse = (nodes: LayerNode[]) => {
            nodes.forEach(node => {
                if (node.type === 'layer' && node.isVisible !== false) labels.push(node.label);
                if (node.children) traverse(node.children);
            });
        };
        traverse(layerTree);
        return labels;
    }, [layerTree]);

    const handleLegendToggleHidden = (layerId: string, entryId: string) => {
        setLegends(prev => prev.map(group => {
            if (group.layerId === layerId) {
                return {
                    ...group,
                    entries: group.entries.map(e => e.id === entryId ? { ...e, isHidden: !e.isHidden } : e)
                };
            }
            return group;
        }));
    };

    const handleRemoveLegendEntry = (layerId: string, entryId: string) => {
        setLegends(prev => prev.map(group => {
            if (group.layerId === layerId) {
                if (group.entries.length <= 1) return group;
                return {
                    ...group,
                    entries: group.entries.filter(e => e.id !== entryId)
                };
            }
            return group;
        }));
    };

    const handleUpdateLegend = (
        layerId: string,
        entryId: string,
        updates: { label?: string; style?: Partial<LegendStyle> }
    ) => {
        setLegends(prev => prev.map(group => {
            if (group.layerId === layerId) {
                return {
                    ...group,
                    entries: group.entries.map(e => {
                        if (e.id !== entryId) return e;
                        return {
                            ...e,
                            label: updates.label ?? e.label,
                            style: updates.style ? { ...e.style, ...updates.style } : e.style
                        };
                    })
                };
            }
            return group;
        }));
    };

    // Handler for dropping a component from library to map
    const handleMapDrop = (e: React.DragEvent) => {
        const compLabel = e.dataTransfer.getData('component_label');
        if (compLabel === '时序播放') {
            const rect = mapContainerRef.current?.getBoundingClientRect();
            const top = rect ? e.clientY - rect.top : 24;
            const left = rect ? e.clientX - rect.left : 24;
            setTimePlayerPosition({ top: top - 40, left: left - 400 }); // Center roughly
            setIsTimePlayerDropped(true);
        } else if (compLabel === '汇总指标') {
            const rect = mapContainerRef.current?.getBoundingClientRect();
            const top = rect ? e.clientY - rect.top : 24;
            const right = rect ? rect.right - e.clientX : 24;
            
            const newIndicator: SummaryIndicator = {
                id: `indicator-${Date.now()}`,
                config: {
                    title: '统计标题',
                    value: '100',
                    unit: '单位',
                    layerId: '',
                    fieldId: '',
                    color: '#2563eb',
                    width: 160,
                    height: 80
                },
                position: { top: top - 40, right: right - 80 } 
            };
            setSummaryIndicators(prev => [...prev, newIndicator]);
            setActiveEditorTab('components');
            setActiveComponentEditor({ type: 'summaryIndicator', id: newIndicator.id });
        } else if (compLabel === '数据柱状图') {
            const rect = mapContainerRef.current?.getBoundingClientRect();
            const top = rect ? e.clientY - rect.top : 24;
            const right = rect ? rect.right - e.clientX : 24;
            
            const newBarChart: BarChartIndicator = {
                id: `barChart-${Date.now()}`,
                config: {
                    title: '柱状图标题',
                    layerId: '',
                    fieldId: '',
                    categoryFieldId: '',
                    sortOrder: 'asc',
                    color: '#2563eb'
                },
                position: { top: top - 40, right: right - 80 } 
            };
            setBarChartIndicators(prev => [...prev, newBarChart]);
            setActiveEditorTab('components');
            setActiveComponentEditor({ type: 'barChart', id: newBarChart.id });
        }
    };

    /**
     * 获取当前场景快照数据 (ReadOnly getSceneData 接口实现)
     */
    const [isLyr1Generated, setIsLyr1Generated] = useState(initialScene?.isLyr1Generated || false);
    const [isGenerating, setIsGenerating] = useState(false);

    const getSceneData = () => {
        return {
            title: '场景预览模式',
            visibleLayers,
            drawnFeatures,
            isTimePlayerDropped,
            timePlayerConfig,
            summaryIndicators,
            barChartIndicators,
            isTableViewOpen,
            selectedLayerIdForTable,
            selectedFeatureIdForTable,
            zoom,
            dimension,
            splitMode,
            legends,
            mapCenter,
            activeBaseMap,
            isLyr1Generated
        };
    };

    const handleRunAlgorithm = (layerId: string) => {
        if (layerId === 'lyr-1') {
            setIsGenerating(true);
            setTimeout(() => {
                setIsGenerating(false);
                setIsLyr1Generated(true);
                // 更新图例
                setLegends(prev => prev.map(g => {
                    if (g.layerId === 'lyr-1') {
                        return {
                            ...g,
                            entries: [
                                { id: 'lc-1', label: '林地 (Forest)', style: { type: 'simple', color: '#10b981' }, isHidden: false },
                                { id: 'lc-2', label: '耕地 (Cropland)', style: { type: 'simple', color: '#fbbf24' }, isHidden: false },
                                { id: 'lc-3', label: '水域 (Water)', style: { type: 'simple', color: '#3b82f6' }, isHidden: false },
                                { id: 'lc-4', label: '居住用地 (Residential)', style: { type: 'simple', color: '#f43f5e' }, isHidden: false },
                                { id: 'lc-5', label: '工业用地 (Industrial)', style: { type: 'simple', color: '#64748b' }, isHidden: false },
                                { id: 'lc-6', label: '商业用地 (Commercial)', style: { type: 'simple', color: '#8b5cf6' }, isHidden: false },
                            ]
                        };
                    }
                    return g;
                }));
            }, 2000);
        }
    };

    return (
        <div className="flex flex-col h-full bg-slate-50 animate-fadeIn text-slate-800">
            <div className="h-14 bg-white border-b border-slate-200 flex items-center flex-shrink-0 z-20 shadow-sm">
                {/* 左侧面板区域头部 */}
                <div className="flex items-center h-full flex-shrink-0 border-r border-slate-200" style={{ width: isSidebarCollapsed ? '44px' : '332px', transition: 'width 300ms ease-in-out', overflow: 'hidden' }}>
                    {/* 面板展开/收起按钮：始终固定在最左侧，宽44px */}
                    <button
                        onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
                        className="flex-shrink-0 w-[44px] h-full flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-all cursor-pointer"
                        title={isSidebarCollapsed ? '展开面板' : '收起面板'}
                    >
                        {isSidebarCollapsed
                            ? <PanelLeftOpen size={18} />
                            : <PanelLeftClose size={18} />
                        }
                    </button>
                    {/* 4个功能图标：展开时随整体宽度滑出，收起时被裁剪隐藏 */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                        <ToolbarIcon icon={<Layers size={18} />} active={activeEditorTab === 'layers'} label="图层管理" onClick={() => setActiveEditorTab('layers')} />
                        <ToolbarIcon icon={<LayoutGrid size={18} />} active={activeEditorTab === 'components'} label="地图组件" onClick={() => setActiveEditorTab('components')} />
                        <ToolbarIcon icon={<List size={18} />} active={activeEditorTab === 'analysis'} label="图例" onClick={() => setActiveEditorTab('analysis')} />
                        <ToolbarIcon icon={<MapIcon size={18} />} active={activeEditorTab === 'config'} label="底图配置" onClick={() => setActiveEditorTab('config')} />
                    </div>
                </div>
                <div className="flex-1 flex items-center justify-center gap-4">
                    <div className="h-5 w-px bg-slate-200"></div>
                    <div
                        className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200/50"
                        data-stop-map="true"
                        // 不能用 capture 阶段拦截，否则会阻断红框按钮本身的点击
                        onPointerDown={(e) => e.stopPropagation()}
                        onMouseDown={(e) => e.stopPropagation()}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex bg-white rounded-md shadow-sm p-0.5 border border-slate-200/50">
                            <button onClick={() => setDimension('2D')} className={`px-2 py-1 text-[10px] font-black rounded transition-all ${dimension === '2D' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>2D</button>
                            <button onClick={() => setDimension('3D')} className={`px-2 py-1 text-[10px] font-black rounded transition-all ${dimension === '3D' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}>3D</button>
                        </div>
                        <div className="h-4 w-px bg-slate-200 mx-1"></div>
                        
                        {/* 移动至此：量测工具按钮 */}
                        <div
                            className="relative flex items-center"
                            data-stop-map="true"
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button 
                                onClick={() => setActiveToolbarCategory(prev => prev === 'measure' ? null : 'measure')}
                                className={`p-1.5 rounded transition-all ${activeToolbarCategory === 'measure' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-white/50'}`}
                                title="量测工具"
                            >
                                <Ruler size={14} />
                            </button>
                            {activeToolbarCategory === 'measure' && (
                                <div
                                    className="absolute top-full mt-2 left-0 flex flex-col gap-1 p-1 bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-xl shadow-2xl animate-slideDown pointer-events-auto ring-1 ring-slate-900/5 z-[110] min-w-[120px]"
                                    data-stop-map="true"
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleToolClick('measure_area'); }}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${activeTool === 'measure_area' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <Pentagon size={14} /> 面积量测
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleToolClick('measure_dist'); }}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${activeTool === 'measure_dist' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <Ruler size={14} /> 距离量测
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 移动至此：标绘工具按钮 */}
                        <div
                            className="relative flex items-center"
                            data-stop-map="true"
                            onPointerDown={(e) => e.stopPropagation()}
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button 
                                onClick={() => setActiveToolbarCategory(prev => prev === 'plot' ? null : 'plot')}
                                className={`p-1.5 rounded transition-all ${activeToolbarCategory === 'plot' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-white/50'}`}
                                title="标绘工具"
                            >
                                <PenTool size={14} />
                            </button>
                            {activeToolbarCategory === 'plot' && (
                                <div
                                    className="absolute top-full mt-2 left-0 flex flex-col gap-1 p-1 bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-xl shadow-2xl animate-slideDown pointer-events-auto ring-1 ring-slate-900/5 z-[110] min-w-[140px]"
                                    data-stop-map="true"
                                    onPointerDown={(e) => e.stopPropagation()}
                                    onMouseDown={(e) => e.stopPropagation()}
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleToolClick('text'); }}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${activeTool === 'text' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <Type size={14} /> 添加注记
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleToolClick('polygon'); }}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${activeTool === 'polygon' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <Grid size={14} /> 绘制多边形
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleToolClick('circle'); }}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${activeTool === 'circle' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <LucideCircle size={14} /> 绘制圆
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleToolClick('line'); }}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${activeTool === 'line' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <PenTool size={14} /> 绘制线
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleToolClick('point'); }}
                                        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all ${activeTool === 'point' ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}
                                    >
                                        <MapPin size={14} /> 绘制点
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* 全部清除按钮移动至此 */}
                        <button 
                            onClick={() => { handleToolClick('clear_all'); setActiveToolbarCategory(null); }}
                            className="p-1.5 rounded text-slate-500 hover:text-red-600 hover:bg-white/50 transition-all ml-0.5"
                            title="清除全部标绘"
                        >
                            <Trash2 size={14} />
                        </button>

                        <div className="h-4 w-px bg-slate-200 mx-1"></div>
                        <div className="relative flex items-center">
                            {/* 新增点图查询按钮 */}
                            <button 
                                onClick={() => handleToolClick('query')}
                                className={`p-1.5 rounded transition-all mr-1 ${activeTool === 'query' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-white/50'}`}
                                title="点图查询"
                            >
                                <MousePointer2 size={14} />
                            </button>
                            {/* 新增卷帘按钮 */}
                            <button 
                                onClick={() => setIsSwipeActive(!isSwipeActive)}
                                className={`p-1.5 rounded transition-all mr-1 ${isSwipeActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-white/50'}`}
                                title="卷帘对比模式"
                            >
                                <Split size={14} />
                            </button>
                            <button onClick={() => setShowSplitMenu(!showSplitMenu)} className={`p-1.5 rounded transition-all ${splitMode !== '1' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-white/50'}`}><Grid size={14} /></button>
                            {showSplitMenu && (
                                <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-[110] w-44 animate-in zoom-in-95 duration-200 origin-top-right">
                                    <SplitMenuItem label="单屏模式" icon={<Monitor size={14}/>} active={splitMode === '1'} onClick={() => {setSplitMode('1'); setShowSplitMenu(false);}} />
                                    <SplitMenuItem label="左右分屏" icon={<Columns size={14}/>} active={splitMode === '2'} onClick={() => {setSplitMode('2'); setShowSplitMenu(false);}} />
                                    <SplitMenuItem label="四分屏" icon={<Grid size={14}/>} active={splitMode === '4'} onClick={() => {setSplitMode('4'); setShowSplitMenu(false);}} />
                                    <SplitMenuItem label="十六分屏" icon={<LayoutGrid size={14}/>} active={splitMode === '16'} onClick={() => {setSplitMode('16'); setShowSplitMenu(false);}} />
                                </div>
                            )}
                        </div>
                    </div>
                    <button onClick={() => onGoMapping(visibleLayerLabels, drawnFeatures, legends)} className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-black hover:bg-blue-700 transition-all shadow-md active:scale-95">
                        <Printer size={14} />
                        <span>快速出图</span>
                    </button>
                    <div className="flex items-center gap-2">
                        {/* 预览按钮移动到这里，并调整样式以适应右侧按钮组 */}
                        <button 
                            onClick={() => setIsPreviewOpen(true)} 
                            className="group flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:text-blue-600 shadow-sm active:scale-95 transition-all"
                            title="全屏只读预览"
                        >
                            <EyeIcon size={14} className="text-slate-400 group-hover:text-blue-600" />
                            <span>预览</span>
                        </button>
                        <button onClick={() => setIsPublishModalOpen(true)} className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-black hover:bg-blue-700 transition-all shadow-md active:scale-95">
                            <Share2 size={14} />
                            <span>发布到集市</span>
                        </button>
                        <button onClick={handleSave} className="flex items-center gap-1.5 px-4 py-1.5 bg-green-600 text-white rounded-lg text-xs font-black hover:bg-green-700 transition-all shadow-md active:scale-95">
                            <Save size={14} />
                            <span>保存</span>
                        </button>
                        <button onClick={handleExitDesign} className="group flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:text-blue-600 shadow-sm active:scale-95">
                            <Undo2 size={14} className="group-hover:-translate-x-0.5 transition-transform" />
                            <span>退出设计</span>
                        </button>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden relative">
                <div ref={sidebarRef} className={`bg-white flex flex-col z-10 overflow-hidden transition-all duration-300 ease-in-out relative ${isSidebarCollapsed ? 'w-0' : 'w-[320px]'}`}>
                    <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-[#fcfdfe] flex-shrink-0">
                        <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                            {activeEditorTab === 'config' ? <><MapIcon size={16} className="text-blue-600" />底图配置</> : 
                             activeEditorTab === 'components' ? <><LayoutGrid size={16} className="text-blue-600" />地图组件</> : 
                             activeEditorTab === 'analysis' ? <><List size={16} className="text-blue-600" />图例列表</> :
                             <><Layers size={16} className="text-slate-800" />图层列表</>}
                        </h2>
                        {activeEditorTab === 'layers' && (
                            <button 
                                onClick={() => { setModalMode('create'); setModalInitialParentId(''); setIsModalOpen(true); }} 
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="添加顶层目录"
                            >
                                <FolderPlus size={18} />
                            </button>
                        )}
                        {activeEditorTab === 'analysis' && <div />}
                    </div>
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {activeEditorTab === 'layers' ? (
                            <>
                                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 bg-white">
                                    {layerTree.map(node => (
                                        <LayerTreeNodeItem 
                                            key={node.id} 
                                            node={node} 
                                            level={0} 
                                            selectedId={selectedFolderId} 
                                            onSelect={(id) => {
                                                setSelectedFolderId(id);
                                                setSelectedLayerIdForTable(id);
                                                setSelectedFeatureIdForTable(null);

                                                // 决定标绘要素的默认保存目录规则：
                                                // - 若选中的是目录：标绘默认保存在该目录下
                                                // - 若选中的是图层：将标绘保存在该图层所在的上级目录
                                                const findNodeAndParent = (nodes: LayerNode[], parentId: string | null): { node: LayerNode; parentId: string | null } | null => {
                                                    for (const n of nodes) {
                                                        if (n.id === id) return { node: n, parentId };
                                                        if (n.children) {
                                                            const found = findNodeAndParent(n.children, n.type === 'folder' ? n.id : parentId);
                                                            if (found) return found;
                                                        }
                                                    }
                                                    return null;
                                                };
                                                const result = findNodeAndParent(layerTree, null);
                                                if (result) {
                                                    if (result.node.type === 'folder') {
                                                        setCurrentDrawingFolderId(result.node.id);
                                                    } else {
                                                        setCurrentDrawingFolderId(result.parentId || 'root-all');
                                                    }
                                                } else {
                                                    setCurrentDrawingFolderId('root-all');
                                                }
                                            }} 
                                            onToggle={(id) => setLayerTree(nodes => nodes.map(n => n.id === id ? {...n, isExpanded: !n.isExpanded} : n))} 
                                            onDrop={handleDropToFolder} 
                                            onAddClick={(tid) => { setModalMode('create'); setModalInitialParentId(tid); setIsModalOpen(true); }} 
                                            onEditClick={(n) => { setModalMode('edit'); setEditingNode(n); setIsModalOpen(true); }} 
                                            onDeleteClick={(id) => handleDeleteClick(id, node.children?.length ? node.children.length > 0 : false)} 
                                            onToggleVisibility={(id) => {
                                                const findNode = (nodes: LayerNode[]): LayerNode | null => {
                                                    for (const n of nodes) {
                                                        if (n.id === id) return n;
                                                        if (n.children) { const found = findNode(n.children); if (found) return found; }
                                                    }
                                                    return null;
                                                };
                                                const node = findNode(layerTree);
                                                if (node?.layerSourceType === 'businessTable') {
                                                    setSelectedLayerIdForTable(id);
                                                    setSelectedFeatureIdForTable(null);
                                                    setIsTableViewOpen(true);
                                                    return;
                                                }
                                                const updateNodeVisibility = (nodes: LayerNode[]): LayerNode[] => {
                                                    return nodes.map(n => {
                                                        if (n.id === id) return { ...n, isVisible: !n.isVisible };
                                                        if (n.children) return { ...n, children: updateNodeVisibility(n.children) };
                                                        return n;
                                                    });
                                                };
                                                setLayerTree(updateNodeVisibility(layerTree));
                                            }} 
                                            onRunAlgorithm={handleRunAlgorithm}
                                            onNodeDrop={handleNodeDrop}
                                            getFolderFeatures={getFolderFeatures}
                                            editingFeatureId={editingFeatureId}
                                            editingFeatureName={editingFeatureName}
                                            onStartRenameFeature={handleStartRenameFeature}
                                            onCommitRenameFeature={handleCommitRenameFeature}
                                            onCancelRenameFeature={handleCancelRenameFeature}
                                            onEditingFeatureNameChange={setEditingFeatureName}
                                            onDeleteFeature={handleDeleteFeature}
                                            onOpenMetadata={(n) => {
                                                const items: { label: string; labelEn?: string; value: React.ReactNode }[] = [
                                                    { label: '名称',   labelEn: 'Name',        value: n.label },
                                                    { label: 'ID',     labelEn: 'ID',           value: <span className="font-mono text-[12px] text-slate-600">{n.id}</span> },
                                                    { label: '类型',   labelEn: 'Type',         value: n.layerSourceType === 'businessTable' ? '业务表数据' : '空间图层' },
                                                ];
                                                if (n.sourceId) items.push({ label: '来源ID',   labelEn: 'Source ID',   value: <span className="font-mono text-[12px] text-slate-600">{n.sourceId}</span> });
                                                const svc = n.sourceId ? MOCK_SERVICES.find(s => s.id === n.sourceId) : undefined;
                                                if (svc) {
                                                    items.push({ label: '服务名称', labelEn: 'Service Name', value: svc.name });
                                                    items.push({ label: '服务类型', labelEn: 'Service Type', value: svc.serviceType || svc.source });
                                                    items.push({ label: '数据源',   labelEn: 'Data Source',  value: svc.source });
                                                }
                                                setMetadataModal({ title: '图层元数据', items });
                                            }}
                                        />
                                    ))}
                                </div>
                                <div onMouseDown={startResizing} className="h-1.5 bg-slate-100 hover:bg-slate-300 cursor-ns-resize transition-colors flex-shrink-0 z-20"></div>
                                <div className="bg-white flex flex-col overflow-hidden border-t border-slate-200 flex-shrink-0" style={{ height: sourcesHeight }}>
                                    <div className="px-4 py-3 flex items-center justify-between border-b border-slate-100 bg-slate-50/30 min-h-[44px]">
                                        {isSourceSearchVisible ? (
                                            <div className="flex-1 flex items-center gap-2 animate-fadeIn">
                                                <div className="relative flex-1">
                                                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                    <input 
                                                        type="text" 
                                                        autoFocus
                                                        value={searchQuery}
                                                        onChange={(e) => setSearchQuery(e.target.value)}
                                                        placeholder="搜索资源名称..."
                                                        className="w-full h-8 pl-8 pr-8 bg-white border border-blue-400 rounded-lg text-xs outline-none focus:ring-4 focus:ring-blue-50 transition-all"
                                                    />
                                                    {searchQuery && (
                                                        <button 
                                                            onClick={() => setSearchQuery('')}
                                                            className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-slate-300 hover:text-slate-50"
                                                        >
                                                            <X size={12} />
                                                        </button>
                                                    )}
                                                </div>
                                                <button 
                                                    onClick={() => { setIsSourceSearchVisible(false); setSearchQuery(''); }}
                                                    className="px-2 py-1 text-xs font-bold text-slate-500 hover:text-blue-600 transition-colors"
                                                >
                                                    取消
                                                </button>
                                            </div>
                                        ) : (
                                            <>
                                                <div className="flex bg-slate-200/60 p-0.5 rounded-lg border border-slate-200">
                                                    <button onClick={() => setActiveSourceTab('service')} className={`px-3 py-1 text-[11px] font-bold rounded-md transition-all ${activeSourceTab === 'service' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}>服务集市</button>
                                                </div>
                                                <button 
                                                    onClick={() => setIsSourceSearchVisible(true)}
                                                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-all border border-transparent hover:border-slate-200 shadow-sm"
                                                    title="搜索资源"
                                                >
                                                    <Search size={14} />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                    <div className="flex-1 overflow-y-auto custom-scrollbar p-2 bg-white">
                                        {filteredProducts.map(product => (
                                            <DataProductItem 
                                                key={product.id} 
                                                product={product} 
                                                onOpenMetadata={(p) => {
                                                    const items: { label: string; labelEn?: string; value: React.ReactNode }[] = [
                                                        { label: '名称', labelEn: 'Name',         value: p.name },
                                                        { label: 'ID',   labelEn: 'ID',            value: <span className="font-mono text-[12px] text-slate-600">{p.id}</span> },
                                                        { label: '类型', labelEn: 'Type',          value: p.serviceType || p.source },
                                                        { label: '来源', labelEn: 'Source',        value: p.source },
                                                    ];
                                                    setMetadataModal({ title: '服务元数据', items });
                                                }}
                                            />
                                        ))}
                                    </div>
                                    {/* 已按需求移除“添加数据源”入口 */}
                                </div>
                            </>
                        ) : activeEditorTab === 'config' ? (
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                <BaseMapListPanel
                                    activeId={activeBaseMap}
                                    onSelect={id => {
                                        setActiveBaseMap(id);
                                        // ensure selected map is enabled
                                        if (!enabledBaseMaps.includes(id)) {
                                            setEnabledBaseMaps(prev => [...prev, id]);
                                        }
                                    }}
                                    enabledIds={enabledBaseMaps}
                                    onToggleEnabled={id => setEnabledBaseMaps(prev =>
                                        prev.includes(id)
                                            ? prev.filter(x => x !== id)
                                            : [...prev, id]
                                    )}
                                    defaultId={defaultBaseMap}
                                    onSetDefault={id => {
                                        setDefaultBaseMap(id);
                                        if (!enabledBaseMaps.includes(id)) {
                                            setEnabledBaseMaps(prev => [...prev, id]);
                                        }
                                    }}
                                />
                            </div>
                        ) : activeEditorTab === 'components' ? (
                            <div className="flex-1 overflow-y-auto custom-scrollbar">
                                {activeComponentEditor?.type === 'summaryIndicator' ? (
                                    <SummaryIndicatorSettingsPanel 
                                        config={summaryIndicators.find(i => i.id === activeComponentEditor.id)?.config || { title: '', value: '', unit: '', layerId: '', fieldId: '', color: '' }} 
                                        onChange={(newConfig) => setSummaryIndicators(prev => prev.map(i => i.id === activeComponentEditor.id ? { ...i, config: newConfig } : i))} 
                                        onBack={() => setActiveComponentEditor(null)} 
                                        onRemove={() => {
                                            setSummaryIndicators(prev => prev.filter(i => i.id !== activeComponentEditor.id));
                                            setActiveComponentEditor(null);
                                        }}
                                        layers={layerTree}
                                    />
                                ) : activeComponentEditor?.type === 'timePlayer' ? (
                                    <TimePlayerSettingsPanel 
                                        config={timePlayerConfig} 
                                        onChange={setTimePlayerConfig} 
                                        onBack={() => setActiveComponentEditor(null)} 
                                        onRemove={() => {
                                            setIsTimePlayerDropped(false);
                                            setActiveComponentEditor(null);
                                        }}
                                        layers={layerTree}
                                    />
                                ) : activeComponentEditor?.type === 'barChart' ? (
                                    <BarChartSettingsPanel 
                                        config={barChartIndicators.find(i => i.id === activeComponentEditor.id)?.config || { title: '', layerId: '', fieldId: '', categoryFieldId: '', sortOrder: 'asc', color: '#2563eb' }} 
                                        onChange={(newConfig) => setBarChartIndicators(prev => prev.map(i => i.id === activeComponentEditor.id ? { ...i, config: newConfig } : i))} 
                                        onBack={() => setActiveComponentEditor(null)} 
                                        onRemove={() => {
                                            setBarChartIndicators(prev => prev.filter(i => i.id !== activeComponentEditor.id));
                                            setActiveComponentEditor(null);
                                        }}
                                        layers={layerTree}
                                    />
                                ) : (
                                    <ComponentLibraryPanel />
                                )}
                            </div>
                        ) : activeEditorTab === 'analysis' ? (
                            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white">
                                <LegendListPanel 
                                    legends={legends} 
                                    rasterLayerIds={rasterLayerIds}
                                    layerStyleSettings={layerStyleSettings}
                                    onOpenLayerStyle={(layerId) => {
                                        setSelectedStyleLayerId(layerId);
                                        setIsStyleSettingsOpen(true);
                                    }}
                                    onResetLayerStyle={handleResetLayerStyle}
                                    onToggleHidden={handleLegendToggleHidden}
                                    onRemoveEntry={handleRemoveLegendEntry}
                                    onOpenEditor={(lid, eid) => setEditingLegendEntry({ layerId: lid, entryId: eid })}
                                />
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col items-center justify-center p-10 opacity-40 text-slate-400"><Database size={48} className="mb-2" /><span className="text-xs font-bold uppercase tracking-widest">No Content</span></div>
                        )}
                    </div>
                </div>

                {/* 竖向分隔条：纯视觉分隔，收起时隐藏 */}
                {!isSidebarCollapsed && (
                    <div className="flex-shrink-0 w-3 bg-slate-100 border-l border-r border-slate-200 z-20 self-stretch" />
                )}

                <div className="flex-1 flex flex-col overflow-hidden relative">
                    <div 
                        ref={mapContainerRef}
                        className={`flex-1 bg-[#dcdfe4] relative overflow-hidden transition-all duration-300 ${
                            activeTool === 'text' ? 'cursor-text' :
                            activeTool ? 'cursor-crosshair' :
                            'cursor-move'
                        }`}
                        onDragOver={e => e.preventDefault()}
                        onDrop={handleMapDrop}
                        onMouseDown={handleMapMouseDown}
                        onMouseMove={handleMapMouseMove}
                        onMouseUp={handleMapMouseUp}
                        onMouseLeave={handleMapMouseUp}
                    >
                    <div className={`grid w-full h-full gap-0.5 p-0.5 bg-slate-300 transition-all duration-500 ${splitMode === '1' ? 'grid-cols-1' : splitMode === '2' ? 'grid-cols-2' : splitMode === '4' ? 'grid-cols-2 grid-rows-2' : 'grid-cols-4 grid-rows-4'}`}>
                        {Array.from({ length: parseInt(splitMode) }).map((_, i) => {
                            const selectedIds = viewportLayerIds[i];
                            const layersForViewport = (!selectedIds || selectedIds.length === 0)
                                ? visibleLayers
                                : visibleLayers.filter(l => selectedIds.includes(l.id));
                            return (
                            <div key={i} className="bg-[#dcdfe4] relative overflow-hidden">
                                <GoogleMapLayer 
                                    type={activeBaseMap} 
                                    zoom={zoom} 
                                    center={mapCenter} 
                                    dimension={dimension}
                                />
                                
                                <div className={`absolute inset-0 ${activeTool === 'query' ? 'pointer-events-auto' : 'pointer-events-none'}`}>
                                    {[...layersForViewport].reverse().map(layer => {
                                        const layerMainStyle = getLayerMainStyle(layer.id);
                                        const fillColor = toRgba(layerMainStyle?.color || '#3b82f6', layerMainStyle?.opacity ?? 0.7);
                                        const strokeColor = toRgba(layerMainStyle?.strokeColor || '#ffffff', layerMainStyle?.opacity ?? 0.9);
                                        const strokeWidth = layerMainStyle?.strokeWidth ?? 2;
                                        const styleCfg = layerStyleSettings[layer.id];
                                        const rasterOpacity = styleCfg?.layerType === 'raster' ? (styleCfg.raster?.opacity ?? 80) / 100 : 0.7;
                                        if (layer.id === 'lyr-1') {
                                            if (isLyr1Generated) {
                                                return <div key={layer.id} className="absolute inset-0 flex items-center justify-center pointer-events-none"><WuhanVectorMap /></div>;
                                            }
                                            return (
                                                <div key={layer.id} className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <div 
                                                        className={`w-[400px] h-[300px] border rounded-[40px] rotate-12 flex items-center justify-center ${activeTool === 'query' ? 'pointer-events-auto cursor-help' : ''}`}
                                                        style={{ backgroundColor: fillColor, borderColor: strokeColor, borderWidth: strokeWidth }}
                                                        onClick={(e) => {
                                                            if (activeTool === 'query') {
                                                                e.stopPropagation();
                                                                setQueryResult({
                                                                    name: '林地分类区域',
                                                                    layer: '地表覆盖分类',
                                                                    type: 'POLYGON',
                                                                    area: '约 12.6 km²',
                                                                    category: '林地',
                                                                    updateTime: '2026-03-17'
                                                                });
                                                            }
                                                        }}
                                                    >
                                                        <span className="text-emerald-800 text-xs font-bold bg-white/80 px-2 py-1 rounded-full">林地分类区域</span>
                                                    </div>
                                                    <div 
                                                        className={`absolute w-[200px] h-[150px] border rounded-[20px] -translate-x-40 translate-y-20 -rotate-6 flex items-center justify-center ${activeTool === 'query' ? 'pointer-events-auto cursor-help' : ''}`}
                                                        style={{ backgroundColor: fillColor, borderColor: strokeColor, borderWidth: strokeWidth }}
                                                        onClick={(e) => {
                                                            if (activeTool === 'query') {
                                                                e.stopPropagation();
                                                                setQueryResult({
                                                                    name: '耕地分类区域',
                                                                    layer: '地表覆盖分类',
                                                                    type: 'POLYGON',
                                                                    area: '约 8.4 km²',
                                                                    category: '耕地',
                                                                    updateTime: '2026-03-17'
                                                                });
                                                            }
                                                        }}
                                                    >
                                                        <span className="text-amber-800 text-xs font-bold bg-white/80 px-2 py-1 rounded-full">耕地分类区域</span>
                                                    </div>
                                                    <div 
                                                        className={`absolute w-[150px] h-[100px] border rounded-[10px] translate-x-32 -translate-y-20 rotate-12 flex items-center justify-center ${activeTool === 'query' ? 'pointer-events-auto cursor-help' : ''}`}
                                                        style={{ backgroundColor: fillColor, borderColor: strokeColor, borderWidth: strokeWidth }}
                                                        onClick={(e) => {
                                                            if (activeTool === 'query') {
                                                                e.stopPropagation();
                                                                setQueryResult({
                                                                    name: '建筑用地',
                                                                    layer: '地表覆盖分类',
                                                                    type: 'POLYGON',
                                                                    area: '约 4.2 km²',
                                                                    category: '建筑用地',
                                                                    updateTime: '2026-03-17'
                                                                });
                                                            }
                                                        }}
                                                    >
                                                        <span className="text-slate-800 text-xs font-bold bg-white/80 px-2 py-1 rounded-full">建筑用地</span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        if (layer.id === 'lyr-2') {
                                            return (
                                                <div key={layer.id} className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <svg 
                                                        className={`w-full h-full ${activeTool === 'query' ? 'pointer-events-auto cursor-help' : ''}`} 
                                                        style={{ opacity: rasterOpacity }}
                                                        viewBox="0 0 800 600"
                                                        onClick={(e) => {
                                                            if (activeTool === 'query') {
                                                                e.stopPropagation();
                                                                setQueryResult({
                                                                    name: '长江干流',
                                                                    layer: '水网分布要素',
                                                                    type: 'LINE',
                                                                    area: 'N/A',
                                                                    category: '河流',
                                                                    updateTime: '2026-03-17'
                                                                });
                                                            }
                                                        }}
                                                    >
                                                        <path d="M 100 300 Q 250 150 400 300 T 700 300" stroke={strokeColor} strokeWidth={Math.max(2, strokeWidth + 6)} fill="none" strokeLinecap="round" className="animate-pulse" />
                                                        <path d="M 300 100 Q 450 250 300 400 T 300 700" stroke={fillColor} strokeWidth={Math.max(1, strokeWidth + 2)} fill="none" strokeLinecap="round" />
                                                        <circle cx="400" cy="300" r="10" fill={fillColor} />
                                                        <text x="420" y="305" fill="#1e40af" fontSize="12" fontWeight="bold">长江干流</text>
                                                    </svg>
                                                </div>
                                            );
                                        }
                                        return (
                                            <div key={layer.id} className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div 
                                                    className={`px-4 py-2 border rounded-lg text-blue-700 font-bold backdrop-blur-sm ${activeTool === 'query' ? 'pointer-events-auto cursor-help' : ''}`}
                                                    style={{ backgroundColor: fillColor, borderColor: strokeColor, borderWidth: Math.max(1, strokeWidth) }}
                                                    onClick={(e) => {
                                                        if (activeTool === 'query') {
                                                            e.stopPropagation();
                                                            setQueryResult({
                                                                    name: layer.label,
                                                                    layer: layer.label,
                                                                    type: 'LAYER',
                                                                    area: 'N/A',
                                                                    category: '通用',
                                                                    updateTime: '2026-03-17'
                                                            });
                                                        }
                                                    }}
                                                >
                                                    {layer.label}
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {drawnFeatures.map(feat => (
                                        <div 
                                            key={feat.id} 
                                            className={`absolute inset-0 flex items-center justify-center pointer-events-auto cursor-pointer transition-all ${selectedFeatureIdForTable === feat.id ? 'z-[60]' : 'z-40'}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (activeTool === 'query') {
                                                    setQueryResult({
                                                        name: feat.name || '标绘要素',
                                                        layer: '标绘图层',
                                                        type: feat.type.toUpperCase(),
                                                        area: feat.type === 'polygon' ? '约 8.4 km²' : 'N/A',
                                                        category: '标绘',
                                                        updateTime: new Date().toISOString().split('T')[0]
                                                    });
                                                    return;
                                                }
                                                setSelectedFeatureIdForTable(feat.id);
                                                setSelectedLayerIdForTable(null);
                                                // 仅记录当前选择的标绘要素，真正打开图表由底部“图表视图”按钮控制
                                            }}
                                        >
                                            {feat.type === 'point' && <div className={`w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg animate-fadeIn ${selectedFeatureIdForTable === feat.id ? 'ring-4 ring-red-200 scale-125' : ''}`} style={{ transform: `translate(${Math.random()*100-50}px, ${Math.random()*100-50}px)` }}><MapPin size={14} className="text-white -ml-0.5 -mt-0.5" /></div>}
                                            {feat.type === 'line' && <div className={`w-40 h-[2px] bg-blue-500 shadow-sm animate-fadeIn ${selectedFeatureIdForTable === feat.id ? 'h-[4px] shadow-blue-200' : ''}`} style={{ transform: `rotate(${Math.random()*360}deg)` }}></div>}
                                            {feat.type === 'circle' && <div className={`w-20 h-20 border-2 border-blue-600 bg-blue-400/20 rounded-full animate-fadeIn ${selectedFeatureIdForTable === feat.id ? 'border-4 bg-blue-400/40' : ''}`}></div>}
                                            {feat.type === 'polygon' && <div className={`w-32 h-24 border-2 border-emerald-600 bg-emerald-400/20 clip-path-polygon animate-fadeIn ${selectedFeatureIdForTable === feat.id ? 'border-4 bg-emerald-400/40' : ''}`}></div>}
                                            {feat.name && (
                                                <div className={`px-2 py-1 bg-slate-800/80 backdrop-blur-sm text-white text-[10px] font-black rounded shadow-lg animate-fadeIn border border-white/20 whitespace-nowrap ${selectedFeatureIdForTable === feat.id ? 'bg-blue-600 border-blue-400 scale-110' : ''}`}>
                                                    {feat.name}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                    {queryResult && (
                                        <FeatureAttributesPopup 
                                            data={queryResult} 
                                            onClose={() => setQueryResult(null)} 
                                        />
                                    )}
                                </div>

                                <div className="absolute top-2 left-2 z-20">
                                    <div className="relative">
                                        <button
                                            type="button"
                                            onClick={(e) => { e.stopPropagation(); setOpenViewportDropdown(openViewportDropdown === i ? null : i); }}
                                            className="flex items-center gap-1 bg-white/60 hover:bg-white/80 backdrop-blur-sm px-2 py-1 rounded border border-white/50 text-[10px] font-bold text-slate-600 shadow-sm min-w-[72px]"
                                        >
                                            <span className="truncate max-w-[140px]">
                                                {selectedIds?.length
                                                    ? (selectedIds.length === 1
                                                        ? (visibleLayers.find(l => l.id === selectedIds[0])?.label ?? '视口 ' + (i + 1))
                                                        : `已选 ${selectedIds.length} 个图层`)
                                                    : `视口 ${i + 1}`}
                                            </span>
                                            <ChevronDown size={12} className={`shrink-0 transition-transform ${openViewportDropdown === i ? 'rotate-180' : ''}`} />
                                        </button>
                                        {openViewportDropdown === i && (
                                            <>
                                                <div className="fixed inset-0 z-40" onClick={() => setOpenViewportDropdown(null)} aria-hidden />
                                                <div className="absolute top-full left-0 mt-0.5 py-1 bg-white rounded-lg border border-slate-200 shadow-lg z-50 min-w-[160px] max-h-[220px] overflow-y-auto">
                                                    {allLayers.length === 0 ? (
                                                        <div className="px-3 py-2 text-[10px] text-slate-400">暂无图层</div>
                                                    ) : (
                                                        allLayers.map(layer => {
                                                            const effectiveIds = selectedIds?.length ? selectedIds : visibleLayers.map(l => l.id);
                                                            const isInViewport = effectiveIds.includes(layer.id);
                                                            return (
                                                                <button
                                                                    key={layer.id}
                                                                    type="button"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setViewportLayerIds(prev => {
                                                                            const current = prev[i];
                                                                            const base = (current?.length ? current : visibleLayers.map(l => l.id));
                                                                            const next = base.includes(layer.id)
                                                                                ? base.filter(id => id !== layer.id)
                                                                                : [...base, layer.id];
                                                                            return { ...prev, [i]: next.length ? next : [] };
                                                                        });
                                                                    }}
                                                                    className="w-full flex items-center gap-2 px-3 py-1.5 text-left text-[11px] hover:bg-slate-50"
                                                                >
                                                                    <span className={`w-3.5 h-3.5 rounded border flex items-center justify-center shrink-0 ${isInViewport ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-300'}`}>
                                                                        {isInViewport ? <Check size={10} /> : null}
                                                                    </span>
                                                                    <span className="truncate">{layer.label}</span>
                                                                </button>
                                                            );
                                                        })
                                                    )}
                                                    {allLayers.length > 0 && (
                                                        <button
                                                            type="button"
                                                            onClick={(e) => { e.stopPropagation(); setViewportLayerIds(prev => ({ ...prev, [i]: [] })); setOpenViewportDropdown(null); }}
                                                            className="w-full px-3 py-1.5 text-[10px] text-slate-500 hover:bg-slate-50 border-t border-slate-100"
                                                        >
                                                            使用全部可见图层
                                                        </button>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            );
                        })}
                    </div>

                    {/* Time Player Deployment */}
                    {isTimePlayerDropped && (
                        <div 
                            style={{ 
                                position: 'absolute',
                                top: timePlayerPosition.top,
                                bottom: timePlayerPosition.bottom,
                                left: timePlayerPosition.left,
                                right: timePlayerPosition.right,
                                zIndex: 50,
                                width: 'fit-content'
                            }}
                            className={`cursor-move transition-all rounded-lg ${activeComponentEditor?.type === 'timePlayer' ? 'flowing-border-active shadow-blue-200/50' : ''}`}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                setDraggingComponent({ type: 'timePlayer' });
                                setLastMousePos({ x: e.clientX, y: e.clientY });
                                setActiveEditorTab('components');
                                setActiveComponentEditor({ type: 'timePlayer' });
                            }}
                        >
                            <button 
                                className={`absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 transition-all duration-300 ${activeComponentEditor?.type === 'timePlayer' ? 'opacity-100 scale-110 shadow-lg z-[60]' : 'opacity-0 hover:opacity-100'}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsTimePlayerDropped(false);
                                    if (activeComponentEditor?.type === 'timePlayer') {
                                        setActiveComponentEditor(null);
                                    }
                                }}
                            >
                                <Trash2 size={12} />
                            </button>
                            <TimePlayerProvider>
                                <TimePlayer config={timePlayerConfig} onTimeChange={handleTimeChange} />
                            </TimePlayerProvider>
                        </div>
                    )}

                    {/* Summary Indicator Deployment */}
                    {summaryIndicators.map(indicator => (
                        <div 
                            key={indicator.id}
                            style={{ 
                                top: indicator.position.top, 
                                left: indicator.position.left !== undefined ? indicator.position.left : undefined,
                                right: indicator.position.right !== undefined ? indicator.position.right : (indicator.position.left === undefined ? 24 : undefined),
                                width: indicator.config.width ? `${indicator.config.width}px` : undefined,
                                height: indicator.config.height ? `${indicator.config.height}px` : undefined,
                            }}
                            className={`absolute z-50 bg-white/90 backdrop-blur-md border shadow-lg rounded-xl p-4 min-w-[160px] flex flex-col justify-center animate-slideDown cursor-move transition-all ${activeComponentEditor?.id === indicator.id ? 'flowing-border-active border-transparent shadow-blue-200/50' : 'border-slate-200 hover:border-blue-400'}`}
                            onMouseDown={(e) => {
                                e.stopPropagation();
                                setDraggingComponent({ type: 'indicator', id: indicator.id });
                                setLastMousePos({ x: e.clientX, y: e.clientY });
                                setActiveEditorTab('components');
                                setActiveComponentEditor({ type: 'summaryIndicator', id: indicator.id });
                            }}
                            onClick={(e) => {
                                e.stopPropagation();
                            }}
                        >
                            <button 
                                className={`absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 transition-all duration-300 ${activeComponentEditor?.id === indicator.id ? 'opacity-100 scale-110 shadow-lg z-[60]' : 'opacity-0 hover:opacity-100'}`}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setSummaryIndicators(prev => prev.filter(i => i.id !== indicator.id));
                                    if (activeComponentEditor?.id === indicator.id) {
                                        setActiveComponentEditor(null);
                                    }
                                }}
                            >
                                <Trash2 size={12} />
                            </button>
                            <div className="text-[11px] font-bold text-slate-500 mb-1">{indicator.config.title}</div>
                            <div className="flex items-baseline gap-1">
                                <span className="text-2xl font-black tracking-tight" style={{ color: indicator.config.color || '#2563eb' }}>{indicator.config.value}</span>
                                <span className="text-xs font-bold text-slate-400">{indicator.config.unit}</span>
                            </div>
                            {/* 右下角尺寸调整手柄 */}
                            <div
                                role="button"
                                tabIndex={0}
                                title="拖拽调整尺寸"
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                    const w = indicator.config.width ?? 160;
                                    const h = indicator.config.height ?? 80;
                                    setResizingSummaryId({ id: indicator.id, startX: e.clientX, startY: e.clientY, startWidth: w, startHeight: h });
                                }}
                                className="absolute bottom-0 right-0 w-6 h-6 cursor-se-resize flex items-center justify-center rounded-tl-lg border-l border-t border-slate-200/80 bg-slate-100/80 hover:bg-blue-100/80 text-slate-400 hover:text-blue-600 transition-colors"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></svg>
                            </div>
                        </div>
                    ))}

                    {/* Bar Chart Deployment */}
                    {barChartIndicators.map(indicator => {
                        // Generate mock data based on config
                        const categories = ['无算法', '有算法有接口', '有算法无接口', '有算法无模型'];
                        const subCategories = ['可见光', '多光谱', '照片', 'SAR', '其他', '热红外', '视频流'];
                        const colors = ['#3b82f6', '#22c55e', '#f59e0b', '#f97316', '#a855f7', '#6366f1', '#2dd4bf', '#84cc16'];
                        
                        let data = categories.map(cat => {
                            const obj: any = { name: cat };
                            subCategories.forEach(sub => {
                                obj[sub] = Math.floor(Math.random() * 50);
                            });
                            return obj;
                        });

                        if (indicator.config.sortOrder === 'desc') {
                            data = [...data].reverse();
                        }

                        return (
                            <div 
                                key={indicator.id}
                                style={{ 
                                    top: indicator.position.top, 
                                    left: indicator.position.left !== undefined ? indicator.position.left : undefined,
                                    right: indicator.position.right !== undefined ? indicator.position.right : (indicator.position.left === undefined ? 24 : undefined),
                                    width: indicator.config.width || 500,
                                    height: indicator.config.height || 400
                                }}
                                className={`absolute z-50 bg-white/95 backdrop-blur-md border shadow-2xl rounded-2xl p-6 animate-slideDown cursor-move transition-all flex flex-col ${activeComponentEditor?.id === indicator.id ? 'flowing-border-active border-transparent shadow-blue-200/50' : 'border-slate-200 hover:border-blue-400'}`}
                                onMouseDown={(e) => {
                                    e.stopPropagation();
                                    setDraggingComponent({ type: 'barChart', id: indicator.id });
                                    setLastMousePos({ x: e.clientX, y: e.clientY });
                                    setActiveEditorTab('components');
                                    setActiveComponentEditor({ type: 'barChart', id: indicator.id });
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                }}
                            >
                                <button 
                                    className={`absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 transition-all duration-300 hover:scale-110 shadow-lg z-[60] ${activeComponentEditor?.id === indicator.id ? 'opacity-100' : 'opacity-0'}`}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setBarChartIndicators(prev => prev.filter(i => i.id !== indicator.id));
                                        if (activeComponentEditor?.id === indicator.id) {
                                            setActiveComponentEditor(null);
                                        }
                                    }}
                                >
                                    <Trash2 size={14} />
                                </button>
                                
                                <div className="flex items-center justify-between mb-4 shrink-0">
                                    <div>
                                        <div className="text-[11px] font-bold text-slate-500 mb-1">{indicator.config.title}</div>
                                    </div>
                                    {indicator.config.unit && (
                                        <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500">单位: {indicator.config.unit}</span>
                                    )}
                                </div>

                                <div className="flex-1 min-h-0 relative">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis 
                                                dataKey="name" 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                                            />
                                            <YAxis 
                                                axisLine={false} 
                                                tickLine={false} 
                                                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
                                            />
                                            <Tooltip 
                                                cursor={{ fill: '#f8fafc' }}
                                                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                                                itemStyle={{ fontSize: '11px', fontWeight: 600 }}
                                                labelStyle={{ fontSize: '12px', fontWeight: 800, color: '#1e293b', marginBottom: '4px' }}
                                            />
                                            <Legend 
                                                verticalAlign="top" 
                                                align="center" 
                                                iconType="circle"
                                                iconSize={8}
                                                wrapperStyle={{ paddingBottom: '20px', fontSize: '10px', fontWeight: 700, color: '#64748b' }}
                                            />
                                            {subCategories.map((sub, idx) => (
                                                <Bar 
                                                    key={sub} 
                                                    dataKey={sub} 
                                                    fill={colors[idx % colors.length]} 
                                                    radius={[4, 4, 0, 0]} 
                                                    barSize={12}
                                                >
                                                    <LabelList dataKey={sub} position="top" style={{ fill: colors[idx % colors.length], fontSize: 10, fontWeight: 700 }} />
                                                </Bar>
                                            ))}
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>

                                {/* Resize handle */}
                                <div 
                                    className="absolute bottom-1 right-1 w-4 h-4 cursor-nwse-resize flex items-center justify-center text-slate-300 hover:text-blue-500 transition-colors"
                                    onMouseDown={(e) => {
                                        e.stopPropagation();
                                        e.preventDefault();
                                        const startX = e.clientX;
                                        const startY = e.clientY;
                                        const startWidth = indicator.config.width || 500;
                                        const startHeight = indicator.config.height || 400;

                                        const onMouseMove = (moveEvent: MouseEvent) => {
                                            const newWidth = Math.max(300, startWidth + (moveEvent.clientX - startX));
                                            const newHeight = Math.max(200, startHeight + (moveEvent.clientY - startY));
                                            setBarChartIndicators(prev => prev.map(i => 
                                                i.id === indicator.id ? { ...i, config: { ...i.config, width: newWidth, height: newHeight } } : i
                                            ));
                                        };

                                        const onMouseUp = () => {
                                            document.removeEventListener('mousemove', onMouseMove);
                                            document.removeEventListener('mouseup', onMouseUp);
                                        };

                                        document.addEventListener('mousemove', onMouseMove);
                                        document.addEventListener('mouseup', onMouseUp);
                                    }}
                                >
                                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <path d="M10 0L0 10M10 5L5 10M10 8L8 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                                    </svg>
                                </div>
                            </div>
                        );
                    })}

                    {/* 右侧主工具条交互重构 - 弹出子面板独立化 */}
                    <div className="absolute bottom-12 right-6 flex flex-col items-end gap-3 z-50 animate-slideUp">
                        <div className="flex flex-col gap-2 pointer-events-auto">
                            <MapToolBtn icon={isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />} label={isFullscreen ? "退出全屏" : "全屏"} onClick={toggleFullscreen} />
                            <MapToolBtn icon={<Plus size={14} />} label="地图放大" onClick={() => setZoom(z => Math.min(22, z + 1))} />
                            <MapToolBtn icon={<Minus size={14} />} label="地图缩小" onClick={() => setZoom(z => Math.max(1, z - 1))} />
                        </div>
                        {/* 底图切换组件 */}
                        <MiniBaseMapSwitcher
                            activeId={activeBaseMap}
                            enabledIds={enabledBaseMaps}
                            onSelect={id => {
                                setActiveBaseMap(id);
                                // bring selected to top of enabled list (LRU order)
                                setEnabledBaseMaps(prev => [id, ...prev.filter(x => x !== id)]);
                            }}
                        />
                    </div>

                    {/* 地图图例面板 */}
                    {legends.some(g => g.entries.some(e => !e.isHidden)) && (
                        <div className="absolute bottom-12 left-6 z-20 flex flex-col items-start gap-3 pointer-events-none">
                            {isLegendExpanded ? (
                                <div className="max-w-[240px] max-h-[300px] overflow-y-auto custom-scrollbar bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-2xl shadow-2xl p-4 animate-slideUp pointer-events-auto ring-1 ring-slate-900/5">
                                    <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100/50">
                                        <div className="flex items-center gap-2">
                                            <List size={14} className="text-blue-600" />
                                            <span className="text-[12px] font-black text-slate-800 uppercase tracking-wider">地图图例</span>
                                        </div>
                                        <button 
                                            onClick={() => setIsLegendExpanded(false)}
                                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-all"
                                            title="收起图例"
                                        >
                                            <PanelRightClose size={14} />
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {legends.map(group => {
                                            const visibleEntries = group.entries.filter(e => !e.isHidden);
                                            if (visibleEntries.length === 0) return null;
                                            return (
                                                <div key={group.layerId} className="space-y-2">
                                                    <div className="text-[11px] font-bold text-slate-500 truncate" title={group.layerName}>
                                                        {group.layerName}
                                                    </div>
                                                    {rasterLayerIds.has(group.layerId) ? (
                                                        <div className="pl-1">
                                                            <RasterLegendRamp rasterStyle={layerStyleSettings[group.layerId]?.raster} />
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1.5 pl-1">
                                                            {visibleEntries.map(entry => (
                                                                <div key={entry.id} className="flex items-center gap-2.5">
                                                                    <div 
                                                                        className={`w-3.5 h-3.5 shadow-sm border border-white transition-all ${entry.type === 'POINT' ? 'rounded-full' : 'rounded-sm'}`} 
                                                                        style={{ backgroundColor: entry.style.color }}
                                                                    ></div>
                                                                    <span className="text-[11px] font-medium text-slate-600 truncate">{entry.label}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            ) : (
                                <button 
                                    onClick={() => setIsLegendExpanded(true)}
                                    className="w-10 h-10 bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-xl shadow-xl flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-white transition-all pointer-events-auto animate-in zoom-in-75 ring-1 ring-slate-900/5"
                                    title="展开图例"
                                >
                                    <PanelRightOpen size={14} />
                                </button>
                            )}
                        </div>
                    )}

                    {/* 空间信息条 */}
                    <div className="absolute bottom-0 left-0 right-0 h-9 bg-white/80 backdrop-blur-xl border-t border-slate-200/60 z-30 flex items-center px-4 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] pointer-events-none">
                        <div className="flex-1 flex items-center divide-x divide-slate-200 h-5">
                            <div className="flex items-center gap-1.5 px-4 first:pl-0">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">层级:</span>
                                <span className="text-sm font-black text-blue-600 font-mono tracking-tight">{zoom}</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">经度:</span>
                                <span className="text-xs font-black text-emerald-600 font-mono tracking-tighter">114.302100°E</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">纬度:</span>
                                <span className="text-xs font-black text-emerald-600 font-mono tracking-tighter">30.589200°N</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">高程:</span>
                                <span className="text-xs font-black text-amber-600 font-mono tracking-tighter">24.5 m</span>
                            </div>
                            <div className="flex items-center gap-1.5 px-4">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">顶部图层:</span>
                                <span className="text-xs font-black text-slate-800 tracking-tight">{visibleLayerLabels[0] || '默认底图'}</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-4 divide-x divide-slate-200 h-5 ml-auto">
                            <div className="px-4 flex items-center">
                                <span className="text-[10px] font-black text-slate-300 font-mono tracking-widest">EPSG:4326</span>
                            </div>
                            <div className="pl-4 flex items-center">
                                <button 
                                    onClick={() => setIsTableViewOpen(!isTableViewOpen)}
                                    className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 pointer-events-auto ${isTableViewOpen ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                                >
                                    <BarChart2 size={12} />
                                    图表视图
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 全屏预览层 (独立外挂渲染) */}
                    {isPreviewOpen && (
                        <ScenePreview 
                            sceneData={getSceneData()} 
                            onGoMapping={(layers, drawn, sceneLegends) => onGoMapping(layers, drawn, sceneLegends)}
                            onClose={() => {
                                setIsPreviewOpen(false);
                                if (initialPreviewOpen) {
                                    onBack();
                                }
                            }} 
                        />
                    )}

                    {isGenerating && (
                        <div className="absolute inset-0 z-[100] bg-slate-900/40 backdrop-blur-sm flex items-center justify-center animate-fadeIn">
                            <div className="bg-white p-8 rounded-3xl shadow-2xl flex flex-col items-center gap-4 max-w-sm text-center animate-zoomIn">
                                <div className="relative">
                                    <div className="w-16 h-16 border-4 border-blue-100 border-t-blue-600 rounded-full animate-spin"></div>
                                    <Rocket className="absolute inset-0 m-auto text-blue-600 animate-bounce" size={24} />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-slate-800 mb-1">正在运行地表覆盖分类算法</h3>
                                    <p className="text-xs text-slate-500 font-bold">基于高分遥感影像进行智能解译与矢量化...</p>
                                </div>
                                <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-2">
                                    <div className="h-full bg-blue-600 animate-progress"></div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 卷帘对比插件 (独立外挂渲染) */}
                    {isSwipeActive && (
                        <MapSwipePlugin 
                            visibleLayers={visibleLayers} 
                            onClose={() => setIsSwipeActive(false)} 
                            zoom={zoom}
                            center={mapCenter}
                            dimension={dimension}
                            baseMapType={activeBaseMap}
                        />
                    )}

                    {isExitConfirmOpen && (
                        <ExitConfirmModal 
                            onClose={() => setIsExitConfirmOpen(false)} 
                            onConfirm={confirmSaveAndExit}
                            onExitWithoutSave={onBack}
                        />
                    )}
                </div>
                {isTableViewOpen && (
                    <div className="h-[300px] bg-white border-t border-slate-200 z-30 animate-slideUp overflow-hidden flex flex-col">
                        <TableView 
                            layerId={selectedLayerIdForTable} 
                            featureId={selectedFeatureIdForTable}
                            onClose={() => setIsTableViewOpen(false)}
                        />
                    </div>
                )}
                {isPublishModalOpen && (
                    <PublishModal 
                        onClose={() => setIsPublishModalOpen(false)} 
                        onConfirm={handlePublishToMarket}
                        marketTree={marketTree}
                    />
                )}
            </div>
        </div>

            {isModalOpen && (
                <FolderModal mode={modalMode} initialParentId={modalInitialParentId} initialNode={editingNode} onClose={() => setIsModalOpen(false)} onConfirm={(data) => handleFolderTreeAction(modalMode === 'edit' ? 'edit' : 'add', data)} folders={flattenedFolders} />
            )}

            {isAddMethodModalOpen && (
                <AddLayerMethodModal onClose={() => setIsAddMethodModalOpen(false)} onAddImport={() => { setIsAddMethodModalOpen(false); setIsImportDataModalOpen(true); }} onAddService={() => { setIsAddMethodModalOpen(false); setIsAddServiceModalOpen(true); }} />
            )}

            {isImportDataModalOpen && (
                <ImportDataModal onClose={() => setIsImportDataModalOpen(false)} onConfirm={handleBatchImportConfirm} folders={flattenedFolders} />
            )}

            {isAddServiceModalOpen && (
                <AddServiceModal onClose={() => setIsAddServiceModalOpen(false)} onConfirm={handleAddServiceConfirm} folders={flattenedFolders} />
            )}

            {editingLegendEntry && (
                <LegendEditorModal 
                    entry={legends.find(g => g.layerId === editingLegendEntry.layerId)?.entries.find(e => e.id === editingLegendEntry.entryId)!}
                    onClose={() => setEditingLegendEntry(null)}
                    onSave={(payload) => {
                        handleUpdateLegend(editingLegendEntry.layerId, editingLegendEntry.entryId, payload);
                        setEditingLegendEntry(null);
                    }}
                    onRemove={() => {
                        handleRemoveLegendEntry(editingLegendEntry.layerId, editingLegendEntry.entryId);
                        setEditingLegendEntry(null);
                    }}
                />
            )}

            {isStyleSettingsOpen && (
                <StyleSettingsModal
                    visibleLayers={visibleLayers.map(l => ({ id: l.id, label: l.label }))}
                    selectedLayerId={selectedStyleLayerId}
                    onLayerChange={setSelectedStyleLayerId}
                    layerType={selectedStyleLayerId ? detectLayerRenderType(selectedStyleLayerId) : 'vector'}
                    bandMeta={selectedStyleLayerId ? getLayerBandMeta(selectedStyleLayerId) : []}
                    initialSettings={selectedStyleLayerId ? layerStyleSettings[selectedStyleLayerId] : undefined}
                    onApply={(payload) => {
                        if (!selectedStyleLayerId) return;
                        setLayerStyleSettings(prev => ({ ...prev, [selectedStyleLayerId]: payload }));
                        if (payload.layerType === 'vector' && payload.vector) {
                            const vec = payload.vector;
                            if (vec.styleMode === '单一色') {
                                setLegends(prev => prev.map(group => {
                                    if (group.layerId !== selectedStyleLayerId) return group;
                                    const type = group.entries[0]?.type || 'POLYGON';
                                    return {
                                        ...group,
                                        entries: [{
                                            id: `${group.layerId}-single`,
                                            label: '单一色',
                                            type,
                                            style: {
                                                color: vec.singleFillColor || '#4A90E2',
                                                opacity: 1,
                                                strokeColor: vec.singleStrokeColor || '#2563EB',
                                                strokeWidth: vec.singleStrokeWidth ?? 1,
                                            },
                                            isHidden: false
                                        }]
                                    };
                                }));
                            } else if (vec.styleMode === '分层设色' && vec.grades && vec.grades.length > 0) {
                                setLegends(prev => prev.map(group => {
                                    if (group.layerId !== selectedStyleLayerId) return group;
                                    const type = group.entries[0]?.type || 'POLYGON';
                                    return {
                                        ...group,
                                        entries: vec.grades!.map(g => ({
                                            id: `${group.layerId}-grad-${g.id}`,
                                            label: g.label,
                                            type,
                                            style: {
                                                color: g.color,
                                                opacity: 0.85,
                                                strokeColor: '#ffffff',
                                                strokeWidth: 0.5,
                                            },
                                            isHidden: false
                                        }))
                                    };
                                }));
                            }
                        }
                        if (payload.layerType === 'raster' && payload.raster) {
                            setLegends(prev => prev.map(group => {
                                if (group.layerId !== selectedStyleLayerId) return group;
                                const nextEntries = [...group.entries];
                                if (nextEntries[0]) {
                                    nextEntries[0] = {
                                        ...nextEntries[0],
                                        label: payload.raster!.renderType === 'rgb'
                                            ? `RGB(${payload.raster.rBand}/${payload.raster.gBand}/${payload.raster.bBand})`
                                            : `单波段(${payload.raster.rBand})`
                                    };
                                }
                                return { ...group, entries: nextEntries };
                            }));
                        }
                    }}
                    onClose={() => setIsStyleSettingsOpen(false)}
                />
            )}

            {metadataModal && (
                <MetadataModal
                    title={metadataModal.title}
                    items={metadataModal.items}
                    onClose={() => setMetadataModal(null)}
                />
            )}
        </div>
    );
};

// --- Missing Sub-components Definitions ---

const ExitConfirmModal: React.FC<{
    onClose: () => void;
    onConfirm: () => void;
    onExitWithoutSave: () => void;
}> = ({ onClose, onConfirm, onExitWithoutSave }) => {
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-slideUp border border-white/20">
                <div className="p-8">
                    <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 mx-auto">
                        <Save size={32} className="text-blue-600" />
                    </div>
                    <h3 className="text-xl font-black text-slate-900 text-center mb-2 tracking-tight">保存修改</h3>
                    <p className="text-slate-500 text-center text-sm leading-relaxed px-4">
                        检测到您对地图场景进行了编辑，是否保存当前修改？
                    </p>
                </div>
                <div className="p-6 bg-slate-50 flex flex-col gap-3">
                    <button 
                        onClick={onConfirm}
                        className="w-full py-4 bg-blue-600 text-white rounded-2xl text-sm font-black shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                    >
                        <Check size={18} />
                        保存并退出
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                        <button 
                            onClick={onExitWithoutSave}
                            className="py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black hover:bg-slate-100 active:scale-[0.98] transition-all"
                        >
                            不保存退出
                        </button>
                        <button 
                            onClick={onClose}
                            className="py-3.5 bg-white border border-slate-200 text-slate-600 rounded-2xl text-xs font-black hover:bg-slate-100 active:scale-[0.98] transition-all"
                        >
                            取消
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const PublishModal: React.FC<{
    onClose: () => void;
    onConfirm: (data: { name: string; theme: string; description: string; tags: string[] }) => void;
    initialData?: MapScene;
    marketTree?: MarketNode[];
}> = ({ onClose, onConfirm, initialData, marketTree = [] }) => {
    const [name, setName] = useState(initialData?.title || '');
    const [theme, setTheme] = useState(initialData?.theme || '');
    const [description, setDescription] = useState(initialData?.description || '');
    const [tags, setTags] = useState<string[]>(initialData?.tags || []);
    const [tagInput, setTagInput] = useState('');

    const flatDirectories = useMemo(() => {
        const flatten = (nodes: MarketNode[]): { id: string, label: string }[] => {
            let result: { id: string, label: string }[] = [];
            nodes.forEach(node => {
                result.push({ id: node.id, label: node.label });
                if (node.children) {
                    result = result.concat(flatten(node.children));
                }
            });
            return result;
        };
        return flatten(marketTree);
    }, [marketTree]);

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-[500px] border border-slate-200 overflow-hidden animate-zoomIn">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
                        <Rocket size={20} className="text-blue-600" /> {initialData ? '更新场景信息' : '发布地图场景'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={24} /></button>
                </div>
                <div className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">场景名称</label>
                        <input value={name} onChange={e => setName(e.target.value)} type="text" className="w-full h-11 px-4 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all font-bold text-slate-800" placeholder="给您的地图起个响亮的名称" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">集市场景目录</label>
                        <select value={theme} onChange={e => setTheme(e.target.value)} className="w-full h-11 px-4 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all font-bold text-slate-800 bg-white appearance-none">
                            <option value="">选择一个集市目录</option>
                            {flatDirectories.map(dir => (
                                <option key={dir.id} value={dir.id}>{dir.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">场景描述</label>
                        <textarea
                            value={description}
                            onChange={e => setDescription(e.target.value)}
                            className="w-full min-h-[84px] px-4 py-3 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all text-xs font-bold text-slate-800 resize-none"
                            placeholder="请输入场景描述，用于集市卡片展示"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-xs font-black text-slate-500 uppercase tracking-widest">搜索标签</label>
                        <div className="flex flex-wrap gap-2 p-2 border border-slate-200 rounded-xl min-h-[44px]">
                            {tags.map(t => (
                                <span key={t} className="px-2 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-lg flex items-center gap-1 uppercase">
                                    {t} <X size={10} className="cursor-pointer" onClick={() => setTags(tags.filter(i => i !== t))} />
                                </span>
                            ))}
                            <input value={tagInput} onChange={e => setTagInput(e.target.value)} onKeyDown={e => {
                                if (e.key === 'Enter' && tagInput.trim()) {
                                    setTags([...tags, tagInput.trim()]);
                                    setTagInput('');
                                }
                            }} className="flex-1 outline-none text-xs font-bold px-2" placeholder="输入并回车" />
                        </div>
                    </div>
                </div>
                <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-black hover:bg-slate-50 transition-all">取消</button>
                    <button onClick={() => onConfirm({ name, theme, description, tags })} className="px-10 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all">确认发布</button>
                </div>
            </div>
        </div>
    );
};

/**
 * 专题出图面板 (Thematic Mapping) - 一比一复刻视觉
 */
const ThematicMappingPanel: React.FC<{ 
    activeLayers: string[]; 
    drawnFeatures: DrawnFeature[]; 
    legends: LayerLegendGroup[];
    onBack: () => void;
}> = ({ activeLayers, drawnFeatures, legends, onBack }) => {
    // 专题图元数据状态
    const [title, setTitle] = useState('某地区专题制图展示');
    const [description, setDescription] = useState('本图展示了当前行政区域内的关键地理要素分布，包含图层数据与现场勘查标绘要素。数据来源于时空大数据管理平台 Engine V2.1，支持动态更新。');
    const [author, setAuthor] = useState('系统管理员');
    const [mappingDate, setMappingDate] = useState('2026/2/13');

    return (
        <div className="flex-1 flex h-full bg-[#f4f7f9] animate-fadeIn font-sans text-slate-800">
            {/* 左侧：专题图信息编辑侧边栏 */}
            <aside className="w-80 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 z-20 shadow-xl overflow-y-auto custom-scrollbar">
                <div className="p-6 space-y-8">
                    {/* Header */}
                    <div className="flex items-center gap-3 pb-6 border-b border-slate-100">
                        <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100">
                            <Printer size={20} />
                        </div>
                        <div>
                            <h2 className="text-base font-black tracking-tight text-slate-900 uppercase">专题图信息编辑</h2>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-80">Configure Metadata & Visuals</p>
                        </div>
                    </div>

                    {/* Section: Layers Inbound */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2">
                            <Layers size={16} className="text-blue-600" />
                            <h3 className="text-[13px] font-black text-slate-700 uppercase tracking-wider">出图涉及内容</h3>
                        </div>
                        <div className="flex flex-wrap gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100 min-h-[60px]">
                            {activeLayers.map(l => (
                                <span key={l} className="px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] font-bold text-slate-600 flex items-center gap-1.5 shadow-sm">
                                    <div className="w-1.5 h-1.5 rounded-full bg-blue-500"></div>
                                    {l}
                                </span>
                            ))}
                        </div>
                    </div>

                    {/* Section: Main Meta */}
                    <div className="space-y-5">
                        <div className="space-y-1.5">
                            <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest px-1">专题图标题</label>
                            <input 
                                value={title}
                                onChange={e => setTitle(e.target.value)}
                                type="text" 
                                className="w-full h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-black outline-none focus:bg-white focus:border-blue-400 transition-all shadow-sm"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest px-1">专题说明文字</label>
                            <textarea 
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 leading-relaxed outline-none focus:bg-white focus:border-blue-400 transition-all shadow-sm resize-none custom-scrollbar"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest px-1">绘制人信息</label>
                            <div className="relative group">
                                <input 
                                    value={author}
                                    onChange={e => setAuthor(e.target.value)}
                                    type="text" 
                                    className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-blue-400 transition-all shadow-sm"
                                />
                                <User size={14} className="absolute left-4 top-3 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[12px] font-black text-slate-400 uppercase tracking-widest px-1">制图日期</label>
                            <div className="relative group">
                                <input 
                                    value={mappingDate}
                                    onChange={e => setMappingDate(e.target.value)}
                                    type="text" 
                                    className="w-full h-10 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:bg-white focus:border-blue-400 transition-all shadow-sm"
                                />
                                <Calendar size={14} className="absolute left-4 top-3 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sidebar Footer Buttons */}
                <div className="mt-auto p-6 space-y-3 bg-slate-50/50 border-t border-slate-100">
                    <button className="w-full py-3.5 bg-blue-600 text-white rounded-xl text-xs font-black shadow-xl shadow-blue-900/20 hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2">
                        <Download size={16} /> 导出为图片
                    </button>
                    <button onClick={onBack} className="w-full py-3.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black shadow-sm hover:bg-slate-50 transition-all flex items-center justify-center gap-2">
                        返回编辑器
                    </button>
                </div>
            </aside>
            
            {/* 右侧：高保真制图画布区域 */}
            <main className="flex-1 overflow-hidden p-12 flex items-center justify-center bg-slate-200">
                <div className="mapping-canvas-paper bg-white w-full max-w-[900px] aspect-[1.414/1] shadow-[0_40px_100px_rgba(0,0,0,0.15)] rounded-sm border-[1px] border-slate-400 p-8 relative animate-zoomIn flex flex-col gap-6">
                    {/* 内边框装饰 */}
                    <div className="absolute inset-4 pointer-events-none border-[2px] border-slate-800 opacity-90 rounded-sm"></div>
                    
                    {/* A. 地图核心内容区 */}
                    <div className="flex-1 relative overflow-hidden bg-slate-100 border border-slate-300 rounded-sm">
                        <img 
                            src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4d/BlankMap-World.svg/2560px-BlankMap-World.svg.png" 
                            className="w-full h-full object-cover opacity-50 grayscale brightness-110 mix-blend-multiply" 
                            alt="" 
                        />
                        
                        {/* 装饰性元素复刻 */}
                        {/* 1. 指北针 */}
                        <div className="absolute top-6 right-8 flex flex-col items-center gap-1 scale-125">
                            <div className="p-1.5 rounded-full border-2 border-slate-800 flex items-center justify-center bg-white shadow-sm">
                                <Compass size={24} className="text-slate-800" />
                            </div>
                            <span className="text-xs font-black text-slate-800 tracking-tighter">N</span>
                        </div>

                        {/* 2. 比例尺 */}
                        <div className="absolute bottom-10 left-10 flex flex-col gap-1">
                            <div className="flex h-[3px] items-center">
                                <div className="w-16 h-full bg-slate-800 border-r-2 border-white"></div>
                                <div className="w-16 h-full bg-white border border-slate-800"></div>
                            </div>
                            <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest pl-2">500km</span>
                        </div>

                        {/* 3. 动态图例 (一比一复刻) */}
                        <div className="absolute bottom-8 right-8 w-52 bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl rounded-2xl p-4 animate-slideUp">
                            <div className="flex items-center gap-2 mb-3 pb-1.5 border-b border-slate-100">
                                <List size={12} className="text-blue-600" />
                                <span className="text-[11px] font-black text-slate-800 uppercase tracking-widest">图例 LEGEND</span>
                            </div>
                            <div className="space-y-2.5">
                                {legends.map(group => (
                                    <div key={group.layerId} className="space-y-1.5">
                                        {group.entries.filter(e => !e.isHidden).map(entry => (
                                            <div key={entry.id} className="flex items-center gap-3">
                                                <div 
                                                    className="w-3.5 h-3.5 shadow-sm border border-white rounded-md" 
                                                    style={{ backgroundColor: entry.style.color }}
                                                ></div>
                                                <span className="text-[11px] font-bold text-slate-600 truncate">{group.layerName}</span>
                                            </div>
                                        ))}
                                    </div>
                                ))}
                                {/* 装饰性补充项 */}
                                <div className="flex items-center gap-3 opacity-40">
                                    <div className="w-4 h-0.5 bg-slate-400 rounded-full"></div>
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">主要干道及水利支线</span>
                                </div>
                            </div>
                        </div>

                        {/* 4. 水印装饰 */}
                        <div className="absolute top-2 right-4 text-[9px] font-bold text-slate-300 uppercase tracking-[0.3em] pointer-events-none opacity-60">
                             © GEOSPATIAL BIG DATA PLATFORM DESIGNER
                        </div>
                    </div>

                    {/* B. 底部注记区 (一比一复刻布局) */}
                    <div className="h-44 flex flex-col gap-6 px-4 pb-4">
                        {/* 1. 主标题 */}
                        <div className="flex flex-col items-center">
                            <h1 className="text-[28px] font-black tracking-tight text-slate-900 mb-1">{title}</h1>
                            <div className="h-1 w-48 bg-blue-600/30 rounded-full"></div>
                        </div>

                        {/* 2. 详细元数据行 */}
                        <div className="flex-1 flex gap-12 pt-2">
                            {/* 左：专题说明 */}
                            <div className="flex-1 flex flex-col gap-2">
                                <div className="flex items-center gap-2 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                                    <ScrollText size={14} className="text-slate-300" />
                                    专题说明 DESCRIPTION
                                </div>
                                <p className="text-[13px] text-slate-600 leading-relaxed font-bold line-clamp-3">
                                    {description}
                                </p>
                            </div>

                            {/* 右：制图信息网格 */}
                            <div className="w-[300px] grid grid-cols-2 gap-y-3 border-l border-slate-100 pl-8 h-fit">
                                <MetaRow label="绘制人 AUTHOR" value={author} />
                                <MetaRow label="日期 DATE" value={mappingDate} />
                                <div className="col-span-2 flex items-center justify-between pt-2 border-t border-slate-50">
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em]">系统 VER</span>
                                    <span className="text-[10px] font-black text-blue-600 font-mono tracking-widest uppercase">ENGINE V2.1.2</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
};

// 专题图元数据行组件
const MetaRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex flex-col gap-0.5">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.1em]">{label}</span>
        <span className="text-[13px] font-black text-slate-800 tracking-tight truncate">{value}</span>
    </div>
);

const ToolbarIcon: React.FC<{ icon: React.ReactNode; active: boolean; label: string; onClick: () => void }> = ({ icon, active, label, onClick }) => (
    <button 
        onClick={onClick}
        className={`p-2 rounded-lg transition-all flex flex-col items-center gap-1 ${active ? 'text-blue-600 bg-blue-50 shadow-sm' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
        title={label}
    >
        {icon}
    </button>
);

const SplitMenuItem: React.FC<{ label: string; icon: React.ReactNode; active: boolean; onClick: () => void }> = ({ label, icon, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all ${active ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
    >
        {icon}
        <span>{label}</span>
    </button>
);

const LayerTreeNodeItem: React.FC<{
    node: LayerNode;
    level: number;
    selectedId: string;
    onSelect: (id: string) => void;
    onToggle: (id: string) => void;
    onDrop: (id: string, product: DataProduct) => void;
    onAddClick: (id: string) => void;
    onEditClick: (node: LayerNode) => void;
    onDeleteClick: (id: string) => void;
    onToggleVisibility: (id: string) => void;
    onRunAlgorithm?: (id: string) => void;
    onNodeDrop: (draggedId: string, targetId: string, position: 'before' | 'after' | 'inside') => void;
    getFolderFeatures: (folderId: string) => DrawnFeature[];
    editingFeatureId: string | null;
    editingFeatureName: string;
    onStartRenameFeature: (id: string) => void;
    onCommitRenameFeature: () => void;
    onCancelRenameFeature: () => void;
    onEditingFeatureNameChange: (name: string) => void;
    onDeleteFeature: (id: string) => void;
    onOpenMetadata: (node: LayerNode) => void;
}> = ({
    node,
    level,
    selectedId,
    onSelect,
    onToggle,
    onDrop,
    onAddClick,
    onEditClick,
    onDeleteClick,
    onToggleVisibility,
    onRunAlgorithm,
    onNodeDrop,
    getFolderFeatures,
    editingFeatureId,
    editingFeatureName,
    onStartRenameFeature,
    onCommitRenameFeature,
    onCancelRenameFeature,
    onEditingFeatureNameChange,
    onDeleteFeature,
    onOpenMetadata
}) => {
    const isSelected = selectedId === node.id;
    const hasChildren = node.children && node.children.length > 0;
    const folderFeatures = node.type === 'folder' ? getFolderFeatures(node.id) : [];
    const [dragPosition, setDragPosition] = useState<'before' | 'after' | 'inside' | null>(null);

    const handleDragStart = (e: React.DragEvent) => {
        e.dataTransfer.setData('nodeId', node.id);
        e.dataTransfer.effectAllowed = 'move';
        // Optional: set drag image
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        
        const rect = e.currentTarget.getBoundingClientRect();
        const y = e.clientY - rect.top;
        const height = rect.height;
        
        if (node.type === 'folder') {
            if (y < height * 0.25) setDragPosition('before');
            else if (y > height * 0.75) setDragPosition('after');
            else setDragPosition('inside');
        } else {
            if (y < height * 0.5) setDragPosition('before');
            else setDragPosition('after');
        }
    };

    const handleDragLeave = () => {
        setDragPosition(null);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        const currentDragPosition = dragPosition;
        setDragPosition(null);
        
        const draggedNodeId = e.dataTransfer.getData('nodeId');
        if (draggedNodeId) {
            if (draggedNodeId !== node.id && currentDragPosition) {
                onNodeDrop(draggedNodeId, node.id, currentDragPosition);
            }
            return;
        }

        if (node.type === 'folder') {
            const productData = e.dataTransfer.getData('product');
            if (productData) {
                onDrop(node.id, JSON.parse(productData));
            }
        }
    };

    return (
        <div className="flex flex-col">
            <div 
                draggable={true}
                onDragStart={handleDragStart}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => onSelect(node.id)}
                className={`flex items-center h-9 px-2 rounded-lg cursor-pointer group/node transition-all relative ${isSelected ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-50'} ${dragPosition === 'inside' ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`}
                style={{ paddingLeft: `${level * 16 + 8}px` }}
            >
                {dragPosition === 'before' && (
                    <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500 z-10" />
                )}
                {dragPosition === 'after' && (
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 z-10" />
                )}
                <div className="w-5 flex items-center justify-center shrink-0">
                    {hasChildren && (
                        <button onClick={(e) => { e.stopPropagation(); onToggle(node.id); }} className="p-0.5 hover:bg-blue-100 rounded">
                            {node.isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </button>
                    )}
                </div>
                <div className="w-5 shrink-0 flex items-center justify-center mr-1.5">
                    {node.type === 'folder' ? (
                        node.isExpanded ? <FolderOpen size={16} className="text-blue-500" /> : <Folder size={16} className="text-slate-400" />
                    ) : node.layerSourceType === 'businessTable' ? (
                        <Table size={14} className={isSelected ? 'text-blue-600' : 'text-slate-400'} title="业务表数据，点击显隐打开图表视图" />
                    ) : (
                        <Database size={14} className={isSelected ? 'text-blue-600' : 'text-slate-400'} />
                    )}
                </div>
                <span className="flex-1 truncate text-xs">{node.label}</span>
                <div className="flex items-center gap-1 opacity-0 group-hover/node:opacity-100 transition-opacity pr-1">
                    {node.id === 'lyr-1' && onRunAlgorithm && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onRunAlgorithm(node.id); }} 
                            className="p-1 hover:text-blue-600 transition-colors"
                            title="运行地表覆盖分类算法"
                        >
                            <Rocket size={14} />
                        </button>
                    )}
                    {node.type === 'layer' && (
                        <button onClick={(e) => { e.stopPropagation(); onToggleVisibility(node.id); }} className="p-1 hover:text-blue-600">
                            {node.isVisible !== false ? <EyeIcon size={14} /> : <EyeOff size={14} />}
                        </button>
                    )}
                    {node.type === 'layer' && (
                        <button
                            onClick={(e) => { e.stopPropagation(); onOpenMetadata(node); }}
                            className="p-1 hover:text-blue-600"
                            title="查看元数据"
                        >
                            <Info size={14} />
                        </button>
                    )}
                    {node.type === 'folder' && (
                        <button onClick={(e) => { e.stopPropagation(); onAddClick(node.id); }} className="p-1 hover:text-blue-600" title="添加子目录">
                            <Plus size={14} />
                        </button>
                    )}
                    <button onClick={(e) => { e.stopPropagation(); onEditClick(node); }} className="p-1 hover:text-blue-600">
                        <Edit3 size={13} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); onDeleteClick(node.id); }} className="p-1 hover:text-red-500">
                        <Trash2 size={13} />
                    </button>
                </div>
            </div>
            {folderFeatures.length > 0 && (
                <div className="ml-10 mt-1 space-y-1">
                    {folderFeatures.map(f => (
                        <div
                            key={f.id}
                            className="flex items-center text-[11px] text-slate-600 bg-slate-50 hover:bg-blue-50 rounded px-2 py-1 group/feat"
                        >
                            <span className="mr-1.5 flex items-center justify-center w-4">
                                {f.type === 'point' && <MapPin size={12} className="text-red-500" />}
                                {f.type === 'line' && <div className="w-3 h-[2px] bg-blue-500 rounded-full" />}
                                {f.type === 'polygon' && <Grid size={12} className="text-emerald-600" />}
                                {f.type === 'circle' && <LucideCircle size={12} className="text-blue-600" />}
                                {f.type === 'text' && <Type size={12} className="text-slate-500" />}
                            </span>
                            {editingFeatureId === f.id ? (
                                <>
                                    <input
                                        value={editingFeatureName}
                                        onChange={(e) => onEditingFeatureNameChange(e.target.value)}
                                        onClick={(e) => e.stopPropagation()}
                                        onBlur={(e) => {
                                            e.stopPropagation();
                                            onCommitRenameFeature();
                                        }}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') {
                                                e.preventDefault();
                                                onCommitRenameFeature();
                                            }
                                            if (e.key === 'Escape') {
                                                e.preventDefault();
                                                onCancelRenameFeature();
                                            }
                                        }}
                                        className="flex-1 h-6 px-2 text-[11px] bg-white border border-blue-300 rounded outline-none focus:ring-4 focus:ring-blue-50"
                                        placeholder="输入名称"
                                        autoFocus
                                    />
                                </>
                            ) : (
                                <>
                                    <span className="flex-1 truncate">{f.name}</span>
                                    <button
                                        className="px-1 text-[10px] text-slate-400 hover:text-blue-600"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onStartRenameFeature(f.id);
                                        }}
                                    >
                                        重命名
                                    </button>
                                </>
                            )}
                            <button
                                className="px-1 text-[10px] text-slate-400 hover:text-rose-600"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteFeature(f.id);
                                }}
                            >
                                删除
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {node.isExpanded && node.children?.map(child => (
                <LayerTreeNodeItem 
                    key={child.id} 
                    node={child} 
                    level={level + 1} 
                    selectedId={selectedId} 
                    onSelect={onSelect} 
                    onToggle={onToggle} 
                    onDrop={onDrop} 
                    onAddClick={onAddClick} 
                    onEditClick={onEditClick} 
                    onDeleteClick={onDeleteClick} 
                    onToggleVisibility={onToggleVisibility} 
                    onRunAlgorithm={onRunAlgorithm}
                    onNodeDrop={onNodeDrop}
                    getFolderFeatures={getFolderFeatures}
                    editingFeatureId={editingFeatureId}
                    editingFeatureName={editingFeatureName}
                    onStartRenameFeature={onStartRenameFeature}
                    onCommitRenameFeature={onCommitRenameFeature}
                    onCancelRenameFeature={onCancelRenameFeature}
                    onEditingFeatureNameChange={onEditingFeatureNameChange}
                    onDeleteFeature={onDeleteFeature}
                    onOpenMetadata={onOpenMetadata}
                />
            ))}
        </div>
    );
};

const DataProductItem: React.FC<{ product: DataProduct; onOpenMetadata: (product: DataProduct) => void }> = ({ product, onOpenMetadata }) => (
    <div 
        draggable
        onDragStart={e => {
            e.dataTransfer.setData('product', JSON.stringify(product));
        }}
        className="flex items-center gap-3 p-2 rounded-xl hover:bg-blue-50 transition-all cursor-grab active:cursor-grabbing group"
    >
        <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-100 flex-shrink-0">
            <img src={product.thumbnail} alt="" className="w-full h-full object-cover grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all" />
        </div>
        <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-slate-700 truncate">{product.name}</div>
            <div className="text-[10px] text-slate-400 font-medium flex items-center gap-2">
                <Link2 size={12} className="text-blue-500" />
                {(() => {
                    const label = product.serviceType || product.source;
                    const idx = label.indexOf('点');
                    if (idx === -1) return <span>{label}</span>;
                    const before = label.slice(0, idx);
                    const after = label.slice(idx + 1);
                    return (
                        <span className="inline-flex items-center gap-1">
                            <span>{before}</span>
                            <Dot size={18} className="text-blue-500 -mx-1" />
                            <span>{after}</span>
                        </span>
                    );
                })()}
            </div>
        </div>
        <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onOpenMetadata(product); }}
            className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-white transition-all opacity-0 group-hover:opacity-100"
            title="查看元数据"
        >
            <Info size={14} />
        </button>
        <GripVertical size={14} className="text-slate-300 group-hover:text-blue-400" />
    </div>
);

export const WuhanVectorMap = () => {
    // Simplified Wuhan administrative districts with land cover
    return (
        <svg className="w-full h-full opacity-90" viewBox="0 0 800 600">
            {/* Jiang'an */}
            <path d="M 420 280 L 450 260 L 470 280 L 450 310 Z" fill="#f43f5e" stroke="#fff" strokeWidth="0.5" />
            {/* Jianghan */}
            <path d="M 400 290 L 420 280 L 430 300 L 410 310 Z" fill="#8b5cf6" stroke="#fff" strokeWidth="0.5" />
            {/* Qiaokou */}
            <path d="M 380 300 L 400 290 L 410 310 L 390 320 Z" fill="#fbbf24" stroke="#fff" strokeWidth="0.5" />
            {/* Hanyang */}
            <path d="M 380 320 L 410 310 L 420 340 L 390 350 Z" fill="#64748b" stroke="#fff" strokeWidth="0.5" />
            {/* Wuchang */}
            <path d="M 430 300 L 460 310 L 470 340 L 440 350 Z" fill="#f43f5e" stroke="#fff" strokeWidth="0.5" />
            
            {/* Larger districts */}
            {/* Huangpi (North) */}
            <path d="M 350 50 L 550 50 L 600 200 L 450 250 L 300 200 Z" fill="#10b981" fillOpacity="0.4" stroke="#fff" strokeWidth="1" />
            {/* Xinzhou (East) */}
            <path d="M 550 50 L 750 150 L 700 400 L 550 350 L 500 200 Z" fill="#fbbf24" fillOpacity="0.4" stroke="#fff" strokeWidth="1" />
            {/* Jiangxia (South) */}
            <path d="M 400 400 L 600 450 L 550 580 L 350 550 L 300 450 Z" fill="#10b981" fillOpacity="0.4" stroke="#fff" strokeWidth="1" />
            {/* Caidian (West) */}
            <path d="M 100 250 L 300 200 L 350 400 L 200 500 L 50 400 Z" fill="#fbbf24" fillOpacity="0.4" stroke="#fff" strokeWidth="1" />
            
            {/* Detailed classification grid simulation */}
            {Array.from({ length: 20 }).map((_, i) => (
                Array.from({ length: 20 }).map((_, j) => {
                    const x = 300 + i * 15;
                    const y = 200 + j * 15;
                    // Only draw if inside a rough Wuhan shape
                    const dist = Math.sqrt(Math.pow(x - 400, 2) + Math.pow(y - 300, 2));
                    if (dist > 180) return null;
                    
                    const colors = ['#10b981', '#fbbf24', '#3b82f6', '#f43f5e', '#64748b', '#8b5cf6'];
                    const color = colors[(i * j + i + j) % colors.length];
                    return (
                        <rect 
                            key={`${i}-${j}`} 
                            x={x} y={y} width="14" height="14" 
                            fill={color} 
                            fillOpacity="0.7"
                            stroke="rgba(255,255,255,0.2)"
                            strokeWidth="0.5"
                        />
                    );
                })
            ))}
            
            {/* Labels */}
            <text x="420" y="150" fill="#065f46" fontSize="14" fontWeight="black">黄陂区 (林地/耕地)</text>
            <text x="600" y="250" fill="#92400e" fontSize="14" fontWeight="black">新洲区 (耕地)</text>
            <text x="450" y="500" fill="#065f46" fontSize="14" fontWeight="black">江夏区 (林地/湖泊)</text>
            <text x="150" y="350" fill="#92400e" fontSize="14" fontWeight="black">蔡甸区 (耕地/水系)</text>
            <text x="410" y="325" fill="#fff" fontSize="10" fontWeight="black" textAnchor="middle">中心城区 (建设用地)</text>
        </svg>
    );
};

export const GoogleMapTileGrid: React.FC<{ 
    type: string; 
    zoom: number; 
    center: { lat: number; lon: number }; 
    opacity?: number;
    zIndex?: number;
    scale?: number;
}> = ({ type, zoom, center, opacity = 1, zIndex = 1, scale = 1 }) => {
    const n = Math.pow(2, zoom);
    const centerX = (center.lon + 180) / 360 * n;
    const latRad = center.lat * Math.PI / 180;
    const centerY = (1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2 * n;

    const tileX = Math.floor(centerX);
    const tileY = Math.floor(centerY);

    const offsetX = (centerX - tileX) * 256;
    const offsetY = (centerY - tileY) * 256;

    const tiles = [];
    const range = zoom < 3 ? 2 : 3; 
    for (let i = -range; i <= range; i++) {
        for (let j = -range; j <= range; j++) {
            const x = (tileX + i + n) % n;
            const y = tileY + j;
            if (y >= 0 && y < n) {
                tiles.push({ x, y, i, j });
            }
        }
    }

    let lyrs = 'y';
    if (type === 'roadmap') lyrs = 'm';
    else if (type === 'satellite') lyrs = 's';
    else if (type === 'terrain') lyrs = 'p';
    else if (type === 'elevation') lyrs = 't';
    else if (type === '3d_model') lyrs = 's,h';
    else if (type === 'tianditu_vec') lyrs = 'm';
    else if (type === 'tianditu_img') lyrs = 's';
    else if (type === 'tianditu_street') lyrs = 'm';
    else if (type === 'baidu_vec') lyrs = 'm';
    else if (type === 'baidu_img') lyrs = 's';
    else if (type === 'baidu_street') lyrs = 'm';

    return (
        <div 
            className="absolute inset-0 flex items-center justify-center pointer-events-none transition-all duration-500"
            style={{ 
                opacity, 
                zIndex,
                transform: `scale(${scale})`,
                transformOrigin: 'center center',
                filter: opacity < 1 ? 'blur(2px)' : 'none'
            }}
        >
            <div 
                className="relative"
                style={{ 
                    width: 0, 
                    height: 0,
                    transform: `translate(${-offsetX}px, ${-offsetY}px)`
                }}
            >
                {tiles.map(t => (
                    <img
                        key={`${t.x}-${t.y}-${zoom}-${t.i}-${t.j}`}
                        src={`https://www.google.com/maps/vt?lyrs=${lyrs}@189&gl=cn&x=${Math.floor(t.x)}&y=${Math.floor(t.y)}&z=${zoom}`}
                        className="absolute w-[256px] h-[256px] max-w-none border-none select-none"
                        style={{
                            left: t.i * 256,
                            top: t.j * 256
                        }}
                        alt=""
                    />
                ))}
            </div>
        </div>
    );
};

export const GoogleMapLayer: React.FC<{ type: string; zoom: number; center: { lat: number; lon: number }; dimension: '2D' | '3D' }> = ({ type, zoom, center, dimension }) => {
    const [displayZoom, setDisplayZoom] = useState(zoom);
    const [prevZoom, setPrevZoom] = useState<number | null>(null);
    const [isChanging, setIsChanging] = useState(false);

    useEffect(() => {
        if (zoom !== displayZoom) {
            setPrevZoom(displayZoom);
            setDisplayZoom(zoom);
            setIsChanging(true);
            const timer = setTimeout(() => {
                setIsChanging(false);
                setPrevZoom(null);
            }, 800);
            return () => clearTimeout(timer);
        }
    }, [zoom, displayZoom]);

    return (
        <div 
            className="absolute inset-0 overflow-hidden bg-slate-900 transition-all duration-1000"
            style={{
                perspective: dimension === '3D' ? '1200px' : 'none',
            }}
        >
            <div 
                className="w-full h-full transition-all duration-1000 ease-in-out"
                style={{
                    transform: dimension === '3D' ? 'rotateX(45deg) scale(1.5) translateY(-10%)' : 'rotateX(0deg) scale(1)',
                    transformOrigin: 'center bottom'
                }}
            >
                {prevZoom !== null && (
                    <>
                        <GoogleMapTileGrid 
                            type={prevZoom === zoom ? type : (prevZoom > zoom ? type : type)} 
                            zoom={prevZoom} 
                            center={center} 
                            opacity={isChanging ? 0.6 : 0}
                            zIndex={1}
                            scale={Math.pow(2, displayZoom - prevZoom)}
                        />
                        {type === 'elevation' && (
                            <GoogleMapTileGrid 
                                type="satellite" 
                                zoom={prevZoom} 
                                center={center} 
                                opacity={isChanging ? 0.3 : 0}
                                zIndex={1}
                                scale={Math.pow(2, displayZoom - prevZoom)}
                            />
                        )}
                    </>
                )}
                
                {/* Elevation mode: layer terrain and satellite */}
                {type === 'elevation' ? (
                    <>
                        <GoogleMapTileGrid 
                            type="elevation" 
                            zoom={displayZoom} 
                            center={center} 
                            opacity={1}
                            zIndex={2}
                        />
                        <GoogleMapTileGrid 
                            type="satellite" 
                            zoom={displayZoom} 
                            center={center} 
                            opacity={0.4}
                            zIndex={3}
                        />
                    </>
                ) : (
                    <GoogleMapTileGrid 
                        type={type} 
                        zoom={displayZoom} 
                        center={center} 
                        opacity={1}
                        zIndex={2}
                    />
                )}
            </div>
            
            {dimension === '3D' && (
                <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-transparent"></div>
            )}
        </div>
    );
};

const BASE_MAP_LIST = [
    { id: 'roadmap',        label: '谷歌电子地图',   thumb: 'https://www.google.com/maps/vt?lyrs=m@189&gl=cn&x=26&y=13&z=5' },
    { id: 'satellite',      label: '谷歌卫星影像',   thumb: 'https://www.google.com/maps/vt?lyrs=s@189&gl=cn&x=26&y=13&z=5' },
    { id: 'terrain',        label: '谷歌地形图',     thumb: 'https://www.google.com/maps/vt?lyrs=p@189&gl=cn&x=26&y=13&z=5' },
    { id: 'hybrid',         label: '谷歌混合图层',   thumb: 'https://www.google.com/maps/vt?lyrs=y@189&gl=cn&x=26&y=13&z=5' },
    { id: '3d_model',       label: '谷歌三维模型图', thumb: 'https://www.google.com/maps/vt?lyrs=s,h@189&gl=cn&x=26&y=13&z=5' },
    { id: 'elevation',      label: '谷歌高程图',     thumb: 'https://www.google.com/maps/vt?lyrs=t@189&gl=cn&x=26&y=13&z=5' },
    { id: 'tianditu_vec',   label: '天地图电子地图', thumb: 'https://www.google.com/maps/vt?lyrs=m@189&gl=cn&x=26&y=13&z=5' },
    { id: 'tianditu_img',   label: '天地图影像底图', thumb: 'https://www.google.com/maps/vt?lyrs=s@189&gl=cn&x=26&y=13&z=5' },
    { id: 'tianditu_street',label: '天地图街景底图', thumb: 'https://www.google.com/maps/vt?lyrs=m@189&gl=cn&x=26&y=13&z=5' },
    { id: 'baidu_vec',      label: '百度电子地图',   thumb: 'https://www.google.com/maps/vt?lyrs=m@189&gl=cn&x=26&y=13&z=5' },
    { id: 'baidu_img',      label: '百度影像底图',   thumb: 'https://www.google.com/maps/vt?lyrs=s@189&gl=cn&x=26&y=13&z=5' },
    { id: 'baidu_street',   label: '百度街景底图',   thumb: 'https://www.google.com/maps/vt?lyrs=m@189&gl=cn&x=26&y=13&z=5' },
];

const BaseMapListPanel: React.FC<{
    activeId: string;
    onSelect: (id: string) => void;
    enabledIds: string[];
    onToggleEnabled: (id: string) => void;
    defaultId: string;
    onSetDefault: (id: string) => void;
}> = ({ activeId, onSelect, enabledIds, onToggleEnabled, defaultId, onSetDefault }) => {
    return (
        <div className="p-4 space-y-4">
            {/* hint */}
            <div className="flex items-start gap-2 bg-blue-50 border border-blue-100 rounded-xl px-3 py-2.5 text-[11px] text-blue-700">
                <Info size={13} className="mt-0.5 flex-shrink-0 text-blue-500" />
                <span>勾选底图后，地图右下角切换组件将显示对应底图。<br />点击 <span className="font-black">★ 设为默认</span> 可设置场景打开时的初始底图。</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
                {BASE_MAP_LIST.map(m => {
                    const isEnabled = enabledIds.includes(m.id);
                    const isDefault = defaultId === m.id;
                    const isActive = activeId === m.id;
                    return (
                        <div key={m.id} className="relative group flex flex-col gap-2">
                            {/* thumbnail */}
                            <div
                                onClick={() => { onToggleEnabled(m.id); if (!isEnabled) onSelect(m.id); }}
                                className={`relative aspect-[4/3] rounded-lg overflow-hidden border-2 cursor-pointer transition-all select-none
                                    ${isEnabled ? 'border-blue-500 shadow-md ring-2 ring-blue-500/20' : 'border-transparent hover:border-blue-300 opacity-60 hover:opacity-90'}`}
                            >
                                <img src={m.thumb} className="w-full h-full object-cover" alt="" />
                                <div className={`absolute inset-0 transition-all ${isEnabled ? 'bg-transparent' : 'bg-black/10'}`} />

                                {/* checkbox top-left */}
                                <div
                                    className={`absolute top-1.5 left-1.5 rounded border-2 flex items-center justify-center transition-all ${isEnabled ? 'bg-blue-600 border-blue-600' : 'bg-white/80 border-slate-300'}`}
                                    style={{ width: 16, height: 16 }}
                                >
                                    {isEnabled && <Check size={10} className="text-white" strokeWidth={3} />}
                                </div>

                                {/* default star badge top-right */}
                                <button
                                    onClick={e => { e.stopPropagation(); onSetDefault(m.id); }}
                                    title={isDefault ? '默认底图' : '设为默认'}
                                    className={`absolute top-1 right-1 rounded-full p-0.5 shadow transition-all
                                        ${isDefault
                                            ? 'bg-amber-400 text-white opacity-100'
                                            : 'bg-black/40 text-white/70 opacity-0 group-hover:opacity-100 hover:bg-amber-400 hover:text-white'}`}
                                >
                                    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 21 12 17.77 5.82 21 7 14.14 2 9.27l6.91-1.01L12 2z"/>
                                    </svg>
                                </button>

                                {/* preview bar */}
                                {isEnabled && (
                                    <button
                                        onClick={e => { e.stopPropagation(); onSelect(m.id); }}
                                        title="预览此底图"
                                        className={`absolute bottom-0 inset-x-0 py-0.5 text-center text-[9px] font-black text-white transition-all
                                            ${isActive ? 'bg-blue-500' : 'bg-black/40 opacity-0 group-hover:opacity-100'}`}
                                    >
                                        {isActive ? '当前预览' : '预览'}
                                    </button>
                                )}
                            </div>

                            {/* label row */}
                            <div className="flex items-center gap-1 px-0.5">
                                <span className={`text-[11px] font-black flex-1 truncate transition-colors ${isEnabled ? 'text-slate-700' : 'text-slate-400'}`}>
                                    {m.label}
                                </span>
                                {isDefault && (
                                    <span className="text-[9px] font-black text-amber-500 bg-amber-50 border border-amber-200 rounded-full px-1.5 py-0.5 flex-shrink-0">默认</span>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const TimePlayerSettingsPanel: React.FC<{
    config: TimePlayerConfig;
    onChange: (config: TimePlayerConfig) => void;
    onBack: () => void;
    onRemove: () => void;
    layers: LayerNode[];
}> = ({ config, onChange, onBack, onRemove, layers }) => {
    const getLayerList = (nodes: LayerNode[]): { id: string, label: string }[] => {
        let list: { id: string, label: string }[] = [];
        nodes.forEach(n => {
            if (n.type === 'layer') {
                list.push({ id: n.id, label: n.label });
            }
            if (n.children) {
                list = list.concat(getLayerList(n.children));
            }
        });
        return list;
    };
    const availableLayers = getLayerList(layers);

    const addTimePoint = () => {
        onChange({
            ...config,
            timePoints: [...config.timePoints, { id: `tp-${Date.now()}`, time: '', layerId: '' }]
        });
    };

    const updateTimePoint = (id: string, updates: Partial<TimePointConfig>) => {
        onChange({
            ...config,
            timePoints: config.timePoints.map(tp => tp.id === id ? { ...tp, ...updates } : tp)
        });
    };

    const removeTimePoint = (id: string) => {
        onChange({
            ...config,
            timePoints: config.timePoints.filter(tp => tp.id !== id)
        });
    };

    return (
        <div className="h-full flex flex-col bg-white">
            <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50/50">
                <div className="flex items-center gap-2">
                    <button onClick={onBack} className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors">
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs font-bold text-slate-700">时序播放设置</span>
                </div>
                <button onClick={onRemove} className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors" title="移除组件">
                    <Trash2 size={14} />
                </button>
            </div>
            <div className="p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">时间点配置</label>
                    <button onClick={addTimePoint} className="flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded text-xs font-bold transition-colors">
                        <Plus size={12} />
                        添加
                    </button>
                </div>
                
                <div className="space-y-3">
                    {config.timePoints.map((tp, index) => (
                        <div key={tp.id} className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-3 relative group">
                            <button 
                                onClick={() => removeTimePoint(tp.id)}
                                className="absolute top-2 right-2 p-1 text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <Trash2 size={12} />
                            </button>
                            <div className="text-[10px] font-bold text-slate-400">节点 {index + 1}</div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500">时间选择</label>
                                <input 
                                    type="date" 
                                    value={tp.time}
                                    onChange={e => updateTimePoint(tp.id, { time: e.target.value })}
                                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-bold text-slate-500">数据选择 (关联图层)</label>
                                <select 
                                    value={tp.layerId}
                                    onChange={e => updateTimePoint(tp.id, { layerId: e.target.value })}
                                    className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                >
                                    <option value="">-- 请选择图层 --</option>
                                    {availableLayers.map(l => (
                                        <option key={l.id} value={l.id}>{l.label}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    ))}
                    {config.timePoints.length === 0 && (
                        <div className="text-center py-6 text-xs text-slate-400 bg-slate-50 border border-dashed border-slate-200 rounded-lg">
                            暂无时间点，请点击上方添加
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const SummaryIndicatorSettingsPanel: React.FC<{
    config: { title: string; value: string; unit: string; layerId: string; fieldId?: string; color: string; width?: number; height?: number };
    onChange: (config: { title: string; value: string; unit: string; layerId: string; fieldId?: string; color: string; width?: number; height?: number }) => void;
    onBack: () => void;
    onRemove: () => void;
    layers: LayerNode[];
}> = ({ config, onChange, onBack, onRemove, layers }) => {
    // Flatten layers to get a list of available layers
    const getLayerList = (nodes: LayerNode[]): { id: string, label: string }[] => {
        let list: { id: string, label: string }[] = [];
        nodes.forEach(n => {
            if (n.type === 'layer') {
                list.push({ id: n.id, label: n.label });
            }
            if (n.children) {
                list = list.concat(getLayerList(n.children));
            }
        });
        return list;
    };
    const availableLayers = getLayerList(layers);

    // Mock fields for the selected layer
    const getFieldsForLayer = (layerId: string) => {
        if (!layerId) return [];
        return [
            { id: 'area', name: '面积 (Area)', type: 'number' },
            { id: 'pop', name: '人口 (Population)', type: 'number' },
            { id: 'gdp', name: 'GDP', type: 'number' },
            { id: 'length', name: '长度 (Length)', type: 'number' },
            { id: 'count', name: '数量 (Count)', type: 'number' }
        ];
    };
    const availableFields = getFieldsForLayer(config.layerId);

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2">
                    <button onClick={onBack} className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors">
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs font-bold text-slate-700">汇总指标设置</span>
                </div>
                <button onClick={onRemove} className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors" title="移除组件">
                    <Trash2 size={14} />
                </button>
            </div>
            <div className="p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">统计标题</label>
                    <input 
                        type="text" 
                        value={config.title}
                        onChange={e => onChange({ ...config, title: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                        placeholder="例如：总面积"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">关联图层</label>
                    <select 
                        value={config.layerId}
                        onChange={e => onChange({ ...config, layerId: e.target.value, fieldId: '' })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    >
                        <option value="">-- 请选择图层 --</option>
                        {availableLayers.map(l => (
                            <option key={l.id} value={l.id}>{l.label}</option>
                        ))}
                    </select>
                </div>
                {config.layerId && (
                    <>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">汇总字段</label>
                            <select 
                                value={config.fieldId || ''}
                                onChange={e => {
                                    const newFieldId = e.target.value;
                                    // Mock calculation based on selected field
                                    let mockValue = config.value;
                                    let mockUnit = config.unit;
                                    if (newFieldId === 'area') { mockValue = '12,500'; mockUnit = '平方公里'; }
                                    else if (newFieldId === 'pop') { mockValue = '1,200,000'; mockUnit = '人'; }
                                    else if (newFieldId === 'gdp') { mockValue = '450'; mockUnit = '亿元'; }
                                    else if (newFieldId === 'length') { mockValue = '3,400'; mockUnit = '公里'; }
                                    else if (newFieldId === 'count') { mockValue = '85'; mockUnit = '个'; }
                                    
                                    onChange({ ...config, fieldId: newFieldId, value: mockValue, unit: mockUnit });
                                }}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            >
                                <option value="">-- 请选择汇总字段 --</option>
                                {availableFields.map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">数值单位</label>
                            <input 
                                type="text" 
                                value={config.unit}
                                onChange={e => onChange({ ...config, unit: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                placeholder="例如：平方公里"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">主题色</label>
                            <div className="flex items-center gap-2">
                                <input 
                                    type="color" 
                                    value={config.color}
                                    onChange={e => onChange({ ...config, color: e.target.value })}
                                    className="w-8 h-8 rounded cursor-pointer border-0 p-0"
                                />
                                <input 
                                    type="text" 
                                    value={config.color}
                                    onChange={e => onChange({ ...config, color: e.target.value })}
                                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">组件宽度</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={config.width || 160}
                                        onChange={e => onChange({ ...config, width: parseInt(e.target.value) || 160 })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                        placeholder="160"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">PX</span>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">组件高度</label>
                                <div className="relative">
                                    <input 
                                        type="number" 
                                        value={config.height || 80}
                                        onChange={e => onChange({ ...config, height: parseInt(e.target.value) || 80 })}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                        placeholder="80"
                                    />
                                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-slate-400 font-bold">PX</span>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const BarChartSettingsPanel: React.FC<{
    config: { title: string; layerId: string; fieldId: string; categoryFieldId: string; sortOrder: 'asc' | 'desc'; color: string };
    onChange: (config: { title: string; layerId: string; fieldId: string; categoryFieldId: string; sortOrder: 'asc' | 'desc'; color: string }) => void;
    onBack: () => void;
    onRemove: () => void;
    layers: LayerNode[];
}> = ({ config, onChange, onBack, onRemove, layers }) => {
    const getLayerList = (nodes: LayerNode[]): { id: string, label: string }[] => {
        let list: { id: string, label: string }[] = [];
        nodes.forEach(n => {
            if (n.type === 'layer') {
                list.push({ id: n.id, label: n.label });
            }
            if (n.children) {
                list = list.concat(getLayerList(n.children));
            }
        });
        return list;
    };
    const availableLayers = getLayerList(layers);

    const getFieldsForLayer = (layerId: string) => {
        if (!layerId) return [];
        return [
            { id: 'area', name: '面积 (Area)', type: 'number' },
            { id: 'pop', name: '人口 (Population)', type: 'number' },
            { id: 'gdp', name: 'GDP', type: 'number' },
            { id: 'category', name: '分类 (Category)', type: 'string' }
        ];
    };
    const availableFields = getFieldsForLayer(config.layerId);

    return (
        <div className="flex flex-col h-full bg-white">
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-2">
                    <button onClick={onBack} className="p-1 hover:bg-slate-200 rounded text-slate-500 transition-colors">
                        <ChevronLeft size={16} />
                    </button>
                    <span className="text-xs font-bold text-slate-700">数据柱状图设置</span>
                </div>
                <button onClick={onRemove} className="p-1 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded transition-colors" title="移除组件">
                    <Trash2 size={14} />
                </button>
            </div>
            <div className="p-4 space-y-4 flex-1 overflow-y-auto custom-scrollbar">
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">统计标题</label>
                    <input 
                        type="text" 
                        value={config.title}
                        onChange={e => onChange({ ...config, title: e.target.value })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    />
                </div>
                <div className="space-y-1.5">
                    <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">关联图层</label>
                    <select 
                        value={config.layerId}
                        onChange={e => onChange({ ...config, layerId: e.target.value, fieldId: '', categoryFieldId: '' })}
                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                    >
                        <option value="">-- 请选择图层 --</option>
                        {availableLayers.map(l => (
                            <option key={l.id} value={l.id}>{l.label}</option>
                        ))}
                    </select>
                </div>
                {config.layerId && (
                    <>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">统计字段</label>
                            <select 
                                value={config.fieldId || ''}
                                onChange={e => onChange({ ...config, fieldId: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            >
                                <option value="">-- 请选择统计字段 --</option>
                                {availableFields.filter(f => f.type === 'number').map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">二级类别字段</label>
                            <select 
                                value={config.categoryFieldId || ''}
                                onChange={e => onChange({ ...config, categoryFieldId: e.target.value })}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            >
                                <option value="">-- 请选择类别字段 --</option>
                                {availableFields.filter(f => f.type === 'string').map(f => (
                                    <option key={f.id} value={f.id}>{f.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">排序设置</label>
                            <select 
                                value={config.sortOrder}
                                onChange={e => onChange({ ...config, sortOrder: e.target.value as 'asc' | 'desc' })}
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            >
                                <option value="asc">字段正序</option>
                                <option value="desc">字段逆序</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">数值单位</label>
                            <input 
                                type="text" 
                                value={config.unit || ''}
                                onChange={e => onChange({ ...config, unit: e.target.value })}
                                placeholder="例如：个、次"
                                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">组件宽度</label>
                                <input 
                                    type="number" 
                                    value={config.width || 500}
                                    onChange={e => onChange({ ...config, width: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">组件高度</label>
                                <input 
                                    type="number" 
                                    value={config.height || 400}
                                    onChange={e => onChange({ ...config, height: parseInt(e.target.value) })}
                                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                />
                            </div>
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">主题色</label>
                            <input 
                                type="color" 
                                value={config.color}
                                onChange={e => onChange({ ...config, color: e.target.value })}
                                className="w-full h-8 bg-slate-50 border border-slate-200 rounded-lg cursor-pointer"
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

const ComponentLibraryPanel: React.FC = () => {
    const COMPS = [
        { 
            label: '汇总指标', 
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="3" y="4" width="18" height="16" rx="2" fill="#3b82f6" fillOpacity="0.1" stroke="#3b82f6" strokeWidth="1.5"/>
                    <rect x="5" y="7" width="14" height="3" rx="0.5" fill="#3b82f6" fillOpacity="0.2"/>
                    <path d="M5 13H7M10 13H12M15 13H17M5 17H7M10 17H12" stroke="#3b82f6" strokeWidth="1.5" strokeLinecap="round"/>
                    <rect x="15" y="14" width="6" height="4" rx="1" fill="#3b82f6" stroke="white" strokeWidth="1"/>
                    <text x="16.5" y="17" fill="white" fontSize="4" fontWeight="bold">123</text>
                </svg>
            ) 
        },
        { 
            label: '数据柱状图', 
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="5" y="12" width="3" height="7" rx="1" fill="#3b82f6" fillOpacity="0.6"/>
                    <rect x="10.5" y="6" width="3" height="13" rx="1" fill="#3b82f6"/>
                    <rect x="16" y="10" width="3" height="9" rx="1" fill="#3b82f6" fillOpacity="0.8"/>
                </svg>
            ) 
        },
        { 
            label: '时序播放', 
            icon: (
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M4 17L8 13L11 15L16 9" stroke="#64748b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.3"/>
                    <path d="M16 9L19 6M19 6H15M19 6V10" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    <circle cx="18" cy="6" r="4.5" fill="white" fillOpacity="0.8" stroke="#3b82f6" strokeWidth="0.5"/>
                    <path d="M17.5 5L19 6L17.5 7V5Z" fill="#3b82f6"/>
                </svg>
            ) 
        },
    ];
    return (
        <div className="p-4 grid grid-cols-2 gap-3">
            {COMPS.map(c => (
                <div 
                    key={c.label}
                    draggable
                    onDragStart={e => e.dataTransfer.setData('component_label', c.label)}
                    className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex flex-col items-center gap-2 hover:border-blue-300 hover:bg-blue-50 cursor-grab active:cursor-grabbing transition-all group"
                >
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm group-hover:shadow-md transition-all">
                        {c.icon}
                    </div>
                    <span className="text-[11px] font-bold text-slate-500 group-hover:text-blue-700">{c.label}</span>
                </div>
            ))}
        </div>
    );
};

const LegendListPanel: React.FC<{
    legends: LayerLegendGroup[];
    rasterLayerIds: Set<string>;
    layerStyleSettings: Record<string, LayerStyleSettings>;
    onOpenLayerStyle: (layerId: string) => void;
    onResetLayerStyle: (layerId: string) => void;
    onToggleHidden: (layerId: string, entryId: string) => void;
    onRemoveEntry: (layerId: string, entryId: string) => void;
    onOpenEditor: (layerId: string, entryId: string) => void;
}> = ({ legends, rasterLayerIds, layerStyleSettings, onOpenLayerStyle, onResetLayerStyle, onToggleHidden, onRemoveEntry, onOpenEditor }) => (
    <div className="p-3 space-y-4">
        {legends.map(group => (
            <div key={group.layerId} className="bg-slate-50 rounded-xl border border-slate-100 overflow-hidden">
                <div className="px-3 py-2 bg-slate-100/50 border-b border-slate-200/50 flex items-center justify-between">
                    <span className="text-xs font-black text-slate-700 truncate max-w-[160px]">{group.layerName}</span>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={() => onResetLayerStyle(group.layerId)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                            title="重置该图层样式"
                        >
                            <Undo2 size={13} />
                        </button>
                        <button
                            onClick={() => onOpenLayerStyle(group.layerId)}
                            className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all"
                            title="设置该图层样式"
                        >
                            <Settings2 size={13} />
                        </button>
                    </div>
                </div>
                <div className="p-2 space-y-1">
                    {rasterLayerIds.has(group.layerId) ? (
                        <RasterLegendRamp rasterStyle={layerStyleSettings[group.layerId]?.raster} />
                    ) : group.entries.map((entry) => (
                        <div key={entry.id} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white transition-all group">
                            <div 
                                onClick={() => onOpenEditor(group.layerId, entry.id)}
                                className={`w-3.5 h-3.5 rounded-sm border border-white shadow-sm cursor-pointer hover:scale-110 transition-transform`} 
                                style={{ backgroundColor: entry.style.color }}
                            ></div>
                            <span className="text-[11px] font-medium text-slate-600 flex-1 truncate">{entry.label}</span>
                            <button onClick={(e) => { e.stopPropagation(); onToggleHidden(group.layerId, entry.id); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5" title="显隐">
                                {entry.isHidden ? <EyeOff size={12} className="text-slate-300" /> : <EyeIcon size={12} className="text-slate-400 hover:text-blue-500" />}
                            </button>
                            {group.entries.length > 1 && (
                                <button onClick={(e) => { e.stopPropagation(); onRemoveEntry(group.layerId, entry.id); }} className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 text-slate-400 hover:text-rose-500" title="删除图例">
                                    <Trash2 size={12} />
                                </button>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        ))}
        {legends.length === 0 && (
            <div className="text-center py-20 text-slate-300 text-xs font-bold uppercase tracking-widest italic">No visible layers</div>
        )}
    </div>
);

const RasterLegendRamp: React.FC<{
    rasterStyle?: LayerStyleSettings['raster'];
}> = ({ rasterStyle }) => {
    const renderType    = rasterStyle?.renderType    ?? 'rgb';
    const colorBandMode = rasterStyle?.colorBandMode ?? 'Linear';
    const opacity       = rasterStyle?.opacity       ?? 80;

    const gradient = renderType === 'single'
        ? 'linear-gradient(to top, #000000 0%, #555555 33%, #aaaaaa 66%, #ffffff 100%)'
        : 'linear-gradient(to top, #ff1a1a 0%, #ff8a00 20%, #fff400 40%, #9be25a 60%, #53b75a 78%, #008000 100%)';

    const tickCount = colorBandMode === 'Equal Interval' ? 5 : 9;
    const ticks = Array.from({ length: tickCount }, (_, i) => {
        const v = 1 - i * (1 / (tickCount - 1));
        return Math.round(v * 1000) / 1000;
    });

    return (
        <div className="px-2 py-2">
            <div className="flex items-stretch gap-2.5">
                <div
                    className="w-4 flex-shrink-0 rounded-sm border border-slate-200 shadow-sm"
                    style={{ background: gradient, opacity: opacity / 100 }}
                />
                <div className="flex flex-col justify-between py-0.5 text-[10px] font-mono text-slate-400">
                    {ticks.map(t => <span key={t}>{t.toFixed(2)}</span>)}
                </div>
            </div>
        </div>
    );
};

const MapToolBtn: React.FC<{ 
    icon: React.ReactNode; 
    label: string; 
    active?: boolean; 
    onClick: () => void; 
    variant?: 'default' | 'danger';
    sub?: boolean;
}> = ({ icon, label, active, onClick, variant = 'default', sub }) => (
    <div className="relative group/tool">
        <button 
            onClick={onClick}
            className={`
                w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-xl bg-white/90 backdrop-blur-xl border border-slate-200/60 ring-1 ring-slate-900/5
                ${active 
                    ? 'bg-blue-600 text-white shadow-blue-900/40 ring-2 ring-blue-600/20' 
                    : variant === 'danger' 
                        ? 'text-slate-400 hover:text-rose-500 hover:bg-rose-50' 
                        : 'text-slate-500 hover:text-blue-600 hover:bg-white'}
                ${sub ? 'w-9 h-9' : ''}
            `}
        >
            {icon}
        </button>
        {!sub && (
            <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-2.5 py-1.5 bg-slate-900 text-white text-[10px] font-black rounded-lg shadow-2xl opacity-0 group-hover/tool:opacity-100 transition-all pointer-events-none whitespace-nowrap z-[100] uppercase tracking-wider">
                {label}
            </div>
        )}
    </div>
);

const FolderModal: React.FC<{ 
    mode: 'create' | 'edit'; 
    initialParentId: string; 
    initialNode?: LayerNode | null; 
    onClose: () => void; 
    onConfirm: (data: any) => void;
    folders: { id: string; label: string; level: number }[];
}> = ({ mode, initialParentId, initialNode, onClose, onConfirm, folders }) => {
    const [name, setName] = useState(initialNode?.label || '');
    const [parentId, setParentId] = useState(initialParentId || '');
    const [maxZoom, setMaxZoom] = useState<number>(22);
    const [error, setError] = useState<string | null>(null);

    // 判断是否为编辑图层模式
    const isEditingLayer = mode === 'edit' && initialNode?.type === 'layer';

    const handleConfirm = () => {
        let finalName = name.trim();
        
        // 用户输入为空默认给一个名字：图层目录
        if (!finalName) {
            finalName = '图层目录';
        }

        // 校验特殊字符：只允许中文、英文、数字、空格、下划线、连字符
        const specialCharRegex = /[^\u4e00-\u9fa5a-zA-Z0-9\s_-]/;
        if (specialCharRegex.test(finalName)) {
            setError('名称不能包含特殊字符');
            return;
        }

        setError(null);
        onConfirm({ id: initialNode?.id, parentId, name: finalName, maxZoom });
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-[450px] border border-slate-200 overflow-hidden animate-zoomIn">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                        {mode === 'edit' ? <Edit3 size={18} className="text-blue-600" /> : <FolderPlus size={18} className="text-blue-600" />}
                        {mode === 'edit' 
                            ? (isEditingLayer ? '编辑图层' : '编辑目录') 
                            : '添加目录'}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
                </div>
                <div className="p-8 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">
                            {isEditingLayer ? '图层名称' : '目录名称'}
                        </label>
                        <input 
                            value={name} 
                            onChange={e => {
                                setName(e.target.value);
                                if (error) setError(null);
                            }} 
                            type="text" 
                            className={`w-full h-11 px-4 border ${error ? 'border-red-500' : 'border-slate-200'} rounded-xl outline-none focus:border-blue-500 transition-all font-bold text-slate-800`} 
                            placeholder={`请输入${isEditingLayer ? '图层' : '目录'}名称`} 
                        />
                        {error && <p className="text-[10px] text-red-500 px-1 font-bold animate-shake">{error}</p>}
                    </div>
                    
                    {isEditingLayer && (
                        <div className="space-y-2 animate-fadeIn">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">
                                最大缩放层级
                            </label>
                            <input 
                                type="number" 
                                min="0" 
                                max="22" 
                                value={maxZoom} 
                                onChange={e => {
                                    const val = parseInt(e.target.value);
                                    if (isNaN(val)) setMaxZoom(0);
                                    else setMaxZoom(Math.min(22, Math.max(0, Math.floor(val))));
                                }}
                                className="w-full h-11 px-4 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all font-bold text-slate-800" 
                                placeholder="请输入 0-22 之间的整数" 
                            />
                            <p className="text-[10px] text-slate-400 px-1 italic">控制图层在地图缩放时的可见上限 (0-22)</p>
                        </div>
                    )}

                    {mode === 'create' && (
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">所属父级</label>
                            <select value={parentId} onChange={e => setParentId(e.target.value)} className="w-full h-11 px-4 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all font-bold text-slate-800 bg-white appearance-none">
                                <option value="">(根目录)</option>
                                {folders.map(f => (
                                    <option key={f.id} value={f.id}>{' '.repeat(f.level * 2)}{f.label}</option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>
                <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-black transition-all">取消</button>
                    <button onClick={handleConfirm} className="px-10 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">确定</button>
                </div>
            </div>
        </div>
    );
};

const AddLayerMethodModal: React.FC<{ onClose: () => void; onAddImport: () => void; onAddService: () => void }> = ({ onClose, onAddImport, onAddService }) => (
    <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
        <div className="bg-white rounded-2xl shadow-2xl w-[500px] border border-slate-200 overflow-hidden animate-zoomIn">
            <div className="px-8 py-6 border-b border-slate-50 flex items-center justify-between">
                <h3 className="text-[16px] font-black text-slate-800 uppercase tracking-tight">选择添加图层方式</h3>
                <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={22} /></button>
            </div>
            <div className="p-10 grid grid-cols-2 gap-8">
                <div onClick={onAddImport} className="group cursor-pointer flex flex-col items-center gap-4 p-6 rounded-2xl border-2 border-slate-50 hover:border-blue-500 hover:bg-blue-50 transition-all text-center">
                    <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><Database size={32} /></div>
                    <div>
                        <span className="text-sm font-black text-slate-800 block">导入在库数据</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">From Data Lake</span>
                    </div>
                </div>
                <div onClick={onAddService} className="group cursor-pointer flex flex-col items-center gap-4 p-6 rounded-2xl border-2 border-slate-50 hover:border-indigo-500 hover:bg-indigo-50 transition-all text-center">
                    <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform"><Globe size={32} /></div>
                    <div>
                        <span className="text-sm font-black text-slate-800 block">注册外部服务</span>
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">External OGC Svc</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
);

const ImportDataModal: React.FC<{ onClose: () => void; onConfirm: (items: DataProduct[], folderId: string) => void; folders: any[] }> = ({ onClose, onConfirm, folders }) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [targetFolderId, setTargetFolderId] = useState(folders[0]?.id || '');
    const ALL_PRODS = [...MOCK_DATA_PRODUCTS, ...MOCK_SERVICES];

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-[720px] h-[600px] border border-slate-200 overflow-hidden animate-zoomIn flex flex-col">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2"><Database size={18} className="text-blue-600" /> 批量导入在库资源</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-6">
                    <div className="space-y-2">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest">导入到目标目录</label>
                        <select value={targetFolderId} onChange={e => setTargetFolderId(e.target.value)} className="w-full h-11 px-4 border border-slate-200 rounded-xl font-bold text-slate-800 bg-slate-50">
                            {folders.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                        </select>
                    </div>
                    <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                        <table className="w-full text-left text-xs border-collapse">
                            <thead className="bg-slate-100 text-slate-500 font-black border-b border-slate-200">
                                <tr>
                                    <th className="p-3 w-12 text-center"><input type="checkbox" onChange={e => setSelectedIds(e.target.checked ? new Set(ALL_PRODS.map(p => p.id)) : new Set())} /></th>
                                    <th className="p-3">资源名称</th>
                                    <th className="p-3">分类</th>
                                    <th className="p-3">业务主题</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {ALL_PRODS.map(p => (
                                    <tr key={p.id} className={`hover:bg-blue-50/30 transition-colors cursor-pointer ${selectedIds.has(p.id) ? 'bg-blue-50/50' : ''}`} onClick={() => {
                                        const next = new Set(selectedIds);
                                        if (next.has(p.id)) next.delete(p.id); else next.add(p.id);
                                        setSelectedIds(next);
                                    }}>
                                        <td className="p-3 text-center"><input type="checkbox" checked={selectedIds.has(p.id)} readOnly /></td>
                                        <td className="p-3 font-bold text-slate-700">{p.name}</td>
                                        <td className="p-3 uppercase text-slate-400 font-black text-[9px]">{p.category}</td>
                                        <td className="p-3 text-slate-500">{p.theme}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
                <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-400">已选中 <span className="text-blue-600 font-black">{selectedIds.size}</span> 个资源</span>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-black transition-all">取消</button>
                        <button onClick={() => onConfirm(ALL_PRODS.filter(p => selectedIds.has(p.id)), targetFolderId)} className="px-10 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black shadow-lg shadow-blue-100 transition-all">确认导入</button>
                    </div>
                </div>
            </div>
        </div>
    );
};

const AddServiceModal: React.FC<{ onClose: () => void; onConfirm: (data: any) => void; folders: any[] }> = ({ onClose, onConfirm, folders }) => {
    const [name, setName] = useState('');
    const [type, setType] = useState('WMTS');
    const [url, setUrl] = useState('');
    const [parentId, setParentId] = useState(folders[0]?.id || '');

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-[600px] border border-slate-200 overflow-hidden animate-zoomIn">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2"><Globe size={18} className="text-blue-600" /> 注册外部空间服务</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
                </div>
                <div className="p-8 space-y-6">
                    <div className="grid grid-cols-2 gap-5">
                        <div className="col-span-2 space-y-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">服务名称</label>
                            <input value={name} onChange={e => setName(e.target.value)} type="text" className="w-full h-11 px-4 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all font-bold text-slate-800" placeholder="请输入外部服务名称" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">服务类型</label>
                            <select value={type} onChange={e => setType(e.target.value)} className="w-full h-11 px-4 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all font-bold text-slate-800 bg-white appearance-none">
                                <option value="WMTS">WMTS (Tile Service)</option>
                                <option value="WMS">WMS (Map Service)</option>
                                <option value="WFS">WFS (Feature Service)</option>
                                <option value="XYZ">XYZ / TileLayer</option>
                                <option value="业务表">业务表数据</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">导入到目录</label>
                            <select value={parentId} onChange={e => setParentId(e.target.value)} className="w-full h-11 px-4 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all font-bold text-slate-800 bg-white appearance-none">
                                {folders.map(f => <option key={f.id} value={f.id}>{f.label}</option>)}
                            </select>
                        </div>
                        <div className="col-span-2 space-y-2">
                            <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">服务地址 (URL)</label>
                            <input value={url} onChange={e => setUrl(e.target.value)} type="text" className="w-full h-11 px-4 border border-slate-200 rounded-xl outline-none focus:border-blue-500 transition-all font-mono text-xs text-blue-600" placeholder="https://..." />
                        </div>
                    </div>
                </div>
                <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button onClick={onClose} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-black transition-all">取消</button>
                    <button onClick={() => onConfirm({ name, type, url, parentId })} className="px-10 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">确认注册</button>
                </div>
            </div>
        </div>
    );
};

const LegendEditorModal: React.FC<{ 
    entry: LegendEntry; 
    onClose: () => void; 
    onSave: (payload: { label: string; style: Partial<LegendStyle> }) => void;
    onRemove: () => void;
}> = ({ entry, onClose, onSave, onRemove }) => {
    const [label, setLabel] = useState(entry.label);
    const [color, setColor] = useState(entry.style.color);
    const [opacity, setOpacity] = useState(entry.style.opacity || 1);
    const [strokeColor, setStrokeColor] = useState(entry.style.strokeColor || '#B3B3B3');
    const [strokeWidth, setStrokeWidth] = useState(entry.style.strokeWidth || 2);

    const normalizeHex = (value: string) => {
        const clean = value.replace('#', '').replace(/[^0-9a-fA-F]/g, '').slice(0, 6).toUpperCase();
        return clean;
    };

    const clampPercentToOpacity = (value: number) => {
        const fixed = Math.max(0, Math.min(100, value));
        return fixed / 100;
    };

    const percentFromOpacity = (value: number) => Math.round(Math.max(0, Math.min(1, value)) * 100);

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-2xl shadow-2xl w-[400px] border border-slate-200 overflow-hidden animate-zoomIn">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2"><Palette size={18} className="text-blue-600" /> 编辑符号样式</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
                </div>
                <div className="p-8 space-y-6">
                    <div className="space-y-3">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">图例名称</label>
                        <input 
                            type="text" 
                            value={label} 
                            onChange={e => setLabel(e.target.value)} 
                            className="w-full h-10 px-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50"
                            placeholder="请输入图例名称"
                        />
                    </div>
                    <div className="space-y-4">
                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">填充颜色</label>
                        <div className="grid grid-cols-[28px_1fr_116px] items-center gap-2">
                            <input
                                type="color"
                                value={color}
                                onChange={e => setColor(e.target.value)}
                                className="w-7 h-7 rounded border border-slate-200 cursor-pointer bg-transparent"
                            />
                            <input
                                type="text"
                                value={normalizeHex(color)}
                                onChange={e => setColor(`#${normalizeHex(e.target.value)}`)}
                                className="h-9 px-3 bg-slate-100 border border-slate-200 rounded-md font-mono text-sm uppercase font-bold text-slate-700 outline-none focus:border-blue-500"
                            />
                            <div className="h-9 px-2 bg-slate-100 border border-slate-200 rounded-md flex items-center justify-between">
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={percentFromOpacity(opacity)}
                                    onChange={e => setOpacity(clampPercentToOpacity(Number(e.target.value)))}
                                    className="w-14 text-right bg-transparent outline-none text-sm font-bold text-slate-700 [appearance:textfield]"
                                />
                                <span className="text-slate-500 text-sm font-bold">%</span>
                            </div>
                        </div>

                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">描边颜色</label>
                        <div className="grid grid-cols-[28px_1fr_116px] items-center gap-2">
                            <input
                                type="color"
                                value={strokeColor}
                                onChange={e => setStrokeColor(e.target.value)}
                                className="w-7 h-7 rounded border border-slate-200 cursor-pointer bg-transparent"
                            />
                            <input
                                type="text"
                                value={normalizeHex(strokeColor)}
                                onChange={e => setStrokeColor(`#${normalizeHex(e.target.value)}`)}
                                className="h-9 px-3 bg-slate-100 border border-slate-200 rounded-md font-mono text-sm uppercase font-bold text-slate-700 outline-none focus:border-blue-500"
                            />
                            <div className="h-9 px-2 bg-slate-100 border border-slate-200 rounded-md flex items-center justify-between">
                                <input
                                    type="number"
                                    min={0}
                                    max={100}
                                    value={percentFromOpacity(opacity)}
                                    onChange={e => setOpacity(clampPercentToOpacity(Number(e.target.value)))}
                                    className="w-14 text-right bg-transparent outline-none text-sm font-bold text-slate-700 [appearance:textfield]"
                                />
                                <span className="text-slate-500 text-sm font-bold">%</span>
                            </div>
                        </div>

                        <label className="text-[11px] font-black text-slate-500 uppercase tracking-widest px-1">描边宽度</label>
                        <div className="grid grid-cols-[28px_1fr_116px] items-center gap-2">
                            <div />
                            <div />
                            <div className="h-9 px-2 bg-slate-100 border border-slate-200 rounded-md flex items-center justify-between">
                                <input
                                    type="number"
                                    min={0}
                                    max={20}
                                    step={1}
                                    value={strokeWidth}
                                    onChange={e => setStrokeWidth(Math.max(0, Math.min(20, Number(e.target.value) || 0)))}
                                    className="w-14 text-right bg-transparent outline-none text-sm font-bold text-slate-700 [appearance:textfield]"
                                />
                                <span className="text-slate-500 text-sm font-bold">PX</span>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex justify-between gap-3">
                    <button onClick={onRemove} className="px-4 py-2.5 bg-rose-50 text-rose-600 border border-rose-100 rounded-xl text-sm font-black transition-all">删除分类</button>
                    <div className="flex gap-3">
                        <button onClick={onClose} className="px-4 py-2.5 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-black transition-all">取消</button>
                        <button 
                            onClick={() => onSave({
                                label: label.trim() || entry.label,
                                style: {
                                    color,
                                    opacity,
                                    strokeColor,
                                    strokeWidth
                                }
                            })} 
                            className="px-8 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all"
                        >
                            保存
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

// ─── colour schemes for graduated vector styling ───────────────────────────
const VECTOR_COLOR_SCHEMES: string[][] = [
    ['#f7fbff','#c6dbef','#6baed6','#2171b5','#08306b'],  // blues
    ['#f7fcf5','#c7e9c0','#74c476','#238b45','#00441b'],  // greens
    ['#fff5eb','#fdd0a2','#fd8d3c','#d94701','#7f2704'],  // oranges
    ['#fff7f3','#fcc5c0','#f768a1','#ae017e','#49006a'],  // pinks
    ['#fcfbfd','#dadaeb','#9e9ac8','#6a51a3','#3f007d'],  // purples
    ['#f7fcfd','#b2e2e2','#66c2a4','#2ca25f','#006d2c'],  // teal-greens
    ['#fff7ec','#fdbb84','#e34a33','#b30000','#7f0000'],  // reds
    ['#ffffd9','#c7e9b4','#41b6c4','#225ea8','#081d58'],  // yellow-blue
];

function generateGrades(field: string, classifyMethod: string, classCount: number, schemeIdx: number): GradeBreak[] {
    const fieldRanges: Record<string, [number, number]> = {
        pop_density: [0, 1200],
        district_name: [0, 100],
        landuse_type: [0, 800],
    };
    const [lo, hi] = fieldRanges[field] ?? [0, 1000];
    const step = (hi - lo) / classCount;
    const mockCounts = [12, 28, 35, 18, 7, 4, 9, 15, 22];
    const colors = VECTOR_COLOR_SCHEMES[schemeIdx % VECTOR_COLOR_SCHEMES.length];
    return Array.from({ length: classCount }, (_, i) => {
        const min = Math.round(lo + step * i);
        const max = i === classCount - 1 ? hi : Math.round(lo + step * (i + 1));
        const color = colors[Math.round((i / (classCount - 1)) * (colors.length - 1))];
        return {
            id: `grade-${i}`,
            min,
            max,
            label: i === classCount - 1 ? `> ${min}` : `${min} – ${max}`,
            color,
            count: mockCounts[i % mockCounts.length],
        };
    });
}

const StyleSettingsModal: React.FC<{
    visibleLayers: { id: string; label: string }[];
    selectedLayerId: string;
    onLayerChange: (id: string) => void;
    layerType: 'raster' | 'vector';
    bandMeta: RasterBandMeta[];
    initialSettings?: LayerStyleSettings;
    onApply: (settings: LayerStyleSettings) => void;
    onClose: () => void;
}> = ({ visibleLayers, selectedLayerId, onLayerChange, layerType, bandMeta, initialSettings, onApply, onClose }) => {
    // raster state
    const [rasterRenderType, setRasterRenderType] = useState<'single' | 'rgb'>(initialSettings?.raster?.renderType || 'rgb');
    const [colorBandMode, setColorBandMode] = useState<'Linear' | 'Equal Interval'>(initialSettings?.raster?.colorBandMode || 'Linear');
    const [opacity, setOpacity] = useState(initialSettings?.raster?.opacity || 80);
    const defaultBand = bandMeta[0]?.index || 1;
    const [rBand, setRBand] = useState(initialSettings?.raster?.rBand || defaultBand);
    const [gBand, setGBand] = useState(initialSettings?.raster?.gBand || bandMeta[1]?.index || defaultBand);
    const [bBand, setBBand] = useState(initialSettings?.raster?.bBand || bandMeta[2]?.index || defaultBand);

    // vector – style mode
    const [vecStyleMode, setVecStyleMode] = useState<'单一色' | '分层设色'>(initialSettings?.vector?.styleMode || '单一色');
    // 单一色
    const [singleFill, setSingleFill] = useState(initialSettings?.vector?.singleFillColor || '#4A90E2');
    const [singleFillHex, setSingleFillHex] = useState(initialSettings?.vector?.singleFillColor || '#4A90E2');
    const [singleFillOpacity, setSingleFillOpacity] = useState(100);
    const [singleStroke, setSingleStroke] = useState(initialSettings?.vector?.singleStrokeColor || '#2563EB');
    const [singleStrokeHex, setSingleStrokeHex] = useState(initialSettings?.vector?.singleStrokeColor || '#2563EB');
    const [singleStrokeOpacity, setSingleStrokeOpacity] = useState(100);
    const [singleStrokeWidth, setSingleStrokeWidth] = useState(initialSettings?.vector?.singleStrokeWidth ?? 1);
    // 分层设色
    const [vecField, setVecField] = useState(initialSettings?.vector?.field || 'pop_density');
    const [classifyMethod, setClassifyMethod] = useState<'自然间断点' | '等间距' | '分位数' | '标准差'>(initialSettings?.vector?.classifyMethod || '自然间断点');
    const [classCount, setClassCount] = useState(initialSettings?.vector?.classCount || 5);
    const [schemeIdx, setSchemeIdx] = useState(initialSettings?.vector?.colorSchemeIndex ?? 0);
    const [grades, setGrades] = useState<GradeBreak[]>(() =>
        initialSettings?.vector?.grades ?? generateGrades(initialSettings?.vector?.field || 'pop_density', initialSettings?.vector?.classifyMethod || '自然间断点', initialSettings?.vector?.classCount || 5, initialSettings?.vector?.colorSchemeIndex ?? 0)
    );

    const fieldOptions = [
        { value: 'pop_density', label: '人口密度' },
        { value: 'landuse_type', label: '用地类型' },
        { value: 'district_name', label: '行政区名称' },
    ];

    useEffect(() => {
        setRasterRenderType(initialSettings?.raster?.renderType || 'rgb');
        setColorBandMode(initialSettings?.raster?.colorBandMode || 'Linear');
        setOpacity(initialSettings?.raster?.opacity || 80);
        setRBand(initialSettings?.raster?.rBand || defaultBand);
        setGBand(initialSettings?.raster?.gBand || bandMeta[1]?.index || defaultBand);
        setBBand(initialSettings?.raster?.bBand || bandMeta[2]?.index || defaultBand);
        setVecStyleMode(initialSettings?.vector?.styleMode || '单一色');
        setSingleFill(initialSettings?.vector?.singleFillColor || '#4A90E2');
        setSingleFillHex(initialSettings?.vector?.singleFillColor || '#4A90E2');
        setSingleStroke(initialSettings?.vector?.singleStrokeColor || '#2563EB');
        setSingleStrokeHex(initialSettings?.vector?.singleStrokeColor || '#2563EB');
        setSingleStrokeWidth(initialSettings?.vector?.singleStrokeWidth ?? 1);
        setVecField(initialSettings?.vector?.field || 'pop_density');
        setClassifyMethod(initialSettings?.vector?.classifyMethod || '自然间断点');
        setClassCount(initialSettings?.vector?.classCount || 5);
        setSchemeIdx(initialSettings?.vector?.colorSchemeIndex ?? 0);
        setGrades(initialSettings?.vector?.grades ?? generateGrades(initialSettings?.vector?.field || 'pop_density', initialSettings?.vector?.classifyMethod || '自然间断点', initialSettings?.vector?.classCount || 5, initialSettings?.vector?.colorSchemeIndex ?? 0));
    }, [initialSettings, selectedLayerId, defaultBand, bandMeta]);

    // regenerate grades when params change
    useEffect(() => {
        setGrades(generateGrades(vecField, classifyMethod, classCount, schemeIdx));
    }, [vecField, classifyMethod, classCount, schemeIdx]);

    const normalizeVecHex = (val: string) => {
        const clean = val.replace(/[^0-9a-fA-F]/g, '').slice(0, 6);
        return clean.length === 6 ? `#${clean}` : null;
    };

    const handleApply = () => {
        if (layerType === 'raster') {
            onApply({ layerType: 'raster', raster: { renderType: rasterRenderType, colorBandMode, rBand, gBand, bBand, opacity } });
        } else {
            onApply({
                layerType: 'vector',
                vector: vecStyleMode === '单一色'
                    ? { styleMode: '单一色', singleFillColor: singleFill, singleStrokeColor: singleStroke, singleStrokeWidth }
                    : { styleMode: '分层设色', field: vecField, classifyMethod, classCount, colorSchemeIndex: schemeIdx, grades }
            });
        }
        onClose();
    };

    return (
        <div className="fixed inset-0 z-[320] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm animate-fadeIn p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[620px] border border-slate-200 overflow-hidden animate-zoomIn text-slate-700 flex flex-col" style={{ maxHeight: 'calc(100vh - 32px)' }}>
                {/* Header */}
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-slate-50/80">
                    <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                        <Settings2 size={16} className="text-blue-600" />
                        样式设置
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={18} /></button>
                </div>

                <div className="p-5 space-y-5 overflow-y-auto custom-scrollbar flex-1 min-h-0">
                    {/* Layer label */}
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">图层</label>
                        <div className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm font-semibold text-slate-500 bg-slate-50 flex items-center cursor-not-allowed">
                            {visibleLayers.find(l => l.id === selectedLayerId)?.label || '未绑定图层'}
                        </div>
                    </div>

                    {/* ═══ RASTER ═══ */}
                    {layerType === 'raster' ? (
                        <div className="space-y-4">
                            <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-slate-100 pb-2">栅格渲染</div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">渲染类型</label>
                                    <select value={rasterRenderType} onChange={e => setRasterRenderType(e.target.value as 'single' | 'rgb')} className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20">
                                        <option value="single">单波段灰度</option>
                                        <option value="rgb">三波段合成</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">色带类型</label>
                                    <select value={colorBandMode} onChange={e => setColorBandMode(e.target.value as 'Linear' | 'Equal Interval')} className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20">
                                        <option value="Linear">Linear</option>
                                        <option value="Equal Interval">Equal Interval</option>
                                    </select>
                                </div>
                            </div>
                            {rasterRenderType === 'rgb' && (
                                <div className="grid grid-cols-3 gap-3">
                                    {[['R 波段', rBand, setRBand], ['G 波段', gBand, setGBand], ['B 波段', bBand, setBBand]].map(([label, val, setter]) => (
                                        <div key={label as string} className="space-y-1.5">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label as string}</label>
                                            <select value={val as number} onChange={e => (setter as any)(Number(e.target.value))} className="w-full h-9 px-2 border border-slate-200 rounded-lg text-xs text-slate-700 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20">
                                                {bandMeta.map(b => <option key={b.index} value={b.index}>{`${b.name} (${b.min}-${b.max})`}</option>)}
                                            </select>
                                        </div>
                                    ))}
                                </div>
                            )}
                            <div className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">透明度</label>
                                    <span className="text-xs font-bold text-blue-600">{opacity}%</span>
                                </div>
                                <input type="range" min="0" max="100" value={opacity} onChange={e => setOpacity(Number(e.target.value))} className="w-full accent-blue-600" />
                            </div>
                        </div>
                    ) : (
                    /* ═══ VECTOR ═══ */
                    <div className="space-y-4">
                        <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest border-b border-slate-100 pb-2">矢量渲染</div>

                        {/* Style mode toggle */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">样式模式</label>
                            <div className="flex rounded-lg overflow-hidden border border-slate-200">
                                {(['单一色', '分层设色'] as const).map(mode => (
                                    <button
                                        key={mode}
                                        onClick={() => setVecStyleMode(mode)}
                                        className={`flex-1 py-2 text-xs font-bold transition-all ${vecStyleMode === mode ? 'bg-blue-600 text-white' : 'bg-white text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
                                    >{mode}</button>
                                ))}
                            </div>
                        </div>

                        {/* ── 单一色 ── */}
                        {vecStyleMode === '单一色' && (
                            <div className="space-y-3">
                                {/* Fill color */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">填充颜色</label>
                                    <div className="flex items-center gap-2 h-9">
                                        <div className="relative flex-shrink-0">
                                            <div className="w-9 h-9 rounded-lg border-2 border-slate-200 overflow-hidden cursor-pointer shadow-sm" style={{ background: singleFill }}>
                                                <input type="color" value={singleFill} onChange={e => { setSingleFill(e.target.value); setSingleFillHex(e.target.value.replace('#', '')); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                            </div>
                                        </div>
                                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white flex-1 h-9">
                                            <span className="text-slate-400 text-xs pl-2.5 pr-1 select-none">#</span>
                                            <input
                                                type="text" maxLength={6}
                                                value={singleFillHex.replace('#', '')}
                                                onChange={e => {
                                                    setSingleFillHex(e.target.value);
                                                    const n = normalizeVecHex(e.target.value);
                                                    if (n) setSingleFill(n);
                                                }}
                                                className="flex-1 bg-transparent text-xs text-slate-700 font-mono outline-none py-2 w-0"
                                            />
                                        </div>
                                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white w-20 h-9">
                                            <input
                                                type="number" min={0} max={100} value={singleFillOpacity}
                                                onChange={e => setSingleFillOpacity(Math.min(100, Math.max(0, Number(e.target.value))))}
                                                className="flex-1 bg-transparent text-xs text-slate-700 font-mono outline-none py-2 pl-2.5 w-0"
                                            />
                                            <span className="text-slate-400 text-xs pr-2 select-none">%</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Stroke color */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">描边颜色</label>
                                    <div className="flex items-center gap-2 h-9">
                                        <div className="relative flex-shrink-0">
                                            <div className="w-9 h-9 rounded-lg border-2 border-slate-200 overflow-hidden cursor-pointer shadow-sm" style={{ background: singleStroke }}>
                                                <input type="color" value={singleStroke} onChange={e => { setSingleStroke(e.target.value); setSingleStrokeHex(e.target.value.replace('#', '')); }} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                                            </div>
                                        </div>
                                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white flex-1 h-9">
                                            <span className="text-slate-400 text-xs pl-2.5 pr-1 select-none">#</span>
                                            <input
                                                type="text" maxLength={6}
                                                value={singleStrokeHex.replace('#', '')}
                                                onChange={e => {
                                                    setSingleStrokeHex(e.target.value);
                                                    const n = normalizeVecHex(e.target.value);
                                                    if (n) setSingleStroke(n);
                                                }}
                                                className="flex-1 bg-transparent text-xs text-slate-700 font-mono outline-none py-2 w-0"
                                            />
                                        </div>
                                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white w-20 h-9">
                                            <input
                                                type="number" min={0} max={100} value={singleStrokeOpacity}
                                                onChange={e => setSingleStrokeOpacity(Math.min(100, Math.max(0, Number(e.target.value))))}
                                                className="flex-1 bg-transparent text-xs text-slate-700 font-mono outline-none py-2 pl-2.5 w-0"
                                            />
                                            <span className="text-slate-400 text-xs pr-2 select-none">%</span>
                                        </div>
                                    </div>
                                </div>
                                {/* Stroke width */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">描边宽度</label>
                                    <div className="flex items-center gap-2 h-9">
                                        <div className="flex items-center border border-slate-200 rounded-lg overflow-hidden bg-white w-24 h-9">
                                            <input
                                                type="number" min={0} max={20} step={0.5} value={singleStrokeWidth}
                                                onChange={e => setSingleStrokeWidth(Math.max(0, Number(e.target.value)))}
                                                className="flex-1 bg-transparent text-xs text-slate-700 font-mono outline-none py-2 pl-2.5 w-0"
                                            />
                                            <span className="text-slate-400 text-xs pr-2 select-none">PX</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ── 分层设色 ── */}
                        {vecStyleMode === '分层设色' && (
                            <div className="space-y-4">
                                {/* Field + classify */}
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">分层字段</label>
                                    <select value={vecField} onChange={e => setVecField(e.target.value)} className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20">
                                        {fieldOptions.map(f => <option key={f.value} value={f.value}>{f.label}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">分类方法</label>
                                    <select value={classifyMethod} onChange={e => setClassifyMethod(e.target.value as any)} className="w-full h-9 px-3 border border-slate-200 rounded-lg text-sm text-slate-700 bg-white outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/20">
                                        <option value="自然间断点">自然间断点</option>
                                        <option value="等间距">等间距</option>
                                        <option value="分位数">分位数</option>
                                        <option value="标准差">标准差</option>
                                    </select>
                                </div>
                                <div className="space-y-1.5">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">分级数量</label>
                                        <span className="text-xs font-bold text-blue-600">{classCount} 级</span>
                                    </div>
                                    <input type="range" min={2} max={9} value={classCount} onChange={e => setClassCount(Number(e.target.value))} className="w-full accent-blue-600" />
                                </div>

                                {/* Color scheme picker */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">色彩方案</label>
                                    <div className="grid grid-cols-4 gap-2">
                                        {VECTOR_COLOR_SCHEMES.map((scheme, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSchemeIdx(idx)}
                                                className={`h-7 rounded-md overflow-hidden border-2 transition-all ${schemeIdx === idx ? 'border-blue-500 scale-105 shadow-md' : 'border-slate-200 hover:border-slate-400'}`}
                                                style={{ background: `linear-gradient(to right, ${scheme.join(', ')})` }}
                                            />
                                        ))}
                                    </div>
                                </div>

                                {/* Grade preview */}
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">分级预览</label>
                                        <button
                                            onClick={() => {
                                                const newGrade: GradeBreak = {
                                                    id: `grade-custom-${Date.now()}`,
                                                    min: 0, max: 0, label: '自定义', color: '#888888', count: 0
                                                };
                                                setGrades(prev => [...prev, newGrade]);
                                            }}
                                            className="flex items-center gap-1 text-[10px] font-bold text-blue-600 hover:text-blue-700 border border-blue-200 rounded-md px-2 py-0.5 hover:border-blue-400 bg-blue-50 hover:bg-blue-100 transition-all"
                                        >
                                            <Plus size={10} /> 添加分级
                                        </button>
                                    </div>
                                    <div className="rounded-lg overflow-hidden border border-slate-200">
                                        {grades.map((g, idx) => (
                                            <div key={g.id} className={`flex items-center gap-3 px-3 py-2.5 ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'} group border-b border-slate-100 last:border-b-0`}>
                                                <div
                                                    className="w-6 h-6 rounded flex-shrink-0 cursor-pointer border border-slate-200 relative shadow-sm"
                                                    style={{ background: g.color }}
                                                    title="点击修改颜色"
                                                >
                                                    <input
                                                        type="color" value={g.color}
                                                        onChange={e => setGrades(prev => prev.map((gr, i) => i === idx ? { ...gr, color: e.target.value } : gr))}
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                    />
                                                </div>
                                                <input
                                                    type="text" value={g.label}
                                                    onChange={e => setGrades(prev => prev.map((gr, i) => i === idx ? { ...gr, label: e.target.value } : gr))}
                                                    className="flex-1 bg-transparent text-xs text-slate-600 outline-none border-b border-transparent focus:border-slate-300 py-0.5"
                                                />
                                                <span className="text-[10px] text-slate-400 ml-auto flex-shrink-0 tabular-nums">{g.count} 个要素</span>
                                                <button
                                                    onClick={() => setGrades(prev => prev.filter((_, i) => i !== idx))}
                                                    className="opacity-0 group-hover:opacity-100 text-slate-300 hover:text-red-500 transition-all flex-shrink-0"
                                                ><X size={12} /></button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                    )}
                </div>

                {/* ── Live Preview ── */}
                <div className="px-5 py-4 border-t border-slate-100 bg-slate-50/60 flex-shrink-0">
                    <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">样式预览</div>
                    {layerType === 'raster' ? (
                        <div className="space-y-2">
                            <div
                                className="h-8 rounded-lg w-full shadow-inner"
                                style={{ background: `linear-gradient(to right, #0d0887, #6a00a8, #b12a90, #e16462, #fca636, #f0f921)` }}
                            />
                            <div className="flex justify-between text-[10px] text-slate-400">
                                <span>Min</span>
                                <span className="text-slate-500 font-semibold">
                                    {rasterRenderType === 'rgb' ? `RGB · Band ${rBand}/${gBand}/${bBand}` : `单波段灰度 · Band ${rBand}`}
                                    &nbsp;·&nbsp;{colorBandMode}&nbsp;·&nbsp;透明度 {opacity}%
                                </span>
                                <span>Max</span>
                            </div>
                        </div>
                    ) : vecStyleMode === '单一色' ? (
                        <div className="flex items-center gap-5">
                            <svg width="100" height="60" viewBox="0 0 100 60" className="rounded-lg overflow-hidden flex-shrink-0 border border-slate-200" style={{ background: '#f1f5f9' }}>
                                <rect
                                    x="10" y="8" width="80" height="44" rx="4"
                                    fill={singleFill}
                                    fillOpacity={singleFillOpacity / 100}
                                    stroke={singleStroke}
                                    strokeOpacity={singleStrokeOpacity / 100}
                                    strokeWidth={Math.min(singleStrokeWidth, 6)}
                                />
                            </svg>
                            <div className="space-y-1.5 text-[11px] text-slate-500">
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-sm flex-shrink-0 border border-slate-200" style={{ background: singleFill, opacity: singleFillOpacity / 100 }} />
                                    填充&nbsp;<span className="text-slate-700 font-mono">{singleFillHex.startsWith('#') ? singleFillHex : `#${singleFillHex}`}</span>
                                    <span className="text-slate-400">{singleFillOpacity}%</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 rounded-sm flex-shrink-0 border-2" style={{ borderColor: singleStroke, opacity: singleStrokeOpacity / 100, background: 'transparent' }} />
                                    描边&nbsp;<span className="text-slate-700 font-mono">{singleStrokeHex.startsWith('#') ? singleStrokeHex : `#${singleStrokeHex}`}</span>
                                    <span className="text-slate-400">{singleStrokeOpacity}%</span>
                                    <span className="text-slate-400">{singleStrokeWidth}px</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            <div
                                className="h-6 rounded-lg w-full shadow-inner"
                                style={{ background: grades.length > 0 ? `linear-gradient(to right, ${grades.map(g => g.color).join(', ')})` : '#e2e8f0' }}
                            />
                            <div className="flex items-end gap-0.5 h-10">
                                {grades.map((g, i) => {
                                    const maxCount = Math.max(...grades.map(gr => gr.count), 1);
                                    return (
                                        <div key={g.id} className="flex-1 flex flex-col items-center justify-end gap-0.5 group relative">
                                            <div
                                                className="w-full rounded-t-sm transition-all"
                                                style={{ height: `${Math.round((g.count / maxCount) * 32)}px`, background: g.color, opacity: 0.85 }}
                                            />
                                            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-700 text-[9px] text-white rounded px-1 py-0.5 opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none z-10">
                                                {g.label}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="flex justify-between text-[10px] text-slate-400">
                                <span>{grades[0]?.label ?? ''}</span>
                                <span className="text-slate-500 font-semibold">{vecField === 'pop_density' ? '人口密度' : vecField === 'landuse_type' ? '用地类型' : '行政区名称'} · {classifyMethod} · {classCount} 级</span>
                                <span>{grades[grades.length - 1]?.label ?? ''}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end gap-3 flex-shrink-0">
                    <button onClick={onClose} className="px-5 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-xs font-black transition-all hover:bg-slate-50">关闭</button>
                    <button onClick={handleApply} className="px-7 py-2 bg-blue-600 text-white rounded-xl text-xs font-black shadow-lg shadow-blue-100 hover:bg-blue-700 transition-all">应用</button>
                </div>
            </div>
        </div>
    );
};

const FeatureAttributesPopup = ({ data, onClose }: { data: any, onClose: () => void }) => {
    return (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl z-[100] overflow-hidden animate-zoomIn pointer-events-auto">
            <div className="bg-blue-600/5 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 bg-blue-600 rounded-lg text-white">
                        <Info size={14} />
                    </div>
                    <div>
                        <div className="text-[13px] font-black text-slate-800 tracking-tight">{data.name}</div>
                        <div className="text-[9px] font-black text-blue-600/60 uppercase tracking-widest">Feature Attributes</div>
                    </div>
                </div>
                <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                    <X size={16} />
                </button>
            </div>
            <div className="p-4 space-y-3">
                <AttributeRow label="图层" value={data.layer} />
                <AttributeRow label="名称" value={data.name} />
                <AttributeRow label="类型" value={data.type} isCode />
                <AttributeRow label="面积" value={data.area} />
                <AttributeRow label="分类" value={data.category} />
                <AttributeRow label="更新时间" value={data.updateTime} />
            </div>
        </div>
    );
};

const MetadataModal: React.FC<{
    title: string;
    items: { label: string; labelEn?: string; value: React.ReactNode }[];
    onClose: () => void;
}> = ({ title, items, onClose }) => {
    return (
        <div className="fixed inset-0 z-[350] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fadeIn p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-[600px] border border-slate-200 overflow-hidden animate-zoomIn">
                <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                    <h3 className="text-base font-black text-slate-800 flex items-center gap-2">
                        <Info size={18} className="text-blue-600" /> {title}
                    </h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={22} /></button>
                </div>
                <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                    {/* table header */}
                    <div className="grid grid-cols-[120px_140px_1fr] gap-0 px-6 py-2 bg-slate-50 border-b border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">中文字段</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">英文字段</span>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">字段值</span>
                    </div>
                    {/* rows */}
                    {items.map((it, idx) => (
                        <div
                            key={idx}
                            className={`grid grid-cols-[120px_140px_1fr] gap-0 px-6 py-3 border-b border-slate-50 last:border-b-0 items-start ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}`}
                        >
                            <div className="text-[13px] font-bold text-slate-700 pr-3">{it.label}</div>
                            <div className="text-[12px] font-mono text-slate-400 pr-3">{it.labelEn ?? '—'}</div>
                            <div className="text-[13px] font-semibold text-slate-800 break-words">{it.value}</div>
                        </div>
                    ))}
                </div>
                <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end">
                    <button onClick={onClose} className="px-6 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-black hover:bg-slate-50 transition-all">关闭</button>
                </div>
            </div>
        </div>
    );
};

const AttributeRow = ({ label, value, isCode }: { label: string, value: string, isCode?: boolean }) => (
    <div className="flex items-center justify-between gap-4">
        <span className="text-[11px] font-black text-slate-400 uppercase tracking-wider shrink-0">{label}</span>
        <span className={`text-[11px] font-bold text-slate-700 truncate ${isCode ? 'font-mono bg-slate-100 px-1.5 py-0.5 rounded text-[10px]' : ''}`}>{value}</span>
    </div>
);
