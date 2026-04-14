import React, { useState } from 'react';
import { 
    Search, 
    Plus, 
    Trash2, 
    Eye, 
    Edit, 
    FileText, 
    RotateCw, 
    ChevronDown, 
    ChevronLeft, 
    ChevronRight,
    CheckCircle2,
    XCircle,
    Lightbulb,
    Info
} from 'lucide-react';

interface IngestionTask {
    id: string;
    name: string;
    type: string;
    status: 'success' | 'failure' | 'processing';
    progress: number;
    log: string;
    creator: string;
    createTime: string;
}

interface SpatialDataIngestionPanelProps {
    onCreateTask: () => void;
}

const MOCK_TASKS: IngestionTask[] = [
    { id: '1', name: '上传离线任务-20251229131104', type: 'Shp', status: 'success', progress: 100, log: '导入成功，数据量：107', creator: '光谷信息', createTime: '2025-12-29 13:11:04' },
    { id: '2', name: '【样本集导入】样本集数据_2025Q4', type: 'Shp', status: 'success', progress: 100, log: '导入成功，数据量：107', creator: '光谷信息', createTime: '2025-12-29 11:42:15' },
    { id: '3', name: '上传离线任务-20251229110429', type: 'Shp', status: 'failure', progress: 60, log: '数据导入失败：数据已经入库，无法重复导入...', creator: '光谷信息', createTime: '2025-12-29 11:35:04' },
    { id: '4', name: '上传离线任务-20251229111051', type: '影像', status: 'success', progress: 100, log: '导入成功', creator: '光谷信息', createTime: '2025-12-29 11:10:51' },
    { id: '5', name: 'landsat卫星数据批量入库_202501', type: '影像', status: 'success', progress: 100, log: '导入成功', creator: '光谷信息', createTime: '2025-12-29 10:58:56' },
    { id: '6', name: 'landsat卫星数据批量入库_202502', type: '影像', status: 'success', progress: 100, log: '导入成功', creator: '光谷信息', createTime: '2025-12-29 10:58:56' },
    { id: '7', name: 'landsat卫星数据批量入库_202503', type: '影像', status: 'success', progress: 100, log: '导入成功', creator: '光谷信息', createTime: '2025-12-29 10:58:56' },
    { id: '8', name: '上传离线任务-20251229105456', type: 'Shp', status: 'success', progress: 100, log: '导入成功，数据量：107', creator: '光谷信息', createTime: '2025-12-29 10:54:56' },
];

