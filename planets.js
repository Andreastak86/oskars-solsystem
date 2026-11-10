// Alle data om solen, planetene, månen og Halleys komet.
//
// kompakt  = avstand fra solen i "kompakt" visning (så alt får plass på skjermen)
// au       = ekte avstand fra solen i AU (1 AU = avstanden jorden–solen)
// storrelse = radius i scenen (ikke ekte forhold – da ville de fleste planetene vært usynlige prikker)
// periode  = hvor mange jorddager én runde rundt solen tar
// L0       = hvor planeten sto (i grader) 1. januar 2000 kl. 12 – brukes for å finne ut hvor den står i dag
// pol      = retningen nordpolen peker mot på stjernehimmelen [timer, grader] – gir riktige årstider
// e        = hvor avlang banen er (0 = sirkel). Vi tegner sirkler, men farten rundt blir ekte
// perihel  = retningen til punktet der planeten er nærmest solen (grader)
// spinn    = hvor fort den snurrer rundt seg selv i animasjonen
//
// Tekstene er skrevet for en som akkurat har lært å lese:
// korte setninger, enkle ord og en emoji foran hver ting.
// stats = [ikon, hva, svar]   fakta = [ikon, tekst]

export const AU_SKALA = 16;

export const solen = {
    navn: "Solen",
    kallenavn: "Stjernen vår",
    type: "⭐ Stjerne",
    storrelse: 5,
    pol: [19.0753, 63.87],
    prikk: "#ffb340",
    stats: [
        ["📏", "Så stor", "Kjempestor!"],
        ["📍", "Hvor", "I midten"],
        ["🔄", "Snurrer en runde på", "25 dager"],
        ["🌡️", "Så varm", "5 500 grader"],
    ],
    fakta: [
        ["⭐", "Solen er en stjerne! Den er bare mye nærmere oss enn de andre stjernene."],
        ["🌍", "Over én million jordkloder kunne fått plass inni Solen."],
        ["💡", "Lyset fra Solen bruker 8 minutter hit til oss."],
        ["😎", "Se aldri rett på Solen. Den er så sterk at øynene kan bli skadet."],
    ],
};

