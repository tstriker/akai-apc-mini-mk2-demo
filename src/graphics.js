let pixelKey = (x, y) => `${x},${y}`;

class _Point {
    constructor(x, y) {
        [this.x, this.y] = [x, y];
    }

    toString() {
        return `${Math.trunc(this.x)},${Math.trunc(this.y)}`;
    }
}
export const Point = (x, y) => new _Point(x, y);

export class Sprite {
    constructor(x, y) {
        [this.x, this.y] = [x, y];
        this.sprites = [];
    }

    addChild(sprite) {
        this.sprites.push(sprite);
    }

    getPixels() {
        // define me
        return [];
    }

    getAllPixels() {
        let pixelBoard = {};
        for (let pixel of this.getPixels()) {
            pixelBoard[pixelKey(pixel.x, pixel.y)] = pixel;
        }

        for (let sprite of this.sprites) {
            sprite.getAllPixels().forEach(pixel => {
                let [x, y] = [Math.round(sprite.x + pixel.x), Math.round(sprite.y + pixel.y)];
                pixelBoard[pixelKey(x, y)] = {x, y, color: pixel.color};
            });
        }
        return Object.values(pixelBoard);
    }

    get maxX() {
        let pixels = this.getAllPixels();
        return Math.max(...pixels.map(p => p.x));
    }

    fillRect(x, y, w, h, color) {
        let pixels = [];
        for (let currentY = y; currentY < y + h; currentY++) {
            for (let currentX = x; currentX < x + w; currentX++) {
                pixels.push({x: currentX, y: currentY, color});
            }
        }
        return pixels;
    }
}

export class PixelCanvas extends Sprite {
    constructor({x, y, width, height, bg}) {
        super(x, y);
        this.width = width || 8;
        this.height = height || 8;
        this.color = bg;
        this.bg = bg;
    }

    getPixels() {
        return this.fillRect(0, 0, this.width, this.height, this.bg);
    }

    getAllPixels() {
        // get all pixels push them by canvas' location as
        let pixels = super.getAllPixels().map(p => ({x: p.x + this.x, y: p.y + this.y, color: p.color}));
        pixels = pixels.filter(
            p => p.x >= this.x && p.x < this.x + this.width && p.y >= this.y && p.y < this.y + this.height
        );
        return pixels;
    }
}

export class Rect extends Sprite {
    constructor(x, y, width, height, color) {
        super(x, y);
        [this.width, this.height, this.color] = [width, height, color];
    }

    getPixels() {
        return this.fillRect(0, 0, this.width, this.height, this.color);
    }
}

// letters, vertical line by line in base 36
// `parseInt("01110", 2).toString(36)` --> 'e'
let letters = {
    A: "fkf",
    B: "vla",
    C: "vhh",
    D: "vhe",
    E: "vl",
    F: "vkg",
    G: "vhl7",
    H: "v4v",
    I: "v",
    J: "3hv",
    K: "v4r",
    L: "v1",
    M: "v848v",
    N: "vgf",
    O: "ehe",
    P: "vkks",
    Q: "uiju",
    R: "vkb",
    S: "tln",
    T: "gvg",
    U: "v1v",
    V: "u1u",
    W: "s343s",
    X: "r4r",
    Y: "o7o",
    Z: "jip",
    0: "ehe",
    1: "8v",
    2: "nt",
    3: "lv",
    4: "s4v",
    5: "tn",
    6: "vln",
    7: "gno",
    8: "vlv",
    9: "tlv",
    "!": "t",
    "?": "gl8",
    "\\": "o43",
    '"': "o0o",
    "#": "lvlvl",
    "&": "",
    "(": "eh",
    ")": "he",
    "[": "vh",
    "]": "hv",
    "-": "44",
    "+": "4e4",
    "*": "a4a",
    ":": "a",
    "'": "o",
};

export class Text extends Sprite {
    constructor(x, y, text, color = "#ffffff") {
        super(x, y);
        [this.text, this.color] = [text, color];

        this.height = 5;
        this._redraw();
    }

    _redraw() {
        let [x, y] = [0, 0];
        let pixels = [];
        for (let letter of this.text.toUpperCase()) {
            let lines = letters[letter] || [];
            for (let line of lines) {
                let bytes = parseInt(line, 36).toString(2).padStart(5, "0");
                for (let byte of bytes) {
                    if (byte != "0") {
                        pixels.push({x, y, color: this.color});
                    }
                    y += 1;
                }
                x += 1;
                y = 0;
            }

            // add whitespace after each letter because we are polite
            x += 1;
        }
        this._pixels = pixels;
    }

    getPixels() {
        return this._pixels;
    }
}
