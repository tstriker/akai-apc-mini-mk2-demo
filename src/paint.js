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
        this.renderPadColors();
    }

    handlers = {
        noteon: evt => {
            if (evt.button.type == "rgb") {
                this.selectedCallback(evt.button.color, evt);
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

        for (let idx = 0; idx < steps; idx++) {
            let hue = (360 * idx) / steps;
            let color = chroma.hsl(hue, 1, 0.5);
            //let color = this.okLab(hue / 360);

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

        this.colorPicker = new ColorPickState((color, evt) => {
            this.currentColor = color || this.currentColor;
            evt.mk2.setState(this);
        });
    }

    handlers = {
        noteon: evt => {
            if (evt.button.type == "rgb") {
                let [x, y] = [evt.button.x, evt.button.y];
                this.pixelBoard.fill(x, y, this.pixelBoard.color(x, y) ? 0 : this.currentColor);
            }
        },

        volume: {
            toggled: true,
            noteon: evt => {
                evt.mk2.setState(this.colorPicker);
            },
        },
    };

    render() {
        return this.pixelBoard.getPixels();
    }
}
