import { getSettings } from '../lib/settings';
import { mockProvider } from './mock';
import { neteaseProvider } from './netease';
import type { MusicProvider } from './provider';

/** 配了后端地址就走网易云风格接口，否则用示例数据 */
export function api(): MusicProvider {
  return getSettings().apiBase.trim() ? neteaseProvider : mockProvider;
}

export type { MusicProvider } from './provider';
export * from './types';
