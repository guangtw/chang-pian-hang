import { api } from '../api';
import { AlbumCard, PlaylistCard } from '../components/Cards';
import { Cover } from '../components/Cover';
import { Icon } from '../components/Icon';
import { ErrorState, Loading } from '../components/States';
import { artistNames, formatCount, formatTime, issueDate, issueNumber } from '../lib/format';
import { href } from '../lib/router';
import { useAsync } from '../lib/useAsync';
import { playList } from '../player/player';

function SectionHead({ no, title, more }: { no: string; title: string; more?: { to: string; label: string } }) {
  return (
    <div className="section-head">
      <span className="kicker">{no}</span>
      <h2>{title}</h2>
      {more && (
        <a className="more" href={more.to}>
          {more.label} →
        </a>
      )}
    </div>
  );
}

export function Home() {
  const { data, error, loading, reload } = useAsync(() => api().getHomeFeed(), []);

  const playFeature = async (id: string | number) => {
    const p = await api().getPlaylist(id);
    playList(p.tracks);
  };

  let n = 0;
  const no = () => String(++n).padStart(2, '0');

  return (
    <div className="page">
      <div className="issue-bar mono">
        <span>第 {issueNumber()} 期</span>
        <span className="hide-sm">{issueDate()}</span>
        <span>每周五出刊</span>
      </div>

      {loading && <Loading rows={8} />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {data && (
        <>
          {data.playlists[0] && (
            <article className="feature">
              <a href={href.playlist(data.playlists[0].id)}>
                <Cover src={data.playlists[0].cover} alt={data.playlists[0].name} size={800} />
              </a>
              <div>
                <div className="kicker">封面故事</div>
                <h1 className="feature-title">{data.playlists[0].name}</h1>
                <p className="dropcap">
                  {data.playlists[0].description || '编辑部本周最常放的一张歌单，从第一首开始听，别跳。'}
                </p>
                <div className="feature-meta mono">
                  {data.playlists[0].trackCount != null && <span>{data.playlists[0].trackCount} 首</span>}
                  {!!data.playlists[0].playCount && <span>{formatCount(data.playlists[0].playCount)} 次播放</span>}
                  {data.playlists[0].creator && <span>编 / {data.playlists[0].creator.name}</span>}
                </div>
                <div className="actions">
                  <button className="btn solid" onClick={() => playFeature(data.playlists[0].id)}>
                    <Icon name="play" /> 从头播放
                  </button>
                  <a className="btn ghost" href={href.playlist(data.playlists[0].id)}>
                    翻开歌单 <Icon name="arrow" />
                  </a>
                </div>
              </div>
            </article>
          )}

          {!!data.dailyTracks?.length && (
            <section className="section">
              <SectionHead no={no()} title="今日推荐" />
              <div className="daily">
                {data.dailyTracks.slice(0, 10).map((t, i) => (
                  <div key={t.id} className="daily-row" onClick={() => playList(data.dailyTracks!, i)}>
                    <span className="n">{String(i + 1).padStart(2, '0')}</span>
                    <span style={{ minWidth: 0 }}>
                      <div className="t">{t.name}</div>
                      <div className="faint" style={{ fontSize: 13 }}>
                        {artistNames(t.artists)}
                      </div>
                    </span>
                    <span className="mono faint">{formatTime(t.duration)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="section">
            <SectionHead no={no()} title="编辑精选" />
            <div className="grid-4">
              {data.playlists.slice(1, 9).map((p, i) => (
                <PlaylistCard key={p.id} p={p} index={i} />
              ))}
            </div>
          </section>

          {!!data.newAlbums.length && (
            <section className="section">
              <SectionHead no={no()} title="新碟上架" />
              <div className="shelf">
                {data.newAlbums.map((a) => (
                  <AlbumCard key={a.id} a={a} />
                ))}
              </div>
            </section>
          )}

          {!!data.toplists.length && (
            <section className="section">
              <SectionHead no={no()} title="排行榜" />
              <div className="charts">
                {data.toplists.slice(0, 4).map((t, i) => (
                  <a key={t.id} className="chart" href={href.playlist(t.id)}>
                    <div className="mono faint">榜 {String(i + 1).padStart(2, '0')}</div>
                    <h3>{t.name}</h3>
                    <div className="muted" style={{ fontSize: 13 }}>
                      {t.updateFrequency ?? '定期更新'}
                    </div>
                  </a>
                ))}
              </div>
            </section>
          )}

          <footer className="colophon mono">
            <span>唱片行 · 第 {issueNumber()} 期</span>
            <span>数据来源：{api().name}</span>
          </footer>
        </>
      )}
    </div>
  );
}
