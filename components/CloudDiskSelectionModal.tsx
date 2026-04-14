import React, { useState } from 'react';
import { 
    X, 
    ChevronRight, 
    ChevronDown, 
    Folder, 
    FileText, 
    Link, 
    HardDrive, 
    Trash2, 
    Share2, 
    Upload, 
    PlusSquare, 
    LayoutGrid, 
    HelpCircle,
    FileArchive,
    FolderPlus,
    Check
} from 'lucide-react';

interface CloudFile {
    id: string;
    name: string;
    size: string;
    type: string;
    date: string;
    iconType: 'zip' | 'folder' | 'link' | 'unknown';
    selected?: boolean;
}

const MOCK_CLOUD_FILES: CloudFile[] = [
    { id: '1', name: '湖北省行政区.zip', size: '1.05MB', type: 'zip', date: '2025-09-30 11:16:06', iconType: 'zip' },
    { id: '2', name: '行政区划.zip', size: '72.15MB', type: 'zip', date: '2025-09-30 15:50:49', iconType: 'zip' },
    { id: '3', name: '标准数据-结构-元数据-v0.1.zip', size: '6.05KB', type: 'zip', date: '2025-10-16 16:36:32', iconType: 'zip' },
    { id: '4', name: '新建文件夹.zip', size: '5.07MB', type: 'zip', date: '2025-10-28 11:57:08', iconType: 'zip' },
    { id: '5', name: 'linkDir', size: '-', type: '链接目录', date: '2025-12-12 16:16:03', iconType: 'link' },
    { id: '6', name: '测试', size: '-', type: '', date: '2025-11-05 11:02:19', iconType: 'unknown' },
    { id: '7', name: '数据', size: '-', type: '普通目录', date: '2025-09-30 15:25:22', iconType: 'folder' },
    { id: '8', name: '矢量数据', size: '-', type: '普通目录', date: '2025-11-04 09:50:31', iconType: 'folder' },
    { id: '9', name: '测试影像数据', size: '-', type: '普通目录', date: '2025-11-04 10:00:45', iconType: 'folder' },
    { id: '10', name: '测试目录', size: '-', type: '普通目录', date: '2025-11-05 11:02:40', iconType: 'folder' },
    { id: '11', name: 'xuexuan的文件夹', size: '-', type: '普通目录', date: '2025-12-12 09:28:30', iconType: 'folder' },
];

interface CloudDiskSelectionModalProps {
    onClose: () => void;
    onConfirm: (selectedFiles: CloudFile[]) => void;
}

