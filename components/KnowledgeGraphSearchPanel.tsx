import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Network,
  Route,
  GitBranch,
  MessageSquareText,
  Search,
  RotateCcw,
  Loader2,
  X,
  ArrowLeft,
  Sparkles,
  Info,
} from 'lucide-react';
import { KnowledgeGraphCanvas } from './KnowledgeGraphCanvas';
import { KnowledgeGraphEntityDetail } from './KnowledgeGraphEntityDetail';
import { PanelCollapseRail } from './PanelCollapseRail';
import {
  FULL_KNOWLEDGE_GRAPH,
  KG_ENTITY_TYPE_COLOR,
  KG_ENTITY_TYPE_LABEL,
  KG_LEGEND_GROUPS,
  NL_QUERY_EXAMPLES,
  findEntityByKeyword,
  findPathBetween,
  getEntityById,
  getNeighborhood,
  parseNaturalLanguageQuery,
  searchEntities,
  subgraphFromIds,
  type KgEntity,
  type KgGraph,
} from '../knowledgeGraphMock';

type QueryTab = 'path' | 'neighborhood' | 'natural';

function EntityAutocomplete({
  label,
  value,
  onChange,
  placeholder,
  graph,
}: {
  label: string;
  value: string;
  onChange: (entity: KgEntity | null, text: string) => void;
  placeholder: string;
  graph: KgGraph;
}) {
  const [open, setOpen] = useState(false);
  const suggestions = useMemo(() => searchEntities(graph, value, 6), [graph, value]);

  return (
    <div className="relative">
      <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
        {label}
      </label>
      <div className="relative">
        <Search
          size={14}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
        />
        <input
          value={value}
          onChange={(e) => {
            onChange(null, e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 160)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
        />
      </div>
      {open && value.trim() && suggestions.length > 0 && (
        <ul className="absolute z-30 mt-1 max-h-44 w-full overflow-y-auto rounded-lg border border-slate-200 bg-white py-1 shadow-lg custom-scrollbar">
          {suggestions.map((e) => (
            <li key={e.id}>
              <button
                type="button"
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-blue-50"
                onMouseDown={(ev) => {
                  ev.preventDefault();
                  onChange(e, e.name);
                  setOpen(false);
                }}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: KG_ENTITY_TYPE_COLOR[e.type] }}
                />
                <span className="font-medium text-slate-800">{e.name}</span>
                <span className="ml-auto text-[10px] text-slate-400">
                  {KG_ENTITY_TYPE_LABEL[e.type]}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export const KnowledgeGraphSearchPanel: React.FC = () => {
  const [queryTab, setQueryTab] = useState<QueryTab>('path');
  const [displayGraph, setDisplayGraph] = useState<KgGraph>(FULL_KNOWLEDGE_GRAPH);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [highlightEntityIds, setHighlightEntityIds] = useState<Set<string> | undefined>();
  const [highlightRelationIds, setHighlightRelationIds] = useState<Set<string> | undefined>();
  const [queryMessage, setQueryMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [pathStart, setPathStart] = useState<{ entity: KgEntity | null; text: string }>({
    entity: null,
    text: '',
  });
  const [pathEnd, setPathEnd] = useState<{ entity: KgEntity | null; text: string }>({
    entity: null,
    text: '',
  });
  const [centerEntity, setCenterEntity] = useState<{ entity: KgEntity | null; text: string }>({
    entity: null,
    text: '',
  });
  const [depth, setDepth] = useState(2);
  const [nlQuery, setNlQuery] = useState('');
  const [isQueryPanelCollapsed, setIsQueryPanelCollapsed] = useState(false);
  const [isDetailPanelCollapsed, setIsDetailPanelCollapsed] = useState(false);
  const [navHistory, setNavHistory] = useState<string[]>([]);

  const FOCUS_DEPTH = 2;

  const selectedEntity = useMemo(
    () => (selectedEntityId ? getEntityById(selectedEntityId) ?? null : null),
    [selectedEntityId],
  );

  const isParcelDetail = selectedEntity?.type === 'land_parcel';
  const isDetailPanelOpen = selectedEntityId !== null;

  useEffect(() => {
    if (selectedEntityId) setIsDetailPanelCollapsed(false);
  }, [selectedEntityId]);

  const syncGraphToEntity = useCallback((entityId: string, message: string) => {
    const entity = getEntityById(entityId);
    if (!entity) return;
    const { entityIds, relationIds } = getNeighborhood(
      FULL_KNOWLEDGE_GRAPH,
      entityId,
      FOCUS_DEPTH,
    );
    setDisplayGraph(subgraphFromIds(FULL_KNOWLEDGE_GRAPH, entityIds, relationIds));
    setHighlightEntityIds(entityIds);
    setHighlightRelationIds(relationIds);
    setQueryMessage(message);
  }, []);

  const focusEntity = useCallback(
    (entityId: string, options?: { recordHistory?: boolean }) => {
      const entity = getEntityById(entityId);
      if (!entity) return;

      setSelectedEntityId((current) => {
        if (options?.recordHistory !== false && current && current !== entityId) {
          setNavHistory((h) => [...h, current]);
        }
        return entityId;
      });

      syncGraphToEntity(entityId, `当前聚焦：「${entity.name}」及周边 ${FOCUS_DEPTH} 跳`);
      setIsDetailPanelCollapsed(false);
    },
    [syncGraphToEntity],
  );

  const goBack = useCallback(() => {
    setNavHistory((h) => {
      if (h.length === 0) return h;
      const copy = [...h];
      const prevId = copy.pop()!;
      const entity = getEntityById(prevId);
      if (entity) {
        setSelectedEntityId(prevId);
        syncGraphToEntity(prevId, `已返回：「${entity.name}」及周边 ${FOCUS_DEPTH} 跳`);
      }
      return copy;
    });
  }, [syncGraphToEntity]);

  const backTargetName = useMemo(() => {
    if (navHistory.length === 0) return null;
    return getEntityById(navHistory[navHistory.length - 1])?.name ?? null;
  }, [navHistory]);

  const handleCanvasSelectEntity = useCallback(
    (entityId: string | null) => {
      if (entityId === null) {
        setSelectedEntityId(null);
        setIsDetailPanelCollapsed(false);
        return;
      }
      focusEntity(entityId, {
        recordHistory: selectedEntityId !== null && selectedEntityId !== entityId,
      });
    },
    [focusEntity, selectedEntityId],
  );

  const closeDetailPanel = useCallback(() => {
    setSelectedEntityId(null);
    setIsDetailPanelCollapsed(false);
  }, []);

  const resetToFullGraph = useCallback(() => {
    setDisplayGraph(FULL_KNOWLEDGE_GRAPH);
    setHighlightEntityIds(undefined);
    setHighlightRelationIds(undefined);
    setQueryMessage('已恢复全量知识图谱视图');
    setSelectedEntityId(null);
    setNavHistory([]);
  }, []);

  const applySubgraph = (
    entityIds: Set<string>,
    relationIds: Set<string>,
    message: string,
    focusId?: string,
  ) => {
    setDisplayGraph(subgraphFromIds(FULL_KNOWLEDGE_GRAPH, entityIds, relationIds));
    setHighlightEntityIds(entityIds);
    setHighlightRelationIds(relationIds);
    setQueryMessage(message);
    if (focusId) setSelectedEntityId(focusId);
  };

  const runQuery = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 320));

    if (queryTab === 'path') {
      const start =
        pathStart.entity ?? findEntityByKeyword(FULL_KNOWLEDGE_GRAPH, pathStart.text);
      const end = pathEnd.entity ?? findEntityByKeyword(FULL_KNOWLEDGE_GRAPH, pathEnd.text);
      if (!start || !end) {
        setQueryMessage('请填写或选择有效的起始实体与目标实体');
        setLoading(false);
        return;
      }
      const result = findPathBetween(FULL_KNOWLEDGE_GRAPH, start.id, end.id);
      if (!result) {
        setQueryMessage(`未找到「${start.name}」与「${end.name}」之间的连通路径`);
        setLoading(false);
        return;
      }
      applySubgraph(
        new Set(result.entityIds),
        new Set(result.relationIds),
        `路径查询：共 ${result.entityIds.length} 个实体、${result.relationIds.length} 条关系`,
        start.id,
      );
    } else if (queryTab === 'neighborhood') {
      const center =
        centerEntity.entity ?? findEntityByKeyword(FULL_KNOWLEDGE_GRAPH, centerEntity.text);
      if (!center) {
        setQueryMessage('请填写或选择有效的中心实体');
        setLoading(false);
        return;
      }
      const { entityIds, relationIds } = getNeighborhood(
        FULL_KNOWLEDGE_GRAPH,
        center.id,
        depth,
      );
      applySubgraph(
        entityIds,
        relationIds,
        `邻域查询：以「${center.name}」为中心，深度 ${depth}，共 ${entityIds.size} 个实体`,
        center.id,
      );
    } else {
      const parsed = parseNaturalLanguageQuery(FULL_KNOWLEDGE_GRAPH, nlQuery);
      if (parsed.mode === 'failed') {
        setQueryMessage(parsed.summary);
        setLoading(false);
        return;
      }
      if (parsed.mode === 'path') {
        const result = findPathBetween(
          FULL_KNOWLEDGE_GRAPH,
          parsed.start.id,
          parsed.end.id,
        );
        if (!result) {
          setQueryMessage(
            `${parsed.summary}；但未找到连通路径，已展示两端实体邻域`,
          );
          const a = getNeighborhood(FULL_KNOWLEDGE_GRAPH, parsed.start.id, 1);
          const b = getNeighborhood(FULL_KNOWLEDGE_GRAPH, parsed.end.id, 1);
          const merged = new Set([...a.entityIds, ...b.entityIds]);
          const rels = new Set([...a.relationIds, ...b.relationIds]);
          applySubgraph(merged, rels, parsed.summary, parsed.start.id);
        } else {
          applySubgraph(
            new Set(result.entityIds),
            new Set(result.relationIds),
            parsed.summary,
            parsed.start.id,
          );
        }
      } else {
        const { entityIds, relationIds } = getNeighborhood(
          FULL_KNOWLEDGE_GRAPH,
          parsed.center.id,
          parsed.depth,
        );
        applySubgraph(entityIds, relationIds, parsed.summary, parsed.center.id);
      }
    }
    setLoading(false);
  };

  const tabs: { id: QueryTab; label: string; icon: React.ReactNode }[] = [
    { id: 'path', label: '路径查询', icon: <Route size={15} /> },
    { id: 'neighborhood', label: '邻域查询', icon: <GitBranch size={15} /> },
    { id: 'natural', label: '自然语言', icon: <MessageSquareText size={15} /> },
  ];

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col overflow-hidden animate-fadeIn">
      <header className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md">
            <Network size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight text-slate-900">知识图谱检索</h1>
            <p className="text-xs font-medium text-slate-500">
              大冶市农业地块产业链 · 地块画像 · 路径/邻域/自然语言检索
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold">
            {displayGraph.entities.length} 实体
          </span>
          <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold">
            {displayGraph.relations.length} 关系
          </span>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 overflow-hidden">
        {/* 左侧查询面板 */}
        <aside
          className={`flex shrink-0 flex-col overflow-hidden border-slate-100 bg-slate-50/60 transition-[width] duration-300 ease-in-out ${
            isQueryPanelCollapsed ? 'w-0 border-r-0' : 'w-[300px] border-r'
          }`}
        >
          <div
            className={`flex h-full min-w-[300px] flex-col transition-opacity duration-200 ${
              isQueryPanelCollapsed ? 'pointer-events-none opacity-0' : 'opacity-100'
            }`}
          >
          <div className="flex gap-1 border-b border-slate-100 p-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setQueryTab(t.id)}
                className={`flex flex-1 items-center justify-center gap-1 rounded-lg px-2 py-2 text-[11px] font-bold transition ${
                  queryTab === t.id
                    ? 'bg-white text-blue-700 shadow-sm ring-1 ring-blue-100'
                    : 'text-slate-500 hover:bg-white/80'
                }`}
              >
                {t.icon}
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar space-y-4">
            {queryTab === 'path' && (
              <>
                <EntityAutocomplete
                  label="起始实体"
                  value={pathStart.text}
                  onChange={(entity, text) => setPathStart({ entity, text })}
                  placeholder="如：郭桥村一组地块A"
                  graph={FULL_KNOWLEDGE_GRAPH}
                />
                <EntityAutocomplete
                  label="目标实体"
                  value={pathEnd.text}
                  onChange={(entity, text) => setPathEnd({ entity, text })}
                  placeholder="如：白沙洲市场"
                  graph={FULL_KNOWLEDGE_GRAPH}
                />
                <p className="text-[11px] leading-relaxed text-slate-500">
                  在图中查找两实体之间的最短关联路径，并高亮路径上的节点与边。
                </p>
              </>
            )}

            {queryTab === 'neighborhood' && (
              <>
                <EntityAutocomplete
                  label="中心实体"
                  value={centerEntity.text}
                  onChange={(entity, text) => setCenterEntity({ entity, text })}
                  placeholder="如：还地桥绿丰合作社"
                  graph={FULL_KNOWLEDGE_GRAPH}
                />
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    查询深度（跳数）
                  </label>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => setDepth(d)}
                        className={`flex-1 rounded-lg border py-2 text-sm font-bold transition ${
                          depth === d
                            ? 'border-blue-400 bg-blue-50 text-blue-700'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                        }`}
                      >
                        {d} 跳
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-[11px] leading-relaxed text-slate-500">
                  以选定实体为中心，按图拓扑向外扩展指定跳数，展示局部子图。
                </p>
              </>
            )}

            {queryTab === 'natural' && (
              <>
                <div>
                  <label className="mb-1.5 block text-[11px] font-bold uppercase tracking-wider text-slate-500">
                    自然语言描述
                  </label>
                  <textarea
                    value={nlQuery}
                    onChange={(e) => setNlQuery(e.target.value)}
                    rows={4}
                    placeholder="例如：郭桥村一组地块A到白沙洲市场有哪些关联？"
                    className="w-full resize-none rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100"
                  />
                </div>
                <div className="rounded-lg border border-dashed border-blue-200 bg-blue-50/50 p-3">
                  <p className="mb-2 flex items-center gap-1 text-[11px] font-bold text-blue-800">
                    <Sparkles size={12} />
                    示例问句
                  </p>
                  <ul className="space-y-1.5">
                    {NL_QUERY_EXAMPLES.map((ex) => (
                      <li key={ex}>
                        <button
                          type="button"
                          onClick={() => setNlQuery(ex)}
                          className="w-full text-left text-[11px] leading-snug text-blue-700 hover:underline"
                        >
                          {ex}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
                <p className="flex items-start gap-1.5 text-[11px] text-slate-500">
                  <Info size={12} className="mt-0.5 shrink-0" />
                  系统将自动识别问句中的实体名称，并推断路径或邻域查询意图。
                </p>
              </>
            )}

            <button
              type="button"
              disabled={loading}
              onClick={runQuery}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 py-2.5 text-sm font-bold text-white shadow-md transition hover:shadow-lg disabled:opacity-60"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Search size={16} />
              )}
              执行查询
            </button>

            <button
              type="button"
              onClick={resetToFullGraph}
              className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50"
            >
              <RotateCcw size={15} />
              恢复全图
            </button>

            {queryMessage && (
              <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-[11px] leading-relaxed text-slate-600">
                {queryMessage}
              </div>
            )}
          </div>

          {/* 图例 */}
          <div className="shrink-0 border-t border-slate-100 p-3">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
              实体类型
            </p>
            <div className="space-y-2">
              {KG_LEGEND_GROUPS.map((g) => (
                <div key={g.label}>
                  <p className="mb-1 text-[9px] font-bold text-slate-400">{g.label}</p>
                  <div className="flex flex-wrap gap-1">
                    {g.types.map((type) => (
                      <span
                        key={type}
                        className="inline-flex items-center gap-1 rounded-md bg-white px-1.5 py-0.5 text-[9px] font-medium text-slate-600 ring-1 ring-slate-100"
                      >
                        <span
                          className="h-1.5 w-1.5 rounded-full"
                          style={{ backgroundColor: KG_ENTITY_TYPE_COLOR[type] }}
                        />
                        {KG_ENTITY_TYPE_LABEL[type]}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          </div>
        </aside>

        <PanelCollapseRail
          side="left"
          collapsed={isQueryPanelCollapsed}
          onToggle={() => setIsQueryPanelCollapsed((v) => !v)}
          expandLabel="展开查询面板"
          collapseLabel="收起查询面板"
        />

        {/* 中央图谱 */}
        <main className="relative min-w-0 flex-1 p-3">
          <KnowledgeGraphCanvas
            graph={displayGraph}
            selectedEntityId={selectedEntityId}
            highlightEntityIds={highlightEntityIds}
            highlightRelationIds={highlightRelationIds}
            onSelectEntity={handleCanvasSelectEntity}
          />
          <div className="pointer-events-none absolute bottom-5 left-5 rounded-lg bg-white/90 px-3 py-2 text-[10px] font-medium text-slate-500 shadow-sm ring-1 ring-slate-100 backdrop-blur">
            悬停查看关系 · 滚轮缩放 · 拖拽平移 · 点击节点查看详情
          </div>
        </main>

        {isDetailPanelOpen && (
          <PanelCollapseRail
            side="right"
            collapsed={isDetailPanelCollapsed}
            onToggle={() => setIsDetailPanelCollapsed((v) => !v)}
            expandLabel="展开实体详情"
            collapseLabel="收起实体详情"
          />
        )}

        {/* 右侧实体详情：仅选中节点后显示 */}
        {isDetailPanelOpen && selectedEntity && (
        <aside
          className={`flex shrink-0 flex-col overflow-hidden border-slate-100 bg-white transition-[width] duration-300 ease-in-out ${
            isDetailPanelCollapsed
              ? 'w-0 border-l-0'
              : isParcelDetail
                ? 'w-[400px] border-l'
                : 'w-[360px] border-l'
          }`}
        >
          <div
            className={`flex h-full flex-col transition-opacity duration-200 ${
              isParcelDetail ? 'min-w-[400px]' : 'min-w-[360px]'
            } ${
              isDetailPanelCollapsed ? 'pointer-events-none opacity-0' : 'opacity-100'
            }`}
          >
              <div className="flex shrink-0 items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
                <div className="flex min-w-0 items-center gap-2">
                  {navHistory.length > 0 && (
                    <button
                      type="button"
                      onClick={goBack}
                      className="flex shrink-0 items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1.5 text-[11px] font-bold text-slate-600 transition hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700"
                      title={backTargetName ? `返回「${backTargetName}」` : '返回上一实体'}
                    >
                      <ArrowLeft size={14} />
                      返回
                    </button>
                  )}
                  <h2 className="truncate text-sm font-black text-slate-900">
                    {isParcelDetail ? '地块画像' : '实体详情'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={closeDetailPanel}
                  className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                  aria-label="关闭详情"
                >
                  <X size={16} />
                </button>
              </div>
              {isParcelDetail && (
                <div className="shrink-0 border-b border-emerald-100 bg-emerald-50/50 px-4 py-2">
                  <p className="text-sm font-black text-emerald-900">{selectedEntity.name}</p>
                  <p className="text-[11px] text-emerald-700">
                    {selectedEntity.parcelProfile?.basic.parcel_code}
                  </p>
                </div>
              )}
              <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <KnowledgeGraphEntityDetail
                  entityId={selectedEntity.id}
                  onNavigateEntity={(id) => focusEntity(id, { recordHistory: true })}
                />
              </div>
          </div>
        </aside>
        )}
      </div>
    </div>
  );
};
