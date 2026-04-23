import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  ShieldAlert, 
  X, 
  Database, 
  ChevronRight, 
  ChevronDown, 
  Table, 
  Columns, 
  CheckCircle2, 
  AlertCircle,
  Scan,
  Hand,
  ExternalLink,
  Trash2,
  RefreshCw,
  Loader2,
  SearchCode
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SensitiveDataConfig } from '../types';

interface Props {
  onNavigate?: (id: string) => void;
}

// Mock Data
const MOCK_SOURCES = [
  { id: 'src-1', name: '农业生产管理数据库', type: 'MySQL' },
  { id: 'src-2', name: '时空影像资源中心', type: 'PostgreSQL' },
  { id: 'src-3', name: '政务共享交换平台', type: 'Oracle' },
  { id: 'src-4', name: '气象监测实时库', type: 'InfluxDB' },
];

const SOURCE_TYPES = ['MySQL', 'PostgreSQL', 'Oracle', 'SQL Server', 'MongoDB', 'InfluxDB'];

const MOCK_DB_TREE = [
  {
    id: 'db-1',
    label: 'production_db',
    type: 'db',
    children: [
      {
        id: 'schema-1',
        label: 'public',
        type: 'schema',
        children: [
          {
            id: 'table-1',
            label: 'user_info',
            type: 'table',
            children: [
              { id: 'col-1', label: 'user_name', type: 'column' },
              { id: 'col-2', label: 'id_card', type: 'column' },
              { id: 'col-3', label: 'phone_number', type: 'column' },
              { id: 'col-4', label: 'address', type: 'column' },
            ]
          },
          {
            id: 'table-2',
            label: 'crop_records',
            type: 'table',
            children: [
              { id: 'col-5', label: 'farmer_id', type: 'column' },
              { id: 'col-6', label: 'location_geom', type: 'column' },
              { id: 'col-7', label: 'yield_amount', type: 'column' },
            ]
          }
        ]
      }
    ]
  }
];

const MOCK_RULES = [
  { id: 'rule-1', name: '身份证号识别规则', defaultAlgo: '部分遮盖（保留前三后四）' },
  { id: 'rule-2', name: '手机号识别规则', defaultAlgo: '部分遮盖（保留前三后四）' },
  { id: 'rule-3', name: '电子邮箱识别', defaultAlgo: '假名化' },
  { id: 'rule-4', name: '姓名/法人识别', defaultAlgo: '部分遮盖（保留前三后四）' },
];

const MOCK_ALGORITHMS = [
  '全脱敏（*）',
  '部分遮盖（保留前三后四）',
  '哈希脱敏',
  '假名化',
  '自定义正则',
  'MD5',
  '高斯扰动'
];

const INITIAL_SENSITIVE_DATA: SensitiveDataConfig[] = [
  { id: '1', dataSource: '农业生产管理数据库', dbSchema: 'production_db/public', tableName: 'user_info', columnName: 'id_card', maskingAlgorithm: '部分遮盖（保留前三后四）', status: 'enabled' },
  { id: '2', dataSource: '农业生产管理数据库', dbSchema: 'production_db/public', tableName: 'user_info', columnName: 'phone_number', maskingAlgorithm: '部分遮盖（保留前三后四）', status: 'enabled' },
  { id: '3', dataSource: '政务共享交换平台', dbSchema: 'gov_share/dbo', tableName: 'land_owners', columnName: 'owner_name', maskingAlgorithm: '假名化', status: 'disabled' },
];

