
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Undo2, 
  ChevronRight, 
  Settings2, 
  Globe, 
  Layers, 
  Map as MapIcon, 
  Maximize, 
  Minimize, 
  Plus, 
  Minus, 
  Search, 
  ArrowRight, 
  ArrowLeft,
  FileText, 
  FlaskConical, 
  ChevronDown,
  Info,
  Clock,
  Tag as TagIcon,
  X,
  Database,
  FolderOpen,
  CheckCircle2,
  FileBox,
  HardDrive,
  Folder,
  LayoutGrid,
  Palette,
  AppWindow,
  Check
} from 'lucide-react';
import { DirectoryNode } from './ServiceDevelopmentPanel';
import { APIRow } from '../constants';

const RECOMMENDED_TAGS = ['国土空间', '自然资源', '生态保护', '交通路网', '公共设施', '水利设施', '遥感影像', '地形地貌'];

const MOCK_APPS = [
    '智慧城市综合管理平台',
    '自然资源一张图系统',
    '应急指挥高度中心',
    '社会经济运行监测系统',
    '水利枢纽安全监管平台',
    '智慧交通云控平台',
    '数字孪生城市底座',
];

// 样式预设选项
const STYLE_OPTIONS = [
    { label: '默认点要素样式 (point_default.sld)', value: 'point_default.sld' },
    { label: '蓝色交通线样式 (line_blue_transport.sld)', value: 'line_blue_transport.sld' },
    { label: '绿色生态填充样式 (polygon_green_eco.sld)', value: 'polygon_green_eco.sld' },
    { label: '高程晕渲着色样式 (terrain_hillshade.sld)', value: 'terrain_hillshade.sld' },
    { label: '三波段真彩色合成 (raster_rgb_default.sld)', value: 'raster_rgb_default.sld' },
    { label: 'MVT 矢量切片通用样式', value: 'MVT (Vector Tile)' },
];

// 资源树节点定义
interface ResourceTreeNode {
  id: string;
  label: string;
  children?: ResourceTreeNode[];
}

// 嵌套结构的资源树数据：将“全部主题”作为根节点
const FULL_RESOURCE_TREE: ResourceTreeNode = {
  id: 'all',
  label: '全部主题',
  children: [
    {
      id: 'geo',
      label: '基础地理',
      children: [
        { id: 'geo-admin', label: '行政区划' }
      ]
    },
    {
      id: 'address',
      label: '地名地址',
      children: [
        { id: 'address-poi', label: 'POI' },
        { id: 'address-aoi', label: 'AOI' }
      ]
    },
    {
      id: 'map-svc',
      label: '地图服务',
      children: [
        { id: 'map-img', label: '影像地图' },
        { id: 'map-elec', label: '电子地图' },
        { id: 'map-terrain', label: '地形' },
        { id: 'map-name', label: '地名' },
        { id: 'map-anno', label: '注记地图' }
      ]
    },
    {
      id: '3d',
      label: '实景三维',
      children: [
        { id: '3d-white', label: '白模' },
        { id: '3d-oblique', label: '倾斜摄影' },
        { id: '3d-bim', label: 'BIM' },
        { id: '3d-cim', label: 'CIM' },
        { id: '3d-other', label: '其他测绘数据' }
      ]
    },
    {
      id: 'rs',
      label: '遥感遥测',
      children: [
        {
          id: 'rs-sat',
          label: '卫星遥感',
          children: [
            {
              id: 'rs-sentry',
              label: '哨兵',
              children: [
                { id: 'rs-sentry-1', label: '哨兵一号' },
                { id: 'rs-sentry-2', label: '哨兵二号' }
              ]
            }
          ]
        }
      ]
    }
  ]
};

// 优化后的平铺路径函数
const getFlattenedPaths = (nodes: DirectoryNode[] = [], prefix = ''): {id: string, label: string}[] => {
    let result: {id: string, label: string}[] = [];
    (nodes || []).forEach(node => {
        if (node.id === 'all') return;
        const currentPath = prefix ? `${prefix} / ${node.label}` : node.label;
        result.push({ id: node.id, label: currentPath });
        if (node.children) {
            result = [...result, ...getFlattenedPaths(node.children, currentPath)];
        }
    });
    return result;
};

