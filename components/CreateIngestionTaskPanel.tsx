import React, { useState, useRef, useEffect } from 'react';
import { 
    Undo2, 
    ChevronDown, 
    CloudUpload, 
    X,
    FileCode,
    Loader2,
    Settings2,
    Table as TableIcon,
    Plus,
    CheckCircle2,
    Search,
    Check,
    Database,
    HelpCircle,
    FileJson,
    Layers,
    Info,
    Tag as TagIcon,
    AlertCircle,
    ChevronLeft,
    ChevronRight,
    Trash2,
    RefreshCw
} from 'lucide-react';
import { CloudDiskSelectionModal } from './CloudDiskSelectionModal';

interface CreateIngestionTaskPanelProps {
    onBack: () => void;
    onNavigate?: (menuId: string) => void;
}

interface ParsedFile {
    id: string;
    name: string;
    extension: string;
    format: string;
    size: string;
    status: 'success' | 'parsing' | 'error';
    targetDb: string;
    targetTable: string;
    targetTableError?: string;
    targetAlias: string;
    targetAliasError?: string;
    isAutoCreate: boolean;
}

const MOCK_DATABASES = ['postgis_spatial_db', 'oracle_sde_production', 'mysql_geo_base'];
const MOCK_EXISTING_TABLES = ['t_hubei_points', 'res_water_line', 'admin_boundary_poly', 'osm_roads_main', 'henan_boundary_2024', 'zz_water_poly'];
const PRESET_TAGS = ['政务数据', '基础地理', '遥感影像', '实时监控', '社会经济', '生态环境'];

