import { NextResponse } from 'next/server';
import { loadIndex } from '@/lib/data';

export async function GET() {
    const index = loadIndex(2010);

    if (!index) {
        return NextResponse.json({ error: 'Data not found' }, { status: 404 });
    }

    return NextResponse.json(index);
}
