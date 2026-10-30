import { useSyncExternalStore } from 'react';

// hash 路由：#/playlist/123?x=1。部署成静态文件时不需要服务端配置。

export interface Route {
  path: string;
  parts: string[];
  query: URLSearchParams;
}

function parse(): Route {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, qs = ''] = raw.split('?');
  return { path, parts: path.split('/').filter(Boolean).map(decodeURIComponent), query: new URLSearchParams(qs) };
}

let route = parse();
const listeners = new Set<() => void>();
window.addEventListener('hashchange', () => {
  route = parse();
  listeners.forEach((fn) => fn());
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
  playlist: (id: string | number) => `#/playlist/${id}`,
  album: (id: string | number) => `#/album/${id}`,
  artist: (id: string | number) => `#/artist/${id}`,
  search: (q?: string, type?: string) =>
    `#/search${q ? `?q=${encodeURIComponent(q)}${type ? `&type=${type}` : ''}` : ''}`,
  library: () => '#/library',
  settings: () => '#/settings',
};
