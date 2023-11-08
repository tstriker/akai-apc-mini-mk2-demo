import chroma from "chroma-js";

import {State, graphics} from "akai-apc-mini-mk2";

function randint(max) {
    return Math.floor(Math.random() * max);
}

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
        this.pixelBoard = new graphics.PixelBoard();
        this.mode = null;

        this.colorPicker = new ColorPickState((color, evt) => {
            this.currentColor = color || this.currentColor;
            evt.mk2.setState(this);
        });
    }

    handlers = {
        noteon: evt => {
            if (evt.button.type == "rgb") {
                let [x, y] = [evt.button.x, evt.button.y];

                if (this.mode == "copy") {
                    this.mode = null;
                    this.currentColor = this.pixelBoard.color(x, y);
                } else {
                    this.pixelBoard.fill(x, y, this.currentColor);
                }
            }
        },

        volume: {
            toggled: true,
            noteon: evt => {
                evt.mk2.setState(this.colorPicker);
            },
        },

        select: {
            toggled: true,
            noteon: evt => {
                this.mode = "copy";
                //evt.mk2.shiftButton.blink(); // we don't have blink implemented just yet
            },
        },
    };

    render() {
        return this.pixelBoard.getPixels();
    }
}
