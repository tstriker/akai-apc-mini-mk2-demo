import chroma from "chroma-js";
import {State, graphics} from "akai-apc-mini-mk2";

import * as conversions from "./colorconversion.js";

function toHex(h, s, l) {
    let oklab = _okhslToOklab(h / 360, s / 100, l / 100);
    return chroma.oklab(...oklab).hex();
}

function toHSL(color) {
    let [h, s, l] = conversions.srgb_to_okhsl(...chroma(color).rgb());
    return [h * 360, s * 100, l * 100];
}

function _okhslToOklab(h, s, l) {
    if (l == 1) {
        return [1, 0, 0];
    } else if (l == 0) {
        return [0, 0, 0];
    }
    const srgb = conversions.okhsl_to_srgb(h, s, l);
    const rgb = srgb.map(v => conversions.srgb_transfer_function_inv(v / 255));
    return conversions.linear_srgb_to_oklab(...rgb);
}

function getGradients(hue, saturation, lightness) {
    // `linear-gradient(to right, ${stops})`
    return {
        hue: new Array(16).fill(String()).map((_v, i) => {
            return toHex((i / 15) * 360, saturation, lightness);
        }),

        lightness: new Array(16).fill(String()).map((_v, i) => {
            return toHex(hue, saturation || 1, (i / 15) * 100);
        }),

        saturation: new Array(16).fill(String()).map((_v, i) => {
            return toHex(hue, (i / 15) * 100, lightness);
        }),
    };
}

// there is a bit of chicken and egg as we need a global state keeper but the inheritance is through subclassing
let allStates = null;
let curState = "rainbow";
function selectNextState(evt, direction) {
    allStates = allStates || [
        {name: "rainbow", state: new RainbowState()},
        {name: "ok-lab", state: new OKLabColors()},
        {name: "radial", state: new Radial()},
        {name: "diamond", state: new Diamond()},
    ];

    let stateNames = allStates.map(s => s.name);
    let idx = (stateNames.indexOf(curState) + direction + allStates.length) % allStates.length;
    curState = allStates[idx].name;

    evt.mk2.setState(allStates[idx].state);
}

export class ControllerState extends State {
    constructor() {
        super();
        this.currentState = "rainbow";
    }

    handlers = {
        arrowLeft: {
            toggled: true,
            noteon: evt => selectNextState(evt, -1),
        },

        arrowRight: {
            toggled: true,
            noteon: evt => selectNextState(evt, 1),
        },
    };

    nextState(direction) {
        let stateNames = allStates.map(s => s.name);
    }
}

export class RainbowState extends ControllerState {
    render() {
        let padColors = [];
        let steps = 64;

        for (let idx = 0; idx < steps; idx++) {
            let hue = (360 * idx) / steps;
            let color = chroma.hsl(hue, 1, 0.5);
            padColors.push({idx, color: color.hex()});
        }
        return padColors;
    }
}

export class OKLabColors extends ControllerState {
    constructor() {
        super();
        let hueStops = getGradients(0, 100, 55).hue;
        this.okLab = chroma.scale(hueStops);
    }

    render() {
        let padColors = [];
        let steps = 64;

        for (let idx = 0; idx < steps; idx++) {
            let color = this.okLab(idx / steps);
            padColors.push({idx, color: color.hex()});
        }
        return padColors;
    }
}

export class Radial extends ControllerState {
    constructor() {
        super();
        this.angle = 0;
    }

    render() {
        let padColors = [];
        let steps = 64;

        let originX = 3.5; //Math.round(25 - (this.mk2.fader0.value / 127) * 50) + 0.5;
        let originY = 3.5; //Math.round(25 - (this.mk2.fader1.value / 127) * 50) + 0.5;

        let zoom = 2;

        for (let idx = 0; idx < steps; idx++) {
            let x = idx % 8;
            let y = 7 - Math.trunc(idx / 8);

            let xc = originX - x;
            let yc = originY - y;

            let angle = (Math.atan2(xc, yc) * 180) / Math.PI;
            angle = (angle + this.angle) % 360;

            let size = (xc * xc + yc * yc) / (Math.pow(3.7, 2) * zoom);

            let color = chroma.hsl(angle, 1, (1 - Math.pow(size, 0.3)) * 0.9);

            padColors.push({x, y, color: color.hex()});
        }

        this.angle += 1;
        return padColors;
    }
}

export class Diamond extends ControllerState {
    constructor() {
        super();
        this.angle = 0;
    }

    render(mk2) {
        let padColors = [];
        let steps = 64;

        let originX = 3.5; //Math.round(25 - (this.mk2.fader0.value / 127) * 50) + 0.5;
        let originY = 3.5; //Math.round(25 - (this.mk2.fader1.value / 127) * 50) + 0.5;
        let zoom = 16; // this.mk2.fader2.value + 1;

        for (let idx = 0; idx < steps; idx++) {
            let x = idx % 8;
            let y = 7 - Math.trunc(idx / 8);

            let xc = Math.abs(originX - x);
            let yc = Math.abs(originY - y);

            let intensity = xc + yc + this.angle; // ((x + a) % 64) / 64;
            intensity = (intensity % zoom) / zoom;

            let maxHue = 360 - 360 / (steps + 1);

            let color = chroma.hsl(intensity * maxHue, 1, 0.5 - Math.max(mk2.fader8.value, 0.02) * 0.5);

            padColors.push({x, y, color: color.hex()});
        }

        this.angle += 0.05;
        return padColors;
    }
}
