import type { DiscoverItem } from '../api';
import { href } from './router';

export type DiscoverAction =
  | { kind: 'link'; to: string; heroKey: string }
  | { kind: 'external'; url: string }
  | { kind: 'play'; trackId: string }
  | { kind: 'none' };

/** 推荐条目点开后去哪，与原项目 discover-action.ts 的语义一致 */
export function resolveDiscover(item: DiscoverItem): DiscoverAction {
  if (item.linkUrl) return { kind: 'external', url: item.linkUrl };
  const id = item.targetId;
  if (!id || item.type === 'banner') return { kind: 'none' };
  switch (item.type) {
    case 'track':
    case 'scene':
      return { kind: 'play', trackId: id };
    case 'playlist':
      return { kind: 'link', to: href.playlist(id), heroKey: `playlist:${id}` };
    case 'toplist':
      return { kind: 'link', to: href.toplist(id), heroKey: `toplist:${id}` };
    case 'album':
      return { kind: 'link', to: href.album(id), heroKey: `album:${id}` };
    case 'artist':
      return { kind: 'link', to: href.artist(id), heroKey: `artist:${id}` };
    default:
      return { kind: 'none' };
  }
}
