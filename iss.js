// Den internasjonale romstasjonen (ISS).
// Banen kan ikke regnes ut på forhånd som planetene: lufta bremser den, og den justeres
// med rakettmotorer. Derfor henter vi ferske banedata ("TLE") fra internett, og lar
// satellite.js regne ut hvor den er. Det blir nøyaktig noen dager før og etter dataene.
import {
    twoline2satrec,
    propagate,
    gstime,
    eciToGeodetic,
    geodeticToEcf,
    ecfToEci,
} from "satellite.js";
import {
    geoSol,
    hoyde,
    ekliptikkVektorTilEkv,
    ekvVektorTilEkliptikk,
    dagerFraDato,
} from "./astro.js";

const KILDER = [
    [
        "https://celestrak.org/NORAD/elements/gp.php?CATNR=25544&FORMAT=TLE",
        (tekst) => tekst.trim().split(/\r?\n/).slice(-2),
    ],
    [
        "https://api.wheretheiss.at/v1/satellites/25544/tles",
        (tekst) => {
            const j = JSON.parse(tekst);
            return [j.line1, j.line2];
        },
    ],
];
const HUSKET = "solsystem-iss-banedata";
const JORDRADIUS = 6371;
const GYLDIG_DAGER = 10; // så lenge før og etter dataene stoler vi på posisjonen
export const BYGGESTART = Date.UTC(1998, 10, 20); // første del ble skutt opp 20. november 1998

let bane = null;
let epokeMs = null;

function bruk(l1, l2) {
    bane = twoline2satrec(l1.trim(), l2.trim());
    epokeMs = (bane.jdsatepoch + (bane.jdsatepochF ?? 0) - 2440587.5) * 86400000;
}

// Henter banedata. Uten nett bruker vi de siste vi husker (hvis noen).
export async function hentBanedata() {
    for (const [url, les] of KILDER) {
        try {
            const svar = await fetch(url);
            if (!svar.ok) continue;
            const [l1, l2] = les(await svar.text());
            bruk(l1, l2);
            try {
                localStorage.setItem(HUSKET, JSON.stringify({ l1, l2 }));
            } catch {
                // lagring er bare en bonus
            }
            return true;
        } catch {
            // prøv neste kilde
        }
    }
    try {
        const husket = JSON.parse(localStorage.getItem(HUSKET));
        if (husket) {
            bruk(husket.l1, husket.l2);
            return true;
        }
    } catch {
        // ingenting husket
    }
    return false;
}

// "ok", "ingen-data" (ikke lastet / ikke nett), "fantes-ikke" (før 1998) eller "for-langt" (for langt fra dataene)
export function issStatus(ms) {
    if (ms < BYGGESTART) return "fantes-ikke";
    if (!bane) return "ingen-data";
    if (Math.abs(ms - epokeMs) > GYLDIG_DAGER * 86400000) return "for-langt";
    return "ok";
}

// Posisjon i km fra Jordens sentrum (ekvator-koordinater), pluss litt ekstra info
export function issPos(ms) {
    if (issStatus(ms) !== "ok") return null;
    const dato = new Date(ms);
    const pv = propagate(bane, dato);
    if (!pv?.position) return null;
    const p = pv.position,
        v = pv.velocity;
    const geo = eciToGeodetic(p, gstime(dato));
    return {
        pos: { x: p.x, y: p.y, z: p.z },
        fart: { x: v.x, y: v.y, z: v.z },
        hoydeKm: geo.height,
        fartKmt: Math.hypot(v.x, v.y, v.z) * 3600,
        bredde: (geo.latitude * 180) / Math.PI,
        lengde: (geo.longitude * 180) / Math.PI,
    };
}

// Er ISS i sollys? (Ellers er den i Jordens skygge, og da kan vi ikke se den.)
export function iSollys(pos, ms) {
    const s = ekliptikkVektorTilEkv(geoSol(dagerFraDato(ms)));
    const l = Math.hypot(s.x, s.y, s.z);
    const sol = { x: s.x / l, y: s.y / l, z: s.z / l };
    const langs = pos.x * sol.x + pos.y * sol.y + pos.z * sol.z;
    if (langs > 0) return true; // på dagsiden
    const tvers = Math.hypot(pos.x - langs * sol.x, pos.y - langs * sol.y, pos.z - langs * sol.z);
    return tvers > JORDRADIUS;
}

// Pil fra et sted på bakken til ISS (km, ekvator-koordinater)
export function fraSted(pos, ms, sted) {
    const rad = Math.PI / 180;
    const ecf = geodeticToEcf({
        latitude: sted.bredde * rad,
        longitude: sted.lengde * rad,
        height: 0,
    });
    const meg = ecfToEci(ecf, gstime(new Date(ms)));
    return { x: pos.x - meg.x, y: pos.y - meg.y, z: pos.z - meg.z };
}

// Hvor høyt over horisonten (grader) og om det er mørkt nok til å se den
export function synlighet(ms, sted) {
    const p = issPos(ms);
    if (!p) return null;
    const pil = fraSted(p.pos, ms, sted);
    const d = dagerFraDato(ms);
    const h = hoyde(ekvVektorTilEkliptikk(pil), d, sted.bredde, sted.lengde);
    const solH = hoyde(geoSol(d), d, sted.bredde, sted.lengde);
    const sollys = iSollys(p.pos, ms);
    return { hoyde: h, solHoyde: solH, sollys, kanSees: h > 0 && sollys && solH < -4, pil, p };
}

// Neste gang ISS kan sees fra stedet (høyere enn 10°, i sollys, og mørkt på bakken)
export function nestePassering(fraMs, sted, dager = 4) {
    const steg = 20000;
    for (let t = fraMs; t < fraMs + dager * 86400000; t += steg) {
        if (issStatus(t) !== "ok") return null;
        const s = synlighet(t, sted);
        if (!s?.kanSees || s.hoyde < 10) continue;
        // Fant en: gå tilbake til der den kom til syne, og finn toppen
        let start = t;
        while (synlighet(start - steg, sted)?.kanSees) start -= steg;
        let topp = start,
            maks = -90,
            slutt = start;
        for (let u = start; synlighet(u, sted)?.kanSees; u += steg) {
            const h = synlighet(u, sted).hoyde;
            if (h > maks) {
                maks = h;
                topp = u;
            }
            slutt = u;
        }
        return { start, topp, slutt, maksHoyde: maks };
    }
    return null;
}
