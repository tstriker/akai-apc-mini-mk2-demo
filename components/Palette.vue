<script>
    import chroma from "chroma-js";

    import APCMiniMk2 from "akai-apc-mini-mk2";
    import {Colors} from "akai-apc-mini-mk2";

    import utils from "./utils.js";

    let palettes = {
        vibrant: [21, 53, 77, 113, 96, 45, 64, 5],
        shades: {
            white: [3, 118, 1],
            lightBlue: [91, 92, 103],
            amber: [96, 62, 11],
            olive: [13, 14, 15],
            green: [17, 18, 23],
            teal: [33, 34, 31],
            purple: [52, 54, 55],
            red: [5, 6, 7],
        },
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
            let chromaColor = chroma(color);
            allColors[color] = {
                color,
                hsl: chromaColor.hsl(),
                idx,
                contrast: chromaColor.luminance() > 0.5 ? "#000" : "#fff",
            };
        }
    });
    allColors = Object.values(allColors);

    allColors = utils.sort(allColors, color => {
        let hue = color.hsl[0] || 0;
        return [hue, color.hsl[1], -color.hsl[2]];
        //return color.lch;
    });

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

                    this.mk2[`pad${xCurrent}${yCurrent}`].color = [colorIdx, 6];
                    let color = this.byIdx[colorIdx];
                    let block = this.colorgrid[yCurrent * 8 + xCurrent];

                    block.colorObj = color;
                    block.colorIdx = color.idx;
                    block.color = color.color;
                    block.contrast = color.contrast;
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

            onDocumentKeyDown(evt) {
                let key = evt.key;
                if (!this.currentBlock) {
                    return;
                }

                let nextColor = direction => {
                    let idx = this.allColors.indexOf(this.currentColor);
                    idx = Math.max(0, Math.min(this.allColors.length - 1, idx + direction));
                    this.setColor(this.allColors[idx]);
                };

                let move = direction => {
                    let blockIdx = this.colorgrid.indexOf(this.currentBlock);
                    blockIdx = Math.max(0, Math.min(this.colorgrid.length - 1, blockIdx + direction));
                    this.selectBlock(this.colorgrid[blockIdx]);
                };

                let handlers = {
                    Backspace: () => {
                        this.setColor({});
                    },
                    "[": () => nextColor(-1),
                    "]": () => nextColor(1),
                    ArrowUp: () => move(-8),
                    ArrowDown: () => move(8),
                    ArrowLeft: () => move(-1),
                    ArrowRight: () => move(1),
                };
                if (handlers[key]) {
                    evt.preventDefault();
                    handlers[key]();
                } else {
                    console.log(key);
                }
            },

            async sendColors() {
                let lightness = 0.5;
                let direction = -0.005;
                let hue = 0;

                let a = 0;

                let inner = async () => {
                    let steps = 64;
                    for (let idx = 0; idx < steps; idx++) {
                        let x = idx % 8;
                        let y = 7 - Math.trunc(idx / 8);

                        let intensity = ((x + y + a) % 14) / 14; // ((x + a) % 64) / 64;

                        let maxHue = 360 - 360 / (steps + 1);

                        let color = chroma.hsl(intensity * maxHue, 1, lightness);
                        //let color = chroma.hsl(hue, 1, intensity * 0.5);

                        this.mk2.buttons[idx] = color.hex();
                    }

                    // lightness += direction;
                    // if (lightness < 0.1 || lightness > 0.5) {
                    //     lightness = Math.min(Math.max(lightness, 0), 0.5);
                    //     direction = -direction;
                    // }
                    hue = (hue + 0.1) % 360;

                    a = a + 0.05;

                    setTimeout(inner, 0);
                };

                inner();
            },
        },

        async mounted() {
            this.mk2 = new APCMiniMk2();
            await this.mk2.connect({sysex: true});

            document.addEventListener("noteon", evt => {
                if (evt.key == "volume") {
                    this.mk2.reset();
                }
            });

            Object.values(palettes.shades).forEach((row, idx) => {
                this.fillColors(7 - idx, 0, row, true);
            });

            document.addEventListener("keydown", this.onDocumentKeyDown);
        },

        beforeUnmount() {
            this.mk2.disconnect();
            document.removeEventListener("keydown", this.onDocumentKeyDown);
        },
    };
</script>

<template>
    <div class="page paint"></div>
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
