import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-key';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-key';

// Note: Replace with actual Supabase credentials in production

// Client-side Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side Supabase client with service role key
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Server component client
export function createServerSupabaseClient() {
  const cookieStore = cookies();
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
    },
  });
}

// Client component client (for client-side usage)
export function createClientClient() {
  return createClient(supabaseUrl, supabaseAnonKey);
}

// Database schema types
export interface Database {
  public: {
        Tables: {
          wellness_documents: {
            Row: {
              id: string;
              title: string;
              abstract: string;
              authors: string[];
              journal: string;
              publication_date: string;
              doi?: string;
              pmid?: string;
              url?: string;
              study_type: string;
              sample_size?: number;
              conflicts_of_interest?: string[];
              keywords: string[];
              created_at: string;
              updated_at: string;
            };
            Insert: {
              id?: string;
              title: string;
              abstract: string;
              authors: string[];
              journal: string;
              publication_date: string;
              doi?: string;
              pmid?: string;
              url?: string;
              study_type: string;
              sample_size?: number;
              conflicts_of_interest?: string[];
              keywords: string[];
              created_at?: string;
              updated_at?: string;
            };
            Update: {
              id?: string;
              title?: string;
              abstract?: string;
              authors?: string[];
              journal?: string;
              publication_date?: string;
              doi?: string;
              pmid?: string;
              url?: string;
              study_type?: string;
              sample_size?: number;
              conflicts_of_interest?: string[];
              keywords?: string[];
              created_at?: string;
              updated_at?: string;
            };
          };
          wellness_chunks: {
            Row: {
              id: string;
              document_id: string;
              content: string;
              chunk_index: number;
              embedding?: number[];
              metadata: any;
              created_at: string;
            };
            Insert: {
              id?: string;
              document_id: string;
              content: string;
              chunk_index: number;
              embedding?: number[];
              metadata: any;
              created_at?: string;
            };
            Update: {
              id?: string;
              document_id?: string;
              content?: string;
              chunk_index?: number;
              embedding?: number[];
              metadata?: any;
              created_at?: string;
            };
          };
          wellness_citations: {
            Row: {
              id: string;
              document_id: string;
              chunk_id: string;
              text: string;
              position: number;
              created_at: string;
            };
            Insert: {
              id?: string;
              document_id: string;
              chunk_id: string;
              text: string;
              position: number;
              created_at?: string;
            };
            Update: {
              id?: string;
              document_id?: string;
              chunk_id?: string;
              text?: string;
              position?: number;
              created_at?: string;
            };
          };
    };
  };
}
