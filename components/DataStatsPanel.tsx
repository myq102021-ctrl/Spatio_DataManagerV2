import React from 'react';
import { 
    Calendar, 
    ChevronDown, 
    Database, 
    Activity, 
    Layers, 
    PieChart, 
    Map as MapIcon, 
    TrendingUp,
    CloudDownload,
    Cpu,
    Network,
    ArrowUpRight,
    ArrowDownRight
} from 'lucide-react';

export const DataStatsPanel: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col bg-slate-50/40 h-full overflow-y-auto custom-scrollbar p-6 space-y-6 animate-fadeIn">
      
      {/* Top Section: Overview & Inbound */}
      <div className="grid grid-cols-12 gap-6">
        {/* Metric Cards - 8 Columns */}
        <div className="col-span-8 grid grid-cols-4 gap-4">
            <MetricCard 
                title="数据总量" 
                value="10.64" 
                unit="GB" 
                trend="+12%"
                isUp={true}
                variant="blue" 
            />
            <MetricCard 
                title="数据源" 
                value="24" 
                unit="个" 
                variant="white"
            />
            <MetricCard 
                title="已连接资源" 
                value="18" 
                unit="个" 
                variant="white"
            />
             <MetricCard 
                title="在线服务" 
                value="142" 
                unit="个" 
                variant="white"
            />
            
            <MetricCard 
                title="本月新增" 
                value="856" 
                unit="MB" 
                variant="indigo"
                trend="+5.4%"
                isUp={true}
            />
            <MetricCard title="数据主题" value="12" unit="个" />
            <MetricCard title="数据表" value="842" unit="张" />
            <MetricCard title="数据视图" value="56" unit="个" />
        </div>

        {/* Inbound Chart - 4 Columns */}
        <ChartCard 
            title="入库统计 (按月)" 
            className="col-span-4"
            extra={<FilterSelect label="贴源层" />}
        >
            <div className="h-full flex flex-col justify-end pt-4">
                <div className="h-32 relative">
                    <MockBarChart activeIndex={11} data={[20, 35, 25, 45, 30, 60, 40, 75, 55, 90, 65, 95]} />
                </div>
                <div className="flex justify-between mt-3 text-[10px] text-slate-400 font-medium px-1">
                    <span>1月</span>
                    <span>12月</span>
                </div>
            </div>
        </ChartCard>
      </div>

      {/* Middle Section: Trend & Source Distribution */}
      <div className="grid grid-cols-12 gap-6">
        <ChartCard title="在库数据量趋势" className="col-span-8">
            <div className="h-64 mt-4 relative">
                <MockLineChart data={[10, 15, 12, 25, 20, 35, 45, 40, 60, 55, 80, 100]} />
            </div>
        </ChartCard>

        <ChartCard title="数据来源分布" className="col-span-4">
            <div className="h-64 mt-4 flex flex-col justify-between">
                <div className="flex-1 flex items-center justify-center">
                    <MockDonutChart />
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 px-2 mt-4">
                    <LegendItem label="省级平台" percent="45.2%" color="bg-blue-500" />
                    <LegendItem label="部门采集" percent="28.4%" color="bg-cyan-400" />
                    <LegendItem label="外部集成" percent="15.1%" color="bg-indigo-400" />
                    <LegendItem label="人工录入" percent="11.3%" color="bg-slate-300" />
                </div>
            </div>
        </ChartCard>
      </div>

      {/* Bottom Section: Heatmap & Frequency */}
      <div className="grid grid-cols-12 gap-6 pb-6">
        <ChartCard title="空间数据热力分布" className="col-span-8">
            <div className="h-[320px] mt-4 flex items-center justify-center relative bg-slate-900/[0.02] rounded-xl border border-slate-100 overflow-hidden">
                <MockChinaMap />
                <div className="absolute bottom-6 left-6 flex items-end gap-3 bg-white/60 backdrop-blur-md p-2 rounded-lg border border-slate-200/50">
                    <div className="flex flex-col items-center">
                        <div className="w-2.5 h-24 bg-gradient-to-t from-blue-400 via-yellow-400 to-red-500 rounded-full"></div>
                        <div className="flex flex-col justify-between h-24 text-[9px] text-slate-500 ml-7 absolute left-0 font-bold py-0.5">
                            <span>High</span>
                            <span>Low</span>
                        </div>
                    </div>
                    <div className="text-[10px] text-slate-400 font-medium leading-tight">区域覆盖<br/>热力值</div>
                </div>
            </div>
        </ChartCard>

        <ChartCard title="数据更新频次" className="col-span-4">
            <div className="h-[320px] mt-4 flex flex-col">
                <div className="flex-1 space-y-5 py-4">
                    <ProgressRow label="实时 (Real-time)" percent={65} color="bg-blue-500" />
                    <ProgressRow label="每日 (Daily)" percent={82} color="bg-cyan-400" />
                    <ProgressRow label="每周 (Weekly)" percent={45} color="bg-indigo-400" />
                    <ProgressRow label="每月 (Monthly)" percent={20} color="bg-slate-300" />
                    <ProgressRow label="静态 (Static)" percent={12} color="bg-slate-200" />
                </div>
                <div className="pt-4 border-t border-slate-50">
                    <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                        <span>全量同步中</span>
                        <span className="text-blue-500">85% Complete</span>
                    </div>
                    <div className="w-full h-1 bg-slate-100 rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-blue-500 w-[85%] animate-pulse"></div>
                    </div>
                </div>
            </div>
        </ChartCard>
      </div>

    </div>
  );
};

