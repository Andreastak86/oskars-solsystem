import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
    CSS2DRenderer,
    CSS2DObject,
} from "three/addons/renderers/CSS2DRenderer.js";
import { solen, planeter, manen, belte, AU_SKALA } from "./planets.js";
import { teksturer, ringTekstur, glodTekstur } from "./textures.js";

// ============ Scene, kamera og renderere ============
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    45,
    innerWidth / innerHeight,
    0.05,
    20000,
);
camera.position.set(0, 600, 900);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

// Egen renderer for navnelappene (vanlig HTML oppå 3D-bildet)
const etikettRenderer = new CSS2DRenderer();
etikettRenderer.setSize(innerWidth, innerHeight);
etikettRenderer.domElement.className = "etikett-lag";
document.body.appendChild(etikettRenderer.domElement);

const kontroller = new OrbitControls(camera, renderer.domElement);
kontroller.enableDamping = true;
kontroller.minDistance = solen.storrelse * 1.5;
kontroller.maxDistance = 3000;

// ============ Lys ============
scene.add(new THREE.AmbientLight(0x8899bb, 0.12));
const sollys = new THREE.PointLight(0xfff2dd, 3, 0, 0); // decay 0 = lyset når like langt overalt
scene.add(sollys);

// ============ Stjernehimmel ============
{
    const antall = 7000;
    const pos = new Float32Array(antall * 3);
    const farge = new Float32Array(antall * 3);
    const tint = [
        new THREE.Color("#ffffff"),
        new THREE.Color("#bcd2ff"),
        new THREE.Color("#ffe1b8"),
    ];
    for (let i = 0; i < antall; i++) {
        const v = new THREE.Vector3()
            .randomDirection()
            .multiplyScalar(4000 + Math.random() * 3000);
        pos.set([v.x, v.y, v.z], i * 3);
        const c = tint[Math.floor(Math.random() * 3)]
            .clone()
            .multiplyScalar(0.3 + Math.random() * 0.7);
        farge.set([c.r, c.g, c.b], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(farge, 3));
    const mat = new THREE.PointsMaterial({
        size: 2.2,
        sizeAttenuation: false,
        vertexColors: true,
        map: glodTekstur([
            [0, "#fff"],
            [0.4, "rgba(255,255,255,0.6)"],
            [1, "rgba(255,255,255,0)"],
        ]),
        transparent: true,
        depthWrite: false,
    });
    scene.add(new THREE.Points(geo, mat));
}

// ============ Solen ============
const kropper = []; // alt man kan klikke på
const klikkbare = [];

function lagEtikett(data, hoyde) {
    const div = document.createElement("div");
    div.className = "etikett";
    div.textContent = data.navn;
    const obj = new CSS2DObject(div);
    obj.position.set(0, hoyde, 0);
    obj.center.set(0.5, 1);
    return obj;
}

const solGruppe = new THREE.Group();
scene.add(solGruppe);
const solMesh = new THREE.Mesh(
    new THREE.SphereGeometry(solen.storrelse, 64, 32),
    new THREE.MeshBasicMaterial({ map: teksturer.Solen() }),
);
solGruppe.add(solMesh);

const glod1 = new THREE.Sprite(
    new THREE.SpriteMaterial({
        map: glodTekstur([
            [0, "rgba(255,240,200,1)"],
            [0.2, "rgba(255,190,90,0.7)"],
            [0.45, "rgba(255,120,30,0.18)"],
            [1, "rgba(255,80,0,0)"],
        ]),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    }),
);
glod1.scale.setScalar(solen.storrelse * 5);
const glod2 = new THREE.Sprite(
    new THREE.SpriteMaterial({
        map: glodTekstur([
            [0, "rgba(255,200,120,0.5)"],
            [0.3, "rgba(255,140,50,0.12)"],
            [1, "rgba(255,100,0,0)"],
        ]),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    }),
);
glod2.scale.setScalar(solen.storrelse * 12);
solGruppe.add(glod1, glod2);

const solEtikett = lagEtikett(solen, solen.storrelse + 1);
solGruppe.add(solEtikett);
const solKropp = {
    data: solen,
    holder: solGruppe,
    mesh: solMesh,
    etikett: solEtikett,
};
solMesh.userData.kropp = solKropp;
kropper.push(solKropp);
klikkbare.push(solMesh);

// ============ Planetene ============
const banerGruppe = new THREE.Group();
scene.add(banerGruppe);

function lagBane(farge) {
    const punkter = [];
    for (let i = 0; i <= 256; i++) {
        const a = (i / 256) * Math.PI * 2;
        punkter.push(new THREE.Vector3(Math.cos(a), 0, -Math.sin(a)));
    }
    const geo = new THREE.BufferGeometry().setFromPoints(punkter);
    return new THREE.Line(
        geo,
        new THREE.LineBasicMaterial({
            color: farge,
            transparent: true,
            opacity: 0.28,
        }),
    );
}

// ============ Avlange baner (Pluto) ============
// Planetene over går i sirkler. Pluto har en avlang, skjev bane, så vi regner ut
// hvor den er med Keplers lov. Svaret er en retning (lengde 1) og avstanden i AU.
const grad = THREE.MathUtils.degToRad;
function banePunkt(p, E) {
    const nu =
        2 *
        Math.atan2(
            Math.sqrt(1 + p.e) * Math.sin(E / 2),
            Math.sqrt(1 - p.e) * Math.cos(E / 2),
        );
    const r = p.au * (1 - p.e * Math.cos(E));
    const u = nu + grad(p.perihel - p.node);
    const O = grad(p.node),
        i = grad(p.inkl);
    const X = Math.cos(O) * Math.cos(u) - Math.sin(O) * Math.sin(u) * Math.cos(i);
    const Y = Math.sin(O) * Math.cos(u) + Math.cos(O) * Math.sin(u) * Math.cos(i);
    const Z = Math.sin(u) * Math.sin(i);
    // Samme retninger som planetene: ekliptikkens X → x, Y → –z, nordover → y
    return { retning: new THREE.Vector3(X, Z, -Y), r };
}
function keplerPos(p, dager) {
    const M = grad(p.L0 + (360 / p.periode) * dager - p.perihel);
    let E = M;
    for (let k = 0; k < 8; k++)
        E -= (E - p.e * Math.sin(E) - M) / (1 - p.e * Math.cos(E));
    return banePunkt(p, E);
}

// Kompakt avstand for en ekte avstand i AU: vi følger de samme trinnene som planetene
// (Uranus → Neptun) og fortsetter videre utover. Da krysser Pluto innenfor Neptun
// akkurat så mye som i virkeligheten.
const sirkelPlaneter = planeter.filter((p) => p.e === undefined);
function kompaktFraAU(au) {
    let i = 1;
    while (i < sirkelPlaneter.length - 1 && au > sirkelPlaneter[i].au) i++;
    const a = sirkelPlaneter[i - 1],
        b = sirkelPlaneter[i];
    return a.kompakt + ((au - a.au) / (b.au - a.au)) * (b.kompakt - a.kompakt);
}

function lagAvlangBane(p) {
    const N = 512;
    const punkter = [];
    for (let i = 0; i <= N; i++) punkter.push(banePunkt(p, (i / N) * Math.PI * 2));
    const geo = new THREE.BufferGeometry().setFromPoints(
        punkter.map(() => new THREE.Vector3()),
    );
    const linje = new THREE.Line(
        geo,
        new THREE.LineDashedMaterial({
            color: p.prikk,
            transparent: true,
            opacity: 0.35,
        }),
    );
    linje.userData.punkter = punkter;
    return linje;
}
// Tegner banen på nytt for gjeldende avstandsmodus (stiplet = dvergplanet)
function oppdaterAvlangBane(linje) {
    const pos = linje.geometry.attributes.position;
    linje.userData.punkter.forEach(({ retning, r }, i) => {
        const v = retning.clone().multiplyScalar(radius(kompaktFraAU(r), r));
        pos.setXYZ(i, v.x, v.y, v.z);
    });
    pos.needsUpdate = true;
    linje.geometry.computeBoundingSphere();
    linje.computeLineDistances();
    const d = linje.geometry.attributes.lineDistance;
    const strek = d.getX(d.count - 1) / 240;
    linje.material.dashSize = strek;
    linje.material.gapSize = strek * 0.8;
}

let jordKropp;
for (const p of planeter) {
    const holder = new THREE.Group(); // flytter seg rundt solen
    const tilt = new THREE.Group(); // gjør planeten skjev
    tilt.rotation.z = -THREE.MathUtils.degToRad(p.tilt);
    holder.add(tilt);
    scene.add(holder);

    const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(p.storrelse, 64, 32),
        new THREE.MeshStandardMaterial({
            map: teksturer[p.navn](),
            roughness: 1,
            metalness: 0,
        }),
    );
    tilt.add(mesh);

    const kropp = { data: p, holder, tilt, mesh };

    if (p.navn === "Jorden") {
        const skyer = new THREE.Mesh(
            new THREE.SphereGeometry(p.storrelse * 1.015, 64, 32),
            new THREE.MeshStandardMaterial({
                map: teksturer.JordenSkyer(),
                transparent: true,
                depthWrite: false,
            }),
        );
        tilt.add(skyer);
        kropp.skyer = skyer;
        jordKropp = kropp;
    }

    if (p.ring) {
        const indre = p.storrelse * 1.25,
            ytre = p.storrelse * 2.3;
        const ring = new THREE.Mesh(
            new THREE.RingGeometry(indre, ytre, 128),
            new THREE.MeshStandardMaterial({
                map: ringTekstur(indre / ytre),
                side: THREE.DoubleSide,
                transparent: true,
                depthWrite: false,
                roughness: 1,
            }),
        );
        ring.rotation.x = -Math.PI / 2;
        tilt.add(ring);
    }

    const bane = p.e !== undefined ? lagAvlangBane(p) : lagBane(p.prikk);
    banerGruppe.add(bane);
    kropp.bane = bane;

    kropp.etikett = lagEtikett(p, p.storrelse * (p.ring ? 1.3 : 1) + 0.5);
    holder.add(kropp.etikett);

    mesh.userData.kropp = kropp;
    kropper.push(kropp);
    klikkbare.push(mesh);
}

