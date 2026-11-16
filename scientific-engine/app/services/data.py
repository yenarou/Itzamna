from __future__ import annotations

import hashlib
import json
import urllib.parse
import urllib.request


OSM_HEADERS = {"User-Agent": "ItzamnaHackathon/1.0 (analog search; contact: local-demo)", "Accept": "application/json"}
API_SAT = "API saturated or unavailable; a calculated/local value was used"


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


def _matches_tag_filters(tags: dict | None, tag_filters: dict[str, str] | None) -> bool:
    if not tag_filters:
        return True
    tags = tags or {}
    return all(str(tags.get(key, "")).lower() == str(value).lower() for key, value in tag_filters.items())


def _is_accessible_tag(tags: dict | None) -> bool:
    if not tags:
        return True
    access = str(tags.get("access") or "").strip().lower()
    if not access:
        return True
    return access not in {"private", "no", "restricted", "military"}


def human_interference(lat: float, lon: float, tag_filters: dict[str, str] | None = None, prefer_accessible: bool = True) -> tuple[str, bool, int, bool]:
    radius = 1200
    tag_filters = tag_filters or {}
    filter_parts = []
    for key, value in tag_filters.items():
        if value in (None, "", "*"):
            filter_parts.append(f'["{key}"]')
        else:
            filter_parts.append(f'["{key}"="{value}"]')
    tag_clause = "".join(filter_parts)
    access_clause = '["access"~"^(yes|permissive|public|destination|customers|permit|unknown)$"]' if prefer_accessible else ""
    query = f'[out:json][timeout:6];(way["building"]{tag_clause}{access_clause}(around:{radius},{lat},{lon});way["highway"]{tag_clause}{access_clause}(around:{radius},{lat},{lon});node["place"]{tag_clause}{access_clause}(around:{radius},{lat},{lon}););out count;'
    url = "https://overpass-api.de/api/interpreter?data=" + urllib.parse.quote(query)
    data = _http_json(url, timeout=7.0)
    if data is None:
        h = int(hashlib.sha1(f"osm:{lat:.4f},{lon:.4f}".encode()).hexdigest()[:6], 16)
        bucket = h % 10
        if bucket <= 5:
            level, isolated, count = "low", True, h % 4
        elif bucket <= 8:
            level, isolated, count = "medium", False, 6 + (h % 30)
        else:
            level, isolated, count = "high", False, 45 + (h % 60)
        return (level, isolated, count, False)

    try:
        elements = data.get("elements") or []
        count = 0
        for element in elements:
            tags = element.get("tags") or {}
            if not _matches_tag_filters(tags, tag_filters):
                continue
            if prefer_accessible and not _is_accessible_tag(tags):
                continue
            count += 1
    except Exception:
        count = 0

    if count == 0:
        return ("low", True, 0, True)
    if count <= 5:
        return ("low", True, count, True)
    if count <= 40:
        return ("medium", False, count, True)
    return ("high", False, count, True)


