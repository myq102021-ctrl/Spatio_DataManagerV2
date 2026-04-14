
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Undo2, 
  ChevronRight, 
  Settings2, 
  Search,
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Terminal,
  Play,
  Code2,
  ChevronDown,
  FileText,
  FlaskConical,
  X,
  ArrowRight,
  ArrowLeft,
  Info,
  Database,
  RefreshCw,
  Check,
  Tag as TagIcon,
  Copy,
  AppWindow
} from 'lucide-react';
import { DirectoryNode } from './ServiceDevelopmentPanel';
import { APIRow } from '../constants';

const RECOMMENDED_TAGS = ['政务数据', '金融统计', '人口普查', '实时监控', '历史归档', '公共服务', '商业分析', '脱敏数据'];

const MOCK_APPS = [
    '智慧城市综合管理平台',
    '自然资源一张图系统',
    '应急指挥高度中心',
    '社会经济运行监测系统',
    '水利枢纽安全监管平台',
    '智慧交通云控平台',
    '数字孪生城市底座',
];

// 优化后的平铺路径函数：生成完整的“层级 / 路径”
const getFlattenedPaths = (nodes: DirectoryNode[] = [], prefix = ''): {id: string, label: string}[] => {
    let result: {id: string, label: string}[] = [];
    (nodes || []).forEach(node => {
        if (node.id === 'all') return; // 跳过“全部服务”虚拟节点
        const currentPath = prefix ? `${prefix} / ${node.label}` : node.label;
        result.push({ id: node.id, label: currentPath });
        if (node.children) {
            result = [...result, ...getFlattenedPaths(node.children, currentPath)];
        }
    });
    return result;
};

interface APIScriptWizardProps {
  onBack: () => void;
  onSaveDraft?: () => void;
  directories: DirectoryNode[];
  initialData?: APIRow;
}

