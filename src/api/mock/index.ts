import { parseLyric } from '../../lib/lrc';
import { readJSON, writeJSON } from '../../lib/storage';
import { PAGE_SIZE, type MusicProvider } from '../provider';
import type { ID, SearchResult } from '../types';
import { albums, artists, makeCover, makeLrc, playlists, toplists, trackById, tracks } from './data';
import { synthesize } from './synth';

const LIKES_KEY = 'cph.mock.likes';
const LOGIN_KEY = 'cph.mock.login';

const wait = (ms = 180) => new Promise((r) => setTimeout(r, ms));

function notFound(what: string): never {
  throw new Error(`没有找到这个${what}`);
}

function paginate<T>(items: T[], page = 0): SearchResult<T> {
  return { items: items.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE), total: items.length };
}

const match = (kw: string, ...fields: (string | undefined)[]) =>
  fields.some((f) => f?.toLowerCase().includes(kw.toLowerCase()));

const byIds = (ids: ID[]) => ids.map((id) => trackById.get(String(id))).filter((t) => !!t);

const qrPolls = new Map<string, number>();

export const mockProvider: MusicProvider = {
  name: '示例数据',

  async getHomeFeed() {
    await wait();
    const loggedIn = readJSON(LOGIN_KEY, false);
    return {
      playlists: playlists.slice(0, 8),
      newAlbums: albums.slice(0, 6),
      toplists,
      dailyTracks: loggedIn ? byIds(['t3-2', 't1-4', 't2-1', 't6-3', 't8-3', 't5-2', 't4-1', 't7-3']) : undefined,
    };
  },
  async getRecommendPlaylists(limit = 12) {
    await wait();
    return playlists.slice(0, limit);
  },
  async getToplists() {
    await wait();
    return toplists;
  },
  async getNewAlbums(limit = 10) {
    await wait();
    return albums.slice(0, limit);
  },
  async getDailyTracks() {
    return (await this.getHomeFeed()).dailyTracks ?? [];
  },

  async getPlaylist(id) {
    await wait();
    const p = [...playlists, ...toplists].find((x) => String(x.id) === String(id)) ?? notFound('歌单');
    return { ...p, tracks: byIds(p.trackIds) };
  },
  async getAlbum(id) {
    await wait();
    const a = albums.find((x) => x.id === id) ?? notFound('专辑');
    return { ...a, tracks: tracks.filter((t) => t.album.id === id) };
  },
  async getArtist(id) {
    await wait();
    const a = artists.find((x) => x.id === id) ?? notFound('艺人');
    const own = albums.filter((al) => al.artists.some((r) => r.id === id));
    const hot = tracks.filter((t) => t.artists.some((r) => r.id === id));
    return { ...a, albumCount: own.length, trackCount: hot.length, hotTracks: hot.slice(0, 10), albums: own };
  },
  async getTracks(ids) {
    await wait(60);
    return byIds(ids);
  },

  async getSongSource(id) {
    const t = trackById.get(String(id)) ?? notFound('歌曲');
    return { id, url: synthesize(String(id), t.duration), bitrate: 352_000 };
  },
  async getLyric(id) {
    await wait(60);
    const t = trackById.get(String(id));
    return t ? parseLyric(makeLrc(String(id), t.duration)) : { lines: [] };
  },

  async searchTracks(kw, page) {
    await wait();
    return paginate(tracks.filter((t) => match(kw, t.name, t.album.name, ...t.artists.map((a) => a.name))), page);
  },
  async searchAlbums(kw, page) {
    await wait();
    return paginate(albums.filter((a) => match(kw, a.name, ...a.artists.map((r) => r.name))), page);
  },
  async searchArtists(kw, page) {
    await wait();
    return paginate(artists.filter((a) => match(kw, a.name)), page);
  },
  async searchPlaylists(kw, page) {
    await wait();
    return paginate(playlists.filter((p) => match(kw, p.name, p.description, ...(p.tags ?? []))), page);
  },
  async getHotKeywords() {
    await wait(60);
    return [
      { word: '潮汐表', hint: '林间信号新专辑' },
      { word: '凌晨两点' },
      { word: '周末有雨' },
      { word: '雨天' },
      { word: '北岸' },
      { word: '经纬度' },
    ];
  },

  async createQrLogin() {
    await wait();
    const key = 'mock-' + Date.now();
    qrPolls.set(key, 0);
    return { key, image: makeCover(key, '扫码'), qrUrl: 'mock://login' };
  },
  async checkQrLogin(key) {
    const n = (qrPolls.get(key) ?? 0) + 1;
    qrPolls.set(key, n);
    if (n < 2) return { state: 'waiting' };
    if (n < 3) return { state: 'scanned', nickname: '示例读者' };
    writeJSON(LOGIN_KEY, true);
    return { state: 'confirmed', cookie: 'MUSIC_U=mock' };
  },
  async getCurrentUser() {
    await wait(60);
    return readJSON(LOGIN_KEY, false)
      ? { id: 'u1', nickname: '示例读者', avatar: makeCover('me', '读'), signature: '只在雨天听唱片' }
      : null;
  },
  async logout() {
    writeJSON(LOGIN_KEY, false);
  },
  async getUserPlaylists() {
    await wait();
    return playlists.slice(2, 6);
  },
  async getLikedIds() {
    return readJSON<ID[]>(LIKES_KEY, []);
  },
  async setLiked(id, liked) {
    const set = new Set(readJSON<ID[]>(LIKES_KEY, []).map(String));
    if (liked) set.add(String(id));
    else set.delete(String(id));
    writeJSON(LIKES_KEY, [...set]);
  },
};
