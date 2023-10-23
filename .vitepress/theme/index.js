// https://vitepress.dev/guide/custom-theme
import Layout from "./Layout.vue";
import "./style.scss";
import {createPinia} from "pinia";

export default {
    Layout,
    enhanceApp({app, router, siteData}) {
        // ...
        const pinia = createPinia();
        app.use(pinia);
    },
};
