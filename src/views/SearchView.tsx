import { useEffect, useRef, useState } from 'react';
import { api, type SearchType } from '../api';
import { PAGE_SIZE } from '../api/provider';
import { AlbumCard, ArtistCard, PlaylistCard } from '../components/Cards';
import { Icon } from '../components/Icon';
import { Empty, ErrorState, Loading } from '../components/States';
import { TrackList } from '../components/TrackList';
import { href, navigate } from '../lib/router';
import { useAsync } from '../lib/useAsync';

const TYPES: { key: SearchType; label: string }[] = [
  { key: 'track', label: '单曲' },
  { key: 'album', label: '唱片' },
  { key: 'artist', label: '艺人' },
  { key: 'playlist', label: '歌单' },
];

export function SearchView({ q, type }: { q: string; type: SearchType }) {
  const [text, setText] = useState(q);
  const [page, setPage] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setText(q), [q]);
  useEffect(() => setPage(0), [q, type]);
  useEffect(() => {
    if (!q) inputRef.current?.focus();
  }, [q]);

  const hot = useAsync(() => api().getHotKeywords(), []);
  const result = useAsync(async () => {
    if (!q) return null;
    const p = api();
    switch (type) {
      case 'album':
        return { type, ...(await p.searchAlbums(q, page)) } as const;
      case 'artist':
        return { type, ...(await p.searchArtists(q, page)) } as const;
      case 'playlist':
        return { type, ...(await p.searchPlaylists(q, page)) } as const;
      default:
        return { type: 'track', ...(await p.searchTracks(q, page)) } as const;
    }
  }, [q, type, page]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) navigate(href.search(text.trim(), type));
  };

  const r = result.data;
  const pages = r ? Math.ceil(r.total / PAGE_SIZE) : 0;

  return (
    <div className="page">
      <form onSubmit={submit} role="search">
        <label className="search-box">
          <Icon name="search" />
          <span className="sr-only">搜索</span>
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="找一首歌、一张唱片或一位艺人"
            enterKeyHint="search"
          />
        </label>
      </form>

      {!q && (
        <section className="section" style={{ marginTop: 40 }}>
          <div className="section-head">
            <span className="kicker">热门</span>
            <h2>大家在找</h2>
          </div>
          {hot.loading && <Loading rows={4} />}
          <div className="hot">
            {hot.data?.map((h, i) => (
              <button key={h.word} onClick={() => navigate(href.search(h.word))}>
                <span className="mono faint" style={{ paddingTop: 4 }}>
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span>
                  <div className="w">{h.word}</div>
                  {h.hint && <div className="faint" style={{ fontSize: 13 }}>{h.hint}</div>}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      {q && (
        <>
          <div className="tabs" role="tablist">
            {TYPES.map((t) => (
              <button
                key={t.key}
                role="tab"
                aria-selected={type === t.key}
                className={type === t.key ? 'on' : ''}
                onClick={() => navigate(href.search(q, t.key))}
              >
                {t.label}
              </button>
            ))}
            {r && <span className="mono faint" style={{ marginLeft: 'auto', alignSelf: 'center' }}>共 {r.total} 条</span>}
          </div>

          {result.loading && <Loading />}
          {result.error && <ErrorState error={result.error} onRetry={result.reload} />}
          {r && r.items.length === 0 && (
            <Empty title={`没找到「${q}」`}>
              <p>换个关键词，或者切到别的分类看看。</p>
            </Empty>
          )}
          {r?.type === 'track' && r.items.length > 0 && <TrackList tracks={r.items} />}
          {r && r.type !== 'track' && r.items.length > 0 && (
            <div className="grid-4" style={{ marginTop: 24 }}>
              {r.type === 'album' && r.items.map((a) => <AlbumCard key={a.id} a={a} />)}
              {r.type === 'artist' && r.items.map((a) => <ArtistCard key={a.id} a={a} />)}
              {r.type === 'playlist' && r.items.map((p) => <PlaylistCard key={p.id} p={p} />)}
            </div>
          )}

          {pages > 1 && (
            <div className="pager">
              <button className="btn" disabled={page === 0} onClick={() => setPage(page - 1)}>
                上一页
              </button>
              <span className="mono faint">
                {page + 1} / {pages}
              </span>
              <button className="btn" disabled={page >= pages - 1} onClick={() => setPage(page + 1)}>
                下一页
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
