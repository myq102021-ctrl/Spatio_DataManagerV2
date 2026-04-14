import React, { useState, useRef } from 'react';
import { Undo2, Map, Heart, Share2, Copy, Download, Info, ShieldCheck, Layers, Table, ChevronDown, Plus, Minus, Globe, CheckCircle2, Circle, PanelLeftClose, PanelLeftOpen, FileKey, Camera, Upload, Image as ImageIcon, X, RefreshCw, Tag, Check, Scale, AlertTriangle, ScrollText, Copyright } from 'lucide-react';

interface DataDetailPanelProps {
  onBack: () => void;
}

const SERVICE_THUMBNAIL_URL = "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/World_map_blank_without_borders.svg/1280px-World_map_blank_without_borders.svg.png";

const RECOMMENDED_TAGS = [
    '国土空间', '自然资源', '生态保护', '交通路网', 
    '公共设施', '水利设施', '地质灾害', '遥感影像', 
    '地形地貌', '气象水文', '社会经济', '历史文化'
];

export const DataDetailPanel: React.FC<DataDetailPanelProps> = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('preview');
  const [isServicesExpanded, setIsServicesExpanded] = useState(false);
  const [mapStyle, setMapStyle] = useState<'vector' | 'satellite'>('vector');
  
  // Layer Management State
  const [isLayerPanelExpanded, setIsLayerPanelExpanded] = useState(true);
  const [activeLayerId, setActiveLayerId] = useState<number>(1);

  // Cover Image State
  const [previewImage, setPreviewImage] = useState("https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/China_edcp_location_map.svg/1024px-China_edcp_location_map.svg.png");
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Tags State
  const [tags, setTags] = useState(['行政区划', '城市规划', '2025年度', '矢量数据']);
  const [isTagPopoverOpen, setIsTagPopoverOpen] = useState(false);
  const [tagInputValue, setTagInputValue] = useState("");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
        const imageUrl = URL.createObjectURL(file);
        setTempImage(imageUrl);
    }
  };

  const handleSaveCover = () => {
      if (tempImage) {
          setPreviewImage(tempImage);
          setTempImage(null);
      }
      setIsUploadModalOpen(false);
  };

  const handleCloseModal = () => {
      setTempImage(null);
      setIsUploadModalOpen(false);
  }

  // Tags Handlers
  const handleAddCustomTag = () => {
    const val = tagInputValue.trim();
    if (val && !tags.includes(val)) {
        setTags([...tags, val]);
        setTagInputValue("");
    }
  };

  const toggleTag = (tag: string) => {
      if (tags.includes(tag)) {
          setTags(tags.filter(t => t !== tag));
      } else {
          setTags([...tags, tag]);
      }
  };

  const handleRemoveTag = (tagToRemove: string) => {
      setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  // Filter suggestions
  const filteredSuggestions = RECOMMENDED_TAGS.filter(t => 
      t.toLowerCase().includes(tagInputValue.toLowerCase())
  );

  // Check if current temp image is the service thumbnail
  const isServiceThumbnail = tempImage === SERVICE_THUMBNAIL_URL;

  const tabs = [
    { id: 'attributes', label: '属性表', icon: <Table size={14} /> },
    { id: 'service', label: '数据服务', icon: <Share2 size={14} /> },
    { id: 'metadata', label: '元数据信息', icon: <Info size={14} /> },
    { id: 'preview', label: '数据预览', icon: <Map size={14} /> },
    { id: 'copyright', label: '版权声明', icon: <ShieldCheck size={14} /> },
  ];

  const services = [
    {
        id: 1,
        name: "行政区划点位服务",
        url: "https://api.spatial-data.com/v1/services/yehan_1216002/feature_server",
        types: ["WFS", "GeoJSON"],
        dataType: "矢量点位",
        ref: "GCS_WGS_1984"
    },
    {
        id: 2,
        name: "人口密度分布图层",
        url: "https://api.spatial-data.com/v1/services/yehan_1216002/map_server",
        types: ["WMS", "WMTS"],
        dataType: "栅格影像",
        ref: "Web Mercator"
    },
    {
        id: 3,
        name: "基础路网矢量瓦片",
        url: "https://api.spatial-data.com/v1/services/yehan_1216002/vector_tiles",
        types: ["XYZ", "PBF"],
        dataType: "矢量瓦片",
        ref: "GCS_WGS_1984"
    }
  ];

  return (
    <div className="flex-1 flex flex-col bg-white h-full overflow-hidden animate-fadeIn relative">
      {/* Upload Modal */}
      {isUploadModalOpen && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
            <div className="bg-white rounded-xl shadow-2xl w-[450px] border border-slate-200 overflow-hidden transform transition-all scale-100">
                <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100">
                    <h3 className="font-bold text-base text-slate-800">更换数据封面</h3>
                    <button onClick={handleCloseModal} className="text-slate-400 hover:text-slate-600 p-1 hover:bg-slate-50 rounded-full transition-colors">
                        <X size={18} />
                    </button>
                </div>
                
                <div className="p-6">
                    {!tempImage ? (
                        <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 h-48 flex flex-col items-center justify-center cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-all group"
                        >
                            <div className="w-12 h-12 rounded-full bg-white border border-slate-200 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-sm">
                                <Upload size={20} className="text-blue-600" />
                            </div>
                            <span className="text-sm font-medium text-slate-600">点击上传图片</span>
                            <span className="text-xs text-slate-400 mt-1">支持 JPG, PNG, SVG 格式</span>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                accept="image/*"
                                onChange={handleFileChange}
                            />
                        </div>
                    ) : (
                        <div className="relative group rounded-xl overflow-hidden h-48 border border-slate-200 bg-slate-100">
                            <img src={tempImage} alt="Preview" className="w-full h-full object-cover" />
                            {/* Only show re-select button if it's NOT the service thumbnail (i.e. it's a user uploaded image) */}
                            {!isServiceThumbnail && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button 
                                        onClick={() => fileInputRef.current?.click()}
                                        className="bg-white/20 backdrop-blur text-white border border-white/40 px-3 py-1.5 rounded-lg text-xs font-medium hover:bg-white hover:text-slate-900 transition-all"
                                    >
                                        重新选择
                                    </button>
                                    <input 
                                        type="file" 
                                        ref={fileInputRef} 
                                        className="hidden" 
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                    <button 
                        className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 rounded-lg transition-colors shadow-sm flex items-center gap-2 mr-auto"
                        onClick={() => {
                            if (isServiceThumbnail) {
                                // If currently showing Service Thumbnail, switch to Upload Mode (null)
                                setTempImage(null);
                            } else {
                                // If currently in Upload Mode (null) or Custom Image, switch to Service Thumbnail
                                setTempImage(SERVICE_THUMBNAIL_URL);
                            }
                        }}
                    >
                        {isServiceThumbnail ? <Upload size={14} /> : <RefreshCw size={14} />}
                        {isServiceThumbnail ? "上传封面" : "切换服务缩略图"}
                    </button>
                    
                    <button 
                        onClick={handleCloseModal}
                        className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 hover:bg-slate-200/50 rounded-lg transition-colors"
                    >
                        取消
                    </button>
                    <button 
                        onClick={handleSaveCover}
                        disabled={!tempImage}
                        className={`px-4 py-2 text-sm font-medium text-white rounded-lg shadow-sm transition-all flex items-center gap-2 ${tempImage ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-200' : 'bg-slate-300 cursor-not-allowed'}`}
                    >
                        <CheckCircle2 size={14} />
                        提交
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Header Title Area */}
      <div className="flex justify-between items-center px-6 py-3 border-b border-slate-100/50 flex-shrink-0">
        <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
                 <Layers size={16} />
            </div>
            <h2 className="text-base font-bold text-slate-800">数据详情</h2>
        </div>
        <button 
            onClick={onBack}
            className="group flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 rounded-lg text-xs font-medium hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all shadow-sm"
        >
            <Undo2 size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span>返回列表</span>
        </button>
      </div>

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50/30">
        <div className="p-5">
            
            {/* Top Section: Overview Card */}
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] p-5 mb-5 flex gap-6">
                 {/* Thumbnail with Hover Effect */}
                 <div className="w-[280px] h-[200px] bg-slate-100 rounded-lg overflow-hidden border border-slate-200 flex-shrink-0 relative group shadow-inner">
                    <img 
                        src={previewImage}
                        alt="Map Preview" 
                        className="w-full h-full object-cover opacity-90 transition-transform duration-500 mix-blend-multiply"
                    />
                    <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm px-2 py-0.5 rounded text-[10px] text-white font-mono border border-white/20 z-10">
                        EPSG:4326
                    </div>

                    {/* Change Cover Button (Bottom Right) */}
                    <button 
                        onClick={() => setIsUploadModalOpen(true)}
                        className="absolute bottom-2 right-2 bg-slate-900/80 backdrop-blur-md text-white px-2.5 py-1.5 rounded-lg hover:bg-blue-600 transition-all opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 shadow-lg border border-white/10 z-20 flex items-center gap-1.5"
                    >
                        <Camera size={14} />
                        <span className="text-xs font-medium">更换封面</span>
                    </button>
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col min-w-0">
                    <div className="flex justify-between items-start mb-3">
                        <div>
                            <div className="flex items-center gap-3 mb-1.5">
                                <h1 className="text-base font-bold text-slate-800 tracking-tight">yehan_shp_1216002</h1>
                                <span className="px-2 py-0.5 bg-green-50 text-green-600 text-[10px] font-bold uppercase tracking-wider rounded border border-green-100/50">Published</span>
                            </div>
                            <p className="text-slate-500 text-sm line-clamp-2 max-w-2xl leading-relaxed">
                                该数据集包含了2025年度行政区划点位数据，适用于地理信息系统分析、城市规划及相关人口分布研究。数据精度高，属性字段完整。
                            </p>
                            
                            {/* Tags Section */}
                            <div className="flex flex-wrap items-center gap-2 mt-3 mb-4 relative z-20">
                                {tags.map((tag) => (
                                    <div key={tag} className="group relative px-2.5 py-0.5 bg-slate-100 text-slate-600 text-xs rounded-full border border-slate-200 flex items-center hover:bg-slate-200 hover:border-slate-300 transition-all cursor-default">
                                        <span className="font-medium text-xs">{tag}</span>
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                handleRemoveTag(tag);
                                            }}
                                            className="w-0 overflow-hidden group-hover:w-4 ml-0 group-hover:ml-0.5 transition-all duration-300 flex items-center justify-center text-slate-400 hover:text-red-500"
                                        >
                                            <X size={10} strokeWidth={3} />
                                        </button>
                                    </div>
                                ))}
                                
                                <div className="relative">
                                    <button 
                                        onClick={() => setIsTagPopoverOpen(!isTagPopoverOpen)}
                                        className={`px-2 py-0.5 text-xs border border-dashed rounded-full flex items-center gap-1 transition-all ${isTagPopoverOpen ? 'border-blue-500 bg-blue-50 text-blue-600' : 'text-blue-600 border-blue-300 hover:border-blue-500 hover:bg-blue-50 opacity-70 hover:opacity-100'}`}
                                    >
                                        <Plus size={10} strokeWidth={3} />
                                        <span className="font-medium text-xs">添加</span>
                                    </button>

                                    {/* Tag Popover */}
                                    {isTagPopoverOpen && (
                                        <>
                                            <div className="fixed inset-0 z-40" onClick={() => setIsTagPopoverOpen(false)}></div>
                                            <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-xl shadow-xl border border-slate-200 p-3 z-50 animate-in fade-in zoom-in-95 duration-200 origin-top-left ring-1 ring-slate-900/5">
                                                <div className="relative mb-3">
                                                    <input 
                                                        type="text" 
                                                        className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-200 rounded-lg outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-50 transition-all bg-slate-50 focus:bg-white"
                                                        placeholder="输入新标签按回车..."
                                                        autoFocus
                                                        value={tagInputValue}
                                                        onChange={(e) => setTagInputValue(e.target.value)}
                                                        onKeyDown={(e) => {
                                                            if (e.key === 'Enter') handleAddCustomTag();
                                                            if (e.key === 'Escape') setIsTagPopoverOpen(false);
                                                        }}
                                                    />
                                                    <Tag size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                                </div>
                                                
                                                <div className="max-h-48 overflow-y-auto custom-scrollbar">
                                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">推荐标签</div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {filteredSuggestions.map(tag => {
                                                            const isSelected = tags.includes(tag);
                                                            return (
                                                                <button 
                                                                    key={tag}
                                                                    onClick={() => toggleTag(tag)}
                                                                    className={`
                                                                        group flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium border transition-all
                                                                        ${isSelected 
                                                                            ? 'bg-blue-50 border-blue-200 text-blue-600 shadow-sm' 
                                                                            : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200 hover:bg-slate-50 hover:text-blue-600'}
                                                                    `}
                                                                >
                                                                    {isSelected && <Check size={10} strokeWidth={3} />}
                                                                    {tag}
                                                                </button>
                                                            )
                                                        })}
                                                        {filteredSuggestions.length === 0 && (
                                                            <div className="w-full text-center py-4 text-xs text-slate-400">
                                                                没有匹配的推荐标签
                                                                {tagInputValue && (
                                                                    <div className="mt-1 text-blue-600 cursor-pointer hover:underline" onClick={handleAddCustomTag}>
                                                                        按回车添加 "{tagInputValue}"
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                            <button className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors border border-slate-200 hover:border-red-200" title="收藏">
                                <Heart size={16} />
                            </button>
                             <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200 hover:border-blue-200" title="数据申请">
                                <FileKey size={16} />
                            </button>
                             <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200 hover:border-blue-200" title="下载数据">
                                <Download size={16} />
                            </button>
                        </div>
                    </div>

                    {/* Key Metrics Grid */}
                    <div className="bg-slate-50/50 rounded-lg border border-slate-100 p-3 grid grid-cols-3 gap-y-3 gap-x-8 text-xs mb-4">
                        <InfoItem label="数据格式" value="Vector Point" />
                        <InfoItem label="数据量" value="368.87 MB" highlight />
                        <InfoItem label="数据级别" value="公开" />
                        <InfoItem label="采集时间" value="2025-12-16 11:46" />
                        <InfoItem label="入库时间" value="2025-12-16 11:46" />
                        <InfoItem label="数据来源" value="市规划和自然资源局" />
                    </div>
                </div>
            </div>

            {/* Bottom Section: Tabs & Detailed Info */}
            <div className="bg-white rounded-xl border border-slate-200/60 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] min-h-[500px] flex flex-col">
                {/* Tabs Header */}
                 <div className="flex items-center px-4 pt-2 border-b border-slate-100 gap-6">
                    {tabs.map(tab => (
                        <DetailTab 
                            key={tab.id}
                            label={tab.label} 
                            icon={tab.icon} 
                            active={activeTab === tab.id}
                            onClick={() => setActiveTab(tab.id)}
                        />
                    ))}
                </div>

                {/* Tab Content Area */}
                <div className="flex-1 p-6 flex flex-col">
                    {activeTab === 'attributes' && (
                        <div className="animate-fadeIn w-full">
                            <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200 text-sm uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-2.5 font-semibold">字段名称</th>
                                            <th className="px-4 py-2.5 font-semibold">类型</th>
                                            <th className="px-4 py-2.5 font-semibold">长度</th>
                                            <th className="px-4 py-2.5 font-semibold">描述</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <TableRow name="OBJECTID" type="OID" length="4" desc="唯一标识符" />
                                        <TableRow name="NAME_CN" type="String" length="255" desc="中文名称" />
                                        <TableRow name="NAME_EN" type="String" length="255" desc="英文名称" />
                                        <TableRow name="Code_ID" type="Integer" length="10" desc="行政代码" />
                                        <TableRow name="Type_Code" type="String" length="50" desc="分类编码" />
                                        <TableRow name="City_Code" type="String" length="20" desc="城市代码" />
                                        <TableRow name="Shape_Area" type="Double" length="8" desc="几何面积" />
                                        <TableRow name="Shape_Len" type="Double" length="8" desc="几何周长" />
                                        <TableRow name="Create_Time" type="Date" length="8" desc="创建时间" />
                                        <TableRow name="Update_Time" type="Date" length="8" desc="更新时间" />
                                        <TableRow name="Creator" type="String" length="50" desc="创建人" />
                                        <TableRow name="Status" type="Integer" length="2" desc="数据状态" />
                                        <TableRow name="Remarks" type="String" length="500" desc="备注信息" />
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {activeTab === 'service' && (
                        <div className="space-y-4 animate-fadeIn">
                            {(isServicesExpanded ? services : services.slice(0, 2)).map((service, index) => (
                                <div key={service.id} className="bg-slate-50/50 rounded-lg border border-slate-100 p-5 hover:border-blue-200 transition-colors group relative">
                                    <div className="absolute top-0 right-0 p-3 opacity-10 pointer-events-none">
                                        <span className="text-4xl font-bold text-slate-400">0{index + 1}</span>
                                    </div>
                                    <div className="relative z-10 flex flex-col gap-5">
                                        
                                        {/* Top Row: Service Info in One Line (Grid) */}
                                        <div className="grid grid-cols-4 gap-6">
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs text-slate-400 font-medium ml-1">服务名称</span>
                                                <span className="text-sm font-bold text-slate-700 ml-1 truncate" title={service.name}>{service.name}</span>
                                            </div>
                                            
                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs text-slate-400 font-medium ml-1">服务类型</span>
                                                <div className="flex gap-2">
                                                    {service.types.map(t => (
                                                        <span key={t} className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">{t}</span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs text-slate-400 font-medium ml-1">数据类型</span>
                                                <span className="text-sm font-medium text-slate-700 ml-1">{service.dataType}</span>
                                            </div>

                                            <div className="flex flex-col gap-1">
                                                <span className="text-xs text-slate-400 font-medium ml-1">坐标系</span>
                                                <span className="text-sm font-medium text-slate-700 ml-1">{service.ref}</span>
                                            </div>
                                        </div>

                                        {/* URL Row */}
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-xs text-slate-400 font-medium ml-1">服务接口地址</span>
                                            <div className="flex items-center gap-2 relative">
                                                <div className="flex-1 bg-white border border-slate-200 rounded px-3 py-1.5 text-xs font-mono text-slate-600 overflow-hidden text-ellipsis whitespace-nowrap shadow-sm group-hover:border-blue-200 transition-colors">
                                                    {service.url}
                                                </div>
                                                <button className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="复制">
                                                    <Copy size={14} />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {/* Bounding Box Row */}
                                        <div className="flex flex-col gap-1.5">
                                            <span className="text-xs text-slate-400 font-medium ml-1">空间范围 (Bounding Box)</span>
                                            <div className="grid grid-cols-4 gap-4 bg-white p-3 rounded-lg border border-slate-200 shadow-sm">
                                                <CoordinateBox label="Min X" value="112.936966" />
                                                <CoordinateBox label="Min Y" value="30.072807" />
                                                <CoordinateBox label="Max X" value="113.795578" />
                                                <CoordinateBox label="Max Y" value="30.532038" />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}

                            {services.length > 2 && (
                                <div className="flex justify-center pt-2 pb-2">
                                    <button 
                                        onClick={() => setIsServicesExpanded(!isServicesExpanded)}
                                        className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-medium bg-blue-50 hover:bg-blue-100 px-5 py-2 rounded-full transition-all hover:shadow-sm"
                                    >
                                        {isServicesExpanded ? '收起更多服务' : `查看全部 ${services.length} 个服务`}
                                        <ChevronDown size={14} className={`transition-transform duration-300 ${isServicesExpanded ? 'rotate-180' : ''}`} />
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === 'metadata' && (
                         <div className="animate-fadeIn w-full">
                            <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                                <table className="w-full text-sm text-left">
                                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200 text-sm uppercase tracking-wider">
                                        <tr>
                                            <th className="px-4 py-2.5 font-semibold w-1/4">英文缩写名 (EN_Name)</th>
                                            <th className="px-4 py-2.5 font-semibold w-1/4">数据项名称 (CN_Name)</th>
                                            <th className="px-4 py-2.5 font-semibold">值 (Value)</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        <MetadataRow en="dataID" cn="数据名称" value="sla-iw1-sic-vh-" />
                                        <MetadataRow en="catagories" cn="数据分类" value="遥感遥测" />
                                        <MetadataRow en="dataSeclevel" cn="数据安全等级" value="公开" />
                                        <MetadataRow en="dataVer" cn="数据版本" value="V1.0" />
                                        <MetadataRow en="dataType" cn="数据类型" value="Vector / Point" />
                                        <MetadataRow en="publishTime" cn="发布时间" value="2025-12-16" />
                                        <MetadataRow en="uuid" cn="唯一标识" value="a1b2-c3d4-e5f6-g7h8" />
                                        <MetadataRow en="abstract" cn="摘要" value="该数据集包含了2025年度行政区划点位数据..." />
                                        <MetadataRow en="contact" cn="联系人" value="System Admin" />
                                    </tbody>
                                </table>
                            </div>
                         </div>
                    )}
                    
                    {activeTab === 'copyright' && (
                        <div className="animate-fadeIn w-full">
                            <div className="bg-slate-50/50 rounded-lg border border-slate-100 p-5 hover:border-blue-200 transition-colors group relative">
                                <p className="text-sm text-slate-600 leading-relaxed">
                                    该数据集的所有权及解释权归 <span className="font-bold text-slate-800">市规划和自然资源局</span> 所有。未经书面许可，任何单位和个人不得将本数据用于商业营利目的，不得对数据进行深度加工或转售。
                                </p>
                            </div>
                        </div>
                    )}

                    {activeTab === 'preview' && (
                         <div className="h-full relative bg-slate-100 rounded-xl border border-slate-200 overflow-hidden animate-fadeIn flex flex-col group min-h-[500px]">
                            {/* Layer Management - Top Left */}
                            <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                                <div 
                                    className={`
                                        bg-white/95 backdrop-blur-md border border-slate-200/80 rounded-lg shadow-lg ring-1 ring-slate-900/5 transition-all duration-300 overflow-hidden
                                        ${isLayerPanelExpanded ? 'w-64 p-3' : 'w-9 h-9 p-0 flex items-center justify-center cursor-pointer hover:bg-slate-50'}
                                    `}
                                    onClick={() => !isLayerPanelExpanded && setIsLayerPanelExpanded(true)}
                                    title={!isLayerPanelExpanded ? "展开图层管理" : ""}
                                >
                                    {isLayerPanelExpanded ? (
                                        <>
                                            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                                                <h4 className="text-xs font-bold text-slate-800 flex items-center gap-2 uppercase tracking-wide">
                                                    <Layers size={12} className="text-blue-600"/>
                                                    图层管理
                                                </h4>
                                                <button 
                                                    onClick={(e) => { e.stopPropagation(); setIsLayerPanelExpanded(false); }}
                                                    className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-100 transition-colors"
                                                >
                                                    <PanelLeftClose size={14} />
                                                </button>
                                            </div>
                                            <div className="space-y-1.5 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                                                {services.map((service) => (
                                                    <div 
                                                        key={service.id}
                                                        onClick={() => setActiveLayerId(service.id)}
                                                        className={`
                                                            flex items-center gap-2 p-2 rounded-md border text-left cursor-pointer transition-all duration-200 group/item
                                                            ${activeLayerId === service.id 
                                                                ? 'bg-blue-50/80 border-blue-200 shadow-sm' 
                                                                : 'bg-transparent border-transparent hover:bg-slate-50 hover:border-slate-100 text-slate-500'}
                                                        `}
                                                    >
                                                        <div className={`flex-shrink-0 transition-colors ${activeLayerId === service.id ? 'text-blue-600' : 'text-slate-300 group-hover/item:text-slate-400'}`}>
                                                            {activeLayerId === service.id ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className={`text-xs font-bold truncate ${activeLayerId === service.id ? 'text-blue-800' : 'text-slate-600'}`}>
                                                                {service.name || `Service ${service.id}`}
                                                            </div>
                                                            <div className="flex items-center gap-1.5 mt-0.5">
                                                                <span className="text-[10px] bg-slate-100 text-slate-500 px-1 rounded border border-slate-200 font-mono">
                                                                    {service.types[0]}
                                                                </span>
                                                            </div>
                                                        </div>
                                                        {activeLayerId === service.id && (
                                                            <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-sm"></div>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                        </>
                                    ) : (
                                        <PanelLeftOpen size={16} className="text-slate-500" />
                                    )}
                                </div>
                            </div>

                            {/* Map Controls - Top Right */}
                            <div className="absolute top-4 right-4 z-10 flex flex-col gap-3">
                                <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 p-1.5 rounded-lg shadow-lg flex flex-col gap-1 ring-1 ring-slate-900/5">
                                    <button 
                                        onClick={() => setMapStyle('vector')}
                                        className={`p-2 rounded-md transition-all duration-200 relative group/btn ${mapStyle === 'vector' ? 'text-blue-600 bg-blue-50 shadow-inner' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                                    >
                                        <Map size={18} />
                                        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover/btn:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">矢量地图</div>
                                    </button>
                                    <button 
                                        onClick={() => setMapStyle('satellite')}
                                        className={`p-2 rounded-md transition-all duration-200 relative group/btn ${mapStyle === 'satellite' ? 'text-blue-600 bg-blue-50 shadow-inner' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}
                                    >
                                        <Globe size={18} />
                                        <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover/btn:opacity-100 pointer-events-none whitespace-nowrap transition-opacity">影像底图</div>
                                    </button>
                                </div>
                                
                                <div className="bg-white/95 backdrop-blur-md border border-slate-200/80 p-1.5 rounded-lg shadow-lg flex flex-col gap-1 ring-1 ring-slate-900/5">
                                    <button className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"><Plus size={18} /></button>
                                    <div className="h-px bg-slate-100 mx-1"></div>
                                    <button className="p-2 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"><Minus size={18} /></button>
                                </div>
                            </div>

                            {/* The Map Canvas */}
                            <div className="flex-1 w-full h-full bg-slate-100 relative overflow-hidden">
                                <img 
                                    src={mapStyle === 'vector' ? "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/China_edcp_location_map.svg/1024px-China_edcp_location_map.svg.png" : "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ec/World_map_blank_without_borders.svg/1280px-World_map_blank_without_borders.svg.png"}
                                    alt="Map Background"
                                    className={`w-full h-full object-cover transform scale-125 transition-all duration-700 ease-in-out ${mapStyle === 'satellite' ? 'grayscale brightness-[0.85] invert contrast-125' : 'mix-blend-multiply opacity-60'}`}
                                />
                                
                                {/* Simulated Data Layer Visualization - Based on Active Layer */}
                                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                    
                                    {/* Layer 1: Feature Server (Points) */}
                                    {activeLayerId === 1 && (
                                        <>
                                            <div className="absolute top-[40%] left-[45%] w-32 h-32 bg-blue-500/10 rounded-full blur-[40px]"></div>
                                            <div className="absolute top-[42%] left-[48%] group/point pointer-events-auto cursor-pointer">
                                                <div className="w-3 h-3 bg-blue-600 rounded-full shadow-lg shadow-blue-500/50 border-2 border-white animate-pulse"></div>
                                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-800 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover/point:opacity-100 transition-opacity whitespace-nowrap">ID: 9013D</div>
                                            </div>
                                            <div className="absolute top-[38%] left-[52%]"><div className="w-2 h-2 bg-blue-500 rounded-full border border-white"></div></div>
                                            <div className="absolute top-[45%] left-[58%]"><div className="w-2 h-2 bg-blue-500 rounded-full border border-white"></div></div>
                                            <div className="absolute top-[55%] left-[45%]"><div className="w-2 h-2 bg-blue-500 rounded-full border border-white"></div></div>
                                            <div className="absolute top-[32%] left-[40%]"><div className="w-1.5 h-1.5 bg-blue-400 rounded-full opacity-60"></div></div>
                                        </>
                                    )}

                                    {/* Layer 2: Map Server (Heatmap/Overlay) */}
                                    {activeLayerId === 2 && (
                                        <>
                                            <div className="absolute top-[45%] left-[50%] w-64 h-64 bg-gradient-to-r from-red-500/30 via-yellow-500/20 to-transparent rounded-full blur-[30px] mix-blend-multiply"></div>
                                            <div className="absolute top-[35%] left-[40%] w-48 h-48 bg-orange-500/20 rounded-full blur-[40px] mix-blend-multiply"></div>
                                            <div className="absolute top-[25%] left-[30%] px-3 py-1 bg-white/80 backdrop-blur rounded shadow text-[10px] text-slate-600 border border-slate-200">
                                                人口密度: High
                                            </div>
                                        </>
                                    )}

                                    {/* Layer 3: Vector Tiles (Grid/Lines) */}
                                    {activeLayerId === 3 && (
                                        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'linear-gradient(#3b82f6 1px, transparent 1px), linear-gradient(90deg, #3b82f6 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
                                            <div className="absolute top-[30%] left-[30%] w-[40%] h-[1px] bg-blue-600 rotate-12"></div>
                                            <div className="absolute top-[60%] left-[20%] w-[50%] h-[1px] bg-blue-600 -rotate-6"></div>
                                        </div>
                                    )}
                                    
                                    {/* Selection Box Simulation (Common) */}
                                    <div className="absolute top-[35%] left-[42%] w-[20%] h-[25%] border-2 border-dashed border-slate-400/30 rounded-lg"></div>
                                </div>
                                
                                {/* Attribution */}
                                <div className="absolute bottom-1 right-1 px-2 py-0.5 bg-white/60 backdrop-blur text-[10px] text-slate-500 rounded pointer-events-none">
                                    © OpenStreetMap contributors
                                </div>
                            </div>

                            {/* Bottom Status Bar */}
                            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-10 w-full px-6 flex justify-center pointer-events-none">
                                <div className="bg-white/90 backdrop-blur-md border border-slate-200/80 pl-4 pr-1 py-1.5 rounded-full shadow-lg flex items-center justify-between text-xs text-slate-600 gap-6 pointer-events-auto ring-1 ring-slate-900/5">
                                    <div className="flex items-center gap-4 text-xs font-mono font-medium text-slate-500">
                                        <span className="flex items-center gap-1.5"><Globe size={12}/> ZOOM: 12</span>
                                        <div className="w-px h-3 bg-slate-200"></div>
                                        <span>CENTER: 113.32°E, 30.21°N</span>
                                    </div>
                                    <div className="pl-3 pr-3 py-1 bg-green-50 text-green-700 rounded-full text-[10px] font-bold border border-green-100 flex items-center gap-1.5">
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                                        ONLINE
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

const SectionTitle: React.FC<{ title: string }> = ({ title }) => (
    <h3 className="text-base font-bold text-slate-800 mb-3 flex items-center gap-2">
        <div className="w-1 h-3.5 bg-blue-600 rounded-full"></div>
        {title}
    </h3>
)

const InfoItem: React.FC<{ label: string; value: string; highlight?: boolean; icon?: React.ReactNode }> = ({ label, value, highlight, icon }) => (
    <div className="flex items-center gap-2">
        <span className="text-slate-400 text-xs whitespace-nowrap flex items-center gap-1.5">
            {icon}
            {label}:
        </span>
        <span className={`font-medium truncate ${highlight ? 'text-slate-800 font-bold' : 'text-slate-600'}`}>{value}</span>
    </div>
);

const DetailTab: React.FC<{ label: string; icon: React.ReactNode; active?: boolean; onClick?: () => void }> = ({ label, icon, active, onClick }) => (
    <div 
        onClick={onClick}
        className={`
        pb-3 border-b-2 text-sm font-medium cursor-pointer flex items-center gap-2 transition-colors
        ${active ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-200'}
    `}>
        {icon}
        {label}
    </div>
);

const CoordinateBox: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex flex-col">
        <span className="text-[10px] text-slate-400 uppercase mb-0.5">{label}</span>
        <span className="text-xs font-mono text-slate-600 font-medium">{value}</span>
    </div>
);

const TableRow: React.FC<{ name: string; type: string; length: string; desc: string }> = ({ name, type, length, desc }) => (
     <tr className="hover:bg-slate-50 transition-colors">
        <td className="px-4 py-2 font-mono text-slate-600 text-sm font-medium">{name}</td>
        <td className="px-4 py-2 text-slate-600 text-sm">{type}</td>
        <td className="px-4 py-2 text-slate-400 text-sm">{length}</td>
        <td className="px-4 py-2 text-slate-500 text-sm">{desc}</td>
    </tr>
);

const MetadataRow: React.FC<{ en: string; cn: string; value: string }> = ({ en, cn, value }) => (
    <tr className="hover:bg-slate-50 transition-colors">
        <td className="px-4 py-2 font-mono text-slate-600 text-sm font-medium">{en}</td>
        <td className="px-4 py-2 text-slate-600 text-sm">{cn}</td>
        <td className="px-4 py-2 text-slate-500 text-sm">{value}</td>
    </tr>
);