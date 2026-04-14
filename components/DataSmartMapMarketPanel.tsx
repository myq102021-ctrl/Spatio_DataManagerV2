import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Search, 
  Globe, 
  ChevronDown,
  Map as MapIcon,
  Database,
  ChevronRight,
  ShieldCheck,
  ChevronLeft,
  Share2,
  Folder,
  FolderOpen,
  Hash,
  Layers,
  Heart,
  X,
  Ruler,
  PenTool,
  Grid,
  Maximize,
  Minimize,
  Eye,
  EyeOff,
  Trash2,
  MousePointer2,
  Plus,
  Minus,
  CheckCircle2,
  ListFilter,
  Monitor,
  Columns,
  Split,
  Info,
  PanelRightOpen,
  PanelRightClose,
  PanelLeftOpen,
  PanelLeftClose,
  BarChart2,
  Printer,
  LayoutGrid
} from 'lucide-react';
import { ScenePreview } from '../modules/preview/ScenePreview';
import { MarketNode } from '../types';
import { GoogleMapLayer, TableView, SummaryIndicator, BarChartIndicator } from './DataSmartMapPanel';
import { MiniBaseMapSwitcher } from './MiniBaseMapSwitcher';
import { TimePlayerProvider } from '../modules/timePlayer/TimePlayerContext';
import { TimePlayer } from '../modules/timePlayer/TimePlayer';
import { 
    ResponsiveContainer, 
    BarChart, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Bar
} from 'recharts';

interface ImageryTile {
  id: string;
  code: string;
  description: string;
  thumbnail: string;
  tags: string[];
  status: 'available' | 'applying' | 'applied';
  isFavorite: boolean;
  selected: boolean;
  author?: string;
  views?: number;
  date?: string;
}

// 定义目录 tree 节点接口
// MarketNode 已从 types.ts 导入

const MOCK_IMAGERY: ImageryTile[] = [
  { 
    id: '1', 
    code: '大冶市耕地提取数据', 
    description: '基于 2024 年度高分辨率遥感影像，利用深度学习语义分割模型，精准提取大冶市全域范围内的耕地空间分布图层。本数据集包含了高精度的矢量边界，支持农业产量预估与流失监测，为土地利用规划提供科学依据。', 
    thumbnail: 'https://images.unsplash.com/photo-1526778548025-fa2f459cd5c1?auto=format&fit=crop&w=400&q=80', 
    tags: ['农业监测', '大冶市', '深度学习'], 
    status: 'available', 
    isFavorite: false, 
    selected: false,
    author: '系统管理员',
    views: 125,
    date: '2026-02-12'
  },
  { 
    id: '2', 
    code: '武汉市黑臭水体分布图', 
    description: '结合多源卫星遥感影像与地面水质监测点数据，动态反演武汉市重点河湖黑臭水体分级情况，支持治理效果评估。包含多时序对比图层，通过空间分析技术实现污染源精准定位。', 
    thumbnail: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=400&q=80', 
    tags: ['环境保护', '武汉市', '遥感反演'], 
    status: 'available', 
    isFavorite: false, 
    selected: false,
    author: '生态环境部',
    views: 89,
    date: '2026-02-10'
  },
  { 
    id: '3', 
    code: '北京市执法巡检成果', 
    description: '集成无人机航测与实景三三维技术，展示北京市城市管理执法过程中的违章建筑识别、土地变更巡检等可视化成果。数据支持多端浏览，为现场执法提供直观的高精度实景参考。', 
    thumbnail: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?auto=format&fit=crop&w=400&q=80', 
    tags: ['城市治理', '北京市', '无人机航测'], 
    status: 'applying', 
    isFavorite: true, 
    selected: false,
    author: '城市管理科',
    views: 243,
    date: '2026-01-28'
  },
  { 
    id: '4', 
    code: '中国干旱监测指数', 
    description: '利用 MODIS 卫星长序列数据生成的全国尺度植被干旱指数 (VHI)，反映年度全国农林牧业受灾风险与干旱等级。提供月度动态更新，支持历史回溯对比。', 
    thumbnail: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?auto=format&fit=crop&w=400&q=80', 
    tags: ['气象减灾', '全国', 'MODIS'], 
    status: 'available', 
    isFavorite: true, 
    selected: false,
    author: '国家气象台',
    views: 512,
    date: '2026-01-15'
  }
];

// MARKET_TREE 已移动到 App.tsx

const MARKET_TAGS = [
  { name: '三维实景', count: 45 },
  { name: '遥感监测', count: 32 },
  { name: '城市人口密度分析', count: 433 },
  { name: '土地利用分类', count: 227 },
  { name: '基础地理', count: 28 },
  { name: '历史文化遗产保护', count: 16 },
  { name: '交通枢纽', count: 21 },
  { name: '河湖水系整治', count: 216 },
  { name: '水系分布', count: 19 },
  { name: '生态保护红线', count: 1 },
  { name: '其他', count: 5 }
];

