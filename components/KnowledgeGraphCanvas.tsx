import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KgEntity, KgGraph, KgRelation } from '../knowledgeGraphMock';
import { KG_ENTITY_TYPE_COLOR, KG_ENTITY_TYPE_LABEL } from '../knowledgeGraphMock';

export interface GraphNodeLayout {
  id: string;
  x: number;
  y: number;
}

interface KnowledgeGraphCanvasProps {
  graph: KgGraph;
  selectedEntityId: string | null;
  highlightEntityIds?: Set<string>;
  highlightRelationIds?: Set<string>;
  onSelectEntity: (id: string | null) => void;
}

const NODE_R = 20;
const LABEL_OFFSET = 28;
const NODE_PAD = 52;
const MIN_SCALE = 0.25;
const MAX_SCALE = 5;
const ZOOM_INTENSITY = 0.0012;

interface ViewTransform {
  x: number;
  y: number;
  scale: number;
}

function clampScale(scale: number) {
  return Math.min(MAX_SCALE, Math.max(MIN_SCALE, scale));
}

/** 以屏幕坐标 (mx,my) 为焦点缩放，保持该点下的图内容不动 */
function zoomTransformAt(
  t: ViewTransform,
  mx: number,
  my: number,
  scaleFactor: number,
): ViewTransform {
  const newScale = clampScale(t.scale * scaleFactor);
  if (newScale === t.scale) return t;
  const ratio = newScale / t.scale;
  return {
    scale: newScale,
    x: mx - ratio * (mx - t.x),
    y: my - ratio * (my - t.y),
  };
}

function computeLayout(
  graph: KgGraph,
  width: number,
  height: number,
  centerId?: string | null,
): Map<string, GraphNodeLayout> {
  const n = graph.entities.length;
  const cx = width / 2;
  const cy = height / 2;
  const minSide = Math.min(width, height);
  const margin = NODE_R + NODE_PAD + 16;
  const radius = Math.min(
    minSide * 0.4,
    ((minSide - margin * 2) / Math.max(Math.sqrt(n), 1)) * 0.95,
  );
  const map = new Map<string, GraphNodeLayout>();

  if (centerId && graph.entities.some((e) => e.id === centerId)) {
    map.set(centerId, { id: centerId, x: cx, y: cy });
    const ring = graph.entities.filter((e) => e.id !== centerId);
    ring.forEach((e, i) => {
      const angle = (2 * Math.PI * i) / Math.max(ring.length, 1) - Math.PI / 2;
      map.set(e.id, {
        id: e.id,
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      });
    });
    return map;
  }

  graph.entities.forEach((e, i) => {
    const angle = (2 * Math.PI * i) / Math.max(n, 1) - Math.PI / 2;
    map.set(e.id, {
      id: e.id,
      x: cx + radius * Math.cos(angle),
      y: cy + radius * Math.sin(angle),
    });
  });
  return map;
}

function layoutMetrics(width: number, height: number, nodeCount: number) {
  const minSide = Math.min(width, height);
  const n = Math.max(nodeCount, 1);
  const idealDist = Math.min(240, Math.max(110, ((minSide - 80) / Math.sqrt(n)) * 1.15));
  const minNodeDist = NODE_R * 2 + NODE_PAD;
  return {
    idealDist,
    minNodeDist,
    repulseK: idealDist * idealDist * 9,
    iterations: Math.min(180, 72 + n * 5),
    linkStrength: 0.028,
    centerStrength: 0.0012,
  };
}

