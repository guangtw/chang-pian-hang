import { api, type ID, type Track, type UserProfile } from '../api';
import { updateSettings } from './settings';
import { createStore } from './store';
import { toast } from './toast';

interface SessionState {
  user: UserProfile | null;
  checked: boolean;
  liked: Set<string>;
}

export const sessionStore = createStore<SessionState>({ user: null, checked: false, liked: new Set() });

/** 拉取登录状态和喜欢列表；切换后端地址后也要调用一次 */
export async function refreshSession() {
  try {
    const user = await api().getCurrentUser();
    const ids = user ? await api().getLikedIds(user.id) : [];
    sessionStore.set({ user, checked: true, liked: new Set(ids.map(String)) });
  } catch {
    sessionStore.set({ user: null, checked: true, liked: new Set() });
  }
}

export async function completeLogin(cookie?: string) {
  if (cookie) updateSettings({ cookie });
  await refreshSession();
  const user = sessionStore.get().user;
  if (user) toast(`欢迎回来，${user.nickname}。`);
}

export async function logout() {
  await api().logout();
  updateSettings({ cookie: '' });
  sessionStore.set({ user: null, liked: new Set() });
}

export function isLiked(id: ID) {
  return sessionStore.get().liked.has(String(id));
}

export async function toggleLike(track: Track) {
  const { user, liked } = sessionStore.get();
  if (!user) return toast('登录后才能收藏。');
  const key = String(track.id);
  const was = liked.has(key);
  const nextSet = new Set(liked);
  if (was) nextSet.delete(key);
  else nextSet.add(key);
  sessionStore.set({ liked: nextSet });
  try {
    await api().setLiked(track.id, !was);
    toast(was ? '已从收藏中移除。' : `已收藏《${track.name}》。`);
  } catch (e) {
    sessionStore.set({ liked });
    toast((e as Error).message || '收藏失败。');
  }
}
