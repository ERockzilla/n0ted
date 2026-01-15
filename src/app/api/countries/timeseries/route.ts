import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const timeseriesPath = path.join(process.cwd(), 'data', '_merged', 'timeseries.json');
        
        if (!fs.existsSync(timeseriesPath)) {
            return NextResponse.json({ 
                data: null, 
                message: 'Time series data not available. Run merge_timeseries.py to generate.' 
            });
        }

        const content = fs.readFileSync(timeseriesPath, 'utf-8');
        const data = JSON.parse(content);

        return NextResponse.json({ data });
    } catch (error) {
        return NextResponse.json({ 
            data: null, 
            error: 'Failed to load time series data' 
        }, { status: 500 });
    }
}
