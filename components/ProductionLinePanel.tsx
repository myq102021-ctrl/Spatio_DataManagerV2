import React, { useState } from 'react';
import { 
    Search, 
    Plus, 
    Trash2, 
    Eye, 
    PlusCircle, 
    ChevronDown, 
    ChevronLeft, 
    ChevronRight,
    Play,
    Database,
    Search as SearchIcon,
    Activity,
    ClipboardCheck,
    Layers,
    Square,
    Filter,
    HelpCircle,
    MoreHorizontal
} from 'lucide-react';

interface ProductionData {
    id: string;
    name: string;
    subName: string;
    version: string;
    type: string;
    time: string;
    status: 'enabled' | 'disabled' | 'error';
}

const MOCK_DATA: ProductionData[] = [
    { id: '1', name: "测试最新-xx-0106", subName: "test-xx-0106", version: "V202601061052", type: "数据治理产线", time: "2026-01-06 09:28:01", status: 'enabled' },
    { id: '2', name: "2026-01-验证产线", subName: "2026-01-test", version: "V202601040939", type: "数据治理产线", time: "2026-01-02 11:25:35", status: 'disabled' },
    { id: '3', name: "1230版本验证产线", subName: "1230-ver-check", version: "V202512310901", type: "数据处理产线", time: "2025-12-30 21:14:44", status: 'error' },
    { id: '4', name: "智慧交通流量分析", subName: "smart-traffic-001", version: "V202601051420", type: "数据采集产线", time: "2026-01-05 14:22:10", status: 'enabled' },
    { id: '5', name: "GF2-影像预处理线", subName: "gf2-pre-process", version: "V202512160012", type: "数据处理产线", time: "2025-12-16 10:15:33", status: 'enabled' },
];

