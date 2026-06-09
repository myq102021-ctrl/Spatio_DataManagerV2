
import { AGRI_KNOWLEDGE_GRAPH, NL_QUERY_EXAMPLES_AGRI } from './agriKnowledgeGraphData';

/** 农业地块产业链知识图谱实体类型 */
export type KgEntityType =
  | 'land_parcel'
  | 'admin_division'
  | 'crop'
  | 'planting_record'
  | 'business_entity'
  | 'transfer_contract'
  | 'soil_test'
  | 'fertility_grade'
  | 'farm_activity'
  | 'input_product'
  | 'machinery_service'
  | 'yield_record'
  | 'sales_record'
  | 'processor'
  | 'warehouse'
  | 'market'
  | 'order'
  | 'risk_alert';

export interface LandParcelProfile {
  basic: {
    parcel_code: string;
    parcel_name: string;
    area_mu: number;
    land_type: string;
    quality_grade: string;
    centroid: string;
    status: string;
  };
  admin_division: { path: string; admin_code: string };
  current_crop: {
    crop_code: string;
    crop_name: string;
    season: string;
    year: number;
    plant_date: string;
  };
  planting_history: Array<{
    year: number;
    crop_name: string;
    season: string;
    yield_kg_mu: number;
  }>;
  operator: {
    entity_code: string;
    entity_name: string;
    entity_type: string;
    mode: string;
    since: string;
  };
  ownership: Array<{
    right_type: string;
    holder: string;
    share_ratio: string;
    cert_no: string;
  }>;
  transfer: Array<{
    contract_id: string;
    from: string;
    to: string;
    type: string;
    end_date: string;
    price_yuan_mu: string;
  }>;
  soil_fertility: {
    latest_test: { date: string; ph: string; om: string; n: string; p: string; k: string };
    fertility_grade: string;
    suitable_crops: string[];
  };
  farm_activities: Array<{
    date: string;
    type: string;
    input: string;
    service: string;
  }>;
  yield_and_revenue: {
    latest: {
      year: number;
      total_kg: number;
      sales_kg: number;
      avg_price: number;
      revenue_yuan: number;
    };
  };
  supply_chain: { path_summary: string; nodes: string[] };
  risk_alerts: Array<{
    type: string;
    level: string;
    message: string;
    alert_time: string;
  }>;
}

export interface KgEntity {
  id: string;
  name: string;
  type: KgEntityType;
  description: string;
  properties: Record<string, string>;
  aliases?: string[];
  /** 地块实体专属画像 */
  parcelProfile?: LandParcelProfile;
}

export interface KgRelation {
  id: string;
  sourceId: string;
  targetId: string;
  label: string;
}

export interface KgGraph {
  entities: KgEntity[];
  relations: KgRelation[];
}

export const KG_ENTITY_TYPE_LABEL: Record<KgEntityType, string> = {
  land_parcel: '地块',
  admin_division: '行政区划',
  crop: '作物',
  planting_record: '种植记录',
  business_entity: '经营主体',
  transfer_contract: '流转合同',
  soil_test: '土壤检测',
  fertility_grade: '肥力等级',
  farm_activity: '农事活动',
  input_product: '投入品',
  machinery_service: '农机服务',
  yield_record: '产量记录',
  sales_record: '销售记录',
  processor: '加工企业',
  warehouse: '仓储物流',
  market: '销售市场',
  order: '订单',
  risk_alert: '风险预警',
};

export const KG_ENTITY_TYPE_COLOR: Record<KgEntityType, string> = {
  land_parcel: '#059669',
  admin_division: '#3b82f6',
  crop: '#84cc16',
  planting_record: '#65a30d',
  business_entity: '#8b5cf6',
  transfer_contract: '#f97316',
  soil_test: '#a16207',
  fertility_grade: '#14b8a6',
  farm_activity: '#06b6d4',
  input_product: '#64748b',
  machinery_service: '#475569',
  yield_record: '#eab308',
  sales_record: '#f59e0b',
  processor: '#6366f1',
  warehouse: '#78716c',
  market: '#e11d48',
  order: '#dc2626',
  risk_alert: '#ef4444',
};

/** 图例分组（侧栏展示用） */
export const KG_LEGEND_GROUPS: { label: string; types: KgEntityType[] }[] = [
  { label: '核心', types: ['land_parcel', 'crop', 'business_entity'] },
  { label: '生产', types: ['planting_record', 'farm_activity', 'input_product', 'fertility_grade'] },
  { label: '产业链', types: ['yield_record', 'sales_record', 'processor', 'warehouse', 'market', 'order'] },
  { label: '其他', types: ['admin_division', 'soil_test', 'transfer_contract', 'machinery_service', 'risk_alert'] },
];

export const FULL_KNOWLEDGE_GRAPH: KgGraph = AGRI_KNOWLEDGE_GRAPH;

export const NL_QUERY_EXAMPLES = NL_QUERY_EXAMPLES_AGRI;

export function getEntityById(id: string): KgEntity | undefined {
  return FULL_KNOWLEDGE_GRAPH.entities.find((e) => e.id === id);
}

export function findEntityByKeyword(graph: KgGraph, keyword: string): KgEntity | undefined {
  const q = keyword.trim().toLowerCase();
  if (!q) return undefined;
  return graph.entities.find(
    (e) =>
      e.name.toLowerCase().includes(q) ||
      e.aliases?.some((a) => a.toLowerCase().includes(q)) ||
      e.id.toLowerCase().includes(q) ||
      Object.values(e.properties).some((v) => v.toLowerCase().includes(q)),
  );
}

