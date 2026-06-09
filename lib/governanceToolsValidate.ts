import type { GovernanceTool } from '../types';

export function isValidToolRecord(x: unknown): x is GovernanceTool {
  if (!x || typeof x !== 'object') return false;
  const o = x as Record<string, unknown>;
  if (
    typeof o.id !== 'string' ||
    (o.mode !== 'external' && o.mode !== 'custom') ||
    typeof o.name !== 'string' ||
    typeof o.description !== 'string' ||
    typeof o.createdAt !== 'string' ||
    typeof o.updatedAt !== 'string'
  ) {
    return false;
  }
  if (o.iconUrl !== undefined && typeof o.iconUrl !== 'string') return false;
  if (o.link !== undefined && typeof o.link !== 'string') return false;
  return true;
}
