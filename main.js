import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import {
    CSS2DRenderer,
    CSS2DObject,
} from "three/addons/renderers/CSS2DRenderer.js";
import { solen, planeter, manen, halley, belte, AU_SKALA } from "./planets.js";
import { teksturer, ringTekstur, glodTekstur } from "./textures.js";
import {
    dagerFraDato,
    datoFraDager,
    planetLengde,
    banePos,
    banePunkt,
    manePos,
    solLengde,
    elongasjon,
    manefase,
    arstid,
    gammaVed,
    nesteFormorkelse,
    ekvatorTilEkliptikk,
    geoSol,
    maneTopo,
    hoyde,
} from "./astro.js";
import {
    stjerner,
    stjernebilder,
    kjenteStjerner,
    galaksen,
} from "./stjerner.js";
import { STOY_GLSL } from "./shader.js";
import { lagBakke, dekning } from "./bakke.js";
import { lastInn, lagPanel, gjeldendeSted } from "./innstillinger.js";

// ============ Retninger ============
// Astronomene måler i "ekliptikk-koordinater": x mot vårjevndøgn-punktet, y 90° videre
// rundt, z rett opp fra planet-flaten. I scenen er "opp" y, så vi bytter om.
const tilScene = ({ x, y, z }) => new THREE.Vector3(x, z, -y);
const ekliptikkRetning = (lengdeGrader, breddeGrader = 0) => {
    const l = THREE.MathUtils.degToRad(lengdeGrader),
        b = THREE.MathUtils.degToRad(breddeGrader);
    return tilScene({
        x: Math.cos(b) * Math.cos(l),
        y: Math.cos(b) * Math.sin(l),
        z: Math.sin(b),
    });
};
const himmelRetning = ([raTimer, dekl]) =>
    tilScene(ekvatorTilEkliptikk(raTimer, dekl)).normalize();

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

// ============ Himmelen: Melkeveien og stjernene ============
// Alt på himmelen er så langt unna at det aldri flytter seg når vi flyr rundt.
// Derfor henger det i en gruppe som følger med kameraet.
const himmel = new THREE.Group();
scene.add(himmel);

// Retningene til Melkeveien: midten (i Skytten) og "nordpolen" til galaksen
const galaksePol = himmelRetning(galaksen.nordpol);
const galakseY = galaksePol
    .clone()
    .cross(himmelRetning(galaksen.sentrum))
    .normalize();
const galakseX = galakseY.clone().cross(galaksePol);
const tilGalaksen = new THREE.Matrix3().set(
    ...galakseX.toArray(),
    ...galakseY.toArray(),
    ...galaksePol.toArray(),
);
// Hvor langt fra Melkeveiens midtlinje en retning er (0 = midt i, 1 = rett opp)
const galakseBredde = (retning) => Math.abs(retning.dot(galaksePol));

// Melkeveien tegnes på innsiden av en kjempekule rundt kameraet
const melkeveien = new THREE.Mesh(
    new THREE.SphereGeometry(8000, 64, 32),
    new THREE.ShaderMaterial({
        uniforms: { tilGalaksen: { value: tilGalaksen } },
        vertexShader: /* glsl */ `
            varying vec3 vRetning;
            void main() {
                vRetning = position;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: /* glsl */ `
            uniform mat3 tilGalaksen;
            varying vec3 vRetning;
            ${STOY_GLSL}
            void main() {
                vec3 d = normalize(vRetning);
                vec3 g = tilGalaksen * d;
                float b = asin(clamp(g.z, -1.0, 1.0)); // høyde over midtlinjen
                float l = atan(g.y, g.x);              // vinkel fra midten av galaksen

                float midten = exp(-pow(l / 0.5, 2.0));
                float bredde = 0.08 + 0.09 * midten + 0.025 * cos(l);
                float band = exp(-pow(b / bredde, 2.0));
                float klumper = fbm(d * 7.0);
                float fint = fbm(d * 30.0);
                float lys = band * (0.35 + 0.75 * klumper) * (0.6 + 0.5 * fint)
                          * (0.45 + 0.7 * exp(-pow(l / 1.3, 2.0)));

                // Mørke støvskyer som deler Melkeveien på langs
                float slyng = (fbm(d * 3.0) - 0.5) * 0.05;
                float stov = exp(-pow((b - 0.012 + slyng) / 0.03, 2.0))
                           * smoothstep(0.38, 0.62, fbm(d * 9.0 + 3.0))
                           * exp(-pow(l / 1.7, 2.0));
                lys *= 1.0 - 0.8 * stov;
                lys += midten * exp(-pow(b / 0.11, 2.0)) * 0.3; // den lysende "bulen" i midten

                vec3 farge = mix(vec3(0.6, 0.68, 1.0), vec3(1.0, 0.85, 0.66), midten * 0.85);
                gl_FragColor = vec4(farge * lys * 0.32, 1.0);
            }
        `,
        side: THREE.BackSide,
        depthWrite: false,
    }),
);
melkeveien.renderOrder = -2;
himmel.add(melkeveien);

// Tusenvis av svake stjerner – flest langs Melkeveien, akkurat som på ekte
{
    const antall = 9000;
    const pos = new Float32Array(antall * 3);
    const farge = new Float32Array(antall * 3);
    const tint = [
        new THREE.Color("#ffffff"),
        new THREE.Color("#bcd2ff"),
        new THREE.Color("#ffe1b8"),
    ];
    const v = new THREE.Vector3();
    for (let i = 0; i < antall; i++) {
        do v.randomDirection();
        while (
            Math.random() >
            0.3 + 0.7 * Math.exp(-((galakseBredde(v) / 0.25) ** 2))
        );
        pos.set(
            v
                .clone()
                .multiplyScalar(5000 + Math.random() * 1500)
                .toArray(),
            i * 3,
        );
        const c = tint[Math.floor(Math.random() * 3)]
            .clone()
            .multiplyScalar(0.25 + Math.random() ** 2 * 0.75);
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
    const punkter = new THREE.Points(geo, mat);
    punkter.renderOrder = -1;
    himmel.add(punkter);
}

// De kjente stjernene – på sin ekte plass, større jo klarere de er
const STJERNE_AVSTAND = 4500;
const stjernePos = new Map();
{
    const pos = [],
        farge = [],
        storrelse = [];
    for (const [navn, ra, dekl, mag, f] of stjerner) {
        const p = himmelRetning([ra, dekl]).multiplyScalar(STJERNE_AVSTAND);
        stjernePos.set(navn, p);
        pos.push(...p.toArray());
        const c = new THREE.Color(f);
        farge.push(c.r, c.g, c.b);
        storrelse.push(THREE.MathUtils.clamp(9 - mag * 1.6, 2.5, 12));
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.Float32BufferAttribute(farge, 3));
    geo.setAttribute(
        "storrelse",
        new THREE.Float32BufferAttribute(storrelse, 1),
    );
    const punkter = new THREE.Points(
        geo,
        new THREE.ShaderMaterial({
            uniforms: { piksler: { value: renderer.getPixelRatio() } },
            vertexShader: /* glsl */ `
                attribute float storrelse;
                uniform float piksler;
                varying vec3 vFarge;
                void main() {
                    vFarge = color;
                    gl_PointSize = storrelse * piksler;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: /* glsl */ `
                varying vec3 vFarge;
                void main() {
                    float r = length(gl_PointCoord - 0.5) * 2.0;
                    float a = smoothstep(1.0, 0.0, r);
                    gl_FragColor = vec4(vFarge * (a * a * 1.6 + smoothstep(0.35, 0.0, r)), a);
                }
            `,
            vertexColors: true,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
        }),
    );
    punkter.renderOrder = -1;
    himmel.add(punkter);
}

