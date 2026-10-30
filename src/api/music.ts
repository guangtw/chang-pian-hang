import { api } from '../config/site';
import { path, request } from './http';
import type {
  AlbumDetail,
  ArtistDetail,
  ArtistSearchItem,
  DiscoverData,
  PagedResult,
  Playlist,
  PlayQualityLevel,
  PlaySource,
  SearchAssist,
  ToplistItem,
  Track,
  TrackLyric,
  TrackQualityAvailability,
} from './types';

const p = api.paths;

export const music = {
  discoverHome: () => request<DiscoverData>(p.discoverHome),
  searchAssist: (q = '', signal?: AbortSignal) => request<SearchAssist>(p.searchAssist, { query: { q }, signal }),

  // BFF 的分页从 1 开始
  searchTracks: (q: string, page = 1) =>
    request<PagedResult<Track>>(p.searchTracks, { query: { q, page, pageSize: api.pageSize } }),
  searchArtists: (q: string, page = 1) =>
    request<PagedResult<ArtistSearchItem>>(p.searchArtists, { query: { q, page, pageSize: api.pageSize } }),
  searchPlaylists: (q: string, page = 1) =>
    request<PagedResult<Playlist>>(p.searchPlaylists, { query: { q, page, pageSize: api.pageSize } }),

  track: (id: string) => request<Track>(path(p.track, { id })),
  playUrl: (id: string, level: PlayQualityLevel, token?: string | null) =>
    request<PlaySource>(path(p.playUrl, { id }), { query: { level }, token }),
  lyric: (id: string) => request<TrackLyric>(path(p.lyric, { id })),
  qualityOptions: (id: string, token?: string | null) =>
    request<TrackQualityAvailability>(path(p.qualityOptions, { id }), { token }),

  playlist: (id: string) => request<Playlist>(path(p.playlist, { id })),
  toplists: () => request<ToplistItem[]>(p.toplists),
  toplist: (id: string) => request<Playlist>(path(p.toplist, { id })),
  album: (id: string) => request<AlbumDetail>(path(p.album, { id })),
  artist: (id: string) => request<ArtistDetail>(path(p.artist, { id })),
};
