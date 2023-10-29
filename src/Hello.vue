<script>
    import APCMiniMk2 from "akai-apc-mini-mk2";

    export default {
        name: "HelloWorld",
        async mounted() {
            let mk2 = new APCMiniMk2();
            mk2.connect({sysex: true}).then(() => {
                // run some commands right on startup (e.g. turning on the LEDs)
                console.log("Midi connected!");

                // set pad at cordinates [3,3] to blueish (you can use hex)
                mk2.pad33.color = "#123456";

                // set pad at coordinates [1,1] to white and pulse
                mk2.pad11.color = "#ff0000";
                mk2.pad11.pulse();

                // set button color and blink rates using AKAI's values
                mk2.buttons[7].color = [3, 15];

                // light up the volume button
                mk2.volumeButton.toggled = true;

                // access fader values via `.fader[0-8]`
                console.log("Current value of the lef-most fader:", mk2.fader0.value);
            });

            // the listeners are sitting on the document so that you can attach them from anywhere, just like
            // you would to with keyboard. the event will bubble from the current element so you can intercept it there
            document.addEventListener("cc", evt => {
                console.log(evt.key, "changed to", evt.value, evt);
            });

            document.addEventListener("noteon", evt => {
                console.log("Button press", evt);
            });

            document.addEventListener("noteoff", evt => {
                console.log("Button release", evt);
            });
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
