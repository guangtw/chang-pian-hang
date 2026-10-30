import { Fragment } from 'react';
import { music, type Track } from '../api';
import { DetailHeader } from '../components/DetailHeader';
import { Icon } from '../components/Icon';
import { ErrorState, Loading } from '../components/States';
import { TrackList } from '../components/TrackList';
import { formatDate, formatTime } from '../lib/format';
import { getPreview } from '../lib/motion';
import { href } from '../lib/router';
import { useAsync } from '../lib/useAsync';
import { playList } from '../player/player';

function totalTime(tracks: Track[]) {
  const ms = tracks.reduce((s, t) => s + t.durationMs, 0);
  const min = Math.round(ms / 60000);
  return min >= 60 ? `${Math.floor(min / 60)} 小时 ${min % 60} 分` : formatTime(ms);
}

export function PlayActions({ tracks }: { tracks: Track[] }) {
  return (
    <>
      <button className="btn solid" onClick={() => playList(tracks)} disabled={!tracks.length}>
        <Icon name="play" /> 放上唱机
      </button>
      <button className="btn" onClick={() => playList([...tracks].sort(() => Math.random() - 0.5))} disabled={!tracks.length}>
        <Icon name="shuffle" /> 随机
      </button>
    </>
  );
}

/** 歌单和榜单结构一样，只是取数接口不同 */
export function PlaylistView({ id, source }: { id: string; source: 'playlist' | 'toplist' }) {
  const heroKey = `${source}:${id}`;
  const { data: p, error, loading, reload } = useAsync(() => (source === 'toplist' ? music.toplist(id) : music.playlist(id)), [id, source]);
  const preview = getPreview(heroKey);
  const kind = source === 'toplist' ? '榜单' : '歌单';

  return (
    <div className="page">
      {loading && preview && <DetailHeader heroKey={heroKey} kind={kind} title={preview.title} coverUrl={preview.coverUrl} pending />}
      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {p && (
        <>
          <DetailHeader
            heroKey={heroKey}
            kind={kind}
            title={p.name}
            coverUrl={p.coverUrl ?? preview?.coverUrl}
            description={p.description}
            meta={[`${p.tracks.length} 首`, p.tracks.length > 0 && totalTime(p.tracks)]}
            actions={<PlayActions tracks={p.tracks} />}
          />
          <TrackList tracks={p.tracks} />
        </>
      )}
    </div>
  );
}

export function AlbumView({ id }: { id: string }) {
  const heroKey = `album:${id}`;
  const { data: a, error, loading, reload } = useAsync(() => music.album(id), [id]);
  const preview = getPreview(heroKey);
  return (
    <div className="page">
      {loading && preview && <DetailHeader heroKey={heroKey} kind="专辑" title={preview.title} coverUrl={preview.coverUrl} pending />}
      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {a && (
        <>
          <DetailHeader
            heroKey={heroKey}
            kind={`专辑${a.publishTime ? ` · ${formatDate(a.publishTime)}` : ''}`}
            title={a.name}
            coverUrl={a.coverUrl ?? preview?.coverUrl}
            byline={a.artists.map((r, i) => (
              <Fragment key={`${r.id}-${i}`}>
                {i > 0 && ' / '}
                {r.id ? <a href={href.artist(r.id)}>{r.name}</a> : r.name}
              </Fragment>
            ))}
            description={a.description}
            meta={[`${a.tracks.length} 首`, a.tracks.length > 0 && totalTime(a.tracks)]}
            actions={<PlayActions tracks={a.tracks} />}
          />
          <TrackList tracks={a.tracks} sides showAlbum={false} />
        </>
      )}
    </div>
  );
}

export function ArtistView({ id }: { id: string }) {
  const heroKey = `artist:${id}`;
  const { data: a, error, loading, reload } = useAsync(() => music.artist(id), [id]);
  const preview = getPreview(heroKey);
  return (
    <div className="page">
      {loading && preview && <DetailHeader heroKey={heroKey} kind="艺人" title={preview.title} coverUrl={preview.coverUrl} round pending />}
      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {a && (
        <>
          <DetailHeader
            heroKey={heroKey}
            kind="艺人"
            title={a.name}
            coverUrl={a.coverUrl ?? preview?.coverUrl}
            description={a.briefDesc}
            meta={[`热门 ${a.topTracks.length} 首`]}
            actions={<PlayActions tracks={a.topTracks} />}
            round
          />
          <TrackList tracks={a.topTracks} />
        </>
      )}
    </div>
  );
}
