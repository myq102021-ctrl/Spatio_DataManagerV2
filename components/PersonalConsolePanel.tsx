
import React from 'react';
import { 
    LayoutGrid, 
    User, 
    ShieldCheck, 
    Clock, 
    Database, 
    Share2, 
    Activity, 
    ArrowUpRight, 
    FileText, 
    Bell,
    ChevronRight,
    Star,
    Monitor,
    Zap,
    History,
    Settings,
    CheckCircle2,
    XCircle
} from 'lucide-react';

export const PersonalConsolePanel: React.FC = () => {
    return (
        <div className="flex-1 flex flex-col bg-[#f0f4f8] h-full overflow-y-auto custom-scrollbar animate-fadeIn">
            {/* Header / Welcome Area */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-800 p-10 pb-24 relative overflow-hidden flex-shrink-0">
                <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:24px_24px]"></div>
                <div className="absolute -right-20 -bottom-20 w-80 h-80 bg-white/10 rounded-full blur-[80px]"></div>
                
                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="flex items-center gap-6">
                        <div className="w-20 h-20 rounded-2xl border-4 border-white/20 shadow-2xl overflow-hidden bg-blue-100 flex-shrink-0">
                            <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex flex-col text-white">
                            <div className="flex items-center gap-3 mb-1">
                                <h1 className="text-3xl font-black tracking-tight">你好，系统管理员！</h1>
                                <span className="px-2 py-0.5 bg-blue-500/30 backdrop-blur rounded text-[10px] font-bold uppercase tracking-widest border border-white/10 flex items-center gap-1">
                                    <ShieldCheck size={10} /> Pro Account
                                </span>
                            </div>
                            <p className="text-blue-100/80 font-medium text-sm">欢迎回到您的个人中心。今天有 <span className="text-yellow-400 font-bold">3</span> 项新数据入库任务需要您的关注。</p>
                        </div>
                        <div className="ml-auto flex items-center gap-4">
                            <button className="bg-white/10 hover:bg-white/20 backdrop-blur border border-white/10 p-2.5 rounded-xl text-white transition-all">
                                <Bell size={20} />
                            </button>
                            <button className="bg-white text-blue-700 px-6 py-2.5 rounded-xl font-bold text-sm shadow-xl hover:scale-105 transition-all flex items-center gap-2">
                                <Zap size={16} fill="currentColor" /> 快速新建任务
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="max-w-6xl mx-auto w-full px-10 -mt-16 pb-12 space-y-8 relative z-20">
                
                {/* Stats Summary Grid */}
                <div className="grid grid-cols-4 gap-6">
                    <StatsCard title="我的数据资产" value="128" unit="个" icon={<Database className="text-blue-600" />} trend="+4" isUp color="blue" />
                    <StatsCard title="发布的服务" value="42" unit="个" icon={<Share2 className="text-indigo-600" />} trend="+2" isUp color="indigo" />
                    <StatsCard title="空间资源占用" value="84.2" unit="GB" icon={<LayoutGrid className="text-emerald-600" />} trend="-1.2" isUp={false} color="emerald" />
                    <StatsCard title="任务成功率" value="99.2" unit="%" icon={<Activity className="text-amber-600" />} trend="0.0" color="amber" />
                </div>

                <div className="grid grid-cols-12 gap-8">
                    {/* Recent Tasks */}
                    <div className="col-span-8 flex flex-col gap-6">
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                                        <History size={20} />
                                    </div>
                                    <h3 className="text-[17px] font-bold text-slate-800">最近执行任务</h3>
                                </div>
                                <button className="text-[13px] font-bold text-blue-600 hover:underline flex items-center gap-1">
                                    全部任务 <ChevronRight size={14} />
                                </button>
                            </div>

                            <div className="space-y-3">
                                <TaskRow name="2025年度全省水利普查数据同步" type="数据集成" time="2小时前" status="success" />
                                <TaskRow name="武汉市核心商圈人流量分析报告" type="服务生成" time="5小时前" status="success" />
                                <TaskRow name="Landsat-8 遥感影像批量预处理" type="数据开发" time="昨天 14:20" status="error" />
                                <TaskRow name="行政区划矢量要素拓扑检查" type="数据治理" time="昨天 09:15" status="success" />
                            </div>
                        </div>

                        {/* Quick Favorites */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
                                    <Star size={20} />
                                </div>
                                <h3 className="text-[17px] font-bold text-slate-800">常用收藏</h3>
                            </div>
                            <div className="grid grid-cols-3 gap-4">
                                <FavoriteCard title="全国主要水系SHP" type="数据集" color="blue" />
                                <FavoriteCard title="湖北省地形渲染样式" type="样式库" color="emerald" />
                                <FavoriteCard title="RESTful 查询模板" type="脚本" color="indigo" />
                            </div>
                        </div>
                    </div>

                    {/* Right Side Cards */}
                    <div className="col-span-4 space-y-6">
                        {/* System Status */}
                        <div className="bg-[#1e293b] rounded-3xl p-8 text-white space-y-6 shadow-xl shadow-slate-900/10">
                            <div className="flex items-center gap-3">
                                <Monitor size={20} className="text-blue-400" />
                                <h3 className="text-[17px] font-bold">资源配额状态</h3>
                            </div>
                            
                            <div className="space-y-5">
                                <ResourceProgress label="存储空间" percent={64} current="320GB" total="500GB" />
                                <ResourceProgress label="计算资源 (CPU)" percent={22} current="4 Core" total="16 Core" />
                                <ResourceProgress label="API 额度" percent={88} current="8.8w" total="10w" />
                            </div>
                            
                            <div className="pt-4 border-t border-white/10">
                                <button className="w-full py-3 bg-blue-600 text-white rounded-xl font-bold text-[13px] hover:bg-blue-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-900/50">
                                    <Settings size={14} /> 申请扩容资源
                                </button>
                            </div>
                        </div>

                        {/* Announcements */}
                        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8 space-y-6">
                            <div className="flex items-center gap-3">
                                <Bell size={20} className="text-blue-600" />
                                <h3 className="text-[17px] font-bold text-slate-800">平台公告</h3>
                            </div>
                            <div className="space-y-4">
                                <AnnouncementItem title="关于Engine V2.1.2版本升级说明" date="01-10" />
                                <AnnouncementItem title="空间数据库主节点周五例行维护通知" date="01-08" />
                                <AnnouncementItem title="新增三维模型平铺处理引擎指南" date="01-05" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

// Sub-components
const StatsCard: React.FC<{ title: string; value: string; unit: string; icon: React.ReactNode; trend?: string; isUp?: boolean; color: string }> = ({ title, value, unit, icon, trend, isUp, color }) => (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 flex flex-col justify-between h-[140px] shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
        <div className="flex items-start justify-between">
            <div className={`p-3 rounded-2xl bg-${color}-50 shadow-inner`}>
                {icon}
            </div>
            {trend && (
                <div className={`flex items-center gap-1 text-[11px] font-black ${isUp ? 'text-emerald-500' : trend === '0.0' ? 'text-slate-400' : 'text-rose-500'}`}>
                    {isUp ? <ArrowUpRight size={14} /> : null}
                    {trend}
                </div>
            )}
        </div>
        <div className="mt-4">
            <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider mb-1">{title}</p>
            <div className="flex items-baseline gap-1">
                <span className="text-2xl font-black text-slate-800 tabular-nums">{value}</span>
                <span className="text-[11px] font-bold text-slate-400">{unit}</span>
            </div>
        </div>
    </div>
);

const TaskRow: React.FC<{ name: string; type: string; time: string; status: 'success' | 'error' }> = ({ name, type, time, status }) => (
    <div className="group flex items-center justify-between p-4 rounded-2xl bg-slate-50 hover:bg-blue-50/50 hover:ring-1 hover:ring-blue-100 transition-all border border-transparent">
        <div className="flex items-center gap-4">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm border ${status === 'success' ? 'bg-white text-emerald-500 border-emerald-100' : 'bg-rose-50 text-rose-500 border-rose-100'}`}>
                {status === 'success' ? <CheckCircle2 size={20} /> : <XCircle size={20} />}
            </div>
            <div className="flex flex-col">
                <span className="text-[14px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors">{name}</span>
                <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{type}</span>
                    <div className="w-1 h-1 rounded-full bg-slate-300"></div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 font-medium">
                        <Clock size={10} /> {time}
                    </div>
                </div>
            </div>
        </div>
        <button className="p-2 text-slate-300 hover:text-blue-600 hover:bg-white rounded-lg transition-all opacity-0 group-hover:opacity-100">
            <ChevronRight size={18} />
        </button>
    </div>
);

const FavoriteCard: React.FC<{ title: string; type: string; color: string }> = ({ title, type, color }) => (
    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 hover:border-blue-200 hover:bg-white transition-all cursor-pointer group shadow-sm hover:shadow-md">
        <div className="flex items-center gap-3 mb-2">
            <div className={`p-2 rounded-lg bg-${color}-50 text-${color}-600 group-hover:scale-110 transition-transform`}>
                <FileText size={16} />
            </div>
            <span className="text-[13px] font-bold text-slate-800 truncate">{title}</span>
        </div>
        <div className="flex items-center justify-between">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{type}</span>
            <ArrowUpRight size={14} className="text-slate-300 group-hover:text-blue-600" />
        </div>
    </div>
);

const ResourceProgress: React.FC<{ label: string; percent: number; current: string; total: string }> = ({ label, percent, current, total }) => (
    <div className="space-y-2">
        <div className="flex justify-between text-[12px] font-bold">
            <span className="text-slate-400">{label}</span>
            <span className="text-white">{percent}%</span>
        </div>
        <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-blue-500 rounded-full transition-all duration-1000" style={{ width: `${percent}%` }}></div>
        </div>
        <div className="flex justify-between text-[10px] font-bold text-slate-500">
            <span>已使用 {current}</span>
            <span>总量 {total}</span>
        </div>
    </div>
);

const AnnouncementItem: React.FC<{ title: string; date: string }> = ({ title, date }) => (
    <div className="flex items-center justify-between gap-4 group cursor-pointer border-b border-slate-50 pb-3 last:border-0 last:pb-0">
        <span className="text-[13px] font-medium text-slate-600 group-hover:text-blue-600 transition-colors truncate">{title}</span>
        <span className="text-[11px] font-mono text-slate-400">{date}</span>
    </div>
);
