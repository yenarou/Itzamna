from __future__ import annotations

import hashlib
import json
import urllib.parse
import urllib.request

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
        h = int(hashlib.sha1(f"osm:{lat:.4f},{lon:.4f}".encode()).hexdigest()[:6], 16)
        bucket = h % 10
        if bucket <= 5:
            level, isolated, count = "baja", True, h % 4
        elif bucket <= 8:
            level, isolated, count = "media", False, 6 + (h % 30)
        else:
            level, isolated, count = "alta", False, 45 + (h % 60)
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
        out = {k: ann(k) for k in ("T2M", "T2M_MIN", "T2M_MAX", "PRECTOTCORR", "RH2M", "WS2M", "ALLSKY_SFC_SW_DWN")}
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


def local_climate(lat: float, lon: float, earth_filters: dict[str, str]) -> dict:
    al = abs(lat)
    if al >= 66:
        clima = "polar"; t2m, tmin, tmax, prec, rh = -12.0, -30.0, 5.0, 0.7, 70.0
    elif al <= 23:
        clima = "arido"; t2m, tmin, tmax, prec, rh = 24.0, 10.0, 38.0, 0.4, 35.0
    else:
        clima = "templado"; t2m, tmin, tmax, prec, rh = 15.0, 4.0, 27.0, 2.0, 60.0
    if "clima" in earth_filters:
        clima = earth_filters["clima"]
        if clima == "arido": t2m, tmin, tmax, prec, rh = 25.0, 12.0, 39.0, 0.3, 30.0
        elif clima == "polar": t2m, tmin, tmax, prec, rh = -10.0, -28.0, 6.0, 0.8, 72.0
        else: t2m, tmin, tmax, prec, rh = 16.0, 5.0, 28.0, 2.2, 58.0
    h = int(hashlib.sha1(f"clim:{lat:.4f},{lon:.4f}".encode()).hexdigest()[:8], 16)
    t2m += ((h % 41) - 20) / 10.0
    tmin += (((h >> 6) % 41) - 20) / 10.0
    tmax += (((h >> 12) % 41) - 20) / 10.0
    prec = max(0.05, prec + (((h >> 18) % 31) - 15) / 100.0)
    rh = min(98.0, max(10.0, rh + (((h >> 23) % 21) - 10)))
    return {"T2M": t2m, "T2M_MIN": tmin, "T2M_MAX": tmax, "PRECTOTCORR": prec, "RH2M": rh, "WS2M": 3.5, "ALLSKY_SFC_SW_DWN": 4.5, "_clima": clima}


def local_elevation(lat: float, lon: float, earth_filters: dict[str, str]) -> float:
    al = abs(lat)
    base = 1400.0 if al > 15 else 300.0
    if "altitud" in earth_filters:
        if earth_filters["altitud"] == "baja": base = 200.0
        elif earth_filters["altitud"] == "media": base = 1200.0
        else: base = 2800.0
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


def src_note(ok: bool, src: str) -> str:
    return f"Fuente: {src}." if ok else f"{API_SAT} (fuente prevista: {src})."
