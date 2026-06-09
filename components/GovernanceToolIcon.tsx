import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Workflow } from 'lucide-react';
import type { GovernanceTool } from '../types';
import { faviconCandidatesFromLink } from '../lib/governanceToolIcon';
import { iconCacheGet, iconCacheKeyForTool, iconCachePut } from '../lib/governanceToolIconCache';

const MIN_ICON_BYTES = 48;

function iconCandidatesForTool(tool: GovernanceTool): string[] {
  const urls: string[] = [];
  if (tool.iconUrl?.trim()) urls.push(tool.iconUrl.trim());
  if (tool.mode === 'external' && tool.link) urls.push(...faviconCandidatesFromLink(tool.link));
  return [...new Set(urls)];
}

function PlaceholderIcon() {
  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-slate-100 to-slate-200 shadow-[0_8px_24px_-4px_rgba(15,23,42,0.35)] ring-2 ring-white">
      <Workflow className="text-slate-500" size={26} strokeWidth={2} />
    </div>
  );
}

/**
 * 工具卡片图标：优先读 IndexedDB 图标库（按域名或自定义 iconUrl 缓存），
 * 未命中时再请求网络，成功后写入图标库供下次秒开。
 */
export const GovernanceToolIcon: React.FC<{ tool: GovernanceTool }> = ({ tool }) => {
  const candidates = useMemo(() => iconCandidatesForTool(tool), [tool]);
  const cacheKey = useMemo(() => iconCacheKeyForTool(tool), [tool]);
  const candidatesKey = useMemo(() => candidates.join('|'), [candidates]);

  const [blobSrc, setBlobSrc] = useState<string | null>(null);
  const [loading, setLoading] = useState(candidates.length > 0);
  const [remoteIdx, setRemoteIdx] = useState(0);
  const objectUrlRef = useRef<string | null>(null);

  useEffect(() => {
    if (candidates.length === 0) {
      setLoading(false);
      setBlobSrc(null);
      setRemoteIdx(0);
      return;
    }

    let cancelled = false;

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setBlobSrc(null);
    setRemoteIdx(0);
    setLoading(true);

    const applyBlob = (blob: Blob) => {
      const u = URL.createObjectURL(blob);
      objectUrlRef.current = u;
      setBlobSrc(u);
      setLoading(false);
    };

    async function resolve() {
      if (cacheKey) {
        try {
          const cached = await iconCacheGet(cacheKey);
          if (cancelled) return;
          if (cached && cached.size >= MIN_ICON_BYTES) {
            applyBlob(cached);
            return;
          }
        } catch {
          /* IndexedDB 不可用 */
        }

        for (const url of candidates) {
          if (cancelled) return;
          try {
            const res = await fetch(url, {
              referrerPolicy: 'no-referrer',
              mode: 'cors',
              cache: 'default',
            });
            if (!res.ok) continue;
            const blob = await res.blob();
            if (blob.size < MIN_ICON_BYTES) continue;
            await iconCachePut(cacheKey, blob);
            if (cancelled) return;
            applyBlob(blob);
            return;
          } catch {
            /* 跨域或网络错误，换下一候选 */
          }
        }
      }

      if (!cancelled) {
        setBlobSrc(null);
        setRemoteIdx(0);
        setLoading(false);
      }
    }

    void resolve();

    return () => {
      cancelled = true;
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
        objectUrlRef.current = null;
      }
    };
  }, [tool.id, cacheKey, candidatesKey, candidates.length]);

  if (candidates.length === 0) {
    return <PlaceholderIcon />;
  }

  if (loading) {
    return (
      <div className="h-14 w-14 shrink-0 animate-pulse rounded-2xl bg-slate-200/90 shadow-[0_8px_24px_-4px_rgba(15,23,42,0.2)] ring-2 ring-white" />
    );
  }

  if (blobSrc) {
    return (
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_-4px_rgba(15,23,42,0.35)] ring-2 ring-white">
        <img
          src={blobSrc}
          alt=""
          className="h-full w-full object-cover"
          decoding="async"
          onError={() => {
            if (objectUrlRef.current) {
              URL.revokeObjectURL(objectUrlRef.current);
              objectUrlRef.current = null;
            }
            setBlobSrc(null);
            setRemoteIdx(0);
          }}
        />
      </div>
    );
  }

  if (remoteIdx >= candidates.length) {
    return <PlaceholderIcon />;
  }

  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-white shadow-[0_8px_24px_-4px_rgba(15,23,42,0.35)] ring-2 ring-white">
      <img
        src={candidates[remoteIdx]}
        alt=""
        className="h-full w-full object-cover"
        referrerPolicy="no-referrer"
        loading="lazy"
        decoding="async"
        onError={() => setRemoteIdx((i) => i + 1)}
      />
    </div>
  );
};
