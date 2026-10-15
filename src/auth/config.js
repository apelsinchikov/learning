/*
 * Публичные настройки Supabase. publishable-ключ можно хранить в коде:
 * безопасность держится на правилах доступа (RLS) в базе, а не на секретности ключа.
 * Секретные ключи (secret / service_role) сюда класть нельзя.
 */
export const SUPABASE_URL = "https://ndotgrgsvyewzisxybkb.supabase.co";

export const SUPABASE_PUBLISHABLE_KEY =
    "sb_publishable_u34UvmdeME0_PsmAnYU5sw_DTmpCCXV";

/*
 * Способы входа. id — наш внутренний идентификатор, supabaseProvider —
 * как провайдер называется в Supabase (если отличается от id).
 */
export const PROVIDERS = [
    { id: "google", label: "Google" }
];
