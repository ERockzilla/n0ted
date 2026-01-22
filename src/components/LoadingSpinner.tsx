'use client';

import dynamic from 'next/dynamic';

// Dynamically import to avoid SSR issues with Three.js
const GaussianBeamVortex3D = dynamic(
    () => import('@/components/GaussianBeamVortex3D'),
    {
        ssr: false,
        loading: () => (
            <div className="w-16 h-16 rounded-full animate-pulse bg-gradient-to-br from-[#0159A3] to-[#00AA86]" />
        )
    }
);

interface LoadingSpinnerProps {
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'fullpage';
    text?: string;
    className?: string;
}

/**
 * LoadingSpinner - Uses GaussianBeamVortex3D as an animated loading indicator
 */
export default function LoadingSpinner({
    size = 'md',
    text = 'Loading...',
    className = ''
}: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'scale-50',
        md: 'scale-75',
        lg: 'scale-100',
        xl: 'scale-150',
        fullpage: 'scale-[2.5]'
    };

    const containerClasses = {
        sm: 'gap-2',
        md: 'gap-4',
        lg: 'gap-4',
        xl: 'gap-6',
        fullpage: 'gap-8 min-h-[50vh]'
    };

    const textClasses = {
        sm: 'text-xs',
        md: 'text-sm',
        lg: 'text-base',
        xl: 'text-lg',
        fullpage: 'text-xl'
    };

    return (
        <div className={`flex flex-col items-center justify-center ${containerClasses[size]} ${className}`}>
            <div className={`${sizeClasses[size]} origin-center`}>
                <GaussianBeamVortex3D />
            </div>
            {text && (
                <p className={`text-cyan-400 ${textClasses[size]} font-medium animate-pulse`}>
                    {text}
                </p>
            )}
        </div>
    );
}
