// 与 miningqwqmusic BFF（src/types/music.ts、src/types/account.ts）保持一致的数据结构。
// BFF 改了字段，就改这里。

export type Artist = { id: string; name: string; coverUrl?: string };
export type Album = { id: string; name: string; coverUrl?: string };

export type Track = {
  id: string;
  name: string;
  artists: Artist[];
  album?: Album;
  durationMs: number;
  coverUrl?: string;
};

export type Playlist = {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  tracks: Track[];
};

export type PlayQualityLevel =
  | 'standard'
  | 'higher'
  | 'exhigh'
  | 'lossless'
  | 'hires'
  | 'jyeffect'
  | 'sky'
  | 'dolby'
  | 'jymaster';

export type PlaySource = {
  trackId: string;
  url: string;
  preview: boolean;
  level?: PlayQualityLevel;
  bitrate?: number;
  restrictionReason?: string;
  expiresAt?: string;
  ttlSeconds?: number;
};

export type LyricLine = { timeMs: number; text: string };

export type TrackLyric = {
  trackId: string;
  lines: LyricLine[];
  raw?: string;
  translatedLines?: LyricLine[];
};

export type PagedResult<T> = { items: T[]; page: number; pageSize: number; total: number };

export type DiscoverItemType = 'track' | 'playlist' | 'album' | 'artist' | 'toplist' | 'banner' | 'scene';

export type DiscoverItem = {
  id: string;
  title: string;
  subtitle?: string;
  coverUrl?: string;
  type: DiscoverItemType;
  targetId?: string;
  linkUrl?: string;
};

export type DiscoverBlock = { id: string; title: string; items: DiscoverItem[] };

export type SearchAssist = { defaultKeyword?: string; hotKeywords: string[]; suggestions: string[] };

export type DiscoverData = { blocks: DiscoverBlock[]; searchAssist: SearchAssist };

export type ToplistItem = {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  updateFrequency?: string;
  tracksPreview: Track[];
};

export type AlbumDetail = {
  id: string;
  name: string;
  description?: string;
  coverUrl?: string;
  publishTime?: number;
  artists: Artist[];
  tracks: Track[];
};

export type ArtistDetail = {
  id: string;
  name: string;
  coverUrl?: string;
  briefDesc?: string;
  topTracks: Track[];
};

export type ArtistSearchItem = { id: string; name: string; coverUrl?: string; musicSize?: number; albumSize?: number };

export type TrackQualityAvailability = {
  trackId: string;
  availableLevels: PlayQualityLevel[];
  fallbackMap: Partial<Record<PlayQualityLevel, PlayQualityLevel>>;
};

// ---- 账户 ----

export type AccountUser = {
  id: string;
  email: string;
  nickname?: string | null;
  avatarUrl?: string | null;
  avatarFallbackText?: string;
  avatarFallbackBg?: string;
};

export type AuthTokenData = { accessToken: string; user?: AccountUser };
export type AuthPayload = AuthTokenData & { user: AccountUser };

export type LibrarySnapshot = {
  revision: number;
  favorites: Record<string, Track>;
  recent: Track[];
  updatedAt: string;
};

export type LibraryRevisionResult = { revision: number; updatedAt: string };

// ---- 统一响应外壳 ----

export type ApiSuccess<T> = { code: 0; data: T; message: string; traceId: string };
export type ApiFailure = { code: number; message: string; traceId: string; retryable: boolean };

/** 曲目封面：优先曲目自己的，其次专辑 */
export const coverOf = (t: Track) => t.coverUrl ?? t.album?.coverUrl;
