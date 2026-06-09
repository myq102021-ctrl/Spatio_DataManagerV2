import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, Send, MapPin, ChevronDown, Trash2, BookOpen, Pencil, RotateCw } from 'lucide-react';

export interface SpecNote {
  id: string;
  pageKey: string;
  featureKey: string;
  featureLabel: string;
  text: string;
  createdAt: string;
}

export interface FeaturePoint {
  key: string;
  label: string;
  description?: string;
}

interface RequirementsSpecDrawerProps {
  open: boolean;
  onClose: () => void;
  pageTitle?: string;
  /** 唯一标识当前页面，用于隔离不同页面的笔记 */
  pageKey: string;
  featurePoints: FeaturePoint[];
}

const API_URL = '/__api/requirements-spec-notes';
const STATIC_URL = '/requirements-spec-notes.json';
const LS_KEY = 'req_spec_notes_v2';

// ---------- persistence helpers ----------

async function fetchAllNotes(): Promise<SpecNote[]> {
  try {
    const res = await fetch(`${STATIC_URL}?t=${Date.now()}`);
    if (!res.ok) throw new Error('fetch failed');
    return (await res.json()) as SpecNote[];
  } catch {
    // fallback: localStorage
    try {
      const raw = localStorage.getItem(LS_KEY);
      return raw ? (JSON.parse(raw) as SpecNote[]) : [];
    } catch {
      return [];
    }
  }
}

async function persistAllNotes(notes: SpecNote[]): Promise<void> {
  // Always mirror to localStorage as instant fallback
  try { localStorage.setItem(LS_KEY, JSON.stringify(notes)); } catch { /* noop */ }

  try {
    const res = await fetch(API_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(notes, null, 2),
    });
    if (!res.ok) throw new Error(`PUT ${res.status}`);
  } catch {
    // Dev API not available (production build): localStorage already saved above
  }
}

// ---------- component ----------

