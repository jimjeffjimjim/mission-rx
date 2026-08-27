import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

let memoryTestingMode = false;

export async function GET() {
  try {
    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('system_settings')
          .select('value')
          .eq('key', 'testing_mode')
          .single();

        if (!error && data) {
          memoryTestingMode = data.value === 'true';
          return NextResponse.json({ testingMode: memoryTestingMode });
        }
      } catch (err) {
        // Fallback to memory
      }
    }

    return NextResponse.json({ testingMode: memoryTestingMode });
  } catch (error) {
    return NextResponse.json({ testingMode: memoryTestingMode });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { testingMode } = body;
    const isModeActive = testingMode === true || testingMode === 'true';
    memoryTestingMode = isModeActive;

    if (supabase) {
      try {
        await supabase
          .from('system_settings')
          .upsert({
            key: 'testing_mode',
            value: isModeActive ? 'true' : 'false',
            updated_at: new Date().toISOString(),
          }, { onConflict: 'key' });
      } catch (err) {
        console.warn('Could not persist testing_mode in Supabase system_settings:', err);
      }
    }

    return NextResponse.json({ success: true, testingMode: memoryTestingMode });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Settings update error' }, { status: 500 });
  }
}
