'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { CountryData } from '@/lib/data';

// Dynamic import with no SSR to avoid "window is not defined"
const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

export type GlobeMetric = 'gdp' | 'population' | 'military' | 'growth' | 'trade';

interface Props {
    countries: CountryData[];
    activeMetric?: GlobeMetric;
    onCountryClick?: (countrySlug: string) => void;
    showArcs?: boolean;
}

interface GeoFeature {
    type: string;
    properties: {
        ADMIN: string;
        ISO_A3: string;
        factbookData?: CountryData;
        metricValue?: number;
        metricFormatted?: string;
        color?: string;
        slug?: string;
        [key: string]: unknown;
    };
    geometry: unknown;
}

interface ArcData {
    startLat: number;
    startLng: number;
    endLat: number;
    endLng: number;
    color: string;
    label: string;
}

// Country name to approximate coordinates (for arc endpoints)
const COUNTRY_COORDS: Record<string, [number, number]> = {
    'united states': [39.8, -98.5],
    'china': [35.8, 104.1],
    'japan': [36.2, 138.2],
    'germany': [51.1, 10.4],
    'united kingdom': [55.3, -3.4],
    'france': [46.2, 2.2],
    'india': [20.5, 78.9],
    'italy': [41.8, 12.5],
    'brazil': [-14.2, -51.9],
    'canada': [56.1, -106.3],
    'russia': [61.5, 105.3],
    'south korea': [35.9, 127.7],
    'australia': [-25.2, 133.7],
    'spain': [40.4, -3.7],
    'mexico': [23.6, -102.5],
    'indonesia': [-0.7, 113.9],
    'netherlands': [52.1, 5.2],
    'saudi arabia': [23.8, 45.0],
    'turkey': [38.9, 35.2],
    'switzerland': [46.8, 8.2],
};

