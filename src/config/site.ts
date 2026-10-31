// 站点配置：文案、导航、首页版式、接口路径都在这里改，组件里不写死。
// 构建时可用 VITE_* 环境变量覆盖其中几项（见 .env.example）。
import type { DiscoverItemType, PlayQualityLevel } from '../api/types';

const env = import.meta.env;

export type BlockLayout = 'banner' | 'grid' | 'shelf' | 'chart' | 'list';

const brandBig = (env.VITE_BRAND_BIG as string) || 'Mining';
const brandSmall = (env.VITE_BRAND_SMALL as string) || '唱片行';

export const site = {
  /** 完整站名：标签页标题、读屏文字等用它 */
  name: (env.VITE_SITE_NAME as string) || `${brandBig}${brandSmall}`,
  /** 侧栏站标分两行：大字一行、小字一行 */
  brand: { big: brandBig, small: brandSmall },
  /** 刊头小字。{n} 会被替换为期号 */
  issueLabel: '第 {n} 期',
  /** 期号起算点：从这一刻起每满一周加一期。选的是周五零点（北京时间），和下面的「每周五出刊」对上 */
  issueEpoch: '2024-01-05T00:00:00+08:00',
  issueCadence: '每周五出刊',
  footerNote: '数据由站内 BFF 提供',
} as const;

export const api = {
  /** BFF 地址。留空 = 与前端同源（部署在同一域名下，或开发时走 Vite 代理） */
  base: ((env.VITE_API_BASE as string) || '').replace(/\/+$/, ''),
  pageSize: 30,
  /** 播放地址过期前提前多少秒续签 */
  playUrlRenewLeadSeconds: 20,
  /** 已登录时，多久从云端拉一次收藏/最近播放（毫秒） */
  libraryPullIntervalMs: 5 * 60_000,
  /** 本地最多保留多少条最近播放 */
  recentLimit: 100,
  paths: {
    discoverHome: '/api/music/discover/home',
    searchAssist: '/api/music/discover/search-assist',
    searchTracks: '/api/music/search',
    searchArtists: '/api/music/search/artists',
    searchPlaylists: '/api/music/search/playlists',
    track: '/api/music/track/:id',
    playUrl: '/api/music/track/:id/play-url',
    lyric: '/api/music/track/:id/lyric',
    qualityOptions: '/api/music/track/:id/quality-options',
    playlist: '/api/music/playlist/:id',
    toplists: '/api/music/toplist',
    toplist: '/api/music/toplist/:id',
    album: '/api/music/album/:id',
    artist: '/api/music/artist/:id',

    authLogin: '/api/account/auth/login',
    authRegister: '/api/account/auth/register',
    authRefresh: '/api/account/auth/refresh',
    authMe: '/api/account/auth/me',
    authLogout: '/api/account/auth/logout',
    librarySnapshot: '/api/account/library/snapshot',
    libraryFavorites: '/api/account/library/favorites',
    libraryFavorite: '/api/account/library/favorites/:id',
    libraryRecent: '/api/account/library/recent',
  },
  /**
   * BFF 返回英文错误时给用户看的中文说明（code 见 BFF 的 src/lib/errors.ts）。
   * 没列到的 code：后端给的是中文就原样显示，否则显示 fallback。
   */
  errorText: {
    1000: '出了点意外，稍后再试。',
    2003: '音乐服务有点忙，过一会儿再试。',
    2004: '音乐服务响应太慢了，稍后再试。',
    2005: '连不上音乐服务。',
    2006: '音乐服务返回了看不懂的内容。',
    2007: '音乐服务返回了看不懂的内容。',
    3001: '找不到这首歌。',
    3002: '这首歌暂时没有可用的音源。',
    3003: '找不到这张歌单。',
    3011: '暂时无法下载这首歌。',
    4001: '缺少搜索关键词。',
    5401: '账户服务未启用。',
  } as Record<number, string>,
  errorFallback: '请求失败，稍后再试。',
  /** 账户服务返回这些 code 表示服务未启用 / 会话失效 */
  codes: {
    accountDisabled: 5401,
    invalidSession: [5203, 5204],
  },
} as const;

export const nav: { key: string; label: string; to: string }[] = [
  { key: '', label: '本期', to: '#/' },
  { key: 'search', label: '搜索', to: '#/search' },
  { key: 'charts', label: '榜单', to: '#/charts' },
  { key: 'library', label: '唱片架', to: '#/library' },
  { key: 'settings', label: '设置', to: '#/settings' },
];

/**
 * 首页版式：后端返回的每个推荐区块按这里决定怎么排。
 * 先看区块 id 有没有指定，没有就按区块里大多数条目的类型来定。
 */
export const homeLayout = {
  byBlockId: {
    'discover-banner': 'banner',
    'discover-toplist': 'chart',
  } as Record<string, BlockLayout>,
  byItemType: {
    banner: 'banner',
    playlist: 'grid',
    album: 'shelf',
    artist: 'shelf',
    toplist: 'chart',
    track: 'list',
    scene: 'grid',
  } as Record<DiscoverItemType, BlockLayout>,
  /** 封面故事取哪个区块的第一项；找不到就用第一个 grid 区块 */
  featureBlockId: 'discover-personalized',
  /** 每种版式最多展示几项 */
  limits: { banner: 8, grid: 8, shelf: 12, chart: 8, list: 10 } as Record<BlockLayout, number>,
};

export const qualities: { key: PlayQualityLevel; label: string }[] = [
  { key: 'standard', label: '标准' },
  { key: 'higher', label: '较高' },
  { key: 'exhigh', label: '极高' },
  { key: 'lossless', label: '无损' },
  { key: 'hires', label: 'Hi-Res' },
];

export const defaultQuality: PlayQualityLevel = ((env.VITE_DEFAULT_QUALITY as PlayQualityLevel) || 'exhigh');

export const searchTabs = [
  { key: 'track', label: '单曲' },
  { key: 'artist', label: '艺人' },
  { key: 'playlist', label: '歌单' },
] as const;

/**
 * 榜单封面替换：上游的榜单封面是统一模板图，这里换成唱片行风格的生成封面。
 * palette 是 [底色, 强调色]，按榜单 id 固定选一组。
 */
export const covers = {
  replaceToplist: (env.VITE_REPLACE_TOPLIST_COVERS as string) !== 'off',
  palette: [
    ['#E8432E', '#FFD25A'],
    ['#1F5FD6', '#9BE3FF'],
    ['#0E8F63', '#D4F7A1'],
    ['#6D3FE0', '#F5B3FF'],
    ['#141414', '#FF5A1F'],
    ['#F2A516', '#141414'],
    ['#D0266F', '#FFE08A'],
    ['#0F6B66', '#FFB4A2'],
    ['#2E3A4F', '#FFB86B'],
    ['#E9E4D8', '#E8432E'],
    ['#9B1D20', '#F7C8B8'],
    ['#00A3C4', '#141414'],
  ] as [string, string][],
};

/** 图片缩略：网易云图片支持 ?param=WxH，后端换了图床可关掉 */
export const image = {
  resizeParam: (env.VITE_IMAGE_RESIZE as string) !== 'off',
};
