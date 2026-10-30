import { useSyncExternalStore } from 'react';
import { transition } from './motion';

// hash 路由：#/playlist/123?x=1。部署成静态文件时不需要服务端配置。

export interface Route {
  path: string;
  parts: string[];
  query: URLSearchParams;
}

function parse(): Route {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [p, qs = ''] = raw.split('?');
  return { path: p, parts: p.split('/').filter(Boolean).map(decodeURIComponent), query: new URLSearchParams(qs) };
}

let route = parse();
const listeners = new Set<() => void>();

window.addEventListener('hashchange', () => {
  const next = parse();
  // 只改了查询参数（例如搜索翻页）不做整页过渡
  const samePage = next.path === route.path;
  const apply = () => {
    route = next;
    listeners.forEach((fn) => fn());
  };
  if (samePage) apply();
  else transition(apply, 'page');
});

export function useRoute(): Route {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    () => route,
  );
}

export function navigate(to: string) {
  location.hash = to;
}

export const href = {
  home: () => '#/',
  playlist: (id: string) => `#/playlist/${encodeURIComponent(id)}`,
  toplist: (id: string) => `#/toplist/${encodeURIComponent(id)}`,
  album: (id: string) => `#/album/${encodeURIComponent(id)}`,
  artist: (id: string) => `#/artist/${encodeURIComponent(id)}`,
  search: (q?: string, type?: string) =>
    `#/search${q ? `?q=${encodeURIComponent(q)}${type ? `&type=${type}` : ''}` : ''}`,
  charts: () => '#/charts',
  library: () => '#/library',
  settings: () => '#/settings',
};