const METRIC_CONFIG: Record<GlobeMetric, {
    label: string;
    getValue: (c: CountryData) => number | undefined;
    format: (v: number) => string;
    colorScale: (ratio: number) => string;
    maxValue: number;
    unit: string;
}> = {
    gdp: {
        label: 'GDP (PPP)',
        getValue: (c) => c.economy.gdp_ppp_billions ? c.economy.gdp_ppp_billions * 1e9 : undefined,
        format: (v) => v >= 1e12 ? `$${(v / 1e12).toFixed(1)}T` : `$${(v / 1e9).toFixed(0)}B`,
        colorScale: (ratio) => {
            if (ratio < 0.05) return '#ef4444';
            if (ratio < 0.15) return '#f97316';
            if (ratio < 0.35) return '#eab308';
            if (ratio < 0.6) return '#84cc16';
            return '#22c55e';
        },
        maxValue: 15e12,
        unit: 'USD'
    },
    population: {
        label: 'Population',
        getValue: (c) => c.demographics.population,
        format: (v) => v >= 1e9 ? `${(v / 1e9).toFixed(2)}B` : v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${(v / 1e3).toFixed(0)}K`,
        colorScale: (ratio) => {
            if (ratio < 0.01) return '#a855f7';
            if (ratio < 0.05) return '#8b5cf6';
            if (ratio < 0.15) return '#6366f1';
            if (ratio < 0.4) return '#3b82f6';
            return '#06b6d4';
        },
        maxValue: 1.4e9,
        unit: 'people'
    },
    military: {
        label: 'Military Spending',
        getValue: (c) => c.military.expenditure_pct_gdp,
        format: (v) => `${v.toFixed(1)}% GDP`,
        colorScale: (ratio) => {
            if (ratio < 0.2) return '#22d3ee';
            if (ratio < 0.4) return '#facc15';
            if (ratio < 0.6) return '#fb923c';
            if (ratio < 0.8) return '#f87171';
            return '#dc2626';
        },
        maxValue: 15,
        unit: '% of GDP'
    },
    growth: {
        label: 'GDP Growth',
        getValue: (c) => c.economy.gdp_growth_pct,
        format: (v) => `${v > 0 ? '+' : ''}${v.toFixed(1)}%`,
        colorScale: (ratio) => {
            // Growth can be negative, so ratio is normalized differently
            if (ratio < 0.2) return '#dc2626';
            if (ratio < 0.4) return '#f97316';
            if (ratio < 0.5) return '#fbbf24';
            if (ratio < 0.7) return '#a3e635';
            return '#22c55e';
        },
        maxValue: 20,
        unit: '%'
    },
    trade: {
        label: 'Trade Balance',
        getValue: (c) => {
            if (c.economy.exports_billions && c.economy.imports_billions) {
                return c.economy.exports_billions - c.economy.imports_billions;
            }
            return undefined;
        },
        format: (v) => `${v > 0 ? '+' : ''}$${Math.abs(v).toFixed(0)}B`,
        colorScale: (ratio) => {
            // Trade balance: green for surplus, red for deficit
            if (ratio < 0.3) return '#dc2626';
            if (ratio < 0.45) return '#f97316';
            if (ratio < 0.55) return '#fbbf24';
            if (ratio < 0.7) return '#84cc16';
            return '#22c55e';
        },
        maxValue: 300, // Centered around 0, so this is the range
        unit: 'USD'
    }
};

export default function InteractiveGlobe({ 
    countries, 
    activeMetric = 'gdp',
    onCountryClick,
    showArcs = false
}: Props) {
    const [geoData, setGeoData] = useState<GeoFeature[]>([]);
    const [arcsData, setArcsData] = useState<ArcData[]>([]);
    const [hoverD, setHoverD] = useState<GeoFeature | null>(null);
    const globeRef = useRef<any>(undefined);
    const router = useRouter();

    const config = METRIC_CONFIG[activeMetric];

    // Name matching function
    const findMatchingCountry = useCallback((geoName: string): CountryData | undefined => {
        const normalizedGeo = geoName.toLowerCase();
        
        return countries.find(c => {
            const cName = c.country.toLowerCase();
            return (
                cName === normalizedGeo ||
                cName.includes(normalizedGeo) ||
                normalizedGeo.includes(cName) ||
                (cName === 'united states' && normalizedGeo === 'united states of america') ||
                (cName === 'korea, south' && normalizedGeo === 'south korea') ||
                (cName === 'korea, north' && normalizedGeo === 'north korea') ||
                (cName === 'congo, democratic republic of the' && normalizedGeo.includes('dem') && normalizedGeo.includes('congo')) ||
                (cName === 'congo, republic of the' && normalizedGeo === 'republic of the congo')
            );
        });
    }, [countries]);

    // Generate trade arcs
    useEffect(() => {
        if (!showArcs) {
            setArcsData([]);
            return;
        }

        // Create arcs for top trading relationships
        const arcs: ArcData[] = [];
        const topEconomies = countries
            .filter(c => c.economy.exports_billions && c.economy.exports_billions > 100)
            .slice(0, 10);

        topEconomies.forEach(country => {
            const countryName = country.country.toLowerCase();
            const coords = COUNTRY_COORDS[countryName];
            if (!coords) return;

            // Connect to major trade partners (simplified - connect to top 3 economies)
            const partners = ['united states', 'china', 'germany', 'japan'].filter(p => p !== countryName);
            partners.slice(0, 2).forEach(partner => {
                const partnerCoords = COUNTRY_COORDS[partner];
                if (partnerCoords) {
                    arcs.push({
                        startLat: coords[0],
                        startLng: coords[1],
                        endLat: partnerCoords[0],
                        endLng: partnerCoords[1],
                        color: 'rgba(59, 130, 246, 0.6)',
                        label: `${country.country} ↔ ${partner}`
                    });
                }
            });
        });

        setArcsData(arcs);
    }, [countries, showArcs]);

    useEffect(() => {
        fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson')
            .then(res => res.json())
            .then((geo: { features: GeoFeature[] }) => {
                const enrichedFeatures = geo.features.map(feat => {
                    const name = feat.properties.ADMIN;
                    const match = findMatchingCountry(name);

                    if (match) {
                        const rawValue = config.getValue(match);
                        let normalizedRatio = 0;
                        let color = '#374151';

                        if (rawValue !== undefined) {
                            if (activeMetric === 'trade') {
                                // Trade balance needs special handling (can be negative)
                                normalizedRatio = (rawValue + config.maxValue) / (2 * config.maxValue);
                            } else if (activeMetric === 'growth') {
                                // Growth can be negative
                                normalizedRatio = (rawValue + 10) / (config.maxValue + 10);
                            } else {
                                normalizedRatio = Math.min(rawValue / config.maxValue, 1);
                            }
                            color = config.colorScale(Math.max(0, Math.min(1, normalizedRatio)));
                        }

                        const slug = match.country.toLowerCase().replace(/\s+/g, '_').replace(/,/g, '');

                        return {
                            ...feat,
                            properties: {
                                ...feat.properties,
                                factbookData: match,
                                metricValue: rawValue,
                                metricFormatted: rawValue !== undefined ? config.format(rawValue) : 'N/A',
                                color,
                                slug
                            }
                        };
                    }

                    return {
                        ...feat,
                        properties: {
                            ...feat.properties,
                            metricValue: undefined,
                            metricFormatted: 'N/A',
                            color: '#1f2937',
                            slug: undefined
                        }
                    };
                });

                setGeoData(enrichedFeatures);
            });
    }, [countries, activeMetric, config, findMatchingCountry]);

    const handlePolygonClick = useCallback((polygon: GeoFeature) => {
        const slug = polygon.properties.slug;
        if (slug) {
            if (onCountryClick) {
                onCountryClick(slug);
            } else {
                router.push(`/countries/${slug}`);
            }
        }
    }, [router, onCountryClick]);

    const getAltitude = useCallback((d: GeoFeature) => {
        const value = d.properties.metricValue;
        if (value === undefined) return 0.005;

        if (activeMetric === 'trade') {
            return Math.abs(value) / 1000 + 0.01;
        }
        if (activeMetric === 'growth') {
            return Math.max(0.01, (value + 5) / 50);
        }
        if (activeMetric === 'military') {
            return value / 20 + 0.01;
        }
        if (activeMetric === 'population') {
            return Math.sqrt(value) / 50000 + 0.01;
        }
        // GDP
        return Math.sqrt(value) / 500000 + 0.01;
    }, [activeMetric]);

    return (
        <div className="h-full w-full relative">
            <Globe
                ref={globeRef}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                polygonsData={geoData}
                polygonAltitude={d => getAltitude(d as GeoFeature)}
                polygonCapColor={d => (d as GeoFeature).properties.color || '#1f2937'}
                polygonSideColor={() => 'rgba(255, 255, 255, 0.08)'}
                polygonStrokeColor={() => '#000'}
                polygonLabel={({ properties: d }: any) => `
                    <div style="background: rgba(15, 23, 42, 0.95); padding: 12px 16px; border-radius: 8px; color: white; font-family: system-ui, sans-serif; border: 1px solid rgba(148, 163, 184, 0.2); min-width: 180px;">
                        <div style="font-size: 1.1em; font-weight: 600; margin-bottom: 8px; color: #f1f5f9;">${d.ADMIN}</div>
                        <div style="display: flex; justify-content: space-between; align-items: center; padding: 4px 0; border-top: 1px solid rgba(148, 163, 184, 0.1);">
                            <span style="color: #94a3b8; font-size: 0.85em;">${config.label}:</span>
                            <span style="color: ${d.color}; font-weight: 600;">${d.metricFormatted}</span>
                        </div>
                        ${d.factbookData ? `
                            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(148, 163, 184, 0.1); font-size: 0.8em; color: #64748b;">
                                ${d.factbookData.political?.chief_of_state ? `<div style="margin-top: 2px;">👤 ${d.factbookData.political.chief_of_state}</div>` : ''}
                            </div>
                            <div style="margin-top: 8px; font-size: 0.75em; color: #22d3ee; cursor: pointer;">Click to view details →</div>
                        ` : ''}
                    </div>
                `}
                onPolygonHover={setHoverD as any}
                onPolygonClick={(polygon: any) => handlePolygonClick(polygon as GeoFeature)}
                polygonsTransitionDuration={300}
                arcsData={arcsData}
                arcColor={'color'}
                arcDashLength={0.4}
                arcDashGap={0.2}
                arcDashAnimateTime={1500}
                arcStroke={0.5}
            />

            {/* Hover indicator */}
            {hoverD && hoverD.properties.slug && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-slate-900/90 px-4 py-2 rounded-full border border-cyan-500/30 text-cyan-400 text-sm backdrop-blur-sm">
                    Click to explore {hoverD.properties.ADMIN}
                </div>
            )}
        </div>
    );
}

export { METRIC_CONFIG };
