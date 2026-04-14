import React from 'react';
import { X, Globe, PencilRuler } from 'lucide-react';

interface APISelectModeModalProps {
  onClose: () => void;
  onSelect: (mode: 'spatial' | 'single_table' | 'sql') => void;
}

export const APISelectModeModal: React.FC<APISelectModeModalProps> = ({ onClose, onSelect }) => {
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl w-[1000px] border border-slate-200 overflow-hidden animate-zoomIn">
        {/* Header - 修改标题 */}
        <div className="flex justify-between items-center px-8 py-6 border-b border-slate-50">
          <h3 className="text-[18px] font-bold text-slate-800 tracking-tight">选择服务创建类型</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Mode Cards Container - 更新名称和新增标签 */}
        <div className="px-10 pb-16 pt-10 grid grid-cols-3 gap-8">
          <ModeCard 
            tag="时空数据服务"
            tagVariant="blue"
            title="时空数据模式"
            desc="快捷创建服务，适合创建时空数据服务，支持矢量、栅格、时序数据的地图发布与预览。"
            icon={<div className="w-24 h-24 bg-blue-500 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white/20"><Globe size={56} className="text-green-300" /></div>}
            onClick={() => onSelect('spatial')}
          />
          <ModeCard 
            tag="业务数据服务"
            tagVariant="indigo"
            title="向导模式"
            desc="快捷创建服务，适合单表业务数据共享，支持向导式发布查询、下载、分析服务。"
            icon={<GuidepostIcon />}
            onClick={() => onSelect('single_table')}
          />
          <ModeCard 
            tag="业务数据服务"
            tagVariant="indigo"
            title="脚本模式"
            desc="自定义SQL生成服务，灵活配置服务共享数据脱敏、简单函数计算，支持多表联合。"
            icon={<PencilRuler size={64} className="text-white opacity-90" />}
            onClick={() => onSelect('sql')}
          />
        </div>
      </div>
    </div>
  );
};

interface ModeCardProps {
  tag: string;
  tagVariant: 'blue' | 'indigo';
  title: string;
  desc: string;
  icon: React.ReactNode;
  onClick: () => void;
}

const ModeCard: React.FC<ModeCardProps> = ({ tag, tagVariant, title, desc, icon, onClick }) => (
  <div 
    onClick={onClick}
    className="group flex flex-col h-[360px] border border-slate-200 rounded-xl overflow-hidden cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 shadow-sm bg-white"
  >
    {/* Dark Header Area */}
    <div className="h-44 bg-gradient-to-br from-[#475569] to-[#1e293b] flex items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_white_1px,_transparent_1px)] bg-[size:16px_16px]"></div>
        <div className="z-10 transform group-hover:scale-110 transition-transform duration-500">
            {icon}
        </div>
    </div>
    
    {/* White Content Area */}
    <div className="flex-1 p-6 flex flex-col items-center gap-2 text-center relative">
        {/* 新增的分类标签 (Tag) */}
        <span className={`
            px-3 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase mb-1
            ${tagVariant === 'blue' ? 'bg-blue-50 text-blue-600 border border-blue-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}
        `}>
            {tag}
        </span>
        
        <h4 className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors tracking-tight">{title}</h4>
        <p className="text-[13px] leading-relaxed text-slate-500 font-medium px-2">
            {desc}
        </p>
    </div>
  </div>
);

const GuidepostIcon = () => (
    <div className="relative flex flex-col items-center">
        <div className="w-16 h-8 bg-white/90 rounded-sm relative shadow-sm flex items-center justify-center">
            <span className="text-[10px] font-black text-slate-800 tracking-tighter uppercase">Guide</span>
            <div className="absolute left-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[4px] border-t-transparent border-b-[4px] border-b-transparent border-l-[6px] border-l-white/90"></div>
        </div>
        <div className="w-1.5 h-16 bg-white/40 shadow-inner mt-px"></div>
    </div>
);
