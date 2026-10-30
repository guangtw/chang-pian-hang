import type { Album, Artist, Playlist } from '../api';
import { artistNames, formatCount } from '../lib/format';
import { href } from '../lib/router';
import { Cover } from './Cover';

const no = (i: number) => `No.${String(i + 1).padStart(2, '0')}`;

export function PlaylistCard({ p, index }: { p: Playlist; index?: number }) {
  return (
    <a className="card" href={href.playlist(p.id)}>
      <Cover src={p.cover} alt={p.name} />
      <div className="card-no mono">
        {index != null ? no(index) : '歌单'}
        {p.playCount ? ` · ${formatCount(p.playCount)} 次播放` : ''}
      </div>
      <div className="card-title">{p.name}</div>
      {p.description && <div className="card-desc">{p.description}</div>}
    </a>
  );
}

export function AlbumCard({ a }: { a: Album }) {
  return (
    <a className="card" href={href.album(a.id)}>
      <Cover src={a.cover} alt={a.name} />
      <div className="card-no mono">
        {a.publishTime ? new Date(a.publishTime).getFullYear() : '专辑'} · {artistNames(a.artists)}
      </div>
      <div className="card-title">{a.name}</div>
    </a>
  );
}

export function ArtistCard({ a }: { a: Artist }) {
  return (
    <a className="card" href={href.artist(a.id)}>
      <Cover src={a.avatar} alt={a.name} className="round" />
      <div className="card-no mono">艺人{a.albumCount ? ` · ${a.albumCount} 张专辑` : ''}</div>
      <div className="card-title">{a.name}</div>
    </a>
  );
}
