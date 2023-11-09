import chroma from "chroma-js";

import {State, graphics} from "akai-apc-mini-mk2";

export class ColorPickState extends State {
    constructor(selectedCallback) {
        super();
        this.selectedCallback = selectedCallback;
        this.padColors = [];
        this.mode = "colors";

        this.renderPadColors();
    }

    handlers = {
        noteon: evt => {
            if (evt.button.type == "rgb") {
                if (this.mode == "colors") {
                    this.mode = evt.button.color;
                } else {
                    this.mode = "colors";
                    this.selectedCallback(evt.button.color, evt);
                }
                this.renderPadColors();
            }
        },

        noteoff: evt => {
            // if (evt.key == "shift") {
            //     this.selectedCallback(null);
            // }
        },

        volume: {
            toggled: false,
        },
    };

    renderPadColors() {
        let padColors = [];
        let steps = 64;

        let hue = this.mode == "colors" ? null : chroma(this.mode).hsl()[0];

        for (let idx = 0; idx < steps; idx++) {
            let color;
            if (this.mode == "colors") {
                hue = (360 * idx) / steps;
                color = chroma.hsl(hue, 1, 0.5);
            } else {
                // generate shades for the chose color
                color = chroma.hsl(hue, 1, idx / steps);
            }

            padColors.push({idx, color: color.hex()});
        }
        this.padColors = padColors;
    }

    render() {
        return this.padColors;
    }
}

export class PaintState extends State {
    constructor() {
        super();
        this.currentColor = "#ffffff";
        this.pixelBoard = graphics.Board2D();
        this.x = 0;
        this.y = 0;

        this.colorPicker = new ColorPickState((color, evt) => {
            this.currentColor = color || this.currentColor;
            evt.mk2.setState(this);
        });
    }

    handlers = {
        noteon: evt => {
            if (evt.button.type == "rgb") {
                let [x, y] = [evt.button.x, evt.button.y];
                [x, y] = [x - this.x, y - this.y];

                if (evt.shiftKey) {
                    console.log("Eeeeeeeeeeeeeeee we are here");
                    this.currentColor = this.pixelBoard(x, y).color || 0;
                    return;
                }

                this.pixelBoard(x, y).color = this.currentColor;
            }
        },

        volume: {
            toggled: true,
            noteon: evt => {
                evt.mk2.setState(this.colorPicker);
            },
        },

        arrowUp: {
            toggled: true,
            noteon: () => (this.y += 1),
        },
        arrowDown: {
            toggled: true,
            noteon: () => (this.y -= 1),
        },
        arrowLeft: {
            toggled: true,
            noteon: () => (this.x += 1),
        },
        arrowRight: {
            toggled: true,
            noteon: () => (this.x -= 1),
        },
    };

    render() {
        let res = [];
        let curColorDim = chroma.hsl(chroma(this.currentColor).hsl()[0], 1, 0.02).hex();

        for (let y = 0; y < 8; y++) {
            for (let x = 0; x < 8; x++) {
                let color = this.pixelBoard(x - this.x, y - this.y)?.color || curColorDim;
                res.push({x, y, color});
            }
        }
        return res;
        //return this.pixelBoard.pixels.map(pixel => ({...pixel, x: pixel.x + this.x, y: pixel.y + this.y}));
    }
}
