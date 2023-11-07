<script>
    import {APCMiniMk2} from "akai-apc-mini-mk2";

    import {SnakeState} from "./snake.js";

    export default {
        name: "Snake",
        data() {
            return {
                sortedColors: [],
                selectedColors: [],

                snakeTimeout: null,
                direction: [1, 0],

                mk2: null,
                speed: 500,
            };
        },

        methods: {
            toggleColor(col) {
                let simple = {idx: col.idx, hex: col.hex};

                let idx = this.selectedColors.map(s => s.hex).indexOf(simple.hex);
                if (idx != -1) {
                    this.selectedColors.splice(idx, 1);
                } else {
                    this.selectedColors.push(simple);
                }

                console.log(JSON.stringify(this.selectedColors));
            },
        },

        async mounted() {
            this.mk2 = new APCMiniMk2();
            await this.mk2.connect({sysex: true});

            let snake = new SnakeState();
            this.mk2.setState(snake);
        },

        beforeUnmount() {
            this.mk2.disconnect();
        },
    };
</script>

<template>
    <div class="page admin-scratch">
        <div class="colors" v-if="false">
            <div
                v-for="col in sortedColors"
                :key="col.idx"
                :style="{
                    background: col.hex,
                    left: `${(col.hue / 36) * 10}%`,
                    top: `${(col.hsl[2] * 100 + col.hsl[1]) * 7}px`,
                }"
                @click="toggleColor(col)"
            >
                <div>{{ col.idx }}</div>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
    .page.admin-scratch {
        background: #000;
        color: #fff;
        max-width: none;
        height: 100%;

        padding: 3em 0;

        .colors {
            // display: grid;
            // grid-template-columns: repeat(16, 1fr);
            // gap: 5px;

            width: 1200px;
            position: relative;
            margin: 0 auto;

            & > div {
                height: 30px;
                width: 30px;
                position: absolute;
                border-radius: 50%;
                border: 2px solid #ffffff66;
                box-shadow: 0px 0px 3px #000;

                display: flex;
                align-items: center;
                justify-content: center;
                text-align: center;

                & > div {
                    font-size: 0.7em;
                    font-weight: 600;
                    color: #000;
                    text-shadow: 0px 0px 5px #fff;
                    opacity: 0;
                }

                &:hover {
                    z-index: 500;
                    & > div {
                        opacity: 1;
                    }
                }
            }
        }
    }
</style>
