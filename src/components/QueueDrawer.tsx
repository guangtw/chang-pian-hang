import { useEffect, useRef } from 'react';
import { formatTime } from '../lib/format';
import { useStore } from '../lib/store';
import { clearQueue, jumpTo, playerStore, removeAt, toggle } from '../player/player';
import { uiStore } from '../player/ui';
import { Icon } from './Icon';

export function QueueDrawer() {
  const open = useStore(uiStore, (s) => s.queue);
  const queue = useStore(playerStore, (s) => s.queue);
  const index = useStore(playerStore, (s) => s.index);
  const listRef = useRef<HTMLDivElement>(null);
  const close = () => uiStore.set({ queue: false });

  useEffect(() => {
    if (!open) return;
    (listRef.current?.children[index] as HTMLElement | undefined)?.scrollIntoView({ block: 'center' });
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;
  return (
    <>
      <div className="scrim" onClick={close} />
      <aside className="drawer" aria-label="播放队列">
        <div className="drawer-head">
          <h2>播放队列</h2>
          <span className="mono faint">{queue.length} 首</span>
          {queue.length > 0 && (
            <button className="btn ghost" onClick={clearQueue}>
              清空
            </button>
          )}
          <button className="icon-btn" onClick={close} aria-label="关闭" style={{ marginLeft: queue.length ? 0 : 'auto' }}>
            <Icon name="close" />
          </button>
        </div>
        <div className="drawer-list" ref={listRef}>
          {queue.length === 0 && <p className="state">队列是空的。</p>}
          {queue.map((t, i) => (
            <div
              key={`${t.id}-${i}`}
              className={`q-item ${i === index ? 'current' : ''}`}
              onClick={() => (i === index ? toggle() : jumpTo(i))}
            >
              <span className="mono faint">{String(i + 1).padStart(2, '0')}</span>
              <span style={{ minWidth: 0 }}>
                <div className="t">{t.name}</div>
                <div className="a">{t.artists.map((a) => a.name).join(' / ')}</div>
              </span>
              <span className="mono faint">{formatTime(t.duration)}</span>
              <button
                className="icon-btn"
                style={{ width: 28, height: 28 }}
                aria-label="移出队列"
                onClick={(e) => {
                  e.stopPropagation();
                  removeAt(i);
                }}
              >
                <Icon name="close" size={16} />
              </button>
            </div>
          ))}
        </div>
      </aside>
    </>
  );
}
