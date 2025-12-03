import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Event = {
  id: string;
  title: string;
  description: string;
  target_cents: number;
  raised_cents: number;
  event_type: string;
  image_url: string;
  organizer_id: string;
  wallet_address: string | null;
  is_private: boolean;
  origin_ip_id: string | null;
  origin_nft_token_id: bigint | null;
  created_at: string;
  updated_at: string;
};

export type Contribution = {
  id: string;
  event_id: string;
  amount_cents: number;
  contributor_email: string;
  contributor_name: string;
  origin_share_id: string | null;
  created_at: string;
};
