'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation({ transparent = false }: { transparent?: boolean }) {
    const pathname = usePathname();

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

                <nav className="flex gap-4 md:gap-8 text-sm md:text-base">
                    <Link href="/" className={getLinkClass('/')}>Dashboard</Link>
                    <Link href="/countries" className={getLinkClass('/countries')}>Countries</Link>
                    <Link href="/globe" className={getLinkClass('/globe')}>Globe 3D</Link>
                    <Link href="/compare" className={getLinkClass('/compare')}>Compare</Link>
                </nav>
            </div>
        </header>
    );
}