export function searchEntities(graph: KgGraph, keyword: string, limit = 8): KgEntity[] {
  const q = keyword.trim().toLowerCase();
  if (!q) return [];
  return graph.entities
    .filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.aliases?.some((a) => a.toLowerCase().includes(q)) ||
        Object.values(e.properties).some((v) => v.toLowerCase().includes(q)),
    )
    .slice(0, limit);
}

function buildAdjacency(graph: KgGraph): Map<string, Set<string>> {
  const adj = new Map<string, Set<string>>();
  const touch = (a: string, b: string) => {
    if (!adj.has(a)) adj.set(a, new Set());
    adj.get(a)!.add(b);
  };
  for (const r of graph.relations) {
    touch(r.sourceId, r.targetId);
    touch(r.targetId, r.sourceId);
  }
  return adj;
}

export function findPathBetween(
  graph: KgGraph,
  startId: string,
  endId: string,
): { entityIds: string[]; relationIds: string[] } | null {
  if (startId === endId) {
    return { entityIds: [startId], relationIds: [] };
  }
  const adj = buildAdjacency(graph);
  const prev = new Map<string, string | null>();
  const queue = [startId];
  prev.set(startId, null);
  while (queue.length) {
    const cur = queue.shift()!;
    for (const nb of adj.get(cur) ?? []) {
      if (prev.has(nb)) continue;
      prev.set(nb, cur);
      if (nb === endId) {
        const entityIds: string[] = [];
        let p: string | null = endId;
        while (p) {
          entityIds.unshift(p);
          p = prev.get(p) ?? null;
        }
        const relationIds: string[] = [];
        for (let i = 0; i < entityIds.length - 1; i++) {
          const a = entityIds[i];
          const b = entityIds[i + 1];
          const rel = graph.relations.find(
            (r) =>
              (r.sourceId === a && r.targetId === b) ||
              (r.sourceId === b && r.targetId === a),
          );
          if (rel) relationIds.push(rel.id);
        }
        return { entityIds, relationIds };
      }
      queue.push(nb);
    }
  }
  return null;
}

export function getNeighborhood(
  graph: KgGraph,
  centerId: string,
  depth: number,
): { entityIds: Set<string>; relationIds: Set<string> } {
  const entityIds = new Set<string>([centerId]);
  const relationIds = new Set<string>();
  const adj = buildAdjacency(graph);
  let frontier = new Set([centerId]);
  for (let d = 0; d < depth; d++) {
    const next = new Set<string>();
    for (const node of frontier) {
      for (const nb of adj.get(node) ?? []) {
        const rel = graph.relations.find(
          (r) =>
            (r.sourceId === node && r.targetId === nb) ||
            (r.sourceId === nb && r.targetId === node),
        );
        if (rel) relationIds.add(rel.id);
        if (!entityIds.has(nb)) {
          entityIds.add(nb);
          next.add(nb);
        }
      }
    }
    frontier = next;
  }
  return { entityIds, relationIds };
}

export function subgraphFromIds(
  graph: KgGraph,
  entityIds: Set<string>,
  relationIds?: Set<string>,
): KgGraph {
  const entities = graph.entities.filter((e) => entityIds.has(e.id));
  const relations = graph.relations.filter((r) => {
    if (relationIds && !relationIds.has(r.id)) return false;
    return entityIds.has(r.sourceId) && entityIds.has(r.targetId);
  });
  return { entities, relations };
}

export type NlParseResult =
  | { mode: 'path'; start: KgEntity; end: KgEntity; summary: string }
  | { mode: 'neighborhood'; center: KgEntity; depth: number; summary: string }
  | { mode: 'failed'; summary: string };

export function parseNaturalLanguageQuery(
  graph: KgGraph,
  text: string,
): NlParseResult {
  const raw = text.trim();
  if (!raw) {
    return { mode: 'failed', summary: '请输入自然语言查询描述。' };
  }

  const depthMatch = raw.match(/(\d)\s*跳/);
  const depth = depthMatch ? Math.min(3, Math.max(1, parseInt(depthMatch[1], 10))) : 2;

  const matched = graph.entities
    .map((e) => {
      const terms = [e.name, ...(e.aliases ?? []), ...Object.values(e.properties)];
      const hit = terms.find((t) => raw.includes(t));
      return hit ? { entity: e, len: hit.length } : null;
    })
    .filter((x): x is { entity: KgEntity; len: number } => x !== null)
    .sort((a, b) => b.len - a.len);

  const pathKeywords = ['路径', '关联', '关系', '到', '之间', '如何连接', '产业链'];
  const isPathIntent = pathKeywords.some((k) => raw.includes(k));

  if (matched.length >= 2 && isPathIntent) {
    return {
      mode: 'path',
      start: matched[0].entity,
      end: matched[1].entity,
      summary: `已识别路径查询：「${matched[0].entity.name}」→「${matched[1].entity.name}」`,
    };
  }

  if (matched.length >= 1) {
    const center = matched[0].entity;
    const depthFromText = raw.includes('周边') || raw.includes('邻域') ? depth : 2;
    return {
      mode: 'neighborhood',
      center,
      depth: depthFromText,
      summary: `已识别邻域查询：以「${center.name}」为中心，深度 ${depthFromText}`,
    };
  }

  return {
    mode: 'failed',
    summary:
      '未能匹配到实体，请尝试包含如「郭桥村一组地块A」「晶两优534」「绿丰合作社」「白沙洲市场」等名称。',
  };
}
