// Regnestykkene som finner ut hvor ting står på himmelen en gitt dag.
// Ingen 3D her – bare tall, så det kan testes for seg selv.
//
// Tid måles i dager siden 1. januar 2000 kl. 12 (J2000).
// Vinkler er i grader. "Lengde" er hvor langt rundt i dyrekretsen noe står (0–360),
// "bredde" er hvor langt over eller under planet-flaten (ekliptikken) det er.

export const J2000 = Date.UTC(2000, 0, 1, 12);
export const dagerFraDato = (ms) => (ms - J2000) / 86400000;
export const datoFraDager = (d) => new Date(J2000 + d * 86400000);

const RAD = Math.PI / 180;
const sin = (g) => Math.sin(g * RAD);
const cos = (g) => Math.cos(g * RAD);
export const rundt = (g) => ((g % 360) + 360) % 360;

// ---------- Keplers lov ----------
// Løser M = E – e·sin(E). Fungerer også for veldig avlange baner (kometer).
export function kepler(Mgrad, e) {
    const M = rundt(Mgrad) * RAD;
    let E = e > 0.8 ? Math.PI : M;
    for (let i = 0; i < 30; i++) {
        const dE = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
        E -= dE;
        if (Math.abs(dE) < 1e-12) break;
    }
    return E;
}
export function sannAnomali(E, e) {
    return (
        (2 *
            Math.atan2(
                Math.sqrt(1 + e) * Math.sin(E / 2),
                Math.sqrt(1 - e) * Math.cos(E / 2),
            )) /
        RAD
    );
}

// Middelanomali: hvor langt rundt banen den "burde" vært hvis den gikk med jevn fart
function middelAnomali(b, d) {
    if (b.perihelDag !== undefined) return (360 / b.periode) * (d - b.perihelDag);
    return b.L0 + (360 / b.periode) * d - b.perihel;
}

// Planetene tegnes i sirkler, men går fortere nær solen og saktere langt ute.
// Her får vi den ekte retningen (lengden) fra solen.
export function planetLengde(p, d) {
    if (!p.e) return rundt(p.L0 + (360 / p.periode) * d);
    const E = kepler(middelAnomali(p, d), p.e);
    return rundt(sannAnomali(E, p.e) + p.perihel);
}

// Full 3D-posisjon i en avlang, skjev bane (kometer).
// Svar: x mot vårjevndøgn-punktet, y 90° videre, z nordover – i AU.
export function banePunkt(b, E) {
    const nu = sannAnomali(E, b.e);
    const r = b.a * (1 - b.e * Math.cos(E));
    const u = nu + b.perihel - b.node;
    return {
        x: r * (cos(b.node) * cos(u) - sin(b.node) * sin(u) * cos(b.inkl)),
        y: r * (sin(b.node) * cos(u) + cos(b.node) * sin(u) * cos(b.inkl)),
        z: r * sin(u) * sin(b.inkl),
        r,
    };
}
export function banePos(b, d) {
    return banePunkt(b, kepler(middelAnomali(b, d), b.e));
}

// ---------- Solen og Månen sett fra Jorden ----------
const JORDBANE = {
    au: 1.00000261,
    L0: 100.46457,
    periode: 365.256363,
    e: 0.016709,
    perihel: 102.9373,
};
export const solLengde = (d) => rundt(planetLengde(JORDBANE, d) + 180);

