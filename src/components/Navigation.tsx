'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Navigation({ transparent = false }: { transparent?: boolean }) {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const getLinkClass = (path: string) => {
        const isActive = pathname === path || (path !== '/' && pathname?.startsWith(path));

        if (transparent) {
            return isActive
                ? "text-cyan-400 font-medium shadow-black drop-shadow-md border-b-2 border-cyan-400 pb-1"
                : "text-slate-300 hover:text-white shadow-black drop-shadow-md hover:border-b-2 hover:border-slate-400 pb-1 transition-all";
        }

        return isActive
            ? "text-cyan-400 font-medium border-b-2 border-cyan-400 pb-1"
            : "text-slate-300 hover:text-white hover:border-b-2 hover:border-slate-400 pb-1 transition-all";
    };

    const navLinks = [
        { href: '/', label: 'Dashboard' },
        { href: '/countries', label: 'Countries' },
        { href: '/globe', label: 'Globe' },
        { href: '/analysis', label: 'Analysis' },
        { href: '/alerts', label: 'Alerts' },
        { href: '/trends', label: 'Trends' },
        { href: '/compare', label: 'Compare' },
    ];

    return (
        <header className={`${transparent
            ? "absolute top-0 left-0 w-full z-50 bg-gradient-to-b from-black/80 to-transparent pointer-events-none transition-all duration-300"
            : "border-b border-slate-700/50 backdrop-blur-md bg-slate-900/80 sticky top-0 z-50 transition-all duration-300"
            }`}>
            <div className={`max-w-7xl mx-auto px-6 py-4 flex items-center justify-between ${transparent ? "pointer-events-auto" : ""}`}>
                <div className="flex items-center gap-4 md:gap-6">
                    <Link href="/" className="group">
                        <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent group-hover:from-cyan-300 group-hover:to-blue-400 transition-all">
                            🌍 GeoForecaster
                        </h1>
                        {!transparent && <p className="hidden md:block text-xs text-slate-400">CIA World Factbook Analysis</p>}
                    </Link>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden lg:flex gap-6 text-sm">
                    {navLinks.map(link => (
                        <Link key={link.href} href={link.href} className={getLinkClass(link.href)}>
                            {link.label}
                        </Link>
                    ))}
                    <Link 
                        href="/methodology" 
                        className={`${getLinkClass('/methodology')} text-slate-500 hover:text-slate-300`}
                    >
                        ℹ️
                    </Link>
                </nav>

                {/* Mobile menu button */}
                <button 
                    className="lg:hidden text-slate-300 hover:text-white p-2"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Mobile Nav */}
            {mobileMenuOpen && (
                <div className={`lg:hidden border-t border-slate-700/50 ${transparent ? '' : 'bg-slate-900/95 backdrop-blur-md'}`}>
                    <nav className="max-w-7xl mx-auto px-6 py-4 flex flex-col gap-3">
                        {navLinks.map(link => (
                            <Link 
                                key={link.href} 
                                href={link.href} 
                                className={`${getLinkClass(link.href)} py-2`}
                                onClick={() => setMobileMenuOpen(false)}
                            >
                                {link.label}
                            </Link>
                        ))}
                        <Link 
                            href="/methodology" 
                            className="text-slate-400 hover:text-white py-2"
                            onClick={() => setMobileMenuOpen(false)}
                        >
                            Methodology
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    );
}
