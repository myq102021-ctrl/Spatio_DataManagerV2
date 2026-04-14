import React, { useState } from 'react';
import { 
    Search, 
    Calendar, 
    Square, 
    Pentagon, 
    Minus, 
    Circle, 
    RotateCcw, 
    Layers, 
    Maximize2, 
    Plus, 
    Map as MapIcon,
    Ruler,
    Trash2,
    Database,
    ChevronDown,
    ChevronUp,
    Info,
    MousePointer2,
    Maximize,
    Globe
} from 'lucide-react';

export const SpatialSearchPanel: React.FC = () => {
    const [activeAreaTab, setActiveAreaTab] = useState('draw');
    const [whereSql, setWhereSql] = useState('');

    return (
        <div className="flex-1 flex h-full bg-white overflow-hidden animate-fadeIn font-sans">
            {/* 1. Left Search Criteria Sidebar */}
            <div className="w-[400px] border-r border-slate-100 flex flex-col bg-white z-20 shadow-[4px_0_15px_rgba(0,0,0,0.02)]">
                <div className="p-6 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
                    <div className="flex items-center gap-2.5 mb-2">
                        <Database size={18} className="text-slate-800" />
                        <h2 className="text-[16px] font-bold text-slate-800 tracking-tight">数据检索</h2>
                    </div>

                    {/* Section: Area Range */}
                    <div className="space-y-4">
                        <label className="text-[13px] font-bold text-slate-700">区域范围</label>
                        <div className="relative group">
                            <input 
                                type="text" 
                                placeholder="搜索位置" 
                                className="w-full h-10 pl-4 pr-10 bg-white border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all shadow-sm"
                            />
                            <Search className="absolute right-3 top-3 text-slate-300" size={16} />
                        </div>

                        {/* Sub-tabs */}
                        <div className="flex bg-slate-50 p-1 rounded-lg border border-slate-100">
                            <AreaTab label="绘制范围" active={activeAreaTab === 'draw'} onClick={() => setActiveAreaTab('draw')} />
                            <AreaTab label="行政区域" active={activeAreaTab === 'admin'} onClick={() => setActiveAreaTab('admin')} />
                            <AreaTab label="经纬度" active={activeAreaTab === 'coords'} onClick={() => setActiveAreaTab('coords')} />
                        </div>

                        {/* Drawing Tools Grid */}
                        <div className="grid grid-cols-4 gap-3">
                            <DrawTool icon={<Square size={18} />} label="矩形" />
                            <DrawTool icon={<Pentagon size={18} />} label="多边形" />
                            <DrawTool icon={<Minus size={18} className="rotate-45" />} label="绘制线" />
                            <DrawTool icon={<Circle size={18} />} label="绘制圆" />
                        </div>
                    </div>

                    {/* Section: Time Range */}
                    <div className="space-y-4">
                        <label className="text-[13px] font-bold text-slate-700">时间范围</label>
                        <div className="flex items-center gap-2 h-10 px-4 bg-white border border-slate-200 rounded-lg text-sm group hover:border-slate-300 transition-all cursor-pointer">
                            <Calendar size={16} className="text-slate-400" />
                            <input type="text" placeholder="开始日期" className="w-full bg-transparent outline-none cursor-pointer placeholder:text-slate-400" readOnly />
                            <span className="text-slate-300 mx-2">-</span>
                            <input type="text" placeholder="结束日期" className="w-full bg-transparent outline-none cursor-pointer placeholder:text-slate-400" readOnly />
                        </div>
                    </div>

                    {/* Section: Metadata Filter */}
                    <div className="space-y-4">
                        <label className="text-[13px] font-bold text-slate-700">元数据条件筛选</label>
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
                                className="w-full h-40 p-4 bg-transparent outline-none text-[13px] font-mono text-slate-600 resize-none placeholder:text-slate-400 leading-relaxed"
                            />
                            <div className="px-4 py-2 bg-white/40 border-t border-white/40 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                                <span>行数: 0  字符数: 0</span>
                                <span className="text-blue-500 font-bold">就绪</span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Buttons */}
                <div className="p-6 pt-4 border-t border-slate-100 flex gap-4 bg-white/80 backdrop-blur-md">
                    <button className="flex-1 py-2.5 border border-blue-400 text-blue-600 rounded-xl text-[14px] font-bold hover:bg-blue-50 transition-all active:scale-95 shadow-sm">
                        重置
                    </button>
                    <button className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-[14px] font-bold hover:bg-blue-700 transition-all active:scale-95 shadow-lg shadow-blue-200">
                        检索
                    </button>
                </div>
            </div>

            {/* 2. Right Map Area */}
            <div className="flex-1 relative bg-slate-900 overflow-hidden">
                {/* Simulated Map Background */}
                <img 
                    src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/World_map_blank_without_borders.svg/2560px-World_map_blank_without_borders.svg.png" 
                    alt="Map Imagery"
                    className="absolute inset-0 w-full h-full object-cover opacity-50 mix-blend-screen grayscale brightness-125"
                />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(15,23,42,0.4)_100%)] pointer-events-none"></div>

                {/* Map Overlay SVG (Borders/Labels) */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-60" viewBox="0 0 1000 600">
                    <path d="M400,100 L450,110 L480,90 L520,120 L550,115 L580,140" fill="none" stroke="#fbbf24" strokeWidth="1" strokeDasharray="4 2" />
                    <circle cx="500" cy="300" r="1.5" fill="white" />
                    <text x="510" y="305" fill="#ef4444" fontSize="12" fontWeight="bold" className="drop-shadow-md">北京</text>
                    <text x="630" y="350" fill="#ef4444" fontSize="12" fontWeight="bold" className="drop-shadow-md">东京</text>
                    <text x="450" y="100" fill="white" fontSize="14" className="opacity-40">俄罗斯</text>
                    <text x="480" y="180" fill="white" fontSize="14" className="opacity-40">蒙古</text>
                    <text x="480" y="380" fill="white" fontSize="16" className="opacity-40 font-bold">中华人民共和国</text>
                </svg>

                {/* Top Toolbar */}
                <div className="absolute top-6 left-6 z-10 flex gap-4">
                    <div className="bg-white/95 backdrop-blur-md rounded-xl border border-slate-200/60 shadow-xl flex items-center h-10 px-1 p-0.5">
                        <button className="flex items-center gap-2 pl-3 pr-2 py-1.5 text-slate-700 hover:bg-slate-50 rounded-lg text-xs font-bold transition-all border-r border-slate-100">
                            <MousePointer2 size={14} className="text-blue-600" />
                            默认 <ChevronDown size={14} className="text-slate-400" />
                        </button>
                        <div className="flex px-1 gap-1">
                            <MapToolbarBtn icon={<Ruler size={15} />} label="测量距离" />
                            <MapToolbarBtn icon={<Layers size={15} />} label="测量面积" />
                            <MapToolbarBtn icon={<Trash2 size={15} />} label="清除" />
                            <MapToolbarBtn icon={<RotateCcw size={15} />} label="复位" />
                        </div>
                    </div>
                </div>

                {/* Right Top Layer Switch */}
                <div className="absolute top-6 right-6 z-10">
                    <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-xl text-[13px] font-bold shadow-xl shadow-blue-900/30 hover:bg-blue-700 transition-all border border-white/20">
                        <Layers size={16} />
                        图层
                    </button>
                </div>

                {/* Right Bottom Controls */}
                <div className="absolute bottom-10 right-6 z-10 flex flex-col gap-3">
                    <button className="w-10 h-10 bg-white rounded-xl shadow-2xl flex items-center justify-center text-slate-800 font-bold text-sm border border-slate-200 hover:bg-slate-50">
                        2D
                    </button>
                    <div className="bg-white rounded-xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
                        <button className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-all"><Plus size={20} /></button>
                        <div className="h-px bg-slate-100 mx-2"></div>
                        <button className="w-10 h-10 flex items-center justify-center text-slate-500 hover:text-blue-600 hover:bg-slate-50 transition-all"><Minus size={20} /></button>
                    </div>
                </div>

                {/* Bottom Right Inset Map */}
                <div className="absolute bottom-8 right-20 z-10 bg-slate-900/80 backdrop-blur-md rounded-xl border border-white/10 p-1.5 shadow-2xl overflow-hidden group">
                    <div className="relative w-28 h-20 rounded-lg overflow-hidden border border-white/20">
                        <img 
                            src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/World_map_blank_without_borders.svg/640px-World_map_blank_without_borders.svg.png" 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/20"></div>
                        <div className="absolute top-1 left-1.5">
                            <span className="text-[10px] font-black text-white drop-shadow-sm uppercase tracking-tighter">已添加注记</span>
                        </div>
                        <div className="absolute bottom-1 left-1.5">
                            <span className="text-[10px] font-bold text-white/80 drop-shadow-sm">天地图影像</span>
                        </div>
                    </div>
                </div>

                {/* Scale & Coord Info (Bottom) */}
                <div className="absolute bottom-1 w-full px-6 py-2 flex items-center justify-between pointer-events-none text-slate-400 font-mono text-[11px] font-medium bg-gradient-to-t from-black/40 to-transparent">
                    <div className="flex items-center gap-4">
                        <div className="flex flex-col">
                            <div className="w-16 h-[2px] bg-slate-400 mb-0.5"></div>
                            <span>500 km</span>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <span>经度: 106.320162 纬度: 34.367539</span>
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
    <div className="flex flex-col items-center gap-1.5 group cursor-pointer">
        <div className="w-full aspect-square border border-slate-200 rounded-xl flex items-center justify-center text-slate-400 group-hover:text-blue-600 group-hover:border-blue-400 group-hover:bg-blue-50/50 transition-all shadow-sm">
            {icon}
        </div>
        <span className="text-[11px] font-bold text-slate-500 group-hover:text-slate-800">{label}</span>
    </div>
);

const MapToolbarBtn: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
    <button className="flex items-center gap-1.5 px-3 py-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50/50 rounded-lg text-[11px] font-bold transition-all" title={label}>
        {icon}
        <span>{label}</span>
    </button>
);
