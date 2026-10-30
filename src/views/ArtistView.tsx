import { api } from '../api';
import { AlbumCard } from '../components/Cards';
import { Cover } from '../components/Cover';
import { Icon } from '../components/Icon';
import { ErrorState, Loading } from '../components/States';
import { TrackList } from '../components/TrackList';
import { useAsync } from '../lib/useAsync';
import { playList } from '../player/player';
import { useState } from 'react';

export function ArtistView({ id }: { id: string }) {
  const { data: a, error, loading, reload } = useAsync(() => api().getArtist(id), [id]);
  const [bioOpen, setBioOpen] = useState(false);

  return (
    <div className="page">
      {loading && <Loading />}
      {error && <ErrorState error={error} onRetry={reload} />}
      {a && (
        <>
          <header className="detail-head artist-head">
            <Cover src={a.avatar} alt={a.name} size={600} />
            <div>
              <div className="kicker">艺人档案</div>
              <h1>{a.name}</h1>
              {a.description && (
                <>
                  <p className={`desc ${bioOpen ? '' : 'clamped'}`}>{a.description}</p>
                  {a.description.length > 120 && (
                    <button className="desc-toggle" onClick={() => setBioOpen(!bioOpen)}>
                      {bioOpen ? '收起' : '展开全文'}
                    </button>
                  )}
                </>
              )}
              <div className="meta-row mono">
                {a.albumCount != null && <span>{a.albumCount} 张专辑</span>}
                {a.trackCount != null && <span>{a.trackCount} 首歌</span>}
              </div>
              <div className="actions">
                <button className="btn solid" onClick={() => playList(a.hotTracks)}>
                  <Icon name="play" /> 播放代表作
                </button>
              </div>
            </div>
          </header>

          {!!a.hotTracks.length && (
            <section className="section" style={{ marginTop: 40 }}>
              <div className="section-head">
                <span className="kicker">01</span>
                <h2>代表作</h2>
              </div>
              <TrackList tracks={a.hotTracks} />
            </section>
          )}

          {!!a.albums.length && (
            <section className="section">
              <div className="section-head">
                <span className="kicker">02</span>
                <h2>唱片目录</h2>
              </div>
              <div className="grid-4">
                {a.albums.map((al) => (
                  <AlbumCard key={al.id} a={al} />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
}
