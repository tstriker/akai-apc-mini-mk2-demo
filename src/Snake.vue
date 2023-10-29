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
                snakeColor: "#ffffff",
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
                this.mk2[`pad${x}${y}`].color = this.snakeColor;
                this.head = [x, y];

                if (x == this.fruit[0] && y == this.fruit[1]) {
                    this.snakeLength = Math.min(this.snakeLength + 0.2, 6);
                    this.speed -= 10;
                    this.snakeColor = "#ff00ff";
                    this.placeFruit();

                    //this.mk2[`pad${x}${y}`].color = 0;
                    this.snake.forEach(([x, y]) => {
                        this.mk2[`pad${x}${y}`].color = this.snakeColor;
                    });
                }

                if (this.snake.length > this.snakeLength) {
                    let prev = this.snake.splice(0, this.snake.length - Math.trunc(this.snakeLength));
                    prev.forEach(([x, y]) => {
                        this.mk2[`pad${x}${y}`].color = 0;
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
                this.mk2[`pad${x}${y}`].color = [this.fruitColor, 10];
            },

            handleKeys(evt) {
                let directions = {
                    upButton: [0, -1],
                    downButton: [0, 1],
                    leftButton: [-1, 0],
                    rightButton: [1, 0],
                };
                let direction = directions[evt.key];
                if (direction && (this.direction[0] + direction[0] != 0 || this.direction[1] + direction[1] != 0)) {
                    this.direction = direction;
                }
            },
        },

        async mounted() {
            this.mk2 = new APCMiniMk2();
            await this.mk2.connect({sysex: true, paintLoop: false});

            this.placeFruit();

            this.snakeLoop();

            document.addEventListener("noteon", this.handleKeys);
        },

        beforeUnmount() {
            this.mk2.disconnect();
            clearTimeout(this.snakeTimeout);
            document.removeEventListener("noteon", this.handleKeys);
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
