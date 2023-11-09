import chroma from "chroma-js";
import {State, graphics} from "akai-apc-mini-mk2";

function randint(max) {
    return Math.floor(Math.random() * max);
}

class Rain extends State {
    constructor() {
        super();
        this.board = graphics.Board2D(graphics.fillRect(0, 0, 8, 8, "#000000"));

        this.drops = {};
        this.hue = 50;
    }

    render() {
        let generateDrop = () => {
            return {
                pos: Math.random() * -3,
                tail: 3 + randint(5),
                speed: 0.01 + Math.random() * 0.1,
            };
        };

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

                let color = chroma.hsl(this.hue, 1, intensity).hex();
                if (y >= 0 && y <= 7) {
                    this.board(x, y).color = color;
                }
            }
        }
        this.hue = (this.hue + 0.1) % 360;

        return this.board.pixels;
    }
}

export default Rain;
