import { createClient } from "@supabase/supabase-js";

import { SUPABASE_PUBLISHABLE_KEY, SUPABASE_URL } from "./config.js";

export function createSupabaseClient() {
    return createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
        auth: {
            flowType: "pkce",
            detectSessionInUrl: true,
            persistSession: true,
            autoRefreshToken: true
        }
    });
}
