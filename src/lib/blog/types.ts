/** 칼럼 글 앞머리(frontmatter) — content/blog/*.md 맨 위 `---` 블록 */
export interface BlogPostMeta {
  /** URL 경로 조각 (/blog/{slug}) — 영문 소문자·숫자·하이픈만 */
  slug: string;
  title: string;
  /** YYYY-MM-DD */
  date: string;
  summary: string;
}

export interface BlogPost extends BlogPostMeta {
  /** 앞머리를 뗀 마크다운 본문 (원문 그대로) */
  body: string;
}
