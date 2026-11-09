// Lager planet-overflater med kode i stedet for bilder.
// Vi bruker "støy" (tilfeldige, myke mønstre) for å tegne skyer, kontinenter, kratere og striper.
import * as THREE from "three";

// ---------- Støy ----------
function hash(x, y, z, seed) {
    let h =
        Math.imul(x, 374761393) ^
        Math.imul(y, 668265263) ^
        Math.imul(z, 1274126177) ^
        Math.imul(seed, 1442695041);
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
}

const glatt = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;

function stoy(x, y, z, seed) {
    const xi = Math.floor(x),
        yi = Math.floor(y),
        zi = Math.floor(z);
    const u = glatt(x - xi),
        v = glatt(y - yi),
        w = glatt(z - zi);
    const c = (dx, dy, dz) => hash(xi + dx, yi + dy, zi + dz, seed);
    return lerp(
        lerp(
            lerp(c(0, 0, 0), c(1, 0, 0), u),
            lerp(c(0, 1, 0), c(1, 1, 0), u),
            v,
        ),
        lerp(
            lerp(c(0, 0, 1), c(1, 0, 1), u),
            lerp(c(0, 1, 1), c(1, 1, 1), u),
            v,
        ),
        w,
    );
}

function fbm(x, y, z, oktaver = 5, seed = 0) {
    let sum = 0,
        amp = 0.5,
        f = 1,
        norm = 0;
    for (let i = 0; i < oktaver; i++) {
        sum += amp * stoy(x * f, y * f, z * f, seed + i * 31);
        norm += amp;
        amp *= 0.5;
        f *= 2;
    }
    return sum / norm;
}