export const planeter = [
    {
        navn: "Merkur",
        kallenavn: "Den minste planeten",
        type: "🪨 Steinplanet",
        kompakt: 9,
        au: 0.387,
        storrelse: 0.4,
        periode: 87.969,
        L0: 252.25,
        pol: [18.734, 61.4155],
        e: 0.20563,
        perihel: 77.457,
        inkl: 7.005, // hvor skjev banen er (grader) – brukes når vi ser fra Jorden
        node: 48.331,
        spinn: 0.15,
        prikk: "#a8a29c",
        stats: [
            ["📏", "Så stor", "Litt større enn Månen"],
            ["☀️", "Avstand fra Solen", "58 millioner km"],
            ["🎂", "Ett år varer", "88 dager"],
            ["🔄", "Snurrer en runde på", "59 dager"],
            ["🌙", "Måner", "Ingen"],
            ["🌡️", "Så varm", "430 grader om dagen, –180 om natten"],
        ],
        fakta: [
            ["🏃", "Merkur er den raskeste planeten. Den suser rundt Solen på bare 88 dager."],
            ["🔥", "Om dagen er det varmere enn i en stekeovn."],
            ["🥶", "Om natten blir det mye kaldere enn i en fryser."],
            ["🕳️", "Merkur er full av kratere. Den ligner litt på Månen."],
        ],
    },
    {
        navn: "Venus",
        kallenavn: "Den varmeste planeten",
        type: "🪨 Steinplanet",
        kompakt: 13,
        au: 0.723,
        storrelse: 0.85,
        periode: 224.701,
        L0: 181.98,
        pol: [18.184, 67.16],
        e: 0.00677,
        perihel: 131.602,
        inkl: 3.395, // hvor skjev banen er (grader) – brukes når vi ser fra Jorden
        node: 76.68,
        spinn: -0.08, // baklengs
        atmosfaere: ["#ffe2a8", 1.3], // farge og styrke på gløden i kanten
        prikk: "#e8c27a",
        stats: [
            ["📏", "Så stor", "Nesten like stor som Jorden"],
            ["☀️", "Avstand fra Solen", "108 millioner km"],
            ["🎂", "Ett år varer", "225 dager"],
            ["🔄", "Snurrer en runde på", "243 dager – baklengs!"],
            ["🌙", "Måner", "Ingen"],
            ["🌡️", "Så varm", "465 grader"],
        ],
        fakta: [
            ["🔥", "Venus er den varmeste planeten. Det er så varmt at metall kan smelte!"],
            ["🐌", "Venus snurrer veldig sakte. En dag der er lengre enn et helt år."],
            ["🙃", "Venus snurrer baklengs. Der står solen opp i vest."],
            ["✨", "Du kan se Venus på himmelen! Den ser ut som en veldig klar stjerne."],
        ],
    },
    {
        navn: "Jorden",
        kallenavn: "Her bor du!",
        type: "🪨 Steinplanet",
        kompakt: 18,
        au: 1.0,
        storrelse: 0.9,
        periode: 365.256,
        L0: 100.46,
        pol: [0, 90],
        e: 0.01671,
        perihel: 102.937,
        inkl: 0, // hvor skjev banen er (grader) – brukes når vi ser fra Jorden
        node: 0,
        spinn: 0.5,
        atmosfaere: ["#6fb2ff", 1.6], // farge og styrke på gløden i kanten
        prikk: "#4a9be0",
        stats: [
            ["📏", "Så stor", "Største steinplanet"],
            ["☀️", "Avstand fra Solen", "150 millioner km"],
            ["🎂", "Ett år varer", "365 dager"],
            ["🔄", "Snurrer en runde på", "24 timer"],
            ["🌙", "Måner", "1 – Månen!"],
            ["🌡️", "Så varm", "15 grader i snitt"],
        ],
        fakta: [
            ["🐶", "Jorden er den eneste planeten vi vet om der det finnes liv."],
            ["🌊", "Det meste av Jorden er dekket av vann."],
            ["❄️", "Jorden står litt på skrå. Derfor har vi sommer og vinter!"],
            ["🚀", "Jorden suser rundt Solen. Du reiser 30 km hvert sekund – uten å merke det!"],
        ],
    },
    {
        navn: "Mars",
        kallenavn: "Den røde planeten",
        type: "🪨 Steinplanet",
        kompakt: 23,
        au: 1.524,
        storrelse: 0.6,
        periode: 686.98,
        L0: 355.45,
        pol: [21.1513, 54.4325],
        e: 0.09339,
        perihel: 336.06,
        inkl: 1.85, // hvor skjev banen er (grader) – brukes når vi ser fra Jorden
        node: 49.558,
        spinn: 0.48,
        atmosfaere: ["#ffb08a", 0.6], // farge og styrke på gløden i kanten
        prikk: "#d0643a",
        stats: [
            ["📏", "Så stor", "Halvparten av Jorden"],
            ["☀️", "Avstand fra Solen", "228 millioner km"],
            ["🎂", "Ett år varer", "687 dager"],
            ["🔄", "Snurrer en runde på", "24 og en halv time"],
            ["🌙", "Måner", "2"],
            ["🌡️", "Så kald", "–60 grader i snitt"],
        ],
        fakta: [
            ["🔴", "Mars er rød fordi bakken er full av rust."],
            ["⛰️", "Det største fjellet vi kjenner er på Mars. Det er over dobbelt så høyt som Mount Everest!"],
            ["🤖", "Roboter kjører rundt på Mars og tar bilder til oss."],
            ["🌪️", "På Mars kan det blåse opp støvstormer som dekker hele planeten."],
        ],
    },
    {
        navn: "Jupiter",
        kallenavn: "Kongen av planetene",
        type: "☁️ Gasskjempe",
        kompakt: 34,
        au: 5.203,
        storrelse: 2.6,
        periode: 4332.59,
        L0: 34.4,
        pol: [17.8705, 64.4953],
        e: 0.04839,
        perihel: 14.728,
        inkl: 1.303, // hvor skjev banen er (grader) – brukes når vi ser fra Jorden
        node: 100.464,
        spinn: 1.1,
        atmosfaere: ["#f0dcc0", 0.7], // farge og styrke på gløden i kanten
        prikk: "#d8b48a",
        stats: [
            ["📏", "Så stor", "Største planet!"],
            ["☀️", "Avstand fra Solen", "778 millioner km"],
            ["🎂", "Ett år varer", "12 år"],
            ["🔄", "Snurrer en runde på", "10 timer"],
            ["🌙", "Måner", "Over 90"],
            ["🌡️", "Så kald", "–110 grader"],
        ],
        fakta: [
            ["👑", "Jupiter er den største planeten. Over 1 300 jordkloder kunne fått plass inni!"],
            ["🌀", "Den røde flekken er en kjempestorm. Den er større enn hele Jorden!"],
            ["☁️", "Jupiter har ingen bakke å stå på. Den er laget av gass."],
            ["⚡", "Det lyner på Jupiter – mye kraftigere enn her hjemme."],
        ],
    },
    {
        navn: "Saturn",
        kallenavn: "Ringplaneten",
        type: "☁️ Gasskjempe",
        kompakt: 47,
        au: 9.537,
        storrelse: 2.2,
        periode: 10759.22,
        L0: 49.94,
        pol: [2.7059, 83.537],
        e: 0.05386,
        perihel: 92.599,
        inkl: 2.485, // hvor skjev banen er (grader) – brukes når vi ser fra Jorden
        node: 113.666,
        spinn: 1.0,
        ring: true,
        atmosfaere: ["#f3e4bc", 0.7], // farge og styrke på gløden i kanten
        prikk: "#e6d29c",
        stats: [
            ["📏", "Så stor", "Nest største planet"],
            ["☀️", "Avstand fra Solen", "1 400 millioner km"],
            ["🎂", "Ett år varer", "29 og et halvt år"],
            ["🔄", "Snurrer en runde på", "10 og en halv time"],
            ["🌙", "Måner", "Over 200!"],
            ["🌡️", "Så kald", "–140 grader"],
        ],
        fakta: [
            ["💍", "Ringene er laget av is og stein. Noen biter er små som støv, andre store som hus."],
            ["🛁", "Saturn er så lett at den kunne ha flytt i vann – hvis vi hadde et badekar som var stort nok!"],
            ["🌙", "Saturn har flere måner enn noen annen planet."],
        ],
    },
    {
        navn: "Uranus",
        kallenavn: "Planeten som ligger på siden",
        type: "🧊 Iskjempe",
        kompakt: 59,
        au: 19.19,
        storrelse: 1.4,
        periode: 30688.5,
        L0: 313.23,
        pol: [17.1541, -15.175],
        e: 0.04726,
        perihel: 170.954,
        inkl: 0.773, // hvor skjev banen er (grader) – brukes når vi ser fra Jorden
        node: 74.017,
        spinn: -0.7, // baklengs
        atmosfaere: ["#b4f2f6", 1.0], // farge og styrke på gløden i kanten
        prikk: "#8fd8e0",
        stats: [
            ["📏", "Så stor", "4 ganger bredere enn Jorden"],
            ["☀️", "Avstand fra Solen", "2 900 millioner km"],
            ["🎂", "Ett år varer", "84 år"],
            ["🔄", "Snurrer en runde på", "17 timer"],
            ["🌙", "Måner", "Nesten 30"],
            ["🌡️", "Så kald", "–195 grader"],
        ],
        fakta: [
            ["⚽", "Uranus ligger på siden og ruller rundt Solen som en ball."],
            ["🔭", "Uranus var den første planeten som ble funnet med teleskop."],
            ["☀️", "En sommer på Uranus varer i 21 år. Vinteren er like lang!"],
            ["🥚", "Skyene på Uranus har en gass som lukter råtne egg. Æsj!"],
        ],
    },
    {
        navn: "Neptun",
        kallenavn: "Planeten lengst ute",
        type: "🧊 Iskjempe",
        kompakt: 70,
        au: 30.07,
        storrelse: 1.35,
        periode: 60182,
        L0: 304.88,
        pol: [19.9573, 43.46],
        e: 0.00859,
        perihel: 44.965,
        inkl: 1.77, // hvor skjev banen er (grader) – brukes når vi ser fra Jorden
        node: 131.784,
        spinn: 0.75,
        atmosfaere: ["#7aa2ff", 1.1], // farge og styrke på gløden i kanten
        prikk: "#4f7fe0",
        stats: [
            ["📏", "Så stor", "4 ganger bredere enn Jorden"],
            ["☀️", "Avstand fra Solen", "4 500 millioner km"],
            ["🎂", "Ett år varer", "165 år"],
            ["🔄", "Snurrer en runde på", "16 timer"],
            ["🌙", "Måner", "16"],
            ["🌡️", "Så kald", "–200 grader"],
        ],
        fakta: [
            ["🌬️", "Neptun har de sterkeste vindene i solsystemet. Det blåser over 2 000 km i timen!"],
            ["🧮", "Neptun ble funnet med matte! Forskere regnet ut hvor den var før noen så den."],
            ["🎂", "Ett år på Neptun varer i 165 år. Ingen har noen gang fått bursdag der!"],
        ],
    },
];

