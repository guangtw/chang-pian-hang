import type {
  Album,
  AlbumDetail,
  Artist,
  ArtistDetail,
  HomeFeed,
  HotKeyword,
  ID,
  Lyric,
  Playlist,
  PlaylistDetail,
  QrLogin,
  QrStatus,
  Quality,
  SearchResult,
  SongSource,
  Toplist,
  Track,
  UserProfile,
} from './types';

/**
 * 前端需要的全部数据能力。接入自己的后端时，实现这个接口即可：
 * - 后端是网易云 API 风格 → 直接用 netease/ 下的实现，只需配置地址
 * - 后端是别的格式 → 仿照 netease/index.ts 写一个新的 provider
 */
export interface MusicProvider {
  readonly name: string;

  // 发现
  getHomeFeed(): Promise<HomeFeed>;
  getRecommendPlaylists(limit?: number): Promise<Playlist[]>;
  getToplists(): Promise<Toplist[]>;
  getNewAlbums(limit?: number): Promise<Album[]>;
  /** 需要登录 */
  getDailyTracks(): Promise<Track[]>;

  // 详情
  getPlaylist(id: ID): Promise<PlaylistDetail>;
  getAlbum(id: ID): Promise<AlbumDetail>;
  getArtist(id: ID): Promise<ArtistDetail>;
  getTracks(ids: ID[]): Promise<Track[]>;

  // 播放
  getSongSource(id: ID, quality: Quality): Promise<SongSource>;
  getLyric(id: ID): Promise<Lyric>;

  // 搜索
  searchTracks(keyword: string, page?: number): Promise<SearchResult<Track>>;
  searchAlbums(keyword: string, page?: number): Promise<SearchResult<Album>>;
  searchArtists(keyword: string, page?: number): Promise<SearchResult<Artist>>;
  searchPlaylists(keyword: string, page?: number): Promise<SearchResult<Playlist>>;
  getHotKeywords(): Promise<HotKeyword[]>;

  // 账户
  createQrLogin(): Promise<QrLogin>;
  checkQrLogin(key: string): Promise<QrStatus>;
  getCurrentUser(): Promise<UserProfile | null>;
  logout(): Promise<void>;
  getUserPlaylists(uid: ID): Promise<Playlist[]>;
  getLikedIds(uid: ID): Promise<ID[]>;
  setLiked(id: ID, liked: boolean): Promise<void>;
}

export const PAGE_SIZE = 30;
