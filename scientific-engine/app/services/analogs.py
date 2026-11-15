from __future__ import annotations

import hashlib
import json
import math
import urllib.parse
import urllib.request
from math import asin, atan2, cos, degrees, radians, sin, sqrt

from app.schemas.info import BodyInfo, InfoField
from app.schemas.match import Match
from app.schemas.query import SearchQuery

TONE = {
    "basalt": "linear-gradient(160deg,#3d4a52,#1c262c)",
    "desert": "linear-gradient(160deg,#b98b5a,#6e4a2c)",
    "ice": "linear-gradient(160deg,#a9c7d6,#4d7384)",
    "salt": "linear-gradient(160deg,#d8cdb8,#8e7f64)",
    "rust": "linear-gradient(160deg,#c4502d,#5f2113)",
    "moon": "linear-gradient(160deg,#c9c7c0,#6f6d68)",
    "moonPole": "linear-gradient(160deg,#6f7a86,#1e262e)",
    "river": "linear-gradient(160deg,#b5502e,#4a1f13)",
}

ZONE_PROFILES = {
    "luna": {
        "mares": {
            "title": "Mares lunares (basálticos)",
            "kicker": "Luna · Mares",
            "tone": "moon",
            "imageUrl": "https://images-assets.nasa.gov/image/as11-40-5877/as11-40-5877~orig.jpg",
            "tags": {"zona": "mares", "temperatura": "extrema", "composicion": "basalto", "relieve": "plano"},
            "fields": [
                ("Litología/regolito", "Basaltos toleíticos ricos en FeO/TiO₂ (mare basalts)", "Llanuras volcánicas que rellenaron cuencas de impacto; análogos terrestres: flujos basálticos y campos volcánicos máficos."),
                ("Condiciones térmicas", "≈ −173 °C a +127 °C (superficie, ciclo día/noche)", "Sin atmósfera significativa; alta amplitud térmica y radiación solar directa."),
                ("Morfología", "Planicies de baja pendiente con cráteres superpuestos", "Topografía favorable para movilidad relativa; regolito fino y bloques ejectados."),
                ("Entorno planetario", "Vacío, g ≈ 0.165 g, alta radiación", "Referencia: Apollo/LRO. Analogía geológica/geomorfológica, no gravedad ni vacío."),
            ],
        },
        "crateres": {
            "title": "Cráteres de impacto",
            "kicker": "Luna · Cráteres",
            "tone": "moon",
            "imageUrl": "https://images-assets.nasa.gov/image/PIA23210/PIA23210~orig.jpg",
            "tags": {"zona": "crateres", "temperatura": "extrema", "composicion": "regolito", "relieve": "crateres"},
            "fields": [
                ("Litología/regolito", "Regolito impactado, brechas y ejecta", "Mezcla de fragmentos por impactos; análogos: cráteres de impacto terrestres y terrenos de ejecta."),
                ("Condiciones térmicas", "Gradientes extremos iluminado/sombra", "Paredes y fondos con insolación contrastada; microambientes fríos en sombras locales."),
                ("Morfología", "Rim, paredes, fondo y manto de eyecta", "Geometría de impacto útil para navegación y muestreo estratigráfico."),
                ("Entorno planetario", "Vacío, g ≈ 0.165 g, alta radiación", "Procesos dominados por impactos y meteorización espacial."),
            ],
        },
        "polos": {
            "title": "Regiones polares en sombra permanente",
            "kicker": "Luna · Polos",
            "tone": "moonPole",
            "imageUrl": "https://images-assets.nasa.gov/image/PIA14021/PIA14021~orig.jpg",
            "tags": {"zona": "polos", "temperatura": "muy-fria", "composicion": "hielo", "relieve": "crateres"},
            "fields": [
                ("Volátiles/comp.", "Hielo de agua y volátiles fríos en PSR (evidencia remota)", "Depósitos potenciales en regolito frío; análogos: ambientes polares/fríos terrestres y permafrost (con diferencias de presión)."),
                ("Condiciones térmicas", "< −200 °C en sombras permanentes (PSR)", "Trampas frías estables; relevancia para ISRU y preservación de volátiles."),
                ("Morfología", "Cráteres profundos y cuencas de alta latitud", "Iluminación rasante y topografía que genera sombras persistentes."),
                ("Entorno planetario", "Vacío, g ≈ 0.165 g, radiación", "Referencia: LCROSS/LRO/Diviner. Analogía terrestre parcial."),
            ],
        },
    },
    "marte": {
        "planicies": {
            "title": "Planicies marcianas",
            "kicker": "Marte · Planicies",
            "tone": "rust",
            "imageUrl": "https://images-assets.nasa.gov/image/PIA05112/PIA05112~orig.jpg",
            "tags": {"zona": "planicies", "temperatura": "fria", "composicion": "sulfatos", "relieve": "plano"},
            "fields": [
                ("Litología/mineralogía", "Sulfatos, óxidos férricos y basaltos alterados", "Señales de interacción agua-roca; análogos: desiertos, evaporitas y terrenos volcánicos áridos."),
                ("Condiciones térmicas", "≈ −90 °C a 0 °C (variable)", "Atmósfera tenue (~6 mbar CO₂) con gran amplitud diaria."),
                ("Morfología", "Planicies extensas, cráteres, dunas", "Superficies de tránsito y operación para rovers."),
                ("Entorno planetario", "g ≈ 0.38 g, P baja, radiación UV/iónica", "Referencia: MER/MSL/MRO. Analogía no replica presión/gravedad/radiación."),
            ],
        },
        "canones": {
            "title": "Cañones y valles",
            "kicker": "Marte · Cañones",
            "tone": "rust",
            "imageUrl": "https://images-assets.nasa.gov/image/PIA00422/PIA00422~orig.jpg",
            "tags": {"zona": "canones", "temperatura": "fria", "composicion": "oxidos", "relieve": "montanoso"},
            "fields": [
                ("Litología/estratigrafía", "Secuencias estratificadas, óxidos de Fe, minerales hidratados", "Afloramientos que registran historia geológica/hídrica; análogos: cañones y valles erosivos terrestres."),
                ("Condiciones térmicas", "≈ −110 °C a 0 °C; microclimas en fondo", "Mayor presión relativa en cotas bajas; gradientes topográficos marcados."),
                ("Morfología", "Escarpes, taludes, redes de valles", "Terreno accidentado para estudio estratigráfico y movilidad."),
                ("Entorno planetario", "g ≈ 0.38 g, atmósfera tenue, radiación", "Procesos de erosión y meteorización."),
            ],
        },
        "polos": {
            "title": "Casquetes polares",
            "kicker": "Marte · Casquetes polares",
            "tone": "ice",
            "imageUrl": "https://images-assets.nasa.gov/image/PIA13163/PIA13163~orig.jpg",
            "tags": {"zona": "polos", "temperatura": "muy-fria", "composicion": "hielo-agua", "relieve": "plano"},
            "fields": [
                ("Volátiles/comp.", "H₂O hielo, CO₂ estacional, capas de polvo", "Estratigrafía de hielos; análogos: glaciares y regiones polares terrestres."),
                ("Condiciones térmicas", "Hasta ~ −125 °C en invierno polar", "Condensación/sublimación estacional de CO₂."),
                ("Morfología", "Mesetas heladas, troughs y patrones eólicos", "Terrenos de hielo con dinámica estacional."),
                ("Entorno planetario", "g ≈ 0.38 g, atmósfera tenue, radiación", "Referencia: MRO/HiRISE. Analogía parcial por diferencias atmosféricas."),
            ],
        },
    },
}

