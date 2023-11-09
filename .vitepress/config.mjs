import {defineConfig} from "vitepress";

// https://vitepress.dev/reference/site-config
export default defineConfig({
    title: "APC Mini Mk2 Demo",
    description: "AKAI APC Mini Mk2 Demo",
    srcDir: "./pages",
    base: "/apc-mini-mk2",

    // because i'm lazy, showing this lot into my github.io page
    outDir: "../tstriker.github.io/apc-mini-mk2",
});
