import Link from 'next/link';
import Image from 'next/image';
import { getSupabaseClient } from '@/lib/supabase/client';

interface WPArticle {
    id: number;
    date: string;
    link: string;
    title: { rendered: string };
    content: { rendered: string };
    type: 'news' | 'events';
    image_url?: string | null;
    image_alt?: string | null;
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

export const revalidate = 300; // 5 minutes

async function getArticle(key: string): Promise<WPArticle | null> {
    const match = /^(news|events)-(\d+)$/.exec(key);
    if (!match) return null;

    const type = match[1] as WPArticle['type'];
    const id = match[2];

    try {
        const { data, error } = await getSupabaseClient()
            .from('college_updates')
            .select('id, type, date, title, content_html, source_url, image_url, image_alt')
            .eq('type', type)
            .eq('id', Number(id))
            .maybeSingle();

        if (error) throw error;
        if (data) {
            return {
                id: data.id,
                date: data.date,
                type,
                title: { rendered: data.title },
                content: { rendered: data.content_html },
                link: data.source_url,
                image_url: data.image_url,
                image_alt: data.image_alt,
            };
        }
    } catch (error) {
        console.error('Unable to load article from Supabase:', error);
    }

    try {
        const res = await fetch(`https://uccollege.edu.in/wp-json/wp/v2/${type}/${id}?_embed=wp:featuredmedia`, {
            next: { revalidate: 300 }
        });

        if (!res.ok) {
            return null;
        }

        return res.json();
    } catch (error) {
        console.error(error);
        return null;
    }
}

export default async function NewsArticlePage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const article = await getArticle(id);

    if (!article) {
        return (
            <div className="not-found">
                <h1>Article not found</h1>
                <Link href="/" className="article-back">← Back to News &amp; Events</Link>
            </div>
        );
    }

    const formatDate = (isoString: string) => {
        if (!isoString) return '';
        const datePart = isoString.split('T')[0];
        const [year, month, day] = datePart.split('-');
        const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
        return `${months[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year}`;
    };

    const media = article._embedded?.['wp:featuredmedia']?.[0];
    const image = article.image_url ?? media?.media_details?.sizes?.large?.source_url ?? media?.source_url;

    return (
        <main className="article-shell">
            <Link href="/" className="article-back">← Back to News &amp; Events</Link>
            <article>
                <header className="article-header">
                    <p className="article-date">{article.type === 'events' ? 'Event' : 'News'} · {formatDate(article.date)}</p>
                    <h1 dangerouslySetInnerHTML={{ __html: article.title.rendered }} />
                </header>

                {image && (
                    <div className="article-hero">
                        <Image src={image} alt={article.image_alt || media?.alt_text || article.title.rendered} fill sizes="(max-width: 700px) 100vw, 700px" unoptimized />
                    </div>
                )}

                <div className="article-content" dangerouslySetInnerHTML={{ __html: article.content.rendered }} />

                <div className="article-source">
                    <a href={article.link} target="_blank" rel="noopener noreferrer" title="View the original article on the college website">
                        View original on the UC College website ↗
                    </a>
                </div>
            </article>
        </main>
    );
}
