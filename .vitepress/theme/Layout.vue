<script setup>
    // https://vitepress.dev/reference/runtime-api#usedata
    import {useData} from "vitepress";
    const {site, frontmatter} = useData();
</script>

<script>
    export default {
        name: "LayoutBase",
        data() {
            return {
                ready: false,
            };
        },

        mounted() {},
    };
</script>

<template>
    <div class="page-container">
        <h1>{{ site.title }}</h1>

        <div class="links">
            <a href="/palette.html">Palette</a>
            <a href="/fill.html">Fill</a>
            <a href="/rain.html">Rain</a>
        </div>

        <Content />
    </div>
</template>

<style lang="scss">
    .page-container {
        background: #222;
        color: #fff;
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 1em;
        overflow-y: auto;

        .links {
            display: flex;
            gap: 1em;
            margin: 1em 0;
        }

        a {
            color: aqua;
        }
    }
</style>
