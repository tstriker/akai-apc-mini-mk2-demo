<script>
    import chroma from "chroma-js";

    import APCMiniMk2 from "akai-apc-mini-mk2";
    import {Colors} from "akai-apc-mini-mk2";

    import utils from "./utils.js";

    let actualColors = {
        vibrant: [17, 53, 77, 113, 96, 45, 64, 5],
        red: [5, 120, 6, 121, 7],
        white: [3, 2, 118, 117, 1],
        green: [109, 13, 97, 14, 15],
        purple: [52, 94, 53, 54, 55],
    };

    let namedColors = {
        white: 8,
        red: 5,
        orange: 9,
        lightGreen: 13,
        green: 17,
        darkerGreen: 21,
        teal: 33,
        lightBlue: 37,
        blue: 41,
        deepBlue: 45,
        purple: 49,
        richPurple: 53,
        pink: 57,
        darkOrange: 60,
        yellow: 61,
    };

    let primaryTertiary = {
        red: 5,
        redViolet: 57,
        violet: 53,
        blueViolet: 80,
        blue: 41,
        blueGreen: 33,
        green: 21,
        yellowGreen: 74,
        yellow: 109,
        yellowOrange: 96,
        orange: 84,
        redOrange: 60,
    };

    let allColors = {};
    Colors.forEach((color, idx) => {
        // dedupe colors
        if (allColors[color] == undefined) {
            allColors[color] = {
                color,
                idx,
                contrast: chroma(color).luminance() > 0.5 ? "#000" : "#fff",
            };
        }
    });
    allColors = Object.values(allColors);

    export default {
        name: "Palette",
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

                allColors: allColors,
                byIdx: Object.fromEntries(allColors.map(col => [col.idx, col])),
            };
        },

        methods: {
            setColor(color, evt) {
                if (!color) {
                    return;
                }

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

                    mk2[`pad${xCurrent}${yCurrent}`] = [colorIdx, 6];
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
                if (block.colorObj) {
                    this.currentColor = block.colorObj;
                }
            },

            onDocumentKeyDown(evt) {
                let key = evt.key;
                if (!this.currentBlock) {
                    return;
                }

                let handlers = {
                    ArrowUp: () => {
                        this.setColor(this.byIdx[this.currentColor.idx - 1]);
                    },
                    ArrowDown: () => {
                        this.setColor(this.byIdx[this.currentColor.idx + 1]);
                    },
                    ArrowLeft: () => {
                        this.setColor(this.byIdx[this.currentColor.idx - 1]);
                    },
                    ArrowRight: () => {
                        this.setColor(this.byIdx[this.currentColor.idx + 1]);
                    },
                    Backspace: () => {
                        this.setColor(this.byIdx[0]);
                    },
                };
                if (handlers[key]) {
                    evt.preventDefault();
                    handlers[key]();
                } else {
                    console.log(key);
                }
            },
        },

        async mounted() {
            this.mk2 = new APCMiniMk2();
            await this.mk2.connect();

            Object.values(actualColors).forEach((row, idx) => {
                this.fillColors(7 - idx, 0, row, true);
            });

            document.addEventListener("keydown", this.onDocumentKeyDown);

            let i = 0;
            let primaries = Object.values(primaryTertiary);
            let rainbow = () => {
                i += 1;
                i = i % primaries.length;
                mk2.pad07 = primaries[i];
                setTimeout(rainbow, 200);
            };
            // rainbow();
        },

        beforeUnmount() {
            this.mk2.disconnect();
            document.removeEventListener("keydown", this.onDocumentKeyDown);
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

        <div class="block-edit" v-if="currentBlock">
            <div class="same-line">
                <label>Color:</label>
                <div class="colorpicker">
                    <button
                        v-for="color in allColors"
                        :key="color.idx"
                        :style="{background: color.color, color: color.contrast}"
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
        background: #222;
        color: #fff;
        position: fixed;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        padding: 2em;
        overflow-y: auto;

        display: grid;
        gap: 2em;
        align-content: start;

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
                height: 30px;
                width: 30px;
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
