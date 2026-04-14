
import React, { useMemo, useState, useRef, useEffect } from 'react';
import { X, ChevronDown, GripVertical, Layers, ArrowLeftRight } from 'lucide-react';
import { GoogleMapLayer, WuhanVectorMap } from '../../components/DataSmartMapPanel';

interface MapSwipePluginProps {
    visibleLayers: { id: string; label: string }[];
    onClose: () => void;
    zoom: number;
    center: { lat: number; lon: number };
    dimension: '2D' | '3D';
    baseMapType: string;
}

/**
 * 地图卷帘插件 (Independent Plugin)
 * 强命名空间隔离：.v2-map-swipe-*
 */
export const MapSwipePlugin: React.FC<MapSwipePluginProps> = ({ visibleLayers, onClose, zoom, center, dimension, baseMapType }) => {
    const [sliderPos, setSliderPos] = useState(50); // 0-100
    const options = useMemo(() => [{ id: '__base__', label: '默认底图' }, ...visibleLayers], [visibleLayers]);
    const [leftLayerId, setLeftLayerId] = useState<string>(visibleLayers[0]?.id || '__base__');
    const [rightLayerId, setRightLayerId] = useState<string>(visibleLayers[1]?.id || visibleLayers[0]?.id || '__base__');
    const [isDragging, setIsDragging] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);
    const leftLabel = options.find(o => o.id === leftLayerId)?.label || '默认底图';
    const rightLabel = options.find(o => o.id === rightLayerId)?.label || '默认底图';

    const renderOverlay = (layerId: string) => {
        if (layerId === '__base__') return null;
        if (layerId === 'lyr-1') {
            return <div className="absolute inset-0 flex items-center justify-center pointer-events-none"><WuhanVectorMap /></div>;
        }
        if (layerId === 'lyr-2') {
            return (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <svg className="w-full h-full opacity-70" viewBox="0 0 800 600">
                        <path d="M 100 300 Q 250 150 400 300 T 700 300" stroke="#3b82f6" strokeWidth="8" fill="none" strokeLinecap="round" className="animate-pulse" />
                        <path d="M 300 100 Q 450 250 300 400 T 300 700" stroke="#60a5fa" strokeWidth="4" fill="none" strokeLinecap="round" />
                        <circle cx="400" cy="300" r="10" fill="#2563eb" />
                        <text x="420" y="305" fill="#1e40af" fontSize="12" fontWeight="bold">长江干流</text>
                    </svg>
                </div>
            );
        }
        const label = options.find(o => o.id === layerId)?.label || layerId;
        return (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="px-4 py-2 bg-blue-500/20 border border-blue-500 rounded-lg text-blue-700 font-bold backdrop-blur-sm">
                    {label}
                </div>
            </div>
        );
    };

    const handleMouseMove = (e: MouseEvent) => {
        if (!isDragging || !containerRef.current) return;
        const rect = containerRef.current.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        setSliderPos((x / rect.width) * 100);
    };

    const handleMouseUp = () => setIsDragging(false);

    useEffect(() => {
        if (isDragging) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        }
        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isDragging]);

    return (
        <div 
            ref={containerRef}
            className="v2-map-swipe-plugin absolute inset-0 z-[150] bg-slate-900 select-none overflow-hidden animate-fadeIn"
        >
            {/* 1. 背景层：右侧/基准图层 */}
            <div className="absolute inset-0 bg-[#dcdfe4]">
                <GoogleMapLayer type={baseMapType} zoom={zoom} center={center} dimension={dimension} />
                {renderOverlay(rightLayerId)}
                <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-white text-[10px] font-black uppercase tracking-widest z-10">
                    RIGHT: {rightLabel}
                </div>
            </div>

            {/* 2. 对比层：左侧图层 (使用 clip-path 裁剪) */}
            <div 
                className="absolute inset-0 bg-[#c0c4cc] border-r-2 border-blue-500/20 shadow-2xl"
                style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
            >
                <GoogleMapLayer type={baseMapType} zoom={zoom} center={center} dimension={dimension} />
                {renderOverlay(leftLayerId)}
                <div className="absolute top-4 left-4 bg-blue-600/90 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-white text-[10px] font-black uppercase tracking-widest z-10 shadow-lg">
                    LEFT: {leftLabel}
                </div>
            </div>

            {/* 3. 滑动控制柄 */}
            <div 
                className="v2-map-swipe-handle absolute top-0 bottom-0 w-1 bg-blue-500 z-20 cursor-col-resize group shadow-[0_0_15px_rgba(59,130,246,0.5)]"
                style={{ left: `${sliderPos}%` }}
                onMouseDown={() => setIsDragging(true)}
            >
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-10 h-10 bg-blue-600 rounded-full border-4 border-white shadow-2xl flex items-center justify-center text-white transition-transform group-hover:scale-110 active:scale-95 ring-4 ring-blue-500/20">
                    <GripVertical size={18} />
                </div>
                <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-8 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
            </div>

            {/* 4. 底部图层快速选择器 */}
            <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-4 animate-slideUp">
                <div className="bg-white/90 backdrop-blur-xl border border-slate-200 p-1.5 rounded-2xl shadow-2xl flex items-center gap-3 ring-1 ring-slate-900/5">
                    <SwipeSelector 
                        label="左侧图层" 
                        value={leftLayerId} 
                        options={options} 
                        onSelect={setLeftLayerId} 
                        color="text-blue-600"
                    />
                    <div className="p-2 text-slate-300">
                        <ArrowLeftRight size={14} />
                    </div>
                    <SwipeSelector 
                        label="右侧图层" 
                        value={rightLayerId} 
                        options={options} 
                        onSelect={setRightLayerId} 
                        color="text-emerald-600"
                    />
                </div>

                <button 
                    onClick={onClose}
                    className="flex items-center gap-2 px-5 py-2.5 bg-rose-600 text-white rounded-2xl text-xs font-black shadow-xl shadow-rose-900/20 hover:bg-rose-700 transition-all active:scale-95"
                >
                    退出卷帘模式 <X size={16} />
                </button>
            </div>

            {/* 水印 */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none opacity-[0.03] select-none text-[60px] font-black text-white whitespace-nowrap -rotate-12">
                SWIPE COMPARISON MODE
            </div>
        </div>
    );
};

