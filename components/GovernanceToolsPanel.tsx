import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Search,
  Plus,
  ExternalLink,
  Pencil,
  Trash2,
  Workflow,
  Link2,
  FileText,
  X,
  Loader2,
} from 'lucide-react';
import type { GovernanceTool, GovernanceToolMode } from '../types';
import { GovernanceToolIcon } from './GovernanceToolIcon';
import { normalizeExternalUrl } from '../lib/governanceToolIcon';
import { loadGovernanceTools, saveGovernanceTools } from '../lib/governanceToolsStore';

type EditorState =
  | { open: false }
  | { open: true; intent: 'create' }
  | { open: true; intent: 'edit'; toolId: string };

const emptyForm = () => ({
  mode: 'external' as GovernanceToolMode,
  name: '',
  description: '',
  link: '',
  iconUrl: '',
});

function nowStamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export const GovernanceToolsPanel: React.FC = () => {
  const [tools, setTools] = useState<GovernanceTool[]>([]);
  const [loadSource, setLoadSource] = useState<'network' | 'local_fallback' | 'empty' | null>(null);
  const [loading, setLoading] = useState(true);
  const [persistHint, setPersistHint] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [editor, setEditor] = useState<EditorState>({ open: false });
  const [form, setForm] = useState(emptyForm);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { tools: list, source } = await loadGovernanceTools();
      if (cancelled) return;
      setTools(list);
      setLoadSource(source);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const persistList = useCallback(async (next: GovernanceTool[]) => {
    setTools(next);
    const result = await saveGovernanceTools(next);
    if (!result.ok) {
      window.alert('保存失败：无法写入服务端文件，且本机浏览器存储不可用。');
      return;
    }
    if (result.persisted === 'repo_file') {
      setPersistHint(
        '已写入项目 public/governance-tools.json（开发环境）。提交到 Git 或部署该文件后，其他用户打开站点即可看到相同列表。',
      );
    } else {
      setPersistHint(
        '已保存到本机浏览器缓存。静态/生产环境无法直接改服务器文件；请将列表合并进 public/governance-tools.json 并重新部署，全员即可访问。',
      );
    }
  }, []);

  useEffect(() => {
    if (!editor.open) return;
    if (editor.intent === 'create') {
      setForm(emptyForm());
      return;
    }
    const t = tools.find((x) => x.id === editor.toolId);
    if (t) {
      setForm({
        mode: t.mode,
        name: t.name,
        description: t.description,
        link: t.link ?? '',
        iconUrl: t.iconUrl ?? '',
      });
    }
  }, [editor, tools]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tools;
    return tools.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        (t.link && t.link.toLowerCase().includes(q)),
    );
  }, [tools, query]);

  const openCreate = () => setEditor({ open: true, intent: 'create' });
  const openEdit = (id: string) => setEditor({ open: true, intent: 'edit', toolId: id });
  const closeEditor = () => setEditor({ open: false });

  const handleSave = async () => {
    const name = form.name.trim();
    const description = form.description.trim();
    const iconUrl = form.iconUrl.trim();
    if (!name || !description) {
      window.alert('请填写工具名称与简介。');
      return;
    }
    if (form.mode === 'external') {
      const linkRaw = form.link.trim();
      if (!linkRaw) {
        window.alert('外部工具需填写工具链接。');
        return;
      }
    }

    const ts = nowStamp();
    const iconField = iconUrl ? iconUrl : undefined;

    let next: GovernanceTool[];
    if (editor.open && editor.intent === 'edit') {
      next = tools.map((t) => {
        if (t.id !== editor.toolId) return t;
        return {
          ...t,
          mode: form.mode,
          name,
          description,
          link: form.mode === 'external' ? normalizeExternalUrl(form.link) : undefined,
          iconUrl: iconField,
          updatedAt: ts,
        };
      });
    } else {
      const id = `gt-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      next = [
        {
          id,
          mode: form.mode,
          name,
          description,
          link: form.mode === 'external' ? normalizeExternalUrl(form.link) : undefined,
          iconUrl: iconField,
          createdAt: ts,
          updatedAt: ts,
        },
        ...tools,
      ];
    }
    closeEditor();
    await persistList(next);
  };

  const confirmDelete = async () => {
    if (!deleteId) return;
    const next = tools.filter((t) => t.id !== deleteId);
    setDeleteId(null);
    await persistList(next);
  };

  const openExternal = (url: string) => {
    try {
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch {
      window.alert('无法打开链接，请检查地址是否正确。');
    }
  };

  const modeLocked = editor.open && editor.intent === 'edit';

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-gradient-to-b from-slate-50/90 to-slate-100/80 animate-fadeIn">
      <div className="shrink-0 border-b border-slate-200/80 bg-white/90 px-6 py-5 shadow-sm backdrop-blur-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 flex h-11 w-11 items-center justify-center rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/25">
              <Workflow size={22} strokeWidth={2.2} />
            </div>
            <div className="min-w-0 max-w-3xl">
              <h2 className="text-lg font-black tracking-tight text-slate-900">治理工具</h2>
              <p
                className="mt-0.5 line-clamp-2 cursor-default text-[13px] font-medium leading-relaxed text-slate-500"
                title="数据治理工具这个功能页的定位，支持内外部数据治理工具"
              >
                数据治理工具这个功能页的定位，支持内外部数据治理工具
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={openCreate}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-[13px] font-bold text-white shadow-md shadow-blue-600/20 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Plus size={18} strokeWidth={2.5} />
            新建工具
          </button>
        </div>

        {loadSource === 'local_fallback' && (
          <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50/90 px-4 py-3 text-[12px] font-semibold text-amber-900">
            未能从服务器加载 governance-tools.json，当前显示的是本机浏览器中的缓存副本。联网或部署该 JSON 后刷新即可同步。
          </div>
        )}

        {persistHint && (
          <div className="mt-4 flex items-start justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-[12px] font-semibold text-emerald-900">
            <span>{persistHint}</span>
            <button
              type="button"
              onClick={() => setPersistHint(null)}
              className="shrink-0 rounded-lg p-1 text-emerald-700 hover:bg-emerald-100"
              aria-label="关闭提示"
            >
              <X size={16} />
            </button>
          </div>
        )}

        <div className="mt-5 max-w-xl">
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="搜索工具名称、简介或链接…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-11 pr-4 text-[14px] font-medium text-slate-800 shadow-sm outline-none ring-0 transition placeholder:text-slate-400 focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
            />
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 text-slate-500">
            <Loader2 className="mb-3 h-9 w-9 animate-spin" strokeWidth={2} />
            <p className="text-[14px] font-bold">正在加载工具库…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 py-20 text-center">
            <div className="mb-3 rounded-2xl bg-slate-100 p-4 text-slate-400">
              <FileText size={36} strokeWidth={1.5} />
            </div>
            <p className="text-[15px] font-bold text-slate-600">暂无匹配的工具</p>
            <p className="mt-1 max-w-sm text-[13px] font-medium text-slate-400">
              {query.trim()
                ? '尝试更换关键词，或清空搜索'
                : '可在 public/governance-tools.json 中批量维护，或使用「新建工具」'}
            </p>
          </div>
        ) : (
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 17rem), 1fr))',
            }}
          >
            {filtered.map((t) => (
              <article
                key={t.id}
                className="group grid grid-cols-[3.5rem_1fr] gap-x-3 gap-y-2 rounded-2xl border border-white/80 bg-white/95 p-5 shadow-sm ring-1 ring-slate-900/[0.04] transition hover:shadow-md"
              >
                <div className="row-span-2 flex items-center justify-center self-stretch pt-0.5">
                  <GovernanceToolIcon tool={t} />
                </div>

                <div className="flex min-h-10 items-center justify-between gap-2">
                  <span
                    className={`inline-flex shrink-0 items-center rounded-lg px-2 py-1 text-[10px] font-black uppercase leading-none tracking-wider ${
                      t.mode === 'external'
                        ? 'bg-blue-50 text-blue-700 ring-1 ring-blue-100'
                        : 'bg-slate-100 text-slate-600 ring-1 ring-slate-200/80'
                    }`}
                  >
                    {t.mode === 'external' ? '外部引用' : '自定义'}
                  </span>
                  <div className="flex shrink-0 items-center gap-0.5 opacity-90 transition group-hover:opacity-100">
                    <span className="inline-flex h-9 w-9 items-center justify-center">
                      {t.mode === 'external' && t.link ? (
                        <button
                          type="button"
                          title="在新窗口打开"
                          onClick={() => openExternal(t.link!)}
                          className="flex h-9 w-9 items-center justify-center rounded-lg text-blue-600 transition hover:bg-blue-50"
                        >
                          <ExternalLink size={17} />
                        </button>
                      ) : (
                        <span className="flex h-9 w-9 items-center justify-center" aria-hidden>
                          <ExternalLink size={17} className="invisible" />
                        </span>
                      )}
                    </span>
                    <button
                      type="button"
                      title="编辑"
                      onClick={() => openEdit(t.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
                    >
                      <Pencil size={17} />
                    </button>
                    <button
                      type="button"
                      title="删除"
                      onClick={() => setDeleteId(t.id)}
                      className="flex h-9 w-9 items-center justify-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>

                <h3 className="col-start-2 min-h-[3rem] text-[16px] font-bold leading-snug text-slate-900 line-clamp-2">
                  {t.name}
                </h3>

                <p
                  className="col-span-2 line-clamp-2 min-h-[2.75rem] cursor-default text-[13px] font-medium leading-relaxed text-slate-600"
                  title={t.description}
                >
                  {t.description}
                </p>
                {t.mode === 'external' && t.link && (
                  <button
                    type="button"
                    onClick={() => openExternal(t.link!)}
                    className="col-span-2 mt-1 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-[13px] font-bold text-white shadow-sm transition hover:bg-blue-700"
                  >
                    <Link2 size={16} />
                    打开工具
                  </button>
                )}
                {!(t.mode === 'external' && t.link) && (
                  <div className="col-span-2 mt-1 min-h-[2.75rem]" aria-hidden />
                )}
                <p className="col-span-2 text-[11px] font-medium text-slate-400">更新于 {t.updatedAt}</p>
              </article>
            ))}
          </div>
        )}
      </div>

      {editor.open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/40 p-4 backdrop-blur-[2px]">
          <div
            className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white shadow-2xl ring-1 ring-slate-900/10"
            role="dialog"
            aria-modal="true"
          >
            <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
              <h3 className="text-[16px] font-black text-slate-900">
                {editor.intent === 'edit' ? '编辑工具' : '新建工具'}
              </h3>
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label="关闭"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4 px-5 py-5">
              <div>
                <span className="mb-2 block text-[12px] font-bold text-slate-500">类型</span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    disabled={modeLocked}
                    onClick={() => setForm((f) => ({ ...f, mode: 'external' }))}
                    className={`rounded-xl border px-3 py-3 text-left text-[13px] font-bold transition ${
                      form.mode === 'external'
                        ? 'border-blue-500 bg-blue-50 text-blue-800 ring-2 ring-blue-100'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    } ${modeLocked && form.mode !== 'external' ? 'opacity-40' : ''} disabled:cursor-not-allowed`}
                  >
                    外部工具引用
                    <span className="mt-1 block text-[11px] font-medium text-slate-500">
                      填写名称、简介与链接；图标默认同域名网站 favicon
                    </span>
                  </button>
                  <button
                    type="button"
                    disabled={modeLocked}
                    onClick={() => setForm((f) => ({ ...f, mode: 'custom', link: '' }))}
                    className={`rounded-xl border px-3 py-3 text-left text-[13px] font-bold transition ${
                      form.mode === 'custom'
                        ? 'border-slate-700 bg-slate-900 text-white ring-2 ring-slate-300'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    } ${modeLocked && form.mode !== 'custom' ? 'opacity-40' : ''} disabled:cursor-not-allowed`}
                  >
                    自定义工具
                    <span
                      className={`mt-1 block text-[11px] font-medium ${
                        form.mode === 'custom' ? 'text-slate-300' : 'text-slate-500'
                      }`}
                    >
                      仅名称与说明；可选填图标 URL
                    </span>
                  </button>
                </div>
                {modeLocked && (
                  <p className="mt-2 text-[11px] font-medium text-amber-700">编辑时不允许切换类型，避免数据不一致。</p>
                )}
              </div>

              <label className="block">
                <span className="mb-1.5 block text-[12px] font-bold text-slate-500">工具名称</span>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-[14px] font-medium outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  placeholder="例如：血缘分析平台"
                />
              </label>

              <label className="block">
                <span className="mb-1.5 block text-[12px] font-bold text-slate-500">简介</span>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={4}
                  className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2.5 text-[14px] font-medium leading-relaxed outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  placeholder="简要说明用途、适用场景等"
                />
              </label>

              {form.mode === 'external' && (
                <label className="block">
                  <span className="mb-1.5 block text-[12px] font-bold text-slate-500">工具链接</span>
                  <input
                    value={form.link}
                    onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-[13px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                    placeholder="https:// 或域名（将自动补全 https）"
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-1.5 block text-[12px] font-bold text-slate-500">
                  图标地址（可选）
                </span>
                <input
                  value={form.iconUrl}
                  onChange={(e) => setForm((f) => ({ ...f, iconUrl: e.target.value }))}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 font-mono text-[13px] outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  placeholder="留空则外部工具按链接域名自动拉取网站图标"
                />
                <p className="mt-1.5 text-[11px] font-medium leading-relaxed text-slate-400">
                  外部工具未填时，会依次尝试 Google favicon 服务、DuckDuckGo 与站点 /favicon.ico。
                </p>
              </label>
            </div>

            <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-4">
              <button
                type="button"
                onClick={closeEditor}
                className="rounded-xl px-4 py-2.5 text-[13px] font-bold text-slate-600 transition hover:bg-slate-100"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => void handleSave()}
                className="rounded-xl bg-blue-600 px-5 py-2.5 text-[13px] font-bold text-white shadow-sm transition hover:bg-blue-700"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-900/35 p-4 backdrop-blur-[1px]">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl ring-1 ring-slate-900/10">
            <h4 className="text-[15px] font-black text-slate-900">确认删除？</h4>
            <p className="mt-2 text-[13px] font-medium leading-relaxed text-slate-600">
              删除后需保存到数据源；开发环境将写回 JSON 文件。
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteId(null)}
                className="rounded-xl px-4 py-2 text-[13px] font-bold text-slate-600 hover:bg-slate-100"
              >
                取消
              </button>
              <button
                type="button"
                onClick={() => void confirmDelete()}
                className="rounded-xl bg-red-600 px-4 py-2 text-[13px] font-bold text-white hover:bg-red-700"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