// Stjernebildene: streker mellom stjernene og navnet i midten
const stjernebildeGruppe = new THREE.Group();
himmel.add(stjernebildeGruppe);
const stjernenavnGruppe = new THREE.Group();
himmel.add(stjernenavnGruppe);
const himmelEtiketter = [];
{
    const punkter = [];
    for (const bilde of stjernebilder) {
        for (const [a, b] of bilde.linjer)
            punkter.push(stjernePos.get(a), stjernePos.get(b));
        const navnene = bilde.stjerne
            ? [bilde.stjerne]
            : [...new Set(bilde.linjer.flat())];
        const midt = new THREE.Vector3();
        for (const n of navnene) midt.add(stjernePos.get(n));
        midt.setLength(STJERNE_AVSTAND);
        const div = document.createElement("div");
        div.className = "himmel-navn";
        div.textContent = bilde.navn;
        const etikett = new CSS2DObject(div);
        etikett.position.copy(midt);
        etikett.center.set(0.5, bilde.stjerne ? 1.6 : -0.6);
        stjernebildeGruppe.add(etikett);
        himmelEtiketter.push(etikett);
    }
    for (const navn of kjenteStjerner) {
        const div = document.createElement("div");
        div.className = "himmel-navn stjerne";
        div.textContent = navn;
        const etikett = new CSS2DObject(div);
        etikett.position.copy(stjernePos.get(navn));
        etikett.center.set(-0.12, 0.5);
        stjernenavnGruppe.add(etikett);
        himmelEtiketter.push(etikett);
    }
    const linjer = new THREE.LineSegments(
        new THREE.BufferGeometry().setFromPoints(punkter),
        new THREE.LineBasicMaterial({
            color: "#8fa0ff",
            transparent: true,
            opacity: 0.2,
            depthWrite: false,
        }),
    );
    linjer.renderOrder = -1;
    stjernebildeGruppe.add(linjer);
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

// Snur en gruppe slik at nordpolen peker dit den gjør i virkeligheten
function rettAksen(gruppe, pol) {
    gruppe.quaternion.setFromUnitVectors(
        new THREE.Vector3(0, 1, 0),
        himmelRetning(pol),
    );
}

const solGruppe = new THREE.Group();
scene.add(solGruppe);
const solAkse = new THREE.Group();
rettAksen(solAkse, solen.pol);
solGruppe.add(solAkse);
const solMesh = new THREE.Mesh(
    new THREE.SphereGeometry(solen.storrelse, 64, 32),
    new THREE.MeshBasicMaterial({ map: teksturer.Solen() }),
);
solAkse.add(solMesh);

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

// ============ Avstandsmodus ============
// 0 = kompakt (alt synlig), 1 = ekte avstander
let avstand = 0;
let avstandMal = 0;
const radius = (kompakt, au) =>
    THREE.MathUtils.lerp(kompakt, au * AU_SKALA, avstand);

// Kompakt avstand for kometen. Planetenes kompakte avstander er plukket for hånd,
// og en kurve gjennom alle sammen ville gitt kometbanen knekker og bulker.
// Denne myke kurven treffer alle planetringene innen 2 enheter (tilpasset med minste kvadrater).
const kompaktFraAU = (au) => -12.04 + 29.03 * au ** 0.305;
const avlangRadius = (au) => radius(kompaktFraAU(au), au);

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

// Glød i kanten av planeter med atmosfære – sterkest på dagsiden
function lagAtmosfaere(storrelse, [farge, styrke]) {
    return new THREE.Mesh(
        new THREE.SphereGeometry(storrelse * 1.035, 64, 32),
        new THREE.ShaderMaterial({
            uniforms: {
                farge: { value: new THREE.Color(farge) },
                styrke: { value: styrke },
            },
            vertexShader: /* glsl */ `
                varying vec3 vNormal;
                varying vec3 vVerden;
                void main() {
                    vNormal = normalize(mat3(modelMatrix) * normal);
                    vVerden = (modelMatrix * vec4(position, 1.0)).xyz;
                    gl_Position = projectionMatrix * viewMatrix * vec4(vVerden, 1.0);
                }
            `,
            fragmentShader: /* glsl */ `
                uniform vec3 farge;
                uniform float styrke;
                varying vec3 vNormal;
                varying vec3 vVerden;
                void main() {
                    vec3 n = normalize(vNormal);
                    vec3 tilKamera = normalize(cameraPosition - vVerden);
                    float kant = pow(1.0 - max(dot(n, tilKamera), 0.0), 2.5);
                    float dag = smoothstep(-0.3, 0.5, dot(n, normalize(-vVerden))); // solen er i midten
                    gl_FragColor = vec4(farge * kant * dag * styrke, 1.0);
                }
            `,
            blending: THREE.AdditiveBlending,
            transparent: true,
            depthWrite: false,
        }),
    );
}

let jordKropp;
const atmosfaerer = [];
for (const p of planeter) {
    const holder = new THREE.Group(); // flytter seg rundt solen
    const akse = new THREE.Group(); // gjør planeten skjev – nordpolen peker dit den gjør på ekte
    rettAksen(akse, p.pol);
    holder.add(akse);
    scene.add(holder);

    const mesh = new THREE.Mesh(
        new THREE.SphereGeometry(p.storrelse, 64, 32),
        new THREE.MeshStandardMaterial({
            map: teksturer[p.navn](),
            roughness: 1,
            metalness: 0,
        }),
    );
    akse.add(mesh);

    const kropp = { data: p, holder, akse, mesh };

    if (p.navn === "Jorden") {
        const skyer = new THREE.Mesh(
            new THREE.SphereGeometry(p.storrelse * 1.015, 64, 32),
            new THREE.MeshStandardMaterial({
                map: teksturer.JordenSkyer(),
                transparent: true,
                depthWrite: false,
            }),
        );
        akse.add(skyer);
        kropp.skyer = skyer;
        jordKropp = kropp;
    }

    if (p.atmosfaere) {
        const glod = lagAtmosfaere(p.storrelse, p.atmosfaere);
        holder.add(glod);
        atmosfaerer.push(glod);
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
        akse.add(ring);
    }

    const bane = lagBane(p.prikk);
    banerGruppe.add(bane);
    kropp.bane = bane;

    kropp.etikett = lagEtikett(p, p.storrelse * (p.ring ? 1.3 : 1) + 0.5);
    holder.add(kropp.etikett);

    mesh.userData.kropp = kropp;
    kropper.push(kropp);
    klikkbare.push(mesh);
}

// ============ Månen ============
const maneMesh = new THREE.Mesh(
    new THREE.SphereGeometry(manen.storrelse, 48, 24),
    new THREE.MeshStandardMaterial({ map: teksturer.Manen(), roughness: 1 }),
);
jordKropp.holder.add(maneMesh);
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

// Skyggen fra Månen på Jorden under en solformørkelse.
// Et tynt skall rundt Jorden som er mørkt der skyggen treffer.
const maneSkygge = new THREE.Mesh(
    new THREE.SphereGeometry(jordKropp.data.storrelse * 1.02, 64, 32),
    new THREE.ShaderMaterial({
        uniforms: {
            senter: { value: new THREE.Vector3(1, 0, 0) },
            styrke: { value: 0 },
        },
        vertexShader: /* glsl */ `
            varying vec3 vRetning;
            void main() {
                vRetning = normalize(position);
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `,
        fragmentShader: /* glsl */ `
            uniform vec3 senter;
            uniform float styrke;
            varying vec3 vRetning;
            void main() {
                float v = acos(clamp(dot(normalize(vRetning), senter), -1.0, 1.0));
                float halv = 1.0 - smoothstep(0.0, 0.7, v);   // halvskyggen – litt mørkere
                float hel = 1.0 - smoothstep(0.04, 0.1, v);   // kjerneskyggen – helt mørkt
                gl_FragColor = vec4(0.0, 0.0, 0.02, styrke * min(1.0, 0.7 * sqrt(halv) + 0.5 * hel));
            }
        `,
        transparent: true,
        depthWrite: false,
    }),
);
maneSkygge.visible = false;
jordKropp.holder.add(maneSkygge);

// ============ Halleys komet ============
const kometGruppe = new THREE.Group();
scene.add(kometGruppe);
const kometMesh = new THREE.Mesh(
    new THREE.SphereGeometry(halley.storrelse, 24, 12),
    new THREE.MeshStandardMaterial({ map: teksturer.Merkur(), roughness: 1 }),
);
kometGruppe.add(kometMesh);
// Usynlig, litt større kule så kometen er lettere å trykke på
const kometTreff = new THREE.Mesh(
    new THREE.SphereGeometry(0.8, 8, 6),
    new THREE.MeshBasicMaterial({ visible: false }),
);
kometGruppe.add(kometTreff);

// Lysende sky rundt kjernen (koma)
const koma = new THREE.Sprite(
    new THREE.SpriteMaterial({
        map: glodTekstur([
            [0, "rgba(240,252,255,1)"],
            [0.08, "rgba(200,238,255,0.8)"],
            [0.2, "rgba(150,215,255,0.35)"],
            [0.5, "rgba(110,180,255,0.1)"],
            [1, "rgba(80,150,255,0)"],
        ]),
        blending: THREE.AdditiveBlending,
        depthWrite: false,
    }),
);
kometGruppe.add(koma);

// Halene: tusenvis av små lysprikker som peker bort fra Solen.
// Den blå gasshalen er rett og smal, den gule støvhalen er bredere og bøyd.
function lagHale(antall, farge, bredde, boy) {
    const pos = new Float32Array(antall * 3);
    const col = new Float32Array(antall * 3);
    const c = new THREE.Color(farge);
    for (let i = 0; i < antall; i++) {
        const t = Math.random() ** 1.6; // flest nær hodet
        const spredning =
            bredde *
            (0.15 + t) *
            Math.sqrt(-2 * Math.log(Math.random() + 1e-9)) *
            0.5;
        const vinkel = Math.random() * Math.PI * 2;
        pos.set(
            [
                Math.cos(vinkel) * spredning + boy * t * t,
                Math.sin(vinkel) * spredning,
                t,
            ],
            i * 3,
        );
        const lys = (1 - t) ** 1.4 * (0.12 + Math.random() * 0.25);
        col.set([c.r * lys, c.g * lys, c.b * lys], i * 3);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    return new THREE.Points(
        geo,
        new THREE.PointsMaterial({
            size: 0.1,
            vertexColors: true,
            map: glodTekstur([
                [0, "#fff"],
                [0.3, "rgba(255,255,255,0.5)"],
                [1, "rgba(255,255,255,0)"],
            ]),
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }),
    );
}
const hale = new THREE.Group();
const gassHale = lagHale(5000, "#8fc8ff", 0.05, 0);
const stovHale = lagHale(5000, "#fff0cf", 0.12, 0.25);
hale.add(gassHale, stovHale);
kometGruppe.add(hale);

// Banen til kometen – lang og smal
const kometBane = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints(
        Array.from({ length: 721 }, () => new THREE.Vector3()),
    ),
    new THREE.LineBasicMaterial({
        color: halley.prikk,
        transparent: true,
        opacity: 0.22,
    }),
);
kometBane.userData.punkter = Array.from({ length: 721 }, (_, i) => {
    // Tettere punkter nær Solen, der banen svinger skarpt
    const E = Math.PI * 2 * (i / 720);
    const p = banePunkt(halley.bane, E);
    return { retning: tilScene(p).normalize(), r: p.r };
});
banerGruppe.add(kometBane);
function oppdaterKometBane() {
    const pos = kometBane.geometry.attributes.position;
    kometBane.userData.punkter.forEach(({ retning, r }, i) => {
        const v = retning.clone().multiplyScalar(avlangRadius(r));
        pos.setXYZ(i, v.x, v.y, v.z);
    });
    pos.needsUpdate = true;
    kometBane.geometry.computeBoundingSphere();
}

const kometEtikett = lagEtikett(halley, 0.5);
kometEtikett.element.classList.add("liten");
kometGruppe.add(kometEtikett);
const kometKropp = {
    data: halley,
    holder: kometGruppe,
    mesh: kometMesh,
    etikett: kometEtikett,
};
kometMesh.userData.kropp = kometKropp;
kometTreff.userData.kropp = kometKropp;
kropper.push(kometKropp);
klikkbare.push(kometMesh, kometTreff);

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

// ============ Stå på Jorden ============
const bakke = lagBakke({
    tilScene,
    maneTekstur: teksturer.Manen(),
    planeter,
    halley,
    glodTekstur,
});
bakke.lagLapper({ sol: solen, mane: manen });
scene.add(bakke.gruppe);

// ============ Tid ============
// Vi teller tid i dager siden 1. januar 2000 kl. 12 (det astronomer kaller J2000)
const dagerNa = () => dagerFraDato(Date.now());
let simDager = dagerNa();
let dagerPerSek = 1 / 86400;
let pauset = false;

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
        ? new THREE.Vector3(0, 420, 760)
        : new THREE.Vector3(0, 70, 125);
}

