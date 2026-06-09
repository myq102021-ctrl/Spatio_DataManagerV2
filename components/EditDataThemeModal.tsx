
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { X, ChevronDown, Search } from 'lucide-react';
import type { DataThemeBindOption } from '../types';

interface EditDataThemeModalProps {
  open: boolean;
  /** 数据名称（可用于无障碍描述，当前弹窗不展示） */
  dataName?: string;
  options: DataThemeBindOption[];
  currentThemeId: string;
  onClose: () => void;
  onConfirm: (themeId: string) => void;
}

export const EditDataThemeModal: React.FC<EditDataThemeModalProps> = ({
  open,
  dataName,
  options,
  currentThemeId,
  onClose,
  onConfirm,
}) => {
  const [selectedId, setSelectedId] = useState(currentThemeId);
  const [panelOpen, setPanelOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const comboboxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open) {
      setSelectedId(currentThemeId);
      setPanelOpen(false);
      setSearchQuery('');
    }
  }, [open, currentThemeId]);

  useEffect(() => {
    if (!panelOpen) return;
    const onDocMouseDown = (e: MouseEvent) => {
      if (comboboxRef.current && !comboboxRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocMouseDown);
    return () => document.removeEventListener('mousedown', onDocMouseDown);
  }, [panelOpen]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.path.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q),
    );
  }, [options, searchQuery]);

  const selectedLabel = useMemo(() => {
    return options.find((o) => o.id === selectedId)?.path ?? '';
  }, [options, selectedId]);

  if (!open) return null;

  const describedBy = dataName ? 'edit-data-theme-desc' : undefined;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        onClick={onClose}
        aria-label="关闭"
      />
      <div
        className="relative w-full max-w-md overflow-visible rounded-xl border border-slate-200/80 bg-white shadow-2xl shadow-slate-900/20"
        role="dialog"
        aria-modal="true"
        aria-labelledby="edit-data-theme-title"
        aria-describedby={describedBy}
      >
        {dataName ? (
          <p id="edit-data-theme-desc" className="sr-only">
            编辑数据：{dataName}
          </p>
        ) : null}

        <div className="flex items-center justify-between gap-3 rounded-t-xl border-b border-slate-200/60 bg-slate-100/90 px-5 py-4">
          <h3 id="edit-data-theme-title" className="text-[15px] font-bold text-slate-800">
            数据编辑
          </h3>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-white/80 hover:text-slate-600 transition-colors"
            title="关闭"
          >
            <X size={18} />
          </button>
        </div>

        <div className="relative z-20 px-5 py-6">
          <label className="block text-[14px] font-medium text-slate-700 mb-2">
            <span className="text-red-500 mr-0.5">*</span>
            数据主题
          </label>

          <div ref={comboboxRef} className="relative">
            <button
              type="button"
              onClick={() => {
                setPanelOpen((v) => !v);
                if (!panelOpen) setSearchQuery('');
              }}
              className={`
                flex w-full items-center justify-between gap-2 rounded-lg border bg-white py-2.5 pl-3 pr-3 text-left text-[14px] outline-none transition-all
                ${panelOpen ? 'border-blue-300 ring-2 ring-blue-100' : 'border-slate-200 hover:border-slate-300'}
              `}
              aria-expanded={panelOpen}
              aria-haspopup="listbox"
            >
              <span className={`truncate min-w-0 ${selectedLabel ? 'text-slate-800' : 'text-slate-400'}`}>
                {selectedLabel || '请选择数据主题'}
              </span>
              <ChevronDown
                size={18}
                className={`shrink-0 text-slate-400 transition-transform ${panelOpen ? 'rotate-180' : ''}`}
              />
            </button>

            {panelOpen ? (
              <div
                className="absolute left-0 right-0 top-full z-50 mt-1.5 rounded-lg border border-slate-200 bg-white shadow-lg shadow-slate-900/10 overflow-hidden"
                role="listbox"
              >
                <div className="relative border-b border-slate-100 p-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="检索主题名称或编码"
                    className="w-full rounded-md border border-slate-200 bg-slate-50 py-2 pl-3 pr-9 text-[13px] outline-none focus:border-blue-300 focus:bg-white focus:ring-2 focus:ring-blue-100"
                    autoFocus
                  />
                  <Search className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                </div>
                <ul className="max-h-52 overflow-auto py-1">
                  {filtered.length === 0 ? (
                    <li className="px-3 py-6 text-center text-[13px] text-slate-400">无匹配主题</li>
                  ) : (
                    filtered.map((opt) => (
                      <li key={opt.id} role="presentation">
                        <button
                          type="button"
                          role="option"
                          aria-selected={selectedId === opt.id}
                          onClick={() => {
                            setSelectedId(opt.id);
                            setPanelOpen(false);
                            setSearchQuery('');
                          }}
                          className={`
                            flex w-full items-center px-3 py-2.5 text-left text-[13px] transition-colors
                            ${selectedId === opt.id ? 'bg-blue-50 text-blue-800 font-medium' : 'text-slate-700 hover:bg-slate-50'}
                          `}
                        >
                          <span className="truncate">{opt.path}</span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
              </div>
            ) : null}
          </div>
        </div>

        <div className="relative z-10 flex justify-center gap-3 rounded-b-xl border-t border-slate-100 bg-white px-5 py-4">
          <button
            type="button"
            onClick={onClose}
            className="min-w-[88px] rounded-lg border border-slate-200 bg-white px-5 py-2 text-[14px] font-medium text-slate-600 hover:bg-slate-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={() => onConfirm(selectedId)}
            className="min-w-[88px] rounded-lg bg-blue-600 px-5 py-2 text-[14px] font-medium text-white hover:bg-blue-700 shadow-sm shadow-blue-100"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};
