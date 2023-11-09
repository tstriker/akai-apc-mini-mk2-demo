<script setup>
    import {markRaw} from "vue";
    import {useData} from "vitepress";
    const {site, frontmatter} = useData();
</script>

<script>
    import {APCMiniMk2} from "akai-apc-mini-mk2";

    import APC from "../../src/APC.vue";

    import {SnakeState} from "../../src/snake.js";
    import {PaintState} from "../../src/paint.js";
    import {RainbowState} from "../../src/rainbow.js";
    import Rain from "../../src/rain.js";

    export default {
        name: "LayoutBase",
        components: {
            APC,
        },

        data() {
            return {
                mk2: markRaw(new APCMiniMk2()),
                states: markRaw({
                    paint: new PaintState(),
                    snake: new SnakeState(),
                    rainbow: new RainbowState(),
                    rain: new Rain(),
                }),

                pixels: [],
            };
        },

        methods: {
            onNote(evt) {
                let handlers = {
                    clipStop: () => this.mk2.setState(this.states.paint),
                    solo: () => this.mk2.setState(this.states.snake),
                    mute: () => this.mk2.setState(this.states.rainbow),
                    recArm: () => this.mk2.setState(this.states.rain),
                };

                if (handlers[evt.key]) {
                    handlers[evt.key]();
                }
            },
        },

        async mounted() {
            window.addEventListener("noteon", this.onNote);

            await this.mk2.connect({
                sysex: true,
                beforePaint: () => {
                    this.pixels = this.mk2.pixels;
                },
            });
            this.mk2.setState(this.states.paint);

            this.mk2.clipStopButton.toggled = true;
            this.mk2.soloButton.toggled = true;
            this.mk2.muteButton.toggled = true;
        },

        beforeUnmount() {
            window.removeEventListener("noteon", this.onNote);
            this.mk2.disconnect();
        },
    };
</script>

<template>
    <div class="page-container">
        <h1>{{ site.title }}</h1>

        <div style="display: flex">
            <APC :pixels="pixels" />
        </div>

        <!-- <Content /> -->
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

        .apc {
            margin: 0 auto;
            width: auto;
            align-self: center;
            justify-self: center;
        }
    }
</style>
