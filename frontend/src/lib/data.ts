import type { BodyInfo, FieldDef, PlanetDef } from "./types";

export const EARTH_FIELDS: FieldDef[] = [
    {
        id: "climate",
        label: "Climate (precipitation / mean annual temperature)",
        options: [
            { value: "hyperarid", label: "Hyper-arid (< 100 mm/yr, mean temp often > 18 °C)" },
            { value: "arid", label: "Arid (100–250 mm/yr)" },
            { value: "semiarid", label: "Semi-arid (250–500 mm/yr)" },
            { value: "temperate", label: "Temperate (500–1500 mm/yr, mean ~5–20 °C)" },
            { value: "tundra", label: "Tundra (< 250 mm/yr, mean −10 to 5 °C)" },
            { value: "glacial", label: "Glacial (< 250 mm/yr, mean < 0 °C year-round)" },
        ],
    },
    {
        id: "elevation",
        label: "Elevation (m a.s.l.)",
        options: [
            { value: "sea-level", label: "Coastal (0–200 m)" },
            { value: "low", label: "Low (200–800 m)" },
            { value: "medium", label: "Medium (800–2000 m)" },
            { value: "high", label: "High (2000–3500 m)" },
            { value: "very-high", label: "Very high (> 3500 m)" },
        ],
    },
    {
        id: "soil",
        label: "Surface substrate (0–15 cm)",
        options: [
            { value: "basaltic", label: "Basaltic (volcanic mafic rock)" },
            { value: "ash", label: "Volcanic ash / tephra (< 2 mm particles)" },
            { value: "sandy", label: "Sandy (0.05–2 mm grains)" },
            { value: "gravel", label: "Gravelly (> 2 mm fragments)" },
            { value: "iron-rich", label: "Iron-rich (Fe oxides present)" },
            { value: "saline", label: "Saline (evaporite/salt crusts)" },
            { value: "gypsum", label: "Gypsiferous (sulfate/gypsum-rich)" },
            { value: "ice", label: "Icy / permafrost (frozen ground)" },
        ],
    },
    {
        id: "humidity",
        label: "Mean annual relative humidity (RH)",
        options: [
            { value: "very-low", label: "Very low (0–20% RH)" },
            { value: "low", label: "Low (20–40% RH)" },
            { value: "medium", label: "Medium (40–60% RH)" },
            { value: "high", label: "High (60–80% RH)" },
            { value: "very-high", label: "Very high (80–100% RH)" },
        ],
    },
];

export const PLANETS: PlanetDef[] = [
    {
        id: "moon",
        name: "Moon",
        fields: [
            {
                id: "zone",
                label: "Lunar zone",
                options: [
                    { value: "maria", label: "Basaltic maria (broad low plains)" },
                    { value: "craters", label: "Craters and highlands (elevated, impact terrain)" },
                    { value: "poles", label: "Poles (high-latitude, low sun angle)" },
                ],
            },
            {
                id: "temperature",
                label: "Surface thermal regime",
                options: [
                    { value: "extreme", label: "Extreme day–night cycle (approx. −170 to 120 °C)" },
                    { value: "very-cold", label: "Permanently shadowed (often < −150 °C)" },
                ],
            },
            {
                id: "composition",
                label: "Regolith composition",
                options: [
                    { value: "basalt", label: "Mare basalt (Fe/Ti-rich volcanic rock)" },
                    { value: "regolith", label: "Fine regolith (dust/fragments, μm–mm scale)" },
                    { value: "ice", label: "Water ice (volatile deposits)" },
                ],
            },
            {
                id: "terrain",
                label: "Terrain (typical slope)",
                options: [
                    { value: "flat", label: "Plain (approx. < 5° slope)" },
                    { value: "craters", label: "Cratered (variable slopes, often > 10°)" },
                ],
            },
        ],
    },
    {
        id: "mars",
        name: "Mars",
        fields: [
            {
                id: "zone",
                label: "Martian zone",
                options: [
                    { value: "plains", label: "Plains (low-relief basins/plateaus)" },
                    { value: "canyons", label: "Canyons and valleys (steep walls, km-scale relief)" },
                    { value: "poles", label: "Polar caps (ice-rich, > 80° latitude)" },
                ],
            },
            {
                id: "temperature",
                label: "Surface thermal regime",
                options: [
                    { value: "cold", label: "Cold (approx. −90 to 20 °C)" },
                    { value: "very-cold", label: "Very cold / polar (approx. −140 to −60 °C)" },
                ],
            },
            {
                id: "composition",
                label: "Surface composition",
                options: [
                    { value: "oxides", label: "Iron oxides (Fe-oxide rich, reddish dust/rock)" },
                    { value: "sulfates", label: "Sulfates (evaporite/sulfate minerals)" },
                    { value: "water-ice", label: "Water ice (surface/subsurface ice)" },
                ],
            },
            {
                id: "terrain",
                label: "Terrain (typical slope)",
                options: [
                    { value: "flat", label: "Plain (approx. < 5° slope)" },
                    { value: "rugged", label: "Rugged / mountainous (variable slopes, often > 10°)" },
                ],
            },
        ],
    },
];

