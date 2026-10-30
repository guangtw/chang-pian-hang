import type { Quality } from '../api/types';
import { readJSON, writeJSON } from './storage';

export type Theme = 'paper' | 'night' | 'auto';

export interface Settings {
  /** 后端地址，例如 http://127.0.0.1:3000。留空 = 使用示例数据 */
  apiBase: string;
  /** 登录后后端返回的 cookie，请求时会作为 cookie 参数带上 */
  cookie: string;
  /** 是否让浏览器带上跨域 cookie（后端与前端同源或已配好 CORS 时可开） */
  withCredentials: boolean;
  quality: Quality;
  theme: Theme;
}

const KEY = 'cph.settings';

const defaults: Settings = {
  apiBase: (import.meta.env.VITE_API_BASE as string | undefined) ?? '',
  cookie: '',
  withCredentials: true,
  quality: 'exhigh',
  theme: 'auto',
};

let current: Settings = { ...defaults, ...readJSON<Partial<Settings>>(KEY, {}) };
const listeners = new Set<() => void>();

export function getSettings(): Settings {
  return current;
}

export function updateSettings(patch: Partial<Settings>) {
  current = { ...current, ...patch };
  writeJSON(KEY, current);
  listeners.forEach((fn) => fn());
}

export function subscribeSettings(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
