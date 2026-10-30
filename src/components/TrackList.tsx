import { Fragment } from 'react';
import type { Track } from '../api';
import { formatTime, sideLabel } from '../lib/format';
import { href } from '../lib/router';
import { sessionStore, toggleLike } from '../lib/session';
import { useStore } from '../lib/store';
import { addNext, currentTrack, playerStore, playList, toggle } from '../player/player';
import { Icon } from './Icon';

interface Props {
  tracks: Track[];
  /** 专辑按 A/B 面编号，歌单按 01、02 编号 */
  sides?: boolean;
  showAlbum?: boolean;
}

export function TrackList({ tracks, sides = false, showAlbum = true }: Props) {
  const current = useStore(playerStore, (s) => currentTrack(s)?.id);
  const playing = useStore(playerStore, (s) => s.playing);
  const liked = useStore(sessionStore, (s) => s.liked);
  const half = Math.ceil(tracks.length / 2);

  const onRow = (i: number) => {
    const t = tracks[i];
    if (t.playable === false) return;
    if (t.id === current) toggle();
    else playList(tracks, i);
  };

  return (
    <div className={`tracks ${showAlbum ? '' : 'no-album'}`} role="list">
      <div className="tracks-head mono" aria-hidden="true">
        <span>{sides ? '面' : '序'}</span>
        <span>曲名</span>
        <span className="col-artist">艺人</span>
        {showAlbum && <span className="col-album">专辑</span>}
        <span />
        <span style={{ textAlign: 'right' }}>时长</span>
      </div>
      {tracks.map((t, i) => {
        const isCur = t.id === current;
        const disabled = t.playable === false;
        return (
          <Fragment key={`${t.id}-${i}`}>
            {sides && tracks.length > 3 && (i === 0 || i === half) && (
              <div className="side-divider">{i === 0 ? 'A 面' : 'B 面'}</div>
            )}
            <div
              role="listitem"
              className={`track ${isCur ? 'current' : ''} ${disabled ? 'disabled' : ''}`}
              onClick={() => onRow(i)}
              title={disabled ? '暂时无法播放' : undefined}
            >
              <span className="no">
                {isCur ? (
                  <span className={`eq ${playing ? '' : 'paused'}`} aria-label="正在播放">
                    <i />
                    <i />
                    <i />
                  </span>
                ) : (
                  <>
                    <span className="label">{sides ? sideLabel(i, tracks.length) : String(i + 1).padStart(2, '0')}</span>
                    {!disabled && (
                      <span className="play-hint">
                        <Icon name="play" />
                      </span>
                    )}
                  </>
                )}
              </span>
              <span className="name">
                <span className="t">{t.name}</span>
                {t.alias && <span className="alias">{t.alias}</span>}
              </span>
              <span className="cell col-artist">
                {t.artists.map((a, k) => (
                  <Fragment key={`${a.id}-${k}`}>
                    {k > 0 && ' / '}
                    <a href={href.artist(a.id)} onClick={(e) => e.stopPropagation()}>
                      {a.name}
                    </a>
                  </Fragment>
                ))}
              </span>
              {showAlbum && (
                <span className="cell col-album">
                  <a href={href.album(t.album.id)} onClick={(e) => e.stopPropagation()}>
                    {t.album.name}
                  </a>
                </span>
              )}
              <span className="row-actions">
                <button
                  className={`icon-btn ${liked.has(String(t.id)) ? 'on' : ''}`}
                  aria-label={liked.has(String(t.id)) ? '取消收藏' : '收藏'}
                  onClick={(e) => {
                    e.stopPropagation();
                    void toggleLike(t);
                  }}
                >
                  <Icon name={liked.has(String(t.id)) ? 'heartFill' : 'heart'} />
                </button>
              </span>
              <span className="dur">
                {!disabled && (
                  <button
                    className="icon-btn add"
                    aria-label="下一首播放"
                    title="下一首播放"
                    onClick={(e) => {
                      e.stopPropagation();
                      addNext(t);
                    }}
                    style={{ verticalAlign: 'middle', marginRight: 2 }}
                  >
                    <Icon name="plus" />
                  </button>
                )}
                <span className="hide-on-hover">{formatTime(t.duration)}</span>
              </span>
            </div>
          </Fragment>
        );
      })}
    </div>
  );
}
