import { NextResponse } from 'next/server';
import { loadCountry } from '@/lib/data';

interface RouteParams {
    params: Promise<{ slug: string }>;
}

export async function GET(request: Request, { params }: RouteParams) {
    const { slug } = await params;
    const country = loadCountry(2010, `${slug}.json`);

    if (!country) {
        return NextResponse.json({ error: 'Country not found' }, { status: 404 });
    }

    return NextResponse.json(country);
}
