import { Fragment, useState } from 'react';
import { api, type Track } from '../api';
import { Cover } from '../components/Cover';
import { Icon } from '../components/Icon';
import { ErrorState, Loading } from '../components/States';
import { TrackList } from '../components/TrackList';
import { formatCount, formatDate, formatTime } from '../lib/format';
import { href } from '../lib/router';
import { useAsync } from '../lib/useAsync';
import { playList } from '../player/player';

function totalTime(tracks: Track[]) {
  const ms = tracks.reduce((s, t) => s + t.duration, 0);
  const min = Math.round(ms / 60000);
  return min >= 60 ? `${Math.floor(min / 60)} 小时 ${min % 60} 分` : formatTime(ms);
}

function Description({ text }: { text?: string }) {
  const [open, setOpen] = useState(false);
  if (!text) return null;
  const long = text.length > 120;
  return (
    <>
      <p className={`desc ${long && !open ? 'clamped' : ''}`}>{text}</p>
      {long && (
        <button className="desc-toggle" onClick={() => setOpen(!open)}>
          {open ? '收起' : '展开全文'}
        </button>
      )}
    </>
  );
}

function Shuffle({ tracks }: { tracks: Track[] }) {
  return (
    <button
      className="btn"
      onClick={() => {
        const order = [...tracks].sort(() => Math.random() - 0.5);
        playList(order);
      }}
    >
      <Icon name="shuffle" /> 随机播放
    </button>
  );
}

export function PlaylistView({ id }: { id: string }) {
  const { data: p, error, loading, reload } = useAsync(() => api().getPlaylist(id), [id]);
  return (
    <div className="page">
      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {p && (
        <>
          <header className="detail-head">
            <Cover src={p.cover} alt={p.name} size={600} />
            <div>
              <div className="kicker">歌单{p.tags?.length ? ` · ${p.tags.join(' / ')}` : ''}</div>
              <h1>{p.name}</h1>
              {p.creator && <div className="byline">编 / {p.creator.name}</div>}
              <Description text={p.description} />
              <div className="meta-row mono">
                <span>{p.tracks.length} 首</span>
                <span>{totalTime(p.tracks)}</span>
                {!!p.playCount && <span>{formatCount(p.playCount)} 次播放</span>}
              </div>
              <div className="actions">
                <button className="btn solid" onClick={() => playList(p.tracks)}>
                  <Icon name="play" /> 播放全部
                </button>
                <Shuffle tracks={p.tracks} />
              </div>
            </div>
          </header>
          <TrackList tracks={p.tracks} />
        </>
      )}
    </div>
  );
}

export function AlbumView({ id }: { id: string }) {
  const { data: a, error, loading, reload } = useAsync(() => api().getAlbum(id), [id]);
  return (
    <div className="page">
      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {a && (
        <>
          <header className="detail-head">
            <Cover src={a.cover} alt={a.name} size={600} />
            <div>
              <div className="kicker">
                专辑{a.publishTime ? ` · ${formatDate(a.publishTime)}` : ''}
                {a.company ? ` · ${a.company}` : ''}
              </div>
              <h1>{a.name}</h1>
              <div className="byline">
                {a.artists.map((r, i) => (
                  <Fragment key={`${r.id}-${i}`}>
                    {i > 0 && ' / '}
                    <a href={href.artist(r.id)}>{r.name}</a>
                  </Fragment>
                ))}
              </div>
              <Description text={a.description} />
              <div className="meta-row mono">
                <span>{a.tracks.length} 首</span>
                <span>{totalTime(a.tracks)}</span>
              </div>
              <div className="actions">
                <button className="btn solid" onClick={() => playList(a.tracks)}>
                  <Icon name="play" /> 放上唱机
                </button>
                <Shuffle tracks={a.tracks} />
              </div>
            </div>
          </header>
          <TrackList tracks={a.tracks} sides showAlbum={false} />
        </>
      )}
    </div>
  );
}