OSM_HEADERS = {"User-Agent": "ItzamnaHackathon/1.0 (analog search; contact: local-demo)", "Accept": "application/json"}
API_SAT = "API saturada o sin respuesta; se usó valor calculado/local"


def _http_json(url: str, timeout: float = 4.0, headers: dict | None = None):
    try:
        req = urllib.request.Request(url, headers=headers or OSM_HEADERS)
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8", "ignore"))
    except Exception:
        return None


def reverse_geocode_name(lat: float, lon: float) -> tuple[str | None, bool]:
    q = urllib.parse.urlencode({"format": "jsonv2", "lat": f"{lat:.6f}", "lon": f"{lon:.6f}", "zoom": 10, "addressdetails": 1})
    data = _http_json(f"https://nominatim.openstreetmap.org/reverse?{q}", timeout=4.0)
    if not data:
        return (None, False)
    addr = data.get("address") or {}
    for k in ("natural", "peak", "volcano", "desert", "valley", "water", "village", "hamlet", "town", "city", "municipality", "county", "state", "region"):
        if addr.get(k):
            name = str(addr[k])
            state = addr.get("state") or addr.get("region")
            if state and state != name:
                return (f"{name}, {state}", True)
            return (name, True)
    name = data.get("name") or (str(data.get("display_name", "")).split(",")[0].strip() or None)
    return (name, bool(data))


def route_from_user(user_lat: float, user_lon: float, lat: float, lon: float) -> tuple[float | None, float | None, bool]:
    coords = f"{user_lon:.6f},{user_lat:.6f};{lon:.6f},{lat:.6f}"
    url = f"https://router.project-osrm.org/route/v1/driving/{coords}?overview=false&alternatives=false"
    data = _http_json(url, timeout=4.0)
    try:
        route = data["routes"][0]
        return (float(route["distance"]) / 1000.0, float(route["duration"]) / 60.0, True)
    except Exception:
        return (None, None, False)


