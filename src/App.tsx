import { useEffect, useRef, useSyncExternalStore } from 'react';
import type { SearchType } from './api';
import { LoginDialog } from './components/LoginDialog';
import { NowPlaying } from './components/NowPlaying';
import { PlayerBar } from './components/PlayerBar';
import { QueueDrawer } from './components/QueueDrawer';
import { Sidebar } from './components/Sidebar';
import { Empty } from './components/States';
import { Toast } from './components/Toast';
import { href, navigate, useRoute, type Route } from './lib/router';
import { refreshSession } from './lib/session';
import { getSettings, subscribeSettings } from './lib/settings';
import { next, playerStore, prev, seek, toggle } from './player/player';
import { uiStore } from './player/ui';
import { ArtistView } from './views/ArtistView';
import { AlbumView, PlaylistView } from './views/Collection';
import { Home } from './views/Home';
import { Library } from './views/Library';
import { SearchView } from './views/SearchView';
import { SettingsView } from './views/SettingsView';

function View({ route }: { route: Route }) {
  const [section, id] = route.parts;
  switch (section) {
    case undefined:
      return <Home />;
    case 'playlist':
      return <PlaylistView id={id} />;
    case 'album':
      return <AlbumView id={id} />;
    case 'artist':
      return <ArtistView id={id} />;
    case 'search':
      return <SearchView q={route.query.get('q') ?? ''} type={(route.query.get('type') as SearchType) || 'track'} />;
    case 'library':
      return <Library />;
    case 'settings':
      return <SettingsView />;
    default:
      return (
        <div className="page">
          <Empty title="这一页被撕掉了">
            <a className="btn" href={href.home()} style={{ marginTop: 18 }}>
              回到本期
            </a>
          </Empty>
        </div>
      );
  }
}

function useShortcuts() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el.closest('input, textarea, select, [contenteditable], [role="slider"]') || e.metaKey || e.ctrlKey || e.altKey) return;
      const { position } = playerStore.get();
      if (e.key === ' ' && !el.closest('button, a')) {
        e.preventDefault();
        toggle();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (e.shiftKey) next();
        else seek(position + 5000);
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (e.shiftKey) prev();
        else seek(position - 5000);
      } else if (e.key === 'l' || e.key === 'L') {
        uiStore.set({ nowPlaying: !uiStore.get().nowPlaying, queue: false });
      } else if (e.key === '/') {
        e.preventDefault();
        navigate(href.search());
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
}

export function App() {
  const route = useRoute();
  const settings = useSyncExternalStore(subscribeSettings, getSettings);
  const mainRef = useRef<HTMLElement>(null);

  useShortcuts();

  useEffect(() => {
    if (settings.theme === 'auto') document.documentElement.removeAttribute('data-theme');
    else document.documentElement.dataset.theme = settings.theme;
  }, [settings.theme]);

  // 换了后端或登录凭证就重新拉登录状态
  useEffect(() => {
    void refreshSession();
  }, [settings.apiBase, settings.cookie]);

  // 切页时回到顶部，并收起正在播放页
  useEffect(() => {
    mainRef.current?.scrollTo(0, 0);
    uiStore.set({ nowPlaying: false, queue: false });
  }, [route.path, route.query.toString()]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    // 换数据源时整体重挂，避免旧数据残留
    <div className="app" key={settings.apiBase}>
      <Sidebar />
      <main className="main" ref={mainRef}>
        <View route={route} />
      </main>
      <PlayerBar />
      <NowPlaying />
      <QueueDrawer />
      <LoginDialog />
      <Toast />
    </div>
  );
}
