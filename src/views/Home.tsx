import { music, type DiscoverBlock, type DiscoverItem } from '../api';
import { Card, DiscoverCard, discoverActivate } from '../components/Cards';
import { Cover } from '../components/Cover';
import { Icon } from '../components/Icon';
import { ErrorState, Loading } from '../components/States';
import { Vinyl } from '../components/Vinyl';
import { homeLayout, site, type BlockLayout } from '../config/site';
import { resolveDiscover } from '../lib/discover';
import { issueDate, issueNumber } from '../lib/format';
import { markHero, setPreview } from '../lib/motion';
import { tintVars, useTint } from '../lib/palette';
import { href, navigate } from '../lib/router';
import { useAsync } from '../lib/useAsync';
import { playList } from '../player/player';

function layoutOf(block: DiscoverBlock): BlockLayout {
  const byId = homeLayout.byBlockId[block.id];
  if (byId) return byId;
  const counts = new Map<string, number>();
  for (const it of block.items) counts.set(it.type, (counts.get(it.type) ?? 0) + 1);
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] as DiscoverItem['type'] | undefined;
  return (top && homeLayout.byItemType[top]) || 'grid';
}

function pickFeature(blocks: DiscoverBlock[]): DiscoverItem | undefined {
  const preferred = blocks.find((b) => b.id === homeLayout.featureBlockId);
  const fallback = blocks.find((b) => layoutOf(b) === 'grid' && b.items.some((i) => resolveDiscover(i).kind === 'link'));
  return (preferred ?? fallback)?.items.find((i) => resolveDiscover(i).kind === 'link');
}

function SectionHead({ no, title }: { no: number; title: string }) {
  return (
    <div className="section-head reveal">
      <span className="section-no">{String(no).padStart(2, '0')}</span>
      <h2>{title}</h2>
    </div>
  );
}

/** 封面故事：大封套 + 慢慢滑出的唱片 */
function Feature({ item }: { item: DiscoverItem }) {
  const action = resolveDiscover(item);
  const tint = useTint(item.coverUrl);
  if (action.kind !== 'link') return null;

  const open = (e: React.MouseEvent) => {
    const cover = (e.currentTarget.closest('.feature') as HTMLElement).querySelector<HTMLElement>('.feature-art .sleeve');
    markHero(cover, action.heroKey);
    setPreview(action.heroKey, { title: item.title, coverUrl: item.coverUrl, subtitle: item.subtitle });
  };

  const playAll = async () => {
    if (!item.targetId) return;
    const p = item.type === 'toplist' ? await music.toplist(item.targetId) : await music.playlist(item.targetId);
    playList(p.tracks);
  };

  return (
    <article className={`feature ${tint ? 'tinted' : ''}`} style={tintVars(tint)}>
      <a className="feature-art" href={action.to} onClick={open} aria-label={item.title}>
        <Vinyl cover={item.coverUrl} className="feature-vinyl" labelPx={300} spinning />
        <Cover src={item.coverUrl} alt="" size={800} className="sleeve" />
      </a>
      <div className="feature-text">
        <div className="kicker">封面故事</div>
        <h1 className="feature-title">{item.title}</h1>
        {item.subtitle && <p className="feature-sub">{item.subtitle}</p>}
        <div className="actions">
          <button className="btn solid" onClick={() => void playAll()}>
            <Icon name="play" /> 放上唱机
          </button>
          <a className="btn ghost" href={action.to} onClick={open}>
            翻开 <Icon name="arrow" />
          </a>
        </div>
      </div>
    </article>
  );
}

function BannerStrip({ items }: { items: DiscoverItem[] }) {
  return (
    <div className="banner-strip">
      {items.map((it, i) => {
        const action = resolveDiscover(it);
        const onActivate = discoverActivate(action);
        return (
          <a
            key={it.id}
            className={`banner reveal ${action.kind === 'none' ? 'inert' : ''}`}
            style={{ '--i': i } as React.CSSProperties}
            href={action.kind === 'link' ? action.to : action.kind === 'external' ? action.url : '#'}
            onClick={(e) => {
              if (onActivate) {
                e.preventDefault();
                onActivate();
              }
            }}
          >
            <Cover src={it.coverUrl} alt="" size={800} />
            <span className="banner-cap">
              <span className="mono">{it.subtitle}</span>
              <b>{it.title}</b>
            </span>
          </a>
        );
      })}
    </div>
  );
}

