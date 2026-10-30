import { parseLyric } from '../../lib/lrc';
import { PAGE_SIZE, type MusicProvider } from '../provider';
import type {
  Album,
  Artist,
  ArtistRef,
  ID,
  Playlist,
  QrStatus,
  Toplist,
  Track,
} from '../types';
import { request } from './client';

// ---- 归一化：网易云的新旧两种字段格式都兼容 ----

function toArtistRefs(list: any[] | undefined): ArtistRef[] {
  return (list ?? []).map((a) => ({ id: a.id, name: a.name ?? '未知艺人' }));
}

export function toTrack(s: any): Track {
  const al = s.al ?? s.album ?? {};
  const alias = (s.tns ?? s.transNames ?? s.alia ?? s.alias ?? [])[0];
  // fee 1/4 = 付费，privilege.st < 0 = 无版权
  const blocked = s.privilege?.st != null && s.privilege.st < 0;
  return {
    id: s.id,
    name: s.name,
    alias,
    artists: toArtistRefs(s.ar ?? s.artists),
    album: { id: al.id, name: al.name ?? '', cover: al.picUrl },
    duration: s.dt ?? s.duration ?? 0,
    playable: !blocked,
  };
}

export function toPlaylist(p: any): Playlist {
  return {
    id: p.id,
    name: p.name,
    cover: p.coverImgUrl ?? p.picUrl,
    description: p.description ?? p.copywriter ?? undefined,
    creator: p.creator ? { id: p.creator.userId, name: p.creator.nickname, avatar: p.creator.avatarUrl } : undefined,
    trackCount: p.trackCount,
    playCount: p.playCount ?? p.playcount,
    tags: p.tags,
    updatedAt: p.updateTime,
  };
}

export function toAlbum(a: any): Album {
  return {
    id: a.id,
    name: a.name,
    cover: a.picUrl ?? a.blurPicUrl,
    artists: toArtistRefs(a.artists?.length ? a.artists : a.artist ? [a.artist] : []),
    publishTime: a.publishTime,
    company: a.company,
    description: a.description,
    trackCount: a.size,
  };
}

export function toArtist(a: any): Artist {
  return {
    id: a.id,
    name: a.name,
    avatar: a.cover ?? a.picUrl ?? a.img1v1Url ?? a.avatar,
    description: a.briefDesc,
    albumCount: a.albumSize,
    trackCount: a.musicSize,
  };
}

const offset = (page = 0) => page * PAGE_SIZE;

async function search(keywords: string, type: number, page?: number) {
  const res = await request('cloudsearch', { keywords, type, limit: PAGE_SIZE, offset: offset(page) });
  return res.result ?? {};
}

// ---- 接口实现 ----