// ============ Månen ============
const maneBane = new THREE.Group(); // følger jorden, men står ikke skjevt
jordKropp.holder.add(maneBane);
const maneMesh = new THREE.Mesh(
    new THREE.SphereGeometry(manen.storrelse, 48, 24),
    new THREE.MeshStandardMaterial({ map: teksturer.Manen(), roughness: 1 }),
);
maneMesh.position.x = manen.avstand;
maneBane.add(maneMesh);
const maneEtikett = lagEtikett(manen, manen.storrelse + 0.3);
maneEtikett.element.classList.add("liten");
maneMesh.add(maneEtikett);
const maneKropp = {
    data: manen,
    holder: maneMesh,
    mesh: maneMesh,
    etikett: maneEtikett,
};
maneMesh.userData.kropp = maneKropp;
kropper.push(maneKropp);
klikkbare.push(maneMesh);

// ============ Asteroidebeltet ============
const belteGruppe = new THREE.Group();
scene.add(belteGruppe);
{
    const antall = 4000;
    const pos = new Float32Array(antall * 3);
    const farge = new Float32Array(antall * 3);
    for (let i = 0; i < antall; i++) {
        const a = Math.random() * Math.PI * 2;
        const r =
            1 + (Math.random() + Math.random() + Math.random() - 1.5) * 0.1;
        pos.set(
            [Math.cos(a) * r, (Math.random() - 0.5) * 0.8, -Math.sin(a) * r],
            i * 3,
        );
        const g = 0.35 + Math.random() * 0.35;
        farge.set([g * 1.05, g * 0.95, g * 0.85], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(farge, 3));
    belteGruppe.add(
        new THREE.Points(
            geo,
            new THREE.PointsMaterial({
                size: 0.1,
                vertexColors: true,
                map: glodTekstur([
                    [0, "#fff"],
                    [0.5, "#fff"],
                    [0.7, "rgba(255,255,255,0)"],
                ]),
                alphaTest: 0.5,
            }),
        ),
    );
}

// ============ Tid ============
// Vi teller tid i dager siden 1. januar 2000 kl. 12 (det astronomer kaller J2000)
const J2000 = Date.UTC(2000, 0, 1, 12);
const dagerNa = () => (Date.now() - J2000) / 86400000;
let simDager = dagerNa();
let dagerPerSek = 1 / 86400;
let pauset = false;

// ============ Avstandsmodus ============
// 0 = kompakt (alt synlig), 1 = ekte avstander
let avstand = 0;
let avstandMal = 0;
const radius = (kompakt, au) =>
    THREE.MathUtils.lerp(kompakt, au * AU_SKALA, avstand);

// ============ Kamerabevegelse ============
let fokus = null;
let fly = null;
const sistePos = new THREE.Vector3();
const opp = new THREE.Vector3(0, 1, 0);
const myk = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

function verdenPos(kropp) {
    return kropp.mesh.getWorldPosition(new THREE.Vector3());
}

function oversiktPosisjon() {
    return avstandMal === 1
        ? new THREE.Vector3(0, 560, 1010) // langt nok ut til at hele Pluto-banen synes
        : new THREE.Vector3(0, 85, 150);
}

function fokuser(kropp) {
    fokus = kropp;
    const p = verdenPos(kropp);
    const d = kropp.data.storrelse * (kropp === solKropp ? 4 : 5) + 1.2;
    const utover = p.clone().setY(0);
    const retning =
        utover.lengthSq() > 0.01
            ? utover.normalize().negate()
            : new THREE.Vector3(0, 0, 1);
    const offset = retning.applyAxisAngle(opp, 0.75).multiplyScalar(d);
    offset.y = d * 0.3;
    fly = {
        t: 0,
        varighet: 1.8,
        startPos: camera.position.clone(),
        startMal: kontroller.target.clone(),
        offset,
    };
    kontroller.enabled = false;
    kontroller.minDistance = kropp.data.storrelse * 1.5;
    sistePos.copy(p);
    visInfo(kropp.data);
    oppdaterNavKnapper();
}

function tilOversikt(varighet = 1.8) {
    fokus = null;
    fly = {
        t: 0,
        varighet,
        startPos: camera.position.clone(),
        startMal: kontroller.target.clone(),
        sluttPos: oversiktPosisjon(),
        sluttMal: new THREE.Vector3(),
    };
    kontroller.enabled = false;
    kontroller.minDistance = solen.storrelse * 1.5;
    skjulInfo();
    oppdaterNavKnapper();
}

// ============ Brukergrensesnitt ============
const $ = (s) => document.querySelector(s);
const info = $("#info");

if (matchMedia("(pointer: coarse)").matches) {
    $(".hint").textContent = "👆 Trykk på en planet for å fly dit!";
}

// Faktaboksen trenger å vite hvor høyt bunnpanelet er (det varierer med skjermbredden)
const bunn = $(".bunn");
new ResizeObserver(() =>
    document.documentElement.style.setProperty(
        "--bunn-hoyde",
        `${bunn.offsetHeight}px`,
    ),
).observe(bunn);

function visInfo(data) {
    $("#info-type").textContent = data.type;
    $("#info-navn").textContent = data.navn;
    $("#info-kallenavn").textContent = data.kallenavn;
    info.style.setProperty("--prikk", data.prikk);
    $("#info-stats").innerHTML = data.stats
        .map(
            ([ikon, hva, svar]) =>
                `<div class="stat"><dt><span class="ikon">${ikon}</span> ${hva}</dt><dd>${svar}</dd></div>`,
        )
        .join("");
    $("#info-fakta").innerHTML = data.fakta
        .map(
            ([ikon, tekst]) =>
                `<li><span class="ikon">${ikon}</span><span>${tekst}</span></li>`,
        )
        .join("");
    info.scrollTop = 0;
    info.classList.add("vis");
}
function skjulInfo() {
    info.classList.remove("vis");
}
$("#tilbake").addEventListener("click", () => tilOversikt());
$("#lukk").addEventListener("click", () => tilOversikt());

// Navigasjonsknapper
const nav = $("#nav");
const alleKropper = [
    solKropp,
    ...kropper.filter((k) => planeter.includes(k.data)),
    maneKropp,
];
for (const k of alleKropper) {
    const b = document.createElement("button");
    b.innerHTML = `<span class="prikk" style="--prikk:${k.data.prikk}"></span>${k.data.navn}`;
    b.addEventListener("click", () =>
        fokus === k ? tilOversikt() : fokuser(k),
    );
    k.knapp = b;
    nav.appendChild(b);
}
function oppdaterNavKnapper() {
    for (const k of alleKropper) k.knapp.classList.toggle("aktiv", fokus === k);
    $("#meny-planeter-tekst").textContent = fokus
        ? `🪐 ${fokus.data.navn}`
        : "🪐 Planeter";
}

// Nedtrekksmenyer på mobil: bare én meny åpen om gangen
const menyKnapper = {
    planeter: $("#meny-planeter"),
    kontroller: $("#meny-kontroller"),
};
let apenMeny = null;
function settMeny(navn) {
    apenMeny = navn;
    for (const [n, knapp] of Object.entries(menyKnapper)) {
        bunn.classList.toggle(`apen-${n}`, n === navn);
        knapp.setAttribute("aria-expanded", n === navn);
    }
}
for (const [n, knapp] of Object.entries(menyKnapper)) {
    knapp.addEventListener("click", () => settMeny(apenMeny === n ? null : n));
}
// Lukk planetmenyen når man har valgt en planet
nav.addEventListener("click", (e) => {
    if (e.target.closest("button") && apenMeny === "planeter") settMeny(null);
});

// Klikk på navnelappene
for (const k of kropper) {
    k.etikett.element.addEventListener("click", (e) => {
        e.stopPropagation();
        fokuser(k);
    });
}

// Klikk på selve planetene
const stråle = new THREE.Raycaster();
const peker = new THREE.Vector2();
let nedXY = null;
renderer.domElement.addEventListener("pointerdown", (e) => {
    nedXY = [e.clientX, e.clientY];
    settMeny(null); // trykk i rommet lukker åpne menyer
});
renderer.domElement.addEventListener("pointerup", (e) => {
    if (!nedXY || Math.hypot(e.clientX - nedXY[0], e.clientY - nedXY[1]) > 5)
        return;
    peker.set(
        (e.clientX / innerWidth) * 2 - 1,
        -(e.clientY / innerHeight) * 2 + 1,
    );
    stråle.setFromCamera(peker, camera);
    const treff = stråle.intersectObjects(klikkbare, false)[0];
    if (treff) fokuser(treff.object.userData.kropp);
});
addEventListener("keydown", (e) => {
    if (e.key === "Escape") tilOversikt();
    if (e.key === " ") {
        e.preventDefault();
        settPause(!pauset);
    }
});

// Fart
const fart = $("#fart");
const fartTekst = $("#fart-tekst");
// Logaritmisk skala: helt til venstre = sanntid (1 sekund = 1 sekund), helt til høyre = ca. 14 år per sekund
const SANNTID = 1 / 86400;
const tilDager = (v) => SANNTID * Math.pow(10, v * 0.0864);
// "1 minutt", "2 minutter" osv.
const antall = (n, en, flere) => `${n} ${n === 1 ? en : flere}`;
function formaterFart(d) {
    const sek = d * 86400;
    if (sek < 60) return antall(Math.round(sek), "sekund", "sekunder");
    if (sek < 3600) return antall(Math.round(sek / 60), "minutt", "minutter");
    if (d < 1) return antall(Math.round(d * 24), "time", "timer");
    if (d < 60) return antall(Math.round(d), "dag", "dager");
    if (d < 365) return antall(Math.round(d / 30.4), "måned", "måneder");
    return antall(Math.round(d / 365.25), "år", "år");
}
function oppdaterFart() {
    dagerPerSek = tilDager(+fart.value);
    fartTekst.textContent =
        dagerPerSek * 86400 < 1.5
            ? "Vanlig fart"
            : `1 sekund = ${formaterFart(dagerPerSek)}`;
}
fart.addEventListener("input", oppdaterFart);
oppdaterFart();

const pauseKnapp = $("#pause");
function settPause(p) {
    pauset = p;
    pauseKnapp.textContent = p ? "▶️" : "⏸️";
    pauseKnapp.title = p ? "Spill av" : "Pause";
}
pauseKnapp.addEventListener("click", () => settPause(!pauset));
$("#idag").addEventListener("click", () => {
    simDager = dagerNa();
    fart.value = 0; // tilbake til sanntid
    oppdaterFart();
});

$("#vis-navn").addEventListener("change", (e) => {
    etikettRenderer.domElement.style.display = e.target.checked ? "" : "none";
});
$("#vis-baner").addEventListener(
    "change",
    (e) => (banerGruppe.visible = e.target.checked),
);
$("#ekte").addEventListener("change", (e) => {
    avstandMal = e.target.checked ? 1 : 0;
    if (!fokus) tilOversikt(2.5);
});

const datoTekst = $("#dato");
const datoFormat = new Intl.DateTimeFormat("nb-NO", {
    day: "numeric",
    month: "long",
    year: "numeric",
});
const klokkeFormat = new Intl.DateTimeFormat("nb-NO", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
});

