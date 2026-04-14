
import React, { useState, useMemo } from 'react';
import { 
    Search, 
    FileText, 
    Clock, 
    CheckCircle2, 
    XCircle, 
    ChevronDown, 
    ChevronLeft, 
    ChevronRight,
    Filter,
    ExternalLink,
    MoreHorizontal,
    ShieldCheck,
    ClipboardList,
    Globe,
    Database,
    X,
    Key,
    Copy,
    Check,
    Eye,
    EyeOff,
    Link as LinkIcon,
    Server
} from 'lucide-react';
import { ApplicationRecord } from '../types';
import { APIRow } from '../constants';

interface MyApplicationsPanelProps {
    records: ApplicationRecord[];
    apiData?: APIRow[]; // Receive apiData to lookup service details
}

export const MyApplicationsPanel: React.FC<MyApplicationsPanelProps> = ({ records, apiData = [] }) => {
    const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
    const [searchText, setSearchText] = useState('');
    const [selectedRecord, setSelectedRecord] = useState<ApplicationRecord | null>(null);

    const filteredRecords = useMemo(() => {
        return records.filter(r => {
            const matchStatus = activeTab === 'all' || r.status === activeTab;
            const matchSearch = r.serviceName.toLowerCase().includes(searchText.toLowerCase()) || r.id.toLowerCase().includes(searchText.toLowerCase());
            return matchStatus && matchSearch;
        });
    }, [records, activeTab, searchText]);

    const stats = {
        all: records.length,
        pending: records.filter(r => r.status === 'pending').length,
        approved: records.filter(r => r.status === 'approved').length,
        rejected: records.filter(r => r.status === 'rejected').length,
    };

    // Helper to find the original service data
    const getServiceData = (record: ApplicationRecord) => {
        return apiData.find(api => api.name === record.serviceName || api.id === record.serviceId);
    };

    return (
        <div className="flex-1 flex flex-col bg-[#f8fafc] h-full overflow-hidden animate-fadeIn relative">
            {/* Header Area */}
            <div className="bg-white border-b border-slate-200 px-8 py-6 flex-shrink-0">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-100">
                            <ClipboardList size={20} />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-800">我的申请</h2>
                            <p className="text-xs text-slate-400 font-medium">查看并管理您在服务集市中提交的所有数据服务访问申请记录。</p>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                            <input 
                                type="text" 
                                value={searchText}
                                onChange={(e) => setSearchText(e.target.value)}
                                placeholder="搜索申请编号或服务名称..." 
                                className="w-72 h-9 pl-9 pr-4 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:bg-white focus:ring-4 focus:ring-blue-50 focus:border-blue-300 transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <TabItem label="全部" count={stats.all} active={activeTab === 'all'} onClick={() => setActiveTab('all')} />
                    <TabItem label="待审核" count={stats.pending} active={activeTab === 'pending'} color="blue" onClick={() => setActiveTab('pending')} />
                    <TabItem label="已通过" count={stats.approved} active={activeTab === 'approved'} color="green" onClick={() => setActiveTab('approved')} />
                    <TabItem label="已驳回" count={stats.rejected} active={activeTab === 'rejected'} color="red" onClick={() => setActiveTab('rejected')} />
                </div>
            </div>

            {/* List Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                {filteredRecords.length > 0 ? (
                    <div className="max-w-6xl mx-auto space-y-4">
                        {filteredRecords.map((record) => (
                            <RecordCard 
                                key={record.id} 
                                record={record} 
                                onClickDetail={() => setSelectedRecord(record)}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 opacity-40">
                        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                            <FileText size={40} className="text-slate-300" />
                        </div>
                        <p className="text-slate-500 font-bold">暂无相关申请记录</p>
                    </div>
                )}
            </div>

            {/* Pagination Footer */}
            <div className="px-8 py-4 bg-white border-t border-slate-100 flex items-center justify-between text-sm text-slate-500">
                <div>共 <span className="font-bold text-slate-800">{filteredRecords.length}</span> 条申请</div>
                <div className="flex items-center gap-2">
                    <button className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"><ChevronLeft size={18} /></button>
                    <button className="w-8 h-8 bg-blue-600 text-white rounded-lg font-bold shadow-sm">1</button>
                    <button className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"><ChevronRight size={18} /></button>
                </div>
            </div>

            {/* Detail Drawer */}
            {selectedRecord && (
                <DetailDrawer 
                    record={selectedRecord} 
                    serviceData={getServiceData(selectedRecord)}
                    onClose={() => setSelectedRecord(null)} 
                />
            )}
        </div>
    );
};

