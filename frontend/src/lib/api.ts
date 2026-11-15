import { buildEarthLocationImage } from "./data";
import type { BodyInfo, Match, SearchQuery } from "./types";

const API_URL: string = import.meta.env.PUBLIC_API_URL ?? "";

/**
 * Busca/identifica análogos terrestres calculados en el momento.
 * Si hay backend, delega el cálculo; si no, usa cálculo local dinámico (sin catálogo preestablecido).
 */
export async function searchAnalogs(query: SearchQuery): Promise<Match[]> {
    if (API_URL) {
        try {
            const res = await fetch(`${API_URL}/api/analogs/search`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(query),
            });
            if (res.ok) return (await res.json()) as Match[];
        } catch {
            /* se usa el respaldo local */
        }
    }
    return mockSearch(query);
}

const TONE: Record<string, string> = {
    basalt: "linear-gradient(160deg,#3d4a52,#1c262c)",
    desert: "linear-gradient(160deg,#b98b5a,#6e4a2c)",
    ice: "linear-gradient(160deg,#a9c7d6,#4d7384)",
    salt: "linear-gradient(160deg,#d8cdb8,#8e7f64)",
    rust: "linear-gradient(160deg,#c4502d,#5f2113)",
    moon: "linear-gradient(160deg,#c9c7c0,#6f6d68)",
    moonPole: "linear-gradient(160deg,#6f7a86,#1e262e)",
};