export const SensitiveDataConfigPanel: React.FC<Props> = ({ onNavigate }) => {
  const [data, setData] = useState<SensitiveDataConfig[]>(INITIAL_SENSITIVE_DATA);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [addMode, setAddMode] = useState<'manual' | 'scan' | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Manual/Scan Common States
  const [selectedSourceType, setSelectedSourceType] = useState('');
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [selectedTables, setSelectedTables] = useState<string[]>([]);
  const [selectedRules, setSelectedRules] = useState<string[]>([]);
  
  // Scan Specific States
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanLogs, setScanLogs] = useState<string[]>([]);
  const [scanResults, setScanResults] = useState<any[]>([]);
  const [previewSearchTerm, setPreviewSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Manual Config States
  const [manualStep, setManualStep] = useState(1);
  const [manualSelectedSource, setManualSelectedSource] = useState('');
  const [selectedColumns, setSelectedColumns] = useState<any[]>([]);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['db-1', 'schema-1']));
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({});

  const resetModal = () => {
    setIsModalOpen(false);
    setAddMode(null);
    setManualStep(1);
    setSelectedSourceType('');
    setSelectedSources([]);
    setSelectedTables([]);
    setSelectedRules([]);
    setIsScanning(false);
    setScanProgress(0);
    setScanLogs([]);
    setScanResults([]);
    setManualSelectedSource('');
    setSelectedColumns([]);
    setColumnMappings({});
  };

  const handleStartScan = () => {
    setIsScanning(true);
    setScanProgress(0);
    setScanLogs(['正在连接数据源...', '获取表结构信息...', '开始执行探查任务...']);
    
    let progress = 0;
    const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 15) + 5;
      if (progress >= 100) {
        progress = 100;
        clearInterval(interval);
        finishScan();
      }
      setScanProgress(progress);
      if (progress > 30 && progress < 40) setScanLogs(prev => [...prev, '正在匹配识别规则: 身份证号识别规则']);
      if (progress > 60 && progress < 70) setScanLogs(prev => [...prev, '正在匹配识别规则: 手机号识别规则']);
      if (progress === 100) setScanLogs(prev => [...prev, '扫描任务完成，成功识别 4 个敏感项']);
    }, 400);
  };

  const finishScan = () => {
    setIsScanning(false);
    // Generate Mock Results
    const mockResults = [
      { id: 'res-1', db: 'prod_db', table: 'user_info', column: 'user_name', rule: '姓名/法人识别', algorithm: '部分遮盖（保留前三后四）' },
      { id: 'res-2', db: 'prod_db', table: 'user_info', column: 'id_card', rule: '身份证号识别规则', algorithm: '部分遮盖（保留前三后四）' },
      { id: 'res-3', db: 'prod_db', table: 'admin_sys', column: 'mobile', rule: '手机号识别规则', algorithm: '部分遮盖（保留前三后四）' },
      { id: 'res-4', db: 'gov_platform', table: 'farmers', column: 'contact_email', rule: '电子邮箱识别', algorithm: '假名化' },
    ];
    setScanResults(mockResults);
  };

  const handleConfirmScan = () => {
    const newConfigs: SensitiveDataConfig[] = scanResults.map(res => ({
      id: Math.random().toString(36).substr(2, 9),
      dataSource: MOCK_SOURCES[0].name, // Using a fallback for demo
      dbSchema: res.db,
      tableName: res.table,
      columnName: res.column,
      maskingAlgorithm: res.algorithm,
      status: 'enabled'
    }));
    setData([...newConfigs, ...data]);
    resetModal();
  };

  const removeResult = (id: string) => {
    setScanResults(prev => prev.filter(r => r.id !== id));
  };

  const filteredPreview = scanResults.filter(r => 
    r.table.includes(previewSearchTerm) || r.column.includes(previewSearchTerm) || r.rule.includes(previewSearchTerm)
  );

  const paginatedResults = filteredPreview.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedNodes);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedNodes(next);
  };

  const handleToggleColumn = (col: any, path: string) => {
    const fullId = `${path}/${col.label}`;
    const exists = selectedColumns.find(c => c.fullId === fullId);
    if (exists) {
      setSelectedColumns(selectedColumns.filter(c => c.fullId !== fullId));
    } else {
      setSelectedColumns([...selectedColumns, { ...col, fullId, path }]);
      if (!columnMappings[fullId]) {
        setColumnMappings(prev => ({ ...prev, [fullId]: MOCK_ALGORITHMS[0] }));
      }
    }
  };

  const handleSaveManual = () => {
    const newConfigs: SensitiveDataConfig[] = selectedColumns.map(col => ({
      id: Math.random().toString(36).substr(2, 9),
      dataSource: MOCK_SOURCES.find(s => s.id === manualSelectedSource)?.name || '',
      dbSchema: col.path.split('/').slice(0, 2).join('/'),
      tableName: col.path.split('/').pop() || '',
      columnName: col.label,
      maskingAlgorithm: columnMappings[col.fullId] || '无',
      status: 'enabled'
    }));
    
    setData([...newConfigs, ...data]);
    resetModal();
  };

  const renderTree = (nodes: any[], path: string = '') => {
    return nodes.map(node => {
      const currentPath = path ? `${path}/${node.label}` : node.label;
      const isExpanded = expandedNodes.has(node.id);
      
      return (
        <div key={node.id} className="ml-4">
          <div 
            className={`flex items-center gap-2 py-1.5 px-2 rounded-lg cursor-pointer hover:bg-slate-100 transition-colors ${node.type === 'column' ? 'pl-6' : ''}`}
            onClick={() => {
              if (node.type !== 'column') toggleExpand(node.id);
            }}
          >
            {node.type !== 'column' && (
              <div className="text-slate-400">
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </div>
            )}
            {node.type === 'db' && <Database size={14} className="text-blue-500" />}
            {node.type === 'schema' && <ShieldAlert size={14} className="text-indigo-400" />}
            {node.type === 'table' && <Table size={14} className="text-emerald-500" />}
            {node.type === 'column' && (
              <div className="flex items-center gap-2 w-full">
                <input 
                  type="checkbox" 
                  checked={!!selectedColumns.find(c => c.fullId === `${path}/${node.label}`)}
                  onChange={() => handleToggleColumn(node, path)}
                  className="rounded text-blue-600 focus:ring-blue-500"
                />
                <Columns size={14} className="text-slate-400" />
              </div>
            )}
            <span className={`text-xs font-medium ${node.type === 'column' ? 'text-slate-600' : 'text-slate-800'}`}>{node.label}</span>
          </div>
          {isExpanded && node.children && renderTree(node.children, currentPath)}
        </div>
      );
    });
  };

  const filteredData = data.filter(item => 
    item.tableName.includes(searchTerm) || item.columnName.includes(searchTerm) || item.dataSource.includes(searchTerm)
  );

  return (
    <div className="flex flex-col h-full bg-white animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
            <ShieldAlert size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">敏感数据配置</h2>
            <p className="text-xs text-slate-400 font-medium">识别和管理各数据源中的敏感字段及其脱敏策略</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-100"
        >
          <Plus size={18} />
          配置敏感数据
        </button>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-4 flex items-center gap-4 bg-slate-50/50">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="搜索数据源、表或列名..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all">
          <Filter size={16} />
          所有数据源
        </button>
      </div>

      {/* Main Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left border-b border-slate-100">
              <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider pl-4">数据源</th>
              <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">数据库/Schema</th>
              <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">表/视图</th>
              <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">敏感列</th>
              <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">脱敏算法</th>
              <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">启用状态</th>
              <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider text-right pr-4">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredData.map((item) => (
              <tr key={item.id} className="group hover:bg-blue-50/30 transition-colors">
                <td className="py-4 pl-4 text-sm font-bold text-slate-700">{item.dataSource}</td>
                <td className="py-4 text-sm text-slate-600 font-medium">{item.dbSchema}</td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <Table size={14} className="text-emerald-500" />
                    <span className="text-sm text-slate-600 font-medium">{item.tableName}</span>
                  </div>
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <Columns size={14} className="text-blue-400" />
                    <span className="text-sm font-black text-slate-700">{item.columnName}</span>
                  </div>
                </td>
                <td className="py-4">
                  <span className="px-2 py-1 bg-amber-50 text-amber-700 rounded text-[11px] font-black border border-amber-100 whitespace-nowrap">
                    {item.maskingAlgorithm}
                  </span>
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${item.status === 'enabled' ? 'bg-green-500' : 'bg-slate-300'}`} />
                    <span className={`text-xs font-bold ${item.status === 'enabled' ? 'text-green-600' : 'text-slate-400'}`}>
                      {item.status === 'enabled' ? '已启用' : '已停用'}
                    </span>
                  </div>
                </td>
                <td className="py-4 text-right pr-4">
                  <div className="flex items-center justify-end gap-2">
                    <button className="text-[12px] font-bold text-blue-600 hover:text-blue-800 transition-colors">编辑</button>
                    <button className="text-[12px] font-bold text-red-500 hover:text-red-700 transition-colors ml-2">删除</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Main Configuration Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={resetModal} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`relative w-full ${!addMode ? 'max-w-xl' : 'max-w-6xl'} bg-white rounded-3xl shadow-2xl overflow-hidden transition-all duration-500`}
            >
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                    <Plus size={22} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">
                    {!addMode ? '配置敏感数据' : `配置敏感数据 - ${addMode === 'manual' ? '手动添加' : '扫描识别'}`}
                  </h3>
                </div>
                <button onClick={resetModal} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"><X size={20} /></button>
              </div>

              {!addMode ? (
                <div className="p-10">
                  <div className="grid grid-cols-2 gap-6">
                    <div onClick={() => setAddMode('manual')} className="group p-8 rounded-3xl border-2 border-slate-100 hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer flex flex-col items-center text-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Hand size={32} /></div>
                      <div>
                        <h4 className="text-lg font-bold text-slate-800">手动添加</h4>
                        <p className="text-sm text-slate-400 mt-1">从已有数据源手动选取敏感字段进行配置</p>
                      </div>
                    </div>
                    <div onClick={() => setAddMode('scan')} className="group p-8 rounded-3xl border-2 border-slate-100 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all cursor-pointer flex flex-col items-center text-center gap-4">
                      <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center group-hover:scale-110 transition-transform"><Scan size={32} /></div>
                      <div>
                        <h4 className="text-lg font-bold text-slate-800">扫描识别</h4>
                        <p className="text-sm text-slate-400 mt-1">利用算法自动扫描源端识别潜在敏感数据</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : addMode === 'manual' ? (
                <div className="flex flex-col h-[600px]">
                   <div className="px-8 py-4 bg-slate-50 border-b border-slate-100 flex items-center gap-6">
                    <div className={`flex items-center gap-2 ${manualStep >= 1 ? 'text-blue-600' : 'text-slate-400'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${manualStep >= 1 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>1</div>
                      <span className="text-xs font-bold whitespace-nowrap">选择数据源</span>
                    </div>
                    <div className="h-px bg-slate-200 flex-1"></div>
                    <div className={`flex items-center gap-2 ${manualStep >= 2 ? 'text-blue-600' : 'text-slate-400'}`}>
                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black ${manualStep >= 2 ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-500'}`}>2</div>
                      <span className="text-xs font-bold whitespace-nowrap">选取敏感字段</span>
                    </div>
                  </div>

                  {manualStep === 1 ? (
                    <div className="flex-1 p-8">
                       <h4 className="text-sm font-bold text-slate-700 mb-4">请选择需要配置的数据源</h4>
                       <div className="grid grid-cols-1 gap-3 overflow-y-auto max-h-[350px]">
                         {MOCK_SOURCES.map(source => (
                           <div 
                            key={source.id}
                            onClick={() => setManualSelectedSource(source.id)}
                            className={`p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${manualSelectedSource === source.id ? 'border-blue-500 bg-blue-50' : 'border-slate-100 hover:border-slate-300'}`}
                           >
                             <div className="flex items-center gap-4">
                               <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${manualSelectedSource === source.id ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                 <Database size={20} />
                               </div>
                               <span className="text-sm font-bold text-slate-800">{source.name}</span>
                             </div>
                             {manualSelectedSource === source.id && <CheckCircle2 className="text-blue-600" size={20} />}
                           </div>
                         ))}
                       </div>
                    </div>
                  ) : (
                    <div className="flex-1 flex overflow-hidden">
                      <div className="w-[350px] border-r border-slate-100 flex flex-col bg-slate-50/30">
                        <div className="p-4 border-b border-slate-100 bg-white">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">数据库目录</h4>
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                            <input type="text" placeholder="搜索表或字段..." className="w-full pl-7 pr-3 py-1.5 bg-slate-100 border-none rounded-lg text-[11px] focus:ring-2 focus:ring-blue-500/20" />
                          </div>
                        </div>
                        <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">{renderTree(MOCK_DB_TREE)}</div>
                      </div>
                      <div className="flex-1 flex flex-col">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-white">
                          <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">脱敏算法映射 (已选 {selectedColumns.length} 个字段)</h4>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
                          {selectedColumns.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-200">
                               <AlertCircle size={32} className="opacity-20 mb-2" /><span className="text-xs font-medium">请在左侧选取敏感列</span>
                            </div>
                          ) : (
                            selectedColumns.map(col => (
                              <div key={col.fullId} className="flex items-center gap-4 p-4 bg-white border border-slate-200 rounded-2xl shadow-sm">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 mb-1"><Columns size={12} className="text-blue-500" /><span className="text-[11px] font-black text-slate-400 truncate mt-0.5">{col.path}</span></div>
                                  <div className="text-sm font-black text-slate-800 truncate">{col.label}</div>
                                </div>
                                <div className="w-[200px]">
                                   <select value={columnMappings[col.fullId]} onChange={(e) => setColumnMappings(prev => ({ ...prev, [col.fullId]: e.target.value }))} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold outline-none">
                                      {MOCK_ALGORITHMS.map(algo => (<option key={algo} value={algo}>{algo}</option>))}
                                   </select>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                  <div className="px-8 py-6 bg-slate-50 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button onClick={() => manualStep === 1 ? setAddMode(null) : setManualStep(1)} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-all">{manualStep === 1 ? '上一步' : '返回'}</button>
                    {manualStep === 1 ? (
                      <button onClick={() => setManualStep(2)} disabled={!manualSelectedSource} className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition-all shadow-lg">下一步：选取字段</button>
                    ) : (
                      <button onClick={handleSaveManual} disabled={selectedColumns.length === 0} className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition-all shadow-lg">确认保存配置</button>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-[750px]">
                  <div className="p-8 border-b border-slate-100 overflow-y-auto custom-scrollbar flex-1">
                    <div className="grid grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="space-y-2">
                           <label className="text-sm font-bold text-slate-700">数据源类型 <span className="text-red-500">*</span></label>
                           <div className="flex flex-wrap gap-2">
                             {SOURCE_TYPES.map(t => (
                               <button key={t} onClick={() => setSelectedSourceType(t)} className={`px-3 py-1.5 rounded-lg text-xs font-bold border-2 transition-all ${selectedSourceType === t ? 'border-indigo-500 bg-indigo-50 text-indigo-700' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}>{t}</button>
                             ))}
                           </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">数据源名称 <span className="text-red-500">*</span> (多选)</label>
                          <div className="grid grid-cols-1 gap-2 max-h-[150px] overflow-y-auto p-2 border border-slate-100 rounded-xl bg-slate-50/50">
                             {MOCK_SOURCES.map(s => (
                               <label key={s.id} className="flex items-center gap-3 p-2 hover:bg-white rounded-lg transition-colors cursor-pointer group">
                                 <input type="checkbox" checked={selectedSources.includes(s.id)} onChange={(e) => { if (e.target.checked) setSelectedSources([...selectedSources, s.id]); else setSelectedSources(selectedSources.filter(id => id !== s.id)); }} className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4" />
                                 <div className="flex items-center gap-2"><Database size={14} className="text-slate-400 group-hover:text-indigo-500 transition-colors" /><span className="text-xs font-bold text-slate-700">{s.name}</span></div>
                               </label>
                             ))}
                          </div>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">数据表 (多选，选填)</label>
                          <div className="flex flex-wrap gap-2 p-3 border border-slate-100 rounded-xl bg-slate-50/50">
                            {['user_info', 'crop_records', 'farmers', 'land_owners'].map(t => (
                              <button key={t} onClick={() => { if (selectedTables.includes(t)) setSelectedTables(selectedTables.filter(name => name !== t)); else setSelectedTables([...selectedTables, t]); }} className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider transition-all ${selectedTables.includes(t) ? 'bg-indigo-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200'}`}>{t}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                           <label className="text-sm font-bold text-slate-700">识别规则 <span className="text-red-500">*</span> (多选)</label>
                           <button onClick={() => onNavigate?.('identification_rules')} className="flex items-center gap-1 text-[11px] font-black text-blue-600 hover:text-blue-800 transition-colors bg-blue-50 px-2 py-1 rounded-md"><Plus size={12} />快捷创建规则</button>
                        </div>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
                          {MOCK_RULES.map(rule => (
                            <div key={rule.id} onClick={() => { if (selectedRules.includes(rule.id)) setSelectedRules(selectedRules.filter(id => id !== rule.id)); else setSelectedRules([...selectedRules, rule.id]); }} className={`p-3 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between ${selectedRules.includes(rule.id) ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 hover:border-slate-300'}`}>
                              <div className="flex items-center gap-3">
                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedRules.includes(rule.id) ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}><SearchCode size={16} /></div>
                                <div className="flex flex-col"><span className="text-xs font-bold text-slate-800">{rule.name}</span><span className="text-[10px] text-slate-400 font-medium">默认算法: {rule.defaultAlgo}</span></div>
                              </div>
                              {selectedRules.includes(rule.id) && <CheckCircle2 className="text-indigo-600" size={18} />}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                    {isScanning && (
                      <div className="mt-8 p-6 bg-slate-900 rounded-3xl text-white">
                        <div className="flex items-center justify-between mb-4"><div className="flex items-center gap-3"><Loader2 size={18} className="animate-spin text-indigo-400" /><span className="text-sm font-bold tracking-tight">智能识别引擎扫描中...</span></div><span className="text-xs font-black text-indigo-400 font-mono">{scanProgress}%</span></div>
                        <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mb-4"><div style={{ width: `${scanProgress}%` }} className="h-full bg-gradient-to-r from-indigo-500 to-blue-400" /></div>
                        <div className="h-[80px] overflow-y-auto custom-scrollbar bg-black/30 rounded-xl p-3 font-mono text-[10px] space-y-1">{scanLogs.map((log, i) => (<div key={i} className="flex items-center gap-2"><span className="text-indigo-500 opacity-50 shrink-0">[{new Date().toLocaleTimeString()}]</span><span className="text-slate-300">{log}</span></div>))}</div>
                      </div>
                    )}
                    {scanResults.length > 0 && !isScanning && (
                      <div className="mt-8 space-y-4">
                        <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                          <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-600 flex items-center justify-center"><CheckCircle2 size={18} /></div><div><h4 className="text-sm font-bold text-emerald-800">识别完成</h4><p className="text-[11px] text-emerald-600">系统共匹配到 {scanResults.length} 个潜在敏感项。</p></div></div>
                          <div className="flex items-center gap-2"><div className="relative"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} /><input type="text" placeholder="过滤搜索..." value={previewSearchTerm} onChange={(e) => setPreviewSearchTerm(e.target.value)} className="pl-9 pr-4 py-1.5 bg-white border border-emerald-200 rounded-xl text-xs w-[200px]" /></div><button onClick={() => { setPreviewSearchTerm(''); setCurrentPage(1); }} className="p-1.5 text-slate-400 hover:text-blue-600 bg-white border border-slate-200 rounded-lg"><RefreshCw size={14} /></button></div>
                        </div>
                        <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden shadow-sm">
                           <table className="w-full border-collapse">
                             <thead><tr className="text-left bg-slate-50 border-b border-slate-100"><th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">库名</th><th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">表名</th><th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">列名</th><th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">识别规则</th><th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest">脱敏算法</th><th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">操作</th></tr></thead>
                             <tbody className="divide-y divide-slate-50">
                                {paginatedResults.map(res => (
                                  <tr key={res.id} className="hover:bg-slate-50 transition-colors"><td className="px-4 py-3 text-xs font-medium text-slate-500 uppercase">{res.db}</td><td className="px-4 py-3 text-xs font-bold text-slate-800">{res.table}</td><td className="px-4 py-3 text-xs font-black text-blue-600">{res.column}</td><td className="px-4 py-3 text-xs font-medium">{res.rule}</td><td className="px-4 py-3"><select value={res.algorithm} onChange={(e) => { const update = scanResults.map(r => r.id === res.id ? { ...r, algorithm: e.target.value } : r); setScanResults(update); }} className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold outline-none">{MOCK_ALGORITHMS.map(a => <option key={a} value={a}>{a}</option>)}</select></td><td className="px-4 py-3 text-right"><button onClick={() => removeResult(res.id)} className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"><Trash2 size={14} /></button></td></tr>
                                ))}
                             </tbody>
                           </table>
                           {filteredPreview.length > pageSize && (<div className="px-4 py-3 border-t border-slate-50 flex items-center justify-between bg-slate-50/50"><span className="text-[10px] text-slate-400 font-bold">显示 {Math.min(filteredPreview.length, currentPage * pageSize)} / 共 {filteredPreview.length} 项</span><div className="flex items-center gap-1"><button onClick={() => setCurrentPage(p => Math.max(1, p-1))} className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold disabled:opacity-50" disabled={currentPage === 1}>上页</button><button onClick={() => setCurrentPage(p => p + 1)} className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold disabled:opacity-50" disabled={currentPage * pageSize >= filteredPreview.length}>下页</button></div></div>)}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="px-8 py-6 bg-slate-50 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button onClick={() => setAddMode(null)} className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-all">取消扫描</button>
                    {scanResults.length === 0 ? (<button onClick={handleStartScan} disabled={!selectedSourceType || selectedSources.length === 0 || selectedRules.length === 0 || isScanning} className="px-10 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition-all shadow-lg flex items-center gap-2">{isScanning ? <Loader2 size={18} className="animate-spin" /> : <Scan size={18} />}立即开始扫描识别</button>) : (<button onClick={handleConfirmScan} className="px-10 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold transition-all shadow-lg">确定并添加敏感数据</button>)}
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
