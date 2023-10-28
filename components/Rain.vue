<script>
    import chroma from "chroma-js";

    import APCMiniMk2 from "akai-apc-mini-mk2";

    import utils from "./utils.js";

    function randint(max) {
        return Math.floor(Math.random() * max);
    }

    export default {
        name: "Matrix",
        data() {
            return {
                mk2: null,
                grid: utils.range(64).map(i => {
                    let x = i % 8;
                    let y = Math.trunc(i / 8);
                    return {idx: i, x, y, color: "#000000", colorIdx: 0};
                }),

                drops: {},
            };
        },

        methods: {
            async sendColors() {
                let generateDrop = () => {
                    return {
                        pos: Math.random() * -3,
                        tail: 3 + randint(5),
                        speed: 0.01 + Math.random() * 0.1,
                    };
                };

                let hue = 50;

                let inner = () => {
                    hue = (hue + 0.1) % 360;

                    for (let x = 0; x < 8; x++) {
                        //let color = chroma.hsl(30, 1, 0.5);
                        if (!this.drops[x]) {
                            this.drops[x] = generateDrop();
                        }
                        let drop = this.drops[x];

                        drop.pos += drop.speed;
                        if (drop.pos >= 7 + drop.tail + 1) {
                            this.drops[x] = generateDrop();
                        }

                        for (let t = 0; t <= drop.tail + 1; t++) {
                            let y = Math.trunc(drop.pos - t);

                            let intensity = (1 - t / drop.tail) * 0.3;
                            if (t == 0) {
                                intensity = (drop.pos % 1) * 0.4;
                            } else if (t == drop.tail.length - 1) {
                                intensity = (1 - (drop.pos % 1)) * 0.4;
                            } else if (t == drop.tail.length) {
                                intensity = 0;
                            }

                            let color = chroma.hsl(Math.trunc(hue), 1, intensity).hex();
                            if (y >= 0 && y <= 7) {
                                this.mk2[`pad${x}${y}`].color = color;
                            }
                        }
                    }

                    if (this.animate) {
                        requestAnimationFrame(inner);
                    }
                };

                inner();
            },
        },

        async mounted() {
            this.mk2 = new APCMiniMk2();
            await this.mk2.connect({sysex: true});

            // Object.values(palettes.shades).forEach((row, idx) => {
            //     this.fillColors(7 - idx, 0, row, true);
            // });

            this.animate = true;
            setTimeout(() => {
                this.sendColors();
            }, 10);
        },

        beforeUnmount() {
            this.mk2.disconnect();
            this.animate = false;
        },
    };
</script>

<template>
    <div class="page palette">
        <div class="colors">
            <button
                class="block"
                v-for="block in grid"
                :key="block.idx"
                @click="selectBlock(block)"
                :style="{background: block.color, color: block.contrast}"
            >
                {{ block.colorIdx || "" }}
            </button>
        </div>
    </div>
</template>

<style lang="scss">
    .page.palette {
        display: grid;
        gap: 1em;
        align-content: start;

        .kbd-instructions {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;
            justify-content: flex-end;

            kbd {
                font-size: 1.2em;
                background: var(--base-1);
                display: flex;

                border-radius: 5px;
                border: 1px solid var(--border-2);
                font-family: "Courier New", Courier, monospace;

                padding: 6px 7px;
                min-width: 1em;

                align-items: center;
                justify-content: center;

                background-color: var(--base-1);
                border: solid 1px var(--border);
                border-radius: 6px;
                box-shadow: inset 0 -1px 0 var(--border);
            }
        }

        button {
            background: none;
            border: none;
            color: #fff;
            cursor: pointer;
        }

        .colors {
            display: grid;
            grid-template-columns: repeat(8, 1fr);
            gap: 5px;

            .block {
                height: 50px;
                border: 1px solid #444;
                background: #000;

                &.current {
                    border: 1px solid #fff;
                }
            }
        }

        .colorpicker {
            display: flex;
            flex-wrap: wrap;
            gap: 5px;

            button {
                height: 32px;
                width: 32px;
                border: 2px solid transparent;

                &.current {
                    border-color: var(--base);
                    box-shadow: 0 0 0 1px #fff;
                }
            }
        }

        .controls {
            display: flex;
            gap: 0.5em;
            button {
                border: 1px solid #999;
                padding: 1em 1.5em;
                font-size: 1em;
            }
        }
    }
</style>