export const DataSmartMapMarketPanel: React.FC<{ marketTree: MarketNode[], setMarketTree: React.Dispatch<React.SetStateAction<MarketNode[]>> }> = ({ marketTree, setMarketTree }) => {
  const [activeCategoryId, setActiveCategoryId] = useState('all');
  const [layerVisibility, setLayerVisibility] = useState<Record<string, boolean>>({});
  const toggleLayerVisibility = (id: string) => {
    setLayerVisibility(prev => ({ ...prev, [id]: prev[id] !== true }));
  };
  const [activeTagName, setActiveTagName] = useState('全部');
  const [sceneSearchQuery, setSceneSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid' | 'earth'>('earth');

  const filteredImagery = useMemo(() => {
    const q = sceneSearchQuery.trim().toLowerCase();
    return MOCK_IMAGERY.filter(tile => {
      if (activeTagName !== '全部' && !tile.tags.includes(activeTagName)) return false;
      if (!q) return true;
      const haystack = `${tile.title} ${tile.description} ${(tile.tags || []).join(' ')}`.toLowerCase();
      return haystack.includes(q);
    });
  }, [activeTagName, sceneSearchQuery]);

  // Map state for earth view
  const [currentZoom, setCurrentZoom] = useState(5);
  const [currentCenter, setCurrentCenter] = useState({ lat: 30.5892, lon: 114.3021 });
  const [currentDimension, setCurrentDimension] = useState<'2D' | '3D'>('2D');
  const [showSplitMenu, setShowSplitMenu] = useState(false);
  const [splitMode, setSplitMode] = useState<'1' | '2' | '4' | '16'>('1');
  const [currentBaseMap, setCurrentBaseMap] = useState('hybrid');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLegendExpanded, setIsLegendExpanded] = useState(true);
  const [isTableViewOpen, setIsTableViewOpen] = useState(false);
  const [isTimePlayerDropped, setIsTimePlayerDropped] = useState(true);
  const [collapsedComponents, setCollapsedComponents] = useState<Set<string>>(new Set(['ind-1', 'chart-1']));
  const [isSidebarVisible, setIsSidebarVisible] = useState(true);

  const toggleCollapse = (id: string) => {
    setCollapsedComponents(prev => {
        const next = new Set(prev);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        return next;
    });
  };

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  const handleMapMouseDown = (e: React.MouseEvent) => {
    if (viewMode !== 'earth') return;
    setIsPanning(true);
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMapMouseMove = (e: React.MouseEvent) => {
    if (!isPanning || viewMode !== 'earth') return;
    
    const dx = e.clientX - lastMousePos.x;
    const dy = e.clientY - lastMousePos.y;
    
    const n = Math.pow(2, currentZoom);
    const res = 360 / (256 * n); // degrees per pixel
    
    setCurrentCenter(prev => ({
        lat: Math.max(-85, Math.min(85, prev.lat + dy * res)),
        lon: prev.lon - dx * res
    }));
    
    setLastMousePos({ x: e.clientX, y: e.clientY });
  };

  const handleMapMouseUp = () => {
    setIsPanning(false);
  };

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

  useEffect(() => {
    const handleFullscreenChange = () => {
        setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    const handleMapWheel = (e: WheelEvent) => {
        if (viewMode !== 'earth') return;
        e.preventDefault();
        if (e.deltaY < 0) {
            setCurrentZoom(z => Math.min(22, z + 1));
        } else {
            setCurrentZoom(z => Math.max(1, z - 1));
        }
    };

    const mapContainer = mapContainerRef.current;
    if (mapContainer && viewMode === 'earth') {
        mapContainer.addEventListener('wheel', handleMapWheel, { passive: false });
    }

    return () => {
        document.removeEventListener('fullscreenchange', handleFullscreenChange);
        if (mapContainer) {
            mapContainer.removeEventListener('wheel', handleMapWheel);
        }
    };
  }, [viewMode]);

  // Draggable logic for map controls
  const [dragState, setDragState] = useState<{
    id: string | null;
    startX: number;
    startY: number;
    initialX: number;
    initialY: number;
  }>({ id: null, startX: 0, startY: 0, initialX: 0, initialY: 0 });

  const [positions, setPositions] = useState<Record<string, { x: number, y: number }>>({
    center: { x: 0, y: 0 },
    right: { x: 0, y: 0 },
    legend: { x: 0, y: 0 },
    'ind-1': { x: 0, y: 0 },
    'chart-1': { x: 0, y: 0 }
  });

  const handleDragStart = (e: React.MouseEvent, id: string) => {
    setDragState({
      id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: positions[id].x,
      initialY: positions[id].y
    });
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!dragState.id) return;
      const dx = e.clientX - dragState.startX;
      const dy = e.clientY - dragState.startY;
      setPositions(prev => ({
        ...prev,
        [dragState.id!]: {
          x: dragState.initialX + dx,
          y: dragState.initialY + dy
        }
      }));
    };

    const handleMouseUp = () => {
      setDragState(prev => ({ ...prev, id: null }));
    };

    if (dragState.id) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [dragState]);

  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedScene, setSelectedScene] = useState<ImageryTile | null>(null);

  const handleOpenPreview = (tile: ImageryTile) => {
    setSelectedScene(tile);
    setIsPreviewOpen(true);
  };

  const getScenePreviewData = (tile: ImageryTile) => {
    return {
      title: tile.code,
      visibleLayerLabels: [tile.code, '基础底图要素', '行政边界'],
      drawnFeatures: [],
      isTimePlayerDropped: tile.tags.includes('遥感反演') || tile.tags.includes('MODIS'),
      zoom: 12,
      dimension: '2D' as const,
      splitMode: '1',
      legends: [
        {
          layerId: 'l1',
          layerName: tile.code,
          entries: [
            { id: 'e1', label: '默认符号', type: 'POLYGON', style: { color: '#f59e0b' }, isHidden: false },
          ]
        }
      ]
    };
  };

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const handleCreateDirectory = (name: string, parentId: string) => {
    const newNode: MarketNode = {
      id: `dir_${Date.now()}`,
      label: name,
      children: []
    };

    if (parentId === 'all') {
      setMarketTree(prev => [...prev, newNode]);
    } else {
      const addToTree = (nodes: MarketNode[]): MarketNode[] => {
        return nodes.map(node => {
          if (node.id === parentId) {
            return {
              ...node,
              children: [...(node.children || []), newNode]
            };
          }
          if (node.children) {
            return {
              ...node,
              children: addToTree(node.children)
            };
          }
          return node;
        });
      };
      setMarketTree(prev => addToTree(prev));
    }
    setIsCreateModalOpen(false);
  };

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
    <div className="flex-1 flex bg-white h-full overflow-hidden animate-fadeIn font-sans text-slate-800">
      
      {/* 1. Left Selection Sidebar */}
      <aside className={`bg-white border-r border-slate-100 flex flex-col flex-shrink-0 z-20 transition-all duration-300 relative ${isSidebarVisible ? 'w-[300px]' : 'w-0'}`}>
        <div className={`flex flex-col h-full w-[300px] transition-opacity duration-300 ${isSidebarVisible ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
          <div className="px-5 pt-6 pb-2 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-100">
                  <MapIcon className="text-white" size={22} />
                </div>
                <div>
                  <h1 className="text-lg font-black text-slate-900 leading-tight">场景集市</h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-slate-100 hover:border-blue-100"
                  title="添加目录"
                >
                  <Plus size={16} />
                </button>
                <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200/50 scale-90 origin-right">
                  <button onClick={() => setViewMode('earth')} className={`p-1 rounded-md transition-all ${viewMode === 'earth' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-400'}`}><Globe size={14} /></button>
                </div>
              </div>
            </div>

          </div>

          {/* 上下布局：参考地图场景设计-图层列表 */}
          <div className="flex-1 flex flex-col overflow-hidden border-t border-slate-100 min-h-0">
            {/* 场景搜索 - 搜索的是场景（名称/描述/标签） */}
            <div className="px-3 py-3 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={sceneSearchQuery}
                  onChange={(e) => setSceneSearchQuery(e.target.value)}
                  placeholder="搜索场景名称 / 描述 / 标签..."
                  className="w-full h-9 pl-9 pr-9 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:bg-white focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                />
                {sceneSearchQuery && (
                  <button
                    onClick={() => setSceneSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-300 hover:text-slate-500 hover:bg-white rounded-lg transition-all"
                    title="清空"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            </div>
            {/* 1. 图层目录 - 上方 */}
            <div className="flex flex-col flex-1 min-h-0 border-b border-slate-100">
              <div className="px-4 py-2.5 flex items-center justify-between bg-slate-50/50 border-b border-slate-100 flex-shrink-0">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <Layers size={14} className="text-blue-600" />
                  图层目录
                </span>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar hover:custom-scrollbar px-3 py-2">
                <div className="space-y-0.5">
                  {marketTree.map(node => (
                    <MarketDirectoryItem
                      key={node.id}
                      node={node}
                      activeId={activeCategoryId}
                      onSelect={setActiveCategoryId}
                      layerVisibility={layerVisibility}
                      onToggleLayerVisibility={toggleLayerVisibility}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* 2. 场景标签 - 下方，支持筛选场景 */}
            <div className="flex flex-col flex-shrink-0 bg-white border-t border-slate-200">
              <div className="px-4 py-2.5 flex items-center justify-between bg-slate-50/50 border-b border-slate-100">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-2">
                  <Hash size={14} className="text-blue-600" />
                  场景标签
                </span>
              </div>
              <div className="p-3 overflow-y-auto max-h-[200px] custom-scrollbar">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveTagName('全部')}
                    className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border whitespace-nowrap ${activeTagName === '全部' ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                  >
                    全部
                  </button>
                  {MARKET_TAGS.map(tag => (
                    <button
                      key={tag.name}
                      onClick={() => setActiveTagName(tag.name)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all border whitespace-nowrap ${activeTagName === tag.name ? 'bg-blue-600 text-white border-blue-600 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'}`}
                    >
                      {tag.name} ({tag.count})
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Toggle Button */}
        <button 
          onClick={() => setIsSidebarVisible(!isSidebarVisible)}
          className={`absolute top-1/2 -translate-y-1/2 -right-4 w-4 h-16 bg-white border border-slate-200 border-l-0 rounded-r-xl shadow-[4px_0_12px_rgba(0,0,0,0.05)] flex items-center justify-center text-slate-400 hover:text-blue-600 z-30 transition-all hover:bg-slate-50 group`}
          title={isSidebarVisible ? "收起侧边栏" : "展开侧边栏"}
        >
          {isSidebarVisible ? <PanelLeftClose size={12} /> : <PanelLeftOpen size={12} />}
        </button>
      </aside>

      {/* 2. Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50/30 relative">
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 relative">
          {viewMode === 'earth' ? (
            <div 
                ref={mapContainerRef}
                className={`h-full w-full bg-slate-200 rounded-2xl relative overflow-hidden group shadow-inner border border-slate-200 transition-all duration-300 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
                onMouseDown={handleMapMouseDown}
                onMouseMove={handleMapMouseMove}
                onMouseUp={handleMapMouseUp}
                onMouseLeave={handleMapMouseUp}
            >
                {/* A. 核心地图渲染层 */}
                <GoogleMapLayer 
                    type={currentBaseMap}
                    zoom={currentZoom}
                    center={currentCenter}
                    dimension={currentDimension}
                />

                {/* B. 视口标签 (Viewport) */}
                <div className="absolute top-4 left-4 z-10">
                   <div className="bg-white/50 backdrop-blur-md px-2 py-0.5 rounded border border-white/40 text-[11px] font-black text-slate-600 shadow-sm">Viewport 1</div>
                </div>

                {/* D. 顶部居中工具条 (与地图场景设计保持一致) */}
                <div 
                    className="absolute top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-xl shadow-2xl h-11 px-2 ring-1 ring-slate-900/5 animate-slideDown cursor-move z-50"
                    style={{ transform: `translate(calc(-50% + ${positions.center.x}px), ${positions.center.y}px)` }}
                    onMouseDown={(e) => handleDragStart(e, 'center')}
                >
                    <div className="flex items-center bg-slate-100 p-1 rounded-lg border border-slate-200/50" onMouseDown={e => e.stopPropagation()}>
                        <button 
                            onClick={() => setCurrentDimension('2D')}
                            className={`px-2 py-1 text-[10px] font-black rounded transition-all ${currentDimension === '2D' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}
                        >
                            2D
                        </button>
                        <button 
                            onClick={() => setCurrentDimension('3D')}
                            className={`px-2 py-1 text-[10px] font-black rounded transition-all ${currentDimension === '3D' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400'}`}
                        >
                            3D
                        </button>
                    </div>
                    <div className="h-4 w-px bg-slate-200 mx-0.5" />
                    <div className="flex items-center gap-0.5" onMouseDown={e => e.stopPropagation()}>
                        <MapToolIconButton icon={<Ruler size={14} />} />
                        <MapToolIconButton icon={<PenTool size={14} />} />
                        <button className="p-1.5 rounded text-slate-500 hover:text-red-600 hover:bg-white/50 transition-all" title="清除">
                            <Trash2 size={14} />
                        </button>
                    </div>
                    <div className="h-4 w-px bg-slate-200 mx-0.5" />
                    <div className="relative flex items-center" onMouseDown={e => e.stopPropagation()}>
                        <MapToolIconButton icon={<MousePointer2 size={14} />} />
                        <MapToolIconButton icon={<Split size={14} />} />
                        <button 
                            onClick={() => setShowSplitMenu(!showSplitMenu)} 
                            className={`p-1.5 rounded transition-all ${splitMode !== '1' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-white/50'}`}
                            title="分屏"
                        >
                            <Grid size={14} />
                        </button>
                        {showSplitMenu && (
                            <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-[110] w-44 animate-in zoom-in-95 duration-200 origin-top-right">
                                <button onClick={() => { setSplitMode('1'); setShowSplitMenu(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all ${splitMode === '1' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>
                                    <Monitor size={14} /> 单屏模式
                                </button>
                                <button onClick={() => { setSplitMode('2'); setShowSplitMenu(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all ${splitMode === '2' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>
                                    <Columns size={14} /> 左右分屏
                                </button>
                                <button onClick={() => { setSplitMode('4'); setShowSplitMenu(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all ${splitMode === '4' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>
                                    <Grid size={14} /> 四分屏
                                </button>
                                <button onClick={() => { setSplitMode('16'); setShowSplitMenu(false); }} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all ${splitMode === '16' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}>
                                    <LayoutGrid size={14} /> 十六分屏
                                </button>
                            </div>
                        )}
                    </div>
                    <button 
                        onClick={() => {}}
                        className="flex items-center gap-1.5 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-black hover:bg-blue-700 transition-all shadow-md active:scale-95"
                        title="快速出图"
                    >
                        <Printer size={14} />
                        <span>快速出图</span>
                    </button>
                </div>

                {/* E. 右下角悬浮操作栏 (Right Toolbar) - 同步预览模式样式 */}
                <div 
                    className="absolute bottom-12 right-6 flex flex-col items-end gap-3 animate-slideUp cursor-move z-50"
                    style={{ transform: `translate(${positions.right.x}px, ${positions.right.y}px)` }}
                    onMouseDown={(e) => handleDragStart(e, 'right')}
                >
                    <div className="flex flex-col gap-2 pointer-events-auto" onMouseDown={e => e.stopPropagation()}>
                        <PreviewToolBtn 
                            icon={isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />} 
                            label={isFullscreen ? "退出全屏" : "全屏"} 
                            onClick={toggleFullscreen} 
                        />
                        <PreviewToolBtn 
                            icon={<Plus size={14} />} 
                            label="放大地图" 
                            onClick={() => setCurrentZoom(z => Math.min(22, z + 1))} 
                        />
                        <PreviewToolBtn 
                            icon={<Minus size={14} />} 
                            label="缩小地图" 
                            onClick={() => setCurrentZoom(z => Math.max(1, z - 1))} 
                        />
                    </div>
                    
                    {/* 底图切换组件 */}
                    <div className="pointer-events-auto" onMouseDown={e => e.stopPropagation()}>
                        <MiniBaseMapSwitcher activeId={currentBaseMap} onSelect={setCurrentBaseMap} />
                    </div>
                </div>

                {/* F. 左下角图例 (Legend) - 同步预览模式样式 */}
                <div 
                    className="absolute bottom-14 left-6 z-20 flex flex-col items-start gap-3 pointer-events-none"
                    style={{ transform: `translate(${positions.legend.x}px, ${positions.legend.y}px)` }}
                    onMouseDown={(e) => handleDragStart(e, 'legend')}
                >
                    {isLegendExpanded ? (
                        <div className="max-w-[200px] bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl p-4 animate-slideUp pointer-events-auto ring-1 ring-slate-900/5">
                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100/50" onMouseDown={e => e.stopPropagation()}>
                                <div className="flex items-center gap-2">
                                    <ListFilter size={14} className="text-blue-600" />
                                    <span className="text-[11px] font-black text-slate-800 uppercase tracking-wider">地图图例</span>
                                </div>
                                <button 
                                    onClick={() => setIsLegendExpanded(false)}
                                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-all"
                                >
                                    <PanelRightClose size={14} />
                                </button>
                            </div>
                            <div className="space-y-3">
                                <div className="space-y-2">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase">地表覆盖分类</div>
                                    <div className="flex items-center gap-3 pl-1">
                                        <div className="w-3.5 h-3.5 bg-orange-500 rounded shadow-sm border border-white"></div>
                                        <span className="text-[11px] font-bold text-slate-600">默认符号</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <button 
                            onClick={() => setIsLegendExpanded(true)}
                            className="w-10 h-10 bg-white/90 backdrop-blur-xl border border-slate-200 rounded-xl shadow-xl flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-white transition-all pointer-events-auto animate-in zoom-in-75 ring-1 ring-slate-900/5"
                        >
                            <PanelRightOpen size={14} />
                        </button>
                    )}
                </div>

                {/* G. 底部空间信息条 (Status Bar) */}
                <div className="absolute bottom-0 left-0 right-0 h-10 bg-white/80 backdrop-blur-xl border-t border-slate-200/60 z-30 flex items-center px-6 pointer-events-none">
                    <div className="flex-1 flex items-center divide-x divide-slate-200 h-4">
                        <div className="flex items-center gap-1.5 px-4 first:pl-0">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">层级:</span>
                            <span className="text-xs font-black text-blue-600 font-mono">{currentZoom}</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">经度:</span>
                            <span className="text-xs font-black text-emerald-600 font-mono uppercase">{currentCenter.lon.toFixed(6)}°E</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">纬度:</span>
                            <span className="text-xs font-black text-emerald-600 font-mono uppercase">{currentCenter.lat.toFixed(6)}°N</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">高程:</span>
                            <span className="text-xs font-black text-amber-600 font-mono">24.5 m</span>
                        </div>
                        <div className="flex items-center gap-1.5 px-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">顶部图层:</span>
                            <span className="text-xs font-black text-slate-800 tracking-tight">地表覆盖分类</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-4 divide-x divide-slate-200 h-4 ml-auto pointer-events-auto">
                        <div className="px-4 flex items-center">
                            <span className="text-[9px] font-black text-slate-300 font-mono tracking-widest">EPSG:4326</span>
                        </div>
                        <div className="pl-4 flex items-center">
                            <button 
                                onClick={() => setIsTableViewOpen(!isTableViewOpen)}
                                className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 ${isTableViewOpen ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                            >
                                <BarChart2 size={12} />
                                图表视图
                            </button>
                        </div>
                    </div>
                </div>

                {/* H. 时间轴组件 (Time Player) */}
                {isTimePlayerDropped && (
                    <div className="absolute bottom-12 left-1/2 -translate-x-1/2 z-40 w-full max-w-[600px] animate-slideUp">
                        <TimePlayerProvider>
                            <div className="scale-75 origin-bottom">
                                <TimePlayer />
                            </div>
                        </TimePlayerProvider>
                    </div>
                )}

                {/* I. 表格视图 (Table View) */}
                {isTableViewOpen && (
                    <div className="absolute bottom-10 left-0 right-0 h-[200px] bg-white border-t border-slate-200 z-50 animate-slideUp overflow-hidden flex flex-col">
                        <TableView 
                            layerId="l1" 
                            featureId={null}
                            onClose={() => setIsTableViewOpen(false)}
                        />
                    </div>
                )}

                {/* J. 模拟指标卡 (Summary Indicators) */}
                <IndicatorCard 
                    id="ind-1"
                    title="耕地总面积"
                    value="1,240.5"
                    unit="km²"
                    color="#10b981"
                    icon={<Database size={14} />}
                    top={80}
                    right={24}
                    position={positions['ind-1']}
                    isCollapsed={collapsedComponents.has('ind-1')}
                    onToggleCollapse={() => toggleCollapse('ind-1')}
                    onDragStart={(e) => handleDragStart(e, 'ind-1')}
                />

                <BarChartIndicatorCard 
                    id="chart-1"
                    title="土地利用分类统计"
                    color="#3b82f6"
                    icon={<BarChart2 size={14} />}
                    top={180}
                    right={24}
                    position={positions['chart-1']}
                    isCollapsed={collapsedComponents.has('chart-1')}
                    onToggleCollapse={() => toggleCollapse('chart-1')}
                    onDragStart={(e) => handleDragStart(e, 'chart-1')}
                />
            </div>
          ) : viewMode === 'list' ? (
            <div className="flex flex-col gap-4 animate-slideUp max-w-7xl mx-auto">
              {filteredImagery.map(item => (
                <ImageryListItem key={item.id} tile={item} onOpenPreview={() => handleOpenPreview(item)} />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-5 animate-slideUp">
              {filteredImagery.map(item => (
                  <ImageryCard key={item.id} tile={item} onOpenPreview={() => handleOpenPreview(item)} />
              ))}
            </div>
          )}
        </div>

        {viewMode !== 'earth' && (
          <footer className="h-14 bg-white border-t border-slate-100 px-6 flex items-center justify-between text-sm flex-shrink-0">
              <div className="text-slate-400 font-medium">共 {filteredImagery.length} 条</div>
              <div className="flex items-center gap-4">
                  <div className="px-3 py-1.5 border border-slate-200 rounded text-slate-600 text-xs flex items-center gap-4 bg-white cursor-pointer hover:border-slate-300">12条/页 <ChevronDown size={14} className="text-slate-300" /></div>
                  <div className="flex items-center gap-1.5">
                      <button className="w-8 h-8 flex items-center justify-center text-slate-300 hover:text-slate-600 bg-slate-50 border border-slate-100 rounded"><ChevronLeft size={16} /></button>
                      <button className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded font-bold text-xs">1</button>
                      <button className="w-8 h-8 flex items-center justify-center text-slate-500 border border-slate-100 rounded text-xs font-medium">2</button>
                      <button className="w-8 h-8 flex items-center justify-center text-slate-400 border border-slate-100 rounded"><ChevronRight size={16} /></button>
                  </div>
              </div>
          </footer>
        )}

        {isPreviewOpen && selectedScene && (
          <ScenePreview sceneData={getScenePreviewData(selectedScene)} onClose={() => setIsPreviewOpen(false)} exitLabel="返回集市" />
        )}

        {isCreateModalOpen && (
          <CreateDirectoryModal 
            directories={flatDirectories}
            onClose={() => setIsCreateModalOpen(false)}
            onConfirm={handleCreateDirectory}
          />
        )}
      </main>

    </div>
  );
};

// --- Sub-components ---

const CreateDirectoryModal: React.FC<{
  directories: { id: string, label: string }[];
  onClose: () => void;
  onConfirm: (name: string, parentId: string) => void;
}> = ({ directories, onClose, onConfirm }) => {
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState('all');

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-[480px] border border-slate-200 overflow-hidden animate-zoomIn">
        <div className="flex justify-between items-center px-6 py-5 border-b border-slate-50">
          <h3 className="text-lg font-bold text-slate-800 tracking-tight">添加场景目录</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600">目录名称</label>
            <input 
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="请输入目录名称"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-600">上级目录</label>
            <select 
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-sm appearance-none"
            >
              {directories.map(dir => (
                <option key={dir.id} value={dir.id}>{dir.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="px-8 py-6 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3">
          <button 
            onClick={onClose}
            className="px-6 py-2 rounded-xl text-sm font-bold text-slate-500 hover:bg-slate-100 transition-all"
          >
            取消
          </button>
          <button 
            onClick={() => onConfirm(name, parentId)}
            disabled={!name.trim()}
            className="px-8 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 disabled:opacity-50 disabled:shadow-none"
          >
            确定创建
          </button>
        </div>
      </div>
    </div>
  );
};

const MapToolIconButton: React.FC<{ icon: React.ReactNode }> = ({ icon }) => (
    <button className="p-2 text-slate-500 hover:text-blue-600 hover:bg-white rounded-lg transition-all">
        {icon}
    </button>
);

const MapSidebarBtn: React.FC<{ icon: React.ReactNode; active?: boolean; variant?: 'default' | 'danger' }> = ({ icon, active, variant = 'default' }) => (
    <button className={`
        w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-sm
        ${active ? 'bg-blue-600 text-white shadow-blue-200' : variant === 'danger' ? 'text-slate-400 hover:text-rose-500 hover:bg-rose-50' : 'text-slate-500 hover:bg-slate-50'}
    `}>
        {icon}
    </button>
);

// 预览工具按钮组件 (同步自 ScenePreview)
const PreviewToolBtn: React.FC<{ icon: React.ReactNode; label: string; active?: boolean; variant?: 'default' | 'danger'; onClick?: () => void }> = ({ icon, label, active, variant = 'default', onClick }) => (
    <div className="relative group/tool">
        <button 
            onClick={onClick}
            className={`
                w-10 h-10 flex items-center justify-center rounded-xl transition-all shadow-xl bg-white/90 backdrop-blur-xl border border-slate-200/60 ring-1 ring-slate-900/5
                ${active 
                    ? 'bg-blue-600 text-white shadow-blue-900/40 ring-2 ring-blue-600/20' 
                    : variant === 'danger' 
                        ? 'text-slate-500 hover:text-rose-500 hover:bg-rose-50' 
                        : 'text-slate-500 hover:text-blue-600 hover:bg-white'}
            `}
        >
            {icon}
        </button>
        <div className="absolute right-full mr-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-slate-800 text-white text-[10px] font-black rounded-lg shadow-2xl opacity-0 group-hover/tool:opacity-100 transition-all pointer-events-none whitespace-nowrap z-[100] border border-white/10 uppercase tracking-wider">
            {label}
            <div className="absolute left-full top-1/2 -translate-y-1/2 border-[5px] border-transparent border-l-slate-800"></div>
        </div>
    </div>
);

// 指标卡组件 (同步自 ScenePreview)
const IndicatorCard: React.FC<{
    id: string;
    title: string;
    value: string;
    unit: string;
    color: string;
    icon: React.ReactNode;
    top: number;
    right: number;
    position: { x: number, y: number };
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    onDragStart: (e: React.MouseEvent) => void;
}> = ({ id, title, value, unit, color, icon, top, right, position, isCollapsed, onToggleCollapse, onDragStart }) => (
    <div 
        style={{ 
            top: top + position.y, 
            right: 0,
            transform: isCollapsed ? `translateX(100%)` : `translateX(calc(-${right}px + ${position.x}px))`
        }}
        className={`absolute z-50 bg-white/90 backdrop-blur-md border border-slate-200 shadow-lg rounded-xl p-4 min-w-[160px] transition-all duration-500 ease-in-out ${isCollapsed ? 'pointer-events-none' : 'cursor-move'}`}
        onMouseDown={!isCollapsed ? onDragStart : undefined}
    >
        <button 
            onClick={(e) => {
                e.stopPropagation();
                onToggleCollapse();
            }}
            onMouseDown={e => e.stopPropagation()}
            className={`absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-16 bg-white/90 backdrop-blur-md border border-r-0 border-slate-200 rounded-l-xl shadow-[-4px_0_12px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center hover:text-blue-600 transition-all group pointer-events-auto`}
            title={isCollapsed ? "展开" : "收起"}
        >
            {isCollapsed ? (
                <div className="flex flex-col items-center gap-1">
                    <div className="text-blue-600">{icon}</div>
                    <ChevronLeft size={10} className="text-slate-400 animate-pulse" />
                </div>
            ) : <ChevronRight size={14} />}
            
            {isCollapsed && (
                <div className="absolute right-8 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
                    {title}
                    <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 border-l-4 border-l-slate-800 border-y-4 border-y-transparent"></div>
                </div>
            )}
        </button>

        <div className={`transition-all duration-500 ${isCollapsed ? 'opacity-0 blur-sm' : 'opacity-100'}`}>
            <div className="text-[11px] font-bold text-slate-500 mb-1">{title}</div>
            <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black tracking-tight" style={{ color }}>{value}</span>
                <span className="text-xs font-bold text-slate-400">{unit}</span>
            </div>
        </div>
    </div>
);

const BarChartIndicatorCard: React.FC<{
    id: string;
    title: string;
    color: string;
    icon: React.ReactNode;
    top: number;
    right: number;
    position: { x: number, y: number };
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    onDragStart: (e: React.MouseEvent) => void;
}> = ({ id, title, color, icon, top, right, position, isCollapsed, onToggleCollapse, onDragStart }) => {
    const data = [
        { name: '分类A', value: 400 },
        { name: '分类B', value: 300 },
        { name: '分类C', value: 200 },
        { name: '分类D', value: 278 },
        { name: '分类E', value: 189 },
    ];

    return (
        <div 
            style={{ 
                top: top + position.y, 
                right: 0,
                width: 320,
                transform: isCollapsed ? `translateX(100%)` : `translateX(calc(-${right}px + ${position.x}px))`
            }}
            className={`absolute z-50 bg-white/95 backdrop-blur-md border border-slate-200 shadow-2xl rounded-2xl p-4 transition-all duration-500 ease-in-out flex flex-col h-[240px] ${isCollapsed ? 'pointer-events-none' : 'cursor-move'}`}
            onMouseDown={!isCollapsed ? onDragStart : undefined}
        >
            <button 
                onClick={(e) => {
                    e.stopPropagation();
                    onToggleCollapse();
                }}
                onMouseDown={e => e.stopPropagation()}
                className={`absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-20 bg-white/95 backdrop-blur-md border border-r-0 border-slate-200 rounded-l-xl shadow-[-4px_0_12px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center hover:text-blue-600 transition-all group pointer-events-auto`}
                title={isCollapsed ? "展开" : "收起"}
            >
                {isCollapsed ? (
                    <div className="flex flex-col items-center gap-1">
                        <div className="text-blue-600">{icon}</div>
                        <ChevronLeft size={10} className="text-slate-400 animate-pulse" />
                    </div>
                ) : <ChevronRight size={14} />}

                {isCollapsed && (
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
                        {title}
                        <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 border-l-4 border-l-slate-800 border-y-4 border-y-transparent"></div>
                    </div>
                )}
            </button>

            <div className={`flex-1 flex flex-col transition-all duration-500 ${isCollapsed ? 'opacity-0 blur-sm' : 'opacity-100'}`}>
                <div className="flex items-center justify-between mb-3 shrink-0">
                    <div className="text-[11px] font-bold text-slate-500">{title}</div>
                    <span className="px-2 py-0.5 bg-slate-100 rounded text-[9px] font-bold text-slate-500">单位: km²</span>
                </div>
                <div className="flex-1 min-h-0">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9 }} />
                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 9 }} />
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                itemStyle={{ fontSize: '9px' }}
                            />
                            <Bar dataKey="value" fill={color} radius={[4, 4, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

const MarketDirectoryItem: React.FC<{
  node: MarketNode;
  activeId: string;
  onSelect: (id: string) => void;
  level?: number;
  layerVisibility?: Record<string, boolean>;
  onToggleLayerVisibility?: (id: string) => void;
}> = ({ node, activeId, onSelect, level = 0, layerVisibility = {}, onToggleLayerVisibility }) => {
  const [isOpen, setIsOpen] = useState(level === 0);
  const isActive = activeId === node.id;
  const hasChildren = node.children && node.children.length > 0;
  const isSubLayer = level >= 2;
  const isVisible = layerVisibility[node.id] !== false;

  const renderIcon = () => {
    if (node.icon) return node.icon;
    if (level === 0) return isOpen ? <FolderOpen size={16} className="text-blue-500" /> : <Folder size={16} className="text-slate-400" />;
    if (level === 1) return <Globe size={16} className={isActive ? 'text-white' : 'text-blue-400'} />;
    return <Layers size={14} className={isActive ? 'text-white' : 'text-slate-400'} />;
  };

  return (
    <div className="flex flex-col">
      <div
        onClick={() => !isSubLayer && onSelect(node.id)}
        className={`
          flex items-center justify-between px-3 h-10 rounded-lg transition-all cursor-pointer group
          ${isActive ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
        `}
        style={{ paddingLeft: `${(level * 18) + 12}px` }}
      >
        <div
          className={`w-6 h-6 flex items-center justify-center flex-shrink-0 rounded-md transition-colors ${isActive ? 'hover:bg-white/20' : 'hover:bg-slate-100'}`}
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) setIsOpen(!isOpen);
          }}
        >
          {hasChildren && <ChevronRight size={14} className={`transition-transform duration-200 ${isOpen ? 'rotate-90' : ''} ${isActive ? 'text-white' : 'text-slate-300'}`} />}
        </div>
        {isSubLayer && onToggleLayerVisibility && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onToggleLayerVisibility(node.id); }}
            className={`flex items-center justify-center w-8 h-8 rounded-lg transition-colors flex-shrink-0 mr-1 ${isActive ? 'text-white hover:bg-white/20' : 'text-slate-400 hover:bg-slate-100 hover:text-blue-600'}`}
            title={isVisible ? '隐藏图层' : '显示图层'}
          >
            {isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        )}
        <div className={`shrink-0 flex items-center justify-center w-6 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-blue-500'}`}>{renderIcon()}</div>
        <span className={`flex-1 text-[13px] truncate ml-1.5 ${isActive ? 'font-bold' : 'font-medium'} ${isSubLayer && !isVisible ? 'opacity-60 line-through' : ''}`}>{node.label}</span>
        {node.count !== undefined && <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-lg shrink-0 ${isActive ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-400'}`}>{node.count}</span>}
      </div>
      {hasChildren && isOpen && (
        <div className="mt-0.5 animate-fadeIn">
          {node.children!.map(child => (
            <MarketDirectoryItem
              key={child.id}
              node={child}
              activeId={activeId}
              onSelect={onSelect}
              level={level + 1}
              layerVisibility={layerVisibility}
              onToggleLayerVisibility={onToggleLayerVisibility}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ImageryCard: React.FC<{ tile: ImageryTile; onOpenPreview: () => void }> = ({ tile, onOpenPreview }) => (
    <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col">
        <div className="aspect-[1.8/1] bg-slate-100 relative group overflow-hidden">
            <img src={tile.thumbnail} alt="" className="w-full h-full object-cover grayscale brightness-75 hover:scale-105 transition-transform duration-500" />
            <div className="absolute top-3 left-3"><input type="checkbox" className="w-4 h-4 rounded border-white/40 bg-black/20 checked:bg-blue-600 cursor-pointer accent-blue-600" checked={tile.selected} onChange={() => {}} /></div>
        </div>
        <div className="p-4 flex-1 flex flex-col gap-3">
            <div className="space-y-1">
                <h3 className="text-[14px] font-bold text-slate-800 truncate">{tile.code}</h3>
                <p className="text-[12px] text-slate-400 truncate cursor-default min-h-[18px]">{tile.description}</p>
            </div>
            <div className="flex flex-wrap gap-2">{tile.tags.map(tag => (<span key={tag} className="px-2 py-0.5 bg-slate-50 border border-slate-100 rounded text-[11px] text-slate-500">{tag}</span>))}</div>
        </div>
        <div className="border-t border-slate-100 flex bg-white divide-x divide-slate-100">
            <button onClick={onOpenPreview} className="flex-1 py-3 text-[12px] font-bold text-blue-600 transition-all hover:bg-slate-50">查看详情</button>
            <button className={`flex-1 py-3 text-[12px] font-bold transition-all hover:bg-slate-50 text-blue-600`}>收藏</button>
            <button className="flex-1 py-3 text-[12px] font-bold text-blue-600 transition-all hover:bg-slate-50">分享</button>
        </div>
    </div>
);

const ImageryListItem: React.FC<{ tile: ImageryTile; onOpenPreview: () => void }> = ({ tile, onOpenPreview }) => (
  <div className="bg-white rounded-xl border border-slate-100 p-6 flex gap-8 hover:shadow-xl hover:-translate-y-0.5 transition-all group relative animate-slideLeft">
    <div className="w-72 h-44 flex-shrink-0 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 shadow-inner relative">
      <img src={tile.thumbnail} alt="" className="w-full h-full object-cover grayscale brightness-90 group-hover:scale-105 transition-transform duration-700" />
      <div className="absolute top-3 left-3"><input type="checkbox" className="w-4 h-4 rounded border-white/40 bg-black/20 checked:bg-blue-600 cursor-pointer accent-blue-600" checked={tile.selected} onChange={() => {}} /></div>
    </div>
    <div className="flex-1 flex flex-col min-w-0 h-44">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-black text-blue-600 truncate hover:underline cursor-pointer tracking-tight" onClick={onOpenPreview}>{tile.code}</h3>
        <span className="text-slate-400 text-xs font-mono font-bold tracking-wider shrink-0 ml-4">{tile.date || '2026-02-12'}</span>
      </div>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <span className="text-[12px] text-slate-500 font-bold mr-2 whitespace-nowrap shrink-0">关键词:</span>
        {tile.tags.map(tag => (<span key={tag} className="px-3 py-0.5 bg-blue-50/50 border border-blue-100 text-blue-600 rounded text-[11px] font-bold">{tag}</span>))}
      </div>
      <div className="flex gap-3 mb-2 leading-relaxed">
        <span className="text-[12px] text-slate-500 font-bold shrink-0 mt-0.5">说&nbsp;&nbsp;&nbsp;&nbsp;明:</span>
        <p className="text-[12px] text-slate-600 line-clamp-2 w-full">{tile.description}</p>
      </div>
      <div className="flex items-center justify-between mt-auto">
        <div className="flex gap-2 items-center min-w-0 mr-10">
          <span className="text-[12px] text-slate-500 font-bold shrink-0">创&nbsp;建&nbsp;人:</span>
          <span className="text-[12px] text-slate-600 font-bold hover:text-blue-600 cursor-pointer truncate">{tile.author || '系统管理员'}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all border border-slate-100 hover:border-rose-100"><Heart size={17} /></button>
          <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all border border-slate-100 hover:border-blue-100"><Share2 size={17} /></button>
          <button onClick={onOpenPreview} className="px-6 py-1.5 ml-2 bg-blue-600 text-white rounded-xl text-[12px] font-black hover:bg-blue-700 transition-all shadow-lg shadow-blue-100 flex items-center gap-2 group/btn">查看详情 <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" /></button>
        </div>
      </div>
    </div>
  </div>
);