// ---------- Farger ----------
const hex = (h) => {
    const n = parseInt(h.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};
const bland = (a, b, t) => [
    lerp(a[0], b[0], t),
    lerp(a[1], b[1], t),
    lerp(a[2], b[2], t),
];
const klemm = (t) => Math.min(1, Math.max(0, t));
const skaler = (t, lo, hi) => klemm((t - lo) / (hi - lo));

function rampe(farger, t) {
    const f = farger.map(hex);
    t = klemm(t) * (f.length - 1);
    const i = Math.min(f.length - 2, Math.floor(t));
    return bland(f[i], f[i + 1], t - i);
}

// ---------- Tegn en kule-tekstur ----------
// fargeFn får et punkt på kulen (x, y, z) pluss breddegrad/lengdegrad, og returnerer [r, g, b, a]
function kuleTekstur(fargeFn, bredde = 512, hoyde = 256) {
    const canvas = document.createElement("canvas");
    canvas.width = bredde;
    canvas.height = hoyde;
    const ctx = canvas.getContext("2d");
    const bilde = ctx.createImageData(bredde, hoyde);
    const d = bilde.data;

    for (let py = 0; py < hoyde; py++) {
        const lat = (0.5 - (py + 0.5) / hoyde) * Math.PI;
        const cl = Math.cos(lat),
            y = Math.sin(lat);
        for (let px = 0; px < bredde; px++) {
            const lon = ((px + 0.5) / bredde) * Math.PI * 2;
            const x = cl * Math.cos(lon),
                z = cl * Math.sin(lon);
            const [r, g, b, a = 255] = fargeFn(x, y, z, lat, lon);
            const i = (py * bredde + px) * 4;
            d[i] = r;
            d[i + 1] = g;
            d[i + 2] = b;
            d[i + 3] = a;
        }
    }
    ctx.putImageData(bilde, 0, 0);
    const tekstur = new THREE.CanvasTexture(canvas);
    tekstur.colorSpace = THREE.SRGBColorSpace;
    tekstur.anisotropy = 4;
    return tekstur;
}

// Avstand på kulen til et punkt (lat, lon) – brukes for flekker som Jupiters røde flekk
function flekk(lat, lon, fLat, fLon, bLat, bLon) {
    let dLon = Math.atan2(Math.sin(lon - fLon), Math.cos(lon - fLon));
    return (dLon / bLon) ** 2 + ((lat - fLat) / bLat) ** 2;
}

// ---------- De enkelte kloder ----------
export const teksturer = {
    Solen: () =>
        kuleTekstur((x, y, z) => {
            const n = fbm(x * 5, y * 5, z * 5, 4, 1);
            const g = fbm(x * 22, y * 22, z * 22, 3, 2);
            return rampe(
                ["#c2410c", "#f97316", "#fbbf24", "#fff3c4"],
                skaler(n * 0.6 + g * 0.4, 0.32, 0.7),
            );
        }),

    Merkur: () =>
        kuleTekstur((x, y, z) => {
            const n = fbm(x * 3, y * 3, z * 3, 5, 10);
            const k = fbm(x * 14, y * 14, z * 14, 3, 11);
            return rampe(
                ["#3f3a36", "#7d766f", "#b5ada4", "#d6cfc6"],
                skaler(n * 0.55 + k * 0.45, 0.3, 0.7),
            );
        }),

    Venus: () =>
        kuleTekstur((x, y, z) => {
            const w = fbm(x * 2, y * 2, z * 2, 4, 20);
            const n = fbm(x * 2 + w * 2.5, y * 7, z * 2 + w * 2.5, 5, 21);
            return rampe(
                ["#9c6a2a", "#d9a85b", "#f2d49b", "#fff1d6"],
                skaler(n, 0.3, 0.7),
            );
        }),

    Jorden: () =>
        kuleTekstur((x, y, z) => {
            const n = fbm(x * 2.2, y * 2.2, z * 2.2, 6, 30);
            const m = fbm(x * 9, y * 9, z * 9, 3, 31);
            const ay = Math.abs(y);
            if (ay > 0.94 - (m - 0.5) * 0.12) return hex("#f2f6fa");
            if (n > 0.51) {
                const t = skaler(n, 0.51, 0.68) * 0.7 + m * 0.3;
                const tørr = ay < 0.45 ? skaler(m, 0.5, 0.7) * 0.6 : 0;
                return bland(
                    rampe(["#2f6b2c", "#4f8a3a", "#7d8a45", "#a08c5a"], t),
                    hex("#d2b77a"),
                    tørr,
                );
            }
            return rampe(
                ["#08245a", "#0f3f86", "#1f6fb3", "#3c9ad2"],
                skaler(n, 0.3, 0.51),
            );
        }),

    JordenSkyer: () =>
        kuleTekstur((x, y, z) => {
            const n = fbm(x * 3, y * 4, z * 3, 5, 40);
            return [255, 255, 255, skaler(n, 0.56, 0.75) * 220];
        }),

    Mars: () =>
        kuleTekstur((x, y, z) => {
            const n = fbm(x * 3, y * 3, z * 3, 5, 50);
            const d = fbm(x * 1.5, y * 1.5, z * 1.5, 3, 51);
            if (Math.abs(y) > 0.93) return hex("#f3ece6");
            let c = rampe(
                ["#5e2a17", "#9c4426", "#c8693b", "#e09a6a"],
                skaler(n, 0.3, 0.7),
            );
            if (d < 0.45)
                c = bland(c, hex("#4a2414"), skaler(0.45 - d, 0, 0.1) * 0.6);
            return c;
        }),

    Jupiter: () =>
        kuleTekstur((x, y, z, lat, lon) => {
            const w = fbm(x * 3, y * 3, z * 3, 4, 60);
            const b = Math.sin(y * 26 + (w - 0.5) * 4) * 0.5 + 0.5;
            const b2 = Math.sin(y * 9 + 1.3) * 0.5 + 0.5;
            const det = fbm(x * 10, y * 30, z * 10, 3, 61);
            let c = rampe(
                ["#7a4b2f", "#b8875b", "#e3c9a3", "#f6ecdc"],
                b * 0.55 + b2 * 0.25 + det * 0.2,
            );
            const f = flekk(lat, lon, -0.38, 1.2, 0.09, 0.2);
            if (f < 1) c = bland(c, hex("#b9532f"), Math.sqrt(1 - f) * 0.9);
            return c;
        }),

    Saturn: () =>
        kuleTekstur((x, y, z) => {
            const w = fbm(x * 3, y * 3, z * 3, 3, 70);
            const b = Math.sin(y * 22 + (w - 0.5) * 2) * 0.5 + 0.5;
            const det = fbm(x * 6, y * 24, z * 6, 3, 71);
            return rampe(
                ["#a8874e", "#d1b47c", "#eadbb0", "#f7efd6"],
                b * 0.6 + det * 0.4,
            );
        }),

    Uranus: () =>
        kuleTekstur((x, y, z) => {
            const n = fbm(x * 2, y * 6, z * 2, 3, 80);
            return rampe(
                ["#6bbcc7", "#9fdbe2", "#c6eff1"],
                0.35 + Math.sin(y * 7) * 0.12 + (n - 0.5) * 0.6,
            );
        }),

    Neptun: () =>
        kuleTekstur((x, y, z, lat, lon) => {
            const w = fbm(x * 3, y * 3, z * 3, 4, 90);
            const b = Math.sin(y * 12 + (w - 0.5) * 3) * 0.5 + 0.5;
            let c = rampe(
                ["#172f7a", "#2a52b8", "#4a78db", "#8fb0f0"],
                b * 0.6 + w * 0.4,
            );
            const f = flekk(lat, lon, -0.35, 2.6, 0.08, 0.16);
            if (f < 1) c = bland(c, hex("#0f1d55"), Math.sqrt(1 - f) * 0.8);
            return c;
        }),

    Manen: () =>
        kuleTekstur((x, y, z) => {
            const n = fbm(x * 2.5, y * 2.5, z * 2.5, 5, 100);
            const k = fbm(x * 16, y * 16, z * 16, 3, 101);
            let c = rampe(
                ["#6e6e6e", "#a3a3a3", "#cfcfcf"],
                skaler(n * 0.5 + k * 0.5, 0.3, 0.7),
            );
            if (n < 0.44)
                c = bland(c, hex("#4f4f52"), skaler(0.44 - n, 0, 0.08) * 0.7);
            return c;
        }),
};

// Saturns ringer: tegnes som sirkler på et kvadratisk lerret
export function ringTekstur(indreAndel) {
    const s = 1024;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = s;
    const ctx = canvas.getContext("2d");
    const bilde = ctx.createImageData(s, s);
    const d = bilde.data;
    const lys = hex("#efe2c4"),
        mork = hex("#a88d64");

    // Mønsteret avhenger bare av avstanden fra midten, så vi regner det ut én gang
    // langs radien og slår opp i tabellen – mye raskere enn å regne for hver piksel.
    const N = 2048;
    const profil = new Float32Array(N + 1);
    for (let i = 0; i <= N; i++) profil[i] = fbm((i / N) * 50, 0.5, 0.5, 4, 110);

    for (let py = 0; py < s; py++) {
        for (let px = 0; px < s; px++) {
            const dx = ((px + 0.5) / s) * 2 - 1,
                dy = ((py + 0.5) / s) * 2 - 1;
            const r = Math.sqrt(dx * dx + dy * dy);
            if (r < indreAndel || r > 1) continue;
            const t = (r - indreAndel) / (1 - indreAndel);
            const n = profil[Math.round(t * N)];
            let a = 0.35 + 0.65 * n;
            if (t < 0.18) a *= 0.3; // svak indre ring
            if (t > 0.6 && t < 0.66) a *= 0.08; // Cassini-delingen
            a *= skaler(t, 0, 0.04) * skaler(1 - t, 0, 0.04);
            const c = bland(mork, lys, n);
            const i = (py * s + px) * 4;
            d[i] = c[0];
            d[i + 1] = c[1];
            d[i + 2] = c[2];
            d[i + 3] = a * 255;
        }
    }
    ctx.putImageData(bilde, 0, 0);
    const tekstur = new THREE.CanvasTexture(canvas);
    tekstur.colorSpace = THREE.SRGBColorSpace;
    return tekstur;
}

// Myk, rund glød (til solen og stjernene)
export function glodTekstur(stopp) {
    const s = 256;
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = s;
    const ctx = canvas.getContext("2d");
    const g = ctx.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    stopp.forEach(([t, farge]) => g.addColorStop(t, farge));
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, s, s);
    const tekstur = new THREE.CanvasTexture(canvas);
    tekstur.colorSpace = THREE.SRGBColorSpace;
    return tekstur;
}
