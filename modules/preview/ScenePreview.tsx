
import React from 'react';
import { X, Globe, Compass, List, MousePointer2, MapPin, Eye, EyeOff, Layers, FolderOpen, Plus, Minus, Ruler, PenTool, Trash2, ChevronDown, ChevronLeft, ChevronRight, CheckCircle2, LayoutGrid, Map as MapIcon, Rocket, PanelRightOpen, PanelRightClose, Split, Maximize, Minimize, BarChart2, Table, Database, Printer } from 'lucide-react';
import { TimePlayerProvider } from '../timePlayer/TimePlayerContext';
import { TimePlayer } from '../timePlayer/TimePlayer';
import { MiniBaseMapSwitcher } from '../../components/MiniBaseMapSwitcher';
import { GoogleMapLayer, SummaryIndicator, BarChartIndicator, TableView } from '../../components/DataSmartMapPanel';
import { 
    ResponsiveContainer, 
    BarChart, 
    XAxis, 
    YAxis, 
    CartesianGrid, 
    Tooltip, 
    Legend, 
    Bar,
    Cell
} from 'recharts';

interface SceneData {
    title?: string;
    visibleLayers: { id: string; label: string }[];
    drawnFeatures: any[];
    isTimePlayerDropped: boolean;
    timePlayerConfig?: any;
    summaryIndicators?: SummaryIndicator[];
    barChartIndicators?: BarChartIndicator[];
    isTableViewOpen?: boolean;
    selectedLayerIdForTable?: string | null;
    selectedFeatureIdForTable?: string | null;
    zoom: number;
    dimension: '2D' | '3D';
    splitMode: string;
    legends: any[];
    mapCenter: { lat: number; lon: number };
    activeBaseMap: string;
    isLyr1Generated?: boolean;
}

interface ScenePreviewProps {
    sceneData: SceneData;
    onClose: () => void;
    exitLabel?: string;
    onGoMapping?: (layers: string[], drawn: any[], legends: any[]) => void;
}