function runForceLayout(
  graph: KgGraph,
  initial: Map<string, GraphNodeLayout>,
  width: number,
  height: number,
  centerId?: string | null,
): Map<string, GraphNodeLayout> {
  const nodes = graph.entities.map((e) => ({
    id: e.id,
    x: initial.get(e.id)?.x ?? width / 2,
    y: initial.get(e.id)?.y ?? height / 2,
    vx: 0,
    vy: 0,
  }));
  const index = new Map(nodes.map((n, i) => [n.id, i]));
  const edges = graph.relations
    .map((r) => {
      const si = index.get(r.sourceId);
      const ti = index.get(r.targetId);
      if (si === undefined || ti === undefined) return null;
      return { si, ti };
    })
    .filter((x): x is { si: number; ti: number } => x !== null);

  const cx = width / 2;
  const cy = height / 2;
  const { idealDist, minNodeDist, repulseK, iterations, linkStrength, centerStrength } =
    layoutMetrics(width, height, nodes.length);
  const centerIdx = centerId ? index.get(centerId) : undefined;
  const boundsPad = NODE_R + NODE_PAD;

  for (let iter = 0; iter < iterations; iter++) {
    const cooling = 1 - iter / iterations;

    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const dx = nodes[j].x - nodes[i].x;
        const dy = nodes[j].y - nodes[i].y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        let repulse = repulseK / (dist * dist);
        if (dist < minNodeDist) {
          repulse += ((minNodeDist - dist) / dist) * 120 * cooling;
        }
        const fx = (dx / dist) * repulse;
        const fy = (dy / dist) * repulse;
        nodes[i].vx -= fx;
        nodes[i].vy -= fy;
        nodes[j].vx += fx;
        nodes[j].vy += fy;
      }
    }
    for (const { si, ti } of edges) {
      const dx = nodes[ti].x - nodes[si].x;
      const dy = nodes[ti].y - nodes[si].y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const attract = (dist - idealDist) * linkStrength;
      const fx = (dx / dist) * attract;
      const fy = (dy / dist) * attract;
      nodes[si].vx += fx;
      nodes[si].vy += fy;
      nodes[ti].vx -= fx;
      nodes[ti].vy -= fy;
    }
    for (let i = 0; i < nodes.length; i++) {
      const node = nodes[i];
      if (centerIdx !== undefined && i === centerIdx) {
        node.vx = 0;
        node.vy = 0;
        node.x = cx;
        node.y = cy;
        continue;
      }
      node.vx += (cx - node.x) * centerStrength;
      node.vy += (cy - node.y) * centerStrength;
      node.vx *= 0.82;
      node.vy *= 0.82;
      node.x += node.vx;
      node.y += node.vy;
      node.x = Math.max(boundsPad, Math.min(width - boundsPad, node.x));
      node.y = Math.max(boundsPad, Math.min(height - boundsPad, node.y));
    }
  }

  const out = new Map<string, GraphNodeLayout>();
  for (const n of nodes) out.set(n.id, { id: n.id, x: n.x, y: n.y });
  return out;
}

function fitTransform(
  layout: Map<string, GraphNodeLayout>,
  width: number,
  height: number,
  padding = 48,
): ViewTransform {
  if (layout.size === 0) return { x: 0, y: 0, scale: 1 };
  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;
  for (const p of layout.values()) {
    minX = Math.min(minX, p.x - NODE_R - 44);
    maxX = Math.max(maxX, p.x + NODE_R + 44);
    minY = Math.min(minY, p.y - NODE_R - 12);
    maxY = Math.max(maxY, p.y + NODE_R + 12);
  }
  const bw = maxX - minX || 1;
  const bh = maxY - minY || 1;
  const scale = clampScale(
    Math.min((width - padding * 2) / bw, (height - padding * 2) / bh, 1.35),
  );
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  return {
    scale,
    x: width / 2 - cx * scale,
    y: height / 2 - cy * scale,
  };
}

function quadMid(
  x1: number,
  y1: number,
  cpx: number,
  cpy: number,
  x2: number,
  y2: number,
) {
  const t = 0.5;
  const mt = 1 - t;
  return {
    x: mt * mt * x1 + 2 * mt * t * cpx + t * t * x2,
    y: mt * mt * y1 + 2 * mt * t * cpy + t * t * y2,
  };
}

function buildEdgePath(
  s: GraphNodeLayout,
  t: GraphNodeLayout,
  curveIndex: number,
  curveTotal: number,
) {
  const dx = t.x - s.x;
  const dy = t.y - s.y;
  const dist = Math.hypot(dx, dy) || 1;
  const ux = dx / dist;
  const uy = dy / dist;
  const x1 = s.x + ux * NODE_R;
  const y1 = s.y + uy * NODE_R;
  const x2 = t.x - ux * NODE_R;
  const y2 = t.y - uy * NODE_R;
  const mx = (s.x + t.x) / 2;
  const my = (s.y + t.y) / 2;
  const spread = curveTotal <= 1 ? 0 : (curveIndex - (curveTotal - 1) / 2) * 26;
  const cpx = mx - uy * spread;
  const cpy = my + ux * spread;
  return {
    x1,
    y1,
    x2,
    y2,
    cpx,
    cpy,
    path: `M ${x1} ${y1} Q ${cpx} ${cpy} ${x2} ${y2}`,
    label: quadMid(x1, y1, cpx, cpy, x2, y2),
  };
}

