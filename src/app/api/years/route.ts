import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export const dynamic = 'force-static';
export const revalidate = 3600; // Revalidate every hour

export async function GET() {
    try {
        const dataDir = path.join(process.cwd(), 'data');
        const years = new Set<number>();

        // Get years from data directories (complete country data)
        const entries = fs.readdirSync(dataDir, { withFileTypes: true });
        entries
            .filter(e => e.isDirectory() && /^\d{4}$/.test(e.name))
            .forEach(e => years.add(parseInt(e.name)));

        // Also get years from timeseries.json
        const timeseriesPath = path.join(dataDir, '_merged', 'timeseries.json');
        if (fs.existsSync(timeseriesPath)) {
            const content = fs.readFileSync(timeseriesPath, 'utf-8');
            const data = JSON.parse(content);
            // Get years from first country's data
            const firstCountry = Object.values(data)[0] as Record<string, Array<{ year: number }>>;
            if (firstCountry) {
                for (const metric of Object.values(firstCountry)) {
                    if (Array.isArray(metric)) {
                        metric.forEach((point: { year: number }) => years.add(point.year));
                    }
                }
            }
        }

        const sortedYears = Array.from(years).sort((a, b) => b - a); // Most recent first
        return NextResponse.json({ years: sortedYears });
    } catch {
        return NextResponse.json({ years: [2020, 2010] });
    }
}
