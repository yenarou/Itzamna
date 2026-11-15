import type { BodyInfo, FieldDef, PlanetDef } from "./types";

export const EARTH_FIELDS: FieldDef[] = [
    {
        id: "clima",
        label: "Clima",
        options: [
            { value: "arido", label: "Árido" },
            { value: "polar", label: "Polar" },
            { value: "templado", label: "Templado" },
        ],
    },
    {
        id: "altitud",
        label: "Altitud",
        options: [
            { value: "baja", label: "Baja (< 500 m)" },
            { value: "media", label: "Media (500–2000 m)" },
            { value: "alta", label: "Alta (> 2000 m)" },
        ],
    },
    {
        id: "suelo",
        label: "Tipo de suelo",
        options: [
            { value: "basaltico", label: "Basáltico" },
            { value: "arenoso", label: "Arenoso" },
            { value: "ferroso", label: "Rico en hierro" },
            { value: "salino", label: "Salino" },
            { value: "hielo", label: "Hielo y permafrost" },
        ],
    },
    {
        id: "humedad",
        label: "Humedad",
        options: [
            { value: "muy-baja", label: "Muy baja" },
            { value: "baja", label: "Baja" },
            { value: "media", label: "Media" },
        ],
    },
];

export const PLANETS: PlanetDef[] = [
    {
        id: "luna",
        name: "Luna",
        fields: [
            {
                id: "zona",
                label: "Zona lunar",
                options: [
                    { value: "mares", label: "Mares" },
                    { value: "crateres", label: "Cráteres de impacto" },
                    { value: "polos", label: "Polos" },
                ],
            },
            {
                id: "temperatura",
                label: "Temperatura",
                options: [
                    { value: "extrema", label: "Extrema (día/noche)" },
                    { value: "muy-fria", label: "Muy fría (sombra)" },
                ],
            },
            {
                id: "composicion",
                label: "Composición",
                options: [
                    { value: "basalto", label: "Basalto" },
                    { value: "regolito", label: "Regolito" },
                    { value: "hielo", label: "Hielo de agua" },
                ],
            },
            {
                id: "relieve",
                label: "Relieve",
                options: [
                    { value: "plano", label: "Llano" },
                    { value: "crateres", label: "Con cráteres" },
                ],
            },
        ],
    },
    {
        id: "marte",
        name: "Marte",
        fields: [
            {
                id: "zona",
                label: "Zona marciana",
                options: [
                    { value: "planicies", label: "Planicies" },
                    { value: "canones", label: "Cañones" },
                    { value: "polos", label: "Casquetes polares" },
                ],
            },
            {
                id: "temperatura",
                label: "Temperatura",
                options: [
                    { value: "fria", label: "Fría" },
                    { value: "muy-fria", label: "Muy fría" },
                ],
            },
            {
                id: "composicion",
                label: "Composición",
                options: [
                    { value: "oxidos", label: "Óxidos de hierro" },
                    { value: "sulfatos", label: "Sulfatos" },
                    { value: "hielo-agua", label: "Hielo de agua" },
                ],
            },
            {
                id: "relieve",
                label: "Relieve",
                options: [
                    { value: "plano", label: "Llano" },
                    { value: "montanoso", label: "Accidentado" },
                ],
            },
        ],
    },
];