type ZoneProfile = {
    title: string;
    kicker: string;
    tone: string;
    imageUrl: string;
    tags: Record<string, string>;
    fields: [string, string, string][];
};
const ZONE_PROFILES: Record<string, Record<string, ZoneProfile>> = {
    luna: {
        mares: {
            title: "Mares lunares (basálticos)",
            kicker: "Luna · Mares",
            tone: "moon",
            imageUrl: "https://images-assets.nasa.gov/image/as11-40-5877/as11-40-5877~medium.jpg",
            tags: { zona: "mares", temperatura: "extrema", composicion: "basalto", relieve: "plano" },
            fields: [
                [
                    "Litología/regolito",
                    "Basaltos máficos (FeO/TiO₂), regolito fino",
                    "Llanuras volcánicas en cuencas de impacto; análogos terrestres: provincias basálticas y campos volcánicos máficos.",
                ],
                [
                    "Condiciones térmicas",
                    "≈ −173 °C a +127 °C (ciclo día/noche)",
                    "Sin atmósfera moderadora; alta amplitud térmica y radiación directa.",
                ],
                [
                    "Morfología",
                    "Planicies de baja pendiente con cráteres",
                    "Favorable a movilidad relativa; regolito abrasivo presente.",
                ],
                [
                    "Entorno planetario",
                    "Vacío, g ≈ 0.165 g, radiación",
                    "Analogía centrada en geología/geomorfología (no en gravedad, presión ni vacío).",
                ],
            ],
        },
        crateres: {
            title: "Cráteres de impacto",
            kicker: "Luna · Cráteres",
            tone: "moon",
            imageUrl: "https://images-assets.nasa.gov/image/PIA23210/PIA23210~medium.jpg",
            tags: { zona: "crateres", temperatura: "extrema", composicion: "regolito", relieve: "crateres" },
            fields: [
                [
                    "Litología/regolito",
                    "Regolito impactado, brechas y ejecta",
                    "Productos de gardenado por impactos; análogos: cráteres de impacto terrestres.",
                ],
                [
                    "Condiciones térmicas",
                    "Gradientes extremos iluminado/sombra",
                    "Microambientes fríos en sombras locales.",
                ],
                [
                    "Morfología",
                    "Rim, paredes, fondo y eyecta",
                    "Útil para navegación y muestreo estratigráfico relativo.",
                ],
                [
                    "Entorno planetario",
                    "Vacío, g ≈ 0.165 g, radiación",
                    "Procesos dominados por impactos y meteorización espacial.",
                ],
            ],
        },
        polos: {
            title: "Regiones polares en sombra",
            kicker: "Luna · Polos",
            tone: "moonPole",
            imageUrl: "https://images-assets.nasa.gov/image/PIA14021/PIA14021~medium.jpg",
            tags: { zona: "polos", temperatura: "muy-fria", composicion: "hielo", relieve: "crateres" },
            fields: [
                [
                    "Volátiles/composición",
                    "Posible H₂O y volátiles fríos en PSR",
                    "Evidencia remota en trampas frías; análogos: ambientes polares/permafrost (analogía parcial).",
                ],
                [
                    "Condiciones térmicas",
                    "< −200 °C en sombras permanentes",
                    "Relevante para preservación de volátiles e ISRU.",
                ],
                ["Morfología", "Cráteres profundos de alta latitud", "Topografía que genera sombras persistentes."],
                [
                    "Entorno planetario",
                    "Vacío, g ≈ 0.165 g, radiación",
                    "Analogía terrestre limitada por atmósfera/hidrosfera terrestre.",
                ],
            ],
        },
    },
    marte: {
        planicies: {
            title: "Planicies marcianas",
            kicker: "Marte · Planicies",
            tone: "rust",
            imageUrl: "https://images-assets.nasa.gov/image/PIA05112/PIA05112~medium.jpg",
            tags: { zona: "planicies", temperatura: "fria", composicion: "sulfatos", relieve: "plano" },
            fields: [
                [
                    "Litología/mineralogía",
                    "Sulfatos, óxidos férricos, basaltos alterados",
                    "Indicios de interacción agua-roca pasada; análogos: desiertos y evaporitas.",
                ],
                [
                    "Condiciones térmicas",
                    "≈ −90 °C a 0 °C (variable)",
                    "Atmósfera tenue (~6 mbar CO₂), gran amplitud diaria y polvo.",
                ],
                [
                    "Morfología",
                    "Planicies, cráteres, dunas",
                    "Superficies relevantes para tránsito y operaciones de campo.",
                ],
                [
                    "Entorno planetario",
                    "g ≈ 0.38 g, P baja, radiación",
                    "La analogía no replica presión, gravedad ni radiación marciana.",
                ],
            ],
        },
        canones: {
            title: "Cañones y valles",
            kicker: "Marte · Cañones",
            tone: "rust",
            imageUrl: "https://images-assets.nasa.gov/image/PIA00422/PIA00422~medium.jpg",
            tags: { zona: "canones", temperatura: "fria", composicion: "oxidos", relieve: "montanoso" },
            fields: [
                [
                    "Litología/estratigrafía",
                    "Secuencias estratificadas y minerales hidratados",
                    "Afloramientos de historia geológica/hídrica; análogos: cañones terrestres.",
                ],
                ["Condiciones térmicas", "≈ −110 °C a 0 °C, microclimas locales", "Variación con altitud/topografía."],
                [
                    "Morfología",
                    "Escarpes, taludes, redes de valles",
                    "Terreno accidentado para estudio estratigráfico y movilidad.",
                ],
                [
                    "Entorno planetario",
                    "g ≈ 0.38 g, atmósfera tenue",
                    "Analogía enfocada en relieve y procesos geomorfológicos.",
                ],
            ],
        },
        polos: {
            title: "Casquetes polares",
            kicker: "Marte · Casquetes polares",
            tone: "ice",
            imageUrl: "https://images-assets.nasa.gov/image/PIA13163/PIA13163~medium.jpg",
            tags: { zona: "polos", temperatura: "muy-fria", composicion: "hielo-agua", relieve: "plano" },
            fields: [
                [
                    "Volátiles/composición",
                    "H₂O hielo, CO₂ estacional, polvo",
                    "Estratigrafía de hielos; análogos: glaciares/casquetes terrestres.",
                ],
                [
                    "Condiciones térmicas",
                    "Hasta ~ −125 °C en invierno polar",
                    "Ciclos de condensación/sublimación de CO₂.",
                ],
                ["Morfología", "Mesetas heladas y patrones eólicos", "Dinámica estacional de superficie."],
                [
                    "Entorno planetario",
                    "g ≈ 0.38 g, atmósfera tenue",
                    "Analogía parcial por diferencias de presión/condiciones atmosféricas.",
                ],
            ],
        },
    },
};

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const r = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return 2 * r * Math.asin(Math.sqrt(a));
}
function destPoint(lat: number, lon: number, bearingDeg: number, distKm: number): [number, number] {
    const r = 6371,
        br = (bearingDeg * Math.PI) / 180,
        lat1 = (lat * Math.PI) / 180,
        lon1 = (lon * Math.PI) / 180,
        d = distKm / r;
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(br));
    const lon2 =
        lon1 + Math.atan2(Math.sin(br) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));
    return [(lat2 * 180) / Math.PI, (((lon2 * 180) / Math.PI + 540) % 360) - 180];
}
function minCompat(radiusKm: number): number {
    if (radiusKm <= 1) return 65;
    if (radiusKm <= 10) return 55;
    if (radiusKm <= 50) return 40;
    return 25;
}
function clamp(v: number, lo: number, hi: number): number {
    return Math.max(lo, Math.min(hi, v));
}

