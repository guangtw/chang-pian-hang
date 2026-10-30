import type { Lyric, LyricLine } from '../api/types';

const TIME_TAG = /\[(\d{1,3}):(\d{1,2})(?:[.:](\d{1,3}))?\]/g;

function parseLrc(text: string): LyricLine[] {
  const lines: LyricLine[] = [];
  for (const raw of text.split(/\r?\n/)) {
    const tags = [...raw.matchAll(TIME_TAG)];
    if (!tags.length) continue;
    const content = raw.replace(TIME_TAG, '').trim();
    for (const [, m, s, frac = '0'] of tags) {
      const ms = Number(frac.padEnd(3, '0').slice(0, 3));
      lines.push({ time: Number(m) * 60_000 + Number(s) * 1000 + ms, text: content });
    }
  }
  return lines.sort((a, b) => a.time - b.time);
}

/** 解析 LRC（可附带翻译 LRC），按时间把译文挂到对应原文行上 */
export function parseLyric(lrc?: string, translated?: string): Lyric {
  if (!lrc?.trim()) return { lines: [] };
  const lines = parseLrc(lrc).filter((l) => l.text);
  if (!lines.length) {
    return { lines: lrc.split(/\r?\n/).filter(Boolean).map((text) => ({ time: 0, text })), unsynced: true };
  }
  if (translated) {
    const byTime = new Map(parseLrc(translated).map((l) => [l.time, l.text]));
    for (const line of lines) {
      const t = byTime.get(line.time);
      if (t && t !== line.text) line.translation = t;
    }
  }
  return { lines };
}

/** 当前时间对应的歌词行下标 */
export function activeLineIndex(lines: LyricLine[], timeMs: number): number {
  let lo = 0;
  let hi = lines.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (lines[mid].time <= timeMs) {
      ans = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  return ans;
}
