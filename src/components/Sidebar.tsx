import { api } from '../api';
import { issueNumber } from '../lib/format';
import { href, useRoute } from '../lib/router';
import { sessionStore } from '../lib/session';
import { useStore } from '../lib/store';
import { useAsync } from '../lib/useAsync';
import { uiStore } from '../player/ui';

const NAV = [
  { to: href.home(), key: '', label: '本期' },
  { to: href.search(), key: 'search', label: '搜索' },
  { to: href.library(), key: 'library', label: '唱片架' },
  { to: href.settings(), key: 'settings', label: '设置' },
];

export function Sidebar() {
  const route = useRoute();
  const user = useStore(sessionStore, (s) => s.user);
  const lists = useAsync(() => (user ? api().getUserPlaylists(user.id) : Promise.resolve([])), [user?.id]);
  const section = route.parts[0] ?? '';

  return (
    <nav className="side" aria-label="主导航">
      <a href={href.home()} className="logo">
        唱片行
      </a>
      <div className="logo-sub mono">
        <span>第 {issueNumber()} 期</span>
        <span>{api().name}</span>
      </div>

      <div className="side-label mono">目录</div>
      <div className="nav">
        {NAV.map((n) => (
          <a key={n.key} href={n.to} className={section === n.key ? 'on' : ''}>
            <span className="mark" />
            {n.label}
          </a>
        ))}
      </div>

      <div className="side-lists">
        {user && !!lists.data?.length && (
          <>
            <div className="side-label mono">我的歌单</div>
            {lists.data.map((p) => (
              <a
                key={p.id}
                href={href.playlist(p.id)}
                style={route.path === `/playlist/${p.id}` ? { color: 'var(--accent)' } : undefined}
              >
                {p.name}
              </a>
            ))}
          </>
        )}
      </div>

      <div className="side-foot">
        {user ? (
          <a href={href.library()} style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            {user.avatar ? <img className="avatar" src={user.avatar} alt="" /> : <span className="avatar" />}
            <span className="who" style={{ fontSize: 14, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user.nickname}
            </span>
          </a>
        ) : (
          <button className="btn" onClick={() => uiStore.set({ login: true })} style={{ height: 32, padding: '0 14px' }}>
            登录
          </button>
        )}
      </div>
    </nav>
  );
}
