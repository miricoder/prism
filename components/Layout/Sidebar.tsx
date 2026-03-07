'use client';

import Link from 'next/link';
import { SECTIONS } from '@/lib/sections';
import { useState } from 'react';

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`bg-[#1e293b] border-r border-[#334155] transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'} flex flex-col`}>
      <div className="p-4 border-b border-[#334155]">
        <div className="flex items-center justify-between">
          {!collapsed && <h1 className="text-xl font-bold">PRISM</h1>}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="text-[#cbd5e1] hover:text-white"
          >
            {collapsed ? '▶️' : '◀️'}
          </button>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-4 space-y-2">
        {SECTIONS.map((section) => (
          <Link
            key={section.id}
            href={`/app${section.route}`}
            className={`flex items-center gap-3 px-4 py-2 rounded hover:bg-[#2563eb] transition-colors ${!section.enabled ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            <span className="text-lg">{section.icon}</span>
            {!collapsed && <span className="text-sm">{section.label}</span>}
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-[#334155]">
        <Link href="/app/settings" className="flex items-center gap-3 px-4 py-2 rounded hover:bg-[#2563eb] transition-colors">
          <span className="text-lg">⚙️</span>
          {!collapsed && <span className="text-sm">Settings</span>}
        </Link>
      </div>
    </aside>
  );
}
