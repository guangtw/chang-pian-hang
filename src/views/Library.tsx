import { api } from '../api';
import { PlaylistCard } from '../components/Cards';
import { Icon } from '../components/Icon';
import { Empty, ErrorState, Loading } from '../components/States';
import { TrackList } from '../components/TrackList';
import { logout, sessionStore } from '../lib/session';
import { useStore } from '../lib/store';
import { useAsync } from '../lib/useAsync';
import { playList } from '../player/player';
import { uiStore } from '../player/ui';

export function Library() {
  const user = useStore(sessionStore, (s) => s.user);
  const checked = useStore(sessionStore, (s) => s.checked);
  const liked = useStore(sessionStore, (s) => s.liked);

  // 只在登录用户变化时拉一次；取消收藏后列表保持不变，避免正在看的行突然消失
  const likedTracks = useAsync(
    () => (user ? api().getTracks([...sessionStore.get().liked].slice(0, 200)) : Promise.resolve([])),
    [user?.id],
  );
  const lists = useAsync(() => (user ? api().getUserPlaylists(user.id) : Promise.resolve([])), [user?.id]);

  if (!checked) return <div className="page"><Loading /></div>;

  if (!user) {
    return (
      <div className="page">
        <Empty title="你的唱片架还空着">
          <p>登录后，收藏的歌和建过的歌单都会摆在这里。</p>
          <p style={{ marginTop: 18 }}>
            <button className="btn solid" onClick={() => uiStore.set({ login: true })}>
              扫码登录
            </button>
          </p>
        </Empty>
      </div>
    );
  }

  return (
    <div className="page">
      <header className="detail-head" style={{ gridTemplateColumns: '96px minmax(0,1fr)', alignItems: 'center' }}>
        {user.avatar ? (
          <img className="avatar" src={user.avatar} alt="" style={{ width: 96, height: 96 }} />
        ) : (
          <span className="avatar" style={{ width: 96, height: 96 }} />
        )}
        <div>
          <div className="kicker">会员卡</div>
          <h1 style={{ margin: '6px 0' }}>{user.nickname}</h1>
          {user.signature && <p className="muted serif">{user.signature}</p>}
        </div>
      </header>

      <section className="section" style={{ marginTop: 40 }}>
        <div className="section-head">
          <span className="kicker">01</span>
          <h2>我收藏的歌</h2>
          <span className="mono faint">{liked.size} 首</span>
          {!!likedTracks.data?.length && (
            <button className="btn ghost more" onClick={() => playList(likedTracks.data!)}>
              <Icon name="play" /> 全部播放
            </button>
          )}
        </div>
        {likedTracks.loading && <Loading rows={4} />}
        {likedTracks.error && <ErrorState error={likedTracks.error} onRetry={likedTracks.reload} />}
        {likedTracks.data?.length === 0 && <p className="muted">还没收藏过歌。在曲目旁边点一下心形就能收藏。</p>}
        {!!likedTracks.data?.length && <TrackList tracks={likedTracks.data} />}
      </section>

      <section className="section">
        <div className="section-head">
          <span className="kicker">02</span>
          <h2>我的歌单</h2>
        </div>
        {lists.loading && <Loading rows={3} />}
        {lists.error && <ErrorState error={lists.error} onRetry={lists.reload} />}
        <div className="grid-4">
          {lists.data?.map((p) => (
            <PlaylistCard key={p.id} p={p} />
          ))}
        </div>
      </section>

      <p style={{ marginTop: 48 }}>
        <button className="btn" onClick={logout}>
          退出登录
        </button>
      </p>
    </div>
  );
}