export interface AnalogSeed {
    id: string;
    planet: "moon" | "mars";
    base: number;
    earthTags: Record<string, string>;
    zoneTags: Record<string, string>;
    coords: [number, number];
    earth: BodyInfo;
    zone: BodyInfo;
}

const tone = {
    basalt: "linear-gradient(160deg,#3d4a52,#1c262c)",
    desert: "linear-gradient(160deg,#b98b5a,#6e4a2c)",
    ice: "linear-gradient(160deg,#a9c7d6,#4d7384)",
    salt: "linear-gradient(160deg,#d8cdb8,#8e7f64)",
    rust: "linear-gradient(160deg,#c4502d,#5f2113)",
    moon: "linear-gradient(160deg,#c9c7c0,#6f6d68)",
    moonPole: "linear-gradient(160deg,#6f7a86,#1e262e)",
    river: "linear-gradient(160deg,#b5502e,#4a1f13)",
};

export const NASA_EARTH_FALLBACK =
    "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/The_Earth_seen_from_Apollo_17.jpg/1280px-The_Earth_seen_from_Apollo_17.jpg";

export const NASA_MOON_FALLBACK = "https://images-assets.nasa.gov/image/PIA23210/PIA23210~orig.jpg";

export const NASA_MARS_FALLBACK = "https://images-assets.nasa.gov/image/PIA02150/PIA02150~orig.jpg";

export const PLANET_IMAGES = {
    earth: "https://upload.wikimedia.org/wikipedia/commons/thumb/9/97/The_Earth_seen_from_Apollo_17.jpg/1280px-The_Earth_seen_from_Apollo_17.jpg",
    moon: "https://images-assets.nasa.gov/image/PIA00405/PIA00405~medium.jpg",
    mars: NASA_MARS_FALLBACK,
} as const;

// Satellite image centered on the coordinate (Esri World Imagery export; no API key)
export function buildEarthLocationImage(lat: number, lng: number): string {
    const validLat = Number.isFinite(lat) ? lat : 0;
    const validLng = Number.isFinite(lng) ? lng : 0;
    const d = 0.01; // ~1 km of context around the point
    const minLon = validLng - d;
    const maxLon = validLng + d;
    const minLat = validLat - d;
    const maxLat = validLat + d;
    return `https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/export?bbox=${minLon.toFixed(6)},${minLat.toFixed(6)},${maxLon.toFixed(6)},${maxLat.toFixed(6)}&bboxSR=4326&imageSR=4326&size=640,360&format=jpg&f=image`;
}