function fokuser(kropp) {
    fokus = kropp;
    plasserAlt(); // datoen kan nettopp ha hoppet – retningen må regnes ut fra der klodene er nå
    const p = verdenPos(kropp);
    const komet = kropp === kometKropp;
    // Kometen ses fra siden og litt unna, så hele halen kommer med i bildet
    const d = komet
        ? 3 + haleLengde * 0.9
        : kropp.data.storrelse * (kropp === solKropp ? 4 : 5) + 1.2;
    let retning, vri;
    if (kropp === maneKropp) {
        // Månen ses litt fra siden, ut fra Jorden – da kommer vi aldri inn i Jorden
        retning = maneMesh.position.clone().setY(0).normalize();
        vri = 1.1;
    } else {
        const utover = p.clone().setY(0);
        retning =
            utover.lengthSq() > 0.01
                ? utover.normalize().negate()
                : new THREE.Vector3(0, 0, 1);
        vri = komet ? 1.9 : 0.75;
    }
    const offset = retning.applyAxisAngle(opp, vri).multiplyScalar(d);
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

// Faktaboksen trenger å vite hvor høyt bunnpanelet er (det varierer med skjermbredden)
const bunn = $(".bunn");
new ResizeObserver(() =>
    document.documentElement.style.setProperty(
        "--bunn-hoyde",
        `${bunn.offsetHeight}px`,
    ),
).observe(bunn);

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
const tall = new Intl.NumberFormat("nb-NO", { maximumFractionDigits: 0 });

// Tall som endrer seg med tiden – vises øverst i faktaboksen med en "Nå"-merkelapp
const levende = {
    Jorden: () => {
        const [ikon, navn] = arstid(simDager);
        const f = kommendeFormorkelse();
        return [
            ["🗓️", "Årstid i Norge", `${ikon} ${navn}`],
            [
                f.type === "sol" ? "🌑" : "🩸",
                "Neste formørkelse",
                `${datoFormat.format(datoFraDager(f.dag))}`,
            ],
        ];
    },
    Månen: () => {
        const f = manefase(simDager);
        return [
            [f.ikon, "Månen nå", f.navn],
            ["💡", "Så mye er lyst opp", `${f.lys} %`],
        ];
    },
    Halley: () => {
        const r = banePos(halley.bane, simDager).r;
        return [
            [
                "📍",
                "Avstand fra Solen nå",
                `${tall.format(r * 149.6)} millioner km`,
            ],
        ];
    },
};

function statHtml([ikon, hva, svar], na = false) {
    return `<div class="stat${na ? " na" : ""}"><dt><span class="ikon">${ikon}</span> ${hva}</dt><dd>${svar}</dd></div>`;
}
function oppdaterLevende(data) {
    const boks = $("#info-levende");
    const fn = levende[data.navn];
    boks.hidden = !fn;
    if (fn)
        boks.innerHTML = fn()
            .map((s) => statHtml(s, true))
            .join("");
}

function visInfo(data) {
    $("#info-type").textContent = data.type;
    $("#info-navn").textContent = data.navn;
    $("#info-kallenavn").textContent = data.kallenavn;
    info.style.setProperty("--prikk", data.prikk);
    oppdaterLevende(data);
    $("#info-stats").innerHTML = data.stats.map((s) => statHtml(s)).join("");
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
// I rommet flyr vi tilbake til oversikten. På bakken zoomer vi bare ut igjen.
const lukkInfo = () => (modus === "bakke" ? zoomUtBakke() : tilOversikt());
$("#tilbake").addEventListener("click", lukkInfo);
$("#lukk").addEventListener("click", lukkInfo);

// Navigasjonsknapper
const nav = $("#nav");
const alleKropper = [
    solKropp,
    ...kropper.filter((k) => planeter.includes(k.data)),
    maneKropp,
    kometKropp,
];
for (const k of alleKropper) {
    const b = document.createElement("button");
    b.innerHTML = `<span class="prikk" style="--prikk:${k.data.prikk}"></span>${k.data.navn}`;
    b.addEventListener("click", () => {
        if (modus === "bakke") siktMot(k.data);
        else if (fokus === k) tilOversikt();
        else fokuser(k);
    });
    k.knapp = b;
    nav.appendChild(b);
}
function oppdaterNavKnapper() {
    const valgt = modus === "bakke" ? bakkeKamera.folger?.data : fokus?.data;
    for (const k of alleKropper)
        k.knapp.classList.toggle("aktiv", k.data === valgt);
    $("#meny-planeter-tekst").textContent = valgt
        ? `🪐 ${valgt.navn}`
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

// Klikk på selve planetene (i rommet) eller på det vi ser på himmelen (på bakken).
// På bakken drar man for å se seg rundt, og kniper eller ruller for å zoome.
const stråle = new THREE.Raycaster();
const peker = new THREE.Vector2();
const pekere = new Map();
let nedXY = null;
let klype = null;
renderer.domElement.addEventListener("pointerdown", (e) => {
    nedXY = [e.clientX, e.clientY];
    pekere.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (modus === "bakke") renderer.domElement.setPointerCapture(e.pointerId);
    settMeny(null); // trykk i rommet lukker åpne menyer
});
renderer.domElement.addEventListener("pointermove", (e) => {
    const forrigePeker = pekere.get(e.pointerId);
    if (!forrigePeker || modus !== "bakke") return;
    const k = bakkeKamera;
    if (pekere.size === 1) {
        const grader = k.fov / innerHeight;
        k.az -= (e.clientX - forrigePeker.x) * grader;
        k.alt = THREE.MathUtils.clamp(
            k.alt + (e.clientY - forrigePeker.y) * grader,
            -8,
            89.5,
        );
        k.anim = null;
        if (Math.hypot(e.clientX - nedXY[0], e.clientY - nedXY[1]) > 5)
            k.folger = null;
    }
    pekere.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pekere.size === 2) {
        const [a, b] = [...pekere.values()];
        const avstand = Math.hypot(a.x - b.x, a.y - b.y);
        if (!klype) klype = { avstand, fov: k.fov };
        k.fov = THREE.MathUtils.clamp(
            (klype.fov * klype.avstand) / avstand,
            1.5,
            100,
        );
        k.anim = null;
    }
});
const slippPeker = (e) => {
    pekere.delete(e.pointerId);
    if (pekere.size < 2) klype = null;
};
renderer.domElement.addEventListener("pointercancel", slippPeker);
renderer.domElement.addEventListener(
    "wheel",
    (e) => {
        if (modus !== "bakke") return;
        e.preventDefault();
        bakkeKamera.fov = THREE.MathUtils.clamp(
            bakkeKamera.fov * Math.exp(e.deltaY * 0.001),
            1.5,
            100,
        );
        bakkeKamera.anim = null;
    },
    { passive: false },
);
renderer.domElement.addEventListener("pointerup", (e) => {
    const flere = pekere.size > 1;
    slippPeker(e);
    if (
        flere ||
        !nedXY ||
        Math.hypot(e.clientX - nedXY[0], e.clientY - nedXY[1]) > 5
    )
        return;
    peker.set(
        (e.clientX / innerWidth) * 2 - 1,
        -(e.clientY / innerHeight) * 2 + 1,
    );
    stråle.setFromCamera(peker, camera);
    if (modus === "bakke") {
        const treff = stråle.intersectObjects(
            bakke.kropper.map((k) => k.obj),
            true,
        )[0];
        if (treff) zoomTil(bakkeKroppFor(treff.object));
        return;
    }
    const treff = stråle.intersectObjects(klikkbare, false)[0];
    if (treff) fokuser(treff.object.userData.kropp);
});
addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        if ($("#innstillinger").classList.contains("vis"))
            visInnstillinger(false);
        else lukkInfo();
    }
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

// ============ Små beskjeder nederst ============
const beskjedBoks = $("#beskjed");
let beskjedTid = null;
function beskjed(tekst) {
    beskjedBoks.textContent = tekst;
    beskjedBoks.classList.add("vis");
    clearTimeout(beskjedTid);
    beskjedTid = setTimeout(() => beskjedBoks.classList.remove("vis"), 4000);
}

// ============ Innstillinger ============
const innst = lastInn();
let klar = false; // ikke fly rundt mens vi leser inn lagrede innstillinger

function settRomSynlig(ja) {
    solGruppe.visible = ja;
    for (const k of kropper) if (k.bane) k.holder.visible = ja;
    kometGruppe.visible = ja;
    banerGruppe.visible = ja && innst.baner;
    belteGruppe.visible = ja && innst.asteroider;
}

function bruk(nokkel, verdi) {
    switch (nokkel) {
        case "navn":
            document.body.classList.toggle("skjul-klodenavn", !verdi);
            break;
        case "baner":
        case "asteroider":
            settRomSynlig(modus === "rom");
            break;
        case "ekte":
            avstandMal = verdi ? 1 : 0;
            if (klar && modus === "rom" && !fokus) tilOversikt(2.5);
            break;
        case "atmosfaere":
            for (const a of atmosfaerer) a.visible = verdi;
            break;
        case "melkeveien":
            melkeveien.visible = verdi;
            break;
        case "stjernebilder":
            stjernebildeGruppe.visible = verdi;
            break;
        case "stjernenavn":
            stjernenavnGruppe.visible = verdi;
            break;
        case "sted":
            oppdaterHint();
            break;
    }
}

const innstillingerPanel = $("#innstillinger");
function visInnstillinger(ja) {
    innstillingerPanel.classList.toggle("vis", ja);
    $("#teppe").classList.toggle("vis", ja);
    if (ja) settMeny(null);
}
$("#apne-innstillinger").addEventListener("click", () =>
    visInnstillinger(true),
);
$("#lukk-innstillinger").addEventListener("click", () =>
    visInnstillinger(false),
);
$("#teppe").addEventListener("click", () => visInnstillinger(false));

function oppdaterHint() {
    $(".hint").textContent =
        modus === "bakke"
            ? `📍 ${gjeldendeSted(innst).navn} · Dra for å se deg rundt`
            : matchMedia("(pointer: coarse)").matches
              ? "👆 Trykk på en planet for å fly dit!"
              : "Trykk på en planet for å fly dit!";
}

// ============ Rommet ⇄ Stå på Jorden ============
let modus = "rom";
const bakkeKamera = { az: 180, alt: 20, fov: 70, folger: null, anim: null };
const grad = THREE.MathUtils.degToRad;
lagPanel($("#innstillinger-innhold"), innst, bruk);

// Retning ut fra himmelvinkler: az = kompassretning (0 = nord, 90 = øst), alt = høyde over horisonten
function retningFra(az, alt) {
    const a = grad(az),
        h = grad(alt);
    return bakke.nord
        .clone()
        .multiplyScalar(Math.cos(h) * Math.cos(a))
        .addScaledVector(bakke.ost, Math.cos(h) * Math.sin(a))
        .addScaledVector(bakke.senit, Math.sin(h));
}
function vinklerFor(retning) {
    return {
        az: THREE.MathUtils.radToDeg(
            Math.atan2(retning.dot(bakke.ost), retning.dot(bakke.nord)),
        ),
        alt: THREE.MathUtils.radToDeg(
            Math.asin(THREE.MathUtils.clamp(retning.dot(bakke.senit), -1, 1)),
        ),
    };
}
const bakkeOppslag = new Map();
for (const k of bakke.kropper) k.obj.traverse((o) => bakkeOppslag.set(o, k));
const bakkeKroppFor = (obj) => bakkeOppslag.get(obj);
for (const k of bakke.kropper)
    k.etikett.element.addEventListener("click", (e) => {
        e.stopPropagation();
        zoomTil(k);
    });

function oppdaterBakke() {
    return bakke.oppdater({
        dager: simDager,
        sted: gjeldendeSted(innst),
        rod: maneRod,
        dempet: maneDempet,
        visKompass: innst.kompass,
        // Zoomer vi inn på Solen, setter vi på solbriller
        solfilter:
            bakkeKamera.folger?.data === solen
                ? 1 - THREE.MathUtils.smoothstep(camera.fov, 6, 20)
                : 0,
    });
}

function zoomTil(k, { info = true } = {}) {
    if (!k) return;
    const naer = k.data === solen || k.data === manen;
    bakkeKamera.anim = {
        t: 0,
        fra: { az: bakkeKamera.az, alt: bakkeKamera.alt, fov: bakkeKamera.fov },
        til: { ...vinklerFor(k.retning), fov: naer ? 2.5 : 25 },
    };
    bakkeKamera.folger = k;
    if (info) visInfo(k.data);
    oppdaterNavKnapper();
}
function zoomUtBakke() {
    skjulInfo();
    bakkeKamera.folger = null;
    bakkeKamera.anim = {
        t: 0,
        fra: { az: bakkeKamera.az, alt: bakkeKamera.alt, fov: bakkeKamera.fov },
        til: {
            az: bakkeKamera.az,
            alt: Math.max(bakkeKamera.alt, 12),
            fov: 70,
        },
    };
    oppdaterNavKnapper();
}

function siktMot(data) {
    if (data === jordKropp.data)
        return beskjed(
            "🌍 Du står jo på Jorden! Trykk «🚀 Til rommet» for å se den utenfra.",
        );
    const k = bakke.kropper.find((b) => b.data === data);
    if (k.data === halley && !k.obj.visible)
        return beskjed(
            "☄️ Halley er altfor langt unna til å se nå. Den kommer tilbake i 2061!",
        );
    if (!k.over)
        return beskjed(
            `🙈 ${data.navn} er under bakken nå. Spol tiden fremover for å se den stå opp!`,
        );
    zoomTil(k);
}

function styrBakkeKamera(dt) {
    const k = bakkeKamera;
    if (k.anim) {
        k.anim.t = Math.min(1, k.anim.t + dt / 1.3);
        const e = myk(k.anim.t);
        // Følger vi noe som beveger seg, siktes det mot der det er nå
        const til = k.folger
            ? { ...vinklerFor(k.folger.retning), fov: k.anim.til.fov }
            : k.anim.til;
        const dAz = ((til.az - k.anim.fra.az + 540) % 360) - 180; // korteste vei rundt
        k.az = k.anim.fra.az + dAz * e;
        k.alt = THREE.MathUtils.lerp(k.anim.fra.alt, til.alt, e);
        k.fov = THREE.MathUtils.lerp(k.anim.fra.fov, til.fov, e);
        if (k.anim.t >= 1) k.anim = null;
    } else if (k.folger) {
        Object.assign(k, vinklerFor(k.folger.retning));
    }
    camera.up.copy(bakke.senit);
    camera.lookAt(camera.position.clone().add(retningFra(k.az, k.alt)));
    if (camera.fov !== k.fov) {
        camera.fov = k.fov;
        camera.updateProjectionMatrix();
    }
}

const overgang = $("#overgang");
function byttModus() {
    overgang.classList.add("vis");
    setTimeout(() => {
        if (modus === "rom") tilBakken();
        else tilRommet();
        overgang.classList.remove("vis");
    }, 400);
}
$("#sta-pa-jorden").addEventListener("click", () => {
    settMeny(null);
    byttModus();
});

function tilBakken() {
    modus = "bakke";
    fokus = null;
    fly = null;
    skjulInfo();
    settRomSynlig(false);
    bakke.gruppe.visible = true;
    kontroller.enabled = false;
    camera.position.set(0, 0, 0);
    himmel.position.set(0, 0, 0);
    bakke.gruppe.position.set(0, 0, 0);
    oppdaterBakke();
    // Start med å se mot Månen hvis den er oppe, ellers mot sør
    const mane = bakke.kropper.find((k) => k.data === manen);
    Object.assign(bakkeKamera, {
        az: 180,
        alt: 20,
        fov: 70,
        folger: null,
        anim: null,
    });
    if (mane.over) {
        const v = vinklerFor(mane.retning);
        bakkeKamera.az = v.az;
        bakkeKamera.alt = THREE.MathUtils.clamp(v.alt, 12, 60);
    }
    document.body.classList.add("bakke-modus");
    $("#sta-pa-jorden").textContent = "🚀 Til rommet";
    oppdaterHint();
    oppdaterNavKnapper();
}

function tilRommet() {
    modus = "rom";
    bakke.gruppe.visible = false;
    settRomSynlig(true);
    skjulInfo();
    bakkeKamera.folger = null;
    camera.up.set(0, 1, 0);
    camera.fov = 45;
    camera.updateProjectionMatrix();
    // Vi "letter" fra Jorden og ser den utenfra
    const jord = verdenPos(jordKropp);
    camera.position.copy(jord).add(new THREE.Vector3(0, 0.5, 0.01));
    kontroller.target.copy(jord);
    document.body.classList.remove("bakke-modus");
    $("#sta-pa-jorden").textContent = "🔭 Stå på Jorden";
    oppdaterHint();
    fokuser(jordKropp);
}

// ============ Formørkelser ============
// Vi husker neste formørkelse, og regner ut en ny når den er over (eller tiden spoles bakover)
let formorkelse = null;
function kommendeFormorkelse() {
    if (
        !formorkelse ||
        simDager > formorkelse.dag + 0.3 ||
        simDager < formorkelse.fra
    ) {
        formorkelse = {
            ...nesteFormorkelse(simDager - 0.3),
            fra: simDager - 0.3,
        };
    }
    return formorkelse;
}

function formorkelseTekst(f) {
    if (f.type === "sol") {
        if (!f.total)
            return [
                "🌘",
                "Delvis solformørkelse",
                "Månen tar en bit av Solen.",
            ];
        if (f.ring)
            return [
                "💍",
                "Ringformet solformørkelse",
                "Månen dekker nesten hele Solen – bare en lysende ring er igjen!",
            ];
        return [
            "🌑",
            "Total solformørkelse",
            "Månen dekker hele Solen. Midt på dagen blir det mørkt som om natten!",
        ];
    }
    if (!f.total)
        return [
            "🌗",
            "Delvis måneformørkelse",
            "Jordens skygge tar en bit av Månen.",
        ];
    return [
        "🩸",
        "Total måneformørkelse",
        "Månen er helt inne i Jordens skygge og blir rød. Blodmåne!",
    ];
}

const hendelse = $("#hendelse");
function visHendelse(f, lokal = "") {
    if (!f || !innst.meldinger) {
        hendelse.classList.remove("vis");
        return;
    }
    const [ikon, tittel, tekst] = formorkelseTekst(f);
    const nokkel = `${f.type}${Math.round(f.dag)}${lokal}`;
    if (hendelse.dataset.nokkel !== nokkel) {
        hendelse.dataset.nokkel = nokkel;
        hendelse.innerHTML = `<span class="ikon">${ikon}</span><div><strong>${tittel}</strong> · ${datoFormat.format(datoFraDager(f.dag))}<br>${lokal || tekst}</div>`;
    }
    hendelse.classList.add("vis");
}

// Synes formørkelsen fra stedet vi står? Svar: når den er best, og hvor mye som dekkes.
function lokalFormorkelse(f, sted) {
    const { bredde, lengde } = sted;
    let best = null;
    for (let m = -200; m <= 200; m += 4) {
        const d = f.dag + m / 1440;
        if (f.type === "mane") {
            const mp = manePos(d);
            const v = {
                x: Math.cos(grad(mp.bredde)) * Math.cos(grad(mp.lengde)),
                y: Math.cos(grad(mp.bredde)) * Math.sin(grad(mp.lengde)),
                z: Math.sin(grad(mp.bredde)),
            };
            if (hoyde(v, d, bredde, lengde) > 0) return { lokalDag: f.dag };
            continue;
        }
        const s = geoSol(d);
        if (hoyde(s, d, bredde, lengde) < 0) continue;
        const mt = maneTopo(d, bredde, lengde);
        const sv = tilScene(s).normalize(),
            mv = tilScene(mt).normalize();
        const rSol = grad(0.2666 / Math.hypot(s.x, s.y, s.z));
        const rMane = Math.asin(1737.4 / Math.hypot(mt.x, mt.y, mt.z));
        const dek = dekning(
            Math.acos(THREE.MathUtils.clamp(sv.dot(mv), -1, 1)),
            rSol,
            rMane,
        );
        if (!best || dek > best.dekket) best = { lokalDag: d, dekket: dek };
    }
    return best && best.dekket > 0.01 ? best : null;
}
function nesteSynligeFormorkelse(fra, sted) {
    let t = fra;
    for (let i = 0; i < 80; i++) {
        const f = nesteFormorkelse(t);
        const lokal = lokalFormorkelse(f, sted);
        if (lokal) return { ...f, ...lokal };
        t = f.dag + 1;
    }
    return null;
}

$("#neste-formorkelse").addEventListener("click", () => {
    if (modus === "bakke") return nesteFormorkelseHer();
    const f = nesteFormorkelse(simDager + 0.5);
    formorkelse = { ...f, fra: f.dag - 1 };
    // Hvor treffer skyggen midt i formørkelsen? Dit skal kameraet se.
    simDager = f.dag;
    plasserAlt();
    const skyggeRetning = maneSkygge.visible
        ? maneSkygge.material.uniforms.senter.value.clone()
        : null;
    // Start litt før, og spill av så fort at det tar et halvt minutt
    simDager = f.dag - (f.type === "sol" ? 0.1 : 0.12);
    fart.value = 30;
    oppdaterFart();
    settPause(false);
    fokuser(f.type === "sol" ? jordKropp : maneKropp);
    if (f.type === "sol" && skyggeRetning) {
        // Se rett ned på skyggen – litt fra siden, så Månen ikke står i veien
        fly.offset = skyggeRetning
            .applyAxisAngle(opp, 0.45)
            .multiplyScalar(fly.offset.length());
    }
    settMeny(null);
});

function nesteFormorkelseHer() {
    const sted = gjeldendeSted(innst);
    const f = nesteSynligeFormorkelse(simDager + 0.5, sted);
    if (!f)
        return beskjed("🤷 Fant ingen formørkelse som synes herfra på lenge.");
    formorkelse = { ...f, fra: f.dag - 1 };
    simDager = f.lokalDag - 0.1;
    fart.value = 30;
    oppdaterFart();
    settPause(false);
    oppdaterBakke();
    const k = bakke.kropper.find(
        (b) => b.data === (f.type === "sol" ? solen : manen),
    );
    zoomTil(k, { info: false });
    bakkeKamera.anim.til.fov = f.type === "sol" ? 3 : 4;
    settMeny(null);
    if (f.type === "sol")
        beskjed(
            `😎 Vi har satt på solbriller for deg. Se aldri rett på Solen uten slike briller!`,
        );
}

// ============ Animasjonsløkken ============
let forrige = performance.now();
const skjermA = new THREE.Vector3();
const skjermB = new THREE.Vector3();
const hvit = new THREE.Color("#ffffff");
const blodrod = new THREE.Color("#b8412a");

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

// Navn på himmelen skal ikke synes gjennom planetene (HTML-lappene vet ikke hva som er foran)
const himmelStraale = new THREE.Raycaster();
function skjulHimmelNavnBakPlaneter() {
    for (const e of himmelEtiketter) {
        himmelStraale.set(camera.position, e.position.clone().normalize());
        e.visible =
            himmelStraale.intersectObjects(klikkbare, false).length === 0;
    }
}

// Månen: hvor den står, og om den er i skyggen til Jorden (blodmåne) eller kaster skygge på Jorden
let maneRod = 0,
    maneDempet = 0;
function oppdaterManen() {
    const m = manePos(simDager);
    maneMesh.position
        .copy(ekliptikkRetning(m.lengde, m.bredde))
        .multiplyScalar(manen.avstand);
    // Månen snur alltid samme side mot oss
    maneMesh.rotation.y = THREE.MathUtils.degToRad(m.lengde);

    const e = elongasjon(simDager);
    // Fullmåne: hvor dypt inn i Jordens skygge er Månen?
    let rod = 0,
        dempet = 0;
    if (Math.abs(e - 180) < 20) {
        const { gamma, u } = gammaVed(simDager, "mane");
        rod = THREE.MathUtils.clamp((1.0128 - u - gamma) / 0.545, 0, 1);
        dempet = THREE.MathUtils.clamp((1.5573 + u - gamma) / 0.545, 0, 1);
    }
    maneRod = rod;
    maneDempet = dempet;
    maneMesh.material.color
        .copy(hvit)
        .lerp(blodrod, rod)
        .multiplyScalar(1 - 0.15 * dempet - 0.45 * rod);

    // Nymåne: treffer skyggen til Månen Jorden? Regnes med ekte avstander (i jordradier)
    maneSkygge.visible = false;
    if (e < 20 || e > 340) {
        const sol = ekliptikkRetning(solLengde(simDager));
        const mane = ekliptikkRetning(m.lengde, m.bredde).multiplyScalar(
            m.km / 6378.14,
        );
        const p = mane.clone().sub(sol.clone().multiplyScalar(mane.dot(sol)));
        const g = p.length();
        const styrke = 1 - THREE.MathUtils.smoothstep(g, 0.95, 1.55);
        if (styrke > 0) {
            const opp = Math.sqrt(Math.max(0, 1 - g * g));
            maneSkygge.material.uniforms.senter.value
                .copy(p)
                .addScaledVector(sol, opp)
                .normalize();
            maneSkygge.material.uniforms.styrke.value = styrke;
            maneSkygge.visible = true;
        }
    }
}

let haleLengde = 0;
// Kometen: posisjon, og en hale som vokser når den kommer nær Solen
function oppdaterKometen() {
    const p = banePos(halley.bane, simDager);
    const retning = tilScene(p).normalize();
    kometGruppe.position.copy(retning).multiplyScalar(avlangRadius(p.r));

    const aktiv = THREE.MathUtils.clamp(1.6 / p.r - 0.25, 0, 1);
    haleLengde = aktiv * THREE.MathUtils.lerp(9, 20, avstand);
    hale.visible = aktiv > 0.01;
    hale.lookAt(kometGruppe.position.clone().multiplyScalar(2)); // +z peker bort fra Solen
    hale.scale.setScalar(Math.max(haleLengde, 0.01));
    for (const h of [gassHale, stovHale])
        h.material.size = 0.02 + haleLengde * 0.0035;
    koma.scale.setScalar(0.35 + aktiv * 1.1);
    kometEtikett.position.y = 0.4 + aktiv * 0.6;
}

// Setter alle kloder der de skal være på datoen simDager
function plasserAlt() {
    // Planetene: ekte retning fra Solen (Keplers lov), men tegnet i sirkler
    for (const k of kropper) {
        const p = k.data;
        if (!k.bane) continue; // solen, månen og kometen styres for seg
        const r = radius(p.kompakt, p.au);
        const vinkel = THREE.MathUtils.degToRad(planetLengde(p, simDager));
        k.holder.position.set(Math.cos(vinkel) * r, 0, -Math.sin(vinkel) * r);
        k.bane.scale.setScalar(r);
    }
    oppdaterManen();
    oppdaterKometen();
    scene.updateMatrixWorld();
}

let infoTeller = 0;
const datoTekst = $("#dato");

function animer() {
    const na = performance.now();
    const dt = Math.min((na - forrige) / 1000, 0.1);
    forrige = na;

    if (!pauset) simDager += dagerPerSek * dt;
    const spinnFart = pauset ? 0 : 1;
    infoTeller++;

    // Myk overgang mellom kompakt og ekte avstander
    const forrigeAvstand = avstand;
    avstand += (avstandMal - avstand) * Math.min(1, dt * 2.5);
    if (Math.abs(avstand - avstandMal) < 1e-4) avstand = avstandMal;

    plasserAlt();
    for (const k of kropper)
        if (k.bane) k.mesh.rotation.y += k.data.spinn * dt * spinnFart;
    jordKropp.skyer.rotation.y += 0.6 * dt * spinnFart;
    if (forrigeAvstand !== avstand || !kometBane.userData.tegnet) {
        oppdaterKometBane();
        kometBane.userData.tegnet = true;
    }

    const br = radius(belte.kompakt, belte.au);
    belteGruppe.scale.set(br, 1, br);
    belteGruppe.rotation.y = ((Math.PI * 2) / belte.periode) * simDager;

    solMesh.rotation.y += 0.05 * dt * spinnFart;
    glod1.material.rotation += 0.02 * dt;
    glod2.scale.setScalar(
        solen.storrelse * (12 + Math.sin(performance.now() / 900) * 0.6),
    );

    // Kamera
    let bakkeLys = null;
    if (modus === "bakke") {
        bakkeLys = oppdaterBakke();
        styrBakkeKamera(dt);
        // Zoomet helt inn på Solen eller Månen: da er navnelappen bare i veien
        if (camera.fov < 12)
            for (const k of bakke.kropper)
                if (k.data === solen || k.data === manen)
                    k.etikett.visible = false;
    } else if (fokus) {
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

    if (modus === "rom") {
        kontroller.update();
        for (const k of kropper) {
            if (k === solKropp) continue;
            if (k === maneKropp) skjulHvisNaer(k, jordKropp, 45);
            else skjulHvisNaer(k, solKropp, 40);
        }
        if (infoTeller % 5 === 0) skjulHimmelNavnBakPlaneter();
    } else {
        // Stjernenavn under bakken – eller om dagen – skal ikke synes
        const morkt = bakkeLys.lys < 0.35;
        for (const e of himmelEtiketter)
            e.visible =
                morkt && e.position.dot(bakke.senit) > 0.02 * STJERNE_AVSTAND;
    }
    himmel.position.copy(camera.position); // himmelen er uendelig langt unna
    bakke.gruppe.position.copy(camera.position);

    // Formørkelse akkurat nå? På bakken forteller vi også hvordan den ser ut herfra.
    const f = kommendeFormorkelse();
    const naa = Math.abs(simDager - f.dag) < (f.type === "sol" ? 0.12 : 0.15);
    let lokal = "";
    if (naa && modus === "bakke") {
        const sted = gjeldendeSted(innst).navn;
        if (f.type === "sol") {
            const prosent = Math.round(bakkeLys.dekket * 100);
            lokal =
                bakkeLys.solHoyde < 0
                    ? `Solen er under bakken i ${sted} – her synes den ikke.`
                    : prosent >= 100
                      ? `I ${sted} er Solen helt dekket akkurat nå! 🤩`
                      : `I ${sted} er ${prosent} % av Solen dekket akkurat nå.`;
        } else if (!bakke.kropper.find((k) => k.data === manen).over) {
            lokal = `Månen er under bakken i ${sted} – her synes den ikke.`;
        }
    }
    visHendelse(naa ? f : null, lokal);

    // Tallene i faktaboksen som endrer seg med tiden
    if (fokus && infoTeller % 20 === 0) oppdaterLevende(fokus.data);

    const simDato = datoFraDager(simDager);
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

// Bare under utvikling: håndtak for å styre scenen fra konsollen og tester
if (import.meta.env.DEV) {
    window.__sol = {
        settDato: (iso) => (simDager = dagerFraDato(Date.parse(iso))),
        fokuser: (navn) => fokuser(kropper.find((k) => k.data.navn === navn)),
        tilOversikt,
        settEkte: (ja) => {
            innst.ekte = ja;
            bruk("ekte", ja);
        },
        tilBakken,
        tilRommet,
        bakke,
        bakkeKamera,
        innst,
        bruk,
        settFart: (v) => {
            fart.value = v;
            oppdaterFart();
        },
        settPause,
        camera,
        kontroller,
        jord: jordKropp,
        maneSkygge,
        flyOffset: (v) => fly && fly.offset.copy(v),
        kropper,
    };
}

for (const [nokkel, verdi] of Object.entries(innst)) bruk(nokkel, verdi);
klar = true;
oppdaterHint();
tilOversikt(3.5); // flyr inn fra verdensrommet når siden åpnes
animer();
