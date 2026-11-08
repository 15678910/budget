import type { Metadata } from 'next';
import Link from 'next/link';

import { formatPostDate, getPostMetas } from '@/lib/blog/posts';

const DESCRIPTION = '예산과 재정, AI 기본사회를 두고 쓴 칼럼을 모았습니다.';

export const metadata: Metadata = {
  title: '칼럼',
  description: DESCRIPTION,
  alternates: { canonical: '/blog' },
  openGraph: {
    type: 'website',
    url: '/blog',
    title: '칼럼 | 마을살림/나라살림',
    description: DESCRIPTION,
    images: [{ url: '/icon-512.png', width: 512, height: 512, alt: '마을살림/나라살림' }],
  },
};

export default function BlogIndexPage() {
  const posts = getPostMetas();

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 md:px-6">
      <h1 className="text-2xl font-bold text-foreground md:text-3xl">칼럼</h1>
      <p className="mt-3 text-base leading-relaxed text-muted-foreground md:text-lg">{DESCRIPTION}</p>

      {posts.length === 0 ? (
        <p className="mt-10 text-muted-foreground">아직 글이 없습니다.</p>
      ) : (
        <ul className="mt-8 flex flex-col gap-4">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link
                href={`/blog/${post.slug}`}
                className="block rounded-xl border border-border bg-card p-5 transition-colors hover:border-primary/50 hover:bg-muted/40"
              >
                <time dateTime={post.date} className="text-sm text-muted-foreground">
                  {formatPostDate(post.date)}
                </time>
                <h2 className="mt-1 text-lg font-bold text-foreground md:text-xl">{post.title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground md:text-base">{post.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
