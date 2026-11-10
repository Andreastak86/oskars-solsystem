// De klareste og mest kjente stjernene, med ekte plass på himmelen.
// [navn, rektascensjon (timer), deklinasjon (grader), lysstyrke (mindre tall = klarere), farge]
// Fargen kommer av hvor varm stjernen er: blå er varmest, rød er kaldest.

const BLA = "#c4d4ff",
    HVIT = "#f4f6ff",
    GUL = "#fff1c9",
    ORANSJE = "#ffd29a",
    ROD = "#ffb070";

export const stjerner = [
    // De aller klareste
    ["Sirius", 6.7525, -16.716, -1.46, "#cad8ff"],
    ["Canopus", 6.3992, -52.696, -0.74, HVIT],
    ["Alfa Centauri", 14.66, -60.834, -0.27, GUL],
    ["Arcturus", 14.261, 19.182, -0.05, ORANSJE],
    ["Vega", 18.6156, 38.784, 0.03, "#cad7ff"],
    ["Capella", 5.2782, 45.998, 0.08, GUL],
    ["Procyon", 7.655, 5.225, 0.34, HVIT],
    ["Achernar", 1.6286, -57.237, 0.46, BLA],
    ["Hadar", 14.0637, -60.373, 0.61, BLA],
    ["Altair", 19.8464, 8.868, 0.76, HVIT],
    ["Aldebaran", 4.5987, 16.509, 0.86, ROD],
    ["Spica", 13.4199, -11.161, 0.97, BLA],
    ["Pollux", 7.7553, 28.026, 1.14, ORANSJE],
    ["Fomalhaut", 22.9608, -29.622, 1.16, HVIT],
    ["Regulus", 10.1395, 11.967, 1.4, BLA],
    ["Castor", 7.5767, 31.888, 1.58, HVIT],
    ["Nordstjernen", 2.5303, 89.264, 1.98, GUL],

    // Orion
    ["Betelgeuse", 5.9195, 7.407, 0.42, ROD],
    ["Rigel", 5.2423, -8.2016, 0.13, BLA],
    ["Bellatrix", 5.4189, 6.35, 1.64, BLA],
    ["Alnilam", 5.6036, -1.202, 1.69, BLA],
    ["Alnitak", 5.6793, -1.943, 1.77, BLA],
    ["Mintaka", 5.5334, -0.299, 2.23, BLA],
    ["Saiph", 5.7959, -9.67, 2.07, BLA],
    ["Meissa", 5.5856, 9.934, 3.33, BLA],

    // Karlsvogna
    ["Dubhe", 11.0621, 61.751, 1.79, ORANSJE],
    ["Merak", 11.0307, 56.382, 2.37, HVIT],
    ["Phecda", 11.8972, 53.695, 2.44, HVIT],
    ["Megrez", 12.2571, 57.033, 3.31, HVIT],
    ["Alioth", 12.9005, 55.96, 1.77, HVIT],
    ["Mizar", 13.3988, 54.925, 2.23, HVIT],
    ["Alkaid", 13.7923, 49.313, 1.86, BLA],

    // Kassiopeia
    ["Caph", 0.1529, 59.15, 2.28, GUL],
    ["Schedar", 0.6751, 56.537, 2.24, ORANSJE],
    ["Gamma Cas", 0.9451, 60.717, 2.47, BLA],
    ["Ruchbah", 1.4303, 60.235, 2.68, HVIT],
    ["Segin", 1.9066, 63.67, 3.37, BLA],

    // Sørkorset
    ["Acrux", 12.4433, -63.099, 0.76, BLA],
    ["Mimosa", 12.7953, -59.689, 1.25, BLA],
    ["Gacrux", 12.5194, -57.113, 1.59, ROD],
    ["Delta Cru", 12.2524, -58.749, 2.79, BLA],

    // Svanen
    ["Deneb", 20.6905, 45.28, 1.25, HVIT],
    ["Sadr", 20.3705, 40.257, 2.23, GUL],
    ["Albireo", 19.5121, 27.96, 3.08, ORANSJE],
    ["Gienah", 20.7702, 33.97, 2.48, ORANSJE],
    ["Delta Cyg", 19.7496, 45.131, 2.87, HVIT],
    ["Eta Cyg", 19.9384, 35.083, 3.89, ORANSJE],

    // Skorpionen
    ["Antares", 16.4901, -26.432, 0.96, ROD],
    ["Acrab", 16.0906, -19.806, 2.62, BLA],
    ["Dschubba", 16.0056, -22.622, 2.29, BLA],
    ["Pi Sco", 15.9809, -26.114, 2.89, BLA],
    ["Sigma Sco", 16.3531, -25.593, 2.89, BLA],
    ["Tau Sco", 16.598, -28.216, 2.82, BLA],
    ["Epsilon Sco", 16.8361, -34.293, 2.29, ORANSJE],
    ["Mu Sco", 16.8645, -38.047, 3.0, BLA],
    ["Zeta Sco", 16.9097, -42.362, 3.6, ORANSJE],
    ["Eta Sco", 17.2026, -43.239, 3.3, HVIT],
    ["Sargas", 17.6219, -42.998, 1.86, GUL],
    ["Iota Sco", 17.793, -40.127, 3.0, GUL],
    ["Kappa Sco", 17.7081, -39.03, 2.4, BLA],
    ["Shaula", 17.5601, -37.104, 1.62, BLA],
    ["Lesath", 17.5127, -37.296, 2.7, BLA],

    // Syvstjernen (Pleiadene)
    ["Alcyone", 3.7914, 24.105, 2.87, BLA],
    ["Atlas", 3.8193, 24.053, 3.62, BLA],
    ["Electra", 3.7479, 24.113, 3.7, BLA],
    ["Maia", 3.7636, 24.368, 3.87, BLA],
    ["Merope", 3.7721, 23.948, 4.18, BLA],
    ["Taygeta", 3.7535, 24.467, 4.3, BLA],
    ["Pleione", 3.8195, 24.137, 5.05, BLA],
];

