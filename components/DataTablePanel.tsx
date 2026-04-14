
import React from 'react';
import { Search, Trash2, Eye, Database, ArrowUpCircle, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { MOCK_TABLE_DATA } from '../constants';

interface DataTablePanelProps {
  onViewDetail?: () => void;
}

export const DataTablePanel: React.FC<DataTablePanelProps> = ({ onViewDetail }) => {
  return (
    <div className="flex-1 flex flex-col bg-white h-full p-6 min-w-0">
      
      {/* Search Bar Row */}
      <div className="flex justify-between items-center mb-6 gap-4">
        <div className="relative flex-1 max-w-md group">
            <input 
                type="text" 
                placeholder="搜索数据名称、标识或业务关键词" 
                className="w-full bg-slate-50 text-[14px] py-2 pl-4 pr-10 rounded-lg border border-slate-200/60 outline-none focus:ring-4 focus:ring-blue-50/50 focus:border-blue-300 transition-all placeholder-slate-400 font-normal"
            />
            <Search className="absolute right-3 top-2.5 text-slate-400 w-4 h-4 group-focus-within:text-blue-500 transition-colors" />
        </div>
        
        <div className="flex items-center gap-3">
            <button className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 text-[14px] px-4 py-2 rounded-lg transition-all font-medium flex items-center gap-2">
                <Trash2 size={14} className="text-slate-400" />
                批量操作
            </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="flex-1 overflow-auto border border-slate-100 rounded-xl bg-white">
        <table className="w-full text-[14px] text-left border-collapse">
            <thead className="bg-slate-50/50 text-slate-500 font-medium sticky top-0 z-10">
                <tr>
                    <th className="p-4 w-12 border-b border-slate-100 text-center">
                        <input type="checkbox" className="rounded border-slate-200 text-blue-600 focus:ring-blue-500" />
                    </th>
                    <th className="p-4 border-b border-slate-100 font-bold">数据目录/名称</th>
                    <th className="p-4 border-b border-slate-100 font-bold">采集时序</th>
                    <th className="p-4 border-b border-slate-100 font-bold">库管时序</th>
                    <th className="p-4 w-[200px] border-b border-slate-100 text-center font-bold">业务操作</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
                {MOCK_TABLE_DATA.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/50 group transition-colors">
                        <td className="p-4 text-center">
                            <input type="checkbox" checked={row.isChecked} onChange={() => {}} className="rounded border-slate-200 text-blue-600 focus:ring-blue-500" />
                        </td>
                        <td className="p-4">
                            <div className="font-bold text-slate-800 leading-normal">{row.name}</div>
                            <div className="text-[11px] text-slate-400 font-mono mt-1 tracking-wider uppercase opacity-80">UUID: {row.id}</div>
                        </td>
                        <td className="p-4 text-slate-500 font-normal tabular-nums">{row.collectionTime}</td>
                        <td className="p-4 text-slate-500 font-normal tabular-nums">{row.storageTime}</td>
                        <td className="p-4 text-center">
                            <div className="flex items-center justify-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                                <IconActionButton icon={<Eye size={15} />} title="预览" onClick={onViewDetail} />
                                <IconActionButton icon={<Database size={15} />} title="元数据" />
                                <IconActionButton icon={<ArrowUpCircle size={15} />} title="分发" />
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="mt-6 flex items-center justify-between text-xs text-slate-400 border-t border-slate-50 pt-4 px-1">
        <div className="flex gap-4 items-center">
            <span className="font-medium text-slate-500">共 1,280 条记录</span>
            <span>已选中 <span className="text-blue-500 font-semibold">2</span> 条</span>
        </div>
        
        <div className="flex items-center gap-4">
            <div className="border border-slate-100 rounded-lg px-2 py-1.5 flex items-center gap-2 bg-white cursor-pointer hover:border-blue-200 transition-colors text-slate-500 font-medium">
                <span>10条/页</span>
                <ChevronDown size={12} className="text-slate-400" />
            </div>
            
            <div className="flex gap-1">
                <PaginationButton disabled><ChevronLeft size={14} /></PaginationButton>
                <PaginationButton active>1</PaginationButton>
                <PaginationButton>2</PaginationButton>
                <PaginationButton><ChevronRight size={14} /></PaginationButton>
            </div>
        </div>
      </div>
    </div>
  );
};

const IconActionButton: React.FC<{ icon: React.ReactNode; title: string; onClick?: () => void }> = ({ icon, title, onClick }) => (
    <button 
        onClick={onClick}
        title={title}
        className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
    >
        {icon}
    </button>
);

const PaginationButton: React.FC<{ children: React.ReactNode, active?: boolean, disabled?: boolean }> = ({ children, active, disabled }) => (
    <button 
        disabled={disabled}
        className={`
            w-8 h-8 flex items-center justify-center rounded-lg border text-[12px] font-medium transition-all
            ${active 
                ? 'bg-blue-600 text-white border-blue-600' 
                : 'bg-white text-slate-400 border-slate-100 hover:border-blue-200 hover:text-blue-500 hover:bg-blue-50'}
            ${disabled ? 'opacity-30 cursor-not-allowed' : ''}
        `}
    >
        {children}
    </button>
);
