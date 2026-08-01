import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase Cloud Real-Time & Cloud Database Configuration
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://dqnkbolcssrbckqwmagv.supabase.co';
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRxbmtib2xjc3NyYmNrcXdtYWd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU1MjcxODksImV4cCI6MjEwMTEwMzE4OX0.HJ294vvn5WomiMAzhT_oUD137DQ19PPVDc-wMWFM1so';

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
    console.warn('⚠️ Supabase Cloud connection fallback:', error);
  }
}

export const supabase = supabaseInstance;

/**
 * Subscribe to real-time inventory alterations across multiple hospital devices.
 */
export function subscribeToClinicalUpdates(onUpdate: () => void) {
  if (!supabase) return () => {};

  try {
    const channel = supabase
      .channel('public:inventory_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventory_items' }, (payload: any) => {
        console.info('🔄 Real-Time Remote Clinical Update Received:', payload.eventType);
        onUpdate();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'dispense_logs' }, (payload: any) => {
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