export const neteaseProvider: MusicProvider = {
  name: '网易云 API',

  async getHomeFeed() {
    const [playlists, newAlbums, toplists, dailyTracks] = await Promise.all([
      this.getRecommendPlaylists(12),
      this.getNewAlbums(10),
      this.getToplists(),
      // 未登录时这个接口会报错，首页照样展示其他栏目
      this.getDailyTracks().catch(() => undefined),
    ]);
    return { playlists, newAlbums, toplists: toplists.slice(0, 4), dailyTracks };
  },

  async getRecommendPlaylists(limit = 12) {
    const res = await request('personalized', { limit });
    return (res.result ?? []).map(toPlaylist);
  },

  async getToplists() {
    const res = await request('toplist');
    return (res.list ?? []).map((p: any): Toplist => ({ ...toPlaylist(p), updateFrequency: p.updateFrequency }));
  },

  async getNewAlbums(limit = 10) {
    const res = await request('album/newest');
    return (res.albums ?? []).slice(0, limit).map(toAlbum);
  },

  async getDailyTracks() {
    const res = await request('recommend/songs', {}, { fresh: true });
    return (res.data?.dailySongs ?? []).map(toTrack);
  },

  async getPlaylist(id) {
    const [detail, all] = await Promise.all([
      request('playlist/detail', { id }),
      // playlist/detail 只返回前若干首，完整曲目走 track/all
      request('playlist/track/all', { id, limit: 1000 }).catch(() => null),
    ]);
    const p = detail.playlist;
    return { ...toPlaylist(p), tracks: (all?.songs ?? p.tracks ?? []).map(toTrack) };
  },

  async getAlbum(id) {
    const res = await request('album', { id });
    return { ...toAlbum(res.album), tracks: (res.songs ?? []).map(toTrack) };
  },

  async getArtist(id) {
    const [info, albums] = await Promise.all([request('artists', { id }), request('artist/album', { id, limit: 24 })]);
    return {
      ...toArtist(info.artist),
      hotTracks: (info.hotSongs ?? []).map(toTrack),
      albums: (albums.hotAlbums ?? []).map(toAlbum),
    };
  },

  async getTracks(ids) {
    if (!ids.length) return [];
    const res = await request('song/detail', { ids: ids.join(',') });
    return (res.songs ?? []).map(toTrack);
  },

  async getSongSource(id, quality) {
    const res = await request('song/url/v1', { id, level: quality });
    const d = res.data?.[0] ?? {};
    return {
      id,
      url: d.url ?? null,
      bitrate: d.br,
      trial: d.freeTrialInfo ? { start: d.freeTrialInfo.start * 1000, end: d.freeTrialInfo.end * 1000 } : undefined,
    };
  },

  async getLyric(id) {
    const res = await request('lyric', { id });
    return parseLyric(res.lrc?.lyric, res.tlyric?.lyric);
  },

  async searchTracks(keyword, page) {
    const r = await search(keyword, 1, page);
    return { items: (r.songs ?? []).map(toTrack), total: r.songCount ?? 0 };
  },
  async searchAlbums(keyword, page) {
    const r = await search(keyword, 10, page);
    return { items: (r.albums ?? []).map(toAlbum), total: r.albumCount ?? 0 };
  },
  async searchArtists(keyword, page) {
    const r = await search(keyword, 100, page);
    return { items: (r.artists ?? []).map(toArtist), total: r.artistCount ?? 0 };
  },
  async searchPlaylists(keyword, page) {
    const r = await search(keyword, 1000, page);
    return { items: (r.playlists ?? []).map(toPlaylist), total: r.playlistCount ?? 0 };
  },

  async getHotKeywords() {
    const res = await request('search/hot/detail');
    return (res.data ?? []).map((d: any) => ({ word: d.searchWord, hint: d.content || undefined }));
  },

  async createQrLogin() {
    const keyRes = await request('login/qr/key', {}, { fresh: true });
    const key = keyRes.data.unikey;
    const qr = await request('login/qr/create', { key, qrimg: true }, { fresh: true });
    return { key, image: qr.data?.qrimg, qrUrl: qr.data?.qrurl };
  },

  async checkQrLogin(key): Promise<QrStatus> {
    const res = await request('login/qr/check', { key }, { fresh: true, rawCode: true });
    switch (res.code) {
      case 801:
        return { state: 'waiting' };
      case 802:
        return { state: 'scanned', nickname: res.nickname, avatar: res.avatarUrl };
      case 803:
        return { state: 'confirmed', cookie: res.cookie };
      default:
        return { state: 'expired' };
    }
  },

  async getCurrentUser() {
    const res = await request('login/status', {}, { fresh: true });
    const p = res.data?.profile ?? res.profile;
    return p ? { id: p.userId, nickname: p.nickname, avatar: p.avatarUrl, signature: p.signature } : null;
  },

  async logout() {
    await request('logout', {}, { fresh: true }).catch(() => undefined);
  },

  async getUserPlaylists(uid) {
    const res = await request('user/playlist', { uid, limit: 100 }, { fresh: true });
    return (res.playlist ?? []).map(toPlaylist);
  },

  async getLikedIds(uid): Promise<ID[]> {
    const res = await request('likelist', { uid }, { fresh: true });
    return res.ids ?? [];
  },

  async setLiked(id, liked) {
    await request('like', { id, like: liked }, { fresh: true });
  },
};
