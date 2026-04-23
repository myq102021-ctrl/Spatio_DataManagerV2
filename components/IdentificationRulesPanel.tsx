import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  SearchCode, 
  X, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  ToggleLeft,
  ToggleRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { IdentificationRule } from '../types';

// Mock Data for Algorithms
const MOCK_ALGORITHMS = [
  '全脱敏（*）',
  '部分遮盖（保留前三后四）',
  '哈希脱敏',
  '假名化',
  '自定义正则',
  'MD5',
  '高斯扰动'
];

const INITIAL_RULES: IdentificationRule[] = [
  { 
    id: '1', 
    name: '身份证号识别规则', 
    method: '正则表达式', 
    matchPattern: '^[1-9]\\d{5}(18|19|20)\\d{2}((0[1-9])|(1[0-2]))(([0-2][1-9])|10|20|30|31)\\d{3}[0-9Xx]$', 
    maskingAlgorithm: '部分遮盖（保留前三后四）', 
    status: 'enabled',
    description: '识别中国大陆18位身份证号码'
  },
  { 
    id: '2', 
    name: '手机号识别规则', 
    method: '正则表达式', 
    matchPattern: '^1[3-9]\\d{9}$', 
    maskingAlgorithm: '部分遮盖（保留前三后四）', 
    status: 'enabled',
    description: '识别中国大陆手机号码'
  },
  { 
    id: '3', 
    name: '电子邮箱识别', 
    method: '正则表达式', 
    matchPattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$', 
    maskingAlgorithm: '部分遮盖（保留前三后四）', 
    status: 'disabled'
  },
];

interface Props {
  onNavigate?: (id: string) => void;
}

