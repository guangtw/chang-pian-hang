// 前端内部使用的领域模型。后端返回什么格式都先在 provider 里归一成这些类型，
// 视图层只认这里的字段。

export type ID = string | number;

export interface ArtistRef {
  id: ID;
  name: string;
}

export interface AlbumRef {
  id: ID;
  name: string;
  cover?: string;
}

export interface Track {
  id: ID;
  name: string;
  /** 别名 / 译名，例如「（电影《xx》插曲）」 */
  alias?: string;
  artists: ArtistRef[];
  album: AlbumRef;
  /** 毫秒 */
  duration: number;
  /** 后端标记为付费 / 无版权时为 false，播放时会跳过 */
  playable?: boolean;
}

export interface Playlist {
  id: ID;
  name: string;
  cover?: string;
  description?: string;
  creator?: { id: ID; name: string; avatar?: string };
  trackCount?: number;
  playCount?: number;
  tags?: string[];
  updatedAt?: number;
}

export interface PlaylistDetail extends Playlist {
  tracks: Track[];
}

export interface Album {
  id: ID;
  name: string;
  cover?: string;
  artists: ArtistRef[];
  publishTime?: number;
  company?: string;
  description?: string;
  trackCount?: number;
}

export interface AlbumDetail extends Album {
  tracks: Track[];
}

export interface Artist {
  id: ID;
  name: string;
  avatar?: string;
  description?: string;
  albumCount?: number;
  trackCount?: number;
}

export interface ArtistDetail extends Artist {
  hotTracks: Track[];
  albums: Album[];
}

export interface Toplist extends Playlist {
  updateFrequency?: string;
}

export interface SongSource {
  id: ID;
  /** null 表示无法播放（无版权、需要会员等） */
  url: string | null;
  /** 码率 bps */
  bitrate?: number;
  /** 试听片段，单位毫秒 */
  trial?: { start: number; end: number };
}

export interface LyricLine {
  /** 毫秒 */
  time: number;
  text: string;
  translation?: string;
}

export interface Lyric {
  lines: LyricLine[];
  /** 纯音乐 / 没有时间轴的歌词 */
  unsynced?: boolean;
}

export type SearchType = 'track' | 'album' | 'artist' | 'playlist';

export interface SearchResult<T> {
  items: T[];
  total: number;
}

export interface HotKeyword {
  word: string;
  hint?: string;
}

export interface UserProfile {
  id: ID;
  nickname: string;
  avatar?: string;
  signature?: string;
}

export type QrStatus =
  | { state: 'waiting' }
  | { state: 'scanned'; nickname?: string; avatar?: string }
  | { state: 'confirmed'; cookie?: string }
  | { state: 'expired' };

export interface QrLogin {
  key: string;
  /** 二维码图片（data URL），没有的话前端用 qrUrl 自行生成 */
  image?: string;
  qrUrl: string;
}

export type Quality = 'standard' | 'higher' | 'exhigh' | 'lossless' | 'hires';

export interface HomeFeed {
  /** 封面故事：取第一个推荐歌单 */
  playlists: Playlist[];
  newAlbums: Album[];
  toplists: Toplist[];
  /** 登录后才有 */
  dailyTracks?: Track[];
}