export const SpatialDataIngestionPanel: React.FC<SpatialDataIngestionPanelProps> = ({ onCreateTask }) => {
    const [activeTab, setActiveTab] = useState('all');

    return (
        <div className="flex-1 flex flex-col bg-white h-full overflow-hidden animate-fadeIn">
            {/* 1. Styled Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                    <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">时空数据入库</h2>
                    <div className="relative group ml-1">
                        <div className="p-1 hover:bg-slate-100 rounded-full cursor-help transition-colors">
                            <Lightbulb size={16} className="text-slate-300 group-hover:text-yellow-500 transition-colors" />
                        </div>
                        <div className="absolute left-0 top-full mt-2 w-[340px] bg-slate-800/95 backdrop-blur-md text-white p-4 rounded-xl shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-300 z-[100] ring-1 ring-white/10 origin-top-left">
                            <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                                <Info size={14} className="text-blue-400" />
                                <span className="text-[14px] font-bold tracking-wide">入库功能说明</span>
                            </div>
                            <div className="space-y-2.5 text-slate-300 text-[13px]">
                                <p><strong className="text-white">栅格接入：</strong>支持卫星影像、无人机航测等高分辨率栅格数据的批量导入。</p>
                                <p><strong className="text-white">矢量接入：</strong>支持 Shapefile、GeoJSON、FileGDB 等常见空间要素格式。</p>
                                <p><strong className="text-white">自动化处理：</strong>入库过程中自动提取元数据、计算投影并建立高性能空间索引。</p>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={onCreateTask} className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-[14px] font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100">
                        <Plus size={16} />
                        新建入库任务
                    </button>
                </div>
            </div>

            {/* 2. Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden p-6 bg-slate-50/50">
                <div className="flex-1 bg-white rounded-xl shadow-sm border border-slate-200/60 flex flex-col overflow-hidden">
                    {/* Filter & Action Row */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-100">
                        <div className="bg-slate-100/80 p-1 rounded-lg flex items-center h-9">
                            <TabButton label="全部" count={8} active={activeTab === 'all'} onClick={() => setActiveTab('all')} />
                            <TabButton label="进行中" count={0} active={activeTab === 'processing'} onClick={() => setActiveTab('processing')} />
                            <TabButton label="成功" count={7} active={activeTab === 'success'} onClick={() => setActiveTab('success')} />
                            <TabButton label="失败" count={1} active={activeTab === 'failure'} onClick={() => setActiveTab('failure')} />
                        </div>

                        <div className="flex items-center gap-3 h-9">
                            <div className="relative h-full">
                                <input 
                                    type="text" 
                                    placeholder="请输入任务名称搜索" 
                                    className="w-64 pl-4 pr-10 h-full bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-50 transition-all"
                                />
                                <Search className="absolute right-3 top-2.5 text-slate-300" size={14} />
                            </div>
                            <button className="flex items-center gap-1.5 px-3 h-full border border-slate-200 text-slate-500 rounded-lg text-[13px] font-medium hover:bg-slate-50 transition-all">
                                <Trash2 size={13} />
                                批量删除
                            </button>
                        </div>
                    </div>

                    {/* Table Area - Ensure no text wrapping */}
                    <div className="flex-1 overflow-auto custom-scrollbar">
                        <table className="w-full text-left text-[14px] border-collapse min-w-[1200px] table-fixed">
                            <thead className="bg-[#f8fbfd] text-slate-500 font-bold sticky top-0 z-10 border-b border-slate-100">
                                <tr>
                                    <th className="p-4 w-12 text-center whitespace-nowrap"><input type="checkbox" className="rounded border-slate-300" /></th>
                                    <th className="p-4 w-[240px] whitespace-nowrap">任务名称</th>
                                    <th className="p-4 w-[100px] whitespace-nowrap">数据类型</th>
                                    <th className="p-4 w-[100px] whitespace-nowrap text-center">任务状态</th>
                                    <th className="p-4 w-[180px] whitespace-nowrap">进度</th>
                                    <th className="p-4 whitespace-nowrap">执行日志</th>
                                    <th className="p-4 w-[120px] whitespace-nowrap">创建人</th>
                                    <th className="p-4 w-[160px] whitespace-nowrap">创建时间</th>
                                    <th className="p-4 w-[180px] text-center whitespace-nowrap">操作</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {MOCK_TASKS.map((task) => (
                                    <tr key={task.id} className="hover:bg-blue-50/20 transition-all group">
                                        <td className="p-4 text-center whitespace-nowrap"><input type="checkbox" className="rounded border-slate-300" /></td>
                                        <td className="p-4">
                                            <div className="text-slate-800 font-bold group-hover:text-blue-600 transition-colors cursor-pointer tracking-tight truncate whitespace-nowrap" title={task.name}>{task.name}</div>
                                        </td>
                                        <td className="p-4 whitespace-nowrap text-slate-600 font-medium">{task.type}</td>
                                        <td className="p-4 text-center whitespace-nowrap">
                                            <span className={`
                                                px-2.5 py-0.5 rounded text-[11px] font-bold border inline-block
                                                ${task.status === 'success' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-500 border-red-100'}
                                            `}>
                                                {task.status === 'success' ? '成功' : '失败'}
                                            </span>
                                        </td>
                                        <td className="p-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                                    <div 
                                                        className={`h-full transition-all duration-1000 ${task.status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} 
                                                        style={{ width: `${task.progress}%` }}
                                                    />
                                                </div>
                                                {task.status === 'success' ? (
                                                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                                                ) : (
                                                    <XCircle size={14} className="text-red-500 shrink-0" />
                                                )}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="text-slate-500 truncate text-[13px] whitespace-nowrap" title={task.log}>{task.log}</div>
                                        </td>
                                        <td className="p-4 whitespace-nowrap text-slate-600 font-medium">{task.creator}</td>
                                        <td className="p-4 whitespace-nowrap text-slate-400 font-mono text-xs">{task.createTime}</td>
                                        <td className="p-4 text-center whitespace-nowrap">
                                            <div className="flex items-center justify-center gap-2 text-slate-300">
                                                <button className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all" title="查看"><Eye size={17} /></button>
                                                <button className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all" title="编辑"><Edit size={16} /></button>
                                                <button className="p-1.5 hover:text-red-500 hover:bg-red-50 rounded-md transition-all" title="删除"><Trash2 size={17} /></button>
                                                <button className="p-1.5 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-all" title="查看日志"><FileText size={16} /></button>
                                                {task.status === 'failure' && (
                                                    <button className="p-1.5 hover:text-orange-500 hover:bg-orange-50 rounded-md transition-all" title="重试"><RotateCw size={16} /></button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="flex items-center justify-between p-4 bg-slate-50/40 border-t border-slate-100 flex-shrink-0">
                        <div className="text-[13px] text-slate-400 font-medium">共 8 条</div>
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-slate-200 rounded text-xs text-slate-500 cursor-pointer hover:border-blue-300 transition-all">
                                10条/页 <ChevronDown size={12} />
                            </div>
                            <div className="flex gap-1 items-center">
                                <button className="p-1 text-slate-300 hover:text-slate-600 transition-colors"><ChevronLeft size={16} /></button>
                                <button className="w-7 h-7 bg-blue-600 text-white rounded font-bold text-xs shadow-md shadow-blue-100">1</button>
                                <button className="p-1 text-slate-300 hover:text-slate-600 transition-colors"><ChevronRight size={16} /></button>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                                前往 <input type="text" className="w-8 h-7 border border-slate-200 rounded text-center outline-none focus:border-blue-400 font-bold text-blue-600" defaultValue="1" /> 页
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TabButton: React.FC<{ label: string; count: number; active: boolean; onClick: () => void }> = ({ label, count, active, onClick }) => (
    <button 
        onClick={onClick}
        className={`
            flex items-center gap-2 px-4 h-full rounded-md text-[14px] font-bold transition-all duration-300 whitespace-nowrap
            ${active 
                ? 'bg-white text-blue-600 shadow-sm ring-1 ring-black/5' 
                : 'text-slate-500 hover:text-slate-700 hover:bg-white/40'}
        `}
    >
        <span>{label}</span>
        <span className={`px-1.5 py-0 rounded-md text-[10px] ${active ? 'bg-blue-50 text-blue-600 font-black' : 'bg-slate-200 text-slate-400'}`}>
            {count}
        </span>
    </button>
);