function inferEarth(lat: number, earth: Record<string, string>): Record<string, string> {
    const al = Math.abs(lat);
    return {
        clima: earth.clima ?? (al >= 66 ? "polar" : al <= 23 ? "arido" : "templado"),
        altitud: earth.altitud ?? (al > 15 ? "media" : "baja"),
        humedad:
            earth.humedad ??
            (earth.clima === "arido" || (!earth.clima && al <= 23) ? "muy-baja" : al >= 66 ? "baja" : "media"),
        suelo: earth.suelo ?? (al >= 66 ? "hielo" : al <= 23 ? "salino" : "arenoso"),
    };
}

function pickProfile(planet: string, zone: Record<string, string>): ZoneProfile {
    const profiles = ZONE_PROFILES[planet] ?? ZONE_PROFILES.marte;
    if (zone.zona && profiles[zone.zona]) return profiles[zone.zona];
    let best = Object.values(profiles)[0],
        bs = -1;
    for (const p of Object.values(profiles)) {
        const s = Object.entries(zone).filter(([k, v]) => p.tags[k] === v).length;
        if (s > bs) {
            bs = s;
            best = p;
        }
    }
    return best;
}

function score(
    earthTags: Record<string, string>,
    zoneTags: Record<string, string>,
    earthF: Record<string, string>,
    zoneF: Record<string, string>,
    dist?: number,
    radius?: number,
): number {
    const spec: boolean[] = [];
    for (const k of ["clima", "altitud", "suelo", "humedad"]) if (earthF[k]) spec.push(earthTags[k] === earthF[k]);
    for (const k of ["zona", "temperatura", "composicion", "relieve"])
        if (zoneF[k]) spec.push(zoneTags[k] === zoneF[k]);
    let base = spec.length ? 100 * (spec.filter(Boolean).length / spec.length) : 62;
    if (dist !== undefined && radius) base -= 8 * (dist / Math.max(radius, 1e-6));
    return Math.round(clamp(base, 15, 75));
}

