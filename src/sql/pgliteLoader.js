/*
 * Postgres в браузере (PGlite, WebAssembly). Подключается лениво,
 * поэтому в основной бандл не попадает и OpenAPI-курсу ничего не стоит.
 */
export async function loadPglite() {
    const module = await import("@electric-sql/pglite");

    if (!module.PGlite) {
        throw new Error("Движок Postgres загрузился, но в нём нет PGlite.");
    }

    return module.PGlite;
}