import { formatTime } from '../lib/format';
import { href } from '../lib/router';
import { sessionStore, toggleLike } from '../lib/session';
import { useStore } from '../lib/store';
import {
  currentTrack,
  cycleMode,
  MODE_LABEL,
  next,
  playerStore,
  prev,
  seek,
  setVolume,
  toggle,
  toggleMute,
} from '../player/player';
import { uiStore } from '../player/ui';
import { Cover } from './Cover';
import { Icon } from './Icon';
import { Slider } from './Slider';

export function PlayerBar() {
  const track = useStore(playerStore, (s) => currentTrack(s));
  const playing = useStore(playerStore, (s) => s.playing);
  const position = useStore(playerStore, (s) => s.position);
  const duration = useStore(playerStore, (s) => s.duration);
  const volume = useStore(playerStore, (s) => s.volume);
  const muted = useStore(playerStore, (s) => s.muted);
  const mode = useStore(playerStore, (s) => s.mode);
  const queueLen = useStore(playerStore, (s) => s.queue.length);
  const liked = useStore(sessionStore, (s) => (track ? s.liked.has(String(track.id)) : false));
  const npOpen = useStore(uiStore, (s) => s.nowPlaying);
  const qOpen = useStore(uiStore, (s) => s.queue);

  const openNp = () => track && uiStore.set({ nowPlaying: !npOpen, queue: false });

  return (
    <footer className="player" aria-label="播放控制">
      <div className="player-mini-progress" style={{ width: `${duration ? (position / duration) * 100 : 0}%` }} />
      <div className="np">
        {track ? (
          <>
            <button onClick={openNp} aria-label="打开正在播放" style={{ flex: 'none' }}>
              <Cover src={track.album.cover} alt={track.album.name} size={120} />
            </button>
            <div className="np-text" onClick={openNp}>
              <div className="np-title">{track.name}</div>
              <div className="np-artist">{track.artists.map((a) => a.name).join(' / ')}</div>
            </div>
            <button
              className={`icon-btn hide-sm ${liked ? 'on' : ''}`}
              aria-label={liked ? '取消收藏' : '收藏'}
              onClick={() => toggleLike(track)}
            >
              <Icon name={liked ? 'heartFill' : 'heart'} />
            </button>
          </>
        ) : (
          <div className="np-text">
            <div className="np-title faint">唱机空着</div>
            <div className="np-artist">
              挑一张<a className="link" href={href.home()} style={{ textDecoration: 'underline' }}>唱片</a>放上去
            </div>
          </div>
        )}
      </div>

      <div className="transport">
        <div className="transport-btns">
          <button className="icon-btn hide-sm" onClick={cycleMode} aria-label={MODE_LABEL[mode]} title={MODE_LABEL[mode]}>
            <Icon name={mode} />
          </button>
          <button className="icon-btn hide-sm" onClick={prev} aria-label="上一首">
            <Icon name="prev" />
          </button>
          <button className="play-btn" onClick={toggle} aria-label={playing ? '暂停' : '播放'}>
            <Icon name={playing ? 'pause' : 'play'} />
          </button>
          <button className="icon-btn" onClick={() => next()} aria-label="下一首">
            <Icon name="next" />
          </button>
          <button
            className={`icon-btn hide-sm ${npOpen ? 'on' : ''}`}
            onClick={openNp}
            aria-label="歌词"
            title="歌词"
          >
            <Icon name="lyrics" />
          </button>
        </div>
        <div className="progress-row">
          <span className="mono">{formatTime(position)}</span>
          <Slider value={position} max={duration} onCommit={seek} label="播放进度" format={formatTime} />
          <span className="mono">{formatTime(duration)}</span>
        </div>
      </div>

      <div className="tools">
        <button className="icon-btn" onClick={toggleMute} aria-label={muted ? '取消静音' : '静音'}>
          <Icon name={muted || volume === 0 ? 'mute' : 'volume'} />
        </button>
        <Slider
          className="volume"
          value={muted ? 0 : volume}
          max={1}
          onCommit={setVolume}
          onInput={setVolume}
          label="音量"
          format={(v) => `${Math.round(v * 100)}%`}
        />
        <button
          className={`icon-btn ${qOpen ? 'on' : ''}`}
          onClick={() => uiStore.set({ queue: !qOpen })}
          aria-label="播放队列"
          title={`播放队列（${queueLen}）`}
          style={{ marginLeft: 8 }}
        >
          <Icon name="queue" />
        </button>
      </div>
    </footer>
  );
}
