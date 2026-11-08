import MarkdownIt from 'markdown-it';

// 칼럼 본문 렌더러 (서버·빌드 때만 실행).
// 보안: html: false — 본문 속 HTML 태그는 실행되지 않고 글자로 보인다(XSS 차단).
//       링크 주소는 markdown-it 기본 validateLink 가 javascript:·vbscript:·file:·data: 를 막는다.
const md = new MarkdownIt({
  html: false,
  linkify: true, // 참고 자료의 맨 URL 을 링크로
  typographer: false,
  breaks: false,
});

// 프로토콜 없는 글자(예: budget.ai.kr)까지 링크로 만들지 않는다
md.linkify.set({ fuzzyLink: false, fuzzyEmail: false, fuzzyIP: false });

const defaultLinkOpen =
  md.renderer.rules.link_open ??
  ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));

// 바깥 링크는 새 탭 + rel 보호
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  const token = tokens[idx];
  const href = token.attrGet('href') ?? '';
  if (/^https?:\/\//i.test(href)) {
    token.attrSet('target', '_blank');
    token.attrSet('rel', 'noopener noreferrer nofollow');
  }
  return defaultLinkOpen(tokens, idx, options, env, self);
};

// 표는 좁은 화면에서 가로 스크롤
md.renderer.rules.table_open = () => '<div class="blog-table-wrap"><table>\n';
md.renderer.rules.table_close = () => '</table></div>\n';

/**
 * 마크다운 → HTML.
 * 본문 첫 줄의 `# 제목` 이 앞머리 title 과 같으면 페이지 머리글과 겹치므로 화면에서만 뺀다
 * (파일 내용은 그대로).
 */
export function renderMarkdown(body: string, title?: string): string {
  let source = body;
  const firstLine = /^# (.+?)\s*(?:\r?\n|$)/.exec(source);
  if (title && firstLine && firstLine[1].trim() === title.trim()) {
    source = source.slice(firstLine[0].length);
  }
  return md.render(source);
}
