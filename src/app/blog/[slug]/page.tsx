import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { formatPostDate, getAllPosts, getPostBySlug } from '@/lib/blog/posts';
import { renderMarkdown } from '@/lib/blog/markdown';
import '../blog.css';

// 글 목록에 없는 주소는 바로 404 (빌드 때 만든 페이지만 존재)
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllPosts().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: '칼럼' };

  const url = `/blog/${post.slug}`;
  return {
    title: post.title,
    description: post.summary,
    alternates: { canonical: url },
    openGraph: {
      type: 'article',
      url,
      title: post.title,
      description: post.summary,
      publishedTime: post.date,
      siteName: '마을살림/나라살림',
      locale: 'ko_KR',
      // openGraph 를 덮어쓰면 레이아웃의 이미지가 빠지므로 다시 넣는다
      images: [{ url: '/icon-512.png', width: 512, height: 512, alt: '마을살림/나라살림' }],
    },
    twitter: {
      card: 'summary',
      title: post.title,
      description: post.summary,
    },
  };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  // html:false 로 렌더한 결과라 본문 속 HTML 태그는 글자로만 나온다 (src/lib/blog/markdown.ts)
  const html = renderMarkdown(post.body, post.title);

  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 md:px-6">
      <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">
        ← 칼럼 목록
      </Link>

      <header className="mt-4 border-b border-border pb-6">
        <h1 className="text-2xl font-bold leading-snug text-foreground md:text-4xl">{post.title}</h1>
        <time dateTime={post.date} className="mt-3 block text-sm text-muted-foreground">
          {formatPostDate(post.date)}
        </time>
      </header>

      <article className="blog-prose mt-8" dangerouslySetInnerHTML={{ __html: html }} />

      <div className="mt-12 border-t border-border pt-6">
        <Link href="/blog" className="text-sm text-muted-foreground hover:text-foreground">
          ← 칼럼 목록
        </Link>
      </div>
    </main>
  );
}
