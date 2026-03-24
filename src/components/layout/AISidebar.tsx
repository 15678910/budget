'use client';

interface SidebarSection {
  id: string;
  label: string;
}

interface AISidebarProps {
  title: string;
  sections: SidebarSection[];
}

export function AISidebar({ title, sections }: AISidebarProps) {
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
                className="block px-3 py-1.5 text-sm text-gray-400 hover:text-gray-200 hover:bg-gray-800/30 rounded-md transition-colors"
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
