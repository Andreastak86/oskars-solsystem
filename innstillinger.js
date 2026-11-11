// Innstillingene: hva som skal vises, og hvor på Jorden vi står.
// Valgene huskes i nettleseren til neste gang (bare på denne maskinen).

export const steder = {
    oslo: { navn: "Oslo", bredde: 59.91, lengde: 10.75 },
    bergen: { navn: "Bergen", bredde: 60.39, lengde: 5.32 },
    trondheim: { navn: "Trondheim", bredde: 63.43, lengde: 10.39 },
    tromso: { navn: "Tromsø", bredde: 69.65, lengde: 18.96 },
    kristiansand: { navn: "Kristiansand", bredde: 58.15, lengde: 8.0 },
    nordpolen: { navn: "Nordpolen", bredde: 89.99, lengde: 0 },
    cadiz: { navn: "Cádiz i Spania", bredde: 36.53, lengde: -6.29 },
    nairobi: { navn: "Nairobi (ved ekvator)", bredde: -1.29, lengde: 36.82 },
    sydney: { navn: "Sydney i Australia", bredde: -33.87, lengde: 151.21 },
};

const STANDARD = {
    navn: true,
    baner: true,
    ekte: false,
    atmosfaere: true,
    asteroider: true,
    nasaBilder: true,
    iss: true,
    melkeveien: true,
    stjernebilder: true,
    stjernenavn: true,
    kompass: true,
    meldinger: true,
    sted: "oslo",
    her: null, // { bredde, lengde } hvis vi har funnet ut hvor du er
};

const SEKSJONER = [
    {
        tittel: "🪐 Rommet",
        valg: [
            ["navn", "🏷️", "Navn på klodene"],
            ["baner", "⭕", "Baner"],
            ["ekte", "📏", "Ekte avstander"],
            ["atmosfaere", "🌫️", "Glød rundt planetene"],
            ["asteroider", "🪨", "Asteroidebeltet"],
            ["nasaBilder", "📷", "Ekte bilder fra NASA"],
            ["iss", "🛰️", "Romstasjonen ISS (henter data fra nettet)"],
        ],
    },
    {
        tittel: "✨ Himmelen",
        valg: [
            ["melkeveien", "🌌", "Melkeveien"],
            ["stjernebilder", "✨", "Stjernebilder"],
            ["stjernenavn", "⭐", "Navn på stjerner"],
        ],
    },
    {
        tittel: "🔭 Stå på Jorden",
        sted: true,
        valg: [["kompass", "🧭", "Nord, Sør, Øst og Vest"]],
    },
    {
        tittel: "📣 Meldinger",
        valg: [["meldinger", "🌘", "Si fra om formørkelser"]],
    },
];

const NOKKEL = "solsystem-innstillinger";

export function lastInn() {
    try {
        const lagret = JSON.parse(localStorage.getItem(NOKKEL) || "{}");
        return { ...STANDARD, ...lagret };
    } catch {
        return { ...STANDARD };
    }
}

function lagre(verdier) {
    try {
        localStorage.setItem(NOKKEL, JSON.stringify(verdier));
    } catch {
        // Privat vindu eller blokkert lagring – da huskes det bare til siden lukkes
    }
}

export function gjeldendeSted(verdier) {
    if (verdier.sted === "her" && verdier.her)
        return { navn: "Der du er", ...verdier.her };
    return steder[verdier.sted] ?? steder.oslo;
}

// Bygger panelet og kaller endret(nokkel, verdi) når noe skrus av eller på
export function lagPanel(boks, verdier, endret) {
    const sett = (nokkel, verdi) => {
        verdier[nokkel] = verdi;
        lagre(verdier);
        endret(nokkel, verdi);
    };

    for (const seksjon of SEKSJONER) {
        const h = document.createElement("h3");
        h.textContent = seksjon.tittel;
        boks.appendChild(h);

        if (seksjon.sted) {
            const rad = document.createElement("div");
            rad.className = "sted-rad";
            const velg = document.createElement("select");
            velg.setAttribute("aria-label", "Hvor du står");
            const fyll = () => {
                velg.innerHTML = Object.entries(steder)
                    .map(([k, s]) => `<option value="${k}">📍 ${s.navn}</option>`)
                    .join("");
                if (verdier.her) velg.insertAdjacentHTML("afterbegin", `<option value="her">📍 Der du er</option>`);
                velg.value = verdier.sted;
            };
            fyll();
            velg.addEventListener("change", () => sett("sted", velg.value));

            const finn = document.createElement("button");
            finn.type = "button";
            finn.textContent = "🛰️ Finn meg";
            finn.addEventListener("click", () => {
                if (!navigator.geolocation) return;
                finn.textContent = "⏳ Leter …";
                navigator.geolocation.getCurrentPosition(
                    (pos) => {
                        // To desimaler holder (ca. 1 km) – vi trenger ikke vite nøyaktig hvor du bor
                        const r = (v) => Math.round(v * 100) / 100;
                        verdier.her = { bredde: r(pos.coords.latitude), lengde: r(pos.coords.longitude) };
                        sett("sted", "her");
                        fyll();
                        finn.textContent = "🛰️ Funnet!";
                    },
                    () => (finn.textContent = "🙈 Fikk ikke lov"),
                    { maximumAge: 600000, timeout: 15000 },
                );
            });
            rad.append(velg, finn);
            boks.appendChild(rad);
        }

        for (const [nokkel, ikon, tekst] of seksjon.valg) {
            const label = document.createElement("label");
            label.className = "bryter";
            label.innerHTML = `<span class="ikon">${ikon}</span><span class="tekst">${tekst}</span>`;
            const boksen = document.createElement("input");
            boksen.type = "checkbox";
            boksen.role = "switch";
            boksen.checked = !!verdier[nokkel];
            boksen.addEventListener("change", () => sett(nokkel, boksen.checked));
            label.appendChild(boksen);
            boks.appendChild(label);
        }
    }

    const kilde = document.createElement("p");
    kilde.className = "kilde";
    kilde.textContent =
        "📷 Bildene av planetene og månene og ISS-modellen kommer fra NASA, og er fri til bruk. Banedataene til ISS hentes fra CelesTrak.";
    boks.appendChild(kilde);
}
