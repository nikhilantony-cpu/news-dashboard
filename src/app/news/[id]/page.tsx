import Link from 'next/link';
import Image from 'next/image';

interface WPArticle {
    id: number;
    date: string;
    link: string;
    title: { rendered: string };
    content: { rendered: string };
    type: 'news' | 'events';
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

    const [, type, id] = match;

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
    const image = media?.media_details?.sizes?.large?.source_url ?? media?.source_url;

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
                        <Image src={image} alt={media?.alt_text || article.title.rendered} fill sizes="(max-width: 700px) 100vw, 700px" unoptimized />
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
