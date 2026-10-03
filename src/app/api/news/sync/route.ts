import { timingSafeEqual } from 'node:crypto';
import { load } from 'cheerio';
import { createSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = 'nodejs';

type FeedType = 'news' | 'events';

interface WordPressItem {
  id: number;
  date: string;
  link: string;
  title: { rendered: string };
  content: { rendered: string };
  _embedded?: {
    'wp:featuredmedia'?: Array<{
      source_url: string;
      alt_text: string;
      media_details?: { sizes?: Record<string, { source_url: string }> };
    }>;
  };
}

function isAuthorized(request: Request) {
  const expected = process.env.NEWS_SYNC_SECRET;
  const provided = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');

  if (!expected || !provided) return false;

  const expectedBytes = Buffer.from(expected);
  const providedBytes = Buffer.from(provided);
  return expectedBytes.length === providedBytes.length && timingSafeEqual(expectedBytes, providedBytes);
}

async function fetchFeed(type: FeedType): Promise<WordPressItem[]> {
  const items: WordPressItem[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const params = new URLSearchParams({
      _embed: 'wp:featuredmedia',
      page: String(page),
      per_page: '100',
      order: 'desc',
      orderby: 'date',
    });
    const response = await fetch(`https://uccollege.edu.in/wp-json/wp/v2/${type}?${params}`, {
      cache: 'no-store',
    });

    if (!response.ok) throw new Error(`WordPress ${type} request failed with ${response.status}.`);

    totalPages = Number(response.headers.get('X-WP-TotalPages') ?? 1);
    items.push(...((await response.json()) as WordPressItem[]));
    page += 1;
  }

  return items;
}

export async function POST(request: Request) {
  if (!process.env.NEWS_SYNC_SECRET || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ error: 'News sync is not configured on the server.' }, { status: 503 });
  }

  if (!isAuthorized(request)) {
    return Response.json({ error: 'Unauthorized.' }, { status: 401 });
  }

  try {
    const supabase = createSupabaseAdmin();
    const totals: Record<FeedType, number> = { news: 0, events: 0 };

    for (const type of ['news', 'events'] as const) {
      const items = await fetchFeed(type);
      const rows = items.map((item) => {
        const media = item._embedded?.['wp:featuredmedia']?.[0];
        const imageUrl = media?.media_details?.sizes?.medium_large?.source_url
          ?? media?.media_details?.sizes?.large?.source_url
          ?? media?.source_url
          ?? load(item.content.rendered)('img').first().attr('src')
          ?? null;

        return {
          id: item.id,
          type,
          date: item.date,
          title: item.title.rendered,
          content_html: item.content.rendered,
          source_url: item.link,
          image_url: imageUrl,
          image_alt: media?.alt_text ?? '',
          updated_at: new Date().toISOString(),
        };
      });

      if (rows.length > 0) {
        const { error } = await supabase.from('college_updates').upsert(rows, { onConflict: 'type,id' });
        if (error) throw error;
      }

      totals[type] = rows.length;
    }

    return Response.json({ synced: totals });
  } catch (error) {
    console.error('News sync failed:', error);
    return Response.json({ error: 'News sync failed. Check the server logs.' }, { status: 500 });
  }
}