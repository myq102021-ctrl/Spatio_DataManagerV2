import type { GovernanceTool } from '../types';
import { isValidToolRecord } from './governanceToolsValidate';

/** 与 public 目录下同名的共享数据文件，构建后位于站点根路径，所有人可读 */
export const GOVERNANCE_TOOLS_PUBLIC_PATH = '/governance-tools.json';

/** 仅开发环境 Vite 中间件提供，用于把列表写回 public/governance-tools.json */
export const GOVERNANCE_TOOLS_WRITE_API = '/__api/governance-tools';

const LOCAL_MIRROR_KEY = 'spatio-governance-tools-v1';

export type GovernanceToolsLoadSource = 'network' | 'local_fallback' | 'empty';

export async function loadGovernanceTools(): Promise<{
  tools: GovernanceTool[];
  source: GovernanceToolsLoadSource;
}> {
  try {
    const r = await fetch(`${GOVERNANCE_TOOLS_PUBLIC_PATH}?t=${Date.now()}`, {
      cache: 'no-store',
    });
    if (r.ok) {
      const data = (await r.json()) as unknown;
      if (Array.isArray(data)) {
        const list = data.filter(isValidToolRecord);
        try {
          localStorage.setItem(LOCAL_MIRROR_KEY, JSON.stringify(list));
        } catch {
          /* ignore */
        }
        return { tools: list, source: 'network' };
      }
    }
  } catch {
    /* 离线或无法访问 */
  }

  try {
    const raw = localStorage.getItem(LOCAL_MIRROR_KEY);
    if (!raw) return { tools: [], source: 'empty' };
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return { tools: [], source: 'empty' };
    const list = parsed.filter(isValidToolRecord);
    return {
      tools: list,
      source: list.length ? 'local_fallback' : 'empty',
    };
  } catch {
    return { tools: [], source: 'empty' };
  }
}

export type SaveGovernanceToolsResult =
  | { ok: true; persisted: 'repo_file' }
  | { ok: true; persisted: 'browser_only' }
  | { ok: false };

export async function saveGovernanceTools(
  tools: GovernanceTool[],
): Promise<SaveGovernanceToolsResult> {
  try {
    const r = await fetch(GOVERNANCE_TOOLS_WRITE_API, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tools, null, 2),
    });
    if (r.ok) {
      try {
        localStorage.setItem(LOCAL_MIRROR_KEY, JSON.stringify(tools));
      } catch {
        /* ignore */
      }
      return { ok: true, persisted: 'repo_file' };
    }
  } catch {
    /* 生产环境或无中间件 */
  }

  try {
    localStorage.setItem(LOCAL_MIRROR_KEY, JSON.stringify(tools));
    return { ok: true, persisted: 'browser_only' };
  } catch {
    return { ok: false };
  }
}
