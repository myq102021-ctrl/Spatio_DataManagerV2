import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  X, 
  ClipboardCheck, 
  Activity, 
  Play, 
  Trash2, 
  Edit2, 
  ChevronRight,
  Info,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { MaskingRule } from '../types';

const MASKING_TYPES = [
  '字符遮盖', 
  '全遮盖', 
  '哈希脱敏', 
  '关键字替换', 
  '取整脱敏', 
  '加密脱敏'
] as const;

const INITIAL_RULES: MaskingRule[] = [
  { id: '1', name: '姓名字符部分遮盖', type: '字符遮盖', config: { strategy: 'keep_n_m', n: 1, m: 0, maskChar: '*' }, createTime: '2024-03-20 10:00' },
  { id: '2', name: '全站全网全遮盖', type: '全遮盖', config: {}, createTime: '2024-03-20 11:30' },
  { id: '3', name: '核心关键词过滤', type: '关键字替换', config: { pairs: [{ from: '张三', to: '张先生' }] }, createTime: '2024-03-21 09:15' },
];

interface Props {
  onNavigate?: (id: string) => void;
}

export const MaskingRulesPanel: React.FC<Props> = ({ onNavigate }) => {
  const [rules, setRules] = useState<MaskingRule[]>(INITIAL_RULES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
  const [isTypeFilterOpen, setIsTypeFilterOpen] = useState(false);
  
  // Create Form State
  const [formData, setFormData] = useState<Partial<MaskingRule>>({
    name: '',
    type: '字符遮盖',
    config: {
      strategy: 'keep_n_m',
      maskChar: '*',
      n: 1,
      m: 1,
      x: 1,
      y: 5,
      specialChar: '@',
      pairs: [{ from: '', to: '' }]
    }
  });

  // Test State
  const [testInput, setTestInput] = useState('');
  const [testResult, setTestResult] = useState('');

  const handleSave = () => {
    if (editingId) {
      setRules(rules.map(r => r.id === editingId ? {
        ...r,
        name: formData.name!,
        type: formData.type!,
        config: formData.config
      } : r));
    } else {
      const newRule: MaskingRule = {
        id: Math.random().toString(36).substr(2, 9),
        name: formData.name!,
        type: formData.type!,
        config: formData.config,
        createTime: new Date().toLocaleString().replace(/\//g, '-')
      };
      setRules([newRule, ...rules]);
    }
    setIsModalOpen(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除该脱敏算法吗？')) {
      setRules(rules.filter(r => r.id !== id));
    }
  };

  const handleEdit = (rule: MaskingRule) => {
    setFormData({
      name: rule.name,
      type: rule.type,
      config: rule.config
    });
    setEditingId(rule.id);
    setIsModalOpen(true);
  };

  const handleOpenCreate = () => {
    setFormData({
      name: '',
      type: '字符遮盖',
      config: {
        strategy: 'keep_n_m',
        maskChar: '*',
        n: 1,
        m: 1,
        x: 1,
        y: 5,
        specialChar: '@',
        pairs: [{ from: '', to: '' }]
      }
    });
    setEditingId(null);
    setIsModalOpen(true);
  };

  const handleTest = () => {
    // Enhanced mock logic for testing UI according to strategy
    let result = '';
    const { type, config } = formData;
    const input = testInput || '';
    
    if (type === '全遮盖') {
      result = '*'.repeat(input.length || 8);
    } else if (type === '字符遮盖') {
      const char = config.maskChar === '*' ? '*' : (config.maskChar === 'random_digit' ? '7' : (config.maskChar === 'random_letter' ? 'k' : 'x'));
      const strategy = config.strategy;
      
      switch(strategy) {
        case 'keep_n_m': {
          const n = config.n || 0;
          const m = config.m || 0;
          if (input.length <= n + m) {
            result = input;
          } else {
            result = input.substring(0, n) + char.repeat(input.length - n - m) + input.substring(input.length - m);
          }
          break;
        }
        case 'keep_x_y': {
          const x = (config.x || 1) - 1;
          const y = config.y || 1;
          result = input.split('').map((c, i) => (i >= x && i < y) ? c : char).join('');
          break;
        }
        case 'mask_n_m': {
          const n = config.n || 0;
          const m = config.m || 0;
          result = char.repeat(n) + input.substring(n, input.length - m) + char.repeat(Math.min(m, input.length - n));
          break;
        }
        case 'mask_x_y': {
          const x = (config.x || 1) - 1;
          const y = config.y || 1;
          result = input.split('').map((c, i) => (i >= x && i < y) ? char : c).join('');
          break;
        }
        case 'mask_before_char': {
          const sc = config.specialChar || '@';
          const idx = input.indexOf(sc);
          if (idx === -1) result = input;
          else result = char.repeat(idx) + input.substring(idx);
          break;
        }
        case 'mask_after_char': {
          const sc = config.specialChar || '@';
          const idx = input.indexOf(sc);
          if (idx === -1) result = input;
          else result = input.substring(0, idx + 1) + char.repeat(input.length - idx - 1);
          break;
        }
        default:
          result = input;
      }
    } else if (type === '关键字替换') {
      result = input;
      config.pairs?.forEach((p: any) => {
        if (p.from && p.to) result = result.replace(new RegExp(p.from, 'g'), p.to);
      });
    } else {
      result = `[${type}] ${input}`;
    }
    setTestResult(result);
  };

  const filteredRules = rules.filter(r => {
    const matchesSearch = r.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter ? r.type === typeFilter : true;
    return matchesSearch && matchesType;
  });

  return (
    <div className="flex flex-col h-full bg-white animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <ClipboardCheck size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">脱敏规则配置</h2>
            <p className="text-xs text-slate-400 font-medium">配置各类脱敏算法及其掩盖替换逻辑</p>
          </div>
        </div>
        <button 
          onClick={handleOpenCreate}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-100"
        >
          <Plus size={18} />
          新建脱敏算法
        </button>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-4 flex items-center gap-4 bg-slate-50/50">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="搜索算法名称..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none"
          />
        </div>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left border-b border-slate-100">
              <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider pl-4">脱敏算法名称</th>
              <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider relative">
                <div className="flex items-center gap-1.5 cursor-pointer hover:text-slate-600 transition-colors" onClick={() => setIsTypeFilterOpen(!isTypeFilterOpen)}>
                  脱敏类型
                  <Filter size={14} className={typeFilter ? 'text-blue-600' : 'text-slate-300'} />
                </div>
                
                <AnimatePresence>
                  {isTypeFilterOpen && (
                    <>
                      <div className="fixed inset-0 z-20" onClick={() => setIsTypeFilterOpen(false)} />
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="absolute top-8 left-0 z-30 w-48 bg-white rounded-xl shadow-2xl border border-slate-100 p-2 py-3"
                      >
                        <div className="px-3 mb-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">筛选类型</div>
                        <div className="space-y-1">
                          <div 
                            onClick={() => { setTypeFilter(null); setIsTypeFilterOpen(false); }}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${!typeFilter ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
                          >
                            全部类型
                          </div>
                          {MASKING_TYPES.map(t => (
                            <div 
                              key={t}
                              onClick={() => { setTypeFilter(t); setIsTypeFilterOpen(false); }}
                              className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${typeFilter === t ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}
                            >
                              {t}
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>
              </th>
              <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">创建时间</th>
              <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider text-right pr-4">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredRules.map((item) => (
              <tr key={item.id} className="group hover:bg-blue-50/30 transition-colors">
                <td className="py-4 pl-4">
                  <span className="text-sm font-bold text-slate-700">{item.name}</span>
                </td>
                <td className="py-4">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    item.type === '字符遮盖' ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' :
                    item.type === '全遮盖' ? 'bg-slate-100 text-slate-600 border border-slate-200' :
                    item.type === '关键字替换' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                    'bg-blue-50 text-blue-600 border border-blue-100'
                  }`}>
                    {item.type}
                  </span>
                </td>
                <td className="py-4 text-xs text-slate-400 font-medium">
                  {item.createTime}
                </td>
                <td className="py-4 text-right pr-4">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleEdit(item)}
                      className="p-2 text-slate-400 hover:text-blue-600 transition-all border border-transparent hover:border-blue-100 hover:bg-blue-50 rounded-lg"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-slate-400 hover:text-red-500 transition-all border border-transparent hover:border-red-100 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Creation Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)} className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-white sticky top-0 z-10">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${editingId ? 'bg-amber-500' : 'bg-blue-600'}`}>
                    {editingId ? <Edit2 size={22} /> : <Plus size={22} />}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">{editingId ? '编辑脱敏算法' : '新建脱敏算法'}</h3>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                <div className="grid grid-cols-5 gap-8">
                  {/* Form Side */}
                  <div className="col-span-3 space-y-6">
                    <div className="space-y-4">
                      <div className="space-y-2">
                         <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">算法名称 <span className="text-red-500">*</span></label>
                         <input 
                           type="text" 
                           placeholder="请输入脱敏算法名称"
                           value={formData.name}
                           onChange={(e) => setFormData({...formData, name: e.target.value})}
                           className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500/20"
                         />
                      </div>
                      <div className="space-y-2">
                         <label className="text-sm font-bold text-slate-700">脱敏类型</label>
                         <div className="grid grid-cols-3 gap-2">
                           {MASKING_TYPES.map(t => (
                             <button 
                               key={t}
                               onClick={() => setFormData({...formData, type: t})}
                               className={`px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${formData.type === t ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-slate-100 text-slate-500 hover:border-slate-200'}`}
                             >
                               {t}
                             </button>
                           ))}
                         </div>
                      </div>

                      {/* Config Area - Changes based on type */}
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Activity size={16} className="text-blue-600" />
                          <h4 className="text-sm font-bold text-slate-800">脱敏详细配置</h4>
                        </div>

                        {formData.type === '字符遮盖' ? (
                          <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">屏蔽字符</label>
                                <select 
                                  value={formData.config?.maskChar}
                                  onChange={(e) => setFormData({...formData, config: {...formData.config, maskChar: e.target.value}})}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                                >
                                  <option value="*">指定字符 (*)</option>
                                  <option value="random_digit">随机数字</option>
                                  <option value="random_letter">随机字母</option>
                                  <option value="random_alnum">随机数字字母</option>
                                </select>
                              </div>
                              <div className="space-y-2">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest">脱敏方式</label>
                                <select 
                                  value={formData.config?.strategy}
                                  onChange={(e) => setFormData({...formData, config: {...formData.config, strategy: e.target.value}})}
                                  className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold"
                                >
                                  <option value="keep_n_m">保留前n后m</option>
                                  <option value="keep_x_y">保留自x至y</option>
                                  <option value="mask_n_m">掩盖前n后m</option>
                                  <option value="mask_x_y">掩盖自x至y</option>
                                  <option value="mask_before_char">特殊字符前掩盖</option>
                                  <option value="mask_after_char">特殊字符后掩盖</option>
                                </select>
                              </div>
                            </div>
                            
                            {/* Dynamic inputs based on strategy */}
                            <div className="grid grid-cols-2 gap-4">
                              {(formData.config?.strategy === 'keep_n_m' || formData.config?.strategy === 'mask_n_m') && (
                                <>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500">参数 n</label>
                                    <input 
                                      type="number" 
                                      value={formData.config?.n}
                                      onChange={(e) => setFormData({...formData, config: {...formData.config, n: parseInt(e.target.value)}})}
                                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs" 
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500">参数 m</label>
                                    <input 
                                      type="number" 
                                      value={formData.config?.m}
                                      onChange={(e) => setFormData({...formData, config: {...formData.config, m: parseInt(e.target.value)}})}
                                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs" 
                                    />
                                  </div>
                                </>
                              )}
                              {(formData.config?.strategy === 'keep_x_y' || formData.config?.strategy === 'mask_x_y') && (
                                <>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500">参数 x</label>
                                    <input 
                                      type="number" 
                                      value={formData.config?.x}
                                      onChange={(e) => setFormData({...formData, config: {...formData.config, x: parseInt(e.target.value)}})}
                                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs" 
                                    />
                                  </div>
                                  <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-500">参数 y</label>
                                    <input 
                                      type="number" 
                                      value={formData.config?.y}
                                      onChange={(e) => setFormData({...formData, config: {...formData.config, y: parseInt(e.target.value)}})}
                                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs" 
                                    />
                                  </div>
                                </>
                              )}
                              {(formData.config?.strategy === 'mask_before_char' || formData.config?.strategy === 'mask_after_char') && (
                                <div className="col-span-2 space-y-1">
                                  <label className="text-[10px] font-bold text-slate-500">特殊字符</label>
                                  <input 
                                    type="text" 
                                    placeholder="如：@"
                                    value={formData.config?.specialChar}
                                    onChange={(e) => setFormData({...formData, config: {...formData.config, specialChar: e.target.value}})}
                                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs" 
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        ) : formData.type === '全遮盖' ? (
                          <div className="py-4 flex flex-col items-center justify-center text-slate-400 gap-2">
                             <CheckCircle2 className="text-blue-500 opacity-50" />
                             <span className="text-xs font-medium">全遮盖无需额外配置，将对目标字段进行完全掩盖</span>
                          </div>
                        ) : formData.type === '关键字替换' ? (
                          <div className="space-y-4">
                             <p className="text-[10px] text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-100 flex items-start gap-2">
                               <Info size={12} className="mt-0.5 shrink-0" />
                               <span>注：替换后长度若超过数据库长度限制，将自动截断。</span>
                             </p>
                             <div className="space-y-2">
                               {formData.config?.pairs?.map((p: any, idx: number) => (
                                 <div key={idx} className="flex items-center gap-2">
                                    <input 
                                      placeholder="查找关键词" 
                                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                                      value={p.from}
                                      onChange={(e) => {
                                        const newPairs = [...formData.config.pairs];
                                        newPairs[idx].from = e.target.value;
                                        setFormData({...formData, config: {...formData.config, pairs: newPairs}});
                                      }}
                                    />
                                    <ChevronRight size={14} className="text-slate-300" />
                                    <input 
                                      placeholder="替换为" 
                                      className="flex-1 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                                      value={p.to}
                                      onChange={(e) => {
                                        const newPairs = [...formData.config.pairs];
                                        newPairs[idx].to = e.target.value;
                                        setFormData({...formData, config: {...formData.config, pairs: newPairs}});
                                      }}
                                    />
                                    {idx === formData.config.pairs.length - 1 ? (
                                      <button onClick={() => setFormData({...formData, config: {...formData.config, pairs: [...formData.config.pairs, {from: '', to: ''}]}})} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Plus size={14} /></button>
                                    ) : (
                                      <button onClick={() => setFormData({...formData, config: {...formData.config, pairs: formData.config.pairs.filter((_:any, i:number) => i !== idx)}})} className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"><X size={14} /></button>
                                    )}
                                 </div>
                               ))}
                             </div>
                          </div>
                        ) : (
                          <div className="py-4 text-center text-xs text-slate-400 font-medium italic">
                            该类型暂无自定义配置项
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Test Side */}
                  <div className="col-span-2 flex flex-col gap-6">
                    <div className="flex-1 p-8 bg-slate-900 rounded-3xl text-white flex flex-col gap-6">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 border border-blue-500/30">
                           <Play size={20} className="fill-current" />
                         </div>
                         <h4 className="text-lg font-bold">脱敏规则预测试</h4>
                      </div>
                      
                      <div className="space-y-4 flex-1">
                        <div className="space-y-2">
                           <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">输入原始数据</label>
                           <textarea 
                             placeholder="输入测试文本..."
                             value={testInput}
                             onChange={(e) => setTestInput(e.target.value)}
                             rows={4}
                             className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-2xl text-sm focus:ring-2 focus:ring-blue-500/40 outline-none resize-none"
                           />
                        </div>

                        <button 
                          onClick={handleTest}
                          disabled={!testInput}
                          className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-2xl font-bold transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2"
                        >
                          <Activity size={18} />
                          点击执行测试
                        </button>

                        <div className="space-y-2 flex-1">
                           <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">脱敏输出结果</label>
                           <div className="w-full p-4 bg-black/40 border border-white/5 rounded-2xl h-[120px] overflow-auto custom-scrollbar font-mono text-blue-400 text-sm break-all">
                             {testResult || '等待执行...'}
                           </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="px-8 py-6 bg-slate-50 flex items-center justify-end gap-3 border-t border-slate-100 sticky bottom-0 z-10">
                <button 
                  onClick={() => { setIsModalOpen(false); setEditingId(null); }}
                  className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-all"
                >
                  取消
                </button>
                <button 
                  onClick={handleSave}
                  disabled={!formData.name}
                  className={`px-8 py-2.5 rounded-xl font-bold transition-all shadow-lg ${
                    editingId 
                    ? 'bg-amber-500 hover:bg-amber-600 text-white shadow-amber-100' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-100'
                  } disabled:bg-slate-300 disabled:shadow-none`}
                >
                  {editingId ? '保存修改' : '完成创建算法'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
