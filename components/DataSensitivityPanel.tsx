import React, { useState } from 'react';
import { Plus, Search, Filter, MoreHorizontal, Shield, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { DataSensitivity } from '../types';
import { MOCK_DATA_SENSITIVITY } from '../constants';

export const DataSensitivityPanel: React.FC = () => {
  const [data, setData] = useState<DataSensitivity[]>(MOCK_DATA_SENSITIVITY);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    sensitivity: '不敏感数据',
    impact: '无危害',
    securityLevel: '无风险',
    processingMethod: ''
  });

  const handleCreate = () => {
    const newItem: DataSensitivity = {
      id: Math.random().toString(36).substr(2, 9),
      ...formData,
      createTime: new Date().toLocaleString()
    };
    setData([newItem, ...data]);
    setIsModalOpen(false);
    setFormData({
      code: '',
      name: '',
      sensitivity: '不敏感数据',
      impact: '无危害',
      securityLevel: '无风险',
      processingMethod: ''
    });
  };

  const filteredData = data.filter(item => 
    item.name.includes(searchTerm) || item.code.includes(searchTerm)
  );

  return (
    <div className="flex flex-col h-full bg-white animate-fadeIn">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
            <Shield size={22} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-800">数据密级管理</h2>
            <p className="text-xs text-slate-400 font-medium">定义和管理数据的敏感程度及处理要求</p>
          </div>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold transition-all shadow-lg shadow-blue-100"
        >
          <Plus size={18} />
          新建密级
        </button>
      </div>

      {/* Toolbar */}
      <div className="px-6 py-4 flex items-center gap-4 bg-slate-50/50">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="搜索密级名称或代码..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all">
          <Filter size={16} />
          筛选
        </button>
      </div>

      {/* Table */}
      <div className="flex-1 overflow-auto px-6 py-4">
        <table className="w-full border-collapse">
          <thead>
            <tr className="text-left border-b border-slate-100">
              <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider pl-4">数据等级代码</th>
              <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">数据等级名称</th>
              <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">敏感程度</th>
              <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">公开影响程度</th>
              <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">处理安全等级</th>
              <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">处理方式</th>
              <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider">创建时间</th>
              <th className="pb-4 font-bold text-slate-400 text-xs uppercase tracking-wider text-right pr-4">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-50">
            {filteredData.map((item) => (
              <tr key={item.id} className="group hover:bg-blue-50/30 transition-colors">
                <td className="py-4 pl-4">
                  <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold">{item.code}</span>
                </td>
                <td className="py-4">
                  <span className="text-sm font-bold text-slate-700">{item.name}</span>
                </td>
                <td className="py-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${
                      item.sensitivity === '涉密数据' ? 'bg-red-500' : 
                      item.sensitivity === '较敏感数据' ? 'bg-orange-500' : 
                      item.sensitivity === '低敏感数据' ? 'bg-blue-500' : 'bg-green-500'
                    }`} />
                    <span className="text-sm text-slate-600 font-medium">{item.sensitivity}</span>
                  </div>
                </td>
                <td className="py-4">
                  <span className="text-sm text-slate-600 font-medium">{item.impact}</span>
                </td>
                <td className="py-4">
                  <span className="text-sm text-slate-600 font-medium">{item.securityLevel}</span>
                </td>
                <td className="py-4">
                  <span className="text-sm text-slate-500 font-medium truncate max-w-[150px] block" title={item.processingMethod}>
                    {item.processingMethod}
                  </span>
                </td>
                <td className="py-4 text-sm text-slate-400 font-medium">
                  {item.createTime}
                </td>
                <td className="py-4 text-right pr-4">
                  <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all">
                    <MoreHorizontal size={18} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredData.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-4">
              <Search size={32} className="opacity-20" />
            </div>
            <p className="text-sm font-medium">未找到相关密级配置</p>
          </div>
        )}
      </div>

      {/* Create Modal */}
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
              className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white">
                    <Plus size={22} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">新建数据密级</h3>
                </div>
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-all"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">数据等级代码</label>
                    <input 
                      type="text" 
                      placeholder="如：L1, L2..."
                      value={formData.code}
                      onChange={(e) => setFormData({...formData, code: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">数据等级名称</label>
                    <input 
                      type="text" 
                      placeholder="请输入等级名称"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">敏感程度</label>
                    <select 
                      value={formData.sensitivity}
                      onChange={(e) => setFormData({...formData, sensitivity: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    >
                      <option value="不敏感数据">不敏感数据</option>
                      <option value="低敏感数据">低敏感数据</option>
                      <option value="较敏感数据">较敏感数据</option>
                      <option value="涉密数据">涉密数据</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">公开影响程度</label>
                    <select 
                      value={formData.impact}
                      onChange={(e) => setFormData({...formData, impact: e.target.value})}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                    >
                      <option value="无危害">无危害</option>
                      <option value="一般危害">一般危害</option>
                      <option value="严重危害">严重危害</option>
                      <option value="特别严重危害">特别严重危害</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">数据处理安全等级</label>
                  <select 
                    value={formData.securityLevel}
                    onChange={(e) => setFormData({...formData, securityLevel: e.target.value})}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  >
                    <option value="无风险">无风险</option>
                    <option value="一般风险">一般风险</option>
                    <option value="严重风险">严重风险</option>
                    <option value="特别严重风险">特别严重风险</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">处理方式</label>
                  <textarea 
                    placeholder="描述该等级数据的处理要求和方式..."
                    rows={3}
                    value={formData.processingMethod}
                    onChange={(e) => setFormData({...formData, processingMethod: e.target.value})}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium resize-none"
                  />
                </div>
              </div>

              <div className="px-8 py-6 bg-slate-50 flex items-center justify-end gap-3">
                <button 
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-2.5 text-slate-600 font-bold hover:bg-slate-200 rounded-xl transition-all"
                >
                  取消
                </button>
                <button 
                  onClick={handleCreate}
                  disabled={!formData.code || !formData.name}
                  className="px-8 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl font-bold transition-all shadow-lg shadow-blue-100"
                >
                  确认新建
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
