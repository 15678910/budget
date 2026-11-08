import fs from 'node:fs';
import path from 'node:path';

import type { BlogPost, BlogPostMeta } from './types';

// 칼럼은 DB 없이 저장소 안 마크다운 파일로 관리한다.
// 빌드 때 이 모듈이 읽어 /blog, /blog/[slug] 를 정적으로 만든다.
const BLOG_DIR = path.join(process.cwd(), 'content', 'blog');

const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const REQUIRED_KEYS = ['title', 'date', 'summary', 'slug'] as const;

/** `---` 로 둘러싼 앞머리를 `key: value` 줄 단위로 읽는다 (YAML 전체 문법은 지원하지 않음). */
function parseFrontmatter(raw: string, fileName: string): BlogPost {
  const text = raw.replace(/^﻿/, '');
  const match = /^---\r?\n([\s\S]*?)\r?\n---\r?\n/.exec(text);
  if (!match) {
    throw new Error(`[blog] ${fileName}: 맨 위에 --- 앞머리가 없습니다.`);
  }

  const fields: Record<string, string> = {};
  for (const line of match[1].split(/\r?\n/)) {
    if (line.trim() === '') continue;
    const idx = line.indexOf(':');
    if (idx <= 0) {
      throw new Error(`[blog] ${fileName}: 앞머리 줄 형식 오류 — "${line}"`);
    }
    const key = line.slice(0, idx).trim();
    const value = line
      .slice(idx + 1)
      .trim()
      .replace(/^(["'])(.*)\1$/, '$2');
    fields[key] = value;
  }

  for (const key of REQUIRED_KEYS) {
    if (!fields[key]) {
      throw new Error(`[blog] ${fileName}: 앞머리에 ${key} 가 없습니다.`);
    }
  }
  if (!SLUG_PATTERN.test(fields.slug)) {
    throw new Error(`[blog] ${fileName}: slug 는 영문 소문자·숫자·하이픈만 — "${fields.slug}"`);
  }
  if (!DATE_PATTERN.test(fields.date) || Number.isNaN(Date.parse(fields.date))) {
    throw new Error(`[blog] ${fileName}: date 는 YYYY-MM-DD — "${fields.date}"`);
  }

  return {
    slug: fields.slug,
    title: fields.title,
    date: fields.date,
    summary: fields.summary,
    body: text.slice(match[0].length),
  };
}

let cache: BlogPost[] | null = null;

/** 모든 글 (최신 날짜 먼저). slug 가 겹치면 빌드를 멈춘다. */
export function getAllPosts(): BlogPost[] {
  if (cache) return cache;

  const files = fs.existsSync(BLOG_DIR)
    ? fs.readdirSync(BLOG_DIR).filter((f) => f.endsWith('.md'))
    : [];

  const posts = files.map((f) =>
    parseFrontmatter(fs.readFileSync(path.join(BLOG_DIR, f), 'utf8'), f),
  );

  const seen = new Set<string>();
  for (const p of posts) {
    if (seen.has(p.slug)) throw new Error(`[blog] slug 중복: ${p.slug}`);
    seen.add(p.slug);
  }

  posts.sort((a, b) => (a.date === b.date ? a.slug.localeCompare(b.slug) : b.date.localeCompare(a.date)));
  cache = posts;
  return posts;
}

export function getPostMetas(): BlogPostMeta[] {
  return getAllPosts().map(({ slug, title, date, summary }) => ({ slug, title, date, summary }));
}

export function getPostBySlug(slug: string): BlogPost | undefined {
  return getAllPosts().find((p) => p.slug === slug);
}

/** 2026-11-08 → 2026년 11월 8일 */
export function formatPostDate(date: string): string {
  const [y, m, d] = date.split('-').map(Number);
  return `${y}년 ${m}월 ${d}일`;
}
