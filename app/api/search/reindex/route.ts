import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import path from 'path';
import util from 'util';

const execPromise = util.promisify(exec);

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Re-indexing runs the local Python script that queries dev.db and saves data/bge_semantic_index.json
    const scriptPath = path.join(process.cwd(), 'scripts', 'index_formulary.py');
    
    // Non-blocking trigger or fast execution
    exec(`python "${scriptPath}"`, {
      env: { ...process.env, PYTHONIOENCODING: 'utf-8' }
    }, (error, stdout, stderr) => {
      if (error) {
        console.error('Background reindex error:', error);
      } else {
        console.log('Background reindex completed successfully:', stdout);
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Formulary semantic indexing process initiated using BAAI/bge-large-en-v1.5.',
    });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to trigger re-index' },
      { status: 500 }
    );
  }
}
