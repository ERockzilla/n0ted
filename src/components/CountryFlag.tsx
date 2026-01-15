'use client';

import { getCountryCode } from '@/lib/countryFlags';
import Image from 'next/image';

interface CountryFlagProps {
    country: string;
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

const SIZES = {
    sm: { width: 20, height: 15 },
    md: { width: 28, height: 21 },
    lg: { width: 40, height: 30 },
};

export default function CountryFlag({ country, size = 'md', className = '' }: CountryFlagProps) {
    const code = getCountryCode(country);
    const dimensions = SIZES[size];

    if (!code) {
        // Fallback placeholder for countries without flag mapping
        return (
            <div 
                className={`bg-slate-700 rounded flex items-center justify-center text-slate-500 text-xs ${className}`}
                style={{ width: dimensions.width, height: dimensions.height }}
            >
                --
            </div>
        );
    }

    const flagUrl = `https://purecatamphetamine.github.io/country-flag-icons/3x2/${code}.svg`;

    return (
        <Image
            src={flagUrl}
            alt={`${country} flag`}
            width={dimensions.width}
            height={dimensions.height}
            className={`rounded shadow-sm ${className}`}
            unoptimized // External SVG, skip optimization
        />
    );
}
