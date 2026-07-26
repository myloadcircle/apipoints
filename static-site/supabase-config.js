// Supabase configuration
const SUPABASE_URL = 'https://kktblezpchfsoovxbgcd.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_2NiWJlBrp5wGywLL919bzA_5Y5WExGG';

// Initialize Supabase client
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
