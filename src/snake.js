import chroma from "chroma-js";

import {State, graphics} from "akai-apc-mini-mk2";

function randint(max) {
    return Math.floor(Math.random() * max);
}

export class SnakeState extends State {
    constructor() {
        super();
        this.frame = 0;
        this.direction = [1, 0];

        this.snake = [[4, 4]];
        this.head = [4, 4];
        this.snakeLength = 2;
        this.snakeColor = "#ffffff";
        this.fruitColor = null;
        this.fruit = null;

        this.speed = 0.05;

        this.placeFruit();
    }

    handlers = {
        arrowUp: {
            toggled: true,
            noteon: () => this.setDirection(0, -1),
        },
        arrowDown: {
            toggled: true,
            noteon: () => this.setDirection(0, 1),
        },
        arrowLeft: {
            toggled: true,
            noteon: () => this.setDirection(-1, 0),
        },
        arrowRight: {
            toggled: true,
            noteon: () => this.setDirection(1, 0),
        },
    };

    placeFruit() {
        let [x, y] = this.head;
        [x, y] = [Math.trunc(x), Math.trunc(y)];

        let currentSnake = this.snake.map(([x, y]) => `${x}${y}`);

        while (currentSnake.indexOf(`${x}${y}`) != -1) {
            [x, y] = [randint(8), randint(8)];
        }

        this.fruit = [x, y];
        this.fruitColor = randint(127) + 1;
    }

    setDirection(x, y) {
        if (this.direction[0] + x != 0 || this.direction[1] + y != 0) {
            this.direction = [x, y];
        }
    }

    moveSnake() {
        let x = this.head[0] + this.direction[0] * this.speed;
        let y = this.head[1] + this.direction[1] * this.speed;
        let moved = Math.round(x) != Math.round(this.head[0]) || Math.round(y) != Math.round(this.head[1]);

        this.head = [(x + 8) % 8, (y + 8) % 8];

        if (!moved) {
            return;
        }

        x = (Math.round(x) + 8) % 8;
        y = (Math.round(y) + 8) % 8;

        this.snake.push([x, y]);

        if (x == this.fruit[0] && y == this.fruit[1]) {
            this.snakeLength = Math.min(this.snakeLength + 0.2, 6);
            this.speed += 0.003;
            this.snakeColor = this.fruitColor;
            this.placeFruit();
        }

        if (this.snake.length > this.snakeLength) {
            this.snake.splice(0, this.snake.length - Math.trunc(this.snakeLength));
        }
    }

    render() {
        let pkey = (x, y) => `${Math.trunc(x)},${Math.trunc(y)}`;
        let pixels = Object.fromEntries(graphics.fillRect(0, 0, 8, 8, 0).map(p => [pkey(p.x, p.y), p]));

        this.moveSnake();
        for (let pixel of this.snake) {
            pixels[pkey(...pixel)] = {x: pixel[0], y: pixel[1], color: this.snakeColor};
        }

        pixels[pkey(...this.fruit)] = {x: this.fruit[0], y: this.fruit[1], color: this.fruitColor};

        return Object.values(pixels);
    }
}