def fetch_nasa_power(lat: float, lon: float) -> tuple[dict | None, bool]:
    params = urllib.parse.urlencode({
        "parameters": "T2M,T2M_MIN,T2M_MAX,PRECTOTCORR,RH2M,WS2M,ALLSKY_SFC_SW_DWN",
        "community": "RE",
        "longitude": f"{lon:.5f}",
        "latitude": f"{lat:.5f}",
        "format": "JSON",
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
            if name in ("clay", "sand", "silt"):
                return v / 10.0
            if name == "soc":
                return v / 10.0
            if name == "bdod":
                return v / 100.0
            if name == "phh2o":
                return v / 10.0
            return v

        out = {k: conv(k, v) for k, v in out.items()}
        ok = bool(out)
        return (out if ok else None, ok)
    except Exception:
        return (None, False)


def local_climate(lat: float, lon: float, earth_filters: dict[str, str]) -> dict:
    al = abs(lat)
    if al >= 66:
        climate = "polar"
        t2m, tmin, tmax, prec, rh = -12.0, -30.0, 5.0, 0.7, 70.0
    elif al <= 23:
        climate = "arid"
        t2m, tmin, tmax, prec, rh = 24.0, 10.0, 38.0, 0.4, 35.0
    else:
        climate = "temperate"
        t2m, tmin, tmax, prec, rh = 15.0, 4.0, 27.0, 2.0, 60.0
    if "climate" in earth_filters:
        climate = earth_filters["climate"]
        if climate == "arid":
            t2m, tmin, tmax, prec, rh = 25.0, 12.0, 39.0, 0.3, 30.0
        elif climate == "polar":
            t2m, tmin, tmax, prec, rh = -10.0, -28.0, 6.0, 0.8, 72.0
        else:
            t2m, tmin, tmax, prec, rh = 16.0, 5.0, 28.0, 2.2, 58.0
    h = int(hashlib.sha1(f"clim:{lat:.4f},{lon:.4f}".encode()).hexdigest()[:8], 16)
    t2m += ((h % 41) - 20) / 10.0
    tmin += (((h >> 6) % 41) - 20) / 10.0
    tmax += (((h >> 12) % 41) - 20) / 10.0
    prec = max(0.05, prec + (((h >> 18) % 31) - 15) / 100.0)
    rh = min(98.0, max(10.0, rh + (((h >> 23) % 21) - 10)))
    return {"T2M": t2m, "T2M_MIN": tmin, "T2M_MAX": tmax, "PRECTOTCORR": prec, "RH2M": rh, "WS2M": 3.5, "ALLSKY_SFC_SW_DWN": 4.5, "_climate": climate}


def local_elevation(lat: float, lon: float, earth_filters: dict[str, str]) -> float:
    al = abs(lat)
    base = 1400.0 if al > 15 else 300.0
    if "elevation" in earth_filters:
        if earth_filters["elevation"] == "low":
            base = 200.0
        elif earth_filters["elevation"] == "medium":
            base = 1200.0
        else:
            base = 2800.0
    h = int(hashlib.sha1(f"elev:{lat:.4f},{lon:.4f}".encode()).hexdigest()[:6], 16)
    return round(base + (h % 500) - 250, 1)


def local_soil(lat: float, lon: float, power: dict, earth_filters: dict[str, str]) -> dict:
    t = power.get("T2M", 15.0)
    if "soil" in earth_filters:
        s = earth_filters["soil"]
    else:
        if t < 0:
            s = "ice"
        elif (power.get("PRECTOTCORR", 1.0) * 365) < 350:
            s = "saline"
        else:
            s = "sandy"
    h = int(hashlib.sha1(f"soil:{lat:.4f},{lon:.4f}".encode()).hexdigest()[:8], 16)

    def v(base, span, shift=0):
        return round(base + (((h >> shift) % (span * 2 + 1)) - span), 2)

    if s == "sandy":
        return {"clay": v(8.0, 4, 0), "sand": v(72.0, 6, 3), "silt": v(20.0, 5, 6), "soc": v(6.0, 3, 9), "bdod": v(1.45, 0.1, 12), "phh2o": v(7.2, 0.4, 15), "_type": "Estimated sandy soil"}
    if s == "saline":
        return {"clay": v(18.0, 5, 0), "sand": v(40.0, 6, 3), "silt": v(42.0, 6, 6), "soc": v(3.0, 2, 9), "bdod": v(1.35, 0.1, 12), "phh2o": v(8.1, 0.3, 15), "_type": "Estimated saline/evaporitic soil"}
    if s == "ice":
        return {"clay": v(10.0, 4, 0), "sand": v(35.0, 6, 3), "silt": v(55.0, 6, 6), "soc": v(12.0, 4, 9), "bdod": v(0.9, 0.08, 12), "phh2o": v(6.2, 0.4, 15), "_type": "Estimated cryosol/permafrost"}
    if s == "basaltic":
        return {"clay": v(22.0, 5, 0), "sand": v(38.0, 6, 3), "silt": v(40.0, 6, 6), "soc": v(9.0, 3, 9), "bdod": v(1.25, 0.1, 12), "phh2o": v(6.8, 0.4, 15), "_type": "Estimated basalt-derived soil"}
    return {"clay": v(20.0, 5, 0), "sand": v(45.0, 6, 3), "silt": v(35.0, 6, 6), "soc": v(8.0, 3, 9), "bdod": v(1.3, 0.1, 12), "phh2o": v(7.0, 0.4, 15), "_type": "Estimated ferric/mixed soil"}


def aridity_index(precip_mm_day: float | None, t2m_c: float | None) -> float | None:
    if precip_mm_day is None or t2m_c is None:
        return None
    p_year = precip_mm_day * 365.0
    return p_year / (t2m_c + 10.0) if (t2m_c + 10.0) != 0 else None