export interface AnalogSeed {
    id: string;
    planet: "luna" | "marte";
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

const EARTH_LOCATION_IMAGES: Record<string, string> = {
    "65.715,-16.754": "https://images-assets.nasa.gov/image/PIA16805/PIA16805~medium.jpg",
    "35.028,-111.023": "https://images-assets.nasa.gov/image/PIA24674/PIA24674~medium.jpg",
    "-77.465,162.520": "https://images-assets.nasa.gov/image/iss046-e-83900/iss046-e-83900~medium.jpg",
    "-24.500,-69.250": "https://images-assets.nasa.gov/image/iss056-e-216739/iss056-e-216739~medium.jpg",
    "37.694,-6.597": "https://images-assets.nasa.gov/image/iss050-e-177184/iss050-e-177184~medium.jpg",
};

export function buildEarthLocationImage(lat: number, lng: number): string {
    const validLat = Number.isFinite(lat) ? lat : 0;
    const validLng = Number.isFinite(lng) ? lng : 0;
    // Imagen satelital del punto marcado (Esri World Imagery, bbox alrededor de la coordenada)
    const d = 0.08;
    const minLon = validLng - d;
    const minLat = validLat - d / 1.6;
    const maxLon = validLng + d;
    const maxLat = validLat + d / 1.6;
    return `https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/export?bbox=${minLon.toFixed(6)},${minLat.toFixed(6)},${maxLon.toFixed(6)},${maxLat.toFixed(6)}&bboxSR=4326&imageSR=4326&size=640,360&format=jpg&f=image`;
}

export const ANALOGS: AnalogSeed[] = [
    {
        id: "luna-krafla",
        planet: "luna",
        base: 78,
        coords: [65.715, -16.754],
        earthTags: { clima: "polar", altitud: "media", suelo: "basaltico", humedad: "media" },
        zoneTags: { zona: "mares", temperatura: "extrema", composicion: "basalto", relieve: "plano" },
        earth: {
            kicker: "Tierra · Islandia",
            title: "Campo de lava de Krafla",
            tone: tone.basalt,
            imageUrl: buildEarthLocationImage(65.715, -16.754),
            fields: [
                {
                    label: "Suelo",
                    value: "Basalto volcánico",
                    detail: "Coladas de lava basáltica recientes, con textura y composición comparables a las llanuras lunares.",
                },
                {
                    label: "Clima",
                    value: "Subpolar, fresco",
                    detail: "Temperaturas bajas y viento constante. La humedad es la principal diferencia con la Luna.",
                },
                {
                    label: "Relieve",
                    value: "Llanura de lava",
                    detail: "Superficie extensa y poco accidentada, útil para probar rovers y maniobras de exploración.",
                },
            ],
        },
        zone: {
            kicker: "Luna · Mares",
            title: "Mare Tranquillitatis",
            tone: tone.moon,
            imageUrl: "https://images-assets.nasa.gov/image/as11-40-5877/as11-40-5877~medium.jpg",
            fields: [
                {
                    label: "Composición",
                    value: "Basalto con hierro y titanio",
                    detail: "Llanura formada por antiguas erupciones basálticas que rellenaron una cuenca de impacto.",
                },
                {
                    label: "Temperatura",
                    value: "De −170 a 120 °C aprox.",
                    detail: "Sin atmósfera que modere el calor, la superficie cambia de forma extrema entre el día y la noche lunar.",
                },
                {
                    label: "Relieve",
                    value: "Llanura con cráteres menores",
                    detail: "Terreno amplio y relativamente plano, elegido históricamente para aterrizajes.",
                },
            ],
        },
    },
    {
        id: "luna-barringer",
        planet: "luna",
        base: 81,
        coords: [35.028, -111.023],
        earthTags: { clima: "arido", altitud: "media", suelo: "arenoso", humedad: "baja" },
        zoneTags: { zona: "crateres", temperatura: "extrema", composicion: "regolito", relieve: "crateres" },
        earth: {
            kicker: "Tierra · Arizona, EE. UU.",
            title: "Cráter Barringer",
            tone: tone.desert,
            imageUrl: buildEarthLocationImage(35.028, -111.023),
            fields: [
                {
                    label: "Suelo",
                    value: "Roca fracturada y arena",
                    detail: "Material pulverizado por el impacto, con una capa suelta que recuerda al regolito.",
                },
                {
                    label: "Clima",
                    value: "Árido continental",
                    detail: "Poca lluvia y gran oscilación térmica entre el día y la noche.",
                },
                {
                    label: "Relieve",
                    value: "Cráter de ~1.2 km",
                    detail: "Uno de los cráteres de impacto mejor conservados del planeta y sitio de entrenamiento de astronautas.",
                },
            ],
        },
        zone: {
            kicker: "Luna · Cráteres",
            title: "Cráter de impacto joven",
            tone: tone.moon,
            imageUrl: "https://images-assets.nasa.gov/image/PIA23210/PIA23210~medium.jpg",
            fields: [
                {
                    label: "Composición",
                    value: "Regolito fino",
                    detail: "Capa de polvo y fragmentos de roca generada por millones de años de impactos.",
                },
                {
                    label: "Temperatura",
                    value: "Extrema entre día y noche",
                    detail: "Los bordes iluminados se calientan mucho mientras el fondo puede quedar en sombra.",
                },
                {
                    label: "Relieve",
                    value: "Pared, fondo y eyecta",
                    detail: "Estructura típica de un cráter simple, con material expulsado alrededor del borde.",
                },
            ],
        },
    },
    {
        id: "luna-mcmurdo",
        planet: "luna",
        base: 66,
        coords: [-77.465, 162.52],
        earthTags: { clima: "polar", altitud: "baja", suelo: "hielo", humedad: "muy-baja" },
        zoneTags: { zona: "polos", temperatura: "muy-fria", composicion: "hielo", relieve: "crateres" },
        earth: {
            kicker: "Tierra · Antártida",
            title: "Valles secos de McMurdo",
            tone: tone.ice,
            imageUrl: buildEarthLocationImage(-77.465, 162.52),
            fields: [
                {
                    label: "Suelo",
                    value: "Permafrost y roca",
                    detail: "Suelo helado casi sin nieve, con hielo enterrado bajo una capa superficial seca.",
                },
                {
                    label: "Clima",
                    value: "Polar hiperárido",
                    detail: "Es de los lugares más secos y fríos de la Tierra.",
                },
                {
                    label: "Relieve",
                    value: "Valles y paredes rocosas",
                    detail: "Valles libres de hielo que permiten estudiar procesos de congelación y sublimación.",
                },
            ],
        },
        zone: {
            kicker: "Luna · Polos",
            title: "Cráteres polares en sombra",
            tone: tone.moonPole,
            imageUrl: "https://images-assets.nasa.gov/image/PIA14021/PIA14021~medium.jpg",
            fields: [
                {
                    label: "Composición",
                    value: "Posible hielo de agua",
                    detail: "Zonas permanentemente en sombra donde podría conservarse hielo mezclado con regolito.",
                },
                {
                    label: "Temperatura",
                    value: "Menor a −200 °C en sombra",
                    detail: "Las temperaturas más bajas del Sistema Solar interior se miden en estos fondos de cráter.",
                },
                {
                    label: "Relieve",
                    value: "Cráteres profundos",
                    detail: "Paredes altas que bloquean la luz solar durante todo el año.",
                },
            ],
        },
    },
    {
        id: "marte-atacama",
        planet: "marte",
        base: 85,
        coords: [-24.5, -69.25],
        earthTags: { clima: "arido", altitud: "alta", suelo: "salino", humedad: "muy-baja" },
        zoneTags: { zona: "planicies", temperatura: "fria", composicion: "sulfatos", relieve: "plano" },
        earth: {
            kicker: "Tierra · Chile",
            title: "Desierto de Atacama",
            tone: tone.salt,
            imageUrl: buildEarthLocationImage(-24.5, -69.25),
            fields: [
                {
                    label: "Suelo",
                    value: "Sales y sulfatos",
                    detail: "Suelos con costras salinas y minerales evaporíticos, casi sin materia orgánica.",
                },
                {
                    label: "Clima",
                    value: "Hiperárido",
                    detail: "Zonas donde casi no llueve, con radiación ultravioleta alta por la altitud.",
                },
                {
                    label: "Relieve",
                    value: "Altiplano abierto",
                    detail: "Extensas llanuras a gran altura, adecuadas para pruebas de campo con rovers.",
                },
            ],
        },
        zone: {
            kicker: "Marte · Planicies",
            title: "Meridiani Planum",
            tone: tone.rust,
            imageUrl: "https://images-assets.nasa.gov/image/PIA05112/PIA05112~medium.jpg",
            fields: [
                {
                    label: "Composición",
                    value: "Hematita y sulfatos",
                    detail: "Depósitos que indican la presencia de agua líquida en el pasado.",
                },
                {
                    label: "Temperatura",
                    value: "De −90 a 0 °C aprox.",
                    detail: "Frío intenso con grandes cambios entre el día y la noche por la atmósfera delgada.",
                },
                {
                    label: "Relieve",
                    value: "Planicie abierta",
                    detail: "Terreno amplio y llano, con pequeños cráteres y campos de dunas.",
                },
            ],
        },
    },
    {
        id: "marte-riotinto",
        planet: "marte",
        base: 76,
        coords: [37.694, -6.597],
        earthTags: { clima: "templado", altitud: "baja", suelo: "ferroso", humedad: "media" },
        zoneTags: { zona: "canones", temperatura: "fria", composicion: "oxidos", relieve: "montanoso" },
        earth: {
            kicker: "Tierra · España",
            title: "Río Tinto",
            tone: tone.river,
            imageUrl: buildEarthLocationImage(37.694, -6.597),
            fields: [
                {
                    label: "Suelo",
                    value: "Óxidos y sulfuros de hierro",
                    detail: "Minerales ricos en hierro que tiñen de rojo el agua y las rocas.",
                },
                {
                    label: "Clima",
                    value: "Mediterráneo",
                    detail: "Más templado y húmedo que Marte; la similitud es mineralógica, no climática.",
                },
                {
                    label: "Relieve",
                    value: "Valle y taludes",
                    detail: "Laderas con capas de sedimentos que permiten estudiar procesos geoquímicos.",
                },
            ],
        },
        zone: {
            kicker: "Marte · Cañones",
            title: "Valles Marineris",
            tone: tone.rust,
            imageUrl: "https://images-assets.nasa.gov/image/PIA00422/PIA00422~medium.jpg",
            fields: [
                {
                    label: "Composición",
                    value: "Óxidos de hierro y minerales hidratados",
                    detail: "Las paredes del cañón exponen capas que registran la historia geológica del planeta.",
                },
                {
                    label: "Temperatura",
                    value: "De −110 a 0 °C aprox.",
                    detail: "Temperaturas bajas, algo más suaves en el fondo por la mayor presión atmosférica.",
                },
                {
                    label: "Relieve",
                    value: "Cañón de miles de km",
                    detail: "Uno de los sistemas de cañones más grandes del Sistema Solar.",
                },
            ],
        },
    },
    {
        id: "marte-mcmurdo",
        planet: "marte",
        base: 69,
        coords: [-77.465, 162.52],
        earthTags: { clima: "polar", altitud: "baja", suelo: "hielo", humedad: "muy-baja" },
        zoneTags: { zona: "polos", temperatura: "muy-fria", composicion: "hielo-agua", relieve: "plano" },
        earth: {
            kicker: "Tierra · Antártida",
            title: "Valles secos de McMurdo",
            tone: tone.ice,
            imageUrl: buildEarthLocationImage(-77.465, 162.52),
            fields: [
                {
                    label: "Suelo",
                    value: "Permafrost seco",
                    detail: "Hielo enterrado bajo suelo seco, comparable al hielo subsuperficial marciano.",
                },
                {
                    label: "Clima",
                    value: "Polar hiperárido",
                    detail: "Frío y sequedad extremos, con poca vida microbiana en superficie.",
                },
                {
                    label: "Relieve",
                    value: "Valles abiertos",
                    detail: "Terreno libre de nieve, con polígonos de hielo similares a los observados en Marte.",
                },
            ],
        },
        zone: {
            kicker: "Marte · Casquetes polares",
            title: "Planum Boreum",
            tone: tone.ice,
            imageUrl: "https://images-assets.nasa.gov/image/PIA13163/PIA13163~medium.jpg",
            fields: [
                {
                    label: "Composición",
                    value: "Hielo de agua y CO₂",
                    detail: "Capas de hielo y polvo acumuladas, con un casquete estacional de dióxido de carbono.",
                },
                {
                    label: "Temperatura",
                    value: "Cercana a −125 °C en invierno",
                    detail: "El CO₂ de la atmósfera se congela sobre el casquete durante el invierno.",
                },
                {
                    label: "Relieve",
                    value: "Meseta con espirales",
                    detail: "Altiplano de hielo con valles en espiral formados por el viento y la sublimación.",
                },
            ],
        },
    },
];
