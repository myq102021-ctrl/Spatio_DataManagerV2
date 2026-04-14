
import React, { useState, useMemo } from 'react';
import { 
  Search, 
  X, 
  Plus, 
  ChevronDown, 
  RefreshCw, 
  Eye, 
  Edit2, 
  Trash2, 
  Lightbulb,
  FolderTree,
  Database,
  LayoutGrid,
  FolderPlus,
  AlertTriangle,
  FileText,
  Clock,
  ChevronLeft,
  ChevronRight,
  Send,
  ListOrdered,
  Info,
  CheckCircle2,
  MinusCircle
} from 'lucide-react';
import { APIRow } from '../constants';
import { APISelectModeModal } from './APISelectModeModal';
import { APICreationWizard } from './APICreationWizard';
import { APIScriptWizard } from './APIScriptWizard';
import { APISpatialWizard } from './APISpatialWizard';
import { ServiceDetailView } from './ServiceDetailView';

// 定义目录数据结构
export interface DirectoryNode {
  id: string;
  label: string;
  count?: number;
  children?: DirectoryNode[];
}

// 生成平铺路径用于下拉选择
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

interface ServiceDevelopmentPanelProps {
  apiData: APIRow[];
  setApiData: React.Dispatch<React.SetStateAction<APIRow[]>>;
  directories: DirectoryNode[];
  setDirectories: React.Dispatch<React.SetStateAction<DirectoryNode[]>>;
}