export const ProductionLinePanel: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'list' | 'draft'>('list');

  return (
    <div className="flex-1 flex flex-col bg-[#f0f4f8] h-full overflow-y-auto custom-scrollbar p-6 space-y-5 animate-fadeIn font-sans">
      
      {/* 1. Page Title */}
      <div className="flex items-center gap-2">
          <div className="w-1.5 h-4 bg-blue-700 rounded-full"></div>
          <h2 className="text-[16px] font-bold text-[#1e293b] flex items-center gap-1">
            产线列表 
            <HelpCircle size={14} className="text-slate-300 cursor-help" />
          </h2>
      </div>

      {/* 2. List Card Section */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200/50 flex flex-col overflow-hidden">
        
        {/* Top Actions Row */}
        <div className="flex items-center justify-between p-4 bg-white">
            {/* Tabs */}
            <div className="flex items-center gap-8 border-b border-transparent">
                <button 
                    onClick={() => setActiveTab('list')}
                    className={`pb-1 flex items-center gap-2 text-[14px] font-bold transition-all relative ${activeTab === 'list' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    产线列表 
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeTab === 'list' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>5</span>
                    {activeTab === 'list' && <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600 rounded-full" />}
                </button>
                <button 
                    onClick={() => setActiveTab('draft')}
                    className={`pb-1 flex items-center gap-2 text-[14px] font-bold transition-all relative ${activeTab === 'draft' ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    草稿箱
                    <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeTab === 'draft' ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>2</span>
                    {activeTab === 'draft' && <div className="absolute -bottom-1 left-0 w-full h-0.5 bg-blue-600 rounded-full" />}
                </button>
            </div>

            {/* Right Buttons */}
            <div className="flex items-center gap-3">
                <div className="relative group">
                    <input 
                        type="text" 
                        placeholder="搜索产线名称..." 
                        className="w-56 pl-9 pr-4 h-9 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-400 focus:bg-white transition-all placeholder:text-slate-400 font-medium"
                    />
                    <Search className="absolute left-3 top-2.5 text-slate-300" size={14} />
                </div>
                
                <button className="flex items-center gap-1.5 px-3 h-9 border border-slate-200 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-50 transition-all">
                    <Trash2 size={14} />
                    批量删除
                </button>

                <button className="flex items-center gap-1.5 px-4 h-9 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100">
                    <Plus size={16} strokeWidth={3} />
                    新建产线
                </button>
            </div>
        </div>

        {/* Table Area */}
        <div className="w-full">
            <table className="w-full text-left text-[13px] border-collapse">
                <thead className="bg-[#f8fbfd] text-slate-500 font-bold border-b border-slate-100">
                    <tr>
                        <th className="p-4 w-12 text-center"><input type="checkbox" className="rounded border-slate-300 text-blue-600" /></th>
                        <th className="p-4 font-bold">产线名称</th>
                        <th className="p-4 font-bold">版本号</th>
                        <th className="p-4 font-bold">
                            <div className="flex items-center gap-1">产线类型 <Filter size={12} className="text-slate-300" /></div>
                        </th>
                        <th className="p-4 font-bold">创建时间</th>
                        <th className="p-4 font-bold">
                             <div className="flex items-center gap-1">状态 <Filter size={12} className="text-slate-300" /></div>
                        </th>
                        <th className="p-4 text-center font-bold">操作</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {MOCK_DATA.map((item) => (
                        <tr key={item.id} className="hover:bg-[#f8fbfd] transition-all group">
                            <td className="p-4 text-center"><input type="checkbox" className="rounded border-slate-300" /></td>
                            <td className="p-4">
                                <div className="font-bold text-blue-600 cursor-pointer hover:underline">{item.name}</div>
                                <div className="text-[11px] text-slate-400 mt-0.5 font-medium">{item.subName}</div>
                            </td>
                            <td className="p-4 text-slate-600 font-mono text-[12px]">{item.version}</td>
                            <td className="p-4 text-slate-600 font-medium">{item.type}</td>
                            <td className="p-4 text-slate-500 tabular-nums text-[12px] font-medium">{item.time}</td>
                            <td className="p-4">
                                <StatusBadge status={item.status} />
                            </td>
                            <td className="p-4 text-center">
                                <div className="flex items-center justify-center gap-3 text-slate-300 group-hover:text-slate-400 transition-colors">
                                    <Eye size={16} className="cursor-pointer hover:text-blue-500 transition-colors" />
                                    <PlusCircle size={16} className="cursor-pointer hover:text-blue-500 transition-colors" />
                                    <Trash2 size={16} className="cursor-pointer hover:text-red-500 transition-colors" />
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between p-4 bg-white border-t border-slate-100">
            <div className="text-[13px] text-slate-500">共 5 条</div>
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5 px-2.5 py-1.5 border border-slate-200 rounded text-[12px] text-slate-600 cursor-pointer hover:bg-slate-50">
                    10条/页 <ChevronDown size={14} className="text-slate-300" />
                </div>
                <div className="flex gap-1 items-center">
                    <button className="p-1.5 border border-slate-200 text-slate-300 rounded hover:bg-slate-50"><ChevronLeft size={16} /></button>
                    <button className="w-8 h-8 bg-blue-600 text-white rounded font-bold text-[13px] shadow-sm">1</button>
                    <button className="p-1.5 border border-slate-200 text-slate-300 rounded hover:bg-slate-50"><ChevronRight size={16} /></button>
                </div>
                <div className="flex items-center gap-2 text-[13px] text-slate-500">
                    前往 <input type="text" className="w-10 h-8 border border-slate-200 rounded text-center outline-none focus:border-blue-400 font-medium" defaultValue="1" /> 页
                </div>
            </div>
        </div>
      </div>

      {/* 3. Flowchart Card Section */}
      <div className="bg-white rounded-xl border border-slate-200/50 p-6 flex flex-col shadow-sm">
        <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
                <div className="w-1.5 h-4 bg-blue-700 rounded-full"></div>
                <h2 className="text-[16px] font-bold text-[#1e293b]">产线流程图</h2>
            </div>
            <div className="text-[12px] flex items-center gap-2">
                <span className="text-slate-400">当前查看</span>
                <span className="text-blue-600 font-bold">测试最新-xx-0106</span>
            </div>
        </div>
        
        <div className="flex items-center justify-center py-10 relative">
            <div className="absolute top-[40%] left-[10%] right-[10%] h-[1px] bg-slate-100 z-0"></div>
            
            <div className="flex items-center gap-0 z-10">
                <FlowStep icon={<Play fill="currentColor" />} label="开始" />
                <Connector />
                <FlowStep icon={<Database />} label="数据接入" />
                <Connector />
                <FlowStep icon={<SearchIcon />} label="数据探查" />
                <Connector />
                <FlowStep icon={<Activity />} label="数据清洗" />
                <Connector />
                <FlowStep icon={<ClipboardCheck />} label="质量核查" />
                <Connector />
                <FlowStep icon={<Layers />} label="入库归档" />
                <Connector />
                <FlowStep icon={<Square fill="currentColor" />} label="结束" />
            </div>
        </div>
      </div>

    </div>
  );
};

// --- Sub-components ---

const StatusBadge: React.FC<{ status: 'enabled' | 'disabled' | 'error' }> = ({ status }) => {
    const config = {
        enabled: { label: '启用', color: 'text-emerald-500', bg: 'bg-emerald-500' },
        disabled: { label: '停用', color: 'text-amber-500', bg: 'bg-amber-500' },
        error: { label: '不可用', color: 'text-rose-500', bg: 'bg-rose-500' },
    };
    const { label, color, bg } = config[status];
    return (
        <div className={`flex items-center gap-2 ${color} font-bold text-[12px]`}>
            <div className={`w-1.5 h-1.5 rounded-full ${bg}`}></div>
            {label}
        </div>
    );
};

const FlowStep: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
    <div className="flex flex-col items-center gap-3">
        <div className="w-[50px] h-[50px] bg-white border border-slate-100 rounded-xl flex items-center justify-center shadow-sm text-blue-600 hover:scale-105 transition-transform cursor-default group">
            {React.cloneElement(icon as React.ReactElement, { size: 20 })}
        </div>
        <span className="text-[12px] font-medium text-slate-500">{label}</span>
    </div>
);

const Connector: React.FC = () => (
    <div className="w-12 h-[1px] bg-slate-100 mx-2 mb-8"></div>
);
