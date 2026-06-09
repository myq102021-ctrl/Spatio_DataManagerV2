import { DATA_THEME_BIND_OPTIONS } from '../constants';

export interface DataThemeStructureItem {
  label: string;
  depth: number;
  isActive: boolean;
}

export function themePathByNodeId(nodeId: string): string {
  return DATA_THEME_BIND_OPTIONS.find((o) => o.id === nodeId)?.path ?? '—';
}

/** 将「一级 / 二级 / 叶子」路径解析为侧栏树形层级 */
export function buildDataThemeStructure(path: string): DataThemeStructureItem[] {
  if (!path || path === '—') return [];
  const segments = path.split(' / ').map((s) => s.trim()).filter(Boolean);
  return segments.map((label, depth) => ({
    label,
    depth,
    isActive: depth === segments.length - 1,
  }));
}
