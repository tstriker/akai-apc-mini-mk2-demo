<script>
    import chroma from "chroma-js";

    import APCMiniMk2 from "akai-apc-mini-mk2";

    import utils from "./utils.js";

    function randint(max) {
        return Math.floor(Math.random() * max);
    }

    export default {
        name: "Snake",
        data() {
            return {
                sortedColors: [],
                selectedColors: [],

                snakeTimeout: null,
                direction: [1, 0],

                snake: [[4, 4]],
                head: [4, 4],
                snakeLength: 2,
                snakeColor: 1,
                fruitColor: null,
                fruit: null,

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

            snakeLoop() {
                let [x, y] = [this.head[0] + this.direction[0], this.head[1] + this.direction[1]];
                x = (x + 8) % 8;
                y = (y + 8) % 8;

                this.snake.push([x, y]);
                this.mk2[`pad${x}${y}`] = this.snakeColor;
                this.head = [x, y];

                if (x == this.fruit[0] && y == this.fruit[1]) {
                    this.snakeLength = Math.min(this.snakeLength + 0.2, 6);
                    this.speed -= 10;
                    this.snakeColor = this.fruitColor;
                    this.placeFruit();

                    this.snake.forEach(([x, y]) => {
                        this.mk2[`pad${x}${y}`] = this.snakeColor;
                    });
                }

                if (this.snake.length > this.snakeLength) {
                    let prev = this.snake.splice(0, this.snake.length - Math.trunc(this.snakeLength));
                    prev.forEach(([x, y]) => {
                        this.mk2[`pad${x}${y}`] = 0;
                    });
                }

                this.snakeTimeout = setTimeout(this.snakeLoop, this.speed);
            },

            placeFruit() {
                let [x, y] = this.head;

                let currentSnake = this.snake.map(([x, y]) => `${x}${y}`);

                while (currentSnake.indexOf(`${x}${y}`) != -1) {
                    [x, y] = [randint(8), randint(8)];
                }

                this.fruit = [x, y];
                this.fruitColor = randint(127) + 1;
                this.mk2[`pad${x}${y}`] = [this.fruitColor, 10];
            },
        },

        async mounted() {
            this.mk2 = new APCMiniMk2();
            await this.mk2.connect();

            this.placeFruit();

            this.snakeLoop();

            this.mk2.addEventListener("keydown", evt => {
                let directions = {
                    up: [0, -1],
                    down: [0, 1],
                    left: [-1, 0],
                    right: [1, 0],
                };
                let direction = directions[evt.key];
                if (direction && (this.direction[0] + direction[0] != 0 || this.direction[1] + direction[1] != 0)) {
                    this.direction = direction;
                }
            });
        },

        beforeUnmount() {
            this.mk2.disconnect();
            clearTimeout(this.snakeTimeout);
        },

        async mounted2() {
            console.log("aaaaa");

            let portID = "160844ED7ED0141524BB69C9405D6C86882EAEBCB4641F6CF0EAF71995FD22A2";

            let access = await navigator.requestMIDIAccess();

            async function sendMiddleC(midiAccess, output) {
                console.log("ffff", output);
                console.log("Sending");
                output.send([144 + 6, 1, 8]); // sends the message.
            }

            access.onstatechange = event => {
                // Print information about the (dis)connected MIDI controller
                console.log(event.port.name, event.port.manufacturer, event.port.state);
                sendMiddleC(access, event.port);
            };

            console.log("opening port");
            let outs = [...access.outputs.values()];
            let output = outs.find(o => o.name.indexOf("APC mini") != -1);
            output.open();
        },

        async mounted3() {
            let akaiColors = [
                "#000000",
                "#1E1E1E",
                "#7F7F7F",
                "#FFFFFF",
                "#FF4C4C",
                "#FF0000",
                "#590000",
                "#190000",
                "#FFBD6C",
                "#FF5400",
                "#591D00",
                "#271B00",
                "#FFFF4C",
                "#FFFF00",
                "#595900",
                "#191900",
                "#88FF4C",
                "#54FF00",
                "#1D5900",
                "#142B00",
                "#4CFF4C",
                "#00FF00",
                "#005900",
                "#001900",
                "#4CFF5E",
                "#00FF19",
                "#00590D",
                "#001902",
                "#4CFF88",
                "#00FF55",
                "#00591D",
                "#001F12",
                "#4CFFB7",
                "#00FF99",
                "#005935",
                "#001912",
                "#4CC3FF",
                "#00A9FF",
                "#004152",
                "#001019",
                "#4C88FF",
                "#0055FF",
                "#001D59",
                "#000819",
                "#4C4CFF",
                "#0000FF",
                "#000059",
                "#000019",
                "#874CFF",
                "#5400FF",
                "#190064",
                "#0F0030",
                "#FF4CFF",
                "#FF00FF",
                "#590059",
                "#190019",
                "#FF4C87",
                "#FF0054",
                "#59001D",
                "#220013",
                "#FF1500",
                "#993500",
                "#795100",
                "#436400",
                "#033900",
                "#005735",
                "#00547F",
                "#0000FF",
                "#00454F",
                "#2500CC",
                "#7F7F7F",
                "#202020",
                "#FF0000",
                "#BDFF2D",
                "#AFED06",
                "#64FF09",
                "#108B00",
                "#00FF87",
                "#00A9FF",
                "#002AFF",
                "#3F00FF",
                "#7A00FF",
                "#B21A7D",
                "#402100",
                "#FF4A00",
                "#88E106",
                "#72FF15",
                "#00FF00",
                "#3BFF26",
                "#59FF71",
                "#38FFCC",
                "#5B8AFF",
                "#3151C6",
                "#877FE9",
                "#D31DFF",
                "#FF005D",
                "#FF7F00",
                "#B9B000",
                "#90FF00",
                "#835D07",
                "#392b00",
                "#144C10",
                "#0D5038",
                "#15152A",
                "#16205A",
                "#693C1C",
                "#A8000A",
                "#DE513D",
                "#D86A1C",
                "#FFE126",
                "#9EE12F",
                "#67B50F",
                "#1E1E30",
                "#DCFF6B",
                "#80FFBD",
                "#9A99FF",
                "#8E66FF",
                "#404040",
                "#757575",
                "#E0FFFF",
                "#A00000",
                "#350000",
                "#1AD000",
                "#074200",
                "#B9B000",
                "#3F3100",
                "#B35F00",
                "#4B1502",
            ];

            akaiColors.forEach((color, idx) => {
                let chr = chroma(color);
                let hsl = chr.hsl();

                console.log("fffffffF", isNaN(hsl[0]), hsl);

                akaiColors[idx] = {
                    idx,
                    hex: color,
                    chroma: chr,

                    lch: chr.lch(),

                    hsl: chr.hsl(),

                    hue: isNaN(hsl[0]) ? -15 : hsl[0],
                    rgb: chr.rgb(),
                };
            });

            let sorted = utils.sort(akaiColors, color => {
                return [color.hsl[0] || 0, color.hsl[1], color.hsl[2]];
                //return color.lch;
            });

            this.sortedColors = sorted;

            console.log(JSON.stringify(sorted.map(c => [c.idx, c.hex])));
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

