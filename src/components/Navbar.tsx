import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ShieldCheck, Sparkles, ArrowRight } from 'lucide-react';

export const Navbar: React.FC = () => {
  const location = useLocation();

  const navLinks = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'AI Assistant', path: '/assistant' },
    { name: 'Compare', path: '/compare' },
    { name: 'Policies', path: '/policies' },
    { name: 'Transactions', path: '/transactions' },
    { name: 'Audit Center', path: '/audit' }
  ];

  return (
    <header className="sticky top-0 z-50 bg-[#111310]/90 backdrop-blur-md border-b border-[#343A30]">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark */}
        <Link
          to="/"
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-[#F0F0E9] hover:text-[#C7F36B] transition-colors whitespace-nowrap shrink-0"
        >
          <div className="w-8 h-8 rounded bg-[#20241E] border border-[#343A30] flex items-center justify-center text-[#C7F36B]">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span>IntentPay</span>
        </Link>

        {/* Zone 2: 4-6 concise single-line nav links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-[#A4AA9A]">
          {navLinks.map((link) => {
            const isActive = location.pathname === link.path;
            return (
              <Link
                key={link.path}
                to={link.path}
                className={`transition-colors whitespace-nowrap shrink-0 hover:text-[#F0F0E9] ${
                  isActive ? 'text-[#C7F36B] font-semibold' : ''
                }`}
              >
                {link.name}
              </Link>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to="/assistant"
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-[#111310] bg-[#C7F36B] hover:bg-[#b8e858] rounded transition-colors whitespace-nowrap shrink-0 shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Start Intent</span>
          </Link>
        </div>
      </div>
    </header>
  );
};
