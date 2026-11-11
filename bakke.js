// "Stå på Jorden": himmelen slik den ser ut fra et ekte sted på Jorden.
// Her står vi midt i en stor kule. Himmelen, Solen, Månen og planetene tegnes i den
// retningen de faktisk står, og bakken skjuler alt som er under horisonten.
import * as THREE from "three";
import { CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import {
    geoPos,
    geoSol,
    maneTopo,
    banePos,
    jordPos,
    senit,
    nordRetning,
    ekvatorTilEkliptikk,
    jupiterManer,
    helioPos,
} from "./astro.js";
import { STOY_GLSL } from "./shader.js";

const RAD = Math.PI / 180;
const SOL_AVSTAND = 2000;
const MANE_AVSTAND = 1950; // litt nærmere enn Solen, så Månen kan dekke den
const PLANET_AVSTAND = 2100;
// Planetene i kikkerten tegnes helt inntil kameraet. Langt unna blir de så små at
// skjermkortet ikke klarer å holde orden på hva som er foran og bak (Saturn og ringene).
const KIKKERT_AVSTAND = 1;
const AU_KM = 149597871;

// Hvor klare planetene er (størrelsen på prikken)
const KLARHET = {
    Merkur: 0.011,
    Venus: 0.026,
    Mars: 0.016,
    Jupiter: 0.021,
    Saturn: 0.015,
    Uranus: 0.007,
    Neptun: 0.006,
};

// Hvor mye av Solen som er dekket av Månen (0–1), ut fra vinkelen mellom dem og størrelsene
export function dekning(avstand, rSol, rMane) {
    if (avstand >= rSol + rMane) return 0;
    if (avstand <= Math.abs(rMane - rSol))
        return rMane >= rSol ? 1 : (rMane / rSol) ** 2;
    const a = Math.acos((avstand ** 2 + rSol ** 2 - rMane ** 2) / (2 * avstand * rSol));
    const b = Math.acos((avstand ** 2 + rMane ** 2 - rSol ** 2) / (2 * avstand * rMane));
    const flate =
        rSol ** 2 * (a - Math.sin(2 * a) / 2) + rMane ** 2 * (b - Math.sin(2 * b) / 2);
    return flate / (Math.PI * rSol ** 2);
}

export function lagBakke({
    tilScene,
    maneTekstur,
    planeter,
    halley,
    glodTekstur,
    teksturFor, // navn → tekstur (samme som i rommet)
    ringKart,
    maneData, // Jupiters måner
    issData,
}) {
    const gruppe = new THREE.Group();
    gruppe.visible = false;

    const senitV = new THREE.Vector3(0, 1, 0);
    const nordV = new THREE.Vector3(0, 0, -1);
    const ostV = new THREE.Vector3(1, 0, 0);
    const solV = new THREE.Vector3(1, 0, 0);

    // ---------- Himmelfargen ----------
    // Blå om dagen, rød og oransje i solnedgangen, gjennomsiktig om natten (da ser vi stjernene)
    const kuppel = new THREE.Mesh(
        new THREE.SphereGeometry(3000, 64, 32),
        new THREE.ShaderMaterial({
            uniforms: {
                senit: { value: senitV },
                sol: { value: solV },
                lys: { value: 1 },
                skumring: { value: 0 },
            },
            vertexShader: /* glsl */ `
                varying vec3 vRetning;
                void main() {
                    vRetning = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: /* glsl */ `
                uniform vec3 senit, sol;
                uniform float lys, skumring;
                varying vec3 vRetning;
                void main() {
                    vec3 d = normalize(vRetning);
                    float h = max(dot(d, senit), 0.0);
                    float motSol = max(dot(d, sol), 0.0);

                    vec3 dag = mix(vec3(0.62, 0.78, 0.95), vec3(0.16, 0.38, 0.82), pow(h, 0.5));
                    dag += vec3(1.0, 0.95, 0.85) * pow(motSol, 60.0) * 0.6 * (1.0 - skumring); // lyset rundt Solen

                    float lavt = pow(1.0 - h, 4.0);
                    vec3 rodt = vec3(1.0, 0.4, 0.1) * lavt * (0.3 + 1.3 * pow(motSol, 3.0))
                              + vec3(1.0, 0.75, 0.35) * pow(motSol, 24.0) * lavt;
                    vec3 lilla = vec3(0.35, 0.25, 0.55) * pow(1.0 - h, 2.0) * 0.5;
                    vec3 kveld = (rodt + lilla) * skumring;

                    // Svak glød langs horisonten om natten (lys fra byer og lufta selv)
                    vec3 nattGlod = vec3(0.05, 0.07, 0.13) * pow(1.0 - h, 10.0) * (1.0 - lys);

                    vec3 farge = dag * lys + kveld + nattGlod;
                    float a = clamp(lys * 0.97 + skumring * (0.25 + 0.6 * lavt) + length(nattGlod) * 2.0, 0.0, 1.0);
                    gl_FragColor = vec4(farge, a); // fargen er allerede "lys", ikke delt på alfa
                }
            `,
            side: THREE.BackSide,
            transparent: true,
            premultipliedAlpha: true,
            depthWrite: false,
        }),
    );
    kuppel.renderOrder = 0;
    gruppe.add(kuppel);

    // ---------- Bakken med åser og trær i horisonten ----------
    const bakken = new THREE.Mesh(
        new THREE.SphereGeometry(1500, 96, 48),
        new THREE.ShaderMaterial({
            uniforms: {
                senit: { value: senitV },
                nord: { value: nordV },
                ost: { value: ostV },
                lys: { value: 1 },
            },
            vertexShader: /* glsl */ `
                varying vec3 vRetning;
                void main() {
                    vRetning = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: /* glsl */ `
                uniform vec3 senit, nord, ost;
                uniform float lys;
                varying vec3 vRetning;
                ${STOY_GLSL}
                void main() {
                    vec3 d = normalize(vRetning);
                    float h = asin(clamp(dot(d, senit), -1.0, 1.0));
                    float az = atan(dot(d, ost), dot(d, nord));
                    vec3 rundt = vec3(cos(az), sin(az), 0.0);

                    // Åser langt unna, og trær i noen områder
                    float aas = 0.008 + 0.035 * fbm(rundt * 2.2 + vec3(0.0, 0.0, 1.7));
                    float skog = smoothstep(0.45, 0.6, fbm(rundt * 4.0 + vec3(0.0, 0.0, 9.0)));
                    float tre = pow(stoy(rundt * 140.0 + vec3(0.0, 0.0, 3.1)), 2.0) * 0.022 * skog;
                    if (h > aas + tre) discard;

                    vec3 dag = mix(vec3(0.10, 0.18, 0.09), vec3(0.20, 0.30, 0.15), smoothstep(-0.4, 0.0, h));
                    vec3 natt = vec3(0.012, 0.016, 0.024);
                    vec3 farge = mix(natt, dag, lys);
                    if (h > 0.0) farge *= 0.55; // silhuetten er mørkere mot himmelen
                    gl_FragColor = vec4(farge, 1.0);
                }
            `,
            side: THREE.BackSide,
        }),
    );
    gruppe.add(bakken);

    // ---------- Kompass ----------
    const kompass = new THREE.Group();
    const retninger = [
        ["Nord", (n, o) => n],
        ["Øst", (n, o) => o],
        ["Sør", (n, o) => n.clone().negate()],
        ["Vest", (n, o) => o.clone().negate()],
    ].map(([navn, fn]) => {
        const div = document.createElement("div");
        div.className = "kompass";
        div.textContent = navn;
        const obj = new CSS2DObject(div);
        obj.center.set(0.5, 0.5);
        kompass.add(obj);
        return { obj, fn };
    });
    gruppe.add(kompass);

    // ---------- Solen ----------
    const solGruppe = new THREE.Group();
    const solSkive = new THREE.Sprite(
        new THREE.SpriteMaterial({
            map: glodTekstur([
                [0, "#fffdf4"],
                [0.88, "#fff6d8"],
                [1, "rgba(255,240,200,0)"],
            ]),
            depthWrite: false,
        }),
    );
    const solGlod = new THREE.Sprite(
        new THREE.SpriteMaterial({
            map: glodTekstur([
                [0, "rgba(255,250,235,0.9)"],
                [0.06, "rgba(255,240,210,0.5)"],
                [0.25, "rgba(255,220,170,0.12)"],
                [1, "rgba(255,200,150,0)"],
            ]),
            blending: THREE.AdditiveBlending,
            depthWrite: false,
        }),
    );
    solGlod.scale.setScalar(SOL_AVSTAND * Math.tan(5 * RAD) * 2);
    solGruppe.add(solGlod, solSkive);
    solSkive.renderOrder = solGlod.renderOrder = 1;
    gruppe.add(solGruppe);

    // ---------- Kloder lyst opp av Solen: Månen, og planetene i kikkerten ----------
    // Fasen kommer av seg selv: siden som vender mot Solen er lys.
    // gjennomsiktig: den mørke siden synes ikke mot himmelen (planetene i kikkerten)
    const klodeMateriale = (kart, sol = solV, gjennomsiktig = false) =>
        new THREE.ShaderMaterial({
            transparent: gjennomsiktig,
            defines: gjennomsiktig ? { GJENNOMSIKTIG: "" } : {},
            uniforms: {
                kart: { value: kart },
                sol: { value: sol },
                rod: { value: 0 },
                dempet: { value: 0 },
                luft: { value: 0 },
            },
            vertexShader: /* glsl */ `
                varying vec3 vNormal;
                varying vec2 vUv;
                void main() {
                    vNormal = normalize(mat3(modelMatrix) * normal);
                    vUv = uv;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: /* glsl */ `
                uniform sampler2D kart;
                uniform vec3 sol;
                uniform float rod, dempet, luft;
                varying vec3 vNormal;
                varying vec2 vUv;
                void main() {
                    vec3 t = texture2D(kart, vUv).rgb;
                    float l = max(dot(normalize(vNormal), sol), 0.0);
                    vec3 c = t * (l * 1.25 + 0.025); // litt "jordskinn" på den mørke delen
                    // Blodmåne: Jordens skygge gjør Månen mørk og rød
                    c = mix(c, c * vec3(0.9, 0.28, 0.16), rod);
                    c *= 1.0 - 0.15 * dempet - 0.45 * rod;
                    // Om dagen ligger den blå lufta foran Månen – derfor er nymånen usynlig
                    c = c * (1.0 - 0.35 * luft) + vec3(0.42, 0.6, 0.9) * luft;
                    #ifdef GJENNOMSIKTIG
                        // Planetene i kikkerten lyser sterkere enn Månen (de er så langt unna Solen at vi må "skru opp")
                        gl_FragColor = vec4(c * 1.4, smoothstep(0.0, 0.12, l));
                    #else
                        gl_FragColor = vec4(c, 1.0);
                    #endif
                }
            `,
        });
    const maneMesh = new THREE.Mesh(new THREE.SphereGeometry(1, 48, 24), klodeMateriale(maneTekstur));
    gruppe.add(maneMesh);

    // ---------- Planetene som lysende prikker ----------
    const prikkTekstur = glodTekstur([
        [0, "#fff"],
        [0.25, "rgba(255,255,255,0.9)"],
        [0.5, "rgba(255,255,255,0.25)"],
        [1, "rgba(255,255,255,0)"],
    ]);
    const prikker = [];
    for (const p of [...planeter.filter((p) => p.navn !== "Jorden"), halley]) {
        const sprite = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: prikkTekstur,
                color: new THREE.Color(p.prikk).lerp(new THREE.Color("#fff"), 0.55),
                sizeAttenuation: false,
                depthWrite: false,
                transparent: true,
            }),
        );
        sprite.renderOrder = 1;
        const s = KLARHET[p.navn] ?? 0.012;
        sprite.scale.set(s, s, 1);
        gruppe.add(sprite);
        prikker.push({ data: p, obj: sprite });
    }

    // ---------- Kikkerten: planetene som små kuler i ekte størrelse ----------
    const opp = new THREE.Vector3(0, 1, 0);
    const kikkert = new Map();
    for (const p of planeter.filter((p) => p.navn !== "Jorden")) {
        const g = new THREE.Group();
        const akse = new THREE.Group();
        const pol = tilScene(ekvatorTilEkliptikk(...p.pol)).normalize();
        akse.quaternion.setFromUnitVectors(opp, pol);
        // Planeten lyses opp fra der Solen er sett fra planeten (ikke fra oss) – det gir fasene
        const mesh = new THREE.Mesh(
            new THREE.SphereGeometry(1, 48, 24),
            klodeMateriale(teksturFor(p.navn), new THREE.Vector3(), true),
        );
        // Tegnes etter himmelfargen, så den mørke siden kan være gjennomsiktig mot den
        mesh.renderOrder = 2;
        akse.add(mesh);
        if (p.ring) {
            const ring = new THREE.Mesh(
                new THREE.RingGeometry(1.25, 2.3, 128),
                new THREE.MeshBasicMaterial({
                    map: ringKart,
                    side: THREE.DoubleSide,
                    transparent: true,
                    depthWrite: false,
                }),
            );
            ring.rotation.x = -Math.PI / 2;
            ring.renderOrder = 2;
            akse.add(ring);
        }
        g.add(akse);
        g.visible = false;
        gruppe.add(g);
        kikkert.set(p.navn, { gruppe: g, mesh, pol, vinkel: 0, data: p });
    }

    // Jupiters fire måner som små lysprikker ved siden av Jupiter
    const maneTekst = { Io: "#ffe9a8", Europa: "#fff8ee", Ganymedes: "#f2eadf", Kallisto: "#d8cfc4" };
    const jupiterManeObj = maneData.map((data) => {
        const sprite = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: prikkTekstur,
                color: new THREE.Color(maneTekst[data.navn]),
                sizeAttenuation: false,
                depthTest: false, // vi skjuler dem selv når de er bak Jupiter
                depthWrite: false,
                transparent: true,
            }),
        );
        sprite.scale.set(0.009, 0.009, 1);
        sprite.renderOrder = 3;
        gruppe.add(sprite);
        const div = document.createElement("div");
        div.className = "etikett liten";
        div.textContent = data.navn;
        const lapp = new CSS2DObject(div);
        lapp.center.set(0.5, 1.8);
        gruppe.add(lapp);
        return { data, obj: sprite, etikett: lapp };
    });
    const motJorden = new THREE.Vector3();
    const motVest = new THREE.Vector3();

    // ---------- ISS: en klar, hvit prikk som glir over himmelen ----------
    const issPrikk = new THREE.Sprite(
        new THREE.SpriteMaterial({
            map: prikkTekstur,
            color: "#ffffff",
            sizeAttenuation: false,
            depthWrite: false,
            transparent: true,
        }),
    );
    issPrikk.renderOrder = 1;
    issPrikk.visible = false;
    gruppe.add(issPrikk);

    // Navnelapper på alt vi kan se på himmelen
    function lagLapp(data, obj) {
        const div = document.createElement("div");
        div.className = "etikett liten";
        div.textContent = data.navn;
        const lapp = new CSS2DObject(div);
        lapp.center.set(0.5, 1.6);
        gruppe.add(lapp);
        return { data, obj, etikett: lapp, retning: new THREE.Vector3(), over: false };
    }
    const kropper = [];

    const tilV = (v) => tilScene(v).normalize();

    // solfilter (0–1): som solformørkelsesbriller – himmelen blir svart og Solen oransje
    function oppdater({
        dager,
        sted,
        rod = 0,
        dempet = 0,
        visKompass = true,
        solfilter = 0,
        fov = 70, // hvor mye vi ser (grader) – liten betyr at vi har zoomet inn
        hoydePx = 900,
        iss = null, // { retning (Vector3), kanSees }
    }) {
        const { bredde, lengde } = sted;
        senitV.copy(tilV(senit(dager, bredde, lengde)));
        nordV.copy(tilV(nordRetning(dager, bredde, lengde)));
        ostV.copy(nordV).cross(senitV).normalize();

        // Solen
        const s = geoSol(dager);
        const rSol = (0.2666 / Math.hypot(s.x, s.y, s.z)) * RAD;
        solV.copy(tilV(s));
        solGruppe.position.copy(solV).multiplyScalar(SOL_AVSTAND);
        solSkive.scale.setScalar(SOL_AVSTAND * Math.tan(rSol) * 2);

        // Månen – sett fra der vi står
        const m = maneTopo(dager, bredde, lengde);
        const mKm = Math.hypot(m.x, m.y, m.z);
        const rMane = Math.asin(1737.4 / mKm);
        const maneV = tilV(m);
        maneMesh.position.copy(maneV).multiplyScalar(MANE_AVSTAND);
        maneMesh.scale.setScalar(MANE_AVSTAND * Math.tan(rMane));
        maneMesh.material.uniforms.rod.value = rod;
        maneMesh.material.uniforms.dempet.value = dempet;

        // Solformørkelse: hvor mye av Solen er dekket?
        const dekket = dekning(Math.acos(THREE.MathUtils.clamp(maneV.dot(solV), -1, 1)), rSol, rMane);

        // Hvor lyst er det? Bestemmes av hvor høyt Solen står
        const solHoyde = Math.asin(solV.dot(senitV)) / RAD;
        let lys = THREE.MathUtils.smoothstep(solHoyde, -5, 9);
        lys *= THREE.MathUtils.clamp(1 - 0.97 * dekket ** 10 - 0.12 * dekket, 0, 1);
        const skumring =
            THREE.MathUtils.smoothstep(solHoyde, -16, -2) *
            (1 - THREE.MathUtils.smoothstep(solHoyde, 3, 12));
        // Under totalitet tar man av brillene – da ser man koronaen
        const filter = solfilter * (1 - dekket ** 30);
        const kuppelU = kuppel.material.uniforms;
        kuppelU.lys.value = lys * (1 - 0.97 * filter);
        kuppelU.skumring.value = skumring * (1 - filter);
        maneMesh.material.uniforms.luft.value = lys * (1 - filter);
        solGlod.material.opacity = 1 - filter;
        solSkive.material.color.setRGB(1, 1 - 0.35 * filter, 1 - 0.75 * filter);
        bakken.material.uniforms.lys.value = Math.max(lys, 0.15 * skumring);

        // Lysprikkene skal ha samme størrelse på skjermen uansett zoom
        const zoom = Math.tan((fov / 2) * RAD) / Math.tan(35 * RAD);

        // Planetene og kometen
        const jord = jordPos(dager);
        for (const pr of prikker) {
            let v;
            if (pr.data === halley) {
                const h = banePos(halley.bane, dager);
                v = { x: h.x - jord.x, y: h.y - jord.y, z: h.z - jord.z };
                // Kometen er bare synlig når den er nær Solen
                pr.obj.visible = h.r < 4;
            } else v = geoPos(pr.data, dager);
            const retning = tilV(v);
            pr.obj.position.copy(retning).multiplyScalar(PLANET_AVSTAND);
            const str = (KLARHET[pr.data.navn] ?? 0.012) * zoom;
            pr.obj.scale.set(str, str, 1);
            // Om dagen blir planetene borte i det blå (Venus holder lengst)
            const venus = pr.data.navn === "Venus";
            let synlig = 1 - lys * (venus ? 0.75 : 0.97);

            // I kikkerten: planeten som en ekte liten kule (med fase og ringer)
            const k = kikkert.get(pr.data.navn);
            if (k) {
                const avstandKm = Math.hypot(v.x, v.y, v.z) * AU_KM;
                k.vinkel = Math.asin(pr.data.km / avstandKm); // radius sett fra Jorden (radianer)
                const over = retning.dot(senitV) > -0.01;
                // Står Månen foran planeten, skal planeten ikke synes
                const bakManen = Math.acos(THREE.MathUtils.clamp(retning.dot(maneV), -1, 1)) < rMane;
                k.gruppe.visible = over && !bakManen;
                k.gruppe.position.copy(retning).multiplyScalar(KIKKERT_AVSTAND);
                k.gruppe.scale.setScalar(KIKKERT_AVSTAND * Math.tan(k.vinkel));
                k.mesh.material.uniforms.luft.value = lys * 0.6;
                const h = helioPos(pr.data, dager);
                k.mesh.material.uniforms.sol.value.copy(tilV({ x: -h.x, y: -h.y, z: -h.z }));
                k.retning = retning;
                // Når kula blir stor nok til å se, tones lysprikken ut
                const pikslerBred = ((2 * k.vinkel * (pr.data.ring ? 2.3 : 1)) / (fov * RAD)) * hoydePx;
                synlig *= 1 - THREE.MathUtils.smoothstep(pikslerBred, 3, 10);
                if (bakManen) synlig = 0;
            }
            pr.obj.material.opacity = synlig;
        }

        // Jupiters måner: hvor de står rundt Jupiter, sett fra oss
        const jup = kikkert.get("Jupiter");
        if (jup?.retning) {
            // Vinkelen u måles fra punktet rett foran Jupiter, i Jupiters ekvatorplan
            motJorden.copy(jup.retning).negate();
            motJorden.addScaledVector(jup.pol, -motJorden.dot(jup.pol)).normalize();
            motVest.copy(motJorden).negate().cross(jup.pol);
            const radius = jup.gruppe.scale.x; // én Jupiter-radius
            const naer = fov < 3;
            jupiterManer(dager).forEach((m, i) => {
                const o = jupiterManeObj[i];
                const u = m.u * RAD;
                o.obj.position
                    .copy(motJorden)
                    .multiplyScalar(Math.cos(u))
                    .addScaledVector(motVest, Math.sin(u))
                    .multiplyScalar(m.r * radius)
                    .add(jup.gruppe.position);
                // Bak Jupiter: skjult
                const bak = Math.cos(u) < 0 && Math.abs(m.r * Math.sin(u)) < 1;
                o.obj.visible = jup.gruppe.visible && !bak;
                o.obj.material.opacity = 1 - lys * 0.9;
                o.obj.scale.set(0.009 * zoom, 0.009 * zoom, 1);
                o.etikett.position.copy(o.obj.position);
                o.etikett.visible = o.obj.visible && naer;
            });
        }

        // ISS: bare synlig når den er i sollys og det er mørkt der vi står
        issPrikk.visible = !!iss?.kanSees;
        if (iss?.retning) {
            issPrikk.position.copy(iss.retning).multiplyScalar(2050);
            const str = 0.028 * zoom;
            issPrikk.scale.set(str, str, 1);
        }

        // Navnelappene: oppdater retning og skjul det som er under bakken
        for (const k of kropper) {
            k.retning.copy(k.obj.position).normalize(); // gruppen er ikke rotert, så dette er retningen
            k.over = k.retning.dot(senitV) > -0.01 && k.obj.visible !== false;
            k.etikett.position.copy(k.retning).multiplyScalar(1400);
            k.etikett.visible = k.over;
        }

        kompass.visible = visKompass;
        for (const r of retninger)
            r.obj.position
                .copy(r.fn(nordV, ostV))
                .addScaledVector(senitV, 0.015)
                .normalize()
                .multiplyScalar(1400);

        return { lys, solHoyde, dekket };
    }

    // Lappene lages til slutt, når alle objektene finnes
    function lagLapper({ sol, mane }) {
        kropper.push(lagLapp(sol, solGruppe), lagLapp(mane, maneMesh));
        for (const pr of prikker) kropper.push(lagLapp(pr.data, pr.obj));
        kropper.push(lagLapp(issData, issPrikk));
    }

    return {
        gruppe,
        kropper,
        kikkert,
        jupiterManer: jupiterManeObj,
        settKart: (navn, kart) => {
            const k = kikkert.get(navn);
            if (k) k.mesh.material.uniforms.kart.value = kart;
        },
        lagLapper,
        oppdater,
        senit: senitV,
        nord: nordV,
        ost: ostV,
        maneMesh,
    };
}