// 模拟数据资源列表
const MOCK_RESOURCES = [
    { id: 'res-1', name: '2025年度湖北省县级界线', type: '矢量 / Shp', size: '12.4MB', time: '2025-01-10', category: 'geo-admin' },
    { id: 'res-2', name: '武汉市中心城区遥感影像', type: '栅格 / Tif', size: '1.2GB', time: '2024-12-15', category: 'map-img' },
    { id: 'res-3', name: '长江主要航道矢量图层', type: '矢量 / GeoJSON', size: '450KB', time: '2024-11-20', category: 'map-elec' },
    { id: 'res-4', name: '全省生态红线保护范围', type: '矢量 / Shp', size: '8.2MB', time: '2025-01-05', category: 'geo-admin' },
    { id: 'res-5', name: '高分二号黄石市全色影像', type: '栅格 / Tif', size: '560MB', time: '2024-12-28', category: 'rs-sentry-1' },
    { id: 'res-6', name: '武汉核心区三维实景模型(3DTiles)', type: '三维模型 / 3DTiles', size: '4.8GB', time: '2025-01-12', category: '3d-oblique' },
];

interface APISpatialWizardProps {
  onBack: () => void;
  onSaveDraft?: () => void;
  directories: DirectoryNode[];
  initialData?: APIRow;
}

