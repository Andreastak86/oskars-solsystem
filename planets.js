// Alle data om solen, planetene og månen.
//
// kompakt  = avstand fra solen i "kompakt" visning (så alt får plass på skjermen)
// au       = ekte avstand fra solen i AU (1 AU = avstanden jorden–solen)
// storrelse = radius i scenen (ikke ekte forhold – da ville de fleste planetene vært usynlige prikker)
// periode  = hvor mange jorddager én runde rundt solen tar
// L0       = hvor planeten sto (i grader) 1. januar 2000 kl. 12 – brukes for å finne ut hvor den står i dag
// tilt     = hvor skjev planeten står (grader)
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
        tilt: 0.03,
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
        tilt: 177.4,
        spinn: 0.08,
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
        tilt: 23.4,
        spinn: 0.5,
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
        tilt: 25.2,
        spinn: 0.48,
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
        tilt: 3.1,
        spinn: 1.1,
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
        tilt: 26.7,
        spinn: 1.0,
        ring: true,
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
        tilt: 97.8,
        spinn: 0.7,
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
        tilt: 28.3,
        spinn: 0.75,
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
    avstand: 1.8,
    periode: 27.321582,
    L0: 218.316, // månens plass sett fra jorden 1. januar 2000 – gir riktig fullmåne og nymåne
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
    ],
};

// Asteroidebeltet mellom Mars og Jupiter
export const belte = { kompakt: 28, au: 2.7, periode: 1620 };
