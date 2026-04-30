import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Building2,
  CalendarClock,
  Check,
  ChevronDown,
  Edit2,
  Eye,
  Folder,
  FolderOpen,
  FolderPlus,
  FolderTree,
  Plus,
  Search,
  Trash2,
  X,
} from 'lucide-react';

interface DomainNode {
  id: string;
  label: string;
  children?: DomainNode[];
}

interface BusinessRecord {
  id: string;
  domainId: string;
  businessName: string;
  businessCode: string;
  creator: string;
  createTime: string;
  updater: string;
  updateTime: string;
  relatedDataDomains: string[];
  relatedDataMarts: string[];
}

interface BusinessFormState {
  businessName: string;
  businessCode: string;
  creator: string;
  updater: string;
  relatedDataDomains: string[];
  relatedDataMarts: string[];
}

interface DirectoryFormState {
  name: string;
  parentId: string;
}

const INITIAL_DOMAIN_TREE: DomainNode[] = [
  {
    id: 'all',
    label: '全部',
    children: [
      {
        id: 'gov',
        label: '政务服务域',
        children: [
          { id: 'transport', label: '交通运输' },
          { id: 'emergency', label: '应急管理' },
        ],
      },
      {
        id: 'city',
        label: '城市治理域',
        children: [
          { id: 'urban', label: '城市运行' },
          { id: 'environment', label: '生态环境' },
        ],
      },
    ],
  },
];

const DATA_DOMAIN_OPTIONS = ['基础地理域', '公共安全域', '交通专题域', '生态监测域'];
const DATA_MART_OPTIONS = ['人口专题集市', '交通集市', '应急集市', '营商环境集市'];

const now = () => new Date().toLocaleString('zh-CN', { hour12: false });

const INITIAL_BUSINESSES: BusinessRecord[] = [
  {
    id: 'biz-1',
    domainId: 'transport',
    businessName: '智慧交通治理',
    businessCode: 'SMART_TRAFFIC',
    creator: '系统管理员',
    createTime: '2026/4/10 10:20:00',
    updater: '系统管理员',
    updateTime: '2026/4/15 09:32:00',
    relatedDataDomains: ['交通专题域', '公共安全域'],
    relatedDataMarts: ['交通集市'],
  },
  {
    id: 'biz-2',
    domainId: 'emergency',
    businessName: '城市应急指挥',
    businessCode: 'CITY_EMERGENCY',
    creator: '张三',
    createTime: '2026/4/8 16:40:10',
    updater: '李四',
    updateTime: '2026/4/21 14:18:07',
    relatedDataDomains: ['公共安全域', '生态监测域'],
    relatedDataMarts: ['应急集市', '交通集市'],
  },
];

const flattenDomains = (nodes: DomainNode[]): DomainNode[] =>
  nodes.flatMap((node) => [node, ...(node.children ? flattenDomains(node.children) : [])]);