export const APISpatialWizard: React.FC<APISpatialWizardProps> = ({ onBack, onSaveDraft, directories = [], initialData }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(initialData?.name || '');
  const [dirId, setDirId] = useState(initialData?.dirId || '');
  const [dataType, setDataType] = useState(initialData?.dataType === '栅格' ? 'raster' : initialData?.dataType === '三维模型' ? '3d' : 'vector');
  const [description, setDescription] = useState(initialData?.description || '');
  
  // 新增应用选择状态
  const [selectedApp, setSelectedApp] = useState('');

  const [zoom, setZoom] = useState(5);
  const [selectedResId, setSelectedResId] = useState<string | null>(initialData ? 'res-1' : null); // 模拟在编辑时已选资源
  const [selectedStyle, setSelectedStyle] = useState(initialData?.styleName || '');

  // 目录相关状态
  const [activeTab, setActiveTab] = useState<'source' | 'public' | 'app'>('source');
  const [activeNodeId, setActiveNodeId] = useState<string>('all'); 
  const [resSearch, setResSearch] = useState('');

  // 标签相关状态
  const [tags, setTags] = useState<string[]>(['时空数据', '矢量底图']);
  const [tagInput, setTagInput] = useState('');
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const tagContainerRef = useRef<HTMLDivElement>(null);

  const dirOptions = useMemo(() => getFlattenedPaths(directories), [directories]);

  const wizardSteps = [
    { id: 1, label: '基础信息', icon: <FileText size={16} /> },
    { id: 2, label: '数据选择与空间配置', icon: <Settings2 size={16} /> },
    { id: 3, label: '预览测试', icon: <FlaskConical size={16} /> },
  ];

  const filteredResources = useMemo(() => {
    return (MOCK_RESOURCES || []).filter(r => {
        const matchCat = activeNodeId === 'all' || r.category === activeNodeId;
        const matchSearch = r.name.toLowerCase().includes(resSearch.toLowerCase());
        return matchCat && matchSearch;
    });
  }, [activeNodeId, resSearch]);

  const addTag = (tag: string) => {
    const trimmed = tag.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
    setIsTagDropdownOpen(false);
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tagContainerRef.current && !tagContainerRef.current.contains(e.target as Node)) {
        setIsTagDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredRecommended = RECOMMENDED_TAGS.filter(t => 
    t.includes(tagInput) && !tags.includes(t)
  );

  const handleNextStep = () => {
    if (step < 3) setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] h-full animate-fadeIn overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
            <Undo2 size={20} />
          </button>
          <div className="h-6 w-px bg-slate-200"></div>
          <h2 className="text-[16px] font-bold text-slate-800">
            {initialData ? '编辑服务' : '创建服务'} <span className="text-blue-600 font-medium ml-2 text-sm">(时空数据模式)</span>
          </h2>
        </div>

        <div className="flex items-center">
          {wizardSteps.map((s, idx) => (
            <React.Fragment key={s.id}>
              <div 
                className={`flex items-center gap-2 px-4 py-1.5 rounded-full transition-all ${step === s.id ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400'}`}
              >
                {s.icon}
                <span className="text-xs font-bold whitespace-nowrap">{s.label}</span>
              </div>
              {idx < wizardSteps.length - 1 && <ChevronRight size={14} className="mx-2 text-slate-300" />}
            </React.Fragment>
          ))}
        </div>

        <div className="flex items-center gap-3">
          {step > 1 && (
            <button 
              onClick={handlePrevStep}
              className="px-4 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2 transition-all active:scale-95"
            >
              <ArrowLeft size={14} />
              上一步
            </button>
          )}
          <button 
            onClick={onSaveDraft}
            className="px-4 py-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all"
          >
            保存草稿
          </button>
          <button 
            onClick={step === 3 ? onBack : handleNextStep}
            disabled={step === 2 && !selectedResId}
            className={`px-6 py-1.5 rounded-lg text-xs font-bold shadow-md flex items-center gap-2 transition-all active:scale-95 ${step === 2 && !selectedResId ? 'bg-slate-300 text-white cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
          >
            {step === 3 ? '发布服务' : '下一步'}
            {step !== 3 && <ArrowRight size={14} />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar bg-slate-50/30">
        <div className="max-w-6xl mx-auto space-y-8 animate-slideUp">
          
          {step === 1 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-8">
              <SectionHeader title="基础信息设置" />
              <div className="grid grid-cols-3 gap-x-10 gap-y-6">
                <FormItem label="服务名称" required>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入服务名称" className="w-full h-10 px-4 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-[13px] bg-white" />
                </FormItem>
                
                <FormItem label="服务目录" required>
                   <div className="relative group">
                    <select value={dirId} onChange={(e) => setDirId(e.target.value)} className="w-full h-10 px-4 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-[13px] appearance-none bg-white cursor-pointer group-hover:border-slate-300">
                      <option value="">请选择服务目录</option>
                      {(dirOptions || []).map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" size={16} />
                  </div>
                </FormItem>

                <FormItem label="所属应用" required>
                  <SearchableAppSelector value={selectedApp} onChange={setSelectedApp} />
                </FormItem>

                <FormItem label="数据类型" required>
                  <div className="relative group">
                    <select value={dataType} onChange={(e) => setDataType(e.target.value)} className="w-full h-10 px-4 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-[13px] appearance-none bg-white cursor-pointer group-hover:border-slate-300">
                      <option value="">请选择数据类型</option>
                      <option value="vector">矢量（支持shp、geojson）</option>
                      <option value="raster">栅格</option>
                      <option value="3d">三维模型</option>
                    </select>
                    <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" size={16} />
                  </div>
                </FormItem>

                <FormItem label="服务标签">
                  <div className="relative" ref={tagContainerRef}>
                    <div 
                      className="w-full min-h-[40px] p-1.5 border border-slate-200 rounded-lg flex flex-wrap gap-1.5 bg-white cursor-text focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-50 transition-all"
                      onClick={() => setIsTagDropdownOpen(true)}
                    >
                      {tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-[13px] font-bold rounded border border-blue-100 animate-fadeIn">
                          {tag}
                          <X size={12} className="cursor-pointer hover:text-blue-800" onClick={(e) => { e.stopPropagation(); removeTag(tag); }} />
                        </span>
                      ))}
                      <input 
                        type="text" 
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag(tagInput);
                          }
                        }}
                        onFocus={() => setIsTagDropdownOpen(true)}
                        placeholder={tags.length === 0 ? "选择或输入标签..." : ""}
                        className="flex-1 min-w-[60px] outline-none text-[13px] bg-transparent"
                      />
                    </div>
                    {isTagDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 max-h-48 overflow-y-auto custom-scrollbar animate-fadeIn">
                        <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 mb-1">推荐标签</div>
                        {filteredRecommended.map(tag => (
                          <div 
                            key={tag}
                            onClick={() => addTag(tag)}
                            className="px-4 py-2 text-[13px] text-slate-600 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-colors flex items-center gap-2"
                          >
                            <TagIcon size={14} className="text-slate-300" />
                            {tag}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </FormItem>

                <div className="col-span-3">
                  <FormItem label="服务描述">
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="请输入服务功能描述" className="w-full h-24 px-4 py-3 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-[13px] resize-none bg-white"></textarea>
                  </FormItem>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              {/* 数据选择面板 */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
                    <SectionHeader title="数据资源选择" icon={<Database size={18} className="text-blue-600" />} />
                    <div className="relative group w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                        <input 
                            type="text" 
                            placeholder="在资源库中搜索数据..." 
                            value={resSearch}
                            onChange={(e) => setResSearch(e.target.value)}
                            className="w-full h-8 pl-9 pr-4 bg-white border border-slate-200 rounded-lg text-[13px] outline-none focus:border-blue-400 transition-all"
                        />
                    </div>
                </div>
                
                <div className="flex-1 flex overflow-hidden">
                    {/* 左侧资源层级目录 - 重构为全嵌套结构 */}
                    <div className="w-72 border-r border-slate-100 bg-[#fcfdfe] flex flex-col flex-shrink-0">
                        {/* 顶部层级切换页签 */}
                        <div className="flex items-center px-4 border-b border-slate-50 gap-4 flex-shrink-0">
                            <TabLayer label="贴源层" icon={<Layers size={14} />} active={activeTab === 'source'} onClick={() => setActiveTab('source')} />
                            <TabLayer label="公共层" icon={<Globe size={14} />} active={activeTab === 'public'} onClick={() => setActiveTab('public')} />
                            <TabLayer label="应用层" icon={<LayoutGrid size={14} />} active={activeTab === 'app'} onClick={() => setActiveTab('app')} />
                        </div>

                        {/* 目录树滚动区 */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
                            <div className="space-y-0.5">
                                <RecursiveTreeNode 
                                    node={FULL_RESOURCE_TREE} 
                                    activeId={activeNodeId} 
                                    onSelect={setActiveNodeId} 
                                    level={0}
                                    defaultExpanded={true}
                                />
                            </div>
                        </div>
                    </div>

                    {/* 右侧数据列表 */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar p-1 bg-white">
                        <table className="w-full text-left text-[13px] border-collapse table-fixed">
                            <thead className="bg-[#f8fbfd] text-slate-400 font-bold border-b border-slate-100 sticky top-0 z-10 uppercase tracking-wider">
                                <tr>
                                    <th className="p-4 w-16 text-center whitespace-nowrap">选择</th>
                                    <th className="p-4 w-1/3 whitespace-nowrap">数据名称</th>
                                    <th className="p-4 w-1/4 whitespace-nowrap">数据类型</th>
                                    <th className="p-4 w-1/6 text-center whitespace-nowrap">数据量</th>
                                    <th className="p-4 w-1/4 whitespace-nowrap">入库时间</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {(filteredResources || []).map(res => (
                                    <tr 
                                        key={res.id} 
                                        onClick={() => setSelectedResId(res.id)}
                                        className={`cursor-pointer transition-colors ${selectedResId === res.id ? 'bg-blue-50/50' : 'hover:bg-slate-50/80 group'}`}
                                    >
                                        <td className="p-4 text-center">
                                            <div className={`w-5 h-5 mx-auto rounded-full border-2 flex items-center justify-center transition-all ${selectedResId === res.id ? 'border-blue-600 bg-blue-600 shadow-sm' : 'border-slate-300'}`}>
                                                {selectedResId === res.id && <CheckCircle2 size={12} className="text-white" />}
                                            </div>
                                        </td>
                                        <td className="p-4 overflow-hidden">
                                            <div className="flex items-center gap-2.5">
                                                <FileBox size={16} className={selectedResId === res.id ? 'text-blue-600' : 'text-slate-300 group-hover:text-blue-400'} />
                                                <span className={`font-bold truncate whitespace-nowrap ${selectedResId === res.id ? 'text-blue-700' : 'text-slate-700'}`}>{res.name}</span>
                                            </div>
                                        </td>
                                        <td className="p-4 overflow-hidden">
                                            <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-500 font-medium text-[11px] whitespace-nowrap truncate inline-block max-w-full">{res.type}</span>
                                        </td>
                                        <td className="p-4 text-slate-500 font-mono text-center whitespace-nowrap">
                                            {res.size}
                                        </td>
                                        <td className="p-4 text-slate-400 font-mono whitespace-nowrap truncate">
                                            {res.time}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                        {(filteredResources || []).length === 0 && (
                            <div className="flex flex-col items-center justify-center py-20 text-slate-300">
                                <HardDrive size={48} className="opacity-20 mb-2" />
                                <span className="text-[13px] font-medium">该目录下未找到匹配的数据资源</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* 已选状态栏 */}
                <div className="px-6 py-2 border-t border-slate-50 bg-slate-50/30 flex items-center gap-3 text-[11px] flex-shrink-0">
                    <span className="text-slate-400 font-bold uppercase tracking-widest whitespace-nowrap">当前已选：</span>
                    {selectedResId ? (
                        <div className="flex items-center gap-2 bg-blue-50 text-blue-600 px-2 py-1 rounded-md font-bold animate-fadeIn whitespace-nowrap overflow-hidden">
                             <CheckCircle2 size={12} className="flex-shrink-0" />
                             <span className="truncate">{(MOCK_RESOURCES || []).find(r => r.id === selectedResId)?.name}</span>
                        </div>
                    ) : (
                        <span className="text-slate-300 italic whitespace-nowrap">请在列表中选择一个数据资源以继续配置</span>
                    )}
                </div>
              </div>

              {/* 空间配置区块 */}
              <div className={`transition-all duration-500 ${selectedResId ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-8">
                    <SectionHeader title="核心空间配置" icon={<Globe size={18} className="text-blue-600" />} />
                    <div className="grid grid-cols-2 gap-x-10 gap-y-6">
                        <FormItem label="空间坐标系 (CRS)" required>
                            <div className="relative">
                            <select defaultValue={initialData?.crs || 'EPSG:4326 (WGS 84)'} className="w-full h-10 px-4 border border-slate-200 rounded-lg text-[13px] bg-white outline-none focus:border-blue-500 appearance-none shadow-sm">
                                <option>EPSG:4326 (WGS 84)</option>
                                <option>EPSG:3857 (Web Mercator)</option>
                                <option>EPSG:4490 (CGCS2000)</option>
                            </select>
                            <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
                            </div>
                        </FormItem>
                        
                        <FormItem label="图层样式绑定 (Style)" required>
                            <div className="relative group">
                                <select 
                                    value={selectedStyle}
                                    onChange={(e) => setSelectedStyle(e.target.value)}
                                    className="w-full h-10 pl-10 pr-10 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-blue-500 bg-white appearance-none cursor-pointer group-hover:border-slate-300 transition-all shadow-sm"
                                >
                                    <option value="" disabled>请从样式库中选择样式...</option>
                                    {(STYLE_OPTIONS || []).map(opt => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                <Palette size={16} className="absolute left-3.5 top-3 text-slate-400 pointer-events-none group-focus-within:text-blue-500 transition-colors" />
                                <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none group-hover:text-slate-600" size={16} />
                            </div>
                        </FormItem>
                    </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="flex flex-col gap-6 animate-fadeIn">
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[600px]">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2 font-bold text-slate-800 text-[13px]">
                    <MapIcon size={16} className="text-blue-600" /> 服务发布预览
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-[11px] text-slate-400 flex items-center gap-1 whitespace-nowrap">
                      <Info size={12} /> 拖拽平移，滚轮缩放
                    </div>
                    <div className="h-4 w-px bg-slate-200 flex-shrink-0"></div>
                    <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded text-[10px] font-bold">
                       <span className="px-2 py-0.5 bg-white text-blue-600 rounded shadow-sm cursor-pointer">2D</span>
                       <span className="px-2 py-0.5 text-slate-400 cursor-pointer">3D</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 bg-[#e2e8f0] relative overflow-hidden group">
                  <div 
                    className="absolute inset-0 transition-transform duration-500 ease-out flex items-center justify-center cursor-move"
                    style={{ transform: `scale(${1 + (zoom - 5) * 0.1})` }}
                  >
                     <img 
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/China_edcp_location_map.svg/1024px-China_edcp_location_map.svg.png" 
                        className="w-[80%] opacity-60 mix-blend-multiply grayscale brightness-110" 
                        alt="Map Preview"
                     />
                     <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-80">
                        <path d="M400,200 L450,220 L480,180 L440,150 Z" fill="#3b82f6" fillOpacity="0.2" stroke="#3b82f6" strokeWidth="1" />
                        <circle cx="520" cy="250" r="4" fill="#ef4444" />
                        <path d="M300,100 Q400,150 500,100" fill="none" stroke="#10b981" strokeWidth="2" strokeDasharray="4" />
                     </svg>
                  </div>

                  <div className="absolute right-6 top-6 flex flex-col gap-2 z-10">
                     <div className="bg-white rounded-lg shadow-xl border border-slate-200 p-1 flex flex-col gap-1">
                        <button onClick={() => setZoom(z => Math.min(22, z+1))} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"><Plus size={16} /></button>
                        <div className="h-px bg-slate-100 mx-1"></div>
                        <button onClick={() => setZoom(z => Math.max(0, z-1))} className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded transition-all"><Minus size={16} /></button>
                     </div>
                     <button className="bg-white rounded-lg shadow-xl border border-slate-200 p-3 text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-all"><Maximize size={16} /></button>
                  </div>

                  <div className="absolute left-6 bottom-6 flex items-center gap-3">
                     <div className="bg-white/80 backdrop-blur px-3 py-1.5 rounded-full border border-slate-200/50 shadow-lg flex items-center gap-4 text-[11px] font-mono text-slate-600 whitespace-nowrap">
                        <span>ZOOM: {zoom}</span>
                        <div className="w-px h-3 bg-slate-300"></div>
                        <span>114.32°E, 30.21°N</span>
                     </div>
                  </div>
                </div>

                <div className="px-6 py-4 border-t border-slate-100 bg-[#f8fafc] flex items-center justify-between flex-shrink-0">
                   <div className="flex items-center gap-6">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase whitespace-nowrap">已选数据源</span>
                        <span className="text-[13px] font-bold text-slate-700 truncate max-w-[200px]">{(MOCK_RESOURCES || []).find(r => r.id === selectedResId)?.name || '未选择'}</span>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <span className="text-[10px] text-slate-400 font-bold uppercase whitespace-nowrap">坐标系</span>
                        <span className="text-[13px] font-bold text-slate-700 whitespace-nowrap">EPSG:4326</span>
                      </div>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// --- 子组件: 搜索应用选择器 ---
const SearchableAppSelector: React.FC<{ value: string; onChange: (val: string) => void }> = ({ value, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const containerRef = useRef<HTMLDivElement>(null);

    const filtered = (MOCK_APPS || []).filter(app => app.includes(search));

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative group" ref={containerRef}>
            <div 
                className={`w-full h-10 px-4 border rounded-lg flex items-center justify-between cursor-pointer bg-white transition-all ${isOpen ? 'border-blue-500 ring-2 ring-blue-50 shadow-sm' : 'border-slate-200 group-hover:border-slate-300'}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-2 truncate">
                    <AppWindow size={16} className={value ? 'text-blue-500' : 'text-slate-400'} />
                    <span className={`text-[13px] truncate ${value ? 'text-slate-800 font-bold' : 'text-slate-400'}`}>
                        {value || '请搜索选择所属应用'}
                    </span>
                </div>
                <ChevronDown size={16} className={`text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl z-50 overflow-hidden animate-fadeIn">
                    <div className="p-2 border-b border-slate-50">
                        <div className="relative">
                            <input 
                                type="text" 
                                autoFocus
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="搜索应用名称..."
                                className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-100 rounded-lg text-xs outline-none focus:bg-white focus:border-blue-300 transition-all"
                            />
                            <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
                        </div>
                    </div>
                    <div className="max-h-56 overflow-y-auto custom-scrollbar py-1">
                        {(filtered || []).map(app => (
                            <div 
                                key={app}
                                onClick={() => { onChange(app); setIsOpen(false); setSearch(''); }}
                                className={`px-4 py-2 text-[13px] cursor-pointer flex items-center justify-between transition-colors ${value === app ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                {app}
                                {value === app && <Check size={14} />}
                            </div>
                        ))}
                        {(filtered || []).length === 0 && (
                            <div className="p-6 text-center text-xs text-slate-400 font-medium">未找到相关应用</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// --- 子组件: 层级页签 ---
const TabLayer: React.FC<{ label: string; active?: boolean; icon?: React.ReactNode; onClick: () => void }> = ({ label, active, icon, onClick }) => (
    <div 
        onClick={onClick}
        className={`relative flex items-center gap-1.5 px-1 py-4 text-[13px] font-bold cursor-pointer transition-all whitespace-nowrap ${active ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}
    >
      {icon}
      {label}
      {active && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full" />}
    </div>
);

// --- 子组件: 递归目录项 ---
const RecursiveTreeNode: React.FC<{ 
    node: ResourceTreeNode; 
    activeId: string; 
    onSelect: (id: string) => void;
    level: number;
    defaultExpanded?: boolean;
}> = ({ node, activeId, onSelect, level, defaultExpanded = false }) => {
    const [isExpanded, setIsExpanded] = useState(defaultExpanded);
    const hasChildren = node.children && node.children.length > 0;
    const isActive = activeId === node.id;

    return (
        <div className="flex flex-col">
            <div 
                className={`
                    flex items-center gap-2 h-9 px-3 rounded-lg cursor-pointer transition-all group
                    ${isActive ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                `}
                style={{ paddingLeft: `${(level * 18) + 12}px` }}
                onClick={() => {
                    onSelect(node.id);
                    if (hasChildren) setIsExpanded(!isExpanded);
                }}
            >
                <div className="w-4 flex items-center justify-center flex-shrink-0">
                    {hasChildren && (
                        <ChevronRight 
                            size={14} 
                            className={`text-slate-300 transition-transform ${isExpanded ? 'rotate-90' : ''}`} 
                            onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }}
                        />
                    )}
                </div>
                <Folder 
                    size={15} 
                    className={`${isActive ? 'text-blue-600' : 'text-slate-400 group-hover:text-blue-500'} flex-shrink-0`} 
                    fill={isActive ? "currentColor" : "none"} 
                    fillOpacity={0.1} 
                />
                <span className="truncate text-[13px] tracking-tight whitespace-nowrap">{node.label}</span>
            </div>
            {hasChildren && isExpanded && (
                <div className="flex flex-col animate-fadeIn">
                    {(node.children || []).map(child => (
                        <RecursiveTreeNode 
                            key={child.id} 
                            node={child} 
                            activeId={activeId} 
                            onSelect={onSelect} 
                            level={level + 1}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

// 辅助组件...
const SectionHeader: React.FC<{ title: string; icon?: React.ReactNode }> = ({ title, icon }) => (
  <div className="flex items-center gap-2.5 mb-2 whitespace-nowrap">
    {icon ? icon : <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>}
    <h3 className="text-[15px] font-bold text-slate-800 tracking-tight">{title}</h3>
  </div>
);

const FormItem: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => {
  return (
    <div className="space-y-2">
      <label className="text-[13px] font-bold text-slate-700 ml-1 whitespace-nowrap block truncate">
        {required && <span className="text-red-500 mr-1">*</span>}
        {label}
      </label>
      {children}
    </div>
  );
};
