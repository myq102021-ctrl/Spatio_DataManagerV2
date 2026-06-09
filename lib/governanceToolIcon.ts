/** 将用户输入规范为可解析的绝对 URL */
export function normalizeExternalUrl(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  if (/^https?:\/\//i.test(t)) return t;
  return `https://${t}`;
}

export function hostnameFromToolLink(link: string): string | null {
  try {
    const u = new URL(normalizeExternalUrl(link));
    return u.hostname || null;
  } catch {
    return null;
  }
}

/**
 * 按优先级返回站点图标候选地址（不保证每个站点都有有效图标）。
 * 优先使用第三方 favicon 服务解析域名，失败时组件内会依次降级。
 */
export function faviconCandidatesFromLink(link: string): string[] {
  const host = hostnameFromToolLink(link);
  if (!host) return [];
  return [
    `https://www.google.com/s2/favicons?domain=${encodeURIComponent(host)}&sz=128`,
    `https://icons.duckduckgo.com/ip3/${host}.ico`,
    `https://${host}/favicon.ico`,
  ];
}
