import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  CircleHelp,
  Database,
  Download,
  ExternalLink,
  FileSpreadsheet,
  Folder,
  FolderOpen,
  Info,
  LayoutGrid,
  Plus,
  RefreshCw,
  Search,
  Upload,
} from 'lucide-react';
import type { CodeTableDirectoryNode } from '../standardCodeTableMock';
import {
  CODE_TABLE_DIRECTORY_CHILDREN,
  CODE_TABLE_DIRECTORY_TREE,
  STANDARD_CODE_TABLES,
  StandardCodeTableDef,
  appendStandardCodeTable,
  filterCodeTables,
  patchStandardCodeTable,
  removeStandardCodeTable,
  replaceStandardCodeTable,
} from '../standardCodeTableMock';
import { CreateCodeTableModal } from './CreateCodeTableModal';

function isTableUnderDirectory(row: StandardCodeTableDef, selectedDir: string): boolean {
  if (selectedDir === 'root') return true;
  if (row.directoryId === selectedDir) return true;
  const children = CODE_TABLE_DIRECTORY_CHILDREN[selectedDir];
  return children?.includes(row.directoryId) ?? false;
}

const DOC_LINK =
  'https://support.huaweicloud.com/usermanual-dataartsstudio/dataartsstudio_01_0604.html';

const STANDARD_CODE_TABLE_INTRO =
  '码表也称 lookup 表、数据字典表，存储枚举名称与编码映射；可用于清洗标准化、质量监控中的值域校验、维度建模中的枚举维度。新建与发布流程可参考华为云 DataArts 码表管理。';

const DirectoryTreeInner: React.FC<{
  nodes: CodeTableDirectoryNode[];
  level: number;
  selectedId: string;
  expanded: Set<string>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}> = ({ nodes, level, selectedId, expanded, onSelect, onToggle }) => (
  <>
    {nodes.map((node) => (
      <DirectoryTreeNode
        key={node.id}
        node={node}
        level={level}
        selectedId={selectedId}
        expanded={expanded}
        onSelect={onSelect}
        onToggle={onToggle}
      />
    ))}
  </>
);

const DirectoryTreeNode: React.FC<{
  node: CodeTableDirectoryNode;
  level: number;
  selectedId: string;
  expanded: Set<string>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}> = ({ node, level, selectedId, expanded, onSelect, onToggle }) => {
  const children = node.children || [];
  const hasChildren = children.length > 0;
  const isExpanded = expanded.has(node.id);
  const isSelected = selectedId === node.id;

  return (
    <div>
      <div
        style={{ paddingLeft: `${6 + level * 14}px` }}
        className={`min-h-8 pr-2 rounded-lg flex items-center cursor-pointer ${
          isSelected ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
        }`}
        onClick={() => onSelect(node.id)}
      >
        <button
          type="button"
          className="w-5 h-5 mr-0.5 text-slate-400 flex items-center justify-center shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggle(node.id);
          }}
        >
          {hasChildren ? (
            <ChevronDown size={14} className={`transition-transform ${isExpanded ? '' : '-rotate-90'}`} />
          ) : (
            <span className="w-3 inline-block" />
          )}
        </button>
        {hasChildren ? (
          isExpanded ? (
            <FolderOpen size={14} className="text-blue-600 shrink-0 mr-1" />
          ) : (
            <Folder size={14} className="text-blue-600 shrink-0 mr-1" />
          )
        ) : (
          <Database size={14} className="text-slate-300 shrink-0 mr-1" />
        )}
        <span className={`text-[13px] truncate flex-1 ${isSelected ? 'font-semibold' : ''}`}>
          {node.label}
        </span>
        {node.count != null && (
          <span className="text-[12px] text-slate-400 shrink-0 ml-1">({node.count})</span>
        )}
      </div>
      {hasChildren && isExpanded && (
        <DirectoryTreeInner
          nodes={children}
          level={level + 1}
          selectedId={selectedId}
          expanded={expanded}
          onSelect={onSelect}
          onToggle={onToggle}
        />
      )}
    </div>
  );
};

function statusBadge(status: StandardCodeTableDef['status']) {
  const map: Record<string, string> = {
    已发布: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    草稿: 'bg-slate-100 text-slate-600 ring-slate-200',
    已驳回: 'bg-amber-50 text-amber-800 ring-amber-200',
    已下线: 'bg-zinc-100 text-zinc-600 ring-zinc-200',
  };
  return map[status] || map['草稿'];
}

function canPublishCodeTable(status: StandardCodeTableDef['status']): boolean {
  return status === '草稿' || status === '已驳回';
}

