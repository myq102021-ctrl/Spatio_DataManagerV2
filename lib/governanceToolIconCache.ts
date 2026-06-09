import type { GovernanceTool } from '../types';
import { hostnameFromToolLink } from './governanceToolIcon';

const DB_NAME = 'spatio-governance-tool-icons';
const DB_VERSION = 1;
const STORE = 'icons';

interface IconRecord {
  blob: Blob;
  savedAt: number;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openIconDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error);
    };
    req.onsuccess = () => resolve(req.result);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE);
      }
    };
  });
  return dbPromise;
}

/** 与 GovernanceToolIcon 一致：自定义图标按 URL 存；外链工具按域名合并缓存 */
export function iconCacheKeyForTool(tool: GovernanceTool): string | null {
  const explicit = tool.iconUrl?.trim();
  if (explicit) return `u:${explicit}`;
  if (tool.mode === 'external' && tool.link) {
    const host = hostnameFromToolLink(tool.link);
    if (host) return `h:${host.toLowerCase()}`;
  }
  return null;
}

export async function iconCacheGet(key: string): Promise<Blob | undefined> {
  try {
    const db = await openIconDb();
    return await new Promise((resolve, reject) => {
      const tx = db.transaction(STORE, 'readonly');
      const req = tx.objectStore(STORE).get(key);
      req.onsuccess = () => {
        const row = req.result as IconRecord | undefined;
        resolve(row?.blob);
      };
      req.onerror = () => reject(req.error);
    });
  } catch {
    return undefined;
  }
}

export async function iconCachePut(key: string, blob: Blob): Promise<void> {
  try {
    const db = await openIconDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE, 'readwrite');
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
      tx.objectStore(STORE).put({ blob, savedAt: Date.now() } satisfies IconRecord, key);
    });
  } catch {
    /* 配额满或隐私模式 */
  }
}
