import { Fragment, useEffect, useRef } from 'react';
import { activeLineIndex } from '../lib/lrc';
import { href } from '../lib/router';
import { useStore } from '../lib/store';
import { currentTrack, playerStore, seek } from '../player/player';
import { uiStore } from '../player/ui';
import { Cover } from './Cover';
import { Icon } from './Icon';

export function NowPlaying() {
  const open = useStore(uiStore, (s) => s.nowPlaying);
  const track = useStore(playerStore, (s) => currentTrack(s));
  const index = useStore(playerStore, (s) => s.index);
  const total = useStore(playerStore, (s) => s.queue.length);
  const playing = useStore(playerStore, (s) => s.playing);
  const lyric = useStore(playerStore, (s) => s.lyric);
  const position = useStore(playerStore, (s) => s.position);
  const listRef = useRef<HTMLDivElement>(null);
  const userScrolledAt = useRef(0);

  const lines = lyric?.lines ?? [];
  const active = lyric?.unsynced ? -1 : activeLineIndex(lines, position + 250);

  // 当前行滚到中间；用户刚手动滚过的话先不抢
  useEffect(() => {
    if (!open || active < 0 || Date.now() - userScrolledAt.current < 3000) return;
    const box = listRef.current;
    const el = box?.children[active] as HTMLElement | undefined;
    if (box && el) box.scrollTo({ top: el.offsetTop - box.clientHeight / 2 + el.clientHeight / 2, behavior: 'smooth' });
  }, [active, open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && uiStore.set({ nowPlaying: false });
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    if (!track) uiStore.set({ nowPlaying: false });
  }, [track]);

  return (
    <section className={`nowplaying ${open ? 'open' : ''}`} aria-label="正在播放" aria-hidden={!open}>
      <div className="nowplaying-bar">
        <span className="mono">
          正在播放 · 第 {String(index + 1).padStart(2, '0')} 首 / 共 {total} 首
        </span>
        <button className="btn ghost" onClick={() => uiStore.set({ nowPlaying: false })} tabIndex={open ? 0 : -1}>
          收起 <Icon name="down" />
        </button>
      </div>
      {track && (
        <div className="nowplaying-body">
          <div style={{ alignSelf: 'center' }}>
            <div className={`record ${playing ? 'spinning' : ''}`}>
              <div className="disc" />
              <Cover src={track.album.cover} alt={track.album.name} size={800} />
            </div>
            <div className="np-caption">
              <div className="kicker">{track.alias ?? '本曲'}</div>
              <h2>{track.name}</h2>
              <p>
                {track.artists.map((a, i) => (
                  <Fragment key={`${a.id}-${i}`}>
                    {i > 0 && ' / '}
                    <a href={href.artist(a.id)} onClick={() => uiStore.set({ nowPlaying: false })}>
                      {a.name}
                    </a>
                  </Fragment>
                ))}
                <span className="faint"> — </span>
                <a href={href.album(track.album.id)} onClick={() => uiStore.set({ nowPlaying: false })}>
                  《{track.album.name}》
                </a>
              </p>
            </div>
          </div>
          {lines.length ? (
            <div
              ref={listRef}
              className={`lyrics ${lyric?.unsynced ? 'unsynced' : ''}`}
              onWheel={() => (userScrolledAt.current = Date.now())}
              onTouchMove={() => (userScrolledAt.current = Date.now())}
            >
              {lines.map((l, i) => (
                <button
                  key={i}
                  className={`lyric-line ${i === active ? 'active' : ''}`}
                  onClick={() => {
                    if (lyric?.unsynced) return;
                    userScrolledAt.current = 0;
                    seek(l.time);
                  }}
                  tabIndex={open ? 0 : -1}
                >
                  {l.text}
                  {l.translation && <small>{l.translation}</small>}
                </button>
              ))}
            </div>
          ) : (
            <p className="lyrics-empty">{lyric ? '这首歌没有歌词，安静听吧。' : '正在找歌词…'}</p>
          )}
        </div>
      )}
    </section>
  );
}
