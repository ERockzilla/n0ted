'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { CountryData } from '@/lib/data';

// Dynamic import with no SSR to avoid "window is not defined"
const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

interface Props {
    countries: CountryData[];
}

interface GeoFeature {
    type: string;
    properties: {
        ADMIN: string;
        ISO_A3: string;
        gdp?: number;
        gdp_formatted?: string;
        color?: string;
        [key: string]: unknown;
    };
    geometry: unknown;
}

export default function InteractiveGlobe({ countries }: Props) {
    const [geoData, setGeoData] = useState<GeoFeature[]>([]);
    const [hoverD, setHoverD] = useState<GeoFeature | null>(null);
    const globeRef = useRef<any>(undefined);

    useEffect(() => {
        // Load GeoJSON
        fetch('//unpkg.com/world-atlas/countries-110m.json')
            .then(res => res.json())
            .then(data => {
                // We need converting to actual GeoJSON if using topojson, 
                // but let's use a direct geojson source for simplicity
                fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson')
                    .then(res => res.json())
                    .then((geo: { features: GeoFeature[] }) => {

                        // Enrich GeoJSON with our Factbook data
                        const enrichedFeatures = geo.features.map(feat => {
                            const name = feat.properties.ADMIN;

                            // Find matching factbook country
                            // normalized matching logic
                            const match = countries.find(c => {
                                const cName = c.country.toLowerCase();
                                const fName = name.toLowerCase();

                                return (
                                    cName === fName ||
                                    cName.includes(fName) ||
                                    fName.includes(cName) ||
                                    (cName === 'united states' && fName === 'united states of america') ||
                                    (cName === 'united kingdom' && fName === 'united kingdom') ||
                                    (cName === 'korea, south' && fName === 'south korea') ||
                                    (cName === 'korea, north' && fName === 'north korea') ||
                                    (cName === 'russia' && fName === 'russia') ||
                                    (cName === 'china' && fName === 'china') ||
                                    (cName === 'vietnam' && fName === 'vietnam')
                                );
                            });

                            if (match && match.economy.gdp_ppp_billions) {
                                const gdp = match.economy.gdp_ppp_billions * 1e9; // Convert to actual dollars

                                // Color scale: Red (low) -> Yellow -> Green (high)
                                // Logarithmic scale for better visual distribution
                                const maxGdp = 15e12; // ~15 Trillion (China/US range in 2010)
                                const gdpRatio = Math.min(gdp / maxGdp, 1);

                                // Simple color interpolation
                                let color = '#ff0000';
                                if (gdpRatio < 0.1) color = '#ff4444';      // Very Low
                                else if (gdpRatio < 0.25) color = '#ffaa00'; // Low-Mid
                                else if (gdpRatio < 0.5) color = '#ffff00';  // Mid
                                else if (gdpRatio < 0.75) color = '#88ff00'; // High
                                else color = '#00ff00';                      // Very High

                                return {
                                    ...feat,
                                    properties: {
                                        ...feat.properties,
                                        gdp: gdp,
                                        gdp_formatted: `$${match.economy.gdp_ppp_billions!.toLocaleString()}B`,
                                        color: color,
                                        leader: match.political.chief_of_state
                                    }
                                };
                            }

                            return {
                                ...feat,
                                properties: {
                                    ...feat.properties,
                                    gdp: 0,
                                    gdp_formatted: 'N/A',
                                    color: '#333333' // Default gray
                                }
                            };
                        });

                        setGeoData(enrichedFeatures);
                    });
            });
    }, [countries]);

    return (
        <div className="h-[calc(100vh-80px)] w-full"> {/* Adjust height for header */}
            <Globe
                ref={globeRef}
                globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
                backgroundImageUrl="//unpkg.com/three-globe/example/img/night-sky.png"
                polygonsData={geoData}
                polygonAltitude={d => (d as GeoFeature).properties.gdp ? Math.sqrt((d as GeoFeature).properties.gdp!) / 500000 : 0.01}
                polygonCapColor={d => (d as GeoFeature).properties.color || '#333'}
                polygonSideColor={() => 'rgba(255, 255, 255, 0.1)'}
                polygonStrokeColor={() => '#111'}
                polygonLabel={({ properties: d }: any) => `
          <div style="background: rgba(0,0,0,0.8); padding: 5px; border-radius: 4px; color: white; font-family: sans-serif;">
            <b style="font-size: 1.2em;">${d.ADMIN}</b> <br />
            GDP (PPP): <span style="color: ${d.color}">${d.gdp_formatted}</span><br/>
            ${d.leader ? `<span style="font-size: 0.8em; color: #aaa;">${d.leader}</span>` : ''}
          </div>
        `}
                onPolygonHover={setHoverD as any}
                polygonsTransitionDuration={300}
            />
        </div>
    );
}