export const RequirementsSpecDrawer: React.FC<RequirementsSpecDrawerProps> = ({
  open,
  onClose,
  pageTitle = '',
  pageKey,
  featurePoints,
}) => {
  const [allNotes, setAllNotes] = useState<SpecNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState('');
  const [inputText, setInputText] = useState('');
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // notes for THIS page only
  const notes = allNotes.filter((n) => n.pageKey === pageKey);

  const reload = useCallback(async () => {
    setLoading(true);
    const data = await fetchAllNotes();
    setAllNotes(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    if (open) reload();
  }, [open, reload]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const applyAndPersist = async (next: SpecNote[]) => {
    setAllNotes(next);
    await persistAllNotes(next);
  };

  const handleAdd = async () => {
    const text = inputText.trim();
    if (!text || !selectedFeature) return;
    const fp = featurePoints.find((f) => f.key === selectedFeature);
    if (!fp) return;
    const newNote: SpecNote = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      pageKey,
      featureKey: fp.key,
      featureLabel: fp.label,
      text,
      createdAt: new Date().toLocaleString('zh-CN'),
    };
    await applyAndPersist([...allNotes, newNote]);
    setInputText('');
    inputRef.current?.focus();
  };

  const handleDelete = async (id: string) => {
    await applyAndPersist(allNotes.filter((n) => n.id !== id));
  };

  const handleEditSave = async (id: string) => {
    const text = editText.trim();
    if (!text) return;
    await applyAndPersist(allNotes.map((n) => (n.id === id ? { ...n, text } : n)));
    setEditingId(null);
    setEditText('');
  };

  const selectedFeatureObj = featurePoints.find((f) => f.key === selectedFeature);

  // Group current-page notes by feature
  const grouped = featurePoints
    .map((fp) => ({ fp, items: notes.filter((n) => n.featureKey === fp.key) }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-[200] bg-black/20 backdrop-blur-[2px] transition-opacity duration-300 ${
          open ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className={`fixed top-0 right-0 z-[201] h-full w-[520px] max-w-full flex flex-col bg-white shadow-2xl transition-transform duration-300 ease-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-amber-100 bg-amber-50/60 flex-shrink-0">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <BookOpen size={17} className="text-amber-600 shrink-0" />
            <span className="text-[15px] font-bold text-amber-800 truncate">需求规格说明</span>
            {pageTitle && (
              <span className="text-[12px] text-amber-600/70 bg-amber-100 px-2 py-0.5 rounded-full shrink-0">
                {pageTitle}
              </span>
            )}
          </div>
          <span className="text-[11px] text-amber-500/80 bg-amber-100/80 px-2 py-0.5 rounded-full shrink-0">
            仅研发可见
          </span>
          <button
            onClick={reload}
            className="p-1.5 rounded-lg hover:bg-amber-100 transition-colors text-amber-500"
            title="刷新"
          >
            <RotateCw size={14} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-amber-100 transition-colors text-amber-600"
          >
            <X size={16} />
          </button>
        </div>

        {/* Notes area */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <RotateCw size={20} className="animate-spin text-amber-400" />
            </div>
          ) : grouped.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-16">
              <BookOpen size={36} className="text-slate-200 mb-3" />
              <p className="text-[14px] text-slate-400 font-medium">暂无需求说明</p>
              <p className="text-[12px] text-slate-300 mt-1">在下方选择功能点并输入说明内容</p>
            </div>
          ) : (
            grouped.map(({ fp, items }) => (
              <div key={fp.key} className="rounded-xl border border-slate-100 overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-50 border-b border-slate-100">
                  <MapPin size={13} className="text-blue-500 shrink-0" />
                  <span className="text-[13px] font-bold text-slate-700">{fp.label}</span>
                  {fp.description && (
                    <span className="text-[11px] text-slate-400 truncate">{fp.description}</span>
                  )}
                </div>
                <div className="divide-y divide-slate-50">
                  {items.map((note) => (
                    <div key={note.id} className="px-4 py-3 group">
                      {editingId === note.id ? (
                        <div className="flex flex-col gap-2">
                          <textarea
                            className="w-full text-[13px] text-slate-700 leading-relaxed border border-blue-200 rounded-lg px-3 py-2 resize-none outline-none focus:ring-2 focus:ring-blue-100"
                            rows={3}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => { setEditingId(null); setEditText(''); }}
                              className="text-[12px] text-slate-400 px-3 py-1 rounded-md hover:bg-slate-100"
                            >
                              取消
                            </button>
                            <button
                              onClick={() => handleEditSave(note.id)}
                              className="text-[12px] text-white bg-blue-500 px-3 py-1 rounded-md hover:bg-blue-600"
                            >
                              保存
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <p className="flex-1 text-[13px] text-slate-700 leading-relaxed whitespace-pre-wrap">
                            {note.text}
                          </p>
                          <div className="flex flex-col items-end gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex gap-1">
                              <button
                                onClick={() => { setEditingId(note.id); setEditText(note.text); }}
                                className="p-1 rounded hover:bg-slate-100 text-slate-400 hover:text-blue-500"
                                title="编辑"
                              >
                                <Pencil size={12} />
                              </button>
                              <button
                                onClick={() => handleDelete(note.id)}
                                className="p-1 rounded hover:bg-red-50 text-slate-400 hover:text-red-500"
                                title="删除"
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                            <span className="text-[10px] text-slate-300">{note.createdAt}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Comment input bar */}
        <div className="flex-shrink-0 border-t border-slate-100 bg-slate-50/50 px-4 py-4">
          {/* Feature selector */}
          <div className="mb-3 relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen((v) => !v)}
              className={`flex items-center gap-2 w-full px-3 py-2 rounded-lg border text-[13px] transition-colors ${
                selectedFeature
                  ? 'border-blue-200 bg-blue-50 text-blue-700'
                  : 'border-slate-200 bg-white text-slate-400 hover:border-slate-300'
              }`}
            >
              <MapPin size={13} className={selectedFeature ? 'text-blue-500' : 'text-slate-300'} />
              <span className="flex-1 text-left truncate">
                {selectedFeatureObj ? selectedFeatureObj.label : '选择要说明的功能点…'}
              </span>
              <ChevronDown
                size={14}
                className={`transition-transform ${dropdownOpen ? 'rotate-180' : ''} ${
                  selectedFeature ? 'text-blue-400' : 'text-slate-300'
                }`}
              />
            </button>
            {dropdownOpen && (
              <div className="absolute bottom-full left-0 right-0 z-10 mb-1 rounded-xl border border-slate-200 bg-white shadow-xl overflow-hidden">
                <div className="px-3 py-2 text-[11px] text-slate-400 bg-slate-50 border-b border-slate-100">
                  定位功能点
                </div>
                <div className="max-h-[220px] overflow-y-auto">
                  {featurePoints.map((fp) => (
                    <button
                      key={fp.key}
                      type="button"
                      onClick={() => { setSelectedFeature(fp.key); setDropdownOpen(false); inputRef.current?.focus(); }}
                      className={`flex flex-col w-full text-left px-4 py-2.5 hover:bg-blue-50 transition-colors border-b border-slate-50 last:border-0 ${
                        selectedFeature === fp.key ? 'bg-blue-50' : ''
                      }`}
                    >
                      <span className={`text-[13px] font-medium ${selectedFeature === fp.key ? 'text-blue-700' : 'text-slate-700'}`}>
                        {fp.label}
                      </span>
                      {fp.description && (
                        <span className="text-[11px] text-slate-400 mt-0.5">{fp.description}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Text input + send */}
          <div className="flex gap-2 items-end">
            <textarea
              ref={inputRef}
              rows={2}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleAdd();
              }}
              placeholder="输入需求说明内容…（Ctrl+Enter 发送）"
              disabled={!selectedFeature}
              className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-[13px] text-slate-700 placeholder-slate-300 resize-none outline-none focus:border-blue-300 focus:ring-2 focus:ring-blue-50 transition-all disabled:bg-slate-50 disabled:text-slate-300"
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={!selectedFeature || !inputText.trim()}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500 text-white text-[13px] font-medium hover:bg-amber-600 disabled:opacity-40 disabled:cursor-not-allowed transition-all h-[58px] shrink-0"
            >
              <Send size={14} />
              添加
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
