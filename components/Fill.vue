<script>
    import chroma from "chroma-js";

    import APCMiniMk2 from "akai-apc-mini-mk2";

    import utils from "./utils.js";

    export default {
        name: "Fill",
        data() {
            return {
                sortedColors: [],
                selectedColors: [],

                currentBlock: null,
                currentColor: null,

                mk2: null,

                mousedown: false,

                colorgrid: utils.range(64).map(i => {
                    let x = i % 8;
                    let y = Math.trunc(i / 8);
                    return {idx: i, x, y, color: "#000000", colorIdx: 0};
                }),

                animate: false,
            };
        },

        methods: {
            setColor(color, evt) {
                if (evt !== undefined && !this.mousedown) {
                    return;
                }
                this.currentColor = color;
                let block = this.currentBlock;
                block.colorObj = color;
                block.colorIdx = color.idx;
                block.color = color.color;
                block.contrast = color.contrast;
                mk2[`pad${block.x}${block.y}`] = color.idx;
            },

            fillColors(x, y, colors, vertical) {
                colors.forEach((colorIdx, idx) => {
                    let xCurrent = x + (vertical ? 0 : idx);
                    let yCurrent = y + (vertical ? idx : 0);

                    this.mk2[`pad${xCurrent}${yCurrent}`] = [colorIdx, 6];
                    let color = this.byIdx[colorIdx];
                    let block = this.colorgrid[yCurrent * 8 + xCurrent];

                    block.colorObj = color;
                    block.colorIdx = color.idx;
                    block.color = color.color;
                    block.contrast = color.contrast;
                });
            },

            resetColors() {
                this.colorgrid.forEach(block => {
                    block.color = "#000";
                    block.colorIdx = 0;
                    block.contrast = "#fff";
                    mk2[block.idx] = 0;
                });
            },

            onColorMouseDown(color) {
                this.mousedown = true;
                this.setColor(color);

                let onMouseUp = () => {
                    this.mousedown = false;
                    document.removeEventListener("mouseup", onMouseUp);
                };

                document.addEventListener("mouseup", onMouseUp);
            },

            selectBlock(block) {
                this.currentBlock = block;
                if (block.colorObj?.color) {
                    this.currentColor = block.colorObj;
                }
            },

            async sendColors() {
                let lightness = 0.5;
                let direction = -0.005;
                let hue = 0;

                let a = 0;

                let scale = 16;

                let inner = async () => {
                    let padColors = [];
                    let steps = 64;
                    for (let idx = 0; idx < steps; idx++) {
                        let x = idx % 8;
                        let y = 7 - Math.trunc(idx / 8);

                        let xc = Math.abs(3.5 - x);
                        let yc = Math.abs(3.5 - y);

                        let intensity = xc + yc + a; // ((x + a) % 64) / 64;
                        intensity = (intensity % scale) / scale;

                        let maxHue = 360 - 360 / (steps + 1);

                        let color = chroma.hsl(intensity * maxHue, 1, (this.mk2.fader0 / 127) * 0.5);
                        //let color = chroma.hsl(hue, 1, intensity * 0.5);

                        padColors.push([idx, idx, color.hex()]);
                    }

                    await this.mk2.fill(padColors);

                    if (this.animate) {
                        // lightness += direction;
                        // if (lightness < 0.1 || lightness > 0.5) {
                        //     lightness = Math.min(Math.max(lightness, 0), 0.5);
                        //     direction = -direction;
                        // }
                        hue = (hue + 0.1) % 360;

                        a = a + 0.05;

                        requestAnimationFrame(inner);
                    }
                };

                inner();

                //this.mk2.pad33 = "#770000";
            },
        },

        async mounted() {
            this.mk2 = new APCMiniMk2();
            await this.mk2.connect({sysex: true});

            // Object.values(palettes.shades).forEach((row, idx) => {
            //     this.fillColors(7 - idx, 0, row, true);
            // });

            this.animate = true;
            this.sendColors();
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
                v-for="block in colorgrid"
                :key="block.idx"
                @click="selectBlock(block)"
                :style="{background: block.color, color: block.contrast}"
                :class="{current: currentBlock == block}"
            >
                {{ block.colorIdx || "" }}
            </button>
        </div>

        <div class="kbd-instructions">
            <kbd v-for="key in ['←', '→', '↑', '↓', '[', ']', 'Backspace']" :key="key">
                {{ key }}
            </kbd>
        </div>

        <div class="block-edit" v-if="currentBlock">
            <div class="same-line">
                <div class="colorpicker">
                    <button
                        v-for="color in allColors"
                        :key="color.idx"
                        :style="{background: color.color, color: color.contrast}"
                        :class="{current: color == currentColor}"
                        @mousedown="onColorMouseDown(color)"
                        @mouseover="setColor(color, $event)"
                    >
                        {{ color.idx }}
                    </button>
                </div>
            </div>
        </div>

        <div class="controls">
            <button @click="resetColors">Reset</button>
            <button @click="dumpColors">Dump Colors</button>
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
