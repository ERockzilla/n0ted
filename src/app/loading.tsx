'use client';

import dynamic from 'next/dynamic';

// Dynamically import to avoid SSR issues with Three.js
const GaussianBeamVortex3D = dynamic(
    () => import('@/components/GaussianBeamVortex3D'),
    {
        ssr: false,
        loading: () => (
            <div className="w-[100px] h-[100px] rounded-full animate-pulse bg-gradient-to-br from-[#0159A3] to-[#00AA86]" />
        )
    }
);

export default function Loading() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            <div className="flex flex-col items-center gap-6">
                <GaussianBeamVortex3D />
                <div className="flex flex-col items-center gap-2">
                    <p className="text-cyan-400 text-lg font-medium animate-pulse">
                        Loading...
                    </p>
                    <div className="w-48 h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-cyan-500 to-teal-500 animate-loading-bar" />
                    </div>
                </div>
            </div>

            <style jsx>{`
        @keyframes loading-bar {
          0% { width: 0%; transform: translateX(0); }
          50% { width: 70%; }
          100% { width: 100%; transform: translateX(100%); }
        }
        .animate-loading-bar {
          animation: loading-bar 1.5s ease-in-out infinite;
        }
      `}</style>
        </div>
    );
}
