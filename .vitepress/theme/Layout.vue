<script setup>
    import {useData} from "vitepress";

    // https://vitepress.dev/reference/runtime-api#usedata
    const {site, frontmatter} = useData();
</script>

<template>
    <div class="page-container">
        <template v-if="frontmatter.home">
            <h1>{{ site.title }}</h1>
            <p>{{ site.description }}</p>
            <ul>
                <li><a href="/snake.html">Snake</a></li>
                <li><a href="/palette.html">Palette</a></li>
            </ul>
        </template>
        <template v-else>
            <Content />
        </template>
    </div>
</template>

<style lang="scss">
    .page-container {
    }
</style>