export const CloudDiskSelectionModal: React.FC<CloudDiskSelectionModalProps> = ({ onClose, onConfirm }) => {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set(['8'])); // Default selection from image

    const toggleSelect = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-[1200px] h-[720px] border border-slate-200 flex flex-col overflow-hidden animate-zoomIn">
                {/* Header */}
                <div className="flex justify-between items-center px-6 py-4 bg-[#f8fbfd] border-b border-slate-100">
                    <h3 className="text-sm font-bold text-slate-700">从云盘选择</h3>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-white rounded-full transition-all">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 flex overflow-hidden">
                    {/* Left Sidebar Tree */}
                    <div className="w-64 border-r border-slate-100 flex flex-col p-4 overflow-y-auto custom-scrollbar">
                        <div className="flex items-center gap-2 mb-6 px-2">
                            <LayoutGrid size={16} className="text-slate-800" />
                            <span className="text-[13px] font-bold text-slate-800">时空数据入库</span>
                        </div>
                        
                        <div className="space-y-1">
                            <TreeItem label="linkDir" icon={<Link size={14} className="text-slate-400" />} />
                            <TreeItem label="数据" icon={<Folder size={14} className="text-slate-400" />} expanded>
                                <TreeItem label="新建文件夹" icon={<Folder size={14} className="text-slate-400" />} className="ml-4" />
                            </TreeItem>
                            <TreeItem label="矢量数据" icon={<Folder size={14} className="text-slate-400" />} expanded>
                                <TreeItem label="郑州范围" icon={<Link size={14} className="text-slate-400" />} className="ml-4" />
                                <TreeItem label="湖北省" icon={<Link size={14} className="text-slate-400" />} className="ml-4" />
                            </TreeItem>
                            <TreeItem label="测试影像数据" icon={<Folder size={14} className="text-slate-400" />} expanded>
                                <TreeItem label="链接目录" icon={<Folder size={14} className="text-slate-400" />} className="ml-4" />
                            </TreeItem>
                            <TreeItem label="测试目录" icon={<Folder size={14} className="text-slate-400" />} expanded>
                                <TreeItem label="daye" icon={<Link size={14} className="text-slate-400" />} className="ml-4" />
                                <TreeItem label="yehan" icon={<Folder size={14} className="text-slate-400" />} expanded className="ml-4">
                                     <TreeItem label="local" icon={<Folder size={14} className="text-slate-400" />} className="ml-4" />
                                     <TreeItem label="shp" icon={<Folder size={14} className="text-slate-400" />} className="ml-4" />
                                </TreeItem>
                            </TreeItem>
                            <TreeItem label="xuexuan的文件夹" icon={<Folder size={14} className="text-slate-400" />} expanded>
                                <TreeItem label="输入" icon={<Folder size={14} className="text-slate-400" />} className="ml-4" />
                            </TreeItem>
                        </div>

                        {/* Storage Indicator */}
                        <div className="mt-auto pt-6 px-2">
                            <div className="flex justify-between text-[10px] text-slate-400 mb-1">
                                <span>18.11G / 500G</span>
                            </div>
                            <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 w-[15%]"></div>
                            </div>
                        </div>
                    </div>

                    {/* Right Main Content */}
                    <div className="flex-1 flex flex-col bg-white">
                        {/* Action Bar */}
                        <div className="p-4 flex items-center justify-between border-b border-slate-50">
                            <div className="flex items-center gap-2">
                                <button className="px-5 py-1.5 bg-blue-600 text-white rounded text-[13px] font-bold hover:bg-blue-700 transition-all shadow-sm">
                                    删除
                                </button>
                                <span className="ml-4 text-[13px] text-blue-600 font-bold cursor-pointer hover:underline">主目录</span>
                            </div>

                            <div className="flex items-center gap-2">
                                <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-500 rounded text-xs font-medium hover:bg-slate-50 hover:text-blue-600 transition-all">
                                    <Share2 size={14} className="text-blue-500" />
                                    传输列表
                                </button>
                                <button className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 text-slate-500 rounded text-xs font-medium hover:bg-slate-50 hover:text-blue-600 transition-all">
                                    <Upload size={14} className="text-blue-500" />
                                    上传
                                </button>
                                <button className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded text-xs font-medium hover:bg-blue-700 transition-all">
                                    添加目录
                                </button>
                                <button className="p-1.5 border border-slate-200 text-slate-500 rounded hover:bg-slate-50">
                                    <LayoutGrid size={14} className="text-blue-500" />
                                </button>
                            </div>
                        </div>

                        {/* File Table */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar">
                            <table className="w-full text-left text-[13px] border-collapse">
                                <thead className="bg-[#f0f4f8] text-slate-500 font-bold sticky top-0 z-10">
                                    <tr>
                                        <th className="p-3 w-12 text-center border-r border-white">
                                            <input type="checkbox" className="rounded border-slate-300" />
                                        </th>
                                        <th className="p-3 pl-8 border-r border-white">名称</th>
                                        <th className="p-3 w-32 border-r border-white">大小</th>
                                        <th className="p-3 w-32 border-r border-white">类型</th>
                                        <th className="p-3 w-48">修改日期</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {MOCK_CLOUD_FILES.map((file) => (
                                        <tr 
                                            key={file.id} 
                                            className={`hover:bg-blue-50/30 transition-all group ${selectedIds.has(file.id) ? 'bg-blue-50/50' : ''}`}
                                            onClick={() => toggleSelect(file.id)}
                                        >
                                            <td className="p-3 text-center">
                                                <input 
                                                    type="checkbox" 
                                                    checked={selectedIds.has(file.id)}
                                                    className="rounded border-slate-300"
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        toggleSelect(file.id);
                                                    }}
                                                />
                                            </td>
                                            <td className="p-3">
                                                <div className="flex items-center gap-3">
                                                    <FileIcon type={file.iconType} />
                                                    <span className="text-slate-800 font-medium">{file.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-3 text-slate-500 tabular-nums">{file.size}</td>
                                            <td className="p-3 text-slate-500">{file.type}</td>
                                            <td className="p-3 text-slate-400 text-xs tabular-nums">{file.date}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="px-6 py-4 bg-white border-t border-slate-100 flex justify-end gap-3">
                    <button 
                        onClick={onClose}
                        className="px-6 py-1.5 border border-slate-200 text-slate-600 rounded text-[13px] font-bold hover:bg-slate-50 transition-all"
                    >
                        取消
                    </button>
                    <button 
                        onClick={() => onConfirm(MOCK_CLOUD_FILES.filter(f => selectedIds.has(f.id)))}
                        className="px-6 py-1.5 bg-blue-600 text-white rounded text-[13px] font-bold hover:bg-blue-700 transition-all shadow-sm shadow-blue-100"
                    >
                        确定
                    </button>
                </div>
            </div>
        </div>
    );
};

const TreeItem: React.FC<{ label: string; icon: React.ReactNode; expanded?: boolean; children?: React.ReactNode; className?: string }> = ({ label, icon, expanded, children, className = "" }) => (
    <div className={`space-y-1 ${className}`}>
        <div className="flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-slate-50 cursor-pointer group">
            {children ? (
                <ChevronDown size={12} className={`text-slate-300 transition-transform ${expanded ? '' : '-rotate-90'}`} />
            ) : (
                <div className="w-3" />
            )}
            {icon}
            <span className="text-[12px] text-slate-600 font-medium group-hover:text-slate-900 truncate">{label}</span>
        </div>
        {expanded && children && (
            <div className="ml-2 animate-fadeIn">
                {children}
            </div>
        )}
    </div>
);

const FileIcon: React.FC<{ type: 'zip' | 'folder' | 'link' | 'unknown' }> = ({ type }) => {
    switch (type) {
        case 'zip':
            return (
                <div className="relative">
                    <FileArchive size={20} className="text-orange-400" fill="currentColor" fillOpacity={0.1} />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-[6px] text-white font-bold mt-2">ZIP</span>
                    </div>
                </div>
            );
        case 'folder':
            return <Folder size={20} className="text-amber-400" fill="currentColor" fillOpacity={0.2} />;
        case 'link':
            return (
                <div className="bg-amber-100 p-0.5 rounded">
                     <Link size={16} className="text-amber-600" />
                </div>
            );
        default:
            return <HelpCircle size={20} className="text-slate-300" />;
    }
};
