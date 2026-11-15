import type { BodyInfo, InfoField, Match, SearchQuery } from "../types";

const API_URL: string = import.meta.env.PUBLIC_API_URL ?? "";
const API_SAT = "API saturated or unavailable; a calculated/local value was used";

// Satellite image centered on the coordinate (Esri World Imagery export; no API key)
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
            /* local fallback */
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
            title: "Lunar maria (basaltic)",
            kicker: "Moon · Maria",
            tone: "moon",
            imageUrl: "https://images-assets.nasa.gov/image/as11-40-5877/as11-40-5877~orig.jpg",
            tags: { zona: "mares", temperatura: "extrema", composicion: "basalto", relieve: "plano" },
            fields: [
                [
                    "Lithology/regolith",
                    "Mafic basalts (FeO/TiO₂), fine regolith",
                    "Volcanic plains in impact basins; analogs: basaltic provinces.",
                ],
                ["Thermal conditions", "≈ −173 °C to +127 °C", "No atmosphere; high thermal amplitude and radiation."],
                [
                    "Morphology",
                    "Low-slope plains with craters",
                    "Favorable for relative mobility; abrasive regolith.",
                ],
                ["Planetary environment", "Vacuum, g ≈ 0.165 g, radiation", "Geological/geomorphological analogy."],
            ],
        },
        crateres: {
            title: "Impact craters",
            kicker: "Moon · Craters",
            tone: "moon",
            imageUrl: "https://images-assets.nasa.gov/image/PIA23210/PIA23210~orig.jpg",
            tags: { zona: "crateres", temperatura: "extrema", composicion: "regolito", relieve: "crateres" },
            fields: [
                [
                    "Lithology/regolith",
                    "Impacted regolith, breccias, and ejecta",
                    "Analogs: terrestrial impact craters.",
                ],
                [
                    "Thermal conditions",
                    "Extreme sunlit/shadow gradients",
                    "Cold microenvironments in local shadows.",
                ],
                ["Morphology", "Rim, walls, floor, and ejecta", "Useful for navigation and sampling."],
                ["Planetary environment", "Vacuum, g ≈ 0.165 g, radiation", "Space weathering."],
            ],
        },
        polos: {
            title: "Permanently shadowed polar regions",
            kicker: "Moon · Poles",
            tone: "moonPole",
            imageUrl: "https://images-assets.nasa.gov/image/PIA14021/PIA14021~orig.jpg",
            tags: { zona: "polos", temperatura: "muy-fria", composicion: "hielo", relieve: "crateres" },
            fields: [
                [
                    "Volatiles/composition",
                    "Possible H₂O and cold volatiles in PSRs",
                    "Analogs: polar/permafrost environments (partial).",
                ],
                ["Thermal conditions", "< −200 °C in permanent shadows", "Relevant for ISRU."],
                ["Morphology", "Deep high-latitude craters", "Persistent shadows."],
                ["Planetary environment", "Vacuum, g ≈ 0.165 g, radiation", "Limited terrestrial analogy."],
            ],
        },
    },
    marte: {
        planicies: {
            title: "Martian plains",
            kicker: "Mars · Plains",
            tone: "rust",
            imageUrl: "https://images-assets.nasa.gov/image/PIA05112/PIA05112~orig.jpg",
            tags: { zona: "planicies", temperatura: "fria", composicion: "sulfatos", relieve: "plano" },
            fields: [
                [
                    "Lithology/mineralogy",
                    "Sulfates, ferric oxides, altered basalts",
                    "Analogs: deserts and evaporites.",
                ],
                ["Thermal conditions", "≈ −90 °C to 0 °C", "Thin atmosphere, large diurnal range."],
                ["Morphology", "Plains, craters, dunes", "Transit and field operations."],
                ["Planetary environment", "g ≈ 0.38 g, low pressure, radiation", "Does not replicate pressure/gravity/radiation."],
            ],
        },
        canones: {
            title: "Canyons and valleys",
            kicker: "Mars · Canyons",
            tone: "rust",
            imageUrl: "https://images-assets.nasa.gov/image/PIA00422/PIA00422~orig.jpg",
            tags: { zona: "canones", temperatura: "fria", composicion: "oxidos", relieve: "montanoso" },
            fields: [
                [
                    "Lithology/stratigraphy",
                    "Layered sequences and hydrated minerals",
                    "Analogs: terrestrial canyons.",
                ],
                ["Thermal conditions", "≈ −110 °C to 0 °C", "Local microclimates."],
                ["Morphology", "Scarps, slopes, valley networks", "Rugged terrain."],
                ["Planetary environment", "g ≈ 0.38 g, thin atmosphere", "Geomorphological focus."],
            ],
        },
        polos: {
            title: "Polar caps",
            kicker: "Mars · Polar caps",
            tone: "ice",
            imageUrl: "https://images-assets.nasa.gov/image/PIA13163/PIA13163~orig.jpg",
            tags: { zona: "polos", temperatura: "muy-fria", composicion: "hielo-agua", relieve: "plano" },
            fields: [
                [
                    "Volatiles/composition",
                    "Water ice, seasonal CO₂, dust",
                    "Analogs: terrestrial glaciers/ice caps.",
                ],
                ["Thermal conditions", "Down to ~ −125 °C", "CO₂ condensation/sublimation."],
                ["Morphology", "Ice plateaus and aeolian patterns", "Seasonal dynamics."],
                ["Planetary environment", "g ≈ 0.38 g, thin atmosphere", "Partial analogy."],
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
        interferenceResult.status === "fulfilled" ? interferenceResult.value : ["low", true, 0, false];

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
    return ok ? `Source: ${src}.` : `${API_SAT} (expected source: ${src}).`;
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
    if (!data) return ["low", true, 0, false];
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
    if (count <= 0) return ["low", true, 0, true];
    if (count <= 5) return ["low", true, count, true];
    if (count <= 40) return ["medium", false, count, true];
    return ["high", false, count, true];
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

// ---- Quantitative definitions of Earth filters ----
type Range = [number, number];
const CLIMA_DEF: Record<string, { p?: Range; t?: Range }> = {
    hiperarido: { p: [0, 100] },
    arido: { p: [100, 250] },
    semiarido: { p: [250, 500] },
    templado: { t: [5, 22], p: [500, Infinity] },
    tundra: { t: [-10, 2] },
    glaciar: { t: [-Infinity, -10] },
    polar: { t: [-Infinity, 2] }, // compatibility with legacy values
};
const CLIMA_SYNTH: Record<string, { t2m: number; tmin: number; tmax: number; prec: number; rh: number }> = {
    hiperarido: { t2m: 25, tmin: 12, tmax: 40, prec: 0.1, rh: 20 },
    arido: { t2m: 24, tmin: 11, tmax: 38, prec: 0.48, rh: 30 },
    semiarido: { t2m: 18, tmin: 6, tmax: 31, prec: 1.0, rh: 42 },
    templado: { t2m: 14, tmin: 4, tmax: 26, prec: 2.2, rh: 62 },
    tundra: { t2m: -5, tmin: -22, tmax: 8, prec: 0.8, rh: 70 },
    glaciar: { t2m: -18, tmin: -35, tmax: -2, prec: 0.5, rh: 72 },
    polar: { t2m: -8, tmin: -25, tmax: 6, prec: 0.8, rh: 72 },
};
const ALT_BANDS: Record<string, Range> = {
    "nivel-mar": [0, 200],
    baja: [200, 500],
    media: [500, 1500],
    alta: [1500, 3000],
    "muy-alta": [3000, 6000],
};
const HUM_BANDS: Record<string, Range> = {
    "muy-baja": [0, 25],
    baja: [25, 40],
    media: [40, 60],
    alta: [60, 80],
    "muy-alta": [80, 100],
};
/** Distance of x from a range (0 if inside). */
function outside(x: number, [lo, hi]: Range): number {
    return x < lo ? lo - x : x >= hi ? x - hi : 0;
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
    const synth = earth.clima ? CLIMA_SYNTH[earth.clima] : undefined;
    if (earth.clima && synth) {
        clima = earth.clima;
        t2m = synth.t2m;
        tmin = synth.tmin;
        tmax = synth.tmax;
        prec = synth.prec;
        rh = synth.rh;
    }
    const h = hashSeed(`clim:${lat.toFixed(4)},${lon.toFixed(4)}`);
    t2m += ((h % 41) - 20) / 10;
    tmin += (((h >>> 6) % 41) - 20) / 10;
    tmax += (((h >>> 12) % 41) - 20) / 10;
    prec = Math.max(0.05, prec + (((h >>> 18) % 31) - 15) / 100);
    rh = Math.min(98, Math.max(10, rh + (((h >>> 23) % 21) - 10)));
    const hb = earth.humedad ? HUM_BANDS[earth.humedad] : undefined;
    if (hb) rh = hb[0] + (hb[1] - hb[0]) * (0.2 + 0.6 * (((h >>> 23) % 1000) / 1000));
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
    const h = hashSeed(`elev:${lat.toFixed(4)},${lon.toFixed(4)}`);
    const band = earth.altitud ? ALT_BANDS[earth.altitud] : undefined;
    if (band) {
        const span = band[1] - band[0];
        const hi = Math.min(band[1], band[0] + 3000);
        return band[0] + span * 0.1 + ((h % 1000) / 1000) * (Math.min(span, hi - band[0]) * 0.8);
    }
    const base = Math.abs(lat) > 15 ? 1400 : 300;
    return base + (h % 500) - 250;
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
            _tipo: "Sandy (estimated)",
        };
    if (s === "salino")
        return {
            clay: v(18, 5, 0),
            sand: v(40, 6, 3),
            silt: v(42, 6, 6),
            soc: v(3, 2, 9),
            bdod: v(1.35, 0, 12),
            phh2o: v(8.1, 0, 15),
            _tipo: "Saline/evaporitic (estimated)",
        };
    if (s === "hielo")
        return {
            clay: v(10, 4, 0),
            sand: v(35, 6, 3),
            silt: v(55, 6, 6),
            soc: v(12, 4, 9),
            bdod: v(0.9, 0, 12),
            phh2o: v(6.2, 0, 15),
            _tipo: "Cryosol/permafrost (estimated)",
        };
    if (s === "basaltico")
        return {
            clay: v(22, 5, 0),
            sand: v(38, 6, 3),
            silt: v(40, 6, 6),
            soc: v(9, 3, 9),
            bdod: v(1.25, 0, 12),
            phh2o: v(6.8, 0, 15),
            _tipo: "Basalt-derived (estimated)",
        };
    if (s === "ceniza")
        return {
            clay: v(10, 3, 0),
            sand: v(55, 6, 3),
            silt: v(35, 5, 6),
            soc: v(3, 2, 9),
            bdod: v(1.0, 0, 12),
            phh2o: v(6.5, 0, 15),
            _tipo: "Volcanic ash/tephra (estimated)",
        };
    if (s === "grava")
        return {
            clay: v(10, 3, 0),
            sand: v(60, 6, 3),
            silt: v(30, 5, 6),
            soc: v(2, 1, 9),
            bdod: v(1.55, 0, 12),
            phh2o: v(7.4, 0, 15),
            _tipo: "Gravelly/stony (estimated)",
        };
    if (s === "ferroso")
        return {
            clay: v(32, 5, 0),
            sand: v(30, 5, 3),
            silt: v(38, 5, 6),
            soc: v(4, 2, 9),
            bdod: v(1.3, 0, 12),
            phh2o: v(6.0, 0, 15),
            _tipo: "Iron oxide-rich (estimated)",
        };
    if (s === "yeso")
        return {
            clay: v(14, 3, 0),
            sand: v(38, 5, 3),
            silt: v(48, 5, 6),
            soc: v(2, 1, 9),
            bdod: v(1.3, 0, 12),
            phh2o: v(8.0, 0, 15),
            _tipo: "Sulfate-rich/gypsiferous (estimated)",
        };
    return {
        clay: v(20, 5, 0),
        sand: v(45, 6, 3),
        silt: v(35, 6, 6),
        soc: v(8, 3, 9),
        bdod: v(1.3, 0, 12),
        phh2o: v(7.0, 0, 15),
        _tipo: "Mixed (estimated)",
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
        comps.target_zone = (100 * zkeys.filter(k => profile.tags[k] === zone[k]).length) / zkeys.length;
    else comps.target_zone = clamp(68 + ((hv >>> 4) % 17), 55, 90);

    if (power?.T2M != null) {
        const t = Number(power.T2M),
            p = (Number(power.PRECTOTCORR) || 0) * 365,
            rh = Number(power.RH2M) || 50;
        const cdef = earth.clima ? CLIMA_DEF[earth.clima] : undefined;
        if (cdef) {
            const dp = cdef.p ? outside(p, cdef.p) / 100 : 0; // per 100 mm/year outside range
            const dt = cdef.t ? outside(t, cdef.t) / 3 : 0; // per 3 °C outside range
            const miss = dp + dt;
            comps.climate = miss === 0 ? 94 : clamp(60 - miss * 6, 20, 60);
        } else {
            const aridFit = clamp(100 - Math.abs(p - 250) / 10, 25, 95);
            const tempFit = clamp(100 - Math.abs(t - 18) * 2, 20, 95);
            const rhFit = clamp(100 - Math.abs(rh - 35) * 1.2, 20, 95);
            comps.climate = clamp(aridFit * 0.45 + tempFit * 0.35 + rhFit * 0.2, 25, 98);
        }
    } else comps.climate = 40;

    if (elev != null) {
        const e = Number(elev);
        const band = earth.altitud ? ALT_BANDS[earth.altitud] : undefined;
        if (band) {
            const d = outside(e, band);
            const mid = (band[0] + Math.min(band[1], band[0] + 3000)) / 2;
            const half = Math.max(1, (Math.min(band[1], band[0] + 3000) - band[0]) / 2);
            comps.elevation_dem =
                d === 0
                    ? clamp(90 + 8 * (1 - Math.min(1, Math.abs(e - mid) / half)), 88, 98)
                    : clamp(55 - d / 60, 20, 55);
        } else comps.elevation_dem = clamp(55 + Math.min(e, 3500) / 80, 30, 98);
    } else comps.elevation_dem = 35;

    if (soil || power?.RH2M != null) {
        if (soil && earth.suelo) {
            const sand = Number(soil.sand ?? 40),
                clay = Number(soil.clay ?? 20),
                bd = Number(soil.bdod ?? 1.3),
                ph = Number(soil.phh2o ?? 7),
                precY = (Number(power?.PRECTOTCORR) || 0) * 365,
                w = earth.suelo;
            const ok =
                (w === "arenoso" && sand >= 50) ||
                (w === "salino" && precY < 350) ||
                (w === "hielo" && (Number(power?.T2M) ?? 10) < 0) ||
                (w === "basaltico" && sand >= 30 && sand <= 55) ||
                (w === "ceniza" && sand >= 45 && sand <= 75 && bd <= 1.15) ||
                (w === "grava" && sand >= 45 && clay <= 16) ||
                (w === "ferroso" && clay >= 25) ||
                (w === "yeso" && precY < 350 && ph >= 7.6);
            comps.substrate_moisture = clamp((ok ? 90 : 45) + (sand - 45) / 10, 20, 98);
        } else {
            const sand = Number(soil?.sand ?? 40),
                soc = Number(soil?.soc ?? 8),
                ph = Number(soil?.phh2o ?? 7),
                rh = Number(power?.RH2M ?? 50);
            comps.substrate_moisture = clamp(
                35 +
                    sand * 0.35 +
                    soc * 1.2 +
                    Math.max(0, 10 - Math.abs(ph - 7)) * 1.5 +
                    (50 - Math.abs(rh - 40)) * 0.25,
                25,
                97,
            );
        }
    } else comps.substrate_moisture = 35;

    if (power?.RH2M != null) {
        const rh = Number(power.RH2M);
        const hb = earth.humedad ? HUM_BANDS[earth.humedad] : undefined;
        if (hb) {
            const d = outside(rh, hb);
            comps.relative_humidity = d === 0 ? 93 : clamp(62 - d * 2.2, 20, 62);
        } else comps.relative_humidity = clamp(100 - Math.abs(rh - 35) * 1.2, 20, 95);
    } else comps.relative_humidity = 35;
    comps.spatial = dist != null && radius ? clamp(100 * (1 - 0.5 * (dist / Math.max(radius, 1e-6))), 20, 100) : 80;
    let acc = 60;
    if (fromUser != null) {
        if (fromUser < 1.5) acc = 25;
        else if (routeKm != null) acc = clamp(90 - Math.max(0, routeKm - 20) / 8, 35, 92);
        else acc = clamp(75 - Math.max(0, fromUser - 5) / 10, 30, 78);
    }
    comps.accessibility = acc;
    comps.human_interference_osm =
        interference === "low" ? 95 : interference === "medium" ? 60 : interference === "high" ? 25 : 70;
    const weights: any = {
        target_zone: 0.24,
        climate: 0.18,
        elevation_dem: 0.14,
        substrate_moisture: 0.13,
        relative_humidity: 0.08,
        spatial: 0.09,
        accessibility: 0.08,
        human_interference_osm: 0.06,
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
        label: "Toponymy (OpenStreetMap)",
        value: place || `Coordinate ${lat.toFixed(4)}, ${lon.toFixed(4)} (no toponymy)`,
        detail: `Nominatim reverse geocoding (OpenStreetMap). ${srcNote(placeOk, "https://nominatim.openstreetmap.org")}`,
        correlation: placeOk && place ? 95 : 50,
    });
    fields.push({
        label: "Georeferencing",
        value: `${lat.toFixed(5)}°, ${lon.toFixed(5)}° (WGS84)`,
        detail: "Candidate generated by sampling within the area (not a pre-established site).",
        correlation: 100,
    });
    if (radius != null && dist != null)
        fields.push({
            label: "Spatial sampling",
            value: `${dist.toFixed(2)} km from center · radius ${radius.toFixed(0)} km`,
            detail: "Candidate calculated radially relative to the target profile and filters.",
            correlation: Math.round(comps.spatial ?? 70),
        });
    if (fromUser != null) {
        const routeStr =
            routeKm != null && routeMin != null
                ? `${routeKm.toFixed(1)} km, ~${routeMin.toFixed(0)} min by vehicle (OSRM/OpenStreetMap)`
                : "no vehicle route (geodesic distance)";
        const rd =
            routeKm != null
                ? `Route estimated with OSRM (OpenStreetMap). ${srcNote(routeOk, "https://router.project-osrm.org")}`
                : `No OSRM route obtained; ${API_SAT.toLowerCase()} (geodesic distance calculated locally).`;
        fields.push({
            label: "Accessibility (OpenStreetMap/OSRM)",
            value: `${fromUser.toFixed(1)} km geodesic · ${routeStr}`,
            detail: rd,
            correlation: Math.round(comps.accessibility ?? 60),
        });
    }
    const interfLabel = interf[0].toUpperCase() + interf.slice(1);
    fields.push({
        label: "Human interference (OpenStreetMap/Overpass)",
        value: `${interfLabel} · ${isolated ? "isolated" : "not fully isolated"} · n≈${interfCount} mapped elements (OSM count, 1.2 km radius)`,
        detail: `Proxy for anthropization from infrastructure mapped in OpenStreetMap via Overpass. ${srcNote(overOk, "https://overpass-api.de")}`,
        correlation: Math.round(comps.human_interference_osm ?? 60),
    });
    const ai = aridity(power?.PRECTOTCORR, power?.T2M);
    const pYear = power?.PRECTOTCORR != null ? power.PRECTOTCORR * 365 : null;
    const pParts: string[] = [];
    if (power?.T2M != null) pParts.push(`T2M ${Number(power.T2M).toFixed(2)} °C`);
    if (power?.T2M_MIN != null && power?.T2M_MAX != null)
        pParts.push(`range ${Number(power.T2M_MIN).toFixed(2)} to ${Number(power.T2M_MAX).toFixed(2)} °C`);
    if (pYear != null)
        pParts.push(`precip. ${pYear.toFixed(1)} mm/year (${Number(power.PRECTOTCORR).toFixed(3)} mm/day)`);
    if (power?.RH2M != null) pParts.push(`RH2M ${Number(power.RH2M).toFixed(1)} %`);
    if (power?.WS2M != null) pParts.push(`wind at 2 m ${Number(power.WS2M).toFixed(2)} m/s`);
    if (power?.ALLSKY_SFC_SW_DWN != null)
        pParts.push(`solar radiation ${Number(power.ALLSKY_SFC_SW_DWN).toFixed(2)} kWh/m²/day`);
    if (ai != null) pParts.push(`aridity index (dimensionless, approx. De Martonne) P/(T+10) = ${ai.toFixed(2)}`);
    fields.push({
        label: "Climate (NASA POWER)",
        value: pParts.join("; ") || "no data",
        detail: `Point climatology (NASA POWER, MERRA-2/GEWEX). Units: °C, mm/year, mm/day, %, m/s, kWh/m²/day. Parameters: T2M, T2M_MIN, T2M_MAX, PRECTOTCORR, RH2M, WS2M, ALLSKY_SFC_SW_DWN. ${srcNote(powerOk, "https://power.larc.nasa.gov/")}`,
        correlation: Math.round(comps.climate ?? 60),
    });
    fields.push({
        label: "Elevation (DEM)",
        value: elev != null ? `${Number(elev).toFixed(1)} m a.s.l.` : "no data",
        detail: `Terrain elevation (m a.s.l.) from DEM (OpenTopData, SRTM 90 m / ASTER 30 m). ${srcNote(elevOk, "https://www.opentopodata.org")}`,
        correlation: Math.round(comps.elevation_dem ?? 60),
    });
    const sub: string[] = [];
    if (soil) {
        if (soil.clay != null) sub.push(`clay ${Number(soil.clay).toFixed(1)} %`);
        if (soil.sand != null) sub.push(`sand ${Number(soil.sand).toFixed(1)} %`);
        if (soil.silt != null) sub.push(`silt ${Number(soil.silt).toFixed(1)} %`);
        if (soil.soc != null) sub.push(`organic C ${Number(soil.soc).toFixed(1)} g/kg`);
        if (soil.bdod != null) sub.push(`bulk density ${Number(soil.bdod).toFixed(2)} kg/dm³`);
        if (soil.phh2o != null) sub.push(`pH(H₂O) ${Number(soil.phh2o).toFixed(2)}`);
        if (soil._tipo) sub.push(String(soil._tipo));
    }
    fields.push({
        label: "Soil substrate (SoilGrids, quantitative)",
        value: sub.join("; ") || "no data",
        detail: `Mean properties 0–15 cm (ISRIC SoilGrids v2.0) in physical units (%, g/kg, kg/dm³, pH). ${srcNote(soilOk, "https://rest.isric.org/soilgrids/v2.0/")}`,
        correlation: Math.round(comps.substrate_moisture ?? 50),
    });
    const hum: string[] = [];
    if (power?.RH2M != null) hum.push(`mean annual RH ${Number(power.RH2M).toFixed(1)} %`);
    if (pYear != null) hum.push(`precipitation ${pYear.toFixed(1)} mm/year`);
    if (ai != null) hum.push(`aridity index (dimensionless, approx. De Martonne) P/(T+10) = ${ai.toFixed(2)}`);
    fields.push({
        label: "Humidity and water availability (quantitative)",
        value: hum.join("; ") || "no data",
        detail: `Relative humidity (%), precipitation (mm/year), and aridity index (dimensionless, formula P/(T+10)). ${srcNote(powerOk, "https://power.larc.nasa.gov/")} (index calculated locally from these data).`,
        correlation: Math.round(comps.relative_humidity ?? 50),
    });
    const compStr = Object.entries(comps)
        .map(([k, v]) => `${k}=${Math.round(Number(v))} %`)
        .join("; ");
    fields.push({
        label: "Similarity methodology (by components)",
        value: `Components (%): ${compStr}`,
        detail: "Weighted average of components measured/queried or calculated locally when an API does not respond. Direct result without normalization to a bounded index. Relevant formulas/variables: P/(T+10), T2M, PRECTOTCORR, RH2M.",
        correlation: undefined as any,
    });
    return {
        kicker: `Earth · Calculated candidate #${idx}`,
        title: place || `Candidate at ${lat.toFixed(3)}°, ${lon.toFixed(3)}°`,
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