export const CreateIngestionTaskPanel: React.FC<CreateIngestionTaskPanelProps> = ({ onBack, onNavigate }) => {
    const [sourceType, setSourceType] = useState<'cloud' | 'datasource'>('cloud');
    const [isCloudModalOpen, setIsCloudModalOpen] = useState(false);
    const [selectedCloudFiles, setSelectedCloudFiles] = useState<any[]>([]);
    const [parsedFiles, setParsedFiles] = useState<ParsedFile[]>([]);
    const [isParsing, setIsParsing] = useState(false);
    
    // 批量选库状态
    const [batchDb, setBatchDb] = useState<string>(MOCK_DATABASES[0]);
    
    // 表单状态
    const [taskName, setTaskName] = useState('上传离线任务-20251229152602');
    const [taskNameError, setTaskNameError] = useState('');
    const [dataType, setDataType] = useState<string>('');
    const [metadataModel, setMetadataModel] = useState<string>('');
    const [dataTheme, setDataTheme] = useState<string>('');
    const [dataLabels, setDataLabels] = useState<string[]>([]);
    
    // 目标数据选择状态
    const [targetDb, setTargetDb] = useState<string>('');
    const [targetTable, setTargetTable] = useState<string>('');
    const [tableAlias, setTableAlias] = useState<string>('');
    const [aliasError, setAliasError] = useState<string>('');

    // 映射表格分页状态
    const [mappingPage, setMappingPage] = useState(1);
    const MAPPING_PAGE_SIZE = 5;

    const steps = [
        { id: 1, label: '数据注册与上传' },
        { id: 2, label: '数据质检规则与模板' },
        { id: 3, label: '服务注册与发布' },
    ];

    const activeStep = 1;

    const handleCloudConfirm = (files: any[]) => {
        setSelectedCloudFiles(files);
        setIsCloudModalOpen(false);
        
        if (files.length > 0) {
            setIsParsing(true);
            setParsedFiles([]); 
            setMappingPage(1);
            
            setTimeout(() => {
                const mockParsed: ParsedFile[] = [
                    { 
                        id: 'f-1', name: '河南省主要河流水系', extension: '.shp', format: 'SHP', size: '4.2MB', 
                        status: 'success', targetDb: MOCK_DATABASES[0], targetTable: 'henan_river_main', targetAlias: '河南省主要河流水系', isAutoCreate: true 
                    },
                    { 
                        id: 'f-2', name: '2024年武汉市建筑物轮廓', extension: '.geojson', format: 'JSON', size: '12.8MB', 
                        status: 'success', targetDb: MOCK_DATABASES[0], targetTable: 'wh_building_poly', targetAlias: '2024年武汉市建筑物轮廓', isAutoCreate: true 
                    },
                    { 
                        id: 'f-3', name: '全省县级行政界线', extension: '.shp', size: '2.1MB', format: 'SHP', 
                        status: 'success', targetDb: MOCK_DATABASES[1], targetTable: 'admin_boundary_poly', targetAlias: '全省县级行政界线', isAutoCreate: false 
                    },
                    { 
                        id: 'f-4', name: '重点工程监测点位', extension: '.csv', size: '56KB', format: 'CSV', 
                        status: 'success', targetDb: MOCK_DATABASES[0], targetTable: 'project_monitor_pts', targetAlias: '重点工程监测点位', isAutoCreate: true 
                    },
                    { 
                        id: 'f-5', name: '长江大堤中线要素', extension: '.gpkg', size: '8.5MB', format: 'GPKG', 
                        status: 'success', targetDb: MOCK_DATABASES[2], targetTable: 'cj_dy_line', targetAlias: '长江大堤中线要素', isAutoCreate: true 
                    }
                ];
                setParsedFiles(mockParsed);
                setIsParsing(false);
            }, 1500);
        }
    };

    const removeFile = (e: React.MouseEvent) => {
        e.stopPropagation();
        setSelectedCloudFiles([]);
        setParsedFiles([]);
    };

    const handleDeleteParsedFile = (id: string) => {
        setParsedFiles(prev => {
            const next = prev.filter(f => f.id !== id);
            const maxPage = Math.ceil(next.length / MAPPING_PAGE_SIZE);
            if (mappingPage > maxPage && maxPage > 0) {
                setMappingPage(maxPage);
            }
            return next;
        });
    };

    const updateFileInfo = (id: string, key: keyof ParsedFile, value: any) => {
        setParsedFiles(prev => prev.map(f => {
            if (f.id === id) {
                const updated = { ...f, [key]: value };
                // 目标表名称校验：英文字母、数字、下划线
                if (key === 'targetTable') {
                    updated.isAutoCreate = !MOCK_EXISTING_TABLES.includes(value);
                    const nameRegex = /^[a-zA-Z0-9_]*$/;
                    if (!nameRegex.test(value)) {
                        updated.targetTableError = '仅限英文、数字和下划线';
                    } else {
                        updated.targetTableError = undefined;
                    }
                }
                // 目标表别名校验：中文、英文、数字、下划线
                if (key === 'targetAlias') {
                    const aliasRegex = /^[\u4e00-\u9fa5a-zA-Z0-9_]*$/;
                    if (!aliasRegex.test(value)) {
                        updated.targetAliasError = '禁止特殊字符';
                    } else {
                        updated.targetAliasError = undefined;
                    }
                }
                return updated;
            }
            return f;
        }));
    };

    // 批量同步数据库逻辑
    const handleBatchSyncDb = () => {
        if (!batchDb) return;
        setParsedFiles(prev => prev.map(f => ({ ...f, targetDb: batchDb })));
    };

    // 任务名称校验 - 严格不支持特殊字符
    const handleTaskNameChange = (val: string) => {
        setTaskName(val);
        if (!val) {
            setTaskNameError('任务名称不能为空');
            return;
        }
        // 允许中文、英文、数字、下划线，显式排除其他特殊字符（如中划线、空格、标点等）
        const regex = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;
        if (!regex.test(val)) {
            setTaskNameError('任务名称不支持特殊字符，仅限中文、字母、数字和下划线');
        } else {
            setTaskNameError('');
        }
    };

    // 表别名校验：中文、英文、数字，不允许特殊字符
    const validateAlias = (val: string) => {
        if (!val) {
            setAliasError('');
            return;
        }
        const regex = /^[\u4e00-\u9fa5a-zA-Z0-9_]+$/;
        if (!regex.test(val)) {
            setAliasError('别名仅支持中文、英文、数字及下划线');
        } else {
            setAliasError('');
        }
    };

    // 计算分页
    const totalMappingPages = Math.ceil(parsedFiles.length / MAPPING_PAGE_SIZE);
    const displayedMappingFiles = parsedFiles.slice(
        (mappingPage - 1) * MAPPING_PAGE_SIZE,
        mappingPage * MAPPING_PAGE_SIZE
    );

    // 计算匹配到的 shp 文件数量
    const matchedShpCount = parsedFiles.filter(f => f.format === 'SHP').length;

    return (
        <div className="flex-1 flex flex-col bg-[#f0f4f8] h-full overflow-hidden animate-fadeIn font-sans">
            {/* Header */}
            <div className="flex items-center justify-between px-8 py-5">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-5 bg-slate-800 rounded-full"></div>
                    <h2 className="text-[17px] font-bold text-slate-800">创建时空数据入库任务</h2>
                </div>
                <button 
                    onClick={onBack}
                    className="flex items-center gap-1.5 px-5 py-1.5 bg-white border border-slate-200 text-blue-600 rounded-full text-[13px] font-medium hover:bg-blue-50 transition-all shadow-sm active:scale-95"
                >
                    <Undo2 size={16} />
                    返回
                </button>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex overflow-hidden px-8 pb-8 gap-10">
                
                {/* Left Stepper */}
                <div className="w-44 flex flex-col pt-32 items-end pr-6 flex-shrink-0">
                    <div className="flex flex-col items-center gap-0 relative">
                        {steps.map((step, index) => (
                            <div key={step.id} className="flex flex-col items-center relative">
                                <div className="flex flex-col items-center group">
                                    <div className={`
                                        w-7 h-7 rounded-full flex items-center justify-center text-[13px] font-bold transition-all z-10
                                        ${activeStep === step.id 
                                            ? 'bg-blue-600 text-white shadow-lg' 
                                            : 'bg-white border-2 border-slate-200 text-slate-400'}
                                    `}>
                                        {step.id}
                                    </div>
                                    <div className={`
                                        mt-3 mb-16 text-[13px] font-bold transition-colors whitespace-nowrap text-center w-36 leading-tight
                                        ${activeStep === step.id ? 'text-blue-600' : 'text-slate-500'}
                                    `}>
                                        {step.label}
                                    </div>
                                    {activeStep === step.id && (
                                        <div className="absolute -right-[34px] top-2 w-0 h-0 border-t-[8px] border-t-transparent border-b-[8px] border-b-transparent border-r-[10px] border-r-white/90"></div>
                                    )}
                                </div>
                                {index < steps.length - 1 && (
                                    <div className="absolute top-7 h-16 w-px border-l-2 border-dashed border-slate-300"></div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Form Card */}
                <div className="flex-1 bg-white rounded-[20px] shadow-sm border border-slate-100 overflow-y-auto custom-scrollbar p-12">
                    <div className="max-w-[1100px] mx-auto space-y-10">
                        
                        {/* Form Grid */}
                        <div className="grid grid-cols-2 gap-x-14 gap-y-7">
                            <FormItem label="任务名称" required>
                                <div className="flex flex-col gap-1.5">
                                    <div className="relative group">
                                        <input 
                                            type="text" 
                                            value={taskName}
                                            onChange={(e) => handleTaskNameChange(e.target.value)}
                                            placeholder="请输入任务名称"
                                            className={`w-full h-10 px-4 bg-white border rounded-lg text-[14px] text-slate-700 outline-none transition-all ${taskNameError ? 'border-red-500 focus:ring-4 focus:ring-red-50 shadow-[0_0_0_1px_rgba(239,68,68,0.2)]' : 'border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-50 hover:border-slate-300'}`}
                                        />
                                        {taskNameError && <AlertCircle size={14} className="absolute right-3 top-3 text-red-500 animate-in zoom-in-50" />}
                                    </div>
                                    {taskNameError && (
                                        <span className="text-[11px] text-red-500 font-bold px-1 flex items-center gap-1 animate-fadeIn">
                                            {taskNameError}
                                        </span>
                                    )}
                                </div>
                            </FormItem>

                            <FormItem label="数据分层" required>
                                <Select value="贴源层" />
                            </FormItem>

                            <FormItem label="数据类型" required>
                                <Select 
                                    value={dataType} 
                                    placeholder="请选择" 
                                    options={[
                                        { label: '矢量', sub: '支持shp, zip' },
                                        { label: '影像', sub: '支持tif, img' },
                                        { label: '三维模型', sub: '支持3DTiles' }
                                    ]}
                                    onSelect={setDataType}
                                />
                            </FormItem>

                            <FormItem label="选择数据标准模型" required>
                                <Select 
                                    value={metadataModel}
                                    placeholder="请选择数据标准，可选，若无请前往数据治理平台创建" 
                                    options={[
                                        { label: '矢量元数据标准' },
                                        { label: 'GF卫星元数据标准' },
                                        { label: 'Landsat卫星元 metadata标准' },
                                        { label: 'JL卫星元数据标准' },
                                        { label: 'SVN卫星元数据标准' },
                                        { label: '遥感专题数据标准' },
                                        { label: 'ZY卫星元数据标准' },
                                        { label: 'Sentinel卫星元数据标准' }
                                    ]}
                                    onSelect={setMetadataModel}
                                />
                            </FormItem>

                            <FormItem label="数据主题" required>
                                <Select 
                                    value={dataTheme}
                                    placeholder="请选择" 
                                    onSelect={setDataTheme}
                                />
                            </FormItem>

                            <FormItem label="数据标签" required>
                                <TagInputSelect 
                                    values={dataLabels}
                                    placeholder="请选择或输入创建新标签（仅根节点）"
                                    onChange={setDataLabels}
                                    options={PRESET_TAGS}
                                />
                            </FormItem>

                            <div className="col-span-2">
                                <div className="space-y-2.5">
                                    <label className="text-[14px] font-bold text-slate-700 flex items-center gap-2">
                                        <span className="flex items-center">
                                            <span className="text-red-500 mr-1">*</span>源数据选择
                                        </span>
                                        <div className="relative group flex items-center">
                                            <HelpCircle size={14} className="text-slate-300 cursor-help hover:text-blue-500 transition-colors" />
                                            <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-[12px] font-medium rounded-lg shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all z-[110] w-64 leading-relaxed ring-1 ring-white/10 origin-left">
                                                支持从个人/公共云盘中选择文件，或从已登记的数据源（如 PostgreSQL, MySQL 等）中直接提取数据。目前云盘模式主要支持压缩包或要素文件夹上传。
                                                <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-slate-800"></div>
                                            </div>
                                        </div>
                                    </label>
                                    <div className="flex items-center gap-10 mt-3 pl-1">
                                        <Radio 
                                            label="云盘数据" 
                                            checked={sourceType === 'cloud'} 
                                            onChange={() => setSourceType('cloud')} 
                                        />
                                        <Radio 
                                            label="选择数据源" 
                                            checked={sourceType === 'datasource'} 
                                            onChange={() => setSourceType('datasource')} 
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Upload Area */}
                            <div className="col-span-2">
                                <div 
                                    onClick={() => !selectedCloudFiles.length && setIsCloudModalOpen(true)}
                                    className={`
                                        mt-2 rounded-2xl h-44 flex flex-col items-center justify-center transition-all group relative
                                        ${selectedCloudFiles.length > 0 
                                            ? 'bg-blue-50/40 border border-blue-100' 
                                            : 'bg-blue-50/10 border-2 border-dashed border-blue-200 cursor-pointer hover:bg-blue-50/30 hover:border-blue-300'}
                                    `}
                                >
                                    {selectedCloudFiles.length > 0 ? (
                                        <div className="flex flex-col items-center gap-4">
                                            <div className="bg-white px-8 py-5 rounded-2xl border border-blue-100 flex items-center gap-8 shadow-sm animate-in slide-in-from-bottom-2 duration-300">
                                                <div className="flex items-center gap-4">
                                                    <div className="bg-blue-600 text-white p-2 rounded-xl shadow-md shadow-blue-100">
                                                        <CloudUpload size={22} />
                                                    </div>
                                                    <div className="flex flex-col">
                                                        <span className="text-[15px] font-black text-slate-700">
                                                            {selectedCloudFiles.length === 1 ? selectedCloudFiles[0].name : `${selectedCloudFiles[0].name} 等 ${selectedCloudFiles.length} 个项目`}
                                                        </span>
                                                        <span className="text-[11px] text-slate-400 font-bold mt-1">源：云盘主目录</span>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={removeFile}
                                                    className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                            {isParsing && (
                                                <div className="flex items-center gap-2 text-blue-500 font-bold text-xs animate-pulse">
                                                    <Loader2 size={14} className="animate-spin" />
                                                    正在智能提取要素元数据与坐标参考...
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 text-slate-500 group-hover:scale-105 transition-transform duration-300">
                                            <div className="bg-blue-500 text-white p-1.5 rounded-lg shadow-md">
                                                <CloudUpload size={18} />
                                            </div>
                                            <span className="text-[15px] font-bold">点击选择云盘文件夹或文件</span>
                                        </div>
                                    )}
                                </div>
                                {selectedCloudFiles.length > 0 && (
                                    <div className="mt-3 pl-1 animate-fadeIn">
                                        <span className="text-[12px] text-blue-600 font-black tracking-tight flex items-center gap-1.5">
                                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-pulse"></div>
                                            提示匹配到 {matchedShpCount > 0 ? matchedShpCount : selectedCloudFiles.length} 个 shp 文件
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Spatial Mapping Table */}
                            {(isParsing || parsedFiles.length > 0) && (
                                <div className="col-span-2 mt-4 space-y-4 animate-slideUp">
                                    <div className="flex items-center justify-between px-1">
                                        <div className="flex items-center gap-2">
                                            <Settings2 size={18} className="text-blue-600" />
                                            <span className="text-[15px] font-bold text-slate-800">目标库选择批量设置</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {/* 批量选库组件 */}
                                            <div className="flex items-center gap-2 bg-blue-50/50 border border-blue-100 rounded-lg p-1 animate-fadeIn">
                                                <div className="relative group/batch">
                                                    <Database size={13} className="absolute left-2.5 top-2.5 text-blue-400" />
                                                    <select 
                                                        className="h-8 pl-8 pr-8 bg-white border border-blue-200 rounded-md outline-none text-[12px] font-bold text-slate-700 appearance-none hover:border-blue-400 transition-colors shadow-sm cursor-pointer"
                                                        value={batchDb}
                                                        onChange={(e) => setBatchDb(e.target.value)}
                                                    >
                                                        {MOCK_DATABASES.map(db => <option key={db} value={db}>{db}</option>)}
                                                    </select>
                                                    <ChevronDown size={12} className="absolute right-2.5 top-2.5 text-blue-400 pointer-events-none" />
                                                </div>
                                                <button 
                                                    onClick={handleBatchSyncDb}
                                                    className="flex items-center gap-1.5 px-3 h-8 bg-blue-600 text-white rounded-md text-[11px] font-black hover:bg-blue-700 active:scale-95 transition-all shadow-md shadow-blue-100"
                                                >
                                                    <RefreshCw size={12} />
                                                    一键同步到所有行
                                                </button>
                                            </div>

                                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium bg-slate-50 px-2.5 py-1 rounded-full">
                                                <HelpCircle size={12} className="text-blue-500" />
                                                <span>输入不存在的物理表名将自动在数据库中创建</span>
                                            </div>
                                            
                                            {totalMappingPages > 1 && (
                                                <div className="flex items-center gap-2 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100 shadow-sm">
                                                    <button 
                                                        disabled={mappingPage === 1}
                                                        onClick={() => setMappingPage(p => Math.max(1, p - 1))}
                                                        className="p-0.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <ChevronLeft size={14} />
                                                    </button>
                                                    <span className="text-[11px] font-bold text-slate-500 min-w-[32px] text-center">
                                                        {mappingPage} / {totalMappingPages}
                                                    </span>
                                                    <button 
                                                        disabled={mappingPage === totalMappingPages}
                                                        onClick={() => setMappingPage(p => Math.min(totalMappingPages, p + 1))}
                                                        className="p-0.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                                                    >
                                                        <ChevronRight size={14} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="border border-slate-100 rounded-2xl overflow-hidden shadow-sm bg-white ring-1 ring-slate-900/5 overflow-x-auto custom-scrollbar">
                                        <table className="w-full text-left text-[13px] border-collapse min-w-[1400px]">
                                            <thead className="bg-[#f8fbfd] text-slate-500 font-bold border-b border-slate-100 uppercase tracking-tight">
                                                <tr>
                                                    <th className="p-4 pl-8 w-[320px]">源文件名</th>
                                                    <th className="p-4 w-32">数据格式</th>
                                                    <th className="p-4 w-72">目标数据库</th>
                                                    <th className="p-4 w-[300px]">目标表名称</th>
                                                    <th className="p-4 w-[300px]">目标表别名</th>
                                                    <th className="p-4 text-center w-24">状态</th>
                                                    <th className="p-4 text-center w-24 pr-8">操作</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50">
                                                {displayedMappingFiles.map((file) => (
                                                    <tr key={file.id} className="hover:bg-slate-50/50 transition-colors group">
                                                        <td className="p-4 pl-8">
                                                            <div className="flex items-center gap-3">
                                                                <FileIcon format={file.format} />
                                                                <span className="font-bold text-slate-700 group-hover:text-blue-600 transition-colors truncate max-w-[240px]" title={file.name}>{file.name}</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase shadow-sm border ${getFormatStyle(file.format)}`}>
                                                                {file.format}
                                                            </span>
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="relative group/db">
                                                                <Database size={14} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none group-focus-within/db:text-blue-500 transition-colors" />
                                                                <select 
                                                                    className="w-full h-9 bg-white border border-slate-200 rounded-lg pl-8 pr-8 outline-none text-[12px] font-medium appearance-none focus:border-blue-400 transition-all shadow-sm"
                                                                    value={file.targetDb}
                                                                    onChange={(e) => updateFileInfo(file.id, 'targetDb', e.target.value)}
                                                                >
                                                                    {MOCK_DATABASES.map(db => <option key={db} value={db}>{db}</option>)}
                                                                </select>
                                                                <ChevronDown size={14} className="absolute right-3 top-2.5 text-slate-400 pointer-events-none" />
                                                            </div>
                                                        </td>
                                                        <td className="p-4">
                                                            <TableSelector 
                                                                value={file.targetTable}
                                                                isAutoCreate={file.isAutoCreate}
                                                                error={file.targetTableError}
                                                                onChange={(val) => updateFileInfo(file.id, 'targetTable', val)}
                                                            />
                                                        </td>
                                                        <td className="p-4">
                                                            <div className="relative group/alias">
                                                                <div className={`flex items-center h-9 px-3 bg-white border rounded-lg transition-all focus-within:ring-4 ${file.targetAliasError ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-50' : 'border-slate-200 focus-within:border-blue-500 focus-within:ring-blue-50'}`}>
                                                                    <TableIcon size={14} className={`mr-2 shrink-0 transition-colors ${file.targetAliasError ? 'text-red-400' : 'text-slate-400 group-focus-within/alias:text-blue-500'}`} />
                                                                    <input 
                                                                        type="text" 
                                                                        value={file.targetAlias}
                                                                        onChange={(e) => updateFileInfo(file.id, 'targetAlias', e.target.value)}
                                                                        placeholder="表别名"
                                                                        className="flex-1 bg-transparent border-none outline-none text-[12px] text-slate-700 font-bold placeholder:text-slate-400 placeholder:font-normal h-full min-w-0"
                                                                    />
                                                                    {file.targetAliasError && <AlertCircle size={12} className="text-red-500 ml-1 shrink-0" />}
                                                                </div>
                                                                {file.targetAliasError && (
                                                                    <div className="absolute top-full left-0 mt-0.5 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded shadow-sm z-10 whitespace-nowrap animate-in fade-in zoom-in-95">
                                                                        {file.targetAliasError}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-center">
                                                            <div className="flex flex-col items-center">
                                                                <CheckCircle2 size={20} className="text-emerald-500 drop-shadow-sm" strokeWidth={2.5} />
                                                                <span className="text-[9px] text-emerald-600 font-black mt-1 uppercase tracking-wider">Ready</span>
                                                            </div>
                                                        </td>
                                                        <td className="p-4 text-center pr-8">
                                                            <button 
                                                                onClick={() => handleDeleteParsedFile(file.id)}
                                                                className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                                title="移除该文件映射"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {isParsing && (
                                                    <tr>
                                                        <td colSpan={7} className="p-20 text-center">
                                                            <div className="flex flex-col items-center gap-4">
                                                                <div className="relative">
                                                                    <Loader2 size={40} className="text-blue-500 animate-spin" />
                                                                    <Database size={16} className="absolute inset-0 m-auto text-blue-300" />
                                                                </div>
                                                                <span className="text-[12px] font-bold text-slate-400 tracking-widest animate-pulse">正在提取要素图层及坐标参考...</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                    
                                    <div className="flex items-center justify-between px-2 py-4 bg-white border border-slate-100 rounded-xl shadow-sm">
                                        <div className="flex items-center gap-4 text-[13px] text-slate-500">
                                            <div className="flex items-center gap-2">
                                                <Info size={12} className="text-blue-500" />
                                                <span>系统已自动匹配同名物理表，如需更改请手动输入或在下拉列表中选择。</span>
                                            </div>
                                            <div className="w-px h-3 bg-slate-200"></div>
                                            <div className="font-medium">
                                                共 <span className="font-bold text-slate-800">{parsedFiles.length}</span> 条
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 cursor-pointer text-slate-600 text-[12px] font-medium transition-all">
                                                <span>{MAPPING_PAGE_SIZE}条/页</span>
                                                <ChevronDown size={14} className="text-slate-400" />
                                            </div>
                                            <div className="flex gap-1.5 items-center">
                                                <button 
                                                    disabled={mappingPage === 1}
                                                    onClick={() => setMappingPage(p => Math.max(1, p - 1))}
                                                    className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                                >
                                                    <ChevronLeft size={16} />
                                                </button>
                                                {Array.from({ length: Math.max(1, totalMappingPages) }).map((_, i) => (
                                                    <button 
                                                        key={i}
                                                        onClick={() => setMappingPage(i + 1)}
                                                        className={`w-8 h-8 flex items-center justify-center rounded-lg font-bold text-[12px] transition-all shadow-sm ${mappingPage === i + 1 ? 'bg-blue-600 text-white shadow-blue-100' : 'border border-slate-100 text-slate-400 hover:bg-slate-50 hover:border-slate-200'}`}
                                                    >
                                                        {i + 1}
                                                    </button>
                                                ))}
                                                <button 
                                                    disabled={mappingPage === totalMappingPages || totalMappingPages === 0}
                                                    onClick={() => setMappingPage(p => Math.min(totalMappingPages, p + 1))}
                                                    className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                                >
                                                    <ChevronRight size={16} />
                                                </button>
                                            </div>
                                            <div className="flex items-center gap-2 text-[13px] text-slate-500">
                                                前往 <input type="text" className="w-10 h-8 border border-slate-200 rounded text-center outline-none focus:border-blue-400 font-bold text-blue-600" defaultValue={mappingPage} /> 页
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* 目标库选择 */}
                            <div className="col-span-2 mt-2 space-y-3">
                                <label className="text-[14px] font-bold text-slate-700 flex items-center gap-2">
                                    <span className="flex items-center">
                                        <span className="text-red-500 mr-1">*</span>目标库选择
                                    </span>
                                    <div className="relative group flex items-center">
                                        <HelpCircle size={14} className="text-slate-300 cursor-help hover:text-blue-500 transition-colors" />
                                        <div className="absolute left-full ml-2 px-3 py-2 bg-slate-800 text-white text-[12px] font-medium rounded-lg shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-x-1 transition-all z-[110] w-64 leading-relaxed ring-1 ring-white/10 origin-left">
                                            配置数据入库的目标数据库、物理表名及别名。输入库中不存在的表名时，系统将在执行入库任务时自动执行建表操作。
                                            <div className="absolute right-full top-1/2 -translate-y-1/2 border-[6px] border-transparent border-r-slate-800"></div>
                                        </div>
                                    </div>
                                </label>
                                <div className="grid grid-cols-3 gap-4 items-start">
                                    <div className="flex flex-col gap-2">
                                        <Select 
                                            value={targetDb}
                                            icon={<Database size={16} className="text-slate-400 shrink-0" />}
                                            placeholder="请选择数据源名称" 
                                            options={MOCK_DATABASES.map(db => ({ label: db }))}
                                            onSelect={setTargetDb}
                                        />
                                        <p className="text-[11px] text-slate-400 pl-1">
                                            没有合适数据库，请前往 <span className="text-blue-600 cursor-pointer hover:underline font-bold" onClick={() => onNavigate?.('datasource_mgmt')}>数据源管理</span> 添加
                                        </p>
                                    </div>
                                    <TableCreatableSelect 
                                        value={targetTable}
                                        placeholder="请选择表名称或者输入创建新表" 
                                        options={MOCK_EXISTING_TABLES}
                                        onChange={setTargetTable}
                                    />
                                    <div className="flex flex-col gap-1.5 min-w-0">
                                        <div className={`relative group w-full h-10 px-4 flex items-center bg-white border rounded-lg transition-all focus-within:ring-4 ${aliasError ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-50' : 'border-slate-200 focus-within:border-blue-500 focus-within:ring-blue-50'}`}>
                                            <TableIcon size={16} className={`mr-2 shrink-0 transition-colors ${aliasError ? 'text-red-400' : 'text-slate-400 group-focus-within:text-blue-500'}`} />
                                            <input 
                                                type="text" 
                                                value={tableAlias}
                                                onChange={(e) => {
                                                    setTableAlias(e.target.value);
                                                    validateAlias(e.target.value);
                                                }}
                                                placeholder="请填写表别名（推荐中文）"
                                                className="flex-1 bg-transparent border-none outline-none text-[14px] text-slate-700 font-bold placeholder:text-slate-400 placeholder:font-normal h-full min-w-0"
                                            />
                                            {aliasError && <AlertCircle size={14} className="text-red-500 ml-1 shrink-0 animate-in zoom-in-50" />}
                                        </div>
                                        {aliasError && (
                                            <span className="text-[11px] text-red-500 font-medium px-1 flex items-center gap-1 animate-fadeIn">
                                                {aliasError}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Footer Action */}
                        <div className="mt-16 flex justify-end">
                            <button 
                                disabled={parsedFiles.length === 0 || !!aliasError || !!taskNameError || parsedFiles.some(f => !!f.targetAliasError || !!f.targetTableError)}
                                className={`
                                    px-14 py-3 rounded-xl text-[14px] font-bold transition-all active:scale-95 shadow-xl
                                    ${(parsedFiles.length > 0 && !aliasError && !taskNameError && !parsedFiles.some(f => !!f.targetAliasError || !!f.targetTableError))
                                        ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-200' 
                                        : 'bg-white border border-blue-100 text-blue-300 cursor-not-allowed'}
                                `}
                            >
                                下一步：配置空间索引
                            </button>
                        </div>
                    </div>
                </div>

            </div>

            {/* Cloud Modal */}
            {isCloudModalOpen && (
                <CloudDiskSelectionModal 
                    onClose={() => setIsCloudModalOpen(false)}
                    onConfirm={handleCloudConfirm}
                />
            )}
        </div>
    );
};

// --- Subcomponents ---

const FileIcon: React.FC<{ format: string }> = ({ format }) => {
    switch(format) {
        case 'JSON': return <FileJson size={18} className="text-indigo-500" />;
        case 'CSV': return <TableIcon size={18} className="text-emerald-500" />;
        default: return <FileCode size={18} className="text-blue-500" />;
    }
};

const getFormatStyle = (format: string) => {
    switch(format) {
        case 'SHP': return 'bg-amber-50 text-amber-600 border-amber-100';
        case 'JSON': return 'bg-indigo-50 text-indigo-600 border-indigo-100';
        case 'CSV': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
        case 'GPKG': return 'bg-blue-50 text-blue-600 border-blue-100';
        default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
}

const TableSelector: React.FC<{ 
    value: string; 
    isAutoCreate: boolean; 
    error?: string;
    onChange: (val: string) => void;
}> = ({ value, isAutoCreate, error, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const filtered = MOCK_EXISTING_TABLES.filter(t => t.toLowerCase().includes(value.toLowerCase()));

    return (
        <div className="relative group" ref={containerRef}>
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <div className={`flex items-center h-9 bg-white border rounded-lg transition-all shadow-sm ${error ? 'border-red-500 ring-4 ring-red-50' : (isOpen ? 'border-blue-500 ring-4 ring-blue-50' : 'border-slate-200 group-hover:border-slate-300')}`}>
                        <TableIcon size={12} className={`ml-2.5 shrink-0 transition-colors ${error ? 'text-red-400' : (isOpen ? 'text-blue-500' : 'text-slate-400')}`} />
                        <input 
                            type="text" 
                            value={value}
                            onFocus={() => setIsOpen(true)}
                            onChange={(e) => onChange(e.target.value)}
                            className="flex-1 px-2 bg-transparent border-none outline-none text-[12px] font-medium h-full min-w-0"
                            placeholder="物理表名"
                        />
                        {error && <AlertCircle size={12} className="text-red-500 mr-2 shrink-0" />}
                        {isAutoCreate && !error && (
                            <div className="mr-2 shrink-0 bg-blue-50 text-blue-600 p-0.5 rounded shadow-sm animate-in zoom-in-50 duration-200" title="该表将自动创建">
                                <Plus size={10} strokeWidth={4} />
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {error && (
                <div className="absolute top-full left-0 mt-0.5 bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded shadow-sm z-10 whitespace-nowrap animate-in fade-in zoom-in-95">
                    {error}
                </div>
            )}

            {isOpen && !error && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 max-h-56 overflow-y-auto custom-scrollbar">
                    <div className="p-2 border-b border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest px-3 flex items-center justify-between">
                        <span>候选物理表</span>
                        {value && !MOCK_EXISTING_TABLES.includes(value) && (
                            <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">NEW</span>
                        )}
                    </div>
                    {filtered.map(t => (
                        <div 
                            key={t}
                            onClick={() => { onChange(t); setIsOpen(false); }}
                            className="px-4 py-2 text-[12px] text-slate-600 hover:bg-blue-50 hover:text-blue-700 cursor-pointer flex items-center justify-between group/item transition-colors"
                        >
                            <div className="flex items-center gap-2">
                                <div className="w-1 h-1 rounded-full bg-slate-300 group-hover/item:bg-blue-500"></div>
                                <span className="font-medium">{t}</span>
                            </div>
                            {value === t && <Check size={12} className="text-blue-600" />}
                        </div>
                    ))}
                    {filtered.length === 0 && (
                        <div className="p-5 text-center">
                            <p className="text-[11px] text-slate-400 font-medium">未找到匹配项，回车将 <b>自动建表</b>。</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

const TableCreatableSelect: React.FC<{
    value: string;
    onChange: (val: string) => void;
    placeholder?: string;
    options: string[];
}> = ({ value, onChange, placeholder, options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState(value);
    const [error, setError] = useState<string>('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setInputValue(value);
    }, [value]);

    const validateTable = (val: string) => {
        if (!val) {
            setError('');
            return true;
        }
        const regex = /^[a-zA-Z0-9_]+$/;
        if (!regex.test(val)) {
            setError('表名仅支持英文字母、数字和下划线');
            return false;
        } else {
            setError('');
            return true;
        }
    };

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                if (isOpen) {
                    if (validateTable(inputValue)) {
                        if (inputValue !== value) {
                            onChange(inputValue);
                        }
                    }
                    setIsOpen(false);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, inputValue, value, onChange]);

    const filteredOptions = options.filter(opt => 
        opt.toLowerCase().includes(inputValue.toLowerCase())
    );

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (validateTable(inputValue)) {
                onChange(inputValue);
                setIsOpen(false);
                inputRef.current?.blur();
            }
        }
    };

    const isNew = inputValue && !options.includes(inputValue);

    return (
        <div className="flex flex-col gap-1.5 min-w-0" ref={containerRef}>
            <div className="relative group">
                <div 
                    className={`
                        w-full h-10 px-4 flex items-center bg-white border rounded-lg transition-all cursor-text focus-within:ring-4
                        ${error ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-50' : (isOpen ? 'border-blue-500 ring-4 ring-blue-50 shadow-sm' : 'border-slate-200 hover:border-slate-300')}
                    `}
                    onClick={() => inputRef.current?.focus()}
                >
                    <div className="flex-1 flex items-center gap-2 min-w-0">
                        <TableIcon size={16} className={`shrink-0 transition-colors ${error ? 'text-red-400' : (isOpen ? 'text-blue-500' : 'text-slate-400')}`} />
                        <input 
                            ref={inputRef}
                            type="text"
                            value={inputValue}
                            onFocus={() => setIsOpen(true)}
                            onChange={(e) => {
                                setInputValue(e.target.value);
                                validateTable(e.target.value);
                            }}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            className="flex-1 bg-transparent border-none outline-none text-[14px] text-slate-700 font-bold placeholder:text-slate-400 placeholder:font-normal h-full min-w-0"
                        />
                    </div>
                    {isNew && !isOpen && !error && (
                        <div className="shrink-0 bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded text-[10px] font-black mr-1 animate-in zoom-in-50 duration-200">NEW</div>
                    )}
                    {error && <AlertCircle size={14} className="text-red-500 ml-1 shrink-0" />}
                    <ChevronDown 
                        size={18} 
                        className={`shrink-0 text-slate-300 cursor-pointer hover:text-slate-500 transition-all ${isOpen ? 'rotate-180' : ''}`}
                        onClick={(e) => {
                            e.stopPropagation();
                            setIsOpen(!isOpen);
                        }}
                    />
                </div>

                {isOpen && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-[100] py-1 animate-in fade-in zoom-in-95 duration-200 max-h-64 overflow-y-auto custom-scrollbar">
                        <div className="px-4 py-2 border-b border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-between items-center">
                            <span>候选物理表</span>
                            {isNew && !error && (
                                <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">NEW</span>
                            )}
                        </div>
                        {filteredOptions.map((opt) => (
                            <div 
                                key={opt}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChange(opt);
                                    setIsOpen(false);
                                    setError('');
                                }}
                                className={`px-4 py-2.5 hover:bg-blue-50 cursor-pointer transition-colors flex items-center justify-between ${value === opt ? 'bg-blue-50/50' : ''}`}
                            >
                                <span className={`text-[13px] font-bold ${value === opt ? 'text-blue-600' : 'text-slate-700'}`}>{opt}</span>
                                {value === opt && <Check size={14} className="text-blue-600" />}
                            </div>
                        ))}
                        {isNew && !error && (
                            <div 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onChange(inputValue);
                                    setIsOpen(false);
                                }}
                                className="px-4 py-3 bg-slate-50 border-t border-slate-100 cursor-pointer group/add"
                            >
                                <div className="flex items-center gap-2 text-[12px] text-blue-600 font-bold group-hover/add:translate-x-1 transition-transform">
                                    <Plus size={14} strokeWidth={3} />
                                    <span>创建新表："{inputValue}"</span>
                                </div>
                            </div>
                        )}
                        {filteredOptions.length === 0 && !inputValue && (
                            <div className="p-8 text-center text-slate-400 text-[12px] font-medium italic">
                                暂无更多可匹配表项，请输入名称创建
                            </div>
                        )}
                    </div>
                )}
            </div>
            {error && (
                <span className="text-[11px] text-red-500 font-medium px-1 flex items-center gap-1 animate-fadeIn">
                    {error}
                </span>
            )}
        </div>
    );
};

const FormItem: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => (
    <div className="space-y-2.5">
        <label className="text-[14px] font-bold text-slate-700 block">
            {required && <span className="text-red-500 mr-1">*</span>}
            {label}
        </label>
        {children}
    </div>
);

const Select: React.FC<{ 
    value?: string; 
    placeholder?: string; 
    options?: { label: string; sub?: string }[];
    onSelect?: (val: string) => void;
    icon?: React.ReactNode;
}> = ({ value, placeholder, options, onSelect, icon }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative group" ref={containerRef}>
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`
                    w-full h-10 px-4 flex items-center justify-between bg-white border border-slate-200 rounded-lg cursor-pointer transition-all hover:border-slate-300
                    ${isOpen ? 'border-blue-500 ring-4 ring-blue-50' : ''}
                    ${!value ? 'text-slate-400 font-normal' : 'text-slate-700 font-bold'}
                `}
            >
                <div className="flex items-center gap-2 truncate">
                    {icon}
                    <span className="text-[14px] truncate">{value || placeholder}</span>
                </div>
                <ChevronDown size={18} className={`text-slate-400 group-hover:text-slate-600 transition-all ${isOpen ? 'rotate-180' : ''}`} />
            </div>
            {isOpen && options && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-[100] py-1 animate-in fade-in zoom-in-95 duration-200 max-h-64 overflow-y-auto custom-scrollbar">
                    {options.map((opt) => (
                        <div 
                            key={opt.label}
                            onClick={() => {
                                onSelect?.(opt.label);
                                setIsOpen(false);
                            }}
                            className={`px-4 py-2 hover:bg-blue-50 cursor-pointer transition-colors flex items-center justify-between ${value === opt.label ? 'bg-blue-50/50' : ''}`}
                        >
                            <div className={`text-[14px] font-bold ${value === opt.label ? 'text-blue-600' : 'text-slate-800'}`}>
                                {opt.label}
                            </div>
                            {opt.sub && (
                                <div className="text-[11px] text-slate-400 font-medium mt-0.5 italic">
                                    {opt.sub}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

const TagInputSelect: React.FC<{
    values: string[];
    onChange: (vals: string[]) => void;
    placeholder?: string;
    options: string[];
}> = ({ values, onChange, placeholder, options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                if (isOpen) {
                    if (inputValue.trim() && !values.includes(inputValue.trim())) {
                        onChange([...values, inputValue.trim()]);
                        setInputValue('');
                    }
                    setIsOpen(false);
                }
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen, inputValue, values, onChange]);

    const filteredOptions = options.filter(opt => 
        opt.toLowerCase().includes(inputValue.toLowerCase()) && !values.includes(opt)
    );

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (inputValue.trim()) {
                if (!values.includes(inputValue.trim())) {
                    onChange([...values, inputValue.trim()]);
                }
                setInputValue('');
            }
        } else if (e.key === 'Backspace' && !inputValue && values.length > 0) {
            onChange(values.slice(0, -1));
        }
    };

    const removeTag = (tag: string) => {
        onChange(values.filter(v => v !== tag));
    };

    return (
        <div className="relative group" ref={containerRef}>
            <div 
                className={`
                    w-full min-h-[40px] px-3 py-1.5 flex flex-wrap items-center gap-2 bg-white border rounded-lg transition-all cursor-text
                    ${isOpen ? 'border-blue-500 ring-4 ring-blue-50' : 'border-slate-200 hover:border-slate-300'}
                `}
                onClick={() => inputRef.current?.focus()}
            >
                <TagIcon size={14} className={`shrink-0 transition-colors ${isOpen ? 'text-blue-500' : 'text-slate-400'}`} />
                {values.map(tag => (
                    <div 
                        key={tag} 
                        className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 border border-blue-100 text-blue-600 rounded-md text-[12px] font-bold animate-in fade-in zoom-in-95 duration-200"
                    >
                        <span>{tag}</span>
                        <X 
                            size={12} 
                            className="cursor-pointer hover:text-red-500 transition-colors" 
                            onClick={(e) => {
                                e.stopPropagation();
                                removeTag(tag);
                            }}
                        />
                    </div>
                ))}
                <input 
                    ref={inputRef}
                    type="text"
                    value={inputValue}
                    onFocus={() => setIsOpen(true)}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={values.length === 0 ? placeholder : ""}
                    className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-[14px] text-slate-700 font-bold placeholder:text-slate-400 placeholder:font-normal h-7"
                />
                <ChevronDown 
                    size={18} 
                    className={`shrink-0 text-slate-300 cursor-pointer hover:text-slate-500 transition-all ${isOpen ? 'rotate-180' : ''}`}
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                />
            </div>
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-[100] py-1 animate-in fade-in zoom-in-95 duration-200 max-h-64 overflow-y-auto custom-scrollbar animate-fadeIn">
                    <div className="px-4 py-2 border-b border-slate-50 text-[10px] font-bold text-slate-400 uppercase tracking-widest flex justify-between items-center">
                        <span>候选标签</span>
                        {inputValue && !options.includes(inputValue) && !values.includes(inputValue) && (
                            <span className="text-[9px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">NEW</span>
                        )}
                    </div>
                    {filteredOptions.map((opt) => (
                        <div 
                            key={opt}
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange([...values, opt]);
                                setInputValue('');
                            }}
                            className="px-4 py-2.5 hover:bg-blue-50 cursor-pointer transition-colors flex items-center justify-between"
                        >
                            <span className="text-[13px] font-medium text-slate-700">{opt}</span>
                            <Plus size={14} className="text-slate-300" />
                        </div>
                    ))}
                    {inputValue && !options.includes(inputValue) && !values.includes(inputValue) && (
                        <div 
                            onClick={(e) => {
                                e.stopPropagation();
                                onChange([...values, inputValue.trim()]);
                                setInputValue('');
                            }}
                            className="px-4 py-3 bg-slate-50 border-t border-slate-100 cursor-pointer group/add"
                        >
                            <div className="flex items-center gap-2 text-[12px] text-blue-600 font-bold group-hover/add:translate-x-1 transition-transform">
                                <Plus size={14} strokeWidth={3} />
                                <span>创建新标签："{inputValue}"</span>
                            </div>
                        </div>
                    )}
                    {filteredOptions.length === 0 && !inputValue && (
                        <div className="p-8 text-center text-slate-400 text-[12px] font-medium italic">
                            暂无更多可匹配标签
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

const Radio: React.FC<{ label: string; checked: boolean; onChange: () => void }> = ({ label, checked, onChange }) => (
    <div 
        onClick={onChange}
        className="flex items-center gap-3 cursor-pointer group"
    >
        <div className={`
            w-[18px] h-[18px] rounded-full border-2 flex items-center justify-center transition-all
            ${checked ? 'border-blue-600 bg-blue-50/50 shadow-sm' : 'border-slate-300 group-hover:border-slate-400'}
        `}>
            {checked && <div className="w-[8px] h-[8px] rounded-full bg-blue-600 animate-in zoom-in-50 duration-300"></div>}
        </div>
        <span className={`text-[14px] transition-colors ${checked ? 'text-blue-600 font-bold' : 'text-slate-600 font-medium'}`}>
            {label}
        </span>
    </div>
);