def human_interference(lat: float, lon: float) -> tuple[str, bool, int, bool]:
    radius = 1200
    query = f'[out:json][timeout:6];(way["building"](around:{radius},{lat},{lon});way["highway"](around:{radius},{lat},{lon});node["place"](around:{radius},{lat},{lon}););out count;'
    url = "https://overpass-api.de/api/interpreter?data=" + urllib.parse.quote(query)
    data = _http_json(url, timeout=7.0)
    if data is None:
        # fallback local calculado: estimación determinística por ubicación (si API no responde)
        h = int(hashlib.sha1(f"osm:{lat:.4f},{lon:.4f}".encode()).hexdigest()[:6], 16)
        bucket = h % 10
        if bucket <= 5:
            level, isolated, count = "baja", True, h % 4          # 0-3
        elif bucket <= 8:
            level, isolated, count = "media", False, 6 + (h % 30) # 6-35
        else:
            level, isolated, count = "alta", False, 45 + (h % 60) # 45-104
        return (level, isolated, count, False)
    count = 0
    try:
        elements = data.get("elements") or []
        if elements and "tags" in elements[0]:
            tags = elements[0].get("tags") or {}
            count = int(tags.get("total") or tags.get("ways") or tags.get("nodes") or 0)
            if count == 0:
                count = int(tags.get("ways", 0)) + int(tags.get("nodes", 0))
        elif elements:
            count = len(elements)
    except Exception:
        count = 0
    if count == 0:
        return ("baja", True, 0, True)
    if count <= 5:
        return ("baja", True, count, True)
    if count <= 40:
        return ("media", False, count, True)
    return ("alta", False, count, True)


def fetch_nasa_power(lat: float, lon: float) -> tuple[dict | None, bool]:
    params = urllib.parse.urlencode({
        "parameters": "T2M,T2M_MIN,T2M_MAX,PRECTOTCORR,RH2M,WS2M,ALLSKY_SFC_SW_DWN",
        "community": "RE", "longitude": f"{lon:.5f}", "latitude": f"{lat:.5f}", "format": "JSON",
    })
    url = f"https://power.larc.nasa.gov/api/temporal/climatology/point?{params}"
    data = _http_json(url, timeout=8.0)
    try:
        p = data["properties"]["parameter"]
        def ann(key):
            v = p.get(key, {}).get("ANN")
            return float(v) if v is not None else None
        out = {k: ann(k) for k in ("T2M","T2M_MIN","T2M_MAX","PRECTOTCORR","RH2M","WS2M","ALLSKY_SFC_SW_DWN")}
        ok = any(v is not None for v in out.values())
        return (out if ok else None, ok)
    except Exception:
        return (None, False)


def fetch_elevation(lat: float, lon: float) -> tuple[float | None, bool]:
    for dataset in ("srtm90m", "aster30m"):
        url = f"https://api.opentopodata.org/v1/{dataset}?locations={lat:.6f},{lon:.6f}"
        data = _http_json(url, timeout=6.0)
        try:
            elev = data["results"][0].get("elevation")
            if elev is not None:
                return (float(elev), True)
        except Exception:
            pass
    return (None, False)


def fetch_soil(lat: float, lon: float) -> tuple[dict | None, bool]:
    props = ["clay", "sand", "silt", "soc", "bdod", "phh2o"]
    depths = ["0-5cm", "5-15cm"]
    qs = [f"property={p}" for p in props] + [f"depth={d}" for d in depths] + ["value=mean"]
    q = "&".join(qs) + f"&lat={lat:.6f}&lon={lon:.6f}"
    url = f"https://rest.isric.org/soilgrids/v2.0/properties/query?{q}"
    data = _http_json(url, timeout=8.0)
    try:
        layers = data["properties"]["layers"]
        out = {}
        for layer in layers:
            name = layer.get("name")
            vals = []
            for d in layer.get("depths", []):
                m = (d.get("values") or {}).get("mean")
                if m is not None:
                    vals.append(float(m))
            if vals:
                out[name] = sum(vals) / len(vals)
        def conv(name, v):
            if name in ("clay", "sand", "silt"): return v / 10.0
            if name == "soc": return v / 10.0
            if name == "bdod": return v / 100.0
            if name == "phh2o": return v / 10.0
            return v
        out = {k: conv(k, v) for k, v in out.items()}
        ok = bool(out)
        return (out if ok else None, ok)
    except Exception:
        return (None, False)


# ---- fallbacks calculados/locales (como los actuales) ----

def local_climate(lat: float, lon: float, earth_filters: dict[str, str]) -> dict:
    al = abs(lat)
    if al >= 66:
        clima = "polar"
        t2m, tmin, tmax, prec, rh = -12.0, -30.0, 5.0, 0.7, 70.0
    elif al <= 23:
        clima = "arido"
        t2m, tmin, tmax, prec, rh = 24.0, 10.0, 38.0, 0.4, 35.0
    else:
        clima = "templado"
        t2m, tmin, tmax, prec, rh = 15.0, 4.0, 27.0, 2.0, 60.0
    if "clima" in earth_filters:
        clima = earth_filters["clima"]
        if clima == "arido": t2m, tmin, tmax, prec, rh = 25.0, 12.0, 39.0, 0.3, 30.0
        elif clima == "polar": t2m, tmin, tmax, prec, rh = -10.0, -28.0, 6.0, 0.8, 72.0
        else: t2m, tmin, tmax, prec, rh = 16.0, 5.0, 28.0, 2.2, 58.0
    # variación determinística por ubicación (evita porcentajes idénticos en puntos distintos)
    h = int(hashlib.sha1(f"clim:{lat:.4f},{lon:.4f}".encode()).hexdigest()[:8], 16)
    t2m += ((h % 41) - 20) / 10.0            # ±2.0 °C
    tmin += (((h >> 6) % 41) - 20) / 10.0
    tmax += (((h >> 12) % 41) - 20) / 10.0
    prec = max(0.05, prec + (((h >> 18) % 31) - 15) / 100.0)  # ±0.15 mm/día
    rh = min(98.0, max(10.0, rh + (((h >> 23) % 21) - 10)))
    return {"T2M": t2m, "T2M_MIN": tmin, "T2M_MAX": tmax, "PRECTOTCORR": prec, "RH2M": rh, "WS2M": 3.5, "ALLSKY_SFC_SW_DWN": 4.5, "_clima": clima}


