import Link from 'next/link';
import Image from 'next/image';
import { load } from 'cheerio';

type FeedType = 'news' | 'events';
type FeedFilter = 'all' | FeedType;

interface WPItem {
  id: number;
  date: string;
  type: FeedType;
  title: { rendered: string };
  content: { rendered: string };
  featured_media: number;
  link: string;
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string;
      alt_text: string;
      media_details?: {
        sizes?: Record<string, { source_url: string }>;
      };
    }>;
  };
}

interface FeedPage {
  items: WPItem[];
  pages: number;
  total: number;
}

export const revalidate = 300;

const API_URL = 'https://uccollege.edu.in/wp-json/wp/v2';
const PAGE_SIZE = 8;

async function getFeed(type: FeedType, page: number, perPage: number): Promise<FeedPage> {
  const params = new URLSearchParams({
    _embed: 'wp:featuredmedia',
    page: String(page),
    per_page: String(perPage),
    order: 'desc',
    orderby: 'date',
  });

  try {
    let response = await fetch(`${API_URL}/${type}?${params}`, {
      next: { revalidate: 300 },
    });

    if (!response.ok && page > 1) {
      params.set('page', '1');
      response = await fetch(`${API_URL}/${type}?${params}`, {
        next: { revalidate: 300 },
      });
    }

    if (!response.ok) return { items: [], pages: 0, total: 0 };

    const pages = Number(response.headers.get('X-WP-TotalPages') ?? 1);
    return {
      items: page <= pages ? ((await response.json()) as WPItem[]) : [],
      pages,
      total: Number(response.headers.get('X-WP-Total') ?? 0),
    };
  } catch (error) {
    console.error(`Unable to load college ${type}:`, error);
    return { items: [], pages: 0, total: 0 };
  }
}

function formatDate(isoString: string) {
  const [year, month, day] = isoString.split('T')[0].split('-');
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return `${months[Number(month) - 1]} ${Number(day)}, ${year}`;
}

function plainText(html: string) {
  return load(html).text().replace(/\s+/g, ' ').trim();
}

function getImage(item: WPItem) {
  const media = item._embedded?.['wp:featuredmedia']?.[0];
  const image = media?.media_details?.sizes?.medium_large?.source_url
    ?? media?.media_details?.sizes?.large?.source_url
    ?? media?.source_url
    ?? load(item.content.rendered)('img').first().attr('src');

  return {
    src: image,
    alt: media?.alt_text || plainText(item.title.rendered),
  };
}

function excerpt(item: WPItem) {
  const text = plainText(item.content.rendered);
  if (text.length <= 260) return text;
  const shortened = text.slice(0, 257);
  return `${shortened.slice(0, shortened.lastIndexOf(' '))}...`;
}

function pageHref(filter: FeedFilter, page: number) {
  const params = new URLSearchParams();
  if (filter !== 'all') params.set('type', filter);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return query ? `/?${query}` : '/';
}

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; page?: string }>;
}) {
  const query = await searchParams;
  const filter: FeedFilter = query.type === 'news' || query.type === 'events' ? query.type : 'all';
  const requestedPage = Number.parseInt(query.page ?? '1', 10);
  const page = Number.isFinite(requestedPage) ? Math.min(Math.max(requestedPage, 1), 300) : 1;
  const perTypePageSize = filter === 'all' ? PAGE_SIZE / 2 : PAGE_SIZE;

  const [news, events] = await Promise.all([
    filter === 'events' ? Promise.resolve({ items: [], pages: 0, total: 0 }) : getFeed('news', page, perTypePageSize),
    filter === 'news' ? Promise.resolve({ items: [], pages: 0, total: 0 }) : getFeed('events', page, perTypePageSize),
  ]);

  const items = [...news.items, ...events.items].sort((left, right) => Date.parse(right.date) - Date.parse(left.date));
  const totalPages = filter === 'all' ? Math.max(news.pages, events.pages) : news.pages || events.pages;
  const totalItems = news.total + events.total;

  return (
    <main className="site-shell">
      <header className="page-header">
        <Link className="college-mark" href="/" aria-label="Union Christian College news home">
          <span className="college-mark__seal">UC</span>
          <span className="college-mark__name">Union Christian College <span>Aluva · Est. 1921</span></span>
        </Link>
        <a className="official-link" href="https://uccollege.edu.in/news-and-events/" target="_blank" rel="noreferrer">
          Official website <span aria-hidden="true">↗</span>
        </a>
      </header>

      <section className="feed-intro" aria-labelledby="page-title">
        <p className="eyebrow">Campus bulletin <span>·</span> {totalItems.toLocaleString()} stories</p>
        <h1 id="page-title">News &amp; Events</h1>
        <p className="feed-description">The latest from Union Christian College, Aluva.</p>
      </section>

      <nav className="feed-tabs" aria-label="Filter news and events">
        {(['all', 'news', 'events'] as const).map((tab) => (
          <Link key={tab} href={pageHref(tab, 1)} className={filter === tab ? 'feed-tab is-active' : 'feed-tab'} aria-current={filter === tab ? 'page' : undefined}>
            {tab === 'all' ? 'All updates' : tab === 'news' ? 'News' : 'Events'}
          </Link>
        ))}
      </nav>

      {items.length > 0 ? (
        <section className="news-list" aria-label="College updates">
          {items.map((item) => {
            const title = plainText(item.title.rendered);
            const image = getImage(item);
            const summary = excerpt(item);

            return (
              <article className="news-row" key={`${item.type}-${item.id}`}>
                <Link className="news-image-link" href={`/news/${item.type}-${item.id}`} aria-label={`Read ${title}`}>
                  {image.src ? <Image className="news-image" src={image.src} alt={image.alt} fill sizes="(max-width: 760px) 100vw, 38vw" unoptimized /> : <span className="image-placeholder">UC</span>}
                </Link>
                <div className="news-copy">
                  <div className="news-meta">
                    <span className={`type-label type-label--${item.type}`}>{item.type}</span>
                    <time dateTime={item.date}>{formatDate(item.date)}</time>
                  </div>
                  <h2><Link href={`/news/${item.type}-${item.id}`}>{title}</Link></h2>
                  {summary && <p className="news-excerpt">{summary}</p>}
                  <Link className="read-more" href={`/news/${item.type}-${item.id}`}>Read More <span aria-hidden="true">→</span></Link>
                </div>
              </article>
            );
          })}
        </section>
      ) : (
        <p className="empty-state">The college feed is temporarily unavailable. Please try again shortly.</p>
      )}

      {totalPages > 1 && (
        <nav className="pagination" aria-label="News archive pages">
          {page > 1 ? <Link href={pageHref(filter, page - 1)} className="page-control">← Previous</Link> : <span />}
          <span className="page-count">Page {page} of {totalPages}</span>
          {page < totalPages ? <Link href={pageHref(filter, page + 1)} className="page-control">Next →</Link> : <span />}
        </nav>
      )}

      <footer className="page-footer">
        <span>Union Christian College · Aluva</span>
        <span>Updated from the official college feed every 5 minutes</span>
      </footer>
    </main>
  );
}