function earthBody(
    lat: number,
    lon: number,
    tags: Record<string, string>,
    idx: number,
    fromUserKm?: number,
    distKm?: number,
    radiusKm?: number,
): BodyInfo {
    const L: Record<string, Record<string, string>> = {
        clima: { arido: "Árido (BW/BS aprox.)", polar: "Polar/frío (E aprox.)", templado: "Templado (C aprox.)" },
        altitud: {
            baja: "Baja (< 500 m s. n. m.)",
            media: "Media (500–2000 m s. n. m.)",
            alta: "Alta (> 2000 m s. n. m.)",
        },
        suelo: {
            basaltico: "Basáltico/ígneo máfico",
            arenoso: "Arenoso/clástico",
            ferroso: "Rico en óxidos de Fe",
            salino: "Salino/evaporítico",
            hielo: "Hielo y permafrost",
        },
        humedad: { "muy-baja": "Muy baja (hiperárida)", baja: "Baja (árida-semiárida)", media: "Media (subhúmeda)" },
    };
    const lab = (k: string) => L[k]?.[tags[k]] ?? tags[k] ?? "n/d";
    const toneKey = tags.clima === "polar" ? "ice" : tags.clima === "arido" ? "salt" : "basalt";
    const fields = [
        {
            label: "Georreferenciación",
            value: `${lat.toFixed(5)}°, ${lon.toFixed(5)}° (WGS84)`,
            detail: "Coordenadas geodésicas decimales del candidato generado por muestreo dentro del área (no es un sitio preestablecido).",
        },
    ];
    if (distKm !== undefined && radiusKm !== undefined)
        fields.push({
            label: "Muestreo espacial",
            value: `${distKm.toFixed(2)} km del centro · radio ${radiusKm.toFixed(0)} km`,
            detail: "Candidato calculado radialmente y evaluado contra el perfil objetivo y filtros.",
        });
    if (fromUserKm !== undefined)
        fields.push({
            label: "Accesibilidad (proxy)",
            value: `${fromUserKm.toFixed(1)} km geodésicos desde tu ubicación`,
            detail: "Estimación en modo local (sin ruta OSRM ni conteo de interferencia). En modo con backend se enriquecen ruta y huella antrópica con OpenStreetMap.",
        });
    fields.push(
        {
            label: "Clima inferido (proxy)",
            value: lab("clima"),
            detail: "Estimación heurística por latitud/filtros; no sustituye reanálisis u observaciones (p. ej. NASA POWER/MERRA-2).",
        },
        {
            label: "Altitud estimada",
            value: lab("altitud"),
            detail: "Rango aproximado; requiere validación con DEM (SRTM/ASTER) para rigor científico.",
        },
        {
            label: "Sustrato y humedad (proxy)",
            value: `${lab("suelo")} · ${lab("humedad")}`,
            detail: "Atributos cualitativos para el índice de similitud; la caracterización real requiere geología/teledetección y datos edáficos.",
        },
        {
            label: "Metodología de similitud",
            value: "Índice normalizado 0–100, acotado a ≤75%",
            detail: "Concordancia de criterios Tierra/zona con ajuste por distancia y accesibilidad. Umbrales por radio: 1 km ≥65%, 10 km ≥55%, 50 km ≥40%, ≥100 km ≥25%. Resultado orientativo.",
        },
    );
    return {
        kicker: `Tierra · Candidato calculado #${idx}`,
        title: `Candidato en ${lat.toFixed(3)}°, ${lon.toFixed(3)}°`,
        tone: TONE[toneKey],
        imageUrl: buildEarthLocationImage(lat, lon),
        fields,
    };
}

function zoneBody(p: ZoneProfile): BodyInfo {
    return {
        kicker: p.kicker,
        title: p.title,
        tone: TONE[p.tone],
        imageUrl: p.imageUrl,
        fields: p.fields.map(([label, value, detail]) => ({ label, value, detail })),
    };
}

function candidates(centerLat: number, centerLon: number, radiusKm: number, count: number): [number, number, number][] {
    const pts: [number, number, number][] = [[centerLat, centerLon, 0]];
    for (let ring = 1; ring <= 2 && pts.length < count; ring++) {
        const n = 4 * ring;
        const dist = (radiusKm * ring) / 2;
        for (let k = 0; k < n && pts.length < count; k++) {
            const [lat, lon] = destPoint(centerLat, centerLon, (360 * k) / n + ring * 17, dist * 0.98);
            const d = haversineKm(centerLat, centerLon, lat, lon);
            if (d <= radiusKm) pts.push([lat, lon, d]);
        }
    }
    while (pts.length < count) {
        const [lat, lon] = destPoint(centerLat, centerLon, (pts.length * 57) % 360, radiusKm * 0.5);
        pts.push([lat, lon, haversineKm(centerLat, centerLon, lat, lon)]);
    }
    return pts.slice(0, count);
}