const SwipeSelector: React.FC<{ 
    label: string; 
    value: string; 
    options: { id: string; label: string }[]; 
    onSelect: (v: string) => void; 
    color: string 
}> = ({ label, value, options, onSelect, color }) => {
    const [open, setOpen] = useState(false);
    const currentLabel = options.find(o => o.id === value)?.label || value;
    return (
        <div className="relative">
            <div 
                onClick={() => setOpen(!open)}
                className="flex flex-col px-4 py-1.5 hover:bg-slate-50 rounded-xl transition-all cursor-pointer min-w-[140px]"
            >
                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
                <div className="flex items-center justify-between gap-2">
                    <span className={`text-[12px] font-bold truncate ${color}`}>{currentLabel}</span>
                    <ChevronDown size={14} className="text-slate-300" />
                </div>
            </div>
            {open && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setOpen(false)}></div>
                    <div className="absolute bottom-full mb-3 left-0 w-56 bg-white rounded-xl shadow-2xl border border-slate-100 p-2 z-50 animate-fadeIn">
                        <div className="p-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1 flex items-center gap-1.5">
                            <Layers size={12} /> 可视对比图层
                        </div>
                        <div className="max-h-48 overflow-y-auto custom-scrollbar">
                            {options.map(opt => (
                                <div 
                                    key={opt.id}
                                    onClick={() => { onSelect(opt.id); setOpen(false); }}
                                    className={`px-3 py-2 text-[12px] font-bold rounded-lg cursor-pointer transition-all ${value === opt.id ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
                                >
                                    {opt.label}
                                </div>
                            ))}
                            {options.length === 0 && <div className="p-4 text-xs text-slate-400 italic">请先在图层面板勾选图层</div>}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};