// ============ Animasjonsløkken ============
let forrige = performance.now();
const skjermA = new THREE.Vector3();
const skjermB = new THREE.Vector3();

// Skjul en navnelapp hvis den havner oppå "forelderen" sin på skjermen (planet oppå solen, månen oppå jorden)
function skjulHvisNaer(kropp, forelder, piksler) {
    if (kropp === fokus) {
        kropp.etikett.visible = true;
        return;
    }
    skjermA.copy(verdenPos(kropp)).project(camera);
    skjermB.copy(verdenPos(forelder)).project(camera);
    const dx = ((skjermA.x - skjermB.x) * innerWidth) / 2;
    const dy = ((skjermA.y - skjermB.y) * innerHeight) / 2;
    kropp.etikett.visible = Math.hypot(dx, dy) > piksler;
}

function animer() {
    const na = performance.now();
    const dt = Math.min((na - forrige) / 1000, 0.1);
    forrige = na;

    if (!pauset) simDager += dagerPerSek * dt;
    const spinnFart = pauset ? 0 : 1;

    // Myk overgang mellom kompakt og ekte avstander
    avstand += (avstandMal - avstand) * Math.min(1, dt * 2.5);

    // Planetene: vinkel = hvor den sto i år 2000 + hvor langt den har gått siden
    for (const k of kropper) {
        const p = k.data;
        if (!k.bane) continue; // solen og månen går ikke i bane rundt solen
        k.mesh.rotation.y += p.spinn * dt * spinnFart;
        if (p.e !== undefined) {
            const { retning, r: au } = keplerPos(p, simDager);
            k.holder.position.copy(retning).multiplyScalar(radius(kompaktFraAU(au), au));
            if (k.bane.userData.avstand !== avstand) {
                oppdaterAvlangBane(k.bane);
                k.bane.userData.avstand = avstand;
            }
            continue;
        }
        const r = radius(p.kompakt, p.au);
        const vinkel = THREE.MathUtils.degToRad(
            p.L0 + (360 / p.periode) * simDager,
        );
        k.holder.position.set(Math.cos(vinkel) * r, 0, -Math.sin(vinkel) * r);
        k.bane.scale.setScalar(r);
    }
    if (jordKropp.skyer) jordKropp.skyer.rotation.y += 0.6 * dt * spinnFart;
    maneBane.rotation.y = THREE.MathUtils.degToRad(
        manen.L0 + (360 / manen.periode) * simDager,
    );

    const br = radius(belte.kompakt, belte.au);
    belteGruppe.scale.set(br, 1, br);
    belteGruppe.rotation.y = ((Math.PI * 2) / belte.periode) * simDager;

    solMesh.rotation.y += 0.05 * dt * spinnFart;
    glod1.material.rotation += 0.02 * dt;
    glod2.scale.setScalar(
        solen.storrelse * (12 + Math.sin(performance.now() / 900) * 0.6),
    );

    // Kamera
    if (fokus) {
        const p = verdenPos(fokus);
        if (fly) {
            fly.t += dt / fly.varighet;
            const e = myk(Math.min(1, fly.t));
            camera.position.lerpVectors(
                fly.startPos,
                p.clone().add(fly.offset),
                e,
            );
            kontroller.target.lerpVectors(fly.startMal, p, e);
            if (fly.t >= 1) {
                fly = null;
                kontroller.enabled = true;
            }
        } else {
            camera.position.add(p.clone().sub(sistePos)); // følg etter planeten
            kontroller.target.copy(p);
        }
        sistePos.copy(p);
    } else if (fly) {
        fly.t += dt / fly.varighet;
        const e = myk(Math.min(1, fly.t));
        camera.position.lerpVectors(fly.startPos, fly.sluttPos, e);
        kontroller.target.lerpVectors(fly.startMal, fly.sluttMal, e);
        if (fly.t >= 1) {
            fly = null;
            kontroller.enabled = true;
        }
    }

    kontroller.update();

    for (const k of kropper) {
        if (k === solKropp) continue;
        if (k === maneKropp) skjulHvisNaer(k, jordKropp, 45);
        else skjulHvisNaer(k, solKropp, 40);
    }

    const simDato = new Date(J2000 + simDager * 86400000);
    // Vis klokkeslett også når det går sakte nok til at det gir mening
    datoTekst.textContent =
        dagerPerSek < 0.05
            ? `${datoFormat.format(simDato)} · ${klokkeFormat.format(simDato)}`
            : datoFormat.format(simDato);

    renderer.render(scene, camera);
    etikettRenderer.render(scene, camera);
    requestAnimationFrame(animer);
}

addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(innerWidth, innerHeight);
    etikettRenderer.setSize(innerWidth, innerHeight);
});

tilOversikt(3.5); // flyr inn fra verdensrommet når siden åpnes
animer();