export const StandardCodeTablePanel: React.FC = () => {
  const [tables, setTables] = useState<StandardCodeTableDef[]>(() => [...STANDARD_CODE_TABLES]);
  const [codeModalOpen, setCodeModalOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<StandardCodeTableDef | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(
    new Set(['root', 'dir-common', 'dir-rs-agri'])
  );
  const [selectedDir, setSelectedDir] = useState('root');
  const [keyword, setKeyword] = useState('');
  const [detail, setDetail] = useState<StandardCodeTableDef | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());
  const selectAllRef = useRef<HTMLInputElement>(null);

  const filteredTables = useMemo(() => {
    const byKeyword = filterCodeTables(keyword, tables);
    return byKeyword.filter((t) => isTableUnderDirectory(t, selectedDir));
  }, [keyword, selectedDir, tables]);

  /** 筛选或目录变化时，去掉当前列表中已不可见的勾选 */
  useEffect(() => {
    const list = filterCodeTables(keyword, tables).filter((t) =>
      isTableUnderDirectory(t, selectedDir)
    );
    const visible = new Set(list.map((t) => t.id));
    setSelectedIds((prev) => {
      const next = new Set<string>();
      prev.forEach((id) => {
        if (visible.has(id)) next.add(id);
      });
      return next;
    });
  }, [keyword, selectedDir, tables]);

  const allFilteredSelected =
    filteredTables.length > 0 && filteredTables.every((t) => selectedIds.has(t.id));
  const someFilteredSelected =
    filteredTables.some((t) => selectedIds.has(t.id)) && !allFilteredSelected;

  useEffect(() => {
    const el = selectAllRef.current;
    if (el) el.indeterminate = someFilteredSelected;
  }, [someFilteredSelected]);

  const toggleSelectAll = () => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      const visibleIds = filteredTables.map((t) => t.id);
      const allOn = visibleIds.length > 0 && visibleIds.every((id) => next.has(id));
      if (allOn) visibleIds.forEach((id) => next.delete(id));
      else visibleIds.forEach((id) => next.add(id));
      return next;
    });
  };

  const toggleRowSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const syncTablesFromStore = () => setTables([...STANDARD_CODE_TABLES]);

  const handleCodeTableCreated = (row: StandardCodeTableDef) => {
    appendStandardCodeTable(row);
    syncTablesFromStore();
  };

  const handleCodeTableUpdated = (row: StandardCodeTableDef) => {
    replaceStandardCodeTable(row);
    syncTablesFromStore();
  };

  const openCreateModal = () => {
    setEditingTable(null);
    setCodeModalOpen(true);
  };

  const openEditModal = (row: StandardCodeTableDef) => {
    setEditingTable(row);
    setCodeModalOpen(true);
  };

  const closeCodeModal = () => {
    setCodeModalOpen(false);
    setEditingTable(null);
  };

  const handlePublish = (row: StandardCodeTableDef) => {
    if (!canPublishCodeTable(row.status)) return;
    if (
      !window.confirm(
        `确定发布码表「${row.tableName}」？发布后可被数据标准「值域 · 引用码表」引用。`
      )
    ) {
      return;
    }
    const next = patchStandardCodeTable(row.id, { status: '已发布' });
    if (next) syncTablesFromStore();
    if (detail?.id === row.id && next) setDetail(next);
  };

  const handleDeleteRow = (row: StandardCodeTableDef) => {
    if (
      !window.confirm(
        `确定删除码表「${row.tableName}」？删除后不可恢复。`
      )
    ) {
      return;
    }
    removeStandardCodeTable(row.id);
    syncTablesFromStore();
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(row.id);
      return next;
    });
    if (detail?.id === row.id) setDetail(null);
    if (editingTable?.id === row.id) closeCodeModal();
  };

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="relative flex-1 flex h-full min-h-0 overflow-hidden animate-fadeIn bg-white">
      {/* 左侧目录 */}
      <div className="w-[280px] flex-shrink-0 flex flex-col border-r border-slate-100 bg-[#fcfdfe]/50">
        <div className="px-4 py-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg shrink-0" aria-hidden>
              <LayoutGrid size={20} strokeWidth={2} />
            </div>
            <h2 className="text-[15px] font-bold text-slate-800 whitespace-nowrap">标准码表</h2>
          </div>
        </div>
        <div className="px-3 pt-3 pb-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
            <input
              readOnly
              className="w-full h-8 pl-8 pr-2 bg-white border border-slate-200 rounded-lg text-[12px] outline-none text-slate-400 cursor-default"
              placeholder="目录内检索（右侧列表支持）"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 pb-4 custom-scrollbar min-h-0">
          {CODE_TABLE_DIRECTORY_TREE.map((rootNode) => (
            <DirectoryTreeNode
              key={rootNode.id}
              node={rootNode}
              level={0}
              selectedId={selectedDir}
              expanded={expanded}
              onSelect={setSelectedDir}
              onToggle={toggleExpand}
            />
          ))}
        </div>
      </div>

      {/* 右侧 */}
      <div className="flex-1 flex flex-col min-h-0 min-w-0 p-6 bg-slate-50/30 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 bg-white rounded-xl shadow-sm border border-slate-200/60 overflow-hidden ring-1 ring-slate-900/5">
          <div className="flex-shrink-0 px-6 pt-5 pb-3 border-b border-slate-100 space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h1 className="text-[16px] font-bold text-slate-800 flex items-center gap-2 flex-wrap">
                  标准码表
                  <span className="relative inline-flex items-center group/tooltip">
                    <button
                      type="button"
                      className="p-0.5 rounded text-slate-400 hover:text-blue-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60"
                      aria-label="查看说明"
                    >
                      <CircleHelp size={17} strokeWidth={2} aria-hidden />
                    </button>
                    <span
                      role="tooltip"
                      className="pointer-events-none invisible opacity-0 group-hover/tooltip:visible group-hover/tooltip:opacity-100 group-focus-within/tooltip:visible group-focus-within/tooltip:opacity-100 transition-opacity duration-150 absolute left-0 top-full z-50 mt-1.5 w-[min(22rem,calc(100vw-6rem))] rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-[12px] font-normal leading-relaxed text-slate-600 shadow-lg ring-1 ring-slate-900/5"
                    >
                      {STANDARD_CODE_TABLE_INTRO}
                    </span>
                  </span>
                  <a
                    href={DOC_LINK}
                    target="_blank"
                    rel="noreferrer"
                    className="text-slate-400 hover:text-blue-600 inline-flex items-center gap-1 text-[13px] font-normal"
                  >
                    <Info size={15} />
                    参考文档
                    <ExternalLink size={12} />
                  </a>
                </h1>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  className="h-9 px-4 rounded-lg border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50 inline-flex items-center gap-1.5"
                >
                  <Upload size={15} /> 导入
                </button>
                <button
                  type="button"
                  className="h-9 px-4 rounded-lg border border-slate-200 text-[13px] font-medium text-slate-600 hover:bg-slate-50 inline-flex items-center gap-1.5"
                >
                  <Download size={15} /> 导出
                </button>
                <button
                  type="button"
                  onClick={openCreateModal}
                  className="h-9 px-4 rounded-lg bg-blue-600 text-white text-[13px] font-bold shadow-md shadow-blue-100 hover:bg-blue-700 inline-flex items-center gap-1.5"
                >
                  <Plus size={16} /> 新建码表
                </button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative flex-1 min-w-[200px] max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} />
                <input
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="w-full h-9 pl-9 pr-3 bg-slate-50 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-blue-400 focus:bg-white"
                  placeholder="搜索表名称 / 表编码"
                />
              </div>
              <button
                type="button"
                className="w-9 h-9 border border-slate-200 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600"
              >
                <RefreshCw size={14} />
              </button>
            </div>
          </div>

          <div className="flex-1 overflow-auto custom-scrollbar">
            <table className="w-full text-left text-[13px] border-collapse min-w-[640px]">
              <thead className="bg-[#f8fafc] text-slate-500 font-bold border-b border-slate-100 sticky top-0 z-10">
                <tr>
                  <th className="py-3 pl-4 pr-2 w-[44px]">
                    <span className="sr-only">全选</span>
                    <input
                      ref={selectAllRef}
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAll}
                      disabled={filteredTables.length === 0}
                      className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed accent-blue-600"
                      aria-label="全选当前列表"
                    />
                  </th>
                  <th className="py-3 px-2 w-[52px] text-center tabular-nums text-slate-400 font-semibold">
                    序号
                  </th>
                  <th className="py-3 px-4">表名称</th>
                  <th className="py-3 px-4">表编码</th>
                  <th className="py-3 px-4">状态</th>
                  <th className="py-3 px-4 text-center min-w-[220px]">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredTables.map((row, index) => (
                  <tr key={row.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-3 pl-4 pr-2 align-middle">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(row.id)}
                        onChange={() => toggleRowSelect(row.id)}
                        className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer accent-blue-600"
                        aria-label={`选择 ${row.tableName}`}
                      />
                    </td>
                    <td className="py-3 px-2 text-center tabular-nums text-slate-400 align-middle">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{row.tableName}</div>
                      <div className="text-[12px] text-slate-400 truncate max-w-[280px]" title={row.description}>
                        {row.description}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">{row.tableCode}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded-md text-[12px] font-medium ring-1 ${statusBadge(row.status)}`}
                      >
                        {row.status}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex flex-wrap items-center justify-center gap-x-1.5 gap-y-1 text-[12px]">
                        <button
                          type="button"
                          onClick={() => setDetail(row)}
                          className="text-blue-600 hover:underline px-0.5"
                        >
                          查看
                        </button>
                        <span className="text-slate-200 select-none" aria-hidden>
                          |
                        </span>
                        <button
                          type="button"
                          disabled={!canPublishCodeTable(row.status)}
                          title={
                            canPublishCodeTable(row.status)
                              ? '发布后可被数据标准引用'
                              : '当前状态不可发布'
                          }
                          onClick={() => handlePublish(row)}
                          className={`px-0.5 ${
                            canPublishCodeTable(row.status)
                              ? 'text-blue-600 hover:underline'
                              : 'text-slate-300 cursor-not-allowed'
                          }`}
                        >
                          发布
                        </button>
                        <span className="text-slate-200 select-none" aria-hidden>
                          |
                        </span>
                        <button
                          type="button"
                          onClick={() => openEditModal(row)}
                          className="text-blue-600 hover:underline px-0.5"
                        >
                          编辑
                        </button>
                        <span className="text-slate-200 select-none" aria-hidden>
                          |
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteRow(row)}
                          className="text-red-600 hover:underline px-0.5"
                        >
                          删除
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredTables.length === 0 && (
              <div className="py-20 text-center text-slate-400 text-[13px]">
                <FileSpreadsheet className="mx-auto mb-2 opacity-40" size={40} />
                暂无码表，请调整目录或搜索关键词
              </div>
            )}
          </div>

          <div className="flex-shrink-0 px-6 py-3 border-t border-slate-100 text-[13px] text-slate-500 flex justify-between">
            <span>共 {filteredTables.length} 张码表</span>
            <span className="text-slate-400">
              数据标准 · 值域 · 引用码表 仅可选择「已发布」码表
            </span>
          </div>
        </div>
      </div>

      <CreateCodeTableModal
        open={codeModalOpen}
        onClose={closeCodeModal}
        onCreated={handleCodeTableCreated}
        editingTable={editingTable}
        onUpdated={handleCodeTableUpdated}
      />

      {detail && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/35" role="dialog">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden flex flex-col border border-slate-200">
            <div className="px-5 py-4 border-b border-slate-100 flex justify-between items-start gap-3">
              <div>
                <p className="text-[11px] text-slate-400 mb-0.5">查看码表</p>
                <h3 className="font-bold text-slate-800">{detail.tableName}</h3>
                <p className="text-[12px] font-mono text-slate-500 mt-0.5">{detail.tableCode}</p>
              </div>
              <button
                type="button"
                onClick={() => setDetail(null)}
                className="text-slate-400 hover:text-slate-700 text-xl leading-none px-1"
              >
                ×
              </button>
            </div>
            <div className="px-5 py-3 overflow-y-auto custom-scrollbar text-[13px]">
              <dl className="grid grid-cols-[5.5rem_1fr] gap-x-2 gap-y-2 text-[13px] mb-4">
                <dt className="text-slate-400">状态</dt>
                <dd>
                  <span
                    className={`inline-flex px-2 py-0.5 rounded-md text-[12px] font-medium ring-1 ${statusBadge(detail.status)}`}
                  >
                    {detail.status}
                  </span>
                </dd>
              </dl>
              <p className="text-slate-500 mb-3">{detail.description || '—'}</p>
              <div className="font-semibold text-slate-700 mb-2">建表字段（枚举列）</div>
              <table className="w-full border border-slate-100 rounded-lg overflow-hidden">
                <thead className="bg-slate-50 text-slate-600 text-[12px]">
                  <tr>
                    <th className="text-left py-2 px-3">字段名称</th>
                    <th className="text-left py-2 px-3">英文名称</th>
                    <th className="text-left py-2 px-3">数据类型</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.fields.map((f) => (
                    <tr key={f.nameEn} className="border-t border-slate-100">
                      <td className="py-2 px-3">{f.name}</td>
                      <td className="py-2 px-3 font-mono text-[12px]">{f.nameEn}</td>
                      <td className="py-2 px-3">{f.dataType}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="text-[11px] text-slate-400 mt-3">
                字段类型与 DataArts 建表配置一致（STRING、BIGINT、DOUBLE 等）。填写数值即在表中新增枚举行。
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