function ChartList({ items }: { items: DiscoverItem[] }) {
  return (
    <ol className="chart-list">
      {items.map((it, i) => {
        const action = resolveDiscover(it);
        const act = discoverActivate(action);
        return (
          <li key={it.id} className="reveal" style={{ '--i': i } as React.CSSProperties}>
            <a
              href={action.kind === 'link' ? action.to : '#'}
              onClick={(e) => {
                if (act) {
                  e.preventDefault();
                  return act();
                }
                if (action.kind === 'link') {
                  markHero(e.currentTarget.querySelector<HTMLElement>('.cover'), action.heroKey);
                  setPreview(action.heroKey, { title: it.title, coverUrl: it.coverUrl });
                }
              }}
            >
              <span className="chart-no">{String(i + 1).padStart(2, '0')}</span>
              <Cover src={it.coverUrl} alt="" size={120} />
              <span className="chart-text">
                <b>{it.title}</b>
                {it.subtitle && <span className="muted">{it.subtitle}</span>}
              </span>
              <Icon name="arrow" />
            </a>
          </li>
        );
      })}
    </ol>
  );
}

function Block({ block, no, skip }: { block: DiscoverBlock; no: number; skip?: string }) {
  const layout = layoutOf(block);
  const items = block.items.filter((i) => i.id !== skip).slice(0, homeLayout.limits[layout]);
  if (!items.length) return null;
  return (
    <section className={`section section-${layout}`}>
      <SectionHead no={no} title={block.title} />
      {layout === 'banner' && <BannerStrip items={items} />}
      {layout === 'chart' && <ChartList items={items} />}
      {(layout === 'grid' || layout === 'list') && (
        <div className="grid-cards">
          {items.map((it, i) => (
            <DiscoverCard key={it.id} item={it} index={i} />
          ))}
        </div>
      )}
      {layout === 'shelf' && (
        <div className="shelf">
          {items.map((it, i) => (
            <DiscoverCard key={it.id} item={it} index={i} />
          ))}
        </div>
      )}
    </section>
  );
}

export function Home() {
  const { data, error, loading, reload } = useAsync(() => music.discoverHome(), [], 'discover');
  const feature = data && pickFeature(data.blocks);
  const kw = data?.searchAssist.defaultKeyword;

  return (
    <div className="page home">
      <header className="masthead reveal">
        <div className="issue-no" aria-label={`第 ${issueNumber()} 期`}>
          <span className="mono">No.</span>
          {issueNumber()}
        </div>
        <div className="masthead-meta">
          <span className="mono">{issueDate()}</span>
          <span className="mono faint">{site.issueCadence}</span>
          {kw && (
            <a className="masthead-ask" href={href.search(kw)}>
              今天想听「{kw}」吗 <Icon name="arrow" />
            </a>
          )}
        </div>
      </header>

      {loading && <Loading rows={8} />}
      {error && <ErrorState error={error} onRetry={reload} />}

      {data && (
        <>
          {feature && <Feature item={feature} />}
          {data.blocks.map((b, i) => (
            <Block key={b.id} block={b} no={i + 1} skip={feature?.id} />
          ))}
          {!data.blocks.length && (
            <section className="section">
              <p className="muted">后端暂时没有推荐内容。去搜索看看？</p>
              <Card title="搜索" to={href.search()} onActivate={() => navigate(href.search())} />
            </section>
          )}
          <footer className="colophon mono">
            <span>
              {site.name} · No.{issueNumber()}
            </span>
            <span>{site.footerNote}</span>
          </footer>
        </>
      )}
    </div>
  );
}