export const IdentificationRulesPanel: React.FC<Props> = ({ onNavigate }) => {
  const [rules, setRules] = useState<IdentificationRule[]>(INITIAL_RULES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<IdentificationRule | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState<Omit<IdentificationRule, 'id'>>({
    name: '',
    method: '正则表达式',
    matchPattern: '',
    excludePattern: '',
    maskingAlgorithm: MOCK_ALGORITHMS[0],
    status: 'enabled',
    description: ''
  });

  const handleOpenModal = (rule?: IdentificationRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        name: rule.name,
        method: rule.method,
        matchPattern: rule.matchPattern,
        excludePattern: rule.excludePattern || '',
        maskingAlgorithm: rule.maskingAlgorithm,
        status: rule.status,
        description: rule.description || ''
      });
    } else {
      setEditingRule(null);
      setFormData({
        name: '',
        method: '正则表达式',
        matchPattern: '',
        excludePattern: '',
        maskingAlgorithm: MOCK_ALGORITHMS[0],
        status: 'enabled',
        description: ''
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (editingRule) {
      setRules(prev => prev.map(r => r.id === editingRule.id ? { ...formData, id: r.id } : r));
    } else {
      const newRule: IdentificationRule = {
        id: Math.random().toString(36).substr(2, 9),
        ...formData
      };
      setRules([newRule, ...rules]);
    }
    setIsModalOpen(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('确定要删除该识别规则吗？')) {
      setRules(prev => prev.filter(r => r.id !== id));
    }
  };

  const toggleStatus = (id: string) => {
    setRules(prev => prev.map(r => r.id === id ? { ...r, status: r.status === 'enabled' ? 'disabled' : 'enabled' } : r));
  };

  const filteredRules = rules.filter(r => 
    r.name.includes(searchTerm) || (r.description && r.description.includes(searchTerm))
  );

  return (
    <div className="flex flex-col h-full bg-white animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
            <SearchCode size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">识别规则管理</h2>
            <p className="text-xs text-slate-400 font-medium">定义匹配条件以便于在多维度数据扫描中自动识别敏感信息</p>
          </div>
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-100"
        >
          <Plus size={18} />
          新建识别规则
        </button>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-4 flex items-center gap-4 bg-slate-50/50">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="搜索规则名称描述..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all">
          <Filter size={16} />
          筛选识别方式
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left border-b border-slate-100">
              <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider pl-4">规则名称</th>
              <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">识别方式</th>
              <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">脱敏算法</th>
              <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">启用状态</th>
              <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider text-right pr-4">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredRules.map((item) => (
              <tr key={item.id} className="group hover:bg-blue-50/30 transition-colors">
                <td className="py-4 pl-4">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-slate-700">{item.name}</span>
                    {item.description && <span className="text-[11px] text-slate-400 font-medium mt-0.5">{item.description}</span>}
                  </div>
                </td>
                <td className="py-4">
                  <span className="px-2 py-1 bg-blue-50 text-blue-600 rounded text-xs font-bold border border-blue-100">{item.method}</span>
                </td>
                <td className="py-4 text-sm text-slate-600 font-medium">
                  {item.maskingAlgorithm}
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => toggleStatus(item.id)}
                      className={`flex items-center gap-1.5 transition-all outline-none ${item.status === 'enabled' ? 'text-green-600' : 'text-slate-300'}`}
                    >
                      {item.status === 'enabled' ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      <span className="text-xs font-bold">{item.status === 'enabled' ? '已启用' : '已停用'}</span>
                    </button>
                  </div>
                </td>
                <td className="py-4 text-right pr-4">
                  <div className="flex items-center justify-end gap-2">
                    <button 
                      onClick={() => handleOpenModal(item)}
                      className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all" 
                      title="编辑"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDelete(item.id)}
                      className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all" 
                      title="删除"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredRules.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 text-slate-300">
             <SearchCode size={48} className="opacity-20 mb-4" />
             <span className="text-sm font-bold">暂无匹配的识别规则</span>
          </div>
        )}
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                    <SearchCode size={22} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">{editingRule ? '编辑识别规则' : '新建识别规则'}</h3>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 max-h-[70vh] overflow-y-auto custom-scrollbar">
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">规则名称 <span className="text-red-500">*</span></label>
                       <input 
                         type="text" 
                         placeholder="请输入规则名称"
                         value={formData.name}
                         onChange={(e) => setFormData({...formData, name: e.target.value})}
                         className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                       />
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700">识别方式</label>
                       <select 
                         disabled
                         className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 appearance-none pointer-events-none"
                         value={formData.method}
                       >
                         <option value="正则表达式">正则表达式</option>
                       </select>
                    </div>
                  </div>

                  {/* Patterns */}
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700 flex items-center gap-1.5">匹配规则 (RegEx) <span className="text-red-500">*</span></label>
                    <textarea 
                      placeholder="请输入正则表达式，如：^1[3-9]\d{9}$"
                      rows={3}
                      value={formData.matchPattern}
                      onChange={(e) => setFormData({...formData, matchPattern: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">排除规则 (RegEx)</label>
                    <textarea 
                      placeholder="请输入需要排出的匹配模式..."
                      rows={2}
                      value={formData.excludePattern}
                      onChange={(e) => setFormData({...formData, excludePattern: e.target.value})}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all resize-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-6">
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700">脱敏算法</label>
                       <select 
                         value={formData.maskingAlgorithm}
                         onChange={(e) => setFormData({...formData, maskingAlgorithm: e.target.value})}
                         className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                       >
                         {MOCK_ALGORITHMS.map(algo => (
                           <option key={algo} value={algo}>{algo}</option>
                         ))}
                       </select>
                    </div>
                    <div className="space-y-2">
                       <label className="text-sm font-bold text-slate-700">启用状态</label>
                       <div className="flex items-center gap-4 py-2">
                          <label className="flex items-center gap-2 cursor-pointer group">
                             <div 
                                onClick={() => setFormData({...formData, status: 'enabled'})}
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${formData.status === 'enabled' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}
                             >
                                {formData.status === 'enabled' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                             </div>
                             <span className={`text-xs font-bold ${formData.status === 'enabled' ? 'text-blue-600' : 'text-slate-500'}`}>启用</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer group">
                             <div 
                                onClick={() => setFormData({...formData, status: 'disabled'})}
                                className={`w-4 h-4 rounded-full border-2 flex items-center justify-center transition-all ${formData.status === 'disabled' ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}
                             >
                                {formData.status === 'disabled' && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                             </div>
                             <span className={`text-xs font-bold ${formData.status === 'disabled' ? 'text-blue-600' : 'text-slate-500'}`}>停用</span>
                          </label>
                       </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">描述</label>
                    <input 
                      type="text" 
                      placeholder="请输入识别规则描述信息..."
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="px-8 py-6 bg-slate-50 flex items-center justify-end gap-3 border-t border-slate-100">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-all"
                >
                  取消
                </button>
                <button 
                  onClick={handleSave}
                  disabled={!formData.name || !formData.matchPattern}
                  className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-100"
                >
                  {editingRule ? '保存更改' : '确认新建'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