export const ScenePreview: React.FC<ScenePreviewProps> = ({ sceneData, onClose, exitLabel = "退出预览模式", onGoMapping }) => {
    const { 
        title, 
        visibleLayers = [], 
        drawnFeatures = [], 
        isTimePlayerDropped = false,
        timePlayerConfig,
        summaryIndicators: initialSummaryIndicators = [], 
        barChartIndicators: initialBarChartIndicators = [],
        isTableViewOpen: initialIsTableViewOpen = false,
        selectedLayerIdForTable: initialSelectedLayerId = null,
        selectedFeatureIdForTable: initialSelectedFeatureId = null,
        zoom = 5, 
        dimension = '2D', 
        splitMode = '1', 
        legends = [], 
        mapCenter = { lat: 30.592, lon: 114.305 }, 
        activeBaseMap = 'hybrid',
        isLyr1Generated = false
    } = sceneData || {};
    const [isLegendExpanded, setIsLegendExpanded] = React.useState(true);
    const [isLayerListExpanded, setIsLayerListExpanded] = React.useState(true);
    const [isTableViewOpen, setIsTableViewOpen] = React.useState(initialIsTableViewOpen);
    const [selectedLayerIdForTable, setSelectedLayerIdForTable] = React.useState(initialSelectedLayerId);
    const [selectedFeatureIdForTable, setSelectedFeatureIdForTable] = React.useState(initialSelectedFeatureId);
    const [currentBaseMap, setCurrentBaseMap] = React.useState(activeBaseMap);
    const [currentCenter, setCurrentCenter] = React.useState(mapCenter);
    const [currentZoom, setCurrentZoom] = React.useState(zoom);
    const [currentDimension, setCurrentDimension] = React.useState(dimension);
    const [isFullscreen, setIsFullscreen] = React.useState(false);
    const [summaryIndicators, setSummaryIndicators] = React.useState(initialSummaryIndicators);
    const [barChartIndicators, setBarChartIndicators] = React.useState(initialBarChartIndicators);
    const [isPanning, setIsPanning] = React.useState(false);
    const [lastMousePos, setLastMousePos] = React.useState({ x: 0, y: 0 });
    const [draggingComponent, setDraggingComponent] = React.useState<{ type: 'indicator' | 'barChart', id: string } | null>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const mapContainerRef = React.useRef<HTMLDivElement>(null);

    const [previewLayers, setPreviewLayers] = React.useState<{ id: string, label: string, isVisible: boolean }[]>(
        Array.isArray(visibleLayers) ? visibleLayers.map((l) => ({ ...l, isVisible: true })) : []
    );
    const [draggedLayerIdx, setDraggedLayerIdx] = React.useState<number | null>(null);
    const [collapsedComponents, setCollapsedComponents] = React.useState<Set<string>>(new Set());
    const [activeToolbarCategory, setActiveToolbarCategory] = React.useState<'measure' | 'plot' | null>(null);
    const [showSplitMenu, setShowSplitMenu] = React.useState(false);
    const [isSwipeActive, setIsSwipeActive] = React.useState(false);
    const [currentSplitMode, setCurrentSplitMode] = React.useState<string>(splitMode || '1');

    const handleTimeChange = (time: Date) => {
        if (!timePlayerConfig || !timePlayerConfig.timePoints || timePlayerConfig.timePoints.length === 0) return;
        
        const sortedPoints = [...timePlayerConfig.timePoints]
            .filter((tp: any) => tp.time)
            .sort((a: any, b: any) => new Date(a.time).getTime() - new Date(b.time).getTime());
            
        let activePoint = sortedPoints[0];
        for (let i = sortedPoints.length - 1; i >= 0; i--) {
            if (new Date(sortedPoints[i].time).getTime() <= time.getTime()) {
                activePoint = sortedPoints[i];
                break;
            }
        }
        
        if (activePoint && activePoint.layerId) {
            const timePointLayerIds = new Set(timePlayerConfig.timePoints.map((tp: any) => tp.layerId).filter(Boolean));
            
            setPreviewLayers(prev => prev.map(layer => {
                if (timePointLayerIds.has(layer.id)) {
                    return { ...layer, isVisible: layer.id === activePoint.layerId };
                }
                return layer;
            }));
        }
    };

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

    React.useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        
        const handleMapWheel = (e: WheelEvent) => {
            e.preventDefault();
            if (e.deltaY < 0) {
                setCurrentZoom(z => Math.min(22, z + 1));
            } else {
                setCurrentZoom(z => Math.max(1, z - 1));
            }
        };

        const mapContainer = mapContainerRef.current;
        if (mapContainer) {
            mapContainer.addEventListener('wheel', handleMapWheel, { passive: false });
        }

        return () => {
            document.removeEventListener('fullscreenchange', handleFullscreenChange);
            if (mapContainer) {
                mapContainer.removeEventListener('wheel', handleMapWheel);
            }
        };
    }, []);

    const handleMapMouseDown = (e: React.MouseEvent) => {
        setIsPanning(true);
        setLastMousePos({ x: e.clientX, y: e.clientY });
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
                        if (newPos.left !== undefined) newPos.left += dx;
                        else if (newPos.right !== undefined) newPos.right -= dx;
                        else newPos.right = 24 - dx;
                        return { ...indicator, position: newPos };
                    }
                    return indicator;
                }));
            } else if (draggingComponent.type === 'barChart') {
                setBarChartIndicators(prev => prev.map(indicator => {
                    if (indicator.id === draggingComponent.id) {
                        const newPos = { ...indicator.position };
                        newPos.top += dy;
                        if (newPos.left !== undefined) newPos.left += dx;
                        else if (newPos.right !== undefined) newPos.right -= dx;
                        else newPos.right = 24 - dx;
                        return { ...indicator, position: newPos };
                    }
                    return indicator;
                }));
            }
            
            setLastMousePos({ x: e.clientX, y: e.clientY });
            return;
        }

        if (!isPanning) return;
        
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
        setDraggingComponent(null);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            containerRef.current?.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
            }
        }
    };

    const handleDragStart = (e: React.DragEvent, idx: number) => {
        setDraggedLayerIdx(idx);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent, idx: number) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = (e: React.DragEvent, dropIdx: number) => {
        e.preventDefault();
        if (draggedLayerIdx === null || draggedLayerIdx === dropIdx) return;
        
        const newLayers = [...previewLayers];
        const [draggedLayer] = newLayers.splice(draggedLayerIdx, 1);
        newLayers.splice(dropIdx, 0, draggedLayer);
        setPreviewLayers(newLayers);
        setDraggedLayerIdx(null);
    };

    // 处理图层点击定位
    const handleLayerClick = (layer: any) => {
        const label = layer.label;
        if (label === '地表覆盖分类') {
            setCurrentCenter({ lat: 30.589, lon: 114.302 });
            setCurrentZoom(13);
        } else if (label === '水网分布要素') {
            setCurrentCenter({ lat: 30.550, lon: 114.285 });
            setCurrentZoom(14);
        }
        
        // 仅记录选中的图层，不自动打开图表视图
        setSelectedLayerIdForTable(layer.id);
        setSelectedFeatureIdForTable(null);
    };

    return (
        <div ref={containerRef} className="v2-preview-mode-overlay fixed inset-0 z-[1000] bg-slate-50 flex flex-col animate-fadeIn overflow-hidden select-none text-slate-800">
            {/* 1. 顶部预览页眉 - 仿编辑器样式 */}
            <div className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-4 shadow-sm z-[1010] flex-shrink-0 relative">
                <div className="flex items-center gap-3">
                    <div className="p-1.5 bg-blue-600 rounded-lg shadow-md text-white">
                        <Eye size={18} />
                    </div>
                    <div>
                        <h2 className="text-sm font-black tracking-tight uppercase text-slate-800">{title || '场景预览模式'}</h2>
                    </div>
                </div>

                {/* 顶部中心工具栏 - 与设计模式保持一致（预览模式不编辑） */}
                <div
                    className="absolute left-1/2 -translate-x-1/2 flex items-center gap-1 bg-slate-100/80 backdrop-blur-md p-1 rounded-xl border border-slate-200 shadow-sm animate-slideDown"
                    data-stop-map="true"
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex bg-white rounded-lg shadow-sm p-0.5 border border-slate-200/50">
                        <button 
                            onClick={() => setCurrentDimension('2D')}
                            className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${currentDimension === '2D' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            2D
                        </button>
                        <button 
                            onClick={() => setCurrentDimension('3D')}
                            className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${currentDimension === '3D' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            3D
                        </button>
                    </div>
                    <div className="h-4 w-px bg-slate-200 mx-1"></div>

                    {/* 量测 */}
                    <div className="relative flex items-center">
                        <button 
                            onClick={() => setActiveToolbarCategory(prev => prev === 'measure' ? null : 'measure')}
                            className={`p-1.5 rounded transition-all ${activeToolbarCategory === 'measure' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-white/50'}`}
                            title="量测工具（预览模式不可编辑）"
                        >
                            <Ruler size={14} />
                        </button>
                        {activeToolbarCategory === 'measure' && (
                            <div className="absolute top-full mt-2 left-0 flex flex-col gap-1 p-1 bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-xl shadow-2xl animate-slideDown pointer-events-auto ring-1 ring-slate-900/5 z-[110] min-w-[120px]">
                                <button disabled className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all text-slate-300 cursor-not-allowed">
                                    <Ruler size={14} /> 距离量测
                                </button>
                                <button disabled className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all text-slate-300 cursor-not-allowed">
                                    <Ruler size={14} /> 面积量测
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 标绘 */}
                    <div className="relative flex items-center">
                        <button 
                            onClick={() => setActiveToolbarCategory(prev => prev === 'plot' ? null : 'plot')}
                            className={`p-1.5 rounded transition-all ${activeToolbarCategory === 'plot' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-white/50'}`}
                            title="标绘工具（预览模式不可编辑）"
                        >
                            <PenTool size={14} />
                        </button>
                        {activeToolbarCategory === 'plot' && (
                            <div className="absolute top-full mt-2 left-0 flex flex-col gap-1 p-1 bg-white/95 backdrop-blur-xl border border-slate-200/60 rounded-xl shadow-2xl animate-slideDown pointer-events-auto ring-1 ring-slate-900/5 z-[110] min-w-[140px]">
                                <button disabled className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all text-slate-300 cursor-not-allowed">
                                    <PenTool size={14} /> 添加注记
                                </button>
                                <button disabled className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all text-slate-300 cursor-not-allowed">
                                    <PenTool size={14} /> 绘制多边形
                                </button>
                                <button disabled className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all text-slate-300 cursor-not-allowed">
                                    <PenTool size={14} /> 绘制圆
                                </button>
                                <button disabled className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all text-slate-300 cursor-not-allowed">
                                    <PenTool size={14} /> 绘制线
                                </button>
                                <button disabled className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold transition-all text-slate-300 cursor-not-allowed">
                                    <PenTool size={14} /> 绘制点
                                </button>
                            </div>
                        )}
                    </div>

                    {/* 清除 */}
                    <button disabled className="p-1.5 rounded text-slate-300 cursor-not-allowed" title="清除全部（预览模式不可编辑）">
                        <Trash2 size={14} />
                    </button>

                    <div className="h-4 w-px bg-slate-200 mx-1"></div>

                    {/* 查询 */}
                    <button disabled className="p-1.5 rounded text-slate-300 cursor-not-allowed" title="点图查询（预览模式不可编辑）">
                        <MousePointer2 size={14} />
                    </button>

                    {/* 卷帘 */}
                    <button
                        onClick={() => setIsSwipeActive(!isSwipeActive)}
                        className={`p-1.5 rounded transition-all ${isSwipeActive ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 hover:bg-white/50'}`}
                        title="卷帘对比模式"
                    >
                        <Split size={14} />
                    </button>

                    {/* 分屏 */}
                    <div className="relative flex items-center">
                        <button
                            onClick={() => setShowSplitMenu(!showSplitMenu)}
                            className={`p-1.5 rounded transition-all ${currentSplitMode !== '1' ? 'bg-blue-50 text-blue-600' : 'text-slate-500 hover:bg-white/50'}`}
                            title="分屏模式"
                        >
                            <LayoutGrid size={14} />
                        </button>
                        {showSplitMenu && (
                            <div className="absolute top-full mt-2 right-0 bg-white rounded-xl shadow-2xl border border-slate-200 p-2 z-[110] w-44 animate-in zoom-in-95 duration-200 origin-top-right">
                                <SplitMenuItem label="单屏模式" active={currentSplitMode === '1'} onClick={() => { setShowSplitMenu(false); setCurrentSplitMode('1'); }} />
                                <SplitMenuItem label="左右分屏" active={currentSplitMode === '2'} onClick={() => { setShowSplitMenu(false); setCurrentSplitMode('2'); }} />
                                <SplitMenuItem label="四分屏" active={currentSplitMode === '4'} onClick={() => { setShowSplitMenu(false); setCurrentSplitMode('4'); }} />
                                <SplitMenuItem label="十六分屏" active={currentSplitMode === '16'} onClick={() => { setShowSplitMenu(false); setCurrentSplitMode('16'); }} />
                            </div>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    {onGoMapping && (
                        <button
                            onClick={() => onGoMapping(previewLayers.filter(l => l.isVisible).map(l => l.label), drawnFeatures, legends)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-black shadow-lg transition-all active:scale-95"
                        >
                            <Printer size={16} />
                            快速出图
                        </button>
                    )}
                    <button 
                        onClick={onClose}
                        className="flex items-center gap-2 px-4 py-2 bg-[#e11d48] hover:bg-rose-600 text-white rounded-lg text-xs font-black shadow-lg transition-all active:scale-95"
                    >
                        {exitLabel} <X size={16} />
                    </button>
                </div>
            </div>

            {/* 2. 核心地图渲染区域 */}
            <div 
                className={`flex-1 relative overflow-hidden flex flex-col bg-slate-200 transition-all duration-300 ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
                onMouseDown={handleMapMouseDown}
                onMouseMove={handleMapMouseMove}
                onMouseUp={handleMapMouseUp}
                onMouseLeave={handleMapMouseUp}
                ref={mapContainerRef}
            >
                
                {/* A. 左侧浮动：图层列表 - 浅色玻璃质感 */}
                <div 
                    className={`absolute top-6 left-6 z-50 flex flex-col bg-white/90 backdrop-blur-xl border border-slate-200 shadow-2xl overflow-hidden animate-slideRight ring-1 ring-slate-900/5 transition-all duration-300 ease-in-out ${isLayerListExpanded ? 'w-72 max-h-[80%] rounded-2xl' : 'w-10 h-10 rounded-xl cursor-pointer hover:bg-white items-center justify-center'}`}
                    onClick={!isLayerListExpanded ? () => setIsLayerListExpanded(true) : undefined}
                >
                    {isLayerListExpanded ? (
                        <>
                            <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                <div className="flex items-center gap-2 text-slate-800 font-black text-[13px] tracking-tight whitespace-nowrap">
                                    <Layers size={16} className="text-blue-600" />
                                    图层列表
                                </div>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); setIsLayerListExpanded(false); }}
                                    className="p-1 hover:bg-slate-200 rounded-md transition-colors"
                                    title="收起图层列表"
                                >
                                    <ChevronLeft size={16} className="text-slate-500" />
                                </button>
                            </div>
                            <div className="flex-1 overflow-y-auto custom-scrollbar p-3">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 px-2 py-2 text-slate-700 text-[12px] font-black whitespace-nowrap">
                                        <ChevronDown size={14} className="text-slate-400" />
                                        <FolderOpen size={16} className="text-blue-500" />
                                        全部图层目录
                                    </div>
                                    {previewLayers.map((layer, idx) => (
                                        <div 
                                            key={layer.id} 
                                            draggable
                                            onDragStart={(e) => handleDragStart(e, idx)}
                                            onDragOver={(e) => handleDragOver(e, idx)}
                                            onDrop={(e) => handleDrop(e, idx)}
                                            onClick={() => handleLayerClick(layer)}
                                            className={`flex items-center gap-3 px-6 py-2 text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-all cursor-pointer group whitespace-nowrap ${draggedLayerIdx === idx ? 'opacity-50' : ''}`}
                                        >
                                            <div className="p-1 rounded bg-blue-500/10 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all cursor-grab active:cursor-grabbing">
                                                <Layers size={13} />
                                            </div>
                                            <span className={`text-[12px] font-bold truncate ${!layer.isVisible ? 'opacity-50 line-through' : ''}`}>{layer.label}</span>
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setPreviewLayers(layers => layers.map(l => l.id === layer.id ? { ...l, isVisible: !l.isVisible } : l));
                                                }}
                                                className="ml-auto p-1 hover:bg-blue-100 rounded text-slate-400 hover:text-blue-600 transition-colors"
                                            >
                                                {layer.isVisible ? <Eye size={14} /> : <EyeOff size={14} />}
                                            </button>
                                        </div>
                                    ))}
                                    {previewLayers.length === 0 && (
                                        <div className="px-6 py-4 text-xs text-slate-400 italic whitespace-nowrap">暂无可见图层</div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <Layers size={18} className="text-slate-500 hover:text-blue-600 transition-colors" />
                    )}
                </div>

                <div className="absolute bottom-[15px] right-[15px] z-50 flex flex-col items-end gap-3 animate-slideUp">
                    <div className="flex flex-col gap-2 pointer-events-auto">
                        <PreviewToolBtn icon={isFullscreen ? <Minimize size={14} /> : <Maximize size={14} />} label={isFullscreen ? "退出全屏" : "全屏"} onClick={toggleFullscreen} />
                        <PreviewToolBtn icon={<Plus size={14} />} label="放大地图" onClick={() => setCurrentZoom(z => Math.min(22, z + 1))} />
                        <PreviewToolBtn icon={<Minus size={14} />} label="缩小地图" onClick={() => setCurrentZoom(z => Math.max(1, z - 1))} />
                    </div>
                    {/* 底图切换组件 */}
                    <MiniBaseMapSwitcher activeId={currentBaseMap} onSelect={setCurrentBaseMap} />
                </div>

                {/* C. 底部渲染：同步已拖拽的地图组件 */}
                {isTimePlayerDropped && (
                    <div className="absolute bottom-[15px] left-1/2 -translate-x-1/2 z-[100] w-full max-w-[800px] animate-slideUp">
                        <TimePlayerProvider>
                            <div className="preview-player-wrapper scale-90 origin-bottom">
                                <TimePlayer config={timePlayerConfig} onTimeChange={handleTimeChange} />
                            </div>
                        </TimePlayerProvider>
                    </div>
                )}

                {/* Summary Indicators */}
                {summaryIndicators.map(indicator => {
                    const isCollapsed = collapsedComponents.has(indicator.id);
                    return (
                        <div 
                            key={indicator.id}
                            style={{ 
                                top: indicator.position.top, 
                                right: 0,
                                transform: isCollapsed ? `translateX(100%)` : `translateX(-${indicator.position.right !== undefined ? indicator.position.right : 24}px)`,
                                width: indicator.config.width ? `${indicator.config.width}px` : undefined,
                                height: indicator.config.height ? `${indicator.config.height}px` : undefined,
                            }}
                            className={`absolute z-50 bg-white/90 backdrop-blur-md border shadow-lg rounded-xl p-4 min-w-[160px] flex flex-col justify-center animate-slideDown cursor-pointer transition-all duration-500 ease-in-out ${selectedFeatureIdForTable === indicator.id ? 'border-blue-500 ring-4 ring-blue-50 scale-105 shadow-blue-100' : 'border-slate-200 hover:border-blue-400'} ${isCollapsed ? 'pointer-events-none' : ''}`}
                            onMouseDown={(e) => {
                                if (isCollapsed) return;
                                e.stopPropagation();
                                setDraggingComponent({ type: 'indicator', id: indicator.id });
                                setLastMousePos({ x: e.clientX, y: e.clientY });
                            }}
                            onClick={() => {
                                if (isCollapsed) {
                                    toggleCollapse(indicator.id);
                                    return;
                                }
                                // 仅更新当前选中的要素，不自动唤起图表视图
                                setSelectedFeatureIdForTable(indicator.id);
                                setSelectedLayerIdForTable(null);
                            }}
                        >
                            {/* Collapse Toggle Button (Bookmark style) */}
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCollapse(indicator.id);
                                }}
                                onMouseDown={e => e.stopPropagation()}
                                className={`absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-16 bg-white/90 backdrop-blur-md border border-r-0 border-slate-200 rounded-l-xl shadow-[-4px_0_12px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center hover:text-blue-600 transition-all group pointer-events-auto`}
                                title={isCollapsed ? "展开" : "收起"}
                            >
                                {isCollapsed ? (
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="text-blue-600">
                                            <Database size={14} />
                                        </div>
                                        <ChevronLeft size={10} className="text-slate-400 animate-pulse" />
                                    </div>
                                ) : <ChevronRight size={14} />}
                                
                                {/* Hover Title when collapsed */}
                                {isCollapsed && (
                                    <div className="absolute right-8 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
                                        {indicator.config.title}
                                        <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 border-l-4 border-l-slate-800 border-y-4 border-y-transparent"></div>
                                    </div>
                                )}
                            </button>

                            <div className={`transition-all duration-500 ${isCollapsed ? 'opacity-0 pointer-events-none blur-sm' : 'opacity-100'}`}>
                                <div className="text-[11px] font-bold text-slate-500 mb-1">{indicator.config.title}</div>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-2xl font-black tracking-tight" style={{ color: indicator.config.color || '#2563eb' }}>{indicator.config.value}</span>
                                    <span className="text-xs font-bold text-slate-400">{indicator.config.unit}</span>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* Bar Chart Indicators */}
                {barChartIndicators.map(indicator => {
                    const isCollapsed = collapsedComponents.has(indicator.id);
                    const data = [
                        { name: '分类A', value: 400, sub: 240 },
                        { name: '分类B', value: 300, sub: 139 },
                        { name: '分类C', value: 200, sub: 980 },
                        { name: '分类D', value: 278, sub: 390 },
                        { name: '分类E', value: 189, sub: 480 },
                    ];
                    return (
                        <div 
                            key={indicator.id}
                            style={{ 
                                top: indicator.position.top, 
                                right: 0,
                                width: indicator.config.width || 400,
                                height: indicator.config.height || 300,
                                transform: isCollapsed ? `translateX(100%)` : `translateX(-${indicator.position.right !== undefined ? indicator.position.right : 24}px)`
                            }}
                            className={`absolute z-50 bg-white/95 backdrop-blur-md border shadow-2xl rounded-2xl p-6 animate-slideDown flex flex-col cursor-pointer transition-all duration-500 ease-in-out ${selectedFeatureIdForTable === indicator.id ? 'border-blue-500 ring-4 ring-blue-50 scale-[1.02] shadow-blue-100' : 'border-slate-200 hover:border-blue-400'} ${isCollapsed ? 'pointer-events-none' : ''}`}
                            onMouseDown={(e) => {
                                if (isCollapsed) return;
                                e.stopPropagation();
                                setDraggingComponent({ type: 'barChart', id: indicator.id });
                                setLastMousePos({ x: e.clientX, y: e.clientY });
                            }}
                            onClick={() => {
                                if (isCollapsed) {
                                    toggleCollapse(indicator.id);
                                    return;
                                }
                                // 仅更新当前选中的要素，不自动唤起图表视图
                                setSelectedFeatureIdForTable(indicator.id);
                                setSelectedLayerIdForTable(null);
                            }}
                        >
                            {/* Collapse Toggle Button (Bookmark style) */}
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    toggleCollapse(indicator.id);
                                }}
                                onMouseDown={e => e.stopPropagation()}
                                className={`absolute -left-6 top-1/2 -translate-y-1/2 w-6 h-20 bg-white/95 backdrop-blur-md border border-r-0 border-slate-200 rounded-l-xl shadow-[-4px_0_12px_rgba(0,0,0,0.05)] flex flex-col items-center justify-center hover:text-blue-600 transition-all group pointer-events-auto`}
                                title={isCollapsed ? "展开" : "收起"}
                            >
                                {isCollapsed ? (
                                    <div className="flex flex-col items-center gap-1">
                                        <div className="text-blue-600">
                                            <BarChart2 size={14} />
                                        </div>
                                        <ChevronLeft size={10} className="text-slate-400 animate-pulse" />
                                    </div>
                                ) : <ChevronRight size={14} />}

                                {/* Hover Title when collapsed */}
                                {isCollapsed && (
                                    <div className="absolute right-8 top-1/2 -translate-y-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
                                        {indicator.config.title}
                                        <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 border-l-4 border-l-slate-800 border-y-4 border-y-transparent"></div>
                                    </div>
                                )}
                            </button>

                            <div className={`flex-1 flex flex-col transition-all duration-500 ${isCollapsed ? 'opacity-0 pointer-events-none blur-sm' : 'opacity-100'}`}>
                                <div className="flex items-center justify-between mb-3 shrink-0">
                                    <div className="text-[11px] font-bold text-slate-500">{indicator.config.title}</div>
                                    {indicator.config.unit && (
                                        <span className="px-2 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-500">单位: {indicator.config.unit}</span>
                                    )}
                                </div>
                                <div className="flex-1 min-h-0">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 10 }} />
                                            <Tooltip 
                                                contentStyle={{ backgroundColor: 'white', borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                itemStyle={{ fontSize: '10px' }}
                                            />
                                            <Bar dataKey="value" fill={indicator.config.color} radius={[4, 4, 0, 0]} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    );
                })}

                {/* D. 图例面板 - 浅色 */}
                {legends.some(g => g.entries.some((e: any) => !e.isHidden)) && (
                    <div className="absolute bottom-[15px] left-[15px] z-20 flex flex-col items-start gap-3 pointer-events-none">
                        {isLegendExpanded ? (
                            <div className="max-w-[240px] max-h-[300px] overflow-y-auto custom-scrollbar bg-white/90 backdrop-blur-xl border border-slate-200 rounded-2xl shadow-2xl p-4 animate-slideUp pointer-events-auto ring-1 ring-slate-900/5">
                                <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100/50">
                                    <div className="flex items-center gap-2">
                                        <List size={14} className="text-blue-600" />
                                        <span className="text-[12px] font-black text-slate-800 uppercase tracking-wider">地图图例</span>
                                    </div>
                                    <button 
                                        onClick={() => setIsLegendExpanded(false)}
                                        className="p-1 text-slate-400 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-all"
                                    >
                                        <PanelRightClose size={14} />
                                    </button>
                                </div>
                                <div className="space-y-4">
                                    {legends.map(group => {
                                        const visibleEntries = group.entries.filter((e: any) => !e.isHidden);
                                        if (visibleEntries.length === 0) return null;
                                        return (
                                            <div key={group.layerId} className="space-y-2">
                                                <div className="text-[11px] font-bold text-slate-500 truncate">{group.layerName}</div>
                                                <div className="space-y-1.5 pl-1">
                                                    {visibleEntries.map((entry: any) => (
                                                        <div key={entry.id} className="flex items-center gap-2.5">
                                                            <div className="w-3.5 h-3.5 shadow-sm border border-white rounded-md" style={{ backgroundColor: entry.style.color }}></div>
                                                            <span className="text-[11px] font-medium text-slate-600 truncate">{entry.label}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
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
                )}

                {/* E. 地图渲染画布 - 使用 GoogleMapLayer */}
                <div className="flex-1 flex flex-col overflow-hidden relative">
                    <div className={`flex-1 grid w-full h-full gap-0.5 p-0.5 bg-slate-300 transition-all duration-500 ${currentSplitMode === '1' ? 'grid-cols-1' : currentSplitMode === '2' ? 'grid-cols-2' : currentSplitMode === '4' ? 'grid-cols-2 grid-rows-2' : 'grid-cols-4 grid-rows-4'}`}>
                        {Array.from({ length: Math.max(1, parseInt(currentSplitMode, 10) || 1) }).map((_, i) => (
                            <div key={i} className="bg-slate-100 relative overflow-hidden">
                                <GoogleMapLayer 
                                    type={currentBaseMap}
                                    zoom={currentZoom}
                                    center={currentCenter}
                                    dimension={currentDimension}
                                />
                                <div className="absolute inset-0 pointer-events-none">
                                    {[...previewLayers].reverse().map(layer => {
                                        if (!layer.isVisible) return null;
                                        
                                        if (layer.id === 'lyr-1') {
                                            if (isLyr1Generated) {
                                                return <div key={layer.id} className="absolute inset-0 flex items-center justify-center pointer-events-none"><WuhanVectorMap /></div>;
                                            }
                                            return (
                                                <div key={layer.id} className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <div className="w-[400px] h-[300px] bg-emerald-500/30 border-2 border-emerald-600 rounded-[40px] rotate-12 flex items-center justify-center">
                                                        <span className="text-emerald-800 text-xs font-bold bg-white/80 px-2 py-1 rounded-full">林地分类区域</span>
                                                    </div>
                                                    <div className="absolute w-[200px] h-[150px] bg-amber-500/30 border-2 border-amber-600 rounded-[20px] -translate-x-40 translate-y-20 -rotate-6 flex items-center justify-center">
                                                        <span className="text-amber-800 text-xs font-bold bg-white/80 px-2 py-1 rounded-full">耕地分类区域</span>
                                                    </div>
                                                    <div className="absolute w-[150px] h-[100px] bg-slate-500/30 border-2 border-slate-600 rounded-[10px] translate-x-32 -translate-y-20 rotate-12 flex items-center justify-center">
                                                        <span className="text-slate-800 text-xs font-bold bg-white/80 px-2 py-1 rounded-full">建筑用地</span>
                                                    </div>
                                                </div>
                                            );
                                        }
                                        if (layer.id === 'lyr-2') {
                                            return (
                                                <div key={layer.id} className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                    <svg className="w-full h-full opacity-70" viewBox="0 0 800 600">
                                                        <path d="M 100 300 Q 250 150 400 300 T 700 300" stroke="#3b82f6" strokeWidth="8" fill="none" strokeLinecap="round" className="animate-pulse" />
                                                        <path d="M 300 100 Q 450 250 300 400 T 300 700" stroke="#60a5fa" strokeWidth="4" fill="none" strokeLinecap="round" />
                                                        <circle cx="400" cy="300" r="10" fill="#2563eb" />
                                                        <text x="420" y="305" fill="#1e40af" fontSize="12" fontWeight="bold">长江干流</text>
                                                    </svg>
                                                </div>
                                            );
                                        }
                                        return (
                                            <div key={layer.id} className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                <div className="px-4 py-2 bg-blue-500/20 border border-blue-500 rounded-lg text-blue-700 font-bold backdrop-blur-sm">
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
                                                // 仅更新当前选中的标绘要素，不自动唤起图表视图
                                                setSelectedFeatureIdForTable(feat.id);
                                                setSelectedLayerIdForTable(null);
                                            }}
                                        >
                                            {feat.type === 'point' && <div className={`w-4 h-4 bg-red-500 rounded-full border-2 border-white shadow-lg animate-fadeIn ${selectedFeatureIdForTable === feat.id ? 'ring-4 ring-red-200 scale-125' : ''}`}><MapPin size={14} className="text-white -ml-0.5 -mt-0.5" /></div>}
                                            {feat.type === 'line' && <div className={`w-40 h-[2px] bg-blue-500 shadow-sm animate-fadeIn ${selectedFeatureIdForTable === feat.id ? 'h-[4px] shadow-blue-200' : ''}`} style={{ transform: `rotate(${Math.random()*360}deg)` }}></div>}
                                            {feat.type === 'circle' && <div className={`w-20 h-20 border-2 border-blue-600 bg-blue-400/20 rounded-full animate-fadeIn ${selectedFeatureIdForTable === feat.id ? 'border-4 bg-blue-400/40' : ''}`}></div>}
                                            {feat.type === 'polygon' && <div className={`w-32 h-24 border-2 border-emerald-600 bg-emerald-400/20 clip-path-polygon animate-fadeIn ${selectedFeatureIdForTable === feat.id ? 'border-4 bg-emerald-400/40' : ''}`}></div>}
                                            {feat.value && (
                                                <div className={`px-2 py-1 bg-slate-800/80 backdrop-blur-sm text-white text-[10px] font-black rounded shadow-lg animate-fadeIn border border-white/20 whitespace-nowrap ${selectedFeatureIdForTable === feat.id ? 'bg-blue-600 border-blue-400 scale-110' : ''}`}>
                                                    {feat.value}
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                                <div className="absolute top-2 left-2 px-2 py-1 bg-black/20 backdrop-blur-sm rounded text-[10px] font-black text-white uppercase tracking-widest">Viewport {i + 1}</div>
                            </div>
                        ))}
                    </div>
                    {isTableViewOpen && (
                        <div className="h-[240px] bg-white border-t border-slate-200 z-50 animate-slideUp overflow-hidden flex flex-col">
                            <TableView 
                                layerId={selectedLayerIdForTable} 
                                featureId={selectedFeatureIdForTable}
                                onClose={() => setIsTableViewOpen(false)}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* 3. 底部空间信息条 - 浅色 */}
            <div className="h-9 bg-white/80 backdrop-blur-xl border-t border-slate-200 flex items-center px-4 shadow-[0_-4px_12px_rgba(0,0,0,0.05)] flex-shrink-0 z-[1010]">
                <div className="flex-1 flex items-center divide-x divide-slate-200 h-5">
                    <div className="flex items-center gap-1.5 px-4 first:pl-0">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">层级:</span>
                        <span className="text-sm font-black text-blue-600 font-mono tracking-tight">{zoom}</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">经度:</span>
                        <span className="text-xs font-black text-emerald-600 font-mono tracking-tighter">{mapCenter.lon.toFixed(6)}°E</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">纬度:</span>
                        <span className="text-xs font-black text-emerald-600 font-mono tracking-tighter">{mapCenter.lat.toFixed(6)}°N</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">高程:</span>
                        <span className="text-xs font-black text-amber-600 font-mono tracking-tighter">24.5 m</span>
                    </div>
                    <div className="flex items-center gap-1.5 px-4">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">顶部图层:</span>
                        <span className="text-xs font-black text-slate-800 tracking-tight">{previewLayers[0]?.label || '默认底图'}</span>
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
            
            <style>{`
                .v2-preview-mode-overlay .custom-scrollbar::-webkit-scrollbar-thumb {
                    background: rgba(0, 0, 0, 0.1) !important;
                    border-radius: 10px;
                }
                .v2-preview-mode-overlay .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                    background: rgba(0, 0, 0, 0.2) !important;
                }
            `}</style>
        </div>
    );
};

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

// 预览工具按钮组件
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

const SplitMenuItem: React.FC<{ label: string; active: boolean; onClick: () => void }> = ({ label, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold transition-all ${active ? 'bg-blue-600 text-white shadow-md' : 'text-slate-600 hover:bg-slate-50'}`}
    >
        <span>{label}</span>
    </button>
);