export const BusinessManagementPanel: React.FC = () => {
  const [domainId, setDomainId] = useState<string>('all');
  const [searchText, setSearchText] = useState('');
  const [domainTree, setDomainTree] = useState<DomainNode[]>(INITIAL_DOMAIN_TREE);
  const [businesses, setBusinesses] = useState<BusinessRecord[]>(INITIAL_BUSINESSES);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showAddDirModal, setShowAddDirModal] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['all', 'gov', 'city']));
  const [currentBusiness, setCurrentBusiness] = useState<BusinessRecord | null>(null);
  const [directoryForm, setDirectoryForm] = useState<DirectoryFormState>({ name: '', parentId: 'all' });
  const [form, setForm] = useState<BusinessFormState>({
    businessName: '',
    businessCode: '',
    creator: '系统管理员',
    updater: '系统管理员',
    relatedDataDomains: [],
    relatedDataMarts: [],
  });

  const domainMap = useMemo(() => {
    const map = new Map<string, string>();
    flattenDomains(domainTree).forEach((node) => map.set(node.id, node.label));
    return map;
  }, [domainTree]);

  const domainDescendants = useMemo(() => {
    const map = new Map<string, Set<string>>();

    const walk = (node: DomainNode): Set<string> => {
      const bucket = new Set<string>([node.id]);
      (node.children || []).forEach((child) => {
        walk(child).forEach((id) => bucket.add(id));
      });
      map.set(node.id, bucket);
      return bucket;
    };

    domainTree.forEach((node) => walk(node));
    return map;
  }, [domainTree]);

  const directoryPathOptions = useMemo(() => {
    const result: Array<{ id: string; label: string }> = [];
    const walk = (nodes: DomainNode[], prefix = '') => {
      nodes.forEach((node) => {
        const path = prefix ? `${prefix} / ${node.label}` : node.label;
        result.push({ id: node.id, label: path });
        if (node.children?.length) {
          walk(node.children, path);
        }
      });
    };
    walk(domainTree);
    return result;
  }, [domainTree]);

  const filteredBusinesses = useMemo(() => {
    return businesses.filter((biz) => {
      const scope = domainDescendants.get(domainId) || new Set([domainId]);
      const matchDomain = scope.has(biz.domainId);
      const key = `${biz.businessName}${biz.businessCode}`.toLowerCase();
      const matchSearch = key.includes(searchText.toLowerCase());
      return matchDomain && matchSearch;
    });
  }, [businesses, domainId, searchText, domainDescendants]);

  const toggleExpand = (id: string) => {
    const next = new Set(expandedNodes);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpandedNodes(next);
  };

  const updateTree = (
    nodes: DomainNode[],
    targetId: string,
    updater: (node: DomainNode) => DomainNode,
  ): DomainNode[] => {
    return nodes.map((node) => {
      if (node.id === targetId) {
        return updater(node);
      }
      if (node.children?.length) {
        return { ...node, children: updateTree(node.children, targetId, updater) };
      }
      return node;
    });
  };

  const collectDescendantIds = (node: DomainNode): string[] => {
    return [node.id, ...((node.children || []).flatMap((child) => collectDescendantIds(child)))];
  };

  const findNode = (nodes: DomainNode[], id: string): DomainNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node;
      if (node.children?.length) {
        const found = findNode(node.children, id);
        if (found) return found;
      }
    }
    return null;
  };

  const openAddDirectoryModal = (parentId = 'all') => {
    setDirectoryForm({ name: '', parentId });
    setShowAddDirModal(true);
  };

  const handleAddDirectory = () => {
    if (!directoryForm.name.trim()) {
      window.alert('请输入目录名称。');
      return;
    }
    const newId = `domain-${Date.now()}`;
    const targetParentId = directoryForm.parentId || 'all';
    setDomainTree((prev) =>
      updateTree(prev, targetParentId, (node) => ({
        ...node,
        children: [...(node.children || []), { id: newId, label: directoryForm.name.trim(), children: [] }],
      })),
    );
    setExpandedNodes((prev) => new Set(prev).add(targetParentId));
    setShowAddDirModal(false);
  };

  const handleEditDirectory = (id: string) => {
    if (id === 'all') return;
    const target = findNode(domainTree, id);
    if (!target) return;

    const nextName = window.prompt('请输入新的目录名称：', target.label);
    if (!nextName || !nextName.trim()) return;

    setDomainTree((prev) => updateTree(prev, id, (node) => ({ ...node, label: nextName.trim() })));
  };

  const handleDeleteDirectory = (id: string) => {
    if (id === 'all') return;
    const target = findNode(domainTree, id);
    if (!target) return;

    const confirmed = window.confirm(`确认删除目录“${target.label}”吗？关联业务将自动迁移到“全部”。`);
    if (!confirmed) return;

    const removedIds = new Set(collectDescendantIds(target));

    const removeById = (nodes: DomainNode[]): DomainNode[] =>
      nodes
        .filter((node) => node.id !== id)
        .map((node) => ({
          ...node,
          children: node.children ? removeById(node.children) : [],
        }));

    setDomainTree((prev) => removeById(prev));
    setBusinesses((prev) =>
      prev.map((biz) => (removedIds.has(biz.domainId) ? { ...biz, domainId: 'all', updateTime: now() } : biz)),
    );
    setDomainId('all');
  };

  const handleCreateBusiness = () => {
    if (!form.businessName.trim() || !form.businessCode.trim() || !form.creator.trim()) {
      window.alert('请填写业务名称、英文缩写和创建人。');
      return;
    }

    const currentTime = now();
    const newBiz: BusinessRecord = {
      id: `biz-${Date.now()}`,
      domainId,
      businessName: form.businessName.trim(),
      businessCode: form.businessCode.trim().toUpperCase(),
      creator: form.creator.trim(),
      createTime: currentTime,
      updater: form.creator.trim(),
      updateTime: currentTime,
      relatedDataDomains: form.relatedDataDomains,
      relatedDataMarts: form.relatedDataMarts,
    };

    setBusinesses((prev) => [newBiz, ...prev]);
    setShowCreateModal(false);
    setForm({
      businessName: '',
      businessCode: '',
      creator: '系统管理员',
      updater: '系统管理员',
      relatedDataDomains: [],
      relatedDataMarts: [],
    });
  };

  const openViewModal = (biz: BusinessRecord) => {
    setCurrentBusiness(biz);
    setShowViewModal(true);
  };

  const openEditModal = (biz: BusinessRecord) => {
    setCurrentBusiness(biz);
    setForm({
      businessName: biz.businessName,
      businessCode: biz.businessCode,
      creator: biz.creator,
      updater: biz.updater,
      relatedDataDomains: [...biz.relatedDataDomains],
      relatedDataMarts: [...biz.relatedDataMarts],
    });
    setShowEditModal(true);
  };

  const handleEditBusiness = () => {
    if (!currentBusiness) return;
    if (!form.businessName.trim() || !form.businessCode.trim() || !form.updater.trim()) {
      window.alert('请填写业务名称、英文缩写和修改人。');
      return;
    }

    const updateTime = now();
    setBusinesses((prev) =>
      prev.map((biz) =>
        biz.id === currentBusiness.id
          ? {
              ...biz,
              businessName: form.businessName.trim(),
              businessCode: form.businessCode.trim().toUpperCase(),
              updater: form.updater.trim(),
              updateTime,
              relatedDataDomains: form.relatedDataDomains,
              relatedDataMarts: form.relatedDataMarts,
            }
          : biz,
      ),
    );
    setShowEditModal(false);
    setCurrentBusiness(null);
  };

  const handleDeleteBusiness = (biz: BusinessRecord) => {
    const confirmed = window.confirm(`确认删除业务“${biz.businessName}”吗？`);
    if (!confirmed) return;
    setBusinesses((prev) => prev.filter((item) => item.id !== biz.id));
  };

  return (
    <div className="flex-1 flex flex-col bg-white h-full animate-fadeIn overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-1 h-5 bg-blue-600 rounded-full" />
          <h2 className="text-[17px] font-bold text-slate-800 tracking-tight">业务管理</h2>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-[14px] font-bold hover:bg-blue-700 transition-all shadow-md shadow-blue-100"
        >
          <Plus size={16} />
          新建业务
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="w-[300px] flex-shrink-0 border-r border-slate-100 bg-[#fcfdfe]/60 p-4">
          <div className="flex items-center justify-between h-10 px-2">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-[14px]">
              <FolderTree size={16} className="text-blue-600" />
              业务域目录
            </div>
            <button
              onClick={() => openAddDirectoryModal('all')}
              className="h-7 px-2.5 rounded-lg bg-white border border-slate-200 text-[12px] text-slate-600 hover:text-blue-600 hover:border-blue-300 flex items-center gap-1"
              title="添加业务域"
            >
              <FolderPlus size={12} />
              添加业务域
            </button>
          </div>
          <div className="mt-2 space-y-1 overflow-y-auto max-h-[calc(100vh-260px)] custom-scrollbar">
            {domainTree.map((node) => (
              <DomainTreeNode
                key={node.id}
                node={node}
                selectedId={domainId}
                expandedNodes={expandedNodes}
                onSelect={setDomainId}
                onToggle={toggleExpand}
                onAdd={openAddDirectoryModal}
                onEdit={handleEditDirectory}
                onDelete={handleDeleteDirectory}
              />
            ))}
          </div>
        </div>

        <div className="flex-1 flex flex-col p-6 overflow-hidden bg-white">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-slate-700">
              <Building2 size={17} className="text-blue-600" />
              <span className="text-[15px] font-bold">
                当前业务域：{domainMap.get(domainId) || domainId}
              </span>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                placeholder="搜索业务名称/英文缩写..."
                className="w-80 h-9 pl-10 pr-4 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400 text-[14px] transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-auto border border-slate-100 rounded-xl shadow-sm">
            <table className="w-full text-left text-[14px] border-collapse">
              <thead className="bg-[#f8fafc] text-[#475569] border-b border-slate-100 sticky top-0 z-10">
                <tr>
                  <th className="p-3 font-bold">业务名称</th>
                  <th className="p-3 font-bold">英文缩写</th>
                  <th className="p-3 font-bold">创建人</th>
                  <th className="p-3 font-bold">创建时间</th>
                  <th className="p-3 font-bold">修改人</th>
                  <th className="p-3 font-bold">修改时间</th>
                  <th className="p-3 font-bold">关联数据域</th>
                  <th className="p-3 font-bold">关联数据集市</th>
                  <th className="p-3 font-bold text-center">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredBusinesses.map((biz) => (
                  <tr key={biz.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-3 font-semibold text-slate-800">{biz.businessName}</td>
                    <td className="p-3 text-slate-600">{biz.businessCode}</td>
                    <td className="p-3 text-slate-600">{biz.creator}</td>
                    <td className="p-3 text-slate-500 text-[13px]">{biz.createTime}</td>
                    <td className="p-3 text-slate-600">{biz.updater}</td>
                    <td className="p-3 text-slate-500 text-[13px]">{biz.updateTime}</td>
                    <td className="p-3 text-slate-600">{biz.relatedDataDomains.join('、') || '-'}</td>
                    <td className="p-3 text-slate-600">{biz.relatedDataMarts.join('、') || '-'}</td>
                    <td className="p-3">
                      <div className="flex items-center justify-center gap-3 text-slate-400">
                        <button
                          onClick={() => openViewModal(biz)}
                          className="hover:text-blue-600 transition-colors"
                          title="查看"
                        >
                          <Eye size={16} />
                        </button>
                        <button
                          onClick={() => openEditModal(biz)}
                          className="hover:text-blue-600 transition-colors"
                          title="编辑"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          onClick={() => handleDeleteBusiness(biz)}
                          className="hover:text-red-600 transition-colors"
                          title="删除"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredBusinesses.length === 0 && (
              <div className="p-20 flex flex-col items-center justify-center opacity-30">
                <CalendarClock size={48} className="mb-2" />
                <p className="font-bold">当前业务域暂无业务</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="w-[720px] bg-white rounded-xl border border-slate-200 shadow-2xl animate-zoomIn">
            <div className="h-14 px-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-slate-800">新建业务</h3>
              <button onClick={() => setShowCreateModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-5">
              <div>
                <label className="text-[14px] font-bold text-slate-600 mb-1.5 block">业务名称 *</label>
                <input
                  value={form.businessName}
                  onChange={(e) => setForm((prev) => ({ ...prev, businessName: e.target.value }))}
                  placeholder="请输入业务名称"
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-[14px]"
                />
              </div>
              <div>
                <label className="text-[14px] font-bold text-slate-600 mb-1.5 block">英文缩写 *</label>
                <input
                  value={form.businessCode}
                  onChange={(e) => setForm((prev) => ({ ...prev, businessCode: e.target.value }))}
                  placeholder="例如 SMART_CITY"
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-[14px]"
                />
              </div>
              <div>
                <label className="text-[14px] font-bold text-slate-600 mb-1.5 block">创建人 *</label>
                <input
                  value={form.creator}
                  onChange={(e) => setForm((prev) => ({ ...prev, creator: e.target.value }))}
                  placeholder="请输入创建人"
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-[14px]"
                />
              </div>
              <div>
                <label className="text-[14px] font-bold text-slate-600 mb-1.5 block">业务域</label>
                <div className="h-10 px-3 border border-slate-200 rounded-lg bg-slate-50 text-[14px] text-slate-600 flex items-center">
                  {domainMap.get(domainId) || domainId}
                </div>
              </div>

              <div className="col-span-2">
                <label className="text-[14px] font-bold text-slate-600 mb-1.5 block">关联数据域（可多选）</label>
                <MultiSelectDropdown
                  options={DATA_DOMAIN_OPTIONS}
                  value={form.relatedDataDomains}
                  placeholder="请选择关联数据域"
                  onChange={(next) => setForm((prev) => ({ ...prev, relatedDataDomains: next }))}
                />
              </div>

              <div className="col-span-2">
                <label className="text-[14px] font-bold text-slate-600 mb-1.5 block">关联数据集市（可多选）</label>
                <MultiSelectDropdown
                  options={DATA_MART_OPTIONS}
                  value={form.relatedDataMarts}
                  placeholder="请选择关联数据集市"
                  onChange={(next) => setForm((prev) => ({ ...prev, relatedDataMarts: next }))}
                />
              </div>
            </div>

            <div className="h-16 px-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="px-5 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-[14px] font-bold hover:bg-white"
              >
                取消
              </button>
              <button
                onClick={handleCreateBusiness}
                className="px-5 py-1.5 bg-blue-600 text-white rounded-lg text-[14px] font-bold hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddDirModal && (
        <div className="fixed inset-0 z-[220] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="w-[520px] bg-white rounded-xl border border-slate-200 shadow-2xl animate-zoomIn">
            <div className="h-14 px-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-slate-800">新增业务域目录</h3>
              <button onClick={() => setShowAddDirModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-[14px] font-bold text-slate-600 mb-1.5 block">目录名称 *</label>
                <input
                  value={directoryForm.name}
                  onChange={(e) => setDirectoryForm((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="请输入目录名称"
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-[14px]"
                />
              </div>
              <div>
                <label className="text-[14px] font-bold text-slate-600 mb-1.5 block">上级目录 *</label>
                <div className="relative">
                  <select
                    value={directoryForm.parentId}
                    onChange={(e) => setDirectoryForm((prev) => ({ ...prev, parentId: e.target.value }))}
                    className="w-full h-10 px-3 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-[14px] bg-white appearance-none"
                  >
                    {directoryPathOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.label}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                </div>
              </div>
            </div>
            <div className="h-16 px-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowAddDirModal(false)}
                className="px-5 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-[14px] font-bold hover:bg-white"
              >
                取消
              </button>
              <button
                onClick={handleAddDirectory}
                className="px-5 py-1.5 bg-blue-600 text-white rounded-lg text-[14px] font-bold hover:bg-blue-700"
              >
                确认新增
              </button>
            </div>
          </div>
        </div>
      )}

      {showEditModal && currentBusiness && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="w-[720px] bg-white rounded-xl border border-slate-200 shadow-2xl animate-zoomIn">
            <div className="h-14 px-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-slate-800">编辑业务</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="p-6 grid grid-cols-2 gap-5">
              <div>
                <label className="text-[14px] font-bold text-slate-600 mb-1.5 block">业务名称 *</label>
                <input
                  value={form.businessName}
                  onChange={(e) => setForm((prev) => ({ ...prev, businessName: e.target.value }))}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-[14px]"
                />
              </div>
              <div>
                <label className="text-[14px] font-bold text-slate-600 mb-1.5 block">英文缩写 *</label>
                <input
                  value={form.businessCode}
                  onChange={(e) => setForm((prev) => ({ ...prev, businessCode: e.target.value }))}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-[14px]"
                />
              </div>
              <div>
                <label className="text-[14px] font-bold text-slate-600 mb-1.5 block">创建人</label>
                <div className="h-10 px-3 border border-slate-200 rounded-lg bg-slate-50 text-[14px] text-slate-600 flex items-center">
                  {currentBusiness.creator}
                </div>
              </div>
              <div>
                <label className="text-[14px] font-bold text-slate-600 mb-1.5 block">修改人 *</label>
                <input
                  value={form.updater}
                  onChange={(e) => setForm((prev) => ({ ...prev, updater: e.target.value }))}
                  className="w-full h-10 px-3 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-[14px]"
                />
              </div>

              <div className="col-span-2">
                <label className="text-[14px] font-bold text-slate-600 mb-1.5 block">关联数据域（可多选）</label>
                <MultiSelectDropdown
                  options={DATA_DOMAIN_OPTIONS}
                  value={form.relatedDataDomains}
                  placeholder="请选择关联数据域"
                  onChange={(next) => setForm((prev) => ({ ...prev, relatedDataDomains: next }))}
                />
              </div>

              <div className="col-span-2">
                <label className="text-[14px] font-bold text-slate-600 mb-1.5 block">关联数据集市（可多选）</label>
                <MultiSelectDropdown
                  options={DATA_MART_OPTIONS}
                  value={form.relatedDataMarts}
                  placeholder="请选择关联数据集市"
                  onChange={(next) => setForm((prev) => ({ ...prev, relatedDataMarts: next }))}
                />
              </div>
            </div>

            <div className="h-16 px-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-5 py-1.5 border border-slate-200 text-slate-600 rounded-lg text-[14px] font-bold hover:bg-white"
              >
                取消
              </button>
              <button
                onClick={handleEditBusiness}
                className="px-5 py-1.5 bg-blue-600 text-white rounded-lg text-[14px] font-bold hover:bg-blue-700"
              >
                保存修改
              </button>
            </div>
          </div>
        </div>
      )}

      {showViewModal && currentBusiness && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm">
          <div className="w-[760px] bg-white rounded-xl border border-slate-200 shadow-2xl overflow-hidden animate-zoomIn">
            <div className="h-14 px-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-[16px] font-bold text-slate-800">业务详情</h3>
              <button onClick={() => setShowViewModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>
            <div className="p-6 grid grid-cols-2 gap-4 text-[14px]">
              <div><span className="text-slate-400">业务名称：</span><span className="text-slate-700 font-semibold">{currentBusiness.businessName}</span></div>
              <div><span className="text-slate-400">英文缩写：</span><span className="text-slate-700">{currentBusiness.businessCode}</span></div>
              <div><span className="text-slate-400">业务域：</span><span className="text-slate-700">{domainMap.get(currentBusiness.domainId) || currentBusiness.domainId}</span></div>
              <div><span className="text-slate-400">创建人：</span><span className="text-slate-700">{currentBusiness.creator}</span></div>
              <div><span className="text-slate-400">创建时间：</span><span className="text-slate-700">{currentBusiness.createTime}</span></div>
              <div><span className="text-slate-400">修改人：</span><span className="text-slate-700">{currentBusiness.updater}</span></div>
              <div><span className="text-slate-400">修改时间：</span><span className="text-slate-700">{currentBusiness.updateTime}</span></div>
              <div className="col-span-2"><span className="text-slate-400">关联数据域：</span><span className="text-slate-700">{currentBusiness.relatedDataDomains.join('、') || '-'}</span></div>
              <div className="col-span-2"><span className="text-slate-400">关联数据集市：</span><span className="text-slate-700">{currentBusiness.relatedDataMarts.join('、') || '-'}</span></div>
            </div>
            <div className="h-16 px-6 border-t border-slate-100 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => setShowViewModal(false)}
                className="px-5 py-1.5 bg-blue-600 text-white rounded-lg text-[14px] font-bold hover:bg-blue-700"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface DomainTreeNodeProps {
  node: DomainNode;
  selectedId: string;
  expandedNodes: Set<string>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onAdd: (parentId: string) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  level?: number;
}

const DomainTreeNode: React.FC<DomainTreeNodeProps> = ({
  node,
  selectedId,
  expandedNodes,
  onSelect,
  onToggle,
  onAdd,
  onEdit,
  onDelete,
  level = 0,
}) => {
  const hasChildren = (node.children || []).length > 0;
  const expanded = expandedNodes.has(node.id);
  const isSelected = selectedId === node.id;

  return (
    <div>
      <div
        className={`h-9 flex items-center pr-2 rounded-lg cursor-pointer group ${
          isSelected ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
        }`}
        style={{ paddingLeft: `${8 + level * 16}px` }}
        onClick={() => onSelect(node.id)}
      >
        <button
          className="w-5 h-5 flex items-center justify-center mr-1 text-slate-400"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggle(node.id);
          }}
        >
          {hasChildren ? (
            <ChevronDown size={14} className={`transition-transform ${expanded ? '' : '-rotate-90'}`} />
          ) : null}
        </button>
        {expanded ? <FolderOpen size={14} className="text-blue-500" /> : <Folder size={14} className="text-blue-500" />}
        <span className={`ml-2 text-[14px] ${isSelected ? 'font-bold' : 'font-medium'}`}>{node.label}</span>
        <div className="ml-auto hidden group-hover:flex items-center gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAdd(node.id);
            }}
            className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-white"
            title="新增子目录"
          >
            <FolderPlus size={13} />
          </button>
          {node.id !== 'all' && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit(node.id);
                }}
                className="p-1 rounded text-slate-400 hover:text-blue-600 hover:bg-white"
                title="修改目录"
              >
                <Edit2 size={13} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(node.id);
                }}
                className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-white"
                title="删除目录"
              >
                <Trash2 size={13} />
              </button>
            </>
          )}
        </div>
      </div>

      {hasChildren &&
        expanded &&
        node.children!.map((child) => (
          <DomainTreeNode
            key={child.id}
            node={child}
            selectedId={selectedId}
            expandedNodes={expandedNodes}
            onSelect={onSelect}
            onToggle={onToggle}
            onAdd={onAdd}
            onEdit={onEdit}
            onDelete={onDelete}
            level={level + 1}
          />
        ))}
    </div>
  );
};