// Månen blir dratt i av både Jorden og Solen, så banen er ujevn.
// De største leddene fra Jean Meeus' "Astronomical Algorithms" (nøyaktig til ca. 0,1°).
export function manePos(d) {
    const L = 218.3164477 + 13.17639648 * d;
    const D = 297.8501921 + 12.19074912 * d;
    const M = 357.5291092 + 0.98560028 * d;
    const Mm = 134.9633964 + 13.06499295 * d;
    const F = 93.272095 + 13.22935024 * d;
    const lengde =
        L +
        6.288774 * sin(Mm) +
        1.274027 * sin(2 * D - Mm) +
        0.658314 * sin(2 * D) +
        0.213618 * sin(2 * Mm) -
        0.185116 * sin(M) -
        0.114332 * sin(2 * F) +
        0.058793 * sin(2 * D - 2 * Mm) +
        0.057066 * sin(2 * D - M - Mm) +
        0.053322 * sin(2 * D + Mm) +
        0.045758 * sin(2 * D - M) -
        0.040923 * sin(M - Mm) -
        0.03472 * sin(D) -
        0.030383 * sin(M + Mm);
    const bredde =
        5.128122 * sin(F) +
        0.280602 * sin(Mm + F) +
        0.277693 * sin(Mm - F) +
        0.173237 * sin(2 * D - F) +
        0.055413 * sin(2 * D - Mm + F) +
        0.046271 * sin(2 * D - Mm - F) +
        0.032573 * sin(2 * D + F) +
        0.017198 * sin(2 * Mm + F);
    // Avstand i km (Månen er nærmere noen ganger enn andre)
    const km =
        385000.56 -
        20905.355 * cos(Mm) -
        3699.111 * cos(2 * D - Mm) -
        2955.968 * cos(2 * D) -
        569.925 * cos(2 * Mm) +
        48.888 * cos(M) -
        3.149 * cos(2 * F) +
        246.158 * cos(2 * D - 2 * Mm) -
        152.138 * cos(2 * D - M - Mm) -
        170.733 * cos(2 * D + Mm) -
        204.586 * cos(2 * D - M) -
        129.62 * cos(M - Mm) +
        108.743 * cos(D) +
        104.755 * cos(M + Mm);
    // u: hvor mye Jordens skygge krymper eller vokser (Meeus kap. 54)
    const u =
        0.0059 + 0.0046 * cos(M) - 0.0182 * cos(Mm) + 0.0004 * cos(2 * Mm) - 0.0005 * cos(M + Mm);
    // Formlene over måler fra dagens vårjevndøgn-punkt, som vandrer sakte (presesjon).
    // Alt annet her bruker punktet slik det var i år 2000, så vi trekker fra vandringen.
    const presesjon = 1.396971 * (d / 36525);
    return { lengde: rundt(lengde - presesjon), bredde, km, u };
}

// Hvor langt Månen har kommet forbi Solen på himmelen: 0 = nymåne, 180 = fullmåne
export const elongasjon = (d) => rundt(manePos(d).lengde - solLengde(d));

export function manefase(d) {
    const e = elongasjon(d);
    const lys = Math.round(((1 - cos(e)) / 2) * 100); // prosent av forsiden som er belyst
    const faser = [
        ["🌑", "Nymåne"],
        ["🌒", "Voksende månesigd"],
        ["🌓", "Halvmåne (voksende)"],
        ["🌔", "Snart fullmåne"],
        ["🌕", "Fullmåne"],
        ["🌖", "Minkende måne"],
        ["🌗", "Halvmåne (minkende)"],
        ["🌘", "Minkende månesigd"],
    ];
    const [ikon, navn] = faser[Math.round(e / 45) % 8];
    return { ikon, navn, lys };
}

// Årstid i Norge – bestemt av hvor Solen står (jevndøgn og solverv)
export function arstid(d) {
    const s = solLengde(d);
    if (s < 90) return ["🌷", "Vår"];
    if (s < 180) return ["☀️", "Sommer"];
    if (s < 270) return ["🍂", "Høst"];
    return ["❄️", "Vinter"];
}

// ---------- Formørkelser ----------
// Finner neste gang elongasjonen er lik mål (0 = nymåne, 180 = fullmåne)
function nesteSyzygi(d, mal) {
    const avvik = (t) => ((elongasjon(t) - mal + 540) % 360) - 180;
    // Elongasjonen vokser ca. 12,2° per dag – hopp nesten dit, og finpuss
    let t = d + rundt(mal - elongasjon(d)) / 12.19;
    for (let i = 0; i < 6; i++) t -= avvik(t) / 12.19;
    if (t <= d + 1e-4) return nesteSyzygi(d + 1, mal);
    return t;
}

// Ved nymåne og fullmåne står Solen, Jorden og Månen nesten på linje.
// Det blir bare formørkelse når Månen samtidig er nær planet-flaten.
// gamma = hvor langt Månen går fra midtlinjen, målt i jordradier (Meeus kap. 54).
export function gammaVed(t, type) {
    const m = manePos(t);
    const mal = type === "sol" ? solLengde(t) : rundt(solLengde(t) + 180);
    const dl = ((m.lengde - mal + 540) % 360) - 180;
    const avstand = Math.hypot(dl * cos(m.bredde), m.bredde); // grader fra midtlinjen
    const parallakse = Math.asin(6378.14 / m.km) / RAD;
    return { gamma: sin(avstand) / sin(parallakse), u: m.u };
}
function sjekkFormorkelse(t, type) {
    // Finn øyeblikket Månen er nærmest midtlinjen (litt før eller etter ny/fullmåne)
    let best = t;
    for (let steg = 0.1; steg > 0.0005; steg /= 2) {
        for (const prov of [best - steg, best + steg])
            if (gammaVed(prov, type).gamma < gammaVed(best, type).gamma) best = prov;
    }
    const { gamma, u } = gammaVed(best, type);
    if (type === "sol") {
        if (gamma > 1.5433 + u) return null;
        // Er Månen langt unna, ser den litt mindre ut enn Solen: da blir det en lysende ring igjen
        const maneRadius = Math.asin(1737.4 / manePos(best).km) / RAD;
        const solAvstand = 1 - 0.01671 * cos(357.5291 + 0.98560028 * best); // i AU
        const ring = maneRadius < 0.26656 / solAvstand;
        return { dag: best, type, total: gamma < 0.9972, ring };
    }
    if (gamma > 1.0128 - u) return null; // bare halvskyggen – ser nesten ikke noe
    return { dag: best, type, total: gamma < 0.4678 - u };
}