// --- Helper Components ---

const MetricCard: React.FC<{ title: string; value: string; unit: string; trend?: string; isUp?: boolean; variant?: 'white' | 'blue' | 'indigo' }> = ({ title, value, unit, trend, isUp, variant = 'white' }) => {
    const isSpecial = variant !== 'white';
    return (
        <div className={`
            relative rounded-xl p-4 border transition-all hover:shadow-lg hover:-translate-y-0.5 flex flex-col justify-between h-[100px]
            ${variant === 'blue' ? 'bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-100' : ''}
            ${variant === 'indigo' ? 'bg-indigo-600 border-indigo-600 text-white shadow-md shadow-indigo-100' : ''}
            ${variant === 'white' ? 'bg-white border-slate-100 text-slate-800 shadow-sm' : ''}
        `}>
            <div>
                <p className={`text-[11px] font-medium opacity-70 mb-1`}>{title}</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-xl font-semibold tracking-tight tabular-nums">{value}</span>
                    <span className="text-[10px] font-medium opacity-60">{unit}</span>
                </div>
            </div>
            
            {trend && (
                <div className={`flex items-center gap-1 text-[10px] font-bold ${isSpecial ? 'text-white/80' : isUp ? 'text-green-500' : 'text-red-500'}`}>
                    {isUp ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                    {trend}
                </div>
            )}
            
            {/* Decoration */}
            <div className={`absolute -right-1 -bottom-2 opacity-10 pointer-events-none`}>
                <Database size={56} strokeWidth={1} />
            </div>
        </div>
    );
};

const ChartCard: React.FC<{ title: string; children: React.ReactNode; className?: string; extra?: React.ReactNode }> = ({ title, children, className, extra }) => (
    <div className={`bg-white rounded-xl border border-slate-100 shadow-sm p-5 flex flex-col ${className}`}>
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
                <div className="w-0.5 h-3 bg-blue-500 rounded-full"></div>
                <h3 className="text-[13px] font-semibold text-slate-700 tracking-tight">{title}</h3>
            </div>
            {extra}
        </div>
        <div className="flex-1">{children}</div>
    </div>
);

const FilterSelect: React.FC<{ label: string }> = ({ label }) => (
    <div className="flex items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-100 rounded-md text-[10px] text-slate-500 font-bold cursor-pointer hover:bg-slate-100 transition-colors uppercase tracking-wider">
        {label}
        <ChevronDown size={12} className="text-slate-400" />
    </div>
);

const LegendItem: React.FC<{ label: string; percent: string; color: string }> = ({ label, percent, color }) => (
    <div className="flex items-center justify-between gap-2 p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-default group">
        <div className="flex items-center gap-2 min-w-0">
            <div className={`w-1.5 h-1.5 rounded-full ${color} flex-shrink-0 group-hover:scale-125 transition-transform`}></div>
            <span className="text-[11px] text-slate-500 font-medium truncate">{label}</span>
        </div>
        <span className="text-[11px] font-bold text-slate-700 tabular-nums">{percent}</span>
    </div>
);

const ProgressRow: React.FC<{ label: string; percent: number; color: string }> = ({ label, percent, color }) => (
    <div className="space-y-2">
        <div className="flex justify-between text-[11px] font-medium">
            <span className="text-slate-500">{label}</span>
            <span className="text-slate-800 font-bold tabular-nums">{percent}%</span>
        </div>
        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div 
                className={`h-full ${color} rounded-full transition-all duration-1000 ease-out`} 
                style={{ width: `${percent}%` }}
            ></div>
        </div>
    </div>
);

// --- Chart Visualizers ---

const MockBarChart: React.FC<{ activeIndex?: number; data: number[] }> = ({ activeIndex, data }) => {
    return (
        <div className="flex items-end justify-between h-full w-full gap-2">
            {data.map((val, i) => (
                <div key={i} className="flex-1 group relative">
                    <div 
                        className={`w-full rounded-t-sm transition-all duration-700 ease-out ${i === activeIndex ? 'bg-blue-500 shadow-lg shadow-blue-100' : 'bg-slate-100 group-hover:bg-slate-200'}`} 
                        style={{ height: `${val}%` }}
                    />
                    {i === activeIndex && (
                        <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-slate-800 text-white text-[9px] px-1.5 py-0.5 rounded font-bold shadow-xl animate-bounce">
                            {val}k
                        </div>
                    )}
                </div>
            ))}
        </div>
    );
};

const MockLineChart: React.FC<{ data: number[] }> = ({ data }) => (
    <div className="h-full w-full relative">
        <svg viewBox="0 0 1000 200" className="w-full h-full overflow-visible">
            {/* Horizontal Grid */}
            {[0, 50, 100, 150, 200].map(y => (
                <line key={y} x1="0" y1={y} x2="1000" y2={y} stroke="#f1f5f9" strokeWidth="1" />
            ))}
            
            {/* The Area */}
            <path 
                d={`M 0 200 ${data.map((v, i) => `L ${i * (1000 / (data.length - 1))} ${200 - v * 1.8}`).join(' ')} L 1000 200 Z`}
                fill="url(#areaGradient)"
                className="opacity-20"
            />

            {/* The Line */}
            <path 
                d={`M 0 ${200 - data[0] * 1.8} ${data.map((v, i) => `L ${i * (1000 / (data.length - 1))} ${200 - v * 1.8}`).join(' ')}`}
                fill="none" 
                stroke="#3b82f6" 
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
            
            <defs>
                <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#3b82f6" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                </linearGradient>
            </defs>

            {/* Interactive Points */}
            {data.map((v, i) => (
                <circle 
                    key={i} 
                    cx={i * (1000 / (data.length - 1))} 
                    cy={200 - v * 1.8} 
                    r="3.5" 
                    fill="#3b82f6" 
                    stroke="white" 
                    strokeWidth="1.5"
                    className="cursor-pointer hover:r-5 transition-all"
                />
            ))}
        </svg>
        <div className="flex justify-between mt-4 text-[9px] text-slate-400 font-mono font-medium tracking-widest px-1 uppercase">
            <span>2024-Q1</span>
            <span>2024-Q2</span>
            <span>2024-Q3</span>
            <span>2024-Q4</span>
            <span>Current</span>
        </div>
    </div>
);

const MockDonutChart: React.FC = () => (
    <div className="relative w-44 h-44 flex items-center justify-center">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
            <circle cx="50" cy="50" r="40" fill="none" stroke="#f1f5f9" strokeWidth="10" />
            {/* Blue Segment */}
            <circle 
                cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="10" 
                strokeDasharray="113.6 251.2" 
                className="transition-all duration-1000"
            />
            {/* Cyan Segment */}
            <circle 
                cx="50" cy="50" r="40" fill="none" stroke="#22d3ee" strokeWidth="10" 
                strokeDasharray="71.3 251.2" 
                strokeDashoffset="-113.6"
            />
            {/* Indigo Segment */}
            <circle 
                cx="50" cy="50" r="40" fill="none" stroke="#818cf8" strokeWidth="10" 
                strokeDasharray="37.9 251.2" 
                strokeDashoffset="-184.9"
            />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">Total</span>
            <span className="text-lg font-bold text-slate-800 tabular-nums tracking-tighter">10.64 GB</span>
        </div>
    </div>
);

const MockChinaMap: React.FC = () => (
    <div className="relative w-full h-full p-8 flex items-center justify-center">
        <svg viewBox="0 0 500 400" className="w-[85%] h-auto">
            {/* Main Landmass Simplified */}
            <path 
                d="M100,50 L180,45 L250,65 L320,55 L380,90 L410,140 L440,180 L420,250 L360,320 L280,370 L200,350 L120,310 L70,240 L50,150 L70,80 Z" 
                fill="#f8fafc" 
                stroke="#e2e8f0" 
                strokeWidth="1.5"
            />
            
            {/* Province Lines */}
            <path d="M180,45 L190,110 L250,130" stroke="#f1f5f9" fill="none" strokeWidth="1" />
            <path d="M320,55 L310,130 L340,160" stroke="#f1f5f9" fill="none" strokeWidth="1" />
            
            {/* Hotspots */}
            <g className="animate-pulse">
                <circle cx="340" cy="230" r="30" fill="#3b82f6" fillOpacity="0.1" />
                <circle cx="340" cy="230" r="15" fill="#3b82f6" fillOpacity="0.3" />
                <circle cx="340" cy="230" r="4" fill="#3b82f6" />
            </g>
            
            <circle cx="280" cy="190" r="20" fill="#22d3ee" fillOpacity="0.1" />
            <circle cx="280" cy="190" r="8" fill="#22d3ee" fillOpacity="0.2" />
            <circle cx="280" cy="190" r="3" fill="#22d3ee" />

            <circle cx="380" cy="140" r="18" fill="#818cf8" fillOpacity="0.1" />
            <circle cx="380" cy="140" r="3" fill="#818cf8" />
        </svg>
    </div>
);
