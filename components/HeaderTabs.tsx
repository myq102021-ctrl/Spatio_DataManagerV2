import React from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { HEADER_TABS } from '../constants';

export const HeaderTabs: React.FC = () => {
  return (
    <div className="flex items-center w-full h-[36px] border-b border-slate-100 bg-slate-50/30 rounded-t-xl px-2 backdrop-blur-[2px]">
      <div className="flex-1 flex items-center overflow-x-auto gap-1 px-2 no-scrollbar py-1">
        {HEADER_TABS.map((tab) => (
          <div
            key={tab.id}
            className={`
              group flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-medium cursor-pointer transition-all duration-200 select-none border border-transparent
              ${tab.active 
                ? 'bg-white text-blue-700 shadow-[0_1px_2px_rgba(0,0,0,0.05)] border-slate-100' 
                : 'bg-transparent text-slate-500 hover:bg-white/60 hover:text-slate-700'}
            `}
          >
            {tab.label}
            {tab.closable && (
              <div className={`p-0.5 rounded-full ${tab.active ? 'hover:bg-slate-100 text-slate-400 hover:text-red-500' : 'opacity-0 group-hover:opacity-100 hover:bg-slate-200/50 text-slate-400'}`}>
                 <X size={10} />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center gap-0.5 pr-1 border-l border-slate-100 pl-1">
        <button className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
            <ChevronLeft size={13} />
        </button>
        <button className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors">
            <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
};