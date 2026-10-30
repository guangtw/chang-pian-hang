import { site } from '../config/site';

export function formatTime(ms: number): string {
  if (!Number.isFinite(ms) || ms < 0) ms = 0;
  const total = Math.floor(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function formatCount(n?: number): string {
  if (!n) return '0';
  if (n >= 1e8) return `${(n / 1e8).toFixed(1)} 亿`;
  if (n >= 1e4) return `${Math.round(n / 1e4)} 万`;
  return String(n);
}

export function formatDate(ts?: number): string {
  if (!ts) return '';
  const d = new Date(ts);
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月`;
}

const WEEK = ['日', '一', '二', '三', '四', '五', '六'];

/** 刊头日期：2026 年 10 月 30 日 · 星期五 */
export function issueDate(d = new Date()): string {
  return `${d.getFullYear()} 年 ${d.getMonth() + 1} 月 ${d.getDate()} 日 · 星期${WEEK[d.getDay()]}`;
}

/** 刊号：从 site.issueEpoch 起算，每周一期 */
export function issueNumber(d = new Date()): number {
  return Math.max(1, Math.floor((d.getTime() - Date.parse(site.issueEpoch)) / (7 * 86400000)) + 1);
}

export const issueLabel = () => site.issueLabel.replace('{n}', String(issueNumber()));

/** 唱片的 A/B 面编号：前一半是 A 面，后一半是 B 面 */
export function sideLabel(i: number, total: number): string {
  const half = Math.ceil(total / 2);
  return i < half ? `A${i + 1}` : `B${i - half + 1}`;
}

export const artistNames = (list: { name: string }[]) => list.map((a) => a.name).join(' / ');
