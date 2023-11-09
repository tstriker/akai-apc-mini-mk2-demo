<script>
    import {APCMiniMk2} from "akai-apc-mini-mk2";

    import utils from "./utils.js";

    export default {
        name: "APC",
        props: {
            pixels: Array,
        },
        data() {
            return {
                mk2: new APCMiniMk2(),
                colorgrid: utils.range(64).map(i => {
                    let x = i % 8;
                    let y = Math.trunc(i / 8);
                    return {idx: i, x, y, color: "#444444", colorIdx: 0};
                }),

                colors: {},
            };
        },
        computed: {
            colorStyles: state => Object.fromEntries(state.pixels.map(p => [`--${p.idx}`, p.color])),
            pads() {
                return utils.range(64).map(i => {
                    let x = i % 8;
                    let y = Math.trunc(i / 8);
                    return this.mk2[`pad${x}${y}`];
                });
            },
        },
    };
</script>

<template>
    <div class="apc" :style="colorStyles">
        <div class="pads">
            <button :style="{background: `var(--${pad.note})`}" v-for="pad in pads" :key="pad.note"></button>
        </div>

        <div class="buttons vert">
            <div class="button-box" v-for="button in mk2.vertButtons" :key="button.note">
                <button :class="{toggled: colors[button.note]}"></button>
                <label>{{ button.label }}</label>
            </div>
        </div>
        <div class="buttons horiz">
            <div class="button-box" :class="button.key" v-for="button in mk2.horizButtons" :key="button.note">
                <button :class="{toggled: colors[button.note]}"></button>
                <label>{{ button.label }}</label>
            </div>
        </div>

        <div class="faders" v-if="false">
            <div class="fader-box" v-for="fader in mk2.faders" :key="fader.note">
                <input type="range" orient="vertical" />
            </div>
        </div>
    </div>
</template>

<style lang="scss">
    .apc {
        display: grid;
        margin: 0 auto;
        gap: 20px;
        align-content: start;
        display: grid;
        grid-template-columns: auto auto;
        --pad-width: 100px;
        --pad-height: 50px;
        background: #000;
        padding: 1em;

        button {
            border: none;
        }

        justify-self: center;
        align-self: center;

        .pads {
            display: grid;
            grid-template-columns: repeat(8, var(--pad-width));
            gap: 8px;

            button {
                height: var(--pad-height);
                background: #333;
                border: none;
                border-radius: 2px;
                box-shadow: 1px 1px 0 2px #333;

                &:nth-child(28) {
                    border-bottom-right-radius: 12px;
                }

                &:nth-child(29) {
                    border-bottom-left-radius: 12px;
                }

                &:nth-child(36) {
                    border-top-right-radius: 12px;
                }

                &:nth-child(37) {
                    border-top-left-radius: 12px;
                }

                &.current {
                    border: 1px solid #fff;
                }
            }
        }

        .buttons {
            display: grid;
            gap: 8px;

            .button-box {
                display: flex;
                align-items: center;
                gap: 10px;

                button {
                    height: 28px;
                    width: 28px;
                    background: #444;
                    border-radius: 2px;
                    box-shadow: 0px 1px 0 2px #555;
                }
            }

            label {
                text-transform: uppercase;
                font-size: 10px;
                line-height: 100%;
                text-align: center;
            }

            &.vert {
                align-items: center;
                padding-left: 20px;
                border-left: 1px solid #999;

                label {
                    width: 4em;
                }

                .button-box {
                    height: var(--pad-height);

                    button.toggled {
                        background-color: #00aa00;
                        box-shadow: 0px 1px 0 2px #006600;
                    }
                }
            }

            &.horiz {
                grid-column: span 2;
                grid-auto-flow: column;

                align-items: center;
                justify-items: center;
                align-content: start;
                justify-content: start;
                margin-top: 5px;

                .button-box {
                    flex-direction: column;
                    width: var(--pad-width);

                    button.toggled {
                        background-color: #aa0000;
                        box-shadow: 0px 1px 0 2px #660000;
                    }
                }

                .shiftButton {
                    width: auto;
                    margin-left: 33px;
                }
            }
        }

        .faders {
            grid-column: span 2;
            height: 200px;
            display: flex;
            gap: 8px;

            .fader-box {
                width: var(--pad-width);
                display: flex;
                align-items: center;
                justify-content: center;

                &:last-child {
                    width: 60px;
                }
            }

            input[type="range"] {
                appearance: slider-vertical;
            }
        }
    }
</style>
