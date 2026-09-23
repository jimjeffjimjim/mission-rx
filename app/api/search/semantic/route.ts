import { NextRequest, NextResponse } from 'next/server';
import { searchSemanticFormulary } from '@/lib/semanticSearch';

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

    // 1. Try local Python live inference server if active (0.001s response, arbitrary novel text)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 600);

      const localResponse = await fetch(
        `http://127.0.0.1:5002/search?q=${encodeURIComponent(query)}&limit=${limit}`,
        {
          signal: controller.signal,
          headers: { 'Content-Type': 'application/json' },
        }
      );
      clearTimeout(timeoutId);

      if (localResponse.ok) {
        const liveData = await localResponse.json();
        return NextResponse.json({
          source: 'bge-live-server',
          query,
          results: liveData.results || [],
        });
      }
    } catch (e) {
      // Local server not running or timed out; smoothly fall back to precomputed edge index
    }

    // 2. High-speed edge / precomputed index (Vercel & Offline compliant)
    const matches = searchSemanticFormulary(query, 0.32, limit);

    return NextResponse.json({
      source: 'bge-edge-index',
      query,
      results: matches,
    });
  } catch (error) {
    console.error('Semantic search error:', error);
    return NextResponse.json(
      { error: 'Failed to execute semantic search', results: [] },
      { status: 500 }
    );
  }
}