export function nesteFormorkelse(d) {
    let t = d;
    for (let i = 0; i < 200; i++) {
        const ny = nesteSyzygi(t, 0);
        const full = nesteSyzygi(t, 180);
        const [forst, type] = ny < full ? [ny, "sol"] : [full, "mane"];
        const f = sjekkFormorkelse(forst, type);
        if (f) return f;
        t = forst + 0.5;
    }
    return null;
}

// ---------- Himmelkoordinater ----------
// Stjernekart bruker rektascensjon (timer) og deklinasjon (grader) – vi gjør dem om
// til samme retninger som planetene bruker.
const SKRAATT = 23.4393; // jordaksens helning
export function ekvatorTilEkliptikk(raTimer, dekl) {
    const ra = raTimer * 15;
    const x = cos(dekl) * cos(ra),
        y = cos(dekl) * sin(ra),
        z = sin(dekl);
    return {
        x,
        y: y * cos(SKRAATT) + z * sin(SKRAATT),
        z: -y * sin(SKRAATT) + z * cos(SKRAATT),
    };
}

// ---------- Sett fra et sted på Jorden ----------
// Planetens plass i rommet (AU), med ekte avlang og skjev bane
export function helioPos(p, d) {
    return banePos(
        {
            a: p.au,
            e: p.e ?? 0,
            inkl: p.inkl ?? 0,
            node: p.node ?? 0,
            perihel: p.perihel ?? 0,
            L0: p.L0,
            periode: p.periode,
        },
        d,
    );
}
export const jordPos = (d) => helioPos(JORDBANE, d);

// Pil fra Jorden til en planet (AU). Solen er der Jorden er "baklengs".
export function geoPos(p, d) {
    const pl = helioPos(p, d),
        j = jordPos(d);
    return { x: pl.x - j.x, y: pl.y - j.y, z: pl.z - j.z };
}
export function geoSol(d) {
    const j = jordPos(d);
    return { x: -j.x, y: -j.y, z: -j.z };
}

// Stjernetid: hvor langt Jorden har snurrd – sier hvilke stjerner som står rett i sør (grader)
export const stjernetid = (d, lengdegrad) =>
    rundt(280.46061837 + 360.98564736629 * d + lengdegrad);

// Rett opp (senit) fra et sted på Jorden, i samme koordinater som alt annet
export const senit = (d, bredde, lengde) =>
    ekvatorTilEkliptikk(stjernetid(d, lengde) / 15, bredde);

// Rett nord langs bakken (mot himmelpolen, men flatt langs horisonten)
export function nordRetning(d, bredde, lengde) {
    const z = senit(d, bredde, lengde);
    const pol = ekvatorTilEkliptikk(0, 90);
    const dot = pol.x * z.x + pol.y * z.y + pol.z * z.z;
    const n = { x: pol.x - dot * z.x, y: pol.y - dot * z.y, z: pol.z - dot * z.z };
    const l = Math.hypot(n.x, n.y, n.z) || 1;
    return { x: n.x / l, y: n.y / l, z: n.z / l };
}

// Månen sett fra der du står, ikke fra midten av Jorden. Den er så nær at det
// utgjør nesten 1° – nok til at en solformørkelse er total ett sted og delvis et annet.
export function maneTopo(d, bredde, lengde) {
    const m = manePos(d);
    const v = {
        x: m.km * cos(m.bredde) * cos(m.lengde),
        y: m.km * cos(m.bredde) * sin(m.lengde),
        z: m.km * sin(m.bredde),
    };
    const z = senit(d, bredde, lengde);
    return { x: v.x - 6378.14 * z.x, y: v.y - 6378.14 * z.y, z: v.z - 6378.14 * z.z };
}

// Høyde over horisonten i grader for en retning
export function hoyde(v, d, bredde, lengde) {
    const z = senit(d, bredde, lengde);
    const l = Math.hypot(v.x, v.y, v.z);
    return Math.asin((v.x * z.x + v.y * z.y + v.z * z.z) / l) / RAD;
}
