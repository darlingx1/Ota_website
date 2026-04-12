// supabase-config.js
const SUPABASE_URL = 'https://qpxionjpakdpbykkwttg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_82qnsZcWrAUSM20eHrvn1w_5XzLfQ5V';

// We attach it to the 'window' so every other file can see it
window.supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);