export const KnowledgeGraphCanvas: React.FC<KnowledgeGraphCanvasProps> = ({
  graph,
  selectedEntityId,
  highlightEntityIds,
  highlightRelationIds,
  onSelectEntity,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const transformRef = useRef<ViewTransform>({ x: 0, y: 0, scale: 1 });
  const [size, setSize] = useState({ w: 800, h: 600 });
  const [transform, setTransform] = useState<ViewTransform>({ x: 0, y: 0, scale: 1 });
  const [hoveredEntityId, setHoveredEntityId] = useState<string | null>(null);
  const dragRef = useRef<{
    panning: boolean;
    moved: boolean;
    lastX: number;
    lastY: number;
  } | null>(null);

  const isNodeTarget = (target: EventTarget | null) => {
    if (!(target instanceof Element)) return false;
    return !!target.closest('[data-kg-node]');
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver((entries) => {
      const cr = entries[0]?.contentRect;
      if (cr) setSize({ w: cr.width, h: cr.height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const layoutKey = useMemo(
    () =>
      graph.entities
        .map((e) => e.id)
        .sort()
        .join('|') +
      '::' +
      graph.relations.map((r) => r.id).join('|'),
    [graph],
  );

  const layout = useMemo(() => {
    const init = computeLayout(graph, size.w, size.h, selectedEntityId);
    return runForceLayout(graph, init, size.w, size.h, selectedEntityId);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- layoutKey captures graph shape
  }, [layoutKey, size.w, size.h, selectedEntityId]);

  const edgeCurveMeta = useMemo(() => {
    const groups = new Map<string, string[]>();
    for (const r of graph.relations) {
      const key = [r.sourceId, r.targetId].sort().join('::');
      const list = groups.get(key) ?? [];
      list.push(r.id);
      groups.set(key, list);
    }
    const meta = new Map<string, { index: number; total: number }>();
    for (const ids of groups.values()) {
      ids.forEach((id, index) => meta.set(id, { index, total: ids.length }));
    }
    return meta;
  }, [graph.relations]);

  const entityMap = useMemo(
    () => new Map(graph.entities.map((e) => [e.id, e])),
    [graph.entities],
  );

  /** 悬浮时保留：当前节点 + 一跳邻居 */
  const hoverFocusIds = useMemo(() => {
    if (!hoveredEntityId) return null;
    const set = new Set<string>([hoveredEntityId]);
    for (const r of graph.relations) {
      if (r.sourceId === hoveredEntityId) set.add(r.targetId);
      if (r.targetId === hoveredEntityId) set.add(r.sourceId);
    }
    return set;
  }, [hoveredEntityId, graph.relations]);

  const hoveredEntity = hoveredEntityId ? entityMap.get(hoveredEntityId) : null;

  const hoverTooltipPos = useMemo(() => {
    if (!hoveredEntityId) return null;
    const pos = layout.get(hoveredEntityId);
    if (!pos) return null;
    const { x, y, scale } = transform;
    return {
      x: pos.x * scale + x + NODE_R * scale + 16,
      y: pos.y * scale + y - 12,
    };
  }, [hoveredEntityId, layout, transform]);

  const sortedEntities = useMemo(() => {
    const list = [...graph.entities];
    if (!hoveredEntityId) return list;
    return list.sort((a, b) => {
      if (a.id === hoveredEntityId) return 1;
      if (b.id === hoveredEntityId) return -1;
      return 0;
    });
  }, [graph.entities, hoveredEntityId]);

  const applyTransform = useCallback((next: ViewTransform) => {
    transformRef.current = next;
    setTransform(next);
  }, []);

  useEffect(() => {
    const fit = fitTransform(layout, size.w, size.h);
    applyTransform(fit);
    setHoveredEntityId(null);
  }, [layout, size.w, size.h, applyTransform]);

  const zoomAtClient = useCallback(
    (clientX: number, clientY: number, scaleFactor: number) => {
      const el = containerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const mx = clientX - rect.left;
      const my = clientY - rect.top;
      const next = zoomTransformAt(transformRef.current, mx, my, scaleFactor);
      applyTransform(next);
    },
    [applyTransform],
  );

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * ZOOM_INTENSITY);
      zoomAtClient(e.clientX, e.clientY, factor);
    };

    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomAtClient]);

  const handleDoubleClick = useCallback(
    (e: React.MouseEvent) => {
      if (isNodeTarget(e.target)) return;
      zoomAtClient(e.clientX, e.clientY, 1.35);
    },
    [zoomAtClient],
  );

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if (isNodeTarget(e.target)) return;
    setHoveredEntityId(null);
    dragRef.current = { panning: true, moved: false, lastX: e.clientX, lastY: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (!d?.panning) return;
    const dx = e.clientX - d.lastX;
    const dy = e.clientY - d.lastY;
    if (Math.abs(dx) > 2 || Math.abs(dy) > 2) d.moved = true;
    d.lastX = e.clientX;
    d.lastY = e.clientY;
    applyTransform({
      ...transformRef.current,
      x: transformRef.current.x + dx,
      y: transformRef.current.y + dy,
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    const d = dragRef.current;
    if (d?.panning && !d.moved && !isNodeTarget(e.target)) {
      onSelectEntity(null);
    }
    dragRef.current = null;
  };

  const handleNodeClick = (e: React.MouseEvent, entityId: string) => {
    e.stopPropagation();
    e.preventDefault();
    onSelectEntity(selectedEntityId === entityId ? null : entityId);
  };

  const renderEdge = (rel: KgRelation) => {
    const s = layout.get(rel.sourceId);
    const t = layout.get(rel.targetId);
    if (!s || !t) return null;
    const curve = edgeCurveMeta.get(rel.id) ?? { index: 0, total: 1 };
    const geom = buildEdgePath(s, t, curve.index, curve.total);
    const isSelectedEdge =
      !!selectedEntityId &&
      (rel.sourceId === selectedEntityId || rel.targetId === selectedEntityId);
    const hoverLinked =
      !!hoveredEntityId &&
      (rel.sourceId === hoveredEntityId || rel.targetId === hoveredEntityId);
    const hoverDimmed = !!hoverFocusIds && !hoverLinked;
    const queryDimmed =
      !!highlightRelationIds &&
      highlightRelationIds.size > 0 &&
      !highlightRelationIds.has(rel.id) &&
      !hoverFocusIds;
    const dimmed = hoverDimmed || queryDimmed;
    const stroke = isSelectedEdge ? '#2563eb' : '#cbd5e1';
    const strokeW = isSelectedEdge ? 2 : 1;
    const lineOpacity = dimmed ? 0.12 : isSelectedEdge ? 1 : hoverLinked ? 0.85 : 0.58;
    const labelOpacity = dimmed ? 0.2 : isSelectedEdge ? 1 : hoverLinked ? 0.95 : 0.72;
    const labelW = rel.label.length * 6.5 + 10;
    return (
      <g key={rel.id} className="transition-opacity duration-200">
        <path
          d={geom.path}
          fill="none"
          stroke={stroke}
          strokeWidth={strokeW}
          strokeOpacity={lineOpacity}
        />
        <g opacity={labelOpacity}>
          <rect
            x={geom.label.x - labelW / 2}
            y={geom.label.y - 8}
            width={labelW}
            height={16}
            rx={4}
            fill="#fff"
            fillOpacity={0.94}
            stroke={isSelectedEdge ? '#bfdbfe' : '#e2e8f0'}
            strokeWidth={0.5}
          />
          <text
            x={geom.label.x}
            y={geom.label.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={9}
            fontWeight={600}
            className="pointer-events-none select-none"
            fill={isSelectedEdge ? '#2563eb' : '#64748b'}
          >
            {rel.label}
          </text>
        </g>
      </g>
    );
  };

  const renderNode = (entity: KgEntity) => {
    const pos = layout.get(entity.id);
    if (!pos) return null;
    const selected = selectedEntityId === entity.id;
    const hovered = hoveredEntityId === entity.id;
    const hoverDimmed = !!hoverFocusIds && !hoverFocusIds.has(entity.id);
    const queryHighlighted = highlightEntityIds?.has(entity.id);
    const queryDimmed =
      !!highlightEntityIds &&
      highlightEntityIds.size > 0 &&
      !queryHighlighted &&
      !selected &&
      !hoverFocusIds;
    const dimmed = hoverDimmed || queryDimmed;
    const color = KG_ENTITY_TYPE_COLOR[entity.type];
    const nodeOpacity = dimmed ? 0.28 : 1;
    const label =
      entity.name.length > 10 ? `${entity.name.slice(0, 9)}…` : entity.name;
    const labelY =
      pos.y <= size.h / 2 ? -(NODE_R + 10) : LABEL_OFFSET;

    return (
      <g
        key={entity.id}
        data-kg-node={entity.id}
        transform={`translate(${pos.x}, ${pos.y})`}
        className="cursor-pointer transition-opacity duration-200"
        style={{ opacity: nodeOpacity }}
        onMouseEnter={() => setHoveredEntityId(entity.id)}
        onMouseLeave={() => setHoveredEntityId((id) => (id === entity.id ? null : id))}
        onClick={(e) => handleNodeClick(e, entity.id)}
      >
        {hovered && (
          <>
            <circle
              r={NODE_R + 14}
              fill={color}
              fillOpacity={0.12}
              className="pointer-events-none"
            />
            <circle
              r={NODE_R + 8}
              fill="none"
              stroke={color}
              strokeWidth={2}
              strokeOpacity={0.45}
              className="pointer-events-none"
            />
          </>
        )}
        {selected && !hovered && (
          <circle r={NODE_R + 8} fill="none" stroke="#2563eb" strokeWidth={2} opacity={0.5} />
        )}
        <circle r={NODE_R + 6} fill="transparent" style={{ pointerEvents: 'all' }} />
        <circle
          r={NODE_R}
          fill={color}
          fillOpacity={dimmed ? 0.25 : 0.95}
          stroke={selected ? '#2563eb' : hovered ? color : '#fff'}
          strokeWidth={selected ? 2.5 : hovered ? 2.5 : 2}
          className="pointer-events-none"
        />
        <g transform={`translate(0, ${labelY})`} opacity={dimmed ? 0.35 : 1}>
          <rect
            x={-label.length * 3.6}
            y={-9}
            width={label.length * 7.2}
            height={18}
            rx={4}
            fill="#fff"
            fillOpacity={0.94}
            stroke={selected ? '#bfdbfe' : '#e2e8f0'}
            strokeWidth={0.5}
          />
          <text
            y={1}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={10}
            fontWeight={700}
            className="pointer-events-none select-none"
            fill={dimmed ? '#94a3b8' : '#0f172a'}
          >
            {label}
          </text>
        </g>
      </g>
    );
  };

  return (
    <div
      ref={containerRef}
      className="relative h-full w-full overflow-hidden rounded-xl bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/40 select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={(e) => {
        handlePointerUp(e);
        setHoveredEntityId(null);
      }}
      onDoubleClick={handleDoubleClick}
    >
      <svg
        width={size.w}
        height={size.h}
        className="block touch-none"
        style={{ shapeRendering: 'geometricPrecision', textRendering: 'geometricPrecision' }}
      >
        <defs>
          <pattern id="kg-grid" width="24" height="24" patternUnits="userSpaceOnUse">
            <path
              d="M 24 0 L 0 0 0 24"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="0.4"
              opacity="0.35"
            />
          </pattern>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="url(#kg-grid)"
          className="cursor-grab active:cursor-grabbing"
        />
        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          {graph.relations.map(renderEdge)}
          {sortedEntities.map(renderNode)}
        </g>
      </svg>

      {hoveredEntity && hoverTooltipPos && (
        <div
          className="pointer-events-none absolute z-20 max-w-[220px] animate-fadeIn rounded-lg border-2 bg-white px-3 py-2.5 shadow-lg"
          style={{
            left: Math.min(hoverTooltipPos.x, size.w - 230),
            top: Math.max(8, Math.min(hoverTooltipPos.y, size.h - 100)),
            borderColor: KG_ENTITY_TYPE_COLOR[hoveredEntity.type],
          }}
        >
          <p className="truncate text-sm font-bold text-slate-900">{hoveredEntity.name}</p>
          <dl className="mt-1.5 space-y-0.5">
            <div className="flex gap-1.5 text-xs">
              <dt className="shrink-0 text-slate-400">类型</dt>
              <dd className="font-medium text-slate-700">
                {KG_ENTITY_TYPE_LABEL[hoveredEntity.type]}
              </dd>
            </div>
            <div className="flex gap-1.5 text-xs">
              <dt className="shrink-0 text-slate-400">ID</dt>
              <dd className="truncate font-mono text-[10px] text-slate-500">{hoveredEntity.id}</dd>
            </div>
          </dl>
          {hoveredEntity.description && (
            <p className="mt-1 border-t border-slate-100 pt-1 text-[11px] leading-snug text-slate-500">
              {hoveredEntity.description}
            </p>
          )}
        </div>
      )}

      <div className="pointer-events-none absolute bottom-3 right-3 rounded-md bg-white/85 px-2 py-1 text-[10px] font-medium tabular-nums text-slate-500 shadow-sm ring-1 ring-slate-100 backdrop-blur">
        {Math.round(transform.scale * 100)}%
      </div>
    </div>
  );
};
