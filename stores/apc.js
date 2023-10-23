import {defineStore} from "pinia";

import APCMiniMk2 from "akai-apc-mini-mk2";

export const useStore = defineStore("mk2", {
    state: () => {
        return {
            interface: null,
            buttons: {},
            pads: {},
        };
    },

    actions: {
        async connect() {
            if (!this.interface) {
                this.interface = new APCMiniMk2();
                this.interface.addEventListener("cc", this._onCC);
                this.interface.addEventListener("noteon", this._onNoteOn);
                this.interface.addEventListener("noteoff", this._onNoteOff);
                await this.interface.connect({sysex: true});
            }
        },

        _onCC(event) {
            this.buttons[event.key] = event.value;
        },

        _onNoteOn(event) {
            console.log(event);
        },

        _onNoteOff(event) {
            console.log(event);
        },

        disconnect() {
            this.interface.disconnect();
            this.interface = null;
        },

        setColor(button, color) {
            this.buttons[button] = color;
            this.interface[button] = color;
        },

        fill(colorBatch) {
            // wrap the mk2 setter/getter into a store so that we can render an on-screen virtual mk2 as well
            colorBatch.forEach(([fromPad, toPad, color]) => {
                for (let pad = fromPad; pad <= toPad; pad++) {
                    this.buttons[pad] = color;
                    this.interface[pad] = color;
                }
            });
            this.interface.fill(colorBatch);
        },
    },
});