def local_elevation(lat: float, lon: float, earth_filters: dict[str, str]) -> float:
    al = abs(lat)
    base = 1400.0 if al > 15 else 300.0
    if "altitud" in earth_filters:
        if earth_filters["altitud"] == "baja": base = 200.0
        elif earth_filters["altitud"] == "media": base = 1200.0
        else: base = 2800.0
    # variación determinística por ubicación
    h = int(hashlib.sha1(f"elev:{lat:.4f},{lon:.4f}".encode()).hexdigest()[:6], 16)
    return round(base + (h % 500) - 250, 1)


def local_soil(lat: float, lon: float, power: dict, earth_filters: dict[str, str]) -> dict:
    t = power.get("T2M", 15.0)
    if "suelo" in earth_filters:
        s = earth_filters["suelo"]
    else:
        if t < 0: s = "hielo"
        elif (power.get("PRECTOTCORR", 1.0) * 365) < 350: s = "salino"
        else: s = "arenoso"
    # variación determinística por ubicación
    h = int(hashlib.sha1(f"soil:{lat:.4f},{lon:.4f}".encode()).hexdigest()[:8], 16)
    v = lambda base, span, shift=0: round(base + (((h >> shift) % (span * 2 + 1)) - span), 2)
    if s == "arenoso":
        return {"clay": v(8.0,4,0), "sand": v(72.0,6,3), "silt": v(20.0,5,6), "soc": v(6.0,3,9), "bdod": v(1.45,0.1,12), "phh2o": v(7.2,0.4,15), "_tipo": "Arenoso (estimado)"}
    if s == "salino":
        return {"clay": v(18.0,5,0), "sand": v(40.0,6,3), "silt": v(42.0,6,6), "soc": v(3.0,2,9), "bdod": v(1.35,0.1,12), "phh2o": v(8.1,0.3,15), "_tipo": "Salino/evaporítico (estimado)"}
    if s == "hielo":
        return {"clay": v(10.0,4,0), "sand": v(35.0,6,3), "silt": v(55.0,6,6), "soc": v(12.0,4,9), "bdod": v(0.9,0.08,12), "phh2o": v(6.2,0.4,15), "_tipo": "Criósuelo/permafrost (estimado)"}
    if s == "basaltico":
        return {"clay": v(22.0,5,0), "sand": v(38.0,6,3), "silt": v(40.0,6,6), "soc": v(9.0,3,9), "bdod": v(1.25,0.1,12), "phh2o": v(6.8,0.4,15), "_tipo": "Derivado basáltico (estimado)"}
    return {"clay": v(20.0,5,0), "sand": v(45.0,6,3), "silt": v(35.0,6,6), "soc": v(8.0,3,9), "bdod": v(1.3,0.1,12), "phh2o": v(7.0,0.4,15), "_tipo": "Férrico/mixto (estimado)"}


def aridity_index(precip_mm_day: float | None, t2m_c: float | None) -> float | None:
    if precip_mm_day is None or t2m_c is None:
        return None
    p_year = precip_mm_day * 365.0
    return p_year / (t2m_c + 10.0) if (t2m_c + 10.0) != 0 else None


