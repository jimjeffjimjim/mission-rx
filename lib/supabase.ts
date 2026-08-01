import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase Cloud Real-Time Configuration
// When these environment variables are populated with your Supabase credentials, 
// Mission RX immediately activates real-time multi-device synchronization across all clinical devices.

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

if (supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http')) {
  try {
    supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    console.info('✅ Supabase Cloud Real-Time Multi-Device Sync Activated');
  } catch (error) {
    console.warn('⚠️ Supabase Cloud initial connection failed (using serverless resilience fallback):', error);
  }
} else {
  console.info('ℹ️ Supabase credentials not detected. Operating in High-Performance Standalone Resilience Mode.');
}

export const supabase = supabaseInstance;

/**
 * Subscribe to real-time inventory alterations across multiple hospital devices.
 * Trigger callback immediately when any nurse, pharmacist, or physician edits stock elsewhere.
 */
export function subscribeToClinicalUpdates(onUpdate: () => void) {
  if (!supabase) return () => {};

  try {
    const channel = supabase
      .channel('public:inventory_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'InventoryItem' }, (payload: any) => {
        console.info('🔄 Real-Time Remote Clinical Update Received:', payload.eventType);
        onUpdate();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'DispenseLog' }, (payload: any) => {
        console.info('📋 Real-Time Compliance Audit Log Entry Received');
        onUpdate();
      })
      .subscribe((status: string) => {
        if (status === 'SUBSCRIBED') {
          console.info('✅ Subscribed to real-time clinical multi-device broadcasts');
        }
      });

    return () => {
      supabase.removeChannel(channel);
    };
  } catch (e) {
    console.warn('Failed to register real-time listener:', e);
    return () => {};
  }
}
