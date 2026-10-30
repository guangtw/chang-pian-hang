import { api, type Lyric, type Track } from '../api';
import { getSettings } from '../lib/settings';
import { readJSON, writeJSON } from '../lib/storage';
import { createStore } from '../lib/store';
import { toast } from '../lib/toast';

export type PlayMode = 'order' | 'loop' | 'one' | 'shuffle';

export interface PlayerState {
  queue: Track[];
  index: number;
  playing: boolean;
  loading: boolean;
  /** 毫秒 */
  position: number;
  duration: number;
  volume: number;
  muted: boolean;
  mode: PlayMode;
  lyric: Lyric | null;
}

const SAVE_KEY = 'cph.player';
const saved = readJSON<Partial<PlayerState>>(SAVE_KEY, {});

export const playerStore = createStore<PlayerState>({
  queue: saved.queue ?? [],
  index: saved.index ?? -1,
  playing: false,
  loading: false,
  position: 0,
  duration: 0,
  volume: saved.volume ?? 0.8,
  muted: false,
  mode: saved.mode ?? 'order',
  lyric: null,
});

const audio = new Audio();
audio.preload = 'auto';
audio.volume = playerStore.get().volume;

/** 当前已装进 <audio> 的曲目，用来判断要不要重新取地址 */
let loadedId: string | null = null;
/** 防止快速切歌时旧请求覆盖新请求 */
let loadToken = 0;
/** shuffle 模式下的回退历史 */
const history: number[] = [];

const set = playerStore.set;
const get = playerStore.get;

export const currentTrack = (s: PlayerState = get()) => s.queue[s.index] ?? null;

// ---- 持久化（队列、位置、音量、模式） ----
let lastSaved = '';
playerStore.subscribe(() => {
  const { queue, index, volume, mode } = get();
  const snapshot = JSON.stringify({ queue, index, volume, mode });
  if (snapshot !== lastSaved) {
    lastSaved = snapshot;
    writeJSON(SAVE_KEY, { queue, index, volume, mode });
  }
});

// ---- <audio> 事件 ----
audio.addEventListener('timeupdate', () => set({ position: audio.currentTime * 1000 }));
audio.addEventListener('durationchange', () => {
  if (Number.isFinite(audio.duration)) set({ duration: audio.duration * 1000 });
});
audio.addEventListener('play', () => set({ playing: true }));
audio.addEventListener('pause', () => set({ playing: false }));
audio.addEventListener('waiting', () => set({ loading: true }));
audio.addEventListener('playing', () => set({ loading: false }));
audio.addEventListener('ended', () => {
  if (get().mode === 'one') {
    audio.currentTime = 0;
    void audio.play();
  } else next(true);
});
audio.addEventListener('error', () => {
  if (!audio.src) return;
  set({ loading: false, playing: false });
  toast('这首歌加载失败，换下一首。');
  next(true);
});

async function load(index: number, autoplay = true, skipped = 0) {
  const { queue } = get();
  const track = queue[index];
  if (!track) return;
  const token = ++loadToken;
  set({ index, loading: true, position: 0, duration: track.duration, lyric: null });
  updateMediaSession(track);

  try {
    const src = await api().getSongSource(track.id, getSettings().quality);
    if (token !== loadToken) return;
    if (!src.url) {
      if (skipped + 1 >= queue.length) {
        set({ loading: false, playing: false });
        toast('队列里的歌都暂时听不了。');
        return;
      }
      toast(`《${track.name}》暂时听不了，已跳过。`);
      return load(nextIndex(index), autoplay, skipped + 1);
    }
    if (src.trial) toast('只有试听片段，完整版需要后端账号有对应权限。');
    loadedId = String(track.id);
    audio.src = src.url;
    if (autoplay) await audio.play().catch(() => set({ playing: false }));
    else set({ loading: false });
  } catch (e) {
    if (token !== loadToken) return;
    set({ loading: false, playing: false });
    toast((e as Error).message || '获取播放地址失败。');
  }

  api()
    .getLyric(track.id)
    .then((lyric) => token === loadToken && set({ lyric }))
    .catch(() => token === loadToken && set({ lyric: { lines: [] } }));
}

function nextIndex(from: number): number {
  const { queue, mode } = get();
  if (mode === 'shuffle' && queue.length > 1) {
    let i = from;
    while (i === from) i = Math.floor(Math.random() * queue.length);
    return i;
  }
  return (from + 1) % queue.length;
}

// ---- 对外操作 ----

