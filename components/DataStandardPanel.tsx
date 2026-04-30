import React, { useMemo, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Circle,
  Database,
  Edit2,
  Eye,
  Folder,
  FolderOpen,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react';

interface StandardDirectory {
  id: string;
  label: string;
  children?: StandardDirectory[];
}

interface StandardRow {
  id: string;
  name: string;
  code: string;
  dataType: string;
  description: string;
  status: '草稿' | '已发布';
  targetDir: string;
  modifyTime: string;
  creator: string;
}

const DIRECTORY_TREE: StandardDirectory[] = [
  {
    id: 'all',
    label: '全部',
    children: [
      {
        id: 'base',
        label: '基础标准',
        children: [
          { id: 'geo', label: '基础地理' },
          { id: 'address', label: '地名地址' },
        ],
      },
      {
        id: 'industry',
        label: '行业标准',
        children: [
          { id: 'transport', label: '交通运输' },
          { id: 'emergency', label: '应急管理' },
        ],
      },
    ],
  },
];

const STANDARD_ROWS: StandardRow[] = [
  { id: '1', name: '测试标签123', code: 'cssjy12', dataType: 'STRING', description: '-', status: '草稿', targetDir: 'test', modifyTime: '2023/02/14 17:20', creator: 'zhanglei' },
  { id: '2', name: '道路名称标准', code: 'sy', dataType: 'STRING', description: '-', status: '草稿', targetDir: 'test', modifyTime: '2023/02/14 17:11', creator: 'zhanglei' },
  { id: '3', name: '测试2标准', code: 'zmby', dataType: 'STRING', description: '-', status: '草稿', targetDir: 'test', modifyTime: '2023/01/17 19:20', creator: 'zhanglei' },
  { id: '4', name: '车辆标识', code: 'A1111', dataType: 'STRING', description: '/', status: '已发布', targetDir: 'test', modifyTime: '2023/01/03 16:12', creator: 'adv_admin' },
  { id: '5', name: '卡车车形式', code: 'CLXS', dataType: 'STRING', description: '卡车形式', status: '已发布', targetDir: '应急服务', modifyTime: '2022/12/09 14:20', creator: 'adv_admin' },
  { id: '6', name: '卡车类型', code: 'CLLX', dataType: 'STRING', description: '卡车类型', status: '已发布', targetDir: '应急服务', modifyTime: '2022/12/09 14:16', creator: 'adv_admin' },
];

export const DataStandardPanel: React.FC = () => {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['all', 'base', 'industry']));
  const [selectedDir, setSelectedDir] = useState('all');
  const [keyword, setKeyword] = useState('');

  const filteredRows = useMemo(() => {
    return STANDARD_ROWS.filter((row) => {
      const matchKeyword = `${row.name}${row.code}`.toLowerCase().includes(keyword.toLowerCase());
      return matchKeyword;
    });
  }, [keyword]);

  const toggleExpand = (id: string) => {
    const next = new Set(expanded);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setExpanded(next);
  };

  return (
    <div className="flex-1 flex bg-white h-full overflow-hidden animate-fadeIn">
      <div className="w-[280px] flex-shrink-0 border-r border-slate-100 bg-[#fcfdfe]/60 p-4 overflow-hidden">
        <div className="flex items-center justify-between h-10 px-2">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-[14px]">
            <Database size={16} className="text-blue-600" />
            标准目录
          </div>
          <button className="w-7 h-7 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 hover:border-blue-300 flex items-center justify-center">
            <RefreshCw size={12} />
          </button>
        </div>
        <div className="mt-2 mb-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
          <input className="w-full h-9 pl-9 pr-3 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-blue-400" placeholder="输入目录名称" />
        </div>
        <div className="overflow-y-auto max-h-[calc(100vh-280px)] custom-scrollbar space-y-0.5">
          {DIRECTORY_TREE.map((node) => (
            <DirectoryTreeNode
              key={node.id}
              node={node}
              level={0}
              selectedId={selectedDir}
              expanded={expanded}
              onSelect={setSelectedDir}
              onToggle={toggleExpand}
            />
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col p-6 bg-white overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <button className="h-9 px-3 rounded-lg bg-blue-600 text-white text-[13px] font-bold flex items-center gap-1.5">
              <Plus size={14} /> 新建
            </button>
            <button className="h-9 px-3 rounded-lg border border-slate-200 text-slate-600 text-[13px] font-medium">
              发布
            </button>
            <button className="h-9 px-3 rounded-lg border border-slate-200 text-slate-600 text-[13px] font-medium">
              下线
            </button>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="按标准名称/编码搜索"
                className="w-72 h-9 pl-9 pr-3 border border-slate-200 rounded-lg text-[13px] outline-none focus:border-blue-400"
              />
            </div>
            <button className="w-9 h-9 rounded-lg border border-slate-200 text-slate-500 hover:text-blue-600 flex items-center justify-center">
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto border border-slate-100 rounded-xl">
          <table className="w-full text-left text-[13px] border-collapse">
            <thead className="bg-[#f8fafc] text-slate-500 border-b border-slate-100 sticky top-0 z-10">
              <tr>
                <th className="p-3 w-10 text-center"><input type="checkbox" className="rounded border-slate-300" /></th>
                <th className="p-3 font-bold">标准名称</th>
                <th className="p-3 font-bold">标准编码</th>
                <th className="p-3 font-bold">数据类型</th>
                <th className="p-3 font-bold">描述</th>
                <th className="p-3 font-bold">状态</th>
                <th className="p-3 font-bold">所属目录</th>
                <th className="p-3 font-bold">修改时间</th>
                <th className="p-3 font-bold">创建人</th>
                <th className="p-3 font-bold text-center">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredRows.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80">
                  <td className="p-3 text-center"><input type="checkbox" className="rounded border-slate-300" /></td>
                  <td className="p-3 font-semibold text-slate-700">{row.name}</td>
                  <td className="p-3 text-slate-600">{row.code}</td>
                  <td className="p-3 text-slate-600">{row.dataType}</td>
                  <td className="p-3 text-slate-500">{row.description}</td>
                  <td className="p-3">
                    <span className={`inline-flex items-center gap-1 text-[12px] ${row.status === '已发布' ? 'text-emerald-600' : 'text-blue-600'}`}>
                      <Circle size={8} className={row.status === '已发布' ? 'fill-emerald-500' : 'fill-blue-500'} />
                      {row.status}
                    </span>
                  </td>
                  <td className="p-3 text-slate-500">{row.targetDir}</td>
                  <td className="p-3 text-slate-500">{row.modifyTime}</td>
                  <td className="p-3 text-slate-500">{row.creator}</td>
                  <td className="p-3">
                    <div className="flex items-center justify-center gap-1 text-slate-400">
                      <button className="p-1.5 hover:text-blue-600"><Eye size={14} /></button>
                      <button className="p-1.5 hover:text-blue-600"><Edit2 size={14} /></button>
                      <button className="p-1.5 hover:text-red-600"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex items-center justify-between text-[12px] text-slate-500">
          <div>共 {filteredRows.length} 条</div>
          <div className="flex items-center gap-3">
            <div className="h-8 px-2 rounded border border-slate-200 flex items-center gap-1">10条/页 <ChevronDown size={12} /></div>
            <div className="flex items-center gap-1">
              <button className="w-8 h-8 border border-slate-200 rounded flex items-center justify-center"><ChevronLeft size={14} /></button>
              <button className="w-8 h-8 bg-blue-600 text-white rounded font-bold">1</button>
              <button className="w-8 h-8 border border-slate-200 rounded flex items-center justify-center"><ChevronRight size={14} /></button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

interface DirectoryTreeNodeProps {
  node: StandardDirectory;
  level: number;
  selectedId: string;
  expanded: Set<string>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
}

const DirectoryTreeNode: React.FC<DirectoryTreeNodeProps> = ({
  node,
  level,
  selectedId,
  expanded,
  onSelect,
  onToggle,
}) => {
  const hasChildren = (node.children || []).length > 0;
  const isExpanded = expanded.has(node.id);
  const isSelected = selectedId === node.id;

  return (
    <div>
      <div
        style={{ paddingLeft: `${8 + level * 16}px` }}
        className={`h-9 pr-2 rounded-lg flex items-center cursor-pointer group ${
          isSelected ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-50'
        }`}
        onClick={() => onSelect(node.id)}
      >
        <button
          className="w-5 h-5 mr-1 text-slate-400 flex items-center justify-center"
          onClick={(e) => {
            e.stopPropagation();
            if (hasChildren) onToggle(node.id);
          }}
        >
          {hasChildren ? <ChevronDown size={14} className={`transition-transform ${isExpanded ? '' : '-rotate-90'}`} /> : null}
        </button>
        {isExpanded ? <FolderOpen size={14} className="text-blue-500" /> : <Folder size={14} className="text-blue-500" />}
        <span className={`ml-2 text-[13px] ${isSelected ? 'font-bold' : 'font-medium'}`}>{node.label}</span>
      </div>
      {hasChildren && isExpanded && node.children!.map((child) => (
        <DirectoryTreeNode
          key={child.id}
          node={child}
          level={level + 1}
          selectedId={selectedId}
          expanded={expanded}
          onSelect={onSelect}
          onToggle={onToggle}
        />
      ))}
    </div>
  );
};