export const ANALOGS: AnalogSeed[] = [
    {
        id: "moon-krafla",
        planet: "moon",
        base: 78,
        coords: [65.715, -16.754],
        earthTags: { climate: "polar", elevation: "medium", soil: "basaltic", humidity: "medium" },
        zoneTags: { zone: "maria", temperature: "extreme", composition: "basalt", terrain: "flat" },
        earth: {
            kicker: "Earth · Iceland",
            title: "Krafla lava field",
            tone: tone.basalt,
            imageUrl: buildEarthLocationImage(65.715, -16.754),
            fields: [
                {
                    label: "Soil",
                    value: "Volcanic basalt",
                    detail: "Recent basaltic lava flows, with texture and composition comparable to lunar plains.",
                },
                {
                    label: "Climate",
                    value: "Subpolar, cool",
                    detail: "Low temperatures and constant wind. Humidity is the main difference from the Moon.",
                },
                {
                    label: "Terrain",
                    value: "Lava plain",
                    detail: "Extensive and relatively flat surface, useful for testing rovers and exploration maneuvers.",
                },
            ],
        },
        zone: {
            kicker: "Moon · Maria",
            title: "Mare Tranquillitatis",
            tone: tone.moon,
            imageUrl: "https://images-assets.nasa.gov/image/as11-40-5877/as11-40-5877~medium.jpg",
            fields: [
                {
                    label: "Composition",
                    value: "Iron- and titanium-rich basalt",
                    detail: "Plain formed by ancient basaltic eruptions that filled an impact basin.",
                },
                {
                    label: "Temperature",
                    value: "Approx. −170 to 120 °C",
                    detail: "With no atmosphere to moderate heat, the surface changes extremely between lunar day and night.",
                },
                {
                    label: "Terrain",
                    value: "Plain with small craters",
                    detail: "Broad, relatively flat terrain historically chosen for landings.",
                },
            ],
        },
    },
    {
        id: "moon-barringer",
        planet: "moon",
        base: 81,
        coords: [35.028, -111.023],
        earthTags: { climate: "arid", elevation: "medium", soil: "sandy", humidity: "low" },
        zoneTags: { zone: "craters", temperature: "extreme", composition: "regolith", terrain: "craters" },
        earth: {
            kicker: "Earth · Arizona, USA",
            title: "Barringer Crater",
            tone: tone.desert,
            imageUrl: buildEarthLocationImage(35.028, -111.023),
            fields: [
                {
                    label: "Soil",
                    value: "Fractured rock and sand",
                    detail: "Material pulverized by the impact, with a loose layer reminiscent of regolith.",
                },
                {
                    label: "Climate",
                    value: "Continental arid",
                    detail: "Little rainfall and large day–night temperature swings.",
                },
                {
                    label: "Terrain",
                    value: "~1.2 km crater",
                    detail: "One of the best-preserved impact craters on Earth and an astronaut training site.",
                },
            ],
        },
        zone: {
            kicker: "Moon · Craters",
            title: "Young impact crater",
            tone: tone.moon,
            imageUrl: "https://images-assets.nasa.gov/image/PIA23210/PIA23210~medium.jpg",
            fields: [
                {
                    label: "Composition",
                    value: "Fine regolith",
                    detail: "Layer of dust and rock fragments generated by millions of years of impacts.",
                },
                {
                    label: "Temperature",
                    value: "Extreme day–night contrast",
                    detail: "Sunlit rims heat up strongly while the floor may remain in shadow.",
                },
                {
                    label: "Terrain",
                    value: "Rim, floor, and ejecta",
                    detail: "Typical structure of a simple crater, with material ejected around the rim.",
                },
            ],
        },
    },
    {
        id: "moon-mcmurdo",
        planet: "moon",
        base: 66,
        coords: [-77.465, 162.52],
        earthTags: { climate: "polar", elevation: "low", soil: "ice", humidity: "very-low" },
        zoneTags: { zone: "poles", temperature: "very-cold", composition: "ice", terrain: "craters" },
        earth: {
            kicker: "Earth · Antarctica",
            title: "McMurdo Dry Valleys",
            tone: tone.ice,
            imageUrl: buildEarthLocationImage(-77.465, 162.52),
            fields: [
                {
                    label: "Soil",
                    value: "Permafrost and rock",
                    detail: "Frozen ground with almost no snow, with buried ice beneath a dry surface layer.",
                },
                {
                    label: "Climate",
                    value: "Hyper-arid polar",
                    detail: "One of the driest and coldest places on Earth.",
                },
                {
                    label: "Terrain",
                    value: "Valleys and rock walls",
                    detail: "Ice-free valleys useful for studying freezing and sublimation processes.",
                },
            ],
        },
        zone: {
            kicker: "Moon · Poles",
            title: "Permanently shadowed polar craters",
            tone: tone.moonPole,
            imageUrl: "https://images-assets.nasa.gov/image/PIA14021/PIA14021~medium.jpg",
            fields: [
                {
                    label: "Composition",
                    value: "Possible water ice",
                    detail: "Permanently shadowed areas where ice mixed with regolith may be preserved.",
                },
                {
                    label: "Temperature",
                    value: "Below −200 °C in shadow",
                    detail: "Some of the lowest temperatures in the inner Solar System are measured in these crater floors.",
                },
                {
                    label: "Terrain",
                    value: "Deep craters",
                    detail: "High walls block sunlight throughout the year.",
                },
            ],
        },
    },
    {
        id: "mars-atacama",
        planet: "mars",
        base: 85,
        coords: [-24.5, -69.25],
        earthTags: { climate: "arid", elevation: "high", soil: "saline", humidity: "very-low" },
        zoneTags: { zone: "plains", temperature: "cold", composition: "sulfates", terrain: "flat" },
        earth: {
            kicker: "Earth · Chile",
            title: "Atacama Desert",
            tone: tone.salt,
            imageUrl: buildEarthLocationImage(-24.5, -69.25),
            fields: [
                {
                    label: "Soil",
                    value: "Salts and sulfates",
                    detail: "Soils with saline crusts and evaporite minerals, with almost no organic matter.",
                },
                {
                    label: "Climate",
                    value: "Hyper-arid",
                    detail: "Areas with almost no rainfall and high ultraviolet radiation due to elevation.",
                },
                {
                    label: "Terrain",
                    value: "Open high plateau",
                    detail: "Extensive high-altitude plains suitable for rover field tests.",
                },
            ],
        },
        zone: {
            kicker: "Mars · Plains",
            title: "Meridiani Planum",
            tone: tone.rust,
            imageUrl: "https://images-assets.nasa.gov/image/PIA05112/PIA05112~medium.jpg",
            fields: [
                {
                    label: "Composition",
                    value: "Hematite and sulfates",
                    detail: "Deposits indicating the past presence of liquid water.",
                },
                {
                    label: "Temperature",
                    value: "Approx. −90 to 0 °C",
                    detail: "Intense cold with large day–night swings due to the thin atmosphere.",
                },
                {
                    label: "Terrain",
                    value: "Open plain",
                    detail: "Broad, flat terrain with small craters and dune fields.",
                },
            ],
        },
    },
    {
        id: "mars-riotinto",
        planet: "mars",
        base: 76,
        coords: [37.694, -6.597],
        earthTags: { climate: "temperate", elevation: "low", soil: "iron-rich", humidity: "medium" },
        zoneTags: { zone: "canyons", temperature: "cold", composition: "oxides", terrain: "rugged" },
        earth: {
            kicker: "Earth · Spain",
            title: "Río Tinto",
            tone: tone.river,
            imageUrl: buildEarthLocationImage(37.694, -6.597),
            fields: [
                {
                    label: "Soil",
                    value: "Iron oxides and sulfides",
                    detail: "Iron-rich minerals that stain the water and rocks red.",
                },
                {
                    label: "Climate",
                    value: "Mediterranean",
                    detail: "More temperate and humid than Mars; the similarity is mineralogical, not climatic.",
                },
                {
                    label: "Terrain",
                    value: "Valley and slopes",
                    detail: "Slopes with sediment layers useful for studying geochemical processes.",
                },
            ],
        },
        zone: {
            kicker: "Mars · Canyons",
            title: "Valles Marineris",
            tone: tone.rust,
            imageUrl: "https://images-assets.nasa.gov/image/PIA00422/PIA00422~medium.jpg",
            fields: [
                {
                    label: "Composition",
                    value: "Iron oxides and hydrated minerals",
                    detail: "Canyon walls expose layers that record the planet's geological history.",
                },
                {
                    label: "Temperature",
                    value: "Approx. −110 to 0 °C",
                    detail: "Low temperatures, somewhat milder at the floor due to higher atmospheric pressure.",
                },
                {
                    label: "Terrain",
                    value: "Canyon system spanning thousands of km",
                    detail: "One of the largest canyon systems in the Solar System.",
                },
            ],
        },
    },
    {
        id: "mars-mcmurdo",
        planet: "mars",
        base: 69,
        coords: [-77.465, 162.52],
        earthTags: { climate: "polar", elevation: "low", soil: "ice", humidity: "very-low" },
        zoneTags: { zone: "poles", temperature: "very-cold", composition: "water-ice", terrain: "flat" },
        earth: {
            kicker: "Earth · Antarctica",
            title: "McMurdo Dry Valleys",
            tone: tone.ice,
            imageUrl: buildEarthLocationImage(-77.465, 162.52),
            fields: [
                {
                    label: "Soil",
                    value: "Dry permafrost",
                    detail: "Ice buried beneath dry soil, comparable to Martian subsurface ice.",
                },
                {
                    label: "Climate",
                    value: "Hyper-arid polar",
                    detail: "Extreme cold and dryness, with little surface microbial life.",
                },
                {
                    label: "Terrain",
                    value: "Open valleys",
                    detail: "Snow-free terrain with ice polygons similar to those observed on Mars.",
                },
            ],
        },
        zone: {
            kicker: "Mars · Polar caps",
            title: "Planum Boreum",
            tone: tone.ice,
            imageUrl: "https://images-assets.nasa.gov/image/PIA13163/PIA13163~medium.jpg",
            fields: [
                {
                    label: "Composition",
                    value: "Water ice and CO₂",
                    detail: "Layers of ice and dust, with a seasonal carbon dioxide cap.",
                },
                {
                    label: "Temperature",
                    value: "Near −125 °C in winter",
                    detail: "Atmospheric CO₂ freezes onto the cap during winter.",
                },
                {
                    label: "Terrain",
                    value: "Spiral-trough plateau",
                    detail: "Ice plateau with spiral valleys shaped by wind and sublimation.",
                },
            ],
        },
    },
];