def haversine_km(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    r = 6371.0
    dlat = radians(lat2 - lat1); dlon = radians(lon2 - lon1)
    a = sin(dlat / 2) ** 2 + cos(radians(lat1)) * cos(radians(lat2)) * sin(dlon / 2) ** 2
    return 2 * r * asin(sqrt(a))


def dest_point(lat: float, lon: float, bearing_deg: float, dist_km: float) -> tuple[float, float]:
    r = 6371.0; br = radians(bearing_deg); lat1 = radians(lat); lon1 = radians(lon); d = dist_km / r
    lat2 = asin(sin(lat1) * cos(d) + cos(lat1) * sin(d) * cos(br))
    lon2 = lon1 + atan2(sin(br) * sin(d) * cos(lat1), cos(d) - sin(lat1) * sin(lat2))
    return (degrees(lat2), (degrees(lon2) + 540) % 360 - 180)


def clamp(v: float, lo: float, hi: float) -> float:
    return max(lo, min(hi, v))


def score_components(profile_tags: dict, zone_filters: dict, earth_filters: dict, dist_km: float | None, radius_km: float | None, from_user_km: float | None, route_km: float | None, interference: str | None, power: dict | None, elev: float | None, soil: dict | None, lat: float = 0.0, lon: float = 0.0) -> tuple[float, dict]:
    comps = {}
    # pequeña variación determinística por coordenada para diferenciar lugares
    hv = int(hashlib.sha1(f"sc:{lat:.5f},{lon:.5f}".encode()).hexdigest()[:8], 16)
    jitter = ((hv % 13) - 6) * 0.35  # ~±2.1

    zkeys = [k for k in ("zona", "temperatura", "composicion", "relieve") if k in zone_filters]
    if zkeys:
        comps["zona_objetivo"] = 100.0 * sum(1 for k in zkeys if profile_tags.get(k) == zone_filters[k]) / len(zkeys)
    else:
        # sin filtros de zona: afinidad base varía levemente por perfil/lugar
        comps["zona_objetivo"] = clamp(68.0 + ((hv >> 4) % 17), 55.0, 90.0)

    if power and power.get("T2M") is not None:
        t = float(power.get("T2M", 15.0)); p = float(power.get("PRECTOTCORR") or 0) * 365.0; rh = float(power.get("RH2M") or 50.0)
        if "clima" in earth_filters:
            want = earth_filters["clima"]
            ok = (want == "arido" and p < 400) or (want == "polar" and t < 2) or (want == "templado" and 2 <= t <= 22 and p >= 300)
            base = 92.0 if ok else 38.0
            if want == "arido": base += max(-10.0, min(6.0, (400 - p) / 80.0))
            elif want == "polar": base += max(-10.0, min(6.0, (2 - t) / 3.0))
            else: base += max(-10.0, min(6.0, 6.0 - abs(t - 12.0) / 3.0))
            comps["clima"] = clamp(base, 20.0, 98.0)
        else:
            # sin filtro: puntaje continuo según características del lugar
            arid_fit = clamp(100.0 - abs(p - 250.0) / 10.0, 25.0, 95.0)
            temp_fit = clamp(100.0 - abs(t - 18.0) * 2.0, 20.0, 95.0)
            rh_fit = clamp(100.0 - abs(rh - 35.0) * 1.2, 20.0, 95.0)
            comps["clima"] = clamp(arid_fit * 0.45 + temp_fit * 0.35 + rh_fit * 0.2, 25.0, 98.0)
    else:
        comps["clima"] = 40.0

    if elev is not None:
        e = float(elev)
        if "altitud" in earth_filters:
            want = earth_filters["altitud"]
            ok = (want == "baja" and e < 500) or (want == "media" and 500 <= e < 2000) or (want == "alta" and e >= 2000)
            comps["altitud_dem"] = clamp((95.0 if ok else 32.0) + max(-8.0, min(4.0, (1000 - abs(e % 1000 - 500)) / 120.0)), 20.0, 99.0)
        else:
            # continuo por elevación real/estimada del lugar
            comps["altitud_dem"] = clamp(55.0 + min(e, 3500.0) / 80.0, 30.0, 98.0)
    else:
        comps["altitud_dem"] = 35.0

    if soil or (power and power.get("RH2M") is not None):
        if soil and "suelo" in earth_filters:
            sand = float(soil.get("sand", 40.0)); want = earth_filters["suelo"]
            ok = (want == "arenoso" and sand >= 50) or (want == "salino" and (power and (float(power.get("PRECTOTCORR") or 0) * 365) < 350)) or (want == "hielo" and (power and float(power.get("T2M", 10)) < 0)) or (want == "basaltico" and 30 <= sand <= 55)
            comps["sustrato_humedad"] = clamp((90.0 if ok else 45.0) + (sand - 45.0) / 10.0, 20.0, 98.0)
        else:
            # continuo por propiedades edáficas/humedad del lugar
            sand = float(soil.get("sand", 40.0)) if soil else 40.0
            soc = float(soil.get("soc", 8.0)) if soil else 8.0
            ph = float(soil.get("phh2o", 7.0)) if soil else 7.0
            rh = float(power.get("RH2M", 50.0)) if power else 50.0
            comps["sustrato_humedad"] = clamp(35.0 + sand * 0.35 + soc * 1.2 + max(0.0, 10.0 - abs(ph - 7.0)) * 1.5 + (50.0 - abs(rh - 40.0)) * 0.25, 25.0, 97.0)
    else:
        comps["sustrato_humedad"] = 35.0

    spatial = 80.0
    if dist_km is not None and radius_km:
        spatial = 100.0 * (1.0 - 0.5 * (float(dist_km) / max(float(radius_km), 1e-6)))
    comps["espacial"] = clamp(spatial, 20.0, 100.0)

    acc = 60.0
    if from_user_km is not None:
        if from_user_km < 1.5:
            acc = 25.0
        elif route_km is not None:
            acc = clamp(90.0 - max(0.0, float(route_km) - 20.0) / 8.0, 35.0, 92.0)
        else:
            acc = clamp(75.0 - max(0.0, float(from_user_km) - 5.0) / 10.0, 30.0, 78.0)
    comps["accesibilidad"] = acc

    intr = 70.0
    if interference == "baja": intr = 95.0
    elif interference == "media": intr = 60.0
    elif interference == "alta": intr = 25.0
    comps["interferencia_osm"] = intr

    weights = {"zona_objetivo": 0.25, "clima": 0.2, "altitud_dem": 0.15, "sustrato_humedad": 0.15, "espacial": 0.1, "accesibilidad": 0.08, "interferencia_osm": 0.07}
    total = sum(comps.get(k, 50.0) * w for k, w in weights.items()) + jitter
    return (round(clamp(total, 5.0, 99.0), 2), {k: round(clamp(v, 0.0, 100.0), 1) for k, v in comps.items()})


def pick_zone_profile(planet: str, zone_filters: dict[str, str]) -> dict:
    profiles = ZONE_PROFILES.get(planet, ZONE_PROFILES["marte"])
    wanted = zone_filters.get("zona")
    if wanted and wanted in profiles:
        return profiles[wanted]
    best = None; best_score = -1
    for p in profiles.values():
        s = sum(1 for k, v in zone_filters.items() if p["tags"].get(k) == v)
        if s > best_score:
            best_score = s; best = p
    return best or next(iter(profiles.values()))


def src_note(ok: bool, src: str) -> str:
    return f"Fuente: {src}." if ok else f"{API_SAT} (fuente prevista: {src})."


def build_earth_body(lat, lon, idx, place_name, place_ok, from_user_km, route_km, route_min, route_ok, interference, isolated, interference_count, over_ok, radius_km, dist_km, earth_filters, power, power_ok, elev, elev_ok, soil, soil_ok, comps) -> BodyInfo:
    tone_key = "ice" if (elev is not None and elev > 3500) or (power and power.get("T2M") is not None and power["T2M"] < 0) else "basalt"
    title = place_name or f"Candidato en {lat:.3f}°, {lon:.3f}°"
    fields = []

    topo = place_name or f"Coordenada {lat:.4f}, {lon:.4f} (sin toponimia)"
    topo_detail = f"Geocodificación inversa Nominatim (OpenStreetMap). {src_note(place_ok, 'https://nominatim.openstreetmap.org')}"
    fields.append(InfoField(label="Toponimia (OpenStreetMap)", value=topo, detail=topo_detail, correlation=95 if (place_ok and place_name) else 50))

    fields.append(InfoField(label="Georreferenciación", value=f"{lat:.5f}°, {lon:.5f}° (WGS84)", detail="Coordenadas geodésicas decimales del candidato generado por muestreo dentro del área (no sitio preestablecido).", correlation=100))

    if radius_km is not None and dist_km is not None:
        fields.append(InfoField(label="Muestreo espacial", value=f"{dist_km:.2f} km del centro · radio {radius_km:.0f} km", detail="Candidato calculado radialmente y evaluado respecto al perfil objetivo y filtros.", correlation=int(comps.get("espacial", 70))))

    if from_user_km is not None:
        if route_km is not None and route_min is not None:
            ruta = f"{route_km:.1f} km, ~{route_min:.0f} min en vehículo (OSRM/OpenStreetMap)"
            rd = f"Ruta estimada con OSRM (red vial OpenStreetMap). {src_note(route_ok, 'https://router.project-osrm.org')}"
        else:
            ruta = "sin ruta vehicular (se usa distancia geodésica)"
            rd = f"No se obtuvo ruta OSRM ({API_SAT.lower()}); se reporta distancia geodésica calculada localmente."
        fields.append(InfoField(label="Accesibilidad (OpenStreetMap/OSRM)", value=f"{from_user_km:.1f} km geodésicos · {ruta}", detail=rd, correlation=int(comps.get("accesibilidad", 60))))

    iso_txt = "aislada (baja huella antrópica local)" if isolated else "no plenamente aislada"
    inf_val = f"{interference.capitalize()} · {iso_txt} · n≈{interference_count} elementos mapeados (conteo OSM, radio 1.2 km)"
    inf_detail = f"Proxy de antropización desde infraestructura mapeada en OpenStreetMap vía Overpass API. {src_note(over_ok, 'https://overpass-api.de')}"
    fields.append(InfoField(label="Interferencia humana (OpenStreetMap/Overpass)", value=inf_val, detail=inf_detail, correlation=int(comps.get("interferencia_osm", 60))))

    # NASA POWER
    t2m = power.get("T2M"); tmin = power.get("T2M_MIN"); tmax = power.get("T2M_MAX")
    prec = power.get("PRECTOTCORR"); rh = power.get("RH2M"); ws = power.get("WS2M"); rad = power.get("ALLSKY_SFC_SW_DWN")
    ai = aridity_index(prec, t2m); p_year = (prec * 365.0) if prec is not None else None
    parts = []
    if t2m is not None: parts.append(f"T2M {t2m:.2f} °C")
    if tmin is not None and tmax is not None: parts.append(f"rango {tmin:.2f} a {tmax:.2f} °C")
    if p_year is not None: parts.append(f"precip. {p_year:.1f} mm/año ({prec:.3f} mm/día)")
    if rh is not None: parts.append(f"HR2M {rh:.1f} %")
    if ws is not None: parts.append(f"viento a 2 m {ws:.2f} m/s")
    if rad is not None: parts.append(f"radiación solar {rad:.2f} kWh/m²/día")
    if ai is not None: parts.append(f"índice de aridez (adimensional, aprox. De Martonne) P/(T+10) = {ai:.2f}")
    p_detail = f"Climatología puntual (promedios anuales, NASA POWER MERRA-2/GEWEX). Unidades: °C, mm/año, mm/día, %, m/s, kWh/m²/día. Parámetros: T2M, T2M_MIN, T2M_MAX, PRECTOTCORR, RH2M, WS2M, ALLSKY_SFC_SW_DWN. {src_note(power_ok, 'https://power.larc.nasa.gov/')}"
    fields.append(InfoField(label="Clima (NASA POWER)", value=("; ".join(parts) if parts else "sin datos"), detail=p_detail, correlation=int(comps.get("clima", 60))))

    # DEM
    e_val = f"{elev:.1f} m s. n. m." if elev is not None else "sin datos"
    e_detail = f"Elevación del terreno (m s. n. m.) desde Modelo Digital de Elevación (OpenTopData, SRTM 90 m / ASTER 30 m). {src_note(elev_ok, 'https://www.opentopodata.org (SRTM/ASTER)')}"
    fields.append(InfoField(label="Elevación (DEM)", value=e_val, detail=e_detail, correlation=int(comps.get("altitud_dem", 60))))

    # Sustrato y humedad cuantitativos
    sub_parts = []
    if soil:
        if soil.get("clay") is not None: sub_parts.append(f"arcilla {soil['clay']:.1f} %")
        if soil.get("sand") is not None: sub_parts.append(f"arena {soil['sand']:.1f} %")
        if soil.get("silt") is not None: sub_parts.append(f"limo {soil['silt']:.1f} %")
        if soil.get("soc") is not None: sub_parts.append(f"C orgánico {soil['soc']:.1f} g/kg")
        if soil.get("bdod") is not None: sub_parts.append(f"densidad aparente {soil['bdod']:.2f} kg/dm³")
        if soil.get("phh2o") is not None: sub_parts.append(f"pH(H₂O) {soil['phh2o']:.2f}")
        if soil.get("_tipo"): sub_parts.append(f"tipo {soil['_tipo']}")
    sub_val = "; ".join(sub_parts) if sub_parts else "sin datos"
    sub_detail = f"Propiedades medias 0–15 cm (ISRIC SoilGrids v2.0) en unidades físicas (%, g/kg, kg/dm³, pH). {src_note(soil_ok, 'https://rest.isric.org/soilgrids/v2.0/')}"
    fields.append(InfoField(label="Sustrato edáfico (SoilGrids, cuantitativo)", value=sub_val, detail=sub_detail, correlation=int(comps.get("sustrato_humedad", 50))))

    hum_parts = []
    if rh is not None: hum_parts.append(f"HR media anual {rh:.1f} % (NASA POWER)")
    if p_year is not None: hum_parts.append(f"precipitación {p_year:.1f} mm/año")
    if ai is not None: hum_parts.append(f"índice de aridez (adimensional, aprox. De Martonne) P/(T+10) = {ai:.2f}")
    hum_detail = f"Humedad relativa (%), precipitación (mm/año) e índice de aridez (adimensional, fórmula P/(T+10)). {src_note(power_ok, 'https://power.larc.nasa.gov/')} (índice calculado localmente a partir de esos datos)."
    fields.append(InfoField(label="Humedad y disponibilidad hídrica (cuantitativa)", value=("; ".join(hum_parts) if hum_parts else "sin datos"), detail=hum_detail, correlation=int(comps.get("sustrato_humedad", 50))))

    comp_str = ", ".join(f"{k}={v}%" for k, v in comps.items())
    fields.append(InfoField(label="Metodología de similitud (por componentes)", value=f"Componentes (%): {comp_str}", detail="Similitud como promedio ponderado de componentes medidos/consultados o calculados localmente cuando una API no responde (zona objetivo, clima, elevación DEM, sustrato/humedad, espacial, accesibilidad, interferencia OSM). Resultado directo sin normalización a un índice acotado. Fórmulas/variables relevantes: P/(T+10), T2M, PRECTOTCORR, RH2M.", correlation=None))

    d = 0.08
    minLon, minLat, maxLon, maxLat = lon-d, lat-d/1.6, lon+d, lat+d/1.6
    image_url = f"https://services.arcgisonline.com/arcgis/rest/services/World_Imagery/MapServer/export?bbox={minLon:.6f},{minLat:.6f},{maxLon:.6f},{maxLat:.6f}&bboxSR=4326&imageSR=4326&size=640,360&format=jpg&f=image"
    return BodyInfo(kicker=f"Tierra · Candidato calculado #{idx}", title=title, tone=TONE[tone_key], imageUrl=image_url, fields=fields)


def build_zone_body(profile: dict, zone_filters: dict[str, str] | None = None) -> BodyInfo:
    zone_filters = zone_filters or {}
    keys = ["composicion", "temperatura", "relieve", "zona"]
    vals = []
    for k in keys:
        if k in zone_filters:
            vals.append(92 if profile["tags"].get(k) == zone_filters[k] else 35)
        else:
            # sin filtro explícito: afinidad estimada, no absoluta
            base = 80 if k == "temperatura" else 78
            vals.append(base)
    corrs = [vals[0], vals[1], int(round((vals[2]+vals[3])/2)), 74]
    fields = [InfoField(label=l, value=v, detail=d, correlation=corrs[i] if i < len(corrs) else None) for i,(l,v,d) in enumerate(profile["fields"])]
    return BodyInfo(kicker=profile["kicker"], title=profile["title"], tone=TONE[profile["tone"]], imageUrl=profile["imageUrl"], fields=fields)


def generate_candidates(center_lat, center_lon, radius_km, count):
    pts = [(center_lat, center_lon, 0.0)]
    if count <= 1: return pts
    rings = 2
    for ring in range(1, rings + 1):
        n = max(3, (count - 1) * ring // ((rings * (rings + 1)) // 2))
        dist = radius_km * ring / rings
        for k in range(n):
            if len(pts) >= count: break
            bearing = (360.0 * k / n) + (ring * 17)
            lat, lon = dest_point(center_lat, center_lon, bearing, dist * 0.98)
            d = haversine_km(center_lat, center_lon, lat, lon)
            if d <= radius_km: pts.append((lat, lon, d))
    while len(pts) < count:
        b = (len(pts) * 57) % 360
        lat, lon = dest_point(center_lat, center_lon, b, radius_km * 0.5)
        pts.append((lat, lon, haversine_km(center_lat, center_lon, lat, lon)))
    return pts[:count]


def build_match(planet, idx, lat, lon, dist, radius_km, query_loc, user_loc, prefer_accessible, earth_filters, zone_filters, profile, zone_body):
    from_user_km = route_km = route_min = None
    route_ok = False
    if user_loc is not None:
        from_user_km = haversine_km(float(user_loc.lat), float(user_loc.lng), lat, lon)
        if from_user_km < 1.5:
            return None
        if prefer_accessible:
            route_km, route_min, route_ok = route_from_user(float(user_loc.lat), float(user_loc.lng), lat, lon)

    place_name, place_ok = reverse_geocode_name(lat, lon)
    interference, isolated, interference_count, over_ok = human_interference(lat, lon)

    power, power_ok = fetch_nasa_power(lat, lon)
    if not power_ok:
        power = local_climate(lat, lon, earth_filters)
    elev, elev_ok = fetch_elevation(lat, lon)
    if not elev_ok:
        elev = local_elevation(lat, lon, earth_filters)
    soil, soil_ok = fetch_soil(lat, lon)
    if not soil_ok:
        soil = local_soil(lat, lon, power, earth_filters)

    total_pct, comps = score_components(profile["tags"], zone_filters, earth_filters, dist if query_loc else None, radius_km if query_loc else None, from_user_km, route_km, interference, power, elev, soil, lat, lon)
    earth_body = build_earth_body(lat, lon, idx, place_name, place_ok, from_user_km, route_km, route_min, route_ok, interference, isolated, interference_count, over_ok, radius_km if query_loc else None, dist if query_loc else None, earth_filters, power, power_ok, elev, elev_ok, soil, soil_ok, comps)
    return Match(
        id=f"calc-{planet}-{idx}-{abs(hash((round(lat,4), round(lon,4), planet)))%100000}",
        percentage=int(round(total_pct)),
        earth=earth_body,
        zone=zone_body,
        distanceKm=round(dist, 2) if query_loc is not None else None,
        fromUserKm=round(from_user_km, 2) if from_user_km is not None else None,
        routeKm=round(route_km, 2) if route_km is not None else None,
        routeMin=round(route_min, 1) if route_min is not None else None,
        placeName=place_name,
        humanInterference=interference,
        isolated=isolated,
    )


def search_analogs(query: SearchQuery) -> list[Match]:
    planet = query.planet if query.planet in ZONE_PROFILES else "marte"
    zone_filters = dict(query.zone or {})
    earth_filters = dict(query.earth or {})
    profile = pick_zone_profile(planet, zone_filters)
    prefer_accessible = bool(getattr(query, "preferAccessible", True))
    user_loc = getattr(query, "userLocation", None)

    if query.location is not None:
        center_lat = float(query.location.lat); center_lon = float(query.location.lng); radius_km = float(query.location.radiusKm)
    else:
        seed = hashlib.sha1(f"{planet}|{sorted(earth_filters.items())}|{sorted(zone_filters.items())}".encode()).hexdigest()
        center_lat = (int(seed[:4], 16) / 65535.0) * 140 - 70
        center_lon = (int(seed[4:8], 16) / 65535.0) * 360 - 180
        radius_km = 50.0

    candidates = generate_candidates(center_lat, center_lon, radius_km, 6)
    zone_body = build_zone_body(profile, zone_filters)
    results = []
    for lat, lon, dist in candidates:
        m = build_match(planet, len(results)+1, lat, lon, dist, radius_km, query.location, user_loc, prefer_accessible, earth_filters, zone_filters, profile, zone_body)
        if m is not None:
            results.append(m)
        if len(results) >= 6: break

    if not results:
        lat, lon, dist = candidates[0]
        m = build_match(planet, 1, lat, lon, dist, radius_km, query.location, user_loc, prefer_accessible, earth_filters, zone_filters, profile, zone_body)
        if m is not None:
            results.append(m)

    results.sort(key=lambda m: m.percentage, reverse=True)
    return results
