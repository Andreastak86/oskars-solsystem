// Ekte overflatebilder fra NASA (se public/nasa/KILDER.md).
// Bildene lastes først når de trengs, og bare én gang.
import * as THREE from "three";

const BILDER = {
    Jorden: "nasa/jorden.jpg",
    Venus: "nasa/venus.jpg",
    Mars: "nasa/mars.jpg",
    Jupiter: "nasa/jupiter.jpg",
    Saturn: "nasa/saturn.jpg",
    Neptun: "nasa/neptun.jpg",
    Io: "nasa/io.jpg",
    Europa: "nasa/europa.jpg",
    Ganymedes: "nasa/ganymedes.jpg",
};

// Gråtonebildene av isige måner får en svak, varm tone – slik de ser ut på ekte
export const NASA_TONE = {
    Europa: "#f3e7d6",
    Ganymedes: "#e6dccd",
};

export const harNasaBilde = (navn) => navn in BILDER;

const laster = new THREE.TextureLoader();
const lagret = new Map();

export function nasaTekstur(navn) {
    if (!harNasaBilde(navn)) return Promise.resolve(null);
    if (!lagret.has(navn)) {
        lagret.set(
            navn,
            laster.loadAsync(import.meta.env.BASE_URL + BILDER[navn]).then((t) => {
                t.colorSpace = THREE.SRGBColorSpace;
                t.anisotropy = 4;
                return t;
            }),
        );
    }
    return lagret.get(navn);
}
