'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const links = [
  { href: '/',           label: 'Overview',   icon: '📊' },
  { href: '/diagnosis',  label: 'Diagnosis',  icon: '🔍' },
  { href: '/advisor',    label: 'AI Advisor', icon: '🧠' },
  { href: '/simulator',  label: 'Simulator',  icon: '⚡' },
  { href: '/forecast',   label: 'Forecast',   icon: '📈' },
];

export default function Navigation() {
  const pathname = usePathname();
  return (
    <nav style={{ background: 'linear-gradient(135deg, #1E3A5F 0%, #1E40AF 100%)' }} className="shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center text-white font-bold text-sm">SI</div>
            <div>
              <p className="text-white font-bold text-sm leading-none">Sales Intelligence</p>
              <p className="text-blue-200 text-xs">Decision System</p>
            </div>
          </div>
          <div className="flex gap-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  pathname === link.href
                    ? 'bg-white/20 text-white shadow-inner'
                    : 'text-blue-100 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="text-base">{link.icon}</span>
                <span className="hidden sm:inline">{link.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </nav>
  );
}
