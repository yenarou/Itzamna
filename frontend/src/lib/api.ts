import type { BodyInfo, InfoField, Match, SearchQuery } from "./types";

const API_URL: string = import.meta.env.PUBLIC_API_URL ?? "";
const API_SAT = "API saturada o sin respuesta; se usó valor calculado/local";

// Imagen satelital centrada en la coordenada (Esri World Imagery export; sin API key)
function buildEarthLocationImage(lat: number, lng: number): string {
    const d = 0.01;
    const minLon = lng - d,
        maxLon = lng + d,
        minLat = lat - d,
        maxLat = lat + d;
    return `https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/export?bbox=${minLon.toFixed(6)},${minLat.toFixed(6)},${maxLon.toFixed(6)},${maxLat.toFixed(6)}&bboxSR=4326&imageSR=4326&size=640,360&format=jpg&f=image`;
}

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
            /* respaldo local */
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
            imageUrl: "https://images-assets.nasa.gov/image/as11-40-5877/as11-40-5877~orig.jpg",
            tags: { zona: "mares", temperatura: "extrema", composicion: "basalto", relieve: "plano" },
            fields: [
                [
                    "Litología/regolito",
                    "Basaltos máficos (FeO/TiO₂), regolito fino",
                    "Llanuras volcánicas en cuencas de impacto; análogos: provincias basálticas.",
                ],
                ["Condiciones térmicas", "≈ −173 °C a +127 °C", "Sin atmósfera; alta amplitud térmica y radiación."],
                [
                    "Morfología",
                    "Planicies de baja pendiente con cráteres",
                    "Favorable a movilidad relativa; regolito abrasivo.",
                ],
                ["Entorno planetario", "Vacío, g ≈ 0.165 g, radiación", "Analogía geológica/geomorfológica."],
            ],
        },
        crateres: {
            title: "Cráteres de impacto",
            kicker: "Luna · Cráteres",
            tone: "moon",
            imageUrl: "https://images-assets.nasa.gov/image/PIA23210/PIA23210~orig.jpg",
            tags: { zona: "crateres", temperatura: "extrema", composicion: "regolito", relieve: "crateres" },
            fields: [
                [
                    "Litología/regolito",
                    "Regolito impactado, brechas y ejecta",
                    "Análogos: cráteres de impacto terrestres.",
                ],
                [
                    "Condiciones térmicas",
                    "Gradientes extremos iluminado/sombra",
                    "Microambientes fríos en sombras locales.",
                ],
                ["Morfología", "Rim, paredes, fondo y eyecta", "Útil para navegación y muestreo."],
                ["Entorno planetario", "Vacío, g ≈ 0.165 g, radiación", "Meteorización espacial."],
            ],
        },
        polos: {
            title: "Regiones polares en sombra",
            kicker: "Luna · Polos",
            tone: "moonPole",
            imageUrl: "https://images-assets.nasa.gov/image/PIA14021/PIA14021~orig.jpg",
            tags: { zona: "polos", temperatura: "muy-fria", composicion: "hielo", relieve: "crateres" },
            fields: [
                [
                    "Volátiles/composición",
                    "Posible H₂O y volátiles fríos en PSR",
                    "Análogos: ambientes polares/permafrost (parcial).",
                ],
                ["Condiciones térmicas", "< −200 °C en sombras permanentes", "Relevante para ISRU."],
                ["Morfología", "Cráteres profundos de alta latitud", "Sombras persistentes."],
                ["Entorno planetario", "Vacío, g ≈ 0.165 g, radiación", "Analogía terrestre limitada."],
            ],
        },
    },
    marte: {
        planicies: {
            title: "Planicies marcianas",
            kicker: "Marte · Planicies",
            tone: "rust",
            imageUrl: "https://images-assets.nasa.gov/image/PIA05112/PIA05112~orig.jpg",
            tags: { zona: "planicies", temperatura: "fria", composicion: "sulfatos", relieve: "plano" },
            fields: [
                [
                    "Litología/mineralogía",
                    "Sulfatos, óxidos férricos, basaltos alterados",
                    "Análogos: desiertos y evaporitas.",
                ],
                ["Condiciones térmicas", "≈ −90 °C a 0 °C", "Atmósfera tenue, gran amplitud diaria."],
                ["Morfología", "Planicies, cráteres, dunas", "Tránsito y operaciones de campo."],
                ["Entorno planetario", "g ≈ 0.38 g, P baja, radiación", "No replica presión/gravedad/radiación."],
            ],
        },
        canones: {
            title: "Cañones y valles",
            kicker: "Marte · Cañones",
            tone: "rust",
            imageUrl: "https://images-assets.nasa.gov/image/PIA00422/PIA00422~orig.jpg",
            tags: { zona: "canones", temperatura: "fria", composicion: "oxidos", relieve: "montanoso" },
            fields: [
                [
                    "Litología/estratigrafía",
                    "Secuencias estratificadas y minerales hidratados",
                    "Análogos: cañones terrestres.",
                ],
                ["Condiciones térmicas", "≈ −110 °C a 0 °C", "Microclimas locales."],
                ["Morfología", "Escarpes, taludes, redes de valles", "Terreno accidentado."],
                ["Entorno planetario", "g ≈ 0.38 g, atmósfera tenue", "Enfoque geomorfológico."],
            ],
        },
        polos: {
            title: "Casquetes polares",
            kicker: "Marte · Casquetes polares",
            tone: "ice",
            imageUrl: "https://images-assets.nasa.gov/image/PIA13163/PIA13163~orig.jpg",
            tags: { zona: "polos", temperatura: "muy-fria", composicion: "hielo-agua", relieve: "plano" },
            fields: [
                [
                    "Volátiles/composición",
                    "H₂O hielo, CO₂ estacional, polvo",
                    "Análogos: glaciares/casquetes terrestres.",
                ],
                ["Condiciones térmicas", "Hasta ~ −125 °C", "Condensación/sublimación de CO₂."],
                ["Morfología", "Mesetas heladas y patrones eólicos", "Dinámica estacional."],
                ["Entorno planetario", "g ≈ 0.38 g, atmósfera tenue", "Analogía parcial."],
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
function destPoint(lat: number, lon: number, bearing: number, distKm: number): [number, number] {
    const r = 6371,
        br = (bearing * Math.PI) / 180,
        lat1 = (lat * Math.PI) / 180,
        lon1 = (lon * Math.PI) / 180,
        d = distKm / r;
    const lat2 = Math.asin(Math.sin(lat1) * Math.cos(d) + Math.cos(lat1) * Math.sin(d) * Math.cos(br));
    const lon2 =
        lon1 + Math.atan2(Math.sin(br) * Math.sin(d) * Math.cos(lat1), Math.cos(d) - Math.sin(lat1) * Math.sin(lat2));
    return [(lat2 * 180) / Math.PI, (((lon2 * 180) / Math.PI + 540) % 360) - 180];
}
function clamp(v: number, lo: number, hi: number) {
    return Math.max(lo, Math.min(hi, v));
}

async function fetchJson(url: string, timeoutMs = 5000): Promise<any | null> {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json" } });
        if (!res.ok) return null;
        return await res.json();
    } catch {
        return null;
    } finally {
        clearTimeout(t);
    }
}

export async function resolveCandidateMetadata({
    lat,
    lon,
    earth,
    fetchers,
}: {
    lat: number;
    lon: number;
    earth: Record<string, string>;
    fetchers?: {
        reverseGeocode?: typeof reverseGeocode;
        overpassInterference?: typeof overpassInterference;
        nasaPower?: typeof nasaPower;
        openTopo?: typeof openTopo;
        soilGrids?: typeof soilGrids;
    };
}): Promise<{
    place: string | null;
    placeOk: boolean;
    interf: string;
    isolated: boolean;
    interfCount: number;
    overOk: boolean;
    power: Record<string, number> | null;
    powerOk: boolean;
    elev: number | null;
    elevOk: boolean;
    soil: Record<string, number> | null;
    soilOk: boolean;
}> {
    const resolved = {
        reverseGeocode: fetchers?.reverseGeocode ?? reverseGeocode,
        overpassInterference: fetchers?.overpassInterference ?? overpassInterference,
        nasaPower: fetchers?.nasaPower ?? nasaPower,
        openTopo: fetchers?.openTopo ?? openTopo,
        soilGrids: fetchers?.soilGrids ?? soilGrids,
    };

    const [placeResult, interferenceResult, powerResult, elevationResult, soilResult] = await Promise.allSettled([
        resolved.reverseGeocode(lat, lon),
        resolved.overpassInterference(lat, lon),
        resolved.nasaPower(lat, lon),
        resolved.openTopo(lat, lon),
        resolved.soilGrids(lat, lon),
    ]);

    const [place, placeOk] = placeResult.status === "fulfilled" ? placeResult.value : [null, false];
    const [interf, isolated, interfCount, overOk] =
        interferenceResult.status === "fulfilled" ? interferenceResult.value : ["baja", true, 0, false];

    let [power, powerOk] = powerResult.status === "fulfilled" ? powerResult.value : [null, false];
    if (!powerOk) power = localClimate(lat, lon, earth) as any;

    let [elev, elevOk] = elevationResult.status === "fulfilled" ? elevationResult.value : [null, false];
    if (!elevOk) elev = localElevation(lat, lon, earth);

    let [soil, soilOk] = soilResult.status === "fulfilled" ? soilResult.value : [null, false];
    if (!soilOk) soil = localSoil(lat, lon, power, earth) as any;

    return {
        place,
        placeOk,
        interf,
        isolated,
        interfCount,
        overOk,
        power,
        powerOk,
        elev,
        elevOk,
        soil,
        soilOk,
    };
}

function srcNote(ok: boolean, src: string) {
    return ok ? `Fuente: ${src}.` : `${API_SAT} (fuente prevista: ${src}).`;
}

async function reverseGeocode(lat: number, lon: number): Promise<[string | null, boolean]> {
    const q = new URLSearchParams({
        format: "jsonv2",
        lat: String(lat),
        lon: String(lon),
        zoom: "10",
        addressdetails: "1",
    });
    const data = await fetchJson(`https://nominatim.openstreetmap.org/reverse?${q}`, 4500);
    if (!data) return [null, false];
    const addr = data.address || {};
    for (const k of [
        "natural",
        "peak",
        "volcano",
        "desert",
        "valley",
        "water",
        "village",
        "hamlet",
        "town",
        "city",
        "municipality",
        "county",
        "state",
        "region",
    ]) {
        if (addr[k]) {
            const name = String(addr[k]);
            const st = addr.state || addr.region;
            return [st && st !== name ? `${name}, ${st}` : name, true];
        }
    }
    const name =
        data.name ||
        String(data.display_name || "")
            .split(",")[0]
            .trim() ||
        null;
    return [name, true];
}
async function osrmRoute(
    ulat: number,
    ulon: number,
    lat: number,
    lon: number,
): Promise<[number | null, number | null, boolean]> {
    const data = await fetchJson(
        `https://router.project-osrm.org/route/v1/driving/${ulon},${ulat};${lon},${lat}?overview=false&alternatives=false`,
        4500,
    );
    try {
        const r = data.routes[0];
        return [r.distance / 1000, r.duration / 60, true];
    } catch {
        return [null, null, false];
    }
}
async function overpassInterference(lat: number, lon: number): Promise<[string, boolean, number, boolean]> {
    const radius = 1200;
    const query = `[out:json][timeout:6];(way["building"](around:${radius},${lat},${lon});way["highway"](around:${radius},${lat},${lon});node["place"](around:${radius},${lat},${lon}););out count;`;
    const data = await fetchJson(`https://overpass-api.de/api/interpreter?data=${encodeURIComponent(query)}`, 6500);
    if (!data) return ["baja", true, 0, false];
    let count = 0;
    try {
        const els = data.elements || [];
        if (els[0]?.tags) {
            const tags = els[0].tags || {};
            count = Number(tags.total || tags.ways || tags.nodes || 0);
            if (!count) count = Number(tags.ways || 0) + Number(tags.nodes || 0);
        } else count = els.length || 0;
    } catch {
        count = 0;
    }
    if (count <= 0) return ["baja", true, 0, true];
    if (count <= 5) return ["baja", true, count, true];
    if (count <= 40) return ["media", false, count, true];
    return ["alta", false, count, true];
}
async function nasaPower(lat: number, lon: number): Promise<[Record<string, number> | null, boolean]> {
    const p = new URLSearchParams({
        parameters: "T2M,T2M_MIN,T2M_MAX,PRECTOTCORR,RH2M,WS2M,ALLSKY_SFC_SW_DWN",
        community: "RE",
        longitude: String(lon),
        latitude: String(lat),
        format: "JSON",
    });
    const data = await fetchJson(`https://power.larc.nasa.gov/api/temporal/climatology/point?${p}`, 7000);
    try {
        const par = data.properties.parameter;
        const ann = (k: string) => {
            const v = par?.[k]?.ANN;
            return v == null ? null : Number(v);
        };
        const keys = ["T2M", "T2M_MIN", "T2M_MAX", "PRECTOTCORR", "RH2M", "WS2M", "ALLSKY_SFC_SW_DWN"];
        const out: any = {};
        let ok = false;
        for (const k of keys) {
            const v = ann(k);
            if (v != null) {
                out[k] = v;
                ok = true;
            }
        }
        return [ok ? out : null, ok];
    } catch {
        return [null, false];
    }
}
async function openTopo(lat: number, lon: number): Promise<[number | null, boolean]> {
    for (const ds of ["srtm90m", "aster30m"]) {
        const data = await fetchJson(`https://api.opentopodata.org/v1/${ds}?locations=${lat},${lon}`, 5500);
        const e = data?.results?.[0]?.elevation;
        if (e != null) return [Number(e), true];
    }
    return [null, false];
}
async function soilGrids(lat: number, lon: number): Promise<[Record<string, number> | null, boolean]> {
    const props = ["clay", "sand", "silt", "soc", "bdod", "phh2o"];
    const depths = ["0-5cm", "5-15cm"];
    const q = new URLSearchParams();
    props.forEach(p => q.append("property", p));
    depths.forEach(d => q.append("depth", d));
    q.set("value", "mean");
    q.set("lat", String(lat));
    q.set("lon", String(lon));
    const data = await fetchJson(`https://rest.isric.org/soilgrids/v2.0/properties/query?${q}`, 7000);
    try {
        const out: any = {};
        for (const layer of data.properties.layers || []) {
            const vals: number[] = [];
            for (const d of layer.depths || []) {
                const m = d.values?.mean;
                if (m != null) vals.push(Number(m));
            }
            if (vals.length) out[layer.name] = vals.reduce((a, b) => a + b, 0) / vals.length;
        }
        const conv = (n: string, v: number) =>
            n === "clay" || n === "sand" || n === "silt"
                ? v / 10
                : n === "soc"
                  ? v / 10
                  : n === "bdod"
                    ? v / 100
                    : n === "phh2o"
                      ? v / 10
                      : v;
        const res: any = {};
        for (const k of Object.keys(out)) res[k] = conv(k, out[k]);
        const ok = Object.keys(res).length > 0;
        return [ok ? res : null, ok];
    } catch {
        return [null, false];
    }
}

function hashSeed(s: string): number {
    let h = 2166136261;
    for (let i = 0; i < s.length; i++) {
        h ^= s.charCodeAt(i);
        h = Math.imul(h, 16777619);
    }
    return h >>> 0;
}
function localClimate(lat: number, lon: number, earth: Record<string, string>) {
    const al = Math.abs(lat);
    let clima = al >= 66 ? "polar" : al <= 23 ? "arido" : "templado";
    let t2m = 15,
        tmin = 4,
        tmax = 27,
        prec = 2.0,
        rh = 60;
    if (clima === "polar") {
        t2m = -12;
        tmin = -30;
        tmax = 5;
        prec = 0.7;
        rh = 70;
    } else if (clima === "arido") {
        t2m = 24;
        tmin = 10;
        tmax = 38;
        prec = 0.4;
        rh = 35;
    }
    if (earth.clima) {
        clima = earth.clima;
        if (clima === "arido") {
            t2m = 25;
            tmin = 12;
            tmax = 39;
            prec = 0.3;
            rh = 30;
        } else if (clima === "polar") {
            t2m = -10;
            tmin = -28;
            tmax = 6;
            prec = 0.8;
            rh = 72;
        } else {
            t2m = 16;
            tmin = 5;
            tmax = 28;
            prec = 2.2;
            rh = 58;
        }
    }
    const h = hashSeed(`clim:${lat.toFixed(4)},${lon.toFixed(4)}`);
    t2m += ((h % 41) - 20) / 10;
    tmin += (((h >>> 6) % 41) - 20) / 10;
    tmax += (((h >>> 12) % 41) - 20) / 10;
    prec = Math.max(0.05, prec + (((h >>> 18) % 31) - 15) / 100);
    rh = Math.min(98, Math.max(10, rh + (((h >>> 23) % 21) - 10)));
    return {
        T2M: t2m,
        T2M_MIN: tmin,
        T2M_MAX: tmax,
        PRECTOTCORR: prec,
        RH2M: rh,
        WS2M: 3.5,
        ALLSKY_SFC_SW_DWN: 4.5,
        _clima: clima,
    };
}
function localElevation(lat: number, lon: number, earth: Record<string, string>) {
    let base = Math.abs(lat) > 15 ? 1400 : 300;
    if (earth.altitud === "baja") base = 200;
    else if (earth.altitud === "media") base = 1200;
    else if (earth.altitud === "alta") base = 2800;
    const h = hashSeed(`elev:${lat.toFixed(4)},${lon.toFixed(4)}`) % 500;
    return base + h - 250;
}
function localSoil(lat: number, lon: number, power: any, earth: Record<string, string>) {
    let s = earth.suelo;
    if (!s) {
        s = power.T2M < 0 ? "hielo" : power.PRECTOTCORR * 365 < 350 ? "salino" : "arenoso";
    }
    const h = hashSeed(`soil:${lat.toFixed(4)},${lon.toFixed(4)}`);
    const v = (base: number, span: number, sh: number) => {
        const x = ((h >>> sh) % (span * 2 + 1)) - span;
        return Math.round((base + x) * 100) / 100;
    };
    if (s === "arenoso")
        return {
            clay: v(8, 4, 0),
            sand: v(72, 6, 3),
            silt: v(20, 5, 6),
            soc: v(6, 3, 9),
            bdod: v(1.45, 0, 12),
            phh2o: v(7.2, 0, 15),
            _tipo: "Arenoso (estimado)",
        };
    if (s === "salino")
        return {
            clay: v(18, 5, 0),
            sand: v(40, 6, 3),
            silt: v(42, 6, 6),
            soc: v(3, 2, 9),
            bdod: v(1.35, 0, 12),
            phh2o: v(8.1, 0, 15),
            _tipo: "Salino/evaporítico (estimado)",
        };
    if (s === "hielo")
        return {
            clay: v(10, 4, 0),
            sand: v(35, 6, 3),
            silt: v(55, 6, 6),
            soc: v(12, 4, 9),
            bdod: v(0.9, 0, 12),
            phh2o: v(6.2, 0, 15),
            _tipo: "Criósuelo/permafrost (estimado)",
        };
    if (s === "basaltico")
        return {
            clay: v(22, 5, 0),
            sand: v(38, 6, 3),
            silt: v(40, 6, 6),
            soc: v(9, 3, 9),
            bdod: v(1.25, 0, 12),
            phh2o: v(6.8, 0, 15),
            _tipo: "Derivado basáltico (estimado)",
        };
    return {
        clay: v(20, 5, 0),
        sand: v(45, 6, 3),
        silt: v(35, 6, 6),
        soc: v(8, 3, 9),
        bdod: v(1.3, 0, 12),
        phh2o: v(7.0, 0, 15),
        _tipo: "Férrico/mixto (estimado)",
    };
}
function aridity(precDay: number | undefined, t2m: number | undefined) {
    if (precDay == null || t2m == null) return null;
    return (precDay * 365) / (t2m + 10);
}

function pickZoneProfile(planet: string, zone: Record<string, string>): ZoneProfile {
    const profiles = ZONE_PROFILES[planet] || ZONE_PROFILES.marte;
    const wanted = zone.zona;
    if (wanted && profiles[wanted]) return profiles[wanted];
    let best: ZoneProfile | null = null,
        bestScore = -1;
    for (const p of Object.values(profiles)) {
        const s = Object.entries(zone).filter(([k, v]) => p.tags[k] === v).length;
        if (s > bestScore) {
            bestScore = s;
            best = p;
        }
    }
    return best || Object.values(profiles)[0];
}
function generateCandidates(lat: number, lon: number, radiusKm: number, count: number): [number, number, number][] {
    const pts: [number, number, number][] = [[lat, lon, 0]];
    const rings = 2;
    for (let ring = 1; ring <= rings; ring++) {
        const n = Math.max(3, Math.floor(((count - 1) * ring) / ((rings * (rings + 1)) / 2)));
        const dist = (radiusKm * ring) / rings;
        for (let k = 0; k < n; k++) {
            if (pts.length >= count) break;
            const b = (360 * k) / n + ring * 17;
            const [la, lo] = destPoint(lat, lon, b, dist * 0.98);
            const d = haversineKm(lat, lon, la, lo);
            if (d <= radiusKm) pts.push([la, lo, d]);
        }
    }
    while (pts.length < count) {
        const b = (pts.length * 57) % 360;
        const [la, lo] = destPoint(lat, lon, b, radiusKm * 0.5);
        pts.push([la, lo, haversineKm(lat, lon, la, lo)]);
    }
    return pts.slice(0, count);
}
function scoreComponents(
    profile: ZoneProfile,
    zone: Record<string, string>,
    earth: Record<string, string>,
    dist: number | null,
    radius: number | null,
    fromUser: number | null,
    routeKm: number | null,
    interference: string | null,
    power: any,
    elev: number | null,
    soil: any,
    lat: number,
    lon: number,
) {
    const comps: any = {};
    const hv = hashSeed(`sc:${lat.toFixed(5)},${lon.toFixed(5)}`);
    const jitter = ((hv % 13) - 6) * 0.35;
    const zkeys = ["zona", "temperatura", "composicion", "relieve"].filter(k => zone[k]);
    if (zkeys.length)
        comps.zona_objetivo = (100 * zkeys.filter(k => profile.tags[k] === zone[k]).length) / zkeys.length;
    else comps.zona_objetivo = clamp(68 + ((hv >>> 4) % 17), 55, 90);

    if (power?.T2M != null) {
        const t = Number(power.T2M),
            p = (Number(power.PRECTOTCORR) || 0) * 365,
            rh = Number(power.RH2M) || 50;
        if (earth.clima) {
            const w = earth.clima;
            const ok =
                (w === "arido" && p < 400) ||
                (w === "polar" && t < 2) ||
                (w === "templado" && t >= 2 && t <= 22 && p >= 300);
            let base = ok ? 92 : 38;
            if (w === "arido") base += clamp((400 - p) / 80, -10, 6);
            else if (w === "polar") base += clamp((2 - t) / 3, -10, 6);
            else base += clamp(6 - Math.abs(t - 12) / 3, -10, 6);
            comps.clima = clamp(base, 20, 98);
        } else {
            const aridFit = clamp(100 - Math.abs(p - 250) / 10, 25, 95);
            const tempFit = clamp(100 - Math.abs(t - 18) * 2, 20, 95);
            const rhFit = clamp(100 - Math.abs(rh - 35) * 1.2, 20, 95);
            comps.clima = clamp(aridFit * 0.45 + tempFit * 0.35 + rhFit * 0.2, 25, 98);
        }
    } else comps.clima = 40;

    if (elev != null) {
        const e = Number(elev);
        if (earth.altitud) {
            const w = earth.altitud;
            const ok =
                (w === "baja" && e < 500) || (w === "media" && e >= 500 && e < 2000) || (w === "alta" && e >= 2000);
            comps.altitud_dem = clamp((ok ? 95 : 32) + clamp((1000 - Math.abs((e % 1000) - 500)) / 120, -8, 4), 20, 99);
        } else comps.altitud_dem = clamp(55 + Math.min(e, 3500) / 80, 30, 98);
    } else comps.altitud_dem = 35;

    if (soil || power?.RH2M != null) {
        if (soil && earth.suelo) {
            const sand = Number(soil.sand ?? 40),
                w = earth.suelo;
            const ok =
                (w === "arenoso" && sand >= 50) ||
                (w === "salino" && (Number(power?.PRECTOTCORR) || 0) * 365 < 350) ||
                (w === "hielo" && (Number(power?.T2M) ?? 10) < 0) ||
                (w === "basaltico" && sand >= 30 && sand <= 55);
            comps.sustrato_humedad = clamp((ok ? 90 : 45) + (sand - 45) / 10, 20, 98);
        } else {
            const sand = Number(soil?.sand ?? 40),
                soc = Number(soil?.soc ?? 8),
                ph = Number(soil?.phh2o ?? 7),
                rh = Number(power?.RH2M ?? 50);
            comps.sustrato_humedad = clamp(
                35 +
                    sand * 0.35 +
                    soc * 1.2 +
                    Math.max(0, 10 - Math.abs(ph - 7)) * 1.5 +
                    (50 - Math.abs(rh - 40)) * 0.25,
                25,
                97,
            );
        }
    } else comps.sustrato_humedad = 35;

    comps.espacial = dist != null && radius ? clamp(100 * (1 - 0.5 * (dist / Math.max(radius, 1e-6))), 20, 100) : 80;
    let acc = 60;
    if (fromUser != null) {
        if (fromUser < 1.5) acc = 25;
        else if (routeKm != null) acc = clamp(90 - Math.max(0, routeKm - 20) / 8, 35, 92);
        else acc = clamp(75 - Math.max(0, fromUser - 5) / 10, 30, 78);
    }
    comps.accesibilidad = acc;
    comps.interferencia_osm =
        interference === "baja" ? 95 : interference === "media" ? 60 : interference === "alta" ? 25 : 70;
    const weights: any = {
        zona_objetivo: 0.25,
        clima: 0.2,
        altitud_dem: 0.15,
        sustrato_humedad: 0.15,
        espacial: 0.1,
        accesibilidad: 0.08,
        interferencia_osm: 0.07,
    };
    const total = Object.keys(weights).reduce((s, k) => s + (comps[k] ?? 50) * weights[k], 0) + jitter;
    const rounded: any = {};
    for (const k of Object.keys(comps)) rounded[k] = Math.round(clamp(comps[k], 0, 100) * 10) / 10;
    return [Math.round(clamp(total, 5, 99) * 100) / 100, rounded] as [number, any];
}

function earthBody(
    lat: number,
    lon: number,
    idx: number,
    place: string | null,
    placeOk: boolean,
    fromUser: number | null,
    routeKm: number | null,
    routeMin: number | null,
    routeOk: boolean,
    interf: string,
    isolated: boolean,
    interfCount: number,
    overOk: boolean,
    radius: number | null,
    dist: number | null,
    power: any,
    powerOk: boolean,
    elev: number | null,
    elevOk: boolean,
    soil: any,
    soilOk: boolean,
    comps: any,
): BodyInfo {
    const toneKey = (elev != null && elev > 3500) || (power?.T2M != null && power.T2M < 0) ? "ice" : "basalt";
    const fields: InfoField[] = [];
    fields.push({
        label: "Toponimia (OpenStreetMap)",
        value: place || `Coordenada ${lat.toFixed(4)}, ${lon.toFixed(4)} (sin toponimia)`,
        detail: `Geocodificación inversa Nominatim (OpenStreetMap). ${srcNote(placeOk, "https://nominatim.openstreetmap.org")}`,
        correlation: placeOk && place ? 95 : 50,
    });
    fields.push({
        label: "Georreferenciación",
        value: `${lat.toFixed(5)}°, ${lon.toFixed(5)}° (WGS84)`,
        detail: "Candidato generado por muestreo dentro del área (no sitio preestablecido).",
        correlation: 100,
    });
    if (radius != null && dist != null)
        fields.push({
            label: "Muestreo espacial",
            value: `${dist.toFixed(2)} km del centro · radio ${radius.toFixed(0)} km`,
            detail: "Candidato calculado radialmente respecto al perfil objetivo y filtros.",
            correlation: Math.round(comps.espacial ?? 70),
        });
    if (fromUser != null) {
        const ruta =
            routeKm != null && routeMin != null
                ? `${routeKm.toFixed(1)} km, ~${routeMin.toFixed(0)} min en vehículo (OSRM/OpenStreetMap)`
                : "sin ruta vehicular (distancia geodésica)";
        const rd =
            routeKm != null
                ? `Ruta estimada con OSRM (OpenStreetMap). ${srcNote(routeOk, "https://router.project-osrm.org")}`
                : `No se obtuvo ruta OSRM; ${API_SAT.toLowerCase()} (distancia geodésica calculada localmente).`;
        fields.push({
            label: "Accesibilidad (OpenStreetMap/OSRM)",
            value: `${fromUser.toFixed(1)} km geodésicos · ${ruta}`,
            detail: rd,
            correlation: Math.round(comps.accesibilidad ?? 60),
        });
    }
    fields.push({
        label: "Interferencia humana (OpenStreetMap/Overpass)",
        value: `${interf[0].toUpperCase() + interf.slice(1)} · ${isolated ? "aislada" : "no plenamente aislada"} · n≈${interfCount} elementos mapeados (conteo OSM, radio 1.2 km)`,
        detail: `Proxy de antropización desde infraestructura mapeada en OpenStreetMap vía Overpass. ${srcNote(overOk, "https://overpass-api.de")}`,
        correlation: Math.round(comps.interferencia_osm ?? 60),
    });
    const ai = aridity(power?.PRECTOTCORR, power?.T2M);
    const pYear = power?.PRECTOTCORR != null ? power.PRECTOTCORR * 365 : null;
    const pParts: string[] = [];
    if (power?.T2M != null) pParts.push(`T2M ${Number(power.T2M).toFixed(2)} °C`);
    if (power?.T2M_MIN != null && power?.T2M_MAX != null)
        pParts.push(`rango ${Number(power.T2M_MIN).toFixed(2)} a ${Number(power.T2M_MAX).toFixed(2)} °C`);
    if (pYear != null)
        pParts.push(`precip. ${pYear.toFixed(1)} mm/año (${Number(power.PRECTOTCORR).toFixed(3)} mm/día)`);
    if (power?.RH2M != null) pParts.push(`HR2M ${Number(power.RH2M).toFixed(1)} %`);
    if (power?.WS2M != null) pParts.push(`viento a 2 m ${Number(power.WS2M).toFixed(2)} m/s`);
    if (power?.ALLSKY_SFC_SW_DWN != null)
        pParts.push(`radiación solar ${Number(power.ALLSKY_SFC_SW_DWN).toFixed(2)} kWh/m²/día`);
    if (ai != null) pParts.push(`índice de aridez (adimensional, aprox. De Martonne) P/(T+10) = ${ai.toFixed(2)}`);
    fields.push({
        label: "Clima (NASA POWER)",
        value: pParts.join("; ") || "sin datos",
        detail: `Climatología puntual (NASA POWER, MERRA-2/GEWEX). Unidades: °C, mm/año, mm/día, %, m/s, kWh/m²/día. Parámetros: T2M, T2M_MIN, T2M_MAX, PRECTOTCORR, RH2M, WS2M, ALLSKY_SFC_SW_DWN. ${srcNote(powerOk, "https://power.larc.nasa.gov/")}`,
        correlation: Math.round(comps.clima ?? 60),
    });
    fields.push({
        label: "Elevación (DEM)",
        value: elev != null ? `${Number(elev).toFixed(1)} m s. n. m.` : "sin datos",
        detail: `Elevación del terreno (m s. n. m.) desde DEM (OpenTopData, SRTM 90 m / ASTER 30 m). ${srcNote(elevOk, "https://www.opentopodata.org")}`,
        correlation: Math.round(comps.altitud_dem ?? 60),
    });
    const sub: string[] = [];
    if (soil) {
        if (soil.clay != null) sub.push(`arcilla ${Number(soil.clay).toFixed(1)} %`);
        if (soil.sand != null) sub.push(`arena ${Number(soil.sand).toFixed(1)} %`);
        if (soil.silt != null) sub.push(`limo ${Number(soil.silt).toFixed(1)} %`);
        if (soil.soc != null) sub.push(`C orgánico ${Number(soil.soc).toFixed(1)} g/kg`);
        if (soil.bdod != null) sub.push(`densidad aparente ${Number(soil.bdod).toFixed(2)} kg/dm³`);
        if (soil.phh2o != null) sub.push(`pH(H₂O) ${Number(soil.phh2o).toFixed(2)}`);
        if (soil._tipo) sub.push(String(soil._tipo));
    }
    fields.push({
        label: "Sustrato edáfico (SoilGrids, cuantitativo)",
        value: sub.join("; ") || "sin datos",
        detail: `Propiedades medias 0–15 cm (ISRIC SoilGrids v2.0) en unidades físicas (%, g/kg, kg/dm³, pH). ${srcNote(soilOk, "https://rest.isric.org/soilgrids/v2.0/")}`,
        correlation: Math.round(comps.sustrato_humedad ?? 50),
    });
    const hum: string[] = [];
    if (power?.RH2M != null) hum.push(`HR media anual ${Number(power.RH2M).toFixed(1)} %`);
    if (pYear != null) hum.push(`precipitación ${pYear.toFixed(1)} mm/año`);
    if (ai != null) hum.push(`índice de aridez (adimensional, aprox. De Martonne) P/(T+10) = ${ai.toFixed(2)}`);
    fields.push({
        label: "Humedad y disponibilidad hídrica (cuantitativa)",
        value: hum.join("; ") || "sin datos",
        detail: `Humedad relativa (%), precipitación (mm/año) e índice de aridez (adimensional, fórmula P/(T+10)). ${srcNote(powerOk, "https://power.larc.nasa.gov/")} (índice calculado localmente a partir de esos datos).`,
        correlation: Math.round(comps.sustrato_humedad ?? 50),
    });
    const compStr = Object.entries(comps)
        .map(([k, v]) => `${k}=${Math.round(Number(v))} %`)
        .join("; ");
    fields.push({
        label: "Metodología de similitud (por componentes)",
        value: `Componentes (%): ${compStr}`,
        detail: "Promedio ponderado de componentes medidos/consultados o calculados localmente cuando una API no responde. Resultado directo sin normalización a un índice acotado. Fórmulas/variables relevantes: P/(T+10), T2M, PRECTOTCORR, RH2M.",
        correlation: undefined as any,
    });
    return {
        kicker: `Tierra · Candidato calculado #${idx}`,
        title: place || `Candidato en ${lat.toFixed(3)}°, ${lon.toFixed(3)}°`,
        tone: TONE[toneKey],
        imageUrl: buildEarthLocationImage(lat, lon),
        fields,
    } as BodyInfo;
}
function zoneBody(profile: ZoneProfile, zone: Record<string, string>): BodyInfo {
    const keys = ["composicion", "temperatura", "relieve", "zona"];
    const vals = keys.map(k => (zone[k] ? (profile.tags[k] === zone[k] ? 92 : 35) : k === "temperatura" ? 80 : 78));
    const corrs = [vals[0], vals[1], Math.round((vals[2] + vals[3]) / 2), 74];
    return {
        kicker: profile.kicker,
        title: profile.title,
        tone: TONE[profile.tone],
        imageUrl: profile.imageUrl,
        fields: profile.fields.map((f, i) => ({ label: f[0], value: f[1], detail: f[2], correlation: corrs[i] })),
    } as BodyInfo;
}

async function buildOne(
    planet: string,
    idx: number,
    lat: number,
    lon: number,
    dist: number,
    radiusKm: number,
    hasLoc: boolean,
    userLoc: any,
    preferAccessible: boolean,
    earth: Record<string, string>,
    zone: Record<string, string>,
    profile: ZoneProfile,
    zb: BodyInfo,
): Promise<Match | null> {
    let fromUser: number | null = null,
        routeKm: number | null = null,
        routeMin: number | null = null,
        routeOk = false;
    if (userLoc) {
        fromUser = haversineKm(Number(userLoc.lat), Number(userLoc.lng), lat, lon);
        if (fromUser < 1.5) return null;
        if (preferAccessible) {
            [routeKm, routeMin, routeOk] = await osrmRoute(Number(userLoc.lat), Number(userLoc.lng), lat, lon);
        }
    }

    const metadata = await resolveCandidateMetadata({ lat, lon, earth });
    const { place, placeOk, interf, isolated, interfCount, overOk, power, powerOk, elev, elevOk, soil, soilOk } =
        metadata;

    const [total, comps] = scoreComponents(
        profile,
        zone,
        earth,
        hasLoc ? dist : null,
        hasLoc ? radiusKm : null,
        fromUser,
        routeKm,
        interf,
        power,
        elev,
        soil,
        lat,
        lon,
    );
    const eb = earthBody(
        lat,
        lon,
        idx,
        place,
        placeOk,
        fromUser,
        routeKm,
        routeMin,
        routeOk,
        interf,
        isolated,
        interfCount,
        overOk,
        hasLoc ? radiusKm : null,
        hasLoc ? dist : null,
        power,
        powerOk,
        elev,
        elevOk,
        soil,
        soilOk,
        comps,
    );
    return {
        id: `calc-${planet}-${idx}-${Math.abs(hashSeed(`${lat.toFixed(4)},${lon.toFixed(4)},${planet}`)) % 100000}`,
        percentage: Math.round(total),
        earth: eb,
        zone: zb,
        distanceKm: hasLoc ? Math.round(dist * 100) / 100 : undefined,
        fromUserKm: fromUser != null ? Math.round(fromUser * 100) / 100 : undefined,
        routeKm: routeKm != null ? Math.round(routeKm * 100) / 100 : undefined,
        routeMin: routeMin != null ? Math.round(routeMin * 10) / 10 : undefined,
        placeName: place || undefined,
        humanInterference: interf,
        isolated,
    } as Match;
}

async function mockSearch(query: SearchQuery): Promise<Match[]> {
    const planet = query.planet in ZONE_PROFILES ? query.planet : "marte";
    const earth = query.earth || {};
    const zone = query.zone || {};
    const profile = pickZoneProfile(planet, zone);
    const userLoc = (query as any).userLocation;
    const preferAccessible = (query as any).preferAccessible !== false;
    let centerLat: number, centerLon: number, radiusKm: number;
    if (query.location) {
        centerLat = query.location.lat;
        centerLon = query.location.lng;
        radiusKm = query.location.radiusKm;
    } else {
        const seed = hashSeed(`${planet}|${JSON.stringify(earth)}|${JSON.stringify(zone)}`);
        centerLat = ((seed % 65535) / 65535) * 140 - 70;
        centerLon = ((Math.floor(seed / 65535) % 65535) / 65535) * 360 - 180;
        radiusKm = 50;
    }
    const candidates = generateCandidates(centerLat, centerLon, radiusKm, 4);
    const zb = zoneBody(profile, zone);
    const results: Match[] = [];
    for (const [lat, lon, dist] of candidates) {
        const m = await buildOne(
            planet,
            results.length + 1,
            lat,
            lon,
            dist,
            radiusKm,
            !!query.location,
            userLoc,
            preferAccessible,
            earth,
            zone,
            profile,
            zb,
        );
        if (m) results.push(m);
        if (results.length >= 4) break;
    }
    if (!results.length) {
        const [lat, lon, dist] = candidates[0];
        const m = await buildOne(
            planet,
            1,
            lat,
            lon,
            dist,
            radiusKm,
            !!query.location,
            userLoc,
            preferAccessible,
            earth,
            zone,
            profile,
            zb,
        );
        if (m) results.push(m);
    }
    results.sort((a, b) => b.percentage - a.percentage);
    return results;
}