export const ServiceDevelopmentPanel: React.FC<ServiceDevelopmentPanelProps> = ({ 
  apiData = [], 
  setApiData, 
  directories = [], 
  setDirectories 
}) => {
  const [view, setView] = useState<'list' | 'create_wizard' | 'create_script' | 'create_spatial' | 'detail'>('list');
  const [activeTab, setActiveTab] = useState<'all' | 'draft'>('all');
  const [showModeModal, setShowModeModal] = useState(false);
  const [showAddDirModal, setShowAddDirModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showApiDeleteConfirm, setShowApiDeleteConfirm] = useState(false); 
  
  const [modalMode, setModalMode] = useState<'add' | 'edit'>('add');
  
  const [targetDirectory, setTargetDirectory] = useState<{id: string, label: string}>({ id: 'all', label: '全部服务' });
  const [apiToDelete, setApiToDelete] = useState<APIRow | null>(null); 
  
  const [activeDirectoryId, setActiveDirectoryId] = useState('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  const [selectedApi, setSelectedApi] = useState<APIRow | null>(null);
  const [editingApi, setEditingApi] = useState<APIRow | null>(null); 
  
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  // 多选状态
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const dirPaths = useMemo(() => getFlattenedPaths(directories), [directories]);

  const filteredData = useMemo(() => {
    return (apiData || []).filter(api => {
      if (activeTab === 'draft' && api.status !== 'offline') return false;
      const matchSearch = api.name.toLowerCase().includes(searchText.toLowerCase());
      if (activeDirectoryId === 'all') return matchSearch;
      return matchSearch && api.dirId === activeDirectoryId;
    });
  }, [activeTab, apiData, activeDirectoryId, searchText]);

  const offlineCount = (apiData || []).filter(a => a.status === 'offline').length;
  const onlineCount = (apiData || []).filter(a => a.status === 'online').length;

  const handleCreateClick = () => {
    setEditingApi(null); 
    setShowModeModal(true);
  };
  
  const handleSaveDraft = () => { setActiveTab('draft'); setView('list'); };
  
  const handleEditApi = (api: APIRow) => {
      setEditingApi(api); 
      if (api.category === '时空数据服务') setView('create_spatial');
      else if (api.type === '分析服务' || api.sql) setView('create_script');
      else setView('create_wizard');
  };
  
  const handleViewDetail = (api: APIRow) => { setSelectedApi(api); setView('detail'); };
  
  const handleConfirmDeleteApi = (api: APIRow) => {
      setApiToDelete(api);
      setShowApiDeleteConfirm(true);
  };

  const executeDeleteApi = () => {
      if (apiToDelete) {
          setApiData(prev => prev.filter(a => a.id !== apiToDelete.id));
          setSelectedIds(prev => {
              const next = new Set(prev);
              next.delete(apiToDelete.id);
              return next;
          });
          setShowApiDeleteConfirm(false);
          setApiToDelete(null);
      }
  };

  const handleToggleOnline = (id: string) => {
      setApiData(prev => prev.map(a => {
          if (a.id === id) return { ...a, status: a.status === 'online' ? 'offline' : 'online' };
          return a;
      }));
  };

  // 批量操作处理
  const handleBatchDelete = () => {
      if (selectedIds.size === 0) return;
      if (window.confirm(`确定要批量删除选中的 ${selectedIds.size} 个服务吗？`)) {
          setApiData(prev => prev.filter(api => !selectedIds.has(api.id)));
          setSelectedIds(new Set());
      }
  };

  const handleBatchOnline = () => {
      if (selectedIds.size === 0) return;
      setApiData(prev => prev.map(api => {
          if (selectedIds.has(api.id)) return { ...api, status: 'online' };
          return api;
      }));
      setSelectedIds(new Set());
  };

  const handleBatchOffline = () => {
      if (selectedIds.size === 0) return;
      setApiData(prev => prev.map(api => {
          if (selectedIds.has(api.id)) return { ...api, status: 'offline' };
          return api;
      }));
      setSelectedIds(new Set());
  };

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.checked) {
          setSelectedIds(new Set(filteredData.map(api => api.id)));
      } else {
          setSelectedIds(new Set());
      }
  };

  const handleSelectRow = (id: string) => {
      const next = new Set(selectedIds);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      setSelectedIds(next);
  };

  const handleRefreshDirectory = () => { setIsRefreshing(true); setTimeout(() => setIsRefreshing(false), 800); };
  const handleNodeAddDir = (dir: {id: string, label: string}) => { setModalMode('add'); setTargetDirectory(dir); setShowAddDirModal(true); };
  const handleGlobalAddDir = () => { setModalMode('add'); setTargetDirectory({ id: 'all', label: '全部服务' }); setShowAddDirModal(true); };
  const handleEditDir = (dir: {id: string, label: string}) => { setModalMode('edit'); setTargetDirectory(dir); setShowAddDirModal(true); };
  const handleDeleteDir = (dir: {id: string, label: string}) => { setTargetDirectory(dir); setShowDeleteConfirm(true); };
  const onDragStart = (id: string) => setDraggedId(id);
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const onDrop = (targetId: string) => {
    if (!draggedId || draggedId === targetId) return;
    const findAndMove = (nodes: DirectoryNode[]): DirectoryNode[] => {
      let sourceNode: DirectoryNode | null = null;
      const removeSource = (list: DirectoryNode[]): DirectoryNode[] => {
        return list.filter(node => {
          if (node.id === draggedId) { sourceNode = { ...node }; return false; }
          if (node.children) node.children = removeSource(node.children);
          return true;
        });
      };
      const newList = removeSource([...nodes]);
      if (!sourceNode) return nodes;
      const insertAtTarget = (list: DirectoryNode[]): DirectoryNode[] => {
        const result: DirectoryNode[] = [];
        for (const node of list) {
          result.push(node);
          if (node.id === targetId) result.push(sourceNode!);
          else if (node.children) node.children = insertAtTarget(node.children);
        }
        return result;
      };
      return insertAtTarget(newList);
    };
    setDirectories(findAndMove(directories));
    setDraggedId(null);
  };
  const handleSelectMode = (mode: 'spatial' | 'single_table' | 'sql') => {
    setShowModeModal(false);
    if (mode === 'sql') setView('create_script');
    else if (mode === 'spatial') setView('create_spatial');
    else setView('create_wizard');
  };

  if (view === 'create_wizard') return <APICreationWizard mode="single_table" onBack={() => setView('list')} onSaveDraft={handleSaveDraft} directories={directories} initialData={editingApi || undefined} />;
  if (view === 'create_script') return <APIScriptWizard onBack={() => setView('list')} onSaveDraft={handleSaveDraft} directories={directories} initialData={editingApi || undefined} />;
  if (view === 'create_spatial') return <APISpatialWizard onBack={() => setView('list')} onSaveDraft={handleSaveDraft} directories={directories} initialData={editingApi || undefined} />;
  
  if (view === 'detail' && selectedApi) return <ServiceDetailView api={selectedApi} onBack={() => setView('list')} showSql={true} />;

  return (
    <div className="flex-1 flex flex-col bg-white h-full animate-fadeIn overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-blue-600 rounded-full"></div>
          <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">服务开发</h2>
          <div className="relative group ml-1">
            <div className="p-1 hover:bg-slate-100 rounded-full cursor-help transition-colors">
              <Lightbulb size={16} className="text-slate-300 group-hover:text-yellow-500 transition-colors" />
            </div>
            <div className="absolute left-0 top-full mt-2 w-[320px] bg-slate-800/95 backdrop-blur-md text-white p-4 rounded-xl shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 translate-y-2 transition-all duration-300 z-[100] ring-1 ring-white/10 origin-top-left">
              <div className="flex items-center gap-2 mb-2 pb-2 border-b border-white/10">
                <Info size={14} className="text-blue-400" />
                <span className="text-[14px] font-bold tracking-wide">服务开发功能说明</span>
              </div>
              <div className="space-y-2.5 text-slate-300 text-[14px]">
                <p><strong className="text-white">多样化发布：</strong>支持向导、脚本及地图空间模式。</p>
                <p><strong className="text-white">标准兼容：</strong>兼容 OGC 及 RESTful 规范。</p>
                <p><strong className="text-white">全生命周期：</strong>从开发到流量监控一站式管理。</p>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg text-slate-600 text-[14px] font-medium hover:bg-slate-50 transition-all">
            <RefreshCw size={14} className="text-blue-500" />
            刷新
          </button>
          <button onClick={handleCreateClick} className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-[14px] font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100">
            <Plus size={16} />
            创建服务
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[300px] flex-shrink-0 flex flex-col border-r border-slate-100 bg-[#fcfdfe]/50">
          <div className="p-4 px-5">
            <div className="flex items-center justify-between h-12 mb-2">
              <div className="flex items-center gap-2 text-slate-800 font-bold text-[14px]">
                <FolderTree size={16} className="text-blue-600" />
                服务目录
              </div>
              <div className="flex items-center gap-2">
                <button onClick={handleRefreshDirectory} className={`p-1 text-slate-400 hover:text-blue-600 ${isRefreshing ? 'animate-spin' : ''}`}><RefreshCw size={16} /></button>
                <button onClick={handleGlobalAddDir} className="p-1 text-slate-400 hover:text-blue-600"><FolderPlus size={18} /></button>
              </div>
            </div>
            <div className="relative">
              <input type="text" placeholder="搜索目录..." className="w-full h-9 pl-8 pr-3 bg-slate-100/50 border border-slate-200 rounded-lg text-[14px] outline-none focus:bg-white focus:border-blue-400 transition-all" />
              <Search className="absolute left-2.5 top-2.5 text-slate-400" size={13} />
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-2 pb-4 custom-scrollbar">
            <div className="space-y-0.5">
              <DirectoryTreeItem 
                node={{ id: 'all', label: '全部服务', count: onlineCount + offlineCount }}
                activeId={activeDirectoryId}
                onSelect={setActiveDirectoryId}
                onAdd={handleNodeAddDir}
                onEdit={handleEditDir}
                onDelete={handleDeleteDir}
                isRoot
                expanded
                onDragStart={onDragStart}
                onDragOver={onDragOver}
                onDrop={onDrop}
              >
                {(directories || []).map(node => (
                  <DirectoryNodeRenderer 
                    key={node.id} 
                    node={node} 
                    activeId={activeDirectoryId}
                    onSelect={setActiveDirectoryId}
                    onAdd={handleNodeAddDir}
                    onEdit={handleEditDir}
                    onDelete={handleDeleteDir}
                    onDragStart={onDragStart}
                    onDragOver={onDragOver}
                    onDrop={onDrop}
                    draggedId={draggedId}
                  />
                ))}
              </DirectoryTreeItem>
            </div>
          </div>
        </div>

        <div className="flex-1 flex flex-col p-6 overflow-hidden bg-white">
          <div className="flex items-center gap-8 border-b border-slate-100 mb-2 h-12">
            <button onClick={() => { setActiveTab('all'); setSelectedIds(new Set()); }} className={`h-full flex items-center gap-2 text-[14px] font-bold transition-all relative ${activeTab === 'all' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
              服务列表
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeTab === 'all' ? 'bg-blue-50 text-blue-600 font-black' : 'bg-slate-100 text-slate-400'}`}>{apiData.filter(a => a.status === 'online' || !apiData.some(ad => ad.id === a.id && ad.status === 'online')).length}</span>
              {activeTab === 'all' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full animate-fadeIn" />}
            </button>
            <button onClick={() => { setActiveTab('draft'); setSelectedIds(new Set()); }} className={`h-full flex items-center gap-2 text-[14px] font-bold transition-all relative ${activeTab === 'draft' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}>
              草稿箱
              <span className={`px-1.5 py-0.5 rounded text-[10px] ${activeTab === 'draft' ? 'bg-blue-50 text-blue-600 font-black' : 'bg-slate-100 text-slate-400'}`}>{offlineCount}</span>
              {activeTab === 'draft' && <div className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-600 rounded-full animate-fadeIn" />}
            </button>
          </div>
          
          <div className="mb-4 pt-4 flex items-center justify-between min-h-[44px]">
            {selectedIds.size > 0 ? (
                <div className="flex items-center gap-4 bg-blue-50/50 border border-blue-100 px-4 py-2 rounded-xl animate-fadeIn w-full justify-between">
                    <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-sm">
                            {selectedIds.size}
                        </div>
                        <span className="text-[14px] font-bold text-slate-700 tracking-tight">已选中 {selectedIds.size} 个服务项</span>
                        <button 
                            onClick={() => setSelectedIds(new Set())}
                            className="text-xs text-slate-400 hover:text-blue-600 font-medium ml-2"
                        >
                            取消选择
                        </button>
                    </div>
                    <div className="flex items-center gap-2">
                        <button 
                            onClick={handleBatchDelete}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-200 text-red-500 hover:bg-red-50 rounded-lg text-[13px] font-bold transition-all shadow-sm"
                        >
                            <Trash2 size={14} /> 批量删除
                        </button>
                        {/* 仅在“服务列表”页签展示批量上线/下线操作 */}
                        {activeTab === 'all' && (
                            <>
                                <button 
                                    onClick={handleBatchOnline}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-200 text-blue-600 hover:bg-blue-50 rounded-lg text-[13px] font-bold transition-all shadow-sm"
                                >
                                    <CheckCircle2 size={14} /> 批量上线
                                </button>
                                <button 
                                    onClick={handleBatchOffline}
                                    className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-lg text-[13px] font-bold transition-all shadow-sm"
                                >
                                    <MinusCircle size={14} /> 批量下线
                                </button>
                            </>
                        )}
                    </div>
                </div>
            ) : (
                <div className="relative max-sm group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="text" value={searchText} onChange={(e) => setSearchText(e.target.value)} placeholder="搜索服务名称..." className="w-80 h-9 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400 text-[14px] transition-all" />
                </div>
            )}
          </div>

          <div className="flex-1 overflow-auto border border-slate-100 rounded-xl shadow-sm">
            <table className="w-full text-left text-[14px] border-collapse">
              <thead className="bg-[#f8fafc] text-[#475569] border-b border-slate-100 sticky top-0 z-10">
                <tr>
                  <th className="p-4 w-12 text-center">
                    <input 
                      type="checkbox" 
                      className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                      checked={filteredData.length > 0 && selectedIds.size === filteredData.length}
                      onChange={handleSelectAll}
                    />
                  </th>
                  <th className="p-4 font-bold">序号</th>
                  <th className="p-4 font-bold">服务名称</th>
                  <th className="p-4 font-bold">服务类型</th>
                  <th className="p-4 font-bold">创建时间</th>
                  <th className="p-4 font-bold text-center">上线状态</th>
                  <th className="p-4 font-bold text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {(filteredData || []).map((api, index) => (
                  <tr 
                    key={api.id} 
                    className={`hover:bg-slate-50 transition-colors group ${selectedIds.has(api.id) ? 'bg-blue-50/30' : ''}`}
                  >
                    <td className="p-4 text-center">
                        <input 
                          type="checkbox" 
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer" 
                          checked={selectedIds.has(api.id)}
                          onChange={() => handleSelectRow(api.id)}
                        />
                    </td>
                    <td className="p-4 text-slate-400 font-medium tabular-nums">{index + 1}</td>
                    <td className="p-4 text-slate-800 font-bold tracking-tight">
                        <span onClick={() => handleViewDetail(api)} className="hover:text-blue-600 cursor-pointer">{api.name}</span>
                    </td>
                    <td className="p-4 text-slate-500">{api.category}</td>
                    <td className="p-4 text-slate-500 font-mono text-[12px]">{api.createTime}</td>
                    <td className="p-4 text-center"><StatusTag status={api.status} /></td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-4 text-slate-300">
                        <button onClick={() => handleViewDetail(api)} className="hover:text-blue-500 transition-colors" title="查看详情"><Eye size={17} /></button>
                        {activeTab !== 'draft' && (
                          <button onClick={() => handleToggleOnline(api.id)} className={`transition-colors ${api.status === 'online' ? 'text-blue-600 hover:text-slate-400 font-bold' : 'hover:text-blue-600'}`} title={api.status === 'online' ? "下线" : "上线"}>
                            <Send size={15} />
                          </button>
                        )}
                        <button onClick={() => handleEditApi(api)} className="hover:text-blue-500 transition-colors" title="编辑"><Edit2 size={15} /></button>
                        <button onClick={() => handleConfirmDeleteApi(api)} className="hover:text-red-500 transition-colors" title="删除"><Trash2 size={17} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {(filteredData || []).length === 0 && (
                <div className="p-20 flex flex-col items-center justify-center opacity-20">
                    <Database size={48} className="mb-2" />
                    <p className="font-bold">暂无服务数据</p>
                </div>
            )}
          </div>
          <div className="flex items-center justify-between mt-4 px-2 select-none text-[13px] text-slate-500">
            <div>共 <span className="font-medium">{(filteredData || []).length}</span> 条</div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 border border-slate-200 rounded-lg bg-white hover:bg-slate-50 cursor-pointer">
                <span>{pageSize}条/页</span>
                <ChevronDown size={14} className="text-slate-400" />
              </div>
              <div className="flex gap-1.5">
                <button disabled={currentPage === 1} className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 disabled:opacity-30"><ChevronLeft size={16} /></button>
                <button className="w-8 h-8 flex items-center justify-center bg-blue-600 text-white rounded-lg font-bold shadow-md shadow-blue-100">1</button>
                <button className="w-8 h-8 flex items-center justify-center border border-slate-200 rounded-lg text-slate-400 hover:text-blue-600 disabled:opacity-30"><ChevronRight size={16} /></button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showModeModal && <APISelectModeModal onClose={() => setShowModeModal(false)} onSelect={handleSelectMode} />}
      {showAddDirModal && (
        <AddDirectoryModal mode={modalMode} initialData={targetDirectory} dirPaths={dirPaths} onClose={() => setShowAddDirModal(false)} />
      )}
      {showDeleteConfirm && <DeleteConfirmModal name={targetDirectory.label} onClose={() => setShowDeleteConfirm(false)} onConfirm={() => setShowDeleteConfirm(false)} />}
      
      {showApiDeleteConfirm && apiToDelete && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
              <div className="bg-white rounded-xl shadow-2xl w-[420px] border border-slate-200 overflow-hidden animate-zoomIn">
                  <div className="p-8 flex flex-col items-center text-center">
                      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-5 ring-4 ring-red-50/50">
                          <AlertTriangle size={32} />
                      </div>
                      <h3 className="text-lg font-black text-slate-800 mb-2">确认删除该服务？</h3>
                      <p className="text-[14px] text-slate-500 leading-relaxed px-4">
                          您正在执行删除操作，服务 <span className="text-red-600 font-bold">"{apiToDelete.name}"</span> 将被永久移除，且无法撤销。
                      </p>
                  </div>
                  <div className="px-6 py-5 bg-slate-50 border-t border-slate-100 flex justify-center gap-3">
                      <button 
                        onClick={() => { setShowApiDeleteConfirm(false); setApiToDelete(null); }} 
                        className="flex-1 py-2.5 border border-slate-200 text-slate-600 rounded-xl text-[14px] font-bold hover:bg-white transition-all active:scale-95 shadow-sm"
                      >
                          取消
                      </button>
                      <button 
                        onClick={executeDeleteApi} 
                        className="flex-1 py-2.5 bg-red-600 text-white rounded-xl text-[14px] font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95"
                      >
                          确定删除
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const DirectoryNodeRenderer: React.FC<{
  node: DirectoryNode;
  activeId: string;
  onSelect: (id: string) => void;
  onAdd: (dir: {id: string, label: string}) => void;
  onEdit: (dir: {id: string, label: string}) => void;
  onDelete: (dir: {id: string, label: string}) => void;
  onDragStart: (id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (id: string) => void;
  draggedId: string | null;
  level?: number;
}> = ({ node, activeId, onSelect, onAdd, onEdit, onDelete, onDragStart, onDragOver, onDrop, draggedId, level = 0 }) => {
  const [isExpanded, setIsExpanded] = useState(level === 0);
  return (
    <DirectoryTreeItem 
      node={node} activeId={activeId} onSelect={onSelect} onAdd={onAdd} onEdit={onEdit} onDelete={onDelete}
      onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop}
      isDragging={draggedId === node.id} level={level + 1} expanded={isExpanded} onToggle={() => setIsExpanded(!isExpanded)}
    >
      {isExpanded && (node.children || []).map(child => (
        <DirectoryNodeRenderer key={child.id} node={child} activeId={activeId} onSelect={onSelect} onAdd={onAdd} onEdit={onEdit} onDelete={onDelete} onDragStart={onDragStart} onDragOver={onDragOver} onDrop={onDrop} draggedId={draggedId} level={level + 1} />
      ))}
    </DirectoryTreeItem>
  );
};

const ActionButton: React.FC<{ icon: React.ReactNode; label: string; onClick: (e: React.MouseEvent) => void; variant?: 'default' | 'danger' | 'primary'; tooltipBelow?: boolean; }> = ({ icon, label, onClick, variant = 'default', tooltipBelow = false }) => (
  <button onClick={onClick} className={`p-1 rounded transition-all relative group/btn ${variant === 'danger' ? 'hover:text-red-500 hover:bg-red-50' : variant === 'primary' ? 'text-blue-600 bg-blue-100 hover:bg-blue-200' : 'text-slate-400 hover:text-blue-600 hover:bg-white'}`}>
    {icon}<span className={`absolute ${tooltipBelow ? 'top-full mt-2' : 'bottom-full mb-2'} left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] rounded shadow-xl opacity-0 group-hover/btn:opacity-100 transition-all pointer-events-none whitespace-nowrap z-[100]`}>{label}</span>
  </button>
);

const DirectoryTreeItem: React.FC<{ node: DirectoryNode; activeId: string; onSelect: (id: string) => void; onAdd: (dir: {id: string, label: string}) => void; onEdit: (dir: {id: string, label: string}) => void; onDelete: (dir: {id: string, label: string}) => void; onDragStart: (id: string) => void; onDragOver: (e: React.DragEvent) => void; onDrop: (id: string) => void; isDragging?: boolean; isRoot?: boolean; level?: number; expanded?: boolean; onToggle?: () => void; children?: React.ReactNode; }> = ({ node, activeId, onSelect, onAdd, onEdit, onDelete, onDragStart, onDragOver, onDrop, isDragging, isRoot, level = 0, expanded, onToggle, children }) => {
  const isActive = activeId === node.id;
  const hasChildren = !!node.children && node.children.length > 0;
  return (
    <div className={`flex flex-col group/dir ${isDragging ? 'opacity-30' : ''}`}>
      <div draggable={!isRoot} onDragStart={() => !isRoot && onDragStart(node.id)} onDragOver={onDragOver} onDrop={() => !isRoot && onDrop(node.id)} onClick={() => onSelect(node.id)} className={`flex items-center h-9 px-3 rounded-lg cursor-pointer transition-all duration-200 relative ${isActive ? 'bg-blue-50 text-blue-600 font-bold' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`} style={{ paddingLeft: `${(level * 18) + 12}px` }}>
        <div className="w-5 flex items-center justify-center flex-shrink-0">{(hasChildren || isRoot) ? <ChevronDown size={14} className={`text-slate-400 transition-transform ${expanded ? '' : '-rotate-90'}`} onClick={(e) => { e.stopPropagation(); onToggle?.(); }} /> : null}</div>
        <div className="w-6 flex items-center justify-center flex-shrink-0 ml-1"><Database size={16} className={`${isActive ? 'text-blue-600' : 'text-slate-400'}`} /></div>
        <span className="flex-1 truncate tracking-tight text-[14px] ml-1.5">{node.label}</span>
        <div className="flex items-center shrink-0 gap-1.5 ml-2 opacity-0 group-hover/dir:opacity-100 transition-opacity">
          {isRoot ? <ActionButton icon={<FolderPlus size={14} />} label="添加目录" onClick={(e) => { e.stopPropagation(); onAdd({id: node.id, label: node.label}); }} variant="primary" tooltipBelow /> : <><ActionButton icon={<FolderPlus size={14} />} label="添加子目录" onClick={(e) => { e.stopPropagation(); onAdd({id: node.id, label: node.label}); }} /><ActionButton icon={<Edit2 size={13} />} label="编辑" onClick={(e) => { e.stopPropagation(); onEdit({id: node.id, label: node.label}); }} /><ActionButton icon={<Trash2 size={14} />} label="删除" onClick={(e) => { e.stopPropagation(); onDelete({id: node.id, label: node.label}); }} variant="danger" /></>}
          {node.count !== undefined && <span className={`min-w-[18px] px-1 text-center text-[10px] rounded-full font-bold group-hover/dir:hidden ${isActive ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-200 text-slate-500'}`}>{node.count}</span>}
        </div>
      </div>
      {children}
    </div>
  );
};

const AddDirectoryModal: React.FC<{ mode: 'add' | 'edit'; initialData: {id: string, label: string}; dirPaths: {id: string, label: string}[]; onClose: () => void }> = ({ mode, initialData, dirPaths = [], onClose }) => {
  const defaultParentId = initialData.id === 'all' ? '' : initialData.id;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-[520px] border border-slate-200 overflow-hidden animate-zoomIn">
        <div className="flex justify-between items-center px-6 py-4 border-b border-slate-50 bg-slate-50/50">
          <h3 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">{mode === 'edit' ? <Edit2 size={18} className="text-blue-600" /> : <FolderPlus size={18} className="text-blue-600" />}{mode === 'edit' ? '编辑目录信息' : '添加目录'}</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
        </div>
        <div className="p-6 space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div className="col-span-2">
              <label className="text-[14px] font-bold text-slate-600 mb-1.5 block"><span className="text-red-500 mr-1">*</span> 目录名称</label>
              <input type="text" defaultValue={mode === 'edit' ? initialData.label : ''} className="w-full h-10 px-4 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-[14px] transition-all" placeholder="请输入目录名称" autoFocus />
            </div>
            <div className="col-span-1">
              <label className="text-[14px] font-bold text-slate-600 mb-1.5 block">上级目录</label>
              <div className="relative group">
                <select defaultValue={mode === 'edit' ? '' : defaultParentId} className="w-full h-10 pl-4 pr-10 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-[14px] appearance-none bg-white cursor-pointer">
                  <option value="">(无上级 / 根节点)</option>
                  {(dirPaths || []).map(path => <option key={path.id} value={path.id}>{path.label}</option>)}
                </select>
                <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none" size={16} />
              </div>
            </div>
            <div className="col-span-1">
              <label className="text-[14px] font-bold text-slate-600 mb-1.5 block">目录排序</label>
              <div className="relative"><input type="number" defaultValue="0" className="w-full h-10 px-4 pl-10 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-[14px] transition-all" /><ListOrdered className="absolute left-3 top-3 text-slate-400" size={16} /></div>
            </div>
            <div className="col-span-2"><label className="text-[14px] font-bold text-slate-600 mb-1.5 block">描述</label><textarea className="w-full h-24 px-4 py-3 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-[14px] resize-none transition-all" placeholder="请输入目录功能或用途描述"></textarea></div>
          </div>
        </div>
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3"><button onClick={onClose} className="px-5 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-[14px] font-bold hover:bg-white transition-colors">取消</button><button onClick={onClose} className="px-5 py-1.5 bg-blue-600 text-white rounded-lg text-[14px] font-bold hover:bg-blue-700 shadow-md transition-all">确定</button></div>
      </div>
    </div>
  );
};

const DeleteConfirmModal: React.FC<{ name: string; onClose: () => void; onConfirm: () => void }> = ({ name, onClose, onConfirm }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
    <div className="bg-white rounded-xl shadow-2xl w-[400px] border border-slate-200 overflow-hidden animate-zoomIn"><div className="p-8 flex flex-col items-center text-center"><div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4"><AlertTriangle size={32} /></div><h3 className="text-lg font-bold text-slate-800 mb-2">确认删除？</h3><p className="text-[14px] text-slate-500 leading-relaxed">您将删除目录 <span className="text-red-600 font-bold">"{name}"</span>。</p></div><div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-center gap-3"><button onClick={onClose} className="flex-1 py-2 border border-slate-200 text-slate-600 rounded-lg text-[14px] font-bold">取消</button><button onClick={onConfirm} className="flex-1 py-2 bg-red-600 text-white rounded-lg text-[14px] font-bold shadow-md">确定删除</button></div></div>
  </div>
);

const StatusTag: React.FC<{ status: 'online' | 'offline' }> = ({ status }) => (
  status === 'online' ? <div className="inline-flex items-center px-2 py-0.5 bg-blue-50 text-blue-600 rounded text-[11px] font-bold border border-blue-200">已上线</div> : <div className="inline-flex items-center px-2 py-0.5 bg-slate-50 text-slate-400 rounded text-[11px] font-bold border border-slate-200">未上线</div>
);
