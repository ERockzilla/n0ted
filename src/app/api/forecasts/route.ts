import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

export async function GET() {
    try {
        const filePath = path.join(process.cwd(), 'data', '_forecasts', 'forecasts.json');

        if (!fs.existsSync(filePath)) {
            return NextResponse.json({ error: 'Forecast data not found' }, { status: 404 });
        }

        const fileContent = fs.readFileSync(filePath, 'utf-8');
        const data = JSON.parse(fileContent);

        return NextResponse.json(data);
    } catch (error) {
        console.error('Error serving forecast data:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}
