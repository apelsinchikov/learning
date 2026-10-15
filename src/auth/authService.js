import { PROVIDERS } from "./config.js";

function toAuthUser(user) {
    if (!user) {
        return null;
    }

    const metadata = user.user_metadata || {};
    const email = user.email ?? null;
    const emailName = email ? email.split("@")[0] : "";

    return {
        id: user.id,
        email,
        name: metadata.full_name || metadata.name || emailName || "Пользователь"
    };
}

/*
 * Тонкая обёртка над supabase-js: вход через внешних провайдеров (OAuth).
 * Пароли и письма не используются: человек подтверждает себя в Google/Яндексе.
 */
export function createAuthService(
    client,
    { redirectTo, cleanUrl = () => {}, providers = PROVIDERS }
) {
    let signingIn = false;

    return {
        async signIn(providerId) {
            const provider = providers.find(item => item.id === providerId);

            if (!provider) {
                throw new Error(`Неизвестный способ входа: ${providerId}`);
            }

            if (signingIn) {
                return;
            }

            signingIn = true;

            try {
                const { error } = await client.auth.signInWithOAuth({
                    provider: provider.supabaseProvider || provider.id,
                    options: { redirectTo }
                });

                if (error) {
                    throw new Error(error.message);
                }
            } finally {
                signingIn = false;
            }
        },

        async signOut() {
            const { error } = await client.auth.signOut();

            if (error) {
                throw new Error(error.message);
            }
        },

        async getUser() {
            const { data } = await client.auth.getSession();

            return toAuthUser(data?.session?.user);
        },

        /* callback получает AuthUser при входе и null при выходе */
        onAuthChange(callback) {
            const { data } = client.auth.onAuthStateChange((event, session) => {
                if (event === "SIGNED_IN") {
                    cleanUrl();
                    callback(toAuthUser(session?.user));
                } else if (event === "SIGNED_OUT") {
                    callback(null);
                }
            });

            return () => data.subscription.unsubscribe();
        }
    };
}
