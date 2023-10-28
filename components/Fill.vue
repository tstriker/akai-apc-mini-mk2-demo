<script>
    import chroma from "chroma-js";

    import APCMiniMk2 from "akai-apc-mini-mk2";

    import utils from "./utils.js";

    import * as conversions from "./colorconversion.js";

    function toHex(h, s, l) {
        let oklab = _okhslToOklab(h / 360, s / 100, l / 100);
        return chroma.oklab(...oklab).hex();
    }

    function toHSL(color) {
        let [h, s, l] = conversions.srgb_to_okhsl(...chroma(color).rgb());
        return [h * 360, s * 100, l * 100];
    }

    function _okhslToOklab(h, s, l) {
        if (l == 1) {
            return [1, 0, 0];
        } else if (l == 0) {
            return [0, 0, 0];
        }
        const srgb = conversions.okhsl_to_srgb(h, s, l);
        const rgb = srgb.map(v => conversions.srgb_transfer_function_inv(v / 255));
        return conversions.linear_srgb_to_oklab(...rgb);
    }

    function getGradients(hue, saturation, lightness) {
        // `linear-gradient(to right, ${stops})`
        return {
            hue: new Array(16).fill(String()).map((_v, i) => {
                return toHex((i / 15) * 360, saturation, lightness);
            }),

            lightness: new Array(16).fill(String()).map((_v, i) => {
                return toHex(hue, saturation || 1, (i / 15) * 100);
            }),

            saturation: new Array(16).fill(String()).map((_v, i) => {
                return toHex(hue, (i / 15) * 100, lightness);
            }),
        };
    }

    export default {
        name: "Fill",
        data() {
            let hueStops = getGradients(0, 100, 50).hue;
            console.log("ffff", hueStops);

            return {
                sortedColors: [],
                selectedColors: [],

                currentBlock: null,
                currentColor: null,

                mk2: null,

                mousedown: false,

                okLab: chroma.scale(hueStops),

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

            diamond(state) {
                let padColors = [];
                let steps = 64;

                let originX = 3.5; //Math.round(25 - (this.mk2.fader0.value / 127) * 50) + 0.5;
                let originY = 3.5; //Math.round(25 - (this.mk2.fader1.value / 127) * 50) + 0.5;
                let zoom = 16; // this.mk2.fader2.value + 1;

                state.a = state.a || 0;

                for (let idx = 0; idx < steps; idx++) {
                    let x = idx % 8;
                    let y = 7 - Math.trunc(idx / 8);

                    let xc = Math.abs(originX - x);
                    let yc = Math.abs(originY - y);

                    let intensity = xc + yc + state.a; // ((x + a) % 64) / 64;
                    intensity = (intensity % zoom) / zoom;

                    let maxHue = 360 - 360 / (steps + 1);

                    let color = chroma.hsl(intensity * maxHue, 1, (Math.max(this.mk2.fader8.value, 3) / 127) * 0.5);

                    padColors.push(color.hex());
                }

                state.a = state.a + 0.05;

                return padColors;
            },

            radial(state) {
                let padColors = [];
                let steps = 64;

                let originX = 3.5; //Math.round(25 - (this.mk2.fader0.value / 127) * 50) + 0.5;
                let originY = 3.5; //Math.round(25 - (this.mk2.fader1.value / 127) * 50) + 0.5;

                state.a = state.a || 0;

                let zoom = 2;


                for (let idx = 0; idx < steps; idx++) {
                    let x = idx % 8;
                    let y = 7 - Math.trunc(idx / 8);

                    let xc = originX - x;
                    let yc = originY - y;

                    let angle = (Math.atan2(xc, yc) * 180) / Math.PI;
                    angle = (angle + state.a) % 360;

                    let size = (xc * xc + yc * yc) / (Math.pow(3.7, 2) * zoom);

                    let color = chroma.hsl(angle, 1, (1 - Math.pow(size, 0.3)) * 0.9);

                    padColors.push(color.hex());
                }

                state.a = state.a + 1;
                //state.animate = false;

                return padColors;
            },

            allColors(state) {
                let padColors = [];
                let steps = 64;

                for (let idx = 0; idx < steps; idx++) {
                    let hue = (360 * idx) / steps;
                    let color = chroma.hsl(hue, 1, 0.5);
                    //let color = this.okLab(hue / 360);

                    padColors.push(color.hex());
                }

                state.a = state.a + 0.05;

                return padColors;
            },

            sendColors() {
                let state = {animate: true};

                let inner = async () => {
                    let padColors = this.radial(state);
                    padColors.forEach((color, idx) => {
                        this.mk2.buttons[idx].color = color;
                    });

                    if (this.animate && state.animate) {
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