export const manen = {
    navn: "Månen",
    kallenavn: "Jordens beste venn",
    type: "🌙 Måne",
    storrelse: 0.25,
    avstand: 1.8, // hvor langt fra Jorden den tegnes. Hvor den står regnes ut i astro.js
    prikk: "#cfcfcf",
    stats: [
        ["📏", "Så stor", "En fjerdedel av Jorden"],
        ["🌍", "Avstand fra Jorden", "384 400 km"],
        ["🔄", "Går rundt Jorden på", "27 dager"],
        ["🌡️", "Så varm", "120 grader om dagen, –170 om natten"],
    ],
    fakta: [
        ["🌗", "Månen viser alltid den samme siden til oss."],
        ["👨‍🚀", "12 mennesker har gått på Månen."],
        ["👣", "Det blåser ikke på Månen. Derfor er fotsporene til astronautene der ennå!"],
        ["🔦", "Månen lyser ikke selv. Den lyser fordi Solen skinner på den."],
        ["🩸", "Når Månen går inn i skyggen til Jorden, blir den rød. Det kalles blodmåne!"],
    ],
};

// Halleys komet. Går i en veldig avlang bane – fra innenfor Venus til utenfor Neptun.
// Tallene er "baneelementer" fra NASA. perihelDag = dager fra år 2000 til den var nærmest Solen.
const PERIHEL_1986 = (Date.UTC(1986, 1, 9, 11) - Date.UTC(2000, 0, 1, 12)) / 86400000;
const PERIHEL_2061 = (Date.UTC(2061, 6, 28, 12) - Date.UTC(2000, 0, 1, 12)) / 86400000;
export const halley = {
    navn: "Halley",
    kallenavn: "Kometen som kommer tilbake",
    type: "☄️ Komet",
    storrelse: 0.05,
    prikk: "#9fdcff",
    bane: {
        a: 17.834, // halve langaksen i AU
        e: 0.96714,
        inkl: 162.26, // over 90° betyr at den går rundt "feil vei"
        node: 58.42,
        perihel: 58.42 + 111.33,
        perihelDag: PERIHEL_1986,
        periode: PERIHEL_2061 - PERIHEL_1986,
    },
    stats: [
        ["📏", "Så stor", "15 km lang"],
        ["🧊", "Laget av", "Is, støv og stein"],
        ["☀️", "Avstand fra Solen", "Fra 88 til 5 200 millioner km"],
        ["🎂", "Én runde tar", "76 år"],
        ["🔭", "Sist vi så den", "1986"],
        ["🔜", "Kommer tilbake", "2061"],
    ],
    fakta: [
        ["❄️", "En komet er som en skitten snøball. Den er laget av is, støv og stein."],
        ["☄️", "Når kometen kommer nær Solen, smelter isen. Da får den en lang, lysende hale!"],
        ["👉", "Halen peker alltid bort fra Solen – også når kometen er på vei ut igjen."],
        ["🔜", "Halley kommer tilbake i 2061. Hvor gammel er du da?"],
        ["⏩", "Vil du se halen? Skru farten helt opp og se Halley suse forbi Solen!"],
    ],
};

// Asteroidebeltet mellom Mars og Jupiter
export const belte = { kompakt: 28, au: 2.7, periode: 1620 };
