import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation({ transparent = false }: { transparent?: boolean }) {
    // Use a simple prop for styling instead of hooks if possible for server components, 
    // but since we need active state highlighting, a client component for the nav links is often best.
    // However, simplicity is key here. We'll make it a server component that accepts a transparent prop.

    const linkBase = transparent
        ? "text-slate-300 hover:text-white shadow-black drop-shadow-md"
        : "text-slate-300 hover:text-white";

    const activeBase = transparent
        ? "text-cyan-400 font-medium shadow-black drop-shadow-md"
        : "text-cyan-400 font-medium";

    return (
        <header className={`${transparent
                ? "absolute top-0 left-0 w-full z-50 bg-gradient-to-b from-black/80 to-transparent pointer-events-none"
                : "border-b border-slate-700/50 backdrop-blur-sm bg-slate-900/50 sticky top-0 z-50"
            }`}>
            <div className={`max-w-7xl mx-auto px-6 py-4 flex items-center justify-between ${transparent ? "pointer-events-auto" : ""}`}>
                <div className="flex items-center gap-6">
                    <Link href="/" className="group">
                        <h1 className="text-2xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent group-hover:from-cyan-300 group-hover:to-blue-400 transition-all">
                            🌍 GeoForecaster
                        </h1>
                        {!transparent && <p className="text-xs text-slate-400">CIA World Factbook Analysis</p>}
                    </Link>

                    {/* External Link */}
                    <div className="hidden md:block h-6 w-px bg-slate-700 mx-2"></div>
                    <a
                        href="https://rockrun.cloud"
                        className={`hidden md:flex items-center gap-2 text-sm font-medium transition ${transparent ? "text-slate-300 hover:text-cyan-400" : "text-slate-400 hover:text-cyan-400"
                            }`}
                    >
                        ← RockRun.cloud
                    </a>
                </div>

                <nav className="flex gap-6 text-sm md:text-base font-medium">
                    <NavLink href="/" label="Dashboard" base={linkBase} active={activeBase} />
                    <NavLink href="/countries" label="Countries" base={linkBase} active={activeBase} />
                    <NavLink href="/globe" label="Globe 3D" base={linkBase} active={activeBase} />
                    <NavLink href="/compare" label="Compare" base={linkBase} active={activeBase} />
                </nav>
            </div>
        </header>
    );
}

// Simple helper to check active state isn't trivial in Server Component 
// without passing current path prop. 
// For simplicity in this quick refactor, we'll use a client wrapper for the specific links 
// OR just use a client component for the whole Nav. Let's make the whole Nav a client component.
