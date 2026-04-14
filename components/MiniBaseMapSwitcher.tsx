import React, { useState } from 'react';
import { Check, Layers } from 'lucide-react';

export interface BaseMapOption {
    id: string;
    label: string;
    thumb: string;
}

export const BASE_MAPS: BaseMapOption[] = [
    { id: 'roadmap',        label: '地图',      thumb: 'https://www.google.com/maps/vt?lyrs=m@189&gl=cn&x=26&y=13&z=5' },
    { id: 'satellite',      label: '地球',      thumb: 'https://www.google.com/maps/vt?lyrs=s@189&gl=cn&x=26&y=13&z=5' },
    { id: 'terrain',        label: '地形',      thumb: 'https://www.google.com/maps/vt?lyrs=p@189&gl=cn&x=26&y=13&z=5' },
    { id: 'hybrid',         label: '全景',      thumb: 'https://www.google.com/maps/vt?lyrs=y@189&gl=cn&x=26&y=13&z=5' },
    { id: '3d_model',       label: '三维',      thumb: 'https://www.google.com/maps/vt?lyrs=s,h@189&gl=cn&x=26&y=13&z=5' },
    { id: 'elevation',      label: '高程',      thumb: 'https://www.google.com/maps/vt?lyrs=t@189&gl=cn&x=26&y=13&z=5' },
    { id: 'tianditu_vec',   label: '天地图',    thumb: 'https://www.google.com/maps/vt?lyrs=m@189&gl=cn&x=26&y=13&z=5' },
    { id: 'tianditu_img',   label: '天地图影像',thumb: 'https://www.google.com/maps/vt?lyrs=s@189&gl=cn&x=26&y=13&z=5' },
    { id: 'tianditu_street',label: '天地图街景',thumb: 'https://www.google.com/maps/vt?lyrs=m@189&gl=cn&x=26&y=13&z=5' },
    { id: 'baidu_vec',      label: '百度地图',  thumb: 'https://www.google.com/maps/vt?lyrs=m@189&gl=cn&x=26&y=13&z=5' },
    { id: 'baidu_img',      label: '百度影像',  thumb: 'https://www.google.com/maps/vt?lyrs=s@189&gl=cn&x=26&y=13&z=5' },
    { id: 'baidu_street',   label: '百度街景',  thumb: 'https://www.google.com/maps/vt?lyrs=m@189&gl=cn&x=26&y=13&z=5' },
];

interface MiniBaseMapSwitcherProps {
    activeId: string;
    /** ids to show; order = display order (last-used first) */
    enabledIds?: string[];
    onSelect: (id: string) => void;
}

export const MiniBaseMapSwitcher: React.FC<MiniBaseMapSwitcherProps> = ({
    activeId,
    enabledIds,
    onSelect,
}) => {
    const [isHovered, setIsHovered] = useState(false);
    const [isClicked, setIsClicked] = useState(false);

    const isExpanded = isHovered || isClicked;

    // Derive the list to display: respect the enabled order, fall back to full list
    const visibleMaps: BaseMapOption[] = React.useMemo(() => {
        if (!enabledIds || enabledIds.length === 0) return BASE_MAPS;
        return enabledIds
            .map(id => BASE_MAPS.find(m => m.id === id))
            .filter(Boolean) as BaseMapOption[];
    }, [enabledIds]);

    const activeMap = BASE_MAPS.find(m => m.id === activeId) ?? visibleMaps[0] ?? BASE_MAPS[0];

    return (
        <div
            className="relative flex items-center justify-end pointer-events-auto"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Expanded panel */}
            <div
                className={`flex gap-2 p-1.5 bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-xl shadow-2xl transition-all duration-300 origin-right mr-2 ${
                    isExpanded ? 'opacity-100 translate-x-0 scale-100' : 'opacity-0 translate-x-4 scale-90 pointer-events-none'
                }`}
            >
                {visibleMaps.map(m => (
                    <div
                        key={m.id}
                        className={`relative group cursor-pointer w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${
                            activeId === m.id
                                ? 'border-blue-500 shadow-md scale-105 z-10'
                                : 'border-transparent hover:border-blue-300'
                        }`}
                        onClick={() => {
                            onSelect(m.id);
                            setIsClicked(false);
                        }}
                    >
                        <img src={m.thumb} className="w-full h-full object-cover" alt={m.label} />
                        <div className={`absolute inset-0 bg-black/10 group-hover:bg-transparent transition-all ${activeId === m.id ? 'bg-transparent' : ''}`} />
                        <div className={`absolute bottom-0 left-0 right-0 py-0.5 text-center text-[9px] font-black text-white transition-all ${activeId === m.id ? 'bg-blue-500' : 'bg-black/40'}`}>
                            {m.label}
                        </div>
                        {activeId === m.id && (
                            <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full p-0.5 shadow-sm">
                                <Check size={8} />
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Trigger button */}
            <button
                onClick={() => setIsClicked(!isClicked)}
                className={`w-10 h-10 bg-white/90 backdrop-blur-xl border border-slate-200/60 rounded-xl shadow-xl flex items-center justify-center transition-all ring-1 ring-slate-900/5 ${
                    isExpanded ? 'text-blue-600 border-blue-200 bg-white' : 'text-slate-500 hover:text-blue-600 hover:bg-white'
                }`}
                title="切换底图"
            >
                <div className="relative w-6 h-6 rounded-md overflow-hidden border border-slate-200 shadow-sm">
                    <img src={activeMap.thumb} className="w-full h-full object-cover" alt="" />
                    <div className="absolute inset-0 bg-black/5" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Layers size={12} className="text-white drop-shadow-md" />
                    </div>
                </div>
            </button>
        </div>
    );
};
