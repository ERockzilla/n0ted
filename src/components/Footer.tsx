'use client';

import Link from 'next/link';
import dynamic from 'next/dynamic';

// Dynamically import to avoid SSR issues with Three.js
const GaussianBeamVortex3D = dynamic(
    () => import('@/components/GaussianBeamVortex3D'),
    {
        ssr: false,
        loading: () => (
            <div className="w-12 h-12 rounded-full animate-pulse bg-gradient-to-br from-[#0159A3] to-[#00AA86]" />
        )
    }
);

export default function Footer() {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="mt-auto border-t border-slate-200/50 bg-gradient-to-b from-slate-50 to-slate-100">
            <div className="max-w-7xl mx-auto px-6 py-8">
                <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                    {/* Logo and Branding */}
                    <div className="flex items-center gap-4">
                        <div className="scale-50 origin-left">
                            <GaussianBeamVortex3D />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">
                                <span className="text-blue-600">Geo</span>
                                <span className="text-slate-700">Forecaster</span>
                            </h3>
                            <p className="text-xs text-slate-500">
                                CIA World Factbook Analysis
                            </p>
                        </div>
                    </div>

                    {/* Links */}
                    <nav className="flex flex-wrap items-center justify-center gap-4 text-sm text-slate-500">
                        <Link href="/methodology" className="hover:text-blue-600 transition">
                            Methodology
                        </Link>
                        <span className="text-slate-300">•</span>
                        <Link href="/trends" className="hover:text-blue-600 transition">
                            Trends
                        </Link>
                        <span className="text-slate-300">•</span>
                        <Link href="/analysis" className="hover:text-blue-600 transition">
                            Analysis
                        </Link>
                        <span className="text-slate-300">•</span>
                        <Link href="/globe" className="hover:text-blue-600 transition">
                            Globe
                        </Link>
                    </nav>

                    {/* Copyright */}
                    <div className="text-xs text-slate-400 text-center md:text-right">
                        <p>Data sourced from CIA World Factbook</p>
                        <p className="mt-1">© {currentYear} GeoForecaster</p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