function hashNum(s: string): number {
    let h = 0;
    for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
    return Math.abs(h);
}

async function mockSearch(query: SearchQuery): Promise<Match[]> {
    await new Promise(resolve => setTimeout(resolve, 400));
    const planet = query.planet === "luna" || query.planet === "marte" ? query.planet : "marte";
    const earthF = query.earth ?? {};
    const zoneF = query.zone ?? {};
    const profile = pickProfile(planet, zoneF);
    let centerLat: number, centerLon: number, radiusKm: number;
    if (query.location) {
        centerLat = query.location.lat;
        centerLon = query.location.lng;
        radiusKm = query.location.radiusKm;
    } else {
        const h = hashNum(`${planet}|${JSON.stringify(earthF)}|${JSON.stringify(zoneF)}`);
        centerLat = (h % 14000) / 100 - 70;
        centerLon = (Math.floor(h / 7) % 36000) / 100 - 180;
        radiusKm = 50;
    }
    let pts = candidates(centerLat, centerLon, radiusKm, 8);
    const zb = zoneBody(profile);
    const u = query.userLocation;
    const mapped = pts
        .map(([lat, lon, dist]) => {
            const fromUserKm = u ? haversineKm(u.lat, u.lng, lat, lon) : undefined;
            const tags = inferEarth(lat, earthF);
            let pct = score(
                tags,
                profile.tags,
                earthF,
                zoneF,
                query.location ? dist : undefined,
                query.location ? radiusKm : undefined,
            );
            if (u && fromUserKm !== undefined) {
                if (fromUserKm < 1.5) pct -= 18;
                else if (fromUserKm < 5) pct -= 4;
                pct = Math.round(clamp(pct, 15, 75));
            }
            return { lat, lon, dist, fromUserKm, tags, pct };
        })
        .filter(c => !(u && c.fromUserKm !== undefined && c.fromUserKm < 1.5));
    let results: Match[] = (
        mapped.length
            ? mapped
            : pts
                  .slice(0, 1)
                  .map(([lat, lon, dist]) => ({
                      lat,
                      lon,
                      dist,
                      fromUserKm: u ? haversineKm(u.lat, u.lng, lat, lon) : undefined,
                      tags: inferEarth(lat, earthF),
                      pct: 30,
                  }))
    )
        .slice(0, 6)
        .map((c, i) => {
            return {
                id: `calc-${planet}-${i}-${hashNum(`${c.lat},${c.lon}`) % 100000}`,
                percentage: c.pct,
                earth: earthBody(
                    c.lat,
                    c.lon,
                    c.tags,
                    i + 1,
                    c.fromUserKm,
                    query.location ? c.dist : undefined,
                    query.location ? radiusKm : undefined,
                ),
                zone: zb,
                ...(query.location ? { distanceKm: Math.round(c.dist * 100) / 100 } : {}),
                ...(c.fromUserKm !== undefined ? { fromUserKm: Math.round(c.fromUserKm * 100) / 100 } : {}),
            };
        });
    if (query.location) results = results.filter(m => m.percentage >= minCompat(radiusKm));
    if (!results.length) {
        const [lat, lon, dist] = pts[0];
        const fromUserKm = u ? haversineKm(u.lat, u.lng, lat, lon) : undefined;
        results = [
            {
                id: `calc-${planet}-best`,
                percentage: query.location ? minCompat(radiusKm) : 30,
                earth: earthBody(
                    lat,
                    lon,
                    inferEarth(lat, earthF),
                    1,
                    fromUserKm,
                    query.location ? dist : undefined,
                    query.location ? radiusKm : undefined,
                ),
                zone: zb,
                ...(query.location ? { distanceKm: Math.round(dist * 100) / 100 } : {}),
                ...(fromUserKm !== undefined ? { fromUserKm: Math.round(fromUserKm * 100) / 100 } : {}),
            },
        ];
    }
    return results.sort((a, b) => b.percentage - a.percentage);
}
