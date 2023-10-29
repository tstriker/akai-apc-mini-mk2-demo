<script>
    import chroma from "chroma-js";

    import APCMiniMk2 from "akai-apc-mini-mk2";

    import utils from "./utils.js";
    import APC from "./APC.vue";

    function randint(max) {
        return Math.floor(Math.random() * max);
    }

    export default {
        name: "Matrix",
        components: {
            APC,
        },
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
            sendColors() {
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
                };

                return inner;
            },
        },

        async mounted() {
            this.mk2 = new APCMiniMk2();
            await this.mk2.connect({sysex: true, beforePaint: this.sendColors()});
            this.animate = true;
        },

        beforeUnmount() {
            this.mk2.disconnect();
            this.animate = false;
        },
    };
</script>

<template>
    <div class="page palette">
        <APC />
    </div>
</template>

<style lang="scss">
    .page.palette {
        display: grid;
        gap: 1em;
        align-content: start;
    }
</style>
