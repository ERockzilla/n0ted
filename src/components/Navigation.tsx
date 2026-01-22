'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import GaussianBeamVortex3D from './GaussianBeamVortex3D';

export default function Navigation({ transparent = false }: { transparent?: boolean }) {
    const pathname = usePathname();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const getLinkClass = (path: string) => {
        const isActive = pathname === path || (path !== '/' && pathname?.startsWith(path));

        if (transparent) {
            return isActive
                ? "text-white font-medium border-b-2 border-white pb-1"
                : "text-white/80 hover:text-white hover:border-b-2 hover:border-white/50 pb-1 transition-all";
        }

        return isActive
            ? "text-blue-600 font-medium border-b-2 border-blue-600 pb-1"
            : "text-slate-600 hover:text-blue-600 hover:border-b-2 hover:border-blue-300 pb-1 transition-all";
    };

    interface NavLink {
        href: string;
        label: string;
        title?: string;
        isSubtle?: boolean;
    }

    const navLinks: NavLink[] = [
        { href: '/', label: 'Dashboard' },
        { href: '/countries', label: 'Countries' },
        { href: '/trends', label: 'Trends' },
        { href: '/globe', label: 'Globe' },
        { href: '/analysis', label: 'Analysis' },
        { href: '/query', label: 'Query' },
        { href: '/compare', label: 'Compare' },
        { href: '/scratchpad', label: 'pencil', title: 'Scratchpad', isSubtle: true },
    ];

    return (
        <header className={`${transparent
            ? "absolute top-0 left-0 w-full z-50 bg-gradient-to-b from-black/60 to-transparent pointer-events-none transition-all duration-300"
            : "border-b border-slate-200/80 backdrop-blur-md bg-white/80 sticky top-0 z-50 transition-all duration-300"
            }`}>
            <div className={`max-w-7xl mx-auto px-6 py-3 flex items-center justify-between ${transparent ? "pointer-events-auto" : ""}`}>
                <div className="flex items-center gap-3">
                    <Link href="/" className="group flex items-center gap-3">
                        <div className="relative w-12 h-12 flex-shrink-0 rounded-full overflow-hidden border border-white/20 shadow-[inset_0_2px_8px_rgba(0,0,0,0.3)] bg-slate-900/50">
                            {/* Inner shine for globe effect */}
                            <div className="absolute inset-0 z-10 rounded-full shadow-[inset_-2px_-2px_6px_rgba(255,255,255,0.1)] pointer-events-none"></div>
                            <GaussianBeamVortex3D size={48} className="scale-125" />
                        </div>

                        <div>
                            <h1 className={`text-xl md:text-2xl font-bold tracking-tight ${transparent ? 'text-white' : ''}`}>
                                <span className={transparent ? "text-white" : "text-blue-600"}>
                                    Geo
                                </span>
                                <span className={transparent ? "text-white/90" : "text-slate-700"}>
                                    Forecaster
                                </span>
                            </h1>
                        </div>
                    </Link>
                </div>

                {/* Desktop Nav */}
                <nav className="hidden lg:flex gap-6 text-sm items-center">
                    {navLinks.map(link => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className={`${link.isSubtle
                                ? `${transparent ? 'text-white/40 hover:text-white/70' : 'text-slate-300 hover:text-slate-500'} transition-colors`
                                : getLinkClass(link.href)
                                }`}
                            title={link.title}
                        >
                            {link.label === 'pencil' ? (
                                <svg
                                    width="14"
                                    height="14"
                                    viewBox="0 0 24 24"
                                    fill="none"
                                    stroke="currentColor"
                                    strokeWidth="2"
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                >
                                    <path d="M17 3a2.85 2.85 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                                    <path d="m15 5 4 4" />
                                </svg>
                            ) : (
                                link.label
                            )}
                        </Link>
                    ))}
                    <Link
                        href="/methodology"
                        className={`${getLinkClass('/methodology')} ${transparent ? 'text-white/60 hover:text-white' : 'text-slate-400 hover:text-slate-600'}`}
                        title="Methodology"
                    >
                        <svg
                            width="16"
                            height="16"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        >
                            <circle cx="12" cy="12" r="10" />
                            <path d="M12 16v-4" />
                            <path d="M12 8h.01" />
                        </svg>
                    </Link>
                </nav>

                {/* Mobile menu button */}
                <button
                    className={`lg:hidden p-2 ${transparent ? 'text-white' : 'text-slate-600 hover:text-slate-800'}`}
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                >
                    {mobileMenuOpen ? (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M18 6L6 18" />
                            <path d="M6 6l12 12" />
                        </svg>
                    ) : (
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M4 12h16" />
                            <path d="M4 6h16" />
                            <path d="M4 18h16" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Mobile Nav */}
            {mobileMenuOpen && (
                <div className={`lg:hidden border-t ${transparent ? 'border-white/20' : 'border-slate-200 bg-white/95 backdrop-blur-md'}`}>
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
                            className={`py-2 ${transparent ? 'text-white/70' : 'text-slate-500 hover:text-slate-700'}`}
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