const DetailDrawer: React.FC<{ record: ApplicationRecord; serviceData?: APIRow; onClose: () => void }> = ({ record, serviceData, onClose }) => {
    const isApproved = record.status === 'approved';
    const [copiedKey, setCopiedKey] = useState<string | null>(null);

    const handleCopy = (text: string, key: string) => {
        navigator.clipboard.writeText(text);
        setCopiedKey(key);
        setTimeout(() => setCopiedKey(null), 2000);
    };

    // Generate service endpoints based on record/service data
    const getEndpoints = () => {
        const baseUrl = "https://api.spatial-cloud.com";
        const endpoints = [];
        
        if (record.category === '时空数据服务') {
            // Spatial endpoints often have multiple standards
            endpoints.push({ label: 'WMTS (Web Map Tile Service)', url: `${baseUrl}/wmts/${record.serviceName}/1.0.0/WMTSCapabilities.xml?key=${record.appKey}` });
            endpoints.push({ label: 'WMS (Web Map Service)', url: `${baseUrl}/wms/${record.serviceName}?request=GetCapabilities&key=${record.appKey}` });
            endpoints.push({ label: 'WFS (Web Feature Service)', url: `${baseUrl}/wfs/${record.serviceName}?request=GetCapabilities&key=${record.appKey}` });
        } else {
            // Business API
            endpoints.push({ label: 'RESTful API Endpoint', url: `${baseUrl}/v1/data/${record.serviceName}/query?key=${record.appKey}` });
        }
        return endpoints;
    };

    return (
        <>
            <div className="absolute inset-0 bg-slate-900/20 backdrop-blur-[1px] z-40 transition-opacity" onClick={onClose}></div>
            <div className="absolute top-0 right-0 h-full w-[600px] bg-white shadow-2xl z-50 flex flex-col animate-slideLeft border-l border-slate-200">
                {/* Drawer Header */}
                <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between bg-white">
                    <h3 className="text-lg font-bold text-slate-800">申请详情</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-8 bg-[#f8fafc]">
                    
                    {/* 1. Basic Info & Status */}
                    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                        <div className="flex items-center gap-4 mb-6">
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm ${record.category === '时空数据服务' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                {record.category === '时空数据服务' ? <Globe size={28} /> : <Database size={28} />}
                            </div>
                            <div>
                                <h4 className="text-lg font-black text-slate-800 leading-tight mb-1">{record.serviceName}</h4>
                                <div className="flex items-center gap-2">
                                    <StatusBadge status={record.status} />
                                    <span className="text-xs text-slate-400">ID: {record.id}</span>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-y-4 gap-x-8 text-sm">
                            <InfoRow label="申请服务类型" value={record.category} />
                            <InfoRow label="申请访问时长" value={record.duration} />
                            <InfoRow label="提交申请时间" value={record.applyTime} />
                            <InfoRow label="申请人/单位" value={record.applicant || '-'} />
                        </div>
                    </div>

                    {/* 2. Audit Opinion */}
                    {(record.auditOpinion || record.status !== 'pending') && (
                        <div className={`rounded-xl border p-5 ${record.status === 'approved' ? 'bg-green-50/50 border-green-100' : record.status === 'rejected' ? 'bg-red-50/50 border-red-100' : 'bg-slate-50 border-slate-100'}`}>
                            <h5 className={`text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-2 ${record.status === 'approved' ? 'text-green-700' : record.status === 'rejected' ? 'text-red-700' : 'text-slate-500'}`}>
                                <ShieldCheck size={14} /> 审核意见
                            </h5>
                            <p className="text-sm text-slate-700 font-medium leading-relaxed">
                                {record.auditOpinion || (record.status === 'pending' ? '等待管理员审核...' : '无审核意见')}
                            </p>
                        </div>
                    )}

                    {/* 3. Credentials (Only if Approved) */}
                    {isApproved && record.appKey && (
                        <div className="bg-white rounded-xl border border-blue-100 shadow-lg shadow-blue-500/5 p-6 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-50 to-transparent rounded-bl-full -mr-10 -mt-10 opacity-50 pointer-events-none"></div>
                            
                            <h5 className="text-sm font-bold text-slate-800 mb-5 flex items-center gap-2">
                                <div className="p-1 bg-blue-600 rounded text-white"><Key size={12} /></div>
                                开发者凭证 (Credentials)
                            </h5>

                            <div className="space-y-4 relative z-10">
                                {/* API KEY */}
                                <div className="space-y-1.5">
                                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">API KEY</label>
                                    <div className="flex items-center gap-2">
                                        <div className="flex-1 h-10 bg-slate-50 border border-slate-200 rounded-lg px-3 flex items-center font-mono text-sm text-slate-700 font-bold tracking-wide">
                                            {record.appKey}
                                        </div>
                                        <button 
                                            onClick={() => handleCopy(record.appKey!, 'ak')}
                                            className="h-10 w-10 flex items-center justify-center border border-slate-200 rounded-lg hover:bg-slate-50 hover:text-blue-600 transition-colors bg-white text-slate-400 shadow-sm"
                                            title="复制 API KEY"
                                        >
                                            {copiedKey === 'ak' ? <Check size={16} className="text-emerald-500" /> : <Copy size={16} />}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* 4. Service Endpoints (Only if Approved) */}
                    {isApproved && (
                        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm">
                            <h5 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2">
                                <Server size={16} className="text-blue-600" /> 服务调用地址
                            </h5>
                            <div className="space-y-3">
                                {getEndpoints().map((ep, idx) => (
                                    <div key={idx} className="group relative">
                                        <div className="flex items-center justify-between text-xs mb-1">
                                            <span className="font-bold text-slate-500">{ep.label}</span>
                                            <button 
                                                onClick={() => handleCopy(ep.url, `ep-${idx}`)}
                                                className="text-[10px] text-blue-600 hover:underline opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1"
                                            >
                                                {copiedKey === `ep-${idx}` ? <Check size={10} /> : <Copy size={10} />}
                                                {copiedKey === `ep-${idx}` ? '已复制' : '复制链接'}
                                            </button>
                                        </div>
                                        <div className="bg-slate-50 border border-slate-100 rounded-lg p-3 font-mono text-[11px] text-slate-600 break-all hover:bg-white hover:border-blue-200 transition-all cursor-text select-all">
                                            {ep.url}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
                
                {/* Footer */}
                <div className="px-8 py-4 border-t border-slate-100 bg-white flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-bold transition-all"
                    >
                        关闭
                    </button>
                </div>
            </div>
        </>
    );
};

const InfoRow: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex flex-col gap-1">
        <span className="text-xs text-slate-400 font-medium">{label}</span>
        <span className="text-slate-700 font-bold truncate" title={value}>{value}</span>
    </div>
);

const TabItem: React.FC<{ label: string; count: number; active: boolean; onClick: () => void; color?: string }> = ({ label, count, active, onClick, color = "blue" }) => (
    <button 
        onClick={onClick}
        className={`pb-3 flex items-center gap-2 text-sm font-bold transition-all relative ${active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
    >
        {label}
        <span className={`px-1.5 py-0.5 rounded text-[10px] ${active ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>{count}</span>
        {active && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full" />}
    </button>
);

const RecordCard: React.FC<{ record: ApplicationRecord; onClickDetail: () => void }> = ({ record, onClickDetail }) => {
    const statusConfig = {
        pending: { label: '待审核', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100', icon: <Clock size={14} /> },
        approved: { label: '已通过', bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100', icon: <CheckCircle2 size={14} /> },
        rejected: { label: '已驳回', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100', icon: <XCircle size={14} /> },
    };
    const config = statusConfig[record.status];

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-all group flex items-center gap-6">
            {/* Type Icon */}
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-inner ${record.category === '时空数据服务' ? 'bg-blue-50 text-blue-600' : 'bg-indigo-50 text-indigo-600'}`}>
                {record.category === '时空数据服务' ? <Globe size={28} /> : <Database size={28} />}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-1">
                    <span className="text-[10px] font-mono font-bold text-slate-400 tracking-wider uppercase">NO.{record.id}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border flex items-center gap-1 ${config.bg} ${config.text} ${config.border}`}>
                        {config.icon} {config.label}
                    </span>
                </div>
                <h3 className="text-base font-black text-slate-800 truncate mb-1 group-hover:text-blue-600 transition-colors cursor-pointer" onClick={onClickDetail}>
                    {record.serviceName}
                </h3>
                <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
                    <span className="flex items-center gap-1"><ShieldCheck size={12} className="text-blue-400" /> {record.category}</span>
                    <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                    <span>申请时长: <span className="text-slate-600 font-bold">{record.duration}</span></span>
                    <div className="w-1 h-1 rounded-full bg-slate-200"></div>
                    <span>提交于: {record.applyTime}</span>
                </div>
            </div>

            {/* Protocols */}
            <div className="hidden lg:flex flex-col items-end gap-1.5 min-w-[120px]">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">访问协议</span>
                <div className="flex flex-wrap gap-1 justify-end">
                    {record.protocols.map(p => (
                        <span key={p} className="px-1.5 py-0.5 bg-slate-50 border border-slate-200 rounded text-[9px] font-black text-slate-500 uppercase">{p}</span>
                    ))}
                </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pl-6 border-l border-slate-100">
                <button 
                    onClick={onClickDetail}
                    className="px-4 py-2 bg-slate-50 hover:bg-white border border-slate-100 hover:border-blue-200 text-slate-600 hover:text-blue-600 rounded-xl text-xs font-bold transition-all shadow-sm"
                >
                    详情
                </button>
            </div>
        </div>
    );
};

const StatusBadge: React.FC<{ status: ApplicationRecord['status'] }> = ({ status }) => {
    const config = {
        pending: { label: '待审核', bg: 'bg-blue-50', text: 'text-blue-600', border: 'border-blue-100' },
        approved: { label: '已通过', bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-100' },
        rejected: { label: '已驳回', bg: 'bg-red-50', text: 'text-red-600', border: 'border-red-100' },
    };
    const current = config[status];
    return (
        <span className={`px-2.5 py-0.5 rounded text-[10px] font-bold border ${current.bg} ${current.text} ${current.border}`}>
            {current.label}
        </span>
    );
};