export const APIScriptWizard: React.FC<APIScriptWizardProps> = ({ onBack, onSaveDraft, directories = [], initialData }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState(initialData?.name || '');
  const [dirId, setDirId] = useState(initialData?.dirId || '');
  const [protocol, setProtocol] = useState<'HTTP' | 'HTTPS'>((initialData?.protocol as any) || 'HTTP');
  const [path, setPath] = useState(initialData?.path?.replace(/^\//, '') || '');
  const [method, setMethod] = useState<'POST' | 'GET'>((initialData?.method as any) || 'POST');
  const [description, setDescription] = useState(initialData?.description || '');
  
  // 新增应用选择状态
  const [selectedApp, setSelectedApp] = useState('');

  // 分页参数配置状态
  const [pagingParams, setPagingParams] = useState({
    pageNum: { default: '1', max: '-', desc: '当前页码，从1开始计目' },
    pageSize: { default: '10', max: '100', desc: '每页展示条数，单次最大限制100' }
  });
  
  // 标签相关状态
  const [tags, setTags] = useState<string[]>(['脚本开发']);
  const [tagInput, setTagInput] = useState('');
  const [isTagDropdownOpen, setIsTagDropdownOpen] = useState(false);
  const tagContainerRef = useRef<HTMLDivElement>(null);

  // SQL Editor State
  const [sql, setSql] = useState<string>(initialData?.sql || "SELECT * FROM t_user_info WHERE region = ${region} AND age > ${min_age}");
  const [isParsingSql, setIsParsingSql] = useState(false);

  // 实时同步目录下拉数据
  const dirOptions = useMemo(() => getFlattenedPaths(directories), [directories]);

  // 状态管理：配置数据
  const [reqItems, setReqItems] = useState<any[]>(initialData?.requestParams || [
    { name: 'region', field: 'region', type: 'STRING', loc: 'QUERY', op: '=', required: true, example: '武汉', default: '' },
    { name: 'min_age', field: 'min_age', type: 'INT', loc: 'QUERY', op: '>', required: false, example: '18', default: '0' },
  ]);
  const [retItems, setRetItems] = useState<any[]>(initialData?.responseParams || [
    { name: 'userId', field: 'id', type: 'LONG', example: '10001', desc: 'ID' },
    { name: 'userName', field: 'user_name', type: 'STRING', example: '张三', desc: '姓名' },
  ]);
  const [sortItems, setSortItems] = useState<any[]>([
    { field: 'create_time', order: 'DESC' }
  ]);

  const wizardSteps = [
    { id: 1, label: '基础信息', icon: <FileText size={16} /> },
    { id: 2, label: '数据配置', icon: <Settings2 size={16} /> },
    { id: 3, label: '测试', icon: <FlaskConical size={16} /> },
  ];

  const parseSqlParameters = () => {
      setIsParsingSql(true);
      setTimeout(() => {
          const matches = sql.match(/\$\{[a-zA-Z0-9_]+\}/g);
          if (matches) {
              const params = matches.map(m => m.replace('${', '').replace('}', ''));
              const uniqueParams = [...new Set(params)];
              
              const newReq = uniqueParams.map(p => ({
                  name: p, field: p, type: 'STRING', loc: 'QUERY', op: '=', required: true, example: '', default: ''
              }));

              const existingFields = new Set(reqItems.map(r => r.field));
              const additions = newReq.filter(nr => !existingFields.has(nr.field));
              setReqItems([...reqItems, ...additions]);
          }
          setIsParsingSql(false);
      }, 600);
  };

  // 手动添加参数逻辑
  const handleAddReqParam = () => {
    setReqItems([...reqItems, { name: '', field: '', type: 'STRING', loc: 'QUERY', op: '=', required: false, example: '', default: '' }]);
  };

  const handleAddRetParam = () => {
    setRetItems([...retItems, { name: '', field: '', type: 'STRING', example: '', desc: '' }]);
  };

  const handleAddSortParam = () => {
    setSortItems([...sortItems, { field: '', order: 'ASC' }]);
  };

  // 标签处理逻辑
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
            {initialData ? '编辑服务' : '创建服务'} <span className="text-slate-400 font-medium ml-2 text-sm">(脚本模式)</span>
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
              onClick={() => setStep(step - 1)}
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
            onClick={() => step < wizardSteps.length ? setStep(step + 1) : onBack()}
            className="px-6 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold shadow-md hover:bg-blue-700 flex items-center gap-2 transition-all active:scale-95"
          >
            {step === wizardSteps.length ? '确认发布' : '下一步'}
            {step !== wizardSteps.length && <ArrowRight size={14} />}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-6xl mx-auto space-y-8 animate-slideUp">
          {step === 1 && (
             <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-8">
              <FormHeader title="基础信息设置" />
              <div className="grid grid-cols-3 gap-x-10 gap-y-6">
                <FormItem label="服务名称" required>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="请输入服务名称" className="w-full h-10 px-4 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-sm" />
                </FormItem>
                <FormItem label="服务目录" required>
                   <div className="relative group">
                    <select value={dirId} onChange={(e) => setDirId(e.target.value)} className="w-full h-10 px-4 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-sm appearance-none bg-white cursor-pointer group-hover:border-slate-300">
                      <option value="">请选择服务目录</option>
                      {(dirOptions || []).map(opt => (
                        <option key={opt.id} value={opt.id}>{opt.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3 text-slate-400 pointer-events-none group-hover:text-slate-600 transition-colors" size={16} />
                  </div>
                </FormItem>

                <FormItem label="服务协议" required>
                  <div className="flex bg-slate-100 p-1 rounded-lg w-fit">
                    <button onClick={() => setProtocol('HTTP')} className={`px-6 py-1 text-xs font-bold rounded-md transition-all ${protocol === 'HTTP' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>HTTP</button>
                    <button onClick={() => setProtocol('HTTPS')} className={`px-6 py-1 text-xs font-bold rounded-md transition-all ${protocol === 'HTTPS' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>HTTPS</button>
                  </div>
                </FormItem>
                <FormItem label="服务 Path" required>
                  <div className="flex items-center">
                    <span className="h-10 px-3 flex items-center bg-slate-50 border border-r-0 border-slate-200 rounded-l-lg text-slate-400 text-sm font-mono">/</span>
                    <input type="text" value={path} onChange={(e) => setPath(e.target.value)} placeholder="例如: user/list" className="flex-1 h-10 px-4 border border-slate-200 rounded-r-lg outline-none focus:border-blue-500 text-sm" />
                  </div>
                </FormItem>

                <FormItem label="请求方式" required>
                   <div className="flex gap-6 mt-2">
                      <Radio label="POST" checked={method === 'POST'} onChange={() => setMethod('POST')} />
                      <Radio label="GET" checked={method === 'GET'} onChange={() => setMethod('GET')} />
                   </div>
                </FormItem>

                <FormItem label="服务标签">
                  <div className="relative" ref={tagContainerRef}>
                    <div 
                      className="w-full min-h-[40px] p-1.5 border border-slate-200 rounded-lg flex flex-wrap gap-1.5 bg-white cursor-text focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-50 transition-all"
                      onClick={() => setIsTagDropdownOpen(true)}
                    >
                      {tags.map(tag => (
                        <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-blue-50 text-blue-600 text-xs font-bold rounded border border-blue-100 animate-fadeIn">
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
                        className="flex-1 min-w-[60px] outline-none text-sm bg-transparent"
                      />
                    </div>
                    {isTagDropdownOpen && (
                      <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-50 py-2 max-h-48 overflow-y-auto custom-scrollbar animate-fadeIn">
                        <div className="px-3 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-50 mb-1">推荐标签</div>
                        {filteredRecommended.map(tag => (
                          <div 
                            key={tag}
                            onClick={() => addTag(tag)}
                            className="px-4 py-2 text-sm text-slate-600 hover:bg-blue-50 hover:text-blue-600 cursor-pointer transition-colors flex items-center gap-2"
                          >
                            <TagIcon size={14} className="text-slate-300" />
                            {tag}
                          </div>
                        ))}
                        {tagInput && !tags.includes(tagInput) && !RECOMMENDED_TAGS.includes(tagInput) && (
                          <div 
                            onClick={() => addTag(tagInput)}
                            className="px-4 py-2 text-sm text-blue-600 bg-blue-50/50 hover:bg-blue-50 cursor-pointer font-bold border-t border-slate-50 mt-1"
                          >
                            按回车创建新标签: "{tagInput}"
                          </div>
                        )}
                        {filteredRecommended.length === 0 && !tagInput && (
                          <div className="px-4 py-4 text-center text-xs text-slate-400">暂无更多推荐标签</div>
                        )}
                      </div>
                    )}
                  </div>
                </FormItem>
                
                <div className="col-span-3">
                  <FormItem label="描述">
                    <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="请输入服务功能描述（2000字以内）" className="w-full h-24 px-4 py-3 border border-slate-200 rounded-lg outline-none focus:border-blue-500 text-sm resize-none"></textarea>
                  </FormItem>
                </div>
              </div>
             </div>
          )}
          {step === 2 && (
            <div className="space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm">
                <FormHeader title="数据源连接" />
                <div className="grid grid-cols-2 gap-x-10 gap-y-6 mt-4">
                  <FormItem label="所属应用">
                    <SearchableAppSelector value={selectedApp} onChange={setSelectedApp} />
                  </FormItem>
                  <FormItem label="数据源类型" required>
                    <select className="w-full h-10 px-4 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-blue-500"><option>MySQL</option><option>PostgreSQL</option><option>PostGIS</option></select>
                  </FormItem>
                  <FormItem label="数据源名称" required>
                    <select className="w-full h-10 px-4 border border-slate-200 rounded-lg text-sm bg-white outline-none focus:border-blue-500"><option>{initialData?.dataSource || 'business_db_01'}</option><option>spatial_data_center</option></select>
                  </FormItem>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col h-[400px]">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                   <div className="flex items-center gap-2">
                        <div className="w-1.5 h-4 bg-indigo-500 rounded-full"></div>
                        <h3 className="text-base font-bold text-slate-800">数据逻辑 definition</h3>
                        <span className="text-[10px] bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded font-bold ml-2">SQL MODE</span>
                   </div>
                   <button 
                    onClick={parseSqlParameters}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 text-indigo-600 rounded-lg text-xs font-bold hover:bg-indigo-50 transition-all shadow-sm"
                   >
                     {isParsingSql ? <RefreshCw size={14} className="animate-spin" /> : <Database size={14} />}
                     解析 SQL 参数
                   </button>
                </div>
                <div className="flex-1 flex overflow-hidden">
                    <div className="w-12 bg-[#1e1e2d] border-r border-white/5 flex flex-col items-center py-4 text-[#4b4b7c] font-mono text-xs select-none">
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(n => <div key={n} className="h-5">{n}</div>)}
                    </div>
                    <textarea 
                        value={sql}
                        onChange={(e) => setSql(e.target.value)}
                        className="flex-1 bg-[#1e1e2d] text-emerald-400 font-mono text-[14px] p-4 outline-none resize-none spellcheck-false"
                        spellCheck={false}
                    />
                </div>
                <div className="px-6 py-2 bg-[#f1f5f9] border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-4">
                    <span className="flex items-center gap-1"><Info size={12} /> 使用 <b>{"${parameter}"}</b> 定义动态参数</span>
                    <span className="flex items-center gap-1"><Info size={12} /> 支持标准 SQL</span>
                </div>
              </div>

              <div className="bg-white rounded-2xl border border-slate-200 p-8 shadow-sm space-y-6">
                <div className="flex justify-between items-center">
                  <FormHeader title="参数映射配置" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[13px] font-bold text-slate-700 flex items-center gap-2">
                      <div className="w-1 h-3.5 bg-blue-500 rounded-full"></div> 请求参数配置
                    </div>
                    <button 
                      onClick={handleAddReqParam}
                      className="flex items-center gap-1.5 text-blue-600 text-xs font-bold hover:text-blue-700 transition-colors bg-blue-50 px-2 py-1 rounded border border-blue-100"
                    >
                      <Plus size={14} strokeWidth={3} /> 添加参数
                    </button>
                  </div>
                  <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                        <tr>
                          <th className="p-3">参数名称</th><th className="p-3">绑定字段</th><th className="p-3">类型</th><th className="p-3">位置</th><th className="p-3">操作符</th><th className="p-3">必填</th><th className="p-3">示例值</th><th className="p-3">默认值</th><th className="p-3 text-center">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                        {(reqItems || []).map((item, i) => (
                           <ParamRow key={i} {...item} onRemove={() => setReqItems(reqItems.filter((_, idx) => idx !== i))} />
                        ))}
                        {(reqItems || []).length === 0 && (
                            <tr><td colSpan={9} className="p-8 text-center text-slate-400">暂无参数，请解析 SQL 或手动添加</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[13px] font-bold text-slate-700 flex items-center gap-2">
                      <div className="w-1 h-3.5 bg-emerald-500 rounded-full"></div> 返回参数配置
                    </div>
                    <button 
                      onClick={handleAddRetParam}
                      className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold hover:text-emerald-700 transition-colors bg-emerald-50 px-2 py-1 rounded border border-emerald-100"
                    >
                      <Plus size={14} strokeWidth={3} /> 添加参数
                    </button>
                  </div>
                  <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                        <tr>
                          <th className="p-3">参数名称</th><th className="p-3">绑定字段</th><th className="p-3">类型</th><th className="p-3">示例值</th><th className="p-3">描述</th><th className="p-3 text-center">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {(retItems || []).map((item, i) => (
                           <ReturnRow key={i} {...item} onRemove={() => setRetItems(retItems.filter((_, idx) => idx !== i))} />
                         ))}
                         {(retItems || []).length === 0 && (
                            <tr><td colSpan={6} className="p-8 text-center text-slate-400">暂无返回参数，请手动添加配置</td></tr>
                         )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="text-[13px] font-bold text-slate-700 flex items-center gap-2">
                      <div className="w-1 h-3.5 bg-indigo-500 rounded-full"></div> 排序参数配置
                    </div>
                    <button 
                      onClick={handleAddSortParam}
                      className="flex items-center gap-1.5 text-indigo-600 text-xs font-bold hover:text-indigo-700 transition-colors bg-indigo-50 px-2 py-1 rounded border border-indigo-100"
                    >
                      <Plus size={14} strokeWidth={3} /> 添加参数
                    </button>
                  </div>
                  <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                        <tr>
                          <th className="p-3">字段名称</th><th className="p-3">排序方式</th><th className="p-3 text-center">操作</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {(sortItems || []).map((item, i) => (
                           <SortRow key={i} {...item} onRemove={() => setSortItems(sortItems.filter((_, idx) => idx !== i))} />
                         ))}
                         {(sortItems || []).length === 0 && (
                            <tr><td colSpan={3} className="p-8 text-center text-slate-400">暂无排序配置</td></tr>
                         )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* 分页参数配置区块 (系统固定) */}
                <div className="space-y-3 pt-4">
                  <div className="flex items-center justify-between">
                    <div className="text-[13px] font-bold text-slate-700 flex items-center gap-2">
                      <div className="w-1 h-3.5 bg-[#4ade80] rounded-full"></div> 分页参数配置 (系统固定)
                    </div>
                  </div>
                  <div className="border border-slate-100 rounded-xl overflow-hidden shadow-sm">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                        <tr>
                          <th className="p-3">参数名称</th>
                          <th className="p-3">类型</th>
                          <th className="p-3">位置</th>
                          <th className="p-3">必填</th>
                          <th className="p-3">默认值</th>
                          <th className="p-3">最大值</th>
                          <th className="p-3">描述</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50 text-slate-600">
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-medium">pageNum</td>
                          <td className="p-3">INT</td>
                          <td className="p-3">QUERY</td>
                          <td className="p-3">否</td>
                          <td className="p-3">
                            <input 
                                type="text" 
                                value={pagingParams.pageNum.default} 
                                onChange={(e) => setPagingParams({...pagingParams, pageNum: {...pagingParams.pageNum, default: e.target.value}})}
                                className="w-12 h-6 border border-slate-200 rounded px-1 text-center outline-none focus:border-blue-400" 
                            />
                          </td>
                          <td className="p-3">
                            <input 
                                type="text" 
                                value={pagingParams.pageNum.max} 
                                onChange={(e) => setPagingParams({...pagingParams, pageNum: {...pagingParams.pageNum, max: e.target.value}})}
                                className="w-12 h-6 border border-slate-200 rounded px-1 text-center outline-none focus:border-blue-400" 
                            />
                          </td>
                          <td className="p-3">
                            <input 
                                type="text" 
                                value={pagingParams.pageNum.desc} 
                                onChange={(e) => setPagingParams({...pagingParams, pageNum: {...pagingParams.pageNum, desc: e.target.value}})}
                                className="w-full bg-transparent outline-none focus:border-b border-blue-200" 
                            />
                          </td>
                        </tr>
                        <tr className="hover:bg-slate-50 transition-colors">
                          <td className="p-3 font-medium">pageSize</td>
                          <td className="p-3">INT</td>
                          <td className="p-3">QUERY</td>
                          <td className="p-3">否</td>
                          <td className="p-3">
                            <input 
                                type="text" 
                                value={pagingParams.pageSize.default} 
                                onChange={(e) => setPagingParams({...pagingParams, pageSize: {...pagingParams.pageSize, default: e.target.value}})}
                                className="w-12 h-6 border border-slate-200 rounded px-1 text-center outline-none focus:border-blue-400" 
                            />
                          </td>
                          <td className="p-3">
                            <input 
                                type="text" 
                                value={pagingParams.pageSize.max} 
                                onChange={(e) => setPagingParams({...pagingParams, pageSize: {...pagingParams.pageSize, max: e.target.value}})}
                                className="w-12 h-6 border border-slate-200 rounded px-1 text-center outline-none focus:border-blue-400" 
                            />
                          </td>
                          <td className="p-3">
                            <input 
                                type="text" 
                                value={pagingParams.pageSize.desc} 
                                onChange={(e) => setPagingParams({...pagingParams, pageSize: {...pagingParams.pageSize, desc: e.target.value}})}
                                className="w-full bg-transparent outline-none focus:border-b border-blue-200" 
                            />
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="grid grid-cols-2 gap-8 h-[600px] animate-fadeIn">
               <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
                  <div className="flex items-center gap-2 font-bold text-slate-800 text-sm">
                    <Terminal size={16} className="text-blue-600" /> 测试参数输入
                  </div>
                  <button className="flex items-center gap-2 px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-all">
                    <Play size={12} fill="currentColor" /> 发送请求
                  </button>
                </div>
                <div className="flex-1 p-6 space-y-6 overflow-y-auto custom-scrollbar">
                   {(reqItems || []).map((r, i) => (
                      <div key={i} className="space-y-1.5">
                        <div className="text-[11px] font-bold text-slate-500 ml-1">{r.name || '未命名参数'}</div>
                        <input type="text" placeholder={`请输入${r.name}`} defaultValue={r.example} className="w-full h-9 px-4 border border-slate-200 rounded-lg text-xs outline-none focus:border-blue-500 transition-all shadow-sm" />
                      </div>
                   ))}
                </div>
              </div>
              <div className="bg-[#0f172a] rounded-2xl shadow-xl flex flex-col overflow-hidden border border-white/5">
                <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-emerald-400 font-mono text-xs">
                    <Code2 size={16} /> JSON Response Preview
                  </div>
                </div>
                <div className="flex-1 p-6 font-mono text-[13px] text-blue-300 overflow-y-auto custom-scrollbar leading-relaxed">
                  <pre>{"{\n  \"code\": 200,\n  \"message\": \"success\",\n  \"data\": {\n    \"list\": [\n      {\n        \"id\": 10001,\n        \"user_name\": \"张三\",\n        \"region\": \"武汉\"\n      }\n    ],\n    \"total\": 1\n  }\n}"}</pre>
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
                    <span className={`text-sm truncate ${value ? 'text-slate-800 font-bold' : 'text-slate-400'}`}>
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
                        {filtered.map(app => (
                            <div 
                                key={app}
                                onClick={() => { onChange(app); setIsOpen(false); setSearch(''); }}
                                className={`px-4 py-2 text-[13px] cursor-pointer flex items-center justify-between transition-colors ${value === app ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                                {app}
                                {value === app && <Check size={14} />}
                            </div>
                        ))}
                        {filtered.length === 0 && (
                            <div className="p-6 text-center text-xs text-slate-400 font-medium">未找到相关应用</div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

// 辅助组件...
const FormHeader: React.FC<{ title: string }> = ({ title }) => (
  <div className="flex items-center gap-2 mb-2">
    <div className="w-1.5 h-4 bg-blue-600 rounded-full"></div>
    <h3 className="text-base font-bold text-slate-800">{title}</h3>
  </div>
);

// Explicitly use block body and return to avoid JSX parsing ambiguities in TSX
const FormItem: React.FC<{ label: string; required?: boolean; children: React.ReactNode }> = ({ label, required, children }) => {
  return (
    <div className="space-y-2">
      <label className="text-[13px] font-bold text-slate-700 ml-1">
        {required && <span className="text-red-500 mr-1">*</span>}
        {label}
      </label>
      {children}
    </div>
  );
};

const Radio: React.FC<{ label: string; checked: boolean; onChange: () => void }> = ({ label, checked, onChange }) => (
  <label onClick={onChange} className="flex items-center gap-2 cursor-pointer group">
    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${checked ? 'border-blue-600 bg-blue-50' : 'border-slate-300'}`}>
      {checked && <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div>}
    </div>
    <span className={`text-xs font-bold ${checked ? 'text-blue-600' : 'text-slate-500'}`}>{label}</span>
  </label>
);

const TableSelect: React.FC<{ 
    value: string; 
    options: (string | {value: string, label: string})[]; 
    className?: string 
  }> = ({ value, options, className }) => (
    <div className={`relative group flex items-center ${className}`}>
      <select className="w-full bg-transparent outline-none appearance-none cursor-pointer text-blue-600 font-medium pr-4 focus:border-b-2 border-blue-400" value={value} readOnly>
        {options.map(opt => {
          const val = typeof opt === 'string' ? opt : opt.value;
          const lab = typeof opt === 'string' ? opt : opt.label;
          return <option key={val} value={val}>{lab}</option>;
        })}
      </select>
      <ChevronDown size={12} className="absolute right-0 text-slate-400 pointer-events-none group-hover:text-blue-500" />
    </div>
  );

const ParamRow: React.FC<any> = ({ name, field, type, loc, op, required, example, onRemove }) => (
  <tr className="hover:bg-slate-50 transition-colors">
    <td className="p-3"><input type="text" defaultValue={name} placeholder="参数名" className="w-full bg-transparent outline-none focus:border-b border-blue-400" /></td>
    <td className="p-3 text-slate-500 font-mono"><input type="text" defaultValue={field} placeholder="绑定字段" className="w-full bg-transparent outline-none focus:border-b border-blue-200" /></td>
    <td className="p-3">
      <TableSelect value={type} options={['STRING', 'INT', 'LONG', 'FLOAT', 'DOUBLE', 'BOOLEAN']} />
    </td>
    <td className="p-3">
      <TableSelect value={loc} options={['QUERY', 'BODY']} />
    </td>
    <td className="p-3">
      <TableSelect value={op} options={['=', 'LIKE', 'IN', '>', '<', '>=', '<=']} />
    </td>
    <td className="p-3 text-center"><input type="checkbox" defaultChecked={required} className="rounded" /></td>
    <td className="p-3"><input type="text" defaultValue={example} placeholder="示例" className="w-16 h-6 border border-slate-100 rounded px-1 outline-none focus:border-blue-300" /></td>
    <td className="p-3"><input type="text" placeholder="默认" className="w-16 h-6 border border-slate-100 rounded px-1 outline-none focus:border-blue-300" /></td>
    <td className="p-3 text-center"><button onClick={onRemove} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button></td>
  </tr>
);

const ReturnRow: React.FC<any> = ({ name, field, type, example, desc, onRemove }) => (
  <tr className="hover:bg-slate-50 transition-colors">
    <td className="p-3 font-bold"><input type="text" defaultValue={name} placeholder="参数名" className="w-full bg-transparent outline-none focus:border-b border-blue-400" /></td>
    <td className="p-3 text-slate-500 font-mono"><input type="text" defaultValue={field} placeholder="绑定字段" className="w-full bg-transparent outline-none focus:border-b border-blue-200" /></td>
    <td className="p-3">
      <TableSelect value={type} options={['STRING', 'INT', 'LONG', 'FLOAT', 'DOUBLE', 'BOOLEAN']} />
    </td>
    <td className="p-3 text-slate-600"><input type="text" defaultValue={example} placeholder="示例" className="w-full bg-transparent outline-none" /></td>
    <td className="p-3"><input type="text" defaultValue={desc} placeholder="描述" className="w-full bg-transparent outline-none" /></td>
    <td className="p-3 text-center"><button onClick={onRemove} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button></td>
  </tr>
);

const SortRow: React.FC<any> = ({ field, order, onRemove }) => (
  <tr className="hover:bg-slate-50 transition-colors">
    <td className="p-3 font-mono text-slate-700"><input type="text" defaultValue={field} placeholder="字段名" className="w-full bg-transparent outline-none focus:border-b border-blue-400" /></td>
    <td className="p-3">
        <select className="bg-transparent text-blue-600 font-bold outline-none" defaultValue={order}>
            <option value="ASC">升序 (ASC)</option>
            <option value="DESC">降序 (DESC)</option>
        </select>
    </td>
    <td className="p-3 text-center flex items-center justify-center gap-4">
        <div className="flex gap-1">
            <button className="p-1 hover:bg-slate-100 rounded text-slate-400"><ArrowUp size={14} /></button>
            <button className="p-1 hover:bg-slate-100 rounded text-slate-400"><ArrowDown size={14} /></button>
        </div>
        <button onClick={onRemove} className="text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
    </td>
  </tr>
);