interface MultiSelectDropdownProps {
  options: string[];
  value: string[];
  onChange: (next: string[]) => void;
  placeholder: string;
}

const MultiSelectDropdown: React.FC<MultiSelectDropdownProps> = ({
  options,
  value,
  onChange,
  placeholder,
}) => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [dropUp, setDropUp] = useState(false);

  const filteredOptions = useMemo(() => {
    return options.filter((item) => item.toLowerCase().includes(keyword.trim().toLowerCase()));
  }, [options, keyword]);

  const toggleOne = (item: string) => {
    const exists = value.includes(item);
    onChange(exists ? value.filter((v) => v !== item) : [...value, item]);
  };

  useEffect(() => {
    if (!open) return;
    const rect = wrapperRef.current?.getBoundingClientRect();
    if (!rect) return;
    const viewportHeight = window.innerHeight;
    const estimatedPanelHeight = 280;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    setDropUp(spaceBelow < estimatedPanelHeight && spaceAbove > spaceBelow);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (event: MouseEvent) => {
      if (!wrapperRef.current) return;
      if (!wrapperRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [open]);

  return (
    <div ref={wrapperRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full min-h-10 px-3 py-2 border border-slate-200 rounded-lg text-left bg-white hover:border-blue-300 transition-colors"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {value.length === 0 ? (
              <span className="text-[14px] text-slate-400">{placeholder}</span>
            ) : (
              value.map((item) => (
                <span
                  key={item}
                  className="inline-flex items-center px-2 py-0.5 rounded bg-blue-50 border border-blue-200 text-[12px] text-blue-700"
                >
                  {item}
                </span>
              ))
            )}
          </div>
          <ChevronDown size={15} className={`text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`} />
        </div>
      </button>

      {open && (
        <div
          className={`absolute z-[320] w-full bg-white border border-slate-200 rounded-lg shadow-lg p-2 ${
            dropUp ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
        >
          <div className="relative mb-2">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="输入关键字筛选..."
              className="w-full h-8 pl-8 pr-2 border border-slate-200 rounded text-[13px] outline-none focus:border-blue-400"
            />
          </div>
          <div className="max-h-52 overflow-y-auto space-y-1 custom-scrollbar">
            {filteredOptions.map((item) => {
              const checked = value.includes(item);
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => toggleOne(item)}
                  className={`w-full h-8 px-2 rounded text-[13px] flex items-center justify-between ${
                    checked ? 'bg-blue-50 text-blue-700' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <span>{item}</span>
                  {checked ? <Check size={14} /> : null}
                </button>
              );
            })}
            {filteredOptions.length === 0 && (
              <div className="h-10 flex items-center justify-center text-[12px] text-slate-400">无匹配项</div>
            )}
          </div>
          <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
            <button
              type="button"
              onClick={() => onChange([])}
              className="text-[12px] text-slate-500 hover:text-red-500"
            >
              清空
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="text-[12px] px-2 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              完成
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