// Stjernebildene: navn, en kort tekst for barn, og hvilke stjerner som skal trekkes strek mellom
export const stjernebilder = [
    {
        navn: "Orion",
        linjer: [
            ["Betelgeuse", "Bellatrix"],
            ["Betelgeuse", "Meissa"],
            ["Bellatrix", "Meissa"],
            ["Betelgeuse", "Alnitak"],
            ["Bellatrix", "Mintaka"],
            ["Alnitak", "Alnilam"],
            ["Alnilam", "Mintaka"],
            ["Alnitak", "Saiph"],
            ["Mintaka", "Rigel"],
        ],
    },
    {
        navn: "Karlsvogna",
        linjer: [
            ["Dubhe", "Merak"],
            ["Merak", "Phecda"],
            ["Phecda", "Megrez"],
            ["Megrez", "Dubhe"],
            ["Megrez", "Alioth"],
            ["Alioth", "Mizar"],
            ["Mizar", "Alkaid"],
        ],
    },
    {
        navn: "Kassiopeia",
        linjer: [
            ["Caph", "Schedar"],
            ["Schedar", "Gamma Cas"],
            ["Gamma Cas", "Ruchbah"],
            ["Ruchbah", "Segin"],
        ],
    },
    {
        navn: "Sørkorset",
        linjer: [
            ["Acrux", "Gacrux"],
            ["Mimosa", "Delta Cru"],
        ],
    },
    {
        navn: "Svanen",
        linjer: [
            ["Deneb", "Sadr"],
            ["Sadr", "Eta Cyg"],
            ["Eta Cyg", "Albireo"],
            ["Delta Cyg", "Sadr"],
            ["Sadr", "Gienah"],
        ],
    },
    {
        navn: "Skorpionen",
        linjer: [
            ["Acrab", "Dschubba"],
            ["Dschubba", "Pi Sco"],
            ["Dschubba", "Sigma Sco"],
            ["Sigma Sco", "Antares"],
            ["Antares", "Tau Sco"],
            ["Tau Sco", "Epsilon Sco"],
            ["Epsilon Sco", "Mu Sco"],
            ["Mu Sco", "Zeta Sco"],
            ["Zeta Sco", "Eta Sco"],
            ["Eta Sco", "Sargas"],
            ["Sargas", "Iota Sco"],
            ["Iota Sco", "Kappa Sco"],
            ["Kappa Sco", "Shaula"],
            ["Shaula", "Lesath"],
        ],
    },
    { navn: "Syvstjernen", linjer: [], stjerne: "Alcyone" },
];

// Stjerner som får sin egen navnelapp
export const kjenteStjerner = ["Sirius", "Nordstjernen", "Vega", "Betelgeuse", "Antares", "Alfa Centauri"];

// Midten av Melkeveien og "nordpolen" til Melkeveien (galaksen vår), samme type koordinater
export const galaksen = {
    sentrum: [17.7603, -28.936],
    nordpol: [12.8573, 27.128],
};
