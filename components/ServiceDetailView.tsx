
import React, { useState } from 'react';
import { 
  Undo2, 
  Map as MapIcon, 
  Globe, 
  Layers, 
  Database, 
  Code2, 
  Terminal, 
  Info, 
  Settings2, 
  Plus, 
  Minus, 
  Maximize, 
  CheckCircle2, 
  FileCode,
  Table as TableIcon,
  Copy,
  Check,
  Link as LinkIcon
} from 'lucide-react';
import { APIRow } from '../constants';

interface ServiceDetailViewProps {
  api: APIRow;
  onBack: () => void;
  showSql?: boolean; // 增加控制 SQL 显示的属性
}

export const ServiceDetailView: React.FC<ServiceDetailViewProps> = ({ api, onBack, showSql = false }) => {
  const isSpatial = api.category === '时空数据服务';
  const [zoom, setZoom] = useState(5);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [mapType, setMapType] = useState<'satellite' | 'roadmap' | 'terrain'>('satellite');
  const [showLayerMenu, setShowLayerMenu] = useState(false);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // 模拟生成时空数据服务的多协议地址
  const spatialAddresses = [
    { type: 'WMTS', url: `https://map-service.local/arcgis/rest/services/${api.name}/MapServer/WMTS` },
    { type: 'WMS', url: `https://map-service.local/arcgis/services/${api.name}/MapServer/WmsServer` },
    { type: 'WFS', url: `https://map-service.local/arcgis/services/${api.name}/MapServer/WFSServer` },
    { type: 'XYZ', url: `https://map-service.local/tiles/${api.id}/{z}/{x}/{y}.png` }
  ];

  return (
    <div className="flex flex-col h-full bg-[#f8fafc] animate-fadeIn">
      {/* Header */}
      <div className="bg-white border-b border-slate-200 px-8 py-4 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400 hover:text-blue-600 transition-colors">
            <Undo2 size={20} />
          </button>
          <div className="h-6 w-px bg-slate-200"></div>
          <div className="flex flex-col">
            <h2 className="text-[16px] font-bold text-slate-800 flex items-center gap-2">
                {api.name}
            </h2>
            <div className="text-[11px] text-slate-400 font-medium flex items-center gap-2">
                <span className="text-blue-600">{api.category}</span>
                <span className="opacity-30">/</span>
                <span>创建时间：{api.createTime}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        {isSpatial ? (
          <div className="flex h-full animate-slideUp">
            {/* Left Column: Spatial Metadata */}
            <div className="w-[480px] flex-shrink-0 flex flex-col border-r border-slate-100 bg-white p-8 overflow-y-auto custom-scrollbar text-pretty">
                <DetailSection title="基础信息" icon={<Info size={16} className="text-blue-600" />}>
                   <div className="space-y-5">
                      <DetailItem label="服务名称" value={api.name} />
                      <DetailItem 
                        label="服务类型" 
                        value={api.category} 
                      />
                      <div className="flex flex-col gap-2">
                        <span className="text-slate-400 text-sm font-medium">描述</span>
                        <div className="bg-slate-50/80 border border-slate-100 rounded-lg p-3 text-[13px] text-slate-700 font-bold leading-relaxed shadow-inner">
                            {api.description || '暂无描述'}
                        </div>
                      </div>
                   </div>
                </DetailSection>

                <div className="h-px bg-slate-100 my-8" />

                {/* 状态信息区块 */}
                <DetailSection title="状态信息" icon={<Info size={16} className="text-blue-600" />}>
                   <div className="space-y-4">
                      <DetailItem label="运行状态" value="正常" isStatus />
                      <DetailItem label="最后修改" value={api.createTime} />
                   </div>
                </DetailSection>

                <div className="h-px bg-slate-100 my-8" />

                {/* 服务地址区块 */}
                <DetailSection title="服务访问地址" icon={<LinkIcon size={16} className="text-blue-600" />}>
                    <div className="space-y-3 mt-2">
                        {spatialAddresses.map((addr) => (
                            <div key={addr.type} className="group relative bg-slate-50 rounded-lg border border-slate-100 p-3 hover:border-blue-200 hover:bg-white transition-all">
                                <div className="flex items-center justify-between mb-1.5">
                                    <span className="text-[10px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded uppercase tracking-wider">{addr.type}</span>
                                    <button 
                                        onClick={() => handleCopy(addr.url, addr.type)}
                                        className={`p-1 rounded transition-colors ${copiedId === addr.type ? 'text-emerald-500' : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'}`}
                                        title="复制地址"
                                    >
                                        {copiedId === addr.type ? <Check size={14} /> : <Copy size={14} />}
                                    </button>
                                </div>
                                <div className="text-[11px] font-mono text-slate-500 break-all leading-relaxed pr-6">
                                    {addr.url}
                                </div>
                                {copiedId === addr.type && (
                                    <div className="absolute top-2 right-8 text-[10px] font-bold text-emerald-500 animate-fadeIn">已复制</div>
                                )}
                            </div>
                        ))}
                    </div>
                </DetailSection>

                <div className="h-px bg-slate-100 my-8" />

                <DetailSection title="空间配置信息" icon={<Globe size={16} className="text-blue-600" />}>
                   <div className="space-y-4">
                      <DetailItem label="空间坐标系" value={api.crs || 'EPSG:4326'} />
                      <DetailItem label="数据类型" value={api.dataType || '矢量'} />
                      <DetailItem label="数据格式" value={api.dataFormat || '.shp'} />
                      <DetailItem label="数据源" value={api.dataSource || '默认数据中心'} />
                      <DetailItem label="渲染样式" value={api.styleName || 'MVT (Vector Tile)'} />
                   </div>
                </DetailSection>

                <div className="h-px bg-slate-100 my-8" />

                <DetailSection title="图层预览范围" icon={<Layers size={16} className="text-blue-600" />}>
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 grid grid-cols-2 gap-4">
                        <CoordinateBox label="Min X" value="112.936" />
                        <CoordinateBox label="Min Y" value="30.072" />
                        <CoordinateBox label="Max X" value="113.795" />
                        <CoordinateBox label="Max Y" value="30.532" />
                    </div>
                </DetailSection>
            </div>

            {/* Right Column: Map Preview */}
            <div className="flex-1 bg-[#0f172a] relative overflow-hidden group">
                 {/* Map Background Layers */}
                 <div className="absolute inset-0 z-0">
                    {/* Satellite (Hybrid) Layer */}
                    <div 
                        className={`absolute inset-0 transition-opacity duration-700 ${mapType === 'satellite' ? 'opacity-100' : 'opacity-0'}`}
                        style={{ 
                            backgroundImage: 'url("https://www.google.com/maps/vt?lyrs=y@189&gl=cn&x=26&y=13&z=5")',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            transform: `scale(${1 + (zoom - 5) * 0.05})`
                        }}
                    >
                        {/* Overlay to simulate labels/grid */}
                        <div className="absolute inset-0 bg-black/10 mix-blend-overlay"></div>
                    </div>

                    {/* Roadmap Layer */}
                    <div 
                        className={`absolute inset-0 transition-opacity duration-700 ${mapType === 'roadmap' ? 'opacity-100' : 'opacity-0'}`}
                        style={{ 
                            backgroundImage: 'url("https://www.google.com/maps/vt?lyrs=m@189&gl=cn&x=26&y=13&z=5")',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            transform: `scale(${1 + (zoom - 5) * 0.05})`
                        }}
                    >
                        <div className="absolute inset-0 bg-white/5 mix-blend-overlay"></div>
                    </div>

                    {/* Terrain Layer */}
                    <div 
                        className={`absolute inset-0 transition-opacity duration-700 ${mapType === 'terrain' ? 'opacity-100' : 'opacity-0'}`}
                        style={{ 
                            backgroundImage: 'url("https://www.google.com/maps/vt?lyrs=p@189&gl=cn&x=26&y=13&z=5")',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center',
                            transform: `scale(${1 + (zoom - 5) * 0.05})`
                        }}
                    >
                        <div className="absolute inset-0 bg-black/5 mix-blend-overlay"></div>
                    </div>
                 </div>

                 <div className="absolute top-6 left-6 z-10">
                    <div className="bg-white/90 backdrop-blur px-3 py-1.5 rounded-full border border-slate-200/50 shadow-lg flex items-center gap-4 text-[11px] font-mono text-slate-600">
                        <span>ZOOM: {zoom}</span>
                        <div className="w-px h-3 bg-slate-300"></div>
                        <span>114.32°E, 30.21°N</span>
                    </div>
                 </div>

                 {/* Vector Features Overlay */}
                 <div 
                    className="absolute inset-0 z-5 transition-transform duration-500 ease-out flex items-center justify-center pointer-events-none"
                    style={{ transform: `scale(${1 + (zoom - 5) * 0.1})` }}
                  >
                     <svg className="absolute inset-0 w-full h-full opacity-90">
                        <path d="M400,200 L450,220 L480,180 L440,150 Z" fill="#3b82f6" fillOpacity="0.3" stroke="#3b82f6" strokeWidth="2" />
                        <circle cx="520" cy="250" r="6" fill="#ef4444" stroke="white" strokeWidth="2" />
                        <path d="M300,100 Q400,150 500,100" fill="none" stroke="#10b981" strokeWidth="3" strokeDasharray="6" />
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

                  {/* Layer Switcher - Figure 2 Style */}
                  <div className="absolute bottom-6 right-6 z-20 flex flex-col items-end gap-2">
                    {showLayerMenu && (
                        <div className="bg-white/95 backdrop-blur-md rounded-xl shadow-2xl border border-slate-200 p-2 flex gap-2 animate-slideUp">
                            <MapTypeOption 
                                active={mapType === 'satellite'} 
                                onClick={() => { setMapType('satellite'); setShowLayerMenu(false); }}
                                label="卫星图"
                                img="https://www.google.com/maps/vt?lyrs=y@189&gl=cn&x=26&y=13&z=5"
                            />
                            <MapTypeOption 
                                active={mapType === 'roadmap'} 
                                onClick={() => { setMapType('roadmap'); setShowLayerMenu(false); }}
                                label="电子地图"
                                img="https://www.google.com/maps/vt?lyrs=m@189&gl=cn&x=26&y=13&z=5"
                            />
                            <MapTypeOption 
                                active={mapType === 'terrain'} 
                                onClick={() => { setMapType('terrain'); setShowLayerMenu(false); }}
                                label="地形图"
                                img="https://www.google.com/maps/vt?lyrs=p@189&gl=cn&x=26&y=13&z=5"
                            />
                        </div>
                    )}
                    <button 
                        onClick={() => setShowLayerMenu(!showLayerMenu)}
                        className={`w-12 h-12 rounded-xl border-4 overflow-hidden shadow-xl transition-all hover:scale-105 active:scale-95 ${showLayerMenu ? 'border-blue-500 ring-4 ring-blue-500/20' : 'border-white'}`}
                    >
                        <img 
                            src={
                                mapType === 'satellite' ? "https://www.google.com/maps/vt?lyrs=y@189&gl=cn&x=26&y=13&z=5" :
                                mapType === 'roadmap' ? "https://www.google.com/maps/vt?lyrs=m@189&gl=cn&x=26&y=13&z=5" :
                                "https://www.google.com/maps/vt?lyrs=p@189&gl=cn&x=26&y=13&z=5"
                            }
                            className="w-full h-full object-cover"
                            alt="Layer Switcher"
                        />
                    </button>
                  </div>
                  
                  <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
                     <div className="bg-white/80 backdrop-blur border border-slate-200/50 p-1 rounded-lg flex items-center gap-1">
                        <span className="px-3 py-1 bg-white text-blue-600 rounded shadow-sm text-[10px] font-bold">2D</span>
                        <span className="px-3 py-1 text-slate-400 text-[10px] font-bold">3D</span>
                     </div>
                  </div>
            </div>
          </div>
        ) : (
          <div className="h-full overflow-y-auto custom-scrollbar p-8 animate-slideUp">
            <div className="max-w-5xl mx-auto space-y-6">
                
                {/* Basic Info Card */}
                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm flex gap-12 text-pretty">
                   <div className="flex-1 space-y-6">
                      <DetailSection title="服务基础配置" icon={<Settings2 size={16} className="text-blue-600" />}>
                         <div className="grid grid-cols-2 gap-y-6 gap-x-12 mt-4">
                            <div className="col-span-2 space-y-2">
                                <span className="text-slate-400 text-sm font-medium">接口访问地址</span>
                                <div className="flex items-center gap-2 group">
                                    <div className="flex-1 bg-slate-50 border border-slate-200 rounded-lg px-4 py-2 font-mono text-blue-600 text-sm overflow-hidden text-ellipsis whitespace-nowrap shadow-inner group-hover:border-blue-300 group-hover:bg-white transition-all">
                                        {api.path || '/未配置'}
                                    </div>
                                    <button 
                                        onClick={() => handleCopy(api.path || '', 'main-api')}
                                        className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border transition-all font-bold text-xs ${copiedId === 'main-api' ? 'bg-emerald-50 border-emerald-200 text-emerald-600' : 'bg-white border-slate-200 text-slate-600 hover:border-blue-400 hover:text-blue-600 shadow-sm active:scale-95'}`}
                                    >
                                        {copiedId === 'main-api' ? <Check size={14} /> : <Copy size={14} />}
                                        {copiedId === 'main-api' ? '已复制' : '复制地址'}
                                    </button>
                                </div>
                            </div>
                            <DetailItem label="服务类型" value={api.category} />
                            {/* 接口协议的值改为 RESTful */}
                            <DetailItem label="接口协议" value="RESTful" isCode />
                            <DetailItem label="请求方式" value={api.method || 'POST'} />
                            <DetailItem label="服务协议" value={api.protocol || 'HTTP'} />
                            <DetailItem label="数据源" value={api.dataSource || '未绑定'} />
                         </div>
                      </DetailSection>
                   </div>
                   <div className="w-80 space-y-6">
                      <DetailSection title="状态信息" icon={<Info size={16} className="text-blue-600" />}>
                         <div className="space-y-4 mt-4">
                            <DetailItem label="运行状态" value="正常" isStatus />
                            <DetailItem label="最后修改" value={api.createTime} />
                         </div>
                      </DetailSection>
                   </div>
                </div>

                {/* SQL or Logic Definition - 增加 showSql 判断 */}
                {api.sql && showSql && (
                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
                        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                            <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                                <Code2 size={16} className="text-indigo-500" /> 数据逻辑定义 (SQL)
                            </div>
                        </div>
                        <div className="bg-[#1e1e2d] p-6 font-mono text-[14px] text-emerald-400 leading-relaxed min-h-[120px]">
                            {api.sql}
                        </div>
                    </div>
                )}

                {/* Parameters Listing */}
                <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-10">
                    <DetailSection title="参数映射配置" icon={<TableIcon size={16} className="text-blue-600" />}>
                        <div className="space-y-8 mt-6">
                            {/* Request Params */}
                            <div className="space-y-3">
                                <div className="text-[12px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <div className="w-1 h-3 bg-blue-500 rounded-full"></div>
                                    请求参数清单 <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">{api.requestParams?.length || 0}</span>
                                </div>
                                <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100 text-xs uppercase tracking-wider">
                                            <tr>
                                                <th className="px-4 py-2.5 font-semibold">参数名</th>
                                                <th className="px-4 py-2.5 font-semibold">绑定字段</th>
                                                <th className="px-4 py-2.5 font-semibold">类型</th>
                                                <th className="px-4 py-2.5 font-semibold">位置</th>
                                                <th className="px-4 py-2.5 font-semibold">必填</th>
                                                <th className="px-4 py-2.5 font-semibold">描述</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {api.requestParams?.map((p, i) => (
                                                <tr key={i} className="hover:bg-slate-50/50">
                                                    <td className="px-4 py-2 font-bold text-slate-700">{p.name}</td>
                                                    <td className="px-4 py-2 text-slate-500 font-mono">{p.field}</td>
                                                    <td className="px-4 py-2"><span className="text-blue-600 font-medium">{p.type}</span></td>
                                                    <td className="px-4 py-2 text-slate-400 font-bold uppercase">{p.loc}</td>
                                                    <td className="px-4 py-2">{p.required ? <CheckCircle2 size={14} className="text-emerald-500" /> : '-'}</td>
                                                    <td className="px-4 py-2 text-slate-400">{p.desc}</td>
                                                </tr>
                                            ))}
                                            {(!api.requestParams || api.requestParams.length === 0) && (
                                              <tr><td colSpan={6} className="p-8 text-center text-slate-300 italic">暂无自定义请求参数</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Response Params */}
                            <div className="space-y-3">
                                <div className="text-[12px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <div className="w-1 h-3 bg-emerald-500 rounded-full"></div>
                                    返回结果定义 <span className="px-1.5 py-0.5 bg-slate-100 rounded text-[10px]">{api.responseParams?.length || 0}</span>
                                </div>
                                <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100 text-xs uppercase tracking-wider">
                                            <tr>
                                                <th className="px-4 py-2.5 font-semibold">参数名</th>
                                                <th className="px-4 py-2.5 font-semibold">绑定字段</th>
                                                <th className="px-4 py-2.5 font-semibold">返回类型</th>
                                                <th className="px-4 py-2.5 font-semibold">备注说明</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {api.responseParams?.map((p, i) => (
                                                <tr key={i} className="hover:bg-slate-50/50">
                                                    <td className="px-4 py-2 font-bold text-slate-700">{p.name}</td>
                                                    <td className="px-4 py-2 text-slate-500 font-mono">{p.field}</td>
                                                    <td className="px-4 py-2"><span className="text-emerald-600 font-medium">{p.type}</span></td>
                                                    <td className="px-4 py-2 text-slate-400">{p.desc}</td>
                                                </tr>
                                            ))}
                                            {(!api.responseParams || api.responseParams.length === 0) && (
                                              <tr><td colSpan={4} className="p-8 text-center text-slate-300 italic">暂无自定义返回参数</td></tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* 分页参数配置 (系统固定) - 图一复刻 */}
                            <div className="space-y-3">
                                <div className="text-[12px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                                    <div className="w-1 h-3 bg-[#4ade80] rounded-full"></div>
                                    分页参数配置 (系统固定)
                                </div>
                                <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                                    <table className="w-full text-left text-xs">
                                        <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-100 text-xs uppercase tracking-wider">
                                            <tr>
                                                <th className="px-4 py-2.5 font-semibold">参数名称</th>
                                                <th className="px-4 py-2.5 font-semibold">类型</th>
                                                <th className="px-4 py-2.5 font-semibold">位置</th>
                                                <th className="px-4 py-2.5 font-semibold">必填</th>
                                                <th className="px-4 py-2.5 font-semibold">默认值</th>
                                                <th className="px-4 py-2.5 font-semibold">最大值</th>
                                                <th className="px-4 py-2.5 font-semibold">描述</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100 text-slate-600 font-medium">
                                            <tr className="hover:bg-slate-50/50">
                                                <td className="px-4 py-3 font-bold text-slate-800">pageNum</td>
                                                <td className="px-4 py-3">INT</td>
                                                <td className="px-4 py-3 text-slate-400">QUERY</td>
                                                <td className="px-4 py-3 text-slate-400">否</td>
                                                <td className="px-4 py-3"><span className="bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">1</span></td>
                                                <td className="px-4 py-3 text-slate-300">-</td>
                                                <td className="px-4 py-3 text-slate-500">当前页码，从1开始计目</td>
                                            </tr>
                                            <tr className="hover:bg-slate-50/50">
                                                <td className="px-4 py-3 font-bold text-slate-800">pageSize</td>
                                                <td className="px-4 py-3">INT</td>
                                                <td className="px-4 py-3 text-slate-400">QUERY</td>
                                                <td className="px-4 py-3 text-slate-400">否</td>
                                                <td className="px-4 py-3"><span className="bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">10</span></td>
                                                <td className="px-4 py-3"><span className="bg-slate-50 border border-slate-100 px-2 py-0.5 rounded">100</span></td>
                                                <td className="px-4 py-3 text-slate-500">每页展示条数，单次最大限制100</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>
                    </DetailSection>
                </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Internal Helpers
const DetailSection: React.FC<{ title: string; icon: React.ReactNode; children: React.ReactNode }> = ({ title, icon, children }) => (
    <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-[14px] font-bold text-slate-800 tracking-tight">{title}</h3>
        </div>
        {children}
    </div>
);

const DetailItem: React.FC<{ 
  label: string; 
  value: string; 
  vertical?: boolean; 
  isCode?: boolean; 
  isStatus?: boolean;
  extra?: React.ReactNode;
}> = ({ label, value, vertical, isCode, isStatus, extra }) => (
    <div className={`flex ${vertical ? 'flex-col gap-3' : 'items-center justify-between'} text-sm`}>
        <span className="text-slate-400 font-medium whitespace-nowrap">{label}</span>
        <div className={`flex items-center ${vertical ? 'w-full' : ''}`}>
            <span className={`
                font-bold 
                ${vertical ? 'text-slate-800 leading-relaxed block text-[13px]' : 'truncate max-w-[240px] text-slate-700'}
                ${isCode ? 'bg-slate-100 px-2 py-0.5 rounded font-mono text-blue-600 text-xs' : ''}
                ${isStatus ? 'text-emerald-500 flex items-center gap-1' : ''}
            `}>
                {isStatus && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></div>}
                {value}
            </span>
            {extra}
        </div>
    </div>
);

const CoordinateBox: React.FC<{ label: string; value: string }> = ({ label, value }) => (
    <div className="flex flex-col gap-0.5">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{label}</span>
        <span className="text-sm font-mono font-bold text-slate-700">{value}</span>
    </div>
);

const MapTypeOption: React.FC<{ active: boolean; onClick: () => void; label: string; img: string }> = ({ active, onClick, label, img }) => (
    <button 
        onClick={onClick}
        className={`flex flex-col items-center gap-1.5 p-1 rounded-lg transition-all ${active ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
    >
        <div className={`w-16 h-16 rounded-md overflow-hidden border-2 transition-all ${active ? 'border-blue-500 shadow-md' : 'border-transparent'}`}>
            <img src={img} className="w-full h-full object-cover" alt={label} />
        </div>
        <span className={`text-[10px] font-black ${active ? 'text-blue-600' : 'text-slate-500'}`}>{label}</span>
    </button>
);
