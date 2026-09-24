import { NextRequest, NextResponse } from 'next/server';
import { searchSemanticFormulary } from '@/lib/smartSearch';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q') || '';
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 15;

    if (!query.trim()) {
      return NextResponse.json({ results: [], source: 'empty' });
    }

    // High-speed, zero-dependency smart search (order-independent, typo-tolerant, brand-aliased)
    const matches = searchSemanticFormulary(query, 0.30, limit);

    return NextResponse.json({
      source: 'smart-search',
      query,
      results: matches,
    });
  } catch (error) {
    console.error('Smart search error:', error);
    return NextResponse.json(
      { error: 'Failed to execute smart search', results: [] },
      { status: 500 }
    );
  }
}
