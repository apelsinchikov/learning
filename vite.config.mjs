import { defineConfig } from "vite";

export default defineConfig({
    base: "/learning/",

    // PGlite грузит свои .wasm-файлы сам; без этого режим разработки их ломает
    optimizeDeps: {
        exclude: ["@electric-sql/pglite"]
    }
});