export function playList(tracks: Track[], start = 0) {
  const list = tracks.filter((t) => t.playable !== false);
  if (!list.length) return toast('这里没有能播放的歌。');
  const startTrack = tracks[start];
  const idx = Math.max(0, list.findIndex((t) => t.id === startTrack?.id));
  history.length = 0;
  set({ queue: list, index: idx });
  void load(idx);
}

export function playTrack(track: Track) {
  const { queue, index } = get();
  const existing = queue.findIndex((t) => t.id === track.id);
  if (existing >= 0) return jumpTo(existing);
  const q = [...queue];
  q.splice(index + 1, 0, track);
  set({ queue: q });
  jumpTo(index + 1);
}

export function addNext(track: Track) {
  const { queue, index } = get();
  const q = queue.filter((t) => t.id !== track.id);
  const cur = currentTrack();
  const at = cur ? q.findIndex((t) => t.id === cur.id) + 1 : 0;
  q.splice(at, 0, track);
  set({ queue: q, index: cur ? at - 1 : index });
  toast(`《${track.name}》会在下一首播放。`);
}

export function jumpTo(i: number) {
  if (get().index >= 0) history.push(get().index);
  void load(i);
}

export function toggle() {
  const s = get();
  const track = currentTrack(s);
  if (!track) return;
  if (loadedId !== String(track.id)) return void load(s.index);
  if (audio.paused) void audio.play();
  else audio.pause();
}

export function next(auto = false) {
  const { queue, index, mode } = get();
  if (!queue.length) return;
  if (auto && mode === 'order' && index === queue.length - 1) {
    set({ playing: false });
    return;
  }
  history.push(index);
  void load(nextIndex(index));
}

export function prev() {
  const { queue, index, mode } = get();
  if (!queue.length) return;
  if (audio.currentTime > 4) {
    audio.currentTime = 0;
    return;
  }
  const back = mode === 'shuffle' ? history.pop() : undefined;
  void load(back ?? (index - 1 + queue.length) % queue.length);
}

export function seek(ms: number) {
  const track = currentTrack();
  if (!track) return;
  if (loadedId !== String(track.id)) return;
  audio.currentTime = Math.max(0, ms / 1000);
  set({ position: ms });
}

export function setVolume(v: number) {
  audio.volume = Math.max(0, Math.min(1, v));
  audio.muted = false;
  set({ volume: audio.volume, muted: false });
}

export function toggleMute() {
  audio.muted = !audio.muted;
  set({ muted: audio.muted });
}

const MODES: PlayMode[] = ['order', 'loop', 'one', 'shuffle'];
export const MODE_LABEL: Record<PlayMode, string> = {
  order: '顺序播放',
  loop: '列表循环',
  one: '单曲循环',
  shuffle: '随机播放',
};

export function cycleMode() {
  const mode = MODES[(MODES.indexOf(get().mode) + 1) % MODES.length];
  set({ mode });
  toast(MODE_LABEL[mode]);
}

export function removeAt(i: number) {
  const { queue, index } = get();
  const q = queue.filter((_, k) => k !== i);
  if (i === index) {
    audio.pause();
    audio.removeAttribute('src');
    loadedId = null;
    set({ queue: q, index: q.length ? Math.min(i, q.length - 1) : -1, playing: false, position: 0 });
    if (q.length) void load(Math.min(i, q.length - 1));
  } else {
    set({ queue: q, index: i < index ? index - 1 : index });
  }
}

export function clearQueue() {
  audio.pause();
  audio.removeAttribute('src');
  loadedId = null;
  history.length = 0;
  set({ queue: [], index: -1, playing: false, position: 0, duration: 0, lyric: null });
}

// ---- 系统媒体控制（锁屏、耳机按键） ----
function updateMediaSession(track: Track) {
  if (!('mediaSession' in navigator)) return;
  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.name,
    artist: track.artists.map((a) => a.name).join(' / '),
    album: track.album.name,
    artwork: track.album.cover ? [{ src: track.album.cover, sizes: '512x512' }] : [],
  });
}

if ('mediaSession' in navigator) {
  navigator.mediaSession.setActionHandler('play', toggle);
  navigator.mediaSession.setActionHandler('pause', toggle);
  navigator.mediaSession.setActionHandler('previoustrack', prev);
  navigator.mediaSession.setActionHandler('nexttrack', () => next());
  navigator.mediaSession.setActionHandler('seekto', (d) => d.seekTime != null && seek(d.seekTime * 1000));
}
