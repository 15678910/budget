'use client';

import { useState, useEffect, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils/format';

interface NavSection {
  id: string;
  label: string;
}

// 페이지 본문의 <section>/<footer id> 를 스캔해 절 목록을 만든다. 서버 렌더 시점에는
// DOM이 없어 목록이 비지만, 마운트 직후 채워지므로 사용자 체감상 문제가 없다.
function readSections(): NavSection[] {
  const nodes = document.querySelectorAll('main :is(section, footer)[id]');
  const sections: NavSection[] = [];
  nodes.forEach((node) => {
    const id = node.id;
    const heading = node.querySelector('h2');
    if (!id || !heading?.textContent) return;
    sections.push({ id, label: heading.textContent });
  });
  return sections;
}

export function SidebarSectionNav() {
  const pathname = usePathname();
  const [sections, setSections] = useState<NavSection[]>([]);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    const found = readSections();
    // DOM은 마운트 이후에만 읽을 수 있는 외부 시스템이라, 절 목록은 effect에서
    // 한 번 읽어 렌더에 공개해야 한다(이후 활성 절은 IntersectionObserver가 갱신).
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSections(found);
    setActiveId(found[0]?.id ?? '');

    const observers: IntersectionObserver[] = [];
    for (const section of found) {
      const el = document.getElementById(section.id);
      if (!el) continue;

      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setActiveId(section.id);
          }
        },
        { rootMargin: '-80px 0px -60% 0px', threshold: 0.1 }
      );
      observer.observe(el);
      observers.push(observer);
    }

    return () => observers.forEach((o) => o.disconnect());
  }, [pathname]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - 80;
    window.scrollTo({ top, behavior: 'smooth' });
    setActiveId(id);
  }, []);

  if (sections.length === 0) return null;

  return (
    <ul className="space-y-0.5">
      {sections.map((section) => (
        <li key={section.id}>
          <a
            href={`#${section.id}`}
            onClick={(e) => handleClick(e, section.id)}
            className={cn(
              'block ml-3 mt-0.5 px-2.5 py-1 text-xs rounded-md transition-colors',
              activeId === section.id
                ? 'text-foreground bg-muted/50 font-medium'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground'
            )}
          >
            {section.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
