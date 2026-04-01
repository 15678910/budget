'use client';

import { useState, useEffect, useCallback } from 'react';

interface SidebarSection {
  id: string;
  label: string;
}

interface AISidebarProps {
  title: string;
  sections: SidebarSection[];
}

export function AISidebar({ title, sections }: AISidebarProps) {
  const [activeId, setActiveId] = useState(sections[0]?.id || '');

  // Track which section is visible
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    for (const section of sections) {
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

    return () => observers.forEach(o => o.disconnect());
  }, [sections]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      const headerOffset = 80;
      const top = el.getBoundingClientRect().top + window.scrollY - headerOffset;
      window.scrollTo({ top, behavior: 'smooth' });
      setActiveId(id);
    }
  }, []);

  return (
    <aside className="hidden lg:block w-48 shrink-0 border-r border-gray-800 bg-gray-950/50 sticky top-16 h-[calc(100vh-4rem)] overflow-y-auto">
      <nav className="p-4">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">
          {title}
        </h3>
        <ul className="space-y-0.5">
          {sections.map((section) => (
            <li key={section.id}>
              <a
                href={`#${section.id}`}
                onClick={(e) => handleClick(e, section.id)}
                className={`block px-3 py-1.5 text-sm rounded-md transition-colors ${
                  activeId === section.id
                    ? 'text-blue-400 bg-blue-500/10 border-l-2 border-blue-400 font-medium'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
                }`}
              >
                {section.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
}
