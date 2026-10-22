/*
 * Postgres в браузере (PGlite: Postgres, собранный в WebAssembly).
 *
 * Движок подключается ЛЕНИВО и с CDN, а не из npm-пакета: так он не попадает
 * в основной бандл и никак не влияет на тех, кто открыл курс OpenAPI.
 * Если захочется отдавать его с собственного сайта, достаточно
 * поставить пакет @electric-sql/pglite и заменить загрузчик ниже.
 */

export const PGLITE_VERSION = "0.2.17";

export const PGLITE_URL =
    `https://cdn.jsdelivr.net/npm/@electric-sql/pglite@${PGLITE_VERSION}/dist/index.js`;

export async function loadPglite(url = PGLITE_URL) {
    const module = await import(/* @vite-ignore */ url);

    if (!module.PGlite) {
        throw new Error("Движок Postgres загрузился, но в нём нет PGlite.");
    }

    return module.PGlite;
}
