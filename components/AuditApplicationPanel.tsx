
import React, { useState } from 'react';
import { 
    Search, 
    Eye, 
    CheckCircle2, 
    MinusCircle, 
    ChevronDown, 
    ChevronLeft, 
    ChevronRight,
    ShoppingBag,
    Database,
    X,
    User,
    Calendar,
    Clock,
    FileText,
    ShieldCheck,
    MessageSquare
} from 'lucide-react';
import { ApplicationRecord } from '../types';

interface AuditApplicationPanelProps {
    records: ApplicationRecord[];
    onAudit: (id: string, status: 'approved' | 'rejected', opinion?: string) => void;
}

export const AuditApplicationPanel: React.FC<AuditApplicationPanelProps> = ({ records, onAudit }) => {
    const [searchText, setSearchText] = useState('');
    const [selectedRecord, setSelectedRecord] = useState<ApplicationRecord | null>(null);
    const [auditOpinion, setAuditOpinion] = useState('');

    const filteredRecords = records.filter(r => 
        r.serviceName.toLowerCase().includes(searchText.toLowerCase()) || 
        r.applicant?.toLowerCase().includes(searchText.toLowerCase())
    );

    const handleOpenDrawer = (record: ApplicationRecord) => {
        setSelectedRecord(record);
        setAuditOpinion(record.auditOpinion || ''); // 如果已有审核意见，则回显
    };

    const handleCloseDrawer = () => {
        setSelectedRecord(null);
        setAuditOpinion('');
    };

    const handleSubmitAudit = (status: 'approved' | 'rejected') => {
        if (selectedRecord) {
            onAudit(selectedRecord.id, status, auditOpinion);
            handleCloseDrawer();
        }
    };

    return (
        <div className="flex-1 flex flex-col bg-white h-full animate-fadeIn overflow-hidden relative">
            {/* Header & Filter */}
            <div className="px-8 py-4 border-b border-slate-100 flex items-center justify-between bg-white flex-shrink-0">
                <div className="flex items-center gap-2">
                    <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
                    <h2 className="text-[16px] font-bold text-slate-800">数据申请审核</h2>
                </div>
                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" size={14} />
                        <input 
                            type="text" 
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            placeholder="输入数据名称、申请人搜索..." 
                            className="w-64 h-8 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-400 transition-all"
                        />
                    </div>
                </div>
            </div>

            {/* Table Area */}
            <div className="flex-1 overflow-auto custom-scrollbar">
                <table className="w-full text-left text-[13px] border-collapse">
                    <thead className="bg-[#f8fafc] text-slate-500 font-bold border-b border-slate-100 sticky top-0 z-10">
                        <tr>
                            <th className="p-4 pl-12">数据名称</th>
                            <th className="p-4">申请时间</th>
                            <th className="p-4">申请人</th>
                            <th className="p-4">申请来源</th>
                            <th className="p-4">申请状态</th>
                            <th className="p-4 pr-12">操作</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredRecords.map((record) => (
                            <tr key={record.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="p-4 pl-12 text-slate-700 font-medium max-w-[280px] truncate" title={record.serviceName}>{record.serviceName}</td>
                                <td className="p-4 text-slate-500 font-mono">{record.applyTime}</td>
                                <td className="p-4 text-slate-600 font-bold">{record.applicant || '-'}</td>
                                <td className="p-4">
                                    <div className="flex items-center gap-1.5">
                                        {record.source === '服务集市' ? <ShoppingBag size={14} className="text-blue-500" /> : <Database size={14} className="text-indigo-500" />}
                                        <span className="text-slate-600">{record.source || '未知来源'}</span>
                                    </div>
                                </td>
                                <td className="p-4">
                                    <StatusBadge status={record.status} />
                                </td>
                                <td className="p-4 pr-12">
                                    <div className="flex items-center gap-3">
                                        <button 
                                            onClick={() => handleOpenDrawer(record)}
                                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium transition-colors"
                                        >
                                            <Eye size={15} /> 查看
                                        </button>
                                        
                                        {record.status === 'pending' && (
                                            <>
                                                <div className="w-px h-3 bg-slate-200"></div>
                                                <button 
                                                    onClick={() => onAudit(record.id, 'approved', '快速通过')}
                                                    className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium transition-colors"
                                                >
                                                    <CheckCircle2 size={15} /> 通过
                                                </button>
                                                <div className="w-px h-3 bg-slate-200"></div>
                                                <button 
                                                    onClick={() => onAudit(record.id, 'rejected', '快速拒绝')}
                                                    className="flex items-center gap-1 text-red-500 hover:text-red-600 font-medium transition-colors"
                                                >
                                                    <MinusCircle size={15} /> 拒绝
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredRecords.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 opacity-30">
                        <Search size={48} className="mb-2" />
                        <p className="font-bold">暂无申请记录</p>
                    </div>
                )}
            </div>

            {/* Pagination Footer */}
            <div className="flex items-center justify-between p-4 px-8 bg-white border-t border-slate-100 text-[13px] text-slate-500">
                <div>共 <span className="font-bold text-slate-800">{filteredRecords.length}</span> 条记录</div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 px-2 py-1 border border-slate-200 rounded-lg cursor-pointer hover:bg-slate-50">
                        10条/页 <ChevronDown size={14} className="text-slate-400" />
                    </div>
                    <div className="flex gap-1">
                        <button className="p-1 hover:bg-slate-100 rounded disabled:opacity-20"><ChevronLeft size={16} /></button>
                        <button className="w-7 h-7 bg-blue-600 text-white rounded font-bold shadow-sm">1</button>
                        <button className="p-1 hover:bg-slate-100 rounded disabled:opacity-20"><ChevronRight size={16} /></button>
                    </div>
                </div>
            </div>

            {/* Drawer Detail View */}
            {selectedRecord && (
                <>
                    <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px] z-40 transition-opacity" onClick={handleCloseDrawer}></div>
                    <div className="absolute top-0 right-0 h-full w-[500px] bg-white shadow-2xl z-50 flex flex-col animate-slideLeft border-l border-slate-200">
                        {/* Drawer Header */}
                        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
                            <h3 className="text-base font-bold text-slate-800">申请详情</h3>
                            <button onClick={handleCloseDrawer} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-full transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {/* Drawer Content */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-8 bg-[#f8fafc]">
                            {/* 1. Application Info */}
                            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-50">
                                    <div className="w-1 h-4 bg-blue-600 rounded-full"></div>
                                    <h4 className="text-sm font-bold text-slate-800">申请信息</h4>
                                </div>
                                <div className="space-y-4">
                                    <InfoRow label="数据名称" value={selectedRecord.serviceName} icon={<FileText size={14} />} highlight />
                                    <div className="grid grid-cols-2 gap-4">
                                        <InfoRow label="申请来源" value={selectedRecord.source || '-'} icon={selectedRecord.source === '服务集市' ? <ShoppingBag size={14} /> : <Database size={14} />} />
                                        <InfoRow label="申请时长" value={selectedRecord.duration} icon={<Clock size={14} />} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <InfoRow label="申请人" value={selectedRecord.applicant || '-'} icon={<User size={14} />} />
                                        <InfoRow label="申请时间" value={selectedRecord.applyTime} icon={<Calendar size={14} />} />
                                    </div>
                                    <div className="flex items-center justify-between pt-2">
                                        <span className="text-[12px] text-slate-400">当前状态</span>
                                        <StatusBadge status={selectedRecord.status} />
                                    </div>
                                </div>
                            </div>

                            {/* 2. Audit Info */}
                            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex-1 flex flex-col">
                                <div className="flex items-center gap-2 mb-5 pb-3 border-b border-slate-50">
                                    <div className="w-1 h-4 bg-indigo-500 rounded-full"></div>
                                    <h4 className="text-sm font-bold text-slate-800">审核信息</h4>
                                </div>
                                <div className="space-y-3 flex-1 flex flex-col">
                                    <label className="text-[12px] font-bold text-slate-500 flex items-center gap-1.5">
                                        <MessageSquare size={14} /> 审核意见
                                    </label>
                                    {selectedRecord.status === 'pending' ? (
                                        <textarea 
                                            value={auditOpinion}
                                            onChange={(e) => setAuditOpinion(e.target.value)}
                                            placeholder="请输入审核意见（必填，例如：符合申请要求，予以通过）"
                                            className="w-full h-32 p-3 border border-slate-200 rounded-xl text-[13px] outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-50 transition-all resize-none bg-slate-50 focus:bg-white"
                                        />
                                    ) : (
                                        <div className="w-full p-4 bg-slate-50 border border-slate-100 rounded-xl text-[13px] text-slate-600 leading-relaxed min-h-[100px]">
                                            {selectedRecord.auditOpinion || '无审核意见'}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Drawer Footer Actions */}
                        <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end gap-3 flex-shrink-0">
                            {selectedRecord.status === 'pending' ? (
                                <>
                                    <button 
                                        onClick={() => handleSubmitAudit('rejected')}
                                        className="px-6 py-2 border border-red-200 text-red-600 rounded-lg text-xs font-bold hover:bg-red-50 transition-all"
                                    >
                                        拒绝申请
                                    </button>
                                    <button 
                                        onClick={() => handleSubmitAudit('approved')}
                                        className="px-8 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 shadow-lg shadow-blue-100 transition-all flex items-center gap-2"
                                    >
                                        <ShieldCheck size={14} />
                                        通过审核
                                    </button>
                                </>
                            ) : (
                                <button 
                                    onClick={handleCloseDrawer}
                                    className="px-6 py-2 bg-slate-100 text-slate-600 rounded-lg text-xs font-bold hover:bg-slate-200 transition-all"
                                >
                                    关闭
                                </button>
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const InfoRow: React.FC<{ label: string; value: string; icon?: React.ReactNode; highlight?: boolean }> = ({ label, value, icon, highlight }) => (
    <div className="flex flex-col gap-1.5">
        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1.5">
            {icon} {label}
        </span>
        <span className={`text-[13px] truncate ${highlight ? 'font-bold text-slate-800' : 'text-slate-600 font-medium'}`}>
            {value}
        </span>
    </div>
);

const StatusBadge: React.FC<{ status: ApplicationRecord['status'] }> = ({ status }) => {
    const config = {
        pending: { label: '待审核', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
        approved: { label: '已通过', bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
        rejected: { label: '已驳回', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
    };
    const current = config[status];
    return (
        <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold border ${current.bg} ${current.text} ${current.border}`}>
            {current.label}
        </span>
    );
};
