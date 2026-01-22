import { NextResponse } from 'next/server';
import { loadIndex } from '@/lib/data';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const yearParam = searchParams.get('year');
    const year = yearParam ? parseInt(yearParam) : 2020;

    const index = loadIndex(year);

    if (!index) {
        return NextResponse.json({ error: 'Data not found' }, { status: 404 });
    }

    return NextResponse.json(index);
}
