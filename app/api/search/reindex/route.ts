import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest) {
  return NextResponse.json({
    success: true,
    message: 'Formulary smart search index is dynamic and memory-resident.',
  });
}
