import { useEffect, useRef, useState } from 'react';
import { coverOf } from '../api';
import { formatTime } from '../lib/format';
import { Spring } from '../lib/motion';
import { motionEnabled } from '../lib/settings';
import { useStore } from '../lib/store';
import { audioDuration, audioTime, currentTrack, playerStore, seek } from '../player/player';
import { Vinyl } from './Vinyl';

// 唱机俯视图，坐标都在 100×100 的盒子里。
// 唱臂绕支点旋转：0° = 竖直向下（搁在臂架上），
// OUTER° 时唱针落在最外圈，INNER° 时到达最内圈。
const PIVOT = { x: 88, y: 14 };
const REST = 2;
const OUTER = 17.5;
const INNER = 37;

const angleFor = (progress: number) => OUTER + (INNER - OUTER) * Math.min(1, Math.max(0, progress));

/**
 * 正在播放页的唱机。唱臂的位置就是播放进度：
 * 播放时落针并随进度向内走，暂停时抬起，没有歌时回到臂架。
 * 拖动唱臂可以跳转。
 */
export function Turntable({ vtName }: { vtName?: string }) {
  const track = useStore(playerStore, (s) => currentTrack(s));
  const playing = useStore(playerStore, (s) => s.playing);
  const position = useStore(playerStore, (s) => s.position);
  const duration = useStore(playerStore, (s) => s.duration);
  const boxRef = useRef<HTMLDivElement>(null);
  const armRef = useRef<SVGGElement>(null);
  const spring = useRef(new Spring(REST, 70, 14));
  const [drag, setDrag] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);
  dragRef.current = drag;

  // 每帧：算目标角度 → 弹簧逼近 → 写进 SVG
  useEffect(() => {
    let id = 0;
    let last = performance.now();
    const s = spring.current;
    const loop = (now: number) => {
      const dur = audioDuration() || duration;
      if (dragRef.current != null) s.target = angleFor(dragRef.current / (dur || 1));
      else if (!track) s.target = REST;
      else s.target = angleFor((playing ? audioTime() : position) / (dur || 1));
      if (motionEnabled()) s.step((now - last) / 1000);
      else s.snap(s.target);
      last = now;
      armRef.current?.setAttribute('transform', `rotate(${s.value.toFixed(3)} ${PIVOT.x} ${PIVOT.y})`);
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [track, playing, position, duration]);

  const progressFromPointer = (e: React.PointerEvent) => {
    const r = boxRef.current!.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100 - PIVOT.x;
    const y = ((e.clientY - r.top) / r.height) * 100 - PIVOT.y;
    // 从竖直向下顺时针量角度
    const deg = (Math.atan2(-x, y) * 180) / Math.PI;
    const p = (deg - OUTER) / (INNER - OUTER);
    return Math.min(1, Math.max(0, p)) * (audioDuration() || duration);
  };

  return (
    <div className={`deck ${playing ? 'is-playing' : ''} ${drag != null ? 'is-cueing' : ''}`} ref={boxRef}>
      <div className="deck-platter">
        <Vinyl
          cover={track ? coverOf(track) : undefined}
          spinning={playing && drag == null}
          className="deck-vinyl"
          labelPx={400}
          ref={(el) => {
            if (el) el.style.viewTransitionName = vtName ?? '';
          }}
        />
      </div>
      <div className="deck-led" aria-hidden="true" />
      <div className="deck-rpm mono" aria-hidden="true">
        33⅓
      </div>

      <svg className="tonearm" viewBox="0 0 100 100" aria-hidden="true">
        <circle cx={PIVOT.x} cy={PIVOT.y} r="6.2" className="arm-base" />
        <g ref={armRef}>
          <rect x={PIVOT.x - 2.4} y={PIVOT.y - 11} width="4.8" height="7" rx="1.2" className="arm-weight" />
          <line x1={PIVOT.x} y1={PIVOT.y} x2={PIVOT.x} y2={PIVOT.y + 58} className="arm-tube" />
          <line x1={PIVOT.x} y1={PIVOT.y + 58} x2={PIVOT.x - 3.2} y2={PIVOT.y + 66} className="arm-tube" />
          <g
            className="arm-head"
            role="slider"
            aria-label="唱臂（拖动跳转）"
            aria-valuemin={0}
            aria-valuemax={Math.round(duration)}
            aria-valuenow={Math.round(position)}
            onPointerDown={(e) => {
              if (!track) return;
              (e.currentTarget as Element).setPointerCapture(e.pointerId);
              setDrag(progressFromPointer(e));
            }}
            onPointerMove={(e) => drag != null && setDrag(progressFromPointer(e))}
            onPointerUp={(e) => {
              if (drag == null) return;
              seek(progressFromPointer(e));
              setDrag(null);
            }}
            onPointerCancel={() => setDrag(null)}
          >
            <rect x={PIVOT.x - 6.6} y={PIVOT.y + 63} width="7" height="10" rx="1.6" transform={`rotate(28 ${PIVOT.x - 3.2} ${PIVOT.y + 68})`} />
            <circle cx={PIVOT.x - 3.2} cy={PIVOT.y + 68} r="9" className="arm-grab" />
          </g>
        </g>
        <circle cx={PIVOT.x} cy={PIVOT.y} r="2.4" className="arm-cap" />
      </svg>

      {drag != null && <div className="deck-cue mono">{formatTime(drag)}</div>}
    </div>
  );
}
